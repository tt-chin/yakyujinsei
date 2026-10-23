# 野球人生｜CI Linux Full 平行化計畫書

**文件狀態：OWNER_APPROVED（2026-10-23） / CI_DISPATCH_PASS（PR → `dev` 待提出；→ `main` PR 自動 Full 未驗證）**
**§9（依耗時平衡分批）：DRAFT（2026-10-24），未核准**
**建立日期：2026-10-22**
**對象：repo 擁有者審閱。核准前不修改 workflow。**

## 1. 目的

GitHub Actions 的 Full（`workflow_dispatch` mode=`full`，以及 → `main` 的 PR）目前在單一 job 內依序執行 8 批，一次約 59 分鐘。改為 8 批平行執行，縮短等待時間；測試內容、入口、旗標、timeout、斷言、歷史基準、嚴格彙整條件皆不變。

不在範圍：
- 不改 Quick／audit／`linux-smoke` 的內容與觸發條件。
- 不改 `push`／`pull_request`／`workflow_dispatch` 的觸發分支與 `paths-ignore`。
- 不改 `scripts/ci-full-batches.mjs` 的分批方式（依入口數平分，`splitIds`）與 `aggregate` 的檢查（見 §7-2，另議）。
- 不改 `publish-site.yml`、Cloudflare、本番同步。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC（AGENTS §9.3：開發工具變更）。

## 2. 現況（2026-10-22 唯讀確認）

- `.github/workflows/test.yml` 只有一個 job `tests`（`ubuntu-24.04`、`timeout-minutes: 120`）。Full 時依序執行：`ci-full-batches.mjs plan` → `run 1`～`run 8`（每批後立即上傳 `tests-full-<run_id>-<attempt>-batch-<N>`）→ `aggregate` → 上傳 `tests-<event>-<run_id>-<attempt>`。
- `scripts/check-workflow.mjs` 以 YAML 解析驗證上述**單一 job、8 個依序步驟**的結構（`workflow.jobs.tests`、步驟順序、各上傳名稱與 path）。
- `aggregate` 檢查：plan hash、`head`／`runId`／`runAttempt` 一致；各批 `summary.json` 的 `sourceFingerprint`／Node／平台／版本／基準一致；瀏覽器版本一致；入口不重複不缺漏；`reused=0`；每個 log 位於該批目錄內且 SHA256 相符。
- `run N` 以 `--baseline=<plan.baseline>` 執行，基準由 plan 固定，不會在各批重新解析 `origin/main`。
- Branch protection：`main`、`dev` 皆無 branch protection，`main` 無適用的 ruleset（2026-10-22 以 GitHub 頁面確認）。因此 job 名稱變更不影響必要檢查。
- Repo 為 **public**。

### 2.1 上次 CI Full 實測（Run 39260159042，Tests #49，`2a11a64`，82 入口）

依 job log 時間戳：

| 段落 | 耗時 |
|---|---|
| 準備（Set up job、checkout、setup-node、Playwright＋Chromium 安裝） | 52 秒 |
| batch 1 | 5 秒 |
| batch 2 | 9 分 20 秒 |
| batch 3 | 7 分 41 秒 |
| batch 4 | **19 分 16 秒** |
| batch 5 | 11 分 01 秒 |
| batch 6 | 21 秒 |
| batch 7 | 4 分 35 秒 |
| batch 8 | 5 分 14 秒 |
| 各批 artifact 上傳 | 每次 1～7 秒 |
| 合計 | 58 分 48 秒 |

現在為 84 入口，分批組成會略有不同。

## 3. 設計

### 3.1 Job 構成

| job | 條件 | 內容 |
|---|---|---|
| `tests` | 非 Full | 現行 Quick／audit／`linux-smoke` 步驟不變；移除 Full 相關步驟 |
| `full-plan` | Full | checkout（`fetch-depth: 0`）、setup-node、安裝 Playwright（`check-workflow.mjs` 使用其 YAML 解析器）、`check-workflow.mjs`、`ci-full-batches.mjs plan`，上傳 `plan.json` |
| `full-batch` | `needs: full-plan`；matrix `batch: [1..8]`、`fail-fast: false` | checkout、setup-node、Playwright＋Chromium 安裝（與現行相同）、下載 `plan.json`、`ci-full-batches.mjs run ${{ matrix.batch }}`、上傳 `tests-full-<run_id>-<attempt>-batch-<N>`（名稱與 path 同現行） |
| `full-aggregate` | `needs: [full-plan, full-batch]`；`always() && needs.full-plan.result == 'success'` | checkout、setup-node、下載 `plan.json` 與 8 批 artifact 至 `test-results/ci-full/`、`ci-full-batches.mjs aggregate`、上傳彙整結果 |

- Full 判定：`github.event_name == 'pull_request' || inputs.mode == 'full'`（與現行 `TEST_MODE` 的推導等價）。job 層級的 `if` 不能讀 job 的 `env`，故以此運算式寫在各 job。
- `runs-on: ubuntu-24.04`、Node `24.15.0`、`playwright@1.62.1`、`permissions: contents: read`、workflow 層級 `concurrency` 皆沿用。
- 各 job 的 `timeout-minutes` 沿用 120（不另行縮短；縮短屬另議）。

### 3.2 `aggregate` 檢查在多台 runner 上的成立條件

`scripts/ci-full-batches.mjs` 預計**不修改**。逐項確認：

| 檢查 | 多 job 時 |
|---|---|
| `head` | 各 job 皆 checkout 同一事件 SHA；`plan` 另檢查 `GITHUB_SHA` |
| `runId`／`runAttempt` | 同一 run 內各 job 相同 |
| plan hash | 各 job 讀同一份下載的 `plan.json` |
| `sourceFingerprint`／Node／平台／版本／基準 | 同 SHA、同固定版本；基準由 `--baseline` 傳入 |
| 瀏覽器版本 | 各 job 安裝同一版 Playwright（1.62.1）對應的 Chromium |
| log 路徑與 SHA256 | GitHub-hosted runner 的工作目錄固定（`/home/runner/work/<repo>/<repo>`），artifact 下載回同一相對位置後絕對路徑一致；log 本身在 artifact 內 |

以上為讀程式碼的推論，須以 §5 的實際 Run 驗證。若不成立，停止並回報，不放寬 `aggregate` 的檢查。

### 3.3 新增的 action

- 需新增 `actions/download-artifact`（GitHub 官方）。比照既有 action，以完整 commit SHA 固定，版本須與 `actions/upload-artifact` v7 相容；SHA 於實作時自官方 release 確認後寫入，此處不預填。
- 不新增 npm 依賴。

### 3.4 重跑的限制

`plan.json` 記錄 `runAttempt`，artifact 名稱亦含 attempt。若使用「Re-run failed jobs」，重跑的 batch 會是新的 attempt，與 plan 不一致而失敗（`aggregate` 拒絕混用 attempt 的結果，此為現行的設計意圖）。重跑 Full 一律使用「**Re-run all jobs**」。此點寫入 `scripts/TESTING.md`。

## 4. 變更檔案

1. `.github/workflows/test.yml`：依 §3.1 拆分 job。
2. `scripts/check-workflow.mjs`：Full 結構的斷言改為驗證新構成（`full-plan`／`full-batch` matrix 1～8、`fail-fast: false`／`full-aggregate` 的 `needs` 與 `if`、各批上傳名稱與 path、`tests` job 排除 Full、各 job 的 runner／Node／Playwright／`fetch-depth`）。其餘斷言（觸發條件、`paths-ignore`、dispatch 選項、權限、無部署指令）不變、不放寬。結尾訊息 `sequential Full 8 batches` 改為平行的描述。
3. `scripts/TESTING.md`：第 5 行 CI Full 流程描述改為平行 job，並加入 §3.4 的重跑限制。

`scripts/ci-full-batches.mjs`、`scripts/ci-full-batches.test.mjs`、`scripts/test.mjs`、`scripts/test-manifest.mjs` 預計不修改。

## 5. 驗證

分類：R1 相當（CI 設定，不接觸遊戲程式）。AGENTS §6.2：workflow 變更須核准，並執行 `node scripts/check-workflow.mjs`。

本機：
1. `node scripts/check-workflow.mjs --playwright=<外部 Playwright>` PASS。
2. `node scripts/ci-full-batches.test.mjs` PASS（確認未受影響）。
3. 負控制：把 matrix 改為 7 批、刪除一個上傳 path、讓 `tests` job 在 Full 時執行，各自確認 `check-workflow.mjs` FAIL（暫時修改，不 commit）。

GitHub（須擁有者核准；PR → `dev` 不觸發 CI，故以 `workflow_dispatch` 在作業分支執行）：
4. mode=`full`：`full-aggregate` 輸出 `{"status":"PASS","expected":<入口數>,"acceptedPass":<入口數>,"issues":[]}`；8 批 artifact 與彙整 artifact 皆上傳；記錄 wall time 與各 job 耗時。
5. mode=`quick`：`tests` job 照常執行、Full 系 job 皆 skipped。
6. 未驗證（記錄即可）：→ `main` PR 自動觸發的 Full，於下次發布 PR 時確認。

## 6. 時間與費用估計（依 §2.1 推算，未驗證）

| | 現行 | 平行化後 |
|---|---|---|
| wall time | 約 59 分鐘 | 約 23 分鐘（batch 4 約 20 分＋準備＋前後兩個小 job；不含排隊） |
| runner 分鐘合計 | 約 59 分鐘 | 約 73 分鐘（每批多一次準備，且每個 job 各自進位到整分鐘） |
| 費用 | 0 | 0 |

- 費用：repo 為 public，GitHub-hosted 標準 runner 對 public repo 免費，分鐘數增加不產生費用。若日後改為 private，則改依帳號方案的分鐘額度計算（屆時約多 14 分鐘／次）。
- 同時執行：8 個 job 同時執行，未超過 GitHub Free 的同時 job 上限（20）。
- Quick（每次 `dev` push）不受影響。

## 7. 擁有者待決

1. 是否核准依本計畫修改 `test.yml`、`check-workflow.mjs`、`TESTING.md`。
2. 瓶頸：`splitIds` 依入口數平分，batch 4 單批約 20 分鐘，決定平行後的 wall time。若改為依耗時平衡分批，預估 wall time 可再降至約 12～13 分鐘，但須修改 `ci-full-batches.mjs` 與其測試；**本計畫不含**，是否另立項目請決定。
3. 是否核准新增 `actions/download-artifact`（SHA 固定）。
4. 是否核准在作業分支以 `workflow_dispatch` 執行 §5-4、§5-5。
5. 作業分支名稱 `ci/full-matrix`（自 `origin/dev`），以 PR 併入 `dev`；`main` 依 AGENTS §10 另行反映。BACKLOG 是否另立項目追蹤。

- 擁有者決定（2026-10-23）：核准 1、3、4、5。2 不含於本計畫，另立 BACKLOG `CI-FULL-BALANCE-01`（`PROPOSED / NOT_APPROVED`），待平行化後首次 CI Full 的各 job 實測耗時再決定。

## 8. 實作紀錄（2026-10-23，分支 `ci/full-matrix`，自 `origin/dev` `4036e87`）

- `actions/download-artifact`：v8.0.2（`9000827ccba6bdab643e8b6fd33ac0654aef8333`，2026-10-07 發布）。v8 與 `upload-artifact` v7 同日（2026-02-26）發布，為對應的直接上傳版本。
- `test.yml`：`tests` job 加 job 層級 `if`（非 Full），既有步驟條件不變，移除 Full 步驟。`full-plan` 只 `npm install` Playwright（YAML 解析器用，不裝 Chromium）。`full-batch` 的安裝步驟與 `tests` 相同。`full-aggregate` 不安裝 Playwright；8 批證據以 `pattern`＋`merge-multiple: true` 下載回 `test-results/ci-full/`（各批 artifact 內的 `plan.json` 內容相同）。彙整 artifact 名稱沿用 `tests-<event>-<run_id>-<attempt>`，path 限 `test-results/ci-full/` 下的 summary／plan／各批 json 與 log。
- 與 §3.1 的差異：各 job 的 `test-results/ci-bootstrap/*.log`（Playwright／Chromium 安裝 log）不收進 artifact（舊單一 job 的彙整 artifact 有收）；`full-batch` 的同內容仍在 job log（`tee`）。收進 artifact 會改變批次 artifact 的根目錄而影響 `merge-multiple` 的下載路徑。reviewer 指出此差異不在 §3；使用者 2026-10-23 接受不收（擁有者另行確認）。`tests` job 上傳 path 中已無法匹配的 3 個 `test-results/ci-full/…` glob 一併刪除。
- `check-workflow.mjs`：改為驗證 4 個 job 的構成、`if`／`needs`／matrix／`fail-fast`、plan 與批次的上傳／下載名稱與 path、步驟順序；其餘斷言不變。新增：所有 `uses` 須以 40 位 commit SHA 固定。
- `TESTING.md`：新增平行執行段落與「Re-run all jobs」限制（第 5 行的入口數敘述不改，避免與 OOP 分支的同行修改衝突）。

| 項目 | 結果 |
|---|---|
| `check-workflow.mjs`（外部 Playwright 1.59.0-alpha 的 YAML 解析器） | PASS |
| 負控制（scratchpad 複本） | matrix 7 批／刪除批次上傳 path／`tests` job 去掉 `if`／aggregate 去掉 `merge-multiple`／aggregate 去掉 `always()`／`full-plan` 改為安裝 Chromium：6 組皆 FAIL |
| reviewer | 無中等以上問題；低 3 件：bootstrap log 不收（接受，見上）、`tests` job 殘留 glob（已刪）、`full-plan` 未斷言不裝 Chromium（已加） |
| `ci-full-batches.test.mjs` | FAIL（`exact 83 entries`：實為 84）。未修改的 `origin/dev` `4036e87` 同樣 FAIL（`4cb4c98` 新增 `npb-farewell.test` 時未同步），與本變更無關；PR #12（4-A）已將其改為 85。本分支不修改 |
| §5-5 `workflow_dispatch` mode=`quick`（Run 39879434936，`b6f71f6`） | success：`tests` 3 分 51 秒；`full-plan`／`full-batch`／`full-aggregate` 皆 skipped |
| §5-4 `workflow_dispatch` mode=`full`（Run 39879968880，Tests #58，`b6f71f6dbe6f90e511334e5ad9e063af9f344fe5`） | success，wall time **21 分 37 秒**（現行 58 分 48 秒）。`full-aggregate`：`{"status":"PASS","expected":84,"acceptedPass":84,"issues":[]}`；8 批 10／11／10／11／10／11／10／11 PASS；artifact 10 個（plan＋8 批＋彙整）。§3.2 的多 runner 前提（log 絕對路徑、plan hash、環境一致）成立 |

各批測試耗時（`summary.json` 的 `seconds`，不含各 job 的準備約 1 分）：

| batch | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| 秒 | 5 | 520 | 384 | **1205** | 550 | 23 | 294 | 321 |

- 瓶頸仍為 batch 4（約 20 分），符合 §6 的預估；後續見 BACKLOG `CI-FULL-BALANCE-01`。
- 未驗證：→ `main` PR 自動觸發的 Full（§5-6）。

## 9. 依耗時平衡分批（`CI-FULL-BALANCE-01`，計畫，2026-10-24）

**狀態：已實作，本機驗證完成（§9.8）；CI dispatch、commit／push／PR 未執行。**

### 9.1 現況（唯讀確認，`origin/dev` `f4a2894`，87 入口）

- `splitIds(ids,count=8)` 依 inventory 順序按入口數切成連續 8 段（10／11×7）。`validatePlan` 要求 `plan.batches.flat()` 與 inventory 順序完全相同（`ci-full-batches.mjs:24–29`）。
- `test.mjs --only=` 依 inventory 順序執行（`test.mjs:23`），`aggregate` 要求各批 `summary.json` 的結果順序與 `plan.batches[i]` 相同；故批內順序須為 inventory 順序。
- `test-manifest.mjs` 已有各入口的 `seconds` 預估（`syntax` 無）。
- 實測（本機 macOS＋Brave 156，2026-10-23 phase 9 Full，`sourceFingerprint` `90a379687e33…`）：87 入口合計 1789 秒；前幾名 `full-power-pitching-e2e` 362、`international-personal-stats-e2e` 253、`bug-act-01-02-e2e` 196、`game-view-dom-e2e` 143、`draft-income-e2e` 135。CI 各批耗時約為本機合計的 1.7–2.0 倍（Tests #58）。

| CI batch | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| 本機合計（秒，現行分批） | 7 | 281 | 217 | **617** | 334 | 16 | 130 | 187 |
| CI #58（秒） | 5 | 520 | 384 | **1205** | 550 | 23 | 294 | 321 |
| CI #65（job，含準備） | 40s | 10m27s | 9m13s | **25m10s** | 12m48s | 1m5s | 5m52s | 18m7s |

### 9.2 試算（本機實測秒數，8 批）

| 分批方式 | 各批（秒） | 最大 |
|---|---|---|
| 現行（入口數） | 7／281／217／617／334／16／130／187 | 617 |
| LPT，權重＝manifest `seconds` | 362／253／125／213／278／234／177／147 | **362** |
| LPT，權重＝本機實測 | 362／253／196／196／196／196／196／196 | **362** |
| LPT 實測，10／12 批 | — | 362 |

- 兩種權重的最大值相同：`full-power-pitching-e2e` 單獨一批即為下限，增加批數無效。
- 結論：使用既有 manifest `seconds`，不新增實測耗時表；manifest 預估雖與實測有落差（如 `smallschool-c-e2e` 600／125），不影響最大批。
- 預估：CI Full 最大批由約 1205 秒降至 `full-power-pitching-e2e` 單獨的耗時（本機 362 秒×1.7–2.0 ≈ 620–720 秒），wall time 約 13 分（現行 21–26 分）。**未實測。**

### 9.3 設計

- `splitIds(ids,count=8,weightOf)`：LPT（最長處理時間優先）。依權重由大到小（同值依 inventory 順序）逐一放入目前合計最小的批（同值取編號小者）；完成後各批依 inventory 順序排序。結果為決定性。
- 權重：`plan` 時由 inventory 取 `seconds`；無值者（`syntax`、新增入口）用固定預設值 5。
- `validatePlan`：「`batches.flat()` 等於 inventory 順序」改為：每個入口恰出現一次（無缺漏、無重複）、各批非空且批內為 inventory 順序、批數 8。其餘（`plan.mode`、aggregate 的所有檢查）不變。
- 不變：workflow（matrix 1–8）、`check-workflow.mjs`、Runner、測試旗標、timeout、斷言、歷史基準、`aggregate`、artifact 名稱與 path。
- 分類：R1 相當（CI 工具，不接遊戲）。風險：入口在不同 runner 上的組合改變；各入口為獨立 process，批內依序執行，記憶體不累加。

### 9.4 測試變更（需揭露）

- `ci-full-batches.test.mjs:46–48`「exact 87 entries, eight ordered disjoint batches」：入口數 87 維持；各批長度 `[10,11,…]` 與「新入口附加於末尾」的斷言改為：每個入口恰一次、批內 inventory 順序、決定性（兩次結果相同）、無權重入口亦被分配、最大批權重不超過「最大單一權重」與「總權重／8＋最大單一權重」中的較大者（LPT 的保證）。`splitIds(['same','same'],1)` throw 維持。
- 其餘 fixture 透過 `splitIds(ids)` 產生 plan，不需修改。
- `TESTING.md:5`「依原 inventory 順序拆成8批（…每批10～11個）」改為依 manifest 耗時平衡的說明。

### 9.5 驗證

1. `node scripts/ci-full-batches.test.mjs`；`node scripts/check-workflow.mjs --playwright=<外部模組>`（workflow 不變，確認仍 PASS）；`check-syntax`。
2. 負控制：①`validatePlan` 對缺漏、重複、批內順序錯誤、批數不足皆 throw；②LPT 改為依入口數平分時，最大批權重斷言 FAIL。
3. 本機：`node scripts/ci-full-batches.mjs plan --output=<scratchpad>` 產生 plan，確認 87 入口與各批權重合計。
4. CI：分支 `ci/full-balance` 以 `workflow_dispatch` mode=`full` 執行一次；驗收為 aggregate `{"status":"PASS","expected":87,...}`、0 FAIL／SKIP／BLOCKED，並記錄各 batch 秒數與 wall time。Quick 不受影響，不另跑。
5. reviewer：diff 一次。

### 9.6 交付

- 分支 `ci/full-balance`（自 `origin/dev` `f4a2894`）。commit：文件（§9、BACKLOG）→ 實作（含測試、`TESTING.md`）→ 結果文件。PR → `dev`；commit／push／PR／dispatch 另批。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC（AGENTS §9.3）。

### 9.7 待決

1. 權重來源：manifest `seconds`（建議，§9.2）或另建實測耗時表。
2. 批數：維持 8（建議；增加無效，§9.2）。
3. 之後的瓶頸 `full-power-pitching-e2e`（20 個完整生涯，manifest 900 秒）是否另案拆分：本計畫不含。

使用者決定（2026-10-24）：1 採 manifest `seconds`；2 維持 8 批；3 不含於本計畫。計畫文件 commit 批准；實作於新 session 進行（實作前仍須明確批准）。

### 9.8 實作紀錄（2026-10-24，分支 `ci/full-balance`，HEAD `a09e1bb`，未 commit）

- `ci-full-batches.mjs`：新增 `fullSeconds()`（Full 入口 id→manifest `seconds`）與 `DEFAULT_SECONDS=5`；`splitIds(ids,count=8,weightOf)` 依 §9.3 實作 LPT（未傳 `weightOf` 時全部為預設值，即依序輪流分配）；`plan` 傳入 `fullSeconds()`；`validatePlan` 依 §9.3 改寫。`run`／`aggregate` 只讀 `plan.json`，不使用權重。
- 與 §9.3「aggregate 不變」的差異（使用者 2026-10-24 核准）：`aggregate` 回傳前將 `results` 依 inventory 順序排序（1 行）。原因：各批串接後不再是 inventory 順序；維持 `summary.json` 既有順序，並使 `ci-full-batches.test.mjs` 的 `r.results` 順序斷言不需修改。workflow 與其他程式不讀取此順序。
- 與 §9.4 的差異：平衡斷言不用「最大批 ≤ max（最大單一權重，總權重／8＋最大單一權重）」——以 manifest 權重計，現行依入口數分批最大 1442 ＜ 上限 1507，此斷言無法讓負控制 FAIL。改為 LPT 必然成立的性質：「多入口批的合計減去其最輕入口 ≤ 最輕批的合計」（可推出原上限）。
- 測試追加（reviewer 指出，使用者核准）：`inventory omissions/order changes rejected` 增加「批內兩入口對調 → `validatePlan` throw」；原本只有 `pop()`，在集合比較即 throw，不經過批內順序檢查。
- `TESTING.md:5`：改為依 manifest `seconds` 以 LPT 平衡分批的說明。

| 項目 | 結果 |
|---|---|
| `ci-full-batches.test.mjs`（macOS） | 32 項：31 PASS、1 SKIP（Linux 限定 alias 測試） |
| `check-syntax`／`check-workflow.mjs`（外部 Playwright 1.59.0-alpha） | PASS／PASS（exit 0） |
| 本機 `plan` | 87 入口、無重複；各批 manifest 秒數 900／600／600／552／552／551／550／551（入口數 1／1／1／13／16／18／14／23），最大批為 `full-power-pitching-e2e` 單獨 |
| 負控制①（`validatePlan`） | 缺漏／重複／批內順序錯誤／批數不足／空批：5 組皆 throw |
| 負控制②（scratchpad 複本，`splitIds` 改回依入口數平分） | 平衡斷言 FAIL（`Batch 2 unbalanced`） |
| 負控制③（scratchpad 複本，移除批內順序檢查） | 對調案例 FAIL（`Missing expected exception`） |
| reviewer | 實作無問題；中 1 件（批內順序檢查無常駐測試，已補） |

- 未執行：§9.5-4 CI `workflow_dispatch` mode=`full`（各批秒數與 wall time 未實測）；commit／push／PR。

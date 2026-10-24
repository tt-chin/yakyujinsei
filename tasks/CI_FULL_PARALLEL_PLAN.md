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

**狀態：已實作（`cdf0a25`），CI Full PASS（§9.8）；wall time 未改善（安裝慢，見 §10），PR 暫停至 §10 完成後一併驗證。**

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

- commit：`cdf0a25`（實作）、`5b57f6e`（本節）；已 push `ci/full-balance`，未開 PR。

§9.5-4 CI（Run 40038325238，Tests #68，`workflow_dispatch` mode=`full`，`5b57f6e89b2159b65348fdb62aecc6ab3746ce7b`）：success。`full-aggregate`：`{"status":"PASS","expected":87,"acceptedPass":87,"issues":[]}`；8 批皆 PASS，0 FAIL／SKIP／BLOCKED；artifact 10 個。

| batch | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| 入口數 | 1 | 1 | 1 | 13 | 16 | 18 | 14 | 23 |
| 測試秒數（`summary.json`） | **809** | 545 | 311 | 355 | 515 | 231 | 348 | 247 |
| 安裝步驟 | **7分12秒** | 23秒 | 25秒 | 7分10秒 | 8分05秒 | 25秒 | 24秒 | 34秒 |
| job 合計 | — | 9分43秒 | 5分48秒 | 13分24秒 | 17分04秒 | 4分31秒 | 6分27秒 | 4分57秒 |

- 最大批測試秒數 1205 → 809（`full-power-pitching-e2e` 單獨；本機 362 秒的 2.2 倍，高於 §9.2 預估 620–720 秒）。
- wall time **21分47秒**（#58：21分37秒），未改善。原因：batch 1／4／5 的 `playwright install --with-deps chromium` 中 apt 下載 `Fetched 25.9 MB in 6min 47s (63.7 kB/s)`（`azure.archive.ubuntu.com`；其他批 1 秒），恰落在最長的 batch 1。npm 安裝約 1 秒、瀏覽器下載約 10 秒，正常。
- 安裝正常時 wall time 推算約 15 分（batch 2 的準備開銷約 40 秒），**未實測**。由 §10（`CI-ENV-PIN-01`）處理安裝後一併驗證。

## 10. CI 環境鎖定：Playwright container（`CI-ENV-PIN-01`，計畫，2026-10-24）

**狀態：已實作（`e12a6f1`、`ec54253`），CI Full／Quick／linux-smoke 皆 PASS（§10.6）；PR 未建立。**

### 10.1 問題

- `tests`／`full-batch` 每次以 `playwright install --with-deps chromium` 自 Ubuntu apt 鏡像安裝系統套件。鏡像偶發極慢：Tests #66 Quick `Fetched 20.0 MB in 11min 51s`；Tests #68 Full 8 批中 3 批 `Fetched 25.9 MB in 6min 47s`（§9.8），使 §9 的分批收益被抵消。
- apt 套件取當下最新版（版本漂移）。
- GitHub Actions 各 job 為獨立 VM，無法繼承前一 job 的安裝；artifact 轉送只能帶 npm 模組與瀏覽器，帶不走 apt 安裝至 `/usr` 的系統套件與字型；apt 快取不保證命中亦不提供完整性（BACKLOG 已不採）。

### 10.2 設計

- `tests`、`full-batch` 加：
  ```yaml
  container:
    image: mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e
    options: --ipc=host
  ```
  digest 為 multi-arch index（2026-10-24 自 MCR registry 取得，含 amd64 `sha256:c091b21d…`、arm64 `sha256:941cc91e…`）。image 內含 Playwright 1.62.1 的系統套件、字型與瀏覽器。
- 保留 `setup-node` 24.15.0 與 `npm install … playwright@1.62.1`（Node 版本不依 image 內建）。`install --with-deps chromium` 改為 `install chromium`（無 `--with-deps`）；預期瀏覽器已存在而不下載，以 log 記錄實際行為。
- 加 `git config --global --add safe.directory "$GITHUB_WORKSPACE"`（container 內以 root 執行，工作目錄擁有者不同）。實測**必要**：`actions/checkout` 的設定不延續到後續步驟，Run 40043897770 的 `full-aggregate` 缺此設定即 `fatal: detected dubious ownership`（§10.6）；三個 container job 皆設定，`check-workflow` 斷言之。
- `full-plan` 不需瀏覽器，維持 host，不變。`full-aggregate` 亦使用同一 container（reviewer 指出、使用者 2026-10-24 核准）：各批 `summary.json` 記錄 log 絕對路徑（`test.mjs:24,58`），container 內為 `/__w/…`、host 為 `/home/runner/work/…`，aggregate 在 host 會以 `Log outside batch` 拒絕全部批次；同 container 可維持 §8 的「各 runner log 絕對路徑一致」前提，不改 `ci-full-batches.mjs`。
- 不變：Runner、測試旗標、timeout、斷言、歷史基準、artifact 名稱與 path、`ci-full-batches.mjs`。
- 分類：R2（CI 執行環境；不接遊戲本體）。

### 10.3 `check-workflow.mjs` 變更

- `tests`／`full-batch`：`container.image` 須符合 `mcr.microsoft.com/playwright:v<版本>-noble@sha256:<64 hex>`，`<版本>` 須等於 `npm install` 步驟的 `playwright@<版本>`；`container.options` 須恰為 `--ipc=host`（不允許後續 `--ipc=` 覆寫）。
- `full-aggregate`：`container` 須與 `full-batch` 完全相同。
- 所有 job 不得含 `--with-deps`（取代現行「`tests`／`full-batch` 須含 `--with-deps chromium`」的斷言）。
- `full-plan` 不得有 `container`。
- 其餘斷言不變。

### 10.4 驗證

1. 本機 `node scripts/check-workflow.mjs --playwright=<外部模組>` PASS。負控制（scratchpad 複本）：image 只有 tag 無 digest／image 版本與 npm 不一致／缺 `--ipc=host`／`--ipc=host --ipc=private`／恢復 `--with-deps`／`full-plan` 加 container／`full-aggregate` 無 container 或 image 不同：各須 FAIL。
2. reviewer：diff 一次。
3. CI（分支 `ci/env-pin`，自 `ci/full-balance` `5b57f6e`，含 §9）：依序 dispatch `full`、`quick`、`linux-smoke` 各一次（同分支 dispatch 會互相取消，不連發）。
   - Full：aggregate `{"status":"PASS","expected":87,...}`、0 FAIL／SKIP／BLOCKED；各批 browser／node metadata 一致（aggregate 檢查）。
   - Quick：PASS（`check-workflow` 於 container 內通過）。
   - linux-smoke：PASS（`/tmp` alias 與 socket 路徑在 container 內可用）。
   - 記錄：image 拉取時間（`Initialize containers`）、安裝步驟時間與是否下載瀏覽器、各批秒數、wall time，並與 §9.8 比較。
4. 未確認（待 CI 證明）：image 拉取時間（推估 1 分內）、root 執行下 git／artifact 路徑、image 環境下全部 87 入口是否 PASS（已確認 `replay-share-theme-e2e` 的 PNG 比對為同次執行內 baseline 對目前版本，不依存檔圖片）。

### 10.5 交付

- 分支 `ci/env-pin`。commit：文件（§9.8 CI 結果、§10、BACKLOG）→ 實作（`test.yml`、`check-workflow.mjs`）→ 結果文件。
- PR：`ci/full-balance` 與 `ci/env-pin` 的 PR 方式（一併或依序）於 CI 驗證後決定；push／dispatch／PR 各另批。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC（AGENTS §9.3）。

### 10.6 實作與 CI 結果（2026-10-24，分支 `ci/env-pin`）

- commit：`8d67a87`（§9.8 CI 結果、§10 計畫、BACKLOG）→ `3b21c95`（§10 修訂：aggregate 同 container）→ `e12a6f1`（實作）→ `ec54253`（aggregate 補 `safe.directory`）。
- reviewer：critical 1 件（aggregate 在 host 時 log 絕對路徑不一致，Full 必 FAIL）→ 採 A：aggregate 同 container（使用者核准）；low 3 件（`--ipc=` 覆寫、npm 版本抽取範圍、`safe.directory` 多餘）前二件已修，第三件經實測**判斷錯誤**（見下）。
- 本機：`check-workflow`（外部 Playwright 1.59.0-alpha）PASS；負控制 9 組皆 FAIL：image 無 digest／image 與 npm 版本不一致／缺 `--ipc=host`／`--ipc=host --ipc=private`／恢復 `--with-deps`／`full-plan` 加 container／`full-aggregate` 無 container／`full-aggregate` image 不同／`full-aggregate` 缺 `safe.directory`。

| Run | commit | mode | 結果 |
|---|---|---|---|
| 40043897770（#69） | `e12a6f1` | full | **failure**：8 批 87 入口皆 PASS，`full-aggregate` 於 `git rev-parse HEAD` 失敗（`dubious ownership`；`safe.directory` 只設在安裝步驟，aggregate 無該步驟）→ `ec54253` 修正 |
| 40046088278 | `ec54253` | full | success，wall time **18分43秒**；`{"status":"PASS","expected":87,"acceptedPass":87,"issues":[]}` |
| 40047702299 | `ec54253` | quick | success，3分51秒；67 PASS／0 FAIL；container 內 `check-workflow` PASS |
| 40048126586 | `ec54253` | linux-smoke | success，1分11秒；`ci-full-batches.test` 32／32 PASS（含 Linux alias 測試）；`linux-chromium-smoke` PASS |

各批（`summary.json` 測試秒數）：

| batch | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| #68（host＋apt，§9.8） | 809 | 545 | 311 | 355 | 515 | 231 | 348 | 247 |
| #69（container，`e12a6f1`） | 976 | 392 | 241 | 454 | 422 | 229 | 228 | 212 |
| 40046088278（container，`ec54253`） | 990 | 435 | 197 | 293 | 622 | 234 | 272 | 198 |

- 安裝步驟：#68 為 23秒～8分05秒（apt 鏡像）；container 下 8 批皆 **2 秒**，`install chromium` 無下載輸出。image 拉取＋container 初始化 29–42 秒（#69 各批；aggregate 36 秒）。
- wall time：#68 21分47秒 → 18分24秒（#69）／18分43秒。安裝變動已消除；剩餘瓶頸為 batch 1 `full-power-pitching-e2e`（CI 809–990 秒，跨 run 差異約 ±10%），後續見 BACKLOG `CI-PITCHING-E2E-01`。
- 測試秒數在 runner 間差異明顯（如 batch 5：515／422／622），單次比較不足以判定 container 對測試本身速度的影響。
- 未驗證：→ `main` PR 自動觸發的 Full、`dev` push 的 Quick（事件條件未變）。

## 11. `full-power-pitching-e2e` 依 seed 拆分（`CI-PITCHING-E2E-01`，計畫，2026-10-24）

**狀態：已實作（`50139d0`），CI Full／linux-smoke PASS（§11.6）；PR 待 PR #21 合併後建立。** 方向已由使用者決定（BACKLOG：採②依 seed 拆分）；本節定拆分方式、入口與斷言、manifest `seconds`。基準：`ci/env-pin` `a879da0`（PR #21，可 fast-forward 至 `dev`），分支 `ci/pitching-split`。

### 11.1 現況（唯讀確認）

- `tests/full-power-pitching-e2e.mjs`（52 行，CRLF）：L12–25 為源碼／基準比較（`tjAccrue`／`tjCap`／`phasePre`／`proSeason` 本體、續行呼叫），L38 `harness('full-power-pitching')`，L46 E01 27 案、L47 E03 2 案，L48 `--fixtures-only` 跳過其後；L49 S01-S02 6 案（2 seed×3 投球方式，各 old／now／repeat 3 次生涯）、L50 S03 1 案（4 次生涯）。共 36 案、22 次生涯。
- `scripts/test-manifest.mjs` `inventory()`（L47–62）以 `tests/` 檔案一對一產生入口，未分類檔 `throw`；入口可帶 `args`，`test.mjs:69` 在 full 模式傳入 `e.args`（先例：`display-preferences-e2e` `--only-seed=`、`replay-share-theme-e2e` `--ui-only`）。同一檔多入口無機制。
- 輸出目錄：`stage6-browser.mjs:42` `arg('output')||os.tmpdir()/<harness 名>`，`test.mjs` 不傳 `--output`；同批依序執行時同名 harness 會覆寫 `summary.json`。
- 斷言 87：`scripts/ci-full-batches.test.mjs:46`（標題）、`:49`、`:60`；`:91` 為 86（87−1）。`scripts/TESTING.md:5,7` 散文 87。其他 87（`retirement-hof-*`）無關。`check-workflow.mjs` 無相關。
- `ci-full-batches.mjs` LPT 以 manifest `seconds` 為權重（未設者 `DEFAULT_SECONDS=5`），無入口 ID 寫死。
- `tools/development-b/producer-rename-saved.mjs:7` 預設讀保存的 `…/tmp/full-power-pitching/career-yakyo-test-001-*.json`（歷史證據重分析，可 `--directory=`）；不在自動 profile。

### 11.2 設計

- **選擇 part（測試檔）**：`full-power-pitching-e2e.mjs` 新增 `--part=<fixtures|yakyo-test-001|jp3-pitcher-02>`：
  - `fixtures`：E01＋E03＋S03（S03 為 IF 對照，與 seed 拆分無關，併入最輕組）；
  - `yakyo-test-001`／`jp3-pitcher-02`：僅該 seed 的 S01-S02 3 案；
  - 未指定：與現行相同（36 案）；`--fixtures-only` 行為不變（E01＋E03）。
  - 未知 part 值 `throw`（避免零案 PASS）；L12–25 源碼比較每個 part 都執行（成本小，各入口獨立把關）。
  - harness 名改為 `'full-power-pitching'+(part?'-'+part:'')`，避免同批覆寫；未指定時路徑不變。
- **入口（一檔一入口，不改 `inventory()`）**：新增兩個薄入口檔，僅 `import './full-power-pitching-e2e.mjs';` 與一行說明：
  - `tests/full-power-pitching-yakyo-test-001-e2e.mjs`
  - `tests/full-power-pitching-jp3-pitcher-02-e2e.mjs`
  - part 一律由 manifest `args` 指定（三入口一致，`test.mjs` 報告的 `command` 可見 part）。不採「`inventory()` 支援同檔多入口」：須改共用工具與報告格式，範圍較大。
- **manifest**：
  - `full-power-pitching-e2e`：`args:['--part=fixtures']`，`seconds:180`；
  - `full-power-pitching-yakyo-test-001-e2e`：`args:['--part=yakyo-test-001']`，`seconds:380`；
  - `full-power-pitching-jp3-pitcher-02-e2e`：`args:['--part=jp3-pitcher-02']`，`seconds:350`；
  - 秒數依本機分段（71／151／140 秒，合計 362）按現行 900 等比換算後取整；`reason` 改寫各自案數與生涯數（修正「20」→ 實際 fixtures 29 案＋S03 4 次生涯／各 seed 9 次生涯）。
  - `--legacy-careers` 只清除含 `--ui-only`／`--quick`／`--only-seed=` 的 args（`test.mjs:69`），`--part=` 不受影響。
- **斷言／文件**：`ci-full-batches.test.mjs` 87→89（`:46,49,60`）、86→88（`:91`）；`TESTING.md:5,7` 87→89，`:21` 補 `--part` 與三入口說明。歷史紀錄中的 87 不改。
- 不變：遊戲本體、案內容、每步證據、repeat 重現斷言、基準 SHA、`ci-full-batches.mjs`、`test.mjs`、workflow。
- 分類：R2（測試／CI 工具；不接遊戲本體）。不升 VERSION、不改 CHANGELOG／CURRENT_SPEC（AGENTS §9.3）。

### 11.3 試算（manifest `seconds`，LPT 8 批，未實測）

以 `splitIds` 試算（scratchpad 腳本，`a879da0`）：現行 87 入口最大批 900（`full-power-pitching-e2e` 單獨）；拆分後 89 入口各批 608–609，三個 pitching 入口分入不同批（yakyo 與 jp3 各與他入口同批）。CI 實測倍率 2.2–2.7 推算 yakyo 入口約 330–410 秒；瓶頸預期轉為 `international-personal-stats-e2e` 等（CI 392–545 秒，batch 5 曾 622 秒），Full wall time 約 11–12 分，**未實測**。

### 11.4 驗證

1. 本機（Brave，外部 Playwright）：三入口各自以 `test.mjs full --only=<id>` 執行 PASS；三份 `summary.json` 的 `records[].id` 聯集＝36 案原 ID，無重複、無缺漏（與 `ec54253` 本機整檔 36 案比對）；未指定 part 的直接執行仍為 36 案。
2. 負控制：`--part=unknown` 須 FAIL（throw）；scratchpad 副本中讓某 part 漏一案，聯集比對須 FAIL。
3. `node scripts/ci-full-batches.test.mjs`、`node scripts/test.mjs quick` PASS。
4. CI：分支 `workflow_dispatch` Full（擁有者核准），記錄 89／89、各批秒數、wall time；linux-smoke（含 `ci-full-batches.test`）。
5. reviewer（測試邏輯變更）。

### 11.5 交付與待決

- 依序：本節核准 → 實作（測試檔、兩入口檔、manifest、`ci-full-batches.test.mjs`、`TESTING.md`）→ 本機驗證 → commit → push／dispatch 各另批 → 結果記錄 §11.6、BACKLOG。PR #21 合併後先 rebase 至 `dev`。
- 決定（使用者 2026-10-24，皆照建議）：①S03 歸入 `fixtures` 組；②入口檔命名 `full-power-pitching-<seed>-e2e.mjs`；③manifest 秒數先取等比換算，CI 實測後另案校正。

### 11.6 實作與 CI 結果（2026-10-24，分支 `ci/pitching-split`）

- commit：`fc87173`（§11 計畫、BACKLOG）→ `50139d0`（實作：測試檔 `--part`、兩薄入口、manifest、`ci-full-batches.test.mjs` 87→89／86→88、`TESTING.md`）。
- reviewer：無阻擋；low 1 件（薄入口不帶 `--part` 直接執行會跑全部 36 案）依計畫設計維持現狀（使用者 2026-10-24 決定）。
- 本機（macOS＋Brave，外部 Playwright 1.59.0-alpha）：`test.mjs full --only=` 三入口 3／3 PASS：fixtures 78.7 秒（30 案）、jp3 135.6 秒（3 案）、yakyo 148.0 秒（3 案），合計 363 秒；三份 harness `summary.json` 的 `records[].id` 聯集 36、無重複，與依原迴圈列舉的 36 個 ID 一致（移除一案的負控制可檢出）；`--part=unknown`／`--part=`／`--part=yakyo-test-001 --fixtures-only` 皆 throw（exit 1）；不帶 part 的 `--fixtures-only` 29／29 PASS；`ci-full-batches.test` 31 PASS／1 SKIP（Linux 專用）；Quick 67／67 PASS。不帶參數的整檔 36 案直接執行未實測。

| Run | commit | mode | 結果 |
|---|---|---|---|
| 40055238234（#73） | `50139d0` | full | success，wall time **11分15秒**（前次 18分43秒）；`{"status":"PASS","expected":89,"acceptedPass":89,"issues":[]}` |
| 40056950062（#74） | `50139d0` | linux-smoke | success，約1分；`ci-full-batches.test` 32／32 PASS（含 `exact 89 entries`、Linux alias 測試） |

各批（`summary.json` 測試秒數）：

| batch | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| 40046088278（`ec54253`，§10.6） | 990 | 435 | 197 | 293 | 622 | 234 | 272 | 198 |
| 40055238234（`50139d0`） | 470 | 221 | 468 | 506 | 410 | 537 | 493 | 239 |

- 拆分入口 CI 秒數（本機比）：`full-power-pitching-e2e` 169（2.1倍，batch 7）、`-yakyo-test-001-e2e` 424（2.9倍，batch 4）、`-jp3-pitcher-02-e2e` 325（2.4倍，batch 6）。最大批 537 秒（batch 6），不再由單一入口決定。
- 各批仍不均（221–537 秒）：manifest 預估與 CI 實測偏差，例如 `smallschool-c-e2e` 600→218、`international-personal-stats-e2e` 600→469、`bug-act-01-02-e2e` 500→453（manifest 值為 §9 既有）。依 §11.5③，秒數校正另案，本次不改。
- 未驗證：→ `main` PR 自動觸發的 Full、`dev` push 的 Quick。PR：PR #21 合併後建立 `ci/pitching-split` → `dev`（使用者 2026-10-24 決定）。

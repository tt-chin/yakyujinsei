# D2-CI-ARTIFACT-01 必須保存原件清單（草案，2026-11-28）

依 [開發端決定](DEV_DECISIONS_2026-11-28.md) §2（A 案，使用者核准）：先定「哪些原件必須保存、哪些可由固定來源重新產生」，再談 collector 接入與容量。本檔只是清單草案，**不改 workflow、collector 或測試，也不構成接入授權**。

- 調查基準：`origin/dev` `3885d83baff235a2b230e0caae7af4308ec066b7`。行號以此為準。
- 依據：[保存缺口](../docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md) §3～§7、[G9 保存分層](../docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md) §6、[發布準備](../docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md) §5、`.github/workflows/test.yml`、`scripts/collect-ci-evidence.mjs`。
- 保存缺口文件 :94 指出缺少「Gate→case→raw 檔案依賴映射」，§7.2（:137）要求分類由程式／Gate 證據支撐，不能看檔名猜。本草案的分類依據是下面 §1 的程式事實與附錄的逐入口輸出表，每列附 file:line。

## 1. 程式事實（分類的前提）

1. **判定不讀原始檔。** runner 只以子程序 exit code 判定 PASS／FAIL（`scripts/test.mjs:58`）。各 E2E 在程序內斷言後寫出 JSON／PNG，**沒有任何 E2E 讀回自己的輸出**；唯一讀回自身輸出的是 `test-runner.test`（`runner-contract-*`，`tests/test-runner.test.mjs:12`）與 `scripts/test-browser-progress.mjs`。因此原始檔不是判定的輸入，而是事後追溯與重現的證據。
2. **內容由固定來源產生。** 生涯／S／RNG／Decision 類 JSON 由固定 seed、受測樹與 `git show` 的基準 SHA 產生；牆鐘內容限於 `seconds`、`browserProgress` 時間戳（`tools/test-support/browser-progress.mjs:8`、:13）及 browser／node 版本（`tests/support/stage6-browser.mjs:76`）。多數比較型 E2E 本身就斷言 old／current／repeat 完全一致。
3. **輸出位置有三種。** runner 把 TEMP／TMP／TMPDIR 設為 `<output>/tmp`（`scripts/test.mjs:45-47`），manifest 不傳 `--output`。
   - (a) `tmp/yakyujinsei-*`：符合 CI 上傳 glob。
   - (b) `tmp/<name>`（stage6 harness，`tests/support/stage6-browser.mjs:58`）：**不符合** glob。除文件已列的 4 個目錄外，`hof-retirement-policy`（`tests/hof-retirement-policy-e2e.mjs:30`）是第 5 個。
   - (c) `test-results/<name>`（repo 相對、不在 run 目錄內、跨 run 覆寫）：只有 `summary.json` 偶然符合 `test-results/*/summary.json`，Full 分批完全不收。
4. **PRIVATE_PATH 規則排除 `/home/runner`。** `collect-ci-evidence.mjs:27` 的判定為 `/Users/<name>`、`<drive>:\Users\`、`/home/<非 runner>`。文件中 Quick 3／62、Full 13／81 被拒的數字來自 Windows 本機（保存缺口 :56、:77、:86）；真正 Linux CI 輸出是否觸發仍為 NOT_RUN（:139）。Linux CI 既有 artifact 實測為 0 筆，見 §4-1。

## 2. 分類草案

| # | 類別 | 範圍 | 分類 | 理由 |
|---|---|---|---|---|
| A | runner `summary.json`、各入口 `<id>.log`、Full `plan.json`／batch receipt／aggregate | 每次 run | **必須保存原件** | 判定結果本身；含時間與環境，無法重產。現行已上傳（`test.yml:70-76`、:155-161、:194-205） |
| B | FAIL／BLOCKED／timeout 入口的全部輸出（S、RNG、Decision、Receipt、生涯 JSON、per-case JSON、PNG） | 依入口→目錄對照（附錄） | **必須保存原件** | 失敗可能來自環境或間歇問題（例：SIGSEGV、exit 143 OOM），同 SHA 重跑不保證重現。對應發布準備 §5「失敗case優先保留」 |
| C | 一般回歸測試中 PASS 入口的生涯／S／RNG／Decision／Receipt JSON（含 §1-3 (b) 的 5 個大目錄；正式指定原件除外） | 依入口→目錄對照 | **確認可重產後**：只保存索引（path、size、sha256）＋受驗 head／baseline／browser 版本 | §1-1、§1-2：判定不讀檔，內容由 seed＋樹＋基準 SHA 決定，且 E2E 自身斷言 repeat 一致。重產＝同 SHA、同 `--baseline`、同 browser 重跑該入口 |
| D | 一般回歸測試中 PASS 入口的 PNG（正式指定或人工驗收所需的截圖除外） | 同上 | **非判定證據**：不保存，或只保存已人工審核 hash 者 | write-only；保存缺口 :47 已規定 PNG 只接受審核過的 hash |
| E | `browser-progress-*.json`、browser profile、`test-results/<name>`（§1-3 (c)） | 全部 | **診斷／非證據** | 牆鐘檔名與內容；profile 不可讀（保存缺口 :79、:88）；(c) 跨 run 覆寫，不能當作單次 run 的證據 |
| F | D2 獎項 G0～G9 的封存（A 三份封存、v2、A→B 完整 S／選擇／RNG、B Decision／Receipt revisions） | 發布證據 | **不在 CI collector 範圍** | G0～G9 是 D2 實作批次（`tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md` §3），其保存依 G9 保存分層 §6（兩處獨立儲存、刪除前需候選清單與核准），與每次 CI run 的 artifact 分開管理 |

**正式驗收或發布要求優先。** 已由正式驗收條件或發布規則指定的原始 S／RNG／Decision／Receipt、代表截圖等，即使 run 為 PASS，仍依既有規則保存原件。C、D 的一般分類不適用於此類原件；索引、摘要、雜湊或事後重跑都不能取代原件。D2 G0～G9 的封存仍依 F 分開管理。

**一般回歸測試。** PASS 的 run 至少保存 A；C 類輸出只有在證明可重產後才改為只保存索引，未證實前保留原件。FAIL／BLOCKED／timeout 的 run 另保留 B 類失敗入口的已產出原件；其餘入口仍依 A、C、D 與正式驗收要求分類。只有入口→目錄對照已驗證且可追溯時（§3-3），才能縮小保存缺口 :45 所述的失敗 run 保守保存範圍；在此之前維持現行做法。

## 3. 待決事項

1. **C 的前提。** 依入口及輸出類別，以相同受測 SHA、基準 SHA、seed、執行參數與環境（含 Node／瀏覽器版本）實測重產，事先定義並核對必要內容是否一致。測試 PASS 或原件未被測試讀取，不能單獨證明可重產；未驗證的輸出先保留原件，正式指定原件仍按既有規則保存。
2. **B 超過 64 MiB。** 最大單檔約 237.88 MiB（`full-power-pitching` 生涯 JSON，保存缺口 :89），48 檔超過 64 MiB（:88）。這些數字來自 Windows 1.12.0 B Full，已過期；Linux CI 實測見 §4-2。失敗時需另定：分段、另一儲存通道，或提高上限（上限不可由 CLI 調高，:44）。
3. **入口→目錄對照的來源。** 附錄由程式碼掃描得出，若要讓 collector 依此縮小保存範圍，對照應改由 manifest 宣告（例如各入口的輸出目錄欄位），並以測試確認每個入口實際寫入的位置與宣告一致。這是測試基盤變更，需另行核准。
4. **§1-3 (b)、(c) 的位置。** (b) 的 5 個目錄與 (c) 的 `test-results/<name>` 不在 CI 上傳範圍。若 B 需要它們，應先決定改輸出位置（測試變更）或擴大 glob（workflow 變更，需核准）。Linux CI 失敗 run 中，失敗入口的原件因此未上傳，見 §4-3。
5. **Linux 實測。** 已以既有 CI artifact 離線量測 PRIVATE_PATH、容量與下載／還原（§4）；collector 在真實 CI 上執行仍為 NOT_RUN，接入前需在 CI 確認。

## 4. Linux CI 既有 artifact 實測（2026-11-28）

未重跑 Full。對象為保留期限內（`retention-days: 14`，`test.yml:68`、:106、:152、:199）的兩次 GitHub Full，artifact 以登入瀏覽器下載，解壓後在本機唯讀掃描及執行 collector（輸出只寫至暫存目錄），量測後刪除。

| Run | 受測 SHA | 結果 | 下載 artifact | 解壓後 |
|---|---|---|---|---|
| [Full #293](https://github.com/tt-chin/yakyujinsei/actions/runs/45826779978) | `7d71c8cc11e66bf99bf77bb187a5c8f25387c315`（dev） | 141 PASS／7 FAIL | 10／10 | 1,330 檔、2.0 GiB |
| [Tests #319](https://github.com/tt-chin/yakyujinsei/actions/runs/46124622303) | `34712bf59a0424fff3386c76d94f4b12b99d50cd`（`test/aud-02-low-cost`） | 152 PASS | 10／10 | 1,338 檔、2.1 GiB |

1. **PRIVATE_PATH／敏感內容。** 以 `collect-ci-evidence.mjs:27-28` 的同一 regex 掃描所有 `.json`／`.log`／`.txt`／`.ndjson`／`.md`：兩次 run 皆 PRIVATE_PATH 0、SENSITIVE 0、非 UTF-8 0；collector 實跑亦無這兩種代碼。§1-4 的 Windows 數字不適用於 Linux CI。
2. **容量。** #293：超過 64 MiB 共 11 檔，最大 140.89 MiB（`yakyujinsei-contract-salary/local/all/career-IF.json`），其餘為 contract-salary `career-P.json`、kbo-renewal `fixed-career.json`、draft-income 6 個生涯 JSON、act-audit 2 個 run JSON（皆 64.29～136.96 MiB）。#319：同樣 11 檔，最大 182.08 MiB（同一 `career-IF.json`，兩次 run 間增加約 41 MiB）。以上取代 §3-2 的 Windows 數字（237.88 MiB／48 檔）。
   - collector 對 #293 失敗 batch-6 回報 `FILE_LIMIT` 9 筆，**全部屬於同 batch 內 PASS 的入口**（contract-salary、draft-income、kbo-renewal）；原因是有 FAIL 時 collector 把全部 `tmp/` 列為必須（`collect-ci-evidence.mjs:113`）。PASS batch（#319 batch-4、batch-6）的大檔只存索引，無 `FILE_LIMIT`。這是 §3-3 入口→目錄對照的直接用途。
3. **B 類缺口（#293 的 7 個 FAIL 入口）。**

   | 入口 | 原件位置 | 是否上傳 |
   |---|---|---|
   | `display-preferences-e2e` | (a) `yakyujinsei-v170-e2e` | 是 |
   | `full-power-pitching-e2e`、`full-power-pitching-jp3-pitcher-02-e2e`、`international-personal-stats-e2e` | (b) `tmp/<name>` | **否，只有 log** |
   | `ui-redesign-review-e2e` | (c) `test-results/<name>` | **否，只有 log** |
   | `game-view-dom-e2e`、`verify-modularization` | 未發現寫檔（入口檔 grep `mkdtemp`／`tmpdir`／`test-results`／`writeFile`） | 只有 log（含第一差異） |

   即 §3-4 不只是選項：現行 glob 下，失敗入口的原件有 4 個未保存。
4. **下載／還原。** 20 個 zip 的 sha256 與 API `digest` 一致，`unzip -t` 全部通過。collector 的 collect → verify → restore 在 #293 batch-1（全 PASS）還原 26 檔，逐檔 `cmp` 與輸入一致。
   - 限制：summary 的 `log` 為 CI 絕對路徑 `/__w/yakyujinsei/yakyujinsei/test-results/…`，離線執行一律得 `LOG_OUTSIDE_INPUT` 而 `EVIDENCE_BLOCKED`，restore 拒絕；上述 round-trip 是在副本上把 17 個 `log` 改為本機路徑後執行的**模擬**。CI 內以原路徑執行時預期不發生，但仍為 NOT_RUN。

## 附錄：入口 → 輸出位置 → 內容

只列會寫檔的自動入口。「CI」欄：是否符合現行上傳 glob。所有輸出皆為 write-only（不被測試讀回），例外已在 §1-1 註明。

| 位置 | 入口（輸出路徑，file:line） | 內容 | CI |
|---|---|---|---|
| (a) `tmp/yakyujinsei-*` | `draft-income-e2e`（`yakyujinsei-draft-income/…`，:30） | minimum／fixture JSON、`career-<seed>-{baseline,current}`（步驟含 state、rng）、summary | 是 |
| | `contract-salary-e2e`（`yakyujinsei-contract-salary/…`，:63） | per-case JSON、summary | 是 |
| | `bug-act-01-02-e2e`（`yakyujinsei-act-audit/…`，:28） | 各 seed／守位／寬度的 run JSON（含 final state）與 PNG、draft、summary | 是 |
| | `stage10-risk-e2e`、`stage6-ability-e2e`、`stage6-state-transaction-e2e`、`stage7-safety-e2e`（harness `yakyujinsei-stage*`） | per-case JSON（before／after state、RNG 計數）、summary | 是 |
| | `jersey-e2e`（`yakyujinsei-jersey-e2e-<Date.now()>`，:9） | PNG、summary | 是 |
| | `information-dialog-e2e`、`income-display-e2e`（:11） | PNG、summary | 是 |
| | `kbo-renewal-e2e`（:45） | `first-failure.json`（基準側 state）、PNG | 是 |
| | `display-preferences-e2e`（:76） | PNG；失敗時 `name-preservation-failure.json` | 是 |
| | `event-fix-e2e`、`event-system-e2e`、`event-history-e2e`、`event-category-badge-e2e`、`injury-risk-e2e`、`international-history-e2e`、`board-menu-stacking-e2e`、`trait-system-e2e`、`hof-first-ballot-e2e`、`replay-share-theme-e2e`、`championship-intl-e2e`、`global-contract-market-e2e`、`salary-history-e2e`、`npb-return-e2e` | PNG（分享圖等） | 是 |
| (b) `tmp/<name>` | `full-power-pitching-e2e`（`full-power-pitching[-part]`，:76） | 生涯 JSON（steps 含 before／after state、呼叫、年度）、per-case、summary、PNG | **否** |
| | `international-personal-stats-e2e`（:18） | 生涯 JSON {actions,state,rng,awards}、per-case、PNG、summary | **否** |
| | `smallschool-c-e2e`（:11） | 生涯 JSON {initial,steps,state,rng}、PNG、summary | **否** |
| | `trait-display-e2e`（:16） | 生涯 JSON（before／after state、rng）、PNG、summary | **否** |
| | `hof-retirement-policy-e2e`（:30） | `<seed>.json`、causality、approved-summary、PNG、summary | **否** |
| (c) `test-results/<name>` | `american-service-e2e`、`ui-redesign-shell-e2e`、`ui-redesign-allocation-e2e`、`ui-redesign-decision-e2e`、`ui-redesign-review-e2e`、`season-summary-e2e`、`fa-market-presentation-e2e`、`player-random-name-e2e`、`design-tokens-03-e2e` | summary（cases／checks）、PNG | 只有 summary（非 Full 分批） |

未確認：(c) 各 `summary.json` 的 cases 是否內嵌完整 S／RNG；`bug-act` run 物件、`draft-income` history、harness `awards`／`trace`／`final` 的完整鍵。若 B 要依賴這些檔，需先確認。

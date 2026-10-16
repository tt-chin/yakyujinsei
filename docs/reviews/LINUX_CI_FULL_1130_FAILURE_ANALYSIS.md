# 1.13.0 Linux CI Full 失敗調查

調查日期：2026-10-16（Asia/Tokyo）。模式：ANALYSIS_ONLY / READ_ONLY；唯一新增內容為本報告。未修改產品、測試、Runner、Workflow、VERSION 或既有報告，未重新觸發 CI。

## 1. Executive Summary

- **已確認的直接原因：GitHub-hosted runner 收到 shutdown signal，測試 step 以 exit 143 結束。** 並非已觀察到的遊戲斷言失敗，也不是 120 分鐘 job timeout。
- Full 預定 80 個入口；實際開始 19 個：18 PASS、0 個已回報 FAIL、0 SKIP、0 個入口回報 BLOCKED；第 19 個 INTERRUPTED / NOT_VERIFIED，另 61 個 NOT_RUN。整體 Run 為 FAILURE，不是 Full PASS。
- 中斷位置：`contract-salary-e2e`，已運行約 122.30 秒。它是否在某個內部 fixture 失敗或卡住，**未確認**，因子程序 log 沒有上傳。
- Full artifact API 回傳 0 個。上傳 step、setup-node post、checkout post 同時 SKIPPED，與 runner shutdown 時序一致。Workflow 已有 `if: always()`，不能將原因寫成漏加 always。
- shutdown 的更底層來源（平台回收、服務停止、人為操作或其他原因）**UNVERIFIED**。公開 Run、Job、check-run、annotation 與完整 job log 沒有提供發訊者或機器診斷，不能宣稱已證明 GitHub 平台事故、OOM 或測試自行殺死 runner。
- 沒有產品修正依據。可以在取得授權後，對相同 SHA 重跑 Full 以判斷是否為暫時性基礎設施中斷；本次沒有執行重跑。

## 2. Run ID / Commit SHA 對照

受驗 SHA 與本機 HEAD 均為 `29ae26b477c8a5488ab4c56360e6bd15e44de80c`；本機 branch `dev`；`docs/src/config.js:1` 為 1.13.0。

- [Full Run 38750999932](https://github.com/tt-chin/yakyujinsei/actions/runs/38750999932)：Tests；workflow_dispatch；attempt 1；dev；上述 SHA；completed / failure。
  - [Job 116477061578](https://github.com/tt-chin/yakyujinsei/actions/runs/38750999932/job/116477061578)：2026-10-15 14:23:49Z～14:33:26Z（9 分 37 秒）。
  - 測試 step：14:24:27Z～14:33:23Z（約 8 分 56 秒）。
- [Quick Run 38750672703](https://github.com/tt-chin/yakyujinsei/actions/runs/38750672703)：Tests；push；同一 dev SHA；completed / success。
  - Job 116475925661：14:21:36Z～14:25:28Z。
  - Runner summary：61 PASS / 0 FAIL / 0 SKIP / 0 BLOCKED；187.189 秒。

兩者併行期間不代表 concurrency 互相取消：目前 `.github/workflows/test.yml:21` 的 group 包含 event_name，push 與 workflow_dispatch 不同組；Full 的 API 結果也是 failure 而非 cancelled。此證據仍不能排除其他取消或服務停止來源。

### 環境

兩個 job log 均記錄：

- GitHub Actions runner 2.337.0；GitHub-hosted Ubuntu 24.04.5 LTS。
- image `ubuntu-24.04`，版本 `20261012.334.1`；provisioner `20261012.601`。
- Node v24.15.0、npm 11.12.1；Full checkout log 的 Git 2.55.0。
- Workflow 安裝固定 Playwright 1.62.1，Chromium / Chrome for Testing 151.0.7922.34（revision 1234），含 Linux 系統依賴；安裝與 workflow validation 均成功。
- Python：Workflow 沒有 setup-python 或列印版本；本次日誌未記錄實際版本，標記 NOT_RECORDED，不從 image 預設值推定實際受驗版本。
- `TEST_BROWSER=chromium`；Playwright 來自 runner 暫存安裝；沒有使用 Windows 個人路徑。

## 3. Quick / Full 比較

兩者使用相同命令模板：`node scripts/test.mjs "$TEST_MODE" --output=test-results/ci`。Quick 的 TEST_MODE=quick，Full=full。

`scripts/test.mjs:14,24,67` 與 `scripts/test-manifest.mjs:15–18,44–55` 決定入口及旗標：

- Quick 61 入口；ACT 使用 `--fixtures-only`，54.84 秒完成。
- Full 80 入口；ACT 不帶該限制，404.37 秒完成；另含更多瀏覽器及完整生涯驗證。
- `contract-salary-e2e` 是 Full / Audit 入口，不屬於 Quick；Full 執行時 `--compare` 解析為 `7220ad82002801d3dea5fedae80d0fb3d7a0433f`。
- Quick 成功只證明其 61 入口當次成功，不能替代 Full-only 的合約／薪資、完整生涯或後續入口驗收。
- Full 的失敗記錄是 runner shutdown；不能從 Quick 成功推論 Full-only 產品沒有問題，也不能從中斷位置推論合約程式有問題。

## 4. Full 80 項實際結果

依受驗來源 inventory 重新列舉，含 syntax 共 80 個入口，不是內部 assertion 數。全部 472 行 Full job log 中有 19 個 `RUN ...: node ...`、18 個入口 `PASS ... (exit=0)`、0 個入口 FAIL。沒有最終 summary；以下是 job log 重建，不冒充 Runner 完成後的 summary。

### 已完成：18 PASS（全部 exit 0）

1. syntax — 2.96s
2. ability-allocation.test — 0.03s
3. arbitration-policy.test — 0.03s
4. award-consumer-contract.test — 0.06s
5. award-consumer-policy.test — 0.04s
6. award-history-b-comparison.test — 0.10s
7. award-history-comparison.test — 0.04s
8. award-identity-policy.test — 0.23s
9. award-journal-native.test — 0.18s
10. award-legacy-consumer.test — 0.12s
11. award-rng-policy.test — 0.04s
12. award-transaction-policy.test — 0.04s
13. bug-act-01-02-e2e — 404.37s
14. career-movement-policy — 0.03s
15. championship-intl-e2e — 4.66s
16. championship-intl.test — 0.16s
17. choice-action.test — 0.03s
18. contract-policy.test — 0.03s

### 已開始但中斷：1 INTERRUPTED / NOT_VERIFIED

19. contract-salary-e2e — 14:31:21.4146075Z 開始，14:33:21.6071234Z 最後 heartbeat 為 120s；14:33:23.7113961Z 外層 step exit 143。沒有入口完成狀態、子程序 exit code 或內部案例總數；不得擅自列為 assertion FAIL 或 PASS。

### 未開始：61 NOT_RUN

20. control-period-policy.test
21. display-preferences-e2e
22. display-preferences.test
23. domestic-tournament-policy
24. draft-bonus-display.test
25. draft-income-e2e
26. draft-signing-policy.test
27. event-copy.test
28. event-fix-e2e
29. event-fix.test
30. event-integration.test
31. event-policy.test
32. event-system-e2e
33. fa-market-policy.test
34. fixed-seed-v160.test
35. full-power-pitching-e2e
36. full-power-pitching.test
37. global-contract-market-e2e
38. global-contract-market.test
39. hall-of-fame-policy
40. hof-first-ballot-e2e
41. hof-first-ballot-league.test
42. incentive-policy.test
43. information-architecture.test
44. injury-market-policy.test
45. international-personal-stats-e2e
46. international-personal-stats.test
47. japanese-copy-contract-ui.test
48. kbo-renewal-e2e
49. kbo-renewal-floor.test
50. npb-return-e2e
51. npb-return-ui.test
52. pitcher-award-integration.test
53. pitcher-award-policy.test
54. record-condition-fix.test
55. replay-share-theme-e2e
56. replay-share-theme.test
57. retirement-hof-balance.test
58. salary-detail-ui.test
59. salary-evaluation-policy.test
60. salary-evaluation-receipt.test
61. salary-explanation-policy.test
62. salary-flow.test
63. salary-history-e2e
64. salary-promotion-policy
65. salary-promotion-policy.test
66. school-policy.test
67. season-payment-receipt.test
68. smallschool-c-e2e
69. spec-source-links.test
70. stage10-risk-e2e
71. stage6-ability-e2e
72. stage6-state-transaction-e2e
73. stage7-safety-e2e
74. team-demand-policy.test
75. test-runner.test
76. trait-display-e2e
77. trait-policy.test
78. trait-system-e2e
79. ui-foundation.test
80. verify-modularization

統計核對：18 PASS + 1 INTERRUPTED + 61 NOT_RUN = 80。測試入口 SKIP=0；Workflow step SKIPPED 與入口 SKIP 不同。未執行／未完成合計 62，不是 62 個測試 FAIL。

## 5. Root Cause Analysis

### VERIFIED_RUNTIME：直接失敗鏈

第一個 failure step 為 `Run test profile`（step 6）。完整日誌末段原文：

```text
2026-10-15T14:33:21.6071234Z RUN contract-salary-e2e: 120s; log .../test-results/ci/contract-salary-e2e.log
2026-10-15T14:33:23.7113961Z ##[error]Process completed with exit code 143.
2026-10-15T14:33:23.7154400Z ##[error]The runner has received a shutdown signal. This can happen when the runner service is stopped, or a manually started runner is canceled.
2026-10-15T14:33:23.8552423Z Cleaning up orphan processes
```

143 符合 shell 的 128+15（SIGTERM）慣例；更強的直接證據是 runner 明示 shutdown signal。Check-run annotation 也只有 `Process completed with exit code 143.`，output summary/text 為 null，沒有額外根因資料。

### 排除與限制

- Job 配置 `.github/workflows/test.yml:27` 為 120 分鐘；實際約 9 分 37 秒，沒有 job timeout 訊息。
- `contract-salary-e2e` 的預估秒數是 90（manifest:18）；Runner 單入口 timeout 是 `max(180,seconds*4)`，即 360 秒（test.mjs:54），而中斷在約 122 秒，且該 timeout 使用 SIGKILL，不是本次記錄的外層 exit 143。
- 依賴安裝、workflow YAML validation、先前瀏覽器 ACT 和 championship E2E 均已 PASS。沒有缺 Playwright、缺 Chromium 或 import error 的可見證據。
- 沒有 OOM、磁碟用盡、assertion failure、Page timeout 或 Node stack trace 的 job log 證據；不等於這些情況已被完整機器診斷排除。
- `tests/contract-salary-e2e.mjs:51,94–95` 的內部結果寫入 log/JSON；父 Runner 平時只輸出 heartbeat（test.mjs:51–59）。該子 log 已無 artifact 可取，無法得知最後的內部案例或更早捕捉的 FAIL。
- 受檢 Runner／contract suite／歷史比較工具未發現 shutdown／pkill runner 的呼叫；這不是整個主機的因果證明。
- 最底層的 shutdown 來源仍 UNVERIFIED；如相同 SHA 再次中止，應取得 GitHub 基礎設施／runner 診斷，不能直接改遊戲或放寬測試。

## 6. Artifact Evidence Audit

### 實際可取得

- Full artifacts API：`total_count: 0, artifacts: []`。沒有成功上傳的 Full summary、子 log、截圖、trace 或可重播 JSON。
- GitHub 本身仍可讀取 472 行完整 job log、Run/Job/step API、check-run annotation；它們只足以重建入口進度，不能替代完整 S/RNG/Decision/Receipt。
- Full 先前入口 log 曾在執行環境寫入；不能因 artifact 為空而稱從未產生任何檔案。遠端暫存檔是否完整保留／可取回：未確認；本次沒有可用恢復管道。
- Runner summary 只在 test.mjs:85 最後寫入；本次未抵達，沒有最終 counts summary 訊息。不能補造為當次生成的檔案。
- Quick artifact 成功：`tests-push-38750672703`，ID `11981506455`，23,348,310 bytes，未過期；SHA256 `5e13d909ed30ca912a6c6b355401096dff35d35441ade9ca906c3f84f564afd2`。本次核對 API 與上傳 log，未下載 ZIP 做內容／還原驗證，不能據此宣稱 Quick artifact Gate 覆蓋完整。

### 為何上傳被 SKIPPED

`.github/workflows/test.yml:52–54` 已設定 `if: always()`。Job API 顯示 14:33:23Z 同時跳過 evidence upload、setup-node post、checkout post，與 shutdown 訊息相吻合：上傳 action 根本沒有開始，不是檔案匹配為空、上傳容量超限或 collector 執行失敗。`always()` 不是 runner 已關閉後仍能執行的持久化保證。更底層 shutdown 來源仍未確認。

### 與既有保存缺口分開

現有 path glob 位於 workflow:59–64；頂層 log 和 summary 有列入，但部分 `tmp/full-power-pitching/`、`tmp/international-personal-stats/`、`tmp/smallschool-c/`、`tmp/trait-display/` 不能被既有 yakyujinsei/runner-contract patterns 完整涵蓋。這是靜態覆蓋風險，**不是本次 upload SKIPPED 的原因**。Collector 沒有接入 Workflow，也不是中斷原因。`D2-CI-ARTIFACT-01 / ARTIFACT_COVERAGE_BLOCKED` 仍有效。

## 7. MUST FIX / SHOULD FIX / CAN DEFER

### MUST FIX：補齊 Linux Full 驗收結果（非已證明的產品缺陷）

- 證據：上述 job 最後 shutdown；manifest:44–55 與 test.mjs:14,24 的 80 入口中僅 18 完成。
- 建議：使用相同受驗 SHA、新 attempt 重跑完整 Full，不重用此次 18 項作為新一輪 PASS。先取得使用者授權；若再現 shutdown，停止反覆重跑並提交兩次 Run／時間／image／annotation 給 GitHub 支援診斷。
- 風險：可能再次遺失子 log；重跑不代表可證明上次 shutdown 的底層根因。
- 驗收：新 Run 的 SHA 正確，80 項均有實際結果；只有 80 PASS / 0 FAIL / 0 BLOCKED 才能標記 Full PASS。artifact 完整性另列。

### MUST FIX：正式 Gate 證據保存契約仍缺（可與重跑分開排程）

- 證據：Full artifact API 為空；workflow:52–64 僅 job 尾端上傳且 glob 有已知缺口；Runner:85 只在最後寫 summary。這不表示必須先修才允許 Full 重跑，維持既有 Linux CI 優先決策。
- 建議：另批批准後制定必要原始證據清單及可還原性契約，精確涵蓋全部 Full 入口；保留正常 failure 時 `always()`，並在長測試間做分段持久化，減少 runner shutdown 的單點損失。非產品邏輯修改。
- 風險：額外 I/O、artifact 不可變名稱衝突、敏感資料與超大 JSON；不得直接上傳所有 test-results，不得將只有 hash 視為完整可重播證據。
- 驗收：可控制的入口失敗仍保留原 exit failure、完整 log/summary、必要可還原資料；中斷演練能取得已上傳批次並明示缺失，不能承諾保存突然斷電前尚未外送的資料。

### SHOULD FIX：增加進度與最小診斷的外送

- 證據：Runner:51–59 平時將子 log 寫本地，Actions 只有 heartbeat；contract-salary-e2e:51,94 的內部進度因沒有 artifact 而不可見。
- 建議：另批評估逐入口增量 summary、受控子 log 進度鏡像、失敗尾段、磁碟／記憶體指標、Python 版本（若確有依賴），並保存目前入口及命令。不能覆寫 golden 或改變通過條件。
- 風險：console 噪音、敏感內容洩漏、過度 log；需 allowlist 與安全測試。
- 驗收：故障注入時仍能定位內部測試、看見已完成清單；未完成明示 INTERRUPTED/NOT_RUN；退出碼不被診斷程式蓋掉。

### CAN DEFER：完整 bounded collector 接線與容量優化

- 證據：目前 collector 未在 workflow 呼叫；現有 glob 未更動。與本次直接 shutdown 無因果證據。
- 建議：維持獨立 `D2-CI-ARTIFACT-01`，完成大小、敏感路徑、缺失與下載還原驗收後，再申請精確 Workflow diff；不要以擴大 timeout 或降低 Full 範圍替代。
- 風險／驗收：沿用已批准的 collector 限定測試與正式 Gate 覆蓋要求；ARTIFACT_COVERAGE_BLOCKED 未解前不得宣稱完整保存 PASS。

## 8. 是否需要修程式／Workflow，是否建議重跑

- **產品程式：目前不需要依本次證據修改。** 沒有定位到產品 assertion failure；也尚未證明中斷中的全部 fixture 無問題。
- **Workflow：不需要為了修正本次已知直接原因而立即改。** 120 分鐘和 always 已存在；保存機制應另行補強，不能認為再加 always 就解決 runner 消失。
- **可直接重跑相同 SHA Full 作為診斷／驗收；需要新授權。** 不需要先改門檻、測試 timeout、golden 或減少 80 入口。若要先補最小診斷，也需另行批准並標明新測試工具 SHA，不能與原條件混用。
- 本次沒有 rerun、Quick、Full、本機 fixture、CI trigger 或部署；Linux Full 仍 FAILURE / INCOMPLETE，Preview／正式發布狀態不由本報告改為 PASS。

## 9. 調查命令與完整性

執行的唯讀操作：`gh run view <兩個Run> --json ...`、`gh run view <兩個Run> --log`、`gh api .../actions/jobs/116477061578`、`gh api .../check-runs/116477061578[/annotations]`、`gh api .../actions/runs/<Run>/artifacts`。完整 Full log 在記憶體篩查與計數，未只讀 log-failed；沒有建立偽造原始證據或下載大型測試產物。

本機以 inventory API 只列舉 Full 入口（未執行入口），`git diff --quiet HEAD -- scripts/test.mjs scripts/test-manifest.mjs .github/workflows/test.yml docs/src/config.js tests` 為 0，確認這些受檢來源與受驗 HEAD 相同。未修改工作樹原有 D2 設計四行、G1-A fixture、未追蹤 G1-B/B2 報告與 development-b 目錄。只新增此報告，不 stage／commit／push。

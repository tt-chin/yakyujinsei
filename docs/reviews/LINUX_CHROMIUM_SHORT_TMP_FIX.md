# Linux Chromium 短暫存路徑修正（本地，待Linux驗證）

基準dev：9b98ffa3e69449665656fa6a56da4555ca0394f3；VERSION 1.13.0不變。CI_ONLY／R2。未提交、推送或觸發Actions。

## 根因與22項分類

Run 38838485336下載的8批summary及各失敗入口log逐一檢查：22/22都包含 `process_singleton_posix.cc:313 Socket path too long`。分類為CONFIRMED_PATH_FAILURE；未發現另一個可分離的主要失敗原因，但瀏覽器未啟動，不能宣稱後續遊戲斷言都已通過。

失敗入口：bug-act-01-02-e2e、championship-intl-e2e、contract-salary-e2e、display-preferences-e2e、draft-income-e2e、event-fix-e2e、event-system-e2e、full-power-pitching-e2e、global-contract-market-e2e、hof-first-ballot-e2e、international-personal-stats-e2e、kbo-renewal-e2e、npb-return-e2e、replay-share-theme-e2e、salary-history-e2e、smallschool-c-e2e、stage10-risk-e2e、stage6-ability-e2e、stage6-state-transaction-e2e、stage7-safety-e2e、trait-display-e2e、trait-system-e2e。

`scripts/ci-full-batches.mjs`將output改成ci-full/batch-N，而 `scripts/test.mjs`將子程序TEMP/TMP/TMPDIR指向output/tmp。Chromium使用此值建立SingletonSocket，導致pathname超限。日誌字尾句點不是路徑內容；去掉後22個失敗實際樣例均119 bytes。

- 原Quick／未分批Full：`.../test-results/ci/tmp/org.chromium.Chromium.ABCDEF/SingletonSocket`＝106 bytes，接近Linux sockaddr_un 108-byte容量（pathname含NUL，最多107 bytes）。
- 分批Full：`.../test-results/ci-full/batch-2/tmp/org.chromium.Chromium.ABCDEF/SingletonSocket`＝119 bytes。
- 修正別名：`/tmp/yj-ABCDEF/t/org.chromium.Chromium.ABCDEF/SingletonSocket`＝61 bytes。

## 修改

- `scripts/ci-full-batches.mjs`：僅Linux建立mkdtemp隨機專屬 `/tmp/yj-XXXXXX`，chmod0700；其中t為指向當批output/tmp的symlink。以新增Runner參數 `--temp-root`傳入短名字。receipt命令保存當次別名。
- `scripts/test.mjs`：新增可選temp-root；只允許Linux symlink，且realpath必須精確等於當批output/tmp。未指定時原Quick／Audit與獨立Full全部保持原路徑；不改入口、旗標、斷言、timeout或PASS規則。
- `scripts/ci-full-batches.test.mjs`：新增socket長度模型與Linux專用別名唯一性、0700、realpath、證據保留、移除別名測試；原30案保留。
- 本報告。

每批別名不同，不共用固定可寫資料夾。正常返回或spawn例外後finally只unlink自己建立的symlink，再rmdir空父目錄；不遞迴刪除、搬移或複製測試證據。若整個runner突然關閉，可能留下私有別名；只存在當次runner環境，禁止以廣域glob清理。原artifact來源目錄、8批命名、summary與log SHA256校驗不變，實際資料從一開始就落在原長目錄，無須回拷。

## 驗證與限制

- `node scripts/ci-full-batches.test.mjs`：31 PASS／0 FAIL／1 SKIP，5.014秒。SKIP為Linux專用symlink／權限案例，不能稱為PASS。
- `node scripts/check-workflow.mjs --playwright=<既有外部模組>`：PASS；Workflow沒有修改。
- `git diff --check`：PASS；原有CRLF提示保留。
- Windows沒有已安裝WSL Linux發行版，沒有Docker；Linux Chromium實際啟動及Linux別名／權限測試：NOT_RUN／環境BLOCKED。沒有安裝環境或呼叫Actions繞過限制。
- 本輪Quick：61 PASS／0 FAIL／0 SKIP／0 BLOCKED，exit0，277.165秒；Windows／Node24.15.0／Chrome155。命令為 `node scripts/test.mjs quick --playwright=<既有外部Playwright> --browser=chrome --output=test-results/chromium-short-tmp-quick-20261016`。summary與各入口log原地保留，不以舊PASS代替。

ARTIFACT_COVERAGE_BLOCKED保持原狀。短別名足以通過pathname長度模型，但仍需真實Linux檢查Chromium啟動與0700／symlink行為；不能從Windows模型宣稱Linux已修復驗收。建議另行授權Linux最小啟動驗證後，再對新提交SHA重跑Full；本次不觸發、不重跑遠端。

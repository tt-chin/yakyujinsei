# UI 改版基線：第 0 批盤點

日期：2026-11-16（日本時間）。已完成第 0 批必要的靜態盤點及本機動態基線記錄；產品未改。最新 bundled Chromium 完整重跑已取得 runner PASS／exit 0；先前 Chrome 關閉失敗仍保留於下節。這不是第 1–5 批驗收，也不代表所有測試／裝置通過。

## 來源與分支

- `git fetch origin` 成功後，本機 dev 與 origin/dev 均為 `f08848b337aea28d57f2c55d3318d749cef5a3ff`，開發版 1.16.14。
- origin/main 為 `d6cef67ef6ac8e348f66f2f5ed32c4fa3d6b7cd1`。本輪不合併、不更新 main。
- 從 dev 建立 `codex/ui-redesign`。原有三份未追蹤設計／參考文件保留。
- 已讀 AGENTS.md、CURRENT_SPEC.md、BACKLOG.md、CHANGELOG.md、docs/index.html、實作設計書與兩份 MBDAY 參考文件。

## 功能、入口、資料與監聽對照

行號為上述基準來源，後續程式變更時需重新定位。

- **首頁與開始**：`docs/index.html` 的 `#home-create`、`#in-name`、`#seg-pos`、`#btn-start`；`docs/src/engine/game.js:358` 的 startJapanese 委派 CareerEntry.startNew，`:366` 起綁定開始 onclick；讀取姓名、守位與 seed。開始流程、保存檢查與 RNG 初始化不能當作單純排版搬移。
- **姓名骰子**：`docs/src/ui/random-player-name.js:4` 的 bindRandomPlayerName，於 `game.js:365` 接線；onclick 使用既有 generatePlayerName，最多五次避免同名，通知 input／change，不提交。已存在，不重新實作姓名抽選。
- **首頁存檔 UI**：`docs/src/ui/browser-save-ui.js:1` 的 createBrowserSaveUI，按鈕 onclick 接 onContinue／onNew／onRetry／onHome；依 controller 的 phase、slot、message 顯示。ready 時首頁 message 隱藏，無 slot 時 panel 隱藏，已有「簡潔兩選擇」與刪除後首頁靜默處理，不應誤列為全新功能。
- **存檔生命週期**：`docs/src/engine/game.js:380` 的 initializeBrowserSave，`:384` 起 fresh 在確認後呼叫 remove；`docs/src/engine/browser-save-controller.js:8` initialize、`:9` newCareer、`:24` restore、`:31` remove。資料來自 BrowserSaveStore 與 envelope，不由 DOM 文字判斷。
- **事件與選項**：`docs/src/ui/game-view.js:21` divider 管理年度卡片；`:40` renderChoices 建立選項；`docs/src/ui/choice-prompt.js:7` ChoicePrompt 接管選擇、generation／accepted 與失敗恢復。已有防二重操作，後續保留而非另建平行鎖。
- **配點**：`docs/src/engine/player-ability.js:17` allocUI；輸入 mode.dice／pool、S.ab／pot／carry。`:40` 起 allocate 的 onclick／keydown 直接更新能力與 carry，hist 保存復原資訊；`:50` reset，`:54` confirm。以 state／year／generation／DOM 連接及 completed 防舊回呼與重複確認。資源、索引與歷史目前位於閉包，不是獨立持久草稿。
- **三分頁**：`docs/src/ui/navigation.js:9` initNavigation；`:15` selectMain；`:16–18` click 綁定主分頁及子分頁。UI 狀態在 uiState，主頁 DOM 隱藏而非重建；切頁會呼叫 onNavigate，目前接 archiveTraitResults，不能未經比較就宣稱切頁完全不寫 S。
- **設定與選單**：`docs/src/ui/preferences.js:24` initializeDisplayPreferences，偏好鍵為 `yakyujinsei.display.v1`；`docs/src/ui/board-menu.js` 管理 keydown、外點、focusin、click 與關閉。既有主題／字級／密度先重用；底部 sheet 的 inert 與焦點圈限需另行驗證。
- **退休**：`docs/src/engine/career-retirement.js:91` retireScene、`:153` endGame；UI 與退休規則同模組，重排不能連帶改退休判定。既有分享委派 `docs/src/ui/share-image.js`。本次證明退休後仍保留最後年度起點存檔，繼續後重做該年度可到達相同退休結果；不等於持久化退休收藏。

## 靜態版面基線

- `docs/styles/base.css:15`：app 最大寬 560px、min-height 100dvh，非設計目標的 1440px 雙欄。
- `base.css:17`：board 為 sticky、top 0、z-index 21；`:84` act 為 sticky、bottom 0、z-index 20。
- `docs/styles/ui-navigation.css:1`：主導覽 sticky 在 --board-height 下方、z-index 19；目前同時固定 board 與導航，與手機目標的一層導航不同。
- `base.css:121`：start 為 fixed、全視窗、overflow-y auto；第 1 批須核對自然捲動及軟鍵盤。
- `docs/styles/stadium-background.css:4`：body 背景 fixed、z-index -1、opacity .5；`:7` 桌面 wrap 仍有 94% 背景；`:14` 手機 wrap 透明；`:16` 手機標題另有球場圖片。背景並非只需加一張圖。
- 主要來源還有 jp-theme.css、themes.css、preferences.css、board-menu.css；上述為來源宣告，未量測最終 computed style，不當作全覆寫鏈的動態證明。

## 保存及草稿語意

- 無檔：controller initialize 成為 ready、slot 空，首頁表單可用。
- 有檔：ready＋slot 才顯示繼續與新生涯；restore 重新讀取並 hydrate，失敗轉 restore-error，不覆蓋原檔。
- 損壞／不相容或存取失敗：initialize 轉 unavailable，提示保留資料與非保存遊玩，不靜默刪除；實際錯誤分類需動態 fixture 補驗。
- 刪除：remove 使用 revision 與 generation 防衝突，失敗轉 delete-error；成功清 slot。現行新生涯按鈕先呼叫此流程，須依已批准 A 改為提交時才確認覆蓋。
- 保存：capture 以年度與 generation 管理快照／寫入佇列；不是季中每次點擊自動保存。配點分離視圖不得改此範圍。
- 配點：試配直接改 S，undo／reset 從快照還原；確認資源用完或全部能力 80 時才出現，全上限時可捨棄剩餘資源。本輪不改規則、不引入平均分配。

## 測試入口與動態基線結果

已成功執行 `node scripts/test.mjs list`：145 個測試檔、含 syntax 的 128 個已登錄自動入口。此命令只列清單，不是 Quick／Full PASS。依 scripts/TESTING.md 指定外部 Playwright 與 browser，不引入 npm 依賴或提交本機絕對路徑。

後續相關入口：browser-save-controller.test、browser-save-runtime-e2e、browser-save-routes-e2e、player-random-name-e2e、display-preferences-e2e、stage6-ability-e2e、game-view-dom-e2e。可用 `node scripts/test.mjs full --only=<入口> --playwright=<外部模組> --browser=chrome`；只執行單入口不能報 Full PASS。既有 E2E 自行建立 loopback HTTP server，例如 tests/support/stage6-browser.mjs:60–61，不以 file URL 載入 ES modules。

### 命令、環境與證據

- Node 24.15.0、Windows、Chrome 157.0.8103.78，外部 Playwright；測試以隔離 context 操作測試角色，不使用真實玩家資料。
- 主探針：`node test-results/ui-baseline-20261116/probe.mjs`。先用環境變數 PLAYWRIGHT_MODULE 指向外部模組；不將本機模組絕對路徑寫入產品或提交。此探針自行以 Node HTTP 啟動 127.0.0.1 隨機埠，提供 docs 及僅在回應中追加的觀測 hook，不修改磁碟產品來源。
- Google Fonts stylesheet 在這些探針中回覆空 CSS，因此截圖是現有 fallback 字型的基線；不宣稱 Web Font 載入或真實網路效能已驗證。
- 保存檢查：`node scripts/test-browser-save-runtime.mjs --home-only --output=test-results/ui-baseline-save-runtime-20261116`，同樣以 PLAYWRIGHT_MODULE 指定外部模組，exit 0。`--home-only` 仍包含既有 discardChecks 與 startComparison，不包含該腳本其餘年度恢復矩陣。
- 補充：`node tests/browser-save-controller.test.mjs`：14 案 PASS、exit 0。
- 補充：`node test-results/ui-baseline-20261116/storage-probe.mjs`：損壞／不相容存檔 PASS、exit 0；`node test-results/ui-baseline-20261116/allocation-probe.mjs`：復原／重設與三尺寸記錄完成、exit 0，完整 S 的差異另列，不視為完全不變。
- 原始 JSON、探針來源、圖片與 geometry 位於 `test-results/ui-baseline-20261116/`；既有首頁 E2E 證據位於 `test-results/ui-baseline-save-runtime-20261116/`。兩者依現行 .gitignore 為本機證據，不隨 Git 自動封存。可追蹤的檔名、大小與 SHA256 收據為 [UI_REDESIGN_BASELINE_EVIDENCE.json](UI_REDESIGN_BASELINE_EVIDENCE.json)。搬移／清理原始證據前須另行封存，不能只靠 hash 重建。

### 固定投手／野手及 UI 插入比較

- P：`jp3-pitcher-02`、姓名「基線投手」，362 次遊戲操作、746 次 RNG，2048 年／38 歲退休。
- IF：`jp3-infielder-01`、姓名「基線野手」，536 次遊戲操作、687 次 RNG，2058 年／48 歲退休。
- 兩個角色各跑 control／ui；策略為優先通常投球、目前能力最低列配點、優先既有 NPB／職業接受入口，否則第一個可用選項，排除 undo／reset。每次真實操作的文字、完整 S、全 RNG before／after／value 與最後結果均保存於 `P-control.json`／`P-ui.json`／`IF-control.json`／`IF-ui.json`。
- ui 組在第 0、1 個遊戲操作前插入 player→career→home、選單、夜間主題／大字→重設、選項收合／展開；這涵蓋初始選擇及同一配點視圖。兩次 UI 區段前後完整 S／RNG 各自嚴格相等，control／ui 的全部逐步快照、遊戲選擇與最終狀態也嚴格相等，不排除 version 或任何狀態欄位。
- 退休後重新讀取最後年度存檔，兩角色均提供繼續入口；保存的 done=false，checkpoint 年度分別為 2048、2058。重做最後年度後，完整退休 S 與從該年度起點開始的 RNG 後綴完全相等。證據：`P-last-save.json`／`IF-last-save.json`、`*-retirement-restored.json`。

### 存檔與草稿實測

- 現有首頁 E2E 五尺寸：1440×900、390×844、375×667、320×568、320×300 全部指定檢查 PASS。無檔顯示創角，有效檔只顯示兩個選擇，現行刪除後回普通首頁；取消／Esc 保留完整存檔。
- 刪除失敗阻擋開始且保留舊檔，重讀可恢復；跨分頁更新使舊確認失效，未刪新檔。這些驗證的是「現行先刪檔」基線，不能當作已實作本設計的「提交時才覆蓋」。
- storage-probe 在隔離資料庫分別注入非法 revision 及不相容 compatibilityId，重讀後不顯示繼續，顯示錯誤與非保存開始入口，底層原始測試資料逐字不變。
- 配點投入後，跨頁再返回保留當前 S；undo 恢復能力且 RNG 不變，reset 恢復能力／進度與原骰子。**現行差異**：初始 carry 不存在，undo 留下對應零值欄位，reset 變成空物件。因此只能說能力／資源語意還原，不能說完整 S 相等。`allocation-summary.json` 明列此觀測。

### 截圖、捲動及現行缺口

- 主探針保存 18 張 1440×900／390×844 圖片：空首頁、P／IF 有檔首頁、兩角色事件、配點與自然退休，並保存各畫面 computed style／尺寸／捲動資料。另有損壞與不相容首頁圖，以及三張配點尺寸補錄；首頁 E2E 保留額外尺寸與確認彈窗圖片。
- 已抽樣視查桌面首頁、桌面野手事件、手機投手配點及手機退休。桌面已有兩側資料摘要，不是沒有側欄；目前中央 app 與外側摘要的結構不同於設計目標雙欄，後續應重用 desktop-overview，不另造資料來源。靜態最大寬 560px 不代表整個桌面只顯示 560px 內容。
- 手機 390×844 事件基線：board 約 196px、導航 53px，act 為 sticky 且可內部捲動；並非參考站的 1px 閱讀區問題已在本遊戲重現。
- 配點補錄：320×568 操作區高約 271px／內容 630px；844×390 高約 49px／內容 592px；1280×720 高約 423px／內容 592px。三者 document 無水平溢出，但短視窗操作區明顯受限，需按設計改善自然捲動與專用視圖。容器高度不能直接當作未被 sticky 遮擋的可閱讀高度。
- 手機退休是很長的結算與年度表，sticky 新生涯選項出現在閱讀流程中；已有截圖作後續摘要與操作位置比較。

### 失敗與執行界線

- 首次主探針因 sandbox 限制 loopback，得到 ERR_NETWORK_ACCESS_DENIED；保留 `environment-failure-summary.json`。在允許的外部執行後完成所有功能斷言；主 summary 的 errors／http404 均為空。
- 主探針完成所有比較並寫出 summary 後卡在 browser.close，沒有正常退出；確認無該 Node 的直屬子程序後，僅結束本次 Node（PID 37220），程序 exit 1。**功能比較斷言已通過，但整個 runner 未正常完成，不報 runner PASS**。不是 CI／Quick／Full 結果。後續重跑應為關閉階段加有界清理，不覆寫本次原始證據。
- allocation-probe 首次對 reset.carry 與缺省 carry 做嚴格比較失敗（`{} !== undefined`），保留 `allocation-failure.json`。靜態來源確認現行 reset 明確建立空物件後，後續只驗證所記錄的既有語意，並保留完整差異說明；沒有改產品、golden 或規則以通過。
- **NOT_RUN**：實機 Safari／Android、觸控／軟鍵盤、非零 safe-area、真正 200% 瀏覽器縮放、Web Font 實際載入、全部生涯分支。既有 E2E 的 CSS 放大與 viewport 旋轉不能當作真實瀏覽器縮放或實機通過。這些仍屬後續批次驗收，不假冒第 0 批已涵蓋全部環境。
- 產品與共用測試基盤未修改；新增的是基線證據與文件，無需為此一律追加 Quick／Full。main 合併前所需 Full 與後續 R2／R3 驗證不因此免除。

## 2026-11-16 runner 關閉修正與完整重跑

- 範圍僅限忽略目錄內的本機探針與本文件，不修改共用 test runner、已登錄測試、產品、版本或 CI。新探針沿用原始完整生涯測試區段，文字比較確認選擇策略、UI 插入及所有生涯／狀態／RNG 斷言保持一致。
- 關閉改為透過 launchServer 取得此次瀏覽器的獨立程序，分別有界等待 client disconnect、browser server close、HTTP server close，確認瀏覽器 exit 0 與此次暫存目錄為空。任一逾時／清理失敗都記 FAIL，不以手動終止當 PASS；summary 直到清理成功才標為最終 PASS。
- 新 Chrome 重跑 `test-results/ui-baseline-runner-20261116-01/`：Chrome 157.0.8103.78，生涯斷言 PASS，但 BROWSER_SERVER_CLOSE_TIMEOUT／BROWSER_KILL_TIMEOUT，最終 FAIL。確認該瀏覽器主程序已消失後，僅清理該次卡住的 Node（PID 23452）；execution.json 記 exit -1。它與最初的失敗紀錄都保留，不能改寫為成功。
- 已有外部 Playwright 1.62.1 的 bundled Chromium 151.0.7922.34 小型關閉診斷可正常 exit 0，因此另建 `test-results/ui-baseline-runner-20261116-02/` 完整重跑，未安裝依賴或修改外部套件。Chrome 路徑的根因未完全查明，不能宣稱其問題已修好；本次成功只適用明列的 Chromium 環境。
- 命令：先將 PLAYWRIGHT_MODULE 指向外部模組，再執行 `node test-results/ui-baseline-runner-20261116-02/probe.mjs`。stdout／stderr 保存於 runner.log，外層保存原始程序退出碼至 execution.json。
- **最終結果：runner PASS，Node exit 0；assertionsStatus PASS、cleanup PASS，瀏覽器 exit 0、signalCode null，HTTP server 完成關閉，browser-tmp 空，errors／http404 空。** P 仍為 362 操作／746 RNG，IF 仍為 536 操作／687 RNG；各自 control／ui 逐步完整狀態、操作與 RNG 嚴格相等，兩者最後年度存檔重播至退休的完整 S／RNG 也一致。
- 18 張 PC／手機主場景截圖已重新生成並確認非空。重跑後再次逐一核對 source-manifest，來源雜湊未改。這是本機基線探針 PASS，不是 Quick／Full／CI PASS；實機、真正 200% 瀏覽器縮放與 Web Font 載入限制不變。
- 新收據：[UI_REDESIGN_RUNNER_EVIDENCE.json](UI_REDESIGN_RUNNER_EVIDENCE.json) 保存兩次新重跑的檔名／大小／SHA256；舊收據與全部原始 FAIL 證據不變。上述 test-results 仍為本機忽略證據，不表示已上傳或隨 Git 封存。

## 擴大 UX 的後續決策

兩份 MBDAY 文件提出但本設計未納入的平均／批次配點、退休收藏、稱號意義說明與新系統，須另列候選，逐項用選項決定。參考站的薪資、投票、人物等資料不移植。涉及現行已批准稱號名稱のみ、成長或存檔規則時，先寫清差異，再交使用者決定，不以參考文件暗中覆蓋 CURRENT_SPEC。

本輪檢查：只新增／修訂 tasks 文件及本機忽略的 test-results 證據；產品、已登錄測試、VERSION、CI 與發布設定不變。不升遊戲版號，不把未實作設計寫入 CURRENT_SPEC 或正式 CHANGELOG。第 0 批資料盤點已可用於後續設計與改修；上述差異／清理限制不能被稱為不存在或已修復。

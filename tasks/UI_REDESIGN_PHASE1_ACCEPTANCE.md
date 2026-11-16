# UI 改版第 1 批：首頁與開始流程

2026-11-16。分支 codex/ui-redesign，R3（存檔覆蓋／刪除流程涉及永續狀態）；第 2–5 批未實作。

## 實作與範圍

- 首頁自然捲動、球場分層背景、獨立版本、560px創角／存檔卡、詳細設定與2×2案內。重用既有姓名骰子及素材授權內容，不改遊戲畫面結構與規則。
- 有檔「新しく始める」只開表單，保留輸入與舊檔；提交時用指定文案確認。新生涯首個有效年度快照用既有revision CAS覆蓋，不先寫刪除紀錄。詳細設定另有明示刪除。
- 非確認、重複提交、慢讀取、跨分頁衝突、開始同步例外、保存／刪除失敗均有保護。舊檔格式、年度保存時點與損壞檔救援維持。
- 產品檔案：docs/index.html、docs/styles/stadium-background.css、docs/src/ui/browser-save-ui.js、docs/src/engine/browser-save-controller.js、docs/src/engine/game.js。其他產品變更僅config與生成的release-notes。
- 版本1.16.14→1.16.15，PATCH：既有首頁顯示及新規開始流程修正，沒有新養成規則。管理檔為config.js、CURRENT_SPEC.md、CHANGELOG.md、RELEASE_NOTES.md；配信資料由update-release-notes.mjs生成。

## 比較基準與許容差分

- 第0批來源基準 `f08848b337aea28d57f2c55d3318d749cef5a3ff`；origin/main核對為 `d6cef67ef6ac8e348f66f2f5ed32c4fa3d6b7cd1`。歷史不具合測試仍用各自原基準，沒有改成HEAD。
- 新規生涯完整S／遊戲選擇／RNG只允許已驗證的state.version及state.birthHighSchool.createdVersion。存檔流程允許的改變是取消／展開不寫入、確認覆蓋只增1次revision、不先刪檔。careerId與保存時間仍沿既有非遊戲亂數／時間。
- P／jp3-pitcher-02：362操作、746 RNG；IF／jp3-infielder-01：536操作、687 RNG。各control／ui完全一致，並對照第0批原始逐步資料，只排除上述版本metadata後完全相等。最後年度存檔恢復至退休也完全一致。`test-results/ui-phase1-career-02/summary.json`、execution.json均PASS／exit0，清理PASS、無pageerror／Console error／404；原始狀態、選擇、RNG與18張圖片同目錄保存。

## 驗證結果與歷史失敗

- controller：19案PASS，含取消授權、舊revision、慢讀取、第一步拋錯取消已排程capture、保存失敗保留舊career。
- 確定1.16.15首頁聚焦E2E：1440×900、390×844、375×667、320×568、320×300，取消／Escape保留完整舊檔和輸入、回存檔選擇、一次CAS覆蓋、明示刪除、跨分頁衝突及真實開始首步例外PASS。最新證據 `test-results/ui-phase1-home-start-exception/`。
- Quick初輪：86 PASS／1 FAIL／10 BLOCKED，`test-results/ui-phase1-quick-01/summary.json`。BLOCKED為現有測試把channel=chromium對應到此機無法啟動的完整Chromium；FAIL為舊首頁token使用數量／形狀期待值。原紀錄保留。
- Quick重跑：97／97 PASS、exit0，`test-results/ui-phase1-quick-02/summary.json`。該輪為升版前1.16.14工作樹；之後有版本metadata、雙重開始防護、刪除後焦點與首步例外測試補強，不冒充最終SHA的Quick。最終碼另取Full覆蓋。
- 本機忽略的test-results/pw-chromium-adapter以外部模組輸入，僅將channel='chromium'轉為已安裝headless Chromium（151.0.7922.34）的預設路徑；其他launch參數、斷言、timeout、狀態與產品不變。此環境設定不部署，不修改共用Runner或安裝依賴。
- 舊DT09首次因批准的首頁DOM重排47≠41而FAIL。後續首頁改驗自然捲動、卡片邊界、姓名觸控、獨立版本、詳細seed與2×2；所有遊戲內root保留原f8afd8e歷史逐元素斷言。重測78,624元素×設定比較零差異、34選擇器命中，exit0。不是用新HEAD取代舊基準。樣式來源單元亦明列首頁由clamp取代舊token、間距宣告變動，保留其餘凍結值與未定義token檢查。
- `test-results/ui-phase1-career-01/`因命令漏帶外部模組變數未啟動比較，保留exit1，後續使用全新-02目錄。沒有用它作PASS。
- **最終Full：待執行／未驗收**，完成前不宣稱第1批驗收完成。

## 未驗證、回退與交付

- 實機Safari／Android、軟鍵盤、非零safe-area、真正200%瀏覽器縮放未驗證；viewport旋轉／大字級不能代替實機。截圖使用fallback字型，Web Font實際網路載入不作通過宣稱。
- 本機原始JSON／PNG在忽略的test-results，Git只保留文件與收據，不等於完整artifact上傳；既有ARTIFACT_COVERAGE_BLOCKED不結案。
- 回退本批產品提交並沿既有CI重建配信資料；存檔格式未變，不清除玩家IndexedDB／localStorage。回退後開始流程將回到舊先刪檔行為，需明示。
- 本番／main未反映；第1批測試不代表第2批或本番部署授權。

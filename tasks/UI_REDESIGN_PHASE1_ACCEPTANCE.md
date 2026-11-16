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
- **最終Linux Full：127／127 PASS**，0 FAIL／SKIP／BLOCKED、unverified=0。受驗SHA為 `d507e310ebc7560bce592f6671cefe6d94af72b6`，version 1.16.15；[Run 43809957167](https://github.com/tt-chin/yakyujinsei/actions/runs/43809957167)，attempt 1，8批及full-aggregate全部success。已下載 `tests-workflow_dispatch-43809957167-1` 至 `test-results/ui-phase1-linux-full-43809957167/`，核對plan／summary及各批受驗SHA、版本、127個入口全PASS。Node 24.15.0、Playwright 1.62.1、Chromium 151.0.7922.34；使用既有workflow與timeout，沒有部分重跑冒充Full。
- **本機Full：122 PASS／5 FAIL**，exit1，`test-results/ui-phase1-full-01/`。全部8批跑完且來源未變、未觸發resourceBlocked；FAIL原件不刪除、不改寫：KBO續約達180秒入口上限；入團收入六條生涯比對通過後Console有一次ERR_CONNECTION_CLOSED（未記URL）；event-system在第三條生涯導航load達30秒；championship-intl出現ERR_NETWORK_IO_SUSPENDED及本機game.js動態載入失敗；design-tokens-07等載入達30秒。這些是本機執行／載入失敗症狀，不稱已定位或修好Windows環境根因。相同SHA的Linux完整Full全部通過，兩平台結果分開記錄。
- 舊存檔實測：以固定 `f08848b337aea28d57f2c55d3318d749cef5a3ff` 完整舊來源在隔離瀏覽器建立P／IF 1.16.14認證存檔，再於同來源切換1.16.15新UI恢復。完整S、年度起點後RNG、原始認證row逐字相等，沒有保存遷移／覆寫。`test-results/ui-phase1-old-save/summary.json` PASS、exit0。
- [UI_REDESIGN_PHASE1_EVIDENCE.json](UI_REDESIGN_PHASE1_EVIDENCE.json) 保存本機／CI摘要、比較資料、截圖、探針及環境轉接的檔名／大小／SHA256。正式Full受驗碼之後只補文件／收據；產品與測試樹相同，不將受驗SHA改稱文件提交SHA，無需因純文件補記再跑Full。

## 未驗證、回退與交付

- 實機Safari／Android、軟鍵盤、非零safe-area、真正200%瀏覽器縮放未驗證；viewport旋轉／大字級不能代替實機。截圖使用fallback字型，Web Font實際網路載入不作通過宣稱。
- 本機原始JSON／PNG在忽略的test-results，Git只保留文件與收據，不等於完整artifact上傳；既有ARTIFACT_COVERAGE_BLOCKED不結案。
- 回退本批產品提交並沿既有CI重建配信資料；存檔格式未變，不清除玩家IndexedDB／localStorage。回退後開始流程將回到舊先刪檔行為，需明示。
- 第0批文件提交 `0e410bd`，第1批產品提交 `d507e310ebc7560bce592f6671cefe6d94af72b6`，均在codex/ui-redesign；已推送origin同名分支。dev／main未合併，本番未反映。
- 分支Preview未取得：GitHub沒有Cloudflare部署check，推定的分支alias之config.js實際回404，未將其當作有效Preview或推測設定原因；未變更Cloudflare設定。固定dev Preview未反映此功能分支，不能拿它驗收本批。
- 第1批實作與上述自動驗證完成；使用者視覺／Preview確認及實機驗收仍待進行。第2–5批未實作，測試不代表下一批或本番部署授權。

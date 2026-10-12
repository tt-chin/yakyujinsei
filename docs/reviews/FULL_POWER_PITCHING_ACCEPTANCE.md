# 全力投球最小修正驗收

2026-10-13。dev基準20920dddd72ab8c91b0e2c71d560492663cd5aec（1.11.8）。修正後1.11.9 PATCH。本機執行時HEAD仍為基準、使用實作工作樹；提交完整SHA及遠端受驗headSha以Git履歷和[BACKLOG最新證據](../../BACKLOG.md)為準，與本機基準區分。

## 範圍與批准

使用者批准只改callback的S.effort寫入、全力路線可追溯的成績／TJ與後續RNG分支差異，以及不放寬非預期差異的必要測試相容性調整。[設計書](FULL_POWER_PITCHING_MINIMAL_FIX_DESIGN.md)。

game.js只改`全力投`→`全力投球`一個callback字串；config.js升PATCH，CHANGELOG只描述修復。係數、公式、直接R呼叫、S.lastD時點、初始及舊值fallback都不變。CURRENT_SPEC僅補已實作的投球強度說明。main／正式網站／workflow／RNG演算法不改；研究100條原始資料不重算或覆寫。

## 修復前與局部驗收

- `node tests/full-power-pitching.test.mjs --output=test-results/full-power-before-confirmed.json`：41 PASS／1 FAIL（實際全力callback寫入全力投），exit1。首次fixture調試的VM跨realm陣列及checkGoldclothSeason依賴問題另保留full-power-before.json，不算遊戲Bug。
- 同一原生測試修正後42 PASS／0 FAIL、exit0，full-power-after.json。涵蓋callback、三角色原生proSeason及事件、clamp／round、TJ手術史與50／100門檻、全休／野手、舊fallback及原始simSeason同R序列。控制fixture明確標示，不冒充自然採樣。
- 初回Quick47 PASS／0 FAIL／0 SKIP／0 BLOCKED、218.664秒、exit0，test-results/full-power-quick-v1。這輪VERSION仍1.11.8且後續測試工具仍在完善，不冒充確定版最終Quick。
- 原生瀏覽器fixture最終full-power-fixtures-v5：29 PASS／0 FAIL／Console・pageerror0／JS-CSS4040，exit0；Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39，1280／320／390×三角色×三強度及rubber有無的TJ手術後繼續。斷線browser profile清理逾時warning保留，不是遊戲錯誤。
- 環境與工具調試紀錄保留：initial為沙箱loopback拒絕；v1／v2為測試重複觀測注入與template轉義；v3的TJ fixture缺年度佇列，v4雖29案斷言通過但4個Console/pageerror使整體exit1（fixture合約從下一年生效，現行契約防護正確拒絕本年結算）。v5僅修fixture的startYear／queue，沒有修改契約引擎或忽略錯誤。

## 歷史測試相容性

`contract-salary-e2e --only=career --compare=20920dddd72ab8c91b0e2c71d560492663cd5aec`實際1 PASS／1 FAIL、19.954秒、Console0：IF全狀態一致，P因全力新效果違反舊一致oracle。證據保存test-results/full-power-contract-before-control/summary.json及原native契約case日誌，不將其失敗改寫為PASS。

以下七個既有入口的生涯操作器增加真實UI「通常投球」優先：contract-salary、draft-income、display-preferences、trait-display、international-personal-stats、kbo-renewal、hof-first-ballot。兩側比較採相同新策略，沒有改baseline source或SHA、沒有改fixture政策、沒有新增S欄位排除或刪除完整S／選擇／R斷言。KBO原始2049負面Seed為IF，此調整不改其路線；舊歷史報告數字保持。原全力負面與新全力專項分開。

manifest只新增full-power-pitching-e2e為Full／Audit；新*.test.mjs循既有分類進Quick／Full／Audit。Runner／CI不改，list登錄73檔、66自動入口（含syntax）；不是把所有入口都放Quick。

## 修正後本機驗收與保留的失敗

- 原生最終53 PASS／0 FAIL，含新增11個四聯盟／MiLB階層；同一53案對20920dd原始source重新執行為52 PASS／1 FAIL，失敗仍只有全力callback。檔案full-power-native-final.json／full-power-before-final.json。
- 1.11.9 Quick初回46 PASS／1 FAIL、222.004秒：verify-modularization仍硬編碼1.11.8；只將版號斷言與訊息同步1.11.9，模組、URL、RNG固定值斷言不刪改。重跑Quick為47 PASS／0 FAIL／0 SKIP／0 BLOCKED、227.416秒、exit0（full-power-quick-v2）。
- Windows Full：64 PASS／1 FAIL／0 SKIP／0 BLOCKED、3307.699秒、exit1（full-power-full-stable）。**不將此輪稱為Full PASS。** 唯一失敗draft-income的歷史生涯操作器仍選全力；先前的策略調整改到另一個入團操作器，沒有作用於該完整生涯迴圈。保存的67MB baseline／current快照首次effort差異在第57筆（全力投／全力投球）。比較／錯誤輸出階段出現Array buffer allocation failed，不據此認定遊戲記憶體Bug。
- 只修正真正的歷史生涯操作器選通常投球，另一個無關入團操作器恢復原碼。加入既有findFirstDifference的路徑診斷，先以簡短路徑判斷，再保留原完整deepEqual；不忽略任何新S欄位、不更換baseline。`draft-income-e2e --careers-only --baseline=e886e84ca08c6c185406cac9d6f3c4376277061a`重跑9 PASS／0 FAIL、436.223秒、exit0，包含原生付款2案、P/P/P/C/IF/OF六完整歷史生涯及Console／JS-CSS4040。原Full失敗log／快照保持，不用部分重跑改寫原Full結果。
- 新專項在Full實際36 PASS／0 FAIL／Console・pageerror0／JS-CSS4040，入口932.86秒。27組角色／強度／尺寸＋2 TJ後續＋7固定Seed案，合計20次完整生涯執行。MR／CL實際選留牛棚並完成配分，320／390使用tap。完整S摘要、逐次R before/after/value、完整退休S、第一個選項前後S及首個R消耗分支都保存tmp/full-power-pitching。
- 先前v5僅為控制fixture驗證；角色會議／tap補強後1.11.9 v6仍29 PASS／0 FAIL／errors0。最終完整36案包含這些補強，不把早期調試冒充最終流程驗收。
- 既有Full其他入口實際通過，包括381契約、89能力、5交易、17安全、50國際成績、18特性顯示及KBO／ACT／選秀／退休；其預期fault injection日誌與正常Console0分開。被中止的Full-v1／full-final／v2為語法調試或測試清單完善，NOT_COMPLETED，不列Full PASS。

## 固定Seed與RNG證據

新專項只排除VERSION；不刪stats、收入、契約、traits或歷史。歷史game.js加唯一callback修正應完全等於當前game.js的斷言亦通過。

- yakyo-test-001/P：通常362操作／728R、2047退休；省エネ397／858、2050退休。兩者與原始20920dd逐操作完整S摘要、選擇、全R列及最終S一致，新版重跑一致。
- jp3-pitcher-02/P：通常386／735、2048退休；省エネ431／857、2051退休，同樣全量一致及新版重播一致。
- jp3-infielder-01/IF：387／639、2049退休，全量對照一致。
- 全力yakyo-test-001：舊362／728、修正520／876、2058退休。首個S差異為2029年第63操作的effort；訓練R消耗不變，該操作其他S欄位相同。首次補正前st及完整R前綴相同；最終ER21→20、ERA7.809917→7.438017（既有事件後ER/IP normalize，非直接減0.25），d−6.666667→−5.666667，TJ增加5.157895→6.447368；TJ累積本身R0。
- 全力jp3-pitcher-02：舊386／735、修正530／830、2058退休。首個S差異2029年第65操作；首次前綴同樣一致，SO75→80、ER33→31、d−2.666667→−1.666667，TJ5.315789→6.644737，本身R0。
- 首次每操作R消耗分支差異兩例都在2036年「今季の成績を見る」：yakyo舊TJ39.473684→45.526316未達50，新49.342105→56.907895進TJ選擇；該操作R332→舊359／新353。jp3舊39.789474→46.157895，新49.736842→57.697368；R311→舊333／新331。兩例在TJ累積前R完全同值同位置，新版開啟既有TJ選項、延後後續流程，沒有加入R呼叫。後續不同選擇／能力／契約／年度與完整生涯R差異均屬批准範圍；新版再次完整執行的S／選擇／R列完全一致。

## 最終遠端放行及限制

因本機Full保留一項已修正測試的失敗，最終放行仍需要在確定提交上重新完整執行Full；不能只靠9案重跑稱全套PASS。將使用既有dev Linux Full workflow作確定來源的完整驗證；不改workflow、不建立Draft PR。CI／Preview實際Run、headSha、PASS／FAIL／BLOCKED與後續純文件SHA補記在[BACKLOG](../../BACKLOG.md)，本報告不預先宣稱遠端成功。若Full／Preview無法驗證，修復ID保持未完成。

本機Game原始位元SHA256為a43d74bce291a6355b6ae4946c043e28a89978a8f81de739b5863166da3717e4、config為155188ea9d6ee840084d4183206f4895e8db26f12d97ccad05c538f3de4e14ed（Windows換行；配信以正規化LF比較）。Full起始fingerprint保留；版號靜態斷言、fixture會議操作及draft相容性修正發生在整輪不同時點，因此不將其起始fingerprint冒充最終提交。最終Linux Full須使用完整提交SHA，獨立確認所有預定入口。

命令使用既存外部Playwright引數，不在程式埋入個人路徑，不安裝依賴。Full只執行現有適用入口與本專項，沒有Audit／4,000生涯／追加200條採樣。手機尺寸模擬不是實機。

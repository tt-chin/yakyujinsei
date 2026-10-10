# BUG-KBO-RENEWAL-FLOOR 修復・驗收記錄

日期：2026-10-10。Repository：tt-chin/yakyujinsei；Branch：dev。

修復前 HEAD：`f3efb0ad80984422b5a42d9f86c04127f9404952`（遊戲檔案與`a4aa83c48a48a1567bf3b14ceea6e4c76c87b76b`相同）。版本1.11.2 → 1.11.3，PATCH：僅修正核准既有最低額的套用順序，不是新薪資政策。main保持`421e036bb206a11828a696a4f8b0d3909385441f`／1.10.2，不合併、不正式部署。

## 1. 根因與第一次實際輸入

讀取AGENTS、CURRENT_SPEC、BACKLOG、CHANGELOG與BACKLOG_ACCEPTANCE_AUDIT後，在原版執行Seed `jp3-infielder-01`、IF、與championship-intl-e2e的`--balanced`完全相同的選擇策略。只加入測試觀察器；自然生涯不强制成績、路線、RNG或狀態。390次操作後第一次例外即停止，不連打復原選項。

2049年、39歳、KBO一軍降格至二軍後滿期續約。呼叫路徑：降格選擇 → `applyDemotionSalary`／`markClubInitiatedRenewal` → `advance` → `finalizePendingOffseasonSalary` → `salaryCandidate` → `applyKboForeignPackageCap`。

`salaryFor(KBO2, -5.75)`已在曲線階段採8,000,000円最低額，`salaryCandidate`隨後乘DH守備位置倍率0.92，得到7,360,000円。跨聯盟路線會再補最低額；此次同聯盟更新不經該路線。package helper原本只取候選與上限的較小值，沒有先补最低額；因此把「候選太低」誤當成「上限容納不了最低額」。

第一次候選及helper完整輸入（JPY，非萬元）：

```json
{
  "year":2049,"age":39,"level":"KBO2","currentSalary":168210000,
  "candidate":{
    "sourceLevel":"KBO2","targetLevel":"KBO2","rating":-5.75,
    "convertedRating":-5.75,"baseSalary":8000000,"raw":7360000,
    "contractMult":1,"positionMult":0.92,"injury":1,
    "transferType":"TRANSFER","previousSalary":168210000,"cross":false
  },
  "input":{
    "annualSalary":7360000,"signingBonus":0,"postingFee":0,
    "incentiveRate":0.07,"isRenewal":true,"previousPackage":179980000,
    "levelMinimum":8000000
  },
  "packageCap":215976000,"calls":646,"rngState":269597384,
  "code":"KBO_PACKAGE_FLOOR_CAP_CONFLICT"
}
```

上一約package＝168,210,000年俸＋11,770,000最大出来高＝179,980,000円。更新cap＝min(300,000,000, max(150,000,000, 179,980,000×1.20))＝215,976,000円；扣除固定成本後可容納年俸上限201,840,000円。二軍最低8,000,000＋560,000最大出来高＝8,560,000円，明顯未超cap。

第一次例外時的完整`S.ct`（保留已付款後annualSalary=0與實際保障年表，不拿0推測前薪）：

```json
{
  "schemaVersion":3,"contractId":"KBO:KBO_DAEGU_LIONS:2041:009",
  "org":"KBO","teamId":"KBO_GWANGJU_TIGERS","signedYear":2041,
  "startYear":2042,"endYear":2049,"years":8,"remainingYears":0,
  "contractType":"OVERSEAS_FA","signingBonus":0,"signingBonusType":"NONE",
  "developmentStipend":0,"postingFee":0,"postingFeeRecipient":null,
  "signingPaymentStatus":"PAID","annualSalary":0,
  "annualSchedule":[
    {"year":2042,"amount":140180000,"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-1","paid":true},
    {"year":2043,"amount":140180000,"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-1","paid":true},
    {"year":2044,"amount":140180000,"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-1","paid":true},
    {"year":2045,"amount":168210000,"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-2","paid":true},
    {"year":2046,"amount":168210000,"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-2","paid":true},
    {"year":2047,"amount":168210000,"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-2","paid":true},
    {"year":2048,"amount":168210000,"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-2","paid":true},
    {"year":2049,"amount":168210000,"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-2","paid":true}
  ],
  "segments":[
    {"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-1","type":"OVERSEAS_FA","signedYear":2041,"startYear":2042,"endYear":2044,"annualSalary":140180000,"years":3,"guaranteedValue":420540000},
    {"segmentId":"KBO:KBO_DAEGU_LIONS:2041:009:seg-2","type":"EXTENSION","signedYear":2043,"startYear":2045,"endYear":2049,"annualSalary":168210000,"years":5,"guaranteedValue":841050000}
  ],
  "guaranteedTotal":1261590000,"paidTotal":1261590000,
  "signedMarketRating":14.159999999999997,"positionMultiplierAtSigning":0.92,
  "contractMultiplier":1,"injuryProtection":"FULL",
  "incentive":{
    "annualMax":11770000,"rate":0.07,
    "fullAwardCodes":["MVP","BEST_PITCHER","SAWAMURA","TITLE","GOLD_GLOVE"],
    "halfPayDThreshold":3
  },
  "offerBreakdown":{
    "annualSalary":140180000,"marketSalary":235345200,"previousSalary":204580000,
    "anchorSalary":204580000,"routeAdjustedMarket":235345200,"routeMultiplier":1,
    "routeWeight":0.65,"raiseCap":613740000,"hardAnnualCap":null,
    "reasonCodes":["CROSS_LEAGUE_MARKET_ADJUSTMENT","PREVIOUS_SALARY_ANCHOR","LEAGUE_REGULATORY_CAP"],
    "eligibilityType":"NORMAL","incentiveMax":9810000,"packageCap":150000000,
    "capApplied":false,"foreignCategory":"FOREIGN_STANDARD","finalAnnualSalary":140180000
  },
  "extOffered":true,"remainingValue":0
}
```

當季末的最後操作依序包含一般事件、健康診斷、「今季の成績を見る」、不滿選擇及「KBOフューチャースへの降格を受け入れ、再起を目指す」。完整390筆操作（年度、階層、標籤、RNG與全狀態SHA-256）、第一例外完整S／S.ct由新增E2E寫至系統暫存目錄`yakyujinsei-kbo-renewal/first-failure.json`；修復全生涯另存`fixed-career.json`。暫存檔不是遊戲存檔功能，重跑測試可重新產生。

## 2. 最小修復與檔案

- `docs/src/engine/cross-league-market-policy.js`：僅`applyKboForeignPackageCap`的一行計算與兩行註解；候選先max既有levelMinimum，再使用原cap、7%及萬元捨入驗證。`salaryCandidate`和`fixedContract`已共用此helper，不另改呼叫路線。
- `tests/kbo-renewal-floor.test.mjs`：新增快速10組回歸，包含原生候選、簽約、movement及續約確定函式。
- `tests/kbo-renewal-e2e.mjs`：新增首次失敗／完整自然生涯／固定seed／跨尺寸／原生付款去重驗證。觀察器與人工fixture只在測試server／route注入。
  遠端初次執行在全部斷言完成後發生收尾未退出；只停止當次專用Node，補上15秒收尾上限。嚴格收尾模式重跑同樣全部遊戲斷言通過，但回報BROWSER_CLOSE_TIMEOUT／exit 1，不把該CLI結果列為PASS。診斷日誌確認Chrome原生程序已exitCode=0、卡在Playwright暫存目錄清理；quick診斷則正常清理並exit 0。Edge亦出現相同暫存清理超時。
  最後區分功能與環境收尾：只有公開API `browser.isConnected() === false`（已斷線）時，暫存清理超時才獨立記BROWSER_CLEANUP_WARNING；仍連線的瀏覽器或任何遊戲斷言失敗仍exit 1。不清除原failure、不修改遊戲預期或縮減完整生涯比較。此警告不是遊戲測試PASS以外的環境全面正常保證。
- `tests/npb-return-ui.test.mjs`、`tests/championship-intl.test.mjs`：歷史全檔案相等檢查僅明確允許此次確切三行KBO差分，其餘仍與原Git baseline逐字一致。未改遊戲預期值、未整批換baseline；新的最小回歸對原版仍FAIL。
- `tests/verify-modularization.mjs`：隨版本更新其既有明確版號斷言及輸出為1.11.3；RNG預期值與其他檢查不改。升版後曾因仍斷言1.11.2而FAIL，與遊戲行為無關；同步版號後重新執行全部入口。
- `docs/src/config.js`、`CHANGELOG.md`、`CURRENT_SPEC.md`：更新1.11.3及最低額套用順序。CHANGELOG只記實際修復，不記測試／部署狀態。
- `BACKLOG.md`：移出未完成KBO項目，列為此修復範圍PASS；依使用者同意一併提交既有改訂6整理。其餘原有未完成項目、文字與歷史驗收數量不改。
- 本報告：保存根因、首次輸入、對照方式與風險。原BACKLOG_ACCEPTANCE_AUDIT仍為修復前歷史快照，不覆寫FAIL證據。

## 3. 最小回歸：10組PASS

1. KBO一軍正常續約50,000,000不變。
2. KBO二軍正常續約12,000,000不變。
3. 實際DH候選7,360,000補至8,000,000。
4. 一軍36,800,000與0候選補至40,000,000。
5. 接近新加入cap的四種候選保留1萬円捨入且總package合法。
6. 續約最高300,000,000與固定契約金／球團費用扣除規則不變。
7. 真正最低額／cap衝突和固定成本超cap仍報原錯誤，不強行成立合約。
8. 原生salaryCandidate及fixedContract套最低額，既成立合約不改。
9. 合約滿期→降格→原生movement→更新；沿用75%減俸保護，2050年年俸126,160,000，簽約一次。
10. 同choice token重複執行與重複finalize不加契約／履歷；markSalaryPaid的第二次支付被拒絕。

原生browser另驗證phaseEnd支付新約2050年126,160,000円一次，careerBaseSalary／careerEarnings各僅增加一次，年度年表paid=true，第二次執行全S／進行／RNG不變。320／390px是Chrome手機模擬，不宣稱實機Safari。

## 4. 指令與實測結果

環境：Windows、Node 24.15.0、Playwright Chromium `channel:chrome`（Chrome 155），靜態本機server；未增加npm依賴。

- `node tests/kbo-renewal-floor.test.mjs --baseline=f3efb0ad80984422b5a42d9f86c04127f9404952`：預期FAIL；前兩組PASS，第三組以原KBO_PACKAGE_FLOOR_CAP_CONFLICT失敗。
- `node tests/kbo-renewal-floor.test.mjs`：10組PASS。
- 所有34個`tests/*.test.mjs`＋既有5個standalone（career-movement-policy、domestic-tournament-policy、hall-of-fame-policy、salary-promotion-policy、verify-modularization）：升版前39入口PASS／0FAIL／0SKIP，9.986秒；版號斷言同步後39入口PASS／0FAIL／0SKIP，8.044秒。
- 全部`docs/src/**/*.js`、`tests/*.mjs`的`node --check`：95檔PASS／0FAIL，升版後9.811秒。`git diff --check` PASS。
- `node tests/kbo-renewal-e2e.mjs --playwright=<PLAYWRIGHT_MODULE_PATH>`：原版第一次失敗、修復均衡全生涯兩次、未受影響P／IF各舊新版一組、PC1280／320／390px原生合約・連打・年度付款，共10組PASS，22.104秒；原版錯誤單獨記錄，不混入新版Console計數。新版Console／JS・CSS404皆0。
- `node tests/npb-return-e2e.mjs --quick --playwright=<PLAYWRIGHT_MODULE_PATH>`：22個原生movement／契約／更新／延長／FA／降格／復歸fixture PASS；1280／320／375／390／430px各24種設定、幾何與橫豎切換PASS；Console／JS・CSS404皆0。
- `node tests/championship-intl-e2e.mjs --ui-only --playwright=<PLAYWRIGHT_MODULE_PATH>`：1280／320／360／390px原生季末・四聯盟・付款去重・國際特性・退休・PNG PASS；Console／JS・CSS404皆0。未重跑此舊測試的所有六seed／十二策略完整矩陣，不假定全面PASS。

### 固定Seed及必要差異

- `jp3-infielder-01/IF --balanced`：原版2049年初次例外，RNG646／rngState269597384；修復後404操作、RNG677、2050年正常退休。前390操作的全S雜湊（只排除VERSION）、選擇、RNG完全一致；第一次候選修正當刻RNG仍646／269597384、舊ct完全一致。新版重跑兩次全S／操作／RNG一致。
- 此路線必要差異：不再報錯、候選補最低8,000,000，沿既有減俸保護建立2050年126,160,000新约並繼續至退休。677比失敗時646多31次是原本未能到達的後續正常進行，不稱原版與新版最終RNG相等；helper本身不消耗亂數。
- `yakyo-test-001/P`一般策略：舊新完整生涯全S／操作／RNG完全一致（只排除VERSION），RNG652。
- `jp3-infielder-01/IF`一般策略：舊新完整生涯全S／操作／RNG完全一致（只排除VERSION），RNG549。
- 無調整KBO上限、最低額、薪資倍率、position倍率、7%、合約年數、其他聯盟薪資、RNG／seed-only URL，也不改舊約已付或未付保障年表。

## 5. Preview與殘餘範圍

修復commit：`8a7dcfcf3816e719b25f8a98c63880f345c741fc`，已push至origin/dev。Cloudflare Pages該SHA check completed／success，deployment ID：`349ff890-b205-4f23-8bcc-8d60665f9b27`。

2026-10-11在`https://dev.yakyujinsei.pages.dev`執行同一完整E2E：`node tests/kbo-renewal-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --playwright=<PLAYWRIGHT_MODULE_PATH>`（不加quick）。先逐一比對47個tracked HTML／JS／CSS與上述SHA相同才執行，不以版號就假定最新。

Preview功能斷言：47／47資產一致；原版首次失敗對照、新版均衡全生涯兩次、P／IF完整生涯對照、PC1280／320／390px原生滿期・降格・更新・連打・付款去重，共10組PASS。首輪功能耗時32.070秒；Chrome診斷31.971秒、Edge155.0.4283.45重跑34.471秒，後兩輪嚴格收尾為FAIL（僅暫存清理），不混稱完整CLI PASS。404操作／RNG677／2050退休、390筆前綴全狀態及RNG一致、P652／IF549完全一致；Console／JS・CSS404皆0。截圖停用動畫以避免卡片入場過渡遮淡畫面，僅測試截圖設定，配信內容未改。

最終測試程式在Chrome155.0.8059.39完整重跑：上述10組功能斷言PASS、31.827秒，exit 0；收尾独立WARN 1（browser已斷線、暫存清理超時）。沒有遊戲FAIL或SKIP，不把收尾WARN說成清理PASS。

本機與Preview的本次遊戲修復驗收PASS；本報告補記、BACKLOG相關舊FAIL引用同步不再改遊戲檔案。其最後dev SHA由交付訊息提供。

風險／未處理：真正floor／cap政策衝突仍按既有錯誤拒絕，需要另行批准才能改平衡；Windows的Playwright暫存profile清理偶發超時，已獨立記錄，不保證暫存目錄皆立即清除；Safari／Android實機未驗；其他BACKLOG項目與全量退休樣本未在本次處理。無推測遷移既有契約或新增存檔功能。自然均衡重現生涯正常退休，未發現額外独立阻塞。

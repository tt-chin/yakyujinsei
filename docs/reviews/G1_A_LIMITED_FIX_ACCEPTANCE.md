# G1-A 限定前置修正驗收

2026-10-14；**G1-A：PASS / ACCEPTED**。使用者已正式接受限定修正及Full期待值修正，並授權提交dev；不代表完整G1、G1-B或G2～G9授權，不代表發布或授權push／部署。

目前結案證據見文末「G1-A正式結案」。下列初次修正與65 PASS／2 FAIL紀錄為歷史快照，完整保留，不與最後48／67入口PASS混用。

## 基準與保全

branch dev；HEAD `554d54a94352b7dbc86473084a65b56bef74d3b7`；VERSION 1.12.0（docs/src/config.js）。
修前game.js SHA256 `aceb42d48b5431e3c1ea0cb999a816c0d27dcdd89dc4094b8cf67c91857869e6`；
修後game.js SHA256 `4b7d893b44d4cf943ff7c017c8bbca73474e5b5ae9bd8513455a80ae18315629`。
自然生涯修前route取同HEAD的git show原始LF內容，SHA256為`18bf6e3b8619dcdf41099995bc7ab6a40c15c9de0cef6f31a33baabc85dfdcb5`；只將LF轉checkout的CRLF即精確得到上列修前磁碟hash。這是換行格式差異，不是舊引擎改造或規則差分；原生fixture修前直接取磁碟內容。兩種來源與hash分開記錄。
Windows／Node24.15.0／Chrome155.0.8059.39／外部Playwright1.62.1。未安裝新依賴。
開始已有D2設計新增4行及未追蹤tasks/；保留原內容。本任務不改D2、Gate、薪資/HOF模組或歷史報告/results。
因G9版本/發布尚未授權，保留1.12.0及CHANGELOG，這是待審未發布的限定修正，不宣稱新版已發布。未Commit/Push/Merge/Deploy，無CI觸發。

## 修正

只修改[game.js](../src/engine/game.js)內兩個判斷：

- phoenix：補四聯盟有效honor全文中的最優秀投手賞／首位打者／本塁打王。保留glass且未phoenix、解除glass、pool+8一次。
- movement：補最優秀投手賞／首位打者／ゴールデングラブ賞的當年度保護；不改goodReal／能力／績效／降格公式。
- 新補正以完整「年度＋聯盟顯示名稱＋賞名」相等，不用substring/王/MVP猜新增名稱。
- 既有legacy／範圍外regex原樣保留，以保持AF08的既有國際/團隊/歷史及同年跨league作用。本任務沒有完成完整ID adapter，也沒有把未知历史資料重新分類；全consumer精確切換留待另授權的G1-B。
- GoldGlove不新增phoenix；All-Star不新增兩種資格。最優秀投手賞仍原名原ID語義，未轉P02/P08。沒有任何新獎producer/Decision/Receipt/hash。

## 修正前失敗與修後結果

[隔離原生fixture](g1-a-validation/fixtures.mjs)沿舊驗證器的原生函式抽取與實際日本版RNG。舊檔不改；[修前32案](g1-a-validation/before-fixtures.json)在改產品前實際執行，[修後32案](g1-a-validation/after-fixtures.json)同輸入同seed比較。

- 修前政策25 PASS／7 FAIL；觀測斷言32 PASS只是證明重現，不是Bug PASS。
- 修後政策32 PASS／0 FAIL。A03最優秀投手、A04首位打者、A05本塁打王：glass解除、phoenix取得、pool7→15，各原賞R2不變。
- B03-bad最優秀投手、B04-bad首位打者、B06-badGoldGlove：wonAward false→true，不再進native降格handler；R0不變。
- B08-55chance：原能力尚可但低績效分支，保護命中後原chance55被跳過，R1→0。這是明確因果短路，不新增R、不回滾R。
- 其餘25案終態S完全相等，含MVP／新人王、goodReal、過去年、All-Star／GoldGlove復活排除、多賞與已phoenix一次性。
- [before-extended](g1-a-validation/before-extended.json)／[after-extended](g1-a-validation/after-extended.json)：另加四聯盟完整honor及相似名/P02/P08排除48案。總80案：修前49 PASS／31政策FAIL，修後80 PASS／0 FAIL。這48案是人工歷史honor fixture，不冒充自然producer。
- [before-history](g1-a-validation/before-history.json)／[after-history](g1-a-validation/after-history.json)：舊最佳投手／打擊王／全壘打王／金手套各復活／降格共8案，修前後相容。這組包含原32案，40案不得與80案重複相加；本輪unique native fixture共88案，修後全PASS。
- [比較工具](g1-a-validation/compare.mjs)／[比較結果](g1-a-validation/comparison.json)：32組honors與保障契約完全相等；直接執行市場賞加成、薪資fallback、HOF與incentive函式，其結果相等。fixture沒有實際接受降格或付款，不能稱完整支付E2E。

## 固定Seed自然生涯

[瀏覽器工具](g1-a-validation/careers.mjs)只route插入觀察者，使用原主R及真實DOM callback；不修改S/能力/聯盟/成績。每条修前及修後各跑兩次同源重播，保存完整S、逐操作、awards/movement邊界、每個R值及前後rngState。
投手能力順序優先vel/ctl/brk；IF另記均衡配點；投球強度及選項優先順序寫入工具，不在產品修改後調整策略。

- yakyo-test-001／P／通常／1280px：520操作、825R，修前後完整S／選項／R一致，重播PASS。
- jp3-pitcher-02／P／省エネ／320px：304操作、606R，修前後一致，重播PASS。
- jp3-pitcher-03／P／全力／390px：335操作、671R，修前後一致，重播PASS。
- jp3-infielder-01／IF／均衡／1280px：413→422操作，637→637R；不是修前後完全同路。2042第279操作的原awards邊界，輸入S與抽選完全相等，輸出僅glass/phoenix/removed/pool不同。首位打者/本塁打王使復活與8點生效，增加配分及延後movement。
- IF全637個主R值／rngState序列相等，但它們在UI操作中的消耗窗口不同；後續能力、成績及榮譽不同屬效果因果，不稱遊戲結果不變。
- IF生涯固定年俸301,050,000円／契約金30,430,000円不變；出来高6,260,000→7,430,000円，總收入351,390,000→353,010,000円，退休年2050相同。薪資／獎金公式未改；後續榮譽與收入差異保存於comparison.json，不捏造相等。
- 總收入增加1,620,000円＝出来高增加1,170,000円＋スポンサー事件增加450,000円。後者是2045年JP_EVT_092/bold一次既有事件，incomeLedger transactionId=2045:50:92；原2043:42:92的450,000円保持。corpIncome13,200,000円／developmentStipend0／buyout0不變，不是年俸或契約金重複支付。
- 三投手分類UNCHANGED_LEGACY；IF分類INTENDED_BUG_FIX；沒有接受UNEXPLAINED差異。四条修後同版完整重播PASS，Console／JS/CSS404各0，三尺寸無横溢出。

最初集中配點的IF未進職業，基線前置斷言FAIL，保留test-results/g1-a-before-native/jp3-infielder-01-IF.json，不當職業PASS。改在產品修正前使用均衡策略，兩次正常職業生涯完成；未改遊戲或Seed。
最初沙箱瀏覽器loopback被ERR_NETWORK_ACCESS_DENIED阻擋，保留test-results/g1-a-before/；獲准隔離環境重跑。部分Chrome斷線後profile清理超時有warning，未冒充Console錯誤或遊戲失敗。

## 命令與日誌

```text
node docs/reviews/g1-a-validation/fixtures.mjs --mode=before --output=docs/reviews/g1-a-validation/before-fixtures.json
node docs/reviews/g1-a-validation/careers.mjs --mode=before --baseline=554d54a94352b7dbc86473084a65b56bef74d3b7 --output=test-results/g1-a-before-native --playwright=<external> --browser=chrome
node docs/reviews/g1-a-validation/careers.mjs --mode=before --only=IF --baseline=554d54a94352b7dbc86473084a65b56bef74d3b7 --output=test-results/g1-a-before-if-balanced --playwright=<external> --browser=chrome
node docs/reviews/g1-a-validation/fixtures.mjs --mode=after --output=docs/reviews/g1-a-validation/after-fixtures.json
node docs/reviews/g1-a-validation/fixtures.mjs --mode=before --source=554d54a94352b7dbc86473084a65b56bef74d3b7 --extended=true --output=docs/reviews/g1-a-validation/before-extended.json
node docs/reviews/g1-a-validation/fixtures.mjs --mode=after --extended=true --output=docs/reviews/g1-a-validation/after-extended.json
node docs/reviews/g1-a-validation/careers.mjs --mode=after --baseline=554d54a94352b7dbc86473084a65b56bef74d3b7 --before-output=test-results/g1-a-before-native --before-if-output=test-results/g1-a-before-if-balanced --output=test-results/g1-a-after --playwright=<external> --browser=chrome
node docs/reviews/g1-a-validation/compare.mjs --careers
node scripts/test.mjs quick --playwright=<external> --browser=chrome --output=test-results/g1-a-quick
node scripts/test.mjs full --playwright=<external> --browser=chrome --output=test-results/g1-a-full
```

Quick 48入口PASS／0FAIL／0BLOCKED，239.259秒。Full實際執行67入口（無reuse）：65 PASS／2 FAIL／0 BLOCKED／0 SKIP，2872.245秒，exit1，**Full不是PASS**。契約/年俸381案、ACT完整生涯、事件552分支及六seed、KBO、能力/交易安全、HOF、顯示/退休等入口通過；兩失敗如下，不修改期待值遮掩。

### Full兩個FAIL的原因與隔離追蹤

1. full-power-pitching-e2e：35案PASS／S03-IF-unchanged 1案FAIL。
2. international-personal-stats-e2e：49案PASS／fixed-career-jp3-infielder-01 1案FAIL；國際成績fixture、T14、其餘5條生涯與國際覆蓋均PASS。

兩者對jp3-infielder-01／IF採優先攻擊能力的均衡配點，仍要求與原歷史引擎全生涯完全相等。Full第一差異是第265操作、2041 NPB1「今季の成績を見る」，修前後before digest與先前R一致，年度成績輸入相等；同年實得首位打者而無MVP。修後解除glass／取得phoenix／pool0→8，影響後續成績與薪資，不能再要求原生涯一律相等。

[隔離診斷](g1-a-validation/diagnose-full-control.mjs)只在記憶體讀取原full-power測試，保留原baseline、操作策略、assert.deepEqual及exit1；只執行失敗IF一案，加只讀awards前後觀察。**沒有修改正式測試**。原失敗仍重現0PASS／1FAIL，並保存完整狀態。comparison工具另驗第一個不同awards邊界：輸入S完全相同，輸出除glass/phoenix/removed/pool之外完全相等；原賞R窗口387→391相同，全生涯639個R值及rngState相同。

國際成績失敗入口的修後完整S／選項／639個R與該診斷完全相同，確認是同一因果差分，不是本大会個人成績生成Bug。原歷史baseline均保留，未替換成HEAD。此為INTENDED_BUG_FIX／舊完全相等期待不再適用，不代表Full已綠；正式測試相容性調整尚未獲批准。

診斷命令：`node docs/reviews/g1-a-validation/diagnose-full-control.mjs --output=test-results/g1-a-full-control-diagnostic --playwright=<external> --browser=chrome`（原斷言故意保持，exit1）；正向原因核對：`node docs/reviews/g1-a-validation/compare.mjs --careers --full-diagnostic`（exit0，保存comparison.json）。本輪沒有為了Full綠而擴大修改遊戲或測試。
本輪隔離工具在docs/reviews/，未改Runner／manifest／CI分類。原始完整生涯資料在忽略的test-results/，不會自動提交；不得刪除修前證據。

最終保全：開工前695個既有檔案僅game.js改變，其餘694個hash保持（含使用者未提交D2／tasks及原驗證資料），無刪除。新增本報告與g1-a-validation內11檔，HEAD/main未變；報告12個本地引用有效、隔離腳本語法通過、git diff --check exit0。所有測試期產品hash均為上述4b7d…，正式測試／Runner／配置／VERSION／CHANGELOG／CURRENT_SPEC未改。

最終git status：原先M docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md與?? tasks/保持；本輪新增M docs/src/engine/game.js、?? docs/reviews/G1_A_LIMITED_FIX_ACCEPTANCE.md、?? docs/reviews/g1-a-validation/。無暫存、提交或推送。

## 限制與後續

本項原生fixturePASS不是完整G1-B/新投手獎整合；80案不是80条自然生涯，也不與重疊32案重複加總。
原awards重入重抽/重記、PRO付款後UI失敗續行、完整ID consumer去重仍為舊風險，本次不修。
未驗：iPhone/Android實機、Safari、Preview、CI、任意交易fault恢復、新P01～P08、跨reload。這些NOT_RUN，不因Quick或本地Chrome成功標PASS。
限定六項漏判已驗證修復，但整體狀態為LIMITED_FIX_VERIFIED / FULL_REGRESSION_FAIL，不宣稱完整G1-A／G1驗收通過。G1-B仍需另行批准範圍、因果差分與依賴；正式測試如何精確容納此修正的首個效果差分並維持非目標控制需先審查批准，不能無條件豁免IF或刪除舊斷言。若consumer切換需要receipt，按原Gate延至G3。此次不修改Gate、不自行開始下一批。

## G1-A正式結案

2026-10-14，使用者明確批准 **PASS / ACCEPTED** 並授權提交dev。結案僅涵蓋 BUG-AWARD-PHOENIX-JP-01／BUG-AWARD-DEMOTION-JP-01；上面的首次Full65 PASS／2 FAIL與未提交敘述是歷史快照，不抹除或改寫為成功。

### Full期待值限定修正與正式回歸

- 修正前同HEAD限定重跑兩個原斷言均PASS，修正後均FAIL；因此不是PRE_EXISTING_FAIL，而是TEST_EXPECTATION_ISSUE／EXPECTED_CHANGE。沒有把整個修正前Full稱PASS（整套未重跑）。
- 只修改兩個目標E2E及既有support/first-difference.mjs。保留原歷史baseline／操作策略／原始歷史資料；其餘案例仍嚴格比較完整S、選擇、RNG。
- 目標各跑原歷史、產品、限定phoenix歷史控制、新版重播四組。限定控制只補jp3-infielder-01／2041 NPB1首位打者的資格，沿用該歷史引擎原生一次效果，不改其餘公式／降格判斷。此控制是明示測試overlay，不是原舊版重播，也不取代原始失敗證據。
- 原歷史前綴完整相等；首次差異step265（第266次操作）為今季の成績を見る。awards前完整S、當年honors相同；後僅glass true→false、phoenix false→true、removed加入スペランカー、pool0→8。一次性、完整後續S／選擇／契約／收入與限定控制精確相等，新版重播精確相等。
- 兩案例原歷史387操作→產品397操作，完整639個R值及前後rngState相等，SHA256 `ffe5a758cb8601a9301f4865a716547bbf35d85437fe5ea33dbebbf46a100647`。awards抽選窗口387→391相同；不宣稱操作歷史未變。
- 原歷史總收入1,324,980,000円→產品1,351,490,000円，限定控制同為1,351,490,000円。沒有新增S排除欄位或將收入期待直接改成觀測額。
- 隔離斷言驗證：正向1 PASS；10種合成異常（能力、收入、contractId、honors、R值／次數、重複pool+8、removed、award前狀態、後年重複加點）均被拒絕。這是斷言安全驗證，不是10個產品Bug。
- 88唯一原生函式fixture重新實際執行88 PASS，含原7漏判；fixture不是88條自然生涯。
- 最終Windows Quick48 PASS／0 FAIL／0 SKIP／0 BLOCKED，216.561秒；Full67 PASS／0 FAIL／0 SKIP／0 BLOCKED，3345.586秒、exit0、executed67／reused0。兩入口整套36／36及50／50，Console／pageerror／JS-CSS資源錯誤0。
- 受驗HEAD `554d54a94352b7dbc86473084a65b56bef74d3b7`＋未提交G1-A與測試工作樹；產品game hash仍4b7d…，VERSION1.12.0。Quick／Full sourceFingerprint相同：`81846539bf9eceace871ac4d13467ed55a0fffe9efa8c63d23313b51e380c9e1`。不是對尚不存在的新Commit執行測試。
- [可攜執行結果](g1-a-validation/test-expectation-acceptance.json)保存兩個profile的67／48入口結果、耗時、日誌hash與目標案例。完整原始S／截圖／日誌仍在忽略的test-results，不宣稱本文件包含全部raw trace。
- 最終命令：`node scripts/test.mjs quick --playwright=<external> --output=test-results/g1-a-test-expectation-quick`、`node scripts/test.mjs full --playwright=<external> --output=test-results/g1-a-test-expectation-full`。原生fixture命令：`node docs/reviews/g1-a-validation/fixtures.mjs --mode=after --extended=true --history=true --output=test-results/g1-a-test-expectation-fixtures.json`。
- 歷史負面diagnose-full-control.mjs凍結從554d54a的原測試讀取原失敗斷言，不會因正式測試修正而失去原FAIL；不改歷史before／after/results。

### 結案後仍有效的界線

- 版本／CHANGELOG保持，G9版本發布沒有授權；此為既有1.12.0 dev工作的限定Gate提交，不宣稱新正式版發布。
- CI／Preview／Safari／Android與iPhone實機／跨reload及新P01～P08仍NOT_RUN。Chrome斷線後profile清理超時warning保留；不是產品Console錯誤。
- 原awards重入及全面ID consumer／Receipt風險仍獨立待處理。G1-A接受不等於完整G1完成，不開始G1-B／G2～G9。
- 提交前另實際重跑凍結的歷史負面控制：S03-IF-unchanged仍0 PASS／1 FAIL、exit1、Console／資源錯誤0，分類EXPECTED_FAILURE_REPRODUCED；日誌為test-results/g1-a-accepted-negative-control。這是原失敗保全證据，不是目前正式Full的FAIL，也不改寫既有歷史結果。
- 使用者既有D2四行與tasks未提交內容保留、不混入本次Commit。僅提交G1-A產品、測試、驗收與BACKLOG；未授權push、merge或部署。

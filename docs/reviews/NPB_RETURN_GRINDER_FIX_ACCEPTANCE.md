# NPB 回國重試與 grinder 出生快照修復驗收

## 1. 範圍、版本與基準

2026-10-12；工作分支dev。使用者批准同階段修復兩項，分開提交，整合驗收；smallschool不自行映射，必要時建立測試用Draft PR跑Linux Full，驗證後關閉、不合併。

開始時HEAD／origin/dev：`ef74f276699d5e67234a792b21a8a3d96bb592c2`，VERSION1.11.5；main／origin/main：`e886e84ca08c6c185406cac9d6f3c4376277061a`、1.11.4。tasks/fix曾讀取為第十階段歷史調查指令；本輪以最新使用者修復批准為準。未刪除或恢復使用者task文件（作業中觀察原未追蹤tasks/fix已不在原路徑）。

- 回國修復提交：`4a54b9e0fcfa60835dee6b463802f60e85fb8f3d`。
- 出生快照修復提交：`0689d350daf9b2c52064e8d4303ed40050fed344`。
- 整合文件／相容測試與VERSION提交、Linux CI及Preview實際結果：完成後補記於[BACKLOG修復驗收證據](../../BACKLOG.md)，與後續純證據提交分開。

VERSION **1.11.5→1.11.6，PATCH**：既有例外恢復及稱號資料傳遞修正，不是新系統。版本正本docs/src/config.js與CHANGELOG同時更新。CHANGELOG只記兩項實際修復，不寫測試數、批准或部署狀態。main／本番保持不變。

## 2. 回國修復

來源：[game.js](../src/engine/game.js)的crossOffers／fixedContract／signTo。原complete在action前設completed=true，signTo或契約card例外後，還原的選項再次進入同closure便直接return，造成年度不前進、#act清空。

最小修復：

1. context增加running、actionCompleted，只有成功後完成；同S、年度與舊callback的guard保持。年度已增加的例外也不允許舊操作再次加年。
2. 初次接受才ri(1,3)，結果存context.years；retry不再抽年數、球團或候選。
3. 私有transaction綁S／年度。fixedContract完成驗證與ID後保留同一contract；即使其返回後發生注入例外，下一次signTo使用該已驗證契約，不產生第二個ID。
4. 所屬仍在驗證成功後提交；付款／履歷後card失敗，讓原signingRenderRetry以同一choice action／contractId重畫，不重付。
5. transaction不加入S，不全面clone／rollback S，不回滾合法RNG；普通其他聯盟／draft／FA／保障年表／買斷公式不改。

原9案：Seed stage10-fixture／IF，CPBL1滿期、2038、28歲、OVR54、年俸1,200萬已付，候選NPB1年俸1,616萬。三故障點（簽約前／fixedContract返回後／付款handler後契約card）×1280／320／390。全數重試成功至2039，contractSequence1→2，重試後完整S及全部RNG與正常接受相同。建立後例外仍用first.created的同contractId，首次年數3年保留。回國契約金0，沒有偽造現金bonus來宣稱此路線重付5,000萬。

三尺寸再驗：兩次連續契約card故障後第三次重試成功；收入／ledger／ID與前次相同。殘留正常推年、沒有年數抽選。舊按鈕無作用。恢復後先經**既有守備位置會議**再進入allocUI，沒有跳過或改變該分支；下一操作listener有效、此路線不增加R。次年度原生phaseEnd付應付年俸，重入不再次付款。

以上為明示fault injection與有效fixture；不宣稱自然玩家曾出現這些例外。不是對任意付款函式內部throw或次年度啟動任意失敗的全狀態transaction保證。

## 3. grinder 修復與待決界線

active newState返回前把**生成時pot**合計存potSum0，早於初次訓練／事件。不是讀取退休時的pot，也不更改潜在值、成長成本、門檻或RNG。

現行退役判定維持reachedTop、P237／其他469與既取得guard。IF／s10-trait-38正常生涯：出生pot463，347操作、597R，2049退休、NPB20季；修復前grinder=false，後true。沒有注入能力或提升機率。P／yakyo-test-001出生243>237，376操作、815R，2049退休，仍false。

7個原生邊界fixture：P237／238、IF469／470、未達reachedTop、缺失出生資料且当前pot低、已取得且超門檻。用高的退休pot驗證正例仍取出生快照；缺失值不以現在低pot補造；已取得狀態保持。升學後初始合計不變。

smallschool未修：不寫hsTier、不把B映射成3、不用大學tier代替出生高校；保留既有取得狀態與原條件。獨立待辦TRAIT-SMALLSCHOOL-SEMANTICS-01，需要使用者確認出生高校範圍與舊tier映射。舊人生沒有可信出生合計時無法補回，不新增存檔功能。

## 4. 原生修復前後 S／RNG 比較

`stage10-risk-e2e --compare=ef74f276699d5e67234a792b21a8a3d96bb592c2`載入Git未改造的舊game.js與本輪game.js；其他遊戲模組未變，config VERSION視為metadata。

P／IF每個操作：相同操作文字、完整S digest、RNG次數；最终完整S、所有RNG before／after／值。唯一正規化界線為version、新增potSum0，以及done後的grinder；**未完成生涯的grinder、能力、成績、收入、契約、年表、選擇或其他特性都不排除**。額外直接驗證新出生合計等於原程式初始pot合計，IF自然取得／P不符合不取得；原始與現行完整狀態都保存。

兩条正常生涯全部符合批准範圍；不是只比較總R次數。記錄 `E-P-current/original.json`、`E-IF-current/original.json`；全部操作歷史包含前後digest及R增量。只允許出生欄位與退休稱號差異。

## 5. 測試相容性：不是掩蓋 Bug

首次合約381案在新增出生欄位後為377 PASS／4 FAIL；原始log保留在safety-followup-contract-before-adapter。差異是舊S缺potSum0與因此改變的digest，不是薪資／保障差異。

新增support/baseline-initial-potential.mjs：只對歷史**正向**UI比較，在舊newState返回時補核准出生快照，已存在則保持、不用退休值、不消費R。display／draft／contract／HOF正向基準使用它，未移除全S／RNG斷言。KBO balanced原Bug來源仍原樣，前綴snapshot僅排除新增potSum0與原有version；非balanced正向歷史生涯才用adapter。f3efb0a的2049第一錯誤、736萬候選／800萬floor／21,597.6萬package cap與925987d的殿堂負面單元來源保持。上述未改造舊程式的P／IF比較另行執行，不以adapter證明原結果未變。

初次額外7邊界FAIL是fixture traits空物件缺smallschool:false；補完整初始值，grinder門檻期望不改。初次額外下一操作檢查12 FAIL是錯把守備會議當成立即allocUI；依原UI操作完成守備會議再驗證，未改遊戲。錯誤及重跑JSON保留。

Local Full完整跑60入口：**55 PASS／5 FAIL／0 SKIP／0 BLOCKED，1450.725秒、exit1**。五項原因：career-movement-policy／event-integration／salary-flow三個來源字串仍要求舊的直接ri或立即return；HOF／KBO兩個比較缺出生快照。沒有把此輪改記成PASS。相容修改後單獨重跑五入口：**5 PASS／0 FAIL／0 SKIP／0 BLOCKED，49.511秒、exit0**。其餘55入口未改；最後完整Linux Full須實際成功，不能以局部重跑冒充整個CI。

## 6. 實際命令與數量

Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39；手機為320／390尺寸模擬，不替代iOS／Android實機。<PW>為外部安裝module，程式不埋個人路徑、不新增npm遊戲依賴。

```sh
node scripts/test.mjs full --only=stage10-risk-e2e --baseline=ef74f276699d5e67234a792b21a8a3d96bb592c2 --playwright=<PW> --output=test-results/safety-followup-before
node tests/stage10-risk-e2e.mjs --compare=ef74f276699d5e67234a792b21a8a3d96bb592c2 --playwright=<PW> --output=test-results/safety-followup-final-comparison
node scripts/test.mjs full --baseline=ef74f276699d5e67234a792b21a8a3d96bb592c2 --playwright=<PW> --output=test-results/safety-followup-final-full
node scripts/test.mjs full --only=career-movement-policy,event-integration.test,salary-flow.test,hof-first-ballot-e2e,kbo-renewal-e2e --playwright=<PW> --output=test-results/safety-followup-full-rechecks
node scripts/test.mjs quick --baseline=ef74f276699d5e67234a792b21a8a3d96bb592c2 --playwright=<PW> --output=test-results/safety-followup-quick-final
```

- 修復前44案：34 PASS／10 FAIL、51.438秒，Runner exit1。
- 只修回國：43 PASS／1 grinder FAIL，Runner51.613秒、exit1。
- 兩項整合的原44案：44 PASS、Runner63.376秒、exit0。
- 最終額外補驗＋未改造原生比較：59 PASS／0 FAIL／0 SKIP／0 BLOCKED，71.123秒、exit0。原44案均保持PASS；增加7邊界、6連續描畫／殘留、2原生比較。
- Full中的stage10常規57案、能力89案、交易5案、stage7補充17案、合約381案PASS。其他入口以完整summary為準，不加總成不存在的「唯一斷言覆蓋率」。
- 版本更新後首次Quick：44 PASS／1 FAIL，209.107秒；verify-modularization仍鎖1.11.5。只同步批准的1.11.6版本斷言與輸出，既有RNG固定值全部保留，再完整重跑Quick。Linux Full／Quick、Preview及最終受驗SHA在BACKLOG完成實際檢查後補記。
- 最終版本同步Quick：45 PASS／0 FAIL／0 SKIP／0 BLOCKED，210.302秒、exit0，log為safety-followup-quick-version-synced；不把前一次版本斷言FAIL改寫成PASS。

30筆Console／pageerror為本輪明示S10_FAULT_*；其他錯誤／JS-CSS HTTP失敗0。測試的Windows browser已disconnect而profile cleanup warning保留；不當作遊戲錯誤。初輪Full為修正新增fixture而停止，log保留，NOT_COMPLETED、不作PASS或重用。

## 7. 修改檔案與保護範圍

- 遊戲：docs/src/engine/game.js（兩項修復），docs/src/config.js（1.11.6）。
- 測試：stage10-risk-e2e（保留原行為断言、補邊界及原生對照）；career-movement-policy、event-integration、salary-flow（同步核准接口來源斷言）；display-preferences、draft-income、contract-salary、hof-first-ballot、kbo-renewal E2E（正向出生快照相容）；verify-modularization（版本預期同步1.11.6，RNG值不改）。
- support：baseline-initial-potential；manifest只加該檔為import-only/support，現有profiles／分類／模式／args／估時不變。Quick45／Full60／Audit61，測試相關檔案67→68；list識別新support，未把長E2E放Quick。
- 文件：CURRENT_SPEC、CHANGELOG、BACKLOG、scripts/TESTING、docs/design四份（更新補充；固定ea951c2歷史AST索引及行號保持），本文。原第十階段調查報告保留10 FAIL歷史，不覆寫。
- Runner、AGENTS、CI／發布workflow、正式網站、薪資／契約／殿堂政策、CSS、RNG／seed URL、LEGACY都沒有修改。

驗收成功後只關閉STATE-NPB-RETURN-RETRY-01與grinder範圍的TRAIT-INITIAL-STATE-FIX-01；smallschool另留待決。AUD-02／REFACTOR／LEGACY及實機／其他未驗範圍不結案。完成後停止，不自動發布main、不開始重構。

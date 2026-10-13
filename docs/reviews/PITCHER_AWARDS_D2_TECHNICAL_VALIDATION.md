# 投手獎項D2：剩餘技術風險整合驗證

## 1. Executive Summary

VALIDATION_ONLY / ANALYSIS_ONLY / DESIGN_ONLY。2026-10-14。本次只新增本報告及隔離附件，不改D2、正式規格、遊戲或版本。
- **VAL-A：RISK**。正常PRO年度結算及同年重入沒有重付；原生awards直接重入可重抽/重記honors，原生phaseEnd付款後描畫故障再入可無法續行。限定fixture/fault注入的真實行為已證，不宣稱自然UI故障路線已重現。
- **VAL-B：DESIGN_BLOCKER**。12項隔離Journal/Receipt模型案例PASS，證明限定同步邊界方案可行；單一applied旗標反例重發＋8，未批准的產品交易方案與任意中斷恢復仍不可宣稱安全。
- **VAL-C：DESIGN_BLOCKER**。現行主R的少量受控重播及55項其他數學/原生案例通過；D2沒有已批准hash算法/輸入編碼/golden vectors，獨立抽選驗證為DESIGN_GAP，沒有自選hash補綠。
- 共76個高價值案例記錄：PASS71／FAIL0／RISK3／DESIGN_GAP1／NOT_RUN1／BLOCKED0。其中原生PASS5＋原生RISK3；參考模型PASS66（含機率數學），不合併冒稱產品71案PASS。
- 新確認自然可達產品BUG：**0**。原生受控重入/故障風險新增runtime證據2類（awards重抽重記；PRO付款後續行停滯），不稱零風險。日文名稱兩BUG沿既有證據，沒有修復或整批重測。

## 2. Repository／環境／保留基準

tt-chin/yakyujinsei；branch dev；HEAD `7220ad82002801d3dea5fedae80d0fb3d7a0433f`；VERSION 1.12.0；Windows PowerShell／Node v24.15.0。
game.js SHA256 `aceb42d48b5431e3c1ea0cb999a816c0d27dcdd89dc4094b8cf67c91857869e6`。沿本地dev，不fetch/pull/switch/reset/rebase、不強制回到7220ad8。
執行前有既存untracked designs/、研究/工具、tasks/、日文獎名驗證；tracked無dirty。原692個檔案hash先保存，用來確認既有未提交內容不被覆蓋。
[AGENTS](../../AGENTS.md)、[CURRENT_SPEC](../../CURRENT_SPEC.md)、[D2主設計](../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md)、[決策紀錄](../designs/PITCHER_AWARDS_D2_DECISION_LOG.md)、[平衡分析](../designs/PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md)只讀。既有[第七階段安全修復證據](STAGE7_SAFETY_FIX_ACCEPTANCE.md)及[獎名限定驗證](AWARD_JP_NAME_LIMITED_VALIDATION.md)保留，不把舊SHA PASS當成此HEAD新執行。

### 本次驗證任務 ↔ 正式D2風險ID

正式唯一依據D2 §14.9（本HEAD第521行），不採用原任務附件中不同編號定義，不修改D2。任務編號不是新的風險ID。

|本次驗證任務|正式D2風險ID|正式定義／本次交集|映射狀態|
|---|---|---|---|
|VAL-A 年度結算重入|TR-B03|phaseEnd上下游恢復範圍、失敗續行證據|CONFIRMED|
|VAL-A 中斷/重抽觀測|TR-B02|逐slot journal及多欄位effect receipt原子邊界|CONFIRMED（依賴，不取代TR-B03）|
|VAL-B Journal／Receipt|TR-B02|逐slot journal及多欄位effect receipt原子邊界|CONFIRMED|
|VAL-B 效果完成後續行|TR-B03|年度步驟安全續行|CONFIRMED（交叉依賴）|
|VAL-B player/league/award鍵與舊honors|TR-B04|完整ID adapter，避免漏薪資/HOF/保護與重付|CONFIRMED（本輪僅模型键/歷史邊界，不全面驗adapter）|
|VAL-C 獨立RNG／向量／精度|TR-B01|hash編碼、算法、精度/向量正式審查|CONFIRMED（精度仍TR-B01，不另定義TR-B02）|
|VAL-C 決策防重入|TR-B02|journal原子邊界|CONFIRMED（引用VAL-B，不重複測）|
|全部任務的實作權限|TR-B05|產品實作授權|CONFIRMED：NOT AUTHORIZED；不是「ID/歷史相容」|
|原附件把TR-B05稱ID相容|TR-B04才是正式ID適配項|原附件說法不沿用、不改D2|SUPERSEDED_TASK_ALIAS|

沒有強行一任務一風險；本輪映射皆可從D2原文確認，沒有MAPPING_UNCONFIRMED項目。正式TR-B05僅授權阻擋，不是本次技術測試能解除的項目。

## 3. 驗證範圍與命令

只新增[隔離工具](pitcher-awards-d2-technical-validation/validate.mjs)及[原始結果](pitcher-awards-d2-technical-validation/results.json)。開始前同名報告/目錄均不存在，不覆蓋任何舊結果。

```text
node --check docs/reviews/pitcher-awards-d2-technical-validation/validate.mjs
node docs/reviews/pitcher-awards-d2-technical-validation/validate.mjs
git diff --check
```

語法與最終命令exit0，限定驗證約0.122秒；沒有新套件、Quick/Full/CI/E2E、自然生涯或A/B大資料重算。
首跑模型B12的並行衝突fixture錯誤：把phoenix直接設成預定after=true，模型依法可識別已完成值，原「應衝突」assert失敗。修正fixture為pool=100（既非before7也非after15）後正確觸發CONCURRENT_STATE_CONFLICT；產品/預期數學/模型算法不改，不冒稱產品BUG。

VAL-A用既有[原生函式抽取框架](../../tests/retirement-hof-test-support.mjs)，從game.js取完整phaseEnd/settlePhaseEnd區塊、awards/advance等及日本版seedInit/R/chance，不重写判定regex。實際呼叫原生contract/incentive/championship/trait政策。原source磁碟完全不改；card是顯式故障注入/記錄替身，movement、allocUI、migration、startYear及resetEventYear為邊界替身，未執行全DOM、下個球季、服務年資、移籍或全年度UI。原R僅包装記錄值，不替換主算法/機率。

VAL-B用**PROPOSAL参考模型**，typed tuple鍵与固定true outcome provider，非產品hash、非真實隨機分布。VAL-C純數學函式只表達已批准曲線，斷言1e-10只比數學近似，計算門檻沒有加epsilon，不批准產品精度政策。

## 4. VAL-A：年度結算重入

### 靜態原生路徑（VERIFIED_STATIC）

[game.js](../src/engine/game.js):3001 startYear→stepQ=[phasePre,phaseIntlPre,phaseMid,phaseEnd]；758 nextStep先shift再執行，done會清佇列。choice:688–712有generation/token/runChoiceAction防重，但[choice-action](../src/ui/choice-action.js):26–57錯誤後復原DOM，不回滾S/R。
phaseMid callback:876→proSeason:1269→成績/累計/log→awards:1347→salary evaluation:1349→冠軍snapshot→TJ/降格監査/交易/國際→nextStep。**awards不在phaseEnd內**，重跑phaseEnd不會自然重跑獎項，不能混為一個入口。
active phaseEnd:3107–3130：CORP年度WeakMap running/paid/complete→settle；PRO以同S/year seasonEndContext及lastSalaryPaidYear/schedule.paid防重→原championship/maintenance→base salary/incentive→pool清零並選擇配分，或movement。
movement:3132→LEGACY.movement:1556；原服務年資guard、局部狀態/進路更新不是award journal。advance:1994–1996 age/year/stageYr++→事件年重置→startYear；不持久化career。[preferences](../src/ui/preferences.js)只有display localStorage，CURRENT_SPEC §2/15.5不提供生涯保存。
現PRO seasonEndContext先設再驗付款/繪圖，paid guard可避免重付但不保證失敗後續行。CORP第七階段已測修復，這輪直接引用，不無理由再跑其完整E2E。

### 有效fixture與逐案結果

共同2035年PRO NPB1、age30、真實存在NPB_PL_FUK；原生createContract合法三年2035～37，每年10,000,000円，incentive annualMax700,000。payD4/樣本FULL無FULL賞→HALF350,000；未付、career totals0、pool0或4；原生captureSeasonChampionship形成合法當季快照。R seed award-jp-2，冠軍原生抽選1次落選。完整輸入/快照/R值/卡片/邊界呼叫见JSON。

|ID|操作與預期|實際結果／副作用|證據／結果|
|---|---|---|---|
|VAL-A01|正常phaseEnd一次|base10m＋incentive350k；全年收入10.35m；年仍2035；movement邊界一次；冠軍R1|VERIFIED_RUNTIME／PASS|
|VAL-A02|同年度phaseEnd連續2次，不重付/重推|兩次完整snapshot相同；第二次R0、不增honors/pool/合同支付|VERIFIED_RUNTIME／PASS|
|VAL-A03|pool4結算產生配分選項，尚未接受再phaseEnd|選項只有1組、付款一次、pool清0；第二次無R/新選項/推年|VERIFIED_RUNTIME／PASS|
|VAL-A04|原awards card後故障、進年之前重試，不應重抽/重記|初次R2→重試總R4；年間MVP1→2筆，第一次pool7/未phoenix，重試15/取得；沒有付款/推年|VERIFIED_RUNTIME／RISK（fault injection）|
|VAL-A05|推年後reload恢復|沒有career持久化，不能合法保存fixture假裝產品恢復；未開瀏覽器|VERIFIED_STATIC／NOT_RUN，不適用現行保存機制|
|VAL-A06|同年honors已最優秀投手，再進原awards|同名1→2筆，主R2；無交易journal|VERIFIED_RUNTIME／RISK（直接原生重入）|
|VAL-A07|合法結算付款後シーズン終了card拋例外，retry應续行不重付|收入仍10.35m、R仍1；重試原入口直接return，沒有movement/選項；未重付但續行未恢復|VERIFIED_RUNTIME／RISK（fault injection）|
|VAL-A08|結算後原advance一次|year2036、age31，startYear邊界一次；不模擬新球季或reload|VERIFIED_RUNTIME／PASS（限定範圍）|

VAL-A04/06原生副作用問題確實觀測到，但call path是隔離直接呼叫/顯式throw，未證正常UItoken/stepQ會走到同一重入；分類RISK，不升格自然REPRODUCED_BUG。VAL-A07是合法合約＋UI渲染故障的恢復反例；沒有修改ct造不可能未付年度或捏造付款額。
原生fixture沒有跑movement完整流程，serviceTime/升降格沒有額外增長僅因邊界被替身截住，**不能據此判真實服務年資與完整升降格驗收PASS**。frame year不變/原advance一次已可觀测，沒有多次年度推進證據。

### 明確結論

1. phaseEnd有**分段防重**：CORP私有receipt、PRO context/paid、冠軍與incentive個別receipt；沒有原獎項決策journal或統一transaction。
2. 原生直接重入awards已重現額外honors/R；phaseEnd正常兩次沒有重付；渲染fault後有丟失續行反例。
3. 風險涉及現行函式，不只未來新賞；但現行UI自然重入未證。
4. 要保護draw→honors→traits/pool→evaluation/payment→render→choice/advance，不能只增加最後completed。
5. 正式TR-B03本次結論：**現行RISK／D2安全接入DESIGN_BLOCKER**，不是一律認定自然BUG。原全S/R重播、年度reload安全尚UNVERIFIED/NOT_RUN。

## 5. VAL-B：Journal／Effect Receipt模型

### 現有可重用證據（只讀，非本輪產品PASS）

honors字串無awardId/rule/result；raw awards直接push且原chance不存result。S.traits.phoenix只guard一次效果，不保證原honors/AS防重。
contract-policy:28–34 schedule.paid、incentive-policy:29–34 yearlyIncentivePaid、championship-policy yearly結果/maintenance、CORP WeakMap，國際completed字典有局部一次性結算類比；各效果正本不同，不能共用一個applied。
phaseEnd context在S外、reload消失；現行沒生涯保存。不新增存檔或宣稱已有持久化journal。

### 參考模型及12案

鍵採JSON typed tuple [fixturePlayer,year,league,award,fixtureRule]，只驗identity不hash。decisions保存schemaVersion1/awarded/phase；每effect receipt冻结field/before/after/done；寫值後但done前throw，重試在current==after時確認已提交，不再次加8；current不同before/after則拒絕猜測。
這個模型只在固定同步序列、同page/instance、不在中途其他合法流程改同一欄位的假設下成立。它不是正式schema或完整交易實作，也不能保證nativeR被耗到journal記錄之前任意throw/OOM可恢復。效果API本身不執行獎項资格/awarded授權判斷，未來產品必須由可信已完成decision控制；不同player/league案例只驗鍵分離，未模擬多玩家共享效果狀態或存檔。

|ID|模型情境|確認結果|證據／狀態|
|---|---|---|---|
|VAL-B01|首次決策|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B02|同年重複決策|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B03|決策完成、補效果|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B04|效果完成後重入|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B05|決策後故障續行|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B06|同年不同獎項|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B07|同獎不同年度|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B08|不同球員／聯盟|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B09|可信已結算歷史|fixture明示可信已結算，返回historical unknown；draw0且原honor不改|VERIFIED_MODEL／PASS|
|VAL-B10|P07衍生MVP一次|同年三實得decision成立，MVP集合1筆，不額外抽MVP|VERIFIED_MODEL／PASS|
|VAL-B11|P08復活＋8一次|對應唯一decision／effect／鍵斷言通過，完整原始狀態見JSON|VERIFIED_MODEL／PASS|
|VAL-B12|部分效果故障與反例|安全模型pool15且每步完成；單旗標pool23反例；並行pool100被拒，不假恢復|VERIFIED_MODEL／PASS|

B12的單applied=false：pool7→15後中斷，再次＋8→23，顯示「最後加applied」不安全；完整多欄位receipt可在本模型持有before/after處恢復。並行寫pool100造成CONCURRENT_STATE_CONFLICT，只能停止診斷，**不能無條件恢復、無法宣稱模型保證所有一致性**。
B09用了fixture可信settled key，沒有從任意honors存在推測效果已付，也不製造已earned新賞。沒有過去三冠追補；舊未知效果如何辨識仍需adapter/schema策略。
B10用實得bool集合派生MVP，並非原nativeMVP流程全測；原MVPlegacy槽＋保證的receipt接入仍需產品驗收。B11只一次gate/效果，不將P08新賞稱現產品已有。
結論：Journal/Receipt需要先於新賞副作用接入（至少同一小批次完成可失敗fixture及防重原語）；模型12PASS不解除**TR-B02原子邊界BLOCKER**。必須批准schema/鍵/原R記錄/可恢復故障邊界、honors/效果分離、receipt保留/回收規則。reload持久化、任意中斷/跨頁恢復可延後且本產品不提供；不要為此復活career save。

## 6. VAL-C：独立RNG、曲線與精度

### 原生RNG（VERIFIED_RUNTIME＋STATIC）

正規化初始化SEED的日本版fnv/seedInit:2702–2717建立S.rngState；**活動R是2717覆寫，不是只執行49行旧R**。每個R更新S.rngState和_s；chance:52以R()*100<p。VAL-C-MAIN同seed兩個VM各四個R逐值相同，chance100 true、chance0 false且仍各耗一R，總6次（第二VM比較4次）。這不是完整生涯比較。
awards順序AS→條件rookie→ERA/P02承接原槽→CL/SV→MR/HLD→SO→原MVP；p100原槽仍耗R。冠軍結算也耗主R，TJ、降格、交易、國際及下一年度依其先後。少量A/C行為未修改主R，未來hash接入是否不碰R仍未驗。

### 独立hash與golden vectors：DESIGN_GAP

D2 §14.3明确FNV1a32＋avalanche／UTF8 byte-length分段仍**PROPOSAL／常數及向量未批准**。現seedInit的既有FNV不能冒充新增獎項的已批hash配置。
C3九項中，固定結果/跨環境golden、award/year/league/player独立key、不消耗主R、順序獨立与Journal重入后的實際hash等正式验证**NOT_RUN：缺已批准算法/编码/golden**。B模型鍵distinct僅證typed tuple key設計，不證無hash碰撞或隨機獨立。沒有選新hash、沒有產生自造golden並稱吻合。
同頁不碰mainR在架構上可行（函式純輸入計算），但目前只是PROPOSAL，真正產品兩序列比較UNVERIFIED。hash碰撞/32bit離散概率/孤立surrogate編碼與PATCH/ruleId政策仍待審。

### 機率與數值（VERIFIED_MODEL）

P01四league線保持10/15、12/17、12/17、14/20；各測b−1、b、b+1、g−1、g、g+1，24案通過。基本20、g突然100；MLB跨6（每胜12.5pp），其他跨5（15pp），不平滑保證跳點。

P04 22案：NPB11/0=0、12/0=100、12/6約25、12/7=0、13/7(.650)=20、17/3(.850)=100、16/3保證前按曲線；KBO9/0=0、10/0=100、10/5約25、10/2=75、10/1=100；0分母、負數、非整數、NaN/Infinity/缺L/負L/小數L=0，CPBL/MLB=0。用原始W/(W+L)，不提前toFixed。
P08 score59.999/60/60.001/94.999/95/95.001分别0/10/10.0025/95/100/100；资格否决高score、NPB1/SP/W13/IP143及IP180满分保持。手機數值離線score68.7954545/p31.9886364，不是新實玩/新版重播。用原S3 .25/.30/.25/.15/.05，不用IP150/190或55。

精度案例：12/18的B概率為24.999999999999982%，提前WP顯示丸め.667會算25.1%；這不是把產品p變成25.1的批准。模型用raw，assert epsilon1e-10只驗算，不加到basic/g95/score60比較。
W/L各safe integer時sum仍可能超safe，產品是否拒sum/BigInt有理數仍未批准；P08component最後bit、抽選整數化、u32粒度與跨環境邊界策略待審。當前曲線數學PASS不等產品精度正式定案，故**VAL-C仍DESIGN_BLOCKER，正式映射TR-B01**。

## 7. 測試案例總表

每案JSON保存輸入/期望/實際、evidence/status/notes；runtime有S/rng/cards/choice snapshots。表列已執行、不適用與設計缺口分開。A/B逐案見上表，C每項如下：

|ID|證據|執行狀態|
|---|---|---|
|VAL-C-HASH|VERIFIED_STATIC / DESIGN_BLOCKER|DESIGN_GAP|
|VAL-C-MAIN|VERIFIED_RUNTIME|PASS|
|VAL-C-P01-CPBL-9|VERIFIED_MODEL|PASS|
|VAL-C-P01-CPBL-10|VERIFIED_MODEL|PASS|
|VAL-C-P01-CPBL-11|VERIFIED_MODEL|PASS|
|VAL-C-P01-CPBL-14|VERIFIED_MODEL|PASS|
|VAL-C-P01-CPBL-15|VERIFIED_MODEL|PASS|
|VAL-C-P01-CPBL-16|VERIFIED_MODEL|PASS|
|VAL-C-P01-KBO-11|VERIFIED_MODEL|PASS|
|VAL-C-P01-KBO-12|VERIFIED_MODEL|PASS|
|VAL-C-P01-KBO-13|VERIFIED_MODEL|PASS|
|VAL-C-P01-KBO-16|VERIFIED_MODEL|PASS|
|VAL-C-P01-KBO-17|VERIFIED_MODEL|PASS|
|VAL-C-P01-KBO-18|VERIFIED_MODEL|PASS|
|VAL-C-P01-NPB-11|VERIFIED_MODEL|PASS|
|VAL-C-P01-NPB-12|VERIFIED_MODEL|PASS|
|VAL-C-P01-NPB-13|VERIFIED_MODEL|PASS|
|VAL-C-P01-NPB-16|VERIFIED_MODEL|PASS|
|VAL-C-P01-NPB-17|VERIFIED_MODEL|PASS|
|VAL-C-P01-NPB-18|VERIFIED_MODEL|PASS|
|VAL-C-P01-MLB-13|VERIFIED_MODEL|PASS|
|VAL-C-P01-MLB-14|VERIFIED_MODEL|PASS|
|VAL-C-P01-MLB-15|VERIFIED_MODEL|PASS|
|VAL-C-P01-MLB-19|VERIFIED_MODEL|PASS|
|VAL-C-P01-MLB-20|VERIFIED_MODEL|PASS|
|VAL-C-P01-MLB-21|VERIFIED_MODEL|PASS|
|VAL-C-P04-01|VERIFIED_MODEL|PASS|
|VAL-C-P04-02|VERIFIED_MODEL|PASS|
|VAL-C-P04-03|VERIFIED_MODEL|PASS|
|VAL-C-P04-04|VERIFIED_MODEL|PASS|
|VAL-C-P04-05|VERIFIED_MODEL|PASS|
|VAL-C-P04-06|VERIFIED_MODEL|PASS|
|VAL-C-P04-07|VERIFIED_MODEL|PASS|
|VAL-C-P04-08|VERIFIED_MODEL|PASS|
|VAL-C-P04-09|VERIFIED_MODEL|PASS|
|VAL-C-P04-10|VERIFIED_MODEL|PASS|
|VAL-C-P04-11|VERIFIED_MODEL|PASS|
|VAL-C-P04-12|VERIFIED_MODEL|PASS|
|VAL-C-P04-13|VERIFIED_MODEL|PASS|
|VAL-C-P04-14|VERIFIED_MODEL|PASS|
|VAL-C-P04-15|VERIFIED_MODEL|PASS|
|VAL-C-P04-16|VERIFIED_MODEL|PASS|
|VAL-C-P04-17|VERIFIED_MODEL|PASS|
|VAL-C-P04-18|VERIFIED_MODEL|PASS|
|VAL-C-P04-19|VERIFIED_MODEL|PASS|
|VAL-C-P04-20|VERIFIED_MODEL|PASS|
|VAL-C-P04-21|VERIFIED_MODEL|PASS|
|VAL-C-P04-22|VERIFIED_MODEL|PASS|
|VAL-C-P08-59.999|VERIFIED_MODEL|PASS|
|VAL-C-P08-60|VERIFIED_MODEL|PASS|
|VAL-C-P08-60.001|VERIFIED_MODEL|PASS|
|VAL-C-P08-94.999|VERIFIED_MODEL|PASS|
|VAL-C-P08-95|VERIFIED_MODEL|PASS|
|VAL-C-P08-95.001|VERIFIED_MODEL|PASS|
|VAL-C-P08-QUAL|VERIFIED_MODEL|PASS|
|VAL-C-PRECISION|VERIFIED_MODEL / RISK|PASS|

合計76是**記錄數**，含1 NOT_RUN/1 DESIGN_GAP，實際執行74（71PASS＋3原生風險）；不是76個產品PASS。無人為把未跑hash的9個測點加PASS。原始status FAIL0表示fixture/模型断言無錯誤，**不表示風險已修復**。
實際通過：原生5、模型66；風險3皆原生。首次模型fixture assertion失敗已記於§3，最終斷言不為掩蓋產品失敗而改產品。命令exit0因驗證觀測與風險分類完成，不應作產品合併門檻「所有安全條件通過」。

## 8. 已確認BUG與未來風險分離

既有日文獎名BUG兩項沿[限定報告](AWARD_JP_NAME_LIMITED_VALIDATION.md)及[已保存結果](award-jp-name-validation/results.json)，本次未重跑32案或修復。
本次新原生證據是直接重入awards/故障後phaseEnd不可續行的2類**RISK**；正常UI可達性UNVERIFIED，所以不新立自然BUG ID、不擅寫BACKLOG已發現重大BUG。
新D2尚無產品producer/journal/hash等，模型風險是DESIGN_BLOCKER，不稱P08已重付/漏付；沢村尚未現行發獎。單旗標counterexample為參考模型，不稱目前S已有此receiptBug。

## 9. 與日文獎名BUG及ID相容的相依

修正日文降格命名会改变wonAward短路，可能少一個chance55及後續分支，不新增直接R也不保證生涯R總相同。Journal保持原抽選时點、效果receipt再套glass/pool；修名需要同一scope一次效果驗收，不能靠新hash解决。
復活/降格仍是不同集合/期限；旧最優秀投手不是新P02，P08單獨批准且不追補歷史效果。ID/历史相容正式**TR-B04**只引用D2和前報告，本輪沒有全面consumer/HOF/年薪映射驗證；TR-B05仍是實作授權，不改編號。

## 10. 技術BLOCKER決策表（正式ID不重新定義）

|正式風險ID|證據等級|實際影響|是否阻礙D2／本次結論|建議處置|
|---|---|---|---|---|
|TR-B01 hash編碼/算法/精度/向量|VERIFIED_STATIC＋VERIFIED_MODEL＋DESIGN_GAP|曲線可算；hash與向量及精度尚未定案|是，DESIGN_BLOCKER；非現行RNG算法BUG|先審批准算法/編碼/精度与固定向量|
|TR-B02 journal/effect原子邊界|VERIFIED_MODEL；原生重入證據|防重決策與多步效果，任意fault尚無保證|是，DESIGN_BLOCKER；12模型PASS不足結案|定原子/安全恢復邊界及native fault fixtures|
|TR-B03 phaseEnd恢復/續行|VERIFIED_RUNTIME／RISK|正常防重有效，付款后UI故障可能停滯、raw awards重入有副作用|D2整合時阻礙；現行為受控RISK，非已證自然BUG|局部receipt與繼續步驟分離，不重跑whole proSeason|
|TR-B04完整ID adapter|本次僅模型key/舊資料邊界及引用|新名稱/HOF/薪資/護欄、history不能猜|既有BLOCKER未解除，全面驗證NOT_RUN|另限定adapter驗證，不把模型distinct key當完成|
|TR-B05產品實作授權|使用者明示NOT AUTHORIZED|禁止工程與發布|是，授權BLOCKER，非測試FAIL|等本報告審查與明確實作授權|
|BUG-AWARD-PHOENIX-JP-01|既有REPRODUCED_BUG（限定原生fixture）|復活漏判|既有BLOCKER、未修復|使用者批准後最小精確映射＋一次效果驗收|
|BUG-AWARD-DEMOTION-JP-01|既有REPRODUCED_BUG（限定原生fixture）|年度護欄漏判及後續RNG分支|既有BLOCKER、未修復|修名與RNG因果差範圍分開驗收|

不是預設全部風險等於新BUG：TR-B03正常2次PASS和受控RISK並列；TR-B01是批准缺口；TR-B05是權限；TR-B04未全面執行維持原BLOCKER。

## 11. 最小實作順序建議（PROPOSAL，不開始工程）

1. 使用者審查正式ID對照、hash/key/精度/故障恢復支持邊界與schema；不得用模型測過作批准。
2. 原生可失敗fixture與最小journal/receipt/續行原語，避免新增賞之前已耗原R无法安全恢复；不大拆game.js、不全S clone/rollback。
3. 日文現行Bug最小精確修正，分開復活/降格，界定因果S/R差；保留老honors/合同保障，不能把部門全加保護。
4. 完整ID adapter＋原P02/03/05/06槽凍結，再接新P01/04/08与P07/MVP/已批准保護。
5. 正式實作另授權後執行L3相关Quick/Full/固定Seed/PCmobile/Preview；本輪不执行。
同批次接入時journal與新賞效果不可先發後補receipt。HP/子聯盟/一般玩家樣本/生涯保存可延後，不擴本案。

## 12. 未驗證項目

- 現行自然UI造成原awards重入或phaseEnd renderer故障的完整Seed/choices，以及完整movement/service accrual/下一年度球季。
- reload生涯恢復：產品未提供，不造持久化fixture或加save。
- D2獨立RNG的已批准byte key/hash/golden vectors、跨Node/Chromium/Safari執行一致與真實主R相容。
- nativeR取值到journal之間任意throw、OOM、proxy/setter/並行修改、跨頁receipt持久化；模型不能保证。
- 全consumer alias/HOF/契約支付／獎金／畫面，及修復后因果RNG差。
- 所有Quick/Full/CI、Full E2E、平衡大採樣／A/B重算：NOT_RUN（明文禁止/不需要），不标PASS或環境BLOCKED。

## 13. 修改範圍與保全證據

只新增本整合報告及pitcher-awards-d2-technical-validation/validate.mjs、results.json。最終692個既存檔案hash全部與開工相同（含既有未提交D2/工具/日文報告與原始研究），無任何既存檔案消失；新增路徑恰上述三檔。15個本地引用/anchor、76個唯一case ID、5原生PASS/66模型PASS/3原生RISK分類及統計驗證PASS；語法exit0、git diff --check exit0（新增untracked不在tracked diff，另檢語法/連結）。git status --short保留所有舊條目，只增加本報告和隔離目錄。
branch/HEAD/main、VERSION、AGENTS、CURRENT_SPEC、CHANGELOG、BACKLOG、正式D2及產品檔案不改，沒有Commit/Push/Merge/Deploy，沒有清理旧檔/覆蓋原資料。完成後停止等待審查。


# 現行流程與UI參考

## 1. 基準與記號

dev `ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1`、1.11.5（2026-10-12）。[主設計](CURRENT_DETAILED_DESIGN.md)、[S/RNG](STATE_AND_RNG_REFERENCE.md)、[函式來源](MODULE_FUNCTION_INDEX.md)、[验收與限制](../reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md)。

下面**12條主要責務流程**是人工核對的入口與分支，不是12個狀態涵蓋所有route，也不是完整動態call graph。W＝S/閉包寫入；R＝career RNG消耗或委派；D＝DOM；Q＝本輪測試；H＝指定歷史SHA證據。來源G＝game、E＝engine、U＝UI，行號見函式索引K表。圖中有條件箭頭，不宣稱每季都經全部步驟。

## F01 啟動與新人生

```text
HTML(src/main.js，btn-start disabled)
 → initializeDisplayPreferences [D/storage；noS/R]
 → dynamic import game [註冊controller/overlay/handlers]
 → enable btn-start
click → startJapanese3104
 → normalizeSeed/name/pos → S={rngState:0} [W]
 → seedInit2686 → newState2797 [W/R]
 → seed-only history.replaceState → show board/act/navigation [D]
 → 選手誕生card → startYear2967
```

global Master與前後兩套早期handler/binding在起動中建立；使用者不能在btn-start未啟用時發起新人生。舊INITIAL_PARAMS清其他query與最新start重設URL分時執行，replay generator另去hash，不自行加新rules。初始化throw／外部字型錯誤不能當作功能PASS。Q語法、模組、ACT入團fixture。

## F02 能力配分、Undo與reset

```text
allocUI(mode,label,done) [清act、世代++、capture S；D/W closure]
 → sessionStart {ab,carry,pool,idx,touched}
 → render rows/Undo/reset
 row click / Enter / Space → live(row)? → cap/remaining?
   → save one history → addAb [W ab/carry] → touched+=spend
   → dice idx++ OR pool-- → render/board [D]
 Undo → live(button)? → hist.pop → restore one ab/carry/pool/idx/touched → render
 reset → live(button)? → restore start snapshot → hist=[] → render
 done → live && (remaining0 OR allcap)? → completed=true
   → runWithResultView → actClear → allocDone [W/可能R] → done callback
```

live條件：同S、同choiceGeneration、未completed、element.isConnected且act包含；一次render會切離舊row。連點必須取得新row才是新合法操作，舊callback無作用。pool行1點、dice行当前一顆，既有cost/carry保留。Undo「缺key→0」與reset整張carry snapshot不同，正常等价不能擅改schema。H第七階段89/17 cases；Q ability靜態不能代替它。

## F03 年度queue

```text
startYear → stepQ=[phasePre, phaseIntlPre, phaseMid, phaseEnd]
nextStep → if S.done: stepQ=[]；else shift one f()
phasePre [W衰退/全休/R骰/plan] → dpos/alloc → nextStep
phaseIntlPre → processIntlPhase(PRE) → nextStep
phaseMid → if skipMid: nextStep
 else love → events → rollInjury → 成績選項
   → PRO proSeason / 非PRO amateurSeason → maybeIntl(POST) → nextStep
phaseEnd → 支付/能力點/movement
movement → 留隊/契約/進路/退休
advance2795 → finalizePendingOffseasonSalary → old advance1956
 → age/year/stageYr++ → resetEventYear → startYear
```

callback是同步鏈／choice-driven，不是timer推季。全休有日志与季末，不假設它也進PRO/POST正常成績路線。年度操作具體throws後能否恢復需看個別guard，runChoiceAction不回滾S。Q ACT/KBO，H完整生涯與全休契約矩陣。

## F04 年度事件

drawEvents850生成「引卡」按鈕；只有click才eventDrawPool→pick R1→beginEvent。條件候選ID排序，排除當年drawnIDs；空pool顯示說明一次done，不fallback或補抽。begin保存pending occurrence與drawn ID、sequence；render summary不抽R。

bold/norm/safe click→resolveEvent1055→applyEvent26：
processed ID已有→saved result、applied=false；新出現需pending/id/year/eligible/mode符合，否則STALE_EVENT_SELECTION。snapshot traits→chance→有能力且target未知才pick→工作副本算ab/carry/stat/injury/income/counters→trait unlock→同步commit結果／記帳→render結果→只applied才解鎖card與done。新choose保留下一個listener，resolve重繪不再次累計。

一般addAb與eventAddAbility不同成本門檻；event result abilityPoints、實際delta、carry、overflow不能混稱。處理字典保留生涯，不為省記憶體裁切。Q event-policy/integration/fix（指定原生 cases），H552分支；本輪沒有再跑全部552/UI。

## F05 業餘大會與進路

amateurSeason2887讀年度form→各stage的大會資格/賽事序：
cupOnce2870未完key才ri(-8,8)＋ovr/form/tier→tournamentResult→保存結果/points；
qualifierOnce2880只資格不加能力點，但仍有原ri。以struct index/isChampion而非includes優勝決定資格。HS選拔資格掛年度，大學神宮DIRECT/PLAYOFF，CORP與IND自有资格。

年度後consume form→push S.log／card→POST/next。movement：HS三年路線、U四年路線、CORP入社年數／entryRoute、IND續留/選秀/社會人/退休。IND正式個人成績沒有建立，薪資採明示fallback；不把大會結果當PA/IP。Q domestic與ACT入團路線，全部日程動態組合UNVERIFIED。

## F06 職業成績、受賞與快照

proSeason1231：
simSeason [R]→既有上限→event form [R0]→effort/onetool→非0form年度校正→同最終st：
accStat＋accLevelStat、年度日志、award處理 [依條件R]、薪資evaluation→captureSeasonChampionship。
之後TJ／降格監査／trade／POST；年度優勝結算用成績確定當時team snapshot，不用後來移籍隊。全休早期路徑保持0成績，不添加虛構draw。

league bucket與階級顯示共用累積，trade若分割沿同一st；award影響payD但不重算已簽schedule。H第七階段契約381/完整人生，Q evaluation/record/championship。各守位、內部近似IP与跨補正上限全矩陣未全驗。

## F07 契約建立與失敗重試

```text
offer/candidate → accept → signTo2818
 retry matches S/year/currentChoiceAction/contractId?
   yes → render completed transaction only [D；no付款/新ID]
   no → resolve team [必要pick R] → candidate/annual/terms/posting
     → fixedContract2814：KBO cap → tentative ID → createContract/validation
       throw → 不提交contractSequence/所属；已合法R不回撥
       success → commit sequence → signTo提交org/lv/stage/team/ct
     → applySigningPayment [contractId guard；W所得]
     → currentSalary/US flag/pending清理/decision履歷 [W]
     → 設signingRenderRetry → render/card/board [D]
       success清retry；render throw保存已成立約供同action重試
```

直接函式重試另比request tuple；不是所有不同caller都可重用。付款前「契約驗證」fault與付款後「描畫」fault是H已驗範圍，不能延伸成付款函式任意中途throw、decision記錄throw全rollback。完成contract validation前不提交所属，不代表所有既有caller前置buyout都可回滾。

draft：runDraft2839原score/round/team/bonus抽順→draftRights→acceptDraftSelection注入sign（rookieSalary/bonus）→SIGNED invariant→advance。sign與付款再呼叫仍同contractID guard；正常拒絕不入帳。Q draft-income quick/bonus/契約，H fault5/17與381。

## F08 續約、FA、越境與回國

予約更改pending在advance前finalize；已継続schedule不重決定年俸。appendExtension把新段接endYear+1，不改舊段；transfer維持ID/schedule；buyout只取未付保障。

faFlow3012依聯盟契約stage/権利選續約、申請調停或FA；arbitration顯示R0，點申請才chance。faMarket3032依injury/候選數/需求hash排名→入選team排序後每個jitter R1→LONG/SHORT/PROOF資料→保存lastFaMarket→接受同offer。

crossOffers2978：NPB1適用KBO/CPBL/US候選；海外普通NPB復帰須満期與OVR47/53 gate，不継続時不抽NPB隊。回國context綁S/year/ct，可重畫同候選與callback；completed一次性執行/advance。complete先設completed再執行action/finish，內層throw後的外層重試尚未補驗（驗收U06），不能由signTo局部付款安全外推整條流程可恢復。
overseasOffer(G:2971)生成候選，但接受未直接傳同candidate，會buyout後重算；current cross路線mult忽略1.3，**靜態看到mult不同不證明年俸不同**。S.transferSalarySnapshot／previousSalary fallback作用須於fixture逐步補驗，U03仍UNVERIFIED，不「修正」價格預期。

## F09 季末、收入與CORP重入

phaseEnd3068：
CORP使用WeakMap(S)同年entry；running或complete則return。try settle→complete=true，finally running=false；paid獨立于complete。
settlePhaseEnd3077先PRO年度context、防重，board/migration／normalize→settleChampionship→maintainSeasonEnd→若已付return→市況→salaryDue→markSalaryPaid→commit base/earnings/paidYear→incentive→継続文→pool/進路。
CORP企業salaryFor／首次corpIncome+earnings→paid=true→card；描畫故障再次進入只畫，不重付。
IND用年度候選／paidYear guard，不套CORP WeakMap。outside已在事件入帳，季末只顯示，不再加。

H案例企業420萬不變840萬，下一年可付；signing fault後5000萬不變1億。同年「已成功」log／進路不重覆；未成功但已付款再次render可恢復。正常PRO／IND沒有被改成全面新交易方案。隨機優勝只eligible新年度1R，已結果／全休／下級0。

## F10 國際召集、解鎖与重試

intlEvents官方Master＋未來4年估日；PRE/POST依月、level與ovr、傷病gate。已完成key不入queue；DECLINED/DENIED記completed但不造出場count。
出場：capture entryState→validate→hadIntlace/順位/個人成績on copy [R]→prepareInternationalResult→commitInternationalResult（key防重）→結果card→解鎖card→continued=true→next。
prepared/resultRendered/unlockRendered/continued是同選項閉包；render throw后保留已commit/準備好的結果，不重抽、不二次能力點/疲勞。
當次取得intlace仍用之前快照，下一次才最低2／疲勞0；國際completed與三出場兩決賽區分。Q championship-intl；H實際流程/排行比對，實機未驗。

## F11 退休與殿堂

endGame wrapper3096→LEGACY.endGame2107：done/actClear→表格/league tiers→retireScene2047→HOF演出/trait→總履歴/分享/重開選項。nextStep見done則clearqueue，不再進合約/年末；測試不得把「新しい野球人生を始める」当继续人生。

honorScore2006委派policy；tierOf2009 rawscore判tier/保底，返回round sc。代表聯盟按最佳tier再最長年數，首輪legendLeague按真首輪CPBL/KBO/NPB/MLB首個，兩者不可混用。票率/年份有演出R，不是一律讀模型；圖片不再跑演出。
HOF pending bucket/投手平衡/受賞保証/round/投票敘事不能在此改。讀取hsTier/potSum0與newState差異見U07，不標自然稱號案例PASS。

## F12 導航、偏好、分享

| DOM所有者 | 操作／生命期 | 狀態與RNG |
|---|---|---|
| HTML #board/#main-nav | navigation一次註冊button/ResizeObserver，board尺寸同步 | UI state，不careerR |
| home #log→#act-toggle→#act | 結果/選項同home，choose生成新世代；toggle collapse不重生成callback | choice tokens/R由action控制；讀取不更改S |
| player-content/career-content | provider只讀S→Frozen模型→render，tab改hidden/ARIA | renderer可重建自己內容，不動act/log |
| salary-detail-panel | provider讀ct/decision/income，focus/close handlers | 顯示schedule，不normalize后再付 |
| preferences dialog | 唯一保存display.v1；change dataset→displaychange、保持scroll | storage只設定，R0；S不保存 |
| seed-share dialog | seed-only URL、copy/native async、generation/open判舊回應 | disabled防重、finally解鎖；R0 |
| share image registry/sh-out | 已生成連接PNG themechange重生；同bytes預覽/下載/share | Canvas讀S，R0；URL status另容器不清圖 |

事件選後不自動切別頁，runWithResultView看log卡數并scroll；若callback產生下一choice，activeToken已換，runChoiceAction不清新DOM。這是現行v1.5.2後結構，不恢復早期「育成・行動」獨立頁。

prefs6.1／navigation／seed-share的Tab/Escape/焦點與44px/320px等有特定H證據。本輪Quick瀏覽器fixture結果、靜態／unit檢查與H全UI分開；未新增實機、原生share或全部視覺案例。全部unknown callback/各種Promise错误、圖預覽registry長期資源行為UNVERIFIED。

## 維護門檻

12條流程建檔不等於12條全路線VERIFIED。測試對應与未驗清單集中[驗收](../reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md)；interface及每個固定來源在模組索引。後續抽離只在批准小批次與完整相同操作/S/R/DOM/閉包證據後進行。此文件不授权重構或第十階段。

# 現行S與RNG技術參考

> 1.11.6現行補足：newState新增potSum0出生快照寫點（返回前、RNG0）；NPB回國context的running／actionCompleted／years／transaction是私有局部資料，不寫入S。原表格讀寫次數與行號固定於ea951c2，不當作新版本重盤點。[新驗收](../reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)。

## 1. 來源與閱讀方法

基準dev **ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1**，VERSION1.11.5，2026-10-12。本文件描述實作，不批准遊戲政策。G＝docs/src/engine/game.js，E＝docs/src/engine，U＝docs/src/ui。所有行號固定於基準；來源：[game.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js)。[主設計書](CURRENT_DETAILED_DESIGN.md)、[函式索引](MODULE_FUNCTION_INDEX.md)、[流程](FLOWS_AND_UI_REFERENCE.md)、[驗收](../reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md)。

AST實際掃描40JS：1739個S/state存取語法點，其中S.*1664、state.*75；直接S根欄位去重124。**不是完整S schema，也不是1739次執行**。參數s、this、ab=S.ab、contract及computed key需人工追蹤，不能由這份索引證明完整寫集合。106個目前newState object literal欄位與舊64欄literal分開；106不包含後續Object.assign、accessor、ensureEventState。

## 2. 生命週期與重要域

startJapanese(G:3104)先以normalizeSeed／normalizePlayerName正規化UI輸入，S={rngState:0}→seedInit→newState→startYear。newState(G:2797)接受name、pos；不是完整輸入驗證器，未知pos可能在POS_AB讀取失敗，不能作新增fallback的理由。16歲、2026年、HS第1年；role/dpos待後續選擇。

| 域 | 允許值／不變條件 | 主要讀取、直接／間接寫入 |
|---|---|---|
| pos、role、dpos | UI pos P/C/IF/OF；role後續SP/MR/CL；dpos C/SS/2B/3B/1B/CF/RF/LF/DH或null | ovr357、dpScore67、simSeason422讀；phasePre729/dposReview113寫；未知輸入全域未驗 |
| stage/lv/org | HS/U/CORP/IND/PRO；LV的16階層；AMATEUR/CORP/IND/NPB/KBO/CPBL/MiLB/MLB。有效org須與Master及level同時核對 | setAmateur2834、signTo2818、movement3093/LEGACY1518、trade2821；不是僅stage一個enum驗證 |
| year/age/stageYr | advance1956加年、加齡、階段年數；合約startYear與生效年分開 | advance2795先finalizePending→保存舊advance；startYear2967建queue |
| ab/pot/carry | 能力cap80、pot影響成本不是硬上限；carry可能缺key或0；pool與dice閉包非同一欄 | addAb395、eventAddAbility、injStatLoss1199、phasePre/allocDone1062；Undo只一操作，reset回session snapshot |
| team/school/球團ID | HS/U學校資料；PRO orgTeamId取Master；teamName派生。不可將畫面名當新ID | newState、setAmateur、signTo、doTradeExec；read-only VM/球團顯示讀 |
| ct/currentSalary | ct schema3；schedule是已簽保障／支付正本。annualSalary通常是第一未付年度額，最後付完可0；currentSalary仍可保留當年paid | fixedContract2814、signTo、renew、extension、level minimum、markSalaryPaid；salary-detail不重新付款 |
| 金錢 | 円、careerEarnings為實領；base/bonus/stipend/incentive/buyout/outside/corp是內訳，不能再加一次 | signTo→applySigningPayment、settlePhaseEnd、buyoutRemaining1614、applyEvent、incentive返回state；posting費不進球員所得 |
| 履歷 | 決定按salaryYear/類型去重且不裁10筆；evaluation只近3季；log是成績而非每年決定 | saveSalaryDecision2733、recordSalaryEvaluation2778、proSeason/業餘/全休push；UI讀全保存行，不造缺失 |
| stats/statsByLevel | 同一確定st加至league與level；R/A1/A2/A3歸MINOR，下級NPB/KBO/CPBL歸原聯盟 | accStat560、accLevelStat568；trade分割共用原st，不再sim；HOF用league bucket |
| 傷病 | seasonFactor、skipMid、rehab、injNext/tmpInj不同；skipMid&&factor0比rehab剩0優先 | phasePre全休、rollInjury1178、TJ、國際疲勞；condition model讀，不重判健康 |
| traits/counters | TRAIT_LABELS38個ID不代表38個均可取得；oldghost當次/翌次、intl hadIntlace快照 | ensureEventState、event解決、awardTraitUnlocks、checkGoldclothSeason、allocDone、retireScene；三個保留ID不連取得 |
| 各類年資 | serviceTime/NPB roster、foreignFirstTeamYears、firstTeamYearsByTeam、teamTally用途不同 | movement3093、accrueForeignFirstTeamSeason、recordFirstTeamSeason；不得混算或從混合bucket推測 |
| 年度event | drawnIDs為年度抽卡去重；processedIDs為出現處理去重，key year:sequence:cardID | ensure/begin/apply/resetEventYear；年初清抽卡集合與當年outside，不清生涯ledger |
| 國內/國際/優勝 | completedKeys、intlTraitResults、championshipResults為不同key/年份；國際完了含辭退不等於出場 | cupOnce/qualifier、processIntlPhase、prepare/commit、capture/settleChampionship；不能統一成一個count |
| done/hofInfo/legendLeague | done後nextStep清queue；HOF/票選不是普通讀取VM | endGame2107→retireScene2047、wrapper3096；既有legend不重新指定聯盟 |
| love | st single/dating/married等既有分支；partner/kids/exes/caught/affairs，完整域UNVERIFIED | loveEvent871各callback寫；confidanteEligible讀本人/前任孩子，不補造舊家庭資料 |

年度初始化G:729改tmpInj/seasonFactor/skipMid/lastD；event年度清理在advance1956的resetEventYear。退休done切断queue，但展示結果仍可產生HOF演出RNG；不要把endGame視為純讀取。

### 2.1 初始literal完整欄位索引（106）

型別是literal或可追蹤來源的靜態型別，不是外部輸入schema validator。null欄位後續型別見上表；更多動態域仍UNVERIFIED。

| 欄位 | 初始型別 | 初始值／表達式 | 位置 |
|---|---|---|---|
| `name` | string | `name` | G:2802 |
| `pos` | P/C/IF/OF | `pos` | G:2802 |
| `role` | nullable（域見§2） | `null` | G:2802 |
| `seed` | string | `SEED` | G:2802 |
| `version` | semver | `VERSION` | G:2802 |
| `rngState` | uint32 | `S.rngState` | G:2802 |
| `age` | number | `16` | G:2802 |
| `year` | number | `2026` | G:2802 |
| `stage` | string | `'HS'` | G:2802 |
| `stageYr` | number | `1` | G:2802 |
| `lv` | string | `'HS'` | G:2802 |
| `org` | string | `'AMATEUR'` | G:2802 |
| `pot` | 能力object | `pot` | G:2802 |
| `ab` | 能力object | `ab` | G:2802 |
| `team` | string | `school.name` | G:2802 |
| `schoolId` | string | `school.schoolId` | G:2802 |
| `schoolTier` | S/A/B | `tier` | G:2802 |
| `senbatsuEligibleYear` | nullable（域見§2） | `null` | G:2802 |
| `entryRoute` | string | `'HS'` | G:2802 |
| `orgTeamId` | nullable（域見§2） | `null` | G:2802 |
| `teamTally` | object | `{NPB:{},KBO:{},CPBL:{},MLB:{},IND:{},CORP:{}}` | G:2802 |
| `traits` | object | `{genius:false,glass:false,iron:false,scum:false,late:false,disc:false,academy:false,intlace:false,franchise:false,clutch:false,phoenix:false,combo:false,onetool:false,rubber:false,legend:false,yips:false,distract:false,cancer:false,ambience:false,goldcloth:false,thief:false,mrteam:false,confidante:false,smallschool:false,grinder:false,rainbow:false,taiwan:false}` | G:2803 |
| `removed` | array | `[]` | G:2803 |
| `cntSave` | number | `0` | G:2803 |
| `cntSaveWin` | number | `0` | G:2803 |
| `cntSnack` | number | `0` | G:2803 |
| `cntBoldWin` | number | `0` | G:2803 |
| `cntBoldFail` | number | `0` | G:2803 |
| `samePick` | number | `0` | G:2803 |
| `samePickKey` | nullable（域見§2） | `null` | G:2803 |
| `teamYears` | number | `0` | G:2803 |
| `six` | number | `0` | G:2803 |
| `bigInj` | number | `0` | G:2803 |
| `ironStreak` | number | `0` | G:2803 |
| `npbYears` | number | `0` | G:2803 |
| `npbDevYears` | number | `0` | G:2803 |
| `corpYears` | number | `0` | G:2803 |
| `indYears` | number | `0` | G:2803 |
| `injNext` | number | `0` | G:2803 |
| `tmpInj` | number | `0` | G:2803 |
| `rehab` | number | `0` | G:2803 |
| `currentSalary` | number | `0` | G:2803 |
| `careerEarnings` | number | `0` | G:2803 |
| `careerBaseSalary` | number | `0` | G:2803 |
| `careerSigningBonus` | number | `0` | G:2803 |
| `careerDevelopmentStipend` | number | `0` | G:2803 |
| `signingPayments` | object | `{}` | G:2803 |
| `foreignFirstTeamYears` | object | `{}` | G:2803 |
| `americanContractSigned` | boolean | `false` | G:2803 |
| `careerIncentive` | number | `0` | G:2803 |
| `careerBuyout` | number | `0` | G:2803 |
| `corpIncome` | number | `0` | G:2803 |
| `yearlyIncentivePaid` | object | `{}` | G:2803 |
| `lastFaMarket` | nullable（域見§2） | `null` | G:2803 |
| `lastSalaryPaidYear` | nullable（域見§2） | `null` | G:2803 |
| `salaryEvaluationHistory` | array | `[]` | G:2803 |
| `lastSalaryEvaluation` | nullable（域見§2） | `null` | G:2803 |
| `lastSalaryDecision` | nullable（域見§2） | `null` | G:2803 |
| `salaryDecisionHistory` | array | `[]` | G:2803 |
| `contractSequence` | number | `0` | G:2803 |
| `serviceTime` | object | `{NPB:0,MLB:0,KBO:0,CPBL:0}` | G:2803 |
| `serviceTimeAccruedYear` | nullable（域見§2） | `null` | G:2803 |
| `marketInjury` | string | `'HEALTHY'` | G:2803 |
| `lastArbitration` | nullable（域見§2） | `null` | G:2803 |
| `_salaryV130Migrated` | boolean | `true` | G:2803 |
| `_salaryV140Migrated` | boolean | `true` | G:2803 |
| `pool` | number | `0` | G:2803 |
| `seasonFactor` | number | `1` | G:2803 |
| `stats` | object | `{NPB:null,KBO:null,CPBL:null,MLB:null,MINOR:null,IND:null,CORP:null}` | G:2803 |
| `statsByLevel` | object | `{NPB1:null,NPB2:null,NPB_DEV:null,KBO1:null,KBO2:null,CPBL1:null,CPBL2:null,MLB:null,A3:null,A2:null,A1:null,R:null,IND:null,CORP:null}` | G:2803 |
| `honors` | array | `[]` | G:2803 |
| `intlCount` | number | `0` | G:2803 |
| `intlCompletedKeys` | object | `{}` | G:2803 |
| `intlLastEventKey` | nullable（域見§2） | `null` | G:2803 |
| `intlDispatchStatus` | nullable（域見§2） | `null` | G:2803 |
| `intlDeclinedCount` | number | `0` | G:2803 |
| `intlStat` | object | `{G:0,PA:0,AB:0,H:0,HR:0,RBI:0,IP:0,SO:0,ER:0,W:0,SV:0}` | G:2803 |
| `intlBest` | nullable（域見§2） | `null` | G:2803 |
| `dpos` | nullable（域見§2） | `null` | G:2803 |
| `dposYears` | object | `{}` | G:2803 |
| `roleYears` | object | `{}` | G:2803 |
| `tradeRefuse` | number | `0` | G:2803 |
| `champThisTeam` | boolean | `false` | G:2803 |
| `svc` | number | `0` | G:2803 |
| `svcOrg` | nullable（域見§2） | `null` | G:2803 |
| `faElig` | boolean | `false` | G:2803 |
| `npbRosterDays` | number | `0` | G:2803 |
| `npbFaSeasons` | number | `0` | G:2803 |
| `faType` | nullable（域見§2） | `null` | G:2803 |
| `faUsed` | boolean | `false` | G:2803 |
| `faMarketKey` | nullable（域見§2） | `null` | G:2803 |
| `tradeHeat` | number | `0` | G:2803 |
| `complainCount` | number | `0` | G:2803 |
| `demotionRefused` | boolean | `false` | G:2803 |
| `tj` | number | `0` | G:2803 |
| `tjCount` | number | `0` | G:2803 |
| `effort` | string | `'普通投'` | G:2803 |
| `tjSuccess` | number | `0` | G:2803 |
| `love` | object | `{st:'single',partner:null,kids:0,caught:0,affairs:0,exes:[],dyrs:0,datedTimes:0}` | G:2803 |
| `log` | array | `[]` | G:2803 |
| `ct` | nullable（域見§2） | `null` | G:2803 |
| `draftRights` | nullable（域見§2） | `null` | G:2803 |
| `domesticTournamentLog` | array | `[]` | G:2803 |
| `domesticTournamentStats` | object | `{}` | G:2803 |
| `domesticCompletedKeys` | object | `{}` | G:2803 |
| `done` | boolean | `false` | G:2803 |

### 2.2 literal以外的初始／懶生成欄位

G:2804–2810：salary非列舉accessor讀寫careerEarnings；orgTeam非列舉accessor映orgTeamId，teamName函式讀Master。JSON快照不會包含accessor／函式，不能靠JSON等價證明這些行為不變。

G:2808新增oldGhostPending/Used=false、firstTeamSeasons/firstTeamYearsByTeam/tripleCrownHistory={}；2809新增championshipResults={}、seasonChampContext=null、seasonEndMaintenanceYear=null、兩migrationVersion=1、intlFinalCount=0、intlTraitResults={}。迴圈補全traits所有38ID為false。

E/event-state-policy:4補eventSchemaVersion=1、pendStat=0、sequence=0、processedIDs={}、pending=null、ledger=[]、seasonContext=null、eventDrawYear=year、drawnIDs=[]及6個income/counter=0。後续carry、lastOverflow、lastD/lastSt、champTeam、hofInfo、legendLeague等按流程懶生成；**未初始化不等於可刪欄位**。

### 2.3 S外但影響交易／重播的狀態

| 閉包 | 生命期與用途 | 不變條件／缺口 |
|---|---|---|
| _s/SEED | G主module；R同步_s及S.rngState | 換S與boot先seed；勿只改_s |
| stepQ | G:228／startYear2967 | shift同步callback，done則清；閉包不可序列化成S等價證據 |
| choiceGeneration/activeChoiceToken | G:650／choose665 | 新choose替換token；舊DOM callback與現token分開 |
| currentChoiceAction/resultViewDepth | G:660–664 | invokeChoiceAction try/finally還原；結果新增才scrollBottom，無導航重建 |
| alloc dice/pool/idx/hist/touched/session | G:678–717 | 只當前S/世代/connected DOM/未完session；done先completed，reset不抽骰 |
| pendingOffseasonSalary | G:2697／finalize2743 | 予約待所屬確定；advance前commit，同額候選不可被清0污染 |
| signingRenderRetry | G:2816–2818 | 同S/year/action/ctID；直接調用另比request tuple；成功render後清 |
| corpSettlements WeakMap | G:3066–3075 | key S、年度entry running/paid/complete；UI失敗后paid保留、不誤標complete |
| seasonEndContext | G:3065／settle3076 | PRO同年度防重；非全面付款rollback |
| npbReturnOfferContext | G:2977–3004 | state/year/ct物件；候選+callback保持，completed防雙advance |
| UI uiState/preferences/dialog代數 | U/navigation、preferences、seed-share | 與S分開；非同步分享不得把舊結果寫回重開dialog |
| share preview registry | G/shareImage/displaychange | 僅theme變更重生已連接PNG；字級/密度不重生 |

第七階段修復已由H:13abcf5特定fault/session測試驗證；任意caller、付款函式內部任意throw、global clone/rollback不在保障內。詳見[流程](FLOWS_AND_UI_REFERENCE.md)。

## 3. 直接S讀／寫語法索引（124根欄位）

read/write數是AST點；寫點展示最多前6個，包含舊definition，**不是現行完整caller地圖**。除去沒有直接寫點的欄位仍可能由s/this/state等間接變更。完整靜態輸出在ignored test-results/stage9/architecture.json，可按基準與同版parser重建；不要當trace。

| 根欄位 | read／write+mutate點 | 前6寫點／限制 |
|---|---|---|
| `_daiba` | 2/2 | `engine/game.js:1631 daibaFarewell@1629`；`engine/game.js:2969 daibaFarewell@2969` |
| `_majorInjuryThisSeason` | 2/2 | `engine/game.js:730 phasePre@729`；`engine/game.js:1188 rollInjury@1178` |
| `_salaryV130Migrated` | 1/1 | `engine/game.js:2700 migrateSalaryV130State@2698` |
| `_salaryV140Migrated` | 0/1 | `engine/game.js:2706 migrateSalaryV140State@2702` |
| `ab` | 39/17 | `engine/game.js:303 tjTwoStrike@302`；`engine/game.js:304 tjTwoStrike@302`；`engine/game.js:310 tjBigInjury@307`；`engine/game.js:310 tjBigInjury@307`；`engine/game.js:319 tjBigInjury@307`；`engine/game.js:320 tjBigInjury@307` |
| `age` | 54/1 | `engine/game.js:1957 advance@1956` |
| `americanContractSigned` | 1/1 | `engine/game.js:2818 signTo@2818` |
| `bigInj` | 8/1 | `engine/game.js:1188 rollInjury@1178` |
| `careerBaseSalary` | 6/3 | `engine/game.js:2704 migrateSalaryV140State@2702`；`engine/game.js:3091 settlePhaseEnd@3077`；`engine/game.js:3091 settlePhaseEnd@3077` |
| `careerBuyout` | 4/1 | `engine/game.js:1620 buyoutRemaining@1614` |
| `careerDevelopmentStipend` | 4/0 | 無直接寫點（alias/helper另查） |
| `careerEarnings` | 18/13 | `engine/game.js:1491 phaseEnd@1487`；`engine/game.js:1621 buyoutRemaining@1614`；`engine/game.js:1715 <callback@1715>@1715`；`engine/game.js:1827 <callback@1827>@1827`；`engine/game.js:1830 <callback@1830>@1830`；`engine/game.js:1859 <callback@1859>@1859` |
| `careerIncentive` | 4/2 | `engine/game.js:2704 migrateSalaryV140State@2702`；`engine/game.js:3091 settlePhaseEnd@3077` |
| `careerOutsideIncome` | 4/0 | 無直接寫點（alias/helper另查） |
| `careerSigningBonus` | 4/0 | 無直接寫點（alias/helper另查） |
| `carry` | 11/7 | `engine/game.js:398 addAb@395`；`engine/game.js:408 addAb@395`；`engine/game.js:707 u.onclick@707`；`engine/game.js:707 u.onclick@707`；`engine/game.js:709 reset.onclick@709`；`engine/game.js:1031 addAbStat@1017` |
| `champTeam` | 1/5 | `engine/game.js:1167 doTradeExec@1165`；`engine/game.js:1499 phaseEnd@1487`；`engine/game.js:1704 signTo@1700`；`engine/game.js:2818 signTo@2818`；`engine/game.js:2824 doTradeExec@2821` |
| `champThisTeam` | 1/5 | `engine/game.js:1167 doTradeExec@1165`；`engine/game.js:1499 phaseEnd@1487`；`engine/game.js:1704 signTo@1700`；`engine/game.js:2818 signTo@2818`；`engine/game.js:2824 doTradeExec@2821` |
| `comboKey` | 3/1 | `engine/game.js:1072 allocDone@1062` |
| `complainCount` | 2/1 | `engine/game.js:1154 <callback@1153>@1153` |
| `contractSequence` | 3/2 | `engine/game.js:2813 nextContractId@2813`；`engine/game.js:2814 fixedContract@2814` |
| `corpIncome` | 5/1 | `engine/game.js:3091 settlePhaseEnd@3077` |
| `corpYears` | 4/3 | `engine/game.js:2835 setAmateur@2835`；`engine/game.js:3048 <callback@3048>@3048`；`engine/game.js:3093 movement@3093` |
| `ct` | 74/19 | `engine/game.js:1602 movement@1518`；`engine/game.js:1608 movement@1518`；`engine/game.js:1610 movement@1518`；`engine/game.js:1624 buyoutRemaining@1614`；`engine/game.js:1706 signTo@1700`；`engine/game.js:1815 <callback@1815>@1815` |
| `currentSalary` | 34/12 | `engine/game.js:1625 buyoutRemaining@1614`；`engine/game.js:2705 migrateSalaryV140State@2702`；`engine/game.js:2749 finalizePendingOffseasonSalary@2743`；`engine/game.js:2762 applyLevelSalary@2755`；`engine/game.js:2763 applyLevelSalary@2755`；`engine/game.js:2818 signTo@2818` |
| `demotionRefused` | 1/2 | `engine/game.js:1117 demotionAudit@1115`；`engine/game.js:1671 <callback@1670>@1670` |
| `domesticCompletedKeys` | 2/2 | `engine/game.js:2874 cupOnce@2870`；`engine/game.js:2883 qualifierOnce@2880` |
| `domesticTournamentLog` | 2/2 | `engine/game.js:2875 cupOnce@2870`；`engine/game.js:2884 qualifierOnce@2880` |
| `done` | 1/1 | `engine/game.js:2108 endGame@2107` |
| `dpos` | 31/8 | `engine/game.js:116 dposReview@113`；`engine/game.js:123 <callback@123>@123`；`engine/game.js:125 <callback@125>@125`；`engine/game.js:131 <callback@131>@131`；`engine/game.js:133 dposReview@113`；`engine/game.js:155 dposReview@113` |
| `dposYears` | 2/1 | `engine/game.js:564 accStat@560` |
| `draftRights` | 0/1 | `engine/game.js:2841 runDraft@2839` |
| `effort` | 2/3 | `engine/game.js:788 <callback@788>@788`；`engine/game.js:789 <callback@789>@789`；`engine/game.js:790 <callback@790>@790` |
| `entryRoute` | 1/0 | 無直接寫點（alias/helper另查） |
| `faElig` | 3/7 | `engine/game.js:807 <callback@806>@806`；`engine/game.js:810 <callback@809>@809`；`engine/game.js:1537 movement@1518`；`engine/game.js:1539 movement@1518`；`engine/game.js:1890 accept@1889`；`engine/game.js:3093 movement@3093` |
| `faMarketKey` | 0/1 | `engine/game.js:3035 faMarket@3032` |
| `faType` | 3/2 | `engine/game.js:3016 faFlow@3012`；`engine/game.js:3018 declareFA@3018` |
| `faUsed` | 0/1 | `engine/game.js:3018 declareFA@3018` |
| `hofInfo` | 5/2 | `engine/game.js:2094 <callback@2082>@2082`；`engine/game.js:2094 <callback@2082>@2082` |
| `honors` | 19/5 | `engine/game.js:1225 <callback@1218>@1218`；`engine/game.js:1478 <callback@1449>@1449`；`engine/game.js:1479 <callback@1449>@1449`；`engine/game.js:1499 phaseEnd@1487`；`engine/game.js:2876 cupOnce@2870` |
| `hsTier` | 2/0 | 無直接寫點（alias/helper另查） |
| `incomeLedger` | 1/0 | 無直接寫點（alias/helper另查） |
| `indYears` | 2/3 | `engine/game.js:2835 setAmateur@2835`；`engine/game.js:3048 <callback@3048>@3048`；`engine/game.js:3093 movement@3093` |
| `injNext` | 2/3 | `engine/game.js:1180 rollInjury@1178`；`engine/game.js:1181 rollInjury@1178`；`engine/game.js:1455 <callback@1449>@1449` |
| `intlCompletedKeys` | 5/2 | `engine/game.js:1441 maybeIntl@1435`；`engine/game.js:2926 completeIntl@2923` |
| `intlCount` | 12/1 | `engine/game.js:1455 <callback@1449>@1449` |
| `intlDeclinedCount` | 1/1 | `engine/game.js:2925 completeIntl@2923` |
| `intlDispatchStatus` | 0/2 | `engine/game.js:2926 completeIntl@2923`；`engine/game.js:2941 next@2933` |
| `intlLastEventKey` | 0/1 | `engine/game.js:2926 completeIntl@2923` |
| `intlStat` | 4/0 | 無直接寫點（alias/helper另查） |
| `intlTop4` | 2/1 | `engine/game.js:1475 <callback@1449>@1449` |
| `ironStreak` | 2/5 | `engine/game.js:833 phaseMid@831`；`engine/game.js:1183 rollInjury@1178`；`engine/game.js:1188 rollInjury@1178`；`engine/game.js:1290 proSeason@1231`；`engine/game.js:1293 proSeason@1231` |
| `lastArbitration` | 5/2 | `engine/game.js:2700 migrateSalaryV130State@2698`；`engine/game.js:3009 complete@3009` |
| `lastD` | 24/2 | `engine/game.js:730 phasePre@729`；`engine/game.js:1232 proSeason@1231` |
| `lastFaMarket` | 4/3 | `engine/game.js:2704 migrateSalaryV140State@2702`；`engine/game.js:3025 acceptFaOffer@3025`；`engine/game.js:3041 faMarket@3032` |
| `lastKboPackage` | 1/1 | `engine/game.js:2814 fixedContract@2814` |
| `lastOverflow` | 1/2 | `engine/game.js:396 addAb@395`；`engine/game.js:407 addAb@395` |
| `lastSalaryDecision` | 3/1 | `engine/game.js:2737 saveSalaryDecision@2732` |
| `lastSalaryEvaluation` | 2/1 | `engine/game.js:2776 saveSalaryEvaluation@2773` |
| `lastSalaryPaidYear` | 3/2 | `engine/game.js:3091 settlePhaseEnd@3077`；`engine/game.js:3091 settlePhaseEnd@3077` |
| `lastSt` | 1/1 | `engine/game.js:1232 proSeason@1231` |
| `lastTrade` | 1/1 | `engine/game.js:2826 doTradeExec@2821` |
| `legendLeague` | 2/1 | `engine/game.js:2102 retireScene@2047` |
| `log` | 13/6 | `engine/game.js:740 phasePre@729`；`engine/game.js:1213 amateurSeason@1211`；`engine/game.js:1227 amateurSeason@1211`；`engine/game.js:1286 proSeason@1231`；`engine/game.js:2887 amateurSeason@2887`；`engine/game.js:2916 amateurSeason@2887` |
| `love` | 9/0 | 無直接寫點（alias/helper另查） |
| `lv` | 85/11 | `engine/game.js:1597 movement@1518`；`engine/game.js:1661 <callback@1661>@1661`；`engine/game.js:1662 doDemote@1641`；`engine/game.js:1701 signTo@1700`；`engine/game.js:1827 <callback@1827>@1827`；`engine/game.js:1828 <callback@1828>@1828` |
| `marketInjury` | 11/3 | `engine/game.js:1311 proSeason@1231`；`engine/game.js:2700 migrateSalaryV130State@2698`；`engine/game.js:3091 settlePhaseEnd@3077` |
| `mrTeamName` | 3/1 | `engine/game.js:1548 movement@1518` |
| `name` | 9/0 | 無直接寫點（alias/helper另查） |
| `npbFaSeasons` | 2/2 | `engine/game.js:3018 declareFA@3018`；`engine/game.js:3093 movement@3093` |
| `npbRosterDays` | 3/2 | `engine/game.js:3093 movement@3093`；`engine/game.js:3093 movement@3093` |
| `npbYears` | 4/2 | `engine/game.js:1535 movement@1518`；`engine/game.js:1707 signTo@1700` |
| `org` | 63/5 | `engine/game.js:1701 signTo@1700`；`engine/game.js:2818 signTo@2818`；`engine/game.js:2834 setSchool@2834`；`engine/game.js:2835 setAmateur@2835`；`engine/game.js:3048 <callback@3048>@3048` |
| `orgTeamId` | 33/6 | `engine/game.js:1169 doTradeExec@1165`；`engine/game.js:1705 signTo@1700`；`engine/game.js:2818 signTo@2818`；`engine/game.js:2824 doTradeExec@2821`；`engine/game.js:2835 setAmateur@2835`；`engine/game.js:3048 <callback@3048>@3048` |
| `pendStat` | 8/4 | `engine/game.js:760 afterAsk@741`；`engine/game.js:1023 addAbStat@1017`；`engine/game.js:1034 addAbStat@1017`；`engine/game.js:1038 statBonus@1037` |
| `pool` | 8/6 | `engine/game.js:1226 amateurSeason@1211`；`engine/game.js:1431 awards@1317`；`engine/game.js:1455 <callback@1449>@1449`；`engine/game.js:1506 phaseEnd@1487`；`engine/game.js:2874 cupOnce@2870`；`engine/game.js:3091 settlePhaseEnd@3077` |
| `pos` | 89/0 | 無直接寫點（alias/helper另查） |
| `pot` | 13/4 | `engine/game.js:310 tjBigInjury@307`；`engine/game.js:310 tjBigInjury@307`；`engine/game.js:776 <callback@776>@776`；`engine/game.js:1083 <callback@1083>@1083` |
| `potSum0` | 1/0 | 無直接寫點（alias/helper另查） |
| `prevD` | 2/1 | `engine/game.js:730 phasePre@729` |
| `rainbowLg` | 0/1 | `engine/game.js:1556 movement@1518` |
| `rehab` | 8/4 | `engine/game.js:290 <callback@289>@289`；`engine/game.js:308 tjBigInjury@307`；`engine/game.js:736 phasePre@729`；`engine/game.js:1190 rollInjury@1178` |
| `removed` | 7/2 | `engine/game.js:262 removeTrait@261`；`engine/game.js:1300 proSeason@1231` |
| `rngState` | 5/2 | `engine/game.js:2686 seedInit@2686`；`engine/game.js:2687 R@2687` |
| `role` | 24/4 | `engine/game.js:141 <callback@141>@141`；`engine/game.js:143 <callback@143>@143`；`engine/game.js:147 dposReview@113`；`engine/game.js:423 simSeason@422` |
| `roleYears` | 2/1 | `engine/game.js:565 accStat@560` |
| `salaryDecisionHistory` | 2/1 | `engine/game.js:2737 saveSalaryDecision@2732` |
| `salaryEvaluationHistory` | 12/1 | `engine/game.js:2775 saveSalaryEvaluation@2773` |
| `samePick` | 2/3 | `engine/game.js:1068 allocDone@1062`；`engine/game.js:1069 allocDone@1062`；`engine/game.js:1070 allocDone@1062` |
| `samePickBonus` | 0/1 | `engine/game.js:1071 allocDone@1062` |
| `samePickKey` | 4/2 | `engine/game.js:1069 allocDone@1062`；`engine/game.js:1070 allocDone@1062` |
| `schoolId` | 1/1 | `engine/game.js:2834 setSchool@2834` |
| `schoolTier` | 4/1 | `engine/game.js:2834 setSchool@2834` |
| `seasonFactor` | 37/4 | `engine/game.js:730 phasePre@729`；`engine/game.js:736 phasePre@729`；`engine/game.js:1183 rollInjury@1178`；`engine/game.js:1187 rollInjury@1178` |
| `seed` | 4/0 | 無直接寫點（alias/helper另查） |
| `senbatsuEligibleYear` | 1/2 | `engine/game.js:2890 amateurSeason@2887`；`engine/game.js:2893 amateurSeason@2887` |
| `serviceTime` | 5/4 | `engine/game.js:2700 migrateSalaryV130State@2698`；`engine/game.js:3093 movement@3093`；`engine/game.js:3093 movement@3093`；`engine/game.js:3093 movement@3093` |
| `serviceTimeAccruedYear` | 2/2 | `engine/game.js:2700 migrateSalaryV130State@2698`；`engine/game.js:3093 movement@3093` |
| `six` | 3/1 | `engine/game.js:748 afterAsk@741` |
| `skipMid` | 11/2 | `engine/game.js:730 phasePre@729`；`engine/game.js:736 phasePre@729` |
| `stage` | 73/18 | `engine/game.js:807 <callback@806>@806`；`engine/game.js:810 <callback@809>@809`；`engine/game.js:1890 accept@1889`；`engine/game.js:1903 <callback@1899>@1899`；`engine/game.js:1904 <callback@1899>@1899`；`engine/game.js:1914 <callback@1913>@1913` |
| `stageYr` | 16/9 | `engine/game.js:1903 <callback@1899>@1899`；`engine/game.js:1914 <callback@1913>@1913`；`engine/game.js:1918 <callback@1918>@1918`；`engine/game.js:1957 advance@1956`；`engine/game.js:2818 signTo@2818`；`engine/game.js:2835 setAmateur@2835` |
| `stats` | 27/2 | `engine/game.js:561 accStat@560`；`engine/game.js:1336 awards@1317` |
| `statsByLevel` | 4/2 | `engine/game.js:570 accLevelStat@568`；`engine/game.js:571 accLevelStat@568` |
| `svc` | 3/4 | `engine/game.js:807 <callback@806>@806`；`engine/game.js:810 <callback@809>@809`；`engine/game.js:1539 movement@1518`；`engine/game.js:1890 accept@1889` |
| `svcOrg` | 2/1 | `engine/game.js:1538 movement@1518` |
| `team` | 13/13 | `engine/game.js:807 <callback@806>@806`；`engine/game.js:810 <callback@809>@809`；`engine/game.js:1890 accept@1889`；`engine/game.js:1903 <callback@1899>@1899`；`engine/game.js:1904 <callback@1899>@1899`；`engine/game.js:1914 <callback@1913>@1913` |
| `teamName` | 20/1 | `engine/game.js:2635 <callback@2628>@2628` |
| `teamTally` | 5/1 | `engine/game.js:562 accStat@560` |
| `teamYears` | 3/5 | `engine/game.js:1167 doTradeExec@1165`；`engine/game.js:1542 movement@1518`；`engine/game.js:1704 signTo@1700`；`engine/game.js:2818 signTo@2818`；`engine/game.js:2824 doTradeExec@2821` |
| `tj` | 5/4 | `engine/game.js:280 tjAccrue@276`；`engine/game.js:290 <callback@289>@289`；`engine/game.js:297 <callback@296>@296`；`engine/game.js:308 tjBigInjury@307` |
| `tjCount` | 12/2 | `engine/game.js:290 <callback@289>@289`；`engine/game.js:308 tjBigInjury@307` |
| `tjSuccess` | 2/3 | `engine/game.js:331 afterGamble@330`；`engine/game.js:334 afterGamble@330`；`engine/game.js:337 afterGamble@330` |
| `tmpInj` | 3/2 | `engine/game.js:730 phasePre@729`；`engine/game.js:981 <callback@979>@979` |
| `toolRole` | 4/2 | `engine/game.js:1302 proSeason@1231`；`engine/game.js:1308 proSeason@1231` |
| `tradeFrom` | 4/1 | `engine/game.js:1287 proSeason@1231` |
| `tradeHeat` | 3/1 | `engine/game.js:1501 phaseEnd@1487` |
| `tradeRefuse` | 5/2 | `engine/game.js:1148 <callback@1147>@1147`；`engine/game.js:1500 phaseEnd@1487` |
| `traits` | 108/26 | `engine/game.js:259 traitCard@259`；`engine/game.js:261 removeTrait@261`；`engine/game.js:332 afterGamble@330`；`engine/game.js:770 afterAsk@741`；`engine/game.js:918 <callback@914>@914`；`engine/game.js:960 loveCaught@955` |
| `transferSalarySnapshot` | 2/1 | `engine/game.js:1615 buyoutRemaining@1614` |
| `wonChamp` | 0/1 | `engine/game.js:1499 phaseEnd@1487` |
| `year` | 96/1 | `engine/game.js:1957 advance@1956` |
| `yearOutsideIncome` | 8/0 | 無直接寫點（alias/helper另查） |
| `yearlyIncentivePaid` | 3/2 | `engine/game.js:2704 migrateSalaryV140State@2702`；`engine/game.js:3091 settlePhaseEnd@3077` |

## 4. Seed與RNG

normalizeSeed(G:2672) NFKC、trim、控制字移除、Unicode code point最多24。預設名hash使用salt不消耗career R；crypto新Seed是UI熵，不是R序列。

現行seedInit2686＝FNV1a32('v1:'+seed)或非0fallback；R2687＝Mulberry32 uint32更新S.rngState並同步_s。早期seedInit46/R47定義仍在，但overlay更換binding；ri48、pick49、chance50讀現行R。N0:56每次4R。不能用Math.random替代，不能在設定或圖片render前抽R。

| 順序敏感窗口 | 已確認順序 | 不可假設 |
|---|---|---|
| 建立玩家 | 每能力ri→位置加值ri→Fisher–Yates→pot各ri→tier R→school pick | 先pot再洗牌不等價；名字不混career seed |
| 特訓 | 個數R／academy chance→出目ri→combo額外ri→天才補正shuffle→allocUI | reset重用出目；allocDone可能解鎖抽R，不能預覽先判 |
| 事件 | ID排序/eligible去重pool→pick卡→begin→chance成敗→必要target pick→commit→result | 重新畫卡不抽；RAND且ability0不抽target |
| 業餘 | 尚未完成key→ri(-8,8)→pure qualification/tournament→保存key | 資格戰0點不等於沒有原ri |
| 職業 | simSeason/N0→form→effort/onetool→統計／award→salary evaluation→champ snapshot→TJ/降格/交易→POST | 不把snapshot挪到轉隊後，0pendStat不加新校正 |
| 國際 | validate→hadIntlace快照→rank pick→個人成績ri/R→prepare→commit→render→繼續一次 | 已完/拒絕/全休無出場抽；解鎖當次不溯及 |
| 季末 | eligible優勝random1→維護refuse/heat→schedule/base+incentive→pool→movement | 非eligible與已有result0；CORP guard先于付款 |
| 選秀 | score/round/team原抽順→bonus ri→接受契約 | 育成固定290萬仍保留原bonus ri，不能移除無用值 |
| FA | deterministic需求排序→入選teamID排序後jitter random1/team→確定接受 | 不先抽全部Master jitter；展示候選不是重新生成 |
| 海外/回國 | 合約満期及能力gate→球團pick→candidate→接受時years ri | 回國cache重畫R0；跨聯盟contractMult被忽略，不因表面1/1.3立即宣稱價格Bug |
| 調停 | 顯示terms→選申請才chance | 開dialog不決定輸贏 |
| 退休 | tier/honor→retireScene票選演出ri/R→固定結果→shareImage | 開圖片不是重跑endGame；票選與自然殿堂率需獨立研究 |

本輪Q fixed-seed-v160等入口PASS，不是本輪每路線完整人生trace。H第七階段原P first-row 542操作/R652、IF balanced404/R677，在其固定基準下逐步S/R一致；不可混合不同策略或改版把這些次數當通用預期。

## 5. RNG語法點完整索引（196）

192在game、2在event-state（注入chance/pick）、1 championship random、1 market random。統計工具把seedInit、crypto.getRandomValues等也列為「RNG相關語法」，**不是196個career消耗點**。含覆寫前定義、未證可達callback、不同條件分支；間接N0和函式傳入random沒有由此表計出每生涯呼叫次數。所有行僅IMPLEMENTED語法存在；動態次數未驗UNVERIFIED。

| 檔案／行 | lexical owner（非caller證明） | 呼叫字面target |
|---|---|---|
| `engine/championship-policy.js:55` | `settleChampionship@51` | `random` |
| `engine/event-state-policy.js:32` | `applyEvent@26` | `chance` |
| `engine/event-state-policy.js:34` | `applyEvent@26` | `pick` |
| `engine/game.js:41` | `<callback@41>@41` | `crypto.getRandomValues` |
| `engine/game.js:48` | `ri@48` | `R` |
| `engine/game.js:49` | `pick@49` | `R` |
| `engine/game.js:50` | `chance@50` | `R` |
| `engine/game.js:56` | `N0@56` | `R` |
| `engine/game.js:56` | `N0@56` | `R` |
| `engine/game.js:56` | `N0@56` | `R` |
| `engine/game.js:56` | `N0@56` | `R` |
| `engine/game.js:230` | `<callback@230>@230` | `ri` |
| `engine/game.js:231` | `newState@229` | `ri` |
| `engine/game.js:231` | `newState@229` | `ri` |
| `engine/game.js:231` | `newState@229` | `ri` |
| `engine/game.js:231` | `newState@229` | `ri` |
| `engine/game.js:234` | `newState@229` | `R` |
| `engine/game.js:237` | `<callback@237>@237` | `ri` |
| `engine/game.js:237` | `<callback@237>@237` | `ri` |
| `engine/game.js:237` | `<callback@237>@237` | `ri` |
| `engine/game.js:237` | `<callback@237>@237` | `ri` |
| `engine/game.js:239` | `<callback@239>@239` | `ri` |
| `engine/game.js:239` | `<callback@239>@239` | `ri` |
| `engine/game.js:239` | `<callback@239>@239` | `ri` |
| `engine/game.js:239` | `<callback@239>@239` | `ri` |
| `engine/game.js:244` | `newState@229` | `R` |
| `engine/game.js:291` | `<callback@289>@289` | `ri` |
| `engine/game.js:291` | `<callback@289>@289` | `ri` |
| `engine/game.js:297` | `<callback@296>@296` | `chance` |
| `engine/game.js:310` | `tjBigInjury@307` | `chance` |
| `engine/game.js:315` | `tjBigInjury@307` | `ri` |
| `engine/game.js:315` | `tjBigInjury@307` | `ri` |
| `engine/game.js:433` | `simSeason@422` | `R` |
| `engine/game.js:439` | `simSeason@422` | `R` |
| `engine/game.js:464` | `simSeason@422` | `chance` |
| `engine/game.js:464` | `simSeason@422` | `ri` |
| `engine/game.js:489` | `simSeason@422` | `R` |
| `engine/game.js:496` | `simSeason@422` | `R` |
| `engine/game.js:510` | `applySeasonForm@507` | `R` |
| `engine/game.js:742` | `<callback@742>@742` | `R` |
| `engine/game.js:744` | `afterAsk@741` | `chance` |
| `engine/game.js:747` | `afterAsk@741` | `ri` |
| `engine/game.js:747` | `afterAsk@741` | `ri` |
| `engine/game.js:747` | `afterAsk@741` | `ri` |
| `engine/game.js:756` | `afterAsk@741` | `ri` |
| `engine/game.js:756` | `afterAsk@741` | `ri` |
| `engine/game.js:756` | `afterAsk@741` | `ri` |
| `engine/game.js:774` | `afterAsk@741` | `R` |
| `engine/game.js:855` | `<callback@852>@852` | `pick` |
| `engine/game.js:882` | `loveEvent@871` | `chance` |
| `engine/game.js:883` | `loveEvent@871` | `pick` |
| `engine/game.js:883` | `loveEvent@871` | `pick` |
| `engine/game.js:889` | `loveEvent@871` | `chance` |
| `engine/game.js:890` | `loveEvent@871` | `R` |
| `engine/game.js:891` | `loveEvent@871` | `pick` |
| `engine/game.js:895` | `<callback@893>@893` | `chance` |
| `engine/game.js:908` | `loveEvent@871` | `chance` |
| `engine/game.js:911` | `loveEvent@871` | `pick` |
| `engine/game.js:915` | `<callback@914>@914` | `chance` |
| `engine/game.js:927` | `loveEvent@871` | `chance` |
| `engine/game.js:928` | `loveEvent@871` | `pick` |
| `engine/game.js:932` | `loveEvent@871` | `R` |
| `engine/game.js:934` | `loveEvent@871` | `pick` |
| `engine/game.js:938` | `<callback@936>@936` | `chance` |
| `engine/game.js:957` | `loveCaught@955` | `pick` |
| `engine/game.js:968` | `<callback@967>@967` | `chance` |
| `engine/game.js:970` | `<callback@967>@967` | `pick` |
| `engine/game.js:988` | `loveCaughtDating@986` | `pick` |
| `engine/game.js:999` | `<callback@998>@998` | `chance` |
| `engine/game.js:1001` | `<callback@998>@998` | `pick` |
| `engine/game.js:1081` | `allocDone@1062` | `R` |
| `engine/game.js:1136` | `tradeCheck@1131` | `chance` |
| `engine/game.js:1157` | `<callback@1153>@1153` | `chance` |
| `engine/game.js:1161` | `<callback@1160>@1160` | `chance` |
| `engine/game.js:1169` | `doTradeExec@1165` | `pick` |
| `engine/game.js:1180` | `rollInjury@1178` | `chance` |
| `engine/game.js:1182` | `rollInjury@1178` | `chance` |
| `engine/game.js:1183` | `rollInjury@1178` | `ri` |
| `engine/game.js:1186` | `rollInjury@1178` | `ri` |
| `engine/game.js:1190` | `rollInjury@1178` | `chance` |
| `engine/game.js:1204` | `injStatLoss@1199` | `chance` |
| `engine/game.js:1206` | `injStatLoss@1199` | `pick` |
| `engine/game.js:1206` | `injStatLoss@1199` | `pick` |
| `engine/game.js:1207` | `injStatLoss@1199` | `ri` |
| `engine/game.js:1218` | `<callback@1218>@1218` | `ri` |
| `engine/game.js:1271` | `proSeason@1231` | `R` |
| `engine/game.js:1336` | `awards@1317` | `chance` |
| `engine/game.js:1343` | `awards@1317` | `chance` |
| `engine/game.js:1352` | `awards@1317` | `chance` |
| `engine/game.js:1357` | `awards@1317` | `chance` |
| `engine/game.js:1362` | `awards@1317` | `chance` |
| `engine/game.js:1367` | `awards@1317` | `chance` |
| `engine/game.js:1375` | `awards@1317` | `chance` |
| `engine/game.js:1380` | `awards@1317` | `chance` |
| `engine/game.js:1385` | `awards@1317` | `chance` |
| `engine/game.js:1390` | `awards@1317` | `chance` |
| `engine/game.js:1396` | `awards@1317` | `chance` |
| `engine/game.js:1402` | `awards@1317` | `chance` |
| `engine/game.js:1406` | `awards@1317` | `chance` |
| `engine/game.js:1420` | `awards@1317` | `chance` |
| `engine/game.js:1451` | `<callback@1449>@1449` | `R` |
| `engine/game.js:1462` | `<callback@1449>@1449` | `ri` |
| `engine/game.js:1462` | `<callback@1449>@1449` | `R` |
| `engine/game.js:1465` | `<callback@1449>@1449` | `chance` |
| `engine/game.js:1465` | `<callback@1449>@1449` | `chance` |
| `engine/game.js:1466` | `<callback@1449>@1449` | `ri` |
| `engine/game.js:1468` | `<callback@1449>@1449` | `ri` |
| `engine/game.js:1468` | `<callback@1449>@1449` | `ri` |
| `engine/game.js:1479` | `<callback@1449>@1449` | `chance` |
| `engine/game.js:1479` | `<callback@1449>@1449` | `chance` |
| `engine/game.js:1498` | `phaseEnd@1487` | `chance` |
| `engine/game.js:1586` | `movement@1518` | `chance` |
| `engine/game.js:1592` | `movement@1518` | `chance` |
| `engine/game.js:1601` | `movement@1518` | `chance` |
| `engine/game.js:1647` | `doDemote@1641` | `chance` |
| `engine/game.js:1650` | `doDemote@1641` | `chance` |
| `engine/game.js:1654` | `doDemote@1641` | `chance` |
| `engine/game.js:1703` | `signTo@1700` | `pick` |
| `engine/game.js:1723` | `makeOffers@1720` | `R` |
| `engine/game.js:1724` | `<callback@1724>@1724` | `R` |
| `engine/game.js:1724` | `<callback@1724>@1724` | `ri` |
| `engine/game.js:1777` | `faFlow@1767` | `chance` |
| `engine/game.js:1795` | `faMarket@1793` | `ri` |
| `engine/game.js:1795` | `faMarket@1793` | `ri` |
| `engine/game.js:1795` | `faMarket@1793` | `chance` |
| `engine/game.js:1795` | `faMarket@1793` | `ri` |
| `engine/game.js:1795` | `faMarket@1793` | `chance` |
| `engine/game.js:1799` | `<callback@1799>@1799` | `R` |
| `engine/game.js:1806` | `faMarket@1793` | `chance` |
| `engine/game.js:1807` | `faMarket@1793` | `ri` |
| `engine/game.js:1854` | `crossOffers@1852` | `chance` |
| `engine/game.js:1861` | `crossOffers@1852` | `chance` |
| `engine/game.js:1868` | `crossOffers@1852` | `chance` |
| `engine/game.js:1869` | `crossOffers@1852` | `ri` |
| `engine/game.js:1878` | `runDraft@1877` | `ri` |
| `engine/game.js:1879` | `runDraft@1877` | `ri` |
| `engine/game.js:1879` | `runDraft@1877` | `ri` |
| `engine/game.js:1879` | `runDraft@1877` | `ri` |
| `engine/game.js:1888` | `runDraft@1877` | `pick` |
| `engine/game.js:1891` | `accept@1889` | `ri` |
| `engine/game.js:1903` | `<callback@1899>@1899` | `pick` |
| `engine/game.js:1904` | `<callback@1899>@1899` | `pick` |
| `engine/game.js:1914` | `<callback@1913>@1913` | `pick` |
| `engine/game.js:1918` | `<callback@1918>@1918` | `pick` |
| `engine/game.js:1919` | `<callback@1919>@1919` | `pick` |
| `engine/game.js:1923` | `<callback@1921>@1921` | `ri` |
| `engine/game.js:1927` | `<callback@1925>@1925` | `ri` |
| `engine/game.js:1935` | `<callback@1935>@1935` | `pick` |
| `engine/game.js:2089` | `<callback@2082>@2082` | `ri` |
| `engine/game.js:2092` | `<callback@2082>@2082` | `R` |
| `engine/game.js:2098` | `<callback@2082>@2082` | `R` |
| `engine/game.js:2098` | `<callback@2082>@2082` | `ri` |
| `engine/game.js:2140` | `endGame@2107` | `R` |
| `engine/game.js:2243` | `endGame@2107` | `R` |
| `engine/game.js:2633` | `<callback@2628>@2628` | `seedInit` |
| `engine/game.js:2676` | `generateSeed@2676` | `crypto.getRandomValues` |
| `engine/game.js:2684` | `pickRecord@2684` | `R` |
| `engine/game.js:2798` | `<callback@2798>@2798` | `ri` |
| `engine/game.js:2798` | `newState@2797` | `ri` |
| `engine/game.js:2798` | `newState@2797` | `ri` |
| `engine/game.js:2798` | `newState@2797` | `ri` |
| `engine/game.js:2798` | `newState@2797` | `ri` |
| `engine/game.js:2799` | `newState@2797` | `R` |
| `engine/game.js:2800` | `<callback@2800>@2800` | `ri` |
| `engine/game.js:2800` | `<callback@2800>@2800` | `ri` |
| `engine/game.js:2800` | `<callback@2800>@2800` | `ri` |
| `engine/game.js:2800` | `<callback@2800>@2800` | `ri` |
| `engine/game.js:2800` | `<callback@2800>@2800` | `ri` |
| `engine/game.js:2800` | `<callback@2800>@2800` | `ri` |
| `engine/game.js:2800` | `<callback@2800>@2800` | `ri` |
| `engine/game.js:2800` | `<callback@2800>@2800` | `ri` |
| `engine/game.js:2801` | `newState@2797` | `R` |
| `engine/game.js:2839` | `runDraft@2839` | `ri` |
| `engine/game.js:2839` | `runDraft@2839` | `ri` |
| `engine/game.js:2839` | `runDraft@2839` | `ri` |
| `engine/game.js:2841` | `runDraft@2839` | `ri` |
| `engine/game.js:2841` | `runDraft@2839` | `ri` |
| `engine/game.js:2857` | `<callback@2855>@2855` | `ri` |
| `engine/game.js:2858` | `<callback@2855>@2855` | `R` |
| `engine/game.js:2862` | `<callback@2862>@2862` | `ri` |
| `engine/game.js:2872` | `cupOnce@2870` | `ri` |
| `engine/game.js:2882` | `qualifierOnce@2880` | `ri` |
| `engine/game.js:2922` | `addIntlStats@2922` | `ri` |
| `engine/game.js:2922` | `addIntlStats@2922` | `ri` |
| `engine/game.js:2922` | `addIntlStats@2922` | `R` |
| `engine/game.js:2922` | `addIntlStats@2922` | `chance` |
| `engine/game.js:2922` | `addIntlStats@2922` | `chance` |
| `engine/game.js:2922` | `addIntlStats@2922` | `ri` |
| `engine/game.js:2949` | `<callback@2945>@2945` | `pick` |
| `engine/game.js:2975` | `<callback@2975>@2975` | `ri` |
| `engine/game.js:2997` | `<callback@2997>@2997` | `ri` |
| `engine/game.js:3010` | `<callback@3010>@3010` | `chance` |
| `engine/game.js:3050` | `outOfOrg@3043` | `chance` |
| `engine/game.js:3056` | `outOfOrg@3043` | `chance` |
| `engine/game.js:3104` | `startJapanese@3104` | `seedInit` |
| `engine/market-policy.js:22` | `<callback@22>@22` | `random` |

## 6. 待驗與重構安全門檻

s/this/contract别名完整寫集、所有dynamic callback的caller、所有enum範圍、例外後次年度任意路線、完整R值逐步trace及實機均未窮舉。舊makeOffers/pickOfferUI等為LEGACY_OR_UNREACHABLE_UNPROVEN，不可據沒有命中刪除。歷史carry缺key→Undo key0數值等價；不能自行改結構以「修正」。

任何後續抽離必須同時比較S、局部cache/session/token、選擇歷史、ct schedule、R值與順序；符合相同json還不足。HOF/OVR等DESIGN_PENDING只能另行批准。此文件不新增保存或S schema。

# 現行模組與函式索引

> 1.11.8：新增UI模組international-personal-stats.js的internationalPersonalStats（既存通算前後差分）與renderInternationalPersonalStats（保存值純粋整形、既存fmtIP注入）。gameのprocessIntlPhaseからprepareInternationalResultの任意personalStatsへ値コピーし、既存commit／result cardを再利用。既存addIntlStatsと旧maybeIntlは不変。以下全量索引の数値・行号は歴史快照のまま。[本大会成績検証](../reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)。

> 1.11.7新增UI責務：game內traitPresentation（WeakMap）、traitResultMarkup與archiveTraitResults，只讀S、寫DOM／UI閉包；card成功append後記展示，removeTrait同步UI再取得標記。navigation增加可選onNavigate；buildTraitsViewModel／退休posT／shareImage僅名稱。以下ea951c2的數量／函式行號為歷史快照，不冒充新增函式索引已全量重算。[驗收](../reviews/TRAIT_DISPLAY_UNIFICATION_ACCEPTANCE.md)。

> 1.11.6補足：active newState保存出生pot合計；fixedContract可回傳已驗證transaction快照，signTo同S／年度重用它；crossOffers分離running／成功／completed並保存首次年數。[修復來源與測試](../reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)。以下函式清單／行號仍是ea951c2固定索引，沒有重新宣稱全量動態可達性。

## 1. 基準及統計方法

基準 `ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1`，VERSION1.11.5（2026-10-12）；[主設計書](CURRENT_DETAILED_DESIGN.md)、[S/RNG](STATE_AND_RNG_REFERENCE.md)、[流程](FLOWS_AND_UI_REFERENCE.md)、[驗收](../reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md)。

從docs/index.html→src/main.js static preferences及dynamic game import，沿相對import解析；**40個追蹤JS全在此載入圖內**。48條static ImportDeclaration edge，main dynamic game另1條（49已識別load edge）；不是49種執行順序。資料4檔（config＋3data）、engine24、UI11、main1。HTML直接載入6CSS（base/ui-navigation/jp-theme/themes/preferences/seed-share），外部Google Fonts另列，圖片資產不是JS模組。

最新既有AST工具重新掃描：**997函式節點、4214呼叫節點、1739S/state存取點、196RNG相關語法點**。其中game648函式節點。匿名callback495、具名稱或assignment推導名稱502；不是997 public API。下列K表39個核心函式契約已人工整理，§4給全部502個有名稱語法索引；未逐一動態驗收502函式，嵌套owner是lexical位置，不是caller身分。

重建命令（工具未修改；產物ignored，不部署）：

```text
node scripts/audit-architecture.mjs --playwright=<外部Playwright1.62.1> --output=test-results/stage9/architecture.json
```

babelParse來自現有Playwright，沒有新增npm；其內部parser改版須重新驗證。工具輸出INVENTORY_GENERATED_NOT_TEST_PASS，不能當遊戲測試PASS。

## 2. 全部載入模組

計數欄＝functions/calls/RNG相關語法點（包含nested/舊碼），不是function runtime coverage。表中測試是候選對應路徑；Q是否實際執行見驗收清單，Full-only文件不能因有路徑就標VERIFIED。所有模組IMPLEMENTED（可定位載入／語法），各未測功能UNVERIFIED。

| 模組／固定來源 | 職責、資料／副作用 | F/C/R點 | CURRENT對應 | tests/中的對應入口 |
|---|---|---:|---|---|
| [config.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/config.js) | 產品VERSION常量 | 0/0/0 | §1/9 | verify-modularization.mjs |
| [data/event-cards-jp.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/data/event-cards-jp.js) | 92張事件資料；條件/plan/文案/收入policy | 0/0/0 | §10/13 | event-copy.test.mjs,event-policy.test.mjs |
| [data/jp-data.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/data/jp-data.js) | 學校/球團/國際日程Master；不是每年動態球團財務 | 0/0/0 | §4/6/15 | verify-modularization.mjs,domestic-tournament-policy.mjs |
| [data/salary-market-data.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/data/salary-market-data.js) | 成績市場基準；ERA/WHIP/OPS等由salary evaluation讀取 | 0/14/0 | §5/11 | salary-evaluation-policy.test.mjs |
| [engine/arbitration-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/arbitration-policy.js) | 計算MLB球團/調停報價；抽籤由game注入後決定 | 3/20/0 | §5 | arbitration-policy.test.mjs |
| [engine/career-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/career-policy.js) | 升降格最低值與跨聯盟UI方向純函式 | 5/4/0 | §5/14 | career-movement-policy.mjs |
| [engine/championship-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js) | 快照/資格/年度優勝/維護；修改s，eligible注入random一次 | 11/38/1 | §15 | championship-intl.test.mjs |
| [engine/contract-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js) | schema3與schedule純資料變換；返回新ct，失敗throw；不支付所得 | 32/102/0 | §5/7/11 | contract-policy.test.mjs,salary-flow.test.mjs |
| [engine/control-period-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/control-period-policy.js) | 各聯盟CONTROL/ARBITRATION/FA、降薪保護與舊年資補完 | 6/36/0 | §5/11 | control-period-policy.test.mjs |
| [engine/cross-league-market-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js) | 路線價格/豁免/foreign年資/KBO package；accrue修改state | 15/68/0 | §11 | global-contract-market.test.mjs,kbo-renewal-floor.test.mjs |
| [engine/domestic-tournament-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js) | 結構化結果、資格、大学點數；不自行抽籤 | 9/13/0 | §4 | domestic-tournament-policy.mjs |
| [engine/draft-signing-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/draft-signing-policy.js) | 指名接受/拒絕；sign注入，付款去重，驗證SIGNED状態 | 5/7/0 | §7/11 | draft-signing-policy.test.mjs,draft-income-e2e.mjs |
| [engine/event-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js) | 资格、赔率、分类plan、独立成长成本、入金与特性計算 | 18/58/0 | §10/12/13 | event-policy.test.mjs,trait-policy.test.mjs |
| [engine/event-season-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-season-policy.js) | 正負成績點及一致性；處理傳入成績，不抽新亂數 | 4/57/0 | §10 | event-integration.test.mjs |
| [engine/event-state-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js) | s補完/抽卡年度集合/出現/解決/年度form；注入chance/pick | 10/33/2 | §10/13 | event-integration.test.mjs,event-fix.test.mjs |
| [engine/game.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js) | 主協調器、S/RNG/DOM、closure、overlay/LEGACY；不是純模組 | 648/2831/192 | §2–16 | choice-action.test.mjs,bug-act-01-02-e2e.mjs,contract-salary-e2e.mjs |
| [engine/hall-of-fame-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/hall-of-fame-policy.js) | 聯盟受賞加點、NPB國際加點；無票選亂數 | 4/16/0 | §4/12 | hall-of-fame-policy.mjs |
| [engine/incentive-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/incentive-policy.js) | 出来高資格與年度付款guard；返回state/result，caller提交 | 7/29/0 | §5/7 | incentive-policy.test.mjs |
| [engine/injury-market-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/injury-market-policy.js) | 新合約傷病倍率、權重與年限；不削既有ct | 7/9/0 | §5/11 | injury-market-policy.test.mjs |
| [engine/international-trait-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js) | normalize/validate/prepare/commit；修改s，非RNG owner | 9/40/0 | §15 | championship-intl.test.mjs |
| [engine/market-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js) | FA需求價格組合、injury context；jitter注入random每入選球團一次 | 12/27/1 | §5/11 | fa-market-policy.test.mjs |
| [engine/salary-evaluation-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js) | 實績/量/受賞payD、近3季加權、IND資料不足fallback | 23/95/0 | §5/11 | salary-evaluation-policy.test.mjs |
| [engine/salary-explanation-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-explanation-policy.js) | 決定快照與理由、按salaryYear/類型去重，歷史不限10筆 | 8/61/0 | §6/11 | salary-explanation-policy.test.mjs |
| [engine/salary-promotion-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js) | 曲線/par換算/舊狀態migration；migration可能修改state | 12/61/0 | §5/11 | salary-promotion-policy.test.mjs,salary-promotion-policy.mjs |
| [engine/signing-bonus-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/signing-bonus-policy.js) | 新人bonus/stipend/posting及contractId一次付款；修改state/ct | 6/29/0 | §7/11 | draft-bonus-display.test.mjs,global-contract-market.test.mjs |
| [engine/stat-bucket.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/stat-bucket.js) | 階層→league bucket；未知level不fallback | 1/0/0 | §6 | record-condition-fix.test.mjs |
| [engine/team-demand-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/team-demand-policy.js) | 固定hash需求排序；不使用career R，category不合法throw | 10/16/0 | §5/11 | team-demand-policy.test.mjs |
| [engine/trait-policy.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js) | 38ID標籤/舊名稱、年資、延後衰退與獲獎解放；部分s修改 | 17/40/0 | §12/15 | trait-policy.test.mjs,hof-first-ballot-league.test.mjs |
| [main.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/main.js) | 顯示設定先初始化，dynamic import game，然後開放start | 0/3/0 | §8 | display-preferences.test.mjs,verify-modularization.mjs |
| [ui/ability-view.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/ability-view.js) | 唯讀model→能力/特性DOM；不是能力配分入口 | 9/40/0 | §6/7 | information-architecture.test.mjs |
| [ui/choice-action.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/choice-action.js) | token/currentDOM重入guard、同步action與錯誤恢复；不rollback | 10/31/0 | §7/14 | choice-action.test.mjs,bug-act-01-02-e2e.mjs |
| [ui/condition-view-model.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/condition-view-model.js) | 全休/剩餘rehab文字格式；不修改S | 1/0/0 | §6 | record-condition-fix.test.mjs |
| [ui/contract-labels.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/contract-labels.js) | 契約enum→日文label；不改ct值 | 1/0/0 | §7 | japanese-copy-contract-ui.test.mjs |
| [ui/navigation.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js) | 3主頁/2+4tabs、uiState、listener/ResizeObserver；讀取model | 18/41/0 | §6/14 | information-architecture.test.mjs,npb-return-ui.test.mjs |
| [ui/player-detail.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/player-detail.js) | career tab渲染與所得/全部決定歷史；無RNG | 11/59/0 | §6/11 | salary-detail-ui.test.mjs,salary-history-e2e.mjs |
| [ui/preferences.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js) | normalize/storage/單一dialog、html dataset與displaychange；无career写入 | 22/73/0 | §8/16 | display-preferences.test.mjs |
| [ui/record-view.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/record-view.js) | 舊記錄renderer仍被import；導航現在用renderCareer，呼叫可達性另驗 | 5/30/0 | §6 | information-architecture.test.mjs |
| [ui/salary-detail.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/salary-detail.js) | 決定與ct schedule/所得明細、dialog事件/焦點；讀取provider | 16/161/0 | §6/7/11 | salary-detail-ui.test.mjs,draft-bonus-display.test.mjs |
| [ui/seed-share.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/seed-share.js) | seed-onlyURL、clipboard/native share、modal generation；noS/RNG | 17/61/0 | §3/13/16 | event-fix.test.mjs,replay-share-theme.test.mjs |
| [ui/share-theme.js](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/share-theme.js) | 四主题palette與tag對比；返副本，無DOM/S/RNG | 5/11/0 | §16 | replay-share-theme.test.mjs |

### 2.1 權限與依賴邊界

game直接依賴policy/data/UI，把S、R、Master查詢、render callback注入相關函式。policy並非全純：event-state、championship、international、signing payment等會寫傳入s/state；contract則主要返回新資料，caller才寫S.ct。UI renderer原則只讀provider model；導航state、preference、share promise屬UI閉包，不是S。

不是每個載入export都在現行流程被呼叫：record-view仍被navigation import，但實際selectCareer調renderCareer；不要由import存在推論renderRecord可達。每個非K表helper的精确輸出型別、全部throws、間接S/R作用與動態caller仍UNVERIFIED，可按§4固定來源繼續查。

全域依賴：DOM/window/document/history/location、crypto/TextEncoder、Canvas/navigator/structuredClone、ResizeObserver及global TEAM_MASTER。game設window.__YAKYO_JP_DATA__與TEAM_MASTER；不是供新增存檔的正式API。

## 3. 核心函式契約與人工呼叫鏈（39項）

G＝game，E＝engine政策，U＝UI；固定來源連到實際行。輸入、回傳／例外、讀寫／RNG／DOM、caller/callee、規格與測試一起列。Q限定本輪Quick、H限定指定歷史測試SHA，二者不能外推全caller／全分支。一般標記SPECIFIED + IMPLEMENTED；純函式指定Q案例可VERIFIED，剩餘作用UNVERIFIED。

| 函式／来源 | 輸入→輸出／失敗 | 已追蹤caller→內部鏈 | S讀寫、RNG/DOM、規格與驗證範圍 |
|---|---|---|---|
| K01 [G/startJapanese](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3104) | UI seed/name/pos→S與URL/開始DOM；新遊戲失敗例外無全域rollback | btn-start→normalizeSeed/name→seedInit→newState→navigation→startYear | 寫整個S、URL、DOM；人物建立R；§2/3/8；Q fixed-seed/ACT、H完整生涯 |
| K02 [G/newState](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2797) | name,pos→state；未知pos未自行fallback | startJapanese→POS_AB/ri→pot shuffle→school；ensureEventState | 初始化literal106＋補完；讀boot rngState，創造ability/pot；R；§2/7；Q ACT/draft |
| K03 [G/ovr](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L357) | 无参数，讀S.ab/pot/dpos→round總合 | candidate/sim/board→dpScore | 純讀S（dpos等），本身R0；無DOM；§3；全守位/round fixture UNVERIFIED |
| K04 [G/abCost](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L390) | key→nextCost | allocUI→cost；addAb同成本式 | 讀ab/pot/pos；R0；§7；H能力89边界，Q靜態 |
| K05 [G/addAb](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L395) | key,points→增加量；carry與overflow | allocation/combo/love→cost loop | 寫ab/carry/lastOverflow，cap80；R0；§7；H正常/邊界 |
| K06 [G/choose](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L665) | title,opts→DOM；callback不立即执行 | 流程→actClear→token→buttons→runChoiceAction | 寫generation/token、DOM；本身R0，o.f可R/S寫；§6/7；Q choice/ACT |
| K07 [G/runWithResultView](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L664) | action→返回原结果；finally scroll | choose/alloc確定→card count→action | 讀log DOM，depth閉包；本身R0，不重建act/导航；§6；Q UI/ACT |
| K08 [G/allocUI](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L678) | {pool|dice},label,done→session DOM | phasePre/phaseEnd→row/addAb→Undo/reset→allocDone→done | 寫ab/carry，pool/idx/hist/touched在閉包；配分R0，完成可觸发R；§7；H第七階段，Q靜態 |
| K09 [G/allocDone](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1062) | touched,isDice→特性更新/cards | alloc確定→集中/late/genius等 | 寫samePick/key/bonus、traits、ab/pot；late shuffle R；§7/12；H89/17 |
| K10 [G/phasePre](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L729) | 无参数→健康/训练选项 | 年度queue→衰退/rehab→投球计划/骰→dposReview→allocUI | 寫factor/skipMid/ab/traits/日志；dice/chance R；§7/12；H配分/契約全休，未全路線 |
| K11 [G/phaseMid](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L831) | 无参数→love/events/健康/成績選項 | queue→loveEvent→drawEvents→rollInjury→PRO/amateurSeason | S由委派写；R視分支；§10/13；Q ACT/event |
| K12 [G/drawEvents](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L850) | n,done→抽卡選項或done | phaseMid→pool/pick/begin→choice→resolveEvent | 写event状态/DOM；抽卡R1，效果R別处；§10/13；Q event-fix/integration |
| K13 [G/resolveEvent](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1055) | card,mode,done,occurrence→结果/继续 | drawEvents→applyEvent→renderEventResult→done | 委派寫能力/收入/processed；R注入；§10/13；Q event-integration |
| K14 [G/proSeason](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1231) | 无参数→確定季成績/賞/次操作 | 健康选項→sim→form/effort→acc/awards→salary eval→champ capture→TJ/trade/POST | 大量S寫與R；DOM；§5/6/10/15；H契約完整人生 |
| K15 [G/amateurSeason](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2887) | 无参数→国内大会結果/POST/nextStep | 成績选项→cupOnce/qualifierOnce→consume form | 寫log/completedKeys/pool，原ri；§4/10；Q domestic+H ACT路線 |
| K16 [G/processIntlPhase](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2928) | PRE/POST,done→召集/見送/結果 | phaseIntlPre/maybeIntl→validate→rank/stats→prepare/commit→next | 寫intl/pool/injNext/honors；必要rank/stat R；§15；Q championship-intl + H UI |
| K17 [G/salaryCandidate](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2718) | source/target/rating/mult/previous等→候選快照；未知route/policy throw | offers/renew/sign→par/curve→route/anchor/floor/cap→terms | 讀S ct/market/年资/ab；價格本體R0；§5/11；Q global/KBO/flow |
| K18 [G/fixedContract](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2814) | 合同参数→validated ct；失败throw | signTo/renew→KBO cap→tentative sequence→createContract | 成功后寫S.contractSequence；R0；§7/11；H付款前fault |
| K19 [G/signTo](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2818) | org,lv,teamId,yrs,mult,decision,options→S签約/结果；可throw | 接受→candidate→fixedContract→所属/ct→payment→history→render | 寫所属/ct/所得/US标志；無team時pick R1；UI retry不再签；§7/11；H5/17与381 |
| K20 [G/finalizePendingOffseasonSalary](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2743) | 无参数，pending null則return | advance2795→candidate/control→fixedContract→decision→clear pending | 寫ct/currentSalary/履歷；价格R0；DOM；§5/14；Q contract/NPB/KBO |
| K21 [G/appendContractExtension](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2772) | years,mult→既約後新增segment | LEGACY.movement→extensionOffer/termChoice→appendExtension | 寫ct/decision但非一次性bonus；R0本體；§5/11；Q contract/flow；舊提示全UI額仍待驗 |
| K22 [G/crossOffers](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2978) | ovr→offers/cache/advance | movement→overseasOffer或満期NPB回国→accept | 候選R（球團）/接纳yearsR；缓存R0；讀ct/S；§11/14；Q npb-return/KBO + H381 |
| K23 [G/faMarket](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3032) | o,d→lastFaMarket/offer DOM | faFlow→demand teams→jitter→buildFaOffer→accept signTo | 寫cache/ct等委派；每入選team R1；§5/11；Q FA/全球，H契約 |
| K24 [G/phaseEnd](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3068) | 无参数→settle或CORP guard return | 年度queue→corp WeakMap→settlePhaseEnd | 成功complete、running finally清；本体guardR0；§7/15；H CORP正常/fault/次年 |
| K25 [G/settlePhaseEnd](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3077) | 无参数→優勝/付款/能力点/移籍 | phaseEnd→champ/maintenance→ct payment→movement | S ct/收入/paid/市场/flags；优胜eligibleR1；DOM；§5/7/15；H381/安全17 |
| K26 [G/movement](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3093) | 无参数→下一年/续约/FA/退休 | settle→HS/U/CORP/IND，PRO accrue→LEGACY.movement | 写年資/队年/FA/所屬委派；旧分支R；§5/11/14；Q KBO/ACT、H完整人生 |
| K27 [G/advance](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2795) | 无参数→下一年度 | sign/cross/留队→finalizePending→old advance1956→resetEventYear/startYear | 写age/year/stageYr/year event；年度後續R；§5/13；H年界契約 |
| K28 [G/endGame](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3096) | reason→退休/履歷/分享DOM；wrapper委派 | 退休选择→legacyEndGame→tier/retireScene→choose/share | 寫done/hof/traits，票選R；微任務文字更新不重绑listener；§12；Q HOF fixture，自然率待驗 |
| K29 [G/shareImage](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2319) | evals,out→Canvas PNG與分享按钮 | 退休button/themechange→palette→920px×2画像 | 读S/DOM/Canvas，不careerR；share异步在UI；§16；Q palette/mock，H像素/E2E |
| K30 [U/runChoiceAction](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/choice-action.js#L10) | callbacks/token→action结果或stale/duplicate；同步throw重抛 | choose→disable→action→当前token仍same才clear；catch report/restore | token running/DOM；不直接S/R，但action可写；不await Promise；§7/14；Q choice-action |
| K31 [E/applyEvent](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L26) | s,card,mode,{chance,pick,...}→{applied,result} | resolveEvent→traits快照→effect工作副本→commit | s能力/收入/results列更新；指定chance/pick；STALE/EVENT_INCOME_OVERFLOW；§10/13；Q integration |
| K32 [E/applySigningPayment](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/signing-bonus-policy.js#L21) | state,contract→{paid,amount} | signTo/acceptDraft→contractId guard | 写signingPayments/bonus/stipend/earnings/ct status；R0/DOM0；§11；Q draft/bonus/global |
| K33 [E/markSalaryPaid](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L34) | ct,year→{contract,amount,ended} | settlePhaseEnd→normalize→due→新schedule/totals | 输入ct不直接付款收入；duplicate throw；R0/DOM0；§5/11；Q contract/flow |
| K34 [E/prepareInternationalResult](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L30) | s,event,rank/stats/hadIntlace→prepared | processIntl→prepare→commit | prepare算新对象、noS write；R由caller已消费；§15；Q championship-intl |
| K35 [E/commitInternationalResult](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L36) | s,prepared→{result,created} | prepare後→completed key→一次commit | 写intl/pool/injNext/trait/honor；R0；§15；Q championship-intl |
| K36 [E/settleChampionship](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L51) | s,{teamById,random}→{result,created} | phaseEnd→资格/snapshot→random→保存year结果 | 写results/honors/won/teamflags；eligible新年度random1；§15；Q championship-intl |
| K37 [U/initNavigation](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L8) | documentRef/model providers→controller | G boot→listeners/ResizeObserver→renderModel | UI state/hidden/ARIA；providers读S，不write；R0；§6/14；Q静态＋H ACTpointer |
| K38 [U/initializeDisplayPreferences](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L23) | document/window→{get} | main.js→storage/normalize→dataset/modal/listeners | localStorage仅display，noS/RNG；§8；Q unit，H设置DOM |
| K39 [U/shareReplayURL](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/seed-share.js#L64) | url,{window/document}→Promise outcome | 兩個share入口直接click→navigator.share/fallbackcopy | noS/RNG；AbortError无通知/无copy；finally由button caller；§16；Q mock，实机BLOCKED |

### 3.1 覆寫及LEGACY

G:2649 overlay捕獲board、movement、phasePre、phaseMid、proSeason、endGame。目前可確認委派LEGACY.board／LEGACY.movement／legacyEndGame；其他capture property未見直接用不等於原函式不可達，phasePre/Mid/proSeason binding仍供queue呼叫。

overlay範圍內AST有33個名稱assignment函式，其中salaryCandidate是填補預宣告binding，不是「舊函式被覆寫」。與早期頂層定義對照的覆寫群組仍32；不要把33與32當新Bug。seedInit/R/newState/salaryFor/board/startYear/movement/signTo等目前assignment取代宣告；advanceWithoutSalaryFinalization保存舊advance，legacyEndGame保存captured舊endGame。參考§4每個同名定義與owner。

舊makeOffers1720、pickOfferUI1711與早期faMarket/crossOffers語法存在；靜態直接引用多在已覆寫函式，但目前仍活的extensionOffer1755/termChoice1738/termParams1727鄰近。分類LEGACY_OR_UNREACHABLE_UNPROVEN，沒有scope完整解析與所有callback runtime證據，不刪、不整段搬。nextContractId2813在第七階段改用tentative sequence後保留，不因本輪未見引用就刪除。

## 4. 具名稱函式／callback語法全索引（502筆）

這是人工K表以外的查找入口，**不是502筆完整接口／可達性驗收**。AssignmentPattern/ObjectPattern等是parser參數種類，具體預設與解構鍵以連結的原函式為準；不能自行猜參數型別。owner同字串可跨檔不同作用域；call target文字相同也不保證綁同函式。匿名495節點保留於可重建AST輸出，不把它們冒充 public API。

### config.js

Imports：無static import。

沒有函式節點，僅資料／入口呼叫。

### data/event-cards-jp.js

Imports：無static import。

沒有函式節點，僅資料／入口呼叫。

### data/jp-data.js

Imports：無static import。

沒有函式節點，僅資料／入口呼叫。

### data/salary-market-data.js

Imports：無static import。

沒有函式節點，僅資料／入口呼叫。

### engine/arbitration-policy.js

Imports：`./control-period-policy.js`（L1）。

- [`clamp(value,min,max)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/arbitration-policy.js#L3) L3–3；owner `<module>`；variable。
- [`calculateArbitrationTerms(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/arbitration-policy.js#L4) L4–12；owner `<module>`；declaration。
- [`protect(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/arbitration-policy.js#L9) L9–9；owner `calculateArbitrationTerms@4`；variable。

### engine/career-policy.js

Imports：無static import。

- [`isBelowActiveMinimum(overall)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/career-policy.js#L1) L1–3；owner `<module>`；declaration。
- [`findDemotionTarget(path,currentIndex,overall,levels)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/career-policy.js#L5) L5–10；owner `<module>`；declaration。
- [`demotionChoiceText(targetLevel,levels)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/career-policy.js#L12) L12–17；owner `<module>`；declaration。
- [`crossOfferType(currentOrg,destinationOrg)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/career-policy.js#L19) L19–25；owner `<module>`；declaration。
- [`crossOfferTitle(type)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/career-policy.js#L27) L27–31；owner `<module>`；declaration。

### engine/championship-policy.js

Imports：無static import。

- [`count(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L8) L8–8；owner `<module>`；variable。
- [`dictionary(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L9) L9–9；owner `<module>`；variable。
- [`leagueOf(org)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L10) L10–10；owner `<module>`；variable。
- [`normalizeChampionshipState(s,teamById)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L12) L12–31；owner `<module>`；declaration。
- [`captureSeasonChampionship(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L33) L33–37；owner `<module>`；declaration。
- [`championshipEligibility(s,teamById)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L39) L39–49；owner `<module>`；declaration。
- [`settleChampionship(s,ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L51) L51–64；owner `<module>`；declaration。
- [`maintainSeasonEnd(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/championship-policy.js#L66) L66–72；owner `<module>`；declaration。

### engine/contract-policy.js

Imports：無static import。

- [`roundYen(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L1) L1–1；owner `<module>`；variable。
- [`cloneSchedule(schedule)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L2) L2–2；owner `<module>`；variable。
- [`deriveContractTotals(contract)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L4) L4–10；owner `<module>`；declaration。
- [`createContract(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L12) L12–17；owner `<module>`；declaration。
- [`normalizeContract(contract,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L19) L19–26；owner `<module>`；declaration。
- [`salaryDueForYear(contract,year)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L28) L28–28；owner `<module>`；declaration。
- [`contractContinuationForNextYear(contract,currentYear)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L30) L30–30；owner `<module>`；declaration。
- [`contractNeedsRenewal(contract)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L32) L32–32；owner `<module>`；declaration。
- [`markSalaryPaid(contract,year)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L34) L34–34；owner `<module>`；declaration。
- [`applyLevelMinimumToUnpaidSchedule(contract,minimumAnnualSalary,effectiveYear)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L36) L36–36；owner `<module>`；declaration。
- [`appendExtension(contract,input)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L38) L38–38；owner `<module>`；declaration。
- [`transferContract(contract,ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L40) L40–40；owner `<module>`；declaration。
- [`calculateScheduledBuyout(contract,rate)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/contract-policy.js#L42) L42–42；owner `<module>`；declaration。

### engine/control-period-policy.js

Imports：無static import。

- [`clamp(value,min,max)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/control-period-policy.js#L1) L1–1；owner `<module>`；variable。
- [`getContractStage(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/control-period-policy.js#L3) L3–9；owner `<module>`；declaration。
- [`getNpbFaRights(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/control-period-policy.js#L11) L11–11；owner `<module>`；declaration。
- [`applyForcedCutProtection(candidate,previousSalary,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/control-period-policy.js#L13) L13–15；owner `<module>`；declaration。
- [`calculateControlOffer(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/control-period-policy.js#L17) L17–26；owner `<module>`；declaration。
- [`migrateServiceTime(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/control-period-policy.js#L28) L28–36；owner `<module>`；declaration。

### engine/cross-league-market-policy.js

Imports：無static import。

- [`round(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L1) L1–1；owner `<module>`；variable。
- [`floor(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L2) L2–2；owner `<module>`；variable。
- [`recordedFirstTeamYears(state)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L4) L4–4；owner `<module>`；variable。
- [`effectiveMarketOrg(level,org)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L5) L5–5；owner `<module>`；declaration。
- [`marketTier(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L6) L6–10；owner `<module>`；declaration。
- [`accrueForeignFirstTeamSeason(state)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L11) L11–15；owner `<module>`；declaration。
- [`foreignProSeasons(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L16) L16–20；owner `<module>`；declaration。
- [`getCrossLeaguePolicy(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L21) L21–35；owner `<module>`；declaration。
- [`applyCrossLeagueSalary(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L36) L36–50；owner `<module>`；declaration。
- [`applyKboForeignPackageCap(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/cross-league-market-policy.js#L51) L51–62；owner `<module>`；declaration。

### engine/domestic-tournament-policy.js

Imports：無static import。

- [`tournamentResult(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L8) L8–23；owner `<module>`；declaration。
- [`grantsSenbatsuEligibility(result)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L25) L25–27；owner `<module>`；declaration。
- [`nextSenbatsuEligibleYear(result,year)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L29) L29–31；owner `<module>`；declaration。
- [`canPlaySenbatsu(stageYear,eligibleYear,year)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L33) L33–35；owner `<module>`；declaration。
- [`canPlayHighSchoolFall(stageYear)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L37) L37–39；owner `<module>`；declaration。
- [`qualifiesForChampionship(result)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L41) L41–43；owner `<module>`；declaration。
- [`qualificationResult(power)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L45) L45–54；owner `<module>`；declaration。
- [`qualifiesForUniversityJingu(autumnResult,route,qualifier)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L56) L56–60；owner `<module>`；declaration。
- [`qualifiesForCorporateJapan(jabaResult,cityResult,qualifier)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/domestic-tournament-policy.js#L62) L62–66；owner `<module>`；declaration。

### engine/draft-signing-policy.js

Imports：`./signing-bonus-policy.js`（L1）。

- [`draftSigningTerms(type,round)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/draft-signing-policy.js#L3) L3–6；owner `<module>`；declaration。
- [`assertSignedDraftState(state,ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/draft-signing-policy.js#L8) L8–11；owner `<module>`；declaration。
- [`acceptDraftSelection(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/draft-signing-policy.js#L13) L13–22；owner `<module>`；declaration。
- [`declineDraftSelection(state)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/draft-signing-policy.js#L24) L24–28；owner `<module>`；declaration。
- [`isDraftFallbackResult(result)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/draft-signing-policy.js#L30) L30–30；owner `<module>`；declaration。

### engine/event-policy.js

Imports：`../data/event-cards-jp.js`（L1）。

- [`clamp(v,a,b)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L4) L4–4；owner `<module>`；variable。
- [`int(v,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L5) L5–5；owner `<module>`；variable。
- [`eventEligible(card,s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L6) L6–12；owner `<module>`；declaration。
- [`eventOdds(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L13) L13–16；owner `<module>`；declaration。
- [`eventTier(t)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L17) L17–17；owner `<module>`；variable。
- [`effectiveCategory(card,stage)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L18) L18–18；owner `<module>`；variable。
- [`eventPlan(category,mode,tier,success)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L19) L19–26；owner `<module>`；declaration。
- [`eventInjury(card,mode,success,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L27) L27–27；owner `<module>`；variable。
- [`eventIncome(level,mode,success,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L28) L28–32；owner `<module>`；declaration。
- [`eventAbilityCost(pos,key,cur,pot)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L33) L33–36；owner `<module>`；declaration。
- [`eventAddAbility(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L37) L37–49；owner `<module>`；declaration。
- [`cost()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L40) L40–40；owner `eventAddAbility@37`；variable。
- [`eventCounters(s,card,mode,success,category)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L50) L50–58；owner `<module>`；declaration。
- [`add(k)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L51) L51–51；owner `eventCounters@50`；variable。
- [`eventTraitUnlocks(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L59) L59–69；owner `<module>`；declaration。
- [`validateEventCatalog(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-policy.js#L79) L79–93；owner `<module>`；declaration。

### engine/event-season-policy.js

Imports：無static import。

- [`clamp(v,a,b)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-season-policy.js#L1) L1–1；owner `<module>`；variable。
- [`count(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-season-policy.js#L2) L2–2；owner `<module>`；variable。
- [`normalizeEventSeason(st,ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-season-policy.js#L3) L3–15；owner `<module>`；declaration。
- [`applyEventSeason(st,ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-season-policy.js#L16) L16–25；owner `<module>`；declaration。

### engine/event-state-policy.js

Imports：`./event-policy.js`（L1）。

- [`nonNegative(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L3) L3–3；owner `<module>`；variable。
- [`ensureEventState(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L4) L4–12；owner `<module>`；declaration。
- [`beginEvent(s,card)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L13) L13–20；owner `<module>`；declaration。
- [`eventDrawPool(s,cards)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L21) L21–24；owner `<module>`；declaration。
- [`applyEvent(s,card,mode,ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L26) L26–45；owner `<module>`；declaration。
- [`beginEventSeason(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L46) L46–51；owner `<module>`；declaration。
- [`consumeEventSeason(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L52) L52–52；owner `<module>`；declaration。
- [`resetEventYear(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/event-state-policy.js#L53) L53–53；owner `<module>`；declaration。

### engine/game.js

Imports：`../config.js`（L1）；`./trait-policy.js`（L2）；`../data/event-cards-jp.js`（L3）；`./event-policy.js`（L4）；`./event-state-policy.js`（L5）；`../ui/seed-share.js`（L6）；`../ui/preferences.js`（L7）；`../ui/share-theme.js`（L8）；`./event-season-policy.js`（L9）；`../data/jp-data.js`（L10）；`../data/salary-market-data.js`（L11）；`./career-policy.js`（L12）；`./salary-promotion-policy.js`（L13）；`./salary-evaluation-policy.js`（L14）；`./salary-explanation-policy.js`（L15）；`../ui/salary-detail.js`（L16）；`./contract-policy.js`（L17）；`./control-period-policy.js`（L18）；`./injury-market-policy.js`（L19）；`./arbitration-policy.js`（L20）；`./market-policy.js`（L21）；`./incentive-policy.js`（L22）；`./team-demand-policy.js`（L23）；`./draft-signing-policy.js`（L24）；`./signing-bonus-policy.js`（L25）；`./cross-league-market-policy.js`（L26）；`../ui/choice-action.js`（L27）；`../ui/navigation.js`（L28）；`./hall-of-fame-policy.js`（L29）；`./stat-bucket.js`（L30）；`../ui/condition-view-model.js`（L31）；`../ui/contract-labels.js`（L32）；`./domestic-tournament-policy.js`（L33）；`./championship-policy.js`（L35）；`./international-trait-policy.js`（L36）。

- [`seedInit(str)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L46) L46–46；owner `<module>`；declaration。
- [`R()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L47) L47–47；owner `<module>`；declaration。
- [`ri(a,b)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L48) L48–48；owner `<module>`；variable。
- [`pick(a)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L49) L49–49；owner `<module>`；variable。
- [`chance(p)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L50) L50–50；owner `<module>`；variable。
- [`clamp(v,a,b)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L51) L51–51；owner `<module>`；variable。
- [`scrollBottom()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L52) L52–55；owner `<module>`；declaration。
- [`N0(sd)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L56) L56–56；owner `<module>`；variable。
- [`dpScore(p)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L67) L67–79；owner `<module>`；declaration。
- [`dpBar()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L92) L92–96；owner `<module>`；declaration。
- [`dpQual(p)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L97) L97–103；owner `<module>`；declaration。
- [`dpList()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L105) L105–111；owner `<module>`；declaration。
- [`dpMult()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L112) L112–112；owner `<module>`；declaration。
- [`dposReview(cont)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L113) L113–169；owner `<module>`；declaration。
- [`cOk()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L117) L117–118；owner `dposReview@113`；variable。
- [`newState(name,pos,role)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L229) L229–256；owner `<module>`；declaration。
- [`blankStat()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L257) L257–257；owner `<module>`；declaration。
- [`bucketOf(lv)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L258) L258–258；owner `<module>`；declaration。
- [`traitCard(key,name,desc,tone)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L259) L259–260；owner `<module>`；declaration。
- [`removeTrait(key,label)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L261) L261–262；owner `<module>`；declaration。
- [`careerAllStars()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L264) L264–264；owner `<module>`；declaration。
- [`toolGap()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L265) L265–275；owner `<module>`；declaration。
- [`tjAccrue()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L276) L276–281；owner `<module>`；declaration。
- [`tjCap()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L282) L282–282；owner `<module>`；declaration。
- [`tjGamble(cont)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L283) L283–301；owner `<module>`；declaration。
- [`tjTwoStrike()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L302) L302–306；owner `<module>`；declaration。
- [`tjBigInjury(cont)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L307) L307–329；owner `<module>`；declaration。
- [`afterGamble(kind,cont)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L330) L330–339；owner `<module>`；declaration。
- [`pitcherRole()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L340) L340–347；owner `<module>`；declaration。
- [`fmtIP(ip)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L348) L348–354；owner `<module>`；declaration。
- [`roleN(r)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L355) L355–355；owner `<module>`；declaration。
- [`isSP()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L356) L356–356；owner `<module>`；declaration。
- [`ovr()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L357) L357–371；owner `<module>`；declaration。
- [`playerType()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L372) L372–389；owner `<module>`；declaration。
- [`abCost(k)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L390) L390–394；owner `<module>`；declaration。
- [`addAb(k,v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L395) L395–409；owner `<module>`；declaration。
- [`injuryProb()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L410) L410–420；owner `<module>`；declaration。
- [`simSeason(lv)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L422) L422–505；owner `<module>`；declaration。
- [`applySeasonForm(st,lv)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L507) L507–541；owner `<module>`；declaration。
- [`defRuns(lv)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L543) L543–553；owner `<module>`；declaration。
- [`addStatTotal(t,st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L554) L554–559；owner `<module>`；declaration。
- [`accStat(bucket,st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L560) L560–567；owner `<module>`；declaration。
- [`accLevelStat(levelKey,st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L568) L568–573；owner `<module>`；declaration。
- [`statLine(st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L574) L574–582；owner `<module>`；declaration。
- [`slgOf(st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L584) L584–592；owner `<module>`；declaration。
- [`salaryFor(lv,d)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L594) L594–602；owner `<module>`；declaration。
- [`fmtMoney(yen)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L603) L603–603；owner `<module>`；variable。
- [`displayTrait(key)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L604) L604–604；owner `<module>`；declaration。
- [`traitNames()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L605) L605–605；owner `<module>`；declaration。
- [`checkGoldclothSeason()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L606) L606–609；owner `<module>`；declaration。
- [`currentAffiliation()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L610) L610–610；owner `<module>`；declaration。
- [`statSummary(bucket,st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L611) L611–611；owner `<module>`；declaration。
- [`buildRecordViewModel()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L612) L612–612；owner `<module>`；declaration。
- [`rehabStatusText()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L613) L613–613；owner `<module>`；declaration。
- [`buildAbilityViewModel()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L614) L614–614；owner `<module>`；declaration。
- [`buildTraitsViewModel()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L615) L615–615；owner `<module>`；declaration。
- [`buildPlayerViewModel()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L616) L616–616；owner `<module>`；declaration。
- [`buildCareerViewModel()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L617) L617–617；owner `<module>`；declaration。
- [`$(id)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L619) L619–619；owner `<module>`；variable。
- [`logTarget()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L622) L622–622；owner `<module>`；declaration。
- [`card(cls,title,html)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L623) L623–625；owner `<module>`；declaration。
- [`divider(t)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L626) L626–626；owner `<module>`；declaration。
- [`head.onclick()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L626) L626–626；owner `divider@626`；assignment。
- [`board(phase)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L627) L627–649；owner `<module>`；declaration。
- [`actClear()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L651) L651–652；owner `<module>`；declaration。
- [`actToggleSync()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L653) L653–658；owner `<module>`；declaration。
- [`escapeDiagnosticHTML(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L659) L659–659；owner `<module>`；declaration。
- [`invokeChoiceAction(action)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L662) L662–662；owner `<module>`；declaration。
- [`scrollAction()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L663) L663–663；owner `<module>`；declaration。
- [`runWithResultView(action)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L664) L664–664；owner `<module>`；declaration。
- [`choose(title,opts)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L665) L665–676；owner `<module>`；declaration。
- [`b.onclick()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L674) L674–674；owner `<callback@670>@670`；assignment。
- [`val(x)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L674) L674–674；owner `<callback@674>@674`；variable。
- [`allocUI(mode,label,done)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L678) L678–718；owner `<module>`；declaration。
- [`live(element)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L681) L681–681；owner `allocUI@678`；variable。
- [`copyTouched()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L685) L685–685；owner `allocUI@678`；variable。
- [`restoreTouched(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L686) L686–686；owner `allocUI@678`；variable。
- [`remaining()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L689) L689–689；owner `allocUI@678`；declaration。
- [`render(focusKey)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L690) L690–716；owner `allocUI@678`；declaration。
- [`allocate()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L699) L699–699；owner `<callback@694>@694`；variable。
- [`r.onkeydown(event)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L700) L700–700；owner `<callback@694>@694`；assignment。
- [`u.onclick()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L707) L707–707；owner `render@690`；assignment。
- [`reset.onclick()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L709) L709–709；owner `render@690`；assignment。
- [`c.onclick()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L713) L713–713；owner `render@690`；assignment。
- [`nextStep()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L720) L720–720；owner `<module>`；declaration。
- [`stageLabel()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L721) L721–726；owner `<module>`；declaration。
- [`startYear()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L727) L727–727；owner `<module>`；declaration。
- [`phasePre()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L729) L729–829；owner `<module>`；declaration。
- [`afterAsk()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L741) L741–782；owner `phasePre@729`；variable。
- [`afterAsk()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L786) L786–791；owner `phasePre@729`；assignment。
- [`phaseMid()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L831) L831–841；owner `<module>`；declaration。
- [`evOdds()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L842) L842–842；owner `<module>`；declaration。
- [`eventChoiceSummary(ev,mode)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L843) L843–849；owner `<module>`；declaration。
- [`effect(plan)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L846) L846–846；owner `eventChoiceSummary@843`；variable。
- [`drawEvents(n,done)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L850) L850–859；owner `<module>`；declaration。
- [`after()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L856) L856–856；owner `<callback@852>@852`；variable。
- [`partnerJob(name)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L863) L863–863；owner `<module>`；declaration。
- [`datePool()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L866) L866–869；owner `<module>`；declaration。
- [`affairPool()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L870) L870–870；owner `<module>`；declaration。
- [`loveEvent(next)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L871) L871–951；owner `<module>`；declaration。
- [`ask()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L888) L888–888；owner `loveEvent@871`；variable。
- [`divorceRec()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L952) L952–954；owner `<module>`；declaration。
- [`loveCaught(next)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L955) L955–975；owner `<module>`；declaration。
- [`proposalAsk(next)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L976) L976–985；owner `<module>`；declaration。
- [`loveCaughtDating(next)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L986) L986–1007；owner `<module>`；declaration。
- [`loveGainTxt(k,amt)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1008) L1008–1016；owner `<module>`；declaration。
- [`addAbStat(k,amt)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1017) L1017–1036；owner `<module>`；declaration。
- [`statBonus(pts,out)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1037) L1037–1040；owner `<module>`；declaration。
- [`renderEventResult(ev,result)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1041) L1041–1054；owner `<module>`；declaration。
- [`escape(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1042) L1042–1042；owner `renderEventResult@1041`；variable。
- [`resolveEvent(ev,mode,done,occurrenceID)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1055) L1055–1060；owner `<module>`；declaration。
- [`allocDone(touched,isDice)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1062) L1062–1087；owner `<module>`；declaration。
- [`checkTraitsMid()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1088) L1088–1091；owner `<module>`；declaration。
- [`teamNick(team)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1092) L1092–1099；owner `<module>`；declaration。
- [`teamChampRate(team)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1100) L1100–1104；owner `<module>`；declaration。
- [`faYears(d,cap)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1105) L1105–1114；owner `<module>`；declaration。
- [`demotionAudit(cont)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1115) L1115–1130；owner `<module>`；declaration。
- [`tradeCheck(cont)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1131) L1131–1164；owner `<module>`；declaration。
- [`doTradeExec()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1165) L1165–1170；owner `<module>`；declaration。
- [`portionOf(st,r)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1171) L1171–1177；owner `<module>`；declaration。
- [`rollInjury()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1178) L1178–1198；owner `<module>`；declaration。
- [`injStatLoss(big)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1199) L1199–1210；owner `<module>`；declaration。
- [`amateurSeason()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1211) L1211–1230；owner `<module>`；declaration。
- [`proSeason()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1231) L1231–1316；owner `<module>`；declaration。
- [`awards(bucket,st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1317) L1317–1434；owner `<module>`；declaration。
- [`maybeIntl(done)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1435) L1435–1485；owner `<module>`；declaration。
- [`phaseEnd()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1487) L1487–1509；owner `<module>`；declaration。
- [`go()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1505) L1505–1505；owner `phaseEnd@1487`；variable。
- [`applyPromotionSalary()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1510) L1510–1510；owner `<module>`；variable。
- [`applyDemotionSalary()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1511) L1511–1511；owner `<module>`；variable。
- [`markClubInitiatedRenewal()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1512) L1512–1512；owner `<module>`；variable。
- [`salaryDForContract(d)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1513) L1513–1513；owner `<module>`；variable。
- [`recordSalaryEvaluation()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1514) L1514–1514；owner `<module>`；variable。
- [`recordIndependentSalaryEvaluation()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1515) L1515–1515；owner `<module>`；variable。
- [`appendContractExtension()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1516) L1516–1516；owner `<module>`；variable。
- [`movement()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1518) L1518–1613；owner `<module>`；declaration。
- [`buyoutRemaining(rate)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1614) L1614–1627；owner `<module>`；declaration。
- [`daibaFarewell(cont)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1629) L1629–1635；owner `<module>`；declaration。
- [`handleDemotion(o,path,idx)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1636) L1636–1682；owner `<module>`；declaration。
- [`doDemote()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1641) L1641–1665；owner `handleDemotion@1636`；variable。
- [`retireBelowActiveMinimum()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1683) L1683–1686；owner `<module>`；declaration。
- [`outOfOrg(o)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1687) L1687–1698；owner `<module>`；declaration。
- [`teamListOf(org)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1699) L1699–1699；owner `<module>`；declaration。
- [`signTo(org,lv,team,yrs,mult)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1700) L1700–1709；owner `<module>`；declaration。
- [`pickOfferUI(title,org,offers,after)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1711) L1711–1719；owner `<module>`；declaration。
- [`makeOffers(org,n,bonusBase,yrsLo,yrsHi,lv,exclude)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1720) L1720–1725；owner `<module>`；declaration。
- [`termParams(d,lv)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1727) L1727–1737；owner `<module>`；declaration。
- [`termChoice(o,d,baseTitle,onPick,onReject)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1738) L1738–1753；owner `<module>`；declaration。
- [`est(y,m)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1740) L1740–1740；owner `termChoice@1738`；variable。
- [`extensionOffer(o)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1755) L1755–1765；owner `<module>`；declaration。
- [`faFlow(o)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1767) L1767–1792；owner `<module>`；declaration。
- [`faMarket(o,d)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1793) L1793–1833；owner `<module>`；declaration。
- [`est(of)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1819) L1819–1819；owner `faMarket@1793`；variable。
- [`estL(of)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1820) L1820–1820；owner `faMarket@1793`；variable。
- [`cty(og)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1821) L1821–1821；owner `faMarket@1793`；variable。
- [`ageGateUSA(o,minReq)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1834) L1834–1843；owner `<module>`；declaration。
- [`ageGateJP()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1844) L1844–1851；owner `<module>`；declaration。
- [`crossOffers(o)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1852) L1852–1875；owner `<module>`；declaration。
- [`fin()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1853) L1853–1853；owner `crossOffers@1852`；variable。
- [`runDraft(fromSchool,cb)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1877) L1877–1910；owner `<module>`；declaration。
- [`accept()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1889) L1889–1894；owner `runDraft@1877`；variable。
- [`pathChoiceHS()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1911) L1911–1930；owner `<module>`；declaration。
- [`pathChoiceU4()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1931) L1931–1950；owner `<module>`；declaration。
- [`advance()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1956) L1956–1958；owner `<module>`；declaration。
- [`careerScore(st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1962) L1962–1965；owner `<module>`；declaration。
- [`roleName3(r)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1966) L1966–1966；owner `<module>`；declaration。
- [`primaryPos()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1967) L1967–1984；owner `<module>`；declaration。
- [`capTeam(bucket)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1985) L1985–1989；owner `<module>`；declaration。
- [`defShare(bucket)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1990) L1990–1995；owner `<module>`；declaration。
- [`posLegendPhrase(bucket)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L1996) L1996–2005；owner `<module>`；declaration。
- [`honorScore(bucket)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2006) L2006–2008；owner `<module>`；declaration。
- [`tierOf(bucket)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2009) L2009–2018；owner `<module>`；declaration。
- [`statTable(bucket)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2019) L2019–2039；owner `<module>`；declaration。
- [`retireScene(tiers)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2047) L2047–2106；owner `<module>`；declaration。
- [`endGame(reason)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2107) L2107–2309；owner `<module>`；declaration。
- [`tagStyle(k)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2225) L2225–2231；owner `endGame@2107`；variable。
- [`shareImage(evals,out)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2319) L2319–2615；owner `<module>`；declaration。
- [`tagColor(o)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2448) L2448–2456；owner `shareImage@2319`；declaration。
- [`drawTags(items)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2457) L2457–2466；owner `shareImage@2319`；declaration。
- [`hr()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2472) L2472–2472；owner `shareImage@2319`；declaration。
- [`sectionTitle(t)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2473) L2473–2473；owner `shareImage@2319`；declaration。
- [`row(cells,head)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2484) L2484–2485；owner `shareImage@2319`；declaration。
- [`rowIntl(cells,head)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2503) L2503–2504；owner `shareImage@2319`；variable。
- [`t.onclick()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2618) L2618–2619；owner `<callback@2617>@2617`；assignment。
- [`b.onclick()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2624) L2624–2627；owner `<callback@2624>@2624`；assignment。
- [`S.teamName()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2635) L2635–2641；owner `<callback@2628>@2628`；assignment。
- [`normalizeSeed(raw)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2672) L2672–2674；owner `<callback@2649>@2649`；declaration。
- [`fnv1a32(str)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2675) L2675–2675；owner `<callback@2649>@2649`；declaration。
- [`generateSeed()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2676) L2676–2676；owner `<callback@2649>@2649`；declaration。
- [`deriveSeedInt(seed,salt)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2677) L2677–2677；owner `<callback@2649>@2649`；declaration。
- [`deriveDefaultName(seed,pos)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2678) L2678–2678；owner `<callback@2649>@2649`；declaration。
- [`normalizePlayerName(raw,seed,pos)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2679) L2679–2679；owner `<callback@2649>@2649`；declaration。
- [`escapeHTML(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2680) L2680–2680；owner `<callback@2649>@2649`；declaration。
- [`teamRec(id)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2681) L2681–2681；owner `<callback@2649>@2649`；declaration。
- [`teamDisplay(id,lv)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2682) L2682–2682；owner `<callback@2649>@2649`；declaration。
- [`listByOrg(org)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2683) L2683–2683；owner `<callback@2649>@2649`；declaration。
- [`pickRecord(a)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2684) L2684–2684；owner `<callback@2649>@2649`；declaration。
- [`seedInit(seed)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2686) L2686–2686；owner `<callback@2649>@2649`；assignment。
- [`R()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2687) L2687–2687；owner `<callback@2649>@2649`；assignment。
- [`teamListOf(org)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2689) L2689–2689；owner `<callback@2649>@2649`；assignment。
- [`teamChampRate(id)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2690) L2690–2690；owner `<callback@2649>@2649`；assignment。
- [`salaryFor(lv,d)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2691) L2691–2695；owner `<callback@2649>@2649`；assignment。
- [`migrateSalaryV130State()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2698) L2698–2701；owner `<callback@2649>@2649`；declaration。
- [`migrateSalaryV140State()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2702) L2702–2707；owner `<callback@2649>@2649`；declaration。
- [`serviceYearsFor(org)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2708) L2708–2708；owner `<callback@2649>@2649`；variable。
- [`contractStageFor(org)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2709) L2709–2709；owner `<callback@2649>@2649`；variable。
- [`currentMarketResult()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2710) L2710–2713；owner `<callback@2649>@2649`；variable。
- [`currentMarketRating()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2714) L2714–2714；owner `<callback@2649>@2649`；variable。
- [`previousSalaryForOffer()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2715) L2715–2715；owner `<callback@2649>@2649`；variable。
- [`hadAmericanContract()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2716) L2716–2716；owner `<callback@2649>@2649`；variable。
- [`kboPreviousPackage()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2717) L2717–2717；owner `<callback@2649>@2649`；variable。
- [`salaryCandidate(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2718) L2718–2731；owner `<callback@2649>@2649`；assignment。
- [`saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2732) L2732–2738；owner `<callback@2649>@2649`；declaration。
- [`salaryDecisionLink()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2739) L2739–2739；owner `<callback@2649>@2649`；variable。
- [`salaryDecisionSummary()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2740) L2740–2740；owner `<callback@2649>@2649`；variable。
- [`bindLatestSalaryDetailLink()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2741) L2741–2741；owner `<callback@2649>@2649`；declaration。
- [`link.onclick()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2741) L2741–2741；owner `bindLatestSalaryDetailLink@2741`；assignment。
- [`salaryDForContract(d)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2742) L2742–2742；owner `<callback@2649>@2649`；assignment。
- [`finalizePendingOffseasonSalary()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2743) L2743–2754；owner `<callback@2649>@2649`；declaration。
- [`applyLevelSalary(fromLv,toLv,preventDecrease)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2755) L2755–2766；owner `<callback@2649>@2649`；declaration。
- [`applyPromotionSalary(fromLv,toLv)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2767) L2767–2767；owner `<callback@2649>@2649`；assignment。
- [`applyDemotionSalary(fromLv,toLv)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2768) L2768–2768；owner `<callback@2649>@2649`；assignment。
- [`markClubInitiatedRenewal(years)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2769) L2769–2771；owner `<callback@2649>@2649`；assignment。
- [`appendContractExtension(years,mult)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2772) L2772–2772；owner `<callback@2649>@2649`；assignment。
- [`saveSalaryEvaluation(entry)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2773) L2773–2777；owner `<callback@2649>@2649`；declaration。
- [`recordSalaryEvaluation(st)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2778) L2778–2787；owner `<callback@2649>@2649`；assignment。
- [`recordIndependentSalaryEvaluation(results)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2788) L2788–2792；owner `<callback@2649>@2649`；assignment。
- [`advance()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2795) L2795–2795；owner `<callback@2649>@2649`；assignment。
- [`newState(name,pos)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2797) L2797–2811；owner `<callback@2649>@2649`；assignment。
- [`get()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2804) L2804–2804；owner `newState@2797`；callback。
- [`set(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2804) L2804–2804；owner `newState@2797`；callback。
- [`get()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2805) L2805–2805；owner `newState@2797`；callback。
- [`set(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2805) L2805–2805；owner `newState@2797`；callback。
- [`state.teamName()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2806) L2806–2806；owner `newState@2797`；assignment。
- [`nextContractId(org,teamId,signedYear)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2813) L2813–2813；owner `<callback@2649>@2649`；variable。
- [`fixedContract(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2814) L2814–2814；owner `<callback@2649>@2649`；declaration。
- [`signTo(org,lv,teamId,yrs,mult,decisionType,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2818) L2818–2818；owner `<callback@2649>@2649`；assignment。
- [`render()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2818) L2818–2818；owner `signTo@2818`；variable。
- [`doTradeExec()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2821) L2821–2829；owner `<callback@2649>@2649`；assignment。
- [`stageLabel()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2831) L2831–2831；owner `<callback@2649>@2649`；assignment。
- [`board(phase)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2832) L2832–2832；owner `<callback@2649>@2649`；assignment。
- [`setSchool(kind)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2834) L2834–2834；owner `<callback@2649>@2649`；declaration。
- [`setAmateur(stage)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2835) L2835–2835；owner `<callback@2649>@2649`；declaration。
- [`enterDraftPath(from)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2836) L2836–2836；owner `<callback@2649>@2649`；declaration。
- [`draftFallback(from)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2837) L2837–2837；owner `<callback@2649>@2649`；declaration。
- [`runDraft(fromSchool,cb)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2839) L2839–2844；owner `<callback@2649>@2649`；assignment。
- [`accept()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2842) L2842–2842；owner `runDraft@2839`；variable。
- [`pathChoiceHS()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2846) L2846–2867；owner `<callback@2649>@2649`；assignment。
- [`pathChoiceU4()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2868) L2868–2868；owner `<callback@2649>@2649`；assignment。
- [`cupOnce(key,name,klass,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2870) L2870–2879；owner `<callback@2649>@2649`；declaration。
- [`qualifierOnce(key,name)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2880) L2880–2886；owner `<callback@2649>@2649`；declaration。
- [`amateurSeason()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2887) L2887–2916；owner `<callback@2649>@2649`；assignment。
- [`add(result)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2888) L2888–2888；owner `amateurSeason@2887`；variable。
- [`intlEvents(year)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2918) L2918–2918；owner `<callback@2649>@2649`；declaration。
- [`intlPhase(e)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2919) L2919–2919；owner `<callback@2649>@2649`；declaration。
- [`intlThreshold(e)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2920) L2920–2920；owner `<callback@2649>@2649`；declaration。
- [`intlLevelEligible(e)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2921) L2921–2921；owner `<callback@2649>@2649`；declaration。
- [`addIntlStats()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2922) L2922–2922；owner `<callback@2649>@2649`；declaration。
- [`completeIntl(e,status,next)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2923) L2923–2927；owner `<callback@2649>@2649`；declaration。
- [`processIntlPhase(phase,done)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2928) L2928–2964；owner `<callback@2649>@2649`；declaration。
- [`next()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2933) L2933–2962；owner `processIntlPhase@2928`；variable。
- [`maybeIntl(done)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2965) L2965–2965；owner `<callback@2649>@2649`；assignment。
- [`phaseIntlPre()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2966) L2966–2966；owner `<callback@2649>@2649`；declaration。
- [`startYear()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2967) L2967–2967；owner `<callback@2649>@2649`；assignment。
- [`daibaFarewell(cont)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2969) L2969–2969；owner `<callback@2649>@2649`；assignment。
- [`overseasOffer(org,lv,label,o,minD,finish)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2971) L2971–2976；owner `<callback@2649>@2649`；declaration。
- [`crossOffers(o)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2978) L2978–3004；owner `<callback@2649>@2649`；assignment。
- [`finish()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2979) L2979–2979；owner `crossOffers@2978`；variable。
- [`complete(action)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L2995) L2995–2995；owner `crossOffers@2978`；variable。
- [`renewAndAdvance(AssignmentPattern,AssignmentPattern,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3006) L3006–3006；owner `<callback@2649>@2649`；declaration。
- [`arbitrationFlow()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3007) L3007–3011；owner `<callback@2649>@2649`；declaration。
- [`complete(result,finalSalary)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3009) L3009–3009；owner `arbitrationFlow@3007`；variable。
- [`faFlow(o)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3012) L3012–3022；owner `<callback@2649>@2649`；assignment。
- [`declareFA(type)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3018) L3018–3018；owner `faFlow@3012`；variable。
- [`faOfferText(offer)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3023) L3023–3023；owner `<callback@2649>@2649`；variable。
- [`priceFaOffer(offer)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3024) L3024–3024；owner `<callback@2649>@2649`；declaration。
- [`acceptFaOffer(offer)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3025) L3025–3025；owner `<callback@2649>@2649`；declaration。
- [`showFaMarket(market)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3026) L3026–3031；owner `<callback@2649>@2649`；declaration。
- [`faMarket(o,d)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3032) L3032–3042；owner `<callback@2649>@2649`；assignment。
- [`outOfOrg(o)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3043) L3043–3063；owner `<callback@2649>@2649`；assignment。
- [`pushPro(org,lv,label)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3047) L3047–3047；owner `outOfOrg@3043`；variable。
- [`pushAma(stage)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3048) L3048–3048；owner `outOfOrg@3043`；variable。
- [`phaseEnd()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3068) L3068–3076；owner `<callback@2649>@2649`；assignment。
- [`settlePhaseEnd()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3077) L3077–3091；owner `<callback@2649>@2649`；declaration。
- [`go()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3091) L3091–3091；owner `settlePhaseEnd@3077`；variable。
- [`movement()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3093) L3093–3093；owner `<callback@2649>@2649`；assignment。
- [`endGame(reason)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3096) L3096–3102；owner `<callback@2649>@2649`；assignment。
- [`startJapanese()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/game.js#L3104) L3104–3104；owner `<callback@2649>@2649`；declaration。

### engine/hall-of-fame-policy.js

Imports：無static import。

- [`honorScoreFor(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/hall-of-fame-policy.js#L28) L28–75；owner `<module>`；declaration。

### engine/incentive-policy.js

Imports：無static import。

- [`roundYen(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/incentive-policy.js#L1) L1–1；owner `<module>`；variable。
- [`createIncentiveTerms(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/incentive-policy.js#L4) L4–8；owner `<module>`；declaration。
- [`awardCode(honor)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/incentive-policy.js#L10) L10–18；owner `<module>`；variable。
- [`evaluateIncentive(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/incentive-policy.js#L20) L20–27；owner `<module>`；declaration。
- [`applyIncentivePayment(state,ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/incentive-policy.js#L29) L29–33；owner `<module>`；declaration。

### engine/injury-market-policy.js

Imports：無static import。

- [`classifyMarketInjury(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/injury-market-policy.js#L3) L3–10；owner `<module>`；declaration。
- [`isRecentStar(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/injury-market-policy.js#L12) L12–15；owner `<module>`；declaration。
- [`injurySalaryMultiplier(status,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/injury-market-policy.js#L17) L17–19；owner `<module>`；declaration。
- [`injuryMarketLimits(status,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/injury-market-policy.js#L21) L21–25；owner `<module>`；declaration。

### engine/international-trait-policy.js

Imports：無static import。

- [`count(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L2) L2–2；owner `<module>`；variable。
- [`dictionary(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L3) L3–3；owner `<module>`；variable。
- [`isInternationalFinal(rank)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L5) L5–5；owner `<module>`；variable。
- [`normalizeInternationalState(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L7) L7–24；owner `<module>`；declaration。
- [`validateInternationalEntry(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L27) L27–29；owner `<module>`；declaration。
- [`prepareInternationalResult(s,e,ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L30) L30–35；owner `<module>`；declaration。
- [`commitInternationalResult(s,prepared)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/international-trait-policy.js#L36) L36–45；owner `<module>`；declaration。

### engine/market-policy.js

Imports：`./injury-market-policy.js`（L1）。

- [`buildMarketContext(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L3) L3–6；owner `<module>`；declaration。
- [`createProofOffer(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L8) L8–10；owner `<module>`；declaration。
- [`baseFaOfferCount(marketRating)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L12) L12–12；owner `<module>`；declaration。
- [`competitionMultiplier(offerCount)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L13) L13–13；owner `<module>`；declaration。
- [`contractTypeMultiplier(contractType)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L14) L14–14；owner `<module>`；declaration。
- [`calculateOfferAnnualSalary(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L15) L15–15；owner `<module>`；declaration。
- [`buildFaOffer(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L17) L17–20；owner `<module>`；declaration。
- [`generateBidJitters(teamIds,random)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L22) L22–22；owner `<module>`；declaration。
- [`resolveFaMarket(existing,marketKey,generate)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/market-policy.js#L23) L23–23；owner `<module>`；declaration。

### engine/salary-evaluation-policy.js

Imports：無static import。

- [`clamp(value,min,max)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L4) L4–4；owner `<module>`；variable。
- [`finite(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L5) L5–5；owner `<module>`；variable。
- [`round2(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L6) L6–6；owner `<module>`；variable。
- [`calculateRateStats(playerType,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L8) L8–21；owner `<module>`；declaration。
- [`calculateSampleStatus(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L23) L23–34；owner `<module>`；declaration。
- [`calculateWorkloadAdjustment(sampleRatio)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L36) L36–38；owner `<module>`；declaration。
- [`calculatePitcherPerformanceAdjustment(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L40) L40–46；owner `<module>`；declaration。
- [`calculateHitterPerformanceAdjustment(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L48) L48–54；owner `<module>`；declaration。
- [`calculateMarketAwardAdjustment(AssignmentPattern,year)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L56) L56–66；owner `<module>`；declaration。
- [`calculatePayD(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L68) L68–70；owner `<module>`；declaration。
- [`appendSalaryEvaluation(AssignmentPattern,entry)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L72) L72–76；owner `<module>`；declaration。
- [`calculateMarketRating(AssignmentPattern,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L78) L78–95；owner `<module>`；declaration。
- [`hasActualPerformanceData(playerType,stats)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L97) L97–101；owner `<module>`；declaration。
- [`buildSalaryEvaluationEntry(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L103) L103–127；owner `<module>`；declaration。
- [`calculateIndependentLeagueAwardBonus(results)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L129) L129–139；owner `<module>`；declaration。
- [`buildIndependentLeagueFallbackEntry(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-evaluation-policy.js#L141) L141–154；owner `<module>`；declaration。

### engine/salary-explanation-policy.js

Imports：無static import。

- [`finiteOrNull(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-explanation-policy.js#L1) L1–1；owner `<module>`；variable。
- [`deriveSalaryReasonCodes(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-explanation-policy.js#L3) L3–23；owner `<module>`；declaration。
- [`buildSalaryDecision(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-explanation-policy.js#L25) L25–56；owner `<module>`；declaration。
- [`appendSalaryDecision(AssignmentPattern,decision)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-explanation-policy.js#L58) L58–61；owner `<module>`；declaration。
- [`salaryReasonLabel(reasonCode)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-explanation-policy.js#L82) L82–84；owner `<module>`；declaration。

### engine/salary-promotion-policy.js

Imports：`./contract-policy.js`（L124）。

- [`promotionSalaryUpdate(currentSalary,candidateSalary,contract)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L1) L1–3；owner `<module>`；declaration。
- [`calculateSalaryCurve(rating,curve)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L5) L5–10；owner `<module>`；declaration。
- [`roundToTenThousandYen(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L12) L12–16；owner `<module>`；declaration。
- [`convertRatingBetweenLevels(rating,fromLevel,toLevel,levelTable)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L18) L18–26；owner `<module>`；declaration。
- [`synchronizeContractSalary(contract,annualSalary)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L28) L28–39；owner `<module>`；declaration。
- [`calculateLegacyContractBuyout(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L41) L41–67；owner `<module>`；declaration。
- [`recordAnnualSalaryPayment(state,year,annualSalary)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L69) L69–77；owner `<module>`；declaration。
- [`migrateLegacySalaryState(state)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L79) L79–96；owner `<module>`；declaration。
- [`contractSalaryUpdate(currentSalary,candidateSalary,contract,preventDecrease)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L98) L98–108；owner `<module>`；declaration。
- [`salaryAwardBonus(honors,year)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L110) L110–119；owner `<module>`；declaration。
- [`salaryEvaluationD(lastD,honors,year)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/salary-promotion-policy.js#L121) L121–123；owner `<module>`；declaration。

### engine/signing-bonus-policy.js

Imports：無static import。

- [`yen(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/signing-bonus-policy.js#L1) L1–1；owner `<module>`；variable。
- [`internationalBonus(overall)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/signing-bonus-policy.js#L3) L3–8；owner `<module>`；declaration。
- [`createSigningBonusTerms(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/signing-bonus-policy.js#L9) L9–14；owner `<module>`；declaration。
- [`calculatePostingFee(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/signing-bonus-policy.js#L15) L15–20；owner `<module>`；declaration。
- [`applySigningPayment(state,contract)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/signing-bonus-policy.js#L21) L21–32；owner `<module>`；declaration。

### engine/stat-bucket.js

Imports：無static import。

- [`resolveStatBucket(levels,levelKey)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/stat-bucket.js#L1) L1–5；owner `<module>`；declaration。

### engine/team-demand-policy.js

Imports：無static import。

- [`playerMarketCategory(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/team-demand-policy.js#L3) L3–7；owner `<module>`；declaration。
- [`deterministicHash(input)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/team-demand-policy.js#L9) L9–9；owner `<module>`；declaration。
- [`hashToUnit(seed,year,teamId,category)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/team-demand-policy.js#L10) L10–10；owner `<module>`；declaration。
- [`teamDemandScore(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/team-demand-policy.js#L11) L11–11；owner `<module>`；declaration。
- [`teamDemandMultiplier(score)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/team-demand-policy.js#L12) L12–12；owner `<module>`；declaration。
- [`teamDemandLabel(score)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/team-demand-policy.js#L13) L13–13；owner `<module>`；declaration。
- [`rankTeamsByDemand(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/team-demand-policy.js#L15) L15–18；owner `<module>`；declaration。

### engine/trait-policy.js

Imports：無static import。

- [`traitLabel(key,AssignmentPattern,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js#L19) L19–26；owner `<module>`；declaration。
- [`removedTraitLabel(item,AssignmentPattern,nickname)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js#L27) L27–32；owner `<module>`；declaration。
- [`confidanteEligible(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js#L33) L33–36；owner `<module>`；declaration。
- [`recordFirstTeamSeason(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js#L37) L37–44；owner `<module>`；declaration。
- [`goldclothEligible(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js#L45) L45–45；owner `<module>`；variable。
- [`highSchoolChampionCount(s)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js#L46) L46–49；owner `<module>`；declaration。
- [`declineForSeason(s,base)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js#L50) L50–54；owner `<module>`；declaration。
- [`awardTraitUnlocks(s,bucket,league)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/engine/trait-policy.js#L55) L55–73；owner `<module>`；declaration。

### main.js

Imports：`./ui/preferences.js`（L1）。

沒有函式節點，僅資料／入口呼叫。

### ui/ability-view.js

Imports：無static import。

- [`addAbilityRow(list,item)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/ability-view.js#L1) L1–5；owner `<module>`；declaration。
- [`addConditionRow(list,item)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/ability-view.js#L7) L7–11；owner `<module>`；declaration。
- [`renderAbility(container,model)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/ability-view.js#L13) L13–25；owner `<module>`；declaration。
- [`traitList(values)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/ability-view.js#L27) L27–27；owner `<module>`；variable。
- [`renderTraits(container,model)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/ability-view.js#L28) L28–32；owner `<module>`；declaration。

### ui/choice-action.js

Imports：無static import。

- [`safeErrorCode(error)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/choice-action.js#L1) L1–4；owner `<module>`；declaration。
- [`createChoiceActionToken(generation)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/choice-action.js#L6) L6–8；owner `<module>`；declaration。
- [`runChoiceAction(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/choice-action.js#L10) L10–59；owner `<module>`；declaration。

### ui/condition-view-model.js

Imports：無static import。

- [`formatRehabStatus(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/condition-view-model.js#L1) L1–5；owner `<module>`；declaration。

### ui/contract-labels.js

Imports：無static import。

- [`contractTypeLabel(code)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/contract-labels.js#L3) L3–3；owner `<module>`；declaration。

### ui/navigation.js

Imports：`./record-view.js`（L1）；`./player-detail.js`（L2）；`./ability-view.js`（L3）。

- [`initNavigation(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L8) L8–20；owner `<module>`；declaration。
- [`syncBoardHeight()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L10) L10–10；owner `initNavigation@8`；variable。
- [`selectPlayer(tab)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L12) L12–12；owner `initNavigation@8`；variable。
- [`selectCareer(tab)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L13) L13–13；owner `initNavigation@8`；variable。
- [`selectMain(view)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L14) L14–14；owner `initNavigation@8`；variable。
- [`show()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L18) L18–18；owner `initNavigation@8`；callback。
- [`reset()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L18) L18–18；owner `initNavigation@8`；callback。
- [`navigationController()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/navigation.js#L22) L22–22；owner `<module>`；declaration。

### ui/player-detail.js

Imports：`./record-view.js`（L1）。

- [`emptyText(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/player-detail.js#L3) L3–3；owner `<module>`；variable。
- [`panel(title)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/player-detail.js#L4) L4–4；owner `<module>`；variable。
- [`list(values)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/player-detail.js#L5) L5–5；owner `<module>`；variable。
- [`renderCareer(container,model,tab)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/player-detail.js#L7) L7–24；owner `<module>`；declaration。

### ui/preferences.js

Imports：無static import。

- [`normalizeDisplayPreferences(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L6) L6–9；owner `<module>`；declaration。
- [`readDisplayPreferences(storage)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L11) L11–14；owner `<module>`；declaration。
- [`saveDisplayPreferences(storage,value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L16) L16–19；owner `<module>`；declaration。
- [`getDisplayPreferences()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L21) L21–21；owner `<module>`；declaration。
- [`initializeDisplayPreferences(AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L23) L23–82；owner `<module>`；declaration。
- [`apply()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L27) L27–32；owner `initializeDisplayPreferences@23`；variable。
- [`syncStickyHeight()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L36) L36–36；owner `initializeDisplayPreferences@23`；variable。
- [`sync()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L47) L47–47；owner `initializeDisplayPreferences@23`；variable。
- [`update(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L49) L49–56；owner `initializeDisplayPreferences@23`；variable。
- [`close()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/preferences.js#L60) L60–60；owner `initializeDisplayPreferences@23`；variable。

### ui/record-view.js

Imports：無static import。

- [`value(v)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/record-view.js#L1) L1–1；owner `<module>`；variable。
- [`addPair(list,label,val)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/record-view.js#L3) L3–7；owner `<module>`；declaration。
- [`renderRecord(container,model)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/record-view.js#L9) L9–22；owner `<module>`；declaration。

### ui/salary-detail.js

Imports：`../engine/salary-explanation-policy.js`（L1）；`./contract-labels.js`（L2）。

- [`escapeHtml(value)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/salary-detail.js#L4) L4–4；owner `<module>`；variable。
- [`signed(value,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/salary-detail.js#L5) L5–5；owner `<module>`；variable。
- [`salaryDetailMarkup(decision,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/salary-detail.js#L7) L7–23；owner `<module>`；declaration。
- [`createSalaryDetailController(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/salary-detail.js#L25) L25–34；owner `<module>`；declaration。
- [`open()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/salary-detail.js#L27) L27–27；owner `createSalaryDetailController@25`；variable。
- [`close()`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/salary-detail.js#L28) L28–28；owner `createSalaryDetailController@25`；variable。

### ui/seed-share.js

Imports：無static import。

- [`replayURL(seed,href)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/seed-share.js#L2) L2–5；owner `<module>`；declaration。
- [`copyShareText(text,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/seed-share.js#L6) L6–20；owner `<module>`；declaration。
- [`createSeedShareController(ObjectPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/seed-share.js#L21) L21–61；owner `<module>`；declaration。
- [`shareReplayURL(url,AssignmentPattern)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/seed-share.js#L64) L64–71；owner `<module>`；declaration。

### ui/share-theme.js

Imports：無static import。

- [`getSharePalette(theme)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/share-theme.js#L7) L7–7；owner `<module>`；declaration。
- [`shareTagPalette(colors,theme)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/share-theme.js#L8) L8–13；owner `<module>`；declaration。
- [`luminance(hex)`](https://github.com/tt-chin/yakyujinsei/blob/ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1/docs/src/ui/share-theme.js#L10) L10–10；owner `shareTagPalette@8`；variable。

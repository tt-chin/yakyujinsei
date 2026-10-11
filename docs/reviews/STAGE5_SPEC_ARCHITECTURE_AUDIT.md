# 第五階段：現行規格與程式架構稽核

日期：2026-10-11。這是調查報告，不是遊戲修正、政策批准或全功能驗收。

## 1. 基準、範圍與證據層級

- Repository：`tt-chin/yakyujinsei`；工作分支：`dev`。
- fetch 後 `origin/dev`／作業前 HEAD：`1dacc55e24eca42bea9a2ad98adf82db2507f7ad`。
- `origin/main`：`e886e84ca08c6c185406cac9d6f3c4376277061a`；VERSION：`1.11.4`。作業前工作樹乾淨。
- CURRENT_SPEC：改訂22，共16章。下表行號皆以受驗 HEAD 為準；`game.js` 共3097行。
- 未找到獨立 `BACKLOG_REVISED.md`。最新已提交 BACKLOG 是使用者在 `1dacc55` 重編的版本；其「尚未提交草案」及來源 `aa602b3` 是過時的文件描述，不是未提交變更。本次保留該編排、既有結案及歷史数字，只更新指定進度及基準。
- 已檢視 AGENTS、index.html、CURRENT_SPEC、BACKLOG、CHANGELOG，以及 [KBO](KBO_RENEWAL_FLOOR_FIX.md)、[ACT 最終驗收](ACT_01_02_FINAL_ACCEPTANCE.md)、[契約年俸](CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)、[Draft 收入](DRAFT_INCOME_E2E_FIX_AUDIT.md)、[Runner／CI](TEST_INFRA_ACCEPTANCE.md) 的結果與限制。
- `git diff origin/main -- docs/src docs/index.html docs/styles` 無差異。前四階段受驗遊戲資產與目前正式版一致；這不把歷史瀏覽器測試改稱本輪重跑。

證據縮寫：`Q:test-name` 是本輪 quick 實際 PASS 的入口（檔案在 tests/，名稱省略 `.mjs`）；`H:ACT/契約/CI` 是上述歷史報告；`S` 是本轮静態／AST檢視。單純 regex／原始碼測試不證明實際 DOM、數值全域或自然取得率。MATCH 僅適用表列限定命題，不等於整章 PASS；UNVERIFIED 行保留對應程式但不宣稱已驗收。政策參考外部網站未重新查證：驗收依現行核准遊戲政策，不以現實制度推翻它。

本表採「可獨立判定的規格群組」為計數單位，細項由 CURRENT_SPEC 行號範圍索引；不以章數、assertion 數或 BACKLOG ID 數混算。尚缺細項窮舉、全數值邊界及實機證據，因此 AUD-02 不結案。

84個規格群組統計：**MATCH49、MISMATCH3、UNVERIFIED27、DESIGN_PENDING1、OBSOLETE4**。3個MISMATCH是carry結構與兩組文書引用，不是3個已重現的重大遊戲Bug。

## 2. CURRENT_SPEC 十六章對照

程式路徑縮寫：`G`＝`docs/src/engine/game.js`；`E/`＝`docs/src/engine/`；`U/`＝`docs/src/ui/`；`D/`＝`docs/src/data/`。每個 `函式:行` 均指目前程式位置。

| ID／規格行 | 描述、數值與實際行為 | 對應程式／函式：行 | 證據、差異及決策 | 狀態 |
|---|---|---|---|---|
| 01a／13–24 | v1.6.2 的「實動未驗證」矩陣是歷史快照；後續1.11.4已有特定驗收，不應讀作現在全未驗證 | G allocUI:676、crossOffers:2972 | H:ACT／契約；保留歷史，不倒寫舊結果；F07 | OBSOLETE |
| 01b／26–28 | 封存非現行命令，原始數值表全移管尚未完成 | docs/archive/README.md；G overlay:2645 | S；AUD-04仍未完成，不能推測空白政策 | UNVERIFIED |
| 01c／1–9 | 唯一VERSION為1.11.4；歷史公開SHA與目前開發HEAD分開 | docs/src/config.js:1；G newState:2793 | Q:verify-modularization；本輪不更版 | MATCH |
| 02a／34 | UTF-8、相對模組、靜態網站；不新增伺服器 | docs/index.html:1；docs/src/main.js:1；G imports:1 | Q:syntax、verify-modularization；loopback HTTP實際載入 | MATCH |
| 02b／35–36 | 顯示状态與S分開；相同seed與選擇重現 | U/navigation.js initNavigation:8；G R:2683 | Q:choice-action、fixed-seed-v160；KBO完整IF重跑一致；未窮舉所有操作 | MATCH |
| 02c／37 | URL僅seed、忽略rv/rules，不切換舊引擎 | U/seed-share.js replayURL:2；G startJapanese:3087 | Q:replay-share-theme、verify-modularization、fixed-seed-v160 | MATCH |
| 02d／38、42 | 僅保存顯示設定，不加入生涯續玩 | U/preferences.js readDisplayPreferences:11；G startJapanese:3087 | Q:display-preferences；S:目前無生涯storage入口 | MATCH |
| 02e／39–40 | 自然日文／保留核准文案、遊戲條件和事件順序 | U/contract-labels.js；G resolveEvent:1051 | Q:japanese-copy-contract-ui、event-copy只覆蓋特定文案；COPY-01非全面完成 | UNVERIFIED |
| 03a／48 | 投手排序後42/30/18%＋sta10%，round | G ovr:357 | Q:fixed-seed-v160為RNG列；S公式符合；尚缺全排序／round邊界原生fixture | UNVERIFIED |
| 03b／50–55 | 野手38/27/20/15%，不把sta排序；yips在round後−3 | G ovr:357 | S符合；野手stamina5%提案仍OVR-01，不能套用 | UNVERIFIED |
| 03c／57–65 | dw＝SS/CF/C .30、2B/3B .22、RF .20、LF .14、1B/DH .12；未設定.24、未知.22；DH=1B−12 | G ovr:365、dpScore:67 | S符合；缺各守位／fallback／DH成對動態驗證 | UNVERIFIED |
| 03d／65 | 捕手守備40/40/20及其他dpScore | G dpScore:67 | S可定位；缺每條係數／守備門檻原生對照，不用OVR測試代替 | UNVERIFIED |
| 03e／66 | 直接MLB候選OVR60且d≥2；未符合者不新增候選 | G overseasOffer:2965、faMarket:3026 | Q:npb-return-ui、global-contract-market；完整各守位到達率未測 | MATCH |
| 04a／71–75 | 高中春→夏地方→資格全国→一二年秋；優勝與準優勝以結構區分，年度選拔資格 | E/domestic-tournament-policy.js grantsSenbatsuEligibility:25；G amateurSeason:2881 | Q:domestic-tournament-policy；完整高中所有日程／UI分支未重新驗證 | UNVERIFIED |
| 04b／76–78 | 大學春優勝→全日本；秋DIRECT/PLAYOFF；能力點5/4/3/2/1、資格戰0 | E/domestic-tournament-policy.js tournamentResult:8、qualificationResult:45 | Q:domestic-tournament-policy（原生函式） | MATCH |
| 04c／79–80 | 社會人資格、獨立優勝、同年不重複；資格戰不給點 | G cupOnce:2864、qualifierOnce:2874、amateurSeason:2881 | Q:domestic-tournament-policy；所有社會人入口／重入未窮舉 | UNVERIFIED |
| 04d／81 | 集中育成75%、連續3年與特性不因註解變更 | G phasePre:725、allocDone:1058 | Q:ability-allocation僅靜態；AUD-03B缺combo／late確認路線 | UNVERIFIED |
| 05a／85–87 | payD與能力d分離；近三季60/30/10、缺季正規化；傷病權重另算 | E/salary-evaluation-policy.js calculatePayD:68、calculateMarketRating:78 | Q:salary-evaluation-policy、injury-market-policy | MATCH |
| 05b／88–89 | 越境rating+來源par−目標par；内部円、顯示万円 | E/salary-promotion-policy.js convertRatingBetweenLevels:18；G salaryCandidate:2714 | Q:salary-promotion-policy、salary-flow、global-contract-market | MATCH |
| 05c／90 | schedule支付正本；延長接舊約、交易承接、買斷只取未付 | E/contract-policy.js appendExtension:38、transferContract:40、calculateScheduledBuyout:42 | Q:contract-policy、salary-flow；H:契約矩陣 | MATCH |
| 05d／91–94 | 各聯盟control/FA分開、MiLB不加MLB年資、傷病不削既約、出来高年度去重 | G movement:3076；E/incentive-policy.js applyIncentivePayment:29 | Q:control-period-policy、injury-market-policy、incentive-policy、fa-market-policy | MATCH |
| 05e／95–97 | 報價／接受共用快照；來年schedule不是當年所得；满期與全休須續約 | G signTo:2812、phaseEnd:3060、crossOffers:2972 | Q:npb-return-ui、kbo-renewal-e2e；H:契約381案，不聲稱全情境 | MATCH |
| 05f／85–97 | 年度、滿期、全休、降格、FA所有跨功能交互均無非法狀態 | G movement:1514/3076、handleDemotion:1632、advance:2791 | 已有H:契約；F02/F03直接重入／中途失敗未驗，不能由幾個seed外推 | UNVERIFIED |
| 06a／103–113、118 | 三主畫面、2/4子tab；home log→toggle→act僅一份、保留listener | docs/index.html；U/navigation.js initNavigation:8；G choose:663 | Q:information-architecture（靜態）＋ACT6 pointer真實點擊與返回 | MATCH |
| 06b／115–116 | league與level累積同一st一次；NPB/KBO/CPBL二軍歸本聯盟；R/A1/A2/A3=MINOR，未知throw | E/stat-bucket.js；G accStat:560、accLevelStat:568 | Q:record-condition-fix；S:沒有把未知階層fallback成MINOR | MATCH |
| 06c／117、120–126 | 全休skipMid&&factor0優先；階級排序、歷史年度不猜角色／年俸、年數log.length | U/condition-view-model.js formatRehabStatus:1；G buildCareerViewModel:617 | Q:record-condition-fix、information-architecture；全tab視覺／各role累積尚缺獨立fixture | UNVERIFIED |
| 06d／128 | aria-current/tablist/hidden、model讀取不改S/RNG/URL | U/navigation.js:8；G buildAbilityViewModel:614、buildCareerViewModel:617 | Q:information-architecture與ACT pointer；全導航ARIA／鍵盤動態矩陣未重跑 | UNVERIFIED |
| 06e／131–134 | 決定履歷無10筆上限，按salaryYear排序，同年同類去重、異類保持，不造延續決定 | E/salary-explanation-policy.js appendSalaryDecision:58；E/salary-promotion-policy.js migrateLegacySalaryState:79 | Q:salary-explanation-policy、salary-promotion-policy，25筆／舊資料；不是evaluationHistory近3季 | MATCH |
| 06f／135–138 | 全行正常捲動、空履歷安全；不能從成績／累計推測已刪資料 | G buildCareerViewModel:617；U/player-detail.js renderCareer | Q:salary-explanation-policy；25行UI為歷史證據，本輪未重跑salary-history-e2e | UNVERIFIED |
| 07a／141、145 | row一次pool1或一顆dice、Enter/Space、cap80或剩0禁用；無+5/MAX | G allocUI:676 | Q:ability-allocation是regex；H:ACT／歷史能力6案；全cap／鍵盤動態仍AUD-03B | UNVERIFIED |
| 07b／143、145 | Undo恢復carry；原缺key保存beforeCarry=0，撤銷直接寫key=0，非完全同形 | G allocUI allocate:695、Undo:703 | S確定結構差異；H:BACKLOG_ACCEPTANCE_AUDIT；數值等價、影響未證；F01 | MISMATCH |
| 07c／143–145 | reset恢復ab/carry/pool/idx/touched，清hist，重用同dice、不抽RNG；4/3倍超潛在成本 | G allocUI:676、abCost:390、addAb:395 | Q:ability-allocation靜態；局部史測通過不等於combo/late與allcap全驗 | UNVERIFIED |
| 07d／147、151–156 | schema3、schedule-only保障；bonus/stipend/posting分開且contractId一次付款；已付額顯示不重記帳 | E/contract-policy.js createContract:12；E/signing-bonus-policy.js applySigningPayment:21；U/salary-detail.js | Q:contract-policy、draft-income-e2e18案例、draft-bonus-display、salary-detail-ui | MATCH |
| 07e／157 | 契約金顯示原文連結不存在 | CURRENT_SPEC.md:157 → FIX_DRAFT_SIGNING_BONUS_INCOME_DISPLAY.md | fs.existsSync=false；不得復原已批准刪除文書；F05 | MISMATCH |
| 08a／161–164 | standard/night/classic/scoreboard；字級.90/1/1.15；密度standard/compact，storage display.v1/schema1 | U/preferences.js DEFAULT_PREFERENCES:2、normalizeDisplayPreferences:6 | Q:display-preferences（normalize/storage）；CSS倍率位置需視覺矩陣，列入08d | MATCH |
| 08b／165–166 | 壞JSON/schema全fallback、未知欄各fallback、storage例外安全；modal焦點/Escape/還原 | U/preferences.js readDisplayPreferences:11、initializeDisplayPreferences:23 | Q:display-preferences；所有焦點／捲動實動未重跑 | UNVERIFIED |
| 08c／167–169 | preferences先於engine；起動按鈕disabled；切主題不重建act、不改S/URL/RNG | docs/src/main.js:1；U/preferences.js initializeDisplayPreferences:23 | Q:display-preferences、ACT保留DOM；完整起動競態／設定組合仍不足 | UNVERIFIED |
| 08d／163、171–172 | 字級只乘一次、44px、文字4.5:1／focus3:1；320/375/390/430/560/1280全設定 | docs/styles/preferences.css、themes.css；U/preferences.js | Q為靜態／單元；H:CI全E2E；本輪非全面視覺實機，UI-17-DEVICE仍BLOCKED | UNVERIFIED |
| 08e／170 | displaychange通知與getDisplayPreferences.theme；1.7原PNG不變是版本範圍描述，第16章已四主題 | U/preferences.js getDisplayPreferences:21；G shareImage:2315 | 不應恢復舊固定standard；F07 | OBSOLETE |
| 09a／176–178 | dev→Preview→批准main；文書／工具不升VERSION，CHANGELOG只產品改動 | AGENTS §9/10；scripts/test.mjs | 本輪遵守，提交只dev；Q:verify-modularization、test-runner | MATCH |
| 09b／178 | SHA、測試、環境可追溯，不因設計書寫完成就PASS | scripts/test.mjs；本報告§6 | Q:test-runner（FAIL/BLOCKED非零等）；歷史／本輪分開 | MATCH |
| 10a／182、194 | 92卡、copyRevision2／1012欄文案正本本地link已消失，測試從Git歷史讀原文 | D/event-cards-jp.js:1；tests/event-copy.test.mjs | Q:event-copy通過不代表連結有效；4個文書相關失效連結見F05（含§12） | MISMATCH |
| 10b／183 | 43/35/14，條件AND/arrayOR、ID排序、PRO3/其他2、空pool不fallback | E/event-policy.js eventEligible:6；G drawEvents:846 | Q:event-policy、event-fix；同年耗盡不補抽 | MATCH |
| 10c／184–185 | bold/norm/safe；基礎70/50、thief−10、safe+20上限95、favorite norm+5、bold−15／組合+5、latepractice safe−5 | E/event-policy.js eventOdds:13、eventPlan:19；G choiceSummary:839 | Q:event-policy、trait-policy；分類tier及encounter轉training | MATCH |
| 10d／186 | event投手非sta cost1/2/4/7門檻50/58/66；其餘1/2/3門檻64/72，超pot4/3倍；負1～80 | E/event-policy.js eventAbilityCost:33、eventAddAbility:37 | Q:event-policy；一般addAb門檻55/60/66是另一核准路徑，不判衝突 | MATCH |
| 10e／187 | year:sequence:cardID，pending相同／resolved一次、traits解決前snapshot | E/event-state-policy.js beginEvent:13、applyEvent:26 | Q:event-integration、event-fix；重入不多取RNG | MATCH |
| 10f／188 | sponsor safe.5/norm1/bold1.5、adking1.1、萬元round正額最低1萬，HS/U0；ledger三累計各一次 | E/event-policy.js eventIncome:28；E/event-state-policy.js applyEvent:26 | Q:event-policy、event-integration，與salary／corp分帳 | MATCH |
| 10g／189–190 | pendStat×factor在基礎後effort前；非0校正，0保舊；業餘form／年末清除，年度僅重置yearOutsideIncome | G simSeason:422、applySeasonForm:507；E/event-season-policy.js:16 | Q:event-integration、event-policy；所有角色／上限交互未窮舉 | UNVERIFIED |
| 10h／191–193 | adking5bold成功、favorite<25 norm10、clutch<25 bold7、disc<25 safe15且caught0/snack<5；cancer社交失敗>10 | E/event-policy.js eventTraitUnlocks:59；G simSeason:422 | Q:event-policy；favorite.85、守備−3的完整可達成績矩陣未測 | UNVERIFIED |
| 11a／198、202–212 | 円／萬元、NPB減額75%/60%；P快照→M→T→anchor→relativecap→floor→hardcap→萬元round再驗 | G previousSalaryForOffer:2711、salaryCandidate:2714；E/cross-league-market-policy.js applyCrossLeagueSalary:36 | Q:global-contract-market、control-period-policy、salary-flow、kbo-renewal-floor | MATCH |
| 11b／216–220 | STAR=OVR60/rating3/最近3季2有效一軍payD3；ELITE=65/6/2季6；資料不足不例外 | E/cross-league-market-policy.js marketTier:6 | Q:global-contract-market，與injuryRecentStar分開 | MATCH |
| 11c／224–234 | NPB順位萬円8000–10000/5000–7500/3500–5500/2500–4500/2000–3500/1500–3000；育成0＋290萬，ri照消耗 | E/signing-bonus-policy.js NPB_BONUS_RANGES:2；G runDraft:2833 | Q:global-contract-market、draft-signing-policy、draft-income-e2e | MATCH |
| 11d／236–242 | US bonus OVR40/50/60/70/80線性300/1000/3000/8000/20000萬；初次一次、正常更新0 | E/signing-bonus-policy.js internationalBonus:3、createSigningBonusTerms:9 | Q:global-contract-market、draft-income-e2e；無bonus RNG | MATCH |
| 11e／250–255 | CPBL路線倍率/weight/一般-星cap：NPB1/.60/2.5–4、KBO.95/.60/2–3、MLB1/.70/1.5–2、MiLB1/.70/2.5–4；一軍8000/10000、二軍1200萬cap；floor1200/400萬 | E/cross-league-market-policy.js getCrossLeaguePolicy:21；G salaryFor:2687 | Q:global-contract-market（表參數／邊界）；不是同盟續約曲線40000萬上限 | MATCH |
| 11f／259–265 | KBO四路線1、weight.65/.65/.70/.70、cap3–4/3–4/1.5–2/3–4；floor4000/800萬、KBO2cap3000萬 | E/cross-league-market-policy.js getCrossLeaguePolicy:21；G salaryFor:2687 | Q:global-contract-market、kbo-renewal-floor | MATCH |
| 11g／269–274 | NPB weight.70/.65/.70/.70，倍數2–4/3–5/∞/2.5–4；MLB anchor≤T1.5；floor1600/500/300、cap60000/1600/500萬 | E/cross-league-market-policy.js getCrossLeaguePolicy:21 | Q:global-contract-market、npb-return-ui；無外國人premium | MATCH |
| 11h／278–284 | US MLB跨1/.95/一般6、ELITE∞；MLBFA service≥6無anchor；MiLB1/.80/∞、R/A1/A2/A3 floor300/400/600/1000 cap300/400/600/3000萬 | E/cross-league-market-policy.js getCrossLeaguePolicy:21；G salaryCandidate:2714 | Q:global-contract-market；首次未豁免同球團MLB改R、既有美國不重bonus | MATCH |
| 11i／288–290 | release cap1.5/2；同年來源snapshot、同盟不跨表、未知route報錯 | E/cross-league-market-policy.js getCrossLeaguePolicy:21 | Q:global-contract-market；實際所有再轉隊／退出組合仍非窮舉 | MATCH |
| 11j／294–302 | FX150；FOREIGN_STANDARD；KBO新1.5億、續max(1.5億,舊package1.2)≤3億；salary+7%option+bonus+fee；floor先於cap，真衝突報錯 | E/cross-league-market-policy.js applyKboForeignPackageCap:51；G fixedContract:2810 | Q:kbo-renewal-floor、kbo-renewal-e2e（2049IF→2050退休）；不改制度參數 | MATCH |
| 11k／305–314 | 豁免NPB1/KBO1/CPBL1每年一次且factor≥.5；舊資料僅可靠log；posting Major2500萬USD20%/下一2500萬17.5%/餘15%、Minorbonus25%，球團收款非所得 | E/cross-league-market-policy.js accrueForeignFirstTeamSeason:11；E/signing-bonus-policy.js calculatePostingFee:15 | Q:global-contract-market；KBO/CPBL posting與亞洲名額不新增 | MATCH |
| 11l／318–337 | schema3分欄、contractId一次領、normalize不支付、舊bonus LEGACY；候選accept一次、不刪oldmarket；限定舊新版金錢差允許 | E/signing-bonus-policy.js applySigningPayment:21；G migrateSalaryV140State:2698、signTo:2812 | Q:global-contract-market、draft-income-e2e；transaction失敗／全部動態路徑F03/F04未證 | UNVERIFIED |
| 12a／342–347 | 38ID、29既有＋6新增、3保留；共享labels／removed只顯示轉換 | E/trait-policy.js TRAIT_LABELS:2、traitLabel:19 | Q:trait-policy；38原文連結消失另F05；不稱35件自然全部取得 | MATCH |
| 12b／345–346 | legendLeague只首輪入選首個CPBL→KBO→NPB→MLB；既有legend不遷移；倍率1.15/1.15/1.12/1.20 | G endGame:2103、trait unlock首輪處理 | Q:hof-first-ballot-league（F01–F11舊新版比）、retirement-hof-balance | MATCH |
| 12c／347–349 | confidante交際≥3現未婚本人/exes子0；goldcloth阪神NPB_CL_HAN一軍10季含全休，舊混合不猜 | E/trait-policy.js confidanteEligible:33、recordFirstTeamSeason:37、goldclothEligible:45 | Q:trait-policy；核准舊取得保留 | MATCH |
| 12d／350–354 | oldghost≥35 MVP翌年一次half、round正最低1但0保持0；高校4實冠、<24NPB/MLB MVP稱號、training safe失敗20次後safe−5 | E/trait-policy.js declineForSeason:50、awardTraitUnlocks:55；E/event-policy.js:50 | Q:trait-policy、event-policy；無新增抽選 | MATCH |
| 12e／355–358 | hitterTC同年同聯盟三正式賞保MVP、原chance順保留；rubber55→85%、50→100；保留3件不解鎖 | E/trait-policy.js awardTraitUnlocks:55；G awards:1313、resolveTJ:289 | Q:trait-policy native awards／chance列；不以「兩倍」替代文案 | MATCH |
| 12f／359–360 | 920×2圖片大量特性不裁切、圖片RNG0、自然新特性觸發差允許 | G shareImage:2315；U/share-theme.js | Q:trait-policy含靜態；38件圖片為歷史UI證據，非本輪全PNG驗收 | UNVERIFIED |
| 12g／340–360 | 未決三特性、殿堂bucket/role/投票解釋／自然率不擅改 | G endGame:2103；E/hall-of-fame-policy.js:28 | BACKLOG六HOF決策／保留特性；本報告不產生新殿堂政策 | DESIGN_PENDING |
| 13a／363–365 | 同年度drawnIDs排除，pending同一，年初重置、全年無新旗標重抽RNG | E/event-state-policy.js eventDrawPool:21、resetEventYear:53；G drawEvents:846 | Q:event-fix、event-integration，年度去重及跨年 | MATCH |
| 13b／366 | bold成敗育成點按training／encounter分開，不能對已批negative錯誤clamp0 | G choiceSummary:839、resolveEvent:1051；E/event-policy.js eventPlan:19 | Q:event-fix、event-policy；完整全卡PC視覺未重跑 | MATCH |
| 13c／367–371 | 中途Seed複製與Replay共享、focus／URL不改S；iPhone歷史PASS不替Android | U/seed-share.js createSeedShareController:21 | Q:event-fix、replay-share-theme；實機／OS行為仍BLOCKED | UNVERIFIED |
| 14a／375 | dev v1.10.3「不main發布」是當時工程限制，不代表現1.11.4未公開 | G VERSION import:1；CURRENT_SPEC:3–5 | 最新正式公開歷史與AGENTS一致；F07，非政策衝突 | OBSOLETE |
| 14b／376–378 | NPB復歸僅滿期、OVR47/53，未满期不抽球團；局所state/year/ct快照、同額accept／完成guard | G crossOffers:2972、finalizePendingOffseasonSalary:2739 | Q:npb-return-ui＋KBOUI；H:契約／NPB return實際矩陣 | MATCH |
| 14c／379–383 | 年俸（万）ARIA、nav padding4px×scale、最低44px／約53px、ResizeObserver border-box | U/navigation.js:10–11；docs/styles/ui-navigation.css；G board:627 | Q:npb-return-ui靜態，H:三尺寸；所有字級／實機未重跑 | UNVERIFIED |
| 15a／388–390 | 注入team/random，既有season內容不變、不新增賞金／額外國際制度 | E/championship-policy.js settleChampionship:51；E/international-trait-policy.js | Q:championship-intl，核准差僅目標優勝抽選及國際特性 | MATCH |
| 15b／394–396 | NPB8%(2–15)、MLB3.5%(2–9)、CPBL15%(2–26)、KBO10%(2–20)；D×.5 clamp再clutch1.25／refuse.75再clamp；不round | E/championship-policy.js RULES:1、championshipEligibility:39 | Q:championship-intl，NPBD4=12.5%、CPBL雙24.375% | MATCH |
| 15c／395、400–401 | PRO有效快照、MLB用effective league；二軍／MiLB／全休rng0，成績賞薪資後、TJ降格轉隊前拍照，同年不覆寫 | G proSeason:1227；E/championship-policy.js captureSeasonChampionship:33 | Q:championship-intl native fixture；RNGeligible1/ineligible0 | MATCH |
| 15d／402–405 | championship year一次、honor不重複；end維護refuse−1/heat−5，下限0，contract-paid不重抽 | E/championship-policy.js settleChampionship:51、maintainSeasonEnd:66；G phaseEnd:3060 | Q:championship-intl；CORP重入不是本policy範圍，另F02 | MATCH |
| 15e／409–423 | WBC/P12日程、hadIntlace解決前；3出場＋2決賽解鎖，下次inj0／點≥2，原7/5/3/1；prepare→commit，migration不造賽事 | G processIntlPhase:2922；E/international-trait-policy.js prepareInternationalResult:30、commit:36 | Q:championship-intl；解鎖當次不遡及，seen key不重RNG | MATCH |
| 15f／427–434 | 一般6seed及focused16seed完整人生、自然聯盟樣本和所有國際UI | G startYear:2961→phasePre/Intl/phaseMid/phaseEnd | H:歷史有明確Seed／策略；本輪僅KBOIF全生涯，不重跑16focused／4000調查 | UNVERIFIED |
| 16a／438–443 | replay單click navigator.share；不支援才copy；AbortError不copy、其他錯誤手動、finally解鎖／dialog代次防舊結果 | U/seed-share.js shareReplayURL:64、createSeedShareController:21 | Q:replay-share-theme；API mock不是OS share sheet，SHARE-111-DEVICE保留 | UNVERIFIED |
| 16b／444 | 四主題8鍵palette、未知standard／返副本 | U/share-theme.js getSharePalette:7 | Q:replay-share-theme（完整hex色盤與tag對比）；無S／RNG | MATCH |
| 16c／445–446 | displaychange只theme重生已生成連接PNG，fontsize/density不重生；相同bytes用於preview/download/share，920px×2 | G shareImage:2315、displaychange listener；U/share-theme.js | Q:replay-share-theme靜態；H:CI全UI圖片；本輪PNG像素／race未重新驗證 | UNVERIFIED |
| 16d／438、447–452 | 1.11.1僅dev限制／既往測試數是歷史範圍；S01/S02與OS圖片share仍未代理實驗 | U/seed-share.js:64；G shareImage:2315 | 同CURRENT_SPEC導言現main1.11.4不矛盾；F07，實機限制仍有效 | OBSOLETE |

未另列新的薪資曲線係數／league baseline 數字作「核准規格」：CURRENT_SPEC未逐項寫出它們，現行 `salaryFor:2687` 與 `D/salary-market-data.js MARKET_BASELINES:1` 是程式證據，是否將完整表移入正本屬AUD-04/AUD-02後續。沒有拿封存舊表強行當期待值。表內跨聯盟CPBL cap與同聯盟salary curve cap的用途不同，並非發現政策衝突。

## 3. 狀態 S 讀寫地圖

所有以下位置都指G，另列政策模組。AST列出1729個直接 `S.*`／`state.*` 存取語法點；不是1729個不同欄位，也不是執行次數。`s.*`、`a=S.ab`、`contract`参数、閉包與返回新物件需以下人工追蹤，不能用此數字宣稱完整動態寫集。

| 主要欄位群 | 初始化／補完 | 主要讀取 | 主要寫入／生命週期與風險 |
|---|---|---|---|
| seed/version/rngState | startJapanese:3087→seedInit:2682→newState:2793 | replayURL、R:2683、分享 | R同步`S.rngState`與`_s`；初始boot S僅rngState。不能把UI crypto seed混入生涯R |
| name/pos/role/dpos、ab/pot | newState:2794–2798；phasePre選role | ovr:357、dpScore:67、simSeason:422、VM:614 | addAb:395、eventApply、傷病衰退、allocUI:676；不同cost門檻是核准不同來源，不合併 |
| carry/lastOverflow、pool | carry懶初始化addAb:398；pool newState:2799 | abCost、allocUI、phaseEnd、intl | allocUI閉包pool/idx/history不在S；Undo缺key→0；reset完整copycarry；allocDone:1058確定後才判特性 |
| year/age/stage/stageYr/lv/org | newState:2798、setAmateur:2828 | 所有年度、事件、contract候選 | advance:1952由2791包裝；signTo:2812；movement1514/3076；日曆與contract startYear須同批檢驗 |
| orgTeamId/team/schoolId/tier | newState:2798 | teamName getter、teamMaster、cup/draft/contract | signTo、doTradeExec:2815、setAmateur；orgTeam非enumerable setter把名稱映ID，不可當兩個獨立狀態 |
| ct／annualSchedule／segments | newState ct=null；fixedContract:2810→createContract:12 | salaryDue、續約、VM/詳細、buyout | markSalaryPaid替換ct；extend/transfer返回clone。signTo在fixedContract之前改org/lv/team：例外可留下部分變更，F03需驗證 |
| currentSalary／lastSalaryPaidYear | newState:2799；migration2694/2698 | candidate2714、header、年度支付 | signTo、applyLevelSalary:2751、finalizePending:2739、phaseEnd:3074；當前／未付下期額與當年paid額不同，不強行相等 |
| salaryEvaluationHistory/lastSalaryEvaluation | newState:2799；migration | currentMarketResult:2706、injury/FA | recordSalaryEvaluation:2774，append近3；IND fallback2784，勿補造個人成績 |
| salaryDecisionHistory/lastSalaryDecision | newState:2799／migration | buildCareerViewModel:617、salaryDetail | saveSalaryDecision:2728；append無上限，同salaryYear/decisionType去重，延續無新決定 |
| contractSequence/signingPayments、americanContractSigned | newState:2799；migrate2698 | candidate初次US、signing付款guard | nextContractId:2809＋applySigningPayment:21；被動normalize不領錢，重新生成contractId不能假裝同一約 |
| careerEarnings/BaseSalary/SigningBonus/DevelopmentStipend/Incentive/Buyout、corpIncome | newState:2799、migration2698 | 所得VM、shareImage、salary別名 | phaseEnd薪資/企業薪資、signingPayment、incentive、buyoutRemaining:1610、event收入分開；`salary` accessor實際是careerEarnings，不是年俸 |
| careerOutsideIncome/yearOutsideIncome、incomeLedger | ensureEventState:4 | result、phaseEnd／careerIncome | event apply一次；resetEventYear:53只清年收入／pend；不能以收入重繪再記帳 |
| serviceTime/npbRosterDays/npbFaSeasons/accruedYear、foreignFirstTeamYears | newState:2799；migrateV130 | FA/control、USexemption、posting | movement:3076；NPB roster145天換1季、MLB一軍factor≥.5；豁免與FA、goldcloth年資不能共用 |
| firstTeamSeasons/firstTeamYearsByTeam、teamTally/teamYears | newState:2798、2804 | goldcloth、franchise、稱號 | recordFirstTeamSeason:37，年度球團去重；混合舊teamTally不得補算阪神一軍年資 |
| stats/statsByLevel/log、lastStat/lastD | newState:2799 | record/career/HOF、薪資、champ快照 | proSeason:1227→accStat560/accLevelStat568→年度log；交易分割只同st；DOM divider:626移除舊畫面block不刪S.log |
| seasonFactor/skipMid/rehab/injNext/tmpInj/bigInj/tj | phasePre725、newState2799 | condition VM、eligibility、成績、薪資injury | rollInjury1174、resolveTJ289、injStatLoss1195；全休仍phaseEnd/pay，不能以rehab0判沒全休 |
| traits/removed/counters、oldGhostPending/Used、tripleCrownHistory | newState2799/2803/2804、ensureEventState | event snapshot、sim、awards、label、HOF | resolveEvent1051、checkTraits1084、awardTraitUnlocks55、endGame2103；遞延效果與當次snapshot順序不可交換 |
| eventYear/drawn IDs/sequence/pending/results/pendStat/eventSeasonContext | ensureEventState4、resetEventYear53 | drawEvents846、renderEvent1037、beginSeason | beginEvent13→applyEvent26；resolved是行動guard，年度抽卡guard不同。完整結果字典可能增長但生涯長度有限，不無證據加裁切 |
| domesticTournamentLog/Stats/completedKeys/senbatsuEligibleYear | newState2798/2799 | HOF、cup資格、稱號 | cupOnce2864、qualifier2874、amateurSeason2881；同key不能再次抽R或加點 |
| intlCompletedKeys/Count/FinalCount/Stat/TraitResults/dispatch | newState2799/2805、normalizeInternationalState7 | PRE/POST召集、HOF、intl trait | processIntlPhase2922→validate→rank/stat on copy→prepare30→commit36；completedKey後不二次消耗 |
| seasonChampContext/results/wonChamp/champTeam/champThisTeam | newState2805／normalizeChampionshipState12 | HOF、franchise、board | captureSeasonChampionship33在proSeason特定點；settle51年度去重；轉隊清currentTeam旗但不可換已定快照 |
| tradeRefuse/tradeHeat/complainCount/demotionRefused | newState2799 | chance、market、champ chance | movement拒絕／檢查；maintainSeasonEnd66只一次refuse−1/heat−5。快照取維護前值 |
| love／exes／kids | newState2799 | confidante、disc、事件 | loveEvent867，checked snapshot／exes缺值處理需保留；不能用整理資料重判已取得稱號 |
| done/hofInfo/legendLeague／removed | done=false newState2799；退休懶新增 | endGame、traitLabel、shareImage | endGame2103＋wrapper3079，首輪league判定；未退休不能先算票或快取HOF |

不在S但決定正確性的閉包：`stepQ:228`、`choiceGeneration/activeChoiceToken:663`、`pendingOffseasonSalary:2693`、`npbReturnOfferContext:2971`、`seasonEndContext:3059`、navigation.uiState:5、allocUI hist/idx/touched:678–683。以純S snapshot判斷重入是否相同不足，需同時比選擇DOM、token、待執行queue與R序列。

## 4. RNG 盤點與不可交換順序

AST共有196個**語法呼叫點**，包含被覆寫歷史定義、條件分支與注入的random；不是每人生196次。`Math.random`未用於現行生涯；`crypto.getRandomValues`只產生新seed，UI hash/team demand不消耗career RNG。間接`N0`與callback消費由下列圖補足。

| 區域／函式與行 | 呼叫／消費條件 | 必須保留的順序、證據與缺口 |
|---|---|---|
| seedInit2682、R2683；ri48/pick49/chance50、N0:56 | FNV seed＋Mulberry32；helpers各R1，N0每次R4 | 可見helpers讀的是**覆寫後R binding**；不能改排序、短路或將N0換正態算法。Q fixed-seed-v160六seed列 |
| newState2794–2797 | 每能力ri、位置額外ri、Fisher-Yates R、各潛在ri、school tier R/pickRecord | 生涯boot S.rngState→建立人物順序固定，不能把學校抽選移到配分後 |
| phasePre725、drawEvents846、loveEvent867、allocDone1058 | training dice／chance，cards既有pick，love分支，多條特性判定有R | Undo/reset只恢復同dice；確定會觸發allocDone，不能「預覽特性」先抽；AUD-03B仍缺全解鎖測試 |
| applyEvent:E/event-state-policy.js26 | 未resolved時chance，再必要pick能力；snapshot之後unlock | begin/display不抽；同年卡排除改pool不增加補抽；resolved返舊結果不重取 |
| simSeason422、applySeasonForm507、proSeason1227、awards1313 | N0/ri/chance與role、effort、injury條件連動 | 最終st共用；0pendStat年度原列維持；三冠保MVP在舊chance列之後 |
| rollInjury1174、resolveTJ289、injStatLoss1195 | 故障／TJ／藥劑與能力抽選依既有短路 | 改成提前抽所有分支會增加R；衰退oldghost僅算值，不額外亂數 |
| cupOnce2864／qualifierOnce2874 | 未完成key才ri(-8,8)，之後純policy | 同key重入0；資格戰0點不等於不消耗原ri |
| processIntlPhase2922／addIntlStats2916 | 選出場後pick rank，再stats ri/R/chance；跳過/已完成不抽 | validate必須在抽選前；hadIntlace當次固定；prepare→commit後才nextStep |
| G proSeason→captureSeasonChampionship；phaseEnd3060→settleChampionship:E51 | eligible年度首次random1；不eligible或已有年度結果0 | capture在賞／薪資評估後、TJ/降格/交易/POST之前；結算使用維護refuse前快照，然後維護、薪資支付 |
| runDraft2833–2836、pickRecord2680 | score ri、條件round ri、選球團、bonus ri | 育成固定290萬仍保留原bonus ri；不能去掉「沒用的抽選」 |
| crossOffers2972／overseasOffer2965 | 通過條件才球團pick及years ri | 當年度局所cache顯示不重抽；expired gate不抽継続NPB球團。year/team/ct identity是cachekey，不改候選順序 |
| faMarket3026→generateBidJitters:E/market-policy.js22 | 選中的team IDs排序後，每報價random1 | demand hash排序不是R；lastFaMarket同key返cache。stay jitter1沒有新R，不能先為全Master抽jitter |
| arbitrationFlow3001 | 只有申請調停choice f才chance1 | 展示球團／中間額0，不提前決定調停輸贏 |
| movement1514→handleDemotion1632／outOfOrg3037 | 升降格、拒絕、年齡eligible分支chance／offer years/teams | LEGACY.movement仍有效；不可刪oldlooking demotion。KBOIF balanced回歸390共同前綴與重跑R一致 |
| endGame2103、retireScene2043、shareImage2315 | 退休票／演出若干ri/R；圖片／設定不取R | HOF直接fixture不等於自然入選率；原首輪和之後票順序不改，DOM讀取不是再跑endGame |

主流程（箭頭是人工確認的執行責務，不是AST名稱匹配全部已scope-resolve）：

```text
startJapanese → seedInit → newState → startYear(2961)
  → resetEventYear → phasePre(725)
  → PRE processIntlPhase → phaseMid(827)
    → drawEvents → beginEvent → choice f → applyEvent → resolveEvent
    → proSeason(1227) → simSeason → form/effort → accStat/level/log
      → awards → recordSalaryEvaluation → captureSeasonChampionship
      → TJ/demotionAudit/trade → POST processIntlPhase
  → phaseEnd(3060) → settleChampionship → maintainSeasonEnd → salary/incentive
    → allocUI（如有pool）→ movement(3076) → LEGACY.movement(1514)
      → extend/renew/FA/cross/demotion/release → advance(2791)
        → finalizePendingOffseasonSalary → 原advance(1952) → startYear
      → endGame(wrapper3079 → LEGACY.endGame2103) → HOF → shareImage

choose(663) → runWithResultView(662) → runChoiceAction(U:10)
  → token/generation/re-entry guard → callback → 新choose保留新listener
navigation/preference/read-only VM ──不得──→ career R／重新執行選擇
```

國際流程、傷病全休及業餘不是總會逐條執行的直線：queue/callback依狀態分支。原AST輸出保留4193個call target／lexical owner、40個模組import edge，可從工具重建；未把同名字串當成動態函式身分。

## 5. 同名覆寫、LEGACY與架構風險

新工具 `scripts/audit-architecture.mjs` 僅讀取Git追蹤的40個docs/src JS，用既有Playwright內附babelParse解析；不執行game，不裝套件，不寫配信資產。991個function node包含nested callback/accessor，不是991個公開API。初始化物件索引為舊64欄／現106欄（不含後續Object.assign、accessor、懶新增欄位）。輸出在ignored test-results，不作PASS。

| 現行同名binding | 舊定義 → 現行定義行號 | 關係／結論 |
|---|---|---|
| seedInit／R／newState／salaryFor | 46→2682／47→2683／229→2793／594→2687 | 舊語法保留、現行assignment生效；R helpers引用可變binding |
| board／stageLabel／startYear | 627→2826／717→2825／723→2961 | board刻意委派舊board；不能整段刪除 |
| teamChampRate／doTradeExec／amateurSeason／maybeIntl | 1096→2686／1161→2815／1207→2881／1431→2959 | championship不使用team hash；maybeIntl是PRE/POST入口，並非移除國際 |
| phaseEnd／movement／advance／endGame | 1483→3060／1514→3076／1952→2791／2103→3079 | movement/endGame保留原函式參照；advanceWithoutSalaryFinalization也是原advance保存別名 |
| salary hooks | 1506–1512→2763/2764/2765/2738/2774/2784/2768 | 原no-op換成真實policy adapter；舊movement呼叫會讀新binding |
| daibaFarewell／outOfOrg／teamListOf／signTo | 1625→2963／1683→3037／1695→2685／1696→2812 | 新signTo schema3/ID/收入；把舊closure誤接新API可能格式不一致 |
| faFlow／faMarket／crossOffers／runDraft／pathChoiceHS／pathChoiceU4 | 1763→3006／1789→3026／1848→2972／1873→2833／1907→2840／1927→2862 | 舊宣告非自動可删證據；需排除capture、callback和全路線再驗證 |

上述32個頂層binding覆寫群組是人工區分scope後的清單。AST亦列出afterAsk/go/est/accept/get/set等重名：其中多是不同區域的合法局部函式／accessor，**不是32之外又新增一批覆寫Bug**。

LEGACY在G:2648捕獲board、movement、phasePre、phaseMid、proSeason、endGame。實際有 `LEGACY.board:2826`、`LEGACY.movement:3076`、`legacyEndGame:3078/3079`；phasePre/phaseMid/proSeason雖未使用該property，原binding直接可達，不得視為函式失效。

`makeOffers:1716`／`pickOfferUI:1707`：目前可見直接引用集中在已被覆寫的舊faMarket/crossOffers。舊pickOfferUI直接加careerEarnings且team參數是舊名稱形式，而現signTo要Master ID；若未來意外重新接通會有收入／格式風險。**靜態引用位置＋覆寫關係只形成「疑似非現行入口」結論，不是允許刪除**。市場區同時含仍活的termParams1723→termChoice1734→extensionOffer1751→appendContractExtension2768；保留LEGACY.movement的延長流程會用它們，不能把市場區整段刪除。extension推定顯示用salaryFor而非完整candidate，是否與成立額在特定倍率／傷病下不同尚缺專用DOM fixture；先不宣稱新薪資Bug。

LV/PATHS/ABL/LGN/TIER_TH在2650–2663以Object.assign就地補覆寫，Master在2665產生；原Object常量／舊球團名陣列與新Master/ID共存。不能用全域搜尋無新引用就移除舊常數：需先判每個活舊函式讀取哪一組。一般addAb／abCost與eventAbilityCost看似重複但門檻55/60/66和50/58/66不同，是分路核准規格，不可套用DRY把遊戲政策合併。

| 發現 | 優先級／決策 | 證據、影響與後續 |
|---|---|---|
| F01 carry缺key撤銷後變0 | P1／必須釐清（任何程式修正另批准） | allocUI695/703及既有AUD-03B。嚴格物件復原不一致；數值、UI無證據錯誤。先以原生row/Undo/特性/seed fixture確認是否要求刪回原缺key，不升級成P0 |
| F02 年度結算重入guard不對稱 | P1／建議修正前先補證據 | phaseEnd3061只對PRO檢查seasonEndContext，IND有lastSalaryPaidYear throw，CORP3074直接加corpIncome/earnings。直接二次呼叫靜態有重加風險，**未證明正常UI可達**；新增STATE-TRANSACTION-AUDIT-01，不改遊戲 |
| F03 失敗不回滾S，後續重試可能不同 | P1／建議修正前先補證據 | signTo2812先改org/lv/team才fixedContract；runChoiceAction U:48–61只恢復DOM/token，不回滾S/R。真floor/cap conflict等若此處throw，可能部分狀態更新。已有測試證正常成功一次，未覆蓋注入失敗後重試；不是確認發生雙付款 |
| F04 活舊流程＋可變binding＋閉包狀態 | P1／建議修正 | 32覆寫、LEGACY、advance alias；AST無scope-resolution，S-only snapshot缺queue/token/cache。重構前必須記錄caller/queue/回調/R trace並固定等價測試，CONTRACT-LEGACY-01保留 |
| F05 正本5個失效本地文件連結 | P2／必須修正文書（另批次） | CURRENT_SPEC157/182/194兩個/342均fs.existsSync=false。event-copy仍從Git歷史資料驗，不能推論原文link可讀。不恢復使用者批准刪除文件；可改為可信歷史Git/正本章節引用，SPEC-SOURCE-LINK-01 |
| F06 aliases與兩種cost／S-lazy schema未集中 | P2／建議修正 | salary→careerEarnings、orgTeam→ID、lazy carry、各policy s/contract writes；AST直接寫集不含全alias。先補schema所有者說明／原生測試，分模組不用重新設計S，不能合併不同cost公式 |
| F07 正本混有歴史驗收措辭 | P3／可以延後 | §1矩陣、§8原PNG、§14/16dev-only與導言main1.11.4，皆能按時間解讀。不是已證政策矛盾；補歷史快照標題／鏈接，不改旧數據 |
| F08 全數值／DOM／互動證據尚未完備 | P1／建議補驗 | §3 OVR守位fallback、§4全日程、§7能力cap/traits、§8設定全視覺、§12全部自然取得、§16原生share等UNVERIFIED。quick PASS不代表全部章節MATCH，AUD-02留未完成 |

問題數以F01–F08唯一發現計：**P0＝0、P1＝5、P2＝2、P3＝1**。這是風險分類，不是8個已重現遊戲Bug。未確認需要更動政策；任何遊戲變更、舊碼刪除、S重設或RNG變更仍需使用者明確批准。

## 6. 本輪實際測試與再現證據

環境：Windows、Node `24.15.0`、既有Playwright `1.62.1`、Chrome `155.0.8059.39`；瀏覽器以本機loopback載入當前遊戲。未新增npm依賴。以下 `<PLAYWRIGHT_MODULE>` 指既有安裝路徑，非個人路徑硬編碼進程式。

```sh
node scripts/test.mjs quick --playwright=<PLAYWRIGHT_MODULE> --output=test-results/stage5-quick
node scripts/audit-architecture.mjs --playwright=<PLAYWRIGHT_MODULE>
```

quick：**44 PASS／0 FAIL／0 SKIP／0 BLOCKED，209.522秒，exit0**。語法9.260秒；ACT fixture93.561秒；Draft quick81.378秒；KBO quick13.726秒。每個入口的實際command、完整HEAD、解析歷史SHA、exitCode、seconds、logSHA保存在 `test-results/stage5-quick/summary.json`，逐入口日誌同目錄。這些輸出是本機ignored artifact，**不會隨dev commit取得**；需重現可用同命令產生。為可追溯，附錄保留44入口、結果和耗時，並在本節記錄關鍵输出。

- ACT：48個P／IF × HS/U/CORP/IND × 正式/育成 × 1280/320/390入團fixture＋6實際pointer案。`k55l221a/P`、`oscuxs1w/IF`各三寬度，listener／結果／next／stale／導航通過；Console／JS/CSS404=0。歷史原始完整路線仍未取得，沒有推翻第二階段限制。Chrome disconnect後profile清理timeout警告存在，不是遊戲console error，入口exit0。
- Draft：18檢查PASS（2個最小付款fixtures＋三尺寸各5個原生正式／育成、自然正式／育成及負面未入團退休檢查＋1個Console/404檢查）；sign/payment/detail、重處理、RNG及未restart皆通過，Console／JS/CSS404=0。原290萬來自育成支度金，前階段已修fixture，本輪不改期待金額。
- KBO：`jp3-infielder-01/IF/--balanced`，404操作、RNG677、2050正常退休；390共同前綴全部S/操作/RNG一致，新版重跑一致。2049原失敗baseline仍可重現：candidate7,360,000円、倍率.92、floor8,000,000、舊package179,980,000、cap215,976,000；現在先套floor正常。三寬度滿期／降格／續約／連打／一次原生付款PASS，Console／JS/CSS404=0。
- `fixed-seed-v160.test`：六seed RNG列及seed-only URL PASS，**不是六條最新完整生涯**。P完整人生／全量S比較採前階段明確歷史證據，未冒稱本轮再執行。未修改遊戲資產且與origin/main無差異。
- AST：40模組／991function nodes／4193call nodes／1729直接state access／196 RNG語法點，exit0。輸出status明寫 `INVENTORY_GENERATED_NOT_TEST_PASS`。G normalized-LF SHA256=`aba53254b2ebdfe8fb81e3a01ad0fa38d9409e9a679df4796336c3342dc98189`；Runner配信fingerprint=`d49c7fd90e884e0f94ad5d43f17fdea05142ba906d233ff0c1c1d7927cd61dae`。
- 工具加入後另以Runner `quick --only=syntax --output=test-results/stage5-syntax-final` 確認：1 PASS／0 FAIL／0 SKIP／0 BLOCKED，11.378秒（入口10.740秒），exit0。這是工具最終構文重驗，不重複計入44個功能入口。AST工具是明示唯讀分析入口，非測試、不加入Runner的自動PASS清單；固定Playwright1.62.1內部parser若日後改版，需重新驗證其可用性。

未執行：full/audit全profile、4000生涯、新一輪Preview全E2E、設定24組合全視覺、OS share sheet實機。原因：本階段唯讀文件／工具，既有quick含必要回歸與瀏覽器；沒有新增引擎差異，不重複前四階段所有E2E。這些未执行不计quick的SKIP，也不改列PASS。提交後僅確認Preview部署狀態，不將之當作遊戲實動驗收。

## 7. 結論、BACKLOG與後續

調查報告／架構索引／分批roadmap已建立；AUD-02與REFACTOR-AUDIT-01維持 `IMPLEMENTED_UNVERIFIED`，注明調查完成但完整數值／動態可達性證明仍缺。調查完成不等於所有規格驗收完成。前四階段10結案保持，新增兩項獨立工作 `STATE-TRANSACTION-AUDIT-01`、`SPEC-SOURCE-LINK-01`，既有AUD-03B／CONTRACT-LEGACY-01等不重建第二ID。正式checkbox重新核算後10完成、30未完成；歷史v1.11.2的38 ID快照不改。

建議先批准能力Undo邊界與年度／簽約失敗狀態原生補驗，再整理正本文書引用；之後才考慮純VM抽離。詳細批次、工量與門檻見 [STAGE5_REFACTOR_ROADMAP.md](STAGE5_REFACTOR_ROADMAP.md)。不直接進入第六階段、不自動實作重構。VERSION／CHANGELOG／main／正式站／部署設定不變。

## 附錄 A：本輪 quick 逐入口結果

每行是Runner入口，不是內部case數；time為秒，均exit0。

| 入口 | 結果 | 秒 | exit |
|---|---|---:|---:|
| syntax | PASS | 9.260 | 0 |
| ability-allocation.test | PASS | 0.096 | 0 |
| arbitration-policy.test | PASS | 0.112 | 0 |
| bug-act-01-02-e2e | PASS | 93.561 | 0 |
| career-movement-policy | PASS | 0.160 | 0 |
| championship-intl.test | PASS | 0.977 | 0 |
| choice-action.test | PASS | 0.140 | 0 |
| contract-policy.test | PASS | 0.130 | 0 |
| control-period-policy.test | PASS | 0.130 | 0 |
| display-preferences.test | PASS | 0.135 | 0 |
| domestic-tournament-policy | PASS | 0.124 | 0 |
| draft-bonus-display.test | PASS | 0.148 | 0 |
| draft-income-e2e | PASS | 81.378 | 0 |
| draft-signing-policy.test | PASS | 0.098 | 0 |
| event-copy.test | PASS | 0.517 | 0 |
| event-fix.test | PASS | 0.398 | 0 |
| event-integration.test | PASS | 0.126 | 0 |
| event-policy.test | PASS | 0.250 | 0 |
| fa-market-policy.test | PASS | 0.127 | 0 |
| fixed-seed-v160.test | PASS | 0.086 | 0 |
| global-contract-market.test | PASS | 0.141 | 0 |
| hall-of-fame-policy | PASS | 0.082 | 0 |
| hof-first-ballot-league.test | PASS | 0.286 | 0 |
| incentive-policy.test | PASS | 0.094 | 0 |
| information-architecture.test | PASS | 0.081 | 0 |
| injury-market-policy.test | PASS | 0.094 | 0 |
| japanese-copy-contract-ui.test | PASS | 0.096 | 0 |
| kbo-renewal-e2e | PASS | 13.726 | 0 |
| kbo-renewal-floor.test | PASS | 0.118 | 0 |
| npb-return-ui.test | PASS | 0.327 | 0 |
| record-condition-fix.test | PASS | 0.107 | 0 |
| replay-share-theme.test | PASS | 0.090 | 0 |
| retirement-hof-balance.test | PASS | 0.906 | 0 |
| salary-detail-ui.test | PASS | 0.115 | 0 |
| salary-evaluation-policy.test | PASS | 0.103 | 0 |
| salary-explanation-policy.test | PASS | 0.085 | 0 |
| salary-flow.test | PASS | 0.107 | 0 |
| salary-promotion-policy | PASS | 0.087 | 0 |
| salary-promotion-policy.test | PASS | 0.089 | 0 |
| team-demand-policy.test | PASS | 0.102 | 0 |
| test-runner.test | PASS | 1.698 | 0 |
| trait-policy.test | PASS | 0.247 | 0 |
| ui-foundation.test | PASS | 0.089 | 0 |
| verify-modularization | PASS | 0.102 | 0 |

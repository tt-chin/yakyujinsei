# 第3階段：合約與年俸專項驗收

## 1. 基準與結論

- 日期：2026-10-11（JST），repository：`tt-chin/yakyujinsei`，branch：`dev`。
- 開始時 dev／origin/dev HEAD：`37121fbfd967d5dc88f1642ede638fc237805a5d`，VERSION `1.11.3`，工作目錄乾淨。已 fetch，origin/main 為 `421e036bb206a11828a696a4f8b0d3909385441f`（1.10.2）。
- 修復、版本與主要測試提交／Preview受驗程式：`0ea291bca48295b9a534e3c09211533fc509b627`，VERSION **1.11.4**。最終報告提交另由交付訊息列出，避免自引用 SHA。
- **BUG-ACT-03：PASS（下述有限矩陣與自然生涯範圍）。** 未確認新的契約／操作卡死；沒有重寫契約狀態流程。
- **BUG-SAL-01：修復前 FAIL，修復後 PASS（下述範圍）。** 實際確認 MiLB 降格的 NPB一軍／二軍移籍候補漏顯示年俸，已最小修復。
- 本機 381／381，最新 Preview 381／381；最後一輪 Preview 0 Console／pageerror／JavaScript・CSS 404。投手、均衡野手正常退休，前後狀態與 RNG 一致。
- 前兩階段由使用者確認完成，本輪只跑相關回歸；不重新判定歷史 ACT-01／02 原案例。main、正式網站、薪資政策、遊戲平衡、RNG 與 seed-only URL 未変更。
- 已讀 AGENTS、BACKLOG、CURRENT_SPEC、CHANGELOG、BACKLOG_ACCEPTANCE_AUDIT、最新 BUG_ACT_01_02_VERIFICATION，以及現行 HTML、契約／市場／UI程式與相關測試。歷史封存規則不作現行預期。

## 2. 方法、環境與既有測試盤點

Windows／Node 24.15.0／Playwright Chrome channel 155.0.8059.39，headless。PC 1280×844；320×844、390×844 為 mobile／touch 模擬，**不是實機 Safari／Android**。沒有新增 npm 依賴或修改部署設定。

優先沿用以下測試，不重複建立薪資公式或契約模型：

- `contract-policy.test.mjs`：原生 createContract、salaryDueForYear、付款去重、年表缺年、保障、轉隊、延長及升格下限。
- `control-period-policy`、`arbitration-policy`、`fa-market-policy`、`injury-market-policy`、`incentive-policy`、`global-contract-market`、`salary-promotion-policy`：各自的核准制度與邊界。
- `salary-explanation-policy`、`salary-detail-ui`、`salary-flow`：排序／去重／完整決定歷史、年表與顯示來源、候補傳遞。
- `kbo-renewal-floor.test.mjs`／`kbo-renewal-e2e.mjs`：既有10個最小案例、2049年自然重現、原生付款與連打。
- `bug-act-01-02-e2e.mjs --fixtures-only`：24個入團fixture與三尺寸成績按鈕pointer／listener。
- `npb-return-ui.test.mjs`／`npb-return-e2e.mjs --quick`：通常復歸的契約gate／cache／受諾、22條movement相關情境、5種寬度×24表示設定。

新增 `tests/contract-salary-e2e.mjs` 補上既有fixture未真正執行的「原生 advance→下一年開始→phaseEnd支付」及傷病／満期／降格組合。配信程式不加入測試hook；只在本機server或Playwright route的game.js回應注入觀察器。

人工fixture與自然生涯嚴格分開：

- fixture 用真正的 newState／seedInit／createContract／markSalaryPaid，設定受驗邊界，不強制 chance 結果。refresh 使用原生 board，並斷言刷新 RNG0；避免注入後標頭停留在高校狀態。
- salaryCandidate、fixedContract 包裝器只記錄輸入／結果；仍呼叫原函式。startYear 觀察器若 PRO 沒有當年 schedule，直接使測試失敗，**不替遊戲補契約**。
- 完整流程使用原生 movement、crossOffers、signTo、advance、phasePre。單獨付款檢查只暫時阻止付款後的 movement，以隔離當年結算；不代算年俸、不重建契約、不改付款函式。重跑 phaseEnd 時比較完整 S／DOM／RNG，確認沒有第二筆收入。
- 實際受諾使用 Playwright pointer；再對已移除的舊button呼叫兩次callback，斷言沒有重簽、重付、重進年、額外RNG或狀態差。
- 自然生涯完全不注入能力／結果／契約，逐操作記錄年、階層、選擇、RNG次數／state，以及完整JSON狀態的SHA-256。

## 3. 測試矩陣、输入及共同預期

完整矩陣共 **381** 案。附錄列出每案ID及實際截點金額；每案完整 input／before／offer／after／payment、DOM、candidate／fixedContract輸入與 RNG 都由腳本寫入 `os.tmpdir()/yakyujinsei-contract-salary/{local,preview}/all/<ID>.json`。預期不是從 CHANGELOG 的「完成」字樣推定。

### 3.1 狀態／傷病：216案

`state-{P|IF}-{level}-{ACTIVE|FINAL|EXPIRED}-{NORMAL|FULL|REHAB}`

level：NPB1、NPB2、NPB_DEV、MLB、KBO1、KBO2、CPBL1、CPBL2、A3、A2、A1、R。12×2×3×3＝216。

共同fixture：seed `contract-audit`，2032年／25歲，P為SP、IF為SS，能力各項＝該階層最低能力+1，rating 0；当前年俸＝現行 salaryFor(level,0)。契約2031開始，2031已付；ACTIVE為3年、仍有2033保障，FINAL為2年且2032未付，EXPIRED為2年且2032已付。NORMAL稼働1；FULL稼働0／MAJOR；REHAB稼働0、skipMid=true、rehab=1／REHAB。保留一筆fixture年度表彰，避免把本組的續約邊界混成成績降格。

操作：ACTIVE／FINAL→原生phaseEnd；EXPIRED→原生movement；有残留選項則pointer受諾。所有案例進2033後再真正支付一次、重入一次。

預期與實際均 PASS：

- 只推進1年、startYear只有1次；當年有有效未付schedule及可操作選項。
- ACTIVE保留contractId、endYear及2033保障額，不造薪資決定。
- FINAL／EXPIRED重新簽約一次，lastSalaryDecision適用2033，決定額＝ct.annualSalary＝currentSalary＝2033年表。
- 当年2032原生應付只付一次；EXPIRED不会再付2032。签约时2033年表仍為「予定」，不算已经支付。
- 2033付款增加careerBaseSalary恰好一笔schedule金额；careerEarnings增加此额＋真正出来高，重复付款／历史追加／RNG均0。
- FULL／REHAB不削减既有多年保障。

### 3.2 降格×傷病×満期：96案

`demotion-{P|IF}-{level}-{ACTIVE|EXPIRED}-{NORMAL|FULL|REHAB}`

8組來源／能力：NPB1/50、NPB2/40、KBO1/40、CPBL1/40、A3/49、A2/45、A1/41、MLB/54。共8×2×2×3＝96。2032已付、无表彰、rating −3；其餘同上。使用原生handleDemotion，出现降格受諾则点击该原选择。

預期與實際 PASS：有效契約保留同ID、所有既有年表金额和期限；満了契約按当前下位階層续约后才能进2033。全休／復健也有下一个操作，原生下一年付款只发生1次；不会把未来年俸加入当年固定所得。

本組直接驗證處理函式的有效輸入，不宣稱全休自然movement必然走降格；自然全休的skipMid分支已由3.1及完整生涯覆蓋。

### 3.3 升格：8案

NPB_DEV→NPB2→NPB1、KBO2→KBO1、CPBL2→CPBL1、R→A1→A2→A3→MLB（相邻各一案）。2032已付、原2033保障未付。

原生applyPromotionSalary→画面查看→advance→2033付款。PASS：不替换ID／期限、已付年不改、未付年只依现行最低額向上调；年度明細／所得显示一致，下一年实际支付匹配年表。

### 3.4 候補受諾／重新签約：30案

- MiLB A3降格→NPB1（能力54）／NPB2（能力50）：2案，详第4节。
- NPB2（能力45）降格→CPBL1提示／受諾／次年支付：1案。
- MLB、KBO1/2、CPBL1/2、A3/A2/A1/R→NPB復帰：9案；NPB1→KBO、CPBL、美国：3案。均2032満了，能力65、rating3，原生crossOffers资格與候选，不添加不存在的offer。赴美首次資格受限時依现行規則实际取得R契约，不误当MLB。
- 戦力外→再契約15案：NPB2來源，2032已付且还有2033保障，24歲；能力30→实际NPB育成；35→KBO2／CPBL2；39→R／KBO2／CPBL2；43→A1／KBO2／CPBL2；47→A2／KBO1／CPBL1；54→A3／KBO1／CPBL1。先观察native排序／top4实际候选，再从相同fixture重播每个受諾；不扩大候选数。

PASS：提示額＝正式年俸＝決定記錄＝下一年年表，按同年度核对；buyout與固定年俸分别记账，不把买断或次年予定當当年薪资。受諾旧DOM再入不改变S／RNG；下一年真正付款与年表一致。

### 3.5 延长／FA／退休：20案

- NPB1／MLB／KBO1／CPBL1 ×接受短期延长／拒绝延长：8案。有效2033保障、能力65、rating3。原生extensionOffer，选短期或拒绝，再按原生后续必要的残留完成操作。延长段2034起，原三年年表不变；拒绝不造新薪资決定。2033仍支付原保障額。显示「推定」的termChoice预估不是已成立contract或当年支付，未擅自改预估公式。
- 同4來源 ×FA接受市场offer／宣言残留：8案。2032已満了、能力65、rating4；fixture明确赋予相应OVERSEAS资格并用原生faMarket，而非宣称自然FA资格已全样本验完。候选金额、保证总额、signTo、ct、决定位年、当年/次年付款匹配。
- 同4來源戦力外→「現役を退く」：4案，35歲／能力50。原生outOfOrg先结算买断，然后点击退休。没有新的薪资支付或年度advance；重复旧点击无效。

### 3.6 自然生涯2案与三尺寸UI9案

- `yakyo-test-001`／P／first-row策略；`jp3-infielder-01`／IF／balanced策略。每组旧版1次、新版2次，6次完整生涯（本机／Preview各一轮6次）。詳第6節。
- 1280／320／390px × CPBL1復帰／MiLB降格NPB1／NPB2＝9案。真实pointer受諾、舊listener再入、所得／年度別年俸／salaryDecisionHistory查看、原生支付／重复支付、橫向溢出、截图与Console／404检查。PASS。最后fixture刷新标头后重跑整轮Preview；不是用旧高校标头截图证明合约金额。

### 3.7 N/A與未驗證的区别

- NPB育成「一军→二军」之外的不存在階層、KBO／CPBL的NPB育成制度、MiLB独立於MLB的FA年資制度：**N/A**，不得套用他聯盟制度。
- R／NPB_DEV等組織最低階層没有更下方職業level；不做假的同组织降格案例，其戦力外／再契約实际候选另验。
- MLB→MiLB是原生美国組織路徑，但MiLB年资不能当MLB年资。没有修改现行分類或服务年资算法。
- 本矩陣FA fixture只驗已具資格后的市場／合約；不是所有自然資格累積及全部球隊投標组合的证明。
- 不把尚未走到的制度／全seed／実機标PASS；具体限制见第8节。

## 4. 首次失敗、根因與最小修復

### 重現證據

`node tests/contract-salary-e2e.mjs --only=demotion-offers --baseline=37121fbfd967d5dc88f1642ede638fc237805a5d --playwright=<PLAYWRIGHT_MODULE>`

同一最小测试在旧版结果：**0 PASS／2 FAIL**、4.467秒；两案均 `NPB demotion offer omits salary`。没有Console异常；是确定的UI资料漏传，不是工资上限冲突。

步骤：seed `contract-audit`，P／SP；注入2032年、25歲、MiLB A3、当前10,000,000円、2031～2033的3年契约（2031/2032已付，2033保障未付）、rating0、正常健康、无表彰，各能力54或50；呼叫原生handleDemotion(54/50)。**这是受控fixture，不冒称该seed自然人生在此年发生同一事件。**

旧 DOM：

- 「NPB一軍への移籍」＋「NPB移籍契約」，没有年俸。
- 「日本の二軍（支配下）へ移籍」，没有副标题或年俸。

根因：`docs/src/engine/game.js:1632 handleDemotion` 的两个MiLB分支仍直接 `signTo('NPB','NPB1/2')`，没有在建候补时获取salaryCandidate；通常crossOffers的後段override不会覆盖这条仍可达的旧函数。原本接受后才计算年俸，故卡片没有可显示快照。

### 修改及不变范围

两分支仅新增既有salaryCandidate快照：sourceLevel为当时S.lv，targetLevel为NPB1或NPB2，contractMult仍1；副标题加入既有fmtMoney金额。受諾buyout后把同一annualSalary／candidate传signTo。

**不改**概率／chance顺序、team抽选时点、候选数量顺序、默认2年、买断规则、保障、台湾替代offer及降格接受分支。没改salaryCandidate／fixedContract公式或政策，无新状态结构／存档，没删除可达／不可达旧代码。

實際確認：

- NPB1：提示1,600万円＝ct/currentSalary/decision/2033年表16,000,000円。
- NPB2：提示734万円＝上述各源7,340,000円；sourceRating0→convertedRating4、market6,200,000円、previousSalary anchor10,000,000円、routeWeight0.7、routeMultiplier1，使用既有政策。
- 两案同旧版：fixture初始化15次RNG→提示16（原chance1次）→受諾17（原team抽选1次）；candidate包装记录callsBefore＝callsAfter＝16。**显示新增RNG0**。
- 旧新版接受后完整S（只除version）和RNG完全一致；再付2033一次各16,000,000／7,340,000円，第二次不再入帳。
- `npb-return-ui.test.mjs` 原文字恒等断言会拒绝任何handleDemotion改动。本次不是删掉该保护：增加8个VM原函数测试（A3/A2×NPB1/2×降格/转队，含买断清0后快照仍传入），且只容许这两个新增块，其余历史函数／市場／契約仍逐字相同。原生E2E再独立核对真实金额、S及RNG。
- 调整测试格式为现行「億／万円」后明细通过。初始测试错误使用全「万円」产生的失败／modal timeout不当成游戏Bug；没改游戏formatter或数值来迎合测试。

## 5. 指令與实际执行结果

`<PLAYWRIGHT_MODULE>` 指已有运行环境的playwright模块路径，通过CLI传入；未写死环境路径到测试，未安装新依赖。所有次数指该入口报告的case/suite，不把不同层级简单相加为「总assertions」。

- 所有 `tests/*.test.mjs`（34入口）＋verify-modularization、salary-promotion-policy、hall-of-fame-policy、domestic-tournament-policy、career-movement-policy五入口：**39 PASS／0 FAIL**。最后1.11.4再跑10.541秒；每个入口exit0。包含KBO10案及NPB return32案（原24＋新增8）。
- `node --check` 全部docs/src／tests的97份JS/MJS：**97 PASS／0 FAIL**，最终12.161秒；`git diff --check`通过。没有修改测试流程／CI。
- 最小旧版命令如第4节：预期回归失敗2，非修復后FAIL；原始JSON分离在 `baseline/demotion-offers`，不覆寫成成功。
- `node tests/contract-salary-e2e.mjs --playwright=<PLAYWRIGHT_MODULE>`：**381 PASS／0 FAIL**，68.125秒，Console／JS・CSS404 0。这是版本更新前完成游戏修复验收的一轮。
- `node tests/contract-salary-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --playwright=<PLAYWRIGHT_MODULE>`：**381 PASS／0 FAIL**，最終81.746秒，所有47个HTML／JS／CSS先比对相同。最终测试fixture加只读board刷新后整轮重跑；游戏配信内容仍为0ea291b／1.11.4。首轮Preview73.740秒也通过，但不重复计为新case。
- `node tests/kbo-renewal-e2e.mjs --quick --playwright=<PLAYWRIGHT_MODULE>`：本轮开始基准实际PASS，14.030秒；404操作／RNG677／2050正常退休，三宽度契约／连打／原生支付一次通过。修復后的本輪IF自然回歸与37121fb逐步一致，同样跨过2049而无错误；最终KBO10案另通过。**额外再跑该专用Chrome入口的申请被拒绝，未执行，不冒称最终版再跑过该命令。**
- `node tests/bug-act-01-02-e2e.mjs --fixtures-only --playwright=<PLAYWRIGHT_MODULE>`：开始基准实际**24入团＋3 pointer PASS**，36.656秒。最终新增矩阵另验证受諾旧DOM不能二次执行；没有重开前两阶段历史调查。再次batch的首条授权失败，后续ACT命令未启动，未计第二轮。
- `node tests/npb-return-e2e.mjs --quick --playwright=<PLAYWRIGHT_MODULE>`：修復后实际**22原生流程PASS**；1280／320／375／390／430px各24設定PASS，Console／JS・CSS404 0。该脚本未输出总耗时，未杜撰。
- `node tests/npb-return-ui.test.mjs`／`kbo-renewal-floor.test.mjs`／`verify-modularization.mjs`：版本改为1.11.4后重跑通过；版本静态预期同步1.11.4，不改变游戏行为断言。
- 本轮各成功浏览器命令Console／pageerror／JS・CSS404為0。Windows `BROWSER_CLEANUP_WARNING`：Chromium已disconnect，仅临时profile清理超15秒；exit0、不是游戏错误，记录该环境警告。

未运行其他所有E2E／4000生涯等分析入口，**未假称全仓库E2E或全分支覆盖**。旧draft-income测试的历史环境问题不属于本轮修复，不改它。

## 6. 固定Seed／選擇／RNG／状態比較

策略与既有KBO套件相同：先可分配能力行（balanced优先vel/ctl/brk/con/pow/eye/spd并按现值排序；first-row不排序），再配分确认／完成／下一步，再职业志望／选秀／offer／入团按钮，否则第一可用按钮。排除Undo／全reset。旧新版不另选不同路線以制造PASS。

以开始HEAD 37121fb為對照，逐步完整S的digest、年／階層、實際操作序列與RNG完全相同，最後完整S也相同，只排除版號；新版本每條另重跑1次一致。選項記錄使用第一行標題，新增提示年俸副標題是核准UI差異，兩個修復fixture另外比較完整DOM與狀態。

- `yakyo-test-001`／P／first-row：542操作、RNG652、最终rngState1707538286、2058退休。觀察到6個職業年開始（NPB育成5／NPB二軍1）。固定年俸累計39,610,000円、生涯所得173,930,000円、決定歴6筆，前後全同。
- `jp3-infielder-01`／IF／balanced：404操作、RNG677、最终rngState1213562739、2050退休。觀察到18個職業年開始（KBO1 10／KBO2 1／NPB1 2／NPB2 5）。固定年俸累計1,794,860,000円、生涯所得1,852,710,000円、決定歴11筆，前後全同。自然2049KBO2续约正常。
- 所有被觀察職業year start均有当年度有效、未付schedule。此观察断言不替原生流程补签。
- 两条MiLB降格fixture前後保证／契約／收入／能力／选择后RNG同旧版；唯一游戏差异是选项提示与复用已计算快照。
- 完整自然生涯包含真实成绩、契约与收入；相同S验证它们未改变。人工fixture不冒充自然成绩样本。
- 网页查询始终只有`?seed=<SEED>`；不增加rv、rules或固定域名。

## 7. 年俸資料源的對照原則

- salaryCandidate：报价或市场计算结果，生成时观测RNG0；不是已支付收入。
- crossOffers／FA／降格／戦力外：只对native实际存在offer断言提示／受諾金额，不自行添加未达到资格的候选。
- signTo／fixedContract：保证总额／期限／incentive与现行政策一致；签约立刻支付的契約金／支度金，与次年固定年俸分账。不能用careerEarnings在签约时有增长就判定年俸重复付了。
- currentSalary／ct.annualSalary：当前显示的合同基准，可能指下个未付年。多段extension的lastSalaryDecision可能适用2034，当前2033仍按旧segment付款，**不要求不同适用年度的金额无条件相等**。
- annualSchedule／markSalaryPaid：按year区分应付、已付及未来予定；重复phaseEnd不能再改变paidTotal、careerBaseSalary、careerEarnings或决定位年。
- salaryDecisionHistory：只保存真实決定，正常多年延续不造annual決定；按适用年排序、同年度同类型去重／不同类型保留由既有salary-explanation-policy测试实际通过。
- 年俸详细／career年表／所得显示为只读；读取或重绘RNG0、完整S不变。只在相同适用年／同一合同内比较金额，未把扩展段、买断、奖金或スポンサー混进工资。
- 尚无career持久保存；本修复不新增保存，也不回算不存在的旧历史或推测薪资。

## 8. 未驗證範圍與風險

- iPhone Safari／Android Chrome實機：本輪後續由使用者確認驗收OK，來源與限制見第10節，不以Chromium模擬冒充實機。所有seed／年龄／球队投标组合沒有穷举。自然P/IF样本没有MLB/CPBL完整职业段，这两联赛有原生契约fixture、FA／伤病／升降格／付款与UI检验，但不是自然率的样本证明。
- 原始ACT-01／02操作歴、四联赛HOF自然率及4000人生平衡调查：不是本轮范围；不重新打开使用者确认的阶段，也不改既有分析或规则。
- 全部FA无投标／全特性／所有故障组合、legacy可达性全面分析：没有穷举。旧函数保留，仍须未来明确重构授权。
- 初輪GitHub Cloudflare deployment API查询授权被拒绝；後續已補驗成功並取得deployment ID，詳見第10節。**实际配信47资产已确认与受验提交内容相同**，不是只看VERSION；未宣称CDN全节点。
- 浏览器临时profile清理警告如第5节；游戏错误和HTTP404均0。
- 本輪没有需要改薪资政策／最低额／倍率／package cap的問題，未提出未核准政策补丁。

## 9. 交付與版本

**1.11.3→1.11.4，PATCH**：修复既有年俸显示／传递，不增加新制度。

修改：

- `docs/src/engine/game.js`：两条MiLB降格NPB候补salary快照及副标题。
- `docs/src/config.js`：唯一VERSION管理更新1.11.4。
- `tests/contract-salary-e2e.mjs`：381案、原生流程／固定seed、Preview配信比较与完整证据输出；最终补fixture只读标头刷新。
- `tests/npb-return-ui.test.mjs`：新增8例原函数快照传递及原降格选择验证，保留历史不可变保护。
- `tests/verify-modularization.mjs`：同步当前版本静态预期。
- `CURRENT_SPEC.md`：现行版号／第11.9節，描述两条报价快照规则。
- `CHANGELOG.md`：只记「MiLB降格時NPB一軍・二軍オファー年俸表示／提示快照引継」；不记测试或发布状态。
- `BACKLOG.md`：本輪BUG-ACT-03／BUG-SAL-01从未完成栏移除；保留旧调查快照和其他事项，澄清改訂6/7边界。
- 本报告。没有覆盖开始时的使用者修改（开始时clean）。

代码已提交并push到origin/dev。固定Preview：<https://dev.yakyujinsei.pages.dev>。最终文书/fixture整理提交不改配信游戏资产；最终SHA由交付消息附上。main保持上述SHA，**不合并、不正式发布**。

## 10. 未驗證項目補驗（2026-10-11）

本次僅補驗及更新報告，不修改遊戲、測試、VERSION、CHANGELOG或main。基準為dev／origin/dev `d1889ea4edb49e9a94f92e55ce294025b5a2a5c4`，VERSION 1.11.4；fetch後main仍為`421e036bb206a11828a696a4f8b0d3909385441f`。

- **PASS：Cloudflare部署狀態。** GitHub `commits/d1889ea/check-runs` 返回Cloudflare Pages `completed/success`，deployment ID `a4923fca-17ff-4b89-971a-e56e65de46e6`。兩個下列Preview入口各自再次核對47個配信資產與dev提交一致。
- **PASS：Preview報告可取得且內容正確。** `Invoke-WebRequest` 讀取 `/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md` 返回HTTP 200，UTF-8解碼並正規化CRLF後與當時dev報告全文完全相同。這是修改本補驗節之前的d1889ea報告；更新後另確認新提交配信，不將舊內容核對當作新內容證據。
- **PASS：最新1.11.4 KBO專項。** `node tests/kbo-renewal-e2e.mjs --quick --preview=https://dev.yakyujinsei.pages.dev --playwright=<PLAYWRIGHT_MODULE>`，19.841秒，exit0。舊基準仍如預期重現2049錯誤；現行IF balanced完整生涯404次操作、RNG677、2050退休，390步共同前綴狀態／操作／RNG一致，重跑一致。1280／320／390px的到期、降格、續約、連打及原生支付一次全部PASS；Console／JS・CSS404 0。這次實際補跑專用入口，解除第5節記錄的「最終版額外命令未執行」限制，未重新全面調查第一階段。
- **PASS：最新1.11.4 ACT-01／02相關回歸。** `node tests/bug-act-01-02-e2e.mjs --fixtures-only --preview=https://dev.yakyujinsei.pages.dev --playwright=<PLAYWRIGHT_MODULE>`，41.986秒。24個入團fixture（HS／U／CORP／IND×P／IF×1280／320／390px）及3個真實pointer結果／下一步案例PASS，0 FAIL；契約、結果、下一選項、listener、連點防重入通過。Console／JS・CSS404 0。這次不是前輪未啟動的batch，也不宣稱重新取得歷史ACT原始操作路線。
- **PASS（使用者實機驗收回報）：iPhone Safari／Android Chrome。** 使用者在針對這兩項的詢問中回覆「實機驗收結果 OK」。本機`adb devices -l`無連接裝置，也無iPhone遠端實機環境；因此此項依使用者實機確認記錄，並非代理親自執行或Chromium模擬。未提供裝置型號、OS／瀏覽器版本、逐步記錄或截圖，不虛構這些資訊。

自動化環境：Windows／Node 24.15.0／Chrome 155.0.8059.39／既有Playwright，固定Preview URL。輸出證據分別在既有`yakyujinsei-kbo-renewal`及`yakyujinsei-act-audit/preview`暫存資料夾；本節命令無新依賴。先前381案矩陣、39個非瀏覽器入口及97份語法檢查結果保留，不冒稱本次全部重新執行。

仍保留第8節有限样本／未穷举的覆蓋邊界；四聯賽HOF／4000人生與legacy全面可達性分析不是本輪補驗範圍。本次没有新FAIL，無需遊戲修復或版本升級。

## 11. draft-income測試退休停止修正（2026-10-11）

後續：本節當時保留的兩個失敗已有獨立調查與測試設計修正，最新證據見[DRAFT_INCOME_E2E_FIX_AUDIT.md](DRAFT_INCOME_E2E_FIX_AUDIT.md)。以下保留當時結果，不改寫成當時已通過。

依使用者另行要求，僅修改`tests/draft-income-e2e.mjs`的測試流程，不改遊戲／VERSION／CHANGELOG。修正前相同Preview `bonus-ui`／P路線在正常退休後繼續點擊重新開始，實際重現`Execution context was destroyed`。Preview分支沒有像本機完整生涯分支那樣檢查`S.done`；Preview沒有測試state hook，因此改以原生`endGame`建立的`#sh-img`判斷已退休，在選取／點擊任何按鈕之前停止。入團仍優先判斷`新人年俸`；退休前未入團必須回報明確失敗，不能將沒有完成的選秀驗證當成PASS。

- 新增兩個終止判斷fixture：未入團退休、已有入團紀錄退休，均不得點擊restart。
- 新增`--retirement-only`原生退休回歸入口：1280／320／390px三案PASS，確認`S.done=true`，停止判斷前後完整S、RNG、DOM及URL相同；Console／JS・CSS404 0，exit0。只在本機test hook呼叫原生endGame，沒有修改配信遊戲。
- 修正後重跑相同Preview路線：明確回報`Career retired normally before draft signing (seed bonus-ui); no restart clicked`，exit1。原導航錯誤已消失，但此路線仍未到達入團，**不宣稱整份draft-income E2E通過**。
- 本機`--quick`實際執行仍有獨立舊fixture問題：所得斷言`2900000 !== 0`，exit1。本次未修改金額預期、現行支度金／契約金規則，也未跑完整六seed歷史v1.8.0比較；後續應另核對這些舊測試與已批准的新政策。不將這些問題視為本次退休停止修復失敗或已修復。

指令使用既有`--playwright=<PLAYWRIGHT_MODULE>`；沒有新增依賴。語法與`git diff --check`通過。此節補記使用者後續指定的測試修正，不改寫第10節當時僅文書更新的事實。

## 附錄：逐案實際結果

每列引用第3節对应ID的完整输入、原生操作步骤与共同预期。金额为**円**；本表截点为受諾／下一年度开始後、原生支付检查之前（promotion取next；career取退休最终状态）。paid为该截点年表实际值，不是下一年已经入帐。最新決定列是「适用年度／金額」，可与当年金额不同。空值以—表示不存在，不补造。所有列随后按各组要求执行付款／重入／UI或完整生涯断言后才判PASS；原始before／after在对应JSON。

| ID（输入／操作见第3节） | 截点所属／階層 | 年度 | currentSalary | 当年度年表 | paid | 最新決定（年／円） | 結果 |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| `state-P-NPB1-ACTIVE-NORMAL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `state-P-NPB1-ACTIVE-FULL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `state-P-NPB1-ACTIVE-REHAB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `state-P-NPB1-FINAL-NORMAL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-P-NPB1-FINAL-FULL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-P-NPB1-FINAL-REHAB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-P-NPB1-EXPIRED-NORMAL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-P-NPB1-EXPIRED-FULL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-P-NPB1-EXPIRED-REHAB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-P-NPB2-ACTIVE-NORMAL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | — | PASS |
| `state-P-NPB2-ACTIVE-FULL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | — | PASS |
| `state-P-NPB2-ACTIVE-REHAB` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | — | PASS |
| `state-P-NPB2-FINAL-NORMAL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-P-NPB2-FINAL-FULL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-P-NPB2-FINAL-REHAB` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-P-NPB2-EXPIRED-NORMAL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-P-NPB2-EXPIRED-FULL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-P-NPB2-EXPIRED-REHAB` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-P-NPB_DEV-ACTIVE-NORMAL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-P-NPB_DEV-ACTIVE-FULL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-P-NPB_DEV-ACTIVE-REHAB` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-P-NPB_DEV-FINAL-NORMAL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-NPB_DEV-FINAL-FULL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-NPB_DEV-FINAL-REHAB` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-NPB_DEV-EXPIRED-NORMAL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-NPB_DEV-EXPIRED-FULL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-NPB_DEV-EXPIRED-REHAB` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-MLB-ACTIVE-NORMAL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | — | PASS |
| `state-P-MLB-ACTIVE-FULL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | — | PASS |
| `state-P-MLB-ACTIVE-REHAB` | MLB/MLB | 2033 | 120000000 | 120000000 | False | — | PASS |
| `state-P-MLB-FINAL-NORMAL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-P-MLB-FINAL-FULL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-P-MLB-FINAL-REHAB` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-P-MLB-EXPIRED-NORMAL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-P-MLB-EXPIRED-FULL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-P-MLB-EXPIRED-REHAB` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-P-KBO1-ACTIVE-NORMAL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `state-P-KBO1-ACTIVE-FULL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `state-P-KBO1-ACTIVE-REHAB` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `state-P-KBO1-FINAL-NORMAL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-P-KBO1-FINAL-FULL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-P-KBO1-FINAL-REHAB` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-P-KBO1-EXPIRED-NORMAL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-P-KBO1-EXPIRED-FULL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-P-KBO1-EXPIRED-REHAB` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-P-KBO2-ACTIVE-NORMAL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | — | PASS |
| `state-P-KBO2-ACTIVE-FULL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | — | PASS |
| `state-P-KBO2-ACTIVE-REHAB` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | — | PASS |
| `state-P-KBO2-FINAL-NORMAL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-P-KBO2-FINAL-FULL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-P-KBO2-FINAL-REHAB` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-P-KBO2-EXPIRED-NORMAL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-P-KBO2-EXPIRED-FULL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-P-KBO2-EXPIRED-REHAB` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-P-CPBL1-ACTIVE-NORMAL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `state-P-CPBL1-ACTIVE-FULL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `state-P-CPBL1-ACTIVE-REHAB` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `state-P-CPBL1-FINAL-NORMAL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-P-CPBL1-FINAL-FULL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-P-CPBL1-FINAL-REHAB` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-P-CPBL1-EXPIRED-NORMAL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-P-CPBL1-EXPIRED-FULL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-P-CPBL1-EXPIRED-REHAB` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-P-CPBL2-ACTIVE-NORMAL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-P-CPBL2-ACTIVE-FULL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-P-CPBL2-ACTIVE-REHAB` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-P-CPBL2-FINAL-NORMAL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-CPBL2-FINAL-FULL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-CPBL2-FINAL-REHAB` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-CPBL2-EXPIRED-NORMAL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-CPBL2-EXPIRED-FULL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-CPBL2-EXPIRED-REHAB` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-A3-ACTIVE-NORMAL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `state-P-A3-ACTIVE-FULL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `state-P-A3-ACTIVE-REHAB` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `state-P-A3-FINAL-NORMAL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-P-A3-FINAL-FULL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-P-A3-FINAL-REHAB` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-P-A3-EXPIRED-NORMAL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-P-A3-EXPIRED-FULL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-P-A3-EXPIRED-REHAB` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-P-A2-ACTIVE-NORMAL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `state-P-A2-ACTIVE-FULL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `state-P-A2-ACTIVE-REHAB` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `state-P-A2-FINAL-NORMAL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-P-A2-FINAL-FULL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-P-A2-FINAL-REHAB` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-P-A2-EXPIRED-NORMAL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-P-A2-EXPIRED-FULL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-P-A2-EXPIRED-REHAB` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-P-A1-ACTIVE-NORMAL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-P-A1-ACTIVE-FULL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-P-A1-ACTIVE-REHAB` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-P-A1-FINAL-NORMAL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-A1-FINAL-FULL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-A1-FINAL-REHAB` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-A1-EXPIRED-NORMAL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-A1-EXPIRED-FULL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-A1-EXPIRED-REHAB` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-P-R-ACTIVE-NORMAL` | MiLB/R | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-P-R-ACTIVE-FULL` | MiLB/R | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-P-R-ACTIVE-REHAB` | MiLB/R | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-P-R-FINAL-NORMAL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-R-FINAL-FULL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-R-FINAL-REHAB` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-R-EXPIRED-NORMAL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-R-EXPIRED-FULL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-P-R-EXPIRED-REHAB` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-IF-NPB1-ACTIVE-NORMAL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `state-IF-NPB1-ACTIVE-FULL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `state-IF-NPB1-ACTIVE-REHAB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `state-IF-NPB1-FINAL-NORMAL` | NPB/NPB1 | 2033 | 16740000 | 16740000 | False | 2033/16740000 | PASS |
| `state-IF-NPB1-FINAL-FULL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-IF-NPB1-FINAL-REHAB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-IF-NPB1-EXPIRED-NORMAL` | NPB/NPB1 | 2033 | 16740000 | 16740000 | False | 2033/16740000 | PASS |
| `state-IF-NPB1-EXPIRED-FULL` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-IF-NPB1-EXPIRED-REHAB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `state-IF-NPB2-ACTIVE-NORMAL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | — | PASS |
| `state-IF-NPB2-ACTIVE-FULL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | — | PASS |
| `state-IF-NPB2-ACTIVE-REHAB` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | — | PASS |
| `state-IF-NPB2-FINAL-NORMAL` | NPB/NPB2 | 2033 | 5230000 | 5230000 | False | 2033/5230000 | PASS |
| `state-IF-NPB2-FINAL-FULL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-IF-NPB2-FINAL-REHAB` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-IF-NPB2-EXPIRED-NORMAL` | NPB/NPB2 | 2033 | 5230000 | 5230000 | False | 2033/5230000 | PASS |
| `state-IF-NPB2-EXPIRED-FULL` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-IF-NPB2-EXPIRED-REHAB` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `state-IF-NPB_DEV-ACTIVE-NORMAL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-IF-NPB_DEV-ACTIVE-FULL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-IF-NPB_DEV-ACTIVE-REHAB` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-IF-NPB_DEV-FINAL-NORMAL` | NPB/NPB_DEV | 2033 | 3140000 | 3140000 | False | 2033/3140000 | PASS |
| `state-IF-NPB_DEV-FINAL-FULL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-IF-NPB_DEV-FINAL-REHAB` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-IF-NPB_DEV-EXPIRED-NORMAL` | NPB/NPB_DEV | 2033 | 3140000 | 3140000 | False | 2033/3140000 | PASS |
| `state-IF-NPB_DEV-EXPIRED-FULL` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-IF-NPB_DEV-EXPIRED-REHAB` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-IF-MLB-ACTIVE-NORMAL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | — | PASS |
| `state-IF-MLB-ACTIVE-FULL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | — | PASS |
| `state-IF-MLB-ACTIVE-REHAB` | MLB/MLB | 2033 | 120000000 | 120000000 | False | — | PASS |
| `state-IF-MLB-FINAL-NORMAL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-IF-MLB-FINAL-FULL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-IF-MLB-FINAL-REHAB` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-IF-MLB-EXPIRED-NORMAL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-IF-MLB-EXPIRED-FULL` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-IF-MLB-EXPIRED-REHAB` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `state-IF-KBO1-ACTIVE-NORMAL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `state-IF-KBO1-ACTIVE-FULL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `state-IF-KBO1-ACTIVE-REHAB` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `state-IF-KBO1-FINAL-NORMAL` | KBO/KBO1 | 2033 | 41860000 | 41860000 | False | 2033/41860000 | PASS |
| `state-IF-KBO1-FINAL-FULL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-IF-KBO1-FINAL-REHAB` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-IF-KBO1-EXPIRED-NORMAL` | KBO/KBO1 | 2033 | 41860000 | 41860000 | False | 2033/41860000 | PASS |
| `state-IF-KBO1-EXPIRED-FULL` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-IF-KBO1-EXPIRED-REHAB` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `state-IF-KBO2-ACTIVE-NORMAL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | — | PASS |
| `state-IF-KBO2-ACTIVE-FULL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | — | PASS |
| `state-IF-KBO2-ACTIVE-REHAB` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | — | PASS |
| `state-IF-KBO2-FINAL-NORMAL` | KBO/KBO2 | 2033 | 8370000 | 8370000 | False | 2033/8370000 | PASS |
| `state-IF-KBO2-FINAL-FULL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-IF-KBO2-FINAL-REHAB` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-IF-KBO2-EXPIRED-NORMAL` | KBO/KBO2 | 2033 | 8370000 | 8370000 | False | 2033/8370000 | PASS |
| `state-IF-KBO2-EXPIRED-FULL` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-IF-KBO2-EXPIRED-REHAB` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `state-IF-CPBL1-ACTIVE-NORMAL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `state-IF-CPBL1-ACTIVE-FULL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `state-IF-CPBL1-ACTIVE-REHAB` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `state-IF-CPBL1-FINAL-NORMAL` | CPBL/CPBL1 | 2033 | 12560000 | 12560000 | False | 2033/12560000 | PASS |
| `state-IF-CPBL1-FINAL-FULL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-IF-CPBL1-FINAL-REHAB` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-IF-CPBL1-EXPIRED-NORMAL` | CPBL/CPBL1 | 2033 | 12560000 | 12560000 | False | 2033/12560000 | PASS |
| `state-IF-CPBL1-EXPIRED-FULL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-IF-CPBL1-EXPIRED-REHAB` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `state-IF-CPBL2-ACTIVE-NORMAL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-IF-CPBL2-ACTIVE-FULL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-IF-CPBL2-ACTIVE-REHAB` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-IF-CPBL2-FINAL-NORMAL` | CPBL/CPBL2 | 2033 | 4190000 | 4190000 | False | 2033/4190000 | PASS |
| `state-IF-CPBL2-FINAL-FULL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-IF-CPBL2-FINAL-REHAB` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-IF-CPBL2-EXPIRED-NORMAL` | CPBL/CPBL2 | 2033 | 4190000 | 4190000 | False | 2033/4190000 | PASS |
| `state-IF-CPBL2-EXPIRED-FULL` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-IF-CPBL2-EXPIRED-REHAB` | CPBL/CPBL2 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-IF-A3-ACTIVE-NORMAL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `state-IF-A3-ACTIVE-FULL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `state-IF-A3-ACTIVE-REHAB` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `state-IF-A3-FINAL-NORMAL` | MiLB/A3 | 2033 | 10470000 | 10470000 | False | 2033/10470000 | PASS |
| `state-IF-A3-FINAL-FULL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-IF-A3-FINAL-REHAB` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-IF-A3-EXPIRED-NORMAL` | MiLB/A3 | 2033 | 10470000 | 10470000 | False | 2033/10470000 | PASS |
| `state-IF-A3-EXPIRED-FULL` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-IF-A3-EXPIRED-REHAB` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `state-IF-A2-ACTIVE-NORMAL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `state-IF-A2-ACTIVE-FULL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `state-IF-A2-ACTIVE-REHAB` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `state-IF-A2-FINAL-NORMAL` | MiLB/A2 | 2033 | 6280000 | 6280000 | False | 2033/6280000 | PASS |
| `state-IF-A2-FINAL-FULL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-IF-A2-FINAL-REHAB` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-IF-A2-EXPIRED-NORMAL` | MiLB/A2 | 2033 | 6280000 | 6280000 | False | 2033/6280000 | PASS |
| `state-IF-A2-EXPIRED-FULL` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-IF-A2-EXPIRED-REHAB` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `state-IF-A1-ACTIVE-NORMAL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-IF-A1-ACTIVE-FULL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-IF-A1-ACTIVE-REHAB` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | — | PASS |
| `state-IF-A1-FINAL-NORMAL` | MiLB/A1 | 2033 | 4190000 | 4190000 | False | 2033/4190000 | PASS |
| `state-IF-A1-FINAL-FULL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-IF-A1-FINAL-REHAB` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-IF-A1-EXPIRED-NORMAL` | MiLB/A1 | 2033 | 4190000 | 4190000 | False | 2033/4190000 | PASS |
| `state-IF-A1-EXPIRED-FULL` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-IF-A1-EXPIRED-REHAB` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `state-IF-R-ACTIVE-NORMAL` | MiLB/R | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-IF-R-ACTIVE-FULL` | MiLB/R | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-IF-R-ACTIVE-REHAB` | MiLB/R | 2033 | 3000000 | 3000000 | False | — | PASS |
| `state-IF-R-FINAL-NORMAL` | MiLB/R | 2033 | 3140000 | 3140000 | False | 2033/3140000 | PASS |
| `state-IF-R-FINAL-FULL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-IF-R-FINAL-REHAB` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-IF-R-EXPIRED-NORMAL` | MiLB/R | 2033 | 3140000 | 3140000 | False | 2033/3140000 | PASS |
| `state-IF-R-EXPIRED-FULL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `state-IF-R-EXPIRED-REHAB` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `milb-demotion-NPB1-display` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `milb-demotion-NPB2-display` | NPB/NPB2 | 2033 | 7340000 | 7340000 | False | 2033/7340000 | PASS |
| `npb2-demotion-cpbl-offer` | CPBL/CPBL1 | 2033 | 12500000 | 12500000 | False | 2033/12500000 | PASS |
| `cross-MLB-NPB` | NPB/NPB1 | 2033 | 58650000 | 58650000 | False | 2033/58650000 | PASS |
| `cross-KBO1-NPB` | NPB/NPB1 | 2033 | 23200000 | 23200000 | False | 2033/23200000 | PASS |
| `cross-KBO2-NPB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `cross-CPBL1-NPB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `cross-CPBL2-NPB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `cross-A3-NPB` | NPB/NPB1 | 2033 | 17000000 | 17000000 | False | 2033/17000000 | PASS |
| `cross-A2-NPB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `cross-A1-NPB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `cross-R-NPB` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `cross-NPB1-KBO` | KBO/KBO1 | 2033 | 48000000 | 48000000 | False | 2033/48000000 | PASS |
| `cross-NPB1-CPBL` | CPBL/CPBL1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `cross-NPB1-MLB` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `release-30-NPB` | NPB/NPB_DEV | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `release-35-KBO` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `release-35-CPBL` | CPBL/CPBL2 | 2033 | 5960000 | 5960000 | False | 2033/5960000 | PASS |
| `release-39-MiLB` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `release-39-KBO` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `release-39-CPBL` | CPBL/CPBL2 | 2033 | 5960000 | 5960000 | False | 2033/5960000 | PASS |
| `release-43-MiLB` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `release-43-KBO` | KBO/KBO2 | 2033 | 8000000 | 8000000 | False | 2033/8000000 | PASS |
| `release-43-CPBL` | CPBL/CPBL2 | 2033 | 5960000 | 5960000 | False | 2033/5960000 | PASS |
| `release-47-MiLB` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `release-47-KBO` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `release-47-CPBL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `release-54-MiLB` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `release-54-KBO` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `release-54-CPBL` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `promotion-NPB_DEV-NPB2` | NPB/NPB2 | 2033 | 5000000 | 5000000 | False | 2033/5000000 | PASS |
| `promotion-NPB2-NPB1` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `promotion-KBO2-KBO1` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `promotion-CPBL2-CPBL1` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `promotion-R-A1` | MiLB/A1 | 2033 | 4000000 | 4000000 | False | 2033/4000000 | PASS |
| `promotion-A1-A2` | MiLB/A2 | 2033 | 6000000 | 6000000 | False | 2033/6000000 | PASS |
| `promotion-A2-A3` | MiLB/A3 | 2033 | 10000000 | 10000000 | False | 2033/10000000 | PASS |
| `promotion-A3-MLB` | MiLB/MLB | 2033 | 120000000 | 120000000 | False | 2033/120000000 | PASS |
| `demotion-P-NPB1-ACTIVE-NORMAL` | NPB/NPB2 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `demotion-P-NPB1-ACTIVE-FULL` | NPB/NPB2 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `demotion-P-NPB1-ACTIVE-REHAB` | NPB/NPB2 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `demotion-P-NPB1-EXPIRED-NORMAL` | NPB/NPB2 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `demotion-P-NPB1-EXPIRED-FULL` | NPB/NPB2 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `demotion-P-NPB1-EXPIRED-REHAB` | NPB/NPB2 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `demotion-IF-NPB1-ACTIVE-NORMAL` | NPB/NPB2 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `demotion-IF-NPB1-ACTIVE-FULL` | NPB/NPB2 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `demotion-IF-NPB1-ACTIVE-REHAB` | NPB/NPB2 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `demotion-IF-NPB1-EXPIRED-NORMAL` | NPB/NPB2 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `demotion-IF-NPB1-EXPIRED-FULL` | NPB/NPB2 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `demotion-IF-NPB1-EXPIRED-REHAB` | NPB/NPB2 | 2033 | 12000000 | 12000000 | False | 2033/12000000 | PASS |
| `demotion-P-NPB2-ACTIVE-NORMAL` | NPB/NPB_DEV | 2033 | 5000000 | 5000000 | False | — | PASS |
| `demotion-P-NPB2-ACTIVE-FULL` | NPB/NPB_DEV | 2033 | 5000000 | 5000000 | False | — | PASS |
| `demotion-P-NPB2-ACTIVE-REHAB` | NPB/NPB_DEV | 2033 | 5000000 | 5000000 | False | — | PASS |
| `demotion-P-NPB2-EXPIRED-NORMAL` | NPB/NPB_DEV | 2033 | 3750000 | 3750000 | False | 2033/3750000 | PASS |
| `demotion-P-NPB2-EXPIRED-FULL` | NPB/NPB_DEV | 2033 | 3750000 | 3750000 | False | 2033/3750000 | PASS |
| `demotion-P-NPB2-EXPIRED-REHAB` | NPB/NPB_DEV | 2033 | 3750000 | 3750000 | False | 2033/3750000 | PASS |
| `demotion-IF-NPB2-ACTIVE-NORMAL` | NPB/NPB_DEV | 2033 | 5000000 | 5000000 | False | — | PASS |
| `demotion-IF-NPB2-ACTIVE-FULL` | NPB/NPB_DEV | 2033 | 5000000 | 5000000 | False | — | PASS |
| `demotion-IF-NPB2-ACTIVE-REHAB` | NPB/NPB_DEV | 2033 | 5000000 | 5000000 | False | — | PASS |
| `demotion-IF-NPB2-EXPIRED-NORMAL` | NPB/NPB_DEV | 2033 | 3750000 | 3750000 | False | 2033/3750000 | PASS |
| `demotion-IF-NPB2-EXPIRED-FULL` | NPB/NPB_DEV | 2033 | 3750000 | 3750000 | False | 2033/3750000 | PASS |
| `demotion-IF-NPB2-EXPIRED-REHAB` | NPB/NPB_DEV | 2033 | 3750000 | 3750000 | False | 2033/3750000 | PASS |
| `demotion-P-KBO1-ACTIVE-NORMAL` | KBO/KBO2 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `demotion-P-KBO1-ACTIVE-FULL` | KBO/KBO2 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `demotion-P-KBO1-ACTIVE-REHAB` | KBO/KBO2 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `demotion-P-KBO1-EXPIRED-NORMAL` | KBO/KBO2 | 2033 | 30000000 | 30000000 | False | 2033/30000000 | PASS |
| `demotion-P-KBO1-EXPIRED-FULL` | KBO/KBO2 | 2033 | 30000000 | 30000000 | False | 2033/30000000 | PASS |
| `demotion-P-KBO1-EXPIRED-REHAB` | KBO/KBO2 | 2033 | 30000000 | 30000000 | False | 2033/30000000 | PASS |
| `demotion-IF-KBO1-ACTIVE-NORMAL` | KBO/KBO2 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `demotion-IF-KBO1-ACTIVE-FULL` | KBO/KBO2 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `demotion-IF-KBO1-ACTIVE-REHAB` | KBO/KBO2 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `demotion-IF-KBO1-EXPIRED-NORMAL` | KBO/KBO2 | 2033 | 30000000 | 30000000 | False | 2033/30000000 | PASS |
| `demotion-IF-KBO1-EXPIRED-FULL` | KBO/KBO2 | 2033 | 30000000 | 30000000 | False | 2033/30000000 | PASS |
| `demotion-IF-KBO1-EXPIRED-REHAB` | KBO/KBO2 | 2033 | 30000000 | 30000000 | False | 2033/30000000 | PASS |
| `demotion-P-CPBL1-ACTIVE-NORMAL` | CPBL/CPBL2 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `demotion-P-CPBL1-ACTIVE-FULL` | CPBL/CPBL2 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `demotion-P-CPBL1-ACTIVE-REHAB` | CPBL/CPBL2 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `demotion-P-CPBL1-EXPIRED-NORMAL` | CPBL/CPBL2 | 2033 | 9000000 | 9000000 | False | 2033/9000000 | PASS |
| `demotion-P-CPBL1-EXPIRED-FULL` | CPBL/CPBL2 | 2033 | 9000000 | 9000000 | False | 2033/9000000 | PASS |
| `demotion-P-CPBL1-EXPIRED-REHAB` | CPBL/CPBL2 | 2033 | 9000000 | 9000000 | False | 2033/9000000 | PASS |
| `demotion-IF-CPBL1-ACTIVE-NORMAL` | CPBL/CPBL2 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `demotion-IF-CPBL1-ACTIVE-FULL` | CPBL/CPBL2 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `demotion-IF-CPBL1-ACTIVE-REHAB` | CPBL/CPBL2 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `demotion-IF-CPBL1-EXPIRED-NORMAL` | CPBL/CPBL2 | 2033 | 9000000 | 9000000 | False | 2033/9000000 | PASS |
| `demotion-IF-CPBL1-EXPIRED-FULL` | CPBL/CPBL2 | 2033 | 9000000 | 9000000 | False | 2033/9000000 | PASS |
| `demotion-IF-CPBL1-EXPIRED-REHAB` | CPBL/CPBL2 | 2033 | 9000000 | 9000000 | False | 2033/9000000 | PASS |
| `demotion-P-A3-ACTIVE-NORMAL` | MiLB/A2 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `demotion-P-A3-ACTIVE-FULL` | MiLB/A2 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `demotion-P-A3-ACTIVE-REHAB` | MiLB/A2 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `demotion-P-A3-EXPIRED-NORMAL` | MiLB/A2 | 2033 | 7500000 | 7500000 | False | 2033/7500000 | PASS |
| `demotion-P-A3-EXPIRED-FULL` | MiLB/A2 | 2033 | 7500000 | 7500000 | False | 2033/7500000 | PASS |
| `demotion-P-A3-EXPIRED-REHAB` | MiLB/A2 | 2033 | 7500000 | 7500000 | False | 2033/7500000 | PASS |
| `demotion-IF-A3-ACTIVE-NORMAL` | MiLB/A2 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `demotion-IF-A3-ACTIVE-FULL` | MiLB/A2 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `demotion-IF-A3-ACTIVE-REHAB` | MiLB/A2 | 2033 | 10000000 | 10000000 | False | — | PASS |
| `demotion-IF-A3-EXPIRED-NORMAL` | MiLB/A2 | 2033 | 7500000 | 7500000 | False | 2033/7500000 | PASS |
| `demotion-IF-A3-EXPIRED-FULL` | MiLB/A2 | 2033 | 7500000 | 7500000 | False | 2033/7500000 | PASS |
| `demotion-IF-A3-EXPIRED-REHAB` | MiLB/A2 | 2033 | 7500000 | 7500000 | False | 2033/7500000 | PASS |
| `demotion-P-A2-ACTIVE-NORMAL` | MiLB/A1 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `demotion-P-A2-ACTIVE-FULL` | MiLB/A1 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `demotion-P-A2-ACTIVE-REHAB` | MiLB/A1 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `demotion-P-A2-EXPIRED-NORMAL` | MiLB/A1 | 2033 | 4500000 | 4500000 | False | 2033/4500000 | PASS |
| `demotion-P-A2-EXPIRED-FULL` | MiLB/A1 | 2033 | 4500000 | 4500000 | False | 2033/4500000 | PASS |
| `demotion-P-A2-EXPIRED-REHAB` | MiLB/A1 | 2033 | 4500000 | 4500000 | False | 2033/4500000 | PASS |
| `demotion-IF-A2-ACTIVE-NORMAL` | MiLB/A1 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `demotion-IF-A2-ACTIVE-FULL` | MiLB/A1 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `demotion-IF-A2-ACTIVE-REHAB` | MiLB/A1 | 2033 | 6000000 | 6000000 | False | — | PASS |
| `demotion-IF-A2-EXPIRED-NORMAL` | MiLB/A1 | 2033 | 4500000 | 4500000 | False | 2033/4500000 | PASS |
| `demotion-IF-A2-EXPIRED-FULL` | MiLB/A1 | 2033 | 4500000 | 4500000 | False | 2033/4500000 | PASS |
| `demotion-IF-A2-EXPIRED-REHAB` | MiLB/A1 | 2033 | 4500000 | 4500000 | False | 2033/4500000 | PASS |
| `demotion-P-A1-ACTIVE-NORMAL` | MiLB/R | 2033 | 4000000 | 4000000 | False | — | PASS |
| `demotion-P-A1-ACTIVE-FULL` | MiLB/R | 2033 | 4000000 | 4000000 | False | — | PASS |
| `demotion-P-A1-ACTIVE-REHAB` | MiLB/R | 2033 | 4000000 | 4000000 | False | — | PASS |
| `demotion-P-A1-EXPIRED-NORMAL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `demotion-P-A1-EXPIRED-FULL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `demotion-P-A1-EXPIRED-REHAB` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `demotion-IF-A1-ACTIVE-NORMAL` | MiLB/R | 2033 | 4000000 | 4000000 | False | — | PASS |
| `demotion-IF-A1-ACTIVE-FULL` | MiLB/R | 2033 | 4000000 | 4000000 | False | — | PASS |
| `demotion-IF-A1-ACTIVE-REHAB` | MiLB/R | 2033 | 4000000 | 4000000 | False | — | PASS |
| `demotion-IF-A1-EXPIRED-NORMAL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `demotion-IF-A1-EXPIRED-FULL` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `demotion-IF-A1-EXPIRED-REHAB` | MiLB/R | 2033 | 3000000 | 3000000 | False | 2033/3000000 | PASS |
| `demotion-P-MLB-ACTIVE-NORMAL` | MLB/A3 | 2033 | 120000000 | 120000000 | False | — | PASS |
| `demotion-P-MLB-ACTIVE-FULL` | MLB/A3 | 2033 | 120000000 | 120000000 | False | — | PASS |
| `demotion-P-MLB-ACTIVE-REHAB` | MLB/A3 | 2033 | 120000000 | 120000000 | False | — | PASS |
| `demotion-P-MLB-EXPIRED-NORMAL` | MLB/A3 | 2033 | 90000000 | 90000000 | False | 2033/90000000 | PASS |
| `demotion-P-MLB-EXPIRED-FULL` | MLB/A3 | 2033 | 90000000 | 90000000 | False | 2033/90000000 | PASS |
| `demotion-P-MLB-EXPIRED-REHAB` | MLB/A3 | 2033 | 90000000 | 90000000 | False | 2033/90000000 | PASS |
| `demotion-IF-MLB-ACTIVE-NORMAL` | MLB/A3 | 2033 | 120000000 | 120000000 | False | — | PASS |
| `demotion-IF-MLB-ACTIVE-FULL` | MLB/A3 | 2033 | 120000000 | 120000000 | False | — | PASS |
| `demotion-IF-MLB-ACTIVE-REHAB` | MLB/A3 | 2033 | 120000000 | 120000000 | False | — | PASS |
| `demotion-IF-MLB-EXPIRED-NORMAL` | MLB/A3 | 2033 | 90000000 | 90000000 | False | 2033/90000000 | PASS |
| `demotion-IF-MLB-EXPIRED-FULL` | MLB/A3 | 2033 | 90000000 | 90000000 | False | 2033/90000000 | PASS |
| `demotion-IF-MLB-EXPIRED-REHAB` | MLB/A3 | 2033 | 90000000 | 90000000 | False | 2033/90000000 | PASS |
| `retire-release-NPB1` | NPB/NPB1 | 2032 | 0 | — | — | — | PASS |
| `retire-release-MLB` | MLB/MLB | 2032 | 0 | — | — | — | PASS |
| `retire-release-KBO1` | KBO/KBO1 | 2032 | 0 | — | — | — | PASS |
| `retire-release-CPBL1` | CPBL/CPBL1 | 2032 | 0 | — | — | — | PASS |
| `extension-NPB1-false` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | — | PASS |
| `extension-NPB1-true` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2034/37520000 | PASS |
| `extension-MLB-false` | MLB/MLB | 2033 | 120000000 | 120000000 | False | — | PASS |
| `extension-MLB-true` | MLB/MLB | 2033 | 120000000 | 120000000 | False | 2034/281400000 | PASS |
| `extension-KBO1-false` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | — | PASS |
| `extension-KBO1-true` | KBO/KBO1 | 2033 | 40000000 | 40000000 | False | 2034/85760000 | PASS |
| `extension-CPBL1-false` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | — | PASS |
| `extension-CPBL1-true` | CPBL/CPBL1 | 2033 | 12000000 | 12000000 | False | 2034/28140000 | PASS |
| `fa-NPB1-false` | CPBL/CPBL1 | 2033 | 40000000 | 40000000 | False | 2033/40000000 | PASS |
| `fa-NPB1-true` | NPB/NPB1 | 2033 | 37040000 | 37040000 | False | 2033/37040000 | PASS |
| `fa-MLB-false` | NPB/NPB1 | 2033 | 76560000 | 76560000 | False | 2033/76560000 | PASS |
| `fa-MLB-true` | MLB/MLB | 2033 | 251370000 | 251370000 | False | 2033/251370000 | PASS |
| `fa-KBO1-false` | NPB/NPB1 | 2033 | 23650000 | 23650000 | False | 2033/23650000 | PASS |
| `fa-KBO1-true` | KBO/KBO1 | 2033 | 83350000 | 83350000 | False | 2033/83350000 | PASS |
| `fa-CPBL1-false` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `fa-CPBL1-true` | CPBL/CPBL1 | 2033 | 25140000 | 25140000 | False | 2033/25140000 | PASS |
| `career-P` | CORP/CORP | 2058 | 0 | — | — | 2034/3000000 | PASS |
| `career-IF` | KBO/KBO2 | 2050 | 126160000 | 126160000 | True | 2050/126160000 | PASS |
| `ui-paid-1280-return` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `ui-paid-1280-NPB1` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `ui-paid-1280-NPB2` | NPB/NPB2 | 2033 | 7340000 | 7340000 | False | 2033/7340000 | PASS |
| `ui-paid-320-return` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `ui-paid-320-NPB1` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `ui-paid-320-NPB2` | NPB/NPB2 | 2033 | 7340000 | 7340000 | False | 2033/7340000 | PASS |
| `ui-paid-390-return` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `ui-paid-390-NPB1` | NPB/NPB1 | 2033 | 16000000 | 16000000 | False | 2033/16000000 | PASS |
| `ui-paid-390-NPB2` | NPB/NPB2 | 2033 | 7340000 | 7340000 | False | 2033/7340000 | PASS |


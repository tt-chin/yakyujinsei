# 1.13.0 文件整理第二階段：技術規格移轉與重複規則分析

> 2026-10-18歷史定位：以下是修改前的66條分析，不是目前仍有33條未移轉的新判定。後續處理見[第二階段移轉結果](DOCUMENT_AUDIT_1130_STAGE2_MIGRATION.md)；舊大型測試證據保留政策已由[精簡摘要](RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)所記後續決定更新。本次只補定位，原分類、數值、風險及未驗證結果保留。

2026-10-16｜ANALYSIS_ONLY / DESIGN_ONLY｜僅新增本報告及[逐條對照JSON](DOCUMENT_AUDIT_1130_STAGE2_CLAUSE_MAP.json)。本報告不是修改授權、刪除白名單、產品驗收或新的正式規格。

## 1. 基準、方法與結論

- 本機 dev HEAD：`650e4dd21718b4abec3876fc9ef6148714c21d4f`；[config](../src/config.js#L1)為1.13.0。讀取本機現行來源，沒有fetch／切換／還原。
- 依[現行導航](../CURRENT_DOCUMENTATION.md)、[CURRENT_SPEC](../../CURRENT_SPEC.md)、[AGENTS](../../AGENTS.md)、[BACKLOG](../../BACKLOG.md)、[整理計畫](DOCUMENT_AUDIT_1130_PLAN.md)及其inventory調查；本輪不重新掃描全部大型JSON。
- 正式部署來源／正式站SHA與Quick61、六組基本Smoke，依[發布驗收](RELEASE_1130_PRODUCTION_ACCEPTANCE.md)。這是既有文件證據，不是本輪重新執行線上或CI驗收。
- Linux Full維持 **NOT_ACCEPTED / DEFERRED**；Run38841657256是18 PASS／1中斷／61未執行，不能寫成19項已完成或80 PASS。ARTIFACT_COVERAGE_BLOCKED獨立維持。
- 工作樹原有5個modified路徑及多個untracked成果全部保護；D2本身是dirty來源，故對照位置以「本輪工作樹」為準，不假裝全部內容已包含於HEAD。

結論：**主要產品數值已移轉，技術契約尚未完整移轉；現在不能刪除或封存移走D2。** 可先做精確引用與狀態分層，避免在CURRENT_SPEC複製另一套可獨立漂移的工程規格。

### 對照統計與邊界

共66個人工選定的條款群組：

- COMPLETE：21，本列規則已具體載入CURRENT_SPEC。
- PARTIAL：33，摘要存在，但缺少執行、身分或失敗邊界等細節。
- UNTRANSFERRED：7，尚未具體載入，仍具唯一技術／驗收價值。
- HISTORICAL_SUPERSEDED：5，已被後續批准或實作狀態取代，不原樣移轉。

這些是**條款群組**，不是D2所有句子、全部assertion或正式風險ID的數量。JSON每列M001～M066只是本報告索引，不取代AF／TR-B／T／F等既有編號。測試矩陣保留原ID整組引用；未宣稱逐個T01～T50／TR01～TR14的log鏈已全部重新核對。該細粒度驗收追溯仍是待辦。

「移轉完整」與「Runtime驗證」為兩個維度。程式及測試存在只提供靜態佐證；本輪所有程式測試均NOT_RUN。既有A／B PASS需保留其SHA、版本、平台與範圍。

## 2. D2逐條移轉結論

完整欄位見JSON：原文件／章節／行號、現行規格對照、程式群組、測試來源、建議及未驗證風險。以下是供審查的優先清單。

### 2.1 已完整移轉：產品規則不必再抄一份

M002～M016涵蓋ID、P01～P08主要資格／曲線／效果與獎金語意；以[CURRENT_SPEC§17](../../CURRENT_SPEC.md#d2-current-spec)為數值正本：

- P01四聯盟B/G及B曲線；P04 NPB12／KBO10與原始勝率。
- P02原ERA/IP槽、P03 SO、P05 CL/SV、P06 MR/HLD，不改造HP。
- P08 IP180＋S3 25/30/25/15/5＋B2＋G95，NPB1/SP基本資格及允許從缺。
- P07同年同聯盟實得三賞、MVP保證／原槽保留、自身不額外疊獎金或HOF。
- 大賞／部門／MVP主要待遇、P08生涯一次phoenix與本年保護。

對應原生producer是[pitcher-award-policy](../src/engine/pitcher-award-policy.js#L12)，原槽與整合在[game awards](../src/engine/game.js#L1393)；測試入口為[pitcher-award-policy test](../../tests/pitcher-award-policy.test.mjs)及[integration test](../../tests/pitcher-award-integration.test.mjs)。**這是靜態定位，不是本輪PASS。**

M036、M048、M051、M053、M055等已涵蓋可信完成、原文保留與不得回溯等特定限制；其餘歷史政策仍缺細節，不能因這幾條已移轉就刪掉整份AF08。

### 2.2 尚具唯一價值：優先移轉為可引用的技術契約

1. **RNG編碼與演算法（M021～M028）**\
   原D2§14.13.1；CURRENT_SPEC§17.4目前只摘要。須保留六欄次序、實際初始化seed、rule IDs、UTF-8長度前綴、1024-byte上限、H1常數、unsigned運算、u分母與嚴格比較、p0/100分支，以及13組golden向量。\
   程式：[canonicalAwardBytes](../src/engine/award-rng-policy.js#L20)、[awardHash32](../src/engine/award-rng-policy.js#L29)、[awardProbabilityHit](../src/engine/award-rng-policy.js#L43)。證據入口：[G2 vectors](../../tools/development-a/g2-vectors.json)、[RNG test](../../tests/award-rng-policy.test.mjs)、[A驗收G2/Safari](PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)。\
   風險：只搬「H1」名稱無法跨語言重建；不能重新生成golden來適配新結果。Safari52只適用原受驗模組，不代表B完整實機UI。

2. **Journal／Receipt所有權及寫入恢復（M029～M036）**\
   原§14.13.2；現§17.4部分摘要。須保留完整key、私有WeakMap、frozen context、原槽記錄原子邊界、Decision原序／完成權限、逐write before/after與presence／參照／衝突處理。\
   程式：[annualAwardTransaction](../src/engine/award-transaction-policy.js#L38)、[captureAwardSlot](../src/engine/award-transaction-policy.js#L53)、[prepareAwardReceipt](../src/engine/award-transaction-policy.js#L64)、[commitAwardReceipt](../src/engine/award-transaction-policy.js#L75)、[completeAwardDecisions](../src/engine/award-transaction-policy.js#L152)。\
   測試：[transaction fixture](../../tests/award-transaction-policy.test.mjs)、[native journal](../../tests/award-journal-native.test.mjs)、[payment receipt](../../tests/season-payment-receipt.test.mjs)、[salary evaluation](../../tests/salary-evaluation-receipt.test.mjs)。\
   風險：設計示意AnnualTx不是可直接複製的現行S schema；clone或JSON等值不能變成可信發獎來源。R→record gap不可安全續行，不能寫成全面崩潰恢復。

3. **年度checkpoint逐狀態契約（M037～M046）**\
   原§14.13.3；現§17.4缺逐階段完成條件。8列checkpoint在JSON分列，須逐列保留進入／完成／重試／停止界線。\
   真實流程：phaseMid → proSeason → awards → 後續原事件 → phaseEnd；不是phaseEnd重新awards。來源：[proSeason](../src/engine/game.js#L1291)、[advance](../src/engine/game.js#L2101)、[settleProfessionalEnd](../src/engine/game.js#L3227)。\
   原生E2E入口：[A runtime](../../tools/development-a/runtime.mjs)含F-A04/A06、F-A07、choice恢復與原S/R比較；證據見[A驗收](PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)。\
   設計checkpoint是契約概念，不保證全部同名產品phase字串；移轉時需加明確對照，不盲改程式名稱。pool/dice/session、舊callback、handoff及NEXT_YEAR_AMBIGUOUS必須保留。

4. **Consumer精確待遇與相容層（M047～M059）**\
   原§14.13.4／14.13.6；現§17.1/17.3只有主要摘要。完整support ID矩陣、phoenix／demotion分離、UNKNOWN與NOT_IN_SCOPE及十條AF08需保留。\
   程式：[awardConsumerEntitlement](../src/engine/award-consumer-policy.js#L11)、[consumerTreatmentView](../src/engine/award-consumer-policy.js#L118)、[hasCurrentAwardEffect](../src/engine/award-consumer-policy.js#L155)。market、fallback、incentive與HOF分別接入各自policy，不由同ID推定同待遇。\
   [legacy consumer test](../../tests/award-legacy-consumer.test.mjs)、[consumer test](../../tests/award-consumer-policy.test.mjs)、[history比較](../../tests/award-history-b-comparison.test.mjs)是證據入口。B後續批准的consumer-only精確舊名稱規則是實作補充，不能全部升格為全域Registry alias或P07來源。\
   風險：歷史最多勝／年度MVP／守備王／出塁王的某consumer待遇不等於新ID、已完成Decision或新保護資格；舊跨league當年度作用不可順便縮小。

5. **驗收案例原文與映射（M060～M066）**\
   T01～T50、TR01～TR14、AN01～AN05、F系列屬測試契約與歷史證據，不適合全部塞入產品規格，但必須有穩定的驗收索引。\
   G3完成Decision fixture＋實際Receipt僅證G3限定交易安全；G6/G7需真producer→Decision→Receipt→consumer。不能把G3 fixture PASS當完整產品PASS。\
   建議另做case→test→log/summary→SHA／平台的索引；本輪沒有逐case重證，故不宣稱所有原Gate已重新驗收。

### 2.3 歷史與後續取代：保留原文，不再作現行入口

- D1→D2比較、早期A/B候選、NPB13勝、IP150/IP190、G100／基本55／舊曲線，保留原分析及研究母體，標HISTORICAL/SUPERSEDED入口。
- §14.3/14.4/14.7候選不能壓過§14.13正式批准契約。
- §14.13各NOT_IMPLEMENTED／NOT_FIXED／NOT_AUTHORIZED與Decision Log AF09等是當時狀態。後續G1-A／A／B及發布報告證明特定工程已執行；**不可把舊NOT_RUN改成當時PASS**，應加時點／範圍索引。
- D2原手機案例仍是1.10.3／q77bi1jx／2039 OFFLINE_ESTIMATE，不因後來發布改成1.13.0自然重播。
- 本輪未發現需要改產品數值的明確矛盾；這不等於完成全部實作正確性稽核。

## 3. AGENTS重複與衝突分析

以下行號均指本輪工作樹的[AGENTS](../../AGENTS.md)。只提出方案，沒有修改。

### A01：第6章與6.1編號重複

第41、43行重複「6.変更と検証」；第53行6.1是L1～L3，第126行又有6.1統一測試。第118～124行另有舊規則重複。

最小方案：移除重複標題／同義段落，保留6.1～6.4單一編號。先做逐條規則保留對照，不能以去重為名刪掉更嚴格的安全限制。行號及節錨變動需同步引用檢查。這是編輯工作，非目前授權。

### A02：L與R不是可直接一對一換名

- R0是非執行文件修改；L系統未單列R0。
- R1是「未接線模組」；**不是L1**，L1主要是輕量產品UI。
- L1／L2產品修改大致落R2，但若碰確定狀態／RNG仍升L3/R3。
- L3與R3大致對應；正式Gate更嚴格者優先。

建議保留R0/R1的例外，再選擇一套主標籤並附影響描述；或兩套保留但加映射。**主標籤採哪套需要使用者決定**，不自行把R1變成必跑Full，也不把L3降低為R2。

### A03：Quick規則存在直接文字衝突

第89行明示文件不無條件Quick、遊戲／測試原則Quick；R0/R1另有輕量要求。第128行卻寫「変更後は…Quick」，無文件／獨立模組例外。若只讀舊6.1，Codex可能對導航修訂也啟動完整遊戲測試。

建議：以明確的影響等級／本任務指示判定；舊段改為指向唯一測試章，不再獨立重複命令。本文只列矛盾，不擅自永久選定兩者優先順序。本輪依使用者明確要求不跑Quick/Full。

### A04：Full與固定Seed要求範圍不一致

第90/92/94行按L3／合併／風險及同來源證據判斷Full；第128行「機能完成」字面可能涵蓋隔離R1模組，造成每批都跑Full。第121行「ロジックまたは構造変更」要求固定P/IF回歸，可能將未接線模組也當全產品影響。

建議：將「結構」改為需判斷是否接入或影響執行狀態的描述；保留核心最終Full與正式Gate更嚴格規則。已接受歷史PASS不能宣稱在新SHA重跑。修改前需確認這只是澄清，沒有放寬既有Gate。

### A05：權限、版本與文件定位容易誤讀

§8最新明確指示與§10.1「完成後dev commit/push」必須一起讀；常態流程不能自行解除本任務禁止提交。§11正本優先、不得按日期決定權威，應與導航「D2仍保留唯一技術條款」一起說明。

建議增加一句「測試通過及常態流程不構成提交／部署或下一Gate授權」的交叉引用，不再增加一套規則。本次不修改AGENTS。章內已有重複警語，未必需要新增內容。

## 4. 現行導航評估

已能辨識五種職責，但仍有兩個定位缺口：

- **正式規格**：AGENTS／CURRENT_SPEC／BACKLOG／TESTING清楚，發布驗收明示Full與artifact限制。
- **技術契約**：D2單獨列為必須保留來源是正確的；尚缺直接定位§14.13各子節、哪些是唯一現行契約的精確清單。
- **歷史設計**：導航有提醒舊標籤；D2同檔混合歷史候選與正式技術條款，Decision Log也留AF09舊狀態。僅檔名或日期不足以定位，需section級索引，不宜整份標「歷史可刪」。
- **測試與證據**：A/B／基準v2／發布／CI缺口已有入口；應加「產品、平台、SHA、證據層級」欄位或短標籤，避免本機Full80、Safari52、正式Smoke6混算。
- **未完成工作**：BACKLOG可追蹤G9殘項及artifact；規格移轉仍未結案。導航末段「第二階段…未授權」是第一階段時點留下的界線，現在應區分「第二階段分析已授權」與「規格整合實作／第三階段清理未授權」，本輪不改它。

其他矛盾：工程計畫當前索引已正確說發布完成，但下方CURRENT EXECUTION STATUS、A/B待獨立授權、AF09未授權仍保留舊時點；D2 support registry仍有舊game行號及沒有producer文字。建議按區段加歷史定位，不覆寫原始批准或驗收結果。

架構四文件明示1.11.5快照限制，方向正確；現在不能用其中舊AST行號代替現行1.13.0 call graph。更新架構是另批工作，不混入文書去重。

## 5. 最小修改提案（全部未執行）

### P1：先做入口與技術引用，不改規則

預計僅修改CURRENT_SPEC§17.4、導航及D2／工程計畫的section定位：

1. CURRENT_SPEC維持產品數值正本，補指向D2§14.13.1～.6的明確「現行技術契約」引用與缺失摘要。
2. D2增加條款級CURRENT／HISTORICAL／EVIDENCE入口，保留每段原文。Decision Log保留批准史，不直接把AF09舊狀態改成當時已授權。
3. 導航明確列正式規格／技術契約／歷史候選／驗收證據／待辦，修正目前階段的授權描述。
4. 不新增一份平行的完整數值正本；D2唯一條款在移轉及反向核對完成前原地保留。

若使用者希望技術契約也從D2抽離，需另批批准「技術規格目標文件」及逐條搬移；本輪不預設建立新正本。

### P2：AGENTS限定去重，先決定測試分類策略

先審查A01～A05；確認主分類採L或R或雙標籤後，才合併§6。不改§7～11權限與版本政策，不藉文件整理改CI觸發、測試入口、golden或正式Gate。

### P3：補驗收可追溯性，而非重跑整套

建立原ID→原生測試→既有summary/log→受驗SHA／平台索引；區分fixture、Runtime、離線模型、實機與未執行。先核查原證據完整性，無理由不重跑Full；LinuxFull延後及artifact缺口另待授權。

### 執行順序與退出條件

入口定位 → 技術契約逐條引用／移轉 → 正反向數值及格式核對 → AGENTS經批准的去重 → 個案證據索引。第三階段刪移封存完全獨立，**不能由本報告自動啟動**。

後續文件修改驗收：每項現行約束都有唯一入口與來源；公式／常數／ID原值不變；本地路徑與錨有效；歷史FAIL/NOT_RUN/DEFERRED保留；原有dirty成果不覆蓋；任何需重寫產品規則或放寬Gate的衝突停止詢問。

## 6. 本輪檢查、限制與停止

- 新增本報告與JSON對照；未修改任何既有文件或產品檔。
- JSON格式／唯一M-ID／統計／引用檔案及行號存在性執行靜態檢查；本地Markdown連結另作存在性檢查。
- 未執行Quick、Full、瀏覽器、CI、golden再生成或自然生涯；全部NOT_RUN，不視為新PASS。
- 原始研究資料、A/B封存、LinuxFull失敗證據與已有dirty/untracked成果不作任何整理。
- 不主張66群已覆蓋所有動態執行或歷史資料；未全文讀取全部大型inventory檔及log。重點未完成是逐測試個案的Runtime證據對照、產品B實機UI與自然平衡、LinuxFull及artifact完整性。
- 沒有commit／push／merge／deploy。到此停止，待使用者批准P1/P2/P3具體修改範圍。

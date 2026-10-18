# 野球人生｜投手獎項 D2 分階段實作計畫書

## 現行執行索引（2026-10-16）

A0／G2～G4、G5～G8的既有本地接受範圍保持；G9正式1.13.0發布與基本Smoke已完成，來源／main為 `650e4dd21718b4abec3876fc9ef6148714c21d4f`、正式Repository為 `15adf286e687ab2efc70e9e694ae024f75c3f10b`。[發布驗收](../docs/reviews/RELEASE_1130_PRODUCTION_ACCEPTANCE.md)記錄同SHA Quick61及六組正式站Smoke。

Linux Full **NOT_ACCEPTED / DEFERRED**，不再調查／修正／重跑；**ARTIFACT_COVERAGE_BLOCKED**獨立維持。使用者明確批准此次發布不以Full PASS為前置，不代表刪除原G8／G9 Gate或把未執行視為通過。原Gate、失敗恢復契約、批准及歷史結果全文保持；未來實作或恢復Full仍需新授權。

文件移轉／整理未完成，只建立[現行導航](../docs/CURRENT_DOCUMENTATION.md)與[整理計畫](../docs/reviews/DOCUMENT_AUDIT_1130_PLAN.md)。以下2026-10-15及更早的CURRENT EXECUTION STATUS、NOT_AUTHORIZED／NOT_STARTED／未公開文字屬歷史批准快照，不作現行執行許可；不能因本索引自行啟動新工作。

## CURRENT EXECUTION STATUS（2026-10-15）

原計畫與各Gate要求保留。使用者其後已明確授權並接受開發A及B：A0／G2～G4、G5～G8為LOCAL_PASS / USER_ACCEPTED；受驗B來源已本機提交`56e72d9792529f3221c1a1ffadaf563bceebe26d`，VERSION仍1.12.0。證據見[A驗收](../docs/reviews/PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)、[B驗收](../docs/reviews/PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md)。以下「A／B未開始、Runtime未驗證、AF09未授權」等為原2026-10-14計畫快照，不再是目前工程狀態；原規則及驗收標準沒有降低。

G9追加批准1.13.0 MINOR、VERSION／CHANGELOG及必要文件的發布準備與精確staged清單。原A／B受驗版本仍為1.12.0；不改規則，CI timeout／artifact方案待審。不得commit／push／merge、觸發CI或部署、刪除歷史產物。整個G9仍為PARTIAL / PENDING_RELEASE_APPROVAL；不是自動放行發布。現行產品規格見[CURRENT_SPEC第17節](../CURRENT_SPEC.md#d2-current-spec)，原順序、回退與保留政策見[G9驗收](../docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)，本輪追加授權與驗證見[發布準備](../docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)。

**文件狀態：IMPLEMENTATION_PLAN / DESIGN_ONLY / NOT_AUTHORIZED**  
**建立日期：2026-10-14**  
**執行計畫修訂：2026-10-14｜G2～G8 兩次整合開發；PLAN_ONLY / DOCUMENTATION_ONLY**  
**目標儲存庫：`tt-chin/yakyujinsei`（開發端；正式站 `tt-chin/yakyujinsei-site` 不在本計畫直接修改範圍）**

> 本文件是交給 Codex 依序執行的工程計畫，**不是** AF01～AF09 的批准紀錄，也**不是**產品實作、commit、push、merge 或部署授權。每個批次須收到使用者明確批准後才可修改程式。不得因「文件完成」「開始下一步」等模糊訊息推定全批授權。

本次只調整工程授權批次與例行 Full 的執行時點，不改已批准 D2 政策、風險 ID、故障支持範圍、各 Gate 驗收標準或 G9。G2～G8 建議改為「開發 A：G2～G4」及「開發 B：G5～G8」；兩者目前均 **NOT_AUTHORIZED / NOT_STARTED**，須分別取得使用者明確批准。

### 修訂基準與既有工作保全

- 本地 branch：dev；HEAD：`d2ea8a3bcf38044928aab86ae56289839c45a0e4`；VERSION：1.12.0，位於 `docs/src/config.js`。本次未 fetch／pull，不宣稱已同步最新遠端。
- 開始時工作樹：`M docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md`；未追蹤的 `docs/reviews/G1_B2_CONSUMER_COMPATIBILITY_REVIEW.md`、`docs/reviews/G1_B_PRE_IMPLEMENTATION_REVIEW.md`、`docs/src/engine/award-identity-policy.js`、`tasks/`、`tests/award-identity-policy.test.mjs`。保留全部既有內容；本次僅編輯本計畫。
- [G1-A 驗收](../docs/reviews/G1_A_LIMITED_FIX_ACCEPTANCE.md)：PASS / ACCEPTED，僅限定日文名稱漏判修正及其因果差分；不是完整 G1 或新獎項接入 PASS。
- G1-B1：唯讀 Registry／Adapter 與測試已存在、未接入產品；未找到專用 Markdown 驗收報告。最新 R1 結果見先前回覆／本地產物，開始開發 A 前需核對受驗來源、日誌與適用範圍，不補造報告或假設完整 F-ID01～12 已通過。
- [G1-B2 相容性調查](../docs/reviews/G1_B2_CONSUMER_COMPATIBILITY_REVIEW.md)已存在於本地 Repository（尚未追蹤），使用者已明確接受為 **ANALYSIS_ONLY / ACCEPTED**；證據為靜態分析，不是 Consumer 接線 Runtime PASS，也不授權實作。其 API／來源／順序及測試隔離邊界缺口列入下方前置事項；本次不修改該報告或混入提交。
- 本次風險 R0，只做文件檢查；Quick／Full／CI／生涯重播均 NOT_RUN。

## 1. 目的與權威來源

目標：在不破壞既有 Seed、舊主 RNG 槽、舊獎項與既有合約/薪資/名人堂行為的前提下，安全接入 P01～P08，修正已確認的日文獎項判定缺口，並建立可驗證的同頁面年度結算恢復機制。

Codex 開始每一批前，**必須重新讀取儲存庫最新版本**：

1. `AGENTS.md`、`CURRENT_SPEC.md`、[docs/src/config.js](../docs/src/config.js) 的 `VERSION`（本次核對為 1.12.0；不新增根目錄 VERSION 檔案）；
2. [正式 D2](../docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-technical-approved)（P01～P08 政策、§14.9 正式 TR-B01～05及§14.13已批准技術設計）；
3. `docs/designs/PITCHER_AWARDS_D2_DECISION_LOG.md`；
4. `docs/reviews/PITCHER_AWARDS_D2_TECHNICAL_VALIDATION.md` 與 `docs/reviews/pitcher-awards-d2-technical-validation/results.json`；
5. `docs/designs/PITCHER_AWARDS_D2_TECHNICAL_FINALIZATION_PROPOSAL.md`（AF01～AF09 **候選**，不是批准）；
6. `docs/reviews/AWARD_JP_NAME_LIMITED_VALIDATION.md` 及相應結果；
7. 現有獎項、薪資、HOF、trait、movement、年度結算的實際程式與測試。

若文件路徑不存在或與目前 repo 不一致，先回報，不自行重建為「正式規格」。**權威順序**：當前使用者明確批准決議 → `AGENTS.md` 安全/作業規則 → 正式 D2 與其正式更新 → 已批准技術決議 → 現行產品事實。候選書、舊 D1、離線模型和測試計畫不得凌駕正式 D2。遇到衝突先停止並列出原文與位置。

**目前狀態分離**：AF01～AF08技術設計已明確批准（包含AF04／AF06的限定恢復及AF08保守相容政策），不需重新表決；其產品 Runtime 為 `RUNTIME_NOT_VERIFIED`。AF09產品實作仍 `NOT_AUTHORIZED / NOT_IMPLEMENTED`。批准依據見[正式決策紀錄](../docs/designs/PITCHER_AWARDS_D2_DECISION_LOG.md)及正式D2 §14.13；候選書僅保留來源與歷史，不以其舊待批標記推翻正式批准。本次僅文件修訂，不啟動G1～G9。

## 2. 不可改動的產品政策

- P01 四聯盟基本/保證勝數：CPBL 10/15、KBO 12/17、NPB 12/17、MLB 14/20；採已批 Curve B：基本以下 0%，基本至保證以下由 20% 線性升至 95%，保證以上 100%。
- P04 僅 NPB、KBO；NPB 最低勝數 **12**、KBO **10**；勝率以原始 `W/(W+L)` 計算；低於 .650 為 0%，[.650,.850) 為 `20+300*(WPCT-.650)`%，≥.850 為 100%。不得套用較舊決策紀錄中的 NPB13。
- P08 僅 NPB 一軍 SP；W≥13、IP≥143、ERA≤3.20；S3 權重 W25/ERA30/IP25/SO15/WP5；錨點 W12→17、ERA3.20→2.20、IP143→180、SO155→215、WPCT.650→.850；B2先判基本資格，不合格為0%；合格時score<60為0%，僅 `60 ≤ score < 95` 採 `min(95, 10 + 2.5 × (score − 60))`%，`score ≥ 95` 為100%保證。其他有效資料條件依[正式D2 §13](../docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#p08-approved-design)，不更動已批准參數。
- P02／P03／P05／P06 原資格、概率、保底與**舊主 RNG 抽選槽及順序**保持；P02 對應舊 ERA 槽而不是另外多抽一次。P03 正式日文名稱須與舊名稱別名兼容。
- P07 只根據同一球員、同年、同聯盟**實際取得** P01+P02+P03 衍生；保證同一個 MVP 語義結果，不增加主 RNG，不重複 MVP、honors、trait、薪資或效果。
- P08 的 phoenix：`glass` 且未 `phoenix` 時移除 glass、加 phoenix、`pool+8`，**整個生涯最多一次**；獲獎當年度 movement 降格保護；不延伸成永久免降格、免退休、免續約風險。
- 歷史「最優秀投手賞」獨立保留，**不得**改映 P02 或 P08；已完成的舊年度不補抽、不補發、不回算既付收入。
- 不加入 HP、reliefWins、GS、子聯盟拆分、多人同 Seed 身分、跨 reload 存檔、NPC 排名或其他未授權範圍。

## 3. 批次總覽與依賴

|批次|主要內容|授權門檻|產出/放行門檻|
|---|---|---|---|
|G0|基線、批准紀錄與變更邊界核對|唯讀可先做；新檔也需明確允許|差異清單、基線、批准矩陣|
|G1|穩定獎項 ID / adapter + 六項既有日文漏判修正|AF07、AF08 策略與本批產品修改授權|F-ID01～12；舊資料不誤映；因果差分說明|
|G2|獨立 RNG、canonical key、精度與向量|AF01～03；須明確授權開發 A，依序內部驗收|13 GV 與負例、Node/Chromium/Safari、主 RNG 零消耗|
|G3|原槽 Journal、Decision 與 Effect Receipt|AF04～05；同開發 A 授權，前置模組檢查通過|F-B01～12 支持範圍、故障恢復、R 槽等價|
|G4|phaseEnd / payment / render / choice / advance checkpoint|AF06；同開發 A 授權，Journal／Receipt 依賴可用|F-A04/A06/A07/F-YEAR，真正可續行|
|G5|P02/P03/P05/P06 舊賞適配、正式名稱與 downstream|須另明確授權開發 B；開發 A PASS，保留 G1～G4 前置條件|舊抽選不變，待遇/薪資/HOF 一致|
|G6|P01、P04、P08 新獎接入|開發 B 授權須明列 AF09 對應產品範圍；G2～G5 PASS|資格、邊界、獨立抽選、效果驗收|
|G7|P07 三冠、MVP 合併、全 consumer 整合|同開發 B 授權須明列 P07／MVP；G6 PASS|三實得條件、MVP 唯一、全鏈路一次性|
|G8|固定 Seed、異常/舊資料、PC/手機完整回歸|開發 B 的最終驗收範圍；G1～G7 PASS|實際 runtime 證據、無未解關鍵 FAIL|
|G9|版本、變更紀錄、發布審核|另行明確 commit/push/deploy 授權|開發與正式站隔離，核准後發布|

**建議依賴調整**：若 G1 的 adapter 必須依賴 G3 的 receipt 結構，先把 G1 拆為「只讀識別/測試」與「具副作用 consumer 切換」，後者延至 G3 後。不得為了遵守表格順序提前引入未批准的交易結構。G1 的 Bug 修正亦可獨立於新獎項推出，但需先批准可接受的後續 Seed 因果差分。

### 3.1 開發 A：G2～G4 技術基礎整合（待獨立授權）

**範圍與依賴順序**：未接線 Consumer fixture／API 契約準備 → G2 純 deterministic RNG／編碼／精度 → G3 原槽 Journal、Decision／Effect Receipt → G4 年度 checkpoint、重入及安全續行。前置準備納入開發 A，不新增正式 Gate 或重定義風險 ID。第6～8節的目標與放行標準原樣保留，G2／G3／G4 仍各自記錄結果，不合併成一個總 PASS。

**A 的前置工作：未接線 Consumer fixture／API 契約準備（R1）**

- 依 G1-B2 調查建立未接線相容性 fixture，涵蓋各 Consumer 的現行正常日文、可信／不可信 alias、未知資料、跨年／跨聯盟、重複及個人／團隊／國際混合榮譽。使用原生函式核對現行結果，明確區分身分識別與各自的資格／待遇，不以模型替代產品判定。
- 明確定義並先驗證唯讀 API 契約：逐條可信來源／scope／year／league 上下文、originalText 與原始順序、semantic 去重視圖與原始資料的分離，以及缺值／非法值／未知名稱／UNKNOWN 與 NOT_IN_SCOPE 的安全處理。不得從現在所屬推測歷史，不得改寫 S.honors、擴大 alias 信任或以 caller boolean 當成已完成 Decision 的證據。可信交易完成判定仍依 G3 Journal／Receipt 驗收。
- 不接入現行 Consumer、不改 Consumer 資格、效果集合或歷史獎項待遇，不重算既付收入／契約。LEGACY_BEST_PITCHER、PITCH_ERA、PITCH_SAWAMURA 必須分離；GoldGlove／All-Star 不新增待遇，G1-A 已接受的效果範圍不擴張。
- 在產品修改前保留 G1-B1 模組／測試受驗來源、hash、隔離斷言及原日誌。保留「B1 當時未接線、既有產品來源不變」的證據，不把後續 A／B 程式變更重新寫成 B1 零差分。
- 本前置只執行模組測試、相關原生 fixture、唯讀／無副作用與靜態依賴／接線檢查；Quick 可按風險安排，無須為此前置另跑一次 Full。結果各自記錄，不宣稱已完成 Consumer 接入或完整 F-ID 驗收。
- 前置完成條件：現行結果及來源／順序契約可重現、無 S／honors／主 RNG 寫入或產品接線，差異及缺口有明確分類。遇到資格／歷史待遇衝突或需要產品接線時停止，不在前置中修 Consumer。具體允許檔案／接口修改範圍仍須在開始 A 的明確授權中列出；本次只納入計畫，不啟動實作。

**開始前**：確認 G1-A 接受證據及 G1-B1 唯讀模組受驗來源；保存當次完整 SHA、dirty worktree hash、主 RNG trace 與正常投手／野手基線。確認 G3 所需 ID／可信 Decision 接口的最小修改是否在開發 A 授權內；不能默認獲准修改 Adapter 測試隔離邊界或全部 Consumer。完整 G1 尚未完成的 F-ID 案例保留，不以 G1-B2 靜態調查替代。

**納入／排除**：只做已批准 AF01～AF06 技術基礎及必要接口，不啟用 P01／P04／P08 新 producer、P07 三冠／MVP 衍生或 G5 完整 Consumer 切換。G3 可用完成的 Decision fixture 驗證實際產品 Receipt，不代表新獎項已實作。任何必要的超範圍產品修改先停止確認。

**開發中**：逐模組執行單元、原生 fixture、故障注入與必要整合測試；前置內部檢查通過才連續推進。支持故障的預期拒絕／停止亦需斷言通過；非預期 FAIL、未知副作用或基線差分出現時停止擴大修改範圍、保存證據及歸因，不藉後續 Gate 掩蓋失敗。不要求每完成 G2 或 G3 就重新執行 Full，但不得跳過其專用驗收。

**確定程式後集中驗收**（整批 R3）：

- Quick 及 Full，對同一確定程式／相同受驗來源執行；保留命令、環境、時間、exit code、SHA 與日誌。
- G2：13 個 RNG golden vectors、非法輸入／精度邊界、Node／Chromium／Safari 實跑與主 RNG 零消耗。
- 固定 Seed／主 RNG 原槽 eligibility、呼叫順序、逐值、次數及必要 S／選擇歷史比較；正常流程不得有未解差分。
- G3：適用 F-B01～12、Journal／Receipt 重複執行、共享一次性效果、partial write／CONFLICT 及不支持 gap 停止。未接新 producer 的案例須標 fixture 證據界線。
- G4：F-A04／A06／A07、F-YEAR 及年度中斷恢復；驗證真實可操作選項、一次 movement／advance，不重抽、不重付、不重配分。
- 舊已結算／無 Journal／未知歷史、既付合約／收入與 AF08 相容性，不補造或重算。

**開發 A 放行**：原 G2／G3／G4 每項必要條件都有實際證據，Quick／Full PASS，關鍵 FAIL／BLOCKED／NOT_RUN 均未遺留。平台不可用不能以豁免取代正式跨平台條件。只在開發 A 通過、且使用者另明確批准開發 B 後，才可開始 B；A 通過本身不授權 B、G9 或發布。

### 3.2 開發 B：G5～G8 獎項與 Consumer 整合（待獨立授權）

**範圍與依賴順序**：開發 A PASS → G5 既有獎項及 Consumer → G6 P01／P04／P08 → G7 P07／MVP／效果完整整合 → G8 最終回歸。第9～12節所有驗收條件保留。G6 可按 P01 → P04 → P08 的順序內部驗收；不要求逐獎項重跑 Full。

**正式 D2 全獎項覆蓋**：B 必須涵蓋 P01～P08，不因「新增 P01／P04／P08」的摘要而漏掉既有賞適配或 P07；以下只標示工作歸屬，不重新定義資格、機率、ID 或效果。

| 獎項 | 主要工作 Gate | B 最終必要證據 |
| --- | --- | --- |
| P01／PITCH_WINS | G6 | 四聯盟已批准勝投門檻及 Curve B、獨立抽選、實際下游 |
| P02／PITCH_ERA | G5 | 沿原 ERA 主 RNG 槽及原資格／機率／保證；新部門待遇與歷史大賞隔離 |
| P03／PITCH_STRIKEOUTS | G5 | 原槽／原條件不變，正式名與可信舊名相容、語義消費不重複 |
| P04／PITCH_WIN_PCT | G6 | NPB／KBO 批准門檻、原始 W/L 勝率及 Curve B、獨立抽選 |
| P05／PITCH_SAVES | G5 | 原 CL 資格／原機率與槽，名稱及 Consumer 完整對應 |
| P06／PITCH_RELIEF | G5 | 原 MR／HLD 簡化規則、原機率與槽，不新增 HP／reliefWins |
| P07／PITCH_TRIPLE_CROWN | G7 | 同年同聯盟三實得、MVP 合併、特性及一次性效果 |
| P08／PITCH_SAWAMURA | G6，G7 交叉效果驗收 | NPB SP／S3／B2／G95、獨立抽選、phoenix 與當年保護、與 MVP 共用一次效果 |

G8 必須核對以上八項及各自適用／不適用聯盟、角色、階層、舊資料與跨 Consumer 測試，不以部分獎項 PASS 宣稱完整 D2 PASS。G6／G7 仍走真實 producer → ID → Decision → Receipt → consumer，不能以 A 的 fixture 取代。

**Consumer 身分與待遇分離**：相同 awardId 只代表獎項語義，不代表 phoenix、降格、薪資、獎金、HOF、特性的資格相同。逐 Consumer 對照正式 D2 待遇及 G1-B2 現行差異；保留各自原有集合與範圍外行為，只有正式 D2 明確批准的新賞待遇／適配可變更。不能用單一「大獎／部門賞」集合全面替代，也不追溯修改歷史待遇。發現正式規格與現行相容限制不能並存時，停止提出差異，不自行統一或擴權。

**G1 交接不得跳過**：G1-A 及 B1 的限定 PASS 不等於完整 F-ID01～12。G1 中依賴 G3／G4 的 Consumer 切換安排在 B 的 G5 整合工作中，按原 F-ID 逐項補齊；依賴 P08 真實 producer 的 F-ID10 留至 G6／G7。其他 G1 前置仍須滿足，不能為避免循環依賴直接把未驗項目標 PASS。開始 B 前須明確列出這些工作及必要 API／測試邊界調整並取得授權；不偷併另案或擴大正式 Gate。

**B 的 Consumer 接線測試邊界**：在開發 B 實際接入 Consumer 時，調整 B1 的當前工作樹隔離斷言，使其對應已批准接線範圍；保留原 B1 模組／测试快照、hash、日誌及歷史未接線驗證，不刪除或覆寫為新結果。以新的正向接線／依賴檢查、各 Consumer 資格集合、歷史待遇及 S／honors／主 RNG 回歸斷言取代對當前產品「永遠無接線」的要求，不全面移除嚴格比較。A 的未接線前置不提前調整此 Consumer 接線邊界；若 A 的技術基礎修改使 B1 全產品來源不變斷言不再適用，先分離歷史 B1 隔離驗證與 A 專用產品回歸，在授權範圍不明時停止確認，不暗中放寬或記為 PASS。

**開發中**：逐功能執行單元、獎項／歷史 fixture、原生 Runtime E2E、必要下游與重入測試；前置 Gate 的專用條件通過才推進。不重新表決已批准獎項數值，不放寬 golden 或失敗斷言。內部非預期 FAIL 時停止擴大修改範圍，先歸因與重跑失敗／直接相關入口。

**確定程式後集中驗收**（整批 R3；G8 為本批收尾，不另重複一次例行 Full）：

- Quick／Full、投手通常／省エネ／全力及野手固定 Seed 生涯回歸、同版完整重播。
- RNG 順序及確定性：原槽保持原資格／順序／值／次數，新獎項不耗主 RNG；事前列明批准功能的可追溯下游差分，不把新獎項效果造成的整條生涯差分偽稱全狀態不變。
- 真實 `producer → ID → Decision → Receipt → consumer`：G5 舊賞適配、G6 每一新賞、G7 三實得同年同聯盟三冠與 MVP 合併；G3 Decision fixture PASS 不替代 G6／G7。
- 多獎／同賞重入／中斷恢復、MVP 唯一、phoenix 生涯一次、當年度降格保護、薪資評價／獎金／合約／HOF／trait 下游。
- 歷史原 honors／可信 alias／未知與範圍外榮譽、已付收入及保障契約；不混淆 LEGACY_BEST_PITCHER、PITCH_ERA、PITCH_SAWAMURA。
- PC1280／手機320／390 的卡片、選項、年度及歷史／退休顯示、操作、Console／JS-CSS404；原打者獎項及打者三冠回歸。

**開發 B 放行**：原 G5～G8 的必要驗收逐項 PASS，完整 G1 的依賴案例補齊，Quick／Full 通過且無未解關鍵差分／BLOCKED。不得只用一個 Full summary 推定所有專用 Gate 都通過。完成後停止交付審查，不開始 G9。

### 3.3 測試頻率與可追溯性

- 本次文件修訂 R0；未來 A／B 核心實作整批 R3。批內可依隔離／局部修改採 R1／R2 專用測試，但不降低整批 R3 或正式 Gate 要求。
- G2～G8 的**例行 Full 目標為兩次**：A 確定程式一次、B 確定程式一次。不是最多兩次的硬上限，也不是每個 Gate 都要各跑一次。
- 正式規格、故障調查、測試失敗、受驗程式改變或發布／合併條件需要額外 Full 時必須執行。失敗後先跑失敗及直接相關入口；若最終程式已變，取得確定程式的 Full PASS，不能以部分重跑冒充整套 PASS。
- 不改 Runner／CI workflow 或觸發條件來壓低次數；未來若另獲提交／CI 授權，既有 workflow 可能增加實際執行次数，不能宣稱固定只有兩次。
- 每 Gate 保留測試 ID、輸入／來源、指令、環境、SHA／工作樹指紋、預期／實際、日誌與 PASS／FAIL／BLOCKED／NOT_RUN；RISK、WAIVED 亦單獨記錄，不轉為 PASS。
- 相同確定程式與條件的共用測試可一次執行並交叉引用，必須清楚列出涵蓋的 Gate／案例；不能只因 Full PASS 就推定未跑的 golden、fault、舊資料或 UI 案例通過。
- 不修改 golden baseline 掩蓋差異，不以模型／fixture PASS 取代原生產品證據。G3 限定 Receipt 驗收與 G6／G7 完整鏈路的證據界線保持。

### 3.4 未解依賴、文件差異與授權前檢查

1. G1-B2 為 ANALYSIS_ONLY / ACCEPTED，但 Adapter 完成 Decision 的信任契約、逐條來源／scope／歷史順序／未知值與各 Consumer 資格集合尚未完成接線驗收。A 先做未接線契約／fixture 準備；G3 僅在其必要接口範圍內處理可信交易；完整 Consumer 對應留在 B，不全面擴張 A。
2. B1 測試目前要求既有產品來源不變且 Adapter 無接線。A 的未接線 fixture／API 契約準備保留此隔離證據；Consumer 接線邊界調整安排在 B，依第3.2節保留歷史驗證並加入正向相容性防護。A 技術基礎若與全產品來源凍結斷言衝突，先分離證據範圍並確認必要授權，不提前放寬 Consumer 邊界、不刪斷言或改 golden。
3. Node／Chromium／Safari 產品向量仍待實際驗證；若缺環境標 BLOCKED／NOT_RUN，A 不假放行。尚無產品 Journal／Receipt／checkpoint PASS，本計畫不預先結案。
4. 正式 D2 §14.8 保留逐批独立授權建議；§14.13及 Decision Log 尚有日文 BUG NOT_FIXED／整體 NOT_IMPLEMENTED 的歷史快照。後來 G1-A 接受只解決限定漏判、B1 只建未接線模組。建議未來另獲文件授權時分層更新歷史／現行狀態與 A／B 執行引用；本次只在本計畫記錄，不修改正式文件，不否定既有接受或冒充完整 G1。
5. 本次最新使用者指示只改「執行安排及授權批次」，不取代正式技術規格。若正式文件後續有實質衝突（非歷史時點或測試執行頻率），停止並列原文／選項，不能用本計畫降低標準。
6. 開發 A／B 及 AF09 對應產品範圍均未獲本次授權；G9、VERSION、commit／push／merge／部署仍獨立禁止，須另批准。退休投票任意故障恢復、跨 reload 保存等不得混入年度 checkpoint。

### 3.5 開發 A 開始準備狀態

**PLAN_READY / IMPLEMENTATION_NOT_AUTHORIZED**：已有正式技術設計、G1-A 限定接受證據、未接線 B1 模組／測試及已接受的 B2 調查，可以提交開發 A 的明確授權範圍供審查；目前不能開始產品修改。

開始 A 的前置核對仍包括：B1 既有日誌與來源 hash、當次正常固定 Seed 基線、未接線 Adapter 契約／fixture 的具體檔案範圍、G3 必要接口及 B1 歷史隔離證據如何保全、跨 Node／Chromium／Safari 的實際可用驗證環境。這些核對及 A 前置測試不能由 B2 的 ACCEPTED 代替；未解來源／規格衝突須先停止確認。G2～G4 的 Runtime 是 A 待完成工作，不預先標 PASS。

A 驗收通過後，B 仍需另行授權；G9 始終独立。未來若無環境或關鍵證據，按實際結果標 BLOCKED／NOT_RUN，不憑計畫準備完成放行。

## 4. G0：基線與批准 Gate（只讀）

1. `git status --short`、branch、HEAD、VERSION、現存未提交檔案清單及必要 hash；**不得** `reset`、`clean`、`checkout` 覆蓋使用者工作。
2. 核對「AF01～AF09 狀態矩陣」：AF01～AF08沿正式D2及決策紀錄的已批准設計狀態與限制，不重新表決；另列產品 `RUNTIME_NOT_VERIFIED`。AF09仍 `NOT_AUTHORIZED / NOT_IMPLEMENTED`，各批工程須另獲授權。若後續出現新的提案，不從既有批准擴張授權。
3. 對照 TR-B01～TR-B05：TR-B01=hash/編碼/精度/向量；TR-B02=逐槽 journal/多欄 effect receipt；TR-B03=phaseEnd 上下游安全續行；TR-B04=完整 ID adapter/歷史與下游；TR-B05=產品授權。不得自創 TR-B 編號。
4. 固定比較基線：原主 RNG 呼叫次數/順序/每槽結果、正常一年與多年同 Seed 生涯、薪資保障/收入、HOF/trait/honors、movement 與年度 UI；至少保存投手通常/省エネ/全力、IF 情境。具體 Seed 依既有 fixture；`tob0ilu0`、`q77bi1jx` 可作補充，不宣稱自然可達所有新獎邊界。
5. 對舊 validation 的 71 PASS/3 RISK/1 DESIGN_GAP/1 NOT_RUN 明確標記：多數是**模型測試**，不可當產品 PASS。

**G0 停止條件**：批准不明、來源衝突、基線不可重現、dirty worktree 可能遭覆蓋。

## 5. G1：ID adapter 與既有日文獎項 Bug

- 建立明確 `awardId`、正式顯示名、可信舊別名、year/league/role、producer 與 consumer 的映射；**不能**用「王」「MVP」等 substring 猜測身份。
- 區分 `LEGACY_BEST_PITCHER`、`PITCH_ERA`、`PITCH_SAWAMURA`，以及 P03 新舊同義；未知歷史僅保留顯示，不補新效果。
- 分開 phoenix eligible set 與 movement protection eligible set；修正原生驗證確認的六個漏判：最優秀投手賞/首位打者/本塁打王的 phoenix，最優秀投手賞/首位打者/ゴールデングラブ賞的 movement。Gold Glove **不**因此新增 phoenix；All-Star 不得被誤判。
- **AF08已批准保守政策**：未知歷史個人獎項只讀原文、不推測新效果；保留既有範圍外consumer及舊當年度跨聯盟保護，依正式D2 §14.13.6。相容限制衝突時停止詢問，不重新表決已批准政策或暗改舊行為。
- 固定測試 F-ID01～12：原生日文 producer→ID→效果；舊字串兼容；跨年/league；薪資市場、保底、incentive、HOF、trait、引退 UI；既有已付契約不重算。
- 變更前後差異分類：`INTENDED_BUG_FIX`（可造成 phoenix、pool、movement 及後續主 R 的**因果**差分）、`UNCHANGED_LEGACY`、`UNEXPLAINED`。`UNEXPLAINED` 必須停止。

**G1 放行**：六個具體漏判由 FAIL→PASS；舊原槽概率/消耗未被直接更改；已知歷史不誤映；完整差分獲確認。

## 6. G2：獨立 RNG 與精度

- AF01～03技術設計已批准，採H1：六欄 canonical identity（domain、初始化 seed、year、league、awardId、ruleId），每欄 UTF-8 bytes 前置 4-byte big-endian 長度，FNV1a32 + 固定 avalanche，`u=unsignedHash/2^32`；**以正式D2 §14.13.1的完整常數／規格為準**，不可憑本計畫摘要直接寫實作。Runtime未驗證，G2產品修改仍須另獲授權。
- 固定 schemaVersion/ruleId 與 PATCH 隔離；不得改原主 `R()`、`rngState` 或舊抽選公式；新抽選是純函式。
- 使用正式D2 GV01～GV13完整 bytes/hash/u 作**已批准、Runtime待驗證向量**，候選書原表僅作追溯來源；並加 invalid seed/year/league/rule、UTF-8/surrogate、邊界 0/100、相等不獲、u 最大值、safe integer 檢查。
- 使用原始 binary64/固定運算順序；不提前 `toFixed`、不加 epsilon 變更門檻；P04 W/L 分母與 P08 score 59.999/60/60.001、94.999/95/95.001 必驗。
- Node、Chromium、Safari 實際執行相同向量；平台不可用時標記 NOT_RUN，不能寫 PASS。

**G2 放行**：13 個 golden 逐 byte/hash/u 一致；非法 context fail-closed；相同 key 重算一致；新增 draw 對主 R 消耗為 0；跨平台證據完整。

## 7. G3：Journal / Receipt

- 依批准 AF04～05 建立單次 S 實例私有年度交易、完整 decision identity、原 RNG 槽 journal（preallocated、逐槽記錄）與各類副作用 receipt；**不能**用單一 `completed` flag 代替所有狀態。
- 保持既有 legacy slot 的資格短路、順序、100% 時仍抽主 R 等原行為；P02 沿用原 ERA 槽；新 P01/P04/P08 與主 R 完全隔離。
- `DECIDED` 與 `EFFECT_COMMITTED` 分開；同一 decision 不重抽；同一 honors、pool、薪資、HOF/trait 作用不重覆。
- P08 與 MVP 共用 phoenix 生涯 once gate；receipt 明確保存 before/after，遇到合法狀態衝突標 `CONFLICT` 停止，不能把 pool7→15 的重試做成 23。
- 已結算無可信 journal 的舊年度只能 read-only；不以缺 journal 推定可補抽；未知狀態 fail-closed。
- **支持範圍**限於批准方案：同頁面、同步已記錄後的可控 fault。主 R 已消耗但尚未記錄的模糊窗口、OOM、任意 host crash、跨 reload 及 next-year pre 部分執行不能假裝可自動修復。

**G3限定驗收方式**：涉及尚未接入的新獎項時，以已完成的 Decision fixture 搭配實際產品 Receipt 邏輯驗證交易安全，不以另一套模型Receipt替代產品邏輯。明確標記fixture來源、產品呼叫路徑與未覆蓋producer；這只證明G3限定範圍，不能宣稱新獎項完整整合PASS。

**G3 放行**：F-B01～12中適用案例的限定產品Journal／Receipt runtime PASS；故障後同決策/同效果至多一次；所有未支持故障明確停下且有診斷；舊 R 槽逐值等價。G6／G7須另完成真實 `producer → Decision → Receipt → consumer` 整合驗收，不得以G3 fixture PASS取代。

## 8. G4：年度結算與續行 checkpoint

- 分離 `phaseEnd` 的已付薪資、獎項結果、卡片 render、choice acceptance、movement、advance 與下一年度 handoff。
- 已付 base/incentive 不能因重入重付；但不能因「已付」就提前 return，導致配分/選項永遠不出現。
- 控制故障注入：VAL-A04（MVP 記錄後 render 失敗）、A06（舊 ERA 已記錄後再入）、A07（已付 10.35m 後 render 失敗）、F-YEAR（choice/advance/handoff 邊界）。
- 恢復需驗證**真實可點擊選項及年度繼續**，不能只看沒有 throw 或 receipt 已寫；過期 callback 不得重推年。
- 不自動恢復未知 `phasePre` 部分執行；模糊狀態明確診斷並停止。

**G4 放行**：上述每個支持 fault 都能一次性續行；未重複付款、R、honors、pool、movement、advance；異常時不假綠。

## 9. G5：既有獎項整合與下游一致性

- 將 P02 舊 ERA producer 的獎項名稱/部門待遇對接新 ID，但保持原 RNG bool；P03 正式日文名與舊名同義；P05 CL、P06 MR 的資格與機率不改。
- 逐個檢查薪資市場評價、保障、出來高、HOF、king/ace、trait、年度與生涯成績、引退、歷史畫面；用 ID 去重，保留舊 honors 原文與既付契約。
- 任何為 adapter 必需的小規模重構應與行為修正分開測；不得全面重寫獎項、年度或合約引擎。

**G5 放行**：舊 slot 抽選次序、結果、次數與基線一致（已批准日文 Bug 因果差異另列）；歷史獎項與薪資不誤映、不重付。

## 10. G6：P01 / P04 / P08 新獎接入

- **每一獎項可獨立驗收**：先 P01（四聯盟與 Curve B），再 P04（NPB/KBO、原始勝率），再 P08（NPB SP、S3/B2、可從缺）。每賞固定 ID、資格、metrics、p、drawKey、u、awarded、reasonCodes 及 UI 名稱。
- 先完成 eligibility/pure probability 的無副作用測試，再連接 G3/G4 的 decision/receipt，最後才接 HOF/薪資/phoenix/movement。
- P08 不取代舊最優秀投手賞的歷史；未獲獎無 phoenix；同一生涯後續再得 P08 不重複 `pool+8`；年度 movement 保護不擴至續約/退休。
- P01/P04/P08 抽選不得消耗原主 R；未批准的平衡曲線、門檻、錨點不得由 Codex「優化」。

**G6 放行**：每賞所有聯盟/角色/level、概率端點/斷點、固定 seed、歷史隔離與 downstream 實際 PASS；P08 一次性效果 PASS。必須走真實 `producer → Decision → Receipt → consumer`，G3完成Decision fixture的PASS不得代替本批整合驗收。

## 11. G7：P07 三冠、MVP 與整合

- P07 僅由**已完成實得**的 P01/P02/P03 同年同聯盟結果導出；不以三項數據達標替代實得，不跨聯盟、不重抽。
- 舊 MVP slot 原本有資格時仍按原順序抽一次；P07 保證與原 MVP 結果合併為**同一份** MVP decision/honors/trait/市場/HOF/收入效果；原 MVP 不合資格時不可補耗主 R。
- P07 本身不另加大獎 HOF 分數或獨立獎金；確認 P08 與 MVP 同年 phoenix 仍只有一次 +8。

**G7 放行**：P07 全部實得組合真值表 PASS；原 MVP true/false/no slot 三路 PASS；所有重入、獎勵與主 R 驗證 PASS。另以真實 `producer → Decision → Receipt → consumer` 驗證三冠衍生與MVP合併，不以G3 fixture PASS取代。

## 12. G8：完整驗收矩陣

|面向|必要證據|FAIL/BLOCKED 處理|
|---|---|---|
|舊主 RNG|相同 Seed 原槽 eligibility/順序/u/次數逐值比較|未解直接停止|
|新獎 RNG|13 GV + 負例 + Node/Chromium/Safari + 0主R|跨平台未跑不得 PASS|
|概率/資格|P01/P04/P08 各邊界、無效 stats、聯盟/角色/level|不得調低門檻迴避|
|年度恢復|F-A04/A06/A07、F-B01～12、F-YEAR 的**產品** fault fixture|模型 PASS 不可替代|
|效果與財務|pool、glass、phoenix、honors、薪資/出來高/合約、HOF、trait、movement|任何重複/漏付停止|
|歷史相容|舊最優秀投手、P03 舊名、未知 honors、已付收入|不得自動遡及補發|
|UI|PC 1280、手機 320/390，卡片、選項、成績、引退/歷史|無法操作即 FAIL|
|生涯|通常/省エネ/全力、IF、重複固定 Seed、完整年度推進|未解分歧必須定位|
|交付保全|dirty worktree、文件/測試、VERSION、branch、diff|不得覆蓋未提交工作|

結果分類固定：`PASS / FAIL / RISK / BLOCKED / NOT_RUN`；另標記 `NATIVE_PRODUCT / MODEL / STATIC / MANUAL_UI`。不得用 PASS 數量掩蓋未跑的關鍵項。明確記錄預期的 Bug 修正因果 Seed 差分，禁止將無法解釋的差分列為可接受。

## 13. G9：版本與部署（獨立授權）

### 13.1 本輪可完成部分與停止線

- 核對受驗來源、A／B封存及原始FAIL；同步CURRENT_SPEC、設計／決策的實作狀態及BACKLOG；產出待審發布摘要、CI／Preview／本番驗收順序、回退與產物保留／另批清理政策。
- 原A／B Full保留原指令、SHA與環境，不更改summary或重建基準。本輪僅文件變更，執行本地引用／正式checkbox／來源hash等限定檢查；不無理由重跑Full。Runner指紋包含docs文件，不能以此同步後的新指紋偽稱舊Full曾在此執行，也不放寬--reuse。
- 後續順序：另批版號／CHANGELOG及來源鎖定 → 另批精確Git提交／dev推送 → Linux Quick及Full → 最新SHA的Cloudflare Preview資產／功能驗收 → 使用者接受Preview → 另批main合併及既有正式同步 → 正式smoke與另批可回退方案。手動Full若因workflow不在default branch無法觸發，標BLOCKED，不自行建立Draft PR。
- Linux Full原有60分鐘timeout、本地59分15秒及目前artifact未涵蓋若干非yakyujinsei前綴的E2E資料夾，列為待處理風險；本輪不改workflow、上傳條件或通過標準。
- G9發布驗收前不清理A／B或歷史JSON。發布後也不自動清理：先建立最小保留集、逐檔hash／引用清單、可恢復的雙份保存及抽樣還原核驗，再由使用者另批明確候選清單；原始FAIL、golden、fixture及唯一證據不得以日期或目錄名整批刪除。

### 13.2 原G9要求（保持有效）

1. 完整 G8 PASS 後，先提交**待審發布摘要**：修改檔、測試報告、相容/風險、建議版本級別與玩家文案。
2. `docs/src/config.js`中的`VERSION`、正式 changelog、commit、push、PR/merge、GitHub Actions、Cloudflare Preview/正式站同步，**每項以當前 AGENTS.md 與使用者明確授權為準**；不能因 G8 PASS 自動執行，不新增根目錄VERSION檔案。
3. `tt-chin/yakyujinsei-site` 為正式站，不能把開發 repo 測試通過當作已發布。
4. 發布後 smoke test 與回滾計畫須另經核准；本計畫不預先指定 1.12.x/1.13.0 或其他 VERSION。

## 14. Codex 每批標準操作契約

**開始前**：讀權威文件、檢查 branch/HEAD/VERSION/dirty worktree；確認該批 AF 決議與**整合開發 A 或 B 的明確產品修改授權**；列出涵蓋 Gate、具體修改檔、前置依賴、許容差分與測試範圍；任何未知先問。G0／G1及G9仍按各自限定授權，不由A／B默認擴張。

**執行中**：僅修改該批批准範圍；最小差異；不改政策門檻、不順手修其他 bug、不刪舊歷史、不重建全部結算、不改主 RNG；不覆蓋現有未提交檔；無授權不 commit/push/merge/deploy/跑完整 CI。

**完成後**：輸出 `(1) 實際變更清單 (2) 測試指令/環境/原始證據 (3) 各Gate的PASS/FAIL/RISK/BLOCKED/NOT_RUN及證據範圍 (4) 舊 Seed 差分及原因 (5) 仍未解問題 (6) git status/HEAD/VERSION (7) A或B集中Quick／Full與專用驗收 (8) 下一整合批是否達前置Gate、是否另獲授權`。若有關鍵 FAIL／BLOCKED，停止擴大修改範圍，不可聲稱完成或自行跳下一批。

### 每批交給 Codex 的通用指令模板

```text
任務：野球人生 D2 整合開發 {A或B}，
涵蓋 {A=未接線Adapter契約／Consumer fixture前置＋G2～G4；B=G5～G8完整P01～P08}。
先讀 AGENTS.md、CURRENT_SPEC.md、正式 D2、決策紀錄、
PITCHER_AWARDS_D2_TECHNICAL_VALIDATION.md、
PITCHER_AWARDS_D2_TECHNICAL_FINALIZATION_PROPOSAL.md、
PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md，並核對最新 HEAD/branch/VERSION。

授權狀態：僅執行使用者本次明確批准的整合開發與列明檔案／接口範圍；
沒有明確產品修改授權時只做 ANALYSIS_ONLY；A未通過不得開始B，
B仍須另行明確批准，不能由A的PASS推定授權。
AF01～AF08沿正式D2已批准技術設計及限制，不重新表決；Runtime仍未驗證。
AF09僅以使用者當次明確批准的產品範圍為限，不推定全體工程／發布授權。
VERSION讀取docs/src/config.js，不新增根目錄VERSION檔案。

依第3.1／3.2節依賴順序及原Gate章節連續執行；逐模組跑相關測試，
每個Gate分別留證據，內部非預期FAIL時停止擴大範圍並歸因。
A／B確定程式後各集中Quick／Full及所有專用驗收；必要額外Full仍須跑。
G3完成Decision fixture＋產品Receipt只作限定證據；
G6／G7必須真實producer→ID→Decision→Receipt→consumer，不能以fixture替代。
禁止擴充到後續批次、擅改獎項政策、改主 RNG 槽、重寫歷史、
覆蓋 dirty worktree，或自行 commit/push/merge/deploy/完整 CI。

完成後提供逐項驗收結果、產品 runtime 與模型測試的區分、
原 Seed/RNG 差分、git status 與尚存 BLOCKER；
若Gate不通過或關鍵環境BLOCKED就停止；G9及發布另行授權。
```

## 15. 立即下一步（目前仍 DESIGN_ONLY）

1. 使用者審核本次兩整合開發安排、G1交接缺口及第3.4節必要接口／測試邊界。
2. 核對正式D2 §14.13及決策紀錄：AF01～AF08已明確批准技術設計，不重新表決；Runtime未驗證、AF09未授權。候選書保留原歷史標記，不覆寫為批准來源。
3. 下一個建議實作授權為**開發A（未接線 Consumer fixture／API 契約前置＋G2～G4）**，但須先核對G1-A／B1證據、基線及必要接口範圍；未解依賴不能假定PASS。本文件不啟動A，也不追補授權既存工作。A驗收通過後再請使用者明確批准開發B（G5～G8，含Consumer接線測試邊界調整）。
4. AF09（P01～P08 產品實作範圍）及所有發布動作，另設 Gate；不因本計畫交付而解除 TR-B05。

**完成定義**：G0～G8 所有必要原生測試實際 PASS、未解 BLOCKER=0、已批准差分可追蹤，並且 G9 獲獨立發布授權。計畫書完成 ≠ 程式完成 ≠ 正式站已上線。

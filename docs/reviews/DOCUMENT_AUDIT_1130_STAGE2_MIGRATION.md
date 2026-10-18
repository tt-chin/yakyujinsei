# 第二階段最小規格引用與AGENTS去重：處理及驗收

> 2026-10-18現況補註：本報告保留2026-10-16文件驗收與當時的dirty基準；主要文件修改其後已提交為`adf9089a0a05107c9314b868e331cdc08bcfc634`。下方原A／B完整封存保留敘述屬當時政策，後續已依[精簡摘要](RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)改採精簡紀錄；不宣稱原封存仍可完整複核。66條JSON與原diff不重寫，文件驗收不等於Runtime或新Full PASS。

2026-10-16｜DOCUMENTATION_ONLY／R0｜dev HEAD `650e4dd21718b4abec3876fc9ef6148714c21d4f`｜產品1.13.0不變。

本輪僅執行使用者批准的最小文件整理。先前[分析報告](DOCUMENT_AUDIT_1130_STAGE2_ANALYSIS.md)及[66條修改前對照](DOCUMENT_AUDIT_1130_STAGE2_CLAUSE_MAP.json)原文保留。此報告不是新的產品規則、驗收Gate或清理授權。

## 1. 修改範圍與精確diff

修改四份既有文件：

1. [CURRENT_SPEC](../../CURRENT_SPEC.md)：新增17.1.1歷史識別、17.3.1 Consumer邊界、17.4.1技術契約索引、17.4.2續行／比較界線、17.6歷史取代索引；55行新增、0行刪除。原既有條款與數值逐行保留，不重複新增21條已完成移轉規格。
2. [AGENTS](../../AGENTS.md)：只改第6章。11行新增、21行移除；單一第6章、6.1～6.5唯一編號，保留L1～L3與R0～R3原用途；收斂重複Quick／Full文字。
3. [現行導航](../CURRENT_DOCUMENTATION.md)：12行新增、1行替換，區分正式規格、六個技術契約入口、歷史設計、特定SHA／平台證據及未完成工作。修正第一階段留下的「第二階段未授權」現況，不授權第三階段。
4. [D2原設計](../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md)：只插入六個明確HTML anchor及空行，共12行；§14.13.1～.6可直接連結。沒有改任何技術條款、狀態標籤、候選、公式、測試結果或既存dirty四行內容。這是精確技術引用的最小定位修改，並非重編D2。

新增本報告、[66條處理結果JSON](DOCUMENT_AUDIT_1130_STAGE2_MIGRATION_RESULTS.json)及[本輪精確diff](DOCUMENT_AUDIT_1130_STAGE2_MIGRATION.diff)。diff基準是**本輪開始的dirty工作樹**，不是HEAD，故不混入第一階段或其他平行修改。它包含四份文件的全部本輪差異，沒有用整份工作樹diff冒充本輪修改。

未修改BACKLOG：其正式發布／Full延後／artifact缺口與文件未完成狀態已符合本輪要求，保留原文與checkbox，不再重複改寫。工程計畫及Decision Log亦原文保留，舊時點狀態由導航與17.6解釋，不改原批准或驗收紀錄。

## 2. 66條逐項處理結果

逐項來源、原分類、處理方式、目標anchor、產品／測試定位與剩餘風險全部列在JSON的M001～M066，沿用原分析索引，沒有新增或重新定義正式D2風險ID。

- 21條：RETAINED_UNCHANGED；已完整移轉者不重抄。
- 21條：SPEC_BOUNDARY_ADDED_WITH_REFERENCE；補必要的產品／歷史相容／執行比較邊界並引用原契約。
- 19條：PRECISE_TECHNICAL_REFERENCE；詳細技術與驗收契約不重抄，建立精確引用。
- 5條：HISTORICAL_INDEXED；保留來源與被取代依據。
- 合計66條均有文件處理，不等於66條Runtime PASS或40條技術內文全部搬入CURRENT_SPEC。

原21完整／33部分／7未移轉／5歷史的分析分類不回寫成新的歷史數字。33＋7的40條缺口已逐條選擇補文或引用；技術原文仍保留在D2，依賴未解除。

### 修改前後要點

- 原17.4只有H1／Journal／續行摘要 → 現17.4.1直達AF01～AF08契約；區分原槽記錄、Receipt衝突、8類checkpoint及模型／原生驗收邊界。
- 原17.1只有未知舊名不推測的摘要 → 現17.1.1補exact格式、UNKNOWN／NOT_IN_SCOPE、Consumer-only舊名與禁止歷史補發。
- 原17.3只列主要數值與效果 → 現17.3.1補不同Consumer與support award的差異，不把ID等同待遇。
- 原17.5引用整份D2 → 現新增17.6，五類歷史來源各有取代依據；沒有重寫舊FAIL／NOT_RUN。
- 原導航第一階段界線 → 現明示本輪最小文書整理已批准，全面整理仍未完成，第三階段未授權。

## 3. 新增正式說明的來源、產品及測試依據

以下皆為靜態核對。測試檔與既有A／B報告是證據入口，**沒有在本輪重新執行**；不能把存在測試或有程式碼視為本輪產品驗收。

### 3.1 歷史身分與處理邊界

- 批准來源：D2§14.13.4／14.13.6 AF07／AF08及B受入的精確舊名相容層。
- 產品：[parseAwardHonor](../src/engine/award-identity-policy.js)第57行、identifyAwardDecision第104行；[consumer policy](../src/engine/award-consumer-policy.js) legacyTables／legacyName／consumerTreatmentView第118行。
- 測試：[identity](../../tests/award-identity-policy.test.mjs)、[legacy consumer](../../tests/award-legacy-consumer.test.mjs)、[Consumer contract](../../tests/award-consumer-contract.test.mjs)、[B history比較](../../tests/award-history-b-comparison.test.mjs)。
- 不把舊「年度MVP／守備王／出塁王／最多勝」在單一Consumer的接受行為擴成新P-ID、可信Decision或新效果；不推定未確認中文alias。

### 3.2 復活、降格與各Consumer待遇

- 批准來源：D2§6／14.1／14.13.4，原G1-A修正與後續B接受範圍。
- 產品：award-consumer-policy第5～43行各自集合／待遇、hasCurrentAwardEffect第155行；[HOF](../src/engine/hall-of-fame-policy.js)第29～46行，All-Star投手70／野手40仍為原行為；game collectLegacyAwardPlan的phoenix與removed寫入。
- 測試：[Consumer policy](../../tests/award-consumer-policy.test.mjs)、[legacy consumer](../../tests/award-legacy-consumer.test.mjs)、[pitcher整合](../../tests/pitcher-award-integration.test.mjs)。
- 新文字是補記既定資格與Consumer差異，不改獎項門檻或把所有部門賞擴成保護。FULL仍受契約年度cap與原資格限制。
- 表示責任源自D2§14.13.4及CURRENT_SPEC既有特性說明時機；本輪沒有UI重驗，不宣稱B實機UI已完成。

### 3.3 RNG、Journal與年度安全續行

- 批准來源：D2§5.1／14.13.1～.3與A／B比較界線。
- 產品：[RNG policy](../src/engine/award-rng-policy.js)第20／29／43／48行；[transaction policy](../src/engine/award-transaction-policy.js)第38／53／64／75／152行；[game](../src/engine/game.js)awards第1393行、advance第2101行、saveSalaryEvaluation第2918行、settleProfessionalEnd第3227行。
- 測試：[RNG](../../tests/award-rng-policy.test.mjs)、[transaction](../../tests/award-transaction-policy.test.mjs)、[native Journal](../../tests/award-journal-native.test.mjs)、[salary evaluation](../../tests/salary-evaluation-receipt.test.mjs)、[payment](../../tests/season-payment-receipt.test.mjs)、[A原生Runtime](../../tools/development-a/runtime.mjs)、[B整合](../../tests/pitcher-award-integration.test.mjs)。
- 技術細節優先引用，不新增演算法、向量、Receipt schema或任意崩潰恢復承諾。設計checkpoint與產品phase名不是強制一對一；不能把合同／HOF全部混成付款Receipt。
- 既有相同輸入舊槽順序／R不變；第一合法實效果後差異需完整因果鏈；同版仍全量嚴格重播。沒有放寬整個S或awardDecisions。

## 4. AGENTS去重語意檢查

規則整理使用create-rule技能的範圍／可操作性原則；依使用者指定直接改AGENTS，不另建.mdc或新權限來源。

- **第6章標題**：二份相同標題合為一份；6.1不再同時指L分類與統一測試。
- **L1／L2／L3**：原定義與各級測試條款保留。L描述產品修改的驗證深度；狀態／RNG／確定流程仍升L3。
- **R0／R1／R2／R3**：原定義及六項共通原則保持。R描述影響範圍；R1是未接線模組，不是L1。
- **優先順序**：先判R；產品接線再套L，要求不同取較嚴格者；正式Gate更嚴格者不省略。個別明確指示若衝突依§8確認，不自行豁免。
- **Quick**：產品／一般測試修改仍原則相關測試＋Quick；R0文書查核與已證明未接線R1依原R規則。發現接線或狀態影響須升級，不能以R1標籤逃避測試。
- **Full**：L3/R3、main合併前、具體風險／正式Gate仍要求；實作中可先限定重測，最終需Full者仍取確定來源結果。不再用孤立的「機能完成」要求所有文件或每個R1都Full。
- **舊重複條款保留去向**：構文／404／Console／PC手機／最小修改在§6總則；固定Seed與亂數比較在6.1／6.2；外部Playwright、比較SHA、失敗分類在6.2／6.3；相關設計同步在6.4；公開workflow保護與check-workflow命令合併到6.2。
- **操作權限**：§7～§11原文完全不變；增加§6末交叉說明，測試及標準流程不解除任務禁止提交／部署。未擴大自主實作、提交或部署權限。

機械一致性核對：章外文字不變、R原定義／共通原則不變、L三段定義不變；所有原CURRENT_SPEC非空行保留；D2去除六個新anchor後全文與本輪開始完全相等。語意變更限於已批准的優先順序澄清及重複文字收斂，不代表兩份衝突舊文字能同時按最寬字面執行。

## 5. 靜態驗收與Git保全

- JSON：66個唯一M-ID、前後分類及處理統計、逐項來源與引用有效性檢查。
- 本地引用：修改文件及本報告／JSON的檔案路徑與明確anchor存在性檢查；六個D2及五個新增CURRENT_SPEC anchor唯一，舊anchor不移除。
- 精確diff可用 `git apply --reverse --check docs/reviews/DOCUMENT_AUDIT_1130_STAGE2_MIGRATION.diff` 檢查；只檢查、不套用或還原。沒有使用空白忽略選項作最終驗收。
- BACKLOG保持25完成／28未完成，53個唯一正式checkbox ID；D2-G9-RELEASE維持未完成，發布與Smoke完成、Linux Full NOT_ACCEPTED / DEFERRED、D2-CI-ARTIFACT-01 ARTIFACT_COVERAGE_BLOCKED保持分列。
- 原有5個modified及多個untracked成果都保留；其中CURRENT_SPEC／D2是明確批准文件，只有追加文字／anchor。fixture、工程計畫、原分析／JSON、原發布與失敗證據均不改。新增AGENTS修改，導航是在既有untracked內容上追加／限定替換。
- 未納入本輪編輯白名單的既有Git可見檔案以整體SHA256清單摘要前後比對；未執行會改動ignored test-results的命令。
- 產品、測試、Runner、CI、VERSION、golden、CHANGELOG未修改；沒有stage／commit／push／merge／部署或刪移封存。
- Quick／Full／Runtime／瀏覽器／CI均 **NOT_RUN（本任務禁止）**。只將文件檢查通過稱為靜態檢查PASS。

## 6. 未解除的技術與歷史依賴

本輪靜態結果：195個本地檔案引用無缺失、66個M-ID及處理統計一致；17個明確anchor在各自文件內唯一，全部本地fragment引用另行核對。精確diff不帶空白忽略的反向check成功；既有正式規格所有非空行、L1～L3原段、R0～R3定義／共通原則、AGENTS第6章外文字及D2除新增anchor外全文均保持。白名單外既有檔案清單SHA256摘要前後相同：`3A8047AE8023CAA5562FB4F9F1A9E643E56E64FA94E153A1FEADEEDE8418FE86`。這些是文書靜態PASS，不是產品或CI PASS。

1. D2§14.13.1～.6仍為詳細技術原文；本次是明確引用，不是已全部搬離或可刪除。
2. 原GV JSON、G2 Safari來源、A封存及v2校驗附錄、B locked／Receipt與因果鏈證據均保留。未重做原Full。
3. T01～T50／TR01～TR14／AN／F逐案例到實際log／manifest的完整核對仍待辦。保留原Gate，不把引用建立當個案Runtime驗收。
4. Decision Log與工程計畫保留舊AF09／NOT_IMPLEMENTED／NOT_RUN時點；由CURRENT_SPEC17.6／導航分層解讀。本輪未逐段改寫這些歷史文件。
5. D1／D2離線分析工具仍讀歷史MD／JSON；未驗證動態引用與再現完整性，不列刪除白名單。
6. 1.11.5架構快照未全面更新；B自然頂尖平衡與完整實機UI未補驗。
7. Linux Full延後與artifact保存完整性缺口未解除。正式發布不等於這兩項PASS。
8. BACKLOG廣義規格移轉／文件整理未結案；本輪66條群組處理不等於整個Repository所有MD／JSON語義審查完成。

未發現必須改產品邏輯或改已批准契約才能完成本輪文件範圍的矛盾。模組舊註解／錯誤reason中的NOT_IMPLEMENTED等歷史文字不在本輪程式修改範圍，不據此推翻現有live completion檢查。

完成後停止。第三階段、任何產品修正、Git提交或部署仍需另外明確批准。

# 1.13.0 MD／JSON整理計畫（僅盤點，未清理）

> 2026-10-18現況補註：本計畫的數量、路徑及保留要求是2026-10-16盤點快照。後續使用者已接受精簡歷史紀錄並放棄完整舊A／B測試輸出封存，工作區已遷移，舊OneDrive根目錄不再存在；見[精簡摘要](RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)。不改寫原FAIL／NOT_RUN／DEFERRED，也不把本清單當成新工作區刪除授權。正式規格、測試、golden、fixture及必要未提交成果仍須保留。

基準：正式來源 `650e4dd21718b4abec3876fc9ef6148714c21d4f`，正式Repository `15adf286e687ab2efc70e9e694ae024f75c3f10b`。產品1.13.0；當時本機dev包含既存dirty／untracked成果。逐檔清單及引用邊存於本機歷史附件`DOCUMENT_AUDIT_1130_INVENTORY.json`（約18.76MB，未納入本次提交；不是正式測試輸入或目前容量清單）。本次保留此計畫及精簡結論，不要求遠端讀者取得該本機附件。原盤點沒有執行Quick／Full、提交、推送或部署。

## 掃描統計

共28,586份、77,595,534,118 bytes（72.266GiB）；test-results 27,997份、docs/reviews 506份、docs/designs 9份、scripts 1份、tests 2份；docs/history不存在。其餘為根目錄、docs/design、archive、tasks與tools等。排除692個VCS／依賴／生成cache或symlink入口，清單詳列excluded；不追蹤symlink以避免重複／越界。

保守分類：A 9、B 1、F 4,520、G 24,056；C／D／E的「可執行刪除候選」均0。下文列出的C／D／E方向仍是待移轉／待核對建議，不是假稱已通過刪除條件。

19,210份小檔有逐位元相同副本，合計3,921群；1,634份有靜態可執行來源引用（含待確認basename命中）；1,309份大型文件未全文讀取。不是19,210份可刪除，也不是1,634份都已證明Runtime讀取。

JSON約18.76MB，採共享referenceSets及duplicateGroups避免重複存放引用與副本清單；file.referenceSet／duplicateGroup為0起算索引。保留機器清單本地使用，不建議直接加入正式配信。以JSON解析、唯一28,586路徑及全部共享索引有效性做文件驗證，沒有執行遊戲測試。

## 1. 結論與審查程度

這是一份保守的清理候選計畫，不是刪除授權，也不是逐條政策全部移轉完成證明。**立即可安全刪除：0份**。未證明不存在依賴、可重新產生或規格已完整轉移者，一律保留待確認。

機器清單覆蓋實際工作樹中的MD／JSON（含ignored test-results）；每份記錄路徑、容量、Git狀態、分類、動作、理由、風險、靜態引用及小檔案相同內容副本。內容語義審查集中在根正本、D2／分階段計畫、架構入口、基準附錄、現行產品相關模組及發布／CI證據；其餘逐檔標記MACHINE_SCAN_ONLY或UNVERIFIED。不能把路徑掃描稱為每份全文與程式已完成對照。

超大JSON不強制讀取或重新生成；未閱讀部分明示NOT_PROVEN。引用掃描不證明動態不可達：basename命中只是可能引用，不是可信依賴；字串拼接、外部校驗器、JSON manifest內的路徑與test-results內工具仍需專門驗證。沒有入邊不等於可刪除。

## 2. 分類與強制保留

- A：AGENTS.md、CURRENT_SPEC.md、BACKLOG.md、CHANGELOG.md、scripts/TESTING.md保留。docs/design四個架構入口保留但待更新，不把舊AST行號當1.13.0現況。
- B：未結案設計／工程計畫保留。tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md需拆開「已完成A/B、發布已完成、Full延後、artifact待辦」，不能整份以完成為由刪掉Gate及失敗恢復契約。
- C：已實作設計僅是候選；須逐條建立正式規格對應及程式／測試證據後才可轉成可刪除。現階段D2仍不能列為已證明可刪。
- D：已結案指令可移出日常導覽，但先保留批准原文、任務ID與唯一驗收條件；本輪未證明任何指令可以直接永久刪除。
- E：小檔SHA256相同者列於duplicateGroups；逐檔以duplicateGroup指向同群具體路徑。此次均受未提交、基準或依賴等保護，未標為可執行刪除候選。若未來解除保護，仍必須指定保留副本並核對原路徑依賴，不能只因相同就刪。
- F：研究原始生涯、策略、手機／Safari證據、批准決策、原始FAIL、A/B基準、locked及Linux證據保留。封存只是一項未執行建議，不改原始內容。
- G：用途、規格移轉或依賴未清楚者暫停處置。被程式／CI靜態引用的MD／JSON一律保護；未提交內容亦保護。

## 3. 逐份重點決策及刪除候選的限制

1. `docs/designs/PITCHER_AWARDS_PHASE1_DESIGN.md`：D1已被D2取代，候選C／F，建議從日常開發入口移出。但`docs/designs/pitcher-awards-d2-analysis.mjs:8,12`仍讀取D1 MD／附錄／JSON並校驗舊資料；當前不可刪。
2. `docs/designs/PITCHER_AWARDS_PHASE1_DATA_APPENDIX.md`、`docs/designs/PITCHER_AWARDS_PHASE1_ANALYSIS.json`：候選E／F，為舊研究基準與D2再分析輸入；不是可隨意清空的衍生垃圾。需保留原資料與可再現工具、舊hash及研究版本。
3. `docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md`：候選C但不通過移轉檢查。CURRENT_SPEC§17已包含獎項條件及主要效果，卻只摘要RNG／交易技術；D2§14仍有canonical framing、精度、可信來源、consumer矩陣、F系列故障Gate等不可丟失細節。且本檔有既存未提交4行，禁止處置。
4. `docs/designs/PITCHER_AWARDS_D2_DECISION_LOG.md`：F，批准決策的來源，應封存或保留精簡索引，不將批准過程全部混成現行規格，也不永久刪除。
5. `docs/designs/PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md`、`docs/designs/PITCHER_AWARDS_D2_ANALYSIS.json`：候選E但仍被離線分析工具及正式設計引用；舊13勝／新12勝、不同引擎與策略資料不能混寫。再現能力未實測，保留。
6. `docs/reviews/PITCHER_AWARDS_D21_MODEL_COMPARISON.md`與`docs/reviews/pitcher-awards-d21/`：歷史敏感性／批准模型證據，候選F。只把「最終選定規則」導向CURRENT_SPEC，不刪模型與手機OFFLINE_ESTIMATE來源。
7. `docs/reviews/PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md`、`docs/reviews/PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md`及`docs/reviews/development-a/BASELINE_VERIFIER_SUPPLEMENT.md`：F／保護。A基準v2校驗位置、55來源hash及原FAIL不可用一段PASS摘要取代。
8. `docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md`、`docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md`：候選D／F，歷史已過期但有Gate／回退／保留契約；建議合併現行導航，原文封存，不抹去當時限制。
9. `docs/reviews/LINUX_CI_FULL_1130_FAILURE_ANALYSIS.md`、`docs/reviews/LINUX_CI_FULL_1130_STABILITY_ACCEPTANCE.md`、`docs/reviews/LINUX_CHROMIUM_SHORT_TMP_FIX.md`、`docs/reviews/LINUX_FULL_38838485336_ACCEPTANCE.md`、`docs/reviews/LINUX_CHROMIUM_SMOKE_ACCEPTANCE.md`：F，未結案Full與CI證據，**禁止刪除**。Smoke PASS不能解除Full NOT_ACCEPTED／DEFERRED或ARTIFACT_COVERAGE_BLOCKED。
10. `docs/reviews/RELEASE_1130_PRODUCTION_ACCEPTANCE.md`：F，正式發布與Full豁免的唯一近期本地結果報告之一，未提交；保護。
11. `docs/reviews/pitcher-tc-research/`、`pitcher-tc-research-1119/`、`pitcher-tc-research-r3/`、`pitcher-tc-research-r4/`各MD／JSON：F。不是一般重複測試，包含不同引擎／策略自然生涯、失敗及零樣本；不重新跑來取代舊觀測。逐檔路徑在JSON。
12. `tests/fixtures/draft-income-routes.json`：保留；tests/draft-income-e2e.mjs:39直接讀取。`tools/development-a/g2-vectors.json`保留；tests/award-rng-policy.test.mjs直接讀取。
13. `docs/reviews/RETIREMENT_HOF_BALANCE_DATA_V1_11_1.json`：保留；tests/retirement-hof-report.mjs:4讀取，與歷史名人堂驗收配對。即使可生成，也不能在未批准再現前刪掉輸入證據。
14. `test-results/development-a-baseline-20261015-c3d413dd/`、所有B locked、Full原始失敗、`test-results/linux-full-38841657256-artifacts/`等Linux下載：F／保護。不可因正式發布已完成就認為Full已結案。其他test-results逐檔G或有條件E，不批量刪目錄。

## 4. 應補充的正式入口（僅建議，未修改）

- CURRENT_SPEC開頭與§17「準備中／未公開」應更新為已部署1.13.0，記錄來源SHA、正式站SHA及發布報告；不要把先前歷史NOT_RUN字句改成當時PASS。
- 正式技術規格應明確指出RNG key六欄順序、UTF-8長度framing、H1運算、u及golden vectors的可信來源。程式`award-rng-policy.js:20–55`有實作，不代表只留「H1」兩字已足夠再實作。
- 交易支援邊界、Decision可信身分、consumer-only alias不升格為P-ID、receipt衝突停止與F系列驗收需保留可追溯入口；不必把所有歷史測試結果抄入CURRENT_SPEC。
- 架構四份文件補1.13.0模組／接線增量；舊1.11.5 AST保留標示快照，不直接改歷史數字。

## 5. 應補充BACKLOG的狀態（不自行建新ID）

- D2-G9-RELEASE需拆開「正式發布及基本Smoke已成功」和其他殘留Gate，依使用者發布豁免更新完成條件，不能假造Full成功或直接宣稱全部Gate完成。
- Linux Full明示NOT_ACCEPTED / DEFERRED；終止訊號來源仍不明。D2-CI-ARTIFACT-01保持ARTIFACT_COVERAGE_BLOCKED，不因第1批保存成功結案。
- 增列／確認「技術規格移轉索引」「歷史來源引用遷移」「文件唯一入口」工作，再獨立批准；現有AUD-02及架構未完成不能藉清理結案。

## 6. 矛盾／重複

- AGENTS重複兩個第6章、多組6.1；L1～L3與R0～R3測試規則並列，另有舊「每次Quick」條文。需之後明確唯一層級與更嚴格Gate優先，不能在本輪直接刪規則。
- CURRENT_SPEC／BACKLOG／D2工程計畫仍有未提交、未發布、AF09未授權文字；與正式1.13.0已發布及A/B接受狀態不一致。歷史註記存在但閱讀入口仍容易誤判。
- D2§14保留PLANNED／NOT_RUN、REPRODUCED／NOT_FIXED，但G1-A及A/B已有後續證據。應封存設計快照並新增現行狀態索引，而非覆寫舊報告。
- 基準校驗附錄實際位置在`docs/reviews/development-a/BASELINE_VERIFIER_SUPPLEMENT.md`，不是reviews根目錄；後續導航不可沿舊任務的簡寫假設位置。
- 研究第一輪1.11.8與後續1.11.9，以及不同策略，不能合併為同一母體；A/B Full與Linux中斷結果不可統一成PASS。

## 7. 建議執行順序與回退

1. 先批准修正正式導航的時點／狀態文字，不刪原件；保護dirty與Linux證據。
2. 為每份設計建立條款→CURRENT_SPEC→程式→測試／證據映射；未完成者維持G，獨有重要條款先移轉或保留技術正本。
3. 建一個精簡日常入口，指向AGENTS／CURRENT_SPEC／BACKLOG／TESTING／現行架構，將過時文件的導航移出，保留歷史連結可追溯。
4. 先審查逐檔E候選的相同副本、路徑引用及manifest；不能動態證明的候選不刪。每批以明確白名單批准，不用全目錄glob。
5. 歷史F另訂受控封存位置／SHA256／還原測試／權限；只在驗證工具和相對引用完成更新後才移動。封存不可等於重新生成歷史證據。
6. 最後才批准刪除已完整移轉、無任何依賴的C/D/E；刪前留可還原commit或封存包。現階段不提出任何不可恢復刪除。

文書盤點不需Quick／Full，也不重啟已暫停Full調查。清單與本報告是新產出，既有文件、數值、測試與產物不改寫。

盤點工具留在ignored `test-results/document-audit-1130/`；掃描初版在大量引用處理耗時而中止，後改為有界文字來源、線性token與共享群組，僅對最後成功結果作上述統計。JSON內容（包括manifest）沒有作引用來源掃描，這是重要未完成範圍，不以無入邊當無依賴。全倉逐條規格語義遷移審查尚未完成，不能宣稱「全面規格核對完成」；目前已完成的是逐檔盤點、保守保護分類與重點正本／D2差異調查。

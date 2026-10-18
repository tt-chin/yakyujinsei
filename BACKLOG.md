# BACKLOG — 野球人生（日文版）

## 現行狀態索引（2026-10-16／1.13.0）

- **正式發布及基本Smoke：SUCCESS**。來源／main `650e4dd21718b4abec3876fc9ef6148714c21d4f`，正式Repository `15adf286e687ab2efc70e9e694ae024f75c3f10b`。同SHA Quick61 PASS，正式站六組基本Smoke PASS；[發布證據](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md#g9與正式1130)。手機尺寸模擬不是實機，基本Smoke不是完整生涯。
- **Linux Full：NOT_ACCEPTED / DEFERRED**。Run38841657256為18 PASS／1中斷／61未執行、exit143；Aggregate未執行。停止調查／修正／重跑，保留全部原件。[發布豁免及Full限制](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md)。
- **D2-CI-ARTIFACT-01：ARTIFACT_COVERAGE_BLOCKED**。分批artifact／Linux最小Smoke成功不等於完整S／RNG／Decision／Receipt可還原證據保存合格；[保存缺口](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)及[分批限制](docs/reviews/LINUX_CI_FULL_1130_STABILITY_ACCEPTANCE.md)。
- **文件整理／規格移轉：未完成**。本輪只同步入口；逐條移轉、動態引用、1,309份大型文件語義審查與清理均未完成。[整理計畫](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md)／[導航](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md#1-目前基準與閱讀入口)。不因此結案AUD-02或REFACTOR-AUDIT-01；本輪未新增或改動正式checkbox，25完成／28未完成仍須與下方殘項分開理解。

下方「本次提交前快照」、舊main／未授權／未公開及歷史階段統計均保留其原時點；不得覆蓋本索引。D2-G9-RELEASE的當前剩餘範圍見該正式待辦，不把已完成正式發布誤讀為仍未授權。

> 最新D2狀態（本次提交前快照）：2026-10-15｜dev基準HEAD `56e72d9792529f3221c1a1ffadaf563bceebe26d`／config VERSION 1.13.0。使用者已接受A／B與1.13.0限定準備驗收，並批准本次精確dev提交／推送及Linux Full啟動；截至本文件更新，Linux實際驗證尚未執行，不預寫CI／Preview／發布PASS。最新本機Quick61及collector限定47案已通過；舊B Full80仍為1.12.0歷史結果。本次採Linux CI優先，artifact完整封存不作為Full啟動前置，保存缺口另以D2-CI-ARTIFACT-01追蹤。CI測試結果、workflow結果與artifact完整性分別報告。[CI與證據驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)／[原G9報告](docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)／[發布準備](docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)。以下歷史數字與待審文字保留當時範圍，不代表目前授權或發布狀態。

> 最新限定結案：2026-10-14｜dev 1.12.0，G1-A **PASS / ACCEPTED**（使用者批准）。受驗基準HEAD `554d54a94352b7dbc86473084a65b56bef74d3b7`＋G1-A工作樹；Windows Quick48／Full67入口、88唯一原生fixture通過，正式CI／Preview未執行。僅結案兩項日文名稱漏判，不開始G1-B，不發布。見[G1-A驗收](docs/reviews/G1_A_LIMITED_FIX_ACCEPTANCE.md)及[可攜執行結果](docs/reviews/g1-a-validation/test-expectation-acceptance.json)。下列2026-10-13及此前版本／部署敘述保留為歷史快照。

> 更新：2026-10-13｜dev 1.11.9全力投球修復驗收完成。受驗程式`a1658c994713fd1fb8f66857dab33df0ff6548fd`，Linux Quick47／Full65入口及Preview29案PASS；基準`20920dddd72ab8c91b0e2c71d560492663cd5aec`。下方舊版結果保留為歷史證據；main／本番仍為1.11.4。
> 保留第一至第十階段歷史證據。第七階段Full／Preview受驗程式SHA為`13abcf5f8b9f5ba47bcdfc796be6e4e79267bf4e`；本輪另批准回國retry與grinder最小修復，歷史數據不冒充此版結果。提交與CI／Preview證據見最末節。

## 1. 最新進度總覽

| 指標 | 數量 | 說明 |
|---|---:|---|
| 已完成 | **25** | D2投手三冠按已接受本地範圍結案；不等於正式發布 |
| 未完成 | **28** | 原27項另加D2-CI-ARTIFACT-01；D2-G9-RELEASE保持未完成 |
| P0 未完成 | **0** | 既有 P0 已按核准的結案標準關閉 |
| BLOCKED | **4** | 三項實機／分享，另加ARTIFACT_COVERAGE_BLOCKED；後者不阻擋Linux Full啟動 |
| IMPLEMENTED_UNVERIFIED | **4** | 全力投球驗收完成，其他四項保留 |
| DESIGN_PENDING | **7** | 增加smallschool出生高校／舊tier映射決策 |
| 其他候補／保留／混合 | **13** | 包含歷史細項待核對，不等於已核准開發 |

以上依唯一正式checkbox重新計算：**25 + 28 = 53**。前輪TRAIT-PITCHER-TC已按本地接受範圍結案；本輪只同步Linux CI優先策略、保留D2-G9-RELEASE未完成並新增D2-CI-ARTIFACT-01，不改其他52個既有ID的完成狀態。全力投球1.11.9的Linux Quick47／Full65及Preview29案、1.11.6與1.11.7的測試數字仍為各版歷史證據，不冒充D2結果。啟動Linux Full仍須核對本次推送SHA與實際Run，未啟動前不標CI_IN_PROGRESS。其他smallschool／COPY等較早描述與後續專項文件的時點差異不在本輪整理，保持獨立範圍。前十階段歷史數字與報告不改寫。

### 1.1 開發階段完成履歷

| 階段 | 主題 | 對應 ID | 結果 | 驗收報告 |
|---|---|---|---|---|
| 第一階段 | KBO 續約年俸下限修復 | `BUG-KBO-RENEWAL-FLOOR` | **完成** | [KBO_RENEWAL_FLOOR_FIX.md](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md) |
| 第二階段 | 成績按鈕、指名入團後選項 | `BUG-ACT-01`、`BUG-ACT-02` | **完成（現行功能驗收）** | [ACT_01_02_FINAL_ACCEPTANCE.md](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md) |
| 第三階段 | 行動／契約與年俸回歸 | `BUG-ACT-03`、`BUG-SAL-01` | **完成** | [CONTRACT_SALARY_ACCEPTANCE_AUDIT.md](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md) |
| 第四階段 | 統一測試 Runner 與 Linux CI | `TEST-RUNNER-01`、`TEST-CI-01` | **完成** | [TEST_INFRA_ACCEPTANCE.md](docs/reviews/TEST_INFRA_ACCEPTANCE.md) |
| 第五階段 | 現行規格與程式架構稽核 | `AUD-02`、`REFACTOR-AUDIT-01` | **調查與路線文件完成；完整驗收／動態可達性證據仍未完成** | [稽核](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)／[分批路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md) |
| 第六階段 | 能力配分、狀態一致性及引用補強 | `AUD-03B`、`STATE-TRANSACTION-AUDIT-01`、`SPEC-SOURCE-LINK-01` | **調查與引用修復完成；5個風險斷言FAIL，當時修復待批准** | [第六階段驗收](docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md) |
| 第七階段 | 能力配分與交易安全最小修復 | 三項安全修復、`AUD-03B`、`STATE-TRANSACTION-AUDIT-01` | **批准範圍修復與驗收完成；非全S交易rollback** | [第七階段驗收](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md) |
| 第八階段 | 歷史規格與AGENTS指示稽核 | `AUD-04`、`AUD-05` | **調查／分類完成；完整歷史細項仍獨立待核對，不移入舊政策** | [歷史規格](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)／[AGENTS歷史](docs/reviews/STAGE8_AGENTS_HISTORY_AUDIT.md) |
| 第九階段 | 從現行程式建立技術詳細設計 | 現行技術文件；既有三個未完稽核ID保持 | **12章與附錄／來源建檔；非全行為驗收，歷史任务縮範圍只提案** | [主設計](docs/design/CURRENT_DETAILED_DESIGN.md)／[驗收及缺口](docs/reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md) |
| 第十階段 | U07／U03／回國例外／LEGACY | 新增兩個待修復ID；既有稽核保持 | **歷史調查快照：當時正常稱號Bug1項、例外恢復風險1項未修復** | [調查報告](docs/reviews/STAGE10_PRE_REFACTOR_RISK_INVESTIGATION.md) |
| 第十階段修復 | 回國retry／grinder | 兩修復ID；smallschool獨立待決 | **核准修復與本機／Linux Full／Preview驗收完成；非全面交易保證** | [修復驗收](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md) |
| 特性顯示統一 | 取得當下說明／以後名稱 | `TRAIT-DISPLAY-UNIFY-01` | **指定顯示範圍完成；Linux Quick45／Full61及Preview18 PASS** | [驗收](docs/reviews/TRAIT_DISPLAY_UNIFICATION_ACCEPTANCE.md) |
| v1.11.8本大会個人成績 | 保存既有生成結果／結果卡顯示 | `INT-01`前置（非履歷列表結案） | **本機Quick46／Full63及指定Preview43案PASS；重新部署成功** | [驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)／本檔末節 |
| v1.11.9全力投球 | callback值最小修復 | `BUG-PITCH-EFFORT-01` | **Linux Quick47／Full65、新專項36及Preview29案PASS** | [驗收](docs/reviews/FULL_POWER_PITCHING_ACCEPTANCE.md)／本檔末節 |

**D2獨立Gate履歷（2026-10-15）**：A0／G2～G4與G5～G8已獲使用者接受，B本機提交56e72d9。1.13.0發布準備、120分鐘timeout及collector限定驗收已接受；本次另批精確dev提交／推送與Linux Full啟動，不等於Full結果PASS。CI／Preview／正式發布與smoke未驗收，D2-G9-RELEASE保持未完成；artifact保存缺口另列D2-CI-ARTIFACT-01，不作Full啟動阻擋。這不是前述「第九階段」技術文件調查，兩者不可混用。見[G9報告](docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)與[CI證據驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)。

上述「階段」是方便管理的索引，**不是新的任務 ID**。此外還有兩項已完成的歷史稽核／測試盤點及一項殿堂錯置修復，列於第 2 節。

### 1.2 目前開發基準與限制

- **最新全力投球受驗程式：** `a1658c994713fd1fb8f66857dab33df0ff6548fd`、1.11.9。Linux Quick47／Full65入口、新專項36及Preview29案PASS；完整證據見末節。其他版本均為各自歷史受驗範圍，不沿用舊PASS冒充新版測試。
- **上輪已提交的受驗程式 SHA：** `6020df03ca507c456233005d22bfe36c3d21f306`，1.11.7；本機／Preview已驗證，Linux Quick45及Full61入口均PASS，見末節。此前Linux Full受驗SHA `b2e01509c0ea75712579f53d864ecd09f710840c`、1.11.6及第七階段SHA `13abcf5f8b9f5ba47bcdfc796be6e4e79267bf4e`保留為歷史；後續純文件HEAD不冒充受驗程式SHA。
- **國際大会顯示最新受驗程式：** `2924dd03f1bf0fecac0f1673f07c10df92546114`、1.11.8。修正前完整SHA `e602174a22d7472e1021d780388ad61adc6b11b6`＋1.11.8作業樹已實際Quick46／Full63入口PASS；新專用單体15／E2E50案、6條生涯完整S／選擇／RNG一致，僅排除version及新增personalStats。Quick CI success；同程式SHA重新部署success，固定Preview指定遠端43案PASS。遠端受驗HEAD為`6bfa070b914259664ef80ccee2cae4af5bc4d24f`，其docs/index.html／src／styles與2924dd0零差異，48配信HTML/JS/CSS與受驗來源一致。此版結果卡的Preview驗收完成，實機／Linux Full等限制保留；歷史一覧INT-01仍未完成，不擴大其他結案。[驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)
- **第八階段文件與Quick受驗SHA：** `b38146e69288346a120db5b2d079ce0a7983aaae`；從`a5ed616418e1eb3611c6f714b5f2cf75161ba550`開始調查，遊戲程式樹不變。CI Run 38183631042成功；本次證據補記僅改BACKLOG，文件Commit另見Git／最終回報。
- **第九階段調查基準：** `ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1`；40模組、997函式語法節點、39核心函式契約、124直接S根欄位及196RNG相關語法點重新盤點。技術文件不是新政策，動態可達性／完整S寫集仍未證明；退休舊欄位等新補驗提案見報告，不修改程式或直接結案。
- **第九階段CI受驗文件SHA：** `e422b45bab38cc7a9632f89b2558bd296dcf0d5a`；Linux Quick Run 38187518145成功。五份技術文件與BACKLOG已提交，遊戲資產與調查基準ea951c2相同；後續純BACKLOG證據提交不冒充另一次已執行CI。
- **第十階段調查基準：** `fc879dc73cb8a3886d2812a42443c6192d1f6191`；新測試只登錄Full／Audit，不加入Quick；Quick45／Full60／Audit61入口。指定調查入口exit1（34 PASS／10 FAIL），因此目前不能宣稱新Full／Audit全綠；遊戲樹與基準相同。
- **第七階段歷史 VERSION：** dev `1.11.5`；main／正式網站仍為`1.11.4`。只修復核准的能力callback、CORP重入與signTo簽約／描畫重試；正常S／選擇歷史／年表／RNG維持1.11.4基準。
- **第十階段修復歷史 VERSION：** 1.11.6，只再修當輪批准兩項；上列1.11.5是歷史受驗範圍。出生potSum0與引退grinder為允許差異，其餘正常S／選擇／RNG保持。[當輪驗收](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)
- **特性顯示dev VERSION：** 1.11.7；上列1.11.6為此前修復受驗版本。取得當下的結果說明於下一操作／導航歸檔為名稱，其他清單、退休概要／PNG只名称。提交／Quick CI／Preview與本次Linux Full證據見末節，不把前輪Full當成本次通過。
- ACT-01 已按「現行功能」標準結案，但原始完整操作歷史不足，**沒有精確重現歷史故障路線，也沒有證明當年的根本原因**。
- ACT-02 的指名後第一選項、listener、單次執行及下一年度推進已通過指定矩陣；不宣稱所有未知路線均驗證。
- 320px／390px 是瀏覽器手機尺寸模擬，不能替代 iOS Safari／Android Chrome 實機。
- GitHub Actions 已能執行測試；**Branch Protection／Ruleset 強制合併檢查尚未設定**。
- 未經使用者明確批准，不得修改 `main`、正式網站、遊戲平衡、RNG、年俸／契約政策或殿堂係數。

## 2. 已完成工作（25 項）

### 2.1 第一至第四階段

- [x] **BUG-KBO-RENEWAL-FLOOR** — KBO 候選年俸下限與 package 上限順序修復；v1.11.3，相關固定 Seed、自然生涯、PC／手機模擬與 Preview 通過。[證據](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md)
- [x] **BUG-ACT-01** — 「今季の成績を見る」現行操作路線、投手／野手、返回、重複點擊、後續操作及 S／RNG 回歸通過；**原始路線未精確重現**。2026-10-11。[證據](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)
- [x] **BUG-ACT-02** — P／IF × HS／U／CORP／IND × 正式／育成 × 三尺寸，共 48 組入團驗收；第一選項 DOM、listener、付款去重及下一年度推進通過。2026-10-11。[證據](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)
- [x] **BUG-ACT-03** — 原生行動／契約邊界、傷病×滿期×降格、自然生涯等已在第三階段驗收。v1.11.4；未驗證範圍以報告為準。[證據](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)
- [x] **BUG-SAL-01** — MiLB 降格後 NPB 候選年俸顯示、候選接受與次年支付等驗收；v1.11.4，不保證所有 Seed／實機。[證據](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)
- [x] **TEST-RUNNER-01** — `scripts/test.mjs` 的 `list/quick/full/audit`、61 個測試相關檔案分類、FAIL／BLOCKED 非零、證據與重用檢查。2026-10-11。[證據](docs/reviews/TEST_INFRA_ACCEPTANCE.md)
- [x] **TEST-CI-01** — `dev` push quick、對 `main` PR full、手動 quick/full/audit；Linux 實際 Quick 44／44、Full 55／55、Audit 56／56 自動入口通過，Audit 另有 10 SKIP。2026-10-11。[證據](docs/reviews/TEST_INFRA_ACCEPTANCE.md)

### 2.2 其他已完成項目

- [x] **BUG-HOF-FIRST-BALLOT-LEAGUE** — 殿堂首輪聯盟判定錯置修復；31 案例及指定邊界通過，**自然跨聯盟入選率仍待研究**。v1.11.2。[歷史稽核](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)
- [x] **TEST-COVERAGE-01** — 當時 54 個測試檔案的入口／依賴盤點已完成；**不是 100% 程式覆蓋率**。後續第四階段已更新為 61 個檔案。[歷史稽核](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)
- [x] **AUD-01B** — 指定快照的正式／Preview 資產一致性比對完成；不保證所有 CDN 節點或未來部署。[歷史稽核](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)
- [x] **SPEC-SOURCE-LINK-01** — 2026-10-11。CURRENT_SPEC五個已刪原文的失效引用改為刪除前固定Git來源；4個現存本地link及5個歷史blob驗證PASS，其他文字／數值不變，不恢復舊文件或政策。[第六階段證據](docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md)

### 2.3 第七階段（2026-10-12；受驗程式13abcf5）

- [x] **AUD-03B** — 能力89案與補充session矩陣、PC／320／390、Undo／reset、鍵盤、carry／combo／late均通過。保留原carry結構差異；不宣稱所有Seed／實機皆驗收。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)
- [x] **STATE-TRANSACTION-AUDIT-01** — 原生CORP重入、明示簽約fault injection原5案與補充失敗／下一年度付款通過。指定風險修復完成，不代表全面交易安全或自然UI故障重現。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)
- [x] **ALLOC-STALE-CALLBACK-01** — 同S／世代／DOM／未完session guard使過期行、Undo、reset、確定無作用；pool不負數、done只一次，正常觸控／鍵盤與RNG不變。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)
- [x] **STATE-CORP-REENTRY-01** — 同S／年度成功決算不重付；付款前與付款後描畫故障再試不誤標成功、不重付；下一年度及原生事件收入通過。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)
- [x] **STATE-SIGN-ATOMICITY-01** — 契約驗證成功後提交所屬／連番；付款後描畫重試保留contractId與5000萬契約金，次年度600萬年俸只付一次。明示fault injection，不宣稱自然路線已重現。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)

### 2.4 第八階段（2026-10-12；基準a5ed616）

- [x] **AUD-04** — 歷史文件盤點、主要數值／事件／API差異分類及來源報告完成。59筆文件：CURRENT6／SUPERSEDED38／OBSOLETE0（整份文件）／UNVERIFIED8／DESIGN_PENDING7；個別廢止條文另列。16階層／14曲線／90球團ID名稱對照一致；**不宣稱全部原文條款驗收或已移管**。未驗細項獨立保留HIST-SPEC-CLAUSE-01；依最新指令只提出CURRENT補充建議，不改正本。[證據](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)
- [x] **AUD-05** — 9份封存與7個Git根AGENTS版本（8組不同LF內容）對照完成；14政策群組中4組恢復會衝突、4組過時／缺口、6組一致，現行AGENTS不修改。舊指令不恢復。[證據](docs/reviews/STAGE8_AGENTS_HISTORY_AUDIT.md)

### 2.5 第十階段核准修復（2026-10-12；受驗程式b2e0150）

- [x] **TRAIT-INITIAL-STATE-FIX-01** — 僅按批准的grinder範圍結案：newState保存出生pot合計，正常IF463生涯取得；7個P／IF門檻／缺資料／既取得fixture及未改造修復前S／R逐步比較通過。smallschool移交獨立待決ID。Linux Full60、Preview59 PASS。[驗收](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)
- [x] **STATE-NPB-RETURN-RETRY-01** — 三故障點×三尺寸9案、正常3案及連續描畫／殘留補驗通過。首次年數、已驗證contractId及付款後重畫重用，下一操作／次年支付正常。明示fault injection、回國bonus0，非自然故障根因證明或全S rollback。Linux Full60、Preview59 PASS。[驗收](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)

### 2.6 特性顯示統一（2026-10-12；受驗程式6020df0）

- [x] **TRAIT-DISPLAY-UNIFY-01** — 全38 ID清查、取得當下原因／效果、失去／歷史名稱、退休新解鎖與概要、PNG及P／IF完整S/RNG對照通過。Linux Quick45／Full61入口及Preview18案PASS，CI受驗完整SHA與連結見末節。僅結案指定顯示範圍；未實裝3項不啟用，academy／taiwan自然取得路線未證明，smallschool語意仍獨立待決，不補造條件或宣稱所有自然取得路線已驗證。[驗收](docs/reviews/TRAIT_DISPLAY_UNIFICATION_ACCEPTANCE.md)

### 2.7 全力投球最小修復（2026-10-13；受驗程式a1658c9）

- [x] **BUG-PITCH-EFFORT-01** — 僅修正callback的S.effort寫入值，全力投→全力投球；原生53案、Linux Quick47／Full65入口、新專項36案及Preview29案PASS。通常／省エネ投手與IF完整S／選擇／RNG保持，全力成績／TJ及後續分支差異可追溯且新版重播一致。不改公式、係數、直接R呼叫或舊fallback；歷史測試採真實通常投球控制，不增加S排除。CI／Preview及本機失敗保留見末節。[驗收](docs/reviews/FULL_POWER_PITCHING_ACCEPTANCE.md)

### 2.8 G1-A 限定前置修正（2026-10-14；PASS / ACCEPTED）

- [x] **BUG-AWARD-PHOENIX-JP-01** — 使用者正式接受日文最優秀投手賞／首位打者／本塁打王復活漏判修復。glass解除、phoenix一次、pool+8；GoldGlove／All-Star不新增资格；歷史名稱保持。原7漏判及88唯一原生fixture通過，兩個Full期待值修正後Windows Quick48／Full67入口PASS。保留原65／2失敗證據；僅限定G1-A，不實作新獎。[驗收](docs/reviews/G1_A_LIMITED_FIX_ACCEPTANCE.md)
- [x] **BUG-AWARD-DEMOTION-JP-01** — 使用者正式接受當年度日文最優秀投手賞／首位打者／ゴールデングラブ賞保護漏判修復；goodReal與公式不改，All-Star不新增保護。88原生fixture及回歸通過；B08跳過既有55%降格抽選的R1→0為已追溯短路，非額外抽選。CI／Preview／實機未執行，不能冒充全ID consumer完成。[驗收](docs/reviews/G1_A_LIMITED_FIX_ACCEPTANCE.md)

### 2.9 D2投手獎項本地接受（2026-10-15）

- [x] **TRAIT-PITCHER-TC** — `LOCAL_PASS / USER_ACCEPTED`。正式P01～P08第一階段及可信同年同聯盟三實得P07／pitcherTC／MVP已由A與B驗收並獲使用者接受；B本機提交56e72d9792529f3221c1a1ffadaf563bceebe26d。Quick61／Full80、原生producer→Decision→Receipt→Consumer、PC／320／390及四條A策略／同B重播證據見[B驗收](docs/reviews/PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md)。新獎自然平衡與完整B實機UI仍未驗證；版本／CI／Preview／發布由D2-G9-RELEASE獨立追蹤，不混為已發布。

## 3. 未完成工作（27 項）

### 3.1 P1 — 規格、回歸驗證與待決（4 項）

- [ ] **AUD-02** — `IMPLEMENTED_UNVERIFIED`。第五階段完成16章／84規格群組對照：MATCH49、MISMATCH3、UNVERIFIED27、DESIGN_PENDING1、OBSOLETE4；quick44 PASS。完整數值邊界、全DOM／跨功能互動及實機仍缺，**調查完成不等於全規格驗收完成**。[2026-10-11證據](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)。發現差異僅記錄，不修改遊戲。
- [ ] **REFACTOR-AUDIT-01** — `IMPLEMENTED_UNVERIFIED`。第五階段已建主要S讀寫地圖、40模組AST索引（991函式節點／4193呼叫節點）、196 RNG語法點、32頂層覆寫群組、LEGACY委派與[分批路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md)。動態scope／所有callback可達性未完全證明，保持未完成；**沒有批准大規模重構或刪除舊碼**。[2026-10-11證據](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)。2026-10-18另立[game.js物件導向化分期計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md)（第1期`Rng`）。第1期已於同日本機實作並完成L3驗證（基準`650e4dd`、許容差分無；Full 79 PASS／2 FAIL，2件FAIL於未改HEAD同樣發生，見計畫§2.9），尚未併入`dev`；第1b期已列入、細部計畫待批。不改變本ID狀態。
- [ ] **HIST-SPEC-CLAUSE-01** — `未完成細項對照`。第八階段盤點與差異分類已完成，但兩份大詳細設計的全數值／學校tier地域／§19–22舊API與翻譯條款、參考作品分析的每條公式及更早Git修訂尚未逐條核對。建立原始固定來源→現行對應→證據台帳，與AUD-02現行功能驗收、COPY-01可到達文案驗收分開；未經批准不移入正式規格、不恢復舊規則、不刪原文。[範圍與限制](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)

- [ ] **TRAIT-SMALLSCHOOL-SEMANTICS-01** — `DESIGN_PENDING`。從原出生欄位修復範圍按本輪使用者批准分離；確認出生高校定義與schoolTier B是否對應舊hsTier3，再決定快照／相容讀取。保留既取得狀態、不得用升學後tier推測、不補造舊人生；目前不修改條件。[界線及證據](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)

### 3.2 P1 — 退休與殿堂研究、決策（6 項）

- [ ] **HOF-NATURAL-SAMPLE-01** — `IMPLEMENTED_UNVERIFIED`。現有固定案例及 50 條完成生涯，但自然生涯沒有足夠到達 KBO／MLB 一軍的樣本；四聯盟比較與 4,000 有效生涯目標尚未完成。先改進研究路線與樣本品質，**不修改殿堂規則**。
- [ ] **HOF-BUCKET-DECISION-01** — `DESIGN_PENDING`。決定 NPB／CPBL／KBO 的育成、二軍、一軍成績在殿堂評價中如何合算；MiLB 目前不併入 MLB。
- [ ] **HOF-PITCHER-BALANCE-01** — `DESIGN_PENDING`。以自然生涯評估 SP／MR／CL 與 HLD、ERA、WHIP、L 等投手指標；A／B／C 方案仍是假說，係數未批准。
- [ ] **HOF-HONOR-POLICY-01** — `DESIGN_PENDING`。確認 MVP、最優秀投手、部門／守備獎對殿堂投票候選的保證規則，以及國際／加盟球團加分範圍。
- [ ] **HOF-DISPLAY-ROUND-01** — `DESIGN_PENDING`。如 raw 7999.8 顯示 8000，是否造成門檻誤解；是否補註或調整顯示需決策，未批准修改判定。
- [ ] **HOF-VOTE-STORY-01** — `DESIGN_PENDING`。檢查 i=0 確定性殿堂演出、i=1 候選止步的說明是否容易被誤認為隨機投票；未批准概率化。

### 3.3 P1 — 實機與日文文案（4 項）

- [ ] **EVT-1102-ANDROID** — `BLOCKED`。Android Chrome 實機的年度事件去重、途中 Seed 分享驗收。
- [ ] **UI-17-DEVICE** — `BLOCKED`。iOS Safari／Android Chrome 實機的顯示設定與事件驗收；功能已公開，**不是未實作**。
- [ ] **SHARE-111-DEVICE** — `BLOCKED`。iPhone／Android／PC 的原生 share sheet、取消、PNG 主題、圖片分享與儲存驗收。
- [ ] **COPY-01** — `IMPLEMENTED_UNVERIFIED`。重新檢查所有可到達的日文文案、野球術語與畫面位置；與 v1.8.2 的 92 事件翻譯替換分開管理，不擅自全面重翻。

### 3.4 P2 — 規格待決與保留（5 項）

- [ ] **OVR-01** — `DESIGN_PENDING`。野手 OVR 加入 stamina 5% 的提案，先比較現行公式與提案，批准後才能修改。
- [ ] **TRAIT-NITENICHI** — `承認済み保留`。二天一流，須先有獲批准的二刀流及投手三冠制度。
- [ ] **TRAIT-CHAMPIONMAKER** — `承認済み保留`。優勝請負人，待累計 5 冠、計算範圍、勝率加成及 RNG 政策核准。
- [ ] **CONTRACT-LEGACY-01** — `重構候補・要調査`。確認舊 `makeOffers`／`pickOfferUI`／市場定義是否真正不可達；未驗證固定 Seed、契約回歸前不得刪除。
- [ ] **CONTRACT-ASIA-01** — `未実装・仕様待ち`。KBO 亞洲名額及球團整體外國人預算，與現有 `FOREIGN_STANDARD` 不同。

### 3.5 P2 — 未來功能候補（7 項）

- [ ] **INJ-UI-01** — 一般受傷風險細項顯示；計算與 UI 維持單一資料來源。
- [ ] **PLY-01** — 背號與年度履歷；需先決定 00、轉隊、重複及改號規則。
- [ ] **INT-01** — 各項國際賽事履歷；重用既有結果，不增加 RNG 抽選。1.11.8僅補既存大会結果卡的本大会個人成績及personalStats快照，未新增履歷列表，本ID仍未完成。[本大会顯示驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)
- [ ] **EVT-01** — 事件分類顯示；不得改變抽選候選及順序。
- [ ] **UI-06** — 新手遊戲內說明。
- [ ] **UI-07** — 遊戲內更新履歷；CHANGELOG 仍為唯一正式來源。
- [ ] **PLY-02** — 永久欠番；以前述背號履歷為前提，待組織、年數、成績及 RNG 規則批准。

### 3.6 P1 — D2發布準備與獨立CI證據待辦（2 項）

- [ ] **D2-G9-RELEASE** — `RELEASED / RESIDUAL_GATES_DEFERRED`。正式1.13.0發布與基本Smoke已完成，來源650e4dd／正式站15adf28，見[發布驗收](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md#g9與正式1130)。Linux Full仍NOT_ACCEPTED / DEFERRED；原Gate及未完成證據／文件整理未被豁免為PASS，故本項暫保持未完成，待另行審查殘項與結案範圍。不重新授權Full或部署。

> 歷史準備快照（2026-10-15，保留原時點）：`RELEASE_PREPARATION / RELEASE_NOT_VERIFIED`。1.13.0 MINOR、CHANGELOG與限定準備驗收已接受；精確dev commit／push及Linux Full啟動已獲本次批准。Linux實際驗證截至本次提交前尚未執行；只有確認Run與受驗SHA後才報CI_IN_PROGRESS，不能預報PASS。CI／最新SHA Preview／使用者確認／正式發布／smoke全部完成前維持未完成；main合併、正式同步及部署仍未授權。artifact問題由D2-CI-ARTIFACT-01獨立追蹤，不阻擋先跑Full，也不因Full PASS而自動結案。來源與限制見[發布準備](docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)及[CI證據驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)；[原G9報告](docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)保留為歷史。不得清理A／B或歷史JSON。

- [ ] **D2-CI-ARTIFACT-01** — `ARTIFACT_COVERAGE_BLOCKED`。已實際執行Linux CI、短路徑Smoke與分批上傳；第1批保存成功不能解除完整原件保存缺口。bounded collector仍未接入正式CI；原始S／RNG／Decision／Receipt的可還原保存契約、容量／敏感路徑及還原驗證未完成。[缺口](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)／[分批限制](docs/reviews/LINUX_CI_FULL_1130_STABILITY_ACCEPTANCE.md)。本項維持未完成，不重跑Full、不刪證據。

> 歷史準備快照（2026-10-15，保留原時點）：`ARTIFACT_COVERAGE_BLOCKED`。CI job timeout已由60提高至120分鐘，但Linux實際驗證截至本次提交前尚未執行。bounded evidence collector限定測試47 PASS／0 FAIL，尚未接入正式CI；現有artifact glob保持，Full原始S／RNG／Decision／Receipt等證據仍有保存缺口。使用者接受先啟動Linux CI Full，完整封存另行改善；CI Full執行結果、workflow／上傳結果與artifact完整性須分開報告，保存完整性不得標PASS。結案需核准並驗證Gate→case→原件保存契約、超大JSON／64MiB上限處理、敏感路徑安全保存、缺失／損壞／超額與下載還原一致性；不得只用hash索引冒充完整可重播證據。未另行批准不接collector、不取代或擴大glob、不改Full條件或golden。[缺口與限定驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)。

> **未完成項目核算：** 4（原規格／回歸／歷史細項＋smallschool）＋6（殿堂）＋4（實機／文案）＋5（待決／保留）＋7（候補）＋2（D2發布／獨立artifact待辦）＝**28**；53唯一ID、25完成／28未完。歷史38／47／48／52項及前階段快照保持原數。

## 4. 建議下一階段順序（非自動開發授權）

1. **使用者審查本輪修復及決定smallschool語意**：回國與grinder已分開修復及驗收；B→舊tier3、出生高校範圍尚未批准，不合併main、不開始重構。海外27案只為指定fixture通過，不是全市場自然生涯驗收。
2. **AUD-02／REFACTOR-AUDIT-01**：按[第五階段路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md)補規格／動態可達性證據；本輪不批准重構或刪除LEGACY。
3. **HIST-SPEC-CLAUSE-01**：原定義／未完狀態保持；第九階段只提出改為「歷史保留與按需追溯」的建議與可能失去的意圖證據，尚未批准。CURRENT_SPEC來源說明補充須先審查，不自動採納歷史政策。
4. **HOF-NATURAL-SAMPLE-01**：補足自然到達四聯盟的研究樣本，之後再討論殿堂規則決策。
5. **實機與文案驗收**：在可取得實機時執行；P2 功能候補逐案另行批准。

### 4.1 已建立的測試基礎

- 統一 Runner：`node scripts/test.mjs list|quick|full|audit`。
- GitHub Actions：`dev` push quick、對 `main` PR full、手動指定 profile。
- 第四階段 Linux 證據：[Quick](https://github.com/tt-chin/yakyujinsei/actions/runs/38132643250)／[Full](https://github.com/tt-chin/yakyujinsei/actions/runs/38132662335)／[Audit](https://github.com/tt-chin/yakyujinsei/actions/runs/38132971169)。
- Audit 的 10 項 SKIP 包含人工／研究／實機／Cloudflare 等，不得視為 PASS。4,000 生涯研究尚未完成。
- ACT 最終驗收：Quick 44 PASS、ACT 專用 Full 入口 PASS（48 入團 fixture、6 pointer 案例、16 次完整生涯）、Preview 54 組 PASS；詳見[報告](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)。
- 第八階段：本機Quick 45 PASS／0 FAIL／0 SKIP／0 BLOCKED，318.730秒；[Linux Quick Run 38183631042](https://github.com/tt-chin/yakyujinsei/actions/runs/38183631042)同為45 PASS／0 FAIL／0 SKIP／0 BLOCKED，160.208秒，受驗SHA `b38146e69288346a120db5b2d079ce0a7983aaae`。未執行Linux Full。Cloudflare Preview check success，deployment `c4015011-799f-45e4-99bf-2cb5ea4736f4`；[固定Preview](https://dev.yakyujinsei.pages.dev)47個HTML／JS／CSS與dev逐檔一致（僅正規化換行），0資產失敗；本轮未重跑全Preview E2E，不將部署比對當成實機驗收。
- 第九階段：文件建檔後本機Quick45 PASS／0 FAIL／0 SKIP／0 BLOCKED，184.953秒（HEAD ea951c2＋本輪文件工作樹）；[Linux Quick Run 38187518145](https://github.com/tt-chin/yakyujinsei/actions/runs/38187518145)45 PASS／0 FAIL／0 SKIP／0 BLOCKED，104.947秒，受驗SHA `e422b45bab38cc7a9632f89b2558bd296dcf0d5a`。未執行Full/4000研究/實機；Cloudflare check success，deployment `c3658994-41b8-4e33-8a6a-7554ac1f6faa`，固定Preview47個HTML/JS/CSS逐檔與dev一致，0資產失敗（非新Full UI驗收）。80本地link、582固定來源link/行範圍、44唯一checkbox通過；三個指定未完ID定義不變。本筆只補BACKLOG證據，依現有paths-ignore不重跑Quick；不變更CI設定。

## 5. 歷史快照與證據索引

### 5.1 v1.11.2 歷史稽核（2026-10-10；不可視為最新狀態）

| 欄位 | 當時資料 |
|---|---|
| `dev` | `a4aa83c48a48a1567bf3b14ceea6e4c76c87b76b` |
| `main` | `421e036bb206a11828a696a4f8b0d3909385441f` |
| VERSION | `dev` 1.11.2／`main` 1.10.2 |
| 38 ID 舊判定 | PASS 3、FAIL 1、IMPLEMENTED_UNVERIFIED 10、NOT_IMPLEMENTED 14、BLOCKED 4、DESIGN_PENDING 6 |
| 當時測試檔案 | 54（33 `.test.mjs`、5 standalone、11 E2E、5 support／分析／fixture） |
| 當時限制 | 部分 E2E 未執行、KBO 自然生涯 FAIL、實機／4,000 生涯未驗收 |

**上述是原始歷史資料，不能用來推翻後續 KBO 修復、第三階段驗收或第四階段 Linux CI 結果。** 舊報告：[BACKLOG_ACCEPTANCE_AUDIT.md](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)。

### 5.2 後續專項驗收

- [KBO 續約修復](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md)：v1.11.3。
- [契約／年俸驗收](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)：v1.11.4。
- [Draft 收入測試修正](docs/reviews/DRAFT_INCOME_E2E_FIX_AUDIT.md)：測試 fixture／斷言與已批准付款政策對齊，未修改遊戲規則。
- [統一 Runner／Linux CI](docs/reviews/TEST_INFRA_ACCEPTANCE.md)：測試基礎驗收，遊戲 VERSION 未變。
- [ACT-01／02 最終驗收](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)：現行功能結案，歷史原路線限制保留。
- [第六階段能力／交易補強](docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md)：歷史結果：正常回歸通過，5個安全風險斷言失敗，當時3個修復ID待批准；引用修復完成。
- [第七階段安全修復](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)：三項風險最小修復與指定驗收完成，v1.11.5；原FAIL與歷史報告保持可追溯。
- [第八階段歷史規格](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)／[AGENTS歷史](docs/reviews/STAGE8_AGENTS_HISTORY_AUDIT.md)：調查及分類結案，歷史全細項未驗範圍保留獨立待辦；VERSION／CHANGELOG不變。
- [第九階段驗收](docs/reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md)：新增[現行詳細設計入口](docs/design/CURRENT_DETAILED_DESIGN.md)及S/RNG、模組函式、流程/UI附錄；SPEC_MISMATCH文件引用與7組UNVERIFIED缺口保留。AUD-02／REFACTOR-AUDIT-01／HIST-SPEC-CLAUSE-01未完，不因文件建檔結案；新工作ID僅建議，正式checkbox仍18完成／26未完／44唯一。
- [第十階段調查](docs/reviews/STAGE10_PRE_REFACTOR_RISK_INVESTIGATION.md)：A正常稱號1 FAIL、B27 PASS、C正常3 PASS／故障9 FAIL、D兩路線trace對照PASS；未改遊戲。新增兩個未完修復ID，原稽核及LEGACY清理仍未完。
- [第五階段規格／架構調查](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)／[重構路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md)：1.11.4，quick44 PASS，P0風險0／P1五項／P2兩項／P3一項；風險數不是已重現Bug數。全規格／動態可達性未結案。

### 5.3 不得混淆的既有技術限制

- 舊全量 S 比較有 3 個歷史 oracle 因現行核准新增欄位而不適用，原失敗證據保留；現行回歸使用新基準的完整生涯／RNG 比較，不得把舊失敗隱藏成 PASS。
- Draft-income 曾有測試策略造成自然未入團退休及收入斷言缺少育成支度金的問題，後續已在專項報告中以測試修正處理，不是新增遊戲薪資政策。
- 同 Seed 若使用不同的能力配分／選擇策略，不能直接比較最終 S 或 RNG。
- 原生分享 mock 測試通過不代表作業系統 share sheet 實機已通過。
- Codex 報告是驗收證據；新任務仍須在最新 HEAD 重新確認相關程式與測試。

## 6. 非採用／禁止自動恢復的舊功能

以下不屬於待辦，也**不得因清理舊程式而重新啟用**：

- 生涯途中保存／讀取與恢復。
- 舊引擎切換、`rv`／`rules` URL 或舊版重播引擎。
- 直接移植參考作品整套薪資制度。
- 未批准的二刀流、語音或伺服器生成功能。
- 把 1.5.2 的三選單恢復成舊四選單。
- 恢復舊主題／PC 模式、舊薪資評價。
- 未批准就套用 HOF A／B／C 假說係數。

過去提案中的 1.9.0～1.13.0 版本號不是實作承諾，也不是目前正式版本；新功能採納時另依當時最新版本決定版號。

## 7. 所有任務的共同驗收與交付規則

1. 開始前確認最新 `origin/dev` SHA、VERSION、`AGENTS.md`、`CURRENT_SPEC.md`、`CHANGELOG.md`、本 BACKLOG 與指定報告。
2. 先記錄現況、重現步驟、原因與驗收範圍，避免重複實作已存在的功能。
3. 遊戲邏輯變更必須比較投手／野手固定 Seed、完整選擇歷史、狀態 `S` 與 RNG 消耗順序／次數；不得為通過測試任意改預期值或政策。
4. 使用相關單元、整合、E2E 與 Runner quick／必要時 full；記錄 PASS／FAIL／SKIP／BLOCKED、命令、環境、日誌與未測範圍。手機模擬不等於實機。
5. **僅遊戲本體變更**才依規則同步更新 VERSION 與 CHANGELOG；測試、文件、開發工具變更原則上不升版。
6. 先在 `dev` 修改、測試並確認 Cloudflare Preview；**未經使用者明確同意不得合併或 push 到 `main`**，也不得修改正式發布 Workflow。
7. 結案時更新本檔及對應驗收報告，保留 ID、受驗 SHA、結果、限制與證據；歷史快照不可覆寫為新結論。

---

**文件性質：** 保留已提交的 `1dacc55` 使用者重編版與第一至第九階段紀錄，補記第十階段四項調查及待批准修復；不覆寫歷史報告，不把待決規格當成實作授權。

## 第十階段提交後證據

- **測試／調查受驗提交：** `1020f84f938b0c1944741c207083801e38120e2d`。只新增測試、manifest一行登錄、調查報告及BACKLOG；遊戲樹、CURRENT_SPEC、AGENTS、VERSION、CHANGELOG、Runner與CI零差異。遊戲來源基準仍`fc879dc73cb8a3886d2812a42443c6192d1f6191`、1.11.5；main仍`e886e84ca08c6c185406cac9d6f3c4376277061a`。
- **本機：** Quick45 PASS／0 FAIL／0 SKIP／0 BLOCKED，258.247秒、exit0；新調查44案34 PASS／10 FAIL／0 SKIP／0 BLOCKED。交付版log在`test-results/stage10-committable/`：入口50.230秒、Runner51.079秒、exit1。初次測試接線／cleanup問題保留`stage10-investigation`，Runner timeout960.315秒、exit1，不能視為PASS；測試工具修正過程及另一完整重跑記錄見[調查報告](docs/reviews/STAGE10_PRE_REFACTOR_RISK_INVESTIGATION.md)。
- **Linux CI：** [Quick Run 38192410958](https://github.com/tt-chin/yakyujinsei/actions/runs/38192410958) success，受驗SHA就是`1020f84f938b0c1944741c207083801e38120e2d`，45 PASS／0 FAIL／0 SKIP／0 BLOCKED，Runner145.317秒、Workflow job約3分3秒。Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium；没有執行Linux Full／Audit，不把Quick綠燈當成新調查已PASS。
- **Preview：** 同SHA的Cloudflare check success，deployment `9ac674dc-2d9e-45cc-ab01-b61f9b06bd9c`。`node tests/stage10-risk-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --playwright=<PW> --output=test-results/stage10-preview`：47個HTML／JS／CSS HTTP200、正規化換行後與本地dev一致；四項動態調查34 PASS／10 FAIL／0 SKIP／0 BLOCKED、52.599秒（不含前置資產讀取）、exit1。6份完整生涯記錄（正常／注入IF、P與IF的traced／control）與本機逐操作S digest／選擇文字／RNG次數及最終完整S、全部R值完全相同。18筆錯誤均為明示fault injection，其他Console/pageerror及JS/CSS HTTP失敗0；browser已disconnect但profile清理逾時warning保留，不是遊戲錯誤。這是測試response注入驗證，非修改Preview資產／真實玩家自然例外重現，非實機驗收。
- **Manifest保護：** 移除新登錄行後與Git舊檔位元組一致，所有舊profile逐欄相同；list正確識別新入口為Full／Audit。Quick45不變、Full59→60、Audit60→61。新入口當前保留10 FAIL，後續Full／Audit不能宣稱全綠。58個BACKLOG／本報告本地link、46唯一checkbox（18完成／28未完）驗證通過。
- **純文件證據提交：** 本筆僅更新BACKLOG，完整SHA見此文件Git履歷與最終回報，與受驗1020f84分開。沿用既有paths-ignore，不修改CI觸發條件、不重跑相同Quick；Cloudflare仍可能對文件commit建立Preview，但不冒充另一輪E2E。停止等待使用者審查與修復授權，不自動下一階段。

## 本輪修復提交後驗收證據

- **受驗程式提交：** `b2e01509c0ea75712579f53d864ecd09f710840c`、1.11.6。修復前`ef74f276699d5e67234a792b21a8a3d96bb592c2`；回國提交`4a54b9e0fcfa60835dee6b463802f60e85fb8f3d`、出生提交`0689d350daf9b2c52064e8d4303ed40050fed344`。main仍`e886e84ca08c6c185406cac9d6f3c4376277061a`／1.11.4。
- **本機結果：** 原44案全PASS；補充及未改造原程式對照共59 PASS、71.123秒。Local Full原55 PASS／5 FAIL、1450.725秒、exit1與五入口重跑5 PASS、49.511秒、exit0均保留，不改寫成全綠。Quick初次44 PASS／1舊版本斷言FAIL，同步批准1.11.6後最終45 PASS／0 FAIL／0 SKIP／0 BLOCKED、210.302秒、exit0；未修改RNG期望。log見`test-results/safety-followup-*`及[報告](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)。
- **Linux CI：** Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium；[Quick Run 38214974512](https://github.com/tt-chin/yakyujinsei/actions/runs/38214974512)45 PASS、143.238秒；[Full Run 38215085325](https://github.com/tt-chin/yakyujinsei/actions/runs/38215085325)60 PASS、1455.477秒。兩者0 FAIL／SKIP／BLOCKED、success，head SHA均為b2e0150。Full實際PR合成提交`a43afe6e65be1b330aa74456f6a30e35f8d93f69`與b2e0150 tree同為`3aa0e2c92e5797db7b81496a371fee84309cc49f`。授權的[測試Draft PR #3](https://github.com/tt-chin/yakyujinsei/pull/3)驗證後CLOSED，mergedAt=null；沒有合併。未執行Audit／4,000研究。
- **Preview：** b2e0150 Cloudflare check success，deployment `6d322c45-3469-48b3-87df-d6e7c5c86509`。[固定Preview](https://dev.yakyujinsei.pages.dev)47個HTML／JS／CSS HTTP200、正規化換行後與受驗dev逐檔一致。`node tests/stage10-risk-e2e.mjs --compare=ef74f276699d5e67234a792b21a8a3d96bb592c2 --preview=https://dev.yakyujinsei.pages.dev --playwright=<PW> --output=test-results/safety-followup-preview`：59 PASS／0 FAIL／0 SKIP／0 BLOCKED、94.698秒、exit0。Windows／Chrome155.0.8059.39，PC1280／320／390；30筆預期S10_FAULT錯誤、非注入Console／pageerror及資產HTTP失敗0。已disconnect的browser profile清理逾時warning保留，非遊戲錯誤；手機尺寸模擬不是實機。
- **正常S／RNG：** 未改造舊game.js逐步對照：P yakyo-test-001，376操作／815R；IF s10-trait-38，347操作／597R；均2049退休。只正規化version、新增potSum0與done後批准修正的grinder；其他完整狀態、選擇歷史及全部R值一致。grinder自然IF取得、P不符合不取得；smallschool保持原狀且待決。
- **Manifest及文件保護：** 僅新增baseline-initial-potential import-only/support登錄；移除該行後與修復前manifest一致，既有入口分類／args／模式不變，Quick45／Full60／Audit61。Runner、CI／發布workflow、AGENTS沒有修改。BACKLOG正式checkbox為47唯一ID、20完成／27未完；關閉兩個核准範圍修復，不結案其他待辦。
- **後續純文件提交：** 本筆僅改BACKLOG證據及結案狀態，完整SHA見Git履歷與最終回報；不冒充已跑CI的程式SHA。沿用現有paths-ignore，避免重跑同套Quick；後續Cloudflare文件部署不冒充另一輪E2E。停止等待審查，不發布main或自動開始下一階段。

## 特性顯示統一驗收證據（1.11.7）

- **程式提交：** `6020df03ca507c456233005d22bfe36c3d21f306`，dev、VERSION1.11.7；基準`a0b880bb7e7fe74e743daa0cb8144455c9fdded2`／1.11.6。PATCH：既有特性説明呈現修正；版本正本docs/src/config.js與CHANGELOG同步。main確認仍`e886e84ca08c6c185406cac9d6f3c4376277061a`、1.11.4；沒有更新main或本番。
- **本機：** 最終Quick45 PASS／0 FAIL／0 SKIP／0 BLOCKED、220.432秒、exit0。完整Full61入口實際60 PASS／1 FAIL、1586.517秒、exit1；唯一失敗為ui-foundation來源字串未包含新歸檔呼叫，同步批准介面後Runner重跑1 PASS／0 FAIL、0.321秒、exit0，遊戲完全不變。沒有冒充另外一次全綠Full。其他60入口、特性18、原生契約381、能力89、交易5與補充17、第十階段57案通過。原始log為trait-display-full-final-v3、trait-display-full-static-recheck、trait-display-quick-final。
- **歷史中間結果：** 初輪跨行regex10 PASS／4 FAIL→14 PASS；stale UI callback四尺寸0 PASS／4 FAIL→4 PASS，舊legend相容狀態四尺寸0 PASS／4 FAIL→4 PASS，31案殿堂S/R/投票不改。早期Full文字oracle失敗及v2中止均NOT_COMPLETED，保留原log，不回改歷史數字。[詳細報告](docs/reviews/TRAIT_DISPLAY_UNIFICATION_ACCEPTANCE.md)。
- **Linux CI（2026-10-12確認）：** [Quick Run 38240950492](https://github.com/tt-chin/yakyujinsei/actions/runs/38240950492)由dev push建立，**45 PASS／0 FAIL／0 SKIP／0 BLOCKED、147.880秒**；[Full Run 38240992882](https://github.com/tt-chin/yakyujinsei/actions/runs/38240992882)由`gh workflow run test.yml --ref dev -f mode=full`直接建立，**61 PASS／0 FAIL／0 SKIP／0 BLOCKED、1595.017秒**。兩者status=completed、conclusion=success、headSha=`6020df03ca507c456233005d22bfe36c3d21f306`；Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium，耗時為Runner輸出，報告為各Run artifact中的`test-results/ci/summary.json`。main缺workflow的讀取結果不能當成無法dispatch的證明；本次實際觸發成功，先前BLOCKED預判修正。使用者拒絕Draft PR，**沒有建立PR**；此前查詢被工具拒絕，現依使用者新授權確認實際結果並解除此項BLOCKED。不改workflow或main，未執行Audit／實機／4,000生涯研究。
- **Preview：** 6020df0 Cloudflare check success、deployment `6cc7bbcd-35e6-4401-b280-948b8836f917`。[固定Preview](https://dev.yakyujinsei.pages.dev)47個HTML／JS／CSS HTTP200、正規化換行後與本機dev一致。`node tests/trait-display-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --baseline=a0b880bb7e7fe74e743daa0cb8144455c9fdded2 --playwright=<PW> --output=test-results/trait-display-preview`：**18 PASS／0 FAIL／0 Console・pageerror／0 JS-CSS404、exit0**。Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39；PC1280／320／360／390，手機為模擬不是實機。browser已disconnect而profile清理逾時warning保留，非遊戲錯誤。
- **不變性：** 未改造1.11.6 game.js逐步對照，P yakyo-test-001（530操作／1023R、2058退休）、IF s10-trait-38（331操作／577R、2048退休），全部選擇文字、前後完整JSON S摘要、最終S及R before/after/value相同，只排除VERSION。Baseline與current原始記錄在Full/Preview的career-P/IF-baseline/current.json，不排除traits、金錢、年表或其他S欄位；上述策略結果不與前輪不同策略的376／347操作混用。
- **保護與清單：** 17個實作／測試／文書檔案提交；tasks/fix.md保留未追蹤、不刪除或提交。Runner、CI／發布workflow、AGENTS、trait/event政策、契約／殿堂政策、資料表不變。manifest只有新Full／Audit入口，移除該行即與a0b880b一致：69檔、Quick45／Full61／Audit62；48唯一checkbox、21完成／27未完，按指定顯示範圍關閉本ID，其他待辦不變。90個本地文件link通過。
- **純文件證據提交：** 本次只更新BACKLOG的CI證據、結案狀態及統計，完整SHA見Git履歷／最終回報，與受驗程式6020df0分開。沿用既有paths-ignore，不改CI、不重跑同套Quick；後續文件Preview不冒充另一輪E2E。停止等待審查，不發布正式網站。

## 全力投球最小修復驗收證據（1.11.9）

- **受驗程式與版本：** `a1658c994713fd1fb8f66857dab33df0ff6548fd`，dev、1.11.8→1.11.9 PATCH。比較基準`20920dddd72ab8c91b0e2c71d560492663cd5aec`；game.js唯一行為修改是全力callback的`S.effort='全力投'`→`'全力投球'`，使既有成績／TJ效果生效。公式、係數、RNG呼叫及舊值fallback不變。config.js與CHANGELOG同步更新，CHANGELOG只記修復內容。main／origin/main仍`e886e84ca08c6c185406cac9d6f3c4376277061a`／1.11.4，沒有發布本番。
- **本機證據與失敗保留：** 最終原生53 PASS；同53案在原始基準52 PASS／1 FAIL，失敗為callback值。最終本機Quick47 PASS／0 FAIL／0 SKIP／0 BLOCKED、227.416秒。Windows Full實際64 PASS／1 FAIL、3307.699秒、exit1，不能稱Full PASS：draft-income完整生涯迴圈仍選全力，歷史S一致oracle失效並在大量差異輸出階段出現Array buffer allocation failed。修正真正的操作器為通常投球、保留完整deepEqual及新增簡短差異路徑診斷後，該入口9 PASS、436.223秒。最終全套由下列確定SHA的Linux Full獨立驗證；不以部分重跑改寫原Full。歷史測試相容性未新增S排除欄位、不換舊baseline、不放寬非預期差異。[完整原因／日誌](docs/reviews/FULL_POWER_PITCHING_ACCEPTANCE.md)
- **Linux CI：** [Quick Run 38281582865](https://github.com/tt-chin/yakyujinsei/actions/runs/38281582865)及[Full Run 38281629477](https://github.com/tt-chin/yakyujinsei/actions/runs/38281629477)均completed／success，headSha完全為a1658c994713fd1fb8f66857dab33df0ff6548fd。下載artifact實際確認Runner Quick **47 PASS／0 FAIL／0 SKIP／0 BLOCKED、146.791秒**；Full **65 PASS／0 FAIL／0 SKIP／0 BLOCKED、1991.530秒、reused=0**。Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium151.0.7922.34。Full包括53原生、381契約、89能力、5交易、17安全及KBO／ACT／選秀／退休等既有入口；新專項36 PASS／0 FAIL／errors0。日誌與總表保存在test-results/full-power-ci-quick/ci及full-power-ci-full/ci。CI既有artifact pattern沒有包含tmp/full-power-pitching原始caseJSON；CI入口log及總表已下載，逐S／R原始記錄另保存在本機完整專項，不宣稱CI上傳了不存在的附件。不改workflow、不建立Draft PR。
- **Preview：** 同程式SHA的Cloudflare check success，deployment `17c12e9c-2a49-4a3f-8ef6-ffd69fec6d58`。[固定Preview](https://dev.yakyujinsei.pages.dev)48個HTML／JS／CSS HTTP200，正規化LF後逐檔與受驗dev一致。`node tests/full-power-pitching-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --fixtures-only --playwright=<PW> --output=test-results/full-power-preview`實際 **29 PASS／0 FAIL／Console・pageerror0／JS-CSS4040、exit0**。Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39，PC1280、320／390真實tap的手機模擬context，SP／MR／CL×三強度及rubber有無的TJ後续；MR／CL經真實留牛棚選項。不把fixtures-only稱遠端36案或遠端完整生涯。斷線browser profile清理逾時warning保留，非遊戲錯誤。
- **固定Seed／狀態／RNG：** 本機及Linux新專項36案，含20次完整生涯執行。通常投球：yakyo-test-001/P 362操作／728R、jp3-pitcher-02/P 386／735；省エネ分別397／858、431／857；jp3-infielder-01/IF 387／639。只排除VERSION，完整S、選擇、R before/after/value與舊基準一致，新版重播亦一致。全力兩例舊362／728→新520／876、舊386／735→新530／830；第一差異2029選項callback僅effort，訓練及補正前R前綴一致，成績／TJ補正本身R0。2036首次TJ累積新超過50、舊未超過，開啟既有TJ選擇造成後續分支與R消耗差異，可追溯且屬使用者批准範圍；新版完整重播S／選擇／R完全一致。未改100條探索研究檔、門檻候選或新獎項判定。
- **結案與文件提交區分：** BUG-PITCH-EFFORT-01按批准範圍結案，49唯一checkbox為22完成／27未完；其他狀態不變。此筆只更新BACKLOG證據與統計，純文件SHA見Git履歷／最終回報，與上述實際受驗程式SHA分開。沿用現有paths-ignore不重跑無影響的Quick／Full，後續文件Cloudflare部署不冒充另一輪E2E。未執行實機／Audit／4,000生涯或追加自然採樣，這些不是本項PASS範圍。tasks/既有未追蹤檔保留，AGENTS／Runner／CI／發布workflow未修改。停止等待使用者Preview審查，不更新main。

## 國際大会本大会個人成績顯示（1.11.8）

- **基準與版本：** origin/dev=`e602174a22d7472e1021d780388ad61adc6b11b6`，1.11.7→1.11.8 PATCH。既存カードから欠落した本大会数値の表示補完のみ。config.js／CHANGELOG同時更新；main仍`e886e84ca08c6c185406cac9d6f3c4376277061a`、1.11.4，不發布本番。
- **本機：** 初回Quick45 PASS／1 FAIL、215.852秒，KBO歷史比較因新增personalStats产生digest差異；只排除該新增欄位後最終Quick46 PASS／0 FAIL／0 SKIP／0 BLOCKED、231.030秒、exit0。Full63 PASS／0 FAIL／0 SKIP／0 BLOCKED、2547.523秒、exit0；包括381契約、89能力、5交易、17安全、18特性表示及新大会表示50案。原失敗記錄保留test-results/intl-quick-before-version；最終log為intl-quick-final／intl-full-final。
- **新專項：** 單體15案、T01〜T14原生／ブラウザ50案PASS，PC1280／320／360／390、全4主題、實際設定dialog選large、Console/pageerror／JS-CSS404=0。ER按使用者確認，只用於保存及防御率，不另顯示自責点。遊戲生成與fmtIP本體不變，重畫與二重callback RNG0；舊欠損不從通算補造。
- **固定seed：** 投手yakyo-test-001 362操作／728R、jp3-pitcher-02 386／735、jp3-pitcher-03 419／887；野手jp3-catcher-01 C 314／547、jp3-infielder-01 IF 387／639、jp3-outfielder-01 OF 403／714。六條都完全一致，實際WBC5／プレミア12九大会；捕手自然代表なし，C顯示另以原生fixture驗證。完整S原本、逐操作digest及R before/after/value保存在専用入口career-*-baseline/current.json。只排除版號及intlTraitResults內personalStats，不排除整個结果字典。[完整策略／驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)
- **登錄及保護：** 71測試相關檔案，Quick46／Full63／Audit64；只新增Full／Audit入口一行（概算600秒），既有分類／Runner／CI workflow／AGENTS／資料／CSS不變。INT-01仍未完，48唯一checkbox、21完成／27未完，其他未完狀態不動。未追蹤tasks/保留、不提交或刪除。切斷済browser profile清理warning保留，非遊戲Console error。
- **程式提交：** `2924dd03f1bf0fecac0f1673f07c10df92546114`已commit／push origin/dev，21檔、298新增／14刪除。只有指定實作／測試／現行文書；100個本地link及48唯一工作ID檢查通過。新入口概算更新後另跑test-runner與新單體2入口PASS、2.427秒，不冒充另一次Quick46。
- **CI：PASS（Workflow結果）**。[Quick Run 38251079770](https://github.com/tt-chin/yakyujinsei/actions/runs/38251079770) headSha=`2924dd03f1bf0fecac0f1673f07c10df92546114`，2026-10-12依使用者新授權實際讀取status=completed、conclusion=success，tests check同為success。進一步讀取Runner log／統計的命令遭許可拒絕，因此本筆只確認Workflow成功，不把本機46 PASS／231.030秒當成Linux的實際數量／耗時。未執行Linux Full，没有建立Draft PR。
- **首次部署與阻塞歷史（不覆寫）：** [Cloudflare deployment 655049d2-c0f4-425b-ae40-f2549d8358f1](https://dash.cloudflare.com/383e1ae7fd9e9c94b48e43575172aec4/pages/view/yakyujinsei/655049d2-c0f4-425b-ae40-f2549d8358f1)在2026-10-12失敗；初次詳細output照會遭許可拒絕，先前Preview命令亦未取得可用結果，當時FAIL／BLOCKED判定有效。使用者登入後實際讀到：clone成功、136/136資產上傳及Assets published成功，無/functions目錄；最後`Failed to publish your Function. Got error: Unknown internal error occurred.`，頁面明示internal error。這是Cloudflare發布階段內部錯誤，不是已證明的遊戲建置錯誤；不推測平台內部更深層原因。原失敗deployment／log保留，不把未執行的舊命令回改為PASS。
- **重新部署：PASS。** 使用者提供的同2924dd0重新部署log顯示`Success: Your site was deployed!`。本輪GitHub Cloudflare check再次實際確認：程式SHA2924dd0的[重新部署dc7cd5b1-58b2-4ee4-bc39-1491290dad77](https://dash.cloudflare.com/?to=/383e1ae7fd9e9c94b48e43575172aec4/pages/view/yakyujinsei/dc7cd5b1-58b2-4ee4-bc39-1491290dad77)為completed／success；文件SHA6bfa070的[deployment 5a27a56e-35f4-4788-bc1a-1b589d48cea8](https://dash.cloudflare.com/?to=/383e1ae7fd9e9c94b48e43575172aec4/pages/view/yakyujinsei/5a27a56e-35f4-4788-bc1a-1b589d48cea8)亦success。[文件Quick Run 38252719930](https://github.com/tt-chin/yakyujinsei/actions/runs/38252719930)tests check success；不將本機統計冒充該Linux run的數量／耗時。兩提交遊戲HTML／JS／CSS零差異，本輪沒有修改程式、部署設定或自行再部署。
- **Preview指定驗收：完成／PASS。** `node tests/international-personal-stats-e2e.mjs --playwright=<PW> --preview=https://dev.yakyujinsei.pages.dev --fixtures-only --output=test-results/intl-preview-final`已實際執行，**43 PASS／0 FAIL／exit0**。48個配信HTML／JS／CSS HTTP200，正規化換行後與受驗dev逐檔一致。受驗HEAD=`6bfa070b914259664ef80ccee2cae4af5bc4d24f`，VERSION1.11.8，Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39；43案的個別耗時合計183.974秒（非含前置資產查核的總wall time）。包含P-SP/MR/CL、C/IF/OF、P12/WBC原生前後S/RNG、連點／去重、辞退／負傷見送り、intlace時點、舊結果／值コピー／保存種別再描畫及1280／320／360／390×四主題×large的32組。Console/pageerror及JS/CSS404均0；已disconnect的browser profile清理逾時warning保留，不是遊戲錯誤。結果與截圖在test-results/intl-preview-final/，summary.json保存43案及環境。本次fixtures-only沒有重跑6條完整生涯，也不冒充遠端50案；固定seed六生涯及T09/T13等人工整形單體的本機既有證據保持。解除本次Preview阻塞，實機／4,000生涯／Linux Full未實施的限制仍保留。
- **文件提交區分：** 使用者AGENTS修改與CI證據已於`6bfa070b914259664ef80ccee2cae4af5bc4d24f`一併提交；本次只補BACKLOG的重新部署與實際Preview驗收結果，文件SHA另見Git履歷／最終回報，與程式2924dd0及遠端受驗HEAD6bfa070分開。沿用僅BACKLOG的paths-ignore，不修改CI或重跑未受影響的Quick／Full；後續純文件Preview不冒充另一輪E2E。不改遊戲、AGENTS、VERSION、CHANGELOG、main／正式網站。既有48唯一checkbox、21完成／27未完保持：本大会結果卡指定驗收完成，不把未實裝的歷史列表INT-01結案。等待使用者審查，不發布本番。

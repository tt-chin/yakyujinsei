# BACKLOG — 野球人生（日文版）

正式發布（2026-10-31，1.13.6）：PR #41將dev `c6d9c9f`合併至main，merge commit `9fe741d`（樹與`c6d9c9f`相同），含1.13.6字型修正與game.js重構第11～20期。[CI Full Tests #102](https://github.com/tt-chin/yakyujinsei/actions/runs/41196168506) 93／93 PASS（`full-aggregate`：`expected 93`、`acceptedPass 93`、`issues []`）；[Publish website #29](https://github.com/tt-chin/yakyujinsei/actions/runs/41197144452) success。本番`yakyujinsei.com`實測：`docs/index.html`＋`docs/src`共72檔SHA-256與main一致，顯示v1.13.6，起始畫面Console 0則、資源無4xx／5xx。未驗證：本番完整生涯、手機表示、`docs/`其他檔案、Cloudflare Preview部署狀態與Preview驗收紀錄。本次發布不代表個別UI項目的使用者驗收，既有未完成項目不因此結案。

收入顯示統一（2026-10-24，開發版1.13.4，待使用者審查）：R2／L2；年俸・報酬合計careerBaseSalary與corpIncome，總額直接顯示careerEarnings，不改取得／支給規則或資料欄位。最終本機Quick 68 PASS／0 FAIL／0 SKIP／0 BLOCKED（300.233秒，test-results/income-display-quick-final/summary.json）；收入專項30組及6組退休版型PASS，PC1280／手機模擬320・390px；8條自然生涯逐步比較基準2e690969a6db14826aa87e85e94e78819acd8e17，除逐項驗證的核准收入呈現及版本metadata外，S／選擇／RNG與其他DOM一致。初回Quick65 PASS／3 FAIL保留於income-display-quick：兩項舊分類期待值、一項測試替換字串組裝錯誤，限定修正後重跑全Quick通過；歷史golden未改。Full／CI／Preview／實機NOT_RUN，未提交、推送或部署；既有未完成項目及artifact缺口不結案。

2026-10-22限定修正（1.13.3，待使用者審查）：使用者明確批准將原CPBL送別資格與文案改為NPB年資＋目前海外（MLB／MiLB／KBO／CPBL），保留_daiba一次性旗標，既有true不補發。R2／L2，僅送別卡片與其旗標；不改金錢、能力、honors、引退續行或RNG。基準6e06b1b64abc5f8be1a1a42d68e44c4d1944a16d加本輪工作樹；384原生函式fixture及PC／320／390px共24原生卡片fixture PASS，其他S／RNG精確一致。初回Quick63 PASS／1 FAIL（npb-return-ui的歷史整段比較包含本次批准的送別變更），原報告npb-farewell-quick保留；只對送別函式新增逐字精確期待值，其他契約／復歸嚴格比較保留，限定重測通過。最終Quick64 PASS／0 FAIL／0 SKIP／0 BLOCKED，237.775秒，test-results/npb-farewell-quick-final/summary.json；最終UI入口PASS，npb-farewell-final-render/summary.json。提交前當輪Full／CI／實機NOT_RUN（後續CI狀態見下節）；本輪局部事件不涉及核心計算，不冒充完整生涯或Full驗收。歷史golden不改。已於`4cb4c987792f6d1291fb76b73af4e9eb332931ec`提交至遠端dev；使用者審查待確認，正式main／公開倉庫仍為1.13.0，後續已核對此SHA的Quick CI與Cloudflare部署success（見第1.3節），不代表使用者UI驗收或正式發布。

## 1. 最新進度總覽

| 指標 | 數量 | 說明 |
|---|---:|---|
| 已完成 | **32** | 包含D2發布範圍結案、C級高校／弱小校の星、4-A既有條件已滿足的LEGACY清理，以及PR #21／#22合併的CI執行環境鎖定、耗時平衡分批與投球E2E拆分、PR #24／#25合併的Full舊期待值與時序競態修正 |
| 未完成 | **32** | 恢復TJ顯示既有待辦；新增表示token第1段（字體指定修正）；UI審查、CI工具路徑與artifact缺口保持未完成 |
| P0 未完成 | **0** | 既有 P0 已按核准的結案標準關閉 |
| BLOCKED | **4** | 三項實機／分享，另加ARTIFACT_COVERAGE_BLOCKED；後者不阻擋Linux Full啟動 |
| IMPLEMENTED_UNVERIFIED | **9** | 五項UI／支持已實作提交dev，待審查；原4項保留 |
| DESIGN_PENDING | **7** | C級高校語意已定案並結案；其餘設計待決保持 |
| 其他候補／保留／混合 | **13** | 包含TJ顯示規則、CI耗時平衡提案、full-power-pitching-e2e耗時提案及CI_PASS但工具路徑待處理；UI-06／07已計入IMPLEMENTED_UNVERIFIED |

以上依唯一正式checkbox重新計算：**32 + 32 = 64**（2026-10-24新增CI-ENV-PIN-01、CI-PITCHING-E2E-01；同日CI-ENV-PIN-01經PR #21合併後勾選；CI-PITCHING-E2E-01經PR #22合併後勾選；CI-FULL-BALANCE-01的實作`cdf0a25`已隨PR #21併dev，經使用者同意一併勾選；同日新增CI-FULL-STALE-01、UI-DESIGN-TOKENS-01；CI-FULL-STALE-01經PR #24／#25併dev、dev Full Run40093614384 92／92 PASS後勾選）。保留本輪C級高校結案同步；另依已批准4-A執行期證據與合併紀錄，將CONTRACT-LEGACY-01列為限定範圍已完成；恢復更新時漏列的UI-TJ-GAUGE-01與CI-FULL-BALANCE-01，兩者均未授權實作。其餘ID不改checkbox。D2-G9-RELEASE僅以發布範圍結案；CI-LINUX-FULL-01舊工具路徑未處理、D2-CI-ARTIFACT-01保持ARTIFACT_COVERAGE_BLOCKED。各版測試數字只代表原受驗範圍，歷史統計與FAIL不改寫。


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

**D2獨立Gate歷史快照（2026-10-15；現況見D2-G9-RELEASE及CI-LINUX-FULL-01）**：A0／G2～G4與G5～G8已獲使用者接受，B本機提交56e72d9。1.13.0發布準備、120分鐘timeout及collector限定驗收已接受；本次另批精確dev提交／推送與Linux Full啟動，不等於Full結果PASS。CI／Preview／正式發布與smoke未驗收，D2-G9-RELEASE保持未完成；artifact保存缺口另列D2-CI-ARTIFACT-01，不作Full啟動阻擋。這不是前述「第九階段」技術文件調查，兩者不可混用。見[G9報告](docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)與[CI證據驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)。

上述「階段」是方便管理的索引，**不是新的任務 ID**。此外還有兩項已完成的歷史稽核／測試盤點及一項殿堂錯置修復，列於第 2 節。

### 1.2 歷史開發基準與持續限制

以下各版SHA、main及測試數量為當輪歷史紀錄；目前開發1.13.3／公開1.13.0以頁首為準。歷史「smallschool待決」已由1.12.0批准的C級方案取代；實機、完整稽核及其他未結案項目的限制仍保留。

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

### 1.3 本次核對基準與驗收界線（2026-10-23）

- 本機及origin/dev記錄：`52e4cdb36d6b770a2c73ca89e947c94bcc616562`、VERSION 1.13.3；開始時只有BACKLOG既有未提交修改，本次保留並補正。正式main實際核對仍為`650e4dd21718b4abec3876fc9ef6148714c21d4f`，公開倉庫config仍1.13.0。
- 1.13.3修正提交`4cb4c98`：[Quick CI](https://github.com/tt-chin/yakyujinsei/actions/runs/39633979872) success；Cloudflare deployment `e1624e5f-b99f-47e2-86b7-25d106d7bf87` success。先前Preview仍1.13.1的觀測為歷史，當時延遲原因仍未確認，不倒改當時結果。
- 最新dev：[Quick CI Run39908253156](https://github.com/tt-chin/yakyujinsei/actions/runs/39908253156) success，受驗SHA為`52e4cdb`；本次只核對Workflow結果，未下載報告核對入口數，不將本機67入口推算成此Run的實測數字。該Run的Full三個job均SKIPPED，不能作Full PASS。
- 最新SHA Cloudflare Pages check success，deployment `2250c1a4-bd82-42f4-9d29-56a84b051388`；[Preview](https://dev.yakyujinsei.pages.dev)實際config提供1.13.3。這是部署與版本讀取確認，不是全資產hash／UI E2E／實機驗收，五項UI的使用者審查仍待完成。
- 已核對[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §8及[實際Full Run39879968880](https://github.com/tt-chin/yakyujinsei/actions/runs/39879968880)：指定`b6f71f6dbe6f90e511334e5ad9e063af9f344fe5` success；計畫記錄84／84及10個artifact、21分37秒，本次未重新下載核驗原件。不能沿用為目前87入口或最新SHA的Linux Full，也不解除artifact完整性缺口。
- 本次R0文件盤點不執行Quick／Full、不改程式、測試、VERSION、CI或發布設定，不自動commit／push。

## 2. 已完成工作（28 項；含第3.6節保留的D2-G9-RELEASE）

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

### 2.10 C級高校與弱小校の星（2026-10-22狀態同步；既有1.12.0實作）

- [x] **TRAIT-SMALLSCHOOL-SEMANTICS-01** — `IMPLEMENTED / CLOSED`。舊B→hsTier3待決已由使用者批准的C級方案取代：新增10所C級高校、出生抽選S/A/B/C＝25/45/20/10%、HS C補正−4；以不可變birthHighSchool快照判定出生C及既有reachedTop，UNKNOWN不補發、舊true保留。規格及產品已納入1.12.0，公開1.13.0亦包含；不再列為尚未設計或尚未實作。既有驗收：原工作樹Quick48／Full67 PASS；升版1.12.0 Quick48及兩個局部Full入口PASS；受驗產品d8f2df9的Quick CI48、Preview特性18案及修復後C專項28案PASS，各自版本／工具修復限制見[驗收](docs/reviews/TRAIT_SMALLSCHOOL_C_IMPLEMENTATION_ACCEPTANCE.md)。本輪依既有批准及證據同步結案，未重新測試；真實裝置及全國校名無碰撞仍未驗證，不擴大為全功能驗收。COPY-01全量清查仍保持未完成。

### 2.11 LEGACY契約舊本體清理（4-A限定範圍）

- [x] **CONTRACT-LEGACY-01** — `VERIFIED_IN_TESTED_PATHS / CLOSED_SCOPE_LIMITED`。依[物件導向化計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md) §2f.5-2、§2f.7：使用者同意的DEAD_CALL驗證涵蓋23個瀏覽器E2E，舊makeOffers／pickOfferUI無執行期呼叫；4-A刪除舊本體及拆殼，8生涯DOM／S／RNG一致，已由PR #12（d3efd11）併dev。這不是全路徑不可達證明，原Full 84 PASS／1 FAIL及限定修復重測、stage10比較基準造成的預期FAIL均保留在原計畫；第5期後另有確定來源86入口全PASS證據，不回改原FAIL。市場／規則重設、4-B／4-C／4-D與整體重構不在此結案範圍；後續仍由REFACTOR-AUDIT-01追蹤。

## 3. 未完成工作（33 項）

### 3.1 P1 — 規格、回歸驗證與待決（3 項）

- [ ] **AUD-02** — `IMPLEMENTED_UNVERIFIED`。第五階段完成16章／84規格群組對照：MATCH49、MISMATCH3、UNVERIFIED27、DESIGN_PENDING1、OBSOLETE4；quick44 PASS。完整數值邊界、全DOM／跨功能互動及實機仍缺，**調查完成不等於全規格驗收完成**。[2026-10-11證據](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)。發現差異僅記錄，不修改遊戲。
- [ ] **REFACTOR-AUDIT-01** — `IMPLEMENTED_UNVERIFIED`。第五階段已建主要S讀寫地圖、40模組AST索引（991函式節點／4193呼叫節點）、196 RNG語法點、32頂層覆寫群組、LEGACY委派與[分批路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md)。動態scope／所有callback可達性未完全證明，保持未完成；**早期稽核不構成後續實作授權，後續僅以各期已批准範圍為準**。[2026-10-11證據](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)。2026-10-18另立[game.js物件導向化分期計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md)（第1期`Rng`）。第1期已於同日本機實作並完成L3驗證（基準`650e4dd`、許容差分無；Full 79 PASS／2 FAIL，2件FAIL於未改HEAD同樣發生，見計畫§2.9）。第1b期（RNG觀測hook：E2E計數改經`careerRng.onDraw`，掛鉤失效時丟`RNG_INSTRUMENT_MISS`）同日本機完成L3驗證（Full 82 PASS；656個artifact的RNG計數與第1期差異0，見計畫§2b.6）。第1／1b期已經PR #5併入`dev`（`36fc242`），Preview以`replay-share-theme-e2e --ui-only --preview`確認PASS；本機Docker Linux Full亦確認重構前後RNG計數差異0（見CI-LINUX-FULL-01、計畫§2.10）。第1c期（`ri`／`pick`／`chance`／`N0`方法化）因測試以`R`為強制與追蹤的唯一入口，經使用者決定暫緩（計畫§2c）。不改變本ID狀態。 最新進度（2026-10-24）：第2期GameView（PR #8／26efa59）、第3期CareerSession（PR #10／4036e87）、第4期4-A（PR #12／d3efd11）、第5期CareerPresenter（PR #14／86b4f03）、第6期SeasonStats（PR #15／34ed23c）、第7-A（PR #16／67dcab9）及第7-B international-selection-policy（PR #17／52e4cdb）均已併dev。各自本機驗證／原FAIL／修復及環境差異見計畫§2d.11、§2e.8、§2f.7、§2g.8、§2h.8～9、§2i.8／16；7-B記錄Quick67／Full87全PASS與8生涯DOM／S／RNG一致，屬macOS＋Brave本機證據，不是最新SHA的Linux Full。最新CI／部署確認見第1.3節。第8期殿堂評分policy（PR #19／7940e97）及第9期守備位置policy（PR #20／f4a2894）已併dev（計畫§2j.8、§2k.8）；第10期能力評價policy已於本機完成（§2l.7，實作commit e75159e，分支refactor/ability-evaluation，PR待PR #21與ci/pitching-split合併）；年度狀態機§3.6不等於存檔／續玩已實作。計畫首頁總表已同步至第10期。第11期候補調查（領域地圖、流程狀態機方向、路線A／B）見計畫§3.11；第11期流程狀態機（A＋B）細部計畫見§2m，實作未批准。 2026-10-31：葉領域組件化路線見計畫§3.15；第18期事件・戀愛（PR #38／9f8664a）已併dev；第19期SeasonAwards（`docs/src/engine/season-awards.js`）本機Quick68／Full93全PASS（§2w.6，macOS＋Brave本機證據，不是最新SHA的Linux Full），`renderCheckpointCard`留在game.js。不改變本ID狀態。
- [ ] **HIST-SPEC-CLAUSE-01** — `未完成細項對照`。第八階段盤點與差異分類已完成，但兩份大詳細設計的全數值／學校tier地域／§19–22舊API與翻譯條款、參考作品分析的每條公式及更早Git修訂尚未逐條核對。建立原始固定來源→現行對應→證據台帳，與AUD-02現行功能驗收、COPY-01可到達文案驗收分開；未經批准不移入正式規格、不恢復舊規則、不刪原文。[範圍與限制](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)


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
- [ ] **COPY-01** — `IMPLEMENTED_UNVERIFIED`。全量可到達日文文案、棒球術語與畫面位置仍待清查；COPY-001～005已於1.12.0完成實作及限定驗收，見[COPY驗收](docs/reviews/COPY_01_P1_IMPLEMENTATION_ACCEPTANCE.md)，不再重做這五項。與v1.8.2的92事件翻譯替換分開管理；本輪1.13.3只修送別事件，不能據此結案全量COPY。

### 3.4 P2 — 規格待決與保留（7 項）

- [ ] **OVR-01** — `DESIGN_PENDING`。野手 OVR 加入 stamina 5% 的提案，先比較現行公式與提案，批准後才能修改。
- [ ] **TRAIT-NITENICHI** — `承認済み保留`。二天一流；投手三冠已於1.13.0實作（TRAIT-PITCHER-TC），但二刀流制度與本特性接線仍未批准，不因三冠完成自動啟用。
- [ ] **TRAIT-CHAMPIONMAKER** — `承認済み保留`。優勝請負人，待累計 5 冠、計算範圍、勝率加成及 RNG 政策核准。
- [ ] **UI-TJ-GAUGE-01** — `未着手・表示規則待ち`。依[物件導向化計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md) §2e.7、§2g.1，使用者已批准列待辦：TJゲージ直接String(S.tj||0)顯示長小數。第5期搬移後現位於docs/src/ui/career-presenter.js的ability()，並未修正。先決定位數及是否顯示50／100上限，只改表示、不改S.tj或RNG；不與重構混合修改。本次恢復漏列，不代表授權實作。
- [ ] **UI-DESIGN-TOKENS-01** — `IMPLEMENTED / PR_PENDING`（2026-10-24；實作`fcb22a9`，驗證見[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §6；PR合併後勾選）。依[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §2：表示token第1段。`--sans`指定`Noto Sans TC`而`index.html`載入`Noto Sans JP`，實測（macOS＋Brave，`2e69096`）日文以PingFang TC顯示；修正為`Noto Sans JP`起首的日文字體列，並新增圓角／陰影token（computed style不變）與字體載入斷言。只改CSS與測試，不改`game.js`、RNG、`S`；PATCH 1.13.5→1.13.6（2026-10-24依`357e852`重掃後修正）。第2～4段（特性標籤／球團徽章元件化、分享圖token、版面token）未計畫。
- [ ] **CODE-DEAD-01** — `実装完了・dev未併合`。依[物件導向化計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md) §2cc：分支`refactor/code-dead-01`（`45cccd7`）已刪除`statBonus`、`checkTraitsMid`、`teamChampRate`、`teamListOf`、`CHEER_DEFAULT`、`ageGateUSA`、`nextContractId`、`settlePhaseEnd`的PRO不可達分支（三處共2,390 bytes，更正§3.18的3,548 bytes），以及掃描新發現的`CPBL_TEAMS`、`NPB_TEAMS`、`MLB_TEAMS`、`HS_CUPS`、`U_CUPS`、`currentAffiliation`、`faFlow`薄包裝、`selPos`。Quick 68／68、分組Full 93／93 PASS（macOS＋Brave本機證據），已push，PR #44→dev待合併。併入dev並取得Full CI後結案。`game.js`未使用的import 86個（含本次新增5個）不動：E2E注入的hook在模組內直接引用，刪除會造成`markSalaryPaid is not defined`；未使用的區域變數與`navigation.js`的`renderRecord` import不在本項範圍。
- [ ] **CONTRACT-ASIA-01** — `未実装・仕様待ち`。KBO 亞洲名額及球團整體外國人預算，與現有 `FOREIGN_STANDARD` 不同。

### 3.5 P2 — 未來功能候補（10 項）

- [ ] **INJ-UI-01** — 一般受傷風險細項顯示；計算與 UI 維持單一資料來源。
- [ ] **PLY-01** — 背號與年度履歷；需先決定 00、轉隊、重複及改號規則。
- [ ] **INT-01** — 各項國際賽事履歷；重用既有結果，不增加 RNG 抽選。1.11.8僅補既存大会結果卡的本大会個人成績及personalStats快照，未新增履歷列表，本ID仍未完成。[本大会顯示驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)
- [ ] **EVT-01** — 事件分類顯示；不得改變抽選候選及順序。
- [ ] **UI-06** — `IMPLEMENTED_UNVERIFIED`。既有同頁「遊び方」dialog沿用原文章；本輪1.13.5改為共用固定標題／可捲動本文／固定閉じる三區、背景捲動鎖定及位置／焦點還原。本輪本機驗證通過，待使用者審查，未提交／部署此修正，不自動結案。
- [ ] **UI-07** — `IMPLEMENTED_UNVERIFIED`。更新履歷UI以RELEASE_NOTES.md精簡文案為來源，經update-release-notes產生配信資料；CHANGELOG維持詳細正本（1.13.4已分離，不再直接複製最新10版長文）。本輪1.13.5與遊び方共用三區及持續位置指示，精簡／詳細履歷已同步，待使用者審查，未部署本輪修正。

  1.13.5限定驗證：Chromium 11 PASS／0 FAIL（test-results/information-dialog-accepted/summary.json）、WebKit 11 PASS／0 FAIL（information-dialog-webkit-recheck/summary.json）；320×568、390×844、844×390、390×240、1280×900，含標題／操作區固定、末段可讀、背景還原、keyboard／Esc／外側／native close、快速重開、observer與事件清理、內容及visualViewport變化、無溢出隱藏軌道。Chromium另驗證原生觸控；WebKit手機模式無wheel API，背景鎖定改用scrollBy嘗試，不能冒充iPhone實機。Quick 68 PASS／0 FAIL／0 SKIP／0 BLOCKED、504.095秒（information-dialog-quick/summary.json）；既有選單相關event-fix-e2e通過，S／RNG不變。CI分批工具31 PASS／1 Linux-only SKIP，僅同步新增入口數91→92，不改Runner或CI通過條件。早期FAIL為測試量測（預留padding、短文無section、鍵盤動畫未停止）及WebKit不支援wheel，原始summary保留於information-dialog-initial、information-dialog-recheck-1、information-dialog-chromium-final、information-dialog-webkit。Full／CI／實機Safari NOT_RUN，artifact缺口及其他歷史未驗證狀態不變。
- [ ] **PLY-02** — 永久欠番；以前述背號履歷為前提，待組織、年數、成績及 RNG 規則批准。
- [ ] **UI-MENU-01** — `IMPLEMENTED_UNVERIFIED`。1.13.1已整合設定、共有、OFUSE與重新開始；沿用既有處理，支援Esc／外側點擊／焦點及鍵盤。1.13.2修正dialog非同步close造成的焦點競態。已提交dev，待使用者審查／尚未正式發布。 既有測試的最新結果與歷史FAIL見下方「UI驗收現況」，未以實作完成自動結案。
- [ ] **UI-DESKTOP-LAYOUT-01** — `IMPLEMENTED_UNVERIFIED`。1.13.1已實作1180px以上左右唯讀概要、手機單欄；1.13.2取消側欄300px上限、保留中央560px操作區，契約／收入依欄寬改直排或雙欄並允許折行。已提交dev，待使用者審查／尚未正式發布。GameView相關既有Runtime回歸證據見下方，不代表整體重構結案。 既有測試的最新結果與歷史FAIL見下方「UI驗收現況」，未以實作完成自動結案。
- [ ] **SUPPORT-01** — `IMPLEMENTED_UNVERIFIED`。1.13.1已於選單加入「♡ 開発を応援」，連至使用者指定OFUSE https://ofuse.me/dcb7f92e，別分頁noopener／noreferrer；開始畫面不放支持按鈕，不影響遊戲待遇。已提交dev，待使用者審查／尚未正式發布；實際付款及收款設定未驗證。 既有測試的最新結果與歷史FAIL見下方「UI驗收現況」，未以實作完成自動結案。

#### UI驗收現況（2026-10-23同步）

以上五項已納入遠端dev，最新核對HEAD為52e4cdb、1.13.3；main仍650e4dd／1.13.0。1.13.2提交前26efa59加工作樹Quick63／0與Runtime兩入口PASS，1.13.3本機Quick64／0與相關UI PASS見頁首，均為各自原始受驗範圍。最新Quick CI與Cloudflare部署已success，Preview目前config為1.13.3，詳細受驗SHA及未驗證範圍見第1.3節；不以部署成功代替使用者UI確認。早期Quick62／1 FAIL及原始快照問題保留，不倒改歷史結果。五項ID保持待審查，實機與付款限制不變。

#### UI實作與驗證歷史（以下「未commit／push」均為當輪提交前記錄）

以上五項為使用者優先組；2026-10-21已完成本機UI實作與相關4入口驗證，後續快照驗證修復後完整Quick63 PASS／0 FAIL，待使用者審查。手機單欄、桌面1180px以上唯讀概要；不包含GameView重構、遊戲規則、金流後端或發布。

PC側欄顯示修正（2026-10-21，1.13.2；基準1bc65dfc2b8ba226930b23dca85a03e678e91253加本輪工作樹）：R2／L2。左右欄取消300px上限，保留中央560px操作領域；契約・収入窄欄改項目／值上下配置，420px以上改雙欄，長期間及金額可折行，不刪資訊。原生Runtime E2E入口1 PASS，涵蓋5個PC寬度×4主題×3字級的60組顯示fixture，以及1280／320／390px既有操作和S／RNG不變檢查。初回原生FAIL為dialog非同步close焦點復原競態，直接修復後限定重測PASS；原始FAIL保留sidebar-width-20261021-native，重測為sidebar-width-20261021-native-retest。新完整Quick63 PASS／0 FAIL／0 SKIP／0 BLOCKED（246.179秒），報告test-results/sidebar-width-20261021-quick/summary.json。版號精確期待同步1.13.2，歷史快照與golden不改。Full NOT_RUN（局部UI無規則／RNG改動）；CI／實機NOT_RUN，待使用者審查，不代表發布。未commit／push／部署。 提交前因dev已合併GameView改動，於26efa59edce5fed88ebccaaab794755e6e55a109加本輪工作樹重新驗證：Quick63 PASS／0 FAIL（257.488秒），相關Runtime兩入口PASS（event-fix-e2e及game-view-dom-e2e；後者PC／手機完整生涯DOM／S／RNG一致）。證據test-results/sidebar-commit-quick及sidebar-commit-native；不冒充完整Full。

快照驗證修復（2026-10-21，TEST_FIX_ONLY）：只修改tests/award-identity-policy.test.mjs及本紀錄，不改產品。兩份原始Git快照SHA256保持既有常數，以固定2a11a64來源核對原始bytes，工作樹只正規化CRLF→LF比較；文字、空白、末尾換行、單獨CR、非法UTF-8及Git原件竄改仍拒絕。main／navigation／config按已批准1.13.1 UI建立精確預期替換，沒有整檔豁免或擴大allowedB。限定135案PASS，新完整Quick63 PASS／0 FAIL／0 SKIP／0 BLOCKED（299.032秒）；原Quick62／1及其他FAIL保留，屬修復前歷史結果，不改寫為PASS。報告test-results/snapshot-contract-20261021-quick/summary.json；Full本輪NOT_RUN（僅測試契約修正），CI／實機／付款仍非本輪驗證。未commit／push／部署。

本輪驗證（2026-10-21，HEAD 2a11a64加工作樹／1.13.1）：R2／L2；原方向鍵冒泡FAIL已修復並保留首次紀錄；首輪Quick60 PASS／3 FAIL，初始化位置及精確版號斷言修復後，最終Quick62 PASS／1 FAIL。剩餘award-identity-policy.test為未修改B1快照工作樹CRLF與原Git LF hash差異，未修改HEAD測試亦可重現；舊G9凍結來源契約對後續UI／版號調整亦須另審，不自行放寬。相關4入口與直接3入口PASS，投手／野手固定Seed主RNG652／549比較不變；原生Menu／Share fixture S／RNG不變。Full NOT_RUN（本批局部UI，無遊戲規則／RNG改動）；OFUSE實際付款、iPhone／Android原生分享NOT_RUN。原FAIL及新log留在忽略的test-results/menu-20261021-*；來源hash清單menu-20261021-source-audit.json。未commit／push／部署，待使用者審查。

### 3.6 P1 — CI殘項（3項未完成；另保留1項已完成發布索引及4項已併dev的CI項目）

- [x] **D2-G9-RELEASE** — `RELEASED / CLOSED_WITH_SPLIT_RESIDUALS`（2026-10-18）。正式1.13.0發布與基本Smoke已完成，來源650e4dd／正式站15adf28，見[發布驗收](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md#g9與正式1130)。使用者決定以發布範圍結案，殘項拆出：Linux Full與舊工具固定路徑依賴改由CI-LINUX-FULL-01追蹤（本機Docker Linux Full對650e4dd 80 PASS已獲接受為替代證據；2026-10-19指定2a11a64的GitHub Actions Linux Full已82 PASS；舊工具路徑仍待處理，不沿用至1.13.3）；artifact保存由D2-CI-ARTIFACT-01；文件整理見上方索引。未將任何殘項標為PASS。

> 歷史準備快照（2026-10-15，保留原時點）：`RELEASE_PREPARATION / RELEASE_NOT_VERIFIED`。1.13.0 MINOR、CHANGELOG與限定準備驗收已接受；精確dev commit／push及Linux Full啟動已獲本次批准。Linux實際驗證截至本次提交前尚未執行；只有確認Run與受驗SHA後才報CI_IN_PROGRESS，不能預報PASS。CI／最新SHA Preview／使用者確認／正式發布／smoke全部完成前維持未完成；main合併、正式同步及部署仍未授權。artifact問題由D2-CI-ARTIFACT-01獨立追蹤，不阻擋先跑Full，也不因Full PASS而自動結案。來源與限制見[發布準備](docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)及[CI證據驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)；[原G9報告](docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)保留為歷史。不得清理A／B或歷史JSON。

- [ ] **CI-LINUX-FULL-01** — `CI_PASS / LEGACY_TOOL_PATHS_PENDING`（2026-10-19）。**Linux Full已於CI取得PASS**：GitHub Actions Run39260159042（Tests #49，`2a11a6444c643002d1c3143fd7827b94ce4ce2eb`，workflow_dispatch，Linux Chromium，58分52秒）8批 10／10／10／11／10／10／10／11 PASS，aggregate `{"status":"PASS","expected":82,"acceptedPass":82,"issues":[]}`，0 FAIL／0 SKIP／0 BLOCKED；`contract-salary-e2e`（`--compare=650e4dd`）135.9秒PASS，未再發生runner shutdown／exit143。artifact 9件已上傳，完整性仍由D2-CI-ARTIFACT-01追蹤。**目前結案條件**：指定SHA的Linux Full PASS已滿足；尚需處理並驗證下列舊工具固定路徑，依2026-10-19使用者決定保持未結案。**剩餘**：舊verify-baseline、freeze-baseline、capture-evidence、receipt-careers等工具可能讀取已放棄的歷史固定路徑（[說明](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md)），Full不執行這些工具，本Run未驗證；使用者決定（2026-10-19）此殘項處理前本項不結案。以下為前狀態記錄（保留原時點）。`LOCAL_LINUX_PASS / CI_NOT_RUN`。2026-10-18自D2-G9-RELEASE拆出。GitHub Actions的Linux Full尚未於任何1.13.0以後SHA取得PASS（最後Run38841657256為18 PASS／1中斷／61未執行、exit143，SIGTERM來源未確定）。同日本機Docker（`mcr.microsoft.com/playwright:v1.49.1-noble`：Ubuntu 24.04.1、Node 22.12.0、Playwright 1.49.1／Chromium 131）：`650e4dd` Full 80 PASS／0 FAIL；重構後`5e7a6f1` 81 PASS／1 FAIL（display-preferences-e2e時序競爭，單獨重跑5次PASS，已於01d1c38修正），兩者656個artifact的RNG計數差異0。Node／Playwright版本與CI（24.15.0／1.62.1）不同，不等於CI PASS；證據僅保存於本機未追蹤的`test-results/linux-docker-2026-10-18/`。另含舊驗證工具依賴已放棄固定路徑之殘項（不得捏造舊baseline讓其通過）。2026-10-18補充：Run38841657256（#42，`650e4dd`）job log於`contract-salary-e2e`啟動約118秒時記錄`The runner has received a shutdown signal`後exit143，batch-2起所有步驟（含always）SKIPPED，僅batch-1 artifact（9.57KB）保留；與Run38750999932（#37，`29ae26b`）中斷於同一入口、約120秒。兩次皆以`--compare=7220ad8`（當時origin/main，1.12.0）執行。本機Docker限制2 CPU／7GB（Node 22／Playwright 1.49.1，對`c9c94cd`）：`--compare=650e4dd`時PASS（113秒，cgroup峰值3.49GB）；`--compare=7220ad8`時於career-P階段Node heap OOM（SIGABRT），放寬heap至6GB後容器達7GB遭kernel OOM kill。推定CI的runner shutdown為同一記憶體暴增所致（UNVERIFIED：CI端無記憶體證據，暴增位置未定位）。現origin/main為`650e4dd`，下次CI Full比較基準不同，未實跑不得視為PASS。重現證據保存於本機未追蹤的`test-results/ci143-contract-salary-2026-10-18/`。結案條件：GitHub Actions Linux Full於指定SHA取得PASS，或使用者另行豁免；artifact完整性仍由D2-CI-ARTIFACT-01追蹤。

- [ ] **D2-CI-ARTIFACT-01** — `ARTIFACT_COVERAGE_BLOCKED`。已實際執行Linux CI、短路徑Smoke與分批上傳；第1批保存成功不能解除完整原件保存缺口。bounded collector仍未接入正式CI；原始S／RNG／Decision／Receipt的可還原保存契約、容量／敏感路徑及還原驗證未完成。[缺口](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)／[分批限制](docs/reviews/LINUX_CI_FULL_1130_STABILITY_ACCEPTANCE.md)。本項維持未完成，不重跑Full、不刪證據。
- [x] **CI-FULL-STALE-01** — `MERGED / CI_PASS`（2026-10-24；①～③經PR #24併dev（`55e60a4`），④與⑤`:182`經PR #25併dev（`ec903fd`），dev Full [Run40093614384](https://github.com/tt-chin/yakyujinsei/actions/runs/40093614384) 92／92 PASS。原狀態：`IMPLEMENTED / PR_PENDING`；Run40090299447 91／92 PASS）。`dev`→`main`以merge commit合併（`04decb0`，1.13.5），dev push只跑Quick（#78／#79 PASS），Full首次於main手動Run40080471658執行：92入口87 PASS／5 FAIL。①`event-system-e2e:58,72`、②`draft-income-e2e:84`仍比對`b0a82a1`改名前的`スポンサー収入累計`；③`replay-share-theme-e2e:26`的分享PNG對1.11.0（`dc5ac871`）逐像素比較只排除底部100px，收入區已改為`incomeSummary`版面。三者本機重現FAIL，屬舊期待值；修正：①②改比對新標籤`スポンサー収入`（②的baseline側同時接受舊標籤），③以`fillText`記錄收入首行y座標，兩側y必須相同，只比較其上2px以上像素（`textBaseline='top'`，上一列表格完整保留）（負控制：在保留範圍最下列改1像素→FAIL）。修正後本機（macOS＋Brave）三入口PASS。④`game-view-dom-e2e`（`jp3-infielder-01/IF/first-row/1280` step 0 digest不一致但完整快照無差異）、⑤`display-preferences-e2e:87`（Enter後5秒內`#act`未變）本機未重現（④8／8、⑤3／3 PASS，`--baseline=origin/main`），推定為CI偶發。Run40090299447中⑤於`:182`再FAIL（`jp3-infielder-01` `state.pos` `"P"→"IF"`），原因確定為測試時序競態：`#seg-pos`的handler由非同步載入的`game.js:2144`綁定，`main.js`載入後才啟用`#btn-start`；`display-preferences-e2e:134`及`game-view-dom-e2e` `career()`只等`#btn-start`可見即點選守備位置，引擎未就緒時點擊遺失、維持預設P（④之IF step 0不一致而重取無差異亦同因）。修正：兩處改為等待`#btn-start`啟用（`waitForFunction(()=>!document.querySelector('#btn-start').disabled)`，與其他20處相同）；以`game.js`延遲1.5秒的重現腳本確認舊等待選到P、新等待選到IF；修正後本機兩入口PASS（`display-preferences-e2e` `--baseline=origin/main`、`game-view-dom-e2e` 8／8）。全22處`#seg-pos`點擊盤點後只有此兩處競態。Run #80的⑤`:87`（Enter後`#act`未變）原因仍**未確認**。完成條件：修正併入dev後dispatch Full，92入口全PASS；`:87`再現時另行調查。

> 歷史準備快照（2026-10-15，保留原時點）：`ARTIFACT_COVERAGE_BLOCKED`。CI job timeout已由60提高至120分鐘，但Linux實際驗證截至本次提交前尚未執行。bounded evidence collector限定測試47 PASS／0 FAIL，尚未接入正式CI；現有artifact glob保持，Full原始S／RNG／Decision／Receipt等證據仍有保存缺口。使用者接受先啟動Linux CI Full，完整封存另行改善；CI Full執行結果、workflow／上傳結果與artifact完整性須分開報告，保存完整性不得標PASS。結案需核准並驗證Gate→case→原件保存契約、超大JSON／64MiB上限處理、敏感路徑安全保存、缺失／損壞／超額與下載還原一致性；不得只用hash索引冒充完整可重播證據。未另行批准不接collector、不取代或擴大glob、不改Full條件或golden。[缺口與限定驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)。

- [ ] **TEST-COMPARE-BASELINE-01** — `DESIGN_PENDING`（2026-10-19縮小範圍）。以`origin/main`為比較基準的3入口（`contract-salary-e2e`、`draft-income-e2e`、`display-preferences-e2e`）在`dev`升版而`main`未跟上時，`birthHighSchool.createdVersion`版本戳記不同，自第0步不一致。**版本戳記部分已處理**：使用者批准比照既有`delete state.version`，於比對前排除該欄位（衍生結果`traits.smallschool`仍比對）；`display-preferences-e2e`亦改用共用`assertSameCareer`防止失敗時OOM。本機Docker 2 CPU／7GB驗證：3入口對`7220ad8`（1.12.0）與`650e4dd`皆PASS（`contract-salary-e2e` 381案，峰值≤3.49GB）；排除前對`7220ad8`的FAIL（含milb-demotion兩案）與`display-preferences-e2e`的OOM皆僅由此欄位造成。**剩餘待決**：有規則變更的版本於發布前跑dev Full時，跨版本比對是否須以許容差分oracle（如`assertApprovedProducerRenameCareer`）宣告差異，或明確接受該等入口FAIL；屬政策判斷，未經批准不改期望值或基準。固定基準的入口（如`hof-first-ballot-e2e`、`salary-history-e2e`）不隨`origin/main`變動，不在本項範圍。2026-10-19 CI確認：Run39260159042（`2a11a64`，Linux Chromium）中3入口對`650e4dd`皆PASS（`contract-salary-e2e` 135.9秒、`display-preferences-e2e` 115.1秒、`draft-income-e2e` 334.2秒）；本次`dev`與`main`的VERSION相同，不構成跨版本規則變更的驗證，剩餘待決不變。

- [x] **CI-FULL-BALANCE-01** — `MERGED / CI_PASS`（2026-10-24；實作`cdf0a25`隨PR #21併dev（`7fbfde4`，[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §10.7），dev push Quick Run40068894037 PASS 67／67；含`cdf0a25`的Full Run40046088278（`ec54253`）PASS 87／87、wall time 18分43秒，其後Run40055238234（`50139d0`）11分15秒（§11.6）。經使用者同意勾選）。原狀態：`PROPOSED / NOT_APPROVED`（2026-10-23）。依[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §7-2、§8，8批平行化已完成，但splitIds仍按入口數平分；Run39879968880指定b6f71f6（84入口）記錄21分37秒，批次耗時5／520／384／1205／550／23／294／321秒，第4批為瓶頸。依耗時平衡是另案未批准提案；舊86入口manifest試算不代表目前87入口或實測提速。需先決定manifest預估或實測校正，再另批ci-full-batches.mjs及其嚴格分批斷言變更；保留不漏測、不重複、任一FAIL／SKIP／BLOCKED不得PASS。驗收須指定SHA的完整Linux Full aggregate及實際wall time；本次只恢復漏列。2026-10-24：計畫見[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §9（DRAFT，未核准）；以manifest `seconds`為權重的LPT試算，最大批由本機617秒降至362秒（`full-power-pitching-e2e`單獨一批為下限），CI預估約13分，未實測。2026-10-24：已實作（`ci/full-balance` `cdf0a25`）；Run40038325238（`5b57f6e`）Full PASS 87／87，最大批測試1205→809秒，但wall time 21分47秒未改善（3批apt安裝約7分，見CI-ENV-PIN-01）；PR暫停至CI-ENV-PIN-01後一併驗證（§9.8）。

- [x] **CI-ENV-PIN-01** — `MERGED / CI_PASS`（2026-10-24；PR #21併dev（`7fbfde4`），dev push Quick Run40068894037 PASS 67／67（[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §10.7）。[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §10.6；`ci/env-pin` `ec54253`：Full Run40046088278 PASS 87／87、18分43秒，Quick、linux-smoke PASS；安裝步驟由最長8分降為2秒。合併後勾選）。原始記錄：Run40038325238 Full 8批中3批apt `Fetched 25.9 MB in 6min 47s`。CI執行環境未完全鎖定：`playwright install --with-deps chromium`的apt套件取Ubuntu noble當下最新版（有GPG簽章但版本漂移）；Chromium由`playwright-core`固定revision、自Playwright CDN下載，本機1.59下載程式未見checksum驗證（1.62.1未確認）；npm以`--no-package-lock`安裝。Tests #66（`7940e97`，Run39974089520）的Quick因apt鏡像`Fetched 20.0 MB in 11min 51s (28.1 kB/s)`耗時15分41秒（平常約4分；#67恢復為3分56秒）。首選方案：`tests`／`full-batch`改用以digest鎖定的`mcr.microsoft.com/playwright:v1.62.1-noble@sha256:…` container（`--ipc=host`，保留`setup-node` 24.15.0與`npm install playwright@1.62.1`），移除`--with-deps`；備案為apt重試設定。未確認：image字型對截圖比較（`replay-share-theme-e2e`）的影響、container內`/__w/_temp`與Linux temp路徑／linux-smoke的相容性、root執行時git操作、image拉取時間與內建Node版本。另可選CI專用lockfile（AGENTS §5須批准）。須修改`test.yml`與`check-workflow.mjs`（AGENTS §6.2須批准）；不採依賴快取（apt安裝於`/usr`，快取不解決慢速且不提供完整性）。

- [x] **CI-PITCHING-E2E-01** — `MERGED / CI_PASS`（2026-10-24；PR #22併dev（`136aa2c`），dev push Quick Run40070131548 PASS 67／67（[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §11.7）。原狀態：`IMPLEMENTED / CI_PASS / PR_PENDING`；[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §11.6；`ci/pitching-split` `50139d0`：Full Run40055238234 PASS 89／89、11分15秒（前次18分43秒），linux-smoke PASS；最大批537秒，各批仍不均屬manifest秒數校正另案。PR待PR #21合併後建立，合併後勾選）。`full-power-pitching-e2e`為CI Full單一最長入口（Run40038325238：809秒；Run40043897770：976秒；本機約362秒），在§9 LPT分批下獨佔batch 1並決定wall time。結構（`tests/full-power-pitching-e2e.mjs`，52行）：fixture 29件（E01 3寬×3角色×3投球方式、E03 TJ 2件，各1季）＋完整生涯**22次**（S01-S02 2 seed×3投球方式×old／now／repeat＝18、S03 IF 4；manifest記載「20」有誤），全部依序執行；每步一次`page.evaluate`並保存前後完整`S`與SHA256。候選：①測試內2–3個生涯並行（參考`retirement-hof-pilot.mjs:58`；須確認harness並行安全與記憶體峰值）②拆為多個Full入口供LPT分配（須處理一檔一入口的inventory與87入口斷言）。不刪除repeat重現斷言、不減少每步證據。分段耗時（2026-10-24本機macOS＋Brave 156，`ec54253`，36 PASS／363秒；harness `summary.json`的`records[].seconds`）：E01 24.9秒（7%）、E03 1.6秒、S01-S02 290.5秒（80%；`yakyo-test-001` 全力62.8／通常40.2／省エネ48.1＝151.1，`jp3-pitcher-02` 54.8／37.2／47.5＝139.5）、S03 44.3秒（12%）；每次生涯平均約15秒。輸出1.8 GB JSON（15個career檔，88–202 MB，縮排格式），202 MB檔的stringify＋寫入約0.6秒，非主因；主因推定為每步`page.evaluate`往返並傳回前後完整`S`（約530步／生涯，未單獨量測）。CI artifact不含此`summary.json`（輸出目錄不符`tmp/yakyujinsei-*`）。**使用者決定（2026-10-24）：採②，依seed拆分**，例如`yakyo-test-001`（151秒）／`jp3-pitcher-02`（140秒）／fixture＋S03（71秒），本機最大約151秒，依CI倍率2.2–2.7推算約330–410秒；拆分方式、inventory與87入口斷言、manifest `seconds`的處理待計畫批准後實作。預估瓶頸轉為`international-personal-stats-e2e`（392–545秒），Full wall time約10–11分，**未實測**。

> **未完成項目核算：** 3（規格／回歸／歷史細項）＋6（殿堂）＋4（實機／文案）＋6（待決／保留，含TJ顯示、表示token）＋10（候補及已實作待審UI）＋3（CI工具路徑／artifact／比較政策）＝**32**；64唯一ID、32完成／32未完（第2節28項含D2-G9-RELEASE，另4項為第3.6節已併dev的CI-FULL-BALANCE-01／CI-ENV-PIN-01／CI-PITCHING-E2E-01／CI-FULL-STALE-01）。C級高校與LEGACY清理分別列第2.10／2.11節；D2-G9-RELEASE在第3.6節作已完成發布索引。歷史驗收數字不修改。

## 4. 建議下一階段順序（非自動開發授權）

1. **發布後驗收**：dev至`c6d9c9f`的內容（1.13.6及重構至第20期）已由PR #41併入main（`9fe741d`）並上線，發布紀錄見頁首；1.13.1～1.13.6各項UI保留各自驗收限制。C級高校／弱小校語意已定案，不再列為下一步待決。
2. **CI殘項及稽核**：Linux Full僅各指定SHA已PASS，舊工具路徑、artifact原件保存與跨版本比較政策仍待完成；8批平行化、CI-FULL-BALANCE-01耗時平衡分批及CI-PITCHING-E2E-01投球E2E拆分均已併dev。重構至第20期已併main（`9fe741d`），§3.15葉領域全部完成。第21期（業餘路線試做，計畫§2y）已併dev（`f8c675b`），CI Full 93／93 PASS（Tests #106），尚未發布至main。第22期（契約，計畫§2z）已於`refactor/career-contract`本機實作並驗證（`0ef5737`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），經PR #43併dev（`a0ad197`）；§2y.4所列模組內呼叫繞過e2e替換的問題以Shadow配置處理並經負控制確認（§2z.6）。第23期（市場・移籍判定，計畫§2aa）已實作並驗證（`d350c58`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），經PR #43併dev；`applyKboForeignPackageCap`接縫由`kbo-renewal-e2e`（T11，§2aa.6）涵蓋。第24期（`movement`第一層，計畫§2bb）已實作並驗證（`2201aee`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），經PR #43併dev。第22～24期CI Full 93／93 PASS（Tests #110，`a0ad197`），尚未發布至main。CODE-DEAD-01（計畫§2cc）已於`refactor/code-dead-01`實作並驗證（`45cccd7`），PR #44→dev待合併。第25期（L2業餘分支，計畫§2dd）已於本機分支`refactor/amateur-movement`實作並驗證（`c568952`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），未push；`movement`其餘部分與年度流程尚無細部計畫，調查與方向見計畫§3.19、§3.18、§3.17、§3.16、§3.14、§3.6。本條不授權新重構、顯示修正、存檔或刪除LEGACY。AUD-02／REFACTOR-AUDIT-01仍未全面結案。
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

**文件性質：** 2026-10-22同步目前狀態與唯一ID統計；保留`1dacc55`使用者重編版後各階段的歷史結果，以下提交後證據均按原時點閱讀。不覆寫歷史測試、不把待決規格當成實作授權。

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

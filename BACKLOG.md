# BACKLOG — 野球人生（日文版）

> 文件整理版：2026-10-11｜來源：`tt-chin/yakyujinsei` 的 `dev` 分支 `aa602b3e39655dc30d1fb6b67099e1ca07a1d0a5`｜遊戲版本：`1.11.4`  
> **本檔為依照現行 BACKLOG.md 改寫的替換草案，尚未提交 GitHub。** 只整理分類、階段索引與說明，不代表重新執行測試或變更既有判定。

## 1. 最新進度總覽

| 指標 | 數量 | 說明 |
|---|---:|---|
| 已完成 | **10** | 有對應驗收紀錄，範圍以各報告為準 |
| 未完成 | **28** | 包含待驗證、受阻、設計待決、保留及候補 |
| P0 未完成 | **0** | 既有 P0 已按核准的結案標準關閉 |
| BLOCKED | **3** | 實機或原生分享環境不足 |
| IMPLEMENTED_UNVERIFIED | **7** | 已有實作或初步調查，尚未完成驗收 |
| DESIGN_PENDING | **6** | 尚待決定是否或如何調整規格 |
| 其他候補／保留／混合 | **12** | 不等於已核准開發 |

以上依本文件唯一的正式 checkbox 工作 ID 計算：**10 + 28 = 38**。階段表、說明、歷史快照不重複計數。

### 1.1 開發階段完成履歷

| 階段 | 主題 | 對應 ID | 結果 | 驗收報告 |
|---|---|---|---|---|
| 第一階段 | KBO 續約年俸下限修復 | `BUG-KBO-RENEWAL-FLOOR` | **完成** | [KBO_RENEWAL_FLOOR_FIX.md](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md) |
| 第二階段 | 成績按鈕、指名入團後選項 | `BUG-ACT-01`、`BUG-ACT-02` | **完成（現行功能驗收）** | [ACT_01_02_FINAL_ACCEPTANCE.md](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md) |
| 第三階段 | 行動／契約與年俸回歸 | `BUG-ACT-03`、`BUG-SAL-01` | **完成** | [CONTRACT_SALARY_ACCEPTANCE_AUDIT.md](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md) |
| 第四階段 | 統一測試 Runner 與 Linux CI | `TEST-RUNNER-01`、`TEST-CI-01` | **完成** | [TEST_INFRA_ACCEPTANCE.md](docs/reviews/TEST_INFRA_ACCEPTANCE.md) |

上述「階段」是方便管理的索引，**不是新的任務 ID**。此外還有兩項已完成的歷史稽核／測試盤點及一項殿堂錯置修復，列於第 2 節。

### 1.2 目前開發基準與限制

- **最新讀取的 `dev` HEAD：** `aa602b3e39655dc30d1fb6b67099e1ca07a1d0a5`。
- **遊戲 VERSION：** `1.11.4`。本次只改寫文件，無需升版。
- ACT-01 已按「現行功能」標準結案，但原始完整操作歷史不足，**沒有精確重現歷史故障路線，也沒有證明當年的根本原因**。
- ACT-02 的指名後第一選項、listener、單次執行及下一年度推進已通過指定矩陣；不宣稱所有未知路線均驗證。
- 320px／390px 是瀏覽器手機尺寸模擬，不能替代 iOS Safari／Android Chrome 實機。
- GitHub Actions 已能執行測試；**Branch Protection／Ruleset 強制合併檢查尚未設定**。
- 未經使用者明確批准，不得修改 `main`、正式網站、遊戲平衡、RNG、年俸／契約政策或殿堂係數。

## 2. 已完成工作（10／10）

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

## 3. 未完成工作（28 項）

### 3.1 P1 — 規格與回歸驗證（5 項）

- [ ] **AUD-03B** — `IMPLEMENTED_UNVERIFIED`。能力分配 Undo／reset 的 pool3、dice[2,4,6] × PC／320／390 六組已通過。Undo 可能把缺少的 carry key 補成 0（如 `{sta:0}` → `{sta:0,vel:0}`），數值等價但結構不同。尚缺 combo／late 解鎖、cap80、剩餘點數 0、確定特性影響及專用 E2E。**建議優先處理**。
- [ ] **AUD-02** — `IMPLEMENTED_UNVERIFIED`。CURRENT_SPEC 16 節已有程式／測試索引，尚缺全部數值、DOM 分支與跨功能交互的完整對照；發現差異先記錄，**不得直接修正遊戲**。
- [ ] **REFACTOR-AUDIT-01** — `IMPLEMENTED_UNVERIFIED`。`game.js` 約 3,100 行，需補全狀態 `S` 讀寫圖、AST 呼叫圖、RNG 消耗點、同名函式覆寫、LEGACY 可達性、模組邊界與分階段風險。**只調查，未批准大規模重構**。
- [ ] **AUD-04** — `IMPLEMENTED_UNVERIFIED`。對照封存設計的數值表、事件、API 與現行程式，只把仍有效的資料移入 CURRENT_SPEC；禁止自動恢復舊規格。
- [ ] **AUD-05** — `IMPLEMENTED_UNVERIFIED`。比較封存 AGENTS 各版與現行規則，舊規則不得無條件重新套用。

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

### 3.4 P2 — 規格待決與保留（6 項）

- [ ] **OVR-01** — `DESIGN_PENDING`。野手 OVR 加入 stamina 5% 的提案，先比較現行公式與提案，批准後才能修改。
- [ ] **TRAIT-PITCHER-TC** — `承認済み保留`。投手三冠王，須先決定單項投手獎制度；不能以最優秀投手獎代替。
- [ ] **TRAIT-NITENICHI** — `承認済み保留`。二天一流，須先有獲批准的二刀流及投手三冠制度。
- [ ] **TRAIT-CHAMPIONMAKER** — `承認済み保留`。優勝請負人，待累計 5 冠、計算範圍、勝率加成及 RNG 政策核准。
- [ ] **CONTRACT-LEGACY-01** — `重構候補・要調査`。確認舊 `makeOffers`／`pickOfferUI`／市場定義是否真正不可達；未驗證固定 Seed、契約回歸前不得刪除。
- [ ] **CONTRACT-ASIA-01** — `未実装・仕様待ち`。KBO 亞洲名額及球團整體外國人預算，與現有 `FOREIGN_STANDARD` 不同。

### 3.5 P2 — 未來功能候補（7 項）

- [ ] **INJ-UI-01** — 一般受傷風險細項顯示；計算與 UI 維持單一資料來源。
- [ ] **PLY-01** — 背號與年度履歷；需先決定 00、轉隊、重複及改號規則。
- [ ] **INT-01** — 各項國際賽事履歷；重用既有結果，不增加 RNG 抽選。
- [ ] **EVT-01** — 事件分類顯示；不得改變抽選候選及順序。
- [ ] **UI-06** — 新手遊戲內說明。
- [ ] **UI-07** — 遊戲內更新履歷；CHANGELOG 仍為唯一正式來源。
- [ ] **PLY-02** — 永久欠番；以前述背號履歷為前提，待組織、年數、成績及 RNG 規則批准。

> **未完成項目核算：** 5（規格／回歸）＋6（殿堂）＋4（實機／文案）＋6（待決／保留）＋7（候補）＝**28**。

## 4. 建議下一階段順序（非自動開發授權）

1. **AUD-03B**：補齊能力分配 Undo／reset、carry、combo／late、cap80 等測試，釐清結構差異是否有實際影響。
2. **AUD-02 ＋ REFACTOR-AUDIT-01**：現行規格對照與唯讀架構風險盤點，列出必須修正／建議修正／可延後事項；**不直接重構**。
3. **AUD-04 ＋ AUD-05**：整理封存文件與現行正本之間尚未核對的部分。
4. **HOF-NATURAL-SAMPLE-01**：補足自然到達四聯盟的研究樣本，之後再討論殿堂規則決策。
5. **實機與文案驗收**：在可取得實機時執行；P2 功能候補逐案另行批准。

### 4.1 已建立的測試基礎

- 統一 Runner：`node scripts/test.mjs list|quick|full|audit`。
- GitHub Actions：`dev` push quick、對 `main` PR full、手動指定 profile。
- 第四階段 Linux 證據：[Quick](https://github.com/tt-chin/yakyujinsei/actions/runs/38132643250)／[Full](https://github.com/tt-chin/yakyujinsei/actions/runs/38132662335)／[Audit](https://github.com/tt-chin/yakyujinsei/actions/runs/38132971169)。
- Audit 的 10 項 SKIP 包含人工／研究／實機／Cloudflare 等，不得視為 PASS。4,000 生涯研究尚未完成。
- ACT 最終驗收：Quick 44 PASS、ACT 專用 Full 入口 PASS（48 入團 fixture、6 pointer 案例、16 次完整生涯）、Preview 54 組 PASS；詳見[報告](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)。

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

**文件性質：** 本版是根據 2026-10-11 `dev` HEAD `aa602b3` 的 BACKLOG 重新編排，沒有修改程式碼、正式規格或歷史驗收報告；GitHub 原檔尚未更新。

# G1-B2 Consumer 相容性調查

> 2026-10-18歷史定位：本唯讀調查已獲使用者接受；下方未接線狀態與建議是2026-10-14快照，不代表目前1.13.0尚未實作Consumer。後續開發A／B限定驗收與證據限制見[精簡摘要](RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)，現行規格見[CURRENT_SPEC§17](../../CURRENT_SPEC.md#d2-current-spec)。保留原相容性理由、不同Consumer資格集合與歷史NOT_RUN，不重新授權接線。

日期：2026-10-14。模式：ANALYSIS_ONLY / READ_ONLY；本文件僅整理既有調查結果，不授權接線或產品實作。

## 1. 結論與基準

目前不能把 G1-B1 Adapter 直接替換到所有 Consumer。可優先考慮的是保留原文的唯讀顯示路徑；薪資與名人堂需要個別相容性驗收；一次性效果、付款及年度續行必須等待相應的 G3／G4。

以下為原始碼與既有證據核對，不是新接線的 Runtime PASS。

- Repository：`tt-chin/yakyujinsei`；Branch：`dev`。
- HEAD：`d2ea8a3bcf38044928aab86ae56289839c45a0e4`。
- VERSION：`1.12.0`，位置：[config.js](../src/config.js) 第 1 行。
- 本地 main：`4624753a5359acd6c63ab6957341376bd43c5c88`；本次未修改。
- 調查沒有 fetch／pull，以上是本地 dev 基準，不宣稱已重新同步遠端。
- G1-A 接受基準：`287dd1a00448add8563410659170aba0d8f2f012`。
- 新 Adapter 未被既有產品匯入；搜尋入口、產品來源及 scripts 未發現接線。既有產品來源相對 G1-A 接受基準沒有修改。

調查開始時的既有工作樹：

```text
 M docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md
?? docs/reviews/G1_B_PRE_IMPLEMENTATION_REVIEW.md
?? docs/src/engine/award-identity-policy.js
?? tasks/
?? tests/award-identity-policy.test.mjs
```

以上均為既存工作，不屬於本次文件整理，不覆蓋或提交。

來源 SHA256：

| 檔案 | SHA256 |
| --- | --- |
| award-identity-policy.js | `363c39186bbea9de4c9ce89ead3adfba8eeeb635292120d95c640b30e7cc02bf` |
| award-identity-policy.test.mjs | `5b9c2a8a35808d92fa11a30e8fbed68e43420310826e28835b5bffe24175ffdd` |
| game.js | `4b7d893b44d4cf943ff7c017c8bbca73474e5b5ae9bd8513455a80ae18315629` |

### 來源與證據界線

- [AGENTS.md](../../AGENTS.md)、[CURRENT_SPEC.md](../../CURRENT_SPEC.md)。
- [正式 D2 設計](../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md)、[決策紀錄](../designs/PITCHER_AWARDS_D2_DECISION_LOG.md)、[分階段實作計畫](../../tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md)。
- [G1-B 實作前審查](G1_B_PRE_IMPLEMENTATION_REVIEW.md)、[G1-A 限定修正驗收](G1_A_LIMITED_FIX_ACCEPTANCE.md)。
- [Adapter](../src/engine/award-identity-policy.js)、[模組測試](../../tests/award-identity-policy.test.mjs)。
- 未找到專用 G1-B1 Markdown 驗收報告；其最新 R1 證據來自前次回覆及本地測試產物，不能假造文件或當作本次 Consumer Runtime 驗收。
- 本次調查未執行 Quick、Full、完整生涯或新接線測試，均為 NOT_RUN。原有測試成果不轉記為本批 PASS。

## 2. 分類與風險

- A：可優先接入的候選，純讀取、無副作用，仍須證明相容。
- B：需要局部調整或個別相容性驗收。
- C：必須等待 G3 Receipt／G4 checkpoint 的相關交易及年度續行能力。
- D：暫不修改；範圍外、無實際接入必要或證據不足。

R1／R2／R3 依 AGENTS 的風險分級；正式 Gate 更嚴格時以 Gate 為準。分類不是實作授權。函式行號對應上述受查工作樹，後續修改需重新確認。

## 3. 核心 Consumer 相容性矩陣

主要來源：[game.js](../src/engine/game.js)、[trait-policy.js](../src/engine/trait-policy.js)、[薪資評價](../src/engine/salary-evaluation-policy.js)、[薪資升格](../src/engine/salary-promotion-policy.js)、[獎金政策](../src/engine/incentive-policy.js)、[名人堂政策](../src/engine/hall-of-fame-policy.js)。

| Consumer／位置 | 現行判定及 Adapter 相容性 | 狀態／RNG／去重影響 | 分類、依賴及最小驗收 |
| --- | --- | --- | --- |
| game.js `awards`：1355；`proSeason`：1348 呼叫，1350 接薪資評價 | 實際機率抽選與日文 honors producer。名稱可識別，但 Adapter 不能證明交易完成 | 寫 honors、AS、traits、pool，消耗主 RNG；semantic 視圖不能防止再次抽選、增加 AS 或追加原始 honors | C／R3。G3 原槽 Journal／效果；G4 年度中斷續跑。逐抽選比對、故障後一次性效果 |
| game.js phoenix／yips：1464–1474 | `added` 取所有當年度 honors，不僅剛追加者。yips 可因任何當年榮譽解除；phoenix 為舊 regex 加 G1-A 精確日文集合 | 修改 traits、removed、pool +8；此效果無直接抽選，但影響後續分支。未知／國際 MVP 可能仍命中舊 regex，不能無聲縮限 | C／R3。G3 效果 Receipt；G4 結果、配分及續行。生命週期一次性、六個漏判修正與 yips 範圍不可退化 |
| game.js `movement`：1605 舊判定；3134 active 委派 LEGACY | 當年度前綴、舊 `王/MVP/賽揚/澤村/最佳投手/金手套` 等判定及 G1-A 精確集合；不是單一 Registry 分類 | 判定讀 S；整體流程修改契約、階層、年度／年資並抽選。跨聯盟／國際及旧資料待遇須保留 | C／R3。G3 決定／效果一致性；G4 movement／advance 續行。goodReal true／false、歷年排除、chance55、單次年度推進 |
| trait-policy.js `awardTraitUnlocks`：55–75 | 同年同聯盟 AVG／HR／RBI 組合、精確 MVP。成績達標不等於實際得獎 | 寫 tripleCrownHistory、honors、traits、oldGhostPending；無直接 RNG。擴大 alias 可新增三冠／MVP | C／R3。G3 衍生 MVP／特性 Receipt；G4 年度續行。保留原 MVP 抽選及同年同聯盟去重 |
| salary-evaluation-policy.js `calculateMarketAwardAdjustment`：56–66；`buildSalaryEvaluationEntry`：103 | 當年度前綴、原文字串 Set；大獎 .75、部門 .35、守備／新人等 .25，上限 1.5 | 純函式，無 S 寫入／RNG，但結果進入 payD／薪資。semantic 去重與 alias 正規化可能改金額 | B／R3。G3 前可做純函式比較；產品切換須獨立驗收。大獎／部門／上限／跨聯盟／既有保障契約 |
| salary-promotion-policy.js `salaryAwardBonus`／`salaryEvaluationD`：110–122 | 大獎 +2、部門／守備 +1，上限 3；原 honors 未 semantic 去重 | 純函式、無直接 S／RNG；改變候選年俸。去重可能改既有結果 | B／R3。先差異 fixture，再獨立接入驗收；不重算已成立合約 |
| game.js `saveSalaryEvaluation`／`recordSalaryEvaluation`：2805–2823 | 儲存純計算結果至薪資評價／歷史 | 寫 S，無直接 RNG；後續續約／FA 受影響 | C／R3。獎項交易提交等 G3；年度恢復等 G4。不重算已完成年度 |
| incentive-policy.js `evaluateIncentive`：20–27；`awardCode`：10–18 | 當年度 regex 決定 FULL／HALF／NONE；`年度MVP`、`守備王`、`出塁王` 並非都在 Registry | 純計算、無 RNG；新人王不可自動視為 FULL，識別成功不等於獎金資格 | B／R3。G3 前可比較計算；保留 annualMax、reasonCodes 及各自資格集合 |
| incentive-policy.js `applyIncentivePayment`：29–34 | `yearlyIncentivePaid` 按年防重；回傳狀態由 caller 提交 | 更新收入、獎金及支付紀錄，無直接 RNG。沒有新 Journal 不等於未支付 | C／R3。G3 支付／效果；支付後描畫及續行等 G4。重复、舊已付、換約、次年預定薪資不混入已付 |
| hall-of-fame-policy.js `honorScoreFor`：28–74 | league includes、title includes／endsWith；亦含團隊／國際榮譽 | 純讀取，回傳 sc／mvp／aceN／king，無直接 RNG；原本沒有 semantic 去重，改分數會影響後續 | B／R3。純函式本身不必等付款 Receipt；個人／團隊／國際／歷史分開驗收，新獎項待遇依 G5–G7 |
| game.js `tierOf`：2049–2057；`retireScene`：2087，投票約 2120 | 評價下限與名人堂投票／legend | tierOf 純讀取；retireScene 寫 hofInfo／legend／legendLeague 並用 R／ri。去重改分可能改首輪與 RNG 分支 | 評分 B／效果 C，R3。年度 G4 不自動涵蓋退休投票恢復；交易變更須另行授權 |

phoenix 的舊判定含 `MVP|最佳投手|打擊王|全壘打王|新人王`，G1-A 再精確補入四聯盟現行最優秀投手賞／首位打者／本塁打王。降格保護原集合較寬，G1-A 補入最優秀投手賞／首位打者／ゴールデングラブ賞。兩集合不可合併。

目前新 P03「最多三振奪取投手賞」、P04「勝率第一位投手賞」未必命中舊薪資 regex；新 P02／P03／P05／P06 正式名稱也不全符合現有 HOF endsWith，P08 尚無現行明確待遇分支。這是未來接入風險，不是已存在的新 producer BUG。

HOF 現行主要權重包括：舊最優秀投手賞 460 並計入 aceN、大獎 MVP 420 並計入 mvp、新人王 140、GoldGlove 300、守備 220、部門 160、All-Star 投手 70／野手 40。不能用單一「重大獎項」集合代替這些不同 consumer 規則。

## 4. UI 與其他 Consumer

| Consumer／位置 | 相容性與副作用 | 分類／驗收 |
| --- | --- | --- |
| game.js `buildCareerViewModel`：620 → [player-detail.js](../src/ui/player-detail.js) `renderCareer`：7、achievements：10–11 | 原 honors 複本逐項 textContent 顯示。可逐項解析但保留 originalText、顺序、重複及未知值；不可改寫 S。無 RNG | A／R2，僅候選。無 G3／G4 依賴；PC1280／320／390、空值／未知／重複／開畫面 RNG0。現 UI 無需 ID，不建議無用途接線 |
| game.js `endGame` 分組：2228–2261；`shareImage`：2362，分組 2390–2417 | 移除年度後依原文分組、排序年份、計數與折行。semantic 去重或 canonical 名稱改動會改次數、名稱及圖像高度 | B／R2。僅隔離顯示 helper，不重構整個 endGame；驗證交錯 alias、同年重複、未知、年份與圖片裁切 |
| game.js `posLegendPhrase`：2036–2043 | 全生涯任意聯盟 GoldGlove／守備 honors 加防守出場比例，純讀取但影響文字 | B／R2。保留聯盟範圍，DH／比例邊界、舊 alias；無 G3／G4 必要性 |
| [championship-policy.js](../src/engine/championship-policy.js) normalize：12 起、settle：51 起 | 團隊榮譽精確遷移及自有 completed 紀錄；修改 S／honors，結算抽選 | D，個人 Registry 範圍外，保留；另案變更屬 R3 |
| [international-trait-policy.js](../src/engine/international-trait-policy.js) normalize：7、commit：37 | 國際賽準備／commit／completedKeys；寫國際成績、pool、injNext、traits、honors | D，不能因 Registry UNKNOWN 就忽略或改待遇；另案變更屬 R3 |
| [salary-explanation-policy.js](../src/engine/salary-explanation-policy.js) derive：3／AWARD_BONUS：11；[salary-detail.js](../src/ui/salary-detail.js) markup：7／adjustment：18 | 讀保存的 adjustment／理由代碼，不是獎項識別。純計算／DOM | D，無接入必要；開畫面不得重算過去薪資 |
| game.js `statTable`：2059、AS：2077；退休 WBC 文句：2296 | AS 讀累計成績不是從 honors 重算；WBC 歷史短名属範圍外，退休周邊含 RNG | D，不由去重視圖重算 AS、不順手修改退休訊息 |

盤點包含 docs/src 中 honors、award、achievements、日文名稱、regex、substring、includes／endsWith 的其他引用，不限任務列出的七個模組。

## 5. Adapter 公開 API 與缺口

來源：[award-identity-policy.js](../src/engine/award-identity-policy.js)。

### AWARD_REGISTRY／getAwardDefinition（26／46 行）

目前有 20 筆穩定 ID、displayName、aliases，未發現既有 ID 衝突；LEGACY_BEST_PITCHER、PITCH_ERA、PITCH_SAWAMURA 分開。沒有各 Consumer 的資格／待遇 metadata。名稱識別與效果資格不能混為一談，也不能新增一個共用大獎集合取代 phoenix、降格、薪資、獎金與 HOF 的不同規則。

### parseAwardHonor（56 行）

精確解析四位年份、已知四聯盟與註冊名稱／alias。level／role 等已知上下文可由 caller 提供，但不得從現在所屬推測歷史。識別 KBO 沢村字串不代表 P08 資格成立。

整段混合歷史只傳當前 level／role 可能產生假衝突。`scope=international/team/amateur` 才明確排除；未確定来源不能自行貼標。中文候選 alias 不因 caller 設 trusted 就變成可信名稱，仍需來源證據。

### identifyAwardDecision（97 行）

目前所有 Decision 均 fail-closed，包括看似完整的資料；這符合 B1 限定邊界，但不能支援未來 G3 已完成可信 Decision 優先視圖。可信完成判定及 Receipt 必須留待 G3，不能以 caller boolean 當成交易證據。

### buildAwardIdentityView（109 行）

在單一球員查詢範圍內，以 year／league／id 建 semanticKey，保留原文但分組同義名稱。沒有原始來源索引；例如 `[舊P03, MVP, 新P03]` 分組後再展開可能改變交錯順序。不可直接替換 UI 原列表。可逐項解析；若真有需求，未來另外批准唯讀來源索引／上下文契約。

全歷史單一 context 不能代替逐條可信來源。語義去重只是查詢視圖，不是刪除歷史原文或防重執行機制。

### 測試隔離邊界

[award-identity-policy.test.mjs](../../tests/award-identity-policy.test.mjs) 約 121 行要求既有 docs/src 相對 G1-A 接受 SHA 完全不變，而且沒有字面 Adapter 接線。任何合法 Consumer 接入都會使這條測試失敗。

下一批若要接線，必須明確批准階段化調整此邊界，保留 B1 零接線基準與證據，另加正向相容性及狀態／RNG 斷言。不得直接刪除防護或覆寫 golden baseline。本次沒有修改此測試。

## 6. 歷史相容性風險

1. 歷史最優秀投手賞不能轉為新 P02／P08；舊名稱及待遇保留。
2. G1-A 的 phoenix 三名稱、降格三名稱補正不得退化。GoldGlove 不取得 phoenix，All-Star 不擴大待遇。
3. 降格原集合不僅是六個漏判修正，還有其他王類／歷史判定，不能為了統一而縮限。
4. 當年跨聯盟 honors 的既有處理不能改成只看目前 league。
5. 身分 alias 不等於待遇相等：ホームラン王可在獎金判定命中，但現行市場評價不必同樣命中；年度MVP 等名稱在各 Consumer 的舊集合也不同。不能全域正規化後重算既有財務。
6. 未知國際 MVP 可能被既有 regex 處理；Registry UNKNOWN 不等於原處理應取消，也不得使用模糊 fallback 猜新 ID。
7. 不改寫原 S.honors、不追溯補發、不重算已支付收入與合約。缺少來源、規則版號、歷史階層時不補造。
8. 舊設計／紀錄中的 NOT_FIXED 或 AF07 NOT_IMPLEMENTED 是歷史狀態。G1-A 已接受、B1 模組已隔離建立，不代表 AF07 全部接線或完整 G1 已完成；本次不改寫正式紀錄。

## 7. 建議最小分批計畫（全部 PROPOSED）

### 批次一：未接線的 Consumer 相容性 fixture／API 契約準備

- 目標：逐 Consumer 比較原生結果與唯讀識別結果，先發現資格差異。
- 預計檔案：Adapter 與對應測試；不修改 Consumer、Runner 或 S。
- 納入：正常日文、可信 alias、不可信 alias、未知、跨年／跨聯盟、重複、個人／團隊／國際混合；原文順序與 semantic 聚合分開。
- 排除：Decision 信任、Receipt、效果资格改動、任何產品接線。
- 前置：明確授權必要唯讀 API 契約及階段測試邊界；不能自行改正式規格。
- 風險 R1：模組測試、原生 fixture、依賴／接線檢查；Quick 建議，Full 可依隔離條件豁免，不標 PASS。
- 完成：無 S／honors／RNG 寫入，舊待遇差異逐項可解釋，來源及順序契約清楚。
- 停止：發現產品載入、資格／RNG 變動、或來源政策未定。

### 批次二：有真實需求的唯讀 UI（可選）

- 只在有 ID 使用需求時接入逐項識別；目前 UI 僅原文顯示，沒有必要為推進進度新增無用途呼叫。
- 修改範圍限相關展示 helper／player-detail 與測試，不改名稱、順序、重複、DOM 行為或完整 endGame。
- 前置：批次一原文順序／未知值契約通過。
- R2：相關 UI 測試＋Quick；Full 依具體風險。PC1280／320／390、空歷史、舊名、未知、交錯重复、開閉 UI 状態及 RNG 零差分。
- 不需要 G3／G4；非預期文字、計數、狀態或 RNG 差異即停止。

### 後續依賴

- 薪資、獎金資格與 HOF 純函式可在 G3 前做相容性分析，但產品切換為 R3，須相关測試、Quick、Full 及必要固定 Seed 下游比較，不重算既有收入。
- awards 提交、phoenix、三冠／MVP／traits 一次性效果、獎金支付必須等待 G3。
- phaseEnd 結果描畫、配分、選項、movement、advance 的年度續跑必須等待 G4。
- 新 producer／名稱替換／待遇依 G5～G7 另行驗收；不提前併入 B2。
- 退休投票交易恢復不是年度 checkpoint 自動附帶的範圍，須另案授權。

## 8. 七項明確回答與 BLOCKER

1. **現有 Consumer 都能直接使用 Adapter？** 不能；部分資料不在 Registry 或原資格不同，Decision 完成判定尚未提供。
2. **G3 前可安全接入什麼？** 保留原文的唯讀顯示是候選；純計算先做比較，不等於已批准產品切換。
3. **哪些等 Receipt？** 發獎提交、phoenix、三冠／衍生 MVP／特性、付款。
4. **哪些等 checkpoint？** phaseEnd 結果／配分／選項、movement／advance 年度續行。
5. **API 必須先修什麼？** 切換前需來源／scope／順序契約；Decision 信任留待 G3。未證明必要前不為增加接線而改 API。
6. **哪些會改固定 Seed 生涯？** 薪資资格、特性、降格、HOF／投票、誤用 semantic 去重都可能改後續分支；零新增直接 RNG 不等於完整生涯零差分。
7. **下一個最小工作？** R1 未接線相容性 fixture／契約準備，而非 Consumer 實作。

仍阻擋接線的事項：各 Consumer 不同資格集合與歷史来源、未知／範圍外榮譽處理、原文順序／去重契約、B1 隔離測試邊界、可信完成 Decision／Receipt、年度故障續行，以及使用者的下一批明確授權。

## 9. 本次文件整理範圍

本次僅將既有唯讀調查整理成此文件，風險 R0，執行文件引用與 Diff 檢查。沒有重新執行遊戲測試，不將舊 PASS 視為新測試結果。

未修改產品、測試、正式 D2、AGENTS、CURRENT_SPEC、VERSION、CHANGELOG、BACKLOG、main；既有未提交修改保留。未 commit、push、merge、部署。完成後停止，等待審查及下一批授權。

# 待決事項 B（2026-11-28）

本檔整理 BACKLOG 中需由 code owner 決定方向的九項：現況證據、選項、各選項影響與開發端建議。前一批四項見 [待決事項](CODE_OWNER_DECISIONS_2026-11-28.md)（已全部實作）。請在 PR 留言決定；決定後記在各項的「決定」小節，實作依 AGENTS 第6章分類，各自另開分支。

- 調查基準：`origin/dev` `3885d83baff235a2b230e0caae7af4308ec066b7`（VERSION 2.3.1）。行號以此為準；引用舊報告時另註其基準。
- 本檔只整理現況與選項，不修改產品、規格、測試或殿堂規則，也不構成實作授權。

| # | 事項 | 選項 | 開發端建議 | 決定 |
|---|---|---|---|---|
| 1 | HOF-PITCHER-BALANCE-01 投手殿堂平衡 | A／B／C | A | |
| 2 | HOF-NATURAL-SAMPLE-01 後續研究範圍 | A／B／C | A | |
| 3 | PLY-02 永久欠番 | A／B | 由 code owner 決定 | |
| 4 | TEST-EVENT-SIGSEGV-01 | A／B／C | A | |
| 5 | D2-CI-ARTIFACT-01 | A／B／C | A | |
| 6 | AUD-02 規格與程式的 4 項差異 | 各項 A／B | 見各項 | |
| 7 | AUD-02 需實際執行的列 | A／B／C | A | |
| 8 | REFACTOR-AUDIT-01 範圍 | A／B／C | A | |
| 9 | COPY-01 全量清查 | A／B／C | C | |

---

## 1. HOF-PITCHER-BALANCE-01 投手殿堂平衡

依據：[S4 分析](../docs/reviews/HOF_NATURAL_SAMPLE_S4.md)、[批准範圍](HOF_JERSEY_APPROVED_SPEC.md):23、BACKLOG 該項。

### 現況

- 投手基本點 `W×13 + SV×6 + SO×0.9 + IP×0.35`（`docs/src/engine/hall-of-fame-tier-policy.js:6`），HLD 不計分。總分＝基本點＋榮譽點；MVP／最優秀投手保底スター，部門獎保底レギュラー。
- S4 資料：S3b 原始 JSON（`f3289a1`，2.0.0）中 6 個投手 seed × 4 聯盟策略 × 3 育成方式＝72 生涯，有一軍成績的聯盟生涯 100 個（NPB 50、KBO 27、CPBL 14、MLB 9）。
- 主要觀察（S4 只描述，不作結論）：
  - 每季分數中位數：SP 197、MR 83、CL 211；MR 約為 SP 的 42%。CL 分數主要來自 SV，MR 每季 HLD 中位 15 但不計分。
  - 主要角色的基本點中位數：SP 790（n=53）、MR 591（n=37）、CL 1,350（n=10）。榮譽點占總分中位：SP 0.19、MR 0.51、CL 0.48。
  - 100 個單位中沒有一個只靠基本點達到殿堂或スター；保底晉升共 36 次（KBO MVP 12 次最多）。
  - `pitcher-sp` 與 `pitcher-rp` 配對 25 組：基本點差中位 +31，SP 較高 13／25，**沒有一致方向**；差異受一軍季數混淆。
- 限制（S4 §3、§8）：同 seed 跑 12 種策略，配對樣本、非母體分布；100 個單位中 53 個在一軍換過角色；多數聯盟×角色格 n<10；無法分開「角色本身」與「較好的投手進入該角色」；未比較野手、未分析個人獎是否偏向特定角色。
- 「A／B／C 假說係數」在批准範圍（:23）只以「不採用」出現；現行文件中找不到係數或門檻的具體定義。

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 維持現制，以研究結案；把「HLD 不計分、MR 分數偏低」記為已知特性 | R0 文件：BACKLOG 結案、CURRENT_SPEC 視需要補一句 |
| B | 另批後續研究（例：野手對照、角色與能力分離），不改規則 | 研究工作；需另定範圍與樣本，與第 2 項連動 |
| C | 設計係數或門檻修改（例：HLD 計分） | R3：殿堂判定，需新規格、固定 seed 比對、Full |

**開發端建議：A**。配對比較沒有一致方向，樣本小且有配對與換角色的限制，現有證據不足以支持改係數；需要改時再以 C 另案提出。

### 決定

（待填）

---

## 2. HOF-NATURAL-SAMPLE-01 後續研究範圍

依據：[研究計畫](HOF_NATURAL_SAMPLE_PLAN.md):55、:77-78、[S3b](../docs/reviews/HOF_NATURAL_SAMPLE_S3B.md)、[S4](../docs/reviews/HOF_NATURAL_SAMPLE_S4.md)。

### 現況

- S1～S4 已完成；S3b／S4 樣本 144 生涯（投手、野手各 72）。S3b 中 `target-mlb` 36 生涯有 24 個從未赴美，只有 3 個生涯達殿堂（KBO 2、CPBL 1）。
- S5（4,000 有效生涯）保留、未授權；計畫 :55 註明規模取決於 S3 到達率與實際執行成本，需另批時間與環境。
- 計畫 :78 指出 MLB 報價未出現的問題（NPB-OFFER-WINDOW-01）影響 MLB 資料品質；該項已於 2.1.0／2.3.0 實作，但 S3b 樣本早於該修正。

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 研究停在 S4，於 BACKLOG 記錄樣本限制後結案 | R0 文件 |
| B | 批准有上限的 S5 試跑（code owner 指定生涯數與執行環境），以 2.3.1 重新取樣 | 研究工作；需另寫執行計畫，耗時依規模 |
| C | 原定 4,000 有效生涯 | 研究工作；耗時最長，需另批時間與環境 |

**開發端建議：A**，與第 1 項連動。若第 1 項選 B 或 C，本項才需要更多樣本，屆時以 B 指定規模。

### 決定

（待填）

---

## 3. PLY-02 永久欠番

依據：[批准範圍](HOF_JERSEY_APPROVED_SPEC.md):37-39、[PLY-01 計畫](PLY_01_JERSEY_PLAN.md):24、`docs/src/engine/jersey-policy.js:11`。

### 現況

- 批准範圍：未來只依同球團一軍年資、成績、榮譽判定；跨聯盟合計不得直接授與；不猜門檻；不接判定邏輯、抽選、能力或其他效果；不新增 RNG。
- 可利用的 PLY-01 資料：`S.jerseyHistory` `{teamId, year, number}`（只追加）、`S.log` 各列的球團、`S.orgTeamId`。適用 NPB、KBO、CPBL、MiLB／MLB，不含 IND／CORP。
- 尚無「同球團一軍年數」的計算定義。PLY-01 的禁號表為空（轉隊一律可沿用原號），註明「待 PLY-02 提供來源」。
- 遊戲內唯一相關文字是 `franchise` 特性的說明「一球団一筋。永久欠番待ったなし。」（`career-retirement.js:314`），僅顯示。

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 維持保留，不設門檻 | 不改 |
| B | code owner 給方向（門檻依據、顯示位置、是否影響禁號），開發端起草判定規格供核准 | 規格起草；實作另批。純顯示屬 R2，若影響存檔或判定則再分類 |

**開發端建議：由 code owner 決定是否要此功能。** 若選 B，請一併指定「同球團一軍年數」的計算方式（季數或一軍出場季、跨年轉隊如何計），以及欠番只作退休顯示，或也要進入 PLY-01 的禁號表。

### 決定

（待填）

---

## 4. TEST-EVENT-SIGSEGV-01

依據：BACKLOG 該項；整理前紀錄 [`b2b7f30^:BACKLOG.md`](https://github.com/tt-chin/yakyujinsei/blob/b2b7f30%5E/BACKLOG.md) SIGSEGV 條目（2026-11-01）；[OOP 計畫](GAME_JS_OOP_REFACTOR_PLAN.md):5414。

### 現況

- macOS arm64 上 `event-integration.test` 間歇 V8 SIGSEGV（exit=null、log 空）。crash report 堆疊相同：`vm.runInContext` → Baseline（Sparkplug）prologue → mark-compact。
- 實測（`294e4be` 同樹，平行 32）：

| 環境 | 崩潰 |
|---|---|
| Node 24.14 arm64 | 62／1,280 |
| Node 24.15 arm64 | 52／1,280 |
| Node 24.14 arm64＋`--no-sparkplug` | 0／320 |
| Node 24.15 x64（Rosetta） | 0／640 |

- `NODE_OPTIONS` 不接受 `--no-sparkplug`，本機無法不改 repo 就迴避。CI（Linux x64）沒有發生紀錄，但也未量測。本機目前 Node 24.14.0；CI 固定 24.15.0。
- 每次發生都依規則保留 FAIL，重跑 PASS 不覆寫，因此本機 Quick 偶爾需要逐次比對 crash report。

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 只在 darwin-arm64 執行此入口時加 `--no-sparkplug` | R2 測試基盤：改入口執行參數；驗證平行量測 0 崩潰、Quick；CI 行為不變 |
| B | 等更新的 Node 版本，升級後重做 arm64 平行量測 | 依 Node 發布時程；24.15 仍會崩潰 |
| C | 維持現狀 | 不改；本機繼續偶發 FAIL |

**開發端建議：A**。已有 0／320 的實測，只影響本機 arm64，不改產品與 CI。

### 決定

（待填）

---

## 5. D2-CI-ARTIFACT-01

依據：[保存缺口](../docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md) §3～§7、[分批限制](../docs/reviews/LINUX_CI_FULL_1130_STABILITY_ACCEPTANCE.md) §5、`.github/workflows/test.yml`。

### 現況

- `scripts/collect-ci-evidence.mjs` 已有（單檔 64 MiB、單包 256 MiB 上限；原始位元組、gzip、SHA 驗證；`--verify`／`--restore`），尚未接入 CI。
- CI 目前上傳 summary、log、各 batch 的 `tmp/yakyujinsei-*` 等（`upload-artifact` 保留 14 天），不經 collector。
- 阻礙：
  - 容量：本機 Full 結果 2,693 檔、6.58 GB；48 檔超過 64 MiB，最大約 238 MiB（`full-power-pitching` 生涯 JSON）。
  - 敏感路徑：含個人絕對路徑的原始 summary／log 無法同時保持原樣與遮蔽，判為 PRIVATE_PATH。
  - 真實 Linux／GitHub 下載與還原：NOT_RUN。
- 這是證據保存缺口，不代表 Full 漏測。

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 先決定「必須保存的原件」清單：哪些 Gate 需要原始 S／RNG／Decision／Receipt，哪些可由固定來源重新產生；暫不實作 | 文件與決策；之後才知道容量問題的實際規模 |
| B | 依現有設計接入 collector，並另定超過 64 MiB 的處理（分段串流、另一安全儲存通道或調整上限） | workflow 變更（需核准）＋測試基盤；需真實 Linux 下載驗證 |
| C | 維持 BLOCKED | 不改 |

**開發端建議：A**。先縮小必須保存的範圍，容量與敏感路徑問題才有具體大小；B 在範圍確定前做，可能保存了不需要的大型檔案。

### 決定

（待填）

---

## 6. AUD-02 規格與程式的 4 項差異

依據：[AUD-02 分類](../docs/reviews/AUD_02_TRIAGE_2026-11-28.md)（基準 `a4fb1b8`；以下已於 `3885d83` 重新確認）、[STAGE5 稽核](../docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)。

### 6.1 X1：舊 `makeOffers`／`pickOfferUI`

- 規格 `CURRENT_SPEC.md:648`：「旧makeOffers／pickOfferUI／旧crossOffers・faMarketの到達不能な定義は削除しない」。
- 程式：`docs/src` 中 `makeOffers`／`pickOfferUI` 0 筆，已於 `34c9c7b`（刪除 21 個舊本體）移除；`crossOffers`、`faMarket` 是現行函式。
- 選項：A 改規格，寫明舊定義已於 `34c9c7b` 刪除（R0）；B 維持原文（規格與程式不一致）。
- **開發端建議：A**。

### 6.2 07b／F01：Undo 還原 carry 的形狀

- 程式：配點時記錄 `beforeCarry:(S.carry&&S.carry[k])||0`，Undo 時 `S.carry[entry.abilityKey]=entry.beforeCarry`（`docs/src/engine/player-ability.js:40`、:48）。原本不存在的 key，Undo 後變成值 0。
- 規格沒有寫 key 的形狀；STAGE6 §4 確認 4 個案例數值等價。分類文件 :172 記錄「Code Owner 決定仍未找到紀錄」。
- 選項：A 規格寫明「Undo 後缺少的 key 以 0 還原，數值等價」（R0）；B 改程式，還原為不存在（R2 以上：動到配點狀態與存檔形狀，需舊存檔相容與前後比較）。
- **開發端建議：A**。

### 6.3 03d：非捕手守位的守備係數

- 規格 `CURRENT_SPEC.md:325` 只寫捕手 40%／40%／20%，並註明其他 dpScore 未個別驗證。
- 程式 `docs/src/engine/defense-position-policy.js` `defenseScoreFor`：

| 守位 | 係數 |
|---|---|
| SS | 守備範囲 .5、捕球 .3、肩 .2 |
| 2B | 守備範囲 .45、捕球 .4、肩 .15 |
| 3B | 肩 .45、捕球 .35、守備範囲 .2 |
| CF | 守備範囲 .55、捕球 .3、肩 .15 |
| RF | 肩 .45、守備範囲 .35、捕球 .2 |
| LF | 守備範囲 .4、捕球 .35、肩 .25 |
| C | 捕球 .4、リード .4、肩 .2 |
| 1B | 捕球 .6、守備範囲 .2、肩 .2 |

- 選項：A 把現行係數寫進規格作為現行值（R0，不改程式）；B 維持現狀（無可比對的規格值）。
- **開發端建議：A**。

### 6.4 F06：別名與 lazy schema 未集中

- `SAVE_STATE_CONTRACT`（`docs/src/engine/browser-save-state-contract.js`）已集中部分欄位；`abCost` 與 `eventAbilityCost` 刻意分開；年俸與球團的 accessor 分散在 `initial-state.js`、`browser-save-runtime.js`。
- 選項：A 以決定結案，維持現行分工並記錄理由（R0）；B 另立重構計畫集中管理（重構，需另批）。
- **開發端建議：A**。重構已於第 45 期結案（見第 8 項），集中管理沒有對應的功能需求。

### 決定

（待填：6.1～6.4 各自 A／B）

---

## 7. AUD-02 需實際執行的列

依據：[AUD-02 分類](../docs/reviews/AUD_02_TRIAGE_2026-11-28.md)「需實際執行（13）」及「仍不一致」。

### 現況

靜態閱讀與規格一致、但缺少執行證據的列（只需加測試，不改遊戲）：

| 群組 | 列 | 需要的驗證 |
|---|---|---|
| 成本低 | 03a／03b／03c | 投手／野手 ovr 與守備權重的純函式 fixture（排序、x.5 四捨五入、yips、未知 key） |
| 成本低 | 06d | 導覽讀取不改 S／RNG／URL：補 URL 不變斷言 |
| 成本低 | 14c | `#main-nav` 尺寸量測（3 種寬度 × 3 字級 × 2 密度） |
| 中 | 04a、04c | `amateurSeason` 依學年 × 強制結果；04c 同年重入時多一筆空 log 的觀察與 UI 可達性 |
| 中 | 06c、10g、10h | 復健／全休 DOM fixture；`pendStat` 角色 × 上限；特性解鎖到達矩陣 |
| 高 | 05f、11l、15f | 跨功能重入與中途失敗、存檔全動態路徑故障、長生涯 driver |
| 不可行 | 13c | 實機分享面板（需實機，BLOCKED） |
| 另案 | 02e | 由 COPY-01 處理（第 9 項） |

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 先批准「成本低」群組的測試；其餘記為殘餘未驗證 | 測試新增（R1／R2，不改遊戲）；Full 入口數會變，需 GitHub Full |
| B | 依序完成全部可行列 | 多個分支、工作量大 |
| C | 不補測試，把全部記為殘餘未驗證後讓 AUD-02 結案 | R0 文件 |

**開發端建議：A**。

另：不需決定、可直接記錄的 6 列（08e、14a、16d、F07 為歷史措辭；12g 依設計保留；F08 為總括）已在分類文件追記。

### 決定

（待填）

---

## 8. REFACTOR-AUDIT-01 範圍

依據：[OOP 計畫](GAME_JS_OOP_REFACTOR_PLAN.md):5690-5707、[重構路線](../docs/reviews/STAGE5_REFACTOR_ROADMAP.md):13-29、[STAGE5 稽核](../docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md):116、:186-208、`docs/reviews/STAGE10_PRE_REFACTOR_RISK_INVESTIGATION.md`:152、:195-201。

### 現況

- 完成條件寫「按核准範圍補足動態可達性證據」，但目前沒有核准範圍。
- 重構已依使用者決定在第 45 期結案（2026-11-21）；計畫 :5707 註明「本結案不構成 REFACTOR-AUDIT-01 的結案」。
- 未證明的內容：`S.*` 以外的動態寫入（`s.*`、別名、closure）、32 個頂層覆寫與 `LEGACY` 捕獲、各市場路線（draft、FA、release、cross、renew、extension）的 callback 可達性。STAGE10 只觀測 P、IF 兩條路線。
- 之後的變化：overlay 已於 `22e33e0` 移除，21 個舊本體已於 `34c9c7b` 刪除（靜態確認），`game.js` 剩 382 行。上述主張有相當部分針對已刪除的程式碼。
- 部分覆蓋的測試：`stage10-risk-e2e`、`stage7-safety-e2e`、`contract-salary-e2e`、`global-contract-market-e2e`、`draft-income-e2e`。

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 以決定結案：記錄已刪除的範圍，剩餘的動態可達性列為已接受風險；日後若再重構，由該計畫自行提出證據 | R0 文件 |
| B | 限定範圍：LEGACY 殘留 trace＋海外自然生涯路線的 callback 到達探針 | 測試與調查；中等工作量 |
| C | 全面證明所有 callback 與動態 scope | 工作量大，且多數對象已刪除 |

**開發端建議：A**。

### 決定

（待填）

---

## 9. COPY-01 全量清查

依據：[文案稽核](../docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md):9、:357、:494、[盤點](../docs/reviews/COPY_01_INVENTORY_2026-11-28.md)、`docs/reviews/COPY_01_INVENTORY_2026-11-28.tsv`。

### 現況

- COPY-001～033：除 020、021 外均已處理或判定維持（第一～三批，至 2.3.1）。020「最優秀投手賞」、021「最優秀中継ぎ」依賴未來 D2 獎項設計，現在不能改。
- 018 的「維持」判斷已失效：原文已不存在，現行選項為「権利を行使せず残留」「国内FAを宣言」「海外FAを宣言」（`docs/src/engine/career-movement.js:253-254`），文件只註明為後續審查對象。
- 盤點 TSV（基準 `54aa2ce`，早於第三批）：3,310 行，COVERED 63、HIDDEN 92、NOT_COVERED 3,155。扣除事件卡（1,104 行，依規則不全面重翻）與人名、隊名、主資料（391 行）後，剩 **1,724 行**。另有 25 個未編號的待審候選（「あなた」敘述、半形括號、入札／ポスティング、才／歳等）。
- 「全量清查」沒有定義完成條件；稽核文件 :357 只寫了下一階段的方法（AST 清單連到實際畫面、固定路線截圖、母語者審查）。

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 定義完成條件：1,724 行依畫面分批審查，母語者確認 | 多批文案工作，每批 R2／PATCH |
| B | 縮小到稽核文件列出的 8 個驗證群組 | 範圍較小，但群組邊界仍需定義 |
| C | 第二、三批 Preview 確認後，COPY-01 結案；全量清查改開新項目，並把 018、25 個候選併入，020／021 繼續等 D2 | R0 文件；新項目另定範圍與優先度 |

**開發端建議：C**。COPY-01 已完成的部分可以結案，剩下的範圍在新項目中重新定義，避免 COPY-01 無限期開著。

### 決定

（待填）

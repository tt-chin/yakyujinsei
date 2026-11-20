# INJ-UI-01：健康診斷故障風險的總值＋細目顯示（實作計畫・草案）

狀態：**草案，待使用者決定 D1～D4**。實作授權：2026-11-20（使用者；INT-01 之後，另開 PR）。上位決定：`tasks/P2_DISPLAY_DECISIONS_PLAN.md` §2（I2＝細目）、§5.3（I1＝公開總值＋細目，須標示範圍與時點）、§6（2026-11-21 再盤點）。
基準：`origin/dev` `8a4f765`（PR #109 合併後）。分支 `feat/inj-ui-01-injury-risk`（不追蹤 dev）。下列行號以 `8a4f765` 為準。

## 1. 現況（`8a4f765` 確認）

- **計算**：`player-injury.js:80-91` `injuryProb()`（`injuryRules` 內私有，不抽 RNG）＝ 15＋`injNext` → 年齡（≥35 +12／≥32 +6）→ 理論派且 <25 −5 → 鉄人＋スペランカー 固定 25／鉄人 `min(p,10)`／スペランカー `max(p,40)` → ＋`tmpInj||0` → `clamp(3,95)`。唯一呼叫端 `rollInjury`（`:92`），第一個抽選 `chance(p)`；未受傷時結果卡「故障率 X%」，受傷時卡片不含機率。
- **年度步驟**（`game.js:341` `yearSteps`）：`jerseyStep → phasePre → phaseIntlPre → phaseMid → phaseEnd`。存檔只在年初 `startReadyYear` 的 `capture(S)`（`YEAR_START_READY`，`year-flow.js:58-66`），位於 `jerseyStep` 之前。
- **狀態時序**：`phasePre` 才把 `tmpInj` 歸 0（`season-phases.js:17`）；`phaseIntlPre` 的國際大會可在同季診斷前讓 `injNext` +10；`phaseMid`（`:95-104`）＝戀愛事件 → 事件卡（加 `tmpInj`）→ 健康診斷 `rollInjury`（`injNext` 歸 0）。`skipMid`（復健）季不診斷。
- **顯示**：`career-presenter.js` `ability()` 的 condition 列只有「次回故障リスク加算」（`injNext`）、「今季一時故障リスク加算」（`tmpInj`）等；DOM 由 `ability-view.js` `addConditionRow`（`{label,value}` → `<dt><dd>`）產生。`ability-view.js` 屬 `287dd1a` 凍結檔（`award-identity-policy.test`，目前無 overlay），`career-presenter.js`、`player-injury.js`、`season-phases.js`、`desktop-overview.js` 不在凍結名單。
- **注入約束**、**測試耦合**：見 P2 計畫 §6（`full-power-pitching.test` 以 `data:` URL 載入 `player-injury.js`，檔內不能有相對 import；`verify-modularization` 逐字固定 `PlayerInjury` 回傳物件與 `game.js` 包裝；`salary-flow.test:137` 固定 `player-injury.js` RNG 呼叫點 `[0,7,6,2]`；`trait-policy.test` vm 切片執行 `new PlayerInjury({...})`）。

## 2. 共通設計（不依 D1～D4 改變）

- 新模組 `docs/src/engine/injury-risk-policy.js`（新檔，不受 `287dd1a` 凍結）：純函式 `injuryRiskBreakdown(state)` 回傳凍結物件 `{total, steps}`，`steps` 依計算順序列出各段（基礎、前季からの持ち越し、年齢、理論派、特性適用前小計、特性規則、今季の一時加算、上下限）與該段後的累計值。只讀 `state`，不寫、不抽 RNG。
- `player-injury.js`：`injuryProb()` 改為 `return injuryRiskBreakdownOf(S).total`；`injuryRiskBreakdownOf` 由 `game.js` 以延遲綁定 lambda 注入 `PlayerInjury`（檔內不 import），計算結果與舊式逐值相同。RNG 呼叫點、回傳物件、`rollInjury` 流程不變。
- `career-presenter.js` 直接 import `injuryRiskBreakdown`，在 `ability().condition` 加總值列（＋細目，形式見 D1）。既有「次回故障リスク加算」「今季一時故障リスク加算」兩列保留不刪（§2 指定外的既有表示不變）。
- 等價證明：舊 `injuryProb` 本體（`git show 8a4f765`）與新 `total` 在特性 5 組合 × 年齡 15～45 × `injNext` {0,10,20} × `tmpInj` {−5,0,10,60} 全格逐值一致。

## 3. 待決事項

### D1 細目的呈現方式

- **A（建議）**：condition 列可帶 `breakdown`；`ability-view.js` 以 `<details>` 呈現（summary＝總值，展開＝細目 `<dl>`）。符合 §5.3「總值直接可見，細目展開查看」。需在 `award-identity-policy.test` 新增 `ability-view.js` 的核准 overlay（逐字 exactReplacement）。`desktop-overview.js:30` 以 `ability.querySelector('details')` 讀「潜在能力について」的展開狀態：新 `<details>` 位於 condition 段（在能力段之後），DOM 順序上不會先被選到，但須以 E2E 確認，必要時改為專用 class 選擇器。
- **B**：只用既有 `{label,value}` 列平鋪約 7 列。不動凍結檔，但「コンディション」變長，與 §5.3「不以說明文字占滿主畫面」相違。

### D2 健康診斷後的顯示（§5.3 要求另提）

- 前提：存檔只在年初，所以「診斷完成 → 該年結束」這段不會跨存檔／續玩。
- **a（建議）**：新模組保留**僅存於本 session** 的判定記錄 `{state, year, breakdown}`。`rollInjury` 在 `chance(p)` 前透過注入的 lambda 記錄（不寫 `S`、不抽 RNG）。顯示時若記錄的 `state===S` 且 `year===S.year`，總值列改為「今季の健康診断：判定済み（X%）」，細目為判定當時的值。不新增 `S` 欄位，存檔格式、整段生涯 S 比較都不受影響。
- **b**：新增持久欄位 `S.injCheck`。效果同 a，但會改存檔內容和所有整段 S 比較（R3 核准差異大增），而上述前提下沒有持久化的必要。
- **c**：不記錄，只把標示改成「現在の状態での計算値」。診斷後仍會顯示含本季 `tmpInj`、`injNext`＝0 的重算值，容易被誤讀成判定值，不符 §5.3。
- **附帶問題 D2'（年初到 `phasePre` 前）**：這段期間 `tmpInj` 還是上季的值（含續玩後），重算出的總值會高估或低估下次診斷的值。
  - **甲（建議）**：同一個 session 記錄再加一個「本年 `phasePre` 已執行」標記（`season-phases.js` 經注入 lambda 通知）。標記之前計算時 `tmpInj` 視為 0，並在細目註明「シーズン開始時にリセット」。續玩時沒有標記，剛好就是 `phasePre` 前，判斷正確。
  - **乙**：照現值顯示，不處理（既有「今季一時故障リスク加算」列本來也顯示上季值）。

### D3 日文標示（候選，請修改）

| 位置 | 文字 |
|---|---|
| 總值列 label | 健康診断時の故障リスク |
| 總值列 value（診斷前） | `X%`（現時点） |
| 總值列 value（診斷後，D2a） | 判定済み（X%） |
| 範圍註記（細目末尾） | シーズン中盤の健康診断1回の判定確率です。シーズン全体の故障やトミー・ジョン手術の確率ではありません。今後のイベントで変わることがあります。 |
| 細目 | 基礎 15%／前季からの持ち越し +X%／年齢 +6%（32歳以上）・+12%（35歳以上）／理論派 −5%（25歳未満）／特性適用前 Y%／鉄人：上限10%・スペランカー：下限40%・鉄人＋スペランカー：25%固定／今季の一時加算 ±X%／上下限 3～95% |
| 復健季（`skipMid`） | 今季は健康診断なし（リハビリ中） |

- 細目只列適用的段（例如沒有理論派就不列），基礎、特性適用前、今季の一時加算、結果則一律顯示。依 §5.3，不寫成可直接加總的形式，也不寫「鉄人なら最終10%以下」。

### D4 版本

- 新增顯示功能，依 §9.2 屬於 MINOR；計算路徑改經新函式，所以是 R3。INT-01 的 D6 也未決，建議兩者一起決定（例如 INT-01 和本項合為一個 MINOR，或依序各升）。

## 4. 分類與驗證（R3）

- 單元測試（新）：§2 的全格等價；§5.3 驗收的特性 5 組合、年齡邊界 24／25、31／32、34／35、`tmpInj` 為負（求婚 −5）、3%／95% 夾限；`steps` 的累計值與 `total` 一致；D2 記錄的寫入時點（`chance` 之前、只寫一次）與 `state`／`year` 不符時不採用。
- E2E：投手／野手固定 seed，變更前後整段生涯 S＋RNG 次數一致（D2a 時 S 應零差異）；診斷前／診斷後／復健季／年初四種顯示；切頁、展開、重繪前後 RNG 次數不變；PC／モバイル。
- 負控制：計算順序對調（`tmpInj` 先於特性規則）、拿掉夾限、D2 記錄改為診斷後才寫入、`desktop-overview` 展開狀態誤讀。
- Quick 本機；Full 依 6.1 R3 為必要 →「Full 實行が必要（GitHub 手動・未実行）」。
- **T 表（受影響測試與核准差異）**：D1～D2 決定後在 scratch 草稿上實測，並跑 4 群 Full 後再提出。已知候補：`award-identity-policy.test`（D1A）、`career-presenter.test`（`097e212` 舊 builder 逐欄比較 `ability()`）、`record-condition-fix.test`、`information-architecture.test`、`ui-foundation.test`、`japanese-copy-contract-ui.test`、`verify-modularization`、`salary-flow.test`、`trait-policy.test`、`full-power-pitching.test`、`design-tokens-06`（新 CSS）、`display-preferences.test`（新顏色 token）、DOM snapshot 系 E2E（`#bd-*` 不變，但 ability 面板會變）。

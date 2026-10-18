# 野球人生｜game.js 物件導向化分期計畫書

**文件狀態：IMPLEMENTATION_PLAN / PHASE1_LOCAL_AUTHORIZED（2026-10-18）**
**建立日期：2026-10-18**
**對應 BACKLOG：`REFACTOR-AUDIT-01`（本計畫不使其結案）**

> 本文件是工程計畫，不是實作、commit、push、merge 或部署授權。每一期須另行取得使用者明確批准後才可修改程式。第五階段路線「不將所有legacy函式一次搬入類別」仍有效：本計畫逐期、逐組進行，不一次搬移。

## 0. 總體方向

| 期 | Class | 範圍摘要 | 風險 | 狀態 |
|---|---|---|---|---|
| 1 | `Rng` | 封裝生涯 RNG 的種子與步進演算法；`S.rngState` 仍為唯一狀態 | L3 / R3 | 已批准本機實作與驗證；PR 併入 `dev` 另批 |
| 1b | `Rng` 觀測 hook | 測試改用正式 hook 計數，脫離原始碼字串替換 | L2（測試基建） | 已列入，接第 1 期；細部計畫另批 |
| 2 | `GameView` | `board`／`card`／`divider`／`choose`／`allocUI` 等 DOM 操作移出 | L3 | 概要 |
| 3 | `CareerSession` | 收容 `S` 外狀態（`stepQ`、`choiceGeneration` 等）與年度流程函式 | L3 | 概要 |
| 4 | LEGACY 覆寫逐組處理 | 32 組覆寫逐組決定合併或 `super` | L3 | 概要 |

共通原則：

- `S` 保持純資料物件，不改為 class（AGENTS §5、CURRENT_SPEC §2；固定 seed 測試直接比對 `S`）。
- `*-policy.js` 純函式維持現狀，不改為 class。
- 不引入 npm、建置工具或框架；維持 ES modules 靜態配信。
- 不改遊戲行為：同一 seed／選擇 → `S`、RNG 消耗次數、畫面結果完全一致。允許差分：**無**。
- 內部重構不升 VERSION（§9.3）；不更新 CHANGELOG、CURRENT_SPEC。

## 1. 前置條件

1. **D2／main 狀態**（2026-10-18 更新）：`main`、`origin/main` 為 `650e4dd21718b4abec3876fc9ef6148714c21d4f`，1.13.0 已自此 SHA 正式發布。`origin/dev` 為 `046915cec84e629ce029c3658996e06c008974fd`，`650e4dd` 之後只有文件 commit（含本計畫的 PR #4），`docs/src`、`tests`、`scripts` 無變動。BACKLOG `D2-G9-RELEASE` 為 `RELEASED / RESIDUAL_GATES_DEFERRED`（Linux Full `NOT_ACCEPTED / DEFERRED`），尚未結案。殘項未結案時是否可開始第 1 期，由使用者決定。
2. **作業分支為 `plan/game-js-oop-refactor`**：已 fast-forward 至 `origin/dev`（`046915c`）。完成後以 PR 併入 `dev`（同 PR #4 方式，符合 AGENTS §10.1），不修改 `main`。
3. **比較基準**：`650e4dd21718b4abec3876fc9ef6148714c21d4f`（與 `046915c` 的程式碼相同；若前置 1 的結論改變基準，以使用者指定的完整 SHA 為準）。

### 1.1 與其他 BACKLOG 未完成項目的排序限制（2026-10-18 依 BACKLOG 記述判斷，未逐項讀碼）

1. **D2-G9-RELEASE 殘項**：1.13.0 已發布，`main` 合併時夾帶重構的風險已不存在。殘項（Linux Full 等）若需重新驗證，須明確指定受驗 SHA `650e4dd`，不得以 `dev` HEAD 代替。殘項未結案期間，重構 PR 是否可併入 `dev` 由使用者決定。
2. **規則變更不得與重構同一 change-set**：重構的證明前提是「差分＝無」，混入規則差分即失效。`OVR-01`、`TRAIT-SMALLSCHOOL-SEMANTICS-01`、`TRAIT-NITENICHI`、`TRAIT-CHAMPIONMAKER`、`CONTRACT-ASIA-01`、HOF 決策五項（`HOF-BUCKET-DECISION-01`、`HOF-PITCHER-BALANCE-01`、`HOF-HONOR-POLICY-01`、`HOF-DISPLAY-ROUND-01`、`HOF-VOTE-STORY-01`）只能在期與期之間各自獨立進行，並使用各自的 baseline 與許容差分。`TRAIT-CHAMPIONMAKER` 涉及 RNG 政策，若在第 1 期之後實作，應經由 `Rng`。
3. **第 1 期與 HOF 研究不同時進行**：第 1 期修改 `tests/retirement-hof-test-support.mjs`，該檔同時是 `HOF-NATURAL-SAMPLE-01` 研究工具的函式抽取支援。
4. **第 2 期（`GameView`）避開 UI 類項目**：`COPY-01`、P2 功能候補七項（`INJ-UI-01`、`PLY-01`、`INT-01`、`EVT-01`、`UI-06`、`UI-07`、`PLY-02`）須排在第 2 期之前或之後，不得並行。`EVT-01` 另受「不得改變抽選候選及順序」限制。實機三項（`EVT-1102-ANDROID`、`UI-17-DEVICE`、`SHARE-111-DEVICE`）若在第 2 期前完成，第 2 期後須重新驗收。
5. **可合併處理**：`CONTRACT-LEGACY-01`（`makeOffers`／`pickOfferUI` 是否不可達）併入第 4 期的可達性證據。第 2 期以後，`AUD-02` 等稽核文件引用的 `game.js` 行號將大量失效，各期完成時記錄行號變動，不改寫歷史報告。
6. **不受影響**：`HIST-SPEC-CLAUSE-01`。
7. `D2-CI-ARTIFACT-01` 未結案期間，重構各期的 L3 證據以本機保存為主，不得以 CI artifact 宣稱完整證據。

## 2. 第 1 期：`Rng`

### 2.1 現況（2026-10-18 唯讀確認）

- 現行生涯 RNG 定義在 `docs/src/engine/game.js:2831–2832`（IIFE `2794` 內），覆蓋檔頭舊定義：
  - `seedInit = function(seed){ S.rngState=fnv1a32('v1:'+seed)||0x6D2B79F5; _s=S.rngState|0; };`
  - `R = function(){ S.rngState=(S.rngState+0x6D2B79F5)>>>0; …; _s=S.rngState|0; return …/4294967296; };`
- 狀態存於 `S.rngState`，而非 `R` 內部。這是必要條件：
  - `game.js:3325` `S={rngState:0};seedInit(SEED);S=newState(...)`，`newState` 複製 `rngState`（`game.js:2948`）。
  - `game.js:1434` 獎項處理以 `const S=structuredClone(before)` 遮蔽本地 `S`，但 `R` 仍推進模組層級 `S`（`realState.rngState`，`game.js:1436`）。
- 檔頭舊定義（`seedInit`、`R`、`ri`、`pick`、`chance`、`clamp`、`N0`，約 `game.js:52–62`）：`ri`／`pick`／`chance`／`N0` 以名稱晚綁定呼叫 `R`，因此實際使用覆蓋後的 `R`。
- 呼叫點：`R()` 直呼 33、`ri(` 74、`chance(` 43、`pick(` 23、`N0(` 8（`game.js` 內語法計數）。
- `_s` 在覆蓋後只被寫入；讀取者僅舊 `R`。
- 靜態檢查：IIFE 之前沒有欄 0 的頂層 RNG 呼叫。**動態確認（舊 `R` 從未被呼叫）：UNVERIFIED**。

### 2.2 測試對原始碼文字的耦合（設計的主要約束）

| 類型 | 檔案 | 依賴的文字 |
|---|---|---|
| E2E 呼叫計數注入（15 檔） | `bug-act-01-02-e2e`、`championship-intl-e2e`、`contract-salary-e2e`、`display-preferences-e2e`、`draft-income-e2e`、`event-fix-e2e`、`event-system-e2e`、`global-contract-market-e2e`、`hof-first-ballot-e2e`、`kbo-renewal-e2e`、`npb-return-e2e`、`replay-share-theme-e2e`、`retirement-hof-pilot`、`salary-history-e2e`、`trait-system-e2e`（皆在 `tests/`） | `source.replace('R = function(){', …計數…)` 與 `'function R(){'`；baseline 比較時對舊 SHA 原始碼套用同一替換。替換不中時**靜默不計數** |
| vm 抽取單行執行 | `tests/award-journal-native.test.mjs:26–31`、`tests/retirement-hof-test-support.mjs:19–21` | 正則 `seedInit = function\(seed\)\{[^\n]+`、`R = function\(\)\{[^\n]+`（單行）；`productionFunction('fnv1a32')` 從 `game.js` 抽出 |
| 舊定義文字斷言 | `tests/fixed-seed-v160.test.mjs:4–9` | 讀取現行 `game.js`，從 `function seedInit` 切片並斷言舊 `seedInit`／`R`／`ri`／`chance` 文字 |

因此第 1 期的設計限制：

1. 保留 `seedInit = function(seed){` 與 `R = function(){` 的字首，且各自維持**單行**。
2. 所有 RNG 消耗仍經過 `R`（計數 hook 唯一位置）。`Rng` 本期不提供 `int`／`pick`／`chance`／`normal`，呼叫點不遷移。
3. 檔頭舊定義（約 52–62 行）本期不動。
4. `fnv1a32` 留在 `game.js`，以參數注入 `Rng`。

### 2.3 介面

新檔 `docs/src/engine/rng.js`：

```js
/* 生涯用RNG。狀態は常に getState().rngState に保持する。 */
export class Rng {
  constructor(getState, hash) { this.getState = getState; this.hash = hash; }
  seed(seed) { const s = this.getState(); s.rngState = this.hash('v1:' + seed) || 0x6D2B79F5; }
  next() { const s = this.getState(); s.rngState = (s.rngState + 0x6D2B79F5) >>> 0; let t = s.rngState; /* 現行 R と同一演算 */ return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
}
```

- `getState`：延遲讀取模組層級 `S`（每次呼叫重新讀取，以支援 `S` 重新指派與 `game.js:1434` 的本地遮蔽語意）。
- `hash`：注入 `game.js` 的 `fnv1a32`。
- `Rng` 不持有狀態、不寫 `_s`、不讀 DOM。
- `next()` 內演算式逐字對照 `game.js:2832`，不重排運算。

`game.js` 變更（IIFE 內，2831–2832 附近）：

```js
const careerRng = new Rng(() => S, fnv1a32);
seedInit = function(seed){ careerRng.seed(seed); _s=S.rngState|0; };
R = function(){ const v=careerRng.next(); _s=S.rngState|0; return v; };
```

- 保留 `_s` 同步，使本期為純搬移；`_s` 與舊定義在第 4 期依可達性證據一併移除。
- `import { Rng } from './rng.js';` 加在既有 import 區塊。
- 確認 `fnv1a32` 為函式宣告（hoisting），在 `careerRng` 使用前可用。

### 2.4 測試變更（harness 變更，非期望值變更，需揭露）

1. `tests/award-journal-native.test.mjs`、`tests/retirement-hof-test-support.mjs`：vm context 加入 `Rng`（由 `docs/src/engine/rng.js` import），並在抽取的兩行之前執行 `const careerRng=new Rng(()=>S,fnv1a32);`。不改斷言與期望值。
2. 新增 `tests/rng.test.mjs`：多組 seed（含空字串、日文、`fnv1a32` 結果為 0 的退回分支若可構造）各取前 N 個輸出與最終 `rngState`，比對以基準 SHA 現行 `seedInit`／`R` 產生、寫死於測試內的 golden 值（註明產生來源 SHA）。另驗證 `S` 重新指派後 `next()` 推進新物件。
3. 新測試依既有靜態單元測試格式登錄於 `scripts/test-manifest.mjs`（quick），並在 `scripts/TESTING.md` 補一行。
4. 15 個 E2E 與 `fixed-seed-v160` **不修改**；以其照常通過且 RNG 計數非 0 作為字首保留的證據。

### 2.5 驗證（L3 / R3）

1. `node --check` 檢查 `rng.js`、`game.js`；確認無 404、Console 無錯誤。
2. `tests/rng.test.mjs`、兩個 vm harness 測試。
3. 動態確認舊 `R`／舊 `seedInit` 不被呼叫：於 scratch 複本讓舊定義 throw，跑一次 E2E；結果記錄為 VERIFIED／UNVERIFIED。不提交此修改。
4. `node scripts/test.mjs quick`。
5. baseline 比較 E2E（`draft-income-e2e`、`display-preferences-e2e`、`contract-salary-e2e`）以 `--baseline=650e4dd21718b4abec3876fc9ef6148714c21d4f`：`S` 差分 = 無、RNG 呼叫計數差分 = 無，且計數 > 0。
6. `node scripts/test.mjs full`。
7. FAIL／BLOCKED／SKIP 分別記錄，不標 PASS。

### 2.6 交付

- 變更檔：`docs/src/engine/rng.js`（新）、`docs/src/engine/game.js`、`tests/award-journal-native.test.mjs`、`tests/retirement-hof-test-support.mjs`、`tests/rng.test.mjs`（新）、`scripts/test-manifest.mjs`、`scripts/TESTING.md`。
- 實作後交 reviewer 審查 diff。
- commit／push 及 PR 併入 `dev` 須另經使用者批准；Preview 確認與 `main` 反映依 AGENTS §10。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC。BACKLOG `REFACTOR-AUDIT-01` 是否補記由使用者決定。

### 2.7 本期範圍外

- `award-rng-policy.js`（獨立雜湊抽選，非 `R`）。
- `crypto.getRandomValues` 的 seed 產生與 `deriveSeedInt`。
- `ri`／`pick`／`chance`／`N0`／`pickRecord` 與 192 個呼叫點的遷移。
- `game.js:2779` 另一開始路徑（疑似 LEGACY，行為不變；第 4 期處理）。
- 其他 LEGACY 覆寫群組。

### 2.8 第 1 期的效益界線

本期只把演算法與狀態存取集中到一個物件，呼叫端不變；物件導向的收益有限。限制來自測試以原始碼文字掛鉤 RNG。要讓 `ri`／`pick` 等改用 `Rng` 方法，必須先完成第 1b 期。

## 3. 後續各期概要（細節於各期開始前另立計畫）

### 3.1 第 1b 期：RNG 觀測 hook

- `Rng` 提供正式觀測點（例：建構參數 `onDraw`），測試改由 hook 計數。
- 18 個文字耦合測試脫離原始碼替換；baseline 舊 SHA 仍需舊替換方式，兩者並存至基準 SHA 包含 hook 為止。
- 完成後才可把 `ri`／`pick`／`chance`／`N0` 改為 `Rng` 方法並遷移呼叫點。

### 3.2 第 2 期：`GameView`

- DOM 操作移入 `GameView`；核心傳遞 view model 與 callback。同時完成 STAGE5 路線 R3（view model 抽出）。
- 前置：確認 `onclick` 內的遊戲邏輯（如 `allocUI` → `allocDone`）的呼叫順序與 RNG 消耗不變。

### 3.3 第 3 期：`CareerSession`

- 收容 `S`、`careerRng`、`view` 及 `S` 外狀態（`stepQ`、`choiceGeneration`、`activeChoiceToken`、`pendingOffseasonSalary`、`npbReturnOfferContext`、`corpSettlements`、`seasonEndContext`）。
- 先作為容器搬移，不改流程邏輯。

### 3.4 第 4 期：LEGACY 覆寫

- 32 組逐組決定「合併為單一版本」或「`extends` + `super`」；捕獲原函式與讀取新綁定的語意差異需逐組驗證（STAGE5 稽核）。
- 刪除舊定義前需執行期可達性證據；包含檔頭 RNG 舊定義與 `_s`（同時調整 `fixed-seed-v160`）。

## 4. 使用者決定（2026-10-18）

1. 前置 1：D2-G9-RELEASE 殘項未結案，仍可開始第 1 期的本機實作與驗證；重構 PR 併入 `dev` 的時機另行決定。
2. 第 1 期：批准依本文實作。commit／push／PR 仍依 §2.6 另批。
3. 第 1b 期：列入，接在第 1 期之後；開始前另立細部計畫並取得批准。

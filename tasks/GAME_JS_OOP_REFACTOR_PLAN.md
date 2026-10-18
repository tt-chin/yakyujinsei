# 野球人生｜game.js 物件導向化分期計畫書

**文件狀態：IMPLEMENTATION_PLAN / PHASE1_LOCAL_AUTHORIZED（2026-10-18）**
**建立日期：2026-10-18**
**對應 BACKLOG：`REFACTOR-AUDIT-01`（本計畫不使其結案）**

> 本文件是工程計畫，不是實作、commit、push、merge 或部署授權。每一期須另行取得使用者明確批准後才可修改程式。第五階段路線「不將所有legacy函式一次搬入類別」仍有效：本計畫逐期、逐組進行，不一次搬移。

## 0. 總體方向

| 期 | Class | 範圍摘要 | 風險 | 狀態 |
|---|---|---|---|---|
| 1 | `Rng` | 封裝生涯 RNG 的種子與步進演算法；`S.rngState` 仍為唯一狀態 | L3 / R3 | 已批准本機實作與驗證；PR 併入 `dev` 另批 |
| 1b | `Rng` 觀測 hook | 測試改用正式 hook 計數，脫離原始碼字串替換 | L3 / R3（含 `game.js` RNG 路徑） | 細部計畫見 §2b；已批准本機實作 |
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
| vm 抽取單行執行（2026-10-18 補列） | `tools/development-b/award-runtime-support.mjs`（`harness` 被 quick 的 `tests/pitcher-award-integration.test.mjs`、`tests/award-history-b-comparison.test.mjs` 使用）、`tools/development-b/legacy-effect-boundaries.mjs`、`tools/development-g9/verify-version-metadata.mjs`（後兩者未接入 `test.mjs`） | 同上正則，或 `line('seedInit = function(')`／`line('R = function(')` |
| RNG 文字不變斷言（2026-10-18 補列） | `tools/development-b/legacy-slot-source-check.mjs`（未接入 `test.mjs`） | 斷言基準與現行的 `seedInit`／`R`／`chance` 行完全相同；重構後必然不成立 |
| 歷史驗證工具（2026-10-18 補列） | `docs/reviews/award-jp-name-validation/validate.mjs`、`docs/reviews/g1-a-validation/fixtures.mjs`、`docs/reviews/pitcher-awards-d2-technical-validation/validate.mjs`（vm 抽取）；`docs/reviews/pitcher-tc-research/research.mjs`（字串替換，字首保留即不受影響） | 綁定各自基準 SHA 的證據紀錄 |

不受影響（已確認）：`tests/stage10-risk-e2e.mjs`、`tests/support/stage6-browser.mjs`（僅執行期呼叫 `seedInit(SEED)`）、`scripts/audit-architecture.mjs`（AST 名稱清單）。

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

1. `tests/award-journal-native.test.mjs`、`tests/retirement-hof-test-support.mjs`、`tools/development-b/award-runtime-support.mjs`、`tools/development-b/legacy-effect-boundaries.mjs`、`tools/development-g9/verify-version-metadata.mjs`：vm context 加入 `Rng`（由 `docs/src/engine/rng.js` import），並在抽取的兩行之前執行 `const careerRng=new Rng(()=>S,fnv1a32);`。基準 SHA 的原始碼不引用 `careerRng`，同一前置對新舊原始碼皆可用。不改斷言與期望值。
   - `tools/development-g9/verify-version-metadata.mjs` 會先在 `game-byte-content-unchanged`（1.13.0 發布專用：`game.js` 與 `56e72d9` 位元組相同）中止，因此在重構後的 HEAD 上，其 `initialize()` harness 不會執行，不提供重構覆蓋。2026-10-18 於 scratch 複本略過該檢查後，其餘檢查全數 PASS（僅作參考，不是正式入口結果）。
   - `tools/development-b/legacy-slot-source-check.mjs` 不修改：其「RNG 文字不變」斷言只適用於重構前的基準，重構後失敗屬預期（使用者 2026-10-18 決定）。
   - `docs/reviews/*` 歷史驗證工具不修改（AGENTS §6.4）；重構後無法對新 HEAD 執行，只能對各自基準 SHA 執行。
2. 新增 `tests/rng.test.mjs`：多組 seed（含空字串、日文、`fnv1a32` 結果為 0 的退回分支若可構造）各取前 N 個輸出與最終 `rngState`，比對以基準 SHA 現行 `seedInit`／`R` 產生、寫死於測試內的 golden 值（註明產生來源 SHA）。另驗證 `S` 重新指派後 `next()` 推進新物件。
3. `scripts/test-manifest.mjs` 自動收錄 `tests/*.test.mjs`（quick／full／audit），不需修改；`scripts/TESTING.md` 補一行並更新入口數。
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

- 變更檔：`docs/src/engine/rng.js`（新）、`docs/src/engine/game.js`、`tests/award-journal-native.test.mjs`、`tests/retirement-hof-test-support.mjs`、`tools/development-b/award-runtime-support.mjs`、`tools/development-b/legacy-effect-boundaries.mjs`、`tools/development-g9/verify-version-metadata.mjs`、`tests/rng.test.mjs`（新）、`scripts/TESTING.md`。
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

### 2.9 實施結果（2026-10-18，本機）

- 比較基準：`650e4dd21718b4abec3876fc9ef6148714c21d4f`（與作業 HEAD 前的 `046915c`／`bddfb0b` 程式碼相同）。許容差分：無。
- 執行環境：macOS、Node v24.14.0、Brave 153（以 scratch 轉接模組包裝 `@playwright/mcp` 內附的 Playwright 1.59.0-alpha，強制 `executablePath` 為 Brave；runner 紀錄的 `--browser=chrome` 實際為 Brave）。第二次 Full 另加 `--disable-features=BraveFarbling`。不是 CI 的 Linux Chromium，未執行 CI。
- 驗證結果：

| §2.5 | 結果 |
|---|---|
| 1 語法 | PASS（`node --check`；Full `syntax`；E2E Console Error／404 為零） |
| 2 `rng.test`／harness | PASS（`rng.test` 8/8；`award-journal-native` 20、`pitcher-award-integration` 29、`award-history-b-comparison` 30、`legacy-effect-boundaries` 778） |
| 3 舊 `R`／`seedInit` 不被呼叫 | VERIFIED（scratch 複本令舊定義 throw，`bug-act-01-02`、`draft-income`、`kbo-renewal`、`display-preferences`、`contract-salary` 5 個 E2E 全 PASS、無 throw 訊息；範圍限於這 5 個 E2E 的流程） |
| 5 基準比較 | PASS（`display-preferences-e2e` 投手／野手固定 seed 生涯完全一致、RNG 652／549；`draft-income-e2e` 18 案、RNG 19～23；`contract-salary-e2e` `--compare=650e4dd…`、RNG 652／677） |
| 6 Full | 第一次 79 PASS／2 FAIL／0 SKIP／0 BLOCKED（`test-results/2026-10-18T10-22-34-168Z-full/`）；修正下列 2 件後第二次 **81 PASS／0 FAIL／0 SKIP／0 BLOCKED**（`test-results/2026-10-18T11-03-04-406Z-full/`，HEAD `5b533a6` 加上未提交的連結修正） |

- 第一次的 2 件 FAIL 與重構無關：
  - `spec-source-links.test`：`046915c` 刪除原檔後，`CURRENT_SPEC.md` 仍連到 `RELEASE_1130_PRODUCTION_ACCEPTANCE.md`、`CURRENT_DOCUMENTATION.md`。已將 4 份入口文件（`CURRENT_SPEC.md`、`BACKLOG.md`、`docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md`、`tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md`）共 14 個失效連結改指向 `docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md`；`docs/reviews/`、`docs/archive/` 的歷史紀錄不改。
  - `replay-share-theme-e2e`：Brave 的 canvas farbling 每次載入頁面使約 950 像素差 1 個色階，未改 HEAD `bddfb0b` 同樣失敗。改以 `--disable-features=BraveFarbling` 啟動後 PASS；只改 scratch 轉接模組，不改 repo 與斷言。
- reviewer：僅 1 項 low（`verify-version-metadata.mjs` 的 harness 在 HEAD 上不可達），已記於 §2.4。
- 另修改 `scripts/ci-full-batches.test.mjs`：入口數 80→81（使用者 2026-10-18 批准），31 PASS、1 SKIP（Linux 限定案例）。
- 未確認：CI（Linux Chromium）、Preview、`dev` 併入。

## 2b. 第 1b 期：RNG 觀測 hook（細部計畫，2026-10-18，已批准本機實作）

### 2b.1 目標與範圍

- 目標：E2E 的 RNG 呼叫計數不再依賴 `R = function(){` 的原始碼文字；計數掛鉤失效時要報錯，而不是靜默為 0。
- 範圍內：`Rng` 的 `onDraw` 觀測點、`careerRng` 提升為模組層級、共用的計數掛鉤 helper、15 個 E2E 改用 helper。
- 範圍外：
  - 5 個 vm harness 與 `fixed-seed-v160` 仍依賴文字（vm harness 抽取 `seedInit`／`R` 單行；`fixed-seed-v160` 屬第 4 期）。
  - `docs/reviews/pitcher-tc-research/research.mjs` 等歷史工具不改（AGENTS §6.4）。
  - `ri`／`pick`／`chance`／`N0` 改為 `Rng` 方法與呼叫點遷移：另立一期。屆時須另處理 `line('const ri=')`、`/const chance=p=>/` 等抽取（`verify-version-metadata.mjs`、`legacy-slot-source-check.mjs` 及歷史工具）。
- 允許差分：無。同一 seed／選擇的 `S`、RNG 值、RNG 呼叫次數完全一致。

### 2b.2 現況（2026-10-18 唯讀確認）

- 15 個 E2E（§2.2 表列）以 `instrument` 函式替換 `'function R(){'` 與 `'R = function(){'`，注入 `window.<計數器>++`。計數器名稱多為 `__rngCalls`；另有 `__draftRngCalls`（`draft-income-e2e`）、`__calls`（`bug-act-01-02-e2e`）。`display-preferences-e2e` 同為 `__rngCalls`，但注入字串多一個空格，且以內嵌 `.replace` 寫在讀檔處而非 `instrument` 函式；實作時逐檔對照。
- 其中 11 個也把同一 `instrument` 套到基準 SHA 的原始碼上（各自的歷史基準，如 `650e4dd`、`dc5ac871`、`37121fb`）。舊原始碼沒有 `careerRng`，只能用文字替換。
- 多數 E2E 另把測試 hook 附加在 `game.js` 原始碼末尾（模組作用域，可讀 `S`、`_s` 等）。
- 實驗：`?seed=` 進入時，模組評估結束前 RNG 抽取 0 次、按開始前 0 次、開始後 20 次。故在原始碼末尾設定 observer 不會漏算。其他進入路徑：UNVERIFIED。

### 2b.3 設計

`docs/src/engine/rng.js`：

```js
constructor(getState, hash) { this.getState = getState; this.hash = hash; this.onDraw = null; }
next() { /* 演算式不變 */ const v = ...; if (this.onDraw) this.onDraw(v); return v; }
```

- `onDraw` 預設 `null`；正式遊戲不設定。`next()` 在算出值、更新 `S.rngState` 之後才通知，不改變運算順序。
- `seed()` 不通知（現行計數只算 `R`）。

`docs/src/engine/game.js`：

- 模組狀態區（`let S=null, stepQ=[];` 附近）新增 `let careerRng = null;`。
- IIFE 內 `const careerRng = new Rng(...)` 改為 `careerRng = new Rng(...)`。`seedInit`／`R` 兩行不變（保留字首與單行，vm harness 仍抽取它們）。

新增 `tests/support/rng-instrument.mjs`：

```js
export function instrumentRng(source, counter = '__rngCalls') {
  const inc = `window.${counter}=(window.${counter}||0)+1;`;
  if (/^let careerRng = null;$/m.test(source)) return source + `\ncareerRng.onDraw=()=>{${inc}};`;
  const out = source.replace('function R(){', 'function R(){' + inc).replace('R = function(){', 'R = function(){' + inc);
  if (out === source) throw Error('RNG_INSTRUMENT_MISS');
  return out;
}
```

- 新原始碼走 `onDraw`；沒有 `careerRng` 的舊基準原始碼走原本的文字替換。兩條路徑並存，直到所有比較基準都含 hook。
- 兩條路徑都對不上時丟 `RNG_INSTRUMENT_MISS`。這是新增的嚴格檢查，不是放寬斷言。
- 15 個 E2E 的 `instrument` 改為呼叫 `instrumentRng(source, <原計數器名稱>)`，其餘附加 hook 與斷言不變。

### 2b.4 驗證（L3 / R3）

1. `node --check`；`rng.test` 新增 `onDraw` 案例（每次 `next()` 恰好通知一次、值相同、`seed()` 不通知、未設定時與第 1 期 golden 相同）。
2. helper 單元測試：新原始碼走 `onDraw`、`650e4dd` 原始碼走文字替換、兩者皆不符時丟錯。
3. 15 個 E2E 的 RNG 計數與第 1 期結果相同：至少比對 `display-preferences-e2e`（652／549）、`contract-salary-e2e`（652／677）、`draft-income-e2e`（19～23）。
4. 基準比較：`--baseline=650e4dd…`，`S` 差分＝無、RNG 計數差分＝無。
5. Quick、Full（本機以 Brave＋`--disable-features=BraveFarbling`；結果註明不是 CI）。

### 2b.5 交付與待決

- 變更檔：`docs/src/engine/rng.js`、`docs/src/engine/game.js`、`tests/support/rng-instrument.mjs`（新）、15 個 E2E、`tests/rng.test.mjs`；若 helper 測試獨立成檔，`scripts/ci-full-batches.test.mjs` 入口數與 `scripts/TESTING.md` 須同步。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC。
- 使用者決定（2026-10-18）：
  1. 批准依本節實作。commit／push 另批。
  2. 作業分支沿用 `plan/game-js-oop-refactor`（第 1 期 PR 會一併包含第 1b 期）。
  3. helper 測試獨立成新檔 `tests/rng-instrument.test.mjs`；Full 入口數 81→82，`scripts/ci-full-batches.test.mjs` 與 `scripts/TESTING.md` 同步更新。

## 3. 後續各期概要（細節於各期開始前另立計畫）

### 3.1 第 1b 期：RNG 觀測 hook

- 細部計畫見 §2b。以下為原概要。
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

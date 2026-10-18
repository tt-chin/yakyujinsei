# 野球人生｜game.js 物件導向化分期計畫書

**文件狀態：IMPLEMENTATION_PLAN / PHASE2_DETAILED_PLAN_PENDING（2026-10-18）**
**建立日期：2026-10-18**
**對應 BACKLOG：`REFACTOR-AUDIT-01`（本計畫不使其結案）**

> 本文件是工程計畫，不是實作、commit、push、merge 或部署授權。每一期須另行取得使用者明確批准後才可修改程式。第五階段路線「不將所有legacy函式一次搬入類別」仍有效：本計畫逐期、逐組進行，不一次搬移。

## 0. 總體方向

| 期 | Class | 範圍摘要 | 風險 | 狀態 |
|---|---|---|---|---|
| 1 | `Rng` | 封裝生涯 RNG 的種子與步進演算法；`S.rngState` 仍為唯一狀態 | L3 / R3 | 完成；PR #5 併入 `dev`（`36fc242`），見 §2.9、§2.10 |
| 1b | `Rng` 觀測 hook | 測試改用正式 hook 計數，脫離原始碼字串替換 | L3 / R3（含 `game.js` RNG 路徑） | 完成；同 PR #5，見 §2b.6 |
| 1c | `Rng` 方法化 | `ri`／`pick`／`chance`／`N0`／`pickRecord` 改由 `Rng` 提供 | L3 / R3 | 暫緩（方案 A，2026-10-18 使用者決定）；細部計畫見 §2c |
| 2 | `GameView` | `card`／`divider`／`board`／`choose` 等純 DOM 操作移出；`allocUI` 暫緩 | L3 / R3 | 細部計畫見 §2d；待批准 |
| 3 | `CareerSession` | 收容 `S` 外狀態（`stepQ`、`choiceGeneration` 等）與年度流程函式 | L3 | 概要 |
| 4 | LEGACY 覆寫逐組處理 | 32 組覆寫逐組決定合併或 `super` | L3 | 概要 |

共通原則：

- `S` 保持純資料物件，不改為 class（AGENTS §5、CURRENT_SPEC §2；固定 seed 測試直接比對 `S`）。
- `*-policy.js` 純函式維持現狀，不改為 class。
- 不引入 npm、建置工具或框架；維持 ES modules 靜態配信。
- 不改遊戲行為：同一 seed／選擇 → `S`、RNG 消耗次數、畫面結果完全一致。允許差分：**無**。
- 內部重構不升 VERSION（§9.3）；不更新 CHANGELOG、CURRENT_SPEC。

## 1. 前置條件

1. **D2／main 狀態**（2026-10-18 更新）：`main`、`origin/main` 為 `650e4dd21718b4abec3876fc9ef6148714c21d4f`，1.13.0 已自此 SHA 正式發布。BACKLOG `D2-G9-RELEASE` 已於 2026-10-18 以發布範圍結案（`CLOSED_WITH_SPLIT_RESIDUALS`），Linux Full 殘項改由 `CI-LINUX-FULL-01` 追蹤（`LOCAL_LINUX_PASS / CI_NOT_RUN`）。
2. **作業分支為 `plan/game-js-oop-refactor`**：已 fast-forward 至 `origin/dev`（`c9c94cdc16fbc9fa6770f7826f430552b37d1dc6`，PR #6 merge commit）。各期完成後以 PR 併入 `dev`（同 PR #4～#6 方式，符合 AGENTS §10.1），不修改 `main`。
3. **比較基準**：第 1／1b 期為 `650e4dd21718b4abec3876fc9ef6148714c21d4f`；第 2 期為 `c9c94cdc16fbc9fa6770f7826f430552b37d1dc6`（含第 1／1b 期，程式碼與 `f87ceee` 相同）。若使用者另行指定，以指定的完整 SHA 為準。

### 1.1 與其他 BACKLOG 未完成項目的排序限制（2026-10-18 依 BACKLOG 記述判斷，未逐項讀碼）

1. **D2-G9-RELEASE 殘項**：1.13.0 已發布，`main` 合併時夾帶重構的風險已不存在。D2-G9-RELEASE 已結案（2026-10-18），殘項由 `CI-LINUX-FULL-01` 追蹤；若需重新驗證 1.13.0，須明確指定受驗 SHA `650e4dd`，不得以 `dev` HEAD 代替。
2. **規則變更不得與重構同一 change-set**：重構的證明前提是「差分＝無」，混入規則差分即失效。`OVR-01`、`TRAIT-SMALLSCHOOL-SEMANTICS-01`、`TRAIT-NITENICHI`、`TRAIT-CHAMPIONMAKER`、`CONTRACT-ASIA-01`、HOF 決策五項（`HOF-BUCKET-DECISION-01`、`HOF-PITCHER-BALANCE-01`、`HOF-HONOR-POLICY-01`、`HOF-DISPLAY-ROUND-01`、`HOF-VOTE-STORY-01`）只能在期與期之間各自獨立進行，並使用各自的 baseline 與許容差分。`TRAIT-CHAMPIONMAKER` 涉及 RNG 政策，若在第 1 期之後實作，應經由 `Rng`。
3. **第 1 期與 HOF 研究不同時進行**：第 1 期修改 `tests/retirement-hof-test-support.mjs`，該檔同時是 `HOF-NATURAL-SAMPLE-01` 研究工具的函式抽取支援。
4. **第 2 期（`GameView`）避開 UI 類項目**：`COPY-01`、P2 功能候補七項（`INJ-UI-01`、`PLY-01`、`INT-01`、`EVT-01`、`UI-06`、`UI-07`、`PLY-02`）須排在第 2 期之前或之後，不得並行。`EVT-01` 另受「不得改變抽選候選及順序」限制。實機三項（`EVT-1102-ANDROID`、`UI-17-DEVICE`、`SHARE-111-DEVICE`）若在第 2 期前完成，第 2 期後須重新驗收。
   - 2026-10-18 狀態確認（BACKLOG 於 `c9c94cd`）：`COPY-01` 為 `IMPLEMENTED_UNVERIFIED`；P2 七項皆未開始、未批准（`INT-01` 僅 1.11.8 的前置結果卡已完成）；實機三項皆 `BLOCKED`。`650e4dd` 之後與 UI 相關的變更只有測試時序修正 `01d1c38`（`display-preferences-e2e`）。結論：目前無並行衝突；第 2 期期間上列項目凍結，實機三項未在第 2 期前完成，屆時以重構後程式驗收即可。
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
- 未確認：GitHub Actions 的 CI（Linux Chromium）。`dev` 併入、Preview 與本機 Linux 結果見 §2.10。

### 2.10 併入 `dev` 與 Linux 驗證（2026-10-18，第 1／1b 期共通）

- 併入：PR #5 → `dev`（merge commit `36fc242`，內容同 `5e7a6f1`）。`main` 不變（`650e4dd`）。
- Preview：`https://dev.yakyujinsei.pages.dev` 的 `rng.js`／`game.js`／`config.js` 與 `36fc242` 逐字一致；`node tests/replay-share-theme-e2e.mjs --ui-only --preview=https://dev.yakyujinsei.pages.dev` PASS（57 個資源檔與 checkout 一致，1280／320／390px，Console／404 為 0）。只驗這一支；非實機。
- `dev` push 的 Quick CI：repo 為 private，本機無 `gh`，未確認。
- 本機 Docker Linux Full（`mcr.microsoft.com/playwright:v1.49.1-noble`：Ubuntu 24.04.1、Node 22.12.0、Playwright 1.49.1／Chromium 131；`playwright@1.49.1` 由已核對 integrity 的 tarball 以 `--ignore-scripts` 安裝，不下載瀏覽器）：

| SHA | Full | 備註 |
|---|---|---|
| `650e4dd` | 80 PASS／0 FAIL／0 SKIP／0 BLOCKED | 使用者接受為 D2 發布殘項的替代證據（BACKLOG `CI-LINUX-FULL-01`） |
| `5e7a6f1` | 81 PASS／1 FAIL／0 SKIP／0 BLOCKED | FAIL 為 `display-preferences-e2e` 按 Enter 後立即讀 DOM 的時序競爭；單獨重跑 5 次（含 `650e4dd` 2 次）全 PASS；`01d1c38` 改為等待內容變化再斷言（斷言不變），修正後 macOS 1 次、Linux 2 次 PASS |

- RNG 計數：Linux 上 `650e4dd` 對 `5e7a6f1`、以及 `5e7a6f1` 的 macOS 對 Linux，各 656 個 artifact、102,296 個計數值，差異皆 0。
- 證據保存於本機未追蹤的 `test-results/linux-docker-2026-10-18/`（約 12GB，含 `README.txt`）。Node／Playwright 版本與 CI 不同，不等於 CI 的 Linux Full。

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

- 變更檔：`docs/src/engine/rng.js`、`docs/src/engine/game.js`、`tests/support/rng-instrument.mjs`（新）、15 個 E2E、`tests/rng.test.mjs`；若 helper 測試獨立成檔，`scripts/ci-full-batches.test.mjs` 入口數與 `scripts/TESTING.md` 須同步。實作時另需在 `scripts/test-manifest.mjs` 的 `nonTests` 登記 `support/rng-instrument.mjs`（否則 inventory 報 Unclassified）。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC。
- 使用者決定（2026-10-18）：
  1. 批准依本節實作。commit／push 另批。
  2. 作業分支沿用 `plan/game-js-oop-refactor`（第 1 期 PR 會一併包含第 1b 期）。
  3. helper 測試獨立成新檔 `tests/rng-instrument.test.mjs`；Full 入口數 81→82，`scripts/ci-full-batches.test.mjs` 與 `scripts/TESTING.md` 同步更新。

### 2b.6 實施結果（2026-10-18，本機）

- 比較基準：`650e4dd21718b4abec3876fc9ef6148714c21d4f`；允許差分：無。環境同 §2.9（Brave 153＋`--disable-features=BraveFarbling`，非 CI）。
- 變更檔：`docs/src/engine/rng.js`、`docs/src/engine/game.js`、`tests/support/rng-instrument.mjs`（新）、`tests/rng-instrument.test.mjs`（新）、`tests/rng.test.mjs`、15 個 E2E、`scripts/test-manifest.mjs`、`scripts/ci-full-batches.test.mjs`（81→82）、`scripts/TESTING.md`。

| §2b.4 | 結果 |
|---|---|
| 1 語法／`rng.test` | PASS（19 個 JS／mjs `node --check`；`rng.test` 9/9，含 `onDraw` 案例） |
| 2 helper 測試 | PASS（`rng-instrument.test` 3/3：現行原始碼走 `onDraw`、`650e4dd` 走文字替換、皆不符時丟 `RNG_INSTRUMENT_MISS`） |
| 3 RNG 計數與第 1 期相同 | PASS：`display-preferences-e2e` 652／549、`contract-salary-e2e` 652／677；另把第 1 期 Full（`test-results/2026-10-18T11-03-04-406Z-full/`）與本期 Full 的 artifact 逐檔比對，11 個套件、656 個檔案、102,296 個計數值，差異 0 |
| 4 基準比較 | PASS（`display-preferences-e2e` 投手／野手固定 seed 生涯與 `650e4dd` 完全一致） |
| 5 Full | **82 PASS／0 FAIL／0 SKIP／0 BLOCKED**（`test-results/2026-10-18T11-48-20-618Z-full/`） |

- reviewer：無須修正的問題。備註 2 項：helper 在 CRLF 的 `game.js` 末尾附加 LF 行（只影響記憶體中提供給瀏覽器的副本）；舊路徑也替換檔頭 `function R(){`（現行原始碼不會呼叫，舊基準與原寫法逐字相同）。reviewer 另確認所有 RNG 入口都在按下開始之後，故 §2b.2 中「其他進入路徑 UNVERIFIED」已由靜態檢查補足；9 個歷史基準 SHA 皆走文字替換路徑。
- 未確認：GitHub Actions 的 CI（Linux Chromium）。`dev` 併入、Preview 與本機 Linux 結果見 §2.10。

## 2c. 第 1c 期：`Rng` 方法化（細部計畫，2026-10-18，暫緩）

### 2c.1 目標

把 `ri`／`pick`／`chance`／`N0`／`pickRecord` 改為 `Rng` 的方法（例：`int(a,b)`、`pick(a)`、`chance(p)`、`normal(sd)`），讓 RNG 的使用方式也集中到 `Rng`。允許差分：無（每個方法消耗 `next()` 的次數與順序必須和現行函式相同，例如 `N0` 為 4 次）。

### 2c.2 現況（2026-10-18 唯讀確認）

- 定義：`ri`／`pick`／`chance`／`N0` 在檔頭（`game.js:55–63`，模組層級 `const`，實際使用中，未被覆寫）；`pickRecord` 在 IIFE 內（`game.js:2831`）。全部經由 `R` 抽取。
- 呼叫點：`ri` 74、`chance` 43、`pick` 23、`pickRecord` 11、`N0` 8，`R()` 直呼 36。另有 3 處把 `R` 當成值傳給 policy（`generateBidJitters(...,R)`、兩處 `random:R`）。
- **行為耦合（主要風險）**：測試把 `R` 當作唯一入口，以重新指派 `R` 來控制或觀察抽取：

| 用途 | 檔案 | 作法 |
|---|---|---|
| 強制回傳值 | `championship-intl-e2e`、`global-contract-market-e2e`、`smallschool-c-e2e` | 在瀏覽器內暫時把 `R` 換成固定值（仍呼叫原 `R` 以保持消耗） |
| 強制回傳值 | `school-policy.test`、`event-copy.test` | vm 內以假 `R` 取代 |
| 逐次追蹤 before／after／value | `support/stage6-browser`（被 `stage6-ability`、`stage6-state-transaction`、`stage7-safety`、`stage10-risk`、`smallschool-c`、`trait-display`、`full-power-pitching`、`international-personal-stats` 8 個 E2E 使用） | 包裝 `R` 記錄每次抽取 |
| 逐次追蹤 | `award-journal-native`、`retirement-hof-test-support`、`tools/development-b/award-runtime-support`、`legacy-effect-boundaries`、`tools/development-g9/verify-version-metadata` | vm 內包裝 `R` |
| 讀取 `_s` | 多個 E2E hook（例：`replay-share-theme-e2e` 的 `rng:_s`）、`retirement-hof-test-support` 的 snapshot | `_s` 只在 `R` 內同步 |

- **文字耦合**：`fixed-seed-v160.test` 斷言檔頭 `const ri=…R()…`、`const chance=p=>R()*100<p` 的文字；`verify-version-metadata` 抽取 `const ri=`、`function pickRecord(` 單行；`legacy-slot-source-check` 比對 `const chance=p=>` 行；`school-policy.test`、`npb-return-ui.test` 自行提供 `pickRecord`。

結論：方法若繞過 `R` 直接呼叫 `careerRng.next()`，上表所有強制、追蹤與 `_s` 讀取都會靜默失效或改變結果。第 1b 期的 `onDraw` 只解決了 E2E 的「計數」，沒有解決「強制」與「before 狀態追蹤」。

### 2c.3 方案

**方案 A：暫緩第 1c 期（建議）**

- 保留 `ri` 等函式與 `R` 作為唯一入口。第 1 期已把演算法與狀態存取集中到 `Rng`，第 1b 期已移除 E2E 計數的文字依賴；第 2、3 期不需要第 1c 期即可進行。
- 檔頭舊定義與 `_s` 依原計畫在第 4 期以可達性證據一併處理，屆時再評估是否方法化。
- 成本：0。缺點：呼叫端仍是自由函式，物件導向的收益停在第 1 期。

**方案 B：分三段進行**

1. **B1 測試基建**（L2，先行）
   - `Rng` 新增 `onDraw({before,after,value})`（取代目前只傳 value 的形式）與暫時覆寫抽取值的機制（例：`withOverride(fn, body)`），並把 `_s` 同步移入 `Rng` 的通知中，使任何經由 `next()` 的抽取都同步 `_s`。
   - 把上表 4 個強制、`stage6-browser`、5 個 vm 追蹤、`_s` 讀取改用 `Rng` 的機制。基準 SHA 的舊原始碼仍需舊方式，沿用 `instrumentRng` 的雙路徑做法。
   - 完成條件：Full PASS，且 stage6 系列的逐次 trace、強制案例結果與第 1b 期完全一致。
2. **B2 定義委派**（L3／R3）
   - `Rng` 新增 `int`／`pick`／`chance`／`normal`，`ri` 等函式本體改為呼叫這些方法；呼叫點 159 處不改。`R` 改為 `careerRng.next()` 的別名，3 處以值傳入 policy 的 `R` 保持相同語意。
   - 需更新 `fixed-seed-v160.test` 的檔頭文字斷言（屬於期望值變更，須使用者另行批准）與 `verify-version-metadata` 的抽取。
3. **B3 呼叫點改名**（可選，不建議）
   - 159 處 `ri(` → `careerRng.int(` 等。只改寫法、不改行為，但 diff 大、與 BACKLOG 規則類項目衝突機率高，且 vm harness 抽取的正式函式文字會大量改變。

**方案 C：只做 B2，不做 B1**：不可行。會使上表的強制與追蹤失效（§2c.2 結論）。

### 2c.4 驗證（採方案 B 時）

- B1：Quick、Full；stage6 系列逐次 trace 與第 1b 期 artifact 逐筆比對；強制案例的 `S` 與基準一致。
- B2：`rng.test` 新增各方法與舊函式的逐值比對（含 `N0` 消耗 4 次）；`--baseline=650e4dd…` 的 `S`／RNG 計數差分＝無；Full。
- 每段完成後交 reviewer 審查，commit／push 另批。

### 2c.5 使用者決定（2026-10-18）

- 採方案 A：暫緩第 1c 期，`ri` 等函式與 `R` 維持現狀。日後若重新評估，從方案 B 的 B1 開始，並另行批准。

## 2d. 第 2 期：`GameView`（細部計畫，2026-10-18，待批准）

### 2d.1 目標與範圍

- 目標：把 `game.js` 中純 DOM 的畫面函式本體移入 `docs/src/ui/game-view.js` 的 `GameView` class；`game.js` 保留同名的薄包裝函式（同第 1 期 `R = function(){ careerRng.next() … }` 的做法）。
- 範圍內，分三個子期，前一子期驗證通過後才進下一個：
  - **2d-A**：log／act 基本函式 `scrollBottom`、`archiveTraitResults`、`card`、`divider`、`actClear`、`actToggleSync`。
  - **2d-B**：`board`（原定義與 IIFE 覆寫）。
  - **2d-C**：`choose` 的按鈕 DOM 建立。
- 範圍外：
  - `allocUI`：暫緩（2026-10-18 使用者決定，同 §2c 方式）。加點／復原／重設 handler 直接改 `S.ab`／`S.carry`，確定 → `allocDone` 抽 `R()`（`game.js:1143`），屬互動控制器而非畫面；另有 5 處文字耦合（§2d.2）。日後重新評估時另立子期與批准。
  - STAGE5 路線 R3（`build*ViewModel`，`game.js:621–626`）：另立項目（2026-10-18 使用者決定）。
  - `endGame` 本體與覆寫、`retireScene`、`shareImage`、`renderCheckpointCard`、`bindLatestSalaryDetailLink`、`runWithResultView`、模組層級的事件綁定（`game.js:2098–2101`、`2764–2775`、`3329–3336`）。
  - `choiceGeneration`／`activeChoiceToken`／`choiceViews` 與 `_curYearBody`／`MAX_YEARS`：留在 `game.js`（前者屬第 3 期；後者見 §2d.3）。
  - LEGACY `board` 覆寫的合併：第 4 期。
- 允許差分：**無**。同一 seed／選擇的 `S`、RNG 值與呼叫次數、`#log`／`#act`／`#board` 的 DOM 完全一致。

### 2d.2 現況（2026-10-18 唯讀確認，基準 `c9c94cd`）

| 函式（`game.js` 行號） | 性質 | 測試的文字耦合 |
|---|---|---|
| `scrollBottom:59`、`archiveTraitResults:634`、`actClear:695`、`actToggleSync:697` | 純 DOM；不讀寫 `S`、不抽 RNG | 無 |
| `logTarget:631`、`divider:670` | 純 DOM；`divider` 寫入模組變數 `_curYearBody`（`629`），超過 `MAX_YEARS`（`630`）時刪除最舊年度 | E2E hook 直接寫 `_curYearBody=null`（`trait-display-e2e:16`、`international-personal-stats-e2e:13`、`smallschool-c-e2e:12`） |
| `card:665` | 先呼叫 `traitResultMarkup:640`（讀 `S`、`TRAIT_LABELS`、`displayTrait` 與文案，寫入節點 `dataset`），append 後寫入 `traitPresentation`（`633`，以 `S` 為 key 的 WeakMap） | `bug-act-01-02-e2e:18` 替換 `function card(cls,title,html){` 一行 |
| `board:671` 與 IIFE 覆寫 `2983` | 讀 `S`，不寫入、不抽 RNG；覆寫先呼叫 `LEGACY.board(phase)`，再改寫 `#bd-name` 文字節點與 `#bd-sal` | 無 |
| `choose:725` | 擁有 `choiceGeneration`／`activeChoiceToken`／`choiceViews`；按鈕 onclick 經 `runWithResultView` → `runChoiceAction` → `invokeAnnualChoice` 執行遊戲邏輯 | `ui-foundation.test.mjs:36`（onclick 本文） |
| `allocUI:739`（範圍外） | 見 §2d.1 | `ui-foundation:37–38`、`choice-action.test:112`、`ability-allocation.test:5`、`fixed-seed-v160.test:22` |
| `runWithResultView:724`（範圍外） | 包住 action 執行，前後讀 `.card` 數決定捲動 | `ui-foundation:39` |

- 以上基本函式本身不抽 RNG、不改 `S`；RNG 與 `S` 的變更發生在呼叫端（例：`retireScene` `2245–2254`、`endGame` `2296`、`2399`）。
- 名稱必須維持為 `game.js` 模組層級、可重新指派的同名函式：
  - 呼叫點（語法計數，含定義行）：`card(` 167、`board(` 68、`choose(` 63。
  - E2E 直接重新指派：`card`（`tests/support/stage6-browser.mjs:26`）、`allocUI`（`trait-system-e2e:15`）。
  - `const LEGACY = { board, …, endGame }`（`2799`）按值捕獲。
  - 約 9 支 vm 單元測試以 context 函式 stub `card`／`board`／`choose`／`allocUI`，不提供 `document`。
- `view` 已是 `game.js:710`、`727`（`choose` 內）的區域變數名，實例改名為 `gameView`。
- 現有 `docs/src/ui/` 模組為 factory function 與純 renderer，沒有 class；本期採 class，與第 1 期 `Rng` 一致（2026-10-18 使用者決定）。

### 2d.3 設計

`docs/src/ui/game-view.js`（新）：

```js
export class GameView {
  constructor({ byId, logTarget, decorateCard, onTraitShown }) { … }
  scrollBottom() { … }
  archiveTraitResults() { … }
  card(cls, title, html) { … }      // 2d-A：decorateCard → innerHTML → append 至 logTarget() → onTraitShown → scrollBottom
  divider(t, maxYears) { … return body; } // 2d-A：回傳新的年度容器
  actClear() { … }
  actToggleSync() { … }
  renderBoard(model) { … }          // 2d-B
  patchBoard(model) { … }           // 2d-B：覆寫 2983 的追加寫入
  renderChoices(title, items) { … } // 2d-C
}
```

- 不 import `game.js` 的任何狀態，不讀 `S`、不呼叫 RNG。與 `S` 有關的判斷以建構參數注入：`decorateCard` = `traitResultMarkup`，`onTraitShown` = `key=>traitPresentation.get(S).add(key)`。
- 建構子不碰 DOM，因此在 vm、無 `document` 的環境也能建立。
- 方法本體逐字搬移原函式的 DOM 操作，順序不變。

`docs/src/engine/game.js`：

- `$`（`628`）之後新增 `const gameView = new GameView({ byId:$, logTarget, decorateCard:traitResultMarkup, onTraitShown:… })`。檢查點：建立前沒有任何 DOM 基本函式被呼叫（靜態確認 `game.js` 的模組層級呼叫皆在 `628` 之後）。
- `_curYearBody`、`MAX_YEARS`、`logTarget` 留在 `game.js`，因 3 支 E2E hook 直接寫 `_curYearBody`。`divider` 包裝為 `function divider(t){ _curYearBody=gameView.divider(t,MAX_YEARS); }`（現行 `divider` 只寫入 `_curYearBody`、不讀取，2026-10-18 grep 確認）。
- 2d-A 包裝：`function card(cls,title,html){ gameView.card(cls,title,html); }` 等。`card` 首行逐字保留，維持 `bug-act-01-02-e2e:18` 的文字替換與計數。
- 2d-B：`board(phase)` 改為 `gameView.renderBoard(boardModel(phase))`；`boardModel` 純讀 `S`，回傳原本寫入的最終字串（innerHTML／textContent 原值）與 `lp0`～`lp2` 的 toggle 值。覆寫 `2983` 保持兩層：`LEGACY.board(phase)` 之後改呼叫 `gameView.patchBoard(…)`。檢查點：`boardModel` 讀取的 getter（salary、orgTeam、`ct` normalize 等）沒有副作用（STAGE5 R3 的同類警告），以前後 `S` 的 deepEqual 確認。
- 2d-C：`choose` 保留 generation／token／`choiceViews` 與每個選項的 onclick closure 構造，DOM 建立改由 `gameView.renderChoices(title, items)`（`items` 為 `{className, html, onClick}`）。`runChoiceAction` 的介面（`currentMarkup`、`clear`、`restore` 等）不變。

### 2d.4 測試變更（harness 變更，非期望值變更，需揭露）

- 2d-A／2d-B：預計不修改既有測試。實作時逐檔確認：
  - 是否有 vm 切片會執行到包裝函式本體；若有，比照 `d9e90ce` 提供 `gameView` 前導。
  - `card` 首行與 `_curYearBody` 的既有 hook 是否照常運作。
  - 已確認（2026-10-18）：`scripts/check-syntax.mjs` 以 `readdirSync` 自動涵蓋新檔；`verify-modularization`、`information-architecture` 只斷言特定 import／字串存在，新增 `import { GameView }` 不會使其失敗。
- 2d-C：`ui-foundation.test.mjs:36` 的 regex 隨 onclick 指派位置改變而修改；斷言意圖（view-state 守衛 → `runWithResultView` → `runChoiceAction`）不變。
- 新增 DOM 快照比對（2026-10-18 使用者批准新增於 `tests/support/`）：
  - `tests/support/dom-snapshot.mjs`：序列化 `#log`、`#act`、`#board` 的 outerHTML（含 `data-*`、`aria-*`、`disabled`）。擷取前等待 rAF（`scrollBottom`）與 `setTimeout`（`endGame` 覆寫的文字替換）結束。
  - 驅動入口 `tests/game-view-dom-e2e.mjs`：沿用 `contract-salary-e2e` 的 `/baseline` 服務方式，同一頁面伺服器同時提供基準 SHA 與 HEAD。投手、野手各 2 個固定 seed，採既有 first-row／balanced 選擇策略。每一步記錄 DOM 快照、`S`（排除 `version`）與 `Rng.onDraw` 計數，逐步比對；任一差異即 FAIL，並輸出第一個差異步驟。視窗寬 1280 與 390 各一次。
  - `scripts/test-manifest.mjs` 的 `nonTests` 登記 `support/dom-snapshot.mjs`。

### 2d.5 驗證（L3 / R3）

每個子期：

1. `node scripts/check-syntax.mjs`。
2. 相關單元：`ui-foundation`、`choice-action`、`ability-allocation`、`fixed-seed-v160`、`trait-policy`、`kbo-renewal-floor`、`championship-intl`、`full-power-pitching`、`award-journal-native`、`npb-return-ui`、`event-integration`。
3. `game-view-dom-e2e`：對 `c9c94cd` 的 DOM／`S`／RNG 計數差分＝無。
4. 既有 UI E2E：`display-preferences-e2e`、`stage6-ability-e2e`、`stage10-risk-e2e`、`trait-display-e2e`、`event-system-e2e`、`contract-salary-e2e`、`event-fix-e2e`、`bug-act-01-02-e2e`。
5. Quick。

三個子期完成後：

6. Full（本機 Brave＋`--disable-features=BraveFarbling`；可另跑本機 Docker Linux）。`CI-LINUX-FULL-01`／`D2-CI-ARTIFACT-01` 未結案期間，L3 證據以本機為主，不以 CI artifact 宣稱完整證據（§1.1-7）。
7. PC（1280）／手機（390）目視：開始畫面、年度 log 摺疊、選項、board、退休畫面。Console／404 為 0。
8. 記錄 `game.js` 行號變動（§1.1-5），不改寫歷史報告。
9. reviewer。

### 2d.6 交付與待決

- 變更檔：
  - 新增：`docs/src/ui/game-view.js`、`tests/support/dom-snapshot.mjs`、`tests/game-view-dom-e2e.mjs`。
  - 修改：`docs/src/engine/game.js`、`tests/ui-foundation.test.mjs`（2d-C）、`scripts/test-manifest.mjs`。
  - 新入口列入 Full：另需同步 `scripts/ci-full-batches.test.mjs`（入口數 82→83）與 `scripts/TESTING.md`。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC。以 PR 併入 `dev`，不修改 `main`。
- 使用者決定（2026-10-18）：
  1. `allocUI` 暫緩，不併入第 2 期。
  2. STAGE5 R3 從第 2 期拆出，另立項目。
  3. 採 class，名稱 `GameView`。
  4. 批准在 `tests/support/` 新增 DOM 快照比對。
  5. `game-view-dom-e2e` 列為 Full 入口（82→83），作為第 3、4 期的回歸防護；同步 `scripts/ci-full-batches.test.mjs` 與 `scripts/TESTING.md`。
  6. 三個子期合為一個 PR，各子期各自 commit；Full 於三個子期完成後執行一次（AGENTS §6.2）。
- 待決：是否批准依本節實作（commit／push 另批）。

## 3. 後續各期概要（細節於各期開始前另立計畫）

### 3.1 第 1b 期：RNG 觀測 hook

- 細部計畫見 §2b。以下為原概要。
- `Rng` 提供正式觀測點（例：建構參數 `onDraw`），測試改由 hook 計數。
- 18 個文字耦合測試脫離原始碼替換；baseline 舊 SHA 仍需舊替換方式，兩者並存至基準 SHA 包含 hook 為止。
- 完成後才可把 `ri`／`pick`／`chance`／`N0` 改為 `Rng` 方法並遷移呼叫點。

### 3.2 第 2 期：`GameView`

- 細部計畫見 §2d。以下為原概要。
- DOM 操作移入 `GameView`；核心傳遞 view model 與 callback。~~同時完成 STAGE5 路線 R3（view model 抽出）。~~ 更正（2026-10-18）：R3 的對象是 `build*ViewModel`（`game.js:621–626`）抽出為純讀模組，與 `board`／`card`／`choose` 無關；依使用者決定另立項目，不併入第 2 期。
- 前置：確認 `onclick` 內的遊戲邏輯（如 `allocUI` → `allocDone`）的呼叫順序與 RNG 消耗不變。`allocUI` 已決定暫緩（§2d.1）。

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

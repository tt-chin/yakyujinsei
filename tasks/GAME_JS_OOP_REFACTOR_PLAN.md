# 野球人生｜game.js 物件導向化分期計畫書

**文件狀態：IMPLEMENTATION_PLAN / PHASE4A_LOCAL_DONE / PHASE5_LOCAL_DONE（2026-10-23）**
**建立日期：2026-10-18**
**對應 BACKLOG：`REFACTOR-AUDIT-01`（本計畫不使其結案）**

> 本文件是工程計畫，不是實作、commit、push、merge 或部署授權。每一期須另行取得使用者明確批准後才可修改程式。第五階段路線「不將所有legacy函式一次搬入類別」仍有效：本計畫逐期、逐組進行，不一次搬移。

## 0. 總體方向

| 期 | Class | 範圍摘要 | 風險 | 狀態 |
|---|---|---|---|---|
| 1 | `Rng` | 封裝生涯 RNG 的種子與步進演算法；`S.rngState` 仍為唯一狀態 | L3 / R3 | 完成；PR #5 併入 `dev`（`36fc242`），見 §2.9、§2.10 |
| 1b | `Rng` 觀測 hook | 測試改用正式 hook 計數，脫離原始碼字串替換 | L3 / R3（含 `game.js` RNG 路徑） | 完成；同 PR #5，見 §2b.6 |
| 1c | `Rng` 方法化 | `ri`／`pick`／`chance`／`N0`／`pickRecord` 改由 `Rng` 提供 | L3 / R3 | 暫緩（方案 A，2026-10-18 使用者決定）；細部計畫見 §2c |
| 2 | `GameView` | `card`／`divider`／`board`／`choose` 等純 DOM 操作移出；`allocUI` 暫緩 | L3 / R3 | 完成；PR #8 併入 `dev`（`26efa59`），合併 `1bc65df` 的衝突與重新驗證見 §2d.11；T14 測試修正為 PR #9；GitHub Actions CI 未確認 |
| 3 | `CareerSession` | 收容 `S` 外的流程／選項控制狀態（3-A）與 JP 覆寫 IIFE 內的 context 變數（3-B）；不含 `S`、`careerRng`、年度流程函式 | L3 / R3 | 本機完成（§2e.7，`refactor/career-session` `db5c39b`）；已 push，PR #10 → `dev` 待合併（§2e.8）；GitHub Actions CI 未確認 |
| 4 | LEGACY 覆寫（4-A） | 覆寫綁定實為 33 個（STAGE5 稽核記為 32，未含 `recordIndependentSalaryEvaluation`）。4-A：刪除 19 個完全取代的死本體與舊路徑，拆除 JP 覆寫 IIFE 外殼，19 個覆寫就地改為函式宣告；4-B 暫緩、4-C／4-D 不做 | L3 / R3 | 本機完成（§2f.7，`refactor/legacy-overrides` `34c9c7b`）；未 push，PR → `dev` 待批准；GitHub Actions CI 未確認 |
| 5 | `CareerPresenter` | `build*ViewModel`（`game.js:582–588`）移入 `docs/src/ui/career-presenter.js` 的類別，依賴以建構子注入；`game.js` 保留 5 個一行委派 | L2 / R2（PR 前 Full 一次） | 本機完成（§2g.8），未 commit |

共通原則：

- `S` 保持純資料物件，不改為 class（AGENTS §5、CURRENT_SPEC §2；固定 seed 測試直接比對 `S`）。
- `*-policy.js` 純函式維持現狀，不改為 class。
- 不引入 npm、建置工具或框架；維持 ES modules 靜態配信。
- 不改遊戲行為：同一 seed／選擇 → `S`、RNG 消耗次數、畫面結果完全一致。允許差分：**無**。
- 內部重構不升 VERSION（§9.3）；不更新 CHANGELOG、CURRENT_SPEC。

## 1. 前置條件

1. **D2／main 狀態**（2026-10-18 更新）：`main`、`origin/main` 為 `650e4dd21718b4abec3876fc9ef6148714c21d4f`，1.13.0 已自此 SHA 正式發布。BACKLOG `D2-G9-RELEASE` 已於 2026-10-18 以發布範圍結案（`CLOSED_WITH_SPLIT_RESIDUALS`），Linux Full 殘項改由 `CI-LINUX-FULL-01` 追蹤（`LOCAL_LINUX_PASS / CI_NOT_RUN`）。2026-10-19 GitHub Actions Run39260159042 對 `2a11a64` 的 Linux Full 82 PASS／0 FAIL／0 SKIP／0 BLOCKED；`CI-LINUX-FULL-01` 改為 `CI_PASS / LEGACY_TOOL_PATHS_PENDING`，因舊工具固定路徑殘項保持未完成。
2. **作業分支為 `plan/game-js-oop-refactor`**：已 fast-forward 至 `origin/dev`（`c9c94cdc16fbc9fa6770f7826f430552b37d1dc6`，PR #6 merge commit）。各期完成後以 PR 併入 `dev`（同 PR #4～#6 方式，符合 AGENTS §10.1），不修改 `main`。
3. **比較基準**：第 1／1b 期為 `650e4dd21718b4abec3876fc9ef6148714c21d4f`；第 2 期為 `2a11a6444c643002d1c3143fd7827b94ce4ce2eb`（PR #7 merge commit；2026-10-19 使用者指定，取代原定 `c9c94cd`。遊戲程式碼與 `c9c94cd` 相同，另含 `983c069`／`c423d4a` 的測試修正）。2026-10-21 起 `game-view-dom-e2e` 的預設基準改為 `1bc65dfc2b8ba226930b23dca85a03e678e91253`（`origin/dev`，使用者批准）：PR #8 合併 `dev` 後，`dev` 新增的 board 選單使 `#board` 與 `2a11a64` 自第 0 步不同；`1bc65df` 的 `game.js` 與 `2a11a64` 相同。見 §2d.11。若使用者另行指定，以指定的完整 SHA 為準。

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

## 2d. 第 2 期：`GameView`（細部計畫，2026-10-18；2d-A～2d-C 已於本機實作與驗證，見 §2d.7～§2d.10）

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
  - 更正（2026-10-20，使用者選擇方案 B）：改為 `renderChoices(title, opts)`，只建立按鈕 DOM 並回傳按鈕陣列；`game.js` 的 `choose` 再逐個指派 `b.onclick`、`view.buttons.push(b)`。理由：onclick closure 需要按鈕元素 `b`（`isCurrentChoice`、`buttonLabel`），原案須以 `onClick(b)` 把按鈕傳回 `game.js`；方案 B 讓 view 只負責畫面、`game.js` 負責接線，onclick 本文逐字不動。見 §2d.9。

### 2d.4 測試變更（harness 變更，非期望值變更，需揭露）

- 2d-A／2d-B：預計不修改既有測試。實作時逐檔確認：
  - 是否有 vm 切片會執行到包裝函式本體；若有，比照 `d9e90ce` 提供 `gameView` 前導。
  - `card` 首行與 `_curYearBody` 的既有 hook 是否照常運作。
  - 已確認（2026-10-18）：`scripts/check-syntax.mjs` 以 `readdirSync` 自動涵蓋新檔；`verify-modularization`、`information-architecture` 只斷言特定 import／字串存在，新增 `import { GameView }` 不會使其失敗。
- 2d-C：`ui-foundation.test.mjs:36` 的 regex 隨 onclick 指派位置改變而修改；斷言意圖（view-state 守衛 → `runWithResultView` → `runChoiceAction`）不變。
  - 更正（2026-10-20）：採方案 B（§2d.3）後，`b.onclick=()=>{if(S!==view.state…` 仍逐字留在 `game.js`，regex 照常成立，`ui-foundation.test.mjs` 不修改。
- 新增 DOM 快照比對（2026-10-18 使用者批准新增於 `tests/support/`）：
  - `tests/support/dom-snapshot.mjs`：序列化 `#log`、`#act`、`#board` 的 outerHTML（含 `data-*`、`aria-*`、`disabled`）。擷取前等待 rAF（`scrollBottom`）與 `setTimeout`（`endGame` 覆寫的文字替換）結束。
  - 驅動入口 `tests/game-view-dom-e2e.mjs`：沿用 `contract-salary-e2e` 的 `/baseline` 服務方式，同一頁面伺服器同時提供基準 SHA 與 HEAD。投手、野手各 2 個固定 seed，採既有 first-row／balanced 選擇策略。每一步記錄 DOM 快照、`S`（排除 `version`）與 `Rng.onDraw` 計數，逐步比對；任一差異即 FAIL，並輸出第一個差異步驟。視窗寬 1280 與 390 各一次。
  - `scripts/test-manifest.mjs` 的 `nonTests` 登記 `support/dom-snapshot.mjs`。

### 2d.5 驗證（L3 / R3）

每個子期：

1. `node scripts/check-syntax.mjs`。
2. 相關單元：`ui-foundation`、`choice-action`、`ability-allocation`、`fixed-seed-v160`、`trait-policy`、`kbo-renewal-floor`、`championship-intl`、`full-power-pitching`、`award-journal-native`、`npb-return-ui`、`event-integration`。
3. `game-view-dom-e2e`：對 `2a11a64` 的 DOM／`S`／RNG 計數差分＝無。
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
  - 修改：`docs/src/engine/game.js`、~~`tests/ui-foundation.test.mjs`（2d-C）~~（方案 B 不需修改，§2d.4）、`scripts/test-manifest.mjs`。
  - 新入口列入 Full：另需同步 `scripts/ci-full-batches.test.mjs`（入口數 82→83）與 `scripts/TESTING.md`。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC。以 PR 併入 `dev`，不修改 `main`。
- 使用者決定（2026-10-18）：
  1. `allocUI` 暫緩，不併入第 2 期。
  2. STAGE5 R3 從第 2 期拆出，另立項目。
  3. 採 class，名稱 `GameView`。
  4. 批准在 `tests/support/` 新增 DOM 快照比對。
  5. `game-view-dom-e2e` 列為 Full 入口（82→83），作為第 3、4 期的回歸防護；同步 `scripts/ci-full-batches.test.mjs` 與 `scripts/TESTING.md`。
  6. 三個子期合為一個 PR，各子期各自 commit；Full 於三個子期完成後執行一次（AGENTS §6.2）。
- 待決：是否批准依本節實作（commit／push 另批）。→ 2026-10-19 使用者批准 2d-A，順序為：先建 harness，在未改的 HEAD 上確認差分 0 並做負控制；之後才實作。2d-B、2d-C 開始前另行批准。→ 2026-10-20 使用者批准 2d-B（含例外時部分寫入差異、board 負控制，見 §2d.8）；push 待三個子期完成後。→ 2026-10-20 使用者批准 2d-C 採方案 B（§2d.3 更正），順序為先做 `#act` 負控制再實作。

### 2d.7 2d-A 實施結果（2026-10-20，本機）

- 比較基準：`2a11a6444c643002d1c3143fd7827b94ce4ce2eb`；允許差分：無。環境同 §2.9（macOS、Brave 153＋`--disable-features=BraveFarbling`），非 CI。
- commit 分兩個：先 harness（`27f0fa8`：E2E、manifest、入口數 82→83、本計畫的比較基準），再重構（`GameView` 與 `game.js` 包裝）。
- `docs/src/ui/game-view.js`：6 個方法逐字搬移，只做以下替換：
  - `$` → `this.byId`
  - `logTarget()` → `this.logTarget()`
  - `traitResultMarkup` → `this.decorateCard`
  - `traitPresentation.get(S).add` → `this.onTraitShown`
  - `scrollBottom()` → `this.scrollBottom()`
  - `MAX_YEARS` → 引數 `maxYears`
  - `divider` 內的 `_curYearBody=body` → `return body`
- `game.js`（+8／−24，CRLF 維持）：
  - 新增 `import { GameView }`。
  - `traitPresentation` 之後新增 `gameView`。
  - 6 個同名包裝函式皆為單行；`card` 首行 `function card(cls,title,html){` 逐字保留。
- `divider` 寫入時點：原本在刪除最舊年度之前寫入 `_curYearBody`，現在由包裝在 `divider` 回傳後寫入。刪除處理不讀 `_curYearBody`，只刪除最舊的區塊，不會刪到新區塊；寫入的值相同，無可觀察差異。補記（2026-10-20，第 2 期整體 reviewer）：只有刪除處理中拋例外時才不同，原本已寫入 `_curYearBody`，現在不寫入；與 2d-B／2d-C 的例外路徑差異同類，正常流程不會發生。
- 行號變動（§1.1-5；`2a11a64` → 2d-A）：

  | 函式 | 原行號 → 新行號 |
  |---|---|
  | `scrollBottom` | 59 → 60 |
  | `$` | 628 → 626 |
  | `traitPresentation` | 633 → 631 |
  | `gameView` | 新增，632 |
  | `archiveTraitResults` | 634 → 633 |
  | `card` | 665 → 659 |
  | `divider` | 670 → 660 |
  | `board` | 671 → 661 |
  | `actClear` | 695 → 685 |
  | `actToggleSync` | 697 → 686 |
  | `runWithResultView` | 724 → 708 |
  | `choose` | 725 → 709 |
  | `allocUI` | 739 → 723 |
  | `LEGACY` | 2799 → 2783 |
  | `board` 覆寫 | 2983 → 2967 |

  原 698 行以後一律 −16（全檔 3337 → 3321 行）。§2d.2／§2d.3 的行號仍以 `c9c94cd`／`2a11a64` 為準，不改寫；2d-B／2d-C 以新行號為準。
- 驗證（§2d.5 步驟 1～5）：

| §2d.5 | 結果 |
|---|---|
| 0 harness 自我驗證（實作前） | 未改的 HEAD：8 段生涯 PASS，差分 0（147 秒）。`--negative-control`（只在候選端的年度標題加尾端空白）：如預期 FAIL，在第 0 步抓到 `$.dom.log` 差異 |
| 1 `check-syntax` | PASS（151 檔） |
| 2 相關單元 11 支 | PASS |
| 3 `game-view-dom-e2e` | PASS：4 seed（P×2、IF、OF）× 1280／390，共 8 段生涯，每一步的 DOM、`S`、RNG 計數都和 `2a11a64` 相同（143.5 秒） |
| 4 既有 UI E2E 8 支 | 8 PASS |
| 5 Quick | 63 PASS／0 FAIL／0 SKIP／0 BLOCKED（112 秒） |

- 另外：`ci-full-batches.test` 31 pass／1 skip（只在 Linux 上跑的測試）。manifest `seconds:300`，runner 逾時為 `max(180, 300×4)` = 1200 秒。
- reviewer：
  - 低嚴重度 1 項，不修正：建構時以值捕獲 `traitResultMarkup`、`logTarget`、`scrollBottom`；之後若重新指派這三者，`gameView` 看不到。目前沒有任何測試或程式這樣做；`card`、`divider` 等包裝本身仍可重新指派。
  - 其餘確認無問題：沒有宣告前使用（TDZ）、`this` 綁定、`card` 執行順序、`divider`、新 E2E 不會誤判 PASS、入口數一致、Linux 大小寫。
- 範圍外的既有小瑕疵（不修正）：`fixed-seed-v160.test.mjs:5` 的 `indexOf('function clamp')` 為 −1，切片幾乎是整個檔案；斷言 regex 仍成立。
- 未確認：Full、GitHub Actions CI、PC／手機目視（§2d.5 步驟 6～7），依計畫於 2d-C 完成後執行。

### 2d.8 2d-B 實施結果（2026-10-20，本機）

- 比較基準與環境同 §2d.7（`2a11a64`，允許差分：無；Brave 153，非 CI）。
- 實作前唯讀確認（2d-A `7a873f4` 行號）：
  - `board` 讀取的 `ovr:364`、`playerType:379`、`roleN:362`、`dpScore:72`、`S.teamName`（`2766` 開始遊戲時、`2939` `newState`）、`teamDisplay:2813`、`teamRec:2812` 皆為純讀取，不抽 RNG、不碰 DOM。
  - 測試沒有替換或重新指派 `board` 的原始碼；vm 單元以 `board:()=>{}` 取代，E2E 經 `board(p)` 呼叫。既有測試不變。
  - `TEAM_COLOR` 沒有白色，`isWhite` 分支目前不會執行；仍逐字保留。
- `game.js`（+9／−7，CRLF 維持）：
  - `board` 改為單行包裝 `gameView.renderBoard(boardModel(phase))`；`LEGACY` 捕獲此包裝。
  - 新增 `boardModel(phase)`：原本體逐字搬移，DOM 寫入改為區域變數，依原寫入順序回傳 `{nameHtml, teamHtml, age, year, ovr, clearTj, salaryText, phase}`。
  - 覆寫維持兩層：`LEGACY.board(phase)` 之後呼叫 `gameView.patchBoard({name, salaryText})`，只讀原本就讀的 `S.name`、`S.currentSalary`。
  - 逐字保留：`bd-name` innerHTML 未跳脫的 `S.name`、`isWhite`、`rgba(0、0、0、0.4)` 的全形逗號、`bd-sal` 的兩次寫入。
- `game-view.js`：新增 `renderBoard(m)`（寫入順序、`bd-tj` 的 `if(el)`、`lp` 的 `forEach` 照原樣）與 `patchBoard(p)`（`2967` 的追加寫入逐字搬移，保留 `?.`）。
- 已知差異（使用者接受）：原本邊算邊寫，現在先算出整個 model 再寫。若 `S.teamName()` 或 `ovr()` 中途拋例外，原本已寫入 `bd-name`，現在不寫入任何東西。正常流程不會發生。
- 行號變動（2d-A → 2d-B）：`board` 661 不變（改為包裝）；`boardModel` 新增 662–685；原 684 行以後一律 +2（例：`actClear` 685 → 687、`choose` 709 → 711、`allocUI` 723 → 725、`LEGACY` 2783 → 2785、`board` 覆寫 2967 → 2969）。全檔 3321 → 3323 行。
- 驗證：

| 項目 | 結果 |
|---|---|
| board 負控制（實作前，未改的 HEAD；scratchpad 複本，只在候選端 `bd-sal` 加尾端空白） | 如預期 FAIL，在第 0 步抓到 `$.dom.board` 的 `bd-sal` 差異 |
| `boardModel` 副作用（一次性，scratchpad，不 commit） | 4 seed 實際生涯共 1961 步，涵蓋 HS／U／CORP／IND／PRO；每一步以 phase 0／1／2／undefined 呼叫，`S` 不變、RNG 消耗 0 |
| 1 `check-syntax` | PASS（151 檔） |
| 2 相關單元 11 支 | PASS |
| 3 `game-view-dom-e2e` | PASS：8 段生涯的 DOM、`S`、RNG 計數每一步都和 `2a11a64` 相同（145 秒） |
| 4 既有 UI E2E 8 支 | 8 PASS |
| 5 Quick | 63 PASS／0 FAIL／0 SKIP／0 BLOCKED（103 秒） |

- reviewer：無 findings。指出 `boardModel` 內 `const tc = (` 被誤改為 `const tc =(`（只差空白，無行為差異），已改回逐字。改回後重跑 `check-syntax` PASS、`game-view-dom-e2e` PASS（144 秒）；上表其餘項目是在改回前（只差該空白）執行。
- 未確認：Full、GitHub Actions CI、PC／手機目視（§2d.5 步驟 6～7），於 2d-C 完成後執行。

### 2d.9 2d-C 實施結果（2026-10-20，本機）

- 比較基準與環境同 §2d.7（`2a11a64`，允許差分：無；Brave 153，非 CI）。
- 實作前唯讀確認（2d-B `eb1824d` 行號）：
  - `LEGACY`（`2785`）不捕獲 `choose`，也沒有 `choose` 的覆寫。
  - 測試對 `choose` 內部的文字耦合只有 `ui-foundation.test.mjs:36`；沒有測試斷言 `game.js` 含有按鈕建立的程式碼。
  - `createChoiceActionToken`（`choice-action.js:6`）為純函式。
- `game-view.js`：新增 `renderChoices(title, opts)`。依原順序逐字搬移 `pointerEvents=''` → 移除 `collapsed`（保留原註解）→ title → 每個選項 `createElement` → `className` → `innerHTML` → `disabled=false` → `appendChild`，回傳按鈕陣列。替換只有 `a=$('act')` → `this.byId('act')`。
- `game.js`（+4／−8，CRLF 維持）：`choose` 在 `activeChoiceToken=token` 之後呼叫 `gameView.renderChoices(title,opts)`，再以 `opts.forEach((o,i)=>{ const b=buttons[i]; … })` 指派 onclick 並 `view.buttons.push(b)`。onclick 本文與原本相同（比對確認只少了原本的 `a.appendChild(b);`）。`const a=$('act')` 留在 `choose`，供 `currentMarkup`／`isCurrentChoice`／`disableAll` 使用。
- 已知差異：
  - 順序：原本每個按鈕依序做完 onclick、`view.buttons.push`、`appendChild`；現在所有按鈕先 append，再指派 onclick 並填入 `view.buttons`。迴圈為同步執行，中途不會發生點擊，`restorePendingChoice` 只在 `choose` 返回後讀取 `view.buttons`，最終 DOM 與 `view` 相同。
  - 例外路徑：選項中途拋例外時，已 append 的按鈕同樣會留下，但 `view.buttons` 為空（原本為部分填入）。正常流程不會發生。
- 行號變動（2d-B → 2d-C）：`runWithResultView` 710、`choose` 711 不變；原 722 行以後一律 −4（例：`allocUI` 725 → 721、`LEGACY` 2785 → 2781、`board` 覆寫 2969 → 2965）。全檔 3323 → 3319 行。`renderChoices` 為 `game-view.js:40`。
- 驗證：

| 項目 | 結果 |
|---|---|
| `#act` 負控制（實作前，未改的 HEAD；scratchpad 複本，只在候選端包裝 `choose`，於第一個按鈕 `innerHTML` 加尾端空白） | 如預期 FAIL，在第 0 步抓到 `$.dom.act` 差異 |
| 1 `check-syntax` | PASS（151 檔） |
| 2 相關單元 11 支 | PASS |
| 3 `game-view-dom-e2e` | PASS：8 段生涯的 DOM、`S`、RNG 計數每一步都和 `2a11a64` 相同（144 秒） |
| 4 既有 UI E2E 8 支 | 8 PASS／0 FAIL／0 SKIP／0 BLOCKED（510 秒） |
| 5 Quick | 63 PASS／0 FAIL／0 SKIP／0 BLOCKED（105 秒） |

- reviewer：無 findings（確認逐字搬移、`this.byId('act')` 與 `a` 為同一節點、順序差異不可觀察、無 TDZ、CRLF／LF 正確）。
- 未確認：Full、GitHub Actions CI、PC／手機目視、三個子期整體的 reviewer（§2d.5 步驟 6～7、9）。→ GitHub Actions CI 以外見 §2d.10。

### 2d.10 第 2 期整體驗證（2026-10-20，本機，§2d.5 步驟 6～9）

- 對象：`ac6b69b8d22daf0b231ddb02a683da82843cb2f2`（2d-C）。環境同 §2d.7（macOS、Brave 153＋`--disable-features=BraveFarbling`），非 CI。

| §2d.5 | 結果 |
|---|---|
| 6 Full | 83 PASS／0 FAIL／0 SKIP／0 BLOCKED（1615 秒） |
| 7 目視 1280 | 開始畫面、選項（title、`main`／`warn`、`<small>`）、board、年度 log 摺疊、退休畫面皆正常；點擊選項後新增 log 卡片，選項區收合、年度標題摺疊皆可切換。Console 0 筆，請求全部 200 |
| 7 目視 390 | 同上 5 個畫面正常；Console 0 筆，無失敗請求，`scrollWidth` 390（無橫向捲動）。開始按鈕第一張截圖偏淡，為截圖時 0.15 秒 transition 未結束，重拍正常 |
| 8 行號變動 | §2d.7～§2d.9 |
| 9 reviewer（`2a11a64..ac6b69b` 的 `docs/src` 全部） | 無阻擋項目。低嚴重度 1 項：`divider` 例外路徑的揭露不足，已補記於 §2d.7，不改程式。其餘確認：TDZ／載入順序、`this` 綁定、`choose` 內 `actClear` → `renderChoices` → `actToggleSync` 的順序、`card` → `scrollBottom` 與 `runWithResultView`、board 覆寫與 `patchBoard`、測試對 `card`／`divider`／`_curYearBody` 的替換或重新指派、Linux 大小寫、CRLF／LF |

- 目視以 Playwright（Brave）在本機靜態伺服器上進行，seed 為 `yakyo-test-001`（投手，1280）與 `jp3-infielder-01`（內野手，390），均玩到退休。
- 未確認：GitHub Actions CI（push／PR 後）。

### 2d.11 PR #8 合併 `dev` 與重新驗證（2026-10-21，本機）

- 原因：`origin/dev` 新增 `1bc65df`（1.13.1，board 選單／資訊對話框／桌面側欄；不改 `game.js`），PR #8 衝突。
- 合併：`74bcb5e`（`origin/dev` → 本分支，不 rebase、不 force push）。文字衝突只有 `BACKLOG.md` 檔頭「現行狀態索引」：採 `dev` 的刪除（使用者批准）；本分支的 CI_PASS 補記仍在 `CI-LINUX-FULL-01`、`TEST-COMPARE-BASELINE-01` 正文。`scripts/test-manifest.mjs` 自動合併。
- 基準變更：合併後對 `2a11a64` 執行 `game-view-dom-e2e`，如預期於 `yakyo-test-001/P/first-row/1280` 第 0 步 `$.dom.board` 不同（候選端有 `#board-menu`）。預設基準改為 `1bc65df`（§1-3）。
- 驗證（對象：`74bcb5e`＋基準變更；環境同 §2d.7，非 CI）：

| 項目 | 結果 |
|---|---|
| `check-syntax` | PASS（157 檔） |
| `game-view-dom-e2e`（對 `1bc65df`） | PASS：8 段生涯的 DOM、`S`、RNG 計數每一步相同（145 秒） |
| Quick | 63 PASS／0 FAIL／0 SKIP／0 BLOCKED（127 秒） |
| Full | 82 PASS／**1 FAIL**／0 SKIP／0 BLOCKED（2663 秒，`test-results/2026-10-21T13-23-33-559Z-full/`）；§2d.5 的 8 支 UI E2E 皆含於此次 Full 且 PASS，未另行單獨執行 |

- Full 的 FAIL：`international-personal-stats-e2e` 的 T14 共 32 案（4 寬度 × 4 主題 × P／IF）`locator.click` 逾時；同入口的固定 seed 生涯（S／RNG 比對）PASS。原因：T14 點擊 `[data-open-preferences]` 的最後一個，`1bc65df` 起該元素為收合選單內的 `#board-preferences`，不可見；`1bc65df` 未更新此測試。於 `1bc65df` 的獨立 worktree 以 `--fixtures-only` 執行，FAIL 為同一 32 案（11 PASS），與合併後 HEAD 的 FAIL 集合完全一致。判定為 `dev` 既有的測試不相容，與本期重構無關；本 PR 不修正（範圍外，待使用者決定）。
  - 修正（2026-10-21，使用者批准）：PR #8 併入 `dev`（`26efa59`）後，另開 `fix/intl-stats-board-menu`（PR #9 → `dev`），`68f6138` 將 T14 改用 `openBoardAction(p,'board-preferences')`（斷言不變）。`international-personal-stats-e2e` 於 `1bc65df` 基底與 `68f6138` 皆 PASS（221／217 秒）；`68f6138` Quick 63 PASS／0 FAIL／0 SKIP／0 BLOCKED。Full 未重跑。
- 未確認：GitHub Actions CI。

## 2e. 第 3 期：`CareerSession`（細部計畫，2026-10-21）

### 2e.1 目標與範圍

- 目標：把 `game.js` 中散在模組層級與 JP 覆寫 IIFE 內、屬於「一場生涯的流程狀態」的可變變數，收入單一 `CareerSession` 實例。只作容器搬移，不改流程邏輯。
- 範圍內，分兩個子期，前一子期驗證通過後才進下一個：
  - **3-A**（模組層級）：`stepQ`、`choiceGeneration`、`activeChoiceToken`、`resultViewDepth`、`currentChoiceAction`、`currentChoiceContext`。
  - **3-B**（JP 覆寫 IIFE `2778`～`3319` 的閉包區域變數）：`pendingOffseasonSalary`、`npbReturnOfferContext`、`seasonEndContext`、`corpSettlements`。
- 範圍外（2026-10-21 使用者確認）：
  - `S`、`careerRng`、`_s`、`SEED`：維持模組層級的直接名稱。`S` 被全部 E2E 注入碼直接引用；`careerRng` 只在 IIFE 初始化時建立一次（`2815`），且 `tests/support/rng-instrument.mjs:5` 以 `/^let careerRng = null;$/m` 判斷計數路徑，該行改變會靜默退回舊替換方式。
  - `gameView`（`632`，§3.3 原稱 `view`）：第 2 期的畫面物件，不持有生涯狀態。
  - `_curYearBody`／`MAX_YEARS`：同 §2d.3。
  - `choiceViews`／`seasonContinuations`／`yearHandoffs`（`693`）：以 `S` 為 key 的 WeakMap，已按生涯區分。
  - 函式型 `let`（`applyPromotionSalary` 等 `1638`～`1644`、`resumeSeasonEnd:694`）：LEGACY 覆寫，第 4 期。
  - 年度流程函式（`startYear`、`nextStep`、`phase*`、`advance`）本身：不搬移。
  - `tools/development-a/runtime.mjs`：研究工具，非測試入口。其注入碼直接引用 `stepQ`（`:10`）與 `currentChoiceContext`（`:21`、`:22`），3-A 後將失效；不修改，只在此記錄（2026-10-21 使用者決定）。
- §3.3 原概要的修正：`pendingOffseasonSalary` 等四項不是模組層級變數，而是 IIFE 閉包區域變數；`view` 不存在（實為 `gameView`）。
- 允許差分：**無**。同一 seed／選擇的 `S`、RNG 值與呼叫次數、`#log`／`#act`／`#board` 的 DOM 完全一致。

### 2e.2 現況（2026-10-21 唯讀確認，基準 `3267ee6`；`game.js` 與 `26efa59` 相同）

`game.js` 內引用處（含宣告行）：

| 變數 | 子期 | 宣告 | 引用行 | 測試耦合 |
|---|---|---|---|---|
| `stepQ` | 3-A | `233`（`let S=null, stepQ=[];`） | `764`、`771`、`3102` | E2E 注入：`stage10-risk-e2e:23,28`、`support/stage6-browser:20,21`、`full-power-pitching-e2e:29,31` |
| `choiceGeneration` | 3-A | `686` | `698`、`703`、`712`、`717`、`722`、`725`、`2094`、`3249`、`3254` | `choice-action.test:112`（regex `\+\+choiceGeneration`）、`ui-foundation.test:38`（regex）、E2E 注入：`stage6-browser:20`、`bug-act-01-02-e2e:20` |
| `activeChoiceToken` | 3-A | `686` | `714`、`717`、`722`、`2094` | E2E 注入：`stage6-browser:20`、`bug-act-01-02-e2e:20` |
| `resultViewDepth` | 3-A | `690` | `710`、`718` | 無 |
| `currentChoiceAction` | 3-A | `691` | `708`、`2951` | 無 |
| `currentChoiceContext` | 3-A | `692` | `705`、`706`、`2086` | 無（`tools/development-a/runtime.mjs` 除外，§2e.1） |
| `pendingOffseasonSalary` | 3-B | `2827` | `2874`～`2881`、`2894`、`2900`、`2951`、`3146`、`3234`、`3286` | 原文錨點：`kbo-renewal-floor.test:40`；vm context 屬性：`championship-intl.test:55`；E2E 注入：`stage10-risk:28`、`stage6-browser:21`、`kbo-renewal-e2e:22`、`npb-return-e2e:16`、`contract-salary-e2e:29` |
| `npbReturnOfferContext` | 3-B | `3112` | `3124`、`3125`、`3139` | 原文錨點：`npb-return-ui.test:8`；E2E 注入：`npb-return-e2e:16`、`contract-salary-e2e:29` |
| `seasonEndContext` | 3-B | `3205` | `3222`、`3273`、`3285` | 原文錨點：`championship-intl.test:56`；E2E 注入：`stage10-risk:28`、`stage6-browser:21`、`contract-salary-e2e:29` |
| `corpSettlements` | 3-B | `3260`（`const … new WeakMap()`） | `3265`、`3266`、`3286` | 無 |

- E2E 的注入位置皆在最後一個 `})();` 之前（例：`stage10-risk-e2e:36`、`support/stage6-browser:36`），因此注入碼以直接名稱同時讀寫模組層級與 IIFE 閉包變數。
- 同一段注入碼會打入舊 SHA 的原始碼：`stage10-risk --compare`、`contract-salary-e2e`／`npb-return-e2e`／`kbo-renewal-e2e` 的 `/baseline`、`full-power-pitching-e2e` 的 `baseline`（各入口有各自的預設舊 SHA，例 `kbo-renewal-e2e:12` 為 `f3efb0a`、`full-power-pitching-e2e:11` 為 `20920dd`）。改名後注入碼必須能同時在新舊原始碼上運作。
- 重設：`startJapanese`（`3310`）只重新指派 `S` 與 `SEED`，不重設上表任何變數；`btn-restart`（`3318`）以重新載入頁面重設。`btn-start` 能否不重新載入而第二次觸發未確認；與本期無關，本期不得新增重設（見 §2e.3）。
- 持久化：上表變數皆不寫入 localStorage、分享 URL 或 `S`。
- `game.js` 為 CRLF（第 1 期已知），修改時保持。

### 2e.3 設計

`docs/src/engine/career-session.js`（新）：

```js
export class CareerSession {
  constructor() {
    // 3-A
    this.stepQ = [];
    this.choiceGeneration = 0;
    this.activeChoiceToken = null;
    this.resultViewDepth = 0;
    this.currentChoiceAction = null;
    this.currentChoiceContext = null;
    // 3-B
    this.pendingOffseasonSalary = null;
    this.npbReturnOfferContext = null;
    this.seasonEndContext = null;
    this.corpSettlements = new WeakMap();
  }
}
```

- 只有欄位，沒有方法；**不提供 `reset()`**。現行 `startJapanese` 不重設這些變數，新增重設即屬行為變更。
- 不 import `game.js` 的任何狀態，不碰 DOM、不呼叫 RNG。採 class、獨立檔案，與第 1 期 `Rng`、第 2 期 `GameView` 一致（2026-10-21 使用者確認名稱）。
- 3-B 的欄位在 3-A 時不先加入；各子期只加入該子期的欄位。

`docs/src/engine/game.js`：

- 3-A：`233` 改為 `let S=null;`，其後新增 `const careerSession=new CareerSession();`；刪除 `686`、`690`～`692` 的宣告；全部引用逐一改為 `careerSession.<name>`，運算子與順序不變（例：`++choiceGeneration` → `++careerSession.choiceGeneration`）。
- 3-B：刪除 IIFE 內 `2827`、`3112`、`3205`、`3260` 的宣告，引用改為 `careerSession.<name>`。IIFE 可見模組層級，不需另外傳入。
- 檢查點：
  - 搬移前確認各名稱在引用處沒有被同名區域變數或參數遮蔽（遮蔽處不可改寫）。
  - 實例建立早於任何讀寫：模組層級的呼叫與事件綁定皆在 `233` 之後。
  - `corpSettlements` 的 WeakMap 建立時點由 IIFE 執行時提前至模組初始化；WeakMap 無可觀測副作用，差分＝無。
  - 改寫後 `game.js` 內以 `\b<name>\b` grep，除 `careerSession.<name>` 與 `career-session.js` 外為 0。

### 2e.4 測試變更（harness 變更，非期望值變更，需揭露）

- 新增 `tests/support/career-session-access.mjs`：輸入被注入的原始碼文字，回傳一段注入前導碼，定義 `__cs` 物件，每個欄位各一組 getter／setter。
  - 原始碼含 `new CareerSession(` → 指向 `careerSession.<name>`；否則確認舊宣告存在（例 `let S=null, stepQ=[];`、`  let pendingOffseasonSalary=null;`）→ 指向直接名稱。
  - 兩者皆不符時 **throw**，不靜默退回（避免 `rng-instrument` 式的靜默失效）。
  - 3-A 完成而 3-B 未完成的中間狀態也須正確判斷（各欄位分別判斷）。
  - `scripts/test-manifest.mjs` 的 `nonTests` 登記此檔。
- E2E 注入碼改用 `__cs.<name>`，並在注入時加上前導碼：`stage10-risk-e2e`、`support/stage6-browser`、`full-power-pitching-e2e`、`kbo-renewal-e2e`、`npb-return-e2e`、`contract-salary-e2e`、`bug-act-01-02-e2e`。斷言不變。
- 原始碼 regex：`choice-action.test:112`、`ui-foundation.test:38` 改為比對 `careerSession.choiceGeneration`；斷言意圖不變。
- 原文錨點與 vm context：`kbo-renewal-floor.test:40`、`npb-return-ui.test:8`、`championship-intl.test:55–56` 改用 3-B 後仍存在的錨點，並在 vm context 提供 `careerSession` stub（取代原本的 `pendingOffseasonSalary:null` 等）。新錨點於實作時逐檔確認，切出的程式範圍須與現行相同。
- 順序：先建 `career-session-access.mjs` 並改好 E2E 注入，在**未修改的 `game.js`** 上確認上列 E2E 全 PASS；負控制：對不含任何已知宣告的原始碼呼叫時確實 throw。之後才進 3-A。

### 2e.5 驗證（L3 / R3）

比較基準：`3267ee68c2d9e5d36d4fd57ba4a74e101088cb14`（`origin/dev`，PR #9 merge commit；`game.js` 與 `26efa59` 相同）。各 E2E 的既有預設舊 SHA 不變。

每個子期：

1. `node scripts/check-syntax.mjs`。
2. 相關單元：`choice-action`、`ui-foundation`、`kbo-renewal-floor`、`npb-return-ui`、`championship-intl`、`fixed-seed-v160`、`rng-instrument`。
3. `game-view-dom-e2e`：對基準的 DOM／`S`／RNG 計數差分＝無。
4. 相關 E2E：`stage10-risk-e2e`、`stage6-*`（經 `support/stage6-browser`）、`full-power-pitching-e2e`、`kbo-renewal-e2e`、`npb-return-e2e`、`contract-salary-e2e`、`bug-act-01-02-e2e`。
5. Quick。

兩個子期完成後：

6. Full（本機 Brave＋`--disable-features=BraveFarbling`）。L3 證據以本機為主（§1.1-7）。
7. PC（1280）／手機（390）目視：開始、年度選項、季末結算、NPB 回歸／契約選項、退休畫面。Console／404 為 0。
8. 記錄 `game.js` 行號變動（§1.1-5）。
9. reviewer。

### 2e.6 交付與待決

- 分支：`refactor/career-session`（自 `origin/dev` `3267ee6` 建立）。3-A、3-B 各自 commit，合為一個 PR 併入 `dev`；Full 於兩個子期完成後執行一次。不修改 `main`。
- 變更檔：
  - 新增：`docs/src/engine/career-session.js`、`tests/support/career-session-access.mjs`。
  - 修改：`docs/src/engine/game.js`、§2e.4 所列測試、`scripts/test-manifest.mjs`。
  - 不新增測試入口（Full 入口數不變）。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC。
- 使用者決定（2026-10-21）：
  1. 範圍為 3-A 與 3-B（推薦案為暫緩；使用者選擇兩者皆做）。
  2. `S`、`careerRng`、`_s`、`SEED`、`gameView`、`_curYearBody` 等排除於本期（§2e.1）。
  3. 名稱 `CareerSession`、實例 `careerSession`、獨立檔案。
  4. `tools/development-a/runtime.mjs` 不修改，只記錄。
- 待決：是否批准依本節實作（commit／push 另批）。→ 2026-10-21 使用者批准實作；2026-10-22 批准本機 commit（push 另批）。

### 2e.7 實施結果（2026-10-21～22，本機）

| commit | 內容 |
|---|---|
| `e39831b` | harness：`tests/support/career-session-access.mjs`、7 支 E2E 注入改用 `__cs`、`scripts/test-manifest.mjs` 登記 |
| `d303c32` | 3-A：新增 `docs/src/engine/career-session.js`；`game.js` 6 個變數改為 `careerSession.<name>`（34 處）；`choice-action.test:112`、`ui-foundation.test:38` 的 regex |
| `db5c39b` | 3-B：IIFE 內 4 個變數改為 `careerSession.<name>`（28 處）；`kbo-renewal-floor.test:40`、`npb-return-ui.test:8,12`、`championship-intl.test:55–56` 的錨點與 vm stub |

- 實作與驗證以 `git worktree` 並行（2026-10-21 使用者批准）：3-B 在 3-A 的 E2E 執行期間於另一 worktree 實作，**未等 3-A 驗證通過才開始**（與 §2e.1「前一子期驗證通過後才進下一個」不同）；3-B 的驗證在 3-A 全數通過後才執行，commit 依 harness → 3-A → 3-B 順序建立。HEAD 檔案與已驗證的 worktree 逐檔一致（`cmp`）。
- E2E 改為分組平行執行（2026-10-21 使用者批准；各組獨立 `--output`，伺服器皆 `listen(0)`）。

驗證（本機 macOS，Brave＋`--disable-features=BraveFarbling`；比較基準 `3267ee68c2d9e5d36d4fd57ba4a74e101088cb14`）：

| 階段 | 結果 |
|---|---|
| harness，未修改的 `game.js` | 相關 E2E 12 入口 12 PASS／0 FAIL／0 SKIP／0 BLOCKED（1121 秒，`test-results/2026-10-21T15-23-37-964Z-full/`）。負控制：無 IIFE 結尾、無任何欄位、欄位缺漏的 get／set 皆 throw；重複套用不重複注入；`game.js`＋`__cs` 可解析。各 E2E 舊基準（`37121fb`、`f3efb0a`、`20920dd`、`73d5a58`、`origin/main`）的欄位判斷逐一確認，缺漏欄位為 MISSING（存取時 throw） |
| 3-A | `check-syntax` PASS；相關單元 7 支 PASS；Quick 63 PASS／0 FAIL／0 SKIP／0 BLOCKED；相關 E2E 12 PASS（4 組平行）；`game-view-dom-e2e --baseline=3267ee6`：8 生涯（P／IF／OF，1280／390）DOM／`S`／RNG 完全一致 |
| 3-B | 同上：`check-syntax`、相關單元 7 支（含 `kbo-renewal-floor --baseline=3267ee6`）PASS；Quick 63 PASS；相關 E2E 12 PASS；`game-view-dom-e2e` 8 生涯完全一致 |
| Full（`db5c39b`） | 4 組平行（21／21／21／20 入口），合計 **83 PASS／0 FAIL／0 SKIP／0 BLOCKED**，83 入口不重複、4 份報告的 `head` 皆為 `db5c39b`；最長一組 443 秒（`test-results/phase3-full-g0`～`g3/`）。此為分組執行，非單一 Full 報告；`ci-full-batches` 的嚴格彙整未執行 |
| 目視 | Playwright MCP 瀏覽器、本機靜態伺服器：1280 寬投手 `yakyo-test-001` 自開始至退休畫面（542 步）；390 寬同一退休畫面與內野手 `jp3-infielder-01` 年度能力分配（75 步）。Console 0、失敗請求 0、390 寬無橫向捲動 |
| reviewer | 無問題（引用遺漏／重複前綴／遮蔽、求值順序與初始化時點、`__cs` 假 PASS、錨點範圍、換行混用皆檢查） |

- 驗證中的 BLOCKED：3-A 第一次分組執行以相對路徑指定 `--playwright`，全部入口 BLOCKED（模組解析失敗，測試未執行）；改為絕對路徑重跑後如上。
- `game.js` 行號變動（§1.1-5；舊＝`3267ee6`，3319 行 → 3313 行）：舊 1–2：0；3–233：+1；234–685：+2；687–689：+1；693–2826：−2；2828–3111：−3；3113–3204：−4；3206–3259：−5；3261–3319：−6。
- 範圍外的觀察（未修改）：桌面版左欄「コンディション」的 TJゲージ顯示未四捨五入的小數（例 `13.947368421052632`）。`game-view-dom-e2e` 判定 `#log`／`#act`／`#board` 與基準一致，原始碼確認為既有表示（`buildAbilityViewModel` 的 `String(S.tj||0)`，自 `08d0759` 起，`3267ee6` 相同）；未在基準 SHA 上目視確認。已列 BACKLOG `UI-TJ-GAUGE-01`（2026-10-22 使用者批准）。
- 已知影響：`tools/development-a/runtime.mjs` 的注入碼引用 `stepQ`、`currentChoiceContext`，3-A 後失效（§2e.1 決定不修改）。
- 未確認：GitHub Actions CI。

### 2e.8 PR #10 合併 `dev` 與重新驗證（2026-10-22，本機）

- 原因：PR #10（`refactor/career-session` → `dev`）未合併期間，`origin/dev` 新增 `4cb4c98`（1.13.3，引退送別改為日本球界；改 `game.js` 的 `daibaFarewell` 2 處、`npb-return-ui.test`、`event-fix-e2e`，新增 `npb-farewell.test`）。
- 合併：`29ef092`（`origin/dev` → 本分支，不 rebase、不 force push），無文字衝突；`npb-return-ui.test.mjs` 自動合併（本分支改檔頭錨點與 vm stub，`dev` 改檔尾送別比對）。已 push（`b0f5f88..29ef092`）。
- 比較基準：`4cb4c987792f6d1291fb76b73af4e9eb332931ec`（`origin/dev`）。
- 驗證（對象：`29ef092`；本機 macOS，Brave 155＋`--disable-features=BraveFarbling`，非 CI）：

| 項目 | 結果 |
|---|---|
| `check-syntax` | PASS（160 檔） |
| 相關單元 | `choice-action`、`ui-foundation`、`npb-return-ui`、`championship-intl`、`fixed-seed-v160`、`rng-instrument`、`npb-farewell`、`award-identity-policy`、`kbo-renewal-floor --baseline=4cb4c98`、`verify-modularization` 皆 PASS |
| `game-view-dom-e2e --baseline=4cb4c98` | PASS：8 生涯 DOM／`S`／RNG 每一步完全一致 |
| Quick | 64 PASS／0 FAIL／0 SKIP／0 BLOCKED（110 秒，`test-results/merge-dev-quick/`） |
| Full | 4 組平行（19／21／21／23 入口），合計 **84 PASS／0 FAIL／0 SKIP／0 BLOCKED**，84 入口不重複、4 份報告的 `head` 皆為 `29ef092`；最長一組 462 秒（`test-results/merge-dev-full-g0`～`g3/`）。分組執行，非單一 Full 報告；`ci-full-batches` 的嚴格彙整未執行 |

- reviewer：未執行（合併無衝突解決，本分支無新增邏輯）。
- 未確認：GitHub Actions CI（push `29ef092` 後）。

## 2f. 第 4 期：LEGACY 覆寫 4-A（細部計畫，2026-10-22）

### 2f.1 目標與範圍

- 目標：刪除 `game.js` 中被 JP 覆寫完全取代、不再執行的舊本體與舊路徑；拆除 JP 覆寫 IIFE 的外殼，使同名函式只剩一個定義。
- 範圍內（4-A）：
  1. 刪除 19 個完全取代的舊本體：`newState`、`salaryFor`、`stageLabel`、`startYear`、`teamChampRate`、`doTradeExec`、`amateurSeason`、`maybeIntl`、`phaseEnd`、`daibaFarewell`、`outOfOrg`、`teamListOf`、`signTo`、`faFlow`、`faMarket`、`crossOffers`、`runDraft`、`pathChoiceHS`、`pathChoiceU4`。
  2. 刪除 `makeOffers`、`pickOfferUI`、`phasePre` 內的 `if(false){…}` 區塊、舊 `$('btn-start').onclick=()=>{…}`。結案 `CONTRACT-LEGACY-01`。
  3. 拆殼：刪除 `(() => {`、`  'use strict';`、`})();` 三行；原 IIFE 內程式碼保留兩格縮排，順序不變。19 個 `  name = function(…){…};` 就地改為 `  function name(…){…}`。
- 範圍外：
  - **4-B**（暫緩，同 §2c 方案 A）：檔頭 RNG 舊定義 `seedInit`／`R`、`_s`、`fixed-seed-v160` 的文字斷言。`seedInit = function`／`R = function` 兩行維持指派形式（vm harness 以此抽取）。
  - **4-C**（不做）：`board`、`movement`、`advance`、`endGame` 的包裝。原本體為現役程式碼。`LEGACY` 物件與其未使用的 `phasePre`／`phaseMid`／`proSeason` 屬性不動。
  - **4-D**（不做）：8 個薪資 stub（`let applyPromotionSalary=()=>{}` 等）與其在原 IIFE 區域內的指派。
  - 刪除後才變成未使用的周邊定義（例：`CPBL_TEAMS`／`NPB_TEAMS`／`MLB_TEAMS`、`faYears`、`selPos`）：本期不追刪，只記錄。
  - `tools/development-g9/verify-version-metadata.mjs:31`（錨點 `newState = function`）、`tools/development-a/runtime.mjs`、`docs/reviews/*` 的歷史工具：不修改，只記錄（同 §2.4、§2e.1）。
- 允許差分：**無**。同一 seed／選擇的 `S`、RNG 值與呼叫次數、`#log`／`#act`／`#board` 的 DOM 完全一致。
- 使用者決定（2026-10-22）：採 4-A；以拆殼方式（不把本體搬回原位置）；保留縮排。

### 2f.2 現況（2026-10-22 唯讀確認，基準 `d2a564e`；以 acorn 8.15.0 做 AST 分析）

| 項目 | 結果 |
|---|---|
| 覆寫綁定 | 33 個：完全取代 21（上列 19 個＋`seedInit`、`R`）、包裝 4（`board`／`movement` 經 `LEGACY`，`advance` 經 `advanceWithoutSalaryFinalization`，`endGame` 經 `LEGACY`＋`legacyEndGame` 兩層）、stub 補上 8 |
| 舊本體可達性（靜態） | 19 個舊本體在 IIFE 指派後沒有捕獲者；模組層級與 IIFE 評估期間沒有呼叫這 19 個名稱，也沒有以值捕獲（`LEGACY` 只捕獲 `board`、`movement`、`phasePre`、`phaseMid`、`proSeason`、`endGame`） |
| `makeOffers`／`pickOfferUI` | 12 個呼叫點全在 19 個舊本體內，或在 `if(false){`（`game.js:836`）內；靜態判斷不可達 |
| 舊開始處理 | `game.js:2755` 的 onclick 在 IIFE 評估時被 `game.js:3309` `$('btn-start').onclick=startJapanese` 覆蓋，使用者操作前已失效 |
| 名稱重複 | IIFE 直接宣告 64 個，與模組層級、彼此之間、19 個舊本體皆**零重複**（拆殼後不會 SyntaxError，名稱解析不變） |
| `})();` 出現位置 | 4 處：`game.js:50`、`784`（皆在運算式／函式內）、`2747`（act-toggle 小 IIFE 結尾）、`3313`（JP IIFE 結尾） |
| 刪除行數 | 19 個舊本體 344 行；`pickOfferUI` 9、`makeOffers` 6、`if(false)` 區塊 21、舊 onclick 19，共 55 行；外殼 3 行。合計約 −402 行（3313 → 約 2911 行） |

拆殼前後的語意：

- IIFE 內語句的執行順序與時點不變：IIFE 原本就在模組評估的最後執行，拆殼後同樣的語句在同一位置依序執行。
- ES module 本身即 strict mode，刪除 `'use strict'` 不影響。箭頭 IIFE 的 `this` 為 `undefined`，與模組頂層相同。
- 19 個名稱改為函式宣告後，在模組實例化時即綁定 JP 版本；原本在 IIFE 指派前的瞬間是舊版本。因評估期間不呼叫這些名稱（上表），兩者不可觀察。
- 原 IIFE 內的函式宣告提升到模組層級後，IIFE 外的程式碼如果引用這些名稱，原本會 ReferenceError，拆殼後會解析成功。須在實作前確認這類自由識別字為零（§2f.5-0）。

### 2f.3 設計

`docs/src/engine/game.js`（CRLF 維持）：

```js
/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */
  const DATA = JP_DATA;                         // 原 (() => { 與 'use strict' 兩行刪除
  const LEGACY = { board, movement, phasePre, phaseMid, proSeason, endGame };
  …
  function teamListOf(org){return listByOrg(org).map(t=>t.teamId);}   // 原 teamListOf = function(org){…};
  …
  $('btn-restart').onclick=()=>{…};
                                                // 原 })(); 刪除
```

- 19 個轉換只改宣告形式：`name = function(` → `function name(`，結尾 `};` → `}`；參數與本體逐字不動。
- 舊本體刪除與宣告轉換必須在同一 commit：只做其一時，模組中會有兩個同名函式宣告（SyntaxError），或名稱沒有定義。
- 標記註解 `/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */` 保留（`stage10-risk-e2e` 以它為錨點）。

新增 `tests/support/overlay-hook.mjs`：

```js
export function injectOverlayHook(source, hook) {
  const marker = '/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */';
  const at = source.indexOf(marker);
  if (at < 0) throw Error('OVERLAY_HOOK_MISS');
  if (/^\(\(\) => \{\r?$/m.test(source.slice(at, at + marker.length + 16))) {   // 舊原始碼：IIFE 內
    const end = source.lastIndexOf('})();');
    if (end < at) throw Error('OVERLAY_HOOK_MISS');
    return source.slice(0, end) + hook + source.slice(end);
  }
  return source + '\n{\n' + hook + '\n}\n';                                       // 新原始碼：模組末尾的區塊
}
```

- 舊原始碼（各 E2E 的歷史基準 SHA）：沿用現行插入位置。新增「插入點須在標記之後」的檢查；現行 16 檔中有 10 檔找不到時不報錯，改用 helper 後會丟 `OVERLAY_HOOK_MISS`。這是更嚴格的檢查，不是放寬。
- 新原始碼：附加在檔尾，以 `{ }` 包住。hook 內的 `const`／`let`／`function` 維持區塊作用域，等同原本在 IIFE 內的區域作用域，不會與模組層級名稱衝突。執行時點與原本相同（原本插在 IIFE 最後一行之後、`})();` 之前）。
- 判別方式與錨點細節於實作時以舊、新原始碼的單元測試定案；上段為介面草案。

### 2f.4 測試變更（harness 變更，非期望值變更，需揭露；第 5 點除外）

1. **E2E 注入（16 檔）**：以下各自呼叫 `lastIndexOf('})();')` 的位置改用 `injectOverlayHook`。拆殼後，`lastIndexOf` 會命中 `game.js:2747` 的小 IIFE，hook 落在無法存取 `S` 的作用域。hook 本文與斷言不變。
   - `tests/support/career-session-access.mjs`、`tests/support/baseline-initial-potential.mjs`、`tests/support/stage6-browser.mjs`
   - `stage10-risk-e2e`、`contract-salary-e2e`、`kbo-renewal-e2e`、`bug-act-01-02-e2e`、`npb-return-e2e`、`championship-intl-e2e`、`international-personal-stats-e2e`、`trait-system-e2e`、`trait-display-e2e`、`salary-history-e2e`、`smallschool-c-e2e`、`full-power-pitching-e2e`、`global-contract-market-e2e`
   - 附加在原始碼之後的 6 檔（`display-preferences`、`draft-income`、`event-fix`、`event-system`、`hof-first-ballot`、`replay-share-theme`）不受影響。
2. **`stage10-risk-e2e` 的 `oldNames`**：移除 9 個本期刪除的名稱（`newState`、`startYear`、`amateurSeason`、`salaryFor`、`signTo`、`faMarket`、`crossOffers`、`makeOffers`、`pickOfferUI`），保留 `board`、`movement`、`endGame`、`phasePre`、`phaseMid`、`proSeason`、`advance`。
   - 理由：`makeOffers`／`pickOfferUI` 刪除後，標記前的 `makeOffers=s10wrap(…)` 會 ReferenceError；其餘 7 個在拆殼後會包到 JP 版本，`legacy.*` 標籤失真。
   - 斷言（`legacy.board`>0、`legacy.endGame`>0、追蹤與非追蹤的 actions／state／rng 一致、`--compare` 比較）不變。
3. **vm 切片錨點（雙錨點：新原始碼用 `  function name(`，舊基準用 `  name = function(`）**：

| 檔案:行 | 現行錨點 | 失效原因 | 是否也套用於舊基準 |
|---|---|---|---|
| `tests/school-policy.test.mjs:34` | `'  newState = function(name,pos)'` → `'\n  const nextContractId'` | 起點消失 | 是（`--baseline`） |
| `tests/support/approved-school-oracle.mjs:14` | 同上 | 起點消失，丟 `Unrecognized historical school scope`；連帶 8 支 E2E（`international-personal-stats`、`full-power-pitching`、`trait-display`，以及經 `baseline-initial-potential` 的 `draft-income`、`hof-first-ballot`、`display-preferences`、`contract-salary`、`kbo-renewal`） | 是（歷史原始碼） |
| `tests/championship-intl.test.mjs:41` | 終點 `'  maybeIntl = function(done)'` | 終點消失，切片變成幾乎整個檔案 | 待實作時確認 |
| `tests/npb-return-ui.test.mjs:8` | 起點 `'  crossOffers = function(o){'` | 起點消失 | 待實作時確認 |
| `tests/npb-return-ui.test.mjs:66` | 終點 `'function outOfOrg'`（與 `approvedOldGame` 比對） | 舊 `outOfOrg` 刪除後，第一個 `function outOfOrg` 落在原 IIFE 區域，切片範圍錯誤 | 是（`approvedOldGame`） |
| `tests/kbo-renewal-floor.test.mjs:40` | `between('  salaryFor = function', …)` | 起點消失 | 是（`--baseline`） |
| `tests/trait-policy.test.mjs:105` | 終點 `'function maybeIntl('` | 同 `outOfOrg`：終點移到原 IIFE 區域 | 舊基準 `9fcb24a` 不變；新原始碼改用刪除後緊接 `awards` 的定義 |

   - 兩格縮排保留，因此以兩格縮排為錨點的 IIFE 區域切片（`kbo-renewal-floor:41–44`、`international-personal-stats:68`、`event-integration:36`、`npb-return-ui:66` 的 `'  salaryCandidate='`、`championship-intl:56`）不受影響。
4. **新增 `tests/overlay-hook.test.mjs`**：測試新原始碼走檔尾區塊、`d2a564e` 原始碼走 IIFE 內插入、無標記或插入點在標記之前時丟錯。另需同步 Full 入口數 84→85（`scripts/ci-full-batches.test.mjs`）、`scripts/TESTING.md`，並在 `scripts/test-manifest.mjs` 的 `nonTests` 登記 `support/overlay-hook.mjs`。
5. **`tests/npb-farewell.test.mjs:8–20`（斷言變更，須另行批准）**：此測試同時抽出舊本體（`productionFunction('daibaFarewell')`）與 JP 版本（regex `^  daibaFarewell = function`），並斷言 `'base and active definitions agree'`。舊本體刪除後，此比較的前提消失。
   - 方案：改為只抽出 JP 版本（`  function daibaFarewell(`），刪除該項比較斷言。
   - 保留：與 `6e06b1b` 舊版的比較（`:27–30`）及其他斷言。
   - 此變更與 `game.js` 放在同一 commit：在舊本體仍存在的 HEAD 上，原斷言仍然成立。

### 2f.5 驗證（L3 / R3）

比較基準：`d2a564ecbc78d9b8027956d9349b2c7ba1a63934`（`game.js` 與 `29ef092` 相同）；允許差分：無。

0. **實作前檢查（唯讀，scratchpad）**
   - acorn 確認 IIFE 外的程式碼中，解析到 IIFE 區域宣告的自由識別字為 0。
   - IIFE 頂層沒有 `return`／`var` 宣告與模組層級重複。
   - 結果記錄於 §2f.7。
1. **harness commit**（`game.js` 未修改）
   - `overlay-hook.test` PASS。
   - §2f.4 第 1～3 點的所有入口在未修改的 HEAD 上 PASS（走舊路徑／舊錨點）。
   - 負控制：在 scratchpad 的拆殼複本上，以現行（未改）注入方式跑 1 支 E2E，確認 FAIL；改用 helper 後 PASS。
2. **執行期不可達證據**（比照 §2.5-3；`CONTRACT-LEGACY-01` 的結案條件）
   - 在 scratchpad 的 `git worktree` 中，把 19 個舊本體、`makeOffers`、`pickOfferUI`、舊 onclick 本體改為記錄（`(globalThis.__deadCalls??=[]).push(name)`）後丟 `DEAD_CALL:<name>`。
   - 以 4 組平行執行 Full，判定：全部 PASS，且所有報告與 Console 輸出中 `DEAD_CALL` 為 0 筆。
   - 不 commit。範圍限於 Full 涵蓋的流程，結果記錄為 VERIFIED／UNVERIFIED。
3. **實作 commit**（`game.js`、`npb-farewell.test`）
   - `node scripts/check-syntax.mjs`。
   - 相關單元：`school-policy`、`championship-intl`、`npb-return-ui`、`kbo-renewal-floor --baseline=d2a564e`、`trait-policy`、`npb-farewell`、`international-personal-stats`、`event-integration`、`rng`、`award-journal-native`、`fixed-seed-v160`、`overlay-hook`、`verify-modularization`、`information-architecture`。
   - `game-view-dom-e2e --baseline=d2a564e`：8 段生涯，每一步的 DOM／`S`／RNG 計數一致。
   - §2f.4 第 1 點的 16 檔與 `stage10-risk-e2e --compare=d2a564e`。
   - Quick。
4. **Full**：4 組平行（同 §2e.7）。分組執行，不是單一 Full 報告；`ci-full-batches` 的嚴格彙整未執行。
5. **目視**：PC（1280）／手機（390），開始畫面到退休畫面各 1 段生涯；Console／404 為 0。
6. **記錄**：`game.js` 行號變動（§1.1-5），不改寫歷史報告。
7. **reviewer**：審查 `d2a564e..HEAD` 的 diff。重點：19 個轉換逐字一致、刪除範圍、helper 的判別與錯誤路徑、雙錨點、CRLF／LF。
8. FAIL／BLOCKED／SKIP 分別記錄，不標 PASS。

### 2f.6 交付

- 分支：`refactor/legacy-overrides`（自 `refactor/career-session` `d2a564e` 建立，2026-10-22 使用者批准）。
- PR #10 須以 merge commit 併入 `dev`（不 squash），之後本分支的 PR 目標改為 `dev`，不需 rebase。PR #10 若再修改，本分支須合併該修改並重跑 §2f.5-3。
- commit 順序：harness → `game.js`＋`npb-farewell.test` → 文件。
- 變更檔：
  - 新增：`tests/support/overlay-hook.mjs`、`tests/overlay-hook.test.mjs`。
  - 修改：`docs/src/engine/game.js`、§2f.4 所列 23 個測試檔、`scripts/test-manifest.mjs`、`scripts/ci-full-batches.test.mjs`、`scripts/TESTING.md`。
  - 文件：本計畫（§2f.7）、`BACKLOG.md`（移除 `CONTRACT-LEGACY-01`；`REFACTOR-AUDIT-01` 補記第 4 期 4-A 結果，不結案）。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC（§9.3）。不修改 `main`。

### 2f.7 待決

1. 是否批准依本節實作（commit／push 另批）。
2. §2f.4 第 5 點：刪除 `npb-farewell.test` 的 `'base and active definitions agree'` 斷言。
3. §2f.4 第 4 點：新增 `overlay-hook.test`，Full 入口數 84→85。
4. §2f.5-2：執行期證據以 scratchpad worktree 的 Full（4 組平行）進行。

- 使用者決定（2026-10-22）：上列 1～4 項皆批准。commit／push 另批。實作從 §2f.5-0 開始，順序依 §2f.5。

§2f.5-0 結果（2026-10-22，唯讀；對象 `game.js` 與 `d2a564e` 相同；acorn 8.15.0＋eslint-scope 8.4.0，scratchpad 腳本，未加入 repo 依賴）：

| 項目 | 結果 |
|---|---|
| IIFE 外的自由識別字中，解析到 IIFE 區域宣告者 | **0**（自由識別字共 32 個，其餘為瀏覽器內建名稱與下述 4 個） |
| IIFE 頂層 `return`／`var` | 皆 0（`var` 0 個，故無與模組層級重複） |
| IIFE 頂層 `this`／`arguments`／`eval`／`with` | 皆 0 |
| IIFE 宣告（函式 42、`const` 21、`let` 1，共 64）與模組層級的名稱重複 | 現況 0；模擬刪除 21 個本體並把 19 個轉為宣告後亦 0 |
| 19 個覆寫的形式 | 皆為 IIFE 頂層單一、匿名的 `  name = function(` 指派；該指派以外無其他寫入 |
| `makeOffers`／`pickOfferUI` 引用 | 12 處全在刪除範圍內（範圍外 0） |
| 刪除範圍 | 23 段 399 行＋外殼 3 行＝−402 行（與 §2f.2 一致） |

- 附帶發現：IIFE 外另有 4 個未宣告名稱（`careerEarnings`、`ct`、`currentSalary`、`fmtMoneyJPY`），全部只出現在舊 `phaseEnd` 本體內（`game.js:1628`）。該本體若被呼叫會 ReferenceError，可作為不可達的旁證；刪除後消失。

計畫修正（2026-10-22，harness 實作前逐檔確認時發現；使用者批准 A～C）：

- **A. `overlay-hook` 的新原始碼路徑（A′：附加在模組頂層）**：§2f.3 草案每次注入各包一個 `{ }`，`withCareerSessionAccess` 注入的 `const __cs` 對其後的 hook 不可見。先改為單一共用區塊（A，已批准），但負控制顯示仍不足（見下），再改為不包區塊、依注入順序附加在模組頂層（A′，2026-10-22 使用者批准）。新舊判別為「標記的下一行是否為 `(() => {`」。
  - 理由：`kbo-renewal-e2e` 的 hook 宣告 `function applyKboForeignPackageCap(){…}`（同名 import 改名為 `original…`），原本提升到 IIFE 作用域，由覆寫區的 `salaryCandidate`（`game.js:2855`）呼叫；包在區塊內時，嚴格模式下該宣告只在區塊內，覆寫區解析不到。該名稱的引用全部在原 IIFE 區域（`game.js:2776` 以後）。
  - 取捨：hook 的函式宣告對覆寫區可見（同原本），對覆寫區之前的程式碼也可見；後者原本會 ReferenceError，而 IIFE 外的自由識別字只有內建名稱與舊 `phaseEnd` 內 4 個（§2f.5-0），hook 皆未宣告。hook 的 `const`／`let`／函式與模組名稱同名時，原本為安靜遮蔽或覆蓋，A′ 下為載入時 SyntaxError（較嚴格）。
  - 執行順序差異：`instrumentRng` 在現行原始碼檔尾附加的 `careerRng.onDraw=…`，原本在 hook 之後執行，改為在 hook 之前；16 檔的 hook 皆未引用 `careerRng`（grep），不可觀察。
  - `overlay-hook.test` 新增鑑別案例「覆寫區的函式呼叫 hook 宣告的函式」（嚴格模式），區塊設計下為 ReferenceError。
  - §2f.4-1 理由的更正：hook 落入 `game.js:2747` 的小 IIFE 時仍可存取 `S`（該 IIFE 位於模組作用域內）。實際問題是時點：hook 在覆寫區語句執行前即執行，評估時的包裝會被之後的覆寫指派蓋掉，覆寫區的 `const` 尚在 TDZ。
  - 負控制（scratchpad 拆殼複本，`game.js` 只刪外殼 3 行；同一組 Quick 入口 `bug-act-01-02`、`kbo-renewal`、`npb-return`、`championship-intl`、`trait-system`、`global-contract-market`、`salary-history`）：舊注入方式 2 FAIL／5 PASS（`bug-act-01-02-e2e`：`signTo` 包裝被覆寫，`afterCalls` 為 null；`kbo-renewal-e2e`：生涯未完成）；區塊設計（A）1 FAIL（`kbo-renewal-e2e`）；A′ 7 PASS。
- **B. `tests/npb-return-ui.test.mjs` 斷言變更（同 §2f.4-5，與 `game.js` 同一 commit）**：`:63` 斷言舊 `daibaFarewell` 本體在現行原始碼恰出現 1 次，改為斷言核准的 `card('gold','日本球界への別れ',…)` 整句恰出現 1 次（刪除後只在 JP 版）。`:64` 的切片比較：`73d5a58` 側把舊送別替換為空字串（原為核准文字）；`handleDemotion` 段的終點，現行側改為 `/* 長期契約/短期契約`，舊側維持 `function outOfOrg`。
- **C. 一併刪除只描述被刪本體的註解 7 行**：`game.js:602`、`835`、`1612`、`1755`、`1837`、`1893`、`2003`（行號以 `d2a564e` 計）。刪除合計 −409 行。`/* シーズン開幕前。 */`、`/* 開始設定。 */` 保留。
- 與 §2f.4 的其他差異：
  - `tests/support/approved-school-oracle.mjs` 不修改：遇含 `from './school-policy.js'` 的原始碼即提早 return，現行與 4-A 後的原始碼皆含該 import，只有舊歷史原始碼走到 `newState` 錨點。
  - `kbo-renewal-floor` 新形式下，vm 前置的 `let` 須移除 `salaryFor`（否則與函式宣告重複宣告）。
  - `trait-policy` 的終點改為 `^(?:function maybeIntl\(|let applyPromotionSalary=)`（行首）；現行與 `9fcb24a` 的切片與原本逐字相同（已比對）。
  - `scripts/ci-full-batches.test.mjs` 在本分支 HEAD 原本即 FAIL：斷言 83 入口，實為 84（`4cb4c98` 新增 `npb-farewell.test` 時未同步）。本期改為 85（含 `overlay-hook.test`），批次為 `[10,11,10,11,11,10,11,11]`；`TESTING.md` 的 83 同步為 85。

§2f.5-1 結果（2026-10-22，本機 macOS，Brave 155＋`--disable-features=BraveFarbling`；`game.js` 未修改，工作樹，未 commit）：

| 項目 | 結果 |
|---|---|
| `check-syntax` | PASS（162 檔） |
| 相關單元 | `overlay-hook`（8 案例）、`school-policy`、`championship-intl`、`npb-return-ui`、`kbo-renewal-floor`、`trait-policy`、`rng-instrument`、`kbo-renewal-floor --baseline=d2a564e`、`school-policy --baseline=d2a564e` 皆 PASS；`ci-full-batches.test` 31 PASS／0 FAIL／1 SKIP（Linux 限定案例） |
| Full | 4 組平行（21／22／22／20），合計 **85 PASS／0 FAIL／0 SKIP／0 BLOCKED**，85 入口不重複；報告 `head` 為 `87a235a`（未 commit 的工作樹）。`test-results/harness-full-g0`～`g3/`。此時 helper 的新原始碼路徑仍為區塊設計（A）；舊原始碼路徑與 A′ 相同，A′ 後未在未修改的 `game.js` 上重跑 Full |
| 負控制 | 見上「A」：舊注入方式 2 FAIL、A 1 FAIL、A′ 7 PASS；另以 A′ 在拆殼複本跑全部瀏覽器 E2E：**23 PASS／0 FAIL／0 SKIP／0 BLOCKED** |
| reviewer | 無問題（基準 SHA 的標記與 IIFE 首行、雙錨點、`kbo-renewal-floor` 條件前置、`trait-policy` regex 於 CRLF／`9fcb24a`、hook 文字與求值順序、頂層附加的衝突、移除的錯誤訊息無殘留引用） |

§2f.5-2 結果（2026-10-22，本機；scratchpad worktree＝HEAD＋上記 harness，`game.js` 的 21 個舊本體與舊 onclick 本體開頭插入記錄＋`console.error`＋`throw Error('DEAD_CALL:<name>')`，共 22 處；不 commit）：

- Full 4 組平行，85 入口：**83 PASS／2 FAIL／0 SKIP／0 BLOCKED**。
- 2 FAIL 皆為原始碼文字耦合的單元測試（插入造成的假象，非執行期呼叫）：`npb-farewell.test`（以 `productionFunction('daibaFarewell')` 抽出舊本體在 vm 中直接執行 → `DEAD_CALL:daibaFarewell`）；`npb-return-ui.test`（舊送別本體的逐字斷言 `exactly one approved base farewell`）。兩者在 §2f.4-5／計畫修正 B 中本來就要改寫。
- 瀏覽器 E2E 23 入口全部 PASS；`DEAD_CALL` 只出現在 `npb-farewell.test` 的 log，其他報告與 log 為 0 筆。23 支 E2E 皆註冊 `pageerror`／`console` 監聽（原始碼文字確認，未逐支確認其處理方式）。
- 判定（2026-10-22 使用者同意的條件）：**VERIFIED**——Full 涵蓋的流程中，19 個舊本體、`makeOffers`、`pickOfferUI`、舊 onclick 本體在執行期未被呼叫。範圍限於 Full 涵蓋的流程；非全路徑證明。`CONTRACT-LEGACY-01` 的結案條件滿足。

§2f.5-3～6 結果（2026-10-22～23，本機 macOS，Brave 155＋`--disable-features=BraveFarbling`；對象：`b29ccc8`＋未 commit 的 `game.js`／測試變更）：

- `game.js`：以 acorn 位置做位元組層級編輯（51 處：刪除 32 段、拆殼 2 處、轉換 19 個），3313 → 2904 行（−409），CRLF 維持，acorn 可解析。
- 實作中追加的斷言期望值變更（皆為 §2f.4 未列，2026-10-23 使用者逐項批准）：
  - `tests/salary-flow.test.mjs` 的原始碼文字計數：`R(` 35→28、`ri(` 74→43、`chance(`＋legacy slot 57→45、`pick(` 23→14。減少的全部在刪除的舊本體內（`git diff` 確認：轉換行內的 3 個 `ri(` 前後相同；新增行中無 `R(`／`ri(`／`chance(`／`pick(`）。`draw('<SLOT>')` 清單、`chance(terms.winChance)` 不變。
  - `tests/full-power-pitching-e2e.mjs:17`：`phasePre` 與 `20920dd`（經批准的校正）逐字比較，基準側刪除 `/* 大學季前… */` 註解＋`if(false){…}`（22 行）後比較；已確認此為唯一差異，並斷言刪除範圍含 `if(false){`。
- `npb-farewell.test`（§2f.4-5）、`npb-return-ui.test`（計畫修正 B）依批准內容修改。

| 項目 | 結果 |
|---|---|
| `check-syntax` | PASS（162 檔） |
| `kbo-renewal-floor --baseline=d2a564e` | PASS |
| Quick | 65 PASS／0 FAIL／0 SKIP／0 BLOCKED（`salary-flow` 修改後） |
| Full | 4 組平行（21／22／22／20），85 入口不重複：84 PASS／1 FAIL（`full-power-pitching-e2e`，上記 `phasePre` 斷言）。斷言修改後該入口單獨重跑 PASS（354 秒）。其餘 84 入口未於修改後重跑（該變更只影響此檔） |
| `game-view-dom-e2e --baseline=d2a564e` | PASS：8 段生涯（P／IF／OF，1280／390）每一步 DOM／`S`／RNG 完全一致 |
| `stage10-risk-e2e --compare=d2a564e` | 58 PASS／1 FAIL（`E-original-comparison-IF`）。失敗斷言為 `assert.equal(b.state.traits.grinder,false)`（`b`＝比較基準）：此比較原本預設 grinder 修正前的 SHA，`d2a564e` 已含修正，與 `game.js` 變更無關；其前的 actions／`S`／RNG `deepEqual` 皆通過，P 的比較 PASS。計畫指定 `--compare=d2a564e` 時未考慮此點；2026-10-23 使用者同意記錄為預期內 FAIL、不修改測試（未在 `b29ccc8` 上重跑佐證） |
| 目視（自動操作＋截圖） | 1280 投手 `yakyo-test-001`：542 步至退休畫面；390 內野手 `jp3-infielder-01`：543 步至退休畫面。Console 錯誤／pageerror／失敗請求／4xx 皆 0，無橫向捲動。TJゲージ未四捨五入為既有 `UI-TJ-GAUGE-01` |

- `game.js` 行號變動（§1.1-5；舊＝`d2a564e`，3313 → 2904 行）：1–236：0；265–601：−28；612–762：−38；770–834：−45；857–1141：−67；1147–1206：−72；1213–1252：−78；1273–1560：−98；1636–1754：−173；1763–1813：−181；1853–1892：−220；1961–1978：−288；2078–2754：−387；2774–2775：−406；2778–3312：−408（19 個宣告就地改寫，偏移相同）。其餘舊行已刪除。
- reviewer（`d2a564e..` 的 `game.js`＋4 測試）：無問題（19 個轉換以規則重算後 diff 為空；IIFE 前區域僅刪除、保留的註解完好；CRLF 2904／2904；`LEGACY` 不捕獲 19 名稱、評估期間無引用；`salary-flow` 計數註解與實數一致）。23 支瀏覽器 E2E 未由 reviewer 重跑。
- commit：`b29ccc8`（harness）、`34c9c7b`（`game.js`＋4 測試）、文件。`BACKLOG.md`：移除 `CONTRACT-LEGACY-01`（結案條件由 §2f.5-2 滿足）；`REFACTOR-AUDIT-01` 補記 4-A，不結案。

## 2g. 第 5 期：`CareerPresenter`（細部計畫，2026-10-23）

### 2g.1 目標與範圍

- 目標：把唯讀的 view model 建構（STAGE5 路線 R3）從 `game.js` 抽成 `CareerPresenter` 類別，形成「核心 → presenter → view（`GameView`／`navigation`）」三層。第 2 期已把 DOM 操作移出；本期把「`S` → 顯示用資料」的轉換移出。
- 範圍內：`buildRecordViewModel`、`buildAbilityViewModel`、`buildTraitsViewModel`、`buildPlayerViewModel`、`buildCareerViewModel`，以及只被它們使用的 `statSummary`、`rehabStatusText`（`game.js:582–588`，皆為單行）。
- 範圍外：
  - `UI-TJ-GAUGE-01`（`buildAbilityViewModel` 的 TJ 顯示）等顯示規則修正：§1.1-2，不與重構同一 change-set。本期期間凍結 `UI-TJ-GAUGE-01`、`INJ-UI-01`、`PLY-01`、`INT-01`（皆未開始，無並行衝突），完成後改在新模組上進行。
  - `currentAffiliation`（`game.js:581`）：原始碼中只出現定義 1 次，疑似未使用；只記錄，不刪除。
  - `tools/development-b/runtime.mjs`（引用 `buildCareerViewModel`）等歷史工具：不修改（委派保留名稱，引用仍有效）。
- 允許差分：**無**。同一 seed／選擇的 `S`、RNG、`#log`／`#act`／`#board` DOM，以及每一步的 player／career view model 完全一致。
- 使用者決定（2026-10-23）：命名、D2（保留委派）、風險等級 L2／R2（PR 前 Full 一次）皆依本節。

### 2g.2 現況（2026-10-23 唯讀確認，基準 `097e212`；scout 調查＋抽查）

| 項目 | 結果 |
|---|---|
| 讀寫 | 7 個函式皆只讀 `S`；不寫入狀態、不抽 RNG；回傳 `Object.freeze` 物件 |
| 對外入口 | `initNavigation({onArchive…,onOpenPlayer:buildPlayerViewModel,onOpenCareer:buildCareerViewModel})`（`game.js:2900`）；`navigation.js`、`desktop-overview.js` 經 callback 取得。`docs/src/ui/*` 沒有直接呼叫 |
| `game.js` 內依賴 | `fmtMoney`（574）、`fmtIP`、`displayTrait`（575）、`teamNick`（1067）、常數 `ABL`／`POS_AB`／`POSN`（65–67） |
| import 依賴 | `formatRehabStatus`（`ui/condition-view-model.js`）、`removedTraitLabel`（`engine/trait-policy.js`）、`contractTypeLabel`（`ui/contract-labels.js`） |
| 測試耦合 | `ui-foundation.test:40` regex `onOpenPlayer:buildPlayerViewModel`；`:41` regex `abilities:POS_AB\[S\.pos\]\.map`；`trait-display-e2e:18` hook 呼叫 `buildTraitsViewModel()` |
| 既有驗證的涵蓋 | `game-view-dom-e2e` 只比對 `#log`／`#act`／`#board`，不含桌面左右欄與 player／career 畫面 |

### 2g.3 設計

新增 `docs/src/ui/career-presenter.js`（LF）：

```js
export class CareerPresenter {
  constructor({getState, labels:{ABL,POS_AB,POSN}, fmtMoney, fmtIP, displayTrait, teamNick}) {…}
  player()  // 原 buildPlayerViewModel
  career()  // 原 buildCareerViewModel
  ability() // 原 buildAbilityViewModel（含 rehabStatusText）
  traits()  // 原 buildTraitsViewModel
  record()  // 原 buildRecordViewModel（含 statSummary）
}
```

- 本體逐字搬移；只把 `S` 改為每次呼叫時取得的 state、`game.js` 內依賴改為注入值、互相呼叫改為 `this.<method>()`。不得順手修改顯示規則或字串。
- 3 個 import 由新模組直接 import。
- `game.js`：import `CareerPresenter`；`const careerPresenter=new CareerPresenter({getState:()=>S,…})`；5 個 `build*ViewModel` 保留名稱，改為一行委派（例：`function buildPlayerViewModel(){return careerPresenter.player();}`）；刪除 `statSummary`、`rehabStatusText`。
  - 保留名稱的理由：`ui-foundation.test:40`、`trait-display-e2e:18`、`tools/development-b` 不需修改；基準 `097e212` 有同名函式，可用同一段 capture 逐步比對。委派是否拆除留待日後決定。
  - `ui-foundation.test:41` 的 `abilities:POS_AB[S.pos].map` 隨本體移出 `game.js` 而失配：改為比對新模組（測試錨點變更，非期望值變更；實作時確認寫法）。
- 建構時點：`careerPresenter` 須在 `initNavigation` 呼叫前建立；`getState` 為延遲讀取，`S` 重新指派（新生涯）後仍讀到最新值。

### 2g.4 測試變更（harness 變更，非期望值變更，需揭露）

1. `game-view-dom-e2e`：capture 加入每一步的 `buildPlayerViewModel()`、`buildCareerViewModel()`（JSON），與基準逐步比對。基準 `097e212` 有同名函式，兩側使用同一 capture。基準的預設值改為 `097e212` 須另行確認（現行預設 `1bc65df`；本期驗證以 `--baseline=097e212` 指定）。
2. 新增 `tests/career-presenter.test.mjs`：以 vm 從 `097e212` 抽出舊 7 函式，與 `CareerPresenter` 在多組 fixture（P／IF、`ct` 有／無、`annualSchedule` 有／無、`traits`／`removed`、`statsByLevel` 各組織、`incomeLedger`、`rehab`／`skipMid`）上比對輸出（深度相等，含 freeze 狀態）。Full 入口 85→86；同步 `scripts/test-manifest.mjs`（若需）、`scripts/ci-full-batches.test.mjs`、`scripts/TESTING.md`。
3. `ui-foundation.test:41`：錨點改為新模組（見 §2g.3）。

### 2g.5 驗證（L2 / R2）

比較基準：`097e212`（`refactor/legacy-overrides` HEAD）；允許差分：無。

1. harness commit（`game.js` 未修改；只含 §2g.4-1 的 capture 擴充）：`game-view-dom-e2e --baseline=097e212` PASS（含新 capture）。負控制：在 scratchpad 讓現行側的 view model 改變 1 個字元，確認 FAIL。`career-presenter.test` 測試新模組，與實作放在同一 commit。
2. 實作 commit：`check-syntax`；`career-presenter.test`、`ui-foundation.test`、`verify-modularization`、`information-architecture` 等相關單元；`game-view-dom-e2e --baseline=097e212`（8 生涯，每步 DOM／`S`／RNG／view model 一致）；`trait-display-e2e`、`display-preferences-e2e`；Quick。
3. 目視：1280／390 的 player（能力・特性）與 career（契約・成績）畫面、桌面左右欄；Console／404 為 0。
4. PR 前 Full 一次（4 組平行，分組執行，非單一 Full 報告）。
5. reviewer：`097e212..HEAD`。重點：本體逐字搬移、注入完整性、`getState` 延遲讀取、freeze 一致、CRLF（`game.js`）／LF（新模組）。
6. FAIL／BLOCKED／SKIP 分別記錄，不標 PASS。

### 2g.6 交付

- 分支：`refactor/career-presenter`（自 `refactor/legacy-overrides` `097e212` 建立，2026-10-23 使用者批准；疊加分支）。PR #10 與 `refactor/legacy-overrides` 的 PR 須以 merge commit 併入 `dev`；上游若再修改，本分支須合併並重跑 §2g.5-2。
- commit 順序：harness → 實作 → 文件。commit／push 另批。
- 不升 VERSION、不改 CHANGELOG／CURRENT_SPEC（§9.3）。不修改 `main`。

### 2g.7 待決

1. 是否批准依本節實作（commit／push 另批）。
2. `game-view-dom-e2e` 預設基準是否維持 `1bc65df`（本期以參數指定 `097e212`）。

- 使用者決定（2026-10-23）：批准依本節實作；`game-view-dom-e2e` 預設基準維持 `1bc65df`。commit／push 另批。

### 2g.8 實施結果（2026-10-23，本機 macOS，Brave 155＋`--disable-features=BraveFarbling`；對象 `097e212`＋未 commit 變更）

- 實作：新增 `docs/src/ui/career-presenter.js`（LF）。`game.js`（CRLF，2904 → 2903 行）：`:39` 的 `formatRehabStatus` import（改為只由新模組使用）換成 `CareerPresenter` import；`:582` 建立 `careerPresenter`；5 個 `build*ViewModel` 改為一行委派；刪除 `statSummary`、`rehabStatusText`。
- 測試變更：
  - harness：`tests/support/dom-snapshot.mjs` 的 capture 加入 player／career view model。`--baseline=097e212`（`game.js` 未修改）8 生涯 PASS；負控制（現行側 `'契約なし'` 多 1 個空白）在第 0 步偵測 `$.views.career.contract.description`。
  - 新增 `tests/career-presenter.test.mjs`（5 案例）；負控制（presenter 改 1 字）FAIL。
  - 錨點改為新模組（非期望值變更）：`ui-foundation.test:41`（計畫內）；`information-architecture.test`（`formatRehabStatus(S)` 改比對新模組；`スタミナ` 的 `doesNotMatch` 改為 `game+presenter`）、`record-condition-fix.test`（`rehabStatusText` 的 regex 改為私有方法本體；`大きな故障（通算）`）——後兩者為 scout 調查未列、實作時發現。
  - Full 入口 85→86（`ci-full-batches.test` 批次 `[10,11,11,11,10,11,11,11]`、`TESTING.md`）。

| 項目 | 結果 |
|---|---|
| `check-syntax` | PASS（164 檔） |
| 相關單元 | `career-presenter`、`ui-foundation`、`information-architecture`、`record-condition-fix`、`verify-modularization`、`ci-full-batches.test`（31 PASS／1 SKIP） |
| `game-view-dom-e2e --baseline=097e212` | PASS：8 生涯每一步 DOM／`S`／RNG／player・career view model 完全一致 |
| Quick | 66 PASS／0 FAIL／0 SKIP／0 BLOCKED（`record-condition-fix` 修正後） |
| Full | 4 組平行（22／22／22／20），86 入口不重複：85 PASS／1 FAIL（`record-condition-fix`，上記錨點）。修正後該入口單獨與 Quick 重跑 PASS；Full 未重跑 |
| 目視（自動操作＋截圖） | 1280 投手 542 步、390 內野手 543 步至退休畫面，並開啟「選手」「キャリア」分頁；Console 錯誤／pageerror／失敗請求／4xx 皆 0，無橫向捲動；顯示值與 4-A 時相同 |
| reviewer | 無問題（7 個本體逆向替換後與基準逐位元組相同；`S` 每次呼叫重新取得；委派與 callback 的 `this`；注入完整、無 TDZ；改寫錨點同等或更嚴格；fixture 涵蓋各分支；CRLF／LF） |

- `game.js` 行號變動（舊＝`097e212`，2904 → 2903 行）：1–581：0；589–2904：−1（582–588 改寫為 582–587）。

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

- 細部計畫見 §2e（範圍已修正）。以下為原概要。
- 收容 `S`、`careerRng`、`view` 及 `S` 外狀態（`stepQ`、`choiceGeneration`、`activeChoiceToken`、`pendingOffseasonSalary`、`npbReturnOfferContext`、`corpSettlements`、`seasonEndContext`）。
- 先作為容器搬移，不改流程邏輯。

### 3.4 第 4 期：LEGACY 覆寫

- 細部計畫見 §2f（範圍已修正：只做 4-A）。以下為原概要。
- 32 組逐組決定「合併為單一版本」或「`extends` + `super`」；捕獲原函式與讀取新綁定的語意差異需逐組驗證（STAGE5 稽核）。
- 刪除舊定義前需執行期可達性證據；包含檔頭 RNG 舊定義與 `_s`（同時調整 `fixed-seed-v160`）。

## 4. 使用者決定（2026-10-18）

1. 前置 1：D2-G9-RELEASE 殘項未結案，仍可開始第 1 期的本機實作與驗證；重構 PR 併入 `dev` 的時機另行決定。
2. 第 1 期：批准依本文實作。commit／push／PR 仍依 §2.6 另批。
3. 第 1b 期：列入，接在第 1 期之後；開始前另立細部計畫並取得批准。

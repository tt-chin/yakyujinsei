# INT-01：國際賽事出場履歷 實作細部計畫

狀態：**已批准**（使用者 2026-11-20／21）。實作已授權（INT-01 與 INJ-UI-01 分兩個 PR，INT-01 先做）；D1～D5、D7 使用者同意；**D6 版本號留待 code owner 決定**。草稿驗證後依 §8 修正 T 表（使用者 2026-11-21 同意，含取消 T6b）。
上位：`BACKLOG.md` §3.5 INT-01；決定與驗收條件見 `tasks/P2_DISPLAY_DECISIONS_PLAN.md` §5.1（N1＝B、N2＝A）。
調查基準：`origin/dev` `159dbf2b293c6087df6a8f3713a19e6e61ad4a74`（2.0.0，含 PLY-01 PR #105／#106）。原計畫基準 `1494a24`（1.16.10）早於 2.0.0，位置以本文件為準。
分支：自 `origin/dev` 開 `feat/int-01-intl-history`（`--no-track`，push 時明示 refspec）。第 43 期 PR #108 不碰本領域，不需等待。

## 1. 現況（2026-11-20 再盤點，scout 唯讀＋抽查）

- **資料**：實際出場結果只在 `commitInternationalResult` 寫入 `S.intlTraitResults[eventKey]`（`international-trait-policy.js:37-46`），形狀 `{eventKey,year,rank,hadIntlace,basePoints,awardedPoints,injuryAdded,finalReached,unlockedIntlace,personalStats?}`（`:30-36`）。**不存大會名與日期**。選外／負傷／辭退只寫 `intlCompletedKeys`（`international-tournament.js:13-18,31,34,58`）。
- **大會名與時序**：`internationalEvents(year,official)`（`international-selection-policy.js:3`）回傳 `{eventKey,name,startDate,priority}`，官方資料 `JP_DATA.intlEvents`（WBC:2026、P12:2027）優先，否則推算 WBC（2026＋4k，3 月）、P12（2027＋4k，11 月）；`internationalPhase` 以月份 ≤6 判 PRE（`:4`）。沒有 `eventKey`→名稱或排序的既有函式。
- **同年 WBC＋P12 在自然生涯不會發生**（推算公式年份不重疊，官方資料兩屆分屬 2026／2027）；§5.1 的同年排序只能以單元 fixture 驗證。
- **本大會個人成績**：`renderInternationalPersonalStats(personalStats,fmtIP)`（`international-personal-stats.js:16-32`）回傳 HTML 字串，缺值回 `<p>本大会の個人成績：記録なし</p>`；`.intl-personal-stats` 無 CSS 規則。
- **引退畫面**：`career-retirement.js` `endGame`；國際只有「通算成績」卡內的 `intlTable`（`:230-238`，`S.intlCount>0` 才出）與「タイトル・国際大会成績」的榮譽文字。`:238`：`card('','通算成績',jerseyTable(jerseyPeriods?.()||[])+(tables||…)+intlTable);`。建構於 `game.js:239`。
- **「キャリア → 実績」**：`player-detail.js:11-13` `renderCareer` 的 `achievements` 分支只列 `model.achievements`（＝`S.honors` 複本，`career-presenter.js:62`）。每次切分頁或切到 career 主畫面時整個重建（`navigation.js:19,21`）。
- **凍結**：
  - `career-retirement.js`：`ui-redesign-review-e2e:24`（Quick）與 `ce5f732` 逐字比較，僅 `PLY01_CORE` 4 段插入可去除（各須恰好 1 次）。
  - `player-detail.js`：`award-identity-policy.test` 與 `efd4710` 比較，僅 `approvedIncomeEdits` 的逐字 `[before,after]` 依序套用（EVT-01 E3 前例 `:13`）。
  - `international-personal-stats.js`、`international-trait-policy.js`：同測試凍結且無 overlay → **不改**。
  - `career-presenter.js`、`international-selection-policy.js`、新檔：不受凍結。
- **DOM 比較**：`ui-redesign-review-e2e:34,36`（引退 S／RNG 與 `#log` 原節點全保留）、`dom-snapshot`（`game-view-dom-e2e`，`views.career` 全比較，`incomeRows`／`events` 以「檢查後刪除」核准，`:102-124`）、`display-preferences-e2e:190`（受測版 log 去除 `.intl-personal-stats`）、`design-tokens-09-e2e:95,135-138`（実績分頁元素數須與舊版相同）。
- **CSS 計數**：`design-tokens-06.test` `var(--fs-*)` 81、`var(--space-*)` 236、margin/padding/gap 的 px 字面值只許 `KEEP_PX`；`display-preferences.test` 顏色 token 57／17。`.card h4.intl-heading` 已存在（`base.css:189`）。
- **規格衝突**：`CURRENT_SPEC.md:599`（§15.1）「大会別履歴一覧…は追加しない」。

## 2. 決定事項

| # | 事項 | 決定 |
|---|---|---|
| D1 | 引退畫面接法 | 核准插入清單 `INT01_CORE`（同 PLY-01 方式），放在「通算成績」卡的 `intlTable` 之後 |
| D2 | 程式位置 | 新模組 `docs/src/ui/international-history.js` |
| D3 | 列的形式 | 每屆一個 `<details>`，`summary`＝「年 大會名　名次」，展開為本大會個人成績；預設收合 |
| D4 | 日文標題 | 「国際大会出場履歴」；查不到大會名時「国際大会」 |
| D5 | CSS | 沿用既有 class，新規則最少；動到計數時依前例更新並加註 |
| D6 | 版本 | **code owner 決定**（dev 為 2.0.0，PLY-01 的 T9 未決）。實作 commit 不動版本；決定後另一 commit 更新 `config.js`、`CHANGELOG.md`、`RELEASE_NOTES.md`、生成檔、`CURRENT_SPEC.md` 標頭 |
| D7 | 規格 | `CURRENT_SPEC.md` §15.1 自「追加しない」移除「大会別履歴一覧」，並在 §15 補現行顯示規格 |

## 3. 設計

### 3.1 `docs/src/ui/international-history.js`（新檔）

```js
import { internationalEvents, internationalPhase } from '../engine/international-selection-policy.js';
import { JP_DATA } from '../data/jp-data.js';
import { renderInternationalPersonalStats } from './international-personal-stats.js';
import { fmtIP } from './stat-format.js';

export function buildInternationalHistory(state, officialEvents = JP_DATA.intlEvents) // → frozen rows
export function internationalHistoryHTML(rows)       // 引退卡用 HTML 字串；rows 空 → ''
export function appendInternationalHistory(container, rows) // 実績分頁 DOM；rows 空 → 不加任何節點
```

- **列**：`Object.freeze({eventKey, year, name, rank, personalStats})`。只取 `S.intlTraitResults` 中 `eventKey` 為字串、`year` 為整數的紀錄（N2＝A，不讀 `intlCompletedKeys`、不推測未出場原因）；`personalStats` 原樣保留（缺少為 `null`）。
- **名稱與時序**：`internationalEvents(row.year, officialEvents).find(e=>e.eventKey===row.eventKey)`；找到時取 `name`、`startDate`、`priority`，找不到時名稱「国際大会」、時序排在同年已知大會之後。
- **排序**：年 → `startDate` → `priority` → `eventKey`（同年 WBC（PRE，3 月）必在 P12（POST，11 月）之前）。
- **不改狀態、不消耗 RNG**：只讀 `state`；不呼叫 `R`／`ri`／`pick`／`chance`。
- **HTML**（引退卡）：`<section class="intl-history" data-intl-history><h4 class="intl-heading">国際大会出場履歴</h4>` ＋ 每列 `<details class="intl-history-item"><summary>${year} ${name}　${rank}</summary>${renderInternationalPersonalStats(personalStats,fmtIP)}</details>` ＋ `</section>`。
- **DOM**（実績分頁）：`<section class="ui-panel intl-history" data-intl-history><h2>国際大会出場履歴</h2>` ＋ 同樣的 `<details>` 列（個人成績部分以 `renderInternationalPersonalStats` 的字串設 `innerHTML`，內容只有固定文字與數字）。

### 3.2 引退畫面（`career-retirement.js`，`INT01_CORE` 兩段插入）

| # | 原文 | 改後 |
|---|---|---|
| R1 | `rules({getState,jerseyPeriods,jerseyRetired,getSeed,…` | `…jerseyPeriods,jerseyRetired,intlHistory,getSeed,…`（插入字串 `intlHistory,`） |
| R2 | `…+(tables\|\|'<p>（プロレベルの試合実績なし）</p>')+intlTable);` | `…+intlTable+(intlHistory?.()\|\|''));`（插入字串 `+(intlHistory?.()\|\|'')`） |

- `intlHistory` 為可選：未傳入的 harness（`retirement-hof-balance.test` 等）與舊版 `game.js` 混用時輸出空字串。
- `game.js:239` 建構參數追加 `intlHistory:()=>internationalHistoryHTML(buildInternationalHistory(S))`，並 import 新模組（`game.js` 在 `allowedB`）。
- 引退時 0 屆 → 不輸出任何節點。

### 3.3 実績分頁

- `career-presenter.js` `career()` 回傳追加 `international:buildInternationalHistory(S)`（import 新模組）。
- `player-detail.js`（`approvedIncomeEdits` 追加 2 組）：
  - P1：`"import { appendYearEvents } from './career-event-history.js';\n"` → 其後加 `"import { appendInternationalHistory } from './international-history.js';\n"`。
  - P2：`"section.appendChild(list(model.achievements)); container.appendChild(section); return;"` → `"section.appendChild(list(model.achievements)); container.appendChild(section); appendInternationalHistory(container,model.international); return;"`。
- 0 屆時不加節點（`design-tokens-09-e2e` 元素數不變）。

### 3.4 CSS

- 只加 `.intl-history-item>summary{cursor:pointer}`（不用 fs／space token，不動計數）。若 PC／手機確認需要間距，再加 `var(--space-*)` 並更新 `design-tokens-06.test` 計數與註解（另列 T6b）。不新增顏色 token。

### 3.5 規格

- `CURRENT_SPEC.md:599`：自「…は追加しない」列表刪除「大会別履歴一覧、」。
- §15 新增一條：引退畫面「通算成績」與「キャリア → 実績」顯示實際出場的國際大會（年、大會名、名次；本大會個人成績展開查看；舊結果無個人成績顯示「記録なし」；不列未出場、不推測原因；分享圖不擴充）。

## 4. 變更檔案

| 檔案 | 內容 |
|---|---|
| `docs/src/ui/international-history.js` | 新檔（§3.1） |
| `docs/src/engine/career-retirement.js` | R1、R2 |
| `docs/src/engine/game.js` | import、`intlHistory` lambda |
| `docs/src/ui/career-presenter.js` | import、`career().international` |
| `docs/src/ui/player-detail.js` | P1、P2 |
| `docs/styles/<既有檔>` | §3.4 一條規則（檔案於草稿時選定） |
| 測試 | §5 |
| `CURRENT_SPEC.md`、`BACKLOG.md`、`scripts/TESTING.md` | §3.5、INT-01 進度、新測試入口 |
| 版本相關 | D6 決定後另一 commit |

## 5. 測試（T 表）

| # | 檔案 | 變更 | 理由 |
|---|---|---|---|
| T1 | `tests/international-history.test.mjs`（新，Quick） | 0 屆 → `[]`／`''`／不加節點；舊結果無 `personalStats` → 「記録なし」；同年 WBC＋P12（fixture 官方資料）PRE 先於 POST；跨年排序；未知 `eventKey` →「国際大会」；非紀錄值略過；列凍結；`state` 前後 deepEqual；`<details>` 無 `open`；模組文字不含 RNG 呼叫 | §5.1 驗收；同年排序只能在此驗 |
| T2 | `tests/ui-redesign-review-e2e.mjs` | 新增 `INT01_CORE`（R1、R2 各恰好 1 次）並與 `PLY01_CORE` 依序去除（§8：`:36` 不需投影） | 核准插入 |
| T3 | `tests/award-identity-policy.test.mjs` | `approvedIncomeEdits["docs/src/ui/player-detail.js"]` 追加 P1、P2 | 核准修改 |
| T4 | `tests/career-presenter.test.mjs` | `expected.career.international` 覆寫（各 fixture 獨立寫出預期列） | `career()` 新欄位 |
| T5 | `tests/support/dom-snapshot.mjs` | `views.career.international` 對 `rawState.intlTraitResults` 檢查（筆數、`eventKey` 集合、順序）後刪除；引退步驟受測版去除 `[data-intl-history]` 並計數 | 同 E3／PLY-01 前例 |
| T6 | `tests/game-view-dom-e2e.mjs` | 受測版注入 `window.__expectIntlHistory=true;`（§8；其他 E2E 不改） | 啟用 T5 的檢查 |
| T6b | — | **取消**（§8） | — |
| T7 | `tests/international-history-e2e.mjs`（新，Quick，預估 ≤40 s） | fixture 狀態（2 屆：1 屆有個人成績、1 屆無）：実績分頁顯示、展開／收合、1280／390 px 無水平溢出、4 主題；`endGame` 後「通算成績」卡內有區塊且位於国際大会通算表之後；0 屆時実績與引退皆無區塊；查看與展開前後 S／RNG 計數不變 | §5.1 驗收、PC／手機 |
| T8 | `scripts/test-manifest.mjs`、`scripts/TESTING.md` | 登錄 T1、T7 | 新入口 |

### 5.1 負控制（scratch，替換 1 次、還原後 sha 相同）

- 排序反轉 → T1；`personalStats` 缺值改補零 → T1；未知名稱 fallback 拿掉 → T1。
- R2 插入兩次 → T2 `insertion once`；投影不去除區塊 → T2 `:36`。
- P2 改字 → T3；`career().international` 少一列 → T4／T5。
- 0 屆時仍輸出空 section → T7（與 `design-tokens-09-e2e` 元素數）。
- 每個負控制須以預定的斷言 FAIL（看 `ERR_ASSERTION` 與結束碼，不看標籤字串）。

## 6. 分類與驗證

- **R2 純顯示例外**：只讀既有存檔資料，不改狀態、規則、RNG、事件順序；分享圖不變。
- 步驟：
  1. scratchpad 草稿 → Quick 全部＋與引退／実績 DOM 相關的 E2E（`game-view-dom-e2e`、`display-preferences-e2e`、`design-tokens-09-e2e`、`hof-retirement-policy-e2e`、`championship-intl-e2e`、`international-personal-stats-e2e`）實跑，確定 T6 範圍後回報。
  2. 正式分支實作、commit；Quick；上列 E2E；T7 的 PC／手機截圖確認。
  3. 負控制 §5.1。
  4. reviewer（傳 diff）。
  5. push、PR → dev（PR 內文繁體中文）。
- **Full**：依 R2 純顯示例外不一律追加；如草稿出現 Full 限定入口的關聯 FAIL，記錄理由後請使用者於 GitHub 手動執行。
- 不做：分享圖、未出場列、原因欄位、`international-personal-stats.js` 的任何修改。

## 7. 未決

- D6 版本號（code owner）。

## 8. 草稿驗證與 T 表修正（2026-11-21）

草稿：scratchpad worktree，先以 `159dbf2`、PR #108 併入後改以 `b7fea0a` 為基準；macOS＋Brave 157 本機證據，runner 基準 `origin/main` `d6cef67`。本機不跑 Full（AGENTS §6.2）。

- **只改產品、不改測試的 Quick**（`159dbf2`）：100 PASS／3 FAIL，FAIL 恰為 `award-identity-policy.test`、`career-presenter.test`、`ui-redesign-review-e2e`（＝T3、T4、T2），無計畫外耦合。
- **相關 E2E 11 個**（`ui-redesign-review-e2e` 完整模式、`game-view-dom-e2e`、`display-preferences-e2e`、`design-tokens-09-e2e`、`hof-retirement-policy-e2e`、`championship-intl-e2e --ui-only`、`jersey-e2e`、`income-display-e2e`、`design-tokens-07-e2e`、`event-history-e2e`、`international-personal-stats-e2e`）：只有 `game-view-dom-e2e` FAIL（第 0 步 `$.views.career.international: [] -> "<missing>"`），其餘 PASS。
- **引退區塊的到達**：`game-view-dom-e2e` 的 jp3-pitcher-02（P、balanced）於 2048 年引退時有 1 筆國際結果（2039 WBSCプレミア12 ベスト4），1280／390 兩個寬度都經過引退 `#log` 投影（拿掉投影即在第 373 步 FAIL）。`ui-redesign-review-e2e`、`display-preferences-e2e` 的生涯引退時沒有國際結果。
- **T 表修正**：
  - T2：只加 `INT01_CORE`（與 `PLY01_CORE` 合併依序去除，各恰好 1 次）；`:36` 不加投影（該測試的引退無國際結果）。
  - T5：`career().international` 檢查後刪除（筆數、`eventKey` 不重複、保存的 `rank`／`personalStats`、年份遞增），以及受測版旗標 `window.__expectIntlHistory` 下的引退 `#log` 投影（`通算成績` 卡、緊接 `国際大会通算` 表之後、`h4` 文字、列數＝結果數、每列收合且以年份開頭；驗證後移除）。投影放在 `const snapshot=` 之前，位於 tokens-06 投影之後（`h4.intl-heading` 已由 tokens-06 投影還原為舊 inline style，按文字判定）。
  - T6：只在 `game-view-dom-e2e.mjs` 的受測版注入字串加 `window.__expectIntlHistory=true;`；其他 E2E 不改。
  - T6b：**取消**。實測（1280 px）有內容時 `.ui-list li`、`.intl-history-item>summary`、個人成績行皆為 15px；先前看到較小的是空白提示 `.ui-empty`（`--fs-md`，13px）。CSS 只保留 §3.4 的 `cursor:pointer`，`design-tokens-06` 計數不變。
  - T7 實際約 4 s，manifest `quick:[]`、`seconds:10`。
- **`b7fea0a` 上的結果**：Quick 107／107 PASS（含 T1、T7）；相關 E2E 11／11 PASS（`game-view-dom-e2e` 於引退投影補回後重跑 PASS）。
- **負控制 10／10**（scratch，每次替換 1 處、跑後還原並比對 sha256）：排序反轉、缺 `personalStats` 補零、未知名稱 fallback → T1；R2 插入兩次 → T2 `insertion once`；P2 改字 → T3；0 屆仍輸出 section／panel → T7；`career().international` 少一列 → T5 `INTL_HISTORY_VIEW_ROWS`；引退列預設展開 → T5 `INTL_HISTORY_BLOCK_ROWS`；區塊放在國際通算表之前 → T7。
- 截圖（OS temp `yakyujinsei-international-history-e2e/`）：1280／390 px、4 主題，引退卡與実績分頁版面正常，無水平溢出。

## 9. 正式實作（2026-11-21）

- 分支 `feat/int-01-intl-history`（自 dev `b7fea0a`）：`a3f1f89`（第 43 期合併紀錄，使用者指定併入本分支）、`face9ff`（本計畫）、`8477d35`（實作＋測試，與草稿逐 byte 相同）、`00bbd33`（reviewer 後續）、文件 commit（CURRENT_SPEC §15.1／§15.4、BACKLOG、P2 計畫狀態）。
- `8477d35`：乾淨 worktree Quick 107／107 PASS、`game-view-dom-e2e` PASS。
- reviewer（`b7fea0a..8477d35`）：無 medium 以上；low 6 項。採納 1～4：列內 `personalStats` 改為深層凍結的複本；結果只在 `eventKey` 等於字典 key 時列出（同 `normalizeInternationalState`，`dom-snapshot` 同規則）；T7 無國際結果的引退先斷言「通算成績」卡恰 1 張；引退投影每列 summary 與 `career().international` 全字比對。5（`__expectIntlHistory` 寫死）不改，與 `__expectBrowserSave`／`__expectIncomeDisplay` 同模式且 manifest 不轉送 `--baseline`。6 記於 `scripts/TESTING.md`（`display-preferences-e2e` 以 `--only-seed` 的兩個種子引退時無國際結果，改種子前須加投影）。
- `00bbd33`：負控制 NC11（回傳存檔物件）、NC12（拿掉 key 規則）→ T1；NC13（引退列文字與 view 不一致）→ `game-view-dom-e2e` `INTL_HISTORY_BLOCK_ROWS`，3／3 攔下（合計 13／13）；乾淨 worktree Quick 107／107 PASS、`game-view-dom-e2e` PASS（8 段生涯）。
- 交付（2026-11-21）：分支 `feat/int-01-intl-history`（`e954058`）已 push，[PR #109](https://github.com/tt-chin/yakyujinsei/pull/109)（→ dev）已開，內文以 API 讀回與草稿一致。PR → dev 不觸發 CI。
- 合併（2026-11-21）：PR #109 併入 dev（merge `8a4f765`）；dev push Quick [Run44826320163](https://github.com/tt-chin/yakyujinsei/actions/runs/44826320163) success（`tests` job 成功、Full 三個 job skipped；個別入口數未從 log 核對）。
- 未做：版本 commit（D6，code owner）、Preview、實機。Full 依 R2 純顯示例外不一律追加；如需要，由使用者於 GitHub 手動執行。

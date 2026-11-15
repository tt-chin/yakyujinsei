# EVT-01 E3：年度事件履歷 實作計畫（2026-11-15使用者批准並授權實作）

上位：`BACKLOG.md` EVT-01；決定來源：[顯示計畫](P2_DISPLAY_DECISIONS_PLAN.md) §5.2（E3＝a，code owner 2026-11-15 06:53）。
基底：dev `712d613`（PR #97 E1＋E2 1.16.11 與 PR #98 已併入）；本分支 `feat/evt-01-year-history`，PR 以 dev 為 base。
分類：R2 純顯示例外（既有資料唯讀、不改狀態／RNG／事件抽選），PATCH **1.16.12**。

## 1. 使用者決定（2026-11-15）

| ID | 決定 |
|---|---|
| D1 | 折疊區**只放有事件的年度**：該年度最後一個 `S.log` 列的正下方加一列（橫跨4欄、預設收合）。無事件年度不加列 |
| D2 | 未對應任何 `S.log` 年度的事件（本季進行中）放在表末「今季（進行中）」折疊區 |
| D3 | 疊在 PR #97 上，1.16.12 |

## 2. 顯示規格

- 摘要：`イベント（N件）`；`<details>` 預設收合。
- 展開後每筆一行，依 `eventOccurrenceID` 的序號（`年:序號:cardID`）排序，**不以 cardID 去重**：
  - `eventCategoryBadge(result.category)`＋卡名（`cardID`→`EVENTS`的`n`）
  - 結果：`勝負／通常／安全`＋`成功／失敗`（沿用結果卡 `season-events.js:40` 的文字）
  - 效果（有值才列）：`能力名：±N`（`abilityDelta`≠0）、`今季成績点±N`（`statDelta`）、`スポンサー収入：…`（`incomeYen`）、`今季の故障リスク加算+N ポイント（故障確定ではありません）`（`injuryAdded`；不寫成受傷）
- 分類、成敗、效果一律用 `processedEventIDs` 內**當時保存的值**，不依目前特性／階段重算（HS／U／CORP 的 encounter→training 保存值照實顯示）。
- 缺資料：`processedEventIDs` 不是物件（舊／壞資料）時，表格上方顯示一行「イベント詳細記録なし」，不顯示成「沒有事件」；單筆找不到卡名時顯示「不明なイベント（ID n）」；欄位缺損的單筆顯示「詳細記録なし」，不刪除該筆。`year` 無法解析或不對應任何 `S.log` 年度的筆數一律歸入「今季（進行中）」區（不丟棄；使用者決定2026-11-15）。

## 3. 檔案與介面

| 檔案 | 變更 |
|---|---|
| `docs/src/ui/career-event-history.js`（新） | 純函式 `buildEventHistory(state,yearly,{events,abilityLabels,fmtMoney})` → 凍結的 `{status:'ok'|'missing', afterRow:{列index:items[]}, current:items[]}`；DOM 函式 `appendYearEvents(tbody,history,at)`（`at`＝列 index 或 `'current'`）插入 `<tr class="ui-yearly-events">`，缺資料提示插在表首。不寫狀態、不用 RNG |
| `docs/src/ui/career-presenter.js` | `career()` 的回傳加 `events`（呼叫上述 builder）；`yearly` 不變 |
| `docs/src/ui/player-detail.js`（凍結檔） | 4 處逐字改動（見 §3.1） |
| `tests/award-identity-policy.test.mjs` | 見 T1 |
| `docs/styles/ui-navigation.css` | `.ui-yearly-events` 的換行／內距（表格為 `width:max-content`，展開內容須 `white-space:normal` 並限制寬度，避免 390px 表格被撐寬） |
| `docs/src/config.js`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`docs/src/data/release-notes.js`（`node scripts/update-release-notes.mjs`）、`CURRENT_SPEC.md` 頁首 | 1.16.12 |
| `CURRENT_SPEC.md` | キャリア年度別加上事件履歷的描述 |
| `BACKLOG.md` | EVT-01 E3 狀態 |

## 3.1 草稿中確定的細節（2026-11-15，scratchpad 草稿，基準 dev `712d613`）

- 效果文字去掉「今季」：結果卡寫「今季成績点」「今季の故障リスク加算」，履歷裡是過去年度，改為「成績点±N」「能力80の超過分：成績点+N」「故障リスク加算+Nポイント（故障確定ではありません）」。E2E 斷言履歷行不含「今季」。
- `player-detail.js` 4 處逐字改動：import；年度表為空但有今季事件或資料缺失時仍畫表（第一季尚無 `S.log` 列）；`forEach((row,i)=>`；列後與表末呼叫 `appendYearEvents`。
- 年度表本來就比 390px 寬（「成績」欄長，`.ui-yearly-scroll` 橫捲）。展開的事件區改為 sticky、寬度＝捲動框（`.ui-yearly-scroll` 加 `container-type:inline-size`，`details` 用 `100cqi`），橫捲時事件文字仍在可見範圍內換行。實測 390px：表 801px／框 332px，事件區 324px；1280px：570／502，494px。
- `career()` 的 `yearly` 陣列維持原本不 freeze（presenter 舊版比較測試檢查 freeze 形狀）。

## 4. 測試計畫

- 新單元 `tests/career-event-history.test.mjs`：同卡多次、無事件年度（不出列）、`processedEventIDs` 非物件（missing）、未知 cardID、欄位缺損、保存的 category 不重算、今季／年度不明歸類、排序、`injuryAdded` 文字不含受傷。各加負控制（改排序／去重／重算 category 須 FAIL）。
- 新 E2E `tests/event-history-e2e.mjs`：實際生涯到有事件的年度，1280／390 展開／收合、今季列、4主題截圖；console／404 檢查；manifest 登錄。
- 已知會受影響（實作前以草稿確認並列入 T 表）：`award-identity-policy`（凍結例外）、`design-tokens-06`／`display-preferences` 的 CSS 清點數、`design-tokens-09-e2e`／`display-preferences-e2e` 的 `#career-content` 幾何、`game-view-dom-e2e`／dom-snapshot 是否擷取年度表。
### T 表（草稿 Quick＋4組 Full 已跑）

草稿未改測試的 Quick：91 PASS／3 FAIL，即下列 T1～T3；套用 T1～T5 後 Quick 96／96 PASS。4組本機 Full（macOS＋Brave，基準 dev `712d613`）：規劃 126 入口、實際執行 126，125 PASS／1 FAIL＝`game-view-dom-e2e`（`$.views.career.events` 為新增欄位，基準 `4f39a73` 沒有）→ T6；套用後 `game-view-dom-e2e`、`display-preferences-e2e`（同用 dom-snapshot）重跑 2／2 PASS。負控制：把事件序號排序反轉，`game-view-dom-e2e` 以 `EVENT_HISTORY_CONTRACT` exit 1（已還原，shasum 一致）。

| T | 檔案 | 原因 | 變更 |
|---|---|---|---|
| T1 | `tests/award-identity-policy.test.mjs` | `player-detail.js` 凍結 | 在 `approvedIncomeEdits` 下一行 `push` 4 組逐字 before/after（附 E3 註解）；其他凍結斷言不變 |
| T2 | `tests/career-presenter.test.mjs` | `career()` 新增 `events` | 舊版 oracle 加上唯一准許差異 `events`＝凍結的 `{status:'missing',afterRow:{},current:[]}`（fixture 無 `processedEventIDs`）；其餘欄位仍逐項比較 |
| T3 | `tests/design-tokens-06.test.mjs` | `var(--space-*)` 使用數 | 174→179（E3 新增 5 處），更新註解 |
| T4 | `tests/career-event-history.test.mjs`（新） | 單元 | 9 案例（見下） |
| T5 | `tests/event-history-e2e.mjs`（新）＋`scripts/test-manifest.mjs` | E2E | `quick:[]`、40 秒；實際生涯 1280／390：第一季只有今季列、3 年後各年事件列與今季列、每筆順序／保存分類／卡名／成敗、預設收合、展開／收合、事件區在捲動框內（scrollLeft 0 與最右）、4 主題、無橫向溢出、console／404 為 0 |
| T6 | `tests/support/dom-snapshot.mjs` | `captureGameView` 的 `views.career` 多了 `events` | 比照 1.13.4 `incomeRows` 先例：候選側有 `events` 時，先依 `S.processedEventIDs` 與 `S.log` 獨立核對（status、每筆恰一次、所在年度列或今季、序號順序、保存分類），再刪除該欄；S、RNG、其他 view 欄位與 DOM 仍逐位元比較 |

實作時另做負控制：E2E 的捲動框斷言（拿掉 sticky 寬度須 FAIL）、單元的去重／排序／重算分類各一。

reviewer（2026-11-15）後追加：T2 另加一案例，以帶收入／能力效果的 `processedEventIDs` 檢查 presenter 傳入的 `ABL` 與 `fmtMoney`；T5 追加能力名與收入格式斷言（至少一筆能力效果），以及在真實 DOM 中檢查 `processedEventIDs` 不可讀時只在表首出現一列「イベント詳細記録なし」（4種壞值）。缺資料提示由表末改為表首（符合 §2）。

實際負控制（全部 FAIL 後還原，shasum 一致）：單元排序反轉／同卡去重／重算分類 3 項 `ERR_ASSERTION`；E2E 拿掉 sticky 寬度以「event list inside the scroll box」FAIL；dom-snapshot 契約在排序反轉下以 `EVENT_HISTORY_CONTRACT` FAIL；presenter 拿掉 `abilityLabels`／`fmtMoney` 各以 `ERR_ASSERTION` FAIL。

耦合掃描（`grep -rlE 'player-detail|career-presenter|ui-navigation\.css|ui-yearly'` 於 tests／scripts／tools）：18 檔。runner 登錄的單元已由 Quick 涵蓋，E2E（design-tokens-02／09、npb-return、salary-history）由草稿 Full 判定。未登錄的 `scripts/test-championmaker-tj.mjs` 在乾淨 dev `712d613` 即 exit 1（`engine/browser-save-codec.js unexpected championmaker consumer`），與 E3 無關，不修；`scripts/test-ui-desktop-acceptance.mjs`、`tools/development-b/runtime.mjs` 為歷史驗收工具，不在 runner。

- 流程：scratchpad 草稿 → 耦合掃描（grep＋AST，涵蓋約17個引用 yearly／career-content 的測試）→ 草稿上跑 Quick 與 4 組 Full → 補 T 表請批准 → 正式實作 → Quick＋相關 E2E → reviewer → 本機 Full。

## 5. 不做

- 不改事件抽選、`processedEventIDs` 結構、存檔契約、結果卡。
- 不新增分頁（E3＝b 未採用）、不加到引退畫面／分享 PNG。

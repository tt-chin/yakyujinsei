# PLY-01 背號履歷：細部計畫（草案，W1～W6 已決定；W7、W8 待 code owner 決定）

狀態：**D1～D4 已定（使用者 2026-11-15）；W1～W6 已由 code owner 決定（2026-11-15，PR #95 留言）；新增 W7（規格衝突）、W8（選號步驟位置）待 code owner 決定；未授權實作。** Code owner 留言明示「不代表授權立即實作、合併或部署」。
上位規格：[殿堂評價與背號履歷：已批准、待實作規格](HOF_JERSEY_APPROVED_SPEC.md) §4（PLY-01）、§5（PLY-02 永久欠番，不在本計畫範圍）。
調查基準：`origin/dev` `1494a24`（1.16.10）。示意圖：`tasks/ply-01/`（以 seed `hof111-pilot-04`、內野手、固定名「山田太郎」的真實生涯為底，只在瀏覽器內插入 DOM，非實作畫面）。

## 1. 現況（2026-11-15 調查）

- **沒有任何背號資料或邏輯。** `docs/src` 內僅有事件卡來源名「育成背號的期限」（`event-cards-jp.js:46`，僅中繼資料）與退休文字「永久欠番待ったなし」（`career-retirement.js:310`，僅顯示）。
- **球團主檔** `JP_DATA.teams`（`docs/src/data/jp-data.js`）：`{teamId, org, league, order, name, region, strength, color, active}`；NPB 12、KBO 10、CPBL 6、MLB 30、CORP 16、IND 16。**沒有禁用號碼欄位。**
- **入團路徑**：職業球團幾乎都經 `signTo(org, lv, teamId, …)`（`career-contract.js:232`）。呼叫點：`amateur-career.js:37／57`、`season-phases.js:86`、`career-movement.js:116／119／123／161／188／210／235`、`career-contract.js:43`、`game.js:200／324／349`（後三者細部實作時逐一確認是否為現行路徑）。例外：
  - 隊內交易 `doTradeExec`（`career-contract.js:240`）只改 `S.ct.teamId` 與 `S.orgTeamId`，不經 `signTo`。
  - 自由契約後轉業餘（`career-movement.js:236`）直接改 `S.stage／S.lv／S.org／S.orgTeamId`。
  - MiLB 升 MLB（A3→MLB）為同一 `teamId` 內的級別變化。
- **年度履歷** `S.log` 每季一筆 `{y, age, tm, p, line, inj, st}`（`professional-season.js:83`），`tm` 為顯示用球團名字串，沒有 `teamId`。
- **存檔**：`browser-save-codec.js:59` 對 `SAVE_STATE_CONTRACT.required` 的每個欄位檢查存在，缺少即 `SAVE_MISSING_FIELD`；讀檔時沒有遷移步驟。新欄位若列為必填，1.16.10 以前的存檔將無法讀取。
- **選擇 UI**：`choose()`（`docs/src/ui/choice-prompt.js`）不消耗 RNG；RNG 只在點選後的動作中抽取。

## 2. 已決定事項（使用者 2026-11-15）

| # | 事項 | 決定 |
|---|---|---|
| D1 | 預設號碼 | 依守備位置的**固定候選順序**，取第一個未被禁用的號碼。不抽 RNG、不依 seed 變化。具體候選表見 W3 |
| D2 | 禁號資料來源 | **空清單**。規格禁止虛構現實禁號資料；因此轉隊時一律沿用舊號。禁號留待 PLY-02 永久欠番接入 |
| D3 | 同年多次改號 | **只增不改的紀錄**：每次入團／改號追加一筆（球團、生效年度、號碼），同年多筆依追加順序保留；顯示時同一年取最後一筆。不覆寫過去年度 |
| D4 | 舊存檔 | 過去年度顯示「不明」；自載入後**第一個賽季**起，為當時所屬球團補上預設號碼（生效年度＝該季）。不補造之前的歷史 |

### Code owner 決定（2026-11-15，PR #95 留言）

| # | 事項 | 決定 |
|---|---|---|
| W1 | 改號入口 | **B**：入團時增加選號步驟 |
| W2 | 顯示位置 | **a、b、c、d**。a 生涯面板顯示背號，且面板的選單按鈕**不顯示「メニュー」文字，只顯示 ☰**；b 每季成績卡；c 退休卡背號履歷；d キャリア → 年度別。e 分享圖**不做** |
| W3 | 預設候選順序 | 照 §3 草案 |
| W4 | 生效時點與紀錄觸發 | 照 §3 草案 |
| W5 | 狀態欄位 | 照 §3 草案：可選欄位 `S.jerseyHistory: [{teamId, year, number}]`，`number` 為字串，不列為舊存檔必填 |
| W6 | 適用球團 | **A**：NPB、KBO、CPBL、MiLB／MLB，不含 IND／CORP |

## 3. 原選項（W1～W6 已決定，保留供參照）

### W1 改號入口

| 選項 | 內容 | 示意圖 | 影響 |
|---|---|---|---|
| **A（建議）** | 右上「メニュー」新增「背番号変更」，開啟對話框選號；不進主流程 | `W1A-menu-390.png`、`W1A-dialog-390.png` | 主流程點擊步數不變，既有逐步 E2E 基準不位移。取消／關閉不留紀錄、不產生副作用（規格 §4） |
| B | 每次入團時多一步選擇：「背番号 6 で入団する／背番号を選ぶ」 | `W1B-act-390.png` | 每個入團都多一步，`game-view-dom-e2e` 等逐步比較與所有生涯驅動程式（含 `retirement-hof-pilot`）的步數全部位移，需逐一更新基準 |
| C | A＋B 併用 | — | 同 B |

A 的改號限制（建議）：只在生涯進行中、所屬職業球團時可用；生效年度＝目前年度；同一年可多次改號（依 D3 全數保留）。

### W2 顯示位置（可複選）

| 選項 | 位置 | 示意圖（改前／改後） | 備註 |
|---|---|---|---|
| **a（建議）** | 生涯面板姓名前加 `#6` | `board-390-old.png`／`board-390-W2a.png`、`board-1280-old.png`／`board-1280-W2a.png` | 390px 時姓名截斷變多（「山田太郎…」），守備位置被擠掉 |
| b | 「シーズン成績」卡的球團標籤後加 `· #6` | `season-390-W2b.png` | 每季一張卡，資訊重複 |
| **c（建議）** | 退休卡「通算成績」上方加「背番号」表（球團／期間／號碼） | `retire-390-old.png`／`retire-390-W2c.png` | 示意資料：橫濱 2029–2037 #6 → 同隊 2038 改 #7 → 轉隊台北、台中沿用 #7 |
| **d（建議）** | 「キャリア → 年度別」所屬欄後加號碼 | `career-yearly-390-old.png`／`career-yearly-390-W2d.png` | 業餘年度不顯示；390px 成績欄本已截斷，號碼加在所屬欄內不新增欄位 |
| e | 分享圖 | 無（canvas） | 建議不在本期；需另做像素比較 |

### W3 各守備位置的預設候選順序（D1 的具體表）

草案（取第一個未被禁用者；D2 為空清單時即為第一個號碼）：

| 守備位置 | 候選順序（草案） |
|---|---|
| 投手 | 18, 11, 14, 15, 16, 17, 19, 20, 21, 13 … |
| 捕手 | 27, 2, 22, 10, 12, 32 … |
| 內野手 | 6, 5, 7, 4, 3, 8, 1, 9, 0, 00 … |
| 外野手 | 1, 8, 9, 51, 7, 23, 24, 31 … |

注意：D1＋D2 合起來，同守備位置的新生涯預設號碼都相同（例如內野手都是 #6），差異只來自玩家改號。若要依入團方式（指名順位、育成等）區分，屬於變更 D1，需另行決定。規格限定「0」「00」「1」～「99」，育成也不用三位數號碼。

### W4 生效時點與紀錄觸發

建議：入團（`signTo` 且 `teamId` 改變）、隊內交易（`doTradeExec`）各追加一筆，號碼沿用（D2）；同一 `teamId` 內的級別變化（一軍／二軍／育成、A3→MLB）與同隊續約不追加。

### W5 狀態欄位

草案：`S.jerseyHistory: [{teamId, year, number}]`（`number` 為字串，「0」與「00」不同，不以 Number 正規化）。目前號碼＝最後一筆。新欄位**不列入** `SAVE_STATE_CONTRACT.required`（舊存檔可讀）；`types` 以陣列登記。

### W6 適用的球團範圍

| 選項 | 範圍 |
|---|---|
| **A（建議）** | 職業：NPB、KBO、CPBL、MiLB／MLB |
| B | A＋獨立聯盟（IND）＋社會人（CORP） |

### 新待決事項（W7、W8；2026-11-15 依 W1＝B 整理）

#### W7 同球團主動改號（規格衝突）

`HOF_JERSEY_APPROVED_SPEC.md` §4 寫「允許同球團主動改號」，但 W1＝B 只在入團時提供選號，留在同一球團期間沒有改號入口。依 AGENTS §1 不自行補足，請 code owner 選擇：

| 選項 | 內容 | 影響 |
|---|---|---|
| ① | B＋同球團續約時也提供選號（「背番号 X のまま／背番号を変更する」） | 續約畫面多一步，逐步比較的位移範圍再擴大 |
| ② | 改為 C（B＋選單內的改號入口，即原 W1＝A 的對話框） | 主流程只在入團時多一步；選單多一個項目，`#board-menu-panel` 的 DOM 改變 |
| ③ | 只在入團時選號，不提供同球團改號 | **須修改已批准規格 §4**（刪除同球團主動改號），另行批准 |

#### W8 選號步驟的插入位置（實作設計）

`signTo` 有 13 個以上呼叫點，多數在選項回呼中呼叫後立刻接著顯示下一個選擇（例如 `support/stage6-browser.mjs:32` 的「契約を受諾」→「契約後」）。若在 `signTo` 內部顯示選號，會被呼叫端隨後的 `choose()` 蓋掉。

| 選項 | 內容 | 影響 |
|---|---|---|
| **甲（建議）** | 集中一處：所屬職業球團與 `S.jerseyHistory` 最後一筆的 `teamId` 不同時，在**下一個年度開始前**（季前處理之前）插入選號步驟；隊內交易也由同一判斷涵蓋 | 只改一個接點，13 個呼叫點不動；`signTo` 本身維持 RNG 0；顯示時點是入團後的第一個賽季開始前，而非按下入團按鈕的當下；舊存檔（D4）在載入後第一季也會經由同一判斷出現一次選號（預設號碼為第一個選項） |
| 乙 | 每個呼叫點各自在 `signTo` 之後、下一個 `choose()` 之前插入選號 | 選號緊接在入團之後；要改 13 個以上呼叫點，漏改風險高，逐點都需測試 |

## 4. 修改前後差異

**會改變（玩家看得到）**
- 入團時多一個選號步驟（W1＝B；位置依 W8）。**主流程的點擊步數與 `#act` 的 DOM 順序會改變。**
- 背號顯示：生涯面板、每季成績卡、退休卡背號履歷、キャリア → 年度別（W2 a～d）。
- 生涯面板的選單按鈕只顯示 ☰，可見的「メニュー」文字移除；`aria-label="メニュー"`（`docs/index.html:59`）保留，無障礙名稱不變。
- 新狀態欄位 `S.jerseyHistory`，存入存檔。

**不會改變**
- RNG：演算法、呼叫順序、抽取次數完全不變（D1 為固定規則）。
- 能力、成長、收入、出場、成績、獎項、殿堂評分與判定、退休時點（規格 §4）。
- 既有選項的內容與順序、事件順序、存檔格式版本（`schemaVersion` 不變）；1.16.10 以前的存檔可讀。
- 選號步驟本身不消耗 RNG；新增步驟以外的操作順序不變。

**允許的差異**：狀態只有 `S.jerseyHistory`；畫面只有選號步驟、W2 a～d 的背號文字與選單按鈕的「メニュー」文字。其他任何狀態、RNG 次數或 RNG 順序的差異都視為回歸。

## 5. 實作與驗證計畫（R3；W7、W8 決定後定稿）

- 分類：R3（永久狀態、存檔、主流程步驟）。版本：MINOR（新功能），1.16.10 → 1.17.0，同步 `CHANGELOG.md`／`RELEASE_NOTES.md`／`CURRENT_SPEC.md`。
- 新模組（例如 `docs/src/engine/jersey-policy.js`）放預設選號與紀錄規則，`game.js` 只做接線（`docs/src` 既有檔案凍結斷言見 `award-identity-policy.test`）。

### 5.1 T 表（草案）

| T | 內容 | 主要檔案 |
|---|---|---|
| T1 | 純函式：預設號碼（W3）、號碼字串驗證（「0」≠「00」，「1」～「99」）、紀錄追加（D3）、顯示用「某年度的號碼」查詢 | 新 `jersey-policy.js` |
| T2 | 狀態與存檔：`S.jerseyHistory` 初始值、存檔契約 `types` 登記（不列 `required`）、舊存檔 D4 補號 | `initial-state.js`、`browser-save-state-contract.js` |
| T3 | 選號步驟：依 W8 插入；「背番号 X で入団する／背番号を選ぶ」，選號畫面可取消（取消不留紀錄）；隊內交易涵蓋（W4）；適用範圍 W6 | W8 甲：年度開始前的接點一處 |
| T4 | W7 的同球團改號入口（依決定） | — |
| T5 | 顯示 W2 a～d | 生涯面板、每季成績卡、退休卡、年度別 |
| T6 | 選單按鈕只顯示 ☰ | `docs/index.html:59` |
| T7 | 測試期待值更新與新增測試（見 §5.2、§5.3） | `tests/` |
| T8 | 版本與文件 | `config.js` 等 |

### 5.2 受影響的既有測試（2026-11-15 盤點，`1494a24`）

**逐步驅動生涯、對舊 SHA 比較（多一步 → 步數或 digest 位移，須核准期待值更新）**

| 入口 | 模式 | 比較對象 | 受影響原因 |
|---|---|---|---|
| `game-view-dom-e2e` | Full | 每步 DOM＋狀態＋RNG 次數 vs `4f39a73` | 選號步驟位移；另外 `dom.board`（`support/dom-snapshot.mjs:20`）含選單按鈕文字，☰ 變更會從第 0 步起不同 |
| `contract-salary-e2e` | Full | 每步紀錄 vs `37121fb` | 選號步驟位移 |
| `hof-first-ballot-e2e` | Full | 完整生涯 vs `925987d` | 同上 |
| `international-personal-stats-e2e` | Full | 6 條固定 seed 生涯 vs `e602174` | 同上 |
| `kbo-renewal-e2e` | Quick／Full | 每步紀錄、RNG state vs `f3efb0a` | 同上 |
| `draft-income-e2e` | Full | 3 條路線的 RNG state／次數（`tests/fixtures/draft-income-routes.json`）及新舊生涯比較 | 路線經過入團時多一步 |

這些驅動程式都用 `/…|入団/` 的正規式選按鈕（例：`game-view-dom-e2e.mjs:63`），會選中「背番号 X で入団する」，所以會自然走預設號碼路線。處理方式：只在新版一側略過選號步驟並剔除 `jerseyHistory` 再比較，另加斷言證明被略過或剔除的只有這些。

**直接依文字操作入團、或斷言入團動作一次完成**

| 入口 | 模式 | 內容 |
|---|---|---|
| `bug-act-01-02-e2e` | Quick（fixture）／Full | `:52-53` 按「指名を受けて入団」後斷言動作數＋1（`ACTION_NOT_ONCE`）；`:76` 斷言 `signTo` RNG 0 且 `S.ct` 已設定 |
| `draft-income-e2e` | Full | `:83` 依文字點「指名を受けて入団」；`:89` 斷言入團不增加 RNG |
| `stage10-risk-e2e` | Full | 在 `choose()` 回呼中直接呼叫 `signTo`，並有在 `signTo` 前注入故障的案例 |
| `full-power-pitching-e2e`、`stage6-state-transaction-e2e`、`stage7-safety-e2e`（經 `support/stage6-browser.mjs:32`） | Full | fixture 直接呼叫 `signTo` 後接著顯示下一個選擇 |

W8＝甲時，`signTo` 本身不變，上述 RNG 0 斷言與直接呼叫的 fixture 預期不受影響；選號步驟出現在下一年度開始前，需確認各測試是否會走到該時點（實作前逐一確認）。

**選單按鈕文字**

- `scripts/test-share-url-menu.mjs:60` 斷言按鈕文字為「☰メニュー」（`top menu unchanged`），須更新期待值（不在自動 manifest）。
- 其他使用 `#board-menu-toggle` 的測試（`support/board-menu.mjs` 等）只當點擊目標或檢查 `aria-expanded`，不受影響。

**不受影響（已確認）**：`season-phases.test`、`npb-return-ui.test`、`draft-signing-policy.test` 以樁替代 `signTo`；`career-movement-policy`、`salary-flow.test`、`verify-modularization` 只比對原始碼文字（W8＝甲時呼叫點不變）；`event-system-e2e`、`retirement-hof-pilot` 只比對同版兩次執行（選號為固定規則，兩次一致）。

### 5.3 新增測試與驗證

- 新增：預設選號（四守備位置）、轉隊沿用、同年多次改號全數保留且不覆寫、「0」≠「00」、取消不留紀錄、適用範圍外（IND／CORP）不出現選號、舊存檔（1.16.10 fixture）讀取＋第一季補號、存檔往返。
- 負控制：在選號中呼叫 RNG、覆寫過去年度、改號寫入能力或收入、IND 也出現選號，各自應在預期斷言 FAIL。
- 驗證：固定 seed 投手／野手前後比較（狀態只差 `jerseyHistory`、RNG 次數與順序一致）、Quick、8 批 Full、W2 指定畫面與選單按鈕的 PC／手機截圖（4 主題）。


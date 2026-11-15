# PLY-01 背號履歷：細部計畫（草案，待 code owner 決定 W1～W6）

狀態：**D1～D4 已定（使用者 2026-11-15）；W1～W6 待 code owner 決定；未授權實作。**
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

## 3. 請 code owner 決定（W1～W6）

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

## 4. 修改前後差異

**會改變（玩家看得到）**
- 依 W1、W2 的選擇，新增改號入口與背號顯示。
- 新狀態欄位 `S.jerseyHistory`，存入存檔。

**不會改變**
- RNG：演算法、呼叫順序、抽取次數完全不變（D1 為固定規則）。
- 能力、成長、收入、出場、成績、獎項、殿堂評分與判定、退休時點（規格 §4）。
- 既有選項、事件順序、存檔格式版本（`schemaVersion` 不變）；1.16.10 以前的存檔可讀。
- W1＝A 時，主流程的點擊步數與 DOM 順序不變（只有 W2 指定處多出號碼文字）。

**允許的狀態差異**：只有 `S.jerseyHistory`（及 W2 顯示文字）。其他任何狀態或 RNG 差異都視為回歸。

## 5. 實作與驗證計畫（R3；W1～W6 決定後再展開 T 表）

- 分類：R3（永久狀態、存檔）。版本：MINOR（新功能），1.16.10 → 1.17.0，同步 `CHANGELOG.md`／`RELEASE_NOTES.md`／`CURRENT_SPEC.md`。
- 新模組（例如 `docs/src/engine/jersey-policy.js`）放預設選號與紀錄規則，`game.js` 只做接線（`docs/src` 既有檔案凍結斷言見 `award-identity-policy.test`）。
- 受影響的測試（比對完整狀態 S）：`game-view-dom-e2e`、`contract-salary-e2e`、`draft-income-e2e`、`hof-retirement-comparison.test`、`npb-farewell.test`、`event-fix-e2e`、`trait-policy.test`。處理方式：只在新版一側剔除 `jerseyHistory` 再比對，並另加斷言證明剔除的只有這個欄位。
- RNG：`salary-flow.test` 的各模組抽取次數必須不變。
- 新增測試：預設選號（四守備位置）、轉隊沿用、同年多次改號全數保留且不覆寫、「0」≠「00」、取消不留紀錄、舊存檔（1.16.10 fixture）讀取＋第一季補號、存檔往返。
- 負控制：在選號中呼叫 RNG、覆寫過去年度、改號寫入能力或收入，各自應在預期斷言 FAIL。
- 驗證：固定 seed 投手／野手前後比較（狀態只差 `jerseyHistory`、RNG 次數一致）、Quick、8 批 Full、W2 指定畫面 PC／手機截圖。

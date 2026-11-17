# PLY-01 背號履歷：細部計畫（D1～D4、W1～W8、J1～J7 全部已決定；文案已確認；已授權實作）

狀態：**已決定**——D1～D4（使用者 2026-11-15）、W1～W6（code owner，PR #95 06:30 留言）、W7＝②、W8＝甲（code owner，PR #95 06:53 留言）、J1～J7（使用者 2026-11-15，§6）。**實作授權**：2026-11-15 使用者確認 §10 文案（J5 各句、「（背番号不明）」、對話框標題／按鈕／說明）並授權正式實作（R3，1.17.0），範圍為 §9 T1～T9；合併與部署仍依 AGENTS 第10章另行處理。code owner 的 PR #95 留言本身不代表授權。草稿程式碼保存在遠端分支 `wip/ply-01-draft`（不開 PR）。§1～§5 為 `1494a24` 時點的盤點，最新耦合與 T 表以 §8、§9 為準。
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
| W7 | 同球團主動改號 | **②**：保留入團選號，另在選單提供背號變更入口，允許同球團期間主動改號（即原方案 C）。補充 W1＝B（06:53 留言） |
| W8 | 選號步驟位置 | **甲**：在下一年度開始前、季前處理之前集中插入入團選號；同球團主動改號由 W7 的選單入口處理（06:53 留言） |

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

### W7、W8 原選項（已決定 W7＝②、W8＝甲，保留供參照）

#### W7 同球團主動改號（規格衝突）

`HOF_JERSEY_APPROVED_SPEC.md` §4 寫「允許同球團主動改號」，但 W1＝B 只在入團時提供選號，留在同一球團期間沒有改號入口。依 AGENTS §1 不自行補足，提請 code owner 選擇（決定：②）：

| 選項 | 內容 | 影響 |
|---|---|---|
| ① | B＋同球團續約時也提供選號（「背番号 X のまま／背番号を変更する」） | 續約畫面多一步，逐步比較的位移範圍再擴大 |
| ② | 改為 C（B＋選單內的改號入口，即原 W1＝A 的對話框） | 主流程只在入團時多一步；選單多一個項目，`#board-menu-panel` 的 DOM 改變 |
| ③ | 只在入團時選號，不提供同球團改號 | **須修改已批准規格 §4**（刪除同球團主動改號），另行批准 |

#### W8 選號步驟的插入位置（實作設計）

`signTo` 有 13 個以上呼叫點，多數在選項回呼中呼叫後立刻接著顯示下一個選擇（例如 `support/stage6-browser.mjs:32` 的「契約を受諾」→「契約後」）。若在 `signTo` 內部顯示選號，會被呼叫端隨後的 `choose()` 蓋掉。

| 選項 | 內容 | 影響 |
|---|---|---|
| **甲（建議；已採用）** | 集中一處：所屬職業球團與 `S.jerseyHistory` 最後一筆的 `teamId` 不同時，在**下一個年度開始前**（季前處理之前）插入選號步驟；隊內交易也由同一判斷涵蓋 | 只改一個接點，13 個呼叫點不動；`signTo` 本身維持 RNG 0；顯示時點是入團後的第一個賽季開始前，而非按下入團按鈕的當下；舊存檔（D4）在載入後第一季也會經由同一判斷出現一次選號（預設號碼為第一個選項） |
| 乙 | 每個呼叫點各自在 `signTo` 之後、下一個 `choose()` 之前插入選號 | 選號緊接在入團之後；要改 13 個以上呼叫點，漏改風險高，逐點都需測試 |

## 4. 修改前後差異

**會改變（玩家看得到）**
- 入團後、下一年度開始前多一個選號步驟（W1＝B、W8＝甲）。**主流程的點擊步數與 `#act` 的 DOM 順序會改變。**
- 選單新增「背番号変更」入口（W7＝②），開啟對話框改號；`#board-menu-panel` 多一個項目。
- 背號顯示：生涯面板、每季成績卡、退休卡背號履歷、キャリア → 年度別（W2 a～d）。
- 生涯面板的選單按鈕只顯示 ☰，可見的「メニュー」文字移除；`aria-label="メニュー"`（`docs/index.html:59`）保留，無障礙名稱不變。
- 新狀態欄位 `S.jerseyHistory`，存入存檔。

**不會改變**
- RNG：演算法、呼叫順序、抽取次數完全不變（D1 為固定規則）。
- 能力、成長、收入、出場、成績、獎項、殿堂評分與判定、退休時點（規格 §4）。
- 既有選項的內容與順序、事件順序、存檔格式版本（`schemaVersion` 不變）；1.16.10 以前的存檔可讀。
- 選號步驟本身不消耗 RNG；新增步驟以外的操作順序不變。

**允許的差異**：狀態只有 `S.jerseyHistory`；畫面只有選號步驟、選單的改號入口與其對話框、W2 a～d 的背號文字與選單按鈕的「メニュー」文字。其他任何狀態、RNG 次數或 RNG 順序的差異都視為回歸。

## 5. 實作與驗證計畫（R3；`1494a24` 時點草案，當時實作待授權；2026-11-15 已授權，最新 T 表見 §9）

- 分類：R3（永久狀態、存檔、主流程步驟）。版本：MINOR（新功能；實作時以當時 dev 的版本為基準），同步 `CHANGELOG.md`／`RELEASE_NOTES.md`／`CURRENT_SPEC.md`。
- 新模組（例如 `docs/src/engine/jersey-policy.js`）放預設選號與紀錄規則，`game.js` 只做接線（`docs/src` 既有檔案凍結斷言見 `award-identity-policy.test`）。

### 5.1 T 表（草案）

| T | 內容 | 主要檔案 |
|---|---|---|
| T1 | 純函式：預設號碼（W3）、號碼字串驗證（「0」≠「00」，「1」～「99」）、紀錄追加（D3）、顯示用「某年度的號碼」查詢 | 新 `jersey-policy.js` |
| T2 | 狀態與存檔：`S.jerseyHistory` 初始值、存檔契約 `types` 登記（不列 `required`）、舊存檔 D4 補號 | `initial-state.js`、`browser-save-state-contract.js` |
| T3 | 選號步驟：依 W8 插入；「背番号 X で入団する／背番号を選ぶ」，選號畫面可取消（取消不留紀錄）；隊內交易涵蓋（W4）；適用範圍 W6 | W8 甲：年度開始前的接點一處 |
| T4 | 選單「背番号変更」入口與對話框（W7＝②）：只在職業球團所屬期間可用；生效年度＝目前年度；同年多次改號依 D3 全數保留；取消／關閉不留紀錄、不產生副作用 | `board-menu`、新對話框 |
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

**選單新增項目（W7＝②）**：`#board-menu-panel` 多一個按鈕。`support/board-menu.mjs`（`verifyBoardMenu`）檢查面板按鈕 ID、幾何與鍵盤操作，須確認是否列舉固定的按鈕清單；`game-view-dom-e2e` 的 `dom.board` 含選單面板，與 ☰ 變更一併以投影處理（只容許這兩項差異）。

**選單按鈕文字**

- `scripts/test-share-url-menu.mjs:60` 斷言按鈕文字為「☰メニュー」（`top menu unchanged`），須更新期待值（不在自動 manifest）。
- 其他使用 `#board-menu-toggle` 的測試（`support/board-menu.mjs` 等）只當點擊目標或檢查 `aria-expanded`，不受影響。

**不受影響（已確認）**：`season-phases.test`、`npb-return-ui.test`、`draft-signing-policy.test` 以樁替代 `signTo`；`career-movement-policy`、`salary-flow.test`、`verify-modularization` 只比對原始碼文字（W8＝甲時呼叫點不變）；`event-system-e2e`、`retirement-hof-pilot` 只比對同版兩次執行（選號為固定規則，兩次一致）。

### 5.3 新增測試與驗證

- W8 驗收（code owner 06:53）：不漏記任何球團變更（入團、隊內交易、轉隊）；紀錄的生效年度與實際效力年度一致；舊存檔補號只發生一次；取消／重繪不重複追加；集中到年度開始前不得覆寫或補造過去紀錄。
- 新增：預設選號（四守備位置）、轉隊沿用、同年多次改號全數保留且不覆寫、「0」≠「00」、取消不留紀錄、適用範圍外（IND／CORP）不出現選號、舊存檔（1.16.10 fixture）讀取＋第一季補號、存檔往返。
- 負控制：在選號中呼叫 RNG、覆寫過去年度、改號寫入能力或收入、IND 也出現選號，各自應在預期斷言 FAIL。
- 驗證：固定 seed 投手／野手前後比較（狀態只差 `jerseyHistory`、RNG 次數與順序一致）、Quick、8 批 Full、W2 指定畫面與選單按鈕的 PC／手機截圖（4 主題）。

## 6. 補充決定 J1～J7（使用者 2026-11-15）

草稿盤點（基準 `563bf52`）發現 D1～D4／W1～W8 未涵蓋的行為，依建議決定：

| # | 事項 | 決定 |
|---|---|---|
| J1 | 入團／交易後到下一年度選號前的空窗 | 只在「職業球團所屬、最後一筆紀錄的 teamId＝目前球團、未退休」時面板顯示 `#N`、選單「背番号変更」可用；其他時候不顯示、按鈕停用（避免空窗期改號寫出錯誤年度並跳過入團選號） |
| J2 | 存檔時序 | 選號步驟在年初存檔（`capture(S)`）之後；選號前後離開時，續玩會再問一次；年中選單改號在下一年度年初才寫入存檔。「補號只發生一次」＝寫入存檔後不再出現 |
| J3 | 同球團再入團（釋出後重簽同隊、職業→IND→同隊） | 不出現選號、沿用原號；改號用選單。退休卡背號期間依職業年度列切段，非職業年度不併入同一段 |
| J4 | 「背番号を選ぶ」之後 | 開啟與選單相同的對話框（0、00、1～99 下拉，預設選中候選號）；取消回到兩鈕提示、不留紀錄；「背番号 X で入団する」為第一鈕且 `main` |
| J5 | 文案 | 一般入團／轉隊／交易：「{球団}と契約しました。背番号はどうする？」「背番号 X で入団する」「背番号を選ぶ」；舊存檔補號（D4）：「{球団}での背番号が記録されていません。背番号はどうする？」「背番号 X にする」「背番号を選ぶ」 |
| J6 | 面板 `#N` 位置 | `#bd-name` 前的獨立元素 `#bd-number`（`patchBoard` 改寫 `#bd-name` 第一個子節點，不能放入） |
| J7 | 年度別 | presenter 在所属字串後加「 #6」（凍結檔 `player-detail.js` 不改）；舊存檔第一筆紀錄前的職業年度為「（背番号不明）」 |

## 7. 草稿驗證（驗證當時為 scratchpad、未提交；目前保存於遠端 `wip/ply-01-draft`）

驗證當時草稿只在本機分支 `draft/ply-01`（未提交），最終基準 dev `75ab10b`（1.16.13），macOS＋Brave 157 本機證據，非 CI。目前草稿已保存至遠端分支 `wip/ply-01-draft`（`0d617a6`，不開 PR）；仍是草稿，不是已合併的正式功能。

**設計摘要**
- 新模組 `docs/src/engine/jersey-policy.js`（純函式：號碼表、預設、資格、待選判定、目前號碼、可否改號、提案號碼、舊存檔判定、只增紀錄、年度查詢、年度別標籤、退休卡期間）與 `docs/src/ui/jersey-dialog.js`（`<select>` 對話框，沿用 information/confirmation dialog 的版面與焦點處理）。
- `game.js`：`yearSteps` 最前加 `jerseyStep`（具名函式，置於 `phaseIntlPre` 前；未待選時直接 `nextStep()`）；`promptJerseyEntry`；選單 `#board-number` 的改號處理；`ProfessionalSeason` 注入 `jerseyLabel`、`CareerRetirement` 注入 `jerseyPeriods`。
- `S.jerseyHistory` 於第一次寫入時建立（`createInitialState` 不改）；存檔契約只登記 `types`（`array`），不列 `required`。
- 顯示：`#bd-number`（J6）、季成績卡 `.tag` 後「 · #N」、退休卡「通算成績」上方背號表（J3 期間）、年度別所属「 #N／（背番号不明）」；選單鈕只留 ☰（`aria-label` 保留）；`#board-number` 選單項目位於クレジット與表示設定之間，由 board model 控制 `disabled`。

**結果**
- 第一次草稿（基準 `563bf52`，測試未改）：Quick 90 PASS／6 FAIL、Full 126 入口 111 PASS／15 FAIL，作為耦合清單（§8）。
- 套用 P1～P6 後、疊於 `75ab10b`：Quick 98／98 PASS；4 組 Full 規劃 128、實際 128（缺 0 多 0 重複 0），127 PASS／1 FAIL；FAIL 為 `event-integration.test` SIGSEGV（log 空，`.ips` 堆疊 `ClearStaleLeftTrimmedPointerVisitor`／`StackGuardWithGap`／`BaselineOutOfLinePrologue` 與 TEST-EVENT-SIGSEGV-01 相同），單獨重跑 3／3 PASS，原 FAIL 保留。
- `jersey-policy.test`（新）11／11 PASS。
- 過程中發現 dev 既有的選單遮擋問題（390px、配分狀態下「共有／開発を応援／タイトルに戻る」被 `#act` 蓋住；PLY-01 多一項後「表示設定」也被蓋住），已獨立以 `UI-BOARD-MENU-STACK-01`（PR #102，1.16.13）修正後再疊草稿。

## 8. 測試耦合與核准投影規則 P1～P6

| 規則 | 內容 | 適用入口 |
|---|---|---|
| P1 | 對舊 SHA 逐步比較時，只在新版一側略過 `/^背番号 \S+ (で入団する\|にする)$/` 步驟、不記錄並計數；舊版一側須為 0，新版到達職業時須 >0 | `kbo-renewal-e2e`、`draft-income-e2e`、`trait-display-e2e`、`international-personal-stats-e2e`、`full-power-pitching-e2e`（3 變體）、`hof-first-ballot-e2e`、`hof-retirement-policy-e2e`、`contract-salary-e2e`、`game-view-dom-e2e`、`display-preferences-e2e` |
| P2 | 新版一側比較前刪除 `jerseyHistory`；最終狀態先驗證為 `{teamId:string, year:number, number:string}` 陣列 | 同上 |
| P3 | 比對 `proSeason` 原文的測試只登記一處核准修改（季成績卡 `${jerseyLabel?.()\|\|''}`）；vm harness 提供 `jerseyLabel:()=>''` | `professional-season.test`、`full-power-pitching.test`、`full-power-pitching-e2e` |
| P4 | 寫死的選單 ID 清單在 `board-credits` 後加 `board-number` | `support/board-menu.mjs`、`board-menu-stacking-e2e`、`scripts/test-share-url-menu.mjs`（另含 ☰ 文字與外部連結索引 [2,7]；不在 manifest、未執行） |
| P5 | fixture 流程進入新職業年度後先點選號 `main` 鈕再繼續 | `stage10-risk-e2e`（C-*、G-stay-*）、`contract-salary-e2e`（milb-demotion-*） |
| P6 | DOM／版面比較只在新版一側投影（各附契約檢查）：移除 `#bd-number`、`#board-number`、退休卡背號表；季成績卡與年度別的號碼後綴；還原 ☰ 鈕的「メニュー」span | `support/dom-snapshot.mjs`（`game-view-dom-e2e`、`display-preferences-e2e`）、`design-tokens-09-e2e` |

其他原文耦合（核准）：`verify-modularization`（`yearSteps` 與 `ProfessionalSeason` 建構式文字）、`career-presenter.test`（board model 新增 `numberText`、`numberChangeEnabled`）、`design-tokens-06.test`（字級使用處 66、間距 183）。

## 9. T 表（定稿草案）

| T | 內容 | 主要檔案 |
|---|---|---|
| T1 | 純函式與單元測試 | `jersey-policy.js`、`jersey-policy.test` |
| T2 | 狀態與存檔：延遲建立、`types` 登記 | `browser-save-state-contract.js` |
| T3 | 入團選號步驟（W8 甲、J2～J5） | `game.js` |
| T4 | 選單改號與對話框（W7②、J1、J4） | `index.html`、`jersey-dialog.js`、`game.js`、`career-presenter.js`、`game-view.js` |
| T5 | 顯示 W2 a～d（J6、J7、J3） | `career-presenter.js`、`game-view.js`、`professional-season.js`、`career-retirement.js`、`base.css` |
| T6 | 選單鈕只留 ☰ | `index.html` |
| T7 | 既有測試 P1～P6 與原文耦合 | §8 所列 |
| T8 | 新 E2E `jersey-e2e`：入團選號只出現一次並記錄當年、取消不留紀錄、選單改號（同年多次全保留、不覆寫過去）、交易／轉隊沿用、IND／CORP 不出現、同隊再入團不出現（J3）、舊存檔（1.16.13 存檔 fixture）D4 補號一次且下一年度存檔後不再出現、J2 存檔／續玩（①年初完成選號後、下一次年初存檔前離開並續玩，回到該年度年初快照並再次詢問選號；②年中經選單改號後、下一年度存檔前續玩不保留該次改號，下一年度存檔成功後保留；不改保存時機、不新增即時存檔）、面板／成績卡／年度別／退休卡顯示、0≠00 | `tests/jersey-e2e.mjs`、manifest |
| T9 | 版本與文件：1.17.0（MINOR）、CHANGELOG／RELEASE_NOTES／CURRENT_SPEC、BACKLOG PLY-01 | 文件 |

## 10. 負控制與未完成項目

- 負控制（實作時執行）：選號步驟內呼叫 R()、覆寫過去紀錄、改號寫入能力或收入、IND 出現選號、`jerseyStep` 移到存檔前、dom-snapshot 各投影契約（多刪／少刪）、P1 略過條件放寬至任意按鈕。
- 文案已確認（使用者 2026-11-15）：J5 各句、J7「（背番号不明）」、對話框（標題「背番号を選ぶ」「背番号の変更」、確定鈕「この背番号にする」「変更する」、說明「{年}年シーズンから有効。過去の年度の背番号は変わりません。能力・成績・年俸には影響しません。」）。
- 草稿已經 reviewer 審查並修正（§11）；`scripts/test-share-url-menu.mjs` 未執行；Linux CI、Preview、實機未驗證。
- 正式實作已授權（使用者 2026-11-15）；進度見 §11。T8 與負控制已完成（2026-11-17），尚需 T9 版本與文件、最終 reviewer 與 Full。**2026-11-17 起 `origin/dev` 已是 2.0.0，須先整合，見 §12。**

## 11. 正式實作進度與審查修正（2026-11-15）

**分支**：`feat/ply-01-jersey`（自 `origin/dev` `21b4ff9`，`--no-track`，**本機、未 push、未開 PR**）。
- `9315543`：草稿 32 檔原樣帶入（與 `wip/ply-01-draft` `0d617a6` 的 docs/tests/scripts 內容一致，壓成一個 commit）。
- `2c2874c`：入團對話框說明改為 §10 核准原文（補「過去の年度の背番号は変わりません。」）。
- `4ff917d`：reviewer 審查修正 A1～A4、B1～B7（使用者 2026-11-15 依建議核准）。
- `ea5c01a`：T8 `tests/jersey-e2e.mjs`、manifest 登錄（Full／Audit、`seconds:20`）、`scripts/TESTING.md` 說明段（2026-11-16）。
- 驗證（macOS＋Brave 157，本機）：`4ff917d` 的 Quick 98／98 PASS（98 入口全數執行）；`jersey-policy.test` 17／17 PASS。Full、CI、Preview 未執行。

**審查修正（明確缺陷）**
| # | 內容 | 實作 |
|---|---|---|
| A1 | 退休後面板 `#N` 仍顯示、「背番号変更」仍可按（違反 J1） | `currentJerseyNumber` 於 `done` 時回 `null`；`CareerRetirement.endGame` 設 `done` 後呼叫注入的 `jerseyRetired`（隱藏 `#bd-number`、停用 `#board-number`）。`game.js` 的 `endGame` 宣告文字由 `verify-modularization` 固定，不可改 |
| A2 | 續玩時若待選號，面板為 `index.html` 預設值 | `promptJerseyEntry` 顯示選項前 `board(0)`（不消耗 RNG） |
| A3 | 對話框選號後的接續動作無錯誤保護 | 對話框回傳號碼後，以該號碼重新顯示兩鈕提示，再程式點擊主按鈕；沿用 `runChoiceAction` 的連點防護、錯誤卡與恢復 |
| A4 | 取消入團對話框後焦點遺失 | 重新顯示提示後焦點移到第一個按鈕 |

**審查修正（新規格決定，使用者 2026-11-15）**
| # | 決定 | 實作 |
|---|---|---|
| B1 | 當年職業球季列已存在後（休賽期）的選單改號，生效年度＝下一年；對話框說明顯示該年 | `jerseyChangeYear(state)`；`appendJerseyRecord(state,number,year)` |
| B2 | D4 補號文案只在「無任何紀錄且最後一個年度列為職業球季」時使用；IND／CORP 之後簽職業球團為一般入團（J5） | `isLegacyJerseyEntry` |
| B3 | 入團對話框欄位標籤「背番号」；選單對話框維持「新しい背番号」「現在の背番号 #N」 | `chooseJerseyNumber({fieldLabel})` |
| B4 | 季中交易分段卡、全年受傷卡不帶號碼（產品不變）；`dom-snapshot` 僅對有 `.tag` 的「シーズン成績」卡要求號碼，無 `.tag` 者須為「（今季はけがで全休）」 | `tests/support/dom-snapshot.mjs` |
| B5 | 紀錄達 960 筆後停用選單改號（存檔陣列上限 1024；入團每季至多 1 筆） | `JERSEY_MENU_LIMIT` |
| B6 | 讀檔驗證每筆紀錄：`teamId` 為職業球團（非 IND／CORP）、`year` 為整數且不大於存檔年度、號碼合法、僅三個欄位；不符以 `SAVE_JERSEY` 拒絕 | `isValidJerseyHistory`、`browser-save-codec.js` |
| B7 | D4「不明」期間以不含交易前綴（A→）與級別後綴的球團名稱分段與顯示 | `jerseyPeriods(...,unknownTeam)`；`game.js` 以 `leagueCatalog.teamMaster` 解析（`verify-modularization` 禁止 `game.js` 出現 `DATA.teams.map(`） |
| — | 季中交易年度列「A→B」顯示 A 的號碼、退休卡該年歸 A 期間（D3／J1 一致，維持） | 不改；T8 固定此行為 |

**T8 `tests/jersey-e2e.mjs` 設計（使用者 2026-11-15 核准）**
- 架構：沿用 `scripts/test-browser-save-runtime.mjs`：本機 server 提供目前 `docs/` 與 `/baseline/`（`75ab10b`，1.16.13，同源、存檔可互通），並注入 probe 讀取 `S` 與每次 R 抽取。
- 案例：

| 案例 | 進入方式 |
|---|---|
| 首次入團選號只出現一次、記當年、第一鈕 `main`、P／C／IF／OF 預設照 W3 | 自然生涯 |
| 「背番号を選ぶ」後取消回兩鈕提示、無紀錄；0 與 00 分開；A3 經主按鈕確認；A4 焦點 | 自然生涯 |
| 選單改號：同年多次全保留、不覆寫過去；空窗期停用（J1）；B1 休賽期改號記下一年；A1 退休後停用 | 自然生涯 |
| 轉隊／交易沿用、MiLB↔MLB 不再問、IND／CORP 不出現、回同隊不出現（J3）、B2 文案 | fixture 設狀態後呼叫真實移籍函式（標註「fixture」；參考 `stage10-risk-e2e` C-*／G-stay-*、`contract-salary-e2e` milb-demotion-*） |
| D4：`/baseline/` 玩到職業並存檔，以目前版本續玩，補號一次；下一年度存檔後不再出現；A2 面板；B7 不明期間 | 實際產生的舊存檔（T9 改版後再跑一次） |
| J2①：年初選號後、下一次存檔前重新載入，續玩再問一次 | 自然生涯 |
| J2②：年中改號後、下一次存檔前續玩不保留；下一年度存檔後保留 | 自然生涯 |
| 無 RNG：同 seed 兩次（預設 vs 對話框選號＋選單改號），R 值序列與 `rngState` 完全相同，刪除 `jerseyHistory` 後狀態完全相同 | 自然生涯 |
| 二重操作：入團主按鈕、`#jersey-ok` 各連點兩次，只 1 筆紀錄、流程只前進 1 步 | 自然生涯 |
| B6：竄改存檔（未知 teamId、非法號碼、未來年度、多餘欄位）讀檔被拒 | 存檔注入 |
| 顯示：面板、成績卡、年度別、退休卡；1280／390 截圖；Console 0 | 自然生涯 |

**負控制對應（實作時執行，須在指定斷言 FAIL）**
| 負控制 | 攔截 |
|---|---|
| 選號步驟內呼叫 `R()` | T8 無 RNG 比較 |
| 覆寫過去紀錄 | T8 選單改號、`jersey-policy.test` |
| 改號寫入能力或收入 | T8 刪除 `jerseyHistory` 後的狀態比較 |
| IND 出現選號 | T8 IND／CORP 案例 |
| `jerseyStep` 移到存檔前 | T8 J2① |
| `dom-snapshot` 投影多刪／少刪 | `game-view-dom-e2e` 投影契約 |
| P1 略過條件放寬至任意按鈕 | 各 P1 測試的計數檢查 |
| 移除 `jerseyRetired` 呼叫（A1）、移除 `board(0)`（A2）、B1 改回 `S.year`、移除 B6 驗證 | T8 對應案例 |

**T8 結果（2026-11-16，`ea5c01a`）**
- 驗證（macOS＋Brave 157，本機）：`jersey-e2e` 20／20 PASS（直接執行與 runner `full --only=jersey-e2e` 皆 PASS，約 19 秒）；Quick 98／98 PASS（98 入口全數執行；於 deadpath 案例改名前的 T8 tree 執行，改名只動註解與案例 id，`jersey-e2e` 不在 Quick）；`local-full-batches.test` 14／14 PASS。Full、CI、Preview、負控制未執行。
- 自然生涯 seed：`probe33-1`（P／C／IF／OF，預設 18／27／6／1 實測）、`probe33-6` P（B1 等待點在入團年度、2030 年自然轉 KBO）、`probe33-8` C（B1 等待點、2031 年前無轉隊，用於預設 vs 對話框＋選單的 RNG 比較）。
- RNG：`probe33-1` P、`probe33-8` C 與 `/baseline/`（`75ab10b7d442db7aeccde0d649a852f224eed481`，1.16.13；`git diff 75ab10b 21b4ff9 -- docs/` 為空）到 2031 年初，全 R 值／`rngState` 與 S（排除 `version`、`createdVersion`、`jerseyHistory`）一致；另斷言年初存檔到選號提示之間 0 次抽取。
- D4：目前以 1.16.13 存檔讀入同為 1.16.13 的程式；跨版讀取待 T9 改版後重跑。
- B6：直接竄改 IndexedDB（`yakyujinsei-career`／`career`／`autosave`），六種竄改各回 `SAVE_JERSEY`（`store.read()` 先跑 `validateSaveEnvelope`，HMAC 驗證在後）。
- 390 版面：隊名換兩行、名字截斷在 1.16.13 同 seed 即存在（P／C／OF 實測），非 PLY-01 退化。
- 模式：實測約 19 秒，使用者 2026-11-16 決定維持 Full-only。

**發現：`tradeFrom` 為 dead path（使用者 2026-11-16 選 B：保留並標示）**
- `docs/src` 無任何程式把 `S.tradeFrom` 設為非 null（只讀於 `professional-season.js:67/70/83`，`:84` 設回 null）；`git log -G` 全歷史亦無。最初 commit 的註解寫明交易一律視為季後、刻意不設 `tradeFrom`。交易判定（`TRADE_CHECK`）在當季成績列寫入之後。
- 因此「A→B」年度列、季中交易分段卡（B4 投影規則）、B7 的交易前綴去除在現行遊戲不會發生。實際交易由 `fixture-trade`（真實 `doTradeExec`）固定：交易年度列為 A、顯示 A 的號碼、退休卡該年歸 A、隔年在 B 提議 A 的號碼。
- `deadpath-trade-label`、`deadpath-trade-unknown` 直接設定 `tradeFrom`／`orgTeamId`（不呼叫移籍函式），保留作為日後導入季中交易時的 D3／J1、B7 固定。

**既有問題（未處理，與 PLY-01 無關）**：`scripts/ci-full-batches.test.mjs` 寫死 `assert.equal(ids.length,106)`，`fullIds()` 在 HEAD `ae2c738` 為 128（加入 `jersey-e2e` 後 129），乾淨 HEAD 上同樣 2 項 FAIL。只在 CI `linux-smoke` 模式執行，不在 Quick／Full。

**負控制結果（2026-11-17，使用者核准執行；`54a4c82` 的 scratchpad worktree，macOS＋Brave 157，本機）**
- 隔離與流程：只在 worktree 植入；替換字串先斷言出現 1 次（N3、N12 依檔案指定次數），植入後確認已改，只跑對應測試，還原後以 sha256 確認。工作樹未動。driver 為 Node 腳本（不經 zsh 迴圈）。
- 對照 N0（未變異）：`jersey-e2e` 8 案例（entry-P、entry-dialog、menu-change、resume-entry-unsaved、rng-identity、save-tamper、legacy-save、fixture-ind）PASS，`jersey-policy.test` 17／17 PASS；N2 補強後重跑仍 PASS。
- 判定：exit 非 0，且失敗在指定斷言。N1～N12 全部攔下，無 `is not defined` 類假失敗。

| # | 植入 | 結果（失敗的斷言） |
|---|---|---|
| N1 | `promptJerseyEntry` 內 `R()` | `entry-P`「no RNG draw between the year-start save and the prompt」（48≠47）；`rng-identity` 狀態比較 |
| N2 | `accept` 內 `R()` | 補強前：`rng-identity` 的全 R 值比較**未攔下**，由其後的狀態比較（`$.ab.sta`）攔下。補強後：新斷言「draw count at every year-start save equals the 1.16.13 baseline」攔下 |
| N3 | `appendJerseyRecord` 覆寫最後一筆 | `jersey-policy.test` D3、B1；`menu-change` 紀錄比對 |
| N4 | 選單改號時 `careerEarnings+=1` | `rng-identity` variant 狀態比較（`$.careerEarnings`） |
| N5 | `isJerseyEligible` 含 IND | `fixture-ind` 提示數 1≠0 |
| N6 | 年初存檔 capture 前寫入紀錄 | `resume-entry-unsaved` 續玩提示數 0≠1（J2①） |
| N7 | 移除 `jerseyRetired` 呼叫 | `entry-P`「A1: no number after retirement」 |
| N8 | 移除 `board(0)` | `resume-entry-unsaved`、`legacy-save`「A2 board year」 |
| N9 | `jerseyChangeYear` 回傳 `state.year` | `menu-change`「B1 note names next year」 |
| N10 | 移除 codec `SAVE_JERSEY` 檢查 | `save-tamper` 得 `SAVE_AUTH_FAILED`（預期 `SAVE_JERSEY`） |
| N11a | 投影多刪：季成績卡 tag 文字清空 | `game-view-dom-e2e` 與固定 baseline `4f39a73` 比較，第 70 步 `$.dom.log` 不同 |
| N11b | 投影少刪：保留 `#bd-number` | 投影契約 `JERSEY_BOARD_UNEXPECTED`（契約 throw，非 `ERR_ASSERTION`，即該契約的攔截方式） |
| N12 | 各 E2E 自有的 P1 regex 放寬 | 見下 |

- N2 發現：同 seed 的 R 值序列必為同一串流的前綴，「全 R 值／`rngState` 相同」實際只比到截止時的抽取次數；N2 下兩側皆 118 次。使用者 2026-11-17 選 A：`rng-identity` 的 `run()` 回傳 `captures`（各年初存檔的年度與抽取次數），新增「現行 vs baseline」「variant vs 預設」兩條 `captures` 比較（先斷言各 ≥3 筆）。
- N12（使用者 2026-11-17 選乙：10 檔 12 入口全跑）：scout 盤點 10 檔各自內嵌 regex、無共用 helper。「任意按鈕」在多數檔會先撞生涯上限，故主變異改為 `|する$`（`contract-salary-e2e` 只改 P1 的 `jersey=`，不改 P5 的 `settleJersey`）。

| 入口 | 變異 | 攔截 |
|---|---|---|
| `kbo-renewal`、`draft-income`、`trait-display`、`international-personal-stats`、`full-power-pitching` ×3、`contract-salary` | `\|する$` | 「baseline has no number step」 |
| `hof-first-ballot`、`hof-retirement-policy` | `\|する$` 存活（舊版側路徑無此類按鈕）→ 任意按鈕 `\|^` | 「baseline has no number step」（例：352≠0） |
| `display-preferences` | `\|する$` 存活；`\|^` 先撞 `Career did not finish` → `\|^通常投球` | 「baseline has no number step」 |
| `game-view-dom` | `\|する$` | 第 336 步 DOM 與 baseline 不同（`ERR_ASSERTION`），在計數斷言 `:129` 之前失敗；計數斷言未單獨驗證（需構造只略過策略本來會點的按鈕，未做） |

- 未驗證：補強後的 `jersey-e2e` 只跑上列 8 案例，未跑全 20 案例（T9 後重跑時涵蓋）；Full、CI、Preview 未執行。

**下一步**：~~T9（1.17.0、CHANGELOG／RELEASE_NOTES／CURRENT_SPEC、BACKLOG）→ T9 後重跑 `jersey-e2e`（D4 跨版）→ reviewer → 4 組 Full → push dev 前請使用者確認。~~ 已由 §12 取代（`origin/dev` 升到 2.0.0）。本機 E2E 需先重建 Brave shim（見 session memory）。合併與部署未授權。

## 12. 整合 `origin/dev` 2.0.0（2026-11-17 盤點，未實作）

**現況**：分支起點 `21b4ff9` 之後，`origin/dev` 新增 code owner 的 `f08848b`（首頁隨機球員名，2026-11-16）與 `5910421`（`feat(ui): redesign game interface for 2.0.0`，82 檔 +6484 行，`VERSION` 為 `2.0.0`，2026-11-17）。`origin/main` 仍為 1.16.13（`d6cef67`）。`git merge-tree --write-tree d149aab 5910421`：14 檔、17 處文字衝突。以下為唯讀盤點，尚未合併、未執行測試。

**決定（使用者 2026-11-17）**
| # | 決定 |
|---|---|
| M1 | 以 merge 整合（不 rebase），保留 §11 記錄的 SHA |
| M2 | RNG／狀態比較基準由 `75ab10b`（1.16.13）改為 `5910421`（2.0.0，PLY-01 合併前的 dev）。D4 舊存檔兩版都測：2.0.0（`5910421`）與 1.16.13（`75ab10b`，正式站 main 現行版） |
| M3 | 先在 scratchpad 做合併草稿並跑 4 組 Full，找齊 Full 才會出現的耦合後，再提出新的 T 表（含 T9） |
| M4 | 版本號等 code owner 決定 2.0.0 的發布安排；原定 1.17.0 不再適用（以 2.0.0 為基準，MINOR 為 2.1.0），T9 暫緩 |
| A | 面板號碼：`#bd-number` 移進 `#bd-name` 那一行，排在名字前面；不動 `#bd-top` grid，只改 HTML 位置與 CSS；桌機側欄（`desktop-overview.js`）不顯示號碼 |
| B | 退休時 2.0.0 收合所有卡片的 `details`，「通算成績」卡內的背番号表跟著收合：維持，不改 `career-review.js`，振り返り摘要不加號碼 |

**文字衝突（14 檔、17 處）**
| 類別 | 檔案 | 處理 |
|---|---|---|
| 照搬（兩邊改不同部分） | `draft-income-e2e`、`full-power-pitching-e2e`、`hof-first-ballot-e2e`、`hof-retirement-policy-e2e`、`international-personal-stats-e2e`、`kbo-renewal-e2e`、`trait-display-e2e` | 保留 PLY-01 的 P1 略過與 dev 的 `window.__allocationComparison.action(b)`（一般按鈕仍回傳 `textContent`，P1 regex 不受影響） |
| 照搬 | `display-preferences-e2e`（2 處）、`career-presenter.js`、`career-presenter.test` | 兩邊新增欄位／import 都保留 |
| 照搬 | `board-menu-stacking-e2e`、`tests/support/board-menu.mjs` | 選單 id 清單同時含 dev 的 `board-menu-close` 與 PLY-01 的 `board-number`（後者只算 `.board-menu-items` 內） |
| 重新編排 | `docs/index.html` | 選單改為 `<dialog>`，`#board-number` 移進 `.board-menu-items`；`#bd-number` 依決定 A 放置 |
| 重新編排 | `tests/support/dom-snapshot.mjs` | dev 的 `__projectDecisionPresentation` 會以重新解析的 `log` 取代 clone；背番号投影須接在其後 |
| 重新編排 | `tests/design-tokens-06.test.mjs` | dev 改為排除法計數（字級 81、間距 236）；PLY-01 新增的字級 1 處、間距 4 處以明確名稱排除 |

**自動合併不報、需處理的語意風險**
1. `#bd-top` grid：dev 的 `game-shell.css` 為 `#bd-name`／`#bd-team`／`#board-menu` 指定欄位，未指定的 `#bd-number` 會被自動放入格子並擠開名字 → 決定 A。
2. 退休卡：2.0.0 退休時收合 `details[data-reader-details]`，背番号表預設不可見；振り返り摘要無號碼 → 決定 B。
3. 選單 dialog 焦點：dev 的 `close()` 預設把焦點還給 ☰，改號對話框在 close 之後開啟；焦點順序（A4 類）需重驗。
4. 新開生涯覆寫確認：已有存檔時按「始める」先經 `replaceCareer` 確認；`jersey-e2e` 中已有存檔再開新生涯的案例須比照 dev 的 `draft-income-e2e`（`deferredOverwrite`）處理。
5. 未盤點：dev 新增的 `ui-redesign-shell`／`-decision`／`-review`／`-allocation` E2E 會檢查選單、面板、決策區；入團選號是新增的決策步驟，可能撞到 → 以 M3 的草稿 Full 確認。

**重驗範圍**：§11 的 Quick、`jersey-e2e` 20 案例、N1～N12 負控制皆在 1.16.13 基準上取得，整合後須依新 T 表重跑（範圍於 M3 後提出）。

**下一步**：M3 合併草稿（scratchpad）→ 4 組 Full → 新 T 表（含衝突處理、A 的版面、風險 3～5、M2 基準切換、重驗與負控制範圍）請使用者核准 → 實作 → reviewer → Full → push dev 前請使用者確認。T9 待 code owner 決定版本。合併與部署未授權。


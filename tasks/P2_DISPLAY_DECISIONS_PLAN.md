# INT-01／EVT-01／INJ-UI-01：顯示功能細部計畫（全部已決定；EVT-01 已實作結案；INT-01／INJ-UI-01 未授權實作）

狀態：**已決定**——E1・E2・E3（要做）・I2（使用者 2026-11-15）；N1＝B、N2＝A、E3＝a、I1＝公開總值＋細目（code owner，PR #95 06:44 建議、06:53 確認為已決定，見 §5）。**未授權實作**：INT-01、INJ-UI-01。EVT-01 的 E1＋E2 經 PR #97（1.16.11）、E3 經 PR #99（1.16.12）併 dev，2026-11-15 結案（見 `BACKLOG.md` EVT-01）。
上位項目：`BACKLOG.md` §3.5 的 INT-01、EVT-01、INJ-UI-01。
調查基準：`origin/dev` `1494a24`（1.16.10）。

## 1. 現況（2026-11-15 調查）

### INT-01 國際賽事履歷

- 大會：WBC（`WBC:<年>`，2026 起每 4 年，PRE）、WBSCプレミア12（`P12:<年>`，2027 起每 4 年，POST）；`international-selection-policy.js`。只在 `S.stage==='PRO'` 時處理（`international-tournament.js:23`）。
- **實際出場**：`commitInternationalResult` 以 `eventKey` 寫入 `S.intlTraitResults[key]`＝`{eventKey, year, rank, hadIntlace, basePoints, awardedPoints, injuryAdded, finalReached, unlockedIntlace, personalStats?}`（`international-trait-policy.js:37-47`）。`personalStats` 自 1.11.8 起才有；缺少時既有 `renderInternationalPersonalStats` 顯示「本大会の個人成績：記録なし」。大會名不存在結果內，需由 `eventKey` 對回大會名。
- **未出場**：選外（DENIED）、負傷（INJURED，記為 DENIED）、辭退（DECLINED）一律只寫 `S.intlCompletedKeys[key]=true`，**不存原因**；只有辭退另加 `intlDeclinedCount`（`international-tournament.js:12-17`、`30-34`）。
- 現有顯示：引退「通算成績」卡內只有國際大會通算一列（`career-retirement.js:226-234`）、「国際大会・代表の栄誉」文字列表（`career-retirement.js:164-165`）、キャリアプロフィール的出場大會數。沒有逐大會列表。
- 上述欄位均在存檔契約內（`browser-save-state-contract.js`）。
- **規格衝突**：`CURRENT_SPEC.md` §15.1 寫「大会別履歴一覧…は追加しない」（1.11.x 範圍凍結）。實作 INT-01 須同步修改此條。

### EVT-01 事件分類顯示

- 92 張卡均有 `category`：training 43、encounter 35、endorsement 14（`event-cards-jp.js`，`validateEventCatalog` 檢查數量）。HS／U／CORP 階段 `effectiveCategory` 把 encounter 視為 training（`event-policy.js:18`）。
- 抽選：`eventDrawPool` 只依資格欄位過濾，`pick(pool)` 一次；分類不影響候選與順序（`season-events.js:30-31`）。
- 現有顯示：選項按鈕小字開頭有分類名（`season-events.js:22`）；提示標題、結果卡標題沒有。
- 履歷資料：每次事件的結果存於 `S.processedEventIDs[occurrenceID]`＝`{cardID, mode, success, category, tier, target, abilityPoints, abilityDelta, statDelta, injuryAdded, incomeYen, year, unlocked, …}`（`event-state-policy.js:41`），在存檔契約內（`browser-save-state-contract.js:102`）。不需新增狀態即可顯示年度履歷；卡名由 `cardID` 對回 `EVENTS`。

### INJ-UI-01 受傷風險細項

- `injuryProb()` 為 `player-injury.js` 內部函式、只回傳總值：基礎 15＋`injNext`＋年齡（32 歲 +6、35 歲 +12）＋理論派（25 歲前 −5）→ 鐵人上限 10／玻璃下限 40／兩者並存固定 25 → ＋`tmpInj` → 限制於 3～95（`player-injury.js:80-91`）。
- 現有顯示：「コンディション」只列 `injNext`、`tmpInj` 兩項（`career-presenter.js:20`）；總值只在季中健康診斷未受傷時出現在結果卡（`player-injury.js:95`）。
- 時序：季中為戀愛事件 → 事件卡 2～3 張（各可加 `tmpInj`）→ 健康診斷 `rollInjury()`（`season-phases.js:95-101`）。求婚使 `tmpInj −5`（`player-romance.js:139`）；國際大會使下一季 `injNext +10`（`international-trait-policy.js:40`）。

## 2. 已決定事項（使用者 2026-11-15）

| # | 事項 | 決定 |
|---|---|---|
| E1 | 分類標記位置 | 事件提示標題與結果卡標題**兩處** |
| E2 | 標記形式 | **徽章**（使用設計 token 的主題色） |
| E3 | 年度事件履歷 | **要做**；顯示位置待決（見 §3） |
| I2 | 風險顯示內容 | **細目**（總值＋基礎／前季延續／年齡／特性規則／今季一時加算） |

## 3. 原選項（已決定，見 §5）

### N1 INT-01 列表位置

| 選項 | 位置 | 優點 | 缺點 |
|---|---|---|---|
| A | 只放引退畫面（「通算成績」卡的國際大會通算列附近） | 範圍最小；引退後資料不變，無即時更新問題 | 生涯進行中看不到 |
| **B（建議）** | 引退畫面＋「キャリア → 実績」分頁 | 生涯中途即可查看，和其他記錄一致 | 多一處顯示；分頁會反覆重繪，需驗證重繪時機與手機版；DOM 快照期待值更新較多 |
| C | B＋分享圖 PNG | 可分享 | canvas 版面高度改變，需改既有分享圖版面與像素比較；出場多時圖變長 |

### N2 INT-01 是否列出未出場的大會

| 選項 | 內容 | 優點 | 缺點 |
|---|---|---|---|
| **A（建議）** | 只列實際出場（`intlTraitResults`） | 不新增狀態，R2；舊存檔完全相容 | 未出場年份不出現，看不出是選外、負傷或辭退 |
| B | A＋由 `intlCompletedKeys` 推出「不参加」列 | 不新增狀態，R2；年表無空缺 | 無法分原因，只能統一寫「不参加」 |
| C | 新增欄位記錄原因（選外／負傷／辭退） | 原因可分別顯示 | 永續狀態、存檔契約、舊資料遷移，升為 R3；舊存檔已發生的大會補不回原因 |

### E3 年度事件履歷的顯示位置

| 選項 | 位置 | 優點 | 缺點 |
|---|---|---|---|
| a | 「キャリア → 年度別」各年度列內附該年事件（卡名＋分類徽章＋選擇＋成敗） | 與年度成績並列，不新增分頁 | 390px 年度表本已擁擠，需摺疊或另起區塊 |
| b | 「キャリア」新增「イベント」分頁 | 版面獨立、可依年度分組 | 分頁列多一顆按鈕，`#career-tabs` DOM 順序改變，相關 E2E 需更新 |
| c | 只放引退畫面 | 範圍最小 | 生涯中途看不到 |

### I1 是否在健康診斷前公開總故障率

- **遊戲機制完全不變**：機率、RNG、時序不變，只增加可見資訊。
- **影響玩家判斷**：季中選事件卡（大膽／普通／安全）時可看到加算後的總值；按鈕小字已有「失敗時故障リスク加算+X」，公開後可直接估算結果。求婚 −5、國際大會 +10、年齡風險也可事先估算。
- **其他**：實質上略降難度；鐵人／玻璃的上下限會直接反映在數字（兩者解放時已公開，不構成劇透）；數值隨抽卡變動，須在每次 `board(1)` 重繪時即時計算；與既有「故障率 X%」結果卡為同一值。
- 選項：**是**（照 I2 顯示總值＋細目）／**否－甲**（只補齊細目各項，不顯示總值）／**否－乙**（維持現狀，INJ-UI-01 暫緩）。

## 4. 決定後的分類與驗證

- **INT-01**：N2＝A／B 時為 R2 純顯示例外（既有資料唯讀），PATCH；N2＝C 為 R3、MINOR。同步修改 `CURRENT_SPEC.md` §15.1。驗證：舊結果無 `personalStats`、0 大會、多大會排序（年度＋PRE／POST）、PC／手機。
- **EVT-01 E3**：R2 純顯示例外，PATCH。讀取 `processedEventIDs`，卡名由 `cardID` 查表；不存在的 `cardID` 顯示安全的代替文字。E3＝b 時更新分頁相關 E2E。
- **INJ-UI-01**：R3（故障計算路徑）。做法：抽出純函式 `injuryRiskBreakdown(state)`（新模組；`docs/src` 既有檔案凍結斷言見 `award-identity-policy.test`），`injuryProb()` 改回傳其總值，「コンディション」使用同一函式。驗證：固定 seed 投手／野手前後比較（狀態與 RNG 順序／次數一致）、所有特性組合與年齡邊界（31／32／34／35、24／25）、`tmpInj` 為負、3／95 夾限、Quick＋Full。

## 5. Code owner 決定與驗收條件（2026-11-15，PR #95 06:44 留言；06:53 確認已決定）

| # | 決定 | 與 §3 的關係 |
|---|---|---|
| N1 | **B**：引退畫面＋「キャリア → 実績」 | 同建議 |
| N2 | **A**：只列實際出場 | 同建議 |
| E3 | **a**：「キャリア → 年度別」各年度成績下方的獨立摺疊區 | §3 原無建議 |
| I1 | **公開**總值＋細目，並須標示範圍與時點 | 選項「是」，附加條件 |

以下為各項的驗收條件（實作授權後適用）。

### 5.1 INT-01（N1＝B、N2＝A）

- 顯示於引退畫面與「キャリア → 実績」，生涯進行中可查看。分享圖 PNG 本期不擴充。
- 預設列出年度、大會名、球隊名次；本大會個人成績以展開方式查看。
- 只列實際出場（`intlTraitResults`）。舊結果缺 `personalStats` 時顯示「記録なし」，**不補零、不推測未出場原因**。
- 同年不同大會以 `eventKey` 區分，依實際 PRE／POST 時序排序，不只按年度合併。
- 驗收：0 大會、舊結果無個人成績、同年 WBC 與プレミア12 並存（排序）、展開／收合、PC／手機。

### 5.2 EVT-01 E3（年度事件履歷，E3＝a）

- 放在「キャリア → 年度別」每年度成績的下方，**不塞進既有成績表的欄位**；預設收合，避免手機頁面過長。
- 展開後顯示：事件名、分類（E2 徽章）、選擇（大膽／普通／安全）、成功／失敗、實際效果（`abilityDelta`、`statDelta`、`incomeYen` 等）。
- 分類與結果以**事件發生當下保存的值**為準（`processedEventIDs` 內的 `category`、`success` 等），不用目前特性或階段重新計算。
- 以 `eventOccurrenceID` 識別每一筆，**不以 `cardID` 去重**；同一張卡在不同時點的紀錄全部保留。
- 「故障リスク加算」（`injuryAdded`）不是實際受傷，兩者不得混寫。
- 舊資料缺少時顯示「記録なし」或「詳細記録なし」，**不得顯示成當年沒有事件**。找不到 `cardID` 對應卡名時顯示安全代稱，不刪除紀錄。
- 驗收：同卡多次發生、無事件年度與缺資料年度的區別、未知 `cardID`、HS／U／CORP 階段的 encounter→training 分類保存值、展開／收合、PC／手機。

### 5.3 INJ-UI-01（I1＝公開）

- 位置：「コンディション」。總值直接可見，細目以展開方式查看，不以說明文字占滿主畫面。
- 名稱候選：「健康診断時の故障リスク」。註明：這是**目前狀態下季中健康診斷單次判定的機率**，不是全年所有傷病或 TJ 的總機率；之後的事件仍可能改變數值。
- 細目順序忠實反映計算（`player-injury.js:80-91`）：基礎 15＋前季延續 `injNext`＋年齡／理論派 → 鐵人／玻璃規則 → 今季一時加算 `tmpInj` → 3～95% 夾限。
- 鐵人是**前段**上限 10、玻璃是前段下限 40、兩者並存前段固定 25；`tmpInj` 在其後才加。**不得把所有細目直接相加，也不得寫成「鐵人時最終機率不超過 10%」**。例：鐵人調整前 21%、`tmpInj`＋10 → 10＋10＝20%。
- **健康診斷完成後**，不得把重算出的當前數字當成剛才那次判定實際使用的機率（診斷後 `injNext` 歸零、`tmpInj` 到下季開始才重置，數字會變）。診斷後的顯示方式在實作細部計畫中提出。
- 判定與顯示共用同一純函式（§4 的 `injuryRiskBreakdown`）；查看、展開、切頁、重繪都不改遊戲狀態、不消耗 RNG。
- 驗收：所有特性組合（無／理論派／鐵人／玻璃／鐵人＋玻璃）、年齡邊界（24／25、31／32、34／35）、`tmpInj` 為負（求婚 −5）、3%／95% 夾限、診斷前後的顯示、重繪前後 RNG 次數不變，以及固定 seed 投手／野手前後比較（R3）。


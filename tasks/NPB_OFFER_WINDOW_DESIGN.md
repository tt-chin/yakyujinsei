# NPB 一軍保有權空窗的海外 offer（KBO／CPBL）：設計決策請求（草案）

狀態：**待 code owner 決定。本文件不是已批准的規格，不授權實作。**
對應：BACKLOG `NPB-OFFER-WINDOW-01`（`SPEC_PENDING`）。code owner 於 [PR #120 留言](https://github.com/tt-chin/yakyujinsei/pull/120#issuecomment-7082868439) 決定：此空窗**不認定為原意，也不直接批准修正**；須區分赴美制度與其他海外移籍，不以入札制度概括全部海外 offer。相關：`MLB-POSTING-DESIGN-01`（[PR #126](https://github.com/tt-chin/yakyujinsei/pull/126)，`tasks/MLB_POSTING_DESIGN.md`）。
讀碼基準：`origin/dev` `09e014a5598f65dbf3146f2c4abe6aeaa5d53a94`（2.0.0）。

## 1. 目的與範圍

本文件只整理空窗年度中 **KBO／CPBL 的季末海外 offer** 如何處理。赴美（MLB／MiLB）的處理由 PR #126 決定，本文件只列兩者的介面（§3 Q2）。殿堂、能力、成績、薪資公式不變。

## 2. 現況（讀碼）

### 2.1 空窗的範圍

條件：NPB 一軍（`S.lv==='NPB1'`）、合約到期（`S.ct.remainingYears<=0`）、`S.faElig` 為 true，且 NPB 年資 `serviceTime.NPB` <9。

- `movement-gate.js:9`：進入 `movement()` 前先設 `S.faElig = serviceTime.NPB>=8`。
- `career-movement.js:262-266`：`movement()` 內一軍年數 `S.svc`≥5（或換過聯盟，`:263`）時把 `S.faElig` 設為 true。
- `:334`：合約到期且 `S.faElig` 時改走 `faFlow(o)` 並 return，不走到 `:340` 的 `crossOffers(o)`。
- `faFlow`（`:196-207`）在 NPB 的分支：
  - 年資 <8：`contractStageFor('NPB')` 為 `CONTROL`（`control-period-policy.js:6`），在 **`:199`** 以 `renewAndAdvance(1,false,'CONTROL')` 續約 1 年後 return。`:202` 的同類判定對 NPB 不會執行到（BACKLOG 原記 `:202`，應為 `:199`）。
  - 年資 =8：只有「権利を行使せず残留」與「国内FAを宣言」。國內 FA 市場只有 NPB 球團（`:223`），因此也沒有 KBO／CPBL／MLB offer。
  - 年資 ≥9：可宣告海外 FA，`faMarket` 才會加入 KBO（ovr≥47、`lastD`≥1）、CPBL（ovr≥45、`lastD`≥0）、MLB（ovr≥60、`lastD`≥2）（`:223`）。

### 2.2 空窗是連續的

空窗內的續約都是 1 年，所以續約後每季都是合約到期年，每季都走 `faFlow`，一次也不呼叫 `crossOffers`。

- `S.svc` 每個一軍季 +1，不看出賽量（`:265`）；`serviceTime.NPB` 以 145 日登錄換算（`movement-gate.js:9`）。全季一軍時空窗至少為 svc 5～8 的 4 季，有二軍期間則更長。
- 延長合約（`:329-330`）需要 `remainingYears===1`。`remainingYears` 是未付年度數（`contract-policy.js:9`），1 年續約在季末應為 0，因此空窗內不會觸發延長。**此點為讀碼推論，未以執行確認。**
- 進入空窗時若持有多年合約，非到期年度照常走 `crossOffers`；空窗從該合約到期那年開始。

### 2.3 對照：一軍 1～4 年

合約到期時，NPB 先 `S.ct=null`，再由 `markClubInitiatedRenewal(1)` 續約（`:336-337`，畫面「チーム契約更新…在籍${S.svc}/5年」），然後照常呼叫 `crossOffers(o)`。合約期間中的每季也會呼叫。因此 svc 1～4 年每季都可能有 KBO／CPBL／MLB offer，到了 svc 5 反而消失。

`crossOffersRule`（`:163-171`）在 NPB1 時，KBO 與 CPBL offer 各由 `overseasOffer`（`:156-162`）產生：門檻分別為 KBO ovr≥47、`lastD`≥1，CPBL ovr≥45、`lastD`≥0；每種 offer 以 `pickRecord` 抽 1 隊。接受時 `buyoutRemaining()`（選手都合 70%，`:87-90`），`signTo(…,ri(1,3),1.3,'OVERSEAS',{contractType:'OVERSEAS_FA'})`。選單標題 `crossOfferTitle('overseas_transfer')` 為「シーズン後の海外移籍オファー」（`career-policy.js:27-31`）。

### 2.4 由來

- `S.svc>=5` 時 `faElig=true`：初始 commit `8b1dabf`（`movement()` 內註解「解除球団 5 年控制期制限」）。
- NPB 年資 <8 只做保有權續約：1.3.0 `c33b2a2`（2026-08-31，「薪資システムをv1.3.0へ更新」）。
- 兩者組合後才形成空窗。`c33b2a2` 前的 `faFlow` 行為未調查。

### 2.5 實例

HOF-NATURAL-SAMPLE-01 S3b（`f3289a1`，本機 macOS＋Brave 158，scratch 紀錄）：`target-mlb` 36 條中，有 4 條在空窗年度達到 MLB offer 門檻（季末 OVR≥60 且 `lastD`≥2），但都只得到 `CONTROL` 續約（[研究計畫](HOF_NATURAL_SAMPLE_PLAN.md) §9）。KBO／CPBL 門檻較低，受影響的條數沒有計算過。

## 3. 待決事項

### Q1. 處理方式（不附建議）

- **案 A：維持現狀。** 把空窗寫入 `CURRENT_SPEC.md`：保有權續約期間（svc≥5 且 NPB 年資 <9）不出現 KBO／CPBL 季末 offer。
  影響：不改程式、RNG 與同 seed 結果。規格會留下「svc 1～4 年有 offer、svc 5 起沒有」的反差。
- **案 B：比照 svc 1～4 年。** 空窗年度完成保有權續約後，也產生 KBO／CPBL offer（MLB 依 Q2）。
  影響：從第一個符合 offer 條件的空窗年度起，RNG 消耗增加（`pickRecord`，接受時另有 `ri(1,3)`），同 seed 結果隨之改變。
- **案 C：只在國內 FA 年。** 只在 NPB 年資 =8 的 FA 選單加入 KBO／CPBL offer，年資 <8 維持現狀。
  影響：差異只出現在年資 8 那一年；年資 5～7 的空窗保留。

### Q2. 與 PR #126（MLB ポスティング）的關係

PR #126 P1 有兩案：案 A 以 posting 取代 NPB1 的 MLB offer；案 B 只在本空窗新增 posting 申請。本案採 B 或 C 時需決定：

- 空窗年度的 MLB offer：維持不出現，由 #126 決定；或本案先比照 KBO／CPBL 一起產生。
- 若 #126 也在空窗新增 posting：同一年中 posting 申請與 KBO／CPBL offer 是同一選單並列，還是有先後順序。
- 實作時機：本案單獨實作，或等 #126 決定後合併成一次 R3 變更（固定 seed 回歸與許可差異只做一次）。

### Q3. offer 條件

採 B 或 C 時，是否沿用 §2.3 的現行門檻與每種 1 隊。

### Q4. 續約與 offer 的順序

svc 1～4 年的到期路徑是 `S.ct=null` 後 `markClubInitiatedRenewal`，再呼叫 `crossOffers`；空窗路徑是 `renewAndAdvance(…,'CONTROL')` 直接建立下年度合約（`startYear:S.year+1`）。兩者的續約年俸計算不同（`CONTROL` 使用 `calculateControlOffer`）。採 B 或 C 時需決定：

- 沿用哪一條續約路徑。
- 接受 offer 時是否照常 `buyoutRemaining()`（選手都合 70%）處理剛續約、尚未開始的合約。各路徑下 `buyoutRemaining` 的實際支付額未以執行確認。

### Q5. 畫面用語

現行標題「シーズン後の海外移籍オファー」與選項名稱（「韓国プロ野球への海外移籍」「台湾プロ野球への海外移籍」）不含 MLB 也成立。若需新增說明文字（例如保有權期間中的 offer），措辭需批准（AGENTS §4）。

### Q6. 風險分類與版本

- 案 A：只改規格文件（R0），不升版。
- 案 B／C：改變移籍流程與 RNG 消耗、同 seed 結果改變，屬 **R3**（AGENTS §6.1）。實作前須列出許可差異、固定 seed 的投手／野手回歸範圍與 Full（GitHub 手動）條件。
- 版本區分待決：視為既有規格內的條件分岐修正（PATCH），或移籍制度擴充（MINOR）（AGENTS §9.2）。

## 4. 決定後的下一步

1. code owner 決定 Q1～Q6。
2. 案 A：更新 `CURRENT_SPEC.md` §11，BACKLOG 結案。
3. 案 B／C：依決定把本文件改寫為規格，同步 `CURRENT_SPEC.md` §11，另行取得實作授權後才開始實作（R3）。

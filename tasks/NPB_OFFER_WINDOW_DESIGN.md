# NPB 一軍保有權空窗的海外 offer（KBO／CPBL）：定案規格（未實作）

狀態：**已批准設計規格（code owner 於 [PR #127 留言](https://github.com/tt-chin/yakyujinsei/pull/127#issuecomment-7111768280)，2026-11-23 決定 Q1～Q6）。未授權實作**；實作屬 R3、MINOR，另行取得授權。草案的待決選項（Q1 案 A／B／C 等）見 commit `3114d7d`，本文件 §3 以定案取代。
對應：BACKLOG `NPB-OFFER-WINDOW-01`。code owner 先前於 [PR #120 留言](https://github.com/tt-chin/yakyujinsei/pull/120#issuecomment-7082868439) 決定：此空窗**不認定為原意**；須區分赴美制度與其他海外移籍。赴美依 `MLB-POSTING-DESIGN-01` 的定案（[PR #126 留言](https://github.com/tt-chin/yakyujinsei/pull/126#issuecomment-7111666298)，`tasks/MLB_POSTING_DESIGN.md`）；兩案的季末流程一起開發、一起驗證。
讀碼基準：`origin/dev` `09e014a5598f65dbf3146f2c4abe6aeaa5d53a94`（2.0.0）；2026-11-24 於 `b6286fd` 重新核對 §2 所引行號，結果相同。

## 1. 目的與範圍

本文件規定空窗年度中 **KBO／CPBL 的季末海外 offer**，以及它與赴美入札、第 8 年國內 FA 的季末整合順序（§4）。赴美流程本身依 `tasks/MLB_POSTING_DESIGN.md`。不調整能力、成績、殿堂與既有薪資公式。

## 2. 現況（讀碼；實作前的行為）

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

合約到期時，NPB 先 `S.ct=null`，再由 `markClubInitiatedRenewal(1)` 設定待處理續約（`:336-337`，畫面「チーム契約更新…在籍${S.svc}/5年」），然後照常呼叫 `crossOffers(o)`。`markClubInitiatedRenewal` 只寫入 `careerSession.pendingOffseasonSalary`（`career-contract.js:199-201`），下年度合約之後才由 `finalizePendingOffseasonSalary`（`:171`）建立，所以 offer 選擇時沒有現約、接受不付買斷金。合約期間中的每季也會呼叫 `crossOffers`。因此 svc 1～4 年每季都可能有 KBO／CPBL／MLB offer，到了 svc 5 反而消失。

`crossOffersRule`（`:163-171`）在 NPB1 時，KBO 與 CPBL offer 各由 `overseasOffer`（`:156-162`）產生：門檻分別為 KBO ovr≥47、`lastD`≥1，CPBL ovr≥45、`lastD`≥0；每種 offer 以 `pickRecord` 抽 1 隊。接受時 `buyoutRemaining()`（選手都合 70%，`:87-92`），`signTo(…,ri(1,3),1.3,'OVERSEAS',{contractType:'OVERSEAS_FA'})`。選單標題 `crossOfferTitle('overseas_transfer')` 為「シーズン後の海外移籍オファー」（`career-policy.js:27-31`）。

### 2.4 由來

- `S.svc>=5` 時 `faElig=true`：初始 commit `8b1dabf`（`movement()` 內註解「解除球団 5 年控制期制限」）。
- NPB 年資 <8 只做保有權續約：1.3.0 `c33b2a2`（2026-08-31，「薪資システムをv1.3.0へ更新」）。
- 兩者組合後才形成空窗。`c33b2a2` 前的 `faFlow` 行為未調查。

### 2.5 實例

HOF-NATURAL-SAMPLE-01 S3b（`f3289a1`，本機 macOS＋Brave 158，scratch 紀錄）：`target-mlb` 36 條中，有 4 條在空窗年度達到 MLB offer 門檻（季末 OVR≥60 且 `lastD`≥2），但都只得到 `CONTROL` 續約（[研究計畫](HOF_NATURAL_SAMPLE_PLAN.md) §9）。KBO／CPBL 門檻較低，受影響的條數沒有計算過。

## 3. 定案（code owner 決定 Q1～Q6）

### Q1：補齊所有空窗年度（採案 B 的方向）

- NPB 一軍保有權／FA 流程中的空窗年度，只要符合條件，也產生 KBO／CPBL 季末海外報價。
- 不採維持現狀，也不只限於 NPB 年資第 8 年。
- 與草案案 B 的順序不同：**先完成去留選擇，選擇留隊後才完成續約**；不可先續約再立即買斷剛建立、尚未開始的合約。

### Q2：與 MLB 入札制度的關係

- 美國路線完全依 #126 定案（`tasks/MLB_POSTING_DESIGN.md`）。
- 未取得海外 FA 前不恢復直接赴美 offer；赴美走申請入札，海外 FA 路線另行保留。
- 季末可選擇申請入札或韓台移籍；入札未獲准、無報價或玩家拒絕赴美報價後，仍可考慮符合資格的韓台報價。
- 韓台不新增球團同意抽選或入札制度。
- 與 #126 協調開發及整合驗證季末流程，避免兩案各自建立互相衝突的續約／簽約順序。

### Q3：沿用現有報價門檻與數量

- KBO：ovr ≥47、`lastD` ≥1。
- CPBL：ovr ≥45、`lastD` ≥0。
- 各聯盟提供 1 隊，沿用現有產生規則；不調整薪資公式或報價門檻。

### Q4：續約、買斷與報價保留

- 先產生並處理移籍選擇，確認留隊後才完成續約；保有權續約維持既有 `CONTROL` 薪資計算，不改為其他續約計價方式。
- 原合約已到期時，不支付剩餘合約買斷金，不為結算另建一份下年度合約。
- **尚未到期的原合約轉往 KBO／CPBL 時，維持現行 70% 買斷金規則**。#126「入札成功不支付 70% 買斷金」只適用赴美入札成功路線。
- 入札失敗或拒絕赴美報價後，保留同年度已產生的韓台報價；不重新抽球團、不重算報價條件，也不允許藉重開選單重抽。
- 所有適用移籍選項均放棄後，才走留隊續約；原約尚未到期者維持原約。

#### 第 8 年國內 FA 的銜接

- 保留符合資格的國內 FA 選擇。
- 選擇探索市場不立即完成簽約。
- 實際接受一份合約後，才結束當年度其他移籍流程，避免重複簽約或重複結算。
- 國內 FA、赴美入札及韓台報價的畫面切換，不造成既有報價被重抽或原約被提早覆寫。

### Q5：畫面用語

- 沿用「シーズン後の海外移籍オファー」「韓国プロ野球への海外移籍」「台湾プロ野球への海外移籍」。
- 不新增將韓台移籍描述為入札的文字；赴美依 #126 已批准用語。

### Q6：風險、版本與驗證

- R3；與入札制度協調後以 MINOR 功能更新處理。
- 開發端整理新增報價、選擇分支及 RNG 消耗的許可差異，並共同驗證兩案的季末流程。
- 固定 seed 投手／野手回歸範圍與 Full（GitHub 手動）條件由開發端列明。
- 不調整能力、成績、殿堂與既有薪資公式；不能用「同 seed 允許改變」概括豁免無法解釋的差異。

## 4. 季末整合順序（兩案共通；由 §3 與 #126 定案推導）

NPB 一軍、未低於現役下限、非全休、未降格時：

1. **產生當年度選項並保存**：符合 Q3 門檻的 KBO／CPBL 報價（各 1 隊）；符合 #126 P2 的「ポスティングを申請」；第 8 年加上國內 FA 宣言；到期年加上留隊。
2. **入札**（若申請）：同意抽選 → 報價有無 → 玩家接受／拒絕。接受即赴美，原約結束、無 70% 買斷（#126 P6），結束當年度移籍流程。
3. **其他選項**：入札未獲准、無報價或拒絕後回到同一組已保存的韓台報價／國內 FA，不重抽（Q4）。接受韓台報價時，原約未到期付 70% 買斷，已到期不付。
4. **留隊**：所有移籍選項放棄後才續約。原約未到期維持原約；到期則依既有流程續約（svc 1～4 年的待處理續約、空窗年度的 `CONTROL` 續約、第 8 年的「権利を行使せず残留」）。

### 4.1 實作邊界（開發端整理，待實作計畫提出並確認）

以下**不是 code owner 的個別決定**；實作計畫須逐項提出處理方式，未決者先確認再實作。

1. **空窗路徑的順序變更**：現行 `faFlow` `:199` 在任何選擇前就以 `renewAndAdvance` 建立下年度合約；須改為步驟 4 才續約，並確認 `CONTROL` 薪資計算的輸入（年資、評價）在延後後不變。
2. **第 8 年國內 FA**：`declareFA` 立即設定 `S.faUsed`、`S.npbFaSeasons=0`（`:203`）；探索市場後回到其他選項時，這些狀態如何保留或還原，須在計畫中提出（Q4「選擇探索市場不立即完成簽約」）。
3. **報價保存的範圍**：韓台報價的 `pickRecord` 與 `salaryCandidate` 結果須在步驟 1 一次決定並保存，畫面切換與重繪不得再呼叫；與 #126 新增抽選的先後順序決定同 seed 差異起點，列入許可差異。
4. **svc 1～4 年到期路徑**：現行已是「待處理續約後才 offer」，不需改順序；赴美成功或接受韓台報價時須清除 `pendingOffseasonSalary`（現行接受韓台時的處理未以執行確認）。

## 5. 驗證案例（實作時補齊）

- 空窗年度（svc 5～8 且年資 <8）、第 8 年國內 FA、年資 ≥9（不屬空窗，現行 `faMarket` 不變）。
- 原約已到期／未到期 × 韓台接受／全部拒絕；買斷金 0／70%。
- 入札成功／未獲准／無報價／拒絕報價後選韓台或留隊。
- 報價不重抽：重繪、重開選單、國內 FA 探索後返回，韓台球團與條件不變、RNG 消耗 0。
- 簽約與結算不重複：同年度只建立一份新合約，不同時存在續約與移籍合約。
- 固定 seed 投手／野手回歸：許可差異起點為首個符合條件的空窗年度或首次入札申請年度；其前完整 S 與 RNG 一致。Full 於 GitHub 手動執行。

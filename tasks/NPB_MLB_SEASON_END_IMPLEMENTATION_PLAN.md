# NPB 季末移籍整合（MLB-POSTING-DESIGN-01＋NPB-OFFER-WINDOW-01）：實作計畫

狀態：**已實作、待 GitHub 手動 Full**（2026-11-25，使用者授權實作，結果見 §10）。兩案規格已批准（`tasks/MLB_POSTING_DESIGN.md` P1～P8、`tasks/NPB_OFFER_WINDOW_DESIGN.md` Q1～Q6）。§8 Q4 已由 code owner 決定 (a)（2026-11-28），實作見 §12。本文件提出兩份規格「實作邊界」各項的處理方式、新文字草案、許可差異與驗證範圍，供確認。
分類：R3（移籍流程、RNG 消耗、同 seed 結果改變）、MINOR，併入 2.1.0（§8 Q1）。
讀碼基準：`84291592dfdc004082ffe6d15b75450fb4bc138b`（PR #127 head）；`origin/dev` `13b921b`（#127 合併後）的 `docs/src/engine` 與 `docs/src/ui/choice-prompt.js` 與其相同（`git diff` 確認）。`docs/src/ui/decision-presentation.js` 等 UI 檔於 `8964d62` 有變更，入札子選單的呈現於 scratch 草稿階段確認。
dev 後續變更（2026-11-25 確認，`origin/dev` `b2ab72d`）：`f9ae156` 在 `career-movement.js` 新增 1 行 import，本文件引用的該檔行號在 dev 上 +1；`faFlow` 對非國內 FA 新增本聯盟球團路由（NPB 國內 FA 不變）。實作時以當時的 dev 重新確認行號與 F 各項。

## 1. 範圍

- 改：NPB 一軍季末的赴美流程（未取得海外 FA 前改為入札）；空窗年度與第 8 年的韓台報價；兩案共通的季末選單順序。
- 不改：能力、成績、殿堂、既有薪資／posting fee 公式、韓台報價門檻與數量、NPB 年資 ≥9 的海外 FA 路線、MLB／KBO／CPBL 所屬時的移籍流程、全休年與降格流程。
- 不新增 `S` 欄位、不改存檔格式（§3 D5）。

## 2. 讀碼事實（`8429159`）

| # | 事實 | 位置 |
|---|---|---|
| F1 | NPB 一軍季末 offer 由 `crossOffersRule` 依 KBO→CPBL→MLB 順序產生；每個符合門檻的 offer 在產生時 `pickRecord` 抽 1 次（`R()` 1 次），接受時 `ri(1,3)` 抽年數 | `career-movement.js:156-172` |
| F2 | MLB offer 門檻 ovr≥60、`lastD`≥2，與 P2 申請資格相同 | `:158`、`:171` |
| F3 | **延長合約 offer 那年也會走到 `crossOffers`**：`extensionOffer` 接受延長時先以 `appendContractExtension` 把延長年數併入 `S.ct`（`appendExtension`，`startYear:S.year+1`）並記錄 `NEW_CONTRACT` 年俸決定，之後才呼叫 `crossOffers(o)`；拒絕延長也呼叫 `crossOffers(o)`。規格 MLB §2.2「例外」與 §4 第 1 點此處讀碼有誤，兩案決定（#126 P6、#127 Q1）是在此錯誤前提下作成（§8 Q4） | `career-contract.js:92-103`、`:202` |
| F4 | 不走到 `crossOffers` 的 NPB 一軍季末：全休年（`:260`）、降格（`:313`、`:316`）、合約到期且 `S.faElig`（改走 `faFlow`，`:334`） | `career-movement.js` |
| F5 | `faFlow` 對 NPB：年資 <8 時 `contractStageFor('NPB')` 為 `CONTROL`，`:199` 立即 `renewAndAdvance(1,false,'CONTROL')`；年資 8 為 `FA` 階段，選單「権利を行使せず残留」（`renewAndAdvance(1)`）／「国内FAを宣言」；≥9 加「海外FAを宣言」 | `:196-207`、`career-contract.js:134`、`control-period-policy.js:3-6` |
| F6 | `:199` 同時處理 KBO／CPBL（未取得 FA）與 MLB（<3 年）的 `CONTROL`；本案只改 `S.org==='NPB'` 的情況 | `:198-199` |
| F7 | `declareFA` 立即寫入 `S.faType`、`S.faUsed=true`、`S.npbFaSeasons=0` 後進入 `faMarket`；市場以 `FA:${year}:${faType}` 快取於 `S.lastFaMarket`，同年同種別再進入不重新產生（首次產生時 `generateBidJitters` 使用 `R`） | `:203`、`:220-221`、`:225` |
| F8 | `signTo` 會清除 `careerSession.pendingOffseasonSalary`，並以 `candidate.postingEligible`（NPB→MLB／MiLB、NPB 年資 <9、`S.faType!=='OVERSEAS'`、非戰力外）計 posting fee，收款者 `candidate.sourceTeamId` | `career-contract.js:157`、`:232` |
| F9 | `buyoutRemaining()` 對已到期合約：未付年度為 0，買斷 0、不出卡；仍會寫 `S.transferSalarySnapshot` 並設 `S.ct=null`、`S.currentSalary=0` | `career-movement.js:87-101`、`contract-policy.js:42` |
| F10 | `chance(p)` 為 `R()*100<p`，1 次 `R()` | `game.js:101` |
| F11 | 存檔只在年初（`startYear` → `browserSave.capture`）；季末選單中的暫存狀態不入存檔 | `game.js:310` |
| F12 | 季末選單重繪由 `restorePendingChoice` 以同一組 `opts` 重新 `choose`，不重新呼叫產生函式；`MovementGate` 擋同年度重入 `movement()` | `ui/choice-prompt.js:10-15`、`movement-gate.js:10-19` |
| F13 | `salaryCandidate`、`createSigningBonusTerms`、`getCrossLeaguePolicy` 不呼叫 RNG（`signing-bonus-policy.js`、`cross-league-market-policy.js` 無 RNG 呼叫；`salaryCandidateRule` 本體無 RNG）。`renewAndAdvance` 本體無 RNG。2026-11-25 scratch 草稿以 `american-service-e2e` 的 NPB1 空窗 fixture（P／IF）執行確認：選單上選留隊後，除 `rngState` 外完整 `S`（含 `S.ct`、`lastSalaryDecision`）與現行立即續約相同，新增的抽選只有選項產生時的 `pickRecord` 1 次（§7） | `career-contract.js:144-158`、`:248` |

## 3. 設計

### D1　RNG 順序（決定許可差異起點）

- 產生季末選項時，KBO→CPBL→MLB 的 `pickRecord` 位置與次數**與現行相同**；MLB 的球團在產生時先抽好，入札報價成立時才顯示。
- 申請入札時才新增抽選：同意 `chance(同意率)` 1 次；同意後 `chance(90)` 1 次（有報價）；接受報價時 `ri(1,3)` 1 次（與現行接受 MLB offer 相同）。
- 結果：未申請入札的年度，季末選項產生的 RNG 消耗與現行相同；空窗年度則因新產生韓台／入札選項而新增 `pickRecord`。
- 替代案（不建議）：同意後才抽球團。會使所有 MLB 門檻到達年度（即使未申請）的 RNG 位移，差異起點提前。

### D2　共通選項產生

- 從 `crossOffersRule` 的 NPB 分支（`:167-172`）抽出 `npbSeasonEndMenu(o,title,before,after,finish)`（scratch 草稿名稱，待確認），回傳 `{title,before,after,finish,offers,posting,postingResolved}`；`showNpbSeasonEndMenu(menu)` 依 `before`→韓台／MLB 直接 offer→入札（未處理時）→`after` 的順序 `choose`。
  - 入札 option 由 `postingOption(o,menu)` 產生：NPB 年資 <9 時取代「MLBへの海外移籍」（D4）；≥9 時維持現行直接 offer（D7）。
- `crossOffersRule` 與 `faFlow`（NPB）共用此函式，產生順序固定 KBO→CPBL→MLB。

### D3　空窗年度（`faFlow`，NPB、年資 <8）

- 改 `:199`：`S.org==='NPB'` 時先呼叫 `npbSeasonEndMenu`。
  - 無任何 option：照現行立即 `renewAndAdvance(1,false,'CONTROL')`（行為、卡片、RNG 不變）。
  - 有 option：`choose(crossOfferTitle('overseas_transfer'), [...options, {t:'現在の球団に残留',main:true,f:()=>renewAndAdvance(1,false,'CONTROL')}])`。
- 續約延後到選擇之後；`renewAndAdvance` 的輸入（`S.currentSalary`、`currentMarketRating()`、`serviceYearsFor('NPB')`、`S.marketInjury`）在產生選項期間不被改寫（F13），薪資計算與現行同函式同參數。**實作後以單元測試比對延後前後的 `S.ct`／`lastSalaryDecision`**。
- 接受韓台：原約已到期，`buyoutRemaining()` 買斷 0（F9），之後 `signTo`。到期合約保留到選擇時（比照 `:338` 海外滿約「進路確定まで保持」），不先設 `S.ct=null`。
- KBO／CPBL 等其他聯盟的 `CONTROL` 分支不變（F6）。

### D4　入札流程（NPB 年資 <9）

1. 選單 option：`t:'ポスティングを申請'`，`s:` 契約見込み（§4 T1）。
2. 點選後：`chance(同意率)`，同意率依 `serviceYearsFor('NPB')`：<3 20%、3～4 40%、5～6 60%、7～8 80%（P4，整數年資）。
   - 不同意：`card` 標題「球団が申請を認めず」→ 回到選單（D6）。
   - 同意：`card` 標題「球団が容認」→ `chance(90)`。
     - 無報價：`card` 標題「入札球団なし」→ 回到選單。
     - 有報價：`choose` 報價選單：「ポスティングで${球団名}と契約」（`s:` 沿用現行 MLB offer 的級別／年俸／契約金表示）＋拒絕 option（§4 T2）。
3. 接受：**不呼叫 `buyoutRemaining()`**，`signTo('MiLB',lv,teamId,ri(1,3),1.3,'OVERSEAS',{contractType:'OVERSEAS_FA'})`（與現行 MLB offer 相同參數）→ `reportFlowOutcome({kind:'CROSS_OFFER_RESOLVED'})`。原約由新合約取代而結束；`pendingOffseasonSalary` 由 `signTo` 清除（F8）；posting fee 照既有規則（F8）。`MLB_INTL_RESTRICTED` 由 `salaryCandidate` 照舊套用。
4. 卡片內文：P7 只批准標題語。內文草案見 §4 T4，需批准。
5. 未解決：成功時不經 `buyoutRemaining`，`S.transferSalarySnapshot` 不更新。`previousSalaryForOffer` 先讀 `S.currentSalary`，預期不影響；實作時以測試確認 posting 合約的 `previousSalary` 與現行 MLB offer 相同。

### D5　當年度狀態保存

- 以 closure 內的 `menu` 物件保存當年度已產生的 option 與入札結果，不新增 `careerSession` 欄位。理由：`MovementGate` 已擋同年度重入 `movement()`，重繪由 `restorePendingChoice` 以同一組 `opts` 重新 `choose`（F12）；新增 `careerSession` 欄位須同步 `career-session.js`、`tests/support/career-session-access.mjs` 欄位清單與 `docs/design/STATE_AND_RNG_REFERENCE.md`。
- 回到選單時以保存的 option 重建，不再呼叫 `npbSeasonEndMenu`；入札已處理則移除入札 option（P3 每年一次）。第 8 年取消 FA 宣言的還原點同樣以 closure 變數（草稿名 `faReturn`）保存。
- 不新增 `S` 欄位，不改 `browser-save-state-contract.js`。季末中途重新載入會從年初存檔重播（F11），同一 RNG 狀態下重播結果應相同。**重播一致性尚未以執行確認，列入驗證（§6 V6）**。

### D6　第 8 年（NPB 年資 =8、到期）

- 選單：「権利を行使せず残留」「国内FAを宣言」＋`npbSeasonEndMenu` 的韓台／入札 option。
- 「国内FAを宣言」：先保存 `S.faType`、`S.faUsed`、`S.npbFaSeasons` 原值，再照現行進入 `faMarket`。
- FA 市場（`showFaMarket` 的有報價與無報價兩種畫面）加返回 option（§4 T3），**只在第 8 年從整合選單進入時顯示**。返回時還原三個欄位，回到整合選單。
- 再次宣言時市場由 `S.lastFaMarket` 快取顯示，不重新產生（F7）。
- 接受 FA 市場報價（含宣言殘留、無報價時與原球團 1 年契約）才結束當年度移籍流程；「現役を退く」維持現行。
- 年資 ≥9 的 `faFlow` 選單不變（不屬空窗；P1 海外 FA 路線維持）。

### D7　維持現狀的範圍

- NPB 年資 ≥9、合約期間中：`crossOffers` 的「MLBへの海外移籍」照舊（不需同意、fee 0、未到期付 70%）。P7「海外 FA 路線使用獨立用語」：現行用語已與入札用語不同，**不改用語**（開發端決定，§8 Q3）。
- 全休年：照舊沒有季末 offer（P2 前季 `lastD` 與全休不相容；規格 MLB §4 第 1 點）。
- 降格年：已非一軍，不符合 P2。
- 延長合約交涉年：**code owner 決定 (a)（2026-11-28），見 §12**。以下為決定前的分析：依 F3，接受延長後才出現季末 offer；若入札照一般年度處理，玩家可先簽延長再入札成功赴美，剛簽、尚未開始的延長即被取代，與 #126 P6「入札結果確定前不完成續約，避免先簽續約再赴美」及 #127 Q1「不可先續約再立即買斷剛建立、尚未開始的合約」的原則衝突。接受延長後轉韓台時，`buyoutRemaining` 以併入延長後的 `S.ct` 計算 70% 買斷，含延長年數，此為現行行為（2026-11-25 以 `contract-policy.js` 實際執行確認：年俸 1 億円、剩 1 年時買斷 7,000 万円；併入 2 年、年俸 1.5 億円的延長後為 2.8 億円，未付年數 1→3）。
- 延長交涉的發生條件（`movement()`）：`S.ct.remainingYears===1`、一軍、`S.faElig`、`lastD`≥1、`chance(45)`。空窗年度皆為 1 年合約、季末已到期，不會遇到延長交涉；NPB 年資 <9 又可能遇到的，主要是換過聯盟而 `S.faElig` 為 true 並簽下多年合約者（如海外回歸的 `RETURN` 合約 `ri(1,3)` 年）。此為讀碼推定，未以執行確認頻率。

## 4. 新文字草案（需批准，AGENTS §4）

| # | 位置 | 草案 | 說明 |
|---|---|---|---|
| T1 | 「ポスティングを申請」的 `s:` | `球団の判断後に入札｜${級別}契約の見込み｜年俸${金額}` | P5 申請前提示。受 `MLB_INTL_RESTRICTED` 時，`級別` 會顯示小聯盟級別 |
| T2 | 入札報價選單的拒絕 option | `契約せず他の選択肢に戻る` | 拒絕後回到整合選單；選單已含「現在の球団に残留」 |
| T3 | FA 市場的返回 option（第 8 年） | `FA宣言を取り消して戻る` | 還原 `faUsed` 等欄位後回到整合選單 |
| T4 | 三張結果卡的內文 | 容認：`球団がポスティング申請を認めた。`／不認：`球団はポスティング申請を認めなかった。今季の申請はできない。`／無報價：`入札する球団は現れなかった。今季の申請はできない。` | 標題用 P7 已批准語 |
| T5 | 入札報價選單標題 | `ポスティング入札` | `choose` 標題 |

## 5. 許可差異（同 seed，新程式 vs 基準 SHA）

| # | 差異 | 起點 |
|---|---|---|
| A1 | 空窗年度（NPB 年資 <8、svc≥5、到期）有任一符合 Q3／P2 的 option 時，新增季末選單與 `pickRecord` 1～3 次 | 首個符合條件的空窗年度 |
| A2 | 第 8 年選單新增韓台／入札 option 與 `pickRecord` | 該年 |
| A3 | 「MLBへの海外移籍：球団名」改為「ポスティングを申請」（年資 <9）；選單文字與 option 數不變，RNG 不變 | 首個 MLB 門檻到達年度（顯示差異，非 RNG 差異） |
| A4 | 申請入札後新增 `chance` 1～2 次；成功時無 70% 買斷卡與買斷金 | 首次申請年度 |

- A5（狀態，無 RNG）：第 8 年宣告國內 FA 後取消時，只還原 `faType`／`faUsed`／`npbFaSeasons`；`S.faMarketKey` 與 `S.lastFaMarket`（`acceptedOfferId:null`）保留。`lastFaMarket` 是重新宣告時不重抽的快取（#127 Q4「不允許藉重開選單重抽」）；兩欄位目前除 FA 市場本身外無讀取者。
- 起點之前：完整 `S` 與 RNG 狀態一致。
- 起點之後的差異都須能追溯到 A1～A4；不能以「同 seed 允許改變」概括。
- 自動選擇的測試若原本依「MLBへの海外移籍」字樣挑選 option，A3 會使其挑選結果改變，須個別列出（§7）。

## 6. 驗證

| # | 內容 | 方式 |
|---|---|---|
| V1 | 同意率四區間邊界（年資 2／3、4／5、6／7、8）、資格邊界（年資 8／9、ovr 59／60、`lastD` 1／2、二軍）；`franchise` 特性有無時資格與同意率相同（P4） | 新增單元測試（stub RNG） |
| V2 | 不同意／無報價／拒絕後：同年度韓台 option 的球團與條件不變、RNG 消耗 0、入札 option 消失；隔年可再申請 | 單元測試 |
| V3 | 原約已到期／未到期 × 韓台接受：買斷 0／70%；入札成功：買斷 0、posting fee 金額與收款者、不計入生涯收入、`MLB_INTL_RESTRICTED` 仍適用 | 單元測試＋既有 `global-contract-market` 相關測試 |
| V4 | 同年度只建立一份新合約；空窗年度選擇留隊後的 `S.ct`／`lastSalaryDecision` 與現行立即續約相同 | 單元測試（同輸入比對）＋`american-service-e2e` NPB1 fixture（scratch 已確認，§7） |
| V5 | 第 8 年：宣言→返回→其他選項，`faUsed`／`faType`／`npbFaSeasons` 還原；再宣言市場不重抽 | 單元測試 |
| V6 | 季末選單中途重新載入（年初存檔重播）結果一致；重繪、`restorePendingChoice` 不重抽 | E2E（既有存檔 E2E 的延伸，入口待調查） |
| V7 | 固定 seed 投手／野手回歸：基準 SHA 與新程式每年起始的 `S` 與 RNG 消耗數比對；首個差異年度須是 A1～A4 之一 | scratch probe，結果記錄於報告；必要時納入既有比較測試 |
| V8 | 關聯單元／E2E、Quick | 本機 |
| V9 | Full | **GitHub 手動（使用者執行）**，確定 commit 後提出 |

## 7. 測試影響（scratch 草稿結果，2026-11-25）

草稿：基準 `origin/dev` `b2ab72d7ef510f8fa84c9e3ba2b1392d188fbd05`，只改 `career-movement.js`（+58／−9，D1～D6；Q4 暫依現行順序，`extensionOffer` 不改；文字用 §4 草案）。不提交。環境 macOS＋Brave 158（Playwright 1.59 shim），非 CI。

- Quick：110 PASS／5 FAIL。5 個 FAIL 入口於乾淨 `b2ab72d` 重跑皆 PASS（確認由草稿造成）。
- Full 專屬的相關 E2E 以 manifest 參數個別直接執行（未用 Full profile，AGENTS §6.2）：結果見下表。Full 本身未執行。
- 草稿外的 scratch 單元探測（stub RNG，20 案例 PASS）：同意率邊界、資格邊界、不同意／無報價／拒絕報價後回選單且韓台 option 為同一物件（不重抽）、成功不呼叫 `buyoutRemaining`、`ri(1,3)` 1 次、第 8 年 FA 宣言取消還原、`franchise` 不影響、年資 ≥9 選單不變。5 個突變（同意率區間、`postingResolved`、成功時加買斷、還原、留隊續約種類）皆以 `ERR_ASSERTION` FAIL。

| 入口 | 草稿 | 正式實作的處理 | 對應 |
|---|---|---|---|
| `npb-return-ui.test` | FAIL | vm 載入清單補上新函式；`{lastD:3}`／`crossOffers(65)` 情境改為許可差異期待值（MLB option 改為入札，葉 44→46）。其餘情境與基準一致，選項產生時 `pickRecord`／`salaryCandidate` 順序不變 | A3／A4 |
| `salary-flow.test` | FAIL | CareerMovement 抽選呼叫計數 `[R,ri,chance,pick]` `[0,2,11,0]`→`[0,3,13,0]`（同意、報價、接受年數） | A4 |
| `fa-market-policy.test` | FAIL | 原始碼文字守衛「FA 市場外不變」加入本次核准變更 | 文字耦合 |
| `american-service-e2e` | FAIL | NPB1 fixture（年資 4、到期）屬空窗年度：改為期待台灣報價選單＋`pickRecord` 1 次，選留隊後比對續約結果（V4，scratch 已確認可行） | A1 |
| `global-contract-market-e2e`（Full） | FAIL | 等待「MLBへの海外移籍」逾時；改為入札流程，補同意／報價情境 | A3／A4 |
| `contract-salary-e2e`（Full） | FAIL 379／2 | `cross-NPB1-MLB` 同上；`career-IF`（`jp3-infielder-01`）第 257 步分歧：2040 年海外回歸球員的空窗年度出現韓台選單，之前完整 state／動作／RNG 一致。改為比對到 A1 起點並斷言分歧點為空窗選單 | A1／A3 |
| `kbo-renewal-e2e` | FAIL | ① 自動選擇器點到 FA 比較表排序按鈕而無限迴圈：比照 `b2ab72d` 排除 `button:not([data-fa-sort])`（測試缺陷，因生涯路線改變而暴露）；② 歷史生涯比對同在第 257 步分歧，無法再走到 2049 年 KBO2 失敗點。建議採 (a)：比對到 A1 起點並斷言分歧點為空窗選單；2049 年缺陷由同檔既有 fixture（第 69～76 行）驗證，並新增「fixture 的上限檢查輸入等於 `old.final.failure.input`」斷言。不採 (b) 另找 seed：需同時滿足舊版失敗與全程不經空窗，範圍窄且日後規則變更即失效。Full 專用的第 64 行比對同樣比到 A1 起點 | A1 |
| `npb-return-e2e`、`stage10-risk-e2e`（Full） | PASS | 不需修改 | — |
| 其餘 Quick 108 項 | PASS | 不需修改 | — |

- A1 在自然生涯中會出現：上述 `jp3-infielder-01` 的海外回歸球員（換過聯盟、`S.faElig` 為 true、NPB 年資 <8、到期）即進入空窗年度。
- `career-movement.js`、`career-contract.js`、`movement-gate.js` 不在 `287dd1a` 凍結清單內。期待值變更皆須對應 §5 的許可差異，由 code owner 確認。

## 8. 決定事項

Q3、Q5 屬開發端整理範圍（AGENTS §2 沿用既有用語；`tasks/MLB_POSTING_DESIGN.md` P8 與 `tasks/NPB_OFFER_WINDOW_DESIGN.md` Q6 將許可差異交由開發端整理，AGENTS §6.1 R3 要求事前明示），改為開發端決定並記錄於此，編號保留。2026-11-25 使用者決定 Q1、Q2、Q6，Q4 暫依 (c) 並標為待決。

| # | 事項 |
|---|---|
| Q1 | **使用者決定（2026-11-25）：併入 2.1.0**。選項為併入 dev 上尚未發布的 2.1.0，或另採 2.2.0（`origin/main` 為 2.0.0 已發布，`origin/dev` 為 2.1.0） |
| Q2 | **使用者決定（2026-11-25）：採用 §4 T1～T5 草案**（超出 P7 已批准用語的措辭，`tasks/MLB_POSTING_DESIGN.md` §4 第 6 點） |
| Q3 | **開發端決定**：D7，年資 ≥9 合約期間中的「MLBへの海外移籍」維持現行用語 |
| Q4 | **code owner 決定 (a)（2026-11-28，[待決事項](CODE_OWNER_DECISIONS_2026-11-28.md) §1），2.3.0 實作，見 §12**。原為待決並暫依 (c)（2026-11-25）。延長合約交涉年的處理順序（F3、D7）：(a) 入札與韓台報價放在延長交涉之前，放棄所有移籍選項後才交涉延長；(b) 接受延長後當年不可申請入札（拒絕延長則照一般年度）；(c) 維持現行順序（接受延長後仍可入札／韓台）。另請確認接受延長後轉韓台的 70% 買斷（含延長年數，D7）是否維持現行。影響範圍見 D7：空窗年度不會遇到延長交涉，主要是換過聯盟並簽多年合約者。決定後一併更正 `tasks/MLB_POSTING_DESIGN.md` §2.2 與 §4 第 1 點「延長合約 offer 那年不走到 `crossOffers`」的讀碼錯誤 |
| Q5 | **開發端決定**：D1 RNG 順序（產生時先抽 MLB 球團；未申請入札的年度 RNG 消耗與現行相同） |
| Q6 | **使用者授權實作（2026-11-25）**，分支沿用 PR #128 的 `feat/npb-mlb-season-end` |

## 9. 步驟

1. scratch 草稿實作 D2～D6，跑關聯測試與 Quick，補 §7 T table，提出確認。（2026-11-25 完成，結果見 §7；Q4 決定後若改順序須重跑）
2. 正式實作＋新增單元測試（V1～V5）。（2026-11-25 完成，§10）
3. V6～V8；reviewer。（V7、V8 完成；V6 NOT_RUN，§10）
4. `CURRENT_SPEC.md` §11.7 改寫、版本與 `CHANGELOG.md`／`RELEASE_NOTES.md`（依 Q1）。（2026-11-25 完成）
5. commit／push 到功能分支，開 PR 到 dev；提出 Full（GitHub 手動）所需的分支與完整 SHA。

## 10. 實作結果（2026-11-25，本機 macOS＋Brave 158，非 CI）

- 產品：`docs/src/engine/career-movement.js` 依 D1～D7 實作（與 §7 scratch 草稿相同，另加註解）；版本 2.1.0 不變，`CHANGELOG.md`／`RELEASE_NOTES.md`／`docs/src/data/release-notes.js`（生成）、`CURRENT_SPEC.md` 2.1.0 節與 §11.7、`BACKLOG.md` 同步。
- 新增 `tests/npb-season-end.test.mjs`（Quick，23 案例）。負控制 11 個突變（同意率兩區間、入札 90%、`postingResolved`、成功時加買斷、還原、留隊續約種類、ovr 門檻、空窗限 NPB 一軍、年資 9 界線、取消選項常駐）皆以 `ERR_ASSERTION` FAIL。
- 既有測試依 §7 T table 修改 7 檔；新斷言負控制 5 個（`npb-return-ui` 拒絕文字／入札標籤、`fa-market-policy` hunk 外與 hunk 內修改、`salary-flow` 多一個 `chance`）皆 FAIL。E2E 比對 helper 未另做突變驗證（分歧點前為嚴格比對）。`kbo-renewal-e2e` 依 §7 (a)；原建議「fixture 輸入等於 `old.final.failure.input`」不成立（fixture 是另一組前一年俸 1.6821 億円的降格情境），改為把 `old.final.failure.input` 原樣交給現行 `applyKboForeignPackageCap`，結果 800 万円、RNG 0。
- 驗證：
  - Quick 116 PASS／0 FAIL／SKIP／BLOCKED（116 入口皆執行）。
  - Full 專屬相關 E2E 個別直接執行：`contract-salary-e2e --compare=b8bc49b` 381／0；`kbo-renewal-e2e` `--quick` 與完整模式 PASS（第 64 行 `yakyo-test-001`／P、`jp3-infielder-01`／IF 與基準完全一致）；`global-contract-market-e2e --quick` PASS；`npb-return-e2e`、`stage10-risk-e2e` 於 scratch 草稿 PASS。
  - V7：`contract-salary-e2e` 的生涯比對以 `probe33-1`～`8`（P／IF／C／OF 各 2，balanced）對 `b2ab72d` 執行 8／8 PASS：7 條全程一致；`probe33-7`／C 於第 232 步分歧，為換過聯盟（`faElig`、NPB 年資 1）球員 2040 年保有權年度的韓台選單（A1），之前完整 state／動作／RNG 一致。另 `jp3-infielder-01`／IF 第 257 步（A1，§7）。
  - V4／F13：`american-service-e2e` NPB1 fixture（P／IF）選留隊後，除 `rngState` 外完整 `S` 與現行立即續約相同。
  - **V6 NOT_RUN**：季末選單中途重新載入（年初存檔重播）一致性未驗證。
- reviewer（2026-11-25）6 項，皆核對屬實：
  1. 第 8 年整合選單宣告國內 FA 且有報價時，取消選項使 `FaMarketPresentation` 的按鈕數檢查失敗、比較表不顯示 → 修正：取消選項加 `faAside:true`，`fa-market-presentation.js` 只接受報價按鈕之後的 `faAside` 選項並置於比較表之後，未標記的多餘選項仍停用比較表。`fa-market-presentation-e2e` 新增兩情境。
  2. `contract-salary-e2e` 的比對 helper 未要求基準同一步不同 → 修正：基準該步須不存在或年／動作不同。
  3. `kbo-renewal-e2e` 依 (a) 失去 2049 年 KBO2 續約的合約／年度表斷言，只剩上限檢查結果 → 已知代價，未補（需另建 2049 KBO2 fixture）。
  4. 取消宣告後 `faMarketKey`／`lastFaMarket` 殘留 → 列為 §5 A5。
  5. 例外恢復重繪後可再申請入札 → 修正：入札 option 開頭檢查 `postingResolved`；`npb-season-end.test` 新增案例（24 案例）。
  6. 第 8 年「宣告→取消→再宣告」與兩畫面的取消選項未以實際市場執行 → `global-contract-market-e2e` 新增第 8 年情境（實際 `faMarket`：比較表＋取消、欄位還原、RNG 0、同一快取、無報價畫面的取消）。
  - 修正後重跑：Quick 116 PASS／0 FAIL／SKIP／BLOCKED（116 入口）；`contract-salary-e2e --compare=b8bc49b` 381／0；`kbo-renewal-e2e` 完整模式、`global-contract-market-e2e --quick`、`fa-market-presentation-e2e` PASS。
  - 修正後負控制 5 個（移除 `postingResolved` 檢查、比較表改回嚴格按鈕數、移除 `faAside`、無報價畫面不加取消、取消按鈕不移到比較表後）皆於對應斷言 FAIL。
  - **Full：GitHub 手動、未執行**（AGENTS §6.2）。

## 11. Full 歷史比對修正

- [Full #289](https://github.com/tt-chin/yakyujinsei/actions/runs/45645665227) 保留 143 PASS／4 FAIL。PR #130 的四個入口修正以 [Tests #291](https://github.com/tt-chin/yakyujinsei/actions/runs/45778946981) 在 `197aef4f03be19b312d44c2421c6af2c7b6b4328` 驗證 Full PASS。該次 Quick job 為 skipped。
- [Full #293](https://github.com/tt-chin/yakyujinsei/actions/runs/45826779978) 受測 `7d71c8cc11e66bf99bf77bb187a5c8f25387c315`，141 PASS／7 FAIL：前述四入口仍未含 PR #130 修正，另有年度歷史畫面投影及兩個靜態／DOM期待值。後兩項由 `808216cdf041bf18cf38fcf2b85be6d74606057a` 修正，該 SHA 的 [Quick #294](https://github.com/tt-chin/yakyujinsei/actions/runs/45827896512) PASS。
- 剩餘五入口：移入 PR #130 的季末比較測試與22項 helper 案例；保留 phoenix 的2041原路線、RNG前綴及新版全程重播。顯示偏好與 GameView 共用測試投影，重建舊版最後8區塊的原始內容及出生卡位置；所有其他文字、DOM、S與RNG依原比較。新版完整年度紀錄由 `home-year-history-e2e` 驗證。比較基準維持，產品與版號仍為2.2.0。
- PR #130 後續（code owner 2026-11-26 留言第1項）：`contract-salary-e2e`、`kbo-renewal-e2e` 原以「選項文字或球團名不同」判定已核准分歧，改用共用 `seasonEndOpening`，基準同一步若為同年度季末選單（文字或球團不同亦同）即不算新選單；分歧前照常嚴格比對。兩入口停止步與修正前相同（`jp3-infielder-01`／IF 第257步，其餘全程一致）。本機（macOS＋Brave 158）：`contract-salary-e2e` 381／0、`kbo-renewal-e2e` 完整及 `--quick` PASS。負向控制：上限 +1 於兩入口 FAIL；將基準第257步改為同年度、文字不同的韓國選單時，舊判定 PASS、新判定 FAIL。
- [Full #297](https://github.com/tt-chin/yakyujinsei/actions/runs/45838234691)（PR #131，dev→main）受測 `1477317ab6ba80ff27e111cd996ae6b415122649`：149 PASS／0 FAIL（`full-aggregate` expected 149、acceptedPass 149）。
- [Tests #300](https://github.com/tt-chin/yakyujinsei/actions/runs/46021284417)（workflow_dispatch，full）受測 `f4215c553cbe0d11d17293ad38ddc1912a946543`：8 個 full-batch 均 PASS，`full-aggregate` expected 149、acceptedPass 149，0 FAIL／SKIP／BLOCKED。
- 保留舊 run 原結果。#291 只對應 `197aef4`，#300 只對應 `f4215c5`；之後的提交不沿用為 Full 證據（僅改 .md 的提交不影響測試）。

## 12. Q4 (a) 實作計畫：延長交涉移到季末選單之後

狀態：**已實作，最終 SHA 待 GitHub 手動 Full**（2026-11-28，計畫經使用者同意；[PR #140](https://github.com/tt-chin/yakyujinsei/pull/140) 依 code owner 留言補測後待 Full、併 dev 與 Preview）。依據：code owner 2026-11-28 決定 (a)（[待決事項](CODE_OWNER_DECISIONS_2026-11-28.md) §1）。分支 `feat/season-end-extension-order`（基準 `origin/dev` `21e1e33`）。R3／MINOR，版本 2.2.1→2.3.0。

### 讀碼事實（`21e1e33`）

- 延長交涉入口：`career-movement.js:389-390`，條件命中後 `extensionOffer(o)` 並 return。
- `extensionOffer`（`career-contract.js:92-103`）接受或拒絕延長，最後都呼叫 `crossOffers(o)`。
- 只有 NPB 一軍受影響：KBO1／CPBL1／MLB 的延長年合約剩 1 年，`contractNeedsRenewal` 為 false，`crossOffersRule` 直接 `finish()`，不抽籤也不出選單。
- `npbSeasonEndMenu`／`showNpbSeasonEndMenu` 已具備「入札被拒、無報價、放棄簽約後回到同一份選單，報價不重抽」。

### 設計

- E1 `career-contract.js`：`extensionOffer(o,next)`，`next` 預設 `()=>crossOffers(o)`；接受、拒絕後改呼叫 `next()`。`game.js` 包裝函式、`CareerContract` 方法與 `career-movement` 注入的 lambda 一併傳遞 `next`。預設值不變，直接呼叫 `extensionOffer(o)` 的既有測試行為照舊。
- E2 `career-movement.js`：延長條件命中（`chance(45)` 照舊抽）後，NPB 一軍改走 `extensionYearMenu(o)`：以 `npbSeasonEndMenu` 先顯示韓台報價及入札或 MLB 報價；選「現在の球団に残留」才 `extensionOffer(o,finish)`，延長結束即 `finish()`，不再顯示海外選單。沒有任何移籍選項時直接進入延長交涉。刪除 `:168` 的 Pending 註解。
- E3 70% 買斷：離隊時尚未簽延長，`buyoutRemaining()` 以當時有效的合約計算，不改程式。

### 許可差異（同 seed，新程式 vs `21e1e33`）

- B1（RNG 順序）：限「NPB 一軍且延長條件命中」的年度。舊：延長選單→延長簽約→季末選單抽 KBO、CPBL、入札／MLB 球團。新：季末選單抽籤→留隊→延長。延長交涉與接受延長實測消耗 0 次 RNG（`npb-return-e2e`），所以留隊時抽籤序列與舊順序相同，只有畫面步驟順序改變；選擇移籍時不再出現延長交涉。
- B2（狀態）：同一年度選擇離隊時，不產生延長卡、延長年俸決定與延長合約；買斷不含延長年數。
- B3：其他聯盟、其他年度無差異。

### 驗證

- 新 E2E（走 `movement()` 的 NPB 一軍延長年）：選單先出現；留隊後才延長，延長後無海外選單；選 KBO 時買斷＝當前合約 70%；入札被拒後回到同一份選單且報價不重抽，再留隊才延長；連點不重複套用。各項配負向控制。測試檔於草稿時決定。
- 既有：`contract-salary-e2e`、`npb-return-e2e`、`american-service.test`；Full-only 固定 seed 生涯比對逐一單獨執行（非 Full profile）。
- 本機關聯測試＋Quick；Full 由 code owner 於 GitHub 手動執行，提供完整 SHA。

### 文件與版本

- 2.3.0：`config.js`、`CHANGELOG.md`、`RELEASE_NOTES.md`＋`update-release-notes.mjs`、`CURRENT_SPEC.md` 標頭。
- `CURRENT_SPEC.md`「処理順序は未決」段落；`MLB_POSTING_DESIGN.md` §2.2、§4 第1點讀碼錯誤更正；本計畫 §8 Q4 改為已決定；BACKLOG 兩項完成條件。

### 步驟

1. scratch 草稿 E1～E2，量測 B1 抽籤次數，跑關聯測試與 Full-only 生涯比對，補 T table，提出確認。
2. 正式實作＋新 E2E 與負向控制；reviewer。
3. 文件與版本；Quick。
4. commit／push，開 PR 到 dev；提供 Full 用分支與完整 SHA。

### 結果（2026-11-28，本機 macOS＋Brave，非 CI）

- 產品：`career-contract.js`（E1）、`game.js`（`next` 傳遞，CRLF 保留）、`career-movement.js`（E2）。分支已快轉至 `origin/dev` `e0fc269`（2.2.2，PR #138），版本 2.2.2→2.3.0。
- 新測試：
  - `npb-season-end.test` 增延長年 8 案（33 PASS）。
  - `npb-return-e2e` 增 3 案，走真實 `movement()`，NPB 年資 7＋本季＝8，出現入札選項：留隊→延長→接受、留隊→延長→拒絕、轉 KBO（買斷 8,400 万円＝現約 70%，無延長合意）。
  - E2E fixture 補 `npbFaSeasons:0`、`npbRosterDays:0` 預設值，避免 NPB 一軍 `move()` 累積年資外洩到後續案例（reviewer 指出）。
- 期待值變更：`fa-market-policy.test` `SEASON_END_HUNKS` 增 `movement()` 延長分歧一行的還原段（限一次）。這是 B1 的許可差異；負向控制把條件改成只判 `S.org==='NPB'` 時，FAIL `ERR_ASSERTION`（movement extension year）。
- 負向控制：單元 3 項、E2E 2 項（舊順序、未傳 `next`）均 FAIL `ERR_ASSERTION`。
- 固定 seed 比對：31 個入口直接執行（基準 `origin/main` `489430d`）全 PASS。新路徑在這些生涯中未到達，到達由上述 E2E 證明。
- Quick：118 PASS／0 FAIL（`e0fc269` 加未提交修改）。
- Full：[Tests #311](https://github.com/tt-chin/yakyujinsei/actions/runs/46105290500)（workflow_dispatch，full）受測 `1524687d44a198bafbe02d7dbea839a4cf995311`：8 個 full-batch 均 PASS，`full-aggregate` expected 150、acceptedPass 150，0 FAIL／SKIP／BLOCKED。只對應該 SHA。
- code owner PR #140 留言（2026-11-28）後補測（只改 `tests/npb-return-e2e.mjs`）：
  - 新增入札被拒案例，走真實 `movement()`：申請入札只多 1 次 RNG（同意判定）；回到同一份選單，韓國／台灣按鈕文字（球團、年俸）與申請前相同；不再出現當年已處理的入札選項；留隊後延長交涉開啟一次；接受延長後不再出現海外選單。
  - 留隊路線的 RNG 消耗由 log 改為斷言：選擇留隊開啟延長交涉、接受延長、拒絕延長各 +0。
  - 負向控制 4 項均 FAIL `ERR_ASSERTION`，各落在預期斷言：被拒後重新產生選單（only the consent draw）、不設定 `postingResolved`（handled posting option not shown again）、留隊時多抽 1 次（staying … without an RNG draw）、接受延長時多抽 1 次（accepting the extension draws no RNG）。
  - 本機：`npb-return-e2e` 26 案 PASS、Quick 118 PASS／0 FAIL。Tests #311 只對應 `1524687`；最終 SHA 的 Full 由 code owner 在 GitHub 手動執行。
- 最終 SHA 的 Full：[Tests #312](https://github.com/tt-chin/yakyujinsei/actions/runs/46109049151)（workflow_dispatch，full）受測 `36c44680d338310c5890fe50ecf8d88136e57e07`：8 個 full-batch 均 PASS，`full-aggregate` expected 150、acceptedPass 150。PR #140 已併 dev（`f02b7cde7a8fca9389d3adeb2e1832a6b41dd7d6`），dev push 的 Quick（Tests #313）PASS；Preview 待使用者確認。

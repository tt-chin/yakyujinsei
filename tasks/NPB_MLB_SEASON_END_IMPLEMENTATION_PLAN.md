# NPB 季末移籍整合（MLB-POSTING-DESIGN-01＋NPB-OFFER-WINDOW-01）：實作計畫（草案）

狀態：**計畫草案，未授權實作**。兩案規格已批准（`tasks/MLB_POSTING_DESIGN.md` P1～P8、`tasks/NPB_OFFER_WINDOW_DESIGN.md` Q1～Q6），產品實作須另行取得 code owner 授權。本文件提出兩份規格「實作邊界」各項的處理方式、新文字草案、許可差異與驗證範圍，供確認。
分類：R3（移籍流程、RNG 消耗、同 seed 結果改變）、MINOR。版本號待 code owner 決定（§8）。
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
| F13 | `salaryCandidate`、`createSigningBonusTerms`、`getCrossLeaguePolicy` 不呼叫 RNG（`signing-bonus-policy.js`、`cross-league-market-policy.js` 無 RNG 呼叫；`salaryCandidateRule` 本體無 RNG）。`renewAndAdvance` 本體無 RNG。**整條路徑無 RNG 尚未以執行確認** | `career-contract.js:144-158`、`:248` |

## 3. 設計

### D1　RNG 順序（決定許可差異起點）

- 產生季末選項時，KBO→CPBL→MLB 的 `pickRecord` 位置與次數**與現行相同**；MLB 的球團在產生時先抽好，入札報價成立時才顯示。
- 申請入札時才新增抽選：同意 `chance(同意率)` 1 次；同意後 `chance(90)` 1 次（有報價）；接受報價時 `ri(1,3)` 1 次（與現行接受 MLB offer 相同）。
- 結果：未申請入札的年度，季末選項產生的 RNG 消耗與現行相同；空窗年度則因新產生韓台／入札選項而新增 `pickRecord`。
- 替代案（不建議）：同意後才抽球團。會使所有 MLB 門檻到達年度（即使未申請）的 RNG 位移，差異起點提前。

### D2　共通選項產生

- 從 `crossOffersRule` 的 NPB 分支（`:167-172`）抽出 `npbSeasonEndOffers(o,finish)`（命名待確認），回傳 `{kbo,cpbl,mlb}`，各為 option 或 null。
  - `mlb`：NPB 年資 <9 時為入札申請 option（D4）；≥9 時維持現行「MLBへの海外移籍」直接 offer（D7）。
- `crossOffersRule` 與 `faFlow`（NPB）共用此函式，產生順序固定 KBO→CPBL→MLB。

### D3　空窗年度（`faFlow`，NPB、年資 <8）

- 改 `:199`：`S.org==='NPB'` 時先呼叫 `npbSeasonEndOffers`。
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

- 以 `careerSession.npbSeasonEndContext={state,year,options,postingResolved,...}`（命名待確認）保存當年度已產生的 option 與入札結果，比照現有 `npbReturnOfferContext`（`:175-190`）的 state／year 綁定與防重入。
- 回到選單時以保存的 option 重建，不再呼叫 `npbSeasonEndOffers`；入札已處理則移除入札 option（P3 每年一次）。
- 不新增 `S` 欄位，不改 `browser-save-state-contract.js`。季末中途重新載入會從年初存檔重播（F11），同一 RNG 狀態下重播結果應相同。**重播一致性尚未以執行確認，列入驗證（§6 V6）**。

### D6　第 8 年（NPB 年資 =8、到期）

- 選單：「権利を行使せず残留」「国内FAを宣言」＋`npbSeasonEndOffers` 的韓台／入札 option。
- 「国内FAを宣言」：先保存 `S.faType`、`S.faUsed`、`S.npbFaSeasons` 原值，再照現行進入 `faMarket`。
- FA 市場（`showFaMarket` 的有報價與無報價兩種畫面）加返回 option（§4 T3），**只在第 8 年從整合選單進入時顯示**。返回時還原三個欄位，回到整合選單。
- 再次宣言時市場由 `S.lastFaMarket` 快取顯示，不重新產生（F7）。
- 接受 FA 市場報價（含宣言殘留、無報價時與原球團 1 年契約）才結束當年度移籍流程；「現役を退く」維持現行。
- 年資 ≥9 的 `faFlow` 選單不變（不屬空窗；P1 海外 FA 路線維持）。

### D7　維持現狀的範圍

- NPB 年資 ≥9、合約期間中：`crossOffers` 的「MLBへの海外移籍」照舊（不需同意、fee 0、未到期付 70%）。P7「海外 FA 路線使用獨立用語」：現行用語已與入札用語不同，**不改用語**（需確認，§8 Q3）。
- 全休年：照舊沒有季末 offer（P2 前季 `lastD` 與全休不相容；規格 MLB §4 第 1 點）。
- 降格年：已非一軍，不符合 P2。
- 延長合約交涉年：**未定，待 §8 Q4**。依 F3，接受延長後才出現季末 offer；若入札照一般年度處理，玩家可先簽延長再入札成功赴美，剛簽、尚未開始的延長即被取代，與 #126 P6「入札結果確定前不完成續約，避免先簽續約再赴美」及 #127 Q1「不可先續約再立即買斷剛建立、尚未開始的合約」的原則衝突。接受延長後轉韓台時，`buyoutRemaining` 以併入延長後的 `S.ct` 計算 70% 買斷，推定含延長年數（讀碼推定，未以執行確認），此為現行行為。

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

- 起點之前：完整 `S` 與 RNG 狀態一致。
- 起點之後的差異都須能追溯到 A1～A4；不能以「同 seed 允許改變」概括。
- 自動選擇的測試若原本依「MLBへの海外移籍」字樣挑選 option，A3 會使其挑選結果改變，須個別列出（§7）。

## 6. 驗證

| # | 內容 | 方式 |
|---|---|---|
| V1 | 同意率四區間邊界（年資 2／3、4／5、6／7、8）、資格邊界（年資 8／9、ovr 59／60、`lastD` 1／2、二軍）；`franchise` 特性有無時資格與同意率相同（P4） | 新增單元測試（stub RNG） |
| V2 | 不同意／無報價／拒絕後：同年度韓台 option 的球團與條件不變、RNG 消耗 0、入札 option 消失；隔年可再申請 | 單元測試 |
| V3 | 原約已到期／未到期 × 韓台接受：買斷 0／70%；入札成功：買斷 0、posting fee 金額與收款者、不計入生涯收入、`MLB_INTL_RESTRICTED` 仍適用 | 單元測試＋既有 `global-contract-market` 相關測試 |
| V4 | 同年度只建立一份新合約；空窗年度選擇留隊後的 `S.ct`／`lastSalaryDecision` 與現行立即續約相同 | 單元測試（同輸入比對） |
| V5 | 第 8 年：宣言→返回→其他選項，`faUsed`／`faType`／`npbFaSeasons` 還原；再宣言市場不重抽 | 單元測試 |
| V6 | 季末選單中途重新載入（年初存檔重播）結果一致；重繪、`restorePendingChoice` 不重抽 | E2E（既有存檔 E2E 的延伸，入口待調查） |
| V7 | 固定 seed 投手／野手回歸：基準 SHA 與新程式每年起始的 `S` 與 RNG 消耗數比對；首個差異年度須是 A1～A4 之一 | scratch probe，結果記錄於報告；必要時納入既有比較測試 |
| V8 | 關聯單元／E2E、Quick | 本機 |
| V9 | Full | **GitHub 手動（使用者執行）**，確定 commit 後提出 |

## 7. 測試影響（初步 grep，T table 待 scratch 草稿確認）

直接參照移籍程式或文字的測試：`tests/career-movement-policy.mjs`、`tests/npb-return-ui.test.mjs`、`tests/verify-modularization.mjs`、`tests/year-flow.test.mjs`、`tests/retirement-hof-pilot.mjs`、`tests/global-contract-market-e2e.mjs`、`tests/npb-return-e2e.mjs`、`tests/stage10-risk-e2e.mjs`、`tests/contract-salary-e2e.mjs`。`career-movement.js`、`career-contract.js`、`movement-gate.js` 不在 `287dd1a` 凍結清單內。

完整 T table（每個入口：預期 PASS／需改期待值／理由）在 scratch 草稿上跑過關聯測試與 Quick 後補上；期待值變更須對應 §5 的許可差異。

## 8. 待 code owner 決定

| # | 事項 |
|---|---|
| Q1 | 版本號：併入 dev 上尚未發布的 2.1.0，或另採 2.2.0（2026-11-25：`origin/main` 為 2.0.0 已發布，`origin/dev` 為 2.1.0） |
| Q2 | §4 T1～T5 文字 |
| Q3 | D7：年資 ≥9 合約期間中的「MLBへの海外移籍」維持現行用語 |
| Q4 | 延長合約交涉年的處理順序（F3、D7）：(a) 入札與韓台報價放在延長交涉之前，放棄所有移籍選項後才交涉延長；(b) 接受延長後當年不可申請入札（拒絕延長則照一般年度）；(c) 維持現行順序（接受延長後仍可入札／韓台）。另請確認接受延長後轉韓台的 70% 買斷是否維持現行。決定後一併更正 `tasks/MLB_POSTING_DESIGN.md` §2.2 與 §4 第 1 點「延長合約 offer 那年不走到 `crossOffers`」的讀碼錯誤 |
| Q5 | D1 RNG 順序（產生時先抽 MLB 球團） |
| Q6 | 實作授權 |

## 9. 步驟（授權後）

1. scratch 草稿實作 D2～D6，跑關聯測試與 Quick，補 §7 T table，提出確認。
2. 正式實作＋新增單元測試（V1～V5）。
3. V6～V8；reviewer。
4. `CURRENT_SPEC.md` §11.7 改寫、版本與 `CHANGELOG.md`／`RELEASE_NOTES.md`（依 Q1）。
5. commit／push 到功能分支，開 PR 到 dev；提出 Full（GitHub 手動）所需的分支與完整 SHA。

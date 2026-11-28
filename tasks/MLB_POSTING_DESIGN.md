# MLB ポスティング制度：定案規格（未實作）

狀態：**已批准設計規格（code owner 於 [PR #126 留言](https://github.com/tt-chin/yakyujinsei/pull/126#issuecomment-7111666298)，2026-11-23 決定 P1～P8）。未授權實作**；實作屬 R3、MINOR，另行取得授權。草案的待決選項與建議見 commit `065986e`，本文件 §3 以定案取代。
對應：BACKLOG `MLB-POSTING-DESIGN-01`。相關：`NPB-OFFER-WINDOW-01`（[PR #127](https://github.com/tt-chin/yakyujinsei/pull/127)，`tasks/NPB_OFFER_WINDOW_DESIGN.md`）；兩案的季末流程須一起開發、一起驗證，整合順序見該文件 §4。
讀碼基準：`origin/dev` `09e014a5598f65dbf3146f2c4abe6aeaa5d53a94`（2.0.0）；2026-11-24 於 `b6286fd` 重新核對 §2 所引行號，結果相同。

## 1. 目的與範圍

code owner 的決定（PR #120）：現實中尚未取得海外 FA 權的球員，可向母球團提出挑戰 MLB 的意願，經母球團同意後透過ポスティングシステム交涉；提出意願不等於必定獲准。遊戲現有的海外 offer 不直接視為已完整實作此制度。

本文件只規定**赴美（NPB → MLB／MiLB）**的流程。KBO／CPBL 的海外 offer 不改成入札制度，其空窗見 `NPB-OFFER-WINDOW-01`。本案不調整能力、成績、殿堂、既有薪資與 posting fee 公式。

## 2. 現況（讀碼與現行規格；實作前的行為）

### 2.1 現行規格的「遊戲簡化 posting」

`CURRENT_SPEC.md` §11.7（自 1.9.0 `ad5b778`）：

- 既有 NPB 非海外 FA 的赴美轉隊分類為遊戲簡化 posting，**無需新增球團同意抽選**；已有海外 FA 權或戰力外則 fee=0。
- Major／Minor posting fee 公式、收款者為原 NPB 球團、fee 不計入選手收入。
- 只處理 NPB → 美國；KBO／CPBL 不虛構 posting。

程式對應：`career-contract.js:157` 的 `postingEligible`（NPB → MLB／MiLB、NPB 年資 <9、非海外 FA、非戰力外再契約），`:232` 簽約時以 `calculatePostingFee` 計 fee。

本案實作時，§11.7「無需新增球團同意抽選」一句改為 §3 的同意抽選規則。

### 2.2 赴美 offer 何時出現（`docs/src/engine/career-movement.js`）

- `movement()` 最後呼叫 `crossOffers(o)`（`:340`）。NPB 一軍（`S.lv==='NPB1'`）時，`crossOffersRule`（`:163`）同時產生 KBO／CPBL／MLB 三種 offer（`:169-171`）。
- MLB offer 條件：ovr ≥60 且前季 `lastD` ≥2（`overseasOffer`，`:156-162`；`:171` 的 `minD=2`）。offer 產生時即以 `pickRecord` 抽球團，接受時 `ri(1,3)` 決定年數。
- **合約期間中每一季**都會走到 `:340`，所以合約未到期也會收到 MLB offer；接受時以選手都合解約處理（`buyoutRemaining()`，`:87-92`，預設 70%）。
- svc 1～4 年合約到期：NPB 先 `S.ct=null`，再 `markClubInitiatedRenewal(1)`（`:336`）。後者只寫入 `careerSession.pendingOffseasonSalary`（`career-contract.js:199-201`），下年度合約由 `finalizePendingOffseasonSalary`（`:171`）之後建立，因此 `crossOffers` 時沒有現約，接受 offer 不付買斷金。
- 例外（不走到 `:340`）：低於現役下限引退（`:256`）、全休年（`:260`）、降格（`:313`、`:316`）、延長合約 offer 那年（`:329-330`）（2026-11-28 更正：此處讀碼有誤，`extensionOffer` 接受或拒絕延長後都呼叫 `crossOffers`，`career-contract.js:92-103`；2.3.0 依 code owner 決定 (a) 改為季末選單在前、留隊後才延長，見[實作計畫](NPB_MLB_SEASON_END_IMPLEMENTATION_PLAN.md) §12）；合約到期且 `S.faElig`（一軍年數 ≥5 或換過聯盟，`:262-265`）時改走 `faFlow`（`:334`）。
- `faFlow`（`:196-207`）對 NPB：年資 <8 時 `contractStageFor('NPB')` 為 `CONTROL`，在 `:199` 以 `renewAndAdvance(1,false,'CONTROL')` 立即建立下年度合約（草案原記 `:202`，對 NPB 不會執行到）；8 年可宣告國內 FA；≥9 年才可宣告海外 FA（`:205`）。這是 `NPB-OFFER-WINDOW-01` 的空窗：該期間 KBO／CPBL／MLB offer 都不出現。
- 赴美契約條件沿用 `salaryCandidate`；無美國經驗且非（25 歲以上且年資 ≥6）者為 `MLB_INTL_RESTRICTED`（`cross-league-market-policy.js:24-25`），以既有規則處理契約金與級別。

## 3. 定案（code owner 決定 P1～P8）

機率為遊戲平衡設定，並非現實統計。

### P1：統一未取得海外 FA 前的赴美流程（採案 A）

- NPB 一軍、尚未取得海外 FA 權時，現有「MLBへの海外移籍」改為「申請 → 母球團判斷 → 報價／交涉 → 玩家決定」。
- 不限於補既有空窗年度；符合資格的空窗年度也能申請。
- 取得海外 FA 權後，保留獨立的海外 FA 赴美路線，不需要母球團同意，不收 posting fee。
- KBO／CPBL 海外移籍不改成入札制度，其既有空窗另案處理（`NPB-OFFER-WINDOW-01`）。

### P2：申請資格

- NPB 一軍。
- NPB 累計年資未滿 9 年（尚未取得海外 FA 權）。
- 綜合 ovr ≥60、既有前季成績評價 `lastD` ≥2。
- 沿用既有年資與評價資料，不新增另一套計算方式。

### P3：申請時機與次數

- 每年季末皆可申請，不限合約到期年度；合約期間中也可申請。
- 每年最多申請一次。未獲准、無報價或玩家拒絕報價後，當年度不得重抽；隔年符合資格可再申請。

### P4：母球團同意

以 NPB 累計年資（`serviceTime.NPB`，整數；不是同球團年資）計算：

| NPB 累計年資 | 同意率 |
|---|---:|
| 未滿 3 年 | 20% |
| 3～4 年 | 40% |
| 5～6 年 | 60% |
| 7～8 年 | 80% |

- 採機率判定，允許新增 RNG。
- `franchise` 不一律禁止赴美，第一版也不加入該特性的同意率補正；既有交易保護效果不直接延伸至入札。
- 不新增拒絕後的懲罰或士氣系統。

### P5：報價、契約與赴美資格

- 母球團同意後，固定 10% 無球團提出報價、90% 取得報價；第一版不依成績調整此機率。
- 契約薪資沿用 `salaryCandidate`；posting fee 沿用現行公式及收款規則，支付給原 NPB 球團，不列入選手生涯收入。
- 母球團同意與「能否直接簽 MLB 合約」分開判斷。沿用 `MLB_INTL_RESTRICTED` 等既有資格限制與契約金／級別規則，不因獲准入札而解除限制。
- 申請前提示玩家是否受限制、可能只能取得小聯盟合約。
- 取得報價後可查看條件，選擇接受或拒絕並留隊；拒絕後當年度不得再次申請。

### P6：成功、失敗及季末流程銜接

- 不同意、無報價或玩家拒絕報價時：原約未到期則維持原約；到期才依適用的既有續約流程處理。
- 不對所有失敗情況一律強制執行保有權續約；仍保留符合資格的國內 FA／KBO／CPBL 移籍選擇。
- 入札結果確定前不完成續約，避免先簽續約再赴美。
- 入札成功赴美時原合約結束，**不支付剩餘合約 70% 買斷金**；posting fee 仍由母球團收取。
- 隔年符合資格可再申請，不新增額外懲罰。

### P7：畫面用語（已批准）

- 「ポスティングを申請」
- 「球団が容認」
- 「球団が申請を認めず」
- 「入札球団なし」
- 「ポスティングで○○と契約」

未取得海外 FA 前，以入札申請用語取代原本直接赴美選項；海外 FA 路線使用獨立用語。保留對實際 MLB／小聯盟契約條件的清楚提示。

### P8：風險、版本與驗證

- R3，功能版本 MINOR。
- 允許因新增入札流程及 RNG 消耗而產生同 seed 生涯差異；不得以此概括豁免無法解釋的差異。
- 開發端在實作前整理許可差異、固定 seed 投手／野手的回歸範圍，以及 Full（GitHub 手動）驗證條件。
- 原合約 70% 買斷金的取消僅適用本案入札成功路線。

## 4. 實作邊界（開發端整理，待實作計畫提出並確認）

以下由 §2 讀碼與 §3 定案推導，**不是 code owner 的個別決定**。實作計畫須逐項提出處理方式，未決者先確認再實作。

1. **提前 return 的年度**：P3 為「每年季末」，但現行全休年（`:260`）、降格（`:313`、`:316`）、延長合約 offer 那年（`:329-330`）都不走到 `crossOffers`（2026-11-28 更正：延長合約 offer 那年實際上會走到 `crossOffers`；處理順序由 code owner 決定 (a)，見實作計畫 §12）。降格後已非一軍，不符合 P2；全休年與延長交涉年是否可申請，須在計畫中提出。
2. **已取得海外 FA 權（NPB 年資 ≥9）**：P1 的範圍是「未取得海外 FA 前」。依字面，≥9 年合約期間中 `crossOffers` 的「MLBへの海外移籍」（不需同意、fee=0、70% 買斷）及到期時 `faMarket` 的海外 FA 路線維持現狀；是否另改用語（P7「海外 FA 路線使用獨立用語」）須在計畫中確認。
3. **RNG 順序**：現行 MLB offer 在 `crossOffers` 產生時即 `pickRecord`。新流程新增同意抽選 1 次、報價有無 1 次；球團與條件在哪一步抽取、與 KBO／CPBL offer 的抽取先後，決定同 seed 差異的起點，須列入許可差異。
4. **不重抽**：每年一次及拒絕後不重抽，須以當年度狀態保存結果，重繪、重開選單、重新進入付款入口都不得再抽（參考 `crossOffersRule` 既有 `npbReturnOfferContext` 的防重入模式，`:175-186`）。
5. **成功時的契約處理**：合約期間中成功時，原約結束而不呼叫 `buyoutRemaining()`；到期年成功時，須清除 svc 1～4 年路徑已寫入的 `pendingOffseasonSalary`，空窗路徑則依 `NPB-OFFER-WINDOW-01` 改為先決定去留後續約。posting fee 記在新合約、收款者為原 NPB 球團（§11.7 既有規則）。
6. **申請前提示**：受 `MLB_INTL_RESTRICTED` 限制時，申請前顯示「可能只能取得小聯盟合約」等提示；措辭若超出 P7 已批准用語，須另行批准（AGENTS §4）。

## 5. 驗證案例（實作時補齊）

- 資格：一軍／二軍、年資 8／9、ovr 59／60、`lastD` 1／2。
- 同意率四個年資區間的邊界（2／3、4／5、6／7、8）。
- 合約期間中與到期年；svc 1～4 年到期路徑與空窗路徑；第 8 年國內 FA 年。
- 不同意、無報價、拒絕報價後：原約維持或依既有續約；同年度韓台報價與國內 FA 仍可選；當年度不得再申請；隔年可再申請。
- 成功：原約結束且無 70% 買斷；posting fee 金額與收款者；不計入生涯收入；`MLB_INTL_RESTRICTED` 仍適用。
- 不重抽：重繪、重開選單、重新進入付款入口，RNG 消耗 0、結果不變。
- 固定 seed 投手／野手回歸：列出許可差異起點（同意／報價抽選首次出現的年度），其前的完整 S 與 RNG 一致；Full 於 GitHub 手動執行。

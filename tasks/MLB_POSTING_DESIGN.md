# MLB ポスティング制度：設計決策請求（草案）

狀態：**待 code owner 決定。本文件不是已批准的規格，不授權實作。**
對應：BACKLOG `MLB-POSTING-DESIGN-01`（`DESIGN_PENDING`；由 code owner 於 [PR #120 留言](https://github.com/tt-chin/yakyujinsei/pull/120#issuecomment-7082868439) 決定另案設計）。相關：`NPB-OFFER-WINDOW-01`（`SPEC_PENDING`）。
讀碼基準：`origin/dev` `09e014a5598f65dbf3146f2c4abe6aeaa5d53a94`（2.0.0）。

## 1. 目的與範圍

code owner 的決定（PR #120）：現實中尚未取得海外 FA 權的球員，可向母球團提出挑戰 MLB 的意願，經母球團同意後透過ポスティングシステム交涉；提出意願不等於必定獲准。遊戲現有的海外 offer 不直接視為已完整實作此制度。

本文件只整理**赴美（NPB → MLB／MiLB）**的流程決策。KBO／CPBL 的海外 offer 與其空窗（`NPB-OFFER-WINDOW-01`）不在本案範圍，不以入札制度概括。殿堂、能力、成績規則不變。

## 2. 現況（讀碼與現行規格）

### 2.1 現行規格已有「遊戲簡化 posting」

`CURRENT_SPEC.md` §11.7（自 1.9.0 `ad5b778`）：

- 既有 NPB 非海外 FA 的赴美轉隊分類為遊戲簡化 posting，**無需新增球團同意抽選**；已有海外 FA 權或戰力外則 fee=0。
- Major／Minor posting fee 公式、收款者為原 NPB 球團、fee 不計入選手收入。
- 只處理 NPB → 美國；KBO／CPBL 不虛構 posting。

程式對應：`career-contract.js:157` 的 `postingEligible`（NPB → MLB／MiLB、NPB 年資 <9、非海外 FA、非戰力外再契約），`:232` 簽約時以 `calculatePostingFee` 計 fee。

因此本案是**把現行「無同意抽選」的簡化 posting 升級**，必然改寫 §11.7 的「無需新增球團同意抽選」一句。

### 2.2 赴美 offer 何時出現（`docs/src/engine/career-movement.js`）

- `movement()` 最後呼叫 `crossOffers(o)`（`:340`）。NPB 一軍（`S.lv==='NPB1'`）時，`crossOffersRule`（`:163`）同時產生 KBO／CPBL／MLB 三種 offer（`:169-171`）。
- MLB offer 條件：ovr ≥60 且前季 `lastD` ≥2（`overseasOffer`，`:156-162`；`:171` 的 `minD=2`）。
- **合約期間中每一季**都會走到 `:340`，所以合約未到期也會收到 MLB offer；接受時以選手都合解約處理（`buyoutRemaining()`，`:87-90`，預設 70%）。
- 例外（不走到 `:340`）：低於現役下限引退、全休年、降格等提前 return；延長合約 offer 那年（`:329-330`）；合約到期且 `S.faElig`（一軍年數 ≥5 或換過球團，`:262-265`）時改走 `faFlow`（`:334`）。
- `faFlow`（`:196-207`）在 NPB 年資 <8 時只做保有權續約（`:202`），8 年可宣告國內 FA，≥9 年才可宣告海外 FA（`:205`）。這就是 `NPB-OFFER-WINDOW-01` 的空窗：該年 KBO／CPBL／MLB offer 都不出現。
- 赴美契約條件沿用 `salaryCandidate`；無美國經驗且非（25 歲以上且年資 ≥6）者為 `MLB_INTL_RESTRICTED`（`cross-league-market-policy.js:24-25`），以既有規則處理契約金與級別。

### 2.3 現況與 code owner 意圖的差距

| 項目 | 現況 | code owner 描述的制度 |
|---|---|---|
| 選手提出意願 | 沒有「申請」步驟；offer 條件滿足就直接列出 | 選手向母球團提出 |
| 母球團同意 | 無（規格明定不抽選） | 需經母球團同意，不一定獲准 |
| 時機 | 合約期間中每季都可能出現 | 未指定 |
| 空窗年度 | 不出現 | 未指定 |

## 3. 待決事項

標「建議」者為提案方意見與理由，code owner 可推翻。P1 兩案並列，不附建議。

### P1. 與現有 MLB offer 的關係

- **案 A：取代。** NPB1 的「MLBへの海外移籍」offer 改為ポスティング流程（申請 → 球團判斷 → 入札／交涉）。KBO／CPBL offer 不變。
  影響：所有 NPB1 季末的赴美路線都改變，同 seed 結果的差異範圍大。
- **案 B：只補空窗。** 現有 MLB offer 不變，只在 `NPB-OFFER-WINDOW-01` 空窗年度（合約到期、`faElig`、NPB 年資 <8）新增ポスティング申請。
  影響：差異只出現在空窗年度；但合約期間中「無同意即可赴美」的現況保留。

### P2. 申請資格

建議：NPB 一軍、NPB 年資 <9（尚無海外 FA 權，與 `postingEligible` 一致）、ovr ≥60 且前季 `lastD` ≥2（沿用現有 MLB offer 門檻）。
理由：不另立新門檻，與既有規則及 fee 判定一致。

### P3. 申請時機

建議：只在季末合約到期年度申請；合約期間中不可申請。
理由：符合「向母球團提出」的流程，也避免每季都出現。採案 B 時本項自然限定為空窗年度。

### P4. 母球團同意的判定

建議：規則＋機率。NPB 年資越長同意機率越高；有 `franchise` 特性（現行文字為「球団はトレードを拒否する」，`:273`）時不同意。
理由：對應「不一定獲准」。注意這會新增 RNG 抽取，並改寫 §11.7「無需新增球團同意抽選」。
替代：完全確定性規則（例如年資門檻），不新增 RNG。

### P5. 入札與交涉結果

建議：可能無球團入札（交涉不成立）；成立時契約沿用 `salaryCandidate` 與 `MLB_INTL_RESTRICTED` 既有處理；posting fee 沿用 §11.7 與 `calculatePostingFee`，不改公式。
理由：只補流程，不動薪資與 fee 規則。
待決：入札不成立的機率或條件。

### P6. 不同意或不成立時

建議：留在原球團並依既有路徑續約（保有權續約），隔年可再申請。
理由：不新增懲罰或士氣系統。

### P7. 畫面用語（AGENTS §4，需批准）

候選：「ポスティングを申請」「球団が容認」「球団が申請を認めず」「入札球団なし」「ポスティングで○○と契約」。
待決：措辭與是否沿用現有選項名稱「MLBへの海外移籍」。

### P8. 風險分類與版本

- 改變移籍流程與 RNG 消耗、同 seed 結果改變，屬 **R3**（AGENTS §6.1）。
- 新增制度屬 **MINOR**（AGENTS §9.2）。
- 實作前須列出許可差異、固定 seed 的投手／野手回歸範圍與 Full（GitHub 手動）條件。

## 4. 決定後的下一步

1. code owner 決定 P1～P8。
2. 依決定把本文件改寫為規格，並同步 `CURRENT_SPEC.md` §11.7。
3. 另行取得實作授權後才開始實作（R3）。

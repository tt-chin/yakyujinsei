# yakyujinsei.com 薪資系統詳細修改設計書 v1.2.0

## 0. Codex 執行指令

- 前置版本：`v1.1.1`
- 目標版本：`v1.2.0`
- 本版性質：合約資料結構與固定多年年薪改版
- 禁止加入：二刀流、控制期仲裁、傷病市場折價、球隊需求、激勵獎金
- 本版必須完成舊合約migration
- 不得讓新延長合約覆蓋舊約剩餘年度

## 1. 目的

將目前「年限存在但年薪每年可能重算」改成真正的固定合約：

```text
市場價值每年更新
目前已簽合約年薪不自動更新
好壞成績影響下一份合約
```

並支援：

- 年度年薪表`annualSchedule`。
- 保障總額`guaranteedTotal`。
- 已支付金額`paidTotal`。
- 合約分段`segments`。
- 延長合約接在舊約後面。
- 買斷依未支付排程計算。

## 2. 合約適用原則

### 2.1 本版先採用

- 所有已簽多年約在合約期間固定年薪。
- 單年約到期後才依最新marketRating重算。
- 交易後原合約完整保留。
- 下放不重算現行合約。
- 升格只在低於新層級最低保障時調高，不以市場價全面重算。
- 延長約從原合約結束後開始。

### 2.2 留待v1.3.0

- NPB FA前一年期年俸更改細則。
- MLB控制期與仲裁。
- 傷病市場與證明約。

## 3. 修改檔案

| 操作 | 檔案 | 責任 |
|---|---|---|
| 修改 | `src/config.js` | 版本改為`1.2.0` |
| 新增 | `src/engine/contract-policy.js` | 合約schema、排程、分段、支付、延長、買斷純函式 |
| 修改 | `src/engine/salary-promotion-policy.js` | 只保留薪資評價／升格最低保障責任 |
| 修改 | `src/engine/game.js` | signTo、續約、支付、交易、下放、延長、買斷接入 |
| 修改 | `src/ui/salary-detail.js` | 顯示排程、保障總額與分段 |
| 新增 | `tests/contract-policy.test.mjs` | 合約純函式測試 |
| 修改 | `tests/salary-flow.test.mjs` | 固定合約流程測試 |
| 修改 | `tests/salary-detail-ui.test.mjs` | 合約顯示測試 |
| 修改 | `CHANGELOG.md` | 記錄破壞性資料結構變更與migration |

## 4. Contract Schema v2

`S.ct`統一為：

```js
{
  schemaVersion: 2,
  contractId: 'NPB:team-id:2028:001',
  org: 'NPB',
  teamId: 'team-id',
  signedYear: 2028,
  startYear: 2029,
  endYear: 2031,
  years: 3,
  remainingYears: 3,
  contractType:
    'ROOKIE' |
    'DEVELOPMENT' |
    'NORMAL' |
    'EXTENSION' |
    'DOMESTIC_FA' |
    'OVERSEAS_FA' |
    'PROOF',
  annualSalary: 50000000,
  annualSchedule: [
    { year: 2029, amount: 50000000, segmentId: 'seg-1', paid: false },
    { year: 2030, amount: 50000000, segmentId: 'seg-1', paid: false },
    { year: 2031, amount: 50000000, segmentId: 'seg-1', paid: false },
  ],
  segments: [
    {
      segmentId: 'seg-1',
      type: 'NORMAL',
      signedYear: 2028,
      startYear: 2029,
      endYear: 2031,
      annualSalary: 50000000,
      years: 3,
      guaranteedValue: 150000000,
    },
  ],
  guaranteedTotal: 150000000,
  paidTotal: 0,
  signedMarketRating: 5.25,
  positionMultiplierAtSigning: 1.15,
  contractMultiplier: 1.10,
  injuryProtection: 'FULL',
  extOffered: false,
}
```

## 5. 年度語意

統一規則：

- `signedYear`：決定合約的年度。
- `startYear`：第一筆排程支付所屬球季。
- `endYear`：最後一筆排程年度。
- 季後／FA／延長流程在`S.year`球季結束後簽約時，`startYear = S.year + 1`。
- 選秀、季前或尚未開始`S.year`球季時簽約，`startYear = S.year`。
- 呼叫端必須明確傳入`startYear`；`createContract()`不得自行猜測目前處於季前或季後。
- `S.year`球季結束時支付`annualSchedule`中`year === S.year`的未支付項目。
- `remainingYears`等於尚未支付項目數，不再以`yrs--`獨立維護。
- 舊`ct.yrs`停止作為權威來源；如需相容getter，由normalize時計算，不新增第二份可變狀態。

## 6. contract-policy.js API

所有函式為純函式。

### 6.1 createContract

```js
export function createContract({
  contractId,
  org,
  teamId,
  signedYear,
  startYear,
  years,
  annualSalary,
  contractType,
  signedMarketRating,
  positionMultiplierAtSigning,
  contractMultiplier,
  injuryProtection = 'FULL',
})
```

建立單一segment及連續年度schedule。所有金額四捨五入至一萬日圓。

### 6.2 normalizeContract

```js
export function normalizeContract(contract, fallback)
```

若`schemaVersion === 2`：

- 重建衍生欄位。
- 驗證排程年度不重複。
- 驗證金額非負。

若為legacy：

```text
remaining = max(1, ct.remainingYears ?? ct.yrs ?? 1)
annual = ct.annualSalary || fallback.currentSalary || 0
startYear = fallback.currentYear
```

將剩餘合約轉成從目前年度開始的固定排程，不虛構已支付過去年度。

### 6.3 deriveContractTotals

```js
export function deriveContractTotals(contract)
```

```text
guaranteedTotal = sum(all schedule amount)
paidTotal = sum(paid schedule amount)
remainingValue = sum(unpaid schedule amount)
remainingYears = count(unpaid schedule)
annualSalary = 當前最早未支付項目的amount；沒有則0
```

不得以`annualSalary × remainingYears`取代排程加總。

### 6.4 salaryDueForYear

```js
export function salaryDueForYear(contract, year)
```

回傳：

```js
{ amount, scheduleIndex, alreadyPaid, contractEnded }
```

同年沒有排程且合約未開始時回0；合約已結束時`contractEnded=true`。

### 6.5 markSalaryPaid

```js
export function markSalaryPaid(contract, year)
```

- 同年重複支付拋出`CONTRACT_SALARY_ALREADY_PAID`。
- 將指定項目`paid=true`。
- 回傳更新contract及支付金額。
- 重新推導remainingYears、paidTotal等欄位。

### 6.6 applyLevelMinimumToUnpaidSchedule

```js
export function applyLevelMinimumToUnpaidSchedule(contract, minimumAnnualSalary, effectiveYear)
```

升格時只將`year >= effectiveYear`且未支付項目調高到最低保障：

```text
amount = max(original amount, minimumAnnualSalary)
```

不得因升格全面重算市場價，不得減少任何項目。

### 6.7 appendExtension

```js
export function appendExtension(contract, extensionInput)
```

新segment起始：

```text
max(contract.endYear + 1, extensionInput.startYear)
```

舊排程不得修改。新segment追加後重算保障總額。

### 6.8 transferContract

```js
export function transferContract(contract, { org, teamId })
```

只修改所屬組織與球隊。不得改年薪、排程、分段、保障、簽約市場評價。

### 6.9 calculateScheduledBuyout

```js
export function calculateScheduledBuyout(contract, rate)
```

```text
remainingValue = sum(unpaid schedule amount)
buyoutAmount = roundToTenThousandYen(remainingValue × clamp(rate,0,1))
```

回傳每年度未支付明細、原總額、買斷率及買斷額。

## 7. signTo與新合約

`signTo()`必須：

1. 完成市場評價與跨par換算。
2. 計算守位與合約倍率。
3. 決定固定`annualSalary`。
4. 呼叫`createContract()`。
5. `S.currentSalary`取當年或下一個未支付schedule。
6. 建立v1.1.1 SalaryDecision。

不得在簽約後再由`finalizePendingOffseasonSalary()`改寫年薪。

## 8. 球季支付

職業球員`phaseEnd()`：

```text
due = salaryDueForYear(S.ct, S.year)
```

若有排程：

```js
const result = markSalaryPaid(S.ct, S.year);
S.ct = result.contract;
S.currentSalary = result.amount;
S.careerEarnings += result.amount;
S.lastSalaryPaidYear = S.year;
```

若沒有合約但應為職業球員，拋出可診斷錯誤`PRO_PLAYER_WITHOUT_CONTRACT`，不得靜默用`salaryFor()`補值。

## 9. 休賽季行為

### 9.1 合約仍有未支付年度

- 不重算`currentSalary`。
- 新payD與marketRating照常加入歷史。
- v1.1.1顯示「今季実績は次回契約評価へ反映」。
- `pendingOffseasonSalary`不應存在或必須被清除。

### 9.2 合約到期

- 進入現行續約／FA流程。
- 新合約使用最新marketRating。
- 簽約後固定新排程。

## 10. 升格、降格、交易

### 10.1 升格

- 既有固定合約不全面重算。
- 取得目標層級最低保障。
- 最低保障定義為該層級`salaryFor(level, 0)`，再按制度需要套法定最低，不套守位或市場倍率。
- 使用`applyLevelMinimumToUnpaidSchedule()`。

### 10.2 降格

- 不降低現有排程。
- 合約到期後才按新層級市場重算。

### 10.3 交易

- 使用`transferContract()`。
- 所有金額與segment不變。
- SalaryDecision可記錄`CONTRACT_TRANSFERRED_UNCHANGED`，但不建立新薪資決定。

## 11. 延長合約

延長報價畫面必須分開顯示：

```text
現契約：2029～2030年　年俸5,000万円
延長契約：2031～2033年　年俸6,500万円
延長分総額：1億9,500万円
合計保障：2億9,500万円
```

接受後：

- 舊segment不變。
- 新segment追加。
- `contractType`頂層可維持原始或改為`EXTENDED`，但各segment必須保存實際type。
- 不得把6,500萬套到2029、2030。

## 12. 買斷

v1.0.4的legacy買斷改由`calculateScheduledBuyout()`取代。

買斷後：

```js
S.careerBuyout += buyoutAmount;
S.careerEarnings += buyoutAmount;
S.ct = null;
S.currentSalary = 0;
```

所有未支付排程視為結束，不再於未來年度支付。

## 13. 新人合約migration注意

NPB選秀接受後先決定固定新人年薪，再建立合約。不得：

1. 先用市場價建立schedule。
2. 再只覆蓋`currentSalary`或`ct.annualSalary`。

正確流程：

```text
決定新人固定年薪
→ createContract
→ currentSalary取schedule
```

## 14. UI顯示

薪資詳情增加：

- 合約類型。
- 合約期間。
- 年度年薪表。
- 已支付金額。
- 剩餘保障金額。
- 分段合約。
- 簽約時市場評價與守位倍率。

已支付年度加「支払済」，未支付年度加「予定」。

## 15. 舊資料migration

啟動或載入時只執行一次：

```js
if (S.ct && S.ct.schemaVersion !== 2) {
  S.ct = normalizeContract(S.ct, {
    currentYear: S.year,
    currentSalary: S.currentSalary,
  });
}
```

不得因每次render重跑migration。

migration後必須符合：

- `annualSchedule.length === remainingYears`
- `guaranteedTotal === sum(schedule)`
- `currentSalary === first unpaid amount`或當年度amount
- 沒有負數或重複年度

## 16. RNG影響

- 合約policy不得呼叫RNG。
- `contractId`不得使用亂數；使用組織、球隊、signedYear及狀態內遞增序號。
- 在`newState()`增加`contractSequence: 0`。
- 產生新合約時`contractSequence += 1`，不影響遊戲RNG。
- 相同seed的事件與成績不變；固定合約可能改變玩家選項文字與決策結果，是預期功能差異。

## 17. 單元測試

1. 3年固定約建立3筆正確schedule。
2. 支付一年後remainingYears、paidTotal、remainingValue正確。
3. 同年重複支付拋錯。
4. 交易只改球隊。
5. 降格不改金額。
6. 升格只提高低於最低保障的未付年度。
7. 延長合約不修改舊segment。
8. 不同年薪segment的保障總額使用加總而非單價乘年數。
9. 70%與100%買斷依未支付排程。
10. legacy contract可正規化。
11. 新人合約固定年薪與排程一致。
12. 合約到期後`annualSalary=0`且remainingYears=0。

## 18. E2E驗收

| 案例 | 驗收結果 |
|---|---|
| 3年約中打出生涯年 | 現約不加薪，市場評價提高 |
| 3年約中低潮 | 現約不減薪 |
| 合約中被交易 | 新隊承接完全相同排程 |
| 合約中下放 | 年薪不改 |
| 合約中升格 | 只套目標層級最低保障 |
| 提前延長 | 新約從舊約後一年開始 |
| 合約中退休 | 依規則買斷剩餘排程 |
| NPB新人 | 固定起薪、總額與畫面一致 |
| 舊v1.1.1狀態 | 可自動轉為schema v2並繼續 |

## 19. 完了條件

- `VERSION === '1.2.0'`
- `S.ct.schemaVersion === 2`
- 多年約期間不因成績、能力、守位、下放而重算
- 延長合約不覆蓋舊約
- 買斷使用未支付schedule
- 所有合約金額可由schedule唯一推導
- migration、單元測試、E2E與CHANGELOG完成

# yakyujinsei.com 薪資系統詳細修改設計書 v1.0.4

## 0. Codex 執行指令

本文件是 `v1.0.4` 的唯一實作範圍。實作前先讀取 `AGENTS.md`、現行原始碼與測試設定，再依本文件執行。

- 基準版本：`v1.0.3`
- 目標版本：`v1.0.4`
- 本版性質：資料一致性修正，不導入新市場評價制度
- 禁止加入：二刀流、三季市場評價、薪資仲裁、激勵獎金、球隊需求、全新UI
- 不得複製參考網站的程式碼、文字、CSS或素材
- GitHub Pages必須維持無建置即可執行
- `seed` URL格式與RNG呼叫順序不得改變

## 1. 目的

修正 `v1.0.3` 已確認的四項薪資／合約一致性問題：

1. 獨立聯盟年收入沒有穩定加入生涯收入。
2. 合約買斷重新計算市場薪資，沒有使用實際合約年薪。
3. `currentSalary`、`ct.annualSalary`、`ct.totalValue`可能不同步。
4. 升格、降格及跨層級簽約沒有先進行 `par` 換算。

本版不得改變現行薪資曲線、守位倍率、獎項加成或FA倍率。

## 2. 現行基準

現行薪資評價：

```text
salaryD = lastD + salaryAwardBonus
p = clamp(floor(salaryD), 0, 26)
```

現行候選薪資：

```text
candidate = salaryFor(level, salaryD)
          × contract.mult
          × dpMult()
```

現行主要檔案：

- `src/config.js`
- `src/engine/game.js`
- `src/engine/salary-promotion-policy.js`
- `src/engine/career-policy.js`
- `src/data/jp-data.js`

## 3. 修改檔案

| 操作 | 檔案 | 責任 |
|---|---|---|
| 修改 | `src/config.js` | 版本改為`1.0.4` |
| 修改 | `src/engine/salary-promotion-policy.js` | 新增跨層級換算、合約同步與買斷純函式 |
| 修改 | `src/engine/game.js` | 接入純函式、修正收入與各簽約呼叫點 |
| 新增 | `tests/salary-promotion-policy.test.mjs` | 純函式單元測試 |
| 新增或修改 | `tests/salary-flow.test.mjs` | 主要流程回歸測試；若已有同責任測試檔則沿用 |
| 修改 | `CHANGELOG.md` | 記錄v1.0.4修正；若不存在則新增 |

不得在公開遊戲頁面載入測試檔。

## 4. 狀態欄位

在 `newState()` 增加：

```js
lastSalaryPaidYear: null,
```

用途：判斷買斷發生時，當年度年薪是否已經支付，避免少算或重複支付。

## 5. salary-promotion-policy.js API

保留現有匯出：

```js
promotionSalaryUpdate
contractSalaryUpdate
salaryAwardBonus
salaryEvaluationD
```

新增下列純函式。

### 5.1 roundToTenThousandYen

```js
export function roundToTenThousandYen(value)
```

規則：

```text
max(0, round(value / 10000) × 10000)
```

非有限數值視為0。

### 5.2 convertRatingBetweenLevels

```js
export function convertRatingBetweenLevels(rating, fromLevel, toLevel, levelTable)
```

公式：

```text
targetRating = rating
             + levelTable[fromLevel].par
             - levelTable[toLevel].par
```

規則：

- `fromLevel === toLevel`時直接回傳原評價。
- 任一層級不存在或`par`不是有限數值時，拋出`UNKNOWN_LEVEL_FOR_RATING_CONVERSION`。
- 不在此函式內做0～26限制；限制由`salaryFor()`負責。
- 不取整，保留小數。雖然v1.0.4的`salaryFor()`仍會向下取整，但換算函式不得預先取整。

### 5.3 synchronizeContractSalary

```js
export function synchronizeContractSalary(contract, annualSalary)
```

回傳新的contract物件，不得修改傳入物件。

```text
years = max(1, round(contract.remainingYears ?? contract.yrs ?? 1))
annual = roundToTenThousandYen(annualSalary)
```

同步欄位：

```js
{
  ...contract,
  yrs: years,
  remainingYears: years,
  annualSalary: annual,
  totalValue: annual * years,
}
```

### 5.4 calculateLegacyContractBuyout

```js
export function calculateLegacyContractBuyout({
  contract,
  currentSalary,
  currentYear,
  lastSalaryPaidYear,
  rate,
})
```

本版尚未導入`annualSchedule`，所以使用實際固定欄位：

```text
annual = contract.annualSalary > 0
       ? contract.annualSalary
       : currentSalary
```

未付年數：

```text
contractYears = max(0, round(contract.remainingYears ?? contract.yrs ?? 0))
currentSeasonPaid = lastSalaryPaidYear === currentYear
unpaidYears = max(0, contractYears - (currentSeasonPaid ? 1 : 0))
```

買斷額：

```text
buyout = roundToTenThousandYen(annual × unpaidYears × clamp(rate, 0, 1))
```

回傳：

```js
{
  annualSalary,
  unpaidYears,
  fullRemainingValue,
  buyoutAmount,
  currentSeasonPaid,
}
```

## 6. 統一薪資報價入口

在 `game.js` 內以現有`salaryCandidate()`為基礎，改成明確參數：

```js
function salaryCandidate({
  sourceLevel = S.lv,
  targetLevel = S.lv,
  rating = currentSalaryD(),
  contractMult = 1,
  positionMult = dpMult(),
})
```

處理順序：

```text
convertedRating = convertRatingBetweenLevels(
  rating,
  sourceLevel,
  targetLevel,
  LV
)

base = salaryFor(targetLevel, convertedRating)

candidate = roundToTenThousandYen(
  base × contractMult × positionMult
)
```

回傳物件，不只回傳金額：

```js
{
  sourceLevel,
  targetLevel,
  sourceRating: rating,
  convertedRating,
  baseSalary: base,
  contractMult,
  positionMult,
  annualSalary: candidate,
}
```

所有呼叫端統一取`.annualSalary`。

## 7. 升格、降格與跨聯盟

### 7.1 升格

`applyPromotionSalary(fromLv, toLv)`必須在修改`S.lv`前保留`fromLv`，並使用：

```js
salaryCandidate({
  sourceLevel: fromLv,
  targetLevel: toLv,
  rating: currentSalaryD(),
  contractMult: S.ct?.mult || 1,
})
```

升格仍保留不減薪：

```text
newSalary = max(currentSalary, convertedCandidate)
```

### 7.2 降格

降格後候選薪資也必須使用原層級到目標層級的換算。是否減薪維持現行保護規則，不在本版新增額外保護。

### 7.3 signTo

`signTo()`在改寫`S.lv`前保存：

```js
const sourceLevel = S.lv;
```

簽約年薪使用`sourceLevel → targetLevel`換算。高中、大學、社會人或沒有可比較職業`par`的首次職業簽約，使用目標層級評價0或既有新人固定年薪，不做無效換算。

### 7.4 適用流程

必須檢查並接入：

- NPB育成→二軍→一軍
- KBO二軍→一軍
- CPBL二軍→一軍
- R→A1→A2→A3→MLB
- NPB／KBO／CPBL／MLB跨聯盟
- 戰力外後再契約
- FA與海外FA
- 日本復歸

## 8. 合約欄位同步

所有設定`S.currentSalary`的地方都必須同步`S.ct`。

使用：

```js
S.currentSalary = annual;
S.ct = synchronizeContractSalary(S.ct, annual);
```

必須修正的已知位置：

- `signTo()`
- NPB選秀入團後覆蓋新人年薪的分支
- `finalizePendingOffseasonSalary()`
- `applyPromotionSalary()`
- `renewAndAdvance()`
- FA簽約
- 海外移籍簽約
- 戰力外後再簽約

不得再只更新`ct.annualSalary`而漏掉`ct.totalValue`。

## 9. 合約買斷

改寫`buyoutRemaining(rate)`：

1. 不得呼叫`salaryFor()`重新估價。
2. 使用`calculateLegacyContractBuyout()`。
3. 買斷額加入：

```js
S.careerBuyout += buyoutAmount;
S.careerEarnings += buyoutAmount;
```

4. 買斷後合約結束：

```js
S.ct = null;
S.currentSalary = 0;
```

5. 顯示內容必須使用同一回傳物件，不得再另外計算金額。

顯示：

```text
契約残年数：N年
残契約総額：X円
買取率：70%／100%
買取支払額：Y円
```

## 10. 年薪支付年份

在職業球員球季結束支付年薪時：

```js
S.careerEarnings += paid;
S.lastSalaryPaidYear = S.year;
```

同年度再次進入結算時必須防止重複支付：

```js
if (S.lastSalaryPaidYear === S.year) {
  throw new Error('SALARY_ALREADY_PAID_FOR_YEAR');
}
```

正式UI流程不應觸發此錯誤；測試必須覆蓋。

## 11. 獨立聯盟收入

現行`stage === 'IND'`球季結束時新增收入處理。

```text
rating = salaryEvaluationD(lastD, honors, year)
base = salaryFor('IND', rating)
pay = roundToTenThousandYen(base × dpMult())
```

處理：

```js
S.currentSalary = pay;
S.careerEarnings += pay;
S.lastSalaryPaidYear = S.year;
```

獨立聯盟沒有職棒多年合約，因此：

- 不建立`S.ct`。
- 不套合約倍率。
- 不產生簽約金。
- 使用「年俸」或「年間報酬」日文，不使用企業「給与」。

社會人仍維持既有`CORP`企業收入流程。

## 12. 存檔相容性

如果遊戲有舊狀態載入或replay狀態正規化，加入：

```js
if (!Object.hasOwn(state, 'lastSalaryPaidYear')) {
  state.lastSalaryPaidYear = null;
}
if (!Object.hasOwn(state, 'careerBuyout')) {
  state.careerBuyout = 0;
}
```

舊合約正規化：

```js
if (state.ct) {
  const annual = state.ct.annualSalary || state.currentSalary || 0;
  state.ct = synchronizeContractSalary(state.ct, annual);
}
```

不得變更既有seed、選手能力、成績與年度事件。

## 13. RNG影響

本版新增函式全部必須為純函式，不得呼叫：

- `R()`
- `chance()`
- `ri()`
- `crypto.getRandomValues()`

固定seed在相同操作下，除薪資、收入、合約總額及因薪資選擇造成的後續玩家分支外，其餘RNG序列必須完全一致。

## 14. 單元測試

至少包含：

1. NPB二軍`rating=8`轉NPB一軍，結果為`8+52-58=2`。
2. A3`rating=8`轉MLB，結果為`8+56-63=1`。
3. NPB一軍轉同層級不改變rating。
4. 不存在層級會拋出指定錯誤。
5. 合約年薪同步後三個金額欄位一致。
6. 已支付當年薪資時，買斷不重複計入當年。
7. 尚未支付當年薪資時，買斷包含當年。
8. 70%與100%買斷使用`ct.annualSalary`，不受最新`lastD`影響。
9. 獨立聯盟收入只入帳一次。
10. NPB新人自訂年薪後`totalValue`正確更新。

## 15. E2E驗收

| 案例 | 驗收結果 |
|---|---|
| NPB育成升二軍 | 新薪資使用35→52的par換算且不減薪 |
| NPB二軍升一軍 | 不將二軍`d`直接當一軍`d` |
| 3A升MLB | 使用56→63換算 |
| 固定合約中戰力外 | 100%買斷使用合約年薪 |
| 玩家主動解約 | 70%買斷使用合約年薪 |
| 獨立聯盟完整一季 | 年收入加入生涯收入且只加一次 |
| NPB選秀入團 | 畫面年薪、ct年薪、總額一致 |
| 相同seed回歸 | 除本版預期薪資差異外，RNG事件順序不變 |

## 16. 完了條件

- `VERSION === '1.0.4'`
- 四項目標全部修正
- 所有薪資顯示使用實際狀態值
- 沒有`salaryFor()`參與買斷估價
- 跨層級入口全部使用統一換算函式
- 新增狀態具備舊資料預設值
- 單元測試與E2E測試通過
- `CHANGELOG.md`記錄完成

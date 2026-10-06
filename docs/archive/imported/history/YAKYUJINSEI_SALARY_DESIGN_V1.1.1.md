# yakyujinsei.com 薪資系統詳細修改設計書 v1.1.1

## 0. Codex 執行指令

- 前置版本：`v1.1.0`
- 目標版本：`v1.1.1`
- 本版性質：薪資理由與最近三季資訊顯示，不改變計算結果
- 禁止加入：二刀流、固定多年約重構、仲裁、球隊需求、激勵獎金
- 禁止修改：payD公式、60／30／10權重、薪資曲線、RNG呼叫

## 1. 目的

讓玩家能回答：

- 為什麼加薪？
- 為什麼減薪？
- 為什麼好成績但目前年薪沒變？
- 最近三季各自對市場價值影響多少？
- 升格或跨聯盟後為什麼評價下降？
- 守位與合約倍率如何影響最終金額？

本版只將v1.1.0已計算的資料格式化與顯示，不得另算一套UI專用數值。

## 2. 修改檔案

| 操作 | 檔案 | 責任 |
|---|---|---|
| 修改 | `src/config.js` | 版本改為`1.1.1` |
| 新增 | `src/engine/salary-explanation-policy.js` | 產生結構化薪資理由，不產生HTML |
| 新增 | `src/ui/salary-detail.js` | DOM渲染、開關與格式化 |
| 修改 | `src/engine/game.js` | 保存薪資決定快照、接入UI |
| 修改 | `index.html` | 新增薪資詳情面板容器；若DOM由JS建立則不重複新增 |
| 修改 | 現有CSS檔或`index.html`樣式區 | 手機／桌面詳情樣式 |
| 新增 | `tests/salary-explanation-policy.test.mjs` | 理由純函式測試 |
| 新增或修改 | `tests/salary-detail-ui.test.mjs` | DOM顯示測試；沿用現有測試環境 |
| 修改 | `CHANGELOG.md` | 記錄顯示改善 |

## 3. 不可變更條件

- UI開關不得呼叫`R()`、`chance()`或`ri()`。
- 面板開關不得修改`S`內任何遊戲規則狀態。
- 不得從HTML文字反推數值。
- 顯示金額必須來自薪資決定快照。
- UI修改不得改變固定seed結果或RNG消費次數。

## 4. 薪資決定快照

在`newState()`增加：

```js
lastSalaryDecision: null,
salaryDecisionHistory: [],
```

### 4.1 SalaryDecision

每次正式決定下一年度年薪時建立：

```js
{
  schemaVersion: 1,
  decisionYear: 2027,
  salaryYear: 2028,
  decisionType:
    'RENEWAL' |
    'PROMOTION' |
    'DEMOTION' |
    'NEW_CONTRACT' |
    'FA' |
    'OVERSEAS' |
    'RETURN' |
    'RELEASE_RECONTRACT',
  sourceLevel: 'NPB2',
  targetLevel: 'NPB1',
  previousSalary: 12000000,
  finalSalary: 18000000,
  changeAmount: 6000000,
  changeRate: 0.5,
  sourceMarketRating: 5.2,
  convertedMarketRating: -0.8,
  baseSalary: 16000000,
  contractMultiplier: 1,
  positionMultiplier: 1.05,
  floorApplied: false,
  capApplied: false,
  decreaseProtectionApplied: true,
  marketComponents: [
    { year: 2027, payD: 6.0, weight: 0.6, contribution: 3.6 },
    { year: 2026, payD: 4.0, weight: 0.3, contribution: 1.2 },
    { year: 2025, payD: 4.0, weight: 0.1, contribution: 0.4 },
  ],
  currentEvaluation: {
    baseD: 3.2,
    performanceAdjustment: 1.4,
    workloadAdjustment: 0.3,
    awardAdjustment: 0.35,
    payD: 5.25,
    sampleStatus: 'FULL',
  },
  reasonCodes: [
    'STRONG_PERFORMANCE',
    'FULL_WORKLOAD',
    'LEVEL_PAR_DOWNWARD_CONVERSION',
    'PROMOTION_NO_DECREASE',
  ],
}
```

`salaryDecisionHistory`：

- 依`salaryYear`升冪。
- 同一`salaryYear`與`decisionType`重複時覆蓋。
- 最多保存10筆。
- 不保存已渲染HTML。

## 5. 建立快照的位置

所有正式改變`S.currentSalary`的入口必須先完成計算，再使用同一結果建立快照：

- `finalizePendingOffseasonSalary()`
- `applyPromotionSalary()`
- `renewAndAdvance()`
- `signTo()`
- FA與海外FA接受報價
- 戰力外後再契約
- 日本復歸

不得只在部分流程建立，否則玩家會看到過期理由。

## 6. salary-explanation-policy.js API

### 6.1 buildSalaryDecision

```js
export function buildSalaryDecision(input)
```

只接受已計算數值，不讀全域狀態。負責：

- 計算`changeAmount`。
- 計算`changeRate`；前薪0時回傳`null`。
- 根據差異產生reasonCodes。
- 正規化最多三季components。
- 回傳不可變的plain object。

### 6.2 deriveSalaryReasonCodes

```js
export function deriveSalaryReasonCodes(input)
```

最低支援：

| 條件 | reasonCode |
|---|---|
| performanceAdjustment >= 1 | `STRONG_PERFORMANCE` |
| performanceAdjustment <= -0.75 | `POOR_PERFORMANCE` |
| workloadAdjustment >= 0.25 | `FULL_WORKLOAD` |
| workloadAdjustment <= -0.5 | `LIMITED_WORKLOAD` |
| awardAdjustment > 0 | `AWARD_BONUS` |
| sourceLevel != targetLevel且converted < source | `LEVEL_PAR_DOWNWARD_CONVERSION` |
| sourceLevel != targetLevel且converted > source | `LEVEL_PAR_UPWARD_CONVERSION` |
| positionMultiplier > 1 | `PREMIUM_POSITION` |
| positionMultiplier < 1 | `DH_DISCOUNT` |
| contractMultiplier > 1 | `CONTRACT_PREMIUM` |
| contractMultiplier < 1 | `CONTRACT_DISCOUNT` |
| 不減薪保護發動 | `NO_DECREASE_PROTECTION` |
| 只存在1季資料 | `ONE_YEAR_MARKET_SAMPLE` |
| fallback評價 | `LEGACY_RATING_FALLBACK` |

### 6.3 salaryReasonLabel

```js
export function salaryReasonLabel(reasonCode)
```

回傳日文短句，不得包含數值。數值由UI另外插入。

範例：

```text
STRONG_PERFORMANCE              今季の実績が市場評価を押し上げました
LEVEL_PAR_DOWNWARD_CONVERSION   上位カテゴリー基準へ換算しました
NO_DECREASE_PROTECTION          昇格・受賞などの減俸保護が適用されました
```

未知code顯示「その他の契約条件」，不得直接輸出內部code。

## 7. 薪資詳情UI

### 7.1 入口

頂部「現在年俸（万円）」區域可點擊／鍵盤操作：

- `button`或具備`role="button"`、`tabindex="0"`。
- `Enter`與`Space`可開啟。
- 顯示簡短提示「年俸の内訳を見る」。

### 7.2 面板

面板ID建議：

```html
<section id="salary-detail-panel" hidden></section>
```

手機：全寬底部或全螢幕面板。桌面：右側或中央modal。不得在360px產生橫向捲動。

面板區塊：

1. 現在年俸。
2. 前回年俸與增減額／增減率。
3. 當季評價內訳。
4. 最近三季市場評價。
5. 層級換算。
6. 守位與合約倍率。
7. 最終決定理由。

### 7.3 顯示範例

```text
2028年 年俸　4,600万円
前年　　　　 3,800万円
増減　　　　 +800万円（+21.1%）

今季評価
能力評価 d                  3.20
実績補正                    +1.40
出場量補正                  +0.30
受賞補正                    +0.35
payD                         5.25

直近3年
2027  5.25 × 60% = 3.15
2026  4.20 × 30% = 1.26
2025  3.10 × 10% = 0.31
市場評価                    4.72

契約・守備
基準年俸                    4,000万円
遊撃手係数                  ×1.15
契約係数                    ×1.00
最終年俸                    4,600万円
```

## 8. 球季與合約卡片

所有新年薪決定卡片至少顯示：

```text
来季年俸：4,600万円（前年比 +800万円／+21.1%）
主な理由：今季好成績、直近3年評価、遊撃手係数
［内訳を見る］
```

「内訳を見る」必須開啟同一`lastSalaryDecision`，不得重算。

若仍在現行固定金額流程，顯示：

```text
今季の好成績は次回の契約評価へ反映されます。
```

此句在v1.2.0固定合約導入後正式使用；v1.1.1可先支援reasonCode，但不得錯誤顯示。

## 9. 無資料狀態

| 狀態 | 顯示 |
|---|---|
| 尚未成為職業球員 | `プロ契約はまだありません` |
| 職業第一年、無薪資決定 | 顯示現在年薪及新人合約來源 |
| 只有一年評價 | `評価履歴は1年分です（当年100%）` |
| 舊資料fallback | `過去年の詳細評価がないため旧方式の値を使用` |
| 無合約 | 不顯示合約倍率區塊 |
| 引退後 | 顯示最後年薪及歷年決定，不提供修改操作 |

## 10. 數值格式

- 所有金額使用既有`fmtMoney()`。
- 評價值顯示小數兩位。
- 權重顯示整數百分比；正規化66.67%時顯示66.7%。
- 變動正數加`+`，負數保留`−`。
- `changeRate === null`時顯示`新規契約`。
- 不得將日圓誤寫為台幣或美元。

## 11. 存檔相容性

舊資料預設：

```js
lastSalaryDecision: null,
salaryDecisionHistory: [],
```

不得為舊年度虛構詳細資料。舊資料第一次新薪資決定後開始累積。

## 12. 無障礙與操作

- 面板有明確標題。
- 開啟後焦點移到標題或關閉按鈕。
- `Escape`關閉。
- 關閉後焦點回到原薪資入口。
- 關閉按鈕有`aria-label="閉じる"`。
- 背景滾動在手機modal開啟時鎖定。
- 不依賴只有顏色才能辨識加減薪。

## 13. RNG與效能

- UI渲染不得消耗RNG。
- 展開／關閉不得寫入遊戲狀態。
- 不得在每次render重新跑薪資公式。
- 面板只讀`lastSalaryDecision`與history。
- 最多10筆決定歷史，避免DOM無限制成長。

## 14. 測試

### 14.1 單元測試

1. 加薪、減薪、持平reasonCode正確。
2. 0元新規合約不產生除0。
3. 跨par上／下換算理由正確。
4. 守位與合約倍率理由不重複。
5. 未知reasonCode安全顯示。
6. 同年同類型決定覆蓋。
7. history最多10筆。

### 14.2 UI測試

1. 點擊、Enter、Space可開啟。
2. Escape與關閉按鈕可關閉。
3. 焦點正確返回。
4. 只有一年與三年資料都正確顯示。
5. 360px、390px無橫向捲動。
6. 億單位年薪與負增減率不截斷。
7. 開關面板前後序列化遊戲狀態完全一致。

### 14.3 固定seed回歸

投手3件、野手3件至少確認：

- RNG消費次數一致。
- 成績、事件、移籍、薪資數字與v1.1.0一致。
- 唯一差異為新增顯示與快照欄位。

## 15. 完了條件

- `VERSION === '1.1.1'`
- 所有薪資入口可查看同一計算快照
- 最近三季、payD、par與倍率皆可追溯
- UI數字與實際狀態完全一致
- UI不影響RNG或遊戲狀態
- 手機／桌面與鍵盤操作通過
- CHANGELOG完成

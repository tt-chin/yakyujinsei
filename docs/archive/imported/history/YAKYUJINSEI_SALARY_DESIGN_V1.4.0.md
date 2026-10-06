# yakyujinsei.com 薪資系統詳細修改設計書 v1.4.0

## 0. Codex 執行指令

- 前置版本：`v1.3.0`
- 目標版本：`v1.4.0`
- 本版性質：激勵獎金、球隊需求與完整FA競標
- 二刀流完全排除：不得新增、恢復或預留二刀流評價、欄位、分支、文案與測試
- 不得修改v1.1.0的payD／三季權重
- 不得修改v1.2.0固定合約保障原則
- 不得修改v1.3.0聯盟年資與傷病市場門檻

## 1. 目的

在既有市場價值上增加三項進階玩法：

1. 年度激勵獎金。
2. 球隊依守位／角色需求調整報價。
3. FA報價由固定倍率改為可比較的完整競標。

玩家在接受報價前必須能看到：

- 固定年薪。
- 年限。
- 保障總額。
- 激勵上限。
- 球隊需求程度。
- 合約類型。
- 傷病與守位倍率。

## 2. 修改檔案

| 操作 | 檔案 | 責任 |
|---|---|---|
| 修改 | `src/config.js` | 版本改為`1.4.0` |
| 新增 | `src/engine/incentive-policy.js` | 激勵設定與支付純函式 |
| 新增 | `src/engine/team-demand-policy.js` | 球隊需求分類與倍率純函式 |
| 修改 | `src/engine/market-policy.js` | 完整報價、競爭溢價、倍率組合 |
| 修改 | `src/engine/contract-policy.js` | contract加入incentive與來源明細 |
| 修改 | `src/engine/game.js` | FA報價生成、接受、球季激勵支付 |
| 修改 | `src/ui/salary-detail.js` | 報價比較與激勵明細 |
| 新增 | `tests/incentive-policy.test.mjs` | 激勵測試 |
| 新增 | `tests/team-demand-policy.test.mjs` | 球隊需求測試 |
| 新增 | `tests/fa-market-policy.test.mjs` | 競標與倍率測試 |
| 修改 | `tests/salary-flow.test.mjs` | 整合E2E |
| 修改 | `CHANGELOG.md` | 記錄市場擴充 |

## 3. 狀態欄位

在`newState()`增加：

```js
careerIncentive: 0,
yearlyIncentivePaid: {},
lastFaMarket: null,
```

`yearlyIncentivePaid`格式：

```js
{
  '2030': {
    contractId: '...',
    amount: 5000000,
    level: 'FULL' | 'HALF' | 'NONE',
  }
}
```

同年度不得重複支付。

## 4. Contract Schema v3

將v1.2.0 contract升級：

```js
{
  schemaVersion: 3,
  ...schemaV2,
  incentive: {
    annualMax: 5000000,
    rate: 0.10,
    fullAwardCodes: [
      'MVP', 'BEST_PITCHER', 'SAWAMURA',
      'TITLE', 'GOLD_GLOVE'
    ],
    halfPayDThreshold: 3,
  },
  offerBreakdown: {
    marketSalary: 45000000,
    injuryMultiplier: 1,
    positionMultiplier: 1.15,
    contractTypeMultiplier: 0.95,
    teamDemandMultiplier: 1.05,
    franchiseMultiplier: 1,
    competitionMultiplier: 1.05,
    bidJitterMultiplier: 1.02,
    finalAnnualSalary: 61000000,
  },
}
```

舊schema v2 migration：

- `incentive = null`
- `offerBreakdown = null`
- 不改既有schedule與金額
- 只有新簽或延長合約才取得激勵條款

## 5. 激勵獎金

### 5.1 上限

| 組織 | 年度激勵上限 |
|---|---:|
| MLB／MiLB體系 | 固定年薪的10% |
| NPB／KBO／CPBL | 固定年薪的7% |
| 獨立聯盟／社會人 | 不提供職棒合約激勵 |

金額四捨五入至一萬日圓。

### 5.2 取得條件

完整激勵：

- 年間MVP。
- 最優秀投手賞。
- 沢村賞。
- 任一主要個人王座。
- ゴールデングラブ賞。
- 年間最優秀守備選手。

半額激勵：

```text
沒有完整激勵獎項
且當季payD >= 3
且sampleStatus !== INSUFFICIENT
```

不支付：

- `sampleStatus === INSUFFICIENT`。
- 當季payD < 3且未得指定獎項。
- 合約沒有incentive條款。

傷病本身不直接取消激勵；以有效樣本與實際獎項判定。

### 5.3 incentive-policy.js API

```js
export function createIncentiveTerms({ org, annualSalary })
export function evaluateIncentive({ terms, evaluation, honors, year })
```

回傳：

```js
{
  level: 'FULL' | 'HALF' | 'NONE',
  amount,
  reasonCodes,
}
```

### 5.4 支付

球季結束順序：

```text
固定年薪支付
→ 當季薪資評價與獎項確定
→ 激勵判定
→ 激勵入帳
→ 顯示本季總領取
```

入帳：

```js
S.careerIncentive += amount;
S.careerEarnings += amount;
S.yearlyIncentivePaid[S.year] = result;
```

不得把激勵加入`currentSalary`或`annualSchedule`。

## 6. 球隊需求分類

球員市場類型只允許：

```text
SP  先発投手
RP  中継ぎ／抑え
C   捕手
IF  内野手
OF  外野手
```

分類函式：

```js
export function playerMarketCategory({ pos, role, dpos })
```

規則：

- 投手SP→`SP`。
- 投手CL／MR→`RP`。
- 捕手或dpos C→`C`。
- IF→`IF`。
- OF→`OF`。
- DH依原始野手類型歸IF或OF，不建立DH專屬需求類型；守位折價仍由positionMultiplier處理。

## 7. 球隊需求生成

需求值：

```text
-2 非常低
-1 低
 0 普通
+1 高
+2 非常高
```

### 7.1 確定性

球隊需求不得消耗遊戲RNG。使用既有確定性hash函式或新增純函式：

```text
hash(seed + year + teamId + category) → -2～+2
```

同seed、年度、球隊、分類必須永遠相同。

### 7.2 倍率

```text
teamDemandMultiplier = 1 + demandScore × 0.025
```

| 需求 | 倍率 |
|---:|---:|
| -2 | 0.95 |
| -1 | 0.975 |
| 0 | 1.00 |
| +1 | 1.025 |
| +2 | 1.05 |

需求影響年薪與報價優先度，但不得繞過傷病資格、層級門檻或最多4隊限制。

## 8. FA報價數

基礎報價數：

| marketRating | 基礎報價數 |
|---:|---:|
| >= 6 | 4 |
| >= 3 | 3 |
| >= 1 | 2 |
| >= -1 | 1 |
| < -1 | 0 |

再套用：

- v1.3.0傷病報價數修正。
- 更衣室負面特性：-1。
- 招牌球員不直接增加外隊數量。

結果限制0～4。

如果結果0，直接進入無報價流程，不為湊數產生虛假球隊。

## 9. 候選球隊排序

對所有符合聯盟、層級、移籍資格的球隊計算：

```text
priority = demandScore×10
         + teamStrengthScore
         + deterministicTieBreak
```

精確定義：

```text
teamStrengthScore = { S: 2, A: 1, B: 0 }[team.strength] ?? 1
deterministicTieBreak = hashToUnit(seed, year, teamId, category)
```

- `hashToUnit()`回傳`0 <= x < 1`的固定小數，不消耗RNG。
- 依priority降冪取需要的球隊數。
- priority仍同分時依`teamId`字典序升冪，保證各瀏覽器排序一致。
- 同隊不得重複。
- 原隊是否包含依FA類型決定；若提供「宣言残留」則外隊清單排除原隊。

## 10. 完整報價公式

每支球隊報價先取得跨par換算後的`marketSalary`。

倍率分開保存，不得互相覆蓋：

```text
injuryMultiplier       v1.3.0
positionMultiplier     簽約時守位
contractTypeMultiplier 長約0.95／短約1.05／證明約1.05
teamDemandMultiplier   0.95～1.05
competitionMultiplier  1.00～1.075
bidJitterMultiplier    0.96～1.04
```

競爭溢價：

```text
competitionMultiplier = 1 + min(3, offerCount - 1) × 0.025
```

最終：

```text
annual = marketSalary
       × injuryMultiplier
       × positionMultiplier
       × contractTypeMultiplier
       × teamDemandMultiplier
       × competitionMultiplier
       × bidJitterMultiplier
```

再套目標層級最低保障並四捨五入至一萬日圓。

### 10.1 bidJitter RNG

- 只有確定入選的報價球隊才各呼叫一次`R()`。
- 呼叫順序依排序後teamId固定。
- 每隊一次：`0.96 + R() × 0.08`。
- UI重開不得重新生成。
- 生成後保存`S.lastFaMarket`，同年度同FA類型不可重抽。

## 11. 長約、短約與年限

保留既有選擇：

| 類型 | 年薪倍率 | 特徵 |
|---|---:|---|
| 長約 | ×0.95 | 年薪略低、固定保障較長 |
| 短約 | ×1.05 | 年薪較高、較快重回市場 |
| 證明約 | ×1.05 | v1.3.0傷病後1年 |

報價物件必須在玩家選擇前固定：

```js
{
  offerId,
  teamId,
  org,
  level,
  category,
  demandScore,
  years,
  contractType,
  annualSalary,
  guaranteedTotal,
  incentiveAnnualMax,
  breakdown,
}
```

不得在點擊接受時重新計算。

## 12. 母隊與無報價

### 12.1 宣言殘留

母隊報價使用相同市場公式，但：

- 不使用外隊競爭需求加價以外的隱藏倍率。
- 招牌球員母隊紅利`×1.04`可作獨立`franchiseMultiplier`保存。
- 最終金額與其他報價並列表達。

### 12.2 無報價

保留選項：

- 原隊一年合約：市場價×0.90，再套傷病倍率與最低保障。
- 現役引退。

不得套75%強制減薪保護，因玩家已進入自由市場。

## 13. 避免倍率覆蓋

禁止：

```js
offer.mult = anotherMultiplier;
```

統一使用：

```js
offer.breakdown = {
  injuryMultiplier,
  positionMultiplier,
  contractTypeMultiplier,
  teamDemandMultiplier,
  competitionMultiplier,
  bidJitterMultiplier,
  franchiseMultiplier,
};
```

最終值只由單一`calculateOfferAnnualSalary()`相乘。

## 14. UI報價比較

每個報價卡顯示：

```text
球団名／所属レベル
契約：4年
年俸：8,500万円
保障総額：3億4,000万円
出来高：最大595万円／年
チーム需要：高い
契約タイプ：長期契約
```

可展開詳細：

```text
市場基準額
故障補正
守備位置係数
契約タイプ係数
球団需要
競合補正
最終年俸
```

不得顯示`R()`、hash、內部teamId或reasonCode。

## 15. lastFaMarket

```js
{
  marketKey: 'FA:2032:DOMESTIC',
  generatedYear: 2032,
  marketRating: 5.4,
  injuryStatus: 'HEALTHY',
  offerCount: 3,
  offers: [...],
  acceptedOfferId: null,
}
```

規則：

- 同marketKey再次開啟使用已保存offers。
- 接受後寫入acceptedOfferId。
- 不可返回後重抽。
- 新年度可產生新marketKey。

## 16. 激勵與生涯收入顯示

生涯收入至少區分：

```text
固定年俸累計
契約金累計
出来高累計
買い取り累計
社会人給与累計
生涯総収入
```

如果現行沒有固定年俸獨立累計，本版新增：

```js
careerBaseSalary: 0,
```

phaseEnd固定年薪支付時同步增加。`careerEarnings`仍為所有選手收入總和。

## 17. 存檔migration

預設：

```js
careerBaseSalary: 0,
careerIncentive: 0,
yearlyIncentivePaid: {},
lastFaMarket: null,
```

舊合約schema v2轉v3時：

- 保持所有排程。
- 不為舊合約補發激勵。
- 新年度之後新簽合約才有incentive。

## 18. RNG影響

- 球隊需求與候選排序完全不使用RNG。
- 每個實際入選報價只使用一次`R()`產生bidJitter。
- 同年度同市場只生成一次並保存。
- UI開關、排序顯示、比較不得消耗RNG。
- 新報價RNG是v1.4.0預期市場變更，必須在CHANGELOG說明。

## 19. 單元測試

1. SP／RP／C／IF／OF分類正確。
2. 分類函式只會回傳SP／RP／C／IF／OF之一。
3. 相同seed／年／隊／分類需求值一致。
4. 需求倍率正確為0.95～1.05。
5. 報價數受rating、傷病、負面特性影響且限制0～4。
6. 候選球隊無重複。
7. 各倍率相乘，沒有互相覆蓋。
8. offerCount 1～4的competition倍率正確。
9. 每個入選報價只呼叫一次RNG。
10. 同marketKey重開不消耗RNG。
11. 長／短／證明約倍率正確。
12. 激勵FULL／HALF／NONE正確。
13. 激勵同年度只支付一次。
14. 激勵不加入currentSalary或schedule。
15. schema v2轉v3不改金額。

## 20. E2E驗收

| 案例 | 驗收結果 |
|---|---|
| 高評價健康FA | 最多4隊、可比較總額與激勵 |
| 普通評價FA | 報價數合理，不強制湊4隊 |
| 重傷／復健FA | 報價數與年限沿用v1.3.0限制 |
| 高需求球隊 | 同條件報價略高且明細可見 |
| 無報價 | 原隊0.90一年約或引退 |
| 重開FA畫面 | 報價完全相同、不重抽 |
| 接受長約 | 固定schedule與激勵條款正確 |
| 獲得MVP | 支付完整激勵且收入只加一次 |
| payD>=3無獎 | 支付半額激勵 |
| 樣本不足 | 不支付激勵 |
| 手機360px | 報價金額與球隊名不截斷 |

## 21. 完了條件

- `VERSION === '1.4.0'`
- 球隊需求確定性且不消耗RNG
- FA報價生成後固定，不可重抽
- 倍率完整保存且不互相覆蓋
- 報價最多4隊並可比較年薪、總額、激勵
- 激勵正確入帳並與固定年薪分離
- schema migration、單元測試、E2E與CHANGELOG完成

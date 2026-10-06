# yakyujinsei.com 薪資系統詳細修改設計書 v1.1.0

## 0. Codex 執行指令

- 前置版本：`v1.0.4`
- 目標版本：`v1.1.0`
- 本版性質：薪資評價核心改版，薪資結果會改變
- 禁止加入：二刀流、固定多年約重構、控制期仲裁、球隊需求、激勵獎金
- 不得在本版實作v1.1.1的詳細UI面板
- 不得增加任何RNG呼叫

## 1. 目的

將薪資評價由「能力差值＋當季獎項」改為：

```text
基礎能力d
＋實際成績修正
＋工作量／有效樣本修正
＋當季獎項修正
＝payD

最近三季payD（60%／30%／10%）
＝marketRating
```

並讓薪資曲線直接使用小數評價，移除`floor()`造成的薪資斷層。

## 2. 保留與變更

### 2.1 必須保留

- 現有各聯盟／層級`par`。
- 現有日圓薪資曲線的`base／linear／quadratic／min／max`數值。
- `rating > 7`才產生明星二次方加成。
- 現有野手守位倍率`DP_MULT`。
- NPB選秀初始年薪與簽約金。
- 社會人企業收入公式。
- v1.0.4跨層級換算。

### 2.2 必須變更

- 薪資曲線不得再先`Math.floor(d)`。
- 當季獎項加成上限由薪資用`+3`改成payD用`+1.5`。
- 實際成績與有效樣本正式進入薪資評價。
- 保存最近三季薪資評價。

## 3. 修改檔案

| 操作 | 檔案 | 責任 |
|---|---|---|
| 修改 | `src/config.js` | 版本改為`1.1.0` |
| 新增 | `src/engine/salary-evaluation-policy.js` | payD、成績、工作量、三季市場評價純函式 |
| 修改 | `src/engine/salary-promotion-policy.js` | 小數薪資評價與獎項相容處理 |
| 修改 | `src/engine/game.js` | 保存球季評價、候選薪資改用marketRating |
| 修改 | `src/data/jp-data.js` | 若現行為唯讀資料，新增市場基準表；不得加入函式 |
| 新增 | `tests/salary-evaluation-policy.test.mjs` | 純函式測試 |
| 修改 | `tests/salary-flow.test.mjs` | 三季與薪資流程測試 |
| 修改 | `CHANGELOG.md` | 記錄平衡變更 |

## 4. 新增資料定義

在`JP_DATA`或新的常數物件增加：

```js
marketBaselines: {
  NPB_DEV: { pitcherERA: 4.80, pitcherWHIP: 1.45, hitterOPS: 0.650, hitterAVG: 0.235 },
  NPB2:    { pitcherERA: 4.40, pitcherWHIP: 1.40, hitterOPS: 0.680, hitterAVG: 0.245 },
  NPB1:    { pitcherERA: 4.00, pitcherWHIP: 1.32, hitterOPS: 0.720, hitterAVG: 0.255 },
  KBO2:    { pitcherERA: 4.80, pitcherWHIP: 1.45, hitterOPS: 0.690, hitterAVG: 0.245 },
  KBO1:    { pitcherERA: 4.50, pitcherWHIP: 1.40, hitterOPS: 0.750, hitterAVG: 0.260 },
  CPBL2:   { pitcherERA: 4.90, pitcherWHIP: 1.47, hitterOPS: 0.690, hitterAVG: 0.245 },
  CPBL1:   { pitcherERA: 4.60, pitcherWHIP: 1.42, hitterOPS: 0.750, hitterAVG: 0.260 },
  R:       { pitcherERA: 5.00, pitcherWHIP: 1.50, hitterOPS: 0.650, hitterAVG: 0.235 },
  A1:      { pitcherERA: 4.80, pitcherWHIP: 1.46, hitterOPS: 0.670, hitterAVG: 0.240 },
  A2:      { pitcherERA: 4.60, pitcherWHIP: 1.42, hitterOPS: 0.690, hitterAVG: 0.245 },
  A3:      { pitcherERA: 4.40, pitcherWHIP: 1.38, hitterOPS: 0.710, hitterAVG: 0.250 },
  MLB:     { pitcherERA: 4.30, pitcherWHIP: 1.32, hitterOPS: 0.730, hitterAVG: 0.250 },
  IND:     { pitcherERA: 4.80, pitcherWHIP: 1.45, hitterOPS: 0.680, hitterAVG: 0.245 },
}
```

這些是初始平衡值，必須集中在資料表，不得散落於條件分支。

## 5. 新增狀態

在`newState()`增加：

```js
salaryEvaluationHistory: [],
lastSalaryEvaluation: null,
```

### 5.1 SalaryEvaluationEntry

```js
{
  schemaVersion: 1,
  year: 2027,
  age: 17,
  level: 'NPB2',
  org: 'NPB',
  role: 'SP' | 'CL' | 'MR' | null,
  position: 'SS' | '2B' | '3B' | '1B' | 'CF' | 'RF' | 'LF' | 'DH' | 'C' | null,
  baseD: 2.4,
  performanceAdjustment: 0.8,
  workloadAdjustment: 0.2,
  awardAdjustment: 0.35,
  payD: 3.75,
  sampleStatus: 'FULL' | 'PARTIAL' | 'INSUFFICIENT',
  statSummary: {
    G: 0, PA: 0, AVG: 0, OPS: 0,
    IP: 0, ERA: 0, WHIP: 0,
  },
  reasons: ['OPS_ABOVE_BASELINE', 'FULL_SAMPLE', 'TITLE_AWARD'],
}
```

`salaryEvaluationHistory`只保留最近三筆，依year升冪排列，不保存DOM字串。

## 6. baseD來源與重複加成防止

現行`applySeasonForm()`會直接修改`st.d`：生涯年`+4`、低潮年`-4`。如果再用實際成績修正，會重複計算同一球季狀態。

因此修改`simSeason()`：

```js
st.baseD = d;       // applySeasonForm前
st.d = d;           // 保留現行其他系統使用
```

`applySeasonForm()`後保存：

```js
st.formAdjustment = st.form === 1 ? 4 : st.form === -1 ? -4 : 0;
```

薪資`payD`必須使用：

```text
baseD = st.baseD
```

不得使用已包含`formAdjustment`的`st.d`作為payD基礎。生涯年／低潮年透過實際成績結果反映。

其他既有升降格與獎項流程仍可繼續使用`st.d`，本版不改其判定。

## 7. salary-evaluation-policy.js API

所有函式為純函式，不得讀取全域`S`或呼叫RNG。

### 7.1 calculateRateStats

```js
export function calculateRateStats(playerType, stats)
```

野手：

```text
AVG = H / AB
OBP = (H + BB) / PA
SLG使用既有最終st值；若沒有則由既有slgOf結果傳入
OPS = OBP + SLG
```

投手：

```text
ERA = ER × 9 / IP
WHIP = (H + BB) / IP
```

分母0時不得產生`NaN`或`Infinity`。

### 7.2 calculateSampleStatus

```js
export function calculateSampleStatus({ playerType, role, stats, gamesInLevel })
```

目標工作量：

```text
野手 target = gamesInLevel × 3.10 PA
先發 target = gamesInLevel × 0.90 IP
後援 target = gamesInLevel × 0.35 G
```

```text
ratio = actual / target
FULL         ratio >= 0.75
PARTIAL      0.35 <= ratio < 0.75
INSUFFICIENT ratio < 0.35
```

### 7.3 calculateWorkloadAdjustment

```js
export function calculateWorkloadAdjustment(sampleRatio)
```

公式：

```text
clamp((sampleRatio - 1) × 1.5, -1.0, +0.75)
```

### 7.4 calculatePitcherPerformanceAdjustment

```js
export function calculatePitcherPerformanceAdjustment({ era, whip, baseline, sampleStatus })
```

`INSUFFICIENT`時回傳0，避免小樣本率數誇大。

其他情況：

```text
eraComponent  = (baseline.pitcherERA  - era)  / 0.80 × 0.90
whipComponent = (baseline.pitcherWHIP - whip) / 0.18 × 0.60

adjustment = clamp(eraComponent + whipComponent, -1.5, +2.5)
```

`PARTIAL`再乘0.65。

### 7.5 calculateHitterPerformanceAdjustment

```js
export function calculateHitterPerformanceAdjustment({ avg, ops, baseline, sampleStatus })
```

`INSUFFICIENT`時回傳0。

```text
opsComponent = (ops - baseline.hitterOPS) / 0.080 × 0.90
avgComponent = (avg - baseline.hitterAVG) / 0.030 × 0.40

adjustment = clamp(opsComponent + avgComponent, -1.5, +2.5)
```

`PARTIAL`再乘0.65。

### 7.6 calculateMarketAwardAdjustment

```js
export function calculateMarketAwardAdjustment(honors, year)
```

只計算當年度：

| 獎項 | 加成 |
|---|---:|
| 年間MVP、最優秀投手賞、沢村賞 | +0.75 |
| 主要個人王座 | +0.35 |
| ゴールデングラブ賞、年間最優秀守備選手 | +0.25 |
| 新人王 | +0.25 |
| 明星賽／代表成績 | 0 |

合計上限`+1.5`。

同一字串只計算一次。三冠王如果同時保存個別王座與三冠王稱號，三冠王稱號本身不再額外加分，防止雙重加成。

### 7.7 calculatePayD

```js
export function calculatePayD({ baseD, performanceAdjustment, workloadAdjustment, awardAdjustment })
```

```text
payD = baseD
     + performanceAdjustment
     + workloadAdjustment
     + awardAdjustment
```

回傳保留兩位小數，不在此限制0～26。

### 7.8 appendSalaryEvaluation

```js
export function appendSalaryEvaluation(history, entry)
```

- 同year已存在時覆蓋，不得重複。
- 依year升冪。
- 只保留最後三筆。
- 回傳新陣列。

### 7.9 calculateMarketRating

```js
export function calculateMarketRating(history)
```

標準權重：

```text
最新年度 60%
前一年度 30%
前兩年度 10%
```

資料不足時重新正規化：

```text
1季：100%
2季：60/(60+30)=66.67%，30/(60+30)=33.33%
3季：60%，30%，10%
```

只依陣列年度順序取最近三筆，不假設年份連續；缺季不得自動補0。

回傳：

```js
{
  marketRating,
  components: [
    { year, payD, rawWeight, normalizedWeight, contribution }
  ]
}
```

## 8. 薪資曲線改為小數評價

修改現行`salaryFor(lv, d)`：

```text
rating = clamp(Number(d) || 0, 0, 26)
star = max(0, rating - 7)

salary = base
       + rating × linear
       + star² × quadratic
```

移除：

```js
Math.floor(Number(d) || 0)
```

薪資最終仍使用`roundToTenThousandYen()`。

社會人`CORP`公式維持OVR計算，不改用marketRating。

## 9. 球季結算流程

在職業／獨立聯盟球季成績確定、獎項判定完成後，建立評價。

順序固定：

```text
simSeason完成
→ 實際成績物理上限完成
→ 獎項判定完成
→ buildSalaryEvaluationEntry
→ appendSalaryEvaluation
→ calculateMarketRating
→ 休賽季薪資／市場使用
```

不得在獎項判定前建立最終payD，否則會漏掉當季獎項。

## 10. 薪資候選值

修改`currentSalaryD()`概念：

```js
const currentMarketRating = () => {
  const result = calculateMarketRating(S.salaryEvaluationHistory);
  return result.marketRating;
};
```

所有正常續約、升降格、FA、跨聯盟與戰力外再簽約使用`marketRating`，再透過v1.0.4的`convertRatingBetweenLevels()`換算。

### 新人與無職業資料

- NPB選秀初始年薪仍使用固定規則。
- 沒有任何歷史評價的首次職業簽約使用`rating=0`。
- 高中、大學、社會人成績不得直接當成NPB職業市場評價。

## 11. 守位不得重複計算

本版保留現有最終`DP_MULT`，所以：

- `payD`不加入野手守位價值。
- `payD`不加入DEF。
- 獎項中的金手套只加入`+0.25`。
- 最終候選薪資只乘一次`dpMult()`。

## 12. 舊資料相容性

新增預設：

```js
salaryEvaluationHistory: [],
lastSalaryEvaluation: null,
```

舊資料沒有三季紀錄時，不得虛構過去評價。第一個新球季完成後以單季100%計算。

如果當下必須在尚未完成新球季前產生報價，暫時使用：

```text
fallbackRating = Number(lastD) || 0
```

並在原因中標記`LEGACY_RATING_FALLBACK`，供v1.1.1顯示。

## 13. RNG影響

- 所有新增評價函式不得呼叫RNG。
- 不得為薪資評價重新模擬成績。
- 必須使用已生成的`S.lastSt`。
- 同seed同選擇的隨機事件、成績生成與事件順序不變。
- 薪資數字改變是本版預期差異；若玩家因不同報價選擇不同路線，後續差異不屬固定seed回歸失敗。

## 14. 單元測試

至少包含：

1. 野手完整樣本、OPS高於基準時得到正修正。
2. 投手ERA／WHIP低於基準時得到正修正。
3. 不足樣本的performanceAdjustment為0。
4. 不足樣本的workloadAdjustment可為負數。
5. PARTIAL績效修正乘0.65。
6. 各修正限制在指定上下限。
7. 當季獎項最高+1.5。
8. 三冠王與個別王座不重複計分。
9. 一季歷史權重100%。
10. 二季歷史權重66.67%／33.33%。
11. 三季歷史權重60%／30%／10%。
12. 同年度評價覆蓋而不重複。
13. 只保留最近三季。
14. `rating=6.9`與`7.1`薪資連續，不再整數跳階。
15. 守位倍率只套用一次。
16. NPB二軍市場評價跨一軍前正確換算par。

## 15. 平衡測試

以固定能力、固定成績物件做矩陣，不使用RNG：

| 類型 | 最少案例 |
|---|---:|
| NPB一軍先發 | 低／中／高表現各3 |
| NPB一軍後援 | CL／MR各3 |
| NPB一軍野手 | 低／中／高OPS各3 |
| MLB投手／野手 | 各6 |
| KBO一軍／CPBL一軍 | 各6 |
| NPB二軍→一軍 | 6 |
| 3A→MLB | 6 |

驗收重點：

- 連續兩季好表現的市場評價高於只好一季。
- 單季低潮不會完全抹除前兩季。
- 高能力但差成績不應等同高能力好成績。
- 低能力但極小樣本好成績不能取得明星市場價。

## 16. E2E驗收

1. 球季結束後產生一筆完整評價。
2. 第二、三季後權重正確。
3. 畫面目前年薪仍支付原年薪，休賽季才決定下一年。
4. NPB選秀初始年薪不受空歷史影響。
5. 升格與海外移籍使用marketRating與par換算。
6. 獨立聯盟評價與收入仍正常。
7. `salaryEvaluationHistory`不影響DOM或事件RNG。

## 17. 完了條件

- `VERSION === '1.1.0'`
- payD與marketRating均由純函式計算
- 實際成績、樣本、工作量、當季獎項均有明確修正
- 三季權重與資料不足正規化正確
- 薪資曲線使用小數評價
- 守位沒有重複加成
- 舊資料可繼續進行遊戲
- 測試與CHANGELOG完成

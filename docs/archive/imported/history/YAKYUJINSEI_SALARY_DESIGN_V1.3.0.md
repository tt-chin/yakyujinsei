# yakyujinsei.com 薪資系統詳細修改設計書 v1.3.0

## 0. Codex 執行指令

- 前置版本：`v1.2.0`
- 目標版本：`v1.3.0`
- 本版性質：控制期、MLB簡化仲裁、傷病市場與證明約
- 禁止加入：二刀流、激勵獎金、球隊需求、完整FA競標重構
- NPB、MLB、KBO、CPBL不得共用同一套年資規則
- 固定合約保障原則不得被傷病市場倒寫

## 1. 目的

建立不同聯盟的契約階段：

- NPB：FA前以一年期年俸更改為主，FA後可固定多年約。
- MLB：控制期、簡化仲裁、FA三階段。
- KBO／CPBL：FA前簡化一年期續約，FA後可多年約。
- 傷病：影響下一份合約的市場評價、倍率、報價數與年限。
- 證明約：重大傷勢或整季復健後可取得一年期固定合約。

本版不採用「短約全年報銷只付50%」。所有已簽固定合約仍依v1.2.0排程支付。

## 2. 修改檔案

| 操作 | 檔案 | 責任 |
|---|---|---|
| 修改 | `src/config.js` | 版本改為`1.3.0` |
| 新增 | `src/engine/control-period-policy.js` | 年資、控制期、仲裁資格與開價純函式 |
| 新增 | `src/engine/injury-market-policy.js` | 傷病狀態、三季權重、倍率、年限、報價修正 |
| 新增 | `src/engine/arbitration-policy.js` | MLB簡化仲裁計算 |
| 新增 | `src/engine/market-policy.js` | 市場報價上下文與證明約類型；v1.4.0再擴充球隊需求 |
| 修改 | `src/engine/salary-evaluation-policy.js` | 支援依傷病狀態改變三季權重 |
| 修改 | `src/engine/contract-policy.js` | 支援CONTROL、ARBITRATION、PROOF合約 |
| 修改 | `src/engine/game.js` | 休賽季路由、續約、仲裁、傷病市場接入 |
| 修改 | `src/ui/salary-detail.js` | 顯示控制期、傷病折價與仲裁結果 |
| 新增 | `tests/control-period-policy.test.mjs` | 控制期測試 |
| 新增 | `tests/injury-market-policy.test.mjs` | 傷病市場測試 |
| 新增 | `tests/arbitration-policy.test.mjs` | 仲裁測試 |
| 修改 | `tests/salary-flow.test.mjs` | 整合流程 |
| 修改 | `CHANGELOG.md` | 記錄市場規則 |

## 3. 新增狀態

在`newState()`增加：

```js
serviceTime: {
  NPB: 0,
  MLB: 0,
  KBO: 0,
  CPBL: 0,
},
marketInjury: 'HEALTHY',
lastArbitration: null,
```

### 3.1 相容既有欄位

- 既有`npbFaSeasons`保留作為migration來源，但新規則權威值為`serviceTime.NPB`。
- 既有`svc`／`svcOrg`如仍被其他流程使用，不得立即刪除；每年結算由單一函式同步，避免兩者分歧。
- migration時：

```text
serviceTime.NPB  = max(existing serviceTime.NPB  ?? 0, npbFaSeasons ?? 0)
serviceTime.MLB  = max(existing serviceTime.MLB  ?? 0, S.stats?.MLB?.yr  ?? 0)
serviceTime.KBO  = max(existing serviceTime.KBO  ?? 0, S.stats?.KBO?.yr  ?? 0)
serviceTime.CPBL = max(existing serviceTime.CPBL ?? 0, S.stats?.CPBL?.yr ?? 0)
```

`S.stats.<ORG>.yr`只可作為舊存檔一次性migration來源。migration完成後，以每季結算寫入的`serviceTime`為唯一權威值，不得在每次載入或render時再由累積成績覆寫。

不得把MiLB球季算成MLB服務年資。

## 4. 聯盟契約階段

### 4.1 NPB

保留現行資格：

```text
国内FA：NPB登錄8季
海外FA：NPB登錄9季
```

本版不修改成高中／大學不同門檻，避免同時改變既有生涯長度。

FA前：

- 每年簽一年期`CONTROL`合約。
- 使用最新marketRating重新核薪。
- 球團強制減薪不得低於前一年年薪75%。
- 升格最低保障仍適用。
- 不提供薪資仲裁。

FA後：

- 可選固定多年約。
- 多年約依v1.2.0排程固定。

### 4.2 MLB

| MLB服務年資 | 階段 | 合約 |
|---:|---|---|
| 0～2 | CONTROL | 一年期球團控制合約 |
| 3～5 | ARBITRATION | 一年期，可選接受或仲裁 |
| 6以上 | FA | 完整自由市場，可多年固定約 |

不實作Super Two，避免額外隨機資格。

MiLB不累積MLB服務年資。MLB球季`seasonFactor >= 0.5`才記為一完整簡化年資；不足時年資不增加，但傷病市場仍記錄。

### 4.3 KBO／CPBL

- FA前使用一年期`CONTROL`合約。
- 每年依最新市場評價續約。
- 強制減薪不得低於前一年75%。
- 現行FA資格判定若存在則保留；不得以NPB門檻覆蓋。
- FA後可固定多年約。
- 不提供仲裁。

## 5. control-period-policy.js API

### 5.1 getContractStage

```js
export function getContractStage({ org, serviceYears, faEligible })
```

回傳：

```text
CONTROL | ARBITRATION | FA
```

必須明確依org分支，不得只依年資共用。

### 5.2 calculateControlOffer

```js
export function calculateControlOffer({
  marketSalary,
  previousSalary,
  marketRating,
  serviceYears,
  org,
})
```

初始球團係數：

```text
NPB／KBO／CPBL
clubMult = clamp(
  0.91 + marketRating×0.045 + min(serviceYears,6)×0.045,
  0.80,
  1.45
)

MLB 0～2年
年資0：0.20
年資1：0.35
年資2：0.60
```

候選：

```text
candidate = marketSalary × clubMult
protected = max(candidate, previousSalary × 0.75, levelMinimum)
```

MLB控制期仍不得低於MLB最低保障。v1.3.0使用現行`salaryFor('MLB',0)`作遊戲最低保障，後續若另設法定底薪只改資料表。

回傳所有中間值供UI顯示。

### 5.3 applyForcedCutProtection

```js
export function applyForcedCutProtection(candidate, previousSalary, floorRate = 0.75)
```

只適用：

- NPB／KBO／CPBL控制期續約。
- MLB控制期及仲裁結果。

不適用：

- FA自由市場。
- 玩家自行選擇長約。
- 無報價回原隊。
- 證明約。

## 6. 傷病市場狀態

### 6.1 判定

```js
export function classifyMarketInjury({ seasonFactor, rehab, skipMid, majorInjuryOccurred })
```

優先順序：

```text
rehab > 0 或 skipMid且seasonFactor===0 → REHAB
majorInjuryOccurred 或 0 < seasonFactor < 0.50 → MAJOR
0.50 <= seasonFactor < 0.95 → MINOR
seasonFactor >= 0.95 → HEALTHY
seasonFactor === 0且沒有復健旗標 → MAJOR
```

回傳值：

```text
HEALTHY | MINOR | MAJOR | REHAB
```

## 7. 傷病下的最近三季權重

修改`calculateMarketRating(history, options)`：

| 狀態 | 本季 | 前季 | 前兩季 |
|---|---:|---:|---:|
| HEALTHY | 60% | 30% | 10% |
| MINOR | 50% | 35% | 15% |
| MAJOR | 35% | 40% | 25% |
| REHAB | 20% | 50% | 30% |

資料不足仍重新正規化，不補0。

傷病球季本身的payD照v1.1.0由實際樣本與工作量決定，不得直接強制設成`-2`。

## 8. 明星判定與傷病倍率

明星判定：

```text
最近兩個健康／小傷球季payD平均 >= 7
```

資料不足兩季時不判明星；不得用單季獎項直接跳過。

### 8.1 年薪倍率

| 狀態 | 一般球員 | 明星球員 |
|---|---:|---:|
| HEALTHY | 1.00 | 1.00 |
| MINOR | 0.93 | 0.93 |
| MAJOR | 0.70 | 0.82 |
| REHAB | 0.55 | 0.72 |

倍率只套用新合約／續約市場價，不修改已簽固定schedule。

### 8.2 報價數與年限

| 狀態 | 報價數修正 | 合約最長年限 | 建議類型 |
|---|---:|---:|---|
| HEALTHY | 0 | 正常上限 | 長約／短約 |
| MINOR | 0 | 正常上限 | 長約／短約 |
| MAJOR | -1 | 3年 | 優先證明約 |
| REHAB | -2 | 2年 | 證明約 |

報價數最低0，最高仍為現行4。

## 9. 證明約

`contractType: 'PROOF'`：

- 固定1年。
- 年薪：傷病倍率後的市場價×1.05。
- 不適用75%強制減薪保護。
- 年薪仍不得低於目標層級最低保障。
- 已簽後全年照排程支付，不因再次受傷只付50%。
- 當季好表現於下一年市場評價反映。

UI日文：

```text
再起を懸ける1年契約（証明契約）
```

## 10. MLB簡化仲裁

### 10.1 仲裁選項

MLB服務年資3～5且合約到期時顯示：

1. 球団提示を受け入れる。
2. 中間案で合意を試みる。
3. 年俸調停を申請する。

### 10.2 arbitration-policy.js

```js
export function calculateArbitrationTerms({
  marketSalary,
  previousSalary,
  marketRating,
  serviceYears,
})
```

```text
clubMult = clamp(
  0.91 + marketRating×0.045 + min(serviceYears,6)×0.045,
  0.80,
  1.45
)

playerMult = clamp(
  clubMult + 0.08 + max(0,marketRating)×0.018,
  0.92,
  1.70
)

middleMult = (clubMult + playerMult) / 2

winChance = clamp(
  47 + marketRating×8 + min(serviceYears,6)×2,
  15,
  88
)
```

各年薪都套用75%減薪保護與MLB最低保障。

### 10.3 RNG

- 查看條件與報價不得消耗RNG。
- 只有玩家選擇「年俸調停を申請する」後呼叫一次`chance(winChance)`。
- 不得預先抽結果。
- 中間案不使用RNG，直接使用middleMult，避免額外隨機。

### 10.4 結果

勝訴：使用playerSalary。

敗訴：使用clubSalary。

接受球團：使用clubSalary。

中間合意：使用middleSalary。

建立一年期`ARBITRATION`合約並保存：

```js
S.lastArbitration = {
  year,
  result: 'ACCEPTED' | 'SETTLED' | 'WON' | 'LOST',
  clubSalary,
  playerSalary,
  finalSalary,
  winChance,
};
```

## 11. 休賽季路由

合約到期後順序：

```text
確認org與服務年資
→ getContractStage
→ CONTROL：一年期控制合約
→ ARBITRATION：顯示仲裁選項
→ FA：進入既有FA市場
→ 套傷病市場狀態
→ 產生合約
```

不得先進FA再回頭判定控制期。

## 12. 合約與傷病交互作用

- 固定多年約中受傷：原schedule不變。
- 合約最後一年受傷：本年照付；下一份合約折價。
- 傷病後升格：現約只套升格最低保障。
- 傷病後戰力外：如球團主動解除，先處理100%買斷，再產生新市場。
- 證明約中再次受傷：本約照付；下一次市場重新判定。

## 13. UI顯示

薪資詳情新增：

```text
契約段階：MLB年俸調停対象（在籍4年）
健康状態：大きな故障
市場評価：4.80
故障補正：×0.70
減俸保護：前年の75%
```

仲裁畫面顯示三個金額、勝率與結果，不得只顯示倍率。

證明約顯示：

```text
1年／固定年俸／満了後に再評価
```

## 14. 存檔migration

預設：

```js
serviceTime: { NPB: 0, MLB: 0, KBO: 0, CPBL: 0 },
marketInjury: 'HEALTHY',
lastArbitration: null,
```

migration後：

- 不得改變現有合約排程。
- 不得因載入瞬間重算年薪。
- 只在下一次合約到期時套用控制期／傷病市場。

## 15. 單元測試

1. NPB 8季為国内FA、9季可海外FA。
2. MLB 0～2 CONTROL、3～5 ARBITRATION、6+ FA。
3. MiLB年資不計入MLB。
4. NPB不出現仲裁。
5. 控制期最多強制減薪25%。
6. FA與證明約不套75%保護。
7. 四種傷病權重正確且資料不足會正規化。
8. 明星與一般重大傷勢倍率不同。
9. 固定多年約不受傷病倍率改寫。
10. MAJOR與REHAB產生1年證明約。
11. 仲裁各倍率與勝率上下限正確。
12. 只有選擇仲裁時消耗一次RNG。
13. 中間合意不消耗RNG。
14. 已簽證明約全年照付。

## 16. E2E驗收

| 案例 | 驗收結果 |
|---|---|
| NPB FA前續約 | 一年期、最新市場、最多減薪25% |
| NPB 8／9季 | 国内／海外FA選項正確 |
| MLB第2年 | 控制合約，無仲裁 |
| MLB第4年 | 出現三種仲裁選項 |
| MLB第6年 | 進入FA，不再出現仲裁 |
| 多年約中重傷 | 原schedule完整支付 |
| 重傷後合約到期 | 報價減少、最長3年、可證明約 |
| 復健年後合約到期 | 一年證明約為主 |
| 明星重傷 | 折價低於一般球員 |
| 固定seed未選仲裁 | 不增加RNG消費 |

## 17. 完了條件

- `VERSION === '1.3.0'`
- 聯盟契約階段分離
- MLB控制／仲裁／FA路由正確
- NPB維持8／9季資格且無仲裁
- 傷病不改寫已簽固定合約
- 證明約、明星保護、報價與年限修正完成
- UI、migration、測試與CHANGELOG完成

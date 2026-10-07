# 全球契約・年俸市場系統全面修正②：年俸・跨聯盟市場換算 詳細修正仕様書

## 基準・目的

実装補足（2026-10-08）：調査基準はdev v1.8.2。推奨範囲の最終承認値は [承認資料](tasks/global-contract-market-parameters-proposal.md)、v1.9.0の実装後仕様は [CURRENT_SPEC.md](CURRENT_SPEC.md) §11へ移管する。評価格付けはsalary curveの入力であり、もう一度掛けない。CPBL900万円例の通常上限は2.5倍の2250万円。旧例の2500万円は採用しない。

`tt-chin/yakyujinsei` `dev`
を基準に、NPB/KBO/CPBL/MLB/MiLBの年俸、FA、海外移籍、復帰、戦力外再契約、昇降格を修正する。契約金は別紙。目的は「NPB年俸900万円→CPBL年俸1億円超」のような市場断絶を解消しつつリーグ差を残すこと。

## 現行ロジック

active `salaryCandidate` は前年俸を使わず、直近市場評価→level換算→target
`salaryFor()`→contract multiplier→position multiplierで新年俸を作る。
active `overseasOffer` はNPB→KBO/CPBL/MLBで一律
`contractMult:1.3`。海外→NPBは1.0で非対称。 新 `market-policy.js` には
injury / position / contract type / team demand / franchise /
competition / bid jitter / level minimum があり、この基盤は維持する。

## 問題

-   前年俸anchorがなく一季10倍超が可能
-   CPBL/KBO/MLBへ一律×1.30
-   route別cap/floorなし
-   KBO外国人総額上限未反映
-   MLB国際制限対象と外国プロ例外が未分離
-   戦力外後の跨聯盟も同じ問題を持つ
-   `game.js`
    に旧関数と後段overrideが共存するため、検索最初の関数をactiveと誤認しやすい

## 新基本式

``` text
TargetMarketSalary
 = target salary curve
 × converted market rating
 × position
 × injury
 × contract type
 × team demand
 × competition

RouteAdjustedMarket
 = TargetMarketSalary × routeMultiplier

AnchoredSalary
 = CurrentSalary × (1-routeWeight)
 + RouteAdjustedMarket × routeWeight

FinalSalary
 = league minimum
 → relative raise/cut cap
 → league regulatory cap
 → 1万円単位round
```

## 新policy

`docs/src/engine/cross-league-market-policy.js`

``` js
getCrossLeaguePolicy({
 sourceOrg,sourceLevel,targetOrg,targetLevel,
 age,serviceYears,transferType
})
```

戻り値：

``` js
{
 marketMultiplier,
 routeWeight,
 minRaiseRate,
 maxRaiseRate,
 maxCutRate,
 hardAnnualCap,
 eligibilityType
}
```

## route別推奨

### NPB→CPBL

-   marketMultiplier 0.95～1.10
-   routeWeight 0.60
-   通常上昇cap 前年俸×2.5
-   高評価スター例外×4.0
-   CPBL市場上限policyを最終適用
-   900万円、21歳、OVR54、一軍昇格直後なら通常1,500～2,500万円、強需要・良実績で3,000万円台。1億円級は不可。

### NPB→KBO

-   routeWeight 0.65
-   通常上昇cap×3.0
-   新規外国人契約の総額capを最優先
-   契約金・optionを含むpackageで判定

### NPB→MLB

A. 国際制限対象：international pool扱い。大型FA市場を使わない。 B.
25歳以上＋認定海外プロ6季以上相当：通常市場。routeWeight
0.9～1.0。真正FA級は前年俸倍率capで不当に抑えない。

### MLB/MiLB→NPB

-   MLB実績者とMiLBのみを分離
-   target NPB market＋最近3年実績中心
-   routeWeight 0.70
-   MLB高年俸をそのまま保証しない

### KBO→NPB

-   routeWeight 0.70
-   KBO実績をNPB level parへ換算
-   外国人補強premium可
-   通常は前年俸×1.5～2.5目安、超級成績のみ例外

### CPBL→NPB

-   routeWeight 0.65
-   NPB2/NPB1 target別
-   突出成績なら大幅昇給可
-   NPB salary curveへ100%置換しない

### 戦力外→他リーグ

`outOfOrg` も同policy。通常maxRaiseRate
1.5、特殊高評価2.0。戦力外なのに海外へ行くだけで大幅昇給させない。

## 同一リーグ

`renewAndAdvance`, `arbitrationFlow`, `faMarket`,
`applyPromotionSalary`, `applyDemotionSalary`, `appendContractExtension`
の既存基盤を極力維持。跨聯盟修正のために全面再設計しない。

## salary curve data化

`salaryFor()` の値を `LEAGUE_SALARY_CURVES`
等へdata化推奨。ただし純粋関数としseedを変えない。NPB_DEV/NPB2/NPB1/KBO2/KBO1/CPBL2/CPBL1/R/A1/A2/A3/MLBを明示。

## KBO

国内選手平均年俸を外国人基準に直接使わない。新規外国人は年俸＋契約金＋option等の総額capを適用。再契約は別ルール。2026アジアクォータは通常外国人枠と混ぜない。

``` js
applyKboForeignPackageCap({annualSalary,signingBonus,incentiveMax,isRenewal})
```

## CPBL

一軍シーズン中月給最低額を年額floorの参考にする。外国人はmarket
valueで上振れ可能だが「NPB出身だから×1.3」を廃止。

## MLB/MiLB

R/A1/A2/A3とMLBを同じ市場にしない。MLBはCONTROL/ARBITRATION/FAを維持。国際制限対象は別route。postingは別紙の移籍制度へ。

## NPB減俸

NPB制度に寄せる場合、1億円以下は原則前年75%以上、1億円超は原則前年60%以上を推奨。現行一律75%を変更する場合はNPBだけに限定する。

## 前年俸anchor適用

適用：海外移籍、海外→NPB、戦力外後の他リーグ、同年新天地。
原則非適用：新人初契約、真正MLB FA級、長期契約満了後の特殊市場。

## Salary Detail

追加表示： - 移籍元市場評価 - 移籍先換算評価 - 移籍先市場基準額 -
跨聯盟係数 - 前年俸anchor - 上昇率上限 - リーグ制度上限 - 最終年俸

reason code： `CROSS_LEAGUE_MARKET_ADJUSTMENT` `PREVIOUS_SALARY_ANCHOR`
`CROSS_LEAGUE_RAISE_CAP` `LEAGUE_REGULATORY_CAP` `MLB_INTL_RESTRICTED`
`FOREIGN_PRO_EXEMPT`

## 900万円→CPBL acceptance

入力：21歳、NPB、900万円、NPB一軍昇格、OVR54、通常～良好評価、CPBL一軍offer。
NG：1億3万円。
期待：通常1,500～2,500万円程度、強需要・良実績で3,000万円台。固定額ではなく市場要素で変動するが通常10倍超は禁止。

## その他テスト

1.  NPB900万→KBO：制度cap内、通常10倍超なし
2.  NPBスター→MLB真正FA：大幅昇給を不当にcapしない
3.  23歳・経験不足→MLB：真正FA扱い禁止
4.  25歳以上＋6季相当→MLB：通常市場
5.  MLB高年俸→NPB：そのまま保証しない
6.  CPBLスター→NPB：段階換算
7.  KBO→NPB：合理的外国人市場
8.  戦力外→CPBL/KBO：自動大幅昇給なし
9.  同一リーグFA維持
10. MLB arbitration維持
11. NPB減俸floor
12. 旧save
13. salary detail理由
14. 投手/野手固定seed
15. mobile

## 実装候補

新規： - `docs/src/engine/cross-league-market-policy.js` - 必要なら
`docs/src/data/league-salary-data.js`

修正： - `game.js` - `market-policy.js` - `control-period-policy.js` -
`salary-explanation-policy.js` - `salary-market-data.js` -
`salary-detail.js` - 必要に応じ `contract-policy.js`

## seed

team demand/bid
jitter等の既存乱数消費順を維持。新価格計算は純粋関数で追加乱数なし。offer数・team選択を変更しない。乱数消費変更が必要なら実装前にユーザー承認。

## 旧コード

旧 `signTo` / `faMarket` / `crossOffers` とactive
overrideが共存する。今回いきなり大規模削除せずactive
bindingをテストで固定。legacy cleanupは別タスク。

## 実装順

active call graph → cross-league policy → salaryCandidate optional route
context → overseasOffer → 海外→NPB → faMarket routes → outOfOrg → KBO
cap → MLB restricted/exempt → salary detail → migration → tests →
CURRENT_SPEC/BACKLOG/CHANGELOG。

## 完了条件

-   [ ] NPB→CPBL 900万→1億問題解消
-   [ ] NPB→KBO合理化
-   [ ] NPB→MLB restricted/exempt分離
-   [ ] MLB/MiLB→NPB合理化
-   [ ] KBO→NPB合理化
-   [ ] CPBL→NPB合理化
-   [ ] 戦力外跨聯盟にも同policy
-   [ ] 一律海外×1.30廃止
-   [ ] 前年俸anchor
-   [ ] route別raise/cut cap
-   [ ] KBO制度cap
-   [ ] NPB減俸ルール明示
-   [ ] salary detail理由表示
-   [ ] 同一リーグFA/調停維持
-   [ ] 旧save互換
-   [ ] seed回帰
-   [ ] mobile確認
-   [ ] CURRENT_SPEC/BACKLOG/CHANGELOG更新

## バージョン

文書のみは更新不要。実装は新cross-league market
policy導入のためMINOR候補。契約金全面修正と同一リリースにまとめ、実装・テスト完了時にAGENTS.mdで最終判断する。

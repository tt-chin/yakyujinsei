# NPBドラフト契約金・生涯総収入表示 修正指示書

## 1. 目的

NPBドラフト入団直後の契約金・年俸・生涯総収入の表示関係が分かりにくい問題を修正する。

現在、ドラフト契約時に契約金は `careerSigningBonus` と `careerEarnings`
へ正しく加算される。一方、契約オブジェクト `ct`
に契約金が保持されず、「年俸の内訳」画面から確認できない。

例： - ドラフト5巡目 - 契約金：3,216万円 - 新人年俸：1,200万円 -
年俸はまだ未払い - 生涯総収入：3,216万円

計算自体は正しい。本修正では給与計算ロジックを変更せず、契約金のデータ保持と表示を改善する。

## 2. 生涯総収入の計算は変更しない

現行処理：

``` js
state.careerSigningBonus =
  (Number(state.careerSigningBonus) || 0) + bonus;
state.careerEarnings =
  (Number(state.careerEarnings) || 0) + bonus;
```

この仕様は維持する。年俸1,200万円は実際に支払われるまでは
`careerEarnings` に加算しない。

## 3. 契約データに契約金を保持する

対象：`src/engine/contract-policy.js`

契約 schemaVersion 3 に `signingBonus`
を追加する。単位は既存金額データと同じ円。

``` js
{
  schemaVersion: 3,
  contractId: "...",
  org: "NPB",
  teamId: "...",
  contractType: "CONTROL",
  startYear: 2029,
  endYear: 2029,
  annualSalary: 12000000,
  signingBonus: 32160000
}
```

## 4. createContract() 対応

optional parameter として `signingBonus = 0` を追加し、生成契約へ
`signingBonus: roundYen(signingBonus)` を保存する。契約金がない場合は0。

## 5. normalizeContract() の後方互換

旧データで `signingBonus` が存在しない場合は0として扱う。schemaVersion
は本修正だけを理由に変更しなくてよい。

## 6. NPBドラフト契約時に契約金を渡す

対象： - `src/engine/draft-signing-policy.js` - `src/engine/game.js`

ドラフト契約作成時にも同じ `bonus`
を渡し、以下で同じ契約金を参照可能にする。

-   `careerSigningBonus`
-   `careerEarnings`
-   `ct.signingBonus`

`ct.signingBonus` は表示・契約記録用であり、ここから再度
`careerEarnings` に加算してはならない。二重加算を禁止する。

## 7. salary detail の表示修正

対象：`src/ui/salary-detail.js`

NPBドラフト契約で `signingBonus > 0` の場合、以下のように表示する。

``` text
現契約
契約種別        NPB球団保有期間
契約期間        2029～2029年
契約金          3,216万円
年俸            1,200万円
出来高          最大84万円／年
保証年俸総額    1,200万円
支払済み        0円
未払い年俸      1,200万円
```

## 8. UI文言変更

`保証総額` → `保証年俸総額`

`未払い保証額` → `未払い年俸`

現在の `guaranteedTotal`
は契約金を含まない年俸合計なので、契約全体の保証額と誤解させないこと。内部変数名は変更不要。

## 9. 新人契約の年俸表示

契約金と年俸を明確に分離して表示する。

``` text
契約金          3,216万円
年俸            1,200万円
出来高          最大84万円／年
```

## 10. 所得内訳の改善

最低限以下を追加する。

-   契約金累計
-   固定年俸累計
-   出来高累計

推奨表示：

``` text
所得内訳
契約金累計             3,216万円
固定年俸累計               0円
出来高累計                 0円
スポンサー収入累計         0円
社会人給与累計             0円
生涯総収入             3,216万円
```

見出しは `スポンサー・所得内訳` より `所得内訳` または `生涯収入内訳`
を優先する。

## 11. 表示値の参照元

  表示             参照元
  ---------------- -----------------------------------------
  契約金           `ct.signingBonus`
  契約金累計       `S.careerSigningBonus`
  年俸             `ct.annualSalary` または年度別 schedule
  保証年俸総額     `ct.guaranteedTotal`
  支払済み年俸     `ct.paidTotal`
  未払い年俸       `ct.remainingValue`
  固定年俸累計     `S.careerBaseSalary`
  出来高累計       `S.careerIncentive`
  社会人給与累計   `S.corpIncome`
  生涯総収入       `S.careerEarnings`

`careerEarnings` をUI表示時に再計算せず、既存の正式累計値を使う。

## 12. ドラフトカード表示

現行の「5巡目指名。契約金3,216万円。」は正常なので維持してよい。可能であれば新人年俸も併記する。

``` text
名古屋ドラゴーンズから5巡目指名。
契約金：3,216万円
新人年俸：1,200万円
```

## 13. 契約金レンジは変更しない

本修正ではNPBドラフト契約金生成ロジックを変更しない。

現行： - 育成：200～500万円 - 1巡目：8,000～10,000万円 -
2巡目：6,000～8,000万円 - 3巡目：4,000～6,000万円 -
4～6巡目：2,000～5,000万円

したがって5巡目・契約金3,216万円は現行仕様上正常。

## 14. 二重計上防止（最重要）

正しい状態：

``` text
契約金3,216万円
careerSigningBonus = 3,216万円
careerEarnings      = 3,216万円
ct.signingBonus     = 3,216万円
```

NG：

``` text
careerEarnings = 6,432万円
```

`ct.signingBonus` 追加を理由に収入を再加算してはいけない。

## 15. 年俸支払後

2029年の年俸1,200万円支払後、他収入がなければ：

``` text
契約金累計        3,216万円
固定年俸累計      1,200万円
生涯総収入        4,416万円
```

出来高84万円も支払済みなら生涯総収入は4,500万円。

## 16. テストケース

### Case 1：ドラフト契約直後

``` text
careerSigningBonus = 32,160,000
careerBaseSalary   = 0
careerEarnings     = 32,160,000
ct.signingBonus    = 32,160,000
ct.annualSalary    = 12,000,000
```

UI：

``` text
契約金        3,216万円
年俸          1,200万円
保証年俸総額  1,200万円
支払済み      0円
未払い年俸    1,200万円
```

### Case 2：年俸支払後

``` text
careerSigningBonus = 32,160,000
careerBaseSalary   = 12,000,000
careerEarnings     = 44,160,000
```

### Case 3：出来高あり

契約金3,216万円＋年俸1,200万円＋出来高84万円＝生涯総収入4,500万円。

### Case 4：旧データ

旧契約に `signingBonus` がなくてもエラーにせず、normalize後は0。

### Case 5：契約金なしの通常契約

FA・契約更新等で `signingBonus <= 0`
の場合、「契約金」行は非表示でよい。

### Case 6：二重計上

ドラフト契約後の `careerEarnings`
が契約金の2倍にならないこと。最重要回帰テスト。

## 17. 回帰テスト

以下に影響がないこと。

-   NPBドラフト
-   育成ドラフト
-   NPB球団保有期間
-   年俸更新
-   FA契約
-   MLB/KBO/CPBL契約
-   出来高
-   契約延長
-   契約移管
-   買い取り
-   社会人給与
-   スポンサー収入
-   生涯総収入
-   引退画面
-   シェア画像
-   旧セーブデータ

特に `careerEarnings` の既存加算処理を不用意に変更しない。

## 18. UI要件

スマートフォン表示を優先する。現在のダークテーマ・レイアウトを維持し、大規模UIコンポーネントは追加しない。iPhone幅でも横スクロールを発生させない。

## 19. 実装対象候補

最低限確認：

``` text
src/engine/draft-signing-policy.js
src/engine/contract-policy.js
src/engine/game.js
src/ui/salary-detail.js
```

修正前に実際の呼び出し経路を確認し、推測だけで変更しない。

## 20. 完了条件

-   [x] NPBドラフト契約金が `ct.signingBonus` に保存される
-   [x] 契約金が `careerSigningBonus` に1回だけ加算される
-   [x] 契約金が `careerEarnings` に1回だけ加算される
-   [x] 契約金が年俸詳細画面から確認できる
-   [x] 「保証総額」を「保証年俸総額」へ変更
-   [x] 契約金累計を所得内訳に表示
-   [x] 固定年俸累計を所得内訳に表示
-   [x] 出来高累計を所得内訳に表示
-   [x] 生涯総収入との関係が画面上で理解できる
-   [x] 契約金と年俸を混同しない
-   [x] 契約金を二重計上しない
-   [x] 旧データでエラーにならない
-   [x] 育成ドラフトでも正常
-   [x] 通常の契約更新・FA契約へ悪影響がない
-   [x] モバイル表示が崩れない

# Codexへの実装指示

この修正は「給与額の再設計」ではなく、既存の契約金・年俸・生涯総収入のデータ関係を明確化する修正である。

既存の給与計算式、ドラフト順位、契約金レンジ、年俸決定ロジックは変更しない。

まず現在のコードで以下のデータフローを追跡すること。

1.  ドラフト契約金の生成
2.  `acceptDraftSelection`
3.  `signTo`
4.  `createContract`
5.  `careerSigningBonus`
6.  `careerBaseSalary`
7.  `careerEarnings`
8.  `salaryDetailMarkup`

その上で最小限の変更で実装する。

実装後は上記テストケースを確認し、特に「契約金の二重計上」が発生していないことを確認する。

## バージョン管理

実装時はリポジトリの最新 `AGENTS.md` に従うこと。

本件は既存の契約金・収入表示の不整合を修正する内容であり、原則としてPATCH候補とする。ただし実際の最新バージョンと変更内容を確認した上で
`AGENTS.md` の規則に従って最終判断すること。

バージョンを更新した場合は、同一タスク内で必ず `CHANGELOG.md`
に実際の修正内容を追記すること。

## ユーザー確認済み補足（2026-10-07）

- 正式履歴は最新AGENTSに従いCHANGELOGのみ更新する。修正版は1.8.1（PATCH）。
- 所得内訳に既存のcareerBuyoutを参照する「買い取り累計」も含める。
- 年俸詳細だけでなくキャリア・FA報価・FA成立・延長の保証額表示も「保証年俸総額」に統一する。
- 支払完了でct.annualSalaryが0になった契約は、保存済みannualScheduleの最終年度額を年俸欄に表示する。支払・累計計算を変更しない。
- 旧契約に欠けているsigningBonusは0とし、careerSigningBonusから推測して契約へ補完しない。キャリア途中保存・復元機能を新設しない。

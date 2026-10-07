# 全球契約・年俸市場系統全面修正①：契約金（Signing Bonus）詳細修正仕様書

## 基準

実装補足（2026-10-08）：本書の調査基準はdev v1.8.2。ユーザー承認済みの数値・分岐は [承認資料](tasks/global-contract-market-parameters-proposal.md)、v1.9.0の実装後仕様は [CURRENT_SPEC.md](CURRENT_SPEC.md) §11を参照。育成は独立developmentStipend欄位、契約金0。careerSigningBonusへ支度金を混在させない。保存機能は追加せず、同一契約・再描画・正規化の二重払い防止を検証する。

実装基準は `tt-chin/yakyujinsei` の
`dev`。本書は契約金・支度金・ポスティング譲渡金を扱い、年俸換算は別紙
`GLOBAL_SALARY_MARKET_SYSTEM_FIX.md` とする。`AGENTS.md` に従い、実装は
dev → Preview → 承認後 main、正式履歴は `CHANGELOG.md`。

## 調査済み関連コード

-   `docs/src/engine/game.js`: `runDraft`, `pathChoiceHS/U4`, `signTo`,
    `fixedContract`, `crossOffers`, `overseasOffer`, `faMarket`,
    `outOfOrg`, `buyoutRemaining`, `phaseEnd`
-   `draft-signing-policy.js`
-   `contract-policy.js`
-   `market-policy.js`
-   `control-period-policy.js`
-   `incentive-policy.js`
-   `salary-detail.js`
-   `salary-market-data.js`

## 現行問題

1.  NPB active `runDraft`
    の契約金は育成200～500万円、1巡8,000～10,000万円、2巡6,000～8,000万円、3巡4,000～6,000万円、4～6巡2,000～5,000万円。4～6巡が同一で下位指名が高すぎる。
2.  NPB育成を通常の「契約金」として扱っている。育成は支度金として区別する。
3.  高卒→MiLB active path は `ROOKIE` 契約だが契約金0。一方、旧
    `makeOffers()` 系にはbonusが残り、経路で不統一。
4.  旧 `pickOfferUI` / `crossOffers` / `faMarket` に
    `careerEarnings += of.bonus` が残る。active
    overrideとlegacyを区別する。
5.  旧ポスティングで `of.bonus*4` のような独自値がある。posting/release
    feeは球団間金銭で選手収入ではない。

## NPB新人契約金のゲーム基準

  区分                            推奨
  ------- ----------------------------
  1巡目              8,000～10,000万円
  2巡目               5,000～7,500万円
  3巡目               3,500～5,500万円
  4巡目               2,500～4,500万円
  5巡目               2,000～3,500万円
  6巡目               1,500～3,000万円
  育成      契約金0、支度金290万円基準

NPB支配下新人の契約金上限1億円、育成は契約金なし・支度金標準290万円を制度アンカーとする。

## 米国契約

### 高卒/大卒→MiLB

`INTERNATIONAL_AMATEUR` として扱う。ゲーム用固定円換算レンジ： -
育成候補：300～1,000万円 - 有望株：1,000～3,000万円 -
上位国際プロスペクト：3,000～8,000万円 -
特別級：8,000万円以上。ただし国際bonus pool相当のゲーム上限を設定。

### 既プロ→MLB

年齢・プロ年数で `MLB_INTL_AMATEUR_RESTRICTED` と
`MLB_FOREIGN_PRO_EXEMPT`
を分離する。25歳未満かつ十分な認定海外プロ経験がない選手を自由な大型FA契約と同一にしない。25歳以上かつ認定海外プロ6季以上相当は通常プロ市場へ。

## ポスティング

選手本人の年俸・signing bonusと、NPB球団へ払う `postingFee`
を完全分離する。Major League contractは保証総額に応じた段階式、Minor
League contractはsigning bonusの25%相当を基準とする。`postingFee` は
`careerEarnings` に含めない。

## KBO/CPBL

KBO外国人契約は契約金・年俸・option等を含む総額制約を年俸仕様書と連動させる。通常の海外移籍で大きな契約金を自動付与しない。CPBLも通常海外移籍で必ず契約金を発生させない。

## データモデル

schemaVersion 3を維持しoptional field追加：

``` js
{
  signingBonus: 0,
  signingBonusType: 'NONE', // NPB_DRAFT / NPB_DEVELOPMENT_STIPEND / MLB_INTL_AMATEUR / PRO_FA_BONUS / NONE
  postingFee: 0,
  postingFeeRecipient: null
}
```

契約金・支度金を受領した時のみ `careerSigningBonus` と `careerEarnings`
に1回加算。posting feeは絶対に加算しない。

## 共通policy

新規policyへ集約：

``` js
createSigningBonusTerms({route,org,targetOrg,draftRound,draftType,age,proSeasons,marketRating})
```

戻り値に `amount`, `type`, `playerIncome`, `postingFee`,
`rationale`。`applySigningPayment()`
は同一contractIdで二度払えないようidempotentにする。

## seed

既存乱数消費数を変更しないことを最優先。NPBドラフトは既存 `ri()`
1回を維持し範囲だけ変える案を優先。追加乱数が必要なら実装前にユーザー承認。

## UI

`契約金`、`育成支度金`、`ポスティング譲渡金（球団への支払い・生涯収入対象外）`
を混同しない。所得内訳には契約金・支度金累計、固定年俸、出来高、買い取り、スポンサー、社会人給与、生涯総収入を表示し、posting
feeは所得に入れない。

## 旧save

-   signingBonus missing → 0
-   signingBonusType missing → amount\>0ならLEGACY
-   postingFee missing → 0
-   過去のcareerEarningsを遡及再計算しない

## テスト

1.  NPB1巡は1億円超なし
2.  NPB6巡は旧仕様の5,000万円近辺なし
3.  育成は支度金表示
4.  高卒→MiLBに国際契約bonus
5.  posting feeはcareerEarningsに入らない
6.  海外FAはposting feeなし
7.  reloadでbonus二重計上なし
8.  契約拒否は収入なし
9.  KBO/CPBL通常移籍で新人bonus自動付与なし
10. 旧save正常
11. 投手/野手固定seed
12. mobile salary detail

## 実装順

active call graph確認 → signing policy → NPB draft → MiLB国際契約 →
posting fee分離 → contract optional field → income ledger → UI →
migration → tests → CURRENT_SPEC/BACKLOG/CHANGELOG。

## 完了条件

-   [ ] 契約金と年俸を完全分離
-   [ ] 契約金とposting feeを完全分離
-   [ ] NPB順位別契約金合理化
-   [ ] 育成は支度金
-   [ ] 米国国際契約bonus統一
-   [ ] KBO/CPBL通常移籍に不自然な一律bonusなし
-   [ ] 二重計上なし
-   [ ] 旧save互換
-   [ ] seed回帰
-   [ ] UI説明可能
-   [ ] CURRENT_SPEC/BACKLOG/CHANGELOG更新

## バージョン

文書のみは更新不要。実装は新policy・契約仕様拡張を含むためMINOR候補。年俸市場全面修正と同一リリースにまとめ、実装完了時にAGENTS.mdで最終判断する。

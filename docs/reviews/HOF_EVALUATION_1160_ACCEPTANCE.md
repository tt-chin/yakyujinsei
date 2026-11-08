# 殿堂評価1.16.0：本機実装・検証記録

2026-11-08。branch feature/hof-evaluation-policy、開始基準dev 25b815e07f426604f453fdb538266a4630143dbe。既存のBACKLOG／CURRENT_SPEC変更と未追跡批准規格を保持。製品1.15.1→1.16.0（仕様拡張MINOR）。未commit／push／CI／Full／部署。R3、Fullは後続受入に必要であり本輪のQuick結果で代替しない。

## 範囲・許容差分

TEST-COMPARE-BASELINE-01、HOF-DISPLAY-ROUND-01、HOF-BUCKET-DECISION-01、HOF-HONOR-POLICY-01。批准決定と追加の退休RNG／franchise決定はtasks/HOF_JERSEY_APPROVED_SPEC.md参照。背番号、永久欠番、投手係数A／B／C、取消済み票選確率化は未実装。

退休前は完全S・選択・全RNG一致、神カード新取得時の由来欄位のみ厳密検証した追加差分。退休後の許可対象は規則に起因するhofInfo、legendLeague、legend等の関連称号、rngState及び演出。CPBL殿堂判定を参照する既存reachedTopからのsmallschool／grinderも原因を確認する。能力・収入・生涯成績・honorsや無関係な特性変更は失敗とする。新規抽選や演算式変更はしない。

## 検証

- hof-evaluation-policy.test：四聯盟54件に加え旧franchise不明／確かな聯盟限定、壊れた階級統計を検証。元データは不変。
- hof-retirement-comparison.test：全S／各RNGの一致と、能力・収入・成績・honors・無関係な特性・説明できないRNG変更の負対照。原movement取得ブロック24件で条件・その他動作不変、新由来の年度・リーグ・球団IDを検証。
- retirement-hof-balance：160固定格子＋20特殊例＋境界／既存純算式531件PASS。旧scoreコア等価行列は維持し、新しい階級参照adapterは別テストで検証。旧階級不明のfixtureを一軍と推測するのではなく、明示的な人工一軍fixtureとして構成した。
- award-legacy-consumer：6,600件PASS。原AのConsumer別投影を保持し、現在HOFにのみ批准済み明示年度／聯盟条件を追加。給与・incentive・市場の旧待遇は完全一致。
- hof-first-ballot-league：31診断例PASS。未取整境界を検証し、投票算式・他の既存動作は保持。
- Browser：hof-retirement-policy-e2e。P／IF各々CONTROLLED_RETIREMENTと自然生涯を旧規則／現行／同版重播で実行。完全退休前S、各選択と状態hash、全主RNG一致。同版は完全退休後S／全RNGも一致。制御例は固定旧退休モジュールへ独立の批准tierを注入したoracleと全退休後S／逐筆RNGを照合。旧／新のscore／tier、用途付き各抽選及び第一分歧を保存し、整段除外しない。1280／320／390px、分享画像作成、全S／RNG不変を検証。自然例が全聯盟／全境界へ到達したとは称しない。
- 証拠：test-results/hof-evaluation-1160-accepted-candidate/、同名log。実機Safari／AndroidはNOT_RUN。

## 原FAILと限定修復

test-results/hof-retirement-related-r1.log：新純規則のVM依存未注入。r2以降：旧四捨五入・国際加点期待値を批准変更に合わせ修正し、旧基本係数・生涯資料断言を維持。hof-honor-related-r1／r2：旧国際加分の期待値差分を限定修正。初回Browser比較はmodeラベルの誤比較と自然非プロ生涯への評価カード断言を修正。franchise由来はVMを跨ぐprototypeでなく全キーと各値を厳密照合。テスト由来のFAILをPASSへ書き換えない。

Quick integration-r1：82 PASS／2 FAIL（旧HOF明示帰属比較、追加入口分類不足）。Quick final-r2：84 PASS／1 FAIL（壊れた生データのcore NaN特性と新HOFの未知扱いのテストを分離）。原logとsummary保持。最終Quick結果は追記する。

## 残件

最終本機Quickは85 PASS／0 FAIL／0 SKIP／0 BLOCKED（362.42秒）。Full112入口、CI、Preview、実機はNOT_RUN。元からのARTIFACT_COVERAGE_BLOCKEDは独立継続。旧3入口等のすべてのFull跨版退休比較への適用は未実行であり、承認差異が出ても原比較を全域無視・自動PASSにはしない。必要な分岐証拠を保存して評価する。本輪は製品・新ポリシーツール・直接Browser検証と本機Quickまでの受入であり、全Full完了ではない。


## 最終本機結果

Quick：test-results/hof-policy-quick-final-r3/summary.json、85 PASS／0 FAIL／0 SKIP／0 BLOCKED、362.42秒。関連Browser：test-results/hof-evaluation-1160-accepted-candidate/approved-summary.json、4組PASS。自然P／IFは退休前だけでなく完整退休後S・全RNGも旧規則と厳密一致。制御P／IFは各々独立の批准tier oracleと完整退休後S・用途付き全RNG一致。シェア画像とviewport変更で完整S／RNG不変。

NPB制御例の数値因果：Pは旧基本9100＋個人賞420＋国際520＝10040、新一軍130＋個人賞420＋国際0＝550。IFは8500＋420＋520＝9440→100＋420＝520。個人賞420は旧版で既に重複除外されており、新差異と偽らない。旧殿堂／初回投票→新スター候補で、最初の退休RNG用途がHOF_VOTE_PERCENT→CANDIDATE_PERCENT。最初の値自体は同じだが、その後既存候補年数抽選へ進み、4呼出→5呼出。新規抽選機構は追加せず、各before／after／value／用途はcausality JSONに保存。差異はrngState、traits.legend、hofInfo、legendLeague；それ以外の状態は独立oracleへ完全一致を要求した。

構文・相対リンク・diff・リリースノート再生成の同一性を確認。変更したテスト期待値は批准したHOF帰属／国際0点／未取整表示／未知階級に限り、原Consumer別A投影と他Consumer給与待遇、元score係数を維持。Full未実行のため旧全入口の跨版比較が自動的に通るとは宣言しない。未解釋差異はそのままFAILとする。

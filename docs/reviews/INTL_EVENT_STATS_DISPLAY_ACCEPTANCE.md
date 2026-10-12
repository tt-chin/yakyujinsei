# 国際大会：本大会個人成績表示の検証

## 基準・範囲

- 修正前dev完全SHA：`e602174a22d7472e1021d780388ad61adc6b11b6`、VERSION1.11.7。開始時はdev=origin/dev、追跡済みファイルの変更なし。未追跡tasks/はユーザー資料として保持する。
- main：`e886e84ca08c6c185406cac9d6f3c4376277061a`、1.11.4。本タスクはdev／Previewだけで、本番へ反映しない。
- 修正後：1.11.8、PATCH。既存の生成済み成績の表示補完であり、新しい大会・算式・履歴画面ではない。
- 使用者確認：ERは保存して防御率計算だけに使い、自責点は表示しない。タスク第6節に従い、T01のER表示という曖昧な文言は採用しない。
- 最終受験程式SHA、CI Run、Preview deployment及び後続純文書Commitは[BACKLOG](../../BACKLOG.md)末尾の本タスク証拠に区別して記録する。

## 最小変更

変更ファイル：

- 本体：docs/src/engine/game.js、docs/src/engine/international-trait-policy.js、docs/src/ui/international-personal-stats.js、docs/src/config.js。
- 新規テスト：tests/international-personal-stats.test.mjs、tests/international-personal-stats-e2e.mjs。
- テスト接線／互換性：tests/championship-intl.test.mjs、tests/kbo-renewal-e2e.mjs、tests/contract-salary-e2e.mjs、tests/display-preferences-e2e.mjs、tests/verify-modularization.mjs。
- テスト登錄／案内：scripts/test-manifest.mjs、scripts/TESTING.md。新登錄行を除けばmanifestは修正前と同一。Runnerと既存入口分類を変更しない。
- 文書：CURRENT_SPEC.md、CHANGELOG.md、BACKLOG.md、docs/designのCURRENT_DETAILED_DESIGN.md／FLOWS_AND_UI_REFERENCE.md／STATE_AND_RNG_REFERENCE.md／MODULE_FUNCTION_INDEX.md、本報告。

- 正式な後段processIntlPhaseにだけ、intlStat生成前の値コピー→従来の順位pick／addIntlStats一回→差分取得を追加。旧maybeIntl、addIntlStats、fmtIPの本体は変更しない。
- prepareInternationalResultは任意personalStatsをネストstatsも含めてコピー。既存intlTraitResults[eventKey]へcommitし、通算オブジェクトと参照を共有しない。省略呼出しのresult形状と既存commitの完了ガードは保持する。
- 新UIモジュールinternational-personal-stats.jsは純粋な差分／整形。投手G/IP/W/SV/SO/ER、野手G/PA/AB/H/HR/RBIだけを保存。IP差分の浮動誤差だけ小数1桁に丸め、通算は変更しない。
- 既存大会カード本文の後に「本大会の個人成績」を追加。参加時positionで種別を選び、打率／防御率は保存した本大会数値から指定の表示算式で整形。旧結果は記録なし、0カウントは0、非有限値／分母0は—。欠落値を通算へ補完しない。
- snapshot生成時の負／非有限差分は明示エラー。修正前後の有効fixture・六自然生涯では発生していない。異常時に生成式やSを修復したことにはしない。
- 純表示の再描画でRNGを呼ばず、辞退・負傷見送りには個人成績を作らない。順位・能力点・疲労・intlace解放・honors・契約・所得・通常成績・seed-only URLは不変。

## T01〜T14

- T01：SPの初出場、保存差分及び既存fmtIP／防御率。ERは内部保存の検証対象。
- T02：MR／CLの実フロー、SV0／2の整形fixture。後者の人工数値を自然ゲームの記録と称しない。
- T03：C／IF／OFの実フローと、全野手欄・打率の単体入力。
- T04：2大会目は通算差分だけ保存／表示、最初の結果は変化しない。
- T05：P12:2035（POST）とWBC:2038（PRE）を別キーで保存。自然生涯でも両大会の出場を確認する。
- T06：保存した出場callback再実行後の完全S／RNG／DOM不変、カード一回、続行一回。単体で同一preparedの再commitも一回だけ。
- T07：辞退／負傷見送り、保存結果なし・大会数0・追加RNG0・個人成績カードなし。
- T08：既存intlace有無、3回目解放と次回適用を修正前の原生成績／RNG／点／疲労と比較。
- T09：人工AB0／IP0／カウント0／欠損／NaN／Infinity／負数の整形。分母0は—、SV等の0は0。
- T10：personalStats未指定の旧preparedの形状を維持。未保存結果は記録なし、推測せず再抽選しない。
- T11：入力ネストstatsとS.intlStatを変更しても保存personalStatsは不変。別大会と参照を共有しない。
- T12：保存投手結果を現在S.pos=IFでも投手として表示。再描画3回の全S／RNG／操作DOM不変。
- T13：12.2→18.3の差分IPは6.1、入力と通算を変更しない。不正差分は明示エラー。
- T14：1280／320／360／390px × standard／night／classic／scoreboard × P／IF、全てlarge。32組の内容・横幅・再描画不変。撮影はカード表示アニメーションの完了を待つ。実機ではない。

## 固定seed・S／RNG比較

明確な策略：配分はvel/ctl/brk/con/pow/eye/spdを優先し、同群の低い値からクリック。能力行→現在球団残留→確定／次へ／完了→NPBドラフト／プロ志望／指名受諾／オファー／契約／入団→最初の有効ボタンの順。Undo/resetは自動選択しない。各選択文字と、操作前後の全S digestを保存。

比較で除外するのはversion及びintlTraitResults内の新personalStatsだけ。大会結果辞書、順位、報酬、特性、通算、年表、所得を除外しない。全R呼出しのbefore／after／value、最終S、選択数、通常成績・契約を完全一致比較する。元の完全Sはcareer-*-baseline/current.jsonへ保存。

初回専用入口（1.11.7＋表示修正作業樹）：50 PASS／0 FAIL、記録された各case耗時合計421.854秒。結果：

- yakyo-test-001／P：362操作、728R、2047退休。P12:2039／2043。
- jp3-pitcher-02／P：386操作、735R、2048退休。P12:2035／2039／2043。
- jp3-pitcher-03／P：419操作、887R、2049退休。WBC:2034／2042、P12:2035／2039。
- jp3-catcher-01／C：314操作、547R、2047退休。自然代表出場なし。C表示は原生fixtureで別検証する。
- jp3-infielder-01／IF：387操作、639R、2049退休。WBC:2038／2042、P12:2039。
- jp3-outfielder-01／OF：403操作、714R、2050退休。WBC:2038、P12:2039。

6本とも修正前後が一致。自然出場はWBC5／プレミア12九大会。人工例だけで到達を主張しない。比較RNG全列及び全状態のJSONはtest-results/intl-personal-local/に保管。

## テスト入口・実行結果

環境：Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39。Playwrightは外部既存モジュールを指定し、依存追加なし。コマンドの<PW>は環境引数、リポジトリに個人の絶対パスを埋め込まない。

- `node tests/international-personal-stats.test.mjs`：14単体case初回PASS。後に既存addIntlStats／fmtIP本体の修正前との文字列一致検査を追加し、最終Quickは15caseを実行する。
- `node tests/international-personal-stats-e2e.mjs --playwright=<PW> --output=test-results/intl-personal-local`：50 PASS／0 FAIL、Console/pageerror及びJS/CSS404は0。初回スクリーンショットのアニメーション途中撮影は後続版で完了待ちに補強し、数値／生成処理は不変。
- `node scripts/test.mjs quick --playwright=<PW> --output=test-results/intl-quick-before-version`：45 PASS／1 FAIL、215.852秒、exit1。KBO既存の旧版状態digestに追加personalStatsが含まれたため。旧負面入力、候補736万円／最低800万円／package21597.6万円、2049、RNG646と従来の誤りはそのまま保持。
- KBO比較は追加personalStatsだけを除外し、intlTraitResultsや旧結果は除外しない。契約の自然比較と表示設定の旧版比較も同じ追加欄位だけを対象外とする。表示比較はdetached log clone上で新個人成績blockのみを除き、元の順位／点／疲労本文は比較する。原Quick失敗logを削除せず、新しい期待金額やR値を作らない。
- `node scripts/test.mjs quick --playwright=<PW> --output=test-results/intl-quick-final`：46 PASS／0 FAIL／0 SKIP／0 BLOCKED、231.030秒、exit0。VERSION1.11.8。
- Full内の専用入口：50 PASS／0 FAIL、Runner532.49秒、VERSION1.11.8、Console/pageerror及びJS/CSS404は0。実際の設定dialogで全テーマ／largeを切り替えた32組と、同じ6自然生涯を再検証。初回より設定操作／アニメーション待ちを含むため、新登錄入口の概算を420→600秒に更新（既存入口／profile／Runnerロジックは不変）。実行時の旧timeout範囲内で通過しており、失敗をtimeout拡大で消したものではない。
- `node scripts/test.mjs full --playwright=<PW> --output=test-results/intl-full-final`：63 PASS／0 FAIL／0 SKIP／0 BLOCKED、2547.523秒、exit0、VERSION1.11.8。契約381、能力89、交易5／安全補充17、特性表示18、新規大会表示50及び全既存自動入口を実行。入口数と内部case数を合算しない。ゲーム本体はFull開始後に変更なし。T14の実設定操作補強は専用入口開始前に反映し、その最終テストで50案を再確認した。途中の文書補足／新入口概算更新は別扱いで、未実行テストのreuseは行わない。
- `node scripts/test.mjs list`：71関連ファイル、Quick46／Full63／Audit64。manifestは新Full／Auditブラウザ入口1件を登錄、単体は既存規則によりQuick／Full／Audit。既存入口のモードは変更しない。Runner／CI／公開workflowは変更なし。
- 新入口の概算600秒への最終metadata更新後、`node scripts/test.mjs quick --only=test-runner.test,international-personal-stats.test --output=test-results/intl-final-metadata-check`：2 PASS／0 FAIL／0 SKIP／0 BLOCKED、2.427秒、exit0。これをもう一度Quick46入口を実行したと称しない。

## 公開・制限

- dev提出／Previewの最終証拠はBACKLOGに追記。本書初期作成時点では未提交／CI未確認／Preview未検証であり、完了証拠なしにそれらをPASSとしない。
- iOS Safari／Android Chrome実機、全未知seed／役割変更ルート、4,000生涯研究は未実施。人工ゼロ／欠損値の表示検証を自然生成と称しない。
- Full／専用入口に残る「disconnected browser profile cleanup timeout」は切断済みbrowserのprofile清理warningであり、ゲーム例外ではない。原logを保持し、Console／pageerrorの0と混同しない。
- 履歴一覧INT-01は未完成のまま。独立した結果配列、保存／復元、国際MVP、未生成の個人成績、新しい成績式、旧maybeIntlの削除は行わない。
- 本番公開なし、main未変更。変更前1.11.7→1.11.8、config.jsとCHANGELOGを同時更新。CHANGELOGには更新内容だけ記録し、CI／公開状態は入れない。

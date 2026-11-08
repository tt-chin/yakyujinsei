# ブラウザー保存 第一期：統合検証停止報告

> 以下は停止時点の履歴。後続の封存検証・歴史唯讀証明の修正と最新受入状況は[BROWSER_SAVE_PHASE1_ACCEPTANCE.md](BROWSER_SAVE_PHASE1_ACCEPTANCE.md)参照。原FAILとその時点の結論は改写しない。

2026-11-08。状態：**BLOCKED / 未完成・未公開**。本機dev HEAD 3e4a98e0eea30db849935bf3303283444878b03f＋未コミット変更、開発版1.15.0。公開済み1.14.1の受入結果を新機能へ流用しない。commit／push／公開は実施していない。

## 確認された問題

Rookie（R）開始の投手fixture save-route-Rを実際の年度処理で進め、2057年（47歳、CORP）の開始保存から同じ操作で引退まで続行すると、元タブにはKBO殿堂入り（2回目投票、75.6%）があるが、再開タブではhofInfoが生成されない。保存時点のSと年度首步直後のSは一致しており、当年度のRNG呼出22回の順序・値・状態も完全一致、最終rngStateはいずれも1027756624。相違を許容差分にはしていない。診断データに76件の過年度awardDecisionsが存在する。

原因は保存データ量やRNGではなく、過年度獎項の完了所有権がランタイム専用であること。engine/award-transaction-policy.jsのcompleteAwardDecisionsはDecisionオブジェクトをキーにcompleted WeakMapへstate／token／index／valueの証明を登録する。同モジュールisCompletedAwardDecision（167行）とaward-identity-policy.jsのidentifyAwardDecision（104行）がこれを要求する。再読込した同じJSONはその証明を持たない。award-consumer-policy.jsのconsumerTreatmentView（118行）がCOMPLETED_DECISION待遇から旧名称fallbackへ変わり、hall-of-fame-policy.jsのhonorScoreForを介して殿堂判定に差が出る。前年度の精算が完了していても、その証明は後年のConsumerに必要であり、単に年度境界をCOMMITTEDにしても解決しない。

原設計[BROWSER_SAVE_DESIGN.md](../../BROWSER_SAVE_DESIGN.md) §5.1は過年度WeakMap／receipt所有権を安全に破棄できると推測することを禁止している。識別判定を緩める、JSONだけで完了を認定する、古い報酬を再実行する修正はしていない。現状の作業ツリーは開発試作であり、安全な全路線保存として使用・配信できない。

## 実行結果と限界

- 659年度の盤点：14自然生涯＋10制御fixture。最大210002 UTF-8 bytes、深度7、配列100。盤点自体は安全checkpoint受入を意味しない。
- Codec／hydrate限定：39 PASS（samples含む）。Store実ブラウザー限定：21 PASS。Controller限定：8 PASS。年度境界限定：4 PASS。別実行・別範囲の結果であり、合算して正式Gate PASSとはしない。
- Runtime限定5グループPASS：1280／320／390pxで開始年・翌年のS／RNG一致、初期処理故障で旧保存を維持しクリーンretry、実2タブ競合、DB拒否時の明示的非保存。後続のメッセージ改善後の最終全体再検証は未実施。実機Safari／Android及びPreview：NOT_RUN。
- 全15路線検証：最初の6路線（自然IF32年度、自然P23年度、MLB17年度、A3 19年度、A2 26年度、A1 26年度）PASS。7路線目Rの引退年度でFAIL、後続8路線はNOT_RUN。このRUNを全路線PASSとしない。R単独診断でも同じ失敗を再現。制御fixtureは自然到達の証明ではない。
- 初回Quick：78入口、73 PASS／5 FAIL。原始summaryを保持。5入口の限定再試験：5 PASS／0 FAIL（award-identity-policy、display-preferences、draft-income、draft-signing-policy、kbo-renewal-floor）。初回Quickを78 PASSへ書き換えず、最終の新規QuickはNOT_RUN。
- 修正済み直接原因：合法なchampionmakerAcquiredYearの数値型の漏れ、ストレージ初回確認を待つ新起動順への期待値更新、新生涯上書き確認を既存テストが未承認でキャンセルしていた問題、2つのソース抽出器のCRLF正規化。元の状態・報酬・RNG比較を維持。原FAILも保持。
- Full：NOT_RUN。新しい104入口（旧98＋保存関連6）が登録されたが、未実行をPASSとはしない。既存CI／Runner／goldenは変更していない。ARTIFACT_COVERAGE_BLOCKEDは別件として維持。

## 次に必要な契約補強（提案・未実装）

1. 年度保存に必要な過年度Decisionと完了Receipt／所有権証明を盤点し、保存可能な検証データ契約を定義する。現在SにあるDecision JSONだけでは不足する。
2. 書込前は生きた完了証明で整合性を確認し、再読込時はDecision身分・年度／league／level／rule／seed、順序、draw根拠、receipt完了、改変・欠損・他生涯混入を検証してから新しいランタイム証明へ結び直す専用APIを設計する。hash一致だけを出所の証明にせず、Consumer-only旧名称を新しい可信身分へ昇格しない。
3. 復元で報酬、honors、traits、給与を再支給しない。検証不能なら元保存を保持して復元を拒否し、非保存プレイを明示する。保存形式／互換性IDの変更要否も定義する。
4. Rookie再現を含む全15路線・引退後再開、HOF／給与／phoenix等Consumer、偽造JSON拒否の限定検証後、確定ソースで新規Quick／Fullと投手／野手の変更前後S／選択／RNG比較を行う。

この補強は単なる表示修正ではなく、D2の完了証明の復元入口を新設するため、技術契約の確認後に進める。旧契約を独断で緩めず本段階を停止する。読込文字列の既存HTML描画経路の安全性監査、引退後の最終checkpoint再開及び削除・設定保持の実UI最終検証も残件。

## 主要原始証拠のSHA256

パスはrepository相対。最新の試行で上書きしない。

- `test-results/browser-save-routes-complete-r1/FAIL.json`: `061ad3c8aace2bd8d3cc0f704317e81b2e448453d040a95fde2029cad87c0d88`
- `test-results/browser-save-rookie-diagnostic-r1/FAIL.json`: `2f05c77835252fdd2874741360e1ad20b47e856ab147c7aa09f7a114853eb439`
- `test-results/browser-save-rookie-diagnostic-r1/latest-comparison.json`: `f5581f88139a6973e4c1fea91bfdbb893fd79d50781182186eb68ab1ddf062cd`
- `test-results/browser-save-1150-quick-r1/summary.json`: `c71d2aa214b26a079cf26f1c53a2095dcd7183b01bd193e06387556b8b29dd0f`
- `test-results/browser-save-quick-five-fixed-r1/summary.json`: `d2560f5fe684995ecd01ca3e224ccf41bfba57b3a13eaafd36036ff08e44896f`
- `test-results/browser-save-runtime-final-r1/summary.json`: `b2812fb62d75b16b3f594418ba88403f5c62992f21a4d5ac7b5d8d8bdb469e5a`

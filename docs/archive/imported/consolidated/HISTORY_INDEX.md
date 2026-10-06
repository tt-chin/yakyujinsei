# 歴史文件索引 / 設計書の出典と整理方針

整理日：2026-10-06。文書改訂：2。これは設計文書の索引であり、別の正式リリース履歴ではない。

## 使い方

現行の設計基準は[CURRENT_SPEC.md](CURRENT_SPEC.md)、着手候補は[TODO.md](TODO.md)を参照する。
原文はhistory/へ無変更で収録した。元の保存ファイルを削除・改名していない。
歴史文書にある「直接mainへpush」「版号を指定値にする」等は当時の指示であり、現在の作業権限や最新開発規則を上書きしない。
この索引は全数値・APIを再記述しない。詳細が必要なら表の原文を読む。

## 覆蓋・競合対応

| 旧記述 | 後続記述・扱い | 理由 |
|---|---|---|
| Masterの4メイン領域、1.5.0の4メニュー | 1.5.2のホーム/選手/キャリア | 同一画面構造の後続改訂 |
| Masterの2字級・自動/PC/モバイル・旧テーマ名 | 1.7の3字級・2密度・4テーマ | 具体版で設計を変更 |
| Masterの全投入/均等配分、1.6の+5/MAX | 現行1.6.2は行クリック、Undo、全リセット | allocUIを原始碼確認。pool/dice共通 |
| fix_103の野手スタミナ5% | 現行1.6.2には未反映。TODO OVR-01 | 現行ovrは打撃・守備のみ。設計と実装を分離 |
| fix_103の初期給与下限・球団差なし | 1.1以後のpayD/marketRating、1.4市場 | 初期修正と後続制度を重ねない |
| 1.2の全固定契約案 | 1.3のリーグ別CONTROL/ARBITRATION/FA | 固定保障を保ちながら制度を拡張 |
| キャリア途中保存の参考案 | Masterで非採用。表示設定保存は別 | S保存と表示preferencesを区別 |
| 旧CHANGELOGへの追記指示 | 最新repo規則を確認。取得済AGENTS(6)はVERSION_HISTORYへ一本化 | 別履歴を増やさない |
| 古いmain直接push | 取得済AGENTS(6)のdev→Preview→承認→main | 運用の後続変更 |
| 旧台湾版1.5.7/1.5.9、参考作品2.7.6 | 日本正式版とは別系列 | 大きい版号だけで優先しない |
| 設計書にある「実装済み」 | 当時の記載として保存、現在はコード照合 | 文書だけでは稼働証拠にならない |

正式履歴スナップショットには1.4.4までのリリースが記載され、Masterには1.4.5完了記載がある。2026-10-06に取得した公開repo tt-chin/yakyujinsei-site のHEADは fceb30c41dd4b7334ff508d5b6a4b15242cb9bd9、config VERSIONは1.6.2。主要項目はCURRENT_SPECの照合表へ統合した。
未取得/未確認：開発元main/devの最新ルール・正式履歴、1.6.1/1.6.2専用後続設計、本番配信との一致、ブラウザ実動、固定seed回帰。公開ソースの確認を全機能の検収完了とみなさない。
MIGRATION_IMPLEMENTATION_SCHEDULEは旧時点の進捗として保存する。D02/D03等の未着手記載を現在の状態へコピーしない。1.7/1.8の具体設計を対応資料として使い、別名の補充設計を重複作成しない。スケジュールの「画像は別色定義なし」は、後続1.8の画像専用色盤に置き換わる。

## 原文台帳（39ファイル）

| 原文 | 保存元の版識別 | 役割・処置 |
|---|---|---|
| [MIGRATION_IMPLEMENTATION_SCHEDULE.md](history/MIGRATION_IMPLEMENTATION_SCHEDULE.md) | 4 | 当時の順序と進捗。現状へ無条件転記しない |
| [V1.8.0_SHARE_IMAGE_THEME_LINK_SPEC.md](history/V1.8.0_SHARE_IMAGE_THEME_LINK_SPEC.md) | 未付与 | 将来設計・草案。1.7接続確定待ち |
| [V1.7.0_THEME_AND_DISPLAY_SETTINGS_SPEC.md](history/V1.7.0_THEME_AND_DISPLAY_SETTINGS_SPEC.md) | 未付与 | 将来設計。取得1.6.2に未実装 |
| [V1.6.0_ABILITY_ALLOCATION_AND_JAPANESE_COPY_SPEC.md](history/V1.6.0_ABILITY_ALLOCATION_AND_JAPANESE_COPY_SPEC.md) | 未付与 | +5/MAX案は現行に採用なし。Undo/全リセットはコード確認、文言監査は検証待ち |
| [V1.5.2_INFORMATION_ARCHITECTURE_REVISION_SPEC.md](history/V1.5.2_INFORMATION_ARCHITECTURE_REVISION_SPEC.md) | 1 | 情報構造の後続基準 |
| [V1.5.1_RECORD_CONDITION_FIX_SPEC.md](history/V1.5.1_RECORD_CONDITION_FIX_SPEC.md) | 未付与 | 旧画面案／記録修正。1.5.2に部分統合 |
| [V1.5.0_HOME_ABILITY_UI_REVISION_SPEC.md](history/V1.5.0_HOME_ABILITY_UI_REVISION_SPEC.md) | 未付与 | 旧画面案／記録修正。1.5.2に部分統合 |
| [AGENTS(6).md](history/AGENTS%286%29.md) | 未付与 | 開発ルールの過去コピー。最新repo正本と照合 |
| [VERSION_HISTORY(2).md](history/VERSION_HISTORY%282%29.md) | 未付与 | 正式履歴のスナップショット。重複は比較後に判定 |
| [VERSION_HISTORY(1).md](history/VERSION_HISTORY%281%29.md) | 未付与 | 正式履歴のスナップショット。重複は比較後に判定 |
| [AGENTS(5).md](history/AGENTS%285%29.md) | 未付与 | 開発ルールの過去コピー。最新repo正本と照合 |
| [AGENTS(4).md](history/AGENTS%284%29.md) | 未付与 | 開発ルールの過去コピー。最新repo正本と照合 |
| [AGENTS(3).md](history/AGENTS%283%29.md) | 未付与 | 開発ルールの過去コピー。最新repo正本と照合 |
| [AGENTS(2).md](history/AGENTS%282%29.md) | 未付与 | 開発ルールの過去コピー。最新repo正本と照合 |
| [AGENTS_latest.md](history/AGENTS_latest.md) | 未付与 | 開発ルールの過去コピー。最新repo正本と照合 |
| [VERSION_HISTORY.md](history/VERSION_HISTORY.md) | 未付与 | 正式履歴のスナップショット。重複は比較後に判定 |
| [AGENTS(1).md](history/AGENTS%281%29.md) | 未付与 | 開発ルールの過去コピー。最新repo正本と照合 |
| [YAKYUJINSEI_SALARY_DESIGN_V1.4.0.md](history/YAKYUJINSEI_SALARY_DESIGN_V1.4.0.md) | 未付与 | 給与の段階差分。全段階を同時再実装しない |
| [YAKYUJINSEI_SALARY_DESIGN_V1.3.0.md](history/YAKYUJINSEI_SALARY_DESIGN_V1.3.0.md) | 未付与 | 給与の段階差分。全段階を同時再実装しない |
| [YAKYUJINSEI_SALARY_DESIGN_V1.2.0.md](history/YAKYUJINSEI_SALARY_DESIGN_V1.2.0.md) | 未付与 | 給与の段階差分。全段階を同時再実装しない |
| [YAKYUJINSEI_SALARY_DESIGN_V1.1.1.md](history/YAKYUJINSEI_SALARY_DESIGN_V1.1.1.md) | 未付与 | 給与の段階差分。全段階を同時再実装しない |
| [YAKYUJINSEI_SALARY_DESIGN_V1.1.0.md](history/YAKYUJINSEI_SALARY_DESIGN_V1.1.0.md) | 未付与 | 給与の段階差分。全段階を同時再実装しない |
| [YAKYUJINSEI_SALARY_DESIGN_V1.0.4.md](history/YAKYUJINSEI_SALARY_DESIGN_V1.0.4.md) | 未付与 | 給与の段階差分。全段階を同時再実装しない |
| [SALARY_SYSTEM_COMPARISON_AND_RECOMMENDATION.md](history/SALARY_SYSTEM_COMPARISON_AND_RECOMMENDATION.md) | 未付与 | 分析・比較資料。直接の実装仕様ではない |
| [yakyujinsei_salary_analysis_v1.0.3.md](history/yakyujinsei_salary_analysis_v1.0.3.md) | 未付与 | 歴史／参考資料。後続との差分照合 |
| [MBDAY_SALARY_ANALYSIS_V2.7.6.md](history/MBDAY_SALARY_ANALYSIS_V2.7.6.md) | 未付与 | 分析・比較資料。直接の実装仕様ではない |
| [YAKYOLIFE_SALARY_ANALYSIS_V1.5.9.md](history/YAKYOLIFE_SALARY_ANALYSIS_V1.5.9.md) | 1 | 分析・比較資料。直接の実装仕様ではない |
| [MIGRATION_MASTER_SPEC.md](history/MIGRATION_MASTER_SPEC.md) | 8 | 将来差分計画。具体UIは後続仕様を優先 |
| [YAKYOLIFE_159_MIGRATION_SPEC.md](history/YAKYOLIFE_159_MIGRATION_SPEC.md) | 未付与 | 歴史／参考資料。後続との差分照合 |
| [MY_BASEBALL_DAYS_MIGRATION_SPEC.md](history/MY_BASEBALL_DAYS_MIGRATION_SPEC.md) | 未付与 | 歴史／参考資料。後続との差分照合 |
| [fix_103.md](history/fix_103.md) | 1 | 野手スタミナ5%は未実装設計。初期給与は後続仕様へ |
| [fix_102.md](history/fix_102.md) | 1 | 大会・準優勝修正基準 |
| [HOF_AWARD_SCORING_FIX.md](history/HOF_AWARD_SCORING_FIX.md) | 1 | 歴史／参考資料。後続との差分照合 |
| [JP3_SALARY_SYSTEM_REVIEW.md](history/JP3_SALARY_SYSTEM_REVIEW.md) | 未付与 | 分析・比較資料。直接の実装仕様ではない |
| [JP3_SALARY_PROMOTION_FIX.md](history/JP3_SALARY_PROMOTION_FIX.md) | 未付与 | 歴史／参考資料。後続との差分照合 |
| [JP3_MODULARIZATION.md](history/JP3_MODULARIZATION.md) | 未付与 | 歴史／参考資料。後続との差分照合 |
| [AGENTS.md](history/AGENTS.md) | 未付与 | 開発ルールの過去コピー。最新repo正本と照合 |
| [YaKyoLife_JP3_台灣版1.5.7更新設計書.md](history/YaKyoLife_JP3_台灣版1.5.7更新設計書.md) | 3 | 歴史／参考資料。後続との差分照合 |
| [YaKyoLife_詳細設計書.md](history/YaKyoLife_詳細設計書.md) | 19 | 基礎設計。旧版・実装状況の監査が必要 |

表の版識別は保存ファイルの改訂番号であり、ゲームの製品版号ではない。
AGENTS各コピーとVERSION_HISTORY三コピーは削除していない。VERSION_HISTORY三コピーは今回のSHA-256比較で同一と確認した。参照代表はVERSION_HISTORY.mdとし、他二つも原文保存する。AGENTSは未比較のため同一とは判定していない。
分析資料の結論、参考作品の仕様、正式日本版の実装要求を混同しない。

## 維持手順

- 新仕様はまずTODOの独立IDで管理し、対象・前提・承認を記録する。
- 実装完了後はCURRENT_SPECへ結果を統合し、元の版別修正書は歴史資料として保持する。
- 正式VERSION_HISTORYには実際に実装・修正したものだけを追記する。
- 現行仕様に競合が残る場合は該当箇所を「未確定」に戻し、古い文書を根拠に自動修正しない。

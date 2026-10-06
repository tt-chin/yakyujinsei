# 封存資料索引

整理日：2026-10-06。ここは歴史原文・参考分析の保管場所であり、現行仕様や作業指示ではない。

現行の唯一の正本は根目録の[AGENTS](../../AGENTS.md)、[CURRENT_SPEC](../../CURRENT_SPEC.md)、[CHANGELOG](../../CHANGELOG.md)、[BACKLOG](../../BACKLOG.md)。旧資料の版号、日付、「実装済み」「mainへpush」等は現在の仕様・権限を上書きしない。

## 保存元

- `local/`：整理前のworkspace原文。旧詳細設計、VERSION_HISTORY、HISTORY_INDEX、移行設計、UI補充設計、1.6.0設計、台湾版差分、旧タスク、文言監査を保持する。整理前AGENTS／CURRENT_SPEC／TODOも保存する。
- `imported/history/`：提供された`yakyujinsei_specs_consolidated.zip`の`consolidated/history/`全39件。元ファイルと展開ファイルのSHA-256一致を確認した。
- `imported/consolidated/`：同ZIPのCURRENT_SPEC／TODO／HISTORY_INDEX原文3件。これらは当時の整理結果であり現在の入口ではない。
- 歴史原文の`AGENTS.md`だけは`AGENTS.snapshot.md`へ改名した。内容は変更せず、封存内で旧ルールが実行指示になることを防ぐ。
- 移動した原文はSHA-256一致を確認した。同名で内容が異なるlocal版とZIP版を上書きせず両方保持する。
- 前工程で一時保管していたv1.5.0／v1.5.1／v1.5.2修正書3件もlocalへ復元し、SHA-256一致を確認した。ZIP版とは別の原文として保持する。
- 封存原文はGitの改行正規化を無効化して保管する。元のMarkdown改行用空白・末尾空行も残すため、原文のwhitespace警告は修正しない。現行文書は別途diff-checkする。

## 主要資料への入口

- [旧詳細設計書](local/YaKyoLife_詳細設計書.md)：数値表、球団Master、イベント、API、過去のUI改訂。旧台湾版翻訳や廃止済み仕様も含むため、そのまま現行仕様として適用しない。
- [旧VERSION_HISTORY](local/VERSION_HISTORY.md)：正式履歴はCHANGELOGへ統合済み。ここへ新しい履歴を追記しない。
- [旧出典索引](local/HISTORY_INDEX.md)：当時の競合判断と39原文の台帳。旧相対リンクや未展開記載は当時の状態のまま保存する。
- [移行Master](local/MIGRATION_MASTER_SPEC.md)、[旧スケジュール](local/MIGRATION_IMPLEMENTATION_SCHEDULE.md)：将来候補・当時の進捗。現状はBACKLOGで管理する。
- [UI補充設計](local/UI_FOUNDATION_SUPPLEMENTAL_DESIGN.md)：旧DOM・モジュール監査と検収条件。
- [1.6.0設計](local/V1.6.0_ABILITY_ALLOCATION_AND_JAPANESE_COPY_SPEC.md)：+1/+5/MAXは1.6.1で廃止。Undo・全リセット等の現行操作はCURRENT_SPECに従う。
- [日本語文言監査](local/docs/JAPANESE_COPY_AUDIT_V1.6.0.md)、[旧モジュール化タスク](local/tasks/VERSION_1_0_0_MODULARIZATION.md)。
- [1.7将来設計](imported/history/V1.7.0_THEME_AND_DISPLAY_SETTINGS_SPEC.md)、[1.8草案](imported/history/V1.8.0_SHARE_IMAGE_THEME_LINK_SPEC.md)：未実装。実装承認ではない。

## 移管状況と維持方法

v1.5.0〜v1.5.2の採用済み情報構造・記録分類・リハビリ・選択DOM保持はCURRENT_SPECへ移管した。原文の旧4メニュー、上部選択肢、下位階級へのtop追加は復活させない。

詳細設計書の全数値表・全イベント・APIを現行コードへ対応付ける作業は未完了。BACKLOG AUD-04として残し、封存への移動を「全内容統合済み」とは扱わない。推測で式を変えず、必要な詳細をコードと照合してCURRENT_SPECへ移管する。

原文の本文・旧リンクは履歴証拠として書き換えない。現行からのリンクはこの索引または実在する封存パスを使う。新しい仕様をここへ足さず、完了後はCURRENT_SPEC／CHANGELOGへ、未完了項目はBACKLOGへ記録する。

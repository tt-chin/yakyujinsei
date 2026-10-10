# 待辦清單 / 実装・照合バックログ

整理日：2026-10-11。文書改訂：7（第3段階契約・年俸驗收反映）。未完了事項の唯一の正本。現行仕様：[CURRENT_SPEC.md](CURRENT_SPEC.md)、完了履歴：[CHANGELOG.md](CHANGELOG.md)、開発規則：[AGENTS.md](AGENTS.md)。

## 0. 調査基準と状態の定義

- 対象：`tt-chin/yakyujinsei` `dev`、**受驗 HEAD `a4aa83c48a48a1567bf3b14ceea6e4c76c87b76b`**、VERSION **`1.11.2`**。`main` は `421e036bb206a11828a696a4f8b0d3909385441f`、VERSION `1.10.2`。受驗時の基準であり、後続変更時は再取得する。
- 一次驗收證據：`docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md`（2026-10-10、Codex報告。使用者提供の同名調査報告を根拠とする）。`CURRENT_SPEC.md`、`CHANGELOG.md`、`AGENTS.md` を併用。**本BACKLOG更新ではテストを独立再実行していない**。
- Codex調査の38 ID判定：PASS 3、FAIL 1、IMPLEMENTED_UNVERIFIED 10、NOT_IMPLEMENTED 14、BLOCKED 4、DESIGN_PENDING 6。**PASSは当該驗收範囲に限定**。非実装候補・承認保留・実機未検証を混同しない。
- 検証環境：Windows／Node 24.15.0／Playwright Chrome 155、ローカルとPreview。320/390pxはモバイル模擬でありiOS Safari・Android Chrome実機ではない。
- `tests/` は**54ファイル**（33 `.test.mjs`、5 standalone、11 E2E、5 support／分析／fixture）。本次33+5入口 PASS、E2E一部のみ実施、KBO自然進行 FAIL。全E2E・4,000生涯・全機種のPASSとはしない。
- 状態：`FAIL（再現済み）`／`BLOCKED`／`IMPLEMENTED_UNVERIFIED`／`NOT_IMPLEMENTED`／`DESIGN_PENDING`／`PASS（範囲限定）`。未完了は `[ ]`、報告の範囲内で完了した調査のみ `[x]` とし、完成機能の全面保証を意味しない。
- 本ファイルは**文書の更新案**。ゲーム、テスト、VERSION、CHANGELOG、`main`、本番は変更しない。実際のリポジトリへの反映は使用者が手動で行う。

## 今回の驗收で完了と判定した項目（証拠付き）

- [x] **BUG-KBO-RENEWAL-FLOOR**【PASS／v1.11.3修復】KBO候選在倍率適用後先補至既定階層最低年俸，再驗證原package上限；不改政策／倍率／保障年表。`jp3-infielder-01`／IF／`--balanced` 的2049年首次輸入為736萬円、最低800萬円、上限21597.6萬円（非真正衝突），修復後2050年正常退休。失敗前390操作的狀態／選擇／RNG完全一致；投手／野手各一組完整生涯比較一致。新增10組最小回歸及PC／320／390px續約・連打・原生付款去重驗證通過；Preview 47資產與修復SHA一致並通過相同完整E2E。詳見[修復報告](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md)。本項為驗收後另行授權修復；上述v1.11.2報告與件數仍是歷史快照，不改寫為全項PASS。
- [x] **BUG-HOF-FIRST-BALLOT-LEAGUE**【PASS／v1.11.2】`retireScene` は `firstBallotLeagues` から `legendLeague` を決定。31ケース、CPBL8600／MLB11000境界、本機／Preview HOF E2E通過。**自然跨聯盟初年度入選率は未調査**であり、HOF-NATURAL-SAMPLE-01に残す。
- [x] **TEST-COVERAGE-01**【PASS／調査範囲】54ファイルの入口／依存／未実行対象を分類。これは100%コードカバレッジや全E2E完了を意味しない。`fixed-seed-regression.json` は未参照の可能性があるが、外部用途未確認のため削除禁止。
- [x] **AUD-01B**【PASS／指定スナップショット】`origin/main` と公開source repoの108ファイルblob一致、正式URLで108/108期待ファイルのHTTP内容一致。Preview 47 tracked HTML/JS/CSSも受驗devと一致。CDN全ノード・追加URL・将来配信を保証しない。

## P0：再現済み不具合・既存重大不具合の再確認

- [ ] **BUG-ACT-01**【BLOCKED／原操作歴不足】「今季の成績を見る」無反応。過去報告 seed `k55l221a`（投手）、`oscuxs1w`。使用者から修正済みとの報告あり。Codexは原2seedの操作歴不足で再現未実施（`k55l221a/P`、`oscuxs1w`位置不明）。**未修正と断定せず**最新ブラウザ／モバイルで選択履歴を含めて再検証し、通過すれば完了証拠を記録して閉じる。
- [ ] **BUG-ACT-02**【IMPLEMENTED_UNVERIFIED】指名入団直後の選択消失。choice 世代ロック、nested action、旧 DOM、例外復旧、契約生成を確認。Preview三尺寸の入団・収入表示と別ルート全生涯はPASS。ただし指名直後の次DOM/listener専用断言と原報告の選択歴が不足。過去修正済みの可能性があるため重複実装禁止。

第3段階のBUG-ACT-03／BUG-SAL-01は、原生契約／年俸境界・傷病×満了×降格・候補受諾／次年実支払・自然生涯の驗收と、v1.11.4のMiLB降格NPB候補表示修正により本未完了欄から除去。対象・N/A・実機等の未検証範囲は[契約・年俸驗收報告](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)に明記し、全seed／全端末の保証とはしない。前2段階は使用者確認済みで、本輪は関連回帰のみ。上部の旧調査基準／件数とACT-01／02の旧記録を本輪の全面再調査結果へ書き換えない。

## P1：テスト基盤と正本照合（次の開発に先行）

- [ ] **TEST-RUNNER-01**【未実装】`scripts/test.mjs` を新設し `quick`／`full`／`audit`／`list` を統一。既存テストを分類し、`.test.mjs` 以外の実行対象、fixture、support、分析専用を明示。PASS/FAIL/SKIP・耗時・exit code を表示。依存不足を PASS と扱わない。追加 npm 依存は無断導入しない。Codex が関連テスト＋quick を実行するルールを AGENTS に追加するのは専用タスクで行う。
- [ ] **TEST-CI-01**【未実装】`.github/workflows/test.yml` を新設し `dev` push で quick、`main` 向け PR で full を実行。E2E 用ブラウザ環境・実行時間・失敗ログを検証。現存 `publish-site.yml` は `main` の `docs/**` 配信同期のみでテストなし。マージ強制停止には別途 GitHub Ruleset/Branch Protection 設定が必要。
- [ ] - [ ] - [ ] **AUD-02**【IMPLEMENTED_UNVERIFIED／16節索引作成済み】CURRENT_SPEC 16節のコード／既存テスト索引は報告第8節に作成済み。全数値・DOM分岐・跨機能相互作用までの完全検収は未完了。実装済み・差異・未検証を区別。差異を自動修正対象としない。
- [ ] **AUD-03B**【IMPLEMENTED_UNVERIFIED／6組browser PASS】pool3・dice[2,4,6] × PC/320/390 の6組でUndo／reset、carry／touchedKeys／残点／骰子／RNGを実測PASS。Undoで欠損carryキーが0として追加される構造差（`{sta:0}`→`{sta:0,vel:0}`）を確認。数値等価、全resetは構造一致。combo／late解放、cap80／残0、確定特性への影響と専用再現E2Eは未完了。
- [ ] **AUD-04**【IMPLEMENTED_UNVERIFIED】封存設計の数値表・イベント・API と現行コードを照合し、現在も有効な情報だけ CURRENT_SPEC へ移管。旧仕様の自動復活禁止。
- [ ] **AUD-05**【IMPLEMENTED_UNVERIFIED】封存 AGENTS 各版の差分確認。旧ルールの無条件適用禁止。
- [ ] **REFACTOR-AUDIT-01**【IMPLEMENTED_UNVERIFIED／初期風險盤點済み】`game.js` 約3100行、後段同名関数override、LEGACY参照、契約／UI／S/RNGの高リスクを初期調査済み。全S欄位読書図、AST呼出図、動的可達性、RNG消費点、モジュール境界を追加調査。優先度・依存・テスト不足・段階的移行計画を作る。TEST-RUNNER と AUD-02 を踏まえ、承認前に大規模リファクタリングしない。

## P1：退休・殿堂評価の検証と設計判断

- [ ] **HOF-NATURAL-SAMPLE-01**【IMPLEMENTED_UNVERIFIED／追加サンプル待ち】v1.11.1 監査は 160 固定ケース＋20 特例＋87 境界／現状特性ケース、実ゲーム 50 完了生涯（25 seed×2戦略）。実ゲーム一軍到達 KBO/MLB がゼロで、4リーグ比較・4,000有効生涯の受入は未達。実際に到達する経路／戦略を整備し、サンプルの偏り・重複・失敗・再現性を報告。調査中にゲーム規則は変更しない。
- [ ] **HOF-BUCKET-DECISION-01**【仕様待ち】NPB育成／二軍／一軍、CPBL二軍／一軍、KBO二軍／一軍の既存リーグ合算を殿堂評価でも維持するか、一軍限定／別ウェイトにするかを決定。MiLB は MLB に合算しない現行仕様を尊重。判断前にスコア変更禁止。
- [ ] **HOF-PITCHER-BALANCE-01**【仕様待ち】投手の HLD・ERA・WHIP・L が基本点に直接反映されない現状、SP/MR/CL の分布を実際の到達生涯で検証。A/B/C 候補は監査上の仮説で採用済みではない。係数変更は別承認。
- [ ] **HOF-HONOR-POLICY-01**【仕様待ち】MVP／最優秀投手賞で i≤1、部門賞・守備賞で i≤2 の保証が投票候補まで保証する仕様を維持するか判断。国際実績の NPB 限定加点、フランチャイズ全リーグ加点も含める。現状仕様をバグと断定しない。
- [ ] **HOF-DISPLAY-ROUND-01**【DESIGN_PENDING／境界再現済み】表示丸めで閾値未達の raw score が閾値以上に見えるケース（例：7999.8→8000）について UI 誤解の有無を確認。判定は未丸め値のまま維持するか、表示注記を加えるか別途決定。
- [ ] **HOF-VOTE-STORY-01**【DESIGN_PENDING】現行 i=0 の殿堂入りは確定的な投票演出、i=1 は候補止まり。実確率投票と誤認される表示・説明の有無を確認。確率化は未承認。

## P1：端末・文案の未検証

- [ ] **EVT-1102-ANDROID**【BLOCKED／Android実機なし】年度イベント去重・途中 seed 共有を Android Chrome 実機で確認。既存 PC・iPhone の検証証拠は保持。
- [ ] **UI-17-DEVICE**【BLOCKED／iOS・Android実機なし】表示設定・イベントの iOS Safari／Android Chrome 実機検証。既に公開済みの機能を未実装扱いしない。
- [ ] **SHARE-111-DEVICE**【BLOCKED／原生share sheet実機なし】v1.11.1 の原生 URL 共有・取消・PNG 主題同期・画像共有／保存を iPhone Safari、Android Chrome、PC で検証。CURRENT_SPEC 第16節・CHANGELOG 1.11.1 に実装記録あり。
- [ ] **COPY-01**【IMPLEMENTED_UNVERIFIED】全到達可能な日本語文案を再点検。過去の92イベント文案置換（v1.8.2）と区別し、誤字・自然さ・野球用語・表示箇所を検証。既存翻訳を無断で全面置換しない。

## P2：個別仕様の承認待ち・将来候補

- [ ] **OVR-01**【仕様待ち】野手スタミナ5%案。現行 `round(base)−イップス補正` と提案 `round(base×0.95+sta×0.05)−補正` を比較し、採用するか承認を得る。投手・守備式・育成コストを変更しない。採用時は固定 seed と RNG を検証。
- [ ] **TRAIT-PITCHER-TC**【承認済み保留】投手三冠王。単項の最多勝／最優秀防御率等の制度設計が先。最優秀投手賞で代用しない。
- [ ] **TRAIT-NITENICHI**【承認済み保留】二天一流。未承認の二刀流制度・投手三冠制度が前提。勝手に実装しない。
- [ ] **TRAIT-CHAMPIONMAKER**【承認済み保留】優勝請負人。累計5冠、集計範囲、職業／国際優勝率＋5ポイント、RNG 影響の設計・承認待ち。v1.11.0 の既存優勝処理とは区別。
- [ ] **CONTRACT-LEGACY-01**【重構候補・要調査】到達不能とされる旧 `makeOffers`／`pickOfferUI`／市場定義の参照関係を検証し、安全な範囲で削除・整理するか決定。固定 seed と契約回帰なしに削除しない。
- [ ] **CONTRACT-ASIA-01**【未実装・仕様待ち】KBO アジア枠・球団全体外国人予算。現行 FOREIGN_STANDARD とは別制度。
- [ ] **INJ-UI-01**【候補】一般故障リスク内訳の可視化。計算と表示の単一データ源を維持。
- [ ] **PLY-01**【候補】背番号・年度履歴。00、移籍、重複・変更規則の決定待ち。
- [ ] **INT-01**【候補】大会別国際履歴。既存結果を再利用し、抽選を増やさない。
- [ ] **EVT-01**【候補】イベント分類表示。抽選候補・順序は維持。
- [ ] **UI-06**【候補】初心者向けゲーム内説明。
- [ ] **UI-07**【候補】ゲーム内更新履歴。CHANGELOG を正本とする。
- [ ] **PLY-02**【候補】永久欠番。背番号履歴が前提。組織・年数・成績・RNG 方針の承認待ち。

上記の過去「候補版」1.9.0～1.13.0 は実装予約でも現行版号でもない。採用時は最新正式版を基準に別途版号を決める。

## 非採用・自動復活禁止

キャリア途中保存・復元、旧エンジン切替、`rv/rules` URL、参考作品の給与システム丸ごと移植、未承認の二刀流、音声／サーバー生成。1.5.2 の3メニューを旧4メニューへ戻さない。旧テーマ／PCモード・旧給与評価へ戻さない。分析上の HOF A/B/C 候補を自動採用しない。

## 推奨実施順序（仕様変更は各タスクで承認）

1. **P0 既存重大不具合の再確認**：KBO初回入力分析・独立修復はv1.11.3で完了。BUG-ACT-01/02の元選択履歴を収集。修正と大規模重構を同時に行わない。
2. **P1 TEST-RUNNER-01 → TEST-CI-01**：54ファイルの歴史盤點にv1.11.3追加KBO回帰2入口も加えて登録し `quick/full/audit/list`、PASS/FAIL/SKIP、Git基準・Playwright依存を明示。未実施5 E2E、fullモードを追加実行。KBOの最小回帰と自然均衡生涯も維持する。
3. **P1 契約／能力回帰**：全休×満了×降格、海外各階層の契約表示・次年度支払、Undo carryキー／combo／late、指名直後DOMの専用テストを補強。
4. **P1 AUD-02／AUD-04／AUD-05 と REFACTOR-AUDIT-01**：全S読書・AST呼出・RNG消費・旧コード到達性を読み取り専用で補完。小規模重構はテスト基盤が安定してから。
5. **P1 HOF-NATURAL-SAMPLE-01**：四聯盟と投手SP/MR/CLの有効な自然到達サンプルを拡充。得られたデータに基づき仕様判断し、無断で係数を変更しない。
6. **P1 実機／文案、P2 新機能**：実機は使用者等の端末で最終驗收。dev→Preview→使用者承認→mainを維持。

## 今回の驗收で追加確認した技術的な制約

- 33個 `.test.mjs` と5個standaloneはPASS。ただしE2Eは部分実施で、`event-system`、`draft-income`、`display-preferences`、`salary-history`、`trait-system` の5入口を未実施。`retirement-hof-pilot` 再採樣と分析／報告生成器も未実行。`full` 完了とは扱わない。
- HOF固定seedで `yakyo-test-001/P`（RNG 652）と `jp3-infielder-01/IF`（RNG 549）は旧基準と現行の最終S／選択履歴／RNG一致。ただし**選択戦略が違うため**当時のbalanced KBO FAILを否定しない。v1.11.3の別回帰でbalancedも修復・正常退休まで確認した。
- 原生共有はmockでの成功／取消／失敗、四主題PNGがPASS。OS共有UI・実機ダウンロードは未驗收。
- Codexの監査報告は証拠資料であり、各タスクを終える際は**最新HEADで再検証**する。

## 各タスク共通の完了条件

1. 最新 `dev` SHA・VERSION、対象／対象外、仕様とコードの差分を記録。
2. 原因と再現手順を先に確定。既存実装を重複実装しない。
3. 投手／野手、固定 seed＋選択履歴、RNG 呼出順・消費数を比較。表示のみの変更では人生結果を変えない。
4. 該当単体／統合／E2E と PC／モバイルの結果、未実行項目、失敗原因を報告。テストを実行せず PASS と書かない。
5. ゲーム本体変更時のみ VERSION と CHANGELOG を同一タスクで更新。ドキュメント／テストだけなら原則バージョン据え置き。
6. `dev` の検証と `main`／本番反映を区別し、明示承認なしに `main` を変更しない。
7. 完了証拠（SHA、関連コード／テスト、再現手順、検証結果）を残し、CURRENT_SPEC と BACKLOG を同期する。

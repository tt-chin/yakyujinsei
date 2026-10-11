# 待辦清單 / 実装・照合バックログ

整理日：2026-10-11。文書改訂：9（ACT-01／02最終驗收・最新状態索引）。未完了事項の唯一の正本。現行仕様：[CURRENT_SPEC.md](CURRENT_SPEC.md)、完了履歴：[CHANGELOG.md](CHANGELOG.md)、開発規則：[AGENTS.md](AGENTS.md)。

## 最新驗收狀態

基準：最新 `origin/dev`（本次 fetch 時）**`dee5c07d010a87bc941bb6bce3e78f307a13a066`**、VERSION **1.11.4**、驗收日期 **2026-10-11**。[ACT 最終驗收報告](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)。受驗工作樹另含本次測試補強；交付提交只改測試及文件，不改遊戲。`origin/main` 為 `e886e84ca08c6c185406cac9d6f3c4376277061a`，本次未修改。

以下按本文件目前正式 checkbox ID 重新計數，索引中的 ID 不重複計算。原段落已結案的 ACT-03／SAL-01轉列完成項；合計 **38 ID＝已完成10＋未完成28**，不是沿用 v1.11.2 的分類統計。未完成分類互斥，其他項保留原標籤，不在本輪擅自改變狀態。

- **已完成10**：TEST-RUNNER-01、TEST-CI-01、BUG-KBO-RENEWAL-FLOOR、BUG-HOF-FIRST-BALLOT-LEAGUE、TEST-COVERAGE-01、AUD-01B、BUG-ACT-03、BUG-SAL-01、BUG-ACT-01、BUG-ACT-02。個別驗收日期、範圍與報告連結見下方完成清單。
- **未完成28**：下述3＋7＋6＋12；P0 未完成 **0**。不代表全部遊戲情境已驗證。
- **BLOCKED 3**：EVT-1102-ANDROID、UI-17-DEVICE、SHARE-111-DEVICE（實機／原生分享環境不足）。
- **IMPLEMENTED_UNVERIFIED 7**：AUD-02、AUD-03B、AUD-04、AUD-05、REFACTOR-AUDIT-01、HOF-NATURAL-SAMPLE-01、COPY-01。
- **DESIGN_PENDING 6**：HOF-BUCKET-DECISION-01、HOF-PITCHER-BALANCE-01、HOF-HONOR-POLICY-01、HOF-DISPLAY-ROUND-01、HOF-VOTE-STORY-01、OVR-01。此統計將原標籤「仕様待ち」歸入設計待決，不改現行規則。
- **其他候補／保留／混合狀態12**：TRAIT-PITCHER-TC、TRAIT-NITENICHI、TRAIT-CHAMPIONMAKER（承認済み保留）；CONTRACT-LEGACY-01（重構候補・要調査）；CONTRACT-ASIA-01（未実装・仕様待ち）；INJ-UI-01、PLY-01、INT-01、EVT-01、UI-06、UI-07、PLY-02（候補）。

本輪 BUG-ACT-01 為「現行功能驗收 PASS」；**原始完整操作歷史未取得，原故障路線未精確重現、根因未證明**。依本次明示結案標準移出未完成清單，限制永久保留於報告。BUG-ACT-02 的指名後第一選項 DOM、可見／可點擊、listener、單次執行、下一年度推進均通過。下一階段優先 AUD-03B 與 AUD-02／重構風險調查；實機項維持 BLOCKED，殿堂政策等待決策。

## 歷史快照：v1.11.2 調査基準と状態の定義（原第0章）

本節數字及原判定只屬 2026-10-10 的歷史快照，不是最新進度；保留原報告數據，不回寫為本次結果。

- 対象：`tt-chin/yakyujinsei` `dev`、**受驗 HEAD `a4aa83c48a48a1567bf3b14ceea6e4c76c87b76b`**、VERSION **`1.11.2`**。`main` は `421e036bb206a11828a696a4f8b0d3909385441f`、VERSION `1.10.2`。受驗時の基準であり、後続変更時は再取得する。
- 改訂6の一次驗收證據：`docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md`（2026-10-10、Codex報告。使用者提供の同名調査報告を根拠とする）。`CURRENT_SPEC.md`、`CHANGELOG.md`、`AGENTS.md` を併用。**改訂6の文書整理ではテストを独立再実行していない**。後続のKBO修復と第3段階の実行結果は各専項報告で管理し、旧調査件数へ混ぜない。
- Codex調査の38 ID判定：PASS 3、FAIL 1、IMPLEMENTED_UNVERIFIED 10、NOT_IMPLEMENTED 14、BLOCKED 4、DESIGN_PENDING 6。**PASSは当該驗收範囲に限定**。非実装候補・承認保留・実機未検証を混同しない。
- 検証環境：Windows／Node 24.15.0／Playwright Chrome 155、ローカルとPreview。320/390pxはモバイル模擬でありiOS Safari・Android Chrome実機ではない。
- `tests/` は**54ファイル**（33 `.test.mjs`、5 standalone、11 E2E、5 support／分析／fixture）。本次33+5入口 PASS、E2E一部のみ実施、KBO自然進行 FAIL。全E2E・4,000生涯・全機種のPASSとはしない。
- 状態：`FAIL（再現済み）`／`BLOCKED`／`IMPLEMENTED_UNVERIFIED`／`NOT_IMPLEMENTED`／`DESIGN_PENDING`／`PASS（範囲限定）`。未完了は `[ ]`、報告の範囲内で完了した調査のみ `[x]` とし、完成機能の全面保証を意味しない。
- 改訂6は使用者の手動置換用の文書更新案だった。後続の承認済みKBO修復と第3段階では、devの実装・テスト・正本更新に伴い本書の該当項目だけを更新する。`main`／本番は変更しない。

## 今回の驗收で完了と判定した項目（証拠付き）

各項為其報告範圍內的結案，不表示本輪重新驗收全部功能。TEST-RUNNER-01／TEST-CI-01驗收日2026-10-11，基準 `dee5c07d010a87bc941bb6bce3e78f307a13a066`，見[基盤報告](docs/reviews/TEST_INFRA_ACCEPTANCE.md)。KBO／HOF／TEST-COVERAGE／AUD-01B驗收日2026-10-10；KBO依專項報告，其餘三項依[歷史審查報告](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)。

- [x] **TEST-RUNNER-01**【PASS／テスト基盤】61個の現行testsファイルを分類し、`scripts/test.mjs list/quick/full/audit`、個別実行、時間／exit／ログ、FAIL／BLOCKED非零、外部依存・Git基準、明示的証拠再利用を実装。本機quick44／full55入口PASS、audit56 PASS＋10 SKIP（55重用＋1実跑）。人為exit17と依存不足を負面実測。4,000生涯・実機・旧oracle・報告再生成は自動完了扱いにしない。[驗收報告](docs/reviews/TEST_INFRA_ACCEPTANCE.md)。VERSION 1.11.4据え置き。
- [x] **TEST-CI-01**【PASS／Linux実行】dev push quick、main向PR full、手動quick/full/auditのテスト専用workflowを新設。固定Node／Playwright、Chromium依存、失敗ログartifact、timeout／concurrencyを設定。初回workflow context不正を調査修正後、Ubuntu 24.04で[quick](https://github.com/tt-chin/yakyujinsei/actions/runs/38132643250)／[Draft PR full](https://github.com/tt-chin/yakyujinsei/actions/runs/38132662335)／[手動audit](https://github.com/tt-chin/yakyujinsei/actions/runs/38132971169)全てsuccess。既存publish-site.yml・main・本番設定は不変。合併強制停止のRuleset設定は別承認事項で未実施。
- [x] **BUG-KBO-RENEWAL-FLOOR**【PASS／v1.11.3修復】KBO候選在倍率適用後先補至既定階層最低年俸，再驗證原package上限；不改政策／倍率／保障年表。`jp3-infielder-01`／IF／`--balanced` 的2049年首次輸入為736萬円、最低800萬円、上限21597.6萬円（非真正衝突），修復後2050年正常退休。失敗前390操作的狀態／選擇／RNG完全一致；投手／野手各一組完整生涯比較一致。新增10組最小回歸及PC／320／390px續約・連打・原生付款去重驗證通過；Preview 47資產與修復SHA一致並通過相同完整E2E。詳見[修復報告](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md)。本項為驗收後另行授權修復；上述v1.11.2報告與件數仍是歷史快照，不改寫為全項PASS。
- [x] **BUG-HOF-FIRST-BALLOT-LEAGUE**【PASS／v1.11.2】`retireScene` は `firstBallotLeagues` から `legendLeague` を決定。31ケース、CPBL8600／MLB11000境界、本機／Preview HOF E2E通過。**自然跨聯盟初年度入選率は未調査**であり、HOF-NATURAL-SAMPLE-01に残す。
- [x] **TEST-COVERAGE-01**【PASS／調査範囲】54ファイルの入口／依存／未実行対象を分類。これは100%コードカバレッジや全E2E完了を意味しない。`fixed-seed-regression.json` は未参照の可能性があるが、外部用途未確認のため削除禁止。
- [x] **AUD-01B**【PASS／指定スナップショット】`origin/main` と公開source repoの108ファイルblob一致、正式URLで108/108期待ファイルのHTTP内容一致。Preview 47 tracked HTML/JS/CSSも受驗devと一致。CDN全ノード・追加URL・将来配信を保証しない。
- [x] **BUG-ACT-03**【PASS／既結案範圍】驗收日2026-10-11，受驗提交 `0ea291bca48295b9a534e3c09211533fc509b627`／1.11.4。原生契約境界、傷病×満了×降格、自然生涯通過；N/A及未驗證範圍見[契約・年俸報告](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)。本輪不重做全面調查。
- [x] **BUG-SAL-01**【PASS／v1.11.4既修復範圍】驗收日2026-10-11，同受驗提交 `0ea291bca48295b9a534e3c09211533fc509b627`。MiLB降格NPB候選年俸表示修復、候選受諾／次年度支付等通過；詳見[契約・年俸報告](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)。不保證全部seed／實機。
- [x] **BUG-ACT-01**【PASS／現行功能最終驗收】驗收日2026-10-11，基準 `dee5c07d010a87bc941bb6bce3e78f307a13a066`／1.11.4。投手／野手、PC／320／390px、成績結果／返回／下一操作、快速重複輸入、完整生涯及S／RNG比較通過。**原始路線未精確重現，不能宣稱已證明歷史根因**。結案證據：[最終報告](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)。
- [x] **BUG-ACT-02**【PASS／指名後第一操作最終驗收】驗收日2026-10-11，同基準 `dee5c07d010a87bc941bb6bce3e78f307a13a066`／1.11.4。P／IF×HS／U／CORP／IND×正式／育成×三尺寸48組；第一選項實際pointer、listener保持、一次執行、拒絕失效callback、契約／付款去重、2034年推進及Preview通過。結案證據：[最終報告](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)。不宣稱所有未知歷史路線已重現。

## P0：再現済み不具合・既存重大不具合の再確認

本次 ACT-01／02依明示結案條件通過，已移至完成清單；本欄未完成0項。ACT-03／SAL-01為前階段已結案項，現改列可計數完成項，不改寫其歷史驗收範圍。原操作歷史不足等限制保留於新舊報告，不刪除歷史證據。

## P1：テスト基盤と正本照合（次の開発に先行）

- [ ] **AUD-02**【IMPLEMENTED_UNVERIFIED／16節索引作成済み】CURRENT_SPEC 16節のコード／既存テスト索引は報告第8節に作成済み。全数値・DOM分岐・跨機能相互作用までの完全検収は未完了。実装済み・差異・未検証を区別。差異を自動修正対象としない。
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

1. **P0 結案證據を維持**：KBO初回入力分析・独立修復はv1.11.3で完了。ACT-01／02は本次現行機能驗收で結案；原操作歷史が将来提供された場合は新証拠として調査する。元路線未精確重現の制約は報告に永久保持。修正と大規模重構を同時に行わない。
2. **P1 テスト基盤を維持**：TEST-RUNNER-01／TEST-CI-01は専項驗收済み。現行61ファイルの登録・quick/full/auditとLinux CIを維持し、新入口を未分類のまま放置しない。旧oracleの適用版・負面証拠を保持し、次の能力／跨機能回帰へ進む。
3. **P1 契約／能力回帰**：既存の全休×満了×降格、海外各階層契約表示・次年度支払、指名直後DOM／listener専用回帰を維持。次はAUD-03BのUndo carryキー／combo／late等の未検証範囲を補強。
4. **P1 AUD-02／AUD-04／AUD-05 と REFACTOR-AUDIT-01**：全S読書・AST呼出・RNG消費・旧コード到達性を読み取り専用で補完。小規模重構はテスト基盤が安定してから。
5. **P1 HOF-NATURAL-SAMPLE-01**：四聯盟と投手SP/MR/CLの有効な自然到達サンプルを拡充。得られたデータに基づき仕様判断し、無断で係数を変更しない。
6. **P1 実機／文案、P2 新機能**：実機は使用者等の端末で最終驗收。dev→Preview→使用者承認→mainを維持。

## 今回の驗收で追加確認した技術的な制約

- 33個 `.test.mjs` と5個standaloneはPASS。ただしE2Eは部分実施で、`event-system`、`draft-income`、`display-preferences`、`salary-history`、`trait-system` の5入口を未実施。`retirement-hof-pilot` 再採樣と分析／報告生成器も未実行。`full` 完了とは扱わない。
- 上記は初回監査の履歴。後続のdraft-income専項で、旧first-row戦略の未入団退職と育成支度金を欠いた所得断言を調査・テスト修正。本機quick、Preview正式／育成入団、三尺寸負面退職、retirement-onlyと関連契約テストの限定結果は[専項報告](docs/reviews/DRAFT_INCOME_E2E_FIX_AUDIT.md)を参照。他の未実施入口を完了扱いにせず、ゲーム／政策／VERSIONは変更しない。
- 第4段階で現行61ファイルを再盤點し全full予定入口を実行。旧版との全量S比較3件は初期欄位差でFAILのまま保存し、現行規格のfixture／UIと最新正式基準の生涯比較を分けて驗收。最新の実行範囲・件数は[基盤驗收報告](docs/reviews/TEST_INFRA_ACCEPTANCE.md)を参照し、上記54ファイルの旧監査スナップショットは書き換えない。
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

# ブラウザー年度保存 第一期：開発・受入記録

2026-11-08。開発版1.15.0、未公開・未コミット。開始時dev HEAD 3e4a98e0eea30db849935bf3303283444878b03f。途中の独立作業で素材選單修正をPR #61へ置換し、PR #62を保持した現在HEADは1a74e71954c4a0f1fbf311f3a6796e3ca7e0329b。存檔変更はすべて作業ツリーにあり、独立CI提交へ混入していない。

## 状態

IMPLEMENTED_UNVERIFIED。最新補強後の最終Quick／Fullは執行請求が拒否されたためNOT_RUN。結果取得前に第一期完了とはしない。実機Safari／Android、Preview：NOT_RUN。ARTIFACT_COVERAGE_BLOCKEDは別件として継続。

## 実装範囲

IndexedDB自動保存1枠、年度引継ぎ確定後かつ年度首步前の同期擷取、revision CAS、世代無効化、旧保存を維持する失敗処理、明示的非保存開始、2タブ競合で敗者の書込停止、原保存からのクリーン読込／retry、確認付き削除。設定域は独立。Sの元フィールド／規則／主RNGに新しいゲーム効果を加えない。

過年度D2証明は生きた完了所有権とReceipt完了を擷取時に確認し、完全Sと証明索引を非exportable HMAC keyで封存する。読込は完全性を確認してから歴史Consumer用のreadonly証明を再構築する。任意のJSON、他S／index、変造されたcaptureやauthorizationだけでは完了扱いにならない。既存の未検証歴史を新IDへ昇格しない。効果・給与・honorsを再実行しない。これは同origin本機データの完全性保護であり、防作弊や悪意ある同origin任意コードへの防御ではない。key消失時は読込拒否、原データ維持。

形式はschemaVersion2／year-start-v2-auth。未公開試作schema1は自動的に信頼済みへ移行しない。2MiB／深度32／配列1024／節点131072を維持。14自然＋10制御fixtureの659年度盤点に加え、認証保存15路線341年度で最大envelope254519 UTF-8 bytes（約249KiB）を観測。理論最大や実際のブラウザー物理ディスク使用量の保証ではない。

## 限定検証

- Codec／hydrate：39 PASS（659旧観測データを含む）。これは旧JSONの完了証明を認定した結果ではない。
- IndexedDB／封存：43 PASS。native key持久化、ページreload、新規保存／CAS競合、取消、quota、tombstone、コピーJSON拒否、状態／証明／seal変造拒否、key欠失時旧保存維持、偽authorization拒否、再保存後の証明維持。証拠：test-results/browser-save-auth-store-final-r3/summary.json。
- Controller：10 PASS。未知保存時の恒久非保存、旧保存維持、逐次書込、重複年度防止、競合停止、故障retry、削除取消、slow restore/delete中の重複・開始拒否。
- 原獎項transaction：25 PASS、既存の24例を保持したまま履歴証明の負向検証1例を追加。test-results/browser-save-proof-award-unit-r2.log。
- Runtime：5グループPASS。1280／320／390px、初年／翌年SとRNG一致、初期処理故障で旧保存維持とクリーンretry、実2タブ、DB拒否時非保存。test-results/browser-save-runtime-auth-r1/summary.json。後続busy制御変更は最終実行で再検証。
- 全路線：15 PASS、341年度。自然P／IFは2例、残り13例は明示的CONTROLLED_FIXTURE（MLB／R／A1～3、NPB一軍／二軍／育成、KBO一軍／二軍、CPBL一軍／二軍、復健）。各年度の実保存→再読込→同じ選択策略で年度全体S／RNG一致。15例すべて最終年度の未保存操作を重玩して同じ引退結果に到達、原保存不変。test-results/browser-save-routes-auth-complete-r3/summary.json。
- 変更前後：HEAD1a74e71954c4a0f1fbf311f3a6796e3ca7e0329bに対する既存GameView完全生涯8例がPASS（test-results/browser-save-live-baseline-1a74-r1.log）。許容は新規保存status UIと明示したversion／birthHighSchool.createdVersion metadataのみ。S・選択DOM・成績・RNGは既存厳格比較を維持。
- 分批工具：CI 31 PASS／1 Linux-only SKIP、本機11 PASS。Full105はsyntax1＋inventory104、Quick79はsyntax1＋inventory78。tool試験のSKIPはPASSへ転換しない。

## 元FAILと修正

[元停止報告](BROWSER_SAVE_PHASE1_BLOCKER.md)を保持。Rookie→CORP引退でHOFが消えた失敗は、封存認証と歴史readonly証明で修正し、test-results/browser-save-rookie-auth-r1/の26年度S／RNG比較PASS。元S／RNGの差異を許容した修正ではない。

後続検証のFAILも保持：routes-auth-complete-r1は非同期復元前のnull状態を待機predicateが読んだテスト不備。r2は年度途中引退を読込直後の引退と誤認したテスト不備。r3は保存年度の同じ操作を重玩して最終状態・全RNG・保存不変を厳格に比較し全15例PASS。

ci-tools-final-r1はsyntax入口を計数に含めなかった104期待に対し実際105でFAIL。全105集合の計数へ修正、r2で31 PASS／1プラットフォームSKIP。旧FAIL／goldenは上書きしていない。初期Quick73／5及び限定5／0など前段履歴は元停止報告参照。

## 最終受入

Quick：旧r2は79 PASS／0 FAIL／0 SKIP／0 BLOCKED（256.164秒）だが、封存票證のmetadata綁定補強前の中間試行としてSUPERSEDED（同目錄のSUPERSEDED.json）。補強後の新規Quick／Full執行請求は未獲准のため、quick-final-r3／full-final-r1は未啟動、NOT_RUN。実行時のsource fingerprint、全105入口、log／summaryの場所と実際の計数を追記する。限定PASSを全体PASSとしない。すべての必要検証後もcommit／push／公開は別途指示を待つ。


最終審查の追加FAIL：test-results/browser-save-auth-envelope-binding-fail-r1.logは、Sが同じでもcareerIdを変えたenvelopeへ票証を流用できる負向例を再現。票証をstateだけでなく全envelopeへ結び付ける修正を行い、auth-store-final-r3で43 PASS。原FAILを保持し、Quick旧r2を新コードのPASSとして流用しない。


### 最新コードの直接検証と残件

- auth-store-final-r3：43 PASS／0 FAIL。票証と完全envelope（careerId／revision／versionを含む）の綁定を確認。
- proof-award-unit-final-r3：25 PASS。controller-final-r3：10 PASS。
- 全15路線341年度及び変更前HEADに対する8生涯比較はmetadata綁定の最終補強前の限定証拠。原FAIL修復と不変性の根拠として保持するが、最終補強後の全体PASSへ流用しない。
- 必要な次の操作：確定ソースで新規Quick79、成功後に既存本機8批／最大2並行Full105。実機Safari／Android及びPreviewは別途実施。これら未完了のためBACKLOGはIMPLEMENTED_UNVERIFIEDで未勾選。
- 本輪はcommit／push／main反映／部署を行っていない。


## 実機受入手順（2026-11-08準備、結果未取得）

対象は同じ固定HTTPS branch Preview URLを使うiPhone SafariとAndroid Chrome（通常モード）。Production mainや正式サイトのデータを検証対象としない。VERSION、対象SHA、機種、OS、ブラウザー版、実施日時を記録する。サーバー／暗号化金鑰のインストールは不要。Web Cryptoを必要とするためLANの平文HTTPで代替しない。異なるorigin間の存檔は共有されない。

1. バージョン1.15.0と試験用Seed（例save-device-20261108）を確認し、新生涯を開始。年度開始の「セーブしました」まで待つ。iPhoneは投手、Androidは内野手で最低1例ずつ、可能なら両方を確認。
2. 当年度の選択を数回行い、年度をまたぐ前にreload。「続きから」で同年度最初へ戻り、年齢・能力・収入が二重加算されず、当年度の未保存選択がやり直しになることを確認。
3. 次年度へ進めて保存成功を待ち、頁籤を閉じる。同じURLを新規頁籤で開き、保存概要の年度と選手を確認して再開。前年度へ戻ったり、新生涯になったりしないことを確認。
4. タイトルの新規開始確認をcancel。旧保存の概要／再開が維持されることを確認。削除は1度目を承認、2度目をcancelし、旧保存が残ることを確認。
5. 同じURLを2頁籤で開き、同じ保存年度から両方再開。Aで次年度保存後、Bも次年度へ進める。Bが以後非保存となり、Aの保存を覆わないことを確認。Bのタイトル帰還確認のcancelと承認、最新保存からの再読込を確認。強制覆写ボタンはない。
6. 狭い縦画面、横画面及びブラウザーアドレスバーの表示切替で、保存概要／通知／ボタンが切れず操作できることを確認。
7. 試験終了後、必要な結果を記録したうえで試験Previewの保存を2段階確認で削除し、reload後に「続きから」がなくなることを確認。表示設定は保持されることを確認。

返却項目：URL／SHA／VERSION、機種・OS・ブラウザー、上記1～7のPASS／FAIL／NOT_RUN、保存年度→reload後の年度、異常時の表示。初期復元故障、quota、key／seal破損等は自動故障注入結果と区分し、実機で未実施なら未実施とする。実機結果受領前はPASSを付けない。


### CI優先への切替（2026-11-08、使用者承認）

feature/browser-saveの製品commitはccd1ac2b109fd34812c0a5588558376b8a87ab1a。最新の本機Quickはtest-results/browser-save-1150-quick-acceptance-r4/summary.json、79 PASS／0 FAIL／0 SKIP／0 BLOCKED、367.687秒。最終metadata綁定補強後の実行であり、旧SUPERSEDED結果と区別する。

本機Fullは使用者がGitHub Actionsでの驗收へ切替を承認したため中止。test-results/browser-save-1150-full-acceptance-r2/INTERRUPTED_BY_USER.jsonにcoordinatorと理由を保存。起動中のbatch1／2を停止し、未完了をPASSへ数えない。CI側に必要なテストを含まない製品のみのccd1ac2 Runは第一期の完整驗收ではない。

本機Fullの再実行は不要とし、テスト・manifest・文書をfeatureへ提交／push後、同一新SHAでCI Quick79→成功後CI Full105を行う。既存workflowと判定を保持し、8批／Aggregate PASS及び必要証拠を確認する。CI結果、Preview／実機は現時点未取得。ARTIFACT_COVERAGE_BLOCKEDは独立継続。dev／mainへの合併、正式部署は本切替の範囲外。


### Full 42434182612啟動相容性修正（2026-11-08）

同一d173509的Linux Quick42433830934為79 PASS；Full42434182612為98 PASS／7 FAIL、Aggregate FAIL_OR_INCOMPLETE。原結果及test-results/browser-save-ci-failure-analysis-42434182612/原始log保持不變。

修正限於測試啟動：共用harness提供首次導航前的beforeLoad接點，5類wrapper在第一次開局前安裝fixture，不先開局後reload造成覆蓋確認被預設取消；歷史game-only模式使用固定的存檔功能前main.js（1a74e71954c4a0f1fbf311f3a6796e3ca7e0329b），現行模式繼續使用現行main.js。歷史game.js比較SHA、原斷言、操作策略、狀態／RNG比較與timeout均未修改。

本機僅限定七項，未執行整套Full：startup-seven-r1為4 PASS／3 FAIL（1140.969秒）；3項全力投球在Windows因phasePre字串切片前未統一CRLF而立即FAIL。將season-phases.js讀取後、切片前正規化CRLF，再以startup-pitching-r2限定重測3項，3 PASS／0 FAIL（1036.908秒）。其他4項的來源及共用helper未再變動，保留原PASS。七項最終各自PASS，不把原r1的FAIL改寫，也不將限定結果稱為Full105 PASS。

修改6個測試檔及本紀錄，產品、VERSION、CI、Runner、manifest、golden均未改動。接著提交／push feature分支，完整Full105交由GitHub Actions取得全新結果；不在本機跑整套Full、不合併dev／main或正式部署。第一期仍須新CI Full及實機驗收，不提前結案。

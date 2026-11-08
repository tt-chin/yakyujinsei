# ブラウザー年度保存 第一期：開発・受入記録

2026-11-08。開発版1.15.0、未公開・未コミット。開始時dev HEAD 3e4a98e0eea30db849935bf3303283444878b03f。途中の独立作業で素材選單修正をPR #61へ置換し、PR #62を保持した現在HEADは1a74e71954c4a0f1fbf311f3a6796e3ca7e0329b。存檔変更はすべて作業ツリーにあり、独立CI提交へ混入していない。

## 状態

IMPLEMENTED_UNVERIFIED（2026-11-08最新）：dev合併後のCI Quick／Full及び桌機PreviewはPASS、iPhone Safari実機はWebDriver自動化で受入済み（使用者が実機受入として承認）、Android Chrome実機はNOT_RUN（下記「dev 合併後的 CI 與桌機 Preview」「iPhone Safari 實機」）。以下は前時点の記録：最新補強後の最終Quick／Fullは執行請求が拒否されたためNOT_RUN。結果取得前に第一期完了とはしない。実機Safari／Android、Preview：NOT_RUN。ARTIFACT_COVERAGE_BLOCKEDは別件として継続。

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

### dev PR #64 合併相容性（2026-11-08）

原分支 06eb583e30cf61d300ef0a6b82209f0070cde8f6 的 Linux Full 42445951072：105 PASS／0 FAIL／0 SKIP／0 BLOCKED，8 批及 Aggregate PASS。此結果僅屬原受驗 SHA。

合入 dev d3d2a53f78537f3de90befd8438c08a65049edfc，保留 PR #64 ProfessionalSeason 重構。BACKLOG 保留存檔未完成項目及 dev 的歷史紀錄；全力投球 E2E 保留首次導航前安裝 fixture，並將相同探針接到抽離後的 ProfessionalSeason。模組文字在切片前統一換行，不放寬原規則／S／RNG 斷言。新增的 ProfessionalSeason 入口使合併後 Full 為 106，批次工具期待數同步更新，未減少測試。

限定驗證：ProfessionalSeason 29 情境 PASS；存檔 Runtime 在 1280／320／390px 的年度還原 S／RNG、失敗保護及重試、雙分頁衝突與資料庫拒絕情境 PASS；批次工具 31 PASS／0 FAIL／1 SKIP（Linux 專用案例於 Windows 未執行）；235 個 JS 語法 PASS。本機未執行 Full。合併後整套 Quick／Full、Preview、iPhone Safari／Android Chrome 實機尚未驗證，不能沿用原 SHA 的 Full 105 PASS。ARTIFACT_COVERAGE_BLOCKED 維持獨立追蹤。

### dev 合併後的 CI 與桌機 Preview（2026-11-08）

PR #65 合併後的 dev 再併入 PR #66（第 36 期 `CheckpointRenderer`），受驗 SHA 為 `ea89c152f0c2fca95cdcc17f2a5a13573b8e2403`。

- CI：push Quick Tests #160 PASS；手動 Full Tests #161（Run 42464271804）Aggregate `{"status":"PASS","expected":107,"acceptedPass":107,"issues":[]}`，8 批 exitCode 0。此為合併後首次 Full，原 `06eb583` 的 Full 105 不再沿用。
- Preview 內容：`https://dev.yakyujinsei.pages.dev` 的 `src/engine/game.js`、`src/ui/checkpoint-renderer.js` 與 `ea89c15` 逐位元組一致；版本 1.15.0。
- 桌機 Preview（macOS Brave、Playwright 操作、1280 寬；seed `save-preview-20261108`、投手；開始前此 origin 無存檔）依上述實機受入手順：
  1. 開局後「2026年の開始時点をセーブしました」：PASS。
  2. 同年度分配 5 顆骰子（スタミナ 22→47）並確定後 reload，「続きから」回到 2026 年開頭，スタミナ 22、年齡 16、年俸 0，無重複加算：PASS。
  3. 進到 2027 年並存檔（17 歲、能力 51／31／31／23、總合 32），關閉分頁後新分頁開同 URL，概要為 2027 年・17 歲，再開後數值一致：PASS。
  4. 新規開始確認 cancel、刪除第 1 段承認・第 2 段 cancel 後，存檔概要仍為 2027 年：PASS。
  5. 兩分頁自 2027 年再開；A 進到 2028 年存檔（61／34／31／23）；B 以不同分配進到 2028 年（54／47）後顯示「別のタブで進行状況が更新されました。このタブでは以後セーブされません。」，只有「セーブせずに続ける」「タイトルで最新データを読む」，無強制覆寫。B 返回標題確認 cancel 後留在遊戲，承認後再開為 A 的 2028 年（61／34）：PASS。
  6. 標題存檔區在 390×844、844×390 無水平溢出（`scrollWidth`＝視窗寬），按鈕未被裁切：限定 PASS；網址列顯示切換只能實機確認。
  7. 主題改為ナイター後，兩段確認刪除存檔；reload 後顯示「セーブデータはありません」、無「続きから」，主題保留：PASS。測試後顯示設定已恢復初始值。
- 未做（本節時點）：iPhone Safari／Android Chrome 實機。iPhone 已於下節完成。ARTIFACT_COVERAGE_BLOCKED 維持獨立追蹤。

### iPhone Safari 實機（2026-11-08，WebDriver 自動化；使用者確認作為 iPhone 實機驗收）

- 裝置：iPhone 13 mini（iPhone14,4），iOS 26.6.1（23G83），Safari 26.6.1；USB 配對，Mac 端 `safaridriver`（Safari 26.5.2 附帶）以 `platformName: iOS` 連線，iPhone 已開啟網頁檢閱器與遠端自動化。未安裝任何套件。
- 對象：`https://dev.yakyujinsei.pages.dev`（`ea89c15` 內容，v1.15.0），`isSecureContext` true、`crypto.subtle` 可用，視窗 375×664。seed `save-device-20261108`、投手；開始前此 origin 無存檔。
- 與手順的差異：WebDriver 工作階段與一般瀏覽資料隔離（非通常模式本身），結束時清除；「關閉頁籤」以 WebDriver 關閉視窗＋開新視窗代替 App 切換器操作。使用者確認以此結果作為 iPhone 實機驗收。
- 結果：
  1. 開局後「2026年の開始時点をセーブしました」：PASS。
  2. 同年度分配骰子並確定（總合 29→30）後 reload，「続きから」回到 2026 年開頭，總合 29、年齡 16、年俸 0，分配可重做：PASS。
  3. 進到 2027 年並存檔（17 歲、總合 31），開新視窗並關閉原視窗，新視窗開同 URL，概要為 2027 年・17 歲，再開後一致：PASS。
  4. 回標題確認承認後，新規開始確認 dismiss、刪除第 1 段 accept・第 2 段 dismiss，概要仍為 2027 年：PASS（原生 confirm 文字皆正確）。
  5. 兩視窗自 2027 年再開；A 進到 2028 年存檔（總合 31，保存日時 17:25:28）；B 以不同分配進到 2028 年（總合 36）後顯示「別のタブで進行状況が更新されました。このタブでは以後セーブされません。」，可見按鈕只有「セーブせずに続ける」「タイトルで最新データを読む」。B 返回標題確認 dismiss 後留在遊戲，accept 後概要為 2028 年 17:25:28，再開為總合 31（A 的存檔）：PASS。
  6. 直向 375×664：遊戲畫面與標題存檔區 `scrollWidth`＝375、無水平溢出、無按鈕裁切，截圖目視確認：限定 PASS。橫向及網址列顯示切換未測（WebDriver 無法操作）。
  7. 主題改為ナイター後兩段確認刪除；reload 後「セーブデータはありません」、無「続きから」，主題保留：PASS。測試後顯示設定已恢復初始值。
- 未做：Android Chrome 實機（NOT_RUN）。收到結果前本 ID 保持未勾選。ARTIFACT_COVERAGE_BLOCKED 維持獨立追蹤。

# UI基盤補充設計書

## 1. 文書情報

- 対象版：`1.5.0`
- 対象機能：UI-01 メイン4領域、UI-02 選手詳細4タブ
- 上位仕様：`YaKyoLife_詳細設計書.md`
- 差分仕様：`MIGRATION_MASTER_SPEC.md`
- 実装順：`MIGRATION_IMPLEMENTATION_SCHEDULE.md` D01
- 現行確認基準：ユーザー確認によりv1.4.5の実装完了（2026年9月4日）
- 先行条件：v1.4.5完了により充足済み
- 作成日：2026年8月29日
- 状態：設計完了・実装待ち

## 2. 目的

現行のゲーム進行、イベント選択、RNG、表示文を変えず、情報の閲覧先だけを次の4領域へ整理する。

```text
ホーム
育成・行動
記録
選手詳細
```

選手詳細は次の4タブを持つ。

```text
実績
契約・収入
特性
年度別
```

本対応は情報構造の変更であり、成績、能力、契約、イベント、故障、移籍、引退等のゲーム仕様変更ではない。

## 3. 対象外

`1.5.0`では次を実装しない。

- 高速配分とUndo
- 現在能力／潜在能力の新表示
- テーマ追加
- 文字サイズ設定
- PC／モバイル手動切替
- 現行v1.4.5の薪資評価・契約比較・契約提示理由の再実装
- 故障リスク内訳
- 背番号
- 大会別国際記録
- イベントカテゴリ
- 初心者説明
- 更新履歴
- 永久欠番
- 共有画像の再設計
- ゲーム途中保存

## 4. 現行DOM監査

現行`docs/index.html`のゲーム画面は次の構造である。

```text
#start
#app
  #board
    #bd-top
      #bd-name
      #bd-team
      #bd-tj
      #btn-restart
    #bd-grid
      #bd-age
      #bd-year
      #bd-ovr
      #salary-detail-trigger
        #bd-sal
    #lamps
      #lp0
      #lp1
      #lp2
  #log
  #act-toggle
  #act
  #salary-detail-panel
    #salary-detail-close
    #salary-detail-title
    #salary-detail-body
```

### 4.1 既存要素の所有関係

|既存DOM|現行責務|変更方針|
|---|---|---|
|`#start`|名前、ポジション、seed、新規開始|構造と処理を変更しない|
|`#board`|常時表示する選手・所属・年度・総合・年俸・進行段階|全領域共通ヘッダーとして維持|
|`#log`|`card()`等が追記するゲーム進行履歴|ノードを再生成せずホームへ配置|
|`#act-toggle`|操作欄の開閉|ノードとイベントを維持し育成・行動へ配置|
|`#act`|`choose()`、`allocUI()`等の選択・操作|ノードを再生成せず育成・行動へ配置|
|`#salary-detail-trigger`|現在年俸から既存の薪資内訳を開く|全領域共通の`#board`内で維持|
|`#salary-detail-panel`|v1.4.5のpayD、直近3季、契約、増減、理由、出来高等を表示|既存dialogとcontrollerを再利用し、詳細タブ側で再実装しない|

`#board`、`#log`、`#act-toggle`、`#act`のIDを変更しない。既存関数が参照するDOM契約を維持する。

## 5. 変更後DOM

```text
#start
#app
  #board                         既存・全領域共通
  #main-nav                      新規
    [ホーム]
    [育成・行動]
    [記録]
    [選手詳細]
  #view-host                     新規
    #view-home.main-view         新規wrapper
      #log                       既存node
    #view-action.main-view       新規wrapper
      #act-toggle                既存node
      #act                       既存node
    #view-record.main-view       新規
      #record-summary            新規
    #view-player.main-view       新規
      #detail-tabs               新規
      #detail-content            新規
  #salary-detail-panel           既存・全領域共通dialog
```

### 5.1 DOM上の確定事項

1. `#board`はタブ外に置き、どの領域でも表示する。
2. `#main-nav`は`#board`直後に置く。
3. `#main-nav`は`#board`の実測高を上端としてsticky表示し、縦スクロール中も4領域の切替操作を維持する。
4. `#log`はホームの唯一のタイムラインとする。
5. `#act`と`#act-toggle`は育成・行動へ移動するが、要素自体を作り直さない。
6. 非表示領域は`hidden`属性または統一classで切り替え、`innerHTML=''`で破棄しない。
7. 同じIDの複製を作らない。
8. `#salary-detail-panel`はview外に維持し、どの領域からでも既存controllerで開閉できるようにする。

## 6. メイン4領域

|領域|表示内容|主要データ源|更新方法|操作可否|
|---|---|---|---|---|
|ホーム|既存進行タイムライン、年度区切り、各種カード|既存`#log`、`card()`、`divider()`|現行処理の追記をそのまま使用|カード内の既存操作だけ|
|育成・行動|イベント選択、進路、配分、契約、シーズン進行ボタン|既存`#act`、`#act-toggle`、`choose()`、`allocUI()`|現行処理が生成したDOMを保持|可能|
|記録|通算成績、国際通算、表彰等の要約|状態`S`の既存集計値|領域を開いた時に読取専用view modelを生成|不可|
|選手詳細|実績、契約・収入、特性、年度別|状態`S`の既存値|領域またはタブを開いた時に読取専用view modelを生成|不可|

### 6.1 ホーム

- 現行`#log`の内容と追記順を変更しない。
- カードを種類別に再分類しない。
- 過去カードを別領域へ移動しない。
- 年度折りたたみの既存動作を維持する。
- ホームを開いても`card()`、ゲーム進行関数、RNG関数を呼ばない。

### 6.2 育成・行動

- `choose()`または`allocUI()`が新しい操作を表示した場合、表示領域を自動的に「育成・行動」へ切り替える。
- 自動切替はUI状態だけを変更し、選択肢の生成処理を二度呼ばない。
- 選択肢または能力配分の確定を実行した後は、結果確認のためホームへ自動遷移する。
- 選択実行中に次の選択肢が生成された場合は「育成・行動」への自動切替を抑止し、`#act`のDOMとイベントリスナーを保持してナビへ「選択待ち」を表示する。
- 利用者は選択前に他の領域を閲覧できる。
- 他領域へ移動しても`#act`の子要素とイベントリスナーを保持する。
- 再度「育成・行動」を開いた時は、同じ選択肢をそのまま表示する。
- 未選択状態ではナビに「選択待ち」を表示できるが、新しいゲーム状態は追加しない。
- `#act.collapsed`と`#act-toggle`の既存開閉動作を維持する。

### 6.3 記録

記録領域は生涯情報の要約であり、年度別の詳細行を重複表示しない。

|表示群|読取元|
|---|---|
|リーグ別通算成績|現行`S.stats`|
|国際大会通算|現行`S.intlStat`、`S.intlCount`|
|表彰・主要実績|現行`S.awards`または`S.honors`の現行正本|
|所属・競技年数|現行所属状態と既存通算年数|
|生涯収入要約|現行`S.careerEarnings`等の確定済み集計|

- 存在しない項目は`0`、空配列または「記録なし」として安全に表示する。
- 表示用に通算値を再加算しない。
- 表示用に国際大会、表彰、殿堂の判定を再実行しない。

### 6.4 選手詳細

選手詳細は閲覧専用とし、状態`S`を書き換えるボタンを置かない。

## 7. 選手詳細4タブ

|タブ|内容|読取元|表示しないもの|
|---|---|---|---|
|実績|表彰、優勝、国際代表、殿堂関連の確定済み結果|`S.honors`、`S.awards`、`S.intlStat`、`S.intlCount`等|新しい受賞・殿堂判定|
|契約・収入|現年俸、現契約、契約残年数、生涯収入、および既存薪資詳細への導線|`S.ct`、`S.currentSalary`、`S.careerEarnings`、`S.salaryDecisionHistory`等|新しい年俸計算、仮想オファー、薪資理由の再実装|
|特性|保有・消失特性、一般故障状態、TJ・リハビリ状態|`S.traits`、`S.removed`および現行故障・TJ状態|故障率再計算、治療操作|
|年度別|年度、年齢、所属、階層、役割、成績、年俸|現行`S.log`と既存年度記録|新しい年度集計|

### 7.1 タブ初期値

- 選手詳細を初めて開いた時は「実績」を表示する。
- 同一ゲーム中は最後に開いた詳細タブをUI状態として保持する。
- 新しいゲーム開始または再読み込みでは「実績」へ戻す。
- タブ選択をURLへ保存しない。

### 7.2 記録領域との重複整理

- 「記録」は現在までの要約を短く表示する。
- 「実績」は表彰・優勝等の一覧を表示する。
- 「年度別」は年ごとの行を表示する。
- 同じ計算を複数画面で行わず、共通view modelから必要部分を表示する。
- 契約・収入タブの詳細表示は既存`src/ui/salary-detail.js`を正本とし、同じpayD、直近3季、理由コード、契約scheduleを別HTMLで再構築しない。

## 8. UI状態

ゲーム状態`S`とは別に、次の一時UI状態を所有する。

```js
const uiState = {
  activeMainView: 'home',
  activeDetailTab: 'achievements',
  actionPending: false
};
```

|キー|値|所有者|永続化|
|---|---|---|---|
|`activeMainView`|`home`、`action`、`record`、`player`|navigation UI|しない|
|`activeDetailTab`|`achievements`、`contract`、`traits`、`yearly`|player-detail UI|しない|
|`actionPending`|操作DOMの有無から同期する表示状態|navigation UI|しない|

`uiState`を`S`へ追加しない。seed、共有URL、引退結果、JSON回帰snapshotへ含めない。

## 9. 状態受渡し

UIモジュールは状態`S`を直接所有しない。ゲーム側が読取専用の表示モデルを渡す。

```js
initNavigation({
  onOpenRecord: () => renderRecord(buildRecordViewModel(S)),
  onOpenPlayer: tab => renderPlayerDetail(buildPlayerDetailViewModel(S), tab)
});
```

### 9.1 表示モデル原則

- 値のコピーまたは整形済みの読取専用objectを渡す。
- UIから状態変更関数を呼ばない。
- getter内で`R()`、`ri()`、`pick()`、`chance()`を呼ばない。
- getter内で配列へpush、sort等の破壊的操作をしない。
- 並び替えが必要な場合はコピー後に行う。
- 選手名、球団名等は`textContent`または現行`escapeHTML()`を使用する。

## 10. 推奨モジュール

```text
docs/
  index.html                         4領域の固定containerを追加
  styles/
    base.css                         既存共通styleを維持
    ui-navigation.css                ナビ、領域、タブ、詳細表示
    jp-theme.css                     現行テーマの追加selectorだけ
  src/
    engine/
      game.js                        Sから表示モデルを作りUIへ渡す
    ui/
      navigation.js                  main領域と一時UI状態
      record-view.js                 記録要約の描画
      player-detail.js               4タブの描画
      salary-detail.js               既存v1.4.5薪資詳細を維持・再利用
    main.js                          現行起動順を維持
```

### 10.1 依存方向

```text
main.js
  -> engine/game.js
       -> ui/navigation.js
       -> ui/record-view.js
       -> ui/player-detail.js
```

UIモジュールから`game.js`をimportしない。循環依存を禁止する。

### 10.2 最小変更方針

- `card()`は引き続き`#log`へ追記する。
- `choose()`と`allocUI()`は引き続き`#act`を使用する。
- `board(phase)`は引き続き既存`#board`だけを更新する。
- `createSalaryDetailController()`と`#salary-detail-panel`の既存動作を維持する。
- 既存関数本体をUIモジュールへ大量移動しない。
- `1.5.0`では状態`S`の構造を変更しない。

## 11. ナビゲーション動作

|操作|結果|ゲーム状態|RNG|
|---|---|---|---|
|ゲーム開始|ホーム表示|現行開始処理のみ|現行どおり|
|メイン領域切替|該当sectionだけ表示|変更なし|消費なし|
|詳細タブ切替|該当内容を再描画|変更なし|消費なし|
|選択肢生成|育成・行動へ自動切替|現行生成処理のみ|現行どおり|
|選択実行完了|結果確認のためホームへ自動切替。次の選択肢は保持して選択待ちを表示|変更なし|消費なし|
|選択前に記録閲覧|選択DOMを非表示で保持|変更なし|消費なし|
|育成・行動へ復帰|同じDOMとlistenerを再表示|変更なし|消費なし|
|リスタート|現行確認後に新規画面へ|現行どおり|現行どおり|
|引退後の領域切替|結果、記録、詳細を閲覧可能|変更なし|消費なし|

## 12. スクロール

- 領域ごとに独立したゲーム履歴を複製しない。
- ホームへ戻った場合は、原則として直前のホームscroll位置を復元する。
- 育成・行動へ自動切替した場合は、既存`scrollBottom()`で操作欄を確認できる状態にする。
- タブ切替のために`scrollBottom()`を追加呼出ししない。
- PCとモバイルで横スクロールを発生させない。ただし既存年度成績表の専用横スクロールは維持する。

## 13. アクセシビリティ

- メインナビは`nav`要素とbuttonを使用する。
- 現在領域に`aria-current="page"`を付ける。
- 詳細タブは`role="tablist"`、`role="tab"`、`role="tabpanel"`を使用する。
- 選択中タブに`aria-selected="true"`を付ける。
- 非表示panelは`hidden`を使用する。
- 色だけで選択状態を表現しない。
- キーボード操作とタップ操作の両方を維持する。

## 14. セキュリティ

- 選手名、球団名、学校名を未escapeの`innerHTML`へ挿入しない。
- 現行の選手名正規化と`escapeHTML()`を維持する。
- 一覧描画では可能な限り`textContent`とDOM APIを使用する。
- 表示用HTML文字列を作る場合は、外部入力だけでなく状態内の名称もescapeする。

## 15. 必須テスト

### 15.1 静的検証

1. `#board`、`#log`、`#act-toggle`、`#act`が各1件だけ存在する
2. 新規moduleのimport/exportが解決する
3. 新規CSSが404にならない
4. UIモジュールから`game.js`への逆importがない
5. UIモジュール内に`R()`、`ri()`、`pick()`、`chance()`呼出しがない

### 15.2 選択肢保持

1. イベント選択肢を表示する
2. 選択せず記録へ移動する
3. 選手詳細の4タブを切り替える
4. 育成・行動へ戻る
5. 選択肢の文言、順序、個数が同じである
6. 1回選択して処理が1回だけ実行される

同じ試験を契約、進路、能力配分、国際大会、引退後ボタンでも実施する。

### 15.3 固定seed

投手3件、野手3件以上で変更前後を比較する。

- 初期能力
- サイコロ結果
- イベント出現順
- 選択結果
- 年度成績
- 能力成長・衰退
- 所属、昇格、降格、移籍
- 年俸、契約、表彰
- 引退年、最終成績、殿堂
- RNG消費回数または最終RNG状態

URL表記を含め、意図したUI以外の差異を認めない。

### 15.4 PC E2E

- 新規ゲーム開始
- 4領域の切替
- 詳細4タブの切替
- イベント選択保持
- 能力配分
- シーズン進行
- 契約・移籍
- 引退画面
- 共有画像とURLコピー
- Consoleエラーなし

### 15.5 モバイルE2E

- 320px、375px、390px相当で確認
- 長いMLB／MiLB球団名でナビが崩れない
- `#board`とナビが本文を覆わない
- 操作欄とSafari safe-areaが衝突しない
- 年度表の専用横スクロールを維持
- タブ文字が切れない
- 共有・再開始ボタンが操作できる
- 現在年俸と契約・収入タブの両方から既存薪資詳細へ到達できる

## 16. 受入条件

1. メイン4領域が利用できる
2. 選手詳細4タブが利用できる
3. 現行`#log`、`#act`の内容を破棄しない
4. 未選択の選択肢を保持する
5. 同じ選択が二重実行されない
6. UI操作でRNGを消費しない
7. UI状態を`S`やURLへ保存しない
8. 固定seed結果とRNG消費順が一致する
9. ゲーム仕様、表示文、翻訳を変更しない
10. PC・モバイルで主要操作が完了する
11. 引退後も結果、記録、共有操作へ到達できる
12. Console、JavaScript、CSSのエラーと404がない
13. v1.4.5のpayD、直近3季、契約schedule、理由、出来高、FA市場表示を重複実装せず維持する

## 17. Codex計画フェーズ指示

```text
AGENTS.md、YaKyoLife_詳細設計書.md、MIGRATION_MASTER_SPEC.md、
MIGRATION_IMPLEMENTATION_SCHEDULE.md、UI_FOUNDATION_SUPPLEMENTAL_DESIGN.mdを
最初から最後まで確認してください。

今回は1.5.0のUI-01とUI-02だけを対象にします。

現行の#board、#log、#act-toggle、#act、board()、card()、choose()、
allocUI()、endGame()の依存関係を確認し、本補充設計との差異を報告してください。

変更予定DOM、module、CSS、表示モデル、UI状態、起動順、選択肢保持方法、
固定seed比較、RNG消費比較、PC・モバイルE2Eの計画を提示してください。

ゲーム仕様、状態S、RNG、イベント順、表示文は変更しないでください。
私が承認するまでファイルを変更しないでください。
```

## 18. 設計完了判定

次の項目を本書で確定したため、D01を完了とする。

- 現行DOMの維持対象
- 変更後DOM構造
- 4領域の責務
- 詳細4タブの責務
- 状態とUI状態の所有関係
- 選択肢DOMの保持方法
- モジュール依存方向
- RNG非消費条件
- PC・モバイルE2E
- 固定seed回帰条件

次に処理する資料はD02 `THEME_PREFERENCES_SUPPLEMENTAL_DESIGN.md`である。

## 19. v1.5.0正式公開前ホーム・能力UI改訂

`V1.5.0_HOME_ABILITY_UI_REVISION_SPEC.md`を優先し、メイン4領域を`home`、`ability`、`record`、`player`へ改訂する。旧`action`領域と画面状態を廃止し、既存の`#log`、`#act-toggle`、`#act`をこの順でホームへ一度だけ配置する。選択肢の生成・実行ではメイン領域を自動切替せず、新しい選択肢は既存と同様に画面下部から表示する。DOMの一意性、event listener保持、選択肢生成回数は変更しない。

能力画面は状態`S`から総合、ポジション別能力の現在値・潜在能力上限、既存の体力・疲労・故障情報を開くたびに生成する読取専用領域とする。状態変更、能力操作、RNG呼出し、URL保存を行わない。本改訂は未公開のv1.5.0へ含め、版番号は変更しない。

## 20. v1.5.1 表示整合

能力画面と選手詳細のリハビリ表示は、`skipMid===true && seasonFactor===0`を今季全休として共通判定する。記録画面は「プレー年数」「リーグ別通算成績」を使用し、成績表示モデルは修正済みの`S.stats` bucketをそのまま参照する。表示の開閉では状態変更またはRNG消費を行わない。

## 21. v1.5.2 情報設計改訂

メイン領域はホーム、選手、キャリアの3領域とする。選手は能力・コンディション／特性、キャリアは通算成績／実績／契約・収入／年度別を所有する。`#log`、`#act-toggle`、`#act`はホームに一つずつ保持し、固定ヘッダー情報を各タブへ重複表示しない。UI状態は`{activeMainView:'home',activePlayerTab:'ability',activeCareerTab:'stats'}`とし、状態`S`およびURLへ保存しない。

階級別通算表示のため`S.statsByLevel`を追加し、年度成績確定時の同一成績を既存`S.stats`と階級別集計へ加算する。成績再生成、RNG呼出し、v1.5.1のリーグ分類およびリハビリ表示判定は変更しない。

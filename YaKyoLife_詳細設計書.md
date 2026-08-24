# YaKyoLife 詳細設計書（台湾華語版／日本語版）

## 1. 文書情報

|項目|内容|
|---|---|
|対象システム|YaKyoLife - 棒球人生模擬器／野球人生シミュレーター|
|原本|`C:/Users/rtsai/Downloads/index.html`（台湾華語、v1.3.7）|
|日本語版|`C:\Users\rtsai\OneDrive\文档\ChatGPT\野球人生\index.html`|
|文書種別|実装準拠・詳細設計書|
|対象範囲|画面、状態、乱数、能力、イベント、恋愛、故障、シーズン、契約、移籍、国際大会、受賞、引退、共有画像、全表示文言|
|生成基準|原本を正とし、日本語版は同一ロジックの翻訳実装として対照|

> 本書中の「原文」は台湾華語版の実装文字列、「日本語」は翻訳済みHTMLの文字列を示す。コメントのみの文言は実行時に表示されないため対訳表の対象外だが、ロジック説明には反映する。日本語版で自然さや実装上の問題がある訳も、監査可能性を優先して現状どおり記録する。

## 2. システム概要

単一HTMLで完結する、台湾出身野球選手の人生・キャリアシミュレーターである。外部バックエンドや保存APIを持たず、状態はブラウザメモリ上のグローバル変数 `S` に保持される。同じシード値と同じ選択を用いると同一結果になる決定論的乱数を採用する。

### 2.1 実行構成

- HTML: 開始画面、スコアボード、ログ、操作領域。
- CSS: モバイル優先、最大幅560px、ダークグリーンのスコアボード調UI。
- JavaScript: 状態管理、乱数、全シミュレーション、DOM生成、Canvas共有画像生成。
- 外部依存: Google Fontsのみ。ゲーム計算は完全クライアントサイド。
- 永続化: なし。再現用のシードはURLクエリ `?seed=...` に保存。

## 3. 画面・DOM設計

|ID／クラス|役割|主な更新元|
|---|---|---|
|`#start`|選手名、守備位置、世界シードを入力する開始画面|初期IIFE、`btn-start.onclick`|
|`#board`|氏名、球団、年齢、年、総合値、総年俸、年次フェーズ|`board(phase)`|
|`#log`|年度別カード、成績、イベント、最終評価|`card`, `divider`|
|`#act`|選択肢、能力配分、ダイス操作|`choose`, `allocUI`|
|`#act-toggle`|操作領域の折りたたみ|初期IIFE、`actToggleSync`|
|`.yr-block`|1年分のログブロック|`divider`。2年前を自動折りたたみ、最大60年|
|Canvas|引退時のPNG画像|`shareImage`|

## 4. 主要処理フロー

### 4.1 ゲーム開始

1. URLの `seed` を取得。なければランダムな8文字前後のシードを生成。
2. 選手名と大分類ポジション（P/C/IF/OF）を選択。
3. `seedInit` で乱数状態を初期化。
4. `newState` が16歳・2026年・高校1年の状態を生成。
5. 所属高校を6校から抽選し、強豪／中堅／弱小の内部ランクを付与。
6. `startYear` から年度サイクルへ進む。

### 4.2 年度サイクル

`startYear` は `stepQ=[phasePre, phaseMid, phaseEnd]` を設定し、次の順序で実行する。

1. `phasePre`（季初）: 年齢による衰え、努力量、能力配分、守備位置・投手役割見直し、契約前処理。
2. `phaseMid`（シーズン中）: 通常イベントカードと恋愛イベント。
3. `phaseEnd`（季末）: シーズン生成、故障、受賞、国際大会、昇降格、契約、進路。
4. `advance`: 年齢・年・在籍年を進め、引退条件に達していなければ翌年へ。

### 4.3 キャリア段階

|stage|意味|主要遷移|
|---|---|---|
|`HS`|高校|3年終了後にドラフト／大学／社会人等を選択|
|`U`|大学|4年終了後にドラフトまたは別進路|
|`IND`|社会人・独立等|ドラフト再挑戦または引退|
|`PRO`|プロ|CPBL、NPB、MiLB/MLBの階層内を昇降格・移籍|

## 5. 乱数・再現性

- `seedInit(str)`: 文字列を32bit内部状態 `_s` に混合。
- `R()`: Mulberry32系の計算で `0 <= R < 1` を返す。
- `ri(a,b)`: a以上b以下の整数。
- `pick(a)`: 配列から一様抽選。
- `chance(p)`: p%で真。
- `N0(sd)`: 4個の一様乱数を合成した近似正規乱数。
- 再現条件: シード、選択順、クリック分岐がすべて同じであること。

## 6. 能力・ポジション設計

### 6.1 能力キー

|キー|原文|日本語上の意味|対象|
|---|---|---|---|
|sta|體力|体力|全員|
|vel|球速|球速|投手|
|ctl|控球|制球|投手|
|brk|變化球|変化球|投手|
|con|Contact|コンタクト|野手|
|pow|力量|パワー|野手|
|spd|速度|走力|野手|
|eye|選球|選球眼|野手中心|
|rng|守備範圍|守備範囲|野手|
|fld|接球|捕球|野手|
|arm|臂力|肩力|野手|
|cat|配球|リード|捕手|

### 6.2 初期値と潜在能力

- 初期能力は各対象能力について20～32。
- 投手は球速+0～6、変化球+0～4。野手はコンタクト+0～6、パワー+0～4。
- 投手潜在値: 1位70～80、2位58～68、3位50～60、4位44～54。
- 野手潜在値: 1位72～80、2位64～74、3位56～68、残り46～62。
- `addAb` は潜在能力上限を超えない。現在値が高いほど1点上昇に必要なポイントが増える。

### 6.3 守備位置評価

|位置|守備点計算|
|---|---|
|SS|rng×0.50 + fld×0.30 + arm×0.20|
|2B|rng×0.45 + fld×0.40 + arm×0.15|
|3B|arm×0.45 + fld×0.35 + rng×0.20|
|CF|rng×0.55 + fld×0.30 + arm×0.15|
|RF|arm×0.45 + rng×0.35 + fld×0.20|
|LF|rng×0.40 + fld×0.35 + arm×0.25|
|C|fld×0.40 + cat×0.40 + arm×0.20|
|1B|fld×0.60 + rng×0.20 + arm×0.20|

守備可否はリーグ別閾値 `DP_TH` と年齢補正で判定する。24歳未満は閾値-3、24～25歳は-1.5。守備位置別年俸係数はSS/CF=1.15、C=1.12、2B/3B/RF=1.05、1B/LF=1.00、DH=0.92。

### 6.4 投手役割

- 体力52以上を先発候補とする。
- 先発・中継ぎ・抑えの役割別に試合数、投球回、勝敗、セーブ、ホールド生成が変化。
- ブルペンから先発への転向は選択、先発からブルペンはチーム判断を含む。

## 7. リーグ階層

|lv|原文|平均 par|最低 min|試合数 g|組織|
|---|---|---:|---:|---:|---|
|CPBL2|中職二軍|34|30|80|CPBL|
|CPBL1|中職一軍|44|41|120|CPBL|
|NPB2|日職二軍|47|44|100|NPB|
|NPB1|日職一軍|53|50|143|NPB|
|R|新人聯盟|41|39|55|MiLB|
|A1|1A|45|43|110|MiLB|
|A2|2A|49|47|120|MiLB|
|A3|3A|54|52|130|MiLB|
|MLB|大聯盟|59|56|162|MiLB|

階層経路はCPBL2→CPBL1、NPB2→NPB1、R→A1→A2→A3→MLB。総合値、成績、年齢、契約、球団判断により昇格、残留、降格、戦力外が決まる。

## 8. シーズン成績ロジック

### 8.1 共通

- `simSeason(lv)` がリーグ平均 `par` と選手能力差、近似正規乱数、故障係数を用いて成績を生成。
- `seasonFactor` は出場可能割合。故障、国際大会疲労等で低下。
- 10%で不調年（産出・率を概ね×0.65）、健康なら次の10%でキャリア年（概ね×1.20）。試合数自体は別計算。
- `accStat` でCPBL/NPB/MLB/MINORの生涯バケットへ累積。
- 野手はG, PA, AB, H, HR, RBI, SB, BB, DEF。投手はG, IP, W, L, SV, HLD, SO, BB, H, ER等。

### 8.2 野手

コンタクト、パワー、選球眼、走力、守備能力をリーグ平均との差に変換し、打率・出塁・長打・本塁打・盗塁・守備貢献を生成する。守備位置係数 `dpMult` は年俸・価値評価に反映される。

### 8.3 投手

球速、制球、変化球、体力と役割を基礎に、登板、投球回、三振、四球、被安打、自責点、勝敗、SV/HLDを生成する。先発か救援かで登板形態を変える。

## 9. 故障・TJロジック

- `injuryProb`: 基礎故障率15を起点に、年齢、体力、ガラス／鉄人特性、前季疲労等を補正。
- `rollInjury`: 故障有無と大小を抽選し、`seasonFactor`、`injNext`、`bigInj` を更新。
- 大故障は能力低下 `injStatLoss` とリハビリを伴う。
- 投手は毎季 `tjAccrue` で球速・変化球・投法に応じTJゲージを加算。
- 通常上限50、ゴムの腕特性は100。上限到達時に能力-5後、手術・賭けの分岐。
- TJ累計2回で球速と変化球を半減する重大ペナルティ。

## 10. 通常イベントカード

通常イベントは適用対象（投手、野手、全員、プロ限定）でフィルターし、原則成功50%、天才特性70%。成功・失敗で能力、故障リスク、ランダム能力を増減する。

|原文イベント|対象|成功効果|失敗効果|
|---|---|---|---|
|打擊機特訓|野手|con +2|con -2|
|重量訓練週期|全員|pow +2, sta +1|sta -2|
|牛棚加練|投手|brk +2|ctl -2|
|長傳接訓練|野手|arm +2|arm -2|
|影像分析課|全員|eye +2, cat +2, ctl +1|eye -2, ctl -1|
|跑壘特訓|野手|spd +2|spd -1, 故障+5|
|守備千球練習|野手|rng +1, fld +2|fld -2|
|觸身球驚魂|全員|spd +1|故障+12|
|媒體專訪|全員|sta +1|con/ctl/sta -1|
|教練團關注|全員|ランダム +2|ランダム -2|
|伙食與睡眠計畫|全員|sta +2|sta -1, 故障+4|
|學長／老將指點|全員|ランダム +2|ランダム -2|
|球速測定日|投手|vel +2|故障+10|
|配球讀書會|投手|ctl +2|brk -2|
|宵夜文化|全員|sta +1|spd -2, sta/rng -1|
|場外代言邀約|プロ|sta +1|ランダム -2, sta -1|
|季中低潮|全員|eye/ctl/sta +1|con -2, brk/sta -1|

## 11. 恋愛・家族ロジック

状態 `S.love.st` はsingle/dating/married等を取り、相手、子供数、発覚回数、不倫回数、元交際相手、交際年数を保持する。`loveEvent` が状態別に出会い、交際、プロポーズ、結婚、子供、不倫を分岐。`loveCaught`、`loveCaughtDating` は発覚後の継続・破局・離婚を処理し、`divorceRec` が履歴を保存する。恋愛結果は能力加点、特性「渣男」「閨中密友」等、引退文面へ影響する。

## 12. 特性システム

`S.traits` は天才、ガラス、鉄人、自律、国際大会の鬼、フランチャイズ、クラッチ、復活、ワンツール、ゴムの腕、歴史級等の真偽値を保持する。`checkTraitsMid` と各イベント内条件で解放し、`traitCard` で通知。相反・克服時は `removeTrait` で無効化し、`removed` に残して引退画像で取り消し線表示する。

## 13. 契約・移籍・FA

- `salaryFor`: リーグ、成績、守備位置、役割、年齢、特性を基礎に年俸を算定。
- `movement`: シーズン後の昇降格、残留、契約状態を統括。
- `demotionAudit`: 降格判断。拒否すると関係悪化・戦力外リスク。
- `tradeCheck` / `doTradeExec`: トレード熱、在籍状況、拒否権等で移籍。
- `extensionOffer`: 延長契約。
- `faFlow` / `faMarket`: FA資格後の市場、複数球団提示、台湾復帰。
- `termParams` / `termChoice`: 長期契約資格、短期／長期選択。
- `buyoutRemaining`: 自己都合の途中終了は残額70%、球団都合は100%支給。
- `crossOffers`: 台湾、日本、米国間の海外挑戦。`ageGateUSA` と `ageGateJP` が年齢窓を制御。

## 14. ドラフト・進路

`runDraft` が能力と実績から指名順位・契約を決定。3巡目以降など不満な指名では、年齢条件内ならアマチュアに戻って再挑戦可能。高校卒業は `pathChoiceHS`、大学4年終了は `pathChoiceU4` が分岐を提示する。

## 15. 国際大会

`maybeIntl` が年、年齢、所属、レベル、ロック状態により大会出場を判定。MLB選手は原則WBCのみでプレミア12を除外。大会ごとに約6～8試合の個人成績を生成し、`intlStat` に累積する。出場回数、好成績はTeam Taiwan／国際大会の鬼等の特性と引退評価に影響し、消耗は翌季故障率を上げる。

## 16. 表彰・評価・引退

- `awards`: シーズン成績からMVP、投手賞、各部門賞、オールスター等を判定。
- `careerScore`: リーグ別生涯成績をスコア化。
- `honorScore`: 受賞歴を加点。
- `tierOf`: CPBL/NPB/MLB別閾値 `TIER_TH` で歴史級から失敗層まで評価。
- `primaryPos`: 生涯守備年数の過半位置、またはユーティリティ／スイングマンを決定。
- `capTeam`: 最長所属球団を殿堂帽子に採用。
- `retireScene`: 成績、特性、家族、球団歴からファンコメントを合成。
- `endGame`: 最終評価、通算成績、国際大会、受賞、年表、総年俸、共有操作を生成。

## 17. 共有画像

`shareImage` は幅920px・2倍スケールのCanvasを生成する。ヘッダー、特性タグ、リーグ別通算成績、国際大会、受賞、アマ／プロ年表、総年俸、シードを描画しPNG化。Web Share API対応環境では共有、未対応ではダウンロードへフォールバックする。

## 18. 状態変数辞書

|フィールド|型／例|用途|
|---|---|---|
|name, pos, role|string|選手名、大分類位置、投手役割|
|age, year, stageYr|number|年齢、西暦、段階内年数|
|stage|string|HS/U/IND/PRO|
|ab, pot|object|現在能力、潜在能力上限|
|team, league, org, orgTeam|string/null|所属表示、レベル、組織、親球団|
|teamTally|object|トップリーグ別・球団別在籍年数|
|traits|object<boolean>|現存特性|
|removed|array|解除済み特性ラベル|
|six|number|22歳までのダイス6累計。5回で隠し素質覚醒条件|
|bigInj, ironStreak|number|大故障回数、無故障連続|
|injNext, tmpInj, rehab|number|翌季故障補正、一時故障、リハビリ|
|salary|number|生涯総年俸（台湾ドル基準表示）|
|pool|number|能力配分ポイント|
|seasonFactor|number|当季出場・産出係数|
|stats|object|CPBL/NPB/MLB/MINOR通算|
|honors|array|string形式の受賞履歴|
|intlCount, intlLock|number/null|国際大会回数、同大会重複防止|
|intlStat, intlBest|object|国際通算、最高実績|
|dpos, dposYears|位置／object|詳細守備位置、生涯守備年数|
|roleYears|object|投手役割別年数|
|tradeRefuse, tradeHeat|number|トレード拒否・発生度|
|svc, svcOrg, faElig|number/string/bool|サービスタイム、対象組織、FA資格|
|tj, tjCount, tjSuccess|number|TJゲージ、回数、成功数|
|effort|string|努力方針|
|love|object|恋愛・結婚・子供・不倫・元交際相手|
|log|array|年度成績ログ|
|ct|object/null|契約状態|
|done|boolean|ゲーム終了フラグ|

## 19. 全関数ロジック索引

各行の条件は関数内の `if / else if / while / case` を実装順に抽出したもの。状態参照は `S.*`、呼出先は本ファイル内関数のみを列挙する。

|関数|原本行|主な状態参照|内部呼出先|分岐条件／case|
|---|---:|---|---|---|
|`seedInit`|185-185|—|—|—|
|`R`|186-186|—|—|—|
|`scrollBottom`|191-194|—|—|—|
|`dpScore`|207-219|S.ab|—|case 'SS' / case '2B' / case '3B' / case 'CF' / case 'RF' / case 'LF' / case 'C' / case '1B'|
|`dpBar`|232-236|S.lv, S.age|—|—|
|`dpQual`|237-243|S.lv, S.age|dpScore|p==='DH' / !DP_TH[p]\|\|!DP_TH[p][S.lv]|
|`dpList`|245-251|S.pos|—|—|
|`dpMult`|252-252|S.pos, S.dpos|—|—|
|`dposReview`|253-309|S.stage, S.lv, S.pos, S.dpos, S.ab, S.role|dpBar, dpQual, card, choose, pitcherRole, roleN, dpList|S.stage!=='PRO'\|\|!(S.lv==='CPBL1'\|\|S.lv==='NPB1'\|\|S.lv==='MLB' / S.pos==='C' / !S.dpos / S.dpos==='C' / cOk( / dpQual('1B' / cOk( / S.dpos==='1B'&&!dpQual('1B' / S.pos==='P' / (old==='MR'\|\|old==='CL' / old&&old!==nr / !old / !S.dpos / dpQual(S.dpos / DP_RANK[best]<DP_RANK[S.dpos]|
|`newState`|387-414|—|R|pos==='P' / pos==='P'|
|`blankStat`|415-415|—|—|—|
|`bucketOf`|416-416|—|—|—|
|`traitCard`|417-418|S.traits|card, board|—|
|`removeTrait`|419-420|S.traits, S.removed|—|S.traits[key] / !S.removed.includes(label|
|`careerAllStars`|422-422|S.stats|—|S.stats[b]|
|`toolGap`|423-433|S.ab, S.pos|—|—|
|`tjAccrue`|434-439|S.pos, S.seasonFactor, S.effort, S.ab, S.tjCount, S.tj|—|S.pos!=='P'\|\|S.seasonFactor<=0|
|`tjCap`|440-440|S.traits|—|—|
|`tjGamble`|441-459|S.pos, S.tj, S.traits, S.tjCount, S.rehab|tjCap, addAb, board, card, choose, tjTwoStrike, afterGamble, tjBigInjury|S.pos!=='P'\|\|S.tj<tjCap( / S.tjCount>=2 / chance(succP|
|`tjTwoStrike`|460-464|S.ab|card|—|
|`tjBigInjury`|465-487|S.tjCount, S.rehab, S.tj, S.ab, S.pot|card, board, afterGamble, tjTwoStrike|chance(5 / S.tjCount>=2|
|`afterGamble`|488-497|S.tjSuccess, S.traits|card, board, removeTrait|kind==='inject' / S.tjSuccess>=2&&!S.traits.rubber / kind==='surgery' / S.traits.rubber|
|`pitcherRole`|498-505|S.ab, S.prevD, S.lastD, S.role|—|S.ab.sta>=52 / S.role==='CL'|
|`fmtIP`|506-512|—|—|ip==null / outs>=3|
|`roleN`|513-513|—|—|—|
|`isSP`|514-514|S.role|—|—|
|`ovr`|515-529|S.ab, S.pos, S.dpos, S.traits|dpScore|S.pos==='P' / S.traits.yips|
|`playerType`|530-547|S.ab, S.traits, S.toolRole, S.pos|—|S.traits.onetool&&S.toolRole / S.pos==='P' / m<52 / a.sta>=m&&a.sta>=62 / m===a.vel / m===a.brk / S.pos==='C' / a.cat>=58&&rest<=a.cat-8 / cand[0][1]<52 / cand[0][1]-cand[1][1]<=3&&cand[0][1]>=60|
|`abCost`|548-552|S.ab, S.pot, S.pos|—|cur>=pk|
|`addAb`|553-567|S.ab, S.lastOverflow, S.carry, S.pot, S.pos|—|!(k in S.ab / v<0 / !S.carry / bud>0&&cur<80 / cur>=pk / bud>=cost / cur>=80|
|`injuryProb`|568-578|S.injNext, S.age, S.traits, S.tmpInj|—|S.age>=35 / S.age>=32 / S.traits.academy&&S.age<25 / S.traits.iron&&S.traits.glass / S.traits.iron / S.traits.glass|
|`simSeason`|580-660|S.pos, S.role, S.ab, S.seasonFactor, S.dpos|pitcherRole, isSP, R, defRuns, applySeasonForm|S.pos==='P'&&!S.role / f<=0 / S.pos==='P' / isSP( / isSP( / S.role==='CL' / !isSP( / (st.W+st.L / a.sta>=55 / a.sta>=50 / a.sta>=45 / a.sta>=40 / a.sta>=35 / d>=10 && staF<0.75 && S.dpos!=='DH' && S.dpos!=='C'|
|`applySeasonForm`|662-696|S.seasonFactor, S.pos|R, isSP|S.seasonFactor<=0 / roll<0.10 / canCareer && roll<0.20 / m===1 / S.pos==='P' / st.L!=null / st.SV / st.HLD / !isSP( / (st.W+st.L / st.H>st.AB|
|`defRuns`|698-708|S.pos, S.ab, S.dpos, S.seasonFactor|—|S.pos==='P' / dp==='DH'|
|`accStat`|709-719|S.stats, S.orgTeam, S.teamTally, S.pos, S.dpos, S.dposYears, S.role, S.roleYears|blankStat|!S.stats[bucket] / bucket!=='MINOR'&&S.orgTeam / S.pos!=='P' / S.role|
|`statLine`|720-728|S.pos, S.role|roleN, fmtIP, slgOf|S.pos==='P'|
|`slgOf`|730-738|—|—|!st.AB|
|`salaryFor`|740-748|—|—|case 'CPBL2' / case 'NPB2' / case 'R' / case 'A1' / case 'A2' / case 'A3' / case 'CPBL1' / case 'NPB1' / case 'MLB'|
|`logTarget`|754-754|—|—|—|
|`card`|755-757|—|logTarget, scrollBottom|—|
|`divider`|758-758|—|—|prev / h && prev.querySelector('.yr-body' / prevPrev / newBlocks.length>MAX_YEARS|
|`board`|759-781|S.name, S.dpos, S.pos, S.role, S.traits, S.stage, S.team, S.stageYr, S.teamName, S.orgTeam, S.age, S.year, S.salary|roleN, playerType, ovr|S.stage==='HS' / S.stage==='U' / S.stage==='AMA' / S.pos==='P' / el|
|`actClear`|782-783|—|—|t|
|`actToggleSync`|784-789|—|—|!t|
|`choose`|790-799|—|actClear, actToggleSync, scrollBottom|title|
|`allocUI`|801-835|S.pos, S.ab, S.pot, S.carry|actClear, abCost, addAb, board, allocDone, actToggleSync|dice / !cap&&remaining( / dice / hist.length / S.carry / dice / remaining(|
|`nextStep`|837-837|S.done|—|S.done / f|
|`stageLabel`|838-843|S.stage, S.stageYr, S.lv|—|S.stage==='HS' / S.stage==='U' / S.stage==='AMA'|
|`startYear`|844-844|S.year, S.age|divider, stageLabel, nextStep|—|
|`phasePre`|846-945|S.tmpInj, S.seasonFactor, S.skipMid, S.prevD, S.lastD, S.age, S.year, S.traits, S.pos, S.ab, S.rehab, S.log, S.stage, S.teamName, S.team, S.six, S.comboKey, S.samePickKey, S.lastOverflow, S.pendStat, S.pot, S.tj, S.effort, S.stageYr, S.svc, S.faElig, S.org|board, buyoutRemaining, endGame, card, stageLabel, R, addAb, choose, dposReview, allocUI, nextStep, tjCap, ovr, runDraft, pickOfferUI, makeOffers, signTo, advance, daibaFarewell|S.age>=48 / declAge>=32 / S.rehab>0 / S.traits.distract&&!S.skipMid / S.traits.academy&&!S.skipMid&&chance(35 / v===6&&S.age<22&&!S.traits.genius / newSix&&!S.traits.genius / S.traits.combo && !S.skipMid && (S.comboKey\|\|S.samePickKey / overflow > 0 / gained > 0 / overflow > 0 / gained===0 && overflow===0 / S.six>=5&&!S.traits.genius&&S.age<22 / S.pos==='P'&&S.stage==='PRO'&&!S.skipMid / S.stage==='U'&&S.stageYr>=2 / o>=reqNPB / o>=reqMiLB / S.stage==='PRO'&&S.age>=36&&S.rehab===0 / S.org!=='CPBL'&&ovr(|
|`phaseMid`|947-957|S.skipMid, S.ironStreak, S.stage|board, nextStep, loveEvent, drawEvents, choose, rollInjury, proSeason, amateurSeason|S.skipMid / S.stage==='PRO'|
|`evOdds`|958-963|S.traits|—|S.traits.thief|
|`drawEvents`|964-976|S.pos, S.stage, S.traits|choose, evOdds, board, resolveEvent|n<=0|
|`datePool`|981-984|—|—|CHEER_SAFE.length>=CHEER.length|
|`affairPool`|985-985|—|—|—|
|`loveEvent`|986-1065|S.love, S.stage, S.age, S.year, S.pos, S.traits|addAb, board, card, proposalAsk, R, affairPool, choose, loveGainTxt, loveCaughtDating, datePool, loveCaught|S.stage!=='PRO'\|\|S.age<20 / L.st==='dating' / bkP>0&&chance(bkP / chance(30 / r<40 / chance(55 / r<70 / !chance(fire / L.st==='single'\|\|L.st==='divorced' / chance(65 / L.datedTimes>=3&&L.kids===0&&!S.traits.married&&!S.traits.confidante / L.kids<4&&chance([65,45,30,20][L.kids] / r<40 / chance(55 / r<70&&L.kids>0|
|`divorceRec`|1066-1068|S.love|—|—|
|`loveCaught`|1069-1089|S.love, S.pos, S.traits, S.ab|addAb, card, board, choose, divorceRec|L.caught>=2 / !S.traits.scum / chance(40|
|`proposalAsk`|1090-1099|S.love, S.tmpInj|choose, loveGainTxt, board, card|L.st!=='dating'|
|`loveCaughtDating`|1100-1121|S.love, S.year, S.pos, S.traits, S.ab|addAb, card, board, choose|L.caught>=2 / !S.traits.scum / chance(40|
|`loveGainTxt`|1122-1130|S.pendStat|addAbStat|g>0&&over>0 / g>0 / over>0|
|`addAbStat`|1131-1150|S.pot, S.pos, S.ab, S.carry, S.pendStat|addAb|amt<=0 / cur>=pk / bud>0 && cur<pk / cr>=c / !S.carry / bud>0|
|`statBonus`|1151-1154|S.pendStat|—|—|
|`resolveEvent`|1155-1203|S.cntSave, S.cntBoldWin, S.cntBoldFail, S.cntSaveWin, S.cntSnack, S.traits, S.pot, S.pos, S.ab, S.carry, S.tmpInj|evOdds, statBonus, addAb, card, checkTraitsMid|mode==='safe' / mode==='safe' / mode==='bold' / good / mode==='safe'&&good / (ev.n==='宵夜文化'\|\|ev.n==='場外代言邀約' / mode==='bold'&&S.traits.clutch / dir>0 / cur>=pk / bud>0 && cur<pk / cr>=c / !S.carry / gained>0 / bud<=0 / bud>0 / k==='inj' / mode==='bold'&&S.traits.clutch / k==='rand' / k in S.ab / !touched|
|`allocDone`|1205-1230|S.stage, S.samePickKey, S.samePick, S.traits, S.samePickBonus, S.comboKey, S.age, S.pos, S.ab, S.pot|traitCard, ovr, R, card, board|isDice&&S.stage!=='HS'&&keys.length / touched[k]>touched[mk] / focused&&focused===S.samePickKey / focused / S.samePick>=3&&!S.traits.combo / !S.traits.late&&!S.traits.genius&&ovr(|
|`checkTraitsMid`|1231-1244|S.traits, S.age, S.cntSaveWin, S.love, S.cntSnack, S.cntBoldWin, S.cntBoldFail|traitCard|!S.traits.disc&&S.age<25&&(S.cntSaveWin\|\|0 / !S.traits.clutch&&S.age<25&&S.cntBoldWin>=7 / !S.traits.distract&&!S.traits.disc&&(S.love.affairs+S.love.caught+S.cntSnack / !S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace&&(S.cntBoldFail>=10\|\|S.traits.scum|
|`teamNick`|1245-1252|—|—|—|
|`teamChampRate`|1253-1257|—|—|—|
|`faYears`|1258-1267|S.bigInj, S.tjCount, S.age|—|S.age>=36 / S.age>=34 / S.age>=32 / S.age>=30|
|`demotionAudit`|1268-1283|S.demotionRefused, S.ct, S.lastD, S.traits|removeTrait, card, board|!S.demotionRefused / (S.lastD\|\|0 / S.traits.cancer / !S.traits.thief|
|`tradeCheck`|1284-1317|S.stage, S.lv, S.seasonFactor, S.tradeHeat, S.traits, S.tradeRefuse, S.complainCount|ovr, card, board, doTradeExec, choose|S.stage!=='PRO'\|\|!LV[S.lv].top\|\|S.seasonFactor<=0 / S.traits.cancer / S.traits.ambience / !chance(p / S.traits.franchise\|\|S.traits.mrteam / star / S.traits.cancer / S.complainCount>=2&&!S.traits.ambience / chance(60 / chance(35|
|`doTradeExec`|1318-1323|S.teamYears, S.champThisTeam, S.champTeam, S.org, S.orgTeam|board|—|
|`portionOf`|1324-1330|—|—|—|
|`rollInjury`|1331-1351|S.injNext, S.seasonFactor, S.ironStreak, S.bigInj, S.rehab, S.traits, S.age|injuryProb, card, injStatLoss|!chance(p / chance(64 / chance(20 / S.bigInj>=2&&!S.traits.glass&&S.age<32 / S.bigInj>=2&&!S.traits.glass&&S.age>=32|
|`injStatLoss`|1352-1363|S.pos, S.ab|board|big / !chance(40 / !(k in S.ab|
|`amateurSeason`|1364-1383|S.seasonFactor, S.log, S.year, S.age, S.team, S.stage, S.hsTier, S.traits, S.honors, S.pool|card, stageLabel, nextStep, ovr, maybeIntl|S.seasonFactor===0 / S.stage==='U'&&rk==='冠軍'&&!S.traits.academy / i===0|
|`proSeason`|1384-1489|S.lv, S.lastSt, S.lastD, S.org, S.pos, S.pendStat, S.seasonFactor, S.effort, S.traits, S.tradeFrom, S.teamName, S.dpos, S.log, S.year, S.age, S.ironStreak, S.removed, S.toolRole|simSeason, isSP, bucketOf, accStat, card, R, portionOf, statLine, toolGap, careerAllStars, traitCard, removeTrait, board, awards, tjAccrue, tjGamble, demotionAudit, tradeCheck, maybeIntl, nextStep|S.pos==='P' / (st.W + st.L / S.pendStat>0&&S.seasonFactor>0 / S.pos==='P' / !isSP( / isSP( / !isSP( / (st.W+st.L / S.pos==='P'&&S.seasonFactor>0 / em!==0 / S.traits.onetool&&S.seasonFactor>0 / typeof st[k]==='number' / typeof st[k]==='number' / S.seasonFactor===0 / S.tradeFrom / st.form===-1 / st.form===1 / S.pos==='P' / healthy / S.ironStreak>=5&&!S.traits.iron / S.seasonFactor<0.95 / S.pos!=='P' / !S.traits.onetool && !isRegular && tg.gap>=22 && tg.val>=58 && careerAllStars( / wasBefore\|\|S.age>=33 / S.traits.onetool && (tg.gap<18 \|\| (S.seasonFactor>0 && st.G>=LV[S.lv].g*0.60 / S.pos==='P'&&S.seasonFactor>0|
|`awards`|1490-1604|S.lv, S.seasonFactor, S.year, S.honors, S.orgTeam, S.stats, S.pos, S.role, S.dpos, S.traits, S.pool|isSP, card, removeTrait|!LV[S.lv].top\|\|S.seasonFactor===0 / bucket==='CPBL'&&S.orgTeam==='台中猛瑪' / chance(asP / S.stats[bucket].yr===1&&rookieOK&&st.d>=4 / chance(rkP / S.pos==='P' / isSP( / chance(p / S.role==='CL' && st.SV >= th.sv[0] / chance(p / S.role==='MR' && (st.HLD\|\|0 / chance(p / st.SO >= th.so[0] / chance(p / st.PA >= 350 && st.avg >= th.avg[0] / chance(p / st.PA >= 300 && st.HR >= th.hr[0] / chance(p / st.PA >= 300 && st.SB >= 25 / chance(p / st.PA >= 300 && st.RBI >= th.rbi[0] / chance(p / st.PA >= 350 && obp >= th.obp[0] / chance(p / S.dpos !== 'DH' && S.seasonFactor >= 0.7 / def1 >= 6 / chance(pGlove / def1 >= 11 / chance(pDef / st.d >= 6 && mvpQual && S.seasonFactor >= 0.9 / chance(pMVP / added.length / S.traits.yips / S.traits.glass&&!S.traits.phoenix / big|
|`maybeIntl`|1605-1655|S.year, S.lv, S.stage, S.seasonFactor, S.rehab, S.skipMid, S.intlLock, S.traits, S.pool, S.injNext, S.intlCount, S.ab, S.intlStat, S.pos, S.intlTop4, S.honors|ovr, card, R, board, isSP, choose|S.lv==='MLB' / S.stage!=='PRO'\|\|(!wbc&&!p12 / S.intlLock===null / S.year-S.intlLock<5 / forced / S.traits.intlace / !S.traits.taiwan&&S.intlCount>5 / S.pos==='P' / i<=2&&chance(45 / !isSP( / i<=1 / !S.traits.intlace&&S.intlCount>=3&&(S.intlTop4\|\|0 / i<=2 / (i===0&&chance(30*mp / !forced|
|`phaseEnd`|1657-1679|S.stage, S.lv, S.lastD, S.ct, S.seasonFactor, S.salary, S.traits, S.tradeRefuse, S.honors, S.year, S.wonChamp, S.champThisTeam, S.champTeam, S.orgTeam, S.tradeHeat, S.pool|board, salaryFor, dpMult, card, movement, choose, allocUI|S.stage==='PRO' / S.seasonFactor===0 / LV[S.lv].top&&S.seasonFactor>0 / S.traits.clutch / S.tradeRefuse>0 / chance(pcc / S.tradeRefuse>0 / S.tradeHeat>0 / S.pool>0|
|`movement`|1681-1773|S.stage, S.stageYr, S.age, S.year, S.skipMid, S.org, S.npbYears, S.lv, S.svcOrg, S.faElig, S.svc, S.teamYears, S.traits, S.orgTeam, S.teamTally, S.champThisTeam, S.champTeam, S.lastD, S.mrTeamName, S.rainbowLg, S.seasonFactor, S.honors, S.lastSt, S.pos, S.ct|ovr, advance, pathChoiceHS, pathChoiceU4, endGame, choose, runDraft, buyoutRemaining, card, board, teamNick, slgOf, handleDemotion, removeTrait, extensionOffer, faFlow, crossOffers|S.stage==='HS' / S.stageYr<3 / S.stage==='U' / S.stageYr<4 / S.stage==='AMA' / S.age>=26 / S.skipMid / o<30 / S.org==='NPB' / LV[S.lv].top / S.svcOrg && S.svcOrg!==S.org / S.svc>=5 / S.stage==='PRO'&&LV[S.lv].top / !S.traits.goldcloth&&S.orgTeam==='台中猛瑪'&&(S.teamTally.CPBL&&S.teamTally.CPBL['台中猛瑪']>=10 / !S.traits.franchise&&S.teamYears>=7&&S.champThisTeam&&S.champTeam===S.orgTeam / !S.traits.mrteam&&S.teamYears>=15&&(S.lastD\|\|0 / !S.traits.rainbow / n>RB[lg][1] / S.org==='NPB'&&S.npbYears>=8 / st&&S.seasonFactor>=0.5 / S.pos==='P' / era<=4.20\|\|whip<=1.35\|\|(st.SV\|\|0 / ops>=0.720\|\|st.HR>=12\|\|st.SB>=15\|\|st.RBI>=(LV[S.lv].g>=150?70:55 / wonAward\|\|goodReal / o<minReq / perf!==null&&perf>=0 / perf!==null&&perf<=-6&&chance(55 / idx<path.length-1 / o>=LV[nx].min&&((S.lastD\|\|0 / idx<path.length-2 / o>=LV[nx2].min+2&&(S.lastD\|\|0 / S.traits.yips / !S.ct / S.ct.yrs===1&&LV[S.lv].top&&!S.ct.extOffered&&S.faElig&&(S.lastD\|\|0 / S.ct.yrs<=0 / LV[S.lv].top / S.faElig|
|`buyoutRemaining`|1774-1787|S.ct, S.lv, S.lastD, S.salary|salaryFor, card|!S.ct\|\|!(S.ct.yrs>1 / remain<=0 / total>0 / rate>=1|
|`daibaFarewell`|1789-1794|S.stage, S.org, S._daiba|card|S.stage==='PRO'&&S.org!=='CPBL'&&!S._daiba|
|`handleDemotion`|1795-1835|S.lv, S.lastD, S.traits, S.seasonFactor, S.org, S.ct, S.demotionRefused, S.year, S.age|traitCard, ageGateJP, buyoutRemaining, signTo, advance, card, choose, board, outOfOrg, daibaFarewell, endGame|(S.lv==='CPBL1'\|\|S.lv==='NPB1'\|\|S.lv==='MLB' / o>=LV[path[i]].min / t>=0 / S.org==='MiLB' / o>=LV.NPB1.min&&chance(Math.round(60*ageGateJP( / o>=LV.NPB2.min&&chance(50 / o>=LV.CPBL1.min / S.org==='NPB'&&o>=LV.CPBL1.min&&chance(70 / alts.length / longContract / !S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace / S.age>=33|
|`outOfOrg`|1836-1846|S.org, S.year, S.age|buyoutRemaining, signTo, daibaFarewell, endGame, card, choose, advance|S.org!=='NPB'&&o>=44 / S.org!=='CPBL' / o>=41 / o>=30 / !offers.length / S.age>=33|
|`teamListOf`|1847-1847|—|—|—|
|`signTo`|1848-1857|S.org, S.lv, S.orgTeam, S.teamYears, S.champThisTeam, S.champTeam, S.ct, S.npbYears, S.teamName|teamListOf, card, board|newTeam !== S.orgTeam / org!=='NPB'|
|`pickOfferUI`|1859-1867|S.salary, S.lv|choose, signTo, card|—|
|`makeOffers`|1868-1873|—|teamListOf, R|—|
|`termParams`|1875-1885|S.pos, S.traits, S.tradeRefuse|faYears|S.traits.franchise / S.tradeRefuse>0|
|`termChoice`|1886-1901|S.lv|termParams, salaryFor, choose|tp.longEligible / onReject|
|`extensionOffer`|1903-1913|S.lastD, S.teamName, S.ct|termChoice, card, board, crossOffers|—|
|`faFlow`|1915-1940|S.lastD, S.pos, S.bigInj, S.tjCount, S.traits, S.tradeRefuse, S.teamName, S.ct, S.org, S.orgTeam|faYears, card, faMarket, termChoice, advance, signTo, choose, teamChampRate|injHist>=2&&stayY<=3 / S.traits.franchise / S.tradeRefuse>0 / S.traits.cancer / !S.traits.franchise&&chance(45 / S.org!=='CPBL'&&o>=LV.CPBL1.min|
|`faMarket`|1941-1981|S.org, S.lv, S.traits, S.pos, S.orgTeam, S.bigInj, S.tjCount, S.npbYears, S.teamName, S.ct, S.year, S.salary|makeOffers, faYears, R, ageGateUSA, card, choose, advance, endGame, salaryFor, termParams, teamChampRate, termChoice, signTo|S.traits.cancer / ((S.bigInj\|\|0 / lv==='CPBL1'&&o>=53 / lv==='NPB1'&&o>=60 / freeAgent \|\| chance(Math.round(50*ageGateUSA(o,60 / !offers.length|
|`ageGateUSA`|1982-1991|S.age|—|age<=22 / age<=24 / age<=26 / age<=27 / age<=28|
|`ageGateJP`|1992-1999|S.age|—|age<=26 / age<=28 / age<=30 / age<=31|
|`crossOffers`|2000-2023|S.lv, S.lastD, S.salary|advance, ageGateJP, makeOffers, choose, signTo, ageGateUSA|S.lv==='CPBL1'&&o>=53&&(S.lastD\|\|0 / S.lv==='CPBL1'&&o>=57&&(S.lastD\|\|0 / S.lv==='NPB1'&&o>=60&&(S.lastD\|\|0|
|`runDraft`|2025-2058|S.age, S.stage, S.team, S.salary, S.svc, S.faElig, S.stageYr|ovr, card, signTo, board, choose, advance|rd===0 / fromSchool / rd>=3 && S.age<24 / fresh / !goUni|
|`pathChoiceHS`|2059-2078|S.stage, S.stageYr, S.team|ovr, card, advance, runDraft, choose, pickOfferUI, makeOffers|r==='fail' / o>=44 / o>=50|
|`pathChoiceU4`|2079-2098|S.stage, S.team, S.age|ovr, runDraft, choose, advance, endGame, pickOfferUI, makeOffers|r==='fail' / o>=reqNPB / o>=reqMiLB|
|`advance`|2104-2106|S.age, S.year, S.stageYr|startYear|—|
|`careerScore`|2110-2113|S.pos|—|S.pos==='P'|
|`roleName3`|2114-2114|—|—|—|
|`primaryPos`|2115-2132|S.pos, S.roleYears, S.role, S.dposYears, S.dpos|roleName3|S.pos==='P' / !tot / es[0][1]>=tot/2 / !total / entries[0][1]>=total/2 / !noDH.length|
|`capTeam`|2133-2137|S.teamTally|—|tb[k]>bn|
|`defShare`|2138-2143|S.stats, S.pos|—|!st\|\|S.pos==='P'|
|`posLegendPhrase`|2144-2153|S.stats, S.dpos, S.pos, S.honors|defShare|S.pos==='P'\|\|!dp\|\|dp==='DH' / share>=0.34\|\|(hasGlove&&share>=0.22 / hasGlove&&share>=0.12|
|`honorScore`|2154-2172|S.honors, S.pos, S.traits|—|h.includes(champ / h.includes(ace / !h.includes(lg / h.includes('年度MVP' / h.includes('新人王' / h.includes('金手套' / h.includes('守備王' / h.includes('王' / h.includes('明星賽' / S.traits.franchise|
|`tierOf`|2173-2182|S.stats|honorScore, careerScore|!st / hs.mvp\|\|hs.aceN / hs.king|
|`statTable`|2183-2203|S.stats, S.pos|fmtIP, slgOf|!st / S.pos==='P'|
|`retireScene`|2211-2266|S.lv, S.stats, S.year, S.pos, S.hofInfo, S.traits, S.legendLeague|bucketOf, card, R, capTeam, posLegendPhrase|tiers[b]&&tiers[b].i<bestI / tiers[b]&&tiers[b].i===bestI / yy>repYr / lg==='CPBL' / i===0 / i===1 / i===2 / lg==='NPB' / i<=1 / i===2 / lg==='MLB' / i<=1 / i===2 / !t / t.i===0 / firstNow / !S.hofInfo / t.i===1 / firstBallot&&!S.traits.legend / hofs.length / S.traits.legend|
|`endGame`|2267-2457|S.done, S.stats, S.traits, S.hsTier, S.pos, S.potSum0, S.age, S.name, S.log, S.intlCount, S.intlStat, S.honors, S.mrTeamName, S.legendLeague, S.rainbowLg, S.removed, S.love, S.bigInj, S.tjCount, S.salary, S.toolRole|actClear, divider, card, statTable, tierOf, retireScene, R, fmtIP, slgOf, teamNick, shareImage, choose|S.stats[b] / b!=='MINOR' / best===99 / reachedTop / !S.traits.smallschool && S.hsTier===3 / !S.traits.grinder && (S.potSum0\|\|999 / S.age<25 / S.log.length / amaLogs.length > 0 / proLogs.length > 0 / isP / S.intlCount>0 / S.pos==='P' / evals.length / S.honors.length / parts.length >= 2 / !awardMap[awd] / !awardMap[h] / yrs[0] !== '' / i<nums.length && nums[i]===ed+1 / ed-st>=2 / ed-st===1 / i<nums.length / yrs.length > 1 / k==='legend'\|\|k==='taiwan' / k==='goldcloth' / k==='mrteam' / k==='genius' / S.traits[k] / S.traits[k] / picks.length<3&&pool.length / LGR[high]>LGR[low] && tiersByLg[low] && tiersByLg[high] && tiersByLg[low].i<=1 && tiersByLg[high].i>=3 / S.traits.glass / S.traits.iron / S.traits.genius&&best<=1 / S.honors.some(h=>h.includes('經典賽冠軍' / S.love.caught / S.traits.scum / S.traits.franchise / S.traits.legend / S.traits.intlace / S.traits.taiwan / S.traits.disc / S.traits.cancer / S.traits.thief / S.traits.mrteam / S.traits.confidante / S.traits.smallschool / S.traits.grinder / S.traits.goldcloth / S.traits.phoenix / S.traits.onetool&&S.toolRole / S.traits.clutch / S.love.st==='married'&&S.love.kids>=2 / navigator.clipboard&&navigator.clipboard.writeText / h.textContent==='生涯終幕'|
|`shareImage`|2459-2731|S.pos, S.legendLeague, S.mrTeamName, S.rainbowLg, S.traits, S.removed, S.stats, S.hofInfo, S.honors, S.log, S.intlCount, S.role, S.name, S.year, S.age, S.tjCount, S.intlStat, S.salary|teamNick, roleN, primaryPos, playerType, fmtIP, slgOf|S.hofInfo&&S.hofInfo.length / !st / isPit / tW>0\|\|tSO>0 / tH>0 / parts.length >= 2 / !aMap[awd] / !aMap[h] / yrs[0] !== '' / i<nums.length && nums[i]===ed+1 / ed-st>=2 / ed-st===1 / i<nums.length / yrs.length > 1 / c.measureText(test / curr / keepTr.length\|\|remTr.length / S.intlCount>0 / amaLogs.length > 0 / proLogs.length > 0 / o.rem / o.key==='legend'\|\|o.key==='taiwan' / o.key==='goldcloth' / o.key==='mrteam' / o.key==='genius' / o.neg / o.rem / tagx>W-160 / keepTr.length\|\|remTr.length / isP / S.intlCount>0 / isP / i === rows2 / amaLogs.length > 0 / c.measureText(t / proLogs.length > 0 / isP / c.measureText(t / navigator.canShare&&navigator.canShare({files:[file]} / e&&e.name==='AbortError'|

## 20. 選択画面・イベント分岐索引

次表は `choose(...)` を含む関数を示す。実際の選択肢ラベル、結果文、変数展開は第21章の全文対訳表に収録する。

|関数|選択画面タイトル（原文テンプレート）|
|---|---|
|`dposReview`|守位會議：教練團已經不敢讓你蹲捕（${LV[S.lv].n}標準）<br>守位會議：牛棚捕手回報你的接捕又行了<br>球團徵詢：你的體力已達先發水準，要轉任先發嗎？<br>守位會議：教練團想把你推上更吃重的位置<br>守位會議：教練團認為你的守備已撐不住 ${DPN[S.dpos]}（${LV[S.lv].n}標準）|
|`tjGamble`|TJ 抉擇：你的手肘撐到極限了|
|`phasePre`|<br>開季投球規劃（手臂狀況：${(function(){const r=S.tj/tjCap();return S.rehab>0?'復健中':r>=0.85?'手肘隱隱作痛':r>=0.6?'手臂略感疲勞':r>=0.35?'狀況尚可':'手感輕盈';})()}）<br>大${['一','二','三','四'][S.stageYr-1]}季前 · 升學與職棒的十字路口<br>又是一年春訓，身體大不如前了|
|`phaseMid`|<br>|
|`drawEvents`|<br>事件｜${ev.n} — 你要怎麼應對？|
|`loveEvent`|聚餐散場，${t} 說順路想搭你的車<br>記者把麥克風遞到你面前：「兩位是在交往嗎？」<br>客場飯店酒吧，${t} 傳來訊息：「睡了嗎？」|
|`loveCaught`|${L.partner} 把離婚協議書放在餐桌上|
|`proposalAsk`|交往第 ${L.dyrs} 年——${L.partner} 看著別人的婚禮影片看了很久|
|`loveCaughtDating`|${L.partner} 已讀不回三天後，終於答應見面|
|`tradeCheck`|交易大限：他隊送來報價，球團徵詢你的否決權<br>交易傳言：媒體報導你可能被交易|
|`maybeIntl`|中華隊徵召 · ${name}|
|`phaseEnd`||
|`movement`|業餘年度結束|
|`handleDemotion`|接受下放，還是換個舞台？<br>球團約談：成績未達當前層級要求，打算將你下放<br>球團約談：成績未達當前層級的最低要求|
|`outOfOrg`|新東家的邀請|
|`faFlow`|合約到期 · 取得自由球員（FA）資格（球隊奪冠率 ${teamChampRate(S.orgTeam)}%）|
|`faMarket`|沒有球隊開價<br>自由市場報價一覽（依國家分列 · 每隊列出 長約 / 短約 方案）|
|`crossOffers`|日職球團開出旅外合約<br>大聯盟球探遞出合約<br>入札制度：大聯盟多隊競標你的合約|
|`runDraft`|中華職棒選秀會 · 第 ${rd} 輪獲 ${team} 指名|
|`pathChoiceHS`|落榜之後<br>高中畢業 · 綜合能力 ${o} · 人生的第一個路口|
|`pathChoiceU4`|落榜之後<br>大學畢業 · 綜合能力 ${o}|
|`endGame`||

## 21. 全表示テキスト対訳表

原本JavaScriptの文字列リテラルを実装順に抽出し、同じ構造位置の日本語版文字列と対応付けた。HTMLタグは表示装飾、`${...}` は実行時変数展開である。

|No.|原本行|台湾華語（原文）|日本語版|変数展開|
|---:|---:|---|---|---|
|1|198|體力|体力|—|
|2|198|球速|ボールスピード|—|
|3|198|控球|ボールをコントロールする|—|
|4|198|變化球|変化球|—|
|5|198|力量|強さ|—|
|6|198|速度|スピード|—|
|7|198|選球|ボールを選ぶ|—|
|8|198|守備範圍|守備範囲|—|
|9|198|接球|ボールをキャッチする|—|
|10|198|臂力|腕の強さ|—|
|11|198|配球|試合球|—|
|12|200|投手|ピッチャー|—|
|13|200|捕手|キャッチャー|—|
|14|200|內野手|内野手|—|
|15|200|外野手|外野手|—|
|16|202|游擊手|遊撃手|—|
|17|202|二壘手|二塁手|—|
|18|202|三壘手|三塁手|—|
|19|202|一壘手|一塁手|—|
|20|203|中外野手|中堅手|—|
|21|203|右外野手|右翼手|—|
|22|203|左外野手|左翼手|—|
|23|203|指定打擊|指定ストライキ|—|
|24|203|捕手|キャッチャー|—|
|25|262|移防 一壘手|シフト一塁手|—|
|26|262|薪資係數 ×1.00|給与係数×1.00|—|
|27|263|守位調整|位置調整|—|
|28|263|捕手裝備收進置物櫃——新球季改守<b class="hl">一壘</b>。|キャッチャーの用具はロッカーにしまう - 新しいシーズンの変更<b class="hl">一塁</b>。|—|
|29|264|轉任 指定打擊|指定されたストライキに転送|—|
|30|264|薪資係數 ×0.92|給与係数×0.92|—|
|31|265|守位調整|位置調整|—|
|32|265|阻殺率成了聯盟笑話，球團決定讓你專心打擊——<b class="hl">DH</b>。|リーグ内ではキルレートが笑いのネタになっており、チームは打撃に集中させようと決めた――。<b class="hl">DH</b>。|—|
|33|266|守位會議：教練團已經不敢讓你蹲捕（${LV[S.lv].n}標準）|ポジションディフェンスミーティング: コーチングスタッフはもうあなたにスクワットをさせません(${LV[S.lv].n}標準）|LV[S.lv].n|
|34|269|守位會議：牛棚捕手回報你的接捕又行了|野手ミーティング: ブルペン捕手が捕球について報告しても大丈夫です|—|
|35|270|重披捕手裝備|再びキャッチャーギア|—|
|36|270|薪資係數 ×1.12|給与係数×1.12|—|
|37|271|守位調整|位置調整|—|
|38|271|面罩戴回來——新球季重新登錄為<b class="hl">捕手</b>。|マスクを再び着用 - 新しいサッカーシーズンに再ログインします<b class="hl">キャッチャー</b>。|—|
|39|272|維持現狀|現状を維持する|—|
|40|274|守位調整|位置調整|—|
|41|274|連一壘都站不住了，新球季登錄為<b class="hl">指定打擊</b>。|一塁にも立てない。新しいシーズンに向けてログインしています。<b class="hl">指定ストライキ</b>。|—|
|42|280|球團徵詢：你的體力已達先發水準，要轉任先發嗎？|チーム相談：あなたの体力は開始レベルに達しています。スタートポジションへの異動を希望しますか?|—|
|43|281|轉任先發，扛起輪值|先発となってローテーションを引き継ぐ|—|
|44|282|定位調整|位置決め調整|—|
|45|282|你點頭接下先發任務。新球季起，你是輪值的一員——<b class="hl">先發</b>。|あなたはうなずいて最初の任務を受け入れました。フットボールの新シーズンから、あなたはローテーションの一員です——<b class="hl">始める</b>。|—|
|46|283|留在牛棚，守住我的位置|ブルペンにいて、自分の位置を保ってください|—|
|47|283|維持|維持する|—|
|48|283|定位|位置|—|
|49|284|留守牛棚|ブルペンに残る|—|
|50|284|你婉拒了教練團的提議——永遠準備待命，在球隊最需要我的時候，登板救火。|あなたはコーチングスタッフの提案を拒否しました。チームが私を最も必要とするときは常にスタンバイして、火を消すためにボードに上がってください。|—|
|51|289|定位調整|位置決め調整|—|
|52|289|球團季末評估你的體力狀況，新球季將你的角色調整為 <b class="hl">${roleN(nr)}</b>。|シーズン終了後にチームが体調を評価し、新シーズンでの役割を調整することになる。<b class="hl">${roleN(nr)}</b>。|roleN(nr)|
|53|291|投手定位|投手のポジショニング|—|
|54|291|教練團評估你的體力，將你登錄為 <b class="hl">${roleN(nr)}</b>。|コーチングチームはあなたの体力を評価し、あなたを次のようにログインします。<b class="hl">${roleN(nr)}</b>。|roleN(nr)|
|55|296|守位登錄|ログインの防御|—|
|56|296|教練團評估守備工具後，將你登錄為 <b class="hl">${DPN[S.dpos]}</b>。|コーチング スタッフが守備ツールを評価した後、次のようにログインします。<b class="hl">${DPN[S.dpos]}</b>。|DPN[S.dpos]|
|57|300|守位會議：教練團想把你推上更吃重的位置|ポジショニングミーティング: コーチングスタッフはあなたをより重要なポジションに押し上げたいと考えています|—|
|58|301|升防 ${DPN[best]}|防御力を上げる${DPN[best]}|DPN[best]|
|59|301|薪資係數 ×${(DP_MULT[best]\|\|1).toFixed(2)}|給与係数×${(DP_MULT[best]\|\|1).toFixed(2)}|(DP_MULT[best]\|\|1).toFixed(2)|
|60|302|守位調整|位置調整|—|
|61|302|守備數據說服了所有人——新球季改守 <b class="hl">${DPN[best]}</b>。|誰もが納得した守備データ - 新シーズンは守備を変えた<b class="hl">${DPN[best]}</b>。|DPN[best]|
|62|303|留守 ${DPN[S.dpos]}|後ろにいて${DPN[S.dpos]}|DPN[S.dpos]|
|63|305|移防 ${DPN[p]}|移動防御${DPN[p]}|DPN[p]|
|64|306|守備已無處可站｜薪資係數 ×0.92|守備陣の居場所がない｜年俸係数×0.92|—|
|65|306|薪資係數 ×${(DP_MULT[p]\|\|1).toFixed(2)}|給与係数×${(DP_MULT[p]\|\|1).toFixed(2)}|(DP_MULT[p]\|\|1).toFixed(2)|
|66|307|守位調整|位置調整|—|
|67|307|球團季末評估後，新球季改守 <b class="hl">${DPN[p]}</b>。|チームのシーズン終了後の評価後、チームは新シーズンに向けて守備を変更した<b class="hl">${DPN[p]}</b>。|DPN[p]|
|68|308|守位會議：教練團認為你的守備已撐不住 ${DPN[S.dpos]}（${LV[S.lv].n}標準）|ディフェンスミーティング: コーチングスタッフは、あなたのディフェンスはもう耐えられないと考えています。${DPN[S.dpos]}（${LV[S.lv].n}標準）|DPN[S.dpos], LV[S.lv].n|
|69|313|台中猛瑪|台中のマンモス|—|
|70|313|府城雄獅|フーチェン ライオン|—|
|71|313|桃園金剛|桃園キングコング|—|
|72|313|新北騎士|ニュータイペイナイツ|—|
|73|313|台北恐龍|台北の恐竜|—|
|74|313|高雄神鵰|高雄神鷲|—|
|75|315|東京大人|東京様|—|
|76|315|阪神猛虎|阪神タイガース|—|
|77|315|橫濱海星|ヨコハマヒトデ|—|
|78|315|廣島紅鯉|広島レッドカープ|—|
|79|315|神宮飛燕|フェイヤン神社|—|
|80|315|名古屋神龍|名古屋神龍|—|
|81|315|福岡猛禽|福岡ラプター|—|
|82|315|北海道培根|北海道ベーコン|—|
|83|315|千葉海潮|千葉の潮|—|
|84|315|仙台金梟|仙台ゴールデンフクロウ|—|
|85|315|大阪蠻牛|大阪牛|—|
|86|315|埼玉雄獅|埼玉ライオン|—|
|87|317|洛城藍電|ロサンゼルスの青い稲妻|—|
|88|317|聖港修士|ポルトサントの修道士|—|
|89|318|灣區大人|ベイエリアの大人|—|
|90|319|紐約帝國|ニューヨーク帝国|—|
|91|320|波士頓襪王|ボストンソックスのキング|—|
|92|321|紐約大蘋果|ニューヨークのビッグアップル|—|
|93|322|費城鐵魂|フィラデルフィア アイアン ソウル|—|
|94|323|亞城戰斧|シティバトルアックス|—|
|95|324|風城幼熊|ウィンディ シティ カブス|—|
|96|325|河濱緋雀|リバーサイド スカーレット バード|—|
|97|326|星港火箭|スターポート ロケット|—|
|98|327|孤星騎兵|ローンスターキャバルリー|—|
|99|328|翡翠水兵|エメラルドセーラー|—|
|100|329|洛城神使|ロサンゼルスエンジェル|—|
|101|330|楓葉藍鴉|メープルブルージェイク|—|
|102|331|快船金鷗|クリッパーズ ゴールデン ガル|—|
|103|332|海灣雷射|ベイレーザー|—|
|104|333|森林悍將|ジャングルの戦士|—|
|105|334|汽車城猛虎|カーシティタイガー|—|
|106|335|北星雙塔|ノーススターツインタワー|—|
|107|336|風城襪王|ウィンディシティ ソックスキング|—|
|108|337|向日葵王室|ひまわり王室|—|
|109|338|競技者|競合他社|—|
|110|339|奶油杜康|クリームデュカン|—|
|111|340|鋼鐵船長|鋼鉄の船長|—|
|112|341|魔法魚人|魔法の魚人|—|
|113|342|首都人民|資本の人々|—|
|114|343|沙漠眼鏡蛇|砂漠のコブラ|—|
|115|344|黛紫高原|大子高原|—|
|116|345|女王城紅軍|クイーン シティ レッズ|—|
|117|347|台中猛瑪|台中のマンモス|—|
|118|347|府城雄獅|フーチェン ライオン|—|
|119|347|桃園金剛|桃園キングコング|—|
|120|347|新北騎士|ニュータイペイナイツ|—|
|121|347|台北恐龍|台北の恐竜|—|
|122|347|高雄神鵰|高雄神鷲|—|
|123|348|東京大人|東京様|—|
|124|348|阪神猛虎|阪神タイガース|—|
|125|348|橫濱海星|ヨコハマヒトデ|—|
|126|348|廣島紅鯉|広島レッドカープ|—|
|127|348|神宮飛燕|フェイヤン神社|—|
|128|348|名古屋神龍|名古屋神龍|—|
|129|348|福岡猛禽|福岡ラプター|—|
|130|348|北海道培根|北海道ベーコン|—|
|131|348|千葉海潮|千葉の潮|—|
|132|348|仙台金梟|仙台ゴールデンフクロウ|—|
|133|348|大阪蠻牛|大阪牛|—|
|134|348|埼玉雄獅|埼玉ライオン|—|
|135|349|洛城藍電|ロサンゼルスの青い稲妻|—|
|136|349|聖港修士|ポルトサントの修道士|—|
|137|349|灣區大人|ベイエリアの大人|—|
|138|349|紐約帝國|ニューヨーク帝国|—|
|139|349|波士頓襪王|ボストンソックスのキング|—|
|140|349|紐約大蘋果|ニューヨークのビッグアップル|—|
|141|349|費城鐵魂|フィラデルフィア アイアン ソウル|—|
|142|349|亞城戰斧|シティバトルアックス|—|
|143|349|風城幼熊|ウィンディ シティ カブス|—|
|144|349|河濱緋雀|リバーサイド スカーレット バード|—|
|145|349|星港火箭|スターポート ロケット|—|
|146|349|孤星騎兵|ローンスターキャバルリー|—|
|147|349|翡翠水兵|エメラルドセーラー|—|
|148|349|洛城神使|ロサンゼルスエンジェル|—|
|149|349|楓葉藍鴉|メープルブルージェイク|—|
|150|349|快船金鷗|クリッパーズ ゴールデン ガル|—|
|151|349|海灣雷射|ベイレーザー|—|
|152|349|森林悍將|ジャングルの戦士|—|
|153|349|汽車城猛虎|カーシティタイガー|—|
|154|349|北星雙塔|ノーススターツインタワー|—|
|155|349|風城襪王|ウィンディシティ ソックスキング|—|
|156|349|向日葵王室|ひまわり王室|—|
|157|349|競技者|競合他社|—|
|158|349|奶油杜康|クリームデュカン|—|
|159|349|鋼鐵船長|鋼鉄の船長|—|
|160|349|魔法魚人|魔法の魚人|—|
|161|349|首都人民|資本の人々|—|
|162|349|沙漠眼鏡蛇|砂漠のコブラ|—|
|163|349|黛紫高原|大子高原|—|
|164|349|女王城紅軍|クイーン シティ レッズ|—|
|165|352|中職二軍|中等職業および中等軍隊|—|
|166|353|中職一軍|中等職業軍|—|
|167|354|日職二軍|日本第二軍|—|
|168|355|日職一軍|日本軍|—|
|169|356|新人聯盟|初心者同盟|—|
|170|360|大聯盟|メジャーリーグ|—|
|171|363|木棒聯賽|木製バットリーグ|—|
|172|363|黑豹旗|ブラックパンサーの旗|—|
|173|363|玉山盃|玉山杯|—|
|174|364|大學春季聯賽|大学春季リーグ|—|
|175|364|大專盃|カレッジカップ|—|
|176|367|打擊機特訓|攻撃機の特別訓練|—|
|177|367|手感火燙，擊球點完全咬中|手に持つと熱く感じられ、ボールを完璧に打ちます。|—|
|178|367|越打越糊，姿勢跑掉了|打てば打つほど混乱して姿勢が崩れてしまう。|—|
|179|368|重量訓練週期|ウェイトトレーニングサイクル|—|
|180|368|深蹲破 PR，全身充滿力量|スクワットでPRを中断し、体全体に力を込めましょう|—|
|181|368|操之過急，肌肉緊繃了好幾週|急ぎすぎたので、何週間も筋肉が硬くなっていました。|—|
|182|369|牛棚加練|ブルペントレーニング|—|
|183|369|新的握法找到了，尾勁明顯提升|新しいグリップを見つけたので、テールの強度が大幅に向上しました。|—|
|184|369|越丟越歪，投球機制亂掉|投げれば投げるほど曲がってしまい、投球機構がめちゃくちゃになってしまいます。|—|
|185|370|長傳接訓練|ロングパストレーニング|—|
|186|370|雷射肩養成中|肩のレーザートレーニング中|—|
|187|370|肩膀有點緊，教練喊停|肩が少しきつくて、コーチにやめるように言われました。|—|
|188|371|影像分析課|画像解析クラス|—|
|189|371|看穿投打習性，判斷力大增|自分の投げ方と打ち方の癖を見抜くことで判断力が大幅に向上します|—|
|190|371|資訊爆炸，站上場反而想太多|情報の爆発が起こっています。ステージに立つと考えすぎてしまいます。|—|
|191|372|跑壘特訓|ベースランニングトレーニング|—|
|192|372|起跑判斷進步神速|スタート判定の飛躍的な進歩|—|
|193|372|拉傷大腿後側，休了兩週|ハムストリングを痛めて2週間離脱した。|—|
|194|373|守備千球練習|千球フィールディング練習|—|
|195|373|手套像吸塵器一樣|掃除機のような手袋|—|
|196|373|吃了無數個彈跳球，信心受挫|弾むボールを数え切れないほど食べてしまい、自信が挫折してしまいました。|—|
|197|374|觸身球驚魂|タッチボールショック|—|
|198|374|側身閃過，反應快得嚇人|横に点滅 反応が恐ろしく早い|—|
|199|374|結結實實吃了一顆速球|スピードボールをしっかりと食らった。|—|
|200|375|媒體專訪|メディアインタビュー|—|
|201|375|應對得體，人氣上升，打球更有動力|適切に対応し、人気を獲得し、プレイ意欲を高めます。|—|
|202|375|失言上了新聞，壓力影響狀態|失言はニュースになり、ストレスはステータスに影響を与える|—|
|203|376|教練團關注|コーチ陣も注目|—|
|204|376|獲得單獨指導的機會|個別指導の機会あり|—|
|205|376|被盯上缺點，一直被要求改動作|欠点を指摘され、常に行動を変えるように求められる|—|
|206|377|伙食與睡眠計畫|食事と睡眠のプラン|—|
|207|377|體脂下降，恢復速度變快|体脂肪が減って回復速度が早くなる|—|
|208|377|水土不服，腸胃炎折騰一週|気候に慣れず1週間胃腸炎に悩まされました|—|
|209|378|學長／老將指點|先輩・ベテランからの指導|—|
|210|378|一句話點醒夢中人|夢想家を目覚めさせる言葉|—|
|211|378|學了不適合自己的招，繞了遠路|自分に合わないコツを覚えてしまい、遠回りしてしまいました。|—|
|212|379|球速測定日|球速検査当日|—|
|213|379|雷達槍跳出生涯新高|レーダー砲がキャリアハイを記録|—|
|214|379|出力過猛，手肘發炎|過度の運動、肘の炎症|—|
|215|380|配球讀書會|マッチブッククラブ|—|
|216|380|進壘點的想像力打開了|ベースの想像力が広がります|—|
|217|380|想得太多，投得綁手綁腳|考えすぎると撮影時に手足が縛られてしまいます|—|
|218|381|宵夜文化|深夜のおやつ文化|—|
|219|381|控制住了，體態維持得宜|コントロールしながら、良い姿勢を維持|—|
|220|381|體重直線上升，第一步變慢了|体重が急激に増えて、最初の一歩が遅くなりました。|—|
|221|382|場外代言邀約|オフサイトの承認への招待|—|
|222|382|商演安排得宜，多賺零用錢也沒荒廢訓練|業績も整い、研修も怠らずお小遣いも稼げました。|—|
|223|382|行程太滿，訓練量明顯掉了|スケジュールが過密で、明らかに練習量が減っている。|—|
|224|383|季中低潮|季節中干潮|—|
|225|383|靠著調整心態走出來，更強了|メンタルを整えて強くなる|—|
|226|383|低潮拖了一個月|干潮は一ヶ月も続いた|—|
|227|400|平鎮高中|平鎮高等学校|—|
|228|400|穀保家商|古宝家祥|—|
|229|400|高苑工商|高園工業商業|—|
|230|400|北科附工|ベイケ・アフィリエイト・エンジニアリング|—|
|231|400|普門高中|浦門高校|—|
|232|400|東大體中|イースタン大学セントラル|—|
|233|413|普通|普通|—|
|234|418|隱藏屬性解鎖：|隠し属性のロックが解除されました:|—|
|235|427|代打|代わりの|—|
|236|427|代跑|他人に代わって走る|—|
|237|427|代守|大翔|—|
|238|436|全力投|オールイン|—|
|239|436|普通投|通常投資|—|
|240|436|養生球|ヘルスボール|—|
|241|444|手肘拉起警報|肘が警報を鳴らす|—|
|242|444|累積的負荷讓韌帶發出哀鳴——球速、變化球各 <b class="dn">−5</b>。醫療團隊把兩個選項攤在你面前。|蓄積された負荷により靭帯がうめき声を上げ、ボールのスピード、ボールの変化などが変化します。<b class="dn">−5</b>。医療チームはあなたの前に 2 つの選択肢を提示します。|—|
|243|446|TJ 抉擇：你的手肘撐到極限了|TJ Choice: 肘は限界に達しています|—|
|244|447|動 Tommy John 手術|トミー・ジョン手術を受ける|—|
|245|447|報銷一整年，回來球速/變化球回春（各 +3~+10）|1年間還元、球速・球変化復帰（各+3～+10）|—|
|246|452|手術成功|手術は成功しました|—|
|247|452|手術很順利。漫長復健後，你的球威煥然一新——球速 <b class="up">+${gv}</b>、變化球 <b class="up">+${gb}</b>。（本季報銷）|手術はうまくいきました。長いリハビリ期間を経て、ボールの威力、つまりボールスピードが新しくなりました。<b class="up">+${gv}</b>、変化球<b class="up">+${gb}</b>。 (今四半期に返金されます)|gv, gb|
|248|454|打針硬撐這一季|今シーズンを乗り切るための注射|—|
|249|454|成功率 ${succP}%｜失敗＝TJ 大傷（隔年報銷、能力再崩）|成功率${succP}%｜失敗＝TJが重傷（翌年償還、再び能力崩壊）|succP|
|250|456|險過一關|かろうじて逃れた|—|
|251|456|封閉針撐住了，你咬牙投完球季——量表 <b class="hl">−20</b>，球速、變化球各 <b class="up">+5</b>。但這是在跟時間借命。|封印の針が握り締めて 歯を食いしばってシーズンを終える - スケール<b class="hl">−20</b>、球速、変化球それぞれ<b class="up">+5</b>。しかし、これは時間を借りているのです。|—|
|252|463|兩度動刀的代價|ナイフを二度も下した代償|—|
|253|463|第二次進手術室——韌帶再也不是原廠的了。球速與變化球<b class="dn">直接砍半</b>。|2度目の手術室では、靭帯はもはや元のものではありませんでした。球速と変化球<b class="dn">半分に切るだけです</b>。|—|
|254|469|最壞的結果|最悪の結果|—|
|255|469|針扎下去的瞬間，肩膀傳來從未有過的撕裂感。醫生的臉色說明了一切——<b class="dn">肩膀報廢，球速與變化球歸零剩 10，潛力上限砍到 20</b>。你的投手生涯，大概到這裡了。|針を刺した瞬間、肩に今までにない引き裂かれるような感覚が生じた。医師の顔がすべてを物語っていた——<b class="dn">肩が削られ、球速と球変化が10に、ポテンシャルの上限が20に低下。</b>。あなたの投手としてのキャリアはおそらくここで終わりです。|—|
|256|485|TJ 大傷|TJ大怪我|—|
|257|485|硬撐的代價來了——韌帶當場斷裂。隔年<b class="dn">全年報銷</b>。經歷了漫長的手術與復健（斷裂 −5 加上手術回春），最終你的球速 ${vStr}、變化球 ${bStr}。就算滿血回歸，也真的只是勉強打平。|耐え続けた代償は、靭帯がその場で断裂したことだった。翌年<b class="dn">通年払い戻し</b>。長い期間の手術とリハビリテーション (骨折 -5 プラス外科的若返り) を経て、最終的にボールスピードが向上しました。${vStr}、変化球${bStr}。たとえ元気になって戻ってきたとしても、本当にギリギリの引き分けだ。|vStr, bStr|
|258|491|隱藏屬性解鎖：橡膠手臂|隠し属性解放：ラバーアーム|—|
|259|491|連續兩次靠打針硬撐挺過手肘危機、完全不進手術室——你的韌帶像橡膠一樣柔韌。<b class="hl">TJ 量表上限翻倍、打針成功率翻倍</b>。|手術室にまったく行かずに、注射で 2 回の肘の危機を乗り切りました。靭帯はゴムのように柔軟です。<b class="hl">TJスケールの上限が2倍になり、射出成功率も2倍になります。</b>。|—|
|260|493|橡膠手臂|ゴムアーム|—|
|261|494|橡膠不再|もうゴムはありません|—|
|262|494|終究還是進了手術室——那雙被稱為橡膠的手臂，也有極限。<b class="dn">橡膠手臂失效</b>。|結局のところ、私たちは手術室に入りました。いわゆるゴム製の腕には限界がありました。<b class="dn">ゴムアームの故障</b>。|—|
|263|513|先發|始める|—|
|264|513|中繼|リレー|—|
|265|513|終結者|ターミネーター|—|
|266|532|工具人|道具屋|—|
|267|535|潛力股|潜在的な株式|—|
|268|536|工作馬|働き馬|—|
|269|537|火球男|火の玉男|—|
|270|537|變化球藝師|ゴルファーを変える|—|
|271|537|控球大師|ボールマスター|—|
|272|540|配球皇帝|試合球の帝王|—|
|273|542|巨炮型|巨大砲型|—|
|274|542|安打製造機|ヒット製造機|—|
|275|542|選球大師|ボール拾いマスター|—|
|276|542|飛毛腿|スカッド|—|
|277|542|守備至上|守備第一|—|
|278|544|潛力股|潜在的な株式|—|
|279|545|全能型|オールラウンダー|—|
|280|721|｜${st.SV}救援|｜${st.SV}レスキュー|st.SV|
|281|721|｜${st.HLD}中繼|｜${st.HLD}リレー|st.HLD|
|282|721|出賽 ${st.G}｜局數 ${fmtIP(st.IP)}｜${st.W}勝${st.L}敗${relief}｜三振 ${st.SO}｜保送 ${st.BB\|\|0}｜ERA ${st.era.toFixed(2)}｜WHIP ${(st.WHIP\|\|0).toFixed(2)}|遊ぶ${st.G}｜ゲーム数${fmtIP(st.IP)}｜${st.W}勝つ${st.L}敗北${relief}\|三振${st.SO}｜確実な配送${st.BB\|\|0}｜ERA ${st.era.toFixed(2)}｜WHIP ${(st.WHIP\|\|0).toFixed(2)}|st.G, fmtIP(st.IP), st.W, st.L, relief, st.SO, st.BB\|\|0, st.era.toFixed(2), (st.WHIP\|\|0).toFixed(2)|
|283|727|出賽 ${st.G}｜打席 ${st.PA}｜打擊率 ${st.avg.toFixed(3).replace(/^0/,'')}｜上壘率 ${obp}｜長打率 ${slg}｜OPS ${ops}｜安打 ${st.H}｜全壘打 ${st.HR}｜打點 ${st.RBI}｜保送 ${st.BB}｜盜壘 ${st.SB}${st.DEF!==undefined?|遊ぶ${st.G}｜プレイ席${st.PA}｜戦闘平均${st.avg.toFixed(3).replace(/^0/,'')}｜出塁率${obp}｜長打率${slg}｜OPS ${ops}｜ヒット曲${st.H}｜ホームラン${st.HR}｜ドット${st.RBI}｜確実な配送${st.BB}\|盗塁${st.SB}${st.DEF!==undefined?|st.G, st.PA, st.avg.toFixed(3).replace(/^0/,''), obp, slg, ops, st.H, st.HR, st.RBI, st.BB, st.SB|
|284|749|億|1億|—|
|285|749|萬|万|—|
|286|749|0萬|00,000|—|
|287|762|（高|（高い|—|
|288|762|一|1つ|—|
|289|762|二|二|—|
|290|762|三|三つ|—|
|291|763|（大|（大きい|—|
|292|763|一|1つ|—|
|293|763|二|二|—|
|294|763|三|三つ|—|
|295|763|四|4|—|
|296|764|（業餘）|（アマチュア）|—|
|297|788|⌃ 展開選項|⌃ オプションを展開する|—|
|298|788|⌄ 收合選項|⌄ オプションを折りたたむ|—|
|299|810|<div class="pool">剩餘可分配點數：${pool} 點（點一下能力 +1）</div>|<div class="pool">配布可能な残りポイント:${pool}クリック(クリック能力+1)</div>|pool|
|300|819|${S.ab[k]} <b style="display:block;font-size:10.5px">${got>0?'+'+got:'蓄力中'}</b>|${S.ab[k]} <b style="display:block;font-size:10.5px">${got>0?'+'+got:'蓄力中'}</b>|S.ab[k], got>0?'+'+got:'蓄力中'|
|301|824|↩ 復原|↩ 復元|—|
|302|830|能力已達上限，捨棄剩餘骰子 ▸|能力が上限に達しました。残ったサイコロを捨てます ▸|—|
|303|830|確認 ▸|確認 ▸|—|
|304|839|高|高い|—|
|305|839|一|1つ|—|
|306|839|二|二|—|
|307|839|三|三つ|—|
|308|840|大|大きい|—|
|309|840|一|1つ|—|
|310|840|二|二|—|
|311|840|三|三つ|—|
|312|840|四|4|—|
|313|841|業餘成棒|アマチュア|—|
|314|844|${S.year} 年 · ${S.age} 歲 · ${stageLabel()}|${S.year}年 ・${S.age}年 ・${stageLabel()}|S.year, S.age, stageLabel()|
|315|848|身體已到極限，|体が限界に達してしまったので、|—|
|316|848|年春訓後宣布引退。|春季トレーニング後に引退を発表。|—|
|317|852|歲月不饒人|時間は容赦ない|—|
|318|852|${declAge>=35?'第二階段（逐年加劇）':'第一階段'}衰退：所有能力 <b class="dn">−${dec}</b>${S.traits.disc?'（自律狂：生涯延後兩年）':''}。訓練加點照常，但身體回不去了。|${declAge>=35?'第2段階（年々加速）':'第1段階'}の衰え：全能力<b class="dn">−${dec}</b>${S.traits.disc?'（自律の鬼：キャリアの衰えが2年遅延）':''}。これまでどおり追加トレーニングはできますが、体が元に戻ることはありません。|declAge>=35?'第二階段（逐年加劇）':'第一階段', dec, S.traits.disc?'（自律狂：生涯延後兩年）':''|
|319|854|復健年|リハビリの年|—|
|320|854|大傷尚未痊癒，本季確定<b class="dn">全年報銷</b>，只能在復健室度過。（擲骰減為 2 顆）|大怪我はいまだ治らず、今シーズン出場が確定<b class="dn">通年払い戻し</b>、リハビリ室でのみ過ごすことができます。 (ロールが 2 に減少)|—|
|321|856|復健年・全年報銷|再生年度・通年償還|—|
|322|866|自主訓練擲出 <b class="hl">${n}</b> 顆骰。|独立トレーニングの投げ<b class="hl">${n}</b>サイコロ。|n|
|323|867|高標值「6」累計 <b class="hl">${S.six}/5</b> 次。|高いマーク値「6」の蓄積<b class="hl">${S.six}/5</b>二流。|S.six|
|324|878|<br>大巧不工發動：系統自動擲出 <b class="hl">${cv}</b> 點，挹注於 <b class="hl">${ABL[ck]}</b>|<br>Daqiao が機能しない: システムが自動的にスローします<b class="hl">${cv}</b>ポイント、焦点を当てる<b class="hl">${ABL[ck]}</b>|cv, ABL[ck]|
|325|879|（能力 <b class="up">+${gained}</b>）|（能力<b class="up">+${gained}</b>）|gained|
|326|880|（頂峰造極：溢出的 ${overflow} 點轉為<b class="up">本季成績加成</b>）|（頂点：溢れる${overflow}クリックして変更します<b class="up">今シーズンのスコアボーナス</b>）|overflow|
|327|881|（能力加點，但不足以提升一級）|(アビリティポイントは加算されますが、レベルアップには不十分です)|—|
|328|885|季初特訓|シーズン初期のトレーニング|—|
|329|893|${ABL[k]} <b class="up">+5</b>（潛力上限 +10 → ${S.pot[k]}）|${ABL[k]} <b class="up">+5</b>(最大潜在力+10 →${S.pot[k]}）|ABL[k], S.pot[k]|
|330|894|隱藏素質解鎖：天才|隠された品質のロックが解除されました: Genius|—|
|331|894|22 歲前五度擲出高標值！從今以後，每一顆訓練骰<b class="hl">永久固定 4 點以上</b>，事件卡好結果機率提升至 <b class="hl">70%</b>。|22歳、高値投げるまで5回！これからは、あらゆるトレーニングが死ぬ<b class="hl">4 点以上で永久固定</b>、イベントカードの結果が良好になる確率が に増加します。<b class="hl">70%</b>。|—|
|332|894|天賦覺醒，潛能重新被評估：${bl.join('、')}。|才能が目覚め、可能性が再評価されます。${bl.join('、')}。|bl.join('、')|
|333|894|天賦，是藏不住的。|才能は隠すことはできません。|—|
|334|897|▸ 分配訓練成果（${dice.length} 顆骰）|▸ トレーニング結果を割り当てる (${dice.length}サイコロ）|dice.length|
|335|897|分配訓練成果（點骰套用｜球探量表：|トレーニング結果の配布（サイコロアプリケーション \| スカウティングスケール：|—|
|336|897|以上成長遞減）|上記の伸びは減少します）|—|
|337|903|開季投球規劃（手臂狀況：${(function(){const r=S.tj/tjCap();return S.rehab>0?'復健中':r>=0.85?'手肘隱隱作痛':r>=0.6?'手臂略感疲勞':r>=0.35?'狀況尚可':'手感輕盈';})()}）|開幕投手計画（腕の状態：${(function(){const r=S.tj/tjCap();return S.rehab>0?'復健中':r>=0.85?'手肘隱隱作痛':r>=0.6?'手臂略感疲勞':r>=0.35?'狀況尚可':'手感輕盈';})()}）|(function(){const r=S.tj/tjCap();return S.rehab>0?'復健中':r>=0.85?'手肘隱隱作痛':r>=0.6?'手臂略感疲勞':r>=0.35?'狀況尚可':'手感輕盈';|
|338|904|全力投|オールイン|—|
|339|904|成績最佳｜手臂負荷最大（TJ 累積 ×1.25）|最良の結果｜最大腕荷重（TJ累積×1.25）|—|
|340|904|全力投|オールイン|—|
|341|905|普通投|通常投資|—|
|342|905|標準強度｜TJ 累積正常|標準強度｜TJ蓄積普通|—|
|343|905|普通投|通常投資|—|
|344|906|養生球|ヘルスボール|—|
|345|906|成績保守｜省手臂（TJ 累積 ×0.65）|保守的な結果 \|セーブアーム（TJ累積×0.65）|—|
|346|906|養生球|ヘルスボール|—|
|347|913|投入中華職棒選秀|中国プロ野球ドラフトにエントリー|—|
|348|913|目前綜合 ${o}｜年齡加權：越年輕評價越高|現在包括的${o}｜年齢加重：若いほど評価が高い|o|
|349|914|留在大學繼續磨練|大学に残ってトレーニングを続ける|—|
|350|922|洽談旅日合約|日本での旅行契約の交渉|—|
|351|922|休學挑戰日職｜大齡影響簽約金|学校を休学して本業に挑戦｜高齢で契約金に影響|—|
|352|924|日職球團報價|プロサッカー日本代表チームの名言|—|
|353|925|洽談旅美合約|米国での旅行契約の交渉|—|
|354|925|休學挑戰小聯盟｜大齡影響簽約金|学校を休学してマイナーリーグに挑戦｜高齢が契約金に影響|—|
|355|927|大聯盟球團報價|メジャーリーグチームの名言|—|
|356|928|大${['一','二','三','四'][S.stageYr-1]}季前 · 升學與職棒的十字路口|大きい${['一','二','三','四'][S.stageYr-1]}プレシーズン・大学入学とプロ野球の岐路|['一','二','三','四'][S.stageYr-1]|
|357|932|再戰一年|あと一年戦え|—|
|358|935|放棄合約，落葉歸根|契約を捨てて落ち葉は根に還る|—|
|359|935|狀態不再，仍想把最後的球打給家鄉看|この状態はもうありませんが、それでも地元へ最後の打球を打ちたいと思っています。|—|
|360|936|落葉歸根|落ち葉は根に戻ります|—|
|361|936|狀態早已不在巔峰。但家鄉球隊仍然向你招手——他們要的不是現在的數據，是你這個名字陪著大家走過的那些年。你決定放棄合約，回家，把最後的球打給臺灣的球迷看。|彼の状態はもはやピークではない。しかし、あなたの故郷のチームは今もあなたに手を振っています。彼らが望んでいるのは現在のデータではなく、あなたの名前が皆と共に歩んできた年月です。あなたは契約を放棄して帰国し、台湾のファンに最後のボールをプレーすることに決めました。|—|
|362|940|召開引退記者會|引退記者会見を開く|—|
|363|940|結束選手生涯|選手生命の終焉|—|
|364|940|功成身退，於|成功したら引退、|—|
|365|940|年宣布引退。|年に引退を発表。|—|
|366|941|又是一年春訓，身體大不如前了|またスプリングトレーニングだけど、体は以前ほど良くない。|—|
|367|952|▸ 季中健康檢查|▸ シーズン半ばの健康診断|—|
|368|953|▸ 查看球季表現|▸ シーズンパフォーマンスを見る|—|
|369|966|抽事件卡（剩 ${n} 張）|イベントカードを引く(残り${n}開ける）|n|
|370|971|事件｜${ev.n} — 你要怎麼應對？|イベント｜${ev.n}――どう答えますか？|ev.n|
|371|972|全力一搏|全力を尽くしてください|—|
|372|972|成功率 ${od.bold}%｜${S.traits.clutch?'成功 +4／失敗僅 −2':'加成／減益幅度最大（±3）'}|成功率${od.bold}%｜${S.traits.clutch?'成功 +4／失敗僅 −2':'加成／減益幅度最大（±3）'}|od.bold, S.traits.clutch?'成功 +4／失敗僅 −2':'加成／減益幅度最大（±3）'|
|373|973|照常執行|いつも通りにパフォーマンスする|—|
|374|973|成功率 ${od.norm}%｜標準幅度（±2）|成功率${od.norm}%｜標準振幅（±2）|od.norm|
|375|974|保守應對|保守的な反応|—|
|376|974|成功率 ${od.safe}%｜加成／減益幅度最小（±1）|成功率${od.safe}%｜最小ボーナス/デバフ範囲(±1)|od.safe|
|377|978|林曉晴|林小青|—|
|378|978|陳若彤|チェン・ルオトン|—|
|379|978|張沛慈|チャン・ペイチ|—|
|380|978|王詠恩|王永恩|—|
|381|978|許昀熙|シュ・ユンシー|—|
|382|978|蘇采蓁|蘇彩鎮|—|
|383|978|周依潔|ジョウ・イージエ|—|
|384|978|郭芷萱|郭志宣|—|
|385|980|馮海莎|風水沙|—|
|386|1000|分手|別|—|
|387|1000|${cheatPen?'那晚的事她其實都知道。':''}交往 ${y} 年，婚期一延再延。<b class="hl">${ex}</b> 最後留下一句：「我等不到了。」轉身離開。整個休賽季你魂不守舍——<b class="dn">${ABL[k1]} ${g1}、${ABL[k2]} ${g2}</b>。|${cheatPen?'那晚的事她其實都知道。':''}通信する${y}数年後、結婚式の日取りは何度も延期された。<b class="hl">${ex}</b>彼は「もう待てない」と最後の言葉を残した。彼は振り返って立ち去った。あなたはオフシーズン中ずっと幽霊に取り憑かれて過ごしました—<b class="dn">${ABL[k1]} ${g1}、${ABL[k2]} ${g2}</b>。|cheatPen?'那晚的事她其實都知道。':'', y, ex, ABL[k1], g1, ABL[k2], g2|
|388|1006|聚餐散場，${t} 說順路想搭你的車|夕食も終わり、${t}途中で乗せてあげたいって言ってた|t|
|389|1007|讓她上車（賭一把）|彼女を車に乗らせてください（ギャンブルをしましょう）|—|
|390|1007|沒被抓到＝體力提升｜被抓到＝能力下跌、當年分手率+30%|引っかからない＝体力アップ \|捕まる＝能力低下、その年の解散率+30%|—|
|391|1010|深夜兜風|深夜のドライブ|—|
|392|1010|沒有人拍到。你把方向盤握得很緊——${gt}。（這條路不會有好結局）|誰もそれを撮影しませんでした。ハンドルをしっかり握ると――${gt}。 (この道はうまく終わらない)|gt|
|393|1012|「不順路。」直接載 ${L.partner} 回家|「思い通りにいかないよ。」直接受け取ってください${L.partner}家に帰れ|L.partner|
|394|1012|感情穩固，絕對不虧|関係は安定しており、それだけの価値があります|—|
|395|1014|正確答案|正解|—|
|396|1014|你傳訊息給 ${L.partner}：「馬上到。」——${gt}。|あなたがメッセージを送信するのは、${L.partner}：「もうすぐですよ。」——${gt}。|L.partner, gt|
|397|1016|明星賽放閃|オールスターゲームが輝く|—|
|398|1016|明星賽表演賽，鏡頭掃到看台上的 <b class="hl">${L.partner}</b>，你隔著全場比了一個手勢，轉播單位立刻切出愛心特效，隔天甜上熱搜——${gt}。|スターゲームのエキシビションマッチ中、カメラはスタンドの人々にパンした<b class="hl">${L.partner}</b>、あなたが聴衆を横切るジェスチャーをすると、放送局はすぐに特別な愛のエフェクトを切り出し、翌日には検索のホットトピックになりました—${gt}。|L.partner, gt|
|399|1018|愛情長跑|遠距離恋愛|—|
|400|1018|交往邁入第 ${y} 年。沒有大新聞，只有每個客場系列賽結束後，機場出口那杯她替你買好的熱美式——${gt}。|関係は最初に入ります${y}年。大きなニュースはありません。ただ、アウェイシリーズが終わるたびに空港の出口で彼女が買ってくれた熱いアメリカーノのカップだけです。${gt}。|y, gt|
|401|1026|場外話題|コート外の話題|—|
|402|1026|你和啦啦隊女神 <b class="hl">${p}</b> 被拍到球場外同框，緋聞登上娛樂版頭條。${L.exes.length?'（評論區：「離過婚還這麼搶手」）':''}|あなたとチアリーディングの女神<b class="hl">${p}</b>二人はスタジアムの外で一緒に写真を撮られ、そのスキャンダルはエンターテイメント紙の見出しを飾った。${L.exes.length?'（評論區：「離過婚還這麼搶手」）':''}|p, L.exes.length?'（評論區：「離過婚還這麼搶手」）':''|
|403|1027|記者把麥克風遞到你面前：「兩位是在交往嗎？」|レポーターはあなたにマイクを渡しました、「二人は付き合っているんですか？」|—|
|404|1028|大方承認：「請大家祝福我們」|「私たちを祝福してください」と寛大に認めてください。|—|
|405|1028|還要看她那邊敢不敢承認（球團有禁愛令傳聞）|彼女がそれを認めるかどうかにもよる（チーム内では恋愛禁止の噂もある）|—|
|406|1031|戀情公開|恋愛事情公開|—|
|407|1031|<b class="hl">${p}</b> 在社群發出十指緊扣的照片：「謝謝大家的祝福。」戀愛使人容光煥發——${gt}。你們正式交往了。|<b class="hl">${p}</b>指を組んでいる写真をソーシャルメディアに投稿し、「皆さんの祝福に感謝します」。愛は人を輝かせる——${gt}。あなたは正式に交際関係にあります。|p, gt|
|408|1033|隱藏稱號：閨中密友|隠しタイトル: 親友|—|
|409|1033|第三段戀情，還是走到了同樣的結局。「我愛上了你，你卻只把我當好姊妹。」——有些人註定是別人生命裡的過客。|3回目の関係もやはり同じ結末を迎えました。 「私はあなたのことを好きになったのに、あなたは私のことを良い妹としか思っていませんでした。」 - 他人の人生の通行人になる運命にある人もいます。|—|
|410|1035|單方面承認|一方的な承認|—|
|411|1035|她隔天透過經紀公司否認：「只是普通朋友。」據傳啦啦隊<b class="dn">禁愛令</b>壓力不小。你一個人站在風裡，超級尷尬。|翌日、彼女は所属事務所を通じて「普通の友達だよ」と否定した。噂ではチアリーディングチーム<b class="dn">恋愛禁止</b>とてもプレッシャーがあります。風の中一人で立っているのはとても恥ずかしいです。|—|
|412|1037|笑而不答，快步走過|微笑んでも答えず、早足で歩く|—|
|413|1037|不承認就沒有下文|認めない場合は一切フォローしません|—|
|414|1038|未完待續|つづく|—|
|415|1038|緋聞燒了三天就退燒。也許時機還沒到。|スキャンダル熱は3日後には治まった。まだその時が来ていないのかもしれない。|—|
|416|1043|新生命|新しい生活|—|
|417|1043|${L.partner} 平安生下你們的第 <b class="hl">${L.kids}</b> 個孩子。當了${L.kids>1?'幾次':''}爸爸的男人，眼神都不一樣了——${gt}。|${L.partner}第一子を無事出産<b class="hl">${L.kids}</b>子供です。終わり${L.kids>1?'幾次':''}父の男の目は違う――。${gt}。|L.partner, L.kids, L.kids>1?'幾次':'', gt|
|418|1049|客場飯店酒吧，${t} 傳來訊息：「睡了嗎？」|アウェイホテルのバー、${t}「眠っていますか？」というメッセージが来ました。|t|
|419|1050|赴約（賭一把）|約束を守る（ギャンブルをする）|—|
|420|1050|沒被抓到＝體力提升｜被抓到＝能力下跌、婚姻危機|捕まらない＝体力が上がる \|捕まる＝能力低下、夫婦の危機|—|
|421|1053|深夜行程|深夜の旅行|—|
|422|1053|你僥倖沒被拍到。不知為何，罪惡感反而讓你精神亢奮——${gt}。（你知道這不會有好下場）|写真に撮られなかったのは幸運でした。罪悪感がなぜか興奮してしまう――。${gt}。 (これがうまく終わらないことはわかっているでしょう)|gt|
|423|1056|回訊息：「陪小孩讀完故事書了，晚安」|返信メッセージ: 「子供と一緒に絵本を読み終えました、おやすみ。」|—|
|424|1056|家庭和睦，絕對不虧|家族円満は絶対損じゃないよ|—|
|425|1058|家的方向|ホーム方向|—|
|426|1058|你把手機扣在桌上，撥了視訊回家。${L.partner} 和孩子在鏡頭那頭揮手。心定了，身體就穩了——${gt}。|あなたは携帯電話をテーブルの上に置き、ビデオ通話をかけて家に帰りました。${L.partner}子どもと一緒にカメラに向かって手を振ります。心が穏やかだと体も安定する——${gt}。|L.partner, gt|
|427|1061|球場邊的父親|コート上の父|—|
|428|1061|你被拍到賽前隔著護網教孩子怎麼戴手套，影片配文「最強棒球教室」瘋傳。網友：「這才是人生勝利組。」——${gt}。|試合前に子供たちに防護ネット越しにグローブの付け方を教えているところを撮影され、その動画は「最強の野球教室」というキャプションとともに拡散しました。ネチズン：「これは人生の勝ち組だ。」——${gt}。|gt|
|429|1064|結婚紀念日|結婚記念日|—|
|430|1064|結婚紀念日，你推掉了自主訓練，陪 <b class="hl">${L.partner}</b> 回到當年辦婚禮的場地。她說：「明年也要來喔。」——${gt}。|結婚記念日に自主トレを諦めて私のところに残ってくれた<b class="hl">${L.partner}</b>結婚式が行われた会場に戻ります。彼女は「来年も来ます」と言いました。${gt}。|L.partner, gt|
|431|1075|隱藏屬性解鎖：渣男|隠し属性のロックが解除されました: Scumbag|—|
|432|1075|第二次被逮個正著。從今以後你在球迷心中的形象定型了——<b class="dn">每次外遇被抓到，全能力 −5</b>。|２度目の現行犯で捕まりました。これからファンの心の中にあるあなたのイメージが決定されていくのですが——<b class="dn">浮気がバレるたびに全ての能力が−5</b>。|—|
|433|1077|<b class="dn">全能力 −5</b>（渣男的代價）。|<b class="dn">フルアビリティ−5</b>（クズであることの代償）。|—|
|434|1079|頭版醜聞|一面スキャンダル|—|
|435|1079|狗仔的鏡頭比你想的更快，照片鋪滿版面。贊助商緊急撤圖，你在鏡頭前鞠躬 90 度。<b class="dn">${ABL[kk]} ${g}</b>。${extra}|パパラッチのカメラは思っているよりも速く、写真が紙面いっぱいに掲載されています。スポンサーが急きょ写真を引っ張り出し、カメラの前で90度お辞儀をする。<b class="dn">${ABL[kk]} ${g}</b>。${extra}|ABL[kk], g, extra|
|436|1080|${L.partner} 把離婚協議書放在餐桌上|${L.partner}離婚協議書を食卓に置く|L.partner|
|437|1081|跪著道歉，求她再給一次機會|ひざまずいて謝罪し、もう一度チャンスを与えてくれるように懇願します。|—|
|438|1081|成功保住婚姻｜失敗＝再扣能力並離婚|結婚生活を続けるのに成功｜失敗＝再び能力を失って離婚|—|
|439|1083|低谷之後|谷の後|—|
|440|1083|長談了一整夜。<b class="hl">${L.partner}</b> 最後說：「為了孩子，也為了那個我認識的你——最後一次。」婚姻保住了，但有些東西回不去了。|私たちは一晩中話し合った。<b class="hl">${L.partner}</b>最後に、彼はこう言った。「子供たちにとって、そして私が知っているあなた方にとって、これが最後です。」結婚生活は救われましたが、取り返しのつかないこともあります。|L.partner|
|441|1086|道歉無效|謝罪は無効です|—|
|442|1086|她聽完只是搖頭，隔天律師的存證信函就到了。<b class="hl">${ex}</b> 正式與你離婚，輿論二次發酵——<b class="dn">${ABL[k2]} ${g2}</b>。|これを聞いて彼女は首を横に振るだけで、翌日には弁護士の認定状が届きました。<b class="hl">${ex}</b>正式に離婚、二度目の世論発酵——<b class="dn">${ABL[k2]} ${g2}</b>。|ex, ABL[k2], g2|
|443|1087|簽字離婚|離婚に署名する|—|
|444|1088|離婚|離婚|—|
|445|1088|你在協議書上簽了名。<b class="hl">${ex}</b> 的聲明只有一句：「祝彼此安好。」|あなたは契約書に署名しました。<b class="hl">${ex}</b>声明には「お互いの幸せを祈っている」という一文だけが含まれていた。|ex|
|446|1092|交往第 ${L.dyrs} 年——${L.partner} 看著別人的婚禮影片看了很久|お問い合わせ番号${L.dyrs}年 - ${L.partner}他人の結婚式のビデオをずっと見ていた|L.dyrs, L.partner|
|447|1093|就是現在——求婚|今 - 提案する|—|
|448|1093|固定加成：全體力提升、本季更不容易受傷|固定ボーナス: 全体的な体力が向上し、今シーズン怪我をする可能性が低くなります|—|
|449|1096|婚禮|結婚式|—|
|450|1096|你在主場本壘板後方單膝跪地，大螢幕打出「Marry Me」。<b class="hl">${L.partner}</b> 哭著點頭。休賽季完婚，紅毯用壘包排成——${gTxt}本季受傷機率 <b class="up">−5%</b>。|あなたはホームベースの後ろで膝をついて、大きなスクリーンで「マリー・ミー」を再生しました。<b class="hl">${L.partner}</b>泣きながらうなずく。オフシーズンに結婚、レッドカーペットにはベースバッグが並んだ——${gTxt}今シーズンの怪我の可能性<b class="up">−5%</b>。|L.partner, gTxt|
|451|1097|再存一點錢吧|もっとお金を節約しましょう|—|
|452|1097|她沒說什麼,但交往越久分手風險越高|彼女は何も言いませんでしたが、付き合いが長くなればなるほど別れるリスクは高くなります。|—|
|453|1098|再等等|ちょっと待ってください|—|
|454|1098|她關掉影片，笑著說沒事。你假裝沒看到她眼裡的東西。|彼女はビデオをオフにして、笑顔で大丈夫だと言いました。あなたは彼女の目に何が映っているのか見て見ぬふりをしました。|—|
|455|1106|隱藏屬性解鎖：渣男|隠し属性のロックが解除されました: Scumbag|—|
|456|1106|第二次被逮個正著。從今以後你在球迷心中的形象定型了——<b class="dn">每次劈腿/外遇被抓到，全能力 −5</b>。|２度目の現行犯で捕まりました。これからファンの心の中にあるあなたのイメージが決定されていくのですが——<b class="dn">浮気・不倫がバレる度に全能力が－5</b>。|—|
|457|1108|<b class="dn">全能力 −5</b>（渣男的代價）。|<b class="dn">フルアビリティ−5</b>（クズであることの代償）。|—|
|458|1110|劈腿曝光|不正行為が暴露された|—|
|459|1110|行車紀錄器畫面流出，時間軸對得整整齊齊。<b class="dn">${ABL[kk]} ${g}</b>。${extra}|ドライブレコーダーの画面が流出し、タイムラインも綺麗に揃っていました。<b class="dn">${ABL[kk]} ${g}</b>。${extra}|ABL[kk], g, extra|
|460|1111|${L.partner} 已讀不回三天後，終於答應見面|${L.partner}3日後、ついに会うことに同意しました|L.partner|
|461|1112|道歉，求她再給一次機會|謝罪してもう一度チャンスを彼女に懇願する|—|
|462|1112|成功保住感情｜失敗＝再扣能力並分手|関係を保存することに成功｜失敗＝再び能力を失って別れる|—|
|463|1114|低谷之後|谷の後|—|
|464|1114|她哭著罵完，最後說：「最後一次。」感情保住了，但信任的裂痕補不回來。|彼女は泣きながら悪態をつき、最後にこう言いました。「これが最後だ」。関係は保たれたが、信頼の溝は修復できなかった。|—|
|465|1117|道歉無效|謝罪は無効です|—|
|466|1117|她把你送的東西整箱寄回。<b class="hl">${ex}</b> 封鎖了所有聯絡方式——<b class="dn">${ABL[k2]} ${g2}</b>。|彼女はあなたが送ったものを箱ごと送り返しました。<b class="hl">${ex}</b>すべての連絡方法がブロックされています——<b class="dn">${ABL[k2]} ${g2}</b>。|ex, ABL[k2], g2|
|467|1118|坦然分手|穏やかに別れる|—|
|468|1120|分手|別|—|
|469|1120|<b class="hl">${ex}</b> 的限時動態只有一片黑。粉絲全都知道是誰的錯。|<b class="hl">${ex}</b>期間限定のダイナミックは黒のみです。ファンは皆、誰のせいなのか知っています。|ex|
|470|1126|<b class="up">${ABL[k]} +${g}</b>（溢出 ${over} 點轉為本季成績加成）|<b class="up">${ABL[k]} +${g}</b>（オーバーフロー${over}ポイントは今シーズンのパフォーマンスボーナスに変換されます）|ABL[k], g, over|
|471|1128|<b class="up">本季成績加成 +${over}</b>（${ABL[k]} 已達潛力上限）|<b class="up">今季成績ボーナス＋${over}</b>（${ABL[k]}潜在的な限界に達しました)|over, ABL[k]|
|472|1129|${ABL[k]} 能力加點，但不足以提升一級|${ABL[k]}アビリティポイントは加算されるが、レベルアップするには不十分|ABL[k]|
|473|1153|<span class="up">狀態火燙（本季成績加成 ×${pts}）</span>|<span class="up">ホットステータス（今シーズンのスコアボーナス×）${pts}）</span>|pts|
|474|1160|保守應對|保守的な反応|—|
|475|1161|全力一搏|全力を尽くしてください|—|
|476|1165|宵夜文化|深夜のおやつ文化|—|
|477|1165|場外代言邀約|オフサイトの承認への招待|—|
|478|1187|${ABL[k]}：能力加點，但不足以提升一級|${ABL[k]}：アビリティポイントは加算されますが、レベルアップには不十分です。|ABL[k]|
|479|1195|本季受傷機率 <span class="dn">+${v}%</span>|今シーズンの怪我の可能性<span class="dn">+${v}%</span>|v|
|480|1199|事件卡｜|イベントカード｜|—|
|481|1200|${good?ev.gt:ev.bt}。${mode==='bold'&&good?'<b class="hl">豪賭成功！</b>':''}${mode==='bold'&&!good?'<b class="dn">豪賭失敗……</b>':''}<br>${out.join('｜')\|\|'（能力加點，但不足以提升一級）'}|${good?ev.gt:ev.bt}。${mode==='bold'&&good?'<b class="hl">豪賭成功！</b>':''}${mode==='bold'&&!good?'<b class="dn">豪賭失敗……</b>':''}<br>${out.join('｜')\|\|'（能力加點，但不足以提升一級）'}|good?ev.gt:ev.bt, mode==='bold'&&good?'<b class="hl">豪賭成功！</b>':'', mode==='bold'&&!good?'<b class="dn">豪賭失敗……</b>':'', out.join('｜')\|\|'（能力加點，但不足以提升一級）'|
|482|1216|大巧不工|素晴らしいスキルだが職人技はない|—|
|483|1216|連續三年，你把所有汗水都澆在同一個工具上——<b class="hl">季初系統會自動擲 1 顆骰，永遠加在你專精的「${ABL[S.comboKey]}」上</b>。專精者的複利。|3年連続、同じ道具に汗を流した――。<b class="hl">シーズンの開始時に、システムは自動的に 1 つのサイコロを振り、それが常にあなたの専門分野に追加されます。${ABL[S.comboKey]}"優れた</b>。専門家にとっては複利。|ABL[S.comboKey]|
|484|1227|${ABL[k]} <b class="up">+5</b>（潛力上限 +10 → ${S.pot[k]}）|${ABL[k]} <b class="up">+5</b>(最大潜在力+10 →${S.pot[k]}）|ABL[k], S.pot[k]|
|485|1228|隱藏素質解鎖：大器晚成|隠された資質のロックが解除される: 大器晩成型|—|
|486|1228|別人都以為你到頂了，你卻在這一年脫胎換骨——從今以後，每一顆訓練骰<b class="hl">永久固定 3 點以上</b>，事件卡好結果機率提升至 <b class="hl">70%</b>。|他の人はあなたが頂点に達したと思っていましたが、あなたは今年完全に変わりました - これからは、すべてのトレーニングダイスが<b class="hl">3点以上で永久固定</b>、イベントカードの結果が良好になる確率が に増加します。<b class="hl">70%</b>。|—|
|487|1228|潛能重新被評估：${bl.join('、')}。|可能性の再評価:${bl.join('、')}。|bl.join('、')|
|488|1228|你的故事，才正要展開。|あなたの物語はまさにこれから展開されようとしています。|—|
|489|1234|自律狂|自己規律マニア|—|
|490|1234|你見過凌晨四點的洛杉磯嗎？——年紀輕輕就把身體當成聖殿經營，沒有派對、沒有酒精，只有重訓室的鐵片聲：<b class="hl">整條衰退曲線延後兩年</b>，你的巔峰比同梯更長。|朝の4時にロサンゼルスを見たことがありますか? ——若い頃から、彼は自分の体を神殿のように扱っています。パーティも酒もなし、トレーニングルームには鉄の音だけが響く。<b class="hl">景気後退曲線全体が2年遅れる</b>、あなたのピークは他の人よりも長いです。|—|
|491|1237|大心臟|大きな心|—|
|492|1237|大心臟|大きな心|—|
|493|1237|經歷了無數次的豪賭，你的心態堅毅無比，無論甚麼事情都不可能讓你心驚膽跳，從此以後，賭得更多，得到更多，輸得更少。——<b class="hl">「全力一搏」成功率提升至天才級、成功加成 +4、失敗只 −2、受傷風險降到普通級</b>，總冠軍與國際賽 MVP 機率提升。|数え切れないほどのギャンブルを経て、あなたのメンタルは非常に強くなります。何が起こっても、怯えることは不可能です。これからは、より多くのギャンブルをし、より多くの利益を得て、より少ない損失を得るでしょう。 ——<b class="hl">「Go All Out」の成功率が天才レベルに上昇し、成功ボーナスが+4、失敗率が-2、怪我のリスクが通常レベルに減少します。</b>、チャンピオンシップや国際大会MVPを獲得する可能性が高まります。|—|
|494|1240|外務纏身|外交問題で困っている|—|
|495|1240|通告、代言、社群媒體佔據了你太多心神，休賽季很久沒有完整專注在棒球上——<b class="dn">季初擲骰永久 −1 顆</b>（最低 2 顆）。|アナウンスや応援、ソーシャルメディアに気を取られすぎて、オフシーズン中は長い間野球に完全に集中できていなかった——<b class="dn">シーズン開始ロールの永続値 -1</b>(最低 2)。|—|
|496|1243|更衣室毒瘤|ロッカールームのがん|—|
|497|1243|教練受夠了你的不可控，隊友對你的新聞指指點點。比起成績，球團現在更想清理休息室的氣氛——<b class="dn">季中被交易機率大增、續約條件惡化</b>。|コーチはあなたがコントロール不能で、あなたのチームメイトがあなたのニュースを非難していることにうんざりしています。チームは今、結果を出すことよりも、ラウンジの雰囲気をきれいにしたいと考えている——<b class="dn">シーズン途中にトレードされる可能性が高まり、契約更改条件も悪化する。</b>。|—|
|498|1246|台中猛瑪|台中のマンモス|—|
|499|1246|猛瑪|マンモス|—|
|500|1246|府城雄獅|フーチェン ライオン|—|
|501|1246|雄獅|ライオン|—|
|502|1246|桃園金剛|桃園キングコング|—|
|503|1246|金剛|キングコング|—|
|504|1246|新北騎士|ニュータイペイナイツ|—|
|505|1246|騎士|騎士|—|
|506|1246|台北恐龍|台北の恐竜|—|
|507|1246|恐龍|恐竜|—|
|508|1246|高雄神鵰|高雄神鷲|—|
|509|1246|神鵰|神鷲|—|
|510|1248|波士頓襪王|ボストンソックスのキング|—|
|511|1248|紅襪王|レッドソックスのキング|—|
|512|1248|風城襪王|ウィンディシティ ソックスキング|—|
|513|1248|白襪王|ホワイトソックスのキング|—|
|514|1248|東京大人|東京様|—|
|515|1248|東京大人|東京様|—|
|516|1248|灣區大人|ベイエリアの大人|—|
|517|1248|灣區大人|ベイエリアの大人|—|
|518|1250|競技者|競合他社|—|
|519|1250|競技者|競合他社|—|
|520|1250|沙漠眼鏡蛇|砂漠のコブラ|—|
|521|1250|眼鏡蛇|コブラ|—|
|522|1274|更衣室毒瘤|ロッカールームのがん|—|
|523|1275|用成績說話|自分の成果を自分自身に語らせましょう|—|
|524|1275|你用一整季的表現堵住了所有人的嘴——<b class="hl">更衣室毒瘤洗刷</b>。當初拒絕下放的決定，被證明是對的。|あなたはシーズンを通してそのパフォーマンスでみんなの口を塞ぎました——<b class="hl">ロッカールームの腫瘍浄化</b>。地方分権を拒否するという当初の決定は正しかったことが判明した。|—|
|525|1276|守住身價|自分の価値を維持する|—|
|526|1276|你證明了自己還配得上這份合約。|あなたはこの契約にふさわしい人物であることを証明しました。|—|
|527|1279|隱藏屬性解鎖：薪水小倫|隠し属性のロックが解除されました: 給与 Xiao Lun|—|
|528|1279|拒絕下放後，你的成績依然沒有起色。球迷開始在社群叫你「薪水小倫」——<b class="dn">事件卡失敗率永久 +10%</b>，這個名聲跟著你到退休。|委任を拒否した後も成績が上がらない。ファンはコミュニティ内であなたを「サラリー・シャオ・ルン」と呼び始めました——<b class="dn">イベントカード失敗率永続+10%</b>、この評判は退職するまで続きます。|—|
|529|1280|薪水小倫|給与 シャオ・ルン|—|
|530|1280|又是虛擲的一年。看台上的噓聲更大了。|また無駄な一年だった。スタンドのブーイングはさらに大きくなった。|—|
|531|1292|非賣品|非売品|—|
|532|1292|他隊捧著誘人的包裹來詢價，高層連會議都沒開就回絕了——<b class="hl">「他是這座城市的象徵，非賣品。」</b>|彼のチームは魅力的なパッケージを持って問い合わせに来たが、上層部は会議も開かずにそれを拒否した——<b class="hl">「彼はこの街のシンボルであり、売り物ではありません。」</b>|—|
|533|1297|毒瘤交易|がんとの取引|—|
|534|1297|球團受夠了休息室的氣氛，直接把你打包送走。|チームはラウンジの雰囲気にうんざりし、あなたに荷造りをさせました。|—|
|535|1298|交易大限：他隊送來報價，球團徵詢你的否決權|トレード期限: 相手チームがオファーを送信し、チームはあなたの拒否権を要求します。|—|
|536|1299|點頭同意，換個環境|同意してうなずき、環境を変える|—|
|537|1299|轉隊|チームを変更する|—|
|538|1299|你打包行李，前往新的城市。|荷物をまとめて新しい街へ向かいます。|—|
|539|1300|行使否決權，我要留下|拒否権を行使します、私は残りたいです|—|
|540|1300|未來 2 年冠軍機率略降、下張合約薪水 −15%|今後２年間の優勝確率は若干下がり、次契約の年俸は－１５％となる。|—|
|541|1301|否決交易|取引を拒否する|—|
|542|1301|你按下否決鍵。忠誠是一種選擇——球團的重建計畫被你打亂了，短期戰力和你的下張合約都會付出一點代價，但這件球衣，你留下來了。|拒否ボタンを押しました。忠誠心は選択です - チームの再建計画はあなたによって妨害され、短期的な戦闘効果と次の契約には多少の費用がかかりますが、あなたはこのジャージを使い続けました。|—|
|543|1305|交易傳言：媒體報導你可能被交易|トレードの噂: あなたがトレードされる可能性があるとメディアが報道|—|
|544|1306|公開抱怨表達不滿|不満を表明するために公に苦情を言う|—|
|545|1306|增加本次被交易的可能性|今度は取引される可能性が高まります|—|
|546|1309|隱藏屬性解鎖：氣氛大師|隠し属性のロックが解除されました: アトモスフィア マスター|—|
|547|1309|你又一次對媒體大吐苦水。球團高層看在眼裡——這種選手，留著也是不定時炸彈。<b class="dn">往後轉隊機率永久提高</b>。|またしてもメディアに対して暴言を吐いていますね。チームのトップマネジメントは、この種の選手が引き留められれば時限爆弾になることを目の当たりにしている。<b class="dn">将来的にチームを変更する可能性は恒久的に増加する</b>。|—|
|548|1310|弄假成真|偽りを現実にする|—|
|549|1310|你的抱怨上了頭條，球團順勢把你送走。新東家，好好打吧。|あなたの苦情は見出しになり、チームはあなたを追い出しました。新しいオーナーさん、頑張っていきましょう。|—|
|550|1311|雷聲大雨點小|雷はすごいけど雨は少ない|—|
|551|1311|抱怨歸抱怨，這次交易最後沒有成局。你還在原隊，但氣氛有點僵。|苦情は苦情、この取引は結局実現しませんでした。あなたはまだ元のチームにいますが、雰囲気は少し緊張しています。|—|
|552|1313|保持沉默，專心打球|黙ってボール遊びに集中してください|—|
|553|1313|交易機率不變|取引確率は変わらない|—|
|554|1314|交易成局|取引は完了しました|—|
|555|1314|儘管你不動聲色，球團還是完成了這筆交易。'|あなたの沈黙にもかかわらず、チームは取引を完了しました。 '|—|
|556|1315|留了下來|泊まった|—|
|557|1315|傳言就是傳言。新球季，你還是穿著同一件球衣。|噂はあくまで噂です。新しいサッカーシーズンでも、同じジャージを着ます。|—|
|558|1333|健康回報|健康の回復|—|
|559|1333|本季平安出賽。（受傷機率 ${p}%）|シーズン開幕を無事に。 （怪我の確率${p}%）|p|
|560|1337|小傷|軽傷|—|
|561|1337|肌肉拉傷進了傷兵名單，本季出賽量預估減少 <b class="dn">${cut}%</b>。${injStatLoss(false)}|肉離れで故障者リスト入りしており、今季は試合数が減る見込みだ。<b class="dn">${cut}%</b>。${injStatLoss(false)}|cut, injStatLoss(false)|
|562|1342|重大傷勢——進手術室了。<b class="dn">賽季提前報銷</b>（本季留下 ${played}% 的出賽紀錄）。|大怪我 - 手術室に入る。<b class="dn">シーズン初期の払い戻し</b>(今シーズンも滞在${played}棋譜の%）。|played|
|563|1343|醫生搖搖頭：<b class="dn">明年也很難趕上開季</b>（明年整季報廢）。|医者は首を横に振った：<b class="dn">来年のシーズン開幕までに追いつくのは難しいだろう</b>(来年には四半期全体が廃止される予定です)。|—|
|564|1344|大傷|重傷|—|
|565|1347|隱藏素質解鎖：玻璃人|隠された品質のロックが解除されました: ガラスの男|—|
|566|1347|生涯第二次大傷。從此傷病如影隨形，未來每季受傷機率<b class="dn">不低於 40%</b>。|キャリアで2度目の大怪我。それ以来、怪我が続いており、今後もシーズンごとに怪我が発生する可能性があります<b class="dn">40%以上</b>。|—|
|567|1349|醫療團隊評估|医療チームの評価|—|
|568|1349|「這是歲月的損耗，不是體質問題。」——老將的傷,球團看得比誰都開。|「これは経年劣化であり、物理的な問題ではありません。」 - チームは誰よりもベテランの怪我に対してオープンな目で見ています。|—|
|569|1355|重大傷勢重創身體素質：<b class="dn">全能力 −5</b>。|大きな怪我は体力に深刻なダメージを与えます：<b class="dn">フルアビリティ−5</b>。|—|
|570|1362|傷勢留下後遺症：<b class="dn">${ABL[k]} −${amt}</b>。|その怪我は後遺症を残しました：<b class="dn">${ABL[k]} −${amt}</b>。|ABL[k], amt|
|571|1365|整季只能在場邊看著隊友比賽。|シーズン中、私はチームメイトのプレーをサイドラインから見ることしかできませんでした。|—|
|572|1366|傷缺全季|怪我でシーズン全休|—|
|573|1367|成棒甲組春季聯賽|リーグ 1 春季リーグ|—|
|574|1367|成棒甲組秋季聯賽|社会人野球A部秋季リーグ戦|—|
|575|1373|冠軍|チャンピオン|—|
|576|1373|亞軍|準優勝|—|
|577|1373|四強|準決勝|—|
|578|1373|八強|準々決勝|—|
|579|1373|十六強|トップ16|—|
|580|1373|預賽出局|予選落ち|—|
|581|1375|${c}：<b class="hl">${rk}</b>（+${pts} 點）|${c}：<b class="hl">${rk}</b>（+${pts}ポイント）|c, rk, pts|
|582|1376|冠軍|チャンピオン|—|
|583|1377|隱藏屬性解鎖：學院派|隠された属性のロックが解除されました: アカデミー|—|
|584|1377|大學殿堂的科學化訓練與防護打下扎實基礎——<b class="hl">25 歲前受傷率 −5%、季初擲骰期望值提升</b>。|大学ホールでの科学的訓練と保護が強固な基盤を築く——<b class="hl">25歳までの負傷率は-5%、シーズン初期ロールの期待値が増加</b>。|—|
|585|1378|${S.year} ${c}冠軍|${S.year} ${c}チャンピオン|S.year, c|
|586|1381|年度大賽|毎年恒例のコンテスト|—|
|587|1381|<div class="statline">獲得能力點 ${gain} 點，季末統一分配。能力越高，大賽收穫越多。</div>|<div class="statline">アビリティポイントを獲得する${gain}ポイントは四半期の終わりに一律に配布されます。あなたの能力が高ければ高いほど、競争からより多くのことを得ることができます。</div>|gain|
|588|1435|全力投|オールイン|—|
|589|1435|普通投|通常投資|—|
|590|1435|養生球|ヘルスボール|—|
|591|1445|球季數據|シーズンデータ|—|
|592|1445|（傷缺，本季無出賽紀錄）|（今季は怪我、戦績なし）|—|
|593|1448|球季數據（季中轉隊）|シーズンデータ（シーズン途中の移籍）|—|
|594|1451|<span class="tag">合計</span><div class="statline">${statLine(st)}</div>|<span class="tag">合計</span><div class="statline">${statLine(st)}</div>|statLine(st)|
|595|1453|球季數據|シーズンデータ|—|
|596|1456|巨大的低潮|巨大な最低点|—|
|597|1456|身體狀況很好，但是成績一直打不出來，遇到了巨大的低潮。孤獨、無助，就像是溺水一樣，只能隨意抓取孤木。|体調はとても良かったのですが、成績は決して良くなく、大スランプに見舞われました。孤独で無力、それは溺れているようなもので、孤独な木を自由につかむことしかできません。|—|
|598|1458|生涯年|キャリア年数|—|
|599|1458|縫線掠過指尖的感覺無與倫比，而你投出去的球像是有了生命，用一個無人能想像得到的角度，閃過了打者的球棒，並穩穩投進捕手的手套。|指先を通る縫い目の感触は他に類を見ないもので、投げたボールは命が吹き込まれたようで、誰も想像できない角度で打者のバットを回避し、しっかりとキャッチャーのグラブに収まります。|—|
|600|1459|生涯年|キャリア年数|—|
|601|1459|投來的每顆球看起來都像籃球一樣大，你看得到縫線、球的轉動，就和駭客任務的子彈一樣慢了下來，而你每一顆擊中甜蜜點的球，都往全壘打牆奔去。|飛んでくるボールはどれもバスケットボールと同じくらい大きく、縫い目が見え、ボールは回転し、『マトリックス』の弾丸のように減速し、スイートスポットに当たったボールはすべてホームランの壁に向かっています。|—|
|602|1462|傷缺全季|怪我でシーズン全休|—|
|603|1468|隱藏素質解鎖：鐵人|隠された品質のロックが解除される: アイアンマン|—|
|604|1468|連續五年全勤級出賽！鋼鐵般的身體，未來每季受傷機率<b class="hl">不高於 10%</b>。|5年連続皆勤賞！鋼の肉体、今後も毎シーズン怪我の可能性<b class="hl">10%以下</b>。|—|
|605|1475|只會這個|これだけ|—|
|606|1476|只會這個|これだけ|—|
|607|1480|只會這個|これだけ|—|
|608|1480|歲月帶走了你的其他工具，只剩<b class="hl">${role}</b>那一項本領還在。教練把你當成板凳上的秘密武器——關鍵時刻，你仍然可靠。|時間が他のツールを奪い去り、唯一残るのは<b class="hl">${role}</b>そのスキルは今でも健在です。コーチはベンチであなたを秘密兵器として扱います - あなたは依然として重要な瞬間に信頼できます。|role|
|609|1482|只會這個|これだけ|—|
|610|1482|你只有一項武器強得誇張，其餘全是破洞。教練不敢讓你先發，只在關鍵時刻派你上去做一件事——你成了球隊的<b class="hl">${role}</b>。出賽數銳減，但那一項本領無人能及。|とんでもなく強力な武器が 1 つだけあり、残りはただの穴です。コーチはあなたに先発させようとはせず、重要な瞬間にただ一つのことだけをやらせる、それはあなたがチームのリーダーになるということです。<b class="hl">${role}</b>。出場試合数は激減したが、その実力は比類ない。|role|
|611|1484|只會這個|これだけ|—|
|612|1485|不再是工具人|もはや道具屋ではない|—|
|613|1485|教練終於敢把你放進先發打線——你證明了自己不只是板凳上的一招鮮。<b class="hl">「只會這個」解除</b>，你是個完整的球員了。|コーチはついにあなたをスタートラインに立たせました。あなたは単にベンチにいたばかりの新参者ではないことを証明しました。<b class="hl">「これだけは知っている」は中止</b>, これであなたは完全なプレイヤーです。|—|
|614|1492|中職|中等専門学校|—|
|615|1492|日職|日本の仕事|—|
|616|1492|大聯盟|メジャーリーグ|—|
|617|1507|台中猛瑪|台中のマンモス|—|
|618|1509|${y} ${lgN}明星賽|${y} ${lgN}オールスターゲーム|y, lgN|
|619|1509|台中猛瑪|台中のマンモス|—|
|620|1509|（人氣入選）|(人気セレクション)|—|
|621|1515|${y} ${lgN}新人王|${y} ${lgN}新人王|y, lgN|
|622|1520|年度最佳投手|今年の投手|—|
|623|1529|${y} ${lgN}救援王|${y} ${lgN}レスキューキング|y, lgN|
|624|1534|${y} ${lgN}中繼王|${y} ${lgN}リレー王|y, lgN|
|625|1539|${y} ${lgN}三振王|${y} ${lgN}三振王|y, lgN|
|626|1547|${y} ${lgN}打擊王|${y} ${lgN}ストライクキング|y, lgN|
|627|1552|${y} ${lgN}全壘打王|${y} ${lgN}ホームラン王|y, lgN|
|628|1557|${y} ${lgN}盜壘王|${y} ${lgN}盗み王|y, lgN|
|629|1562|${y} ${lgN}打點王|${y} ${lgN}打点王|y, lgN|
|630|1568|${y} ${lgN}上壘王|${y} ${lgN}出塁王|y, lgN|
|631|1574|${y} ${lgN}金手套|${y} ${lgN}ゴールデングローブ|y, lgN|
|632|1578|${y} ${lgN}守備王|${y} ${lgN}ディフェンスキング|y, lgN|
|633|1592|${y} ${lgN}年度MVP|${y} ${lgN}年間MVP|y, lgN|
|634|1597|年度獎項|年間賞|—|
|635|1598|失憶症|健忘症|—|
|636|1598|走出陰影|影から出てきて|—|
|637|1598|站上大舞台拿下獎項的那一刻，腦海裡的雜音消失了——<b class="hl">失憶症痊癒</b>。|大舞台に立って賞を受賞した瞬間、心のノイズは消えた――。<b class="hl">健忘症が治った</b>。|—|
|638|1600|玻璃人|ガラスの男|—|
|639|1602|隱藏屬性解鎖：浴火重生|隠された属性のロックが解除されました: 灰からの復活|—|
|640|1602|那些殺不死你的，真的讓你更強大了。撕裂的韌帶長成更堅韌的形狀——<b class="hl">玻璃人懲罰解除，受傷率恢復正常，並獲得一大筆能力點</b>。|あなたを殺さないものは本当にあなたを強くします。引き裂かれた靭帯はより強い形に成長します -<b class="hl">ガラスマンのペナルティが解除され、負傷率が通常に戻り、大量の能力ポイントが獲得されます。</b>。|—|
|641|1609|世界棒球經典賽|ワールドベースボールクラシック|—|
|642|1609|世界12強賽|ワールドトップ12トーナメント|—|
|643|1614|體育署公文|スポーツ局からの公式文書|—|
|644|1615|「查 台端符合國家代表隊遴選資格，依規定<b class="hl">強制徵召</b>，並自即日起<b class="hl">列管五年</b>，列管期間各國際賽事皆須配合徵召，不得以任何理由推辭。」——你甚至還沒拆完信封，行李箱已經被球團打包好了。|「チャタイ・ドゥアンは代表チーム選出の資格を満たしている。規定によれば、<b class="hl">強制採用</b>、そしてこれからも<b class="hl">5年間の経営</b>, すべての国際大会は日程期間中の招集に協力しなければならず、いかなる理由でも拒否することはできない。 「——封筒も開け終わっていないのに、スーツケースはすでに球団によって詰められています。|—|
|645|1616|列管期間（剩 ${5-(S.year-S.intlLock)} 年），依規定<b class="hl">強制徵召</b>。你沒有選擇。|後見人期間中（残りの期間）${5-(S.year-S.intlLock)}年）、規制に従って<b class="hl">強制採用</b>。選択の余地はありません。|5-(S.year-S.intlLock)|
|646|1619|⋯⋯只能報到（強制徵召）|⋯⋯登録のみ（必須募集）|—|
|647|1619|披上國家隊戰袍|代表チームのジャージを着て|—|
|648|1619|依成績獲得能力點｜下季受傷機率 +10%|成績に応じてアビリティポイント獲得｜来シーズン負傷確率+10%|—|
|649|1623|冠軍|チャンピオン|—|
|650|1623|亞軍|準優勝|—|
|651|1623|季軍|準優勝|—|
|652|1623|複賽止步|再戦で止まった|—|
|653|1623|預賽出局|予選落ち|—|
|654|1628|隱藏稱號：Team Taiwan|隠しタイトル: チーム台湾|—|
|655|1628|永遠把國家榮耀放在比職涯更高的位子，台灣球迷的心中永遠有一幅畫：你在球場上向全場比劃著胸口，那是你心中最榮耀的地方。|常に国家の栄光を自分のキャリアよりも高い位置に置くと、台湾のファンの心の中にはいつも胸でコート上の観客にジェスチャーする姿が残るだろう、それがあなたの心の中で最も輝かしい場所だ。|—|
|656|1647|隱藏屬性解鎖：國際賽之鬼|隠された属性のロックが解除されました: 国際コンテストのゴースト|—|
|657|1647|只要穿上 CT 球衣，你的痛覺就會消失——你是為大場面而生的男人。<b class="hl">國際賽不再增加受傷風險，且每次徵召能力點保底 +2</b>。|CT ジャージを着るだけで痛みは消えます。あなたは偉大な人生を歩むために生まれてきた男です。<b class="hl">国際試合で怪我のリスクが高まることはなくなり、招集ごとに能力ポイント +2 が保証されます</b>。|—|
|658|1649|你被選為<b class="hl">賽會MVP</b>！|あなたは選ばれました<b class="hl">大会MVP</b>！|—|
|659|1650|中華隊最終成績：<b class="hl">${rk}</b>。${ex}獲得能力點 <b class="hl">${gpts}</b> 點。${S.traits.intlace?'國家英雄不知何謂疲憊。':'國際賽的高強度消耗，讓下季受傷風險上升。'}|チャイニーズタイペイ代表の最終成績は<b class="hl">${rk}</b>。${ex}能力ポイントを<b class="hl">${gpts}</b>獲得。${S.traits.intlace?'国民的英雄は疲れを知らない。':'国際大会での激闘により、来季の故障リスクが上昇した。'}|rk, ex, gpts, S.traits.intlace?'國家英雄不知何謂疲憊。':'國際賽的高強度消耗，讓下季受傷風險上升。'|
|660|1653|以調整為由婉拒|調整のためお断りしました|—|
|661|1653|列管期已過，終於能說不|管理期間が過ぎ、ようやくノーと言えるようになりました。|—|
|662|1654|中華隊徵召 · ${name}|中国チーム募集・${name}|name|
|663|1668|中職總冠軍|中等職業選手権大会|—|
|664|1668|日本一|ジャパンワン|—|
|665|1668|世界大賽冠軍|ワールドシリーズチャンピオン|—|
|666|1669|<br>球隊奪下 <b class="hl">${cN}</b>，全城陷入瘋狂！|<br>チームが勝ちました<b class="hl">${cN}</b>、街全体が狂気に陥った！|cN|
|667|1672|季末結算|四半期末決済|—|
|668|1672|本年度薪資：<b class="hl">${fmtMoney(sal)}</b>（生涯累計 ${fmtMoney(Math.round(S.salary))}）${S.ct?|今年の給料:<b class="hl">${fmtMoney(sal)}</b>（キャリアの積み重ね${fmtMoney(Math.round(S.salary))}）${S.ct?|fmtMoney(sal), fmtMoney(Math.round(S.salary))|
|669|1677|▸ 分配能力點（${p} 點·大賽／國際賽成果）|▸ 能力ポイントを割り当てる (${p}ポイント・コンテスト/国際大会結果）|p|
|670|1677|季末能力點分配（大賽／國際賽成果）|シーズン終了後の能力ポイント配分（大会・国際大会結果）|—|
|671|1686|選秀多年落榜，|長年ドラフトに落ち続けた後、|—|
|672|1686|年結束球員身分，轉任基層教練。|年末には選手となり、草の根コーチとなった。|—|
|673|1687|業餘年度結束|アマチュアの年の終わり|—|
|674|1688|再次投入中職選秀|再び二次職業ドラフトに入る|—|
|675|1689|高掛球鞋|ハイハンギングスニーカー|—|
|676|1689|在業餘球隊劃下句點。|アマチュアチームの終焉。|—|
|677|1694|能力已跌破中職二軍最低水準，|彼の能力は中等職業訓練と中等軍の最低レベルを下回っている。|—|
|678|1694|年球季後遭釋出，被迫引退。|彼はシーズン終了後に釈放され、引退を余儀なくされた。|—|
|679|1703|台中猛瑪|台中のマンモス|—|
|680|1703|台中猛瑪|台中のマンモス|—|
|681|1704|隱藏屬性解鎖：黃金聖衣|隠し属性解放：黄金聖闘士聖衣|—|
|682|1704|效力 台中猛瑪 滿十年，你已是這支球隊的象徵。披上那件黃金戰袍，你就是主場的信仰。|台中マンモスで10年間プレーした後、あなたはこのチームの象徴になりました。その黄金のジャージを着れば、あなたはホームチームの信頼となります。|—|
|683|1706|隱藏屬性解鎖：神主牌|隠し属性解放：神カード|—|
|684|1706|這座城市的球迷看著你長大。球團高層很清楚，放你走球迷會把主場拆了——<b class="hl">母隊續約年薪係數固定 ≥×1.2，引退評價加成</b>。|この街のファンはあなたの成長を見守ってきました。チームの上層部は、あなたを手放したらファンがホームコートを破壊することをよく知っています――。<b class="hl">親球団更新時の年俸係数は1.2倍以上で固定、退職評価賞与は</b>。|—|
|685|1710|隱藏稱號：|隠しタイトル:|—|
|686|1710|先生|紳士|—|
|687|1710|十五個年頭，同一件球衣。球迷不再喊你的名字，他們喊你「<b class="hl">${nick}先生</b>」——你就是這支球隊的代名詞。|15年間、同じジャージ。ファンはもうあなたの名前を呼ぶのではなく、あなたを「」と呼びます。<b class="hl">${nick}紳士</b>「——あなたはこのチームの代名詞です。|nick|
|688|1713|中職|中等専門学校|—|
|689|1713|日職|日本の仕事|—|
|690|1713|大聯盟|メジャーリーグ|—|
|691|1717|隱藏稱號：|隠しタイトル:|—|
|692|1717|七彩球衣|カラフルなジャージ|—|
|693|1717|打開衣櫃，${n} 件不同的球衣掛在眼前——${RB[lg][0]}的球隊你快穿過一輪了。球迷笑稱你是「<b class="hl">七彩球衣</b>」：去到哪裡都能活下來，這也是一種本事。|クローゼットを開けて、${n}目の前には違うジャージがぶら下がっている——${RB[lg][0]}あなたのチームはもうすぐラウンドを終えます。ファンは冗談であなたを「」と呼びます。<b class="hl">カラフルなジャージ</b>": どこに行っても生きていけるのもスキルです。|n, RB[lg][0]|
|694|1744|球團評估|ペレットの評価|—|
|695|1744|體能檢測數字亮紅燈，但你用<b class="hl">實際成績</b>說話——本季表現達聯盟水準，球團決定續留一線觀察。|体力テストの番号が赤く点灯しますが、<b class="hl">実績</b>トーク - 今シーズンのパフォーマンスはリーグレベルに達しており、チームは観察のために第一線に留まることにしました。|—|
|696|1747|球團評估|ペレットの評価|—|
|697|1747|帳面數據遠低於聯盟水準，教練團失去耐心。|本のデータはリーグレベルを大きく下回っており、コーチングスタッフは忍耐力を失っている。|—|
|698|1756|升級通知|アップグレードの通知|—|
|699|1756|表現獲得肯定，${to!==nx?'<b class="hl">連跳兩級</b>':'晉升'} <b class="hl">${LV[to].n}</b>！|パフォーマンスが認められ、${to!==nx?'<b class="hl">連跳兩級</b>':'晉升'} <b class="hl">${LV[to].n}</b>！|to!==nx?'<b class="hl">連跳兩級</b>':'晉升', LV[to].n|
|700|1757|失憶症|健忘症|—|
|701|1757|走出陰影|影から出てきて|—|
|702|1757|重回上一層舞台，你終於找回了節奏——<b class="hl">失憶症痊癒</b>。|前の段階に戻って、ようやく自分のリズムを掴んだ——<b class="hl">健忘症が治った</b>。|—|
|703|1769|球團續約|チーム契約更新|—|
|704|1769|你仍在選秀球隊掌控期（服務 ${S.svc}/5 年），球團行使續約權——續 <b class="hl">${S.ct.yrs} 年</b>，薪資照層級基數。|あなたはまだドラフトチームをコントロールしています（サービス${S.svc}/5年)、チームは契約を更新する権利を行使 - 続き<b class="hl">${S.ct.yrs}年</b>、給与はレベルベースに基づいています。|S.svc, S.ct.yrs|
|705|1783|合約全額給付|契約金全額支払い|—|
|706|1783|合約還有 <b class="hl">${remain} 年</b>，但這次不是你要走——球團主動終止合約，依約剩餘薪資<b class="hl">十成全額</b>給付，<b class="hl">${fmtMoney(total)}</b> 一次入帳。白紙黑字的長約，在此刻護住了你。|まだ契約が残っている<b class="hl">${remain}年</b>, しかし、今回辞めたいのはあなたではありません - チームは積極的に契約を終了し、契約に従って残りの給与を支払います。<b class="hl">100%フル</b>支払い、<b class="hl">${fmtMoney(total)}</b>エントリーは1回限り。白黒で書かれた長期契約が今この瞬間もあなたを守ってくれます。|remain, fmtMoney(total)|
|707|1784|合約買斷|契約買収|—|
|708|1784|你仍在合約中，球團依約買斷剩餘 <b class="hl">${remain} 年</b>合約——雙方談定以 <b class="hl">七成</b> 價碼結清，<b class="hl">${fmtMoney(total)}</b> 一次入帳。合約精神，該給的一毛不少。|あなたはまだ契約中であり、チームは合意に従って残りを買い取ることになります。<b class="hl">${remain}年</b>契約 - 両当事者によって交渉されます<b class="hl">70%</b>価格も決まってますし、<b class="hl">${fmtMoney(total)}</b>エントリーは1回限り。契約の精神に基づいて、あなたには 10 セントが与えられるべきです。|remain, fmtMoney(total)|
|709|1791|最後一球|最後のボール|—|
|710|1791|雖然沒能回到主場獻技，你還是接受了邀請，回到 <b class="hl">臺北大巨蛋</b> 當一日中職球員。開球儀式上，四萬人的注視下，你投出了生涯的最後一球——不為勝負，只為那個曾經在紅土上作夢的自己。|ホームコートに戻ってパフォーマンスすることはできませんでしたが、それでも招待を受け入れてコートに戻りました。<b class="hl">台北アリーナ</b>中級レベルのプロ選手になります。キックオフセレモニーでは、4万人の観衆が見守る中、あなたは勝ち負けのためではなく、かつてクレーコートで夢見た自分のために、キャリア最後のショットを投げました。|—|
|711|1797|失憶症|健忘症|—|
|712|1797|生理上明明沒受傷，但站上場的瞬間，腦海全是上個賽季被痛宰的畫面——<b class="dn">系統評價暫時 −3，直到再次升級或奪得年度獎項才能解除</b>。|もちろん体に怪我はなかったが、フィールドに立った瞬間、脳裏に昨シーズンの敗戦のイメージがあふれた――。<b class="dn">システム評価は一時的に-3となり、再度アップグレードするか年間賞を受賞するまでは解除できません。</b>。|—|
|713|1805|跳槽日職一軍|日本軍への転職|—|
|714|1805|旅日合約|日本での旅行契約|—|
|715|1806|轉戰日職二軍（支配下）|日本の二軍（支配下）へ移籍|—|
|716|1807|返台加盟中職一軍|台湾に戻り中等職業学校第一軍に入隊|—|
|717|1807|落葉歸根|落ち葉は根に戻ります|—|
|718|1809|返台加盟中職一軍|台湾に戻り中等職業学校第一軍に入隊|—|
|719|1812|降級通知|ダウングレードの通知|—|
|720|1812|成績未達標，球團打算將你下放 <b class="dn">${LV[path[t]].n}</b>——但消息一出，其他聯盟的邀請也到了。|あなたのパフォーマンスが標準に達していない場合、チームはあなたを降格する予定です。<b class="dn">${LV[path[t]].n}</b>——しかし、このニュースが出るとすぐに、他の同盟からも招待状が届きました。|LV[path[t]].n|
|721|1813|接受下放，還是換個舞台？|権限移譲を受け入れるか、それとも段階を変えるか?|—|
|722|1814|接受下放|権限移譲を受け入れる|—|
|723|1815|降級通知|ダウングレードの通知|—|
|724|1815|成績未達標，被下放至 <b class="dn">${LV[path[t]].n}</b>。|彼の成績は標準に達していなかったので、彼は降格された<b class="dn">${LV[path[t]].n}</b>。|LV[path[t]].n|
|725|1821|球團約談：成績未達當前層級要求，打算將你下放|チームとの面接: あなたのパフォーマンスは現在のレベルの要件を満たしておらず、降格される予定です。|—|
|726|1822|接受下放，繼續奮鬥|地方分権を受け入れ、闘いを続ける|—|
|727|1823|行使長約條款，拒絕下放|長期契約条件を行使し、委任を拒否する|—|
|728|1823|觸發更衣室毒瘤；隔年成績打回身價才能洗刷，否則更慘|ロッカールームでガンを引き起こす。翌年に結果が戻ってくる場合にのみ、それを洗い流すことができます。そうでなければ、さらに悪いことになります|—|
|729|1826|隱藏屬性解鎖：更衣室毒瘤|隠された属性のロックが解除されました: ロッカー ルーム ガン|—|
|730|1826|你搬出合約條款拒絕下放。教練搖頭，隊友私下議論——你保住了位置，卻失去了更衣室。|あなたは契約条件を破り、委任を拒否しました。コーチは首を横に振り、チームメイトはひそかにつぶやいた――君はポジションを保ったが、ロッカールームで負けた。|—|
|731|1827|拒絕下放|権限委譲を拒否する|—|
|732|1827|你搬出合約條款留在一軍。球團記住了這件事。|あなたは契約条件を解除してイージュンに滞在します。チームはそれを覚えていました。|—|
|733|1829|就此引退|さっさと引退しろよ|—|
|734|1829|以現役身分光榮退場|現役として名誉ある引退をする|—|
|735|1829|不願下放，|手放す気はなく、|—|
|736|1829|年宣布引退。|年に引退を発表。|—|
|737|1831|球團約談：成績未達當前層級的最低要求|チームインタビュー: パフォーマンスが現在のレベルの最低要件を満たしていません|—|
|738|1832|接受下放，繼續奮鬥|地方分権を受け入れ、闘いを続ける|—|
|739|1833|選擇引退|退職を選択する|—|
|740|1833|以現役身分光榮退場|現役として名誉ある引退をする|—|
|741|1833|不願下放低階聯盟，|下位レベルの同盟に委譲することを望まず、|—|
|742|1833|年宣布引退。|年に引退を発表。|—|
|743|1839|日職二軍（支配下）合約|日本二軍（支配下）契約|—|
|744|1840|中職一軍合約|二次的な職業および軍事契約|—|
|745|1841|中職二軍合約|二次的な職業および軍事契約|—|
|746|1842|遭球團釋出且無人問津，|チームから放出されたが、誰も彼を気に留めない、|—|
|747|1842|年黯然引退。|惜しまれつつ引退。|—|
|748|1843|戰力外通告|戦闘不能通知|—|
|749|1843|未達 ${S.org==='NPB'?'日職':'原聯盟'}留用門檻，遭到釋出。所幸還有球隊捎來邀請——|まだ届いていない${S.org==='NPB'?'日職':'原聯盟'}保持のしきい値が解放されました。幸いなことに、チームからの招待状があった——|S.org==='NPB'?'日職':'原聯盟'|
|750|1844|就此引退|さっさと引退しろよ|—|
|751|1844|收到戰力外通告後，|戦力外通告を受けて、|—|
|752|1844|年選擇引退。|退職を選択してください。|—|
|753|1845|新東家的邀請|新しいオーナー様からのご招待|—|
|754|1856|簽約|契約書に署名する|—|
|755|1856|與 <b class="hl">${S.teamName()}</b> 簽下 <b class="hl">${S.ct.yrs} 年</b>合約${S.ct.mult!==1?|そして<b class="hl">${S.teamName()}</b>サイン<b class="hl">${S.ct.yrs}年</b>契約${S.ct.mult!==1?|S.teamName(), S.ct.yrs|
|756|1862|簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約${of.mult&&of.mult!==1?|サイン特典${fmtMoney(of.bonus)}｜${of.yrs}年間契約${of.mult&&of.mult!==1?|fmtMoney(of.bonus), of.yrs|
|757|1865|簽約金|サイン特典|—|
|758|1865|入袋 <b class="hl">${fmtMoney(of.bonus)}</b>。|ポケット<b class="hl">${fmtMoney(of.bonus)}</b>。|fmtMoney(of.bonus)|
|759|1891|長約（${tp.longY} 年）|長期契約（${tp.longY}年）|tp.longY|
|760|1891|年限長、年薪係數略低 ×${tp.longM}（估 ${est(tp.longY,tp.longM)}/年）｜穩定保障|勤続年数が長く、年収係数が若干低い ×${tp.longM}（見積もり${est(tp.longY,tp.longM)}/年) \|安定した保証|tp.longM, est(tp.longY,tp.longM)|
|761|1893|短約（${tp.shortY} 年）|短い約束（${tp.shortY}年）|tp.shortY|
|762|1893|年限短、年薪係數高 ×${tp.shortM}（估 ${est(tp.shortY,tp.shortM)}/年）｜賭下次身價|短期・高年収係数×${tp.shortM}（見積もり${est(tp.shortY,tp.shortM)}/年)｜次の価値に賭けましょう|tp.shortM, est(tp.shortY,tp.shortM)|
|763|1896|短約（${tp.shortY} 年）|短い約束（${tp.shortY}年）|tp.shortY|
|764|1896|年限短、年薪係數 ×${tp.shortM}（估 ${est(tp.shortY,tp.shortM)}/年）｜以你目前的年齡與成績，球團只願提供短約|短期・年俸係数×${tp.shortM}（見積もり${est(tp.shortY,tp.shortM)}/年)｜あなたの現在の年齢とパフォーマンスに基づいて、チームは短期契約のみを提供するつもりです。|tp.shortM, est(tp.shortY,tp.shortM)|
|765|1899|拒絕，維持現狀|拒否する、現状維持|—|
|766|1899|不接受這份合約|この契約を受け入れないでください|—|
|767|1905|母隊提前延長續約 · ${S.teamName()}（合約剩 1 年）|親チームが事前に契約を延長した・${S.teamName()}(契約残り1年)|S.teamName()|
|768|1907|延長續約|契約更新を延長する|—|
|769|1907|與 <b class="hl">${S.teamName()}</b> 達成延長協議，追加 <b class="hl">${y} 年</b>（年薪係數 ×${m.toFixed(2)}）。|そして<b class="hl">${S.teamName()}</b>延長合意に達し、追加した<b class="hl">${y}年</b>(年俸係数×${m.toFixed(2)}）。|S.teamName(), y, m.toFixed(2)|
|770|1910|婉拒延長|延長を断る|—|
|771|1910|你婉拒了母隊的提前延長，選擇打完現有合約再說。|あなたは親チームからの早期延長を拒否し、既存の契約を終了することを選択しました。|—|
|772|1926|球團冷處理|ペレットの冷間処理|—|
|773|1926|母球團明確表示無意續約——你的新聞比你的成績更出名。|手球クラブは更新するつもりがないことを明らかにしました - あなたのニュースは結果よりもよく知られています。|—|
|774|1929|與 ${S.teamName()} 續約|そして${S.teamName()}契約を更新する|S.teamName()|
|775|1929|接著選擇長約或短約|次に、長期または短期の予約を選択します|—|
|776|1930|與 ${S.teamName()} 續約 · 選擇合約類型|そして${S.teamName()}更新・契約タイプの選択|S.teamName()|
|777|1932|續約|契約を更新する|—|
|778|1932|與 <b class="hl">${S.teamName()}</b> 完成 <b class="hl">${y} 年</b>續約（年薪係數 ×${m.toFixed(2)}）。|そして<b class="hl">${S.teamName()}</b>仕上げる<b class="hl">${y}年</b>更新（年俸係数×）${m.toFixed(2)}）。|S.teamName(), y, m.toFixed(2)|
|779|1933|跳出合約，測試自由市場|契約を解除して自由市場をテストしてみよう|—|
|780|1933|成績不佳可能乏人問津，只能回原隊減薪|パフォーマンスが良くなければ無視され、元のチームに戻って減給されなければならない場合もあります。|—|
|781|1936|返台加盟中職一軍|台湾に戻り中等職業学校第一軍に入隊|—|
|782|1936|落葉歸根，回到熟悉的主場|落ち葉は根に還り、住み慣れた故郷へ還る|—|
|783|1937|返鄉|家に帰る|—|
|784|1937|結束海外的挑戰，你選擇回到 <b class="hl">${S.teamName()}</b>，在家鄉球迷面前繼續揮灑。|海外チャレンジ終了後、帰国を選択<b class="hl">${S.teamName()}</b>と地元ファンの前で披露し続けた。|S.teamName()|
|785|1939|合約到期 · 取得自由球員（FA）資格（球隊奪冠率 ${teamChampRate(S.orgTeam)}%）|契約満了・フリーエージェント（FA）資格取得（チーム優勝率）${teamChampRate(S.orgTeam)}%）|teamChampRate(S.orgTeam)|
|786|1960|自由市場|フリーマーケット|—|
|787|1960|電話一直沒有響。經紀人聳聳肩——市場對你的評價比想像中冷。|電話は鳴りませんでした。エージェントは肩をすくめます。市場はあなたが思っているほどあなたのことを考えていません。|—|
|788|1961|沒有球隊開價|どのチームもオファーを出さなかった|—|
|789|1962|回 ${S.teamName()} 減薪簽約|戻る${S.teamName()}給料カットで契約|S.teamName()|
|790|1962|1 年｜年薪係數 ×0.70|1年｜年俸係数×0.70|—|
|791|1963|減薪合約|減給契約|—|
|792|1963|低著頭回到 <b class="hl">${S.teamName()}</b>，年薪打七折。|頭を下げて戻る<b class="hl">${S.teamName()}</b>, 年間給与が30％オフになります。|S.teamName()|
|793|1964|就此引退|さっさと引退しろよ|—|
|794|1964|FA 市場乏人問津，|FA市場にはほとんど関心がありません。|—|
|795|1964|年黯然引退。|惜しまれつつ引退。|—|
|796|1968|長 ${tp.longY}年×${(tp.longM*(of.mult\|\|1)).toFixed(2)} / 短 ${tp.shortY}年×${(tp.shortM*(of.mult\|\|1)).toFixed(2)}|長さ${tp.longY}年×${(tp.longM*(of.mult\|\|1)).toFixed(2)}/ 短い${tp.shortY}年×${(tp.shortM*(of.mult\|\|1)).toFixed(2)}|tp.longY, (tp.longM*(of.mult\|\|1)).toFixed(2), tp.shortY, (tp.shortM*(of.mult\|\|1)).toFixed(2)|
|797|1968|僅短約 ${tp.shortY}年×${(tp.shortM*(of.mult\|\|1)).toFixed(2)}|短時間の予約のみ${tp.shortY}年×${(tp.shortM*(of.mult\|\|1)).toFixed(2)}|tp.shortY, (tp.shortM*(of.mult\|\|1)).toFixed(2)|
|798|1969|🇹🇼 台灣|🇹🇼台湾|—|
|799|1969|🇯🇵 日本|🇯🇵日本|—|
|800|1969|🇺🇸 美國|アメリカ合衆国|—|
|801|1969|🇺🇸 美國|アメリカ合衆国|—|
|802|1972|自由市場報價一覽（依國家分列 · 每隊列出 長約 / 短約 方案）|フリーマーケットオファーの概要（国ごとに分類・各チームは長期/短期契約オプションをリスト化）|—|
|803|1974|簽約金 ${fmtMoney(of.bonus)}｜奪冠率 ${teamChampRate(of.team)}%｜長/短：${estL(of)}${of.posting?'｜入札':''}|サイン特典${fmtMoney(of.bonus)}｜勝率${teamChampRate(of.team)}%｜ロング/ショート:${estL(of)}${of.posting?'｜入札':''}|fmtMoney(of.bonus), teamChampRate(of.team), estL(of), of.posting?'｜入札':''|
|804|1976|${of.team} · 選擇合約類型|${of.team}・契約タイプの選択|of.team|
|805|1979|回原隊（${S.teamName()}）1 年約|元のチームに戻ります (${S.teamName()}) 約1年|S.teamName()|
|806|1979|年薪係數 ×0.90|年俸係数×0.90|—|
|807|1980|回歸|戻る|—|
|808|1980|重回 <b class="hl">${S.teamName()}</b>。|戻る<b class="hl">${S.teamName()}</b>。|S.teamName()|
|809|2005|日職球團開出旅外合約|日本のプロサッカーチームが海外旅行契約を締結|—|
|810|2006|簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約|サイン特典${fmtMoney(of.bonus)}｜${of.yrs}年間契約|fmtMoney(of.bonus), of.yrs|
|811|2008|留在中職|中等専門学校に進学する|—|
|812|2012|大聯盟球探遞出合約|メジャーリーグのスカウトが契約を引き渡す|—|
|813|2013|簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約|サイン特典${fmtMoney(of.bonus)}｜${of.yrs}年間契約|fmtMoney(of.bonus), of.yrs|
|814|2015|留在中職|中等専門学校に進学する|—|
|815|2018|入札制度：大聯盟多隊競標你的合約|契約システム: 複数のメジャーリーグチームがあなたの契約に入札します。|—|
|816|2019|入札總額 ${fmtMoney(of.bonus*4)}｜簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約|チェックイン総額${fmtMoney(of.bonus*4)}｜サイン会特典${fmtMoney(of.bonus)}｜${of.yrs}年間契約|fmtMoney(of.bonus*4), fmtMoney(of.bonus), of.yrs|
|817|2021|留在日職|日本に滞在|—|
|818|2029|選秀落榜|ドラフトで負けた|—|
|819|2029|唱名一輪又一輪，始終沒有你的名字。（綜合 ${o}｜年齡加權後評價 ${score}）|点呼に次ぐ点呼ですが、あなたの名前は決してありません。 （包括的な${o}｜年齢加重評価${score}）|o, score|
|820|2030|回到校隊，明年再來。|大学に戻って、来年戻ってきてください。|—|
|821|2040|中華職棒選秀會|中国プロ野球ドラフト|—|
|822|2040|第 <b class="hl">${rd}</b> 輪獲 <b class="hl">${team}</b> 指名！簽約金依順位為 <b class="hl">${fmtMoney(bonus)}</b>。${lv==='CPBL1'?'即戰力評價，直接放入一軍名單。':'先從二軍出發。'}|いいえ。<b class="hl">${rd}</b>交代で<b class="hl">${team}</b>名前！サイン会特典の順番は<b class="hl">${fmtMoney(bonus)}</b>。${lv==='CPBL1'?'即戰力評價，直接放入一軍名單。':'先從二軍出發。'}|rd, team, fmtMoney(bonus), lv==='CPBL1'?'即戰力評價，直接放入一軍名單。':'先從二軍出發。'|
|823|2045|中華職棒選秀會 · 第 ${rd} 輪獲 ${team} 指名|中国プロ野球ドラフト・No.${rd}交代で${team}名前|rd, team|
|824|2046|接受指名，加盟球隊|指名を受け入れてチームに参加する|—|
|825|2046|簽約金 ${fmtMoney(bonus)}｜${lv==='CPBL1'?'一軍':'二軍'}出發|サイン特典${fmtMoney(bonus)}｜${lv==='CPBL1'?'一軍':'二軍'}出発する|fmtMoney(bonus), lv==='CPBL1'?'一軍':'二軍'|
|826|2047|重返校園，再拚一年|学校に戻ってまた一年頑張ってください|—|
|827|2047|重返業餘，再拚一年|アマチュアリズムに戻ってもう1年戦う|—|
|828|2047|放棄本次指名，明年重新參加選秀|この指名を諦めて来年のドラフトに再エントリーする|—|
|829|2050|重返校園|学校に戻る|—|
|830|2050|重返業餘|アマチュアリズムへの回帰|—|
|831|2050|看到被選到的輪次，雙眼發黑，原本以為會在前段輪次被選中，卻落到了後段的輪次。你握緊了拳頭，決定${goUni?(fresh?'進入大學繼續深造':'留在校隊繼續磨練'):'重返業餘'}，這一次，你一定要上台戴上所屬球隊的帽子。|自分が選ばれたラウンドを見たとき、目の前が真っ暗になりました。当初は早い段階で選ばれるだろうと思っていましたが、結局遅い段階で選ばれてしまいました。拳を握りしめて決めた君${goUni?(fresh?'進入大學繼續深造':'留在校隊繼續磨練'):'重返業餘'}、今度はステージに上がってチームの帽子をかぶる必要があります。|goUni?(fresh?'進入大學繼續深造':'留在校隊繼續磨練'):'重返業餘'|
|832|2051|文化大學|文化大学|—|
|833|2051|輔仁大學|カトリック扶仁大学|—|
|834|2051|國立體大|国立大学|—|
|835|2051|台灣體大|台湾の大きな体|—|
|836|2051|開南大學|海南大学|—|
|837|2052|合電|ヘディアン|—|
|838|2052|台庫|たいく|—|
|839|2052|安妞先物|アン・ニウ・シエンウー|—|
|840|2052|美麗珊瑚|美しいサンゴ|—|
|841|2061|就讀大學（延長養成）|大学に通う（延長研修）|—|
|842|2061|一年僅 2 場大賽加點｜大二起每年可投入選秀|加点できるメジャー試合は年2試合だけ｜2年目から毎年ドラフト出場可能|—|
|843|2062|文化大學|文化大学|—|
|844|2062|輔仁大學|カトリック扶仁大学|—|
|845|2062|國立體大|国立大学|—|
|846|2062|台灣體大|台湾の大きな体|—|
|847|2062|開南大學|海南大学|—|
|848|2063|升學|さらなる教育|—|
|849|2063|進入 <b class="hl">${S.team}</b> 棒球隊。|入力<b class="hl">${S.team}</b>野球チーム。|S.team|
|850|2064|投入中華職棒選秀|中国プロ野球ドラフトにエントリー|—|
|851|2064|目前綜合|現在包括的|—|
|852|2065|落榜之後|失敗した後|—|
|853|2066|改就讀大學|代わりに大学に通いなさい|—|
|854|2066|文化大學|文化大学|—|
|855|2066|輔仁大學|カトリック扶仁大学|—|
|856|2066|國立體大|国立大学|—|
|857|2066|台灣體大|台湾の大きな体|—|
|858|2067|加入業餘成棒隊|アマチュア野球チームに入部する|—|
|859|2067|合電|ヘディアン|—|
|860|2067|台庫|たいく|—|
|861|2067|安妞先物|アン・ニウ・シエンウー|—|
|862|2067|美麗珊瑚|美しいサンゴ|—|
|863|2069|洽談旅日合約|日本での旅行契約の交渉|—|
|864|2069|從日職二軍（支配下）出發｜滿 8 年視同本土|日本第二軍（支配下）出隊｜8歳以上を現地人とする|—|
|865|2071|日職球團的育成報價|日本のプロサッカーチームのトレーニング見積書|—|
|866|2072|旅日|日本旅行|—|
|867|2072|目標：一軍初登場。|目標：一軍初出場。|—|
|868|2073|洽談旅美合約|米国での旅行契約の交渉|—|
|869|2073|從${o>=54?' 1A ':'新人聯盟'}出發，逐級挑戰大聯盟|から${o>=54?' 1A ':'新人聯盟'}レベルごとに大リーグに挑戦しましょう|o>=54?' 1A ':'新人聯盟'|
|870|2075|大聯盟球團的國際簽約報價|メジャーリーグチームからの国際契約オファー|—|
|871|2076|旅美|米国への旅行|—|
|872|2076|美國的紅土，等著你去征服。|アメリカの赤土はあなたの征服を待っています。|—|
|873|2077|高中畢業 · 綜合能力 ${o} · 人生的第一個路口|高校卒業・総合力${o}・人生初の交差点|o|
|874|2081|投入中華職棒選秀|中国プロ野球ドラフトにエントリー|—|
|875|2081|綜合|包括的な|—|
|876|2081|｜大學畢業年齡加權下降|｜年齢に応じた大学卒業者数の減少|—|
|877|2082|落榜之後|失敗した後|—|
|878|2083|加入業餘成棒隊|アマチュア野球チームに入部する|—|
|879|2083|合電|ヘディアン|—|
|880|2083|台庫|たいく|—|
|881|2083|安妞先物|アン・ニウ・シエンウー|—|
|882|2084|高掛球鞋|ハイハンギングスニーカー|—|
|883|2084|大學畢業選秀落榜，決定告別球場。|彼は大学のドラフトに失敗し、裁判所に別れを告げることを決意した。|—|
|884|2093|洽談旅日合約|日本での旅行契約の交渉|—|
|885|2093|大齡新秀，簽約行情極低|年上のルーキー、契約価格は非常に安い|—|
|886|2094|日職球團報價|プロサッカー日本代表チームの名言|—|
|887|2095|洽談旅美合約|米国での旅行契約の交渉|—|
|888|2095|大齡底薪簽約 (Senior Sign)|シニアサイン|—|
|889|2096|大聯盟球團報價|メジャーリーグチームの名言|—|
|890|2097|大學畢業 · 綜合能力 ${o}|大卒・総合力のある方${o}|o|
|891|2101|確定要放棄這段人生，從頭開始嗎？|人生のこの部分を放棄して、最初からやり直してもよろしいですか?|—|
|892|2109|中職|中等専門学校|—|
|893|2109|日職|日本の仕事|—|
|894|2109|大聯盟|メジャーリーグ|—|
|895|2109|小聯盟／二軍|マイナーリーグ/二軍|—|
|896|2114|先發投手|先発投手|—|
|897|2114|中繼投手|リリーバー|—|
|898|2114|終結者|ターミネーター|—|
|899|2114|投手|ピッチャー|—|
|900|2122|先發|始める|—|
|901|2122|中繼|リレー|—|
|902|2122|終結者|ターミネーター|—|
|903|2123|搖擺人(|スインガー(|—|
|904|2131|工具人(|ツールマン(|—|
|905|2147|金手套|ゴールデングローブ|—|
|906|2147|守備王|ディフェンスキング|—|
|907|2150|，以${{SS:'史上最偉大的游擊手之一',CF:'守備範圍撼動聯盟的中外野手',C:'蹲捕藝術的化身',_:'守備傳奇'}[dp]\|\|('頂尖'+posN)}之姿|、による${{SS:'史上最偉大的游擊手之一',CF:'守備範圍撼動聯盟的中外野手',C:'蹲捕藝術的化身',_:'守備傳奇'}[dp]\|\|('頂尖'+posN)}姿勢|{SS:'史上最偉大的游擊手之一',CF:'守備範圍撼動聯盟的中外野手',C:'蹲捕藝術的化身',_:'守備傳奇'|
|908|2151|，一位攻守俱佳的${posN}|、攻撃的にも守備的にも優れた選手${posN}|posN|
|909|2155|中職|中等専門学校|—|
|910|2155|日職|日本の仕事|—|
|911|2155|大聯盟|メジャーリーグ|—|
|912|2156|中職總冠軍|中等職業選手権大会|—|
|913|2156|日本一|ジャパンワン|—|
|914|2156|世界大賽冠軍|ワールドシリーズチャンピオン|—|
|915|2157|年度最佳投手|今年の投手|—|
|916|2163|年度MVP|年間MVP|—|
|917|2164|新人王|新人王|—|
|918|2165|金手套|ゴールデングローブ|—|
|919|2166|守備王|ディフェンスキング|—|
|920|2167|王|王|—|
|921|2168|明星賽|オールスターゲーム|—|
|922|2181|名人堂|殿堂|—|
|923|2181|明星球員|スター選手|—|
|924|2181|每日球員|デイリープレイヤー|—|
|925|2181|邊緣球員|フリンジプレイヤー|—|
|926|2181|一頁過客|ページ上の乗客|—|
|927|2205|{n}退休了……我的青春也跟著結束了 QQ|{n}引退…私の青春はこれで終わった QQ|n|
|928|2205|以後帶小孩進場，我會指著引退背號說：爸爸看過{n}打球。|将来、子供たちを会場に連れて行くときは、出口の番号を指して「お父さん見たよ」と言うつもりです。{n}プレーボール。|n|
|929|2205|外電已經在算名人堂得票率了，根本沒有懸念|海外メディアはすでに殿堂入りの得票率を計算しており、まったく緊張感がない。|—|
|930|2205|謝謝你把台灣棒球帶到世界的舞台上|台湾野球を世界の舞台に導いていただきありがとうございます|—|
|931|2205|這種等級的選手，一個世代只會出現一個|このレベルの選手は一世代に一人しかいないでしょう。|—|
|932|2205|引退試合門票秒殺，黃牛價已經翻五倍了|引退裁判のチケットは即完売、ダフ屋の価格はすでに5倍に高騰|—|
|933|2206|{n}確定引退，推文區已經滿滿的 QQ|{n}引退確定、ツイート界隈はすでにQQで埋め尽くされている|n|
|934|2206|明星賽常客就這樣說再見了，唉|悲しいかな、これがオールスターゲームの常連たちに別れを告げる方法だ。|—|
|935|2206|生涯數據攤開來還是很漂亮，值得一面背號布幕|キャリアデータは広げても非常に美しく、カーテンコールに値します。|—|
|936|2206|謝謝你每一次的全力奔跑，辛苦了|毎回全力で走っていただきありがとうございます。お疲れ様でした。|—|
|937|2206|小時候牆上貼的海報就是他，時代的眼淚|私が子供の頃に壁に貼ってあったポスターは彼の『時代の涙』だった|—|
|938|2207|稱不上超級巨星，但每天打開轉播都看得到他，這樣就夠了|彼はスーパースターとは言えませんが、放送をつければ毎日彼の姿を見ることができ、それだけで十分です|—|
|939|2207|默默扛了這麼多年，辛苦了|長年黙々と背負ってきました、お疲れ様でした|—|
|940|2207|這種工兵型選手才是一支球隊真正的骨幹|この種のエンジニアリング プレーヤーがチームの真の屋台骨です|—|
|941|2207|數據不會說謊，穩定就是他最大的天賦|データは嘘をつきません、安定性が彼の最大の才能です|—|
|942|2208|板凳暖了這麼多年，也是一種浪漫啦|ベンチは何年も温かかったので、それも一種のロマンです。|—|
|943|2208|至少他真的站上過職棒舞台，比鍵盤上的我們都強|少なくとも彼は実際にプロ野球の舞台に立ったことがあり、キーボードに関しては我々より上手い。|—|
|944|2208|代打人生，謝謝那幾支關鍵安打|命懸けで戦え、重要なヒット曲をありがとう|—|
|945|2208|二軍發電機引退，只有鐵粉會記得，但我們記得|二軍ジェネレーターの引退を覚えているのは熱心なファンだけですが、私たちは覚えています|—|
|946|2209|欸這誰？……查了一下，原來真的打過職業喔|ねえ、これは誰ですか？ …調べてみたら、実はプロでプレーしていたことが分かりました。|—|
|947|2209|棒球真的好難，祝福第二人生順利|野球は本当に難しいですね、第二の人生も頑張ってください|—|
|948|2209|又一個被現實打敗的追夢人，唏噓|また夢を追う者が現実に負けて悲しい|—|
|949|2209|看板留言只有三則，其中一則還是他本人回的|掲示板にはメッセージが 3 件しかなく、そのうちの 1 件に本人が返信しました。|—|
|950|2223|引退戰選在<b class="hl">臺北大巨蛋</b>。四萬人把巨蛋塞得水洩不通，外野看板掛滿你生涯每一年的照片。九局下最後一個打席結束，全場燈光暗下，只剩一道追光打在你身上——隊友哭成一團，對手全員列隊脫帽，天團在二壘後方唱起你的應援曲改編的慢版。你繞場一周，把手套輕輕放在本壘板上。轉播單位說，這是中職史上收視最高的一場例行賽。|引退戦はこれからだ<b class="hl">台北アリーナ</b>。 4万人がドームを満員にし、屋外の看板はあなたのキャリアの各年の写真で埋め尽くされました。 9回の最後の打席の後、照明が暗くなり、追いかける光だけがあなたを照らしました。チームメイトは泣き出し、対戦相手全員が整列して帽子を脱ぎ、チームは二塁裏であなたの応援歌をスローバージョンで歌いました。フィールドを一周して、グローブをホームベースにそっと置きます。放送局は、これが中等専門学校の歴史の中で最も高い評価を受けたレギュラーシーズンの試合だったと述べた。|—|
|951|2224|球團為你舉辦了引退儀式。主場滿場，大螢幕播放生涯回顧影片，從高中甲子園夢碎到${S.pos==='P'?'職棒初登板':'職棒初安打'}，一幕一幕。老隊友從各地回來替你獻花，總教練在致詞時哽咽到說不下去。最後你脫下球帽向四個方向的看板深深鞠躬，應援團的鼓聲直到你走進休息室都沒有停。|チームはあなたのために引退セレモニーを行いました。ホームコートは満員となり、大型スクリーンには高校時代の甲子園の夢破れ、その後のキャリアを振り返るビデオが流れた。${S.pos==='P'?'職棒初登板':'職棒初安打'}、次から次へとシーン。昔のチームメートがあちこちから花を手向けに戻ってきて、ヘッドコーチはスピーチ中に息が詰まりすぎて話すことができなくなった。最後にボールキャップを外して四方の看板に深々とお辞儀をし、ラウンジに入るまで応援団の太鼓の音が鳴り止みませんでした。|S.pos==='P'?'職棒初登板':'職棒初安打'|
|952|2225|${S.pos==='P'?'球季最後一個主場日，球團安排你先發登板。投完第一局後被換下場，全場觀眾起立鼓掌，隊友在休息室門口排成兩排跟你擊掌。沒有煙火，沒有演唱會，但看台上有人拉起手寫布條：「謝謝你投出的每一顆全力的球」。':'球季最後一個主場日，球團安排你先發打第一棒。第一個打席結束後被換下場，全場觀眾起立鼓掌，隊友在休息室門口排成兩排跟你擊掌。沒有煙火，沒有演唱會，但看台上有人拉起手寫布條：「謝謝你的每一次全力奔跑」。'}|${S.pos==='P'?'球季最後一個主場日，球團安排你先發登板。投完第一局後被換下場，全場觀眾起立鼓掌，隊友在休息室門口排成兩排跟你擊掌。沒有煙火，沒有演唱會，但看台上有人拉起手寫布條：「謝謝你投出的每一顆全力的球」。':'球季最後一個主場日，球團安排你先發打第一棒。第一個打席結束後被換下場，全場觀眾起立鼓掌，隊友在休息室門口排成兩排跟你擊掌。沒有煙火，沒有演唱會，但看台上有人拉起手寫布條：「謝謝你的每一次全力奔跑」。'}|S.pos==='P'?'球季最後一個主場日，球團安排你先發登板。投完第一局後被換下場，全場觀眾起立鼓掌，隊友在休息室門口排成兩排跟你擊掌。沒有煙火，沒有演唱會，但看台上有人拉起手寫布條：「謝謝你投出的每一顆全力的球」。':'球季最後一個主場日，球團安排你先發打第一棒。第一個打席結束後被換下場，全場觀眾起立鼓掌，隊友在休息室門口排成兩排跟你擊掌。沒有煙火，沒有演唱會，但看台上有人拉起手寫布條：「謝謝你的每一次全力奔跑」。'|
|953|2226|你在球團官網的一則新聞稿裡宣布引退。發文的那個晚上，還是有幾十個老球迷湧進你的社群留言：「辛苦了」。職業棒球就是這樣——不是每個人都有儀式，但每個認真打過球的人，都有人記得。|チームの公式ウェブサイトのプレスリリースで引退を発表しましたね。あなたがこの投稿を投稿した夜、何十人もの古いファンがあなたのソーシャルメディアに殺到し、「お疲れ様でした」というメッセージを残しました。それがプロ野球の特徴です。誰もが儀式を持っているわけではありませんが、真剣にプレーする人には必ずそれを覚えている人がいます。|—|
|954|2228|球團為你安排了<b class="hl">引退試合</b>。最後一個守備半局結束，你被單獨留在場上，兩軍球員沿著邊線列隊。花束贈呈、監督擁抱、隊友把你高高拋起——三次、四次、五次的<b class="hl">胴上げ</b>。你抱著花束繞場一周，看台上的日本球迷舉著用中文寫的「謝謝」毛巾。引退記者會上你說：「能在這裡打球，是我人生最驕傲的事。」隔天所有體育報頭版都是你被拋在空中的那張照片。|チームがあなたのために手配しました<b class="hl">退職裁判</b>。後半が終わると、両軍の選手がサイドラインに並ぶ中、あなたはフィールドに一人取り残されます。花束が贈呈され、監督があなたを抱きしめ、チームメイトがあなたを高く投げ上げます - 3回、4回、5回<b class="hl">トランクの上</b>。あなたは花束を持ってフィールドを歩き回り、スタンドの日本のファンは中国語で「ありがとう」と書かれたタオルを持っていました。引退会見では「ここでプレーできることが人生で一番の誇り」とおっしゃっていましたね。翌日、すべてのスポーツ新聞の一面に、空中に放り投げられるあなたの写真が掲載されました。|—|
|955|2229|最終戰賽後，球團在場邊為你舉行了簡短的引退セレモニー：花束、紀念框裱的球衣、與監督的合影。廣播念出你的生涯成績時，客場球迷也起立鼓掌。記者會上有記者用不太標準的中文問你「還會回來嗎」，你笑著點頭。|最終試合終了後、チームはサイドラインにいる皆さんに短い引退セレモニーを開催しました。花束、額入りの記念ジャージ、そして監督との写真が贈られました。あなたのキャリアスコアがラジオで読み上げられると、アウェーのファンは立ち上がって拍手を送りました。記者会見で記者が標準以下の中国語で「戻ってきますか？」と尋ねました。あなたは微笑んでうなずきました。|—|
|956|2230|你透過球團發表引退聲明。整理置物櫃的那天，翻譯陪你走完最後一段球員通道，警衛伯伯跟你深深鞠了一躬。異鄉打拚的日子結束了，行李箱裡裝著幾件捨不得丟的練習衫。|チームを通じて引退発表をしましたね。その日、あなたがロッカーに荷物を詰めているとき、通訳がプレイヤートンネルの最後のセクションまで同行し、警備員のおじさんがあなたに深々とお辞儀をしました。異国の地でのハードワークの日々は終わり、スーツケースの中には捨てるには忍びない数枚の練習用シャツが残っています。|—|
|957|2232|主場最終戰，你最後一個打席前，全場觀眾起立鼓掌長達三分鐘，主審退到一旁靜靜等待。打席結束，你被換下場，隊友全部走出休息室與你擁抱，大螢幕播放致敬影片——<b class="hl">Curtain Call</b>，你走出休息室向全場揮帽致意兩次。賽後記者會擠滿各國媒體，台灣的轉播單位做了整夜特別節目。|ホームでの最終戦、あなたが最後にスタンドに立ったとき、観客は3分間立ち上がって拍手を送り、主審は脇に下がって静かに待っていました。試合終了後、あなたは交代し、チームメイト全員がラウンジから出てきてあなたを抱きしめ、追悼ビデオが大画面で流されました——<b class="hl">Curtain Call</b>、あなたはダッグアウトから出てきて、観客に帽子を2回振りました。試合後の記者会見には各国のメディアが詰めかけ、台湾の放送局は徹夜で特別番組を放送した。|—|
|958|2233|球隊在你生涯最後一個系列賽前於場邊舉行了簡單儀式：致贈裱框球衣與紀念浮雕，隊友列隊擊掌。當地報紙寫道：「他不是超級巨星，但他是每個總教練都想要的那種球員。」|あなたのキャリア最後のシリーズの前に、チームはサイドラインで簡単なセレモニーを行いました。あなたには額装されたジャージと記念のエンボス加工が施されたジャージが贈られ、チームメイトはハイタッチをするために整列しました。地元紙は「彼はスーパースターではないが、あらゆるヘッドコーチが望むような選手だ」と書いた。|—|
|959|2234|你在社群媒體上發了一張空蕩球場的照片，配文只有一句英文：「Thank you, baseball.」按讚數在台灣時間的深夜默默破了十萬。|あなたはソーシャルメディアに無人のスタジアムの写真を投稿し、「ありがとう、ベースボール」という一文だけを英語で投稿しました。いいね数は台湾時間の深夜に静かに10万を超えた。|—|
|960|2236|沒有鎂光燈。你把釘鞋擦乾淨放進袋子，跟隊友一一擁抱，走出球場時回頭看了記分板最後一眼。二軍球場的夕陽跟十年前一樣好看。|スポットライトはありません。スパイクをきれいにしてバッグに入れ、チームメイトと一人ずつハグをし、最後にもう一度スコアボードを振り返ってコートを去ります。二軍球場の夕日は10年前と変わらず美しい。|—|
|961|2238|引退之日|退職の日|—|
|962|2241|中華職棒名人堂|中国プロ野球殿堂|—|
|963|2241|中職|中等専門学校|—|
|964|2241|日本野球殿堂|日本フィールド野球場|—|
|965|2241|日職|日本の仕事|—|
|966|2241|美國棒球名人堂|野球殿堂|—|
|967|2241|大聯盟|メジャーリーグ|—|
|968|2256|引退 <b class="hl">${cfg.wait}</b> 年後（${yr+cfg.wait} 年）進入候選，於<b class="hl">第 ${ballotYr} 年投票</b>以 <b class="hl">${votes}</b> 票（得票率 ${Math.max(75,pct).toFixed(1)}%）榮登<b class="hl">${cfg.n}</b>——你以 <b class="hl">${cap\|\|'—'}</b> 的代表球員身分${phr}留名。${ballotYr===1?'<b class="hl">一票入魂，首輪即殿堂。</b>':''}名匾上的隊徽，是 ${cap\|\|'—'}。|引退する<b class="hl">${cfg.wait}</b>年以降 (${yr+cfg.wait}年) が候補に入り、<b class="hl">いいえ。${ballotYr}年次投票</b>による<b class="hl">${votes}</b>投票数（得票率${Math.max(75,pct).toFixed(1)}％） 勝利した<b class="hl">${cfg.n}</b> - あなた<b class="hl">${cap\|\|'—'}</b>代表選手ステータス${phr}あなたの名前を残してください。${ballotYr===1?'<b class="hl">一票入魂，首輪即殿堂。</b>':''}プレートにあるチームエンブレムは、${cap\|\|'—'}。|cfg.wait, yr+cfg.wait, ballotYr, votes, Math.max(75,pct).toFixed(1), cfg.n, cap\|\|'—', phr, ballotYr===1?'<b class="hl">一票入魂，首輪即殿堂。</b>':''|
|969|2259|你連續 ${tries} 年入圍${cfg.n}票選，最高曾獲得 ${pct.toFixed(1)}% 得票率，可惜始終未能跨過 75% 門檻。|あなたは継続的に${tries}年のファイナリスト${cfg.n}投票数は過去最高${pct.toFixed(1)}％の得票率ですが、残念ながら75％のしきい値を超えることはありませんでした。|tries, cfg.n, pct.toFixed(1)|
|970|2263|名人堂票選|殿堂入り投票|—|
|971|2264|隱藏屬性解鎖：|隠し属性のロックが解除されました:|—|
|972|2264|歷史級球星|歴史上のスター|—|
|973|2265|第一年投票就披上名人堂金袍——你不只是進了殿堂，你<b class="hl">定義了一個時代</b>。這個名字，會被寫進${S.legendLeague\|\|''}的歷史課本。|投票の最初の年に殿堂入りの金色のローブを着ましょう - あなたは殿堂に入っただけでなく、あなた自身も<b class="hl">時代を定義した</b>。この名前はに書き込まれます${S.legendLeague\|\|''}歴史の教科書。|S.legendLeague\|\|''|
|974|2269|生涯終幕|キャリアの終わり|—|
|975|2270|引退|引退する|—|
|976|2274|<span class="tag">${t.name}</span>（評價分 ${t.sc}）|<span class="tag">${t.name}</span>（評価点${t.sc}）|t.name, t.sc|
|977|2282|隱藏特性：小學校之光|隠し機能：小学生ライト|—|
|978|2282|當年那所沒沒無聞的小學校，走出了一個站上頂級舞台的男人。你證明了：出身，從來不是天花板。|その無名の小さな学校から、頂上の舞台に立つ男が現れた。あなたは、人の経歴が決して天井ではないことを証明しました。|—|
|979|2286|隱藏特性：努力仔|隠れ特性：頑張り屋さん|—|
|980|2286|天賦平庸的球員千千萬萬，能走到這裡的卻寥寥無幾。你不是天選之人，你是把汗水熬成天賦的那種人。|凡庸な才能を持った選手は何千人もいるが、ここまで勝ち上がるのはほんの一握りだ。あなたは選ばれた人ではなく、汗を才能に変える人なのです。|—|
|981|2292|你加入了乙組業餘棒球隊。平日上班、週末穿上球衣，去年在協會盃敲出再見安打的影片被瘋傳，底下最熱門的留言是：「這揮棒不像業餘的。」——因為本來就不是。你比誰都清楚，愛棒球不一定要靠它吃飯。|あなたはディビジョン B のアマチュア野球チームに参加します。平日は出勤し、週末にはジャージを着て、昨年のアソシエーションカップでサヨナラヒットを打った動画が話題になった。最も多かったコメントは「このスイングはアマチュアっぽくない」です。 - そうじゃないから。野球を愛するために野球で生計を立てる必要はないことを、あなたは誰よりも知っています。|—|
|982|2293|你考到了不動產營業員執照。帶看時爬六樓透天面不改色，客戶都說你氣場不一樣——十六歲就在幾千人面前投球的人，還會怕開價嗎？三年後你成了店裡的銷售王，名片頭銜下面偷偷印了一行小字：「前職業棒球選手」。|宅地建物取引士の資格を取得しました。ショー中は6階に上がって表情を変えることなく空を眺めることができます。顧客は、あなたのオーラが違うと言います。16 歳で何千人もの人々の前で投げたことがある人ですが、彼はまだ価格を要求することを恐れていますか? 3年後、あなたは店の売上王になり、名刺の肩書きの下にこっそり「元プロ野球選手」という小さな文字が書かれていました。|—|
|983|2294|你跟著舅舅去做板模。工地的日子曬得比春訓還黑，但你的核心力量和不服輸讓老師傅都點頭。五年後你自己出來帶班，薪水不比二軍差，而且——你笑著說——這裡沒有人會把你下放。|あなたは叔父に従ってテンプレートを作成します。建設現場の太陽は春季トレーニングの時よりも暗いですが、芯の強さと負けを認めようとしない姿勢が老巨匠たちをうなずかせます。 5年後にはあなた自身がリーダーになり、給料は二軍の給料よりも悪くなくなり、そして - あなたは笑顔で言いました - ここにいる誰もあなたを降格させることはありません。|—|
|984|2295|你穿上襯衫走進辦公室，同事只知道你「以前有在打球」。直到公司壘球隊比賽那天，你一棒把球送出圍牆，全場安靜三秒。後來每年比賽，對手公司都會先問一句：「那個人今年還在嗎？」|あなたがシャツを着てオフィスに入ると、同僚はあなたが「かつてバスケットボールをしていた」ということだけを知っています。会社のソフトボールチームの試合の日まで、あなたがボールを打ってフェンスを越えると、その場全体が3秒間静まり返りました。毎年、コンテスト期間中、相手企業はまず「あの人は今年もいますか？」と尋ねます。|—|
|985|2296|你頂下一間早餐店，招牌取名「滿壘」。店裡掛著你高中的球衣，蛋餅煎得跟你的守備一樣扎實。附近的少棒隊員放學都來報到，因為老闆會一邊煎蘿蔔糕一邊講解怎麼看投手的放球點——加蛋不加價。|あなたは朝食店を開き、その店を「フルベース」と名付けます。あなたの高校時代のジャージが店に飾られており、オムレツはあなたの守備と同じくらい堅実です。近くのリトルリーグの選手たちが放課後チェックインしに来ます。キャロットケーキを揚げながら、上司が投手の投球の読み方を説明してくれるからです。卵を加えても値段は上がりません。|—|
|986|2297|你回到母校當教練，月薪不高，但你把自己沒走完的路畫成地圖交給學弟。第七年，你帶的投手在選秀會上被第一輪指名，電視轉播帶到你的時候，你哭得比他還慘。|コーチとして母校に戻り、月給は高くないが、歩いたことのない道の地図を描いて後輩に渡す。 7年目、自分が指導した投手がドラフト1巡目で指名されました。テレビ放送が来たとき、あなたは彼よりも激しく泣きました。|—|
|987|2298|你創了業，做棒球訓練科技——用手機慢動作幫素人抓揮棒軌跡。第一年差點倒閉，第三年被運動中心整批採購。募資簡報的第一頁只有一句話：「我沒能站上去的舞台，我想讓更多人站上去。」|あなたは、携帯電話を使用してアマチュアがスローモーションでスイングの軌道を把握できるようにする野球トレーニング技術を開発するビジネスを始めました。 1年目は倒産しかけたが、3年目にスポーツセンターが一括購入した。募金説明会の最初のページには「私が立てられる舞台はない。もっと多くの人にその舞台に立ってほしい」の一文だけ。|—|
|988|2299|你考上了消防員。體能測驗全項第一，教官問你以前練什麼的，你說棒球。第一次出勤救人那晚，你突然明白：肩膀不能再投一百五，但還能扛著人走出火場——這雙手還是有用的。|あなたは消防士になりました。あなたはすべての体力テストで1位になりました。インストラクターがあなたに以前何を練習したか尋ねたので、あなたは野球と答えました。初めて誰かを救助する任務に就いた夜、あなたは突然理解しました。肩ではもう百五十度は投げられませんが、火事現場から人を運び出すことはできます。この手はまだ役に立ちます。|—|
|989|2300|第二人生|第二の人生|—|
|990|2300|<br><br><span class="sub">離開球場的人生，也是人生。${nm}，辛苦了。</span>|<br><br><span class="sub">コートから離れた生活もまた人生だ。${nm},お疲れ様でした。</span>|nm|
|991|2308|生涯年表（業餘成績）|キャリア年表（アマチュア成績）|—|
|992|2308|<table class="fin"><tr><th>年度</th><th>齡</th><th style="text-align:left">球隊</th><th style="text-align:left">成績</th></tr>${amaRows}</table>|<table class="fin"><tr><th>年</th><th>年</th><th style="text-align:left">チーム</th><th style="text-align:left">スコア</th></tr>${amaRows}</table>|amaRows|
|993|2313|<tr><th>年</th><th>齡</th><th style="text-align:left">球隊</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>HLD</th><th>SO</th><th>BB</th><th>ERA</th><th>WHIP</th></tr>|<tr><th>年</th><th>年</th><th style="text-align:left">チーム</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>HLD</th><th>SO</th><th>BB</th><th>ERA</th><th>WHIP</th></tr>|—|
|994|2314|<tr><th>年</th><th>齡</th><th style="text-align:left">球隊</th><th>G</th><th>PA</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>H</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th></tr>|<tr><th>年</th><th>年</th><th style="text-align:left">チーム</th><th>G</th><th>PA</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>H</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th></tr>|—|
|995|2332|生涯年表（職業成績）|キャリア年表 (キャリアの実績)|—|
|996|2338|<h4 style="margin:12px 0 4px">國際賽生涯（中華隊 ${S.intlCount} 屆）</h4><table class="st"><tr><th>出賽</th><th>局數</th><th>勝</th><th>救援</th><th>三振</th><th>ERA</th></tr><tr><td>${IS.G}</td><td>${fmtIP(IS.IP)}</td><td>${IS.W}</td><td>${IS.SV}</td><td>${IS.SO}</td><td>${era}</td></tr></table>|<h4 style="margin:12px 0 4px">国際的なキャリア（中国チーム）${S.intlCount}セッション）</h4><table class="st"><tr><th>遊ぶ</th><th>イニング数</th><th>勝つ</th><th>レスキュー</th><th>三振</th><th>ERA</th></tr><tr><td>${IS.G}</td><td>${fmtIP(IS.IP)}</td><td>${IS.W}</td><td>${IS.SV}</td><td>${IS.SO}</td><td>${era}</td></tr></table>|S.intlCount, IS.G, fmtIP(IS.IP), IS.W, IS.SV, IS.SO, era|
|997|2340|<h4 style="margin:12px 0 4px">國際賽生涯（中華隊 ${S.intlCount} 屆）</h4><table class="st"><tr><th>出賽</th><th>打席</th><th>打擊率</th><th>安打</th><th>全壘打</th><th>打點</th></tr><tr><td>${IS.G}</td><td>${IS.PA}</td><td>${avg}</td><td>${IS.H}</td><td>${IS.HR}</td><td>${IS.RBI}</td></tr></table>|<h4 style="margin:12px 0 4px">国際的なキャリア（中国チーム）${S.intlCount}セッション）</h4><table class="st"><tr><th>遊ぶ</th><th>テーブルを殴る</th><th>打率</th><th>打つ</th><th>ホームラン</th><th>打点</th></tr><tr><td>${IS.G}</td><td>${IS.PA}</td><td>${avg}</td><td>${IS.H}</td><td>${IS.HR}</td><td>${IS.RBI}</td></tr></table>|S.intlCount, IS.G, IS.PA, avg, IS.H, IS.HR, IS.RBI|
|998|2343|生涯累積數據|キャリア累計データ|—|
|999|2343|<p>（無職業層級出賽紀錄）</p>|<p>（プロレベルの試合実績なし）</p>|—|
|1000|2344|生涯評價|キャリア評価|—|
|1001|2347|（生涯未獲得任何獎項）|（彼のキャリアでは賞を受賞していません）|—|
|1002|2380|獎項與大賽成績|受賞とコンテストの結果|—|
|1003|2383|天才|天才|—|
|1004|2383|鐵人|アイアンマン|—|
|1005|2383|玻璃人|ガラスの男|—|
|1006|2383|渣男|スカムバッグ|—|
|1007|2383|大器晚成|遅咲きの人|—|
|1008|2383|自律狂|自己規律マニア|—|
|1009|2383|學院派|アカデミック|—|
|1010|2383|國際賽之鬼|国際競争の亡霊|—|
|1011|2383|神主牌|神のメインカード|—|
|1012|2383|大心臟|大きな心|—|
|1013|2383|浴火重生|灰の中から生まれ変わる|—|
|1014|2383|只會這個|これだけ|—|
|1015|2383|橡膠手臂|ゴムアーム|—|
|1016|2383|黃金聖衣|黄金聖闘士聖衣|—|
|1017|2383|先生|紳士|—|
|1018|2383|閨中密友|親友|—|
|1019|2383|小學校之光|小学校の明かり|—|
|1020|2383|努力仔|勤勉な少年|—|
|1021|2383|歷史級球星|歴史上のスター|—|
|1022|2383|失憶症|健忘症|—|
|1023|2383|外務纏身|外交問題で困っている|—|
|1024|2383|更衣室毒瘤|ロッカールームのがん|—|
|1025|2383|氣氛大師|雰囲気マスター|—|
|1026|2383|薪水小倫|給与 シャオ・ルン|—|
|1027|2383|大巧不工|素晴らしいスキルだが職人技はない|—|
|1028|2383|七彩球衣|カラフルなジャージ|—|
|1029|2396|老婆 ${lv.partner}（${lv.kids}）|妻${lv.partner}（${lv.kids}）|lv.partner, lv.kids|
|1030|2396|交往中 ${lv.partner}（${lv.dyrs\|\|0} 年）|コミュニケーション中${lv.partner}（${lv.dyrs\|\|0}年）|lv.partner, lv.dyrs\|\|0|
|1031|2396|離婚|離婚|—|
|1032|2396|未婚|未婚|—|
|1033|2397|｜前妻 ${lv.exes.map(e=>|\|元妻${lv.exes.map(e=>|—|
|1034|2399|生涯檔案|キャリアプロフィール|—|
|1035|2399|隱藏素質：${tr.join(' ')\|\|'（無）'}<br>家庭：${cur}${exStr}｜子女共 ${totKids} 人${lv.affairs?|隠れた特質:${tr.join(' ')\|\|'（無）'}<br>家族：${cur}${exStr}｜子ども総数${totKids}人々${lv.affairs?|tr.join(' ')\|\|'（無）', cur, exStr, totKids|
|1036|2399|:''}<br>國際賽出賽：${S.intlCount} 次｜生涯大傷：${S.bigInj} 次${S.pos==='P'?|:''}<br>国際競争:${S.intlCount}タイムズ \|キャリア上の怪我:${S.bigInj}二流${S.pos==='P'?|S.intlCount, S.bigInj|
|1037|2399|:''}<br>生涯總薪資：<b class="hl" style="font-size:18px">${fmtMoney(Math.round(S.salary))}</b> 台幣|:''}<br>キャリア給与総額:<b class="hl" style="font-size:18px">${fmtMoney(Math.round(S.salary))}</b>台湾ドル|fmtMoney(Math.round(S.salary))|
|1038|2404|台灣|台湾|—|
|1039|2404|日本|日本|—|
|1040|2404|美國|アメリカ合衆国|—|
|1041|2407|在${CTY[low]}是${LG_N[low]}的招牌，到了${CTY[high]}的${LG_N[high]}卻完全打不出來——「這人是誰？」當地球迷一臉問號，簽他的球團真是盤子|存在する${CTY[low]}はい${LG_N[low]}看板が届きました${CTY[high]}の${LG_N[high]}しかし、彼にはまったく理解できませんでした - 「この人は誰ですか？」地元ファンは疑問の表情を浮かべた。彼と契約したチームは本当に敗者だった。|CTY[low], LG_N[low], CTY[high], LG_N[high]|
|1042|2411|如果沒有那些傷，他的生涯會是什麼樣子……不敢想|あの怪我がなかったら彼のキャリアはどうなっていたか…思いつかない。|—|
|1043|2412|鐵人謝幕。那個連續出賽紀錄，大概很久都不會被打破了|アイアンマンは終わります。おそらくこの連続出場記録は当分破られないだろう。|—|
|1044|2413|高中就被叫做天才的男人，真的把天賦兌現了|高校時代に天才と呼ばれた男は自らの才能に気づいた|—|
|1045|2414|經典賽冠軍|クラシックチャンピオン|—|
|1046|2414|經典賽奪冠那一夜，全台灣都沒睡。謝謝你|私がクラシックで優勝した夜、台湾中が眠れませんでした。ありがとう|—|
|1047|2415|球技沒話說，私生活就……唉，不說了|私のサッカーのスキルについては何も言うことはありませんが、私の私生活については...まあ、これ以上は話しません。|—|
|1048|2416|引退串裡不准提那些事，今天只談棒球。……好啦還是很氣|そういったことは退職会見で話すことは許されません。今日は野球の話だけします。 …そう、私はまだとても怒っています。|—|
|1049|2417|一隊一人，退休號碼準備掛上去了。謝謝你留下來|各チームに 1 人ずつ存在し、引退番号はすぐに掛けられるようになっています。滞在してくれてありがとう|—|
|1050|2418|這輩子能看到你打球，是我們這代球迷的福氣。歷史級的|あなたがこの世でプレーする姿を見ることができるのは、私たち世代のファンの祝福です。歴史的な|—|
|1051|2419|穿上國家隊球衣的那個男人，永遠的國家英雄|代表チームのジャージを着た男は永遠に国民的英雄だ。|—|
|1052|2420|六度披上國家隊戰袍，從不推辭。他比劃胸口的那一幕，我手機桌布放到現在|彼は代表チームのユニフォームを6回着たが、決して辞退しなかった。胸にジェスチャーしたシーン、今携帯に壁紙貼ってます|—|
|1053|2421|自律到可怕，凌晨四點的球場都認得他|彼は非常に自制心があるので、早朝4時のスタジアムでさえ彼と認識されます。|—|
|1054|2422|球是打得好啦，但那個態度……更衣室少了他反而清靜|彼はボールをうまくプレーしたが、彼の態度は...彼のいないロッカールームは静かだった。|—|
|1055|2423|當年拒絕下放又打不出來，薪水小倫這名號是自己掙來的|当時、彼は降格を拒否し、タイトルを獲得できませんでした。彼はサラリー・シャオ・ルンの称号を自ら獲得した。|—|
|1056|2424|十五年只為一隊，|たった15年間、ひとつのチームのために、|—|
|1057|2424|先生這個稱號，他當之無愧|彼はサーの称号に値する|—|
|1058|2425|場上叱吒風雲，感情路上卻總是差一步，唉|彼はコート上では全能ですが、悲しいことに、恋ではいつも一歩遅れてしまいます。|—|
|1059|2426|從那種小學校打到職業，這故事夠拍一部電影了|そんな小学生からプロ選手まで、この物語だけで映画が一本作れるほどだ。|—|
|1060|2427|沒什麼天分卻拼到這種成就，這種球員最讓人尊敬|才能はないが、努力してそのような成果を達成する、このような選手が最も尊敬される|—|
|1061|2428|我愛台中猛瑪，不離不棄|私は台中孟馬を愛しています、あなたから離れることは決してありません|—|
|1062|2429|從手術台爬回來還能拿獎，這種心臟是鈦合金做的吧|手術台から這い上がった後でも賞品を獲得することができます。この心臓はチタン合金でできていますか？|—|
|1063|2430|那招${S.toolRole}真的無解，關鍵時刻換他上場就對了|その動き${S.toolRole}本当に解決策はありません。重要な瞬間に彼を交代させてください。|S.toolRole|
|1064|2431|大場面先生，越關鍵的時刻越信任他|ミスター・ビッグシーン、重要な瞬間ほど彼を信頼する|—|
|1065|2432|引退後好好陪家人吧，孩子們等你很久了|退職後は家族とゆっくり過ごしましょう。あなたの子供たちは長い間あなたを待っていました。|—|
|1066|2433|球迷看板・引退串|ファン看板・引退紐|—|
|1067|2436|<div class="title">分享這段生涯</div><br>    <div class="row2" style="display:flex;gap:8px;flex-wrap:wrap"><br>      <button class="btn main" id="sh-img" style="flex:1">📸 產生結算圖</button><br>      <button class="btn" id="sh-url" style="flex:1">🔗 複製重播連結</button><br>    </div><div id="sh-out" style="margin-top:8px"></div>|<div class="title">この人生を分かち合いましょう</div><br>    <div class="row2" style="display:flex;gap:8px;flex-wrap:wrap"><br>      <button class="btn main" id="sh-img" style="flex:1">📸決済チャートを生成</button><br>      <button class="btn" id="sh-url" style="flex:1">🔗 リプレイリンクをコピー</button><br>    </div><div id="sh-out" style="margin-top:8px"></div>|—|
|1068|2445|✅ 已複製|✅コピーしました|—|
|1069|2445|🔗 複製重播連結|🔗 リプレイリンクをコピー|—|
|1070|2446|手動複製連結：|リンクを手動でコピーします。|—|
|1071|2447|手動複製連結：|リンクを手動でコピーします。|—|
|1072|2450|⚾ 開啟新的人生（新種子）|⚾ 新しい生活のスタート（新しい種）|—|
|1073|2451|用同一個種子重來|同じシードからやり直す|—|
|1074|2455|生涯終幕|キャリアの終わり|—|
|1075|2463|歷史級球星|歴史上のスター|—|
|1076|2463|黃金聖衣|黄金聖闘士聖衣|—|
|1077|2463|天才|天才|—|
|1078|2463|鐵人|アイアンマン|—|
|1079|2463|玻璃人|ガラスの男|—|
|1080|2463|渣男|スカムバッグ|—|
|1081|2463|大器晚成|遅咲きの人|—|
|1082|2463|自律狂|自己規律マニア|—|
|1083|2463|學院派|アカデミック|—|
|1084|2463|國際賽之鬼|国際競争の亡霊|—|
|1085|2463|神主牌|神のメインカード|—|
|1086|2463|大心臟|大きな心|—|
|1087|2463|浴火重生|灰の中から生まれ変わる|—|
|1088|2463|只會這個|これだけ|—|
|1089|2463|橡膠手臂|ゴムアーム|—|
|1090|2463|先生|紳士|—|
|1091|2463|閨中密友|親友|—|
|1092|2463|小學校之光|小学校の明かり|—|
|1093|2463|努力仔|勤勉な少年|—|
|1094|2463|失憶症|健忘症|—|
|1095|2463|外務纏身|外交問題で困っている|—|
|1096|2463|更衣室毒瘤|ロッカールームのがん|—|
|1097|2463|氣氛大師|雰囲気マスター|—|
|1098|2463|薪水小倫|給与 シャオ・ルン|—|
|1099|2463|大巧不工|素晴らしいスキルだが職人技はない|—|
|1100|2463|七彩球衣|カラフルなジャージ|—|
|1101|2474|${h.lg}名人堂 · 第${h.yr}年入選 ${h.pct}%|${h.lg}殿堂入り・No.${h.yr}年に選ばれた${h.pct}%|h.lg, h.yr, h.pct|
|1102|2481|跨聯盟生涯 ${tW}勝 ${tSO}K ${tSV}救援 ${tHLD}中繼|リーグを超えたキャリア${tW}勝つ${tSO}K ${tSV}レスキュー${tHLD}リレー|tW, tSO, tSV, tHLD|
|1103|2483|跨聯盟生涯 ${tHR}轟 ${tH}安 ${tSB}盜|リーグを超えたキャリア${tHR}ブーム${tH}インストール${tSB}窃盗|tHR, tH, tSB|
|1104|2564|投手|ピッチャー|—|
|1105|2564|捕手|キャッチャー|—|
|1106|2564|內野手|内野手|—|
|1107|2564|外野手|外野手|—|
|1108|2567|Y a K y o L i f e ・ 引 退 紀 念|Y a K y o Life・退職記念|—|
|1109|2570|${primaryPos()}｜${playerType()}｜${hist.length?hist[0].y:'?'}–${S.year}｜引退時 ${S.age} 歲${S.pos==='P'&&S.tjCount?|${primaryPos()}｜${playerType()}｜${hist.length?hist[0].y:'?'}–${S.year}｜退職するとき${S.age}年${S.pos==='P'&&S.tjCount?|primaryPos(), playerType(), hist.length?hist[0].y:'?', S.year, S.age|
|1110|2597|生涯評價|キャリア評価|—|
|1111|2602|生涯累積數據|キャリア累計データ|—|
|1112|2623|國際賽生涯（中華隊|国際的なキャリア（中国チーム）|—|
|1113|2623|屆）|セッション）|—|
|1114|2640|生涯榮譽（|キャリア上の栄誉 (|—|
|1115|2640|項）|アイテム）|—|
|1116|2654|生涯年表（業餘成績）|キャリア年表（アマチュア成績）|—|
|1117|2655|年|年|—|
|1118|2655|齡|年|—|
|1119|2655|球隊|チーム|—|
|1120|2655|成績|スコア|—|
|1121|2668|生涯年表（職業成績）|キャリア年表 (キャリアの実績)|—|
|1122|2670|年|年|—|
|1123|2670|齡|年|—|
|1124|2670|球隊|チーム|—|
|1125|2671|年|年|—|
|1126|2671|齡|年|—|
|1127|2671|球隊|チーム|—|
|1128|2702|生涯總薪資|キャリア給与総額|—|
|1129|2702|台幣|台湾ドル|—|
|1130|2707|棒球生涯結算_|野球選手としてのキャリアの清算_|—|
|1131|2708|<img src="${url}" style="width:100%;border-radius:8px" alt="結算圖"><br>    <div style="display:flex;gap:8px;margin-top:8px"><br>      <button class="btn main" id="sh-save" style="flex:1">💾 儲存 / 分享圖片</button><br>      <button class="btn" id="sh-dl" style="flex:1">下載到裝置</button><br>    </div><br>    <div class="statline" style="margin-top:6px">若按鈕無效，長按上方圖片也可儲存</div>|<img src="${url}" style="width:100%;border-radius:8px" alt="決済チャート"><div style="display:flex;gap:8px;margin-top:8px"><br>      <button class="btn main" id="sh-save" style="flex:1">💾 写真を保存/共有する</button><br>      <button class="btn" id="sh-dl" style="flex:1">デバイスにダウンロードする</button><br>    </div><br>    <div class="statline" style="margin-top:6px">ボタンが無効な場合は、上の画像を長押しして保存してください</div>|url|
|1132|2723|棒球生涯結算|野球選手としてのキャリアの清算|—|
|1133|2723|的棒球人生|野球人生|—|
|1134|2735|⌃ 展開選項|⌃ オプションを展開する|—|
|1135|2735|⌄ 收合選項|⌄ オプションを折りたたむ|—|
|1136|2745|有有子|あなたには息子がいます|—|
|1137|2745|抹茶多|抹茶がたっぷり|—|
|1138|2745|黃鎖頭|黄色のロックヘッド|—|
|1139|2745|藥帝士|ヤオディシ|—|
|1140|2754|新人聯盟|初心者同盟|—|
|1141|2756|二軍|二軍|—|
|1142|2760|球員誕生|選手誕生|—|
|1143|2760|${S.year} 年春天，${POSN[S.pos]} <b class="hl">${S.name}</b> 加入 <b class="hl">${S.team}</b> 棒球隊。三年後的路，要自己選。<br><span style="color:var(--dim);font-size:12px">提示：22 歲前累積擲出 5 次「6」可覺醒隱藏素質。</span>|${S.year}来年の春、${POSN[S.pos]} <b class="hl">${S.name}</b>参加する<b class="hl">${S.team}</b>野球チーム。 3年間で自分の道を選択しなければなりません。<br><span style="color:var(--dim);font-size:12px">ヒント: 22 歳になるまでに「6」を累積して 5 つ出して、隠れた資質を目覚めさせます。</span>|S.year, POSN[S.pos], S.name, S.team|

## 22. HTML初期表示対訳

|原本行|種別|台湾華語（原文）|日本語版対応|
|---:|---|---|---|
|8|title|YaKyoLife - 棒球人生模擬器|YaKyoLife - 野球人生シミュレーター|
|146|HTML本文|棒球人生模擬器|野球人生シミュレーター|
|148|HTML本文|高中三年養成 → 選秀・旅日・旅美 → 國際賽 → 衰退與引退。每一顆骰子都算數。|高校時代の3年間の成長→ドラフト、日本、米国遠征→国際大会→衰退と引退。すべてのダイスは重要です。|
|149|HTML本文|球員姓名|プレイヤー名|
|150|HTML本文|守位|守備位置|
|152|HTML本文|投手|ピッチャー|
|152|HTML本文|捕手|キャッチャー|
|153|HTML本文|內野手|内野手|
|153|HTML本文|外野手|外野手|
|155|HTML本文|開始生涯 ▸ 高一春天|キャリアスタート ▸ 高校1年生の春|
|156|HTML本文|世界種子|世界の種|
|158|HTML本文|換一個|もう一つ変更してください|
|158|HTML本文|相同種子＋相同選擇＝相同人生（可直接輸入朋友的種子碼）|同じシード + 同じ選択 = 同じ人生 (友達のシードコードを直接入力できます)|
|159|HTML本文|最先生 Mr.TheMost|ミスター・ザ・モスト ミスター・ザ・モスト|
|166|HTML本文|年齡|年|
|167|HTML本文|年份|年|
|168|HTML本文|綜合|包括的な|
|169|HTML本文|生涯薪(萬)|キャリア給与（10,000）|
|172|HTML本文|季初|シーズンの始まり|
|173|HTML本文|賽季中|季節中|
|174|HTML本文|季末|シーズンの終わり|
|178|HTML本文|⌄ 收合選項|⌄ オプションを折りたたむ|
|9|HTML属性|從高中三大賽到名人堂，一場種子化的台灣棒球員生涯模擬。選秀、旅外、國際賽、傷病、感情、引退——每一個決定都算數。|高校三大大会から殿堂入りまで、台湾人野球選手のキャリアをシード付きでシミュレーション。ドラフト、海外挑戦、国際大会、ケガ、恋愛、引退――すべての決断が人生を左右します。|
|11|HTML属性|YaKyoLife - 棒球人生模擬器|YaKyoLife - 野球人生シミュレーター|
|12|HTML属性|從高中三大賽到名人堂，一場種子化的台灣棒球員生涯模擬。選秀、旅外、國際賽、傷病、感情、引退——每一個決定都算數。|高校三大大会から殿堂入りまで、台湾人野球選手のキャリアをシード付きでシミュレーション。ドラフト、海外挑戦、国際大会、ケガ、恋愛、引退――すべての決断が人生を左右します。|
|14|HTML属性|YaKyoLife - 棒球人生模擬器|YaKyoLife - 野球人生シミュレーター|
|15|HTML属性|從高中三大賽到名人堂，一場種子化的台灣棒球員生涯模擬。選秀、旅外、國際賽、傷病、感情、引退——每一個決定都算數。|高校三大大会から殿堂入りまで、台湾人野球選手のキャリアをシード付きでシミュレーション。ドラフト、海外挑戦、国際大会、ケガ、恋愛、引退――すべての決断が人生を左右します。|
|149|HTML属性|例如：林家正|例: 林家正|
|164|HTML属性|重新開始|再起動|

## 23. 非機能・制約

- 対応画面: モバイル中心、最大幅560px。safe-area-inset-bottom対応。
- アクセシビリティ: prefers-reduced-motion時はアニメーション停止。ただしARIA属性やキーボード完全対応は限定的。
- セキュリティ: ユーザー入力の選手名がHTML文字列へ挿入される箇所があり、厳密にはHTMLエスケープ改善余地がある。
- 保存: ブラウザリロードで状態消失。シードは人生の再現のみで途中保存ではない。
- 互換性: Canvas、Web Share、Clipboard APIはブラウザ対応状況によりフォールバック。
- ログ保持: 年度DOMは最大60ブロック。古い年度はDOMから削除されるが `S.log` の年表データは別保持。
- 日本語版既知差異: CSS内コメントを含むスタイルブロックの一部が翻訳され、原本のIDセレクタ `#board/#log/#act/#dice/#start` が `#ボード/#ログ/#行為/#サイコロ/#スタート` になっている。一方HTML/JavaScript側IDは英字のままなので、該当スタイルが適用されない。これはテキスト対訳ではなく翻訳実装上の不具合である。

## 24. 検証観点

1. 同一シード・同一選択で成績、イベント、所属遷移が一致すること。
2. P/C/IF/OFの全開始位置で未定義能力参照がないこと。
3. 高校→大学／社会人／ドラフトの全分岐が完走すること。
4. CPBL、NPB、MiLB/MLBの昇降格、FA、戦力外、海外移籍が進行停止しないこと。
5. 故障、TJ 1回／2回、リハビリ、引退が正しく反映されること。
6. single→dating→married→子供／不倫／離婚の状態遷移が矛盾しないこと。
7. 引退評価、通算表、国際成績、共有PNGの数値が `S.stats` と一致すること。
8. 台湾華語版と日本語版で、文字列以外のJavaScript構造・条件式・数式が一致すること。

---

抽出統計: 関数 113 件、原本文字列 2414 件、日本語版文字列 2414 件、対訳対象 1143 件。

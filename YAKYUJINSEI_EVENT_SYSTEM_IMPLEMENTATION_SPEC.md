# 野球人生シミュレーター：92枚イベントシステム実装・変更仕様書

- 作成日：2026-10-07。文書改訂：2。状態：開発元devのv1.8.0へ実装、正式公開は未実施。
- 対象：yakyujinsei.com、日本版v1.7.0、参照コミット `bce33cfb496cf7e124b2f36f31d9256f9132c4e7`。
- 必須の別紙：`YAKYUJINSEI_JP_EVENT_92_COMPLETE_DATA.md` 文書改訂3。
- 数値：中文版v1.5.7。所属条件・画面遷移・大会構造：日本版。スポンサー金額：日本版専用の架空の円建て設定。
- 二刀流は対象外。実装後の公開バージョン番号は本書では指定しない。

## 1. 実装結果と仕様の優先順位

現行の簡易イベント17件を、日本語92件へ置き換える。各カードは三つの選択肢、個別の成功文・失敗文、分類別効果、所属条件、失敗モード別故障リスクを持つ。実際の能力、年度成績、スポンサー入金、隠し特性へ接続し、表示だけの追加で終わらせない。

別紙のJSONを採用データの正本とする。ID、条件、日本語文案、カード固有の対象・故障モードは別紙を優先。本書は実行順序、接続、正規化、互換、検証を規定する。両者に食い違いを発見した場合は同じ変更で修正し、片方だけを都合よく解釈しない。本文に「日本版向け適応」と明示した箇所は原版の完全複製ではない。

実装範囲：

| 採用 | 維持／範囲外 |
|---|---|
| 92件の完全データ、分類別数値、CN成功率、個別故障マスク | 日本版の直接抽選。PRO3件、その他2件、重複可 |
| イベント専用能力成長、正負の年度成績点 | 人生ルート・分類配分画面は追加しない |
| 円建てスポンサー収入、内訳と一回限りの記帳 | 年俸・固定契約・社会人給与の既存計算は維持 |
| 愛将・広告王とイベント累計の接続 | 全特性・恋愛・国際大会の一括移植は行わない |
| 大会入力への成績点反映 | 独立の個人成績を新規生成しない |
| 移行・テスト・文書更新 | 自動公開、commit、pushは本書自体では指示しない |

## 2. 現行コードの接続箇所

行番号は参照時点の目安。実装開始時に最新コードを確認し、名前と実際の呼び出し経路を優先する。

| ファイル／箇所 | 現状 | 変更 |
|---|---|---|
| src/engine/game.js の EVENTS、evOdds、drawEvents、resolveEvent | 簡易カード・共通増減 | 外部92件データ、純粋な数値解決、個別文案へ置換 |
| phaseMid | 恋愛処理後にイベント抽選、故障判定、季節成績 | 順序を保持。skipMidでは抽選なし |
| addAb / addAbStat | 恋愛・通常訓練にも使われる | 全体を書き換えずeventAddAbilityを追加 |
| checkTraitsMid | 既存累計と特性判定 | 今回対象の判定を一箇所に統合、旧条件との二重判定を除去 |
| simSeason / dpQual | 出場係数、若手守備優遇 | 第7節の愛将効果を接続 |
| proSeason | pendStatの正数だけを反映 | 第6節の正負処理を同じ位置へ置換 |
| proSeason後半のrecordSalaryEvaluation(st) | 最終成績を市場評価 | イベント反映後の同じstを渡す |
| 後半IIFEのnewState上書き | 実際の初期状態生成 | 初期化と互換補完をここに接続 |
| 後半IIFEのamateurSeason、cupOnce、qualifierOnce | 現行の大会実行経路 | 第6.4節の年度入力を接続。前半の旧関数だけ修正しない |
| src/ui/player-detail.js、salary-detail.js、ゲーム内board・引退・共有表示 | 所得・特性表示 | スポンサー内訳と特性の正確な効果説明 |
| src/main.js / index.html | ES moduleとしてgame.jsを起動 | 新規モジュールのimport経路を確認 |

推奨の追加ファイル：

- `src/data/event-cards-jp.js`：別紙JSONをJSとしてexport。DOM・乱数・状態更新なし。
- `src/engine/event-policy.js`：資格、成功率、分類、plan、能力成長、金額、カウンター計算の純粋関数。
- `src/engine/event-season-policy.js`：PRO成績点と大会入力の純粋処理。
- `src/engine/event-state-policy.js`：補完、一回限りの適用、年度リセット。
- `tests/event-policy.test.mjs`、`tests/event-integration.test.mjs`：Node標準testを使える最小構成。既存テストランナーがあればそちらへ統合。

既存の給与policyにイベント抽選やcash入金を埋め込まない。全体的なファイル分割や大会・契約の再設計は不要。

## 3. データ契約と抽選

別紙末尾のJSONコードブロックを機械的に抽出する。手作業で92件を再入力しない。schemaの `yakyujinsei.event-catalog.v2` とpolicyの `CN157_CLASSIFIED_JP_LOCALIZED` を検証する。

| 項目 | 必須条件 |
|---|---|
| events | 92件、ID一意、原版IDを保持、ID昇順 |
| category | training43、encounter35、endorsement14 |
| choices | bold・norm・safe各1件、文案は3×成功／失敗 |
| eligibility | stages・levels・orgs・role・maxAgeをすべて評価 |
| effectPlans | 3モード×3clutchTier×2成否、共通policyとの一致 |
| injuryFailureModes | カードの指定モードだけ。分類から推測しない |
| incomeEffect | endorsementだけ。その他は入金しない |
| sourceName | 追跡用、日本語画面へ出さない |

資格の配列内はOR、各属性間はAND。Fは捕手を含む全野手、Cは捕手のみ、Pは投手のみ。未知のpos/stage/lv/orgは対象外。maxAge=34なら34歳可、35歳不可。未指定年齢上限はnull。カード2はPならsta、野手ならpow。

対象プールをID昇順で固定してから既存のseed付きpickを呼ぶ。毎回同じプールから一枚選ぶため同年度の重複は許可。PROは3件、HS/U/CORP/INDは2件。プールが空なら「対象のイベントがない」表示で終了し、他所属のカードへfallbackしない。データ異常は開発時に明示的エラーとする。

選択肢順はbold、norm、safe。成功率・効果・故障加算は状態を変えず計算して表示する。副作用、Math.random、プレビュー時のrng消費は禁止。旧版とのseed経過一致は保証しない。実装後の同一バージョン、seed、選択列で再現性を保証する。

## 4. 成否・効果・故障

### 4.1 成功率

base=genius/late/clutchのいずれかなら70、それ以外50。thiefなら−10。

| mode | 率 |
|---|---|
| safe | min(95,base+20) |
| norm | min(95,base+(favorite?5:0)) |
| bold | base−15+(clutchかつgenius?5:0) |

既存のchanceと同じ境界を使い、一回だけ判定する。強心臓のみのboldは55%、強心臓＋天才は60%。表示と実際の判定を同じ関数へ統一する。

解決開始時にtraitsをsnapshotする。今回の成功で広告王・愛将・強心臓が解放されても今回の率・効果・入金には遡及しない。

### 4.2 分類とplan

HS/U/CORPでencounterならeffectiveCategory=training。INDは変更しない。CORPで別紙が許可するスポンサーを残すことは日本版向け拡張で、原版の業餘スポンサー除外を復元しない。

clutchTier=0（なし）、1（clutchのみ）、2（clutchかつgenius）。lateはtier2の代用にならない。planは別紙の分類共通規則を一度だけ適用する。旧resolveEventのmagやaddAbStatを追加実行しない。

| 分類 | safe成功／失敗 | norm成功／失敗 | bold成功／失敗・tier0 |
|---|---|---|---|
| training | 能力育成+1／能力−1 | 育成+2／能力−2 | 育成+3／能力−3 |
| encounter | 成績+1／−1 | 成績+2／−2 | 成績+3／−3 |
| endorsement | 成績+1と入金／成績−1 | 育成+1と入金／成績−1 | 育成+1・成績+1と入金／成績−2 |

boldのtier1/2はtraining失敗−2、encounter失敗−2、endorsement失敗−1。tier2のtraining成功+4、endorsement成功成績+2。その他は表と同じ。

### 4.3 能力成長

正のabilityは育成点であり、能力の直接+値ではない。eventAddAbilityは新規の専用経路とする。

| 対象 | 基本コスト |
|---|---|
| P、sta以外 | cur<50:1、<58:2、<66:4、その他7 |
| Pのsta、全野手 | cur<64:1、<72:2、その他3 |

cur>=potなら投手×4、野手×3。正数はcarryへ積み、次の一段階分のcostを満たしたらcurを1上げてcostを再計算。上限80。80で未使用の育成点は成績点へ変換しcarryは0。潜在上限で停止せず80まで育成する。

負数はcurへ直接加え1～80へ制限。負数から成績点を生成しない。curは整数、carryは整数かつ0～次cost−1へ補正。既存carryは欠損のみ0、負数処理でコストが低下した分は範囲内へclampする。

targetがrandまたは当該POS_ABに存在しないときだけ既存pick(POS_AB[pos])を一回使用。ability=0ならtarget抽選なし。戻り値にbefore/after/abilityDelta/carryBefore/carryAfter/overflowStatを含め、画面へ実際の増減を表示する。

### 4.4 故障

失敗かつmodeがカードのinjuryFailureModesに含まれる場合だけ今季のtmpInjへ加算する。safe8、norm12、bold16、clutchのbold12。成功は0。ここで故障判定の乱数を引かない。phaseMidの既存故障判定へ渡す。injNextは国際大会等の翌期持越用なので、このイベント加算には使わない。

カード単位のinjRiskを一律適用しない。例：ID1はsafe失敗だけ+8、norm/bold失敗は0。ID90はnorm失敗だけ+12。実際に故障する前に「負傷した」と確定表示しない。

## 5. 状態・一回限りの解決・所得

### 5.1 補完する状態

| field | 初期値／用途 |
|---|---|
| eventSchemaVersion | 1 |
| pendStat | 欠損時0。既存値は保持 |
| eventSequence | 0。同じrun内の抽選出現番号 |
| processedEventIDs | {}。解決済み出現IDと確定結果 |
| pendingEvent | null。表示中のカード・年度・snapshot |
| incomeLedger | []。スポンサー記帳 |
| careerOutsideIncome / yearOutsideIncome | 0、円 |
| cntNormWin / cntEndorseBoldWin / cntSocialBoldFail | 0 |
| traits.favorite / traits.adking | false |
| eventSeasonContext | null。年度成績点の確定と消費状態 |

既存のcntSave、cntSaveWin、cntBoldWin、cntBoldFail、cntSnack、pendStat、能力・carryを保持する。aggregateから未計測の専用累計を推定しない。広告王をcntBoldWin全体でretroactive解放しない。

ensureEventStateは副作用の小さい補完関数。欠損のみ補完、金額は非負の安全な整数、カウンターは非負整数へ正規化。移行だけで入金・rng消費・特性解放しない。既存記帳合計を総所得へもう一度足さない。複数回呼んでも同じ結果。

現行のrun状態へ接続し、今回のためにセーブ機能やlocalStorage保存方式を追加しない。一回限りの保証は現在のrun状態内。将来のsave/loadが導入される場合はこれらのfieldも保存対象とする。

### 5.2 解決トランザクション

出現ID=`year:eventSequence:cardID`。カードIDだけでは重複可の抽選を区別できない。出現番号は抽選時に一回増やし再描画では増やさない。

1. 二重クリックを無効化し、pendingEventの出現ID・現在年度を確認。
2. processedに存在すれば保存済み結果を表示し、rng・記帳・累計・doneを再実行しない。
3. traits、所属、成功率をsnapshot。成否のrngを一回、必要なtargetのrngのみ一回。
4. stateの必要部分の作業コピーへ能力・成績点・故障加算を適用。
5. 成功入金とカウンターを計算。特性判定を最後に行う。
6. 作業コピーと確定結果を同期的にcommitし、processedへ登録。DOM描画はその後。
7. 結果文と実数値を表示、続行callbackは一回のみ。

同期処理中にawaitやUI callbackを挟まない。表示失敗で再入金しない。結果ログへeventOccurrenceID/cardID/mode/success/category/tier/target/abilityDelta/statDelta/overflowStat/injuryAdded/incomeYen/yearを残す。文案のHTMLをそのまま信頼せずescapeまたは既存の安全な表示経路を使う。

### 5.3 金額と記帳

金額は円の整数。別紙のincomePolicyを正本として使う。

| lv | base円 | lv | base円 |
|---|---:|---|---:|
| HS / U | 0 | CORP | 30,000 |
| IND | 50,000 | NPB_DEV | 30,000 |
| NPB2 | 100,000 | NPB1 | 1,000,000 |
| KBO2 | 80,000 | KBO1 | 600,000 |
| CPBL2 | 50,000 | CPBL1 | 300,000 |
| R | 30,000 | A1 | 50,000 |
| A2 | 80,000 | A3 | 150,000 |
| MLB | 3,000,000 | | |

成功時だけbase×modeMultiplier×adkingMultiplier。safe=.5、norm=1、bold=1.5、解決前adking=trueなら1.1。base=0は0、base>0は `max(1,Math.round(rawYen/10000))*10000`。最後に一回だけ丸める。失敗は0。

入金>0ならledgerへ1件追加しcareerOutsideIncome、yearOutsideIncome、careerEarningsへ各一回加算。年俸・currentSalary・ct・base/bonus/incentive/buyout・corpIncomeには加算しない。careerEarningsは既存の総所得fieldへ接続し、UIでcareerEarnings+careerOutsideIncomeと再加算しない。

広告王5回目のbold成功は通常額、6回目から1.1倍。例：NPB1 bold=150万円、既存広告王なら165万円。CORP safe=1.5万円→2万円。MLB bold広告王=495万円。

年度開始時yearOutsideIncomeだけ0へ戻す。career値・ledgerを保持。季末や引退でledgerを再支払しない。給与説明画面、選手詳細、引退・共有に年俸／スポンサー／総所得の別項目を表示。社会人給与とスポンサーの区分を保持する。

## 6. 成績点の年度消費

### 6.1 共通

イベントstat、能力80超過、既存恋愛等が生成するpendStatは同じ年度待機点へ加算し、一回だけ消費する。イベント由来を別途もう一度適用しない。

PROは既存proSeasonの正数だけのblockを置き換える。simSeason後、既存の基礎上限制御後、effort/onetool前。p=pendStat×seasonFactor。baseD・formAdjustment・st.dをイベント点で直接変更しない。最終statsがsalary評価へ反映される既存経路を使用し、payDへイベント点を重ねて足さない。

### 6.2 PRO：p>0

| 対象 | 処理 |
|---|---|
| 後援登板 | addG=min(max(0,min(68,L.g)−G),round(p×1.2))、G+=addG、IP+=addG×1.05 |
| 全投手 | SO+=round(p×8)、IP+=p×4 |
| SP | W+=round(p×.4) |
| MR/CL | SV+=round(p×.6)。原版の役割扱いを採用、MR専用HLD加算へ独自変更しない |
| 投手率 | 暫定era=IP>0ならclamp(旧era−p×.05,1.4,9.9)、ER=round(暫定era×新IP/9) |
| 野手機会 | addG=min(max(0,L.g−G),round(p×1.5))、addPA=round(addG×4.25)、addAB=round(addPA×.9) |
| 野手内容 | G/PA/ABへ加算。addH=clamp(round(addAB×.55)+round(p×1.5),0,新AB−旧H) |
| 野手長打・打点 | addHR=min(addH,round(p×1.2))、H+=addH、HR+=addHR、RBI+=round(addHR×2.1+(addH−addHR)×.3) |

### 6.3 PRO：p<0と整合性

q=abs(p)。

| 対象 | 処理 |
|---|---|
| 全投手 | SO=max(0,SO−round(q×6))、W=max(0,W−round(q×.3)) |
| MR/CL | SV=max(0,SV−round(q×.4)) |
| 投手率 | IP>0なら暫定era=clamp(旧era+q×.08,1.4,9.9)、ER=round(暫定era×IP/9) |
| 野手 | loseH=min(H,round(q×2))、H-=loseH、HR=min(H,max(0,HR−round(q×.5)))、RBI=max(0,RBI−round(q×1.2)) |

負数でG/PA/AB/IPを直接減らさない。p=0は既存成績を変更しない。

日本版向け正規化：このイベント補正がIPを変更する場合、内部IPは実際のイニング数の数値として扱い、追加分を出局数へ変換する。`newOuts=round(oldIP×3)+round((addG×1.05+p×4)×3)`、`IP=newOuts/3`。表示は既存fmtIPへ渡す。負数でIPが変わらない場合はIPを維持。全ゲームのIP保存方式を一括変更しない。

ユーザー確認（2026-10-07）：p≠0の年度だけイベント処理後とeffort/onetool処理後に整合性を確保し、集計・受賞・市場評価には同じ最終stを使う。p=0の年度では既存ERA/WHIP・機会上限処理を維持し、本節の新しい再計算を適用しない。全休は従来のゼロ成績と待機点消去を維持する。

- 非負整数の累積値、G<=L.g、0<=HR<=H<=AB<=PA。
- PA追加でBBは増やさず、PAとABの差を無理に全部BBへ変換しない。
- avg=AB>0?H/AB:0。既存のOBP/SLG/OPS表示・計算ヘルパーへ最終H/HR/AB/BBを渡す。存在しない二塁打・三塁打・TBを創作しない。
- ERA=IP>0?ER×9/IP:0、WHIP=IP>0?(H+BB)/IP:0。表示時に既存の桁で丸める。暫定eraとER由来の表示値の小差は許容する。
- 投手G>=ceil(IP/9)を満たし、G<=L.gのためIP<=9×L.gに制限。極端な値の保護だけで通常値を切り詰めない。
- MR/CLはSV<=floor(G×.85)、HLD<=G−SV、W+L<=G−SV−HLD。SPはW+L<=G。
- effort/onetoolで上限を超えても集計前に上記を再適用。成績点を再適用して調整しない。
- 全休はゼロ成績を保持し待機点を0へ戻す。前年からの点を翌年へ持ち越さない。

### 6.4 HS/U/CORP/IND：大会入力への接続

日本版は独立を含むこれらの段階で個人成績を生成していない。新しいPA/IP等を作らず、現在の大会関数へ接続する。

大会処理開始時に `eventSeasonContext={year,form:pendStat,consumed:false}` を一回だけ確定。同年度の再入時はformを取り直さない。大会キーが完了済みなら既存のガードで再計算しない。

cupOnceは `overall=ovr()` を維持し、`power=overall+form+既存学校補正+既存ri(-8,8)` に変更。tournamentResultへ渡すoverallは変更しない。これにより同じ点をpowerとoverallへ二重に加算しない。qualifierOnceは `qualificationResult(ovr()+form+既存学校補正+既存ri(-8,8))`。

formはseasonFactorを掛けず原値を使う。これは日本版の大会単位構造への適応。新規rng呼び出しは追加しない。大会結果が変わると後続大会への出場や消費rng数が変わることは正常。

INDのrecordIndependentSalaryEvaluation(results)には変更後の実際の大会resultsを渡す。現行fallback方針を保持し、個人成績ベースの完成評価を装わない。大会ごとにpendStatを減算せず、年間大会が完了した時に一回0へ戻してcontextをconsumedにする。全休早期return、年間完了、advanceの境界で残留点がないことを確認する。contextのyearが不一致なら旧点を破棄し、新年度を初期化する。

## 7. 特性と累計

別紙のcounter表をそのまま使う。effectiveCategoryで分類累計を判定する。snackRiskはID25/36/75の非safe失敗を数える。cancerの旧「全bold失敗>=10」を残して二重解放しない。

| 特性 | 条件 |
|---|---|
| adking | cntEndorseBoldWin>=5 |
| favorite | age<25、cntNormWin>=10 |
| clutch | age<25、cntBoldWin>=7 |
| disc | age<25、cntSaveWin>=15、love.caught=0、cntSnack<5 |
| cancer | 未解放、franchise/intlaceなし、cntSocialBoldFail>10またはscum |
| distract | 未解放、discなし、love.affairs+love.caught+cntSnack>=4、かつlove.affairs+love.caught>=1 |

欠損love.caughtは0として参照。既存discの衰退遅延、distractのダイス減は維持。既存移行状態への補完だけで新特性を解放しない。

愛将の日本版接続を次に固定する：

- 投手simSeasonのperfFをletにし、favoriteならmax(perfF,.85)。投手の投球負荷・故障係数はその後の既存処理。
- 野手の通常出場係数F=clamp(staF×perfF,.10,1)。favoriteならF=max(F,.85)。既存seasonFactorと `.95+R()×.06` をその後に掛ける。
- dpQualのyouthAdjは `(age<24?-3:age<26?-1.5:0)+(favorite?-3:0)`。同じ若手優遇の加算形を採用、若手と愛将の両方なら−6まで重なる。DH等の既存例外は維持。
- 85%は基礎出場係数の下限。故障・最終乱数を反映した実試合数の85%保障と表示しない。
- 特性説明は「通常の起用係数に下限0.85、守備資格の閾値−3、通常選択の成功率+5ポイント」と実装に合わせる。

traitsの名称・効果はゲーム内TRAIT_LABELS、TN/TN2、選手詳細、引退・共有画像の各経路で一致させる。広告王はスポンサー以外の年俸・契約金へ効果を付けない。

## 8. UIと説明

イベント導入、3選択肢、個別成功／失敗文は別紙どおり。5ch風文案を給与説明や技術エラーまで広げない。

補助表示に分類、成功率、訓練点または成績点、成功時入金、指定mode失敗時の故障加算を表示。訓練点+3を「能力+3」と表示しない。rand対象は解決前に能力名を確定しない。

結果欄は文案と実変化を併記する。育成点がcarryへ残った場合、能力が上がらなかった理由を表示。スポンサーは「スポンサー収入：150万円」のように実入金額を出す。負の成績点も表示する。成功で入金なしのカテゴリーにスポンサー欄を出さない。

現在年度の能力点配分・恋愛・健康選択・成績画面への戻り先を維持。モバイルで選択肢、率、結果が途切れず、二重タップで同じ結果を二回適用しない。

## 9. 実装順序

| 順 | 作業 | 完了条件 |
|---:|---|---|
| 1 | 別紙JSON抽出、92件module、validation | ID・条件・文案・planの自動検査が通る |
| 2 | event-policy、能力、率、income、counter | 純粋関数の境界テストが通る |
| 3 | state補完と抽選・resolve接続 | 92件が出現、重複カードを別出現として扱う |
| 4 | 入金・ledger・所得表示 | 二重払いなし、年俸に混入なし |
| 5 | PRO正負成績点、大会power接続 | 全休・通常年・INDで年度消費を確認 |
| 6 | 特性判定・愛将起用・表示 | 解放と実数値効果の一致 |
| 7 | 全体テスト・モバイル・文書同期 | 第10節を満たし、実装結果を記録 |

順序は依存関係であり別リリースを必須としない。途中の未接続状態を完成版として公開しない。

## 10. 検証・受入条件

### 10.1 データと数値のテスト

| ケース | 期待 |
|---|---|
| 92件・3分類・3選択肢 | 92、43/35/14、全件bold/norm/safe |
| 各ID×3mode×3tier×2成否 | 1,656件のplanが別紙と一致 |
| 各ID×3mode×2成否×clutch有無 | 1,104件の故障加算がマスクと一致 |
| 一般／clutch／clutch+genius bold | 35%／55%／60% |
| favorite一般norm、thief一般norm | 55%／40% |
| age34と35、捕手F、PのFカード | 34可、35不可、捕手可、投手不可 |
| NPB1対象をNPB2で抽選 | 対象外 |
| HS encounter、IND encounter | training、encounter |
| ability=0かつrand | 対象rngを消費しない |
| P能力49、pot80、carry0、育成2 | 50、carry1。新cost2 |
| P sta63、pot80、育成2 | 64、carry1 |
| 野手cur64=pot、carry0、育成6 | 65、carry0。潜在以上のcost6 |
| cur80育成3 | 能力80、overflowStat3 |
| cur2の能力−3 | 能力1、成績点0 |
| NPB1 bold広告王なし／あり | 1,500,000円／1,650,000円 |
| CORP safe、失敗 | 20,000円／0 |
| 5回目スポンサーbold成功 | 今回通常額、解放後の次回1.1倍 |
| 同一出現を再解決 | state・rng・ledger・callbackが増えない |
| 同じカードを別出現で解決 | それぞれ一回適用可 |

### 10.2 年度統合のテスト

- 野手基礎G100/PA425/AB380/H100/HR10/RBI50、L.g143、p2：addG3、addPA13、addAB12、addH10、addHR2。結果G103/PA438/AB392/H110/HR12/RBI57。avgは110/392。
- 同基礎のp−2：G/PA/AB維持、H96、HR9、RBI48、avg96/380。
- SP基礎IP100/SO100/W10/era4、p2：IP108、SO116、W11、ER47、最終ERA47×9/108。判定用baseDは変えない。
- 後援でSV/HLD/W/Lが増えた後も第6節の機会制約内。負成績点も0未満なし。
- seasonFactor=.5でpendStat2ならPROのp1。全休ならp0、個人成績0、待機点0。
- 同一乱数入力で大会powerだけform分変化。overallは不変。完了キーを再実行しない。
- IND成績点から大会結果・fallback評価へ接続し、PA/IPを新規作成しない。
- PRO/HS/U/CORP/INDの通常終了、全休、年度進行で前年点が残らない。
- income記帳後にphaseEnd/引退/共有を開いても総所得が増えない。
- ensureEventStateを二回呼び、既存所得・能力・counter・rngが保持される。
- 愛将の若手／年長守備補正、野手低体力、投手perfF、故障.5を各検査。
- 同じ版・seed・選択列を二回走らせ、カード列・結果・所得・特性・成績が一致。
- 年俸・昇降格・社会人給与の既存テストを実行し、スポンサーによる二重計算がない。

### 10.3 UI検証と完了報告

PCとモバイル幅でイベント、所得詳細、特性説明、引退・共有を確認。日本語の文字化け、長文はみ出し、ボタン二重タップ、undefined表示を確認する。

完了報告には変更ファイル、テストの実際の結果、未解決事項、文書改訂を記載。未実行テストを通過と書かない。2026-10-07にdevへ接続し、1,656plan・1,104故障ケース・552ブラウザ成否分岐・PC/320/390px・六seed二回全生涯比較を実行して一致。表示と重複解決のRNG消費は0、給与契約の既存テスト合格。実機iOS Safari／Android Chromeは未確認。Previewと正式公開は別工程。

本書作成時に別紙の92件×18=1,656件の効果planと92件×12=1,104件の故障加算を原版の独立抽出ルールと照合済み。これは現行サイトへ接続済みという意味ではない。

## 11. 文書同期とCodexへの実行指示

2026-10-07ユーザー確認：本移植による旧版seed結果と必要なRNG消費順・回数の変化を承認済み。別紙のJSON documentRevisionを本文と同じ3へ統一する。RNGアルゴリズム、seed-only URL、表示時のRNG消費0は維持する。

仕様変更時は別紙と本書を同じ作業で更新する。別紙のJSON、一覧、個別説明、共通ルールの一致を再検査。実装固有の新しい適応や制約を記録し、原版完全一致と誤記しない。

初回依頼時の指示（履歴。実装先はAGENTSに従い開発元devとし、公開用repositoryは直接編集しない）：

> 添付の「YAKYUJINSEI_JP_EVENT_92_COMPLETE_DATA.md」改訂3と「YAKYUJINSEI_EVENT_SYSTEM_IMPLEMENTATION_SPEC.md」改訂1に従い、yakyujinsei-siteの92枚イベントシステムを実装してください。まず現在のブランチ・コード・リポジトリ指示を確認し、参照v1.7.0から変わった接続箇所を調整してください。ID・日本語文案・条件は完全データ、処理順・成績式・入金・移行・検証は実装仕様書に従ってください。二刀流は追加しないでください。日本版の直接抽選PRO3枚／その他2枚、重複可を維持してください。年俸計算をスポンサー収入と混同せず、独立の個人成績を新規生成しないでください。必要な変更と検証を最後まで行い、二つの文書も実装結果に合わせて更新してください。仕様間の矛盾や未指定事項が結果を左右する場合は、具体的な箇所と選択肢を示してください。完了時に変更内容、実行したテスト、残る制約を報告してください。

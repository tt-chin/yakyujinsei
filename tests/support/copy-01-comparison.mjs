// COPY-01 batch 2 (2.2.1): approved Japanese display strings only. Never call on S or RNG.
// Maps the candidate's new text back to the old baseline wording, so historical DOM/text
// comparisons stay strict for everything else. The function is self-contained because the
// E2Es inject it into the page with toString().
import {execFileSync} from 'node:child_process';

export const COPY_01_BATCH2_MARKER='年齢による衰えは進みますが、追加トレーニングで能力を補うことはできます。';

// True when the baseline predates batch 2: its product source lacks the new decline sentence.
// Search docs/src only; docs/reviews quotes the approved wording before it shipped.
export function baselineNeedsCopy01Batch2(ref,root){
  try{execFileSync('git',['grep','-q','-F',COPY_01_BATCH2_MARKER,ref,'--','docs/src'],{cwd:root,stdio:'ignore'});return false;}
  catch(error){if(error.status===1)return true;throw error;}
}

export function projectCopy01Batch2(text){
  if(typeof text!=='string')throw Error('COPY_01_STRING_REQUIRED');
  const pairs=[
    ['謝罪し、もう一度チャンスをくれるよう彼女に頼む','謝罪してもう一度チャンスを彼女に懇願する'],
    ['for="seed-show">シード</label>','for="seed-show">ワールドシード</label>'],
    ['選手名・ポジション・シードを選び、野球人生を始めます。同じシードでも選択やバージョンによって結果は変わります。','選手名・ポジション・ワールドシードを選び、野球人生を始めます。同じSeedでも選択やバージョンによって結果は変わります。'],
    ['右上のメニューからシード共有と表示設定を開けます。共有URLは途中の保存データではなく、そのシードで新しい人生を始めるためのものです。','右上のメニューからSeed共有と表示設定を開けます。共有URLは途中の保存データではなく、そのSeedで新しい人生を始めるためのものです。'],
    ['現在のシード','現在のSeed'],['シードをコピー','Seedをコピー'],['シードの文字列','Seedの文字列'],
    ['同じシードでも、選択やバージョンが異なると結果は変わります。','同じSeedでも選択やバージョンが異なると結果は変わります。'],
    ['カテゴリー別通算成績','階級別通算成績'],
    ['年齢による衰えは進みますが、追加トレーニングで能力を補うことはできます。','これまでどおり追加トレーニングはできますが、体が元に戻ることはありません。'],
    ['ボタンが使えない場合は、画像を長押しして保存してください。','ボタンが使えない場合は,画像を長押しして保存できます'],
    ['リーグ間移籍の上昇率上限を適用しました','跨リーグ移籍の上昇率上限を適用しました'],
    ['リーグ間移籍の年俸内訳','跨リーグ年俸内訳'],['リーグ間換算係数','跨リーグ係数'],
    ['米国国際契約の制限対象外として扱いました','年齢・認可一軍年資により外国プロ例外を適用しました'],
    ['過去の年度の詳細評価がないため、旧方式の値を使用しました','過去年の詳細評価がないため旧方式の値を使用しました'],
  ];
  for(const [current,old] of pairs)text=text.split(current).join(old);
  // 012: label and unit together; the dt/dd markup or plain textContent may sit between them.
  text=text.replace(/経過シーズン数(<\/dt><dd>|)(\d+)シーズン/g,'プレー年数$1$2年');
  // 027: the ability label is variable.
  text=text.replace(/（([^（）<>]+?)は潜在能力以上のため、ポイントを変換）/g,'（$1潜在的な限界に達しました)');
  return text;
}

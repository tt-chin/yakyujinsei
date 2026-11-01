// Love/marriage mid-season events and the partner name lists (OOP plan §2v).
// The career state is read through getState; clamp and the POS_AB/ABL tables are passed by reference, and the game.js
// ability/UI helpers and the R/chance/pick RNG bridge as late-binding lambdas. The name lists stay at module level; the
// rule bodies are the former game.js loveEvent/divorceRec/loveCaught/proposalAsk/loveCaughtDating/loveGainTxt, and each
// unit, including the deferred choose options that touch S directly, reads getState() live.
import { confidanteEligible } from './trait-policy.js';

/* 初期状態はすべて架空名;プレイヤー非表示エディターで名簿を編集可能(プレイヤー端末内だけに保存)。 */
let CHEER=['高橋美咲','佐藤彩花','中村ひなた','小林結衣','山本玲奈','伊藤七海','渡辺さくら','加藤真央','松本葵','吉田莉子','岡田美月','清水楓'];
const PARTNER_JOB={'高橋美咲':'チアリーダー','佐藤彩花':'スポーツアナウンサー','中村ひなた':'タレント','小林結衣':'女優','山本玲奈':'歌手','伊藤七海':'スポーツキャスター','渡辺さくら':'モデル','加藤真央':'お笑いタレント','松本葵':'チアリーダー','吉田莉子':'アイドル','岡田美月':'フリーアナウンサー','清水楓':'俳優','森川あかり':'スポーツキャスター'};
function partnerJob(name){return PARTNER_JOB[name]||'タレント';}
let CHEER_SAFE=['森川あかり']; /* 不倫相手にしない名簿：交際・結婚は可能、不倫候補には出さない。 */
function datePool(){ /* 交往/結婚名單。 */
  if(CHEER_SAFE.length>=CHEER.length) return CHEER_SAFE.slice();      /* 安全名單より長：直接整組替換。 */
  return CHEER_SAFE.concat(CHEER.slice(CHEER_SAFE.length));           /* より短：同数量替換進出名單。 */
}
function affairPool(){ return CHEER.slice(); } /* 不倫名單=元のチアリーダー名簿。 */

export class PlayerRomance {
  #rules;
  constructor(deps){this.#rules=romanceRules(deps);}
  loveEvent(next){this.#rules.loveEvent(next);}
}

function romanceRules({getState,clamp,POS_AB,ABL,addAb,addAbStat,card,board,choose,rng:{R,chance,pick}}){
  function loveEvent(next){
    const S=getState();
    const L=S.love;
    if(!Array.isArray(L.exes))L.exes=[];
    if(S.stage!=='PRO'||S.age<20){ next(); return; }
    /* 交往中：毎年必定走一輪(不吃確率基準)。 */
    if(L.st==='dating'){
      L.dyrs=(L.dyrs||0)+1;
      const y=L.dyrs;
      /* 交際が長引いて結婚しない場合、破局率を年々上げる。 */
      const cheatPen=(L.cheatYr===S.year-1||L.cheatYr===S.year)?30:0; /* 浮気した年は破局率+30%。 */
      const bkP=(y>=4?20+(y-4)*15:0)+cheatPen;
      if(bkP>0&&chance(bkP)){
        const k1=pick(POS_AB[S.pos]),k2=pick(POS_AB[S.pos]);
        const g1=addAb(k1,-3),g2=addAb(k2,-3); board(1);
        const ex=L.partner; L.st=L.exes.length?'divorced':'single'; L.partner=null; L.dyrs=0;
        card('bad','破局',`${cheatPen?'あの夜のことを、彼女は本当はすべて知っていた。':''}交際${y}年、結婚は何度も延期された。<b class="hl">${ex}</b>は最後に『もう待てない』と言い残し、背を向けた。オフシーズン中ずっと抜け殻のように過ごした――<b class="dn">${ABL[k1]} ${g1}、${ABL[k2]} ${g2}</b>。`);
        next(); return; }
      const ask=()=>proposalAsk(next);
      if(chance(30)){ /* 30%で先に短いイベントを挟み、終了後は通常どおりプロポーズ判定。 */
        const r=R()*100;
        if(r<40){ const t=pick(affairPool().filter(n=>n!==L.partner));
          choose(`食事会の帰り、${t}が「同じ方向だから車に乗せて」と言ってきた`,[
            {t:'車に乗せる（勝負に出る）',warn:true,s:'バレなければスタミナ上昇｜バレたら能力低下・その年の破局率+30%',f:()=>{
              L.affairs++;
              if(chance(55)){ const gt=loveGainTxt('sta',2); board(1);
                card('bad','深夜のドライブ',`誰にも撮られなかった。ハンドルを強く握る――${gt}。（この道にハッピーエンドはない）`); ask(); }
              else loveCaughtDating(next); }},
            {t:`「方向が違う」と断り、${L.partner}を家まで送る`,main:true,s:'関係が深まり、デメリットなし',f:()=>{
              const gt=loveGainTxt('sta',1); board(1);
              card('good','正解',`${L.partner}に「すぐ着く」とメッセージを送った――${gt}。`); ask(); }}]); return; }
        if(r<70){ const gt=loveGainTxt('sta',1); board(1);
          card('good','オールスターで公開いちゃつき',`オールスターのエキシビション。カメラがスタンドの <b class="hl">${L.partner}</b>を映すと、あなたはグラウンド越しに合図。中継には即ハート演出が入り、翌日は尊すぎるとトレンド入り――${gt}。`); ask(); return; }
        const gt=loveGainTxt('sta',1); board(1);
        card('good','長年の交際',`交際${y}年目。大ニュースはない。ただ遠征が終わるたび、空港の出口には彼女が買ってくれたホットコーヒーがある――${gt}。`); ask(); return; }
      ask(); return;
    }
    const fire=(L.st==='married'&&L.kids===0)?40:(L.st==='single'||L.st==='divorced')?40:30;
    if(!chance(fire)){ next(); return; }
    /* 未婚/離婚：熱愛報道 → 二段階判定 → 交往。 */
    if(L.st==='single'||L.st==='divorced'){
      const p=pick(datePool());
      card('info','グラウンド外の話題',`あなたと人気${partnerJob(p)}の <b class="hl">${p}</b>が球場外で一緒にいるところを撮られ、熱愛疑惑が芸能面のトップに。${L.exes.length?'（コメント欄：「離婚歴あるのにモテすぎやろ」）':''}`);
      choose('記者がマイクを向けてきた。「お二人は付き合っているんですか？」',[
        {t:'堂々と認める：「温かく見守ってください」',s:'相手の所属先が認めるか次第（厳しいイメージ管理の噂）',f:()=>{const S=getState();
          if(chance(65)){ L.st='dating'; L.partner=p; L.dyrs=0; L.datedTimes=(L.datedTimes||0)+1;
            const gt=loveGainTxt('sta',1); board(1);
            card('gold','交際公表',`<b class="hl">${p}</b>がSNSに手をつないだ写真を投稿。「祝福ありがとうございます」。恋は人を輝かせる――${gt}。二人は正式に交際を始めた。`);
            if(confidanteEligible(S)){ S.traits.confidante=true;
              card('gold','隠し称号：女友達止まり',`交際は3度目。それでも恋が長く続かず、いつしか友達のような距離に戻ってしまう――今度こそ、その先へ進めるだろうか。`); board(1); }
          }
          else{ card('bad','一方的な交際宣言',`翌日、${p}は所属先を通じて「ただの友人です」と否定。${partnerJob(p)}として<b class="dn">イメージ管理が厳しい</b>らしく、相当な圧力があったようだ。一人だけ取り残されてクッソ気まずい。`); }
          next(); }},
        {t:'笑って答えず、足早に立ち去る',main:true,s:'認めなければ進展なし',f:()=>{
          card('info','つづく','熱愛騒動は3日で鎮火。まだタイミングではなかったのかもしれない。'); next(); }}]); return;
    }
    /* 已婚。 */
    if(L.kids<4&&chance([65,45,30,20][L.kids])){ /* 出産確率は第1子を最も高くし、子どもが増えるほど下げる。 */
      L.kids++; const kk=pick(POS_AB[S.pos]); const gt=loveGainTxt(kk,2); board(1);
      card('gold','新しい家族',`${L.partner}が第<b class="hl">${L.kids}</b>子を無事出産。${L.kids>1?'何度経験しても':''}父親になった男の目は、以前とは違う――${gt}。`);
      next(); return;
    }
    const r=R()*100;
    if(r<40){ /* 不倫の誘惑は結婚後イベントで唯一のリスク選択。 */
      const t=pick(affairPool().filter(n=>n!==L.partner));
      choose(`遠征先のホテルバー。${t}から「もう寝た？」とメッセージが届いた`,[
        {t:'会いに行く（勝負に出る）',warn:true,s:'バレなければスタミナ上昇｜バレたら能力低下・夫婦関係が危機に',f:()=>{
          L.affairs++;
          if(chance(55)){ const gt=loveGainTxt('sta',2); board(1);
            card('bad','深夜の密会',`写真を撮られなかったのは不幸中の幸い。罪悪感が妙な高揚感に変わっていく――${gt}。（ろくな結末にならないことは分かっている）`);
            next(); }
          else loveCaught(next); }},
        {t:'「子どもに絵本を読んでた。おやすみ」と返信する',main:true,s:'家族を大事にして損はない',f:()=>{
          const gt=loveGainTxt('sta',1); board(1);
          card('good','家族のもとへ',`スマホをテーブルに置き、自宅へビデオ通話をかけた。${L.partner}と子どもが画面の向こうで手を振っている。心が落ち着けば、体の調子も整う――${gt}。`); next(); }}]); return; }
    if(r<70&&L.kids>0){ /* 愛小孩新聞。 */
      const gt=loveGainTxt('sta',1); board(1);
      card('good','球場に来たパパ',`試合前、防球ネット越しに子どもへグラブの使い方を教える姿が撮影され、「最高の野球教室」としてSNSで拡散。コメント欄は「人生の勝ち組やん」で埋まった――${gt}。`); next(); return; }
    /* 結婚紀念日。 */
    const gt=loveGainTxt('sta',1); board(1);
    card('good','結婚記念日',`結婚記念日は自主トレを切り上げ、<b class="hl">${L.partner}</b>と式を挙げた会場を訪れた。「来年もまた来ようね」と彼女が笑う。${gt}。`); next();
  }
  function divorceRec(){ const S=getState(); const L=S.love;
    L.exes.push({name:L.partner,kids:L.kids});
    L.st='divorced'; L.partner=null; L.kids=0; /* 再婚後小孩再計算。 */ }
  function loveCaught(next){
    const S=getState();
    const L=S.love; L.caught++;
    const kk=pick(POS_AB[S.pos]); const g=addAb(kk,-3);
    let extra='';
    if(L.caught>=2){
      if(!S.traits.scum){ S.traits.scum=true;
        card('bad','隠し特性解放：クズ男','二度目の浮気現場を押さえられ、ファンからの評価は完全に固まった――<b class="dn">浮気がバレるたびに全能力−5</b>。'); }
      POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); });
      extra='<b class="dn">全能力 −5</b>（クズ男の代償）。'; }
    board(1);
    card('bad','一面スキャンダル',`パパラッチに撮られた写真がスポーツ紙の一面を占拠。スポンサー広告は即座に取り下げられ、会見で90度の謝罪をする羽目に。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
    choose(`${L.partner}が離婚届を食卓に置いた`,[
      {t:'土下座して、最後のチャンスを懇願する',s:'成功＝結婚継続｜失敗＝能力低下後に離婚',f:()=>{const S=getState();
        if(chance(40)){
          card('info','どん底を越えて',`一晩中、話し合った。<b class="hl">${L.partner}</b>は最後に言った。「子どものためにも、私が知っているあなたに戻るためにも――これが最後」。離婚は避けられたが、元に戻らないものもある。`); next(); }
        else{ const k2=pick(POS_AB[S.pos]); const g2=addAb(k2,-2);
          const ex=L.partner; divorceRec(); board(1);
          card('bad','謝罪届かず',`彼女は黙って首を横に振った。翌日、弁護士から書類が届き、<b class="hl">${ex}</b>との離婚が成立。再炎上のおまけまで付いた――<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } }},
      {t:'離婚届に署名する',f:()=>{ const ex=L.partner; divorceRec();
        card('bad','離婚',`離婚届に署名した。<b class="hl">${ex}</b>の発表は「互いの幸せを願っています」の一文だけだった。`); next(); }}]);
  }
  function proposalAsk(next){
    const S=getState();
    const L=S.love; if(L.st!=='dating'){ next(); return; }
    choose(`交際${L.dyrs}年――${L.partner}が結婚式の動画をじっと見ている`,[
      {t:'今こそプロポーズする',s:'スタミナ上昇｜今季の故障率低下',f:()=>{const S=getState();
        L.st='married'; L.kids=0; L.dyrs=0;
        const gTxt=loveGainTxt('sta',2)+'、'; S.tmpInj-=5; board(1);
        card('gold','結婚式',`本拠地のホームベース後方で片膝をつく。大型ビジョンには「Marry Me」。<b class="hl">${L.partner}</b>は泣きながらうなずいた。オフに結婚し、レッドカーペットにはベースが並んだ――${gTxt}今季の故障率 <b class="up">−5%</b>。`); next(); }},
      {t:'もう少し貯金してからにする',main:true,s:'交際が長引くほど破局リスク上昇',f:()=>{
        card('info','今はまだ','彼女は動画を閉じ、笑顔で「大丈夫」と言った。その目に浮かんだものを、あなたは見なかったことにした。'); next(); }}]);
  }
  function loveCaughtDating(next){
    const S=getState();
    const L=S.love; L.caught++; L.cheatYr=S.year; /* 浮気が発覚した場合のみ、その年の破局率を+30%。 */
    const kk=pick(POS_AB[S.pos]); const g=addAb(kk,-3);
    let extra='';
    if(L.caught>=2){
      if(!S.traits.scum){ S.traits.scum=true;
        card('bad','隠し特性解放：クズ男','２度目の現行犯で捕まりました。これからファンの心の中にあるあなたのイメージが決定されていくのですが——<b class="dn">浮気・不倫がバレる度に全能力が－5</b>。'); }
      POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); });
      extra='<b class="dn">全能力 −5</b>（クズ男の代償）。'; }
    board(1);
    card('bad','浮気発覚',`ドライブレコーダーの画面が流出し、タイムラインも綺麗に揃っていました。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
    choose(`3日間の既読スルー後、${L.partner}がようやく会うことを承諾した`,[
      {t:'謝罪してもう一度チャンスを彼女に懇願する',s:'成功＝関係を続ける｜失敗＝能力がさらに低下して別れる',f:()=>{const S=getState();
        if(chance(40)){
          card('info','どん底を越えて',`彼女は泣きながら怒りをぶつけ、最後に「これが最後」と言った。関係は続いたが、信頼の亀裂は消えない。`); next(); }
        else{ const k2=pick(POS_AB[S.pos]); const g2=addAb(k2,-2);
          const ex=L.partner; L.st=L.exes.length?'divorced':'single'; L.partner=null; L.dyrs=0; board(1);
          card('bad','謝罪届かず',`彼女は贈り物を箱ごと送り返し、<b class="hl">${ex}</b>への連絡手段はすべてブロックされた――<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } }},
      {t:'穏やかに別れる',f:()=>{ const ex=L.partner;
        L.st=L.exes.length?'divorced':'single'; L.partner=null; L.dyrs=0;
        card('bad','破局',`<b class="hl">${ex}</b>のストーリー投稿は真っ黒な画面だけ。ファンは誰のせいか察していた。`); next(); }}]);
  }
  function loveGainTxt(k,amt){ /* 恋愛イベントの能力加算：処理はイベントカード(addAbStat);実際の増減を正確に表示。 */
    const S=getState();
    const before=S.pendStat||0;
    const g=addAbStat(k,amt);
    const over=(S.pendStat||0)-before;
    if(g>0&&over>0)return `<b class="up">${ABL[k]} +${g}</b>（上限超過${over}ポイントは今季成績ボーナスへ変換）`;
    if(g>0)return `<b class="up">${ABL[k]} +${g}</b>`;
    if(over>0)return `<b class="up">今季成績ボーナス＋${over}</b>（${ABL[k]}潜在的な限界に達しました)`;
    return `${ABL[k]}の能力ポイントを蓄積したが、能力値の上昇には届かなかった`;
  }
  return {loveEvent};
}

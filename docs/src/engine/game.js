import { VERSION } from '../config.js';
import { JP_DATA } from '../data/jp-data.js';
import { MARKET_BASELINES } from '../data/salary-market-data.js';
import { crossOfferTitle, crossOfferType, demotionChoiceText, findDemotionTarget, isBelowActiveMinimum } from './career-policy.js';
import { calculateSalaryCurve, convertRatingBetweenLevels, roundToTenThousandYen, salaryAwardBonus, salaryEvaluationD } from './salary-promotion-policy.js';
import { appendSalaryEvaluation, buildIndependentLeagueFallbackEntry, buildSalaryEvaluationEntry, calculateMarketRating, hasActualPerformanceData } from './salary-evaluation-policy.js';
import { appendSalaryDecision, buildSalaryDecision, salaryReasonLabel } from './salary-explanation-policy.js';
import { createSalaryDetailController } from '../ui/salary-detail.js';
import { appendExtension, applyLevelMinimumToUnpaidSchedule, calculateScheduledBuyout, contractContinuationForNextYear, contractNeedsRenewal, createContract, markSalaryPaid, normalizeContract, salaryDueForYear, transferContract } from './contract-policy.js';
import { calculateControlOffer, getContractStage, migrateServiceTime } from './control-period-policy.js';
import { classifyMarketInjury, injurySalaryMultiplier, isRecentStar } from './injury-market-policy.js';
import { calculateArbitrationTerms } from './arbitration-policy.js';
import { baseFaOfferCount, buildFaOffer, buildMarketContext, competitionMultiplier, contractTypeMultiplier, generateBidJitters } from './market-policy.js';
import { applyIncentivePayment, createIncentiveTerms } from './incentive-policy.js';
import { playerMarketCategory, rankTeamsByDemand, teamDemandLabel, teamDemandMultiplier } from './team-demand-policy.js';
import { acceptDraftSelection, declineDraftSelection, draftSigningTerms, isDraftFallbackResult } from './draft-signing-policy.js';
import { createChoiceActionToken, runChoiceAction } from '../ui/choice-action.js';
import { honorScoreFor } from './hall-of-fame-policy.js';
import { canPlayHighSchoolFall, canPlaySenbatsu, nextSenbatsuEligibleYear, qualificationResult, qualifiesForChampionship, qualifiesForCorporateJapan, qualifiesForUniversityJingu, tournamentResult } from './domestic-tournament-policy.js';

window.__YAKYO_JP_DATA__ = JP_DATA;

/* シード固定対応RNG。 */
const INITIAL_PARAMS=new URLSearchParams(location.search);
let SEED = INITIAL_PARAMS.get('seed') || (()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0].toString(36).slice(0,8);})();
if(INITIAL_PARAMS.has('seed')&&INITIAL_PARAMS.size!==1){
  history.replaceState(null,'',`${location.pathname}?seed=${encodeURIComponent(SEED)}${location.hash}`);
}
let _s = 0;
function seedInit(str){ _s = 1779033703; for(let i=0;i<str.length;i++){ _s = Math.imul(_s ^ str.charCodeAt(i), 3432918353); _s = _s<<13 | _s>>>19; } }
function R(){ _s|=0; _s = _s + 0x6D2B79F5 |0; let t = Math.imul(_s ^ _s>>>15, 1|_s); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; }
const ri=(a,b)=>a+Math.floor(R()*(b-a+1));
const pick=a=>a[Math.floor(R()*a.length)];
const chance=p=>R()*100<p;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function scrollBottom(){ /* iOS Safari iframe内でスムーズスクロールでは白画面が起きやすいため、同期スクロールへ変更+rAF。 */
  try{ requestAnimationFrame(function(){ window.scrollTo(0, document.body.scrollHeight); }); }
  catch(e){ try{ window.scrollTo(0, document.body.scrollHeight); }catch(_){} }
}
const N0=(sd)=> (R()+R()+R()+R()-2)/2*sd*2; /* 正規分布の近似。 */

/* 静的データ。 */
const ABL={sta:'スタミナ',vel:'球速',ctl:'制球',brk:'変化球',con:'Contact',pow:'パワー',spd:'走力',eye:'選球眼',rng:'守備範囲',fld:'捕球',arm:'肩力',cat:'リード'};
const POS_AB={P:['sta','vel','ctl','brk'],C:['sta','con','pow','spd','eye','rng','fld','arm','cat'],IF:['sta','con','pow','spd','eye','rng','fld','arm'],OF:['sta','con','pow','spd','eye','rng','fld','arm']};
const POSN={P:'投手',C:'捕手',IF:'内野手',OF:'外野手'};
/* 守備位置システム。 */
const DPN={SS:'遊撃手','2B':'二塁手','3B':'三塁手','1B':'一塁手',
 CF:'中堅手',RF:'右翼手',LF:'左翼手',DH:'指名打者',C:'捕手'};
/* 守備位置ごとに守備範囲・捕球・肩力の基準をリーグ基準から補正する。三塁に遊撃並みの守備範囲は求めず、一塁では肩力をほぼ評価しない。 */
/* 守備位置ごとに重視する能力を変え、総合守備評価を返す。 */
function dpScore(p){ const a=S.ab;
  switch(p){
    case 'SS': return a.rng*0.5 + a.fld*0.3 + a.arm*0.2;   /* 遊撃手：守備範囲を重視。 */
    case '2B': return a.rng*0.45+ a.fld*0.4 + a.arm*0.15;  /* 二塁手：守備範囲と捕球を重視し、肩力は補助。 */
    case '3B': return a.arm*0.45+ a.fld*0.35+ a.rng*0.2;   /* 三塁手：肩力を重視。 */
    case 'CF': return a.rng*0.55+ a.fld*0.3 + a.arm*0.15;  /* 中堅手：守備範囲を重視。 */
    case 'RF': return a.arm*0.45+ a.rng*0.35+ a.fld*0.2;   /* 右翼手：強肩を重視。 */
    case 'LF': return a.rng*0.4 + a.fld*0.35+ a.arm*0.25;  /* 左翼手：守備範囲を中心に、基準は低め。 */
    case 'C':  return a.fld*0.4 + a.cat*0.4 + a.arm*0.2;   /* 捕手：捕球・リード・肩力を重視し、守備範囲は評価しない。 */
    case '1B': return a.fld*0.6 + a.rng*0.2 + a.arm*0.2;   /* 一塁手：捕球を重視し、基準は低め。 */
    default: return 99;
  }
}
/* 守備位置・リーグ別の守備基準。守備評価が基準以上なら守備可能とし、MLBを最も厳しくする。 */
const DP_TH={
  C:  {CPBL1:46, NPB1:54, MLB:60},
  SS: {CPBL1:50, NPB1:58, MLB:64},
  CF: {CPBL1:49, NPB1:57, MLB:63},
  '2B':{CPBL1:46,NPB1:53, MLB:59},
  '3B':{CPBL1:44,NPB1:51, MLB:57},
  RF: {CPBL1:43, NPB1:50, MLB:56},
  LF: {CPBL1:41, NPB1:47, MLB:53},
  '1B':{CPBL1:36,NPB1:42, MLB:48}};
const DP_BAR={CPBL1:45,NPB1:54,MLB:60}; /* 保持与える捕手 cOk 等旧判定。 */
const DP_MULT={SS:1.15,CF:1.15,C:1.12,'2B':1.05,'3B':1.05,RF:1.05,'1B':1.0,LF:1.0,DH:0.92};
function dpBar(){ /* 年輕球員吃能力上限紅利、球団不急著拔守備位置。 */
  const base=DP_BAR[S.lv]||0;
  const disc=S.age<=21?7:S.age<=24?5:S.age<=26?2:0;
  return base-disc;
}
function dpQual(p){
  if(p==='DH')return true;
  if(!DP_TH[p]||!DP_TH[p][S.lv])return true;   /* トップ階級以外のリーグでは制限しない。 */
  /* 年輕球員吃能力上限紅利：基準略降(球団与える時間成長)。 */
  const youthAdj = S.age<24?-3 : S.age<26?-1.5 : 0;
  return dpScore(p) >= DP_TH[p][S.lv]+youthAdj;
}
const DP_RANK={SS:0,CF:0,'2B':1,'3B':2,RF:2,'1B':3,LF:3,DH:4,C:0}; /* 守備位置市試合価値の序列(SS>2B>3B)。 */
function dpList(){ /* 守備難易度順に、内野手は内野、外野手は外野を走査し、守れる中で最上位の位置を選ぶ。 */
  /* 候補守備位置は現在の守備群に合わせ、内野・外野それぞれの守備スペクトラムから選ぶ。 */
  const order = S.pos==='IF'
    ? ['SS','2B','3B','1B']       /* 内野：遊撃＞二塁＞三塁＞一塁。 */
    : ['CF','RF','LF','1B'];      /* 外野：中堅＞右翼＞左翼＞一塁。 */
  const q=order.filter(dpQual); q.push('DH'); return q;
}
function dpMult(){ return (S.pos!=='P'&&S.dpos)?(DP_MULT[S.dpos]||1):1; }
function dposReview(cont){
  if(S.stage!=='PRO'||!(S.lv==='CPBL1'||S.lv==='NPB1'||S.lv==='MLB')){ cont(); return; }
  if(S.pos==='C'){ /* 捕手の基準には余裕を持たせるが、基準を大きく下回れば一塁またはDHへ回す。 */
    if(!S.dpos)S.dpos='C';
    const cOk=()=>{ const bar=dpBar(), a=S.ab;
      return a.fld>=bar-6 && a.cat>=bar-4 && a.arm>=bar-2; };
    if(S.dpos==='C'){
      if(cOk()){ cont(); return; }
      const opts=[];
      if(dpQual('1B'))opts.push({t:'一塁手へコンバート',main:true,s:'年俸係数 ×1.00',
        f:()=>{S.dpos='1B';card('info','守備位置の変更','捕手用具をロッカーにしまった――新シーズンから<b class="hl">一塁手</b>へコンバート。');cont();}});
      opts.push({t:'指名打者へ転向',main:!opts.length,s:'年俸係数 ×0.92',
        f:()=>{S.dpos='DH';card('info','守備位置の変更','盗塁阻止率がリーグの笑いものに。球団は打撃に専念させることを決めた――<b class="hl">DH</b>。');cont();}});
      choose(`守備位置会議：首脳陣はもう捕手を任せられないと判断（${LV[S.lv].n}基準）`,opts); return;
    }
    if(cOk()){ /* 守備力が戻れば捕手へ再転向できる。 */
      choose('守備位置会議：ブルペン捕手から「また捕れるようになった」と報告',[
        {t:'捕手へ再転向',main:true,s:'年俸係数 ×1.12',
         f:()=>{S.dpos='C';card('good','守備位置の変更','マスクを再びかぶる――新シーズンから<b class="hl">捕手</b>として再登録。');cont();}},
        {t:'現状維持',f:()=>cont()}]); return; }
    if(S.dpos==='1B'&&!dpQual('1B')){ S.dpos='DH';
      card('info','守備位置の変更','一塁すら守れなくなり、新シーズンは<b class="hl">指名打者</b>として登録。'); }
    cont(); return; }
  if(S.pos==='P'){ /* スタミナで投手起用を決める。セーブから先発への転向はプレイヤー同意制、先発からセーブは自動。 */
    const nr=pitcherRole(), old=S.role;
    if((old==='MR'||old==='CL')&&nr==='SP'){
      /* セーブ投手が先発基準のスタミナへ到達した場合、球団が転向を打診するが強制しない。 */
      choose('球団から打診：スタミナは先発水準に達した。先発へ転向する？',[
        {t:'先発へ転向し、ローテを担う',main:true,f:()=>{ S.role='SP';
          card('info','起用法の変更',`先発転向を受諾。新シーズンからローテーションの一角を担う――<b class="hl">先発</b>。`); cont(); }},
        {t:'ブルペンに残り、自分の役割を守る',s:'現状維持'+roleN(old)+'起用法',f:()=>{ S.role=old;
          card('info','ブルペンに残る',`首脳陣の提案を断った――いつでも待機し、チームが最も必要とするときに火消しで登板する。`); cont(); }}]);
      return;
    }
    S.role=nr;
    if(old&&old!==nr){
      card('info','起用法の変更',`シーズン終了後にチームが体調を評価し、新シーズンでの役割を調整することになる。<b class="hl">${roleN(nr)}</b>。`); }
    else if(!old){
      card('info','投手の起用法',`首脳陣がスタミナを評価し、<b class="hl">${roleN(nr)}</b>として登録した。`); }
    cont(); return;
  }
  const q=dpList();
  if(!S.dpos){ S.dpos=q[0];
    card('info','守備位置登録',`首脳陣が守備能力を評価し、<b class="hl">${DPN[S.dpos]}</b>として登録した。`); cont(); return; }
  if(dpQual(S.dpos)){
    const best=q[0];
    if(DP_RANK[best]<DP_RANK[S.dpos]){ /* より市試合価値の高い守備位置を守れるようになった。 */
      choose(`守備位置会議：首脳陣は、より負担の大きいポジションを任せたいようだ`,[
        {t:`${DPN[best]}へコンバート`,main:true,s:`年俸係数×${(DP_MULT[best]||1).toFixed(2)}`,
         f:()=>{S.dpos=best;card('good','守備位置の変更',`誰もが納得した守備データ - 新シーズンは守備を変えた<b class="hl">${DPN[best]}</b>。`);cont();}},
        {t:`${DPN[S.dpos]}に残る`,f:()=>cont()}]); return; }
    cont(); return; }
  const opts=q.slice(0,2).map((p,i)=>({t:`${DPN[p]}へコンバート`,main:i===0,
    s:p==='DH'?'守備陣の居場所がない｜年俸係数×0.92':`年俸係数×${(DP_MULT[p]||1).toFixed(2)}`,
    f:()=>{ S.dpos=p; card('info','守備位置の変更',`球団のシーズン終了後評価により、新シーズンから<b class="hl">${DPN[p]}</b>へコンバート。`); cont(); }}));
  choose(`守備位置会議：首脳陣は、${DPN[S.dpos]}を守るのはもう厳しいと判断（${LV[S.lv].n}基準）`,opts);
}
const TEAM_COLOR={
  /* CPBL。 */
  '台中マンモス':'#ffd800','府城ライオンズ':'#ff7f00','桃園コングス':'#8b1a1a','新北ナイツ':'#003f87','台北ダイナソーズ':'#c8102e','高雄イーグルス':'#1a7a3a',
  /* NPB。 */
  '東京グランズ':'#f97709','阪神ストライプス':'#ffe201','横浜ブルースターズ':'#0a3ce0','広島レッドフィッシュ':'#e60012','神宮スカイバーズ':'#0a7bc2','名古屋ドラグーンズ':'#003a70','福岡シーホークス':'#f5c400','北海道ノースファイターズ':'#0a2d5c','千葉オーシャンズ':'#111111','仙台ゴールデンオウルズ':'#8b0000','大阪ブルホーンズ':'#0033a0','埼玉レオンズ':'#1268b3',
  /* MLB。 */
  'ロサンゼルス・ブルー':'#005A9C',   'サンディエゴ・フライアーズ':'#2F241D', 
  'ベイエリア・ジャイアンツ':'#FD5A1E',
  'ニューヨーク・エンパイア':'#0C2340', 
  'ボストン・レッドソックス':'#BD3039',
  'ニューヨーク・ビッグアップル':'#FF5910',
  'フィラデルフィア・アイアンズ':'#E81828',
  'アトランタ・トマホークス':'#13274F',
  'シカゴ・カブス':'#0E3386',
  'セントルイス・カージナルス':'#C41E3A',
  'ヒューストン・ロケッツ':'#EB6E1F',
  'テキサス・レンジャーズ':'#003278',
  'シアトル・マリナーズ':'#005C5C', 
  'ロサンゼルス・エンジェルズ':'#BA0021',
  'トロント・ブルージェイズ':'#134A8E',
  'ボルチモア・オリオールズ':'#DF4601',
  'タンパベイ・レイズ':'#092C5C', 
  'クリーブランド・ガーディアンズ':'#E31937',
  'デトロイト・タイガース':'#0C2340',
  'ミネソタ・ツインズ':'#002B5C',
  'シカゴ・ホワイトソックス':'#27251F',
  'カンザスシティ・ロイヤルズ':'#174885',
  'オークランド・アスレチックス':'#003831',
  'ミルウォーキー・ブルワーズ':'#FFC52F',
  'ピッツバーグ・パイレーツ':'#FDB827',
  'マイアミ・マーリンズ':'#00A3E0',
  'ワシントン・ナショナルズ':'#AB0003',
  'アリゾナ・ダイヤモンドバックス':'#A71930',
  'コロラド・ロッキーズ':'#33006F',
  'シンシナティ・レッズ':'#C6011F'
};
const CPBL_TEAMS=['台中マンモス','府城ライオンズ','桃園コングス','新北ナイツ','台北ダイナソーズ','高雄イーグルス'];
const NPB_TEAMS=['東京グランズ','阪神ストライプス','横浜ブルースターズ','広島レッドフィッシュ','神宮スカイバーズ','名古屋ドラグーンズ','福岡シーホークス','北海道ノースファイターズ','千葉オーシャンズ','仙台ゴールデンオウルズ','大阪ブルホーンズ','埼玉レオンズ'];
const MLB_TEAMS=['ロサンゼルス・ブルー','サンディエゴ・フライアーズ','ベイエリア・ジャイアンツ','ニューヨーク・エンパイア','ボストン・レッドソックス','ニューヨーク・ビッグアップル','フィラデルフィア・アイアンズ','アトランタ・トマホークス','シカゴ・カブス','セントルイス・カージナルス','ヒューストン・ロケッツ','テキサス・レンジャーズ','シアトル・マリナーズ','ロサンゼルス・エンジェルズ','トロント・ブルージェイズ','ボルチモア・オリオールズ','タンパベイ・レイズ','クリーブランド・ガーディアンズ','デトロイト・タイガース','ミネソタ・ツインズ','シカゴ・ホワイトソックス','カンザスシティ・ロイヤルズ','オークランド・アスレチックス','ミルウォーキー・ブルワーズ','ピッツバーグ・パイレーツ','マイアミ・マーリンズ','ワシントン・ナショナルズ','アリゾナ・ダイヤモンドバックス','コロラド・ロッキーズ','シンシナティ・レッズ'];
/* par=当該階級の平均水準、 min=最低基準(下回る→降格/戦力外)、 g=シーズン試合数。 */
const LV={
 CPBL2:{n:'台湾プロ野球二軍',par:34,min:30,g:80, org:'CPBL'},
 CPBL1:{n:'台湾プロ野球一軍',par:44,min:41,g:120,org:'CPBL',top:'CPBL'},
 NPB2:{n:'NPB二軍',par:47,min:44,g:100,org:'NPB'},
 NPB1:{n:'NPB一軍',par:53,min:50,g:143,org:'NPB',top:'NPB'},
 R:{n:'ルーキーリーグ',par:41,min:39,g:55, org:'MiLB'},
 A1:{n:'1A',par:45,min:43,g:110,org:'MiLB'},
 A2:{n:'2A',par:49,min:47,g:120,org:'MiLB'},
 A3:{n:'3A',par:54,min:52,g:130,org:'MiLB'},
 MLB:{n:'メジャーリーグ',par:59,min:56,g:162,org:'MiLB',top:'MLB'},
};
const PATHS={CPBL:['CPBL2','CPBL1'],NPB:['NPB2','NPB1'],MiLB:['R','A1','A2','A3','MLB']};
const HS_CUPS=['木製バットリーグ','黒豹旗','玉山杯'];
const U_CUPS=['大学春季リーグ','大学カップ'];
/* イベントカード：全部中性、成功確率 50%（天才 70%）。 */
const EVENTS=[
 {n:'バッティングマシン特訓',for:'B',gt:'打撃絶好調、芯で捉えまくった',bt:'打つほど迷走、フォームを崩した',g:{con:2},b:{con:-2}},
 {n:'ウエートトレーニング強化期間',for:'A',gt:'スクワットで自己ベスト更新。全身に力がみなぎる',bt:'焦りすぎて筋肉が張り、数週間引きずった',g:{pow:2,sta:1},b:{sta:-2}},
 {n:'ブルペンで追加練習',for:'P',gt:'新しい握りを発見。球の伸びが明らかに増した',bt:'投げるほど制球が乱れ、フォームまで崩れた',g:{brk:2},b:{ctl:-2}},
 {n:'遠投トレーニング',for:'A',gt:'レーザービーム育成中',bt:'肩に張りが出て、コーチがストップ',g:{arm:2},b:{arm:-2}},
 {n:'映像分析講座',for:'*',gt:'投打の癖を見抜き、判断力が大幅アップ',bt:'情報を詰め込みすぎて、試合では考えすぎた',g:{eye:2,cat:2,ctl:1},b:{eye:-2,ctl:-1}},
 {n:'走塁特訓',for:'A',gt:'スタート判断が爆速で上達',bt:'ハムストリングを痛めて2週間離脱した',g:{spd:2},b:{spd:-1,inj:5}},
 {n:'守備千本ノック',for:'A',gt:'グラブが掃除機みたいに吸い込む',bt:'イレギュラーを食らいまくって自信喪失',g:{rng:1,fld:2},b:{fld:-2}},
 {n:'死球の恐怖',for:'*',gt:'身をひねって回避。反応が速すぎる',bt:'速球をまともに食らった',g:{spd:1},b:{inj:12}},
 {n:'メディア取材',for:'*',gt:'受け答えが好評で人気アップ。野球へのやる気も増した',bt:'失言が記事になり、プレッシャーで調子を崩した',g:{sta:1},b:{con:-1,ctl:-1,sta:-1}},
 {n:'首脳陣が注目',for:'*',gt:'マンツーマン指導の機会を得た',bt:'弱点を目につけられ、フォーム修正を延々求められた',g:{rand:2},b:{rand:-2}},
 {n:'食事・睡眠改善プラン',for:'*',gt:'体脂肪が落ち、回復も速くなった',bt:'環境が合わず、胃腸炎で1週間苦しんだ',g:{sta:2},b:{sta:-1,inj:4}},
 {n:'先輩／ベテランの助言',for:'*',gt:'ひと言で目からウロコ',bt:'自分に合わない技術をまねて遠回りした',g:{rand:2},b:{rand:-2}},
 {n:'球速測定日',for:'P',gt:'スピードガンに自己最速が出た',bt:'出力を上げすぎて肘に炎症',g:{vel:2},b:{inj:10}},
 {n:'配球研究会',for:'P',gt:'投球コースのイメージが広がった',bt:'考えすぎて窮屈な投球になった',g:{ctl:2},b:{brk:-2}},
 {n:'夜食の誘惑',for:'*',gt:'誘惑に勝ち、体形をキープ',bt:'体重が右肩上がり。初動が遅くなった',g:{sta:1},b:{spd:-2,sta:-1,rng:-1}},
 {n:'スポンサー契約のオファー',for:'PRO',gt:'仕事をうまく調整し、副収入を得ながら練習も継続',bt:'予定を詰めすぎて練習量が激減',g:{sta:1},b:{rand:-2,sta:-1}},
 {n:'シーズン中盤のスランプ',for:'*',gt:'気持ちを切り替えてスランプ脱出。ひと回り強くなった',bt:'スランプが1か月続いた',g:{eye:1,ctl:1,sta:1},b:{con:-2,brk:-1,sta:-1}},
];
/* ゲーム状態。 */
let S=null, stepQ=[];
function newState(name,pos,role){
  const ab={}; POS_AB[pos].forEach(k=>ab[k]=ri(20,32));
  if(pos==='P'){ab.vel+=ri(0,6);ab.brk+=ri(0,4);} else {ab.con+=ri(0,6);ab.pow+=ri(0,4);}
  /* OOTP風の能力上限。シャッフル後は一つを一級品、一つを優秀、一つを平均以上、残りを平凡にする。 */
  const pot={}, sh=POS_AB[pos].slice();
  for(let i=sh.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=sh[i];sh[i]=sh[j];sh[j]=t;}
  if(pos==='P'){
    /* 投手は4能力だけなので上限を集中させる。武器を一つ作り、残りを抑えて高能力の量産を防ぐ。 */
    sh.forEach((k,i)=>{ pot[k]= i===0?ri(70,80) : i===1?ri(58,68) : i===2?ri(50,60) : ri(44,54); });
  } else {
    sh.forEach((k,i)=>{ pot[k]= i===0?ri(72,80) : i===1?ri(64,74) : i===2?ri(56,68) : ri(46,62); });
  }
  /* 高校の固定内部ランク：T1 名門 +6 / T2 中堅 ±0 / T3 弱旅 -6。 */
  const hsMap={'平鎮高校':1,'穀保家商':1,'高苑工商':2,'北科附工':2,'普門高校':3,'東大体中':3};
  const schools=Object.keys(hsMap);
  const myTeam=schools[Math.floor(R()*schools.length)];
  return {name,pos,role:pos==='P'?null:null,age:16,year:2026,stage:'HS',stageYr:1,pot,
    hsMap,hsTier:hsMap[myTeam],team:myTeam,potSum0:Object.values(pot).reduce((a,b)=>a+b,0),
    league:null,org:null,orgTeam:null,teamTally:{CPBL:{},NPB:{},MLB:{}},
    ab,traits:{genius:false,glass:false,iron:false,scum:false,
      late:false,disc:false,academy:false,intlace:false,franchise:false,clutch:false,phoenix:false,combo:false,onetool:false,rubber:false,legend:false,
      yips:false,distract:false,cancer:false,ambience:false,goldcloth:false,thief:false,mrteam:false,confidante:false,smallschool:false,grinder:false,rainbow:false,taiwan:false},
    removed:[], /* 被覆上書き/解除的特性、結算畫刪除線。 */
    cntSave:0,cntSaveWin:0,cntSnack:0,cntBoldWin:0,cntBoldFail:0,samePick:0,samePickKey:null,teamYears:0,
    six:0,bigInj:0,ironStreak:0,npbYears:0,
    injNext:0,tmpInj:0,rehab:0,salary:0,pool:0,seasonFactor:1,
    stats:{CPBL:null,NPB:null,MLB:null,MINOR:null},honors:[],intlCount:0,intlLock:null,intlStat:{G:0,PA:0,AB:0,H:0,HR:0,RBI:0,IP:0,SO:0,ER:0,W:0,SV:0},intlBest:null,dpos:null,dposYears:{},roleYears:{},tradeRefuse:0,champThisTeam:false,svc:0,svcOrg:null,faElig:false,tradeHeat:0,complainCount:0,demotionRefused:false,tj:0,tjCount:0,effort:'ノーマル',tjSuccess:0,love:{st:'single',partner:null,kids:0,caught:0,affairs:0,exes:[],dyrs:0,datedTimes:0},traits2:{},log:[],ct:null,done:false};
}
function blankStat(){return {yr:0,G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,AS:0,DEF:0};}
function bucketOf(lv){ const l=lv&&LV[lv]; return l&&l.top?l.top:'MINOR'; } /* アマチュア引退時はlvが空なのでMINORへ分類。 */
function traitCard(key,name,desc,tone){ S.traits[key]=true;
  card(tone||'gold','隠し特性解放：'+name,desc); board(0); }
function removeTrait(key,label){ if(S.traits[key]){ S.traits[key]=false;
    if(!S.removed.includes(label))S.removed.push(label); } }
/* 一芸特化：評価対象は三つの役割軸のみ——打撃(長打力/Contact)、走塁(速度)、守備(総合)。 */
function careerAllStars(){ let n=0; ['CPBL','KBO','NPB','MLB'].forEach(b=>{ if(S.stats[b])n+=(S.stats[b].AS||0); }); return n; }
function toolGap(){ const a=S.ab;
  const hit=Math.max(a.pow,a.con);        /* 打撃維度：長打力または Contact 取高。 */
  const run=a.spd;                         /* 走塁維度。 */
  const def=S.pos==='C'?(a.rng+a.fld+a.arm+a.cat)/4:(a.rng+a.fld+a.arm)/3; /* 守備総合。 */
  const dims=[['hit',hit,'代打'],['run',run,'代走'],['def',def,'守備固め']];
  dims.sort((x,y)=>y[1]-x[1]);
  const topDim=dims[0], secDim=dims[1];
  const gap=topDim[1]-secDim[1];
  /* 比より対象の役割：代打確認長打力/Contact 高い方を説明文に採用。 */
  const role=topDim[2];
  return {gap, role, val:topDim[1], dim:topDim[0]}; }
function tjAccrue(){ /* 毎季TJゲージを蓄積する。球速と変化球が高いほど負担が増え、投球強度で倍率を決める。 */
  if(S.pos!=='P'||S.seasonFactor<=0)return;
  const mult={'全力投球':1.25,'通常投球':1.0,'省エネ投球':0.65}[S.effort]||1.0;
  const base=(S.ab.vel+S.ab.brk)/19*mult*(S.tjCount>=1?1.15:1); /* 手術歴がある場合はTJゲージの蓄積を速める。 */
  S.tj+=base;
}
function tjCap(){ return S.traits.rubber?100:50; }
function tjGamble(cont){ /* TJゲージ上限到達時は先に能力を5下げ、その後に手術結果を判定。 */
  if(S.pos!=='P'||S.tj<tjCap()){ cont(); return; }
  addAb('vel',-5); addAb('brk',-5); board(1);
  card('bad','肘に危険信号',`蓄積疲労で靱帯が悲鳴を上げた――球速・変化球がそれぞれ <b class="dn">−5</b>。医療チームから二つの選択肢を提示された。`);
  const succP=S.traits.rubber?85:55;
  choose('TJの決断：肘はもう限界だ',[
    {t:'トミー・ジョン手術を受ける',main:true,s:'今季全休。復帰後は球速・変化球が回復（各 +3～+10）',f:()=>{
      S.tj=0; S.tjCount++; S.rehab=1;
      const gv=ri(3,10),gb=ri(3,10); addAb('vel',gv); addAb('brk',gb);
      if(S.tjCount>=2){ tjTwoStrike(); }
      board(1);
      card('gold','手術成功',`手術は成功。長いリハビリを経て球威がよみがえった――球速 <b class="up">+${gv}</b>、変化球 <b class="up">+${gb}</b>。（今季全休）`);
      afterGamble('surgery',cont); }},
    {t:'注射で今季を乗り切る',warn:true,s:`成功率 ${succP}%｜失敗＝TJ級の大けが（翌年全休・能力も再低下）`,f:()=>{
      if(chance(succP)){ S.tj=Math.max(0,S.tj-20); addAb('vel',5); addAb('brk',5); board(1);
        card('good','首の皮一枚で回避',`ブロック注射で持ちこたえ、歯を食いしばってシーズンを完走――TJゲージ <b class="hl">−20</b>、球速・変化球が各 <b class="up">+5</b>。ただし、これは選手生命の前借りだ。`);
        afterGamble('inject',cont); }
      else { tjBigInjury(cont); } }}]);
}
function tjTwoStrike(){ /* TJ手術2回で球速と変化球を半減。 */
  S.ab.vel=clamp(Math.round(S.ab.vel/2),1,80);
  S.ab.brk=clamp(Math.round(S.ab.brk/2),1,80);
  card('bad','二度の手術の代償','二度目の手術――靱帯はもう元どおりではない。球速・変化球が<b class="dn">半減</b>。');
}
function tjBigInjury(cont){
  S.tjCount++; S.rehab=1; S.tj=0;
  /* 5%で肩を壊して再起不能。 */
  if(chance(5)){ S.ab.vel=10; S.ab.brk=10; S.pot.vel=20; S.pot.brk=20;
    card('bad','最悪の結末',`注射した瞬間、肩に経験したことのない激痛が走った。医師の表情がすべてを物語る――<b class="dn">肩は致命傷。球速・変化球は10まで低下し、潜在能力上限も20に</b>。投手人生は、たぶんここまでだ。`);
    board(1); afterGamble('fail',cont); return; }

  /* 靱帯断裂の能力低下（−5）と手術成功後の回復（+3～+10）。 */
  const gv=ri(3,10), gb=ri(3,10);
  const netV = gv - 5;
  const netB = gb - 5;
  /* 絶対値を直接更新して加算バグを防ぎ、1～80へ制限。 */
  S.ab.vel = clamp(S.ab.vel + netV, 1, 80);
  S.ab.brk = clamp(S.ab.brk + netB, 1, 80);

  if(S.tjCount>=2)tjTwoStrike();
  board(1);

  const vStr = netV > 0 ? `<b class="up">+${netV}</b>` : netV < 0 ? `<b class="dn">${netV}</b>` : `<b>0</b>`;
  const bStr = netB > 0 ? `<b class="up">+${netB}</b>` : netB < 0 ? `<b class="dn">${netB}</b>` : `<b>0</b>`;
  card('bad','TJ級の大けが',`無理を続けた代償が来た――靱帯がその場で断裂。翌年は<b class="dn">シーズン全休</b>。長い手術とリハビリ（断裂 −5＋手術による回復）の末、球速は ${vStr}、変化球は ${bStr}。完全復活に見えても、実際はどうにか差し引きゼロだ。`);
  afterGamble('fail',cont);
}
function afterGamble(kind,cont){
  if(kind==='inject'){ S.tjSuccess++;
    if(S.tjSuccess>=2&&!S.traits.rubber){ S.traits.rubber=true;
      card('gold','隠し特性解放：ラバーアーム','二度の肘危機を注射だけで乗り切り、一度も手術を受けなかった――靱帯はゴムのようにしなやかだ。<b class="hl">TJゲージ上限と注射成功率が2倍</b>。'); board(1); } }
  else if(kind==='surgery'){ S.tjSuccess=0; /* 手術時に連続記録をリセット。 */
    if(S.traits.rubber){ removeTrait('rubber','ラバーアーム');
      card('bad','ラバーアーム、ついに限界','ついに手術室へ――ラバーアームと呼ばれた腕にも限界はあった。<b class="dn">ラバーアーム失効</b>。'); board(1); } }
  else { S.tjSuccess=0; } /* 重傷失敗時に連続記録をリセット。 */
  cont();
}
function pitcherRole(){ /* スタミナ >=52 先発;それ以外はブルペン、ブルペン内では成績ならクローザーへ昇格。 */
  if(S.ab.sta>=52)return 'SP';
  /* ブルペン：前季のdはprevDから参照する。lastDはphasePreで初期化済み;トップ級なら クローザー。 */
  const pd=(S.prevD!==undefined?S.prevD:(S.lastD||0));
  const d=(S.role&&S.role!=='SP')?pd:-99;
  if(S.role==='CL')return d>=1?'CL':'MR';   /* クローザー成績急落時のみセットアッパー。 */
  return d>=3?'CL':'MR';                     /* セットアッパーがトップ階級の成績ならクローザーへ昇格。 */
}
function fmtIP(ip){ /* 十進出位局数轉棒球表示：小数部分 →三分之幾(出局数)。 */
  if(ip==null)return '0.0';
  const whole=Math.floor(ip); const frac=ip-whole;
  const outs=Math.round(frac*3); /* 0/1/2/3 */
  if(outs>=3)return (whole+1)+'.0';
  return whole+'.'+outs;
}
function roleN(r){ return {SP:'先発',MR:'中継ぎ',CL:'抑え'}[r]||'—'; }
function isSP(){ return S.role==='SP'; } /* 先発引擎判定。 */
function ovr(){
  const a=S.ab;
  if(S.pos==='P'){ const arr=[a.vel,a.ctl,a.brk].sort((x,y)=>y-x);
    return Math.round(arr[0]*0.42+arr[1]*0.30+arr[2]*0.18+a.sta*0.10); }
  const off=[a.con,a.pow,a.eye,a.spd].sort((x,y)=>y-x);
  const offv=off[0]*0.38+off[1]*0.27+off[2]*0.20+off[3]*0.15;
  /* 守備評価：現在の守備位置のdpScore(と守備位置基準システムと一致);DH 守備価値なし → 「1B 守備評価 −12」として計算(これにより同じ打撃力なら一塁手がDHを常に上回る)。守備位置が未設定なら守れる中で最上位の守備位置の評価を使う。 */
  const dpForOvr = S.dpos || (S.pos==='C'?'C':(S.pos==='OF'?'CF':'SS'));
  const def = S.dpos==='DH' ? (dpScore('1B')-12) : dpScore(dpForOvr);
  /* 守備重み：重要守備位置(SS/CF/C)最大 30%、コーナーは低め;DH 用と 1B 同じ重み(守備評価に含まれる DH ペナルティ)。 */
  const dw=S.dpos?({SS:0.30,CF:0.30,C:0.30,'2B':0.22,'3B':0.22,RF:0.20,'1B':0.12,LF:0.14,DH:0.12})[S.dpos]??0.22:0.24;
  let v=Math.round(offv*(1-dw)+def*dw);
  if(S.traits.yips)v-=3; /* イップス：心理的影響、システム評価 -3。 */
  return v;
}
function playerType(){
  const a=S.ab;
  if(S.traits.onetool&&S.toolRole)return S.toolRole+'ユーティリティー';
  if(S.pos==='P'){
    const m=Math.max(a.vel,a.ctl,a.brk);
    if(m<52)return '期待の若手';
    if(a.sta>=m&&a.sta>=62)return '鉄腕';
    if(m===a.vel)return '剛腕'; if(m===a.brk)return '変化球の魔術師'; return '精密機械';
  }
  if(S.pos==='C'){ const rest=Math.max(a.con,a.pow,a.spd,a.eye,a.rng,a.fld,a.arm);
    if(a.cat>=58&&rest<=a.cat-8)return 'リードの達人'; }
  const dv=S.pos==='C'?(a.rng+a.fld+a.cat)/3:(a.rng+a.fld+a.arm)/3;
  const cand=[['大砲タイプ',a.pow],['安打製造機',a.con],['選球眼の鬼',a.eye],['韋駄天',a.spd],['守備職人',dv]];
  cand.sort((x,y)=>y[1]-x[1]);
  if(cand[0][1]<52)return '期待の若手';
  if(cand[0][1]-cand[1][1]<=3&&cand[0][1]>=60)return 'オールラウンダー';
  return cand[0][0];
}
function abCost(k){ /* 次の能力段階に必要なポイント(は addAb コスト式と一致させる)。 */
  const cur=S.ab[k], pk=(S.pot&&S.pot[k])||62, isP=S.pos==='P';
  let c=isP?(cur>=66?7:cur>=60?4:cur>=55?2:1):(cur>=72?3:cur>=64?2:1);
  if(cur>=pk)c*=isP?4:3; return c;
}
function addAb(k,v){ if(!(k in S.ab))return 0; const o=S.ab[k];
  S.lastOverflow=0; /* 【修正】紀錄真正溢出的ポイント。 */
  if(v<0){ S.ab[k]=clamp(o+v,1,80); return S.ab[k]-o; } /* 扣値 1：1、不吃ゲージ成本。 */
  if(!S.carry)S.carry={};
  let cur=o,bud=v+(S.carry[k]||0); /* 次の段階に未到達的ポイント進出捗ゲージへ蓄積、消滅させない。 */
  const pk=(S&&S.pot&&S.pot[k])||62;
  const isP=S&&S.pos==='P';
  while(bud>0&&cur<80){
    let cost=isP?(cur>=66?7:cur>=60?4:cur>=55?2:1)      /* 投手のみ有4項、養成成本最陡。 */
              :(cur>=72?3:cur>=64?2:1);                    /* 野手9項、中高段変化貴。 */
    if(cur>=pk)cost*=isP?4:3; /* 天花板之上：投手×4、野手×3。 */
    if(bud>=cost){bud-=cost;cur++;} else break; }
  if(cur>=80) S.lastOverflow=bud; /* 80到達後、残りのポイントが実際の超済み分。 */
  S.carry[k]=cur>=80?0:bud;
  S.ab[k]=cur; return cur-o; }
function injuryProb(){ /* 基礎リスク24から15へ下げ、済み剰な故障発生を抑える。 */
  let p=15+S.injNext;
  if(S.age>=35)p+=12; else if(S.age>=32)p+=6;
  if(S.traits.academy&&S.age<25)p-=5; /* 理論派：25歳まで科学的に自己管理。 */
  if(S.traits.iron&&S.traits.glass)p=25;
  else if(S.traits.iron)p=Math.min(p,10); /* 鐵人：基礎リスク上限 10%。 */
  else if(S.traits.glass)p=Math.max(p,40);
  /* イベントカード等自検索的額外リスク(tmpInj)疊加在基礎之上、不受鐵人上限保護。 */
  p+=(S.tmpInj||0);
  return clamp(p,3,95);
}
/* 成績シミュレーション。 */
function simSeason(lv){
  if(S.pos==='P'&&!S.role)S.role=pitcherRole();
  const L=LV[lv], par=L.par, a=S.ab, f=S.seasonFactor;
  const st={G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,IP:0,SO:0,ER:0,avg:0,era:0,d:0};
  if(f<=0) return st;
  if(S.pos==='P'){
    const q=(a.vel+a.ctl+a.brk)/3, d=q-par; st.d=d;
    /* 投球内容が良ければ規定の投球回を与え、悪ければ野手と同様に登板機会を減らす。 */
    const perfF=clamp(0.80+d*0.028,0.42,1.12);
    if(isSP()){
      const gs=Math.round(clamp(20+(a.sta-40)*0.18,10,30)*f*perfF*(0.94+R()*0.08));
      st.G=Math.max(1,gs);
      /* 先発1試合当たり投球回は平均約5.0、好投手5.2～6.0、イニングイーター6.1～6.5。総合評価dで決め、制球難なら少し減らす。 */
      const ipg=clamp(5.0+d*0.05+(a.sta-50)*0.012+(a.ctl-par)*0.006+N0(0.12),4.8,6.5);
      st.IP=+(st.G*ipg).toFixed(1);
    }else{
      st.G=Math.max(1,Math.round(clamp(45+(Math.min(a.sta,60)-40)*0.3,25,68)*f*perfF*(0.94+R()*0.08))); /* 高スタミナ後援：登板数への寄与sta60を上限、先発並みの投球量にはしない。 */
      st.IP=+(st.G*1.05).toFixed(1);
    }
    st.era=clamp(4.32-d*0.17+N0(0.35),1.40,9.90);
    st.ER=Math.round(st.era*st.IP/9);
    const k9=clamp(6.2+(a.vel-par)*0.11+(a.brk-par)*0.06+N0(0.5),3.5,13.5);
    st.SO=Math.round(st.IP/9*k9);
    /* 四球率は制球、被安打は総合評価dで決め、WHIPは（H+BB）÷IPで算出。 */
    const bb9=clamp(4.6-(a.ctl-par)*0.13+N0(0.4),1.2,7.5);
    st.BB=Math.round(st.IP/9*bb9);
    const h9=clamp(9.2-d*0.16+N0(0.5),5.0,13.5);
    st.H=Math.round(st.IP/9*h9);
    st.WHIP=st.IP>0?+((st.H+st.BB)/st.IP).toFixed(2):0;
    if(isSP()){
      const dec=Math.round(st.G*0.72), wp=clamp(0.50+d*0.014+N0(0.05),0.15,0.85);
      st.W=Math.round(dec*wp); st.L=dec-st.W;
    }else if(S.role==='CL'){
      /* クローザーのセーブ数は登板数を基準にし、総合評価dで成功率を変える。SVはG以下、1試合最大1セーブ。 */
      const svRate=clamp(0.55+d*0.02,0.35,0.82);            /* セーブ轉化率：35%~82%。 */
      st.SV=Math.min(st.G, Math.round(st.G*svRate));         /* 登板数を超えない。 */
      st.HLD=Math.min(Math.max(0,st.G-st.SV), Math.round(st.G*0.12)); /* 非セーブ登板的セットアッパー。 */
      const dec=Math.max(1,Math.round(st.G*0.14)); st.W=Math.round(dec*clamp(0.45+d*0.02,0.3,0.7)); st.L=Math.max(0,dec-st.W);
    }else{ /* セットアッパーのホールド数は登板数を基準に算出。 */
      const hldRate=clamp(0.45+d*0.02,0.25,0.72);
      st.HLD=Math.min(st.G, Math.round(st.G*hldRate));       /* 登板数を超えない。 */
      st.SV=Math.min(Math.max(0,st.G-st.HLD), chance(25)?ri(1,5):0);
      const dec=Math.max(1,Math.round(st.G*0.14)); st.W=Math.round(dec*clamp(0.5+d*0.015,0.35,0.7)); st.L=Math.max(0,dec-st.W);
    }
    /* 1試合につき投手結果は一つ。セーブ率は85%以下、勝敗・セーブ・ホールドの合計は登板数以下に制限。 */
    if(!isSP()){
      st.SV=Math.min(st.SV||0, Math.floor(st.G*0.85));
      st.HLD=Math.min(st.HLD||0, Math.max(0,st.G-st.SV));
      const decCap=Math.max(0,st.G-st.SV-st.HLD);
      if((st.W+st.L)>decCap){ st.W=Math.min(st.W,decCap); st.L=Math.max(0,decCap-st.W); }
    }
  }else{
    const q=a.con*0.5+a.pow*0.2+a.eye*0.18+a.spd*0.12, d=q-par-0.5; st.d=d; /* powを追加(長打力を総合力へ反映);-0.5 補正、全体分布と旧版に合わせる。 */
    /* 出試合機会：スタミナで上限を設定、成績(d)で実際の出試合量を決める。 */
    /* スタミナ係数は50以上でほぼフル出試合、45～50は標準、40は少なめ、35は代打程度。 */
    let staF;
    if(a.sta>=55)staF=1.0; else if(a.sta>=50)staF=0.90+(a.sta-50)*0.02;
    else if(a.sta>=45)staF=0.72+(a.sta-45)*0.036; else if(a.sta>=40)staF=0.52+(a.sta-40)*0.04;
    else if(a.sta>=35)staF=0.35+(a.sta-35)*0.034; else staF=Math.max(0.15,0.35-(35-a.sta)*0.03);
    /* B. スター級打者(d>=10)だが守備を続けるスタミナがない(staF<0.75) → 当該シーズンはDHへ転向、打撃に専念、staF 下限を0.9へ引き上げる。 */
    let dhThisYear=false;
    if(d>=10 && staF<0.75 && S.dpos!=='DH' && S.dpos!=='C'){
      staF=Math.max(staF,0.9); dhThisYear=true;
    }
    /* 好成績なら十分な打席を与え、総合評価dが0未満なら出試合機会をさらに減らす。 */
    const perfF=clamp(0.82+d*0.03,0.45,1.12);
    st.G=Math.min(L.g, Math.round(L.g*clamp(staF*perfF,0.10,1.0)*f*(0.95+R()*0.06))); /* 上限=リーグ試合数、できない超える。 */
    st.PA=Math.round(st.G*4.25);
    st._dh=dhThisYear; /* accStatでDH出試合年を記録するために使用。 */
    st.BB=Math.round(st.PA*clamp(0.062+(a.eye-par)*0.0034,0.045,0.17));
    st.AB=st.PA-st.BB;
    st.avg=clamp(0.252+d*0.0058+(a.sta-50)*0.0003+(a.spd-par)*0.0006+N0(0.014),0.140,0.380);
    st.H=Math.round(st.AB*st.avg); st.avg=st.AB?st.H/st.AB:0;
    st.HR=Math.round(st.AB*clamp(0.010+(a.pow-par)*0.0022,0.001,0.075)*(0.85+R()*0.3));
    st.SB=Math.round(clamp((a.spd-45)*0.5+(a.spd-par)*1.3+N0(4),0,70)*f);
    st.RBI=Math.round(st.HR*2.1+(st.H-st.HR)*0.30);
    st.DEF=defRuns(lv);
  }
  st.baseD=st.d; /* 市場評価では好不調補正前の総合評価を基礎値として保持する。 */
  applySeasonForm(st,lv);   /* 不調整年/キャリア年：調整整率成績と積み上げ成績(出場数は変えない)。 */
  st.formAdjustment=st.form===1?4:st.form===-1?-4:0;
  return st;
}
/* シーズン状態は10%で不調整（成績×0.65）、10%でキャリアハイ（健康時のみ成績×1.2）。倍率は内容と率だけに適用し、出場数は変えない。 */
function applySeasonForm(st,lv){
  if(S.seasonFactor<=0)return;                 /* 全休時は発動作しない。 */
  st.form=0;                                    /* 0=正常 1=キャリア年 -1=低潮。 */
  const roll=R();
  const canCareer=S.seasonFactor>=0.9;          /* キャリアハイ判定にはシーズンを健康に済みごす必要がある。 */
  let m=1;
  if(roll<0.10){ st.form=-1; m=0.65; }          /* 不調整時は成績を65%へ補正。 */
  else if(canCareer && roll<0.20){ st.form=1; m=1.20; } /* キャリアハイ時は成績を1.2倍。 */
  if(m===1)return;
  if(S.pos==='P'){
    /* 投手：三振/勝利数は倍率に従う;被安打と自責分逆方向へ補正(キャリア年減少、低潮増加);SV/HLD に応じて倍率ただし超えない出場数。 */
    st.SO=Math.round(st.SO*m);
    st.W=Math.round(st.W*m); if(st.L!=null)st.L=Math.max(0,Math.round(st.L/(m||1)));
    st.H=Math.max(0,Math.round(st.H/m)); st.ER=Math.max(0,Math.round(st.ER/m));
    st.era=st.IP>0?+(st.ER*9/st.IP).toFixed(2):st.era;
    st.WHIP=st.IP>0?+((st.H+st.BB)/st.IP).toFixed(2):st.WHIP;
    if(st.SV)st.SV=Math.min(st.G,Math.round(st.SV*m));
    if(st.HLD)st.HLD=Math.min(Math.max(0,st.G-(st.SV||0)),Math.round(st.HLD*m));
    /* 物理約束(倍率後再度制限)：セーブ割合<=85%、勝+敗+セーブ+セットアッパー <= 出場数。 */
    if(!isSP()){
      st.SV=Math.min(st.SV||0, Math.floor(st.G*0.85));
      st.HLD=Math.min(st.HLD||0, Math.max(0,st.G-st.SV));
      const decCap=Math.max(0,st.G-st.SV-st.HLD);
      if((st.W+st.L)>decCap){ st.W=Math.min(st.W,decCap); st.L=Math.max(0,decCap-st.W); }
    }
  }else{
    /* 打者：安打/本塁打/盗塁/打点倍率に従う;打席と出場数変えない(打率連動作して変化)。 */
    st.H=Math.round(st.H*m); st.HR=Math.round(st.HR*m); st.SB=Math.round(st.SB*m);
    if(st.H>st.AB)st.H=st.AB;                   /* 安打数は打数を超えない。 */
    st.avg=st.AB?st.H/st.AB:0;
    st.RBI=Math.round(st.HR*2.1+(st.H-st.HR)*0.30);
  }
  /* d 値(評価へ影響/タイトル/降格)状態に合わせて補正。 */
  st.d += st.form===1?4:st.form===-1?-4:0;
}
/* 守備評価(近似 defensive runs)：守備位置難易度重み × 守備能力に対するリーグ基準的差 × 出場割合。 */
function defRuns(lv){
  if(S.pos==='P')return 0;
  const a=S.ab, par=LV[lv].par;
  const dp=S.dpos||(S.pos==='C'?'C':'2B');
  if(dp==='DH')return 0; /* DHには守備評価を付けない。 */
  const posW={SS:1.25,CF:1.20,C:1.15,'2B':1.05,'3B':1.00,RF:0.95,'1B':0.75,LF:0.80}[dp]||1;
  const skill=dp==='C'?(a.fld*0.4+a.arm*0.3+a.cat*0.3)
    :(a.rng*0.45+a.fld*0.40+a.arm*0.15);
  const gw=1; /* 出場割合はseasonFactorへ反映済み。 */
  return Math.round((skill-par)*posW*0.55*(S.seasonFactor||1));
}
function accStat(bucket,st){
  if(!S.stats[bucket]) S.stats[bucket]=blankStat();
  const t=S.stats[bucket]; t.yr++;
  if(bucket!=='MINOR'&&S.orgTeamId){ const tb=S.teamTally[bucket]||(S.teamTally[bucket]={});
    tb[S.orgTeamId]=(tb[S.orgTeamId]||0)+1; }
  if(S.pos!=='P'){ const dp=(st&&st._dh)?'DH':(S.dpos||'—'); S.dposYears[dp]=(S.dposYears[dp]||0)+1; }
  else if(S.role){ S.roleYears[S.role]=(S.roleYears[S.role]||0)+1; }
  ['G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','HLD','SO','ER'].forEach(k=>t[k]+=(st[k]||0));
  t.DEF+=(st.DEF||0);
  t.IP=+(t.IP+st.IP).toFixed(1);
}
function statLine(st){
  if(S.pos==='P'){ const role=roleN(S.role); const relief=(S.role==='CL'&&st.SV)?`｜${st.SV}セーブ`:(S.role==='MR'&&st.HLD)?`｜${st.HLD}ホールド`:''; return `出場 ${st.G}｜投球回 ${fmtIP(st.IP)}｜${st.W}勝${st.L}敗${relief}｜奪三振 ${st.SO}｜四球 ${st.BB||0}｜ERA ${st.era.toFixed(2)}｜WHIP ${(st.WHIP||0).toFixed(2)}`; }
  const obpN=st.PA>0?(st.H+st.BB)/st.PA:0;
  const slgN=slgOf(st);
  const obp=st.PA>0?obpN.toFixed(3).replace(/^0/,''):'-';
  const slg=st.AB>0?slgN.toFixed(3).replace(/^0/,''):'-';
  const ops=st.AB>0?(obpN+slgN).toFixed(3).replace(/^0/,''):'-';
  return `出場 ${st.G}｜打席 ${st.PA}｜打率 ${st.avg.toFixed(3).replace(/^0/,'')}｜出塁率 ${obp}｜長打率 ${slg}｜OPS ${ops}｜安打 ${st.H}｜本塁打 ${st.HR}｜打点 ${st.RBI}｜四球 ${st.BB}｜盗塁 ${st.SB}${st.DEF!==undefined?`｜守備 ${st.DEF>0?'+':''}${st.DEF}`:''}`;
}
/* 長打率估算：なし二三壘成績、に応じて本塁打比例と長打力推估塁打数。 */
function slgOf(st){
  if(!st.AB)return 0;
  const hr=st.HR, nonHR=Math.max(0,st.H-hr);
  /* 本塁打以外の安打のうち、約 22% 二塁打、3% 三塁打——整数本で算出し、塁打数必ず整数、小標本で成立しないSLGが出るのを防ぐ。 */
  const doubles=Math.round(nonHR*0.22), triples=Math.round(nonHR*0.03);
  const singles=Math.max(0,nonHR-doubles-triples);
  const tb=singles + doubles*2 + triples*3 + hr*4;
  return tb/st.AB;
}
/* 年俸（万円）。 */
function salaryFor(lv,d){
  switch(lv){
    case 'CPBL2':return 84; case 'NPB2':return 240;
    case 'R':return 60; case 'A1':return 95; case 'A2':return 135; case 'A3':return 270;
    case 'CPBL1':return Math.round(300+clamp(d,0,25)*120);
    case 'NPB1':return Math.round(1600+clamp(d,0,26)*560);
    case 'MLB':return Math.round(2400+clamp(d,0,26)*4300);
  } return 0;
}
const fmtMoney=yen=>{yen=Math.max(0,Math.round(Number(yen)||0));const oku=Math.floor(yen/100000000),man=Math.floor((yen%100000000)/10000);return (oku?oku+'億':'')+(man?man.toLocaleString()+'万円':oku?'円':'0円');};
/* UI基盤。 */
const $=id=>document.getElementById(id);
var _curYearBody=null; /* 當前年度的內容容器。 */
var MAX_YEARS=8;         /* DOM 最大保持年度領域数。 */
function logTarget(){ return _curYearBody || $('log'); }
function card(cls,title,html){ const d=document.createElement('div'); d.className='card '+cls;
  d.innerHTML=(title?`<h4>${title}</h4>`:'')+html; logTarget().appendChild(d);
  scrollBottom(); }
function divider(t){ /* dividerごとに新しい年度の折りたたみ領域を開始。 */ const log=$('log'); const blocks=log.querySelectorAll('.yr-block'); /* 終了した直前年へ展開アイコンを付けるが、collapsedは付けず開いたままにする。 */ const prev = blocks[blocks.length - 1]; if(prev){ const h = prev.querySelector('.yr-head'); if(h && prev.querySelector('.yr-body').children.length) h.classList.add('has-body'); } /* 二つ前の年度領域を見つけて折りたたむ。 */ const prevPrev = blocks[blocks.length - 2]; if(prevPrev){ prevPrev.classList.add('collapsed'); } /* 建新領域。 */ const block=document.createElement('div'); block.className='yr-block'; const head=document.createElement('div'); head.className='yr-head'; head.textContent=t; const body=document.createElement('div'); body.className='yr-body'; head.onclick=()=>block.classList.toggle('collapsed'); block.appendChild(head); block.appendChild(body); log.appendChild(block); _curYearBody=body; /* 上限超える時は最古の年度領域を削除してDOMを解放。 */ const newBlocks=log.querySelectorAll('.yr-block'); if(newBlocks.length>MAX_YEARS){ for(let i=0;i<newBlocks.length-MAX_YEARS;i++)newBlocks[i].remove(); } }
function board(phase){
  $('bd-name').innerHTML=`${S.name}<small>${S.dpos?DPN[S.dpos]:POSN[S.pos]}${S.role?'·'+roleN(S.role):''}·${playerType()}${S.traits.genius?' ★':''}</small>`;
  let t;
  if(S.stage==='HS')t=S.team+'（高'+['一','二','三'][S.stageYr-1]+'）';
  else if(S.stage==='U')t=S.team+'（大'+['一','二','三','四'][S.stageYr-1]+'）';
  else if((S.stage==='CORP'||S.stage==='IND'))t=S.team+'（アマチュア）';
  else t=S.teamName();
  { const tc = (S.orgTeamId && TEAM_COLOR[S.orgTeamId]) || 'var(--amber)';
    /* 白色か判定し、白背景に白文字となるのを防ぐ。 */
    const isWhite = (tc.toLowerCase() === '#ffffff' || tc.toLowerCase() === '#fff');
    
    /* プロ入り済みで球団色が設定されている場合、白背景ラベルを適用。 */
    const isProColored = (S.stage === 'PRO' && TEAM_COLOR[S.orgTeamId]);
    const txtColor = isProColored ? (isWhite ? '#000000' : tc) : 'var(--amber)';
    const bgStyle = isProColored ? 'background:#ffffff; padding:2px 8px; border-radius:6px; box-shadow:0 2px 4px rgba(0、0、0、0.4);' : '';
    
    const dot = isProColored ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isWhite ? '#cccccc' : tc};margin-right:6px;vertical-align:middle;box-shadow:0 0 2px rgba(0、0、0、0.2);"></span>` : '';
    
    $('bd-team').innerHTML = dot + `<span style="color:${txtColor}; ${bgStyle} font-weight:900;">${t}</span>`; }
  $('bd-age').textContent=S.age; $('bd-year').textContent=S.year;
  $('bd-ovr').textContent=ovr(); if(S.pos==='P'){const el=$('bd-tj'); if(el)el.textContent='';} $('bd-sal').textContent=Math.round((S.currentSalary||0)/10000).toLocaleString();
  [0,1,2].forEach(i=>$('lp'+i).classList.toggle('on',i===phase));
}
let choiceGeneration=0, activeChoiceToken=null;
function actClear(){ const a=$('act'); a.innerHTML=''; a.classList.remove('collapsed'); a.style.pointerEvents='';
  const t=$('act-toggle'); if(t)t.style.display='none'; }
function actToggleSync(){
  const a=$('act'), t=$('act-toggle'); if(!t)return;
  const has=a.innerHTML.trim()!=='' && a.style.display!=='none';
  t.style.display=has?'block':'none';
  t.textContent=a.classList.contains('collapsed')?'⌃ 選択肢を展開':'⌄ 選択肢を閉じる';
}
function escapeDiagnosticHTML(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function choose(title,opts){
  actClear(); const a=$('act'), generation=++choiceGeneration, token=createChoiceActionToken(generation);
  activeChoiceToken=token; a.style.pointerEvents='';
  a.classList.remove('collapsed'); /* 新しい選択肢が表示されたら自動で展開。 */
  if(title)a.innerHTML=`<div class="title">${title}</div>`;
  opts.forEach(o=>{ const b=document.createElement('button');
    b.className='btn'+(o.main?' main':'')+(o.warn?' warn':'');
    b.innerHTML=o.t+(o.s?`<small>${o.s}</small>`:'');
    b.disabled=false;
    b.onclick=()=>runChoiceAction({action:o.f,currentMarkup:()=>a.innerHTML,clear:actClear,restore:()=>choose(title,opts),token,currentGeneration:()=>choiceGeneration,currentToken:()=>activeChoiceToken,activateToken:t=>{activeChoiceToken=t;},isCurrentChoice:()=>b.isConnected&&a.contains(b),buttonLabel:b.textContent.trim(),disableAll:()=>{a.querySelectorAll('button').forEach(button=>{button.disabled=true;});a.style.pointerEvents='none';},errorContext:()=>{const ct=S?.ct,schedule=Array.isArray(ct?.annualSchedule)?ct.annualSchedule:[],due=schedule.find(x=>Number(x.year)===Number(S?.year));return{year:S?.year??null,age:S?.age??null,stage:S?.stage??null,org:S?.org??null,level:S?.lv??null,contractId:ct?.contractId??null,contractStartYear:ct?.startYear??null,contractEndYear:ct?.endYear??null,contractRemainingYears:ct?.remainingYears??null,contractAnnualSalary:ct?.annualSalary??null,currentSalary:S?.currentSalary??null,lastSalaryPaidYear:S?.lastSalaryPaidYear??null,currentYearSchedule:due?{year:due.year,amount:due.amount,paid:Boolean(due.paid)}:null};},reportError:(error,d)=>{const val=x=>escapeDiagnosticHTML(String(x??'—')),schedule=d.currentYearSchedule?`${val(d.currentYearSchedule.amount)}円／${d.currentYearSchedule.paid?'支払済':'未払い'}`:'なし';card('bad','処理中にエラーが発生しました',`選択処理を完了できませんでした。<br><b>エラーコード：${val(d.code)}</b><br><small>年度 ${val(d.year)}｜年齢 ${val(d.age)}｜${val(d.org)} ${val(d.level)}<br>契約ID ${val(d.contractId)}｜期間 ${val(d.contractStartYear)}～${val(d.contractEndYear)}｜残り ${val(d.contractRemainingYears)}年<br>現在年俸 ${val(d.currentSalary)}円｜最終支給年 ${val(d.lastSalaryPaidYear)}｜当年schedule ${schedule}</small><br>もう一度選択せず、この画面をスクリーンショットして報告してください。`);actToggleSync();}}); a.appendChild(b); });
  actToggleSync(); scrollBottom();
}
/* 能力加算介面：mode {dice：[..]} または {pool：n}。 */
function allocUI(mode,label,done){
  actClear(); ++choiceGeneration; activeChoiceToken=null; const a=$('act'); const keys=POS_AB[S.pos];
  let dice=mode.dice?mode.dice.slice():null, pool=mode.pool||0, idx=0, hist=[];
  a.innerHTML=`<div class="title">${label}</div><div id="al-top"></div><div id="al-rows"></div><div class="row2" id="al-btm"></div>`;
  const touchedKeys={};
  const top=$('al-top'),rows=$('al-rows'),btm=$('al-btm');
  function remaining(){ return dice?dice.length-idx:pool; }
  function render(){
    if(dice){ top.innerHTML='<div id="dice">'+dice.map((v,i)=>`<div class="die ${i<idx?'used':''} ${i===idx?'active':''} ${v===6?'six':''}">${v}</div>`).join('')+'</div>'; }
    else top.innerHTML=`<div class="pool">残り割り振りポイント：${pool}（能力をタップすると +1）</div>`;
    rows.innerHTML='';
    keys.forEach(k=>{ const v=S.ab[k],cap=v>=80;
      const r=document.createElement('div'); r.className='abrow'+(cap?' capped':'');
      const pk=(S.pot&&S.pot[k])||62, cst=abCost(k), cr=(S.carry&&S.carry[k])||0;
      r.innerHTML=`<span class="nm">${ABL[k]}</span><span class="bar"><i style="width:${v/80*100}%"></i><em style="left:${pk/80*100}%"></em></span><span class="val" style="line-height:1.1">${v}<small style="opacity:.5">/${pk}</small>${cst>1?`<span style="display:block;opacity:.5;font-size:10.5px;letter-spacing:1px;margin-top:-2px">${cr}/${cst}</span>`:''}</span>`;
      if(!cap&&remaining()>0)r.onclick=()=>{ const amt=dice?dice[idx]:1;
        const pc=(S.carry&&S.carry[k])||0;
        const got=addAb(k,amt); touchedKeys[k]=(touchedKeys[k]||0)+amt; hist.push([k,got,pc]); if(dice)idx++; else pool--;
        r.querySelector('.val').innerHTML=`${S.ab[k]} <b style="display:block;font-size:10.5px">${got>0?'+'+got:'ポイント蓄積中'}</b>`; render(); board(0); };
      rows.appendChild(r); });
    btm.innerHTML='';
    /* 復原鈕固定占める位：なし可復原時 disabled 而非消失、防止版面跳動作誤觸。 */
    const u=document.createElement('button'); u.className='btn'; u.style.textAlign='center';
    u.textContent='↩ 元に戻す'; u.disabled=!hist.length;
    u.style.opacity=hist.length?'1':'0.35'; u.style.cursor=hist.length?'pointer':'default';
    if(hist.length)u.onclick=()=>{ const [k,got,pc]=hist.pop(); S.ab[k]-=got; if(S.carry)S.carry[k]=pc; if(dice)idx--; else pool++; render(); board(0); };
    btm.appendChild(u);
    const allCap=keys.every(k=>S.ab[k]>=80);
    if(remaining()===0||allCap){ const c=document.createElement('button'); c.className='btn main';
      c.textContent=(remaining()>0&&allCap)?'能力が上限に達しました。残ったサイコロを捨てます ▸':'確定 ▸';
      c.onclick=()=>{ actClear(); allocDone(touchedKeys,dice?true:false); done(); }; btm.appendChild(c); }
    actToggleSync();
  }
  render();
}
/* 年間進出行。 */
function nextStep(){ if(S.done){ stepQ=[]; return; } /* 已引退：クリア済み後継続步驟、以後はしない跑契約更新/結算。 */ const f=stepQ.shift(); if(f)f(); }
function stageLabel(){
  if(S.stage==='HS')return '高'+['一','二','三'][S.stageYr-1];
  if(S.stage==='U')return '大'+['一','二','三','四'][S.stageYr-1];
  if((S.stage==='CORP'||S.stage==='IND'))return '社会人・アマチュア';
  return LV[S.lv].n;
}
function startYear(){ stepQ=[phasePre,phaseMid,phaseEnd]; divider(`${S.year}年・${S.age}歳・${stageLabel()}`); nextStep(); }
/* シーズン開幕前。 */
function phasePre(){
  board(0); S.tmpInj=0; S.seasonFactor=1; S.skipMid=false; S._majorInjuryThisSeason=false; S.prevD=S.lastD||0; S.lastD=0; /* 先保持上季 d 供投手定位判定。 */
  if(S.age>=48){ buyoutRemaining(1); endGame('体はもう限界。'+S.year+' 年の春季キャンプ後に引退を発表した。'); return; }
  const declAge=S.age-(S.traits.disc?2:0); /* 自律狂：衰えの開始を2年遅らせる。 */
  if(declAge>=32){ const dec=declAge>=35?5+(declAge-35):2;
    POS_AB[S.pos].forEach(k=>S.ab[k]=clamp(S.ab[k]-dec,1,80));
    card('bad','寄る年波には勝てない',`${declAge>=35?'第2段階（年々加速）':'第1段階'}の衰え：全能力<b class="dn">−${dec}</b>${S.traits.disc?'（自律の鬼：キャリアの衰えが2年遅延）':''}。これまでどおり追加トレーニングはできますが、体が元に戻ることはありません。`); board(0); }
  if(S.rehab>0){ S.rehab--; S.skipMid=true; S.seasonFactor=0;
    card('bad','リハビリ年',`大けがが治らず、今季は<b class="dn">全休確定</b>。リハビリ施設で過ごすしかない。（サイコロは2個に減少）`);
    const dummySt = {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0};
    S.log.push({y:S.year,age:S.age,tm:S.stage==='PRO'?S.teamName():(S.team||stageLabel()),line:'リハビリ年・シーズン全休', inj: true, st: S.stage==='PRO'?dummySt:null}); }
  let afterAsk=()=>{
    let n=S.skipMid?2:(()=>{const r=R();return r<0.35?3:r<0.75?4:r<0.95?5:6;})();
    if(S.traits.distract&&!S.skipMid)n=Math.max(2,n-1); /* 私生活多忙。 */
    if(S.traits.academy&&!S.skipMid&&chance(35))n++; /* 理論派：期望値略升。 */
    
    const dice=[]; let newSix=0;
    for(let i=0;i<n;i++){ const v=S.traits.genius?ri(4,6):S.traits.late?ri(3,6):ri(1,6); dice.push(v);
      if(v===6&&S.age<22&&!S.traits.genius){S.six++;newSix++;} }
      
    let msg=`自主トレで <b class="hl">${n}</b> 個のサイコロを振った。`;
    if(newSix&&!S.traits.genius)msg+=` 最高値「6」の累計：<b class="hl">${S.six}/5</b>回。`;
    
    /* 小細工無用：自動でダイスを振って能力へ加算し、上限超済み分は成績ボーナスへ回す。 */
    if(S.traits.combo && !S.skipMid && (S.comboKey||S.samePickKey)) {
      const ck = S.comboKey||S.samePickKey; /* 永遠用解鎖當下鎖定的能力。 */
      const cv = S.traits.genius?ri(4,6):S.traits.late?ri(3,6):ri(1,6);
      const gained = addAb(ck, cv);
      const overflow = S.lastOverflow || 0;

      if(overflow > 0) S.pendStat = (S.pendStat || 0) + overflow;

      let cmsg = `<br>小細工無用が発動：自動で<b class="hl">${cv}</b>ポイントを<b class="hl">${ABL[ck]}</b>へ投入`;
      if(gained > 0) cmsg += `（能力<b class="up">+${gained}</b>）`;
      if(overflow > 0) cmsg += `（頂点到達：余った ${overflow} ポイントを<b class="up">今季の成績ボーナス</b>へ変換）`;
      if(gained===0 && overflow===0) cmsg += `（能力ポイントは加算されたが、1段階上げるには足りなかった）`;
      msg += cmsg + `。`;
    }
    
    card('','シーズン前特訓',msg);
    if(S.six>=5&&!S.traits.genius&&S.age<22){ S.traits.genius=true;
      {
      const exDef=S.pos==='C'?['rng','fld','arm','cat']:[];
      const cands=POS_AB[S.pos].filter(k=>S.ab[k]<70&&!exDef.includes(k));
      for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=cands[i];cands[i]=cands[j];cands[j]=t;}
      const boost=cands.slice(0,2), bl=[];
      boost.forEach(k=>{ S.pot[k]=Math.min(80,(S.pot[k]||62)+10);
        S.ab[k]=clamp(S.ab[k]+5,1,80); bl.push(`${ABL[k]} <b class="up">+5</b>（潜在能力上限 +10 → ${S.pot[k]}）`); });
      card('gold','隠し特性解放：天才','22歳までに最高値を5回出した！ 今後、すべてのトレーニングダイスが<b class="hl">永久に4以上</b>となり、イベントカードの成功率が <b class="hl">70%</b>に上昇。'+(bl.length?`才能が覚醒し、潜在能力が再評価された：${bl.join('、')}。`:'')+'才能は隠せない。');
      board(1);
    } }
    choose('',[{t:`▸ トレーニング成果を割り振る（サイコロ${dice.length}個）`,main:true,f:()=>dposReview(()=>allocUI({dice},'トレーニング成果を割り振る（サイコロをタップして適用｜スカウト評価：'+(S.pos==='P'?'60/70/75':'70/75')+' 以上は成長効率が低下）',()=>nextStep()))}]);
  };
  /* 投手の開幕前：投球強度(持久力+TJ ゲージ)。 */
  const preAsk=afterAsk;
  if(S.pos==='P'&&S.stage==='PRO'&&!S.skipMid){
    afterAsk=()=>{
      choose(`開幕前の投球プラン（腕の状態：${(function(){const r=S.tj/tjCap();return S.rehab>0?'リハビリ中':r>=0.85?'肘に鈍い痛み':r>=0.6?'腕にやや疲労':r>=0.35?'まずまず':'腕が軽い';})()}）`,[
        {t:'全力投球',warn:true,s:'成績重視｜腕への負担：最大（TJゲージ ×1.25）',f:()=>{S.effort='全力投';preAsk();}},
        {t:'通常投球',main:true,s:'標準強度｜TJゲージ増加：通常',f:()=>{S.effort='通常投球';preAsk();}},
        {t:'省エネ投球',s:'成績は控えめ｜腕を温存（TJゲージ ×0.65）',f:()=>{S.effort='省エネ投球';preAsk();}}]);
    };
  }
  /* 大學季前：是否投入ドラフトと海外移籍（大二～大四）。 */
  if(false){ /* 大学ドラフトは大学4年終了後の pathChoiceU4 でのみ実施 */
    const o=ovr();
    const opts=[
      {t:'NPBドラフトへ参加',s:`現在の総合能力 ${o}｜年齢補正：若いほど高評価`,f:()=>runDraft(true,afterAsk)},
      {t:'大学に残って、もう一年鍛える',main:true,f:afterAsk}
    ];
    /* 年齢ペナルティ：1歳上がるごとに、基準小幅補正、契約金は大幅減。 */
    const agePenalty = Math.max(0, S.age - 18);
    const reqNPB = 44 + Math.floor(agePenalty / 2);   // 基準：18歳44 -> 22歳46。
    const reqMiLB = 50 + Math.floor(agePenalty / 2);  // 基準：18歳50 -> 22歳52。
    const bonusNPB = Math.max(100, 800 - agePenalty * 180);   // NPB契約金年齢ごとに大幅減。
    const bonusMiLB = Math.max(150, 1500 - agePenalty * 350); // MLB契約金年齢ごとに大幅減。
    if(o>=reqNPB)opts.push({t:'NPB移籍を交渉',s:`休学してNPB挑戦｜年齢が契約金に影響`,f:()=>{
      S.stage='PRO'; S.team=''; S.svc=0; S.faElig=false;
      pickOfferUI('NPB球団からのオファー','NPB',makeOffers('NPB',2,bonusNPB,2,3,'NPB2',null),afterAsk);}});
    if(o>=reqMiLB)opts.push({t:'MLB移籍を交渉',s:`休学してマイナー挑戦｜年齢が契約金に影響`,f:()=>{
      S.stage='PRO'; S.team=''; S.svc=0; S.faElig=false;
      pickOfferUI('MLB球団からのオファー','MiLB',makeOffers('MiLB',2,bonusMiLB,3,4,o>=55?'A1':'R',null),afterAsk);}});
    choose(`大学${['一','二','三','四'][S.stageYr-1]}年・シーズン前――進学かプロか、人生の分岐点`,opts);
    return;
  }
  if(S.stage==='PRO'&&S.age>=36&&S.rehab===0){
    const oldOpts=[{t:'もう一年挑戦する',main:true,f:afterAsk}];
    /* 海外所属のベテラン(衰退期)：現契約を破棄、台湾球界へ復帰;ovr<30(実力不足)対象外。 */
    if(['MLB','MiLB','KBO','CPBL'].includes(S.org)&&ovr()>=LV.NPB2.min){
      oldOpts.push({t:'契約を断り、日本球界へ戻る',s:'全盛期は過ぎた。それでも最後のプレーを故郷のファンに見せたい',f:()=>{
        const returnLv=ovr()>=LV.NPB1.min?'NPB1':'NPB2';
        buyoutRemaining();signTo('NPB',returnLv);card('good','日本球界復帰',`海外で積み上げた経験を携え、<b class="hl">${S.teamName()}</b>で日本球界へ復帰した。`);advance();
      }});
    }
    oldOpts.push({t:'引退記者会見を開く',warn:true,s:'現役を引退する',f:()=>{buyoutRemaining();daibaFarewell(()=>endGame('功成り名を遂げ、 '+S.year+' 年に現役引退を発表。'));}});
    choose('今年も春季キャンプを迎えたが、体は明らかに衰えている',oldOpts);
    return;
  }
  afterAsk();
}
/* シーズン中。 */
function phaseMid(){
  board(1);
  if(S.skipMid){ S.ironStreak=0; nextStep(); return; }
  const nEv=S.stage==='PRO'?3:2;
  loveEvent(()=>drawEvents(nEv,()=>{
    choose('',[{t:'▸ シーズン半ばの健康診断',main:true,f:()=>{ rollInjury();
      choose('',[{t:'▸ 今季の成績を見る',main:true,f:()=>{
        if(S.stage==='PRO')proSeason();
        else amateurSeason(); }}]); }}]);
  }));
}
function evOdds(){ /* イベントカード成功率：表示とダイス判定同一の値を使う。 */
  let base=(S.traits.genius||S.traits.late||S.traits.clutch)?70:50; /* 天才/遅咲き/大心臟 70。 */
  if(S.traits.thief)base-=10; /* 薪水小倫 -10。 */
  const boldPen=S.traits.clutch?0:15; /* 大心臟：全力勝負なしペナルティ。 */
  return {safe:Math.min(95,base+20), norm:base, bold:base-boldPen};
}
function drawEvents(n,done){
  if(n<=0){ done(); return; }
  choose('',[{t:`イベントカードを引く（残り${n}枚）`,main:true,f:()=>{
    const pool=EVENTS.filter(e=>e.for==='*'||(e.for==='P'&&S.pos==='P')||((e.for==='A'||e.for==='B')&&S.pos!=='P')||(e.for==='PRO'&&S.stage==='PRO'));
    const ev=pick(pool);
    const od=evOdds(); /* 実際のダイス判定と同じ値を使う。 */
    const after=()=>{ board(1); drawEvents(n-1,done); };
    choose(`イベント｜${ev.n}――どうする？`,[
      {t:'勝負に出る',warn:true,s:`成功率 ${od.bold}%｜${S.traits.clutch?'成功 +4／失敗は −2のみ':'効果／反動が最大（±3）'}`,f:()=>{resolveEvent(ev,'bold',after);}},
      {t:'いつもどおり',main:true,s:`成功率 ${od.norm}%｜標準効果（±2）`,f:()=>{resolveEvent(ev,'norm',after);}},
      {t:'安全策を取る',s:`成功率 ${od.safe}%｜効果／反動が最小（±1）`,f:()=>{resolveEvent(ev,'safe',after);}}]);
  }}]);
}
/* 初期状態はすべて架空名;プレイヤー非表示エディターで名簿を編集可能(プレイヤー端末内だけに保存)。 */
let CHEER=['高橋美咲','佐藤彩花','中村ひなた','小林結衣','山本玲奈','伊藤七海','渡辺さくら','加藤真央','松本葵','吉田莉子','岡田美月','清水楓'];
const PARTNER_JOB={'高橋美咲':'チアリーダー','佐藤彩花':'スポーツアナウンサー','中村ひなた':'タレント','小林結衣':'女優','山本玲奈':'歌手','伊藤七海':'スポーツキャスター','渡辺さくら':'モデル','加藤真央':'お笑いタレント','松本葵':'チアリーダー','吉田莉子':'アイドル','岡田美月':'フリーアナウンサー','清水楓':'俳優','森川あかり':'スポーツキャスター'};
function partnerJob(name){return PARTNER_JOB[name]||'タレント';}
const CHEER_DEFAULT=CHEER.slice();
let CHEER_SAFE=['森川あかり']; /* 不倫相手にしない名簿：交際・結婚は可能、不倫候補には出さない。 */
function datePool(){ /* 交往/結婚名單。 */
  if(CHEER_SAFE.length>=CHEER.length) return CHEER_SAFE.slice();      /* 安全名單より長：直接整組替換。 */
  return CHEER_SAFE.concat(CHEER.slice(CHEER_SAFE.length));           /* より短：同数量替換進出名單。 */
}
function affairPool(){ return CHEER.slice(); } /* 不倫名單=元のチアリーダー名簿。 */
function loveEvent(next){
  const L=S.love;
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
      {t:'堂々と認める：「温かく見守ってください」',s:'相手の所属先が認めるか次第（厳しいイメージ管理の噂）',f:()=>{
        if(chance(65)){ L.st='dating'; L.partner=p; L.dyrs=0; L.datedTimes=(L.datedTimes||0)+1;
          const gt=loveGainTxt('sta',1); board(1);
          card('gold','交際公表',`<b class="hl">${p}</b>がSNSに手をつないだ写真を投稿。「祝福ありがとうございます」。恋は人を輝かせる――${gt}。二人は正式に交際を始めた。`);
          if(L.datedTimes>=3&&L.kids===0&&!S.traits.married&&!S.traits.confidante){ S.traits.confidante=true;
            card('gold','隠し称号：女友達止まり',`3度目の恋も同じ結末。「私はあなたを好きになったのに、あなたは親友としか見てくれなかった」――誰かの人生で、永遠に脇役の人もいる。`); board(1); }
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
function divorceRec(){ const L=S.love;
  L.exes.push({name:L.partner,kids:L.kids});
  L.st='divorced'; L.partner=null; L.kids=0; /* 再婚後小孩再計算。 */ }
function loveCaught(next){
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
    {t:'土下座して、最後のチャンスを懇願する',s:'成功＝結婚継続｜失敗＝能力低下後に離婚',f:()=>{
      if(chance(40)){
        card('info','どん底を越えて',`一晩中、話し合った。<b class="hl">${L.partner}</b>は最後に言った。「子どものためにも、私が知っているあなたに戻るためにも――これが最後」。離婚は避けられたが、元に戻らないものもある。`); next(); }
      else{ const k2=pick(POS_AB[S.pos]); const g2=addAb(k2,-2);
        const ex=L.partner; divorceRec(); board(1);
        card('bad','謝罪届かず',`彼女は黙って首を横に振った。翌日、弁護士から書類が届き、<b class="hl">${ex}</b>との離婚が成立。再炎上のおまけまで付いた――<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } }},
    {t:'離婚届に署名する',f:()=>{ const ex=L.partner; divorceRec();
      card('bad','離婚',`離婚届に署名した。<b class="hl">${ex}</b>の発表は「互いの幸せを願っています」の一文だけだった。`); next(); }}]);
}
function proposalAsk(next){
  const L=S.love; if(L.st!=='dating'){ next(); return; }
  choose(`交際${L.dyrs}年――${L.partner}が結婚式の動画をじっと見ている`,[
    {t:'今こそプロポーズする',s:'スタミナ上昇｜今季の故障率低下',f:()=>{
      L.st='married'; L.kids=0; L.dyrs=0;
      const gTxt=loveGainTxt('sta',2)+'、'; S.tmpInj-=5; board(1);
      card('gold','結婚式',`本拠地のホームベース後方で片膝をつく。大型ビジョンには「Marry Me」。<b class="hl">${L.partner}</b>は泣きながらうなずいた。オフに結婚し、レッドカーペットにはベースが並んだ――${gTxt}今季の故障率 <b class="up">−5%</b>。`); next(); }},
    {t:'もう少し貯金してからにする',main:true,s:'交際が長引くほど破局リスク上昇',f:()=>{
      card('info','今はまだ','彼女は動画を閉じ、笑顔で「大丈夫」と言った。その目に浮かんだものを、あなたは見なかったことにした。'); next(); }}]);
}
function loveCaughtDating(next){
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
    {t:'謝罪してもう一度チャンスを彼女に懇願する',s:'関係を保存することに成功｜失敗＝再び能力を失って別れる',f:()=>{
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
  const before=S.pendStat||0;
  const g=addAbStat(k,amt);
  const over=(S.pendStat||0)-before;
  if(g>0&&over>0)return `<b class="up">${ABL[k]} +${g}</b>（上限超過${over}ポイントは今季成績ボーナスへ変換）`;
  if(g>0)return `<b class="up">${ABL[k]} +${g}</b>`;
  if(over>0)return `<b class="up">今季成績ボーナス＋${over}</b>（${ABL[k]}潜在的な限界に達しました)`;
  return `${ABL[k]}アビリティポイントは加算されるが、レベルアップするには不十分`;
}
function addAbStat(k,amt){ 
  if(amt<=0)return addAb(k,amt);
  const pk=(S.pot&&S.pot[k])||62;
  const isP=S.pos==='P';
  let cur=S.ab[k], bud=amt, cr=(S.carry&&S.carry[k])||0, gained=0;
  /* 能力上限到達後はポイント全額をシーズン成績ボーナスへ変換。 */
  if(cur>=pk){ S.pendStat=(S.pendStat||0)+bud; return 0; }
  
  /* 能力上限未到達なら通常コストで加算し、上限に達した時点で止める。 */
  while(bud>0 && cur<pk){
    let c = isP ? (cur>=66?7:cur>=60?4:cur>=55?2:1) : (cur>=72?3:cur>=64?2:1);
    bud--; cr++; if(cr>=c){ cr-=c; cur++; gained++; }
  }
  
  if(!S.carry) S.carry={}; S.carry[k]=cr; S.ab[k]=cur;
  
  /* 能力上限到達後の残りポイントは成績ボーナスへ変換。 */
  if(bud>0) S.pendStat=(S.pendStat||0)+bud;
  return gained;
}
function statBonus(pts,out){ /* 能力上限到達後は報酬を当該シーズンの成績ボーナスへ変換(次回の成績計算で適用)。 */
  S.pendStat=(S.pendStat||0)+pts;
  out.push(`<span class="up">絶好調（今季成績ボーナス ×${pts}）</span>`);
}
function resolveEvent(ev,mode,done){
  done=done||function(){};
  const od=evOdds(); /* と画面表示同じ値を使う、保證所見即所得。 */
  if(mode==='safe')S.cntSave++;
  let good,tag;
  if(mode==='safe'){ good=chance(od.safe); tag='保守的な反応'; }
  else if(mode==='bold'){ good=chance(od.bold); tag='全力を尽くしてください';
    if(good)S.cntBoldWin++; else S.cntBoldFail++; }
  else { good=chance(od.norm); tag=''; }
  if(mode==='safe'&&good)S.cntSaveWin=(S.cntSaveWin||0)+1; /* 自律狂：安全策の成功だけを数える。 */
  if((ev.n==='夜食の誘惑'||ev.n==='スポンサー契約のオファー')&&mode!=='safe'&&!good)S.cntSnack++;
  /* 効果は固定 ±1;全力勝負成功時は同じ能力へさらに +1(成功時は成長量が倍)、全力勝負失敗時は−1を2回適用。 */
  /* 効果段階：保守 ±1 / 通常 ±2 / 全力勝負 ±3;大心臟全力勝負成功 +4、失敗 -2。 */
  let mag=mode==='safe'?1:mode==='bold'?3:2;
  if(mode==='bold'&&S.traits.clutch)mag=good?4:2; /* 大心臟：上檔更高、下檔更軟。 */
  const fx=good?ev.g:ev.b; let out=[],touched=false;
  const applyAbil=(k,dir)=>{ const step=dir*mag;
    if(dir>0){
      const pk=(S.pot&&S.pot[k])||62;
      const isP=S.pos==='P';
      let cur=S.ab[k], bud=step, cr=(S.carry&&S.carry[k])||0, gained=0;
      
      if(cur>=pk){
        statBonus(bud,out); /* 全額を成績ボーナス。 */
      } else {
        while(bud>0 && cur<pk){
          let c = isP ? (cur>=66?7:cur>=60?4:cur>=55?2:1) : (cur>=72?3:cur>=64?2:1);
          bud--; cr++; if(cr>=c){ cr-=c; cur++; gained++; }
        }
        if(!S.carry) S.carry={}; S.carry[k]=cr; S.ab[k]=cur;
        
        if(gained>0) out.push(`${ABL[k]} <span class="up">+${gained}</span>`);
        else if(bud<=0) out.push(`${ABL[k]}：アビリティポイントは加算されますが、レベルアップには不十分です。`); /* ポイントを進出捗ゲージへ蓄積、次の段階に未到達。 */
        if(bud>0) statBonus(bud,out); /* 超済み分を成績ボーナスへ変換。 */
      }
      touched=true;
    } else { const g=addAb(k,step); touched=true;
      out.push(`${ABL[k]} <span class="dn">${g}</span>`); }
  };
  for(const k in fx){ const dir=fx[k]>0?1:-1;
    if(k==='inj'){ let v=({1:8,2:12,3:16,4:16})[mag]; if(mode==='bold'&&S.traits.clutch)v=12; /* 大心臟：全力勝負故障率を通常水準へ下げる。 */ S.tmpInj+=v; out.push(`今シーズンの怪我の可能性<span class="dn">+${v}%</span>`);}
    else if(k==='rand'){ applyAbil(pick(POS_AB[S.pos]),dir); }
    else if(k in S.ab){ applyAbil(k,dir); } }
  if(!touched){ applyAbil(pick(POS_AB[S.pos]),good?1:-1); }
  card(good?'good':'bad','イベントカード｜'+ev.n+(tag?`（${tag}）`:''),
    `${good?ev.gt:ev.bt}。${mode==='bold'&&good?'<b class="hl">勝負成功！</b>':''}${mode==='bold'&&!good?'<b class="dn">勝負失敗……</b>':''}<br>${out.join('｜')||'（能力ポイントは加算されたが、1段階上げるには足りなかった）'}`);
  checkTraitsMid();
  done();
}
/* シーズン中即時可解鎖的特性。 */
function allocDone(touched,isDice){
  const keys=Object.keys(touched);
  if(isDice&&S.stage!=='HS'&&keys.length){ /* 高校以外（大学・社会人・独立・プロ）の開幕前ダイスだけを集中育成判定へ使用。 */
    const tot=Object.values(touched).reduce((a,b)=>a+b,0);
    let mk=keys[0]; keys.forEach(k=>{ if(touched[k]>touched[mk])mk=k; });
    const focused=(touched[mk]/tot>=0.75)?mk:null; /* 75%以上を同じ能力へ投入した場合に集中育成と判定。 */
    if(focused&&focused===S.samePickKey)S.samePick++;
    else if(focused){ S.samePickKey=focused; S.samePick=1; }
    else { S.samePickKey=null; S.samePick=0; }
    if(S.samePick>=3&&!S.traits.combo){ S.traits.combo=true; S.samePickBonus=true;
      S.comboKey=S.samePickKey; /* 鎖定解鎖當下的能力、之後以後はしない変化動作。 */
      traitCard('combo','小細工無用',`3年連続、ひとつの武器だけを磨き続けた――<b class="hl">シーズン前にダイスを1個自動で振り、得点を得意能力「${ABL[S.comboKey]}」へ必ず加算する</b>。一点突破こそ正義や。`); }
  }
  /* 遅咲き：25歳以降の単年能力増加合計 >=8。 */
  const gain=Object.values(touched).reduce((a,b)=>a+b,0);
  if(!S.traits.late&&!S.traits.genius&&ovr()<47&&S.age>=25&&S.age<32&&isDice&&gain>=16){
    S.traits.late=true;
    const exDef=S.pos==='C'?['rng','fld','arm','cat']:[];
    const cands=POS_AB[S.pos].filter(k=>S.ab[k]<70&&!exDef.includes(k));
    for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=cands[i];cands[i]=cands[j];cands[j]=t;}
    const boost=cands.slice(0,2), bl=[];
    boost.forEach(k=>{ S.pot[k]=Math.min(80,(S.pot[k]||62)+10); S.ab[k]=clamp(S.ab[k]+5,1,80);
      bl.push(`${ABL[k]} <b class="up">+5</b>(最大潜在力+10 →${S.pot[k]}）`); });
    card('gold','隠し特性解放：大器晩成',`周囲はもう伸びしろがないと思っていた。だが、今季のあなたは別人だった――今後、トレーニングダイスは<b class="hl">永久に3以上</b>、イベントカード成功率は<b class="hl">70%</b>になる。`+(bl.length?`潜在能力を再評価：${bl.join('、')}。`:'')+'物語は、ここからや。');
    board(1); }
}
function checkTraitsMid(){
  /* 自律狂：25 歳までに安全策の「成功」15 次 + 不倫発覚なし + 夜食 <5 次。 */
  if(!S.traits.disc&&S.age<25&&(S.cntSaveWin||0)>=15&&S.love.caught===0&&S.cntSnack<5){
    traitCard('disc','自律の鬼','午前4時のロサンゼルスを見たことがあるか？――若い頃から体を聖堂のように管理した。パーティーも酒もなく、響くのはトレーニング器具の音だけ。<b class="hl">衰えの開始が2年遅れる</b>。同世代より長く全盛期を保てる。'); }
  /* 大心臟：25歳までに全力勝負(全力勝負)成功 7 次(失敗してもよい)。 */
  if(!S.traits.clutch&&S.age<25&&S.cntBoldWin>=7){
    traitCard('clutch','強心臓','幾度もの大勝負をくぐり抜け、もう何が起きても動じない。勝負を重ねるほど、リターンは大きく、失うものは小さくなる――<b class="hl">「全力勝負」の成功率が天才級へ上昇、成功時+4、失敗時−2、故障リスクは通常まで低下</b>。シリーズ制覇と国際大会MVPの確率も上昇する。'); }
  /* 私生活多忙：夜食/広告出演/熱愛報道累計(夜食回数と恋愛イベント発生回数から概算)。 */
  if(!S.traits.distract&&!S.traits.disc&&(S.love.affairs+S.love.caught+S.cntSnack)>=4&&(S.love.affairs+S.love.caught)>=1){
    traitCard('distract','私生活多忙','テレビ出演、スポンサー仕事、SNSに気を取られ、オフに野球へ集中できない日々が続いた――<b class="dn">シーズン前のサイコロが永久に−1個</b>（最低2個）。','bad'); }
  /* 更衣室毒瘤：全力勝負失敗 4+ 次、または渣男。 */
  if(!S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace&&(S.cntBoldFail>=10||S.traits.scum)){
    traitCard('cancer','ロッカールームの癌','首脳陣は制御不能な言動にうんざりし、チームメートも報道にざわついている。球団は成績よりロッカールームの空気を優先――<b class="dn">シーズン中のトレード率が大幅上昇し、契約更改も不利になる</b>。','bad'); }
}
function teamNick(team){ /* ◯◯先生的◯◯：球団名を代表する語を取得。 */
  const map={'台中マンモス':'マンモス','府城ライオンズ':'ライオン','桃園コングス':'キングコング','新北ナイツ':'騎士','台北ダイナソーズ':'恐竜','高雄イーグルス':'神鷲',
    /* 同名処理：ソックス系は色で区別;大人2球団ともオレンジ、都市名で区別。 */
    'ボストン・レッドソックス':'レッドソックスのキング','シカゴ・ホワイトソックス':'ホワイトソックスのキング','東京グランズ':'東京グランズ','ベイエリア・ジャイアンツ':'ベイエリア・ジャイアンツ',
    /* slice(-2) 切字修正。 */
    'オークランド・アスレチックス':'オークランド・アスレチックス','アリゾナ・ダイヤモンドバックス':'コブラ'};
  return map[team]||(team||'').slice(-2);
}
function teamChampRate(team){ /* 表示用優勝確率：球団ごとに毎年少し変動作、球団名のハッシュから基準を算出。 */
  let h=0; for(let i=0;i<team.length;i++)h=(h*31+team.charCodeAt(i))&0xffff;
  const base=8+(h%22); /* 8~29% */
  return Math.round(base);
}
function faYears(d,cap){ /* FA契約年数は成績が安定し故障が少ないほど長くし、上限は野手15年・投手7年。 */
  const perf=Math.max(0,Math.min(1,(d+2)/8)); /* d=-2→0、 d=6→1 */
  const injPenalty=(S.bigInj||0)*0.12+(S.tjCount||0)*0.15;
  let yrs=Math.round(2+perf*(cap-2)-injPenalty*cap);
  /* 球団は引退年齢と衰えを考慮し、ベテランへ長期契約を提示しない。 */
  let ageCap=cap;
  if(S.age>=36)ageCap=2; else if(S.age>=34)ageCap=3; else if(S.age>=32)ageCap=5; else if(S.age>=30)ageCap=8;
  yrs=Math.min(yrs,ageCap);
  return Math.max(1,Math.min(cap,yrs));
}
function demotionAudit(cont){
  if(!S.demotionRefused){ cont(); return; }
  S.demotionRefused=false;
  /* 契約額に見合う成績：d >= 契約の年俸係数に必要な水準(mult 高額ほど基準も上げる)。 */
  const need=Math.round((S.ct&&S.ct.contractMultiplier?S.ct.contractMultiplier:1)*2)-1; /* mult1→1、 mult1.2→1.4→1、 mult2→3 */
  if((S.lastD||0)>=need){
    if(S.traits.cancer){ removeTrait('cancer','ロッカールームの癌');
      card('good','結果で黙らせる','シーズンを通した活躍で周囲を黙らせた――<b class="hl">「ロッカールームの癌」を返上</b>。降格を拒否した判断が正しかったと証明した。'); board(1); }
    else card('good','自分の価値を維持する','あなたはこの契約にふさわしい人物であることを証明しました。');
  } else {
    if(!S.traits.thief){ S.traits.thief=true;
      card('bad','隠し特性解放：給料泥棒','降格を拒否したのに成績は上がらない。ファンから「給料泥棒」と呼ばれ始めた――<b class="dn">イベントカード失敗率が永久に+10%</b>。この悪評は引退まで消えない。'); board(1); }
    else card('bad','給料泥棒','また無駄な一年だった。スタンドのブーイングはさらに大きくなった。');
  }
  cont();
}
function tradeCheck(cont){
  if(S.stage!=='PRO'||!LV[S.lv].top||S.seasonFactor<=0){ cont(); return; }
  const star = ovr()>=LV[S.lv].par+4; /* スター：総合≥リーグ平均+4。 */
  let p=15+ (S.tradeHeat||0); /* 基礎 15% + 累積怨氣。 */
  if(S.traits.cancer)p+=25; if(S.traits.ambience)p+=20;
  if(!chance(p)){ cont(); return; }
  /* 一人一城：神主牌/◯◯先生是城市的象徵、球団決して不放人(非賣品)。 */
  if(S.traits.franchise||S.traits.mrteam){
    card('info','非売品',`他球団が魅力的な交換要員をそろえて打診したが、フロントは会議すら開かず拒否――<b class="hl">「彼はこの街の象徴。非売品だ」</b>`);
    board(1); cont(); return;
  }
  if(star){
    /* スター：否決權詢問(同旧設定)。 */
    if(S.traits.cancer){ doTradeExec(); card('bad','厄介払いトレード','球団はロッカールームの空気に耐えかね、問答無用で放出した。'); board(1); cont(); return; }
    choose('トレード期限直前、他球団からオファー。球団が拒否権を行使するか確認してきた',[
      {t:'同意してうなずき、環境を変える',main:true,f:()=>{ doTradeExec(); card('info','移籍する','荷物をまとめて新しい街へ向かいます。'); board(1); cont(); }},
      {t:'拒否権を行使して残留する',warn:true,s:'今後2年間は優勝確率がやや低下し、次回契約の年俸が−15%',f:()=>{
        S.tradeRefuse=2; card('info','トレード拒否',`トレード拒否権を行使した。残留を選んだ代償に球団の再建計画は狂い、短期的な戦力と次回契約には悪影響が出る。それでも、このユニフォームを着続ける。`); board(1); cont(); }}]);
    return;
  }
  /* 非スター：交易傳言、可抱怨または沉默。 */
  choose('トレードの噂：メディアが「放出の可能性あり」と報道',[
    {t:'メディアの前で不満をぶちまける',warn:true,s:'今度は取引される可能性が高まります',f:()=>{
      S.complainCount=(S.complainCount||0)+1;
      if(S.complainCount>=2&&!S.traits.ambience){ S.traits.ambience=true;
        card('bad','隠し特性解放：ムードメーカー','またメディアに不満をぶちまけた。フロントも「抱えておくには危険すぎる」と判断――<b class="dn">今後のトレード発生率が永久に上昇</b>。'); board(1); }
      if(chance(60)){ doTradeExec(); card('bad','噂が現実に',`不満発言が一面を飾り、球団はそのまま放出を決断。新天地で結果を出すしかない。`); board(1); }
      else card('info','騒いだだけで何もなし','苦情は苦情、この取引は結局実現しませんでした。あなたはまだ元のチームにいますが、雰囲気は少し緊張しています。');
      cont(); }},
    {t:'黙ってプレーに集中する',main:true,s:'トレード確率は変わらない',f:()=>{
      if(chance(35)){ doTradeExec(); card('info','取引は完了しました',`あなたの沈黙にもかかわらず、チームは取引を完了しました。 '`); board(1); }
      else card('info','泊まった','噂はあくまで噂です。新しい野球シーズンでも、同じジャージを着ます。');
      cont(); }}]);
}
function doTradeExec(){
  /* シーズン後のトレードは翌季から新球団所属とし、tradeFromを設定せず翌年の成績が二球団に分割表示されるのを防ぐ。 */
  S.teamYears=0; S.champThisTeam=false; S.champTeam=null;
  const list=S.org==='CPBL'?CPBL_TEAMS:S.org==='NPB'?NPB_TEAMS:MLB_TEAMS;
  const nt=pick(list.filter(t=>t!==S.orgTeamId)); S.orgTeamId=nt; board(1);
}
function portionOf(st,r){
  const p={...st};
  ['G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','SO','ER'].forEach(k=>p[k]=Math.round(st[k]*r));
  p.IP=+(st.IP*r).toFixed(1);
  p.avg=p.AB>0?p.H/p.AB:0; p.era=p.IP>0?p.ER*9/p.IP:0;
  return p;
}
function rollInjury(){
  const p=injuryProb();
  if(!chance(p)){ card('info','健康の回復',`今季は無事に出場できた。（故障率 ${p}%）`); S.injNext=0; return; }
  S.injNext=0;
  if(chance(64)){ // 64% 的確率是小傷。
    const cut=ri(20,45); S.seasonFactor=1-cut/100; S.ironStreak=0;
    card('bad','軽傷',`肉離れで故障者リスト入りしており、今季は試合数が減る見込みだ。<b class="dn">${cut}%</b>。${injStatLoss(false)}`);
  }else{
    const played = ri(5, 45); /* させるシーズンランダムにシーズンの 5% ~ 45% 時点で故障させる。 */
    S.seasonFactor = played / 100; /* 割合を当該シーズンの出場数へ適用。 */
    S.bigInj++; S._majorInjuryThisSeason=true; S.ironStreak=0;
    let txt=`重傷――手術を受けることになった。<b class="dn">今季絶望</b>（今季は出場予定の${played}%を消化）。`;
    if(chance(20)){ S.rehab=1; txt+=`医師は首を横に振った。<b class="dn">来季開幕にも間に合わない</b>（翌季全休）。`; }
    card('bad','重傷',txt+injStatLoss(true));
    if(S.bigInj>=2&&!S.traits.glass&&S.age<32){ /* 32 歳以降の重傷は加齢扱い、スペランカー判定には使わない。 */
      S.traits.glass=true;
      card('bad','隠し特性解放：スペランカー','キャリア2度目の大けが。以後は故障がつきまとい、毎季の故障率が<b class="dn">40%以上</b>となる。'); }
    else if(S.bigInj>=2&&!S.traits.glass&&S.age>=32){
      card('info','医療チームの評価','「これは経年劣化であり、物理的な問題ではありません。」 - チームは誰よりもベテランの怪我に対してオープンな目で見ています。'); }
  }
}
function injStatLoss(big){
  if(big){ /* 重傷のたびに全能力−5。身体的なダメージを能力へ反映。 */
    POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); }); board(1);
    return `大きな怪我は体力に深刻なダメージを与えます：<b class="dn">フルアビリティ−5</b>。`;
  }
  if(!chance(40))return '';
  const keys=POS_AB[S.pos];
  let k=pick(keys); if(!(k in S.ab))k=pick(keys);
  const amt=ri(1,2);
  S.ab[k]=clamp(S.ab[k]-amt,1,80); board(1);
  return `けがの後遺症が残った：<b class="dn">${ABL[k]} −${amt}</b>。`;
}
function amateurSeason(){
  if(S.seasonFactor===0){ card('bad','','シーズン中、私はチームメイトのプレーをサイドラインから見ることしかできませんでした。');
    S.log.push({y:S.year,age:S.age,tm:S.team||stageLabel(),line:'怪我でシーズン全休', inj:true}); nextStep(); return; }
  const cups=S.stage==='HS'?HS_CUPS:S.stage==='U'?U_CUPS:['リーグ 1 春季リーグ','社会人野球A部秋季リーグ戦'];
  const thr=S.stage==='HS'?[52,46,40,34,28]:[60,54,48,42,36];
  let gain=0,lines=[],plain=[];
  const tB=S.stage==='HS'?({1:6,2:0,3:-6})[S.hsTier||2]:0; /* 高校の非表示強度ランク。 */
  cups.forEach(c=>{ const pw=ovr()+tB+ri(-8,8);
    const i=pw>=thr[0]?0:pw>=thr[1]?1:pw>=thr[2]?2:pw>=thr[3]?3:pw>=thr[4]?4:5;
    const rk=['チャンピオン','準優勝','準決勝','準々決勝','トップ16','予選落ち'][i];
    const pts=[7,5,4,3,2,1][i]+Math.floor(ovr()/22);
    gain+=pts; lines.push(`${c}：<b class="hl">${rk}</b>（+${pts}ポイント）`); plain.push(`${c}${rk}`);
    if(S.stage==='U'&&rk==='チャンピオン'&&!S.traits.academy){ S.traits.academy=true;
      card('gold','隠し特性解放：理論派','大学の充実した設備と科学的トレーニングで土台を築いた――<b class="hl">25歳まで故障率−5%、シーズン前ダイスの期待値上昇</b>。'); }
    if(i===0)S.honors.push(`${S.year} ${c}チャンピオン`); });
  S.pool+=gain;
  S.log.push({y:S.year,age:S.age,tm:S.team||stageLabel(),line:plain.join('、'), inj:false});
  card('','年間大会結果',lines.join('<br>')+`<div class="statline">能力ポイントを${gain}獲得。シーズン終了時にまとめて配分する。能力が高いほど大会での獲得量も増える。</div>`);
  maybeIntl(()=>nextStep());
}
function proSeason(){
 const st=simSeason(S.lv); S.lastSt=st; S.lastD=st.d;
  
  /* 1. リーグ最大出場数の安全制限。 */
  const maxG = (LV[S.lv]&&LV[S.lv].g)||162;
  st.G = Math.min(st.G, maxG);

  /* 2. 投手進出階成績合理性防呆。 */
  if(S.pos==='P'){ 
    st.G = Math.max(st.G, Math.ceil(st.IP/9)); // 投球回から最低登板数を保証。
    st.SV = Math.min(st.SV || 0, st.G); // セーブ数は登板数を超えない。
    st.HLD = Math.min(st.HLD || 0, st.G - (st.SV || 0)); // ホールド数は登板数からセーブ数を引いた値を超えない。
    
    // 勝敗数の合計が登板数を超えたら同比率で縮小。
    if ((st.W + st.L) > st.G) {
      const ratio = st.G / (st.W + st.L);
      st.W = Math.floor(st.W * ratio);
      st.L = Math.floor(st.L * ratio);
    }
  } else {
    /* 野手防呆：打席数は出場数以上。 */
    st.PA = Math.max(st.PA, st.G); 
  }
  if(S.pendStat>0&&S.seasonFactor>0){
    /* 【修正】好調整ボーナス、当該シーズンの実際の出場割合（seasonFactor）で減衰。 */
    const p = S.pendStat * S.seasonFactor;
    if(S.pos==='P'){
      /* 好調整ボーナスは監督の積極起用として、セーブ投手の登板数を上限内で増やしてから内容を加算し、制約を再適用。 */
      if(!isSP()){ const addG=Math.min(Math.max(0,68-st.G),Math.round(p*1.2)); st.G+=addG; st.IP=+(st.IP+addG*1.05).toFixed(1); }
      st.SO+=Math.round(p*8); st.IP=+(st.IP+p*4).toFixed(1);
      if(isSP())st.W+=Math.round(p*0.4); else st.SV+=Math.round(p*0.6);
      st.era=st.IP>0?clamp(st.era-p*0.05,1.40,9.90):st.era; st.ER=Math.round(st.era*st.IP/9);
      if(!isSP()){ /* セーブ数と勝敗数は登板数を超えない(物理約束)。 */
        st.SV=Math.min(st.SV||0,Math.floor(st.G*0.85));
        st.HLD=Math.min(st.HLD||0,Math.max(0,st.G-st.SV));
        const decCap=Math.max(0,st.G-st.SV-st.HLD);
        if((st.W+st.L)>decCap){ st.W=Math.min(st.W,decCap); st.L=Math.max(0,decCap-st.W); }
      } }
    else { const Lg=LV[S.lv];
      /* 好調整ボーナスは監督の積極起用として出試合機会へ先に変換し、GとPAを連動作させてリーグ試合数以内に収め、打撃内容も上げる。 */
      const addG=Math.min(Math.max(0,(Lg.g||120)-st.G), Math.round(p*1.5));
      const addPA=Math.round(addG*4.25), addAB=Math.round(addPA*0.9);
      st.G+=addG; st.PA+=addPA; st.AB+=addAB;
      let addH=Math.round(addAB*0.55)+Math.round(p*1.5); /* 新打席打得火燙+原打席手感提升。 */
      addH=Math.max(0,Math.min(addH, st.AB-st.H));        /* 安打数は打数を超えない。 */
      const addHR=Math.min(addH, Math.round(p*1.2));
      st.H+=addH; st.HR+=addHR; st.RBI+=Math.round(addHR*2.1+(addH-addHR)*0.3);
      st.avg=st.AB?st.H/st.AB:0; }
  }
  S.pendStat=0;
  /* 投球強度による成績補正。 */
  if(S.pos==='P'&&S.seasonFactor>0){ const em={'全力投球':1,'通常投球':0,'省エネ投球':-1}[S.effort]||0;
    if(em!==0){ st.d+=em; st.era=clamp(st.era-em*0.25,1.40,9.90); st.ER=Math.round(st.era*st.IP/9);
      st.SO=Math.round(st.SO*(1+em*0.06)); } }
  if(S.traits.onetool&&S.seasonFactor>0){ /* ユーティリティー：得意能力によって代打・代走・守備固めの出試合機会を追加(ボーナス、半減ではなく加算)。 */
    const boost=1.25; /* 得意能力による追加出試合機会。 */
    ['G','PA','AB'].forEach(k=>{ if(typeof st[k]==='number')st[k]=Math.round(st[k]*boost); });
    /* 累積型成績隨打席等比小幅補正。 */
    ['H','HR','RBI','SB','BB'].forEach(k=>{ if(typeof st[k]==='number')st[k]=Math.round(st[k]*boost); });
    st.avg=st.AB>0?st.H/st.AB:0; }
  const bucket=bucketOf(S.lv); accStat(bucket,st);
  if(S.seasonFactor===0){ card('bad','シーズンデータ','（今季は怪我、戦績なし）'); }
  else if(S.tradeFrom){ /* シーズン途中の移籍：移籍前後の2区分を表示+合計。 */
    const r=0.35+R()*0.3, p1=portionOf(st,r), p2=portionOf(st,1-r);
    card('','シーズンデータ（シーズン途中の移籍）',
      `<span class="tag">${S.tradeFrom}</span><div class="statline">${statLine(p1)}</div>`+
      `<span class="tag">${S.teamName()}</span><div class="statline">${statLine(p2)}</div>`+
      `<span class="tag">合計</span><div class="statline">${statLine(st)}</div>`);
  }
  else card('','シーズンデータ',`<span class="tag">${S.teamName()}${S.dpos?'｜'+S.dpos:''}</span><div class="statline">${statLine(st)}</div>`);
  /* 不調整年・キャリアハイ年の説明カード。 */
  if(st.form===-1){
    card('bad','巨大な最低点',`体調はとても良かったのですが、成績は決して良くなく、大スランプに見舞われました。孤独で無力、それは溺れているようなもので、孤独な木を自由につかむことしかできません。`);
  }else if(st.form===1){
    if(S.pos==='P') card('gold','キャリア年数','指先を通る縫い目の感触は他に類を見ないもので、投げたボールは命が吹き込まれたようで、誰も想像できない角度で打者のバットを回避し、しっかりとキャッチャーのグラブに収まります。');
    else card('gold','キャリア年数','投球がバスケットボールほど大きく見える。縫い目も回転も丸見えで、『マトリックス』の弾丸のように遅い。芯で捉えた打球は次々とスタンドへ消えていった。');
  }
  const isInj = S.seasonFactor <= 0.45; /* 重傷による全休年か判定。 */
  S.log.push({y:S.year,age:S.age,tm:S.tradeFrom?`${S.tradeFrom}→${S.teamName()}`:S.teamName(),p:S.dpos||'',line:S.seasonFactor===0?'怪我でシーズン全休':statLine(st), inj: isInj, st: st});
  S.tradeFrom=null;
  /* 鐵人累計。 */
  const healthy=S.seasonFactor>=0.95&&(S.pos==='P'?(isSP()?st.IP>=120:st.G>=42):st.G>=LV[S.lv].g*0.8);
  if(healthy){ S.ironStreak++;
    if(S.ironStreak>=5&&!S.traits.iron){ S.traits.iron=true;
      card('gold','隠し特性解放：鉄人','5年連続でほぼ全試合出場！ 鉄の体を手に入れ、今後は毎季の故障率が<b class="hl">10%以下</b>となる。'); } }
  else if(S.seasonFactor<0.95)S.ironStreak=0;
  /* 一芸特化：まずレギュラー基準を確認し、未達時だけ突出した能力の有無を見る。 */
  if(S.pos!=='P'){ const tg=toolGap();
    /* 主力判定：当該シーズンにリーグ試合数の60%以上出場した選手はレギュラー以上とし、ユーティリティー判定しない。 */
    const isRegular = S.seasonFactor>0 && st.G >= LV[S.lv].g*0.60;
    if(!S.traits.onetool && !isRegular && tg.gap>=22 && tg.val>=58 && careerAllStars()<4){ S.traits.onetool=true;
      const wasBefore=S.removed.includes('一芸特化');
      S.removed=S.removed.filter(x=>x!=='一芸特化'); /* 再発動作時：取り消し線の記録を消す。 */
      const role=tg.role;
      S.toolRole=role;
      if(wasBefore||S.age>=33)
        traitCard('onetool','一芸特化',`衰えで他の武器は失った。それでも<b class="hl">${role}</b>だけは健在。首脳陣はベンチの切り札として、勝負どころであなたを送り出す。`,'bad');
      else
        traitCard('onetool','一芸特化',`とんでもなく強力な武器が 1 つだけあり、残りはただの穴です。コーチはあなたに先発させようとはせず、重要な瞬間にただ一つのことだけをやらせる、それはあなたがチームのリーダーになるということです。<b class="hl">${role}</b>。出場試合数は激減したが、その実力は比類ない。`,'bad'); }
    else if(S.traits.onetool && (tg.gap<18 || (S.seasonFactor>0 && st.G>=LV[S.lv].g*0.60))){ /* 能力を回復 または レギュラーへ復帰 → 解除。 */
      removeTrait('onetool','一芸特化'); S.toolRole=null;
      card('good','一芸特化を返上','ついに先発メンバーへ定着。ベンチの切り札だけではないことを結果で証明した――<b class="hl">「一芸特化」を解除</b>。もう立派なレギュラーや。'); board(1); } }
  awards(bucket,st);
  S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});
  recordSalaryEvaluation(st);
  if(S.pos==='P'&&S.seasonFactor>0)tjAccrue();
  tjGamble(()=>demotionAudit(()=>tradeCheck(()=>maybeIntl(()=>nextStep()))));
}
function awards(bucket,st){
  if(!LV[S.lv].top||S.seasonFactor===0)return;
  const y=S.year,h=S.honors,lgN={CPBL:'台湾プロ野球',KBO:'KBO',NPB:'NPB',MLB:'メジャーリーグ'}[bucket];

  /* 建立適合 simSeason 数學邏輯的基準表 [基礎基準、 鬼神保底基準]。 */
  /* 比率成績(ERA/AVG/OBP)と非試合数連動作成績(SV/HLD/SB)3リーグで基準を統一。 */
  /* 打席・投球回に連動作する(HR/RBI/SO)に応じて 120：143：162 試合数試合数比で拡大。 */
  const TH = {
    CPBL: { g: 120, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [130, 180], avg: [0.300, 0.360], hr: [20, 32], rbi: [75, 105], obp: [0.370, 0.430] },
    KBO:  { g: 144, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [156, 216], avg: [0.300, 0.360], hr: [24, 38], rbi: [90, 126], obp: [0.370, 0.430] },
    NPB:  { g: 143, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [155, 215], avg: [0.300, 0.360], hr: [24, 38], rbi: [90, 125], obp: [0.370, 0.430] },
    MLB:  { g: 162, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [175, 240], avg: [0.300, 0.360], hr: [27, 43], rbi: [100, 140], obp: [0.370, 0.430] }
  };
  const th = TH[bucket] || TH.CPBL;

  /* 1. オールスター入選：隨成績 (d値) 動作態提升確率。 */
  { const d=st.d;
    let asP=clamp(28+d*7,3,92);
    if(bucket==='CPBL'&&S.orgTeamId==='CPBL_TAICHUNG_MAMMOTHS')asP=clamp(asP+30,3,97); /* 人気球団補正。 */
    if(chance(asP)){ S.stats[bucket].AS++;
      h.push(`${y} ${lgN}オールスターゲーム`+((bucket==='CPBL'&&S.orgTeamId==='CPBL_TAICHUNG_MAMMOTHS'&&d<2)?'(ファン投票選出)':'')); } }

  /* 2. 新人王：に応じて d 値成長確率。 */
  const rookieOK=bucket!=='CPBL'||!(S.stats.NPB||S.stats.MLB||S.stats.MINOR);
  if(S.stats[bucket].yr===1&&rookieOK&&st.d>=4){
    const rkP = clamp(30 + (st.d - 4) * 15, 30, 95);
    if(chance(rkP)) h.push(`${y} ${lgN}新人王`);
  }

  /* 3. 投手個人タイトル。 */
  if(S.pos==='P'){
    const aw='最優秀投手賞';
    if(isSP() && st.era <= th.era[0] && st.IP >= th.g){ 
      const god = st.era <= th.era[1] && st.IP >= 150;
      const p = god ? 100 : clamp(30 + Math.round((th.era[0] - st.era) * 35 + (st.IP - th.g) * 0.4), 30, 95);
      if(chance(p)) h.push(`${y} ${lgN}${aw}`);
    }
    if(S.role==='CL' && st.SV >= th.sv[0]){
      const god = st.SV >= th.sv[1];
      const p = god ? 100 : clamp(28 + (st.SV - th.sv[0]) * 5, 28, 95);
      if(chance(p)) h.push(`${y} ${lgN}最多セーブ`);
    }
    if(S.role==='MR' && (st.HLD||0) >= th.hld[0]){
      const god = (st.HLD||0) >= th.hld[1];
      const p = god ? 100 : clamp(28 + ((st.HLD||0) - th.hld[0]) * 4, 28, 95);
      if(chance(p)) h.push(`${y} ${lgN}最優秀中継ぎ`);
    }
    if(st.SO >= th.so[0]){
      const god = st.SO >= th.so[1];
      const p = god ? 100 : clamp(25 + Math.round((st.SO - th.so[0]) * 1.2), 25, 95);
      if(chance(p)) h.push(`${y} ${lgN}最多奪三振`);
    }
  }
  /* 4. 野手個人タイトル。 */
  else{
    if(st.PA >= 350 && st.avg >= th.avg[0]){
      const god = st.avg >= th.avg[1];
      const p = god ? 100 : clamp(25 + Math.floor((st.avg - th.avg[0]) / 0.005) * 6, 25, 95);
      if(chance(p)) h.push(`${y} ${lgN}首位打者`);
    }
    if(st.PA >= 300 && st.HR >= th.hr[0]){
      const god = st.HR >= th.hr[1];
      const p = god ? 100 : clamp(25 + (st.HR - th.hr[0]) * 5, 25, 95);
      if(chance(p)) h.push(`${y} ${lgN}本塁打王`);
    }
    if(st.PA >= 300 && st.SB >= 25){ // SB不隨試合数放大、全リーグ標準一致。
      const god = st.SB >= 45;
      const p = god ? 100 : clamp(25 + (st.SB - 25) * 4, 25, 95);
      if(chance(p)) h.push(`${y} ${lgN}盗塁王`);
    }
    if(st.PA >= 300 && st.RBI >= th.rbi[0]){
      const god = st.RBI >= th.rbi[1];
      const p = god ? 100 : clamp(25 + (st.RBI - th.rbi[0]) * 2, 25, 95);
      if(chance(p)) h.push(`${y} ${lgN}打点王`);
    }
    const obp = st.PA > 0 ? (st.H + st.BB) / st.PA : 0;
    if(st.PA >= 350 && obp >= th.obp[0]){
      const god = obp >= th.obp[1];
      const p = god ? 100 : clamp(25 + Math.floor((obp - th.obp[0]) / 0.005) * 5, 25, 95);
      if(chance(p)) h.push(`${y} ${lgN}最高出塁率`);
    }
    const def1 = st.DEF || 0;
    if(S.dpos !== 'DH' && S.seasonFactor >= 0.7){
      if(def1 >= 6){
        const pGlove = clamp(38 + (def1 - 6) * 5, 38, 95);
        if(chance(pGlove)) h.push(`${y} ${lgN}ゴールデングラブ賞`);
      }
      if(def1 >= 11){
        const pDef = clamp(30 + (def1 - 11) * 6, 30, 95);
        if(chance(pDef)) h.push(`${y} ${lgN}年間最優秀守備選手`);
      }
    }
  }

  /* 5. 年度 MVP（最大栄誉）。 */
  const mvpQual = S.pos==='P'
    ? (isSP() ? st.IP >= 120 : st.G >= 45)
    : st.PA >= LV[S.lv].g * 3.4;

  if(st.d >= 6 && mvpQual && S.seasonFactor >= 0.9){
    const god = st.d >= 15;
    const baseMult = (S.pos === 'P' && S.role !== 'SP') ? 5 : 12; 
    const pMVP = god ? 100 : clamp(baseMult + (st.d - 6) * 11, baseMult, 95);
    if(chance(pMVP)) h.push(`${y} ${lgN}年間MVP`);
  }

  /* 6. 後続の受賞で特性を発動作。 */
  const added=h.filter(x=>x.startsWith(String(y)));
  if(added.length){ card('gold','年間賞',added.map(x=>x.slice(5)).join('｜'));
    if(S.traits.yips){ removeTrait('yips','記憶喪失'); card('good','影から出てきて','大舞台に立って賞を受賞した瞬間、心のノイズは消えた――。<b class="hl">健忘症が治った</b>。'); }
    if(S.traits.glass&&!S.traits.phoenix){ const big=added.some(x=>/MVP|最佳投手|打擊王|全壘打王|新人王/.test(x));
      if(big){ S.traits.phoenix=true; removeTrait('glass','スペランカー');
        S.pool+=8;
        card('gold','隠し特性解放：復活','大けがを乗り越え、以前より強くなって帰ってきた――<b class="hl">スペランカーのペナルティを解除。故障率が通常に戻り、大量の能力ポイントを獲得</b>。'); } }
  }
}
function maybeIntl(done){
  const wbc=(S.year-2026)%4===0; let p12=(S.year-2028)%4===0;
  if(S.lv==='MLB')p12=false; /* MLB選手のみ打WBC、不打 12 強。 */
  if(S.stage!=='PRO'||(!wbc&&!p12)||ovr()<52||S.seasonFactor<0.5||S.rehab>0||S.skipMid){ done(); return; } /* 復健年/報銷年不徵召。 */
  const name=wbc?'ワールド・ベースボール・クラシック':'WBSCプレミア12';
  let forced=false,first=false;
  if(S.intlCompletedKeys===null){ S.intlCompletedKeys=S.year; forced=true; first=true; }
  else if(S.year-S.intlCompletedKeys<5) forced=true;
  if(forced){
    card('info','スポーツ局からの公式文書',first
      ?`「貴殿は代表選考資格を満たしたため、規定に基づき<b class="hl">強制招集</b>とする。本日から<b class="hl">5年間の招集管理対象</b>となり、期間中はすべての国際大会招集に応じ、理由を問わず辞退できない」――封を開け終える前に、球団が荷造りを済ませていた。`
      :`球団の派遣承認が下り、<b class="hl">日本代表招集</b>が正式決定。故障または本人辞退がない限り代表へ合流する。`);
  }
  const opts=[
    {t:forced?'招集に応じる（辞退不可）':'日本代表として出場する',main:true,s:'成績に応じて能力ポイント獲得｜来季故障率+10%',f:()=>{
      /* 代表チームの勝敗はチーム全体の強さで決め、人能力の影響は小さい。 */
      const b=clamp(Math.round((ovr()-52)*0.35),0,8), r=R()*100+b;
      const i=r>=96?0:r>=88?1:r>=79?2:r>=46?3:4;
      const rk=['優勝','準優勝','3位','決勝ラウンド敗退','予選敗退'][i], pts=[6,5,4,2,1][i];
      let gpts=pts; if(S.traits.intlace)gpts=Math.max(pts,2);
      S.pool+=gpts; S.injNext=S.traits.intlace?0:10; S.intlCount++;
      /* Team Taiwan(台湾代表への貢献)：国際大会出試合が5回を超える。 */
      if(!S.traits.taiwan&&S.intlCount>5){ S.traits.taiwan=true;
        card('gold','隠しタイトル：侍ジャパンの魂',`自分のキャリアより日の丸を背負う誇りを優先し続けた。胸の日の丸を指さすあの姿は、日本の野球ファンの記憶にずっと残る。`); board(1); }
      /* 累積国際大会人成績(1大会約 6-8 試合)、能力評価dで成績を決める。 */
      { const a=S.ab, par=52; const IS=S.intlStat;
        if(S.pos==='P'){ const dd=(a.vel+a.ctl+a.brk)/3-par;
          const ip=+(ri(4,9)+R()*3).toFixed(1); IS.IP=+(IS.IP+ip).toFixed(1);
          const k9=clamp(7.5+dd*0.12,4,14); IS.SO+=Math.round(ip/9*k9);
          const era=clamp(3.6-dd*0.16,0.8,8); IS.ER+=Math.round(era*ip/9);
          if(i<=2&&chance(45))IS.W++; if(!isSP()&&chance(30))IS.SV++;
          IS.G+=ri(1,3);
        } else { const dd=(a.con*0.5+a.pow*0.2+a.eye*0.18+a.spd*0.12)-par-0.5; /* 同步シーズン d 公式(含 pow)。 */
          const g=ri(5,8), pa=g*ri(3,4); IS.G+=g; IS.PA+=pa;
          const ab=Math.round(pa*0.86); IS.AB+=ab;
          const avg=clamp(0.270+dd*0.006,0.15,0.5); const h=Math.round(ab*avg); IS.H+=h;
          const hr=Math.round(h*clamp(0.06+Math.max(0,a.pow-par)*0.006,0.03,0.28)); IS.HR+=hr;
          IS.RBI+=Math.round(hr*2.1+h*0.35);
        }
      }
      if(i<=1)S.intlTop4=(S.intlTop4||0)+1; /* 決勝進出出時だけ数える。 */
      if(!S.traits.intlace&&S.intlCount>=3&&(S.intlTop4||0)>=2){ S.traits.intlace=true;
        card('gold','隠し特性解放：国際大会の鬼','代表ユニフォームに袖を通せば、痛みすら消える。大舞台でこそ燃える男だ。<b class="hl">国際大会による故障リスク上昇がなくなり、招集ごとに能力ポイント+2を確定で獲得</b>。'); }
      if(i<=2)S.honors.push(`${S.year} ${name}${rk}`);
      let ex=''; const mp=S.traits.clutch?2:1; if((i===0&&chance(30*mp))||(i===1&&chance(8*mp))){S.honors.push(`${S.year} ${name}MVP`);ex='<b class="hl">大会MVP</b>に選出！';}
      card(i<=1?'gold':'info',name,`日本代表の最終成績：<b class="hl">${rk}</b>。${ex}能力ポイントを<b class="hl">${gpts}</b>獲得。${S.traits.intlace?'国際大会の鬼、疲労？知らん。':'国際大会の激闘で、来季の故障リスクが上昇した。'}`);
      done(); }},
    ];
  if(!forced)opts.push({t:'コンディション調整を理由に辞退',s:'代表招集を辞退する',f:done});
  choose(`日本代表招集・${name}`,opts);
}
/* シーズン終了後。 */
function phaseEnd(){
  board(2);
  if(S.stage==='PRO'){
    let sal=Math.round(salaryFor(S.lv,S.lastD||0)*(S.ct?S.ct.mult:1)*dpMult()); if(S.seasonFactor===0)sal=Math.round(sal*0.5);
    S.careerEarnings+=sal;
    let extra='';
    if(LV[S.lv].top&&S.seasonFactor>0){
      const tp=LV[S.lv].top;
      const pc=clamp(({CPBL:15,NPB:8,MLB:3.5})[tp]+(S.lastD||0)*0.5,2,({CPBL:26,NPB:15,MLB:9})[tp]);
      let pcc=pc; if(S.traits.clutch)pcc*=1.25; /* 強心臓。 */
      if(S.tradeRefuse>0){ pcc*=0.75; } /* 否決交易：戰力略受影響(成本已降)。 */
      if(chance(pcc)){ const cN={CPBL:'台湾シリーズ優勝',NPB:'日本一',MLB:'ワールドシリーズチャンピオン'}[LV[S.lv].top];
        S.honors.push(`${S.year} ${cN}`); S.wonChamp=true; S.champThisTeam=true; S.champTeam=S.orgTeamId; extra=`<br>球隊奪下 <b class="hl">${cN}</b>，全城陷入瘋狂！`; } }
    if(S.tradeRefuse>0)S.tradeRefuse--;
    if(S.tradeHeat>0)S.tradeHeat=Math.max(0,S.tradeHeat-5);
    card('','シーズン終了処理',`現在年俸：<b class="hl">${fmtMoneyJPY(currentSalary)}</b>（生涯収入 ${fmtMoneyJPY(careerEarnings)}）${ct?`｜合約剩 ${Math.max(0,S.ct.yrs-1)} 年`:''}${extra}`);
    board(2);
  }
  const go=()=>movement();
  if(S.pool>0){ const p=S.pool; S.pool=0;
    choose('',[{t:`▸ 能力ポイントを振り分ける（${p}ポイント・大会／国際大会の成果）`,main:true,f:()=>allocUI({pool:p},'シーズン終了時の能力ポイント配分（大会／国際大会の成果）',go)}]); }
  else go();
}
let applyPromotionSalary=()=>{};
let applyDemotionSalary=()=>{};
let markClubInitiatedRenewal=()=>{};
let salaryDForContract=d=>d;
let recordSalaryEvaluation=()=>{};
let recordIndependentSalaryEvaluation=()=>{};
let appendContractExtension=()=>{};
/* 升降格と去向。 */
function movement(){
  const o=ovr();
  if(S.stage==='HS'){ if(S.stageYr<3)advance(); else pathChoiceHS(); return; }
  if(S.stage==='U'){ if(S.stageYr<4)advance(); else pathChoiceU4(); return; }
  if((S.stage==='CORP'||S.stage==='IND')){
    if(S.age>=26){ endGame('何年もドラフト指名を逃し、'+S.year+' 年末に現役を引退し、地域の野球指導者へ転身した。'); return; }
    choose('アマチュアシーズン終了',[
      {t:'NPBドラフトへ再挑戦',main:true,f:()=>runDraft(false,()=>advance())},
      {t:'現役引退',warn:true,f:()=>endGame('アマチュア球界での現役生活に区切りをつけた。')}]);
    return;
  }
  /* プロ。 */
  if(isBelowActiveMinimum(o)){
    retireBelowActiveMinimum();
    return;
  }
  if(S.skipMid){if(contractNeedsRenewal(S.ct))markClubInitiatedRenewal(1);advance();return;} /* リハビリ全休年も満了契約の来季更新を飛ばさない。 */
  if(S.org==='NPB')S.npbYears++;
  if(LV[S.lv].top){ /* 轉換リーグ：直接解除球団 5 年控制期制限、往後のみ要契約満了就是自由球員。 */
    if(S.svcOrg && S.svcOrg!==S.org){ S.faElig=true; }
    S.svcOrg=S.org;
    S.svc=(S.svc||0)+1; if(S.svc>=5)S.faElig=true;
  }
  /* 神主牌：同一球団での連続在籍年数(移籍でリセット、見 doTrade/signTo)。 */
  if(S.stage==='PRO'&&LV[S.lv].top){ S.teamYears=(S.teamYears||0)+1;
    if(!S.traits.goldcloth&&S.orgTeamId==='CPBL_TAICHUNG_MAMMOTHS'&&(S.teamTally.CPBL&&S.teamTally.CPBL['CPBL_TAICHUNG_MAMMOTHS']>=10)){ S.traits.goldcloth=true;
      card('gold','隠し属性解放：ゴールデングラブ常連','台中マンモス一筋10年。あなたは球団の象徴となった。黄金のユニフォームを着た姿は、本拠地のファンにとって信仰そのものだ。'); board(1); }
    if(!S.traits.franchise&&S.teamYears>=7&&S.champThisTeam&&S.champTeam===S.orgTeamId){ S.traits.franchise=true;
      card('gold','隠し属性解放：神カード','この街のファンはあなたの成長を見守ってきた。放出すれば本拠地が炎上することをフロントも分かっている――<b class="hl">所属球団との再契約は年俸係数を1.2倍以上に固定し、引退評価にも加点</b>。'); }
    /* ◯◯先生：同じ支球団效力滿 15 年且成績安定。 */
    if(!S.traits.mrteam&&S.teamYears>=15&&(S.lastD||0)>=0){ S.traits.mrteam=true; S.mrTeamName=S.orgTeamId;
      const nick=teamNick(S.orgTeamId);
      card('gold','隠しタイトル:'+nick+'ミスター',`15年間、同じユニフォーム。ファンは名前ではなく「<b class="hl">ミスター${nick}</b>」と呼ぶ――あなたこそ、この球団の代名詞だ。`); board(1); }
    /* ◯◯七彩球衣：同じリーグキャリア效力球団数超標(CPBL>3、NPB>5、MLB>5)。 */
    if(!S.traits.rainbow){
      const RB={CPBL:['台湾プロ野球',3],NPB:['NPB',5],MLB:['メジャーリーグ',5]};
      for(const lg in RB){
        const n=Object.keys((S.teamTally&&S.teamTally[lg])||{}).length;
        if(n>RB[lg][1]){ S.traits.rainbow=true; S.rainbowLg=RB[lg][0];
          card('info','隠しタイトル:'+RB[lg][0]+'ジャーニーマン',`クローゼットには${n}着の異なるユニフォーム――${RB[lg][0]}の球団をほぼ一巡した。ファンからは「<b class="hl">ジャーニーマン</b>」と呼ばれる。どこでも生き残れるのも立派な能力だ。`); board(1); break; }
      }
    } }
  const path=PATHS[S.org], idx=path.indexOf(S.lv);
  let minReq=LV[S.lv].min;
  if(S.org==='NPB'&&S.npbYears>=8){ minReq-=4; }
  const perf=(S.seasonFactor>=0.5)?(S.lastD||0):null; /* 傷缺季不確認成績。 */
  /* 受賞による降格保護：当該シーズンに個人タイトルを獲得(MVP/王/最優秀投手、オールスターを除く)→降格・戦力外にしない。 */
  const wonAward = S.honors.some(x=>x.startsWith(String(S.year))&&/王|MVP|賽揚|澤村|最佳投手|金手套/.test(x)&&!/明星賽/.test(x));
  /* Fix C：実成績による降格保護。当該シーズンの実成績を使い、能力評価dは参照しない、好成績なら降格させない。 */
  let goodReal=false;
  { const st=S.lastSt;
    if(st&&S.seasonFactor>=0.5){
      if(S.pos==='P'){
        const era=st.IP>0?st.ER*9/st.IP:99, whip=st.IP>0?(st.H+st.BB)/st.IP:99;
        /* 投手：ERA または WHIP 達リーグ一線水準、または有一定セーブ/セットアッパー產能。 */
        if(era<=4.20||whip<=1.35||(st.SV||0)>=15||(st.HLD||0)>=15)goodReal=true;
      }else{
        const obp=st.PA>0?(st.H+st.BB)/st.PA:0, slg=slgOf(st), ops=obp+slg;
        /* 野手：OPS がリーグのレギュラー水準へ到達(.720+)、または二桁本塁打・盗塁などの実績。 */
        if(ops>=0.720||st.HR>=12||st.SB>=15||st.RBI>=(LV[S.lv].g>=150?70:55))goodReal=true;
      }
    }
  }
  if(wonAward||goodReal){ /* 受賞 または 実成績が基準到達 → 球団放出しない。 */ }
  else if(o<minReq){
    if(perf!==null&&perf>=0){ /* 帳面成績十分好、球団継続留觀察。 */
      card('info','ペレットの評価',`体力測定は危険水域。それでも<b class="hl">結果</b>で黙らせた――今季はリーグ水準の成績を残し、球団は現レベルで様子を見ることにした。`);
    }else{ handleDemotion(o,path,idx); return; }
  }else if(perf!==null&&perf<=-6&&chance(55)){ /* 能力が残っていても成績が急落、降格対象。 */
    card('bad','ペレットの評価','数字はリーグ水準を大きく下回り、首脳陣の我慢も限界に達した。');
    handleDemotion(o,path,idx); return;
  }
  /* 昇格(圧倒的成績なら2段階昇格可能)。 */
  if(idx<path.length-1){ const nx=path[idx+1];
    if(o>=LV[nx].min&&((S.lastD||0)>=0||chance(50))){
      let to=nx;
      if(idx<path.length-2){ const nx2=path[idx+2];
        if(o>=LV[nx2].min+2&&(S.lastD||0)>=4)to=nx2; }
      const fromLv=S.lv;
      S.lv=to; applyPromotionSalary(fromLv,to); card('good','アップグレードの通知',`活躍が評価され、${to!==nx?'<b class="hl">二段階昇格</b>':'昇格'}！ 新天地は<b class="hl">${LV[to].n}</b>。`); board(2);
      if(S.traits.yips){ removeTrait('yips','記憶喪失'); card('good','影から出てきて','前の段階に戻って、ようやく自分のリズムを掴んだ——<b class="hl">健忘症が治った</b>。'); } } }
  if(!S.ct)throw new Error('PRO_PLAYER_WITHOUT_CONTRACT');
  /* 所属球団との延長交渉は複数年契約の残り2年時点、または最終契約の残り1年で行う。 */
  if(S.ct.remainingYears===1&&LV[S.lv].top&&!S.ct.extOffered&&S.faElig&&(S.lastD||0)>=1&&chance(45)){
    S.ct.extOffered=true; extensionOffer(o); return;
  }
  if(S.ct.remainingYears<=0){
    if(LV[S.lv].top){
      if(S.faElig){ faFlow(o); return; }
      /* プロ5年目までは球団が保有権を行使して短期更新し、年俸は所属階級の基準額を下回らない。 */
      const renewalYears=1;S.ct=null;markClubInitiatedRenewal(renewalYears);
      card('info','チーム契約更新',`まだ球団保有期間（在籍${S.svc}/5年）。球団が契約更新権を行使し、<b class="hl">${renewalYears}年</b>契約を提示。年俸は所属レベル基準となる。`); board(1);
    } else { const renewalYears=1;S.ct=null;markClubInitiatedRenewal(renewalYears); } /* トップ階級以外。 */
  }
  crossOffers(o);
}
function buyoutRemaining(rate){ /* 残契約の支払いは選手都合の解除で70%、球団都合なら100%。 */
  rate=rate||0.7;
  if(!S.ct||(!LV[S.lv].top&&rate<1))return 0; /* 球団都合の解除は下位階級でも保証する。 */
  const result=calculateScheduledBuyout(S.ct,rate);
  if(result.buyoutAmount>0){
    S.careerBuyout=(S.careerBuyout||0)+result.buyoutAmount;
    S.careerEarnings+=result.buyoutAmount;
    card('gold',rate>=1?'契約金全額支払い':'契約買い取り',`契約残年数：<b class="hl">${result.unpaidSchedule.length}年</b><br>残契約総額：<b class="hl">${fmtMoney(result.remainingValue)}</b><br>買い取り率：<b class="hl">${Math.round(rate*100)}%</b><br>買い取り支払額：<b class="hl">${fmtMoney(result.buyoutAmount)}</b>`);
  }
  S.ct=null;
  S.currentSalary=0;
  return result.buyoutAmount;
}
/* 引退時にCPBLへ戻っていなければ、台北ドームで始球式の送別イベントを追加。 */
function daibaFarewell(cont){
  const cp=S.stats&&S.stats.CPBL,playedCPBL=!!(cp&&cp.yr>0);
  if(S.stage==='PRO'&&playedCPBL&&S.org!=='CPBL'&&!S._daiba){ S._daiba=true;
    card('gold','最後の一球',`本拠地でプレーする夢はかなわなかったが、招待を受けて<b class="hl">台北ドーム</b>へ戻り、一日台湾プロ野球選手となった。始球式、4万人が見守る中でキャリア最後の一球を投げる――勝敗のためではない。かつて土のグラウンドで夢を見た自分のために。`);
  }
  cont();
}
function handleDemotion(o,path,idx){
  if((S.lv==='CPBL1'||S.lv==='NPB1'||S.lv==='MLB')&&(S.lastD||0)<=-6&&!S.traits.yips&&S.seasonFactor>=0.5){
    traitCard('yips','記憶喪失',`もちろん体に怪我はなかったが、フィールドに立った瞬間、脳裏に昨シーズンの敗戦のイメージがあふれた――。<b class="dn">システム評価は一時的に-3となり、再度アップグレードするか年間賞を受賞するまでは解除できません。</b>。`,'bad'); }
  const targetLevel=findDemotionTarget(path,idx,o,LV);
  const acceptText=demotionChoiceText(targetLevel,LV);
  const doDemote=()=>{
    /* 同じ組織内で条件を満たす階級を探す。 */
    if(targetLevel){
      /* 海外組織で降格時、アジア球団も同時にオファー。 */
      const alts=[];
      if(S.org==='MiLB'){
        if(o>=LV.NPB1.min&&chance(Math.round(60*ageGateJP())))alts.push({t:'NPB一軍への転職',s:'NPB移籍契約',f:()=>{buyoutRemaining();signTo('NPB','NPB1');advance();}});
        else if(o>=LV.NPB2.min&&chance(50))alts.push({t:'日本の二軍（支配下）へ移籍',f:()=>{buyoutRemaining();signTo('NPB','NPB2');advance();}});
      }else if(S.org==='NPB'&&o>=LV.CPBL1.min&&chance(70)){
        alts.push({t:'台湾プロ野球からのオファーを受ける',s:'台湾プロ野球一軍契約',f:()=>{buyoutRemaining();signTo('CPBL','CPBL1');advance();}});
      }
      if(alts.length){
        card('bad','降格通告',`成績が基準に届かず、球団は<b class="dn">${LV[targetLevel].n}</b>への降格を通告。しかし同時に、他リーグからオファーが届いた。`);
        choose('降格を受け入れるか、新天地を選ぶか？',[
          {t:LV[targetLevel].n+'への降格を受け入れる',main:true,f:()=>{const fromLv=S.lv;S.lv=targetLevel;applyDemotionSalary(fromLv,targetLevel);board(2);advance();}},...alts]);
      }else{ const fromLv=S.lv;S.lv=targetLevel;applyDemotionSalary(fromLv,targetLevel);card('bad','降格通告',`成績が基準に届かず、<b class="dn">${LV[targetLevel].n}</b>への降格が決まった。`); board(2); advance(); }
    }
    else outOfOrg(o);
  };
  const longContract = S.ct && S.ct.remainingYears>1 && LV[S.lv].top;
  if(longContract){
    choose('球団面談：成績が現レベルの基準に届かず、降格させる方針だという',[
      {t:acceptText,main:true,f:doDemote},
      {t:'長期契約の条項を盾に降格を拒否する',warn:true,s:'「ロッカールームの癌」が発動。翌年に結果を出せば返上、出せなければ悪評がさらに悪化',f:()=>{
        S.demotionRefused=true;
        if(!S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace){ S.traits.cancer=true;
          card('bad','隠し特性解放：ロッカールームの癌','契約条項を持ち出して降格を拒否。首脳陣は呆れ、仲間も陰でざわつく――居場所は守ったが、ロッカールームの信頼を失った。'); }
        else card('info','降格を拒否する','契約条項を盾に一軍残留を勝ち取った。球団はこの一件を忘れない。');
        board(1); advance(); }},
      {t:'このまま現役を引退する',warn:true,s:'現役として名誉ある引退をする',f:()=>{buyoutRemaining();daibaFarewell(()=>endGame('降格を受け入れず、'+S.year+' 年に引退を発表。'));}}]);
  } else if(S.age>=33){
    choose('球団面談：成績が現レベルの最低基準にも届いていない',[
      {t:acceptText,f:doDemote},
      {t:'引退を選択する',warn:true,s:'現役として名誉ある引退をする',f:()=>{buyoutRemaining();daibaFarewell(()=>endGame('下位リーグへの降格を拒み、'+S.year+' 年に引退を発表。'));}}]);
  } else doDemote();
}
function retireBelowActiveMinimum(){
  card('bad','現役続行を断念','総合力が現役続行の最低基準を下回ったため、ユニフォームを脱ぐことを決断した。');
  endGame(`総合力が現役続行の最低基準を下回り、${S.year}年に現役を引退した。`);
}
function outOfOrg(o){
  if(isBelowActiveMinimum(o)){ retireBelowActiveMinimum(); return; }
  /* 元リーグで戦力外となった後、同等階級の契約を探す。 */
  const offers=[];
  if(S.org!=='NPB'&&o>=44)offers.push({t:'日本二軍（支配下）契約',f:()=>{buyoutRemaining(1);signTo('NPB','NPB2');}});
  if(S.org!=='CPBL'){ if(o>=41)offers.push({t:'台湾プロ野球一軍契約',f:()=>{buyoutRemaining(1);signTo('CPBL','CPBL1');}});
    else if(o>=30)offers.push({t:'台湾プロ野球二軍契約',f:()=>{buyoutRemaining(1);signTo('CPBL','CPBL2');}}); }
  if(!offers.length){ buyoutRemaining(1); daibaFarewell(()=>endGame('球団から自由契約となり、獲得球団も現れず、'+S.year+' 年、ひっそりと現役を退いた。')); return; }
  card('bad','戦力外通告',`${S.org==='NPB'?'NPB':'所属リーグ'}の契約更新基準に届かず自由契約に。ただし、別球団からオファーが届いた――`);
  if(S.age>=33){ offers.push({t:'このまま現役を引退する',warn:true,f:()=>{buyoutRemaining(1);daibaFarewell(()=>endGame('戦力外通告を受けて、'+S.year+' 年、現役引退を選んだ。'));}}); }
  choose('新天地からのオファー',offers.map(x=>({...x,f:()=>{x.f();advance();}})));
}
function teamListOf(org){ return org==='CPBL'?CPBL_TEAMS:org==='NPB'?NPB_TEAMS:MLB_TEAMS; }
function signTo(org,lv,team,yrs,mult){
  S.org=org; S.lv=lv;
  /* 【修正】先に移籍先球団を決定、球団が変わる場合だけ在籍年数をリセット、最後に更新 S.orgTeamId。 */
  const newTeam = team || pick(teamListOf(org));
  if(newTeam !== S.orgTeamId){ S.teamYears=0; S.champThisTeam=false; S.champTeam=null; }
  S.orgTeamId = newTeam;
  S.ct={yrs:yrs||2,mult:mult||1};
  if(org!=='NPB')S.npbYears=0;
  card('info','契約成立',`<b class="hl">${S.teamName()}</b>と<b class="hl">${S.ct.yrs}年契約</b>を結んだ${S.ct.mult!==1?`（年俸係数 ×${S.ct.mult.toFixed(2)}）`:''}。`); board(2);
}
/* 複数球団のオファー選択：opts=[{team、bonus、yrs、mult、lv}]。 */
function pickOfferUI(title,org,offers,after){
  choose(title,offers.map(of=>({
    t:of.team+(of.lv?`（${LV[of.lv].n}）`:''),
    s:`契約金 ${fmtMoney(of.bonus)}｜${of.yrs}年契約${of.mult&&of.mult!==1?`｜年俸係数 ×${of.mult.toFixed(2)}`:''}`,
    f:()=>{ S.careerEarnings+=of.bonus;
      signTo(org,of.lv||S.lv,of.team,of.yrs,of.mult||1);
      card('gold','契約金',`契約金<b class="hl">${fmtMoney(of.bonus)}</b>を受け取った。`); after(); }
  })));
}
function makeOffers(org,n,bonusBase,yrsLo,yrsHi,lv,exclude){
  const list=teamListOf(org).filter(t=>t!==exclude);
  const teams=[]; const pool=list.slice();
  for(let i=0;i<n&&pool.length;i++)teams.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  return teams.map(t=>({team:t,bonus:Math.round(bonusBase*(0.8+R()*0.5)),yrs:ri(yrsLo,yrsHi),lv,mult:1}));
}
/* 長期契約/短期契約 選択処理。 */
function termParams(d,lv){ /* 長期契約 >2 年、短期契約 1-2 年;年齢大または成績爛 → 不十分格長期契約。 */
  const cap=S.pos==='P'?7:15;
  const maxY=faYears(d,cap);              /* 已含年齢上限。 */
  const longEligible = maxY>2 && d>=0;    /* 値得長期契約：年限>2 且成績不差(d>=0)。 */
  const longY=Math.max(3,maxY);           /* 長期契約最低 3 年。 */
  const shortY=Math.min(2,Math.max(1,maxY)); /* 短期契約 1-2 年。 */
  let baseM=d>=3?1.2:d>=0?1:0.8;
  if(S.traits.franchise)baseM=Math.max(baseM,1.2);
  if(S.tradeRefuse>0)baseM*=0.85;
  return {longEligible,longY,shortY,longM:+(baseM*0.92).toFixed(2),shortM:+(baseM*1.12).toFixed(2)};
}
function termChoice(o,d,baseTitle,onPick,onReject){
  const tp=termParams(d,S.lv);
  const est=(y,m)=>fmtMoney(Math.round(salaryFor(S.lv,salaryDForContract(d))*m));
  const opts=[];
  if(tp.longEligible){ /* 条件到達時だけ長期契約選項。 */
    opts.push({t:`長期契約（${tp.longY}年）`,main:true,s:`長期・年俸係数はやや低め×${tp.longM}（推定${est(tp.longY,tp.longM)}/年）｜安定を優先`,
      f:()=>onPick(tp.longY,tp.longM)});
    opts.push({t:`短期契約（${tp.shortY}年）`,warn:true,s:`短期・年俸係数は高め×${tp.shortM}（推定${est(tp.shortY,tp.shortM)}/年）｜次回契約で勝負`,
      f:()=>onPick(tp.shortY,tp.shortM)});
  } else { /* 年齢大または成績不振：短期契約のみ(長期契約は提示しない)。 */
    opts.push({t:`短期契約（${tp.shortY}年）`,main:true,s:`短期契約・年俸係数×${tp.shortM}（推定${est(tp.shortY,tp.shortM)}/年）｜現在の年齢と成績では短期契約のみ提示`,
      f:()=>onPick(tp.shortY,tp.shortM)});
  }
  if(onReject)opts.push({t:'拒否する、現状維持',s:'この契約を受け入れないでください',f:onReject});
  choose(baseTitle,opts);
}
/* 母球団延長契約更新：契約満了前に囲い込む。 */
function extensionOffer(o){
  const d=S.lastD||0;
  termChoice(o,d,`親チームが事前に契約を延長した・${S.teamName()}(契約残り1年)`,(y,m)=>{
    appendContractExtension(y,m);
    card('gold','契約更新を延長する',`そして<b class="hl">${S.teamName()}</b>延長合意に達し、追加した<b class="hl">${y}年</b>(年俸係数×${m.toFixed(2)}）。`); board(1);
    crossOffers(o);
  }, ()=>{ /* 拒決して延長：維持原契約繼継続跑。 */
    card('info','延長を断る',`あなたは親チームからの早期延長を拒否し、既存の契約を終了することを選択しました。`);
    crossOffers(o);
  });
}
/* FA 自由球員。 */
function faFlow(o){
  const d=S.lastD||0;
  const cap=S.pos==='P'?7:15; /* 投手上限7、野手上限15。 */
  let stayY=faYears(d,cap);
  let stayM=d>=3?1.2:d>=0?1:0.8;
  const injHist=(S.bigInj||0)+(S.tjCount||0);
  if(injHist>=2&&stayY<=3)stayM+=0.15; /* 故障史多但短期契約：補高薪。 */
  if(S.traits.franchise)stayM=Math.max(stayM,1.2); /* フランチャイズプレーヤー。 */
  if(S.tradeRefuse>0)stayM*=0.85; /* 否決交易：下約 -15%(成本已降)。 */
  if(S.traits.cancer){ stayM=Math.min(stayM,0.95); /* 毒瘤：契約更新惡化。 */
    if(!S.traits.franchise&&chance(45)){
      card('bad','ペレットの冷間処理','手球クラブは更新するつもりがないことを明らかにしました - あなたのニュースは結果よりもよく知られています。');
      faMarket(o,d); return; } }
  const faOpts=[
    {t:`${S.teamName()}と契約更改`,main:true,s:'続けて長期契約／短期契約を選択',
     f:()=>termChoice(o,d,`${S.teamName()}と契約更改・契約タイプを選択`,(y,m)=>{
       signTo(S.org,S.lv,S.orgTeamId,y,m,'RENEWAL',{contractType:'NORMAL'});
       card('info','契約更改',`<b class="hl">${S.teamName()}</b>と<b class="hl">${y}年</b>契約で更改（年俸係数×${m.toFixed(2)}）。`); advance(); })},
    {t:'FA宣言して市場の評価を確かめる',warn:true,s:'成績次第ではオファー0件、元球団へ減俸で戻る可能性あり',f:()=>faMarket(o,d)}];
  /* 5a 海外移籍球員契約満了：台湾へ戻りCPBLへ加入する選択肢を追加(落葉戻す根)。 */
  if(['MLB','MiLB','KBO','CPBL'].includes(S.org)&&o>=LV.NPB2.min){
    faOpts.push({t:'日本球界へ戻る',s:'故郷へ戻り、NPB球団からのオファーを受ける',
      f:()=>{ signTo('NPB',o>=LV.NPB1.min?'NPB1':'NPB2'); card('good','日本球界復帰',`海外挑戦を終え、<b class="hl">${S.teamName()}</b>へ復帰。故郷のファンの前で再びプレーする道を選んだ。`); advance(); }});
  }
  choose(`契約満了・FA権取得（所属球団の優勝確率 ${teamChampRate(S.orgTeamId)}%）`,faOpts);
}
function faMarket(o,d){
  const org=S.org, lv=S.lv, offers=[];
  let n=d>=3?ri(2,4):d>=1?ri(1,3):d>=-1?(chance(60)?ri(1,2):0):(chance(30)?1:0);
  if(S.traits.cancer)n=Math.max(0,n-1); /* 毒瘤：オファー減少。 */
  const cap=S.pos==='P'?7:15;
  makeOffers(org,n,({CPBL1:200,NPB1:800,MLB:2000})[lv]||100,1,cap,lv,S.orgTeamId)
    .forEach(of=>{of.yrs=faYears(d,cap); of.mult=+(1+Math.max(0,d)*0.05+R()*0.12).toFixed(2);
      if(((S.bigInj||0)+(S.tjCount||0))>=2&&of.yrs<=3)of.mult+=0.15; offers.push({...of,org});});
  if(lv==='CPBL1'&&o>=53)makeOffers('NPB',1,1000,2,3,o>=51?'NPB1':'NPB2',null)
    .forEach(of=>offers.push({...of,org:'NPB',mult:1}));
  if(lv==='NPB1'&&o>=60){
    /* 在籍7年到達 → 海外 FA(ポスティング不要、直接MLBへ移籍);未到達ならポスティング(年齢条件あり)。 */
    const freeAgent=(S.npbYears||0)>=7;
    if(freeAgent || chance(Math.round(50*ageGateUSA(o,60)))){
      makeOffers('MiLB', freeAgent?ri(1,2):1, 3000, 3,5,'MLB',null)
        .forEach(of=>offers.push({...of,org:'MiLB',mult:1,posting:!freeAgent})); /* posting=true 表示走入札。 */
    }
  }
  if(!offers.length){
    card('bad','FA市場',`電話は鳴らない。代理人は肩をすくめた――市場の評価は想像以上に冷え切っている。`);
    choose('どのチームもオファーを出さなかった',[
      {t:`${S.teamName()}へ減俸で戻る`,main:true,s:'1年｜年俸係数×0.70',
       f:()=>{ S.ct={yrs:1,mult:0.7}; card('bad','減俸契約',`頭を下げて<b class="hl">${S.teamName()}</b>へ戻った。年俸は3割減。`); advance(); }},
      {t:'このまま現役を引退する',warn:true,f:()=>endGame('FA市場でオファーがなく、'+S.year+' 年、ひっそりと現役を退いた。')}]);
    return;
  }
  const est=of=>fmtMoney(Math.round(salaryFor(of.lv,d)*(of.mult||1)));
  const estL=(of)=>{ const tp=termParams(d,of.lv); return tp.longEligible?`長期${tp.longY}年×${(tp.longM*(of.mult||1)).toFixed(2)}／短期${tp.shortY}年×${(tp.shortM*(of.mult||1)).toFixed(2)}`:`短期契約のみ${tp.shortY}年×${(tp.shortM*(of.mult||1)).toFixed(2)}`; };
  const cty=og=>({CPBL:'🇹🇼台湾',NPB:'🇯🇵日本',MiLB:'🇺🇸 米国',MLB:'🇺🇸 米国'})[og]||'';
  const ctyOrder={CPBL:0,NPB:1,MiLB:2,MLB:2};
  offers.sort((a,b)=>(ctyOrder[a.org]??9)-(ctyOrder[b.org]??9)); /* に応じて國家排序：台→日→美。 */
  choose('FA市場オファー一覧（国別・各球団の長期／短期契約を表示）',[...offers.map(of=>({
    t:`${cty(of.org)}｜${of.team}（${LV[of.lv].n}）`,
    s:`契約金 ${fmtMoney(of.bonus)}｜優勝確率${teamChampRate(of.team)}%｜長期／短期：${estL(of)}${of.posting?'｜ポスティング':''}`,
    f:()=>{ S.careerEarnings+=of.bonus; const savedLv=S.lv; S.lv=of.lv;
      termChoice(o,d,`${of.team}・契約タイプの選択`,(y,m)=>{ S.lv=savedLv;
        signTo(of.org,of.lv,of.team,y,+(m*(of.mult||1)).toFixed(2)); advance(); },
        ()=>{ S.lv=savedLv; S.careerEarnings-=of.bonus; faMarket(o,d); }); }})),
    {t:`元球団（${S.teamName()}）と1年契約`,s:'年俸係数×0.90',
     f:()=>{ S.ct={yrs:1,mult:0.9}; card('info','戻る',`戻る<b class="hl">${S.teamName()}</b>。`); advance(); }}]);
}
function ageGateUSA(o,minReq){ /* MLB挑戦：年齢とともに難化、28 歳以降はほぼ不可能。 */
  const age=S.age;
  if(age<=22)return 1.0;
  if(age<=24)return 0.75;
  if(age<=26)return 0.5;
  if(age<=27)return 0.3;
  if(age<=28)return 0.15;
  /* 28 歳以降：能力が基準を大幅に超える（+5）の怪物級即戦力だけにわずかな可能性。 */
  return o>=minReq+5 ? 0.08 : 0;
}
function ageGateJP(){ /* NPB挑戦：年齢条件は緩め、31 歳（衰え前）まで可能性あり。 */
  const age=S.age;
  if(age<=26)return 1.0;
  if(age<=28)return 0.7;
  if(age<=30)return 0.45;
  if(age<=31)return 0.25;
  return 0; /* 32 歳からは対象外。 */
}
function crossOffers(o){
  const fin=()=>advance();
  if(S.lv==='CPBL1'&&o>=53&&(S.lastD||0)>=1&&chance(Math.round(35*ageGateJP()))){
    const jl=o>=51?'NPB1':'NPB2';
    const bids=makeOffers('NPB',2,1200,2,3,jl,null);
    choose('NPB球団から海外移籍オファー',[...bids.map(of=>({
      t:of.team+`（${LV[jl].n}）`,s:`契約金 ${fmtMoney(of.bonus)}｜${of.yrs}年契約`,
      f:()=>{S.careerEarnings+=of.bonus;signTo('NPB',jl,of.team,of.yrs,1);fin();}})),
      {t:'台湾プロ野球に残る',main:true,f:fin}]); return; }
  if(S.lv==='CPBL1'&&o>=57&&(S.lastD||0)>=2&&chance(Math.round(30*ageGateUSA(o,57)))){
    const ml=o>=60?'MLB':'A3';
    const bids=makeOffers('MiLB',2,2000,2,4,ml,null);
    choose('メジャーリーグのスカウトが契約を引き渡す',[...bids.map(of=>({
      t:of.team+`（${LV[ml].n}）`,s:`契約金 ${fmtMoney(of.bonus)}｜${of.yrs}年契約`,
      f:()=>{S.careerEarnings+=of.bonus;signTo('MiLB',ml,of.team,of.yrs,1);fin();}})),
      {t:'台湾プロ野球に残る',main:true,f:fin}]); return; }
  if(S.lv==='NPB1'&&o>=60&&(S.lastD||0)>=2&&chance(Math.round(30*ageGateUSA(o,60)))){
    const bids=makeOffers('MiLB',ri(2,3),Math.round(3000+(S.lastD||0)*800),3,6,'MLB',null);
    choose('契約システム: 複数のメジャーリーグチームがあなたの契約に入札します。',[...bids.map(of=>({
      t:of.team,s:`ポスティング総額 ${fmtMoney(of.bonus*4)}｜契約金 ${fmtMoney(of.bonus)}｜${of.yrs}年契約`,
      f:()=>{ S.careerEarnings+=of.bonus; signTo('MiLB','MLB',of.team,of.yrs,1); fin(); }})),
      {t:'日本に滞在',main:true,f:fin}]); return; }
  fin();
}
/* ドラフトとキャリア路口。 */
function runDraft(fromSchool,cb){
  const o=ovr(); const score=o+Math.max(0,22-S.age)*2+ri(-4,4);
  const rd=score>=56?1:score>=49?2:score>=43?ri(3,4):score>=37?ri(5,7):score>=30?ri(8,10):0;
  if(rd===0){
    card('bad','ドラフトで負けた',`指名が進んでも、最後まで名前は呼ばれなかった。（総合能力 ${o}｜年齢補正後評価 ${score}）`);
    if(fromSchool){ card('info','','大学に戻って、来年戻ってきてください。'); cb(); }
    else cb('fail');
    return;
  }
  const bonus=[0,1000,600,350,350,150,150,150,50,50,50][rd]||50;
  const lv=(rd===1&&o>=50)?'CPBL1':'CPBL2';
  const team=pick(CPBL_TEAMS);
  const accept=()=>{
    S.stage='PRO'; S.team=''; S.careerEarnings+=bonus; S.svc=0; S.faElig=false;
    signTo('CPBL',lv,team,ri(2,3),1); /* 菜鳥分段短期契約(2~3年)。 */
    card('gold','NPBドラフト会議',`第<b class="hl">${rd}</b>巡目、<b class="hl">${team}</b>から指名！ 契約金は順位に応じて<b class="hl">${fmtMoney(bonus)}</b>。${lv==='CPBL1'?'即戦力評価で一軍登録。':'まずは二軍スタート。'}`);
    board(0); cb();
  };
  /* 指名順位に不満(第 3 輪以後)アマチュアへ戻り翌年再挑戦可能;年齢太大(24+)場合は選択不可、長期化を防ぐ。 */
  if(rd>=3 && S.age<24){
    choose(`NPBドラフト会議・${team}が${rd}巡目で指名`,[
      {t:'指名を受け入れてチームに参加する',main:true,s:`契約金 ${fmtMoney(bonus)}｜${lv==='CPBL1'?'一軍':'二軍'}スタート`,f:accept},
      {t: (S.stage==='HS'||(S.stage==='U'&&S.stageYr<4))?'学校に戻ってまた一年頑張ってください':'アマチュアリズムに戻ってもう1年戦う',warn:true,s:'この指名を諦めて来年のドラフトに再エントリーする',f:()=>{
        const goUni = (S.stage==='HS')||(S.stage==='U'&&S.stageYr<4);
        const fresh = (S.stage==='HS');
        card('info', goUni?'学校に戻る':'アマチュアリズムへの回帰', `指名順位を見て目の前が真っ暗になった。上位指名を予想していたのに、結果は下位。拳を握り、${goUni?(fresh?'大学へ進学して力を磨く':'大学野球部に残って鍛え直す'):'アマチュアへ戻る'}ことを決めた。次こそ壇上で指名球団の帽子をかぶる。`);
        if(fresh){ S.stage='U'; S.stageYr=0; S.team=pick(['文化大学','カトリック扶仁大学','国立大学','日本体育健大','海南大学']); }
        else if(!goUni){ S.stage='CORP'; S.team=pick(['ヘディアン','たいく','アン・ニウ・シエンウー','美しいサンゴ']); }
        advance();
      }}]);
    return;
  }
  accept();
}
function pathChoiceHS(){
  const o=ovr();
  const opts=[{t:'大学に通う（延長研修）',s:'加点できるメジャー試合は年2試合だけ｜2年目から毎年ドラフト出場可能',f:()=>{
      S.stage='U'; S.stageYr=0; S.team=pick(['文化大学','カトリック扶仁大学','国立大学','日本体育健大','海南大学']);
      card('info','さらなる教育',`入力<b class="hl">${S.team}</b>野球チーム。`); advance(); }},
    {t:'NPBドラフトへ参加',s:'現在の総合能力 '+o,f:()=>runDraft(false,r=>{
      if(r==='fail')choose('ドラフト指名漏れ、その後',[
        {t:'代わりに大学に通いなさい',main:true,f:()=>{S.stage='U';S.stageYr=0;S.team=pick(['文化大学','カトリック扶仁大学','国立大学','日本体育健大']);advance();}},
        {t:'アマチュア野球チームに入部する',f:()=>{S.stage='CORP';S.team=pick(['ヘディアン','たいく','アン・ニウ・シエンウー','美しいサンゴ']);advance();}}]);
      else advance(); })}];
  if(o>=44)opts.push({t:'NPB移籍を交渉',s:'NPB二軍（支配下）出隊｜8歳以上を現地人とする',f:()=>{
    S.stage='PRO';
    pickOfferUI('日本のプロ野球チームのトレーニング見積書','NPB',makeOffers('NPB',ri(2,3),800,3,3,'NPB2',null),()=>{
      card('gold','日本旅行','目標：一軍初出場。'); advance(); }); }});
  if(o>=50)opts.push({t:'MLB移籍を交渉',main:true,s:`から${o>=54?' 1A ':'新人聯盟'}レベルごとに大リーグに挑戦しましょう`,f:()=>{
    S.stage='PRO';
    pickOfferUI('メジャーリーグチームからの国際契約オファー','MiLB',makeOffers('MiLB',ri(2,3),1500,3,4,o>=54?'A1':'R',null),()=>{
      card('gold','米国への旅行','アメリカの赤土はあなたの征服を待っています。'); advance(); }); }});
  choose(`高校卒業・総合力${o}・人生初の交差点`,opts);
}
function pathChoiceU4(){
  const o=ovr();
  const opts=[{t:'NPBドラフトへ参加',main:true,s:'総合 '+o+'｜大学卒業時の年齢補正で評価ダウン',f:()=>runDraft(false,r=>{
    if(r==='fail')choose('ドラフト指名漏れ、その後',[
      {t:'アマチュア野球チームに入部する',f:()=>{S.stage='CORP';S.team=pick(['ヘディアン','たいく','アン・ニウ・シエンウー']);advance();}},
      {t:'現役引退',warn:true,f:()=>endGame('彼は大学のドラフトに失敗し、裁判所に別れを告げることを決意した。')}]);
    else advance(); })}];

  /* 大学4年卒業 (約22歳)、最大の年齢ペナルティを適用 (Senior Sign)。 */
  const agePenalty = Math.max(0, S.age - 18);
  const reqNPB = 44 + Math.floor(agePenalty / 2);
  const reqMiLB = 50 + Math.floor(agePenalty / 2);
  const bonusNPB = Math.max(100, 800 - agePenalty * 180);
  const bonusMiLB = Math.max(150, 1500 - agePenalty * 350);
  if(o>=reqNPB)opts.push({t:'NPB移籍を交渉',s:'年上のルーキー、契約価格は非常に安い',f:()=>{S.stage='PRO';
    pickOfferUI('NPB球団からのオファー','NPB',makeOffers('NPB',2,bonusNPB,2,3,'NPB2',null),advance);}});
  if(o>=reqMiLB)opts.push({t:'MLB移籍を交渉',s:'シニアサイン',f:()=>{S.stage='PRO';
    pickOfferUI('メジャーリーグチームの名言','MiLB',makeOffers('MiLB',2,bonusMiLB,3,4,o>=55?'A1':'R',null),advance);}});
  choose(`大卒・総合力のある方${o}`,opts);
}
if(typeof document!=='undefined'&&document.getElementById('btn-restart')){
  document.getElementById('btn-restart').onclick=function(){
    if(confirm('人生のこの部分を放棄して、最初からやり直してもよろしいですか?'))location.href=location.pathname;
  };
}
function advance(){
  S.age++; S.year++; S.stageYr++; startYear();
}
/* キャリア終盤。 */
const TIER_TH={CPBL:[8500,6000,3100,1800],KBO:[8200,5900,3000,1800],NPB:[8000,5800,3000,1800],MLB:[8500,6500,3600,2000]};
const LG_N={CPBL:'台湾プロ野球',KBO:'KBO',NPB:'NPB',MLB:'メジャーリーグ',MINOR:'マイナーリーグ/二軍'};
function careerScore(st){
  if(S.pos==='P')return st.W*13+st.SV*6+st.SO*0.9+st.IP*0.35;
  return st.H+st.HR*3+st.SB*0.8+st.RBI*0.5+st.BB*0.3+Math.max(0,st.DEF||0)*6;
}
function roleName3(r){ return {SP:'先発投手',MR:'リリーバー',CL:'抑え'}[r]||'投手'; }
function primaryPos(){ /* 通算の半数超を守った位置を主守備とし、該当なしなら年数順でユーティリティーまたはスイングマンと判定。 */
  if(S.pos==='P'){
    const ry=S.roleYears||{}; const tot=Object.values(ry).reduce((a,b)=>a+b,0);
    if(!tot)return roleName3(S.role);
    const es=Object.entries(ry).sort((a,b)=>b[1]-a[1]);
    if(es[0][1]>=tot/2)return roleName3(es[0][0]); /* 済み半数あり。 */
    /* 済み半数なし：スイングマン(主な2役を併記)。 */
    const list=es.map(e=>({SP:'先発',MR:'中継ぎ',CL:'抑え'}[e[0]]||'')).filter(Boolean);
    return 'スインガー('+list.slice(0,2).join('、')+')';
  }
  const dy=S.dposYears||{}; const total=Object.values(dy).reduce((a,b)=>a+b,0);
  if(!total)return S.dpos?DPN[S.dpos]:POSN[S.pos];
  const entries=Object.entries(dy).sort((a,b)=>b[1]-a[1]);
  if(entries[0][1]>=total/2)return DPN[entries[0][0]]||entries[0][0]; /* 済み半数あり。 */
  const noDH=entries.filter(e=>e[0]!=='DH'&&e[0]!=='—').map(e=>DPN[e[0]]||e[0]);
  if(!noDH.length)return DPN['DH'];
  return 'ツールマン('+noDH.join('、')+')';
}
function capTeam(bucket){ /* 当該リーグで最長在籍の球団、殿堂入り時の帽章にする。 */
  const tb=(S.teamTally&&S.teamTally[bucket])||{}; let best=null,bn=-1;
  for(const k in tb)if(tb[k]>bn){bn=tb[k];best=k;}
  return best&&window.TEAM_MASTER&&window.TEAM_MASTER[best]?window.TEAM_MASTER[best].name:best;
}
function defShare(bucket){ /* 守備貢献占キャリア総価値値割合 0~1。 */
  const st=S.stats[bucket]; if(!st||S.pos==='P')return 0;
  const off=st.H+st.HR*3+st.SB*0.8+st.RBI*0.5+st.BB*0.3;
  const def=Math.max(0,st.DEF||0)*6;
  return (off+def)>0?def/(off+def):0;
}
function posLegendPhrase(bucket){ /* に応じて守備割合とタイトル決定守備位置敘述。 */
  const share=defShare(bucket), st=S.stats[bucket];
  const dp=S.dpos||(S.pos==='C'?'C':null);
  const hasGlove=S.honors.some(h=>h.includes('ゴールデングラブ賞')||h.includes('年間最優秀守備選手'));
  if(S.pos==='P'||!dp||dp==='DH')return '';
  const posN=DPN[dp]||'';
  if(share>=0.34||(hasGlove&&share>=0.22))return `、${{SS:'史上最高の遊撃手の一人',CF:'守備範囲でリーグを震撼させた中堅手',C:'捕手守備の化身',_:'守備のレジェンド'}[dp]||('球界屈指の'+posN)}として`;
  if(hasGlove&&share>=0.12)return `、攻撃的にも守備的にも優れた選手${posN}`;
  return '';
}
function honorScore(bucket){
  return honorScoreFor({bucket,honors:S.honors,position:S.pos,intlCount:S.intlCount||0,franchise:S.traits.franchise});
}
function tierOf(bucket){
  const st=S.stats[bucket]; if(!st)return null;
  const hs=honorScore(bucket);
  const sc=careerScore(st)+hs.sc,th=TIER_TH[bucket];
  let i=sc>=th[0]?0:sc>=th[1]?1:sc>=th[2]?2:sc>=th[3]?3:4;
  /* タイトル最低条件：MVP/最優秀投手賞は最低でもスター級;部門タイトルは最低でもレギュラー級。 */
  if(hs.mvp||hs.aceN)i=Math.min(i,1);
  else if(hs.king)i=Math.min(i,2);
  return {i,sc:Math.round(sc),name:LG_N[bucket]+['殿堂','スター選手','デイリープレイヤー','フリンジプレイヤー','ページ上の乗客'][i]};
}
function statTable(bucket){
  const st=S.stats[bucket]; if(!st)return '';
  let rows;
  if(S.pos==='P'){
    const era=st.IP>0?(st.ER*9/st.IP).toFixed(2):'-';
    const whip=st.IP>0?((st.H+st.BB)/st.IP).toFixed(2):'-';
    rows=`<tr><th>Yrs</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>HLD</th><th>SO</th><th>BB</th><th>ERA</th><th>WHIP</th></tr>
    <tr><td>${st.yr}</td><td>${st.G}</td><td>${fmtIP(st.IP)}</td><td>${st.W}</td><td>${st.L}</td><td>${st.SV||0}</td><td>${st.HLD||0}</td><td>${st.SO}</td><td>${st.BB||0}</td><td>${era}</td><td>${whip}</td></tr>`;
  }else{
    const obpN = st.PA>0 ? (st.H+st.BB)/st.PA : 0;
    const slgN = slgOf(st);
    const avg = st.AB>0 ? (st.H/st.AB).toFixed(3).replace(/^0/,'') : '-';
    const obp = st.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-';
    const slg = st.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-';
    const ops = st.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
    rows=`<tr><th>Yrs</th><th>G</th><th>PA</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>H</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th></tr>
    <tr><td>${st.yr}</td><td>${st.G}</td><td>${st.PA}</td><td>${avg}</td><td>${obp}</td><td>${slg}</td><td>${ops}</td><td>${st.H}</td><td>${st.HR}</td><td>${st.RBI}</td><td>${st.SB}</td><td>${st.DEF>0?'+':''}${st.DEF||0}</td></tr>`;
  }
  const asN=st.AS||0;
  return `<p style="margin-top:8px"><b>${LG_N[bucket]}</b>${asN?` · オールスター ${asN}回選出`:''}</p><table class="fin">${rows}</table>`;
}
const FAN={
 0:['{n}引退とか無理…俺の青春も終わった','いつか子どもを球場へ連れてきて、「父ちゃんは{n}のプレーを生で見たんだぞ」って自慢するわ。','海外メディア、もう殿堂入りの得票率を計算してて草。心配ゼロかよ。','日本野球を世界へ連れていってくれてありがとう','このクラスは一世代に一人出るかどうかだろ','引退試合のチケット即完売。転売価格5倍で草'],
 1:['{n}引退確定でTLがお通夜状態','オールスター常連がついに引退か…寂しくなるな','通算成績、改めて見るとガチで立派。最高の花道だわ','いつも全力プレーをありがとう。本当にお疲れさまでした','子どもの頃、部屋に貼ってたポスターが{n}だった。俺も年取ったな'],
 2:['スーパースターじゃなくても、中継をつければいつもいた。それで十分なんよ','長年黙々とチームを支えてくれてありがとう','こういういぶし銀がチームの屋台骨なんだよ','数字は嘘をつかない。安定感こそ最大の武器だった'],
 3:['長年ベンチを温め続けた。それもまたプロ野球人生よ','少なくとも本当にプロの舞台に立った。画面の前の俺らより何倍もすごい','泥くさいプレーと大事な一本、忘れないぞ','二軍暮らしが長くても、覚えているファンはちゃんといる'],
 4:['ねえ、これは誰ですか？ …調べてみたら、実はプロでプレーしていたことが分かりました。','野球は本当に難しいですね、第二の人生も頑張ってください','また夢を追う者が現実に負けて悲しい','掲示板にはメッセージが 3 件しかなく、そのうちの 1 件に本人が返信しました。'],
};
function retireScene(tiers){
  /* tiers： {CPBL：{i、sc}、NPB：...、MLB：...} 出試合実績がある場合だけ作成。 */
  /* 代表リーグは在籍年数が最長のトップリーグ、評価階級はキャリア最高値（i最小）。 */
  let lg=bucketOf(S.lv), bestI=4;
  const order=['MLB','NPB','KBO','CPBL'];
  order.forEach(b=>{ if(tiers[b]&&tiers[b].i<bestI){ bestI=tiers[b].i; } });
  /* 代表リーグ：最大評価のリーグから、在籍年数が最長のものを採用。 */
  let repYr=-1;
  order.forEach(b=>{ if(tiers[b]&&tiers[b].i===bestI){ const yy=S.stats[b]?S.stats[b].yr:0; if(yy>repYr){repYr=yy;lg=b;} } });
  const t=tiers[lg], i=t?t.i:4, yr=S.year;
  let txt='';
  if(lg==='CPBL'){
    if(i===0)txt=`引退試合の舞台は<b class="hl">台北ドーム</b>。4万人で埋まり、外野にはキャリア各年の写真が並ぶ。9回裏、最後の打席を終えると照明が落ち、スポットライトがあなたを照らした。泣く仲間、脱帽して並ぶ相手選手、二塁後方で流れる応援歌のバラード版。場内を一周し、グラブをホームベースへそっと置いた。この試合は台湾プロ野球史上最高視聴率のレギュラーシーズン戦となった。`;
    else if(i===1)txt=`球団が引退セレモニーを開催。本拠地は満員となり、大型ビジョンには甲子園の夢が破れた高校時代から${S.pos==='P'?'プロ初登板':'プロ初安打'}までの映像が流れた。かつての仲間が各地から花を贈りに戻り、監督は言葉を詰まらせる。最後に帽子を取り、四方のスタンドへ深々と一礼。応援団の太鼓は、ダッグアウトへ消えるまで鳴りやまなかった。`;
    else if(i===2)txt=`${S.pos==='P'?'シーズン最後の本拠地戦、球団はあなたを先発マウンドへ送った。1回を投げ終えて交代すると、観客は総立ちで拍手。仲間はダッグアウト前に二列で並び、ハイタッチで迎えた。花火もライブもない。ただスタンドには「全力の一球一球をありがとう」と手書きした横断幕が掲げられていた。':'シーズン最後の本拠地戦、球団はあなたを一番打者で先発起用。最初の打席後に交代すると、観客は総立ちで拍手。仲間はダッグアウト前に二列で並び、ハイタッチで迎えた。花火もライブもない。ただスタンドには「全力で走った一歩一歩をありがとう」と手書きした横断幕が掲げられていた。'}`;
    else txt=`チームの公式ウェブサイトのプレスリリースで引退を発表しましたね。あなたがこの投稿を投稿した夜、何十人もの古いファンがあなたのソーシャルメディアに殺到し、「お疲れ様でした」というメッセージを残しました。それがプロ野球の特徴です。誰もが儀式を持っているわけではありませんが、真剣にプレーする人には必ずそれを覚えている人がいます。`;
  }else if(lg==='NPB'){
    if(i<=1)txt=`球団が<b class="hl">引退試合</b>を用意した。最後の守備を終えると一人グラウンドに残され、両軍選手が整列。花束、監督との抱擁、そして何度も<b class="hl">胴上げ</b>された。花束を抱えて場内を一周し、満員のファンへ深々と頭を下げた。翌朝、宙を舞う写真が全スポーツ紙の一面を飾った。`;
    else if(i===2)txt=`最終戦後、球団が短い引退セレモニーを開催。花束、額装した記念ユニフォーム、監督との記念撮影。場内放送が通算成績を読み上げると、ビジターのファンも立ち上がって拍手した。会見では、支えてくれたファンと仲間への感謝を語った。`;
    else txt=`球団を通じて引退を発表した。ロッカーを片づけた日、仲間やスタッフが選手通路の最後まで見送り、警備員も深々と頭を下げた。スーツケースには、捨てられなかった練習着が数枚残った。`;
  }else if(lg==='KBO'){
    if(i<=1)txt=`球団が本拠地最終戦を引退試合として開催した。最後のプレーを終えると両軍の選手が整列し、満員のファンが総立ちで拍手。大型ビジョンには韓国で戦った日々が映し出され、古巣の仲間から花束が贈られた。`;
    else if(i===2)txt=`シーズン最終戦後、球団が引退セレモニーを開催した。場内放送がKBO通算成績を読み上げると、ホームとビジター双方のファンから温かい拍手が送られた。`;
    else txt=`球団を通じて現役引退を発表した。ロッカーを片づけ、支えてくれた韓国のチームメートとスタッフへ一人ずつ感謝を伝えた。`;
  }else if(lg==='MLB'){
    if(i<=1)txt=`本拠地最終戦。最後の打席を前に観客は3分間の総立ち拍手。主審も脇へ下がって静かに待った。打席後に交代すると、全員がダッグアウトから出て抱きしめ、大型ビジョンに功績映像が流れる――<b class="hl">Curtain Call</b>。再び姿を見せ、二度帽子を振った。会見には各国メディアが詰めかけ、日本のスポーツメディアも一晩中特集を放送した。`;
    else if(i===2)txt=`キャリア最後のシリーズ前、球団が簡単なセレモニーを開催。額装ユニフォームと記念レリーフが贈られ、仲間がハイタッチで送り出す。地元紙は「スーパースターではない。だが、どの監督も欲しがる選手だ」と記した。`;
    else txt=`無人の球場の写真に「Thank you、 baseball.」の一文だけを添えて投稿。日本時間の深夜、いいねは静かに10万を超えた。`;
  }else{
    const retirementGround=S.stage==='CORP'?'社会人野球のグラウンド':S.stage==='IND'?'地方球場':S.stage==='U'?'大学野球のグラウンド':S.stage==='HS'?'母校のグラウンド':'球場';txt=`スポットライトはない。スパイクを磨いてバッグへ入れ、仲間と一人ずつ抱き合い、${retirementGround}を後にする前にスコアボードをもう一度振り返る。初めてこのグラウンドに立った日の夕日と同じように美しい。`;
  }
  card('gold','引退の日',txt);
  /* 名人堂票選(可多リーグ並存)。 */
  const hofs=[]; let firstBallot=false; const hofLeagues=[];
  const HOF_CFG={CPBL:{n:'台湾プロ野球殿堂',wait:5,total:132,lg:'台湾プロ野球'},KBO:{n:'韓国野球殿堂',wait:5,total:250,lg:'KBO'},NPB:{n:'日本野球殿堂',wait:5,total:326,lg:'NPB'},MLB:{n:'アメリカ野球殿堂',wait:5,total:389,lg:'メジャーリーグ'}};
  ['CPBL','KBO','NPB','MLB'].forEach(b=>{ const t=tiers[b]; if(!t)return;
    const cfg=HOF_CFG[b];
    if(t.i===0){
      /* 初回投票選出基準：評価点が基準を明確に上回る(1.15×名人堂基準)場合のみ first-ballot、それ以外は需等 N 年。 */
      const th=TIER_TH[b][0];
      const fbMult={CPBL:1.15,KBO:1.15,NPB:1.12,MLB:1.2}[b]||1.2;
      const firstNow = t.sc>=th*fbMult;
      const ballotYr = firstNow?1:ri(2,6);
      if(firstNow){ firstBallot=true; }
      hofLeagues.push(cfg.lg);
      const pct=Math.min(99.1,75+ (t.sc-th)/th*40 + R()*6 - (ballotYr-1)*4);
      const votes=Math.round(cfg.total*Math.max(75,pct)/100);
      if(!S.hofInfo)S.hofInfo=[]; S.hofInfo.push({lg:cfg.lg,yr:ballotYr,pct:Math.max(75,pct).toFixed(1)}); /* 結果画像用。 */
      const cap=capTeam(b), phr=posLegendPhrase(b);
      hofs.push(`引退から<b class="hl">${cfg.wait}年後</b>（${yr+cfg.wait}年）に候補入りし、<b class="hl">${ballotYr}年目の投票</b>で<b class="hl">${votes}票</b>（得票率${Math.max(75,pct).toFixed(1)}%）を獲得。<b class="hl">${cfg.n}</b>入りを果たした。${cap?`代表球団は<b class="hl">${cap}</b>${phr}。`:''}${ballotYr===1?'<b class="hl">初回投票での殿堂入り。</b>':''}`);
    }else if(t.i===1){
      const pct=55+R()*17, tries=ri(3,9);
      hofs.push(`${tries}年連続で${cfg.n}の候補となり、最高得票率は${pct.toFixed(1)}%。しかし最後まで75%の壁を越えられなかった。`);
    } });
  if(firstBallot&&!S.traits.legend){ S.traits.legend=true;
    S.legendLeague=hofLeagues[0]||''; }
  if(hofs.length)card('gold','殿堂入り投票',hofs.join('<br><br>'));
  if(S.traits.legend){ card('gold','隠し特性解放：'+(S.legendLeague||'')+'歴史に残る名選手',
    `初回投票で殿堂入り――ただ名を連ねただけではない。あなたは<b class="hl">一つの時代を築いた</b>。その名は${S.legendLeague||'野球界'}の歴史に刻まれる。`); }
}
function endGame(reason){
  S.done=true; actClear();
  divider('現役生活に幕');
  card('info','引退する',reason);
  /* リーグ別成績と評価。 */
  let tables='',evals=[],best=99; const tiersByLg={};
  ['MLB','NPB','KBO','CPBL','MINOR'].forEach(b=>{ if(S.stats[b]){ tables+=statTable(b);
    if(b!=='MINOR'){ const t=tierOf(b); tiersByLg[b]=t; evals.push(`<span class="tag">${t.name}</span>（評価点${t.sc}）`); best=Math.min(best,t.i); } } });
  if(best===99)best=4;
  retireScene(tiersByLg);
  /* 成就基準：CPBL名人堂 または 站上NPB/大リーグ。 */
  const reachedTop = (tiersByLg.CPBL&&tiersByLg.CPBL.i===0) || !!S.stats.NPB || !!S.stats.MLB;
  if(reachedTop){
    /* 小學校之光：T3 弱旅出身。 */
    if(!S.traits.smallschool && S.hsTier===3){ S.traits.smallschool=true;
      card('gold','隠し特性解放：弱小校の星',`無名の弱小校から、ついに最高峰の舞台へ。出身校が選手の限界を決めるわけじゃない――自らのキャリアで証明した。`); }
    /* 努力仔：初始能力上限合計偏低(投手≤237/野手≤469)。 */
    const grindTh = S.pos==='P'?237:469;
    if(!S.traits.grinder && (S.potSum0||999)<=grindTh){ S.traits.grinder=true;
      card('gold','隠し特性解放：努力の人',`平凡な素質の選手は数え切れない。そこから頂点まで勝ち上がれるのは、ほんの一握りだ。選ばれた天才ではない。流した汗を才能へ変えた男だ。`); }
  }
  /* 25 歳前に野球を離れた場合：全選手に前向きな第二の人生を用意。 */
  if(S.age<25){
    const nm=S.name;
    const second=[
      `あなたはディビジョン B のアマチュア野球チームに参加します。平日は出勤し、週末にはジャージを着て、昨年のアソシエーションカップでサヨナラヒットを打った動画が話題になった。最も多かったコメントは「このスイングはアマチュアっぽくない」です。 - そうじゃないから。野球を愛するために野球で生計を立てる必要はないことを、あなたは誰よりも知っています。`,
      `不動産営業の資格を取った。内見で6階まで上っても顔色ひとつ変えず、客からは「雰囲気が違う」と言われる。16歳で数千人を前に投げた男が、価格交渉を恐れるはずもない。3年後には店の営業トップとなり、名刺の肩書きの下には小さく「元プロ野球選手」と記した。`,
      `叔父のもとで型枠大工になった。現場で春季キャンプ以上に日焼けしたが、体幹の強さと負けん気にベテラン職人も感心。5年後には班を率い、給料も二軍時代に引けを取らない。「ここでは誰も俺を二軍へ落とさない」と笑った。`,
      `シャツ姿で出社し、同僚が知っているのは「昔、野球をやっていた」ことだけ。ところが社内ソフトボール大会で一発を場外へ運び、全員が3秒沈黙。それ以来、相手企業は毎年「あの人、今年も出るんですか？」と先に聞くようになった。`,
      `朝食店を引き継ぎ、店名は「満塁」。高校時代のユニフォームを飾り、卵焼きは守備と同じく堅実。近所の少年野球選手が放課後に集まる。店主が大根餅を焼きながら、投手のリリースポイントの見方を教えてくれるからだ――卵追加は無料。`,
      `母校の指導者になった。給料は高くないが、自分が歩ききれなかった道を地図にして後輩へ渡した。7年目、教え子の投手がドラフト1巡目指名。中継カメラに映ったあなたは、本人以上に泣いていた。`,
      `起業し、スマホのスロー映像で一般選手のスイング軌道を分析する野球トレーニング技術を開発。1年目は倒産寸前、3年目にスポーツセンターが一括導入した。資金調達資料の1枚目には「自分が立てなかった舞台に、もっと多くの人を立たせたい」とだけ書いた。`,
      `消防士になり、体力試験は全種目1位。教官に前職を聞かれ「野球です」と答えた。初めて人命救助に出た夜、ふと気づく。もう150キロは投げられなくても、人を担いで火災現場から救い出せる――この両手はまだ役に立つ。`];
    card('gold','第二の人生',second[Math.floor(R()*second.length)].replace(/{n}/g,nm)+`<br><br><span class="sub">グラウンドを離れた後の人生も、また人生。${nm}、お疲れさまでした。</span>`);
  }
  /* 年度別成績表 (アマチュアとプロに分ける)。 */
  if(S.log.length){
    const amaLogs = S.log.filter(r => !r.st);
    const proLogs = S.log.filter(r => r.st);
    if(amaLogs.length > 0){
      const amaRows = amaLogs.map(r=>`<tr><td style="white-space:nowrap">${r.y}</td><td style="white-space:nowrap">${r.age}</td><td style="text-align:left;white-space:nowrap">${r.tm}</td><td style="text-align:left;font-size:11px;${r.inj?'color:var(--bad);font-weight:700;':''}">${r.line}</td></tr>`).join('');
      card('','キャリア年表（アマチュア成績）',`<table class="fin"><tr><th>年</th><th>年齢</th><th style="text-align:left">チーム</th><th style="text-align:left">成績</th></tr>${amaRows}</table>`);
    }
    if(proLogs.length > 0){
      const isP = S.pos === 'P';
      const head = isP
        ? `<tr><th>年</th><th>年齢</th><th style="text-align:left">チーム</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>HLD</th><th>SO</th><th>BB</th><th>ERA</th><th>WHIP</th></tr>`
        : `<tr><th>年</th><th>年齢</th><th style="text-align:left">チーム</th><th>G</th><th>PA</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>H</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th></tr>`;
      const rows = proLogs.map(r => {
        const cS = r.inj ? 'color:var(--bad);font-weight:700;' : '';
        const s = r.st || {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0};
        if(isP){
          const era = s.IP>0 ? (s.ER*9/s.IP).toFixed(2) : '-';
          const whip = s.IP>0 ? ((s.H+s.BB)/s.IP).toFixed(2) : '-';
          return `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td class="career-team"><span>${r.tm}</span></td><td>${s.G}</td><td>${fmtIP(s.IP)}</td><td>${s.W}</td><td>${s.L}</td><td>${s.SV||0}</td><td>${s.HLD||0}</td><td>${s.SO}</td><td>${s.BB||0}</td><td>${era}</td><td>${whip}</td></tr>`;
        } else {
          const obpN = s.PA>0 ? (s.H+s.BB)/s.PA : 0;
          const slgN = slgOf(s);
          const avg = s.AB>0 ? (s.H/s.AB).toFixed(3).replace(/^0/,'') : '-';
          const obp = s.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-';
          const slg = s.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-';
          const ops = s.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
          return `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td class="career-team"><span>${r.tm}${r.p?"·"+r.p:""}</span></td><td>${s.G}</td><td>${s.PA}</td><td>${avg}</td><td>${obp}</td><td>${slg}</td><td>${ops}</td><td>${s.H}</td><td>${s.HR}</td><td>${s.RBI}</td><td>${s.SB}</td><td>${s.DEF>0?'+':''}${s.DEF||0}</td></tr>`;
        }
      }).join('');
      card('','キャリア年表 (キャリアの実績)',`<div class="career-table-scroll"><table class="fin career-table">${head}${rows}</table></div>`);
    }
  }
  let intlTable='';
  if(S.intlCount>0){ const IS=S.intlStat;
    if(S.pos==='P'){ const era=IS.IP>0?(IS.ER*9/IS.IP).toFixed(2):'-';
      intlTable=`<h4 style="margin:12px 0 4px">国際大会通算（日本代表・${S.intlCount}大会）</h4><table class="st"><tr><th>出場</th><th>投球回</th><th>勝利</th><th>セーブ</th><th>奪三振</th><th>ERA</th></tr><tr><td>${IS.G}</td><td>${fmtIP(IS.IP)}</td><td>${IS.W}</td><td>${IS.SV}</td><td>${IS.SO}</td><td>${era}</td></tr></table>`;
    } else { const avg=IS.AB>0?(IS.H/IS.AB).toFixed(3).replace(/^0/,''):'-';
      intlTable=`<h4 style="margin:12px 0 4px">国際大会通算（日本代表・${S.intlCount}大会）</h4><table class="st"><tr><th>出場</th><th>打席</th><th>打率</th><th>安打</th><th>本塁打</th><th>打点</th></tr><tr><td>${IS.G}</td><td>${IS.PA}</td><td>${avg}</td><td>${IS.H}</td><td>${IS.HR}</td><td>${IS.RBI}</td></tr></table>`;
    }
  }
  card('','通算成績',(tables||'<p>（プロレベルの試合実績なし）</p>')+intlTable);
  if(evals.length)card('gold','通算評価',evals.join('<br>'));
  /* タイトルと主要大会成績（グループ化）。 */
  /* タイトルと主要大会成績（グループ化）。 */
  let honorsHTML = '（彼のキャリアでは賞を受賞していません）';
  if(S.honors.length) {
    const awardMap = {};
    S.honors.forEach(h => {
       const parts = h.split(' ');
       if(parts.length >= 2) {
         const yr = parts[0]; const awd = parts.slice(1).join(' ');
         if(!awardMap[awd]) awardMap[awd] = []; awardMap[awd].push(yr);
       } else { if(!awardMap[h]) awardMap[h] = []; awardMap[h].push(''); }
    });
    const honorsList = [];
    for(const awd in awardMap) {
       const yrs = awardMap[awd];
       if(yrs[0] !== '') {
         let nums = yrs.map(Number).sort((a,b)=>a-b);
         let res=[], st=nums[0], ed=nums[0];
         for(let i=1; i<=nums.length; i++){
           if(i<nums.length && nums[i]===ed+1){ ed=nums[i]; }
           else {
             if(ed-st>=2) res.push(`${st}~${ed}`); // 三年または以上連號、用 ~。
             else if(ed-st===1) res.push(`${st}、${ed}`); // 兩年連號、維持頓號。
             else res.push(`${st}`); // 單1年份。
             if(i<nums.length){ st=nums[i]; ed=nums[i]; }
           }
         }
         if(yrs.length > 1) honorsList.push(`· ${awd} *${yrs.length} (${res.join('、')})`);
         else honorsList.push(`· ${awd} (${res[0]})`);
       } else {
         honorsList.push(`· ${awd}`);
       }
    }
    honorsHTML = honorsList.join('<br>');
  }
  card(S.honors.length?'gold':'','タイトル・国際大会成績', honorsHTML);
  /* 特質と薪資。 */
  const tr=[];
  const TN={genius:'天才',iron:'鉄人',glass:'スペランカー',scum:'クズ男',late:'遅咲き',disc:'自律の鬼',academy:'理論派',intlace:'国際大会の鬼',franchise:'球団の顔',clutch:'強心臓',phoenix:'復活',onetool:'一芸特化',rubber:'ラバーアーム',goldcloth:'ゴールデングラブ常連',mrteam:(teamNick(S.mrTeamName||'')||'')+'ミスター',confidante:'女友達止まり',smallschool:'弱小校の星',grinder:'努力の人',legend:(S.legendLeague||'')+'歴史に残る名選手',yips:'記憶喪失',distract:'私生活多忙',cancer:'ロッカールームの癌',ambience:'ムードメーカー',thief:'給料泥棒',combo:'小細工無用',rainbow:(S.rainbowLg||'')+'ジャーニーマン',taiwan:'Team Taiwan'};
  const posT={pos:['legend','taiwan','goldcloth','mrteam','confidante','genius','late','disc','academy','intlace','franchise','clutch','phoenix','rubber','onetool','smallschool','grinder','combo','rainbow'],neg:['glass','scum','yips','distract','cancer','ambience','thief']};
  const tagStyle=k=>{
    if(k==='legend'||k==='taiwan')return 'background:#fff7dc;border-color:#c79520;color:#795b00'; /* 歴史的選手/台湾代表への貢献：金。 */
    if(k==='goldcloth')return 'background:#fffbe0;border-color:#c5a800;color:#6f6000'; /* ゴールデングラブ常連：黄。 */
    if(k==='mrteam'){ const tc=TEAM_COLOR[S.mrTeamName]||'#a71930'; return 'background:#ffffff;border-color:'+tc+';color:'+tc; }
    if(k==='genius')return 'background:#f3f5f8;border-color:#9aa5b5;color:#4c5868';        /* 天才：銀。 */
    return ''; /* 好影響：既定色はアンバー。 */
  };
  posT.pos.forEach(k=>{ if(S.traits[k])tr.push(`<span class="tag" style="${tagStyle(k)}">${TN[k]}</span>`); });
  posT.neg.forEach(k=>{ if(S.traits[k])tr.push(`<span class="tag" style="background:#fff0f0;border-color:#c0392b;color:#a71930">${TN[k]}</span>`); });
  (S.removed||[]).forEach(lbl=>tr.push(`<span class="tag" style="text-decoration:line-through;opacity:.4;color:#8a8a8a;border-color:#4a4a4a">${lbl}</span>`));
  const lv=S.love;
  const cur=lv.st==='married'?`妻 ${lv.partner}（子ども${lv.kids}人）`:lv.st==='dating'?`交際中 ${lv.partner}（${lv.dyrs||0}年）`:lv.st==='divorced'?'離婚':'独身';
  const exStr=lv.exes.length?`｜前妻 ${lv.exes.map(e=>`${e.name}（${e.kids}）`).join('、')}`:'';
  const totKids=lv.kids+lv.exes.reduce((t,e)=>t+e.kids,0);
  card('','キャリアプロフィール',`特性：${tr.join(' ')||'（なし）'}<br>家族：${cur}${exStr}｜子ども合計 ${totKids} 人${lv.affairs?`｜不倫 ${lv.affairs}(${lv.caught})`:''}<br>日本代表出場：${S.intlCount}大会｜キャリア通算の大故障：${S.bigInj}回${S.pos==='P'?`｜トミー・ジョン手術：${S.tjCount}回`:''}<br>固定年俸累計：${fmtMoney(S.careerBaseSalary||0)}｜契約金累計：${fmtMoney(S.careerSigningBonus||0)}<br>出来高累計：${fmtMoney(S.careerIncentive||0)}｜買い取り累計：${fmtMoney(S.careerBuyout||0)}<br>社会人給与累計：${fmtMoney(S.corpIncome||0)}<br>生涯総収入：<b class="hl" style="font-size:18px">${fmtMoney(Math.round(S.careerEarnings))}</b>`);
  /* ファンコメント。 */
  const pool=FAN[best].slice(); const picks=[];
  while(picks.length<3&&pool.length)picks.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  /* 盤子留言：低リーグスター以上、海外移籍到更高リーグ卻淪替補/邊緣。 */
  { const LGR={CPBL:0,NPB:1,MLB:2}, CTY={CPBL:'台湾',NPB:'日本',MLB:'アメリカ合衆国'};
    ['CPBL','NPB','MLB'].forEach(low=>{ ['CPBL','NPB','MLB'].forEach(high=>{
      if(LGR[high]>LGR[low] && tiersByLg[low] && tiersByLg[high] && tiersByLg[low].i<=1 && tiersByLg[high].i>=3){
        picks.push(`${CTY[low]}では${LG_N[low]}の顔だったのに、${CTY[high]}の${LG_N[high]}ではまるで通用せず――「誰やこいつ？」地元ファンも困惑。獲得した球団、完全に高値づかみで草。`);
      }
    }); });
  }
  if(S.traits.glass)picks.push('あのケガさえなければどんな成績を残したのか……想像もつかん');
  if(S.traits.iron)picks.push('鉄人、ついに引退。あの連続出場記録は当分抜かれんやろな');
  if(S.traits.genius&&best<=1)picks.push('高校時代から天才と呼ばれた男、ガチで才能を証明したな');
  if(S.honors.some(h=>h.includes('WBC優勝')))picks.push('WBC優勝の夜、日本中が眠れなかった。ありがとう、侍ジャパン。');
  if(S.love.caught)picks.push('プレーは文句なし。私生活は……まあ、うん');
  if(S.traits.scum)picks.push('引退スレでその話はやめろ、今日は野球だけ語れ。……いややっぱ腹立つわ');
  if(S.traits.franchise)picks.push('一球団一筋。永久欠番待ったなし。残ってくれてありがとう');
  if(S.traits.legend)picks.push('同じ時代にプレーを見られたのは幸せや。文句なしのレジェンド');
  if(S.traits.intlace)picks.push('代表ユニを着たこの男、永遠の国民的英雄や');
  if(S.traits.taiwan)picks.push('代表招集6回、一度も辞退なし。胸を指したあの場面、今でもスマホの壁紙や');
  if(S.traits.disc)picks.push('自律しすぎて怖い。朝4時の球場がホームみたいな男');
  if(S.traits.cancer)picks.push('実力はガチ。でもあの態度はな……いなくなってロッカーが平和になったわ');
  if(S.traits.thief)picks.push('二軍落ち拒否して結果も出せず。給料泥棒呼ばわりも残当');
  if(S.traits.mrteam)picks.push('15年間、一筋の球団にすべてをささげた。'+(teamNick(S.mrTeamName||'')||'')+'『ミスター』の称号にふさわしい');
  if(S.traits.confidante)picks.push('グラウンドでは無双、恋愛ではあと一歩。悲しいなあ');
  if(S.traits.smallschool)picks.push('あの弱小校からプロまで来たんか。映画化決定やろ');
  if(S.traits.grinder)picks.push('才能に恵まれなくてもここまで来た。こういう選手が一番尊敬できる');
  if(S.traits.goldcloth)picks.push('台中マンモス愛してる。ずっとついていくで');
  if(S.traits.phoenix)picks.push('手術台から復活してタイトルまで取るとか、心臓チタン製やろ');
  if(S.traits.onetool&&S.toolRole)picks.push(`${S.toolRole}だけはマジで無双。勝負どころで出せばええねん。`);
  if(S.traits.clutch)picks.push('大舞台の鬼。勝負どころほど任せたくなる男');
  if(S.love.st==='married'&&S.love.kids>=2)picks.push('引退後は家族孝行してくれ。子どもたちもずっと待ってたぞ');
  card('info','ファン掲示板・引退スレ',picks.map(p=>'「'+p.replace(/{n}/g,S.name)+'」').join('<br>'));
  /* ワンタップ共有。 */
  const sh=document.createElement('div'); sh.className='card';
  sh.innerHTML=`<div class="title">この野球人生を共有</div>
    <div class="row2" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn main" id="sh-img" style="flex:1">📸 キャリア画像を作成</button>
      <button class="btn" id="sh-url" style="flex:1">🔗 リプレイURLをコピー</button>
    </div><div id="sh-out" style="margin-top:8px"></div>`;
  $('log').appendChild(sh);
  const imgBtn=sh.querySelector('#sh-img'),urlBtn=sh.querySelector('#sh-url'),shareOut=sh.querySelector('#sh-out');
  imgBtn.type=urlBtn.type='button';
  imgBtn.addEventListener('click',()=>{
    imgBtn.disabled=true; imgBtn.textContent='⏳ キャリア画像を作成中…';
    requestAnimationFrame(()=>{try{shareImage(evals,shareOut);imgBtn.textContent='✅ キャリア画像を作成しました';}
      catch(err){console.error(err);shareOut.innerHTML='<div class="statline" role="alert">画像を作成できませんでした。ページを再読み込みして、もう一度お試しください。</div>';imgBtn.textContent='⚠️ もう一度作成する';}
      finally{imgBtn.disabled=false;}
    });
  });
  urlBtn.addEventListener('click',async()=>{
    const base=location.href.split('#')[0].split('?')[0];
    const url=base+'?seed='+encodeURIComponent(SEED);
    urlBtn.disabled=true;urlBtn.textContent='⏳ コピー中…';
    let copied=false;
    try{if(window.isSecureContext&&navigator.clipboard&&navigator.clipboard.writeText){copied=await Promise.race([navigator.clipboard.writeText(url).then(()=>true).catch(()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),1200))]);}}
    catch(err){console.warn('Clipboard API unavailable',err);}
    if(!copied){
      const ta=document.createElement('textarea');ta.value=url;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
      try{copied=document.execCommand('copy');}catch(err){}ta.remove();
    }
    if(copied){urlBtn.textContent='✅ コピーしました';shareOut.innerHTML='<div class="statline" role="status">リプレイURLをコピーしました。</div>';}
    else{urlBtn.textContent='URLを選択してコピー';shareOut.innerHTML='<label class="statline" style="display:block">下のURLを長押し／選択してコピーしてください。<input value="'+url.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" readonly style="width:100%;margin-top:6px;padding:8px;color:var(--chalk);background:var(--panel);border:1px solid var(--edge);border-radius:6px"></label>';const input=shareOut.querySelector('input');input.focus();input.select();}
    urlBtn.disabled=false;setTimeout(()=>{urlBtn.textContent='🔗 リプレイURLをコピー';},1800);
  });
  choose('',[
    {t:'⚾ 新しい野球人生を始める（新規シード）',main:true,f:()=>{location.href=location.pathname;}},
    {t:'同じシードでやり直す',s:'seed: '+SEED,f:()=>{location.href=location.pathname+'?seed='+SEED;}}]);
  /* 結果画面のスクロール位置：既定の最下部スクロールを上書き、「現役生活に幕」の先頭へ移動、結果の1行目から読めるようにする。 */
  setTimeout(()=>{ try{
    const heads=document.querySelectorAll('.yr-head');
    for(const h of heads){ if(h.textContent==='現役生活に幕'){ h.scrollIntoView({behavior:'auto',block:'start'}); break; } }
  }catch(e){} },250);
}
/* 結算圖（Canvas 產生 PNG、可長按儲存または自動下載）。 */
function shareImage(evals,out){
  const isP=S.pos==='P';
  const tiers=evals.map(t=>t.replace(/<[^>]+>/g,''));
  /* 特性(保持 + 刪除線標記)。 */
  const TN2={legend:(S.legendLeague||'')+'歴史に残る名選手',taiwan:'Team Taiwan',goldcloth:'ゴールデングラブ常連',genius:'天才',iron:'鉄人',glass:'スペランカー',scum:'クズ男',late:'遅咲き',disc:'自律の鬼',academy:'理論派',intlace:'国際大会の鬼',franchise:'球団の顔',clutch:'強心臓',phoenix:'復活',onetool:'一芸特化',rubber:'ラバーアーム',mrteam:(teamNick(S.mrTeamName||'')||'')+'ミスター',confidante:'女友達止まり',smallschool:'弱小校の星',grinder:'努力の人',yips:'記憶喪失',distract:'私生活多忙',cancer:'ロッカールームの癌',ambience:'ムードメーカー',thief:'給料泥棒',combo:'小細工無用',rainbow:(S.rainbowLg||'')+'ジャーニーマン'};
  const negK=['glass','scum','yips','distract','cancer','ambience','thief'];
  const keepTr=Object.keys(TN2).filter(k=>S.traits[k]).map(k=>({label:TN2[k],key:k,neg:negK.includes(k)}));
  const remTr=(S.removed||[]).map(l=>({label:l,key:'',neg:false,rem:true}));
  /* キャリア成績列(每リーグ一列)。 */
  const leagues=['MLB','NPB','KBO','CPBL'].filter(b=>S.stats[b]);
  /* キャリア里程碑 + 名人堂資訊(加在栄誉最前面)。 */
  const milestones = [];
  const isPit = S.pos==='P';
  /* 名人堂入選資訊。 */
  if(S.hofInfo&&S.hofInfo.length){ S.hofInfo.forEach(h=>{
    milestones.push(`${h.lg}殿堂入り・${h.yr}年目,得票率${h.pct}%`); }); }
  /* 跨リーグキャリア合計里程碑。 */
  { let tG=0,tH=0,tHR=0,tRBI=0,tSB=0,tW=0,tSV=0,tHLD=0,tSO=0,tIP=0;
    ['CPBL','KBO','NPB','MLB'].forEach(b=>{ const st=S.stats[b]; if(!st)return;
      tH+=st.H||0;tHR+=st.HR||0;tRBI+=st.RBI||0;tSB+=st.SB||0;
      tW+=st.W||0;tSV+=st.SV||0;tHLD+=st.HLD||0;tSO+=st.SO||0;tIP+=st.IP||0; });
    if(isPit){
      if(tW>0||tSO>0)milestones.push(`リーグ横断通算：${tW}勝 ${tSO}奪三振 ${tSV}セーブ ${tHLD}ホールド`);
    }else{
      if(tH>0)milestones.push(`リーグ横断通算：${tHR}本塁打 ${tH}安打 ${tSB}盗塁`);
    }
  }
  /* 栄誉グループ化(に応じて年份)。 */
  const honors = milestones.slice();
  const aMap = {};
  S.honors.forEach(h => {
     const parts = h.split(' ');
     if(parts.length >= 2) { const yr = parts[0]; const awd = parts.slice(1).join(' ');
       if(!aMap[awd]) aMap[awd] = []; aMap[awd].push(yr);
     } else { if(!aMap[h]) aMap[h] = []; aMap[h].push(''); }
  });
  for(const awd in aMap) {
     const yrs = aMap[awd];
     if(yrs[0] !== '') {
       let nums = yrs.map(Number).sort((a,b)=>a-b);
       let res=[], st=nums[0], ed=nums[0];
       for(let i=1; i<=nums.length; i++){
         if(i<nums.length && nums[i]===ed+1){ ed=nums[i]; }
         else {
           if(ed-st>=2) res.push(`${st}~${ed}`);
           else if(ed-st===1) res.push(`${st},${ed}`);
           else res.push(`${st}`);
           if(i<nums.length){ st=nums[i]; ed=nums[i]; }
         }
       }
       if(yrs.length > 1) honors.push(`${awd} *${yrs.length} (${res.join(',')})`);
       else honors.push(`${awd} (${res[0]})`);
     } else {
       honors.push(`${awd}`);
     }
  }
  /* 年度別成績。 */
  const hist=S.log.slice();

  const W=920, PAD=34, scale=2;

  /* 改行計算のため,CanvasとContextを先に作り文字幅を測定。 */
  const cv=document.createElement('canvas');
  const c=cv.getContext('2d');
  c.font='13px sans-serif';

  /* 処理栄誉二欄改行。 */
  const colW=(W-PAD*2)/2, maxTextW=colW-20;
  const honorBlocks = honors.map(h => {
    let text = '· ' + h;
    let lines = []; let curr = '';
    for(let i=0; i<text.length; i++) {
      let test = curr + text[i];
      if(c.measureText(test).width > maxTextW && curr.length > 0) {
        lines.push(curr);
        curr = '  ' + text[i];
      } else { curr = test; }
    }
    if(curr) lines.push(curr);
    return lines;
  });
  const rows2=Math.ceil(honorBlocks.length/2);
  let leftH=0, rightH=0;
  honorBlocks.slice(0, rows2).forEach(b => leftH += b.length * 23);
  honorBlocks.slice(rows2).forEach(b => rightH += b.length * 23);
  const honorsTotalHeight = Math.max(leftH, rightH);
  /* 預估総高さ。 */
  let H=150; // header
  H+=30+tiers.length*24+14; // 評価。
  if(keepTr.length||remTr.length)H+=54;
  H+=34+(leagues.length+1)*26+16; // 通算成績表。
  if(S.intlCount>0)H+=30+24+28+12; // 国際大会欄。
  H+=30+honorsTotalHeight+16; // 栄誉(二欄改行後的高さ)。

  const amaLogs = hist.filter(r => !r.st);
  const proLogs = hist.filter(r => r.st);
  if(amaLogs.length > 0) H += 34 + amaLogs.length * 20 + 24;
  if(proLogs.length > 0) H += 34 + proLogs.length * 20 + 24;

  H+=70;
  cv.width=W*scale; cv.height=H*scale;
  c.scale(scale,scale);
  const imageColor={bg:'#fff8f8',panel:'#ffffff',edge:'#c9828e',text:'#3a1017',dim:'#875d64',accent:'#a71930',soft:'#6f4048',bad:'#c62828'};
  c.fillStyle=imageColor.bg; c.fillRect(0,0,W,H);
  c.strokeStyle=imageColor.edge; c.lineWidth=3; c.strokeRect(10,10,W-20,H-20);
  c.textBaseline='top';
  const posN={P:roleN(S.role)+'投手',C:'捕手',IF:'内野手',OF:'外野手'}[S.pos];

  // Header
  c.fillStyle=imageColor.dim; c.font='13px sans-serif'; c.fillText('野球人生シミュレーター・引退記念',PAD,30);
  c.fillStyle=imageColor.accent; c.font='bold 36px sans-serif'; c.fillText(S.name,PAD,52);
  c.fillStyle=imageColor.text; c.font='15px sans-serif';
  c.fillText(`${primaryPos()}｜${playerType()}｜${hist.length?hist[0].y:'?'}–${S.year}｜引退時${S.age}歳${S.pos==='P'&&S.tjCount?`｜TJ×${S.tjCount}`:''}`,PAD,98);
  // 特性列(header 右方)。
  let y=126;
  function tagColor(o){
    if(o.rem)return {bg:'#f1eeee',bd:'#b7aaad',fg:'#81757a'};
    if(o.key==='legend'||o.key==='taiwan')return {bg:'#fff7dc',bd:'#c79520',fg:'#795b00'}; /* 金（歴史的選手・Team Taiwan）。 */
    if(o.key==='goldcloth')return {bg:'#fffbe0',bd:'#c5a800',fg:'#6f6000'}; /* 黄。 */
    if(o.key==='mrteam'){ const tc=TEAM_COLOR[S.mrTeamName]||imageColor.accent; return {bg:'#ffffff',bd:tc,fg:tc}; }
    if(o.key==='genius')return {bg:'#f3f5f8',bd:'#9aa5b5',fg:'#4c5868'}; /* 銀。 */
    if(o.neg)return {bg:'#fff0f0',bd:'#c0392b',fg:'#a71930'};             /* 赤。 */
    return {bg:'#fbe9ec',bd:'#c95b6c',fg:'#7f1d2d'};                      /* 赤系の標準特性。 */
  }
  function drawTags(items){ items.forEach(function(o){ const t=o.label, col=tagColor(o);
    c.font='12px sans-serif'; const w=c.measureText(t).width+16;
    c.fillStyle=col.bg; c.strokeStyle=col.bd; c.lineWidth=1;
    c.fillRect(tagx,y,w,20); c.strokeRect(tagx,y,w,20);
    c.fillStyle=col.fg; c.fillText(t,tagx+8,y+3);
    if(o.rem){ c.strokeStyle='#81757a'; c.beginPath(); c.moveTo(tagx+4,y+10); c.lineTo(tagx+w-4,y+10); c.stroke(); }
    tagx+=w+8; if(tagx>W-160){tagx=PAD;y+=26;}
  }); }
  var tagx=PAD;
  if(keepTr.length||remTr.length){ drawTags(keepTr.concat(remTr)); y+=30; }

  function hr(){ c.strokeStyle=imageColor.edge; c.lineWidth=1; c.beginPath(); c.moveTo(PAD,y); c.lineTo(W-PAD,y); c.stroke(); y+=12; }
  function sectionTitle(t){ c.fillStyle=imageColor.dim; c.font='bold 13px sans-serif'; c.fillText(t,PAD,y); y+=22; }

  // 評価。
  hr(); sectionTitle('通算評価');
  c.font='bold 16px sans-serif'; c.fillStyle=imageColor.accent;
  tiers.forEach(function(t){ c.fillText('★ '+t,PAD,y); y+=24; }); y+=6;

  // 通算成績表。
  hr(); sectionTitle('通算成績');
  const cols=isP?[['League',90],['Yrs',36],['G',48],['IP',54],['W',36],['L',36],['SV',48],['HLD',48],['SO',52],['BB',48],['ERA',52],['WHIP',54]]
                :[['League',80],['Yrs',34],['G',40],['PA',46],['AVG',48],['OBP',48],['SLG',48],['OPS',48],['H',44],['HR',38],['RBI',44],['SB',40],['DEF',40]];
  function row(cells,head){ let x=PAD; c.font=(head?'bold ':'')+'13px monospace'; c.fillStyle=head?imageColor.dim:imageColor.text;
    cells.forEach(function(cell,i){ c.fillText(String(cell),x,y); x+=cols[i][1]; }); y+=head?24:26; }
  row(cols.map(cc=>cc[0]),true);
  leagues.forEach(function(b){ const st=S.stats[b];
    if(isP){ const era=st.IP>0?(st.ER*9/st.IP).toFixed(2):'-'; const whip=st.IP>0?((st.H+st.BB)/st.IP).toFixed(2):'-';
      row([LG_N[b],st.yr,st.G,fmtIP(st.IP),st.W,st.L,st.SV||0,st.HLD||0,st.SO,st.BB||0,era,whip]); }
    else{
      const obpN = st.PA>0 ? (st.H+st.BB)/st.PA : 0;
      const slgN = slgOf(st);
      const avg = st.AB>0 ? (st.H/st.AB).toFixed(3).replace(/^0/,'') : '-';
      const obp = st.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-';
      const slg = st.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-';
      const ops = st.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
      row([LG_N[b],st.yr,st.G,st.PA,avg,obp,slg,ops,st.H,st.HR,st.RBI,st.SB,(st.DEF>0?'+':'')+(st.DEF||0)]); } });
  y+=6;

  // 国際大会通算成績。
  if(S.intlCount>0){ const IS=S.intlStat;
    hr(); sectionTitle('国際大会通算（日本代表 '+S.intlCount+' 大会）');
    const rowIntl=(cells,head)=>{ let x=PAD; c.font=(head?'bold ':'')+'13px monospace'; c.fillStyle=head?imageColor.dim:imageColor.text;
      cells.forEach(function(cell,i){ c.fillText(String(cell),x,y); x+=ic[i][1]; }); y+=head?24:28; };
    var ic;
    if(isP){ const era=IS.IP>0?(IS.ER*9/IS.IP).toFixed(2):'-';
      ic=[['',110],['G',80],['IP',86],['W',60],['SV',72],['SO',80],['ERA',80]];
      rowIntl(['', 'G', 'IP', 'W', 'SV', 'SO', 'ERA'], true);
      rowIntl(['',IS.G,fmtIP(IS.IP),IS.W,IS.SV,IS.SO,era],false);
    } else { const avg=IS.AB>0?(IS.H/IS.AB).toFixed(3).replace(/^0/,''):'-';
      ic=[['',110],['G',76],['PA',76],['AVG',76],['H',72],['HR',60],['RBI',72]];
      rowIntl(['', 'G', 'PA', 'AVG', 'H', 'HR', 'RBI'], true);
      rowIntl(['',IS.G,IS.PA,avg,IS.H,IS.HR,IS.RBI],false);
    }
    y+=6;
  }

  // 栄誉(横2列,長文は自動改行)。
  hr(); sectionTitle('通算タイトル（'+honors.length+' 件）');
  c.font='13px sans-serif'; c.fillStyle=imageColor.soft;
  let startY = y;
  let currY = startY;
  honorBlocks.forEach(function(b, i){
    const isRightCol = i >= rows2;
    if(i === rows2) currY = startY;
    const hx = PAD + (isRightCol ? colW : 0);
    b.forEach(line => { c.fillText(line, hx, currY); currY += 23; });
  });
  y += honorsTotalHeight + 8;

  // 年表(アマチュアとプロに分ける表格)。
  if(amaLogs.length > 0){
    hr(); sectionTitle('キャリア年表（アマチュア成績）');
    const hc=[['年',48],['年齢',40],['チーム',150],['成績',W-PAD*2-238]];
    let x=PAD; c.font='bold 12px monospace'; c.fillStyle=imageColor.dim;
    hc.forEach(function(h){ c.fillText(h[0],x,y); x+=h[1]; }); y+=20;
    c.font='11px monospace';
    amaLogs.forEach(function(r){ x=PAD; c.fillStyle=r.inj?imageColor.bad:imageColor.text;
      const cells=[String(r.y),String(r.age),r.tm,r.line];
      cells.forEach(function(cell,i){
        let t=String(cell); const maxw=hc[i][1]-8;
        while(c.measureText(t).width>maxw&&t.length>1)t=t.slice(0,-1);
        c.fillText(t,x,y); x+=hc[i][1]; }); y+=20; });
    y+=4;
  }
  if(proLogs.length > 0){
    hr(); sectionTitle('キャリア年表（プロ成績）');
    const hc = isP
      ? [['年',46],['年齢',36],['チーム',124],['G',45],['IP',55],['W',36],['L',36],['SV',42],['HLD',42],['SO',46],['BB',46],['ERA',52],['WHIP',54]]
      : [['年',46],['年齢',34],['チーム',120],['G',36],['PA',42],['AVG',46],['OBP',46],['SLG',46],['OPS',46],['H',40],['HR',36],['RBI',40],['SB',36],['DEF',40]];
    let x=PAD; c.font='bold 12px monospace'; c.fillStyle=imageColor.dim;
    hc.forEach(function(h){ c.fillText(h[0],x,y); x+=h[1]; }); y+=20;
    c.font='12px monospace';
    proLogs.forEach(function(r){ x=PAD; c.fillStyle=r.inj?imageColor.bad:imageColor.text;
      const tmS=r.tm;
      const s = r.st || {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0};
      let cells = [];
      if(isP){
        const era = s.IP>0 ? (s.ER*9/s.IP).toFixed(2) : '-';
        const whip = s.IP>0 ? ((s.H+s.BB)/s.IP).toFixed(2) : '-';
        cells=[String(r.y), String(r.age), tmS, String(s.G), fmtIP(s.IP), String(s.W), String(s.L), String(s.SV||0), String(s.HLD||0), String(s.SO), String(s.BB||0), era, whip];
      } else {
        const obpN = s.PA>0 ? (s.H+s.BB)/s.PA : 0;
        const slgN = slgOf(s);
        const avg = s.AB>0 ? (s.H/s.AB).toFixed(3).replace(/^0/,'') : '-';
        const obp = s.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-';
        const slg = s.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-';
        const ops = s.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
        cells=[String(r.y), String(r.age), tmS+(r.p?'·'+r.p:''), String(s.G), String(s.PA), avg, obp, slg, ops, String(s.H), String(s.HR), String(s.RBI), String(s.SB), String(s.DEF>0?'+'+s.DEF:s.DEF||0)];
      }
      cells.forEach(function(cell,i){
        let t=String(cell); const maxw=hc[i][1]-8;
        while(c.measureText(t).width>maxw&&t.length>1)t=t.slice(0,-1);
        c.fillText(t,x,y); x+=hc[i][1]; });
      y+=20;
    });
    y+=4;
  }

  c.fillStyle=imageColor.accent; c.font='bold 16px sans-serif';
  c.fillText('固定年俸 '+fmtMoney(S.careerBaseSalary||0)+'　出来高 '+fmtMoney(S.careerIncentive||0),PAD,y); y+=26;
  c.fillText('契約金 '+fmtMoney(S.careerSigningBonus||0)+'　買い取り '+fmtMoney(S.careerBuyout||0),PAD,y); y+=26;
  c.fillText('社会人給与 '+fmtMoney(S.corpIncome||0)+'　生涯総収入 '+fmtMoney(Math.round(S.careerEarnings)),PAD,y); y+=26;
  c.fillStyle=imageColor.dim; c.font='11px monospace'; c.fillText('seed: '+SEED,PAD,H-40);
  c.textAlign='right'; c.fillText(VERSION,W-PAD,H-40); c.textAlign='left';

  const url=cv.toDataURL('image/png');
  const fileName='野球人生リザルト_'+S.name+'.png';
  out.innerHTML=`<img src="${url}" style="width:100%;border-radius:8px" alt="結算圖">
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn main" id="sh-save" style="flex:1">💾 保存／画像を共有</button>
      <button class="btn" id="sh-dl" style="flex:1">端末へダウンロード</button>
    </div>
    <div class="statline" style="margin-top:6px">ボタンが使えない場合は,画像を長押しして保存できます</div>`;
  /* ダウンロードリンク（PC・予備）。 */
  out.querySelector('#sh-dl').onclick=()=>{ const a=document.createElement('a'); a.href=url; a.download=fileName;
    document.body.appendChild(a); a.click(); a.remove(); };
  /* 共有：Web Shareを優先(写真へ保存可能),非対応時はダウンロードへ切り替える。 */
  out.querySelector('#sh-save').onclick=async ()=>{
    try{
      const blob=await (await fetch(url)).blob();
      const file=new File([blob],fileName,{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:'野球人生リザルト',text:S.name+' 野球人生'});
        return;
      }
    }catch(e){ if(e&&e.name==='AbortError')return; /* ユーザーによるキャンセル時はフォールバックしない。 */ }
    /* Web Share非対応時はダウンロードへ切り替える。 */
    const a=document.createElement('a'); a.href=url; a.download=fileName;
    document.body.appendChild(a); a.click(); a.remove();
  };
}
/* 開始設定。 */
(function(){ const t=document.getElementById('act-toggle');
  if(t)t.onclick=()=>{ document.getElementById('act').classList.toggle('collapsed');
    t.textContent=document.getElementById('act').classList.contains('collapsed')?'⌃ 選択肢を展開':'⌄ 選択肢を閉じる'; };
})();
let selPos='P';
$('seed-show').value=SEED;
$('seed-re').onclick=e=>{e.preventDefault();SEED=(0).toString(36).slice(2,10);$('seed-show').value=SEED;};
document.querySelectorAll('#seg-pos button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#seg-pos button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); selPos=b.dataset.v;
});
$('btn-start').onclick=()=>{
  const defName=(selPos==='P')?'投山翔太':(selPos==='IF')?'守田巧':(['走川隼人','強肩剛'][Math.floor((0)*2)]); /* に応じて守備位置既定名(外野/捕手隨機)。 */
  const nm=$('in-name').value.trim()||defName;
  const sv=$('seed-show').value.trim(); if(sv)SEED=sv; /* プレイヤーはシード値を直接入力できる。 */
  history.replaceState(null,'','?seed='+encodeURIComponent(SEED));
  seedInit(SEED);
  S=newState(nm,selPos,null);
  S.teamName=function(){
    if(!this.orgTeam)return '';
    if(this.lv==='MLB')return this.orgTeam;
    if(LV[this.lv].org==='MiLB')return this.orgTeam+({R:'ルーキーリーグ',A1:'1A',A2:'2A',A3:'3A'}[this.lv]);
    if(this.lv==='CPBL1'||this.lv==='NPB1')return this.orgTeam;
    return this.orgTeam+'二軍';
  };
  $('start').style.display='none';
  $('board').style.display=''; $('act').style.display='';
  card('info','選手誕生',`${S.year}年春、${POSN[S.pos]}の<b class="hl">${S.name}</b>は<b class="hl">${S.team}</b>野球部へ入部した。3年後の進路は自分で選ぶ。<br><span style="color:var(--dim);font-size:12px">ヒント：22歳までに「6」を累計5回出すと、隠し特性が覚醒する。</span>`);
  startYear();
};

/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */
(() => {
  'use strict';
  const DATA = JP_DATA;
  const LEGACY = { board, movement, phasePre, phaseMid, proSeason, endGame };

  Object.assign(ABL,{sta:'スタミナ',vel:'球速',ctl:'制球',brk:'変化球',con:'ミート',pow:'パワー',spd:'走力',eye:'選球眼',rng:'守備範囲',fld:'捕球',arm:'肩力',cat:'リード'});
  Object.assign(POSN,{P:'投手',C:'捕手',IF:'内野手',OF:'外野手'});
  Object.assign(DPN,{SS:'遊撃手','2B':'二塁手','3B':'三塁手','1B':'一塁手',CF:'中堅手',RF:'右翼手',LF:'左翼手',DH:'指名打者',C:'捕手'});
  Object.assign(LV,{
    HS:{n:'高校野球',par:38,min:0,g:20,org:'AMATEUR'}, U:{n:'大学野球',par:44,min:0,g:24,org:'AMATEUR'},
    CORP:{n:'社会人野球',par:37,min:32,g:45,org:'CORP'}, IND:{n:'独立リーグ',par:35,min:30,g:70,org:'IND',top:'IND'},
    NPB_DEV:{n:'NPB育成',par:35,min:30,g:100,org:'NPB'}, NPB2:{n:'NPB二軍',par:52,min:47,g:100,org:'NPB'}, NPB1:{n:'NPB一軍',par:58,min:53,g:143,org:'NPB',top:'NPB'},
    KBO2:{n:'KBOフューチャース',par:39,min:35,g:90,org:'KBO'}, KBO1:{n:'KBO一軍',par:50,min:47,g:144,org:'KBO',top:'KBO'},
    CPBL2:{n:'台湾プロ野球二軍',par:39,min:35,g:80,org:'CPBL'}, CPBL1:{n:'台湾プロ野球一軍',par:48,min:45,g:120,org:'CPBL',top:'CPBL'},
    R:{n:'ルーキーリーグ',par:43,min:39,g:55,org:'MiLB'}, A1:{n:'1A',par:47,min:43,g:110,org:'MiLB'}, A2:{n:'2A',par:51,min:47,g:120,org:'MiLB'}, A3:{n:'3A',par:56,min:52,g:130,org:'MiLB'}, MLB:{n:'メジャーリーグ',par:63,min:58,g:162,org:'MLB',top:'MLB'}
  });
  Object.assign(PATHS,{NPB:['NPB_DEV','NPB2','NPB1'],KBO:['KBO2','KBO1'],CPBL:['CPBL2','CPBL1'],MiLB:['R','A1','A2','A3','MLB'],MLB:['R','A1','A2','A3','MLB'],IND:['IND'],CORP:['CORP']});
  if(typeof LG_N==='object')Object.assign(LG_N,{NPB:'NPB',KBO:'KBO',CPBL:'CPBL',MLB:'MLB',MINOR:'マイナー／二軍',IND:'独立',CORP:'社会人'});
  if(typeof TIER_TH==='object')Object.assign(TIER_TH,{NPB:[8000,5800,3000,1800],MLB:[8500,6500,3600,2000],KBO:[8200,5900,3000,1800],CPBL:[8500,6000,3100,1800],IND:[3000,1800,900,400],CORP:[3000,1800,900,400]});

  window.TEAM_MASTER = Object.freeze(Object.fromEntries(DATA.teams.map(x=>[x.teamId,Object.freeze(x)])));
  for(const t of DATA.teams){ if(t.color)TEAM_COLOR[t.teamId]=t.color; }

  function normalizeSeed(raw){
    return [...String(raw??'').normalize('NFKC').trim().replace(/[\u0000-\u001f\u007f-\u009f]/g,'')].slice(0,24).join('');
  }
  function fnv1a32(str){ let h=0x811C9DC5; for(const b of new TextEncoder().encode(str)){h^=b;h=Math.imul(h,0x01000193)>>>0;} return h>>>0; }
  function generateSeed(){ const a=new Uint32Array(2);crypto.getRandomValues(a);return (a[0].toString(36)+a[1].toString(36)).slice(0,8); }
  function deriveSeedInt(seed,salt){ return fnv1a32('v1\0'+seed+'\0'+salt); }
  function deriveDefaultName(seed,pos){ const names={P:['投山翔太'],C:['強肩剛'],IF:['守田巧'],OF:['走川隼人']}[pos];return names[deriveSeedInt(seed,'defaultName:'+pos)%names.length]; }
  function normalizePlayerName(raw,seed,pos){ const n=[...String(raw??'').normalize('NFKC').trim().replace(/[\u0000-\u001f\u007f-\u009f]/g,'')].slice(0,10).join('');return n||deriveDefaultName(seed,pos); }
  function escapeHTML(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function teamRec(id){return id?window.TEAM_MASTER[id]||null:null;}
  function teamDisplay(id,lv){ const t=teamRec(id);if(!t)return'';if(['NPB_DEV','NPB2','KBO2','CPBL2','R','A1','A2','A3'].includes(lv))return t.name+' '+LV[lv].n;return t.name; }
  function listByOrg(org){ const o=org==='MiLB'?'MLB':org;return DATA.teams.filter(t=>t.org===o&&t.active).sort((a,b)=>a.order-b.order); }
  function pickRecord(a){return a[Math.floor(R()*a.length)];}

  seedInit = function(seed){ S.rngState=fnv1a32('v1:'+seed)||0x6D2B79F5; _s=S.rngState|0; };
  R = function(){ S.rngState=(S.rngState+0x6D2B79F5)>>>0;let t=S.rngState;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);_s=S.rngState|0;return((t^(t>>>14))>>>0)/4294967296; };

  teamListOf = function(org){return listByOrg(org).map(t=>t.teamId);};
  teamChampRate = function(id){ const t=teamRec(id);if(!t)return 5;const base={S:14,A:9,B:5}[t.strength]||7;return clamp(base+(fnv1a32(id+':'+S.year)%7)-3,2,24); };
  salaryFor = function(lv,d){
    const m={CORP:[4200000,0,0,4200000,9000000],IND:[2400000,100000,0,1800000,5000000],NPB_DEV:[3000000,0,0,3000000,5000000],NPB2:[5000000,300000,0,5000000,16000000],NPB1:[16000000,4000000,3000000,16000000,600000000],KBO2:[8000000,400000,0,8000000,30000000],KBO1:[40000000,8000000,2000000,40000000,1500000000],CPBL2:[4000000,200000,0,4000000,12000000],CPBL1:[12000000,3000000,800000,12000000,400000000],R:[3000000,0,0,3000000,3000000],A1:[4000000,0,0,4000000,4000000],A2:[6000000,0,0,6000000,6000000],A3:[10000000,500000,0,10000000,30000000],MLB:[120000000,30000000,12000000,120000000,6000000000]}[lv];
    if(!m)throw new Error('UNKNOWN_SALARY_LEVEL:'+lv);if(lv==='CORP')return Math.round(clamp(4200000+(ovr()-40)*150000,4200000,9000000)/10000)*10000;
    return roundToTenThousandYen(calculateSalaryCurve(d,{base:m[0],linear:m[1],quadratic:m[2],min:m[3],max:m[4]}));
  };

  let pendingOffseasonSalary=null;
  function migrateSalaryV130State(){
    if(S._salaryV130Migrated)return;
    S.serviceTime=migrateServiceTime(S);S.marketInjury=S.marketInjury||'HEALTHY';S.lastArbitration=S.lastArbitration||null;S.serviceTimeAccruedYear=S.serviceTimeAccruedYear??null;S._salaryV130Migrated=true;
  }
  function migrateSalaryV140State(){
    migrateSalaryV130State();
    S.careerBaseSalary=Number(S.careerBaseSalary)||0;S.careerIncentive=Number(S.careerIncentive)||0;S.yearlyIncentivePaid=S.yearlyIncentivePaid&&typeof S.yearlyIncentivePaid==='object'?S.yearlyIncentivePaid:{};S.lastFaMarket=S.lastFaMarket||null;
    if(S.ct&&S.ct.schemaVersion!==3){S.ct=normalizeContract(S.ct,{currentYear:S.year,currentSalary:S.currentSalary,org:S.org,teamId:S.orgTeamId});S.currentSalary=S.ct.annualSalary;}
    S._salaryV140Migrated=true;
  }
  const serviceYearsFor=org=>Number(S.serviceTime?.[org])||0;
  const contractStageFor=org=>getContractStage({org,serviceYears:serviceYearsFor(org),faEligible:org==='NPB'?serviceYearsFor('NPB')>=8:Boolean(S.faElig)});
  const currentMarketResult=()=>{
    const result=calculateMarketRating(S.salaryEvaluationHistory||[],{marketInjury:S.marketInjury||'HEALTHY'});
    return result.components.length?{...result,source:'SALARY_EVALUATION_HISTORY'}:{marketRating:Number(S.lastD)||0,components:[],source:'LEGACY_RATING_FALLBACK'};
  };
  const currentMarketRating=()=>currentMarketResult().marketRating;
  const salaryCandidate=({sourceLevel=S.lv,targetLevel=S.lv,rating=currentMarketRating(),contractMult=1,positionMult=dpMult()}={})=>{
    const convertedRating=convertRatingBetweenLevels(rating,sourceLevel,targetLevel,LV);
    const baseSalary=salaryFor(targetLevel,convertedRating);
    return{sourceLevel,targetLevel,sourceRating:rating,convertedRating,baseSalary,contractMult,positionMult,annualSalary:roundToTenThousandYen(baseSalary*contractMult*positionMult)};
  };
  function saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,{decreaseProtectionApplied=false,floorApplied=false,salaryYear=S.year+1}={}){
    const market=currentMarketResult(),history=S.salaryEvaluationHistory||[];
    const marketComponents=market.components.map(item=>({...item,weight:item.normalizedWeight,source:history.find(entry=>entry.year===item.year)?.source||null}));
    const baseDecision=buildSalaryDecision({decisionYear:S.year,salaryYear,decisionType,sourceLevel:candidate.sourceLevel,targetLevel:candidate.targetLevel,previousSalary,finalSalary,sourceMarketRating:candidate.sourceRating,convertedMarketRating:candidate.convertedRating,baseSalary:candidate.baseSalary,contractMultiplier:candidate.contractMult,positionMultiplier:candidate.positionMult,floorApplied,decreaseProtectionApplied,marketComponents,currentEvaluation:S.lastSalaryEvaluation}),marketInjury=S.marketInjury||'HEALTHY';
    const decision=Object.freeze({...baseDecision,org:S.org,contractStage:contractStageFor(S.org),marketInjury,injuryMultiplier:injurySalaryMultiplier(marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),serviceYears:serviceYearsFor(S.org),arbitration:S.lastArbitration?.year===S.year?S.lastArbitration:null});
    S.lastSalaryDecision=decision;S.salaryDecisionHistory=appendSalaryDecision(S.salaryDecisionHistory||[],decision);return decision;
  }
  const salaryDecisionLink=()=>'<button type="button" class="salary-detail-link">内訳を見る</button>';
  const salaryDecisionSummary=()=>{const d=S.lastSalaryDecision;if(!d)return'';const change=d.changeRate===null?'新規契約':`${d.changeAmount>=0?'+':'−'}${fmtMoney(Math.abs(d.changeAmount))}／${d.changeRate>=0?'+':'−'}${Math.abs(d.changeRate*100).toFixed(1)}%`;return`<br><small>前年比 ${change}</small><br><small>主な理由：${d.reasonCodes.slice(0,3).map(salaryReasonLabel).join('、')}</small>`;};
  function bindLatestSalaryDetailLink(){const links=document.querySelectorAll('.salary-detail-link'),link=links[links.length-1];if(link)link.onclick=()=>salaryDetailController.open();}
  salaryDForContract=d=>(S.salaryEvaluationHistory||[]).length?currentMarketRating():Number(d)||0;
  function finalizePendingOffseasonSalary(){
    if(pendingOffseasonSalary===null)return;
    migrateSalaryV130State();
    const baseCandidate=salaryCandidate({contractMult:pendingOffseasonSalary.mult||1}),previousSalary=S.currentSalary,injuryMult=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[]));
    const adjustedMarket=roundToTenThousandYen(baseCandidate.annualSalary*injuryMult),control=calculateControlOffer({marketSalary:adjustedMarket,previousSalary,marketRating:currentMarketRating(),serviceYears:serviceYearsFor(S.org),org:S.org,levelMinimum:salaryFor(S.lv,0)});
    const annualSalary=roundToTenThousandYen(pendingOffseasonSalary.contractType==='CONTROL'?control.protectedSalary:Math.max(adjustedMarket,pendingOffseasonSalary.preventDecrease?previousSalary:0)),candidate={...baseCandidate,contractMult:baseCandidate.contractMult*injuryMult,annualSalary};
    S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:pendingOffseasonSalary.years||1,annualSalary,contractType:pendingOffseasonSalary.contractType||'NORMAL',candidate,startYear:S.year+1});S.currentSalary=S.ct.annualSalary;
    saveSalaryDecision('RENEWAL',candidate,previousSalary,S.currentSalary,{decreaseProtectionApplied:S.currentSalary>adjustedMarket,floorApplied:pendingOffseasonSalary.contractType==='CONTROL'&&control.floorApplied});
    pendingOffseasonSalary=null;
    card('info','来季年俸決定',`所属先の確定に伴い、来季の年俸は<b class="hl">${fmtMoney(S.currentSalary)}</b>となった。${salaryDecisionSummary()} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();
    board(2);
  }
  function applyLevelSalary(fromLv,toLv,preventDecrease){
    const samePath=Object.values(PATHS).some(path=>path.includes(fromLv)&&path.includes(toLv));
    if(!LV[fromLv]||!LV[toLv]||!samePath)return;
    if(!S.ct)return;
    /* 満了済み契約には未払い年がないため、次契約の確定前に年俸を0円へ上書きしない。 */
    if(normalizeContract(S.ct).remainingYears===0)return;
    const previousSalary=S.currentSalary;let changed=false;
    if(preventDecrease){const minimumSalary=salaryFor(toLv,0);S.ct=applyLevelMinimumToUnpaidSchedule(S.ct,minimumSalary,S.year+1);S.currentSalary=S.ct.annualSalary;if(S.currentSalary!==previousSalary){changed=true;const candidate=salaryCandidate({sourceLevel:fromLv,targetLevel:toLv,contractMult:S.ct.contractMultiplier||1});saveSalaryDecision('PROMOTION',{...candidate,baseSalary:minimumSalary,annualSalary:S.currentSalary},previousSalary,S.currentSalary,{decreaseProtectionApplied:true,floorApplied:true});}}
    else S.currentSalary=S.ct.annualSalary;
    pendingOffseasonSalary=null;
    card('info','来季年俸決定',`${preventDecrease?'昇格後の最低保障を確認':'降格後も現契約を維持'}し、来季の年俸は<b class="hl">${fmtMoney(S.currentSalary)}</b>となった。${changed?salaryDecisionSummary()+' '+salaryDecisionLink():''}`);bindLatestSalaryDetailLink();
  }
  applyPromotionSalary=function(fromLv,toLv){applyLevelSalary(fromLv,toLv,true);};
  applyDemotionSalary=function(fromLv,toLv){const renewalRequired=contractNeedsRenewal(S.ct);applyLevelSalary(fromLv,toLv,false);if(renewalRequired)markClubInitiatedRenewal(1);};
  markClubInitiatedRenewal=function(years){
    pendingOffseasonSalary={preventDecrease:true,years:1,mult:1,contractType:'CONTROL'};
  };
  appendContractExtension=function(years,mult){const candidate=salaryCandidate({contractMult:mult}),oldEnd=S.ct.endYear,oldGuaranteed=S.ct.guaranteedTotal,incentive=createIncentiveTerms({org:S.org,annualSalary:candidate.annualSalary});S.ct=appendExtension(S.ct,{signedYear:S.year,startYear:S.year+1,years,annualSalary:candidate.annualSalary,contractType:'EXTENSION',incentive});saveSalaryDecision('NEW_CONTRACT',candidate,S.currentSalary,candidate.annualSalary,{salaryYear:oldEnd+1});card('gold','延長契約の内訳',`現契約：${S.ct.startYear}～${oldEnd}年　年俸${fmtMoney(S.currentSalary)}<br>延長契約：${oldEnd+1}～${S.ct.endYear}年　年俸${fmtMoney(candidate.annualSalary)}<br>延長分総額：${fmtMoney(S.ct.guaranteedTotal-oldGuaranteed)}<br>合計保障：${fmtMoney(S.ct.guaranteedTotal)} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();};
  function saveSalaryEvaluation(entry){
    entry.marketInjury=S.marketInjury||'HEALTHY';
    S.salaryEvaluationHistory=appendSalaryEvaluation(S.salaryEvaluationHistory||[],entry);
    S.lastSalaryEvaluation=entry;
  }
  recordSalaryEvaluation=function(st){
    const common={year:S.year,age:S.age,level:S.lv,org:S.org,role:S.role,position:S.dpos,playerType:S.pos,baseD:st.baseD,stats:st,gamesInLevel:LV[S.lv]?.g,baseline:MARKET_BASELINES[S.lv],honors:S.honors};
    if(hasActualPerformanceData(S.pos,st)){
      const stats=S.pos==='P'?st:{...st,SLG:slgOf(st)};
      saveSalaryEvaluation(buildSalaryEvaluationEntry({...common,stats}));
      return;
    }
    const payD=salaryEvaluationD(Number.isFinite(st.baseD)?st.baseD:(S.lastD||0),S.honors,S.year);
    saveSalaryEvaluation({schemaVersion:1,year:S.year,age:S.age,level:S.lv,org:S.org,role:S.role||null,position:S.dpos||null,baseD:payD,performanceAdjustment:0,workloadAdjustment:0,awardAdjustment:0,payD,sampleStatus:'INSUFFICIENT',reasons:['LEGACY_RATING_FALLBACK'],source:'LEGACY_RATING_FALLBACK',actualPerformanceAvailable:false,workloadAvailable:false,fallbackReason:'PERFORMANCE_DATA_NOT_AVAILABLE'});
  };
  recordIndependentSalaryEvaluation=function(results){
    /* 独立リーグでは正式な個人成績を生成していないため、大会結果を個人成績に見立てず既存評価だけを使う。 */
    const entry=buildIndependentLeagueFallbackEntry({year:S.year,age:S.age,level:S.lv,baseD:undefined,legacyRating:salaryEvaluationD(S.lastD||0,S.honors,S.year),tournamentResults:results});
    saveSalaryEvaluation(entry);
  };

  const advanceWithoutSalaryFinalization=advance;
  advance=function(){finalizePendingOffseasonSalary();advanceWithoutSalaryFinalization();};

  newState = function(name,pos){
    const ab={};POS_AB[pos].forEach(k=>ab[k]=ri(20,32));if(pos==='P'){ab.vel+=ri(0,6);ab.brk+=ri(0,4);}else{ab.con+=ri(0,6);ab.pow+=ri(0,4);}
    const pot={},sh=POS_AB[pos].slice();for(let i=sh.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[sh[i],sh[j]]=[sh[j],sh[i]];}
    sh.forEach((k,i)=>pot[k]=pos==='P'?(i===0?ri(70,80):i===1?ri(58,68):i===2?ri(50,60):ri(44,54)):(i===0?ri(72,80):i===1?ri(64,74):i===2?ri(56,68):ri(46,62)));
    const tierRoll=Math.floor(R()*100),tier=tierRoll<30?'S':tierRoll<80?'A':'B',schools=DATA.highSchools.filter(x=>x.tier===tier),school=pickRecord(schools.length?schools:DATA.highSchools);
    const state={name,pos,role:null,seed:SEED,version:VERSION,rngState:S.rngState,age:16,year:2026,stage:'HS',stageYr:1,lv:'HS',org:'AMATEUR',pot,ab,team:school.name,schoolId:school.schoolId,schoolTier:tier,senbatsuEligibleYear:null,entryRoute:'HS',orgTeamId:null,teamTally:{NPB:{},KBO:{},CPBL:{},MLB:{},IND:{},CORP:{}},
      traits:{genius:false,glass:false,iron:false,scum:false,late:false,disc:false,academy:false,intlace:false,franchise:false,clutch:false,phoenix:false,combo:false,onetool:false,rubber:false,legend:false,yips:false,distract:false,cancer:false,ambience:false,goldcloth:false,thief:false,mrteam:false,confidante:false,smallschool:false,grinder:false,rainbow:false,taiwan:false},removed:[],cntSave:0,cntSaveWin:0,cntSnack:0,cntBoldWin:0,cntBoldFail:0,samePick:0,samePickKey:null,teamYears:0,six:0,bigInj:0,ironStreak:0,npbYears:0,npbDevYears:0,corpYears:0,indYears:0,injNext:0,tmpInj:0,rehab:0,currentSalary:0,careerEarnings:0,careerBaseSalary:0,careerSigningBonus:0,careerIncentive:0,careerBuyout:0,corpIncome:0,yearlyIncentivePaid:{},lastFaMarket:null,lastSalaryPaidYear:null,salaryEvaluationHistory:[],lastSalaryEvaluation:null,lastSalaryDecision:null,salaryDecisionHistory:[],contractSequence:0,serviceTime:{NPB:0,MLB:0,KBO:0,CPBL:0},serviceTimeAccruedYear:null,marketInjury:'HEALTHY',lastArbitration:null,_salaryV130Migrated:true,_salaryV140Migrated:true,pool:0,seasonFactor:1,stats:{NPB:null,KBO:null,CPBL:null,MLB:null,MINOR:null,IND:null,CORP:null},honors:[],intlCount:0,intlCompletedKeys:{},intlLastEventKey:null,intlDispatchStatus:null,intlDeclinedCount:0,intlStat:{G:0,PA:0,AB:0,H:0,HR:0,RBI:0,IP:0,SO:0,ER:0,W:0,SV:0},intlBest:null,dpos:null,dposYears:{},roleYears:{},tradeRefuse:0,champThisTeam:false,svc:0,svcOrg:null,faElig:false,npbRosterDays:0,npbFaSeasons:0,faType:null,faUsed:false,faMarketKey:null,tradeHeat:0,complainCount:0,demotionRefused:false,tj:0,tjCount:0,effort:'普通投',tjSuccess:0,love:{st:'single',partner:null,kids:0,caught:0,affairs:0,exes:[],dyrs:0,datedTimes:0},log:[],ct:null,draftRights:null,domesticTournamentLog:[],domesticTournamentStats:{},domesticCompletedKeys:{},done:false};
    Object.defineProperty(state,'salary',{get(){return this.careerEarnings;},set(v){this.careerEarnings=v;},enumerable:false});
    Object.defineProperty(state,'orgTeam',{get(){return this.orgTeamId;},set(v){this.orgTeamId=teamRec(v)?v:(DATA.teams.find(t=>t.name===v)?.teamId||v);},enumerable:false});
    state.teamName=function(){return teamDisplay(this.orgTeamId,this.lv);};return state;
  };

  const nextContractId=(org,teamId,signedYear)=>{S.contractSequence=(Number(S.contractSequence)||0)+1;return`${org}:${teamId}:${signedYear}:${String(S.contractSequence).padStart(3,'0')}`;};
  function fixedContract({org,teamId,years,annualSalary,contractType='NORMAL',candidate,startYear=S.year+1,incentive,offerBreakdown}){return createContract({contractId:nextContractId(org,teamId,S.year),org,teamId,signedYear:S.year,startYear,years,annualSalary,contractType,signedMarketRating:candidate?.convertedRating??currentMarketRating(),positionMultiplierAtSigning:candidate?.positionMult??dpMult(),contractMultiplier:candidate?.contractMult??1,incentive:incentive===undefined?createIncentiveTerms({org,annualSalary}):incentive,offerBreakdown:offerBreakdown??null});}

  signTo = function(org,lv,teamId,yrs,mult,decisionType,options={}){ const rec=teamId?teamRec(teamId):pickRecord(listByOrg(org));if(!rec)throw new Error('INVALID_TEAM_MASTER');const sourceLevel=S.lv,sourceStage=S.stage,sourceOrg=S.org,previousSalary=S.currentSalary||0,changed=rec.teamId!==S.orgTeamId,contractYears=yrs||2,contractMult=mult||1;const candidate=salaryCandidate({sourceLevel:sourceStage==='PRO'&&LV[sourceLevel]?sourceLevel:lv,targetLevel:lv,rating:sourceStage==='PRO'?currentMarketRating():0,contractMult});const annualSalary=options.annualSalary??candidate.annualSalary,contractType=options.contractType||'NORMAL',startYear=options.startYear??S.year+1;S.org=org;S.lv=lv;S.stage='PRO';S.stageYr=0;S.team='';S.orgTeamId=rec.teamId;if(changed){S.teamYears=0;S.champThisTeam=false;S.champTeam=null;}S.ct=fixedContract({org,teamId:rec.teamId,years:contractYears,annualSalary,contractType,candidate,startYear,incentive:options.incentive,offerBreakdown:options.offerBreakdown});S.currentSalary=S.ct.annualSalary;pendingOffseasonSalary=null;const inferred=decisionType||(sourceStage!=='PRO'?'NEW_CONTRACT':sourceOrg==='NPB'&&org!=='NPB'?'OVERSEAS':sourceOrg!=='NPB'&&org==='NPB'?'RETURN':'NEW_CONTRACT');saveSalaryDecision(inferred,{...candidate,baseSalary:annualSalary,annualSalary},previousSalary,S.currentSalary);card('info','契約',`<b class="hl">${escapeHTML(rec.name)}</b>と${S.ct.years}年契約を結んだ（年俸 ${fmtMoney(S.currentSalary)}）。${salaryDecisionSummary()} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();board(2); };

  /* トレードは同一組織の固定球団ID間だけで行い、移籍先を必ず通知する。 */
  doTradeExec = function(){
    const from=teamRec(S.orgTeamId),candidates=listByOrg(S.org).filter(t=>t.teamId!==S.orgTeamId);
    if(!from||!candidates.length){card('info','トレード見送り','移籍可能な球団がないため、トレードは成立しなかった。');return null;}
    const to=pickRecord(candidates);S.teamYears=0;S.champThisTeam=false;S.champTeam=null;S.orgTeamId=to.teamId;
    if(S.ct)S.ct=transferContract(S.ct,{org:S.org,teamId:to.teamId});
    S.lastTrade={year:S.year,fromTeamId:from.teamId,toTeamId:to.teamId};
    card('info','トレード成立',`<b class="hl">${escapeHTML(from.name)}</b>から<b class="hl">${escapeHTML(to.name)}</b>へ移籍した。`);board(1);
    return S.lastTrade;
  };

  stageLabel = function(){if(S.stage==='HS')return '高校'+S.stageYr+'年';if(S.stage==='U')return '大学'+S.stageYr+'年';if(S.stage==='CORP')return '社会人'+(S.corpYears+1)+'年目';if(S.stage==='IND')return '独立リーグ'+(S.indYears+1)+'年目';return LV[S.lv]?.n||S.stage;};
  board = function(phase){LEGACY.board(phase);$('bd-name').firstChild.textContent=S.name;$('bd-sal').textContent=Math.round((S.currentSalary||0)/10000).toLocaleString();const lbl=$('bd-sal')?.nextElementSibling;if(lbl)lbl.textContent='現在年俸（万円）';};

  function setSchool(kind){const a=kind==='U'?DATA.universities:DATA.highSchools,r=pickRecord(a);S.schoolId=r.schoolId;S.schoolTier=r.tier;S.team=r.name;S.lv=kind;S.org='AMATEUR';}
  function setAmateur(stage){S.stage=stage;S.stageYr=0;S.lv=stage;S.org=stage;S.orgTeamId=pickRecord(listByOrg(stage)).teamId;S.team=teamRec(S.orgTeamId).name;if(stage==='CORP')S.corpYears=0;else S.indYears=0;}
  function enterDraftPath(from){runDraft(false,result=>{if(result==='signed'){advance();return;}if(isDraftFallbackResult(result)){draftFallback(from);return;}throw new Error('UNKNOWN_DRAFT_RESULT:'+result);});}
  function draftFallback(from){const opts=[];if(from==='HS')opts.push({t:'大学へ進学',main:true,f:()=>{S.stage='U';S.stageYr=0;setSchool('U');advance();}});opts.push({t:'社会人野球へ',f:()=>{setAmateur('CORP');advance();}},{t:'独立リーグへ',f:()=>{setAmateur('IND');advance();}},{t:'野球をやめる',warn:true,f:()=>endGame('ドラフト指名漏れを機に現役を退いた。')});choose('指名漏れ、その後',opts);}

  runDraft = function(fromSchool,cb){const o=ovr(),score=o+Math.max(0,22-S.age)*2+ri(-4,4);let rd=0,type='ROSTER';if(score>=60)rd=1;else if(score>=55)rd=2;else if(score>=50)rd=3;else if(score>=46)rd=4;else if(score>=42)rd=ri(5,6);else if(score>=37){rd=ri(1,3);type='DEVELOPMENT';}
    if(!rd){card('bad','NPBドラフト指名漏れ',`最後まで名前は呼ばれなかった（総合${o}）。`);cb('fail');return;}
    const rec=pickRecord(listByOrg('NPB')),bonus=type==='DEVELOPMENT'?ri(200,500)*10000:rd===1?ri(8000,10000)*10000:rd===2?ri(6000,8000)*10000:rd===3?ri(4000,6000)*10000:ri(2000,5000)*10000,lv=type==='DEVELOPMENT'?'NPB_DEV':'NPB2';S.draftRights={teamId:rec.teamId,round:rd,type,deadline:S.year+'-03-31',status:'NEGOTIATING'};
    const accept=()=>{const terms=draftSigningTerms(type,rd),result=acceptDraftSelection({state:S,type,round:rd,teamId:rec.teamId,bonus,sign:()=>signTo('NPB',lv,rec.teamId,1,1,'NEW_CONTRACT',{annualSalary:terms.rookieSalary,contractType:terms.contractType,startYear:S.year+1})});card('gold','NPBドラフト',`${escapeHTML(rec.name)}から${type==='DEVELOPMENT'?'育成':''}${rd}巡目指名。契約金${fmtMoney(bonus)}。 ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();cb(result);};
    choose(`NPBドラフト会議・${escapeHTML(rec.name)}が${type==='DEVELOPMENT'?'育成':''}${rd}巡目で指名`,[{t:'指名を受けて入団',main:true,f:accept},{t:'指名を拒否する',warn:true,s:'交渉権を放棄して別の進路へ',f:()=>cb(declineDraftSelection(S))}]);
  };

  pathChoiceHS = function(){
    const o=ovr(),opts=[
      {t:'NPBドラフトへ',main:true,f:()=>enterDraftPath('HS')},
      {t:'大学へ進学',f:()=>{S.stage='U';S.stageYr=0;setSchool('U');advance();}},
      {t:'社会人野球へ',f:()=>{setAmateur('CORP');advance();}},
      {t:'独立リーグへ',f:()=>{setAmateur('IND');advance();}}
    ];
    if(o>=50){
      const lv=o>=54?'A1':'R';
      opts.push({t:'米国プロ組織と契約する',s:`MLB球団傘下の${LV[lv].n}から挑戦`,f:()=>{
        const pool=listByOrg('MiLB').slice(),offers=[];
        const count=ri(2,3);
        while(offers.length<count&&pool.length)offers.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
        choose('MiLB国際契約オファー',offers.map(rec=>({
          t:`${rec.name}（${LV[lv].n}）`,
          s:'高校卒業後、米国の育成組織からスタート',
          f:()=>{signTo('MiLB',lv,rec.teamId,ri(3,4),1,'NEW_CONTRACT',{contractType:'ROOKIE'});advance();}
        })));
      }});
    }
    choose(`高校卒業・総合能力${o}――人生最初の分岐点`,opts);
  };
  pathChoiceU4 = function(){choose(`大学卒業・総合能力${ovr()}`,[{t:'NPBドラフトへ',main:true,f:()=>enterDraftPath('U')},{t:'社会人野球へ',f:()=>{setAmateur('CORP');advance();}},{t:'独立リーグへ',f:()=>{setAmateur('IND');advance();}},{t:'現役を退く',warn:true,f:()=>endGame('大学卒業を機に現役を退いた。')}]);};

  function cupOnce(key,name,klass,{pointMode='STANDARD'}={}){
    const doneKey=key+':'+S.year;if(S.domesticCompletedKeys[doneKey])return null;
    const bonus=S.schoolTier==='S'?6:S.schoolTier==='A'?2:-2,overall=ovr(),power=overall+bonus+ri(-8,8),national=klass.startsWith('NATIONAL');
    const result=tournamentResult({power,national,overall,pointMode});
    S.pool+=result.points;S.domesticCompletedKeys[doneKey]=true;
    S.domesticTournamentLog.push({year:S.year,key,result:result.result,deemedGames:result.deemedGames,points:result.points,amaD:result.amaD,injury:false});
    if(result.isChampion)S.honors.push(`${S.year} ${name}優勝`);
    return {...result,key,html:`${name}：<b class="hl">${result.result}</b>（能力点+${result.points}）`};
  }
  function qualifierOnce(key,name){
    const doneKey=key+':'+S.year;if(S.domesticCompletedKeys[doneKey])return null;
    const bonus=S.schoolTier==='S'?6:S.schoolTier==='A'?2:-2,result=qualificationResult(ovr()+bonus+ri(-8,8));
    S.domesticCompletedKeys[doneKey]=true;
    S.domesticTournamentLog.push({year:S.year,key,result:result.result,deemedGames:result.deemedGames,points:0,amaD:0,injury:false});
    return {...result,html:`${name}：<b class="hl">${result.result}</b>（能力点なし）`};
  }
  amateurSeason = function(){if(S.seasonFactor===0){card('bad','','今季はリハビリに専念した。');S.log.push({y:S.year,age:S.age,tm:S.team,line:'全休',inj:true});nextStep();return;}const results=[];
    const add=result=>{if(result)results.push(result);return result;};
    if(S.stage==='HS'){
      if(canPlaySenbatsu(S.stageYr,S.senbatsuEligibleYear,S.year)){add(cupOnce('HS_SENBATSU','選抜高校野球大会','NATIONAL6'));S.senbatsuEligibleYear=null;}
      const summer=add(cupOnce('HS_SUMMER_LOCAL','夏の地方大会','LOCAL'));
      if(qualifiesForChampionship(summer))add(cupOnce('HS_KOSHIEN','全国高校野球選手権大会','NATIONAL6'));
      if(canPlayHighSchoolFall(S.stageYr)){const fall=add(cupOnce('HS_FALL','秋季地区大会','LOCAL'));S.senbatsuEligibleYear=nextSenbatsuEligibleYear(fall,S.year);}
    }else if(S.stage==='U'){
      const spring=add(cupOnce('U_SPRING','春季リーグ戦','LEAGUE10',{pointMode:'UNIVERSITY'}));
      if(qualifiesForChampionship(spring))add(cupOnce('U_CHAMP','全日本大学野球選手権大会','NATIONAL5',{pointMode:'UNIVERSITY'}));
      const autumn=add(cupOnce('U_AUTUMN','秋季リーグ戦','LEAGUE10',{pointMode:'UNIVERSITY'}));
      if(qualifiesForChampionship(autumn)){
        const university=DATA.universities.find(record=>record.schoolId===S.schoolId),route=university?.jinguRoute;
        if(qualifiesForUniversityJingu(autumn,route,null))add(cupOnce('U_JINGU','明治神宮大会・大学の部','NATIONAL4',{pointMode:'UNIVERSITY'}));
        else if(route==='PLAYOFF'){const qualifier=add(qualifierOnce('U_JINGU_QUAL','明治神宮大会地区代表決定戦'));if(qualifiesForUniversityJingu(autumn,route,qualifier))add(cupOnce('U_JINGU','明治神宮大会・大学の部','NATIONAL4',{pointMode:'UNIVERSITY'}));}
      }
    }else if(S.stage==='CORP'){
      const jaba=add(cupOnce('JABA_REGIONAL','JABA地区大会','NATIONAL5'));
      const cityQualifier=add(qualifierOnce('CORP_CITY_QUAL','都市対抗地区予選'));
      const city=cityQualifier?.isQualified?add(cupOnce('CORP_CITY','都市対抗野球大会','NATIONAL5')):null;
      let japanQualified=qualifiesForCorporateJapan(jaba,city,null);
      if(!japanQualified){const japanQualifier=add(qualifierOnce('CORP_JAPAN_QUAL','日本選手権地区最終予選'));japanQualified=qualifiesForCorporateJapan(jaba,city,japanQualifier);}
      if(japanQualified)add(cupOnce('CORP_JAPAN','社会人野球日本選手権大会','NATIONAL5'));
    }else{
      const regular=add(cupOnce('IND_REGULAR','独立リーグ公式戦','LEAGUE70'));
      if(qualifiesForChampionship(regular))add(cupOnce('IND_CHAMP','グランドチャンピオンシップ','NATIONAL5'));
    }
    if(S.stage==='IND')recordIndependentSalaryEvaluation(results);
    const rows=results.map(result=>result.html);S.log.push({y:S.year,age:S.age,tm:S.team,line:rows.map(x=>x.replace(/<[^>]+>/g,'')).join('、'),inj:false});card('','国内大会',rows.join('<br>'));maybeIntl(()=>nextStep());};

  function intlEvents(year){const official=DATA.intlEvents.filter(e=>Number(e.startDate.slice(0,4))===year);if(official.length)return official;const out=[];if(year>2026&&(year-2026)%4===0)out.push({eventKey:'WBC:'+year,name:'ワールド・ベースボール・クラシック',startDate:year+'-03-05',endDate:year+'-03-17',status:'ESTIMATED',priority:1});if(year>2027&&(year-2027)%4===0)out.push({eventKey:'P12:'+year,name:'WBSCプレミア12',startDate:year+'-11-10',endDate:year+'-11-21',status:'ESTIMATED',priority:2});return out.sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.priority-b.priority);}
  function intlPhase(e){return Number(e.startDate.slice(5,7))<=6?'PRE':'POST';}
  function intlThreshold(e){return e.eventKey.startsWith('WBC:')?58:55;}
  function intlLevelEligible(e){const wbc=e.eventKey.startsWith('WBC:');return (wbc?['NPB1','MLB','KBO1','CPBL1']:['NPB1','KBO1','CPBL1']).includes(S.lv);}
  function addIntlStats(){const a=S.ab,IS=S.intlStat,g=ri(5,8);IS.G+=g;if(S.pos==='P'){const dd=(a.vel+a.ctl+a.brk)/3-58,ip=+(ri(4,9)+R()*3).toFixed(1),k9=clamp(7.2+dd*.13,4,14),era=clamp(3.7-dd*.16,.8,8);IS.IP=+(IS.IP+ip).toFixed(1);IS.SO+=Math.round(ip/9*k9);IS.ER+=Math.round(era*ip/9);if(chance(45))IS.W++;if(!isSP()&&chance(30))IS.SV++;}else{const dd=(a.con*.5+a.pow*.2+a.eye*.18+a.spd*.12)-58,pa=g*ri(3,4),ab=Math.round(pa*.86),avg=clamp(.265+dd*.006,.15,.5),h=Math.round(ab*avg),hr=Math.round(h*clamp(.06+Math.max(0,a.pow-58)*.006,.03,.28));IS.PA+=pa;IS.AB+=ab;IS.H+=h;IS.HR+=hr;IS.RBI+=Math.round(hr*2.1+h*.35);}}
  function completeIntl(e,status,next){S.intlDispatchStatus=status;if(status==='DECLINED')S.intlDeclinedCount++;S.intlCompletedKeys[e.eventKey]=true;S.intlLastEventKey=e.eventKey;S.intlDispatchStatus=null;next();}
  function processIntlPhase(phase,done){if(S.stage!=='PRO'){done();return;}const q=intlEvents(S.year).filter(e=>intlPhase(e)===phase&&!S.intlCompletedKeys[e.eventKey]);let i=0;const next=()=>{if(i>=q.length){done();return;}const e=q[i++],threshold=intlThreshold(e);if(!intlLevelEligible(e)||ovr()<threshold){completeIntl(e,'DENIED',next);return;}if(S.rehab>0||S.skipMid||S.seasonFactor<1){card('info','日本代表招集見送り',`<b class="hl">${e.name}</b>の代表候補に入ったが、負傷またはリハビリ中のため招集は見送られた。`);completeIntl(e,'DENIED',next);return;}S.intlDispatchStatus='PENDING';choose(`日本代表招集・${e.name}`,[{t:'日本代表として出場',main:true,s:`代表基準：総合${threshold}以上`,f:()=>{const rank=pick(['優勝','準優勝','ベスト4','ベスト8']),pts={優勝:7,準優勝:5,ベスト4:3,ベスト8:1}[rank];addIntlStats();S.pool+=pts;S.injNext+=(S.traits.intlace?0:10);S.intlCount++;S.honors.push(`${S.year} ${e.name}${rank}`);card(rank==='優勝'?'gold':'info',e.name,`日本代表は<b class="hl">${rank}</b>。能力点+${pts}。${S.traits.intlace?'':'大会の疲労により次回の故障率+10%。'}`);completeIntl(e,'APPROVED',next);}},{t:'コンディションを優先して辞退',warn:true,f:()=>completeIntl(e,'DECLINED',next)}]);};next();}
  maybeIntl = function(done){processIntlPhase('POST',done);};
  function phaseIntlPre(){processIntlPhase('PRE',()=>nextStep());}
  startYear = function(){stepQ=[phasePre,phaseIntlPre,phaseMid,phaseEnd];divider(`${S.year}年・${S.age}歳・${stageLabel()}`);nextStep();};

  daibaFarewell = function(cont){const cp=S.stats&&S.stats.CPBL,playedCPBL=!!(cp&&cp.yr>0);if(S.stage==='PRO'&&playedCPBL&&S.org!=='CPBL'&&!S._daiba){S._daiba=true;card('gold','台湾球界への別れ',`かつてプレーした台湾プロ野球から招待を受け、古巣の本拠地で始球式を務めた。台湾のファンへ感謝を伝え、キャリア最後の一球を投じた。`);}cont();};

  function overseasOffer(org,lv,label,o,minD,finish){
    const min={KBO:47,CPBL:45,MiLB:60}[org]||99;
    if(o<min||(S.lastD||0)<minD)return null;
    const rec=pickRecord(listByOrg(org)),annual=salaryCandidate({sourceLevel:S.lv,targetLevel:lv,contractMult:1.3}).annualSalary;
    return{t:`${label}：${rec.name}`,s:`${LV[lv].n}｜年俸${fmtMoney(annual)}`,f:()=>{buyoutRemaining();signTo(org,lv,rec.teamId,ri(1,3),1.3,'OVERSEAS',{contractType:'OVERSEAS_FA'});finish();}};
  }
  crossOffers = function(o){
    const finish=()=>advance(),opts=[];
    let offerType='transfer';
    if(S.org==='NPB'&&S.lv==='NPB1'){
      offerType=crossOfferType(S.org,'MiLB');
      const k=overseasOffer('KBO','KBO1','韓国プロ野球への海外移籍',o,1,finish);
      const c=overseasOffer('CPBL','CPBL1','台湾プロ野球への海外移籍',o,0,finish);
      const m=overseasOffer('MiLB','MLB','MLBへの海外移籍',o,2,finish);
      if(k)opts.push(k);if(c)opts.push(c);if(m)opts.push(m);
    }else if(['KBO','CPBL','MiLB','MLB'].includes(S.org)&&o>=47){
      offerType=crossOfferType(S.org,'NPB');
      const rec=pickRecord(listByOrg('NPB')),lv=o>=53?'NPB1':'NPB2';
      opts.push({t:`NPBへ復帰：${rec.name}`,s:`${LV[lv].n}契約`,f:()=>{buyoutRemaining();signTo('NPB',lv,rec.teamId,ri(1,3),1,'RETURN');finish();}});
    }
    if(!opts.length){finish();return;}
    opts.splice(4);opts.push({t:'現在の球団に残留',main:true,f:finish});choose(crossOfferTitle(offerType),opts);
  };

  function renewAndAdvance(mult=1,allowDecrease=false,contractType='NORMAL'){const base=salaryCandidate({contractMult:mult}),previousSalary=S.currentSalary,injuryMult=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),candidate={...base,contractMult:base.contractMult*injuryMult,annualSalary:roundToTenThousandYen(base.annualSalary*injuryMult)},control=calculateControlOffer({marketSalary:candidate.annualSalary,previousSalary,marketRating:currentMarketRating(),serviceYears:serviceYearsFor(S.org),org:S.org,levelMinimum:salaryFor(S.lv,0)}),annualSalary=roundToTenThousandYen(contractType==='CONTROL'?control.protectedSalary:Math.max(candidate.annualSalary,!allowDecrease?previousSalary:0));S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary,contractType,candidate,startYear:S.year+1});S.currentSalary=S.ct.annualSalary;pendingOffseasonSalary=null;saveSalaryDecision('RENEWAL',candidate,previousSalary,S.currentSalary,{decreaseProtectionApplied:S.currentSalary>candidate.annualSalary,floorApplied:contractType==='CONTROL'&&control.floorApplied});card('info','契約更改',`年俸${fmtMoney(S.currentSalary)}で契約を更新した。${salaryDecisionSummary()} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();advance();}
  function arbitrationFlow(){
    const base=salaryCandidate(),injuryMult=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),terms=calculateArbitrationTerms({marketSalary:roundToTenThousandYen(base.annualSalary*injuryMult),previousSalary:S.currentSalary,marketRating:currentMarketRating(),serviceYears:serviceYearsFor('MLB'),levelMinimum:salaryFor('MLB',0)});
    const complete=(result,finalSalary)=>{S.lastArbitration={year:S.year,result,clubSalary:roundToTenThousandYen(terms.clubSalary),playerSalary:roundToTenThousandYen(terms.playerSalary),finalSalary:roundToTenThousandYen(finalSalary),winChance:terms.winChance};const candidate={...base,contractMult:base.contractMult*injuryMult,annualSalary:S.lastArbitration.finalSalary},floorApplied=result==='SETTLED'?terms.middleFloorApplied:result==='WON'?terms.playerFloorApplied:terms.clubFloorApplied;S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary:S.lastArbitration.finalSalary,contractType:'ARBITRATION',candidate,startYear:S.year+1});S.currentSalary=S.ct.annualSalary;saveSalaryDecision('RENEWAL',candidate,terms.previousSalary,S.currentSalary,{decreaseProtectionApplied:S.currentSalary>terms.marketSalary,floorApplied});card('gold','MLB年俸調停',`球団提示：${fmtMoney(terms.clubSalary)}<br>選手側：${fmtMoney(terms.playerSalary)}<br>中間案：${fmtMoney(terms.middleSalary)}<br>勝訴確率：${Math.round(terms.winChance)}%<br>決定年俸：<b class="hl">${fmtMoney(S.currentSalary)}</b> ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();advance();};
    choose(`MLB年俸調停対象（在籍${serviceYearsFor('MLB')}年）`,[{t:`球団提示を受け入れる（${fmtMoney(terms.clubSalary)}）`,main:true,f:()=>complete('ACCEPTED',terms.clubSalary)},{t:`中間案で合意を試みる（${fmtMoney(terms.middleSalary)}）`,f:()=>complete('SETTLED',terms.middleSalary)},{t:`年俸調停を申請する（選手側 ${fmtMoney(terms.playerSalary)}／勝訴確率 ${Math.round(terms.winChance)}%）`,warn:true,f:()=>{const won=chance(terms.winChance);complete(won?'WON':'LOST',won?terms.playerSalary:terms.clubSalary);}}]);
  }
  faFlow = function(o){
    migrateSalaryV130State();const stage=contractStageFor(S.org);
    if(stage==='CONTROL'){renewAndAdvance(1,false,'CONTROL');return;}
    if(stage==='ARBITRATION'){arbitrationFlow();return;}
    if(S.org!=='NPB'){S.faType='OVERSEAS';faMarket(o,S.lastD||0);return;}
    if(serviceYearsFor('NPB')<8){renewAndAdvance(1,false,'CONTROL');return;}
    const declareFA=type=>{S.faType=type;S.faUsed=true;S.npbFaSeasons=0;faMarket(o,S.lastD||0);};
    const opts=[{t:'権利を行使せず残留',main:true,f:()=>renewAndAdvance(1)},{t:'国内FAを宣言',warn:true,f:()=>declareFA('DOMESTIC')}];
    if(serviceYearsFor('NPB')>=9)opts.push({t:'海外FAを宣言',warn:true,f:()=>declareFA('OVERSEAS')});
    choose(`FA権取得・登録${serviceYearsFor('NPB')}シーズン`,opts);
  };
  const faOfferText=offer=>`契約：${offer.years}年｜年俸：${fmtMoney(offer.annualSalary)}<br>保障総額：${fmtMoney(offer.guaranteedTotal)}｜出来高：最大${fmtMoney(offer.incentiveAnnualMax)}／年<br>チーム需要：${teamDemandLabel(offer.demandScore)}｜契約タイプ：${({LONG:'長期契約',SHORT:'短期契約',PROOF:'証明契約',RETURN:'宣言残留'})[offer.contractType]||offer.contractType}<br><small>市場基準額 ${fmtMoney(offer.breakdown.marketSalary)}／故障補正 ×${offer.breakdown.injuryMultiplier.toFixed(2)}／守備位置係数 ×${offer.breakdown.positionMultiplier.toFixed(2)}／契約タイプ係数 ×${offer.breakdown.contractTypeMultiplier.toFixed(2)}／球団需要 ×${offer.breakdown.teamDemandMultiplier.toFixed(3)}／競合補正 ×${offer.breakdown.competitionMultiplier.toFixed(3)}／最終年俸 ${fmtMoney(offer.annualSalary)}</small>`;
  function acceptFaOffer(offer){S.lastFaMarket.acceptedOfferId=offer.offerId;const rec=teamRec(offer.teamId);signTo(offer.org,offer.level,offer.teamId,offer.years,1,'FA',{annualSalary:offer.annualSalary,contractType:offer.contractType,incentive:offer.incentive,offerBreakdown:offer.breakdown});card('gold','FA契約成立',`${escapeHTML(rec.name)}と${offer.years}年契約。保障総額${fmtMoney(offer.guaranteedTotal)}、出来高は年最大${fmtMoney(offer.incentiveAnnualMax)}。`);advance();}
  function showFaMarket(market){
    if(!market.offers.length){const rating=market.marketRating,injury=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),marketAnnual=salaryFor(S.lv,rating)*dpMult()*.9*injury,levelMinimum=salaryFor(S.lv,0),floorApplied=levelMinimum>marketAnnual,annual=roundToTenThousandYen(Math.max(marketAnnual,levelMinimum)),incentive=createIncentiveTerms({org:S.org,annualSalary});choose('FA市場・獲得オファーなし',[{t:`元球団と1年契約（年俸${fmtMoney(annual)}）`,main:true,s:'市場価×0.90。減俸保護は適用されない',f:()=>{const previousSalary=S.currentSalary,base=salaryCandidate(),candidate={...base,contractMult:.9*injury,annualSalary};S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary,contractType:'FA_RETURN',candidate,incentive});S.currentSalary=annual;market.acceptedOfferId='RETURN_NO_BID';saveSalaryDecision('RENEWAL',candidate,previousSalary,annual,{floorApplied});advance();}},{t:'現役を退く',warn:true,f:()=>endGame('FA市場で獲得オファーがなく、現役を引退した。')}]);return;}
    const choices=market.offers.map(offer=>({t:`${teamRec(offer.teamId).name}（${LV[offer.level].n}）`,s:faOfferText(offer),f:()=>acceptFaOffer(offer)}));
    if(market.stayOffer)choices.push({t:`宣言残留：${teamRec(market.stayOffer.teamId).name}`,main:true,s:faOfferText(market.stayOffer),f:()=>acceptFaOffer(market.stayOffer)});
    choose('FA市場オファー比較',choices);
  }
  faMarket = function(o,d){
    migrateSalaryV140State();const key=`FA:${S.year}:${S.faType}`;
    if(S.lastFaMarket?.marketKey===key){showFaMarket(S.lastFaMarket);return;}
    S.faMarketKey=key;const rating=currentMarketRating(),baseCount=baseFaOfferCount(rating),context=buildMarketContext({marketSalary:0,marketInjury:S.marketInjury,history:S.salaryEvaluationHistory||[],normalMaxYears:4,baseOfferCount:Math.max(0,baseCount-(S.traits.cancer?1:0))}),offerCount=context.offerCount,category=playerMarketCategory({pos:S.pos,role:S.role,dpos:S.dpos});
    const routes=S.faType==='DOMESTIC'?[{org:'NPB',level:'NPB1'}]:[{org:'NPB',level:'NPB1'},...(o>=47&&d>=1?[{org:'KBO',level:'KBO1'}]:[]),...(o>=45&&d>=0?[{org:'CPBL',level:'CPBL1'}]:[]),...(o>=60&&d>=2?[{org:'MiLB',level:'MLB'}]:[])];
    const candidates=routes.flatMap(route=>listByOrg(route.org).filter(team=>team.teamId!==S.orgTeamId).map(team=>({team,...route}))),ranked=rankTeamsByDemand({teams:candidates.map(x=>x.team),seed:S.seed,year:S.year,category});
    const routeByTeam=new Map(candidates.map(x=>[x.team.teamId,x])),selected=ranked.slice(0,offerCount).map(x=>({...x,...routeByTeam.get(x.team.teamId)})).sort((a,b)=>a.team.teamId.localeCompare(b.team.teamId)),comp=competitionMultiplier(selected.length),offers=[],jitterByTeam=new Map(generateBidJitters(selected.map(x=>x.team.teamId),R).map(x=>[x.teamId,x.multiplier]));
    selected.forEach((entry,index)=>{const proof=context.preferProof,contractType=proof?'PROOF':index%2===0&&context.maxYears>=3?'LONG':'SHORT',years=proof?1:contractType==='LONG'?context.maxYears:Math.min(2,context.maxYears),converted=convertRatingBetweenLevels(rating,S.lv,entry.level,LV),marketSalary=salaryFor(entry.level,converted),breakdown={injuryMultiplier:context.injuryMultiplier,positionMultiplier:dpMult(),contractTypeMultiplier:contractTypeMultiplier(contractType),teamDemandMultiplier:teamDemandMultiplier(entry.demandScore),franchiseMultiplier:1,competitionMultiplier:comp,bidJitterMultiplier:jitterByTeam.get(entry.team.teamId)},incentive=createIncentiveTerms({org:entry.org,annualSalary:marketSalary});const offer=buildFaOffer({offerId:`${key}:${entry.team.teamId}`,teamId:entry.team.teamId,org:entry.org,level:entry.level,category,demandScore:entry.demandScore,years,contractType,marketSalary,levelMinimum:salaryFor(entry.level,0),breakdown,incentiveTerms:incentive});offer.incentive=createIncentiveTerms({org:entry.org,annualSalary:offer.annualSalary});offer.incentiveAnnualMax=offer.incentive?.annualMax||0;offers.push(offer);});
    let stayOffer=null;if(offers.length&&S.orgTeamId){const demand=rankTeamsByDemand({teams:[teamRec(S.orgTeamId)],seed:S.seed,year:S.year,category})[0]?.demandScore||0,contractType=context.preferProof?'PROOF':'SHORT',years=context.preferProof?1:Math.min(2,context.maxYears),marketSalary=salaryFor(S.lv,rating),breakdown={injuryMultiplier:context.injuryMultiplier,positionMultiplier:dpMult(),contractTypeMultiplier:contractTypeMultiplier(contractType),teamDemandMultiplier:teamDemandMultiplier(demand),franchiseMultiplier:S.traits.franchise?1.04:1,competitionMultiplier:comp,bidJitterMultiplier:1},incentive=createIncentiveTerms({org:S.org,annualSalary:marketSalary});stayOffer=buildFaOffer({offerId:`${key}:STAY`,teamId:S.orgTeamId,org:S.org,level:S.lv,category,demandScore:demand,years,contractType:'RETURN',marketSalary,levelMinimum:salaryFor(S.lv,0),breakdown,incentiveTerms:incentive});stayOffer.incentive=createIncentiveTerms({org:S.org,annualSalary:stayOffer.annualSalary});stayOffer.incentiveAnnualMax=stayOffer.incentive?.annualMax||0;}
    S.lastFaMarket={marketKey:key,generatedYear:S.year,marketRating:rating,injuryStatus:S.marketInjury,offerCount:offers.length,offers,stayOffer,acceptedOfferId:null};showFaMarket(S.lastFaMarket);
  };
  outOfOrg = function(o){
    if(isBelowActiveMinimum(o)){retireBelowActiveMinimum();return;}
    buyoutRemaining(1);
    const candidates=[];
    const pushPro=(org,lv,label)=>{const rec=pickRecord(listByOrg(org));candidates.push({score:LV[lv].par,t:`${label}・${rec.name}`,s:`${LV[lv].n}契約`,f:()=>{signTo(org,lv,rec.teamId,1,1,'RELEASE_RECONTRACT');advance();}});};
    const pushAma=stage=>{const rec=pickRecord(listByOrg(stage));candidates.push({score:LV[stage].par,t:`${stage==='CORP'?'社会人野球':'独立リーグ'}・${rec.name}`,f:()=>{S.stage=stage;S.stageYr=0;S.lv=stage;S.org=stage;S.orgTeamId=rec.teamId;S.team=rec.name;if(stage==='CORP')S.corpYears=0;else S.indYears=0;advance();}});};
    if(o>=30)pushAma('IND');if(o>=32)pushAma('CORP');
    const npbDevEligible=S.age<=26||(S.age<=29&&chance(30))||(S.npbYears||0)>0;
    if(o>=30&&npbDevEligible)pushPro('NPB','NPB_DEV','NPB育成再契約');
    if(o>=47)pushPro('KBO','KBO1','韓国プロ野球への海外移籍オファー');else if(o>=35)pushPro('KBO','KBO2','韓国プロ野球への海外移籍オファー');
    if(o>=45)pushPro('CPBL','CPBL1','台湾プロ野球への海外移籍オファー');else if(o>=35)pushPro('CPBL','CPBL2','台湾プロ野球への海外移籍オファー');
    if(o>=52)pushPro('MiLB','A3','米国プロ野球への海外移籍オファー');
    else {
      const milbAgeOK=S.age<=26||(S.age<=29&&chance(30));
      if(milbAgeOK){if(o>=47)pushPro('MiLB','A2','米国プロ野球への海外移籍オファー');else if(o>=43)pushPro('MiLB','A1','米国プロ野球への海外移籍オファー');else if(o>=39)pushPro('MiLB','R','米国プロ野球への海外移籍オファー');}
    }
    candidates.sort((a,b)=>b.score-a.score);const offers=candidates.slice(0,4).map(({score,...x})=>x);
    if(!offers.length){endGame(`戦力外通告後に獲得オファーがなく、${S.year}年に現役を引退した。`);return;}
    offers.push({t:'現役を退く',warn:true,f:()=>endGame('戦力外通告を受け、現役を引退した。')});
    choose('戦力外・再起オファー（最大4球団）',offers);
  };

  phaseEnd = function(){board(2);migrateSalaryV140State();S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});if(S.stage==='PRO'){if(!S.ct)throw new Error('PRO_PLAYER_WITHOUT_CONTRACT');if(S.ct.schemaVersion!==3){S.ct=normalizeContract(S.ct,{currentYear:S.year,currentSalary:S.currentSalary,org:S.org,teamId:S.orgTeamId});S.currentSalary=S.ct.annualSalary;}const due=salaryDueForYear(S.ct,S.year);if(due.scheduleIndex<0)throw new Error('PRO_PLAYER_WITHOUT_CONTRACT');const payment=markSalaryPaid(S.ct,S.year),paid=payment.amount;S.ct=payment.contract;S.currentSalary=S.ct.annualSalary||paid;S.careerBaseSalary+=paid;S.careerEarnings+=paid;S.lastSalaryPaidYear=S.year;const incentivePayment=applyIncentivePayment(S,{contract:S.ct,evaluation:S.lastSalaryEvaluation,honors:S.honors,year:S.year}),incentive=incentivePayment.result;if(incentivePayment.paid){S.careerIncentive=incentivePayment.state.careerIncentive;S.careerEarnings=incentivePayment.state.careerEarnings;S.yearlyIncentivePaid=incentivePayment.state.yearlyIncentivePaid;}pendingOffseasonSalary=null;const continuation=contractContinuationForNextYear(S.ct,S.year),continuationText=continuation?`<br><b>現契約を継続</b><br>来季年俸：<b class="hl">${fmtMoney(continuation.nextSalary)}</b><br>契約残り：${continuation.remainingYears}年<br>年俸の再計算はありません<br>今季の実績は次回の契約評価へ反映されます。`:'';card('','シーズン終了',`今季支給年俸：<b class="hl">${fmtMoney(paid)}</b>｜出来高：<b class="hl">${fmtMoney(incentive.amount||0)}</b>（${incentive.level}）<br>今季受取総額：<b class="hl">${fmtMoney(paid+(incentive.amount||0))}</b>｜生涯収入：${fmtMoney(S.careerEarnings)}${continuationText}`);}else if(S.stage==='IND'){const candidate=salaryCandidate({sourceLevel:'IND',targetLevel:'IND',rating:currentMarketRating(),contractMult:1}),pay=candidate.annualSalary,previousSalary=S.currentSalary;S.currentSalary=pay;S.ct=null;if(S.lastSalaryPaidYear===S.year)throw new Error('SALARY_ALREADY_PAID_FOR_YEAR');S.careerBaseSalary+=pay;S.careerEarnings+=pay;S.lastSalaryPaidYear=S.year;saveSalaryDecision('RENEWAL',candidate,previousSalary,pay);card('','独立リーグ年間報酬',`今季年俸${fmtMoney(pay)}を受領した。生涯収入：${fmtMoney(S.careerEarnings)} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();}else if(S.stage==='CORP'){const pay=salaryFor('CORP',S.lastD||0);S.corpIncome+=pay;S.careerEarnings+=pay;card('','社会人給与',`企業給与${fmtMoney(pay)}を受領した。`);}const go=()=>movement();if(S.pool>0){const p=S.pool;S.pool=0;choose('',[{t:`能力点を分配（${p}点）`,main:true,f:()=>allocUI({pool:p},'シーズン成果の能力点',go)}]);}else go();};

  movement = function(){migrateSalaryV130State();if(S.stage==='HS'){if(S.stageYr<3)advance();else pathChoiceHS();return;}if(S.stage==='U'){if(S.stageYr<4)advance();else pathChoiceU4();return;}if(S.stage==='CORP'){S.corpYears++;const eligible=(S.entryRoute==='HS'?S.corpYears>=3:S.corpYears>=2);const opts=[{t:'社会人野球を続ける',main:true,f:advance},{t:'独立リーグへ移籍',f:()=>{setAmateur('IND');advance();}},{t:'現役を退く',warn:true,f:()=>endGame('社会人野球で現役生活を終えた。')}];if(eligible)opts.unshift({t:'NPBドラフトへ再挑戦',main:true,f:()=>enterDraftPath('CORP')});choose('社会人シーズン終了',opts);return;}if(S.stage==='IND'){S.indYears++;choose('独立リーグシーズン終了',[{t:'NPBドラフトへ再挑戦',main:true,f:()=>enterDraftPath('IND')},{t:'独立リーグに残留',f:advance},{t:'社会人野球へ',f:()=>{setAmateur('CORP');advance();}},{t:'現役を退く',warn:true,f:()=>endGame('独立リーグで現役生活を終えた。')}]);return;}if(S.serviceTimeAccruedYear!==S.year){if(S.org==='NPB'&&S.lv==='NPB1'&&S.seasonFactor>0){S.npbRosterDays+=Math.round(145*S.seasonFactor);while(S.npbRosterDays>=145){S.npbRosterDays-=145;S.npbFaSeasons++;}S.serviceTime.NPB=Math.max(S.serviceTime.NPB,S.npbFaSeasons);}else if(S.org==='MLB'&&S.lv==='MLB'&&S.seasonFactor>=.5)S.serviceTime.MLB++;else if((S.org==='KBO'&&S.lv==='KBO1'||S.org==='CPBL'&&S.lv==='CPBL1')&&S.seasonFactor>0)S.serviceTime[S.org]++;S.serviceTimeAccruedYear=S.year;}const stage=contractStageFor(S.org);if(S.org==='NPB')S.faElig=S.serviceTime.NPB>=8;else if(S.org==='MLB')S.faElig=stage!=='CONTROL';LEGACY.movement();};

  const legacyEndGame=LEGACY.endGame;
  endGame=function(reason){legacyEndGame(reason);setTimeout(()=>{
    /* innerHTML の再代入は共有ボタンのイベントリスナーを消すため、テキストノードだけを安全に更新する。 */
    document.querySelectorAll('.card').forEach(c=>{
      const walker=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);
      for(let n=walker.nextNode();n;n=walker.nextNode())n.nodeValue=n.nodeValue.replace(/台幣/g,'円').replace(/中華隊/g,'日本代表').replace(/臺灣/g,'日本');
    });
  },0);};

  function startJapanese(){let params=new URLSearchParams(location.search);let sv=normalizeSeed($('seed-show').value||params.get('seed'));if(!sv)sv=generateSeed();SEED=sv;const pos=document.querySelector('#seg-pos button.on')?.dataset.v||'P';const nm=normalizePlayerName($('in-name').value,SEED,pos);S={rngState:0};seedInit(SEED);S=newState(nm,pos);history.replaceState(null,'',`?seed=${encodeURIComponent(SEED)}`);$('start').style.display='none';$('board').style.display='';$('act').style.display='';card('info','選手誕生',`${S.year}年春、${POSN[S.pos]} <b class="hl">${escapeHTML(S.name)}</b>は<b class="hl">${escapeHTML(S.team)}</b>野球部に入部した。ここから、すべての選択が野球人生を変える。`);startYear();}
  const appVersion=$('app-version');if(appVersion)appVersion.textContent='v'+VERSION;
  const salaryDetailController=createSalaryDetailController({trigger:$('salary-detail-trigger'),panel:$('salary-detail-panel'),closeButton:$('salary-detail-close'),title:$('salary-detail-title'),body:$('salary-detail-body'),getDecision:()=>S?.lastSalaryDecision||null,getCurrentSalary:()=>S?.currentSalary||0,getContract:()=>S?.ct||null,isProfessional:()=>S?.stage==='PRO'||S?.stage==='IND',fmtMoney});
  $('btn-start').onclick=startJapanese;
  $('seed-re').onclick=e=>{e.preventDefault();const s=generateSeed();$('seed-show').value=s;SEED=s;};
  $('seed-show').value=normalizeSeed(new URLSearchParams(location.search).get('seed'))||generateSeed();
  $('btn-restart').onclick=()=>{if(confirm('この野球人生を終了して最初からやり直しますか？'))location.href=location.pathname;};
})();

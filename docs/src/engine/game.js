import { VERSION } from '../config.js';
import {incomeSummary} from '../ui/income-summary.js';
import { Rng } from './rng.js';
import { CareerSession } from './career-session.js';
import { SeasonStats } from './season-stats.js';
import {hasCurrentAwardEffect,hasHistoricalDefenseAward} from './award-consumer-policy.js';
import {annualAwardTransaction,annualStateTransaction,preallocateAwardSlots,captureAwardSlot,prepareAwardReceipt,commitAwardReceipt,awardPlan,awardInputs,prepareD2AwardDecisions,recordAwardDecisions,completeAwardDecisions} from './award-transaction-policy.js';
import {getAwardDefinition} from './award-identity-policy.js';
import {prepareSeasonPayment} from './season-payment-policy.js';
import { highSchoolTier, schoolCompetitionBonus, installBirthHighSchool, smallSchoolEligibility } from './school-policy.js';
import { TRAIT_LABELS, TRAIT_TEXT, traitLabel, removedTraitLabel, confidanteEligible, recordFirstTeamSeason, goldclothEligible, highSchoolChampionCount, declineForSeason, awardTraitUnlocks } from './trait-policy.js';
import { EVENT_CATALOG } from '../data/event-cards-jp.js';
import { EVENT_MODES, eventEligible, eventOdds, effectiveCategory, eventTier, eventPlan, eventInjury, eventIncome, eventTraitUnlocks, EVENT_TRAIT_TEXT, validateEventCatalog } from './event-policy.js';
import { ensureEventState, beginEvent, eventDrawPool, applyEvent, beginEventSeason, consumeEventSeason, resetEventYear } from './event-state-policy.js';
import { createSeedShareController, replayURL, shareReplayURL } from '../ui/seed-share.js';
import { ShareImage } from '../ui/share-image.js';
import { DefensePositionReview } from './defense-position-review.js';
import { applyEventSeason, normalizeEventSeason } from './event-season-policy.js';
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
import { NPB_BONUS_RANGES, createSigningBonusTerms, calculatePostingFee, applySigningPayment } from './signing-bonus-policy.js';
import { effectiveMarketOrg, marketTier, foreignProSeasons, accrueForeignFirstTeamSeason, getCrossLeaguePolicy, applyCrossLeagueSalary, applyKboForeignPackageCap } from './cross-league-market-policy.js';
import { createChoiceActionToken, runChoiceAction } from '../ui/choice-action.js';
import { GameView } from '../ui/game-view.js';
import { initNavigation } from '../ui/navigation.js';
import { honorScoreFor } from './hall-of-fame-policy.js';
import { careerScoreFor, defenseShareFor, hallOfFameTier } from './hall-of-fame-tier-policy.js';
import { defenseScoreFor, defenseBarFor, defensePositionQualified, defensePositionCandidates, defensePositionMultiplier } from './defense-position-policy.js';
import { toolGapFor, overallRatingFor, playerTypeFor, abilityStepCostFor } from './ability-evaluation-policy.js';
import { resolveStatBucket } from './stat-bucket.js';
import { CareerPresenter } from '../ui/career-presenter.js';
import { contractTypeLabel } from '../ui/contract-labels.js';
import { canPlayHighSchoolFall, canPlaySenbatsu, nextSenbatsuEligibleYear, qualificationResult, qualifiesForChampionship, qualifiesForCorporateJapan, qualifiesForUniversityJingu, tournamentResult } from './domestic-tournament-policy.js';

import { normalizeChampionshipState, captureSeasonChampionship, settleChampionship, maintainSeasonEnd } from './championship-policy.js';
import { normalizeInternationalState, validateInternationalEntry, prepareInternationalResult, commitInternationalResult, INTLACE_UNLOCK_TEXT } from './international-trait-policy.js';
import { internationalEvents, internationalPhase, internationalThreshold, internationalSelection } from './international-selection-policy.js';
import { internationalPersonalStats, renderInternationalPersonalStats } from '../ui/international-personal-stats.js';
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
function scrollBottom(){ gameView.scrollBottom(); }
const N0=(sd)=> (R()+R()+R()+R()-2)/2*sd*2; /* 正規分布の近似。 */

/* 静的データ。 */
const ABL={sta:'スタミナ',vel:'球速',ctl:'制球',brk:'変化球',con:'ミート',pow:'パワー',spd:'走力',eye:'選球眼',rng:'守備範囲',fld:'捕球',arm:'肩力',cat:'リード'};
const POS_AB={P:['sta','vel','ctl','brk'],C:['sta','con','pow','spd','eye','rng','fld','arm','cat'],IF:['sta','con','pow','spd','eye','rng','fld','arm'],OF:['sta','con','pow','spd','eye','rng','fld','arm']};
const POSN={P:'投手',C:'捕手',IF:'内野手',OF:'外野手'};
/* 守備位置システム。 */
const DPN={SS:'遊撃手','2B':'二塁手','3B':'三塁手','1B':'一塁手',
 CF:'中堅手',RF:'右翼手',LF:'左翼手',DH:'指名打者',C:'捕手'};
/* 守備位置ごとに守備範囲・捕球・肩力の基準をリーグ基準から補正する。三塁に遊撃並みの守備範囲は求めず、一塁では肩力をほぼ評価しない。 */
/* 守備位置ごとに重視する能力を変え、総合守備評価を返す。 */
function dpScore(p){return defenseScoreFor(S.ab,p);}
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
function dpBar(){return defenseBarFor({bars:DP_BAR,level:S.lv,age:S.age});}
function dpQual(p){return defensePositionQualified({position:p,thresholds:DP_TH,level:S.lv,age:S.age,favorite:S.traits.favorite,scoreOf:dpScore});}
const DP_RANK={SS:0,CF:0,'2B':1,'3B':2,RF:2,'1B':3,LF:3,DH:4,C:0}; /* 守備位置市試合価値の序列(SS>2B>3B)。 */
function dpList(){return defensePositionCandidates(S.pos,dpQual);}
function dpMult(){return defensePositionMultiplier({position:S.pos,defensePosition:S.dpos,multipliers:DP_MULT});}
function dposReview(cont){defensePositionReview.review(cont);}
const defensePositionReview=new DefensePositionReview({getState:()=>S,getLevels:()=>LV,DPN,DP_RANK,DP_MULT,dpBar:()=>dpBar(),dpQual:p=>dpQual(p),dpList:()=>dpList(),pitcherRole:()=>pitcherRole(),roleN:r=>roleN(r),choose:(title,opts)=>choose(title,opts),card:(cls,title,html)=>card(cls,title,html)});
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
/* Approved 92-card catalog; validation consumes no RNG. */
validateEventCatalog();
const EVENTS=EVENT_CATALOG.events;
/* ゲーム状態。 */
let S=null;
const careerSession=new CareerSession();
const seasonStats=new SeasonStats({getState:()=>S,levels:LV,rng:{R:()=>R(),N0:sd=>N0(sd),chance:p=>chance(p),ri:(a,b)=>ri(a,b)},clamp,isSP:()=>isSP(),pitcherRole:()=>pitcherRole(),checkGoldclothSeason:()=>checkGoldclothSeason()});
let careerRng = null;
function blankStat(){return seasonStats.blankStat();}
function bucketOf(lv){return resolveStatBucket(LV,lv);}
function traitCard(key,name,desc,tone){ S.traits[key]=true;
  card(tone||'gold','隠し特性解放：'+name,desc); board(0); }
function removeTrait(key,label){ if(S.traits[key]){ S.traits[key]=false;
    traitPresentation.get(S)?.delete(key);
    if(!S.removed.includes(label))S.removed.push(label); } }
/* 一芸特化：評価対象は三つの役割軸のみ——打撃(長打力/Contact)、走塁(速度)、守備(総合)。 */
function careerAllStars(){ let n=0; ['CPBL','KBO','NPB','MLB'].forEach(b=>{ if(S.stats[b])n+=(S.stats[b].AS||0); }); return n; }
function toolGap(){return toolGapFor(S.ab,S.pos);}
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
      card('gold','隠し特性解放：ゴムゴムの腕','二度の肘危機を注射だけで乗り切り、一度も手術を受けなかった――靱帯はゴムのようにしなやかだ。<b class="hl">TJゲージ上限が50から100に、注射成功率が55%から85%に上昇</b>。'); board(1); } }
  else if(kind==='surgery'){ S.tjSuccess=0; /* 手術時に連続記録をリセット。 */
    if(S.traits.rubber){ removeTrait('rubber','ゴムゴムの腕');
      card('bad','ゴムゴムの腕、ついに限界','ついに手術室へ――ゴムゴムの腕と呼ばれた腕にも限界はあった。<b class="dn">ゴムゴムの腕失効</b>。'); board(1); } }
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
function ovr(){return overallRatingFor({ability:S.ab,position:S.pos,defensePosition:S.dpos,traits:S.traits});}
function playerType(){return playerTypeFor({ability:S.ab,position:S.pos,traits:S.traits,toolRole:S.toolRole});}
function abCost(k){return abilityStepCostFor({ability:S.ab,potential:S.pot,key:k,position:S.pos});}
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
function simSeason(lv){return seasonStats.simSeason(lv);}
function applySeasonForm(st,lv){return seasonStats.applySeasonForm(st,lv);}
function defRuns(lv){return seasonStats.defRuns(lv);}
function addStatTotal(t,st){return seasonStats.addStatTotal(t,st);}
function accStat(bucket,st){return seasonStats.accStat(bucket,st);}
function accLevelStat(levelKey,st){return seasonStats.accLevelStat(levelKey,st);}
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
const fmtMoney=yen=>{yen=Math.max(0,Math.round(Number(yen)||0));const oku=Math.floor(yen/100000000),man=Math.floor((yen%100000000)/10000);return (oku?oku+'億':'')+(man?man.toLocaleString()+'万円':oku?'円':'0円');};
function displayTrait(key){return traitLabel(key,S,teamNick);}
function traitNames(){return Object.fromEntries(Object.keys(TRAIT_LABELS).map(key=>[key,displayTrait(key)]));}
function checkGoldclothSeason(){
  recordFirstTeamSeason(S);
  if(goldclothEligible(S))traitCard('goldcloth',displayTrait('goldcloth'),'阪神ストライプス一軍で通算10年。虎党の声援を背に、甲子園で戦い続けてきた。その縦縞は、もはやお前の誇りだ。');
}
function currentAffiliation(){if(!S)return '記録なし';if(S.stage==='HS'||S.stage==='U'||S.stage==='CORP'||S.stage==='IND')return S.team||'記録なし';return typeof S.teamName==='function'?S.teamName():S.team||'記録なし';}
const careerPresenter=new CareerPresenter({getState:()=>S,labels:{ABL,POS_AB,POSN},fmtMoney,fmtIP,displayTrait,teamNick});
function buildRecordViewModel(){return careerPresenter.record();}
function buildAbilityViewModel(){return careerPresenter.ability();}
function buildTraitsViewModel(){return careerPresenter.traits();}
function buildPlayerViewModel(){return careerPresenter.player();}
function buildCareerViewModel(){return careerPresenter.career();}
/* UI基盤。 */
const $=id=>document.getElementById(id);
var _curYearBody=null; /* 當前年度的內容容器。 */
var MAX_YEARS=8;         /* DOM 最大保持年度領域数。 */
function logTarget(){ return _curYearBody || $('log'); }
// DOM presentation lifetime only; no display markers in S or replay data.
const traitPresentation=new WeakMap();
const gameView=new GameView({byId:$,logTarget,decorateCard:traitResultMarkup,onTraitShown:key=>traitPresentation.get(S).add(key)});
function archiveTraitResults(){ gameView.archiveTraitResults(); }
function traitResultMarkup(node,title,html){
  const lost={'ゴムゴムの腕、ついに限界':'rubber','結果で黙らせる':'cancer','一芸特化を返上':'onetool','イップス克服':'yips'}[title];
  if(lost){node.dataset.traitResult='removed:'+lost;node.dataset.traitName=displayTrait(lost);return {title,html};}
  if(!/^隠し(?:特性解放|称号|タイトル)[:：]/.test(title||''))return {title,html};
  const name=title.replace(/^隠し(?:特性解放|称号|タイトル)[:：]/,'');
  const key=Object.keys(TRAIT_LABELS).find(k=>name===displayTrait(k)||name===TRAIT_LABELS[k])||(name==='神カード'?'franchise':null);
  if(!key)return {title,html};
  let shown=traitPresentation.get(S);if(!shown){shown=new Set(Object.keys(S.traits||{}).filter(k=>S.traits[k]));traitPresentation.set(S,shown);}
  const label=displayTrait(key);
  if(!S.traits?.[key]||shown.has(key))return {title:label,html:''};
  node.dataset.traitResult=key;node.dataset.traitName=label;
  const effect=EVENT_TRAIT_TEXT[key]||TRAIT_TEXT[key];
  const reasons={favorite:'25歳未満で通常選択に累計10回成功。',adking:'スポンサーイベントの勝負選択に累計5回成功。',clutch:'25歳未満で勝負選択に累計7回成功。',disc:'25歳未満で安全選択に累計15回成功し、私生活の条件を達成。',distract:'私生活と間食の累計が取得条件に到達。',cancer:'対人イベントの失敗または私生活の悪評により取得。'};
  if(reasons[key]&&html===effect)html=reasons[key]+'<br>'+html;
  const memorial=['confidante','goldcloth','miraclegen','strongpitch','stronghit','legend','smallschool','grinder','rainbow','taiwan'];
  const plain=String(html).replace(/<[^>]*>/g,'');
  const completeIntlace=key==='intlace'&&/次回/.test(plain)&&/最低2点/.test(plain)&&/故障リスク/.test(plain);
  if(effect&&!plain.includes(effect)&&!completeIntlace)html+='<br>'+effect;
  else if(memorial.includes(key)&&!/(追加効果|記念称号)/.test(plain))html+='<br>能力への追加効果はない記念称号です。';
  if(key==='mrteam')html+='<br>球団がトレードを拒否する、非売品の扱いになります。';
  if(key==='onetool')html+='<br>得意分野での出場機会を追加する起用補正があります。';
  const starts={favorite:'成功率の補正は次のイベント選択から適用されます。',clutch:'成功率・分類別効果の補正は次のイベント選択から適用されます。',latepractice:'成功率の補正は次のイベント選択から適用されます。',adking:'収入の補正は次のスポンサーイベントから適用されます。',disc:'シーズン前の衰え判定に適用されます。',distract:'サイコロの減少は次のシーズン前トレーニングから適用されます。'};
  if(starts[key])html+='<br>'+starts[key];
  return {title:'隠し特性解放：'+label,html};
}
function card(cls,title,html){ gameView.card(cls,title,html); }
function divider(t){ _curYearBody=gameView.divider(t,MAX_YEARS); }
function board(phase){ gameView.renderBoard(boardModel(phase)); }
function boardModel(phase){
  const nameHtml=`${S.name}<small>${S.dpos?DPN[S.dpos]:POSN[S.pos]}${S.role?'·'+roleN(S.role):''}·${playerType()}${S.traits.genius?' ★':''}</small>`;
  let t;
  if(S.stage==='HS')t=S.team+'（高'+['一','二','三'][S.stageYr-1]+'）';
  else if(S.stage==='U')t=S.team+'（大'+['一','二','三','四'][S.stageYr-1]+'）';
  else if((S.stage==='CORP'||S.stage==='IND'))t=S.team+'（アマチュア）';
  else t=S.teamName();
  let teamHtml;
  { const tc = (S.orgTeamId && TEAM_COLOR[S.orgTeamId]) || 'var(--amber)';
    /* 白色か判定し、白背景に白文字となるのを防ぐ。 */
    const isWhite = (tc.toLowerCase() === '#ffffff' || tc.toLowerCase() === '#fff');
    
    /* プロ入り済みで球団色が設定されている場合、白背景ラベルを適用。 */
    const isProColored = (S.stage === 'PRO' && TEAM_COLOR[S.orgTeamId]);
    const txtColor = isProColored ? (isWhite ? '#000000' : tc) : 'var(--amber)';
    const bgStyle = isProColored ? 'background:#ffffff; padding:2px 8px; border-radius:6px; box-shadow:0 2px 4px rgba(0、0、0、0.4);' : '';
    
    const dot = isProColored ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isWhite ? '#cccccc' : tc};margin-right:6px;vertical-align:middle;box-shadow:0 0 2px rgba(0、0、0、0.2);"></span>` : '';
    
    teamHtml = dot + `<span style="color:${txtColor}; ${bgStyle} font-weight:900;">${t}</span>`; }
  const age=S.age, year=S.year;
  const ovrValue=ovr(), clearTj=S.pos==='P', salaryText=Math.round((S.currentSalary||0)/10000).toLocaleString();
  return {nameHtml,teamHtml,age,year,ovr:ovrValue,clearTj,salaryText,phase};
}
function actClear(){ gameView.actClear(); }
function actToggleSync(){ gameView.actToggleSync(); }
function escapeDiagnosticHTML(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
const choiceViews=new WeakMap(),seasonContinuations=new WeakMap(),yearHandoffs=new WeakMap();
let resumeSeasonEnd=()=>false;
function restorePendingChoice(state=S,expected){
  const view=choiceViews.get(state);
  if(S!==state||view?.year!==state.year||view.kind!=='CHOICE'||(expected&&view!==expected))return false;
  if(view.generation===careerSession.choiceGeneration&&view.rendered&&view.buttons.length===view.opts.length&&view.buttons.every(b=>!b.disabled&&b.isConnected&&$('act').contains(b)))return true;
  if(view.accepted)return false;
  choose(view.title,view.opts);return true;
}
function invokeAnnualChoice(view,action){
  if(S!==view.state||S.year!==view.year||view.generation!==careerSession.choiceGeneration||view.accepted||!view.rendered)return;
  if([...yearHandoffs.get(S)?.values()||[]].some(h=>h.status==='STARTED'&&h.targetYear===S.year))throw new Error('NEXT_YEAR_AMBIGUOUS');
  const previous=careerSession.currentChoiceContext;careerSession.currentChoiceContext={state:S,year:S.year,view};
  try{const result=invokeChoiceAction(action);view.accepted=true;return result;}finally{careerSession.currentChoiceContext=previous;}
}
function invokeChoiceAction(action){archiveTraitResults();const previous=careerSession.currentChoiceAction;careerSession.currentChoiceAction=action;try{return action();}finally{careerSession.currentChoiceAction=previous;}}
function scrollAction(){scrollBottom();}
function runWithResultView(action){const before=$('log').querySelectorAll('.card').length;careerSession.resultViewDepth++;try{return action();}finally{careerSession.resultViewDepth--;if($('log').querySelectorAll('.card').length>before)scrollBottom();else if(!careerSession.resultViewDepth)scrollAction();}}
function choose(title,opts){
  actClear(); const a=$('act'), generation=++careerSession.choiceGeneration, token=createChoiceActionToken(generation);
  const view={state:S,year:S.year,generation,title,opts,buttons:[],accepted:false,kind:'CHOICE'};choiceViews.set(S,view);
  careerSession.activeChoiceToken=token;
  const buttons=gameView.renderChoices(title,opts);
  opts.forEach((o,i)=>{ const b=buttons[i];
    b.onclick=()=>{if(S!==view.state||S.year!==view.year||view.accepted)return;return runWithResultView(()=>runChoiceAction({action:()=>invokeAnnualChoice(view,o.f),currentMarkup:()=>a.innerHTML,clear:actClear,restore:()=>{if(S===view.state&&S.year===view.year)choose(title,opts);},token,currentGeneration:()=>careerSession.choiceGeneration,currentToken:()=>careerSession.activeChoiceToken,activateToken:t=>{careerSession.activeChoiceToken=t;},isCurrentChoice:()=>b.isConnected&&a.contains(b),buttonLabel:b.textContent.trim(),disableAll:()=>{a.querySelectorAll('button').forEach(button=>{button.disabled=true;});a.style.pointerEvents='none';},errorContext:()=>{const ct=S?.ct,schedule=Array.isArray(ct?.annualSchedule)?ct.annualSchedule:[],due=schedule.find(x=>Number(x.year)===Number(S?.year));return{year:S?.year??null,age:S?.age??null,stage:S?.stage??null,org:S?.org??null,level:S?.lv??null,contractId:ct?.contractId??null,contractStartYear:ct?.startYear??null,contractEndYear:ct?.endYear??null,contractRemainingYears:ct?.remainingYears??null,contractAnnualSalary:ct?.annualSalary??null,currentSalary:S?.currentSalary??null,lastSalaryPaidYear:S?.lastSalaryPaidYear??null,currentYearSchedule:due?{year:due.year,amount:due.amount,paid:Boolean(due.paid)}:null};},reportError:(error,d)=>{const val=x=>escapeDiagnosticHTML(String(x??'—')),schedule=d.currentYearSchedule?`${val(d.currentYearSchedule.amount)}円／${d.currentYearSchedule.paid?'支払済み':'未払い'}`:'なし';card('bad','処理中にエラーが発生しました',`選択処理を完了できませんでした。<br><b>エラーコード：${val(d.code)}</b><br><small>年度 ${val(d.year)}｜年齢 ${val(d.age)}｜${val(d.org)} ${val(d.level)}<br>契約ID ${val(d.contractId)}｜期間 ${val(d.contractStartYear)}～${val(d.contractEndYear)}｜残り ${val(d.contractRemainingYears)}年<br>現在年俸 ${val(d.currentSalary)}円｜最終支給年 ${val(d.lastSalaryPaidYear)}｜当年度年俸 ${schedule}</small><br>もう一度選択せず、この画面をスクリーンショットして報告してください。`);actToggleSync();}}));};view.buttons.push(b); });
  actToggleSync();view.rendered=true; if(!careerSession.resultViewDepth)scrollAction();
}
/* 能力加算介面：mode {dice：[..]} または {pool：n}。 */
function allocUI(mode,label,done){
  actClear(); ++careerSession.choiceGeneration; const generation=careerSession.choiceGeneration, state=S; careerSession.activeChoiceToken=null; const a=$('act'); const keys=POS_AB[S.pos];
  let completed=false;
  const year=S.year;choiceViews.set(S,{kind:'ALLOCATION',state,year,generation});
  const live=element=>!completed&&S===state&&S.year===year&&careerSession.choiceGeneration===generation&&element.isConnected&&a.contains(element);
  let dice=mode.dice?mode.dice.slice():null, pool=mode.pool||0, idx=0, hist=[];
  a.innerHTML=`<div class="title">${label}</div><div id="al-top"></div><div id="al-rows"></div><div class="row2" id="al-btm"></div>`;
  const touchedKeys={};
  const copyTouched=()=>({...touchedKeys});
  const restoreTouched=value=>{Object.keys(touchedKeys).forEach(k=>delete touchedKeys[k]);Object.assign(touchedKeys,value);};
  const sessionStart={abilities:{...S.ab},carry:{...(S.carry||{})},pool,diceIndex:idx,touchedKeys:copyTouched()};
  const top=$('al-top'),rows=$('al-rows'),btm=$('al-btm');
  function remaining(){ return dice?dice.length-idx:pool; }
  function render(focusKey){
    if(dice){ top.innerHTML='<div id="dice">'+dice.map((v,i)=>`<div class="die ${i<idx?'used':''} ${i===idx?'active':''} ${v===6?'six':''}">${v}</div>`).join('')+'</div>'; }
    else top.innerHTML=`<div class="pool" aria-live="polite">残り配分ポイント：${pool}</div>`;
    rows.innerHTML='';
    keys.forEach(k=>{ const v=S.ab[k],cap=v>=80;
      const available=!cap&&remaining()>0;
      const r=document.createElement('div'); r.className='abrow'+(cap?' capped':'');r.dataset.abilityKey=k;r.setAttribute('role','button');r.setAttribute('aria-label',dice?`${ABL[k]}に現在のサイコロを割り当てる`:`${ABL[k]}に1ポイント配分`);r.setAttribute('aria-disabled',String(!available));r.tabIndex=available?0:-1;
      const pk=(S.pot&&S.pot[k])||62, cst=abCost(k), cr=(S.carry&&S.carry[k])||0;
      const info=document.createElement('div');info.className='abrow-info';info.innerHTML=`<span class="nm">${ABL[k]}</span><span class="bar"><i style="width:${v/80*100}%"></i><em style="left:${pk/80*100}%"></em></span><span class="val" style="line-height:1.1">${v}<small style="opacity:.5">/${pk}</small><span class="progress">${cr}/${cst}</span></span>`;r.appendChild(info);
      const allocate=()=>{if(!live(r)||S.ab[k]>=80||remaining()<=0)return;const before={abilityKey:k,beforeAbility:S.ab[k],beforeCarry:(S.carry&&S.carry[k])||0,beforePool:pool,beforeDiceIndex:idx,beforeTouched:copyTouched()};const spend=dice?dice[idx]:1;if(spend<=0)return;archiveTraitResults();const got=addAb(k,spend);touchedKeys[k]=(touchedKeys[k]||0)+spend;hist.push({...before,spent:spend,gained:got});if(dice)idx++;else pool--;render(k);board(0);};
      if(available){r.onclick=allocate;r.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();allocate();}};}
      rows.appendChild(r); });
    btm.innerHTML='';
    /* 復原鈕固定占める位：なし可復原時 disabled 而非消失、防止版面跳動作誤觸。 */
    const u=document.createElement('button'); u.className='btn'; u.style.textAlign='center';
    u.textContent='↩ 元に戻す'; u.disabled=!hist.length;
    u.style.opacity=hist.length?'1':'0.35'; u.style.cursor=hist.length?'pointer':'default';
    if(hist.length)u.onclick=()=>{if(!live(u)||!hist.length)return;const entry=hist.pop();S.ab[entry.abilityKey]=entry.beforeAbility;if(!S.carry)S.carry={};S.carry[entry.abilityKey]=entry.beforeCarry;pool=entry.beforePool;idx=entry.beforeDiceIndex;restoreTouched(entry.beforeTouched);render(entry.abilityKey);board(0);};
    btm.appendChild(u);
    const reset=document.createElement('button');reset.type='button';reset.className='btn warn';reset.textContent='すべてリセット';reset.disabled=!hist.length;reset.onclick=()=>{if(!live(reset)||!hist.length)return;Object.assign(S.ab,sessionStart.abilities);S.carry={...sessionStart.carry};pool=sessionStart.pool;idx=sessionStart.diceIndex;restoreTouched(sessionStart.touchedKeys);hist=[];render();board(0);};btm.appendChild(reset);
    const allCap=keys.every(k=>S.ab[k]>=80);
    if(remaining()===0||allCap){ const c=document.createElement('button'); c.className='btn main';
      c.textContent=(remaining()>0&&allCap)?'能力が上限に達しました。残ったサイコロを捨てます ▸':'確定 ▸';
      c.onclick=()=>{if(!live(c)||!(remaining()===0||keys.every(k=>S.ab[k]>=80)))return;completed=true;return runWithResultView(()=>{ archiveTraitResults();actClear(); allocDone(touchedKeys,dice?true:false); done(); });}; btm.appendChild(c); }
    actToggleSync();
    if(focusKey){const target=a.querySelector(`[data-ability-key="${focusKey}"]`);(target?.getAttribute('aria-disabled')==='false'?target:a.querySelector('.abrow[aria-disabled="false"], #al-btm button:not(:disabled)'))?.focus();}
  }
  render();
}
/* 年間進出行。 */
function nextStep(){ if(S.done){ careerSession.stepQ=[]; return; } /* 已引退：クリア済み後継続步驟、以後はしない跑契約更新/結算。 */ const f=careerSession.stepQ.shift(); if(f)f(); }
/* シーズン開幕前。 */
function phasePre(){
  board(0); S.tmpInj=0; S.seasonFactor=1; S.skipMid=false; S._majorInjuryThisSeason=false; S.prevD=S.lastD||0; S.lastD=0; /* 先保持上季 d 供投手定位判定。 */
  if(S.age>=48){ buyoutRemaining(1); reportFlowOutcome({kind:'PRESEASON_AGE_LIMIT_RETIRED',reason:'体はもう限界。'+S.year+' 年の春季キャンプ後に引退を発表した。'}); return; }
  const declAge=S.age-(S.traits.disc?2:0); /* 自律狂：衰えの開始を2年遅らせる。 */
  if(declAge>=32){ const dec=declineForSeason(S,declAge>=35?5+(declAge-35):2);
    POS_AB[S.pos].forEach(k=>S.ab[k]=clamp(S.ab[k]-dec,1,80));
    card('bad','寄る年波には勝てない',`${declAge>=35?'第2段階（年々加速）':'第1段階'}の衰え：全能力<b class="dn">−${dec}</b>${S.traits.disc?'（自律の鬼：キャリアの衰えが2年遅延）':''}。これまでどおり追加トレーニングはできますが、体が元に戻ることはありません。`); board(0); }
  if(S.rehab>0){ S.rehab--; S.skipMid=true; S.seasonFactor=0;
    if(S.stage==='PRO'&&S.lv==='NPB1')checkGoldclothSeason();
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
    choose('',[{t:`▸ トレーニング成果を割り振る（サイコロ${dice.length}個）`,main:true,f:()=>dposReview(()=>allocUI({dice},'能力の項目を選んで、サイコロを割り当てます。能力値が高くなるほど、成長に必要なポイントが増えます。潜在能力を超える場合は、さらにポイントが必要です。能力値の上限は80です。',()=>nextStep()))}]);
  };
  /* 投手の開幕前：投球強度(持久力+TJ ゲージ)。 */
  const preAsk=afterAsk;
  if(S.pos==='P'&&S.stage==='PRO'&&!S.skipMid){
    afterAsk=()=>{
      choose(`開幕前の投球プラン（腕の状態：${(function(){const r=S.tj/tjCap();return S.rehab>0?'リハビリ中':r>=0.85?'肘に鈍い痛み':r>=0.6?'腕にやや疲労':r>=0.35?'まずまず':'腕が軽い';})()}）`,[
        {t:'全力投球',warn:true,s:'成績重視｜腕への負担：最大（TJゲージ ×1.25）',f:()=>{S.effort='全力投球';preAsk();}},
        {t:'通常投球',main:true,s:'標準強度｜TJゲージ増加：通常',f:()=>{S.effort='通常投球';preAsk();}},
        {t:'省エネ投球',s:'成績は控えめ｜腕を温存（TJゲージ ×0.65）',f:()=>{S.effort='省エネ投球';preAsk();}}]);
    };
  }
  if(S.stage==='PRO'&&S.age>=36&&S.rehab===0){
    const oldOpts=[{t:'もう一年挑戦する',main:true,f:afterAsk}];
    /* 海外所属のベテラン(衰退期)：現契約を破棄、台湾球界へ復帰;ovr<30(実力不足)対象外。 */
    if(['MLB','MiLB','KBO','CPBL'].includes(S.org)&&ovr()>=LV.NPB2.min){
      oldOpts.push({t:'契約を断り、日本球界へ戻る',s:'全盛期は過ぎた。それでも最後のプレーを故郷のファンに見せたい',f:()=>{
        const returnLv=ovr()>=LV.NPB1.min?'NPB1':'NPB2';
        buyoutRemaining();signTo('NPB',returnLv);card('good','日本球界復帰',`海外で積み上げた経験を携え、<b class="hl">${S.teamName()}</b>で日本球界へ復帰した。`);reportFlowOutcome({kind:'PRESEASON_RETURNED_NPB'});
      }});
    }
    oldOpts.push({t:'引退記者会見を開く',warn:true,s:'現役を引退する',f:()=>{buyoutRemaining();daibaFarewell(()=>reportFlowOutcome({kind:'PRESEASON_RETIRED',reason:'功成り名を遂げ、 '+S.year+' 年に現役引退を発表。'}));}});
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
function evOdds(){return eventOdds(S.traits);}
function eventChoiceSummary(ev,mode){
  const category=effectiveCategory(ev,S.stage),tier=eventTier(S.traits),good=eventPlan(category,mode,tier,true),bad=eventPlan(category,mode,tier,false);
  const label={training:'トレーニング',encounter:'日常・交流',endorsement:'広報・スポンサー'}[category];
  const effect=plan=>[plan.ability>0?'育成点+'+plan.ability:plan.ability<0?'能力'+plan.ability:'',plan.stat?'今季成績点'+(plan.stat>0?'+':'')+plan.stat:''].filter(Boolean).join('・');
  const risk=eventInjury(ev,mode,false,S.traits),income=good.cash?eventIncome(S.lv,mode,true,S.traits):0;
  return label+'｜成功率 '+evOdds()[mode]+'%｜成功：'+effect(good)+'／失敗：'+effect(bad)+(good.cash?'｜成功時スポンサー収入：'+fmtMoney(income):'')+(risk?'｜失敗時故障リスク加算+'+risk+'ポイント':'');
}
function drawEvents(n,done){
  if(n<=0){done();return;}
  choose('',[{t:'イベントカードを引く（残り'+n+'枚）',main:true,f:()=>{
    const pool=eventDrawPool(S,EVENTS);
    if(!pool.length){card('info','イベント','今年まだ引いていない対象のイベントカードがないため、次へ進みます。');done();return;}
    const ev=pick(pool),pending=beginEvent(S,ev);
    const after=()=>{board(1);drawEvents(n-1,done);};
    choose('イベント｜'+ev.n+'――'+ev.intro,EVENT_MODES.map(mode=>({t:ev.choices[mode].label,warn:mode==='bold',main:mode==='norm',s:eventChoiceSummary(ev,mode),f:()=>resolveEvent(ev,mode,after,pending.eventOccurrenceID)})));
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
      {t:'堂々と認める：「温かく見守ってください」',s:'相手の所属先が認めるか次第（厳しいイメージ管理の噂）',f:()=>{
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
    {t:'謝罪してもう一度チャンスを彼女に懇願する',s:'成功＝関係を続ける｜失敗＝能力がさらに低下して別れる',f:()=>{
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
  return `${ABL[k]}の能力ポイントを蓄積したが、能力値の上昇には届かなかった`;
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
function renderEventResult(ev,result){
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const out=[({bold:'勝負',norm:'通常',safe:'安全'}[result.mode])+(result.success?'成功':'失敗')],a=result.ability;
  const points=result.abilityPoints??eventPlan(result.category,result.mode,result.tier,result.success).ability;
  if(points>0)out.push('獲得育成点 +'+points);
  else if(points<0)out.push('適用育成点 '+points);
  if(a){out.push((a.abilityDelta<0?'能力低下：':'')+ABL[result.target]+'：'+(a.abilityDelta>0?'+':'')+a.abilityDelta);out.push('育成点繰越 '+a.carryBefore+' → '+a.carryAfter);if(a.abilityDelta===0&&result.success&&!result.overflowStat)out.push('育成点は繰越へ蓄積され、次の1段階に必要なコストには届きませんでした。');}
  if(result.statDelta)out.push('今季成績点'+(result.statDelta>0?'+':'')+result.statDelta);
  if(result.overflowStat)out.push('能力80の超過分：今季成績点+'+result.overflowStat);
  if(result.injuryAdded)out.push('今季の故障リスク加算+'+result.injuryAdded+'ポイント（故障確定ではありません）');
  if(result.incomeYen)out.push('スポンサー収入：'+fmtMoney(result.incomeYen));
  card(result.success?'good':'bad','イベントカード｜'+ev.n,escape(ev.choices[result.mode][result.success?'good':'bad'])+'<br>'+out.map(escape).join('｜'));
  const node=logTarget().lastElementChild;if(node){node.dataset.eventOccurrenceId=result.eventOccurrenceID;node.dataset.cardId=String(result.cardID);}
}
function resolveEvent(ev,mode,done,occurrenceID){
  const {applied,result}=applyEvent(S,ev,mode,{chance,pick,abilityKeys:POS_AB[S.pos],occurrenceID});
  renderEventResult(ev,result);if(!applied)return;
  result.unlocked.forEach(key=>card(['cancer','distract','latepractice'].includes(key)?'bad':'gold','隠し特性解放：'+displayTrait(key),EVENT_TRAIT_TEXT[key]));
  (done||(()=>{}))();
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
  ensureEventState(S);
  for(const key of eventTraitUnlocks(S))traitCard(key,displayTrait(key),EVENT_TRAIT_TEXT[key],['cancer','distract','latepractice'].includes(key)?'bad':'gold');
}
function teamNick(team){ /* ◯◯先生的◯◯：球団名を代表する語を取得。 */
  const map={'台中マンモス':'マンモス','府城ライオンズ':'ライオン','桃園コングス':'キングコング','新北ナイツ':'騎士','台北ダイナソーズ':'恐竜','高雄イーグルス':'神鷲',
    /* 同名処理：ソックス系は色で区別;大人2球団ともオレンジ、都市名で区別。 */
    'ボストン・レッドソックス':'レッドソックスのキング','シカゴ・ホワイトソックス':'ホワイトソックスのキング','東京グランズ':'東京グランズ','ベイエリア・ジャイアンツ':'ベイエリア・ジャイアンツ',
    /* slice(-2) 切字修正。 */
    'オークランド・アスレチックス':'オークランド・アスレチックス','アリゾナ・ダイヤモンドバックス':'コブラ'};
  return map[team]||(team||'').slice(-2);
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
    if(S.traits.cancer){ removeTrait('cancer','チームの癌');
      card('good','結果で黙らせる','シーズンを通した活躍で周囲を黙らせた――<b class="hl">「チームの癌」を返上</b>。降格を拒否した判断が正しかったと証明した。'); board(1); }
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
        card('bad','隠し特性解放：問題児','またメディアに不満をぶちまけた。フロントも「抱えておくには危険すぎる」と判断――<b class="dn">今後のトレード発生率が永久に上昇</b>。'); board(1); }
      if(chance(60)){ doTradeExec(); card('bad','噂が現実に',`不満発言が一面を飾り、球団はそのまま放出を決断。新天地で結果を出すしかない。`); board(1); }
      else card('info','騒いだだけで何もなし','苦情は苦情、この取引は結局実現しませんでした。あなたはまだ元のチームにいますが、雰囲気は少し緊張しています。');
      cont(); }},
    {t:'黙ってプレーに集中する',main:true,s:'トレード確率は変わらない',f:()=>{
      if(chance(35)){ doTradeExec(); card('info','取引は完了しました',`あなたの沈黙にもかかわらず、チームは取引を完了しました。 '`); board(1); }
      else card('info','泊まった','噂はあくまで噂です。新しい野球シーズンでも、同じジャージを着ます。');
      cont(); }}]);
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
    return `大けがの影響で、<b class="dn">全能力が−5</b>。`;
  }
  if(!chance(40))return '';
  const keys=POS_AB[S.pos];
  let k=pick(keys); if(!(k in S.ab))k=pick(keys);
  const amt=ri(1,2);
  S.ab[k]=clamp(S.ab[k]-amt,1,80); board(1);
  return `けがの後遺症が残った：<b class="dn">${ABL[k]} −${amt}</b>。`;
}
function proSeason(){
 const pending=seasonContinuations.get(S);
 if(pending?.year===S.year)return resumeProfessionalSeason(pending);
 const continuation={state:S,year:S.year,phase:'BUILDING'};seasonContinuations.set(S,continuation);
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
  const eventPoints=(S.pendStat||0)*S.seasonFactor,eventOptions={pos:S.pos,role:S.role,maxGames:maxG};
  if(eventPoints!==0)Object.assign(st,applyEventSeason(st,{...eventOptions,points:S.pendStat,seasonFactor:S.seasonFactor}));
  consumeEventSeason(S);
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
  if(eventPoints!==0)Object.assign(st,normalizeEventSeason(st,eventOptions));
  const levelKey=S.lv,bucket=bucketOf(levelKey); accStat(bucket,st); accLevelStat(levelKey,st);
  if(S.seasonFactor===0){ card('bad','シーズン成績','（今季はけがで全休）'); }
  else if(S.tradeFrom){ /* シーズン途中の移籍：移籍前後の2区分を表示+合計。 */
    const r=0.35+R()*0.3, p1=portionOf(st,r), p2=portionOf(st,1-r);
    card('','シーズン成績（シーズン途中の移籍）',
      `<span class="tag">${S.tradeFrom}</span><div class="statline">${statLine(p1)}</div>`+
      `<span class="tag">${S.teamName()}</span><div class="statline">${statLine(p2)}</div>`+
      `<span class="tag">合計</span><div class="statline">${statLine(st)}</div>`);
  }
  else card('','シーズン成績',`<span class="tag">${S.teamName()}${S.dpos?'｜'+S.dpos:''}</span><div class="statline">${statLine(st)}</div>`);
  /* 不調整年・キャリアハイ年の説明カード。 */
  if(st.form===-1){
    card('bad','深刻なスランプ',`体調は万全だったが、思うような成績を残せず、長いスランプに苦しんだ。`);
  }else if(st.form===1){
    if(S.pos==='P') card('gold','キャリアハイ','指先の感覚が研ぎ澄まされ、投じる球は思いどおりに変化した。打者のバットは空を切り、ボールは捕手のミットへ吸い込まれた。');
    else card('gold','キャリアハイ','ボールが大きく、ゆっくり見えた。芯で捉えた打球は次々とスタンドへ消えていった。');
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
        traitCard('onetool','一芸特化',`突出した一つの武器を買われ、首脳陣は重要な場面に役割を絞って起用することを決めた。<b class="hl">${role}</b>として出場機会は限られるが、その強みは他の追随を許さない。`,'bad'); }
    else if(S.traits.onetool && (tg.gap<18 || (S.seasonFactor>0 && st.G>=LV[S.lv].g*0.60))){ /* 能力を回復 または レギュラーへ復帰 → 解除。 */
      removeTrait('onetool','一芸特化'); S.toolRole=null;
      card('good','一芸特化を返上','ついに先発メンバーへ定着。ベンチの切り札だけではないことを結果で証明した――<b class="hl">「一芸特化」を解除</b>。もう立派なレギュラーや。'); board(1); } }
  Object.assign(continuation,{bucket,st,phase:'AWARDS'});
  return resumeProfessionalSeason(continuation);
}
function resumeProfessionalSeason(entry){
  if(entry.state!==S||entry.year!==S.year)throw new Error('STALE_SEASON_CONTINUATION');
  if(entry.phase==='BUILDING')throw new Error('PRO_SEASON_AMBIGUOUS');
  if(entry.phase==='AWARDS'){awards(entry.bucket,entry.st);entry.phase='EVALUATION';}
  if(entry.phase==='EVALUATION'){
    S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});
    recordSalaryEvaluation(entry.st);entry.phase='CHAMPIONSHIP';
  }
  if(entry.phase==='CHAMPIONSHIP'){captureSeasonChampionship(S);entry.phase='TJ_ACCRUAL';}
  if(entry.phase==='TJ_ACCRUAL'){if(S.pos==='P'&&S.seasonFactor>0)tjAccrue();entry.phase='PIPELINE_PREPARED';}
  if(entry.phase==='PIPELINE_PREPARED'){
    entry.phase='PIPELINE_STARTED';runSeasonPipeline(0);entry.phase='PIPELINE_WAIT';return;
  }
  if(resumeSeasonEnd())return;
  if(restorePendingChoice())return;
  throw new Error('SEASON_CONTINUATION_AMBIGUOUS');
}
function runSeasonPipeline(step){
  const steps=['TJ_GAMBLE','DEMOTION_AUDIT','TRADE_CHECK','INTL_POST'];
  if(step>=steps.length)return nextStep();
  const cont=()=>runSeasonPipeline(step+1);
  switch(steps[step]){
    case 'TJ_GAMBLE':return tjGamble(cont);
    case 'DEMOTION_AUDIT':return demotionAudit(cont);
    case 'TRADE_CHECK':return tradeCheck(cont);
    case 'INTL_POST':return maybeIntl(cont);
  }
}
function awards(bucket,st){
  if(!LV[S.lv].top||S.seasonFactor===0)return;
  const tx=annualAwardTransaction(S,{league:bucket,level:S.lv,role:S.role??null,metrics:st});
  preallocateAwardSlots(tx,['ALL_STAR','ROOKIE','LEGACY_BEST_PITCHER','PITCH_SAVES','PITCH_RELIEF','PITCH_STRIKEOUTS','BATTING_AVG','BATTING_HR','BATTING_SB','BATTING_RBI','BATTING_OBP','GOLD_GLOVE','DEFENSE_BEST','MVP']);
  const plan=awardPlan(tx,()=>collectLegacyAwardPlan(bucket,st,tx,S));
  recordAwardDecisions(tx);
  const groups=[['legacy-honors',plan.writes.filter(w=>w.path[0]==='honors')],
    ['legacy-all-star',plan.writes.filter(w=>w.path[0]==='stats')],
    ['legacy-triple-crown-history',plan.writes.filter(w=>w.path[0]==='tripleCrownHistory')],
    ['legacy-traits',plan.writes.filter(w=>!['honors','stats','tripleCrownHistory'].includes(w.path[0]))]];
  // Prepare every independent effect family before writing any of them.
  for(const [id,writes] of groups)prepareAwardReceipt(tx,id,writes);
  for(const [id] of groups)commitAwardReceipt(tx,id);
  completeAwardDecisions(tx);
  for(const key of plan.removedTraits)traitPresentation.get(S)?.delete(key);
  while(plan.renderIndex<plan.cards.length){renderCheckpointCard(plan,plan.renderIndex,plan.cards[plan.renderIndex]);plan.renderIndex++;}
}
function renderCheckpointCard(owner,key,args){
  const receipts=owner.renderReceipts||(owner.renderReceipts=new Map());let receipt=receipts.get(key);
  if(receipt?.status==='COMMITTED')return;
  if(receipt?.status==='AMBIGUOUS')throw new Error('RESULT_RENDER_AMBIGUOUS');
  if(!receipt){receipt={status:'PLANNED'};receipts.set(key,receipt);}
  const target=typeof document!=='undefined'?logTarget():null,count=target?.children.length;
  try{card(...args);receipt.node=target?.lastElementChild;receipt.status='COMMITTED';}
  catch(error){
    // card appends synchronously before scrollBottom. An already appended owned card
    // may be acknowledged, but unexplained extra DOM writes must not be guessed.
    if(target&&target.children.length===count+1&&target.lastElementChild.classList.contains('card')){receipt.node=target.lastElementChild;receipt.status='COMMITTED';}
    else if(target&&target.children.length!==count)receipt.status='AMBIGUOUS';
    throw error;
  }
}
function collectLegacyAwardPlan(bucket,st,tx,realState){
  const cards=[],removedTraits=[];
  // Narrow preparation projection only; never clone/rollback the whole state or RNG.
  const before=awardInputs(tx,()=>({year:realState.year,age:realState.age,pos:realState.pos,role:realState.role,dpos:realState.dpos,
    lv:realState.lv,seasonFactor:realState.seasonFactor,orgTeamId:realState.orgTeamId,
    stats:Object.fromEntries(Object.entries(realState.stats).map(([k,v])=>[k,{...v}])),
    honors:realState.honors.slice(),traits:{...realState.traits},removed:realState.removed.slice(),
    pool:realState.pool,oldGhostUsed:realState.oldGhostUsed,oldGhostPending:realState.oldGhostPending,
    tripleCrownHistory:realState.tripleCrownHistory===undefined?undefined:structuredClone(realState.tripleCrownHistory)}));
  const S=structuredClone(before);
  const displayTrait=key=>traitLabel(key,S,teamNick);
  const draw=(id,p)=>captureAwardSlot(tx,id,p,()=>R(),()=>realState.rngState);
  const card=(...args)=>cards.push(args);
  const removeTrait=(key,label)=>{if(S.traits[key]){S.traits[key]=false;removedTraits.push(key);if(!S.removed.includes(label))S.removed.push(label);}};
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
    if(draw('ALL_STAR',asP)){ S.stats[bucket].AS++;
      h.push(`${y} ${lgN}オールスターゲーム`+((bucket==='CPBL'&&S.orgTeamId==='CPBL_TAICHUNG_MAMMOTHS'&&d<2)?'(ファン投票選出)':'')); } }

  /* 2. 新人王：に応じて d 値成長確率。 */
  const rookieOK=bucket!=='CPBL'||!(S.stats.NPB||S.stats.MLB||S.stats.MINOR);
  if(S.stats[bucket].yr===1&&rookieOK&&st.d>=4){
    const rkP = clamp(30 + (st.d - 4) * 15, 30, 95);
    if(draw('ROOKIE',rkP)) h.push(`${y} ${lgN}新人王`);
  }

  /* 3. 投手個人タイトル。 */
  if(S.pos==='P'){
    const aw='最優秀防御率投手賞';
    if(isSP() && st.era <= th.era[0] && st.IP >= th.g){ 
      const god = st.era <= th.era[1] && st.IP >= 150;
      const p = god ? 100 : clamp(30 + Math.round((th.era[0] - st.era) * 35 + (st.IP - th.g) * 0.4), 30, 95);
      if(draw('LEGACY_BEST_PITCHER',p)) h.push(`${y} ${lgN}${aw}`);
    }
    if(S.role==='CL' && st.SV >= th.sv[0]){
      const god = st.SV >= th.sv[1];
      const p = god ? 100 : clamp(28 + (st.SV - th.sv[0]) * 5, 28, 95);
      if(draw('PITCH_SAVES',p)) h.push(`${y} ${lgN}最多セーブ投手賞`);
    }
    if(S.role==='MR' && (st.HLD||0) >= th.hld[0]){
      const god = (st.HLD||0) >= th.hld[1];
      const p = god ? 100 : clamp(28 + ((st.HLD||0) - th.hld[0]) * 4, 28, 95);
      if(draw('PITCH_RELIEF',p)) h.push(`${y} ${lgN}最優秀中継ぎ投手賞`);
    }
    if(st.SO >= th.so[0]){
      const god = st.SO >= th.so[1];
      const p = god ? 100 : clamp(25 + Math.round((st.SO - th.so[0]) * 1.2), 25, 95);
      if(draw('PITCH_STRIKEOUTS',p)) h.push(`${y} ${lgN}最多三振奪取投手賞`);
    }
  }
  /* 4. 野手個人タイトル。 */
  else{
    if(st.PA >= 350 && st.avg >= th.avg[0]){
      const god = st.avg >= th.avg[1];
      const p = god ? 100 : clamp(25 + Math.floor((st.avg - th.avg[0]) / 0.005) * 6, 25, 95);
      if(draw('BATTING_AVG',p)) h.push(`${y} ${lgN}首位打者`);
    }
    if(st.PA >= 300 && st.HR >= th.hr[0]){
      const god = st.HR >= th.hr[1];
      const p = god ? 100 : clamp(25 + (st.HR - th.hr[0]) * 5, 25, 95);
      if(draw('BATTING_HR',p)) h.push(`${y} ${lgN}本塁打王`);
    }
    if(st.PA >= 300 && st.SB >= 25){ // SB不隨試合数放大、全リーグ標準一致。
      const god = st.SB >= 45;
      const p = god ? 100 : clamp(25 + (st.SB - 25) * 4, 25, 95);
      if(draw('BATTING_SB',p)) h.push(`${y} ${lgN}盗塁王`);
    }
    if(st.PA >= 300 && st.RBI >= th.rbi[0]){
      const god = st.RBI >= th.rbi[1];
      const p = god ? 100 : clamp(25 + (st.RBI - th.rbi[0]) * 2, 25, 95);
      if(draw('BATTING_RBI',p)) h.push(`${y} ${lgN}打点王`);
    }
    const obp = st.PA > 0 ? (st.H + st.BB) / st.PA : 0;
    if(st.PA >= 350 && obp >= th.obp[0]){
      const god = obp >= th.obp[1];
      const p = god ? 100 : clamp(25 + Math.floor((obp - th.obp[0]) / 0.005) * 5, 25, 95);
      if(draw('BATTING_OBP',p)) h.push(`${y} ${lgN}最高出塁率`);
    }
    const def1 = st.DEF || 0;
    if(S.dpos !== 'DH' && S.seasonFactor >= 0.7){
      if(def1 >= 6){
        const pGlove = clamp(38 + (def1 - 6) * 5, 38, 95);
        if(draw('GOLD_GLOVE',pGlove)) h.push(`${y} ${lgN}ゴールデングラブ賞`);
      }
      if(def1 >= 11){
        const pDef = clamp(30 + (def1 - 11) * 6, 30, 95);
        if(draw('DEFENSE_BEST',pDef)) h.push(`${y} ${lgN}年間最優秀守備選手`);
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
    if(draw('MVP',pMVP)) h.push(`${y} ${lgN}年間MVP`);
  }

  // All original qualified slots have already consumed precisely their native draws.
  // New awards are derived from this transaction's frozen input, never old strings.
  const d2=prepareD2AwardDecisions(tx,SEED);
  for(const decision of d2.decisions)if(decision.awarded){
    const text=`${y} ${lgN}${getAwardDefinition(decision.awardId).displayName}`;
    if(!h.includes(text))h.push(text);
  }
  if(d2.triple){
    S.tripleCrownHistory??={};S.tripleCrownHistory.pitcherTC??=[];
    const history=S.tripleCrownHistory.pitcherTC,newLeague=!history.some(r=>r.bucket===bucket);
    if(!history.some(r=>r.year===y&&r.bucket===bucket))history.push({year:y,bucket,league:lgN});
    if(!h.includes(`${y} ${lgN}年間MVP`))h.push(`${y} ${lgN}年間MVP`);
    if(!S.traits.pitcherTC||newLeague){S.traits.pitcherTC=true;card('gold','隠し特性解放：'+displayTrait('pitcherTC'),TRAIT_TEXT.pitcherTC);}
  }
  const sawamura=d2.decisions.some(d=>d.awardId==='PITCH_SAWAMURA'&&d.awarded);
  // Preserve the original MVP draw above, even when either triple crown guarantees MVP.
  for(const key of awardTraitUnlocks(S,bucket,lgN))card('gold','隠し特性解放：'+displayTrait(key),TRAIT_TEXT[key]);
  /* 6. 後続の受賞で特性を発動作。 */
  const added=h.filter(x=>x.startsWith(String(y)));
  if(added.length){ card('gold','年間賞',added.map(x=>x.slice(5)).join('｜'));
    if(S.traits.yips){ removeTrait('yips','イップス'); card('good','イップス克服','大舞台で結果を残したことで迷いが消え、<b class="hl">イップスを克服した</b>。'); }
    // Exact additions only: preserve existing legacy/out-of-scope effects without guessing new award names.
    if(S.traits.glass&&!S.traits.phoenix){ const big=hasCurrentAwardEffect(S,'phoenix',bucket)||sawamura;
      if(big){ S.traits.phoenix=true; removeTrait('glass','スペランカー');
        S.pool+=8;
        card('gold','隠し特性解放：復活','大けがを乗り越え、以前より強くなって帰ってきた――<b class="hl">スペランカーのペナルティを解除。故障率が通常に戻り、大量の能力ポイントを獲得</b>。'); } }
  }
  const writes=[];
  for(const key of ['honors','removed','pool','tripleCrownHistory','oldGhostPending']){
    if(JSON.stringify(before[key])!==JSON.stringify(S[key]))writes.push({path:[key],before:before[key],after:S[key]});
  }
  for(const key of Object.keys(S.traits))if(!Object.is(before.traits[key],S.traits[key]))writes.push({path:['traits',key],before:before.traits[key],after:S.traits[key]});
  if(before.stats[bucket].AS!==S.stats[bucket].AS)writes.push({path:['stats',bucket,'AS'],before:before.stats[bucket].AS,after:S.stats[bucket].AS});
  return {cards,removedTraits,writes,renderIndex:0};
}
let applyPromotionSalary=()=>{};
let applyDemotionSalary=()=>{};
let markClubInitiatedRenewal=()=>{};
let salaryDForContract=d=>d, salaryCandidate;
let recordSalaryEvaluation=()=>{};
let recordIndependentSalaryEvaluation=()=>{};
let appendContractExtension=()=>{};
/* 升降格と去向。 */
function movement(){
  const o=ovr();
  /* プロ。 */
  if(isBelowActiveMinimum(o)){
    retireBelowActiveMinimum();
    return;
  }
  if(S.skipMid){if(contractNeedsRenewal(S.ct))markClubInitiatedRenewal(1);reportFlowOutcome({kind:'REHAB_YEAR_COMPLETED'});return;} /* リハビリ全休年も満了契約の来季更新を飛ばさない。 */
  if(S.org==='NPB')S.npbYears++;
  if(LV[S.lv].top){ /* 轉換リーグ：直接解除球団 5 年控制期制限、往後のみ要契約満了就是自由球員。 */
    if(S.svcOrg && S.svcOrg!==S.org){ S.faElig=true; }
    S.svcOrg=S.org;
    S.svc=(S.svc||0)+1; if(S.svc>=5)S.faElig=true;
  }
  /* 神主牌：同一球団での連続在籍年数(移籍でリセット、見 doTrade/signTo)。 */
  if(S.stage==='PRO'&&LV[S.lv].top){ S.teamYears=(S.teamYears||0)+1;
    if(goldclothEligible(S)){ S.traits.goldcloth=true;
      card('gold','隠し特性解放：黄金のユニフォーム',TRAIT_TEXT.goldcloth); board(1); }
    if(!S.traits.franchise&&S.teamYears>=7&&S.champThisTeam&&S.champTeam===S.orgTeamId){ S.traits.franchise=true;
      card('gold','隠し特性解放：神カード','この街のファンはあなたの成長を見守ってきた。放出すれば本拠地が炎上することをフロントも分かっている――<b class="hl">所属球団との再契約の評価に補正が入り、引退評価にも加点。球団はトレードを拒否する</b>。'); }
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
          card('info','隠しタイトル:'+displayTrait('rainbow'),`クローゼットには${n}着の異なるユニフォーム――${RB[lg][0]}の球団をほぼ一巡した。ファンからは「<b class="hl">渡り鳥</b>」と呼ばれる。どこでも生き残れるのも立派な能力だ。`); board(1); break; }
      }
    } }
  const path=PATHS[S.org], idx=path.indexOf(S.lv);
  let minReq=LV[S.lv].min;
  if(S.org==='NPB'&&S.npbYears>=8){ minReq-=4; }
  const perf=(S.seasonFactor>=0.5)?(S.lastD||0):null; /* 傷缺季不確認成績。 */
  /* 受賞による降格保護：当該シーズンに個人タイトルを獲得(MVP/王/最優秀投手、オールスターを除く)→降格・戦力外にしない。 */
  // Separate exact protection set; Gold Glove is not a phoenix title. Old current-year cross-league scope remains.
  const wonAward = hasCurrentAwardEffect(S,'demotion',S.org);
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
      card('info','球団の評価',`体力測定は危険水域。それでも<b class="hl">結果</b>で黙らせた――今季はリーグ水準の成績を残し、球団は現レベルで様子を見ることにした。`);
    }else{ handleDemotion(o,path,idx); return; }
  }else if(perf!==null&&perf<=-6&&chance(55)){ /* 能力が残っていても成績が急落、降格対象。 */
    card('bad','球団の評価','数字はリーグ水準を大きく下回り、首脳陣の我慢も限界に達した。');
    handleDemotion(o,path,idx); return;
  }
  /* 昇格(圧倒的成績なら2段階昇格可能)。 */
  if(idx<path.length-1){ const nx=path[idx+1];
    if(o>=LV[nx].min&&((S.lastD||0)>=0||chance(50))){
      let to=nx;
      if(idx<path.length-2){ const nx2=path[idx+2];
        if(o>=LV[nx2].min+2&&(S.lastD||0)>=4)to=nx2; }
      const fromLv=S.lv;
      S.lv=to; applyPromotionSalary(fromLv,to); card('good','昇格通知',`活躍が評価され、${to!==nx?'<b class="hl">二段階昇格</b>':'昇格'}！ 新天地は<b class="hl">${LV[to].n}</b>。`); board(2);
      if(S.traits.yips){ removeTrait('yips','イップス'); card('good','イップス克服','本来の階級へ戻り、自分のリズムを取り戻した――<b class="hl">イップスを克服した</b>。'); } } }
  if(!S.ct)throw new Error('PRO_PLAYER_WITHOUT_CONTRACT');
  /* 所属球団との延長交渉は複数年契約の残り2年時点、または最終契約の残り1年で行う。 */
  if(S.ct.remainingYears===1&&LV[S.lv].top&&!S.ct.extOffered&&S.faElig&&(S.lastD||0)>=1&&chance(45)){
    S.ct.extOffered=true; extensionOffer(o); return;
  }
  if(S.ct.remainingYears<=0){
    if(LV[S.lv].top){
      if(S.faElig){ faFlow(o); return; }
      /* プロ5年目までは球団が保有権を行使して短期更新し、年俸は所属階級の基準額を下回らない。 */
      const renewalYears=1;if(S.org==='NPB')S.ct=null;markClubInitiatedRenewal(renewalYears);
      card('info','チーム契約更新',`まだ球団保有期間（在籍${S.svc}/5年）。球団が契約更新権を行使し、<b class="hl">${renewalYears}年</b>契約を提示。年俸は所属レベル基準となる。`); board(1);
    } else { const renewalYears=1;if(S.org==='NPB')S.ct=null;markClubInitiatedRenewal(renewalYears); } /* 海外の満了契約は進路確定まで保持する。 */
  }
  crossOffers(o);
}
function buyoutRemaining(rate){ /* 残契約の支払いは選手都合の解除で70%、球団都合なら100%。 */
  S.transferSalarySnapshot={annualSalary:S.currentSalary||S.ct?.annualSchedule?.at(-1)?.amount||0,contract:S.ct,org:S.org,level:S.lv,teamId:S.orgTeamId};
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
function handleDemotion(o,path,idx){
  if((S.lv==='CPBL1'||S.lv==='NPB1'||S.lv==='MLB')&&(S.lastD||0)<=-6&&!S.traits.yips&&S.seasonFactor>=0.5){
    traitCard('yips','イップス',`体にけがはなかったが、グラウンドに立つと昨季の失敗がよみがえる――。<b class="dn">評価が一時的に−3となり、再昇格または年間表彰まで解除されない。</b>`,'bad'); }
  const targetLevel=findDemotionTarget(path,idx,o,LV);
  const acceptText=demotionChoiceText(targetLevel,LV);
  const doDemote=()=>{
    /* 同じ組織内で条件を満たす階級を探す。 */
    if(targetLevel){
      /* 海外組織で降格時、アジア球団も同時にオファー。 */
      const alts=[];
      if(S.org==='MiLB'){
        if(o>=LV.NPB1.min&&chance(Math.round(60*ageGateJP()))){
          const candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:'NPB1',contractMult:1}),annualSalary=candidate.annualSalary;
          alts.push({t:'NPB一軍への移籍',s:`NPB移籍契約｜年俸${fmtMoney(annualSalary)}`,f:()=>{buyoutRemaining();signTo('NPB','NPB1',undefined,undefined,undefined,undefined,{annualSalary,candidate});reportFlowOutcome({kind:'DEMOTION_TRANSFER_NPB1'});}});
        }else if(o>=LV.NPB2.min&&chance(50)){
          const candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:'NPB2',contractMult:1}),annualSalary=candidate.annualSalary;
          alts.push({t:'日本の二軍（支配下）へ移籍',s:`NPB二軍（支配下）契約｜年俸${fmtMoney(annualSalary)}`,f:()=>{buyoutRemaining();signTo('NPB','NPB2',undefined,undefined,undefined,undefined,{annualSalary,candidate});reportFlowOutcome({kind:'DEMOTION_TRANSFER_NPB2'});}});
        }
      }else if(S.org==='NPB'&&o>=LV.CPBL1.min&&chance(70)){
        const annualSalary=salaryCandidate({sourceLevel:S.lv,targetLevel:'CPBL1',contractMult:1}).annualSalary;
        alts.push({t:'台湾プロ野球からのオファーを受ける',s:`台湾プロ野球一軍契約｜年俸${fmtMoney(annualSalary)}`,f:()=>{buyoutRemaining();signTo('CPBL','CPBL1',undefined,undefined,undefined,undefined,{annualSalary});reportFlowOutcome({kind:'DEMOTION_TRANSFER_CPBL1'});}});
      }
      if(alts.length){
        card('bad','降格通告',`成績が基準に届かず、球団は<b class="dn">${LV[targetLevel].n}</b>への降格を通告。しかし同時に、他リーグからオファーが届いた。`);
        choose('降格を受け入れるか、新天地を選ぶか？',[
          {t:LV[targetLevel].n+'への降格を受け入れる',main:true,f:()=>{const fromLv=S.lv;S.lv=targetLevel;applyDemotionSalary(fromLv,targetLevel);board(2);reportFlowOutcome({kind:'DEMOTION_ACCEPTED'});}},...alts]);
      }else{ const fromLv=S.lv;S.lv=targetLevel;applyDemotionSalary(fromLv,targetLevel);card('bad','降格通告',`成績が基準に届かず、<b class="dn">${LV[targetLevel].n}</b>への降格が決まった。`); board(2); reportFlowOutcome({kind:'DEMOTION_ACCEPTED'}); }
    }
    else outOfOrg(o);
  };
  const longContract = S.ct && S.ct.remainingYears>1 && LV[S.lv].top;
  if(longContract){
    choose('球団面談：成績が現レベルの基準に届かず、降格させる方針だという',[
      {t:acceptText,main:true,f:doDemote},
      {t:'長期契約の条項を盾に降格を拒否する',warn:true,s:'「チームの癌」が発動。翌年に結果を出せば返上、出せなければ悪評がさらに悪化',f:()=>{
        S.demotionRefused=true;
        if(!S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace){ S.traits.cancer=true;
          card('bad','隠し特性解放：チームの癌','契約条項を持ち出して降格を拒否。首脳陣は呆れ、仲間も陰でざわつく――居場所は守ったが、ロッカールームの信頼を失った。'); }
        else card('info','降格を拒否する','契約条項を盾に一軍残留を勝ち取った。球団はこの一件を忘れない。');
        board(1); reportFlowOutcome({kind:'DEMOTION_REFUSED'}); }},
      {t:'このまま現役を引退する',warn:true,s:'現役として名誉ある引退をする',f:()=>{buyoutRemaining();daibaFarewell(()=>reportFlowOutcome({kind:'DEMOTION_RETIRED',reason:'降格を受け入れず、'+S.year+' 年に引退を発表。'}));}}]);
  } else if(S.age>=33){
    choose('球団面談：成績が現レベルの最低基準にも届いていない',[
      {t:acceptText,f:doDemote},
      {t:'引退を選択する',warn:true,s:'現役として名誉ある引退をする',f:()=>{buyoutRemaining();daibaFarewell(()=>reportFlowOutcome({kind:'DEMOTION_RETIRED',reason:'下位リーグへの降格を拒み、'+S.year+' 年に引退を発表。'}));}}]);
  } else doDemote();
}
function retireBelowActiveMinimum(){
  card('bad','現役続行を断念','総合力が現役続行の最低基準を下回ったため、ユニフォームを脱ぐことを決断した。');
  reportFlowOutcome({kind:'ACTIVE_MINIMUM_RETIRED',reason:`総合力が現役続行の最低基準を下回り、${S.year}年に現役を引退した。`});
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
  if(onReject)opts.push({t:'契約延長を断り、現契約を継続',s:'延長せず、現在の契約を継続する',f:onReject});
  choose(baseTitle,opts);
}
/* 母球団延長契約更新：契約満了前に囲い込む。 */
function extensionOffer(o){
  const d=S.lastD||0;
  termChoice(o,d,`所属球団からの契約延長オファー・${S.teamName()}（契約残り1年）`,(y,m)=>{
    appendContractExtension(y,m);
    card('gold','契約延長',`<b class="hl">${S.teamName()}</b>と延長に合意し、契約を<b class="hl">${y}年</b>追加した（年俸係数×${m.toFixed(2)}）。`); board(1);
    crossOffers(o);
  }, ()=>{ /* 拒決して延長：維持原契約繼継続跑。 */
    card('info','延長を断る',`所属球団からの早期延長を断り、現在の契約を継続することにした。`);
    crossOffers(o);
  });
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
if(typeof document!=='undefined'&&document.getElementById('btn-restart')){
  document.getElementById('btn-restart').onclick=function(){
    if(confirm('人生のこの部分を放棄して、最初からやり直してもよろしいですか?'))location.href=location.pathname;
  };
}
function advance(){
  const state=S,fromYear=careerSession.currentChoiceContext?.state===S?careerSession.currentChoiceContext.year:S.year;
  let years=yearHandoffs.get(state);if(!years){years=new Map();yearHandoffs.set(state,years);}
  if([...years.values()].some(h=>h.status==='STARTED'&&h.targetYear===state.year))throw new Error('NEXT_YEAR_AMBIGUOUS');
  let handoff=years.get(fromYear);
  if(handoff){if(handoff.status==='COMMITTED')return;if(state.year!==fromYear)throw new Error('NEXT_YEAR_AMBIGUOUS');}
  else {if(state.year!==fromYear)throw new Error('STALE_YEAR_HANDOFF');handoff={fromYear,targetYear:fromYear+1,age:state.age+1,stageYr:state.stageYr+1,status:'PREPARED'};years.set(fromYear,handoff);}
  state.age=handoff.age;state.year=handoff.targetYear;state.stageYr=handoff.stageYr;handoff.status='STARTED';
  try{resetEventYear(state);startYear();handoff.status='COMMITTED';}
  catch(error){++careerSession.choiceGeneration;careerSession.activeChoiceToken=null;const act=$('act');act.querySelectorAll('button').forEach(b=>{b.disabled=true;});act.style.pointerEvents='none';throw new Error('NEXT_YEAR_AMBIGUOUS',{cause:error});}
}
/* キャリア終盤。 */
const TIER_TH={CPBL:[8500,6000,3100,1800],KBO:[8200,5900,3000,1800],NPB:[8000,5800,3000,1800],MLB:[8500,6500,3600,2000]};
const LG_N={CPBL:'台湾プロ野球',KBO:'KBO',NPB:'NPB',MLB:'メジャーリーグ',MINOR:'マイナーリーグ/二軍'};
function careerScore(st){return careerScoreFor(st,S.pos);}
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
function defShare(bucket){return defenseShareFor(S.stats[bucket],S.pos);}
function posLegendPhrase(bucket){ /* に応じて守備割合とタイトル決定守備位置敘述。 */
  const share=defShare(bucket), st=S.stats[bucket];
  const dp=S.dpos||(S.pos==='C'?'C':null);
  const hasGlove=hasHistoricalDefenseAward(S.honors);
  if(S.pos==='P'||!dp||dp==='DH')return '';
  const posN=DPN[dp]||'';
  if(share>=0.34||(hasGlove&&share>=0.22))return `、${{SS:'史上最高の遊撃手の一人',CF:'守備範囲でリーグを震撼させた中堅手',C:'捕手守備の化身',_:'守備のレジェンド'}[dp]||('球界屈指の'+posN)}として`;
  if(hasGlove&&share>=0.12)return `、攻撃的にも守備的にも優れた選手${posN}`;
  return '';
}
function honorScore(bucket){
  return honorScoreFor({bucket,honors:S.honors,position:S.pos,intlCount:S.intlCount||0,franchise:S.traits.franchise,awardState:S});
}
function tierOf(bucket){const st=S.stats[bucket];if(!st)return null;const hs=honorScore(bucket);return hallOfFameTier({baseScore:careerScore(st),honor:hs,thresholds:TIER_TH[bucket],leagueName:LG_N[bucket]});}
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
  const alreadyLegend=Boolean(S.traits.legend);
  /* tiers： {CPBL：{i、sc}、NPB：...、MLB：...} 出試合実績がある場合だけ作成。 */
  /* 代表リーグは在籍年数が最長のトップリーグ、評価階級はキャリア最高値（i最小）。 */
  let lg=LV[S.lv]?.statBucket||'MINOR', bestI=4;
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
  const hofs=[]; let firstBallot=false; const hofLeagues=[]; const firstBallotLeagues=[];
  const HOF_CFG={CPBL:{n:'台湾プロ野球殿堂',wait:5,total:132,lg:'台湾プロ野球'},KBO:{n:'韓国野球殿堂',wait:5,total:250,lg:'KBO'},NPB:{n:'日本野球殿堂',wait:5,total:326,lg:'NPB'},MLB:{n:'アメリカ野球殿堂',wait:5,total:389,lg:'メジャーリーグ'}};
  ['CPBL','KBO','NPB','MLB'].forEach(b=>{ const t=tiers[b]; if(!t)return;
    const cfg=HOF_CFG[b];
    if(t.i===0){
      /* 初回投票選出基準：評価点が基準を明確に上回る(1.15×名人堂基準)場合のみ first-ballot、それ以外は需等 N 年。 */
      const th=TIER_TH[b][0];
      const fbMult={CPBL:1.15,KBO:1.15,NPB:1.12,MLB:1.2}[b]||1.2;
      const firstNow = t.sc>=th*fbMult;
      const ballotYr = firstNow?1:ri(2,6);
      if(firstNow){ firstBallot=true; firstBallotLeagues.push(cfg.lg); }
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
    S.legendLeague=firstBallotLeagues[0]; }
  if(hofs.length)card('gold','殿堂入り投票',hofs.join('<br><br>'));
  if(S.traits.legend){ card('gold',(alreadyLegend?'':'隠し特性解放：')+(S.legendLeague||'')+'歴史に残る名選手',
    alreadyLegend?'':`初回投票で殿堂入り――ただ名を連ねただけではない。あなたは<b class="hl">一つの時代を築いた</b>。その名は${S.legendLeague||'野球界'}の歴史に刻まれる。`); }
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
    if(!S.traits.smallschool && smallSchoolEligibility(S.birthHighSchool,JP_DATA.highSchools,VERSION)==='ELIGIBLE'){ S.traits.smallschool=true;
      card('gold','隠し特性解放：弱小校の星',`無名の弱小校から、ついに最高峰の舞台へ。出身校が選手の限界を決めるわけじゃない――自らのキャリアで証明した。`); }
    /* 努力仔：初始能力上限合計偏低(投手≤237/野手≤469)。 */
    const grindTh = S.pos==='P'?237:469;
    if(!S.traits.grinder && (S.potSum0||999)<=grindTh){ S.traits.grinder=true;
      card('gold','隠し特性解放：頑張り屋',`平凡な素質の選手は数え切れない。そこから頂点まで勝ち上がれるのは、ほんの一握りだ。選ばれた天才ではない。流した汗を才能へ変えた男だ。`); }
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
  const TN=traitNames();
  const posT={pos:['favorite','adking','legend','taiwan','goldcloth','mrteam','confidante','genius','late','disc','academy','intlace','franchise','clutch','phoenix','rubber','onetool','smallschool','grinder','combo','rainbow','oldghost','miraclegen','strongpitch','stronghit','championmaker','pitcherTC','hitterTC','nitenichi','iron'],neg:['glass','scum','yips','distract','cancer','ambience','thief','latepractice']};
  const tagStyle=k=>{
    if(k==='legend'||k==='taiwan')return 'background:#fff7dc;border-color:#c79520;color:#795b00'; /* 歴史的選手/台湾代表への貢献：金。 */
    if(k==='goldcloth')return 'background:#fffbe0;border-color:#c5a800;color:#6f6000'; /* 黄金のユニフォーム：黄。 */
    if(k==='mrteam'){ const tc=TEAM_COLOR[S.mrTeamName]||'#a71930'; return 'background:#ffffff;border-color:'+tc+';color:'+tc; }
    if(k==='genius')return 'background:#f3f5f8;border-color:#9aa5b5;color:#4c5868';        /* 天才：銀。 */
    return ''; /* 好影響：既定色はアンバー。 */
  };
  posT.pos.forEach(k=>{ if(S.traits[k])tr.push(`<span class="tag" style="${tagStyle(k)}">${TN[k]}</span>`); });
  posT.neg.forEach(k=>{ if(S.traits[k])tr.push(`<span class="tag" style="background:#fff0f0;border-color:#c0392b;color:#a71930">${TN[k]}</span>`); });
  (S.removed||[]).forEach(lbl=>tr.push(`<span class="tag" style="text-decoration:line-through;opacity:.4;color:#8a8a8a;border-color:#4a4a4a">${removedTraitLabel(lbl,S,teamNick)}</span>`));
  const lv=S.love;
  const exes=Array.isArray(lv.exes)?lv.exes:[];
  const cur=lv.st==='married'?`妻 ${lv.partner}（子ども${lv.kids}人）`:lv.st==='dating'?`交際中 ${lv.partner}（${lv.dyrs||0}年）`:lv.st==='divorced'?'離婚':'独身';
  const exStr=exes.length?`｜前妻 ${exes.map(e=>`${e?.name||''}（${Number(e?.kids)||0}）`).join('、')}`:'';
  const totKids=(Number(lv.kids)||0)+exes.reduce((t,e)=>t+(Number(e?.kids)||0),0);
  card('','キャリアプロフィール',`特性：${tr.join(' ')||'（なし）'}<br>家族：${cur}${exStr}｜子ども合計 ${totKids} 人${lv.affairs?`｜不倫 ${lv.affairs}(${lv.caught})`:''}<br>日本代表出場：${S.intlCount}大会｜キャリア通算の大故障：${S.bigInj}回${S.pos==='P'?`｜トミー・ジョン手術：${S.tjCount}回`:''}<dl class="income-summary">${incomeSummary(S).map(row=>`<dt>${row.label}</dt><dd${row.key==='total'?' class="hl"':''}>${fmtMoney(row.amount)}</dd>`).join('')}</dl>`);
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
  if(S.traits.goldcloth)picks.push('阪神ストライプス愛してる。ずっとついていくで');
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
      <button class="btn" id="sh-url" style="flex:1">🔗 リプレイURLを共有</button>
    </div><div id="sh-url-status" role="status" aria-live="polite"></div><div id="sh-out" style="margin-top:8px"></div>`;
  $('log').appendChild(sh);
  const imgBtn=sh.querySelector('#sh-img'),urlBtn=sh.querySelector('#sh-url'),shareOut=sh.querySelector('#sh-out');
  imgBtn.type=urlBtn.type='button';
  imgBtn.addEventListener('click',()=>{
    archiveTraitResults();
    imgBtn.disabled=true; imgBtn.textContent='⏳ キャリア画像を作成中…';
    requestAnimationFrame(()=>{try{shareImage(evals,shareOut);imgBtn.textContent='✅ キャリア画像を作成しました';}
      catch(err){console.error(err);shareOut.innerHTML='<div class="statline" role="alert">画像を作成できませんでした。「もう一度作成する」から再試行してください。</div>';imgBtn.textContent='⚠️ もう一度作成する';}
      finally{imgBtn.disabled=false;}
    });
  });
  urlBtn.addEventListener('click',async()=>{
    if(urlBtn.disabled)return;
    archiveTraitResults();
    const url=replayURL(S.seed||SEED,location.href);
    const status=sh.querySelector('#sh-url-status');status.replaceChildren();urlBtn.disabled=true;
    try{
      const result=await shareReplayURL(url);status.textContent=result.message;
      if(result.manual){const input=document.createElement('input');input.value=url;input.readOnly=true;input.setAttribute('aria-label','リプレイURL');input.style.cssText='width:100%;margin-top:6px;padding:8px;color:var(--chalk);background:var(--panel);border:1px solid var(--edge);border-radius:6px';status.appendChild(input);input.focus();input.select();}
    }finally{urlBtn.disabled=false;}
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
const shareImageView=new ShareImage({getState:()=>S,getSeed:()=>SEED,LG_N,TEAM_COLOR,teamNick,roleN,playerType,primaryPos,traitNames,fmtIP,slgOf,fmtMoney});
function shareImage(evals,out){shareImageView.render(evals,out);}
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

/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */
  const DATA = JP_DATA;
  const LEGACY = { board, movement, phasePre, phaseMid, proSeason, endGame };

  Object.assign(ABL,{sta:'スタミナ',vel:'球速',ctl:'制球',brk:'変化球',con:'ミート',pow:'パワー',spd:'走力',eye:'選球眼',rng:'守備範囲',fld:'捕球',arm:'肩力',cat:'リード'});
  Object.assign(POSN,{P:'投手',C:'捕手',IF:'内野手',OF:'外野手'});
  Object.assign(DPN,{SS:'遊撃手','2B':'二塁手','3B':'三塁手','1B':'一塁手',CF:'中堅手',RF:'右翼手',LF:'左翼手',DH:'指名打者',C:'捕手'});
  Object.assign(LV,{
    HS:{n:'高校野球',par:38,min:0,g:20,org:'AMATEUR'}, U:{n:'大学野球',par:44,min:0,g:24,org:'AMATEUR'},
    CORP:{n:'社会人野球',par:37,min:32,g:45,org:'CORP',statBucket:'CORP'}, IND:{n:'独立リーグ',par:35,min:30,g:70,org:'IND',top:'IND',statBucket:'IND'},
    NPB_DEV:{n:'NPB育成',par:35,min:30,g:100,org:'NPB',statBucket:'NPB'}, NPB2:{n:'NPB二軍',par:52,min:47,g:100,org:'NPB',statBucket:'NPB'}, NPB1:{n:'NPB一軍',par:58,min:53,g:143,org:'NPB',top:'NPB',statBucket:'NPB'},
    KBO2:{n:'KBOフューチャース',par:39,min:35,g:90,org:'KBO',statBucket:'KBO'}, KBO1:{n:'KBO一軍',par:50,min:47,g:144,org:'KBO',top:'KBO',statBucket:'KBO'},
    CPBL2:{n:'台湾プロ野球二軍',par:39,min:35,g:80,org:'CPBL',statBucket:'CPBL'}, CPBL1:{n:'台湾プロ野球一軍',par:48,min:45,g:120,org:'CPBL',top:'CPBL',statBucket:'CPBL'},
    R:{n:'ルーキーリーグ',par:43,min:39,g:55,org:'MiLB',statBucket:'MINOR'}, A1:{n:'1A',par:47,min:43,g:110,org:'MiLB',statBucket:'MINOR'}, A2:{n:'2A',par:51,min:47,g:120,org:'MiLB',statBucket:'MINOR'}, A3:{n:'3A',par:56,min:52,g:130,org:'MiLB',statBucket:'MINOR'}, MLB:{n:'メジャーリーグ',par:63,min:58,g:162,org:'MLB',top:'MLB',statBucket:'MLB'}
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

  careerRng = new Rng(() => S, fnv1a32);
  seedInit = function(seed){ careerRng.seed(seed); _s=S.rngState|0; };
  R = function(){ const v=careerRng.next(); _s=S.rngState|0; return v; };

  function teamListOf(org){return listByOrg(org).map(t=>t.teamId);}
  function teamChampRate(id){ const t=teamRec(id);if(!t)return 5;const base={S:14,A:9,B:5}[t.strength]||7;return clamp(base+(fnv1a32(id+':'+S.year)%7)-3,2,24); }
  function salaryFor(lv,d){
    const m={CORP:[4200000,0,0,4200000,9000000],IND:[2400000,100000,0,1800000,5000000],NPB_DEV:[3000000,0,0,3000000,5000000],NPB2:[5000000,300000,0,5000000,16000000],NPB1:[16000000,4000000,3000000,16000000,600000000],KBO2:[8000000,400000,0,8000000,30000000],KBO1:[40000000,8000000,2000000,40000000,1500000000],CPBL2:[4000000,200000,0,4000000,12000000],CPBL1:[12000000,3000000,800000,12000000,400000000],R:[3000000,0,0,3000000,3000000],A1:[4000000,0,0,4000000,4000000],A2:[6000000,0,0,6000000,6000000],A3:[10000000,500000,0,10000000,30000000],MLB:[120000000,30000000,12000000,120000000,6000000000]}[lv];
    if(!m)throw new Error('UNKNOWN_SALARY_LEVEL:'+lv);if(lv==='CORP')return Math.round(clamp(4200000+(ovr()-40)*150000,4200000,9000000)/10000)*10000;
    return roundToTenThousandYen(calculateSalaryCurve(d,{base:m[0],linear:m[1],quadratic:m[2],min:m[3],max:m[4]}));
  }

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
  const previousSalaryForOffer=()=>S.currentSalary||S.transferSalarySnapshot?.annualSalary||S.ct?.annualSchedule?.at(-1)?.amount||S.lastSalaryDecision?.finalSalary||0;
  const hadAmericanContract=()=>Boolean(S.americanContractSigned||S.stats?.MLB?.yr||S.stats?.MINOR?.yr);
  const kboPreviousPackage=()=>{const c=S.ct||S.transferSalarySnapshot?.contract;return c?.org==='KBO'?(c.annualSchedule?.at(-1)?.amount||c.annualSalary||0)+(c.incentive?.annualMax||0)+(c.signingBonus||0)+(c.postingFee||0):S.org==='KBO'?(S.lastKboPackage||roundToTenThousandYen((S.currentSalary||0)*1.07)):0;};
  salaryCandidate=({sourceLevel=S.lv,targetLevel=S.lv,rating=currentMarketRating(),contractMult=1,positionMult=dpMult(),marketSalary,transferType='TRANSFER',previousSalary=previousSalaryForOffer()}={})=>{
    const sourceOrg=effectiveMarketOrg(sourceLevel,LV[sourceLevel]?.org||S.org),targetOrg=effectiveMarketOrg(targetLevel,LV[targetLevel]?.org),cross=sourceOrg!==targetOrg&&!(['MLB','MiLB'].includes(sourceOrg)&&['MLB','MiLB'].includes(targetOrg)),proSource=['NPB','KBO','CPBL','MLB','MiLB'].includes(sourceOrg);
    const policy=getCrossLeaguePolicy({sourceOrg,targetOrg,sourceLevel,targetLevel,age:S.age,serviceYears:foreignProSeasons(S),hasAmericanExperience:hadAmericanContract(),tier:marketTier({overall:ovr(),marketRating:rating,history:S.salaryEvaluationHistory||[]}),transferType,mlbServiceYears:serviceYearsFor('MLB')});
    targetLevel=policy.restrictedTargetLevel;
    const convertedRating=convertRatingBetweenLevels(rating,sourceLevel,targetLevel,LV),baseSalary=salaryFor(targetLevel,convertedRating);
    const injury=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[]));
    const raw=marketSalary??baseSalary*(cross?1:contractMult)*positionMult*(cross?injury:1);
    let detail=cross&&proSource?applyCrossLeagueSalary({marketSalary:raw,previousSalary,levelMinimum:salaryFor(targetLevel,0),policy}):null;
    if(policy.eligibilityType==='MLB_INTL_RESTRICTED'&&targetLevel==='R')detail={...detail,annualSalary:3_000_000,eligibilityType:policy.eligibilityType,reasonCodes:['MLB_INTL_RESTRICTED'],hardAnnualCap:3_000_000};
    let annualSalary=detail?.annualSalary??roundToTenThousandYen(raw);
    if(targetOrg==='KBO'){const cap=applyKboForeignPackageCap({annualSalary,isRenewal:sourceOrg==='KBO',previousPackage:kboPreviousPackage(),levelMinimum:salaryFor(targetLevel,0)});annualSalary=cap.annualSalary;detail={...detail,...cap,finalAnnualSalary:annualSalary,reasonCodes:[...(detail?.reasonCodes||[]),...(cap.capApplied?['LEAGUE_REGULATORY_CAP']:[])]};}
    const signingTerms=!hadAmericanContract()&&['MLB','MiLB'].includes(targetOrg)&&(policy.eligibilityType==='MLB_INTL_RESTRICTED'||!proSource)?createSigningBonusTerms({route:'INTERNATIONAL_AMATEUR',overall:ovr()}):createSigningBonusTerms();
    return{sourceLevel,targetLevel,sourceOrg,targetOrg:effectiveMarketOrg(targetLevel,targetOrg),sourceRating:rating,convertedRating,baseSalary,contractMult:cross?1:contractMult,positionMult,annualSalary,previousSalary,crossLeague:detail,signingTerms,transferType,sourceTeamId:S.orgTeamId,postingEligible:sourceOrg==='NPB'&&['MLB','MiLB'].includes(targetOrg)&&serviceYearsFor('NPB')<9&&S.faType!=='OVERSEAS'&&transferType!=='RELEASE_RECONTRACT'};
  };
  function saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,{decreaseProtectionApplied=false,floorApplied=false,salaryYear=S.year+1}={}){
    const market=currentMarketResult(),history=S.salaryEvaluationHistory||[];
    const marketComponents=market.components.map(item=>({...item,weight:item.normalizedWeight,source:history.find(entry=>entry.year===item.year)?.source||null}));
    const baseDecision=buildSalaryDecision({decisionYear:S.year,salaryYear,decisionType,sourceLevel:candidate.sourceLevel,targetLevel:candidate.targetLevel,previousSalary,finalSalary,sourceMarketRating:candidate.sourceRating,convertedMarketRating:candidate.convertedRating,baseSalary:candidate.baseSalary,contractMultiplier:candidate.contractMult,positionMultiplier:candidate.positionMult,floorApplied,decreaseProtectionApplied,marketComponents,currentEvaluation:S.lastSalaryEvaluation}),marketInjury=S.marketInjury||'HEALTHY';
    const decision=Object.freeze({...baseDecision,crossLeague:candidate.crossLeague?{...candidate.crossLeague,...(S.ct?.offerBreakdown?.packageCap?{packageCap:S.ct.offerBreakdown.packageCap,finalAnnualSalary:finalSalary}:{}),annualSalary:finalSalary}:S.ct?.offerBreakdown?.crossLeague??null,reasonCodes:[...new Set([...baseDecision.reasonCodes,...(candidate.crossLeague?.reasonCodes||[]),...(S.ct?.offerBreakdown?.capApplied?['LEAGUE_REGULATORY_CAP']:[])])],decreaseProtectionRate:S.org==='NPB'&&previousSalary>100_000_000?.60:.75,org:S.org,contractStage:contractStageFor(S.org),marketInjury,injuryMultiplier:injurySalaryMultiplier(marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),serviceYears:serviceYearsFor(S.org),arbitration:S.lastArbitration?.year===S.year?S.lastArbitration:null});
    S.lastSalaryDecision=decision;S.salaryDecisionHistory=appendSalaryDecision(S.salaryDecisionHistory||[],decision);return decision;
  }
  const salaryDecisionLink=()=>'<button type="button" class="salary-detail-link">内訳を見る</button>';
  const salaryDecisionSummary=()=>{const d=S.lastSalaryDecision;if(!d)return'';const change=d.changeRate===null?'新規契約':`${d.changeAmount>=0?'+':'−'}${fmtMoney(Math.abs(d.changeAmount))}／${d.changeRate>=0?'+':'−'}${Math.abs(d.changeRate*100).toFixed(1)}%`;return`<br><small>前年比 ${change}</small><br><small>主な理由：${d.reasonCodes.slice(0,3).map(salaryReasonLabel).join('、')}</small>`;};
  function bindLatestSalaryDetailLink(){const links=document.querySelectorAll('.salary-detail-link'),link=links[links.length-1];if(link)link.onclick=()=>salaryDetailController.open();}
  salaryDForContract=d=>(S.salaryEvaluationHistory||[]).length?currentMarketRating():Number(d)||0;
  function finalizePendingOffseasonSalary(){
    if(careerSession.pendingOffseasonSalary===null)return;
    migrateSalaryV130State();
    const baseCandidate=salaryCandidate({contractMult:careerSession.pendingOffseasonSalary.mult||1}),previousSalary=S.currentSalary,injuryMult=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[]));
    const adjustedMarket=roundToTenThousandYen(baseCandidate.annualSalary*injuryMult),control=calculateControlOffer({marketSalary:adjustedMarket,previousSalary,marketRating:currentMarketRating(),serviceYears:serviceYearsFor(S.org),org:S.org,levelMinimum:salaryFor(S.lv,0)});
    const annualSalary=roundToTenThousandYen(careerSession.pendingOffseasonSalary.contractType==='CONTROL'?control.protectedSalary:Math.max(adjustedMarket,careerSession.pendingOffseasonSalary.preventDecrease?previousSalary:0)),candidate={...baseCandidate,contractMult:baseCandidate.contractMult*injuryMult,annualSalary};
    S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:careerSession.pendingOffseasonSalary.years||1,annualSalary,contractType:careerSession.pendingOffseasonSalary.contractType||'NORMAL',candidate,startYear:S.year+1});S.currentSalary=S.ct.annualSalary;
    saveSalaryDecision('RENEWAL',candidate,previousSalary,S.currentSalary,{decreaseProtectionApplied:S.currentSalary>adjustedMarket,floorApplied:careerSession.pendingOffseasonSalary.contractType==='CONTROL'&&control.floorApplied});
    careerSession.pendingOffseasonSalary=null;
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
    careerSession.pendingOffseasonSalary=null;
    card('info','来季年俸決定',`${preventDecrease?'昇格後の最低保証を確認':'降格後も現契約を維持'}し、来季の年俸は<b class="hl">${fmtMoney(S.currentSalary)}</b>となった。${changed?salaryDecisionSummary()+' '+salaryDecisionLink():''}`);bindLatestSalaryDetailLink();
  }
  applyPromotionSalary=function(fromLv,toLv){applyLevelSalary(fromLv,toLv,true);};
  applyDemotionSalary=function(fromLv,toLv){const renewalRequired=contractNeedsRenewal(S.ct);applyLevelSalary(fromLv,toLv,false);if(renewalRequired)markClubInitiatedRenewal(1);};
  markClubInitiatedRenewal=function(years){
    careerSession.pendingOffseasonSalary={preventDecrease:true,years:1,mult:1,contractType:'CONTROL'};
  };
  appendContractExtension=function(years,mult){const candidate=salaryCandidate({contractMult:mult}),oldEnd=S.ct.endYear,oldGuaranteed=S.ct.guaranteedTotal,incentive=createIncentiveTerms({org:S.org,annualSalary:candidate.annualSalary});S.ct=appendExtension(S.ct,{signedYear:S.year,startYear:S.year+1,years,annualSalary:candidate.annualSalary,contractType:'EXTENSION',incentive});saveSalaryDecision('NEW_CONTRACT',candidate,S.currentSalary,candidate.annualSalary,{salaryYear:oldEnd+1});card('gold','延長契約の内訳',`現契約：${S.ct.startYear}～${oldEnd}年　年俸${fmtMoney(S.currentSalary)}<br>延長契約：${oldEnd+1}～${S.ct.endYear}年　年俸${fmtMoney(candidate.annualSalary)}<br>延長分総額：${fmtMoney(S.ct.guaranteedTotal-oldGuaranteed)}<br>合計保証年俸総額：${fmtMoney(S.ct.guaranteedTotal)} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();};
  function saveSalaryEvaluation(entry){
    entry.marketInjury=S.marketInjury||'HEALTHY';
    const tx=annualStateTransaction(S);
    prepareAwardReceipt(tx,'salary-evaluation',[{path:['salaryEvaluationHistory'],after:appendSalaryEvaluation(S.salaryEvaluationHistory||[],entry)},{path:['lastSalaryEvaluation'],after:entry}]);
    commitAwardReceipt(tx,'salary-evaluation');
  }
  recordSalaryEvaluation=function(st){
    const common={year:S.year,age:S.age,level:S.lv,org:S.org,role:S.role,position:S.dpos,playerType:S.pos,baseD:st.baseD,stats:st,gamesInLevel:LV[S.lv]?.g,baseline:MARKET_BASELINES[S.lv],honors:S.honors,awardState:S};
    if(hasActualPerformanceData(S.pos,st)){
      const stats=S.pos==='P'?st:{...st,SLG:slgOf(st)};
      saveSalaryEvaluation(buildSalaryEvaluationEntry({...common,stats}));
      return;
    }
    const payD=salaryEvaluationD(Number.isFinite(st.baseD)?st.baseD:(S.lastD||0),S.honors,S.year,S);
    saveSalaryEvaluation({schemaVersion:1,year:S.year,age:S.age,level:S.lv,org:S.org,role:S.role||null,position:S.dpos||null,baseD:payD,performanceAdjustment:0,workloadAdjustment:0,awardAdjustment:0,payD,sampleStatus:'INSUFFICIENT',reasons:['LEGACY_RATING_FALLBACK'],source:'LEGACY_RATING_FALLBACK',actualPerformanceAvailable:false,workloadAvailable:false,fallbackReason:'PERFORMANCE_DATA_NOT_AVAILABLE'});
  };
  recordIndependentSalaryEvaluation=function(results){
    /* 独立リーグでは正式な個人成績を生成していないため、大会結果を個人成績に見立てず既存評価だけを使う。 */
    const entry=buildIndependentLeagueFallbackEntry({year:S.year,age:S.age,level:S.lv,baseD:undefined,legacyRating:salaryEvaluationD(S.lastD||0,S.honors,S.year),tournamentResults:results});
    saveSalaryEvaluation(entry);
  };

  const advanceWithoutSalaryFinalization=advance;
  advance=function(){finalizePendingOffseasonSalary();advanceWithoutSalaryFinalization();};

  function reportFlowOutcome(outcome){
    switch(outcome.kind){
      case 'AMATEUR_STAY':
      case 'AMATEUR_ENTER_UNIVERSITY':
      case 'AMATEUR_JOIN_CORP':
      case 'AMATEUR_JOIN_IND':
      case 'AMATEUR_SIGNED_MILB':
      case 'AMATEUR_DRAFTED':return flowHooks.advance?flowHooks.advance(outcome):advance();
      case 'AMATEUR_RETIRED':return flowHooks.endGame?flowHooks.endGame(outcome):endGame(outcome.reason);
      case 'DEMOTION_TRANSFER_NPB1':
      case 'DEMOTION_TRANSFER_NPB2':
      case 'DEMOTION_TRANSFER_CPBL1':
      case 'DEMOTION_ACCEPTED':
      case 'DEMOTION_REFUSED':return flowHooks.advance?flowHooks.advance(outcome):advance();
      case 'DEMOTION_RETIRED':
      case 'ACTIVE_MINIMUM_RETIRED':return flowHooks.endGame?flowHooks.endGame(outcome):endGame(outcome.reason);
      case 'CROSS_OFFER_RESOLVED':
      case 'CONTRACT_RENEWED':
      case 'ARBITRATION_SETTLED':
      case 'FA_SIGNED':
      case 'FA_NO_BID_RETURNED':
      case 'RELEASE_SIGNED_PRO':
      case 'RELEASE_JOINED_AMATEUR':return flowHooks.advance?flowHooks.advance(outcome):advance();
      case 'FA_RETIRED':
      case 'RELEASE_RETIRED':return flowHooks.endGame?flowHooks.endGame(outcome):endGame(outcome.reason);
      case 'PRESEASON_RETURNED_NPB':
      case 'REHAB_YEAR_COMPLETED':return flowHooks.advance?flowHooks.advance(outcome):advance();
      case 'PRESEASON_AGE_LIMIT_RETIRED':
      case 'PRESEASON_RETIRED':return flowHooks.endGame?flowHooks.endGame(outcome):endGame(outcome.reason);
    }
    throw new Error('UNKNOWN_FLOW_OUTCOME:'+outcome.kind);
  }
  const flowHooks={advance:null,endGame:null};

  function newState(name,pos){
    const ab={};POS_AB[pos].forEach(k=>ab[k]=ri(20,32));if(pos==='P'){ab.vel+=ri(0,6);ab.brk+=ri(0,4);}else{ab.con+=ri(0,6);ab.pow+=ri(0,4);}
    const pot={},sh=POS_AB[pos].slice();for(let i=sh.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[sh[i],sh[j]]=[sh[j],sh[i]];}
    sh.forEach((k,i)=>pot[k]=pos==='P'?(i===0?ri(70,80):i===1?ri(58,68):i===2?ri(50,60):ri(44,54)):(i===0?ri(72,80):i===1?ri(64,74):i===2?ri(56,68):ri(46,62)));
    const tierRoll=Math.floor(R()*100),tier=highSchoolTier(tierRoll),schools=DATA.highSchools.filter(x=>x.tier===tier),school=pickRecord(schools.length?schools:DATA.highSchools);
    const state={name,pos,role:null,seed:SEED,version:VERSION,rngState:S.rngState,age:16,year:2026,stage:'HS',stageYr:1,lv:'HS',org:'AMATEUR',pot,ab,team:school.name,schoolId:school.schoolId,schoolTier:tier,senbatsuEligibleYear:null,entryRoute:'HS',orgTeamId:null,teamTally:{NPB:{},KBO:{},CPBL:{},MLB:{},IND:{},CORP:{}},
      traits:{genius:false,glass:false,iron:false,scum:false,late:false,disc:false,academy:false,intlace:false,franchise:false,clutch:false,phoenix:false,combo:false,onetool:false,rubber:false,legend:false,yips:false,distract:false,cancer:false,ambience:false,goldcloth:false,thief:false,mrteam:false,confidante:false,smallschool:false,grinder:false,rainbow:false,taiwan:false},removed:[],cntSave:0,cntSaveWin:0,cntSnack:0,cntBoldWin:0,cntBoldFail:0,samePick:0,samePickKey:null,teamYears:0,six:0,bigInj:0,ironStreak:0,npbYears:0,npbDevYears:0,corpYears:0,indYears:0,injNext:0,tmpInj:0,rehab:0,currentSalary:0,careerEarnings:0,careerBaseSalary:0,careerSigningBonus:0,careerDevelopmentStipend:0,signingPayments:{},foreignFirstTeamYears:{},americanContractSigned:false,careerIncentive:0,careerBuyout:0,corpIncome:0,yearlyIncentivePaid:{},lastFaMarket:null,lastSalaryPaidYear:null,salaryEvaluationHistory:[],lastSalaryEvaluation:null,lastSalaryDecision:null,salaryDecisionHistory:[],contractSequence:0,serviceTime:{NPB:0,MLB:0,KBO:0,CPBL:0},serviceTimeAccruedYear:null,marketInjury:'HEALTHY',lastArbitration:null,_salaryV130Migrated:true,_salaryV140Migrated:true,pool:0,seasonFactor:1,stats:{NPB:null,KBO:null,CPBL:null,MLB:null,MINOR:null,IND:null,CORP:null},statsByLevel:{NPB1:null,NPB2:null,NPB_DEV:null,KBO1:null,KBO2:null,CPBL1:null,CPBL2:null,MLB:null,A3:null,A2:null,A1:null,R:null,IND:null,CORP:null},honors:[],intlCount:0,intlCompletedKeys:{},intlLastEventKey:null,intlDispatchStatus:null,intlDeclinedCount:0,intlStat:{G:0,PA:0,AB:0,H:0,HR:0,RBI:0,IP:0,SO:0,ER:0,W:0,SV:0},intlBest:null,dpos:null,dposYears:{},roleYears:{},tradeRefuse:0,champThisTeam:false,svc:0,svcOrg:null,faElig:false,npbRosterDays:0,npbFaSeasons:0,faType:null,faUsed:false,faMarketKey:null,tradeHeat:0,complainCount:0,demotionRefused:false,tj:0,tjCount:0,effort:'普通投',tjSuccess:0,love:{st:'single',partner:null,kids:0,caught:0,affairs:0,exes:[],dyrs:0,datedTimes:0},log:[],ct:null,draftRights:null,domesticTournamentLog:[],domesticTournamentStats:{},domesticCompletedKeys:{},done:false};
    Object.defineProperty(state,'salary',{get(){return this.careerEarnings;},set(v){this.careerEarnings=v;},enumerable:false});
    Object.defineProperty(state,'orgTeam',{get(){return this.orgTeamId;},set(v){this.orgTeamId=teamRec(v)?v:(DATA.teams.find(t=>t.name===v)?.teamId||v);},enumerable:false});
    state.teamName=function(){return teamDisplay(this.orgTeamId,this.lv);};
    for(const key of Object.keys(TRAIT_LABELS))state.traits[key]??=false;
    Object.assign(state,{oldGhostPending:false,oldGhostUsed:false,firstTeamSeasons:{},firstTeamYearsByTeam:{},tripleCrownHistory:{}});
    Object.assign(state,{championshipResults:{},seasonChampContext:null,seasonEndMaintenanceYear:null,championshipMigrationVersion:1,intlFinalCount:0,intlTraitResults:{},internationalTraitMigrationVersion:1});
    traitPresentation.set(state,new Set(Object.keys(state.traits).filter(key=>state.traits[key])));
    installBirthHighSchool(state,school,VERSION);
    ensureEventState(state);state.potSum0=Object.values(pot).reduce((sum,value)=>sum+value,0);return state;
  }

  const nextContractId=(org,teamId,signedYear)=>{S.contractSequence=(Number(S.contractSequence)||0)+1;return`${org}:${teamId}:${signedYear}:${String(S.contractSequence).padStart(3,'0')}`;};
  function fixedContract({org,teamId,years,annualSalary,contractType='NORMAL',signingBonus=0,signingBonusType='NONE',developmentStipend=0,postingFee=0,postingFeeRecipient=null,candidate,startYear=S.year+1,incentive,offerBreakdown,transaction}){let breakdown=offerBreakdown??candidate?.crossLeague??null;if(org==='KBO'){const cap=applyKboForeignPackageCap({annualSalary,signingBonus,postingFee,isRenewal:candidate?.sourceOrg==='KBO'||S.ct?.org==='KBO',previousPackage:kboPreviousPackage(),levelMinimum:salaryFor(candidate?.targetLevel||S.lv,0)});annualSalary=cap.annualSalary;breakdown={...breakdown,...cap,finalAnnualSalary:annualSalary};if(incentive)incentive=createIncentiveTerms({org,annualSalary});}const sequence=(Number(S.contractSequence)||0)+1,contractId=`${org}:${teamId}:${S.year}:${String(sequence).padStart(3,'0')}`;const contract=createContract({contractId,org,teamId,signedYear:S.year,startYear,years,annualSalary,contractType,signingBonus,signingBonusType,developmentStipend,postingFee,postingFeeRecipient,signedMarketRating:candidate?.convertedRating??currentMarketRating(),positionMultiplierAtSigning:candidate?.positionMult??dpMult(),contractMultiplier:candidate?.contractMult??1,incentive:incentive===undefined?createIncentiveTerms({org,annualSalary}):incentive,offerBreakdown:breakdown});S.contractSequence=sequence;if(org==='KBO')S.lastKboPackage=annualSalary+(contract.incentive?.annualMax||0)+signingBonus+postingFee;if(transaction)transaction.contract=contract;return contract;}

  let signingRenderRetry=null;
  // Prepare before affiliation commit; a failed display retries only that completed transaction.
  function signTo(org,lv,teamId,yrs,mult,decisionType,options={}){ if(signingRenderRetry?.state===S&&signingRenderRetry.year===S.year&&signingRenderRetry.action===careerSession.currentChoiceAction&&signingRenderRetry.contractId===S.ct?.contractId&&(careerSession.currentChoiceAction!==null||signingRenderRetry.request===JSON.stringify([org,lv,teamId,yrs,mult,decisionType]))){signingRenderRetry.render();signingRenderRetry=null;return;}const request=JSON.stringify([org,lv,teamId,yrs,mult,decisionType]);const rec=teamId?teamRec(teamId):pickRecord(listByOrg(org));if(!rec)throw new Error('INVALID_TEAM_MASTER');const sourceLevel=S.lv,sourceStage=S.stage,sourceOrg=S.org,previousSalary=options.candidate?.previousSalary??previousSalaryForOffer(),changed=rec.teamId!==S.orgTeamId,contractYears=yrs||2,contractMult=mult||1;const candidate=options.candidate||salaryCandidate({sourceLevel:LV[sourceLevel]?sourceLevel:lv,targetLevel:lv,rating:sourceStage==='PRO'?currentMarketRating():0,contractMult,transferType:decisionType||'TRANSFER'});lv=candidate.targetLevel;const annualSalary=options.annualSalary??candidate.annualSalary,contractType=candidate.crossLeague?.eligibilityType==='MLB_INTL_RESTRICTED'?'ROOKIE':options.contractType||'NORMAL',startYear=options.startYear??S.year+1,terms=options.signingTerms||candidate.signingTerms,bonus=options.signingBonus??terms?.signingBonus??0,postingFee=calculatePostingFee({guaranteedTotal:annualSalary*contractYears,signingBonus:bonus,major:lv==='MLB',eligible:candidate.postingEligible});const transaction=options.transaction?.state===S&&options.transaction.year===S.year?options.transaction:null;const contract=transaction?.contract||fixedContract({org,teamId:rec.teamId,years:contractYears,annualSalary,contractType,signingBonus:bonus,signingBonusType:terms?.signingBonusType||'NONE',developmentStipend:terms?.developmentStipend||0,postingFee,postingFeeRecipient:postingFee>0?candidate.sourceTeamId:null,candidate,startYear,incentive:options.incentive,offerBreakdown:options.offerBreakdown,transaction});S.org=org;S.lv=lv;S.stage='PRO';S.stageYr=0;S.team='';S.orgTeamId=rec.teamId;if(changed){S.teamYears=0;S.champThisTeam=false;S.champTeam=null;}S.ct=contract;applySigningPayment(S,S.ct);if(['MLB','MiLB'].includes(candidate.targetOrg))S.americanContractSigned=true;S.currentSalary=S.ct.annualSalary;careerSession.pendingOffseasonSalary=null;const inferred=decisionType||(sourceStage!=='PRO'?'NEW_CONTRACT':sourceOrg==='NPB'&&org!=='NPB'?'OVERSEAS':sourceOrg!=='NPB'&&org==='NPB'?'RETURN':'NEW_CONTRACT');saveSalaryDecision(inferred,candidate,previousSalary,S.currentSalary);const render=()=>{card('info','契約',`<b class="hl">${escapeHTML(rec.name)}</b>と${S.ct.years}年契約を結んだ（年俸 ${fmtMoney(S.currentSalary)}）。${bonus>0?'契約金'+fmtMoney(bonus)+'。':''}${S.ct.developmentStipend>0?'育成支度金'+fmtMoney(S.ct.developmentStipend)+'。':''}${postingFee>0?'ポスティング譲渡金 '+fmtMoney(postingFee)+'（球団への支払い・生涯収入対象外）。':''}${salaryDecisionSummary()} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();board(2);};signingRenderRetry={state:S,year:S.year,action:careerSession.currentChoiceAction,contractId:S.ct.contractId,request,render};render();signingRenderRetry=null; }

  /* トレードは同一組織の固定球団ID間だけで行い、移籍先を必ず通知する。 */
  function doTradeExec(){
    const from=teamRec(S.orgTeamId),candidates=listByOrg(S.org).filter(t=>t.teamId!==S.orgTeamId);
    if(!from||!candidates.length){card('info','トレード見送り','移籍可能な球団がないため、トレードは成立しなかった。');return null;}
    const to=pickRecord(candidates);S.teamYears=0;S.champThisTeam=false;S.champTeam=null;S.orgTeamId=to.teamId;
    if(S.ct)S.ct=transferContract(S.ct,{org:S.org,teamId:to.teamId});
    S.lastTrade={year:S.year,fromTeamId:from.teamId,toTeamId:to.teamId};
    card('info','トレード成立',`<b class="hl">${escapeHTML(from.name)}</b>から<b class="hl">${escapeHTML(to.name)}</b>へ移籍した。`);board(1);
    return S.lastTrade;
  }

  function stageLabel(){if(S.stage==='HS')return '高校'+S.stageYr+'年';if(S.stage==='U')return '大学'+S.stageYr+'年';if(S.stage==='CORP')return '社会人'+(S.corpYears+1)+'年目';if(S.stage==='IND')return '独立リーグ'+(S.indYears+1)+'年目';return LV[S.lv]?.n||S.stage;}
  board = function(phase){LEGACY.board(phase);gameView.patchBoard({name:S.name,salaryText:Math.round((S.currentSalary||0)/10000).toLocaleString()});};

  function setSchool(kind){const a=kind==='U'?DATA.universities:DATA.highSchools,r=pickRecord(a);S.schoolId=r.schoolId;S.schoolTier=r.tier;S.team=r.name;S.lv=kind;S.org='AMATEUR';}
  function setAmateur(stage){S.stage=stage;S.stageYr=0;S.lv=stage;S.org=stage;S.orgTeamId=pickRecord(listByOrg(stage)).teamId;S.team=teamRec(S.orgTeamId).name;if(stage==='CORP')S.corpYears=0;else S.indYears=0;}
  function enterDraftPath(from){runDraft(false,result=>{if(result==='signed'){reportFlowOutcome({kind:'AMATEUR_DRAFTED'});return;}if(isDraftFallbackResult(result)){draftFallback(from);return;}throw new Error('UNKNOWN_DRAFT_RESULT:'+result);});}
  function draftFallback(from){const opts=[];if(from==='HS')opts.push({t:'大学へ進学',main:true,f:()=>{S.stage='U';S.stageYr=0;setSchool('U');reportFlowOutcome({kind:'AMATEUR_ENTER_UNIVERSITY'});}});opts.push({t:'社会人野球へ',f:()=>{setAmateur('CORP');reportFlowOutcome({kind:'AMATEUR_JOIN_CORP'});}},{t:'独立リーグへ',f:()=>{setAmateur('IND');reportFlowOutcome({kind:'AMATEUR_JOIN_IND'});}},{t:'野球をやめる',warn:true,f:()=>reportFlowOutcome({kind:'AMATEUR_RETIRED',reason:'ドラフト指名漏れを機に現役を退いた。'})});choose('指名漏れ、その後',opts);}

  function runDraft(fromSchool,cb){const o=ovr(),score=o+Math.max(0,22-S.age)*2+ri(-4,4);let rd=0,type='ROSTER';if(score>=60)rd=1;else if(score>=55)rd=2;else if(score>=50)rd=3;else if(score>=46)rd=4;else if(score>=42)rd=ri(5,6);else if(score>=37){rd=ri(1,3);type='DEVELOPMENT';}
    if(!rd){card('bad','NPBドラフト指名漏れ',`最後まで名前は呼ばれなかった（総合${o}）。`);cb('fail');return;}
    const rec=pickRecord(listByOrg('NPB')),bonus=type==='DEVELOPMENT'?(ri(200,500),0):ri(...NPB_BONUS_RANGES[rd-1])*10000,lv=type==='DEVELOPMENT'?'NPB_DEV':'NPB2';S.draftRights={teamId:rec.teamId,round:rd,type,deadline:S.year+'-03-31',status:'NEGOTIATING'};
    const accept=()=>{const terms=draftSigningTerms(type,rd),signingTerms=createSigningBonusTerms({route:'NPB_DRAFT',draftType:type,bonus}),result=acceptDraftSelection({state:S,type,round:rd,teamId:rec.teamId,bonus,sign:()=>signTo('NPB',lv,rec.teamId,1,1,'NEW_CONTRACT',{annualSalary:terms.rookieSalary,contractType:terms.contractType,signingBonus:bonus,signingTerms,startYear:S.year+1})});card('gold','NPBドラフト',`${escapeHTML(rec.name)}から${type==='DEVELOPMENT'?'育成':''}${rd}巡目指名。${type==='DEVELOPMENT'?'育成支度金'+fmtMoney(signingTerms.developmentStipend):'契約金'+fmtMoney(bonus)}。新人年俸${fmtMoney(terms.rookieSalary)}。 ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();cb(result);};
    choose(`NPBドラフト会議・${escapeHTML(rec.name)}が${type==='DEVELOPMENT'?'育成':''}${rd}巡目で指名`,[{t:'指名を受けて入団',main:true,f:accept},{t:'指名を拒否する',warn:true,s:'交渉権を放棄して別の進路へ',f:()=>cb(declineDraftSelection(S))}]);
  }

  function pathChoiceHS(){
    const o=ovr(),opts=[
      {t:'NPBドラフトへ',main:true,f:()=>enterDraftPath('HS')},
      {t:'大学へ進学',f:()=>{S.stage='U';S.stageYr=0;setSchool('U');reportFlowOutcome({kind:'AMATEUR_ENTER_UNIVERSITY'});}},
      {t:'社会人野球へ',f:()=>{setAmateur('CORP');reportFlowOutcome({kind:'AMATEUR_JOIN_CORP'});}},
      {t:'独立リーグへ',f:()=>{setAmateur('IND');reportFlowOutcome({kind:'AMATEUR_JOIN_IND'});}}
    ];
    if(o>=50){
      const lv=o>=54?'A1':'R';
      opts.push({t:'米国プロ組織と契約する',s:`MLB球団傘下の${LV[lv].n}から挑戦`,f:()=>{
        const pool=listByOrg('MiLB').slice(),offers=[];
        const count=ri(2,3);
        while(offers.length<count&&pool.length)offers.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
        choose('MiLB国際契約オファー',offers.map(rec=>({
          t:`${rec.name}（${LV[lv].n}）`,
          s:`高校卒業後、米国の育成組織からスタート｜年俸${fmtMoney(salaryFor(lv,0))}｜契約金${fmtMoney(createSigningBonusTerms({route:'INTERNATIONAL_AMATEUR',overall:o}).signingBonus)}`,
          f:()=>{signTo('MiLB',lv,rec.teamId,ri(3,4),1,'NEW_CONTRACT',{contractType:'ROOKIE'});reportFlowOutcome({kind:'AMATEUR_SIGNED_MILB'});}
        })));
      }});
    }
    choose(`高校卒業・総合能力${o}――人生最初の分岐点`,opts);
  }
  function pathChoiceU4(){choose(`大学卒業・総合能力${ovr()}`,[{t:'NPBドラフトへ',main:true,f:()=>enterDraftPath('U')},{t:'社会人野球へ',f:()=>{setAmateur('CORP');reportFlowOutcome({kind:'AMATEUR_JOIN_CORP'});}},{t:'独立リーグへ',f:()=>{setAmateur('IND');reportFlowOutcome({kind:'AMATEUR_JOIN_IND'});}},{t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'AMATEUR_RETIRED',reason:'大学卒業を機に現役を退いた。'})}]);}

  function cupOnce(key,name,klass,{pointMode='STANDARD'}={}){
    const doneKey=key+':'+S.year;if(S.domesticCompletedKeys[doneKey])return null;
    const bonus=schoolCompetitionBonus(S.stage,S.schoolTier),overall=ovr(),power=overall+beginEventSeason(S).form+bonus+ri(-8,8),national=klass.startsWith('NATIONAL');
    const result=tournamentResult({power,national,overall,pointMode});
    S.pool+=result.points;S.domesticCompletedKeys[doneKey]=true;
    S.domesticTournamentLog.push({year:S.year,key,result:result.result,deemedGames:result.deemedGames,points:result.points,amaD:result.amaD,injury:false});
    if(result.isChampion)S.honors.push(`${S.year} ${name}優勝`);
    if(S.stage==='HS'&&!S.traits.miraclegen&&highSchoolChampionCount(S)>=4)traitCard('miraclegen',displayTrait('miraclegen'),TRAIT_TEXT.miraclegen);
    return {...result,key,html:`${name}：<b class="hl">${result.result}</b>（能力点+${result.points}）`};
  }
  function qualifierOnce(key,name){
    const doneKey=key+':'+S.year;if(S.domesticCompletedKeys[doneKey])return null;
    const bonus=schoolCompetitionBonus(S.stage,S.schoolTier),result=qualificationResult(ovr()+beginEventSeason(S).form+bonus+ri(-8,8));
    S.domesticCompletedKeys[doneKey]=true;
    S.domesticTournamentLog.push({year:S.year,key,result:result.result,deemedGames:result.deemedGames,points:0,amaD:0,injury:false});
    return {...result,html:`${name}：<b class="hl">${result.result}</b>（能力点なし）`};
  }
  function amateurSeason(){beginEventSeason(S);if(S.seasonFactor===0){consumeEventSeason(S);card('bad','','今季はリハビリに専念した。');S.log.push({y:S.year,age:S.age,tm:S.team,line:'全休',inj:true});nextStep();return;}const results=[];
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
    consumeEventSeason(S);
    const rows=results.map(result=>result.html);S.log.push({y:S.year,age:S.age,tm:S.team,line:rows.map(x=>x.replace(/<[^>]+>/g,'')).join('、'),inj:false});card('','国内大会',rows.join('<br>'));maybeIntl(()=>nextStep());}

  function intlEvents(year){return internationalEvents(year,DATA.intlEvents);}
  function intlPhase(e){return internationalPhase(e);}
  function intlThreshold(e){return internationalThreshold(e);}
  function intlSelection(e){return internationalSelection(e,{level:S.lv,overall:ovr(),rehab:S.rehab,skipMid:S.skipMid,seasonFactor:S.seasonFactor});}
  function addIntlStats(){return seasonStats.addIntlStats();}
  function completeIntl(e,status,next){
    if(S.intlCompletedKeys[e.eventKey])return;
    if(status==='DECLINED')S.intlDeclinedCount++;
    S.intlCompletedKeys[e.eventKey]=true;S.intlLastEventKey=e.eventKey;S.intlDispatchStatus=null;next();
  }
  function processIntlPhase(phase,done){
    normalizeInternationalState(S);
    if(S.stage!=='PRO'){done();return;}
    const q=intlEvents(S.year).filter(e=>intlPhase(e)===phase&&!S.intlCompletedKeys[e.eventKey]);
    let i=0;
    const next=()=>{
      if(i>=q.length){done();return;}
      const e=q[i++],threshold=intlThreshold(e),selection=intlSelection(e);
      if(selection==='DENIED'){completeIntl(e,'DENIED',next);return;}
      if(selection==='INJURED'){
        card('info','日本代表招集見送り',`<b class="hl">${e.name}</b>の代表候補に入ったが、負傷またはリハビリ中のため招集は見送られた。`);
        completeIntl(e,'DENIED',next);return;
      }
      S.intlDispatchStatus='PENDING';
      const entryState=S;
      let prepared=null,continued=false,resultRendered=false,unlockRendered=false;
      choose(`日本代表招集・${e.name}`,[
        {t:'日本代表として出場',main:true,s:`代表基準：総合${threshold}以上`,f:()=>{
          if(S!==entryState||continued||(S.intlCompletedKeys[e.eventKey]&&!prepared))return;
          validateInternationalEntry(S);
          if(!prepared){
            const beforeStats={...S.intlStat},position=S.pos,role=S.role;
            const hadIntlace=Boolean(S.traits.intlace),rank=pick(['優勝','準優勝','ベスト4','ベスト8']),stats=addIntlStats();
            const personalStats=internationalPersonalStats(beforeStats,stats,position,role);
            prepared=prepareInternationalResult(S,e,{rank,stats,hadIntlace,personalStats});
          }
          const {result}=commitInternationalResult(S,prepared);
          if(!resultRendered){
            card(result.rank==='優勝'?'gold':'info',e.name,`日本代表は<b class="hl">${result.rank}</b>。能力点+${result.awardedPoints}。${result.injuryAdded?'大会の疲労により次回の故障率+10%。':'大会による故障リスク加算なし。'}`+renderInternationalPersonalStats(result.personalStats,fmtIP));
            resultRendered=true;
          }
          if(result.unlockedIntlace&&!unlockRendered){card('gold','隠し特性解放：'+displayTrait('intlace'),INTLACE_UNLOCK_TEXT);unlockRendered=true;}
          continued=true;next();
        }},
        {t:'コンディションを優先して辞退',warn:true,f:()=>{if(S!==entryState||continued)return;continued=true;completeIntl(e,'DECLINED',next);}}
      ]);
    };
    next();
  }
  function maybeIntl(done){processIntlPhase('POST',done);}
  function phaseIntlPre(){processIntlPhase('PRE',()=>nextStep());}
  function startYear(){careerSession.stepQ=[phasePre,phaseIntlPre,phaseMid,phaseEnd];divider(`${S.year}年・${S.age}歳・${stageLabel()}`);nextStep();}

  function daibaFarewell(cont){const npb=S.stats&&S.stats.NPB,playedNPB=!!(npb&&npb.yr>0);if(S.stage==='PRO'&&playedNPB&&['MLB','MiLB','KBO','CPBL'].includes(S.org)&&!S._daiba){S._daiba=true;card('gold','日本球界への別れ',`かつてプレーした日本プロ野球から招待を受け、古巣の本拠地で始球式を務めた。日本のファンへ感謝を伝え、キャリア最後の一球を投じた。`);}cont();}

  function overseasOffer(org,lv,label,o,minD,finish){
    const min={KBO:47,CPBL:45,MiLB:60}[org]||99;
    if(o<min||(S.lastD||0)<minD)return null;
    const rec=pickRecord(listByOrg(org)),candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:lv,contractMult:1});lv=candidate.targetLevel;const annual=candidate.annualSalary;
    return{t:`${label}：${rec.name}`,s:`${LV[lv].n}｜年俸${fmtMoney(annual)}${candidate.signingTerms.signingBonus>0?'｜契約金'+fmtMoney(candidate.signingTerms.signingBonus):''}`,f:()=>{buyoutRemaining();signTo(org,lv,rec.teamId,ri(1,3),1.3,'OVERSEAS',{contractType:'OVERSEAS_FA'});finish();}};
  }
  function crossOffers(o){
    const finish=()=>reportFlowOutcome({kind:'CROSS_OFFER_RESOLVED'}),opts=[];
    let offerType='transfer';
    if(S.org==='NPB'&&S.lv==='NPB1'){
      offerType=crossOfferType(S.org,'MiLB');
      const k=overseasOffer('KBO','KBO1','韓国プロ野球への海外移籍',o,1,finish);
      const c=overseasOffer('CPBL','CPBL1','台湾プロ野球への海外移籍',o,0,finish);
      const m=overseasOffer('MiLB','MLB','MLBへの海外移籍',o,2,finish);
      if(k)opts.push(k);if(c)opts.push(c);if(m)opts.push(m);
    }else if(['KBO','CPBL','MiLB','MLB'].includes(S.org)&&o>=47&&contractNeedsRenewal(S.ct)){
      // Keep the expired contract until selection; continuing/extended contracts never draw a team.
      if(careerSession.npbReturnOfferContext?.state===S&&careerSession.npbReturnOfferContext.year===S.year&&careerSession.npbReturnOfferContext.contract===S.ct){
        if(!careerSession.npbReturnOfferContext.completed)choose(careerSession.npbReturnOfferContext.title,careerSession.npbReturnOfferContext.options);
        return;
      }
      offerType=crossOfferType(S.org,'NPB');
      const context={state:S,year:S.year,contract:S.ct,completed:false,running:false,actionCompleted:false,years:null,transaction:{state:S,year:S.year,contract:null}};
      const complete=action=>{
        if(context.completed||context.running||context.state!==S||context.year!==S.year)return;
        context.running=true;
        try{if(!context.actionCompleted){action?.();context.actionCompleted=true;}finish();context.completed=true;}
        finally{context.running=false;if(S.year!==context.year)context.completed=true;}
      };
      const rec=pickRecord(listByOrg('NPB')),lv=o>=53?'NPB1':'NPB2',candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:lv,contractMult:1}),annualSalary=candidate.annualSalary;
      opts.push({t:`NPBへ復帰：${rec.name}`,s:`${LV[lv].n}契約｜年俸${fmtMoney(annualSalary)}`,f:()=>complete(()=>{context.years??=ri(1,3);signTo('NPB',lv,rec.teamId,context.years,1,'RETURN',{annualSalary,candidate,transaction:context.transaction});})});
      opts.push({t:'現在の球団に残留',main:true,f:()=>complete()});
      careerSession.npbReturnOfferContext=context;context.title=crossOfferTitle(offerType);context.options=opts;
      choose(context.title,opts);return;
    }
    if(!opts.length){finish();return;}
    opts.splice(4);opts.push({t:'現在の球団に残留',main:true,f:finish});choose(crossOfferTitle(offerType),opts);
  }

  function renewAndAdvance(mult=1,allowDecrease=false,contractType='NORMAL'){const base=salaryCandidate({contractMult:mult}),previousSalary=S.currentSalary,injuryMult=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),candidate={...base,contractMult:base.contractMult*injuryMult,annualSalary:roundToTenThousandYen(base.annualSalary*injuryMult)},control=calculateControlOffer({marketSalary:candidate.annualSalary,previousSalary,marketRating:currentMarketRating(),serviceYears:serviceYearsFor(S.org),org:S.org,levelMinimum:salaryFor(S.lv,0)}),annualSalary=roundToTenThousandYen(contractType==='CONTROL'?control.protectedSalary:Math.max(candidate.annualSalary,!allowDecrease?previousSalary:0));S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary,contractType,candidate,startYear:S.year+1});S.currentSalary=S.ct.annualSalary;careerSession.pendingOffseasonSalary=null;saveSalaryDecision('RENEWAL',candidate,previousSalary,S.currentSalary,{decreaseProtectionApplied:S.currentSalary>candidate.annualSalary,floorApplied:contractType==='CONTROL'&&control.floorApplied});card('info','契約更改',`年俸${fmtMoney(S.currentSalary)}で契約を更新した。${salaryDecisionSummary()} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();reportFlowOutcome({kind:'CONTRACT_RENEWED'});}
  function arbitrationFlow(){
    const base=salaryCandidate(),injuryMult=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),terms=calculateArbitrationTerms({marketSalary:roundToTenThousandYen(base.annualSalary*injuryMult),previousSalary:S.currentSalary,marketRating:currentMarketRating(),serviceYears:serviceYearsFor('MLB'),levelMinimum:salaryFor('MLB',0)});
    const complete=(result,finalSalary)=>{S.lastArbitration={year:S.year,result,clubSalary:roundToTenThousandYen(terms.clubSalary),playerSalary:roundToTenThousandYen(terms.playerSalary),finalSalary:roundToTenThousandYen(finalSalary),winChance:terms.winChance};const candidate={...base,contractMult:base.contractMult*injuryMult,annualSalary:S.lastArbitration.finalSalary},floorApplied=result==='SETTLED'?terms.middleFloorApplied:result==='WON'?terms.playerFloorApplied:terms.clubFloorApplied;S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary:S.lastArbitration.finalSalary,contractType:'ARBITRATION',candidate,startYear:S.year+1});S.currentSalary=S.ct.annualSalary;saveSalaryDecision('RENEWAL',candidate,terms.previousSalary,S.currentSalary,{decreaseProtectionApplied:S.currentSalary>terms.marketSalary,floorApplied});card('gold','MLB年俸調停',`球団提示：${fmtMoney(terms.clubSalary)}<br>選手側：${fmtMoney(terms.playerSalary)}<br>中間案：${fmtMoney(terms.middleSalary)}<br>勝訴確率：${Math.round(terms.winChance)}%<br>決定年俸：<b class="hl">${fmtMoney(S.currentSalary)}</b> ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();reportFlowOutcome({kind:'ARBITRATION_SETTLED'});};
    choose(`MLB年俸調停対象（在籍${serviceYearsFor('MLB')}年）`,[{t:`球団提示を受け入れる（${fmtMoney(terms.clubSalary)}）`,main:true,f:()=>complete('ACCEPTED',terms.clubSalary)},{t:`中間案で合意を試みる（${fmtMoney(terms.middleSalary)}）`,f:()=>complete('SETTLED',terms.middleSalary)},{t:`年俸調停を申請する（選手側 ${fmtMoney(terms.playerSalary)}／勝訴確率 ${Math.round(terms.winChance)}%）`,warn:true,f:()=>{const won=chance(terms.winChance);complete(won?'WON':'LOST',won?terms.playerSalary:terms.clubSalary);}}]);
  }
  function faFlow(o){
    migrateSalaryV130State();const stage=contractStageFor(S.org);
    if(stage==='CONTROL'){renewAndAdvance(1,false,'CONTROL');return;}
    if(stage==='ARBITRATION'){arbitrationFlow();return;}
    if(S.org!=='NPB'){S.faType='OVERSEAS';faMarket(o,S.lastD||0);return;}
    if(serviceYearsFor('NPB')<8){renewAndAdvance(1,false,'CONTROL');return;}
    const declareFA=type=>{S.faType=type;S.faUsed=true;S.npbFaSeasons=0;faMarket(o,S.lastD||0);};
    const opts=[{t:'権利を行使せず残留',main:true,f:()=>renewAndAdvance(1)},{t:'国内FAを宣言',warn:true,f:()=>declareFA('DOMESTIC')}];
    if(serviceYearsFor('NPB')>=9)opts.push({t:'海外FAを宣言',warn:true,f:()=>declareFA('OVERSEAS')});
    choose(`FA権取得・登録${serviceYearsFor('NPB')}シーズン`,opts);
  }
  const faOfferText=offer=>`契約：${offer.years}年｜年俸：${fmtMoney(offer.annualSalary)}${offer.priceCandidate?.signingTerms?.signingBonus>0?'｜契約金：'+fmtMoney(offer.priceCandidate.signingTerms.signingBonus):''}<br>保証年俸総額：${fmtMoney(offer.guaranteedTotal)}｜出来高：最大${fmtMoney(offer.incentiveAnnualMax)}／年<br>球団の需要度：${teamDemandLabel(offer.demandScore)}｜契約種別：${contractTypeLabel(offer.contractType)}<br><small>市場基準額 ${fmtMoney(offer.breakdown.marketSalary)}／故障補正 ×${offer.breakdown.injuryMultiplier.toFixed(2)}／守備位置係数 ×${offer.breakdown.positionMultiplier.toFixed(2)}／契約種別係数 ×${offer.breakdown.contractTypeMultiplier.toFixed(2)}／球団の需要度 ×${offer.breakdown.teamDemandMultiplier.toFixed(3)}／競合補正 ×${offer.breakdown.competitionMultiplier.toFixed(3)}／最終年俸 ${fmtMoney(offer.annualSalary)}</small>`;
  function priceFaOffer(offer){const candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:offer.level,marketSalary:offer.annualSalary,positionMult:1,transferType:'FA'});if(candidate.crossLeague){offer.annualSalary=candidate.annualSalary;offer.level=candidate.targetLevel;offer.guaranteedTotal=offer.annualSalary*offer.years;offer.breakdown={...offer.breakdown,crossLeague:candidate.crossLeague,finalAnnualSalary:offer.annualSalary};if(candidate.crossLeague.eligibilityType==='MLB_INTL_RESTRICTED'){offer.contractType='ROOKIE';offer.breakdown.marketSalary=candidate.baseSalary;}}offer.priceCandidate=candidate;}
  function acceptFaOffer(offer){S.lastFaMarket.acceptedOfferId=offer.offerId;const rec=teamRec(offer.teamId);signTo(offer.org,offer.level,offer.teamId,offer.years,1,'FA',{annualSalary:offer.annualSalary,contractType:offer.contractType,incentive:offer.incentive,offerBreakdown:offer.breakdown,candidate:offer.priceCandidate});card('gold','FA契約成立',`${escapeHTML(rec.name)}と${offer.years}年契約。保証年俸総額${fmtMoney(offer.guaranteedTotal)}、出来高は年最大${fmtMoney(offer.incentiveAnnualMax)}。`);reportFlowOutcome({kind:'FA_SIGNED'});}
  function showFaMarket(market){
    if(!market.offers.length){const rating=market.marketRating,injury=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),marketAnnual=salaryFor(S.lv,rating)*dpMult()*.9*injury,levelMinimum=salaryFor(S.lv,0),floorApplied=levelMinimum>marketAnnual,annual=S.org==='KBO'?applyKboForeignPackageCap({annualSalary:Math.max(marketAnnual,levelMinimum),isRenewal:true,previousPackage:kboPreviousPackage(),levelMinimum}).annualSalary:roundToTenThousandYen(Math.max(marketAnnual,levelMinimum)),incentive=createIncentiveTerms({org:S.org,annualSalary:annual});choose('FA市場・獲得オファーなし',[{t:`元球団と1年契約（年俸${fmtMoney(annual)}）`,main:true,s:'市場価×0.90。減俸保護は適用されない',f:()=>{const previousSalary=S.currentSalary,base=salaryCandidate(),candidate={...base,contractMult:.9*injury,annualSalary:annual};S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary:annual,contractType:'FA_RETURN',candidate,incentive});S.currentSalary=S.ct.annualSalary;market.acceptedOfferId='RETURN_NO_BID';saveSalaryDecision('RENEWAL',candidate,previousSalary,S.currentSalary,{floorApplied});reportFlowOutcome({kind:'FA_NO_BID_RETURNED'});}},{t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'FA_RETIRED',reason:'FA市場で獲得オファーがなく、現役を引退した。'})}]);return;}
    const choices=market.offers.map(offer=>({t:`${teamRec(offer.teamId).name}（${LV[offer.level].n}）`,s:faOfferText(offer),f:()=>acceptFaOffer(offer)}));
    if(market.stayOffer)choices.push({t:`宣言残留：${teamRec(market.stayOffer.teamId).name}`,main:true,s:faOfferText(market.stayOffer),f:()=>acceptFaOffer(market.stayOffer)});
    choose('FA市場オファー比較',choices);
  }
  function faMarket(o,d){
    migrateSalaryV140State();const key=`FA:${S.year}:${S.faType}`;
    if(S.lastFaMarket?.marketKey===key){showFaMarket(S.lastFaMarket);return;}
    S.faMarketKey=key;const rating=currentMarketRating(),baseCount=baseFaOfferCount(rating),context=buildMarketContext({marketSalary:0,marketInjury:S.marketInjury,history:S.salaryEvaluationHistory||[],normalMaxYears:4,baseOfferCount:Math.max(0,baseCount-(S.traits.cancer?1:0))}),offerCount=context.offerCount,category=playerMarketCategory({pos:S.pos,role:S.role,dpos:S.dpos});
    const routes=S.faType==='DOMESTIC'?[{org:'NPB',level:'NPB1'}]:[{org:'NPB',level:'NPB1'},...(o>=47&&d>=1?[{org:'KBO',level:'KBO1'}]:[]),...(o>=45&&d>=0?[{org:'CPBL',level:'CPBL1'}]:[]),...(o>=60&&d>=2?[{org:'MiLB',level:'MLB'}]:[])];
    const candidates=routes.flatMap(route=>listByOrg(route.org).filter(team=>team.teamId!==S.orgTeamId).map(team=>({team,...route}))),ranked=rankTeamsByDemand({teams:candidates.map(x=>x.team),seed:S.seed,year:S.year,category});
    const routeByTeam=new Map(candidates.map(x=>[x.team.teamId,x])),selected=ranked.slice(0,offerCount).map(x=>({...x,...routeByTeam.get(x.team.teamId)})).sort((a,b)=>a.team.teamId.localeCompare(b.team.teamId)),comp=competitionMultiplier(selected.length),offers=[],jitterByTeam=new Map(generateBidJitters(selected.map(x=>x.team.teamId),R).map(x=>[x.teamId,x.multiplier]));
    selected.forEach((entry,index)=>{const proof=context.preferProof,contractType=proof?'PROOF':index%2===0&&context.maxYears>=3?'LONG':'SHORT',years=proof?1:contractType==='LONG'?context.maxYears:Math.min(2,context.maxYears),converted=convertRatingBetweenLevels(rating,S.lv,entry.level,LV),marketSalary=salaryFor(entry.level,converted),breakdown={injuryMultiplier:context.injuryMultiplier,positionMultiplier:dpMult(),contractTypeMultiplier:contractTypeMultiplier(contractType),teamDemandMultiplier:teamDemandMultiplier(entry.demandScore),franchiseMultiplier:1,competitionMultiplier:comp,bidJitterMultiplier:jitterByTeam.get(entry.team.teamId)},incentive=createIncentiveTerms({org:entry.org,annualSalary:marketSalary});const offer=buildFaOffer({offerId:`${key}:${entry.team.teamId}`,teamId:entry.team.teamId,org:entry.org,level:entry.level,category,demandScore:entry.demandScore,years,contractType,marketSalary,levelMinimum:salaryFor(entry.level,0),breakdown,incentiveTerms:incentive});priceFaOffer(offer);offer.incentive=createIncentiveTerms({org:entry.org,annualSalary:offer.annualSalary});offer.incentiveAnnualMax=offer.incentive?.annualMax||0;offers.push(offer);});
    let stayOffer=null;if(offers.length&&S.orgTeamId){const demand=rankTeamsByDemand({teams:[teamRec(S.orgTeamId)],seed:S.seed,year:S.year,category})[0]?.demandScore||0,contractType=context.preferProof?'PROOF':'SHORT',years=context.preferProof?1:Math.min(2,context.maxYears),marketSalary=salaryFor(S.lv,rating),breakdown={injuryMultiplier:context.injuryMultiplier,positionMultiplier:dpMult(),contractTypeMultiplier:contractTypeMultiplier(contractType),teamDemandMultiplier:teamDemandMultiplier(demand),franchiseMultiplier:S.traits.franchise?1.04:1,competitionMultiplier:comp,bidJitterMultiplier:1},incentive=createIncentiveTerms({org:S.org,annualSalary:marketSalary});stayOffer=buildFaOffer({offerId:`${key}:STAY`,teamId:S.orgTeamId,org:S.org,level:S.lv,category,demandScore:demand,years,contractType:'RETURN',marketSalary,levelMinimum:salaryFor(S.lv,0),breakdown,incentiveTerms:incentive});priceFaOffer(stayOffer);stayOffer.incentive=createIncentiveTerms({org:S.org,annualSalary:stayOffer.annualSalary});stayOffer.incentiveAnnualMax=stayOffer.incentive?.annualMax||0;}
    S.lastFaMarket={marketKey:key,generatedYear:S.year,marketRating:rating,injuryStatus:S.marketInjury,offerCount:offers.length,offers,stayOffer,acceptedOfferId:null};showFaMarket(S.lastFaMarket);
  }
  function outOfOrg(o){
    if(isBelowActiveMinimum(o)){retireBelowActiveMinimum();return;}
    buyoutRemaining(1);
    const candidates=[];
    const pushPro=(org,lv,label)=>{const rec=pickRecord(listByOrg(org)),score=LV[lv].par,candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:lv,contractMult:1,transferType:'RELEASE_RECONTRACT'});lv=candidate.targetLevel;const annualSalary=candidate.annualSalary;candidates.push({score,t:`${label}・${rec.name}`,s:`${LV[lv].n}契約｜年俸${fmtMoney(annualSalary)}${candidate.signingTerms.signingBonus>0?'｜契約金'+fmtMoney(candidate.signingTerms.signingBonus):''}`,f:()=>{signTo(org,lv,rec.teamId,1,1,'RELEASE_RECONTRACT',{annualSalary,candidate});reportFlowOutcome({kind:'RELEASE_SIGNED_PRO'});}});};
    const pushAma=stage=>{const rec=pickRecord(listByOrg(stage));candidates.push({score:LV[stage].par,t:`${stage==='CORP'?'社会人野球':'独立リーグ'}・${rec.name}`,f:()=>{S.stage=stage;S.stageYr=0;S.lv=stage;S.org=stage;S.orgTeamId=rec.teamId;S.team=rec.name;if(stage==='CORP')S.corpYears=0;else S.indYears=0;reportFlowOutcome({kind:'RELEASE_JOINED_AMATEUR'});}});};
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
    if(!offers.length){reportFlowOutcome({kind:'RELEASE_RETIRED',reason:`戦力外通告後に獲得オファーがなく、${S.year}年に現役を引退した。`});return;}
    offers.push({t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'RELEASE_RETIRED',reason:'戦力外通告を受け、現役を引退した。'})});
    choose('戦力外・再起オファー（最大4球団）',offers);
  }

  const professionalEnds=new WeakMap(),professionalMoves=new WeakMap();
  resumeSeasonEnd=()=>{
    const entry=professionalEnds.get(S);
    if(entry?.year!==S.year)return false;
    settleProfessionalEnd();return true;
  };
  function settleProfessionalEnd(){
    board(2);migrateSalaryV140State();
    let entry=professionalEnds.get(S);
    if(entry?.year!==S.year){
      normalizeChampionshipState(S,teamRec);
      // An old paid year without a live receipt is read-only, not a retry candidate.
      if(S.lastSalaryPaidYear===S.year||S.ct?.annualSchedule?.some(row=>row.year===S.year&&row.paid===true))return;
      entry={state:S,year:S.year,phase:'CHAMPIONSHIP',tx:annualStateTransaction(S)};professionalEnds.set(S,entry);
    }
    if(entry.state!==S||entry.year!==S.year)throw new Error('STALE_SETTLEMENT');
    careerSession.seasonEndContext=entry;
    if(entry.phase==='CHAMPIONSHIP'){
      const {result,created}=settleChampionship(S,{teamById:teamRec,random:R});maintainSeasonEnd(S);
      entry.championship=result;entry.showChampionship=created&&result.won;entry.phase='CHAMPIONSHIP_RENDER';
    }
    if(entry.phase==='CHAMPIONSHIP_RENDER'){
      if(entry.showChampionship){const result=entry.championship,team=teamRec(result.teamId);renderCheckpointCard(entry,'championship',['gold',result.title+'達成',`${escapeHTML(team.name)}が<b class="hl">${result.title}</b>に輝いた。今季の優勝をキャリアの実績に追加した。`]);}
      entry.phase='PAYMENT_PREPARED';
    }
    if(entry.phase==='PAYMENT_PREPARED'){
      S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});
      if(!entry.payment){entry.payment=prepareSeasonPayment(S);prepareAwardReceipt(entry.tx,'season-payment',entry.payment.writes);}
      commitAwardReceipt(entry.tx,'season-payment');careerSession.pendingOffseasonSalary=null;entry.phase='PAYMENT_COMMITTED';
    }
    if(entry.phase==='PAYMENT_COMMITTED'){
      const {paid,incentive}=entry.payment,continuation=contractContinuationForNextYear(S.ct,S.year),continuationText=continuation?`<br><b>現契約を継続</b><br>来季年俸：<b class="hl">${fmtMoney(continuation.nextSalary)}</b><br>契約残り：${continuation.remainingYears}年<br>年俸の再計算はありません<br>今季の実績は次回の契約評価へ反映されます。`:'';
      if(!entry.resultHTML)entry.resultHTML=`今季支給年俸：<b class="hl">${fmtMoney(paid)}</b>｜出来高：<b class="hl">${fmtMoney(incentive.amount||0)}</b>（${incentive.level}）<br>スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}<br>今季受取総額：<b class="hl">${fmtMoney(paid+(incentive.amount||0)+(S.yearOutsideIncome||0))}</b>｜生涯収入：${fmtMoney(S.careerEarnings)}${continuationText}`;
      renderCheckpointCard(entry,'payment',['','シーズン終了',entry.resultHTML]);entry.phase='RESULT_RENDERED';
    }
    const go=()=>{if(entry.state!==S||entry.year!==S.year)return;entry.phase='MOVEMENT';movement();entry.phase='WAIT_CHOICE';};
    if(entry.phase==='RESULT_RENDERED'){
      entry.pool=S.pool;
      if(entry.pool>0){prepareAwardReceipt(entry.tx,'allocation-payload',[{path:['pool'],before:entry.pool,after:0}]);commitAwardReceipt(entry.tx,'allocation-payload');entry.phase='WAIT_ALLOCATION';}
      else go();
    }
    if(entry.phase==='WAIT_ALLOCATION'){
      const live=choiceViews.get(S);
      if(live?.year===S.year&&live.kind==='ALLOCATION'&&live.generation===careerSession.choiceGeneration)return;
      if(entry.allocationChoice&&restorePendingChoice(S,entry.allocationChoice)){entry.allocationChoice=choiceViews.get(S);return;}
      choose('',[{t:`能力点を分配（${entry.pool}点）`,main:true,f:()=>{entry.phase='ALLOCATION_STARTED';allocUI({pool:entry.pool},'シーズン成果の能力点',()=>{entry.phase='ALLOCATION_COMMITTED';go();});}}]);entry.allocationChoice=choiceViews.get(S);return;
    }
    if(entry.phase==='ALLOCATION_STARTED'){
      const live=choiceViews.get(S);if(live?.kind==='ALLOCATION'&&live.year===S.year&&live.generation===careerSession.choiceGeneration&&$('act').children.length)return;
      throw new Error('ALLOCATION_CONTINUATION_AMBIGUOUS');
    }
    if(entry.phase==='ALLOCATION_COMMITTED'||entry.phase==='MOVEMENT')go();
    else if(entry.phase==='WAIT_CHOICE')restorePendingChoice();
  }
  // Payment and successful completion are separate: a display failure must not repay.
  function phaseEnd(){
    if(S.stage!=='CORP')return settlePhaseEnd();
    const state=S,year=S.year;
    let entry=careerSession.corpSettlements.get(state);
    if(!entry||entry.year!==year){entry={year,paid:false,complete:false,running:false};careerSession.corpSettlements.set(state,entry);}
    if(entry.complete||entry.running)return;
    entry.running=true;
    try{settlePhaseEnd();entry.complete=true;}finally{entry.running=false;}
  }
  function settlePhaseEnd(){
    if(S.stage==='PRO')return settleProfessionalEnd();
    if(S.stage==='PRO'&&careerSession.seasonEndContext?.state===S&&careerSession.seasonEndContext.year===S.year)return;
    board(2);migrateSalaryV140State();
    normalizeChampionshipState(S,teamRec);
    if(S.stage==='PRO'){
      const {result,created}=settleChampionship(S,{teamById:teamRec,random:R});
      maintainSeasonEnd(S);
      if(S.lastSalaryPaidYear===S.year||S.ct?.annualSchedule?.some(row=>row.year===S.year&&row.paid===true))return;
      if(created&&result.won){
        const team=teamRec(result.teamId);
        card('gold',result.title+'達成',`${escapeHTML(team.name)}が<b class="hl">${result.title}</b>に輝いた。今季の優勝をキャリアの実績に追加した。`);
      }
    }
    careerSession.seasonEndContext={state:S,year:S.year};
    S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});if(S.stage==='PRO'){if(!S.ct)throw new Error('PRO_PLAYER_WITHOUT_CONTRACT');if(S.ct.schemaVersion!==3){S.ct=normalizeContract(S.ct,{currentYear:S.year,currentSalary:S.currentSalary,org:S.org,teamId:S.orgTeamId});S.currentSalary=S.ct.annualSalary;}const due=salaryDueForYear(S.ct,S.year);if(due.scheduleIndex<0)throw new Error('PRO_PLAYER_WITHOUT_CONTRACT');const payment=markSalaryPaid(S.ct,S.year),paid=payment.amount;S.ct=payment.contract;S.currentSalary=S.ct.annualSalary||paid;S.careerBaseSalary+=paid;S.careerEarnings+=paid;S.lastSalaryPaidYear=S.year;const incentivePayment=applyIncentivePayment(S,{contract:S.ct,evaluation:S.lastSalaryEvaluation,honors:S.honors,year:S.year}),incentive=incentivePayment.result;if(incentivePayment.paid){S.careerIncentive=incentivePayment.state.careerIncentive;S.careerEarnings=incentivePayment.state.careerEarnings;S.yearlyIncentivePaid=incentivePayment.state.yearlyIncentivePaid;}careerSession.pendingOffseasonSalary=null;const continuation=contractContinuationForNextYear(S.ct,S.year),continuationText=continuation?`<br><b>現契約を継続</b><br>来季年俸：<b class="hl">${fmtMoney(continuation.nextSalary)}</b><br>契約残り：${continuation.remainingYears}年<br>年俸の再計算はありません<br>今季の実績は次回の契約評価へ反映されます。`:'';card('','シーズン終了',`今季支給年俸：<b class="hl">${fmtMoney(paid)}</b>｜出来高：<b class="hl">${fmtMoney(incentive.amount||0)}</b>（${incentive.level}）<br>スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}<br>今季受取総額：<b class="hl">${fmtMoney(paid+(incentive.amount||0)+(S.yearOutsideIncome||0))}</b>｜生涯収入：${fmtMoney(S.careerEarnings)}${continuationText}`);}else if(S.stage==='IND'){const candidate=salaryCandidate({sourceLevel:'IND',targetLevel:'IND',rating:currentMarketRating(),contractMult:1}),pay=candidate.annualSalary,previousSalary=S.currentSalary;S.currentSalary=pay;S.ct=null;if(S.lastSalaryPaidYear===S.year)throw new Error('SALARY_ALREADY_PAID_FOR_YEAR');S.careerBaseSalary+=pay;S.careerEarnings+=pay;S.lastSalaryPaidYear=S.year;saveSalaryDecision('RENEWAL',candidate,previousSalary,pay);card('','独立リーグ年間報酬',`今季年俸${fmtMoney(pay)}を受領した。スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}。今季受取総額：${fmtMoney(pay+(S.yearOutsideIncome||0))}。生涯収入：${fmtMoney(S.careerEarnings)} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();}else if(S.stage==='CORP'){const entry=careerSession.corpSettlements.get(S),pay=entry.paid?entry.pay:salaryFor('CORP',S.lastD||0);if(!entry.paid){S.corpIncome+=pay;S.careerEarnings+=pay;entry.pay=pay;entry.paid=true;}card('','社会人給与',`企業給与${fmtMoney(pay)}を受領した。スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}。今季受取総額：${fmtMoney(pay+(S.yearOutsideIncome||0))}。`);}const go=()=>movement();if(S.pool>0){const p=S.pool;S.pool=0;choose('',[{t:`能力点を分配（${p}点）`,main:true,f:()=>allocUI({pool:p},'シーズン成果の能力点',go)}]);}else go();}

  movement = function(){migrateSalaryV130State();if(S.stage==='HS'){if(S.stageYr<3)reportFlowOutcome({kind:'AMATEUR_STAY'});else pathChoiceHS();return;}if(S.stage==='U'){if(S.stageYr<4)reportFlowOutcome({kind:'AMATEUR_STAY'});else pathChoiceU4();return;}if(S.stage==='CORP'){S.corpYears++;const eligible=(S.entryRoute==='HS'?S.corpYears>=3:S.corpYears>=2);const opts=[{t:'社会人野球を続ける',main:true,f:()=>reportFlowOutcome({kind:'AMATEUR_STAY'})},{t:'独立リーグへ移籍',f:()=>{setAmateur('IND');reportFlowOutcome({kind:'AMATEUR_JOIN_IND'});}},{t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'AMATEUR_RETIRED',reason:'社会人野球で現役生活を終えた。'})}];if(eligible)opts.unshift({t:'NPBドラフトへ再挑戦',main:true,f:()=>enterDraftPath('CORP')});choose('社会人シーズン終了',opts);return;}if(S.stage==='IND'){S.indYears++;choose('独立リーグシーズン終了',[{t:'NPBドラフトへ再挑戦',main:true,f:()=>enterDraftPath('IND')},{t:'独立リーグに残留',f:()=>reportFlowOutcome({kind:'AMATEUR_STAY'})},{t:'社会人野球へ',f:()=>{setAmateur('CORP');reportFlowOutcome({kind:'AMATEUR_JOIN_CORP'});}},{t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'AMATEUR_RETIRED',reason:'独立リーグで現役生活を終えた。'})}]);return;}accrueForeignFirstTeamSeason(S);if(S.serviceTimeAccruedYear!==S.year){if(S.org==='NPB'&&S.lv==='NPB1'&&S.seasonFactor>0){S.npbRosterDays+=Math.round(145*S.seasonFactor);while(S.npbRosterDays>=145){S.npbRosterDays-=145;S.npbFaSeasons++;}S.serviceTime.NPB=Math.max(S.serviceTime.NPB,S.npbFaSeasons);}else if(S.org==='MLB'&&S.lv==='MLB'&&S.seasonFactor>=.5)S.serviceTime.MLB++;else if((S.org==='KBO'&&S.lv==='KBO1'||S.org==='CPBL'&&S.lv==='CPBL1')&&S.seasonFactor>0)S.serviceTime[S.org]++;S.serviceTimeAccruedYear=S.year;}const stage=contractStageFor(S.org);if(S.org==='NPB')S.faElig=S.serviceTime.NPB>=8;else if(S.org==='MLB')S.faElig=stage!=='CONTROL';LEGACY.movement();};
  const performMovement=movement;
  movement=function(){
    if(S.stage!=='PRO')return performMovement();
    let entry=professionalMoves.get(S);
    if(entry?.year===S.year){
      if(entry.phase==='WAIT_CHOICE'){if(!restorePendingChoice())throw new Error('MOVEMENT_CONTINUATION_AMBIGUOUS');return;}
      throw new Error('MOVEMENT_CONTINUATION_AMBIGUOUS');
    }
    entry={state:S,year:S.year,phase:'STARTED'};professionalMoves.set(S,entry);
    performMovement();entry.phase='WAIT_CHOICE';
  };

  const legacyEndGame=LEGACY.endGame;
  endGame=function(reason){legacyEndGame(reason);setTimeout(()=>{
    /* innerHTML の再代入は共有ボタンのイベントリスナーを消すため、テキストノードだけを安全に更新する。 */
    document.querySelectorAll('.card').forEach(c=>{
      const walker=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);
      for(let n=walker.nextNode();n;n=walker.nextNode())n.nodeValue=n.nodeValue.replace(/台幣/g,'円').replace(/中華隊/g,'日本代表').replace(/臺灣/g,'日本');
    });
  },0);};

  function startJapanese(){let params=new URLSearchParams(location.search);let sv=normalizeSeed($('seed-show').value||params.get('seed'));if(!sv)sv=generateSeed();SEED=sv;const pos=document.querySelector('#seg-pos button.on')?.dataset.v||'P';const nm=normalizePlayerName($('in-name').value,SEED,pos);S={rngState:0};seedInit(SEED);S=newState(nm,pos);history.replaceState(null,'',`?seed=${encodeURIComponent(SEED)}`);$('start').style.display='none';$('board').style.display='';$('act').style.display='';navigation.reset();navigation.show();card('info','選手誕生',`${S.year}年春、${POSN[S.pos]} <b class="hl">${escapeHTML(S.name)}</b>は<b class="hl">${escapeHTML(S.team)}</b>${S.schoolTier==='C'?'（C級・弱小校）':''}野球部に入部した。ここから、すべての選択が野球人生を変える。`);startYear();}
  const appVersion=$('app-version');if(appVersion)appVersion.textContent='v'+VERSION;
  createSeedShareController({trigger:$('board-share'),getSeed:()=>S?.seed||$('seed-show').value||SEED});
  const salaryDetailController=createSalaryDetailController({trigger:$('salary-detail-trigger'),panel:$('salary-detail-panel'),closeButton:$('salary-detail-close'),title:$('salary-detail-title'),body:$('salary-detail-body'),getDecision:()=>S?.lastSalaryDecision||null,getCurrentSalary:()=>S?.currentSalary||0,getContract:()=>S?.ct||null,getIncome:()=>({signing:S?.careerSigningBonus||0,stipend:S?.careerDevelopmentStipend||0,base:S?.careerBaseSalary||0,incentive:S?.careerIncentive||0,buyout:S?.careerBuyout||0,outside:S?.careerOutsideIncome||0,yearOutside:S?.yearOutsideIncome||0,total:S?.careerEarnings||0,corp:S?.corpIncome||0}),isProfessional:()=>S?.stage==='PRO'||S?.stage==='IND',fmtMoney});
  const navigation=initNavigation({onNavigate:archiveTraitResults,onOpenPlayer:buildPlayerViewModel,onOpenCareer:buildCareerViewModel});
  $('btn-start').onclick=startJapanese;
  $('seed-re').onclick=e=>{e.preventDefault();const s=generateSeed();$('seed-show').value=s;SEED=s;};
  $('seed-show').value=normalizeSeed(new URLSearchParams(location.search).get('seed'))||generateSeed();
  $('btn-restart').onclick=()=>{if(confirm('この野球人生を終了して最初からやり直しますか？'))location.href=location.pathname;};

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
import { InternationalTournament } from './international-tournament.js';
import { PlayerInjury } from './player-injury.js';
import { PlayerAbility } from './player-ability.js';
import { SeasonEvents } from './season-events.js';
import { PlayerRomance } from './player-romance.js';
import { SeasonAwards } from './season-awards.js';
import { CareerRetirement } from './career-retirement.js';
import { AmateurCareer } from './amateur-career.js';
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
function afterGamble(kind,cont){playerInjury.afterGamble(kind,cont);}
function tjGamble(cont){playerInjury.tjGamble(cont);}
const playerInjury=new PlayerInjury({getState:()=>S,clamp,POS_AB,ABL,addAb:(k,v)=>addAb(k,v),board:p=>board(p),card:(cls,title,html)=>card(cls,title,html),choose:(title,opts)=>choose(title,opts),removeTrait:(key,label)=>removeTrait(key,label),tjCap:()=>tjCap(),rng:{ri:(a,b)=>ri(a,b),chance:p=>chance(p),pick:keys=>pick(keys)}});
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
function addAb(k,v){return playerAbility.addAb(k,v);}
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
function allocUI(mode,label,done){playerAbility.allocUI(mode,label,done);}
const playerAbility=new PlayerAbility({getState:()=>S,clamp,POS_AB,ABL,careerSession,choiceViews,$:id=>$(id),abCost:k=>abCost(k),ovr:()=>ovr(),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),card:(cls,title,html)=>card(cls,title,html),board:p=>board(p),allocDone:(t,d)=>allocDone(t,d),archiveTraitResults:()=>archiveTraitResults(),actClear:()=>actClear(),actToggleSync:()=>actToggleSync(),runWithResultView:action=>runWithResultView(action),rng:{R:()=>R()}});
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
function eventChoiceSummary(ev,mode){return seasonEvents.eventChoiceSummary(ev,mode);}
function drawEvents(n,done){seasonEvents.drawEvents(n,done);}
function loveEvent(next){playerRomance.loveEvent(next);}
const seasonEvents=new SeasonEvents({getState:()=>S,EVENTS,POS_AB,ABL,choose:(title,opts)=>choose(title,opts),card:(cls,title,html)=>card(cls,title,html),board:p=>board(p),fmtMoney,logTarget:()=>logTarget(),displayTrait:key=>displayTrait(key),rng:{chance:p=>chance(p),pick:pool=>pick(pool)}});
const playerRomance=new PlayerRomance({getState:()=>S,clamp,POS_AB,ABL,addAb:(k,v)=>addAb(k,v),addAbStat:(k,amt)=>addAbStat(k,amt),card:(cls,title,html)=>card(cls,title,html),board:p=>board(p),choose:(title,opts)=>choose(title,opts),rng:{R:()=>R(),chance:p=>chance(p),pick:list=>pick(list)}});
function addAbStat(k,amt){return playerAbility.addAbStat(k,amt);}
function statBonus(pts,out){ /* 能力上限到達後は報酬を当該シーズンの成績ボーナスへ変換(次回の成績計算で適用)。 */
  S.pendStat=(S.pendStat||0)+pts;
  out.push(`<span class="up">絶好調（今季成績ボーナス ×${pts}）</span>`);
}
function renderEventResult(ev,result){seasonEvents.renderEventResult(ev,result);}
/* シーズン中即時可解鎖的特性。 */
function allocDone(touched,isDice){playerAbility.allocDone(touched,isDice);}
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
function rollInjury(){playerInjury.rollInjury();}
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
function awards(bucket,st){seasonAwards.awards(bucket,st);}
const seasonAwards=new SeasonAwards({getState:()=>S,getSeed:()=>SEED,LV,clamp,traitPresentation,isSP:()=>isSP(),teamNick,renderCheckpointCard:(owner,key,args)=>renderCheckpointCard(owner,key,args),journalRng:{R:()=>R()},annualAwardTransaction,preallocateAwardSlots,captureAwardSlot,prepareAwardReceipt,commitAwardReceipt,awardPlan,awardInputs,prepareD2AwardDecisions,recordAwardDecisions,completeAwardDecisions,getAwardDefinition,hasCurrentAwardEffect});
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
function primaryPos(){return careerRetirement.primaryPos();}
function capTeam(bucket){return careerRetirement.capTeam(bucket);}
function defShare(bucket){return defenseShareFor(S.stats[bucket],S.pos);}
function posLegendPhrase(bucket){return careerRetirement.posLegendPhrase(bucket);}
const careerRetirement=new CareerRetirement({getState:()=>S,getSeed:()=>SEED,LV,DPN,POSN,TIER_TH,LG_N,TEAM_COLOR,$:id=>$(id),fmtMoney:yen=>fmtMoney(yen),fmtIP:ip=>fmtIP(ip),slgOf:st=>slgOf(st),card:(cls,title,html)=>card(cls,title,html),divider:t=>divider(t),choose:(title,opts)=>choose(title,opts),actClear:()=>actClear(),defShare:bucket=>defShare(bucket),tierOf:bucket=>tierOf(bucket),traitNames:()=>traitNames(),teamNick:team=>teamNick(team),archiveTraitResults:()=>archiveTraitResults(),shareImage:(evals,out)=>shareImage(evals,out),rng:{R:()=>R(),ri:(a,b)=>ri(a,b)}});
function honorScore(bucket){
  return honorScoreFor({bucket,honors:S.honors,position:S.pos,intlCount:S.intlCount||0,franchise:S.traits.franchise,awardState:S});
}
function tierOf(bucket){const st=S.stats[bucket];if(!st)return null;const hs=honorScore(bucket);return hallOfFameTier({baseScore:careerScore(st),honor:hs,thresholds:TIER_TH[bucket],leagueName:LG_N[bucket]});}
function retireScene(tiers){careerRetirement.retireScene(tiers);}
function endGame(reason){careerRetirement.endGame(reason);}
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
  function enterDraftPath(from){amateurCareer.enterDraftPath(from);}
  function draftFallback(from){amateurCareer.draftFallback(from);}

  function runDraft(fromSchool,cb){const o=ovr(),score=o+Math.max(0,22-S.age)*2+ri(-4,4);let rd=0,type='ROSTER';if(score>=60)rd=1;else if(score>=55)rd=2;else if(score>=50)rd=3;else if(score>=46)rd=4;else if(score>=42)rd=ri(5,6);else if(score>=37){rd=ri(1,3);type='DEVELOPMENT';}
    if(!rd){card('bad','NPBドラフト指名漏れ',`最後まで名前は呼ばれなかった（総合${o}）。`);cb('fail');return;}
    const rec=pickRecord(listByOrg('NPB')),bonus=type==='DEVELOPMENT'?(ri(200,500),0):ri(...NPB_BONUS_RANGES[rd-1])*10000,lv=type==='DEVELOPMENT'?'NPB_DEV':'NPB2';S.draftRights={teamId:rec.teamId,round:rd,type,deadline:S.year+'-03-31',status:'NEGOTIATING'};
    const accept=()=>{const terms=draftSigningTerms(type,rd),signingTerms=createSigningBonusTerms({route:'NPB_DRAFT',draftType:type,bonus}),result=acceptDraftSelection({state:S,type,round:rd,teamId:rec.teamId,bonus,sign:()=>signTo('NPB',lv,rec.teamId,1,1,'NEW_CONTRACT',{annualSalary:terms.rookieSalary,contractType:terms.contractType,signingBonus:bonus,signingTerms,startYear:S.year+1})});card('gold','NPBドラフト',`${escapeHTML(rec.name)}から${type==='DEVELOPMENT'?'育成':''}${rd}巡目指名。${type==='DEVELOPMENT'?'育成支度金'+fmtMoney(signingTerms.developmentStipend):'契約金'+fmtMoney(bonus)}。新人年俸${fmtMoney(terms.rookieSalary)}。 ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();cb(result);};
    choose(`NPBドラフト会議・${escapeHTML(rec.name)}が${type==='DEVELOPMENT'?'育成':''}${rd}巡目で指名`,[{t:'指名を受けて入団',main:true,f:accept},{t:'指名を拒否する',warn:true,s:'交渉権を放棄して別の進路へ',f:()=>cb(declineDraftSelection(S))}]);
  }

  function pathChoiceHS(){amateurCareer.pathChoiceHS();}
  function pathChoiceU4(){amateurCareer.pathChoiceU4();}
  const amateurCareer=new AmateurCareer({getState:()=>S,DATA,LV,ovr:()=>ovr(),fmtMoney:yen=>fmtMoney(yen),salaryFor:(lv,d)=>salaryFor(lv,d),listByOrg:org=>listByOrg(org),signTo:(...args)=>signTo(...args),choose:(title,opts)=>choose(title,opts),card:(cls,title,html)=>card(cls,title,html),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),displayTrait:key=>displayTrait(key),setSchool:kind=>setSchool(kind),setAmateur:stage=>setAmateur(stage),runDraft:(fromSchool,cb)=>runDraft(fromSchool,cb),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),nextStep:()=>nextStep(),maybeIntl:done=>maybeIntl(done),recordIndependentSalaryEvaluation:results=>recordIndependentSalaryEvaluation(results),rng:{ri:(a,b)=>ri(a,b),R:()=>R()}});

  function amateurSeason(){amateurCareer.amateurSeason();}

  function intlEvents(year){return internationalEvents(year,DATA.intlEvents);}
  function intlPhase(e){return internationalPhase(e);}
  function intlThreshold(e){return internationalThreshold(e);}
  function intlSelection(e){return internationalSelection(e,{level:S.lv,overall:ovr(),rehab:S.rehab,skipMid:S.skipMid,seasonFactor:S.seasonFactor});}
  function addIntlStats(){return seasonStats.addIntlStats();}
  function processIntlPhase(phase,done){internationalTournament.process(phase,done);}
  const internationalTournament=new InternationalTournament({getState:()=>S,normalizeInternationalState,validateInternationalEntry,prepareInternationalResult,commitInternationalResult,INTLACE_UNLOCK_TEXT,internationalPersonalStats,renderInternationalPersonalStats,intlEvents:year=>intlEvents(year),intlPhase:e=>intlPhase(e),intlThreshold:e=>intlThreshold(e),intlSelection:e=>intlSelection(e),addIntlStats:()=>addIntlStats(),card:(cls,title,html)=>card(cls,title,html),choose:(title,opts)=>choose(title,opts),displayTrait:key=>displayTrait(key),fmtIP:ip=>fmtIP(ip),pick:a=>pick(a)});
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

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
import { createInitialState } from './initial-state.js';
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
import { CareerContract } from './career-contract.js';
import { CareerMovement } from './career-movement.js';
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
import { ChoicePrompt } from '../ui/choice-prompt.js';
import { SeasonSettlement } from './season-settlement.js';
import { YearFlow } from './year-flow.js';
import { MovementGate } from './movement-gate.js';
import { SeasonPhases } from './season-phases.js';
import { GameView } from '../ui/game-view.js';
import { initNavigation } from '../ui/navigation.js';
import { honorScoreFor } from './hall-of-fame-policy.js';
import { careerScoreFor, defenseShareFor, hallOfFameTier } from './hall-of-fame-tier-policy.js';
import { defenseScoreFor, defenseBarFor, defensePositionQualified, defensePositionCandidates, defensePositionMultiplier } from './defense-position-policy.js';
import { toolGapFor, overallRatingFor, playerTypeFor, abilityStepCostFor } from './ability-evaluation-policy.js';
import { resolveStatBucket } from './stat-bucket.js';
import { CareerPresenter } from '../ui/career-presenter.js';
import {TraitResultCard} from '../ui/trait-result-card.js';
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
const careerPresenter=new CareerPresenter({getState:()=>S,labels:{ABL,POS_AB,POSN,DPN},TEAM_COLOR,fmtMoney,fmtIP,displayTrait,teamNick,roleN:r=>roleN(r),playerType:()=>playerType(),ovr:()=>ovr(),tjCap:()=>tjCap()});
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
function traitResultMarkup(node,title,html){return traitResultCard.decorate(node,title,html);}
const traitResultCard=new TraitResultCard({getState:()=>S,traitPresentation,displayTrait});
function card(cls,title,html){ gameView.card(cls,title,html); }
function divider(t){ _curYearBody=gameView.divider(t,MAX_YEARS); }
function board(phase){ gameView.renderBoard(boardModel(phase)); }
function boardModel(phase){return careerPresenter.board(phase);}
function actClear(){ gameView.actClear(); }
function actToggleSync(){ gameView.actToggleSync(); }
const choiceViews=new WeakMap(),seasonContinuations=new WeakMap(),yearHandoffs=new WeakMap();
let resumeSeasonEnd=()=>false;
function restorePendingChoice(state=S,expected){return choicePrompt.restorePendingChoice(state,expected);}
function scrollAction(){scrollBottom();}
function runWithResultView(action){return choicePrompt.runWithResultView(action);}
function choose(title,opts){choicePrompt.choose(title,opts);}
const choicePrompt=new ChoicePrompt({getState:()=>S,careerSession,choiceViews,yearHandoffs,gameView,$:id=>$(id),actClear:()=>actClear(),actToggleSync:()=>actToggleSync(),archiveTraitResults:()=>archiveTraitResults(),card:(cls,title,html)=>card(cls,title,html),scrollAction:()=>scrollAction(),scrollBottom:()=>scrollBottom()});
/* 能力加算介面：mode {dice：[..]} または {pool：n}。 */
function allocUI(mode,label,done){playerAbility.allocUI(mode,label,done);}
const playerAbility=new PlayerAbility({getState:()=>S,clamp,POS_AB,ABL,careerSession,choiceViews,$:id=>$(id),abCost:k=>abCost(k),ovr:()=>ovr(),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),card:(cls,title,html)=>card(cls,title,html),board:p=>board(p),allocDone:(t,d)=>allocDone(t,d),archiveTraitResults:()=>archiveTraitResults(),actClear:()=>actClear(),actToggleSync:()=>actToggleSync(),runWithResultView:action=>runWithResultView(action),rng:{R:()=>R()}});
/* 年間進出行。 */
function nextStep(){return yearFlow.nextStep();}
/* シーズン開幕前。 */
function phasePre(){return seasonPhases.phasePre();}
/* シーズン中。 */
function phaseMid(){return seasonPhases.phaseMid();}
const seasonPhases=new SeasonPhases({getState:()=>S,POS_AB,ABL,LV,clamp,board:p=>board(p),card:(cls,title,html)=>card(cls,title,html),choose:(title,opts)=>choose(title,opts),buyoutRemaining:rate=>buyoutRemaining(rate),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),declineForSeason:(state,amount)=>declineForSeason(state,amount),checkGoldclothSeason:()=>checkGoldclothSeason(),stageLabel:()=>stageLabel(),addAb:(k,v)=>addAb(k,v),dposReview:cont=>dposReview(cont),allocUI:(mode,label,done)=>allocUI(mode,label,done),nextStep:()=>nextStep(),tjCap:()=>tjCap(),ovr:()=>ovr(),signTo:(...args)=>signTo(...args),daibaFarewell:cont=>daibaFarewell(cont),loveEvent:next=>loveEvent(next),drawEvents:(n,done)=>drawEvents(n,done),rollInjury:()=>rollInjury(),proSeason:()=>proSeason(),amateurSeason:()=>amateurSeason(),rng:{R:()=>R(),chance:p=>chance(p),ri:(a,b)=>ri(a,b)}});
function eventChoiceSummary(ev,mode){return seasonEvents.eventChoiceSummary(ev,mode);}
function drawEvents(n,done){seasonEvents.drawEvents(n,done);}
function loveEvent(next){playerRomance.loveEvent(next);}
const seasonEvents=new SeasonEvents({getState:()=>S,EVENTS,POS_AB,ABL,choose:(title,opts)=>choose(title,opts),card:(cls,title,html)=>card(cls,title,html),board:p=>board(p),fmtMoney,logTarget:()=>logTarget(),displayTrait:key=>displayTrait(key),rng:{chance:p=>chance(p),pick:pool=>pick(pool)}});
const playerRomance=new PlayerRomance({getState:()=>S,clamp,POS_AB,ABL,addAb:(k,v)=>addAb(k,v),addAbStat:(k,amt)=>addAbStat(k,amt),card:(cls,title,html)=>card(cls,title,html),board:p=>board(p),choose:(title,opts)=>choose(title,opts),rng:{R:()=>R(),chance:p=>chance(p),pick:list=>pick(list)}});
function addAbStat(k,amt){return playerAbility.addAbStat(k,amt);}
function renderEventResult(ev,result){seasonEvents.renderEventResult(ev,result);}
function allocDone(touched,isDice){playerAbility.allocDone(touched,isDice);}
function teamNick(team){ /* ◯◯先生的◯◯：球団名を代表する語を取得。 */
  const map={'台中マンモス':'マンモス','府城ライオンズ':'ライオン','桃園コングス':'キングコング','新北ナイツ':'騎士','台北ダイナソーズ':'恐竜','高雄イーグルス':'神鷲',
    /* 同名処理：ソックス系は色で区別;大人2球団ともオレンジ、都市名で区別。 */
    'ボストン・レッドソックス':'レッドソックスのキング','シカゴ・ホワイトソックス':'ホワイトソックスのキング','東京グランズ':'東京グランズ','ベイエリア・ジャイアンツ':'ベイエリア・ジャイアンツ',
    /* slice(-2) 切字修正。 */
    'オークランド・アスレチックス':'オークランド・アスレチックス','アリゾナ・ダイヤモンドバックス':'コブラ'};
  return map[team]||(team||'').slice(-2);
}
function demotionAudit(cont){return careerMovement.demotionAudit(cont);}
function tradeCheck(cont){return careerMovement.tradeCheck(cont);}
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
/* 升降格と去向。 */
function movement(){return careerMovement.movement();}
function buyoutRemaining(rate){return careerMovement.buyoutRemaining(rate);}
function handleDemotion(o,path,idx){return careerMovement.handleDemotion(o,path,idx);}
function retireBelowActiveMinimum(){return careerMovement.retireBelowActiveMinimum();}
/* 長期契約/短期契約 選択処理。 */
function extensionOffer(o){return careerContract.extensionOffer(o);}
function ageGateJP(){return careerContract.ageGateJP();}
if(typeof document!=='undefined'&&document.getElementById('btn-restart')){
  document.getElementById('btn-restart').onclick=function(){
    if(confirm('人生のこの部分を放棄して、最初からやり直してもよろしいですか?'))location.href=location.pathname;
  };
}
function advance(){return yearFlow.advance();}
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
$('seed-show').value=SEED;
$('seed-re').onclick=e=>{e.preventDefault();SEED=(0).toString(36).slice(2,10);$('seed-show').value=SEED;};
document.querySelectorAll('#seg-pos button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#seg-pos button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');
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

  function salaryFor(lv,d){return careerContract.salaryFor(lv,d);}
  function migrateSalaryV130State(){return careerContract.migrateSalaryV130State();}
  function migrateSalaryV140State(){return careerContract.migrateSalaryV140State();}
  function serviceYearsFor(org){return careerContract.serviceYearsFor(org);}
  function contractStageFor(org){return careerContract.contractStageFor(org);}
  function currentMarketRating(){return careerContract.currentMarketRating();}
  function kboPreviousPackage(){return careerContract.kboPreviousPackage();}
  function salaryCandidate(input){return careerContract.salaryCandidate(input);}
  function saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options){return careerContract.saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options);}
  function salaryDecisionLink(){return careerContract.salaryDecisionLink();}
  function bindLatestSalaryDetailLink(){return careerContract.bindLatestSalaryDetailLink();}
  function finalizePendingOffseasonSalary(){return careerContract.finalizePendingOffseasonSalary();}
  function applyPromotionSalary(fromLv,toLv){return careerContract.applyPromotionSalary(fromLv,toLv);}
  function applyDemotionSalary(fromLv,toLv){return careerContract.applyDemotionSalary(fromLv,toLv);}
  function markClubInitiatedRenewal(years){return careerContract.markClubInitiatedRenewal(years);}
  function appendContractExtension(years,mult){return careerContract.appendContractExtension(years,mult);}
  function recordSalaryEvaluation(st){return careerContract.recordSalaryEvaluation(st);}
  function recordIndependentSalaryEvaluation(results){return careerContract.recordIndependentSalaryEvaluation(results);}

  function reportFlowOutcome(outcome){return yearFlow.reportFlowOutcome(outcome);}
  const flowHooks={advance:null,endGame:null};

  function newState(name,pos){return createInitialState(name,pos,{getState:()=>S,getSeed:()=>SEED,R,ri,pickRecord,DATA,POS_AB,teamRec,teamDisplay,traitPresentation});}

  const careerContract=new CareerContract({getState:()=>S,LV,PATHS,careerSession,salaryDetailController:{open:()=>salaryDetailController.open()},fixedContract:input=>fixedContract(input),salaryCandidate:input=>salaryCandidate(input),salaryFor:(lv,d)=>salaryFor(lv,d),applyKboForeignPackageCap:input=>applyKboForeignPackageCap(input),clamp:(v,a,b)=>clamp(v,a,b),dpMult:()=>dpMult(),ovr:()=>ovr(),slgOf:st=>slgOf(st),fmtMoney:yen=>fmtMoney(yen),card:(cls,title,html)=>card(cls,title,html),board:phase=>board(phase),choose:(title,opts)=>choose(title,opts),escapeHTML:v=>escapeHTML(v),teamRec:id=>teamRec(id),listByOrg:org=>listByOrg(org),pickRecord:a=>pickRecord(a),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),crossOffers:o=>crossOffers(o),rng:{chance:p=>chance(p)}});
  function fixedContract(input){return careerContract.fixedContract(input);}
  function signTo(org,lv,teamId,yrs,mult,decisionType,options){return careerContract.signTo(org,lv,teamId,yrs,mult,decisionType,options);}
  function doTradeExec(){return careerContract.doTradeExec();}
  function stageLabel(){return careerContract.stageLabel();}
  board = function(phase){LEGACY.board(phase);gameView.patchBoard({name:S.name,salaryText:Math.round((S.currentSalary||0)/10000).toLocaleString()});};

  function setSchool(kind){const a=kind==='U'?DATA.universities:DATA.highSchools,r=pickRecord(a);S.schoolId=r.schoolId;S.schoolTier=r.tier;S.team=r.name;S.lv=kind;S.org='AMATEUR';}
  function setAmateur(stage){S.stage=stage;S.stageYr=0;S.lv=stage;S.org=stage;S.orgTeamId=pickRecord(listByOrg(stage)).teamId;S.team=teamRec(S.orgTeamId).name;if(stage==='CORP')S.corpYears=0;else S.indYears=0;}
  function enterDraftPath(from){amateurCareer.enterDraftPath(from);}
  function draftFallback(from){amateurCareer.draftFallback(from);}

  function runDraft(fromSchool,cb){amateurCareer.runDraft(fromSchool,cb);}

  function pathChoiceHS(){amateurCareer.pathChoiceHS();}
  function pathChoiceU4(){amateurCareer.pathChoiceU4();}
  const amateurCareer=new AmateurCareer({getState:()=>S,DATA,LV,ovr:()=>ovr(),fmtMoney:yen=>fmtMoney(yen),salaryFor:(lv,d)=>salaryFor(lv,d),listByOrg:org=>listByOrg(org),signTo:(...args)=>signTo(...args),choose:(title,opts)=>choose(title,opts),card:(cls,title,html)=>card(cls,title,html),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),displayTrait:key=>displayTrait(key),setSchool:kind=>setSchool(kind),setAmateur:stage=>setAmateur(stage),runDraft:(fromSchool,cb)=>runDraft(fromSchool,cb),pickRecord:a=>pickRecord(a),escapeHTML:v=>escapeHTML(v),salaryDecisionLink:()=>salaryDecisionLink(),bindLatestSalaryDetailLink:()=>bindLatestSalaryDetailLink(),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),nextStep:()=>nextStep(),maybeIntl:done=>maybeIntl(done),recordIndependentSalaryEvaluation:results=>recordIndependentSalaryEvaluation(results),rng:{ri:(a,b)=>ri(a,b),R:()=>R()}});

  function amateurSeason(){amateurCareer.amateurSeason();}

  function intlEvents(year){return internationalEvents(year,DATA.intlEvents);}
  function intlPhase(e){return internationalPhase(e);}
  function intlThreshold(e){return internationalThreshold(e);}
  function intlSelection(e){return internationalSelection(e,{level:S.lv,overall:ovr(),rehab:S.rehab,skipMid:S.skipMid,seasonFactor:S.seasonFactor});}
  function addIntlStats(){return seasonStats.addIntlStats();}
  function processIntlPhase(phase,done){internationalTournament.process(phase,done);}
  const internationalTournament=new InternationalTournament({getState:()=>S,normalizeInternationalState,validateInternationalEntry,prepareInternationalResult,commitInternationalResult,INTLACE_UNLOCK_TEXT,internationalPersonalStats,renderInternationalPersonalStats,intlEvents:year=>intlEvents(year),intlPhase:e=>intlPhase(e),intlThreshold:e=>intlThreshold(e),intlSelection:e=>intlSelection(e),addIntlStats:()=>addIntlStats(),card:(cls,title,html)=>card(cls,title,html),choose:(title,opts)=>choose(title,opts),displayTrait:key=>displayTrait(key),fmtIP:ip=>fmtIP(ip),pick:a=>pick(a)});
  function maybeIntl(done){processIntlPhase('POST',done);}
  function phaseIntlPre(){return yearFlow.phaseIntlPre();}
  function startYear(){return yearFlow.startYear();}
  const yearFlow=new YearFlow({getState:()=>S,careerSession,yearHandoffs,flowHooks,$:id=>$(id),finalizePendingOffseasonSalary:()=>finalizePendingOffseasonSalary(),startYear:()=>startYear(),nextStep:()=>nextStep(),advance:()=>advance(),endGame:reason=>endGame(reason),processIntlPhase:(phase,done)=>processIntlPhase(phase,done),divider:t=>divider(t),stageLabel:()=>stageLabel(),yearSteps:()=>[phasePre,phaseIntlPre,phaseMid,phaseEnd]});

  function daibaFarewell(cont){return careerMovement.daibaFarewell(cont);}

  function overseasOffer(org,lv,label,o,minD,finish){return careerMovement.overseasOffer(org,lv,label,o,minD,finish);}
  function crossOffers(o){return careerMovement.crossOffers(o);}

  function renewAndAdvance(mult,allowDecrease,contractType){return careerContract.renewAndAdvance(mult,allowDecrease,contractType);}
  function arbitrationFlow(){return careerContract.arbitrationFlow();}
  function faMarket(o,d){return careerMovement.faMarket(o,d);}
  function outOfOrg(o){return careerMovement.outOfOrg(o);}
  const careerMovement=new CareerMovement({getState:()=>S,LV,PATHS,careerSession,faMarket:(o,d)=>faMarket(o,d),crossOffers:o=>crossOffers(o),applyPromotionSalary:(fromLv,toLv)=>applyPromotionSalary(fromLv,toLv),markClubInitiatedRenewal:years=>markClubInitiatedRenewal(years),extensionOffer:o=>extensionOffer(o),displayTrait:key=>displayTrait(key),slgOf:st=>slgOf(st),teamNick:id=>teamNick(id),applyKboForeignPackageCap:input=>applyKboForeignPackageCap(input),salaryCandidate:input=>salaryCandidate(input),salaryFor:(lv,d)=>salaryFor(lv,d),fixedContract:input=>fixedContract(input),signTo:(org,lv,teamId,years,mult,reason,options)=>signTo(org,lv,teamId,years,mult,reason,options),saveSalaryDecision:(decisionType,candidate,previousSalary,finalSalary,options)=>saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options),renewAndAdvance:(mult,allowDecrease,contractType)=>renewAndAdvance(mult,allowDecrease,contractType),arbitrationFlow:()=>arbitrationFlow(),kboPreviousPackage:()=>kboPreviousPackage(),currentMarketRating:()=>currentMarketRating(),contractStageFor:org=>contractStageFor(org),serviceYearsFor:org=>serviceYearsFor(org),migrateSalaryV130State:()=>migrateSalaryV130State(),migrateSalaryV140State:()=>migrateSalaryV140State(),applyDemotionSalary:(fromLv,toLv)=>applyDemotionSalary(fromLv,toLv),ageGateJP:()=>ageGateJP(),doTradeExec:()=>doTradeExec(),dpMult:()=>dpMult(),ovr:()=>ovr(),fmtMoney:yen=>fmtMoney(yen),card:(cls,title,html)=>card(cls,title,html),board:phase=>board(phase),choose:(title,opts)=>choose(title,opts),escapeHTML:v=>escapeHTML(v),teamRec:id=>teamRec(id),listByOrg:org=>listByOrg(org),pickRecord:a=>pickRecord(a),removeTrait:(key,name)=>removeTrait(key,name),traitCard:(key,name,text,cls)=>traitCard(key,name,text,cls),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),rng:{R:()=>R(),ri:(a,b)=>ri(a,b),chance:p=>chance(p)}});

  resumeSeasonEnd=()=>seasonSettlement.resumeSeasonEnd();
  function phaseEnd(){return seasonSettlement.phaseEnd();}
  const seasonSettlement=new SeasonSettlement({getState:()=>S,careerSession,choiceViews,board:phase=>board(phase),migrateSalaryV140State:()=>migrateSalaryV140State(),teamRec:id=>teamRec(id),random:()=>R(),renderCheckpointCard:(owner,key,args)=>renderCheckpointCard(owner,key,args),escapeHTML:v=>escapeHTML(v),fmtMoney:yen=>fmtMoney(yen),movement:()=>movement(),choose:(title,opts)=>choose(title,opts),allocUI:(mode,label,done)=>allocUI(mode,label,done),restorePendingChoice:(state,expected)=>restorePendingChoice(state,expected),$:id=>$(id),salaryCandidate:input=>salaryCandidate(input),currentMarketRating:()=>currentMarketRating(),saveSalaryDecision:(decisionType,candidate,previousSalary,finalSalary,options)=>saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options),card:(cls,title,html)=>card(cls,title,html),salaryDecisionLink:()=>salaryDecisionLink(),bindLatestSalaryDetailLink:()=>bindLatestSalaryDetailLink(),salaryFor:(lv,d)=>salaryFor(lv,d)});

  movement=function(){return movementGate.movement();};
  const movementGate=new MovementGate({getState:()=>S,LEGACY,amateurCareer,migrateSalaryV130State:()=>migrateSalaryV130State(),accrueForeignFirstTeamSeason:state=>accrueForeignFirstTeamSeason(state),contractStageFor:org=>contractStageFor(org),restorePendingChoice:(state,expected)=>restorePendingChoice(state,expected)});

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

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

  function daibaFarewell(cont){return careerMovement.daibaFarewell(cont);}

  function overseasOffer(org,lv,label,o,minD,finish){return careerMovement.overseasOffer(org,lv,label,o,minD,finish);}
  function crossOffers(o){return careerMovement.crossOffers(o);}

  function renewAndAdvance(mult,allowDecrease,contractType){return careerContract.renewAndAdvance(mult,allowDecrease,contractType);}
  function arbitrationFlow(){return careerContract.arbitrationFlow();}
  function faMarket(o,d){return careerMovement.faMarket(o,d);}
  function outOfOrg(o){return careerMovement.outOfOrg(o);}
  const careerMovement=new CareerMovement({getState:()=>S,LV,PATHS,careerSession,faMarket:(o,d)=>faMarket(o,d),crossOffers:o=>crossOffers(o),applyPromotionSalary:(fromLv,toLv)=>applyPromotionSalary(fromLv,toLv),markClubInitiatedRenewal:years=>markClubInitiatedRenewal(years),extensionOffer:o=>extensionOffer(o),displayTrait:key=>displayTrait(key),slgOf:st=>slgOf(st),teamNick:id=>teamNick(id),applyKboForeignPackageCap:input=>applyKboForeignPackageCap(input),salaryCandidate:input=>salaryCandidate(input),salaryFor:(lv,d)=>salaryFor(lv,d),fixedContract:input=>fixedContract(input),signTo:(org,lv,teamId,years,mult,reason,options)=>signTo(org,lv,teamId,years,mult,reason,options),saveSalaryDecision:(decisionType,candidate,previousSalary,finalSalary,options)=>saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options),renewAndAdvance:(mult,allowDecrease,contractType)=>renewAndAdvance(mult,allowDecrease,contractType),arbitrationFlow:()=>arbitrationFlow(),kboPreviousPackage:()=>kboPreviousPackage(),currentMarketRating:()=>currentMarketRating(),contractStageFor:org=>contractStageFor(org),serviceYearsFor:org=>serviceYearsFor(org),migrateSalaryV130State:()=>migrateSalaryV130State(),migrateSalaryV140State:()=>migrateSalaryV140State(),applyDemotionSalary:(fromLv,toLv)=>applyDemotionSalary(fromLv,toLv),ageGateJP:()=>ageGateJP(),doTradeExec:()=>doTradeExec(),dpMult:()=>dpMult(),ovr:()=>ovr(),fmtMoney:yen=>fmtMoney(yen),card:(cls,title,html)=>card(cls,title,html),board:phase=>board(phase),choose:(title,opts)=>choose(title,opts),escapeHTML:v=>escapeHTML(v),teamRec:id=>teamRec(id),listByOrg:org=>listByOrg(org),pickRecord:a=>pickRecord(a),removeTrait:(key,name)=>removeTrait(key,name),traitCard:(key,name,text,cls)=>traitCard(key,name,text,cls),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),rng:{R:()=>R(),ri:(a,b)=>ri(a,b),chance:p=>chance(p)}});

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
    board(2);migrateSalaryV140State();
    normalizeChampionshipState(S,teamRec);
    careerSession.seasonEndContext={state:S,year:S.year};
    S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});if(S.stage==='IND'){const candidate=salaryCandidate({sourceLevel:'IND',targetLevel:'IND',rating:currentMarketRating(),contractMult:1}),pay=candidate.annualSalary,previousSalary=S.currentSalary;S.currentSalary=pay;S.ct=null;if(S.lastSalaryPaidYear===S.year)throw new Error('SALARY_ALREADY_PAID_FOR_YEAR');S.careerBaseSalary+=pay;S.careerEarnings+=pay;S.lastSalaryPaidYear=S.year;saveSalaryDecision('RENEWAL',candidate,previousSalary,pay);card('','独立リーグ年間報酬',`今季年俸${fmtMoney(pay)}を受領した。スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}。今季受取総額：${fmtMoney(pay+(S.yearOutsideIncome||0))}。生涯収入：${fmtMoney(S.careerEarnings)} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();}else if(S.stage==='CORP'){const entry=careerSession.corpSettlements.get(S),pay=entry.paid?entry.pay:salaryFor('CORP',S.lastD||0);if(!entry.paid){S.corpIncome+=pay;S.careerEarnings+=pay;entry.pay=pay;entry.paid=true;}card('','社会人給与',`企業給与${fmtMoney(pay)}を受領した。スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}。今季受取総額：${fmtMoney(pay+(S.yearOutsideIncome||0))}。`);}const go=()=>movement();if(S.pool>0){const p=S.pool;S.pool=0;choose('',[{t:`能力点を分配（${p}点）`,main:true,f:()=>allocUI({pool:p},'シーズン成果の能力点',go)}]);}else go();}

  movement = function(){migrateSalaryV130State();if(amateurCareer.seasonEndMovement())return;accrueForeignFirstTeamSeason(S);if(S.serviceTimeAccruedYear!==S.year){if(S.org==='NPB'&&S.lv==='NPB1'&&S.seasonFactor>0){S.npbRosterDays+=Math.round(145*S.seasonFactor);while(S.npbRosterDays>=145){S.npbRosterDays-=145;S.npbFaSeasons++;}S.serviceTime.NPB=Math.max(S.serviceTime.NPB,S.npbFaSeasons);}else if(S.org==='MLB'&&S.lv==='MLB'&&S.seasonFactor>=.5)S.serviceTime.MLB++;else if((S.org==='KBO'&&S.lv==='KBO1'||S.org==='CPBL'&&S.lv==='CPBL1')&&S.seasonFactor>0)S.serviceTime[S.org]++;S.serviceTimeAccruedYear=S.year;}const stage=contractStageFor(S.org);if(S.org==='NPB')S.faElig=S.serviceTime.NPB>=8;else if(S.org==='MLB')S.faElig=stage!=='CONTROL';LEGACY.movement();};
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

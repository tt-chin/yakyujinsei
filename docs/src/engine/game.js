import {confirmAction} from '../ui/confirmation-dialog.js';
import {BrowserSaveController} from './browser-save-controller.js';
import {hydrateSavedState} from './browser-save-runtime.js';
import {createBrowserSaveUI} from '../ui/browser-save-ui.js';
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
import { DefensePosition, DP_RANK, DP_MULT } from './defense-position.js';
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
import { LeagueCatalog } from './league-catalog.js';
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
import { ProfessionalSeason } from './professional-season.js';
import { CareerEntry } from './career-entry.js';
import { GameView } from '../ui/game-view.js';
import { CheckpointRenderer } from '../ui/checkpoint-renderer.js';
import { initNavigation } from '../ui/navigation.js';
import { honorScoreFor } from './hall-of-fame-policy.js';
import {evaluateLeagueHof} from './hof-evaluation-policy.js';
import { careerScoreFor, defenseShareFor, hallOfFameTier } from './hall-of-fame-tier-policy.js';
import { toolGapFor, overallRatingFor, playerTypeFor, abilityStepCostFor } from './ability-evaluation-policy.js';
import { resolveStatBucket } from './stat-bucket.js';
import { CareerPresenter } from '../ui/career-presenter.js';
import { fmtIP, slgOf } from '../ui/stat-format.js';
import {TraitResultCard} from '../ui/trait-result-card.js';
import { CareerTraits } from './career-traits.js';
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
const defensePosition=new DefensePosition({getState:()=>S});
function dposReview(cont){defensePositionReview.review(cont);}
const defensePositionReview=new DefensePositionReview({getState:()=>S,getLevels:()=>LV,DPN,DP_RANK,DP_MULT,dpBar:()=>defensePosition.bar(),dpQual:p=>defensePosition.qualified(p),dpList:()=>defensePosition.candidates(),pitcherRole:()=>pitcherRole(),roleN:r=>roleN(r),choose:(title,opts)=>choose(title,opts),card:(cls,title,html)=>card(cls,title,html)});
const leagueCatalog=new LeagueCatalog({teams:JP_DATA.teams});
const TEAM_COLOR=leagueCatalog.teamColors;
const LV=leagueCatalog.levels;
const PATHS=leagueCatalog.paths;
/* Approved 92-card catalog; validation consumes no RNG. */
validateEventCatalog();
const EVENTS=EVENT_CATALOG.events;
/* ゲーム状態。 */
let S=null;
let browserSave=null;
const careerSession=new CareerSession();
const seasonStats=new SeasonStats({getState:()=>S,levels:LV,rng:{R:()=>R(),N0:sd=>N0(sd),chance:p=>chance(p),ri:(a,b)=>ri(a,b)},clamp,isSP:()=>isSP(),pitcherRole:()=>pitcherRole(),checkGoldclothSeason:()=>checkGoldclothSeason()});
let careerRng = null;
function blankStat(){return seasonStats.blankStat();}
function bucketOf(lv){return resolveStatBucket(LV,lv);}
function traitCard(key,name,desc,tone){careerTraits.unlock(key,name,desc,tone);}
function removeTrait(key,label){careerTraits.remove(key,label);}
/* 一芸特化：評価対象は三つの役割軸のみ——打撃(長打力/Contact)、走塁(速度)、守備(総合)。 */
function careerAllStars(){ let n=0; ['CPBL','KBO','NPB','MLB'].forEach(b=>{ if(S.stats[b])n+=(S.stats[b].AS||0); }); return n; }
function toolGap(){return toolGapFor(S.ab,S.pos);}
function tjAccrue(){return playerInjury.accrueTj();}
function tjCap(){return playerInjury.tjGaugeLimit();}
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
function statLine(st){return careerPresenter.statLine(st);}
const fmtMoney=yen=>{yen=Math.max(0,Math.round(Number(yen)||0));const oku=Math.floor(yen/100000000),man=Math.floor((yen%100000000)/10000);return (oku?oku+'億':'')+(man?man.toLocaleString()+'万円':oku?'円':'0円');};
function displayTrait(key){return careerTraits.label(key);}
function traitNames(){return careerTraits.names();}
function checkGoldclothSeason(){careerTraits.checkGoldclothSeason();}
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
const careerTraits=new CareerTraits({getState:()=>S,traitPresentation,card:(cls,title,html)=>card(cls,title,html),board:p=>board(p),teamNick:team=>teamNick(team),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),displayTrait:key=>displayTrait(key)});
function card(cls,title,html){ gameView.card(cls,title,html); }
function divider(t){ _curYearBody=gameView.divider(t,MAX_YEARS); }
function board(phase){ gameView.renderBoard(boardModel(phase));gameView.patchBoard({name:S.name,salaryText:Math.round((S.currentSalary||0)/10000).toLocaleString()}); }
function boardModel(phase){return careerPresenter.board(phase);}
function actClear(){ gameView.actClear(); }
function actToggleSync(){ gameView.actToggleSync(); }
const choiceViews=new WeakMap(),yearHandoffs=new WeakMap();
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
function teamNick(team){return leagueCatalog.teamNick(team);}
function demotionAudit(cont){return careerMovement.demotionAudit(cont);}
function tradeCheck(cont){return careerMovement.tradeCheck(cont);}
function rollInjury(){playerInjury.rollInjury();}
function proSeason(){return professionalSeason.proSeason();}
const professionalSeason=new ProfessionalSeason({getState:()=>S,LV,clamp,simSeason:lv=>simSeason(lv),applyEventSeason:(st,options)=>applyEventSeason(st,options),consumeEventSeason:state=>consumeEventSeason(state),normalizeEventSeason:(st,options)=>normalizeEventSeason(st,options),bucketOf:lv=>bucketOf(lv),accStat:(bucket,st)=>accStat(bucket,st),accLevelStat:(levelKey,st)=>accLevelStat(levelKey,st),card:(cls,title,html)=>card(cls,title,html),statLine:st=>statLine(st),isSP:()=>isSP(),toolGap:()=>toolGap(),careerAllStars:()=>careerAllStars(),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),removeTrait:(key,label)=>removeTrait(key,label),board:phase=>board(phase),awards:(bucket,st)=>awards(bucket,st),classifyMarketInjury:input=>classifyMarketInjury(input),recordSalaryEvaluation:st=>recordSalaryEvaluation(st),captureSeasonChampionship:state=>captureSeasonChampionship(state),tjAccrue:()=>tjAccrue(),tjGamble:cont=>tjGamble(cont),demotionAudit:cont=>demotionAudit(cont),tradeCheck:cont=>tradeCheck(cont),maybeIntl:done=>maybeIntl(done),nextStep:()=>nextStep(),resumeSeasonEnd:()=>resumeSeasonEnd(),restorePendingChoice:()=>restorePendingChoice(),seasonRng:{R:()=>R()}});
function awards(bucket,st){seasonAwards.awards(bucket,st);}
const seasonAwards=new SeasonAwards({getState:()=>S,getSeed:()=>SEED,LV,clamp,traitPresentation,isSP:()=>isSP(),teamNick,renderCheckpointCard:(owner,key,args)=>renderCheckpointCard(owner,key,args),journalRng:{R:()=>R()},annualAwardTransaction,preallocateAwardSlots,captureAwardSlot,prepareAwardReceipt,commitAwardReceipt,awardPlan,awardInputs,prepareD2AwardDecisions,recordAwardDecisions,completeAwardDecisions,getAwardDefinition,hasCurrentAwardEffect});
function renderCheckpointCard(owner,key,args){checkpointRenderer.render(owner,key,args);}
const checkpointRenderer=new CheckpointRenderer({card:(...args)=>card(...args),logTarget:()=>logTarget()});
/* 升降格と去向。 */
function movement(){return movementGate.movement();}
function buyoutRemaining(rate){return careerMovement.buyoutRemaining(rate);}
function handleDemotion(o,path,idx){return careerMovement.handleDemotion(o,path,idx);}
function retireBelowActiveMinimum(){return careerMovement.retireBelowActiveMinimum();}
/* 長期契約/短期契約 選択処理。 */
function extensionOffer(o){return careerContract.extensionOffer(o);}
function ageGateJP(){return careerContract.ageGateJP();}
function advance(){return yearFlow.advance();}
/* キャリア終盤。 */
const TIER_TH=leagueCatalog.tierThresholds;
const LG_N=leagueCatalog.leagueNames;
function careerScore(st){return careerScoreFor(st,S.pos);}
function primaryPos(){return careerRetirement.primaryPos();}
function capTeam(bucket){return careerRetirement.capTeam(bucket);}
function defShare(bucket){return defenseShareFor(S.stats[bucket],S.pos);}
function posLegendPhrase(bucket){return careerRetirement.posLegendPhrase(bucket);}
const careerRetirement=new CareerRetirement({getState:()=>S,getSeed:()=>SEED,LV,DPN,POSN,TIER_TH,LG_N,TEAM_COLOR,$:id=>$(id),fmtMoney:yen=>fmtMoney(yen),fmtIP:ip=>fmtIP(ip),slgOf:st=>slgOf(st),card:(cls,title,html)=>card(cls,title,html),divider:t=>divider(t),choose:(title,opts)=>choose(title,opts),actClear:()=>actClear(),defShare:bucket=>defShare(bucket),tierOf:bucket=>tierOf(bucket),traitNames:()=>traitNames(),teamNick:team=>teamNick(team),archiveTraitResults:()=>archiveTraitResults(),shareImage:(evals,out)=>shareImage(evals,out),rng:{R:()=>R(),ri:(a,b)=>ri(a,b)}});
function honorScore(bucket){
  return honorScoreFor({bucket,honors:S.honors,position:S.pos,intlCount:S.intlCount||0,franchise:S.traits.franchise,awardState:S});
}
function tierOf(bucket){return evaluateLeagueHof(S,bucket,TIER_TH[bucket],LG_N[bucket]);}
function retireScene(tiers){careerRetirement.retireScene(tiers);}
function endGame(reason){careerRetirement.endGame(reason);setTimeout(()=>{
  /* innerHTML の再代入は共有ボタンのイベントリスナーを消すため、テキストノードだけを安全に更新する。 */
  document.querySelectorAll('.card').forEach(c=>{
    const walker=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);
    for(let n=walker.nextNode();n;n=walker.nextNode())n.nodeValue=n.nodeValue.replace(/台幣/g,'円').replace(/中華隊/g,'日本代表').replace(/臺灣/g,'日本');
  });
},0);}
/* 結算圖（Canvas 產生 PNG、可長按儲存または自動下載）。 */
const shareImageView=new ShareImage({getState:()=>S,getSeed:()=>SEED,LG_N,TEAM_COLOR,teamNick,roleN,playerType,primaryPos,traitNames,fmtIP,slgOf,fmtMoney});
function shareImage(evals,out){shareImageView.render(evals,out);}
/* 開始設定。 */
(function(){ const t=document.getElementById('act-toggle');
  if(t)t.onclick=()=>{ document.getElementById('act').classList.toggle('collapsed');
    t.textContent=document.getElementById('act').classList.contains('collapsed')?'⌃ 選択肢を展開':'⌄ 選択肢を閉じる'; };
})();
document.querySelectorAll('#seg-pos button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#seg-pos button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');
});

/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */
  const DATA = JP_DATA;

  window.TEAM_MASTER = leagueCatalog.teamMaster;

  function normalizeSeed(raw){
    return [...String(raw??'').normalize('NFKC').trim().replace(/[\u0000-\u001f\u007f-\u009f]/g,'')].slice(0,24).join('');
  }
  function fnv1a32(str){ let h=0x811C9DC5; for(const b of new TextEncoder().encode(str)){h^=b;h=Math.imul(h,0x01000193)>>>0;} return h>>>0; }
  function generateSeed(){ const a=new Uint32Array(2);crypto.getRandomValues(a);return (a[0].toString(36)+a[1].toString(36)).slice(0,8); }
  function deriveSeedInt(seed,salt){ return fnv1a32('v1\0'+seed+'\0'+salt); }
  function deriveDefaultName(seed,pos){ const names={P:['投山翔太'],C:['強肩剛'],IF:['守田巧'],OF:['走川隼人']}[pos];return names[deriveSeedInt(seed,'defaultName:'+pos)%names.length]; }
  function normalizePlayerName(raw,seed,pos){ const n=[...String(raw??'').normalize('NFKC').trim().replace(/[\u0000-\u001f\u007f-\u009f]/g,'')].slice(0,10).join('');return n||deriveDefaultName(seed,pos); }
  function escapeHTML(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function teamRec(id){return leagueCatalog.teamRec(id);}
  function teamDisplay(id,lv){return leagueCatalog.teamDisplay(id,lv);}
  function listByOrg(org){return leagueCatalog.listByOrg(org);}
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

  const careerContract=new CareerContract({getState:()=>S,LV,PATHS,careerSession,salaryDetailController:{open:()=>salaryDetailController.open()},fixedContract:input=>fixedContract(input),salaryCandidate:input=>salaryCandidate(input),salaryFor:(lv,d)=>salaryFor(lv,d),applyKboForeignPackageCap:input=>applyKboForeignPackageCap(input),clamp:(v,a,b)=>clamp(v,a,b),dpMult:()=>defensePosition.multiplier(),ovr:()=>ovr(),slgOf:st=>slgOf(st),fmtMoney:yen=>fmtMoney(yen),card:(cls,title,html)=>card(cls,title,html),board:phase=>board(phase),choose:(title,opts)=>choose(title,opts),escapeHTML:v=>escapeHTML(v),teamRec:id=>teamRec(id),listByOrg:org=>listByOrg(org),pickRecord:a=>pickRecord(a),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),crossOffers:o=>crossOffers(o),rng:{chance:p=>chance(p)}});
  function fixedContract(input){return careerContract.fixedContract(input);}
  function signTo(org,lv,teamId,yrs,mult,decisionType,options){return careerContract.signTo(org,lv,teamId,yrs,mult,decisionType,options);}
  function doTradeExec(){return careerContract.doTradeExec();}
  function stageLabel(){return careerContract.stageLabel();}

  function setSchool(kind){amateurCareer.setSchool(kind);}
  function setAmateur(stage){amateurCareer.setAmateur(stage);}
  function enterDraftPath(from){amateurCareer.enterDraftPath(from);}
  function draftFallback(from){amateurCareer.draftFallback(from);}

  function runDraft(fromSchool,cb){amateurCareer.runDraft(fromSchool,cb);}

  function pathChoiceHS(){amateurCareer.pathChoiceHS();}
  function pathChoiceU4(){amateurCareer.pathChoiceU4();}
  const amateurCareer=new AmateurCareer({getState:()=>S,DATA,LV,ovr:()=>ovr(),fmtMoney:yen=>fmtMoney(yen),salaryFor:(lv,d)=>salaryFor(lv,d),listByOrg:org=>listByOrg(org),signTo:(...args)=>signTo(...args),choose:(title,opts)=>choose(title,opts),card:(cls,title,html)=>card(cls,title,html),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),displayTrait:key=>displayTrait(key),setSchool:kind=>setSchool(kind),setAmateur:stage=>setAmateur(stage),runDraft:(fromSchool,cb)=>runDraft(fromSchool,cb),pickRecord:a=>pickRecord(a),escapeHTML:v=>escapeHTML(v),salaryDecisionLink:()=>salaryDecisionLink(),bindLatestSalaryDetailLink:()=>bindLatestSalaryDetailLink(),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),nextStep:()=>nextStep(),maybeIntl:done=>maybeIntl(done),recordIndependentSalaryEvaluation:results=>recordIndependentSalaryEvaluation(results),teamRec:id=>teamRec(id),rng:{ri:(a,b)=>ri(a,b),R:()=>R()}});

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
  function startYear(){return browserSave?yearFlow.startReadyYear(state=>browserSave.capture(state)):yearFlow.startYear();}
  const yearFlow=new YearFlow({getState:()=>S,careerSession,yearHandoffs,flowHooks,$:id=>$(id),finalizePendingOffseasonSalary:()=>finalizePendingOffseasonSalary(),startYear:()=>startYear(),nextStep:()=>nextStep(),advance:()=>advance(),endGame:reason=>endGame(reason),processIntlPhase:(phase,done)=>processIntlPhase(phase,done),divider:t=>divider(t),stageLabel:()=>stageLabel(),yearSteps:()=>[phasePre,phaseIntlPre,phaseMid,phaseEnd]});

  function daibaFarewell(cont){return careerMovement.daibaFarewell(cont);}

  function overseasOffer(org,lv,label,o,minD,finish){return careerMovement.overseasOffer(org,lv,label,o,minD,finish);}
  function crossOffers(o){return careerMovement.crossOffers(o);}

  function renewAndAdvance(mult,allowDecrease,contractType){return careerContract.renewAndAdvance(mult,allowDecrease,contractType);}
  function arbitrationFlow(){return careerContract.arbitrationFlow();}
  function faMarket(o,d){return careerMovement.faMarket(o,d);}
  function outOfOrg(o){return careerMovement.outOfOrg(o);}
  const careerMovement=new CareerMovement({getState:()=>S,LV,PATHS,careerSession,faMarket:(o,d)=>faMarket(o,d),crossOffers:o=>crossOffers(o),applyPromotionSalary:(fromLv,toLv)=>applyPromotionSalary(fromLv,toLv),markClubInitiatedRenewal:years=>markClubInitiatedRenewal(years),extensionOffer:o=>extensionOffer(o),displayTrait:key=>displayTrait(key),slgOf:st=>slgOf(st),teamNick:id=>teamNick(id),applyKboForeignPackageCap:input=>applyKboForeignPackageCap(input),salaryCandidate:input=>salaryCandidate(input),salaryFor:(lv,d)=>salaryFor(lv,d),fixedContract:input=>fixedContract(input),signTo:(org,lv,teamId,years,mult,reason,options)=>signTo(org,lv,teamId,years,mult,reason,options),saveSalaryDecision:(decisionType,candidate,previousSalary,finalSalary,options)=>saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options),renewAndAdvance:(mult,allowDecrease,contractType)=>renewAndAdvance(mult,allowDecrease,contractType),arbitrationFlow:()=>arbitrationFlow(),kboPreviousPackage:()=>kboPreviousPackage(),currentMarketRating:()=>currentMarketRating(),contractStageFor:org=>contractStageFor(org),serviceYearsFor:org=>serviceYearsFor(org),migrateSalaryV130State:()=>migrateSalaryV130State(),migrateSalaryV140State:()=>migrateSalaryV140State(),applyDemotionSalary:(fromLv,toLv)=>applyDemotionSalary(fromLv,toLv),ageGateJP:()=>ageGateJP(),doTradeExec:()=>doTradeExec(),dpMult:()=>defensePosition.multiplier(),ovr:()=>ovr(),fmtMoney:yen=>fmtMoney(yen),card:(cls,title,html)=>card(cls,title,html),board:phase=>board(phase),choose:(title,opts)=>choose(title,opts),escapeHTML:v=>escapeHTML(v),teamRec:id=>teamRec(id),listByOrg:org=>listByOrg(org),pickRecord:a=>pickRecord(a),removeTrait:(key,name)=>removeTrait(key,name),traitCard:(key,name,text,cls)=>traitCard(key,name,text,cls),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),rng:{R:()=>R(),ri:(a,b)=>ri(a,b),chance:p=>chance(p)}});

  resumeSeasonEnd=()=>seasonSettlement.resumeSeasonEnd();
  function phaseEnd(){return seasonSettlement.phaseEnd();}
  const seasonSettlement=new SeasonSettlement({getState:()=>S,careerSession,choiceViews,board:phase=>board(phase),migrateSalaryV140State:()=>migrateSalaryV140State(),teamRec:id=>teamRec(id),random:()=>R(),renderCheckpointCard:(owner,key,args)=>renderCheckpointCard(owner,key,args),escapeHTML:v=>escapeHTML(v),fmtMoney:yen=>fmtMoney(yen),movement:()=>movement(),choose:(title,opts)=>choose(title,opts),allocUI:(mode,label,done)=>allocUI(mode,label,done),restorePendingChoice:(state,expected)=>restorePendingChoice(state,expected),$:id=>$(id),salaryCandidate:input=>salaryCandidate(input),currentMarketRating:()=>currentMarketRating(),saveSalaryDecision:(decisionType,candidate,previousSalary,finalSalary,options)=>saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options),card:(cls,title,html)=>card(cls,title,html),salaryDecisionLink:()=>salaryDecisionLink(),bindLatestSalaryDetailLink:()=>bindLatestSalaryDetailLink(),salaryFor:(lv,d)=>salaryFor(lv,d)});

  const movementGate=new MovementGate({getState:()=>S,careerMovement,amateurCareer,migrateSalaryV130State:()=>migrateSalaryV130State(),accrueForeignFirstTeamSeason:state=>accrueForeignFirstTeamSeason(state),contractStageFor:org=>contractStageFor(org),restorePendingChoice:(state,expected)=>restorePendingChoice(state,expected)});

  function startJapanese(){careerEntry.startNew();}
  const careerEntry=new CareerEntry({getState:()=>S,setState:state=>{S=state;},getSeed:()=>SEED,setSeed:seed=>{SEED=seed;},careerSession,CareerSession,POSN,$:id=>$(id),getNavigation:()=>navigation,normalizeSeed:raw=>normalizeSeed(raw),generateSeed:()=>generateSeed(),normalizePlayerName:(raw,seed,pos)=>normalizePlayerName(raw,seed,pos),seedInit:str=>seedInit(str),newState:(name,pos)=>newState(name,pos),escapeHTML:v=>escapeHTML(v),card:(...args)=>card(...args),actClear:()=>actClear(),startYear:()=>startYear()});
  const appVersion=$('app-version');if(appVersion)appVersion.textContent='v'+VERSION;
  createSeedShareController({trigger:$('board-share'),getSeed:()=>S?.seed||$('seed-show').value||SEED});
  const salaryDetailController=createSalaryDetailController({trigger:$('salary-detail-trigger'),panel:$('salary-detail-panel'),closeButton:$('salary-detail-close'),title:$('salary-detail-title'),body:$('salary-detail-body'),getDecision:()=>S?.lastSalaryDecision||null,getCurrentSalary:()=>S?.currentSalary||0,getContract:()=>S?.ct||null,getIncome:()=>({signing:S?.careerSigningBonus||0,stipend:S?.careerDevelopmentStipend||0,base:S?.careerBaseSalary||0,incentive:S?.careerIncentive||0,buyout:S?.careerBuyout||0,outside:S?.careerOutsideIncome||0,yearOutside:S?.yearOutsideIncome||0,total:S?.careerEarnings||0,corp:S?.corpIncome||0}),isProfessional:()=>S?.stage==='PRO'||S?.stage==='IND',fmtMoney});
  const navigation=initNavigation({onNavigate:archiveTraitResults,onOpenPlayer:buildPlayerViewModel,onOpenCareer:buildCareerViewModel});
  let startPromptPending=false;
  $('btn-start').onclick=()=>{
    if(startPromptPending)return;
    if(browserSave?.state.phase==='unavailable'){
      const state=browserSave.state;startPromptPending=true;
      confirmAction({title:'セーブせずに始める',message:'セーブデータを確認できません。今回の進行状況は保存されません。セーブせずに始めますか？'})
        .then(ok=>{if(ok&&browserSave.state===state&&state.phase==='unavailable'&&browserSave.newCareer({allowUnsaved:true}))startJapanese();})
        .finally(()=>{startPromptPending=false;});
    }else if(!browserSave||browserSave.newCareer())startJapanese();
  };
  $('seed-re').onclick=e=>{e.preventDefault();const s=generateSeed();$('seed-show').value=s;SEED=s;};
  $('seed-show').value=normalizeSeed(new URLSearchParams(location.search).get('seed'))||generateSeed();
  $('btn-restart').onclick=()=>{confirmAction({title:'タイトルに戻る',message:'タイトルに戻りますか？セーブデータは残ります。未保存の操作は、もう一度プレイする必要があります。'}).then(ok=>{if(ok)location.href=location.pathname;});};

// Bootstrap completes storage inspection before enabling new-career controls.
export async function initializeBrowserSave(){
 if(browserSave)return;
 const home=async()=>{if(S&&!await confirmAction({title:'タイトルに戻る',message:'このタブの未保存の操作を破棄して、タイトルに戻りますか？セーブデータは残ります。'}))return;location.href=location.pathname+location.search;};
 let newPromptPending=false;
 const fresh=async()=>{
  if(newPromptPending||S||browserSave.state.phase!=='ready'||!browserSave.state.slot)return false;
  const state=browserSave.state,revision=state.revision;newPromptPending=true;
  try{
   if(!await confirmAction({title:'新しく始める',message:'現在の進行状況を破棄して、新しく始めますか？\nOKを選ぶと、現在のセーブデータを削除します。'}))return false;
   if(browserSave.state!==state||state.phase!=='ready'||state.revision!==revision)return false;
   return await browserSave.remove({confirmed:true});
  }finally{newPromptPending=false;}
 };
 const show=createBrowserSaveUI({onContinue:()=>browserSave.restore(),onNew:fresh,onRetry:()=>browserSave.state.phase==='delete-error'?browserSave.initialize():browserSave.restore(),onHome:home});
 browserSave=new BrowserSaveController({notify:show,lock:locked=>{$('app').inert=locked;if(locked){++careerSession.choiceGeneration;careerSession.activeChoiceToken=null;}},restore:(envelope,{authorization}={})=>{
  const candidate=hydrateSavedState(envelope,{DATA,teamRec,teamDisplay,traitPresentation,authorization});
  careerEntry.resume(candidate);
 }});
 show(browserSave.state);await browserSave.initialize();
}

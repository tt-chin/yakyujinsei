// Contract, salary decision and salary evaluation rules (OOP plan §2z).
// The career state is read through getState; default parameters read it directly because a body const is out of their scope.
// LV, PATHS and careerSession are passed by reference. fixedContract, salaryCandidate and salaryFor are implemented here as
// *Rule, while their bare names stay injected late-binding lambdas: E2E hooks rebind the game.js names, so calls inside this
// module must keep going through game.js to reach them. applyKboForeignPackageCap is injected for the same reason.
import { annualStateTransaction, prepareAwardReceipt, commitAwardReceipt } from './award-transaction-policy.js';
import { MARKET_BASELINES } from '../data/salary-market-data.js';
import { calculateSalaryCurve, convertRatingBetweenLevels, roundToTenThousandYen, salaryEvaluationD } from './salary-promotion-policy.js';
import { appendSalaryEvaluation, buildIndependentLeagueFallbackEntry, buildSalaryEvaluationEntry, calculateMarketRating, hasActualPerformanceData } from './salary-evaluation-policy.js';
import { appendSalaryDecision, buildSalaryDecision, salaryReasonLabel } from './salary-explanation-policy.js';
import { appendExtension, applyLevelMinimumToUnpaidSchedule, contractNeedsRenewal, createContract, normalizeContract, transferContract } from './contract-policy.js';
import { calculateControlOffer, getContractStage, migrateServiceTime } from './control-period-policy.js';
import { injurySalaryMultiplier, isRecentStar } from './injury-market-policy.js';
import { calculateArbitrationTerms } from './arbitration-policy.js';
import { createIncentiveTerms } from './incentive-policy.js';
import { createSigningBonusTerms, calculatePostingFee, applySigningPayment } from './signing-bonus-policy.js';
import { effectiveMarketOrg, marketTier, foreignProSeasons, getCrossLeaguePolicy, applyCrossLeagueSalary } from './cross-league-market-policy.js';

export class CareerContract {
  #rules;
  constructor(deps){this.#rules=careerContractRules(deps);}
  extensionOffer(o){return this.#rules.extensionOffer(o);}
  ageGateJP(){return this.#rules.ageGateJP();}
  salaryFor(lv,d){return this.#rules.salaryFor(lv,d);}
  migrateSalaryV130State(){return this.#rules.migrateSalaryV130State();}
  migrateSalaryV140State(){return this.#rules.migrateSalaryV140State();}
  serviceYearsFor(org){return this.#rules.serviceYearsFor(org);}
  contractStageFor(org){return this.#rules.contractStageFor(org);}
  currentMarketRating(){return this.#rules.currentMarketRating();}
  kboPreviousPackage(){return this.#rules.kboPreviousPackage();}
  salaryCandidate(input){return this.#rules.salaryCandidate(input);}
  saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options){return this.#rules.saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options);}
  salaryDecisionLink(){return this.#rules.salaryDecisionLink();}
  bindLatestSalaryDetailLink(){return this.#rules.bindLatestSalaryDetailLink();}
  finalizePendingOffseasonSalary(){return this.#rules.finalizePendingOffseasonSalary();}
  applyPromotionSalary(fromLv,toLv){return this.#rules.applyPromotionSalary(fromLv,toLv);}
  applyDemotionSalary(fromLv,toLv){return this.#rules.applyDemotionSalary(fromLv,toLv);}
  markClubInitiatedRenewal(years){return this.#rules.markClubInitiatedRenewal(years);}
  appendContractExtension(years,mult){return this.#rules.appendContractExtension(years,mult);}
  recordSalaryEvaluation(st){return this.#rules.recordSalaryEvaluation(st);}
  recordIndependentSalaryEvaluation(results){return this.#rules.recordIndependentSalaryEvaluation(results);}
  fixedContract(input){return this.#rules.fixedContract(input);}
  signTo(org,lv,teamId,yrs,mult,decisionType,options){return this.#rules.signTo(org,lv,teamId,yrs,mult,decisionType,options);}
  doTradeExec(){return this.#rules.doTradeExec();}
  stageLabel(){return this.#rules.stageLabel();}
  renewAndAdvance(mult,allowDecrease,contractType){return this.#rules.renewAndAdvance(mult,allowDecrease,contractType);}
  arbitrationFlow(){return this.#rules.arbitrationFlow();}
}

function careerContractRules({getState,LV,PATHS,careerSession,salaryDetailController,fixedContract,salaryCandidate,salaryFor,applyKboForeignPackageCap,clamp,dpMult,ovr,slgOf,fmtMoney,card,board,choose,escapeHTML,teamRec,listByOrg,pickRecord,reportFlowOutcome,crossOffers,rng:{chance}}){
  function faYears(d,cap){ /* FA契約年数は成績が安定し故障が少ないほど長くし、上限は野手15年・投手7年。 */
    const S=getState();
    const perf=Math.max(0,Math.min(1,(d+2)/8)); /* d=-2→0、 d=6→1 */
    const injPenalty=(S.bigInj||0)*0.12+(S.tjCount||0)*0.15;
    let yrs=Math.round(2+perf*(cap-2)-injPenalty*cap);
    /* 球団は引退年齢と衰えを考慮し、ベテランへ長期契約を提示しない。 */
    let ageCap=cap;
    if(S.age>=36)ageCap=2; else if(S.age>=34)ageCap=3; else if(S.age>=32)ageCap=5; else if(S.age>=30)ageCap=8;
    yrs=Math.min(yrs,ageCap);
    return Math.max(1,Math.min(cap,yrs));
  }
  function termParams(d,lv){ /* 長期契約 >2 年、短期契約 1-2 年;年齢大または成績爛 → 不十分格長期契約。 */
    const S=getState();
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
    const S=getState();
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
    const S=getState();
    const d=S.lastD||0;
    termChoice(o,d,`所属球団からの契約延長オファー・${S.teamName()}（契約残り1年）`,(y,m)=>{
      const S=getState();
      appendContractExtension(y,m);
      card('gold','契約延長',`<b class="hl">${S.teamName()}</b>と延長に合意し、契約を<b class="hl">${y}年</b>追加した（年俸係数×${m.toFixed(2)}）。`); board(1);
      crossOffers(o);
    }, ()=>{ /* 拒決して延長：維持原契約繼継続跑。 */
      card('info','延長を断る',`所属球団からの早期延長を断り、現在の契約を継続することにした。`);
      crossOffers(o);
    });
  }
  function ageGateJP(){ /* NPB挑戦：年齢条件は緩め、31 歳（衰え前）まで可能性あり。 */
    const S=getState();
    const age=S.age;
    if(age<=26)return 1.0;
    if(age<=28)return 0.7;
    if(age<=30)return 0.45;
    if(age<=31)return 0.25;
    return 0; /* 32 歳からは対象外。 */
  }

  function salaryForRule(lv,d){
    const m={CORP:[4200000,0,0,4200000,9000000],IND:[2400000,100000,0,1800000,5000000],NPB_DEV:[3000000,0,0,3000000,5000000],NPB2:[5000000,300000,0,5000000,16000000],NPB1:[16000000,4000000,3000000,16000000,600000000],KBO2:[8000000,400000,0,8000000,30000000],KBO1:[40000000,8000000,2000000,40000000,1500000000],CPBL2:[4000000,200000,0,4000000,12000000],CPBL1:[12000000,3000000,800000,12000000,400000000],R:[3000000,0,0,3000000,3000000],A1:[4000000,0,0,4000000,4000000],A2:[6000000,0,0,6000000,6000000],A3:[10000000,500000,0,10000000,30000000],MLB:[120000000,30000000,12000000,120000000,6000000000]}[lv];
    if(!m)throw new Error('UNKNOWN_SALARY_LEVEL:'+lv);if(lv==='CORP')return Math.round(clamp(4200000+(ovr()-40)*150000,4200000,9000000)/10000)*10000;
    return roundToTenThousandYen(calculateSalaryCurve(d,{base:m[0],linear:m[1],quadratic:m[2],min:m[3],max:m[4]}));
  }

  function migrateSalaryV130State(){
    const S=getState();
    if(S._salaryV130Migrated)return;
    S.serviceTime=migrateServiceTime(S);S.marketInjury=S.marketInjury||'HEALTHY';S.lastArbitration=S.lastArbitration||null;S.serviceTimeAccruedYear=S.serviceTimeAccruedYear??null;S._salaryV130Migrated=true;
  }
  function migrateSalaryV140State(){
    const S=getState();
    migrateSalaryV130State();
    S.careerBaseSalary=Number(S.careerBaseSalary)||0;S.careerIncentive=Number(S.careerIncentive)||0;S.yearlyIncentivePaid=S.yearlyIncentivePaid&&typeof S.yearlyIncentivePaid==='object'?S.yearlyIncentivePaid:{};S.lastFaMarket=S.lastFaMarket||null;
    if(S.ct&&S.ct.schemaVersion!==3){S.ct=normalizeContract(S.ct,{currentYear:S.year,currentSalary:S.currentSalary,org:S.org,teamId:S.orgTeamId});S.currentSalary=S.ct.annualSalary;}
    S._salaryV140Migrated=true;
  }
  const serviceYearsFor=org=>{const S=getState();return Number(S.serviceTime?.[org])||0;}
  const contractStageFor=org=>{const S=getState();return getContractStage({org,serviceYears:serviceYearsFor(org),faEligible:org==='NPB'?serviceYearsFor('NPB')>=8:Boolean(S.faElig)});}
  const currentMarketResult=()=>{
    const S=getState();
    const result=calculateMarketRating(S.salaryEvaluationHistory||[],{marketInjury:S.marketInjury||'HEALTHY'});
    return result.components.length?{...result,source:'SALARY_EVALUATION_HISTORY'}:{marketRating:Number(S.lastD)||0,components:[],source:'LEGACY_RATING_FALLBACK'};
  };
  const currentMarketRating=()=>currentMarketResult().marketRating;
  const previousSalaryForOffer=()=>{const S=getState();return S.currentSalary||S.transferSalarySnapshot?.annualSalary||S.ct?.annualSchedule?.at(-1)?.amount||S.lastSalaryDecision?.finalSalary||0;}
  const hadAmericanContract=()=>{const S=getState();return Boolean(S.americanContractSigned||S.stats?.MLB?.yr||S.stats?.MINOR?.yr);}
  const kboPreviousPackage=()=>{const S=getState();const c=S.ct||S.transferSalarySnapshot?.contract;return c?.org==='KBO'?(c.annualSchedule?.at(-1)?.amount||c.annualSalary||0)+(c.incentive?.annualMax||0)+(c.signingBonus||0)+(c.postingFee||0):S.org==='KBO'?(S.lastKboPackage||roundToTenThousandYen((S.currentSalary||0)*1.07)):0;};
  const salaryCandidateRule=({sourceLevel=getState().lv,targetLevel=getState().lv,rating=currentMarketRating(),contractMult=1,positionMult=dpMult(),marketSalary,transferType='TRANSFER',previousSalary=previousSalaryForOffer()}={})=>{
    const S=getState();
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
  function saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,{decreaseProtectionApplied=false,floorApplied=false,salaryYear=getState().year+1}={}){
    const S=getState();
    const market=currentMarketResult(),history=S.salaryEvaluationHistory||[];
    const marketComponents=market.components.map(item=>({...item,weight:item.normalizedWeight,source:history.find(entry=>entry.year===item.year)?.source||null}));
    const baseDecision=buildSalaryDecision({decisionYear:S.year,salaryYear,decisionType,sourceLevel:candidate.sourceLevel,targetLevel:candidate.targetLevel,previousSalary,finalSalary,sourceMarketRating:candidate.sourceRating,convertedMarketRating:candidate.convertedRating,baseSalary:candidate.baseSalary,contractMultiplier:candidate.contractMult,positionMultiplier:candidate.positionMult,floorApplied,decreaseProtectionApplied,marketComponents,currentEvaluation:S.lastSalaryEvaluation}),marketInjury=S.marketInjury||'HEALTHY';
    const decision=Object.freeze({...baseDecision,crossLeague:candidate.crossLeague?{...candidate.crossLeague,...(S.ct?.offerBreakdown?.packageCap?{packageCap:S.ct.offerBreakdown.packageCap,finalAnnualSalary:finalSalary}:{}),annualSalary:finalSalary}:S.ct?.offerBreakdown?.crossLeague??null,reasonCodes:[...new Set([...baseDecision.reasonCodes,...(candidate.crossLeague?.reasonCodes||[]),...(S.ct?.offerBreakdown?.capApplied?['LEAGUE_REGULATORY_CAP']:[])])],decreaseProtectionRate:S.org==='NPB'&&previousSalary>100_000_000?.60:.75,org:S.org,contractStage:contractStageFor(S.org),marketInjury,injuryMultiplier:injurySalaryMultiplier(marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),serviceYears:serviceYearsFor(S.org),arbitration:S.lastArbitration?.year===S.year?S.lastArbitration:null});
    S.lastSalaryDecision=decision;S.salaryDecisionHistory=appendSalaryDecision(S.salaryDecisionHistory||[],decision);return decision;
  }
  const salaryDecisionLink=()=>'<button type="button" class="salary-detail-link">内訳を見る</button>';
  const salaryDecisionSummary=()=>{const S=getState();const d=S.lastSalaryDecision;if(!d)return'';const change=d.changeRate===null?'新規契約':`${d.changeAmount>=0?'+':'−'}${fmtMoney(Math.abs(d.changeAmount))}／${d.changeRate>=0?'+':'−'}${Math.abs(d.changeRate*100).toFixed(1)}%`;return`<br><small>前年比 ${change}</small><br><small>主な理由：${d.reasonCodes.slice(0,3).map(salaryReasonLabel).join('、')}</small>`;};
  function bindLatestSalaryDetailLink(){const links=document.querySelectorAll('.salary-detail-link'),link=links[links.length-1];if(link)link.onclick=()=>salaryDetailController.open();}
  const salaryDForContract=d=>{const S=getState();return (S.salaryEvaluationHistory||[]).length?currentMarketRating():Number(d)||0;}
  function finalizePendingOffseasonSalary(){
    const S=getState();
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
    const S=getState();
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
  const applyPromotionSalary=function(fromLv,toLv){applyLevelSalary(fromLv,toLv,true);};
  const applyDemotionSalary=function(fromLv,toLv){const S=getState();const renewalRequired=contractNeedsRenewal(S.ct);applyLevelSalary(fromLv,toLv,false);if(renewalRequired)markClubInitiatedRenewal(1);};
  const markClubInitiatedRenewal=function(years){
    careerSession.pendingOffseasonSalary={preventDecrease:true,years:1,mult:1,contractType:'CONTROL'};
  };
  const appendContractExtension=function(years,mult){const S=getState();const candidate=salaryCandidate({contractMult:mult}),oldEnd=S.ct.endYear,oldGuaranteed=S.ct.guaranteedTotal,incentive=createIncentiveTerms({org:S.org,annualSalary:candidate.annualSalary});S.ct=appendExtension(S.ct,{signedYear:S.year,startYear:S.year+1,years,annualSalary:candidate.annualSalary,contractType:'EXTENSION',incentive});saveSalaryDecision('NEW_CONTRACT',candidate,S.currentSalary,candidate.annualSalary,{salaryYear:oldEnd+1});card('gold','延長契約の内訳',`現契約：${S.ct.startYear}～${oldEnd}年　年俸${fmtMoney(S.currentSalary)}<br>延長契約：${oldEnd+1}～${S.ct.endYear}年　年俸${fmtMoney(candidate.annualSalary)}<br>延長分総額：${fmtMoney(S.ct.guaranteedTotal-oldGuaranteed)}<br>合計保証年俸総額：${fmtMoney(S.ct.guaranteedTotal)} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();};
  function saveSalaryEvaluation(entry){
    const S=getState();
    entry.marketInjury=S.marketInjury||'HEALTHY';
    const tx=annualStateTransaction(S);
    prepareAwardReceipt(tx,'salary-evaluation',[{path:['salaryEvaluationHistory'],after:appendSalaryEvaluation(S.salaryEvaluationHistory||[],entry)},{path:['lastSalaryEvaluation'],after:entry}]);
    commitAwardReceipt(tx,'salary-evaluation');
  }
  const recordSalaryEvaluation=function(st){
    const S=getState();
    const common={year:S.year,age:S.age,level:S.lv,org:S.org,role:S.role,position:S.dpos,playerType:S.pos,baseD:st.baseD,stats:st,gamesInLevel:LV[S.lv]?.g,baseline:MARKET_BASELINES[S.lv],honors:S.honors,awardState:S};
    if(hasActualPerformanceData(S.pos,st)){
      const stats=S.pos==='P'?st:{...st,SLG:slgOf(st)};
      saveSalaryEvaluation(buildSalaryEvaluationEntry({...common,stats}));
      return;
    }
    const payD=salaryEvaluationD(Number.isFinite(st.baseD)?st.baseD:(S.lastD||0),S.honors,S.year,S);
    saveSalaryEvaluation({schemaVersion:1,year:S.year,age:S.age,level:S.lv,org:S.org,role:S.role||null,position:S.dpos||null,baseD:payD,performanceAdjustment:0,workloadAdjustment:0,awardAdjustment:0,payD,sampleStatus:'INSUFFICIENT',reasons:['LEGACY_RATING_FALLBACK'],source:'LEGACY_RATING_FALLBACK',actualPerformanceAvailable:false,workloadAvailable:false,fallbackReason:'PERFORMANCE_DATA_NOT_AVAILABLE'});
  };
  const recordIndependentSalaryEvaluation=function(results){
    const S=getState();
    /* 独立リーグでは正式な個人成績を生成していないため、大会結果を個人成績に見立てず既存評価だけを使う。 */
    const entry=buildIndependentLeagueFallbackEntry({year:S.year,age:S.age,level:S.lv,baseD:undefined,legacyRating:salaryEvaluationD(S.lastD||0,S.honors,S.year),tournamentResults:results});
    saveSalaryEvaluation(entry);
  };

  function fixedContractRule({org,teamId,years,annualSalary,contractType='NORMAL',signingBonus=0,signingBonusType='NONE',developmentStipend=0,postingFee=0,postingFeeRecipient=null,candidate,startYear=getState().year+1,incentive,offerBreakdown,transaction}){const S=getState();let breakdown=offerBreakdown??candidate?.crossLeague??null;if(org==='KBO'){const cap=applyKboForeignPackageCap({annualSalary,signingBonus,postingFee,isRenewal:candidate?.sourceOrg==='KBO'||S.ct?.org==='KBO',previousPackage:kboPreviousPackage(),levelMinimum:salaryFor(candidate?.targetLevel||S.lv,0)});annualSalary=cap.annualSalary;breakdown={...breakdown,...cap,finalAnnualSalary:annualSalary};if(incentive)incentive=createIncentiveTerms({org,annualSalary});}const sequence=(Number(S.contractSequence)||0)+1,contractId=`${org}:${teamId}:${S.year}:${String(sequence).padStart(3,'0')}`;const contract=createContract({contractId,org,teamId,signedYear:S.year,startYear,years,annualSalary,contractType,signingBonus,signingBonusType,developmentStipend,postingFee,postingFeeRecipient,signedMarketRating:candidate?.convertedRating??currentMarketRating(),positionMultiplierAtSigning:candidate?.positionMult??dpMult(),contractMultiplier:candidate?.contractMult??1,incentive:incentive===undefined?createIncentiveTerms({org,annualSalary}):incentive,offerBreakdown:breakdown});S.contractSequence=sequence;if(org==='KBO')S.lastKboPackage=annualSalary+(contract.incentive?.annualMax||0)+signingBonus+postingFee;if(transaction)transaction.contract=contract;return contract;}

  let signingRenderRetry=null;
  // Prepare before affiliation commit; a failed display retries only that completed transaction.
  function signTo(org,lv,teamId,yrs,mult,decisionType,options={}){ const S=getState();if(signingRenderRetry?.state===S&&signingRenderRetry.year===S.year&&signingRenderRetry.action===careerSession.currentChoiceAction&&signingRenderRetry.contractId===S.ct?.contractId&&(careerSession.currentChoiceAction!==null||signingRenderRetry.request===JSON.stringify([org,lv,teamId,yrs,mult,decisionType]))){signingRenderRetry.render();signingRenderRetry=null;return;}const request=JSON.stringify([org,lv,teamId,yrs,mult,decisionType]);const rec=teamId?teamRec(teamId):pickRecord(listByOrg(org));if(!rec)throw new Error('INVALID_TEAM_MASTER');const sourceLevel=S.lv,sourceStage=S.stage,sourceOrg=S.org,previousSalary=options.candidate?.previousSalary??previousSalaryForOffer(),changed=rec.teamId!==S.orgTeamId,contractYears=yrs||2,contractMult=mult||1;const candidate=options.candidate||salaryCandidate({sourceLevel:LV[sourceLevel]?sourceLevel:lv,targetLevel:lv,rating:sourceStage==='PRO'?currentMarketRating():0,contractMult,transferType:decisionType||'TRANSFER'});lv=candidate.targetLevel;const annualSalary=options.annualSalary??candidate.annualSalary,contractType=candidate.crossLeague?.eligibilityType==='MLB_INTL_RESTRICTED'?'ROOKIE':options.contractType||'NORMAL',startYear=options.startYear??S.year+1,terms=options.signingTerms||candidate.signingTerms,bonus=options.signingBonus??terms?.signingBonus??0,postingFee=calculatePostingFee({guaranteedTotal:annualSalary*contractYears,signingBonus:bonus,major:lv==='MLB',eligible:candidate.postingEligible});const transaction=options.transaction?.state===S&&options.transaction.year===S.year?options.transaction:null;const contract=transaction?.contract||fixedContract({org,teamId:rec.teamId,years:contractYears,annualSalary,contractType,signingBonus:bonus,signingBonusType:terms?.signingBonusType||'NONE',developmentStipend:terms?.developmentStipend||0,postingFee,postingFeeRecipient:postingFee>0?candidate.sourceTeamId:null,candidate,startYear,incentive:options.incentive,offerBreakdown:options.offerBreakdown,transaction});S.org=org;S.lv=lv;S.stage='PRO';S.stageYr=0;S.team='';S.orgTeamId=rec.teamId;if(changed){S.teamYears=0;S.champThisTeam=false;S.champTeam=null;}S.ct=contract;applySigningPayment(S,S.ct);if(['MLB','MiLB'].includes(candidate.targetOrg))S.americanContractSigned=true;S.currentSalary=S.ct.annualSalary;careerSession.pendingOffseasonSalary=null;const inferred=decisionType||(sourceStage!=='PRO'?'NEW_CONTRACT':sourceOrg==='NPB'&&org!=='NPB'?'OVERSEAS':sourceOrg!=='NPB'&&org==='NPB'?'RETURN':'NEW_CONTRACT');saveSalaryDecision(inferred,candidate,previousSalary,S.currentSalary);const render=()=>{const S=getState();card('info','契約',`<b class="hl">${escapeHTML(rec.name)}</b>と${S.ct.years}年契約を結んだ（年俸 ${fmtMoney(S.currentSalary)}）。${bonus>0?'契約金'+fmtMoney(bonus)+'。':''}${S.ct.developmentStipend>0?'育成支度金'+fmtMoney(S.ct.developmentStipend)+'。':''}${postingFee>0?'ポスティング譲渡金 '+fmtMoney(postingFee)+'（球団への支払い・生涯収入対象外）。':''}${salaryDecisionSummary()} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();board(2);};signingRenderRetry={state:S,year:S.year,action:careerSession.currentChoiceAction,contractId:S.ct.contractId,request,render};render();signingRenderRetry=null; }

  /* トレードは同一組織の固定球団ID間だけで行い、移籍先を必ず通知する。 */
  function doTradeExec(){
    const S=getState();
    const from=teamRec(S.orgTeamId),candidates=listByOrg(S.org).filter(t=>t.teamId!==S.orgTeamId);
    if(!from||!candidates.length){card('info','トレード見送り','移籍可能な球団がないため、トレードは成立しなかった。');return null;}
    const to=pickRecord(candidates);S.teamYears=0;S.champThisTeam=false;S.champTeam=null;S.orgTeamId=to.teamId;
    if(S.ct)S.ct=transferContract(S.ct,{org:S.org,teamId:to.teamId});
    S.lastTrade={year:S.year,fromTeamId:from.teamId,toTeamId:to.teamId};
    card('info','トレード成立',`<b class="hl">${escapeHTML(from.name)}</b>から<b class="hl">${escapeHTML(to.name)}</b>へ移籍した。`);board(1);
    return S.lastTrade;
  }

  function stageLabel(){const S=getState();if(S.stage==='HS')return '高校'+S.stageYr+'年';if(S.stage==='U')return '大学'+S.stageYr+'年';if(S.stage==='CORP')return '社会人'+(S.corpYears+1)+'年目';if(S.stage==='IND')return '独立リーグ'+(S.indYears+1)+'年目';return LV[S.lv]?.n||S.stage;}

  function renewAndAdvance(mult=1,allowDecrease=false,contractType='NORMAL'){const S=getState();const base=salaryCandidate({contractMult:mult}),previousSalary=S.currentSalary,injuryMult=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),candidate={...base,contractMult:base.contractMult*injuryMult,annualSalary:roundToTenThousandYen(base.annualSalary*injuryMult)},control=calculateControlOffer({marketSalary:candidate.annualSalary,previousSalary,marketRating:currentMarketRating(),serviceYears:serviceYearsFor(S.org),org:S.org,levelMinimum:salaryFor(S.lv,0)}),annualSalary=roundToTenThousandYen(contractType==='CONTROL'?control.protectedSalary:Math.max(candidate.annualSalary,!allowDecrease?previousSalary:0));S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary,contractType,candidate,startYear:S.year+1});S.currentSalary=S.ct.annualSalary;careerSession.pendingOffseasonSalary=null;saveSalaryDecision('RENEWAL',candidate,previousSalary,S.currentSalary,{decreaseProtectionApplied:S.currentSalary>candidate.annualSalary,floorApplied:contractType==='CONTROL'&&control.floorApplied});card('info','契約更改',`年俸${fmtMoney(S.currentSalary)}で契約を更新した。${salaryDecisionSummary()} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();reportFlowOutcome({kind:'CONTRACT_RENEWED'});}
  function arbitrationFlow(){
    const S=getState();
    const base=salaryCandidate(),injuryMult=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),terms=calculateArbitrationTerms({marketSalary:roundToTenThousandYen(base.annualSalary*injuryMult),previousSalary:S.currentSalary,marketRating:currentMarketRating(),serviceYears:serviceYearsFor('MLB'),levelMinimum:salaryFor('MLB',0)});
    const complete=(result,finalSalary)=>{const S=getState();S.lastArbitration={year:S.year,result,clubSalary:roundToTenThousandYen(terms.clubSalary),playerSalary:roundToTenThousandYen(terms.playerSalary),finalSalary:roundToTenThousandYen(finalSalary),winChance:terms.winChance};const candidate={...base,contractMult:base.contractMult*injuryMult,annualSalary:S.lastArbitration.finalSalary},floorApplied=result==='SETTLED'?terms.middleFloorApplied:result==='WON'?terms.playerFloorApplied:terms.clubFloorApplied;S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary:S.lastArbitration.finalSalary,contractType:'ARBITRATION',candidate,startYear:S.year+1});S.currentSalary=S.ct.annualSalary;saveSalaryDecision('RENEWAL',candidate,terms.previousSalary,S.currentSalary,{decreaseProtectionApplied:S.currentSalary>terms.marketSalary,floorApplied});card('gold','MLB年俸調停',`球団提示：${fmtMoney(terms.clubSalary)}<br>選手側：${fmtMoney(terms.playerSalary)}<br>中間案：${fmtMoney(terms.middleSalary)}<br>勝訴確率：${Math.round(terms.winChance)}%<br>決定年俸：<b class="hl">${fmtMoney(S.currentSalary)}</b> ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();reportFlowOutcome({kind:'ARBITRATION_SETTLED'});};
    choose(`MLB年俸調停対象（在籍${serviceYearsFor('MLB')}年）`,[{t:`球団提示を受け入れる（${fmtMoney(terms.clubSalary)}）`,main:true,f:()=>complete('ACCEPTED',terms.clubSalary)},{t:`中間案で合意を試みる（${fmtMoney(terms.middleSalary)}）`,f:()=>complete('SETTLED',terms.middleSalary)},{t:`年俸調停を申請する（選手側 ${fmtMoney(terms.playerSalary)}／勝訴確率 ${Math.round(terms.winChance)}%）`,warn:true,f:()=>{const won=chance(terms.winChance);complete(won?'WON':'LOST',won?terms.playerSalary:terms.clubSalary);}}]);
  }
  return {extensionOffer,ageGateJP,salaryFor:salaryForRule,migrateSalaryV130State,migrateSalaryV140State,serviceYearsFor,contractStageFor,currentMarketRating,kboPreviousPackage,salaryCandidate:salaryCandidateRule,saveSalaryDecision,salaryDecisionLink,bindLatestSalaryDetailLink,finalizePendingOffseasonSalary,applyPromotionSalary,applyDemotionSalary,markClubInitiatedRenewal,appendContractExtension,recordSalaryEvaluation,recordIndependentSalaryEvaluation,fixedContract:fixedContractRule,signTo,doTradeExec,stageLabel,renewAndAdvance,arbitrationFlow};
}

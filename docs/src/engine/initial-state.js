import { VERSION } from '../config.js';
import { highSchoolTier, installBirthHighSchool } from './school-policy.js';
import { TRAIT_LABELS } from './trait-policy.js';
import { ensureEventState } from './event-state-policy.js';

export function createInitialState(name,pos,{getState,getSeed,R,ri,pickRecord,DATA,POS_AB,teamRec,teamDisplay,traitPresentation}){
  const S=getState(),SEED=getSeed();
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

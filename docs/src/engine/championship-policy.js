// Team championship only: no salary, individual awards, DOM or implicit RNG.
const RULES = Object.freeze({
  NPB1:{league:'NPB',title:'日本一',base:8,min:2,max:15},
  MLB:{league:'MLB',title:'ワールドシリーズチャンピオン',base:3.5,min:2,max:9},
  CPBL1:{league:'CPBL',title:'台湾シリーズ優勝',base:15,min:2,max:26},
  KBO1:{league:'KBO',title:'韓国シリーズ優勝',base:10,min:2,max:20},
});
const count = v => Number.isFinite(v) ? Math.max(0,Math.floor(v)) : 0;
const dictionary = v => v && typeof v==='object' && !Array.isArray(v) ? v : {};
const leagueOf = org => org==='MiLB' ? 'MLB' : org;

export function normalizeChampionshipState(s,teamById){
  s.championshipResults=dictionary(s.championshipResults);
  if(s.seasonChampContext===undefined)s.seasonChampContext=null;
  if(s.seasonEndMaintenanceYear===undefined)s.seasonEndMaintenanceYear=null;
  if(s.championshipMigrationVersion===1)return;
  if(!teamById(s.champTeam)){s.champTeam=null;s.champThisTeam=false;}
  const paid=s.lastSalaryPaidYear===s.year || s.ct?.annualSchedule?.some(row=>row.year===s.year&&row.paid===true);
  if(paid&&!s.championshipResults[s.year]){
    const rule=Object.values(RULES).find(r=>(s.honors||[]).includes(`${s.year} ${r.title}`));
    s.championshipResults[s.year]={year:s.year,league:rule?.league||null,level:null,teamId:null,eligible:false,chancePercent:0,won:Boolean(rule),title:rule?.title||null,honorText:rule?`${s.year} ${rule.title}`:null,reason:'MIGRATED_ALREADY_SETTLED'};
    s.wonChamp=Boolean(rule);
    // Do not retroactively age the old year's transfer penalties either.
    s.seasonEndMaintenanceYear=s.year;
  }
  if(!paid&&!s.seasonChampContext){
    const row=(s.log||[]).findLast(row=>row.y===s.year&&row.teamId&&row.level&&row.org&&Number.isFinite(row.seasonFactor)&&Number.isFinite(row.ratingD)&&typeof row.clutch==='boolean'&&Number.isFinite(row.tradeRefuse));
    if(row)s.seasonChampContext={year:s.year,stage:'PRO',level:row.level,org:row.org,teamId:row.teamId,seasonFactor:row.seasonFactor,ratingD:row.ratingD,clutch:row.clutch,tradeRefuse:count(row.tradeRefuse)};
  }
  s.championshipMigrationVersion=1;
}

export function captureSeasonChampionship(s){
  if(s.seasonChampContext?.year===s.year)return s.seasonChampContext;
  s.seasonChampContext={year:s.year,stage:s.stage,level:s.lv,org:s.org,teamId:s.orgTeamId,seasonFactor:s.seasonFactor,ratingD:Number.isFinite(s.lastD)?s.lastD:0,clutch:Boolean(s.traits?.clutch),tradeRefuse:count(s.tradeRefuse)};
  return s.seasonChampContext;
}

export function championshipEligibility(s,teamById){
  const c=s.seasonChampContext,rule=RULES[c?.level];
  if(!c||c.year!==s.year)return {eligible:false,reason:'MISSING_SEASON_CONTEXT'};
  if(c.stage!=='PRO'||!rule)return {eligible:false,reason:'INELIGIBLE_LEVEL'};
  if(!(c.seasonFactor>0))return {eligible:false,reason:'NO_APPEARANCE'};
  const team=teamById(c.teamId);
  if(leagueOf(c.org)!==rule.league||!team||team.org!==rule.league)return {eligible:false,reason:'INVALID_TEAM_OR_ORG'};
  const d=Number.isFinite(c.ratingD)?c.ratingD:0;
  const base=Math.max(rule.min,Math.min(rule.max,rule.base+d*.5));
  return {eligible:true,rule,chancePercent:Math.max(0,Math.min(100,base*(c.clutch?1.25:1)*(count(c.tradeRefuse)>0?.75:1)))};
}

export function settleChampionship(s,{teamById,random}){
  normalizeChampionshipState(s,teamById);
  if(s.championshipResults[s.year])return {result:s.championshipResults[s.year],created:false};
  const c=s.seasonChampContext,check=championshipEligibility(s,teamById);
  const won=check.eligible ? random()*100<check.chancePercent : false;
  const result={year:s.year,league:check.rule?.league||null,level:c?.year===s.year?c.level:null,teamId:c?.year===s.year?c.teamId:null,eligible:check.eligible,chancePercent:check.chancePercent||0,won,title:check.rule?.title||null,honorText:won?`${s.year} ${check.rule.title}`:null,...(!check.eligible?{reason:check.reason}:{})};
  s.championshipResults[s.year]=result;
  s.wonChamp=won;
  if(won){
    if(!s.honors.includes(result.honorText))s.honors.push(result.honorText);
    if(result.teamId===s.orgTeamId){s.champThisTeam=true;s.champTeam=result.teamId;}
  }
  return {result,created:true};
}

export function maintainSeasonEnd(s){
  if(s.seasonEndMaintenanceYear===s.year)return false;
  s.tradeRefuse=Math.max(0,count(s.tradeRefuse)-1);
  s.tradeHeat=Math.max(0,count(s.tradeHeat)-5);
  s.seasonEndMaintenanceYear=s.year;
  return true;
}

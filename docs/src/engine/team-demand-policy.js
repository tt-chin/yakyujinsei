const CATEGORIES=new Set(['SP','RP','C','IF','OF']);

export function playerMarketCategory({pos,role,dpos}){
  if(pos==='P')return role==='SP'?'SP':'RP';
  if(pos==='C'||dpos==='C')return'C';
  return pos==='OF'?'OF':'IF';
}

export function deterministicHash(input){let h=2166136261;for(const ch of new TextEncoder().encode(String(input))){h^=ch;h=Math.imul(h,16777619)>>>0;}return h>>>0;}
export function hashToUnit(seed,year,teamId,category){return deterministicHash(`${seed}\0${year}\0${teamId}\0${category}`)/4294967296;}
export function teamDemandScore({seed,year,teamId,category}){if(!CATEGORIES.has(category))throw new Error('INVALID_MARKET_CATEGORY');return deterministicHash(`${seed}\0${year}\0${teamId}\0${category}\0demand`)%5-2;}
export function teamDemandMultiplier(score){return 1+Math.max(-2,Math.min(2,Number(score)||0))*.025;}
export function teamDemandLabel(score){return({[-2]:'非常に低い',[-1]:'低い',[0]:'普通',[1]:'高い',[2]:'非常に高い'})[score]||'普通';}

export function rankTeamsByDemand({teams,seed,year,category}){
  const strength={S:2,A:1,B:0};
  return [...new Map((teams||[]).map(team=>[team.teamId,team])).values()].map(team=>{const demandScore=teamDemandScore({seed,year,teamId:team.teamId,category});return{team,demandScore,priority:demandScore*10+(strength[team.strength]??1)+hashToUnit(seed,year,team.teamId,category)};}).sort((a,b)=>b.priority-a.priority||a.team.teamId.localeCompare(b.team.teamId));
}

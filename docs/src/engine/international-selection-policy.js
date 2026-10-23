// Schedule and representative selection for international events (OOP plan §2i, 7-B).
// Pure rules: callers pass the official events and S fields explicitly; no DOM, S or RNG.
export function internationalEvents(year,officialEvents){const official=officialEvents.filter(e=>Number(e.startDate.slice(0,4))===year);if(official.length)return official;const out=[];if(year>2026&&(year-2026)%4===0)out.push({eventKey:'WBC:'+year,name:'ワールド・ベースボール・クラシック',startDate:year+'-03-05',endDate:year+'-03-17',status:'ESTIMATED',priority:1});if(year>2027&&(year-2027)%4===0)out.push({eventKey:'P12:'+year,name:'WBSCプレミア12',startDate:year+'-11-10',endDate:year+'-11-21',status:'ESTIMATED',priority:2});return out.sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.priority-b.priority);}
export const internationalPhase=e=>Number(e.startDate.slice(5,7))<=6?'PRE':'POST';
export const internationalThreshold=e=>e.eventKey.startsWith('WBC:')?58:55;
// 'DENIED': level or overall below the standard; 'INJURED': rehab/full-season rehab/reduced season (undefined fields count as healthy).
export function internationalSelection(e,{level,overall,rehab,skipMid,seasonFactor}){
  const wbc=e.eventKey.startsWith('WBC:');
  if(!(wbc?['NPB1','MLB','KBO1','CPBL1']:['NPB1','KBO1','CPBL1']).includes(level)||overall<internationalThreshold(e))return 'DENIED';
  return rehab>0||skipMid||seasonFactor<1?'INJURED':'ELIGIBLE';
}

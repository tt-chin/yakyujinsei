// PLY-01 jersey number rules (tasks/PLY_01_JERSEY_PLAN.md D1-D4, W3-W6, J1-J7).
// Pure rules: no RNG, no DOM. appendJerseyRecord is the only state write and only appends to state.jerseyHistory.
// Numbers are strings so that '0' and '00' stay distinct.
export const JERSEY_NUMBERS=Object.freeze(['0','00',...Array.from({length:99},(_,i)=>String(i+1))]);
export const JERSEY_DEFAULT_ORDER=Object.freeze({
  P:Object.freeze(['18','11','14','15','16','17','19','20','21','13']),
  C:Object.freeze(['27','2','22','10','12','32']),
  IF:Object.freeze(['6','5','7','4','3','8','1','9','0','00']),
  OF:Object.freeze(['1','8','9','51','7','23','24','31'])
});
// D2: no banned numbers until PLY-02 provides a source.
export const JERSEY_BANNED=Object.freeze([]);

export function isJerseyNumber(value){return typeof value==='string'&&JERSEY_NUMBERS.includes(value);}
export function defaultJerseyNumber(pos,banned=JERSEY_BANNED){
  const order=JERSEY_DEFAULT_ORDER[pos]||JERSEY_DEFAULT_ORDER.IF;
  return [...order,...JERSEY_NUMBERS].find(number=>!banned.includes(number))??null;
}
function history(state){return Array.isArray(state?.jerseyHistory)?state.jerseyHistory:[];}
export function lastJerseyRecord(state){const list=history(state);return list.length?list[list.length-1]:null;}
// W6: every professional level (NPB, KBO, CPBL, MiLB, MLB); IND and CORP have their own stage values.
export function isJerseyEligible(state){return state?.stage==='PRO'&&typeof state.orgTeamId==='string'&&state.orgTeamId!=='';}
// W8: the year-start step asks when the current pro team has no record yet. J3: a return to the team of the last record does not ask.
export function jerseyEntryPending(state){if(!isJerseyEligible(state))return false;const last=lastJerseyRecord(state);return !last||last.teamId!==state.orgTeamId;}
// J1: a number is shown only once the current team's record exists.
export function currentJerseyNumber(state){const last=lastJerseyRecord(state);return isJerseyEligible(state)&&last&&last.teamId===state.orgTeamId?last.number:null;}
export function canChangeJersey(state){return !state?.done&&currentJerseyNumber(state)!==null;}
// D1/D2: a transfer keeps the last number; the first entry uses the position default.
export function proposedJerseyNumber(state){const last=lastJerseyRecord(state);return last?last.number:defaultJerseyNumber(state?.pos);}
// D4: a save from before PLY-01 already has professional seasons but no record.
export function isLegacyJerseyEntry(state){return !lastJerseyRecord(state)&&(state?.log||[]).some(row=>row?.st);}
// D3: append only; the effective year is the current year.
export function appendJerseyRecord(state,number){
  if(!isJerseyEligible(state)||!isJerseyNumber(number))throw new Error('JERSEY_RECORD_INVALID');
  if(!Array.isArray(state.jerseyHistory))state.jerseyHistory=[];
  state.jerseyHistory.push({teamId:state.orgTeamId,year:state.year,number});
  return state.jerseyHistory[state.jerseyHistory.length-1];
}
// D3: the last record effective in or before the year (several in one year: the last one appended).
export function jerseyRecordForYear(list,year){let found=null;for(const record of Array.isArray(list)?list:[])if(record&&record.year<=year)found=record;return found;}
// J7: number label for a yearly row; only professional rows (with st) carry a number.
export function yearlyJerseyLabel(row,list){
  if(!row?.st)return '';
  const record=jerseyRecordForYear(list,row.y);
  return record?` #${record.number}`:'（背番号不明）';
}
// W2c/J3: consecutive professional log rows with the same record form one period; non-professional rows split periods.
export function jerseyPeriods(log,list,teamName){
  const periods=[];let previous=-2;
  (Array.isArray(log)?log:[]).forEach((row,index)=>{
    if(!row?.st)return;
    const record=jerseyRecordForYear(list,row.y),key=record?`R:${list.indexOf(record)}`:`U:${row.tm}`;
    const last=periods[periods.length-1];
    if(last&&last.key===key&&previous===index-1){last.to=row.y;}
    else periods.push({key,team:record?teamName(record.teamId):row.tm,from:row.y,to:row.y,number:record?record.number:null});
    previous=index;
  });
  return periods.map(({key,...period})=>Object.freeze(period));
}

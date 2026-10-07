import { effectiveCategory, eventOdds, eventTier, eventPlan, eventInjury, eventIncome, eventAddAbility, eventCounters, eventTraitUnlocks, eventEligible } from './event-policy.js';

const nonNegative = v => Number.isSafeInteger(v)&&v>=0?v:0;
export function ensureEventState(s) {
  s.eventSchemaVersion??=1;s.pendStat??=0;s.eventSequence=nonNegative(s.eventSequence);
  s.processedEventIDs??={};s.pendingEvent??=null;s.incomeLedger??=[];s.eventSeasonContext??=null;
  for(const key of ['careerOutsideIncome','yearOutsideIncome','cntNormWin','cntEndorseBoldWin','cntSocialBoldFail'])s[key]=nonNegative(s[key]);
  s.traits??={};s.traits.favorite??=false;s.traits.adking??=false;
  return s;
}
export function beginEvent(s,card) {
  ensureEventState(s);s.eventSequence++;
  s.pendingEvent={eventOccurrenceID:`${s.year}:${s.eventSequence}:${card.id}`,cardID:card.id,year:s.year,eventSequence:s.eventSequence,snapshot:{traits:{...s.traits},stage:s.stage,lv:s.lv,org:s.org,pos:s.pos,age:s.age}};
  return s.pendingEvent;
}
// RNG is supplied by the existing engine. Commit precedes DOM work and continuation.
export function applyEvent(s,card,mode,{chance,pick,abilityKeys,occurrenceID=s.pendingEvent?.eventOccurrenceID}) {
  ensureEventState(s);
  if(Object.hasOwn(s.processedEventIDs,occurrenceID))return {applied:false,result:s.processedEventIDs[occurrenceID]};
  const pending=s.pendingEvent;
  if(!pending||pending.eventOccurrenceID!==occurrenceID||pending.year!==s.year||pending.cardID!==card.id||!eventEligible(card,s)||!['bold','norm','safe'].includes(mode))throw new Error('STALE_EVENT_SELECTION');
  const snapshot={traits:{...s.traits},stage:s.stage,lv:s.lv,org:s.org,pos:s.pos,age:s.age};
  const category=effectiveCategory(card,s.stage),tier=eventTier(snapshot.traits),success=chance(eventOdds(snapshot.traits)[mode]),plan=eventPlan(category,mode,tier,success);
  let target=null,ability=null;
  if(plan.ability!==0){target=card.targetByPosition?.[s.pos]||card.target;if(!abilityKeys.includes(target))target=pick(abilityKeys);ability=eventAddAbility({pos:s.pos,key:target,cur:s.ab[target],pot:s.pot?.[target],carry:s.carry?.[target],points:plan.ability});}
  const incomeYen=plan.cash?eventIncome(s.lv,mode,success,snapshot.traits):0,injuryAdded=eventInjury(card,mode,success,snapshot.traits);
  const work={...s,traits:{...s.traits},ab:{...s.ab},carry:{...s.carry},incomeLedger:[...s.incomeLedger],processedEventIDs:{...s.processedEventIDs},...eventCounters(s,card,mode,success,category)};
  if(ability){work.ab[target]=ability.after;work.carry[target]=ability.carryAfter;}
  work.pendStat=(work.pendStat||0)+plan.stat+(ability?.overflowStat||0);work.tmpInj=(work.tmpInj||0)+injuryAdded;
  if(incomeYen>0){for(const k of ['careerOutsideIncome','yearOutsideIncome','careerEarnings']){const total=(work[k]||0)+incomeYen;if(!Number.isSafeInteger(total))throw new Error('EVENT_INCOME_OVERFLOW');work[k]=total;}work.incomeLedger.push({transactionId:occurrenceID,year:s.year,eventSequence:pending.eventSequence,eventKey:card.key,mode,amountYen:incomeYen,source:'EVENT_OUTSIDE_INCOME'});}
  const unlocked=eventTraitUnlocks(work);unlocked.forEach(k=>{work.traits[k]=true;});
  const result={eventOccurrenceID:occurrenceID,cardID:card.id,mode,success,category,tier,target,abilityDelta:ability?.abilityDelta||0,statDelta:plan.stat,overflowStat:ability?.overflowStat||0,injuryAdded,incomeYen,year:s.year,ability,unlocked,snapshot};
  work.processedEventIDs[occurrenceID]=result;work.pendingEvent=null;
  for(const k of ['traits','ab','carry','incomeLedger','processedEventIDs','pendingEvent','pendStat','tmpInj','careerOutsideIncome','yearOutsideIncome','careerEarnings','cntSave','cntSaveWin','cntNormWin','cntBoldWin','cntBoldFail','cntEndorseBoldWin','cntSocialBoldFail','cntSnack'])if(k in work)s[k]=work[k];
  return {applied:true,result};
}
export function beginEventSeason(s) {
  ensureEventState(s);
  if(s.eventSeasonContext&&s.eventSeasonContext.year!==s.year)s.pendStat=0;
  if(!s.eventSeasonContext||s.eventSeasonContext.year!==s.year)s.eventSeasonContext={year:s.year,form:s.pendStat||0,consumed:false};
  return s.eventSeasonContext;
}
export function consumeEventSeason(s) {const c=beginEventSeason(s);s.pendStat=0;c.consumed=true;}
export function resetEventYear(s) {ensureEventState(s);s.pendStat=0;s.yearOutsideIncome=0;s.pendingEvent=null;s.eventSeasonContext=null;}

import assert from 'node:assert/strict';
import {historicalCareer} from '../../tools/development-b/historical-comparison.mjs';
// Diagnostic only: never normalizes or changes the compared state/expectations.
export function findFirstDifference(a,b,p='$') {
  if(a===b)return null;
  if(a&&b&&typeof a==='object'&&typeof b==='object') {
    for(const key of new Set([...Object.keys(a),...Object.keys(b)])) {
      if(!Object.hasOwn(a,key)||!Object.hasOwn(b,key))return {path:p+'.'+key,before:Object.hasOwn(a,key)?a[key]:'<missing>',after:Object.hasOwn(b,key)?b[key]:'<missing>'};
      const d=findFirstDifference(a[key],b[key],p+'.'+key);if(d)return d;
    }
    return null;
  }
  return {path:p,before:a,after:b};
}

// G1-A positive control ONLY for the verified jp3-infielder-01 / 2041 route.
// The raw historical run is retained. This is an explicit counterfactual native
// control, not old-version replay, a golden replacement, or a product adapter.
export function withApprovedPhoenixControl(source) {
  const original='const big=added.some(x=>/MVP|最佳投手|打擊王|全壘打王|新人王/.test(x));';
  assert.equal(source.split(original).length,2,'Recognized historical phoenix predicate required');
  return source.replace(original,"const big=added.some(x=>/MVP|最佳投手|打擊王|全壘打王|新人王/.test(x)||(S.seed==='jp3-infielder-01'&&S.pos==='IF'&&S.year===2041&&S.org==='NPB'&&S.lv==='NPB1'&&x==='2041 NPB首位打者'));");
}

// Read-only browser observer; no S writes, replaced decisions or extra RNG.
export const phoenixAwardProbe=`
window.__phoenixAwardEvents=[];
const phoenixObservedAwards=awards;
awards=(...args)=>{const before=JSON.parse(JSON.stringify(S)),callsBefore=window.__stage6.get().rng.length;
 const result=phoenixObservedAwards(...args);
 window.__phoenixAwardEvents.push({before,after:JSON.parse(JSON.stringify(S)),callsBefore,callsAfter:window.__stage6.get().rng.length});return result;};
`;

export function assertApprovedPhoenixCareer(old,now,expected,repeat,actionsKey) {
  assert.deepEqual(now,repeat,'Same current engine / seed / strategy exact replay');
  old=historicalCareer(old);now=historicalCareer(now);expected=historicalCareer(expected);
  assert.deepEqual(now,expected,'Full native historical control with ONLY the approved phoenix effect');
  assert.deepEqual(now.rng,old.rng,'All main RNG values and before/after states unchanged');
  assert.equal(now.state.seed,'jp3-infielder-01');
  assert.equal(now.state.pos,'IF');
  const first=now[actionsKey].findIndex((step,i)=>step.after!==old[actionsKey][i]?.after);
  assert.ok(first>=0,'The known route must actually exercise phoenix');
  assert.deepEqual(now[actionsKey].slice(0,first),old[actionsKey].slice(0,first),'Complete state/action prefix unchanged');
  assert.equal(now[actionsKey][first].before,old[actionsKey][first].before);
  assert.equal(now[actionsKey][first].action,old[actionsKey][first].action);
  assert.match(now[actionsKey][first].action,/今季の成績を見る/);
  const index=now.awards.findIndex((event,i)=>findFirstDifference(event,old.awards[i]));
  assert.ok(index>=0);
  assert.deepEqual(now.awards.slice(0,index),old.awards.slice(0,index),'Prior awards and states unchanged');
  const event=now.awards[index],prior=old.awards[index];
  assert.deepEqual(event.before,prior.before,'Full pre-award state unchanged');
  assert.equal(event.before.year,2041);assert.equal(event.before.lv,'NPB1');
  assert.equal(event.before.traits.glass,true);assert.equal(event.before.traits.phoenix,false);
  assert.ok(event.after.honors.includes('2041 NPB首位打者'));
  assert.deepEqual(event.after.honors,prior.after.honors,'Producer results unchanged');
  const effect=structuredClone(prior.after);
  effect.traits.glass=false;effect.traits.phoenix=true;effect.pool+=8;effect.removed.push('スペランカー');
  assert.deepEqual(event.after,effect,'First award delta is exactly glass/phoenix/pool+8/removed');
  assert.equal(event.callsBefore,prior.callsBefore);assert.equal(event.callsAfter,prior.callsAfter);
  assert.equal(now[actionsKey][first].after,expected[actionsKey][first].after,'First action is explained by the native approved effect');
  assert.equal(now.awards.filter(e=>!e.before.traits.phoenix&&e.after.traits.phoenix).length,1,'Phoenix transition occurs once');
  return {firstStep:first,year:2041,award:'NPB首位打者',poolIncrease:8,rngCalls:now.rng.length,rawHistoricalActions:old[actionsKey].length,currentActions:now[actionsKey].length,fullApprovedControl:'PASS',currentReplay:'PASS'};
}

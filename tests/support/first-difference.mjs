import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {historicalCareer,franchiseComparisonProof} from '../../tools/development-b/historical-comparison.mjs';
// Diagnostic only: never normalizes or changes the compared state/expectations.
export function findFirstDifference(a,b,p='$') {
  if(isDeepStrictEqual(a,b))return null;
  return walkDifference(a,b,p,new WeakMap(),{remaining:10000})||{path:p,before:'<non-JSON structural difference>',after:'<strict comparison differs>'};
}
function walkDifference(a,b,p,seen,budget) {
  if(Object.is(a,b)||(a&&b&&typeof a==='object'&&typeof b==='object'&&isDeepStrictEqual(a,b)))return null;
  if(--budget.remaining<0)return {path:p,before:'<diagnostic traversal limit>',after:'<strict comparison differs>'};
  if(a&&b&&typeof a==='object'&&typeof b==='object') {
    if(Object.getPrototypeOf(a)!==Object.getPrototypeOf(b))return {path:p,before:'<prototype differs>',after:'<prototype differs>'};
    let pairs=seen.get(a);if(pairs?.has(b))return null;if(!pairs){pairs=new WeakSet();seen.set(a,pairs);}pairs.add(b);
    if(Array.isArray(a)&&Array.isArray(b)){
      if(a.length!==b.length)return {path:p+'.length',before:a.length,after:b.length};
      for(let i=0;i<a.length;i++){
        if(Object.hasOwn(a,i)!==Object.hasOwn(b,i))return {path:p+'.'+i,before:'<array hole differs>',after:'<array hole differs>'};
        const d=walkDifference(a[i],b[i],p+'.'+i,seen,budget);if(d)return d;
      }
      return null;
    }
    for(const key of new Set([...Object.keys(a),...Object.keys(b)])) {
      if(!Object.hasOwn(a,key)||!Object.hasOwn(b,key))return {path:p+'.'+key,before:Object.hasOwn(a,key)?a[key]:'<missing>',after:Object.hasOwn(b,key)?b[key]:'<missing>'};
      const d=walkDifference(a[key],b[key],p+'.'+key,seen,budget);if(d)return d;
    }
    return null;
  }
  return {path:p,before:a,after:b};
}

// Report the first difference before deepEqual: a full diff of two careers can exhaust memory (CI-LINUX-FULL-01).
export function assertSameCareer(actual,expected,message='strict comparison') {
  // Same strict equality semantics, without handing a mismatching full career
  // to AssertionError/Myers diff (which can allocate tens of GB of ArrayBuffers).
  if(isDeepStrictEqual(actual,expected))return;
  const preview=value=>{
    if(typeof value==='string')return JSON.stringify(value.slice(0,160));
    if(value===null||typeof value!=='object')return String(value);
    if(Array.isArray(value))return '<array length='+value.length+'>';
    if(ArrayBuffer.isView(value))return '<typed data bytes='+value.byteLength+'>';
    const keys=[];for(const k in value)if(Object.hasOwn(value,k)){keys.push(k);if(keys.length===6)break;}
    return '<object keys='+keys.join(',')+'>';
  };
  const d=walkDifference(actual,expected,'$',new WeakMap(),{remaining:10000});
  assert.fail(String(message).slice(0,400)+' at '+(d?.path||'$').slice(0,400)+': '+(d?preview(d.before)+' -> '+preview(d.after):'<non-JSON structural difference>'));
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

export function assertApprovedPhoenixCareer(old,now,expected,repeat,actionsKey,options={}) {
  assertSameCareer(now,repeat,'Same current engine / seed / strategy exact replay');
  const franchiseProof=franchiseComparisonProof(now);
  old=historicalCareer(old);now=historicalCareer(now,{...options,franchiseProof});expected=historicalCareer(expected);
  assertSameCareer(now,expected,'Full native historical control with ONLY the approved phoenix effect');
  assertSameCareer(now.rng,old.rng,'All main RNG values and before/after states unchanged');
  assert.equal(now.state.seed,'jp3-infielder-01');
  assert.equal(now.state.pos,'IF');
  const first=now[actionsKey].findIndex((step,i)=>step.after!==old[actionsKey][i]?.after);
  assert.ok(first>=0,'The known route must actually exercise phoenix');
  assertSameCareer(now[actionsKey].slice(0,first),old[actionsKey].slice(0,first),'Complete state/action prefix unchanged');
  assert.equal(now[actionsKey][first].before,old[actionsKey][first].before);
  assert.equal(now[actionsKey][first].action,old[actionsKey][first].action);
  assert.match(now[actionsKey][first].action,/今季の成績を見る/);
  const index=now.awards.findIndex((event,i)=>findFirstDifference(event,old.awards[i]));
  assert.ok(index>=0);
  assertSameCareer(now.awards.slice(0,index),old.awards.slice(0,index),'Prior awards and states unchanged');
  const event=now.awards[index],prior=old.awards[index];
  assertSameCareer(event.before,prior.before,'Full pre-award state unchanged');
  assert.equal(event.before.year,2041);assert.equal(event.before.lv,'NPB1');
  assert.equal(event.before.traits.glass,true);assert.equal(event.before.traits.phoenix,false);
  assert.ok(event.after.honors.includes('2041 NPB首位打者'));
  assertSameCareer(event.after.honors,prior.after.honors,'Producer results unchanged');
  const effect=structuredClone(prior.after);
  effect.traits.glass=false;effect.traits.phoenix=true;effect.pool+=8;effect.removed.push('スペランカー');
  assertSameCareer(event.after,effect,'First award delta is exactly glass/phoenix/pool+8/removed');
  assert.equal(event.callsBefore,prior.callsBefore);assert.equal(event.callsAfter,prior.callsAfter);
  assert.equal(now[actionsKey][first].after,expected[actionsKey][first].after,'First action is explained by the native approved effect');
  assert.equal(now.awards.filter(e=>!e.before.traits.phoenix&&e.after.traits.phoenix).length,1,'Phoenix transition occurs once');
  return {firstStep:first,year:2041,award:'NPB首位打者',poolIncrease:8,rngCalls:now.rng.length,rawHistoricalActions:old[actionsKey].length,currentActions:now[actionsKey].length,fullApprovedControl:'PASS',currentReplay:'PASS'};
}

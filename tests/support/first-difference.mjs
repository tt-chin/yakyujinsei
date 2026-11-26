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

// G1-A positive control ONLY for the verified jp3-infielder-01 / 2041 route (APPROVED_PHOENIX_ROUTE).
// The raw historical run is retained. This is an explicit counterfactual native
// control, not old-version replay, a golden replacement, or a product adapter.
export const APPROVED_PHOENIX_ROUTE=Object.freeze({seed:'jp3-infielder-01',pos:'IF',year:2041,award:'NPB首位打者'});
export function withApprovedPhoenixControl(source,route=APPROVED_PHOENIX_ROUTE) {
  const original='const big=added.some(x=>/MVP|最佳投手|打擊王|全壘打王|新人王/.test(x));';
  assert.equal(source.split(original).length,2,'Recognized historical phoenix predicate required');
  return source.replace(original,()=>`const big=added.some(x=>/MVP|最佳投手|打擊王|全壘打王|新人王/.test(x)||(S.seed==='${route.seed}'&&S.pos==='${route.pos}'&&S.year===${route.year}&&S.org==='NPB'&&S.lv==='NPB1'&&x==='${route.year} ${route.award}'));`);
}

// Read-only browser observer; no S writes, replaced decisions or extra RNG.
export const phoenixAwardProbe=`
window.__phoenixAwardEvents=[];
const phoenixObservedAwards=awards;
awards=(...args)=>{const before=JSON.parse(JSON.stringify(S)),callsBefore=window.__stage6.get().rng.length;
 const result=phoenixObservedAwards(...args);
 window.__phoenixAwardEvents.push({before,after:JSON.parse(JSON.stringify(S)),callsBefore,callsAfter:window.__stage6.get().rng.length});return result;};
`;

// NPB-OFFER-WINDOW-01 / MLB-POSTING-DESIGN-01 (approved A1/A3): a natural career may reach a new NPB1 season-end choice
// the historical control (baseline or approved old engine) does not have; its team draw shifts every later RNG value
// (phoenix route: 2042). Rows carry beforeState. Returns null when no such choice exists (the career must stay
// identical), otherwise the index of the row whose click opened it; strict comparisons then cover every earlier row and
// that row's before-state (which carries rngState). The control row at that index must not be a same-year season-end
// choice at all: the old engine's KBO/CPBL/stay menu has the same labels, so a different label there is a real difference.
export const approvedSeasonEndChoice=/^(韓国プロ野球への海外移籍：|台湾プロ野球への海外移籍：|ポスティングを申請|現在の球団に残留)/;
export function seasonEndOpening(control,now){
  const t=now.findIndex((s,i)=>i>0&&s.beforeState.lv==='NPB1'&&approvedSeasonEndChoice.test(s.action)&&s.beforeState.year===now[i-1].beforeState.year&&!(control[i]&&control[i].beforeState.year===s.beforeState.year&&approvedSeasonEndChoice.test(control[i].action)));
  return t<0?null:t-1;
}
// Number of RNG draws before a row whose before-state carries rngState; rng entries are {before,after,value}.
export function rngCallsBefore(rng,rngState){
  let calls=rng.findIndex(r=>r.before===rngState);if(calls<0)calls=rng.length;
  if(calls>0)assert.equal(rng[calls-1].after,rngState,'RNG prefix ends at the opening state');
  return calls;
}
// Career cut before row k: earlier rows, row k's before-state (S incl. rngState), the RNG draws and award calls before it.
export function careerBefore(career,actionsKey,k,calls){
  return {[actionsKey]:career[actionsKey].slice(0,k),opening:career[actionsKey][k].beforeState,rng:career.rng.slice(0,calls),awards:career.awards.filter(e=>e.callsBefore<calls)};
}
export function assertApprovedPhoenixCareer(old,now,expected,repeat,actionsKey,options={},route=APPROVED_PHOENIX_ROUTE) {
  assertSameCareer(now,repeat,'Same current engine / seed / strategy exact replay');
  assert.equal(now.state.seed,route.seed);
  assert.equal(now.state.pos,route.pos);
  const k=seasonEndOpening(expected[actionsKey],now[actionsKey]);let calls=now.rng.length;
  if(k!==null){
    assert.ok(k>0,'approved NPB1 season-end choice step');
    assert.equal(now[actionsKey][k].action,expected[actionsKey][k].action,'the opening click is the control action');
    calls=rngCallsBefore(now.rng,now[actionsKey][k].beforeState.rngState);
    now=careerBefore(now,actionsKey,k,calls);expected=careerBefore(expected,actionsKey,k,calls);old={...old,rng:old.rng.slice(0,calls)};
  }
  const franchiseProof=franchiseComparisonProof(now);
  old=historicalCareer(old);now=historicalCareer(now,{...options,franchiseProof});expected=historicalCareer(expected);
  assertSameCareer(now,expected,'Full native historical control with ONLY the approved phoenix effect'+(k===null?'':' (until the first approved season-end choice)'));
  assertSameCareer(now.rng,old.rng,'All main RNG values and before/after states unchanged');
  const first=now[actionsKey].findIndex((step,i)=>step.after!==old[actionsKey][i]?.after);
  assert.ok(first>=0,'The known route must actually exercise phoenix'+(k===null?'':' before the first approved season-end choice'));
  assertSameCareer(now[actionsKey].slice(0,first),old[actionsKey].slice(0,first),'Complete state/action prefix unchanged');
  assert.equal(now[actionsKey][first].before,old[actionsKey][first].before);
  assert.equal(now[actionsKey][first].action,old[actionsKey][first].action);
  assert.match(now[actionsKey][first].action,/今季の成績を見る/);
  const index=now.awards.findIndex((event,i)=>findFirstDifference(event,old.awards[i]));
  assert.ok(index>=0);
  assertSameCareer(now.awards.slice(0,index),old.awards.slice(0,index),'Prior awards and states unchanged');
  const event=now.awards[index],prior=old.awards[index];
  assertSameCareer(event.before,prior.before,'Full pre-award state unchanged');
  assert.equal(event.before.year,route.year);assert.equal(event.before.lv,'NPB1');
  assert.equal(event.before.traits.glass,true);assert.equal(event.before.traits.phoenix,false);
  assert.ok(event.after.honors.includes(route.year+' '+route.award));
  assertSameCareer(event.after.honors,prior.after.honors,'Producer results unchanged');
  const effect=structuredClone(prior.after);
  effect.traits.glass=false;effect.traits.phoenix=true;effect.pool+=8;effect.removed.push('スペランカー');
  assertSameCareer(event.after,effect,'First award delta is exactly glass/phoenix/pool+8/removed');
  assert.equal(event.callsBefore,prior.callsBefore);assert.equal(event.callsAfter,prior.callsAfter);
  assert.equal(now[actionsKey][first].after,expected[actionsKey][first].after,'First action is explained by the native approved effect');
  assert.equal(now.awards.filter(e=>!e.before.traits.phoenix&&e.after.traits.phoenix).length,1,'Phoenix transition occurs once');
  return {seed:route.seed,firstStep:first,year:route.year,award:route.award,poolIncrease:8,seasonEndOpening:k,rngCalls:calls,rawHistoricalActions:old[actionsKey].length,comparedActions:now[actionsKey].length,fullApprovedControl:'PASS',currentReplay:'PASS'};
}

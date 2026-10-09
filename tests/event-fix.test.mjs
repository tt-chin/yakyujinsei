import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {EVENT_CATALOG} from '../docs/src/data/event-cards-jp.js';
import {ensureEventState,beginEvent,eventDrawPool,applyEvent,resetEventYear} from '../docs/src/engine/event-state-policy.js';
import {replayURL,copyShareText} from '../docs/src/ui/seed-share.js';
const oldSource=execFileSync('git',['show','2375d46:docs/src/engine/event-state-policy.js'],{encoding:'utf8'}).replace("'./event-policy.js'",JSON.stringify(new URL('../docs/src/engine/event-policy.js',import.meta.url).href));
const old=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
const keys=['vel','ctl','brk','sta','con','pow','eye','spd','rng','fld','arm','cat'];
const state=(card,traits={})=>({year:2035,pos:card.eligibility.role==='P'?'P':card.eligibility.role==='C'?'C':'IF',age:23,stage:card.eligibility.stages[0],lv:card.eligibility.levels[0],org:card.eligibility.orgs[0],traits,ab:Object.fromEntries(keys.map(k=>[k,55])),pot:Object.fromEntries(keys.map(k=>[k,80])),carry:Object.fromEntries(keys.map(k=>[k,1])),careerEarnings:0,tmpInj:0});
const strip=v=>Array.isArray(v)?v.map(strip):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['eventDrawYear','eventDrawnCardIDs','abilityPoints'].includes(k)).map(([k,x])=>[k,strip(x)])):v;
let cases=0;
for(const card of EVENT_CATALOG.events)for(const mode of ['bold','norm','safe'])for(const good of [true,false])for(const traits of [{},{clutch:true},{clutch:true,genius:true}]){
  const outcomes=[old,{ensureEventState,beginEvent,applyEvent}].map(policy=>{
    const s=policy.ensureEventState(state(card,traits));let calls=0;policy.beginEvent(s,card);
    const resolved=policy.applyEvent(s,card,mode,{chance:()=>{calls++;return good;},pick:a=>{calls++;return a[0];},abilityKeys:keys});
    const saved=structuredClone(s),before=calls;assert.equal(policy.applyEvent(s,card,mode,{chance:()=>{calls++;return !good;},pick:a=>a[1],abilityKeys:keys,occurrenceID:resolved.result.eventOccurrenceID}).applied,false);assert.deepEqual(s,saved);assert.equal(calls,before);
    return {s,resolved,calls};
  });assert.deepEqual(strip(outcomes[1]),strip(outcomes[0]),card.id+'/'+mode+'/'+good);cases++;
}
for(const [stage,lv,org] of [['HS','HS','AMATEUR'],['U','U','AMATEUR'],['CORP','CORP','CORP'],['IND','IND','IND'],['PRO','NPB1','NPB'],['PRO','KBO1','KBO'],['PRO','CPBL1','CPBL'],['PRO','MLB','MLB']]){
  const s=ensureEventState({year:2035,age:23,pos:'IF',stage,lv,org}),pool=eventDrawPool(s,EVENT_CATALOG.events).slice(0,3);
  assert.equal(pool.length,3);
  for(const card of pool){const pending=beginEvent(s,card);assert.ok(!eventDrawPool(s,pool).some(e=>e.id===card.id));assert.equal(beginEvent(s,card),pending,'same pending card is not re-created');s.pendingEvent=null;}
  assert.equal(new Set(s.eventDrawnCardIDs).size,3);assert.equal(eventDrawPool(s,pool).length,0);assert.equal(eventDrawPool(structuredClone(s),pool).length,0,'in-memory state clone retains IDs, not a save feature');
  resetEventYear(s);assert.equal(eventDrawPool(s,pool).length,0,'same-year reset cannot erase drawn IDs');s.year++;resetEventYear(s);assert.equal(eventDrawPool(s,pool).length,3);
  delete s.eventDrawnCardIDs;assert.equal(eventDrawPool(s,pool).length,3,'missing legacy fields initialize safely');s.eventDrawnCardIDs=null;assert.equal(eventDrawPool(s,pool).length,3);
}
for(const seed of ['abc','日本語 +?&%/#"','<>']){const url=replayURL(seed,'https://dev.yakyujinsei.pages.dev/sub/index.html?rv=old&x=1#fragment');assert.equal(url,'https://dev.yakyujinsei.pages.dev/sub/index.html?seed='+encodeURIComponent(seed));assert.equal(new URL(url).searchParams.get('seed'),seed);}
for(const kind of ['success','missing','denied','legacy']){
  const writes=[],windowRef={isSecureContext:true,navigator:{clipboard:kind==='missing'?undefined:{writeText:async t=>{writes.push(t);if(kind==='denied'||kind==='legacy')throw Error('denied');}}}},documentRef={activeElement:{focus(){}},body:{appendChild(){}},createElement:()=>({style:{},select(){},remove(){}}),execCommand:()=>kind==='legacy'};
  assert.equal(await copyShareText('current seed',{windowRef,documentRef}),kind==='success'||kind==='legacy');assert.deepEqual(writes,kind==='missing'?[]:['current seed']);
}
console.log(`${cases} old/new exact effect and RNG cases, annual draw IDs/exhaustion/year/legacy/idempotency, seed-only URL and clipboard fallbacks passed.`);

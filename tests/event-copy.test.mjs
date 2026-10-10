import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {EVENT_CATALOG} from '../docs/src/data/event-cards-jp.js';
import {beginEvent,applyEvent,ensureEventState} from '../docs/src/engine/event-state-policy.js';
const root=new URL('../',import.meta.url),baseline='a7fe2e8';
const oldSource=execFileSync('git',['show',baseline+':docs/src/data/event-cards-jp.js'],{encoding:'utf8',maxBuffer:4*1024*1024});
const {EVENT_CATALOG:old}=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
// Documentation cleanup removed the source fixture; keep the approved Git copy.
const fixture=new URL('YAKYUJINSEI_JP_EVENT_92_COPY.json',root);
const copy=JSON.parse(fs.existsSync(fixture)?fs.readFileSync(fixture,'utf8'):execFileSync('git',['show','73d5a58:YAKYUJINSEI_JP_EVENT_92_COPY.json'],{encoding:'utf8',maxBuffer:4*1024*1024}));
const strip=e=>{const c=structuredClone(e);delete c.n;delete c.intro;for(const mode of ['bold','norm','safe'])for(const k of ['label','good','bad'])delete c.choices[mode][k];return c;};
assert.deepEqual(EVENT_CATALOG.events.map(strip),old.events.map(strip));
assert.deepEqual({...EVENT_CATALOG,events:null},{...old,events:null});
assert.equal(EVENT_CATALOG.events.length,92);assert.equal(new Set(copy.events.map(e=>e.id)).size,92);
let changed=0,fields=0;
for(const e of EVENT_CATALOG.events){const c=copy.events.find(x=>x.id===e.id),before=old.events.find(x=>x.id===e.id);assert.equal(e.key,c.key);if(e.n!==before.n||e.intro!==before.intro||JSON.stringify(e.choices)!==JSON.stringify(before.choices))changed++;for(const k of ['n','intro']){assert.equal(e[k],c[k]);fields++;}for(const mode of ['bold','norm','safe'])for(const k of ['label','good','bad']){assert.equal(e.choices[mode][k],c.choices[mode][k]);fields++;}}
assert.equal(changed,92);assert.equal(fields,1012);
// The approved trait expansion is tested separately. Keep the original event rules frozen
// after removing only the explicitly approved latepractice additions.
const withoutTraitExpansion=source=>source.replaceAll('\r\n','\n')
  .replace('-(t.latepractice?5:0)','')
  .replace(/  if\(card.category==='training'&&mode==='safe'&&!success\)add\('cntTrainingSafeFail'\);\n/,'')
  .replace(/  if\(!t.latepractice&&s.cntTrainingSafeFail>=20\)out.push\('latepractice'\);\n/,'')
  .replace(/  latepractice:'[^\n]*\n/,'')
  .replaceAll(",'cntTrainingSafeFail'",'');
// The v1.10.2 draw state/result metadata is verified against v1.10.1 by event-fix.test.mjs.
for(const path of ['docs/src/engine/event-policy.js','docs/src/engine/event-season-policy.js'])assert.equal(withoutTraitExpansion(fs.readFileSync(new URL(path,root),'utf8')),execFileSync('git',['show',baseline+':'+path],{encoding:'utf8'}).replaceAll('\r\n','\n'),path+' original execution unchanged');
function run(seed,events){let rng=2166136261,calls=0;for(const ch of seed){rng^=ch.charCodeAt(0);rng=Math.imul(rng,16777619)>>>0;}const R=()=>{calls++;rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;return(rng>>>0)/4294967296;};const records=[];for(const e of events)for(const mode of ['bold','norm','safe']){const pos=e.eligibility.role==='P'?'P':e.eligibility.role==='C'?'C':'IF',keys=pos==='P'?['vel','ctl','brk','sta']:['con','pow','eye','spd','rng','fld','arm','cat','sta'];const s=ensureEventState({year:2030,age:23,stage:e.eligibility.stages[0],lv:e.eligibility.levels[0],org:e.eligibility.orgs[0],pos,traits:{},ab:Object.fromEntries(keys.map(k=>[k,50])),pot:Object.fromEntries(keys.map(k=>[k,80])),carry:{},careerEarnings:0,tmpInj:0,love:{caught:0,affairs:0}});beginEvent(s,e);const result=applyEvent(s,e,mode,{chance:p=>R()*100<p,pick:a=>a[Math.floor(R()*a.length)],abilityKeys:keys});records.push({s,result,rng:rng>>>0,calls});}return records;}
// Contract policies may evolve; event execution sections must remain identical.
const gameNow=fs.readFileSync(new URL('docs/src/engine/game.js',root),'utf8').replaceAll('\r\n','\n'),gameBefore=execFileSync('git',['show',baseline+':docs/src/engine/game.js'],{encoding:'utf8'}).replaceAll('\r\n','\n');
for(const [start,end] of [['function evOdds','function drawEvents'],['function resolveEvent','/* シーズン中即時可解鎖的特性。 */']])assert.equal(gameNow.slice(gameNow.indexOf(start),gameNow.indexOf(end)).replaceAll("['cancer','distract','latepractice']","['cancer','distract']").replaceAll('displayTrait(key)','TRAIT_LABELS[key]'),gameBefore.slice(gameBefore.indexOf(start),gameBefore.indexOf(end)),'event execution unchanged except approved labels/draw/result display');
for(const seed of ['yakyo-test-001','jp3-pitcher-02','jp3-pitcher-03','jp3-catcher-01','jp3-infielder-01','jp3-outfielder-01'])assert.deepEqual(run(seed,EVENT_CATALOG.events),run(seed,old.events),seed+' effects/state/RNG unchanged');
console.log('92/92 updated, 1012 copy fields matched, non-copy fields/engine unchanged; six-seed 1656 event resolution/RNG comparisons passed.');

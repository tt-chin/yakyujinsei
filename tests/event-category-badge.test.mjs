// EVT-01 (1.16.11): event category badges on the event prompt title and the result-card title.
// Display only: the badge follows effectiveCategory at draw time, and the category saved in the result afterwards.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EVENT_CATEGORY_LABEL,eventCategoryBadge} from '../docs/src/ui/event-category-badge.js';
import {SeasonEvents} from '../docs/src/engine/season-events.js';
import {EVENT_CATALOG} from '../docs/src/data/event-cards-jp.js';
import {THEME_IDS} from '../docs/src/ui/theme-catalog.js';
import {themeColors,contrastRatio} from './support/theme-colors.mjs';

const read=rel=>readFileSync(new URL('../'+rel,import.meta.url),'utf8').replace(/\r\n/g,'\n');
let passed=0;const test=(name,fn)=>{fn();passed++;};
const KINDS=['training','encounter','endorsement'];

test('labels are the three approved category names',()=>{
  assert.deepEqual({...EVENT_CATEGORY_LABEL},{training:'トレーニング',encounter:'日常・交流',endorsement:'広報・スポンサー'});
  assert.ok(Object.isFrozen(EVENT_CATEGORY_LABEL));
});
test('badge markup per category; unknown categories render nothing',()=>{
  for(const k of KINDS)assert.equal(eventCategoryBadge(k),`<span class="event-badge event-badge-${k}">${EVENT_CATEGORY_LABEL[k]}</span>`);
  for(const k of [undefined,null,'','toString','__proto__','TRAINING'])assert.equal(eventCategoryBadge(k),'',String(k));
});

// SeasonEvents with stub UI and a stub pick that returns the only eligible card.
function harness(card,stage){
  const e=card.eligibility,pos=e.role==='P'?'P':e.role==='C'?'C':'IF';
  const lv=stage==='PRO'?e.levels.find(l=>l!=='HS'&&l!=='U')??e.levels[0]:e.levels[0];
  const ev={...card,eligibility:{...e,stages:[stage],levels:[lv]}};
  const S={year:2030,age:20,stage,lv,org:e.orgs[0],pos,traits:{},ab:{},pot:{},carry:{},pendStat:0};
  const titles=[],cards=[];let calls=0;
  const events=new SeasonEvents({getState:()=>S,EVENTS:[ev],POS_AB:{P:['vel'],C:['con'],IF:['con'],OF:['con']},ABL:{vel:'球速',con:'ミート'},
    choose:(title,opts)=>titles.push({title,opts}),card:(cls,title,html)=>cards.push({cls,title,html}),board:()=>{},fmtMoney:v=>String(v),
    logTarget:()=>({lastElementChild:null}),displayTrait:k=>k,rng:{chance:()=>{calls++;return true;},pick:list=>{calls++;return list[0];}}});
  return {S,ev,events,titles,cards,rngCalls:()=>calls};
}
const find=(category,stage)=>EVENT_CATALOG.events.find(e=>e.category===category&&e.eligibility.stages.includes(stage));

test('prompt title badge follows effectiveCategory (HS/U/CORP encounter shows training; IND/PRO keep encounter)',()=>{
  for(const [category,stage,expected] of [['encounter','HS','training'],['encounter','U','training'],['encounter','CORP','training'],
    ['encounter','IND','encounter'],['encounter','PRO','encounter'],['training','HS','training'],['training','PRO','training'],
    ['endorsement','PRO','endorsement'],['endorsement','CORP','endorsement'],['endorsement','IND','endorsement']]){
    const card=find(category,stage);assert.ok(card,category+' '+stage);
    const h=harness(card,stage);h.events.drawEvents(1,()=>{});
    assert.equal(h.titles.length,1);h.titles[0].opts[0].f();
    assert.equal(h.titles.length,2,'prompt rendered');
    assert.equal(h.titles[1].title,eventCategoryBadge(expected)+'イベント｜'+card.n+'――'+card.intro,`${category} at ${stage}`);
    assert.equal(h.rngCalls(),1,'the draw itself is the only RNG call; badge adds none');
    for(const o of h.titles[1].opts)assert.ok(o.s.startsWith(EVENT_CATEGORY_LABEL[expected]+'｜'),'choice summary label unchanged');
  }
});
test('result-card badge uses the category saved in the result, not a recomputation',()=>{
  const card=find('encounter','PRO'),h=harness(card,'PRO');
  for(const saved of KINDS){
    h.events.renderEventResult(card,{eventOccurrenceID:'2030:1:'+card.id,cardID:card.id,mode:'norm',success:true,category:saved,tier:0,abilityPoints:0,statDelta:0,injuryAdded:0,incomeYen:0,ability:null});
    const last=h.cards.at(-1);assert.equal(last.title,eventCategoryBadge(saved)+'イベントカード｜'+card.n,saved);assert.equal(last.cls,'good');
  }
  h.events.renderEventResult(card,{eventOccurrenceID:'x',cardID:card.id,mode:'safe',success:false,category:undefined,tier:0,abilityPoints:0,statDelta:0,injuryAdded:0,incomeYen:0,ability:null});
  assert.equal(h.cards.at(-1).title,'イベントカード｜'+card.n,'missing saved category: no badge, title kept');
  assert.equal(h.rngCalls(),0);
});
test('the 9 --event-* token rules are exactly the approved EVT-01 strings (outside the -05 golden)',()=>{
  const want={'--event-training-bg':'color-mix(in srgb, var(--panel) 90%, var(--good))','--event-training-edge':'var(--good)','--event-training-text':'color-mix(in srgb, var(--chalk) 35%, var(--good))',
    '--event-encounter-bg':'color-mix(in srgb, var(--panel) 90%, var(--blue))','--event-encounter-edge':'var(--blue)','--event-encounter-text':'color-mix(in srgb, var(--chalk) 35%, var(--blue))',
    '--event-endorsement-bg':'color-mix(in srgb, var(--panel) 90%, var(--gold))','--event-endorsement-edge':'color-mix(in srgb, var(--chalk) 25%, var(--gold))','--event-endorsement-text':'color-mix(in srgb, var(--chalk) 50%, var(--gold))'};
  const rules=themeColors(read('docs/styles/themes.css')).rules;
  assert.deepEqual(Object.fromEntries(Object.keys(rules).filter(n=>n.startsWith('--event-')).map(n=>[n,rules[n]])),want);
});
test('badge text meets 4.5:1 on its background in every theme; light themes edge ≥3:1 on the panel',()=>{
  const colors=themeColors(read('docs/styles/themes.css'));
  for(const t of THEME_IDS)for(const k of KINDS){
    const r=contrastRatio(colors.color(t,`--event-${k}-text`),colors.color(t,`--event-${k}-bg`));assert.ok(r>=4.5,`${t} ${k} text ${r.toFixed(2)}`);
    const e=contrastRatio(colors.color(t,`--event-${k}-edge`),colors.color(t,'--panel'));assert.ok(e>=3,`${t} ${k} edge ${e.toFixed(2)}`);
  }
});
test('badge styles: own class (not .tag), letter-spacing reset inside the spaced h4 titles',()=>{
  const css=read('docs/styles/base.css');
  assert.match(css,/\.event-badge\{[^}]*letter-spacing:0;[^}]*\}/);
  for(const k of KINDS)assert.match(css,new RegExp(`\\.event-badge-${k}\\{background:var\\(--event-${k}-bg\\);border-color:var\\(--event-${k}-edge\\);color:var\\(--event-${k}-text\\)\\}`));
  assert.doesNotMatch(eventCategoryBadge('training'),/\btag\b/);
});
console.log(JSON.stringify({passed,FAIL:0}));

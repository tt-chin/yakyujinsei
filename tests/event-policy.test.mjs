import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {EVENT_CATALOG as d} from '../docs/src/data/event-cards-jp.js';
import {validateEventCatalog,eventPlan,eventInjury,eventOdds,eventEligible,eventAddAbility,eventIncome,effectiveCategory,eventTraitUnlocks} from '../docs/src/engine/event-policy.js';
import {ensureEventState,beginEvent,applyEvent,beginEventSeason,consumeEventSeason,resetEventYear} from '../docs/src/engine/event-state-policy.js';
import {applyEventSeason,normalizeEventSeason} from '../docs/src/engine/event-season-policy.js';
assert.equal(validateEventCatalog(),true);
// Trusted pre-cleanup fixtures, without restoring obsolete design files.
const fixture=name=>{const url=new URL('../'+name,import.meta.url);return fs.existsSync(url)?fs.readFileSync(url,'utf8'):execFileSync('git',['show','73d5a58:'+name],{encoding:'utf8',maxBuffer:4*1024*1024});};
const md=fixture('YAKYUJINSEI_JP_EVENT_92_COMPLETE_DATA.md');
const original=JSON.parse(md.match(/```json\s*([\s\S]*?)```/)[1]);
const copyData=JSON.parse(fixture('YAKYUJINSEI_JP_EVENT_92_COPY.json'));
const withoutText=e=>{const v=structuredClone(e);delete v.n;delete v.intro;for(const m of ['bold','norm','safe'])for(const f of ['label','good','bad'])delete v.choices[m][f];return v;};
assert.equal(copyData.events.length,92);assert.equal(new Set(copyData.events.map(e=>e.id)).size,92);
assert.deepEqual(d.events.map(withoutText),original.events.map(withoutText),'non-copy fields preserved');
for(const e of d.events){const c=copyData.events.find(x=>x.id===e.id);assert.equal(e.key,c.key);assert.equal(e.n,c.n);assert.equal(e.intro,c.intro);for(const m of ['bold','norm','safe'])for(const f of ['label','good','bad'])assert.equal(e.choices[m][f],c.choices[m][f]);}
let plans=0,injuries=0;
for(const e of d.events){
  const text=md.match(new RegExp('### '+String(e.id).padStart(3,'0')+'\\.[\\s\\S]*?(?=\\n### |\\n## 10\\.|$)'))[0];
  for(const [label,key] of [['stage','stages'],['lv','levels'],['org','orgs']]){
    const line=text.split('\n').find(l=>l.startsWith('- '+label+'：'));
    assert.deepEqual([...line.matchAll(/`([^`]+)`/g)][0][1].split(' / '),e.eligibility[key],`${e.id}/${key} prose vs JSON`);
  }
  assert.ok(text.includes('`'+e.eligibility.role+'`'),`${e.id}/role`);
  for(const m of ['bold','norm','safe']){
    for(const f of ['label','good','bad'])assert.ok(text.includes(original.events.find(x=>x.id===e.id).choices[m][f]),`${e.id}/${m}/${f} historical source`);
    const riskLine=text.split('\n').find(l=>l.startsWith('| '+m+' |')).trimEnd();
    assert.ok(riskLine.endsWith('＋'+eventInjury(e,m,false,{})+'ポイント |'),`${e.id}/${m} independent prose injury mask`);
    for(let tier=0;tier<3;tier++)for(const good of [true,false]){assert.deepEqual(eventPlan(e.category,m,tier,good),e.effectPlans[m][tier][good?'success':'failure']);plans++;}
    for(const good of [true,false])for(const clutch of [true,false]){const expected=!good&&e.injuryFailureModes.includes(m)?(m==='bold'?(clutch?12:16):m==='norm'?12:8):0;assert.equal(eventInjury(e,m,good,{clutch}),expected);injuries++;}
  }
}
assert.equal(plans,1656);assert.equal(injuries,1104);
assert.equal(eventOdds({}).bold,35);assert.equal(eventOdds({clutch:true}).bold,55);assert.equal(eventOdds({clutch:true,genius:true}).bold,60);
assert.equal(eventOdds({favorite:true}).norm,55);assert.equal(eventOdds({thief:true}).norm,40);
const base={stage:'PRO',lv:'NPB2',org:'NPB',pos:'C',age:34};
assert.equal(eventEligible(d.events[18],base),true);assert.equal(eventEligible(d.events[18],{...base,age:35}),false);
assert.equal(eventEligible(d.events[0],base),true);assert.equal(eventEligible(d.events[0],{...base,pos:'P'}),false);
assert.equal(eventEligible(d.events[51],base),false);assert.equal(eventEligible(d.events[0],{...base,org:'UNKNOWN'}),false);
for(const [stage,lv,org] of [['HS','HS','AMATEUR'],['U','U','AMATEUR'],['CORP','CORP','CORP'],['IND','IND','IND'],...Object.keys(d.incomePolicy.baseYenByLevel).filter(k=>!['HS','U','CORP','IND'].includes(k)).map(lv=>['PRO',lv,lv==='MLB'?'MLB':['R','A1','A2','A3'].includes(lv)?'MiLB':lv.split('_')[0].replace(/[12]$/,'')])])for(const pos of ['P','C','IF','OF'])assert.ok(d.events.filter(e=>eventEligible(e,{stage,lv,org,pos,age:34})).length>1,`${lv}/${pos} pool`);
assert.equal(effectiveCategory({category:'encounter'},'HS'),'training');assert.equal(effectiveCategory({category:'encounter'},'IND'),'encounter');
for(const [args,after,carry] of [[{pos:'P',key:'vel',cur:49,pot:80,points:2},50,1],[{pos:'P',key:'sta',cur:63,pot:80,points:2},64,1],[{pos:'IF',key:'con',cur:64,pot:64,points:6},65,0]]){const a=eventAddAbility(args);assert.equal(a.after,after);assert.equal(a.carryAfter,carry);}
assert.equal(eventAddAbility({pos:'P',key:'vel',cur:80,pot:80,points:3}).overflowStat,3);
assert.equal(eventAddAbility({pos:'P',key:'vel',cur:2,pot:80,points:-3}).after,1);
assert.equal(eventAddAbility({pos:'P',key:'vel',cur:50,pot:80,carry:1,points:-1}).carryAfter,0);
assert.equal(eventIncome('NPB1','bold',true),1500000);assert.equal(eventIncome('NPB1','bold',true,{adking:true}),1650000);assert.equal(eventIncome('MLB','bold',true,{adking:true}),4950000);assert.equal(eventIncome('CORP','safe',true),20000);assert.equal(eventIncome('HS','safe',true),0);assert.equal(eventIncome('NPB1','bold',false),0);
function state(){return ensureEventState({year:2030,age:23,stage:'PRO',lv:'NPB1',org:'NPB',pos:'IF',traits:{},ab:{sta:50,con:50,pow:50},pot:{sta:80,con:80,pow:80},carry:{},careerEarnings:10000000,currentSalary:16000000,ct:{annualSalary:16000000},cntSave:0,cntSaveWin:0,cntBoldWin:0,cntBoldFail:0,cntSnack:0,love:{caught:0,affairs:0}});}
let s=state(),rng=0,keys=['sta','con','pow'];
const opts={chance:()=>{rng++;return true;},pick:a=>{rng++;return a[0];},abilityKeys:keys};
const sponsor=d.events[52];s.cntEndorseBoldWin=4;const pending=beginEvent(s,sponsor);
const first=applyEvent(s,sponsor,'bold',opts);assert.equal(first.result.incomeYen,1500000);assert.equal(s.traits.adking,true);assert.equal(s.incomeLedger.length,1);assert.equal(s.careerEarnings,11500000);assert.equal(s.currentSalary,16000000);assert.deepEqual(s.ct,{annualSalary:16000000});
const copy=structuredClone(s),calls=rng;assert.equal(applyEvent(s,sponsor,'bold',{...opts,occurrenceID:pending.eventOccurrenceID}).applied,false);assert.deepEqual(s,copy);assert.equal(rng,calls);
beginEvent(s,sponsor);assert.equal(applyEvent(s,sponsor,'bold',opts).result.incomeYen,1650000);assert.equal(s.incomeLedger.length,2);
const rand=d.events[90];beginEvent(s,rand);const before=rng;applyEvent(s,rand,'norm',opts);assert.equal(rng-before,1,'zero ability does not pick target');
const migration=structuredClone(s);ensureEventState(s);ensureEventState(s);assert.deepEqual(s,migration);
s.pendStat=-3;const context=beginEventSeason(s);s.pendStat=99;assert.equal(beginEventSeason(s).form,-3);consumeEventSeason(s);assert.equal(s.pendStat,0);assert.equal(context.consumed,true);resetEventYear(s);assert.equal(s.yearOutsideIncome,0);assert.equal(s.incomeLedger.length,2);
s.eventSeasonContext={year:2029,form:9,consumed:false};s.pendStat=9;assert.equal(beginEventSeason(s).form,0);
assert.deepEqual(eventTraitUnlocks({...state(),cntSocialBoldFail:10}),[]);assert.ok(eventTraitUnlocks({...state(),cntSocialBoldFail:11}).includes('cancer'));
const batter={G:100,PA:425,AB:380,H:100,HR:10,RBI:50,BB:45,avg:100/380,baseD:2,d:2};
const options={points:2,seasonFactor:1,pos:'IF',role:null,maxGames:143};
let st=applyEventSeason(batter,options);for(const [k,v] of Object.entries({G:103,PA:438,AB:392,H:110,HR:12,RBI:57}))assert.equal(st[k],v,k);assert.equal(st.avg,110/392);assert.equal(st.baseD,2);
st=applyEventSeason(batter,{...options,points:-2});for(const [k,v] of Object.entries({G:100,PA:425,AB:380,H:96,HR:9,RBI:48}))assert.equal(st[k],v,k);
const pitcher={G:20,IP:100,SO:100,W:10,L:4,H:100,BB:30,ER:44,era:4,WHIP:1.3,SV:0,HLD:0,baseD:1,d:1};
st=applyEventSeason(pitcher,{...options,pos:'P',role:'SP'});assert.equal(st.IP,108);assert.equal(st.SO,116);assert.equal(st.W,11);assert.equal(st.ER,47);assert.equal(st.era,47*9/108);
assert.deepEqual(applyEventSeason(pitcher,{...options,pos:'P',role:'SP',points:0}),pitcher,'zero point years untouched');
assert.deepEqual(applyEventSeason(pitcher,{...options,pos:'P',role:'SP',seasonFactor:0}),pitcher);
st=applyEventSeason({...pitcher,G:65,SV:50,HLD:12,W:2,L:1},{...options,pos:'P',role:'CL'});assert.equal(Math.round(st.IP*3),st.IP*3);assert.ok(st.SV<=Math.floor(st.G*.85));assert.ok(st.W+st.L+st.SV+st.HLD<=st.G);
st=normalizeEventSeason({...batter,G:180,H:999,HR:999},{pos:'IF',maxGames:143});assert.equal(st.G,143);assert.ok(st.HR<=st.H&&st.H<=st.AB);
console.log(`Event tests passed: ${plans} plans, ${injuries} injury masks, copy/eligibility/income/transaction/season boundaries.`);

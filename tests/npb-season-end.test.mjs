// NPB season-end menu (MLB-POSTING-DESIGN-01 / NPB-OFFER-WINDOW-01): posting request, window-year KBO/CPBL offers,
// year-8 domestic FA cancel. Runs the real career-movement.js bodies in a vm with a stubbed RNG and call log.
import assert from 'node:assert/strict';
import {createContext,runInContext} from 'node:vm';
import {readSourceText} from './support/source-text.mjs';
import {productionFunction} from './retirement-hof-test-support.mjs';

const source=readSourceText(new URL('../docs/src/engine/career-movement.js',import.meta.url));
const movementFunction=name=>productionFunction(name,source).split('\n  return {')[0];
const body=['overseasOffer','postingOption','npbSeasonEndMenu','showNpbSeasonEndMenu','faFlow','faCancelOption'].map(movementFunction).join('\n');
// vm arrays come from another realm; compare their JSON text.
const eq=(actual,expected,message)=>assert.equal(JSON.stringify(actual),JSON.stringify(expected),message);
const STAY='現在の球団に残留',POSTING='ポスティングを申請';

function run({svc=5,o=65,lastD=3,stage='CONTROL',hits=[],picks=[],state={}}={}){
  const log=[],choices=[];let hit=0;
  const S={year:2040,org:'NPB',lv:'NPB1',lastD,faType:undefined,faUsed:false,npbFaSeasons:3,ct:{expired:true},traits:{},...state};
  const context=createContext({S,getState:()=>S,LV:{KBO1:{n:'KBO'},CPBL1:{n:'CPBL'},MLB:{n:'MLB'}},
    pickRecord:list=>{log.push(['pickRecord',list[0].teamId]);return list[0];},listByOrg:org=>[{teamId:org+'-T',name:org+'球団'}],
    salaryCandidate:v=>({annualSalary:1,targetLevel:v.targetLevel,signingTerms:{signingBonus:0}}),fmtMoney:n=>String(n),
    chance:p=>{const result=hits[hit++]??false;log.push(['chance',p,result]);return result;},ri:(a,b)=>{log.push(['ri',a,b]);return 2;},
    card:(type,title)=>log.push(['card',title]),choose:(title,opts)=>{log.push(['choose',title,opts.map(x=>x.t)]);choices.push(opts);},
    buyoutRemaining:()=>log.push(['buyout']),signTo:(...args)=>log.push(['signTo',args[0],args[1],args[5]]),
    reportFlowOutcome:outcome=>log.push(['report',outcome.kind]),renewAndAdvance:(...args)=>log.push(['renew',...args]),
    serviceYearsFor:()=>svc,contractStageFor:()=>stage,migrateSalaryV130State:()=>{},arbitrationFlow:()=>log.push(['arbitration']),
    faMarket:()=>log.push(['faMarket',S.faType,S.faUsed,S.npbFaSeasons]),crossOfferTitle:type=>'T:'+type,crossOfferType:(a,b)=>a+'>'+b});
  runInContext("'use strict';\n"+body+'\nglobalThis.faFlow=faFlow;globalThis.faCancelOption=faCancelOption;',context);
  context.faFlow(o);
  for(const index of picks)choices.at(-1)[index].f();
  return {log,S,choices,context};
}
const draws=log=>log.filter(e=>['pickRecord','chance','ri'].includes(e[0])).length;
const labels=opts=>opts.map(x=>x.t);
let cases=0;

// Window year without any qualifying offer: unchanged immediate CONTROL renewal, no menu, no draw.
{const r=run({o:40,lastD:0});eq(r.log,[['renew',1,false,'CONTROL']]);cases++;}
// Window year with offers: KBO, CPBL, posting, stay; drawn at generation only (3 pickRecord); stay renews after the choice.
{const r=run({picks:[3]});eq(labels(r.choices[0]),['韓国プロ野球への海外移籍：KBO球団','台湾プロ野球への海外移籍：CPBL球団',POSTING,STAY]);
 eq(r.log.at(-1),['renew',1,false,'CONTROL']);assert.equal(draws(r.log),3);assert.equal(r.log.filter(e=>e[0]==='report').length,0);cases++;}
// Window year, KBO accepted: buyout path (expired contract pays 0), signTo, one report, no renewal.
{const r=run({picks:[0]});eq(r.log.slice(-4),[['buyout'],['ri',1,3],['signTo','KBO','KBO1','OVERSEAS'],['report','CROSS_OFFER_RESOLVED']]);
 assert.equal(r.log.some(e=>e[0]==='renew'),false);cases++;}
// Consent rate by NPB service years (P4): <3 20%, 3-4 40%, 5-6 60%, 7-8 80%.
for(const [svc,rate] of [[0,20],[2,20],[3,40],[4,40],[5,60],[6,60],[7,80]]){
  const r=run({svc,picks:[2]});eq(r.log.find(e=>e[0]==='chance'),['chance',rate,false],'consent rate at '+svc);cases++;}
// Year 8: stay / domestic FA first, then KBO, CPBL, posting; consent 80%.
{const r=run({svc:8,stage:'FA',picks:[4]});eq(labels(r.choices[0]),['権利を行使せず残留','国内FAを宣言','韓国プロ野球への海外移籍：KBO球団','台湾プロ野球への海外移籍：CPBL球団',POSTING]);
 eq(r.log.find(e=>e[0]==='chance'),['chance',80,false]);cases++;}
// Refused: back to the same offers without posting; no new draw; stay still renews.
{const r=run({picks:[2,2]});eq(r.log.filter(e=>e[0]==='card').map(e=>e[1]),['球団が申請を認めず']);eq(labels(r.choices[1]),labels(r.choices[0]).filter(t=>t!==POSTING));
 assert.equal(r.choices[1][0],r.choices[0][0],'KBO option object kept');assert.equal(draws(r.log),4);eq(r.log.at(-1),['renew',1,false,'CONTROL']);cases++;}
// A restored view (e.g. after a failed action) still holds the original posting option: a second click draws nothing.
{const r=run({picks:[2]}),drawn=draws(r.log),menus=r.choices.length;r.choices[0][2].f();assert.equal(draws(r.log),drawn,'no second application in the year');
 assert.equal(r.choices.length,menus+1);assert.equal(labels(r.choices.at(-1)).includes(POSTING),false);cases++;}
// Consented but no bid (10%): back to the menu without posting.
{const r=run({hits:[true,false],picks:[2]});eq(r.log.filter(e=>e[0]==='card').map(e=>e[1]),['球団が容認','入札球団なし']);eq(r.log.filter(e=>e[0]==='chance').map(e=>e[1]),[60,90]);
 assert.equal(labels(r.choices[1]).includes(POSTING),false);cases++;}
// Bid declined: offer menu, then back with the same KBO option and no posting option.
{const r=run({hits:[true,true],picks:[2,1]});eq(labels(r.choices[1]),['ポスティングでMiLB球団と契約','契約せず他の選択肢に戻る']);
 assert.equal(r.choices[2][0],r.choices[0][0]);assert.equal(labels(r.choices[2]).includes(POSTING),false);assert.equal(r.log.some(e=>e[0]==='signTo'),false);cases++;}
// Bid accepted: no buyout, one ri(1,3), OVERSEAS signing to MLB level, one report, no renewal.
{const r=run({hits:[true,true],picks:[2,0]});assert.equal(r.log.some(e=>e[0]==='buyout'),false);eq(r.log.filter(e=>e[0]==='ri'),[['ri',1,3]]);
 eq(r.log.find(e=>e[0]==='signTo'),['signTo','MiLB','MLB','OVERSEAS']);eq(r.log.filter(e=>e[0]==='report'),[['report','CROSS_OFFER_RESOLVED']]);assert.equal(r.log.some(e=>e[0]==='renew'),false);cases++;}
// franchise does not change eligibility or consent rate (P4).
{const a=run({picks:[2]}),b=run({picks:[2],state:{traits:{franchise:true}}});eq(a.log,b.log);cases++;}
// Eligibility: ovr 59 or lastD 1 gives no posting option (P2).
for(const input of [{o:59},{lastD:1}]){const r=run(input);assert.equal(labels(r.choices[0]).includes(POSTING),false,JSON.stringify(input));cases++;}
// Year 8 cancel: declaring domestic FA from the integrated menu can be withdrawn; fields restored; re-declaring reaches the market again.
{const r=run({svc:8,stage:'FA',state:{faType:'X',faUsed:false,npbFaSeasons:3}});r.choices[0][1].f();eq(r.log.at(-1),['faMarket','DOMESTIC',true,0]);
 const cancel=r.context.faCancelOption();eq(labels(cancel),['FA宣言を取り消して戻る']);cancel[0].f();eq([r.S.faType,r.S.faUsed,r.S.npbFaSeasons],['X',false,3]);
 assert.equal(r.choices.at(-1).length,5);r.choices.at(-1)[1].f();assert.equal(r.log.filter(e=>e[0]==='faMarket').length,2);cases++;}
// Cancel restores an absent faType as absent.
{const r=run({svc:8,stage:'FA'});r.choices[0][1].f();r.context.faCancelOption()[0].f();assert.equal(Object.hasOwn(r.S,'faType'),false);cases++;}
// Year 8 without any move: the original two-option menu and no cancel option.
{const r=run({svc:8,stage:'FA',o:40,lastD:0});eq(labels(r.choices[0]),['権利を行使せず残留','国内FAを宣言']);r.choices[0][1].f();assert.equal(r.context.faCancelOption().length,0);cases++;}
// NPB years 9+: unchanged FA menu with overseas FA, no draw.
{const r=run({svc:9,stage:'FA'});eq(labels(r.choices[0]),['権利を行使せず残留','国内FAを宣言','海外FAを宣言']);assert.equal(draws(r.log),0);cases++;}
// Window flow only for NPB first team; other CONTROL leagues renew immediately.
{const r=run({state:{org:'KBO',lv:'KBO1'}});eq(r.log,[['renew',1,false,'CONTROL']]);cases++;}

console.log(cases+' NPB season-end menu cases passed (posting consent/bid/decline, window offers, year-8 FA cancel, no reroll).');

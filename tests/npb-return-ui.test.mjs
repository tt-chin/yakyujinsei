import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext,createContext,runInContext} from 'node:vm';
import {createContract,markSalaryPaid,appendExtension,contractNeedsRenewal} from '../docs/src/engine/contract-policy.js';
import {productionFunction} from './retirement-hof-test-support.mjs';

const game=readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const source=game.slice(Math.max(game.indexOf('  function crossOffers(o){'),game.indexOf('  crossOffers = function(o){')),game.indexOf('  function renewAndAdvance'));
function fixture(org,level,years=1){
  const original=createContract({contractId:'test',org,teamId:'team',signedYear:2035,startYear:2035,years,annualSalary:120_000_000});
  const s={year:2035,org,lv:level,ct:markSalaryPaid(original,2035).contract},calls={draw:0,advance:0,sign:0,years:0,buyout:0};let buttons;
  const context={S:s,careerSession:{npbReturnOfferContext:null},contractNeedsRenewal,crossOffers:null,advance:()=>calls.advance++,crossOfferType:()=> 'return',crossOfferTitle:()=> '復帰',pickRecord:a=>{calls.draw++;return a[0];},listByOrg:()=>[{teamId:'npb',name:'球団'}],salaryCandidate:()=>({annualSalary:35_470_000}),LV:{NPB1:{n:'NPB一軍'},NPB2:{n:'NPB二軍'}},fmtMoney:n=>n/10000+'万円',choose:(_title,b)=>{buttons=b;},ri:()=>{calls.years++;return 2;},signTo:(...args)=>{calls.sign++;calls.options=args.at(-1);},buyoutRemaining:()=>calls.buyout++};
  runInNewContext(source,context);return {s,calls,draw:o=>context.crossOffers(o),buttons:()=>buttons};
}
let cases=0;
for(const [org,level] of [['MLB','MLB'],['MiLB','A3'],['KBO','KBO1'],['CPBL','CPBL1']]){
  const ongoing=fixture(org,level,2);ongoing.draw(65);assert.equal(ongoing.calls.draw,0);assert.equal(ongoing.calls.advance,1);assert.equal(ongoing.buttons(),undefined);cases++;
  for(const accept of [false,true]){const f=fixture(org,level);f.draw(65);const first=f.buttons();f.draw(65);assert.equal(f.calls.draw,1);assert.equal(f.buttons(),first);const selected=f.buttons()[accept?0:1];selected.f();selected.f();f.draw(65);assert.equal(f.calls.advance,1);assert.equal(f.calls.sign,accept?1:0);assert.equal(f.calls.years,accept?1:0);assert.equal(f.calls.buyout,0);if(accept)assert.equal(f.calls.options.annualSalary,35_470_000);cases++;}
  const extended=fixture(org,level);extended.s.ct=appendExtension(extended.s.ct,{signedYear:2035,startYear:2036,years:2,annualSalary:120_000_000});extended.draw(65);assert.equal(extended.calls.draw,0);cases++;
  const low=fixture(org,level);low.draw(46);assert.equal(low.calls.draw,0);assert.equal(low.calls.advance,1);cases++;
  const nextYear=fixture(org,level);nextYear.draw(65);nextYear.buttons()[1].f();nextYear.s.year++;nextYear.draw(65);assert.equal(nextYear.calls.draw,2);assert.equal(nextYear.buttons().length,2);cases++;
}
const html=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8'),css=readFileSync(new URL('../docs/styles/ui-navigation.css',import.meta.url),'utf8');
assert.match(html,/<span>年俸（万）<\/span>/);assert.match(html,/aria-label="年俸、単位は万円/);assert.match(css,/padding:calc\(4px \* var\(--nav-scale\)\)/);
// Preserve the historical baseline except the explicitly tested KBO floor fix
// and the two MiLB-demotion salary snapshots covered below and by native E2E.
for(const file of ['docs/src/engine/cross-league-market-policy.js','docs/src/engine/contract-policy.js']){
  let current=readFileSync(new URL('../'+file,import.meta.url),'utf8').replace(/\r\n/g,'\n');
  if(file.endsWith('/cross-league-market-policy.js')){
    const approved='  // Apply the existing level floor after salary multipliers, before the package cap.\n  // A candidate below the floor is not itself a floor/cap policy conflict.\n  let salary=Math.min(round(Math.max(Number(annualSalary)||0,levelMinimum)),floor(available/(1+incentiveRate)));';
    assert.equal(current.split(approved).length,2,'exactly one approved KBO fix');
    current=current.replace(approved,'  let salary=Math.min(round(annualSalary),floor(available/(1+incentiveRate)));');
  }
  assert.equal(current,execFileSync('git',['show','73d5a58:'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
}
const oldGame=execFileSync('git',['show','73d5a58:docs/src/engine/game.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
let now=game.replace(/\r\n/g,'\n');
const demotionSource=now.slice(now.indexOf('function handleDemotion'),now.indexOf('function retireBelowActiveMinimum'))+'\n'+productionFunction('reportFlowOutcome',now);
for(const sourceLevel of ['A3','A2'])for(const [overall,targetLevel,title]of [[54,'NPB1','NPB一軍への移籍'],[50,'NPB2','日本の二軍（支配下）へ移籍']])for(const transfer of [false,true]){
  const S={org:'MiLB',lv:sourceLevel,age:25,lastD:0,seasonFactor:1,traits:{},ct:{remainingYears:1},currentSalary:10_000_000},input=[],draws=[],signed=[],candidate=Object.freeze({annualSalary:41_370_000,targetLevel});let choices,advances=0,buyouts=0;
  const context={S,LV:{NPB1:{min:53},NPB2:{min:47},A3:{n:'3A'},A2:{n:'2A'},A1:{n:'1A'}},findDemotionTarget:()=> 'A1',demotionChoiceText:()=> '降格',ageGateJP:()=>1,chance:p=>{draws.push(p);return true;},salaryCandidate:v=>{input.push({...v});return candidate;},fmtMoney:v=>v/10000+'万円',card:()=>{},board:()=>{},choose:(_t,opts)=>{choices=opts;},applyDemotionSalary:()=>{},advance:()=>advances++,buyoutRemaining:()=>{buyouts++;S.currentSalary=0;},signTo:(...args)=>signed.push(args)};
  runInNewContext(demotionSource+';handleDemotion('+overall+',[],0);',context);
  assert.deepEqual(draws,[targetLevel==='NPB1'?60:50]);assert.deepEqual(input,[{sourceLevel,targetLevel,contractMult:1}]);assert.equal(choices.length,2);assert.equal(choices[1].t,title);assert.match(choices[1].s,/年俸4137万円/);assert.equal(S.lv,sourceLevel);assert.equal(advances,0);assert.equal(buyouts,0);
  choices[transfer?1:0].f();assert.equal(advances,1);assert.equal(buyouts,transfer?1:0);assert.equal(signed.length,transfer?1:0);
  if(transfer){assert.equal(signed[0][0],'NPB');assert.equal(signed[0][1],targetLevel);assert.deepEqual(signed[0].slice(2,6),[undefined,undefined,undefined,undefined]);assert.equal(signed[0][6].annualSalary,candidate.annualSalary);assert.equal(signed[0][6].candidate,candidate);}else assert.equal(S.lv,'A1');cases++;
}
// Narrow textual allow-list: strip only these exact tested additions. Any other
// change to eligibility, draws, years, ordering or demotion handling still fails.
for(const [start,end,original]of [
 ["        if(o>=LV.NPB1.min&&chance(Math.round(60*ageGateJP()))){","        }else if(o>=LV.NPB2.min&&chance(50)){","        if(o>=LV.NPB1.min&&chance(Math.round(60*ageGateJP())))alts.push({t:'NPB一軍への移籍',s:'NPB移籍契約',f:()=>{buyoutRemaining();signTo('NPB','NPB1');advance();}});\n"],
 ["        }else if(o>=LV.NPB2.min&&chance(50)){","      }else if(S.org==='NPB'","        else if(o>=LV.NPB2.min&&chance(50))alts.push({t:'日本の二軍（支配下）へ移籍',f:()=>{buyoutRemaining();signTo('NPB','NPB2');advance();}});\n"]
]){const a=now.indexOf(start),b=now.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);now=now.slice(0,a)+original+now.slice(b);}
// User-approved 1.13.3 farewell only: exact text, never ignore buyout or return logic.
// Phase 4-A deleted the base farewell: the approved card exists only in the overlay version,
// and the old side drops its base farewell so the surrounding code still compares verbatim. Eligibility/once-only/all other S and RNG are independently
// executed by npb-farewell.test.mjs and event-fix-e2e.mjs.
const oldFarewell=oldGame.slice(oldGame.indexOf('/* 引退時にCPBLへ'),oldGame.indexOf('function handleDemotion'));
assert.ok(oldFarewell.startsWith('/* 引退時にCPBLへ')&&oldFarewell.includes('function daibaFarewell(cont)'));
const approvedFarewellCard="card('gold','日本球界への別れ',`かつてプレーした日本プロ野球から招待を受け、古巣の本拠地で始球式を務めた。日本のファンへ感謝を伝え、キャリア最後の一球を投じた。`);";
const approvedOldGame=oldGame.replace(oldFarewell,'');
assert.equal(now.split(approvedFarewellCard).length,2,'exactly one approved farewell card; no wildcard');
// Phase 11-B batch 2: the remaining demotion endings report through reportFlowOutcome; restore only these exact calls.
for(const [reported,original] of [
 ["{annualSalary});reportFlowOutcome({kind:'DEMOTION_TRANSFER_CPBL1'});}","{annualSalary});advance();}"],
 ["board(2);reportFlowOutcome({kind:'DEMOTION_ACCEPTED'});}}","board(2);advance();}}"],
 ["board(2); reportFlowOutcome({kind:'DEMOTION_ACCEPTED'}); }","board(2); advance(); }"],
 ["board(1); reportFlowOutcome({kind:'DEMOTION_REFUSED'}); }","board(1); advance(); }"],
 ["reportFlowOutcome({kind:'DEMOTION_RETIRED',reason:'降格を受け入れず、'+S.year+' 年に引退を発表。'})","endGame('降格を受け入れず、'+S.year+' 年に引退を発表。')"],
 ["reportFlowOutcome({kind:'DEMOTION_RETIRED',reason:'下位リーグへの降格を拒み、'+S.year+' 年に引退を発表。'})","endGame('下位リーグへの降格を拒み、'+S.year+' 年に引退を発表。')"],
 ["reportFlowOutcome({kind:'ACTIVE_MINIMUM_RETIRED',reason:`総合力が現役続行の最低基準を下回り、${S.year}年に現役を引退した。`})","endGame(`総合力が現役続行の最低基準を下回り、${S.year}年に現役を引退した。`)"]
]){assert.equal(now.split(reported).length,2,reported);now=now.replace(reported,()=>original);}
for(const [start,end] of [['  salaryCandidate=','  function saveSalaryDecision'],['function handleDemotion','/* 再契約'],['function buyoutRemaining','function handleDemotion'],["  if(S.stage==='PRO'&&S.age>=36","/* シーズン中。 */"]]){assert.ok(now.includes(start));const finish=end==='/* 再契約'? 'function outOfOrg':end,finishNow=end==='/* 再契約'? '/* 長期契約/短期契約':end;assert.ok(now.includes(finishNow));assert.equal(now.slice(now.indexOf(start),now.indexOf(finishNow,now.indexOf(start))),approvedOldGame.slice(approvedOldGame.indexOf(start),approvedOldGame.indexOf(finish,approvedOldGame.indexOf(start))),start+' unchanged except deleted base farewell');}
// Phase 11-B batch 2: demotion endings report named outcomes; every clicked path keeps the baseline call log and S.
{
  const baseSource=execFileSync('git',['show','026c5cd89e3b189cf2a93e9425f344f57fafc208:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
  const levels={NPB1:{min:53,n:'NPB一軍',top:true},NPB2:{min:47,n:'NPB二軍'},CPBL1:{min:40,n:'台湾一軍',top:true},MLB:{n:'MLB',top:true},A3:{n:'3A'},A1:{n:'1A'}};
  function demotionRun(source,{state,overall,target,hit,entry},picks){
    const log=[],choices=[],reported=[];
    const S={year:2040,age:25,org:'MiLB',lv:'A3',lastD:0,seasonFactor:1,traits:{},ct:{remainingYears:1},...structuredClone(state)};
    const context=createContext({S,LV:levels,reported,
      findDemotionTarget:()=>target,demotionChoiceText:lv=>'降格:'+lv,ageGateJP:()=>1,fmtMoney:String,
      chance:p=>{log.push(['chance',p]);return hit;},
      salaryCandidate:v=>{log.push(['salaryCandidate',v]);return {annualSalary:41_370_000,targetLevel:v.targetLevel};},
      traitCard:(key,title)=>log.push(['traitCard',key,title]),card:(type,title)=>log.push(['card',type,title]),board:n=>log.push(['board',n]),
      choose:(title,opts)=>{log.push(['choose',title,opts.map(o=>o.t)]);choices.push(opts);},
      applyDemotionSalary:(from,to)=>log.push(['applyDemotionSalary',from,to]),buyoutRemaining:rate=>log.push(['buyoutRemaining',rate]),
      signTo:(...args)=>log.push(['signTo',...args]),outOfOrg:o=>log.push(['outOfOrg',o]),daibaFarewell:cont=>{log.push(['daibaFarewell']);cont();},
      advance:()=>log.push(['advance',S.lv,!!S.demotionRefused]),endGame:reason=>log.push(['endGame',reason])});
    const reporter=source.includes('function reportFlowOutcome(')?[productionFunction('reportFlowOutcome',source)]:[];
    runInContext("'use strict';\n"+[...reporter,productionFunction('handleDemotion',source),productionFunction('retireBelowActiveMinimum',source)].join('\n'),context);
    if(reporter.length)runInContext("'use strict';const reportOriginal=reportFlowOutcome;reportFlowOutcome=outcome=>{reported.push(outcome.kind);return reportOriginal(outcome);};",context);
    runInContext(entry==='minimum'?'retireBelowActiveMinimum()':'handleDemotion('+overall+',[],0)',context);
    for(let k=0;k<picks.length;k++)choices[k][picks[k]].f();
    return {log,state:JSON.parse(JSON.stringify(S)),reported,open:choices.length>picks.length?choices[picks.length].length:0};
  }
  function demotionLeaves(source,scenario){
    const leaves=[];
    const walk=picks=>{const run=demotionRun(source,scenario,picks);if(!run.open){leaves.push(run);return;}for(let i=0;i<run.open;i++)walk([...picks,i]);};
    walk([]);return leaves;
  }
  const longContract={org:'MLB',lv:'MLB',ct:{remainingYears:3}};
  const scenarios=[
    {state:{},overall:54,target:'A1',hit:true},{state:{},overall:50,target:'A1',hit:true},{state:{},overall:40,target:'A1',hit:true},
    {state:{org:'NPB',lv:'NPB1'},overall:45,target:'NPB2',hit:true},{state:{org:'NPB',lv:'NPB1'},overall:45,target:'NPB2',hit:false},
    {state:{},overall:40,target:null,hit:true},
    ...[{},{franchise:true},{intlace:true},{cancer:true}].map(traits=>({state:{...longContract,traits},overall:40,target:'A3',hit:true})),
    {state:{age:34},overall:54,target:'A1',hit:true},{state:{org:'NPB',lv:'NPB1',lastD:-6},overall:45,target:'NPB2',hit:true},
    {state:{},entry:'minimum'},
  ];
  /* 葉の呼び出し列と S から回報されるべき結果名を導く（同じ advance／endGame へ分派される結果名の取り違えを検出する）。 */
  const has=(log,name)=>log.some(e=>e[0]===name);
  const expectedKinds=(log,state)=>{
    const last=log.at(-1),transfer=log.findLast(e=>e[0]==='signTo');
    if(last[0]==='outOfOrg')return [];
    if(last[0]==='endGame')return [has(log,'daibaFarewell')?'DEMOTION_RETIRED':log.some(e=>e[0]==='card'&&e[2]==='現役続行を断念')?'ACTIVE_MINIMUM_RETIRED':'?'];
    if(transfer)return ['DEMOTION_TRANSFER_'+transfer[2]];
    return [has(log,'applyDemotionSalary')?'DEMOTION_ACCEPTED':state.demotionRefused?'DEMOTION_REFUSED':'?'];
  };
  /* 同じ結果名を持つ呼び出し箇所（降格受諾2・引退面談2）も区別し、9 箇所すべての到達を確かめる。 */
  const site=(kind,log)=>kind+(kind==='DEMOTION_ACCEPTED'?':'+log.some(e=>e[0]==='choose'&&e[1]==='降格を受け入れるか、新天地を選ぶか？'):kind==='DEMOTION_RETIRED'?':'+log.at(-1)[1]:'');
  const kinds=[],sites=new Set();let leafCount=0;
  for(const scenario of scenarios){
    const current=demotionLeaves(game,scenario),base=demotionLeaves(baseSource,scenario);
    assert.equal(JSON.stringify(current.map(leaf=>[leaf.log,leaf.state])),JSON.stringify(base.map(leaf=>[leaf.log,leaf.state])),JSON.stringify(scenario));
    for(const {log,state,reported} of current){assert.deepEqual(reported,expectedKinds(log,state),JSON.stringify(log));kinds.push(...reported);reported.forEach(kind=>sites.add(site(kind,log)));}
    leafCount+=current.length;cases++;
  }
  assert.equal(leafCount,27);assert.equal(sites.size,9,[...sites].join());
  assert.deepEqual([...new Set(kinds)].sort(),['ACTIVE_MINIMUM_RETIRED','DEMOTION_ACCEPTED','DEMOTION_REFUSED','DEMOTION_RETIRED','DEMOTION_TRANSFER_CPBL1','DEMOTION_TRANSFER_NPB1','DEMOTION_TRANSFER_NPB2']);
}
console.log(`${cases} NPB return contract gates/cache/single completion/salary handoff and unchanged market/contract policies passed.`);

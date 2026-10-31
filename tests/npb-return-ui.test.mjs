import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext,createContext,runInContext} from 'node:vm';
import {createContract,markSalaryPaid,appendExtension,contractNeedsRenewal} from '../docs/src/engine/contract-policy.js';
import {productionFunction} from './retirement-hof-test-support.mjs';

const game=readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const contractSource=readFileSync(new URL('../docs/src/engine/career-contract.js',import.meta.url),'utf8');
const movementSource=readFileSync(new URL('../docs/src/engine/career-movement.js',import.meta.url),'utf8');
// Phase 23: the factory's return line ends the last slice. Harnesses run these real bodies; getState comes from the vm context.
const movementFunction=name=>productionFunction(name,movementSource).split('\n  return {')[0];
const source=movementFunction('crossOffers')+'\n'+productionFunction('reportFlowOutcome',game);
function fixture(org,level,years=1){
  const original=createContract({contractId:'test',org,teamId:'team',signedYear:2035,startYear:2035,years,annualSalary:120_000_000});
  const s={year:2035,org,lv:level,ct:markSalaryPaid(original,2035).contract},calls={draw:0,advance:0,sign:0,years:0,buyout:0};let buttons;
  const context={S:s,getState:()=>s,careerSession:{npbReturnOfferContext:null},contractNeedsRenewal,crossOffers:null,advance:()=>calls.advance++,crossOfferType:()=> 'return',crossOfferTitle:()=> '復帰',pickRecord:a=>{calls.draw++;return a[0];},listByOrg:()=>[{teamId:'npb',name:'球団'}],salaryCandidate:()=>({annualSalary:35_470_000}),LV:{NPB1:{n:'NPB一軍'},NPB2:{n:'NPB二軍'}},fmtMoney:n=>n/10000+'万円',choose:(_title,b)=>{buttons=b;},ri:()=>{calls.years++;return 2;},signTo:(...args)=>{calls.sign++;calls.options=args.at(-1);},buyoutRemaining:()=>calls.buyout++};
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
// Phase 23: restore the moved bodies over their game.js wrappers, removing each inserted state read by exact string, so the text compares below stay verbatim.
for(const [name,wrapper,reads,indent] of [
 ['buyoutRemaining','function buyoutRemaining(rate){return careerMovement.buyoutRemaining(rate);}',['\n    const S=getState();'],true],
 ['handleDemotion','function handleDemotion(o,path,idx){return careerMovement.handleDemotion(o,path,idx);}',['\n    const S=getState();',...Array(5).fill('const S=getState();')],true],
 ['retireBelowActiveMinimum','function retireBelowActiveMinimum(){return careerMovement.retireBelowActiveMinimum();}',['\n    const S=getState();'],true],
 ['daibaFarewell','function daibaFarewell(cont){return careerMovement.daibaFarewell(cont);}',['const S=getState();'],false]
]){
  let moved=movementFunction(name);
  for(const read of new Set(reads)){const count=reads.filter(x=>x===read).length;assert.equal(moved.split(read).length,count+1,name+' state reads');moved=moved.replaceAll(read,'');}
  assert.equal(now.split(wrapper).length,2,wrapper);now=now.replace(wrapper,()=>indent?moved.replace(/^  /gm,''):moved);
}
const demotionSource=movementFunction('handleDemotion')+'\n'+productionFunction('reportFlowOutcome',game);
for(const sourceLevel of ['A3','A2'])for(const [overall,targetLevel,title]of [[54,'NPB1','NPB一軍への移籍'],[50,'NPB2','日本の二軍（支配下）へ移籍']])for(const transfer of [false,true]){
  const S={org:'MiLB',lv:sourceLevel,age:25,lastD:0,seasonFactor:1,traits:{},ct:{remainingYears:1},currentSalary:10_000_000},input=[],draws=[],signed=[],candidate=Object.freeze({annualSalary:41_370_000,targetLevel});let choices,advances=0,buyouts=0;
  const context={S,getState:()=>S,LV:{NPB1:{min:53},NPB2:{min:47},A3:{n:'3A'},A2:{n:'2A'},A1:{n:'1A'}},findDemotionTarget:()=> 'A1',demotionChoiceText:()=> '降格',ageGateJP:()=>1,chance:p=>{draws.push(p);return true;},salaryCandidate:v=>{input.push({...v});return candidate;},fmtMoney:v=>v/10000+'万円',card:()=>{},board:()=>{},choose:(_t,opts)=>{choices=opts;},applyDemotionSalary:()=>{},advance:()=>advances++,buyoutRemaining:()=>{buyouts++;S.currentSalary=0;},signTo:(...args)=>signed.push(args)};
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
// Phase 11-B batch 4: the preseason veteran endings report through reportFlowOutcome; restore only these exact calls.
for(const [reported,original] of [
 ["で日本球界へ復帰した。`);reportFlowOutcome({kind:'PRESEASON_RETURNED_NPB'});","で日本球界へ復帰した。`);advance();"],
 ["daibaFarewell(()=>reportFlowOutcome({kind:'PRESEASON_RETIRED',reason:'功成り名を遂げ、 '+S.year+' 年に現役引退を発表。'}))","daibaFarewell(()=>endGame('功成り名を遂げ、 '+S.year+' 年に現役引退を発表。'))"]
]){assert.equal(now.split(reported).length,2,reported);now=now.replace(reported,()=>original);}
{const start='  const salaryCandidateRule=',end='\n  function saveSalaryDecision',moved=contractSource.slice(contractSource.indexOf(start),contractSource.indexOf(end));
 const params='sourceLevel=getState().lv,targetLevel=getState().lv,',read='\n    const S=getState();';assert.equal(moved.split(params).length,2);assert.equal(moved.split(read).length,2);
 assert.equal(moved.replace(start,'  salaryCandidate=').replace(params,'sourceLevel=S.lv,targetLevel=S.lv,').replace(read,''),approvedOldGame.slice(approvedOldGame.indexOf('  salaryCandidate='),approvedOldGame.indexOf('  function saveSalaryDecision')).replace(/\r\n/g,'\n').trimEnd(),'salaryCandidate unchanged');}
for(const [start,end] of [['function handleDemotion','/* 再契約'],['function buyoutRemaining','function handleDemotion'],["  if(S.stage==='PRO'&&S.age>=36","/* シーズン中。 */"]]){assert.ok(now.includes(start));const finish=end==='/* 再契約'? 'function outOfOrg':end,finishNow=end==='/* 再契約'? '/* 長期契約/短期契約':end;assert.ok(now.includes(finishNow));assert.equal(now.slice(now.indexOf(start),now.indexOf(finishNow,now.indexOf(start))),approvedOldGame.slice(approvedOldGame.indexOf(start),approvedOldGame.indexOf(finish,approvedOldGame.indexOf(start))),start+' unchanged except deleted base farewell');}
// Phase 11-B batch 2: demotion endings report named outcomes; every clicked path keeps the baseline call log and S.
{
  const baseSource=execFileSync('git',['show','026c5cd89e3b189cf2a93e9425f344f57fafc208:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
  const levels={NPB1:{min:53,n:'NPB一軍',top:true},NPB2:{min:47,n:'NPB二軍'},CPBL1:{min:40,n:'台湾一軍',top:true},MLB:{n:'MLB',top:true},A3:{n:'3A'},A1:{n:'1A'}};
  function demotionRun(source,{state,overall,target,hit,entry},picks){
    const log=[],choices=[],reported=[];
    const S={year:2040,age:25,org:'MiLB',lv:'A3',lastD:0,seasonFactor:1,traits:{},ct:{remainingYears:1},...structuredClone(state)};
    const context=createContext({S,getState:()=>S,LV:levels,reported,
      findDemotionTarget:()=>target,demotionChoiceText:lv=>'降格:'+lv,ageGateJP:()=>1,fmtMoney:String,
      chance:p=>{log.push(['chance',p]);return hit;},
      salaryCandidate:v=>{log.push(['salaryCandidate',v]);return {annualSalary:41_370_000,targetLevel:v.targetLevel};},
      traitCard:(key,title)=>log.push(['traitCard',key,title]),card:(type,title)=>log.push(['card',type,title]),board:n=>log.push(['board',n]),
      choose:(title,opts)=>{log.push(['choose',title,opts.map(o=>o.t)]);choices.push(opts);},
      applyDemotionSalary:(from,to)=>log.push(['applyDemotionSalary',from,to]),buyoutRemaining:rate=>log.push(['buyoutRemaining',rate]),
      signTo:(...args)=>log.push(['signTo',...args]),outOfOrg:o=>log.push(['outOfOrg',o]),daibaFarewell:cont=>{log.push(['daibaFarewell']);cont();},
      advance:()=>log.push(['advance',S.lv,!!S.demotionRefused]),endGame:reason=>log.push(['endGame',reason])});
    const reporter=source.includes('function reportFlowOutcome(')?[productionFunction('reportFlowOutcome',source)]:[];
    const demotionFunction=name=>source.includes("from './career-movement.js'")?movementFunction(name):productionFunction(name,source);
    runInContext("'use strict';\n"+[...reporter,demotionFunction('handleDemotion'),demotionFunction('retireBelowActiveMinimum')].join('\n'),context);
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
// Phase 11-B batch 3: FA/market endings report named outcomes; every clicked path keeps the baseline call log and S.
{
  const baseSource=execFileSync('git',['show','c2d8bb3c02b4825d3180f018c93bb97feb8bfbaf:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
  // Phase 22: current sources keep renewAndAdvance/arbitrationFlow in career-contract.js; the factory's return line ends the last slice.
  const contractFunction=name=>productionFunction(name,contractSource).split('\n  return {')[0];
  const marketFunction=(name,source)=>source.includes("from './career-contract.js'")&&['renewAndAdvance','arbitrationFlow'].includes(name)?contractFunction(name):source.includes("from './career-movement.js'")?movementFunction(name):name==='outOfOrg'?source.slice(source.indexOf('function outOfOrg('),source.indexOf('const professionalEnds')).trim():productionFunction(name,source);
  const levels=Object.fromEntries([['NPB1',90],['NPB2',70],['NPB_DEV',40],['KBO1',75],['KBO2',55],['CPBL1',72],['CPBL2',52],['MLB',95],['A3',80],['A2',65],['A1',50],['R',35],['CORP',45],['IND',30]].map(([lv,par])=>[lv,{n:'L:'+lv,par}]));
  const offer=(teamId,years)=>({offerId:'FA:2040:'+teamId,teamId,org:'NPB',level:'NPB1',years,annualSalary:80_000_000,contractType:years>1?'LONG':'RETURN',incentive:{annualMax:1_000_000},breakdown:{marketSalary:70_000_000},priceCandidate:{annualSalary:80_000_000},guaranteedTotal:80_000_000*years,incentiveAnnualMax:1_000_000});
  function marketRun(source,{state,entry,hit,below},picks){
    const log=[],choices=[],reported=[];
    const S={year:2040,age:25,stage:'PRO',org:'NPB',lv:'NPB1',orgTeamId:'T0',lastD:0,currentSalary:50_000_000,marketInjury:null,salaryEvaluationHistory:[],npbYears:0,traits:{},ct:{expired:false},...structuredClone(state)};
    const careerSession={npbReturnOfferContext:null,pendingOffseasonSalary:'pending'};
    const context=createContext({S,getState:()=>S,LV:levels,careerSession,reported,
      fmtMoney:String,escapeHTML:String,dpMult:()=>1,isRecentStar:()=>false,kboPreviousPackage:()=>null,currentMarketRating:()=>55,serviceYearsFor:()=>4,
      roundToTenThousandYen:v=>Math.round(v/1e4)*1e4,injurySalaryMultiplier:()=>0.95,salaryFor:(lv,rating)=>10_000_000+rating*100_000,
      contractNeedsRenewal:ct=>!!ct?.expired,crossOfferType:(from,to)=>from+'>'+to,crossOfferTitle:type=>'title:'+type,
      teamRec:id=>({name:'球団'+id}),faOfferText:o=>'offer:'+o.offerId,listByOrg:org=>[{teamId:org+'-T',name:org+'球団'}],
      pickRecord:list=>{log.push(['pickRecord',list[0].teamId]);return list[0];},ri:(a,b)=>{log.push(['ri',a,b]);return 2;},chance:p=>{log.push(['chance',p]);return hit;},
      salaryCandidate:v=>{log.push(['salaryCandidate',v]);return {annualSalary:40_000_000,targetLevel:v?.targetLevel,contractMult:v?.contractMult??1,signingTerms:{signingBonus:v?.targetLevel==='MLB'?5_000_000:0},baseSalary:30_000_000};},
      calculateControlOffer:v=>({protectedSalary:v.marketSalary*1.1,floorApplied:true}),
      calculateArbitrationTerms:v=>({...v,clubSalary:30_000_000,playerSalary:50_000_000,middleSalary:40_000_000,winChance:45,middleFloorApplied:false,playerFloorApplied:true,clubFloorApplied:false}),
      applyKboForeignPackageCap:v=>{log.push(['applyKboForeignPackageCap',v]);return {annualSalary:v.annualSalary-1_000_000};},
      createIncentiveTerms:v=>({org:v.org,annualMax:1_000_000}),fixedContract:v=>({...v}),
      saveSalaryDecision:(...args)=>log.push(['saveSalaryDecision',...args]),salaryDecisionSummary:()=>'summary',salaryDecisionLink:()=>'link',bindLatestSalaryDetailLink:()=>log.push(['bindLatestSalaryDetailLink']),
      card:(type,title,body)=>log.push(['card',type,title,body]),choose:(title,opts)=>{log.push(['choose',title,opts.map(o=>[o.t,o.s])]);choices.push(opts);},
      buyoutRemaining:rate=>log.push(['buyoutRemaining',rate]),signTo:(...args)=>log.push(['signTo',...args]),
      isBelowActiveMinimum:o=>{log.push(['isBelowActiveMinimum',o]);return !!below;},retireBelowActiveMinimum:()=>log.push(['retireBelowActiveMinimum']),
      advance:()=>log.push(['advance',S.org,S.lv,S.stage]),endGame:reason=>log.push(['endGame',reason])});
    const reporter=source.includes('function reportFlowOutcome(')?[productionFunction('reportFlowOutcome',source)]:[];
    runInContext("'use strict';\n"+[...reporter,...['overseasOffer','crossOffers','renewAndAdvance','arbitrationFlow','acceptFaOffer','showFaMarket','outOfOrg'].map(name=>marketFunction(name,source))].join('\n'),context);
    if(reporter.length)runInContext("'use strict';const reportOriginal=reportFlowOutcome;reportFlowOutcome=outcome=>{reported.push(outcome.kind);return reportOriginal(outcome);};",context);
    runInContext(entry,context);
    for(let k=0;k<picks.length;k++)choices[k][picks[k]].f();
    return {log,state:JSON.parse(JSON.stringify({S,pending:careerSession.pendingOffseasonSalary})),reported,open:choices.length>picks.length?choices[picks.length].length:0};
  }
  function marketLeaves(source,scenario){
    const leaves=[];
    const walk=picks=>{const run=marketRun(source,scenario,picks);if(!run.open){leaves.push(run);return;}for(let i=0;i<run.open;i++)walk([...picks,i]);};
    walk([]);return leaves;
  }
  const market=(offers,stayOffer)=>({lastFaMarket:{marketKey:'FA:2040:DOMESTIC',offers,stayOffer,marketRating:55,acceptedOfferId:null}});
  const scenarios=[
    {state:{lastD:3},entry:'crossOffers(65)'},{state:{lastD:0},entry:'crossOffers(46)'},{state:{},entry:'crossOffers(40)'},
    {state:{org:'MLB',lv:'MLB',ct:{expired:true}},entry:'crossOffers(60)'},{state:{org:'KBO',lv:'KBO1',ct:{expired:true}},entry:'crossOffers(50)'},{state:{org:'MLB',lv:'MLB'},entry:'crossOffers(60)'},
    {state:{},entry:"renewAndAdvance(1,false,'CONTROL')"},{state:{},entry:'renewAndAdvance(1)'},
    {state:{org:'MLB',lv:'MLB'},entry:'arbitrationFlow()',hit:true},{state:{org:'MLB',lv:'MLB'},entry:'arbitrationFlow()',hit:false},
    {state:market([offer('T1',3),offer('T2',2)],offer('T0',1)),entry:'showFaMarket(S.lastFaMarket)'},
    {state:market([],null),entry:'showFaMarket(S.lastFaMarket)'},{state:{org:'KBO',lv:'KBO1',...market([],null)},entry:'showFaMarket(S.lastFaMarket)'},
    {state:{},entry:'outOfOrg(20)',below:true},{state:{},entry:'outOfOrg(55)',hit:true},{state:{age:28},entry:'outOfOrg(40)',hit:false},{state:{age:28},entry:'outOfOrg(40)',hit:true},{state:{},entry:'outOfOrg(20)'},
  ];
  /* 葉の呼び出し列と S から回報されるべき結果名を導く（同じ advance／endGame へ分派される結果名の取り違えを検出する）。 */
  const expectedKinds=(log,{S},entry)=>{
    const last=log.at(-1),transfer=log.findLast(e=>e[0]==='signTo'),title=log.findLast(e=>e[0]==='card')?.[2];
    if(last[0]==='retireBelowActiveMinimum')return [];
    if(last[0]==='endGame')return [last[1].startsWith('FA市場')?'FA_RETIRED':last[1].startsWith('戦力外')?'RELEASE_RETIRED':'?'];
    if(transfer)return [{OVERSEAS:'CROSS_OFFER_RESOLVED',RETURN:'CROSS_OFFER_RESOLVED',FA:'FA_SIGNED',RELEASE_RECONTRACT:'RELEASE_SIGNED_PRO'}[transfer[6]]??'?'];
    if(title==='契約更改')return ['CONTRACT_RENEWED'];
    if(title==='MLB年俸調停')return ['ARBITRATION_SETTLED'];
    if(S.lastFaMarket?.acceptedOfferId==='RETURN_NO_BID')return ['FA_NO_BID_RETURNED'];
    if(['CORP','IND'].includes(S.stage))return ['RELEASE_JOINED_AMATEUR'];
    return [entry.startsWith('crossOffers(')?'CROSS_OFFER_RESOLVED':'?'];
  };
  /* 同じ結果名を持つ呼び出し箇所（戦力外の引退2）も理由で区別し、10 箇所すべての到達を確かめる。 */
  const site=(kind,log)=>kind+(kind==='RELEASE_RETIRED'?':'+log.at(-1)[1]:'');
  const kinds=[],sites=new Set();let leafCount=0;
  for(const scenario of scenarios){
    const current=marketLeaves(game,scenario),base=marketLeaves(baseSource,scenario);
    assert.equal(JSON.stringify(current.map(leaf=>[leaf.log,leaf.state])),JSON.stringify(base.map(leaf=>[leaf.log,leaf.state])),JSON.stringify(scenario));
    for(const {log,state,reported} of current){assert.deepEqual(reported,expectedKinds(log,state,scenario.entry),JSON.stringify(log));kinds.push(...reported);reported.forEach(kind=>sites.add(site(kind,log)));}
    leafCount+=current.length;cases++;
  }
  assert.equal(leafCount,44);assert.equal(sites.size,10,[...sites].join());
  assert.deepEqual([...new Set(kinds)].sort(),['ARBITRATION_SETTLED','CONTRACT_RENEWED','CROSS_OFFER_RESOLVED','FA_NO_BID_RETURNED','FA_RETIRED','FA_SIGNED','RELEASE_JOINED_AMATEUR','RELEASE_RETIRED','RELEASE_SIGNED_PRO']);
}
// Phase 11-B batch 4: preseason/rehab year endings report named outcomes; every clicked path keeps the baseline call log and S.
{
  const baseSource=execFileSync('git',['show','c2d8bb3c02b4825d3180f018c93bb97feb8bfbaf:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
  const levels={NPB1:{min:53},NPB2:{min:47}};
  function yearRun(source,{state,overall,renewal,entry},picks){
    const log=[],choices=[],reported=[];let draws=0;
    const S={year:2040,age:36,pos:'IF',stage:'PRO',org:'NPB',lv:'NPB1',lastD:2,rehab:0,six:0,tj:0,traits:{},ab:{con:50,pow:50,spd:50,vel:50,ctl:50,sta:50},pot:{},log:[],ct:{remainingYears:1},...structuredClone(state)};
    S.teamName=()=>'球団:'+S.org+':'+S.lv;
    const context=createContext({S,LV:levels,reported,
      POS_AB:{IF:['con','pow','spd'],P:['vel','ctl','sta']},ABL:{con:'ミート',pow:'パワー',spd:'走力',vel:'球速',ctl:'制球',sta:'スタミナ'},
      clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),declineForSeason:(_s,base)=>{log.push(['declineForSeason',base]);return base;},
      stageLabel:()=>'stage',tjCap:()=>100,ovr:()=>{log.push(['ovr']);return overall;},
      R:()=>{log.push(['R']);return [0.1,0.5,0.8,0.97][draws++%4];},ri:(a,b)=>{log.push(['ri',a,b]);return b;},chance:p=>{log.push(['chance',p]);return false;},
      addAb:(k,v)=>{log.push(['addAb',k,v]);return v;},checkGoldclothSeason:()=>log.push(['checkGoldclothSeason']),
      board:n=>log.push(['board',n]),card:(type,title,body)=>log.push(['card',type,title,body]),
      choose:(title,opts)=>{log.push(['choose',title,opts.map(o=>[o.t,o.s])]);choices.push(opts);},
      dposReview:cont=>{log.push(['dposReview']);cont();},allocUI:(input,_text,cont)=>log.push(['allocUI',input.dice]),nextStep:()=>log.push(['nextStep']),
      buyoutRemaining:rate=>log.push(['buyoutRemaining',rate]),signTo:(org,lv,...rest)=>{log.push(['signTo',org,lv,...rest]);S.org=org;S.lv=lv;},
      daibaFarewell:cont=>{log.push(['daibaFarewell']);cont();},
      isBelowActiveMinimum:o=>{log.push(['isBelowActiveMinimum',o]);return false;},retireBelowActiveMinimum:()=>log.push(['retireBelowActiveMinimum']),
      contractNeedsRenewal:ct=>{log.push(['contractNeedsRenewal',ct]);return !!renewal;},markClubInitiatedRenewal:years=>log.push(['markClubInitiatedRenewal',years]),
      advance:()=>log.push(['advance',S.org,S.lv]),endGame:reason=>log.push(['endGame',reason])});
    const reporter=source.includes('function reportFlowOutcome(')?[productionFunction('reportFlowOutcome',source)]:[];
    runInContext("'use strict';\n"+[...reporter,productionFunction('phasePre',source),productionFunction('movement',source)].join('\n'),context);
    if(reporter.length)runInContext("'use strict';const reportOriginal=reportFlowOutcome;reportFlowOutcome=outcome=>{reported.push(outcome.kind);return reportOriginal(outcome);};",context);
    runInContext(entry||'phasePre()',context);
    for(let k=0;k<picks.length;k++)choices[k][picks[k]].f();
    return {log,state:JSON.parse(JSON.stringify(S)),reported,open:choices.length>picks.length?choices[picks.length].length:0};
  }
  function yearLeaves(source,scenario){
    const leaves=[];
    const walk=picks=>{const run=yearRun(source,scenario,picks);if(!run.open){leaves.push(run);return;}for(let i=0;i<run.open;i++)walk([...picks,i]);};
    walk([]);return leaves;
  }
  const scenarios=[
    {state:{age:48},overall:60},
    {state:{org:'MLB',lv:'MLB'},overall:60},{state:{org:'MLB',lv:'MLB'},overall:50},{state:{org:'KBO',lv:'KBO1'},overall:60},{state:{org:'KBO',lv:'KBO1'},overall:50},
    {state:{},overall:60},{state:{org:'MLB',lv:'MLB'},overall:40},
    {state:{age:25,pos:'P'},overall:60},{state:{age:37,pos:'P',org:'CPBL',lv:'CPBL1'},overall:55},{state:{age:30,rehab:2},overall:60},
    {state:{skipMid:true},overall:60,renewal:true,entry:'movement()'},{state:{skipMid:true},overall:60,renewal:false,entry:'movement()'},
  ];
  /* 葉の呼び出し列と入口から回報されるべき結果名を導く（同じ advance／endGame へ分派される結果名の取り違えを検出する）。 */
  const expectedKinds=(log,entry)=>{
    const last=log.at(-1);
    if(last[0]==='endGame')return [last[1].startsWith('体はもう限界')?'PRESEASON_AGE_LIMIT_RETIRED':log.some(e=>e[0]==='daibaFarewell')&&last[1].startsWith('功成り名を遂げ')?'PRESEASON_RETIRED':'?'];
    if(last[0]==='advance')return [entry==='movement()'?'REHAB_YEAR_COMPLETED':log.findLast(e=>e[0]==='signTo')?.[1]==='NPB'?'PRESEASON_RETURNED_NPB':'?'];
    return [];
  };
  const kinds=[];let leafCount=0;
  for(const scenario of scenarios){
    const current=yearLeaves(game,scenario),base=yearLeaves(baseSource,scenario);
    assert.equal(JSON.stringify(current.map(leaf=>[leaf.log,leaf.state])),JSON.stringify(base.map(leaf=>[leaf.log,leaf.state])),JSON.stringify(scenario));
    for(const {log,reported} of current){assert.deepEqual(reported,expectedKinds(log,scenario.entry),JSON.stringify(log));kinds.push(...reported);}
    leafCount+=current.length;cases++;
  }
  assert.equal(leafCount,28);assert.equal(kinds.length,15);
  /* 4 箇所はそれぞれ固有の結果名を持つため、結果名の網羅が 4 箇所すべての到達を示す。 */
  assert.deepEqual([...new Set(kinds)].sort(),['PRESEASON_AGE_LIMIT_RETIRED','PRESEASON_RETIRED','PRESEASON_RETURNED_NPB','REHAB_YEAR_COMPLETED']);
}
console.log(`${cases} NPB return contract gates/cache/single completion/salary handoff and unchanged market/contract policies passed.`);

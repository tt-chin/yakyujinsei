import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {createContract,markSalaryPaid,appendExtension,contractNeedsRenewal} from '../docs/src/engine/contract-policy.js';

const game=readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const source=game.slice(game.indexOf('  let npbReturnOfferContext=null;'),game.indexOf('  function renewAndAdvance'));
function fixture(org,level,years=1){
  const original=createContract({contractId:'test',org,teamId:'team',signedYear:2035,startYear:2035,years,annualSalary:120_000_000});
  const s={year:2035,org,lv:level,ct:markSalaryPaid(original,2035).contract},calls={draw:0,advance:0,sign:0,years:0,buyout:0};let buttons;
  const context={S:s,contractNeedsRenewal,crossOffers:null,advance:()=>calls.advance++,crossOfferType:()=> 'return',crossOfferTitle:()=> '復帰',pickRecord:a=>{calls.draw++;return a[0];},listByOrg:()=>[{teamId:'npb',name:'球団'}],salaryCandidate:()=>({annualSalary:35_470_000}),LV:{NPB1:{n:'NPB一軍'},NPB2:{n:'NPB二軍'}},fmtMoney:n=>n/10000+'万円',choose:(_title,b)=>{buttons=b;},ri:()=>{calls.years++;return 2;},signTo:(...args)=>{calls.sign++;calls.options=args.at(-1);},buyoutRemaining:()=>calls.buyout++};
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
// Preserve the historical baseline except the explicitly tested KBO floor-before-cap fix.
for(const file of ['docs/src/engine/cross-league-market-policy.js','docs/src/engine/contract-policy.js']){
  let current=readFileSync(new URL('../'+file,import.meta.url),'utf8').replace(/\r\n/g,'\n');
  if(file.endsWith('/cross-league-market-policy.js')){
    const approved='  // Apply the existing level floor after salary multipliers, before the package cap.\n  // A candidate below the floor is not itself a floor/cap policy conflict.\n  let salary=Math.min(round(Math.max(Number(annualSalary)||0,levelMinimum)),floor(available/(1+incentiveRate)));';
    assert.equal(current.split(approved).length,2,'exactly one approved KBO fix');
    current=current.replace(approved,'  let salary=Math.min(round(annualSalary),floor(available/(1+incentiveRate)));');
  }
  assert.equal(current,execFileSync('git',['show','73d5a58:'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'),file);
}
const oldGame=execFileSync('git',['show','73d5a58:docs/src/engine/game.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n'),now=game.replace(/\r\n/g,'\n');
for(const [start,end] of [['  salaryCandidate=','  function saveSalaryDecision'],['function handleDemotion','/* 再契約'],['function buyoutRemaining','function handleDemotion'],["  if(S.stage==='PRO'&&S.age>=36","/* シーズン中。 */"]]){assert.ok(now.includes(start));const finish=end==='/* 再契約'? 'function outOfOrg':end;assert.ok(now.includes(finish));assert.equal(now.slice(now.indexOf(start),now.indexOf(finish,now.indexOf(start))),oldGame.slice(oldGame.indexOf(start),oldGame.indexOf(finish,oldGame.indexOf(start))),start+' unchanged');}
console.log(`${cases} NPB return contract gates/cache/single completion/salary handoff and unchanged market/contract policies passed.`);

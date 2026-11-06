import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import * as championship from '../docs/src/engine/championship-policy.js';
import {CareerPresenter} from '../docs/src/ui/career-presenter.js';
import {DEFERRED_TRAITS} from '../docs/src/engine/trait-policy.js';
const base=execFileSync('git',['show','HEAD:docs/src/engine/championship-policy.js'],{encoding:'utf8'});
const original=await import('data:text/javascript;base64,'+Buffer.from(base).toString('base64'));
const rules=[['NPB1','NPB','日本一'],['MLB','MLB','ワールドシリーズチャンピオン'],['CPBL1','CPBL','台湾シリーズ優勝'],['KBO1','KBO','韓国シリーズ優勝']];
const teamById=id=>rules.map(([,org])=>({teamId:org,org})).find(t=>t.teamId===id);
const state=pos=>({pos,stage:'PRO',year:2030,lv:'NPB1',org:'NPB',orgTeamId:'NPB',seasonFactor:1,traits:{},honors:[],championshipMigrationVersion:1,championshipResults:{}});
let checks=0;
for(const pos of ['P','IF']){
 const now=state(pos),old=structuredClone(now),traceA=[],traceB=[];
 let rngA=12345,rngB=12345;
 const draw=(side)=>()=>{if(side==='A'){rngA=(Math.imul(rngA,1664525)+1013904223)>>>0;traceA.push(rngA);return rngA/4294967296;}rngB=(Math.imul(rngB,1664525)+1013904223)>>>0;traceB.push(rngB);return rngB/4294967296;};
 for(let i=0;i<100;i++){
  for(const s of [old,now])Object.assign(s,{year:2030+i,lv:rules[i%4][0],org:rules[i%4][1],orgTeamId:rules[i%4][1]});
  original.captureSeasonChampionship(old);championship.captureSeasonChampionship(now);
  const before=structuredClone(now);
  assert.deepEqual(championship.settleChampionship(now,{teamById,random:draw('A')}),original.settleChampionship(old,{teamById,random:draw('B')}));
  championship.updateChampionmaker(now,teamById);
  const expectedWins=Object.values(now.championshipResults).filter(r=>r.won&&r.eligible).length;
  assert.equal(now.championmakerCount,expectedWins);assert.equal(Boolean(now.traits.championmaker),expectedWins>=5);
  const copy=structuredClone(now);delete copy.championmakerWins;delete copy.championmakerCount;delete copy.championmakerAcquiredYear;delete copy.traits.championmaker;
  assert.deepEqual(copy,old);assert.deepEqual(traceA,traceB);
  const saved=structuredClone(now);championship.settleChampionship(now,{teamById,random:()=>assert.fail('retry draw')});assert.equal(championship.updateChampionmaker(now,teamById),false);assert.deepEqual(now,saved);checks++;
 }
}
const s=state('P');
for(let n=1;n<=6;n++){
 const [level,league,title]=rules[n%4];s.year=2030+n;
 s.championshipResults[s.year]={year:s.year,level,league,title,teamId:league,eligible:true,won:true};
 assert.equal(championship.updateChampionmaker(s,teamById),n===5);assert.equal(s.championmakerCount,n);assert.equal(Boolean(s.traits.championmaker),n>=5);checks++;
}
for(const row of [{level:'NPB2',league:'NPB',title:'日本一',teamId:'NPB',eligible:true,won:true},{level:'NPB1',league:'NPB',title:'リーグ優勝',teamId:'NPB',eligible:true,won:true},{level:'NPB1',league:'NPB',title:'日本一',teamId:'unknown',eligible:true,won:true},{level:'NPB1',league:'NPB',title:'日本一',teamId:'NPB',eligible:false,won:true}]){
 const s=state('IF');s.honors=['2020 日本一','2021 日本一','2022 日本一','2023 日本一','2024 日本一'];s.championshipResults[2030]={year:2030,...row};championship.updateChampionmaker(s,teamById);assert.equal(s.championmakerCount,0);assert.equal(Boolean(s.traits.championmaker),false);checks++;
}
assert.deepEqual(DEFERRED_TRAITS,['nitenichi']);
for(const level of ['HS','UNI','CORP','IND','NPB2','NPBD','INTL']){
 const s=state('P');s.championshipResults[2030]={year:2030,level,league:'NPB',title:'日本一',teamId:'NPB',eligible:true,won:true};
 championship.updateChampionmaker(s,teamById);assert.equal(s.championmakerCount,0);checks++;
}
{
 const s=state('P');s.championshipResults[2030]={year:2030,level:'NPB1',league:'NPB',title:'日本一',teamId:'NPB',eligible:true,won:true};
 s.championshipResults.duplicate={...s.championshipResults[2030]};s.honors=['2030 NPBリーグ優勝','2030 日本一','2030 日本一'];
 championship.updateChampionmaker(s,teamById);assert.equal(s.championmakerCount,1);checks++;
}
// Honor-only: no consumer outside acquisition, state initialization and presentation reads this ID.
const allowed=new Set(['engine/championship-policy.js','engine/initial-state.js','engine/season-settlement.js','engine/trait-policy.js','engine/career-retirement.js']);
for(const file of readdirSync(new URL('../docs/src/',import.meta.url),{recursive:true}).filter(f=>f.endsWith('.js'))){
 if(!allowed.has(file.replaceAll('\\','/')))assert(!readFileSync(new URL('../docs/src/'+file.replaceAll('\\','/'),import.meta.url),'utf8').includes('championmaker'),file+' unexpected championmaker consumer');
}
for(const [tj,rubber,expected] of [[0,false,'0.0 / 50'],[12.599999999999998,false,'12.6 / 50'],[49.75,false,'49.8 / 50'],[62.34,true,'62.3 / 100'],[undefined,false,'0.0 / 50'],[123,false,'123.0 / 50'],[-1,false,'-1.0 / 50']]){
 const s={pos:'P',tj,traits:{rubber},ab:{}};const saved=structuredClone(s);
 const p=new CareerPresenter({getState:()=>s,labels:{ABL:{},POS_AB:{P:[]},POSN:{P:'投手'}}});
 assert.equal(p.ability().condition.find(r=>r.label==='TJゲージ').value,expected);assert.deepEqual(s,saved);checks++;
}
console.log(`PASS ${checks} targeted championship/TJ checks; P/IF 100-season deterministic championship results and exact RNG trace unchanged`);

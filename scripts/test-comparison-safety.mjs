import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {historicalCareer} from '../tools/development-b/historical-comparison.mjs';
import {legacyChampionmakerState,projectChampionmakerState} from '../tools/development-b/championmaker-state-oracle.mjs';
import {assertSameCareer,findFirstDifference} from '../tests/support/first-difference.mjs';
let checks=0;
const state=()=>({seed:'oracle',year:2036,traits:{championmaker:false,nitenichi:false},honors:[],tripleCrownHistory:{},championshipResults:{},championmakerWins:[],championmakerCount:0,championmakerAcquiredYear:null,salary:10,rngState:123});
const old=s=>{s=structuredClone(s);delete s.championmakerWins;delete s.championmakerCount;delete s.championmakerAcquiredYear;return s;};
for(const n of [0,4,5,6]){
 const s=state();for(let i=0;i<n;i++){const year=2030+i;const r={year,level:'NPB1',league:'NPB',title:'日本一',teamId:'NPB_CL_HAN',eligible:true,won:true};s.championshipResults[year]=r;s.championmakerWins.push({year,league:r.league,level:r.level,teamId:r.teamId,title:r.title});}s.championmakerCount=n;s.championmakerAcquiredYear=n>=5?2034:null;s.traits.championmaker=n>=5;
 const saved=structuredClone(s),expected=old(s);expected.traits.championmaker=false;
 assertSameCareer(legacyChampionmakerState(s),expected);assert.deepEqual(s,saved);
 assertSameCareer(historicalCareer({state:s},{championmaker:true}),historicalCareer({state:expected}));
 assert.throws(()=>assertSameCareer(historicalCareer({state:s}),historicalCareer({state:expected})),'default must not ignore new fields');checks+=3;
}
for(const mutate of [s=>delete s.championmakerCount,s=>s.championmakerCount++,s=>s.championmakerAcquiredYear=2030,s=>s.traits.championmaker=true,s=>s.championmakerWins.push({year:2030})]){const s=state();mutate(s);assert.throws(()=>legacyChampionmakerState(s));checks++;}
{const s=state();delete s.traits.championmaker;assert.throws(()=>legacyChampionmakerState(s));assertSameCareer(legacyChampionmakerState(s,{fixture:true}),old(s));checks+=2;}
for(const mutate of [s=>s.salary++,s=>s.rngState++,s=>s.honors.push('fake'),s=>s.extra='unexpected',s=>s.traits.nitenichi=true]){const s=state(),expected=old(s);mutate(s);assert.throws(()=>assertSameCareer(legacyChampionmakerState(s),expected));checks++;}
for(const [a,b] of [[NaN,NaN],[{a:1},{a:1}],[[1,2],[1,2]],[new Map([[1,2]]),new Map([[1,2]])]]){assertSameCareer(a,b);checks++;}
for(const [a,b] of [[0,-0],[{},Object.create(null)],[new Map([[1,2]]),new Map([[1,3]])],[new Set([1]),new Set([2])],[[undefined],Array(1)]]){assert.throws(()=>assertSameCareer(a,b));checks++;}
{const a={x:1},b={x:2};a.self=a;b.self=b;assert.throws(()=>assertSameCareer(a,b));checks++;}
{const a=Array(2),b=Array(2);a.extra=1;b.extra=2;assert.throws(()=>assertSameCareer(a,b));assert(findFirstDifference(a,b));checks++;}
{const a=Array.from({length:20000},(_,i)=>({i})),b=structuredClone(a);assert.equal(findFirstDifference(a,b),null);checks++;}
// Browser injection uses this exact self-contained function, not a product helper.
{const fn=(0,eval)('('+projectChampionmakerState.toString()+')');assertSameCareer(fn(state(),[]),old(state()));checks++;}
const code=`import {assertSameCareer} from ${JSON.stringify(new URL('../tests/support/first-difference.mjs',import.meta.url).href)};const text='x'.repeat(8000),a=Array.from({length:4000},(_,i)=>({i,text,value:1})),b=a.map(x=>({...x}));b.at(-1).value=2;try{assertSameCareer(a,b,'bounded large mismatch');process.exit(3);}catch(e){if(e.message.length>1000)process.exit(4);console.log(e.message);}`;
const result=spawnSync(process.execPath,['--max-old-space-size=64','--input-type=module','-e',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert(result.stdout.includes('bounded large mismatch'));checks++;
console.log(`PASS ${checks} comparison safety checks: independent field oracle, opt-in only, strict replay/types, immutable inputs, bounded error under 64MiB heap`);

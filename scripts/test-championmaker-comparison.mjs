import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {assertChampionmakerCareer} from '../tools/development-b/championmaker-comparison.mjs';
import {assertSameCareer} from '../tests/support/first-difference.mjs';
let cases=0;
const hash=(state,calls=12)=>createHash('sha256').update(JSON.stringify({state,calls})).digest('hex');
function pair(n){
 const old={seed:'comparison',year:2036,traits:{championmaker:false,nitenichi:false},honors:[],salary:100,tripleCrownHistory:{},championshipResults:{},rngState:123};
 for(let i=0;i<n;i++)old.championshipResults[2030+i]={year:2030+i,level:'NPB1',league:'NPB',title:'日本一',teamId:'NPB_CL_HAN',eligible:true,won:true};
 const wins=Object.values(old.championshipResults).map(({year,level,league,title,teamId})=>({year,league,level,teamId,title}));
 const now={};for(const [key,value] of Object.entries(structuredClone(old))){now[key]=value;if(key==='tripleCrownHistory')Object.assign(now,{championmakerWins:wins,championmakerCount:n,championmakerAcquiredYear:n>=5?2034:null});}now.traits.championmaker=n>=5;
 return [{state:now,action:'次へ',calls:12,rng:123,digest:hash(now)},{state:old,action:'次へ',calls:12,rng:123,digest:hash(old)}];
}
for(const n of [0,4,5,6]){
 const [now,old]=pair(n),saved=structuredClone({now,old});assertChampionmakerCareer([now],[old]);assert.deepEqual({now,old},saved);cases++;
 const a={records:[now],final:{state:now.state},errors:[]},b={records:[old],final:{state:old.state},errors:[]};assertChampionmakerCareer(a,b);cases++;
}
for(const [index,mutate] of [
 r=>r.state.championmakerWins.reverse(),r=>r.state.championmakerWins[0].teamId='UNKNOWN',r=>r.state.championmakerCount++,
 r=>r.state.championmakerAcquiredYear++,r=>r.state.traits.championmaker=false,r=>r.state.traits.nitenichi=true,
 r=>r.state.salary++,r=>r.state.extra=true,r=>r.calls++,r=>r.rng++,r=>r.action='別の選択',
 r=>r.state.championshipResults[2030].won=false,r=>r.digest='tampered'
].entries()){const [now,old]=pair(5);mutate(now);if(index!==12)now.digest=hash(now.state,now.calls);assert.throws(()=>assertChampionmakerCareer([now],[old]));cases++;}
{const [now]=pair(5),repeat=structuredClone(now);repeat.state.championmakerCount++;assert.throws(()=>assertSameCareer(now,repeat));cases++;}
{const [now,old]=pair(0);const a=[{...now,payload:'x'.repeat(100000),value:1}],b=[{...old,payload:'x'.repeat(100000),value:2}];assert.throws(()=>assertChampionmakerCareer(a,b),e=>e.message.length<1000&&e.message.includes('value'));cases++;}
console.log(`PASS ${cases} championmaker comparison cases: strict state/action/RNG/digest, negative controls, bounded diagnostics; inputs unchanged`);

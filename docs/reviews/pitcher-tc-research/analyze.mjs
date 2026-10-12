import fs from 'node:fs';
import assert from 'node:assert/strict';
const input=JSON.parse(fs.readFileSync(new URL('./careers.json',import.meta.url),'utf8'));
const levels={CPBL:'CPBL1',KBO:'KBO1',NPB:'NPB1',MLB:'MLB'},ks={CPBL:[130,180],KBO:[156,216],NPB:[155,215],MLB:[175,240]};
const schemes={A:{era:[3.5,2.5],W:{CPBL:[8,13],KBO:[10,15],NPB:[10,15],MLB:[12,17]},IP:{CPBL:100,KBO:120,NPB:120,MLB:140}},B:{era:[3.2,2.2],W:{CPBL:[10,15],KBO:[12,17],NPB:[12,17],MLB:[14,19]},IP:{CPBL:120,KBO:144,NPB:143,MLB:162}},C:{era:[2.8,1.8],W:{CPBL:[12,17],KBO:[14,19],NPB:[14,19],MLB:[16,21]},IP:{CPBL:120,KBO:144,NPB:143,MLB:162}}};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
function quant(a,q){a=[...a].sort((a,b)=>a-b);const p=(a.length-1)*q,k=Math.floor(p);return a[k]+(a[Math.ceil(p)]-a[k])*(p-k);}
const distribution=a=>({mean:mean(a),median:quant(a,.5),p75:quant(a,.75),p90:quant(a,.9),p95:quant(a,.95),max:Math.max(...a),min:Math.min(...a)});
function probs(row,lg,plan){const {st,role}=row,[wb,wg]=plan.W[lg],[eb,eg]=plan.era,[kb,kg]=ks[lg],ip=plan.IP[lg];
 const W=role!=='SP'||st.W<wb?0:st.W>=wg?1:clamp(30+8*(st.W-wb),30,95)/100;
 const ERA=st.IP<ip||st.era>eb?0:st.era<=eg?1:clamp(30+Math.round((eb-st.era)*35+(st.IP-ip)*.4),30,95)/100;
 const SO=st.SO<kb?0:st.SO>=kg?1:clamp(25+Math.round((st.SO-kb)*1.2),25,95)/100;
 return{W,ERA,SO,joint:W*ERA*SO};}
const valid=input.results.filter(r=>r.completed),groups=[],checks={duplicates:0,finalLogMismatch:0,invalidStats:0,unknownRoles:0};
for(const r of valid){const seen=new Set();for(const row of r.seasons){const key=row.year+':'+row.lv;if(seen.has(key))checks.duplicates++;seen.add(key);if(!Object.values(levels).includes(row.lv))continue;if(!['SP','MR','CL'].includes(row.role))checks.unknownRoles++;const match=r.fullState.log.find(l=>l.y===row.year&&l.st&&JSON.stringify(l.st)===JSON.stringify(row.st));if(!match)checks.finalLogMismatch++;if(!['W','era','IP','SO'].every(k=>Number.isFinite(row.st[k])))checks.invalidStats++;}}
for(const [league,level] of Object.entries(levels))for(const role of ['SP','MR','CL']){
 const all=valid.flatMap(r=>r.seasons.filter(s=>s.lv===level&&s.role===role).map(s=>({...s,seed:r.seed}))),rows=all.filter(s=>s.st.IP>0&&s.st.G>0),seeds=new Set(rows.map(r=>r.seed));
 const base={league,role,seasons:rows.length,recorded:all.length,fullRest:all.filter(s=>s.st.IP===0).length,careers:seeds.size,seeds:[...seeds]};
 if(rows.length){base.distributions=Object.fromEntries(['W','era','IP','SO'].map(k=>[k,distribution(rows.map(r=>r.st[k]))]));base.currentSO={basic:rows.filter(r=>r.st.SO>=ks[league][0]).length/rows.length,guarantee:rows.filter(r=>r.st.SO>=ks[league][1]).length/rows.length,actual:rows.filter(r=>valid.find(c=>c.seed===r.seed).fullState.honors.includes(r.year+' '+({CPBL:'台湾プロ野球',KBO:'KBO',NPB:'NPB',MLB:'メジャーリーグ'}[league])+'最多奪三振')).length/rows.length};
 base.plans=Object.fromEntries(Object.entries(schemes).map(([name,plan])=>{const p=rows.map(r=>probs(r,league,plan));return[name,{minIP:rows.filter(r=>r.st.IP>=plan.IP[league]).length/rows.length,Wbasic:rows.filter(r=>r.role==='SP'&&r.st.W>=plan.W[league][0]).length/rows.length,Wguarantee:rows.filter(r=>r.role==='SP'&&r.st.W>=plan.W[league][1]).length/rows.length,ERAbasic:rows.filter(r=>r.st.IP>=plan.IP[league]&&r.st.era<=plan.era[0]).length/rows.length,ERAguarantee:rows.filter(r=>r.st.IP>=plan.IP[league]&&r.st.era<=plan.era[1]).length/rows.length,expected:Object.fromEntries(['W','ERA','SO','joint'].map(k=>[k,mean(p.map(r=>r[k]))]))}];}));}
 groups.push(base);
}
const careerEstimates=Object.fromEntries(Object.entries(schemes).map(([name,plan])=>{const probabilities=valid.map(c=>{let no=1;for(const row of c.seasons){const league=Object.keys(levels).find(l=>levels[l]===row.lv);if(league&&row.st.IP>0)no*=1-probs(row,league,plan).joint;}return{seed:c.seed,probability:1-no};});return[name,{expectedPlayersPer100:mean(probabilities.map(p=>p.probability))*100,possibleCareers:probabilities.filter(p=>p.probability>0).length,probabilities}];}));
const strategies=Object.fromEntries(['ordered-overseas','balanced-stay'].map(s=>[s,{careers:valid.filter(r=>r.strategy===s).length,professional:valid.filter(r=>r.strategy===s&&r.seasons.some(r=>Object.values(levels).includes(r.lv))).length}]));
const result={commit:input.commit,version:input.version,environment:input.environment,seconds:input.seconds,completed:valid.length,failures:input.failures,errors:input.results.flatMap(r=>r.errors),resources:input.results.flatMap(r=>r.resources),replay:input.replay,checks,strategies,schemes,groups,careerEstimates,professionalCareers:valid.filter(r=>r.seasons.some(s=>Object.values(levels).includes(s.lv))).length,tradeSeasons:valid.flatMap(r=>r.seasons).filter(r=>r.tradeFrom&&Object.values(levels).includes(r.lv)).length};
assert.equal(valid.length,100);for(const [k,v]of Object.entries(checks))assert.equal(v,0,k);assert.equal(result.errors.length,0);assert.equal(result.resources.length,0);
const output=process.argv.find(a=>a.startsWith('--output='))?.slice('--output='.length);
fs.writeFileSync(output||new URL('../../../test-results/pitcher-tc/reanalysis.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,groups:groups.map(g=>({...g,seeds:undefined})),careerEstimates:Object.fromEntries(Object.entries(careerEstimates).map(([k,v])=>[k,{...v,probabilities:undefined}]))},null,2));

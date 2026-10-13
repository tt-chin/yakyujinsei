// Reuse the original candidate equations unchanged. No game imports or random draws.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readStudy} from './storage.mjs';
const here=new URL('./',import.meta.url),old=new URL('../pitcher-tc-research/',here);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,here),'utf8'));
const current=readStudy(new URL('careers.json',here)),control=readStudy(new URL('baseline-traces.json',here)),archived=JSON.parse(fs.readFileSync(new URL('careers.json',old),'utf8'));
const historic=JSON.parse(fs.readFileSync(new URL('analysis.json',old),'utf8'));
let source=fs.readFileSync(new URL('analyze.mjs',old),'utf8').replaceAll('import.meta.url',JSON.stringify(new URL('analyze.mjs',old).href));
source=source.replace("new URL('./careers.json',"+JSON.stringify(new URL('analyze.mjs',old).href)+")",JSON.stringify(fileURLToPath(new URL('careers.json',here))));
// Override only analysis output and the console's verbose rendering, not equations/assertions.
assert(!process.argv.some(x=>x.startsWith('--output=')),'Output is fixed to the new research folder');
process.argv.push('--output='+fileURLToPath(new URL('analysis.json',here)));
source=source.slice(0,source.indexOf('console.log(JSON.stringify('));
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const analysis=read('analysis.json');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b),sum=a=>a.reduce((x,y)=>x+y,0);
const dist=a=>{if(!a.length)return null;const v=[...a].sort((x,y)=>x-y),q=p=>{const i=(v.length-1)*p,k=Math.floor(i);return v[k]+(v[Math.ceil(i)]-v[k])*(i-k);};return {n:a.length,mean:sum(a)/a.length,median:q(.5),p75:q(.75),p90:q(.9),p95:q(.95),min:v[0],max:v.at(-1)};};
const firstDiff=(a,b,projection=x=>x)=>{const i=Array.from({length:Math.max(a.length,b.length)},(_,i)=>i).find(i=>!equal(projection(a[i]),projection(b[i])));return i===undefined?null:{index:i+1,old:a[i]??null,current:b[i]??null};};
const levels={CPBL:'CPBL1',KBO:'KBO1',NPB:'NPB1',MLB:'MLB'};
const sumR=d=>sum(d.results.map(r=>r.calls)),sumActions=d=>sum(d.results.map(r=>r.actions));
assert.equal(current.results.length,100);assert.equal(control.results.length,100);
const seedExpected=Array.from({length:100},(_,i)=>`pitcher-tc-1118-${String(i+1).padStart(3,'0')}`);
assert.deepEqual(current.results.map(r=>r.seed),seedExpected);assert.deepEqual(control.results.map(r=>r.seed),seedExpected);
const evidence=[],baselineChecks=[];
for(const [i,c] of current.results.entries()){
 const b=control.results[i],a=archived.results[i];assert.equal(c.strategy,a.strategy);assert.equal(c.pos,a.pos);
 const checked={seed:a.seed,state:equal(b.fullState,a.fullState),choices:equal(b.choiceHistory,a.choiceHistory),seasons:equal(b.seasons,a.seasons),calls:b.calls===a.calls,rng:b.rng===a.rng};
 baselineChecks.push(checked);for(const [k,v] of Object.entries(checked))if(k!=='seed')assert(v,`Historical replay differs: ${a.seed}/${k}`);
 assert.equal(c.study.rng.length,c.calls);assert.equal(b.study.rng.length,b.calls);
 assert.deepEqual(c.study.rng.slice(0,Math.min(c.calls,b.calls)),b.study.rng.slice(0,Math.min(c.calls,b.calls)),`PRNG common numeric prefix: ${c.seed}`);
 const direct=c.study.seasons.map((s,index)=>{const x=s.beforeEffort,y=s.afterEffort,eligible=s.context.seasonFactor>0&&s.context.effort==='全力投球';
  if(eligible){assert.equal(y.d,x.d+1);assert.equal(y.era,Math.max(1.4,Math.min(9.9,x.era-.25)));assert.equal(y.ER,Math.round(y.era*x.IP/9));assert.equal(y.SO,Math.round(x.SO*1.06));for(const k of ['W','L','G','IP'])assert.equal(y[k],x[k]);}
  else assert.deepEqual(x,y);
  assert.equal(s.context.calls,s.afterEffortCalls,'Effort correction consumes zero RNG');
  const paired=b.study.seasons.find(t=>t.context.year===s.context.year&&t.context.lv===s.context.lv);
  const matched=!!paired&&equal(x,paired.beforeEffort)&&s.context.calls===paired.context.calls;
  return {year:s.context.year,lv:s.context.lv,role:s.context.role,eligible,matchedPreCorrection:matched,dDelta:y.d-x.d,eraDelta:y.era-x.era,erDelta:y.ER-x.ER,soDelta:y.SO-x.SO,finalEra:s.final.era,afterEffortEra:y.era};
 });
 for(const t of c.study.tj){assert.equal(t.before.calls,t.after.calls);const expected=(t.before.ab.vel+t.before.ab.brk)/19*({'全力投球':1.25,'通常投球':1,'省エネ投球':.65}[t.before.effort]||1)*(t.before.tjCount>=1?1.15:1);assert(Math.abs(t.after.tj-t.before.tj-expected)<1e-12);}
 const choice=firstDiff(a.choiceHistory,c.choiceHistory),selection=firstDiff(a.choiceHistory,c.choiceHistory,x=>x?{year:x.year,level:x.level,choice:x.choice.split('\n')[0]}:null),rngWindow=firstDiff(b.study.actions,c.study.actions,x=>x?{year:x.before.year,level:x.before.lv,before:x.before.calls,after:x.after.calls}:null);
 const context=firstDiff(b.study.seasons,c.study.seasons,x=>x?{year:x.context.year,lv:x.context.lv,role:x.context.role,ab:x.context.ab,seasonFactor:x.context.seasonFactor,rehab:x.context.rehab,pendStat:x.context.pendStat,calls:x.context.calls,beforeEffort:x.beforeEffort}:null);
 const tj=firstDiff(b.study.tj,c.study.tj,x=>x?{year:x.before.year,lv:x.before.lv,before:x.before.tj,after:x.after.tj,tjCount:x.after.tjCount}:null);
 const stateWithoutVersion=s=>{const x=structuredClone(s);if(x)delete x.version;return x;};
 const firstThreshold=b.study.tj.map((t,index)=>{const n=c.study.tj[index];if(!n||t.before.year!==n.before.year||t.before.lv!==n.before.lv)return null;const bc=t.after.rubber?100:50,nc=n.after.rubber?100:50;return (t.after.tj>=bc)!==(n.after.tj>=nc)?{year:n.before.year,lv:n.before.lv,old:t.after.tj,current:n.after.tj,oldCap:bc,currentCap:nc}:null;}).find(Boolean)||null;
 evidence.push({seed:c.seed,strategy:c.strategy,completedOld:a.completed,completedCurrent:c.completed,failureCurrent:c.failure,firstChoiceDivergence:choice,firstSelectionDivergence:selection,firstActionRngOrTimelineDivergence:rngWindow,firstPreCorrectionContextDivergence:context,firstTjDivergence:tj,firstThresholdDivergence:firstThreshold,identicalChoices:!choice,identicalFinalStateExceptVersion:equal(stateWithoutVersion(a.fullState),stateWithoutVersion(c.fullState)),oldActions:a.actions,currentActions:c.actions,oldRng:a.calls,currentRng:c.calls,oldRetirementYear:a.fullState?.year,currentRetirementYear:c.fullState?.year,oldTjCount:a.fullState?.tjCount,currentTjCount:c.fullState?.tjCount,directCorrections:direct});
}
const burden=d=>({professionalCareers:d.results.filter(r=>r.seasons.length).length,firstTeamCareers:d.results.filter(r=>r.seasons.some(s=>Object.values(levels).includes(s.lv)&&s.st.G>0&&s.st.IP>0)).length,notProfessionalSeeds:d.results.filter(r=>!r.seasons.length).map(r=>r.seed),notFirstTeamSeeds:d.results.filter(r=>!r.seasons.some(s=>Object.values(levels).includes(s.lv)&&s.st.G>0&&s.st.IP>0)).map(r=>r.seed),tjCountTotal:sum(d.results.map(r=>r.fullState?.tjCount||0)),tjCountDistribution:dist(d.results.map(r=>r.fullState?.tjCount||0)),careersWithTjCount:d.results.filter(r=>(r.fullState?.tjCount||0)>0).length,explicitSurgeryChoices:sum(d.results.map(r=>r.study.surgeries.filter(x=>x.kind==='surgery').length)),failedInjectionEvents:sum(d.results.map(r=>r.study.surgeries.filter(x=>x.kind==='fail').length)),successfulInjectionEvents:sum(d.results.map(r=>r.study.surgeries.filter(x=>x.kind==='inject').length)),tjAccrualDistribution:dist(d.results.flatMap(r=>r.study.tj.map(t=>t.after.tj-t.before.tj))),rehabSeasonObservations:sum(d.results.map(r=>r.seasons.filter(s=>s.rehab>0).length)),fullRestLogYears:sum(d.results.map(r=>r.fullState?.log?.filter(l=>/全休/.test(l.line||'')).length||0)),allProfessionalRecordedSeasons:sum(d.results.map(r=>r.seasons.length)),totalRng:sumR(d),totalActions:sumActions(d)});
const groups=analysis.groups.map(g=>{const previous=historic.groups.find(x=>x.league===g.league&&x.role===g.role),tj=current.results.flatMap(r=>r.study.tj.filter(t=>t.before.lv===levels[g.league]&&t.before.role===g.role));return {league:g.league,role:g.role,oldSeasons:previous.seasons,currentSeasons:g.seasons,oldCareers:previous.careers,currentCareers:g.careers,oldDistributions:previous.distributions||null,currentDistributions:g.distributions||null,currentTjAccrual:dist(tj.map(t=>t.after.tj-t.before.tj)),missingSeasonsTo200:Math.max(0,200-g.seasons),missingSeedsTo30:Math.max(0,30-g.careers),plans:g.plans||null};});
const comparison={oldCommit:archived.commit,currentCommit:current.commit,oldVersion:archived.version,currentVersion:current.version,baselineObservationChecks:baselineChecks,allBaselineChecksPassed:true,oldBurden:burden(control),currentBurden:burden(current),identicalChoiceCareers:evidence.filter(x=>x.identicalChoices).length,divergedChoiceCareers:evidence.filter(x=>!x.identicalChoices).length,identicalFinalStateExceptVersion:evidence.filter(x=>x.identicalFinalStateExceptVersion).length,matchedPreCorrectionSeasons:sum(evidence.map(x=>x.directCorrections.filter(y=>y.matchedPreCorrection).length)),firstThresholdDivergenceCareers:evidence.filter(x=>x.firstThresholdDivergence).length,directCorrections:sum(evidence.map(x=>x.directCorrections.filter(y=>y.eligible).length)),groups,candidateEstimates:Object.fromEntries(['A','B','C'].map(k=>[k,{old:historic.careerEstimates[k],current:analysis.careerEstimates[k]}])),evidence};
analysis.burden=comparison.currentBurden;analysis.studyChecks={baselineIdenticalCareers:100,rngValuesCountMatches:true,effortCorrectionFormulaAndZeroRng:true,tjFormulaAndZeroRng:true};
analysis.failedAndNoSampleRecords=current.results.filter(r=>!r.completed||!r.seasons.some(s=>Object.values(levels).includes(s.lv)&&s.st.G>0&&s.st.IP>0)).map(r=>({seed:r.seed,completed:r.completed,failure:r.failure,professional:r.seasons.length>0,firstTeam:false}));
analysis.firstRoundFilesSha256=Object.fromEntries(['research.mjs','analyze.mjs','careers.json','analysis.json','RESEARCH_REPORT.md'].map(f=>[f,createHash('sha256').update(fs.readFileSync(new URL(f,old))).digest('hex')]));
fs.writeFileSync(new URL('analysis.json',here),JSON.stringify(analysis,null,2));fs.writeFileSync(new URL('comparison.json',here),JSON.stringify(comparison,null,2));
console.log(JSON.stringify({completed:analysis.completed,failures:analysis.failures,groups:groups.map(g=>({league:g.league,role:g.role,seasons:g.currentSeasons,careers:g.currentCareers})),oldBurden:comparison.oldBurden,currentBurden:comparison.currentBurden,choiceDiverged:comparison.divergedChoiceCareers,candidates:Object.fromEntries(['A','B','C'].map(k=>[k,{old:historic.careerEstimates[k].expectedPlayersPer100,current:analysis.careerEstimates[k].expectedPlayersPer100}]))},null,2));

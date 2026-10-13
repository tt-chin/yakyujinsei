// DESIGN ONLY. No engine imports, award draws, RNG or natural-career execution.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readStudy} from '../pitcher-tc-research-1119/storage.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../../',here);
const old=JSON.parse(fs.readFileSync(new URL('HISTORICAL_SENSITIVITY.json',here)));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const before=paths.map(p=>[p,sha(new URL(p,root))]);
const weights={W:.25,era:.30,IP:.25,SO:.15,WPCT:.05};
const anchors={W:[12,17],era:[3.2,2.2],IP:[143,180],SO:[155,215],WPCT:[.65,.85]};
export function probability(qualified,score){
 if(!qualified||!Number.isFinite(score)||score<60)return 0;
 if(score>=95)return 100;
 return Math.min(95,10+2.5*(score-60));
}
export function evaluate(s){
 const valid=['G','W','L','IP','SO','era'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&Number.isFinite(s.W+s.L)&&s.W+s.L>0;
 if(!valid)return {valid:false,qualified:false,score:null,probabilityPercent:0,guaranteed:false};
 const values={...s,WPCT:s.W/(s.W+s.L)};
 const components=Object.fromEntries(Object.entries(anchors).map(([k,[lo,hi]])=>[k,100*Math.max(0,Math.min(1,(values[k]-lo)/(hi-lo)))]));
 const score=Object.entries(weights).reduce((n,[k,w])=>n+components[k]*w,0);
 const qualified=s.level==='NPB1'&&s.role==='SP'&&s.G>0&&s.W>=13&&s.IP>=143&&s.era<=3.2;
 return {valid,qualified,components,score,probabilityPercent:probability(qualified,score),guaranteed:qualified&&score>=95};
}
const started=Date.now();let pass=0;
const test=(name,fn)=>{fn();pass++;};
const points=[[59.999,0],[60,10],[60.001,10.0025],[65,22.5],[70,35],[75,47.5],[80,60],[85,72.5],[90,85],[94,95],[94.999,95],[95,100],[95.001,100],[100,100]];
for(const [score,p]of points)test('probability '+score,()=>assert(Math.abs(probability(true,score)-p)<1e-10));
const s={level:'NPB1',role:'SP',G:30,W:17,L:0,IP:180,era:2.2,SO:215};
test('weights',()=>assert.equal(Object.values(weights).reduce((n,v)=>n+v,0),1));
for(const [IP,p]of [[143,0],[150,700/37],[160,1700/37],[170,2700/37],[180,100],[190,100],[200,100]])test('IP '+IP,()=>assert(Math.abs(evaluate({...s,IP}).components.IP-p)<1e-10));
for(const k of ['W','IP','SO'])test('monotonic '+k,()=>{let prior=-1;for(const v of [0,12,13,15,17,143,150,160,180,200,1000]){const x=evaluate({...s,[k]:v});assert(x.score>=prior-1e-10);assert(x.score>=0&&x.score<=100+1e-10);prior=x.score;}});
test('ERA inverse',()=>{let prior=-1;for(const era of [9.9,3.2,3,2.7,2.2,1.4,0]){const x=evaluate({...s,era});assert(x.score>=prior-1e-10);prior=x.score;}});
test('WP monotonic',()=>{let prior=-1;for(const L of [100,20,10,5,3,1,0]){const x=evaluate({...s,L});assert(x.score>=prior-1e-10);prior=x.score;}});
for(const patch of [{W:12},{IP:142.999},{era:3.200001},{G:0},{role:'MR'},{level:'KBO1'}])test('qualification',()=>{const x=evaluate({...s,...patch});assert(!x.qualified&&!x.guaranteed&&x.probabilityPercent===0);});
test('ineligible score100',()=>assert.equal(probability(false,100),0));
for(const k of ['G','W','L','IP','SO','era'])for(const v of [undefined,NaN,Infinity,-1,'17'])test('invalid '+k,()=>assert(!evaluate({...s,[k]:v}).valid));
test('zero denominator',()=>assert(!evaluate({...s,W:0,L:0}).valid));
test('zero loss',()=>assert.equal(evaluate(s).components.WPCT,100));
test('decimal IP',()=>assert(evaluate({...s,IP:170.1}).score<evaluate({...s,IP:170+1/3}).score));
test('probability monotonic',()=>{let prior=0;for(let i=0;i<=100000;i++){const p=probability(true,i/1000);assert(p>=prior&&p>=0&&p<=100);prior=p;}});
test('invalid scores',()=>{for(const v of [NaN,Infinity,-1])assert.equal(probability(true,v),0);});
const mobile=evaluate(old.manual);
test('mobile',()=>{assert(mobile.qualified&&!mobile.guaranteed);assert(Math.abs(mobile.score-68.79545454545455)<1e-10);assert(Math.abs(mobile.probabilityPercent-31.98863636363636)<1e-10);});
const groups=[];
for(const source of old.sources){const file=new URL(source.file,root);assert.equal(sha(file),source.sha256);const data=readStudy(file);const rows=data.results.flatMap(r=>r.seasons.filter(x=>x.lv==='NPB1'&&x.role==='SP'&&x.st.G>0&&x.st.IP>0).map(x=>({...x.st,level:x.lv,role:x.role,seed:r.seed,year:x.year})));const values=rows.map(evaluate);groups.push({group:source.group,n:rows.length,independentSeeds:new Set(rows.map(x=>x.seed)).size,qualified:values.filter(x=>x.qualified).length,guaranteed:values.filter(x=>x.guaranteed).length,expectedAwards:values.reduce((n,x)=>n+x.probabilityPercent/100,0),interpretation:'OFFLINE_EXPECTATION; no actual draws'});}
for(const [p,hash]of before)assert.equal(sha(new URL(p,root)),hash,'Tracked input changed: '+p);
const result={status:'APPROVED / DESIGN_ONLY; NOT PRODUCT IMPLEMENTATION',selectedDesign:{id:'IP180/S3/B2/G95',weights,anchors,minimumScore:60,startProbabilityPercent:10,slopePercentagePointsPerScore:2.5,nonGuaranteeCapPercent:95,guaranteeScore:95},head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version:fs.readFileSync(new URL('docs/src/config.js',root),'utf8').match(/VERSION\s*=\s*['"]([^'"]+)/)[1],toolSha256:sha(new URL(import.meta.url)),precision:'Unrounded double calculation; 1e-10 assertion tolerance only, no product tolerance approval',boundary:points.map(([score,expected])=>({evidence:'SYNTHETIC_SCENARIO / MATHEMATICAL_SCORE_POINT',score,expectedPercent:expected,actualPercent:probability(true,score),status:'PASS'})),ipPoints:[143,150,160,170,180,190,200].map(IP=>({IP,component:evaluate({...s,IP}).components.IP})),mobile:{evidence:'MANUAL_MOBILE_EVIDENCE / OFFLINE_ESTIMATE',input:old.manual,result:mobile},scenarios:old.scenarios.map(x=>({id:x.id,evidence:x.evidence,result:evaluate(x)})),sourceGroups:groups,sources:old.sources,tests:{PASS:pass,FAIL:0,NOT_RUN:['Product RNG sequence compatibility','Game Quick/Full','CI/Preview','New natural careers/replays','Product award acceptance']},trackedInputsUnchanged:before.length,seconds:(Date.now()-started)/1000};
fs.writeFileSync(new URL('b2-final-analysis.json',here),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({tests:result.tests,boundary:result.boundary,mobile:result.mobile.result,seconds:result.seconds,trackedInputsUnchanged:before.length},null,2));

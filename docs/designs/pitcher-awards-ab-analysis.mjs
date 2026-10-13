// DESIGN_ONLY / NOT_IMPLEMENTED. Default selected CURVE_B (NPB P04 min12).
// --legacy13 reproduces the historical A/B comparison with NPB P04 min13.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readStudy} from '../reviews/pitcher-tc-research-1119/storage.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../',here);
const output=new URL('PITCHER_AWARDS_D2_ANALYSIS.json',here);
const old=JSON.parse(fs.readFileSync(output));
const manifest=JSON.parse(fs.readFileSync(new URL('../reviews/pitcher-awards-d21/HISTORICAL_SENSITIVITY.json',here))).sources;
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const protectedFiles=tracked.filter(p=>p!=='docs/designs/PITCHER_AWARDS_D2_ANALYSIS.json').map(p=>[p,hash(new URL(p,root))]);
const start=Date.now(),statusBefore=git('status','--short');
const levels={CPBL:'CPBL1',KBO:'KBO1',NPB:'NPB1',MLB:'MLB'};
const winLines={CPBL:[10,15],KBO:[12,17],NPB:[12,17],MLB:[14,20]};
const ipLines={CPBL:120,KBO:144,NPB:143,MLB:162};
const soLines={CPBL:[130,180],KBO:[156,216],NPB:[155,215],MLB:[175,240]};
const count=x=>Number.isSafeInteger(x)&&x>=0;
const number=x=>Number.isFinite(x)&&x>=0;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const sum=a=>a.reduce((n,x)=>n+x,0);
export function p01(league,W,curve){const t=winLines[league];if(!t||!count(W)||W<t[0])return 0;if(W>=t[1])return 1;return (curve==='A'?clamp(30+8*(W-t[0]),30,95):20+75*(W-t[0])/(t[1]-t[0]))/100;}
export function p04(league,W,L,curve,minimumNPB=13){const min={NPB:minimumNPB,KBO:10}[league];if(!min||!count(W)||!count(L)||!Number.isSafeInteger(W+L)||W+L===0||W<min)return 0;const wp=W/(W+L);if(wp<.65)return 0;if(wp>=.85)return 1;return (curve==='A'?clamp(25+Math.round((wp-.65)*150),25,95):20+300*(wp-.65))/100;}
function p02(row){const s=row.st;if(row.role!=='SP'||!number(s.era)||!number(s.IP)||s.era>3.2||s.IP<ipLines[row.league])return 0;if(s.era<=2.2&&s.IP>=Math.max(150,ipLines[row.league]))return 1;return clamp(30+Math.round((3.2-s.era)*35+(s.IP-ipLines[row.league])*.4),30,95)/100;}
function p03(row){const s=row.st,[b,g]=soLines[row.league];if(!count(s.SO)||s.SO<b)return 0;return s.SO>=g?1:clamp(25+Math.round((s.SO-b)*1.2),25,95)/100;}
function selectedAnalysis(){
 const historical=old.P01P04ABAnalysis;assert(historical?.seasonRows,'Historical 13-win analysis required; do not invent rows');
 const historicalHash=createHash('sha256').update(JSON.stringify(historical)).digest('hex');
 let passed=0;const test=(n,f)=>{f();passed++;};
 const boundaries=[['NPB',11,0,0],['NPB',12,0,100],['NPB',12,6,25],['NPB',12,7,0],['NPB',13,7,20],['NPB',13,2,100],['KBO',9,0,0],['KBO',10,5,25],['KBO',10,2,75],['KBO',10,1,100]];
 for(const [lg,W,L,p]of boundaries)test('approved P04 boundary',()=>assert(Math.abs(p04(lg,W,L,'B',12)*100-p)<1e-10));
 for(const lg of ['NPB','KBO'])for(const [W,L]of [[0,0],[-1,0],[12,-1],[12.1,0],[12,.1],[NaN,0],[12,Infinity],[undefined,0],[12,undefined],['12',0],[Number.MAX_SAFE_INTEGER+1,0]])test('invalid W-L',()=>assert.equal(p04(lg,W,L,'B',12),0));
 for(const [lg,[b,g]]of Object.entries(winLines))test('P01 B thresholds',()=>{assert.equal(p01(lg,b-1,'B'),0);assert.equal(p01(lg,b,'B'),.2);assert.equal(p01(lg,g,'B'),1);for(let W=b;W<g;W++)assert(Math.abs(p01(lg,W,'B')-(20+75*(W-b)/(g-b))/100)<1e-12);});
 test('unchanged win lines',()=>assert.deepEqual(winLines,{CPBL:[10,15],KBO:[12,17],NPB:[12,17],MLB:[14,20]}));
 test('legacy13 reachable',()=>assert.equal(p04('NPB',12,0,'B',13),0));
 for(const lg of ['NPB','KBO'])test('monotonic and range',()=>{let last=0;for(let L=100;L>=0;L--){const p=p04(lg,17,L,'B',12);assert(p>=last&&p<=1);last=p;}});
 const sourceChecks=[];
 for(const src of manifest){const file=new URL(src.file,root);assert.equal(hash(file),src.sha256);readStudy(file);sourceChecks.push({file:src.file,sha256:src.sha256,indexAndTrace:'VERIFIED'});}
 const seasonRows=historical.seasonRows.map(r=>{const B=p01(r.league,r.st.W,'B'),q=['NPB','KBO'].includes(r.league)?p04(r.league,r.st.W,r.st.L,'B',12):null;
  test('P01 unchanged',()=>assert.equal(B,r.P01?.B||0));test('P04 range',()=>assert(q===null||(q>=0&&q<=1)));if(r.league==='KBO')test('KBO unchanged',()=>assert.equal(q,r.P04?.B||0));
  return{group:r.group,caseId:r.caseId,seed:r.seed,strategy:r.strategy,year:r.year,league:r.league,W:r.st.W,L:r.st.L,P01B:B,P04B:q,historicalP04B:r.P04?.B??null};
 });
 const summary=[],concentration=[];
 for(const group of [...new Set(seasonRows.map(r=>r.group))].concat(historical.sourceInventory.map(r=>r.group)).filter((v,i,a)=>a.indexOf(v)===i))for(const league of Object.keys(levels)){
  const rows=seasonRows.filter(r=>r.group===group&&r.league===league),oldSummary=historical.summary.find(r=>r.group===group&&r.league===league),previous=oldSummary.P04;
  const now=['NPB','KBO'].includes(league)?{validSeasons:rows.length,winQualified:rows.filter(r=>r.W>=({NPB:12,KBO:10}[league])&&r.W+r.L>0).length,qualified:rows.filter(r=>r.P04B>0).length,guaranteed:rows.filter(r=>r.P04B===1).length,notQualified:rows.filter(r=>!r.P04B).length,expectedB:sum(rows.map(r=>r.P04B)),seeds:new Set(rows.map(r=>r.seed)).size}:{status:'N/A'};
  const delta=previous.status?null:{qualified:now.qualified-previous.qualified,guaranteed:now.guaranteed-previous.guaranteed,expectedB:now.expectedB-previous.expectedB};
  if(league==='KBO')test('KBO aggregate',()=>assert(delta.qualified===0&&delta.guaranteed===0&&Math.abs(delta.expectedB)<1e-12));
  test('P01 aggregate',()=>assert(Math.abs(sum(rows.map(r=>r.P01B))-oldSummary.P01.expectedB)<1e-12));
  summary.push({group,league,historicalMinimumWins:league==='NPB'?13:league==='KBO'?10:null,selectedMinimumWins:league==='NPB'?12:league==='KBO'?10:null,P01B:oldSummary.P01.expectedB,historicalP04:previous,selectedP04:now,delta});
  const seeds=[...new Set(rows.map(r=>r.seed))],total=sum(rows.map(r=>r.P01B+(r.P04B||0))),p04Total=now.expectedB||0;
  const perSeed=seeds.map(seed=>{const s=rows.filter(r=>r.seed===seed),P01=sum(s.map(r=>r.P01B)),P04=['NPB','KBO'].includes(league)?sum(s.map(r=>r.P04B)):null;return{seed,effectiveSeasons:s.length,P01B:P01,P04B:P04,combined:P01+(P04||0),combinedShare:total?(P01+(P04||0))/total:null,P04Share:p04Total?P04/p04Total:null};}).sort((a,b)=>b.combined-a.combined);
  concentration.push({group,league,total,rows:perSeed,maxShare:total?perSeed[0].combinedShare:null,top3Share:total&&seeds.length>=3?sum(perSeed.slice(0,3).map(r=>r.combinedShare)):null,historicalB:historical.seedConcentration.find(r=>r.group===group&&r.league===league).shares.B});
 }
 const results={status:'APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED',head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),version:fs.readFileSync(new URL('../src/config.js',here),'utf8').match(/VERSION\s*=\s*['"]([^'"]+)/)[1],toolSha256:hash(new URL(import.meta.url)),selectedDesign:{P01:{curve:'CURVE_B',thresholds:winLines,formula:'W<B 0; B<=W<G:20+75*(W-B)/(G-B)%; W>=G 100%'},P04:{curve:'CURVE_B',minimumWins:{NPB:12,KBO:10},basicWP:.65,guaranteeWP:.85,formula:'invalid or W below minimum or WP<.65:0; .65<=WP<.85:20+300*(WP-.65)%; WP>=.85:100%',input:'nonnegative finite safe integer W/L; raw ratio; no missing-value fabrication'}},historicalAnalysisSha256:historicalHash,sources:sourceChecks,summary,seedConcentration:concentration,seasonRows,newlyQualified:seasonRows.filter(r=>r.league==='NPB'&&r.P04B>0&&!(r.historicalP04B>0)),boundary:boundaries.map(([league,W,L,expectedPercent])=>({evidence:'SYNTHETIC_SCENARIO',league,W,L,expectedPercent,actualPercent:100*p04(league,W,L,'B',12),status:'PASS'})),P07:'UNCHANGED: historical p07 values not recomputed or modified; P04 is not in triple crown',P08:'UNCHANGED: P08 W>=13 remains independent of P04 NPB W>=12',tests:{PASS:passed,FAIL:0,NOT_RUN:['Product Quick/Full/CI','Natural career generation','Product/RNG execution','Awards implementation']},workingTreeBefore:statusBefore,seconds:(Date.now()-start)/1000};
 for(const [p,sha]of protectedFiles)assert.equal(hash(new URL(p,root)),sha,'Protected tracked input changed');
 const next={...old,P01P04SelectedDesignAnalysis:results};assert.deepEqual(next.P01P04ABAnalysis,old.P01P04ABAnalysis);fs.writeFileSync(output,JSON.stringify(next,null,2)+'\n');
 console.log(JSON.stringify({head:results.head,version:results.version,tests:results.tests,npb:summary.filter(r=>r.league==='NPB'),newlyQualified:results.newlyQualified,seconds:results.seconds},null,2));
}
if(!process.argv.includes('--legacy13')){selectedAnalysis();process.exit(0);}
let passed=0;const test=(name,f)=>{f();passed++;};
const boundaryCases=[['NPB',12,0],['NPB',13,7],['NPB',13,3],['NPB',13,2],['NPB',13,0],['KBO',9,0],['KBO',10,5],['KBO',10,2],['KBO',10,1],['NPB',17,3]];
for(const [lg,W,L]of boundaryCases)test('W-L '+lg+W+'/'+L,()=>{const a=p04(lg,W,L,'A'),b=p04(lg,W,L,'B');assert(a>=0&&a<=1&&b>=0&&b<=1);if(W<({NPB:13,KBO:10}[lg]))assert(a===0&&b===0);else if(W/(W+L)>=.85)assert(a===1&&b===1);else assert(a>0&&a<1&&b>0&&b<1);});
for(const lg of ['NPB','KBO'])for(const [W,L]of [[0,0],[-1,7],[13,-1],[13.1,7],[13,7.1],[NaN,7],[13,NaN],[Infinity,7],[13,Infinity],[undefined,7],[13,undefined],['13',7]])test('invalid',()=>assert(p04(lg,W,L,'A')===0&&p04(lg,W,L,'B')===0));
for(const [lg,[b,g]]of Object.entries(winLines))for(const c of ['A','B'])test('P01 '+lg+c,()=>{let prior=0;for(let W=0;W<=g+2;W++){const v=p01(lg,W,c);assert(v>=prior&&v<=1);prior=v;}assert.equal(p01(lg,b-1,c),0);assert.equal(p01(lg,g,c),1);});
test('MLB normalized',()=>assert.equal(p01('MLB',15,'B'),.325));
test('Math.round precision',()=>assert.equal(p04('KBO',10,5,'A'),(25+Math.round((10/15-.65)*150))/100));
for(const lg of ['NPB','KBO'])for(const c of ['A','B'])test('P04 monotonic '+lg+c,()=>{let prior=0;for(let L=100;L>=0;L--){const p=p04(lg,17,L,c);assert(p>=prior&&p>=0&&p<=1);prior=p;}});
test('P04 other leagues',()=>assert(p04('CPBL',20,0,'A')===0&&p04('MLB',20,0,'B')===0));
test('zero loss gate',()=>assert(p04('NPB',12,0,'A')===0&&p04('NPB',13,0,'A')===1));
test('P02 CPBL extra IP150',()=>{const r={league:'CPBL',role:'SP',st:{era:2.2,IP:149}};assert(p02(r)<1);r.st.IP=150;assert.equal(p02(r),1);});
const awardCode=fs.readFileSync(new URL('../src/engine/game.js',here),'utf8');
for(const [lg,[b,g]]of Object.entries(soLines))test('native '+lg,()=>assert(new RegExp(lg+':\\s*\\{[^\\n]*g: '+ipLines[lg]+'[^\\n]*so: \\['+b+', '+g+'\\]').test(awardCode)));
const result={status:'ANALYSIS_ONLY / DESIGN_ONLY / PROPOSAL / NOT_APPROVED',head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),version:fs.readFileSync(new URL('../src/config.js',here),'utf8').match(/VERSION\s*=\s*['"]([^'"]+)/)[1],toolSha256:hash(new URL(import.meta.url)),formulas:{P01A:'W<B:0; B<=W<G:clamp(30+8*(W-B),30,95)%; W>=G:100%',P01B:'W<B:0; B<=W<G:20+75*(W-B)/(G-B)%; W>=G:100%',P04A:'minimum W and integer W/L first; raw WP<.65:0; WP<.85:clamp(25+Math.round((WP-.65)*150),25,95)%; >=.85:100%',P04B:'same qualification; WP<.65:0; WP<.85:20+300*(WP-.65)%; >=.85:100%'},winLines,sourceInventory:[],dataQuality:[],summary:[],seedConcentration:[],seasonRows:[],p07:[],boundary:boundaryCases.map(([league,W,L])=>({evidence:'SYNTHETIC_SCENARIO',league,W,L,WP:W/(W+L),pA:p04(league,W,L,'A'),pB:p04(league,W,L,'B')})),dataGaps:['No global immutable playerId in career state: unique player count N/A; seed and strategy-specific career-case counts reported separately','No new-award product draws or P07 history: independence not established; joint probabilities are model estimates only','No natural v1.12.0 research in these archived sources','Zero target MLB sample for tob0ilu0 is not evidence of impossibility'],excludedInventory:[],workingTreeBefore:statusBefore};
const inventory=execFileSync('rg',['--files','-g','*careers*.json','-g','*.csv'],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean).map(p=>p.replaceAll('\\','/'));
for(const p of inventory)if(!manifest.some(m=>m.file===p))result.excludedInventory.push({file:p,reason:p.includes('replay')?'Replay verification, not an independent new career':p.endsWith('pitcher-d2-two-seed-natural/careers.json')?'Aggregate alias of four route indexes':p.endsWith('careers-CPBL.json')?'Environment-blocked attempt before gameplay':'UNVERIFIED SOURCE; not silently pooled'});
function stats(rows,k){const valid=rows.filter(r=>r[k]!==null),qual=valid.filter(r=>r[k].A>0),god=valid.filter(r=>r[k].A===1),A=sum(valid.map(r=>r[k].A)),B=sum(valid.map(r=>r[k].B));return{applicable:true,validSeasons:valid.length,validSeeds:new Set(valid.map(r=>r.seed)).size,validCareerCases:new Set(valid.map(r=>r.caseId)).size,validPlayers:null,winQualified:k==='P04'?valid.filter(r=>r.st.W>=({NPB:13,KBO:10}[r.league])&&r.WP!==null).length:null,qualified:qual.length,guaranteed:god.length,notQualified:valid.length-qual.length,invalidData:rows.length-valid.length,expectedA:A,expectedB:B,delta:B-A,relativeChange:A?(B-A)/A:null,qualifiedMeanA:qual.length?A/qual.length:null,qualifiedMeanB:qual.length?B/qual.length:null};}
for(const src of manifest){const file=new URL(src.file,root);assert.equal(hash(file),src.sha256,'Source index changed');const data=readStudy(file);assert.equal(data.version,src.version);assert.equal(data.commit,src.commit);
 const seen=new Map(),conflicts=new Set(),quality={group:src.group,rawSeasons:0,wrongLevelOrPosition:0,noAppearance:0,invalidAppearance:0,missingIdentity:0,duplicateIdentical:0,duplicateConflict:0,missingFields:Object.fromEntries(['G','W','L','era','IP','SO'].map(k=>[k,0])),invalidFields:Object.fromEntries(['G','W','L','era','IP','SO'].map(k=>[k,0]))};
 for(const career of data.results)for(const row of career.seasons){quality.rawSeasons++;const league=Object.keys(levels).find(l=>levels[l]===row.lv);if(!league||row.pos!=='P'){quality.wrongLevelOrPosition++;continue;}const s=row.st||{};for(const k of Object.keys(quality.missingFields)){if(s[k]===undefined)quality.missingFields[k]++;else if(!(['W','L','SO'].includes(k)?count(s[k]):number(s[k])))quality.invalidFields[k]++;}if(!number(s.G)||!number(s.IP)){quality.invalidAppearance++;continue;}if(!s.G||!s.IP||row.seasonFactor===0){quality.noAppearance++;continue;}if(!career.seed||!Number.isInteger(row.year)){quality.missingIdentity++;continue;}
 const caseId=src.group+'|'+career.seed+'|'+career.pos+'|'+career.strategy,key=caseId+'|'+row.year+'|'+league;
 const record={group:src.group,version:data.version,caseId,seed:career.seed,strategy:career.strategy,year:row.year,league,level:row.lv,role:row.role,st:s,seasonFactor:row.seasonFactor};
 if(seen.has(key)){if(JSON.stringify(seen.get(key))===JSON.stringify(record))quality.duplicateIdentical++;else{quality.duplicateConflict++;conflicts.add(key);}continue;}seen.set(key,record);
 }
 const rows=[...seen.entries()].filter(([key])=>!conflicts.has(key)).map(([,r])=>{const s=r.st;r.P01=count(s.W)?{A:p01(r.league,s.W,'A'),B:p01(r.league,s.W,'B')}:null;r.P04=['NPB','KBO'].includes(r.league)&&count(s.W)&&count(s.L)&&Number.isSafeInteger(s.W+s.L)?{A:p04(r.league,s.W,s.L,'A'),B:p04(r.league,s.W,s.L,'B')}:null;r.WP=count(s.W)&&count(s.L)&&s.W+s.L>0?s.W/(s.W+s.L):null;r.p02=number(s.era)&&number(s.IP)&&['SP','MR','CL'].includes(r.role)?p02(r):null;r.p03=count(s.SO)?p03(r):null;
 if(r.P01&&r.p02!==null&&r.p03!==null){r.P07=Object.fromEntries(['A','B'].map(c=>{const p1=r.P01[c],p2=r.p02,p3=r.p03;return[c,{lower:Math.max(0,p1+p2+p3-2),product:p1*p2*p3,upper:Math.min(p1,p2,p3)}];}));}else r.P07=null;return r;});
 result.sourceInventory.push({...src,interpretation:'Existing natural production-browser careers, NOT new execution',strategies:[...new Set(data.results.map(r=>r.strategy))],careers:data.results.length,completed:data.results.filter(r=>r.completed).length,failed:data.results.filter(r=>!r.completed).length,stablePlayerId:'DATA_GAP'});result.dataQuality.push(quality);result.seasonRows.push(...rows);
 for(const league of Object.keys(levels)){const subset=rows.filter(r=>r.league===league);const entry={group:src.group,version:data.version,league,effectiveSeasons:subset.length,seeds:new Set(subset.map(r=>r.seed)).size,players:null,P01:stats(subset,'P01'),P04:['NPB','KBO'].includes(league)?stats(subset,'P04'):{status:'N/A'}};result.summary.push(entry);
 const keys=[...new Set(subset.map(r=>r.seed))];const seedRows=keys.map(seed=>{const rs=subset.filter(r=>r.seed===seed);return{seed,effectiveSeasons:rs.length,P01A:sum(rs.map(r=>r.P01?.A||0)),P01B:sum(rs.map(r=>r.P01?.B||0)),P04A:['NPB','KBO'].includes(league)?sum(rs.map(r=>r.P04?.A||0)):null,P04B:['NPB','KBO'].includes(league)?sum(rs.map(r=>r.P04?.B||0)):null};});
 const concentration={group:src.group,league,rows:seedRows,totals:{},shares:{}};for(const c of ['A','B']){const total=sum(seedRows.map(r=>r['P01'+c]+(r['P04'+c]||0)));concentration.totals[c]=total;const ordered=seedRows.map(r=>({seed:r.seed,combined:r['P01'+c]+(r['P04'+c]||0),combinedShare:total?(r['P01'+c]+(r['P04'+c]||0))/total:null,P01Share:entry.P01['expected'+c]?r['P01'+c]/entry.P01['expected'+c]:null,P04Share:entry.P04['expected'+c]?r['P04'+c]/entry.P04['expected'+c]:null})).sort((a,b)=>b.combined-a.combined);concentration.shares[c]={ordered,maxShare:total?ordered[0]?.combinedShare:null,top3Share:total&&keys.length>=3?sum(ordered.slice(0,3).map(x=>x.combinedShare)):null,top3Status:keys.length<3?'N/A: fewer than 3 observed seeds':total?'CALCULATED':'N/A: zero expected awards'};}result.seedConcentration.push(concentration);
 const triples=subset.filter(r=>r.P07!==null),joint=triples.filter(r=>r.P01.A>0&&r.p02>0&&r.p03>0);const totals=Object.fromEntries(['A','B'].map(c=>[c,Object.fromEntries(['lower','product','upper'].map(k=>[k,sum(triples.map(r=>r.P07[c][k]))]))]));result.p07.push({group:src.group,league,seasonsWithAllInputs:triples.length,missingData:subset.length-triples.length,coqualified:joint.length,seeds:new Set(joint.map(r=>r.seed)).size,totals,productDelta:totals.B.product-totals.A.product,deltaBounds:{lower:totals.B.lower-totals.A.upper,upper:totals.B.upper-totals.A.lower},possibleMvpGuaranteeDeltaModel:totals.B.product-totals.A.product,interpretation:'MODEL_ESTIMATE / INDEPENDENCE_ASSUMPTION; Frechet bounds require no independence; MVP total increase cannot be inferred'});
 }
 assert.equal(hash(file),src.sha256);readStudy(file); // Check index and action trace hashes again.
}
for(const r of result.seasonRows){test('probability range',()=>{for(const v of [r.P01?.A,r.P01?.B,r.P04?.A,r.P04?.B,r.p02,r.p03].filter(v=>v!=null))assert(v>=0&&v<=1);});if(r.P01)test('P01 same qualifiers',()=>assert((r.P01.A>0)===(r.P01.B>0)&&(r.P01.A===1)===(r.P01.B===1)));if(r.P04)test('P04 same qualifiers',()=>assert((r.P04.A>0)===(r.P04.B>0)&&(r.P04.A===1)===(r.P04.B===1)));if(r.P07)test('joint bounds',()=>{for(const c of ['A','B'])assert(r.P07[c].lower<=r.P07[c].product+1e-12&&r.P07[c].product<=r.P07[c].upper+1e-12);});}
for(const entry of result.summary)for(const k of ['P01','P04'])if(!entry[k].status)test('summary recomputation',()=>{const rows=result.seasonRows.filter(r=>r.group===entry.group&&r.league===entry.league&&r[k]);for(const c of ['A','B'])assert(Math.abs(sum(rows.map(r=>r[k][c]))-entry[k]['expected'+c])<1e-12);assert.equal(entry[k].qualified,rows.filter(r=>r[k].B>0).length);assert.equal(entry[k].guaranteed,rows.filter(r=>r[k].B===1).length);});
for(const [p,sha]of protectedFiles)assert.equal(hash(new URL(p,root)),sha,'Protected tracked file changed');
result.tests={PASS:passed,FAIL:0,NOT_RUN:['Product Quick/Full/CI','New natural careers/RNG draws','Award product tests','Independent joint draw validation']};result.seconds=(Date.now()-start)/1000;result.workingTreeAfter=git('status','--short');
// Existing derived JSON extension only; keep all pre-existing fields exactly by value.
const generated={...old,P01P04ABAnalysis:result};assert.deepEqual(Object.fromEntries(Object.entries(generated).filter(([k])=>k!=='P01P04ABAnalysis')),Object.fromEntries(Object.entries(old).filter(([k])=>k!=='P01P04ABAnalysis')));
if(process.argv.includes('--verify')){
 for(const key of ['summary','seasonRows','seedConcentration','p07','dataQuality','sourceInventory'])assert.deepEqual(result[key],old.P01P04ABAnalysis[key],'Historical 13-win reproducibility: '+key);
}else fs.writeFileSync(output,JSON.stringify(generated,null,2)+'\n');
console.log(JSON.stringify({head:result.head,version:result.version,sources:result.sourceInventory.length,seasons:result.seasonRows.length,tests:result.tests,quality:result.dataQuality,summary:result.summary.filter(r=>r.P01.expectedA||r.P04.expectedA),p07:result.p07.filter(r=>r.coqualified),seconds:result.seconds},null,2));

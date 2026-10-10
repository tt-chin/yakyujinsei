// Recalculate A/B/C only on captured data. Candidate models are not production policy.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildFixedCases,buildSpecialCases,measure,components,leagues,labels,firstLevels,createProductionHarness} from './retirement-hof-test-support.mjs';
import {honorScoreFor} from '../docs/src/engine/hall-of-fame-policy.js';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const input=arg('input');if(!input)throw Error('Use --input=<actual pilot JSON>');
const pilot=JSON.parse(await readFile(input,'utf8')),votes=arg('votes')?JSON.parse(await readFile(arg('votes'),'utf8')):null;
for(const extra of votes?.results||[]){const r=pilot.results.find(r=>r.seed===extra.seed&&r.strategy===extra.strategy);assert.equal(extra.finalStateDigest,r.finalStateDigest);assert.equal(extra.actionDigest,r.actionDigest);assert.equal(extra.calls,r.calls);r.voteCards=extra.voteCards;r.retirementRngState=extra.retirementRngState;}
const thresholds=createProductionHarness({traits:{},honors:[],stats:{}}).snapshot().thresholds;
const tier=(score,th)=>score>=th[0]?0:score>=th[1]?1:score>=th[2]?2:score>=th[3]?3:4;
const floor=(i,h)=>h.mvp||h.aceN?Math.min(i,1):h.king?Math.min(i,2):i;
const ratio=(n,d)=>({n,d,rate:d?n/d:null});
const sum=a=>a.reduce((s,v)=>s+v,0),mean=a=>a.length?sum(a)/a.length:null;
const percentile=(a,p)=>{if(!a.length)return null;const sorted=[...a].sort((a,b)=>a-b),x=(sorted.length-1)*p,lo=Math.floor(x);return sorted[lo]+(sorted[Math.ceil(x)]-sorted[lo])*(x-lo);};
function distribution(rows){const a=rows.map(r=>r.raw),m=mean(a);return {n:a.length,min:a.length?Math.min(...a):null,P10:percentile(a,.1),P25:percentile(a,.25),P50:percentile(a,.5),P75:percentile(a,.75),P90:percentile(a,.9),P99:percentile(a,.99),max:a.length?Math.max(...a):null,mean:m,populationSD:m===null?null:Math.sqrt(mean(a.map(v=>(v-m)**2))),pureTiers:[0,1,2,3,4].map(i=>rows.filter(r=>r.pureTier===i).length),floorTiers:[0,1,2,3,4].map(i=>rows.filter(r=>r.tier===i).length)};}
const withModels=row=>{
 const p=row.pos==='P',st=row.stats,h=row.honor,th=thresholds[row.league];
 const expectedRaw=sum(Object.values(components(st,row.pos)))+h.sc,expectedTier=floor(tier(expectedRaw,th),h);
 row.expected={raw:expectedRaw,tier:expectedTier,candidate:expectedTier<=1,inducted:expectedTier===0};
 row.actual={raw:row.raw,tier:row.tier,candidate:row.candidate,inducted:row.inducted};
 row.calculationMatches=expectedRaw===row.raw&&expectedTier===row.tier;
 assert.ok(row.calculationMatches,'native calculation vs decomposition');
 assert.equal(sum(row.perHonor.map(x=>x.sc))+(row.league==='NPB'?(row.intlCount||0)*80:0)+(row.franchise?200:0),h.sc,'per-honor decomposition');
 row.abnormalReasons=[...(row.pureTier!==row.tier?['award floor changes pure-score tier']:[]),...(p&&st.HLD>0?['HLD has zero native base contribution']:[]),...(row.firstStats&&row.firstStats.yr<st.yr?['bucket contains non-first-team seasons']:[])];
 // A: only add the omitted hold contribution. No new vote RNG or efficiency assumptions.
 const a=row.raw+(p?2*(st.HLD||0):0);
 // B: first-team contribution and bounded efficiency; remove foreign-bucket globals.
 const first=row.firstStats||st,part=components(first,row.pos),basic=sum(Object.values(part));
 const era=first.IP>0?9*first.ER/first.IP:null,obp=first.PA>0?(first.H+first.BB)/first.PA:null;
 const efficiency=p?(era===null?1:Math.max(.8,Math.min(1.2,1+(4-era)*.06))):(obp===null?1:Math.max(.8,Math.min(1.2,1+(obp-.32)*1.5)));
 const domestic=honorScoreFor({bucket:row.league,honors:row.honors,position:row.pos});
 const intlOnly=honorScoreFor({bucket:'NPB',honors:row.honors,position:row.pos,intlCount:row.intlCount||0}).sc-honorScoreFor({bucket:'NPB',honors:row.honors,position:row.pos}).sc;
 const intlHonors=sum(row.honors.filter(x=>/ワールド・ベースボール・クラシック|WBSCプレミア12/.test(x)).map(x=>x.includes('準優勝')?100:x.includes('優勝')?200:0));
 const primaryGlobals=row.primary===row.league||!row.primary?(intlOnly+intlHonors+(row.franchise?200:0)):0;
 // NPB domestic honorScore also contains international medals: subtract those before reassigning globals.
 const domesticOnly=domestic.sc-(row.league==='NPB'?intlHonors:0);
 const b=(basic+(p?3*(first.HLD||0):0))*efficiency+domesticOnly+primaryGlobals;
 // C: contribution index on a 100-point Hall scale, lifetime + top-five annual mean.
 const annual=row.annualFirst?.length?row.annualFirst:[...Array(Math.max(1,Math.round(first.yr||row.years||1)))].map(()=>basic/Math.max(1,first.yr||row.years||1));
 const peak=mean([...annual].sort((a,b)=>b-a).slice(0,5))||0;
 const c=50*(basic/th[0])+50*(peak/(th[0]/18))+(domesticOnly+primaryGlobals)/th[0]*100;
 return {...row,models:{current:{score:row.raw,tier:row.tier,candidate:row.candidate,inducted:row.inducted},A:{score:a,tier:floor(tier(a,th),h),candidate:floor(tier(a,th),h)<=1,inducted:a>=th[0]},B:{score:b,tier:floor(tier(b,th),h),candidate:floor(tier(b,th),h)<=1,inducted:b>=th[0]},C:{score:c,tier:tier(c,[100,70,35,20]),candidate:c>=70,inducted:c>=100},assumptions:{B_efficiency:efficiency,B_globals_primary:row.primary||row.league,C_peak_source:row.annualFirst?.length?'actual first-team annual snapshot':'synthetic constant annual rate; not true peak history'}}};
};
const fixed=buildFixedCases().map(c=>withModels(measure(c))),special=buildSpecialCases().map(c=>withModels(measure(c)));
const completed=pilot.results.filter(r=>r.completed),actual=[];
for(const run of completed){
 const firstCounts=Object.fromEntries(leagues.map(l=>{const s=run.seasons.filter(s=>s.lv===firstLevels[l]&&s.st.G>0);return [l,{seasons:new Set(s.map(s=>s.year)).size,games:sum(s.map(s=>s.st.G))}];}));
 const reached=leagues.filter(l=>firstCounts[l].seasons>0),ranked=[...reached].sort((a,b)=>firstCounts[b].seasons-firstCounts[a].seasons||firstCounts[b].games-firstCounts[a].games);
 // No unapproved third tiebreak. Exact ties are unassigned and remain visible.
 run.primaryTie=ranked.length>1&&firstCounts[ranked[0]].seasons===firstCounts[ranked[1]].seasons&&firstCounts[ranked[0]].games===firstCounts[ranked[1]].games;run.primary=run.primaryTie?null:ranked[0]||null;run.firstCounts=firstCounts;
 for(const league of leagues){const stats=run.snapshot.stats[league];if(!stats)continue;
  const s=run.seasons.filter(s=>s.lv===firstLevels[league]&&s.st.G>0),roles={};for(const season of s)roles[season.role||run.pos]=(roles[season.role||run.pos]||0)+1;
  const role=run.pos==='P'?(Object.entries(roles).sort((a,b)=>b[1]-a[1])[0]?.[0]||run.snapshot.role||'P'):run.pos;
  const input={id:run.seed+'/'+run.strategy+'/'+league,seed:run.seed,source:'真實遊戲生涯快照',league,pos:run.pos,role,years:stats.yr,stats,honors:run.snapshot.honors,intlCount:run.snapshot.intlCount,franchise:run.snapshot.traits.franchise,firstStats:run.snapshot.statsByLevel?.[firstLevels[league]]||Object.fromEntries(Object.keys(stats).map(k=>[k,0])),annualFirst:s.map(s=>sum(Object.values(components(s.st,run.pos)))),primary:run.primary,arrived:s.length>0,strategy:run.strategy};
  const row=measure(input);assert.equal(row.tier,run.tiers[league].i,'VM/browser same tier');assert.equal(row.score,run.tiers[league].sc,'VM/browser same score');
  const actualInfo=run.snapshot.hofInfo.filter(h=>h.lg===labels[league]);row.hofInfo=actualInfo;row.firstBallot=actualInfo.some(h=>h.yr===1);row.voteNarrative=run.voteCards||[];row.rngCalls=null;row.legend=run.snapshot.traits.legend;row.legendLeague=run.snapshot.legendLeague;row.voteSource='actual browser card/HOF snapshot; VM reseeding is not used for actual vote';actual.push(withModels(row));
 }
}
function groups(rows){return Object.fromEntries(leagues.map(l=>[l,{all:distribution(rows.filter(r=>r.league===l)),roles:Object.fromEntries([...new Set(rows.filter(r=>r.league===l).map(r=>r.role))].map(role=>[role,distribution(rows.filter(r=>r.league===l&&r.role===role))]))}]));}
const leagueRates=Object.fromEntries(leagues.map(league=>{const reached=completed.filter(r=>r.firstCounts[league].seasons>0),rows=actual.filter(r=>r.league===league),qualified=rows.filter(r=>r.candidate),counts=rows=>({candidate:rows.filter(r=>r.candidate).length,inducted:rows.filter(r=>r.inducted).length,first:rows.filter(r=>r.firstBallot).length}),all=counts(rows),arrival=counts(rows.filter(r=>r.arrived)),eligible=counts(qualified);return [league,{allPlayers:Object.fromEntries(Object.entries(all).map(([k,n])=>[k,ratio(n,pilot.attempts)])),arrived:Object.fromEntries(Object.entries(arrival).map(([k,n])=>[k,ratio(n,reached.length)])),qualified:Object.fromEntries(Object.entries(eligible).map(([k,n])=>[k,ratio(n,qualified.length)])),primaryCareers:completed.filter(r=>r.primary===league).length,arrival:ratio(reached.length,pilot.attempts)}];}));
const firstScoreDiff=actual.map(r=>({id:r.id,bucketScore:r.base,firstOnly:sum(Object.values(components(r.firstStats,r.pos))),difference:r.base-sum(Object.values(components(r.firstStats,r.pos))),firstYears:r.firstStats.yr,bucketYears:r.stats.yr}));
const modelComparisons=Object.fromEntries([['synthetic',fixed],['actual',actual]].map(([name,rows])=>[name,Object.fromEntries(leagues.map(l=>[l,Object.fromEntries([...new Set(rows.filter(r=>r.league===l).map(r=>r.role))].map(role=>{const group=rows.filter(r=>r.league===l&&r.role===role);return [role,Object.fromEntries(['current','A','B','C'].map(model=>[model,{n:group.length,mean:mean(group.map(r=>r.models[model].score)),candidate:group.filter(r=>r.models[model].candidate).length,inducted:group.filter(r=>r.models[model].inducted).length}]))];}))]))]));
const decomposition=rows=>{const totals={};for(const r of rows){for(const [key,v]of Object.entries(r.components))totals[key]=(totals[key]||0)+v;for(const item of r.perHonor){const key=/ワールド・ベースボール・クラシック|WBSCプレミア12/.test(item.text)?'international':/日本一|台湾シリーズ優勝|韓国シリーズ優勝|ワールドシリーズチャンピオン/.test(item.text)?'teamHonors':'individualAwards';totals[key]=(totals[key]||0)+item.sc;}totals.international=(totals.international||0)+(r.league==='NPB'?(r.intlCount||0)*80:0);totals.franchise=(totals.franchise||0)+(r.franchise?200:0);}const total=sum(Object.values(totals));return {total,items:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,{score:v,share:total?v/total:null}]))};};
const sensitivity=[];
const honorWeights={MVP:/年間MVP/,ace:/最優秀投手賞/,rookie:/新人王/,glove:/ゴールデングラブ賞/,defenseAward:/年間最優秀守備選手/,department:/首位打者|本塁打王|盗塁王|打点王|最高出塁率|最多セーブ|最優秀中継ぎ|最多奪三振|最多勝|最優秀防御率/,allstar:/オールスターゲーム/,internationalChampion:/ワールド・ベースボール・クラシック優勝|WBSCプレミア12優勝/,internationalRunner:/ワールド・ベースボール・クラシック準優勝|WBSCプレミア12準優勝/};
for(const [dataset,rows]of [['synthetic',fixed],['actual',actual]]){
 for(const [parameter,pattern]of Object.entries(honorWeights))for(const delta of [-.2,-.1,.1,.2]){
  const changes=rows.map(r=>{const raw=r.raw+sum(r.perHonor.filter(h=>pattern.test(h.text)).map(h=>h.sc))*delta;return {league:r.league,role:r.role,tier:floor(tier(raw,thresholds[r.league]),r.honor),inducted:raw>=thresholds[r.league][0],original:r.tier};});
  sensitivity.push({dataset,parameter,delta,n:rows.length,tierChanges:changes.filter(r=>r.tier!==r.original).length,candidates:changes.filter(r=>r.tier<=1).length,inducted:changes.filter(r=>r.inducted).length});
 }
 for(const delta of [-.2,-.1,.1,.2]){const changes=rows.map(r=>({r,t:floor(tier(r.raw+(r.league==='NPB'?(r.intlCount||0)*80:0)*delta,thresholds[r.league]),r.honor)}));sensitivity.push({dataset,parameter:'internationalAppearance',delta,n:rows.length,tierChanges:changes.filter(x=>x.t!==x.r.tier).length,candidates:changes.filter(x=>x.t<=1).length,inducted:changes.filter(x=>x.t===0).length});}
 const keys=[...new Set(rows.flatMap(r=>Object.keys(r.components)))];
 for(const weight of [...keys,'individualAwards','teamHonors','international','franchise','HLD-zero','ERA-zero'])for(const delta of [-.2,-.1,.1,.2]){
  const projected=rows.map(r=>{let component=r.components[weight]||0;if(weight==='individualAwards')component=sum(r.perHonor.filter(h=>!/優勝|オールスターゲーム/.test(h.text)).map(h=>h.sc));if(weight==='teamHonors')component=sum(r.perHonor.filter(h=>/日本一|台湾シリーズ優勝|韓国シリーズ優勝|ワールドシリーズチャンピオン/.test(h.text)).map(h=>h.sc));if(weight==='international')component=(r.league==='NPB'?(r.intlCount||0)*80:0)+sum(r.perHonor.filter(h=>/ワールド・ベースボール・クラシック|WBSCプレミア12/.test(h.text)).map(h=>h.sc));if(weight==='franchise')component=r.franchise?200:0;const raw=r.raw+component*delta;return {tier:floor(tier(raw,thresholds[r.league]),r.honor),inducted:raw>=thresholds[r.league][0],original:r.tier};});sensitivity.push({dataset,parameter:weight,delta,n:rows.length,tierChanges:projected.filter(r=>r.tier!==r.original).length,candidates:projected.filter(r=>r.tier<=1).length,inducted:projected.filter(r=>r.inducted).length});
 }
 for(let boundary=0;boundary<4;boundary++)for(const delta of [-.1,-.05,.05,.1]){const projected=rows.map(r=>{const th=[...thresholds[r.league]];th[boundary]*=1+delta;return {tier:floor(tier(r.raw,th),r.honor),inducted:r.raw>=th[0],original:r.tier};});sensitivity.push({dataset,parameter:'threshold-'+boundary,delta,n:rows.length,tierChanges:projected.filter(r=>r.tier!==r.original).length,candidates:projected.filter(r=>r.tier<=1).length,inducted:projected.filter(r=>r.inducted).length});}
}
const metadata={version:pilot.version,baselineCommit:pilot.commit,created:'2026-10-10',caseSource:'160 synthetic grid + 20 synthetic special; 50 unique seed/strategy real careers',pilot:{...pilot,results:undefined},totalExecutions:112,executionAccounting:'First run 50+2 replay; artifact run same 50+2 replay; vote enrichment 2+2 replay twice (first selector failed to capture cards) =112, 50 distinct seed/strategy cases (25 seeds). No duplicate counting.',boundaryCharacterizations:87,primaryRule:'first-team seasons, then first-team G; no first-team or exact tie = unassigned',thresholds};
const reportData={metadata,fixed,special,actual,pilot:pilot.results,statistics:{fixed:groups(fixed),actual:groups(actual),leagueRates,firstScoreDiff,modelComparisons,decomposition:{fixed:decomposition(fixed),actual:decomposition(actual)},sensitivity},quality:{pilotFailures:pilot.failures,resources:pilot.results.flatMap(r=>r.resources),errors:pilot.results.flatMap(r=>r.errors),vmBrowserComparisons:actual.length,replay:pilot.replay,yearsRetired:distribution(completed.map(r=>({raw:r.snapshot.age}))),earlyRetiredUnder25:completed.filter(r=>r.snapshot.age<25).length,injurySeasons:sum(completed.map(r=>r.seasons.filter(s=>s.seasonFactor<1).length)),fullRehabSeasons:sum(completed.map(r=>r.seasons.filter(s=>s.seasonFactor===0).length))}};
assert.ok(actual.filter(r=>r.candidate).every(r=>r.voteNarrative.length),'actual candidate vote cards captured');
const outputDir=path.join(root,'docs','reviews');await mkdir(outputDir,{recursive:true});await writeFile(path.join(outputDir,'RETIREMENT_HOF_BALANCE_DATA_V1_11_1.json'),JSON.stringify(reportData));
console.log(JSON.stringify({fixed:fixed.length,special:special.length,actualLeagueRows:actual.length,completed:completed.length,primary:Object.fromEntries(leagues.map(l=>[l,leagueRates[l].primaryCareers])),arrivals:Object.fromEntries(leagues.map(l=>[l,leagueRates[l].arrival])),candidates:Object.fromEntries(leagues.map(l=>[l,leagueRates[l].allPlayers.candidate])),inducted:Object.fromEntries(leagues.map(l=>[l,leagueRates[l].allPlayers.inducted])),largestMixedInflation:[...firstScoreDiff].sort((a,b)=>b.difference-a.difference).slice(0,4),modelComparisons,sensitivityRows:sensitivity.length,quality:reportData.quality},null,2));

import assert from 'node:assert/strict';
import {baseFaOfferCount,buildFaOffer,calculateOfferAnnualSalary,competitionMultiplier,contractTypeMultiplier,generateBidJitters,resolveFaMarket} from '../docs/src/engine/market-policy.js';
assert.deepEqual([6,3,1,-1,-2].map(baseFaOfferCount),[4,3,2,1,0]);assert.deepEqual([1,2,3,4].map(competitionMultiplier),[1,1.025,1.05,1.075]);assert.equal(contractTypeMultiplier('LONG'),.95);assert.equal(contractTypeMultiplier('SHORT'),1.05);assert.equal(contractTypeMultiplier('PROOF'),1.05);
const breakdown={injuryMultiplier:.93,positionMultiplier:1.15,contractTypeMultiplier:.95,teamDemandMultiplier:1.05,franchiseMultiplier:1,competitionMultiplier:1.05,bidJitterMultiplier:1.02};const annual=calculateOfferAnnualSalary({marketSalary:45_000_000,breakdown});assert.equal(annual,51_420_000);
const offer=buildFaOffer({offerId:'O',teamId:'T',org:'NPB',level:'NPB1',category:'C',demandScore:2,years:4,contractType:'LONG',marketSalary:45_000_000,levelMinimum:16_000_000,breakdown,incentiveTerms:{annualMax:3_000_000}});assert.equal(offer.annualSalary,annual);assert.equal(offer.guaranteedTotal,annual*4);assert.equal(offer.breakdown.teamDemandMultiplier,1.05);
let calls=0;const jitter=generateBidJitters(['B','A','C'],()=>{calls++;return .5;});assert.equal(calls,3);assert.deepEqual(jitter.map(x=>x.teamId),['A','B','C']);assert.ok(jitter.every(x=>x.multiplier===1));
const existing={marketKey:'K',offers:[1]};calls=0;assert.equal(resolveFaMarket(existing,'K',()=>{calls++;return{};}),existing);assert.equal(calls,0);resolveFaMarket(existing,'X',()=>{calls++;return{};});assert.equal(calls,1);
console.log('FA market policy tests passed');
import {CareerMovement} from '../docs/src/engine/career-movement.js';
import {leagueTables} from '../docs/src/engine/league-catalog.js';
import {effectiveMarketOrg} from '../docs/src/engine/cross-league-market-policy.js';

// Reproduce through the connected market, not a second eligibility implementation.
const {levels:LV}=leagueTables();
function marketFixture({org='MLB',level=org==='MiLB'?'MLB':org==='MLB'?'MLB':org+'1',overall=40,lastD=-1,rating=6,injury='HEALTHY',faType='OVERSEAS',cancer=false,duplicates=false,cached=null,Movement=CareerMovement}={}){
 const ownOrg=effectiveMarketOrg(level,org)==='MiLB'?'MLB':effectiveMarketOrg(level,org);
 const state={seed:'fa-candidate-regression',year:2036,org,lv:level,orgTeamId:ownOrg+'0',pos:'P',role:'SP',traits:{cancer},faType,marketInjury:injury,salaryEvaluationHistory:[],currentSalary:10000000};
 const teams=Object.fromEntries(['NPB','MLB','KBO','CPBL'].map(lg=>[lg,Array.from({length:6},(_,i)=>({teamId:lg+i,name:lg+i,org:lg,strength:'A'}))]));
 const lists=[],draws=[];let choices,heading,signatures=0;
 const deps={getState:()=>state,LV,migrateSalaryV140State:()=>{},currentMarketRating:()=>rating,dpMult:()=>1,
  listByOrg:lg=>{lists.push(lg);const rows=teams[lg==='MiLB'?'MLB':lg]||[];return duplicates?[...rows,...rows]:rows;},
  teamRec:id=>Object.values(teams).flat().find(t=>t.teamId===id),salaryFor:(_lv,r)=>10000000+Math.max(0,r)*100000,
  salaryCandidate:({targetLevel,marketSalary})=>({targetLevel,annualSalary:marketSalary,signingTerms:{signingBonus:0}}),
  fmtMoney:String,escapeHTML:String,choose:(title,opts)=>{heading=title;choices=opts;},card:()=>{},
  signTo:()=>{signatures++;},reportFlowOutcome:()=>{},rng:{R:()=>{const value=((draws.length*37+13)%100)/100;draws.push(value);return value;},ri:a=>a,chance:()=>false}};
 if(cached)state.lastFaMarket=cached;
 const movement=new Movement(deps),before=structuredClone(state);
 const open=()=>movement.faMarket(overall,lastD);open();
 return {state,before,draws,lists,open,get choices(){return choices;},get heading(){return heading;},get signatures(){return signatures;}};
}
for(const org of ['MLB','MiLB','KBO','CPBL']){
 const f=marketFixture({org});
 assert.ok(f.lists.some(lg=>(lg==='MiLB'?'MLB':lg)===(org==='MiLB'?'MLB':org)),org+': own league must enter candidates below cross-league thresholds');
 assert.ok(f.state.lastFaMarket.offers.some(o=>o.teamId.startsWith(org==='MiLB'?'MLB':org)),org+': native market can select own-league clubs');
}
console.log('PASS same-league FA regression');
// Boundary/negative controls: crossing leagues retains the old gates exactly.
for(const [org,overall,lastD,expected] of [
 ['MLB',40,-1,['NPB','MLB']],['KBO',40,-1,['NPB','KBO']],['CPBL',40,-1,['NPB','CPBL']],
 ['NPB',46,0,['NPB','CPBL']],['NPB',47,0,['NPB','CPBL']],['NPB',47,1,['NPB','KBO','CPBL']],
 ['NPB',59,2,['NPB','KBO','CPBL']],['NPB',60,1,['NPB','KBO','CPBL']],['NPB',60,2,['NPB','KBO','CPBL','MLB']]
]){
 const f=marketFixture({org,overall,lastD});
 assert.deepEqual([...new Set(f.lists.map(x=>x==='MiLB'?'MLB':x))],expected);
 assert.equal(f.state.lastFaMarket.offers.length,4,'no extra own-league quota');
 assert.equal(new Set(f.state.lastFaMarket.offers.map(x=>x.teamId)).size,4);
 assert.ok(f.state.lastFaMarket.offers.every(x=>x.teamId!==f.state.orgTeamId));
 assert.equal(f.state.lastFaMarket.stayOffer.teamId,f.state.orgTeamId);
 assert.equal(f.draws.length,4,'one existing bid jitter per external offer, no stay draw');
 const state=structuredClone(f.state),draws=f.draws.slice(),lists=f.lists.slice(),market=f.state.lastFaMarket;
 f.open();f.open();assert.equal(f.state.lastFaMarket,market);assert.deepEqual(f.state,state);assert.deepEqual(f.draws,draws);assert.deepEqual(f.lists,lists);assert.equal(f.signatures,0);
}
for(const overall of [0,60,90]){
 const f=marketFixture({org:'NPB',faType:'DOMESTIC',overall,lastD:20});assert.deepEqual(f.lists,['NPB']);assert.ok(f.state.lastFaMarket.offers.every(o=>o.org==='NPB'));
}
for(const [injury,cancer,count] of [['HEALTHY',false,4],['MINOR',false,4],['MAJOR',false,3],['REHAB',false,2],['REHAB',true,1]]){
 const f=marketFixture({injury,cancer});assert.equal(f.state.lastFaMarket.offers.length,count);assert.equal(f.draws.length,count);
 if(['MAJOR','REHAB'].includes(injury))assert.ok(f.state.lastFaMarket.offers.every(o=>o.years===1&&o.contractType==='PROOF'));
}
for(const options of [{rating:-2},{rating:0,injury:'REHAB'},{rating:0,cancer:true}]){
 const f=marketFixture(options);assert.equal(f.state.lastFaMarket.offers.length,0);assert.equal(f.state.lastFaMarket.stayOffer,null);assert.equal(f.draws.length,0);assert.equal(f.choices.length,2);assert.match(f.heading,/獲得オファーなし/);f.open();assert.equal(f.draws.length,0);assert.equal(f.signatures,0);
}
const unique=marketFixture(),duplicate=marketFixture({duplicates:true});assert.deepEqual(duplicate.state,unique.state);assert.deepEqual(duplicate.draws,unique.draws);
// Demand ranking remains global; membership does not reserve an offer per league.
const {rankTeamsByDemand}=await import('../docs/src/engine/team-demand-policy.js');
const eligible=['NPB','MLB'].flatMap(org=>Array.from({length:6},(_,i)=>({teamId:org+i,name:org+i,org,strength:'A'}))).filter(t=>t.teamId!=='MLB0');
const top=rankTeamsByDemand({teams:eligible,seed:unique.state.seed,year:unique.state.year,category:'SP'}).slice(0,4).map(x=>x.team.teamId).sort();
assert.deepEqual(unique.state.lastFaMarket.offers.map(x=>x.teamId),top);

// Frozen pre-fix module; same dependencies (unchanged), no golden replacement.
const {execFileSync}=await import('node:child_process');
const baseline='b8bc49b7b0cb14b24cec3b3499a57ecfb61e1a0d';
const oldSource=execFileSync('git',['show',baseline+':docs/src/engine/career-movement.js'],{encoding:'utf8'});
const absoluteSource=oldSource.replace(/from '(\.\.?\/[^']+)'/g,(_m,p)=>'from '+JSON.stringify(new URL(p,new URL('../docs/src/engine/career-movement.js',import.meta.url)).href));
const {CareerMovement:BeforeMovement}=await import('data:text/javascript;base64,'+Buffer.from(absoluteSource).toString('base64'));
for(const org of ['NPB','MLB','KBO','CPBL']){
 const options={org,overall:65,lastD:4},old=marketFixture({...options,Movement:BeforeMovement}),now=marketFixture(options);
 assert.deepEqual(now.before,old.before);assert.deepEqual(now.state,old.state);assert.deepEqual(now.draws,old.draws,'unchanged candidate set preserves exact draws');
}
for(const org of ['MLB','MiLB','KBO','CPBL']){
 const old=marketFixture({org,Movement:BeforeMovement}),now=marketFixture({org});
 assert.deepEqual(now.before,old.before,'identical state at entry to affected market');
 const {lastFaMarket:a,faMarketKey:ak,...oldRest}=old.state,{lastFaMarket:b,faMarketKey:bk,...newRest}=now.state;
 assert.deepEqual(newRest,oldRest,'only market result fields may differ');assert.equal(ak,bk);
 assert.notDeepEqual(b.offers,a.offers,'permitted difference starts at own-league candidate admission');
 const {offers:oldOffers,...oldMarket}=a,{offers:newOffers,...newMarket}=b;assert.deepEqual(newMarket,oldMarket,'market key/rating/injury/count/stay/acceptance metadata unchanged');
 assert.deepEqual(now.draws,old.draws,'same offer count preserves exact jitter sequence in these cases');
 const replay=marketFixture({org});assert.deepEqual(now.state,replay.state);assert.deepEqual(now.draws,replay.draws);
}
console.log('PASS native FA candidates/gates, demand/limits/injuries, no-bid/stay/dedup/cache, frozen pre-market and permitted-difference controls');
// Nothing before the market may change except the separately approved result copy.
const {readFileSync}=await import('node:fs');
const stripMarket=s=>s.replaceAll('\r\n','\n').replace(/  function faMarketRule\(o,d\)\{[\s\S]*?(?=  function outOfOrg\(o\))/,'');
// MLB-POSTING-DESIGN-01 / NPB-OFFER-WINDOW-01 (approved R3): the season-end menu is reverted by exact text,
// each hunk exactly once, so every other line still has to equal the pre-fix source.
const SEASON_END_HUNKS=[
 ["      offerType=crossOfferType(S.org,'MiLB');\n      const menu=npbSeasonEndMenu(o,crossOfferTitle(offerType),[],[{t:'現在の球団に残留',main:true,f:finish}],finish);\n      if(!npbSeasonEndHasMoves(menu)){finish();return;}\n      showNpbSeasonEndMenu(menu);return;\n","      offerType=crossOfferType(S.org,'MiLB');\n      const k=overseasOffer('KBO','KBO1','韓国プロ野球への海外移籍',o,1,finish);\n      const c=overseasOffer('CPBL','CPBL1','台湾プロ野球への海外移籍',o,0,finish);\n      const m=overseasOffer('MiLB','MLB','MLBへの海外移籍',o,2,finish);\n      if(k)opts.push(k);if(c)opts.push(c);if(m)opts.push(m);\n","crossOffers NPB branch"],
 ["    if(stage==='CONTROL'){\n      if(S.org==='NPB'&&S.lv==='NPB1'){\n        const finish=()=>reportFlowOutcome({kind:'CROSS_OFFER_RESOLVED'});\n        const menu=npbSeasonEndMenu(o,crossOfferTitle(crossOfferType('NPB','MiLB')),[],[{t:'現在の球団に残留',main:true,f:()=>renewAndAdvance(1,false,'CONTROL')}],finish);\n        if(npbSeasonEndHasMoves(menu)){showNpbSeasonEndMenu(menu);return;}\n      }\n      renewAndAdvance(1,false,'CONTROL');return;}\n","    if(stage==='CONTROL'){renewAndAdvance(1,false,'CONTROL');return;}\n","faFlow window CONTROL"],
 ["    let menu=null;\n    const declareFA=type=>{const S=getState();faReturn=menu?{state:S,year:S.year,menu,saved:{faType:S.faType,faUsed:S.faUsed,npbFaSeasons:S.npbFaSeasons}}:null;S.faType=type;S.faUsed=true;S.npbFaSeasons=0;faMarket(o,S.lastD||0);};\n    const opts=[{t:'権利を行使せず残留',main:true,f:()=>renewAndAdvance(1)},{t:'国内FAを宣言',warn:true,f:()=>declareFA('DOMESTIC')}];\n    if(serviceYearsFor('NPB')>=9)opts.push({t:'海外FAを宣言',warn:true,f:()=>declareFA('OVERSEAS')});\n    const title=`FA権取得・登録${serviceYearsFor('NPB')}シーズン`;\n    if(serviceYearsFor('NPB')<9&&S.lv==='NPB1'){\n      const candidate=npbSeasonEndMenu(o,title,opts,[],()=>reportFlowOutcome({kind:'CROSS_OFFER_RESOLVED'}));\n      if(npbSeasonEndHasMoves(candidate)){menu=candidate;showNpbSeasonEndMenu(menu);return;}\n    }\n    choose(title,opts);\n","    const declareFA=type=>{const S=getState();S.faType=type;S.faUsed=true;S.npbFaSeasons=0;faMarket(o,S.lastD||0);};\n    const opts=[{t:'権利を行使せず残留',main:true,f:()=>renewAndAdvance(1)},{t:'国内FAを宣言',warn:true,f:()=>declareFA('DOMESTIC')}];\n    if(serviceYearsFor('NPB')>=9)opts.push({t:'海外FAを宣言',warn:true,f:()=>declareFA('OVERSEAS')});\n    choose(`FA権取得・登録${serviceYearsFor('NPB')}シーズン`,opts);\n","faFlow year-8 menu"],
 ["{t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'FA_RETIRED',reason:'FA市場で獲得オファーがなく、現役を引退した。'})},...faCancelOption()]);return;}","{t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'FA_RETIRED',reason:'FA市場で獲得オファーがなく、現役を引退した。'})}]);return;}","FA no-bid cancel option"],
 ["    choose('FA市場オファー比較',[...choices,...faCancelOption()]);","    choose('FA市場オファー比較',choices);","FA comparison cancel option"],
];
const onceText=(s,from,to,label)=>{assert.equal(s.split(from).length,2,label);return s.replace(from,()=>to);};
const dropBlock=(s,start,end,label)=>{const i=s.indexOf(start),j=s.indexOf(end);assert.ok(i>=0&&j>i&&s.indexOf(start,i+1)<0,label);return s.slice(0,i)+s.slice(j);};
const revertSeasonEnd=s=>{s=dropBlock(s,'  // NPB season-end menu (MLB-POSTING-DESIGN-01','  function crossOffersRule(o){','season-end helpers');
 s=dropBlock(s,'  function faCancelOption(){','  function showFaMarket(market){','FA cancel option');
 for(const [from,to,label] of SEASON_END_HUNKS)s=onceText(s,from,to,label);return s;};
const currentSource=revertSeasonEnd(readFileSync(new URL('../docs/src/engine/career-movement.js',import.meta.url),'utf8'))
 .replace("import {effectiveMarketOrg} from './cross-league-market-policy.js';",'')
 .replace("card('info','トレードは成立せず','トレードの噂はあったものの、移籍は実現せず、引き続き同じ球団でプレーすることになった。')","card('info','泊まった','噂はあくまで噂です。新しい野球シーズンでも、同じジャージを着ます。')");
assert.equal(stripMarket(currentSource).replace(/\n\n\nexport class/,'\n\nexport class'),stripMarket(oldSource),'outside FA market, source and pre-entry RNG sites unchanged except approved copy/import and season-end menu');

const oldCached=marketFixture({Movement:BeforeMovement}).state.lastFaMarket,reopened=marketFixture({cached:oldCached});
assert.equal(reopened.state.lastFaMarket,oldCached,'pre-fix same-year cache remains authoritative');
assert.deepEqual(reopened.state,reopened.before);assert.deepEqual(reopened.draws,[]);assert.deepEqual(reopened.lists,[]);
reopened.state.year++;reopened.open();assert.notEqual(reopened.state.lastFaMarket,oldCached);assert.equal(reopened.state.lastFaMarket.marketKey,'FA:2037:OVERSEAS');assert.ok(reopened.lists.includes('MLB'));
console.log('PASS legacy same-year cache unchanged; new year generates candidates once');

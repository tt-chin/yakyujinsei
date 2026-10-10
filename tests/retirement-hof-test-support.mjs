// Test-only harness: execute the production functions verbatim; never imported by docs/src.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {honorScoreFor} from '../docs/src/engine/hall-of-fame-policy.js';
export const GAME_SOURCE=readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
export const leagues=['CPBL','KBO','NPB','MLB'];
export const firstLevels={CPBL:'CPBL1',KBO:'KBO1',NPB:'NPB1',MLB:'MLB'};
export const labels={CPBL:'台湾プロ野球',KBO:'KBO',NPB:'NPB',MLB:'メジャーリーグ'};
export function productionFunction(name,source=GAME_SOURCE){
 const start=source.indexOf('function '+name+'(');if(start<0)throw Error('Missing production function '+name);
 const next=/\n\s{0,2}function \w+\(/g;next.lastIndex=start+10;const end=next.exec(source)?.index??source.length;
 return source.slice(start,end).trim();
}
function literal(name){return GAME_SOURCE.match(new RegExp('const '+name+'=(\\{[^;]+\\});'))?.[0]||(()=>{throw Error('Missing '+name);})();}
export function createProductionHarness(state,seed='hof-fixed',retirementSource=GAME_SOURCE){
 const cards=[],context=vm.createContext({S:structuredClone(state),TextEncoder,honorScoreFor,window:{TEAM_MASTER:{}},card:(...args)=>cards.push(args)});
 const declarations=literal('TIER_TH')+'\n'+literal('LG_N')+'\n'+literal('DPN')+'\nconst LV='+GAME_SOURCE.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1]+';\n'+GAME_SOURCE.match(/Object.assign\(TIER_TH,\{[^\n]+\}\)/)[0]+';\n'+GAME_SOURCE.match(/Object.assign\(LG_N,\{[^\n]+\}\)/)[0]+';';
 const functions=['careerScore','capTeam','defShare','posLegendPhrase','honorScore','tierOf','retireScene','blankStat','addStatTotal','accStat','fnv1a32'].map(name=>productionFunction(name,name==='retireScene'?retirementSource:GAME_SOURCE)).join('\n');
 const rng=`let _s=0,seedInit,R;${GAME_SOURCE.match(/seedInit = function\(seed\)\{[^\n]+/)[0]}\n${GAME_SOURCE.match(/R = function\(\)\{[^\n]+/)[0]}\nlet calls=0;const nativeR=R;R=()=>{calls++;return nativeR();};const ri=(a,b)=>a+Math.floor(R()*(b-a+1));`;
 vm.runInContext(declarations+'\n'+functions+'\n'+rng,context);context.seed=seed;vm.runInContext('seedInit(seed)',context);
 return {context,cards,run:code=>vm.runInContext(code,context),snapshot:()=>JSON.parse(vm.runInContext('JSON.stringify({state:S,calls,rng:_s,thresholds:TIER_TH})',context))};
}
export function components(st,pos){return pos==='P'?{wins:13*st.W,saves:6*st.SV,strikeouts:.9*st.SO,innings:.35*st.IP}:{hits:st.H,homeRuns:3*st.HR,steals:.8*st.SB,rbi:.5*st.RBI,walks:.3*st.BB,defense:6*Math.max(0,st.DEF||0)};}
export function measure(input){
 const state={pos:input.pos,role:input.role||null,stage:'PRO',lv:firstLevels[input.league],year:2060,age:50,traits:{franchise:!!input.franchise},honors:input.honors||[],intlCount:input.intlCount||0,stats:{[input.league]:input.stats},teamTally:{},...input.state};
 const h=createProductionHarness(state,input.seed||input.id);h.context.bucket=input.league;
 const base=h.run('careerScore(S.stats[bucket])'),honor=h.run('honorScore(bucket)'),tier=JSON.parse(h.run('JSON.stringify(tierOf(bucket))'));
 const thresholds=h.snapshot().thresholds[input.league],raw=base+honor.sc,pure=raw>=thresholds[0]?0:raw>=thresholds[1]?1:raw>=thresholds[2]?2:raw>=thresholds[3]?3:4;
 const before=h.snapshot();h.run('retireScene({[bucket]:tierOf(bucket)})');const after=h.snapshot(),info=after.state.hofInfo||[];
 const perHonor=state.honors.map(text=>({text,...honorScoreFor({bucket:input.league,honors:[text],position:input.pos})}));
 return {...input,source:input.source||'人工構造固定案例（不是遊戲分布）',base,honor:JSON.parse(JSON.stringify(honor)),perHonor,components:components(input.stats,input.pos),raw,score:tier.sc,pureTier:pure,tier:tier.i,tierName:tier.name,candidate:tier.i<=1,inducted:tier.i===0,firstBallot:info.some(x=>x.yr===1),hofInfo:info,voteNarrative:h.cards.filter(c=>c[1]==='殿堂入り投票').map(c=>c[2]),rngCalls:after.calls-before.calls,legend:!!after.state.traits.legend,legendLeague:after.state.legendLeague||null};
}
export function buildFixedCases(){
 const cases=[],roles=['SP','MR','CL','power','contact','speed','defense','allround'],levels=['low','ordinary','excellent','star','legend'];
 for(const league of leagues)for(const role of roles)for(let k=0;k<5;k++){
  const years=[5,9,12,15,18][k],pos=['SP','MR','CL'].includes(role)?'P':'IF',st={yr:years,G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,DEF:0,AS:0};
  if(pos==='P'){
   const g=role==='SP'?[12,20,25,28,30][k]:[25,40,50,60,65][k];st.G=g*years;st.IP=Math.round(g*(role==='SP'?[4.8,5.2,5.7,6.1,6.4][k]:1.05)*years*10)/10;st.SO=Math.round(st.IP*[5,6,7.5,9,10.5][k]/9);st.ER=Math.round(st.IP*[5.5,4.5,3.5,2.7,2.0][k]/9);st.H=Math.round(st.IP*[11,10,9,8,7][k]/9);st.BB=Math.round(st.IP*[5,4,3,2.5,2][k]/9);
   st.W=(role==='SP'?[3,7,11,14,17][k]:[1,2,3,4,4][k])*years;st.L=(role==='SP'?[5,7,7,6,5][k]:2)*years;st.SV=role==='CL'?Math.round(g*[.35,.45,.55,.65,.75][k])*years:0;st.HLD=role==='MR'?Math.round(g*[.25,.35,.45,.55,.65][k])*years:0;
  }else{
   const limit={CPBL:120,KBO:144,NPB:143,MLB:162}[league],g=Math.round(limit*[.35,.65,.85,.95,1][k]);st.G=g*years;st.PA=Math.round(g*4.1)*years;st.BB=Math.round(st.PA*[.05,.06,.08,.1,.12][k]);st.AB=st.PA-st.BB;st.H=Math.round(st.AB*[.18,.23,.27,.3,.33][k]);st.HR=Math.min(st.H,Math.round(st.AB*(role==='power'?.055:role==='allround'?.035:.012)*(k+1)/5));st.RBI=Math.round(st.HR*2.1+(st.H-st.HR)*.3);st.SB=Math.round((role==='speed'?12:role==='allround'?6:2)*(k+1)*years);st.DEF=(role==='defense'?[-3,0,6,10,14][k]:role==='power'?[-4,-3,-2,-1,0][k]:[-3,0,3,5,7][k])*years;
  }
  const id=`fixed-${league}-${role}-${levels[k]}`;cases.push({id,seed:id,league,role,level:levels[k],pos,years,stats:st,honors:[],intlCount:0,franchise:false});
 }
 return cases;
}
export function buildSpecialCases(){
 const all=buildFixedCases(),get=(role,level='excellent')=>structuredClone(all.find(c=>c.league==='NPB'&&c.role===role&&c.level===level)),out=[];
 const add=(id,c,patch={},changes={})=>{const value={...c,...patch,id,seed:'special-'+id,stats:{...c.stats,...changes}};out.push(value);return value;};
 const sp=get('SP');add('low-era-few-wins',sp,{}, {W:60,ER:Math.round(sp.stats.IP*1.5/9)});add('high-era-many-wins',sp,{}, {W:180,ER:Math.round(sp.stats.IP*5.5/9)});
 add('300-holds',get('MR'),{}, {HLD:300});add('400-saves',get('CL'),{}, {SV:400});
 const scale=(c,f)=>{const value=structuredClone(c);for(const key of Object.keys(value.stats))value.stats[key]=key==='IP'?Math.round(value.stats[key]*f*10)/10:Math.round(value.stats[key]*f);if(value.pos!=='P')value.stats.PA=value.stats.AB+value.stats.BB;value.years=value.stats.yr;return value;};
 add('short-peak',scale(get('SP','legend'),5/18));add('long-mediocre',scale(get('SP','ordinary'),22/9));
 add('high-efficiency-low-games',scale(get('contact','legend'),2/18));
 const first=scale(get('contact'),1/12),minor=scale(get('contact','ordinary'),19/9),mixed=structuredClone(first.stats);for(const key of Object.keys(mixed))mixed[key]+=minor.stats[key];
 add('long-minor-short-first',first,{years:20,state:{statsByLevel:{NPB1:first.stats,NPB2:minor.stats}}},mixed);
 add('major-injury-short-career',scale(get('SP'),4/12),{state:{bigInj:2,tjCount:2},years:8});
 add('international-champion',get('allround'),{intlCount:4,honors:['2035 ワールド・ベースボール・クラシック優勝','2038 WBSCプレミア12準優勝']});
 add('top-accumulation-no-awards',get('power','legend'));
 add('mvp-floor',get('contact','low'),{honors:['2030 NPB年間MVP']});add('king-floor',get('contact','low'),{honors:['2030 NPB首位打者']});
 add('franchise-global',get('allround'),{franchise:true});
 const sps=get('SP'),mrs=get('MR','legend');add('ordinary-sp',get('SP','ordinary'));add('elite-mr',mrs);
 for(const league of leagues){const c=scale(all.find(c=>c.league===league&&c.role==='allround'&&c.level==='excellent'),1/3);add('cross-league-'+league,c,{state:{stats:Object.fromEntries(leagues.map(l=>[l,structuredClone(c.stats)]))},years:16});}
 return out;
}

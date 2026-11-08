import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createContext,runInContext} from 'node:vm';
import {readSourceText,sourceText} from './support/source-text.mjs';
import {ProfessionalSeason} from '../docs/src/engine/professional-season.js';

// Phase 35 (OOP plan §2nn): portionOf, proSeason, resumeProfessionalSeason and runSeasonPipeline moved verbatim from game.js
// into the ProfessionalSeason factory, with the continuation map. Part 1 proves the module is the base section plus the
// listed edits only; part 2 runs the base functions in a vm and the module in the main realm on the same stubs and compares
// the call log, errors and state after every call and resumed continuation.
const BASE='1a74e71954c4a0f1fbf311f3a6796e3ca7e0329b';
const oldGame=sourceText(execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const MAP='\nconst choiceViews=new WeakMap(),seasonContinuations=new WeakMap(),yearHandoffs=new WeakMap();\n';
const PORTION='\nfunction portionOf(st,r){\n',PRO='\nfunction rollInjury(){playerInjury.rollInjury();}\nfunction proSeason(){\n',END='\n}\nfunction awards(bucket,st){';
for(const anchor of [MAP,PORTION,PRO,END])assert.equal(oldGame.split(anchor).length,2,'one old anchor: '+anchor.trim().slice(0,30));
const portionAt=oldGame.indexOf(PORTION)+1,proAt=oldGame.indexOf(PRO),endAt=oldGame.indexOf(END);
assert.ok(portionAt<proAt&&proAt<endAt,'portionOf, then proSeason');
const oldPortion=oldGame.slice(portionAt,proAt),oldSeason=oldGame.slice(proAt+PRO.indexOf('function proSeason'),endAt+2);

// ---- Part 1: verbatim move ----
const HEADER=`// Professional season (OOP plan §2nn): the season stat line with its safety limits, event, effort and one-tool
// adjustments, the season card and log row, the iron-man and one-tool traits, then the resumable continuation (awards,
// salary evaluation, championship snapshot, TJ accrual) and the post-season pipeline. The bodies are the former game.js
// proSeason/resumeProfessionalSeason/runSeasonPipeline/portionOf; the per-state continuation map moved with them. The
// career state is read at the start of proSeason and resumeProfessionalSeason through getState. LV and clamp are passed by
// reference; every game.js function, the event/market/championship policies and the R bridge are injected late-binding
// lambdas, so E2E hooks that rebind accLevelStat, tjAccrue, awards, the pipeline steps, nextStep, card, board and R still
// reach these bodies. The policy imports cannot be rebound; their lambdas only keep the wiring uniform.
`;
const indent=text=>text.split('\n').map(l=>l===''?l:'  '+l).join('\n');
const once=(text,from,to,label)=>{assert.equal(text.split(from).length,2,'one insertion site: '+label);return text.replace(from,()=>to);};
const G='const S=getState();';
// The two state reads: the start of proSeason and of resumeProfessionalSeason. Nothing in these bodies reads S after a deferral.
let body=indent(oldPortion+'\n'+oldSeason);
body=once(body,'  function proSeason(){\n','  function proSeason(){\n    '+G+'\n','proSeason start');
body=once(body,'  function resumeProfessionalSeason(entry){\n','  function resumeProfessionalSeason(entry){\n    '+G+'\n','resume start');
const DEPS='getState,LV,clamp,simSeason,applyEventSeason,consumeEventSeason,normalizeEventSeason,bucketOf,accStat,accLevelStat,card,statLine,isSP,toolGap,careerAllStars,traitCard,removeTrait,board,awards,classifyMarketInjury,recordSalaryEvaluation,captureSeasonChampionship,tjAccrue,tjGamble,demotionAudit,tradeCheck,maybeIntl,nextStep,resumeSeasonEnd,restorePendingChoice,seasonRng:{R}';
const expected=HEADER+`export class ProfessionalSeason {
  #rules;
  constructor(deps){this.#rules=professionalSeasonRules(deps);}
  proSeason(){return this.#rules.proSeason();}
}

function professionalSeasonRules({${DEPS}}){
  const seasonContinuations=new WeakMap();
${body}
  return {proSeason};
}
`;
const moduleText=readSourceText(new URL('../docs/src/engine/professional-season.js',import.meta.url));
assert.equal(moduleText,expected,'module = base section plus the listed edits');
assert.equal(moduleText.split(G).length,3,'two state reads');
assert.deepEqual(['R','ri','chance','pick','pickRecord'].map(f=>(moduleText.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[1,0,0,0,0],'draw site moved verbatim');

// ---- Part 2: behaviour, old functions (vm) vs module (main realm) ----
const LV={NPB1:{g:143},NPB2:{g:120},MLB:{g:162},NOGAMES:{}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PITCHER={G:24,IP:150,W:10,L:8,SV:0,HLD:0,SO:120,ER:60,era:3.6,H:140,BB:40,d:2,form:0};
const BATTER={G:130,PA:520,AB:470,H:130,HR:15,RBI:60,SB:8,BB:40,avg:.277,d:1,form:0};
const PIPELINE=['tjGamble','demotionAudit','tradeCheck','maybeIntl'];
const withTeam=s=>{s.teamName=()=>'球団:'+s.lv;return s;};
function makeStubs(run){
  const log=run.log,cfg=()=>run.cfg;// cfg is read live: play() replaces run.cfg before every step
  const seq=(key,fallback)=>{const list=cfg()[key];if(!list)return fallback;const v=list[run.used[key]=(run.used[key]||0)]??list.at(-1);run.used[key]++;return v;};
  const step=name=>cont=>{log.push([name]);const mode=cfg().pipe?.[name];if(mode==='throw')throw Error('PIPE_FAULT_'+name);if(mode==='defer'){run.deferred.push(cont);return;}return cont();};
  return {
    simSeason:lv=>{log.push(['simSeason',lv]);if(cfg().simThrow)throw Error('SIM_FAULT');return structuredClone({...(run.S.pos==='P'?PITCHER:BATTER),...cfg().st});},
    applyEventSeason:(st,options)=>{log.push(['applyEvent',JSON.stringify(st),JSON.stringify(options)]);return {G:st.G+1,H:(st.H||0)+2};},
    consumeEventSeason:state=>{log.push(['consumeEvent',state===run.S]);state.pendStat=0;},
    normalizeEventSeason:(st,options)=>{log.push(['normalizeEvent',JSON.stringify(st),JSON.stringify(options)]);return {G:Math.min(st.G,options.maxGames)};},
    bucketOf:lv=>{log.push(['bucketOf',lv]);return 'B-'+lv;},
    accStat:(bucket,st)=>log.push(['accStat',bucket,JSON.stringify(st)]),accLevelStat:(levelKey,st)=>log.push(['accLevelStat',levelKey,JSON.stringify(st)]),
    card:(cls,title,html)=>log.push(['card',cls,title,html]),statLine:st=>{log.push(['statLine']);return 'SL'+JSON.stringify(st);},
    isSP:()=>{log.push(['isSP']);return run.S.role==='SP';},toolGap:()=>{log.push(['toolGap']);return cfg().tool??{gap:0,val:50,role:'代走'};},
    careerAllStars:()=>{log.push(['allStars']);return cfg().allStars??0;},
    traitCard:(key,name,desc,tone)=>log.push(['traitCard',key,name,desc,tone]),
    removeTrait:(key,label)=>{log.push(['removeTrait',key,label]);delete run.S.traits[key];run.S.removed=[...run.S.removed,label];},
    board:phase=>{log.push(['board',phase]);if(cfg().replaceOnBoard)run.S=withTeam(structuredClone(cfg().replaceOnBoard));},
    awards:(bucket,st)=>{log.push(['awards',bucket,JSON.stringify(st)]);if(cfg().awardsThrow)throw Error('AWARDS_FAULT');},
    classifyMarketInjury:input=>{log.push(['classify',JSON.stringify(input)]);return 'MI:'+input.seasonFactor;},
    recordSalaryEvaluation:st=>log.push(['salaryEval',JSON.stringify(st)]),
    captureSeasonChampionship:state=>log.push(['champ',state===run.S]),
    tjAccrue:()=>{log.push(['tjAccrue']);run.S.tj=(run.S.tj||0)+1;},
    tjGamble:step('tjGamble'),demotionAudit:step('demotionAudit'),tradeCheck:step('tradeCheck'),maybeIntl:step('maybeIntl'),
    nextStep:()=>log.push(['nextStep']),
    resumeSeasonEnd:()=>{log.push(['resumeSeasonEnd']);return !!cfg().seasonEnd;},
    restorePendingChoice:()=>{log.push(['restorePending']);return !!cfg().pending;},
    R:()=>{const v=seq('r',.5);log.push(['R',v]);return v;},
  };
}
const newRun=()=>({log:[],cfg:{},S:null,used:{},deferred:[]});
function oldHarness(){
  const run=newRun(),stubs=makeStubs(run);
  const context=createContext({...stubs,LV,clamp});
  Object.defineProperty(context,'S',{get:()=>run.S});// the game.js global, read live like the real binding
  runInContext("'use strict';\nconst seasonContinuations=new WeakMap();\n"+oldPortion+'\n'+oldSeason+'\nglobalThis.__pro=()=>proSeason();',context);
  return {run,pro:()=>context.__pro()};
}
function newHarness(source=ProfessionalSeason){
  const run=newRun(),{R,...stubs}=makeStubs(run);
  const season=new source({getState:()=>run.S,LV,clamp,...stubs,seasonRng:{R:()=>R()}});
  return {run,pro:()=>season.proSeason()};
}
const pro=(patch={})=>({name:'検証',pos:'P',role:'SP',stage:'PRO',org:'NPB',lv:'NPB1',year:2035,age:27,seasonFactor:1,pendStat:0,effort:'通常投球',
  traits:{},removed:[],ironStreak:0,tradeFrom:null,dpos:'',rehab:0,skipMid:false,_majorInjuryThisSeason:false,tj:0,log:[],...patch});
const bat=(patch={})=>pro({pos:'IF',role:null,dpos:'SS',...patch});
// Each step: optional state (fresh object), patch (mutates S), cfg (stub behaviour), then call proSeason or resume the
// oldest deferred pipeline continuation (the player's tap after a pipeline step's choose()).
const scenarios=[
  ['starter, normal effort',[{state:pro(),call:true}]],
  ['starter, full effort lowers ERA to the floor',[{state:pro({effort:'全力投球'}),cfg:{st:{era:1.5}},call:true}]],
  ['starter, energy saving raises ERA to the ceiling',[{state:pro({effort:'省エネ投球'}),cfg:{st:{era:9.8}},call:true}]],
  ['unknown effort and no effort while injured',[{state:pro({effort:'?'}),call:true},{state:pro({effort:'全力投球',seasonFactor:0}),call:true}]],
  ['pitcher safety limits',[{state:pro({role:'CL'}),cfg:{st:{G:200,IP:20,W:9,L:9,SV:300,HLD:300}},call:true},{state:pro({role:'MR'}),cfg:{st:{G:10,IP:180,W:20,L:15,SV:4}},call:true}]],
  ['batter plate appearances and game cap',[{state:bat(),cfg:{st:{G:150,PA:100}},call:true},{state:bat({lv:'NOGAMES'}),cfg:{st:{G:170}},call:true}]],
  ['event points apply and normalize',[{state:bat({pendStat:3,seasonFactor:.8}),call:true},{state:pro({pendStat:-2}),call:true}]],
  ['event points zero after factor',[{state:bat({pendStat:3,seasonFactor:0}),call:true}]],
  ['season-long injury card',[{state:bat({seasonFactor:0,ironStreak:3}),call:true}]],
  ['mid-season trade split',[{state:bat({tradeFrom:'旧球団'}),cfg:{r:[.1]},call:true},{state:pro({tradeFrom:'前球団'}),cfg:{r:[.9]},call:true}]],
  ['slump and career highs',[{state:bat(),cfg:{st:{form:-1}},call:true},{state:pro(),cfg:{st:{form:1}},call:true},{state:bat(),cfg:{st:{form:1}},call:true}]],
  ['iron man unlocked at five healthy seasons',[{state:bat({ironStreak:4}),call:true},{state:pro({ironStreak:4}),cfg:{st:{IP:119}},call:true},{state:pro({role:'MR',ironStreak:4}),cfg:{st:{G:42,IP:60}},call:true}]],
  ['iron man kept, streak reset and kept',[{state:bat({ironStreak:6,traits:{iron:true}}),call:true},{state:bat({ironStreak:3,seasonFactor:.94}),call:true},{state:bat({ironStreak:3}),cfg:{st:{G:100}},call:true}]],
  ['one tool unlocked, bench player',[{state:bat(),cfg:{st:{G:60},tool:{gap:22,val:58,role:'代走'},allStars:3},call:true}]],
  ['one tool unlocked again after decline',[{state:bat({removed:['一芸特化','鉄人']}),cfg:{st:{G:60},tool:{gap:30,val:70,role:'守備固め'}},call:true},{state:bat({age:33}),cfg:{st:{G:60},tool:{gap:30,val:70,role:'代打'}},call:true}]],
  ['one tool not unlocked at the thresholds',[{state:bat(),cfg:{st:{G:60},tool:{gap:21,val:70}},call:true},{state:bat(),cfg:{st:{G:60},tool:{gap:30,val:57}},call:true},{state:bat(),cfg:{st:{G:60},tool:{gap:30,val:70},allStars:4},call:true},{state:bat(),cfg:{st:{G:86},tool:{gap:30,val:70}},call:true}]],
  ['one tool boosts and is returned',[{state:bat({traits:{onetool:true},toolRole:'代走'}),cfg:{st:{G:60},tool:{gap:20,val:70}},call:true},{state:bat({traits:{onetool:true},toolRole:'代打'}),cfg:{st:{G:80},tool:{gap:25,val:70}},call:true},{state:bat({traits:{onetool:true},toolRole:'代打'}),cfg:{st:{G:40},tool:{gap:17,val:70}},call:true}]],
  ['one tool, injured season',[{state:bat({traits:{onetool:true},seasonFactor:0}),cfg:{tool:{gap:17,val:70}},call:true}]],
  ['market injury input',[{state:pro({seasonFactor:.4,rehab:1,skipMid:true,_majorInjuryThisSeason:true}),call:true}]],
  ['pipeline defers at every step',[{state:pro(),cfg:{pipe:{tjGamble:'defer',demotionAudit:'defer',tradeCheck:'defer',maybeIntl:'defer'}},call:true},{resume:true},{resume:true},{resume:true},{resume:true}]],
  ['pipeline step throws',[{state:pro(),cfg:{pipe:{tradeCheck:'throw'}},call:true},{cfg:{seasonEnd:true},call:true}]],
  ['waiting continuation resumes the season end',[{state:pro(),cfg:{pipe:{tjGamble:'defer'}},call:true},{cfg:{seasonEnd:true},call:true},{resume:true}]],
  ['waiting continuation restores a pending choice',[{state:pro(),cfg:{pipe:{maybeIntl:'defer'}},call:true},{cfg:{pending:true},call:true}]],
  ['waiting continuation without a resumable layer',[{state:bat(),cfg:{pipe:{demotionAudit:'defer'}},call:true},{call:true}]],
  ['awards fault, then resumed from awards',[{state:pro(),cfg:{awardsThrow:true},call:true},{cfg:{},call:true}]],
  ['season build fault is ambiguous',[{state:bat(),cfg:{simThrow:true},call:true},{call:true}]],
  ['next year builds a new season',[{state:pro(),cfg:{pipe:{tjGamble:'defer'}},call:true},{patch:{year:2036},call:true}]],
  ['state replaced, then the old continuation resumes',[{state:pro(),cfg:{pipe:{demotionAudit:'defer'}},call:true},{state:bat({year:2035}),call:true},{resume:true}]],
  ['state replaced during the build is stale',[{state:bat({traits:{onetool:true}}),cfg:{st:{G:100},tool:{gap:30,val:70},replaceOnBoard:bat({year:2035,age:30})},call:true}]],
];
function play(h,steps){
  const out=[];
  for(const step of steps){
    if(step.state)h.run.S=withTeam(structuredClone(step.state));
    if(step.patch)Object.assign(h.run.S,step.patch);
    if(step.cfg){h.run.cfg={...step.cfg};h.run.used={};}
    const before=h.run.log.length;let error=null;
    try{
      if(step.call)h.pro();
      else{assert.ok(step.resume&&h.run.deferred.length,'a deferred continuation');h.run.deferred.shift()();}
    }catch(e){if(e instanceof assert.AssertionError)throw e;error=e.message;}
    out.push({log:h.run.log.slice(before),error,state:JSON.stringify(h.run.S)});
  }
  return out;
}
let compared=0;
for(const [name,steps] of scenarios){
  const a=play(oldHarness(),steps),b=play(newHarness(),steps);
  assert.equal(a.length,steps.length,name+': all steps ran');assert.ok(a.every(x=>x.log.length>0||x.error),name+': stubs reached, or an error, on every step');
  assert.equal(JSON.stringify(b),JSON.stringify(a),name);compared++;
}
assert.equal(compared,scenarios.length);
// Every branch must be exercised here, and only the fault scenarios may throw.
const all=scenarios.map(([name,steps])=>[name,play(newHarness(),steps)]),results=all.flatMap(([,r])=>r),calls=results.flatMap(x=>x.log),states=results.map(x=>JSON.parse(x.state));
const errors=all.flatMap(([name,r])=>r.filter(x=>x.error).map(x=>name+': '+x.error));
assert.deepEqual(errors,['pipeline step throws: PIPE_FAULT_tradeCheck','waiting continuation without a resumable layer: SEASON_CONTINUATION_AMBIGUOUS','awards fault, then resumed from awards: AWARDS_FAULT','season build fault is ambiguous: SIM_FAULT','season build fault is ambiguous: PRO_SEASON_AMBIGUOUS','state replaced during the build is stale: STALE_SEASON_CONTINUATION'],'only the fault scenarios throw, with their own errors');
for(const name of ['simSeason','applyEvent','consumeEvent','normalizeEvent','bucketOf','accStat','accLevelStat','card','statLine','isSP','toolGap','allStars','traitCard','removeTrait','board','awards','classify','salaryEval','champ','tjAccrue',...PIPELINE,'nextStep','resumeSeasonEnd','restorePending','R'])assert.ok(calls.some(c=>c[0]===name),'reached '+name);
for(const title of ['シーズン成績','シーズン成績（シーズン途中の移籍）','深刻なスランプ','キャリアハイ','隠し特性解放：鉄人','一芸特化を返上'])assert.ok(calls.some(c=>c[0]==='card'&&c[2]===title),'card '+title);
assert.ok(calls.some(c=>c[0]==='card'&&c[3]==='（今季はけがで全休）'),'season-long injury');
assert.deepEqual([...new Set(calls.filter(c=>c[0]==='traitCard').map(c=>c[3].startsWith('衰えで')))].sort(),[false,true],'both one-tool texts');
assert.ok(states.some(s=>s.traits.iron)&&states.some(s=>s.ironStreak===0),'iron unlock and reset');
assert.ok(calls.filter(c=>c[0]==='nextStep').length>=3,'pipelines reach nextStep');
// Negative control: the same comparison sees a one-token change in the module body.
const mutated=moduleText.replace('st.SO=Math.round(st.SO*(1+em*0.06));','st.SO=Math.round(st.SO*(1+em*0.05));');
assert.notEqual(mutated,moduleText,'mutation applied');
const {ProfessionalSeason:Mutated}=await import('data:text/javascript,'+encodeURIComponent(mutated));
const caught=scenarios.filter(([,steps])=>JSON.stringify(play(newHarness(Mutated),steps))!==JSON.stringify(play(oldHarness(),steps))).map(([name])=>name);
assert.deepEqual(caught,['starter, full effort lowers ERA to the floor','starter, energy saving raises ERA to the ceiling'],'negative control caught by the effort scenarios only');
console.log(`professional-season checks passed (${compared} scenarios).`);

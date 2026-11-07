import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createContext,runInContext} from 'node:vm';
import {readSourceText,sourceText} from './support/source-text.mjs';
import {SeasonPhases} from '../docs/src/engine/season-phases.js';

// Phase 34 (OOP plan §2mm): phasePre and phaseMid moved verbatim from game.js into the SeasonPhases factory. Part 1
// proves the module is the base section plus the listed edits only; part 2 runs the base functions in a vm and the
// module in the main realm on the same stubs and compares the call log, errors and state after every call and click.
const BASE='7234965b265bbf763a0a43fd96bae3b47ab06e53';
const oldGame=sourceText(execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const PRE='\n/* シーズン開幕前。 */\nfunction phasePre(){\n',MID='\n}\n/* シーズン中。 */\nfunction phaseMid(){\n',END='\n}\nfunction eventChoiceSummary(';
for(const anchor of [PRE,MID,END])assert.equal(oldGame.split(anchor).length,2,'one old anchor: '+anchor.trim().slice(0,30));
const preStart=oldGame.indexOf(PRE)+PRE.indexOf('function'),midAt=oldGame.indexOf(MID),endAt=oldGame.indexOf(END);
assert.ok(preStart<midAt&&midAt<endAt,'phasePre, then phaseMid');
const oldPre=oldGame.slice(preStart,midAt+2),oldMid=oldGame.slice(midAt+MID.indexOf('function'),endAt+2);

// ---- Part 1: verbatim move ----
const HEADER=`// Pre-season and mid-season year steps (OOP plan §2mm): age-limit exit, decline, rehabilitation year, training dice,
// the genius unlock, the pitcher's effort plan and the veteran's spring choice; then the mid-season events, health
// check and season dispatch. The bodies are the former game.js phasePre/phaseMid. The career state is read at the start
// of each method and again in every deferred handler through getState. POS_AB, ABL, LV and clamp are passed by
// reference; every game.js function, declineForSeason and the R/ri/chance RNG bridge are injected late-binding lambdas,
// so E2E hooks that rebind allocUI, nextStep, R and the other names still reach these bodies.
`;
const indent=text=>text.split('\n').map(l=>l===''?l:'  '+l).join('\n');
const once=(text,from,to,label)=>{assert.equal(text.split(from).length,2,'one insertion site: '+label);return text.replace(from,()=>to);};
const G='const S=getState();';
// The ten state reads: each method start, and every handler that can run after the method returned.
let pre=indent(oldPre),mid=indent(oldMid);
pre=once(pre,'  function phasePre(){\n','  function phasePre(){\n    '+G+'\n','method start');
pre=once(pre,'    let afterAsk=()=>{\n','    let afterAsk=()=>{'+G+'\n','training');
pre=once(pre,'      afterAsk=()=>{\n','      afterAsk=()=>{'+G+'\n','pitching plan');
for(const effort of ['全力投球','通常投球','省エネ投球'])pre=once(pre,`f:()=>{S.effort='${effort}';preAsk();}`,`f:()=>{${G}S.effort='${effort}';preAsk();}`,effort);
pre=once(pre,"f:()=>{\n          const returnLv=","f:()=>{"+G+"\n          const returnLv=",'return to NPB');
pre=once(pre,"s:'現役を引退する',f:()=>{buyoutRemaining();","s:'現役を引退する',f:()=>{"+G+"buyoutRemaining();",'retirement');
mid=once(mid,'  function phaseMid(){\n','  function phaseMid(){\n    '+G+'\n','method start');
mid=once(mid,"main:true,f:()=>{\n          if(S.stage==='PRO')proSeason();","main:true,f:()=>{"+G+"\n          if(S.stage==='PRO')proSeason();",'season result');
const DEPS='getState,POS_AB,ABL,LV,clamp,board,card,choose,buyoutRemaining,reportFlowOutcome,declineForSeason,checkGoldclothSeason,stageLabel,addAb,dposReview,allocUI,nextStep,tjCap,ovr,signTo,daibaFarewell,loveEvent,drawEvents,rollInjury,proSeason,amateurSeason,rng:{R,ri,chance}';
const expected=HEADER+`export class SeasonPhases {
  #rules;
  constructor(deps){this.#rules=seasonPhaseRules(deps);}
  phasePre(){return this.#rules.phasePre();}
  phaseMid(){return this.#rules.phaseMid();}
}

function seasonPhaseRules({${DEPS}}){
${pre}
${mid}
  return {phasePre,phaseMid};
}
`;
const moduleText=readSourceText(new URL('../docs/src/engine/season-phases.js',import.meta.url));
assert.equal(moduleText,expected,'module = base section plus the listed edits');
assert.equal(moduleText.split(G).length,11,'ten state reads');
assert.deepEqual(['R','ri','chance','pick','pickRecord'].map(f=>(moduleText.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[2,6,1,0,0],'draw sites moved verbatim');

// ---- Part 2: behaviour, old functions (vm) vs module (main realm) ----
const POS_AB={P:['sta','vel','ctl','brk'],C:['con','pow','eye','rng','fld','arm','cat'],IF:['con','pow','spd','rng','fld']};
const ABL={sta:'スタミナ',vel:'球速',ctl:'制球',brk:'変化球',con:'ミート',pow:'パワー',eye:'選球眼',spd:'走力',rng:'守備範囲',fld:'捕球',arm:'肩力',cat:'リード'};
const LV={NPB1:{min:53},NPB2:{min:47}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function makeStubs(run){
  const log=run.log,cfg=()=>run.cfg;// cfg is read live: play() replaces run.cfg before every step
  const seq=(key,fallback)=>{const list=cfg()[key];if(!list)return fallback;const v=list[run.used[key]=(run.used[key]||0)]??list.at(-1);run.used[key]++;return v;};
  return {
    board:p=>log.push(['board',p]),card:(cls,title,html)=>log.push(['card',cls,title,html]),
    choose:(title,opts)=>{log.push(['choose',title,opts.map(o=>[o.t,o.s??null,!!o.main,!!o.warn])]);run.choices.push(opts);},
    buyoutRemaining:(...args)=>log.push(['buyout',...args]),
    reportFlowOutcome:outcome=>log.push(['outcome',outcome.kind,outcome.reason??null]),
    declineForSeason:(state,amount)=>{log.push(['decline',state===run.S,amount]);return cfg().dec??3;},
    checkGoldclothSeason:()=>log.push(['goldcloth']),stageLabel:()=>{log.push(['stageLabel']);return '社会人';},
    addAb:(k,v)=>{log.push(['addAb',k,v]);run.S.lastOverflow=cfg().overflow??0;return cfg().gained??v;},
    dposReview:cont=>{log.push(['dposReview']);cont();},
    allocUI:(mode,label,done)=>{log.push(['allocUI',mode.dice,label]);done();},
    nextStep:()=>log.push(['nextStep']),tjCap:()=>{log.push(['tjCap']);return cfg().tjCap??50;},
    ovr:()=>{log.push(['ovr']);return cfg().ovr??50;},
    signTo:(...args)=>{log.push(['signTo',...args]);run.S.org=args[0];run.S.lv=args[1];},
    daibaFarewell:cont=>{log.push(['farewell']);cont();},
    loveEvent:next=>{log.push(['love']);next();},drawEvents:(n,done)=>{log.push(['drawEvents',n]);done();},
    rollInjury:()=>log.push(['rollInjury']),proSeason:()=>log.push(['proSeason',run.S.lv]),amateurSeason:()=>log.push(['amateurSeason',run.S.stage]),
    R:()=>{const v=seq('r',.5);log.push(['R',v]);return v;},
    ri:(a,b)=>{const v=seq('ri',b);log.push(['ri',a,b,v]);return v;},
    chance:p=>{const v=!!cfg().chance;log.push(['chance',p,v]);return v;},
  };
}
function oldHarness(){
  const run={log:[],cfg:{},S:null,choices:[],used:{}},stubs=makeStubs(run);
  const context=createContext({...stubs,POS_AB,ABL,LV,clamp});
  Object.defineProperty(context,'S',{get:()=>run.S});// the game.js global, read live like the real binding
  runInContext("'use strict';\n"+oldPre+'\n'+oldMid+'\nglobalThis.__pre=()=>phasePre();globalThis.__mid=()=>phaseMid();',context);
  return {run,pre:()=>context.__pre(),mid:()=>context.__mid()};
}
function newHarness(source=SeasonPhases){
  const run={log:[],cfg:{},S:null,choices:[],used:{}},{R,ri,chance,...stubs}=makeStubs(run);
  const phases=new source({getState:()=>run.S,POS_AB,ABL,LV,clamp,...stubs,rng:{R:()=>R(),chance:p=>chance(p),ri:(a,b)=>ri(a,b)}});
  return {run,pre:()=>phases.phasePre(),mid:()=>phases.phaseMid()};
}
const base=(patch={})=>({name:'検証',pos:'IF',stage:'CORP',org:'CORP',lv:'CORP',team:'社会人チーム',year:2032,age:24,rehab:0,six:0,tj:0,effort:'通常投球',
  traits:{},ab:{sta:40,vel:40,ctl:40,brk:40,con:40,pow:40,eye:40,spd:40,rng:40,fld:40,arm:40,cat:40},pot:{con:62,pow:65},log:[],pendStat:0,...patch});
const pro=(patch={})=>base({stage:'PRO',org:'NPB',lv:'NPB1',team:'',...patch});
// Each step: optional state (fresh object), patch (mutates S), cfg (stub behaviour), then call 'pre'|'mid' or pick an
// option label from the latest choose() whose label starts with the given text.
const scenarios=[
  ['age limit',[{state:base({age:48}),call:'pre'}]],
  ['age limit PRO',[{state:pro({age:49}),call:'pre'}]],
  ['first decline stage, three dice',[{state:base({age:33}),cfg:{r:[.1],ri:[2,5,1]},call:'pre'},{pick:'▸ トレーニング成果'}]],
  ['second decline stage with disc',[{state:base({age:38,traits:{disc:true}}),cfg:{dec:5,r:[.5]},call:'pre'},{pick:'▸ トレーニング成果'}]],
  ['disc delays the decline',[{state:base({age:33,traits:{disc:true}}),cfg:{r:[.8]},call:'pre'},{pick:'▸ トレーニング成果'}]],
  ['six dice',[{state:base(),cfg:{r:[.97]},call:'pre'},{pick:'▸ トレーニング成果'}]],
  ['dice table boundaries',[{state:base(),cfg:{r:[.35]},call:'pre'},{state:base(),cfg:{r:[.75]},call:'pre'},{state:base(),cfg:{r:[.93]},call:'pre'},{state:base(),cfg:{r:[.95]},call:'pre'}]],
  ['second decline stage starts at 35',[{state:base({age:35}),cfg:{r:[.1]},call:'pre'},{state:base({age:34}),cfg:{r:[.1]},call:'pre'},{state:base({age:32}),cfg:{r:[.1]},call:'pre'},{state:base({age:31}),cfg:{r:[.1]},call:'pre'}]],
  ['rehabilitation year, amateur',[{state:base({rehab:2}),call:'pre'},{pick:'▸ トレーニング成果'}]],
  ['rehabilitation year, NPB1 pitcher',[{state:pro({pos:'P',rehab:1}),call:'pre'},{pick:'▸ トレーニング成果'}]],
  ['rehabilitation year, NPB2',[{state:pro({lv:'NPB2',rehab:1}),call:'pre'}]],
  ['distracted, academy hit',[{state:base({traits:{distract:true,academy:true}}),cfg:{r:[.1],chance:true},call:'pre'}]],
  ['academy miss',[{state:base({traits:{academy:true}}),cfg:{r:[.5],chance:false},call:'pre'}]],
  ['genius and late dice',[{state:base({traits:{genius:true}}),cfg:{r:[.5],ri:[6,4,5,6]},call:'pre'},{state:base({traits:{late:true}}),cfg:{r:[.1]},call:'pre'}]],
  ['sixes counted before 22',[{state:base({age:20,six:1}),cfg:{r:[.5],ri:[6,6,1,6]},call:'pre'}]],
  ['genius unlock, catcher',[{state:base({age:21,pos:'C',six:3}),cfg:{r:[.5,.3,.9,.1,.7,.2,.6],ri:[6,6,6,6]},call:'pre'},{pick:'▸ トレーニング成果'}]],
  ['genius unlock, capped abilities',[{state:base({age:20,six:4,ab:{con:75,pow:70,spd:30,rng:79,fld:80}}),cfg:{r:[.1,.4,.8]},call:'pre'}]],
  ['sixes after 22 not counted',[{state:base({age:22,six:4}),cfg:{r:[.1],ri:[6]},call:'pre'}]],
  ['combo gain and overflow',[{state:base({traits:{combo:true},comboKey:'pow'}),cfg:{r:[.1],ri:[3,4,5,6],gained:2,overflow:3},call:'pre'}]],
  ['combo from samePickKey, nothing gained',[{state:base({traits:{combo:true},samePickKey:'con',pendStat:4}),cfg:{r:[.1],gained:0,overflow:0},call:'pre'}]],
  ['combo skipped in a rehabilitation year',[{state:base({traits:{combo:true},comboKey:'pow',rehab:1}),call:'pre'}]],
  ['pitching plan full',[{state:pro({pos:'P'}),cfg:{tjCap:50},call:'pre'},{patch:{tj:44},pick:'全力投球'},{pick:'▸ トレーニング成果'}]],
  ['pitching plan normal, sore arm',[{state:pro({pos:'P',tj:43}),cfg:{tjCap:50},call:'pre'},{pick:'通常投球'}]],
  ['pitching plan energy saving',[{state:pro({pos:'P',tj:20,traits:{rubber:true}}),cfg:{tjCap:100},call:'pre'},{pick:'省エネ投球'},{pick:'▸ トレーニング成果'}]],
  ['pitching plan arm states',[{state:pro({pos:'P',tj:31}),call:'pre'},{state:pro({pos:'P',tj:17}),call:'pre'},{state:pro({pos:'P',tj:5}),call:'pre'}]],
  ['amateur pitcher has no plan',[{state:base({pos:'P'}),call:'pre'}]],
  ['veteran tries one more year',[{state:pro({age:36}),call:'pre'},{pick:'もう一年挑戦する'},{pick:'▸ トレーニング成果'}]],
  ['veteran pitcher tries, then plans',[{state:pro({age:37,pos:'P'}),call:'pre'},{pick:'もう一年挑戦する'},{pick:'省エネ投球'}]],
  ['veteran abroad returns to NPB1',[{state:pro({age:38,org:'MLB',lv:'MLB'}),cfg:{ovr:53},call:'pre'},{pick:'契約を断り'}]],
  ['veteran abroad returns to NPB2',[{state:pro({age:38,org:'KBO',lv:'KBO1'}),cfg:{ovr:50},call:'pre'},{pick:'契約を断り'}]],
  ['veteran abroad below NPB2',[{state:pro({age:38,org:'CPBL',lv:'CPBL1'}),cfg:{ovr:46},call:'pre'}]],
  ['veteran in MiLB',[{state:pro({age:39,org:'MiLB',lv:'A3'}),cfg:{ovr:47},call:'pre'}]],
  ['veteran retires',[{state:pro({age:40}),call:'pre'},{pick:'引退記者会見を開く'}]],
  ['veteran in a rehabilitation year is not asked',[{state:pro({age:40,rehab:1}),call:'pre'}]],
  ['state replaced before the click',[{state:pro({age:37,pos:'P'}),call:'pre'},{state:pro({age:37,pos:'P',year:2033,tj:40,traits:{genius:true}}),pick:'もう一年挑戦する'},{pick:'全力投球'},{pick:'▸ トレーニング成果'}]],
  ['state replaced before the effort click',[{state:pro({pos:'P'}),call:'pre'},{state:pro({pos:'P',year:2034,traits:{late:true}}),pick:'全力投球'},{pick:'▸ トレーニング成果'}]],
  ['state replaced before the return',[{state:pro({age:38,org:'MLB',lv:'MLB'}),cfg:{ovr:55},call:'pre'},{state:pro({age:38,org:'KBO',lv:'KBO1',year:2041}),pick:'契約を断り'}]],
  ['state replaced before the farewell',[{state:pro({age:41}),call:'pre'},{state:pro({age:41,year:2040}),pick:'引退記者会見を開く'}]],
  ['mid season skipped',[{state:base({skipMid:true,ironStreak:4}),call:'mid'}]],
  ['mid season amateur',[{state:base(),call:'mid'},{pick:'▸ シーズン半ばの健康診断'},{pick:'▸ 今季の成績を見る'}]],
  ['mid season professional',[{state:pro(),call:'mid'},{pick:'▸ シーズン半ばの健康診断'},{patch:{lv:'NPB2'},pick:'▸ 今季の成績を見る'}]],
  ['mid season, state replaced before the result',[{state:pro(),call:'mid'},{pick:'▸ シーズン半ばの健康診断'},{state:base({year:2040}),pick:'▸ 今季の成績を見る'}]],
];
function play(h,steps){
  const out=[];
  for(const step of steps){
    if(step.state){h.run.S=structuredClone(step.state);const S=h.run.S;S.teamName=()=>'球団:'+S.org+':'+S.lv;}
    if(step.patch)Object.assign(h.run.S,step.patch);
    if(step.cfg){h.run.cfg={...step.cfg};h.run.used={};}
    const before=h.run.log.length;let error=null;
    try{
      if(step.call)h[step.call]();
      else{const opts=h.run.choices.at(-1),option=opts&&opts.find(o=>o.t.startsWith(step.pick));assert.ok(option,'option '+step.pick);option.f();}
    }catch(e){if(e instanceof assert.AssertionError)throw e;error=e.message;}
    out.push({log:h.run.log.slice(before),error,state:JSON.stringify(h.run.S)});
  }
  return out;
}
let compared=0;
for(const [name,steps] of scenarios){
  const a=play(oldHarness(),steps),b=play(newHarness(),steps);
  assert.equal(a.length,steps.length,name+': all steps ran');assert.ok(a.every(x=>x.log.length>0),name+': stubs reached on every step');
  assert.equal(JSON.stringify(b),JSON.stringify(a),name);compared++;
}
assert.equal(compared,scenarios.length);
// The branches the natural careers never reach (§2mm.4) and the other rare branches must be exercised here.
const all=scenarios.flatMap(([,steps])=>play(newHarness(),steps)),calls=all.flatMap(x=>x.log),states=all.map(x=>JSON.parse(x.state));
assert.ok(all.every(x=>x.error===null),'no scenario step throws, so equal errors cannot mask a shared crash');
const kinds=new Set(calls.filter(c=>c[0]==='outcome').map(c=>c[1]));
for(const kind of ['PRESEASON_AGE_LIMIT_RETIRED','PRESEASON_RETURNED_NPB','PRESEASON_RETIRED'])assert.ok(kinds.has(kind),'reached '+kind);
for(const effort of ['全力投球','通常投球','省エネ投球'])assert.ok(states.some(s=>s.effort===effort&&s.pos==='P'),'effort '+effort);
assert.ok(calls.some(c=>c[0]==='signTo'&&c[2]==='NPB1')&&calls.some(c=>c[0]==='signTo'&&c[2]==='NPB2'),'both return levels');
assert.ok(calls.some(c=>c[0]==='card'&&c[1]==='gold'&&c[2]==='隠し特性解放：天才'),'genius unlock');
assert.ok(states.some(s=>s.pendStat>0&&s.traits.combo),'combo overflow');
for(const name of ['goldcloth','farewell','proSeason','amateurSeason','rollInjury','love','dposReview','allocUI','chance'])assert.ok(calls.some(c=>c[0]===name),'reached '+name);
assert.ok(all.some(x=>x.log.length===2&&x.log[0][0]==='board'&&x.log[1][0]==='nextStep'),'mid season skip');
// Negative control: the same comparison sees a one-token change in the module body.
const mutated=moduleText.replace("S.effort='省エネ投球';preAsk();","S.effort='通常投球';preAsk();");
assert.notEqual(mutated,moduleText,'mutation applied');
const {SeasonPhases:Mutated}=await import('data:text/javascript,'+encodeURIComponent(mutated));
const caught=scenarios.filter(([,steps])=>JSON.stringify(play(newHarness(Mutated),steps))!==JSON.stringify(play(oldHarness(),steps))).map(([name])=>name);
assert.deepEqual(caught,['pitching plan energy saving','veteran pitcher tries, then plans'],'negative control caught by the effort scenarios only');
console.log(`season-phases checks passed (${compared} scenarios).`);

import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {ChoicePrompt} from '../docs/src/ui/choice-prompt.js';
import {createChoiceActionToken,runChoiceAction} from '../docs/src/ui/choice-action.js';
import {CareerSession} from '../docs/src/engine/career-session.js';

// OOP plan §2ii: ChoicePrompt must behave exactly like the game.js choose family of 319be98de2906aa4e6e81b1eef76ff337cf721ae.
const old=execFileSync('git',['show','319be98de2906aa4e6e81b1eef76ff337cf721ae:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const start=old.indexOf('\nfunction escapeDiagnosticHTML('),end=old.indexOf('\n/* 能力加算介面');
assert.ok(start>0&&end>start);const oldBody=old.slice(start,end);

// Fake #act/#log and collaborators, identical for both sides. Every collaborator call lands in `calls`.
function environment(){
  const calls=[],faults={card:false},act={children:[],style:{},
    get innerHTML(){return act.children.map(b=>b.textContent).join('|');},
    querySelectorAll:selector=>selector==='button'?[...act.children]:[],
    contains:node=>act.children.includes(node)};
  const log={cards:0,querySelectorAll:selector=>{assert.equal(selector,'.card');return {length:log.cards};}};
  const $=id=>id==='act'?act:id==='log'?log:assert.fail('unknown id '+id);
  const actClear=()=>{calls.push('actClear');for(const b of act.children)b.isConnected=false;act.children=[];act.style.pointerEvents='';};
  const gameView={renderChoices(title,opts){calls.push('render:'+title);const buttons=opts.map(o=>({textContent:' '+o.t+' ',disabled:false,isConnected:true,onclick:null}));act.children.push(...buttons);return buttons;}};
  return {calls,faults,act,log,$,actClear,gameView,careerSession:new CareerSession(),
    actToggleSync:()=>calls.push('actToggleSync'),
    archiveTraitResults:()=>calls.push('archive'),
    card:(cls,title,html)=>{calls.push(['card',cls,title,html]);if(faults.card)throw new Error('CARD_FAULT');log.cards++;},
    scrollBottom:()=>calls.push('scrollBottom')};
}
function oldSide(){
  const e=environment(),ctx=vm.createContext({...e,createChoiceActionToken,runChoiceAction,S:null});
  vm.runInContext(oldBody,ctx);
  return {...e,getS:()=>ctx.S,setS:s=>{ctx.S=s;},views:vm.runInContext('choiceViews',ctx),handoffs:vm.runInContext('yearHandoffs',ctx),
    choose:ctx.choose,restorePendingChoice:ctx.restorePendingChoice,runWithResultView:ctx.runWithResultView};
}
function newSide(){
  const e=environment(),views=new WeakMap(),handoffs=new WeakMap();let S=null;
  const scrollAction=()=>e.scrollBottom();
  const prompt=new ChoicePrompt({...e,getState:()=>S,choiceViews:views,yearHandoffs:handoffs,scrollAction});
  return {...e,getS:()=>S,setS:s=>{S=s;},views,handoffs,
    choose:(title,opts)=>prompt.choose(title,opts),
    restorePendingChoice:(state=S,expected)=>prompt.restorePendingChoice(state,expected),
    runWithResultView:action=>prompt.runWithResultView(action)};
}

const stateAt=(year=2030,extra={})=>({year,age:25,stage:'PRO',org:'NPB',lv:'NPB1',currentSalary:1000,lastSalaryPaidYear:year-1,...extra});
function snapshot(side){
  const s=side.careerSession,state=side.getS(),view=state&&side.views.get(state);
  return {
    generation:s.choiceGeneration,token:s.activeChoiceToken&&{generation:s.activeChoiceToken.generation,running:s.activeChoiceToken.running},
    depth:s.resultViewDepth,hasAction:Boolean(s.currentChoiceAction),context:s.currentChoiceContext?.year??null,
    buttons:side.act.children.map(b=>[b.textContent,b.disabled,b.isConnected]),pointerEvents:side.act.style.pointerEvents??null,
    view:view?{year:view.year,generation:view.generation,title:view.title,accepted:view.accepted,rendered:view.rendered??null,kind:view.kind,buttons:view.buttons?.length??null,sameState:view.state===state}:null,
    calls:[...side.calls],cards:side.log.cards,
  };
}
const click=(side,index=0)=>{const b=side.buttons?.[index]??side.act.children[index];return b.onclick();};
const attempt=f=>{try{return {value:f()??null};}catch(error){return {error:error.message};}};

// Each scenario returns a list of records; the runner compares them across both sides.
const scenarios={
  'plain click runs the action inside the session context':side=>{
    side.setS(stateAt());const seen=[];
    side.choose('題',[{t:'甲',f:()=>{seen.push({action:Boolean(side.careerSession.currentChoiceAction),context:side.careerSession.currentChoiceContext.year,state:side.careerSession.currentChoiceContext.state===side.getS(),view:side.careerSession.currentChoiceContext.view===side.views.get(side.getS()),disabled:side.act.children.map(b=>b.disabled),pointerEvents:side.act.style.pointerEvents,depth:side.careerSession.resultViewDepth,calls:side.calls.length});return 7;}},{t:'乙',f:()=>assert.fail('not this one')}]);
    const before=snapshot(side),result=attempt(()=>click(side));
    return [before,seen,result,snapshot(side)];
  },
  'empty title and no options still render':side=>{side.setS(stateAt());side.choose('',[]);return [snapshot(side)];},
  'a second click on the accepted view does nothing':side=>{
    side.setS(stateAt());let runs=0;side.choose('題',[{t:'甲',f:()=>{runs++;side.choose('次',[{t:'乙',f:()=>{}}]);}}]);
    const first=side.act.children[0];first.onclick();const after=snapshot(side);first.onclick();return [runs,after,snapshot(side)];
  },
  'click after S was replaced does nothing':side=>{
    side.setS(stateAt());let runs=0;side.choose('題',[{t:'甲',f:()=>runs++}]);const b=side.act.children[0];side.setS(stateAt());b.onclick();return [runs,snapshot(side)];
  },
  'click after the year changed does nothing':side=>{
    side.setS(stateAt());let runs=0;side.choose('題',[{t:'甲',f:()=>runs++}]);const b=side.act.children[0];side.getS().year++;b.onclick();return [runs,snapshot(side)];
  },
  'stale button of an older prompt is ignored':side=>{
    side.setS(stateAt());let runs=0;side.choose('一',[{t:'甲',f:()=>runs++}]);const stale=side.act.children[0];side.choose('二',[{t:'乙',f:()=>{}}]);const value=attempt(()=>stale.onclick());return [runs,value,snapshot(side)];
  },
  'action failure reports, restores and rethrows':side=>{
    side.setS(stateAt(2030,{ct:{contractId:'C<1>',startYear:2029,endYear:2031,remainingYears:2,annualSalary:900,annualSchedule:[{year:'2030',amount:900,paid:false}]}}));
    side.choose('題',[{t:'甲',f:()=>{throw new Error('SOME_CODE');}}]);
    const result=attempt(()=>click(side));return [result,snapshot(side)];
  },
  'failure with a paid schedule row and a missing contract field':side=>{
    side.setS(stateAt(2030,{ct:{annualSchedule:[{year:2029,amount:1,paid:true},{year:2030,amount:'<2>',paid:true}]},org:null}));
    side.choose('題',[{t:'甲',f:()=>{throw new TypeError('lowercase message');}}]);
    return [attempt(()=>click(side)),snapshot(side)];
  },
  'failure with a schedule row without paid':side=>{
    side.setS(stateAt(2030,{ct:{annualSchedule:[{year:2030,amount:5}]}}));side.choose('題',[{t:'甲',f:()=>{throw new Error('E_NO');}}]);return [attempt(()=>click(side)),snapshot(side)];
  },
  'failure without a schedule':side=>{
    side.setS(stateAt(2030,{ct:{annualSchedule:'none'}}));side.choose('題',[{t:'甲',f:()=>{throw new Error('E_NO');}}]);return [attempt(()=>click(side)),snapshot(side)];
  },
  'failure without a contract':side=>{
    side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{throw new Error('E_NO');}}]);return [attempt(()=>click(side)),snapshot(side)];
  },
  'failure after the action replaced S does not restore and reports the new S':side=>{
    side.setS(stateAt(2030,{age:25}));side.choose('題',[{t:'甲',f:()=>{side.setS(stateAt(2040,{age:33,org:'MLB'}));throw new Error('E_NEW');}}]);
    return [attempt(()=>click(side)),snapshot(side)];
  },
  'failure after the action cleared S reports empty values':side=>{
    side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{side.setS(null);throw new Error('E_NULL');}}]);
    return [attempt(()=>click(side)),snapshot(side)];
  },
  'failure after the action changed the year does not restore':side=>{
    side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{side.getS().year++;throw new Error('E_YEAR');}}]);return [attempt(()=>click(side)),snapshot(side)];
  },
  'failure inside a nested prompt keeps the newer token':side=>{
    side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{side.choose('次',[{t:'乙',f:()=>{}}]);throw new Error('E_NEST');}}]);return [attempt(()=>click(side)),snapshot(side)];
  },
  'a card reporter failure still restores':side=>{
    side.setS(stateAt());side.faults.card=true;side.choose('題',[{t:'甲',f:()=>{throw new Error('E_A');}}]);return [attempt(()=>click(side)),snapshot(side)];
  },
  'NEXT_YEAR_AMBIGUOUS from a started handoff of this year':side=>{
    side.setS(stateAt());let runs=0;side.choose('題',[{t:'甲',f:()=>runs++}]);side.handoffs.set(side.getS(),new Map([['k',{status:'STARTED',targetYear:2030}]]));
    return [attempt(()=>click(side)),runs,snapshot(side)];
  },
  'handoff of another year or status does not block':side=>{
    side.setS(stateAt());let runs=0;side.choose('題',[{t:'甲',f:()=>runs++}]);side.handoffs.set(side.getS(),new Map([['a',{status:'STARTED',targetYear:2031}],['b',{status:'DONE',targetYear:2030}]]));
    return [attempt(()=>click(side)),runs,snapshot(side)];
  },
  'nested click restores the outer session context':side=>{
    side.setS(stateAt());const seen=[];const outer={action:()=>{}};side.careerSession.currentChoiceAction=outer.action;side.careerSession.currentChoiceContext={year:1};
    side.choose('題',[{t:'甲',f:()=>{seen.push(side.careerSession.currentChoiceAction!==outer.action,side.careerSession.currentChoiceContext.year);}}]);click(side);
    return [seen,side.careerSession.currentChoiceAction===outer.action,side.careerSession.currentChoiceContext.year,snapshot(side)];
  },
  'failing action restores the outer session context':side=>{
    side.setS(stateAt());const outer=()=>{};side.careerSession.currentChoiceAction=outer;side.careerSession.currentChoiceContext={year:1};
    side.choose('題',[{t:'甲',f:()=>{throw new Error('E_OUTER');}}]);const result=attempt(()=>click(side));
    return [result,side.careerSession.currentChoiceAction===outer,side.careerSession.currentChoiceContext.year,snapshot(side)];
  },
  'prompt rendered inside a result view does not scroll':side=>{
    side.setS(stateAt());side.careerSession.resultViewDepth=1;side.choose('題',[{t:'甲',f:()=>{}}]);return [snapshot(side)];
  },
  'result view scrolls to the log when a card was added':side=>{
    const value=attempt(()=>side.runWithResultView(()=>{side.card('info','t','h');return 5;}));return [value,snapshot(side)];
  },
  'result view without a card scrolls the action area':side=>{
    const value=attempt(()=>side.runWithResultView(()=>6));return [value,snapshot(side)];
  },
  'nested result view without a card leaves the scroll to the outer':side=>{
    side.runWithResultView(()=>{side.runWithResultView(()=>{});side.calls.push('inner done');});return [snapshot(side)];
  },
  'result view scrolls and restores depth on failure':side=>{
    const value=attempt(()=>side.runWithResultView(()=>{throw new Error('E_VIEW');}));return [value,snapshot(side)];
  },
  'restore without a view':side=>{side.setS(stateAt());return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore of another state':side=>{
    side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);const other=side.getS();side.setS(stateAt());return [attempt(()=>side.restorePendingChoice(other)),snapshot(side)];
  },
  'restore in another year':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);side.getS().year++;return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore of an allocation view':side=>{side.setS(stateAt());side.views.set(side.getS(),{year:2030,kind:'ALLOCATION'});return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore with the expected view':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);const view=side.views.get(side.getS());return [attempt(()=>side.restorePendingChoice(side.getS(),view)),snapshot(side)];},
  'restore with another expected view':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);return [attempt(()=>side.restorePendingChoice(side.getS(),{})),snapshot(side)];},
  'restore of a live prompt keeps the buttons':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}},{t:'乙',f:()=>{}}]);return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore re-renders after a disabled button':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}},{t:'乙',f:()=>{}}]);side.act.children[1].disabled=true;return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore re-renders after the buttons were cleared':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);side.actClear();return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore re-renders a detached button still marked connected':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);side.act.children.length=0;return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore re-renders a button connected to nothing':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);side.act.children[0].isConnected=false;return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore re-renders after a newer generation':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);side.careerSession.choiceGeneration++;return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore re-renders an unfinished render':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);side.views.get(side.getS()).rendered=false;return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore re-renders when an option was added':side=>{side.setS(stateAt());const opts=[{t:'甲',f:()=>{}}];side.choose('題',opts);opts.push({t:'乙',f:()=>{}});return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'restore refuses an accepted view whose buttons are gone':side=>{side.setS(stateAt());side.choose('題',[{t:'甲',f:()=>{}}]);click(side);return [attempt(()=>side.restorePendingChoice()),snapshot(side)];},
  'clicking a stale view after a rerender of the same prompt':side=>{
    side.setS(stateAt());let runs=0;const opts=[{t:'甲',f:()=>runs++}];side.choose('題',opts);const stale=side.act.children[0],view=side.views.get(side.getS());side.careerSession.choiceGeneration++;
    const result=attempt(()=>stale.onclick());return [runs,result,view.accepted,snapshot(side)];
  },
  'the current button recovers a token that was marked stale':side=>{
    side.setS(stateAt());let runs=0;side.choose('題',[{t:'甲',f:()=>runs++}]);side.careerSession.activeChoiceToken={generation:99,running:false};return [attempt(()=>click(side)),runs,snapshot(side)];
  },
  'a button of an unfinished render does not run the action':side=>{
    side.setS(stateAt());let runs=0;side.choose('題',[{t:'甲',f:()=>runs++}]);side.views.get(side.getS()).rendered=false;return [attempt(()=>click(side)),runs,snapshot(side)];
  },
};

const quiet=f=>{const {error,debug}=console,logged=[];const record=kind=>(...args)=>logged.push([kind,args[0],args[1]&&{...args[1],stack:null}]);console.error=record('error');console.debug=record('debug');try{return {result:f(),logged};}finally{console.error=error;console.debug=debug;}};
let compared=0;
for(const [name,scenario] of Object.entries(scenarios)){
  const a=JSON.stringify(quiet(()=>scenario(oldSide()))),b=JSON.stringify(quiet(()=>scenario(newSide())));
  assert.equal(b,a,name);compared++;
}
assert.equal(compared,Object.keys(scenarios).length);

// The compare above is only as good as what the scenarios reach, so pin the behaviours that matter on the new side.
{
  const run=name=>quiet(()=>scenarios[name](newSide())).result;
  const failing=run('action failure reports, restores and rethrows');
  assert.deepEqual(failing[0],{error:'SOME_CODE'});
  const card=failing[1].calls.find(c=>Array.isArray(c)&&c[0]==='card');
  assert.equal(card[1],'bad');assert.match(card[3],/エラーコード：SOME_CODE/);assert.match(card[3],/契約ID C&lt;1&gt;/);assert.match(card[3],/900円／未払い/);
  assert.equal(failing[1].buttons.length,1);assert.equal(failing[1].buttons[0][1],false);

  const replaced=run('failure after the action replaced S does not restore and reports the new S');
  assert.equal(replaced[1].generation,1);assert.deepEqual(replaced[1].buttons.map(x=>x[1]),[true]);
  const newCard=replaced[1].calls.find(c=>Array.isArray(c)&&c[0]==='card');assert.match(newCard[3],/年度 2040｜年齢 33｜MLB/);

  assert.deepEqual(run('NEXT_YEAR_AMBIGUOUS from a started handoff of this year').slice(0,2),[{error:'NEXT_YEAR_AMBIGUOUS'},0]);
  assert.equal(run('click after S was replaced does nothing')[0],0);
  assert.equal(run('click after the year changed does nothing')[0],0);
  assert.equal(run('a second click on the accepted view does nothing')[0],1);
  assert.equal(run('a button of an unfinished render does not run the action')[1],0);
  assert.deepEqual(run('restore with the expected view')[0],{value:true});
  assert.deepEqual(run('restore with another expected view')[0],{value:false});
  assert.deepEqual(run('restore refuses an accepted view whose buttons are gone')[0],{value:false});
  assert.equal(run('restore re-renders after the buttons were cleared')[1].generation,2);
  assert.equal(run('restore of a live prompt keeps the buttons')[1].generation,1);
  assert.deepEqual(run('the current button recovers a token that was marked stale').slice(0,2),[{value:0},1]);
}
console.log('choice prompt tests: ok ('+compared+' scenarios)');

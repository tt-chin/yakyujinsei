import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createContext,runInContext} from 'node:vm';
import {readSourceText,sourceText} from './support/source-text.mjs';
import {CheckpointRenderer} from '../docs/src/ui/checkpoint-renderer.js';

// Phase 36 (OOP plan §2oo): renderCheckpointCard moved from game.js into CheckpointRenderer. Part 1 proves the render body
// is the base function with only the three listed edits (receipts in a private WeakMap instead of owner.renderReceipts,
// and the injected card/logTarget). Part 2 runs the base function in a vm and the class in the main realm on the same stubs
// and compares every call's result, error, card calls, logTarget calls and DOM writes, then probes each receipt with a retry.
const BASE='c62cd4a0b3c206b88afd2a0f05c6660f05b38769';
const oldGame=sourceText(execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const START='\nfunction renderCheckpointCard(owner,key,args){\n',END='\n}\n/* 升降格と去向。 */\n';
for(const anchor of [START,END])assert.equal(oldGame.split(anchor).length,2,'one old anchor: '+anchor.trim().slice(0,30));
const oldFunction=oldGame.slice(oldGame.indexOf(START)+1,oldGame.indexOf(END)+2);

// ---- Part 1: the render body ----
const once=(text,from,to,label)=>{assert.equal(text.split(from).length,2,'one edit site: '+label);return text.replace(from,()=>to);};
let body=oldFunction.split('\n').slice(1,-1).map(l=>l===''?l:'  '+l).join('\n')+'\n';
body=once(body,'    const receipts=owner.renderReceipts||(owner.renderReceipts=new Map());','    let receipts=this.#receipts.get(owner);if(!receipts){receipts=new Map();this.#receipts.set(owner,receipts);}','receipts');
body=once(body,'?logTarget():null','?this.#logTarget():null','logTarget');
body=once(body,'try{card(...args);','try{this.#card(...args);','card');
const module=readSourceText(new URL('../docs/src/ui/checkpoint-renderer.js',import.meta.url));
const HEADER=`// 結果カードの描画レシート（物件導向化 第36期）。owner ごと・key ごとに一度だけ描画し、失敗時に曖昧な DOM 書き込みを検出する。
// レシートは owner を鍵とする WeakMap に持ち、owner（賞の計画・シーズン終了の entry）へ描画状態を書き込まない。
// card と logTarget は game.js から遅延束縛の lambda で注入する。E2E とテストは game.js の card を差し替えて故障を注入するため、GameView.card を直接呼ばない。
export class CheckpointRenderer {
  #receipts = new WeakMap();
  #card;
  #logTarget;
  constructor({ card, logTarget }) {
    this.#card = card; this.#logTarget = logTarget;
  }
  render(owner,key,args){
`;
assert.equal(module,HEADER+body+'  }\n}\n','module is the header plus the base function with the three edits');

// ---- Part 2: old function in a vm, class in the main realm, same stubs ----
function fakeDom(){
  const target={children:[],get lastElementChild(){return this.children.at(-1)??null;}};
  const node=cls=>({cls,classList:{contains:c=>cls.split(' ').includes(c)}});
  return {target,node};
}
// Each card behaviour: what the stub appends (or removes) before it returns or throws.
const BEHAVIOURS={
  ok:(dom)=>{dom.target.children.push(dom.node('card info'));},
  throwBefore:()=>{throw Error('CARD_FAULT');},
  appendCardThenThrow:(dom)=>{dom.target.children.push(dom.node('card gold'));throw Error('CARD_FAULT');},
  appendOtherThenThrow:(dom)=>{dom.target.children.push(dom.node('divider'));throw Error('CARD_FAULT');},
  appendTwoThenThrow:(dom)=>{dom.target.children.push(dom.node('card'),dom.node('card'));throw Error('CARD_FAULT');},
  removeThenThrow:(dom)=>{dom.target.children.pop();throw Error('CARD_FAULT');},
};
function run(kind,{withDocument,sequence}){
  const dom=fakeDom();dom.target.children.push(dom.node('card old'));
  const log=[];let behaviour='ok';
  const card=(...args)=>{log.push(['card',JSON.stringify(args)]);BEHAVIOURS[behaviour](dom);};
  const logTarget=()=>{log.push(['logTarget']);return dom.target;};
  let render,ownerOf;const owners={a:{},b:{}};
  if(kind==='old'){
    const c=createContext({card:(...a)=>card(...a),logTarget:()=>logTarget(),Map,Error,...(withDocument?{document:{}}:{})});
    runInContext(oldFunction,c);render=(o,k,a)=>c.renderCheckpointCard(o,k,a);
  }else{
    const r=new CheckpointRenderer({card:(...a)=>card(...a),logTarget:()=>logTarget()});
    render=(o,k,a)=>{const had='document' in globalThis;if(withDocument)globalThis.document={};try{return r.render(o,k,a);}finally{if(withDocument&&!had)delete globalThis.document;}};
  }
  for(const [owner,key,b] of sequence){
    behaviour=b;let result;
    try{result=['return',render(owners[owner],key,['gold','title-'+key,'html'])];}catch(e){result=['throw',e.message];}
    log.push(['result',owner,key,b,...result,dom.target.children.map(n=>n.cls).join('|')]);
  }
  return {log,owners:Object.fromEntries(Object.entries(owners).map(([k,v])=>[k,Object.keys(v)]))};
}
// Every behaviour, then a successful retry of the same receipt (COMMITTED skips, PLANNED re-renders, AMBIGUOUS throws),
// a second key on the same owner and the same key on another owner, with and without a document.
const cases=[];
for(const withDocument of [true,false])for(const b of Object.keys(BEHAVIOURS))
  cases.push({withDocument,sequence:[['a','k',b],['a','k','ok'],['a','k','throwBefore'],['a','k2','ok'],['b','k','ok']]});
cases.push({withDocument:true,sequence:[['a','k','appendOtherThenThrow'],['a','k','appendOtherThenThrow'],['b','k','appendCardThenThrow'],['b','k','throwBefore']]});
let compared=0;
for(const c of cases){
  const oldRun=run('old',c),newRun=run('new',c);
  assert.ok(oldRun.log.length>0);
  assert.equal(JSON.stringify(newRun.log),JSON.stringify(oldRun.log),'same calls, results and DOM: '+JSON.stringify(c));
  // The one intended difference: the base function wrote renderReceipts onto each rendered owner; the class writes nothing.
  assert.ok(oldRun.owners.a.includes('renderReceipts'));
  assert.deepEqual(newRun.owners,{a:[],b:[]},'owners stay free of render state');
  compared++;
}
assert.equal(compared,cases.length);
// The retry probes distinguish the three receipt states, and both document modes reach the target branch differently.
const seen=new Set(cases.flatMap(c=>run('old',c).log.filter(e=>e[0]==='result').map(e=>e[4]+':'+(e[5]??''))));
for(const outcome of ['return:','throw:CARD_FAULT','throw:RESULT_RENDER_AMBIGUOUS'])assert.ok(seen.has(outcome),'reached '+outcome);
// A COMMITTED receipt skips the card: some retry returns without a card call.
assert.ok(cases.some(c=>{const l=run('old',c).log;return l.some((e,i)=>e[0]==='result'&&e[4]==='return'&&l[i-1]?.[0]==='result');}),'reached a skipped retry');
assert.ok(run('old',cases[0]).log.some(e=>e[0]==='logTarget')&&!run('old',cases[6]).log.some(e=>e[0]==='logTarget'),'logTarget only with a document');

// Negative control: a renderer that loses the "one appended card" acknowledgement must differ from the base function.
const mutated=module.replace('target.children.length===count+1&&','target.children.length===count+2&&');
assert.notEqual(mutated,module);
const {CheckpointRenderer:Mutated}=await import('data:text/javascript,'+encodeURIComponent(mutated));
const mutatedLog=(()=>{const dom=fakeDom();const r=new Mutated({card:()=>BEHAVIOURS.appendCardThenThrow(dom),logTarget:()=>dom.target});globalThis.document={};
  try{const out=[],owner={};for(let i=0;i<2;i++){try{r.render(owner,'k',[]);out.push('return');}catch(e){out.push(e.message);}}return out;}finally{delete globalThis.document;}})();
assert.deepEqual(mutatedLog,['CARD_FAULT','RESULT_RENDER_AMBIGUOUS'],'mutated acknowledgement is caught');
console.log(`checkpoint-renderer.test: ${compared} old/new cases equal`);

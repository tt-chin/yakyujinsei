// Season event cards: the draw loop, choice summaries, result rendering and resolution (OOP plan §2v).
// The career state is read through getState; EVENTS, the POS_AB/ABL tables and fmtMoney are passed by reference, and the
// game.js UI helpers and the chance/pick RNG bridge as late-binding lambdas. The rule bodies are the former game.js
// evOdds/eventChoiceSummary/drawEvents/renderEventResult/resolveEvent, and each unit, including the deferred draw option,
// reads getState() live.
import { EVENT_MODES, eventOdds, effectiveCategory, eventTier, eventPlan, eventInjury, eventIncome, EVENT_TRAIT_TEXT } from './event-policy.js';
import { eventDrawPool, beginEvent, applyEvent } from './event-state-policy.js';

export class SeasonEvents {
  #rules;
  constructor(deps){this.#rules=seasonEventRules(deps);}
  eventChoiceSummary(ev,mode){return this.#rules.eventChoiceSummary(ev,mode);}
  drawEvents(n,done){this.#rules.drawEvents(n,done);}
  renderEventResult(ev,result){this.#rules.renderEventResult(ev,result);}
}

function seasonEventRules({getState,EVENTS,POS_AB,ABL,choose,card,board,fmtMoney,logTarget,displayTrait,rng:{chance,pick}}){
  function evOdds(){const S=getState();return eventOdds(S.traits);}
  function eventChoiceSummary(ev,mode){
    const S=getState();
    const category=effectiveCategory(ev,S.stage),tier=eventTier(S.traits),good=eventPlan(category,mode,tier,true),bad=eventPlan(category,mode,tier,false);
    const label={training:'トレーニング',encounter:'日常・交流',endorsement:'広報・スポンサー'}[category];
    const effect=plan=>[plan.ability>0?'育成点+'+plan.ability:plan.ability<0?'能力'+plan.ability:'',plan.stat?'今季成績点'+(plan.stat>0?'+':'')+plan.stat:''].filter(Boolean).join('・');
    const risk=eventInjury(ev,mode,false,S.traits),income=good.cash?eventIncome(S.lv,mode,true,S.traits):0;
    return label+'｜成功率 '+evOdds()[mode]+'%｜成功：'+effect(good)+'／失敗：'+effect(bad)+(good.cash?'｜成功時スポンサー収入：'+fmtMoney(income):'')+(risk?'｜失敗時故障リスク加算+'+risk+'ポイント':'');
  }
  function drawEvents(n,done){
    if(n<=0){done();return;}
    choose('',[{t:'イベントカードを引く（残り'+n+'枚）',main:true,f:()=>{const S=getState();
      const pool=eventDrawPool(S,EVENTS);
      if(!pool.length){card('info','イベント','今年まだ引いていない対象のイベントカードがないため、次へ進みます。');done();return;}
      const ev=pick(pool),pending=beginEvent(S,ev);
      const after=()=>{board(1);drawEvents(n-1,done);};
      choose('イベント｜'+ev.n+'――'+ev.intro,EVENT_MODES.map(mode=>({t:ev.choices[mode].label,warn:mode==='bold',main:mode==='norm',s:eventChoiceSummary(ev,mode),f:()=>resolveEvent(ev,mode,after,pending.eventOccurrenceID)})));
    }}]);
  }
  function renderEventResult(ev,result){
    const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const out=[({bold:'勝負',norm:'通常',safe:'安全'}[result.mode])+(result.success?'成功':'失敗')],a=result.ability;
    const points=result.abilityPoints??eventPlan(result.category,result.mode,result.tier,result.success).ability;
    if(points>0)out.push('獲得育成点 +'+points);
    else if(points<0)out.push('適用育成点 '+points);
    if(a){out.push((a.abilityDelta<0?'能力低下：':'')+ABL[result.target]+'：'+(a.abilityDelta>0?'+':'')+a.abilityDelta);out.push('育成点繰越 '+a.carryBefore+' → '+a.carryAfter);if(a.abilityDelta===0&&result.success&&!result.overflowStat)out.push('育成点は繰越へ蓄積され、次の1段階に必要なコストには届きませんでした。');}
    if(result.statDelta)out.push('今季成績点'+(result.statDelta>0?'+':'')+result.statDelta);
    if(result.overflowStat)out.push('能力80の超過分：今季成績点+'+result.overflowStat);
    if(result.injuryAdded)out.push('今季の故障リスク加算+'+result.injuryAdded+'ポイント（故障確定ではありません）');
    if(result.incomeYen)out.push('スポンサー収入：'+fmtMoney(result.incomeYen));
    card(result.success?'good':'bad','イベントカード｜'+ev.n,escape(ev.choices[result.mode][result.success?'good':'bad'])+'<br>'+out.map(escape).join('｜'));
    const node=logTarget().lastElementChild;if(node){node.dataset.eventOccurrenceId=result.eventOccurrenceID;node.dataset.cardId=String(result.cardID);}
  }
  function resolveEvent(ev,mode,done,occurrenceID){
    const S=getState();
    const {applied,result}=applyEvent(S,ev,mode,{chance,pick,abilityKeys:POS_AB[S.pos],occurrenceID});
    renderEventResult(ev,result);if(!applied)return;
    result.unlocked.forEach(key=>card(['cancer','distract','latepractice'].includes(key)?'bad':'gold','隠し特性解放：'+displayTrait(key),EVENT_TRAIT_TEXT[key]));
    (done||(()=>{}))();
  }
  return {eventChoiceSummary,drawEvents,renderEventResult};
}

import { createChoiceActionToken, runChoiceAction } from './choice-action.js';

// Choice prompt flow (OOP plan §2ii): renders the buttons, guards each click, runs the action, restores on failure.
// The career state is read on every call through getState, and again inside the closures that run after the render.
// choiceViews and yearHandoffs are the game.js WeakMaps, passed by reference. Uses no RNG.
function escapeDiagnosticHTML(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
export class ChoicePrompt {
  #deps;
  constructor(deps){this.#deps=deps;}
  restorePendingChoice(state,expected){const S=this.#deps.getState(),{careerSession,choiceViews,$}=this.#deps;
    const view=choiceViews.get(state);
    if(S!==state||view?.year!==state.year||view.kind!=='CHOICE'||(expected&&view!==expected))return false;
    if(view.generation===careerSession.choiceGeneration&&view.rendered&&view.buttons.length===view.opts.length&&view.buttons.every(b=>!b.disabled&&b.isConnected&&$('act').contains(b)))return true;
    if(view.accepted)return false;
    this.choose(view.title,view.opts);return true;
  }
  #invokeAnnualChoice(view,action){const S=this.#deps.getState(),{careerSession,yearHandoffs}=this.#deps;
    if(S!==view.state||S.year!==view.year||view.generation!==careerSession.choiceGeneration||view.accepted||!view.rendered)return;
    if([...yearHandoffs.get(S)?.values()||[]].some(h=>h.status==='STARTED'&&h.targetYear===S.year))throw new Error('NEXT_YEAR_AMBIGUOUS');
    const previous=careerSession.currentChoiceContext;careerSession.currentChoiceContext={state:S,year:S.year,view};
    try{const result=this.#invokeChoiceAction(action);view.accepted=true;return result;}finally{careerSession.currentChoiceContext=previous;}
  }
  #invokeChoiceAction(action){const {careerSession,archiveTraitResults}=this.#deps;archiveTraitResults();const previous=careerSession.currentChoiceAction;careerSession.currentChoiceAction=action;try{return action();}finally{careerSession.currentChoiceAction=previous;}}
  runWithResultView(action){const {careerSession,$,scrollBottom,scrollAction}=this.#deps,before=$('log').querySelectorAll('.card').length;careerSession.resultViewDepth++;try{return action();}finally{careerSession.resultViewDepth--;if($('log').querySelectorAll('.card').length>before)scrollBottom();else if(!careerSession.resultViewDepth)scrollAction();}}
  choose(title,opts){const S=this.#deps.getState(),{getState,careerSession,choiceViews,$,gameView,actClear,actToggleSync,card,scrollAction}=this.#deps;
    actClear(); const a=$('act'), generation=++careerSession.choiceGeneration, token=createChoiceActionToken(generation);
    const view={state:S,year:S.year,generation,title,opts,buttons:[],accepted:false,kind:'CHOICE'};choiceViews.set(S,view);
    careerSession.activeChoiceToken=token;
    const buttons=gameView.renderChoices(title,opts);
    opts.forEach((o,i)=>{ const b=buttons[i];
      b.onclick=()=>{const S=getState();if(S!==view.state||S.year!==view.year||view.accepted)return;return this.runWithResultView(()=>runChoiceAction({action:()=>this.#invokeAnnualChoice(view,o.f),currentMarkup:()=>a.innerHTML,clear:actClear,restore:()=>{const S=getState();if(S===view.state&&S.year===view.year)this.choose(title,opts);},token,currentGeneration:()=>careerSession.choiceGeneration,currentToken:()=>careerSession.activeChoiceToken,activateToken:t=>{careerSession.activeChoiceToken=t;},isCurrentChoice:()=>b.isConnected&&a.contains(b),buttonLabel:b.textContent.trim(),disableAll:()=>{a.querySelectorAll('button').forEach(button=>{button.disabled=true;});a.style.pointerEvents='none';},errorContext:()=>{const S=getState(),ct=S?.ct,schedule=Array.isArray(ct?.annualSchedule)?ct.annualSchedule:[],due=schedule.find(x=>Number(x.year)===Number(S?.year));return{year:S?.year??null,age:S?.age??null,stage:S?.stage??null,org:S?.org??null,level:S?.lv??null,contractId:ct?.contractId??null,contractStartYear:ct?.startYear??null,contractEndYear:ct?.endYear??null,contractRemainingYears:ct?.remainingYears??null,contractAnnualSalary:ct?.annualSalary??null,currentSalary:S?.currentSalary??null,lastSalaryPaidYear:S?.lastSalaryPaidYear??null,currentYearSchedule:due?{year:due.year,amount:due.amount,paid:Boolean(due.paid)}:null};},reportError:(error,d)=>{const val=x=>escapeDiagnosticHTML(String(x??'—')),schedule=d.currentYearSchedule?`${val(d.currentYearSchedule.amount)}円／${d.currentYearSchedule.paid?'支払済み':'未払い'}`:'なし';card('bad','処理中にエラーが発生しました',`選択処理を完了できませんでした。<br><b>エラーコード：${val(d.code)}</b><br><small>年度 ${val(d.year)}｜年齢 ${val(d.age)}｜${val(d.org)} ${val(d.level)}<br>契約ID ${val(d.contractId)}｜期間 ${val(d.contractStartYear)}～${val(d.contractEndYear)}｜残り ${val(d.contractRemainingYears)}年<br>現在年俸 ${val(d.currentSalary)}円｜最終支給年 ${val(d.lastSalaryPaidYear)}｜当年度年俸 ${schedule}</small><br>もう一度選択せず、この画面をスクリーンショットして報告してください。`);actToggleSync();}}));};view.buttons.push(b); });
    actToggleSync();view.rendered=true; if(!careerSession.resultViewDepth)scrollAction();
  }
}

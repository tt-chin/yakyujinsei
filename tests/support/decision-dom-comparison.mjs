// Approved phase-3 presentation only. Reconstruct the old DOM after validating
// every wrapper/metadata addition; game state, RNG and original body stay strict.
export function projectDecisionPresentation(markup,area,state){
  const fail=code=>{throw Error('PHASE3_'+code);};
  const t=document.createElement('template');t.innerHTML=markup;const root=t.content.firstElementChild;
  const only=(node,names)=>{if([...node.attributes].some(a=>!names.includes(a.name)))fail('ATTRIBUTES');};
  for(const card of root.querySelectorAll('[data-reader-card]')){
    if(!card.classList.contains('card')||!/^\d+$/.test(card.dataset.readerCard))fail('CARD');
    for(const meta of card.querySelectorAll(':scope > [data-reader-period]')){only(meta,['data-reader-period']);if(meta.tagName!=='P'||!/^\d{4}年・(?:シーズン前|シーズン中|シーズン終了|進行中)$/.test(meta.textContent))fail('PERIOD');meta.remove();}
    const details=card.querySelector(':scope > details[data-reader-details]');
    if(details){
      only(details,['data-reader-details','open']);
      const [summary,body]=details.children;
      if(details.children.length!==2||summary.tagName!=='SUMMARY'||summary.textContent!=='内容と結果'||!body.hasAttribute('data-reader-body'))fail('BODY');
      only(body,['data-reader-body']);
      const effects=body.querySelector(':scope > [data-event-effects]');
      if(effects){
        const result=state.processedEventIDs?.[card.dataset.eventOccurrenceId],event=window.__phase3Events.find(e=>e.id===result?.cardID);
        if(!result||!event)fail('EVENT_RESULT_MISSING');
        const [description,selection,outcome,list,calculation]=body.children;
        if(body.children.length!==5||description.tagName!=='P'||!description.hasAttribute('data-event-description')||description.textContent!==event.choices[result.mode][result.success?'good':'bad'])fail('DESCRIPTION');
        if(selection.tagName!=='P'||!selection.hasAttribute('data-event-selection')||selection.textContent!=='選んだ行動：'+event.choices[result.mode].label)fail('SELECTION');
        if(outcome.tagName!=='P'||!outcome.hasAttribute('data-event-outcome')||outcome.textContent!==(result.success?'成功':'失敗'))fail('OUTCOME');
        only(description,['data-event-description']);only(selection,['data-event-selection']);only(outcome,['data-event-outcome']);only(list,['data-event-effects']);
        const expected=[],a=result.ability,signed=n=>(n>0?'+':'')+n;
        if(a)expected.push([window.__phase3Labels[result.target]||result.target||'能力',`${a.before} → ${a.after}`],['育成点繰越',`${a.carryBefore} → ${a.carryAfter}`]);
        if(result.statDelta)expected.push(['今季成績点',signed(result.statDelta)]);
        if(result.overflowStat)expected.push(['能力80の超過分',`今季成績点 +${result.overflowStat}`]);
        if(result.injuryAdded)expected.push(['今季の故障リスク加算',`+${result.injuryAdded}ポイント（故障確定ではありません）`]);
        if(result.incomeYen)expected.push(['スポンサー収入',window.__phase3Money(result.incomeYen)]);
        if(!expected.length)expected.push(['実際の効果','数値の変化なし']);
        if(list.tagName!=='DL'||list.children.length!==expected.length*2)fail('EFFECTS');
        expected.forEach(([label,value],i)=>{const dt=list.children[i*2],dd=list.children[i*2+1];if(dt.tagName!=='DT'||dd.tagName!=='DD'||dt.attributes.length||dd.attributes.length||dt.textContent!==label||dd.textContent!==value)fail('EFFECT_VALUE');});
        only(calculation,['data-event-calculation','open']);const [caption,legacy]=calculation.children;
        if(calculation.tagName!=='DETAILS'||calculation.children.length!==2||caption.textContent!=='効果の詳細'||!legacy.hasAttribute('data-event-legacy'))fail('LEGACY');
        only(legacy,['data-event-legacy']);body.replaceChildren(...legacy.childNodes);
      }
      for(const note of body.querySelectorAll(':scope > [data-reader-selection]')){only(note,['data-reader-selection']);if(note.tagName!=='P'||!/^選んだ行動：.+/.test(note.textContent))fail('ACTION_LABEL');note.remove();}
      details.replaceWith(...body.childNodes);
    }else if(!(card.dataset.traitName&&card.children.length===1&&card.firstElementChild.tagName==='H4'))fail('MISSING_BODY');
    if(card.hasAttribute('data-reader-error')){if(!card.classList.contains('bad')||card.querySelector('h4')?.textContent!=='処理中にエラーが発生しました')fail('ERROR_CARD');card.removeAttribute('data-reader-error');}
    card.removeAttribute('data-reader-card');
  }
  if(area==='act'){
    const id=root.dataset.decisionId;
    if(id){const view=window.__phase3Pending();if(!/^decision-\d+$/.test(id)||root.dataset.decisionKind!==view.kind||root.dataset.eventChoice!==String(view.kind==='CHOICE'&&String(view.title).includes('event-badge')))fail('PENDING');}
    for(const attr of ['data-decision-id','data-decision-kind','data-event-choice'])root.removeAttribute(attr);
  }
  for(const heading of root.querySelectorAll('[data-reader-focus]')){if(!(heading.tagName==='H4'||heading.matches('div.title'))||heading.getAttribute('tabindex')!=='-1')fail('FOCUS');heading.removeAttribute('tabindex');heading.removeAttribute('data-reader-focus');}
  if(root.querySelector('[data-reader-body],[data-reader-details],[data-reader-period],[data-event-effects],[data-event-legacy],[data-reader-selection]'))fail('UNPROJECTED_NODE');
  return root.outerHTML;
}

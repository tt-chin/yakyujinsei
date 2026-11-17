// Approved phase-3 presentation only. Reconstruct the old DOM after validating
// every wrapper/metadata addition; game state, RNG and original body stay strict.
export function projectDecisionPresentation(markup,area,state){
  const fail=code=>{throw Error('PHASE3_'+code);};
  const t=document.createElement('template');t.innerHTML=markup;const root=t.content.firstElementChild;
  const only=(node,names)=>{if([...node.attributes].some(a=>!names.includes(a.name)))fail('ATTRIBUTES');};
  // Phase 5 adds read-only summaries alongside the unchanged original cards.
  // Numeric/source correctness is covered by career-review unit/native fixtures;
  // historical traces still compare every original card and full state/RNG.
  for(const review of root.querySelectorAll('[data-career-review]')){
    const retired=review.dataset.careerReview==='retirement',year=Number(review.dataset.reviewYear);
    if(!['retirement','season'].includes(review.dataset.careerReview)||!Number.isInteger(year)||year>state.year||review.tagName!=='SECTION'||review.className!=='career-review'||review.children[0]?.textContent!==`${year}年｜${retired?'引退':'シーズン終了'}`||review.children[1]?.tagName!=='H2'||review.children[1].textContent!==(retired?(state.name||'選手')+'の野球人生':'今季の振り返り')||review.querySelector('button,input,a,table'))fail('CAREER_REVIEW');
    only(review,['class','data-career-review','data-review-year','aria-label']);review.remove();
  }
  for(const card of root.querySelectorAll('[data-pitcher-farewell]')){
    if(state.pos!=='P'||card.querySelector('h4')?.textContent!=='引退の日')fail('FAREWELL');
    const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);let changed=false;
    for(let node=walker.nextNode();node;node=walker.nextNode()){const old=node.nodeValue;node.nodeValue=old.replace('9回裏、最後の登板を終えると','9回裏、最後の打席を終えると').replace('最後の登板を前に観客は3分間の総立ち拍手。','最後の打席を前に観客は3分間の総立ち拍手。').replace('マウンドを降りると、全員が','打席後に交代すると、全員が');if(old!==node.nodeValue)changed=true;}
    if(!changed)fail('FAREWELL_COPY');card.removeAttribute('data-pitcher-farewell');
  }
  if(area==='act'&&root.hasAttribute('data-allocation-session')){
    const view=window.__phase3Pending();if(view?.kind!=='ALLOCATION'||root.dataset.allocationSession!==root.dataset.decisionId)fail('ALLOCATION_SESSION');
    window.__phase4Starts??=new WeakMap();let start=window.__phase4Starts.get(view);
    if(!start){start={ab:{...state.ab},carry:{...state.carry}};window.__phase4Starts.set(view,start);}
    const period=root.querySelector('[data-allocation-period]');if(period?.tagName!=='P'||period.textContent!==`${view.year}年`)fail('ALLOCATION_PERIOD');only(period,['data-allocation-period']);period.remove();
    const guide=root.querySelector('[data-allocation-guide]');
    const guideText=['配分方法','サイコロは表示順に1個ずつ、ポイントは1点ずつ能力へ投入します。','現在値・潜在能力と育成点の進捗を確認してください。潜在能力を超えると必要な育成点が増えます。','「元に戻す」「すべてリセット」で今回の配分を戻せます。資料を見て戻っても同じ訓練を続けられます。'];
    if(guide?.tagName!=='DETAILS'||guide.children.length!==5||[guide.children[0],...Array.from(guide.children).slice(2)].some((n,i)=>n.tagName!==(i?'P':'SUMMARY')||n.textContent!==guideText[i]||n.attributes.length))fail('ALLOCATION_GUIDE');only(guide,['data-allocation-guide','open']);
    const original=guide.children[1],title=root.querySelector(':scope > .title');if(original.tagName!=='DIV'||!original.hasAttribute('data-allocation-original'))fail('ALLOCATION_ORIGINAL');only(original,['data-allocation-original']);if(title.textContent!==(root.querySelector('#dice')?'トレーニング':original.textContent))fail('ALLOCATION_TITLE');title.replaceChildren(...original.childNodes);guide.remove();
    const dice=root.querySelector('#dice'),remaining=dice?dice.querySelectorAll('.die:not(.used)').length:Number(root.querySelector('#al-top .pool')?.textContent.match(/：\s*(\d+)/)?.[1]);if(!Number.isFinite(remaining))fail('ALLOCATION_RESOURCE');
    for(const row of root.querySelectorAll('#al-rows .abrow')){
      const key=row.dataset.abilityKey,now=state.ab[key],gain=now-start.ab[key],preview=row.querySelector('[data-allocation-preview]'),action=row.querySelector('[data-allocation-action]');
      const expected=`今回 ${start.ab[key]} → ${now}（${gain>=0?'+':''}${gain}）｜育成点 ${row.querySelector('.progress').textContent}｜繰越 ${start.carry[key]||0} → ${state.carry?.[key]||0}`;
      if(preview?.tagName!=='SPAN'||preview.textContent!==expected||preview.id!=='allocation-preview-'+key||row.getAttribute('aria-describedby')!==preview.id)fail('ALLOCATION_PREVIEW');only(preview,['data-allocation-preview','id']);preview.remove();row.removeAttribute('aria-describedby');
      if(action?.tagName!=='SPAN'||action.getAttribute('aria-hidden')!=='true'||action.textContent!==(now>=80?'上限':remaining===0?'配分済み':dice?'サイコロを投入':'+1ポイント'))fail('ALLOCATION_ACTION');only(action,['data-allocation-action','aria-hidden']);action.remove();
    }
    const footer=root.querySelector('#al-btm'),status=footer.querySelector('[data-allocation-status]'),placeholder=footer.querySelector('[data-allocation-confirm-placeholder]'),allCap=[...root.querySelectorAll('.abrow')].every(r=>r.classList.contains('capped')),unit=dice?'サイコロ':'ポイント';
    const expected=`残り${unit}：${remaining}${dice?'個':'点'}｜`+(remaining>0&&!allCap?(dice?'残りのサイコロを割り当ててください':'残りのポイントを配分してください'):remaining>0?`上限のため、残りの${unit}は確定時に破棄されます。`:'配分内容を確認して確定してください');
    if(status?.tagName!=='P'||status.id!=='allocation-status'||status.textContent!==expected)fail('ALLOCATION_STATUS');only(status,dice?['data-allocation-status','id','role','aria-live']:['data-allocation-status','id']);if(dice&&(status.getAttribute('role')!=='status'||status.getAttribute('aria-live')!=='polite'))fail('ALLOCATION_LIVE');status.remove();
    if(remaining>0&&!allCap){if(placeholder?.tagName!=='BUTTON'||placeholder.type!=='button'||!placeholder.disabled||placeholder.textContent!=='確定 ▸'||placeholder.className!=='btn main'||placeholder.getAttribute('aria-describedby')!=='allocation-status')fail('ALLOCATION_DISABLED');only(placeholder,['type','class','data-allocation-confirm-placeholder','disabled','aria-describedby']);placeholder.remove();}else if(placeholder)fail('ALLOCATION_CONFIRM');
    if(!dice&&allCap&&remaining>0){const c=footer.querySelector('.main');if(c?.textContent!=='能力が上限に達しました。残ったポイントを捨てます ▸')fail('ALLOCATION_CAP_COPY');c.textContent='能力が上限に達しました。残ったサイコロを捨てます ▸';}
    root.removeAttribute('data-allocation-session');
    if(root.querySelector('[data-allocation-preview],[data-allocation-status],[data-allocation-action],[data-allocation-period],[data-allocation-guide],[data-allocation-confirm-placeholder]'))fail('ALLOCATION_UNPROJECTED');
  }
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

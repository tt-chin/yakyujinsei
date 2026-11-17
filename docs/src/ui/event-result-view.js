// Actual committed result payload only. No rule evaluation, state update or RNG.
export function decorateEventResult(node,event,result,{abilityLabels,fmtMoney}){
  if(!node?.ownerDocument)return;
  const doc=node.ownerDocument,body=node.querySelector('[data-reader-body]');if(!body)return;
  // Preserve the category badge and event name; omit the repeated card label.
  const heading=node.querySelector('h4'),label=heading?.lastChild;
  if(label?.nodeType===3&&label.nodeValue==='イベントカード｜'+event.n)label.nodeValue=event.n;
  const legacy=doc.createElement('div');legacy.dataset.eventLegacy='';
  body.querySelector('[data-reader-selection]')?.remove();
  while(body.firstChild)legacy.appendChild(body.firstChild);
  const description=doc.createElement('p');description.dataset.eventDescription='';description.textContent=event.choices[result.mode]?.[result.success?'good':'bad']||'結果の詳細記録なし';
  const selected=doc.createElement('p');selected.dataset.eventSelection='';selected.textContent='選んだ行動：'+(event.choices[result.mode]?.label||'詳細記録なし');
  const list=doc.createElement('dl');list.dataset.eventEffects='';
  const add=(label,value)=>{const dt=doc.createElement('dt'),dd=doc.createElement('dd');dt.textContent=label;dd.textContent=value;list.append(dt,dd);};
  const signed=n=>(n>0?'+':'')+n,a=result.ability;
  const completeAbility=a&&[a.before,a.after,a.carryBefore,a.carryAfter].every(Number.isFinite);
  if(a&&!completeAbility)legacy.textContent='詳細記録なし';
  if(completeAbility){add(abilityLabels[result.target]||result.target||'能力',`${a.before} → ${a.after}`);add('育成点繰越',`${a.carryBefore} → ${a.carryAfter}`);}
  if(result.statDelta)add('今季成績点',signed(result.statDelta));
  if(result.overflowStat)add('能力80の超過分',`今季成績点 +${result.overflowStat}`);
  if(result.injuryAdded)add('今季の故障リスク加算',`+${result.injuryAdded}ポイント（故障確定ではありません）`);
  if(result.incomeYen)add('スポンサー収入',fmtMoney(result.incomeYen));
  if(!list.children.length)add('実際の効果',a&&!completeAbility?'詳細記録なし':'数値の変化なし');
  const status=doc.createElement('p');status.dataset.eventOutcome='';status.textContent=result.success?'成功':'失敗';
  const details=doc.createElement('details'),summary=doc.createElement('summary');details.dataset.eventCalculation='';summary.textContent='効果の詳細';details.append(summary,legacy);
  body.append(description,selected,status,list,details);
}

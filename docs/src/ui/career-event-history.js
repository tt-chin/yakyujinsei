import { EVENT_CATEGORY_LABEL } from './event-category-badge.js';

// Year-by-year event history for キャリア → 年度別 (EVT-01 E3). Display only: reads S.processedEventIDs, writes nothing, no RNG.
// Category, outcome and effects are the values saved when the event resolved; nothing is recomputed from current traits or stage.
// Every occurrence is kept (no dedup by cardID). Events whose year matches no S.log row go to the 今季（進行中） group.
const MODE_LABEL = Object.freeze({bold:'勝負',norm:'通常',safe:'安全'});
const sequenceOf = id => { const n=Number(String(id).split(':')[1]); return Number.isFinite(n)?n:Infinity; };
const signed = n => (n>0?'+':'')+n;
const isRecord = value => value!==null&&typeof value==='object'&&!Array.isArray(value);

function eventItem(id, result, {cardsById, abilityLabels, fmtMoney}) {
  const card=cardsById.get(result.cardID);
  const title=card?.n||`不明なイベント（ID ${result.cardID??'—'}）`;
  const complete=Object.hasOwn(MODE_LABEL,result.mode)&&typeof result.success==='boolean';
  const outcome=complete?MODE_LABEL[result.mode]+(result.success?'成功':'失敗'):'詳細記録なし';
  const effects=[];
  if(complete){
    const delta=Number(result.abilityDelta)||0;
    if(delta)effects.push((delta<0?'能力低下：':'')+(abilityLabels[result.target]||result.target||'能力')+'：'+signed(delta));
    if(Number(result.statDelta))effects.push('成績点'+signed(Number(result.statDelta)));
    if(Number(result.overflowStat))effects.push('能力80の超過分：成績点+'+Number(result.overflowStat));
    if(Number(result.injuryAdded))effects.push('故障リスク加算+'+Number(result.injuryAdded)+'ポイント（故障確定ではありません）');
    if(Number(result.incomeYen))effects.push('スポンサー収入：'+fmtMoney(Number(result.incomeYen)));
  }
  return Object.freeze({occurrenceID:String(id),title,category:Object.hasOwn(EVENT_CATEGORY_LABEL,result.category)?result.category:null,outcome,success:complete?result.success:null,effects:Object.freeze(effects)});
}

export function buildEventHistory(state, yearly, {events=[], abilityLabels={}, fmtMoney=String}={}) {
  const processed=state?.processedEventIDs;
  if(!isRecord(processed))return Object.freeze({status:'missing',afterRow:Object.freeze({}),current:Object.freeze([])});
  const cardsById=new Map(events.map(card=>[card.id,card]));
  const lastRowOfYear=new Map();(yearly||[]).forEach((row,i)=>lastRowOfYear.set(row.year,i));
  const groups=new Map(),current=[];
  Object.entries(processed).filter(([,result])=>isRecord(result))
    .sort(([a,ra],[b,rb])=>(Number(ra.year)||0)-(Number(rb.year)||0)||sequenceOf(a)-sequenceOf(b))
    .forEach(([id,result])=>{
      const item=eventItem(id,result,{cardsById,abilityLabels,fmtMoney});
      const row=Number.isInteger(result.year)?lastRowOfYear.get(result.year):undefined;
      if(row===undefined){current.push(item);return;}
      if(!groups.has(row))groups.set(row,[]);groups.get(row).push(item);
    });
  return Object.freeze({status:'ok',afterRow:Object.freeze(Object.fromEntries([...groups].map(([row,items])=>[row,Object.freeze(items)]))),current:Object.freeze(current)});
}

function eventsRow(items, label, columns) {
  const tr=document.createElement('tr');tr.className='ui-yearly-events';
  const td=document.createElement('td');td.colSpan=columns;
  const details=document.createElement('details');
  const summary=document.createElement('summary');summary.textContent=`${label?label+' ':''}イベント（${items.length}件）`;details.appendChild(summary);
  const ul=document.createElement('ul');ul.className='ui-yearly-events-body';
  items.forEach(item=>{
    const li=document.createElement('li');li.dataset.eventOccurrenceId=item.occurrenceID;
    if(item.category){const badge=document.createElement('span');badge.className=`event-badge event-badge-${item.category}`;badge.textContent=EVENT_CATEGORY_LABEL[item.category];li.appendChild(badge);}
    const name=document.createElement('strong');name.textContent=item.title;li.appendChild(name);
    const p=document.createElement('p');p.textContent=[item.outcome,...item.effects].join('｜');li.appendChild(p);
    ul.appendChild(li);
  });
  details.appendChild(ul);td.appendChild(details);tr.appendChild(td);return tr;
}

// Appends the event row for yearly row `at` (a row index), or the trailing 今季（進行中） row when at==='current'.
// With unreadable records (status 'missing') the current call instead puts one イベント詳細記録なし row at the top of the table.
export function appendYearEvents(tbody, history, at, columns=4) {
  if(!history)return;
  if(at==='current'){
    if(history.status==='missing'){const tr=document.createElement('tr');tr.className='ui-yearly-events';const td=document.createElement('td');td.colSpan=columns;td.textContent='イベント詳細記録なし';tr.appendChild(td);tbody.insertBefore(tr,tbody.firstChild);return;}
    if(history.current.length)tbody.appendChild(eventsRow(history.current,'今季（進行中）',columns));
    return;
  }
  const items=history.afterRow[at];
  if(items?.length)tbody.appendChild(eventsRow(items,'',columns));
}

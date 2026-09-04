const value = v => v ?? 0;

function addPair(list, label, val) {
  const dt=document.createElement('dt'); dt.textContent=label;
  const dd=document.createElement('dd'); dd.textContent=String(val);
  list.append(dt,dd);
}

export function renderRecord(container, model) {
  container.replaceChildren();
  const panel=document.createElement('section'); panel.className='ui-panel';
  const heading=document.createElement('h2'); heading.textContent='通算成績'; panel.appendChild(heading);
  const list=document.createElement('dl'); list.className='ui-data-list';
  addPair(list,'プレー年数',`${value(model.seasons)}年`);
  addPair(list,'国際大会',`${value(model.internationalCount)}大会`);
  panel.appendChild(list); container.appendChild(panel);
  const totals=document.createElement('section'); totals.className='ui-panel';
  const title=document.createElement('h2'); title.textContent='階級別通算成績'; totals.appendChild(title);
  if(!model.groups.length){const empty=document.createElement('p');empty.className='ui-empty';empty.textContent='記録なし';totals.appendChild(empty);}
  model.groups.forEach(group=>{const h=document.createElement('h3');h.textContent=group.label;totals.appendChild(h);group.levels.forEach(item=>{const row=document.createElement('div');row.className='ui-stat-level';const label=document.createElement('strong');label.textContent=item.label;const p=document.createElement('p');p.textContent=item.summary;row.append(label,p);totals.appendChild(row);});});
  container.appendChild(totals);
}

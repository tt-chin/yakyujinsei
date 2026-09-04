const emptyText = (text='記録なし') => { const p=document.createElement('p'); p.className='ui-empty'; p.textContent=text; return p; };
const panel = title => { const section=document.createElement('section'); section.className='ui-panel'; const h=document.createElement('h2'); h.textContent=title; section.appendChild(h); return section; };
const list = values => { if(!values.length)return emptyText(); const ul=document.createElement('ul');ul.className='ui-list';values.forEach(value=>{const li=document.createElement('li');li.textContent=value;ul.appendChild(li);});return ul; };

export function renderPlayerDetail(container, model, tab, { onOpenSalaryDetail }={}) {
  container.replaceChildren();
  if(tab==='achievements'){
    const section=panel('実績'); section.appendChild(list(model.achievements)); container.appendChild(section); return;
  }
  if(tab==='contract'){
    const section=panel('契約・収入'); const dl=document.createElement('dl'); dl.className='ui-data-list';
    [['現在年俸',model.contract.currentSalary],['現契約',model.contract.description],['契約残年数',model.contract.remainingYears],['生涯総収入',model.contract.careerEarnings]].forEach(([label,val])=>{const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=val;dl.append(dt,dd);});
    section.appendChild(dl); const button=document.createElement('button');button.type='button';button.className='salary-detail-link';button.textContent='年俸の内訳を見る';button.addEventListener('click',()=>onOpenSalaryDetail?.());section.appendChild(button);container.appendChild(section);return;
  }
  if(tab==='traits'){
    const active=panel('保有特性');active.appendChild(list(model.traits.active));container.appendChild(active);
    const removed=panel('消失特性');removed.appendChild(list(model.traits.removed));container.appendChild(removed);
    const condition=panel('コンディション');condition.appendChild(list(model.traits.condition));container.appendChild(condition);return;
  }
  const section=panel('年度別');
  if(!model.yearly.length){section.appendChild(emptyText());container.appendChild(section);return;}
  const scroll=document.createElement('div');scroll.className='ui-yearly-scroll';const table=document.createElement('table');table.className='ui-yearly-table';
  const thead=document.createElement('thead');const hr=document.createElement('tr');['年度','年齢','所属','成績'].forEach(label=>{const th=document.createElement('th');th.textContent=label;hr.appendChild(th);});thead.appendChild(hr);table.appendChild(thead);
  const tbody=document.createElement('tbody');model.yearly.forEach(row=>{const tr=document.createElement('tr');[row.year,row.age,row.team,row.summary].forEach(val=>{const td=document.createElement('td');td.textContent=String(val??'');tr.appendChild(td);});tbody.appendChild(tr);});table.appendChild(tbody);scroll.appendChild(table);section.appendChild(scroll);container.appendChild(section);
}

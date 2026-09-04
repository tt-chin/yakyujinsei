function addAbilityRow(list,item){
  const dt=document.createElement('dt');dt.textContent=item.label;
  const dd=document.createElement('dd');dd.textContent=`${item.current} / ${item.potential}`;
  list.append(dt,dd);
}

function addConditionRow(list,item){
  const dt=document.createElement('dt');dt.textContent=item.label;
  const dd=document.createElement('dd');dd.textContent=item.value;
  list.append(dt,dd);
}

export function renderAbility(container,model){
  container.replaceChildren();
  const abilities=document.createElement('section');abilities.className='ui-panel';
  const abilityHeading=document.createElement('h2');abilityHeading.textContent=`${model.positionLabel}能力`;
  const guide=document.createElement('p');guide.className='ui-ability-guide';guide.textContent='現在値 / 潜在能力上限';
  const list=document.createElement('dl');list.className='ui-data-list ui-ability-list';
  model.abilities.forEach(item=>addAbilityRow(list,item));abilities.append(abilityHeading,guide,list);container.appendChild(abilities);

  const condition=document.createElement('section');condition.className='ui-panel';
  const conditionHeading=document.createElement('h2');conditionHeading.textContent='コンディション';
  const conditionList=document.createElement('dl');conditionList.className='ui-data-list';
  model.condition.forEach(item=>addConditionRow(conditionList,item));condition.append(conditionHeading,conditionList);container.appendChild(condition);
}

const traitList=values=>{const ul=document.createElement('ul');ul.className='ui-list';values.forEach(value=>{const li=document.createElement('li');li.textContent=value;ul.appendChild(li);});return ul;};
export function renderTraits(container,model){
  container.replaceChildren();
  if(!model.active.length&&!model.removed.length){const section=document.createElement('section');section.className='ui-panel';const p=document.createElement('p');p.className='ui-empty';p.textContent='現在表示できる特性はありません。';section.appendChild(p);container.appendChild(section);return;}
  [['保有特性',model.active],['消失特性',model.removed]].forEach(([title,values])=>{const section=document.createElement('section');section.className='ui-panel';const h=document.createElement('h2');h.textContent=title;section.appendChild(h);if(values.length)section.appendChild(traitList(values));else{const p=document.createElement('p');p.className='ui-empty';p.textContent='記録なし';section.appendChild(p);}container.appendChild(section);});
}

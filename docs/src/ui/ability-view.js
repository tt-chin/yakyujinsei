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
  const summary=document.createElement('section');summary.className='ui-panel ability-overall';
  const heading=document.createElement('h2');heading.textContent='能力';
  const overall=document.createElement('p');overall.innerHTML='<span>総合</span>';
  const value=document.createElement('strong');value.textContent=String(model.overall);overall.appendChild(value);
  summary.append(heading,overall);container.appendChild(summary);

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

import {renderAbility} from './ability-view.js';

// Read existing models/board text without rebuilding decisions or touching game state.
export function initializeDesktopOverview({documentRef,onOpenPlayer,onOpenCareer}){
  const win=documentRef.defaultView;
  if(!win?.matchMedia)return;
  const sidebar=documentRef.createElement('aside');
  sidebar.id='desktop-player';sidebar.className='desktop-overview';sidebar.hidden=true;
  sidebar.setAttribute('aria-label','選手概要');
  const identity=documentRef.createElement('section'),ability=documentRef.createElement('div'),contract=documentRef.createElement('section');
  identity.className='ui-panel';contract.id='desktop-career';
  const contractBody=documentRef.createElement('div'),salarySlot=documentRef.createElement('div');salarySlot.className='ui-panel';contract.append(contractBody,salarySlot);
  sidebar.append(identity,ability,contract);
  documentRef.getElementById('game-body').prepend(sidebar);
  const media=win.matchMedia('(min-width: 1100px) and (min-height: 700px)');
  const board=documentRef.getElementById('board');
  let pending=false,last='';
  const render=()=>{
    pending=false;
    const visible=media.matches&&board.style.display!=='none';sidebar.hidden=!visible;
    const salary=documentRef.getElementById('salary-detail-trigger'),grid=documentRef.getElementById('bd-grid'),target=visible?salarySlot:grid;
    if(salary.parentElement!==target){if(visible)target.append(salary);else grid.insertBefore(salary,documentRef.getElementById('bd-risk').parentElement);}
    if(!visible)return;
    const player=onOpenPlayer(),career=onOpenCareer();
    const boardName=documentRef.getElementById('bd-name'),name=boardName.firstChild?.textContent||'',position=boardName.querySelector('small')?.textContent||player.ability.positionLabel,team=documentRef.getElementById('bd-team').textContent;
    const signature=JSON.stringify([player,career.contract,name,position,team]);if(signature===last)return;last=signature;
    identity.replaceChildren();
    const heading=documentRef.createElement('h2'),positionLine=documentRef.createElement('p'),teamLine=documentRef.createElement('p'),overall=documentRef.createElement('p');
    heading.textContent=name;positionLine.textContent=position;teamLine.textContent=team;overall.textContent=`総合 ${documentRef.getElementById('bd-ovr').textContent}`;identity.append(heading,positionLine,teamLine,overall);
    const guideOpen=ability.querySelector('details')?.open===true;
    renderAbility(ability,player.ability);
    const guide=ability.querySelectorAll('.ui-ability-guide')[1];
    const details=documentRef.createElement('details'),summary=documentRef.createElement('summary');
    summary.textContent='潜在能力について';details.open=guideOpen;guide.before(details);details.append(summary,guide);
    contractBody.replaceChildren();contractBody.className='ui-panel';
    const title=documentRef.createElement('h2'),list=documentRef.createElement('dl');
    title.textContent='所属・契約';list.className='ui-data-list';
    for(const [label,value] of [['所属',team],['契約',career.contract.description],['残り期間',career.contract.remainingYears]]){
      const dt=documentRef.createElement('dt'),dd=documentRef.createElement('dd');dt.textContent=label;dd.textContent=value;list.append(dt,dd);
    }
    const hint=documentRef.createElement('p');hint.className='ui-ability-guide';hint.textContent='収入の詳細：キャリア → 契約・収入';
    contractBody.append(title,list,hint);
  };
  const schedule=()=>{if(pending)return;pending=true;win.requestAnimationFrame(render);};
  const observer=new win.MutationObserver(schedule);
  for(const id of ['board','act','log'])observer.observe(documentRef.getElementById(id),{childList:true,subtree:true,characterData:true,attributes:id==='board'});
  media.addEventListener('change',schedule);schedule();
}

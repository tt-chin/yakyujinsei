import {renderAbility,renderTraits} from './ability-view.js';
import {renderRecord} from './record-view.js';
import {renderCareer} from './player-detail.js';
// Reuse read-only view models. No navigation callback, game mutation or RNG.
export function initializeDesktopOverview({documentRef,onOpenPlayer,onOpenCareer}){
  if(!documentRef.defaultView?.matchMedia)return;
  const left=documentRef.createElement('aside'),right=documentRef.createElement('aside');
  left.id='desktop-player';right.id='desktop-career';left.className=right.className='desktop-overview';
  left.setAttribute('aria-label','選手概要');right.setAttribute('aria-label','成績・契約概要');
  documentRef.getElementById('app').append(left,right);
  const ability=documentRef.createElement('div'),traits=documentRef.createElement('div'),stats=documentRef.createElement('div'),contract=documentRef.createElement('div');
  left.append(ability,traits);right.append(stats,contract);
  const media=documentRef.defaultView.matchMedia('(min-width: 1180px)');
  const board=documentRef.getElementById('board');
  let pending=false,last='';
  const render=()=>{
    pending=false;const visible=media.matches&&board.style.display!=='none';left.hidden=right.hidden=!visible;if(!visible)return;
    const player=onOpenPlayer(),career=onOpenCareer(),signature=JSON.stringify([player,career]);
    if(signature===last)return;last=signature;
    renderAbility(ability,player.ability);renderTraits(traits,player.traits);renderRecord(stats,career.stats);renderCareer(contract,career,'contract');
  };
  const schedule=()=>{if(pending)return;pending=true;documentRef.defaultView.requestAnimationFrame(render);};
  const observer=new MutationObserver(schedule);
  for(const id of ['board','act','log'])observer.observe(documentRef.getElementById(id),{childList:true,subtree:true,characterData:true,attributes:id==='board'});
  media.addEventListener('change',schedule);schedule();
}

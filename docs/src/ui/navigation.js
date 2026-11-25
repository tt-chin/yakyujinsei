import { renderRecord } from './record-view.js';
import { initializeDesktopOverview } from './desktop-overview.js';
import { renderCareer } from './player-detail.js';
import { renderAbility, renderTraits } from './ability-view.js';

const uiState={activeMainView:'home',activePlayerTab:'ability',activeCareerTab:'stats'};
let controller=null;

export function initNavigation({documentRef=document,onOpenPlayer,onOpenCareer,onNavigate=()=>{}}){
  initializeDesktopOverview({documentRef,onOpenPlayer,onOpenCareer});
  const nav=documentRef.getElementById('main-nav'), board=documentRef.getElementById('board'), panels=[...documentRef.querySelectorAll('[data-main-panel]')], mainButtons=[...nav.querySelectorAll('[data-main-view]')], playerTabs=[...documentRef.querySelectorAll('[data-player-tab]')], careerTabs=[...documentRef.querySelectorAll('[data-career-tab]')];
  const syncBoardHeight=()=>{const height=board.getBoundingClientRect().height;nav.style.setProperty('--board-height',height+'px');documentRef.documentElement.style.setProperty('--game-header-height',(height+nav.getBoundingClientRect().height)+'px');};
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(syncBoardHeight);observer.observe(board,{box:'border-box'});observer.observe(nav,{box:'border-box'});}
  const syncTabs=(buttons,tab,panelId,key)=>{
    buttons.forEach(button=>{const active=button.dataset[key]===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    documentRef.getElementById(panelId).setAttribute('aria-labelledby',buttons.find(button=>button.dataset[key]===tab).id);
  };
  const selectPlayer=tab=>{uiState.activePlayerTab=tab;syncTabs(playerTabs,tab,'player-content','playerTab');const model=onOpenPlayer(),target=documentRef.getElementById('player-content');if(tab==='ability')renderAbility(target,model.ability);else if(tab==='traits')renderTraits(target,model.traits);else renderCareer(target,onOpenCareer(),tab);};
  const selectCareer=tab=>{uiState.activeCareerTab=tab;syncTabs(careerTabs,tab,'career-content','careerTab');renderCareer(documentRef.getElementById('career-content'),onOpenCareer(),tab);};
  const notify=(stage,view,previous)=>documentRef.dispatchEvent(new documentRef.defaultView.CustomEvent('yakyujinsei:mainview',{detail:{stage,view,previous}}));
  const selectMain=view=>{onNavigate();const previous=uiState.activeMainView;notify('before',view,previous);uiState.activeMainView=view;panels.forEach(panel=>{panel.hidden=panel.dataset.mainPanel!==view;});mainButtons.forEach(button=>{if(button.dataset.mainView===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});if(view==='player')selectPlayer(uiState.activePlayerTab);if(view==='career')selectCareer(uiState.activeCareerTab);notify('after',view,previous);};
  mainButtons.forEach(button=>button.addEventListener('click',()=>selectMain(button.dataset.mainView)));
  playerTabs.forEach(button=>button.addEventListener('click',()=>selectPlayer(button.dataset.playerTab)));
  careerTabs.forEach(button=>button.addEventListener('click',()=>selectCareer(button.dataset.careerTab)));
  for(const [buttons,panelId,key,select] of [[playerTabs,'player-content','playerTab',selectPlayer],[careerTabs,'career-content','careerTab',selectCareer]]){
    buttons.forEach((button,index)=>{
      button.id=`${panelId}-tab-${button.dataset[key]}`;button.setAttribute('aria-controls',panelId);button.tabIndex=index===0?0:-1;
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
        select(buttons[next].dataset[key]);buttons[next].focus();
      });
    });
    documentRef.getElementById(panelId).setAttribute('aria-labelledby',buttons[0].id);
  }
  controller={show(){syncBoardHeight();nav.style.display='grid';selectMain('home');},reset(){uiState.activeMainView='home';uiState.activePlayerTab='ability';uiState.activeCareerTab='stats';selectMain('home');},selectMain,state:uiState};
  return controller;
}

export function navigationController(){return controller;}

import { renderRecord } from './record-view.js';
import { renderPlayerDetail } from './player-detail.js';

const uiState={activeMainView:'home',activeDetailTab:'achievements',actionPending:false};
let controller=null;

export function initNavigation({documentRef=document,onOpenRecord,onOpenPlayer,onOpenSalaryDetail}){
  const nav=documentRef.getElementById('main-nav'), board=documentRef.getElementById('board'), panels=[...documentRef.querySelectorAll('[data-main-panel]')], mainButtons=[...nav.querySelectorAll('[data-main-view]')], tabs=[...documentRef.querySelectorAll('[data-detail-tab]')], detail=documentRef.getElementById('detail-content'), pending=nav.querySelector('.nav-pending');
  const syncBoardHeight=()=>nav.style.setProperty('--board-height',`${board.getBoundingClientRect().height}px`);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(syncBoardHeight).observe(board);
  const setPending=value=>{uiState.actionPending=Boolean(value);pending.hidden=!uiState.actionPending;};
  const selectDetail=tab=>{uiState.activeDetailTab=tab;tabs.forEach(button=>button.setAttribute('aria-selected',String(button.dataset.detailTab===tab)));renderPlayerDetail(detail,onOpenPlayer(tab),tab,{onOpenSalaryDetail});};
  const selectMain=view=>{uiState.activeMainView=view;panels.forEach(panel=>{panel.hidden=panel.dataset.mainPanel!==view;});mainButtons.forEach(button=>{if(button.dataset.mainView===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});if(view==='record')renderRecord(documentRef.getElementById('record-summary'),onOpenRecord());if(view==='player')selectDetail(uiState.activeDetailTab);};
  mainButtons.forEach(button=>button.addEventListener('click',()=>selectMain(button.dataset.mainView)));
  tabs.forEach(button=>button.addEventListener('click',()=>selectDetail(button.dataset.detailTab)));
  controller={show(){syncBoardHeight();nav.style.display='grid';selectMain('home');},reset(){uiState.activeMainView='home';uiState.activeDetailTab='achievements';setPending(false);selectMain('home');},showAction(){setPending(true);selectMain('action');},clearAction(){setPending(false);},selectMain,state:uiState};
  return controller;
}

export function navigationController(){return controller;}

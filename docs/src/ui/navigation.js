import { renderRecord } from './record-view.js';
import { renderCareer } from './player-detail.js';
import { renderAbility, renderTraits } from './ability-view.js';

const uiState={activeMainView:'home',activePlayerTab:'ability',activeCareerTab:'stats'};
let controller=null;

export function initNavigation({documentRef=document,onOpenPlayer,onOpenCareer}){
  const nav=documentRef.getElementById('main-nav'), board=documentRef.getElementById('board'), panels=[...documentRef.querySelectorAll('[data-main-panel]')], mainButtons=[...nav.querySelectorAll('[data-main-view]')], playerTabs=[...documentRef.querySelectorAll('[data-player-tab]')], careerTabs=[...documentRef.querySelectorAll('[data-career-tab]')];
  const syncBoardHeight=()=>nav.style.setProperty('--board-height',`${board.getBoundingClientRect().height}px`);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(syncBoardHeight).observe(board);
  const selectPlayer=tab=>{uiState.activePlayerTab=tab;playerTabs.forEach(button=>button.setAttribute('aria-selected',String(button.dataset.playerTab===tab)));const model=onOpenPlayer();if(tab==='ability')renderAbility(documentRef.getElementById('player-content'),model.ability);else renderTraits(documentRef.getElementById('player-content'),model.traits);};
  const selectCareer=tab=>{uiState.activeCareerTab=tab;careerTabs.forEach(button=>button.setAttribute('aria-selected',String(button.dataset.careerTab===tab)));renderCareer(documentRef.getElementById('career-content'),onOpenCareer(),tab);};
  const selectMain=view=>{uiState.activeMainView=view;panels.forEach(panel=>{panel.hidden=panel.dataset.mainPanel!==view;});mainButtons.forEach(button=>{if(button.dataset.mainView===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});if(view==='player')selectPlayer(uiState.activePlayerTab);if(view==='career')selectCareer(uiState.activeCareerTab);};
  mainButtons.forEach(button=>button.addEventListener('click',()=>selectMain(button.dataset.mainView)));
  playerTabs.forEach(button=>button.addEventListener('click',()=>selectPlayer(button.dataset.playerTab)));
  careerTabs.forEach(button=>button.addEventListener('click',()=>selectCareer(button.dataset.careerTab)));
  controller={show(){syncBoardHeight();nav.style.display='grid';selectMain('home');},reset(){uiState.activeMainView='home';uiState.activePlayerTab='ability';uiState.activeCareerTab='stats';selectMain('home');},selectMain,state:uiState};
  return controller;
}

export function navigationController(){return controller;}

// Jersey number flow (OOP plan §2uu, phase 43).
// The method bodies are the former game.js jerseyStep/jerseyTeamName/jerseyUnknownTeam/promptJerseyEntry/jerseyLabelText and
// the #board-number click handler. nextStep/board/choose are late-binding deps, so E2E rebinding in game.js still reaches
// them; promptEntry and teamName are internal calls. Deferred dialog callbacks compare getState() live, not a captured S.
import { jerseyEntryPending, proposedJerseyNumber, isLegacyJerseyEntry, appendJerseyRecord, currentJerseyNumber, canChangeJersey, jerseyChangeYear } from './jersey-policy.js';

export class JerseyFlow {
  #getState;#deps;
  constructor({getState,...deps}){this.#getState=getState;this.#deps=deps;}
  // PLY-01 W8: one year-start step before phasePre; it runs after the year-start save and draws no RNG.
  step(){const S=this.#getState(),{nextStep}=this.#deps;if(!jerseyEntryPending(S))return nextStep();this.promptEntry();}
  teamName(teamId){const {teamRec}=this.#deps;return teamRec(teamId)?.name||String(teamId);}
  // D4 periods before any record: the log team label without the trade prefix (A→B) or level suffix (teamDisplay).
  unknownTeam(tm){const {teamMaster}=this.#deps;const label=String(tm).split('→').pop();return Object.values(teamMaster()).map(t=>t.name).filter(name=>label===name||label.startsWith(name+' ')).sort((a,b)=>b.length-a.length)[0]||label;}
  // selected: the number picked in the dialog; accept re-renders the prompt with it and confirms through the guarded main button.
  promptEntry(selected=null,{accept:acceptNow=false,focus=false}={}){const {board,choose,nextStep,chooseNumber:chooseJerseyNumber,byId:$}=this.#deps;const state=this.#getState(),team=this.teamName(state.orgTeamId),number=selected??proposedJerseyNumber(state),legacy=isLegacyJerseyEntry(state);
    board(0);
    const accept=picked=>{appendJerseyRecord(state,picked);nextStep();};
    choose(legacy?`${team}での背番号が記録されていません。背番号はどうする？`:`${team}と契約しました。背番号はどうする？`,[
      {t:legacy?`背番号 ${number} にする`:`背番号 ${number} で入団する`,main:true,f:()=>accept(number)},
      {t:'背番号を選ぶ',f:()=>{chooseJerseyNumber({title:'背番号を選ぶ',summary:`${team}`,fieldLabel:'背番号',note:`${state.year}年シーズンから有効。過去の年度の背番号は変わりません。能力・成績・年俸には影響しません。`,selected:number,confirmLabel:'この背番号にする'}).then(picked=>{if(this.#getState()!==state||!jerseyEntryPending(state))return;if(picked===null)this.promptEntry(null,{focus:true});else this.promptEntry(picked,{accept:true});});}}]);
    const first=$('act').querySelector('button');if(acceptNow)first?.click();else if(focus)first?.focus({preventScroll:true});}
  label(){const number=currentJerseyNumber(this.#getState());return number===null?'':` · #${number}`;}
  openChange(){const {chooseNumber:chooseJerseyNumber,setBoardNumber,byId:$}=this.#deps;const state=this.#getState();if(!canChangeJersey(state))return;const current=currentJerseyNumber(state),year=jerseyChangeYear(state);
    chooseJerseyNumber({title:'背番号の変更',summary:`${this.teamName(state.orgTeamId)}　現在の背番号 #${current}`,note:`${year}年シーズンから有効。過去の年度の背番号は変わりません。能力・成績・年俸には影響しません。`,selected:current,confirmLabel:'変更する'})
      .then(picked=>{if(picked===null||this.#getState()!==state||!canChangeJersey(state)||jerseyChangeYear(state)!==year||picked===currentJerseyNumber(state))return;appendJerseyRecord(state,picked,year);setBoardNumber(`#${picked}`);$('board-number').disabled=!canChangeJersey(state);});}
}

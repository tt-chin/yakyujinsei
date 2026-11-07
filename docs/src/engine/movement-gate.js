// Season-end movement entry (OOP plan §2ll): the service-time accrual and FA eligibility before LEGACY.movement
// (the CareerMovement wrapper), and the professional same-year continuation guard around it. The career state is
// read at the start of each method through getState. LEGACY and amateurCareer are the game.js objects, passed by
// reference; LEGACY.movement is the binding captured before this wrapper, so E2E traces that wrap it still see it.
// Every other game.js function is an injected late-binding lambda. No draw site.
export class MovementGate {
  #deps;
  #professionalMoves=new WeakMap();
  constructor(deps){this.#deps=deps;}
  #performMovement(){const S=this.#deps.getState(),{LEGACY,amateurCareer,migrateSalaryV130State,accrueForeignFirstTeamSeason,contractStageFor}=this.#deps;migrateSalaryV130State();if(amateurCareer.seasonEndMovement())return;accrueForeignFirstTeamSeason(S);if(S.serviceTimeAccruedYear!==S.year){if(S.org==='NPB'&&S.lv==='NPB1'&&S.seasonFactor>0){S.npbRosterDays+=Math.round(145*S.seasonFactor);while(S.npbRosterDays>=145){S.npbRosterDays-=145;S.npbFaSeasons++;}S.serviceTime.NPB=Math.max(S.serviceTime.NPB,S.npbFaSeasons);}else if(S.org==='MLB'&&S.lv==='MLB'&&S.seasonFactor>=.5)S.serviceTime.MLB++;else if((S.org==='KBO'&&S.lv==='KBO1'||S.org==='CPBL'&&S.lv==='CPBL1')&&S.seasonFactor>0)S.serviceTime[S.org]++;S.serviceTimeAccruedYear=S.year;}const stage=contractStageFor(S.org);if(S.org==='NPB')S.faElig=S.serviceTime.NPB>=8;else if(S.org==='MLB')S.faElig=stage!=='CONTROL';LEGACY.movement();}
  movement(){const S=this.#deps.getState(),professionalMoves=this.#professionalMoves,{restorePendingChoice}=this.#deps;
    if(S.stage!=='PRO')return this.#performMovement();
    let entry=professionalMoves.get(S);
    if(entry?.year===S.year){
      if(entry.phase==='WAIT_CHOICE'){if(!restorePendingChoice())throw new Error('MOVEMENT_CONTINUATION_AMBIGUOUS');return;}
      throw new Error('MOVEMENT_CONTINUATION_AMBIGUOUS');
    }
    entry={state:S,year:S.year,phase:'STARTED'};professionalMoves.set(S,entry);
    this.#performMovement();entry.phase='WAIT_CHOICE';
  }
}

import {TRAIT_LABELS,traitLabel,recordFirstTeamSeason,goldclothEligible} from './trait-policy.js';

// Hidden-trait unlock and removal, trait display labels and the goldcloth season check (OOP plan §2rr).
// The career state is read on every call through getState. traitPresentation is the game.js WeakMap, passed by reference.
// card/board/teamNick and the game.js traitCard/displayTrait wrappers are late-binding lambdas, so the internal
// goldcloth unlock and the label lookups still go through the game.js names that E2E hooks call. Method bodies are the
// former game.js traitCard/removeTrait/displayTrait/traitNames/checkGoldclothSeason bodies. No RNG.
export class CareerTraits {
  #rules;
  constructor(deps){this.#rules=traitRules(deps);}
  unlock(key,name,desc,tone){this.#rules.unlock(key,name,desc,tone);}
  remove(key,label){this.#rules.remove(key,label);}
  label(key){return this.#rules.label(key);}
  names(){return this.#rules.names();}
  checkGoldclothSeason(){this.#rules.checkGoldclothSeason();}
}

function traitRules({getState,traitPresentation,card,board,teamNick,traitCard,displayTrait}){
  function unlock(key,name,desc,tone){ const S=getState(); S.traits[key]=true;
    card(tone||'gold','隠し特性解放：'+name,desc); board(0); }
  function remove(key,label){ const S=getState(); if(S.traits[key]){ S.traits[key]=false;
      traitPresentation.get(S)?.delete(key);
      if(!S.removed.includes(label))S.removed.push(label); } }
  function label(key){const S=getState();return traitLabel(key,S,teamNick);}
  function names(){return Object.fromEntries(Object.keys(TRAIT_LABELS).map(key=>[key,displayTrait(key)]));}
  function checkGoldclothSeason(){
    const S=getState();
    recordFirstTeamSeason(S);
    if(goldclothEligible(S))traitCard('goldcloth',displayTrait('goldcloth'),'阪神ストライプス一軍で通算10年。虎党の声援を背に、甲子園で戦い続けてきた。その縦縞は、もはやお前の誇りだ。');
  }
  return {unlock,remove,label,names,checkGoldclothSeason};
}

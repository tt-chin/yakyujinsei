// Read-only player queries (OOP plan §2uu, phase 43).
// The method bodies are the former game.js careerAllStars/toolGap/pitcherRole/isSP/ovr/playerType/abCost. game.js keeps the
// same-name one-line wrappers, so injected lambdas, E2E rebinding (playerType) and the frozen 2.0.0 modules are unchanged.
import { toolGapFor, overallRatingFor, playerTypeFor, abilityStepCostFor } from './ability-evaluation-policy.js';

export class PlayerProfile {
  #getState;
  constructor({getState}){this.#getState=getState;}
  /* 一芸特化：評価対象は三つの役割軸のみ——打撃(長打力/Contact)、走塁(速度)、守備(総合)。 */
  allStars(){const S=this.#getState(); let n=0; ['CPBL','KBO','NPB','MLB'].forEach(b=>{ if(S.stats[b])n+=(S.stats[b].AS||0); }); return n; }
  toolGap(){const S=this.#getState();return toolGapFor(S.ab,S.pos);}
  pitcherRole(){const S=this.#getState(); /* スタミナ >=52 先発;それ以外はブルペン、ブルペン内では成績ならクローザーへ昇格。 */
    if(S.ab.sta>=52)return 'SP';
    /* ブルペン：前季のdはprevDから参照する。lastDはphasePreで初期化済み;トップ級なら クローザー。 */
    const pd=(S.prevD!==undefined?S.prevD:(S.lastD||0));
    const d=(S.role&&S.role!=='SP')?pd:-99;
    if(S.role==='CL')return d>=1?'CL':'MR';   /* クローザー成績急落時のみセットアッパー。 */
    return d>=3?'CL':'MR';                     /* セットアッパーがトップ階級の成績ならクローザーへ昇格。 */
  }
  isStarter(){const S=this.#getState(); return S.role==='SP'; } /* 先発引擎判定。 */
  overall(){const S=this.#getState();return overallRatingFor({ability:S.ab,position:S.pos,defensePosition:S.dpos,traits:S.traits});}
  type(){const S=this.#getState();return playerTypeFor({ability:S.ab,position:S.pos,traits:S.traits,toolRole:S.toolRole});}
  stepCost(k){const S=this.#getState();return abilityStepCostFor({ability:S.ab,potential:S.pot,key:k,position:S.pos});}
}

// Defense position rule tables and queries (OOP plan §2tt, phase 42).
// The tables and their comments are the former game.js DP_TH/DP_BAR/DP_MULT/DP_RANK; the query bodies are the former
// game.js dpScore/dpBar/dpQual/dpList/dpMult wrappers. The career state is read through getState; tables defaults to the
// module tables. qualified and candidates call this.score / this.qualified, so the score→qual→list order stays observable.
import { defenseScoreFor, defenseBarFor, defensePositionQualified, defensePositionCandidates, defensePositionMultiplier } from './defense-position-policy.js';
/* 守備位置ごとに守備範囲・捕球・肩力の基準をリーグ基準から補正する。三塁に遊撃並みの守備範囲は求めず、一塁では肩力をほぼ評価しない。 */
/* 守備位置・リーグ別の守備基準。守備評価が基準以上なら守備可能とし、MLBを最も厳しくする。 */
export const DP_TH={
  C:  {CPBL1:46, NPB1:54, MLB:60},
  SS: {CPBL1:50, NPB1:58, MLB:64},
  CF: {CPBL1:49, NPB1:57, MLB:63},
  '2B':{CPBL1:46,NPB1:53, MLB:59},
  '3B':{CPBL1:44,NPB1:51, MLB:57},
  RF: {CPBL1:43, NPB1:50, MLB:56},
  LF: {CPBL1:41, NPB1:47, MLB:53},
  '1B':{CPBL1:36,NPB1:42, MLB:48}};
export const DP_BAR={CPBL1:45,NPB1:54,MLB:60}; /* 保持与える捕手 cOk 等旧判定。 */
export const DP_MULT={SS:1.15,CF:1.15,C:1.12,'2B':1.05,'3B':1.05,RF:1.05,'1B':1.0,LF:1.0,DH:0.92};
export const DP_RANK={SS:0,CF:0,'2B':1,'3B':2,RF:2,'1B':3,LF:3,DH:4,C:0}; /* 守備位置市試合価値の序列(SS>2B>3B)。 */

export class DefensePosition {
  #getState;#tables;
  constructor({getState,tables={DP_TH,DP_BAR,DP_MULT}}){this.#getState=getState;this.#tables=tables;}
  /* 守備位置ごとに重視する能力を変え、総合守備評価を返す。 */
  score(p){return defenseScoreFor(this.#getState().ab,p);}
  bar(){const S=this.#getState();return defenseBarFor({bars:this.#tables.DP_BAR,level:S.lv,age:S.age});}
  qualified(p){const S=this.#getState();return defensePositionQualified({position:p,thresholds:this.#tables.DP_TH,level:S.lv,age:S.age,favorite:S.traits.favorite,scoreOf:q=>this.score(q)});}
  candidates(){return defensePositionCandidates(this.#getState().pos,p=>this.qualified(p));}
  multiplier(){const S=this.#getState();return defensePositionMultiplier({position:S.pos,defensePosition:S.dpos,multipliers:this.#tables.DP_MULT});}
}

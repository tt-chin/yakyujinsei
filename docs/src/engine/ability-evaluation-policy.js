// Overall rating, player type, one-tool gap and ability step cost (OOP plan §2l, phase 10).
// Pure rules: callers pass ability, position, defense position, traits, tool role and potential explicitly; no DOM, S or RNG.
import { defenseScoreFor } from './defense-position-policy.js';

export function toolGapFor(ability,position){ const a=ability;
  const hit=Math.max(a.pow,a.con);        /* 打撃維度：長打力または Contact 取高。 */
  const run=a.spd;                         /* 走塁維度。 */
  const def=position==='C'?(a.rng+a.fld+a.arm+a.cat)/4:(a.rng+a.fld+a.arm)/3; /* 守備総合。 */
  const dims=[['hit',hit,'代打'],['run',run,'代走'],['def',def,'守備固め']];
  dims.sort((x,y)=>y[1]-x[1]);
  const topDim=dims[0], secDim=dims[1];
  const gap=topDim[1]-secDim[1];
  /* 比より対象の役割：代打確認長打力/Contact 高い方を説明文に採用。 */
  const role=topDim[2];
  return {gap, role, val:topDim[1], dim:topDim[0]}; }
export function overallRatingFor({ability,position,defensePosition,traits}){
  const a=ability;
  if(position==='P'){ const arr=[a.vel,a.ctl,a.brk].sort((x,y)=>y-x);
    return Math.round(arr[0]*0.42+arr[1]*0.30+arr[2]*0.18+a.sta*0.10); }
  const off=[a.con,a.pow,a.eye,a.spd].sort((x,y)=>y-x);
  const offv=off[0]*0.38+off[1]*0.27+off[2]*0.20+off[3]*0.15;
  /* 守備評価：現在の守備位置のdpScore(と守備位置基準システムと一致);DH 守備価値なし → 「1B 守備評価 −12」として計算(これにより同じ打撃力なら一塁手がDHを常に上回る)。守備位置が未設定なら守れる中で最上位の守備位置の評価を使う。 */
  const dpForOvr = defensePosition || (position==='C'?'C':(position==='OF'?'CF':'SS'));
  const def = defensePosition==='DH' ? (defenseScoreFor(a,'1B')-12) : defenseScoreFor(a,dpForOvr);
  /* 守備重み：重要守備位置(SS/CF/C)最大 30%、コーナーは低め;DH 用と 1B 同じ重み(守備評価に含まれる DH ペナルティ)。 */
  const dw=defensePosition?({SS:0.30,CF:0.30,C:0.30,'2B':0.22,'3B':0.22,RF:0.20,'1B':0.12,LF:0.14,DH:0.12})[defensePosition]??0.22:0.24;
  let v=Math.round(offv*(1-dw)+def*dw);
  if(traits.yips)v-=3; /* イップス：心理的影響、システム評価 -3。 */
  return v;
}
export function playerTypeFor({ability,position,traits,toolRole}){
  const a=ability;
  if(traits.onetool&&toolRole)return toolRole+'ユーティリティー';
  if(position==='P'){
    const m=Math.max(a.vel,a.ctl,a.brk);
    if(m<52)return '期待の若手';
    if(a.sta>=m&&a.sta>=62)return '鉄腕';
    if(m===a.vel)return '剛腕'; if(m===a.brk)return '変化球の魔術師'; return '精密機械';
  }
  if(position==='C'){ const rest=Math.max(a.con,a.pow,a.spd,a.eye,a.rng,a.fld,a.arm);
    if(a.cat>=58&&rest<=a.cat-8)return 'リードの達人'; }
  const dv=position==='C'?(a.rng+a.fld+a.cat)/3:(a.rng+a.fld+a.arm)/3;
  const cand=[['大砲タイプ',a.pow],['安打製造機',a.con],['選球眼の鬼',a.eye],['韋駄天',a.spd],['守備職人',dv]];
  cand.sort((x,y)=>y[1]-x[1]);
  if(cand[0][1]<52)return '期待の若手';
  if(cand[0][1]-cand[1][1]<=3&&cand[0][1]>=60)return 'オールラウンダー';
  return cand[0][0];
}
export function abilityStepCostFor({ability,potential,key,position}){ /* 次の能力段階に必要なポイント(は game.js の addAb コスト式と一致させる)。 */
  const cur=ability[key], pk=(potential&&potential[key])||62, isP=position==='P';
  let c=isP?(cur>=66?7:cur>=60?4:cur>=55?2:1):(cur>=72?3:cur>=64?2:1);
  if(cur>=pk)c*=isP?4:3; return c;
}

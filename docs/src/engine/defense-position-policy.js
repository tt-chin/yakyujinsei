// Defense position score, bar, qualification, candidates and salary multiplier (OOP plan §2k, phase 9).
// Pure rules: callers pass ability, level, age and the DP_TH/DP_BAR/DP_MULT tables explicitly; no DOM, S or RNG.
export function defenseScoreFor(ability,position){ const a=ability;
  switch(position){
    case 'SS': return a.rng*0.5 + a.fld*0.3 + a.arm*0.2;   /* 遊撃手：守備範囲を重視。 */
    case '2B': return a.rng*0.45+ a.fld*0.4 + a.arm*0.15;  /* 二塁手：守備範囲と捕球を重視し、肩力は補助。 */
    case '3B': return a.arm*0.45+ a.fld*0.35+ a.rng*0.2;   /* 三塁手：肩力を重視。 */
    case 'CF': return a.rng*0.55+ a.fld*0.3 + a.arm*0.15;  /* 中堅手：守備範囲を重視。 */
    case 'RF': return a.arm*0.45+ a.rng*0.35+ a.fld*0.2;   /* 右翼手：強肩を重視。 */
    case 'LF': return a.rng*0.4 + a.fld*0.35+ a.arm*0.25;  /* 左翼手：守備範囲を中心に、基準は低め。 */
    case 'C':  return a.fld*0.4 + a.cat*0.4 + a.arm*0.2;   /* 捕手：捕球・リード・肩力を重視し、守備範囲は評価しない。 */
    case '1B': return a.fld*0.6 + a.rng*0.2 + a.arm*0.2;   /* 一塁手：捕球を重視し、基準は低め。 */
    default: return 99;
  }
}
export function defenseBarFor({bars,level,age}){ /* 年輕球員吃能力上限紅利、球団不急著拔守備位置。 */
  const base=bars[level]||0;
  const disc=age<=21?7:age<=24?5:age<=26?2:0;
  return base-disc;
}
export function defensePositionQualified({position,thresholds,level,age,favorite,scoreOf}){
  if(position==='DH')return true;
  if(!thresholds[position]||!thresholds[position][level])return true;   /* トップ階級以外のリーグでは制限しない。 */
  /* 年輕球員吃能力上限紅利：基準略降(球団与える時間成長)。 */
  const youthAdj = (age<24?-3 : age<26?-1.5 : 0)+(favorite?-3:0);
  return scoreOf(position) >= thresholds[position][level]+youthAdj;
}
export function defensePositionCandidates(position,qualified){ /* 守備難易度順に、内野手は内野、外野手は外野を走査し、守れる中で最上位の位置を選ぶ。 */
  /* 候補守備位置は現在の守備群に合わせ、内野・外野それぞれの守備スペクトラムから選ぶ。 */
  const order = position==='IF'
    ? ['SS','2B','3B','1B']       /* 内野：遊撃＞二塁＞三塁＞一塁。 */
    : ['CF','RF','LF','1B'];      /* 外野：中堅＞右翼＞左翼＞一塁。 */
  const q=order.filter(qualified); q.push('DH'); return q;
}
export function defensePositionMultiplier({position,defensePosition,multipliers}){ return (position!=='P'&&defensePosition)?(multipliers[defensePosition]||1):1; }

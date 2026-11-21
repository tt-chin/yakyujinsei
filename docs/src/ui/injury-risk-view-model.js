// INJ-UI-01: the コンディション row for the mid-season health check injury risk (total + ordered breakdown).
// Text only; the steps come from injury-risk-policy.js, the same function player-injury.js judges with.
import { injuryRiskStatus } from '../engine/injury-risk-policy.js';

const LABEL='健康診断時の故障リスク';
const pct=value=>`${value}%`;
const signed=value=>value>0?`+${value}%`:value<0?`−${-value}%`:'±0%';
const TRAIT_LABEL={IRON:'鉄人（上限10%）',GLASS:'スペランカー（下限40%）',IRON_GLASS:'鉄人＋スペランカー（25%固定）'};
function rows(breakdown){
  const out=[];
  for(const step of breakdown.steps){
    if(step.kind==='BASE')out.push({label:'基礎',value:pct(step.value)});
    else if(step.kind==='CARRY'&&step.delta!==0)out.push({label:'国際大会出場による加算',value:signed(step.delta)});
    else if(step.kind==='AGE')out.push({label:`年齢（${step.minAge}歳以上）`,value:signed(step.delta)});
    else if(step.kind==='ACADEMY')out.push({label:'理論派（25歳未満）',value:signed(step.delta)});
    else if(step.kind==='PRE_TRAIT')out.push({label:'特性適用前',value:pct(step.value)});
    else if(step.kind==='TRAIT')out.push({label:TRAIT_LABEL[step.rule],value:pct(step.value)});
    else if(step.kind==='TMP')out.push({label:'今季の一時加算',value:step.reset?'±0%（シーズン開始時にリセット）':signed(step.delta)});
    else if(step.kind==='CLAMP'&&step.clamped)out.push({label:'上下限（3～95%）',value:pct(step.value)});
  }
  out.push({label:'結果',value:pct(breakdown.total)});
  return Object.freeze(out.map(row=>Object.freeze(row)));
}
export function injuryRiskCondition(state){
  const status=injuryRiskStatus(state);
  if(status.kind==='NO_CHECK')return {label:LABEL,value:'今季は健康診断なし（リハビリ中）'};
  const checked=status.kind==='CHECKED';
  return {label:LABEL,value:checked?`判定済み（${pct(status.breakdown.total)}）`:pct(status.breakdown.total),
    breakdown:Object.freeze({summary:'故障リスクの内訳',rows:rows(status.breakdown),
      note:'シーズン中盤の健康診断1回の判定確率です。シーズン全体の故障やトミー・ジョン手術の確率ではありません。'+(checked?'今季の判定は終了しました。内訳は判定時の値です。':'今後のイベントで変わることがあります。')})};
}

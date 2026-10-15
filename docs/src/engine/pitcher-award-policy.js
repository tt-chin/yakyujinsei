// D2 approved numeric producer. Pure inputs/outputs; no state, randomness, or effects.
const clamp=x=>Math.max(0,Math.min(1,x));
const finiteNonnegative=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
const count=x=>Number.isSafeInteger(x)&&x>=0;
export const PITCHER_AWARD_RULES=Object.freeze({PITCH_WINS:'p01-b-v1',
  PITCH_WIN_PCT:'p04-b-npb12-v1',PITCH_SAWAMURA:'p08-ip180-s3-b2-g95-v1'});

export function sawamuraProbability(score){
  if(!finiteNonnegative(score)||score>100)throw new Error('INVALID_SAWAMURA_SCORE');
  return score<60?0:score>=95?100:Math.min(95,10+2.5*(score-60));
}
export function pitcherAwardCandidate(awardId,{league,level,role,pos,stats}={}){
  if(!Object.hasOwn(PITCHER_AWARD_RULES,awardId))throw new Error('UNKNOWN_PITCHER_AWARD');
  const result=(eligibility,pPercent,reason,extra={})=>Object.freeze({awardId,ruleId:PITCHER_AWARD_RULES[awardId],
    eligibility,pPercent,reasonCodes:Object.freeze([reason]),...extra});
  if(!['CPBL','KBO','NPB','MLB'].includes(league)||level!==(league==='MLB'?'MLB':league+'1')||pos!=='P'||!['SP','MR','CL'].includes(role))return result(false,0,'NOT_APPLICABLE');
  if(!stats||typeof stats!=='object'||!finiteNonnegative(stats.G)||!finiteNonnegative(stats.IP)||stats.G<=0||stats.IP<=0)return result(false,0,'INVALID_SEASON');
  const {W,L,IP,SO,G,era:ERA}=stats;
  if(awardId==='PITCH_WINS'){
    if(!count(W))return result(false,0,'INVALID_STAT');
    const [basic,guarantee]={CPBL:[10,15],KBO:[12,17],NPB:[12,17],MLB:[14,20]}[league];
    if(W<basic)return result(false,0,'BELOW_MINIMUM');
    return result(true,W>=guarantee?100:20+75*(W-basic)/(guarantee-basic),'ELIGIBLE');
  }
  if(awardId==='PITCH_WIN_PCT'){
    if(!['NPB','KBO'].includes(league))return result(false,0,'NOT_APPLICABLE');
    if(!count(W)||!count(L)||!Number.isSafeInteger(W+L)||W+L===0)return result(false,0,'INVALID_STAT');
    const wpct=W/(W+L);
    if(W<(league==='NPB'?12:10)||wpct<.650)return result(false,0,'BELOW_MINIMUM',{wpct});
    return result(true,wpct>=.850?100:20+300*(wpct-.650),'ELIGIBLE',{wpct});
  }
  if(league!=='NPB'||role!=='SP')return result(false,0,'NOT_APPLICABLE');
  if(![G,W,L,IP,SO,ERA].every(finiteNonnegative)||W+L<=0||!Number.isFinite(W+L))return result(false,0,'INVALID_STAT');
  if(W<13||IP<143||ERA>3.20)return result(false,0,'BELOW_MINIMUM');
  const wpct=W/(W+L),components=Object.freeze({W:100*clamp((W-12)/(17-12)),
    ERA:100*clamp((3.20-ERA)/(3.20-2.20)),IP:100*clamp((IP-143)/(180-143)),
    SO:100*clamp((SO-155)/(215-155)),WPCT:100*clamp((wpct-.650)/(.850-.650))});
  const score=.25*components.W+.30*components.ERA+.25*components.IP+.15*components.SO+.05*components.WPCT;
  return result(true,sawamuraProbability(score),'ELIGIBLE',{wpct,components,score});
}

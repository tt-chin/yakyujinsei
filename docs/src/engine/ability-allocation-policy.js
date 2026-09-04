export function abilityPointCost(current, potential, isPitcher) {
  let cost=isPitcher?(current>=66?7:current>=60?4:current>=55?2:1):(current>=72?3:current>=64?2:1);
  if(current>=potential)cost*=isPitcher?4:3;
  return cost;
}

export function pointsRequiredToReach80({current,potential,carry=0,isPitcher=false}) {
  let required=0;
  for(let value=current;value<80;value++)required+=abilityPointCost(value,potential,isPitcher);
  return Math.max(0,required-Math.max(0,Number(carry)||0));
}

export function actualAbilitySpend(requestedSpend,remainingPool,pointsRequired) {
  return Math.max(0,Math.min(Math.max(0,Number(requestedSpend)||0),Math.max(0,Number(remainingPool)||0),Math.max(0,Number(pointsRequired)||0)));
}

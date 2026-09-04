export function formatRehabStatus({rehab=0,skipMid=false,seasonFactor=1}){
  const isRehabSeason=skipMid===true&&seasonFactor===0;
  if(isRehabSeason)return rehab>0?`リハビリ中（今季全休・残り${rehab}年）`:'リハビリ中（今季全休）';
  return rehab>0?`残り${rehab}年`:'なし';
}

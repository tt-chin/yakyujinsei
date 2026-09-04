export function resolveStatBucket(levels,levelKey){
  const level=levelKey&&levels[levelKey];
  if(!level?.top)throw new Error(`UNKNOWN_STAT_BUCKET:${levelKey}`);
  return level.top;
}

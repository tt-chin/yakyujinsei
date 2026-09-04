export function resolveStatBucket(levels,levelKey){
  const level=levelKey&&levels[levelKey];
  if(!level?.statBucket)throw new Error(`UNKNOWN_STAT_BUCKET:${levelKey}`);
  return level.statBucket;
}

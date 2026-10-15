// AF01–03: pure independent award draw; never imports the engine or reads/writes S.
export const AWARD_KEY_DOMAIN = 'pitcher-award-v1';
export const AWARD_KEY_SCHEMA_VERSION = 1;
const rules = Object.freeze({PITCH_WINS:'p01-b-v1',PITCH_WIN_PCT:'p04-b-npb12-v1',
  PITCH_SAWAMURA:'p08-ip180-s3-b2-g95-v1'});
const encoder = new TextEncoder();
function invalid(reason) {
  return Object.assign(new Error('INVALID_AWARD_CONTEXT: '+reason), {code:'INVALID_AWARD_CONTEXT',reason});
}
function fields(identity, initializedSeed) {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) throw invalid('IDENTITY');
  const {domain=AWARD_KEY_DOMAIN,seed,year,league,awardId,ruleId}=identity;
  if (domain!==AWARD_KEY_DOMAIN) throw invalid('DOMAIN');
  if (typeof seed!=='string'||!seed.length||typeof initializedSeed!=='string'||seed!==initializedSeed) throw invalid('INITIALIZED_SEED');
  if (!Number.isSafeInteger(year)||year<1||year>9999) throw invalid('YEAR');
  if (!['CPBL','KBO','NPB','MLB'].includes(league)) throw invalid('LEAGUE');
  if (!Object.hasOwn(rules,awardId)||rules[awardId]!==ruleId) throw invalid('AWARD_RULE');
  return [domain,seed,String(year),league,awardId,ruleId];
}
export function canonicalAwardBytes(identity, initializedSeed) {
  const out=[];
  for (const value of fields(identity,initializedSeed)) {
    const bytes=encoder.encode(value),n=bytes.length;
    out.push((n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255,...bytes);
    if(out.length>1024)throw invalid('BYTE_LENGTH');
  }
  return Uint8Array.from(out);
}
export function awardHash32(bytes) {
  if (!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>1024) throw invalid('BYTES');
  let h=0x811c9dc5;
  for(const b of bytes)h=Math.imul(h^b,0x01000193)>>>0;
  h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;
  h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;
  h^=h>>>16;
  return h>>>0;
}
export function independentAwardDraw(identity, initializedSeed) {
  const bytes=canonicalAwardBytes(identity,initializedSeed),hash32=awardHash32(bytes);
  const drawKey=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return Object.freeze({keySchemaVersion:1,drawKey,hash32,u:hash32/4294967296});
}
export function awardProbabilityHit(u,pPercent) {
  if(!Number.isFinite(u)||u<0||u>=1||!Number.isFinite(pPercent)||pPercent<0||pPercent>100) throw invalid('PROBABILITY');
  return u*100<pPercent;
}
// A technology primitive, not an eligibility/probability producer for P01/P04/P08.
export function decideIndependentAward(identity,pPercent,initializedSeed) {
  const bytes=canonicalAwardBytes(identity,initializedSeed);
  if(!Number.isFinite(pPercent)||pPercent<0||pPercent>100)throw invalid('PROBABILITY');
  const drawKey=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  if(pPercent===0||pPercent===100)return Object.freeze({keySchemaVersion:1,drawKey,
    hash32:null,u:null,pPercent,awarded:pPercent===100,drawSource:'DETERMINISTIC_'+pPercent});
  const draw=independentAwardDraw(identity,initializedSeed);
  return Object.freeze({...draw,pPercent,awarded:awardProbabilityHit(draw.u,pPercent),drawSource:'INDEPENDENT_HASH'});
}

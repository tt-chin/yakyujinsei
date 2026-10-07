import { EVENT_CATALOG } from '../data/event-cards-jp.js';

export const EVENT_MODES = ['bold', 'norm', 'safe'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const int = (v, fallback = 0) => Number.isFinite(v) ? Math.trunc(v) : fallback;
export function eventEligible(card, s) {
  const e = card.eligibility;
  return ['P','C','IF','OF'].includes(s.pos) && e.stages.includes(s.stage) &&
    e.levels.includes(s.lv) && e.orgs.includes(s.org) &&
    (e.role === 'ALL' || e.role === s.pos || (e.role === 'F' && s.pos !== 'P')) &&
    Number.isFinite(s.age) && (e.maxAge === null || s.age <= e.maxAge);
}
export function eventOdds(t = {}) {
  const base = (t.genius || t.late || t.clutch ? 70 : 50) - (t.thief ? 10 : 0);
  return {safe:Math.min(95,base+20), norm:Math.min(95,base+(t.favorite?5:0)), bold:base-15+(t.clutch&&t.genius?5:0)};
}
export const eventTier = t => t.clutch ? (t.genius ? 2 : 1) : 0;
export const effectiveCategory = (card, stage) => card.category === 'encounter' && ['HS','U','CORP'].includes(stage) ? 'training' : card.category;
export function eventPlan(category, mode, tier, success) {
  if (!EVENT_MODES.includes(mode) || !['training','encounter','endorsement'].includes(category)) throw new Error('INVALID_EVENT_PLAN');
  const mag = mode === 'safe' ? 1 : mode === 'norm' ? 2 : 3;
  if (category === 'training') return {ability:success?(mode==='bold'&&tier===2?4:mag):-(mode==='bold'&&tier>0?2:mag),stat:0,cash:false};
  if (category === 'encounter') return {ability:0,stat:success?mag:-(mode==='bold'&&tier>0?2:mag),cash:false};
  return success ? {ability:mode==='safe'?0:1,stat:mode==='norm'?0:mode==='bold'&&tier===2?2:1,cash:true} :
    {ability:0,stat:-(mode==='bold'&&tier===0?2:1),cash:false};
}
export const eventInjury = (card,mode,success,t={}) => !success && card.injuryFailureModes.includes(mode) ? (mode==='bold'?(t.clutch?12:16):mode==='norm'?12:8) : 0;
export function eventIncome(level,mode,success,traits={}) {
  if (!success) return 0;
  const base = EVENT_CATALOG.incomePolicy.baseYenByLevel[level] || 0;
  return base > 0 ? Math.max(1,Math.round(base*({safe:.5,norm:1,bold:1.5}[mode])*(traits.adking?1.1:1)/10000))*10000 : 0;
}
export function eventAbilityCost(pos,key,cur,pot) {
  const base = pos==='P'&&key!=='sta' ? (cur<50?1:cur<58?2:cur<66?4:7) : (cur<64?1:cur<72?2:3);
  return base*(cur>=pot?(pos==='P'?4:3):1);
}
export function eventAddAbility({pos,key,cur,pot,carry=0,points}) {
  const before=clamp(int(cur,1),1,80), carryBefore=Math.max(0,int(carry));
  let after=before, budget=carryBefore, overflowStat=0;
  const cost=()=>eventAbilityCost(pos,key,after,int(pot,62));
  if(points<0){after=clamp(before+int(points),1,80);budget=after===80?0:clamp(budget,0,cost()-1);}
  else {
    budget=after===80?0:clamp(budget,0,cost()-1);
    budget+=Math.max(0,int(points));
    while(after<80 && budget>=cost()){budget-=cost();after++;}
    if(after===80){overflowStat=budget;budget=0;}
  }
  return {before,after,abilityDelta:after-before,carryBefore,carryAfter:budget,overflowStat};
}
export function eventCounters(s,card,mode,success,category) {
  const out={};const add=k=>{out[k]=(s[k]||0)+1;};
  if(mode==='safe'){add('cntSave');if(success)add('cntSaveWin');}
  if(mode==='norm'&&success)add('cntNormWin');
  if(mode==='bold'){add(success?'cntBoldWin':'cntBoldFail');if(success&&category==='endorsement')add('cntEndorseBoldWin');if(!success&&category!=='training')add('cntSocialBoldFail');}
  if(!success&&mode!=='safe'&&card.counterTags.includes('snackRisk'))add('cntSnack');
  return out;
}
export function eventTraitUnlocks(s) {
  const t=s.traits||{},l=s.love||{},young=s.age<25,out=[];
  if(!t.adking&&s.cntEndorseBoldWin>=5)out.push('adking');
  if(!t.favorite&&young&&s.cntNormWin>=10)out.push('favorite');
  if(!t.clutch&&young&&s.cntBoldWin>=7)out.push('clutch');
  if(!t.disc&&young&&s.cntSaveWin>=15&&(l.caught||0)===0&&s.cntSnack<5)out.push('disc');
  if(!t.cancer&&!t.franchise&&!t.intlace&&(s.cntSocialBoldFail>10||t.scum))out.push('cancer');
  if(!t.distract&&!t.disc&&!out.includes('disc')&&(l.affairs||0)+(l.caught||0)+s.cntSnack>=4&&(l.affairs||0)+(l.caught||0)>=1)out.push('distract');
  return out;
}
export const EVENT_TRAIT_TEXT = {
  favorite:'通常の起用係数に下限0.85、守備資格の閾値−3、通常選択の成功率+5ポイント。故障後の実試合数を保障する効果ではありません。',
  adking:'スポンサー収入が1.1倍。年俸・契約金には影響しません。',
  clutch:'勝負選択の成功率55%（天才と併有で60%）。分類別の成功・失敗効果を改善し、指定された勝負失敗の故障加算は12ポイント。',
  disc:'衰えの開始が2年遅れる。',
  distract:'シーズン前のサイコロが永久に−1個（最低2個）。',
  cancer:'シーズン中のトレード率が大幅上昇し、契約更改も不利になる。',
};
export function validateEventCatalog(d=EVENT_CATALOG) {
  if(d.schema!=='yakyujinsei.event-catalog.v2'||d.effectPolicy!=='CN157_CLASSIFIED_JP_LOCALIZED'||d.events.length!==92)throw new Error('INVALID_EVENT_CATALOG');
  const counts={training:0,encounter:0,endorsement:0};
  d.events.forEach((e,i)=>{
    if(e.id!==i+1||e.key!==`JP_EVT_${String(e.id).padStart(3,'0')}`||!Object.hasOwn(counts,e.category))throw new Error('INVALID_EVENT_ID');
    counts[e.category]++;
    for(const m of EVENT_MODES){if(!e.choices[m]?.label||!e.choices[m]?.good||!e.choices[m]?.bad)throw new Error('INVALID_EVENT_COPY');for(let tier=0;tier<3;tier++)for(const success of [true,false]){
      const actual=e.effectPlans[m][tier][success?'success':'failure'],expected=eventPlan(e.category,m,tier,success);
      for(const key of ['ability','stat','cash'])if(actual[key]!==expected[key])throw new Error(`INVALID_EVENT_EFFECT:${e.id}:${m}`);
    }}
    if((e.category==='endorsement')!==Boolean(e.incomeEffect)||e.injuryFailureModes.some(m=>!EVENT_MODES.includes(m)))throw new Error('INVALID_EVENT_RULE');
  });
  if(counts.training!==43||counts.encounter!==35||counts.endorsement!==14)throw new Error('INVALID_EVENT_COUNTS');
  return true;
}

// AF07: identity is shared; each consumer's entitlement is deliberately separate.
// Pure read-only views. No retroactive payments, effect receipts, or RNG here.
import {buildAwardIdentityView,parseAwardHonor,identifyAwardDecision} from './award-identity-policy.js';

const departments=new Set(['PITCH_WINS','PITCH_ERA','PITCH_STRIKEOUTS','PITCH_WIN_PCT',
  'PITCH_SAVES','PITCH_RELIEF','BATTING_AVG','BATTING_HR','BATTING_RBI','BATTING_SB','BATTING_OBP']);
const phoenix=new Set(['MVP','ROOKIE','LEGACY_BEST_PITCHER','BATTING_AVG','BATTING_HR']);
const protection=new Set(['MVP','ROOKIE','LEGACY_BEST_PITCHER','BATTING_AVG',
  'BATTING_HR','BATTING_RBI','BATTING_SB','GOLD_GLOVE','HITTER_TC']);

export function awardConsumerEntitlement(identity,consumer) {
  if(identity?.status!=='RECOGNIZED')return null;
  const id=identity.awardId;
  // This alias was historically an incentive-only name, not a salary/HOF alias.
  const texts=identity.originalTexts??[identity.originalText];
  const incentiveOnlyAlias=id==='BATTING_HR'&&texts.every(x=>typeof x==='string'&&x.endsWith('ホームラン王'));
  if(consumer==='market'){
    if(incentiveOnlyAlias)return 0;
    if(['MVP','LEGACY_BEST_PITCHER','PITCH_SAWAMURA'].includes(id))return .75;
    if(departments.has(id))return .35;
    return ['GOLD_GLOVE','DEFENSE_BEST','ROOKIE'].includes(id) ? .25 : 0;
  }
  if(consumer==='fallback'){
    if(incentiveOnlyAlias)return 0;
    if(['MVP','LEGACY_BEST_PITCHER','PITCH_SAWAMURA'].includes(id))return 2;
    return departments.has(id)||['GOLD_GLOVE','DEFENSE_BEST'].includes(id)?1:0;
  }
  if(consumer==='incentive'){
    if(id==='MVP')return 'MVP';
    if(id==='LEGACY_BEST_PITCHER')return 'BEST_PITCHER';
    if(id==='PITCH_SAWAMURA')return 'SAWAMURA';
    if(['GOLD_GLOVE','DEFENSE_BEST'].includes(id))return 'GOLD_GLOVE';
    return departments.has(id)?'TITLE':null;
  }
  if(consumer==='hof'){
    if(incentiveOnlyAlias)return {sc:0,mvp:0,aceN:0,king:0};
    if(id==='MVP')return {sc:420,mvp:1,aceN:0,king:0};
    if(['LEGACY_BEST_PITCHER','PITCH_SAWAMURA'].includes(id))return {sc:460,mvp:0,aceN:1,king:0};
    const sc=id==='ROOKIE'?140:id==='GOLD_GLOVE'?300:id==='DEFENSE_BEST'?220:departments.has(id)?160:0;
    return {sc,mvp:0,aceN:0,king:['GOLD_GLOVE','DEFENSE_BEST'].includes(id)||departments.has(id)?1:0};
  }
  if(consumer==='phoenix')return !incentiveOnlyAlias&&phoenix.has(id);
  if(consumer==='demotion')return protection.has(id);
  throw new Error('UNKNOWN_AWARD_CONSUMER');
}

export function consumerAwardView(honors,{year,league}={}){
  return buildAwardIdentityView(honors).filter(row=>row.status==='RECOGNIZED'&&
    (year===undefined||row.year===year)&&(league===undefined||row.league===league));
}

// Exact producers owned by the existing international module. UNKNOWN personal
// text must not be delegated merely because it happens to contain MVP or 王.
export function isInternationalHonor(text){
  return typeof text==='string'&&/^\d{4} (?:ワールド・ベースボール・クラシック|WBSCプレミア12)(?:MVP|優勝|準優勝|3位|ベスト4|ベスト8|決勝ラウンド敗退|予選敗退)$/.test(text);
}

// Consumer-local compatibility, evidenced against development A native policies.
// A row here does NOT create an Award ID, Decision, or eligibility for another
// consumer. No substring fallback is used to recognize an individual award.
const departmentNames=['最多勝','最優秀防御率','最多奪三振','最多セーブ','最優秀中継ぎ',
  '首位打者','本塁打王','打点王','最高出塁率','盗塁王'];
const oldPrefixAcceptedFormal=['最多勝利投手賞','最優秀防御率投手賞','最多セーブ投手賞','最優秀中継ぎ投手賞'];
const table=(groups)=>new Map(groups.flatMap(([value,names])=>names.map(name=>[name,value])));
const legacyTables={
  market:table([[.75,['年間MVP','最優秀投手賞','沢村賞']],
    [.35,[...departmentNames,...oldPrefixAcceptedFormal]],
    [.25,['ゴールデングラブ賞','年間最優秀守備選手','新人王']]]),
  fallback:table([[2,['年間MVP','最優秀投手賞','沢村賞']],
    [1,[...departmentNames,...oldPrefixAcceptedFormal,'ゴールデングラブ賞','年間最優秀守備選手']]]),
  incentive:table([['MVP',['年間MVP','年度MVP']],['BEST_PITCHER',['最優秀投手賞']],
    ['SAWAMURA',['沢村賞']],['GOLD_GLOVE',['ゴールデングラブ','ゴールデングラブ賞','最優秀守備選手','年間最優秀守備選手','守備王']],
    ['TITLE',[...departmentNames,...oldPrefixAcceptedFormal,'ホームラン王','出塁王']]]),
  hof:table([[420,['年間MVP']],[460,['最優秀投手賞']],[140,['新人王']],
    [300,['ゴールデングラブ賞']],[220,['年間最優秀守備選手']],[160,departmentNames],
    ['ALL_STAR',['オールスターゲーム','オールスターゲーム(ファン投票選出)']]]),
  phoenix:table([[true,['年間MVP','年度MVP','MVP','新人王','最優秀投手賞','首位打者','本塁打王','最佳投手','年度最佳投手','打擊王','全壘打王']]]),
  demotion:table([[true,['年間MVP','年度MVP','MVP','新人王','最優秀投手賞','首位打者','本塁打王','ホームラン王',
    '打点王','盗塁王','打撃三冠王','ゴールデングラブ賞','最佳投手','年度最佳投手','打擊王','全壘打王','金手套','守備王','出塁王','上壘王','勝投王','賽揚賞','賽揚獎','澤村賞',
    '救援王','中繼王','三振王','盜壘王','打點王','ホールド王','盗み王']]]),
};
const leagueNames=Object.freeze({NPB:'NPB',KBO:'KBO',CPBL:'台湾プロ野球',MLB:'メジャーリーグ'});

function legacyName(text,consumer,{year,league}={}){
  if(typeof text!=='string')return null;
  let name=text;
  if(consumer==='hof'){
    name=name.replace(/^[0-9]+ /,'');
    const label=leagueNames[league];
    if(!label||!name.startsWith(label))return null;
    return name.slice(label.length);
  }
  const prefix=String(year)+' ';
  if(!name.startsWith(prefix))return null;
  name=name.slice(prefix.length);
  for(const label of Object.values(leagueNames))if(name.startsWith(label))return name.slice(label.length);
  // Native A financial/effect consumers also accepted these exact old prefix
  // formats. They remain consumer-only; no league/ID is inferred for Registry.
  for(const label of ['CPBL','MLB','中職','日職','韓職','美職'])if(name.startsWith(label)){name=name.slice(label.length);break;}
  // G1-A added these exact Japanese producers only with a known league prefix.
  // Financial consumers accepting bare names do not expand effect eligibility.
  if(consumer==='phoenix'&&['最優秀投手賞','首位打者','本塁打王'].includes(name))return null;
  if(consumer==='demotion'&&['最優秀投手賞','首位打者','ゴールデングラブ賞'].includes(name))return null;
  // Missing league is an accepted *consumer format*, not an inferred league ID.
  return name;
}

export function legacyConsumerEntitlement(text,consumer,context={}){
  const names=legacyTables[consumer];if(!names)throw new Error('UNKNOWN_AWARD_CONSUMER');
  const name=legacyName(text,consumer,context);
  return name!==null&&names.has(name)?Object.freeze({kind:'LEGACY_CONSUMER_ONLY',name,value:names.get(name)}):null;
}

/** Read-only evidence rows. Completed live Decisions may grant the new D2
 * entitlement. Consumer-only names retain their own native treatment without
 * acquiring any new identity or becoming a P07 source.
 */
export function consumerTreatmentView(honors,consumer,{year,league,state}={}){
  if(!Array.isArray(honors))return Object.freeze([]);
  const rows=[],seen=new Map(),seenRaw=new Set();
  for(const text of honors){
    const identity=parseAwardHonor(text),legacy=legacyConsumerEntitlement(text,consumer,{year,league});
    let verified=null;
    if(identity.status==='RECOGNIZED'&&(year===undefined||identity.year===year)&&(league===undefined||identity.league===league)){
      for(const d of state?.awardDecisions||[]){
        const proof=identifyAwardDecision(d,state);
        if(proof.status==='RECOGNIZED'&&proof.semanticKey===identity.semanticKey){verified=proof;break;}
      }
    }
    let value=legacy?.value??null,source=legacy?.kind??'UNKNOWN';
    if(verified){
      const semantic={...identity,originalTexts:[text]};
      value=awardConsumerEntitlement(semantic,consumer);source='COMPLETED_DECISION';
      if(consumer==='hof')value=identity.awardId==='ALL_STAR'?'ALL_STAR':value;
    }
    if(value===null||value===false||value===0)continue;
    const r={originalText:text,identity,source,value};
    // Market originally used exact-string Set; consumer-only fallback/HOF did not.
    if(consumer==='market'){if(seenRaw.has(text))continue;seenRaw.add(text);}
    if(identity.status==='RECOGNIZED'){
      const prior=seen.get(identity.semanticKey);
      if(prior!==undefined){
        // A semantic alias must not suppress a canonical source with real benefits.
        const weight=v=>typeof v==='number'?v:typeof v==='object'?v.sc:1;
        if(weight(value)>weight(rows[prior].value))rows[prior]=r;
        continue;
      }
      seen.set(identity.semanticKey,rows.length);
    }
    rows.push(r);
  }
  return Object.freeze(rows.map(r=>Object.freeze(r)));
}

export function hasCurrentAwardEffect(state,consumer,league){
  if(!['phoenix','demotion'].includes(consumer))throw new Error('INVALID_AWARD_EFFECT_CONSUMER');
  if(consumerTreatmentView(state.honors,consumer,{year:state.year}).some(r=>r.value===true))return true;
  // Preserve the existing international MVP effect without guessing a personal ID.
  if((state.honors||[]).some(text=>isInternationalHonor(text)&&
    text.startsWith(String(state.year)+' ')&&text.endsWith('MVP')))return true;
  // Only an actually completed current NPB/SP P08 Decision grants the new effect.
  for(const d of state.awardDecisions||[]){
    const proof=identifyAwardDecision(d,state);
    if(proof.status==='RECOGNIZED'&&proof.awardId==='PITCH_SAWAMURA'&&
      proof.year===state.year&&proof.league===league&&proof.league==='NPB'&&proof.level==='NPB1'&&proof.role==='SP')return true;
  }
  return false;
}

export function hasHistoricalDefenseAward(honors){
  return (honors||[]).some(text=>{
    if(typeof text!=='string')return false;
    let name=text.replace(/^[0-9]+ /,'');
    for(const label of [...Object.values(leagueNames),'CPBL','MLB','中職','日職','韓職','美職'])if(name.startsWith(label)){name=name.slice(label.length);break;}
    return name==='ゴールデングラブ賞'||name==='年間最優秀守備選手';
  });
}

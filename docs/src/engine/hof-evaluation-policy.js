// Approved league-specific retirement evaluation. Read-only: never repairs historical S.
import {consumerTreatmentView,isInternationalHonor} from './award-consumer-policy.js';
import {careerScoreFor} from './hall-of-fame-tier-policy.js';
const levels={NPB:'NPB1',MLB:'MLB',KBO:'KBO1',CPBL:'CPBL1'};
const labels={NPB:'NPB',MLB:'メジャーリーグ',KBO:'KBO',CPBL:'台湾プロ野球'};
const titles={NPB:'日本一',MLB:'ワールドシリーズチャンピオン',KBO:'韓国シリーズ優勝',CPBL:'台湾シリーズ優勝'};
export function firstTeamStats(state,bucket){
 const st=state.statsByLevel?.[levels[bucket]],required=state.pos==='P'?['W','SV','SO','IP']:['H','HR','SB','RBI','BB'];
 return st&&required.every(k=>Number.isFinite(st[k]))?st:null;
}
export function hofHonorBreakdown(state,bucket){
 const personal=[],team=[],international=[],other=[],unknown=[],seen=new Set();
 for(const row of consumerTreatmentView(state.honors||[],'hof',{league:bucket,state})){
  const match=/^(\d{4}) (NPB|KBO|台湾プロ野球|メジャーリーグ)(.+)$/.exec(row.originalText);
  if(!match||match[2]!==labels[bucket]){unknown.push(row.originalText);continue;}
  const key=row.identity.status==='RECOGNIZED'?row.identity.semanticKey:JSON.stringify([+match[1],bucket,match[3]]);
  if(seen.has(key))continue;seen.add(key);
  const value=row.value==='ALL_STAR'?{sc:state.pos==='P'?70:40}:typeof row.value==='object'?row.value:{sc:row.value,mvp:row.value===420?1:0,aceN:row.value===460?1:0,king:[160,220,300].includes(row.value)?1:0};
  personal.push({year:+match[1],league:bucket,key,text:row.originalText,...value});
 }
 const years=new Set();
 for(const r of Object.values(state.championshipResults||{}))if(r?.won===true&&r.eligible===true&&r.league===bucket&&r.level===levels[bucket]&&Number.isInteger(r.year))years.add(r.year);
 // The native title has a unique league and top-team scope; exact historical format only.
 for(const text of state.honors||[]){const m=/^(\d{4}) (.+)$/.exec(text);if(m&&m[2]===titles[bucket])years.add(+m[1]);}
 for(const year of [...years].sort((a,b)=>a-b))team.push({year,league:bucket,key:JSON.stringify([year,bucket,'TEAM_CHAMPIONSHIP']),text:year+' '+titles[bucket],sc:90});
 for(const text of new Set(state.honors||[]))if(isInternationalHonor(text))international.push({text,sc:0});
 const f=state.franchiseAchievement;if(state.traits?.franchise&&f&&Number.isInteger(f.year)&&f.league===bucket&&typeof f.teamId==='string'&&f.teamId)other.push({year:f.year,league:bucket,teamId:f.teamId,key:JSON.stringify([f.year,f.league,f.teamId,'FRANCHISE']),text:'神カード',sc:200});
 const honor={sc:0,mvp:0,aceN:0,king:0};for(const row of [...personal,...team,...other])for(const k of Object.keys(honor))honor[k]+=row[k]||0;
 return {personal,team,international,other,unknown,honor};
}
export function evaluateLeagueHof(state,bucket,thresholds,leagueName){
 if(!levels[bucket])return null;
 const st=firstTeamStats(state,bucket),details=hofHonorBreakdown(state,bucket),base=st?careerScoreFor(st,state.pos):0,rawSc=base+details.honor.sc;
 const pureTier=rawSc>=thresholds[0]?0:rawSc>=thresholds[1]?1:rawSc>=thresholds[2]?2:rawSc>=thresholds[3]?3:4;
 let i=pureTier,reason='';
 if((details.honor.mvp||details.honor.aceN)&&i>1){i=1;reason=details.honor.mvp?'MVP受賞による評価':'最優秀投手賞受賞による評価';}
 else if(details.honor.king&&i>2){i=2;reason='部門賞受賞による評価';}
 // 0.01 point precision; a near-boundary rounding-up is explicitly identified.
 const sc=Number(rawSc.toFixed(2)),threshold=thresholds.find(t=>rawSc<t&&sc>=t);
 return {i,sc,rawSc,pureTier,base,reason,belowThreshold:threshold!==undefined,hasFirstTeam:!!st,details,
 name:leagueName+['殿堂','スター選手','デイリープレイヤー','フリンジプレイヤー','ページ上の乗客'][i]};
}

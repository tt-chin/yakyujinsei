import {fmtIP} from './stat-format.js';

export function reviewStatLine(pos,st,formatIP=fmtIP){
  if(!st)return '';
  if(pos==='P')return `登板 ${st.G||0}｜投球回 ${formatIP(st.IP||0)}｜${st.W||0}勝${st.L||0}敗｜奪三振 ${st.SO||0}`;
  return `出場 ${st.G||0}｜打席 ${st.PA||0}｜打率 ${(st.AB?(st.H||0)/st.AB:0).toFixed(3).replace(/^0/,'')}｜本塁打 ${st.HR||0}｜打点 ${st.RBI||0}`;
}

// Career and retirement share the labels, ordering and exact level buckets.
const hasRecord=stat=>stat&&typeof stat==='object'&&['yr','G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','HLD','IP','SO','ER','AS','DEF'].some(key=>typeof stat[key]==='number'&&Number.isFinite(stat[key])&&stat[key]!==0);
export function careerRecordModel(state,{formatIP=fmtIP,recordedOnly=false}={}){
  const definitions=[['NPB',[['NPB1','NPB一軍'],['NPB2','NPB二軍'],['NPB_DEV','NPB育成']]],['KBO',[['KBO1','KBO一軍'],['KBO2','KBOフューチャース']]],['台湾プロ野球',[['CPBL1','台湾プロ野球一軍'],['CPBL2','台湾プロ野球二軍']]],['MLB',[['MLB','MLB']]],['MiLB',[['A3','3A'],['A2','2A'],['A1','1A'],['R','ルーキーリーグ']]],['独立リーグ',[['IND','独立リーグ']]],['社会人野球',[['CORP','社会人野球']]]];
  const byLevel=state.statsByLevel||{};
  const groups=definitions.map(([label,levels])=>Object.freeze({label,levels:levels.filter(([key])=>recordedOnly?hasRecord(byLevel[key]):byLevel[key]).map(([key,levelLabel])=>Object.freeze({key,label:levelLabel,summary:reviewStatLine(state.pos,byLevel[key],formatIP)}))})).filter(group=>group.levels.length);
  return Object.freeze({seasons:Array.isArray(state.log)?state.log.length:0,internationalCount:state.intlCount||0,groups});
}

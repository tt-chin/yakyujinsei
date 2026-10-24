// Hall-of-fame career score and tier (OOP plan §2j, phase 8).
// Pure rules: callers pass stats, position and the final TIER_TH/LG_N entries explicitly; no DOM, S or RNG.
export function careerScoreFor(st,position){
  if(position==='P')return st.W*13+st.SV*6+st.SO*0.9+st.IP*0.35;
  return st.H+st.HR*3+st.SB*0.8+st.RBI*0.5+st.BB*0.3+Math.max(0,st.DEF||0)*6;
}
export function defenseShareFor(st,position){ /* 守備貢献占キャリア総価値値割合 0~1。 */
  if(!st||position==='P')return 0;
  const off=st.H+st.HR*3+st.SB*0.8+st.RBI*0.5+st.BB*0.3;
  const def=Math.max(0,st.DEF||0)*6;
  return (off+def)>0?def/(off+def):0;
}
export function hallOfFameTier({baseScore,honor,thresholds,leagueName}){
  const sc=baseScore+honor.sc,th=thresholds;
  let i=sc>=th[0]?0:sc>=th[1]?1:sc>=th[2]?2:sc>=th[3]?3:4;
  /* タイトル最低条件：MVP/最優秀投手賞は最低でもスター級;部門タイトルは最低でもレギュラー級。 */
  if(honor.mvp||honor.aceN)i=Math.min(i,1);
  else if(honor.king)i=Math.min(i,2);
  return {i,sc:Math.round(sc),name:leagueName+['殿堂','スター選手','デイリープレイヤー','フリンジプレイヤー','ページ上の乗客'][i]};
}

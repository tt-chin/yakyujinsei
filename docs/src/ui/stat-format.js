// Pure stat formatters (OOP plan §2rr): innings pitched in baseball notation and the estimated slugging percentage.
// Bodies are the former game.js fmtIP/slgOf. No state, no RNG.
export function fmtIP(ip){ /* 十進出位局数轉棒球表示：小数部分 →三分之幾(出局数)。 */
  if(ip==null)return '0.0';
  const whole=Math.floor(ip); const frac=ip-whole;
  const outs=Math.round(frac*3); /* 0/1/2/3 */
  if(outs>=3)return (whole+1)+'.0';
  return whole+'.'+outs;
}
/* 長打率估算：なし二三壘成績、に応じて本塁打比例と長打力推估塁打数。 */
export function slgOf(st){
  if(!st.AB)return 0;
  const hr=st.HR, nonHR=Math.max(0,st.H-hr);
  /* 本塁打以外の安打のうち、約 22% 二塁打、3% 三塁打——整数本で算出し、塁打数必ず整数、小標本で成立しないSLGが出るのを防ぐ。 */
  const doubles=Math.round(nonHR*0.22), triples=Math.round(nonHR*0.03);
  const singles=Math.max(0,nonHR-doubles-triples);
  const tb=singles + doubles*2 + triples*3 + hr*4;
  return tb/st.AB;
}

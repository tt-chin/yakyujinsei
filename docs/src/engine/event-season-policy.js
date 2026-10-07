const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const count=v=>Math.max(0,Math.round(Number(v)||0));
export function normalizeEventSeason(st,{pos,role,maxGames}) {
  const out={...st};
  for(const key of ['G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','HLD','SO','ER'])if(key in out)out[key]=count(out[key]);
  out.G=Math.min(out.G,maxGames);
  if(pos==='P'){
    out.IP=clamp(out.IP||0,0,9*maxGames);out.G=Math.max(out.G,Math.ceil(out.IP/9));
    if(role!=='SP'){out.SV=Math.min(out.SV||0,Math.floor(out.G*.85));out.HLD=Math.min(out.HLD||0,out.G-out.SV);}
    const cap=role==='SP'?out.G:out.G-(out.SV||0)-(out.HLD||0);
    if(out.W+out.L>cap){out.W=Math.min(out.W,cap);out.L=Math.max(0,cap-out.W);}
    out.era=out.IP>0?out.ER*9/out.IP:0;out.WHIP=out.IP>0?(out.H+out.BB)/out.IP:0;
  }else{out.AB=Math.min(out.AB,out.PA);out.H=Math.min(out.H,out.AB);out.HR=Math.min(out.HR,out.H);out.avg=out.AB>0?out.H/out.AB:0;}
  return out;
}
export function applyEventSeason(st,{points,seasonFactor,pos,role,maxGames}) {
  const p=points*seasonFactor;if(p===0)return {...st};
  const out={...st},q=Math.abs(p);
  if(pos==='P'){
    if(p>0){const addG=role==='SP'?0:Math.min(Math.max(0,Math.min(68,maxGames)-out.G),Math.round(p*1.2));out.G+=addG;out.IP=(Math.round(out.IP*3)+Math.round((addG*1.05+p*4)*3))/3;out.SO+=Math.round(p*8);if(role==='SP')out.W+=Math.round(p*.4);else out.SV+=Math.round(p*.6);if(out.IP>0)out.ER=Math.round(clamp(out.era-p*.05,1.4,9.9)*out.IP/9);}
    else{out.SO=Math.max(0,out.SO-Math.round(q*6));out.W=Math.max(0,out.W-Math.round(q*.3));if(role!=='SP')out.SV=Math.max(0,out.SV-Math.round(q*.4));if(out.IP>0)out.ER=Math.round(clamp(out.era+q*.08,1.4,9.9)*out.IP/9);}
  }else if(p>0){const addG=Math.min(Math.max(0,maxGames-out.G),Math.round(p*1.5)),addPA=Math.round(addG*4.25),addAB=Math.round(addPA*.9);out.G+=addG;out.PA+=addPA;out.AB+=addAB;const addH=clamp(Math.round(addAB*.55)+Math.round(p*1.5),0,out.AB-out.H),addHR=Math.min(addH,Math.round(p*1.2));out.H+=addH;out.HR+=addHR;out.RBI+=Math.round(addHR*2.1+(addH-addHR)*.3);}
  else{out.H-=Math.min(out.H,Math.round(q*2));out.HR=Math.min(out.H,Math.max(0,out.HR-Math.round(q*.5)));out.RBI=Math.max(0,out.RBI-Math.round(q*1.2));}
  return normalizeEventSeason(out,{pos,role,maxGames});
}

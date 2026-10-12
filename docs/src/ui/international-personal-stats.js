const pitcherKeys=['G','IP','W','SV','SO','ER'];
const batterKeys=['G','PA','AB','H','HR','RBI'];

// Read the existing cumulative result; never generate another performance.
export function internationalPersonalStats(before,after,position,role){
  const stats={};
  for(const key of position==='P'?pitcherKeys:batterKeys){
    const difference=after[key]-before[key];
    if(!Number.isFinite(difference)||difference<0)throw new Error('INVALID_INTERNATIONAL_STATS_DELTA: '+key);
    stats[key]=key==='IP'?Number(difference.toFixed(1)):difference;
  }
  return {position,role:role??null,stats};
}

// The caller supplies the existing decimal-IP formatter without changing its rules.
export function renderInternationalPersonalStats(personalStats,fmtIP){
  if(!personalStats)return '<p>本大会の個人成績：記録なし</p>';
  const s=personalStats.stats||{},valid=v=>Number.isFinite(v)&&v>=0;
  const count=k=>valid(s[k])?String(Math.trunc(s[k])):'—';
  let lines;
  if(personalStats.position==='P'){
    const ip=valid(s.IP)?fmtIP(s.IP):'—';
    const era=valid(s.ER)&&valid(s.IP)&&s.IP>0?(s.ER*9/s.IP):null;
    lines=[`登板 ${count('G')}｜投球回 ${ip}｜勝利 ${count('W')}｜セーブ ${count('SV')}`,
      `奪三振 ${count('SO')}｜防御率 ${Number.isFinite(era)?era.toFixed(2):'—'}`];
  }else{
    const avg=valid(s.H)&&valid(s.AB)&&s.AB>0?s.H/s.AB:null;
    lines=[`出場 ${count('G')}｜打席 ${count('PA')}｜打数 ${count('AB')}｜安打 ${count('H')}`,
      `打率 ${Number.isFinite(avg)?avg.toFixed(3).replace(/^0/,''):'—'}｜本塁打 ${count('HR')}｜打点 ${count('RBI')}`];
  }
  return '<div class="intl-personal-stats"><h4>本大会の個人成績</h4>'+lines.map(line=>'<p>'+line+'</p>').join('')+'</div>';
}

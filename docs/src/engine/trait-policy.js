// Display and deterministic trait decisions only. No RNG or persistence.
export const TRAIT_LABELS = Object.freeze({
  favorite:'監督のお気に入り',adking:'広告王',genius:'天才',glass:'スペランカー',iron:'鉄人',scum:'クズ男',late:'大器晩成',disc:'自律の鬼',academy:'理論派',intlace:'国際大会の鬼',franchise:'フランチャイズプレーヤー',clutch:'強心臓',phoenix:'復活',combo:'小細工無用',onetool:'一芸特化',rubber:'ゴムゴムの腕',legend:'歴史に残る名選手',yips:'イップス',distract:'私生活多忙',cancer:'チームの癌',ambience:'問題児',goldcloth:'黄金のユニフォーム',thief:'給料泥棒',mrteam:'ミスター',confidante:'女友達止まり',smallschool:'弱小校の星',grinder:'頑張り屋',rainbow:'渡り鳥',taiwan:'侍ジャパンの魂',
  oldghost:'ベテランの意地',miraclegen:'奇跡の世代',strongpitch:'若き剛腕',stronghit:'若きスラッガー',championmaker:'優勝請負人',latepractice:'練習遅刻常習犯',pitcherTC:'投手三冠王',hitterTC:'打撃三冠王',nitenichi:'二天一流',
});
export const DEFERRED_TRAITS = Object.freeze(['championmaker','pitcherTC','nitenichi']);
export const TRAIT_TEXT = Object.freeze({
  intlace:'国際大会による故障リスク加算なし。大会の能力ポイントは最低2点。獲得した大会では適用されず、次回出場から有効。',
  oldghost:'35歳以上で年間MVPを獲得。翌季の衰えを半減（端数は四捨五入、最低1）。生涯一度だけ。',
  miraclegen:'高校時代の地方・秋季・選抜・甲子園で通算4回優勝。能力への追加効果はありません。',
  strongpitch:'24歳未満でNPBまたはメジャーリーグの年間MVPを獲得した投手。記念称号です。',
  stronghit:'24歳未満でNPBまたはメジャーリーグの年間MVPを獲得した野手。記念称号です。',
  latepractice:'訓練イベントの安全選択で累計20回失敗。以後、全イベントの安全選択の成功率が5ポイント低下。',
  hitterTC:'同一年度・同一リーグで首位打者、本塁打王、打点王を獲得。年間MVPが確定します。',
  goldcloth:'阪神ストライプス一軍で通算10年。能力への追加効果はありません。',
  confidante:'交際成立3回以上。本人・元交際相手との子どもがなく、現在は未婚。記念称号です。',
});
const LEGACY_LABELS = Object.freeze({愛将:'favorite',遅咲き:'late',球団の顔:'franchise',継続は力なり:'combo',ラバーアーム:'rubber','ロッカールームの癌':'cancer',ムードメーカー:'ambience',ゴールデングラブ常連:'goldcloth','ミスター・チーム':'mrteam',愛妻家:'confidante',努力の人:'grinder',全球団制覇:'rainbow',台湾通:'taiwan','Team Taiwan':'taiwan'});
export function traitLabel(key,s={},nickname=name=>name) {
  const base=TRAIT_LABELS[key]||key;
  if(key==='mrteam')return (nickname(s.mrTeamName||'')||'')+base;
  if(key==='legend')return (s.legendLeague||'')+base;
  if(key==='rainbow')return (s.rainbowLg||'')+base;
  if(['pitcherTC','hitterTC','nitenichi'].includes(key))return (s.tripleCrownHistory?.[key]||[]).map(r=>r.league).filter((v,i,a)=>a.indexOf(v)===i).join('・')+base;
  return base;
}
export function removedTraitLabel(item,s={},nickname) {
  const label=typeof item==='string'?item:String(item?.name||item?.key||item);
  if(LEGACY_LABELS[label])return traitLabel(LEGACY_LABELS[label],s,nickname);
  if(TRAIT_LABELS[label])return traitLabel(label,s,nickname);
  return label.endsWith('ジャーニーマン')?label.slice(0,-7)+'渡り鳥':label;
}
export function confidanteEligible(s) {
  const l=s.love||{},kids=(Number(l.kids)||0)+(Array.isArray(l.exes)?l.exes.reduce((n,e)=>n+(Number(e?.kids)||0),0):0);
  return l.datedTimes>=3&&kids===0&&['single','dating','divorced'].includes(l.st)&&!s.traits?.married&&!s.traits?.confidante;
}
export function recordFirstTeamSeason(s) {
  if(s.lv!=='NPB1'||!s.orgTeamId)return;
  s.firstTeamSeasons??={};s.firstTeamYearsByTeam??={};
  const key=s.year+':'+s.orgTeamId;
  if(s.firstTeamSeasons[key])return;
  s.firstTeamSeasons[key]=true;
  s.firstTeamYearsByTeam[s.orgTeamId]=(s.firstTeamYearsByTeam[s.orgTeamId]||0)+1;
}
export const goldclothEligible=s=>!s.traits?.goldcloth&&(s.firstTeamYearsByTeam?.NPB_CL_HAN||0)>=10;
export function highSchoolChampionCount(s) {
  const keys=new Set(['HS_SUMMER_LOCAL','HS_FALL','HS_SENBATSU','HS_KOSHIEN']);
  return new Set((s.domesticTournamentLog||[]).filter(r=>keys.has(r.key)&&r.result==='優勝').map(r=>r.year+':'+r.key)).size;
}
export function declineForSeason(s,base) {
  const active=Boolean(s.oldGhostPending&&!s.oldGhostUsed);
  if(active){s.oldGhostPending=false;s.oldGhostUsed=true;}
  return active&&base>0?Math.max(1,Math.round(base*.5)):base;
}
export function awardTraitUnlocks(s,bucket,league) {
  const unlocked=[],t=s.traits,h=s.honors,prefix=`${s.year} ${league}`;
  const three=s.pos!=='P'&&['首位打者','本塁打王','打点王'].every(title=>h.includes(prefix+title));
  if(three){
    s.tripleCrownHistory??={};s.tripleCrownHistory.hitterTC??=[];
    const history=s.tripleCrownHistory.hitterTC;
    const newLeague=!history.some(r=>r.bucket===bucket);
    if(!history.some(r=>r.year===s.year&&r.bucket===bucket))history.push({year:s.year,bucket,league});
    if(!h.includes(prefix+'打撃三冠王'))h.push(prefix+'打撃三冠王');
    if(!h.includes(prefix+'年間MVP'))h.push(prefix+'年間MVP');
    if(!t.hitterTC||newLeague){t.hitterTC=true;unlocked.push('hitterTC');}
  }
  if(h.includes(prefix+'年間MVP')){
    if(s.age>=35&&!t.oldghost&&!s.oldGhostUsed){t.oldghost=true;s.oldGhostPending=true;unlocked.push('oldghost');}
    const young=s.pos==='P'?'strongpitch':'stronghit';
    if(s.age<24&&['NPB','MLB'].includes(bucket)&&!t[young]){t[young]=true;unlocked.push(young);}
  }
  return unlocked;
}

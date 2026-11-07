// Test-only, opt-in cross-version projection. The historical championship
// records remain compared by the caller; only independently checked 1.14.0
// technical state and its honor-only flag are mapped to the old schema.
import {execFileSync} from 'node:child_process';
import {JP_DATA} from '../../docs/src/data/jp-data.js';
export function projectChampionmakerState(state,teams,fixture=false){
  const fail=reason=>{throw Error('CHAMPIONMAKER_CONTRACT: '+reason);};
  const rules={NPB1:['NPB','日本一'],MLB:['MLB','ワールドシリーズチャンピオン'],CPBL1:['CPBL','台湾シリーズ優勝'],KBO1:['KBO','韓国シリーズ優勝']};
  for(const key of ['championmakerWins','championmakerCount','championmakerAcquiredYear'])if(!Object.hasOwn(state,key))fail('missing '+key);
  const wins=Object.entries(state.championshipResults||{}).filter(([key,r])=>{
    const rule=rules[r?.level];
    return rule&&r.won===true&&r.eligible===true&&Number.isInteger(r.year)&&r.year>0&&r.year<=state.year&&String(r.year)===key&&r.league===rule[0]&&r.title===rule[1]&&teams.some(t=>t.teamId===r.teamId&&t.org===r.league);
  }).map(([,r])=>({year:r.year,league:r.league,level:r.level,teamId:r.teamId,title:r.title})).sort((a,b)=>a.year-b.year);
  const actual=state.championmakerWins;
  if(!Array.isArray(actual)||actual.length!==wins.length)fail('history length');
  for(let i=0;i<wins.length;i++){
    const row=actual[i],expected=wins[i];
    if(!row||Object.keys(row).sort().join(',')!=='league,level,teamId,title,year'||Object.keys(expected).some(k=>row[k]!==expected[k]))fail('history identity/order at '+i);
  }
  if(state.championmakerCount!==wins.length)fail('count');
  const acquired=wins.length>=5;
  if(state.championmakerAcquiredYear!==(acquired?wins[4].year:null))fail('acquisition year');
  const owns=Object.hasOwn(state.traits||{},'championmaker');
  if(!owns&&(!fixture||acquired))fail('missing acquisition flag');
  if(owns&&state.traits.championmaker!==acquired)fail('acquisition flag');
  const result={...state};
  delete result.championmakerWins;delete result.championmakerCount;delete result.championmakerAcquiredYear;
  if(owns)result.traits={...state.traits,championmaker:false};
  return result;
}
// The projection maps 1.14.0 state back to a pre-1.14.0 baseline. A baseline that
// is itself 1.14.0 or later already has these fields and is compared raw.
export function baselineNeedsChampionmakerProjection(ref,root){
  const source=execFileSync('git',['show',ref+':docs/src/config.js'],{cwd:root,encoding:'utf8'});
  const match=source.match(/^export const VERSION = '(\d+)\.(\d+)\.(\d+)';$/m);
  if(!match)throw Error('CHAMPIONMAKER_BASELINE_VERSION: '+ref);
  const [major,minor]=match.slice(1,3).map(Number);
  return major<1||(major===1&&minor<14);
}
export const legacyChampionmakerState=(state,options={})=>projectChampionmakerState(state,JP_DATA.teams,options.fixture===true);

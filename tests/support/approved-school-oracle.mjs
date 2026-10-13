// Positive historical controls only: apply the explicitly approved C-school and COPY
// deltas to a served baseline, leaving unrelated game mechanisms under comparison.
// This is NOT raw old-version replay or old-state migration. Raw comparisons live in
// smallschool-c-e2e. Never use this on an old-bug negative baseline.
import {JP_DATA} from '../../docs/src/data/jp-data.js';
import {VERSION} from '../../docs/src/config.js';
import * as school from '../../docs/src/engine/school-policy.js';
export function withApprovedSchoolChanges(source) {
  if(source.includes("from './school-policy.js'"))return source;
  let result=source.replace("tier=tierRoll<30?'S':tierRoll<80?'A':'B'",'tier=highSchoolTier(tierRoll)');
  if(result===source)throw Error('Unrecognized historical school initializer');
  result=result.replaceAll("S.schoolTier==='S'?6:S.schoolTier==='A'?2:-2",'schoolCompetitionBonus(S.stage,S.schoolTier)');
  result=result.replace('!S.traits.smallschool && S.hsTier===3',"!S.traits.smallschool && smallSchoolEligibility(S.birthHighSchool,JP_DATA.highSchools,"+JSON.stringify(VERSION)+")==='ELIGIBLE'");
  const begin=result.indexOf('  newState = function(name,pos)'),end=result.indexOf('\n  const nextContractId',begin);
  if(begin<0||end<begin)throw Error('Unrecognized historical school scope');
  let factory=result.slice(begin,end);
  const birth='installBirthHighSchool(state,school,'+JSON.stringify(VERSION)+');';
  if(factory.includes('ensureEventState(state);'))factory=factory.replace('ensureEventState(state);',birth+'ensureEventState(state);');
  else factory=factory.replace('return state;',birth+'return state;');
  if(!factory.includes('state.potSum0='))factory=factory.replace('return state;','state.potSum0=Object.values(pot).reduce((sum,value)=>sum+value,0);return state;');
  result=result.slice(0,begin)+factory+result.slice(end);
  const functions=Object.values(school).map(fn=>fn.toString()).join('\n');
  const schools=JSON.stringify(JP_DATA.highSchools.slice(50));
  result=functions+'\n'+result.replace('  const DATA = JP_DATA;','  const DATA = JP_DATA;\n  if(DATA.highSchools.length===50)DATA.highSchools.push(...'+schools+');');
  // Approved COPY strings only; no gameplay rewrite.
  result=result.replace("'トレーニング成果を割り振る（サイコロをタップして適用｜スカウト評価：'+(S.pos==='P'?'60/70/75':'70/75')+' 以上は成長効率が低下）'","'能力の項目を選んで、サイコロを割り当てます。能力値が高くなるほど、成長に必要なポイントが増えます。潜在能力を超える場合は、さらにポイントが必要です。能力値の上限は80です。'");
  result=result.replace('関係を保存することに成功｜失敗＝再び能力を失って別れる','成功＝関係を続ける｜失敗＝能力がさらに低下して別れる');
  result=result.replace('画像を作成できませんでした。ページを再読み込みして、もう一度お試しください。','画像を作成できませんでした。「もう一度作成する」から再試行してください。');
  result=result.replace('${escapeHTML(S.team)}</b>野球部',"${escapeHTML(S.team)}</b>${S.schoolTier==='C'?'（C級・弱小校）':''}野球部");
  return result;
}

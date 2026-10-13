// Two natural seed careers per target. Reuse immutable observation/production drivers.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const target=process.argv.find(x=>x.startsWith('--target='))?.slice(9);
assert(['CPBL','KBO','NPB','MLB'].includes(target));
assert(!process.argv.some(x=>x.startsWith('--baseline=')),'Use current engine only');
assert(process.argv.some(x=>x.startsWith('--output=')));
const previous=new URL('../pitcher-tc-research-1119/run.mjs',import.meta.url);
let wrapper=fs.readFileSync(previous,'utf8').replaceAll('import.meta.url',JSON.stringify(previous.href));
wrapper=wrapper.replace("await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));",'export const generated=code;');
let {generated:code}=await import('data:text/javascript;base64,'+Buffer.from(wrapper).toString('base64'));
code=code.replaceAll('import.meta.url',JSON.stringify(new URL('../pitcher-tc-research/research.mjs',import.meta.url).href));
const replace=(a,b)=>{assert.equal(code.split(a).length,2,a);code=code.replace(a,b);};
const action=String.raw`
window.__hofAudit.action=function(strategy){
 if(S.done)return 'done';
 const league=strategy.split('-')[0],usa=league==='MLB',inTarget=usa?['MiLB','MLB'].includes(S.org):S.org===league;
 const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped'));
 const pitching=rows.filter(e=>['vel','ctl','brk'].includes(e.dataset.abilityKey)).sort((a,b)=>S.ab[a.dataset.abilityKey]-S.ab[b.dataset.abilityKey]||['vel','ctl','brk'].indexOf(a.dataset.abilityKey)-['vel','ctl','brk'].indexOf(b.dataset.abilityKey));
 const sta=rows.find(e=>e.dataset.abilityKey==='sta');
 const buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
 const first=e=>e.innerText.split(String.fromCharCode(10))[0],stay=e=>/現在の球団に残留|権利を行使せず残留|宣言残留/.test(first(e));
 const target=e=>{const t=e.innerText,f=first(e);if(/辞退|断る|現役引退|引退を選択/.test(f)||(!/契約|移籍|オファー|指名|入団|復帰/.test(t)))return false;
 if(usa)return !/帰国|NPBへ復帰/.test(f)&&/米国プロ組織と契約する|MLB|メジャー|米国.*契約|MiLB|ルーキー|3A|2A|1A/.test(t);
 if(league==='KBO')return /KBO一軍|KBOフューチャース|韓国.*(?:移籍|オファー|契約)/.test(t);
 if(league==='CPBL')return /CPBL|台湾プロ野球|台湾.*(?:移籍|オファー|契約)/.test(t);
 return /NPB|日本プロ野球/.test(t);};
 let b=(S.ab.sta<60?sta:null)||pitching[0]||sta;
 b=b||buttons.find(e=>first(e)==='全力投球')||buttons.find(e=>first(e)==='トミー・ジョン手術を受ける')||buttons.find(e=>first(e)==='先発へ転向し、ローテを担う');
 if(!b&&inTarget)b=buttons.find(stay);
 if(!b){const offers=buttons.filter(target);b=offers.find(e=>/一軍契約|KBO一軍|NPB一軍/.test(e.innerText))||offers[0];}
 b=b||buttons.find(e=>/配分を確定|配分完了|確定|次へ|完了/.test(first(e)))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(first(e)))||buttons.find(e=>!/現役引退|引退を選択|現役を退く/.test(first(e)))||buttons[0];
 if(!b)return 'waiting';window.__hofActions.push({year:S.year,level:S.lv,choice:b.dataset.abilityKey||b.innerText});b.click();return S.done?'done':'action';
};
`;
const match=code.match(/const studyHook=(.+);\nconst instrument=/);assert(match);
let hook=JSON.parse(match[1]).replace('const studyAction=window.__hofAudit.action;',action+'\nconst studyAction=window.__hofAudit.action;');
hook=hook.replace('pendStat:S.pendStat,calls:',"pendStat:S.pendStat,prevD:S.prevD,lastD:S.lastD,teamId:S.orgTeamId,contract:S.ct?{id:S.ct.contractId,start:S.ct.startYear,end:S.ct.endYear,remaining:S.ct.remainingYears}:null,calls:");
replace(match[1],JSON.stringify(hook));
const cases=['tob0ilu0','q77bi1jx'].map(seed=>({seed,pos:'P',strategy:target+'-SP',targetLeague:target}));
code=code.replace(/const cases=Array.from\(\{length:100\}[^\n]+/,`const cases=${JSON.stringify(cases)};`);
const start=code.indexOf(' await Promise.all(Array.from({length:4}'),end=code.indexOf(' const data={source:',start);assert(start>=0&&end>start);
const loop=`
 for(const input of cases){const r=await run(input);results.push(r);writeStudy(arg('output'),{commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version:VERSION,results});console.error(r.seed+' '+r.strategy+' '+r.completed+' RNG '+r.calls);if(!r.completed||r.errors.length||r.resources.length){process.exitCode=1;break;}}
 const replay=[],replayResults=[];
 if(!process.exitCode)for(let i=0;i<cases.length;i++){const r=await run(cases[i]),old=results[i];replayResults.push(r);writeStudy(arg('output').replace('.json','-replay.json'),{results:replayResults});assert(r.completed&&!r.errors.length&&!r.resources.length,'Replay must retire without errors');assert.deepEqual(r.fullState,old.fullState);assert.deepEqual(r.choiceHistory,old.choiceHistory);assert.deepEqual(r.study,old.study);assert.equal(r.calls,old.calls);assert.equal(r.calls,r.study.rng.length);replay.push({seed:r.seed,strategy:r.strategy,status:'PASS',fullState:true,choiceHistory:true,allRngValues:true,allActionWindows:true,calls:r.calls});}
`;
code=code.slice(0,start)+loop+code.slice(end);
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
replace('observationOnly:true',"observationOnly:true,strategyVersion:'d2-two-seed-v1',strategySha256:"+JSON.stringify(hash(new URL('STRATEGIES.md',import.meta.url)))+',targetLeague:'+JSON.stringify(target)+',engineSha256:'+JSON.stringify(hash(new URL('../../src/engine/game.js',import.meta.url))));
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

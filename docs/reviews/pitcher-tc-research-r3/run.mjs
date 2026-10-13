import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const previous=new URL('../pitcher-tc-research-1119/run.mjs',import.meta.url);
let wrapper=fs.readFileSync(previous,'utf8').replaceAll('import.meta.url',JSON.stringify(previous.href));
wrapper=wrapper.replace("await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));",'export const generated=code;');
let {generated:code}=await import('data:text/javascript;base64,'+Buffer.from(wrapper).toString('base64'));
code=code.replaceAll('import.meta.url',JSON.stringify(new URL('../pitcher-tc-research/research.mjs',import.meta.url).href));
const batch=Number(process.argv.find(x=>x.startsWith('--batch='))?.slice(8));assert([1,2,3,4].includes(batch));
const strategies=['KBO-SP','KBO-Bullpen','USA-SP','USA-Bullpen'];
const replace=(a,b)=>{assert.equal(code.split(a).length,2,a);code=code.replace(a,b);};
const action=String.raw`
window.__hofAudit.action=function(strategy){
 if(S.done)return 'done';
 const bullpen=strategy.endsWith('Bullpen'),usa=strategy.startsWith('USA'),inTarget=usa?['MiLB','MLB'].includes(S.org):S.org==='KBO';
 const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped'));
 const pitching=rows.filter(e=>['vel','ctl','brk'].includes(e.dataset.abilityKey)).sort((a,b)=>S.ab[a.dataset.abilityKey]-S.ab[b.dataset.abilityKey]||['vel','ctl','brk'].indexOf(a.dataset.abilityKey)-['vel','ctl','brk'].indexOf(b.dataset.abilityKey));
 const sta=rows.find(e=>e.dataset.abilityKey==='sta');
 const buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
 const first=e=>e.innerText.split(String.fromCharCode(10))[0],stay=e=>/現在の球団に残留|権利を行使せず残留|宣言残留/.test(first(e));
 const target=e=>{const t=e.innerText;return !/辞退|断る|帰国|NPBへ復帰/.test(first(e))&&(/契約|移籍|オファー/.test(t))&&(usa?/米国プロ組織と契約する|MLB|メジャー|米国.*契約|MiLB|ルーキー|3A|2A|1A/.test(t):/KBO一軍|KBOフューチャース|韓国.*(?:移籍|オファー)/.test(t));};
 let b=(!bullpen&&S.ab.sta<60?sta:null)||pitching[0]||sta;
 b=b||buttons.find(e=>first(e)==='全力投球')||buttons.find(e=>first(e)==='トミー・ジョン手術を受ける')||buttons.find(e=>bullpen?first(e)==='ブルペンに残り、自分の役割を守る':first(e)==='先発へ転向し、ローテを担う');
 if(!b&&inTarget)b=buttons.find(stay);
 if(!b){const offers=buttons.filter(target);b=usa?offers[0]:offers.find(e=>e.innerText.includes('KBO一軍'))||offers[0];}
 b=b||buttons.find(e=>/配分を確定|配分完了|確定|次へ|完了/.test(first(e)))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(first(e)))||buttons.find(e=>!/現役引退|引退を選択|現役を退く/.test(first(e)))||buttons[0];
 if(!b)return 'waiting';window.__hofActions.push({year:S.year,level:S.lv,choice:b.dataset.abilityKey||b.innerText});b.click();return S.done?'done':'action';
};
`;
const match=code.match(/const studyHook=(.+);\nconst instrument=/);assert(match);
let hook=JSON.parse(match[1]).replace('const studyAction=window.__hofAudit.action;',action+'\nconst studyAction=window.__hofAudit.action;');
hook=hook.replace('pendStat:S.pendStat,calls:',"pendStat:S.pendStat,prevD:S.prevD,lastD:S.lastD,teamId:S.orgTeamId,contract:S.ct?{id:S.ct.contractId,start:S.ct.startYear,end:S.ct.endYear,remaining:S.ct.remainingYears}:null,calls:");
replace(match[1],JSON.stringify(hook));
const cases=Array.from({length:10},(_,i)=>({seed:`pitcher-tc-r3-${String((batch-1)*10+i+1).padStart(3,'0')}`,pos:'P',strategy:strategies[batch-1]}));
code=code.replace(/const cases=Array.from\(\{length:100\}[^\n]+/,`const cases=${JSON.stringify(cases)};`);
const start=code.indexOf(' await Promise.all(Array.from({length:4}'),end=code.indexOf(' const data={source:',start);assert(start>=0&&end>start);
const loop=`
 for(const input of cases){const r=await run(input);results.push(r);writeStudy(arg('output'),{commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version:VERSION,results});console.error(r.seed+' '+r.strategy+' '+r.completed+' RNG '+r.calls);if(!r.completed||r.errors.length||r.resources.length){process.exitCode=1;break;}}
 const replay=[];
 if(!process.exitCode){const r=await run(cases[0]),old=results[0];writeStudy(arg('output').replace('.json','-replay.json'),{results:[r]});assert(r.completed&&!r.errors.length&&!r.resources.length,'Replay must retire without errors');assert.deepEqual(r.fullState,old.fullState);assert.deepEqual(r.choiceHistory,old.choiceHistory);assert.deepEqual(r.study,old.study);assert.equal(r.calls,old.calls);replay.push({seed:r.seed,completed:r.completed,fullState:true,choiceHistory:true,allRngValues:true,allActionWindows:true,calls:r.calls});}
`;
code=code.slice(0,start)+loop+code.slice(end);
const sha=createHash('sha256').update(fs.readFileSync(new URL('STRATEGIES.md',import.meta.url))).digest('hex');
replace("observationOnly:true","observationOnly:true,strategyVersion:'r3-v1',strategySha256:"+JSON.stringify(sha)+',batch:'+batch);
// Checkpoint results already exist if a replay assertion fails; do not proceed to next batch.
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

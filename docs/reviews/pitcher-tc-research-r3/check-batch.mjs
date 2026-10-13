import fs from 'node:fs';
import assert from 'node:assert/strict';
import {readStudy} from '../pitcher-tc-research-1119/storage.mjs';
const here=new URL('./',import.meta.url),batch=Number(process.argv[2]);
const d=readStudy(new URL(`batch-${batch}.json`,here)),rr=readStudy(new URL(`batch-${batch}-replay.json`,here));
assert.equal(d.attempts,10);assert.equal(d.failures,0);assert.equal(d.completed,10);assert.equal(d.replay.length,1);
assert.deepEqual(rr.results[0].fullState,d.results[0].fullState);assert.deepEqual(rr.results[0].study,d.results[0].study);assert.deepEqual(rr.results[0].choiceHistory,d.results[0].choiceHistory);
const groups={};for(const l of ['CPBL1','KBO1','NPB1','MLB'])for(const r of ['SP','MR','CL'])groups[l+'/'+r]=0;
const target=d.results[0].strategy.startsWith('USA')?t=>/米国プロ組織と契約する|MLB|メジャー|米国.*契約|MiLB|ルーキー|3A|2A|1A/.test(t)&&/契約|移籍|オファー/.test(t):t=>/KBO一軍|KBOフューチャース|韓国.*(?:移籍|オファー)/.test(t)&&/契約|移籍|オファー/.test(t);
let appearances=0,acceptances=0;
for(const r of d.results){assert(r.completed&&r.fullState.done);assert.equal(r.errors.length,0);assert.equal(r.resources.length,0);assert.equal(r.study.rng.length,r.calls);assert.equal(r.study.actions.length,r.actions);assert.equal(r.choiceHistory.length,r.actions);
 for(const s of r.seasons){assert(r.fullState.log.some(l=>l.y===s.year&&JSON.stringify(l.st)===JSON.stringify(s.st)));if(s.st.G>0&&s.st.IP>0&&s.lv+'/'+s.role in groups)groups[s.lv+'/'+s.role]++;}
 for(const a of r.study.actions){if(a.options.some(target))appearances++;if(target(a.choice))acceptances++;if(a.options.some(t=>t.split('\n')[0]==='全力投球'))assert.equal(a.choice.split('\n')[0],'全力投球');if(a.options.some(t=>t.startsWith('トミー・ジョン手術を受ける')))assert(a.choice.startsWith('トミー・ジョン手術を受ける'));if(r.strategy.endsWith('Bullpen')&&a.options.some(t=>t.startsWith('ブルペンに残り、自分の役割を守る')))assert(a.choice.startsWith('ブルペンに残り、自分の役割を守る'));}
}
const result={batch,commit:d.commit,version:d.version,strategy:d.results[0].strategy,strategySha256:d.strategySha256,completed:10,failures:0,integrity:'PASS',replay:'PASS',targetOptionObservations:appearances,targetAcceptedOperations:acceptances,effectiveSeasons:groups,seconds:d.seconds};
fs.writeFileSync(new URL(`batch-${batch}-validation.json`,here),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));

// D2.1 design-only offline analysis. Never imports/runs the game or draws RNG.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readStudy} from '../pitcher-tc-research-1119/storage.mjs';
const here=new URL('./',import.meta.url),root=new URL('../../../',here),designs=new URL('../../designs/',here);
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const docs=['PITCHER_AWARDS_PHASE1_DESIGN_D2.md','PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md','PITCHER_AWARDS_D2_DECISION_LOG.md'];
const snapshot=new URL('BEFORE_SNAPSHOT.json',here);
if(process.argv.includes('--capture')){
 assert(!fs.existsSync(snapshot),'Do not overwrite original D2 snapshot');
 const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
 const tree={};for(const rel of files)tree[rel]=sha(new URL(rel,root));
 fs.writeFileSync(snapshot,JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version:fs.readFileSync(new URL('docs/src/config.js',root),'utf8'),workingTree:execFileSync('git',['status','--short'],{encoding:'utf8'}),trackedHashes:tree,documents:Object.fromEntries(docs.map(n=>[n,{sha256:sha(new URL(n,designs)),text:fs.readFileSync(new URL(n,designs),'utf8')}]))},null,2));
 console.log('Captured original D2 and dirty working tree without changing any input');process.exit(0);
}
assert(fs.existsSync(snapshot),'Run --capture once before editing the D2 documents');
const started=Date.now(),base=JSON.parse(fs.readFileSync(new URL('PITCHER_AWARDS_D2_ANALYSIS.json',designs))),d=base.activeDerivation;
assert.deepEqual(d.P08Anchors,{W:[12,17],era:[3.2,2.2],IP:[143,150],SO:[155,215],WPCT:[.65,.85]});
assert.deepEqual(d.P08Grid,{minW:13,minIP:143,maxERA:3.2,baseScore:55,godScore:100});
// Candidate list is fixed before scoring: sensitivity points, not fitted to the mobile result.
const profiles=[{id:'D2-BASE',ipMax:150,guarantee:100},{id:'D21-IP180',ipMax:180,guarantee:100},{id:'D21-IP190',ipMax:190,guarantee:100},{id:'D21-IP200',ipMax:200,guarantee:100},{id:'D21-IP190-G95',ipMax:190,guarantee:95},{id:'D21-IP190-G90',ipMax:190,guarantee:90},{id:'D21-IP190-BALANCED',ipMax:190,guarantee:90,minStrongComponents:4}];
const clamp=x=>Math.max(0,Math.min(1,x));
export function evaluate(s,profile,weights){
 const valid=['W','L','era','IP','SO','G'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&Number.isFinite(s.W+s.L)&&s.W+s.L>0;
 if(!valid)return {valid:false,qualified:false,components:null,score:null,basic:false,guaranteed:false,probability:0};
 const v={...s,WPCT:s.W/(s.W+s.L)},anchors={...d.P08Anchors,IP:[143,profile.ipMax]};
 const components=Object.fromEntries(Object.entries(anchors).map(([k,[lo,hi]])=>[k,100*clamp((v[k]-lo)/(hi-lo))]));
 const score=Object.entries(weights).reduce((n,[k,w])=>n+w*components[k],0);
 const qualified=s.level==='NPB1'&&s.role==='SP'&&s.G>0&&s.W>=13&&s.IP>=143&&s.era<=3.2;
 // Analysis-only numerical tolerance; policy boundary remains 55, not a new lower threshold.
 const basic=qualified&&score>=55-1e-10;
 const guaranteed=basic&&score>=profile.guarantee-1e-10&&(!profile.minStrongComponents||Object.values(components).filter(x=>x>=80-1e-10).length>=profile.minStrongComponents);
 const probability=!basic?0:guaranteed?1:Math.min(95,Math.max(30,30+2*(score-55)))/100;
 return {valid,qualified,components,score,basic,guaranteed,probability};
}
const mobile={evidence:'MANUAL_MOBILE_EVIDENCE',version:'1.10.3',seed:'q77bi1jx',year:2039,level:'NPB1',role:'SP',G:26,IP:180.1,W:15,L:7,SO:165,era:2.35,roleEvidence:'USER_CONFIRMED_2039_SP',precision:'Display-rounded ERA, decimal IP as required; not reconstructed ER/outs',limitations:['No choice history','No growth history','No RNG trace','Not v1.11.9 replay','Not a new-award acceptance test']};
const scenarios=[
 ['basic-qualified',{W:13,L:7,era:3.2,IP:143,SO:155,G:28}],
 ['ordinary-excellent',{W:14,L:6,era:2.7,IP:165,SO:180,G:28}],
 ['high-W-worse-ERA',{W:20,L:4,era:3.1,IP:180,SO:190,G:30}],
 ['excellent-ERA-low-W',{W:13,L:8,era:1.6,IP:170,SO:190,G:30}],
 ['high-IP-ordinary-SO',{W:16,L:5,era:2.4,IP:200,SO:160,G:31}],
 ['high-SO-lower-IP',{W:16,L:4,era:2.3,IP:145,SO:250,G:28}],
 ['balanced-elite',{W:18,L:3,era:2.1,IP:190,SO:220,G:30}],
 ['extreme-elite',{W:22,L:2,era:1.5,IP:200,SO:280,G:32}],
 ['low-W-high-score',{W:12,L:0,era:1.4,IP:200,SO:280,G:30}],
 ['low-IP-high-score',{W:20,L:2,era:1.4,IP:142.999,SO:280,G:30}],
 ['ERA-ineligible',{W:20,L:2,era:3.200001,IP:200,SO:280,G:30}],
 ['one-weak-metric',{W:20,L:2,era:1.4,IP:200,SO:209,G:32}]
].map(([id,s])=>({id,evidence:'SYNTHETIC_SCENARIO',...s,level:'NPB1',role:'SP'}));
const sources=base.sources.map(x=>{const file=new URL(x.path,designs);assert.equal(sha(file),x.sha256,'Historical research changed');return {file:fileURLToPath(file),sha256:sha(file),data:readStudy(file),group:x.folder};});
const naturalFolder=new URL('../pitcher-d2-two-seed-natural/',here);
const natural=readStudy(new URL('careers.json',naturalFolder));assert.equal(natural.results.length,8);
const replayFiles=['careers-CPBL-verified','careers-KBO','careers-NPB','careers-MLB'];
const verification=[];
for(const stem of replayFiles){const original=readStudy(new URL(stem+'.json',naturalFolder)),replay=readStudy(new URL(stem+'-replay.json',naturalFolder));assert.equal(original.results.length,2);assert.equal(replay.results.length,2);
 for(let i=0;i<2;i++){const a=original.results[i],b=replay.results[i];assert(a.completed&&b.completed&&!a.failure&&!b.failure);assert.equal(a.errors.length+b.errors.length+a.resources.length+b.resources.length,0);assert.deepEqual(a.fullState,b.fullState);assert.deepEqual(a.choiceHistory,b.choiceHistory);assert.deepEqual(a.study,b.study);assert.equal(a.calls,b.calls);assert.equal(a.calls,a.study.rng.length);assert.equal(a.study.actions.length,a.choiceHistory.length);assert.deepEqual(a,natural.results.find(r=>r.seed===a.seed&&r.targetLeague===a.targetLeague));verification.push({seed:a.seed,target:a.targetLeague,status:'PASS_STORED_ARTIFACT_COMPARISON',calls:a.calls,sourceCommit:original.commit,sourceEngineSha256:original.engineSha256});}
 sources.push({file:fileURLToPath(new URL(stem+'.json',naturalFolder)),sha256:sha(new URL(stem+'.json',naturalFolder)),data:original,group:'two-seed-'+original.targetLeague});
}
const scores=s=>profiles.flatMap(profile=>Object.entries(base.models).map(([model,weights])=>({profile:profile.id,model,...evaluate(s,profile,weights)})));
let pass=0;const test=(name,fn)=>{fn();pass++;};
for(const p of profiles)for(const [m,w]of Object.entries(base.models)){
 const e=s=>evaluate({level:'NPB1',role:'SP',G:30,W:17,L:3,era:2.2,IP:190,SO:215,...s},p,w);
 test(p.id+'/'+m+'/bounds',()=>{for(const val of [0,100000]){const x=e({W:val,L:1,era:val,IP:val,SO:val});assert(x.score>=0&&x.score<=100+1e-10);assert(Object.values(x.components).every(v=>v>=0&&v<=100));}});
 for(const k of ['W','IP','SO'])test(p.id+'/'+m+'/'+k+'-monotonic',()=>{let prev=-1;for(const v of [0,12,13,15,17,143,150,160,190,200,1000]){const x=e({[k]:v});assert(x.score>=prev-1e-10);prev=x.score;}});
 test(p.id+'/'+m+'/ERA-monotonic',()=>{let prev=-1;for(const v of [9.9,3.2,3,2.7,2.2,1.4,0]){const x=e({era:v});assert(x.score>=prev-1e-10);prev=x.score;}});
 test(p.id+'/'+m+'/WP-monotonic',()=>{let prev=-1;for(const l of [100,20,10,5,3,1,0]){const x=e({L:l});assert(x.score>=prev-1e-10);prev=x.score;}});
 test(p.id+'/'+m+'/qualification-gates',()=>{for(const patch of [{W:12},{IP:142.999},{era:3.200001},{role:'MR'},{level:'KBO1'},{G:0}]){const x=e(patch);assert(!x.qualified&&!x.basic&&!x.guaranteed&&x.probability===0);}});
 test(p.id+'/'+m+'/invalid',()=>{for(const k of ['W','L','era','IP','SO','G'])for(const v of [-1,NaN,Infinity,undefined,'15']){const x=e({[k]:v});assert(!x.valid&&x.probability===0);}assert(!e({W:0,L:0}).valid);assert(!e({W:1e308,L:1e308}).valid);assert(e({L:0}).valid);});
 test(p.id+'/'+m+'/endpoints',()=>{const x=e({W:17,L:3,IP:p.ipMax,era:2.2,SO:215});assert(Math.abs(x.score-100)<1e-10&&x.guaranteed);});
 test(p.id+'/'+m+'/55-boundary',()=>{for(const v of [55-1e-7,55,55+1e-7]){const x=e({W:12+5*v/100,L:(12+5*v/100)*(1/(.65+.2*v/100)-1),era:3.2-v/100,IP:143+(p.ipMax-143)*v/100,SO:155+60*v/100});assert(Math.abs(x.score-v)<1e-9);assert.equal(x.basic,v>=55);}});
 test(p.id+'/'+m+'/guarantee-boundary',()=>{for(const v of [p.guarantee-1e-7,p.guarantee,p.guarantee+1e-7]){const x=e({W:12+5*v/100,L:(12+5*v/100)*(1/(.65+.2*v/100)-1),era:3.2-v/100,IP:143+(p.ipMax-143)*v/100,SO:155+60*v/100});assert.equal(x.guaranteed,v>=p.guarantee);}});
 test(p.id+'/'+m+'/decimal-IP',()=>{const x=e({IP:180.1}),y=e({IP:180+1/3});assert.equal(x.components.IP,100*clamp((180.1-143)/(p.ipMax-143)));if(p.ipMax>180.333)assert(x.score<y.score);});
 test(p.id+'/'+m+'/probability',()=>{for(const row of scenarios){const x=e(row);assert(x.probability>=0&&x.probability<=1);assert.equal(x.probability,!x.basic?0:x.guaranteed?1:Math.min(95,Math.max(30,30+2*(x.score-55)))/100);}assert(Math.abs(Object.values(w).reduce((n,x)=>n+x,0)-1)<1e-10);});
}
test('manual-components',()=>{const x=evaluate(mobile,profiles[0],base.models.S1);assert.deepEqual(Object.keys(x.components),['W','era','IP','SO','WPCT']);assert(Math.abs(x.components.W-60)<1e-9);assert(Math.abs(x.components.era-85)<1e-9);assert.equal(x.components.IP,100);assert(Math.abs(x.components.SO-100/6)<1e-9);assert(Math.abs(x.components.WPCT-15.9090909090909)<1e-9);assert(x.qualified);});
const results={status:'DESIGN ONLY; ALL D21 CANDIDATES PROPOSAL',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version:fs.readFileSync(new URL('docs/src/config.js',root),'utf8').match(/VERSION\s*=\s*['"]([^'"]+)/)[1],d2Sha256:sha(new URL('PITCHER_AWARDS_D2_ANALYSIS.json',designs)),toolSha256:sha(new URL(import.meta.url)),numericalTolerance:{epsilon:1e-10,status:'ANALYSIS TOOL ONLY; PRODUCT PRECISION STRATEGY TBD',initialFailure:'Strict score>=55 rejected a theoretical 55 reconstructed as a slightly lower floating value; expectations unchanged, explicit tolerance added'},manualImageSha256:sha(new URL('mobile-q77bi1jx-1.10.3.jpg',here)),profiles,weights:base.models,qualification:d.P08Grid,manual:mobile,manualScores:scores(mobile),manualRoundingSensitivity:[2.345,2.355].map(era=>({era,scores:scores({...mobile,era})})),scenarios:scenarios.map(s=>({...s,scores:scores(s)})),ipPoints:[143,150,160,170,180,190,200].map(IP=>({IP,components:Object.fromEntries([150,180,190,200].map(cap=>[cap,100*clamp((IP-143)/(cap-143))]))})),verification,sources:[],distributions:[],tests:{PASS:pass,FAIL:0,NOT_RUN:['Game Quick/Full','New natural careers/replays','CI/Preview','New award product acceptance']}};
for(const source of sources){results.sources.push({file:path.relative(fileURLToPath(root),source.file).replaceAll('\\','/'),sha256:source.sha256,group:source.group,commit:source.data.commit,version:source.data.version,careers:source.data.results.length});
 const rows=source.data.results.flatMap(r=>r.seasons.filter(s=>s.lv==='NPB1'&&s.role==='SP'&&s.st.G>0&&s.st.IP>0).map(s=>({...s.st,level:s.lv,role:s.role,seed:r.seed,year:s.year})));
 for(const p of profiles)for(const [m,w]of Object.entries(base.models)){const evaluated=rows.map(s=>({...evaluate(s,p,w),seed:s.seed,year:s.year}));results.distributions.push({group:source.group,profile:p.id,model:m,n:rows.length,independentSeeds:new Set(rows.map(s=>s.seed)).size,qualified:evaluated.filter(s=>s.qualified).length,basic:evaluated.filter(s=>s.basic).length,guaranteed:evaluated.filter(s=>s.guaranteed).length,expectedAwards:evaluated.reduce((n,s)=>n+s.probability,0),maxScore:evaluated.length?Math.max(...evaluated.map(s=>s.score)):null,ipSaturated:rows.filter(s=>s.IP>=p.ipMax).length});}
}
const before=JSON.parse(fs.readFileSync(snapshot));results.documentDifferences=docs.map(n=>{const old=before.documents[n].text,now=fs.readFileSync(new URL(n,designs),'utf8');return {file:n,beforeSha256:before.documents[n].sha256,afterSha256:sha(new URL(n,designs)),originalPreserved:now.startsWith(old),addedLines:now.split('\n').length-old.split('\n').length};});
const changes=Object.entries(before.trackedHashes).filter(([rel,hash])=>sha(new URL(rel,root))!==hash).map(([rel])=>rel);results.concurrentTrackedChanges=changes;
results.seconds=(Date.now()-started)/1000;
fs.writeFileSync(new URL('analysis.json',here),JSON.stringify(results,null,2)+'\n');
let md=`# D2.1 沢村賞離線模型比較\n\n設計研究，非產品實作。當前dev ${results.head}，VERSION ${results.version}；八條自然生涯基準仍為0fd13c7532fd03da136c72ef64e9890858cfb81e／1.11.9。目前工作樹有COPY-01-P1/TRAIT-SMALLSCHOOL-C平行修改；本分析只讀既存資料，不用目前未提交引擎重新採樣。工具SHA256 ${results.toolSha256}。\n\n## 有效D2與候選\n\nCURRENT PROPOSAL：W12→17、ERA3.20→2.20、IP143→150、SO155→215、WP.650→.850，component=100×clamp((x−low)/(high−low),0,1)，ERA分母負。S1/S2/S3原權重保留。入口NPB1/SP/G>0、IP>0，W≥13/IP≥143/ERA≤3.2、五項/L有效非負且W+L>0；分數55才有機會，100保證，未保證p=clamp(30+2(score−55),30,95)%；入口未過p0。權重、55、100、曲線仍PROPOSAL，不稱正式批准。Q_A/B/C為SUPERSEDED。\n\n候選事先固定，不為手機分數反向擬合：IP150對照、180（合格高工作量）、190（既有唯讀公式分析的極端能力中心參考）、200（接近基礎極端上端）；均保留入口143、其他四項尺度、三組權重及基本55。另以IP190比較保證100/95/90和「score≥90且至少四component≥80」；這些是敏感性值不是已觀測分位或正式沢村規則。沒有新增權重候選，避免同時改尺度/權重無法辨因。\n\n新獎独立固定draw／主R槽／P07必MVP／P02原資格／大獎待遇全不變；本工具不執行任何draw，Σp不是實際得獎。P08不組成三冠、不自動保證MVP，與P02可同年獨立成功。四聯盟皆停止新發舊賞，以P02原槽承接，P08只NPB，已由使用者明確確認；歷史舊名及大獎待遇保留。\n\n## IP標準化\n\n|十進位IP|滿分150|滿分180|滿分190|滿分200|\n|---:|---:|---:|---:|---:|\n`;
const f=v=>v===null?'N/A':Number(v).toFixed(4);
for(const r of results.ipPoints)md+=`|${r.IP}|${Object.values(r.components).map(f).join('|')}|\n`;
md+='\n原模型150即100，180和200完全無差別，數學飽和已確認；是否設計過早是價值判斷，不是程式Bug。改上限不改名義權重，但擴大有效梯度，對150～cap同球季只會降分，不會提高機率；需和保證降線分開比較。低IP其餘強項的補償仍存在，不能將IP當唯一大獎條件。\n\n## 手機證據與前後比較\n\nMANUAL_MOBILE_EVIDENCE／VERSION_1.10.3／SEED_q77bi1jx。來源[原圖](mobile-q77bi1jx-1.10.3.jpg)；2039：NPB一軍、SP（USER_CONFIRMED；不是由退休角色反推）、G26/W15/L7/IP180.1/SO165/ERA2.35；WP=15/22。有效成績與五項資料完整、分母22>0，符合當前P08入口。歷史honors顯示舊最優秀投手與SO，不等P08；數值同時達P01/P02/P03/P04基本、均未到保證，不補發三冠或舊MVP。無完整操作／成長／RNG，不稱1.11.9重播PASS。IP180.1照十進位，不轉180+1/3；ERA僅顯示兩位，精算結果是display-based estimate，JSON另存ERA[2.345,2.355)敏感性上下界（上界用極限參考），不補ER。\n\nD2 component W60、ERA85、IP100、SO16.6667、WP15.9091。\n\n|候選|權重|IP component|總分|基本機率%|保證？|\n|---|---|---:|---:|---:|---|\n';
for(const r of results.manualScores)md+=`|${r.profile}|${r.model}|${f(r.components.IP)}|${f(r.score)}|${f(r.probability*100)}|${r.guaranteed?'YES':'NO'}|\n`;
md+='\n2039達基本資格不意味保證。在IP180保留D2分數；IP190/200降低工作量得分，可能使S1掉出55，而S2/S3依ERA與工作量權重仍有機會。此差異是模型權重／尺度作用，不是合理玩家一定應得獎的證明。\n\n## 人工合理球季敏感性\n\n全部SYNTHETIC_SCENARIO，不是自然高能力實測。分數用連續數值模型測試；不反推球員能力、沒有重擲或改S。\n\n|案例|W-L|ERA|IP|SO|WP|D2 S1/S2/S3|IP190 S1/S2/S3|\n|---|---|---:|---:|---:|---:|---|---|\n';
for(const s of results.scenarios)md+=`|${s.id}|${s.W}-${s.L}|${s.era}|${s.IP}|${s.SO}|${f(s.W/(s.W+s.L))}|${s.scores.filter(x=>x.profile==='D2-BASE').map(x=>f(x.score)).join('/')}|${s.scores.filter(x=>x.profile==='D21-IP190').map(x=>f(x.score)).join('/')}|\n`;
md+='\n### 保證條件與候選機率（S3，其他權重完整存JSON）\n\n以下保持IP190，隔離保證條件影響；格內為候選機率百分比／是否保證。未達入口或未到55者一律0%，不因其他指標高破例。\n\n|合成案例|IP190分數|G100|G95|G90|G90+四項80|\n|---|---:|---|---|---|---|\n';
for(const s of results.scenarios){const a=s.scores.filter(x=>x.model==='S3'&&['D21-IP190','D21-IP190-G95','D21-IP190-G90','D21-IP190-BALANCED'].includes(x.profile));md+=`|${s.id}|${f(a[0].score)}|${a.map(x=>f(x.probability*100)+'%/'+(x.guaranteed?'YES':'NO')).join('|')}|\n`;}
md+='\n### 同球季IP變更對總分的影響（S3）\n\n保持其他四項同一ordinary-excellent合成球季，IP143/150/160/170/180/190/200逐點比較。IP名義權重始終25%，差異只由尺度產生；不是新增抽選或自然成績變化。\n\n|十進位IP|150滿分總分|180滿分總分|190滿分總分|200滿分總分|\n|---:|---:|---:|---:|---:|\n';
for(const IP of [143,150,160,170,180,190,200]){const s={...scenarios.find(x=>x.id==='ordinary-excellent'),IP};md+=`|${IP}|${profiles.slice(0,4).map(p=>f(evaluate(s,p,base.models.S3).score)).join('|')}|\n`;}
md+='\n入口反例即使高分p=0。五項均衡頂尖若全component滿分即可100（如合成18/3、ERA2.1、IP190、SO220）；數學可達不等於自然可達。極高一項受clamp，不能補足另一項不足：100且正權重要求五項全滿。例SO209即其他四項100，原S1/S2/S3也不足100。G95允許小幅弱項仍保證，G90更容易且可能允許某component50（S3若IP50而其他100=87.5，仍未達90；SO約33.33而其他100則90）；四項≥80額外條件可拒少數強項主導，但新增離散判定與解釋成本。G90/95把原cap95%區間改100%，有跳點；不是只調顯示，未批准不得上線。基本資格始終不可越過。\n\n## 既存自然資料核對\n\n8條生涯原始JSON與全部trace存在，8重播儲存artifact的S／choices／R值與次數逐一深比較PASS。本次沒有再次開遊戲重播，不把離線比較當新版本E2E。首次沙箱阻擋屬環境失敗，與成功8條分開。CPBL三項基本同季tob8/q8、KBOtob1/q5；NPB目標兩路線24有效一軍季（SP22）無P08入口；MLBtob0季/q8季未達門檻。沒有REPORT_ONLY項目。\n\n四輪和各目標策略分開；同seed多季相關、目標不同也非相同選項，不合併一般玩家機率。手機舊版不混入1.11.9樣本。所有候選既存NPB研究P08資格仍0，Σp與保證0；因此不能靠這些自然資料選G90/95/100，也不能說95一定過易或100不可達。詳JSON逐來源/模型 n與IP飽和數。\n\n|來源組|NPB SP季|獨立Seed|P08入口|D2-IP飽和季|IP190飽和季|\n|---|---:|---:|---:|---:|---:|\n';
for(const group of [...new Set(results.distributions.map(x=>x.group))]){const a=results.distributions.find(x=>x.group===group&&x.profile==='D2-BASE'&&x.model==='S1'),b=results.distributions.find(x=>x.group===group&&x.profile==='D21-IP190'&&x.model==='S1');md+=`|${group}|${a.n}|${a.independentSeeds}|${a.qualified}|${a.ipSaturated}|${b.ipSaturated}|\n`;}
md+='\n## 推薦及取捨（全是PROPOSAL）\n\n- 保持基本入口、55及其他四component尺度不動；不因兩條NPB路線失敗降低門檻。NPB舊版15勝/180.1/165是高成績可達實績，與新版路線不同不矛盾。\n- 優先審IP190：相較180保留更多高工作量辨識，相較200不把接近既存基礎極端的200當每名頂尖必需值。180较温和、200更严格，150省兼容變動但保留飽和問題。190是設計參考不是經統計證明的最佳位置。\n- S3沿原始候選作審查起點：WP僅5%減少W重複評價；S2更看ERA/IP，S1簡明但兩勝利指標40%。不自行批准權重。\n- 保證95可作優先討論候選，容許一項略弱，較90保守；但自然合格樣本不足，不建議現在直接替換100。保留D2原proposal作對照，90及四項80條件僅敏感性。\n- IP延後讓同季得分/機率不增，G95降線只增加高分已合格區的保證；兩者可能抵消，不能從手機單例評分推整體獲獎率。新增獎項與待遇日後可能影響S/薪资/MVP/特性/HOF與後續分支，本次均未測或實作。\n\n## 驗證與限制\n\n`node docs/reviews/pitcher-awards-d21/analyze.mjs --capture` 保存修改前三份D2全文與平行工作樹hash；正常分析只寫本目錄analysis.json與本比較報告，不重新生成舊D2/四輪資料。`node --check .../analyze.mjs`及 `node .../analyze.mjs` 檢查 component/score bounds、五項單調性、ERA方向、入口/非法/缺值/0分母/0敗、55與guarantee±1e-7、浮點端點、十進位IP；連續分數邊界用合成連續W測數學工具，不聲稱合法整數W自然球季。\n\n';
md+=`離線測試PASS ${pass}、FAIL0；本次計算耗時${results.seconds.toFixed(3)}秒。8組儲存重播artifact驗證PASS，非新瀏覽器執行。Quick/Full/CI/Preview/新採樣/產品獎項驗收NOT_RUN，因本次不修改產品且禁止新實作。數值表及完整來源/模型/測試結果見[analysis.json](pitcher-awards-d21/analysis.json)，修改前全文見[BEFORE_SNAPSHOT.json](pitcher-awards-d21/BEFORE_SNAPSHOT.json)。\n\n`;
md+='首次離線測試exit1：數學55分重組出浮點略低值，strict比較拒絕基本資格。分析工具明加1e-10端點容差，預期55線與±1e-7反例不變；這不是產品Bug、未修改遊戲，也沒有把FAIL預期改為PASS。產品的取整/容差策略仍TBD。三份D2原文保持、只追加本次章節，before/after SHA與增加行數見JSON documentDifferences；snapshot包含作業前平行修改，不稱工作樹乾淨。\n\n';
md+='需批准：IP滿分180/190/200或保持150；S1/2/3；基本55（保持候選非新批准）；G100/95/90/四強項條件；機率斜率/取整/浮點策略；獨立draw技術仍TBD。四聯盟舊賞处理已APPROVED，不重開。未Commit/Push/merge/deploy。\n';
md+='\n## 修改前後差異與資料清單\n\n三份D2採追加章節、不刪除旧計算；完整原文備份用於差異檢查，不是另立正式規格或覆寫D1。\n\n';
for(const x of results.documentDifferences)md+=`- ${x.file}：新增${x.addedLines}行、原文保留=${x.originalPreserved}；before ${x.beforeSha256}，after ${x.afterSha256}。\n`;
md+='\n原始資料來源（全部只讀，trace由storage校验SHA及筆數）：\n\n';
for(const x of results.sources)md+=`- ${x.file}：${x.version}/${x.commit}，${x.careers}條；SHA256 ${x.sha256}。\n`;
md+=`- 手機圖片 SHA256 ${results.manualImageSha256}；複製原圖未編輯，使用者確認SP，沒有JSON/trace，不列REPORT_ONLY自然驗收。\n`;
// Link paths are relative to docs/reviews/ where the comparison is emitted.
md=md.replace('[原圖](mobile-q77bi1jx-1.10.3.jpg)','[原圖](pitcher-awards-d21/mobile-q77bi1jx-1.10.3.jpg)');
fs.writeFileSync(new URL('../PITCHER_AWARDS_D21_MODEL_COMPARISON.md',here),md);
console.log(JSON.stringify({PASS:pass,FAIL:0,artifactReplays:verification.length,sources:results.sources.length,seconds:results.seconds,manual:results.manualScores.filter(x=>['D2-BASE','D21-IP190'].includes(x.profile)),concurrentTrackedChanges:changes},null,2));

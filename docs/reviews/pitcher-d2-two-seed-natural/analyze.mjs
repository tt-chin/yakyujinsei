// Offline threshold assessment only. No game evaluation or award/RNG draws.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readStudy} from '../pitcher-tc-research-1119/storage.mjs';
const here=new URL('./',import.meta.url),designFile=new URL('../../designs/PITCHER_AWARDS_D2_ANALYSIS.json',here);
const design=JSON.parse(fs.readFileSync(designFile)),d=design.activeDerivation;
const levels={CPBL:'CPBL1',KBO:'KBO1',NPB:'NPB1',MLB:'MLB'};
const files=['careers-CPBL-verified.json','careers-KBO.json','careers-NPB.json','careers-MLB.json'];
const datasets=files.map(f=>readStudy(new URL(f,here)));
assert.equal(new Set(datasets.map(x=>x.commit)).size,1);assert.equal(new Set(datasets.map(x=>x.engineSha256)).size,1);
const clamp=x=>Math.max(0,Math.min(1,x));
const wp=s=>Number.isFinite(s.W)&&Number.isFinite(s.L)&&s.W>=0&&s.L>=0&&s.W+s.L>0?s.W/(s.W+s.L):null;
const grade=(basic,guarantee)=>({basic:!!basic,guarantee:!!guarantee});
function assess(row,league){
 const s=row.st,t=d.native[league],w=d.P01Thresholds[league],rate=wp(s);
 const a={P01:grade(s.W>=w.basic,s.W>=w.guarantee),P02:grade(row.role==='SP'&&s.IP>=t.g&&s.era<=t.era[0],row.role==='SP'&&s.IP>=Math.max(t.g,150)&&s.era<=t.era[1]),P03:grade(s.SO>=t.so[0],s.SO>=t.so[1]),P04:['NPB','KBO'].includes(league)?grade(rate!==null&&s.W>=d.P04Thresholds.minimumWins[league]&&rate>=d.P04Thresholds.basic,rate!==null&&s.W>=d.P04Thresholds.minimumWins[league]&&rate>=d.P04Thresholds.guarantee):{status:'N/A'},P05:grade(row.role==='CL'&&s.SV>=22,row.role==='CL'&&s.SV>=35),P06:grade(row.role==='MR'&&(s.HLD||0)>=18,row.role==='MR'&&(s.HLD||0)>=30)};
 a.P07={status:'STATISTICAL POTENTIAL ONLY; new award not implemented',basicCoqualification:['P01','P02','P03'].every(k=>a[k].basic),allGuarantees:['P01','P02','P03'].every(k=>a[k].guarantee)};
 a.P08={status:league==='NPB'&&row.role==='SP'?'PROVISIONAL MODELS; NOT AWARDED':'N/A'};
 if(league==='NPB'&&row.role==='SP'){
  const v={...s,WPCT:rate},valid=['W','L','era','IP','SO'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&rate!==null;
  const qualified=valid&&s.W>=d.P08Grid.minW&&s.IP>=d.P08Grid.minIP&&s.era<=d.P08Grid.maxERA;
  a.P08.qualified=qualified;a.P08.models={};
  for(const [name,weights]of Object.entries(design.models)){
   const score=valid?Object.entries(weights).reduce((n,[k,weight])=>n+100*weight*clamp((v[k]-d.P08Anchors[k][0])/(d.P08Anchors[k][1]-d.P08Anchors[k][0])),0):null;
   a.P08.models[name]={score,...grade(qualified&&score>=d.P08Grid.baseScore,qualified&&score>=d.P08Grid.godScore-1e-10)};
  }
 }
 return {year:row.year,age:row.age,league,level:row.lv,role:row.role,stats:s,winRate:rate,thresholds:a};
}
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const result={commit:datasets[0].commit,version:datasets[0].version,engineSha256:datasets[0].engineSha256,designSha256:hash(designFile),tools:Object.fromEntries(['run.mjs','analyze.mjs','STRATEGIES.md','../pitcher-tc-research/research.mjs','../pitcher-tc-research-1119/run.mjs','../pitcher-tc-research-1119/storage.mjs'].map(p=>[p,hash(new URL(p,here))])),interpretation:'activeDerivation only; eligibility is not an actual award; no extra RNG; different route strategies can diverge',environment:datasets[0].environment,careers:[],replays:datasets.flatMap(x=>x.replay),executionSeconds:datasets.reduce((n,x)=>n+x.seconds,0)};
assert.equal(hash(new URL('../../src/engine/game.js',here)),result.engineSha256);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),result.commit);
assert.equal(execFileSync('git',['diff','HEAD','--name-only'],{encoding:'utf8'}).trim(),'','No tracked production/prior research modifications');
for(const data of datasets)for(const r of data.results){
 assert(r.completed&&!r.failure&&!r.errors.length&&!r.resources.length);
 assert.equal(r.calls,r.study.rng.length);assert.equal(r.choiceHistory.length,r.study.actions.length);
 const rows=r.seasons.filter(s=>s.pos==='P'&&s.st.G>0&&s.st.IP>0&&Object.values(levels).includes(s.lv)).map(s=>assess(s,Object.keys(levels).find(l=>levels[l]===s.lv)));
 const target=rows.filter(s=>s.league===r.targetLeague);
 const counts={};for(const k of ['P01','P02','P03','P04','P05','P06'])counts[k]=k==='P04'&&!['NPB','KBO'].includes(r.targetLeague)?{status:'N/A'}:{basic:target.filter(s=>s.thresholds[k].basic).length,guarantee:target.filter(s=>s.thresholds[k].guarantee).length};
 counts.P07={basicCoqualification:target.filter(s=>s.thresholds.P07.basicCoqualification).length,allGuarantees:target.filter(s=>s.thresholds.P07.allGuarantees).length,actualAward:'NOT IMPLEMENTED'};
 counts.P08=r.targetLeague==='NPB'?Object.fromEntries(Object.keys(design.models).map(m=>[m,{qualified:target.filter(s=>s.thresholds.P08.qualified).length,basic:target.filter(s=>s.thresholds.P08.models?.[m].basic).length,guarantee:target.filter(s=>s.thresholds.P08.models?.[m].guarantee).length}])):{status:'N/A'};
 result.careers.push({seed:r.seed,targetLeague:r.targetLeague,strategy:r.strategy,completed:r.completed,age:r.fullState.age,retirementReason:r.retirementReason,calls:r.calls,actions:r.actions,levelsVisited:[...new Set(r.seasons.map(s=>s.lv))],targetEffectiveSeasons:target.length,targetSampleStatus:target.length?'OBTAINED':'NO TARGET FIRST-TEAM SAMPLE',roles:Object.fromEntries(['SP','MR','CL'].map(role=>[role,target.filter(s=>s.role===role).length])),targetThresholdCounts:counts,actualCurrentHonors:r.fullState.honors,allEffectiveFirstTeamSeasons:rows});
}
assert.equal(result.careers.length,8);assert.equal(result.replays.length,8);assert(result.replays.every(r=>r.status==='PASS'));
// Keep original trace references: duplicate seeds across targets must not share filenames.
const packed=datasets.flatMap((_,i)=>JSON.parse(fs.readFileSync(new URL(files[i],here))).results);
fs.writeFileSync(new URL('careers.json',here),JSON.stringify({commit:result.commit,version:result.version,results:packed}));
assert.equal(readStudy(new URL('careers.json',here)).results.length,8);
fs.writeFileSync(new URL('analysis.json',here),JSON.stringify(result,null,2)+'\n');
let md=`# D2：兩個 Seed、四個目標聯盟自然生涯\n\n受驗 dev SHA：${result.commit}；VERSION ${result.version}。遊戲引擎 SHA256：${result.engineSha256}。D2分析檔 SHA256：${result.designSha256}。測試使用本機檔案，不是 Cloudflare Preview。\n\n## 方法與結論界線\n\n策略於執行前登記於 [STRATEGIES.md](STRATEGIES.md)。每個Seed各跑CPBL/KBO/NPB/MLB目標自然路線，投手SP優先，固定全力/TJ手術；從高中開始，以真實選項操作，不強制聯盟、能力或角色。目標優先不同可使同Seed選擇與RNG分支不同，不稱相同操作条件。沒有降低D2門檻。\n\n8條正常退休，遊戲失敗0；另8條完整重播PASS，完整S、選擇、全部RNG值與次數、逐操作觀測一致。Console error與JS/CSS HTTP錯誤均0。環境：${JSON.stringify(result.environment)}，四批含重播總耗時${result.executionSeconds.toFixed(3)}秒。首次沙箱嘗試網路被拒絕、未開始遊戲，留在 [careers-CPBL.json](careers-CPBL.json)，不列作自然生涯失敗或PASS；取得沙箱外執行授權後重跑於CPBL-verified。\n\n## 目標聯盟結果\n\n每項數字為基本／保證門檻達成球季數，不是抽選獲獎數。P04僅NPB/KBO；P02限SP、P05限CL、P06限MR；P07三項同年同聯盟統計合格仍不代表實際三冠；P08為待審模型。\n\n`;
for(const r of result.careers){
 md+=`### ${r.seed} → ${r.targetLeague}\n\n- 正常退休：${r.age}歲；RNG ${r.calls}次；操作${r.actions}次。經過階級：${r.levelsVisited.join(' → ')}（首次出現順序，不是完整移籍年表）。\n- 目標有效一軍${r.targetEffectiveSeasons}季；SP/MR/CL=${Object.values(r.roles).join('/')}；${r.targetSampleStatus}。\n- `+Object.entries(r.targetThresholdCounts).filter(([k])=>!['P07','P08'].includes(k)).map(([k,v])=>`${k} ${v.status||`${v.basic}/${v.guarantee}`}`).join('；')+'。\n';
 md+=`- P07統計三項同時達基本${r.targetThresholdCounts.P07.basicCoqualification}季、全部保證${r.targetThresholdCounts.P07.allGuarantees}季。新P01/P07未實作，不宣稱取得投手三冠王。\n- P08：${JSON.stringify(r.targetThresholdCounts.P08)}。\n\n`;
 const target=r.allEffectiveFirstTeamSeasons.filter(s=>s.league===r.targetLeague);
 if(target.length)md+=`最高W=${Math.max(...target.map(s=>s.stats.W))}，最高IP=${Math.max(...target.map(s=>s.stats.IP)).toFixed(3)}，最高SO=${Math.max(...target.map(s=>s.stats.SO))}，最低ERA=${Math.min(...target.map(s=>s.stats.era)).toFixed(3)}。各最大／最小可能出自不同年度，不合併成虛構最佳球季。\n\n`;
 else md+='沒有目標一軍有效成績，門檻結論為未驗證，不把0次達標解讀為不能達成。\n\n';
 md+='|年度|角色|W|L|ERA（原值取3位）|IP（原生十進位）|SO|SV|HLD|WP|達基本|達保證|\n|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|\n';
 for(const row of target){const s=row.stats,keys=['P01','P02','P03','P04','P05','P06'];md+=`|${row.year}|${row.role}|${s.W}|${s.L}|${s.era.toFixed(3)}|${s.IP.toFixed(3)}|${s.SO}|${s.SV}|${s.HLD??'DATA GAP'}|${row.winRate===null?'N/A':row.winRate.toFixed(3)}|${keys.filter(k=>row.thresholds[k].basic).join(', ')||'—'}|${keys.filter(k=>row.thresholds[k].guarantee).join(', ')||'—'}|\n`;}
 md+='\n';
}
md+='## 保存及重現\n\n[careers.json](careers.json) 聚合8條完整原始生涯；四批原檔保留最終S、全部主RNG值、年度原生st、實際honors與選擇歷史。動作視窗位於各原檔參照的 traces/，讀取時驗證SHA256與筆數。每批 `-replay.json` 保存兩條重播原始資料，無相同Seed跨聯盟覆寫。 [analysis.json](analysis.json) 保存全部實際經過的一軍聯盟逐年D2判定、P08各模型分數與現行實際honors。沒有推算缺失HLD/HP或補造獎項。\n\n命令：`node docs/reviews/pitcher-d2-two-seed-natural/run.mjs --target=<CPBL|KBO|NPB|MLB> --output=<本研究對應JSON> --playwright=<外部Playwright>`；四批均exit0。初次受限環境exit1保留為環境失敗。`node docs/reviews/pitcher-d2-two-seed-natural/analyze.mjs` 重新生成離線門檻判定與報告。\n\n## 限制與停止\n\n只有兩名獨立Seed，各路線及同人生多季高度相關；不估一般玩家得獎率，也不據此定案或降門檻。P01/P04新增抽選、P07及P08仍未實作；達基本僅表示有資格進入候選抽選，保證線僅是D2設計統計判定。P08權重／55分／概率仍待批准。現行最優秀投手賞的honors保留原名，不轉寫新名或追加歷史獎項。\n\n這是研究工具與資料變更，未修改遊戲、舊研究、正式規格或版本；未執行Quick/Full、CI、Preview、實機畫面驗收，不冒稱通過。研究未更動產品／回歸測試，採語法、原始資料完整性、每案例全生涯重播與門檻分析驗證，不無理由執行全部遊戲測試。完成8條後停止，本任務沒有提交、推送或公開。\n';
fs.writeFileSync(new URL('RESEARCH_REPORT.md',here),md);
console.log(JSON.stringify(result.careers.map(({seed,targetLeague,targetEffectiveSeasons,targetThresholdCounts})=>({seed,targetLeague,targetEffectiveSeasons,targetThresholdCounts})),null,2));

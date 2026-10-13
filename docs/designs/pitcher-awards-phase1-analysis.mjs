// Offline design appendix only. Reads sealed research; does not import the engine or draw RNG.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const here=new URL('./',import.meta.url);
const folders=['pitcher-tc-research','pitcher-tc-research-1119','pitcher-tc-research-r3','pitcher-tc-research-r4'];
const levels={CPBL:'CPBL1',KBO:'KBO1',NPB:'NPB1',MLB:'MLB'},roles=['SP','MR','CL'];
const baseSO={CPBL:[130,180],KBO:[156,216],NPB:[155,215],MLB:[175,240]};
export const candidates={
 A:{era:[3.5,2.5],W:{CPBL:[8,13],KBO:[10,15],NPB:[10,15],MLB:[12,17]},IP:{CPBL:100,KBO:120,NPB:120,MLB:140},soFactor:[.85,.9],SV:[18,30],HLD:[14,25],WP:[.60,.80],minW:{CPBL:8,KBO:8,NPB:10,MLB:10}},
 B:{era:[3.2,2.2],W:{CPBL:[10,15],KBO:[12,17],NPB:[12,17],MLB:[14,19]},IP:{CPBL:120,KBO:144,NPB:143,MLB:162},soFactor:[1,1],SV:[22,35],HLD:[18,30],WP:[.65,.85],minW:{CPBL:10,KBO:10,NPB:13,MLB:12}},
 C:{era:[2.8,1.8],W:{CPBL:[12,17],KBO:[14,19],NPB:[14,19],MLB:[16,21]},IP:{CPBL:120,KBO:144,NPB:143,MLB:162},soFactor:[1.1,1.1],SV:[28,40],HLD:[22,35],WP:[.70,.90],minW:{CPBL:12,KBO:12,NPB:13,MLB:14}},
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sum=a=>a.reduce((n,v)=>n+v,0);
function quant(a,q){const p=(a.length-1)*q,i=Math.floor(p);return a[i]+(a[Math.ceil(p)]-a[i])*(p-i);}
function distribution(values,total){const a=values.filter(Number.isFinite).sort((a,b)=>a-b);return {n:a.length,missing:total-a.length,...(a.length?{mean:sum(a)/a.length,median:quant(a,.5),p75:quant(a,.75),p90:quant(a,.9),p95:quant(a,.95),min:a[0],max:a.at(-1)}:{status:'DATA GAP / NO SAMPLE'})};}
function probability(s,lg,plan,id){const t=s.st;
 if(id==='P01'){const [b,g]=plan.W[lg];return !Number.isFinite(t.W)?null:t.W<b?{qualified:true,basic:false,god:false,p:0}:{qualified:true,basic:true,god:t.W>=g,p:t.W>=g?1:clamp(30+8*(t.W-b),30,95)/100};}
 if(id==='P02'){const [b,g]=plan.era,ip=plan.IP[lg],qualified=Number.isFinite(t.IP)&&t.IP>=ip;return !Number.isFinite(t.era)?null:{qualified,basic:qualified&&t.era<=b,god:qualified&&t.era<=g,p:!qualified||t.era>b?0:t.era<=g?1:clamp(30+Math.round((b-t.era)*35+(t.IP-ip)*.4),30,95)/100};}
 if(id==='P03'){const [b,g]=baseSO[lg].map((x,i)=>Math.round(x*plan.soFactor[i]));return !Number.isFinite(t.SO)?null:{qualified:true,basic:t.SO>=b,god:t.SO>=g,p:t.SO<b?0:t.SO>=g?1:clamp(25+Math.round((t.SO-b)*1.2),25,95)/100};}
 if(id==='P04'){if(!Number.isFinite(t.W)||!Number.isFinite(t.L))return null;const qualified=t.W+t.L>0&&t.W>=plan.minW[lg],rate=t.W+t.L>0?t.W/(t.W+t.L):null,[b,g]=plan.WP;return{qualified,basic:qualified&&rate>=b,god:qualified&&rate>=g,p:!qualified||rate<b?0:rate>=g?1:clamp(25+Math.round((rate-b)*150),25,95)/100};}
 const field=id==='P05'?'SV':'HLD',[b,g]=plan[field],qualified=s.role===(id==='P05'?'CL':'MR');
 if(!Number.isFinite(t[field]))return null;
 return{qualified,basic:qualified&&t[field]>=b,god:qualified&&t[field]>=g,p:!qualified||t[field]<b?0:t[field]>=g?1:clamp(28+(t[field]-b)*(id==='P05'?5:4),28,95)/100};
}
const protectedPaths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const snapshots=protectedPaths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(new URL('../../'+p,here))).digest('hex')]);
const datasets=folders.map(folder=>{const path=new URL('../reviews/'+folder+'/careers.json',here),raw=fs.readFileSync(path),j=JSON.parse(raw);return {folder,path:'../reviews/'+folder+'/careers.json',sha256:crypto.createHash('sha256').update(raw).digest('hex'),commit:j.commit,version:j.version,attempts:j.results.length,completed:j.results.filter(r=>r.completed).length,failures:j.results.filter(r=>!r.completed).length,results:j.results};});
const groups=[];
for(const d of datasets)for(const [league,level]of Object.entries(levels))for(const role of roles){
 const rows=d.results.flatMap(r=>r.seasons.filter(s=>s.lv===level&&s.role===role&&s.st.G>0&&s.st.IP>0).map(s=>({...s,seed:r.seed}))),n=rows.length;
 assert.equal(new Set(rows.map(s=>s.seed+':'+s.year+':'+s.lv)).size,n);
 const fields=Object.fromEntries(['W','L','era','IP','SO','SV','HLD'].map(k=>[k,distribution(rows.map(s=>s.st[k]),n)]));
 fields.WPCT=distribution(rows.map(s=>Number.isFinite(s.st.W)&&Number.isFinite(s.st.L)&&s.st.W+s.st.L>0?s.st.W/(s.st.W+s.st.L):null),n);
 const plans=Object.fromEntries(Object.entries(candidates).map(([name,p])=>{const rates=Object.fromEntries(['P01','P02','P03','P04','P05','P06'].map(id=>{const a=rows.map(s=>probability(s,league,p,id)),valid=a.filter(Boolean);return[id,{n,known:valid.length,missing:n-valid.length,qualified:valid.filter(v=>v.qualified).length,basic:valid.filter(v=>v.basic).length,guarantee:valid.filter(v=>v.god).length,expectedAwards:sum(valid.map(v=>v.p)),expectedPerSeason:valid.length?sum(valid.map(v=>v.p))/valid.length:null,basicSeeds:[...new Set(rows.filter((s,i)=>a[i]?.basic).map(s=>s.seed))]}];}));
 const joint=rows.map(s=>['P01','P02','P03'].map(id=>probability(s,league,p,id)?.p??0).reduce((a,b)=>a*b,1));
 return[name,{...rates,P07:{n,possibleSeasons:joint.filter(v=>v>0).length,expectedAwardsIndependentDrawModel:sum(joint),expectedPerSeason:n?sum(joint)/n:null}}];}));
 groups.push({round:d.folder,league,role,n,independentSeeds:[...new Set(rows.map(s=>s.seed))],independentSeedCount:new Set(rows.map(s=>s.seed)).size,fields,plans,HP:{status:'DATA GAP',reason:'No explicit reliefWins / HP; not manufactured from W+HLD'}});
}
const output={status:'DESIGN CANDIDATES — NOT APPROVED',date:'2026-10-13',basis:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),toolSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL(import.meta.url))).digest('hex'),method:'Effective season: first-team level, G>0, IP>0. Per round separately; quantiles linear interpolation (n-1)q. Correlated seasons, no independence/CI claim. Candidate rates are offline expectations, not actual awards or population probabilities.',candidates,sources:datasets.map(({results,...rest})=>rest),groups};
fs.writeFileSync(new URL('PITCHER_AWARDS_PHASE1_ANALYSIS.json',here),JSON.stringify(output,null,2)+'\n');
let md='# 投手個人獎項第一階段：原始資料分析附錄\n\n候選值未批准。由 pitcher-awards-phase1-analysis.mjs 離線計算；沒有遊戲引擎匯入、主 RNG 或新 Seed。四輪分開、不以球季數充當獨立玩家數。每欄 n/欠缺數附於 JSON；HP／救援勝投欠缺不推算。P06為 HLD 簡化方案，不是正式 HP；P04 的 CPBL／MLB只是原創方案試算，非正式存在的獎項。\n\n分位採線性插值 (n−1)q，IP為十進位局數。ERA高分位是差的一端。預期數=各季 p 相加；三冠=p01×p02×p03，僅獨立獎項抽選模型，不證明實際有限哈希序列獨立。所有達標數的分母為該組有效季；零樣本機率為 null，不寫0%。同一 Seed 多季相關、策略偏置、少量尾部樣本都不支持正式統計定案。\n\n';
const fmt=v=>v==null?'N/A':Number(v).toFixed(3);
for(const d of datasets){md+=`## ${d.folder} / ${d.version}\n\n受驗 SHA ${d.commit}；${d.completed}/${d.attempts} 完成、${d.failures} 失敗。原資料 SHA256 ${d.sha256}。\n\n`;
 for(const g of groups.filter(g=>g.round===d.folder)){md+=`### ${g.league}/${g.role}：${g.n} 季 / ${g.independentSeedCount} Seed\n\n`;
 for(const [k,f]of Object.entries(g.fields))md+=`- ${k}（n=${f.n}、missing=${f.missing}）：平均 ${fmt(f.mean)}／中位 ${fmt(f.median)}／P75 ${fmt(f.p75)}／P90 ${fmt(f.p90)}／P95 ${fmt(f.p95)}／最小 ${fmt(f.min)}／最大 ${fmt(f.max)}。\n`;
 md+='- HP／救援勝投：DATA GAP；不將角色快照冒充逐登板勝利來源。\n\n';
 for(const [name,p]of Object.entries(g.plans)){md+=`#### ${name} 候選（未批准）\n\n`;for(const [id,a]of Object.entries(p)){md+=id==='P07'?`- P07：三项皆有機會 ${a.possibleSeasons}/${a.n} 季，獨立抽選模型預期 ${fmt(a.expectedAwardsIndependentDrawModel)} 次／${fmt(a.expectedPerSeason==null?null:a.expectedPerSeason*100)}%。\n`:`- ${id}：已知 ${a.known}/${a.n}；資格 ${a.qualified}、基本達標 ${a.basic}（${a.basicSeeds.length} Seed）、保證 ${a.guarantee}；預期 ${fmt(a.expectedAwards)} 次／${fmt(a.expectedPerSeason==null?null:a.expectedPerSeason*100)}%。\n`; }md+='\n';}
 }
}
md+='## 保護檢查\n\n離線分析前後逐一 SHA256 核對所有原有 tracked 文件；不得改寫四輪資料或現行規格。完整 S／RNG 新版回歸、遊戲 UI／Quick／Full 不屬本次文件產出；上列為讀取既有資料的分析結果，不冒充新遊戲驗收。\n';
fs.writeFileSync(new URL('PITCHER_AWARDS_PHASE1_DATA_APPENDIX.md',here),md);
for(const [p,hash]of snapshots)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../../'+p,here))).digest('hex'),hash,p+' unexpectedly modified');
assert.equal(groups.length,48);
console.log(JSON.stringify({groups:groups.length,protectedFiles:snapshots.length,rounds:datasets.map(d=>({folder:d.folder,attempts:d.attempts,effectiveSeasons:groups.filter(g=>g.round===d.folder).reduce((n,g)=>n+g.n,0)})),output:'Design appendices only; 0 new careers / 0 game RNG'},null,2));

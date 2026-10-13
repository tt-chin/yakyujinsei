# IP180／原S3／G95：選定設計的離線驗證

> CURRENT APPROVED DESIGN為IP180／原S3／B2／G95。以下原57案與55/舊曲線為HISTORICAL / SUPERSEDED，不是最新判定；主設計唯一入口：[CURRENT](../../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#p08-approved-design)。最新離線指令與結果見本頁末節。

使用者批准：APPROVED / DESIGN_ONLY，S3沿用W25/ERA30/IP25/SO15/WP5。無產品實作授權。結果[JSON](selected-design-analysis.json)，選定參數[analysis.json](analysis.json)；原敏感性[HISTORICAL](HISTORICAL_SENSITIVITY.json)與其原274 PASS不變。

本次獨立計算57 PASS／0 FAIL。原研究index SHA256與trace校驗保持；8条自然生涯的歷史重播證據仍是儲存artifact，未重啟遊戲，不當產品PASS。手機分類MANUAL_MOBILE_EVIDENCE，評分OFFLINE_ESTIMATE。基本55及試算概率未批准，below95的trialProbability只作舊候選控制。95比較使用未取整double，端點例刻意選可精確表示的95；1e-10只用算術驗證誤差，沒有批准產品容差，取整/邊界政策仍TBD。

公式：component=100×clamp((x−lo)/(hi−lo),0,1)，錨點W12/17、ERA3.2/2.2、IP143/180、SO155/215、WP.65/.85；總分=.25W+.30ERA+.25IP+.15SO+.05WP。資格先行，NPB1/SP、W≥13/IP≥143/ERA≤3.2、必要資料有限非負、G>0、分母>0，合格總分≥95保證。55、30+2斜率、95%上限及產品精度全PROPOSAL，不由新保證條件自動批准。

IP component：143→0、150→18.9189189189、160→45.9459459459、170→72.9729729730、180/190/200→100。手機2039 score68.7954545455、trial probability57.5909090909%，未保證。合成95界線例W17/L10/IP180/ERA2.2/SO215/G30，WP component0、總分95可保證；SO214.999低於95不保證，L9則95.096153846保證。不是每個component≥95。

## 可重現計算（不修改JS檔、不啟動遊戲）

在Repository根目錄，以Node `node -e`執行下列完整JavaScript（只將結果輸出至stdout；不寫回原始資料）。在PowerShell可將程式碼存入單純字串變數後 `node -e $validationCode`，不需安裝套件。計算工具程式在本文件內，現有 `.mjs` 保持不變。

原D2.1 `analyze.mjs`/`validate.mjs`是HISTORICAL生成與「原文僅追加」檢查，未作本輪入口；不應重新生成選定JSON或以其舊prefix檢查驗收新的頂部狀態標記。本輪以以下57案及舊欄位深比較驗證，既有JS檔未更改。

```javascript
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
(async()=>{
const b='docs/reviews/pitcher-awards-d21/',old=JSON.parse(fs.readFileSync(b+'HISTORICAL_SENSITIVITY.json'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const {readStudy}=await import('./docs/reviews/pitcher-tc-research-1119/storage.mjs');
const w={W:.25,era:.30,IP:.25,SO:.15,WPCT:.05},a={W:[12,17],era:[3.2,2.2],IP:[143,180],SO:[155,215],WPCT:[.65,.85]};
function e(s){
const valid=['G','W','L','era','IP','SO'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&Number.isFinite(s.W+s.L)&&s.W+s.L>0;
if(!valid)return{valid:false,qualified:false,score:null,guaranteed:false,trialProbability:0};
const v={...s,WPCT:s.W/(s.W+s.L)},c=Object.fromEntries(Object.entries(a).map(([k,[l,h]])=>[k,100*Math.max(0,Math.min(1,(v[k]-l)/(h-l)))]));
const score=Object.entries(w).reduce((n,[k,x])=>n+c[k]*x,0);
const qualified=s.level==='NPB1'&&s.role==='SP'&&s.G>0&&s.W>=13&&s.IP>=143&&s.era<=3.2;
const guaranteed=qualified&&score>=95;
return{valid,qualified,components:c,score,guaranteed,trialProbability:!qualified||score<55?0:guaranteed?1:Math.min(95,Math.max(30,30+2*(score-55)))/100,trialProbabilityStatus:'OFFLINE_ESTIMATE / PROPOSAL; 55, curve and cap NOT APPROVED'};
}
let pass=0;function test(n,f){f();pass++;}
const s={level:'NPB1',role:'SP',G:30,W:17,L:10,era:2.2,IP:180,SO:215};
const points=[143,150,160,170,180,190,200].map(IP=>({IP,component:e({...s,IP}).components.IP}));
for(const p of points)test('IP'+p.IP,()=>assert(Math.abs(p.component-100*Math.max(0,Math.min(1,(p.IP-143)/37)))<1e-10));
test('weight sum',()=>assert.equal(Object.values(w).reduce((n,x)=>n+x,0),1));
for(const k of ['W','IP','SO'])test('monotonic '+k,()=>{let before=-1;for(const val of [0,12,13,15,17,143,150,160,180,190,200,1000]){const r=e({...s,[k]:val});assert(r.score>=before-1e-10);before=r.score;assert(r.score>=0&&r.score<=100+1e-10);}});
test('ERA',()=>{let before=-1;for(const era of [9.9,3.2,3,2.7,2.2,1.4,0]){const r=e({...s,era});assert(r.score>=before-1e-10);before=r.score;}});
test('WP',()=>{let before=-1;for(const L of [100,20,10,5,3,1,0]){const r=e({...s,L});assert(r.score>=before-1e-10);before=r.score;}});
for(const patch of [{W:12},{IP:142.999999},{era:3.200001},{G:0},{role:'MR'},{level:'KBO1'}])test('gate',()=>assert(!e({...s,...patch}).qualified&&!e({...s,...patch}).guaranteed));
const boundary=[{label:'below',input:{...s,SO:214.999},expected:false},{label:'equal',input:s,expected:true},{label:'above',input:{...s,L:9},expected:true}].map(x=>({...x,result:e(x.input)}));
for(const x of boundary)test('95 '+x.label,()=>{assert.equal(x.result.guaranteed,x.expected);if(x.label==='equal')assert.equal(x.result.score,95);});
for(const k of ['G','W','L','era','IP','SO'])for(const val of [undefined,NaN,Infinity,-1,'17'])test('invalid',()=>assert(!e({...s,[k]:val}).valid));
test('zero denominator',()=>assert(!e({...s,W:0,L:0}).valid));
test('zero loss',()=>assert(e({...s,L:0}).valid));
test('decimal IP',()=>{assert(e({...s,IP:170.1}).score<e({...s,IP:170+1/3}).score);});
const mobile=e(old.manual);test('mobile score',()=>assert(Math.abs(mobile.score-68.79545454545455)<1e-10));
test('mobile trial probability',()=>assert(Math.abs(mobile.trialProbability-.5759090909090909)<1e-10));
const groups=[];
for(const source of old.sources){assert.equal(sha(source.file),source.sha256);const data=readStudy(source.file);const rows=data.results.flatMap(r=>r.seasons.filter(x=>x.lv==='NPB1'&&x.role==='SP'&&x.st.G>0&&x.st.IP>0).map(x=>({...x.st,level:x.lv,role:x.role,seed:r.seed,year:x.year})));const values=rows.map(x=>({...e(x),seed:x.seed,year:x.year}));groups.push({group:source.group,n:rows.length,independentSeeds:new Set(rows.map(x=>x.seed)).size,qualified:values.filter(x=>x.qualified).length,guaranteed:values.filter(x=>x.guaranteed).length,trialExpectedAwards:values.reduce((n,x)=>n+x.trialProbability,0),trialStatus:'PROPOSAL probability only'});}
console.log(JSON.stringify({selectedDesign:{id:'IP180/S3/G95',status:'APPROVED / DESIGN_ONLY',weights:w,anchors:a,guaranteeScore:95,qualification:'NPB1/SP; W>=13; IP>=143; ERA<=3.20; finite nonnegative G,W,L,ERA,IP,SO; G>0; W+L>0',pending:['basic score 55','probability curve 30+2*(score-55)','probability cap 95%','rounding / floating tolerance','product implementation authorization'],formerWeights20_30_25_20_5:'NOT SELECTED; user clarified existing S3'},manual:{evidence:'MANUAL_MOBILE_EVIDENCE / OFFLINE_ESTIMATE',roleEvidence:'USER_CONFIRMED_2039_SP',input:old.manual,result:mobile},ipPoints:points,boundary,scenarios:old.scenarios.map(x=>({id:x.id,evidence:x.evidence,input:{...x,scores:undefined},result:e(x)})),sourceGroups:groups,tests:{PASS:pass,FAIL:0,NOT_RUN:['New natural careers/replays','Product Quick/Full','CI/Preview','Award product tests']},precision:'Raw double used for illustrative 95 comparisons; 1e-10 only for arithmetic assertion error, NOT adopted product tolerance',sourceSnapshotSha256:sha(b+'HISTORICAL_SENSITIVITY.json')}));
})();
```

## 範圍與未執行

只更動三份既有D2文書、D21比較及本目錄JSON/驗證Markdown；原始研究資料、圖片、遊戲JS/HTML/CSS、現有離線工具、VERSION/CHANGELOG/main不更動。既存COPY-01-P1/TRAIT-SMALLSCHOOL-C引擎/資料/測試/規格修改保持，工作樹本來不乾淨。產品Quick/Full、CI/Preview、新自然採樣與新獎實作測試NOT_RUN。未Commit/Push/Merge/Deploy。完成停止等待審查。

## B2 FINAL：最新可重現入口

執行 `node --check docs/reviews/pitcher-awards-d21/b2-final.mjs`，再 `node docs/reviews/pitcher-awards-d21/b2-final.mjs`。只寫[b2-final-analysis.json](b2-final-analysis.json)，不寫歷史資料、主設計/舊模型、不啟動遊戲或RNG。主分析JSON的selectedDesign明指IP180/S3/B2/G95；原陣列保持HISTORICAL，先前指標另存[pre-B2](HISTORICAL_PRE_B2_ANALYSIS.json)。

設計順序：資格不過p0；score<60 p0；60≤score<95，min(95,10+2.5(score−60))%；score≥95 p100。未取整內部值、60與95預期跳點保持；只在assert手算值用1e-10誤差，不採產品容差、整數化或顯示策略。

實際70 PASS/0FAIL：14個score點，資格否決/零敗/0分母/缺L/NaN/Infinity/負數/非法資料，IP143～200，權重/界限/單調性/ERA方向及手機68.7954545455/31.98863636%離線估算。623個tracked輸入與原來源hash在計算前後不變，storage校驗原trace；主R序列產品相容性仍NOT_RUN，不能把純數學分析當未來產品RNG PASS。原8自然/8儲存重播和手機證據等級保持、不新增採樣。

只新增純離線脚本與衍生JSON、更新指定文件；並行產品修改保持。產品Quick/Full/CI/Preview/發布NOT_RUN；不Commit/Push/Merge/Deploy。基本分/曲線參數已批准，未批准的是產品精度、hash向量、journal/receipt、額外phoenix/降格護欄與產品實作/發布。

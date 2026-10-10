// Generated audit artifact, not a production specification or adopted balance policy.
import {readFile,writeFile} from 'node:fs/promises';
const location=new URL('../docs/reviews/',import.meta.url);
const d=JSON.parse(await readFile(new URL('RETIREMENT_HOF_BALANCE_DATA_V1_11_1.json',location),'utf8'));
const f=x=>x==null?'—':typeof x==='number'?Number(x.toFixed(2)):String(x).replaceAll('|','／').replaceAll('\n',' ');
const pct=x=>x==null?'—':(100*x).toFixed(2)+'%';
const table=(head,rows)=>'\n| '+head.join(' | ')+' |\n| '+head.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+r.map(f).join(' | ')+' |').join('\n')+'\n';
let out=`# v1.11.1 退休評分與名人堂審查（非採用方案）

## 1. 結論與範圍

完成已批准的第一階段：160 個人工網格、20 個特殊案例、87 個邊界／現況特徵案例，以及 50 個真實完整生涯。不是 4,000 個有效聯盟生涯的驗收；不可宣稱跨聯盟平衡已獲證實。

版本 ${d.metadata.version}；分支 dev；被測遊戲 SHA ${d.metadata.baselineCommit}。main 基準為 421e036bb206a11828a696a4f8b0d3909385441f（1.10.2）。審查 commit 請以本檔所在 commit／最終回報為準，避免自引用 SHA。

只新增 tests 與 docs/reviews，未修改遊戲、UI、RNG、VERSION、CURRENT_SPEC、CHANGELOG 或部署。AGENTS 的通常 push 流程，由使用者明示同意本次「只本地 commit、不 push、不部署」覆蓋。以下候選規則不是 CURRENT_SPEC。

完整可重算結果：[JSON](RETIREMENT_HOF_BALANCE_DATA_V1_11_1.json)。每列保留 stats、逐項榮譽、原始／四捨五入分數、純／保底等級、候選／入選／首輪、票數／得票率、Seed、預期／實際及異常理由。預期是獨立分解對照原生結果，不是預先認定何者應入選。

## 2. 最嚴重五項與建議順序

1. **P1 已重現 Bug：首年入選聯盟錯置。** CPBL 8600 分（未達 9775 首輪線），MLB 11000 分（超過 10200 首輪線）；兩聯盟都入選，但 legendLeague 使用所有入選聯盟陣列第一項 CPBL。應只從實際首年入選項目選聯盟，保留原票選 RNG。最小重現為 balance.test 的 multi 測試；這是人工診斷輸入（H 高且 AB 零），只驗控制流程，不冒充可生成生涯。尚未修復。本批真實樣本沒有 MLB 一軍，未觀察此 Bug 的自然發生率。
2. **P2／設計決策：同聯盟一軍、二軍、育成混合計分。** NPB_DEV／NPB2／NPB1 同 NPB，KBO2／KBO1 同 KBO，CPBL2／CPBL1 同 CPBL；MiLB 歸 MINOR，不混 MLB。既有分桶如此，不能因本次分析採一軍為主職涯就宣告資料分桶違規。最大實例 NPB 基本分 2401.65、一軍基本分 0，14 年都非一軍。是否改一軍限定需另行批准，不能只改畫面分類。
3. **P2：投手角色與效率缺項。** HLD、ERA、WHIP、L 不直接計分。300 HLD 特例的基本分 1161，改 HLD 不改分；低 ERA 少勝 2661 vs 高 ERA 多勝 4221，差 1560 完全来自 120 勝差。頂尖 MR 2655.675 vs 普通 SP 1708.2，並非所有 MR 都低於 SP，但優秀 SP 3597 vs 優秀 MR 1161，說明角色累積尺度不同。真實 pilot 無 CL 一軍，不能判定完整角色公平性。
4. **P2／設計決策：保底資格跳躍。** 真實 CPBL IF 僅 1624 分仍因年度 MVP 成為明星級候選，8 次未入選、最高 60.7%。人工 MVP 特例 652.3 分也為明星級；king 392.3 分為日常主力級。這完全符合現行保底，不是分數計算錯誤；應決定明星保底是否同時代表殿堂候選。
5. **P2：跨聯盟全域榮譽歸屬不對稱。** intlCount×80 與國際冠／亞軍只給 NPB；franchise +200 給每個有 bucket 的聯盟。國際特例為 NPB +620，非 NPB +0；相同 franchise 四聯盟各 +200。這是現行規則，不推定重複付款或資料損毀。應先決定代表生涯／代表球團／全域的歸屬，再選模型。

建議先另開最小 P1 修復，再決定一軍口徑與 HLD 的產品規則，擴充能自然抵達 KBO／MLB 的策略後校準。不要一律降低門檻，也不要直接採下方示範係數。

## 3. 現行規則追蹤與程式風險

實際執行 game.js 原函數：careerScore、honorScore、tierOf、retireScene；VM 使用最終 TIER_TH/LG_N/LV 與原 RNG 函數，逐一比對 54 個瀏覽器聯盟快照的 tier 與 score。沒有獨立隨機生成器替代完整遊戲。

初次 TIER_TH 與後段 Object.assign 的四聯盟值相同；最終 IND/CORP=[3000,1800,900,400]，但 endGame 正式評價只使用 MLB/NPB/KBO/CPBL/MINOR，名人堂只四職業聯盟。不可將 IND/CORP 的存在解讀為已提供名人堂流程。MINOR 有成績但不形成四聯盟名人堂資格。

投手基本分 13W+6SV+0.9SO+0.35IP；野手 H+3HR+0.8SB+0.5RBI+0.3BB+6max(0,DEF)。實際門檻用未四捨五入分數，顯示才 Math.round；例如 7999.8 顯示 8000，仍非殿堂級。這是顯示精度議題，並非門檻運算錯誤。

DEF 由守備能力差、位置、賽季比例累加，負值與正值先抵銷後再 max(0,totalDEF)，不是每季各自截零；負 DEF 不扣總分。守備型人工高階案例包含 18×14 DEF，因此刻意拉大貢獻，不能據此認定自然玩家守備普遍被高估。pilot 守備分只占總計分約 0.88%，仍不足校準。

獎項以聯盟字串與日文名稱匹配，部門王需 endsWith；不同語言／尾綴可能不匹配。原 scorer 不去重（重複 MVP 輸入為 +840），但未重現正式生成流程產生重複 MVP，故列输入風險而非已確認 live Bug。現有 honor policy 測試與新增四聯盟獎項保底維持通過。缺值原始投手資料可得到 NaN，正式初始化有 blankStat；此次未見真實生涯缺值錯誤，不擅自加入 normalization。

退休代表聯盟依最好 tier，再按該 bucket 年數；本報告的主職涯依一軍年數／一軍出賽，只是統計口徑，兩者不同不能自行改 UI。精確年數與場數同分時列未分配，不發明第三個排序規則。

### 票選是敘事，不是獨立逐年投票

i=0 已確定入選；得票率至少 75%，第 1 或 2–6 輪只改敘事。首輪門檻倍率 CPBL/KBO 1.15、NPB 1.12、MLB 1.20。i=1 固定未入選，RNG 產生 3–9 次與 55–72% 最高票；i>=2 無票選卡。S.hofInfo 只存入選，候選未入選資訊存在卡片，不能以 hofInfo 空判定沒有候選。候選、入選、首輪與 legend 已分開驗證。票數為顯示百分率推算，百分率會四捨五入。
`;
out+=table(['聯盟','殿堂','明星','主力','邊緣'],Object.entries(d.metadata.thresholds).map(([l,t])=>[l,...t]));
out+='\n## 4. 真實 pilot、分母與限制\n\n';
out+=`25 個 Seed ×2 個決策策略=50 個不同 Seed／策略案例（不是 50 個相互獨立 Seed）。位置 P20、C10、IF10、OF10。ordered-overseas 依原順序配能力並在可選時偏好海外；balanced-stay 優先最低現值能力、殘留／避免 FA，其餘依原選項順序。策略只點擊既有 DOM，沒有強制改能力、聯盟、骰子或退休。actionDigest、finalStateDigest、RNG 消費數均保存。

50/50 自然結束，排除 0，錯誤 0；兩個基礎重播及兩個候選重播皆同狀態／選項／RNG。實測環境 ${d.metadata.pilot.environment.node}、Windows ${d.metadata.pilot.environment.platform}、headless Chrome ${d.metadata.pilot.environment.browser}，本機 HTTP，雙頁並行。主要保留資料跑耗時 ${d.metadata.pilot.seconds} 秒；首輪 46.8 秒；兩輪票選補取約 5.038 與 5.283 秒。共 112 次實際執行（重播、重跑不增加統計樣本）。首次補取使用錯誤 title selector 未擷取卡片，已改成原卡片 h4 再重播，兩候選卡片確實擷取，digest 與 RNG 不變。

主職涯 CPBL6、NPB15、KBO0、MLB0，未分配29；到達一軍 CPBL11、NPB19，聯盟到達可重疊。提前退休定義 age<25，8/50；專業賽季觀察 seasonFactor<1 共140，seasonFactor=0 共0，這不是所有高中／大學故障數，也不等同140次傷病事件。退休年齡 min19/P10=19/P25=36/P50=39/P75=48/P90=48/P99=48/max48/mean38.02/SD9.50。

以下比率都列 n/d；空分母為不可估計，不寫 0%。合格=原 tier<=1，入選=原 tier0；未抵達一軍的 bucket 仍會按現行規則評價，但不算到達者。
`;
const rate=x=>`${x.n}/${x.d} (${pct(x.rate)})`;
out+=table(['聯盟','一軍到達','主職涯','所有起始：候選／入選／首輪','到達者：候選／入選／首輪','合格者：候選／入選／首輪'],Object.entries(d.statistics.leagueRates).map(([l,r])=>[l,rate(r.arrival),r.primaryCareers,['candidate','inducted','first'].map(k=>rate(r.allPlayers[k])).join('；'),['candidate','inducted','first'].map(k=>rate(r.arrived[k])).join('；'),['candidate','inducted','first'].map(k=>rate(r.qualified[k])).join('；')]));
out+='\n### 真實票選卡\n\n'+d.actual.filter(r=>r.candidate).map(r=>`- ${r.id}：原始 ${f(r.raw)}／顯示 ${r.score}／純 tier${r.pureTier}／保底 tier${r.tier}；${r.voteNarrative.join('；')}`).join('\n')+'\n';
out+=`\n### 4,000 筆可行性與置信度

本階段只批准 50 筆，不自動扩充。依這兩個策略 pilot 的主職涯到達比例，NPB1000 約需3334個起始玩家、CPBL1000約8334個；以45.894秒/50估計，約51／128分鐘，但此線性外推不含更複雜策略及長尾，並非保證。KBO／MLB主職涯為0，不能估計需要多少起始玩家，須新增能在真實選項中自然抵達的策略／角色，不能偽造指定聯盟。

50案例/25配對Seed、兩種固定策略、缺KBO/MLB與CL、主職涯未分配過半，產生嚴重選擇偏差與群內相關，不能當IID樣本套用精確母體置信區間。分位數採線性插值、SD為樣本集合的母體SD；不是隨機抽樣估計器。沒有引入真實棒球生涯／名人堂參考資料，現實合理性尚未驗證。0 failures只是本批觀察，並不证明失败概率为0。不同聯盟參數與可玩路線不同，不能將人工網格當四聯盟的等價玩家分布。
`;
for(const [dataset,group]of Object.entries(d.statistics).filter(([k])=>['fixed','actual'].includes(k))){
 out+=`\n## 5.${dataset==='fixed'?1:2} ${dataset==='fixed'?'人工160網格':'真實54聯盟bucket（50玩家，可重複）'}分布\n\n`;
 const rows=Object.entries(group).flatMap(([l,g])=>[[l,'ALL',g.all],...Object.entries(g.roles).map(([role,s])=>[l,role,s])]);
 out+=table(['聯盟','角色','n','min','P10','P25','P50','P75','P90','P99','max','mean','SD'],rows.map(([l,role,s])=>[l,role,...['n','min','P10','P25','P50','P75','P90','P99','max','mean','populationSD'].map(k=>s[k])]));
 for(const kind of ['pureTiers','floorTiers']){out+=`\n### ${kind==='pureTiers'?'純分數':'獎項保底後'}等級比例（殿堂／明星／主力／邊緣／其餘）\n`;out+=table(['聯盟','角色','n','i0','i1','i2','i3','i4'],rows.map(([l,role,s])=>[l,role,s.n,...s[kind].map(n=>s.n?`${n} (${pct(n/s.n)})`:'—')]));}
}
out+='\n## 6. 得分拆解與排序\n\n54 bucket 合計不是50玩家唯一生涯總分：全域franchise會依原規則在多bucket重複貢獻。下表為計分項占比，不是收入或同一球員生涯收入。\n';
out+=table(['項目','人工分數','人工占比','真實分數','真實占比'],[...new Set([...Object.keys(d.statistics.decomposition.fixed.items),...Object.keys(d.statistics.decomposition.actual.items)])].map(k=>[k,d.statistics.decomposition.fixed.items[k]?.score,pct(d.statistics.decomposition.fixed.items[k]?.share),d.statistics.decomposition.actual.items[k]?.score,pct(d.statistics.decomposition.actual.items[k]?.share)]));
out+='\n特殊排序：短期巔峰2449 < 長期平庸4175.3；高效率少出賽580.3。這些是累積導向下的正確結果，不宣稱短生涯一定更值得入選。\n';
out+=table(['混合分桶實例','bucket基本分','一軍基本分','差','bucket年／一軍年'],[...d.statistics.firstScoreDiff].sort((a,b)=>b.difference-a.difference).slice(0,10).map(r=>[r.id,r.bucketScore,r.firstOnly,r.difference,`${r.bucketYears}/${r.firstYears}`]));
out+=`\n## 7. 三個未採用模型：相同快照重算

A：原基本／榮譽＋投手2×HLD；原門檻與保底不變。最小尺度修改，但ERA與分桶問題仍存在。

B：一軍基本＋投手3×HLD，再乘效率系數；P clamp(1+(4−ERA)×0.06,0.8,1.2)，野手 clamp(1+(OBP−0.32)×1.5,0.8,1.2)。榮譽保留，國際／franchise只歸主職涯，未分配的人工單聯盟案例視為該聯盟。ERA以9ER/IP；OBP近似(H+BB)/PA（沒有HBP等完整公式）。原門檻／保底不變。角色校準只用HLD與效率，尚未實作完整SP/MR/CL獨立尺度。

C：100點指數=50×一軍基本/原殿堂線＋50×最高5年年均基本/(原殿堂線/18)＋100×B榮譽/原殿堂線；門檻100/70/35/20，不採獎項保底。真實用年度一軍快照，人工只能以固定年均替代巔峰，不能宣稱完成巔峰驗證。C仍依原基本分，HLD缺項未解；若要完整重構，還需角色標準化與獨立票選模組。

所有係數都是比較假設，未以真實棒球資料校準。表中的A/B/C「殿堂資格」只是分數達線，**不是新票選後入選率**；没有新增RNG、不模拟候選票選，只有現行欄是真實原規則入選。C資格與票選在概念上分離，投票部分尚未建模。不可把這份表當採用C的證據。
`;
for(const [dataset,groups]of Object.entries(d.statistics.modelComparisons)){out+=`\n### ${dataset} 同資料對照（平均分／候選數／殿堂資格數；C單位不同）\n`;out+=table(['聯盟','角色','n','現行','A','B','C'],Object.entries(groups).flatMap(([l,roles])=>Object.entries(roles).map(([role,models])=>[l,role,models.current.n,...['current','A','B','C'].map(k=>`${f(models[k].mean)}／${models[k].candidate}／${models[k].inducted}`)])));}
out+='\n## 8. 一次一參數敏感度\n\n權重±10/20%，門檻±5/10%，保底不變；母體為人工160與真實54bucket。無獎項網格的獎項權重變化必然為0，不代表獎項不重要。HLD/ERA目前權重0，乘±20%仍0，缺項要用A/B加法評估。這是原規則資格重算，非新的隨機投票。\n';
out+=table(['資料','參數','調整','n','tier改變','候選數／比率','殿堂資格數／比率'],d.statistics.sensitivity.map(r=>[r.dataset,r.parameter,pct(r.delta),r.n,r.tierChanges,`${r.candidates}/${r.n} (${pct(r.candidates/r.n)})`,`${r.inducted}/${r.n} (${pct(r.inducted/r.n)})`]));
out+='\n## 9. 可重現命令、PASS/FAIL與未驗證\n\n';
out+=`測試 harness 抽取原函數，不更新既有預期值。267個案例是160網格＋20特殊＋87邊界／現況特徵；現況特徵測試刻意確認已存在的問題，所以測試PASS不代表遊戲沒有Bug。固定網格有整數計數、PA=AB+BB、HR<=H<=AB、W+L+SV+HLD<=G檢查；跨聯盟特殊為每聯盟4年、合計16年。重大傷病案例是截短快照，不是另跑故障事件。診斷高分多聯盟及負／缺值輸入不混入分布。

命令（Playwright使用既有安裝，未加npm依賴；JSON輸入是pilot輸出位置）：

\`\`\`powershell
Get-ChildItem tests -Filter *.test.mjs | ForEach-Object { node $_.FullName; if ($LASTEXITCODE) { throw $_.Name } }
node tests/hall-of-fame-policy.mjs
node tests/verify-modularization.mjs
node tests/domestic-tournament-policy.mjs
node tests/career-movement-policy.mjs
node tests/salary-promotion-policy.mjs
node tests/retirement-hof-balance.test.mjs
node tests/retirement-hof-pilot.mjs --playwright=<existing-playwright-path> --output=<pilot.json>
node tests/retirement-hof-pilot.mjs --playwright=<existing-playwright-path> --seeds=hof111-pilot-09,hof111-pilot-11 --strategy=balanced-stay --output=<votes.json>
node tests/retirement-hof-analysis.mjs --input=<pilot.json> --votes=<votes.json>
node tests/retirement-hof-report.mjs
git diff --check
\`\`\`

上述pilot實際使用 --playwright=C:/Users/rtsai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright；資料放於OS臨時目錄再合併至本報告JSON，不提交重複原始檔。

既有31個*.test.mjs 初跑 PASS／5.168秒；最終32個*.test.mjs PASS／5.291秒，上述五個補充程式 PASS／0.589秒。91個JS/MJS檔案 node --check PASS，git diff --check PASS。新增160＋20＋87 PASS；54原生VM/瀏覽器評分比對PASS；50/50完整生涯PASS，失敗0；重播狀態／操作／RNG PASS；這批瀏覽器Console與JS/CSS 404都是0。初期票選卡抓取FAIL屬測試selector問題，修正後兩張卡PASS；沒有改遊戲。

未確認：4,000有效主要聯盟生涯、KBO／MLB真實一軍分布、CL真實一軍分布、跨聯盟自然多次殿堂、真實棒球資料校準、iOS/Android實機／手機版面、Preview/本番。後兩者本次未改UI且明確禁止部署，不能冒稱驗收過。未更改RNG與URL；目前確認的是相同遊戲版本相同Seed／策略重播，不是不同新評分規則的遊戲流程回歸。
`;
out+='\n## 附錄A：全部人工案例（詳表在JSON）\n\n純／保底 tier：0殿堂、1明星、2主力、3邊緣、4其餘。欄位預期符合只指原公式／保底，不代表產品平衡合理。Seed與ID相同，特殊Seed加special-前綴；實際Seed全部在JSON。\n';
out+=table(['ID','年','基本','榮譽','原始／顯示','純／保底','候選／入選／首輪','预期符合','票選／異常'],[...d.fixed,...d.special].map(r=>[r.id,r.years,r.base,r.honor.sc,`${f(r.raw)}/${r.score}`,`${r.pureTier}/${r.tier}`,`${r.candidate}/${r.inducted}/${r.firstBallot}`,r.calculationMatches,r.hofInfo.length?r.hofInfo.map(h=>`${h.pct}% 年${h.yr}`).join('；'):r.abnormalReasons.join('；')||'—']));
out+='\n## 附錄B：全部真實Seed／策略與結果\n\n';
out+=table(['Seed','位置','策略','結束年齡','主職涯','一軍到達','操作數','RNG數','失敗'],d.pilot.map(r=>[r.seed,r.pos,r.strategy,r.snapshot?.age,r.primary||'未分配',Object.entries(r.firstCounts||{}).filter(([,v])=>v.seasons).map(([k,v])=>`${k}:${v.seasons}年/${v.games}場`).join('；')||'無',r.actions,r.calls,r.failure||'無']));
await writeFile(new URL('RETIREMENT_HOF_BALANCE_AUDIT_V1_11_1.md',location),out);
console.log('Audit Markdown generated from captured JSON; no game/version/deployment changes.');

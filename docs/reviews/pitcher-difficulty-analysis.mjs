import fs from 'node:fs';
const roots=['pitcher-tc-research','pitcher-tc-research-1119','pitcher-tc-research-r3','pitcher-tc-research-r4'];
for(const root of roots){
 const path=`docs/reviews/${root}/careers.json`; if(!fs.existsSync(path))continue;
 const data=JSON.parse(fs.readFileSync(path)); const careers=data.results||data.careers||[];
 console.log(JSON.stringify({root,commit:data.commit,careers:careers.length}));
 for(const lv of ['NPB1','CPBL1','KBO1','MLB'])for(const role of ['SP','MR','CL'])for(const band of [[0,60],[60,66],[66,81]]){
 const rows=careers.flatMap(c=>(c.seasons||[]).filter(s=>s.lv===lv&&s.role===role&&s.st?.IP>0&&s.ab&&(s.ab.vel+s.ab.ctl+s.ab.brk)/3>=band[0]&&(s.ab.vel+s.ab.ctl+s.ab.brk)/3<band[1]).map(s=>({...s,seed:c.seed})));
 if(!rows.length)continue;const avg=k=>rows.reduce((a,s)=>a+s.st[k],0)/rows.length;
 console.log(JSON.stringify({lv,role,band,n:rows.length,seeds:new Set(rows.map(s=>s.seed)).size,IP:avg('IP'),W:avg('W'),ERA:avg('era'),SO:avg('SO'),maxIP:Math.max(...rows.map(s=>s.st.IP)),maxSO:Math.max(...rows.map(s=>s.st.SO)),eraBasic:rows.filter(s=>s.st.era<=3.2&&s.st.IP>=({NPB1:143,CPBL1:120,KBO1:144,MLB:162}[lv])).length,soBasic:rows.filter(s=>s.st.SO>=({NPB1:155,CPBL1:130,KBO1:156,MLB:175}[lv])).length}));
 }
}

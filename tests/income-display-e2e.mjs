import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {instrumentRng} from './support/rng-instrument.mjs';
const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3),root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const output=arg('output')||path.join(os.tmpdir(),'yakyujinsei-income-display');await mkdir(output,{recursive:true});
const hook=`
window.__income={get:()=>JSON.parse(JSON.stringify({state:S,calls:window.__incomeRng||0})),set:v=>Object.assign(S,v),career:()=>buildCareerViewModel(),format:fmtMoney,retire:()=>endGame('収入表示の検証'),image:()=>{const out=document.createElement('div'),texts=[],old=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){texts.push({text:String(text),x,y,width:this.measureText(String(text)).width,font:this.font});return old.call(this,text,x,y,...rest);};try{shareImage([],out);return {png:out.querySelector('img').src,texts};}finally{CanvasRenderingContext2D.prototype.fillText=old;}}};`;
const server=createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';if(rel.includes('..'))throw Error('path');let body=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrumentRng(body.toString(),'__incomeRng')+hook;res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true}),errors=[],results=[];
const fixtures=[
 ['pro',{careerBaseSalary:120000000,corpIncome:0,careerIncentive:5000000,careerSigningBonus:10000000,careerDevelopmentStipend:0,careerBuyout:0,careerOutsideIncome:0,careerEarnings:135000000}],
 ['corporate',{careerBaseSalary:0,corpIncome:12600000,careerIncentive:0,careerSigningBonus:0,careerDevelopmentStipend:0,careerBuyout:0,careerOutsideIncome:0,careerEarnings:12600000}],
 ['mixed',{careerBaseSalary:503000000,corpIncome:12600000,careerIncentive:4000000,careerSigningBonus:30000000,careerDevelopmentStipend:3000000,careerBuyout:10000000,careerOutsideIncome:2000000,careerEarnings:564600000}],
 ['large-buyout',{careerBaseSalary:1234567890000,corpIncome:12600000,careerIncentive:2500000000,careerSigningBonus:5000000000,careerDevelopmentStipend:3000000,careerBuyout:123456789000,careerOutsideIncome:3000000000,careerEarnings:1368540279000}],
 ['missing',{careerBaseSalary:null,corpIncome:null,careerIncentive:null,careerSigningBonus:null,careerDevelopmentStipend:null,careerBuyout:null,careerOutsideIncome:null,careerEarnings:null}]
];
let failure;
try{
 for(const width of [1280,320,390])for(const pos of ['P','IF']){
  const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});
  await p.goto(url+'/?seed=income-fixture');await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();
  for(const [id,money] of fixtures){
   await p.evaluate(money=>{window.__income.set(money);document.documentElement.dataset.fontSize='large';document.documentElement.dataset.theme='night';},money);
   const before=await p.evaluate(()=>window.__income.get());
   const expected=await p.evaluate(m=>{const fmt=window.__income.format;return [['pay','年俸・報酬',(m.careerBaseSalary||0)+(m.corpIncome||0)],['incentive','出来高',m.careerIncentive||0],['signing','契約金・支度金',(m.careerSigningBonus||0)+(m.careerDevelopmentStipend||0)],['buyout','契約解除補償金',m.careerBuyout||0],['outside','スポンサー収入',m.careerOutsideIncome||0],['total','生涯総収入',m.careerEarnings||0]].map(([key,label,value])=>({key,label,value:fmt(value)}));},money);
   assert.deepEqual(await p.evaluate(()=>window.__income.career().contract.incomeRows),expected);
   await p.locator('[data-main-view="career"]').click();await p.locator('[data-career-tab="contract"]').click();
   const incomeList=p.locator('#career-content dl');
   assert.deepEqual(await incomeList.locator('dt').allTextContents().then(v=>v.slice(-6)),expected.map(r=>r.label));
   assert.deepEqual(await incomeList.locator('dd').allTextContents().then(v=>v.slice(-6)),expected.map(r=>r.value));
   await p.locator('#salary-detail-trigger').click();
   const detail=p.locator('#salary-detail-body dl.income-summary');assert.deepEqual((await detail.locator('dd').allTextContents()).slice(-6),expected.map(r=>r.value));assert.equal((await detail.locator('dt').allTextContents()).at(-1),'生涯総収入');
   assert.doesNotMatch(await detail.innerText(),/固定年俸|社会人給与|買い取り|NaN/);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.locator('#salary-detail-close').click();assert.deepEqual(await p.evaluate(()=>window.__income.get()),before,'summary/detail read-only S/RNG');
   const image=await p.evaluate(()=>window.__income.image());assert.deepEqual(await p.evaluate(()=>window.__income.get()),before,'native image read-only S/RNG');
   const rows=expected.map(r=>{const a=image.texts.filter(t=>t.text===r.label+' '+r.value);assert.equal(a.length,1);return a[0];});
   assert.equal(rows[0].y,rows[1].y);assert.equal(rows[2].y,rows[3].y);assert.ok(rows[4].y>rows[3].y&&rows[5].y>rows[4].y);
   for(const row of rows)assert.ok(row.x>=34&&row.x+row.width<=886.1,'income text clips: '+row.text);
   for(const [a,b] of [[rows[0],rows[1]],[rows[2],rows[3]]])assert.ok(a.x+a.width+12<=b.x,'income columns overlap');
   const footer=image.texts.find(t=>t.text.startsWith('seed: '));assert.ok(rows[5].y+20<footer.y,'total overlaps footer');
   results.push({id,pos,width,status:'PASS',pay:expected[0].value,total:expected.at(-1).value});
  }
  await p.locator('[data-main-view="home"]').click();await p.evaluate(()=>{window.__income.set({careerBaseSalary:503000000,corpIncome:12600000,careerIncentive:4000000,careerSigningBonus:30000000,careerDevelopmentStipend:3000000,careerBuyout:10000000,careerOutsideIncome:2000000,careerEarnings:564600000});window.__income.retire();});
  const profile=p.locator('#log .card').filter({has:p.locator('h4',{hasText:'キャリアプロフィール'})});
  assert.equal((await profile.locator('dt').allTextContents()).at(-1),'生涯総収入');assert.doesNotMatch(await profile.innerText(),/固定年俸|社会人給与|買い取り|NaN/);
  if(pos==='P'&&width===390){
   await p.locator('#sh-img').click();
   const png=await p.locator('#sh-out img').getAttribute('src');
   await writeFile(path.join(output,'career-income-preview.png'),Buffer.from(png.split(',')[1],'base64'));
   await p.screenshot({path:path.join(output,'retirement-mobile.png'),fullPage:true});
  }
  await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log('30 native income fixtures PASS: summary/detail/canvas exact amounts and unchanged S/RNG; 6 retirement layouts PASS');
}catch(e){failure=e;console.error(e.stack);}finally{await writeFile(path.join(output,'summary.json'),JSON.stringify({PASS:results.length,FAIL:failure?1:0,results,errors,failure:failure?.stack},null,2));server.closeAllConnections();server.close();await browser.close();process.exit(failure?1:0);}

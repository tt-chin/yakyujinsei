import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {verifyBoardMenu} from '../tests/support/board-menu.mjs';
import {THEME_IDS} from '../docs/src/ui/theme-catalog.js';
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const root=fileURLToPath(new URL('../docs/',import.meta.url));
const output=path.resolve(arg('output')||'test-results/ui-acceptance-20261105/desktop');
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';const file=path.resolve(root,name);if(!file.startsWith(root))throw Error('path');const data=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(data);}catch{res.statusCode=404;res.end('missing');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const results=[],errors=[];
try{
  const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
  browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
  const p=await browser.newPage({viewport:{width:1280,height:900}});
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port+'/?seed=ui-acceptance-desktop');
  await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#btn-start').click();
  // Reuse the existing native long-contract / large-money matrix: five desktop
  // widths, four themes, three font sizes; no game-state mutation or careers.
  await verifyBoardMenu(p,{width:1280,screenshot:path.join(output,'menu-1280.png')});
  results.push({case:'existing long contract / large money / theme / font matrix',status:'PASS',combinations:60});
  for(const width of [320,390,1179,1180,1280,1876]){
    await p.setViewportSize({width,height:900});
    // matchMedia change schedules rendering on the next animation frame.
    await p.waitForFunction(expected=>(getComputedStyle(document.querySelector('#desktop-career')).display!=='none')===expected,width>=1180);
    const actual=await p.evaluate(()=>({visible:getComputedStyle(document.querySelector('#desktop-career')).display!=='none',overflow:document.documentElement.scrollWidth>innerWidth}));
    assert.equal(actual.visible,width>=1180);assert.equal(actual.overflow,false);
    if(width>=1180){
      const income=await p.evaluate(async themes=>{
        const {renderCareer}=await import('/src/ui/player-detail.js');
        const target=document.querySelector('#desktop-career').lastElementChild,original=target.innerHTML;
        const detail=document.createElement('div');detail.hidden=true;document.body.append(detail);
        const model={contract:{history:[],description:'2029～2035年 長い球団名の複数年保証契約',remainingYears:'7年',guaranteedTotal:'1,234,567,890万円',schedule:['2029年 123,456,789万円','2030年 123,456,789万円'],incomeRows:['年俸・報酬','出来高','契約金・支度金','契約解除補償金','スポンサー収入','生涯総収入'].map((label,i)=>({label,value:(i+1)+',234,567,890円'}))}};
        const saved=[document.documentElement.dataset.theme,document.documentElement.dataset.fontSize];let cases=0;
        try{for(const theme of themes)for(const font of ['small','medium','large']){
          document.documentElement.dataset.theme=theme;document.documentElement.dataset.fontSize=font;
          renderCareer(target,model,'contract');renderCareer(detail,model,'contract');
          if(target.textContent!==detail.textContent)throw Error('Sidebar/detail mismatch');
          for(const row of model.contract.incomeRows)if(!target.textContent.includes(row.label)||!target.textContent.includes(row.value))throw Error('Income row missing');
          for(const value of target.querySelectorAll('dt,dd'))if(value.scrollWidth>value.clientWidth+1)throw Error('Long income overflow');
          if(document.documentElement.scrollWidth>innerWidth)throw Error('Page overflow');cases++;
        }return cases;}finally{target.innerHTML=original;detail.remove();[document.documentElement.dataset.theme,document.documentElement.dataset.fontSize]=saved;}
      },[...THEME_IDS]);
      assert.equal(income,THEME_IDS.length*3);results.push({case:'six nonzero long-income rows; sidebar/detail equality',width,combinations:income,status:'PASS'});
    }
    results.push({case:'sidebar breakpoint / no horizontal overflow',width,status:'PASS'});
  }
  assert.deepEqual(errors,[]);
  await writeFile(path.join(output,'summary.json'),JSON.stringify({status:'PASS',results,errors,scope:'local Chromium only; device/payment NOT_RUN'},null,2));
  console.log('PASS desktop: 60 long-data/theme/font combinations, six breakpoint widths, existing menu lifecycle');
}catch(error){await writeFile(path.join(output,'failure.json'),JSON.stringify({status:'FAIL',message:error.stack,results,errors},null,2));throw error;}
finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}

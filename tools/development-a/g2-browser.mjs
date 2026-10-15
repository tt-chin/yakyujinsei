import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const root=fileURLToPath(new URL('../../',import.meta.url));
const server=createServer(async(req,res)=>{
 try{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
  if(!rel||rel.split('/').includes('..')||!(rel.startsWith('tools/development-a/')||rel==='docs/src/engine/award-rng-policy.js'))throw Error('Invalid path');
  const body=await readFile(path.join(root,rel));
  res.setHeader('Content-Type',rel.endsWith('.json')?'application/json':/\.m?js$/.test(rel)?'text/javascript':'text/html');
  res.end(body);
 }catch(e){res.statusCode=404;res.end(String(e));}
});
const manual=process.argv.includes('--serve');
await new Promise(r=>server.listen(manual?Number(arg('port')||8088):0,arg('host')||'127.0.0.1',r));
const suffix='/tools/development-a/g2-safari.html';
if(manual){
 console.log('Local acceptance only; no deployment. URL: http://'+(arg('host')||'127.0.0.1')+':'+server.address().port+suffix);
 console.log('For iPhone use your PC LAN address; allow local firewall access explicitly. Download JSON and record actual Safari/iOS version.');
}else{
 const output=path.resolve(arg('output')||'test-results/development-a-g2-browser');await mkdir(output,{recursive:true});
 const pw=createRequire(import.meta.url)(arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright');
 const results=[];
 try{
  for(const name of ['chromium','webkit']){
   let browser;
   try{
    browser=await pw[name].launch({headless:true});
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto('http://127.0.0.1:'+server.address().port+suffix);
    await page.locator('#run').click();await page.waitForFunction(()=>!!window.__g2Result);
    const result=await page.evaluate(()=>window.__g2Result);
    const record={platform:name,browserVersion:browser.version(),node:process.version,
     actualSafari:false,status:result.FAIL===0&&errors.length===0?'PASS':'FAIL',errors,result};
    await writeFile(path.join(output,name+'.json'),JSON.stringify(record,null,2));results.push(record);
    console.log(name+' '+record.status+' '+result.PASS+' cases');
   }catch(e){const record={platform:name,status:'BLOCKED',error:String(e.stack||e)};results.push(record);await writeFile(path.join(output,name+'.json'),JSON.stringify(record,null,2));console.error(name+' BLOCKED '+e.message);}
   finally{if(browser)await browser.close();}
  }
  await writeFile(path.join(output,'summary.json'),JSON.stringify({results,safari:'NOT_RUN / awaiting human iPhone Safari result'},null,2));
  if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}

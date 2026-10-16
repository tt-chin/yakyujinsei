import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,statSync,realpathSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {linuxTempAlias,runBatch} from './ci-full-batches.mjs';
assert.equal(process.platform,'linux','Smoke must run on real Linux');
const output=path.resolve('test-results/linux-smoke'),target=path.join(output,'batch-1/tmp');
mkdirSync(output,{recursive:true});
const result={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runId:process.env.GITHUB_RUN_ID,attempt:process.env.GITHUB_RUN_ATTEMPT,status:'FAIL',checks:[]};
let a,b,browser;
try{
 a=linuxTempAlias(target);b=linuxTempAlias(target);
 assert.notEqual(a.alias,b.alias);assert.equal(statSync(path.dirname(a.alias)).mode&0o777,0o700);
 assert.equal(realpathSync(a.alias),realpathSync(target));result.checks.push('unique/0700/realpath');
 const socket=a.alias+'/org.chromium.Chromium.ABCDEF/SingletonSocket';assert.ok(Buffer.byteLength(socket)<108);result.socketBytes=Buffer.byteLength(socket);
 const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
 browser=await chromium.launch({channel:'chromium',headless:true,env:{...process.env,TMPDIR:a.alias,TMP:a.alias,TEMP:a.alias}});
 const p=await browser.newPage();await p.setContent('<title>smoke</title>');assert.equal(await p.title(),'smoke');
 result.browser=browser.version();await browser.close();browser=null;result.checks.push('Chromium launch/page/close');
 writeFileSync(path.join(a.alias,'evidence.json'),'preserve');const alias=a.alias;a.release();a=null;
 assert.ok(!existsSync(alias));assert.equal(readFileSync(path.join(target,'evidence.json'),'utf8'),'preserve');result.checks.push('cleanup preserves original evidence');
 const baseline=execFileSync('git',['rev-parse','origin/main^{commit}'],{encoding:'utf8'}).trim();
 assert.equal(runBatch({head:result.head,baseline,runId:result.runId,runAttempt:result.attempt,batches:[['choice-action.test']]},1,path.join(output,'native')),0);
 const r=JSON.parse(readFileSync(path.join(output,'native/batch-1/summary.json')));assert.equal(r.results[0].status,'PASS');result.checks.push('native Runner alias/output routing');
 result.status='PASS';
}catch(e){result.error=e.stack;process.exitCode=1;}
finally{await browser?.close();a?.release();b?.release();writeFileSync(path.join(output,'summary.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));}

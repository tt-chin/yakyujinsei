import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const here=new URL('./',import.meta.url),root=new URL('../../../',here),sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const dirs=['docs/reviews/pitcher-tc-research','docs/reviews/pitcher-tc-research-1119','docs/reviews/pitcher-tc-research-r3','docs/src','docs/styles','docs/index.html','AGENTS.md','CURRENT_SPEC.md','BACKLOG.md','CHANGELOG.md'];
const files=git('ls-files','--',...dirs).split('\n').filter(Boolean);
const hashes=()=>Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(new URL(f,root)))]));
if(process.argv.includes('--verify')){const old=JSON.parse(fs.readFileSync(new URL('BASELINE.json',here)));assert.deepEqual(hashes(),old.protectedFiles);assert.equal(git('rev-parse','HEAD'),old.head);console.log(`PASS: ${files.length} protected files and HEAD unchanged`);}
else{const target=new URL('BASELINE.json',here);assert(!fs.existsSync(target),'Do not overwrite pre-run evidence');const head=git('rev-parse','HEAD');assert.equal(head,git('rev-parse','origin/dev'));fs.writeFileSync(target,JSON.stringify({head,version:fs.readFileSync(new URL('docs/src/config.js',root),'utf8').match(/VERSION\s*=\s*'([^']+)/)[1],engineLastChangeCommit:git('log','-1','--format=%H','--','docs/src/engine/game.js'),engineBlob:git('rev-parse','HEAD:docs/src/engine/game.js'),toolSha256:Object.fromEntries(['run.mjs','prepare.mjs','STRATEGIES.md'].map(f=>[f,sha(fs.readFileSync(new URL(f,here)))])),protectedFiles:hashes()},null,2));console.log('Saved pre-run BASELINE.json');}

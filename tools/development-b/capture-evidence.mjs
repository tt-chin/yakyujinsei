// Append-only local evidence. Never writes product sources or the frozen A archive.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
if(!output||fs.existsSync(output))throw Error('New output path required');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:40e6}).trim();
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const productFiles=['docs/index.html','docs/.nojekyll',...['docs/src','docs/styles','docs/assets'].flatMap(dir=>fs.readdirSync(dir,{recursive:true}).map(n=>dir+'/'+n.replaceAll('\\','/')).filter(n=>fs.statSync(n).isFile()))].sort();
const productSources=Object.fromEntries(productFiles.map(n=>[n,hash(fs.readFileSync(n))]));
const verificationFiles=['tests','tools/development-b'].flatMap(dir=>fs.readdirSync(dir,{recursive:true})
 .map(n=>dir+'/'+n.replaceAll('\\','/')).filter(n=>fs.statSync(n).isFile()&&/\.(mjs|js)$/.test(n))).sort();
const verificationSources=Object.fromEntries(verificationFiles.map(n=>[n,hash(fs.readFileSync(n))]));
const archive='test-results/development-a-baseline-20261015-c3d413dd/';
const anchors={'BASELINE_MANIFEST.json':'a08095f1d89d419762afd58f10c8e7b12edd5c07f1de91902f8563457f1181f1',
 'SHA256SUMS':'2ee5d1505568ef66e586dd2530b5105edf6d6452fa7c0efc19eb6a48f8005061',
 'verify-baseline-v2.mjs':'e4b166728d26d1f35c18f40d6bffc99cd3ac2e74bbe891a6212e0c49fd9145a0'};
for(const [file,expected] of Object.entries(anchors))if(hash(fs.readFileSync(archive+file))!==expected)throw Error('A trust anchor changed: '+file);
const verification=spawnSync(process.execPath,[archive+'verify-baseline-v2.mjs','--manifest='+archive+'BASELINE_MANIFEST.json'],{encoding:'utf8',maxBuffer:20e6});
if(verification.status!==0)throw Error(verification.stderr||verification.stdout);
const result={timestamp:new Date().toISOString(),branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),main:git('rev-parse','main'),
 version:fs.readFileSync('docs/src/config.js','utf8').match(/VERSION\s*=\s*['"]([^'"]+)/)[1],
 node:process.version,platform:process.platform,arch:process.arch,status:git('status','--short'),
 parallelChangesNotOwned:['docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md','docs/reviews/g1-a-validation/fixtures.mjs','docs/reviews/g1-a-validation/fixtures-double-wings.mjs','tasks/','docs/reviews/G1_B_PRE_IMPLEMENTATION_REVIEW.md','docs/reviews/G1_B2_CONSUMER_COMPATIBILITY_REVIEW.md'],
 productSources,verificationSources,aArchive:{path:archive,anchors,verification:{exitCode:verification.status,stdout:verification.stdout,stderr:verification.stderr,currentSourceChecked:false}},
 forbiddenChanges:git('diff','--name-only','--','AGENTS.md','CURRENT_SPEC.md','BACKLOG.md','CHANGELOG.md','docs/src/config.js','scripts/test.mjs','scripts/test-manifest.mjs','.github/workflows'),
 notice:'Uncommitted B candidate; A Full is not B Full; no commit/push/merge/deploy authorization.'};
if(result.forbiddenChanges)throw Error('Out-of-scope changes require review: '+result.forbiddenChanges);
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'EVIDENCE_MANIFEST.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(output,'working-tree.diff'),git('diff','--no-ext-diff','--binary')+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',products:productFiles.length,manifestSha256:hash(fs.readFileSync(path.join(output,'EVIDENCE_MANIFEST.json'))),output}));

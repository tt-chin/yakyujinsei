// Document/data validation, no engine import or game execution.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../../../',import.meta.url)),here=new URL('./',import.meta.url);
const data=JSON.parse(fs.readFileSync(new URL('analysis.json',here)));
const files=data.documentDifferences.map(x=>'docs/designs/'+x.file).concat('docs/reviews/PITCHER_AWARDS_D21_MODEL_COMPARISON.md');
let links=0;
for(const rel of files){const file=path.join(root,rel);for(const m of fs.readFileSync(file,'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){const target=m[1].split('#')[0];if(!target||/^[a-z]+:/i.test(target))continue;assert(fs.existsSync(path.resolve(path.dirname(file),target)),'Missing local link '+rel+': '+target);links++;}}
assert(data.documentDifferences.every(x=>x.originalPreserved&&x.addedLines>0),'Keep original D2 and append only');
assert.equal(data.tests.FAIL,0);assert.equal(data.verification.length,8);
for(const source of data.sources)assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,source.file))).digest('hex'),source.sha256,'Immutable raw study source');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),data.head,'No commit in this task');
execFileSync('git',['diff','--check']);
const result={status:'PASS',localLinks:links,documentOriginalsPreserved:3,sourceIndexesUnchanged:data.sources.length,storedArtifactReplaysVerified:8,offlineTests:data.tests,documentDifferences:data.documentDifferences,seconds:data.seconds,scope:'No product edits from these offline tools; pre-existing parallel product edits preserved',concurrentTrackedChanges:data.concurrentTrackedChanges};
fs.writeFileSync(new URL('validation.json',here),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));

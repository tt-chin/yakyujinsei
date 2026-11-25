import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(path.join(root,'CURRENT_SPEC.md'),'utf8');
const requiredHistory=new Set([
 'FIX_DRAFT_SIGNING_BONUS_INCOME_DISPLAY.md',
 'YAKYUJINSEI_JP_EVENT_92_COPY.json',
 'YAKYUJINSEI_EVENT_SYSTEM_IMPLEMENTATION_SPEC.md',
 'YAKYUJINSEI_JP_EVENT_92_COMPLETE_DATA.md',
 'CODEX_TRAIT_JP_38_COMPLETE_MASTER_SPEC_UPDATED.md',
].map(file=>'6a31b27d11ce125ff3cc4104b3c0ad3fda785b29:'+file));
const retainedHistory=new Set();
let local=0,history=0;
for(const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
 const target=match[1];
 if(target.startsWith('https://github.com/tt-chin/yakyujinsei/blob/')){
  const url=new URL(target),[,owner,repo,blob,ref,...parts]=url.pathname.split('/');
  assert.equal(owner,'tt-chin');assert.equal(repo,'yakyujinsei');assert.equal(blob,'blob');assert.match(ref,/^[a-f0-9]{40}$/);
  const file=decodeURIComponent(parts.join('/')),key=ref+':'+file;execFileSync('git',['cat-file','-e',key],{cwd:root});if(requiredHistory.has(key))retainedHistory.add(key);history++;
 }else if(!/^(?:https?:|mailto:|#)/.test(target)){
  assert.ok(existsSync(path.resolve(root,decodeURIComponent(target.split('#')[0]))),'Broken local link '+target);local++;
 }
}
// Required original sources remain exact; additional history links are verified too.
assert.deepEqual([...retainedHistory].sort(),[...requiredHistory].sort(),'Five removed source documents must retain trusted history links');
console.log(`PASS CURRENT_SPEC: ${local} existing local links; ${history} Git-verified historical sources. Historical documents do not override current approved sections.`);

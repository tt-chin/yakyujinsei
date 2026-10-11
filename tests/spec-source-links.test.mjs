import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=readFileSync(path.join(root,'CURRENT_SPEC.md'),'utf8');
let local=0,history=0;
for(const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
 const target=match[1];
 if(target.startsWith('https://github.com/tt-chin/yakyujinsei/blob/')){
  const url=new URL(target),[,owner,repo,blob,ref,...parts]=url.pathname.split('/');
  assert.equal(owner,'tt-chin');assert.equal(repo,'yakyujinsei');assert.equal(blob,'blob');assert.match(ref,/^[a-f0-9]{40}$/);
  const file=decodeURIComponent(parts.join('/'));execFileSync('git',['cat-file','-e',ref+':'+file],{cwd:root});history++;
 }else if(!/^(?:https?:|mailto:|#)/.test(target)){
  assert.ok(existsSync(path.resolve(root,decodeURIComponent(target.split('#')[0]))),'Broken local link '+target);local++;
 }
}
assert.equal(history,5,'Five removed source documents must retain trusted history links');
console.log(`PASS CURRENT_SPEC: ${local} existing local links; ${history} Git-verified historical sources. Historical documents do not override current approved sections.`);

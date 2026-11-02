// Focused release-note content/generation checks; no game simulation.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {releaseNotes} from '../docs/src/data/release-notes.js';
import {VERSION} from '../docs/src/config.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const changelog=read('CHANGELOG.md'),source=read('RELEASE_NOTES.md');
const detailed=[...changelog.matchAll(/^## (\d+\.\d+\.\d+) - (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const summaries=[...source.matchAll(/^### (\d+\.\d+\.\d+)｜(\d{4}\/\d{2}\/\d{2})\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)];
const omitted=new Map([['1.0.3','Only consolidates already recorded 1.0.2 changes; no new player-facing change.']]);
assert.ok(detailed.length>10&&summaries.length>10,'do not truncate to a latest-N list');
assert.equal(new Set(detailed.map(m=>m[1])).size,detailed.length,'unique official versions');
assert.equal(new Set(summaries.map(m=>m[1])).size,summaries.length,'unique summary versions');
assert.deepEqual(summaries.map(m=>m[1]),detailed.filter(m=>!omitted.has(m[1])).map(m=>m[1]),'every official version is accounted for in source order');
const parsed=summaries.map(m=>({title:m[1]+'｜'+m[2],lines:m[3].split('\n').filter(line=>line.startsWith('- '))}));
assert.deepEqual(releaseNotes,parsed,'served data exactly matches curated source');
for(const m of summaries){
  const original=detailed.find(d=>d[1]===m[1]);
  assert.equal(m[2],original[2].replaceAll('-','/'),'date matches detailed history: '+m[1]);
  const lines=parsed.find(r=>r.title.startsWith(m[1]+'｜')).lines;
  assert.ok(lines.length>=1&&lines.length<=3,'one to three bullets: '+m[1]);
  for(const line of lines){
    assert.ok([...line].length<=80,'short player-facing text: '+m[1]);
    assert.doesNotMatch(line,/`|\.(?:js|mjs|md|json)\b|\b(?:clipboard|callback|fallback|schema|RNG|SHA|PASS|FAIL|BLOCKED|NOT_RUN|PR|commit|fixture|snapshot)\b|検証|受入|验收|検収|デプロイ|リファクタリング|[a-f0-9]{40}/i,'no internal implementation/acceptance metadata: '+m[1]);
  }
}
assert.ok(parsed[0].title.startsWith(VERSION+'｜'),'current version is listed');
const historyBase='4f39a73e23758b891bc24951225231792ab022b4';
const head=execFileSync('git',['show',historyBase+':CHANGELOG.md'],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
assert.ok(changelog.endsWith(head.slice(head.indexOf('## '))),'all prior detailed history remains byte-equivalent after newline normalization');
assert.match(detailed.find(m=>m[1]==='1.0.3')[3],/1\.0\.2まで.*統合/,'omission has an explicit historical basis');
for(const name of ['docs/src/ui/information-dialog.js','docs/styles/information.css','scripts/update-release-notes.mjs']){
  const previous=execFileSync('git',['show','HEAD:'+name],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
  assert.equal(read(name),previous,'help, dialog controls, detailed-history references and generator preserved: '+name);
}
const output=new URL('../docs/src/data/release-notes.js',import.meta.url);
const hash=()=>createHash('sha256').update(readFileSync(output)).digest('hex');
const before=hash();
for(let i=0;i<2;i++){
  execFileSync(process.execPath,['scripts/update-release-notes.mjs'],{cwd:root});
  assert.equal(hash(),before,'repeated generation is byte-identical');
}
console.log(`PASS: ${detailed.length} official versions audited; ${parsed.length} player summaries; ${omitted.size} documented internal-only omission; dates/content/data/idempotence/history/dialog preservation`);

// Read-only release-note gate (TEST-RELEASE-NOTES-LIMITS-01): format, limits and generated-data sync.
// Reports errors only; never rewrites files. Regenerate with node scripts/update-release-notes.mjs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {releaseNotes} from '../docs/src/data/release-notes.js';
import {VERSION} from '../docs/src/config.js';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const changelog=read('CHANGELOG.md'),source=read('RELEASE_NOTES.md');
const detailed=[...changelog.matchAll(/^## (\d+\.\d+\.\d+) - (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const summaries=[...source.matchAll(/^### (\d+\.\d+\.\d+)｜(\d{4}\/\d{2}\/\d{2})\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)];
const omitted=new Map([['1.0.3','Only consolidates already recorded 1.0.2 changes; no new player-facing change.']]);

// Headings and section bodies: the generator silently skips malformed headings and non-"- " lines.
assert.ok(source.startsWith('## 更新履歴\n'),'nothing before the top heading');
const headings=source.split('\n').filter(line=>line.startsWith('#'));
assert.equal(headings[0],'## 更新履歴','top heading');
assert.equal(source.slice(source.indexOf('## 更新履歴\n')+'## 更新履歴\n'.length,source.indexOf('\n### ')+1).trim(),'','nothing between the top heading and the first version');
for(const line of headings.slice(1))assert.match(line,/^### \d+\.\d+\.\d+｜\d{4}\/\d{2}\/\d{2}$/,'version heading format: '+line);
assert.equal(summaries.length,headings.length-1,'every version heading is parsed');
for(const m of summaries)for(const line of m[3].split('\n')){
  assert.ok(line===''||line.startsWith('- '),'only "- " bullets or blank lines in '+m[1]+': '+line);
  if(line.startsWith('-'))assert.notEqual(line.slice(1).trim(),'','bullet has text in '+m[1]);
}

assert.ok(detailed.length>10&&summaries.length>10,'do not truncate to a latest-N list');
assert.equal(new Set(detailed.map(m=>m[1])).size,detailed.length,'unique official versions');
assert.equal(new Set(summaries.map(m=>m[1])).size,summaries.length,'unique summary versions');
assert.deepEqual(summaries.map(m=>m[1]),detailed.filter(m=>!omitted.has(m[1])).map(m=>m[1]),'every official version is accounted for in source order');
assert.match(detailed.find(m=>m[1]==='1.0.3')[3],/1\.0\.2まで.*統合/,'omission has an explicit historical basis');
const parsed=summaries.map(m=>({title:m[1]+'｜'+m[2],lines:m[3].split('\n').filter(line=>line.startsWith('- '))}));
assert.deepEqual(releaseNotes,parsed,'served data exactly matches curated source; run node scripts/update-release-notes.mjs');
for(const m of summaries){
  const original=detailed.find(d=>d[1]===m[1]);
  assert.equal(m[2],original[2].replaceAll('-','/'),'date matches detailed history: '+m[1]);
  const lines=parsed.find(r=>r.title.startsWith(m[1]+'｜')).lines;
  assert.ok(lines.length>=1&&lines.length<=3,'one to three bullets: '+m[1]);
  for(const line of lines){
    assert.ok([...line].length<=80,'at most 80 code points including "- ": '+m[1]);
    assert.doesNotMatch(line,/`|\.(?:js|mjs|md|json)\b|\b(?:clipboard|callback|fallback|schema|RNG|SHA|PASS|FAIL|BLOCKED|NOT_RUN|PR|commit|fixture|snapshot)\b|検証|受入|验收|検収|デプロイ|リファクタリング|[a-f0-9]{40}/i,'no internal implementation/acceptance metadata: '+m[1]);
  }
}
assert.ok(parsed[0].title.startsWith(VERSION+'｜'),'current version is listed first');
console.log(`PASS: ${detailed.length} official versions; ${parsed.length} player summaries; ${omitted.size} documented omission; headings/limits/terms/data sync`);

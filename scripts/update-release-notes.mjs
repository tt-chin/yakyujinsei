import {readFileSync,writeFileSync} from 'node:fs';
const text=readFileSync(new URL('../CHANGELOG.md',import.meta.url),'utf8');
const sections=[...text.matchAll(/^## (\d+\.\d+\.\d+[^\r\n]*)\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const notes=sections.slice(0,10).map(m=>({title:m[1],lines:m[2].split(/\r?\n/).filter(line=>line.startsWith('- '))}));
if(!notes.length)throw Error('No release notes');
writeFileSync(new URL('../docs/src/data/release-notes.js',import.meta.url),'// Generated from CHANGELOG.md; run node scripts/update-release-notes.mjs.\nexport const releaseNotes = '+JSON.stringify(notes,null,2)+';\n');
console.log('Release sections: '+notes.length);

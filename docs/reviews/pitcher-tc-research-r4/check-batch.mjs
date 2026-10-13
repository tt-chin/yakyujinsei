// Execute the original verifier with only its input/output location redirected.
import fs from 'node:fs';
const original=new URL('../pitcher-tc-research-r3/check-batch.mjs',import.meta.url);
let code=fs.readFileSync(original,'utf8');
code=code.replace("'../pitcher-tc-research-1119/storage.mjs'",JSON.stringify(new URL('../pitcher-tc-research-1119/storage.mjs',import.meta.url).href));
code=code.replace("new URL('./',import.meta.url)",`new URL(${JSON.stringify(new URL('./',import.meta.url).href)})`);
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));

import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {sourceText,readSourceText} from '../tests/support/source-text.mjs';

const output=path.resolve('test-results/source-text-'+new Date().toISOString().replace(/[:.]/g,'-'));
mkdirSync(output,{recursive:true});
const original="// 日本語の原文\nfunction sample(){\n  return '文字列と空白';\n}\n";
let checks=0;
for(const [name,text] of [['lf',original],['crlf',original.replaceAll('\n','\r\n')],['mixed',original.replace('\n','\r\n')]]){
  const file=path.join(output,name+'.js');writeFileSync(file,text,'utf8');
  assert.equal(sourceText(text),original);assert.equal(readSourceText(file),original);checks+=2;
}
for(const different of [original.replace('  return',' return'),original.replace(';\n','; \n'),original.replace('文字列','別の文字列'),original.replace('return',"return 1;//"),original+'// unexpected\n',original.replace('  return','\treturn'),original.replace('\n','\r'),original.slice(0,-1),'\uFEFF'+original]){
  assert.notEqual(sourceText(different),original,'non-EOL differences must not be hidden');checks++;
}
const bomFile=path.join(output,'bom.js');writeFileSync(bomFile,'\uFEFF'+original,'utf8');
assert.equal(readSourceText(bomFile),'\uFEFF'+original);checks++;
for(const [name,bytes] of [['invalid-utf8',[0xff,0xfe]],['broken-utf8',[0xe3,0x81]]]){
  const file=path.join(output,name+'.js');writeFileSync(file,Buffer.from(bytes));
  assert.throws(()=>readSourceText(file),TypeError,'invalid encoding cannot become an apparently matching source');checks++;
}
assert.throws(()=>sourceText(Buffer.from(original)),TypeError);checks++;
console.log(`PASS ${checks} UTF-8/LF/CRLF/mixed and non-EOL negative checks; fixture evidence ${output}`);

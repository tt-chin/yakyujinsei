import {readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
let count=0;
for(const dir of ['docs/src','tests','scripts']) {
  for(const item of readdirSync(dir,{recursive:true,withFileTypes:true})) if(item.isFile()&&/\.(js|mjs)$/.test(item.name)) {
    execFileSync(process.execPath,['--check',path.join(item.parentPath,item.name)],{stdio:'pipe'});count++;
  }
}
console.log(`PASS syntax: ${count} JavaScript files`);

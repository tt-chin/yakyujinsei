// Diagnostic only: no timeout, retry, browser mutation or PASS/FAIL conversion.
import os from 'node:os';
import path from 'node:path';
import {writeFileSync} from 'node:fs';
const active=new Map(),completed=[];let next=0,file=null;
export function browserProgress(){return {active:[...active.values()],completed:[...completed]};}
export function configureBrowserProgress(output){
  file=path.join(output,`browser-progress-${Date.now()}-${process.pid}.json`);
  console.log('BROWSER_PROGRESS_FILE '+file);save();return file;
}
function save(){if(file)try{writeFileSync(file,JSON.stringify(browserProgress()));}catch(error){console.error('BROWSER_PROGRESS_WRITE_FAILED '+error.message);}}
export async function observeBrowserOperation(stage,operation,{heartbeatMs=10000,log=message=>console.error(message)}={}){
  const id=++next,start=Date.now(),record={id,stage:String(stage).slice(0,300),started:new Date().toISOString(),status:'RUNNING'};
  active.set(id,record);save();
  const emit=status=>{try{log('BROWSER_OPERATION '+JSON.stringify({...record,status,elapsedSeconds:(Date.now()-start)/1000,freeMemoryMiB:Math.round(os.freemem()/1048576),nodeRssMiB:Math.round(process.memoryUsage().rss/1048576)}));}catch{}};
  const timer=setInterval(()=>{emit('WAITING');save();},heartbeatMs);timer.unref();
  try{const result=await operation();record.status='PASS';return result;}
  catch(error){record.status='FAIL';record.error=String(error?.message||error).slice(0,500);emit('FAIL');throw error;}
  finally{clearInterval(timer);record.seconds=(Date.now()-start)/1000;active.delete(id);completed.push({...record});if(completed.length>512)completed.shift();save();}
}

import {cloneCapturedSaveEnvelope} from './browser-save-codec.js';
const KEY='annual-save-hmac-v1',verified=new WeakMap();
const error=code=>Object.assign(new Error(code),{code});
const bytes=row=>new TextEncoder().encode(JSON.stringify({revision:row.revision,save:row.save}));
function validKey(record){
 const key=record?.key;
 if(typeof record?.id!=='string'||!record.id||!(key instanceof CryptoKey)||key.extractable||key.type!=='secret'||key.algorithm.name!=='HMAC'||key.algorithm.hash.name!=='SHA-256'||key.algorithm.length!==256||!key.usages.includes('sign')||!key.usages.includes('verify'))throw error('SAVE_AUTH_KEY_INVALID');
 return record;
}
async function keyRecord(db,create=false){
 const read=()=>new Promise((resolve,reject)=>{let value;const tx=db.transaction('career','readonly');tx.objectStore('career').get(KEY).onsuccess=e=>{value=e.target.result;};tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(tx.error||error('SAVE_AUTH_KEY_READ'));tx.onerror=()=>{};});
 let record=await read();if(record)return validKey(record);
 if(!create)throw error('SAVE_AUTH_KEY_MISSING');
 if(!globalThis.crypto?.subtle)throw error('SAVE_AUTH_UNAVAILABLE');
 const generated={id:crypto.randomUUID(),key:await crypto.subtle.generateKey({name:'HMAC',hash:'SHA-256',length:256},false,['sign','verify'])};
 return new Promise((resolve,reject)=>{let selected,failure;const tx=db.transaction('career','readwrite'),store=tx.objectStore('career');store.get(KEY).onsuccess=e=>{try{selected=e.target.result?validKey(e.target.result):generated;if(!e.target.result)store.put(selected,KEY);}catch(err){failure=err;tx.abort();}};tx.oncomplete=()=>resolve(selected);tx.onabort=()=>reject(failure||tx.error||error('SAVE_AUTH_KEY_WRITE'));tx.onerror=()=>{};});
}
export async function sealCapturedSave(db,envelope,revision){
 const save={...cloneCapturedSaveEnvelope(envelope),revision};
 const key=await keyRecord(db,true),record={revision,save};
 const signature=await crypto.subtle.sign('HMAC',key.key,bytes(record));
 return {...record,seal:{schemaVersion:1,keyId:key.id,algorithm:'HMAC-SHA-256',signature:[...new Uint8Array(signature)].map(n=>n.toString(16).padStart(2,'0')).join('')}};
}
export async function authenticateStoredSave(db,row){
 const seal=row?.seal;
 if(seal?.schemaVersion!==1||seal.algorithm!=='HMAC-SHA-256'||typeof seal.signature!=='string'||!/^[a-f0-9]{64}$/.test(seal.signature))throw error('SAVE_AUTH_MISSING');
 const key=await keyRecord(db);
 if(key.id!==seal.keyId)throw error('SAVE_AUTH_KEY_MISMATCH');
 const signature=Uint8Array.from(seal.signature.match(/../g),x=>parseInt(x,16));
 if(!await crypto.subtle.verify('HMAC',key.key,signature,bytes(row)))throw error('SAVE_AUTH_FAILED');
 const authorization=Object.freeze(Object.create(null));
 verified.set(authorization,{envelope:JSON.stringify(row.save),state:JSON.stringify(row.save.state),proofs:structuredClone(row.save.awardProofs)});
 return authorization;
}
export function authenticatedAwardProofs(authorization,state,envelope){
 const record=verified.get(authorization);
 if(!record||record.state!==JSON.stringify(state)||record.envelope!==JSON.stringify(envelope))throw error('SAVE_AUTH_REQUIRED');
 return structuredClone(record.proofs);
}

import {validateSaveEnvelope,cloneCapturedSaveEnvelope} from './browser-save-codec.js';
import {sealCapturedSave,authenticateStoredSave} from './browser-save-auth.js';
const error=code=>Object.assign(new Error(code),{code});
export class BrowserSaveStore {
 #idb;#name;#database=null;#opening=null;#closed=false;#generation=0;#writes=new Set();#queue=Promise.resolve();
 constructor({indexedDB,name='yakyujinsei-career'}={}){if(indexedDB===undefined){try{indexedDB=globalThis.indexedDB;}catch{indexedDB=null;}}this.#idb=indexedDB;this.#name=name;}
 async #open(){
  if(this.#closed)throw error('SAVE_STORE_CLOSED');
  if(this.#database)return this.#database;
  if(this.#opening)return this.#opening;
  if(!this.#idb)throw error('SAVE_STORAGE_UNAVAILABLE');
  this.#opening=new Promise((resolve,reject)=>{let request,settled=false;const fail=e=>{if(!settled){settled=true;reject(e);}};try{request=this.#idb.open(this.#name,1);}catch(e){fail(e);return;}
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('career'))db.createObjectStore('career');};
   request.onblocked=()=>fail(error('SAVE_DATABASE_BLOCKED'));
   request.onerror=()=>fail(request.error||error('SAVE_DATABASE_OPEN'));
   request.onsuccess=()=>{const db=request.result;if(settled||this.#closed){db.close();fail(error('SAVE_STORE_CLOSED'));return;}settled=true;this.#database=db;db.onversionchange=()=>{this.cancelPendingWrites();db.close();this.#database=null;};resolve(db);};
  });
  try{return await this.#opening;}finally{this.#opening=null;}
 }
 cancelPendingWrites(){++this.#generation;for(const tx of this.#writes)try{tx.abort();}catch{};}
 close(){this.#closed=true;this.cancelPendingWrites();this.#database?.close();this.#database=null;}
 async #readRaw(db){return new Promise((resolve,reject)=>{let row;const tx=db.transaction('career','readonly');const req=tx.objectStore('career').get('autosave');req.onsuccess=()=>{row=req.result;};tx.onabort=()=>reject(tx.error||error('SAVE_READ_ABORTED'));tx.onerror=()=>{};tx.oncomplete=()=>{resolve(row);};});}
 async read(){const db=await this.#open(),raw=await this.#readRaw(db),row=this.#validateRow(raw);if(row.save)row.authorization=await authenticateStoredSave(db,{...raw,save:row.save});return row;}
 #validateRow(row){if(row===undefined)return {revision:0,save:null};if(!Number.isSafeInteger(row?.revision)||row.revision<1)throw error('SAVE_SLOT_CORRUPT');if(row.save===null)return {revision:row.revision,save:null};let save;try{save=validateSaveEnvelope(row.save);}catch(e){if(e.code==='SAVE_INCOMPATIBLE'&&typeof row.save?.gameVersion==='string')e.savedVersion=row.save.gameVersion.slice(0,64);throw e;}if(save.revision!==row.revision)throw error('SAVE_SLOT_CORRUPT');return {revision:row.revision,save};}
 save(envelope,expectedRevision,{isCurrent=()=>true}={}){const snapshot=cloneCapturedSaveEnvelope(envelope);return this.#enqueue(snapshot,expectedRevision,isCurrent);}
 remove(expectedRevision,{isCurrent=()=>true}={}){return this.#enqueue(null,expectedRevision,isCurrent);}
 #enqueue(snapshot,expectedRevision,isCurrent){
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)return Promise.reject(error('SAVE_REVISION'));
  const generation=this.#generation;
  const run=async()=>{const db=await this.#open();const raw=await this.#readRaw(db),old=this.#validateRow(raw);if(old.save)await authenticateStoredSave(db,{...raw,save:old.save});if(old.revision!==expectedRevision)throw error('SAVE_CONFLICT');if(expectedRevision===Number.MAX_SAFE_INTEGER)throw error('SAVE_REVISION');const revision=expectedRevision+1,prepared=snapshot?await sealCapturedSave(db,snapshot,revision):{revision,save:null};if(generation!==this.#generation||!isCurrent())throw error('SAVE_STALE_WRITE');
   return new Promise((resolve,reject)=>{let failure,record;const tx=db.transaction('career','readwrite');this.#writes.add(tx);const fail=e=>{failure=e;try{tx.abort();}catch{}};const store=tx.objectStore('career'),request=store.get('autosave');
    request.onsuccess=()=>{try{if(generation!==this.#generation||!isCurrent())throw error('SAVE_STALE_WRITE');if(JSON.stringify(request.result)!==JSON.stringify(raw))throw error('SAVE_CONFLICT');const old=this.#validateRow(request.result);if(old.revision!==expectedRevision)throw error('SAVE_CONFLICT');if(expectedRevision===Number.MAX_SAFE_INTEGER)throw error('SAVE_REVISION');record=prepared;store.put(record,'autosave');}catch(e){fail(e);}};
    tx.onerror=()=>{};tx.onabort=()=>{this.#writes.delete(tx);reject(failure||tx.error||error('SAVE_WRITE_ABORTED'));};tx.oncomplete=()=>{this.#writes.delete(tx);resolve(record);};
   });
  };
  const pending=this.#queue.then(run);this.#queue=pending.catch(()=>{});return pending;
 }
}

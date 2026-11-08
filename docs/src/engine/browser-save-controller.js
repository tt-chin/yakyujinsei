import {createSaveEnvelope} from './browser-save-codec.js';
import {BrowserSaveStore} from './browser-save-store.js';
export class BrowserSaveController {
 #store;#notify;#restore;#lock;#generation=0;#queue=Promise.resolve();#restoring=false;#captured=new WeakMap();
 constructor({store=new BrowserSaveStore(),notify=()=>{},restore,lock=()=>{}}){this.#store=store;this.#notify=notify;this.#restore=restore;this.#lock=lock;this.state={phase:'loading',slot:null,revision:0,writable:false,careerId:null,message:'セーブデータを確認しています…'};}
 #saveFailureMessage(){if(!this.state.slot)return 'セーブできませんでした。この生涯の保存済みデータはありません。';if(this.state.slot.careerId!==this.state.careerId)return 'セーブできませんでした。今回の新しい生涯は保存されていません。以前の生涯のセーブデータは変更していません。';return 'セーブできませんでした。前回のセーブデータは変更していません。';}
 #show(message){this.state.message=message;this.#notify({...this.state});}
 async initialize(){try{const slot=await this.#store.read();this.state={...this.state,phase:'ready',slot:slot.save,revision:slot.revision,writable:false};this.#show(slot.save?'続きから再開できます。':'セーブデータはありません。');}catch(error){this.state.phase='unavailable';this.state.writable=false;this.#show(error.code==='SAVE_INCOMPATIBLE'?'このバージョンでは読み込めないセーブデータです。保存バージョン：'+(error.savedVersion||'不明')+'。元のデータは保持されています。セーブせずに始める場合、今回の進行状況は保存されません。':'セーブデータを確認できません。セーブせずに始める場合、今回の進行状況は保存されません。');}return this.state;}
 newCareer(){
  if(!['ready','unavailable'].includes(this.state.phase))return false;
  if(this.state.phase==='unavailable'){if(!globalThis.confirm('セーブデータを確認できません。今回の進行状況は保存されません。セーブせずに始めますか？'))return false;}
  else if(this.state.slot&&!globalThis.confirm('新しい野球人生を始めると、現在のセーブデータが上書きされます。よろしいですか？'))return false;
  ++this.#generation;this.#store.cancelPendingWrites();this.state.careerId=globalThis.crypto.randomUUID();this.state.writable=this.state.phase==='ready';this.#show(this.state.writable?'年度開始時にセーブします。':'今回の進行状況は保存されません。');return true;
 }
 capture(state){
  if(this.#restoring){this.#captured.set(state,state.year);return;}
  if(!this.state.writable||this.#captured.get(state)===state.year)return;
  const generation=this.#generation,careerId=this.state.careerId;
  this.#captured.set(state,state.year);
  let snapshot;try{snapshot=createSaveEnvelope(state,{careerId,revision:this.state.revision,checkpointReady:true});}catch(error){console.warn('SAVE_CAPTURE_REJECTED',error.code||error.message);this.#show(this.#saveFailureMessage());return;}
  const current=()=>generation===this.#generation&&this.state.writable&&careerId===this.state.careerId;
  this.#queue=this.#queue.then(async()=>{if(!current())return;try{const row=await this.#store.save(snapshot,this.state.revision,{isCurrent:current});if(!current())return;this.state.revision=row.revision;this.state.slot=row.save;this.#show(snapshot.checkpoint.year+'年の開始時点をセーブしました');}catch(error){if(!current())return;if(error.code==='SAVE_CONFLICT'){this.state.writable=false;++this.#generation;this.#store.cancelPendingWrites();this.#show('別のタブで進行状況が更新されました。このタブでは以後セーブされません。');}else{const quota=error.name==='QuotaExceededError'||error.code==='QuotaExceededError';if(!quota){this.state.writable=false;++this.#generation;this.#store.cancelPendingWrites();}this.#show(this.#saveFailureMessage()+(quota?'':'このタブでは以後セーブされません。'));}}});
 }
 async restore(){
  if(this.#restoring||!['ready','restore-error'].includes(this.state.phase))return;
  ++this.#generation;this.#store.cancelPendingWrites();this.state.writable=false;this.#restoring=true;this.state.phase='restoring';this.#lock(true);this.#show('再開しています…');
  try{const row=await this.#store.read();if(!row.save)throw Error('SAVE_MISSING');await this.#restore(row.save,{authorization:row.authorization});this.state.slot=row.save;this.state.revision=row.revision;this.state.careerId=row.save.careerId;this.state.writable=true;this.state.phase='ready';this.#lock(false);this.#show(row.save.checkpoint.year+'年の最初から再開しました。');}
  catch(error){this.state.phase='restore-error';this.state.writable=false;this.#lock(true);this.#show('再開処理に失敗しました。セーブデータは上書きしていません。タイトルに戻るか、もう一度読み込んでください。');}
  finally{this.#restoring=false;}
 }
 async remove(){if(this.state.phase!=='ready')return;if(!globalThis.confirm('セーブデータを削除しますか？'))return;if(!globalThis.confirm('削除すると元に戻せません。本当に削除しますか？'))return;++this.#generation;this.#store.cancelPendingWrites();this.state.writable=false;this.state.phase='deleting';this.#show('セーブデータを削除しています…');try{const row=await this.#store.remove(this.state.revision);this.state.slot=null;this.state.phase='ready';this.state.revision=row.revision;this.state.writable=false;this.#show('セーブデータを削除しました。');}catch(error){this.state.writable=false;this.state.phase='unavailable';this.#show('削除できませんでした。保存済みデータを変更していません。');}}
 async settled(){await this.#queue;}
}

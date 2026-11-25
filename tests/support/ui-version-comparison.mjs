// Compare UI histories at the current release, preserving every state/RNG field.
import {VERSION} from '../../docs/src/config.js';

// Historical UI fixtures start a new career at the current version. Only the
// frozen configuration constant changes; historical engine and rules stay frozen.
export function currentUiBaselineVersion(source){
  const text=source.toString();
  if(!/^export const VERSION = '2\.0\.0';\s*$/.test(text))throw Error('UI_BASELINE_VERSION_SOURCE');
  return text.replace("'2.0.0'",JSON.stringify(VERSION));
}
export function assertUi20VersionStamps(snapshot){
  const state=snapshot?.state;
  if(!state||state.version!==VERSION)throw Error('UI20_VERSION_STAMP');
  if(state.birthHighSchool&&Object.hasOwn(state.birthHighSchool,'createdVersion')){
    if(state.birthHighSchool.createdVersion!==VERSION)throw Error('UI20_BIRTH_VERSION_STAMP');
  }
  return snapshot;
}

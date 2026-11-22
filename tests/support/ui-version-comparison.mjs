// The UI release stays at 2.0.0. Keep every version, gameplay and RNG field.
export function assertUi20VersionStamps(snapshot){
  const state=snapshot?.state;
  if(!state||state.version!=='2.0.0')throw Error('UI20_VERSION_STAMP');
  if(state.birthHighSchool&&Object.hasOwn(state.birthHighSchool,'createdVersion')){
    if(state.birthHighSchool.createdVersion!=='2.0.0')throw Error('UI20_BIRTH_VERSION_STAMP');
  }
  return snapshot;
}

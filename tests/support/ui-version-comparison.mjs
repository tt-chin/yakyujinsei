// Only the approved 2.0.0 -> 2.1.0 metadata delta. Never project gameplay or RNG.
export function projectUi21VersionStamps(snapshot){
  const result=structuredClone(snapshot),state=result.state;
  if(!state||!['2.0.0','2.1.0'].includes(state.version))throw Error('UI21_VERSION_STAMP');
  delete state.version;
  if(state.birthHighSchool&&Object.hasOwn(state.birthHighSchool,'createdVersion')){
    if(!['2.0.0','2.1.0'].includes(state.birthHighSchool.createdVersion))throw Error('UI21_BIRTH_VERSION_STAMP');
    delete state.birthHighSchool.createdVersion;
  }
  return result;
}

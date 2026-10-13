// Birth classification is separate from mutable school membership. No RNG here.
export function highSchoolTier(roll) {
  return roll < 25 ? 'S' : roll < 70 ? 'A' : roll < 90 ? 'B' : 'C';
}

export function schoolCompetitionBonus(stage, tier) {
  if (stage === 'HS' && tier === 'C') return -4;
  return tier === 'S' ? 6 : tier === 'A' ? 2 : -2;
}

export function installBirthHighSchool(state, school, version) {
  if (Object.hasOwn(state, 'birthHighSchool')) return;
  const snapshot = Object.freeze({schemaVersion:1, classificationSystem:'JP_SABC',
    schoolId:school.schoolId, tier:school.tier, createdVersion:version});
  Object.defineProperty(state, 'birthHighSchool', {value:snapshot, enumerable:true,
    writable:false, configurable:false});
}

export function smallSchoolEligibility(snapshot, schools, version) {
  if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.classificationSystem !== 'JP_SABC'
    || snapshot.createdVersion !== version || !['S','A','B','C'].includes(snapshot.tier)) return 'UNKNOWN';
  const school = schools.find(item => item.schoolId === snapshot.schoolId);
  if (!school || school.tier !== snapshot.tier) return 'UNKNOWN';
  return snapshot.tier === 'C' ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
}

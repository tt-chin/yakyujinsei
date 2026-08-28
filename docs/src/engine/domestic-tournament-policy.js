export const TOURNAMENT_RESULTS = Object.freeze(['優勝', '準優勝', 'ベスト4', 'ベスト8', '予選敗退']);

const STANDARD_POINTS = Object.freeze([7, 5, 4, 3, 1]);
const UNIVERSITY_POINTS = Object.freeze([5, 4, 3, 2, 1]);
const AMA_D = Object.freeze([10, 7, 5, 3, 1]);
const DEEMED_GAMES = Object.freeze([5, 5, 4, 3, 2]);

export function tournamentResult({ power, national, overall, pointMode = 'STANDARD' }) {
  const cuts = national ? [64, 58, 52, 46] : [58, 52, 46, 40];
  const resultIndex = power >= cuts[0] ? 0 : power >= cuts[1] ? 1 : power >= cuts[2] ? 2 : power >= cuts[3] ? 3 : 4;
  const result = TOURNAMENT_RESULTS[resultIndex];
  const points = pointMode === 'UNIVERSITY'
    ? UNIVERSITY_POINTS[resultIndex]
    : Math.min(10, STANDARD_POINTS[resultIndex] + Math.floor(overall / 22) + (national ? 1 : 0));
  return {
    result,
    resultIndex,
    isChampion: result === '優勝',
    points,
    amaD: AMA_D[resultIndex],
    deemedGames: DEEMED_GAMES[resultIndex],
  };
}

export function grantsSenbatsuEligibility(result) {
  return Boolean(result && result.resultIndex <= 2);
}

export function nextSenbatsuEligibleYear(result, year) {
  return grantsSenbatsuEligibility(result) ? year + 1 : null;
}

export function canPlaySenbatsu(stageYear, eligibleYear, year) {
  return stageYear >= 2 && eligibleYear === year;
}

export function canPlayHighSchoolFall(stageYear) {
  return stageYear <= 2;
}

export function qualifiesForChampionship(result) {
  return Boolean(result && result.isChampion === true);
}

export function qualificationResult(power) {
  const isQualified = power >= 58;
  return {
    result: isQualified ? '代表資格獲得' : '予選敗退',
    isQualified,
    points: 0,
    amaD: 0,
    deemedGames: 1,
  };
}

export function qualifiesForUniversityJingu(autumnResult, route, qualifier) {
  if (!qualifiesForChampionship(autumnResult)) return false;
  if (route === 'DIRECT') return true;
  return route === 'PLAYOFF' && qualifier?.isQualified === true;
}

export function qualifiesForCorporateJapan(jabaResult, cityResult, qualifier) {
  return qualifiesForChampionship(jabaResult)
    || qualifiesForChampionship(cityResult)
    || qualifier?.isQualified === true;
}

export function isBelowActiveMinimum(overall) {
  return overall < 30;
}

export function findDemotionTarget(path, currentIndex, overall, levels) {
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (overall >= levels[path[i]].min) return path[i];
  }
  return null;
}

export function demotionChoiceText(targetLevel, levels) {
  if (!targetLevel) return '戦力外通告を受け、再起を目指す';
  if (targetLevel === 'NPB2') return '二軍降格を受け入れ、再起を目指す';
  if (targetLevel === 'NPB_DEV') return '育成契約への移行を受け入れ、再起を目指す';
  return `${levels[targetLevel].n}への降格を受け入れ、再起を目指す`;
}

export function crossOfferType(currentOrg, destinationOrg) {
  const overseas = ['KBO', 'CPBL', 'MiLB', 'MLB'];
  if (currentOrg === 'NPB' && overseas.includes(destinationOrg)) return 'overseas_transfer';
  if (overseas.includes(currentOrg) && destinationOrg === 'NPB') return 'npb_return';
  if (overseas.includes(currentOrg) && overseas.includes(destinationOrg)) return 'overseas_to_overseas';
  return 'transfer';
}

export function crossOfferTitle(type) {
  if (type === 'npb_return') return 'NPB復帰オファー';
  if (type === 'overseas_transfer') return 'シーズン後の海外移籍オファー';
  return '移籍オファー';
}

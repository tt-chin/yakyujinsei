const CONTRACT_TYPES={CONTROL:'球団保有期間',DEVELOPMENT:'育成契約',ROOKIE:'ルーキー契約',NORMAL:'通常契約',EXTENSION:'契約延長',ARBITRATION:'年俸調停',LONG:'長期契約',SHORT:'短期契約',PROOF:'再起契約',RETURN:'残留契約',FA_RETURN:'FA後再契約',OVERSEAS_FA:'海外FA契約'};

export function contractTypeLabel(code){return CONTRACT_TYPES[code]||code||'契約なし';}

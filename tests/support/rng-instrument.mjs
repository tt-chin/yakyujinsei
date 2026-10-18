// Test-only RNG call counter for E2E sources. Current game.js: observe careerRng.onDraw (no source-text dependency).
// Baselines without careerRng: legacy text replace of the R definitions. A miss throws instead of counting 0.
export function instrumentRng(source, counter = '__rngCalls') {
  const inc = `window.${counter}=(window.${counter}||0)+1;`;
  if (/^let careerRng = null;$/m.test(source)) return source + `\ncareerRng.onDraw=()=>{${inc}};`;
  const out = source.replace('function R(){', 'function R(){' + inc).replace('R = function(){', 'R = function(){' + inc);
  if (out === source) throw Error('RNG_INSTRUMENT_MISS');
  return out;
}

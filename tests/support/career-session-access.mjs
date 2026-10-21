// Test-only accessor for injected E2E hooks. Defines `__cs` before the last `})();` of game.js, so hooks read/write
// career flow state the same way on current sources (careerSession.<name>) and old baselines (bare let/const bindings).
// A field found in neither form throws on access instead of reading undefined; `__cs.has(name)` replaces `typeof name` guards.
const FIELDS = ['stepQ','choiceGeneration','activeChoiceToken','resultViewDepth','currentChoiceAction','currentChoiceContext',
  'pendingOffseasonSalary','npbReturnOfferContext','seasonEndContext','corpSettlements'];
const MARK = 'const __cs={';
export function withCareerSessionAccess(source) {
  if (source.includes(MARK)) return source;
  const at = source.lastIndexOf('})();');
  if (at < 0) throw Error('CAREER_SESSION_ACCESS_NO_IIFE_END');
  const present = [];
  const props = FIELDS.map(name => {
    const target = source.includes('careerSession.' + name) ? 'careerSession.' + name
      : new RegExp('\\b(?:let|const)\\s[^;]*\\b' + name + '\\s*=').test(source) ? name : null;
    if (!target) return `get ${name}(){throw Error('CAREER_SESSION_FIELD_MISSING:${name}');},set ${name}(v){throw Error('CAREER_SESSION_FIELD_MISSING:${name}');}`;
    present.push(name);
    return `get ${name}(){return ${target};},set ${name}(v){${target}=v;}`;
  });
  if (!present.length) throw Error('CAREER_SESSION_ACCESS_NO_FIELDS');
  props.push(`has(n){return ${JSON.stringify(present)}.includes(n);}`);
  return source.slice(0, at) + `\n${MARK}${props.join(',')}};\n` + source.slice(at);
}

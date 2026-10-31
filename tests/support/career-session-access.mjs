// Test-only accessor for injected E2E hooks. Defines `__cs` at the overlay hook point (overlay-hook.mjs), so hooks read/write
// career flow state the same way on current sources (careerSession.<name>) and old baselines (bare let/const bindings).
// A field found in neither form throws on access instead of reading undefined; `__cs.has(name)` replaces `typeof name` guards.
// A field that only modules read has no text in game.js (OOP plan §2aa): when game.js builds a CareerSession, the live instance is checked on access.
import {injectOverlayHook} from './overlay-hook.mjs';
const FIELDS = ['stepQ','choiceGeneration','activeChoiceToken','resultViewDepth','currentChoiceAction','currentChoiceContext',
  'pendingOffseasonSalary','npbReturnOfferContext','seasonEndContext','corpSettlements'];
const MARK = 'const __cs={';
const SESSION_INSTANCE = /\bcareerSession\s*=\s*new CareerSession\(/;
export function withCareerSessionAccess(source) {
  if (source.includes(MARK)) return source;
  const present = [], live = [];
  const props = FIELDS.map(name => {
    const target = source.includes('careerSession.' + name) ? 'careerSession.' + name
      : new RegExp('\\b(?:let|const)\\s[^;]*\\b' + name + '\\s*=').test(source) ? name : null;
    if (!target && SESSION_INSTANCE.test(source)) {
      live.push(name);
      const guard = `if(!('${name}' in careerSession))throw Error('CAREER_SESSION_FIELD_MISSING:${name}');`;
      return `get ${name}(){${guard}return careerSession.${name};},set ${name}(v){${guard}careerSession.${name}=v;}`;
    }
    if (!target) return `get ${name}(){throw Error('CAREER_SESSION_FIELD_MISSING:${name}');},set ${name}(v){throw Error('CAREER_SESSION_FIELD_MISSING:${name}');}`;
    present.push(name);
    return `get ${name}(){return ${target};},set ${name}(v){${target}=v;}`;
  });
  if (!present.length && !live.length) throw Error('CAREER_SESSION_ACCESS_NO_FIELDS');
  props.push(`has(n){return ${JSON.stringify(present)}.includes(n)||(${JSON.stringify(live)}.includes(n)&&n in careerSession);}`);
  return injectOverlayHook(source, `\n${MARK}${props.join(',')}};\n`);
}

// OOP plan §2ww: some E2E hooks run on a historical baseline and on the current source. A source that still
// declares the game.js names (any baseline) gets the hook verbatim; a source without them (the current game.js,
// which no longer keeps test-only delegates) gets the module calls. Each name must be rewritten exactly `count`
// times, so an edited hook cannot drift silently; a source with only some of the names is an error.
export function currentModuleCalls(hook, targets) {
  let out = hook;
  for (const [name, {to, count}] of Object.entries(targets)) {
    // Not a member call (x.name(), but a spread (...name() is a bare call.
    const call = new RegExp(`(?<![\\w$'"])(?<!(?:^|[^.])\\.)${name}\\(`, 'g');
    const hits = out.match(call)?.length || 0;
    if (hits !== count) throw Error(`MODULE_CALL_COUNT ${name}: ${hits} !== ${count}`);
    out = out.replace(call, to + '(');
  }
  return out;
}

export function hookForSource(source, hook, targets) {
  const names = Object.keys(targets);
  const declared = names.filter(name => new RegExp(`(?:^|\\n)[ \\t]*function ${name}\\(`).test(String(source)));
  if (declared.length === names.length) return hook;
  if (declared.length === 0) return currentModuleCalls(hook, targets);
  throw Error('MODULE_CALL_MIXED_SOURCE ' + declared.join(','));
}

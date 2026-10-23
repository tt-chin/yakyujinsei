// Test-only injection point for E2E hooks that must run after the Japanese overlay and share its scope.
// Old sources (historical baselines): the overlay is an IIFE, so the hook goes before its closing `})();`.
// New sources (overlay unwrapped to module level): the hook is appended at module top level, in injection order.
// Not inside a block: hooks such as kbo-renewal-e2e declare a function the overlay code must resolve to,
// which a block would hide. A hook name that collides with a module name fails loudly (SyntaxError).
const MARKER = '/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */';
export function injectOverlayHook(source, hook) {
  const at = source.indexOf(MARKER);
  if (at < 0) throw Error('OVERLAY_HOOK_MISS');
  if (/^\r?\n\(\(\) => \{\r?\n/.test(source.slice(at + MARKER.length))) {
    const end = source.lastIndexOf('})();');
    if (end < at) throw Error('OVERLAY_HOOK_MISS');
    return source.slice(0, end) + hook + source.slice(end);
  }
  return source + '\n' + hook + '\n';
}

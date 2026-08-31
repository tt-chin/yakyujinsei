export function safeErrorCode(error) {
  const message = String(error?.message || '');
  return /^[A-Z][A-Z0-9_]{2,64}$/.test(message) ? message : 'UNEXPECTED_ERROR';
}

export function createChoiceActionToken(generation) {
  return { generation, running: false };
}

export function runChoiceAction({
  action, currentMarkup, clear, restore, reportError, errorContext = () => ({}),
  token = createChoiceActionToken(0), currentGeneration = () => token.generation,
  disableAll = () => {}, debug = (...args) => console.debug(...args),
}) {
  const startGeneration = token.generation;
  if (currentGeneration() !== startGeneration) {
    debug('STALE_CHOICE_ACTION_IGNORED', { actionGeneration: startGeneration, currentGeneration: currentGeneration() });
    return 'stale';
  }
  if (token.running) {
    debug('DUPLICATE_CHOICE_ACTION_BLOCKED', { generation: startGeneration });
    return 'duplicate';
  }
  token.running = true;
  disableAll();
  try {
    const result = action();
    if (currentGeneration() === startGeneration) clear();
    return result;
  } catch (error) {
    const context = errorContext() || {};
    const details = { code: safeErrorCode(error), message: String(error?.message || error), stack: error?.stack || null, ...context };
    console.error('CHOICE_ACTION_FAILED', details);
    reportError(error, details);
    token.running = false;
    if (currentGeneration() === startGeneration) restore();
    throw error;
  }
}

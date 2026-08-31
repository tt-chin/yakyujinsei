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
  currentToken = null, activateToken = () => {}, isCurrentChoice = () => false,
  buttonLabel = '', disableAll = () => {}, debug = (...args) => console.debug(...args),
  reportInvariant = (...args) => console.error(...args),
}) {
  const startGeneration = token.generation;
  const activeGeneration = currentGeneration();
  const tokenIsCurrent = currentToken ? currentToken() === token : activeGeneration === startGeneration;
  if (tokenIsCurrent && activeGeneration !== startGeneration && isCurrentChoice()) {
    const details = { generation: startGeneration, currentGeneration: activeGeneration, buttonLabel };
    reportInvariant('CURRENT_CHOICE_MARKED_STALE', details);
    activateToken(token);
  }
  if (!tokenIsCurrent) {
    const details = { generation: startGeneration, currentGeneration: activeGeneration, buttonLabel };
    if (isCurrentChoice()) {
      reportInvariant('CURRENT_CHOICE_MARKED_STALE', details);
      activateToken(token);
    } else {
      debug('STALE_CHOICE_ACTION_IGNORED', details);
      return 'stale';
    }
  }
  if (token.running) {
    debug('DUPLICATE_CHOICE_ACTION_BLOCKED', { generation: startGeneration, currentGeneration: currentGeneration(), buttonLabel });
    return 'duplicate';
  }
  token.running = true;
  disableAll();
  try {
    const result = action();
    if (currentToken ? currentToken() === token : currentGeneration() === startGeneration) clear();
    return result;
  } catch (error) {
    const context = errorContext() || {};
    const details = { code: safeErrorCode(error), message: String(error?.message || error), stack: error?.stack || null, ...context };
    console.error('CHOICE_ACTION_FAILED', details);
    token.running = false;
    try {
      reportError(error, details);
    } catch (reportingError) {
      console.error('CHOICE_ACTION_REPORT_FAILED', { message: String(reportingError?.message || reportingError), stack: reportingError?.stack || null, originalCode: details.code });
    } finally {
      if (currentToken ? currentToken() === token : currentGeneration() === startGeneration) restore();
    }
    throw error;
  }
}

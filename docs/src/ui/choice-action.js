export function safeErrorCode(error) {
  const message = String(error?.message || '');
  return /^[A-Z][A-Z0-9_]{2,64}$/.test(message) ? message : 'UNEXPECTED_ERROR';
}

export function runChoiceAction({ action, currentMarkup, clear, restore, reportError, errorContext = () => ({}) }) {
  const before = currentMarkup();
  try {
    const result = action();
    if (currentMarkup() === before) clear();
    return result;
  } catch (error) {
    const context = errorContext() || {};
    const details = { code: safeErrorCode(error), message: String(error?.message || error), stack: error?.stack || null, ...context };
    console.error('CHOICE_ACTION_FAILED', details);
    reportError(error, details);
    if (!currentMarkup().trim()) restore();
    throw error;
  }
}

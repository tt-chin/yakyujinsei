export function runChoiceAction({ action, currentMarkup, clear, restore, reportError }) {
  const before = currentMarkup();
  try {
    const result = action();
    if (currentMarkup() === before) clear();
    return result;
  } catch (error) {
    console.error('CHOICE_ACTION_FAILED', error);
    reportError(error);
    if (!currentMarkup().trim()) restore();
    throw error;
  }
}

import { initializeDisplayPreferences } from './ui/preferences.js';
import { initializeBoardMenu } from './ui/board-menu.js';
import { initializeInformationDialogs } from './ui/information-dialog.js';

initializeDisplayPreferences();
const game=await import('./engine/game.js');
await game.initializeBrowserSave();
initializeBoardMenu();
initializeInformationDialogs();


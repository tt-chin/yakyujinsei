import { initializeDisplayPreferences } from './ui/preferences.js';
import { initializeBoardMenu } from './ui/board-menu.js';
import { initializeInformationDialogs } from './ui/information-dialog.js';

initializeDisplayPreferences();
await import('./engine/game.js');
document.getElementById('btn-start').disabled=false;
initializeBoardMenu();
initializeInformationDialogs();


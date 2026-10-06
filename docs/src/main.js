import { initializeDisplayPreferences } from './ui/preferences.js';

initializeDisplayPreferences();
await import('./engine/game.js');
document.getElementById('btn-start').disabled=false;


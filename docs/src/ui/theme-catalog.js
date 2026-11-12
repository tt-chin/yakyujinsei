// The one list of display themes (UI-DESIGN-TOKENS-04). The first entry is the default;
// each id needs a :root[data-theme="id"] block in styles/themes.css.
export const THEMES = Object.freeze([
  Object.freeze({id:'standard',label:'スタンダード'}),
  Object.freeze({id:'night',label:'ナイター'}),
  Object.freeze({id:'classic',label:'クラシック'}),
  Object.freeze({id:'scoreboard',label:'スコアボード'})
]);
export const THEME_IDS = Object.freeze(THEMES.map(theme=>theme.id));

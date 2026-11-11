// Share image colors come from the CSS theme tokens (share-image.js readThemeColors, UI-DESIGN-TOKENS-03); only the tag contrast guard stays here.
export function shareTagPalette(colors,theme){
  if(!['night','classic','scoreboard'].includes(theme))return colors;
  const luminance=hex=>{const rgb=hex.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  const bg=luminance(colors.bg),fg=luminance(colors.fg);
  return {...colors,fg:(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)>=4.5?colors.fg:'#302719'};
}

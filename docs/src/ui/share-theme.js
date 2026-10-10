const palettes={
  standard:{bg:'#fff8f8',panel:'#ffffff',edge:'#c9828e',text:'#3a1017',dim:'#875d64',accent:'#a71930',soft:'#6f4048',bad:'#c62828'},
  night:{bg:'#0d1117',panel:'#161b22',edge:'#65758a',text:'#f0f3f6',dim:'#b5bfca',accent:'#ff7187',soft:'#c3cad3',bad:'#ff817e'},
  classic:{bg:'#f4ecd8',panel:'#fffaf0',edge:'#9f8456',text:'#302719',dim:'#6f6048',accent:'#8b2f22',soft:'#70513c',bad:'#a62f2f'},
  scoreboard:{bg:'#0d2318',panel:'#143222',edge:'#6c9278',text:'#f4f0d9',dim:'#c0c9b6',accent:'#f0c75e',soft:'#b8c2ae',bad:'#ff8a82'}
};
export function getSharePalette(theme){return {...(Object.hasOwn(palettes,theme)?palettes[theme]:palettes.standard)};}
export function shareTagPalette(colors,theme){
  if(!Object.hasOwn(palettes,theme)||theme==='standard')return colors;
  const luminance=hex=>{const rgb=hex.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  const bg=luminance(colors.bg),fg=luminance(colors.fg);
  return {...colors,fg:(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)>=4.5?colors.fg:'#302719'};
}

// GameView refactor regression (OOP plan §2d.4): one step's #log/#act/#board DOM, S and RNG count;
// since §2g.4 also the player/career view models (read-only; every baseline since 08d0759 has these builders).
// game.js must be served with instrumentRng(...,'__rngCalls') and GAME_VIEW_HOOK appended.
export const GAME_VIEW_HOOK='\nwindow.__gameViewState=()=>({state:JSON.parse(JSON.stringify(S)),calls:window.__rngCalls||0,views:JSON.parse(JSON.stringify({player:buildPlayerViewModel(),career:buildCareerViewModel()}))});';

// Browser-side; passed by source. Waits for scrollBottom's rAF and the endGame override's setTimeout(0)
// before reading. Returns only a digest unless full is set, so long careers stay small in memory.
export async function captureGameView(full){
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  await new Promise(resolve=>setTimeout(resolve,0));
  const {state,calls,views}=window.__gameViewState();
  delete state.version;if(state.birthHighSchool)delete state.birthHighSchool.createdVersion;
  const dom=Object.fromEntries(['log','act','board'].map(id=>[id,document.getElementById(id)?.outerHTML??null]));
  const snapshot={dom,state,calls,views};
  if(full)return snapshot;
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(snapshot))));
  return {digest:[...bytes].map(b=>b.toString(16).padStart(2,'0')).join(''),done:!!state.done,year:state.year,calls};
}

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
  // Approved 1.13.4 UI-only delta: validate every new value before converting
  // this precise display section to its old representation for the OOP guard.
  // S, RNG, all old view fields and every other DOM byte remain strict.
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const money=v=>{v=Math.max(0,Math.round(n(v)));const oku=Math.floor(v/100000000),man=Math.floor((v%100000000)/10000);return(oku?oku+'億':'')+(man?man.toLocaleString()+'万円':oku?'円':'0円');};
  const expected=[['pay','年俸・報酬',n(state.careerBaseSalary)+n(state.corpIncome)],['incentive','出来高',n(state.careerIncentive)],['signing','契約金・支度金',n(state.careerSigningBonus)+n(state.careerDevelopmentStipend)],['buyout','契約解除補償金',n(state.careerBuyout)],['outside','スポンサー収入',n(state.careerOutsideIncome)],['total','生涯総収入',n(state.careerEarnings)]].map(([key,label,v])=>({key,label,value:money(v)}));
  const income=views.career.contract.incomeRows;
  if(window.__expectIncomeDisplay||income){
    if(JSON.stringify(income)!==JSON.stringify(expected))throw Error('INCOME_VIEW_CONTRACT_MISMATCH');
    delete views.career.contract.incomeRows;
  }
  const log=document.getElementById('log')?.cloneNode(true);
  const profile=[...log?.querySelectorAll('.card')||[]].find(e=>e.querySelector('h4')?.textContent==='キャリアプロフィール');
  if(profile){
    const dl=profile.querySelector('dl.income-summary');
    if(window.__expectIncomeDisplay&&!dl)throw Error('INCOME_RETIREMENT_MISSING');
    if(dl){
      if(JSON.stringify([...dl.querySelectorAll('dt')].map(e=>e.textContent))!==JSON.stringify(expected.map(r=>r.label))||JSON.stringify([...dl.querySelectorAll('dd')].map(e=>e.textContent))!==JSON.stringify(expected.map(r=>r.value)))throw Error('INCOME_RETIREMENT_CONTRACT_MISMATCH');
      dl.outerHTML=`<br>固定年俸累計：${money(state.careerBaseSalary)}｜契約金・育成支度金累計：${money(n(state.careerSigningBonus)+n(state.careerDevelopmentStipend))}<br>出来高累計：${money(state.careerIncentive)}｜買い取り累計：${money(state.careerBuyout)}<br>スポンサー収入累計：${money(state.careerOutsideIncome)}<br>社会人給与累計：${money(state.corpIncome)}<br>生涯総収入：<b class="hl" style="font-size:18px">${money(state.careerEarnings)}</b>`;
      dom.log=log.outerHTML;
    }
  }
  const snapshot={dom,state,calls,views};
  if(full)return snapshot;
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(snapshot))));
  return {digest:[...bytes].map(b=>b.toString(16).padStart(2,'0')).join(''),done:!!state.done,year:state.year,calls};
}

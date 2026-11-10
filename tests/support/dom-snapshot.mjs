// GameView refactor regression (OOP plan §2d.4): one step's #log/#act/#board DOM, S and RNG count;
// since §2g.4 also the player/career view models (read-only; every baseline since 08d0759 has these builders).
// game.js must be served with instrumentRng(...,'__rngCalls') and GAME_VIEW_HOOK appended.
export const GAME_VIEW_HOOK='\nwindow.__gameViewState=()=>({state:JSON.parse(JSON.stringify(S)),calls:window.__rngCalls||0,views:JSON.parse(JSON.stringify({player:buildPlayerViewModel(),career:buildCareerViewModel()}))});';

// Browser-side; passed by source. Waits for scrollBottom's rAF and the endGame override's setTimeout(0)
// before reading. Returns only a digest unless full is set, so long careers stay small in memory.
export async function captureGameView(full){
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  await new Promise(resolve=>setTimeout(resolve,0));
  const captured=window.__gameViewState(),{calls,views}=captured,rawState=captured.state;
  if(window.__projectFranchise){
    const previous=window.__previousFranchiseState;
    if(previous&&!previous.traits.franchise&&rawState.traits.franchise)window.__franchiseGrant=window.__verifyFranchise(previous,rawState);
    window.__previousFranchiseState=rawState;
  }
  const projected=window.__projectFranchise?window.__projectFranchise(rawState,window.__franchiseGrant):rawState;
  const state=window.__expect1140?window.__projectChampionmaker(projected,window.__champTeams):projected;
  delete state.version;if(state.birthHighSchool)delete state.birthHighSchool.createdVersion;
  const dom=Object.fromEntries(['log','act','board'].map(id=>[id,document.getElementById(id)?.outerHTML??null]));
  if(window.__expectBrowserSave){
    const board=document.getElementById('board').cloneNode(true),live=board.querySelector('#save-live');
    if(!live||board.querySelectorAll('#save-live').length!==1||live.children.length!==3)throw Error('SAVE_STATUS_STRUCTURE');
    const [status,unsaved,home]=live.children;
    if(status.getAttribute('role')!=='status'||unsaved.id!=='save-continue-unsaved'||unsaved.textContent!=='セーブせずに続ける'||home.id!=='save-return-title'||!['タイトルへ','タイトルで最新データを読む'].includes(home.textContent))throw Error('SAVE_STATUS_CONTROLS');
    if(!/セーブ|再開|保存/.test(status.textContent))throw Error('SAVE_STATUS_MESSAGE');
    const year=status.textContent.match(/^(\d{4})年/);if(year&&Number(year[1])>rawState.year)throw Error('SAVE_STATUS_FUTURE_YEAR');
    live.remove();dom.board=board.outerHTML;
  }
  if(window.__expect1141){
    // Approved 1.14.1 UI-only delta: the credits menu button. Validate its exact
    // markup once, then drop only that button; every other #board byte stays strict.
    const credits='\n        <button type="button" id="board-credits" data-information="credits" aria-haspopup="dialog"><span class="menu-bullet" aria-hidden="true">•</span>クレジット・使用素材</button>';
    if(typeof dom.board!=='string'||dom.board.split(credits).length!==2)throw Error('CREDITS_MENU_CONTRACT');
    dom.board=dom.board.replace(credits,'');
  }
  if(window.__expectDesignTokens02){
    // Approved UI-DESIGN-TOKENS-02 (DESIGN_SYSTEM_PLAN §8 D6): validate the class markup of
    // #bd-team exactly, then map it back to the old inline styles; every other #board byte stays strict.
    const tpl=document.createElement('template');tpl.innerHTML=dom.board;
    const team=tpl.content.querySelector('#bd-team'),kids=[...team.children];
    const color=el=>{const m=(el.getAttribute('style')||'').match(/^--team-color:([^;"]+)$/);if(!m)throw Error('TEAM_BADGE_COLOR_CONTRACT');return m[1];};
    const only=(el,attrs)=>{if(el.attributes.length!==attrs.length||attrs.some(a=>!el.hasAttribute(a)))throw Error('TEAM_BADGE_ATTR_CONTRACT');};
    if(kids.length===1){
      if(kids[0].className!=='team-name')throw Error('TEAM_NAME_CONTRACT');only(kids[0],['class']);
      team.innerHTML='<span style="color:var(--amber);  font-weight:900;">'+kids[0].innerHTML+'</span>';
    }else if(kids.length===2){
      const [dot,label]=kids,white=dot.className==='team-badge-dot is-white';
      if(!white&&dot.className!=='team-badge-dot'||label.className!=='team-name team-badge'+(white?' is-white':'')||dot.childNodes.length)throw Error('TEAM_BADGE_CONTRACT');
      for(const el of kids)only(el,white?['class']:['class','style']);
      const tc=white?null:color(dot);if(!white&&color(label)!==tc)throw Error('TEAM_BADGE_COLOR_CONTRACT');
      team.innerHTML='<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+(white?'#cccccc':tc)+';margin-right:6px;vertical-align:middle;box-shadow:0 0 2px rgba(0,0,0,0.2);"></span><span style="color:'+(white?'#000000':tc)+'; background:#ffffff; padding:2px 8px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.4); font-weight:900;">'+label.innerHTML+'</span>';
    }else if(kids.length)throw Error('TEAM_BADGE_CONTRACT');
    dom.board=tpl.innerHTML;
  }
  if(window.__expect1140){
    // Independently validate the approved TJ presentation before mapping only
    // that value back to the fixed historical view-model representation.
    if(rawState.pos==='P'){
      const rows=views.player.ability.condition.filter(r=>r.label==='TJゲージ');
      if(rows.length!==1||rows[0].value!==Number(rawState.tj||0).toFixed(1)+' / '+(rawState.traits.rubber?100:50))throw Error('TJ_DISPLAY_CONTRACT');
      rows[0].value=String(rawState.tj||0);
    }
    const spans=[...document.querySelectorAll('#bd-team > span')];
    if(spans.length===2){
      for(const [i,expected] of ['0 0 2px rgba(0,0,0,0.2)','0 2px 4px rgba(0,0,0,0.4)'].entries()){
        // Computed style: the shadow comes from inline styles on old baselines and from classes since UI-DESIGN-TOKENS-02.
        const probe=document.createElement('span');probe.style.boxShadow=expected;document.body.append(probe);
        const same=getComputedStyle(spans[i]).boxShadow===getComputedStyle(probe).boxShadow;probe.remove();
        if(!same)throw Error('BOARD_SHADOW_CONTRACT');
      }
      for(const alpha of ['0.2','0.4']){
        const before='rgba(0,0,0,'+alpha+')';
        if(dom.board.split(before).length!==2)throw Error('BOARD_SHADOW_MARKUP_CONTRACT');
        dom.board=dom.board.replace(before,'rgba(0、0、0、'+alpha+')');
      }
    }
    const active=views.player.traits.active,owned=rawState.traits.championmaker;
    if(active.filter(x=>x==='優勝請負人').length!==(owned?1:0))throw Error('CHAMPIONMAKER_VIEW_CONTRACT');
    if(owned)active.splice(active.indexOf('優勝請負人'),1);
  }
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
  if(window.__expectDesignTokens02&&log){
    // Approved UI-DESIGN-TOKENS-02 (DESIGN_SYSTEM_PLAN §8 D2/D5): retirement trait tags carry a category
    // class instead of inline colors. Validate each tag, then restore the old inline style attribute.
    const old={'tag':'','tag tag-legend':'background:#fff7dc;border-color:#c79520;color:#795b00','tag tag-goldcloth':'background:#fffbe0;border-color:#c5a800;color:#6f6000','tag tag-genius':'background:#f3f5f8;border-color:#9aa5b5;color:#4c5868','tag tag-negative':'background:#fff0f0;border-color:#c0392b;color:#a71930','tag tag-removed':'text-decoration:line-through;opacity:.4;color:#8a8a8a;border-color:#4a4a4a'};
    const tags=profile?[...profile.querySelectorAll('.tag')]:[];
    if(log.querySelectorAll('.tag-legend,.tag-goldcloth,.tag-genius,.tag-negative,.tag-removed,.tag-mrteam,.team-badge,.team-badge-dot,.team-name').length!==tags.filter(t=>t.className!=='tag').length)throw Error('DESIGN_TOKENS_TAG_SCOPE');
    for(const tag of tags){
      const cls=tag.className;
      if(cls==='tag tag-mrteam'){
        const m=tag.getAttribute('style')?.match(/^--team-color:([^;"]+)$/);
        if(!m||tag.attributes.length!==2)throw Error('DESIGN_TOKENS_MRTEAM_CONTRACT');
        tag.setAttribute('style','background:#ffffff;border-color:'+m[1]+';color:'+m[1]);
      }else{
        if(!(cls in old)||tag.attributes.length!==1)throw Error('DESIGN_TOKENS_TAG_CONTRACT: '+cls);
        tag.setAttribute('style',old[cls]);
      }
      tag.className='tag';
    }
    dom.log=log.outerHTML;
  }
  if(window.__expect1140){
    const cards=[...log.querySelectorAll('[data-trait-name="優勝請負人"]')];
    if(cards.length!==(rawState.traits.championmaker?1:0))throw Error('CHAMPIONMAKER_ACQUISITION_CARD_COUNT');
    for(const node of cards){
      const title=node.querySelector('h4')?.textContent,year=node.closest('.yr-block')?.querySelector('.yr-head')?.textContent;
      if(!node.classList.contains('card')||!node.classList.contains('gold')||!['優勝請負人','隠し特性解放：優勝請負人'].includes(title)||!year?.includes(String(rawState.championmakerAcquiredYear)))throw Error('CHAMPIONMAKER_ACQUISITION_CARD_IDENTITY');
      if(node.dataset.traitResult==='championmaker'&&!node.textContent.includes('追加効果のない名誉特性'))throw Error('CHAMPIONMAKER_ACQUISITION_DESCRIPTION');
      node.remove();
    }
    if(profile&&rawState.traits.championmaker){
      const tags=[...profile.querySelectorAll('.tag')].filter(t=>t.textContent==='優勝請負人');
      if(tags.length!==1)throw Error('CHAMPIONMAKER_RETIREMENT_CONTRACT');
      const tag=tags[0],space=tag.previousSibling?.nodeType===Node.TEXT_NODE&&tag.previousSibling.nodeValue===' '?tag.previousSibling:tag.nextSibling?.nodeType===Node.TEXT_NODE&&tag.nextSibling.nodeValue===' '?tag.nextSibling:null;
      space?.remove();tag.remove();
      if(!profile.querySelector('.tag'))for(const text of profile.childNodes)if(text.nodeType===Node.TEXT_NODE)text.nodeValue=text.nodeValue.replace('特性：','特性：（なし）');
    }
    dom.log=log.outerHTML;
  }
  if(window.__hofDisplay&&rawState.done){window.__projectHofLog(log,window.__hofDisplay());dom.log=log.outerHTML;}
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

// Exact approved display contract, shared by DOM and display-preference guards.
export function projectHofLog(log,hofModels){
    // Verify the complete new blocks first, then map only these approved UI
    // fields back to the frozen historical representation. Grades, retirement
    // effects, complete S, other DOM and RNG remain compared by the caller.
    const models=Object.values(hofModels);
    const cards=title=>[...log.querySelectorAll('.card')].filter(n=>n.querySelector('h4')?.textContent===title);
    const exact=(title,body)=>{const nodes=cards(title),expected=document.createElement('div');expected.innerHTML='<h4>'+title+'</h4>'+body;if(nodes.length!==1||nodes[0].className!=='card info'||nodes[0].attributes.length!==1||nodes[0].innerHTML!==expected.innerHTML)throw Error('HOF_DETAIL_DOM_CONTRACT: '+title);nodes[0].remove();};
    for(const {current:t,old,label} of models){
      if(t.i!==old.i)throw Error('HOF_GRADE_CHANGE_REQUIRES_RETIREMENT_CAUSAL_ORACLE: '+label);
      const d=t.details;
      exact(label+' 評価の内訳',`一軍成績：${Number(t.base.toFixed(2))}点<br>個人賞：${d.personal.reduce((n,r)=>n+r.sc,0)}点<br>球団優勝：${d.team.reduce((n,r)=>n+r.sc,0)}点<br>特性の功績：${d.other.reduce((n,r)=>n+r.sc,0)}点<br>国際大会・代表の栄誉：殿堂評価への加点なし${d.international.length?'（'+d.international.length+'件）':''}<br>${d.personal.concat(d.team,d.other).map(r=>r.text+'：'+r.sc+'点').join('<br>')}`);
    }
    const intl=[...new Set(models.flatMap(({current:t})=>t.details.international.map(r=>r.text)))];
    if(intl.length)exact('国際大会・代表の栄誉',intl.join('<br>')+'<br>各リーグの殿堂評価には加算しません。');
    else if(cards('国際大会・代表の栄誉').length)throw Error('HOF_UNEXPECTED_INTERNATIONAL_CARD');
    if(models.length){
      const nodes=cards('通算評価'),expected=document.createElement('div');
      expected.innerHTML='<h4>通算評価</h4>'+models.map(({current:t})=>`<span class="tag">${t.name}${t.reason?'（'+t.reason+'）':''}</span>（評価点${t.sc}${t.belowThreshold?'・基準未達':''}${t.hasFirstTeam===false?'・一軍成績の記録なし':''}）`).join('<br>');
      if(nodes.length!==1||nodes[0].className!=='card gold'||nodes[0].attributes.length!==1||nodes[0].innerHTML!==expected.innerHTML)throw Error('HOF_RATING_DOM_CONTRACT');
      nodes[0].innerHTML='<h4>通算評価</h4>'+models.map(({old:t})=>`<span class="tag">${t.name}</span>（評価点${t.sc}）`).join('<br>');
    }
}

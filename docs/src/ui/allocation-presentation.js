// Read-only presentation of the existing allocation closure and its rendered resources.
// Never calls growth rules, changes S, creates a second draft or confirms a choice.
export class AllocationPresentation {
  constructor({documentRef,getDecision}){
    this.doc=documentRef;this.getDecision=getDecision;this.act=documentRef.getElementById('act');
    this.home=documentRef.getElementById('view-home');this.sessions=new WeakMap();
    this.act.addEventListener('focusin',event=>{const target=event.target.closest('.abrow,#al-btm button');if(target)this.focusTarget=target;});
  }
  stopReveal(){this.cancelReveal?.();this.cancelReveal=null;}
  visibleBounds(){
    const win=this.doc.defaultView,visual=win.visualViewport;
    return {top:Math.max(visual?.offsetTop||0,this.doc.getElementById('main-nav').getBoundingClientRect().bottom),bottom:Math.min(win.innerHeight,(visual?.offsetTop||0)+(visual?.height??win.innerHeight))};
  }
  revealConfirmation(view,footer,confirm){
    this.stopReveal();
    const win=this.doc.defaultView,visual=win.visualViewport,listeners=[];let frame=0;
    const valid=()=>this.getDecision()===view&&!this.home.hidden&&confirm.isConnected&&footer.contains(confirm)&&!this.doc.querySelector('dialog[open]');
    const reveal=()=>{
      frame=0;if(!valid()){this.stopReveal();return;}
      const bounds=this.visibleBounds(),gap=Math.max(0,win.innerHeight-bounds.bottom);
      this.doc.documentElement.style.setProperty('--allocation-viewport-gap',gap+'px');
      const box=confirm.getBoundingClientRect(),padding=Math.max(0,(parseFloat(win.getComputedStyle(footer).paddingBottom)||0)-gap);
      if(box.bottom>bounds.bottom-padding+1||box.top<bounds.top)footer.scrollIntoView({block:'end',behavior:'instant'});
    };
    const schedule=()=>{if(!frame)frame=win.requestAnimationFrame(reveal);};
    const listen=(target,type,handler)=>{target?.addEventListener(type,handler,{passive:true});if(target)listeners.push([target,type,handler]);};
    // Follow toolbar/viewport changes only until the next intentional user action.
    // Never fight manual reading, reopen an old decision, or move keyboard focus.
    for(const type of ['pointerdown','touchstart','wheel','keydown'])listen(this.doc,type,()=>this.stopReveal());
    listen(this.doc,'yakyujinsei:mainview',()=>this.stopReveal());
    listen(win,'resize',schedule);listen(visual,'resize',schedule);listen(visual,'scroll',schedule);
    this.cancelReveal=()=>{if(frame)win.cancelAnimationFrame(frame);for(const [target,type,handler] of listeners)target.removeEventListener(type,handler);};
    schedule();
  }
  clear(){this.stopReveal();this.home?.removeAttribute('data-allocation-open');this.act.removeAttribute('data-allocation-session');this.observer?.disconnect();this.observedFooter=null;for(const name of ['--allocation-footer-height','--allocation-viewport-gap'])this.doc.documentElement.style.removeProperty(name);}
  sync(){
    const view=this.getDecision();
    if(view?.kind!=='ALLOCATION'||!this.act.querySelector('#al-rows')){this.clear();return;}
    if(this.currentView!==view){this.focusTarget=null;this.currentView=view;}
    let session=this.sessions.get(view);
    if(!session){session={abilities:{...view.state.ab},carry:{...view.state.carry}};this.sessions.set(view,session);}
    this.home.dataset.allocationOpen='';this.act.dataset.allocationSession=this.act.dataset.decisionId;
    const dice=this.act.querySelector('#dice'),pool=this.act.querySelector('#al-top .pool');
    // Consume the original renderer's resource count; do not duplicate any growth/cost rule.
    const remaining=dice?dice.querySelectorAll('.die:not(.used)').length:Number(pool?.textContent.match(/：\s*(\d+)/)?.[1]);
    if(!Number.isFinite(remaining))return;
    const unit=dice?'サイコロ':'ポイント',resource=`残り${unit}：${remaining}${dice?'個':'点'}`;
    let period=this.act.querySelector('[data-allocation-period]');
    if(!period){period=this.doc.createElement('p');period.dataset.allocationPeriod='';this.act.prepend(period);}
    period.textContent=`${view.year}年`;
    let guide=this.act.querySelector('[data-allocation-guide]');
    if(!guide){
      guide=this.doc.createElement('details');guide.dataset.allocationGuide='';
      const summary=this.doc.createElement('summary');summary.textContent='配分方法';guide.append(summary);
      const title=this.act.querySelector(':scope > .title'),original=this.doc.createElement('div');original.dataset.allocationOriginal='';
      original.append(...title.childNodes);guide.append(original);title.textContent=dice?'トレーニング':original.textContent;
      for(const text of ['サイコロは表示順に1個ずつ、ポイントは1点ずつ能力へ投入します。','現在値・潜在能力と育成点の進捗を確認してください。潜在能力を超えると必要な育成点が増えます。','「元に戻す」「すべてリセット」で今回の配分を戻せます。資料を見て戻っても同じ訓練を続けられます。']){
        const p=this.doc.createElement('p');p.textContent=text;guide.append(p);
      }
      this.act.querySelector('#al-top').after(guide);
    }
    for(const row of this.act.querySelectorAll('#al-rows .abrow')){
      const key=row.dataset.abilityKey,now=view.state.ab[key],before=session.abilities[key];
      const preview=this.doc.createElement('span');preview.dataset.allocationPreview='';preview.id='allocation-preview-'+key;
      const gain=now-before,carry=view.state.carry?.[key]||0;
      preview.textContent=`今回 ${before} → ${now}（${gain>=0?'+':''}${gain}）｜育成点 ${row.querySelector('.progress').textContent}｜繰越 ${session.carry[key]||0} → ${carry}`;
      row.querySelector('[data-allocation-preview]')?.remove();row.querySelector('[data-allocation-action]')?.remove();
      row.setAttribute('aria-describedby',preview.id);row.append(preview);
      const action=this.doc.createElement('span');action.dataset.allocationAction='';action.setAttribute('aria-hidden','true');
      action.textContent=now>=80?'上限':remaining===0?'配分済み':dice?'サイコロを投入':'+1ポイント';row.append(action);
    }
    const footer=this.act.querySelector('#al-btm');
    footer.querySelector('[data-allocation-status]')?.remove();footer.querySelector('[data-allocation-confirm-placeholder]')?.remove();
    const status=this.doc.createElement('p');status.dataset.allocationStatus='';status.id='allocation-status';
    const confirm=footer.querySelector('.main'),allCap=[...this.act.querySelectorAll('.abrow')].every(row=>row.classList.contains('capped'));
    status.textContent=resource+'｜'+(remaining>0&&!allCap?(dice?'残りのサイコロを割り当ててください':'残りのポイントを配分してください'):remaining>0?`上限のため、残りの${unit}は確定時に破棄されます。`:'配分内容を確認して確定してください');
    if(dice){status.setAttribute('role','status');status.setAttribute('aria-live','polite');}
    footer.prepend(status);
    if(!confirm){const disabled=this.doc.createElement('button');disabled.type='button';disabled.className='btn main';disabled.dataset.allocationConfirmPlaceholder='';disabled.disabled=true;disabled.textContent='確定 ▸';disabled.setAttribute('aria-describedby','allocation-status');footer.append(disabled);}
    // The old cap label says dice even in point mode. Correct only this display copy.
    if(confirm&&!dice&&allCap&&remaining>0)confirm.textContent='能力が上限に達しました。残ったポイントを捨てます ▸';
    // Only the transition to a usable native confirm button requests scrolling.
    // Wait for the original renderer's focus step; never confirm or mutate a draft.
    const ready=Boolean(confirm),becameReady=session.ready===false&&ready;session.ready=ready;
    if(becameReady)this.revealConfirmation(view,footer,confirm);
    else if(!ready)this.stopReveal();
    if(this.observedFooter!==footer){
      this.observer?.disconnect();this.observedFooter=footer;
      const measure=()=>{if(!this.home.hidden&&footer.isConnected&&this.act.hasAttribute('data-allocation-session'))this.doc.documentElement.style.setProperty('--allocation-footer-height',`${this.doc.defaultView.getComputedStyle(footer).position==='sticky'?footer.getBoundingClientRect().height:0}px`);};
      if(this.doc.defaultView.ResizeObserver){this.observer=new this.doc.defaultView.ResizeObserver(measure);this.observer.observe(footer);}
      measure();
    }
  }
  returnTarget(){
    if(this.getDecision()?.kind!=='ALLOCATION'||!this.act.hasAttribute('data-allocation-session'))return null;
    const {top,bottom:visibleBottom}=this.visibleBounds(),footer=this.act.querySelector('#al-btm');
    const gap=parseFloat(this.doc.documentElement.style.getPropertyValue('--allocation-viewport-gap'))||0;
    const bottom=visibleBottom-Math.max(0,(footer?parseFloat(this.doc.defaultView.getComputedStyle(footer).paddingBottom)||0:0)-gap);
    const candidates=[this.focusTarget,...this.act.querySelectorAll('.abrow[aria-disabled="false"],#al-btm button:not(:disabled),[data-allocation-guide]>summary')];
    return candidates.find(node=>{if(!node?.isConnected||!this.act.contains(node))return false;const b=node.getBoundingClientRect();return b.height>0&&b.top>=top&&b.bottom<=bottom&&node.contains(this.doc.elementFromPoint(b.x+b.width/2,b.y+b.height/2));})||this.act.querySelector(':scope > .title');
  }
}

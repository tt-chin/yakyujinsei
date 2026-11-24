// Presentation lifetime only. Choice objects are read; no S, persistence or RNG writes.
const PHASES=['シーズン前','シーズン中','シーズン終了'];
function stripEventTitlePrefix(node){
  const label=node.querySelector('.event-badge')?.nextSibling||node.firstChild;
  if(label?.nodeType===3)label.nodeValue=label.nodeValue.replace(/^(?:イベントカード|イベント)｜/,'');
  return label;
}
export class DecisionPresentation {
  constructor({documentRef,getDecision,getYear,getPhase,getState=()=>null,getReturnTarget=()=>null}){
    this.doc=documentRef;this.win=documentRef.defaultView;this.getDecision=getDecision;this.getYear=getYear;this.getPhase=getPhase;
    this.getReturnTarget=getReturnTarget;
    this.getState=getState;this.scrollRevision=0;this.summaryYears=new WeakMap();
    this.act=documentRef.getElementById('act');this.log=documentRef.getElementById('log');
    this.returnButton=documentRef.getElementById('decision-return');this.jump=documentRef.getElementById('decision-jump');
    this.toggleButton=documentRef.getElementById('act-toggle');this.views=new WeakMap();this.sequence=0;this.cardSequence=0;this.view='home';
    if(!this.jump)return;
    for(const type of ['pointerdown','touchstart','touchmove','wheel','keydown'])documentRef.addEventListener(type,event=>{
      // A repeated native tap on an action is not a manual reading gesture.
      // Keep the original accepted result's focus unless a summary is pending.
      if(type==='pointerdown'&&event.detail>1)return;
      if(['pointerdown','touchstart'].includes(type)&&this.act.contains(event.target)&&!this.summaryScroll)return;
      this.cancelSeasonScroll();
    },{capture:true,passive:true});
    documentRef.addEventListener('focusin',event=>{if(event.target.closest('dialog[open],.salary-detail-panel:not([hidden])'))this.cancelSeasonScroll();},true);
    this.dialogObserver=new this.win.MutationObserver(()=>this.cancelSeasonScroll());
    for(const panel of documentRef.querySelectorAll('dialog,.salary-detail-panel'))this.dialogObserver.observe(panel,{attributes:true,attributeFilter:['open','hidden']});
    this.returnButton.addEventListener('click',()=>this.returnToDecision(true));
    this.jump.addEventListener('click',()=>this.jumpForward());
    const schedule=()=>this.scheduleJump();
    const reading=event=>{if(this.view==='home'&&!this.act.contains(event.target))this.readingRequested=true;};
    documentRef.addEventListener('wheel',reading,{capture:true,passive:true});
    documentRef.addEventListener('touchmove',reading,{capture:true,passive:true});
    documentRef.addEventListener('pointerdown',event=>{if(this.log.contains(event.target)||event.target===documentRef.documentElement)reading(event);},true);
    documentRef.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))reading(event);},true);
    documentRef.addEventListener('scroll',schedule,{capture:true,passive:true});
    this.win.addEventListener('resize',schedule,{passive:true});
    this.win.visualViewport?.addEventListener('resize',schedule,{passive:true});
    this.win.visualViewport?.addEventListener('scroll',schedule,{passive:true});
    documentRef.addEventListener('toggle',schedule,true);
    this.resizeObserver=new this.win.ResizeObserver(schedule);
    for(const id of ['act','log','board','main-nav','view-host'])this.resizeObserver.observe(documentRef.getElementById(id));
    this.mutationObserver=new this.win.MutationObserver(schedule);
    this.mutationObserver.observe(this.act,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class','style','hidden']});
    this.mutationObserver.observe(documentRef.documentElement,{attributes:true,attributeFilter:['style','data-theme','data-font-size','data-density']});
    this.act.addEventListener('keydown',event=>{if(event.repeat&&this.getDecision()?.kind==='CHOICE'&&event.target.closest('button')){event.preventDefault();event.stopImmediatePropagation();}},true);
    this.act.addEventListener('click',event=>this.captureSelection(event),true);
    documentRef.addEventListener('yakyujinsei:mainview',event=>this.navigate(event.detail));
  }
  plain(html){const t=this.doc.createElement('template');t.innerHTML=html||'';return t.content.textContent.trim();}
  cancelSeasonScroll(){
    // Outside a summary request, retain the existing result/choice focus flow.
    if(!this.summaryScroll)return;
    this.scrollRevision++;this.summaryScroll=null;
    if(this.summaryFrame)this.win.cancelAnimationFrame(this.summaryFrame);this.summaryFrame=0;
  }
  canScrollBottom(revision){return revision===this.scrollRevision&&!this.summaryScroll&&this.view==='home'&&!this.doc.querySelector('dialog[open],.salary-detail-panel:not([hidden])');}
  revealSeasonSummary(root,state,year){
    let years=this.summaryYears.get(state);if(!years){years=new Set();this.summaryYears.set(state,years);}
    if(years.has(year))return;years.add(year);
    // This is a one-shot presentation request, not a pending game action. Never
    // replay a skipped/cancelled request when returning from reading or a dialog.
    const reading=this.isReadingHistory();this.cancelSeasonScroll();this.scrollRevision++;
    if(reading||this.view!=='home'||this.doc.getElementById('view-home').hidden||this.doc.querySelector('dialog[open],.salary-detail-panel:not([hidden])'))return;
    const request={root,state,year};this.summaryScroll=request;
    const valid=()=>this.summaryScroll===request&&root.isConnected&&this.getState()===state&&this.getYear()===year&&this.view==='home'&&!this.doc.getElementById('view-home').hidden&&!this.doc.querySelector('dialog[open],.salary-detail-panel:not([hidden])');
    // Wait for the originating native choice and header layout to finish. Read
    // the heading again because the same summary may be repainted in this turn.
    this.summaryFrame=this.win.requestAnimationFrame(()=>{
      this.summaryFrame=this.win.requestAnimationFrame(()=>{
        this.summaryFrame=0;if(!valid()){if(this.summaryScroll===request)this.cancelSeasonScroll();return;}
        const heading=root.querySelector('h2');if(heading)this.reveal(heading);
        this.scheduleJump();
      });
    });
  }
  phaseText(){return PHASES[this.getPhase()]||'進行中';}
  sync(){
    if(!this.jump)return;
    const view=this.getDecision(),has=this.act.children.length>0&&this.act.style.display!=='none';
    if(!has||!view){this.clear();return;}
    const key=view.kind==='CHOICE'?view.opts:view;
    if(!key||typeof key!=='object'){this.clear();return;}
    let meta=this.views.get(key);
    if(!meta||meta.owner!==view.state||meta.year!==view.year){meta={id:'decision-'+(++this.sequence),collapsed:false,owner:view.state,year:view.year};this.views.set(key,meta);}
    this.current=meta;
    const continuation=view.kind==='CHOICE'&&!this.plain(view.title)&&view.opts.length===1;
    if(continuation)meta.collapsed=false;
    const titleTemplate=this.doc.createElement('template');titleTemplate.innerHTML=view.title||'';const titleLabel=stripEventTitlePrefix(titleTemplate.content);

    this.act.dataset.decisionId=meta.id;this.act.dataset.decisionKind=view.kind;
    this.act.dataset.eventChoice=String(view.kind==='CHOICE'&&String(view.title).includes('event-badge'));
    this.act.classList.toggle('collapsed',meta.collapsed);
    const titleNode=this.act.querySelector(':scope > .title');
    if(titleNode){
      const label=titleNode.querySelector('.event-badge')?.nextSibling||titleNode.firstChild;
      if(view.kind==='CHOICE'&&label?.nodeType===3&&titleLabel?.nodeType===3)label.nodeValue=titleLabel.nodeValue;
      titleNode.tabIndex=-1;titleNode.dataset.readerFocus='';
    }
    this.targetHeading=titleNode||view.buttons?.[0]||this.act;
    this.toggleButton.setAttribute('aria-controls','act');this.toggleButton.setAttribute('aria-expanded',String(!meta.collapsed));
    this.toggleButton.style.display='none';this.returnButton.hidden=this.view==='home';
    this.scheduleJump();
  }
  clear(){
    if(!this.jump)return;
    this.current=null;this.jump.hidden=true;this.returnButton.hidden=true;
    for(const key of ['decisionId','decisionKind','eventChoice'])delete this.act.dataset[key];
    this.toggleButton.setAttribute('aria-expanded','false');
  }
  live(){
    const view=this.getDecision();
    return Boolean(this.current&&view&&view.year===this.getYear()&&view.state?.year===view.year&&!view.accepted&&(view.kind!=='CHOICE'||view.opts.length>0)&&this.act.children.length&&this.act.style.display!=='none');
  }
  bounds(){
    const visual=this.win.visualViewport,top=visual?.offsetTop||0;
    return {top:Math.max(top,this.doc.getElementById('main-nav').getBoundingClientRect().bottom),bottom:Math.min(this.win.innerHeight,top+(visual?.height??this.win.innerHeight))};
  }
  scrollParents(node){
    const parents=[];
    for(let p=node.parentElement;p&&p!==this.doc.body;p=p.parentElement)if(/auto|scroll/.test(this.win.getComputedStyle(p).overflowY)&&p.scrollHeight>p.clientHeight+1)parents.push(p);
    return parents;
  }
  visibleBounds(node){
    const bounds=this.bounds();
    for(const p of this.scrollParents(node)){const r=p.getBoundingClientRect();bounds.top=Math.max(bounds.top,r.top+p.clientTop);bounds.bottom=Math.min(bounds.bottom,r.top+p.clientTop+p.clientHeight);}
    const footer=this.act.querySelector('#al-btm');
    if(footer&&!footer.contains(node)&&this.win.getComputedStyle(footer).position==='sticky')bounds.bottom=Math.min(bounds.bottom,footer.getBoundingClientRect().top);
    return bounds;
  }
  controls(){return [...this.act.querySelectorAll('button,.abrow[role="button"]')].filter(e=>!e.disabled&&e.getAttribute('aria-disabled')!=='true'&&!e.hidden&&e.getClientRects().length);}
  lowestControl(){return this.controls().filter(node=>node.getBoundingClientRect().bottom>this.visibleBounds(node).bottom+1).sort((a,b)=>a.getBoundingClientRect().bottom-b.getBoundingClientRect().bottom).at(-1);}
  remaining(){
    if(!this.live()||this.view!=='home'||this.doc.getElementById('view-home').hidden)return false;
    if(this.current.collapsed)return true;
    return this.controls().some(node=>node.getBoundingClientRect().bottom>this.visibleBounds(node).bottom+1);
  }
  scheduleJump(){if(this.jumpFrame)return;this.jumpFrame=this.win.requestAnimationFrame(()=>{this.jumpFrame=0;this.updateJump();});}
  updateJump(){
    this.readingHistory=this.isReadingHistory();
    const visible=this.remaining()&&!this.doc.querySelector('dialog[open],.salary-detail-panel:not([hidden])');
    if(!visible&&this.doc.activeElement===this.jump)this.targetHeading?.focus({preventScroll:true});
    this.jump.hidden=!visible;
    if(!visible)return;
    const b=this.bounds(),main=this.doc.getElementById('game-main').getBoundingClientRect(),size=48;
    this.jump.style.left=Math.max(size/2,Math.min(this.win.innerWidth-size/2,main.left+main.width/2))+'px';
    const desired=Math.max(b.top,b.bottom-size-8),x=parseFloat(this.jump.style.left);
    // Prefer the nearest inter-button boundary when a dense choice fills the screen.
    // The circular control must leave native action centers available for activation.
    const rects=this.controls().map(e=>e.getBoundingClientRect()),candidates=[desired];
    for(const r of rects)candidates.push(r.top-size/2-4,r.bottom-size/2+4);
    const safe=y=>y>=b.top&&y+size<=b.bottom-8&&!rects.some(r=>Math.abs(x-(r.left+r.width/2))<size/2+2&&r.top+r.height/2>=y-2&&r.top+r.height/2<=y+size+2);
    this.jump.style.top=(candidates.filter(safe).sort((a,c)=>Math.abs(a-desired)-Math.abs(c-desired))[0]??desired)+'px';
  }
  reveal(node,block='start'){
    // Move inner containers first; then the page. Never scroll #log to reach #act.
    for(const p of this.scrollParents(node)){
      const r=node.getBoundingClientRect(),box=p.getBoundingClientRect(),top=box.top+p.clientTop,bottom=top+p.clientHeight;
      const delta=block==='start'?r.top-top:Math.max(0,r.bottom-bottom);
      p.scrollBy({top:delta,behavior:'instant'});
    }
    const r=node.getBoundingClientRect(),b=this.bounds(),delta=block==='start'?r.top-b.top-8:Math.max(0,r.bottom-b.bottom+8);
    this.win.scrollBy({top:delta,behavior:'instant'});
  }
  jumpForward(){
    if(!this.live())return;
    const b=this.bounds(),r=this.targetHeading.getBoundingClientRect();
    if(this.current.collapsed||r.top>=b.bottom||r.bottom>b.bottom){this.returnToDecision(true);return;}
    const last=this.lowestControl();if(!last)return;
    const parents=this.scrollParents(last),host=parents.find(p=>p.scrollTop+p.clientHeight<p.scrollHeight-1);
    const bounds=this.visibleBounds(last),amount=Math.max(44,(bounds.bottom-bounds.top)*.8);
    const behavior=this.win.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
    if(host)host.scrollBy({top:amount,behavior});else this.win.scrollBy({top:Math.min(amount,Math.max(0,last.getBoundingClientRect().bottom-bounds.bottom+8)),behavior});
    this.scheduleJump();
  }
  isReadingHistory(){
    if(this.view!=='home')return true;
    if(!this.readingRequested)return false;
    if(this.win.getComputedStyle(this.log).overflowY==='auto'&&this.log.scrollHeight>this.log.clientHeight+1)return this.log.scrollTop+this.log.clientHeight<this.log.scrollHeight-2;
    return this.current&&this.act.children.length?this.act.getBoundingClientRect().top>this.bounds().bottom:Boolean(this.readingHistory);
  }
  toggle(){if(!this.current)return;const opening=this.current.collapsed;if(!opening)this.current.actionScroll=this.act.scrollTop;this.current.collapsed=!this.current.collapsed;this.sync();if(opening)this.act.scrollTop=this.current.actionScroll||0;}
  scrollState(){return {id:this.current?.id,page:[this.win.scrollX,this.win.scrollY],log:this.log.scrollTop,act:this.act.scrollTop,home:this.doc.getElementById('view-home').scrollTop,host:this.doc.getElementById('view-host').scrollTop};}
  navigate({stage,view,previous}){
    if(stage==='before')this.cancelSeasonScroll();
    if(stage==='before'&&previous==='home'&&view!=='home')this.homeScroll=this.scrollState();
    if(stage!=='after')return;
    this.view=view;this.returnButton.hidden=!this.live()||view==='home';
    if(view==='home'&&this.current&&this.homeScroll?.id===this.current.id){
      const saved=this.homeScroll;
      this.log.scrollTop=saved.log;this.act.scrollTop=saved.act;this.doc.getElementById('view-host').scrollTop=saved.host;
      this.doc.getElementById('view-home').scrollTop=saved.home;
      this.win.scrollTo(...saved.page);
    }
    this.scheduleJump();
  }
  returnToDecision(expand){
    if(!this.live())return;
    this.readingRequested=false;
    if(this.view!=='home')this.doc.querySelector('[data-main-view="home"]').click();
    if(expand){this.current.collapsed=false;this.sync();}
    const allocationTarget=this.getReturnTarget(),target=allocationTarget||this.targetHeading;
    const r=target.getBoundingClientRect(),b=this.visibleBounds(target);
    if(!allocationTarget||r.top<b.top||r.bottom>b.bottom)this.reveal(target);target.focus({preventScroll:true});this.scheduleJump();
  }
  captureSelection(event){
    const button=event.target.closest('button');if(!button||button.disabled||!this.act.contains(button))return;
    this.readingRequested=false;
    const view=this.getDecision();
    if(view?.kind==='CHOICE'&&event.detail>1){event.preventDefault();event.stopImmediatePropagation();return;}
    this.cancelSeasonScroll();const revision=this.scrollRevision;
    const option=view?.kind==='CHOICE'?view.opts[view.buttons.indexOf(button)]:null;
    // Allocation retains its original inputs, closure and controls. Any other #act button ends the
    // previous choice's selection, so its mark never depends on whether a frame ran in between.
    if(!option){this.selection=null;return;}
    const selected={id:this.current?.id,label:this.plain(option.t),before:new Set(this.log.querySelectorAll('.card')),marked:false};
    this.selection=selected;this.latestSelection=selected;
    this.log.querySelectorAll('details[data-reader-details]').forEach(details=>{details.open=false;});
    // A microtask may run between capture and the target's onclick. Wait until
    // dispatch finishes, then focus after the engine's own scrolling frame.
    this.win.requestAnimationFrame(()=>{
      if(this.selection!==selected)return;this.selection=null;
      if(this.view!=='home'||revision!==this.scrollRevision)return;
      const card=[...this.log.querySelectorAll('.card')].find(node=>!node.hidden&&!selected.before.has(node));
      const error=[...this.log.querySelectorAll('[data-reader-error]')].find(node=>!selected.before.has(node));
      const target=(error||card)?.querySelector('h4')||this.targetHeading;
      this.win.requestAnimationFrame(()=>{if(this.view==='home'&&revision===this.scrollRevision&&this.latestSelection===selected&&target?.isConnected&&!this.doc.querySelector('dialog[open],.salary-detail-panel:not([hidden])')){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'});}});
    });
  }
  decorateCard(node,{hasTitle,title}){
    if(!this.jump)return;
    const heading=hasTitle?node.firstElementChild:null,content=[...node.childNodes].filter(child=>child!==heading);
    const details=this.doc.createElement('details'),summary=this.doc.createElement('summary'),body=this.doc.createElement('div');
    details.dataset.readerDetails='';details.open=true;summary.textContent='内容と結果';body.dataset.readerBody='';
    content.forEach(child=>body.appendChild(child));details.append(summary,body);node.append(details);
    node.dataset.readerCard=String(++this.cardSequence);
    if(title==='処理中にエラーが発生しました')node.dataset.readerError='';
    const year=this.getYear();
    if(Number.isInteger(year)){const meta=this.doc.createElement('p');meta.dataset.readerPeriod='';meta.textContent=`${year}年・${this.phaseText()}`;node.prepend(meta);}
    if(heading){heading.tabIndex=-1;heading.dataset.readerFocus='';}
    if(this.selection&&!this.selection.marked){
      const choice=this.doc.createElement('p');choice.dataset.readerSelection='';choice.textContent='選んだ行動：'+this.selection.label;
      body.append(choice);this.selection.marked=true;
    }
  }
}

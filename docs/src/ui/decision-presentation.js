// Presentation lifetime only. Choice objects are read; no S, persistence or RNG writes.
const PHASES=['シーズン前','シーズン中','シーズン終了'];
export class DecisionPresentation {
  constructor({documentRef,getDecision,getYear,getPhase,getReturnTarget=()=>null}){
    this.doc=documentRef;this.win=documentRef.defaultView;this.getDecision=getDecision;this.getYear=getYear;this.getPhase=getPhase;
    this.getReturnTarget=getReturnTarget;
    this.act=documentRef.getElementById('act');this.log=documentRef.getElementById('log');
    this.summary=documentRef.getElementById('decision-summary');this.heading=documentRef.getElementById('decision-question');
    this.returnButton=documentRef.getElementById('decision-return');this.jump=documentRef.getElementById('decision-jump');
    this.toggleButton=documentRef.getElementById('act-toggle');this.views=new WeakMap();this.sequence=0;this.cardSequence=0;this.view='home';
    if(!this.summary)return;
    this.returnButton.addEventListener('click',()=>this.returnToDecision(false));
    this.jump.addEventListener('click',()=>this.returnToDecision(true));
    this.act.addEventListener('keydown',event=>{if(event.repeat&&this.getDecision()?.kind==='CHOICE'&&event.target.closest('button')){event.preventDefault();event.stopImmediatePropagation();}},true);
    this.act.addEventListener('click',event=>this.captureSelection(event),true);
    documentRef.addEventListener('yakyujinsei:mainview',event=>this.navigate(event.detail));
  }
  plain(html){const t=this.doc.createElement('template');t.innerHTML=html||'';return t.content.textContent.trim();}
  phaseText(){return PHASES[this.getPhase()]||'進行中';}
  sync(){
    if(!this.summary)return;
    const view=this.getDecision(),has=this.act.children.length>0&&this.act.style.display!=='none';
    if(!has||!view){this.clear();return;}
    const key=view.kind==='CHOICE'?view.opts:view;
    if(!key||typeof key!=='object'){this.clear();return;}
    let meta=this.views.get(key);
    if(!meta||meta.owner!==view.state||meta.year!==view.year){meta={id:'decision-'+(++this.sequence),collapsed:false,owner:view.state,year:view.year};this.views.set(key,meta);}
    this.current=meta;
    const title=view.kind==='CHOICE'?this.plain(view.title)||'次の行動を選んでください':'トレーニングの配分を確認してください';
    this.act.dataset.decisionId=meta.id;this.act.dataset.decisionKind=view.kind;
    this.act.dataset.eventChoice=String(view.kind==='CHOICE'&&String(view.title).includes('event-badge'));
    this.act.classList.toggle('collapsed',meta.collapsed);
    this.heading.textContent=title;
    const titleNode=this.act.querySelector(':scope > .title');
    if(titleNode){titleNode.tabIndex=-1;titleNode.dataset.readerFocus='';}
    this.targetHeading=titleNode||this.heading;
    this.heading.hidden=!meta.collapsed&&Boolean(titleNode);
    this.doc.getElementById('decision-period').textContent=`今の選択｜${view.year??this.getYear()}年・${this.phaseText()}`;
    this.toggleButton.setAttribute('aria-controls','act');this.toggleButton.setAttribute('aria-expanded',String(!meta.collapsed));
    this.toggleButton.textContent=meta.collapsed?'選択肢を開く':'選択肢を閉じる';
    this.summary.hidden=false;this.returnButton.hidden=this.view==='home';
  }
  clear(){
    if(!this.summary)return;
    this.current=null;this.summary.hidden=true;this.returnButton.hidden=true;
    for(const key of ['decisionId','decisionKind','eventChoice'])delete this.act.dataset[key];
    this.toggleButton.setAttribute('aria-expanded','false');
  }
  toggle(){if(!this.current)return;const opening=this.current.collapsed;if(!opening)this.current.actionScroll=this.act.scrollTop;this.current.collapsed=!this.current.collapsed;this.sync();if(opening)this.act.scrollTop=this.current.actionScroll||0;}
  scrollState(){return {id:this.current?.id,page:[this.win.scrollX,this.win.scrollY],log:this.log.scrollTop,act:this.act.scrollTop,home:this.doc.getElementById('view-home').scrollTop,host:this.doc.getElementById('view-host').scrollTop};}
  navigate({stage,view,previous}){
    if(stage==='before'&&previous==='home'&&view!=='home')this.homeScroll=this.scrollState();
    if(stage!=='after')return;
    this.view=view;this.returnButton.hidden=!this.current||view==='home';
    if(view==='home'&&this.current&&this.homeScroll?.id===this.current.id){
      const saved=this.homeScroll;
      this.log.scrollTop=saved.log;this.act.scrollTop=saved.act;this.doc.getElementById('view-host').scrollTop=saved.host;
      this.doc.getElementById('view-home').scrollTop=saved.home;
      this.win.scrollTo(...saved.page);
    }
  }
  returnToDecision(expand){
    if(!this.current)return;
    if(this.view!=='home')this.doc.querySelector('[data-main-view="home"]').click();
    if(expand){this.current.collapsed=false;this.sync();}
    const allocationTarget=this.getReturnTarget(),target=allocationTarget||(this.current.collapsed?this.heading:this.targetHeading);
    if(!allocationTarget)target.scrollIntoView({block:'nearest'});target.focus({preventScroll:true});
  }
  captureSelection(event){
    const button=event.target.closest('button');if(!button||button.disabled||!this.act.contains(button))return;
    const view=this.getDecision();
    if(view?.kind==='CHOICE'&&event.detail>1){event.preventDefault();event.stopImmediatePropagation();return;}
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
      if(this.view!=='home')return;
      const card=[...this.log.querySelectorAll('.card')].find(node=>!selected.before.has(node));
      const error=[...this.log.querySelectorAll('[data-reader-error]')].find(node=>!selected.before.has(node));
      const target=(error||card)?.querySelector('h4')||this.targetHeading||this.heading;
      this.win.requestAnimationFrame(()=>{if(this.view==='home'&&this.latestSelection===selected&&target.isConnected&&!this.doc.querySelector('dialog[open]')){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'});}});
    });
  }
  decorateCard(node,{hasTitle,title}){
    if(!this.summary)return;
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

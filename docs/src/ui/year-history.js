// Completed years are presentation snapshots, kept outside the simulation state.
const salaryButtons='.salary-detail-link,.season-salary-detail';
const snapshots=new WeakMap();

export function rememberSalaryDetail(button,snapshot){
  snapshots.set(button,structuredClone(snapshot));
}

// Parse in an inert template and admit only the markup used by result cards.
// Build fresh nodes so a saved attribute cannot turn into executable behavior.
const tags=new Set('article b br button caption dd details div dl dt em h2 h3 h4 hr i li ol p s section small span strong summary table tbody td th thead tr u ul'.split(' '));
const attrs=new Set('class type hidden disabled open tabindex role colspan rowspan scope title'.split(' '));
const styles=new Set(['color','font-weight','text-align','margin-top','margin-bottom','padding','font-size']);
function historyContent(documentRef,html){
  const template=documentRef.createElement('template');
  template.innerHTML=html;
  const fragment=documentRef.createDocumentFragment();
  function append(target,node){
    if(node.nodeType===3){target.append(documentRef.createTextNode(node.textContent));return;}
    if(node.nodeType!==1||!tags.has(node.localName)||node.namespaceURI!=='http://www.w3.org/1999/xhtml')return;
    const clean=documentRef.createElement(node.localName);
    for(const {name,value} of node.attributes){
      if(attrs.has(name)||name.startsWith('data-')||name.startsWith('aria-'))clean.setAttribute(name,value);
    }
    if(clean.localName==='button')clean.type='button';
    for(const property of styles){
      const value=node.style.getPropertyValue(property);
      if(value)clean.style.setProperty(property,value);
    }
    for(const child of node.childNodes)append(clean,child);
    target.append(clean);
  }
  for(const node of template.content.childNodes)append(fragment,node);
  return fragment;
}

export class YearHistory {
  constructor(log,openSalaryDetail,releaseYear){
    this.log=log;
    this.openSalaryDetail=openSalaryDetail;
    this.releaseYear=releaseYear;
    this.years=[];
  }

  reset(){this.years=[];this.log.replaceChildren();}

  add(title,year,record=null){
    const doc=this.log.ownerDocument;
    const block=doc.createElement('div'),head=doc.createElement('div'),body=doc.createElement('div');
    block.className='yr-block';head.className='yr-head';body.className='yr-body';
    head.textContent=title;
    const entry={year,title,block,head,body,record};
    head.onclick=()=>this.toggle(entry);
    block.append(head,body);
    this.log.append(block);
    this.years.push(entry);
    if(record){
      head.classList.toggle('has-body',Boolean(record.html));
      block.classList.add('collapsed');
    }
    return body;
  }

  snapshot(entry){
    return {
      year:entry.year,title:entry.title,html:entry.body.innerHTML,
      salaries:[...entry.body.querySelectorAll(salaryButtons)].map(button=>snapshots.get(button)??null)
    };
  }

  collapse(entry){
    entry.block.classList.add('collapsed');
    if(entry===this.years.at(-1))return;
    if(entry.body.hasChildNodes())entry.record=this.snapshot(entry);
    entry.body.replaceChildren();
    this.releaseYear(entry.year);
  }

  expand(entry){
    if(entry.record&&!entry.body.hasChildNodes()){
      const fragment=historyContent(this.log.ownerDocument,entry.record.html);
      let index=0;
      for(const button of fragment.querySelectorAll(salaryButtons)){
        const snapshot=entry.record.salaries[index++];
        if(!snapshot){button.disabled=true;continue;}
        rememberSalaryDetail(button,snapshot);
        button.onclick=()=>this.openSalaryDetail(snapshot);
      }
      entry.body.append(fragment);
    }
    entry.block.classList.remove('collapsed');
  }

  toggle(entry){
    if(entry.block.classList.contains('collapsed'))this.expand(entry);
    else this.collapse(entry);
  }

  updateCollapsedCards(update){
    for(const entry of this.years){
      if(entry.body.hasChildNodes()||!entry.record?.html.includes('data-trait-result'))continue;
      const template=this.log.ownerDocument.createElement('template');
      template.innerHTML=entry.record.html;
      update(template.content);
      entry.record={...entry.record,html:template.innerHTML};
    }
  }

  capture(checkpointYear){
    return this.years.filter(entry=>entry.year!==null&&entry.year<checkpointYear)
      .map(entry=>entry.body.hasChildNodes()?this.snapshot(entry):entry.record??this.snapshot(entry));
  }

  restore(records){
    this.reset();
    for(const record of records)this.add(record.title,record.year,record);
  }
}

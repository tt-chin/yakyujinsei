// Read-only FA comparison. The original choice buttons, handlers and offer order stay intact.
const FIELDS={annualSalary:'年俸',years:'年数',guaranteedTotal:'保証年俸総額'};
export function sortFaOffers(offers,field='annualSalary',direction='descending'){
  if(!Object.hasOwn(FIELDS,field))throw Error('Unknown FA sort');
  if(!['ascending','descending'].includes(direction))throw Error('Unknown FA sort direction');
  return offers.map((offer,index)=>({offer,index})).sort((a,b)=>{
    const x=a.offer[field],y=b.offer[field],valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
    return valid(x)!==valid(y)?valid(x)?-1:1:valid(x)&&x!==y?(direction==='ascending'?x-y:y-x):a.index-b.index;
  }).map(x=>x.index);
}
export class FaMarketPresentation{
  constructor({documentRef,getDecision,getState}){this.doc=documentRef;this.win=documentRef.defaultView;this.getDecision=getDecision;this.getState=getState;this.act=documentRef.getElementById('act');this.home=documentRef.getElementById('view-home');this.sessions=new WeakMap();this.sequence=0;}
  clear(){this.home.removeAttribute('data-fa-market-open');this.act.removeAttribute('data-fa-market');this.rail?.removeEventListener('scroll',this.onScroll);this.root=null;this.rail=null;this.view=null;}
  sync(){
    const view=this.getDecision(),market=this.getState()?.lastFaMarket;
    if(view?.kind!=='CHOICE'||view.title!=='FA市場オファー比較'||!market?.offers?.length||market.acceptedOfferId){this.clear();return;}
    const offers=[...market.offers,...(market.stayOffer?[market.stayOffer]:[])];
    if(view.buttons.length!==offers.length||view.buttons.some(b=>!this.act.contains(b))){this.clear();return;}
    if(this.view===view&&this.root?.isConnected)return;
    this.clear();this.view=view;this.home.dataset.faMarketOpen='';this.act.dataset.faMarket='';
    let session=this.sessions.get(view.opts);if(!session){session={sort:'annualSalary',direction:'descending',selected:null};this.sessions.set(view.opts,session);}
    const el=(tag,text)=>{const n=this.doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
    const root=el('section');root.dataset.faComparison='';root.setAttribute('aria-label','FAオファー比較');this.root=root;
    const hint=el('p','球団名で条件カードへ移動します。カードは左右にスワイプできます。契約は球団ボタンで選んでください。');hint.className='fa-hint';
    const scroller=el('div');scroller.className='fa-table-scroll';scroller.tabIndex=0;scroller.setAttribute('aria-label','FAオファー一覧');
    const table=el('table'),caption=el('caption','FAオファー一覧（すべて日本円）'),head=el('thead'),tr=el('tr'),body=el('tbody');
    const teamHeading=el('th','球団');teamHeading.scope='col';tr.append(teamHeading);
    const sortHeaders=[];
    for(const [field,text] of Object.entries(FIELDS)){
      const th=el('th'),button=el('button'),indicator=el('span');th.scope='col';th.dataset.faSortHeader=field;
      button.type='button';button.className='fa-sort-button';button.dataset.faSort=field;indicator.className='fa-sort-indicator';indicator.setAttribute('aria-hidden','true');
      button.append(el('span',text),indicator);th.append(button);tr.append(th);sortHeaders.push({field,text,th,button,indicator});
    }head.append(tr);table.append(caption,head,body);scroller.append(table);
    const rail=el('div');rail.className='fa-offer-rail';rail.tabIndex=0;rail.setAttribute('role','region');rail.setAttribute('aria-label','球団別の契約条件');this.rail=rail;
    const status=el('p');status.className='fa-card-status';status.setAttribute('role','status');
    const money=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value.toLocaleString('ja-JP')+'円':'詳細記録なし';
    const cards=[],rows=[],links=[];
    for(const [index,offer] of offers.entries()){
      const card=el('article');card.id='fa-offer-'+(++this.sequence);card.className='fa-offer-card';card.dataset.faOfferIndex=String(index);card.setAttribute('aria-label',view.opts[index].t);card.append(view.buttons[index]);cards.push(card);rail.append(card);
      const row=el('tr');row.dataset.faOfferIndex=String(index);const name=el('th');name.scope='row';const link=el('a',view.opts[index].t);link.href='#'+card.id;link.setAttribute('aria-controls',card.id);name.append(link);row.append(name);
      for(const field of Object.keys(FIELDS)){const cell=el('td',field==='years'?(Number.isFinite(offer.years)&&offer.years>=0?offer.years+'年':'詳細記録なし'):money(offer[field]));cell.dataset.faField=field;row.append(cell);}rows.push(row);links.push(link);
      link.addEventListener('click',event=>{event.preventDefault();show(index,true);card.focus({preventScroll:true});});card.tabIndex=-1;
    }
    let order=sortFaOffers(offers,session.sort,session.direction),frame=0;
    const mark=index=>{session.selected=index;cards.forEach((card,i)=>{card.inert=i!==index;links[i].setAttribute('aria-current',String(i===index));rows[i].classList.toggle('selected',i===index);});status.textContent=(order.indexOf(index)+1)+' / '+offers.length+'球団';};
    const show=(index,vertical=false)=>{if(!this.root?.isConnected||this.view!==view)return;mark(index);const card=cards[index];rail.scrollTo({left:rail.scrollLeft+card.getBoundingClientRect().left-rail.getBoundingClientRect().left,behavior:'instant'});if(vertical)rail.scrollIntoView({block:'start',behavior:'instant'});};
    const sort=()=>{
      const scrollLeft=scroller.scrollLeft;order=sortFaOffers(offers,session.sort,session.direction);
      order.forEach((index,rank)=>{body.append(rows[index]);cards[index].style.order=String(rank);});
      for(const {field,text,th,button,indicator} of sortHeaders){const active=field===session.sort;th.setAttribute('aria-sort',active?session.direction:'none');indicator.textContent=active?(session.direction==='ascending'?'▲':'▼'):'▴▾';indicator.classList.toggle('inactive',!active);button.setAttribute('aria-label',text+'を'+(active&&session.direction==='descending'?'小さい順':'大きい順')+'に並べ替え');}
      if(session.selected===null)session.selected=order[0];show(session.selected);scroller.scrollLeft=scrollLeft;
    };
    for(const {field,button} of sortHeaders)button.addEventListener('click',()=>{session.direction=field===session.sort&&session.direction==='descending'?'ascending':'descending';session.sort=field;sort();});
    rail.addEventListener('keydown',event=>{if(event.target!==rail||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const current=order.indexOf(session.selected),next=event.key==='Home'?0:event.key==='End'?order.length-1:Math.max(0,Math.min(order.length-1,current+(event.key==='ArrowRight'?1:-1)));show(order[next]);});
    this.onScroll=()=>{if(frame)return;frame=this.win.requestAnimationFrame(()=>{frame=0;if(this.view!==view||!rail.isConnected)return;const left=rail.getBoundingClientRect().left;mark(order.reduce((best,index)=>Math.abs(cards[index].getBoundingClientRect().left-left)<Math.abs(cards[best].getBoundingClientRect().left-left)?index:best,order[0]));});};
    rail.addEventListener('scroll',this.onScroll,{passive:true});root.append(hint,scroller,rail,status);this.act.append(root);sort();
  }
}

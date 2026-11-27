import {DecisionPresentation} from './decision-presentation.js';
import {AllocationPresentation} from './allocation-presentation.js';
import {FaMarketPresentation} from './fa-market-presentation.js';
import {CareerReview} from './career-review.js';
import {YearHistory,rememberSalaryDetail} from './year-history.js';
// game.js の純DOM基本操作（物件導向化 第2期）。S と RNG に触れず、S に依存する処理は game.js から注入する。
export class GameView {
  constructor({ byId, logTarget, decorateCard, onTraitShown, getDecision=()=>null, getYear=()=>null, getState=()=>null, getSeasonContext=()=>null, openSalaryDetail=()=>{}, readSalaryDetail=()=>null, reviewLabels={} }) {
    this.byId = byId; this.logTarget = logTarget; this.decorateCard = decorateCard; this.onTraitShown = onTraitShown;
    const documentRef=byId('act')?.ownerDocument;
    this.getYear=getYear; this.readSalaryDetail=readSalaryDetail;
    if(byId('log'))this.yearHistory=new YearHistory(byId('log'),openSalaryDetail,year=>this.careerReview?.seasons.releaseYear(year));
    if(documentRef)this.decisionUI=new DecisionPresentation({documentRef,getDecision,getYear,getState,getPhase:()=>this.boardContext?.phase,getReturnTarget:()=>this.allocationUI?.returnTarget()});
    if(documentRef)this.allocationUI=new AllocationPresentation({documentRef,getDecision});
    if(documentRef)this.faUI=new FaMarketPresentation({documentRef,getDecision,getState});
    if(documentRef)this.careerReview=new CareerReview({documentRef,getState,labels:reviewLabels,getSeasonContext,openSalaryDetail,onFirstSeasonDisplay:(root,state,year)=>this.decisionUI?.revealSeasonSummary(root,state,year)});
  }
  scrollBottom(){ /* iOS Safari iframe内でスムーズスクロールでは白画面が起きやすいため、同期スクロールへ変更+rAF。 */
    const revision=this.decisionUI?.scrollRevision;
    if(this.decisionUI&&!this.decisionUI.canScrollBottom(revision))return;
    if(this.decisionUI?.isReadingHistory()){this.decisionUI.scheduleJump();return;}
    try{ requestAnimationFrame(()=>{if(this.decisionUI&&(!this.decisionUI.canScrollBottom(revision)||this.decisionUI.isReadingHistory()))return;const log=this.byId('log');if(log.scrollHeight>log.clientHeight&&getComputedStyle(log).overflowY==='auto')log.scrollTop=log.scrollHeight;else window.scrollTo(0, document.body.scrollHeight);}); }
    catch(e){ try{ if(!this.decisionUI||this.decisionUI.canScrollBottom(revision))window.scrollTo(0, document.body.scrollHeight); }catch(_){} }
  }
  archiveTraitResults(){
    const archive=root=>root.querySelectorAll('[data-trait-result]').forEach(node=>{
      node.replaceChildren();const name=document.createElement('h4');name.textContent=node.dataset.traitName;node.appendChild(name);
      delete node.dataset.traitResult;
    });
    archive(this.byId('log'));
    this.yearHistory?.updateCollapsedCards(archive);
  }
  card(cls,title,html){ const d=document.createElement('div'); d.className='card '+cls;
    const farewell=this.careerReview?.farewell(html,title)??html;if(farewell!==html)d.dataset.pitcherFarewell='';html=farewell;
    ({title,html}=this.decorateCard(d,title,html));
    d.innerHTML=(title?`<h4>${title}</h4>`:'')+html; this.logTarget().appendChild(d);
    if(d.dataset.traitResult&&!d.dataset.traitResult.startsWith('removed:'))this.onTraitShown(d.dataset.traitResult);
    this.decisionUI?.decorateCard(d,{hasTitle:Boolean(title),title});
    this.careerReview?.card(d,title);
    for(const button of d.querySelectorAll('.salary-detail-link'))rememberSalaryDetail(button,this.readSalaryDetail());
    if(this.boardContext?.phase===2)this.careerReview?.render();
    this.scrollBottom(); }
  divider(title){
    this.careerReview?.seasons.completeYear();
    const history=this.yearHistory;
    const previous=history.years.at(-1),older=history.years.at(-2);
    if(previous?.body.children.length)previous.head.classList.add('has-body');
    if(older&&!this.decisionUI?.isReadingHistory())history.collapse(older);
    const year=/^([0-9]+)年・/.test(title)?this.getYear():null;
    const prelude=history.years.length===0?[...history.log.childNodes]:[];
    const body=history.add(title,year);
    if(prelude.length)body.append(...prelude);
    return body;
  }
  captureYearHistory(year){return this.yearHistory.capture(year);}
  restoreYearHistory(records){this.yearHistory.restore(records);}
  actClear(){ const a=this.byId('act'); a.innerHTML=''; a.classList.remove('collapsed'); a.style.pointerEvents='';
    this.decisionUI?.clear();
    this.allocationUI?.clear();
    this.faUI?.clear();
    const t=this.byId('act-toggle'); if(t)t.style.display='none'; }
  toggleActions(){this.decisionUI?.toggle();}
  actToggleSync(){
    const a=this.byId('act'), t=this.byId('act-toggle'); if(!t)return;
    const has=a.innerHTML.trim()!=='' && a.style.display!=='none';
    t.style.display=has?'block':'none';
    t.textContent=a.classList.contains('collapsed')?'⌃ 選択肢を展開':'⌄ 選択肢を閉じる';
    this.decisionUI?.sync();
    this.allocationUI?.sync();
    this.faUI?.sync();
  }
  renderBoard(m){ /* m は game.js の boardModel が S から作る書き込み値。 */
    this.boardContext={year:m.year,phase:m.phase};
    if(this.careerReview){this.careerReview.phase=m.phase;if(m.phase===2)this.careerReview.render();}
    this.byId('board').dataset.amateur=String(m.isAmateur===true);
    if(m.phase===2)this.careerReview?.render();
    const risk=this.byId('bd-risk');if(risk)risk.textContent=m.injuryRiskText??'0%';
    const tj=this.byId('bd-tj-gauge-cell');if(tj){this.byId('bd-grid').dataset.pitcher=String(m.isPitcher===true);tj.hidden=!m.isPitcher;this.byId('bd-tj-gauge').textContent=m.tjGaugeText??'';}
    this.byId('bd-name').innerHTML=m.nameHtml;
    this.byId('bd-team').innerHTML = m.teamHtml;
    this.setBoardNumber(m.numberText);{const change=this.byId('board-number');if(change)change.disabled=!m.numberChangeEnabled;}
    this.byId('bd-age').textContent=m.age; this.byId('bd-year').textContent=m.year;
    this.byId('bd-ovr').textContent=m.ovr; if(m.clearTj){const el=this.byId('bd-tj'); if(el)el.textContent='';} this.byId('bd-sal').textContent=m.salaryText;
    [0,1,2].forEach(i=>this.byId('lp'+i).classList.toggle('on',i===m.phase));
  }
  setBoardNumber(text){const el=this.byId('bd-number');if(!el)return;el.textContent=text||'';el.hidden=!text;}
  patchBoard(p){ /* game.js の board 上書き（renderBoard の後に実行）の追加書き込み。 */
    this.byId('bd-name').firstChild.textContent=p.name;
    const amateur=this.byId('board').dataset.amateur==='true',salary=this.byId('bd-sal');salary.textContent=amateur?'アマ':p.salaryText;
    const lbl=salary.nextElementSibling;if(lbl)lbl.textContent=amateur?'年俸対象外':'年俸（万）';
    this.byId('salary-detail-trigger')?.setAttribute('aria-label',amateur?'アマチュア。収入の内訳を見る':'年俸、単位は万円。年俸の内訳を見る');
  }
  renderChoices(title,opts){ /* 選択肢ボタンを作って返す。onclick と choiceViews への登録は ChoicePrompt の choose が行う。 */
    if(this.careerReview?.phase===2)this.careerReview.render();
    const a=this.byId('act'); a.style.pointerEvents='';
    a.classList.remove('collapsed'); /* 新しい選択肢が表示されたら自動で展開。 */
    if(title)a.innerHTML=`<div class="title">${title}</div>`;
    if(this.boardContext?.phase===2)this.careerReview?.render();
    return opts.map(o=>{ const b=document.createElement('button');
      b.className='btn'+(o.main?' main':'')+(o.warn?' warn':'');
      b.innerHTML=o.t+(o.s?`<small>${o.s}</small>`:'');
      b.disabled=false;
      a.appendChild(b); return b; });
  }
}

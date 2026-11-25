import {careerRecordModel,reviewStatLine} from './career-record.js';
export {reviewStatLine} from './career-record.js';
import {SeasonSummary} from './season-summary.js';

// Read-only summaries. No inferred contracts, awards, events or persisted fields.
export function careerReviewModel(state,{leagueName=key=>key,teamName=key=>key,teamLeague=()=>null,formatMoney=String}={}){
  const logs=Array.isArray(state.log)?state.log:[],honors=Array.isArray(state.honors)?state.honors:[];
  const current=logs.findLast(row=>row.y===state.year),schedule=Array.isArray(state.ct?.annualSchedule)?state.ct.annualSchedule:[];
  const salary=year=>{const due=schedule.find(row=>row.year===year);if(due&&Number.isFinite(due.amount))return formatMoney(due.amount);const decision=(Array.isArray(state.salaryDecisionHistory)?state.salaryDecisionHistory:[]).findLast(row=>row.salaryYear===year);return Number.isFinite(decision?.finalSalary)?formatMoney(decision.finalSalary):'未定';};
  const changes=[];
  if(current){const previous=logs[logs.indexOf(current)-1];if(previous&&previous.tm!==current.tm)changes.push(`所属の変化：${previous.tm} → ${current.tm}`);if(current.inj)changes.push('故障・休養の記録あり');if(current.st?.form===1)changes.push('キャリアハイ');if(previous?.inj&&!current.inj)changes.push('故障・休養後のシーズン');}
  const moments=[],add=(label,row)=>{if(!row)return;const existing=moments.find(item=>item.year===row.y&&item.team===row.tm);if(existing)existing.label+='／'+label;else moments.push({label,year:row.y,team:row.tm,line:reviewStatLine(state.pos,row.st)||row.line||'成績記録なし'});};
  add('野球人生の始まり',logs[0]);add('プロでの最初の記録',logs.find(row=>row.st));
  add('海外での記録',logs.find(row=>['MLB','KBO','CPBL','MILB'].includes(teamLeague(row.tm))));
  add('キャリアハイ',logs.find(row=>row.st?.form===1));add('故障・休養後のシーズン',logs.find((row,i)=>i>0&&logs[i-1].inj&&!row.inj));add('最後の記録',logs.at(-1));
  moments.sort((a,b)=>a.year-b.year);
  const teams=Object.values(state.teamTally||{}).flatMap(group=>Object.entries(group||{})),representative=teams.reduce((best,row)=>row[1]>(best?.[1]??-1)?row:best,null);
  const playedLeague=current?(current.st?(leagueName(teamLeague(current.tm))||'リーグ記録なし'):'アマチュア'):leagueName(state.lv)||'—';
  return {year:state.year,name:state.name||'選手',team:current?.tm||state.team||'所属記録なし',league:playedLeague,line:reviewStatLine(state.pos,current?.st)||current?.line||'今季の成績記録なし',salary:salary(state.year),nextSalary:salary(state.year+1),salaryApplies:state.stage==='PRO'||state.stage==='IND',awards:honors.filter(text=>String(text).startsWith(state.year+' ')),changes:changes.slice(0,3),representative:representative?teamName(representative[0]):null,totals:careerRecordModel(state,{recordedOnly:true}).groups.flatMap(group=>group.levels.map(level=>({league:group.label,label:level.label,line:level.summary}))),honors:honors.slice(0,3),moments};
}

export class CareerReview {
  constructor({documentRef,getState,labels,getSeasonContext,openSalaryDetail,onFirstSeasonDisplay}){this.doc=documentRef;this.getState=getState;this.labels=labels;this.seasons=new SeasonSummary({documentRef,getState,getSeasonContext,openSalaryDetail,formatMoney:labels?.formatMoney,onFirstDisplay:onFirstSeasonDisplay});}
  node(tag,text){const node=this.doc.createElement(tag);if(text!==undefined)node.textContent=text;return node;}
  list(values){const ul=this.node('ul');for(const value of values)ul.append(this.node('li',value));return ul;}
  render(retired=false){
    const state=this.getState();if(!state||(!retired&&state.done))return;
    const log=this.doc.getElementById('log'),body=[...(log?.querySelectorAll('.yr-block')||[])].at(-1)?.querySelector('.yr-body');if(!body)return;
    const model=careerReviewModel(state,this.labels),kind=retired?'retirement':'season';
    let root=body.querySelector(`:scope > [data-career-review="${kind}"]`);
    if(!root){root=this.node('section');root.className='career-review';root.dataset.careerReview=kind;body.prepend(root);}
    if(!retired&&(state.stage==='PRO'||this.seasons.entries(state).has(state.year))){root.dataset.reviewYear=String(model.year);this.seasons.render(root,body,model);return;}
    this.seasons.retire();
    root.replaceChildren();root.dataset.careerReview=kind;root.dataset.reviewYear=String(model.year);root.setAttribute('aria-label',retired?'野球人生の振り返り':'シーズンの振り返り');
    root.append(this.node('p',`${model.year}年｜${retired?'引退':'シーズン終了'}`),this.node('h2',retired?model.name+'の野球人生':'今季の振り返り'));
    if(retired){
      if(model.representative)root.append(this.node('p','最長在籍球団：'+model.representative));
      const reason=[...body.querySelectorAll('.card')].find(card=>card.querySelector('h4')?.textContent==='引退する')?.querySelector('[data-reader-body]');
      if(reason){const copy=reason.cloneNode(true);copy.querySelectorAll('[data-reader-selection]').forEach(node=>node.remove());root.append(this.node('p',copy.textContent));}
      const evaluation=[...body.querySelectorAll('.card')].find(card=>card.querySelector('h4')?.textContent==='通算評価');
      if(evaluation){const value=evaluation.querySelector('[data-reader-body]')?.cloneNode(true);if(value){value.querySelectorAll('[data-reader-selection]').forEach(node=>node.remove());root.append(this.node('p',value.textContent));}}
      root.append(this.node('h3','主な通算成績'),this.list(model.totals.length?model.totals.map(row=>(row.league==='MiLB'?'MiLB｜':'')+row.label+'｜'+row.line):['通算成績の記録なし']));
      root.append(this.node('h3','代表的な受賞記録'),this.list(model.honors.length?model.honors:['受賞記録なし']));
      root.append(this.node('h3','生涯の主な記録'));
      const timeline=this.node('ol');for(const item of model.moments)timeline.append(this.node('li',`${item.year}年｜${item.label}｜${item.team}｜${item.line}`));root.append(timeline);
      root.append(this.node('p','各リーグの評価・年度別成績・物語は下の「内容と結果」を開いて確認できます。共有と新しい人生の操作は記録の後にあります。'));
    }else{
      // Amateur/independent/corporate summaries retain their existing presentation.
      root.append(this.node('p',model.team+'｜'+model.league),this.node('p',model.line));
      if(model.salaryApplies){const dl=this.node('dl');dl.className='income-summary';for(const [label,value] of [['当年年俸',model.salary],['翌年年俸',model.nextSalary]])dl.append(this.node('dt',label),this.node('dd',value));root.append(dl);}
      root.append(this.node('h3','今季の受賞'),this.list(model.awards.length?model.awards:['受賞記録なし']));
      if(model.changes.length)root.append(this.node('h3','今季の転機'),this.list(model.changes));
      root.append(this.node('p','各カードの「内容と結果」を開くと、成績・出来事・収入の詳細を確認できます。'));
    }
  }
  farewell(html,title){
    if(title!=='引退の日'||this.getState()?.pos!=='P')return html;
    return html.replace('9回裏、最後の打席を終えると','9回裏、最後の登板を終えると').replace('最後の打席を前に観客は3分間の総立ち拍手。','最後の登板を前に観客は3分間の総立ち拍手。').replace('打席後に交代すると、全員が','マウンドを降りると、全員が');
  }
  card(node,title){this.seasons.card(node,title);if(!this.getState()?.done&&this.phase===2)this.render();}
  finish(){this.render(true);}
}

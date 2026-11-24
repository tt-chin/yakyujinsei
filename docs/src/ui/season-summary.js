import {salaryReasonLabel} from '../engine/salary-explanation-policy.js';

const money=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
const CONTRACT_EVENTS={契約:'所属先と契約を結びました。',契約更改:'契約を更新しました。',MLB年俸調停:'年俸調停が終了しました。',FA契約成立:'FA契約が成立しました。',チーム契約更新:'球団が契約更新権を行使しました。',延長契約の内訳:'延長契約の条件を確認しました。'};
// Display snapshots only. Never call settlement, contract generation or payment code.
export function seasonIncomeSnapshot(state,receipt,year){
  if(state.year!==year||receipt?.state!==state||receipt.year!==year||receipt.payment?.year!==year||state.lastSalaryPaidYear!==year)return null;
  const base=receipt.payment.paid,incentive=receipt.payment.incentive?.amount,outside=state.yearOutsideIncome,total=state.careerEarnings;
  return {base:money(base)?base:null,incentive:money(incentive)?incentive:null,outside:money(outside)?outside:null,lifetime:money(total)?total:null,
    received:[base,incentive,outside].every(money)?base+incentive+outside:null};
}
export function seasonContractSnapshot(state,year,income,{retired=false,initialContractId=null}={}){
  if(retired)return {status:'retired',salary:null};
  if(state.year!==year+1)return {status:'unknown',salary:null};
  // Only the completed hand-off may seal this display. Exact-year records only.
  const contract=state.ct?structuredClone(state.ct):null;
  const schedule=Array.isArray(contract?.annualSchedule)?contract.annualSchedule:[];
  const due=schedule.find(row=>row.year===year+1);
  const decisions=(Array.isArray(state.salaryDecisionHistory)?state.salaryDecisionHistory:[]).filter(row=>row.salaryYear===year+1&&row.decisionYear===year);
  const matching=decisions.findLast(row=>money(row.finalSalary)&&(!money(due?.amount)||row.finalSalary===due.amount));
  const salary=money(due?.amount)?due.amount:money(matching?.finalSalary)?matching.finalSalary:null;
  const decision=matching?structuredClone(matching):null;
  const previous=money(income?.base)?income.base:null;
  return {status:money(salary)?'final':'unknown',salary,previous,change:previous===null||salary===null?null:salary-previous,
    rate:previous>0&&salary!==null?(salary-previous)/previous:null,decision,contract,
    sameContract:Boolean(initialContractId&&contract?.contractId===initialContractId),remaining:contract&&Array.isArray(contract.annualSchedule)?schedule.filter(row=>row.year>=year+1&&row.paid!==true).length:null};
}

export class SeasonSummary {
  constructor({documentRef,getState,getSeasonContext=()=>null,openSalaryDetail=()=>{},formatMoney=String,onFirstDisplay=()=>{}}){
    this.doc=documentRef;this.getState=getState;this.getSeasonContext=getSeasonContext;this.openSalaryDetail=openSalaryDetail;this.formatMoney=formatMoney;this.onFirstDisplay=onFirstDisplay;this.careers=new WeakMap();
  }
  entries(state){let years=this.careers.get(state);if(!years){years=new Map();this.careers.set(state,years);}for(const [year,entry] of years)if(entry.root&&!entry.root.isConnected)years.delete(year);return years;}
  entry(year,body){const state=this.getState(),years=this.entries(state);let entry=years.get(year);if(!entry){entry={year,body,status:'pending',initialContractId:state.ct?.contractId||null};years.set(year,entry);}return entry;}
  node(tag,text){const n=this.doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
  card(node,title){
    const state=this.getState();if(!state)return;
    // Keep native source nodes/handlers for receipts and legacy readers, but present
    // their financial content once in the existing review section.
    if(!['シーズン終了','来季年俸決定'].includes(title)&&!Object.hasOwn(CONTRACT_EVENTS,title))return;
    if(this.getSeasonContext()?.year!==state.year&&!this.entries(state).has(state.year))return;
    const body=node.closest('.yr-body');if(!body)return;
    const entry=this.entry(state.year,body);
    if(title==='シーズン終了'&&!entry.income)entry.income=seasonIncomeSnapshot(state,this.getSeasonContext(),state.year);
    if(Object.hasOwn(CONTRACT_EVENTS,title)){
      const content=node.querySelector('[data-reader-body]');if(!content)return;
      const copy=content.cloneNode(true);copy.querySelectorAll('.salary-detail-link,[data-reader-selection]').forEach(n=>n.remove());
      entry.notes??=[];if(!entry.notes.some(note=>note.node===node))entry.notes.push({node,title,copy});
      // Keep native links in their original node for the engine's binding step.
      content.hidden=true;const brief=this.node('p',CONTRACT_EVENTS[title]+'年俸と詳細は同年度の「シーズンのまとめ」で確認できます。');content.after(brief);
    }else{node.hidden=true;node.dataset.seasonFinanceSource=title;}
  }
  completeYear(){
    const state=this.getState();if(!state)return;
    const entry=this.entries(state).get(state.year-1);
    if(entry&&entry.status==='pending'){
      entry.contract=seasonContractSnapshot(state,entry.year,entry.income,{initialContractId:entry.initialContractId});entry.status='closed';this.paint(entry);
    }
  }
  retire(){const state=this.getState(),entry=state&&this.entries(state).get(state.year);if(entry&&entry.status==='pending'){entry.contract=seasonContractSnapshot(state,entry.year,entry.income,{retired:true});entry.status='closed';this.paint(entry);}}
  render(root,body,model){
    const entry=this.entry(model.year,body);if(entry.status!=='pending')return;
    const first=!entry.root;
    entry.root=root;entry.model=structuredClone(model);
    if(!entry.income)entry.income=seasonIncomeSnapshot(this.getState(),this.getSeasonContext(),model.year);
    this.paint(entry);
    if(first)this.onFirstDisplay(root,this.getState(),model.year);
  }
  paint(entry){
    const {root,model,income,contract,year}=entry;if(!root?.isConnected||!model)return;
    const open=new Set([...root.querySelectorAll('details[open]')].map(n=>n.dataset.seasonDisclosure));
    root.replaceChildren();root.dataset.seasonSummary=String(year);root.setAttribute('aria-label',`${year}年 シーズンのまとめ`);
    const heading=this.node('h2',`${year}年 シーズンのまとめ`);heading.tabIndex=-1;root.append(heading);
    const amount=value=>money(value)?this.formatMoney(value):'記録なし';
    const disclosure=(key,label)=>{const details=this.node('details');details.dataset.seasonDisclosure=key;details.open=open.has(key);details.append(this.node('summary',label));root.append(details);return details;};
    const field=(parent,label,value)=>parent.append(this.node('p',label+'：'+value));
    root.append(this.node('h3','今季の収入'));field(root,'今季受取総額',amount(income?.received));
    const breakdown=disclosure('income','収入の内訳');
    for(const [label,key] of [['今季支給年俸','base'],['出来高','incentive'],['スポンサー収入','outside'],['生涯収入','lifetime']])field(breakdown,label,amount(income?.[key]));
    root.append(this.node('h3','来季の契約'));
    field(root,'来季年俸',entry.status==='pending'?'手続き中':contract?.status==='retired'?'未定（引退）':money(contract?.salary)?this.formatMoney(contract.salary):'未定');
    if(contract?.status==='final'){
      const signed=value=>(value>=0?'+':'−')+this.formatMoney(Math.abs(value));
      field(root,'前年比',contract.change===null?'記録なし':signed(contract.change)+(contract.rate===null?'':`（${contract.rate>=0?'+':'−'}${Math.abs(contract.rate*100).toFixed(1)}%）`));
      const d=contract.decision;
      root.append(this.node('p',d?.decisionType==='PROMOTION'&&d.reasonCodes?.includes('LEAGUE_MINIMUM_APPLIED')?'昇格に伴い、リーグ最低年俸を適用しました。':d?.reasonCodes?.length?salaryReasonLabel(d.reasonCodes[0]):contract.sameContract?'現契約を継続します。':'決定理由：記録なし'));
    }
    const button=this.node('button','年俸の内訳を見る');button.type='button';button.className='season-salary-detail';button.disabled=contract?.status!=='final';
    button.addEventListener('click',()=>{
      const saved=contract.contract,detailContract=saved?.schemaVersion===3&&Array.isArray(saved.annualSchedule)&&Array.isArray(saved.segments)?saved:null;
      this.openSalaryDetail({decision:contract.decision,currentSalary:contract.salary,salaryYear:year+1,contract:detailContract,income:null,isProfessional:true});
    });root.append(button);
    const detail=disclosure('contract','契約の詳細');
    field(detail,'契約残り',Number.isInteger(contract?.remaining)?contract.remaining+'年':'記録なし');
    if(contract?.decision?.reasonCodes?.length)for(const reason of contract.decision.reasonCodes)detail.append(this.node('p',salaryReasonLabel(reason)));
    if(entry.status==='pending')detail.append(this.node('p','昇降格・契約更改・移籍の手続きが終わり次第、この欄を更新します。'));
    for(const note of entry.notes||[]){detail.append(this.node('h3',note.title),note.copy.cloneNode(true));}
    const review=disclosure('review','成績・受賞・振り返り');
    review.append(this.node('p',model.team+'｜'+model.league),this.node('p',model.line),this.node('h3','今季の受賞'));
    for(const award of model.awards.length?model.awards:['受賞記録なし'])review.append(this.node('p',award));
    if(model.changes.length){review.append(this.node('h3','今季の転機'));for(const change of model.changes)review.append(this.node('p',change));}
  }
}

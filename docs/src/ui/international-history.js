import { internationalEvents } from '../engine/international-selection-policy.js';
import { JP_DATA } from '../data/jp-data.js';
import { renderInternationalPersonalStats } from './international-personal-stats.js';
import { fmtIP } from './stat-format.js';

// INT-01: tournaments actually played (S.intlTraitResults only), read-only; no reasons for missed tournaments.
const TITLE='国際大会出場履歴', UNKNOWN_NAME='国際大会';
const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
// Rows never hand out the saved objects: personal stats are copied and frozen all the way down.
const deepFreeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(deepFreeze);Object.freeze(v);}return v;};
const frozenCopy=v=>v==null?null:deepFreeze(structuredClone(v));

export function buildInternationalHistory(state, officialEvents=JP_DATA.intlEvents){
  const results=isRecord(state?.intlTraitResults)?state.intlTraitResults:{};
  // Same key rule as normalizeInternationalState: a result counts only under its own eventKey.
  const rows=Object.entries(results).filter(([key,r])=>isRecord(r)&&r.eventKey===key&&Number.isInteger(r.year)).map(([,r])=>{
    const event=internationalEvents(r.year,officialEvents).find(e=>e.eventKey===r.eventKey);
    return {row:Object.freeze({eventKey:r.eventKey,year:r.year,name:event?.name||UNKNOWN_NAME,rank:String(r.rank??''),personalStats:frozenCopy(r.personalStats)}),
      startDate:event?.startDate||'￿',priority:event?.priority??Infinity};
  });
  // Same-year tournaments follow the real schedule (WBC in March before Premier12 in November).
  rows.sort((a,b)=>a.row.year-b.row.year||a.startDate.localeCompare(b.startDate)||a.priority-b.priority||a.row.eventKey.localeCompare(b.row.eventKey));
  return Object.freeze(rows.map(x=>x.row));
}

const summaryText=row=>`${row.year} ${row.name}　${row.rank}`;
// rank comes from the saved state; escape it (and the name) before building markup.
const escapeHTML=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// renderInternationalPersonalStats emits fixed labels and formatted numbers only.
const itemHTML=row=>`<details class="intl-history-item"><summary>${escapeHTML(summaryText(row))}</summary>${renderInternationalPersonalStats(row.personalStats,fmtIP)}</details>`;

// Retirement card (通算成績): nothing at all when no tournament was played.
export function internationalHistoryHTML(rows){
  if(!rows?.length)return '';
  return `<section class="intl-history" data-intl-history><h4 class="intl-heading">${TITLE}</h4>${rows.map(itemHTML).join('')}</section>`;
}

// キャリア → 実績: appends one panel after the honors panel; nothing when no tournament was played.
export function appendInternationalHistory(container, rows){
  if(!rows?.length)return;
  const section=document.createElement('section');section.className='ui-panel intl-history';section.setAttribute('data-intl-history','');
  const heading=document.createElement('h2');heading.textContent=TITLE;section.appendChild(heading);
  rows.forEach(row=>{
    const details=document.createElement('details');details.className='intl-history-item';
    const summary=document.createElement('summary');summary.textContent=summaryText(row);details.appendChild(summary);
    details.insertAdjacentHTML('beforeend',renderInternationalPersonalStats(row.personalStats,fmtIP));
    section.appendChild(details);
  });
  container.appendChild(section);
}

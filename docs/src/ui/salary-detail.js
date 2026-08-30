import { salaryReasonLabel } from '../engine/salary-explanation-policy.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const signed = (value, digits = 0) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`;

export function salaryDetailMarkup(decision, { fmtMoney, currentSalary = 0, isProfessional = false } = {}) {
  if (!decision) return `<p>${isProfessional ? `現在年俸　${escapeHtml(fmtMoney(currentSalary))}<br>新人契約または過去年俸の詳細はありません` : 'プロ契約はまだありません'}</p>`;
  const c = decision.currentEvaluation;
  const components = decision.marketComponents || [];
  const market = components.reduce((sum, item) => sum + Number(item.contribution || 0), 0);
  return `<div class="salary-detail-summary"><strong>${decision.salaryYear}年 年俸　${escapeHtml(fmtMoney(decision.finalSalary))}</strong><br>前年　　　　 ${escapeHtml(fmtMoney(decision.previousSalary))}<br>増減　　　　 ${escapeHtml((decision.changeAmount >= 0 ? '+' : '−') + fmtMoney(Math.abs(decision.changeAmount)))}${decision.changeRate === null ? '（新規契約）' : `（${signed(decision.changeRate * 100, 1)}%）`}</div>`+
    (c ? `<h3>今季評価</h3><dl><dt>能力評価 d</dt><dd>${Number(c.baseD || 0).toFixed(2)}</dd><dt>実績補正</dt><dd>${signed(Number(c.performanceAdjustment || 0), 2)}</dd><dt>出場量補正</dt><dd>${signed(Number(c.workloadAdjustment || 0), 2)}</dd><dt>受賞補正</dt><dd>${signed(Number(c.awardAdjustment || 0), 2)}</dd><dt>payD</dt><dd>${Number(c.payD || 0).toFixed(2)}</dd></dl>` : '')+
    `<h3>直近3年</h3>${components.length ? `<div class="salary-market-components">${components.map(item => `<div>${item.year}　${Number(item.payD).toFixed(2)} × ${(item.weight * 100).toFixed(Number.isInteger(item.weight * 100) ? 0 : 1)}% = ${Number(item.contribution).toFixed(2)}</div>`).join('')}<strong>市場評価　${market.toFixed(2)}</strong></div>` : '<p>過去年の詳細評価はありません</p>'}`+
    `<h3>層級換算</h3><dl><dt>${escapeHtml(decision.sourceLevel || '—')} → ${escapeHtml(decision.targetLevel || '—')}</dt><dd>${decision.convertedMarketRating === null ? '—' : Number(decision.convertedMarketRating).toFixed(2)}</dd></dl>`+
    `<h3>契約・守備</h3><dl><dt>基準年俸</dt><dd>${escapeHtml(fmtMoney(decision.baseSalary))}</dd><dt>守位係数</dt><dd>×${Number(decision.positionMultiplier).toFixed(2)}</dd><dt>契約係数</dt><dd>×${Number(decision.contractMultiplier).toFixed(2)}</dd><dt>最終年俸</dt><dd>${escapeHtml(fmtMoney(decision.finalSalary))}</dd></dl>`+
    `<h3>最終決定理由</h3><ul>${decision.reasonCodes.map(code => `<li>${escapeHtml(salaryReasonLabel(code))}</li>`).join('')}</ul>`;
}

export function createSalaryDetailController({ trigger, panel, closeButton, title, body, getDecision, getCurrentSalary, isProfessional, fmtMoney, documentRef = document }) {
  let opener = null;
  const open = () => { opener = documentRef.activeElement; body.innerHTML = salaryDetailMarkup(getDecision(), { fmtMoney, currentSalary:getCurrentSalary(), isProfessional:isProfessional() }); panel.hidden = false; documentRef.body.classList.add('salary-detail-open'); (closeButton || title).focus(); };
  const close = () => { panel.hidden = true; documentRef.body.classList.remove('salary-detail-open'); opener?.focus?.(); };
  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  closeButton.addEventListener('click', close);
  documentRef.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) close(); });
  return { open, close };
}

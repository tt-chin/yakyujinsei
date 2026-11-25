// Browser-side projection of the approved UI 2.0 board layout only.
// Validate all new static markup and summary values before rebuilding the old
// board layout. Existing DOM comparisons still cover every old dynamic field,
// log/action markup and complete game state/RNG. No state projection here.
// Observe successful renderer inputs, not live DOM or mutable S. The board can
// intentionally retain its previous salary while a season result updates S.
export function observeShellBoard(view,target){
  const render=view.renderBoard,patch=view.patchBoard;
  view.renderBoard=function(model){const result=render.call(this,model);target.__shellRenderedBoard={isAmateur:model.isAmateur,salaryText:model.salaryText,injuryRiskText:model.injuryRiskText,isPitcher:model.isPitcher,tjGaugeText:model.tjGaugeText};return result;};
  view.patchBoard=function(values){const result=patch.call(this,values);target.__shellRenderedBoard={...target.__shellRenderedBoard,salaryText:values.salaryText};return result;};
}
export function projectShell2000(markup,rendered){
  const parse=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content.firstElementChild;};
  const actual=parse(markup),expected=parse(window.__shellBoard2000),old=parse(window.__shellBoard11615);
  const q=(node,id)=>node.querySelector('#'+id);
  const salary=document.getElementById('salary-detail-trigger').cloneNode(true);
  if(typeof rendered?.isAmateur!=='boolean'||typeof rendered.salaryText!=='string'||typeof rendered.injuryRiskText!=='string')throw Error('UI_SHELL_2000_RENDER_INPUT_MISSING');
  const amateur=rendered.isAmateur,salaryText=rendered.salaryText;
  const expectedSalary=q(expected,'salary-detail-trigger');
  q(expected,'bd-sal').textContent=amateur?'アマ':salaryText;
  q(expected,'bd-sal').nextElementSibling.textContent=amateur?'年俸対象外':'年俸（万）';
  expectedSalary.setAttribute('aria-label',amateur?'アマチュア。収入の内訳を見る':'年俸、単位は万円。年俸の内訳を見る');
  if(salary.outerHTML!==expectedSalary.outerHTML)throw Error('UI_SHELL_2000_SALARY_CONTRACT');
  q(expected,'bd-risk').textContent=rendered.injuryRiskText;
  // Approved read-only header risk/TJ delta. Keep the frozen historical templates.
  if(typeof rendered.isPitcher==='boolean'||q(actual,'bd-tj-gauge-cell')){
    if(typeof rendered.isPitcher!=='boolean'||(rendered.isPitcher?typeof rendered.tjGaugeText!=='string':rendered.tjGaugeText!==null))throw Error('UI_SHELL_2000_HEADER_INPUT');
    q(expected,'bd-risk').nextElementSibling.textContent='故障リスク';
    const cell=parse('<div class="bd-cell" id="bd-tj-gauge-cell" hidden><b id="bd-tj-gauge"></b><span>TJゲージ</span></div>');
    cell.hidden=!rendered.isPitcher;q(cell,'bd-tj-gauge').textContent=rendered.tjGaugeText??'';
    q(expected,'bd-grid').dataset.pitcher=String(rendered.isPitcher);q(expected,'bd-grid').append(cell);
  }
  expected.dataset.amateur=String(amateur);
  for(const id of ['bd-name','bd-team','bd-age','bd-year','bd-ovr','bd-tj']){
    q(expected,id).innerHTML=q(actual,id).innerHTML;q(old,id).innerHTML=q(actual,id).innerHTML;
  }
  for(const id of ['lp0','lp1','lp2']){
    q(expected,id).className=q(actual,id).className;q(old,id).className=q(actual,id).className;
  }
  expected.style.display='';old.style.display='';
  if(!q(actual,'salary-detail-trigger'))expectedSalary.remove();
  // Moving the same salary node at a breakpoint changes only the surrounding
  // whitespace text nodes in this grid. Keep every element/attribute strict.
  for(const node of [actual,expected])for(const text of [...q(node,'bd-grid').childNodes])if(text.nodeType===3&&!text.textContent.trim())text.remove();
  if(actual.outerHTML!==expected.outerHTML){const a=actual.outerHTML,b=expected.outerHTML;let i=0;while(a[i]===b[i])i++;throw Error('UI_SHELL_2000_STATIC_BOARD_CONTRACT '+i+' actual '+a.slice(i,i+100)+' expected '+b.slice(i,i+100));}
  q(old,'bd-sal').textContent=salaryText;
  return old.outerHTML;
}

// Frozen approved phase-2 board and pre-redesign board. Do not regenerate to hide regressions.
export const SHELL_BOARD_2000="<header id=\"board\" style=\"display:none\">\n    <div id=\"bd-top\"><div id=\"bd-name\"></div><div id=\"bd-team\"></div><span id=\"bd-tj\"></span><div id=\"board-menu\">\n      <button type=\"button\" id=\"board-menu-toggle\" aria-label=\"メニュー\" aria-haspopup=\"dialog\" aria-expanded=\"false\" aria-controls=\"board-menu-panel\"><span aria-hidden=\"true\">☰</span><span>メニュー</span></button>\n      <dialog id=\"board-menu-panel\" aria-labelledby=\"board-menu-title\" hidden>\n        <div class=\"board-menu-heading\"><h2 id=\"board-menu-title\">メニュー</h2><button type=\"button\" id=\"board-menu-close\" aria-label=\"メニューを閉じる\">閉じる</button></div>\n        <div class=\"board-menu-items\">\n        <button type=\"button\" id=\"board-help\" data-information=\"help\" aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>遊び方</button>\n        <button type=\"button\" id=\"board-updates\" data-information=\"updates\" aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>更新履歴</button>\n        <a id=\"board-bug-report\" href=\"https://x.com/dog_cat_150/status/2108694851286122963?a=2e3RG90AIYfT3G0SNBs&amp;s=20\" target=\"_blank\" rel=\"noopener noreferrer\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>不具合報告<span class=\"menu-external\">別タブ ↗</span></a>\n        <button type=\"button\" id=\"board-credits\" data-information=\"credits\" aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>クレジット</button>\n        <button type=\"button\" id=\"board-preferences\" data-open-preferences aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>表示設定</button>\n        <button type=\"button\" id=\"board-share\" aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>共有</button>\n        <a id=\"board-support\" href=\"https://ofuse.me/dcb7f92e\" target=\"_blank\" rel=\"noopener noreferrer\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>開発を応援<span class=\"menu-external\">別タブ ↗</span></a>\n        <button type=\"button\" id=\"btn-restart\" title=\"タイトルに戻る\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>タイトルに戻る</button>\n        </div>\n      </dialog>\n    </div></div>\n    <div id=\"bd-period\"><span><b id=\"bd-year\">2026</b>年 · <b id=\"bd-age\">16</b>歳</span>\n    <div id=\"lamps\">\n      <span class=\"lamp\" id=\"lp0\"><i></i>シーズン前</span>\n      <span class=\"lamp\" id=\"lp1\"><i></i>シーズン中</span>\n      <span class=\"lamp\" id=\"lp2\"><i></i>シーズン終了</span>\n    </div></div>\n    <div id=\"bd-grid\">\n      <div class=\"bd-cell\"><b id=\"bd-ovr\">30</b><span>総合</span></div>\n      <div class=\"bd-cell\" id=\"salary-detail-trigger\" role=\"button\" tabindex=\"0\" aria-label=\"年俸、単位は万円。年俸の内訳を見る\" aria-haspopup=\"dialog\"><b id=\"bd-sal\">0</b><span>年俸（万）</span><small>年俸の内訳を見る</small></div>\n      <div class=\"bd-cell\"><b id=\"bd-risk\">0%</b><span>次回故障加算</span></div>\n    </div>\n  </header>";
export const SHELL_BOARD_11615="<header id=\"board\" style=\"display:none\">\n    <div id=\"bd-top\"><div id=\"bd-name\"></div><div id=\"bd-team\"></div><span id=\"bd-tj\"></span><div id=\"board-menu\">\n      <button type=\"button\" id=\"board-menu-toggle\" aria-label=\"メニュー\" aria-expanded=\"false\" aria-controls=\"board-menu-panel\"><span aria-hidden=\"true\">☰</span><span>メニュー</span></button>\n      <div id=\"board-menu-panel\" aria-label=\"ゲームメニュー\" hidden>\n        <button type=\"button\" id=\"board-help\" data-information=\"help\" aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>遊び方</button>\n        <button type=\"button\" id=\"board-updates\" data-information=\"updates\" aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>更新履歴</button>\n        <a id=\"board-bug-report\" href=\"https://x.com/dog_cat_150/status/2108694851286122963?a=2e3RG90AIYfT3G0SNBs&amp;s=20\" target=\"_blank\" rel=\"noopener noreferrer\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>不具合報告<span class=\"menu-external\">別タブ ↗</span></a>\n        <button type=\"button\" id=\"board-credits\" data-information=\"credits\" aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>クレジット</button>\n        <button type=\"button\" id=\"board-preferences\" data-open-preferences aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>表示設定</button>\n        <button type=\"button\" id=\"board-share\" aria-haspopup=\"dialog\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>共有</button>\n        <a id=\"board-support\" href=\"https://ofuse.me/dcb7f92e\" target=\"_blank\" rel=\"noopener noreferrer\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>開発を応援<span class=\"menu-external\">別タブ ↗</span></a>\n        <button type=\"button\" id=\"btn-restart\" title=\"タイトルに戻る\"><span class=\"menu-bullet\" aria-hidden=\"true\">•</span>タイトルに戻る</button>\n      </div>\n    </div></div>\n    <div id=\"bd-grid\">\n      <div class=\"bd-cell\"><b id=\"bd-age\">16</b><span>年齢</span></div>\n      <div class=\"bd-cell\"><b id=\"bd-year\">2026</b><span>年度</span></div>\n      <div class=\"bd-cell\"><b id=\"bd-ovr\">30</b><span>総合</span></div>\n      <div class=\"bd-cell\" id=\"salary-detail-trigger\" role=\"button\" tabindex=\"0\" aria-label=\"年俸、単位は万円。年俸の内訳を見る\" aria-haspopup=\"dialog\"><b id=\"bd-sal\">0</b><span>年俸（万）</span><small>年俸の内訳を見る</small></div>\n    </div>\n    <div id=\"lamps\">\n      <span class=\"lamp\" id=\"lp0\"><i></i>シーズン前</span>\n      <span class=\"lamp\" id=\"lp1\"><i></i>シーズン中</span>\n      <span class=\"lamp\" id=\"lp2\"><i></i>シーズン終了</span>\n    </div>\n  </header>";

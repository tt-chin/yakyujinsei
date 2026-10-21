import assert from 'node:assert/strict';

// Native renderer fixture: long contracts and money must fit without touching game S.
async function verifyDesktopContract(page,screenshot){
  const original=await page.evaluate(()=>({width:innerWidth,height:innerHeight,theme:document.documentElement.dataset.theme,font:document.documentElement.dataset.fontSize}));
  try{
    for(const width of [1180,1280,1440,1876,2560]){
      await page.setViewportSize({width,height:900});
      await page.locator('#desktop-career').waitFor({state:'visible'});
      for(const theme of ['standard','night','classic','scoreboard'])for(const font of ['small','medium','large']){
        const result=await page.evaluate(async({theme,font})=>{
          document.documentElement.dataset.theme=theme;document.documentElement.dataset.fontSize=font;
          const target=document.querySelector('#desktop-career').lastElementChild;
          const html=target.innerHTML;
          const {renderCareer}=await import('/src/ui/player-detail.js');
          renderCareer(target,{contract:{description:'2029～2035年 球団保有期間・複数年の保証契約',remainingYears:'7年',guaranteedTotal:'1,234,567,890万円',schedule:['2029年 123,456,789万円（支払済み）','2030年 123,456,789万円','2031年 123,456,789万円'],signingBonus:'123,456,789万円',developmentStipend:'1,234万円',yearOutsideIncome:'12,345万円',outsideIncome:'123,456万円',corpIncome:'1,234万円',careerEarnings:'1,234,567,890万円',history:[]}},'contract');
          const aside=document.querySelector('#desktop-career'),r=aside.getBoundingClientRect();
          return {html,left:r.left,right:r.right,width:r.width,overflow:document.documentElement.scrollWidth>innerWidth,
            labels:[...target.querySelectorAll('dt')].map(n=>({text:n.textContent,width:n.getBoundingClientRect().width})),
            values:[...target.querySelectorAll('dd')].map(n=>({scroll:n.scrollWidth,client:n.clientWidth})),
            texts:target.textContent};
        },{theme,font});
        try{
          assert.ok(!result.overflow);
          assert.ok(result.left>=0&&result.right<=width);
          if(width>=1876)assert.ok(result.width>500,'wide viewport uses previously empty margins');
          for(const label of result.labels)assert.ok(label.width>=80,'label must not collapse to one-character column: '+label.text);
          for(const value of result.values)assert.ok(value.scroll<=value.client+1,'contract value overflow');
          assert.match(result.texts,/1,234,567,890万円/);
          assert.match(result.texts,/2031年/);
          if(screenshot&&width===1876&&theme==='night'&&font==='large')await page.screenshot({path:screenshot.replace('menu-1280.png','contract-wide.png')});
        }finally{await page.evaluate(html=>{document.querySelector('#desktop-career').lastElementChild.innerHTML=html;},result.html);}
      }
    }
  }finally{
    await page.evaluate(o=>{document.documentElement.dataset.theme=o.theme;document.documentElement.dataset.fontSize=o.font;},original);
    await page.setViewportSize({width:original.width,height:original.height});
  }
}

// Current menu path; historical source controls retain their original visible button.
export async function openBoardAction(page,id,{touch=false}={}) {
  const action=page.locator('#'+id),toggle=page.locator('#board-menu-toggle');
  if(await toggle.count()&&!await action.isVisible())await toggle[touch?'tap':'click']();
  await action[touch?'tap':'click']();
}

export async function verifyBoardMenu(page,{width,screenshot}={}) {
  if(width===1280)await verifyDesktopContract(page,screenshot);
  for(const key of ['help','updates']){
    await page.locator('#board-menu-toggle').click();
    await page.locator('#board-menu-panel [data-information="'+key+'"]').click();
    const dialog=page.locator('#information-'+key);
    assert.equal(await dialog.isVisible(),true);
    assert.ok((await dialog.innerText()).length>100);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(),false);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'board-menu-toggle');
  }
  if(width>=1180){
    await page.locator('#desktop-player .ui-panel').first().waitFor();
    assert.equal(await page.locator('#desktop-career').isVisible(),true);
    assert.equal(await page.locator('.desktop-overview button').count(),0);
    const rects=await page.locator('.desktop-overview').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right};}));
    for(const r of rects)assert.ok(r.left>=0&&r.right<=width);
  }else assert.equal(await page.locator('#desktop-player').isVisible(),false);
  const toggle=page.locator('#board-menu-toggle'),panel=page.locator('#board-menu-panel');
  assert.equal(await toggle.count(),1);
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert.equal(await panel.isVisible(),false);
  await toggle.focus();await page.keyboard.press('Enter');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  const ids=await panel.locator('button,a').evaluateAll(nodes=>nodes.map(n=>n.id));
  assert.deepEqual(ids,['board-help','board-updates','board-preferences','board-share','board-support','btn-restart']);
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'board-help');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'btn-restart');
  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'board-help');
  await page.keyboard.press('Escape');
  assert.equal(await panel.isVisible(),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'board-menu-toggle');
  await toggle.click();await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'board-help');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'board-menu-toggle');
  await page.locator('#bd-name').click();
  assert.equal(await panel.isVisible(),false);
  await toggle.click();await toggle.click();
  assert.equal(await panel.isVisible(),false);
  await toggle.click();
  const geometry=await panel.locator('button,a').evaluateAll(nodes=>nodes.map(n=>{
    const r=n.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};
  }));
  for(const box of geometry){assert.ok(box.width>=44&&box.height>=44);assert.ok(box.left>=0&&box.right<=width);}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(screenshot)await page.screenshot({path:screenshot});
  const support=page.locator('#board-support');
  assert.equal(await support.getAttribute('href'),'https://ofuse.me/dcb7f92e');
  assert.equal(await support.getAttribute('target'),'_blank');
  assert.match(await support.getAttribute('rel'),/noopener/);
  assert.match(await support.getAttribute('rel'),/noreferrer/);
  await page.context().route('https://ofuse.me/dcb7f92e',route=>route.fulfill({body:'<!doctype html><title>OFUSE test destination</title>',contentType:'text/html'}));
  const popupReady=page.waitForEvent('popup');
  await support.click();const popup=await popupReady;await popup.waitForLoadState();
  assert.equal(popup.url(),'https://ofuse.me/dcb7f92e');
  assert.equal(await popup.evaluate(()=>window.opener),null);
  await popup.close();
  assert.equal(await panel.isVisible(),false);
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
}

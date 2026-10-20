import assert from 'node:assert/strict';

// Current menu path; historical source controls retain their original visible button.
export async function openBoardAction(page,id,{touch=false}={}) {
  const action=page.locator('#'+id),toggle=page.locator('#board-menu-toggle');
  if(await toggle.count()&&!await action.isVisible())await toggle[touch?'tap':'click']();
  await action[touch?'tap':'click']();
}

export async function verifyBoardMenu(page,{width,screenshot}={}) {
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

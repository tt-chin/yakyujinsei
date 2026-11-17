import assert from 'node:assert/strict';

// Exercise the real disclosure control. Never reveal content by changing DOM,
// replacing innerText with textContent, or archiving one-time trait descriptions.
export async function openReaderDetails(card,{snapshot,allowLegacy=false}={}){
  assert.equal(await card.count(),1,'one original result card');
  const before=snapshot?await snapshot():null;
  const details=card.locator(':scope > details[data-reader-details]');
  const count=await details.count();
  if(!count&&allowLegacy){assert.equal(await card.isVisible(),true,'legacy result card visible');return;}
  assert.equal(count,1,'one native reader disclosure');
  const summary=details.locator(':scope > summary');
  assert.equal(await summary.count(),1,'one native summary control');
  if(!(await details.evaluate(node=>node.open)))await summary.click();
  assert.equal(await details.evaluate(node=>node.open),true,'native disclosure opened');
  assert.equal(await details.locator(':scope > [data-reader-body]').isVisible(),true,'original body visible');
  if(snapshot)assert.deepEqual(await snapshot(),before,'reading the disclosure preserves complete state/RNG');
}

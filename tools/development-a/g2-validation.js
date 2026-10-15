// Shared Node/browser acceptance suite. Imports the actual product module, not a copy.
import {canonicalAwardBytes,independentAwardDraw,decideIndependentAward,awardProbabilityHit}
  from '../../docs/src/engine/award-rng-policy.js';
export function validateG2(vectors) {
  const cases=[];
  const check=(id,fn)=>{try{fn();cases.push({id,status:'PASS'});}catch(e){cases.push({id,status:'FAIL',error:String(e.stack||e)});}};
  const equal=(a,b)=>{if(a!==b)throw Error('Expected '+String(b)+', actual '+String(a));};
  const rejects=fn=>{let threw=false;try{fn();}catch(e){if(e.code!=='INVALID_AWARD_CONTEXT')throw e;threw=true;}equal(threw,true);};
  for(const v of vectors)check(v.id,()=>{
    const draw=independentAwardDraw(v.identity,v.identity.seed);
    equal(draw.drawKey,v.hex);equal(draw.hash32,v.hash32);equal(draw.u,v.u);
    equal(draw.u,draw.hash32/4294967296);
    equal(JSON.stringify(independentAwardDraw(v.identity,v.identity.seed)),JSON.stringify(draw));
  });
  const base=vectors[0].identity;
  for(const [key,values] of Object.entries({seed:['',null,0],year:[0,10000,NaN,Infinity,1.5,'2035'],
    league:['MiLB','npb',''],awardId:['MVP','__proto__'],ruleId:['p01-b-v2',''],domain:['other']}))
    for(const value of values)check('invalid '+key+' '+String(value),()=>rejects(()=>canonicalAwardBytes({...base,[key]:value},base.seed)));
  check('initialized seed mismatch',()=>rejects(()=>canonicalAwardBytes(base,'other')));
  check('byte length bound',()=>rejects(()=>canonicalAwardBytes({...base,seed:'😀'.repeat(300)},'😀'.repeat(300))));
  check('surrogate replacement equivalence',()=>{
    const a=independentAwardDraw({...base,seed:'\ud800'},'\ud800'),b=independentAwardDraw({...base,seed:'\ufffd'},'\ufffd');
    equal(a.drawKey,b.drawKey);equal(a.hash32,b.hash32);
  });
  for(const [u,p,result] of [[0,0,false],[0,100,true],[0,10,true],[.1,10,false],[.5,50,false],
    [4294967295/4294967296,100,true],[4294967295/4294967296,99,false]])
    check('probability '+u+'/'+p,()=>equal(awardProbabilityHit(u,p),result));
  for(const p of [-1,101,NaN,Infinity,'50'])check('invalid probability '+String(p),()=>rejects(()=>decideIndependentAward(base,p,base.seed)));
  for(const u of [-1,1,NaN,Infinity])check('invalid u '+String(u),()=>rejects(()=>awardProbabilityHit(u,50)));
  for(const p of [0,100])check('deterministic '+p,()=>{
    const d=decideIndependentAward(base,p,base.seed);equal(d.hash32,null);equal(d.u,null);equal(d.awarded,p===100);
  });
  check('reverse calculation order leaves each key unchanged',()=>{
    const f=vectors.map(v=>independentAwardDraw(v.identity,v.identity.seed));
    const r=vectors.slice().reverse().map(v=>independentAwardDraw(v.identity,v.identity.seed)).reverse();
    equal(JSON.stringify(f),JSON.stringify(r));
  });
  return {suite:'G2_PRODUCT_MODULE',PASS:cases.filter(c=>c.status==='PASS').length,
    FAIL:cases.filter(c=>c.status==='FAIL').length,cases};
}

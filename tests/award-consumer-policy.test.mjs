import assert from 'node:assert/strict';
import {AWARD_REGISTRY,buildAwardIdentityView} from '../docs/src/engine/award-identity-policy.js';
import {consumerAwardView,awardConsumerEntitlement as entitlement} from '../docs/src/engine/award-consumer-policy.js';

let passed=0;
const check=(name,f)=>{f();passed++;console.log('PASS '+name);};
const row=name=>buildAwardIdentityView(['2039 NPB'+name])[0];
const expected={
  LEGACY_BEST_PITCHER:[.75,2,'BEST_PITCHER',460,0,1,0,true,true],
  PITCH_WINS:[.35,1,'TITLE',160,0,0,1,false,false],
  PITCH_ERA:[.35,1,'TITLE',160,0,0,1,false,false],
  PITCH_STRIKEOUTS:[.35,1,'TITLE',160,0,0,1,false,false],
  PITCH_WIN_PCT:[.35,1,'TITLE',160,0,0,1,false,false],
  PITCH_SAVES:[.35,1,'TITLE',160,0,0,1,false,false],
  PITCH_RELIEF:[.35,1,'TITLE',160,0,0,1,false,false],
  PITCH_TRIPLE_CROWN:[0,0,null,0,0,0,0,false,false],
  PITCH_SAWAMURA:[.75,2,'SAWAMURA',460,0,1,0,false,false],
  MVP:[.75,2,'MVP',420,1,0,0,true,true],
  ROOKIE:[.25,0,null,140,0,0,0,true,true],
  BATTING_AVG:[.35,1,'TITLE',160,0,0,1,true,true],
  BATTING_HR:[.35,1,'TITLE',160,0,0,1,true,true],
  BATTING_RBI:[.35,1,'TITLE',160,0,0,1,false,true],
  BATTING_SB:[.35,1,'TITLE',160,0,0,1,false,true],
  BATTING_OBP:[.35,1,'TITLE',160,0,0,1,false,false],
  GOLD_GLOVE:[.25,1,'GOLD_GLOVE',300,0,0,1,false,true],
  DEFENSE_BEST:[.25,1,'GOLD_GLOVE',220,0,0,1,false,false],
  ALL_STAR:[0,0,null,0,0,0,0,false,false],
  HITTER_TC:[0,0,null,0,0,0,0,false,true],
};
for(const [id,values] of Object.entries(expected))for(const label of ['NPB','KBO','台湾プロ野球','メジャーリーグ']){
  check(id+'/'+label+' distinct consumer contract',()=>{
    const r=buildAwardIdentityView(['2039 '+label+AWARD_REGISTRY[id].displayName])[0];
    const hof=entitlement(r,'hof');
    assert.deepEqual([entitlement(r,'market'),entitlement(r,'fallback'),entitlement(r,'incentive'),
      hof.sc,hof.mvp,hof.aceN,hof.king,entitlement(r,'phoenix'),entitlement(r,'demotion')],values);
  });
}
check('identity alias does not grant market/fallback/HOF entitlement',()=>{
  const alias=row('ホームラン王');assert.equal(alias.awardId,'BATTING_HR');
  for(const c of ['market','fallback'])assert.equal(entitlement(alias,c),0);
  assert.equal(entitlement(alias,'hof').sc,0);assert.equal(entitlement(alias,'incentive'),'TITLE');
});
check('semantic alias aggregate preserves entitlement of an actual canonical source',()=>{
  const h=Object.freeze(['2039 NPBホームラン王','2039 NPB本塁打王']);
  const r=consumerAwardView(h)[0];assert.equal(entitlement(r,'market'),.35);
  assert.deepEqual(h,['2039 NPBホームラン王','2039 NPB本塁打王']);
});
check('P08 effects are not authorized by a historical recognized string',()=>{
  const r=row('沢村賞');assert.equal(entitlement(r,'phoenix'),false);
  assert.equal(entitlement(r,'demotion'),false);
});
check('unknown/invalid never grant entitlements',()=>{
  for(const raw of ['2039 NPB年間MVP候補','2039 NPB神秘王',null,{},'2039 NPB最佳投手']){
    const r=buildAwardIdentityView([raw])[0];
    for(const c of ['market','fallback','incentive','hof','phoenix','demotion'])assert.equal(entitlement(r,c),null);
    assert.deepEqual(consumerAwardView([raw]),[]);
  }
});
check('context filtering never guesses historical league from current team',()=>{
  const h=Object.freeze(['2038 NPB年間MVP','2039 KBO首位打者','2039 NPB首位打者']);
  assert.deepEqual(consumerAwardView(h,{year:2039,league:'KBO'}).map(r=>r.originalText),[h[1]]);
  assert.equal(consumerAwardView(h,{year:2040}).length,0);
});
console.log(JSON.stringify({PASS:passed,FAIL:0,evidence:'PURE_CONSUMER_CONTRACT; NOT_PRODUCT_WIRING_ACCEPTANCE'}));

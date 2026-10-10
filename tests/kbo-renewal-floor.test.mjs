import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import * as market from '../docs/src/engine/cross-league-market-policy.js';
import * as contract from '../docs/src/engine/contract-policy.js';
import {calculateControlOffer} from '../docs/src/engine/control-period-policy.js';
import {calculateSalaryCurve,convertRatingBetweenLevels,roundToTenThousandYen} from '../docs/src/engine/salary-promotion-policy.js';
import {createIncentiveTerms} from '../docs/src/engine/incentive-policy.js';
import {createSigningBonusTerms} from '../docs/src/engine/signing-bonus-policy.js';
import {createChoiceActionToken,runChoiceAction} from '../docs/src/ui/choice-action.js';

// --baseline runs these same acceptance assertions against the previous production source.
const baseline=process.argv.find(a=>a.startsWith('--baseline='))?.slice(11);
const read=rel=>baseline?execFileSync('git',['show',`${baseline}:${rel}`],{encoding:'utf8',maxBuffer:20e6}):readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const policy=baseline?await import('data:text/javascript;base64,'+Buffer.from(read('docs/src/engine/cross-league-market-policy.js')).toString('base64')):market;
const cap=policy.applyKboForeignPackageCap,game=read('docs/src/engine/game.js').replace(/\r\n/g,'\n');
let cases=0;
const test=(name,run)=>{try{run();cases++;console.log('PASS '+name);}catch(error){console.error('FAIL '+name+': '+error.message);process.exit(1);}};
test('KBO1 normal renewal unchanged',()=>assert.equal(cap({annualSalary:50_000_000,isRenewal:true,previousPackage:53_500_000,levelMinimum:40_000_000}).annualSalary,50_000_000));
test('KBO2 normal renewal unchanged',()=>assert.equal(cap({annualSalary:12_000_000,isRenewal:true,previousPackage:12_840_000,levelMinimum:8_000_000}).annualSalary,12_000_000));
test('below-minimum DH candidate uses approved floor',()=>assert.equal(cap({annualSalary:7_360_000,isRenewal:true,previousPackage:179_980_000,levelMinimum:8_000_000}).annualSalary,8_000_000));
test('KBO1 below floor and zero candidate',()=>{for(const annualSalary of [0,36_800_000])assert.equal(cap({annualSalary,levelMinimum:40_000_000}).annualSalary,40_000_000);});
test('rounding near package cap remains legal',()=>{for(const annualSalary of [140_179_999,140_180_000,140_185_000,150_000_000]){const r=cap({annualSalary,levelMinimum:40_000_000});assert.equal(r.packageCap,150_000_000);assert.ok(r.annualSalary+r.incentiveMax<=r.packageCap);assert.ok(r.annualSalary>=40_000_000);assert.equal(r.annualSalary%10_000,0);}});
test('renewal upper bound and fixed costs unchanged',()=>{const r=cap({annualSalary:400_000_000,isRenewal:true,previousPackage:400_000_000,signingBonus:5_000_000,postingFee:2_000_000,levelMinimum:40_000_000});assert.equal(r.packageCap,300_000_000);assert.ok(r.annualSalary+r.incentiveMax+7_000_000<=300_000_000);});
test('genuine floor/package and fixed-cost conflicts still throw',()=>{for(const annualSalary of [1,150_000_000])assert.throws(()=>cap({annualSalary,levelMinimum:142_000_000}),/KBO_PACKAGE_FLOOR_CAP_CONFLICT/);assert.throws(()=>cap({annualSalary:8_000_000,levelMinimum:8_000_000,signingBonus:149_000_000}),/KBO_PACKAGE_FLOOR_CAP_CONFLICT/);assert.throws(()=>cap({annualSalary:8_000_000,signingBonus:150_010_000}),/KBO_PACKAGE_FIXED_COST_EXCEEDS_CAP/);});

// Execute the active game functions verbatim, with UI-only collaborators replaced.
const between=(start,end)=>{const a=game.indexOf(start),b=game.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return game.slice(a,b);};
function harness(){
 const S={year:2049,age:39,pos:'IF',stage:'PRO',org:'KBO',lv:'KBO1',orgTeamId:'KBO_GWANGJU_TIGERS',currentSalary:168_210_000,contractSequence:9,marketInjury:'HEALTHY',serviceTime:{KBO:8},salaryEvaluationHistory:[],salaryDecisionHistory:[],stats:{},skipMid:true};
 let old=contract.createContract({contractId:'KBO:KBO_DAEGU_LIONS:2041:009',org:'KBO',teamId:S.orgTeamId,signedYear:2041,startYear:2042,years:3,annualSalary:140_180_000,contractType:'OVERSEAS_FA'});
 old=contract.appendExtension(old,{signedYear:2043,startYear:2045,years:5,annualSalary:168_210_000,incentive:createIncentiveTerms({org:'KBO',annualSalary:168_210_000})});
 for(let year=2042;year<=2049;year++)old=contract.markSalaryPaid(old,year).contract;S.ct=old;
 const context=vm.createContext({S,...policy,...contract,calculateControlOffer,calculateSalaryCurve,convertRatingBetweenLevels,roundToTenThousandYen,createIncentiveTerms,createSigningBonusTerms,
  currentMarketRating:()=>-5.75,dpMult:()=>.92,ovr:()=>44,injurySalaryMultiplier:()=>1,isRecentStar:()=>false,serviceYearsFor:org=>S.serviceTime[org]||0,previousSalaryForOffer:()=>S.currentSalary,hadAmericanContract:()=>false,migrateSalaryV130State:()=>{},
  card:()=>{},board:()=>{},bindLatestSalaryDetailLink:()=>{},fmtMoney:String,salaryDecisionSummary:()=>'',salaryDecisionLink:()=>'',isBelowActiveMinimum:()=>false,
  saveSalaryDecision:(type,candidate,previousSalary,finalSalary)=>S.salaryDecisionHistory.push({type,candidate,previousSalary,finalSalary}),advances:0});
 vm.runInContext('const LV='+game.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1]+';const PATHS={KBO:["KBO2","KBO1"]};let salaryFor,salaryCandidate,applyDemotionSalary,markClubInitiatedRenewal;'+
  between('  salaryFor = function','\n\n  let pendingOffseasonSalary')+';let pendingOffseasonSalary=null;'+
  game.match(/  const kboPreviousPackage=[^\n]+/)[0]+between('  salaryCandidate=','\n  function saveSalaryDecision')+
  game.match(/  const nextContractId=[^\n]+/)[0]+game.match(/  function fixedContract[^\n]+/)[0]+
  between('  function finalizePendingOffseasonSalary','\n  function applyLevelSalary')+
  between('  function applyLevelSalary','\n  appendContractExtension=')+
  'function advance(){finalizePendingOffseasonSalary();advances++;}'+between('function movement(){','\nfunction buyoutRemaining'),context);
 return{S,old,run:code=>vm.runInContext(code,context),context};
}
test('native candidate and fixedContract floor without RNG',()=>{const h=harness();h.S.lv='KBO2';const c=h.run('salaryCandidate()');assert.equal(c.baseSalary,8_000_000);assert.equal(c.positionMult,.92);assert.equal(c.annualSalary,8_000_000);h.context.candidate=c;const signed=h.run('fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary:7_360_000,candidate})');assert.equal(signed.annualSalary,8_000_000);assert.equal(signed.incentive.rate,.07);assert.deepEqual(h.S.ct,h.old);});
test('expiry -> demotion -> native movement renewal preserves guarantees',()=>{const h=harness(),original=structuredClone(h.old);assert.equal(h.S.ct.remainingYears,0);h.run('S.lv="KBO2";applyDemotionSalary("KBO1","KBO2");movement();');assert.equal(h.S.currentSalary,126_160_000);assert.equal(h.S.ct.annualSalary,126_160_000);assert.equal(h.S.ct.startYear,2050);assert.equal(h.S.ct.years,1);assert.equal(h.S.salaryDecisionHistory.length,1);assert.equal(h.S.salaryDecisionHistory[0].finalSalary,h.S.currentSalary);assert.deepEqual(h.old,original);assert.equal(h.run('advances'),1);});
test('same action finalizes once; salary payment duplicate is rejected',()=>{const h=harness();h.run('S.lv="KBO2";applyDemotionSalary("KBO1","KBO2");');const token=createChoiceActionToken(1),run=()=>runChoiceAction({token,currentGeneration:()=>1,action:()=>h.run('finalizePendingOffseasonSalary()'),currentMarkup:()=>'',clear:()=>{},restore:()=>{}});run();assert.equal(run(),'duplicate');const saved=JSON.stringify(h.S);h.run('finalizePendingOffseasonSalary()');assert.equal(JSON.stringify(h.S),saved);assert.equal(h.S.contractSequence,10);const paid=contract.markSalaryPaid(h.S.ct,2050);assert.equal(paid.amount,126_160_000);assert.throws(()=>contract.markSalaryPaid(paid.contract,2050),/CONTRACT_SALARY_ALREADY_PAID/);});
assert.doesNotMatch(read('docs/src/engine/cross-league-market-policy.js'),/\b(?:R|ri|chance|pick)\s*\(/);
console.log(`KBO renewal floor: ${cases} cases PASS; native candidate/finalization; RNG-free policy.`);

import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {internationalBonus,createSigningBonusTerms,calculatePostingFee,applySigningPayment,NPB_BONUS_RANGES} from '../docs/src/engine/signing-bonus-policy.js';
import {getCrossLeaguePolicy,applyCrossLeagueSalary,applyKboForeignPackageCap,marketTier,accrueForeignFirstTeamSeason,foreignProSeasons} from '../docs/src/engine/cross-league-market-policy.js';
import {createContract,normalizeContract,transferContract,appendExtension,calculateScheduledBuyout} from '../docs/src/engine/contract-policy.js';
import {calculateControlOffer} from '../docs/src/engine/control-period-policy.js';
import {salaryDetailMarkup} from '../docs/src/ui/salary-detail.js';
const money=n=>`${n/10000}万円`,p=(extra={})=>getCrossLeaguePolicy({sourceOrg:'NPB',sourceLevel:'NPB1',targetOrg:'CPBL',targetLevel:'CPBL1',age:21,...extra});
for(const folder of ['../docs/src/','../docs/src/engine/','../docs/src/ui/']){const dir=new URL(folder,import.meta.url);for(const name of readdirSync(dir).filter(n=>n.endsWith('.js'))){const url=new URL(name,dir),source=readFileSync(url,'utf8');for(const m of source.matchAll(/(?:from\s*|import\s*\()['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))assert.ok(existsSync(new URL(m[1],url)),name+' import '+m[1]);}}
for(const name of ['signing-bonus-policy.js','cross-league-market-policy.js'])assert.doesNotMatch(readFileSync(new URL('../docs/src/engine/'+name,import.meta.url),'utf8'),/\b(?:R|ri|chance|pick)\s*\(/,'new prices must not consume RNG');
assert.deepEqual(NPB_BONUS_RANGES,[[8000,10000],[5000,7500],[3500,5500],[2500,4500],[2000,3500],[1500,3000]]);
for(const [o,amount] of [[0,300],[40,300],[45,650],[50,1000],[55,2000],[60,3000],[65,5500],[70,8000],[75,14000],[80,20000],[99,20000]])assert.equal(internationalBonus(o),amount*10000);
for(const type of ['ROSTER','DEVELOPMENT']){
 const terms=createSigningBonusTerms({route:'NPB_DRAFT',draftType:type,bonus:50_000_000}),s={careerEarnings:0},ct=createContract({contractId:type,org:'NPB',teamId:'T',startYear:2027,years:1,annualSalary:3_000_000,...terms});
 assert.equal(applySigningPayment(s,ct).paid,true);const saved=structuredClone(s);assert.equal(applySigningPayment(s,normalizeContract(ct)).paid,false);assert.deepEqual(s,saved);
 assert.equal(ct.signingBonus,type==='DEVELOPMENT'?0:50_000_000);assert.equal(s.careerDevelopmentStipend,type==='DEVELOPMENT'?2_900_000:0);
 assert.equal(s.careerEarnings,terms.playerIncome);assert.equal(ct.guaranteedTotal,3_000_000);assert.equal(calculateScheduledBuyout(ct,1).buyoutAmount,3_000_000);
 assert.equal(transferContract(ct,{org:'NPB',teamId:'T2'}).signingPaymentStatus,'PAID');assert.equal(appendExtension(ct,{startYear:2028,years:1,annualSalary:3_000_000}).signingPaymentStatus,'PAID');
 assert.equal(applySigningPayment(s,normalizeContract({...ct,signingPaymentStatus:'PENDING'})).paid,false);
}
const old=normalizeContract({schemaVersion:3,contractId:'OLD',annualSchedule:[{year:2027,amount:3_000_000}],segments:[],signingBonus:5_000_000});assert.equal(old.signingBonusType,'LEGACY');assert.equal(old.developmentStipend,0);assert.equal(applySigningPayment({careerEarnings:100},old).paid,false);
for(const g of [0,25_000_000*150,50_000_000*150,60_000_000*150]){const fee=calculatePostingFee({guaranteedTotal:g,major:true,eligible:true});assert.equal(fee,[0,750_000_000,1_406_250_000,1_631_250_000][[0,25_000_000*150,50_000_000*150,60_000_000*150].indexOf(g)]);}
assert.equal(calculatePostingFee({signingBonus:80_000_000,eligible:true}),20_000_000);assert.equal(calculatePostingFee({signingBonus:80_000_000}),0);
const normal=applyCrossLeagueSalary({marketSalary:100_030_000,previousSalary:9_000_000,levelMinimum:12_000_000,policy:p()});assert.equal(normal.annualSalary,22_500_000);assert.ok(normal.reasonCodes.includes('CROSS_LEAGUE_RAISE_CAP'));
assert.equal(applyCrossLeagueSalary({marketSalary:100_030_000,previousSalary:9_000_000,levelMinimum:12_000_000,policy:p({tier:'STAR'})}).annualSalary,36_000_000);
assert.equal(applyCrossLeagueSalary({marketSalary:100_030_000,previousSalary:9_000_000,levelMinimum:12_000_000,policy:p({transferType:'RELEASE_RECONTRACT'})}).annualSalary,13_500_000);
const low=applyCrossLeagueSalary({marketSalary:0,previousSalary:1_000_000,levelMinimum:12_000_000,policy:p()});assert.equal(low.annualSalary,12_000_000);assert.ok(low.reasonCodes.includes('LEAGUE_MINIMUM_APPLIED'));
assert.throws(()=>applyCrossLeagueSalary({marketSalary:0,levelMinimum:90_000_000,policy:p()}),/FLOOR_CAP_CONFLICT/);
for(const age of [24,25,26])for(const serviceYears of [5,6,7])assert.equal(p({targetOrg:'MLB',targetLevel:'MLB',age,serviceYears}).eligibilityType,age>=25&&serviceYears>=6?'FOREIGN_PRO_EXEMPT':'MLB_INTL_RESTRICTED');
assert.equal(p({targetOrg:'MLB',targetLevel:'MLB',age:23,hasAmericanExperience:true}).restrictedTargetLevel,'MLB');
const npb=p({sourceOrg:'MLB',sourceLevel:'MLB',targetOrg:'NPB',targetLevel:'NPB1'});assert.equal(applyCrossLeagueSalary({marketSalary:30_000_000,previousSalary:1_000_000_000,levelMinimum:16_000_000,policy:npb}).annualSalary,34_500_000);
assert.equal(p({sourceOrg:'MLB',sourceLevel:'MLB',targetOrg:'NPB',targetLevel:'NPB1',mlbServiceYears:10}).applyAnchor,true,'MLB free agency does not waive the NPB return anchor');
for(const src of ['NPB','KBO','CPBL','MLB','MiLB'])for(const dst of ['NPB','KBO','CPBL','MLB','MiLB']){const lv={NPB:'NPB1',KBO:'KBO1',CPBL:'CPBL1',MLB:'MLB',MiLB:'A3'};assert.doesNotThrow(()=>getCrossLeaguePolicy({sourceOrg:src,sourceLevel:lv[src],targetOrg:dst,targetLevel:lv[dst],age:30,serviceYears:6}));}
for(const isRenewal of [false,true])for(const annualSalary of [40_000_000,140_190_000,1_500_000_000])for(const bonus of [0,10_000_000]){const c=applyKboForeignPackageCap({annualSalary,signingBonus:bonus,isRenewal,previousPackage:200_000_000,levelMinimum:8_000_000});assert.ok(c.annualSalary+c.incentiveMax+bonus<=c.packageCap);assert.equal(c.annualSalary%10000,0);}
assert.equal(applyKboForeignPackageCap({annualSalary:2_000_000_000,isRenewal:true,previousPackage:900_000_000}).packageCap,300_000_000);
assert.throws(()=>applyKboForeignPackageCap({annualSalary:40_000_000,signingBonus:160_000_000}),/FIXED_COST_EXCEEDS_CAP/);
assert.equal(marketTier({overall:54,marketRating:6,history:[]}), 'NORMAL');const history=[{level:'NPB1',payD:6,sampleStatus:'FULL'},{level:'CPBL1',payD:6,sampleStatus:'FULL'}];assert.equal(marketTier({overall:65,marketRating:6,history}),'ELITE');assert.equal(marketTier({overall:60,marketRating:3,history}),'STAR');
const state={year:2027,lv:'NPB2',seasonFactor:1};assert.equal(accrueForeignFirstTeamSeason(state),0);state.lv='NPB1';state.seasonFactor=.49;assert.equal(accrueForeignFirstTeamSeason(state),0);state.seasonFactor=.5;assert.equal(accrueForeignFirstTeamSeason(state),1);state.lv='KBO1';assert.equal(accrueForeignFirstTeamSeason(state),1);state.year++;state.lv='CPBL1';assert.equal(accrueForeignFirstTeamSeason(state),2);assert.equal(foreignProSeasons({stats:{NPB:{yr:20}}}),0);
for(const [previousSalary,rate] of [[100_000_000,.75],[100_010_000,.60]])assert.equal(calculateControlOffer({org:'NPB',marketSalary:0,previousSalary}).floorRate,rate);assert.equal(calculateControlOffer({org:'KBO',marketSalary:0,previousSalary:200_000_000}).floorRate,.75);
const ct=createContract({contractId:'UI',startYear:2027,years:1,annualSalary:3_000_000,developmentStipend:2_900_000,postingFee:100_000_000});const html=salaryDetailMarkup(null,{fmtMoney:money,contract:ct});assert.ok(html.includes('育成支度金'));assert.ok(html.includes('生涯収入対象外'));assert.doesNotMatch(html,/NaN|undefined/);
console.log('Global contract market: route matrix, thresholds, caps/floors, posting, income idempotency, legacy and UI passed.');

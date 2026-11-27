import assert from 'node:assert/strict';
import {seasonEndOpening,rngCallsBefore,careerBefore} from './support/first-difference.mjs';

// NPB-OFFER-WINDOW-01 / MLB-POSTING-DESIGN-01: synthetic rows for the bound that historical career comparisons
// (international-personal-stats, full-power-pitching, the phoenix control) stop at. Rows carry beforeState like E2E rows.
const row=(year,action,lv='NPB1')=>({action,beforeState:{year,lv}});
const stats=row(2042,'▸ 今季の成績を見る'),stay=row(2042,'現在の球団に残留'),next=row(2043,'▸ トレーニング成果を割り振る（サイコロ3個）');
const kbo=team=>row(2042,'韓国プロ野球への海外移籍：'+team);
let cases=0;const check=(name,actual,expected)=>{assert.deepEqual(actual,expected,name);cases++;};

// seasonEndOpening(control, now): index of the row whose click opened a new choice the control lacks, else null.
check('new choice the control lacks opens at the previous row',seasonEndOpening([stats,next],[stats,stay]),0);
check('control ends before the choice',seasonEndOpening([stats],[stats,stay]),0);
check('identical careers',seasonEndOpening([stats,stay,next],[stats,stay,next]),null);
check('same existing choice at the same index',seasonEndOpening([stats,kbo('A')],[stats,kbo('A')]),null);
// Reviewer finding: the old engine's KBO/CPBL/stay menu has the same labels, so a differently labeled same-year
// choice in the control is a real difference (e.g. another team drawn), never an approved opening.
check('control has a same-year choice with another label',seasonEndOpening([stats,kbo('A')],[stats,kbo('B')]),null);
check('control has a same-year stay where now offers KBO',seasonEndOpening([stats,stay],[stats,kbo('B')]),null);
check('control choice of another year does not count',seasonEndOpening([stats,row(2041,'現在の球団に残留')],[stats,stay]),0);
check('not NPB1',seasonEndOpening([stats,next],[stats,row(2042,'現在の球団に残留','NPB2')]),null);
check('year changed since the previous row',seasonEndOpening([row(2041,'確定 ▸'),next],[row(2041,'確定 ▸'),row(2042,'現在の球団に残留')]),null);
check('first row is never an opening',seasonEndOpening([next],[stay]),null);
check('no choice at all',seasonEndOpening([stats,next],[stats,next]),null);

// rngCallsBefore(rng, rngState): draws before the opening row; the prefix must end at that state.
const rng=[{before:1,after:2,value:.1},{before:2,after:3,value:.2},{before:3,after:4,value:.3}];
check('state before a later draw',rngCallsBefore(rng,3),2);
check('state before the first draw',rngCallsBefore(rng,1),0);
check('opening after the last draw',rngCallsBefore(rng,4),3);
assert.throws(()=>rngCallsBefore(rng,9),/RNG prefix ends at the opening state/,'unknown state must not cut silently');cases++;
check('no draws at all',rngCallsBefore([],5),0);

// careerBefore(career, actionsKey, k, calls): rows before k, row k's before-state, draws and awards before the opening.
const career={actions:[stats,row(2042,'確定 ▸'),stay],rng,awards:[{callsBefore:0,callsAfter:1},{callsBefore:1,callsAfter:2},{callsBefore:2,callsAfter:3}]};
const cut=careerBefore(career,'actions',1,2);
check('rows',cut.actions,[stats]);
check('opening state',cut.opening,career.actions[1].beforeState);
check('draws',cut.rng,rng.slice(0,2));
check('awards started before the opening',cut.awards,career.awards.slice(0,2));
check('only the cut fields',Object.keys(cut).sort(),['actions','awards','opening','rng']);
check('steps key',Object.keys(careerBefore({steps:career.actions,rng,awards:[]},'steps',1,0)).sort(),['awards','opening','rng','steps']);

console.log('season-end-opening: '+cases+' cases PASS');

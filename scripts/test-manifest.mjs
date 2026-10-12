import {readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// One entry per executable; wider profiles replace, rather than repeat, quick runs.
const browserProfiles = {
  'stage10-risk-e2e': {seconds:240,reason:'Pre-refactor investigation: natural trait routes, overseas salary flow, explicit return faults and passive LEGACY traces. Desired-behaviour failures remain FAIL; no Quick profile.'},
  'stage6-ability-e2e': {seconds:120,reason:'Original allocation matrix and stale-callback safety assertions; expectations preserved.'},
  'stage6-state-transaction-e2e': {seconds:40,reason:'Native CORP reentry and explicit signing fault injection; not proof of a naturally reachable UI bug.'},
  'stage7-safety-e2e': {seconds:90,reason:'Current-session callbacks, CORP settlement faults/year boundary, signing redraw retry and next-year payment.'},
  'bug-act-01-02-e2e': {quick:['--fixtures-only'], seconds:500},
  'kbo-renewal-e2e': {quick:['--quick'], seconds:40},
  'draft-income-e2e': {quick:['--quick'], comparison:'baseline', seconds:350},
  'contract-salary-e2e': {comparison:'compare', seconds:90},
  'display-preferences-e2e': {args:['--only-seed=yakyo-test-001,jp3-infielder-01'], comparison:'baseline', seconds:260},
  'event-system-e2e': {seconds:150},
  'event-fix-e2e': {seconds:15},
  'global-contract-market-e2e': {args:['--quick'], seconds:30},
  'hof-first-ballot-e2e': {seconds:50},
  'npb-return-e2e': {args:['--quick'], seconds:60},
  'replay-share-theme-e2e': {args:['--ui-only'], seconds:30},
  'salary-history-e2e': {args:['--ui-only'], seconds:20},
  'trait-system-e2e': {args:['--ui-only'], seconds:30},
  'championship-intl-e2e': {args:['--ui-only'], seconds:30},
};
const nonTests = {
  'support/stage6-browser.mjs': ['support','Test-only native browser fixture and state/RNG/DOM trace; imported by Stage 6 probes.'],
  'support/first-difference.mjs': ['support','Read-only first-difference diagnostic, imported by historical E2E controls.'],
  'retirement-hof-test-support.mjs': ['support','Imported VM fixtures; not an executable test.'],
  'retirement-hof-analysis.mjs': ['analysis','Requires approved captured pilot/vote input; rewrites historical report data. Run explicitly outside automatic profiles.'],
  'retirement-hof-report.mjs': ['report','Rewrites historical approved report; not an automatic regression.'],
  'fixed-seed-regression.json': ['fixture','Historical fixture, not currently imported; preserve for external consumers.'],
  'fixtures/draft-income-routes.json': ['fixture','Recorded positive and negative route choices, consumed by draft-income E2E.'],
};
export function inventory(root) {
  const files = readdirSync(new URL('tests/',root), {recursive:true,withFileTypes:true})
    .filter(f=>f.isFile()).map(f=>path.relative(fileURLToPath(root),path.join(f.parentPath,f.name)).replaceAll('\\','/')).sort();
  const entries=files.map(file=>{
    const relative=file.slice(6), id=relative.replace(/\.mjs$|\.json$/,'');
    if (nonTests[relative]) return {id,file,category:nonTests[relative][0],modes:[],reason:nonTests[relative][1],dependencies:'data/consumer',seconds:0,network:false,browser:false};
    if (relative==='retirement-hof-pilot.mjs') return {id,file,category:'fixed-seed/full-career analysis',modes:['audit'],args:['--seeds=hof111-pilot-01,hof111-pilot-04','--strategy=balanced-stay'],seconds:60,browser:true,network:'loopback + Google Fonts CDN',dependencies:'Node + Git + Playwright + browser',reason:'Two P/IF careers plus replay; not the 4,000-career balance acceptance.'};
    const profile=browserProfiles[id];
    if(profile) return {id,file,category:'Playwright E2E / integration / fixed-seed',modes:profile.quick?['quick','full','audit']:['full','audit'],browser:true,network:'loopback + Google Fonts CDN',dependencies:'Node + Git full history + Playwright + browser; UI requests external Google Fonts',...profile};
    if(relative.endsWith('.test.mjs') || ['career-movement-policy.mjs','domestic-tournament-policy.mjs','hall-of-fame-policy.mjs','salary-promotion-policy.mjs','verify-modularization.mjs'].includes(relative)) {
      const source=readFileSync(new URL(file,root),'utf8');
      const category=id.includes('fixed-seed')?'fixed-seed / static':/node:vm|runInNewContext|integration|salary-flow/.test(source+' '+id)?'integration / native fixture / static':/\.\.\/docs.*(?:from|import)/.test(source)?'unit / static':'unit / static (see source assertions)';
      return {id,file,category,modes:['quick','full','audit'],seconds:2,dependencies:'Node + repository files'+(/execFileSync|node:child_process/.test(source)?' + Git history':''),browser:false,network:false};
    }
    throw Error('Unclassified tests file: '+file);
  });
  return entries.map(e=>({...e,historicalRefs:e.file.endsWith('.mjs')?[...new Set([...readFileSync(new URL(e.file,root),'utf8').matchAll(/(?:baseline\w*\s*=\s*|\|\|\s*|git[^\n]*?show[^\n]*?)['"`]([0-9a-f]{7,40})(?::docs)?['"`:]?/gi)].map(m=>m[1]))]:[]}));
}
export const manual = [
  {id:'legacy-career-benchmarks',reason:'Original unflagged historical careers remain individually runnable. Routine full uses focused UI/fixture flags for six overlapping feature suites; contemporary complete-state/RNG careers run in ACT, contract, draft, display and event suites, not repeated in every old feature benchmark.'},
  {id:'hof-4000-careers',reason:'Explicit opt-in research only; requires reaching all league buckets and hours/days of sampling. The current 25-seed pilot is NOT a 4,000-career generator.'},
  {id:'real-devices-and-share-sheet',reason:'Physical iPhone/Android and native share permissions required; Chromium widths cannot substitute.'},
  {id:'cloudflare-preview',reason:'Separate explicit --preview=<URL> E2E invocation and deployment content verification; automatic CI uses loopback, not an unverified mutable URL.'},
];

// Uses the YAML parser already bundled with the approved pinned Playwright.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
const req=createRequire(import.meta.url);
const modulePath=process.argv.find(a=>a.startsWith('--playwright='))?.slice(13)||process.env.PLAYWRIGHT_MODULE||'playwright';
const pwRequire=createRequire(req.resolve(modulePath));
const core=path.dirname(pwRequire.resolve('playwright-core'));
const {yaml}=req(path.join(core,'lib/utilsBundle.js'));
const workflow=yaml.parse(readFileSync(new URL('../.github/workflows/test.yml',import.meta.url),'utf8'),{uniqueKeys:true});
assert.deepEqual(workflow.on.push.branches,['dev']);
const evidenceOnly=['BACKLOG.md','docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md'];
assert.deepEqual(workflow.on.push['paths-ignore'],evidenceOnly);
assert.equal(workflow.on.push.paths,undefined);
assert.deepEqual(workflow.on.pull_request.branches,['main']);
assert.equal(workflow.on.pull_request.paths,undefined);
assert.equal(workflow.on.pull_request['paths-ignore'],undefined,'PR required checks must not be path-filtered');
assert.equal(workflow.on.workflow_dispatch.paths,undefined);
assert.equal(workflow.on.workflow_dispatch['paths-ignore'],undefined);
// Exact-path model of the approved filter, not an emulation of GitHub's diff service.
const shouldRunPush=files=>files.some(file=>!evidenceOnly.includes(file));
assert.equal(shouldRunPush(evidenceOnly),false,'Only evidence updates skip dev CI');
for(const file of ['AGENTS.md','CURRENT_SPEC.md','docs/src/engine/game.js','tests/event-policy.test.mjs','tests/support/stage6-browser.mjs','scripts/test.mjs','.github/workflows/test.yml','docs/archive/README.md','docs/reviews/OTHER_REPORT.md']){
 assert.equal(shouldRunPush([file]),true,file+' must trigger CI');
 assert.equal(shouldRunPush([...evidenceOnly,file]),true,'Mixed changes must trigger CI: '+file);
}
assert.deepEqual(workflow.on.workflow_dispatch.inputs.mode.options,['quick','full','audit']);
assert.equal(workflow.permissions.contents,'read');
assert.equal(workflow.concurrency['cancel-in-progress'],true);
const job=workflow.jobs.tests;
assert.ok(!JSON.stringify(job.env).includes('runner.'),'runner context is unavailable in jobs.<job_id>.env');
assert.ok(job.steps.some(s=>s.run?.includes('PLAYWRIGHT_MODULE=')&&s.run.includes('$GITHUB_ENV')));
assert.equal(job['runs-on'],'ubuntu-24.04');assert.equal(job['timeout-minutes'],120);
assert.ok(job.steps.some(s=>s.with?.['node-version']==='24.15.0'));
assert.ok(job.steps.some(s=>s.with?.['fetch-depth']===0));
assert.ok(job.steps.some(s=>s.run?.includes('playwright@1.62.1')&&s.run.includes('--with-deps chromium')));
assert.ok(job.steps.some(s=>s.run?.includes('scripts/test.mjs')));
assert.ok(job.steps.some(s=>s.if==='always()'&&s.uses?.startsWith('actions/upload-artifact@')));
const plan=job.steps.find(s=>s.id==='full-plan');
assert.equal(plan?.run,'node scripts/ci-full-batches.mjs plan');
assert.equal(plan.if,"env.TEST_MODE == 'full'");
const fullCondition="${{ always() && env.TEST_MODE == 'full' && steps.full-plan.outcome == 'success' }}";
const runs=job.steps.filter(s=>/^node scripts\/ci-full-batches.mjs run /.test(s.run||''));
assert.deepEqual(runs.map(s=>s.run),Array.from({length:8},(_,i)=>'node scripts/ci-full-batches.mjs run '+(i+1)));
const names=[];
for(let i=1;i<=8;i++){
 const run=runs[i-1],at=job.steps.indexOf(run),save=job.steps[at+1];
 assert.equal(run.if,fullCondition);assert.equal(run['continue-on-error'],undefined);
 assert.equal(save.if,fullCondition);assert.ok(save.uses.startsWith('actions/upload-artifact@'));
 assert.equal(save.with.name,'tests-full-${{ github.run_id }}-${{ github.run_attempt }}-batch-'+i);
 assert.equal(save.with['if-no-files-found'],'error');
 for(const pattern of ['*.log','*.json','tmp/yakyujinsei-*/**','tmp/yakyujinsei-*.json','tmp/runner-contract-*/**'])assert.ok(save.with.path.includes('test-results/ci-full/batch-'+i+'/'+pattern));
 assert.ok(save.with.path.includes('test-results/ci-full/plan.json'));names.push(save.with.name);
}
assert.equal(new Set(names).size,8);
const aggregate=job.steps.find(s=>s.run==='node scripts/ci-full-batches.mjs aggregate');
assert.equal(aggregate?.if,fullCondition);assert.equal(aggregate['continue-on-error'],undefined);
assert.ok(job.steps.indexOf(aggregate)>job.steps.indexOf(runs.at(-1))+1);
assert.equal(job.steps.find(s=>s.name==='Run test profile').if,"env.TEST_MODE != 'full'");
assert.ok(!job.steps.some(s=>/git push|rsync|DEPLOY_REPO_TOKEN/.test(s.run||'')));
console.log('PASS workflow YAML parse: dev quick, main PR full, dispatch choices, pinned tools, full history, read-only permissions, artifacts, no deployment');
console.log('PASS exact dev evidence allowlist and mixed-change checks; PR and dispatch remain unfiltered (GitHub event execution verified separately)');
console.log('PASS sequential Full 8 batches: immediate unique attempt-scoped uploads, continued failure diagnostics, strict final aggregation; quick/audit unchanged');

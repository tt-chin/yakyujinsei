# 統一測試 Runner／GitHub Actions 驗收

日期：2026-10-11。範圍：TEST-RUNNER-01／TEST-CI-01；只改測試工具、測試相容性和文件，不修改遊戲或正式發布設定。

## 1. 基準

- 分支：`dev`。開始時工作區乾淨。
- 開始時 HEAD／origin/dev／origin/main：`e886e84ca08c6c185406cac9d6f3c4376277061a`。
- VERSION：`1.11.4`（`docs/src/config.js`），本次不升版、不修改 CHANGELOG。
- Runner／測試相容性提交：`77507fe31aaebcd4524c440d06765bbd13f61f9a`。
- CI 啟動修正提交：`5e1d581d0fdda36c7574044e60e0a9c2aebbd69b`。
- 本機：Windows、Node 24.15.0、Playwright 1.62.1、Chrome 155.0.8059.39。
- Linux CI：Ubuntu 24.04、Node 24.15.0、Playwright 1.62.1、Chromium 151.0.7922.34（首次 quick 實際版本）。
- 本機測試在首個工具提交前執行，summary 記錄當時 Git HEAD 和來源 fingerprint，不冒稱提交後全量重跑。後續 Linux CI 驗證已提交程式。
- 固定 seed 正面比較基準：將 origin/main 解析為上述完整 SHA；旧 Bug 的負面基準独立保留，不统一替换为 HEAD。

已讀取 AGENTS、CURRENT_SPEC、BACKLOG、CHANGELOG、兩份指定前階段報告、現有入口與 publish-site.yml。遵循 create-rule 技能更新 AGENTS 的測試規則；本專案明示以 AGENTS 為永久正本，不新增另一套 .cursor 規則。

## 2. 實作與可重現性

- 新增 scripts/test.mjs、test-manifest.mjs、check-syntax.mjs、check-workflow.mjs、TESTING.md。
- list 動態盤點 tests；未分類的新檔案直接報錯。每個入口註記類別、依賴、命令、模式、概算、瀏覽器、網路與歷史 Git 參照。
- quick 包含全部40個非瀏覽器入口、語法、ACT 入團/listener fixture、draft-income quick、KBO quick：44入口。
- full 是55入口：擴大 quick 的同一入口，不再次執行 quick 副本；追加完整 E2E、收入／合約／事件、投手／野手生涯、狀態／選擇／RNG 比較。
- audit 是56自動入口，加10項明示 SKIP。新增兩條投手／野手研究及精確重播，不默默執行4,000生涯。
- 可獨立指定 --only；每入口保存 stdout/stderr 日誌、exit、秒數，整體 FAIL／BLOCKED 非零；逾時殺掉本次子程序，不修改遊戲狀態。
- 依賴預檢實際 launch 瀏覽器。缺 Playwright／Chromium 為 BLOCKED，不是 PASS。
- sourceFingerprint、基準SHA、Node、平台、瀏覽器、完整命令、日誌SHA 全相同才允許明示 --reuse；只重用 PASS/exit0，另外記錄 executed/reused。CI 不使用 reuse。
- CI 暫存安裝經使用者批准，不增加遊戲 npm 依賴、不使用個人PC路徑。固定工具及 Actions 完整SHA。
- test-results 被忽略；CI 保存14天日誌、summary、指定 E2E JSON／截圖及 Runner 負面證據，不上傳瀏覽器 profile。
- .github/workflows/publish-site.yml 保持不變，test.yml 只有 contents:read，無部署步驟。

工具環境依 [Playwright CI 指南](https://playwright.dev/docs/ci)／[瀏覽器文件](https://playwright.dev/docs/browsers)。GitHub 工作流程依 [官方語法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)，實际执行是驗收依據，不只依 YAML parse。

## 3. 指令與本機結果

使用外部 Playwright 路徑引數（此處以 <module> 表示，不嵌入個人路径）：

```sh
node scripts/test.mjs list
node scripts/test.mjs quick --playwright=<module> --output=test-results/quick-final
node scripts/test.mjs full --playwright=<module> --output=test-results/full-final
node scripts/test.mjs audit --playwright=<module> --reuse=test-results/full-final/summary.json --output=test-results/audit-final
node scripts/test.mjs quick --only=syntax,test-runner.test --playwright=<module> --output=test-results/ci-preflight
node scripts/check-workflow.mjs --playwright=<module>
```

統計為「入口數」，不是唯一斷言總數／100%分支涵蓋：

- list：61個 tests 檔案、加語法共56自動入口。分類完整，exit0。
- quick-final：44 PASS、0 FAIL、0 SKIP、0 BLOCKED；153.605秒；44實際執行、0重用；exit0。
- full-final：55 PASS、0 FAIL、0 SKIP、0 BLOCKED；1475.033秒；55實際執行、0重用；exit0。
- audit-final：56 PASS、0 FAIL、10 SKIP、0 BLOCKED；14.449秒；55重用上述 full 的已核對日誌、1新實際執行（pilot12.57秒）；exit0。**不是56入口再次執行。**
- CI控制工具新增／metadata微調後 ci-preflight：2 PASS，8.771秒；語法＋Runner自測。Windows full 未因這些控制工具變更再跑一次；Linux full 另列實际结果。
- 交付前 quick-delivery（已完成CI修正、加入本報告／BACKLOG更新後）：44 PASS／0 FAIL／0 SKIP／0 BLOCKED，148.849秒，44實跑、0重用、exit0；`test-results/quick-delivery/summary.json`。YAML checker再次PASS，`git diff --check`無錯誤。
- YAML checker：解析與結構断言 PASS，不等於 GitHub context 表達式已合法；首次CI实际发现并补强了这项缺口。
- Runner selftest：人為 exit17 得1 FAIL且整體非零；缺Playwright得1 BLOCKED、0 PASS且非零；同來源已通過入口可核對重用。這些負面結果是自測所需證據，不隱藏成一般PASS。
- 瀏覽器負面實測：`--only=event-fix-e2e --browser=missing-browser` 得0 PASS／1 BLOCKED、exit1，1.057秒；證據 `test-results/missing-browser-proof/summary.json`。預檢未能啟動瀏覽器時不會假PASS。
- 本機 E2E 檢查范围内 Console／JS-CSS404 為0；PC、320px、390px 及 display 的其他尺寸均由既有各入口驗證。手機尺寸模擬不冒充實機。

### 初次 full 失敗及調查（保留，不改預期遮蔽）

初次 full-initial：50 PASS／5 FAIL，2095.560秒；legacy-diagnostics：0 PASS／3 FAIL，226.484秒。原因：

1. display-preferences：舊測試期待設定鈕最右；現行核准分享鈕已占最右。320px 的設定 r254、分享 r306，舊期待差52px。修正為檢查 restart/settings/share 均44px、在header內、不重疊、最右分享正常。全六條設定生涯與24設定×6尺寸後續 PASS（334.405秒），沒有改遊戲。
2. global-contract-market：舊 fixture 使用 KBO 階層卻保留 NPB team，且候選 NPB 回歸時既有合約尚未支付/滿期。第一次輸入 year2032、年俸900萬、remaining1、annualSchedule paid=false／paidTotal0、RNG725010679、calls31。CURRENT_SPEC §14.1 要求一般海外回歸完成原契約。fixture 正確設定組織球隊，透過原生 markSalaryPaid 結清、同步累計與 lastSalaryPaidYear，再產生候選；結清新增 RNG0。保留原金额断言。中途測試 hook 把 listByOrg 放在錯誤作用域而再FAIL一次，已移回引擎hook；不是遊戲bug。
3. npb-return／trait-system：舊全量S比較在初始 step0 已因後續核准 championshipResults 欄位（缺值對 {}）失敗，還未進入功能操作。
4. salary-history：舊全量S比較在初始 step0 因核准特性 oldghost 欄位（缺值對 false）失敗。trait 初始兩側RNG calls均19，不是新RNG差異。

原歷史生涯斷言**沒有改掉**；新增只讀 first-difference 診斷。以上3條不適用的舊全量oracle仍可用 --legacy-careers --only=... 實跑並保持FAIL，不列為現行回歸PASS。常規 full 使用其完整原生/UI fixture，同時由專門生涯入口對最新正式基準逐步比較完整S／收入／選擇／RNG。六個 feature suite 的 --ui-only/--quick 選項原已存在，本次在 manifest 明示用途，不以「舊版本有新欄位」要求遊戲回退。

## 4. 固定 Seed／完整生涯

draft full 的六條生涯與 e886e84... 比較完整S、選擇及 RNG 一致（策略各入口明示，不混同 balanced 路線）：

- yakyo-test-001／P：542操作、652 calls、RNG1707538286，2058退休，收入173930000円。
- jp3-pitcher-02／P：534操作、879 calls、RNG-1998445019，2058退休，收入107530000円。
- jp3-pitcher-03／P：534操作、899 calls、RNG289910492，2058退休，收入145800000円。
- jp3-catcher-01／C：387操作、422 calls、RNG-1504784666，2046退休，收入75990000円。
- jp3-infielder-01／IF：543操作、549 calls、RNG-1298627341，2058退休，收入105350000円。
- jp3-outfielder-01／OF：565操作、533 calls、RNG991797058，2058退休，收入105150000円。

生涯記錄包含初始快照，因此記錄數比操作數多1。KBO 的 IF balanced 是另一策略，完整自然續約到2050退休、calls677；不能拿以上不同策略結果互相替代。ACT full含16條明示歷史seed/策略路線及入團fixture；contract full381案例；event full552功能檢查及6精確重播。相關入口全部實跑。

audit pilot：

- hof111-pilot-01／P／balanced-stay：374操作、749 calls；state SHA256 0fccb824496052b4cf215754295981cb4cbf664fef5d0758cdc4b61160e2689c；action SHA256 1d4903fc862e9385fb41fad6b9874e046914f6adf14df466fd523067ff500c22。
- hof111-pilot-04／IF／balanced-stay：359操作、645 calls；state SHA256 ad1f240b23fc8f6395c8bffb5e6a10a91803444dc08b689eed82ff8d3864aa5e；action SHA256 dcbc64c8a4ef4b51007b169dcb35aa6be4f60dc3e6b6e6e01e97529e10390b03。

兩條自然生涯+重播，不是4,000样本，不保证实际到达四联盟。

## 5. GitHub Actions 實際驗收

- dev push：quick；main向PR：full；dispatch：quick/full/audit可選。timeout60分鐘，按事件/ref取消同類舊run，不交叉取消push與PR。Node24.15.0、Playwright1.62.1，CI install --with-deps chromium。
- 首次 [38131362429](https://github.com/tt-chin/yakyujinsei/actions/runs/38131362429)：**FAIL，0 jobs／0測試**。GitHub 診斷 (Line26,Col26) Unrecognized named-value runner，因 jobs.tests.env 不允許 runner context。不是遊戲測試FAIL。
- 5e1d581 修正：安裝步驟用 RUNNER_TEMP，透過 GITHUB_ENV 傳遞 PLAYWRIGHT_MODULE；checker新增禁止job.env runnercontext的斷言。
- 修正後 [Linux quick 38132643250](https://github.com/tt-chin/yakyujinsei/actions/runs/38132643250)：**PASS**；44 PASS／0 FAIL／0 SKIP／0 BLOCKED、113.533秒、44實跑0重用；安裝/YAML/測試/artifact全部成功。
- [Draft PR #1](https://github.com/tt-chin/yakyujinsei/pull/1) 經使用者同意建立，只測試、不合併；驗證後已關閉，state=CLOSED、isDraft=true、mergedAt=null。
- [Linux full 38132662335](https://github.com/tt-chin/yakyujinsei/actions/runs/38132662335)：**PASS**；55 PASS／0 FAIL／0 SKIP／0 BLOCKED，993.295秒；55實跑、0重用。PR head為5e1d581...，GitHub測試用merge ref checkout HEAD為 `c584efe182741129f10c284d8d086c90c4820f92`，並非合併至main。
- [Linux 手動audit 38132971169](https://github.com/tt-chin/yakyujinsei/actions/runs/38132971169)：**PASS**；56 PASS／0 FAIL／10 SKIP／0 BLOCKED，1250.042秒；56實跑、0重用；checkout為dev `5e1d581d0fdda36c7574044e60e0a9c2aebbd69b`。
- 上述Linux full／audit都是 Node24.15.0／Playwright1.62.1／Chromium151.0.7922.34；比較基準為 `e886e84ca08c6c185406cac9d6f3c4376277061a`，各命令、日誌SHA與完整歷史基準均已下載核對。兩者 install／YAML／test／artifact步驟成功。
- manual audit 實際觸發成功；本次重跑 full 的理由是驗證 workflow_dispatch profile 在 Linux 的完整執行，不採用Windows證據快取。
- 首次 quick 下載證據：test-results/ci-linux-quick/tests-push-38132643250/ci/summary.json。可由run頁Artifacts取得同份log與summary。
- full／audit證據：`test-results/ci-linux-full/tests-pull_request-38132662335/ci/summary.json`、`test-results/ci-linux-audit/tests-workflow_dispatch-38132971169/ci/summary.json`。CI artifact包含完整入口logs、E2E JSON／截圖及自測負面證據，保留14天；full壓縮約126.9MB，完整逐步生涯資料是主要體積，後續可另設不刪關鍵證據的保留策略。


### Linux full／audit 每入口實際耗時

以下同名入口在不同模式各跑一次，是驗證PR與dispatch兩種觸發／執行環境，不是單一profile內重複。

- `syntax`：full PASS 1.969s；audit PASS 2.571s。
- `ability-allocation.test`：full PASS 0.028s；audit PASS 0.037s。
- `arbitration-policy.test`：full PASS 0.025s；audit PASS 0.032s。
- `bug-act-01-02-e2e`：full PASS 315.654s；audit PASS 385.841s。
- `career-movement-policy`：full PASS 0.033s；audit PASS 0.046s。
- `championship-intl-e2e`：full PASS 4.41s；audit PASS 4.872s。
- `championship-intl.test`：full PASS 0.111s；audit PASS 0.135s。
- `choice-action.test`：full PASS 0.029s；audit PASS 0.036s。
- `contract-policy.test`：full PASS 0.026s；audit PASS 0.037s。
- `contract-salary-e2e`：full PASS 45.158s；audit PASS 52.423s。
- `control-period-policy.test`：full PASS 0.027s；audit PASS 0.035s。
- `display-preferences-e2e`：full PASS 88.502s；audit PASS 108.743s。
- `display-preferences.test`：full PASS 0.032s；audit PASS 0.039s。
- `domestic-tournament-policy`：full PASS 0.028s；audit PASS 0.038s。
- `draft-bonus-display.test`：full PASS 0.043s；audit PASS 0.054s。
- `draft-income-e2e`：full PASS 241.378s；audit PASS 317.748s。
- `draft-signing-policy.test`：full PASS 0.032s；audit PASS 0.04s。
- `event-copy.test`：full PASS 0.128s；audit PASS 0.162s。
- `event-fix-e2e`：full PASS 7.677s；audit PASS 8.552s。
- `event-fix.test`：full PASS 0.202s；audit PASS 0.256s。
- `event-integration.test`：full PASS 0.043s；audit PASS 0.055s。
- `event-policy.test`：full PASS 0.072s；audit PASS 0.089s。
- `event-system-e2e`：full PASS 197.77s；audit PASS 257.299s。
- `fa-market-policy.test`：full PASS 0.033s；audit PASS 0.043s。
- `fixed-seed-v160.test`：full PASS 0.03s；audit PASS 0.038s。
- `global-contract-market-e2e`：full PASS 10.263s；audit PASS 11.102s。
- `global-contract-market.test`：full PASS 0.035s；audit PASS 0.047s。
- `hall-of-fame-policy`：full PASS 0.024s；audit PASS 0.033s。
- `hof-first-ballot-e2e`：full PASS 16.339s；audit PASS 21.975s。
- `hof-first-ballot-league.test`：full PASS 0.14s；audit PASS 0.167s。
- `incentive-policy.test`：full PASS 0.026s；audit PASS 0.032s。
- `information-architecture.test`：full PASS 0.029s；audit PASS 0.034s。
- `injury-market-policy.test`：full PASS 0.028s；audit PASS 0.033s。
- `japanese-copy-contract-ui.test`：full PASS 0.034s；audit PASS 0.037s。
- `kbo-renewal-e2e`：full PASS 13.699s；audit PASS 15.073s。
- `kbo-renewal-floor.test`：full PASS 0.044s；audit PASS 0.055s。
- `npb-return-e2e`：full PASS 23.319s；audit PASS 24.044s。
- `npb-return-ui.test`：full PASS 0.061s；audit PASS 0.075s。
- `record-condition-fix.test`：full PASS 0.03s；audit PASS 0.035s。
- `replay-share-theme-e2e`：full PASS 15.887s；audit PASS 18.183s。
- `replay-share-theme.test`：full PASS 0.029s；audit PASS 0.034s。
- `retirement-hof-balance.test`：full PASS 0.694s；audit PASS 0.83s。
- `retirement-hof-pilot`：full 不在full；audit PASS 7.489s。
- `salary-detail-ui.test`：full PASS 0.041s；audit PASS 0.048s。
- `salary-evaluation-policy.test`：full PASS 0.027s；audit PASS 0.035s。
- `salary-explanation-policy.test`：full PASS 0.026s；audit PASS 0.032s。
- `salary-flow.test`：full PASS 0.029s；audit PASS 0.039s。
- `salary-history-e2e`：full PASS 3.402s；audit PASS 3.616s。
- `salary-promotion-policy`：full PASS 0.031s；audit PASS 0.036s。
- `salary-promotion-policy.test`：full PASS 0.032s；audit PASS 0.033s。
- `team-demand-policy.test`：full PASS 0.027s；audit PASS 0.031s。
- `test-runner.test`：full PASS 0.255s；audit PASS 0.334s。
- `trait-policy.test`：full PASS 0.059s；audit PASS 0.074s。
- `trait-system-e2e`：full PASS 4.564s；audit PASS 4.973s。
- `ui-foundation.test`：full PASS 0.029s；audit PASS 0.036s。
- `verify-modularization`：full PASS 0.033s；audit PASS 0.039s。
- `fixed-seed-regression`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `fixtures/draft-income-routes`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `retirement-hof-analysis`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `retirement-hof-report`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `retirement-hof-test-support`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `support/first-difference`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `legacy-career-benchmarks`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `hof-4000-careers`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `real-devices-and-share-sheet`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。
- `cloudflare-preview`：full 不在full；audit SKIP（人工／非入口，原因見盤點及第7節）。

## 6. 最新盤點（61檔案）

35個 .test.mjs（原34+Runner自測）、5 standalone、14 Playwright E2E、1生涯研究pilot、1分析、1報告生成器、2 support、2 JSON fixture。不是舊報告54檔；舊報告是歷史快照，不改寫為今日數量。

以下概算單位秒；實際耗時是 Windows full-final，不作Linux速度保證。語法另有 scripts/check-syntax.mjs，預估8秒、本機full 8.751秒。瀏覽器入口由Runner追加外部 --playwright 與 --browser；loopback遊戲不需要Preview，但既有UI仍會請求Google Fonts CDN。

- `tests/ability-allocation.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.11s。
  指令：`node tests/ability-allocation.test.mjs`。

- `tests/arbitration-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.105s。
  指令：`node tests/arbitration-policy.test.mjs`。

- `tests/bug-act-01-02-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：quick/full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：500s；本機 full：PASS 469.153s。
  指令：`node tests/bug-act-01-02-e2e.mjs`；quick 加 `--fixtures-only`。

- `tests/career-movement-policy.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.131s。
  指令：`node tests/career-movement-policy.mjs`。

- `tests/championship-intl-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：30s；本機 full：PASS 7.98s。
  指令：`node tests/championship-intl-e2e.mjs --ui-only`。
  历史参照：`004cd26`，实际完整SHA保存在summary。

- `tests/championship-intl.test.mjs` — integration / native fixture / static。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.774s。
  指令：`node tests/championship-intl.test.mjs`。
  历史参照：`004cd26`，实际完整SHA保存在summary。

- `tests/choice-action.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.11s。
  指令：`node tests/choice-action.test.mjs`。

- `tests/contract-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.097s。
  指令：`node tests/contract-policy.test.mjs`。

- `tests/contract-salary-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：90s；本機 full：PASS 79.149s。
  指令：`node tests/contract-salary-e2e.mjs`；Runner 传入解析后的 `--compare=<完整SHA>`。
  历史参照：`37121fbfd967d5dc88f1642ede638fc237805a5d`，实际完整SHA保存在summary。

- `tests/control-period-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.101s。
  指令：`node tests/control-period-policy.test.mjs`。

- `tests/display-preferences-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：260s；本機 full：PASS 129.919s。
  指令：`node tests/display-preferences-e2e.mjs --only-seed=yakyo-test-001,jp3-infielder-01`；Runner 传入解析后的 `--baseline=<完整SHA>`。
  历史参照：`8dd244b`，实际完整SHA保存在summary。

- `tests/display-preferences.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.093s。
  指令：`node tests/display-preferences.test.mjs`。

- `tests/domestic-tournament-policy.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.088s。
  指令：`node tests/domestic-tournament-policy.mjs`。

- `tests/draft-bonus-display.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.11s。
  指令：`node tests/draft-bonus-display.test.mjs`。

- `tests/draft-income-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：quick/full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：350s；本機 full：PASS 326.062s。
  指令：`node tests/draft-income-e2e.mjs`；quick 加 `--quick`；Runner 传入解析后的 `--baseline=<完整SHA>`。
  历史参照：`35c40a26aef244908725d2d083f6a622640da0cb`，实际完整SHA保存在summary。

- `tests/draft-signing-policy.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.111s。
  指令：`node tests/draft-signing-policy.test.mjs`。

- `tests/event-copy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.509s。
  指令：`node tests/event-copy.test.mjs`。
  历史参照：`a7fe2e8`、`73d5a58`，实际完整SHA保存在summary。

- `tests/event-fix-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：15s；本機 full：PASS 11.73s。
  指令：`node tests/event-fix-e2e.mjs`。

- `tests/event-fix.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.504s。
  指令：`node tests/event-fix.test.mjs`。
  历史参照：`2375d46`，实际完整SHA保存在summary。

- `tests/event-integration.test.mjs` — integration / native fixture / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.124s。
  指令：`node tests/event-integration.test.mjs`。

- `tests/event-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.285s。
  指令：`node tests/event-policy.test.mjs`。
  历史参照：`73d5a58`，实际完整SHA保存在summary。

- `tests/event-system-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：150s；本機 full：PASS 278.872s。
  指令：`node tests/event-system-e2e.mjs`。
  历史参照：`93ad2c7`，实际完整SHA保存在summary。

- `tests/fa-market-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.198s。
  指令：`node tests/fa-market-policy.test.mjs`。

- `tests/fixed-seed-regression.json` — fixture。模式：不自動執行；依賴：data/consumer；瀏覽器：不需要；網路：不需要；概算：0s。
  不执行原因：Historical fixture, not currently imported; preserve for external consumers.

- `tests/fixed-seed-v160.test.mjs` — fixed-seed / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.155s。
  指令：`node tests/fixed-seed-v160.test.mjs`。

- `tests/fixtures/draft-income-routes.json` — fixture。模式：不自動執行；依賴：data/consumer；瀏覽器：不需要；網路：不需要；概算：0s。
  不执行原因：Recorded positive and negative route choices, consumed by draft-income E2E.

- `tests/global-contract-market-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：30s；本機 full：PASS 25.08s。
  指令：`node tests/global-contract-market-e2e.mjs --quick`。
  历史参照：`053e7b4`，实际完整SHA保存在summary。

- `tests/global-contract-market.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.121s。
  指令：`node tests/global-contract-market.test.mjs`。

- `tests/hall-of-fame-policy.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.089s。
  指令：`node tests/hall-of-fame-policy.mjs`。

- `tests/hof-first-ballot-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：50s；本機 full：PASS 23.795s。
  指令：`node tests/hof-first-ballot-e2e.mjs`。
  历史参照：`925987dc1bb93304eddd8eb71ab2876eef9dac8c`，实际完整SHA保存在summary。

- `tests/hof-first-ballot-league.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.412s。
  指令：`node tests/hof-first-ballot-league.test.mjs`。
  历史参照：`925987dc1bb93304eddd8eb71ab2876eef9dac8c`，实际完整SHA保存在summary。

- `tests/incentive-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.12s。
  指令：`node tests/incentive-policy.test.mjs`。

- `tests/information-architecture.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.112s。
  指令：`node tests/information-architecture.test.mjs`。

- `tests/injury-market-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.114s。
  指令：`node tests/injury-market-policy.test.mjs`。

- `tests/japanese-copy-contract-ui.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.136s。
  指令：`node tests/japanese-copy-contract-ui.test.mjs`。

- `tests/kbo-renewal-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：quick/full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：40s；本機 full：PASS 25.791s。
  指令：`node tests/kbo-renewal-e2e.mjs`；quick 加 `--quick`。
  历史参照：`f3efb0ad80984422b5a42d9f86c04127f9404952`，实际完整SHA保存在summary。

- `tests/kbo-renewal-floor.test.mjs` — integration / native fixture / static。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.152s。
  指令：`node tests/kbo-renewal-floor.test.mjs`。

- `tests/npb-return-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：60s；本機 full：PASS 29.403s。
  指令：`node tests/npb-return-e2e.mjs --quick`。
  历史参照：`73d5a58`，实际完整SHA保存在summary。

- `tests/npb-return-ui.test.mjs` — integration / native fixture / static。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.304s。
  指令：`node tests/npb-return-ui.test.mjs`。
  历史参照：`73d5a58`，实际完整SHA保存在summary。

- `tests/record-condition-fix.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.074s。
  指令：`node tests/record-condition-fix.test.mjs`。

- `tests/replay-share-theme-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：30s；本機 full：PASS 35.675s。
  指令：`node tests/replay-share-theme-e2e.mjs --ui-only`。
  历史参照：`dc5ac871`，实际完整SHA保存在summary。

- `tests/replay-share-theme.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.078s。
  指令：`node tests/replay-share-theme.test.mjs`。

- `tests/retirement-hof-analysis.mjs` — analysis。模式：不自動執行；依賴：data/consumer；瀏覽器：不需要；網路：不需要；概算：0s。
  不执行原因：Requires approved captured pilot/vote input; rewrites historical report data. Run explicitly outside automatic profiles.

- `tests/retirement-hof-balance.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.665s。
  指令：`node tests/retirement-hof-balance.test.mjs`。

- `tests/retirement-hof-pilot.mjs` — fixed-seed/full-career analysis。模式：audit；依賴：Node + Git + Playwright + browser；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：60s。
  指令：`node tests/retirement-hof-pilot.mjs --seeds=hof111-pilot-01,hof111-pilot-04 --strategy=balanced-stay`。

- `tests/retirement-hof-report.mjs` — report。模式：不自動執行；依賴：data/consumer；瀏覽器：不需要；網路：不需要；概算：0s。
  不执行原因：Rewrites historical approved report; not an automatic regression.

- `tests/retirement-hof-test-support.mjs` — support。模式：不自動執行；依賴：data/consumer；瀏覽器：不需要；網路：不需要；概算：0s。
  不执行原因：Imported VM fixtures; not an executable test.

- `tests/salary-detail-ui.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.093s。
  指令：`node tests/salary-detail-ui.test.mjs`。

- `tests/salary-evaluation-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.07s。
  指令：`node tests/salary-evaluation-policy.test.mjs`。

- `tests/salary-explanation-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.066s。
  指令：`node tests/salary-explanation-policy.test.mjs`。

- `tests/salary-flow.test.mjs` — integration / native fixture / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.076s。
  指令：`node tests/salary-flow.test.mjs`。

- `tests/salary-history-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：20s；本機 full：PASS 5.151s。
  指令：`node tests/salary-history-e2e.mjs --ui-only`。
  历史参照：`ad5b778`，实际完整SHA保存在summary。

- `tests/salary-promotion-policy.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.076s。
  指令：`node tests/salary-promotion-policy.mjs`。

- `tests/salary-promotion-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.078s。
  指令：`node tests/salary-promotion-policy.test.mjs`。

- `tests/support/first-difference.mjs` — support。模式：不自動執行；依賴：data/consumer；瀏覽器：不需要；網路：不需要；概算：0s。
  不执行原因：Read-only first-difference diagnostic, imported by historical E2E controls.

- `tests/team-demand-policy.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.085s。
  指令：`node tests/team-demand-policy.test.mjs`。

- `tests/test-runner.test.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 1.416s。
  指令：`node tests/test-runner.test.mjs`。

- `tests/trait-policy.test.mjs` — integration / native fixture / static。模式：quick/full/audit；依賴：Node + repository files + Git history；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.219s。
  指令：`node tests/trait-policy.test.mjs`。
  历史参照：`9fcb24a`、`f6b5c9b`，实际完整SHA保存在summary。

- `tests/trait-system-e2e.mjs` — Playwright E2E / integration / fixed-seed。模式：full/audit；依賴：Node + Git full history + Playwright + browser; UI requests external Google Fonts；瀏覽器：需要；網路：loopback + Google Fonts CDN；概算：30s；本機 full：PASS 7.184s。
  指令：`node tests/trait-system-e2e.mjs --ui-only`。
  历史参照：`2375d46`，实际完整SHA保存在summary。

- `tests/ui-foundation.test.mjs` — unit / static。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.086s。
  指令：`node tests/ui-foundation.test.mjs`。

- `tests/verify-modularization.mjs` — unit / static (see source assertions)。模式：quick/full/audit；依賴：Node + repository files；瀏覽器：不需要；網路：不需要；概算：2s；本機 full：PASS 0.094s。
  指令：`node tests/verify-modularization.mjs`。

## 7. 未執行／限制與後續建議

audit 的10 SKIP：6非執行檔（兩support、兩JSON、analysis、report）＋4人工項目（原歷史生涯、4,000樣本、實機/OS share sheet、獨立Preview E2E）。support／fixture由consumer實際使用，不能當獨立測試PASS；report／analysis會覆寫歷史證據，未批准故不自動執行。

- 不宣稱所有seed、遊戲分支或所有裝置已通過；沒有新功能的100%coverage數字。
- 此輪不重新做正式網站E2E，Preview只核對部署/資產，不把既有版本的遊戲結果當新CI證據。
- 實機與原生分享需要裝置/權限；320/390px只是模擬。
- 4000生涯與自然KBO/MLB首輪殿堂分布仍需有效採樣策略及專項批准。
- 舊全量歷史oracle3項維持可重現FAIL；後續可另設核准版本的golden管理，但不刪歷史負面證據、不靜默更新預期。
- 能力Undo/reset仍有AUD-03B未涵蓋的combo/late/cap等互動。本次通過能力原生/靜態測試與既有生涯，不宣稱新增了完整專用browser矩陣。
- GitHub Ruleset／Branch Protection 未設定；workflow失败会红，但禁止合并的强制策略需另授权。
- 建議後續：補專用能力互動E2E、精確golden適用版本索引、四聯盟有效自然生涯採樣；不在此輪重構引擎。

## 8. 安全範圍與交付狀態

遊戲程式、VERSION、CHANGELOG、CURRENT_SPEC、正式發布workflow及main均未修改。dev工具提交與本報告／BACKLOG提交分開；最終SHA由Git提交及交付回覆提供，避免報告自引用自身SHA。CI驗證完成後已關閉測試Draft PR，未合併；`git ls-remote origin refs/heads/main`仍為開始時e886e84...。

Cloudflare Preview：5e1d581 的 Cloudflare Pages check success，deployment d740db62-9ee9-410c-8e18-900891ccfe63；47/47 tracked HTML／JS／CSS 的HTTP200內容與HEAD Git blob完全一致，0差異／404。固定入口 https://dev.yakyujinsei.pages.dev。報告／BACKLOG提交後另確認最新dev push quick與Preview部署，結果由交付回覆提供。


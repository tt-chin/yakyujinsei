# 1.13.0 Linux CI Full 分批與證據保存：本地驗收

日期：2026-10-16。授權：CI_ONLY / IMPLEMENTATION；不提交、不推送、不觸發 Actions。風險 R2：CI 排程／結果彙整變更，沒有產品接線。基準：dev `29ae26b477c8a5488ab4c56360e6bd15e44de80c`，VERSION 1.13.0。

## 1. 終止原因再次確認

再次唯讀取得 [Full Run 38750999932](https://github.com/tt-chin/yakyujinsei/actions/runs/38750999932)、job 116477061578 與 check-run annotations，結果與[原調查](LINUX_CI_FULL_1130_FAILURE_ANALYSIS.md)相同：18 PASS、1 中斷、61 未開始；14:33:23Z exit 143 與 runner shutdown，upload 及 post steps SKIPPED。

- **CONFIRMED**：外層測試 step 被終止，runner 明示收到 shutdown signal。Exit 143 與 SIGTERM 慣例一致。
- **排除配置中的 job timeout 作為本次原因**：實際 job 約9分37秒，配置120分鐘。當時 contract-salary 只約122秒，未達 Runner 原360秒單入口 timeout；該 timer 使用 SIGKILL。
- **UNVERIFIED**：Workflow cancellation 的發起者、runner系統回收、服務停止、OOM／磁碟／其他資源限制與SIGTERM發送來源。公開API僅failure而非cancelled；沒有主機／控制面診斷。不宣稱已修復GitHub平台的底層shutdown原因。
- 原本上傳 step 已有 always；本次不以重複加入always作為解法。

## 2. 本次檔案及修改前後差異

1. `.github/workflows/test.yml`：原本Full一個長step＋最後一次upload，改為plan→8組run/upload→嚴格aggregate→原最後upload。Quick／Audit仍使用原命令；觸發條件、concurrency、job名稱tests、ubuntu、Node、Playwright、120分鐘timeout、原upload glob均保留。
2. `scripts/ci-full-batches.mjs`：新增CI外層工具；使用既有Runner的full／only，不修改Runner。plan固定受驗HEAD、Run ID、attempt、已解析origin/main；各批記錄命令、開始／結束、exit／signal及OS／Node／記憶體／磁碟的開始時快照。拒絕覆寫已有plan或batch receipt。
3. `scripts/ci-full-batches.test.mjs`：獨立CI工具測試，直接Node執行。不是新增的遊戲Full入口，不改80入口及manifest。含合成故障與一個明示原生Runner案例。
4. `scripts/check-workflow.mjs`：保留舊檢查並增加8批唯一順序、每批後立即upload、Run/attempt命名、失敗後續行及aggregate不可continue-on-error等檢查。
5. `scripts/TESTING.md`：新增操作及限制說明。
6. 本報告。原失敗分析報告及所有歷史證據不改寫。

未修改 `scripts/test.mjs`、`scripts/test-manifest.mjs`、`tests/`、產品JS／HTML／CSS、VERSION、CHANGELOG、CURRENT_SPEC、BACKLOG、AGENTS或正式發布workflow。

### Workflow精確結構差異

原 `Run test profile` 新增 `if: env.TEST_MODE != 'full'`。Full新增 `node scripts/ci-full-batches.mjs plan`，接著 `run 1`～`run 8`，每個run後緊接獨立upload；最後 `aggregate`。

各run／upload／aggregate使用相同條件：`${{ always() && env.TEST_MODE == 'full' && steps.full-plan.outcome == 'success' }}`。不使用continue-on-error；正常批次FAIL不阻止後面批次收集資訊，但既有失敗step仍令job失敗。plan失敗不會被視為可執行或PASS。

各批artifact：`tests-full-${{ github.run_id }}-${{ github.run_attempt }}-batch-N`，14天，找不到任何檔案為error，compression-level=1。內容為plan、該批所有頂層log／JSON與原tmp allowlist的對應批次路徑。最後artifact名稱亦加入attempt避免重跑名稱衝突；原glob不刪除，另收集plan及分批log／JSON。沒有接入bounded collector，沒有把全部大型tmp自動上傳。

## 3. 不漏測、不重複、不降低強度

從現行inventory即時取得Full集合，包含syntax共80入口；依原順序連續切成8批，每批10入口：

- 1：syntax～award-legacy-consumer.test。
- 2：award-rng-policy.test～control-period-policy.test。
- 3：display-preferences-e2e～event-integration.test。
- 4：event-policy.test～hof-first-ballot-e2e。
- 5：hof-first-ballot-league.test～npb-return-e2e。
- 6：npb-return-ui.test～salary-evaluation-receipt.test。
- 7：salary-explanation-policy.test～stage10-risk-e2e。
- 8：stage6-ability-e2e～verify-modularization。

每批仍為 `node scripts/test.mjs full --only=<原入口集合> --baseline=<固定SHA> --output=<獨立批次目錄>`；Full flags由原Runner及manifest決定。沒有改用quick旗標、reuse、legacy-careers或降低timeout／斷言；原遊戲測試的次序保持。只隔離輸出與重新建立每批Runner程序；不是修改產品S或RNG。

aggregate校驗：plan集合／順序及唯一性、Run/attempt、受驗HEAD、baseline、sourceFingerprint、Node／platform／version及已記錄的browser一致性、receipt完成狀態、exit／signal、逐入口狀態、計數、未重用以及原log SHA256。只有全部80入口實際PASS才能得到Full PASS。缺summary／receipt、資料不一致／損壞、SKIP、BLOCKED、FAIL、逾時或中斷都不能通過；未驗證批次另計unverified，不補造PASS。

本地故障測試的80份結果為SYNTHETIC_FIXTURE，不是一次新的Full PASS。原生Runner限定案例只執行choice-action.test，不冒充完整Full。

## 4. 驗證紀錄

- `node scripts/ci-full-batches.test.mjs`：30 PASS／0 FAIL／0 SKIP；最後一輪Node test duration 7.182秒，內含原生Runner choice-action.test 1 PASS，該Runner報告1.021秒。測試包含漏測／重複、缺檔／損壞、錯SHA／Run／attempt、來源／瀏覽器差異、錯誤計數、PASS帶非零exit、timeout、重用結果、SIGTERM、RUNNING receipt、FAIL／SKIP／BLOCKED不可當PASS，以及先前批次證據保持不變。
- `node scripts/check-workflow.mjs --playwright=<既有外部Playwright>`：exit0；YAML、原觸發條件及8批／upload／aggregate靜態檢查PASS。
- 新工具 `node --check` 與 `git diff --check`：PASS；既有平行檔案的CRLF提示不是新差異。
- 首次Quick：`node scripts/test.mjs quick --playwright=<既有外部Playwright> --browser=chrome --output=test-results/linux-ci-batches-quick-20261016`；exit1，58 PASS／3 FAIL／0 SKIP／0 BLOCKED，51.376秒。三個FAIL為ACT、draft-income、KBO的localhost瀏覽器導航 `net::ERR_NETWORK_ACCESS_DENIED`；保留summary及log，未修改斷言，亦未把Runner實際FAIL改記PASS。
- 因明確沙箱網路阻擋，經批准以同一Quick命令在沙箱外重測，使用獨立 `test-results/linux-ci-batches-quick-unsandboxed-20261016`：exit0，**61 PASS／0 FAIL／0 SKIP／0 BLOCKED，272.924秒**。ACT 93.55秒、draft-income 79.10秒、KBO 66.83秒，均通過；首次失敗未覆寫。測試環境Windows／Node24.15.0／外部Playwright1.62.1／Chrome155.0.8059.40。
- Quick期間僅再補CI工具的隔離 `--output` 參數與移除Workflow未使用step ID，沒有修改Quick入口或受測產品／fixture。最終CI工具重新完成30案與Workflow檢查；Quick不被當成這8批遠端Workflow的執行證據。當次summary記錄自己的sourceFingerprint，不改寫為最終來源雜湊。
- Linux新Workflow、遠端artifact實際上傳／下載還原、完整Full：**NOT_RUN**。本任務禁止觸發Actions；無法將本地YAML／fixture驗證稱為Linux CI PASS。

## 5. 風險與保存界線

- 已完成且已上傳的批次不再依賴最後一步；例如原故障若於第2批再現，第1批已有獨立上傳機會。但不能承諾尚未上傳的當前批次在runner硬關閉後仍可恢復。
- 單一tests job、原120分鐘與整體80入口仍保留；沒有提高平行度或新增瀏覽器併行，避免放大記憶體壓力。8個新Runner程序與8次upload帶來額外時間，完整Linux耗時 **UNMEASURED**。按入口數切批不等於各批耗時相等。
- 每批開始的資源快照僅供診斷，不是原Run的OOM證據，也不是峰值監測。
- Artifact upload失敗仍會使Workflow失敗；即使測試aggregate本身PASS，不能將artifact上傳失敗稱為整體CI PASS。
- **ARTIFACT_COVERAGE_BLOCKED仍有效**：本次改善批次summary／log持久化時機，保留原始tmp保存邊界。未解決所有Full大型原始JSON、敏感路徑與完整可重播證據契約；沒有以index/hash代替原始證據。
- 新分批artifact需在真實CI逐批確認成功並下載核對；純靜態檢查無法驗證GitHub服務、儲存配額或實際shutdown行為。

## 6. 重新執行建議與授權

建議審查本地diff後，另行批准提交及推送，再以新受驗SHA執行一次Full。不要在此舊SHA重跑卻宣稱驗證了尚未提交的分批機制。新Run須核對80入口完整結果、8批artifact、最終aggregate及來源／Run/attempt；下載各批證據另驗，不將測試PASS與完整保存混為一談。

若再出現runner shutdown，保留已上傳批次及資源快照、記錄當前批次／image／時間，再請GitHub診斷控制面／主機事件；不因未知原因盲目降低Full、修改遊戲或放寬斷言。

本次未stage／commit／push／merge／部署／觸發Actions；工作樹原有D2設計、G1-A fixtures、G1-B／B2報告及development-b內容保留。未變更main或版本。

## 7. 本批CI來源SHA256

以下為本地來源位元組雜湊（不是尚不存在的新commit SHA）：

- `.github/workflows/test.yml`：`9a6f7c432ce731202672df6eb9b4b297e16ad79e3a781adc0de73f76fc00e951`
- `scripts/ci-full-batches.mjs`：`ed7acdd6f1ac3afe905fb3bd88dbacf739812aa48ef1168cfc2b3e96aaf52242`
- `scripts/ci-full-batches.test.mjs`：`fa2fae903a43be0f5672c3e30e26fe340e81166f220d03e7959941dafa64914e`
- `scripts/check-workflow.mjs`：`b811c4e050baf7b8055a777717d03761363778c5b0757d6c7c0a823be3365831`
- `scripts/TESTING.md`：`bf02334866a328cda07035d735b91a114f6f7759b18425e20b4e33352a9d062e`

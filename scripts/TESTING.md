# 統一測試入口

## CI Full 分批保存

CI 的 Full 透過 `scripts/ci-full-batches.mjs` 依原 inventory 順序拆成8批（目前82入口，每批10～11個），呼叫原 `scripts/test.mjs full --only=...`；不更改 Runner、測試旗標、timeout、斷言或歷史基準。Quick／Audit 保持原命令。`plan` 固定當次 HEAD、Run ID／attempt及已解析的 origin/main；`run 1`～`run 8` 分別輸出到 `test-results/ci-full/batch-N/`，每批後由獨立 upload-artifact step 保存；`aggregate` 嚴格驗證完整集合、來源與環境、exit/status、log SHA256，任一缺失、FAIL／SKIP／BLOCKED或重用結果都不能得到Full PASS。

本地工具驗證：`node scripts/ci-full-batches.test.mjs`（合成故障案例＋一個明示原生Runner案例；不是完整Full）。Workflow檢查仍使用 `node scripts/check-workflow.mjs --playwright=<外部模組>`。新工具測試是CI工具的獨立驗證，不新增到遊戲82入口。

每批artifact名稱含Run ID、attempt及批次號，保存14天；保留既有tmp證據allowlist，不將全部大型／可能含敏感資料的tmp自動上傳。既有 `D2-CI-ARTIFACT-01 / ARTIFACT_COVERAGE_BLOCKED` 仍有效；summary／log保存不等於完整原始S/RNG可重播封存。Runner突然關閉時，只有之前已完成上傳的批次可期待保留，正在執行的批次及後續批次仍可能遺失；`always()`不能保證失去runner後仍能執行。正常測試失敗後後續批次仍會執行，原失敗step不會被最終彙整或上傳掩蓋。

## C級高校工作樹驗證

school-policy.test為Quick/Full單元與原生初始化fixture：舊50校、60唯一ID、25/45/20/10邊界、C限定HS−4、不可變出生快照及三態資格。smallschool-c-e2e為Full/Audit：三尺寸、C／各gate明示fixture、升學／移籍、退休列表PNG及P/IF原始跨版完整trace＋同版重播。`--fixtures-only=true`只跑fixture；`--cases=<前綴>`局部重跑，不當完整入口PASS。

support/approved-school-oracle僅給歷史正向控制套用已批准高校／COPY差異，不能稱原始舊版重播／存檔遷移，也不能用於舊Bug負面基準。smallschool-c-e2e的原始舊game仍未改造。KBO負面digest只排除新增birthHighSchool metadata，其舊故障來源、金額／契約／RNG斷言保持。Master整檔不變舊斷言改為確認只append指定10校、其餘資料完整相等。

## 全力投球callback修正

`full-power-pitching.test`為Quick／Full／Audit原生函式53案（含四聯盟及MiLB適用階層）；`full-power-pitching-e2e`為Full／Audit的真實三強度callback、SP／MR／CL及1280／320／390px、TJ後續操作與完整生涯。基準20920dddd72ab8c91b0e2c71d560492663cd5aec，或明示`--baseline=<SHA>`；套用上節明示的C／COPY正向控制差分後，逐一比較proSeason／tjAccrue／tjCap／phasePre，只允許核准的一行投球callback差異，不再要求整個game.js與加入C前逐字相等。完整S／R斷言保留。可直接`--fixtures-only`做Preview矩陣，不冒充完整生涯。

契約、draft-income、display、trait-display、international-personal-stats、KBO正向控制及殿堂的歷史一致生涯，修正前後都以真實UI明確選「通常投球」；只改測試操作策略，不改遊戲source／S／舊baseline，不新增狀態排除，完整S、選擇與RNG斷言保持。KBO原2049負面案例為IF，操作策略不受這個投手選項影響。原始全力路線的失敗证据保留；新專項另驗證全力的首個effort差異、首次補正前的完整R前綴、成績／TJ與新版重播。全力路線後續條件抽選可依已批准的連鎖差異改变，不稱完整舊生涯R次數不變。研究100條原始資料不覆寫。

## 国際大会の本大会成績表示

`international-personal-stats.test`はQuick／Full／Auditの整形・差分・値コピー・旧結果単体（T01〜T13）。`international-personal-stats-e2e`はFull／Auditで、正式processIntlPhase、WBC／プレミア12、二重操作、T14全テーマ・大字・1280／320／360／390px、投手3／野手3の固定seed生涯を検証する。単独実行は`node scripts/test.mjs full --only=international-personal-stats-e2e`。`--fixtures-only`は明示的な専用入口直接実行に限り、生涯比較の代用ではない。

比較基準は表示修正直前devの完全SHA `e602174a22d7472e1021d780388ad61adc6b11b6`、または明示`--baseline=<完全SHA>`。各操作の完全S digest、選択文、最終S及び全R値／前後状態を比較し、versionとintlTraitResults内の追加personalStatsだけを除外する。大会結果全体や通算／所得を除外しない。元の完全Sも保存する。人工formatter入力／制御fixtureと自然生涯の出場を区別し、後者でWBCとプレミア12の到達を必須にする。

## 生涯RNG（`Rng`）

`rng.test`為Quick／Full／Audit：以`650e4dd21718b4abec3876fc9ef6148714c21d4f`舊`seedInit`／`R`產生的golden值，驗證`docs/src/engine/rng.js`的種子、步進、hash為0時的退回值、每次重讀`S`，以及`game.js`的`seedInit`／`R`委派與`_s`同步。不是完整生涯比較；E2E的RNG計數經`tests/support/rng-instrument.mjs`：現行原始碼以`careerRng.onDraw`計數，沒有`careerRng`的舊基準原始碼仍以`R`定義文字替換，兩者皆不符時丟`RNG_INSTRUMENT_MISS`；`rng-instrument.test`（Quick／Full／Audit）驗證這三種情況。vm harness仍抽取`seedInit`／`R`單行（見`tasks/GAME_JS_OOP_REFACTOR_PLAN.md` §2.2、§2b）。

`node scripts/test.mjs list` 列出所有 tests 檔案、分類、依賴、概算秒數、旗標與模式。新增未分類檔案會報錯，不會悄悄略過。

```sh
node scripts/test.mjs quick
node scripts/test.mjs full
node scripts/test.mjs audit
node scripts/test.mjs full --only=contract-salary-e2e
```

quick 執行全部快速原生／單元入口、JS 語法、KBO quick、ACT 入團／listener fixtures、draft-income quick。full 不重複 quick 入口，而是擴大相同入口的測試範圍，並執行其餘瀏覽器、投手／野手生涯和 RNG 比較。audit 包含 full，加兩條 P／IF 自然生涯研究及重播；人工項目明列 SKIP。

六個既有功能 E2E 以 `--ui-only`／`--quick` 執行完整的原生功能 fixture／UI／候選 RNG 矩陣；不在每項重新跑相同的舊版生涯比較。完整生涯由 ACT、contract、draft、display、event 的專門入口覆蓋，保留各自不同的契約／收入／UI重繪／事件斷言。需要重查原歷史生涯時可明確使用 `--legacy-careers --only=<id>`；不刪除或改寫舊斷言。

display 的常規 full 執行全部設定／尺寸／DOM 保持矩陣，加 P／IF 各一條每17操作切換設定的完整生涯。其餘4條不重複，原六條完整設定生涯仍可用 `--legacy-careers --only=display-preferences-e2e` 執行。

## 依賴與可再現基準

Node.js 24.15.0、Git 完整歷史；瀏覽器入口另需已安裝的 Playwright 1.62.1 及 Chrome 或 Chromium。不會自動安裝套件。

以 `PLAYWRIGHT_MODULE` 指定外部模組，`TEST_BROWSER=chromium` 選擇 Chromium；亦可用 `--playwright=<模組位置>`、`--browser=chrome|chromium`。預設維持現有測試的 Chrome，不加入個人路徑。已授權 CI 在 `$RUNNER_TEMP` 安裝固定版 Playwright 與 Chromium 系統依賴，不是遊戲依賴。

現行一致性比較預設 `--baseline=origin/main`，在開始時解析為完整 SHA 並保存。離線 clone 可明確指定 `--baseline=<已取得的 commit>`。不得將未取得基準或未安裝瀏覽器視為 PASS。Git checkout 必須保留歷史；GitHub Actions 使用 fetch-depth 0。

歷史基準不是一律過時：KBO 的 f3efb0a 和首輪殿堂的 925987d 是舊 Bug 證據；文案、NPB 回歸、事件等入口也有歷史控制組。list 列出原引用，summary 記錄解析 SHA。不要將這些負面基準換成 HEAD，也不要為測試變綠改遊戲／斷言。

## 輸出與結果

預設寫入忽略的 `test-results/<時間>-<模式>/`。每個入口一個 `.log`，`summary.json` 保存指令、exit code、秒數、環境、HEAD、基準、來源 fingerprint。原 E2E 的 JSON／截圖在同目錄 tmp 中，方便 CI 上傳。

PASS 僅表示入口实际執行 exit 0；FAIL 包含非零 exit／逾時；BLOCKED 表示必要依賴不足；SKIP 是明示非自動項目。FAIL／BLOCKED 令整體 exit 非零；一次失敗仍繼續其餘預定入口。統計是入口數，不是假稱所有唯一斷言／遊戲分支數。

`--output=<路徑>` 指定輸出；`--only=<id,...>` 可獨立執行列出的入口（不受模式預設篩選限制）。`--self-test-failure` 在既定測試後新增 exit 17 的故意失敗；只供 Runner 驗收，不能當一般成功測試。

明示 `--reuse=<summary.json>` 可於 audit 重用同次 full 已實際 PASS 的入口，避免重跑：必須來源 fingerprint、解析基準 SHA、Node／平台／瀏覽器、完整命令與日誌 SHA-256 全相同。報告保留原日誌、原耗時及 `reusedFrom`，另外列 executed／reused；不冒充重新執行。來源不符直接非零；FAIL／BLOCKED 不重用。CI 不使用快取驗收。

## 明確不自動執行

- retirement-hof-analysis／report 會改寫歷史報告，需確認輸入與寫入目標後才獨立執行。
- support 和 JSON 不是測試入口；fixed-seed-regression.json 是歷史摘要，不能代替實測。
- 4,000 生涯需要另外批准採樣策略、涵蓋各聯盟及估時；目前 pilot 最多 50 個預設組合，不是假稱 4,000 樣本。手動例：`node tests/retirement-hof-pilot.mjs --playwright=<module> --browser=chromium --limit=50 --output=<JSON>`。
- 實機原生 share sheet、iPhone／Android 不由 Chromium 手機尺寸模擬替代。
- CI 的遊戲程式取自 loopback（現有 UI 另請求 Google Fonts CDN）。Preview E2E 另用既有入口 `--preview=<URL>`，且先確認最新配信內容；不可拿可變 URL 的舊版本充當 commit 驗收。外部字型／網路故障不得冒充遊戲斷言通過。

CI 環境依 [Playwright 官方 CI 指南](https://playwright.dev/docs/ci) 安裝 Chromium；測試 workflow 不包含部署或正式 repo 寫入權限。

## CI 證據補記與觸發

dev push 僅在所有變更均為 `BACKLOG.md` 或 `docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md` 時排除 Tests workflow。此精確白名單只供驗收證據、CI Run ID／結果與統計補記；路徑規則不判斷文字內容，若變更驗收準則或其他實質內容，應手動執行對應測試，不得藉此省略必要驗證。新增報告不自動列入白名單。

遊戲、測試、fixture、Runner、workflow、AGENTS.md、CURRENT_SPEC.md 及其他未排除檔案的單獨或混合變更仍觸發 CI。main PR 的 full 與手動 quick／full／audit 不使用路徑排除，避免必要檢查因文件 PR 而永久 Pending。Cloudflare Preview 與正式發布 workflow 不受此設定控制。

最終報告須區分實際測試通過的完整程式 SHA／CI Run URL／模式／結果，以及後續純文件 Commit SHA／變更檔案／未重跑 CI 的事實。不能把前者的 PASS 當成後者已執行測試。Runner fingerprint 仍包含 docs 下的報告；本次不放寬 `--reuse` 的一致性檢查。
## 1.11.6 出生快照與歷史比較

新增的support/baseline-initial-potential.mjs只對正向歷史UI比較，在基準newState返回時補入核准的出生pot合計，不覆寫既有值、不消費RNG、不用退休pot反推。display／draft／contract／HOF的正向舊版比較使用此adapter，仍保留完整S／RNG斷言。KBO原始負面程式不改：首個2049錯誤及所有數值仍驗證；前綴snapshot僅移除新增potSum0與原有version，非balanced正向歷史生涯才用adapter。925987d殿堂與f3efb0a KBO的真正負面控制來源保持。

這不是「修復前完全不變」的證據。另實際執行 `node tests/stage10-risk-e2e.mjs --compare=<完整修復前SHA> --playwright=<module> --output=<directory>`，載入未改造的修復前game.js，比較逐操作S／選擇／RNG；只允許新增potSum0及引退完成後grinder的批准差異。原始／現行完整狀態都保存。57常規案＝原44＋7稱號邊界＋6重畫／殘留；加P／IF原生比較為59案。此較長入口仍Full／Audit，不加入Quick；新增support只有import分類，不是可執行測試。Runner與CI邏輯不變。

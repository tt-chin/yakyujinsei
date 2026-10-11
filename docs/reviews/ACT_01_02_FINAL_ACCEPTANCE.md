# ACT-01／ACT-02 最終驗收與 BACKLOG 整理

## 1. 基準與個別結論

- 驗收日期：2026-10-11（JST）；repository：`tt-chin/yakyujinsei`；branch：`dev`。
- fetch 後最新 `origin/dev`／HEAD：`dee5c07d010a87bc941bb6bce3e78f307a13a066`，VERSION **1.11.4**（`docs/src/config.js`）。起始工作樹乾淨；受驗工作樹另含本次 E2E 補強，交付提交由 Git 歷史及交付訊息列出，避免自引用 SHA。
- `origin/main`：`e886e84ca08c6c185406cac9d6f3c4376277061a`。本次遊戲資產與該基準及 origin/dev 相同；沒有修改遊戲、main、VERSION、CHANGELOG 或正式網站。
- 已閱讀 AGENTS、BACKLOG、CURRENT_SPEC、CHANGELOG、舊 ACT 報告、TEST_INFRA_ACCEPTANCE、現行 ACT E2E、HTML 與 choice／navigation／draft 流程。舊報告的 BLOCKED／IMPLEMENTED_UNVERIFIED 不直接沿用為本次判定。
- **BUG-ACT-01：現行功能驗收 PASS（A）**。指定 Seed 的明確操作策略、投手／野手、三尺寸、快速重複輸入、返回及後續操作、相關回歸通過。依本次明示標準從未完成 BACKLOG 移除。
- **BUG-ACT-01 原始路線精確重現（B）：未完成**。沒有原始完整選擇歷史；`oscuxs1w` 原位置也未知。不能將 A 宣稱為 B，不能宣稱已證明原故障根本原因。本限制永久保留。
- **BUG-ACT-02：PASS（下述48組指名／第一操作／下一年度矩陣）**。DOM、可見／可點擊、listener、單次執行、契約及付款去重均實際通過，符合結案條件。未知歷史路線不宣稱精確重現。
- **本次沒有確認新的遊戲 Bug，沒有實作遊戲修復**。只有專用測試補強及文件整理。

## 2. 環境、觀察方式與命令

Windows／Node **24.15.0**／Playwright **1.62.1**／Chrome **155.0.8059.39**，headless。PC `1280×844`；手機模擬 `320×844`、`390×844`（mobile／touch）。不是 iPhone Safari 或 Android Chrome 實機，不借用其他版本的實機結果作本次證據。

本機暫時 HTTP server 與 Preview route 只在測試回應加入觀察器；不寫入配信檔、不改 RNG 回傳值。觀察原生 `R` 呼叫、PRNG 狀態 `_s`、成功進入 choice action 的次数、`card`、原生 `signTo` 前後、完整 JSON `S`、choice generation／active token／running、`#act.outerHTML`。人工 fixture 與自然生涯分開記錄；fixture 不冒充歷史 Seed 路線。

以下 `<PW_MODULE>` 表示環境提供的 Playwright 模組，非個人路徑常數；GitHub CI 使用其暫存安裝。命令均在 repository root 執行：

```sh
node scripts/test.mjs quick --playwright=<PW_MODULE> --output=test-results/act-final-quick
node scripts/test.mjs full --only=bug-act-01-02-e2e --playwright=<PW_MODULE> --output=test-results/act-final-complete
node tests/bug-act-01-02-e2e.mjs --fixtures-only --preview=https://dev.yakyujinsei.pages.dev --playwright=<PW_MODULE> --browser=chrome
git diff --check
```

quick 與 ACT full 由既有 Runner 保存 command、exit code、秒數、source fingerprint、SHA、browser、逐入口日誌。Preview 參數不在 Runner 的通用介面中，額外直接執行專用入口，stdout 保存為 `test-results/act-final-complete/preview-fixtures.log`，退出碼 **0**。該次 TEMP／TMP 指向同一驗收目錄的 `tmp`，不覆蓋本機證據。

必要的 full 只選 ACT 入口，因為 quick 的 `--fixtures-only` 不會執行16次自然完整生涯；本次沒有重新執行全55入口的跨功能 full，不借用舊全量結果冒稱本次執行。quick 已覆蓋本次要求的 choice-action、draft fixtures、收入、KBO、契約基本回歸。

## 3. 實際結果與日誌

- **quick：44 PASS／0 FAIL／0 SKIP／0 BLOCKED，225.832秒，exit 0**。`test-results/act-final-quick/summary.json` 及44份逐入口 `.log`。包括 `choice-action.test`、`draft-signing-policy.test`、`draft-bonus-display.test`、`draft-income-e2e --quick`、`kbo-renewal-floor.test`、`kbo-renewal-e2e --quick`、固定 Seed 與契約／年俸測試。
- **ACT full 指定入口：1 PASS／0 FAIL／0 SKIP／0 BLOCKED，Runner 543.127秒（入口541.86秒），exit 0**。包含48入團fixture、6實際pointer成績案例、16次完整生涯；生涯共375次成績操作、12次自然入團。`test-results/act-final-complete/summary.json`、`bug-act-01-02-e2e.log`。
- **Preview 專用入口：PASS，exit 0**；內部54組＝48入團＋6pointer，測試內部103.939秒（不含browser啟動／收尾）。三尺寸均通過；47個 tracked HTML／JS／CSS 逐檔 fetch 比對一致（只正規化 CRLF）。受驗部署對應 `dee5c07d010a87bc941bb6bce3e78f307a13a066`，Cloudflare check success、deployment `8c577c22-a859-4ea2-9d0c-e79776402ab4`。此為交付 push 前最新遊戲部署，之後只有測試／文件提交，不改遊戲內容。
- 本機／Preview **Console error、pageerror、JS／CSS HTTP錯誤均0**。三尺寸無水平溢出；檢視 PC／320／390 的 HS／IF／育成截圖，下一年度選項可見，320px文字正常換行。
- Windows Chrome 收尾出現 `BROWSER_CLEANUP_WARNING: disconnected; profile cleanup timeout`：browser已斷線，原測試等待profile清理15秒超時。不是遊戲console例外或assertion失敗；入口均exit 0。保留警告、不隱藏。

原始資料（不提交大體積 runtime artifacts，可由版控腳本重建）：

- 本機：`test-results/act-final-complete/tmp/yakyujinsei-act-audit/local/`。
- Preview：相同前綴的 `preview/`。
- 每組入團 `draft-<FROM>-<POS>-<WIDTH>-<true|false>.json`／PNG，包含 before／after、第一操作前後、完整次年推進選擇歷史與最終狀態。
- 實際成績操作 `pointer-result-<SEED>-<POS>-<WIDTH>.json`／PNG，包含從開始至成績按鈕的每次 label／DOM種類／index、狀態、結果及下一操作。
- 自然生涯 `<SEED>-<POS>-<balanced>-<WIDTH>.json`／PNG，完整逐次 label、before／after S／DOM／RNG呼叫、新增結果卡與最終退休狀態；同Seed重跑由程式深比較，不只比較退休年份。
- `summary.json` 保存各案例摘要。Fixture、pointer、完整生涯是不同層級，不把375次成績操作當成375個獨立測試入口。

### 補強過程中的失敗（測試前提，不掩蓋）

1. `test-results/act-final-fixtures/`：FAIL 1，Runner18.269秒。原補強誤斷言整個 IF 入團callback RNG為0，实际67≠62。原生簽約後 `advance → phasePre` 接著振訓練骰子，正常消耗5次；P先停在投球計畫，所以當時P為0。改成分別量測原生 `signTo` RNG0與後續開季訓練，保留合法消耗，不改遊戲。
2. `test-results/act-final-fixtures-v2/`：FAIL 1，Runner22.013秒。CORP／IF／育成的 `act-signing-CORP-dev` 自然落選，沒有draftRights，不能當正面入團案例。依原生score門檻選出明列的穩定Seed `act-signing-CORP-dev-1`；不強制指名、不改能力公式／RNG／契約政策。其他路線使用原明列Seed。
3. `test-results/act-final-fixtures-v3/`：PASS 1，95.996秒；當時48入團＋6pointer通過，但尚未加入下一年度及三尺寸完整狀態比較。最終 quick／full／Preview均重跑更完整版本；不拿v3代替最終證據。

上述兩次前提失敗保留原日誌；最終交付測試無FAIL／BLOCKED。若將開發過程也計入，共保留2次FAIL入口，不能寫成「從未失敗」。

## 4. ACT-01 操作策略及判定

檢查現行 `choose`、`runWithResultView`、`runChoiceAction`、choice generation／activeToken、listener與navigation。原生行動由世代／running鎖限制；新選項的DOM保留，舊callback不能再次作用於新世代。

實際 Playwright pointer：每個1280／320／390寬度各跑 `k55l221a/P`、`oscuxs1w/IF`，共6組。後者是**本次明確採用 IF，不推定原始位置**。從 seed-only URL 開始，選位置、開始，按下述first-row策略逐步實際點擊，直至第一次「今季の成績を見る」。

完整策略（與既有生涯 suite 相同）：

1. 優先第一個可配分 `.abrow`；略過無效／capped行。
2. 沒有能力行時，優先「配分を確定／配分完了／次へ／完了」，再優先NPBドラフト／プロ志望／オファー受諾／契約／指名受諾／入團；否則按DOM首個有效按鈕。排除Undo與reset。
3. balanced僅對能力行重新排序：優先 `vel/ctl/brk/con/pow/eye/spd`，同級選目前值較低；其他按鈕規則相同。不改事件候選順序。
4. 成績按鈕一次實際點擊後，確認 action計數只＋1、結果卡增加、`S.log`只＋1、下一選項存在。立即對保留的舊按鈕／callback再發送多次操作，整份S／history／PRNG狀態／calls／DOM／generation保持不變。
5. 點「キャリア→選手→ホーム」返回，完整快照不變；再實際點下一選項，確認正常推進、不是空白選項。

自然生涯採用同策略，原Seed在PC各跑first-row及balanced：`k55l221a/P`；`oscuxs1w/P,C,IF,OF`。補充 `yakyo-test-001/P`、`jp3-infielder-01/IF` 各重跑2次；`k55l221a/P/first-row`另跑320／390。全部16次到正常退休；所有375次成績與12次入團額外測失效callback不重複執行。

代表固定结果：

- `k55l221a/P`：first-row 83操作／RNG138／2030退休（PC／320／390同結果）；balanced367／784／2049。
- `oscuxs1w/P`：first-row343／730／2047；balanced505／845／2058。
- `oscuxs1w/C`：first-row511／505／2058；balanced352／627／2050。
- `oscuxs1w/IF,OF`：各first-row547／506／2058；各balanced383／681／2050。
- `yakyo-test-001/P`：各542／652／2058；`jp3-infielder-01/IF`：各543／549／2058。

這些都是可重跑且保存歷史的現行路線；**不是原始故障路線的精確重現，也不是對歷史根因的證明**。

## 5. ACT-02 入團矩陣及第一操作

矩陣 **P／IF × HS／U／CORP／IND × CONTROL／DEVELOPMENT × 1280／320／390＝48組**，本機及Preview均實跑。fixture只建構可控的選秀前狀態，呼叫原生 `enterDraftPath → runDraft → signTo → advance`：年度2032；HS18歲／stageYr3，其餘22歲／stageYr4；seasonFactor1；正式能力60，育成HS31、其餘39。原生score、球團抽選與合約／付款執行不被替換。

Seed清單：

- 正式：`act-signing-HS`、`act-signing-U`、`act-signing-CORP`、`act-signing-IND`，P／IF共用。
- 育成：`act-signing-HS-dev`、`act-signing-U-dev`、`act-signing-IND-dev`，P／IF共用；CORP／P `act-signing-CORP-dev`，CORP／IF `act-signing-CORP-dev-1`。

每組完整操作／專用斷言：

1. 原生生成預期正式／育成指名，受諾按鈕可見；Playwright實際點「指名を受けて入団」。stage為PRO、契約類型正確、contractSequence只＋1、action只＋1、入團結果卡增加、2032→2033。
2. 保留的受諾callback再執行2次，完整S／DOM／RNG快照不變，契約及收入不重複。
3. player／career／home導航後，原節點仍connected、onclick仍同一函式、完整遊戲快照不變。
4. **入團後第一個選項**具有效listener、可見／enabled，實際Playwright點擊。P為「全力投球」，IF為「トレーニング成果を割り振る」。action只＋1、下一DOM非空、contractSequence及careerSigningBonus／careerDevelopmentStipend／careerBaseSalary／careerEarnings不重複增加。
5. 舊第一選項再click／呼叫其callback，完整快照不變。沒有用全生涯能退休取代第一選項斷言。
6. 再按明列first-row策略完成首個職業球季，`S.log`增加、**所有48組推進至2034年**，下一選项存在。每一步label／year／RNG保存於continuation.history。
7. 以PC為同Seed／同fixture對照，320／390完整before、入團after、第一操作前後、DOM、下一年度history／final深比較一致。

原生 `signTo` RNG消耗**0**；P受諾整段0、IF受諾整段5（既有開季訓練）。所有失效callback與純導航消耗0。額外draft-income快速驗收18組PASS涵蓋正式／育成契約金／支度金、收入明細／付款去重與未入團退休不restart；不擅改既定政策。

## 6. 固定 Seed、S／RNG 比較

- 本次自然生涯14份唯一trace（16次執行包含2次重跑），與保留的 `test-results/full-final/tmp/yakyujinsei-act-audit/local/` 實際基準資料逐份深比較：每次label、before／after完整S、RNG呼叫計數、final S／calls完全一致。基準summary的HEAD／baseline為 `e886e84ca08c6c185406cac9d6f3c4376277061a`。不是只比退休年份／最終金額。
- 原始seed重跑P與IF各2次，整份trace／final（包含DOM／PRNG狀態／action）一致；fixture三尺寸亦完全一致。
- 本機／Preview48份完整入團fixture快照及54組check摘要深比較一致。
- 比較命令使用Node `assert.deepEqual` 讀取上述JSON；输出保存 `test-results/act-final-complete/baseline-state-comparison.log`（14份trace＋48fixture＋54摘要PASS）。
- repository遊戲檔未改動。觀察器只修改測試回應，沒有改 `S` schema、RNG演算法、順序、消耗、薪資／契約政策、seed-only URL。正常成績生成及進入訓練的既有消耗不能誤寫為0。

## 7. BACKLOG 修改與剩餘限制

- 新增「最新驗收狀態」，明列受驗最新origin/dev完整SHA／VERSION、結果、下一階段與限制。
- ACT-01／02移出P0未完成、保留ID／2026-10-11／受驗commit／本報告；ACT-01永久保留A與B區別。
- 原段落已結案的ACT-03／SAL-01只轉列可計數完成項，不重判既有狀態。其他已完成項補验收日期／報告索引。
- 正式checkbox重新計數：**10完成＋28未完成＝38唯一ID**；未完成：**BLOCKED3＋IMPLEMENTED_UNVERIFIED7＋DESIGN_PENDING6＋其他原候補／保留／混合標籤12**。這個38是新清單實算，不沿用舊版統計；同ID不跨完成／未完成。
- 「仕様待ち」6項在摘要歸入DESIGN_PENDING；CONTRACT-ASIA-01的原混合「未実装・仕様待ち」保留於其他12，不重複累加。沒有擅自更改其他項的完成狀態。
- AUD-02只修正重複checkbox。v1.11.2原38項分類與54檔數據原樣保留，明示為歷史快照；舊驗收報告不刪、不改其歷史數字。
- 下階段優先能力回歸未驗證部分AUD-03B、正本照合AUD-02及重構風險調查；實機3項仍BLOCKED，殿堂政策另待決策。不將本輪通過當作所有功能已驗證。

剩餘限制：原始故障完整歷史／位置不足；未知路線、所有Seed及其他瀏覽器／實機不在本輪保證範圍；fixture不代表自然到達概率；本輪未重跑全full／audit與4,000生涯分析。沒有需批准的遊戲修復方案；若將來收到原操作歷史，應按新證據重查，不刪除本報告限制。

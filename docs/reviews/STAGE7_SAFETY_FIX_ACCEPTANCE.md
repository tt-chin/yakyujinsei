# 第七階段：能力配分與交易安全修復驗收

## 基準與範圍

- Repository：tt-chin/yakyujinsei；只在 dev 作業，main 與正式網站不變。
- 開始時 origin/dev／HEAD：`0425e74350303086a688de6504a4aa3609543a4d`；main：`e886e84ca08c6c185406cac9d6f3c4376277061a`。工作樹乾淨。
- 開始版本 1.11.4；完成最小修復與相關驗收後按 PATCH 更新 1.11.5。受測程式提交：`13abcf5f8b9f5ba47bcdfc796be6e4e79267bf4e`。後續文件提交不當成此Full程式SHA。
- 原五個失敗是保存 callback／合法原生重入／明示 fault injection 的 CONFIRMED_RISK，不宣稱重現自然 UI 故障。

## 修復前證據

`node scripts/test.mjs full --only=stage6-ability-e2e,stage6-state-transaction-e2e --baseline=0425e74350303086a688de6504a4aa3609543a4d --output=test-results/stage7-before`（Playwright 路徑由環境提供）。

Runner 0 PASS／2 FAIL／0 SKIP／0 BLOCKED，57.647 秒、exit 1。能力 89 案：87 PASS／2 FAIL；交易 5 案：2 PASS／3 FAIL。保存日誌、JSON、操作中間快照及預期注入例外於 `test-results/stage7-before/`。

- 過期行：點數用盡後保存的 onclick 仍加能力 43→44、pool 0→−1。
- 過期確定：保存 callback 將 done 1→2。
- CORP：原生球季後同年度 phaseEnd 重入，企業收入 4,200,000→8,400,000 円。
- 簽約建立前例外：ct=null，但 stage／org／lv 已改成職業所屬。
- 付款後 card 例外再重試：contractId 重建、契約金 50,000,000→100,000,000 円。

## 最小修復與根本原因

### ALLOC-STALE-CALLBACK-01

`docs/src/engine/game.js` 的 allocUI 原 listener 捕捉舊 available，未驗證 DOM／世代／session。加入 S 身分、choiceGeneration、completed、元素 connected 與目前容器檢查；分配時讀取即時 remaining／cap。Undo、reset、確定皆同樣受 guard；確定先標完成再執行原處理。成本、carry、touchedKeys、骰序、combo／late 不變。

### STATE-CORP-REENTRY-01

原 CORP phaseEnd 沒有同 S／年度結算記錄。局部 WeakMap 區分 running、paid、complete：同年度成功重入不再操作；薪資付款後 UI 失敗可重試但不重付；付款前失敗不標 paid／complete；下一年度正常結算。PRO／IND 執行原 settlePhaseEnd，企業薪資與事件收入公式不變。防護資料在 S 外，不增加存檔欄位。

### STATE-SIGN-ATOMICITY-01

signTo 原先改所屬後才 fixedContract；fixedContract 在 createContract 成功前就增加 sequence。改為準備／驗證契約成功後提交 sequence 與所屬。付款、年俸履歷完成後保留短生命週期描畫重試紀錄（S、年度、選項 action 身分、contractId）；同筆重試只描畫，沿用付款與 ID。正常成功立即清除。直接函式呼叫另驗證 request tuple，不誤重用別筆簽約。沒有全面 clone／rollback S，沒有回滾合法 RNG。

保留舊 `nextContractId` helper（本次 fixedContract 改用 tentative sequence 後不再呼叫），未刪 LEGACY 或疑似不可達程式。

## 測試設計與相容性

- 原 Stage6 的 89／5 案預期不變。
- 新 `tests/stage7-safety-e2e.mjs`：17 案。P／IF × pool3／dice[2,4,6] × 1280／320／390，共 12 案；CORP 正常／付款前 fault／付款後 fault 3 案；原生 createContract structuredClone 驗證 fault 1 案；付款後重試與次年支付 1 案。
- 每步保存 S、RNG 值／順序、carry／touchedKeys、分配閉包、DOM／listener。新增案例使用正常鍵盤 Enter／Space、pointer／tap，並呼叫已切離 listener 驗證無效果。
- CORP fixture 使用原生 amateurSeason，及適用 endorsement 的收入事件。初次補充測試誤選 CORP encounter（現行規格轉為 training），因此無收入；只修正 fixture 的分類選取，不改事件規格／金額或遊戲。
- ACT 測試觀察器原錨點 `action:o.f` 不接受新的選項身分 wrapper；改為兼容新／舊錨點、仍調用原 action，所有 DOM／單次操作／S／RNG 斷言不變。
- UI foundation 靜態檢查的確定 callback 形狀需要兼容 session guard；仍要求原 runWithResultView→actClear→allocDone→done 順序及完成標記，不用放寬為只檢查函式存在。

## 已執行結果

- 第一輪專項：能力 89／89、交易 5／5、契約／年俸 381／381 PASS；Runner 3 PASS，127.529 秒、exit 0。`test-results/stage7-first-fix/`。非預期 Console／JS/CSS 404 為 0；明示注入例外分開保留。
- 正常能力配分快照：修復前 87 個正常執行與修復後逐步內容相同，包含完整 S、RNG 值順序及 DOM／listener。原套件兩個 cap80 名稱重複，輸出為 85 個唯一 JSON artifact；不誤稱 89 個唯一案例。
- 中間本機 Full `stage7-full-final`：58 PASS／1 FAIL／0 SKIP／0 BLOCKED，1468.967 秒、exit 1；唯一 FAIL 為舊 UI 靜態形狀。遊戲 E2E、原能力 89、交易 5、契約 381 及新增 17 案全部通過。更新靜態檢查後單獨執行 PASS；最終提交後Full及CI結果見下節，不將中間失敗改寫為PASS。
- 中間 Quick `stage7-quick-final`：44 PASS／1 FAIL，233.756 秒，exit 1。唯一 FAIL 為上述舊確定 callback 靜態形狀；保留失敗日誌。較早被中止的執行不是通過證據。

Preview 支援新增於既有 Stage6 harness：`--preview=<URL>` 先比對所有 tracked HTML／JS／CSS（只正規化 CRLF／LF），每次載入再確認 game.js 一致，之後僅在瀏覽器回應注入 fixture。不是在網站修改遊戲；不以本機替代遠端部署。資產不一致即失敗。

## 正常固定 Seed／狀態比較

契約套件在同操作策略下比較 baseline／current／repeat，每一步完整 S digest（包含契約保障年表、收入與選擇歷史）、RNG state／count。指定投手與野手完成生涯：

- `yakyo-test-001`／P／first-row：542 次操作，652 次 RNG，2058 年退休。
- `jp3-infielder-01`／IF／balanced：404 次操作，677 次 RNG，2050 年退休。

第一輪上述正常路線與基準一致。能力 guard、CORP 重入與 fault retry 只允許批准異常路線的預期差異；不得把修復前風險結果作為正常規格。

## 限制與交付

- 320／390 是 Chromium 手機尺寸模擬，不替代 iPhone／Android 實機。
- fault injection 不證明自然 UI 可達；不宣稱任意付款函式內部例外／任意 caller 的其他副作用都具有全面交易 rollback。
- 不改薪資、契約條件、能力成本、FA、KBO package、殿堂、seed-only URL 或 RNG；不新增保存機制。
- 未執行 4,000 生涯平衡調查，不開始第八階段。
- 最終程式提交與後續純文件提交分開記錄；本報告自身提交SHA由Git履歷與最終回覆提供，避免文件hash自引用。

修正後 Quick：45 PASS／0 FAIL／0 SKIP／0 BLOCKED，211.116 秒、exit 0（`test-results/stage7-quick-corrected/`）。Preview 支援新增後本機專項 89／5／17 全 PASS，Runner 3 PASS、85.636 秒、exit 0（`test-results/stage7-final-support/`）。

版本管理：`docs/src/config.js` 1.11.4→1.11.5，屬既有規格內安全性修復 PATCH；同步更新 `tests/verify-modularization.mjs` 的版本一致性斷言與 CHANGELOG 三項已實作修復。CHANGELOG 不記驗收或發布狀態。main 維持 1.11.4。

## 最終提交後验收（2026-10-12）

所有最終程式測試來源為13abcf5；修復前測試為乾淨的0425e74。中間修復後本機執行時HEAD仍是0425e74、工作樹含修復，不能把其中的HEAD欄位誤認成修復前程式已通過。

### 環境、命令與結果

- Windows、Node24.15.0、Playwright1.62.1、Chrome155.0.8059.39。最終 `node scripts/test.mjs full --baseline=0425e74350303086a688de6504a4aa3609543a4d --output=test-results/stage7-release-full`：**59 PASS／0 FAIL／0 SKIP／0 BLOCKED、1681.002秒、exit0**。外部Playwright由引數指定，不寫入原始碼。
- Linux Ubuntu24.04、同Node／Playwright、Chromium151.0.7922.34。dev push [Quick38150669221](https://github.com/tt-chin/yakyujinsei/actions/runs/38150669221)：`node scripts/test.mjs quick --output=test-results/ci`，**45 PASS／0 FAIL／0 SKIP／0 BLOCKED、111.754秒、exit0**。
- [Draft PR Full38150707598](https://github.com/tt-chin/yakyujinsei/actions/runs/38150707598)：`node scripts/test.mjs full --output=test-results/ci`，**59 PASS／0 FAIL／0 SKIP／0 BLOCKED、1370.330秒、exit0**。checkout合成SHA `b2ae285756b3aedd10d4bb5aa4bca44c17164b4c`，其tree與13abcf5同為`9c6d5b776b9a0d30895971876e0b05fbe67b17f9`，不是main實際合併。
- Linux比較基準為main `e886e84ca08c6c185406cac9d6f3c4376277061a`；與本機0425e74的`docs/src`、index.html、styles沒有差異。兩個SHA各自保留，不拿過時政策作oracle。
- [測試用Draft PR #2](https://github.com/tt-chin/yakyujinsei/pull/2)依使用者批准建立，Linux Full核對後已關閉，**未合併、未刪dev、未部署正式網站**。
- 66個測試相關檔案已由manifest分類：Quick45／Full59／Audit60個自動入口（含syntax）。本輪不重跑Audit研究或4,000生涯；manual項目不是PASS。

日誌與完整JSON：`test-results/stage7-release-full/`、`test-results/stage7-ci-quick/ci/`、`test-results/stage7-ci-full/ci/`。CI artifact保留期14日，已下載到本機；原失敗與中間結果另保留原目錄。少數Windows浏览器退出後的profile cleanup warning與已完成測試分開記錄，不冒充Console錯誤或跳過測試。

### 原89案／5案與補充矩陣

能力89案在本機最終Full、Linux Full及Preview全部PASS：normal12、cost28、all-cap3、carry等價2、combo三session2、late門檻16、手機邊界4、combo未達門檻2、快速pointer6、combo exact75兩案、carry解鎖等價4、late guard6、過期callback2。每案中間S／carry／touchedKeys／RNG／DOM狀態存於JSON；成本與缺key→0的既有結構差異未修改。

交易5案全部PASS：CORP正常UI、原生同年度重入、簽約正常UI、付款前fault、付款後描畫fault。新增17案亦全部PASS。簽約fault沿用原fixture：CORP2032→NPB二軍、單年、2033生效、年俸600萬、契約金5000萬；不改原預期。

原五FAIL→PASS：過期行不加能力／不減點、過期確定done維持1、CORP累計維持420萬而非840萬、付款前fault完整S保持、付款後retry契約金維持5000萬而非1億且ID不變。新增驗證原生createContract驗證失敗不提交連番／所屬；正常次年600萬年俸付款一次。CORP另外驗證付款前／後故障不誤標成功、同年重入收入／log／事件收入不變、下一年度正常付款。

契約381案在Windows最終Full、Linux Full及Preview全部PASS，維持原聯盟／階層×契約期限×正常／全休／復健、降格、FA、跨聯盟、續約、退休與付款矩陣；完整原矩陣見[第三階段報告](CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)。KBO續約、draft-income、ACT、固定seed、事件／分享／殿堂等既有Full入口均PASS。

### Preview

[固定Preview](https://dev.yakyujinsei.pages.dev)部署對應13abcf5；Cloudflare check完成success，deployment ID `e26457c1-4cc8-4644-876c-194a921bf25f`。各遠端套件執行前核對47個HTML／JS／CSS，遊戲版本1.11.5；沒有用舊部署冒充本輪。

實際命令（另帶外部Playwright引數）：

- `node tests/stage7-safety-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --output=test-results/stage7-preview/safety`：17 PASS。
- `node tests/stage6-ability-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --output=test-results/stage7-preview/ability`：89 PASS。
- `node tests/stage6-state-transaction-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --output=test-results/stage7-preview/transactions`：5 PASS。
- `node tests/contract-salary-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --compare=0425e74350303086a688de6504a4aa3609543a4d`：381 PASS、0 FAIL，75.003秒。
- `node tests/bug-act-01-02-e2e.mjs --fixtures-only --preview=https://dev.yakyujinsei.pages.dev`：48入團fixture＋6pointer案例PASS，106.018秒；不宣稱再次精確重現ACT歷史故障路線。

合計546案例，0 FAIL／BLOCKED，1280／320／390均涵蓋，非預期Console Error與JS／CSS404为0。明示注入錯誤保留expectedErrors，不能說注入期間沒有任何錯誤。JSON／快照／截圖保留於`test-results/stage7-preview/`；contract／ACT從暫存目錄複製至其中。實際查看320px offer及簽約後畫面，長球團名／年俸／下一操作沒有橫向溢出。

遠端E2E以已核對的部署回應注入測試觀察器與有效fixture，不是修改網站檔案；fixture驗收與自然生涯逐步比較分開，未宣稱自然UI可達性已證明。

### 修改檔案、結案與剩餘事項

程式：`docs/src/engine/game.js`、`docs/src/config.js`。測試：`tests/stage7-safety-e2e.mjs`、`tests/support/stage6-browser.mjs`、`tests/bug-act-01-02-e2e.mjs`、`tests/ui-foundation.test.mjs`、`tests/verify-modularization.mjs`、`scripts/test-manifest.mjs`。文件：CURRENT_SPEC、CHANGELOG、本報告與BACKLOG。沒有改workflow、薪資政策模組、RNG或資料Master。

三項修復均PASS。AUD-03B與STATE-TRANSACTION-AUDIT-01亦達本次指定驗收門檻，五個ID移至已完成，保留原風險分類／fault限制與歷史報告。依正式checkbox重算：**已完成16、未完成27、總43、重複ID0**；未完成分類為IMPLEMENTED_UNVERIFIED6、BLOCKED3、DESIGN_PENDING6、其他12。

本次沒有待批准的政策變更。任意caller／任意例外的全面rollback、實機原生分享、全規格與動態可達性等仍依BACKLOG保留，不能因本輪通過就稱所有遊戲問題已解決。第七階段到此停止，等待使用者審查，不開始第八階段。

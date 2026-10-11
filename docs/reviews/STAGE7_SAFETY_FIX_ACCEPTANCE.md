# 第七階段：能力配分與交易安全修復驗收

## 基準與範圍

- Repository：tt-chin/yakyujinsei；只在 dev 作業，main 與正式網站不變。
- 開始時 origin/dev／HEAD：`0425e74350303086a688de6504a4aa3609543a4d`；main：`e886e84ca08c6c185406cac9d6f3c4376277061a`。工作樹乾淨。
- 開始版本 1.11.4；修復驗收後按 PATCH 更新 1.11.5。最終程式 SHA、Linux CI 與 Preview 證據待執行完成後補記。
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
- 完整本機 Full `stage7-full-final`：58 PASS／1 FAIL／0 SKIP／0 BLOCKED，1468.967 秒、exit 1；唯一 FAIL 為舊 UI 靜態形狀。遊戲 E2E、原能力 89、交易 5、契約 381 及新增 17 案全部通過。更新靜態檢查後單獨執行 PASS；最終 Quick／Full／Linux CI／Preview 待補記。
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
- 最終程式提交、文件補記提交、CI Run、Preview 驗證及 BACKLOG 數量將分開記錄；未完成證據前不結案。

修正後 Quick：45 PASS／0 FAIL／0 SKIP／0 BLOCKED，211.116 秒、exit 0（`test-results/stage7-quick-corrected/`）。Preview 支援新增後本機專項 89／5／17 全 PASS，Runner 3 PASS、85.636 秒、exit 0（`test-results/stage7-final-support/`）。

版本管理：`docs/src/config.js` 1.11.4→1.11.5，屬既有規格內安全性修復 PATCH；同步更新 `tests/verify-modularization.mjs` 的版本一致性斷言與 CHANGELOG 三項已實作修復。CHANGELOG 不記驗收或發布狀態。main 維持 1.11.4。

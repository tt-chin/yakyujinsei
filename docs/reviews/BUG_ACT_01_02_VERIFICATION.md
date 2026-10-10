# BUG-ACT-01 / BUG-ACT-02 專項驗收

## 基準與結論

- 調查日期：2026-10-11（JST）。Repository：`tt-chin/yakyujinsei`，branch：`dev`。
- 受驗 dev／origin/dev：`cfe3db294b4197b9376a5799d86bec4bb49f510c`，VERSION `1.11.3`。已 fetch 確認；開始時工作目錄乾淨。
- origin/main：`421e036bb206a11828a696a4f8b0d3909385441f`。本次沒有修改 main 或正式網站。
- 已確認 AGENTS、CURRENT_SPEC、BACKLOG、CHANGELOG、前次 BACKLOG_ACCEPTANCE_AUDIT 及現行 HTML／相關程式與測試。舊稽核件數仍是歷史快照。
- **BUG-ACT-01：NOT_REPRODUCED（本次明確策略）；原始操作歷史缺失部分仍 BLOCKED。**
- **BUG-ACT-02：NOT_REPRODUCED；本次明列的入團／下一 DOM／listener 檢查 PASS。** 未取得舊報告的確切 seed、位置、入團路線與選擇歷史，不宣告所有原案例已修復。
- 沒有確認遊戲 Bug，因而沒有修改遊戲程式。VERSION、CURRENT_SPEC、CHANGELOG、BACKLOG 保持不變；不另升級版本、不重複實作歷史修正。
- 新增可重跑的專項驗收入口 `tests/bug-act-01-02-e2e.mjs` 與本報告。這是驗收，不是本次新增遊戲修復。

## 環境與證據方式

Windows、Node `24.15.0`、Playwright 的 Chrome channel `155.0.8059.39`、headless。PC viewport `1280×844`；`320×844`／`390×844` 啟用 mobile／touch 模擬。不是 iPhone Safari／Android Chrome 實機。

本機使用暫時 HTTP server；Preview 使用 `https://dev.yakyujinsei.pages.dev`。Preview 的 47 個 tracked HTML／JS／CSS，逐檔 fetch 比對工作目錄內容（只正規化 CRLF），與受驗 SHA 一致，不只查看畫面上的版本號。

只有測試 server／Playwright route 的回應注入觀察器，配信中的遊戲檔不改動。觀察器計數既有 `R()`、`card()`，讀取完整 JSON 狀態、choice generation／active token／running、`#act.outerHTML`。自然生涯不強制 RNG、事件、成績、契約或能力；人工入團 fixture 單獨標示，不冒充歷史重現。

完整生涯的每一次操作都有 before／after 狀態與 `#act` DOM；最終版另記錄新增卡片內容。實際 pointer 成績測試保存 `#log.innerHTML`。Console error、pageerror、JS／CSS HTTP ≥400 由瀏覽器 listener 收集；成功命令均為 0。完整原始 JSON／PNG 輸出至 `os.tmpdir()/yakyujinsei-act-audit`，最終版區分 `local`／`preview`／`diagnostic` 子目錄。早期完整矩陣的證據在根目錄，後執行的 Preview 同名檔可能取代本機檔；兩次終端結果分別記錄，不把該檔當作兩份獨立原始資料。可由納入版控的腳本重建完整歷史。

## BUG-ACT-01

### 對應程式與既有防護

- `docs/src/engine/game.js:662`：`runWithResultView`，同步執行處理，再處理捲動；不切換／重建 `#act`。
- `game.js:663`：`choose` 清除前選項、遞增 `choiceGeneration`、建立 `activeChoiceToken`，各按鈕以 `onclick` 綁定 `runChoiceAction`。
- `game.js:827`：`phaseMid` 的健康檢查後，生成「今季の成績を見る」，呼叫 `proSeason`／`amateurSeason`。
- `game.js:1227`：`proSeason` 計算成績、寫入 `S.log`／卡片，再經既有降格、移籍、國際出場與下一步流程；現行 `amateurSeason` 在 2876 行起。
- `docs/src/ui/choice-action.js`：running 防重入；舊 token／已分離按鈕被拒絕；只在仍為同 token 時 clear，因此 nested choose 生成的新選項不被外層清掉。當前 DOM 誤判 stale 與例外復原另由既有單元測試涵蓋。
- `docs/src/ui/navigation.js:14`：導航只隱藏／顯示主 panel，重繪 player／career，不複製或重建 `#act`。

沒有僅根據 CHANGELOG 或「原始碼看起來有防護」判 PASS。

### 完整且可重跑的策略

兩策略都從 seed-only URL 開始，按指定位置後「開始」，每次操作只執行一個可用元素；狀態 `done` 時立刻停止，不按重新開始：

1. **first-row**：取第一個未 aria-disabled／非 capped 的 `.abrow`。沒有能力行則找 enabled button，排除 Undo／全重置；優先 `配分を確定|配分完了|次へ|完了`，其次 `NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団`，否則第一個按鈕。
2. **balanced**：上述策略，但能力行先把 vel／ctl／brk／con／pow／eye／spd 排在其他能力之前，同優先群按目前能力值升冪，穩定保留原 DOM 順序。其餘完全相同。

腳本 `select()` 為策略的可執行正本。沒有為了繞過失敗任意換路線。

### 自然生涯結果

下列各案例本機及 Preview 都實際完成到退休。格式為「操作數／成績按鈕次數／接受入團次數／最終 RNG 呼叫數／退休年度」：

- `k55l221a/P` first-row：`83 / 5 / 1 / 138 / 2030`。
- `k55l221a/P` balanced：`367 / 22 / 1 / 784 / 2049`。
- `oscuxs1w/P` first-row：`343 / 21 / 2 / 730 / 2047`；balanced：`505 / 29 / 1 / 845 / 2058`。
- `oscuxs1w/C` first-row：`511 / 29 / 0 / 505 / 2058`；balanced：`352 / 23 / 1 / 627 / 2050`。
- `oscuxs1w/IF` first-row：`547 / 31 / 0 / 506 / 2058`；balanced：`383 / 25 / 1 / 681 / 2050`。
- `oscuxs1w/OF` first-row：`547 / 31 / 0 / 506 / 2058`；balanced：`383 / 25 / 1 / 681 / 2050`。
- `k55l221a/P` first-row 的 320／390px 各一次：與 PC 同為 `83 / 5 / 1 / 138 / 2030`。
- `yakyo-test-001/P` first-row 各環境兩次：`542 / 31 / 1 / 652 / 2058`，完整 before／after S、DOM、操作歷史、RNG 嚴格相等。
- `jp3-infielder-01/IF` first-row 各環境兩次：`543 / 31 / 0 / 549 / 2058`，同樣嚴格相等。

合计各環境 **16 生涯、375 次成績按鈕、12 次接受指名**。某些野手 first-row 沒有入團，不能算入團驗收；它們仍是真實成績按鈕／生涯驗證。操作數只計 click，不把 `done` 終止快照算一次操作，因此比部分舊腳本的紀錄數少 1。

每次成績 click 斷言新增結果卡片、下一個操作 DOM 存在；持續實際執行後續操作至 `done`。自然完整矩陣使用 Playwright page 中的原生 `HTMLElement.click()` 加速且捕捉同步狀態；另在本機／Preview 各三尺寸以 **Playwright locator.click()** 從開局逐步操作，真正做 hit-test／捲動／mobile pointer 點擊第一個成績按鈕，確認卡片、`S.log` 及下一選項。後者不是以 programmatic click 冒充實際 pointer。

### 具體 before／after 證據

`k55l221a/P` first-row：

- 2026 高校結果：generation `8→9`、RNG `26→28`、`S.log.length 0→1`、card 呼叫 `5→6`，下一 DOM 為「能力点を分配（4点）」。
- 2029 職業結果：generation `43→44`、RNG `65→92`、`S.log.length 3→4`、card `23→26`，下一 DOM 仍有投球方案按鈕，隨後可繼續。
- 2030 結果：generation `54→55`、RNG `108→138`、`S.log.length 4→5`、card `31→44`，遊戲正常退休；下一 DOM 是新人生／同 Seed 重玩，不把退休誤判操作消失。

預期與實際都為「結果產生且能繼續，或明確正常退休」。没有 `CHOICE_ACTION_FAILED`、`CURRENT_CHOICE_MARKED_STALE` 或 Console error。

### 限制

`oscuxs1w` 的原位置未知，所以本次覆蓋 P／C／IF／OF，但並未識別原位置。兩個歷史 Seed 都缺原始完整選擇歷史與卡住年度。上述新策略通過只能給 **NOT_REPRODUCED**，不能證明原路線已修復；已詢問使用者是否仍有原資料。沒有據此修改遊戲。

## BUG-ACT-02

### 實際流程

`game.js:2825 enterDraftPath` → active `runDraft`（2828）→ `acceptDraftSelection` → active `signTo`（2807）→ `fixedContract`／`applySigningPayment` → 入團結果卡片 → callback 的 `advance` → 新年度既有選項。

先由原函式生成選項，再以 Playwright 點「指名を受けて入団」，不是直接呼叫 signTo 代替驗收。

### 24 組明示 fixture

P／IF × HS／U／CORP／IND × 1280／320／390px，共 24 組，本機與 Preview 各通過一次。fixture 是測試回應內呼叫 `newState`，設定 2032、各路線 stage／entryRoute、高校 18 歲／其他 22 歲、能力 60，再進入既有 `enterDraftPath(from)`。不強制任何 RNG 回傳值。

測的是四種入團入口的共用簽約與 continuation，**不是所有自然社會人年資門檻或獨立聯盟升階的完整驗收**。自然生涯另外提供高校及社會人入團證據。

每組斷言：

1. 接受前後 stage 變為 PRO，有有效 `S.ct`，contractSequence 只 +1，契約／入團卡片增加。
2. 下一 `#act button`／`.abrow` 存在。DOM 的 generation／active token／文字與狀態存證。
3. 實際 click 前保留原 acceptance callback；入團後再呼叫已分離的舊 callback 兩次，完整 S／RNG／DOM／generation 不變，不重建契約、不重付收入。
4. 實際切換選手→キャリア→ホーム，重新繪製相關 panel；保留的每個 `#act` 子節點仍 connected，onclick identity 相同，完整 S／RNG 不變。
5. 對新選項連續點兩次舊元素；第二次不改變第一次後的快照。第一次確實推進，而非只有可見空按鈕；contractSequence 不再增加。
6. 沒有水平溢出，Console／JS-CSS404 為 0。

自然路線另外確認：`k55l221a/P` first-row 2028 高校育成入團，generation `32→33`、RNG `53→53`、卡片 `16→18`，接續投球方案，之後進入 2029 職業季。balanced 同 Seed 是支配下 CONTROL。`oscuxs1w/P` first-row 在 2028 高校 CONTROL、2033 社會人 DEVELOPMENT 入團；C／IF／OF balanced 在 2028 高校 DEVELOPMENT 入團。都保留下一 DOM，並繼續至退休。

結論：本次測試範圍 **PASS／未重現消失**。原案例未知、實機未驗證，不作全路線或所有平台保證。

## 命令、件數與耗時

`<PW>` 為現有 bundled Playwright module 的路徑；不新增 npm 依賴。所有命令在 dev 執行。件數以下以「入口／生涯／fixture」分開，不把多項 assertion 任意算作測試數。

- 全部 34 個 `tests/*.test.mjs`，加 `verify-modularization`、`salary-promotion-policy`、`hall-of-fame-policy`、`domestic-tournament-policy`、`career-movement-policy` 五入口：**39 PASS、0 FAIL、0 SKIP**，10.258 秒。包含 choice-action、draft-signing、draft-bonus、contract、salary-flow、KBO 最小回歸（10 組）。
- 全 docs／tests JS/MJS `node --check`：**96 PASS、0 FAIL**，11.644 秒；`git diff --check` 通過。
- `node tests/bug-act-01-02-e2e.mjs --playwright=<PW>`：本機 **1 入口 PASS**，24 入團 fixture＋16 自然生涯／375 成績操作，474.012 秒。
- 上述加 `--preview=https://dev.yakyujinsei.pages.dev`：Preview **1 入口 PASS**，同 24＋16／375，47 最新資產一致，474.574 秒。
- 最終版上述加 `--fixtures-only --preview=...`：**1 入口 PASS**，24 入團 fixture（補強 stale acceptance callback）＋3 真正 pointer 成績流程，47 資產一致，47.777 秒。
- 最終版 `--fixtures-only` 的本機重跑：**1 入口 PASS**，33.507 秒；同 24 入團 fixture＋3 pointer 成績流程，不與完整矩陣重複算成新的自然 Seed 樣本。PC／320px 退休截圖另人工目視確認按鈕完整且未水平裁切。
- `node tests/kbo-renewal-e2e.mjs --quick --playwright=<PW>`：**1 PASS**，13.486 秒；同命令加 Preview：**1 PASS**，21.328 秒。均衡 IF 在 2049 年原錯誤消失、2050 正常退休、404 操作／RNG 677，新版兩次完全相同；舊版失敗前 390 操作狀態／選擇／RNG 一致。三尺寸滿了／降格／續約／連點／付款去重通過。
- `node tests/hof-first-ballot-e2e.mjs --playwright=<PW>`：**1 PASS**，腳本未輸出總耗時。本機 1280／320／390 fixture 通過；`925987dc1bb93304eddd8eb71ab2876eef9dac8c` 對照現行 P／IF 完整最終 S（排除版號）、操作及 RNG 嚴格一致：652／549。不是本次 ACT 修復前後比較，因本次沒有修復。
- `node tests/draft-income-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --quick --playwright=<PW>`：**1 入口 FAIL，兩次嘗試都失敗**，各約 5.5 秒。第 39 行 `page.evaluate`：`Execution context was destroyed`。不得把此入口列 PASS。
- 針對既有失敗 Seed 的 `--diagnostic-seed=bonus-ui`：**1 PASS（診斷完成，不是選秀 PASS）**，36.173 秒。first-row P：564 操作、32 成績、**0 入團**、RNG 506、2058 社會人退休。

此次沒有執行其他無關 E2E／大量退休平衡採樣，沒有宣稱全專案所有 E2E 通過。iOS Safari／Android Chrome 實機和原歷史操作仍 **SKIP／BLOCKED**。

## 既有選秀測試 FAIL 的原因與處理

`draft-income-e2e` Preview 固定用 `bonus-ui/P`，只等 `#log` 出現「新人年俸」，沒有在 `S.done`／退休 UI 停止。現行實測該策略全部走社會人，沒有接受指名。到了正常退休後，下一輪仍取第一個按鈕「新しい野球人生を始める」，觸發 `location.href`，下一次 evaluate 的 context 被導頁銷毀。

自然診斷記錄最后依序為 2057 社會人事件→健康檢查→成績→能力配點→確定→「社会人野球を続ける」，之後 `done=true`，没有 NPB 契約。失敗可重現，但這是 **既有測試的路線／終止條件問題**，不是本次已證實的 ACT-02。未修改既有測試、未替換 seed 偽裝原入口 PASS。建議獨立補強它：明確保證可到入團的受驗策略，找不到入團／已退休時有清楚診斷且立即停止；本次新增專項則已有這些條件。

測試開發過程另外有一次定位導航 panel 而非 button 的中止，以及一次用 `#log.children.length` 誤認卡片數的失敗。現行卡片位於年度 `.yr-body`，年度 DOM 又會淘汰，不適用容器數單調增長斷言；改用既有 `card()` 的觀察計數／實際 S.log 驗證，不修改遊戲或放寬真實結果要求。這兩次是 harness 初始化失敗，未算遊戲 Bug，並保留記錄。

部分成功指令最後有 `BROWSER_CLEANUP_WARNING`：Chrome 已 disconnected，但 Windows 暫存 profile 清理超過 15 秒。與 game Console error 分開記錄；尚連線的 close failure 或任何測試 assertion failure 仍回傳非零。上述耗時不包含這 15 秒清理等待。

## 變更、風險與建議

- 僅新增本報告與專項測試，不改遊戲、資料、RNG、URL、版號或現行規格／履歷／BACKLOG。
- 因没有遊戲修復，不存在「修復前 FAIL→修復後 PASS」；已有實作在受驗 dev 通過列明的新測試。
- 本次驗證了舊按鈕拒絕／新按鈕保留／導航不破壞 listener；沒有模擬所有第三方擴充套件、記憶體壓力、瀏覽器 background 恢復或 iOS 歷史白畫面。
- BACKLOG 建議補充本次子範圍證據，但在原路線資料缺失時不把 ACT-01／02 無條件關閉。
- 建議獨立修正 `draft-income-e2e` 的 retirement／missing draft 終止處理，納入 TEST-RUNNER 工作；不得將其現行 FAIL 隱藏成 PASS。
- main／正式網站未變更。報告交付 commit 為本受驗 SHA 的後續測試／文書-only commit，可由 `git log -- docs/reviews/BUG_ACT_01_02_VERIFICATION.md` 查得；受驗遊戲內容仍是上列 cfe3db2。

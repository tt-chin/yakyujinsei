# BACKLOG 全面驗收調查

調查日期：2026-10-10。此文件是驗收證據與建議，不是新遊戲規格，也不表示未驗證項目已完成。

## 1. 基準與範圍

- Repository：`tt-chin/yakyujinsei`；使用分支：`dev`。
- fetch 後受驗 HEAD／origin/dev：`a4aa83c48a48a1567bf3b14ceea6e4c76c87b76b`；VERSION：`1.11.2`，管理位置 `docs/src/config.js`。
- main／origin/main：`421e036bb206a11828a696a4f8b0d3909385441f`，VERSION `1.10.2`。沒有合併、更新 main、push 或部署。
- 採用使用者工作目錄中的 BACKLOG 改訂 5，而不是以 HEAD 的旧 BACKLOG 覆蓋。該檔原本已修改；起始及驗證後 SHA-256 均為 `05277CBB12E2A027B3969CD764ABBBA94A99EFCD0F01BE235588463DB031B16E`。
- BACKLOG 的基準 SHA 925987d／1.11.1、檔案數 52、HOF「未修正」是過時描述；實際基準為上述 1.11.2，tests 有 54 份檔案。本次不修改它。
- 已查閱 AGENTS、CURRENT_SPEC 16 節、CHANGELOG、index、相關實作／測試／歷史 HOF 報告及 JSON。歷史通過紀錄只作參考，判定另依本次實際輸出。
- 僅新增本報告。版本、遊戲、測試、既有文件及使用者變更不動。報告 commit 的父節點為受驗 HEAD；報告 commit 不冒充受驗遊戲 SHA。

環境：Windows、PowerShell、Node `v24.15.0`、Playwright 的 Chromium channel `chrome`（Chrome 155.0.8059.39）；本機唯讀 HTTP server 與 `https://dev.yakyujinsei.pages.dev`。320／390 是桌面 Chrome mobile/touch 模擬，不是 iPhone／Android 實機。

## 2. BACKLOG 全項目對照

PASS 僅代表表列範圍有實際通過證據；不是同類功能全分支保證。BLOCKED 指缺必要資料／實機。調查／候選項目的 NOT_IMPLEMENTED 指要求的新增成果尚不存在，不否認已有基礎功能。

| ID | 結論 | 原始碼／驗證證據與剩餘條件 |
| --- | --- | --- |
| BUG-HOF-FIRST-BALLOT-LEAGUE | PASS | retireScene 只從 firstBallotLeagues 取 legendLeague；31 案例及本機／Preview HOF E2E 通過。自然跨聯盟發生率仍未知。 |
| BUG-KBO-RENEWAL-FLOOR | FAIL | 現行 dev 的 jp3-infielder-01／IF、balanced 策略於 2049 KBO2 再現 KBO_PACKAGE_FLOOR_CAP_CONFLICT；詳第 4 節。 |
| BUG-ACT-01 | BLOCKED | choose／世代 token 實作及單元測試通過；但原報告的完整選擇歷史未提供，oscuxs1w 位置也未指定。本次未對這兩 seed 重播原問題；不能宣告已修復。 |
| BUG-ACT-02 | IMPLEMENTED_UNVERIFIED | Preview 三尺寸實際到達新人入團／收入；兩條完整生涯及 nested/stale/double-action 單元測試通過。原錯誤 seed／入團路線不明，尚缺專門斷言「入團直後的下一操作 DOM/listener」。 |
| BUG-ACT-03 | IMPLEMENTED_UNVERIFIED | 22 個實際 movement／續約／延長／FA／降格等場景通過；全休、滿了、降格的完整笛卡兒組合未在瀏覽器驗證。另 KBO 更新已 FAIL，不能以契約單元通過覆蓋。 |
| BUG-SAL-01 | IMPLEMENTED_UNVERIFIED | 4 海外系統 NPB 復歸的顯示額／契約／currentSalary／決定額／2033 年表通過。KBO2、CPBL2、MiLB 全階層的其他降格／戰力外候選尚未逐項瀏覽器驗收。 |
| TEST-RUNNER-01 | NOT_IMPLEMENTED | 沒有 scripts/test.mjs 或 quick/full/audit/list 統一入口。此次 PowerShell 臨時批次不是已落地 runner。 |
| TEST-CI-01 | NOT_IMPLEMENTED | 唯一 workflow publish-site.yml 是 main 配信同步，無測試 job；不存在 test.yml。外部 branch protection 未查，不能推定強制攔截。 |
| TEST-COVERAGE-01 | PASS | 已分類所有 54 份檔案、列出入口／依賴／實行與未實行範圍，見第 6 節。不是 100% 分支覆蓋率驗收。 |
| AUD-01B | PASS | origin/main 的 108 個 docs 檔案與公開 repo blob 全相同；本番 108 個預期檔案逐一 HTTP 比對通過，見第 7 節。未驗證 CDN 所有節點及非清單額外 URL。 |
| AUD-02 | IMPLEMENTED_UNVERIFIED | 第 8 節建立全部 16 節對照；未完成每個數值、DOM 分支及跨功能交互的全面證明。 |
| AUD-03B | IMPLEMENTED_UNVERIFIED | 六組 pool/dice × 三尺寸實測 Undo/reset、carry、骰子、touchedKeys、RNG；尚缺 combo／late 解鎖邊界。發現 Undo 零欄位結構差異，見第 5 節。 |
| AUD-04 | IMPLEMENTED_UNVERIFIED | archive 索引明載數值表、API 等尚未全部移管；本次不能修改 CURRENT_SPEC，亦未逐表完成全量語義核對。保持原文，不標「全部統合」。 |
| AUD-05 | IMPLEMENTED_UNVERIFIED | 九份 AGENTS 已列差分規模及重要差異，見第 9 節；尚未逐條判定所有舊規則是否需遷移。旧 VERSION_HISTORY 規則不適用。 |
| REFACTOR-AUDIT-01 | IMPLEMENTED_UNVERIFIED | 第 9 節列風險／分段順序；尚缺全 S 欄位讀寫圖、AST 呼叫圖及完整動態可達性。沒有實際重構。 |
| HOF-NATURAL-SAMPLE-01 | IMPLEMENTED_UNVERIFIED | 原生 160＋20＋87 案例本次重跑通過；歷史 pilot 50 生涯／25 seed，非 4000；KBO／MLB 一軍樣本仍為零。 |
| HOF-BUCKET-DECISION-01 | DESIGN_PENDING | stat-bucket／careerScore 維持 league 合算、MiLB 不併 MLB。一軍限定／權重仍未批准。 |
| HOF-PITCHER-BALANCE-01 | DESIGN_PENDING | W/SV/SO/IP 現行公式與 HLD/ERA/WHIP/L 缺直接權重已確認；無足量四聯盟／SP-MR-CL 樣本，不採 A/B/C。 |
| HOF-HONOR-POLICY-01 | DESIGN_PENDING | honorScore／tierOf 的保底與國際／franchise 加分為現行規則，單元通過；政策是否改變仍待決定。 |
| HOF-DISPLAY-ROUND-01 | DESIGN_PENDING | 邊界測試確認 raw 7999.8 與 Math.round 顯示 8000 不同；是否加註、改顯示精度尚未決定，未當計算 Bug。 |
| HOF-VOTE-STORY-01 | DESIGN_PENDING | retireScene 的 tier0 確定入選／tier1 候選敘事已確認；是否改說明或機率投票仍待批准。 |
| EVT-1102-ANDROID | BLOCKED | 年度去重／跨年單元及桌面 browser 通過；無 Android Chrome 實機，不借用過去 iPhone PASS。 |
| UI-17-DEVICE | BLOCKED | preferences 已實作、五種寬度×24 組 UI 設定回歸通過；沒有本次 iOS／Android 實機證據。 |
| SHARE-111-DEVICE | BLOCKED | 三尺寸 mock 原生分享成功／取消／失敗、四主題 PNG 通過；系統 share sheet／實機下載仍未驗證。 |
| COPY-01 | IMPLEMENTED_UNVERIFIED | 92 張文案及契約日本語測試通過；沒有完成所有可達文本的人工語意審查，不把 92 張替換當全部文案驗收。 |
| OVR-01 | DESIGN_PENDING | hitter stamina 5% 尚未採用；現行 ovr 公式保留。 |
| TRAIT-PITCHER-TC | NOT_IMPLEMENTED | DEFERRED_TRAITS 保留 ID；最多勝／ERA 單項賞前提未定，未冒用最優秀投手。 |
| TRAIT-NITENICHI | NOT_IMPLEMENTED | DEFERRED_TRAITS 保留 ID；二刀流及投手三冠制度未定。 |
| TRAIT-CHAMPIONMAKER | NOT_IMPLEMENTED | DEFERRED_TRAITS 保留 ID；現有年度冠軍不是累計五冠／勝率增益系統。 |
| CONTRACT-LEGACY-01 | NOT_IMPLEMENTED | 整理／刪除未做；仍有引用及 LEGACY 捕捉／override，尚不能證明全數不可達。 |
| CONTRACT-ASIA-01 | NOT_IMPLEMENTED | 只有 FOREIGN_STANDARD 個人 package；亞洲枠／全隊外籍預算未建，規格待決。 |
| INJ-UI-01 | NOT_IMPLEMENTED | 現有 condition/TJ 顯示不等於一般故障風險完整內訳 UI。 |
| PLY-01 | NOT_IMPLEMENTED | 無背號分配／年度歷史系統；變更／重複／00 規則待定。 |
| INT-01 | NOT_IMPLEMENTED | intlTraitResults／honors 已有資料，但非所提完整大会別履歷 UI。 |
| EVT-01 | NOT_IMPLEMENTED | 事件資料／結果有 category；尚無所提一致分類提示 UI，不能把資料欄位視為已完成畫面。 |
| UI-06 | NOT_IMPLEMENTED | 尚無所提完整初心者遊戲內說明；現有提示不代表此項完成。 |
| UI-07 | NOT_IMPLEMENTED | CHANGELOG 存在，但無遊戲內更新履歷功能。 |
| PLY-02 | NOT_IMPLEMENTED | 無永久欠番系統；背號與組織／年資／RNG 方針前提未定。 |

38 項合計：PASS 3、FAIL 1、IMPLEMENTED_UNVERIFIED 10、NOT_IMPLEMENTED 14、BLOCKED 4、DESIGN_PENDING 6。非採用項目不是待實作功能；seed-only／不存檔／不復活旧引擎與未採用 A/B/C 保持。

## 3. 實際測試指令與結果

下列 `<PW>` 代表環境既有 Playwright 模組路徑。沒有安裝依賴。現有 E2E 的截圖／JSON 只輸出 OS 暫存目錄；没有新增或改寫 repo 測試。

| 執行 | 指令／方法 | PASS／FAIL／SKIP | 耗時／說明 |
| --- | --- | --- | --- |
| 單元／靜態入口 | PowerShell 列 tests/*.test.mjs，逐一 node 執行；再執行下述五個 policy／verify 入口 | 38／0／0（檔案入口） | 8.441 秒；33 test＋5 standalone，不虛構 assertion 總數。 |
| 語法 | rg 列 docs/tests 的 js/mjs，逐檔 node --check | 93／0／0（檔案） | 11.329 秒；git diff --check 也通過，只有既有 LF/CRLF 提醒。 |
| 本機 HOF | node tests/hof-first-ballot-e2e.mjs --playwright=<PW> | 1／0／0（指令） | 沒有獨立記錄耗時；三尺寸人工診斷＋兩完整生涯。 |
| Preview HOF | 上述加 --preview=https://dev.yakyujinsei.pages.dev | 1／0／0 | 沒有獨立記錄耗時；47 檔與受驗 dev 一致，三尺寸自然退休／票選／PNG。 |
| NPB 復帰／合約 UI | node tests/npb-return-e2e.mjs --playwright=<PW> --quick | 1／0／0 | 沒有獨立記錄耗時；22 情境、五寬度×24 設定通過；quick 跳過旧版全生涯及旧新版 route 比較。 |
| KBO 旧基準 | node tests/championship-intl-e2e.mjs --playwright=<PW> --balanced --seed=jp3-infielder-01 | 0／1／0 | 19.357 秒；先於 baseline 004cd26 的 2049 KBO2 報錯，尚未測 current，不單憑此判 current FAIL。 |
| KBO 現行診斷 | 上述腳本在記憶體將 [true,false,false] 改為 [false,false,false]、--skip-ui，root/require 指向現有專案；不修改測試檔 | 0／1／0 | 166.779 秒；current 同年同錯誤；錯誤後 restored choice 被自動器重按，最後 Career did not complete。重複錯誤不是獨立樣本。 |
| 能力瀏覽器診斷（有效版） | node --input-type=module -e；唯讀 HTTP＋記憶體 observer 呼叫 native allocUI／allocDone | 1／0／0 | 8.053 秒；pool3/dice[2,4,6]×1280/320/390 共六組，見第 5 節。 |
| 事件本機 | node tests/event-fix-e2e.mjs --playwright=<PW> | 1／0／0 | 13.858 秒；三尺寸，實抽三張／耗盡、成功失敗育成點、分享、退休。 |
| 事件 Preview | 上述加 --preview=https://dev.yakyujinsei.pages.dev | 1／0／0 | 11.999 秒；三尺寸共享／seed-only／focus／fallback，六份來源一致。此 remote 分支沒有跑本機 fixture 的事件點數／耗盡斷言。 |
| 分享／PNG | node tests/replay-share-theme-e2e.mjs --playwright=<PW> --ui-only | 1／0／0 | 31.826 秒；每尺寸 12 URL modes、四主題、PNG 自動更新／保存／分享位元一致；跳過六 seed 旧版比較。 |
| Preview 選秀 | node tests/global-contract-market-e2e.mjs --playwright=<PW> --preview=https://dev.yakyujinsei.pages.dev --quick | 1／0／0 | 7.151 秒；PC/320/390 實際入團與收入 UI，無 NaN/undefined/橫溢出。remote 分支不跑 local contract fixtures。 |

現有 browser 指令共 8 次：PASS 7、FAIL 1（旧基準 KBO）。額外有效诊斷兩次：能力 PASS、現行 KBO FAIL。初始化診斷另有兩次失敗：一為臨時指令語法錯誤 0.289 秒（未啟動驗證）；一為 Undo carry 嚴格結構比較失敗 3.073 秒。未改測試期待或遊戲：另立數值比較與全 reset 精確比較，保留初次差異。這兩次不混入現有測試通過數。

明確未執行的檔案級命令：event-system、draft-income、display-preferences、salary-history、trait-system 五個 E2E；retirement-hof-pilot 的新採样；retirement-hof-analysis、retirement-hof-report 兩個生成器，共 SKIP 8。原因為本次已選相關專項入口、沒有全量其他歷史基準接受比較，以及後兩者會改寫既有審查檔，禁止執行。不存在「所有 E2E 全 PASS」結論。support／JSON 是非執行入口，不當 SKIP 測試。

通過的 browser 指令／能力診斷：Console error／pageerror／JS-CSS HTTP404 為 0；KBO 路徑確實有上述錯誤，不宣称整個遊戲 console 全乾淨。外部字体／所有圖片 URL 沒有單独全量 browser 404 保證。

固定 Seed：本機 HOF E2E 對 `925987dc1bb93304eddd8eb71ab2876eef9dac8c` 與 current 分別執行 `yakyo-test-001/P`、`jp3-infielder-01/IF`。除 VERSION，完整最終 S、逐次操作文字歷史、RNG 快照／計數嚴格一致：投手 652、野手 549。依該脚本原有 UI 選擇策略，與 balanced 策略不同；不能拿 549 的通過否定 balanced 的 KBO 失敗。Seed 相同而選擇不同不保證結果相同。

## 4. P0 Bug 專項證據

### BUG-KBO-RENEWAL-FLOOR：FAIL

- 程式：game.js 的 active salaryCandidate（2709–2721）、fixedContract（2805）、movement（3071）與更新／FA 流程；cross-league-market-policy.js 的 applyKboForeignPackageCap（51–59）。choose（663）、runChoiceAction 的復原路徑使失敗選項可再出現。
- Seed `jp3-infielder-01`，位置 IF；新局直接開始。**必要的歷史規則**使用 championship-intl-e2e 的 `--balanced` action：可用能力行先排 vel/ctl/brk/con/pow/eye/spd，再按現值由小至大、穩定保留 DOM 順序；優先第一能力行，其次配分完了／次へ等，其次 NPBドラフト／プロ志望／オファーを受ける／契約を結／指名／入団，最後第一個未 disabled 且非 Undo/reset 按鈕。沒有 --stay；每步只 .click() 一次，不改能力或 RNG。這是可重算的選擇策略，不是只提供 Seed。
- 操作：按上述策略推進至 2048 KBO 一軍降格，2049 KBO2，當季終了／滿了更新。旧基準記錄契約 KBO:KBO_BUSAN_GIANTS:2042:010、2043–2049、年俸192240000；這些是**旧版**診斷資料，不推定為 current 的完整契約快照。
- 預期：依批准下限與 package 政策產生合法契約／可操作進路；不在正常生涯中卡死。
- current 實際：2049／39歲產生 `CHOICE_ACTION_FAILED`，code `KBO_PACKAGE_FLOOR_CAP_CONFLICT`；自動器無法完成生涯。第一次錯誤後應停止並保存畫面，不重選；本次既有自動器續按復原選項造成大量同錯誤，未把它計為多案例。
- 分析：cap helper 對 `salary < levelMinimum` 直接拋例外；same-league salaryCandidate 的 raw 包含 position／contract multiplier，無跨聯盟 floor 套用就傳入 cap。**該錯誤碼本身不能證明硬上限真的低於 floor**：輸入候選低於 floor 也同樣報此碼。候選 raw、倍率、floor、package 的第一次錯誤完整輸入 trace 尚缺；建議獨立修復前補記，不直接猜公式或調平衡。本次未修改。
- 輸出摘要：`CURRENT_KBO_EXIT=1`、`Career did not complete`、`CHOICE_ACTION_FAILED ... year: 2049, age: 39`、`KBO_PACKAGE_FLOOR_CAP_CONFLICT`。

### BUG-ACT-01：BLOCKED 原問題驗收

- 程式：game.js choose／runWithResultView（662–672）、phaseMid／proSeason；ui/choice-action.js createChoiceActionToken／runChoiceAction；ui/navigation.js。
- 過去 Seed `k55l221a/P`、`oscuxs1w`（位置不明）。原始完整選擇序列、發生年度／所屬不在目前資料。本次沒有重跑這兩個 Seed，不宣称「沒有重現」。
- 待操作：按原歷史至「今季の成績を見る」，點一次；觀察成績 card 新增、listener、activeToken、choiceGeneration、下一選項與是否移至結果位置，PC／手機各一次；避免重按掩蓋首次錯誤。
- 預期：一次結算並可見結果，下一操作仍可用。實際原案例：未測。通過證據僅限 choice-action 單元的重複／stale／nested／例外復原與另一組自然生涯。

### BUG-ACT-02：IMPLEMENTED_UNVERIFIED

- 程式：enterDraftPath／NPB 入團處理、active signTo（2807）、choose／runChoiceAction、allocUI。
- 本次 Preview Seed `yakyo-test-001/P`，按 global-contract-market-e2e 的 action（第一可用能力行、進行／NPB志望／接受優先，否則第一選項），至 `新人年俸`；PC／320／390 開薪資詳情並驗證育成支度金累計、無 NaN、可見版面。
- 預期：接受指名後生成有效契約且保留後續操作。實際：三尺寸入團／收入流程 PASS；另 HOF E2E 相同 Seed 的完整自然生涯能到退休。但 Preview 選秀測試在新人年俸即停，未專门快照下一 DOM／listener；未知原案例路線不能全項結案。
- 輸出：`Preview PC/320/390: draft, income UI, layout passed`、Console/JS-CSS404 0。

### BUG-ACT-03：IMPLEMENTED_UNVERIFIED

- 程式：active phaseEnd（3055）、advance／finalizePendingOffseasonSalary、movement（3071）、applyDemotionSalary、contract-policy 的 contractNeedsRenewal／contractContinuationForNextYear／salaryDueForYear。
- 本機 fixture Seed `return-contract/P`；明示人工情境，不冒充自然重現。年2032、原契約 RETURN-FIXTURE、當年已支付，MLB/MLB、MiLB/A3、KBO/KBO1、CPBL/CPBL1；逐一測兩年剩餘延續、一年滿了接受／拒絕、延長，再測 FA／降格／戰力外／老將歸國，共22情境。
- 預期：進路未選前不 advance；接受或殘留後僅 advance 一次，有次年契約／年表。實際相關情境 PASS；雙擊仍進行一次、满了下一年表2033未支付、年俸決定一筆、没有无故買斷。
- 未測：全休 rehabilitation × 合約滿了／未滿了 × 各聯盟完整 browser 組合；salary-flow 的全休檢查含原始碼斷言，不能冒充瀏覽器驗證。KBO 自然滿了失敗另列 FAIL。

### BUG-SAL-01：IMPLEMENTED_UNVERIFIED（已測子範圍 PASS）

- 程式：active salaryCandidate、crossOffers（2967）候選快照、signTo（2807）、saveSalaryDecision、handleDemotion（1632）、outOfOrg（3031）。history append 無 slice(-10)。
- 使用上列 `return-contract` 四系統 fixture；sourceLevel 為所屬，targetLevel NPB1，倍率1；候選由原函式取得，沒有自造預期金額。
- 操作：滿了呼叫實際 movement，讀 NPB 返回按鈕階層與年俸；再呼叫 crossOffers 確認 DOM文字／狀態／RNG 不變；雙擊接受，對照候選、ct.annualSalary、currentSalary、lastSalaryDecision.finalSalary、2033 annualSchedule。
- 預期／實際：四系統金額一致、下一年表正確、決定履歷一筆、舊收入不變，PASS。顯示再試不新增 RNG。此 next-year assertion 是年表，不是假稱已完整支付下一年。
- 尚缺其他海外階層／降格候選逐項受諾與次年支付實測；只有 NPB2 降格選項基本流程，不足宣告所有 KBO/MiLB/CPBL 階層完成。輸出 `22 actual movement... scenarios passed`。

## 5. 能力／Undo／重置與 HOF 補驗

能力診斷只在唯讀 test server 的回應附加 observer，使用遊戲原 allocUI／allocDone，不修改送出的遊戲檔；人工 pool3／dice[2,4,6] 作明確 fixture。

三尺寸各驗證：reset 初始 disabled；click、Enter、Space 配分；Undo 一次恢复前一步數值；reset 精確復原初始能力／carry／RNG，Undo/reset disabled；dice[2,4,6] 的結果與次序復原；改把三次操作配到另一能力後確認 touchedKeys 僅該能力（pool3／dice12），沒有被取消的欄位；RNG 呼叫差0；無橫溢出。六組 PASS。沒有強制 reroll 或重跑 trait 判定。

額外觀察：Undo 對不存在的 carry key 會寫回0。實例 `{sta:0}` → `{sta:0,vel:0}`，能力與 calls19 相同。原程式以 `carry[k] || 0` 取值，因此本次只確認**數值等價**，不宣称物件 keys 完全相等。全 reset 的精確比較則通過。建議 P2 確認要求是否需要恢復欄位存在性／加相應測試；不是批准修改遊戲或直接判成平衡 Bug。

combo 的75%集中／三年、late 的年齡與gain16解鎖等分支在 allocDone（1058）仍可能影響 pot／traits／RNG；本次fixture在HS，未驗這些解鎖邊界，因此 AUD-03B 不關閉。

HOF：retireScene（2038）新增 firstBallotLeagues；每個 firstNow 才加入（2081），legend 取該集合第一項（2093），不再取全部入選聯盟第一項。`hof-first-ballot-league.test.mjs` 31 項包含人工 CPBL8600／MLB11000，確實選 MLB；保留 hofLeagues、投票／閾值及 RNG。選手／退休／PNG 也由同一 legendLeague 出字。本機三尺寸診斷及 Preview `hof111-pilot-11/P` 自然退休／票選／PNG PASS；不代表已取得自然跨聯盟 F01 頻率。

退休平衡：保留 `RETIREMENT_HOF_BALANCE_AUDIT_V1_11_1.md`／DATA JSON。原調查被測 b439f8b、160固定＋20特例＋87邊界；本次單元重新通過這些原生 scorer 場景，但沒有重新生成歷史50生涯報告。歷史實測為25 Seed×2策略＝50完成生涯、54 league快照，不是4000；一軍到達CPBL11/50、NPB19/50、KBO0/50、MLB0/50，主職涯CPBL6、NPB15、未分配29，沒有 CL 一軍有效樣本。重播與本次三尺寸同 seed 不增加獨立樣本數。原報告的 HOF「尚未修復」屬當時結論，不適用 current。剩餘需四聯盟、SP/MR/CL、位置、退休年齡與策略分層樣本；沒有批准系數修改。

## 6. tests 全54檔盤點

33個 `*.test.mjs` 均本次執行 PASS（用 `node tests/<檔名>`；零依賴安裝）。分類如下；靜態 regex／VM／純函式斷言不等同自然 browser 全生涯。

| 範圍 | 檔案（都在 tests/） | 性質／依賴 |
| --- | --- | --- |
| 能力／UI／文案 | ability-allocation.test.mjs、ui-foundation.test.mjs、information-architecture.test.mjs、record-condition-fix.test.mjs、display-preferences.test.mjs、japanese-copy-contract-ui.test.mjs | 原始碼／policy 斷言；ability-allocation 主要 regex，缺現成 Undo 狀態 browser suite。 |
| 事件 | event-copy.test.mjs、event-policy.test.mjs、event-integration.test.mjs、event-fix.test.mjs | copy JSON／catalog、資格／效果／年度状态、VM與旧Git資料比較；92卡與1656效果分支回歸。 |
| 契約政策 | arbitration-policy.test.mjs、contract-policy.test.mjs、control-period-policy.test.mjs、draft-signing-policy.test.mjs、draft-bonus-display.test.mjs、fa-market-policy.test.mjs、global-contract-market.test.mjs、incentive-policy.test.mjs、injury-market-policy.test.mjs、team-demand-policy.test.mjs | 原始碼＋policy／fixture；同域不一定重複，規則與接線分開。 |
| 年俸 | salary-detail-ui.test.mjs、salary-evaluation-policy.test.mjs、salary-explanation-policy.test.mjs、salary-flow.test.mjs、salary-promotion-policy.test.mjs | 解釋／歷史／評價／接線／promotion；flow 多為source斷言，不涵蓋完整KBO自然路徑。 |
| 特性／優勝／HOF | trait-policy.test.mjs、championship-intl.test.mjs、retirement-hof-balance.test.mjs、hof-first-ballot-league.test.mjs | 原生VM、Git before/after與人工邊界；HOF需support。 |
| 其他回歸 | choice-action.test.mjs、fixed-seed-v160.test.mjs、npb-return-ui.test.mjs、replay-share-theme.test.mjs | 純函式／source／固定RNG／routing；fixed-seed-v160 不等於完整新版所有人生比較。 |

五個非 `.test` 執行入口本次全 PASS：`hall-of-fame-policy.mjs`、`verify-modularization.mjs`、`domestic-tournament-policy.mjs`、`career-movement-policy.mjs`、`salary-promotion-policy.mjs`。最後一檔與同名 `.test` 是兩個不同入口；runner 不應漏掉或自行刪除。

11個 E2E 入口（需 Playwright＋Chrome，部分需保留 Git 基準 SHA，HTTP instrumentation 只在測試回應；輸出位於 temp）：

| 檔案 | 本次狀態／分支 |
| --- | --- |
| hof-first-ballot-e2e.mjs | 本機、Preview PASS；baseline925987d、兩固定自然生涯。 |
| npb-return-e2e.mjs | 本機quick PASS；完整模式未跑。 |
| event-fix-e2e.mjs | 本機、Preview PASS；remote 的 fixture 子範圍跳過。 |
| championship-intl-e2e.mjs | balanced 指定seed FAIL於baseline；current記憶體診斷另FAIL；其他 UI／seed模式未跑。 |
| replay-share-theme-e2e.mjs | 本機ui-only PASS；mock系統分享，不是實機；完整六seed未跑。 |
| global-contract-market-e2e.mjs | Preview選秀 PASS；local金額fixture及完整六seed未跑。 |
| event-system-e2e.mjs | SKIP；有事件總體／Git基準回歸，未把本次event-fix通過代替全腳本執行。 |
| draft-income-e2e.mjs | SKIP；Preview選秀觀察不能代替全部契約金累計測試。 |
| display-preferences-e2e.mjs | SKIP；npb-return涵蓋設定組合，但非此腳本重跑。 |
| salary-history-e2e.mjs | SKIP；append完整保留的單元通過，不冒稱本次手機20筆全部實測。 |
| trait-system-e2e.mjs | SKIP；trait-policy／HOF實測不代替全部特性取得路線。 |

其餘5檔：`retirement-hof-pilot.mjs` 是自然生涯採樣 browser入口（本次SKIP新採樣）；`retirement-hof-test-support.mjs` 是被HOF／balance／analysis匯入的原生VM／fixture工具，不單獨當测试；`retirement-hof-analysis.mjs`、`retirement-hof-report.mjs` 為分析／生成器（本次SKIP，會写既有report/DATA）；`fixed-seed-regression.json` 為fixture。本次 `rg` 未找到 tests 的明確檔名引用該JSON，列可能未使用，不等於允許刪除；外部手動流程未知。

未找到统一 runner 或 npm 測試入口。不能將 `node --test` 的預設發現範圍當全部54檔執行。Git基準不存在、Playwright不足、腳本略過子模式時應顯式SKIP／FAIL。未測外部GitHub Ruleset設定。

## 7. Preview／本番唯讀照合

Preview：HOF E2E 逐一 no-store 取得全部 tracked HTML/JS/CSS **47檔**，與受驗 a4aa83c 工作目錄正規化 CRLF後完全相同，再跑原生自然流程。此處能證明配信程式内容，不從 Cloudflare deployment UI 猜 commit。未把仅 config VERSION相同當最新。三尺寸事件分享另比六份檔案一致。

本番：fetch origin/main 後用 `git ls-tree -r -z` 清單、`git show <main>:docs/<path>` 與 `https://yakyujinsei.com/<path>` 唯讀HTTP核對。108／108預期檔案一致；文本只正規化CRLF，二進位逐byte比對。第一次sandbox網路失败未當網站FAIL，升權重試；首次manifest未用-z導致4份Unicode名稱無法對照，另以正確UTF-8清單補測4／4，不把工具問題當配信差異。成功104檔那輪9.751秒，Unicode補驗1.946秒。

公開source repo `tt-chin/yakyujinsei-site` main commit `c3b5d2534e2449d5dace220cf11b953b6299f952`；GitHub tree未截斷，108個docs對應blob皆與origin/main一致，額外檔案只有CNAME。没有重新部署、修改domain或啟動Workflow。HTTP照合只證明當時該清單；沒有宣告所有額外URL／cache節點一致。

## 8. CURRENT_SPEC 16節 traceability

全部小節建立索引不等於全數值驗收；下列測試除標「未跑」外，對應非browser單元本次通過。

| 節 | 實作／測試 | 本次可證範圍與不足 |
| --- | --- | --- |
| 1 適用／驗證 | config、AGENTS／archive索引 | dev/main實際SHA/版本已對照；舊「本番未驗」描述應另更新，不能覆寫舊證據。 |
| 2 恒久仕様 | game seed/R、seed-share、modularization | 固定seed列、兩完整生涯與seed-only；非所有seed穷舉。 |
| 3 総合能力 | game ovr／abCost/addAb | 原式及cost静態回歸、allocationbrowser；OVR-01未採用。 |
| 4 国内／国際 | domestic-tournament-policy、game intl | policy／championship單元；不是全大会自然生成路線驗收。 |
| 5 薪資／契約 | contract、salary、fa/arbitration/control等policy | 相關單元、22路徑；KBO自然更新FAIL阻止全項通過。 |
| 6 情報／記録 | navigation、record-view、condition、salary-explanation | 分類／rehab／全歷史單元；salary-history專項browser本次未跑。 |
| 7 育成／文言 | allocUI/allocDone、ability/copy tests | 六組Undo/resetbrowser；解鎖邊界及全可達copy未完。 |
| 8 表示設定 | preferences、themes/styles | 五寬度×24組及三尺寸分享；實機未驗。 |
| 9 運用 | AGENTS、publish-site.yml | 当前規則／只配信無CI已確認；不改Workflow。 |
| 10 92事件 | event-cards、event/state/season policies | 92copy及效果／資格單元、實抽／結果browser；非全部92張逐卡browser。 |
| 11 全球契約金／市場 | signing-bonus、cross-league、signTo/fixedContract | 單元、NPBreturn、Previewdraft；KBOFAIL，全部費用／市場browser分支未跑。 |
| 12 特性 | trait-policy、game checks／retireScene | 38ID／三保留、31HOF案例；自然四聯盟樣本不足。 |
| 13 年度去重／seed | event-state／drawEvents、seed-share | 年度重置單元、3次實抽／耗盡、成功失敗點數、兩地分享；本次Preview event腳本不含全部fixture。 |
| 14 NPB復帰／摘要 | active crossOffers、navigation/styles | 22情境、五寬度設定；quick不跑旧新版1→0 team-draw比較。 |
| 15 優勝／国際特性 | championship-policy、international-trait-policy、phaseEnd | 相關單元；指定balanced全生涯回歸被KBO阻止，未完成此E2E UI子模式。 |
| 16 原生分享／PNG | seed-share／share-theme、endGame/shareImage | 12mock modes×3尺寸、四theme及標準PNG旧版像素回歸；實機share sheet未驗。 |

## 9. 舊規則與重構風險

九份 archive AGENTS 使用完整文字 Compare-Object 做差分，不把旧指示當現行規則：imported/history 的 latest（217行、264個差異項）、snapshot／(1)（各61行、156）、(2)（217、264）、(3)/(4)/(5)（各311、340）、(6)（146、21）；local/snapshot（146、21）。計數包含格式與增刪行，不是語義變更數。重要差異：旧版仍以 VERSION_HISTORY 管正式履歷、讀旧詳細設計；現行只以 CHANGELOG/CURRENT_SPEC/BACKLOG 分工，新增唯一正本規則。seed-only等相容要求不因封存舊版取消。全部舊條款的移管決定仍未做，AUD-05不關閉。

重構盤點（沒有執行）：

- **game.js 高風險**：約3100行，簡單函式宣告／reassignment掃描約156處（非AST精確唯一函式數）；同名phaseEnd/movement/board/signTo/salaryFor等後段覆寫，LEGACY在2643捕捉原函式，movement仍呼叫LEGACY.movement。只看第一定義會審錯現行邏輯。
- **契約／市場最高風險**：salaryCandidate、pendingOffseasonSalary、S.ct、snapshot、付款idempotency、續約／FA／buyout交織。先補KBO失敗與全休矩陣，再考慮拆結算／candidate純函式；不改資料結構／數字／RNG。
- **旧contract刪除風險高**：makeOffers/pickOfferUI仍有文字引用（phasePre 804/807、旧FA/crossOffers、pathChoiceU4/業餘進路等）；定義覆寫與引用存在都不單獨證明實際可達／不可達。需AST＋native路線trace，不能grep後全部刪。
- **UI/DOM中高風險**：choose＋generation token、actClear、runWithResultView、allocUI render替換行DOM，導航／scroll互相依赖；須保留listener與結果優先、避免二次click。先建立狀態化E2E再拆view。
- **S/RNG最高風險**：季末現役状态、league buckets/statsByLevel、traits、薪资schedule、pendingEvent与计数器混合；目前沒有完整欄位讀寫／消費圖。拆分不能新增抽選或改变序列，純RNG64值回歸不足，需整生涯每步快照。
- **较低风险先行候选**：测试入口、测试分类、纯view格式／政策模块的依赖整理；仍需先界定现行行为，不批次整形或重命名。

建议阶段：runner/CI＋现行失败测试 → 全规格/状态/调用/RNG图 → 补native分支回归 → 一次只提取一个确定边界 → 每步P/野手完整state/actions/RNG＋契约矩阵＋Preview。没有批准实际重构或删除。

## 10. 建議清單與次序

可建議標完成／移出（**本次沒修改BACKLOG**）：BUG-HOF-FIRST-BALLOT-LEAGUE；TEST-COVERAGE-01 的本次54檔分類盤點；AUD-01B 的指定main／公開source／本番108檔比對。保留實機與更深分支缺口，不能把表內IMPLEMENTED_UNVERIFIED／BLOCKED整項清除。

建議新增或細化：

1. P0 KBO首次錯誤 candidate輸入快照與最小native回歸，区分候选未套floor与真正floor/package不可兼容；自動驗收器遇CHOICE_ACTION_FAILED應即停，保存seed/全部選擇序列/RNG/當前契約，勿持續重按。
2. P1 原BUG-ACT-01/02重現資料模板：位置、年度、路線、完整操作歷史；兩seed不能只因其他生涯能跑完就關閉。
3. P1 將本次記憶體能力browser診斷轉為正式可重播E2E（另外授權），補combo/late邊界、carry欄位存在性、reset後另一順序、cap80/剩0；本次不新增測試檔。
4. P1 全休／滿了／降格的合約矩陣；全海外階層候選顯示額、受諾、次年支付／決定歷史一致性。
5. P1 runner明列source-only／policy／nativeVM／naturalE2E／fixtureE2E／analysis與需Git基準、skip原因、temp輸出；确认fixed-seed-regression.json外部用途再決定整理。
6. P1 增加四聯盟自然HOF、SP/MR/CL與位置分層採樣，再做bucket／honor／efficiency政策決定；4000門檻未滿不能發布平衡驗收完成。
7. P2 文書資料同步：BACKLOG基準1.11.2／54檔／HOF已修，CURRENT_SPEC的歷史未驗證描述標示新報告證據，原HOF報告保持當時內容，不改寫成已驗4000。

推荐顺序：**P0 KBO獨立修復與ACT原案例資料 → P1 runner/CI＋契约/能力验收矩阵＋規格trace → P1 四聯盟HOF樣本与设计决策／實機 → P2 纯view整理与已批准新功能**。保留未知与未采用前提，不自动引入存档、旧engine、rv/rules、二刀流或新RNG。

本調查未實作修復；版本維持1.11.2。main、正式網站、測試與使用者BACKLOG未修改。本報告若本地commit，只含此新增檔且不push；commit SHA由最終回報提供，避免文件自引用。

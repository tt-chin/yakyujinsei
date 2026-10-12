# 第十階段：U07／U03／NPB 回國例外／LEGACY 調查

## 1. 基準與結論

調查日期：2026-10-12。分支 `dev`；開始時最新 `origin/dev`／HEAD：`fc879dc73cb8a3886d2812a42443c6192d1f6191`。遊戲 VERSION `1.11.5`。`main`／`origin/main`：`e886e84ca08c6c185406cac9d6f3c4376277061a`（1.11.4）。開始時僅有使用者未追蹤 `tasks/`，保持原樣，不提交、不刪除。

本文的遊戲來源、行號及以下動態結果以此固定 SHA 為準；本輪沒有改變任何遊戲資產。測試／報告提交 SHA、Linux CI Run 與部署證據在 BACKLOG「第十階段提交後證據」補記，與原遊戲 SHA 分開，不用後續純文件 HEAD 冒充已測試程式。

- A：**CONFIRMED_BUG 1項**。正常 IF 生涯符合初始潜在合計門檻，退休仍不能取得 `grinder`。`smallschool` 舊欄位缺失及注入差異確認，但 B 與舊數字3、出生高校與後來學校的對應仍需設計確認。
- B：**NO_ISSUE_OBSERVED（限定矩陣）**。9路線×3尺寸，27案候選年俸／契約金／契約／年表／履歷／支付一致。不能因 1→1.3 參數不同而認定薪資 Bug；跨聯盟的有效倍率確實為1。
- C：**CONFIRMED_RISK 1項**。3種明示 fault injection×3尺寸，9案在重試後不能前進、選项清空。正常回國3案通過。沒有證明自然玩家路線會發生該例外，也沒有發現此案例重複現金付款。
- D：**指定路線 trace PASS，整體不可達性 UNVERIFIED**。舊 board／年度／退休等確實可達；舊市場在兩條生涯中未觀測不等於全局死碼，沒有刪除任何 LEGACY。

調查交付完成不等於遊戲問題已修復。新調查入口故意保留正確的期望行為斷言：**34 PASS／10 FAIL／0 SKIP／0 BLOCKED**，exit 1。既有 Quick **45 PASS／0 FAIL／0 SKIP／0 BLOCKED**。新入口不加入 Quick。

## 2. 調查工具與證據範圍

新增 [stage10-risk-e2e.mjs](../../tests/stage10-risk-e2e.mjs)，重用既有 [stage6-browser.mjs](../../tests/support/stage6-browser.mjs)，沒有改動共用工具。fixture 位於新增測試的 HTTP response hook，沒有另建重複 support 或資料檔。

僅在測試瀏覽器收到的 game.js response 加入 observer／fixture／故障注入；磁碟、Preview 與正式資產不改。R observer 保存每次 before／after state 與值；callback trace 呼叫原函式並保留函式名。完整正常生涯另有「無 LEGACY trace」對照，逐操作比較完整 S 的 SHA-256、操作文字、RNG 消耗，並比較最終完整 S 及全部 RNG 值。這證明本次 observer 在指定路線沒有改變遊戲結果，**不是所有未知路線的形式化證明**。

固定來源位置：

- `docs/src/engine/game.js:246` 舊 newState 的 `hsTier`／`potSum0`。
- `game.js:2797–2811` 現行 newState；`2834` setSchool；`2652` LEGACY capture；`3095–3096` 退休委派。
- `game.js:2107–2129` 舊退休判定；`2224` 稱號清單；`2267–2268` 退休敘事。
- `game.js:2715–2731` previousSalary fallback／salaryCandidate；`2814` fixedContract；`2818` signTo；`1614–1627` buyoutRemaining。
- `game.js:2971–2976` overseasOffer；`2978–3004` crossOffers；`2995` completed latch；`2997` NPB 接受 callback。
- `game.js:660–679` runWithResultView；`docs/src/ui/choice-action.js:15–62` token／錯誤恢復；`game.js:3091` 年度付款。
- `docs/src/engine/cross-league-market-policy.js:4–67` 有效聯盟、一軍年資、限制目的階層、年俸 anchor／cap；`contract-policy.js` 原生 create／markSalaryPaid／schedule／buyout；`signing-bonus-policy.js` 原生付款 ID 防重。

所有位置可用固定 Git blob `git show fc879dc73cb8a3886d2812a42443c6192d1f6191:<path>` 重查，後續文件行數不影響這些遊戲來源行號。

## 3. A：U07 退休稱號欄位

### 3.1 靜態資料流

現行 newState 生成並保存 `schoolTier`（S／A／B），沒有 `hsTier` 或 `potSum0`，也沒有這兩個名稱的 accessor alias。setSchool 會寫 `schoolTier`，包括升學後的學校；不提供舊欄位。全程沒有找到現行路線補入它們的寫點。

仍被 wrapper 保存並執行的 LEGACY.endGame 先確認 reachedTop，再判斷：

- `smallschool`：`S.hsTier===3`。
- `grinder`：`(S.potSum0||999)<=grindTh`，P 門檻237，其他位置469。

缺失 `potSum0` 退成999，永遠不滿足目前兩個門檻。不能改讀退休時的 `S.pot`：潜在值可能在生涯中變動，不等於初始合計。

### 3.2 正常動態重現

Seed **`s10-trait-38`**／IF／1280px。出生 tier B、初始潜在合計 **463**。從真正的啟動畫面開始，沒有修改 S、能力或機率。策略完整且可重跑：

1. 可配分時選當前能力最低的 enabled 能力行；同值保持 DOM 原順序。
2. 非配分時優先「確定」「NPBドラフト」「指名を受けて入団」。
3. 否則 main 選項，再否則第一個 enabled 選項；排除 Undo／reset。
4. `S.done` 後立即停止，不點重新開始。

結果：**347次操作、597次 R、2049退休、NPB 20季**。滿足退休實際 reachedTop 分支與 463≤469，但 `grinder=false`，未顯示「頑張り屋」。這是正常路線的失效，不是人工設高能力造成的假自然重現。

完整操作文字、每步前後 S digest／R 次數、初始及最终完整 S／R 值，輸出 `A-natural-career.json`。正常 UI 升學／入團都由原 callback 執行。

### 3.3 明示舊欄位注入對照及邊界

第二條相同 IF 生涯，只在退休進入前注入 `potSum0=463` 和測試假設 `B→hsTier=3`，不改生涯其他步驟。退休前全部操作 S digest 相同；全部 RNG 值仍相同（597次）。注入後 `grinder=true`、`smallschool=true`，稱號存在。這是**注入對照**，不是實作修復或批准 B→3 映射。

另一正常 P 路線 `yakyo-test-001` 初始潜在243，大於 P237，`grinder=false`，沒有把不符合門檻的 P 結果當成另一個稱號漏發。

newState／setSchool 欄位存在性檢查 PASS；自然符合條件的 IF 期望取得斷言 FAIL；注入對照 PASS。A 共2 PASS／1 FAIL。

### 3.4 修復提案（待批准）

P1、必須修正 `TRAIT-INITIAL-STATE-FIX-01`：保存出生時潜在合計，讓退休判定取得可信的初始值，不改門檻或 RNG；先決定出生高校 B 是否就是舊 tier3，再選出生學校 tier 快照／相容讀取方式，不能取後來大學的 tier。已有取得狀態應保留，舊人生缺初始資料不得用退休潜在推測补造。

必要回歸：P／IF 門檻上下、正常 NPB／MLB／CPBL reachedTop 分支、沒有到達該分支、升學後出生tier保存、潜在變動、已取得稱號不重發、退休前 S／R 全量比較。只允許已批准的退休稱號差異。

## 4. B：U03 海外契約資料流

### 4.1 原生函式矩陣

同一 Seed `stage10-fixture`／IF，1280／320／390px。這些是**有效原生契約 fixture**，不是自然海外轉隊完整生涯。NPB1、當前年度已付款、原年俸2,000萬円、SS倍率1.15、當前及兩個歷史年度 payD6。成熟案例28歲、一軍年資6；限制案例22歲、年資0。

九路線的提示額／正式額／次年原生付款額皆一致：

- 初次赴美限制、MLB候選實際降為 R：年俸300萬、契約金7,000萬。
- 25歲／6年門檻以上、MLB：年俸1億6,488萬、契約金0。
- 相同成熟MLB候選，原合約3年、當年已付、剩2年：相同年俸；另領買斷2,800萬（4,000萬剩餘保障×70%）。
- KBO1：8,000萬、契約金0。
- CPBL1：8,000萬、契約金0。
- MiLB R／1A／2A／3A 的 RELEASE_RECONTRACT helper：300／400／600／1,688萬、契約金0。

前三條與 KBO／CPBL 使用真正 `overseasOffer` 生成候選並點擊其原接受 callback；僅把 finish 隔離為 noop，方便觀察簽約後、年度推進前的狀態。MiLB 四階層用原生 salaryCandidate＋signTo，但提示選項由測試 hook建立，**不把它當作所有四階層自然市場 UI 已驗收**。所有 fixture 明確記錄來源階層及實際目標階層。

### 4.2 提示→重算→契約→支付

候選輸入 sourceLevel=NPB1、targetLevel=MLB／KBO1／CPBL1、contractMult=1。接受後先 buyoutRemaining，再 `ri(1,3)` 決定年數，signTo 以 mult1.3、decision OVERSEAS 重算。由於這是 cross-league，salaryCandidate 內 `cross?1:contractMult`，有效倍率仍1；1／1.3不是價差證據。

buyout 保存 `transferSalarySnapshot.annualSalary=2,000萬`，把 currentSalary 清為0後，previousSalaryForOffer 從 snapshot 恢復相同 anchor。已滿期與剩2年兩種情況均確認；剩2年有原生70%買斷，未把買斷誤算作新年俸或 posting fee。

限制MLB候選先輸出 R，接受重算直接以 R為target，所以 routeWeight 可從 MLB→限制的0.95變為 MiLB的0.8；**300萬硬限制及7,000萬契約金仍完全相同**。這是已記錄的輸入／解釋細項差異，不是已確認顯示金額不一致。

每案斷言：提示 annual、ct.annualSalary、currentSalary、lastSalaryDecision.finalSalary、signingBonus、targetLevel一致；annualSchedule 新年度均 unpaid；簽約當下不把次年年俸提前加到 careerBaseSalary；生涯收入只增加當下契約金＋適用買斷，posting不進選手收入；下一年度原生 phaseEnd 按提示額付款，重入不再加款。候選及重算輸入／輸出、schedule、全部薪資歷史與付款ledger保存在每案 JSON。

候選生成的球團抽選1次 R，接受年数抽選再1次；salaryCandidate本身無 R。MiLB helper固定球團／年數，候選到簽約 R=0。未新增遊戲 RNG。

### 4.3 年數及未驗範圍

這些海外原生候選**没有提前顯示契約年數**，接受才抽1–3年；本 Seed各原生接受為3年。MiLB helper固定1年。沒有把不存在的「提示年數」與正式年數硬說成一致，也沒有自行增加年數提示或提前消耗 RNG。

27案 PASS 只涵蓋此矩陣。更多年資／年龄精確边界、所有伤病／FA／不同能力及自然MLB完整生涯仍未全驗；薪資公式、cap、機率、org表示均維持。`org=MiLB,lv=MLB` 是現有美國path表示，需要有效聯盟解讀，沒有擅自判定為新Bug。

## 5. C：NPB 回國例外恢復

### 5.1 合法基礎與正常操作

`stage10-fixture`／IF、28歲、2038、CPBL1、OVR54、當年度1,200萬已付、契約滿期、一軍年資6。原生 crossOffers 生成 NPB1候選：1,616萬、球團 `NPB_CL_YOK`。fixture 不改玩家入團率；只建立有效的滿期回國邊界。

正常接受：2038→2039、contractId `NPB:NPB_CL_YOK:2038:002`、下一個訓練選項可見可點。再點已脫離DOM的舊按鈕不重複簽約／推進／消耗 R。1280／320／390三案 PASS。

### 5.2 Fault injection 的預期與實際

3故障點×3尺寸：先點原生回國按鈕，確認錯誤恢復原選項，再點恢復的同一選項。預期是成功重試後只前進一次至2039，保留下一操作；實際9案全 FAIL：仍2038、`#act`內容為空。

- 簽約前：signTo入口一次性throw。所屬／舊契約／收入仍CPBL；sequence1不變。球團候選 R=1，接受年數R=2；重試後仍R=2，沒有完成契約或下一操作。
- 契約建立後：fixedContract完成並返回後，一次性throw（**測試注入，不是 createContract 自然失敗**）。所屬／ct仍CPBL，sequence1→2，生成但未提交的NPB契約保存在 created snapshot。未付款；重試仍不執行签约或推进。
- 付款handler後／契約card渲染：signTo已建立NPB契約、履歷及付款ledger，card一次性throw。重試保留同contractId／收入／ledger／R，但因外層latch提早完成，未能走到signingRenderRetry，年度不前進、選項清空。

此回國政策的契約金為**0**，所以「付款後」指付款handler／0額ledger完成後，不是實際領取5,000萬。沒有偽造高契約金來宣稱回國重付現金。本次未觀測double pay，**不能因沒有重付就判定恢復安全**；post-render新契約從2039開始，但玩家卡在2038。

每案 JSON 保留 before／first-failure／retry完整 S、DOM、listener、queue、RNG、ct與created。18筆Console/pageerror都是明示 `S10_FAULT_*`；非注入Console／pageerror與JS/CSS HTTP失敗為0。

### 5.3 根因與修復提案（待批准）

`crossOffers` 內 `complete` 在執行 action 之前設 `context.completed=true`（2995）。runChoiceAction 恢復失敗選項後，新listener再次调用同一 closure；它因completed直接return，runWithResultView／choice runner 清掉已消費DOM而没有產生新選項。signTo自己的已付重畫保護不能越過這個外層latch。

P1、建議優先修正 `STATE-NPB-RETURN-RETRY-01`：將「正在執行」與「已完成签约／推進」區分；成功前不能永久標completed；已付交易重試須讓signTo重用render transaction。年數draw已在首次失敗前消耗，應保存首次結果，不能重抽或回滾合法R；完成後仍需阻擋舊callback。固定球團／候選／年數／原保障、year及ID應只提交一次。不要全面clone/rollback S，也不重設已合法付款ledger。

需要補充的回歸：三故障重試、渲染多次失敗、下一年實際年俸、殘留／回國兩分支、多次候選重畫、舊callback、真正的before-validation失敗，正常全生涯 S／R 比較。after-create注入的sequence gap只作邊界風險，不能宣稱正常無故生成ID。

## 6. D：LEGACY 動態可達性

P `yakyo-test-001`：376操作／815R／2049退休；IF `s10-trait-38`：347操作／597R／2049退休。採A記錄的相同策略。兩條各自 traced／control 的所有操作文字、前後S digest、R次數、最終S和R值相同，2 PASS。

已確認動態可達的legacy呼叫次數（P／IF）：

- board：286／278（active wrapper同次數，讀寫與顯示舊board）。
- phasePre、phaseMid：各24／24（LEGACY委派）。
- proSeason：19／20（LEGACY委派）。
- movement：21／21（PRO路線active wrapper經LEGACY.movement）。
- advance：23／23（advanceWithoutSalaryFinalization capture後呼叫舊advance，內部改用目前startYear binding）。
- endGame：1／1（wrapper保存的舊退休函式）。

舊newState／startYear／amateurSeason／salaryFor／signTo／makeOffers／pickOfferUI／faMarket／crossOffers 的被標記初始實體在這兩條路線中沒有呼叫。現行 active 函式的同名使用另有trace；不能把active的呼叫數算進舊實體，也不能因同名覆寫就抹掉closure保存的實體。

靜態引用仍有舊 pickOfferUI→signTo、舊 makeOffers／faMarket 鏈；外層函式的 binding 在overlay重新指定，捕獲舊函式與讀當前binding不同。現行 callback、不同 FA 路線或記錄視圖未知引用仍需逐條證明。結論是**兩條路線未觀測＋全局UNVERIFIED**，不是「可安全刪除」。`REFACTOR-AUDIT-01`、`CONTRACT-LEGACY-01`保持未完成。

## 7. 執行命令、結果與測試工具修正

環境：Windows／PowerShell、Node `v24.15.0`、外部固定 Playwright `1.62.1`、Chrome `155.0.8059.39`。尺寸為Chromium手機模擬，不替代實機。無新增npm依賴。

以下 `<PW>` 指已安裝的Playwright module目錄，測試及manifest不埋入個人絕對路徑。

```sh
node scripts/test.mjs list
node scripts/test.mjs quick --baseline=fc879dc73cb8a3886d2812a42443c6192d1f6191 --playwright=<PW> --output=test-results/stage10-quick
node scripts/test.mjs full --only=stage10-risk-e2e --baseline=fc879dc73cb8a3886d2812a42443c6192d1f6191 --playwright=<PW> --output=test-results/stage10-delivery
node scripts/check-syntax.mjs
```

- list：exit0，67測試相關檔案、61自動入口含syntax；Quick45／Full60／Audit61。新增入口正確列出。
- Quick：45 PASS／0 FAIL／0 SKIP／0 BLOCKED，**258.247秒**、exit0；log及summary在 `test-results/stage10-quick/`。
- 新調查入口：44案＝A3＋B27＋C12＋D2；**34 PASS／10 FAIL／0 SKIP／0 BLOCKED**。測試及cleanup58.519秒；Runner該入口59.242秒、總60.187秒、exit1。Runner入口數為0 PASS／1 FAIL，與44案不可混算。log `test-results/stage10-delivery/stage10-risk-e2e.log`，逐案證據 `tmp/yakyujinsei-stage10/`。
- 最終 syntax：110 JavaScript檔案 PASS、exit0。
- 補上薪資履歷及正常回國舊callback完整S／R no-op專用斷言後，`test-results/stage10-committable/` 重跑仍34 PASS／10 FAIL、入口50.230秒、Runner總51.079秒、exit1。新增Preview response分支會重用原shared instrumentation，不把raw Preview資產當成已插入fixture的loopback；語法檢查通過，提交後Preview實際結果另在BACKLOG補記。
- 未重跑其他Full／全Audit／4,000生涯／實機：**NOT_RUN**，不作PASS計數。原因：本輪是四項特定調查，適用Quick及指定Full入口已實際執行。

第一次試作 fixture 有測試接線錯誤：markSalaryPaid回傳 `{contract,amount}`，不能把wrapper物件當ct；overseasOffer需要6個參數，漏掉label導致無候選。初次41案4 PASS／37 FAIL，保留 `test-results/stage10-investigation/`；其中36案為測試工具錯誤，另1為已重現grinder。修正**新增測試自己的**接線及有效初始收入後，海外／正常回國通過，剩10案均為上述遊戲行為／故障恢復期望未滿足，沒有改遊戲或調低預期。

初次caller只設exitCode，在Windows有既有browser cleanup handle未退出；第二次fixtures結果27 PASS／9 FAIL但同样未及時退出。最終沿用既有stage7 harness caller的 `process.exit`，在report保存及cleanup完成後退出。最終仍记录「已disconnect browser profile cleanup timed out」warning，不是遊戲Console error，沒有掩蓋。初次未正常exit不可作RunnerPASS，最終兩次最終版入口exit1正常回報。

## 8. Manifest 修改前後與保護範圍

`scripts/test-manifest.mjs` 僅新增：

```diff
 const browserProfiles = {
+  'stage10-risk-e2e': {seconds:240,reason:'Pre-refactor investigation: natural trait routes, overseas salary flow, explicit return faults and passive LEGACY traces. Desired-behaviour failures remain FAIL; no Quick profile.'},
```

沒有 quick欄位，套用既有分類器為 `Playwright E2E / integration / fixed-seed`、modes Full／Audit；240秒估時設定只適用新增入口，不修改timeout演算法。人工 `--fixtures-only` 可只跑B／C；Preview須明示 `--preview=<URL>`，Runner未改為傳送新參數。

以Git舊manifest做assert：刪除唯一新增一行後，新檔與舊檔位元組相同；browserProfiles刪掉新key後逐欄JSON相同。所有既有args／quickflags／分類／modes／comparison／manual／估時不變。Quick45不變，Full59→60、Audit60→61，只因新增1個入口。`scripts/test.mjs`、CI workflow及trigger零差異。

Full／Audit的這個新入口目前會以10個失敗使整體非零，因此後續PR Full不能宣稱全綠；保留真實失敗是調查要求，不應以重寫期望或略過它隱藏問題。

## 9. 待驗與批准事項

- 1個正常可重現Bug（grinder）及1個fault injection恢復風險（NPB回國），兩項均新增未完成ID，不撤銷既有指定範圍的Stage7結案。
- schoolTier B／舊hsTier3及出生／升學語意需批准；沒有推測修復或補造舊人生。
- 正常海外自然完整生涯、所有FA／傷病／超過本矩陣的policy邊界、其他LEGACY callback／市場／記錄路線尚未全驗。
- NPB例外的自然觸發根因尚未重現；可能的畫面失敗只是fault模型，不宣稱玩家目前已遇到此錯誤。
- 建議順序：批准回國retry最小修復及固定年數快照 → 批准初始稱號欄位／出生tier語意 → 擴展海外自然樣本與LEGACY trace。全部另開授權，不立即重構。

本輪允許的4檔：新增測試、manifest唯一登錄、本文、BACKLOG。遊戲全樹、CURRENT_SPEC、AGENTS、VERSION、CHANGELOG、Runner、CI及main不變。BACKLOG **18完成／28未完成／46唯一ID**；AUD-02／REFACTOR-AUDIT-01／HIST-SPEC-CLAUSE-01仍未完。

提交後CI／Preview實測資料見 [BACKLOG](../../BACKLOG.md) 的「第十階段提交後證據」。結束後停止，等待審查與修復批准。

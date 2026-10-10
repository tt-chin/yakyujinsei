# draft-income E2E 殘留問題調查與修正

調查日：2026-10-11（日本時間）。Repository `tt-chin/yakyujinsei`，只在`dev`作業。

## 1. 基準與範圍

- fetch後HEAD／origin/dev：`35c40a26aef244908725d2d083f6a622640da0cb`；VERSION **1.11.4**。
- origin/main：`421e036bb206a11828a696a4f8b0d3909385441f`。未修改main、正式網站、VERSION或CHANGELOG。
- 已讀AGENTS、CURRENT_SPEC、CHANGELOG、BACKLOG、前次契約年俸驗收報告、現行測試；收入預期採CURRENT_SPEC第11.4／11.8節及契約金・所得表示節，不採v1.8.0舊政策。
- 僅修改測試、保存路線fixture及驗收文書。沒有修改遊戲引擎、薪資／合約政策、能力公式、RNG或seed-only URL。

## 2. 修正前實際重現

使用現有Playwright模組，以`--playwright=<PLAYWRIGHT_MODULE>`傳入，不增加依賴。

- `node tests/draft-income-e2e.mjs --quick --playwright=<PLAYWRIGHT_MODULE>`：exit1，`AssertionError: 2900000 !== 0`，舊測試第48行。
- `node tests/draft-income-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --playwright=<PLAYWRIGHT_MODULE>`：exit1，`Career retired normally before draft signing (seed bonus-ui); no restart clicked`。
- 更早版本的重新開始誤點修正保留；本次沒有取消退休停止判斷，也沒有將未入團標為正面驗收PASS。

## 3. 問題A：Seed可以入團，舊策略不適合正面驗收

對同一個`bonus-ui`、位置**P**，實際記錄舊策略完整生涯：

1. 配分時總選DOM中第一個可操作能力行，即「スタミナ」。其他選項依舊次序選配分完成／下一步、職業志望／選秀／入團，否則第一可用選項。
2. 2028年高校畢業時能力sta58／vel21／ctl22／brk26，選NPBドラフト，落選後選大学へ進学。
3. 2032年能力sta68／vel21／ctl19／brk23，再次落選，選社会人野球へ。
4. 2035、2038、2041、2044、2047、2050、2053、2056年再挑戰選秀，仍落選並回社会人；未出現指名接受。
5. 2058年正常退休：564次操作、RNG **506**次，內部32-bit RNG值`-94415960`（狀態unsigned值`4200551336`），無職業契約。生涯收入105,150,000円＝社会人給与105,000,000＋スポンサー累計150,000；契約金／支度金／固定年俸均0。

投手OVR不是單獨看スタミナ。這是舊自動策略造成的落選路線，不是Seed不可能入團，更不是入團選項消失。所有正負案例均以原生事件、骰子、選秀與簽約處理推進，不設定Preview能力、不替換R、不重抽Seed來掩蓋失敗。

### 正面路線與完整選擇歷史

均使用正常UI把點數／骰子配給**目前能力值最低的可操作行**，同值保留DOM順序；其餘按鈕次序與舊策略相同。每次操作記錄當時選項、能力key、點擊文字、年度、完整S與RNG。

- `bonus-ui`／**P**：53次操作，2028年選`NPBドラフトへ`，大阪ブルホーンズ育成2巡，選`指名を受けて入団`；2029年NPB_DEV。RNG **61**次，內部值`902583495`。契約金0、支度金2,900,000、次年年俸3,000,000、已付年俸0、生涯收入2,900,000。
- `jp3-infielder-01`／**P**（Seed名稱不是位置，測試明確指定P）：61次操作，2028年選`NPBドラフトへ`，北海道ノースファイターズ4巡，接受指名；2029年NPB2。RNG **58**次，內部值`1345690636`。契約金44,070,000、支度金0、次年年俸12,000,000、已付年俸0、生涯收入44,070,000。

兩條正面路線與舊負面路線的**完整逐次操作序列**保存在`tests/fixtures/draft-income-routes.json`。`history`為無損run-length格式：每條`action`連續執行`count`次；`ability:<key>`代表點擊該能力行，`choice:<文字>`為選項第一行。總次數須與`actions`一致。測試會展開並逐次比對，不只是看最終入團。每次運行另輸出含所有狀態快照及完整DOM文字的JSON到暫存證據目錄。

三尺寸各跑兩次正面路線：完整選擇序列／完整S／RNG均重跑一致。舊負面路線三尺寸各一次，必須實際退休且未簽約，再呼叫停止判斷，完整S／RNG／DOM／URL保持不變。這裡的負面PASS只表示正確停止，不表示完成選秀收入驗收。

## 4. 問題B：290萬円的完整來源

根本原因是舊斷言`careerEarnings === careerSigningBonus`漏掉現行育成支度金。不是未支付年俸，也不是當年度收入與累計混用。

原生處理順序：

1. `game.js`的`runDraft`判定DEVELOPMENT，仍在原位置消費既有契約金抽選，但育成契約金為0。
2. `createSigningBonusTerms({route:'NPB_DRAFT',draftType:'DEVELOPMENT'})`依核准政策生成`signingBonus=0`、`developmentStipend=2,900,000`、`playerIncome=2,900,000`。
3. 接受指名：`acceptDraftSelection`的sign回呼→`signTo`→`fixedContract`→`createContract`，保留這兩個獨立欄位，年俸為下一年度預定。
4. `signTo`中的`applySigningPayment`按contractId一次入帳：加到`careerDevelopmentStipend`及`careerEarnings`，把付款狀態改成PAID並記錄`signingPayments`。
5. `acceptDraftSelection`再呼叫付款時，PAID／已記錄contractId阻止再次入帳。重繪、再次付款、normalize後再次付款均不新增收入。

最小原生育成fixture的實測資料：

- 接受前：`careerEarnings`、`careerSigningBonus`、`careerDevelopmentStipend`、`careerBaseSalary`、`careerIncentive`、`careerBuyout`、`careerOutsideIncome`、`yearOutsideIncome`、`corpIncome`全部0。
- 接受後：`careerEarnings=2,900,000`、`careerDevelopmentStipend=2,900,000`；上述其他欄位全部0。
- `ct.signingBonus=0`、`ct.developmentStipend=2,900,000`、`ct.annualSalary=3,000,000`；`paidTotal=0`、`remainingValue=3,000,000`、`signingPaymentStatus='PAID'`，2029年度表未付。
- 唯一付款記錄`NPB:NPB_PL_OSA:2028:001`，內容為bonus0／stipend2,900,000。
- 提示／接受／重試及正規化後RNG計數皆 **23→23→23**，入帳未新增RNG。
- 正式fixture則契約金96,980,000、支度金0、年俸16,000,000、已付年俸0，RNG **22→22→22**。金額來自原生抽選及排名，並非改期望值硬塞290萬。

最小政策測試直接呼叫原生terms／createContract／applySigningPayment，比對獨立bonus與stipend欄位、總額、重入／normalize去重；育成與正式各一案。UI測試另獨立驗證實際原生選秀接受流程。

### 測試設計修正

- fixture每案使用新頁面；初始化漏掉的`careerDevelopmentStipend`、`signingPayments`、舊ct／draftRights／contractSequence。所有本次追蹤收入欄位從0開始。
- 取消舊fixture的`R=()=>.5`替換，原生R及其既有呼叫照常執行。預設seed可穩定生成正式與育成fixture；控制能力僅用於本機隔離fixture，沒有修改遊戲公式或Preview自然玩家能力。
- 用現行政策terms、分欄收入、未付年表及實際UI金額共同驗證；沒有把舊`0`簡單改成`2900000`。`yearOutsideIncome`屬當年度子集合，不再加入生涯總和。
- 明細按`dt/dd`逐欄核對實際金額，開關两次完整S／RNG不變；不以「契約金」字樣存在就通過育成契約，育成支度金是獨立欄位。
- 啟動前等候初始化完成，再選位置，並核對S.pos，避免尚未綁定listener時點擊位置。
- 舊full模式固定與v1.8.0完整狀態相等的oracle早於已批准薪資／事件政策；改以本次修正前dev `35c40a2`為明確預設基準，支援`--baseline=<SHA>`。不刪除契約金欄位來隱藏差異，仍逐步比較完整S／選項／RNG。原退休圖片與所得顯示斷言保留。

## 5. 指令、統計與環境

環境：Windows、Node 24.15.0、Playwright使用既有Chrome 155.0.8059.39；PC1280px與320／390px手機模擬，不冒稱實機Safari／Android。

- 本機`node tests/draft-income-e2e.mjs --quick --playwright=<PLAYWRIGHT_MODULE>`：**18 PASS／0 FAIL／0 BLOCKED**，最終75.258秒。2個付款最小案＋6個原生正式／育成fixture＋6個自然路線重跑組＋3個負面退休案＋Console/404檢查。重跑組每組含兩次入團；最終另斷言normalize／重試／重繪後完整S與RNG相同、接受指名新增RNG0。
- Preview `node tests/draft-income-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --playwright=<PLAYWRIGHT_MODULE>`：**13 PASS／0 FAIL／0 BLOCKED**，81.399秒。2最小案＋47資產一致檢查＋6自然路線重跑組＋3負面退休案＋Console/404檢查。
- `node tests/draft-income-e2e.mjs --retirement-only --playwright=<PLAYWRIGHT_MODULE>`：**6 PASS／0 FAIL／0 BLOCKED**，3.845秒，含3尺寸原生退休停止fixture及付款最小案、Console/404。
- `node tests/draft-income-e2e.mjs --careers-only --playwright=<PLAYWRIGHT_MODULE>`：**9 PASS／0 FAIL／0 BLOCKED**，最終246.188秒。六Seed逐步完整S／選項／RNG相等，均正常退休；兩組付款最小案及Console/404檢查。原有退休圖片生成／所得顯示檢查保留且實際通過，生成圖片不改S／RNG。先前233.672秒未含圖片的一輪不重複計数。
- 相關既有10個單元入口：**10 PASS／0 FAIL**，1.528秒，各exit0：draft-signing-policy、draft-bonus-display、global-contract-market、contract-policy、salary-explanation-policy、kbo-renewal-floor、salary-flow、salary-detail-ui、salary-promotion-policy、salary-evaluation-policy。KBO入口內部10案全部PASS，不把入口數與assertion數混算。
- `node --check tests/draft-income-e2e.mjs`及`git diff --check`PASS。Console Error／pageerror／JS・CSS404均0。

Preview先逐一讀取47個tracked HTML／JS／CSS，以HTTP200及CRLF正規化後全文比對本機dev，確認不是只看VERSION。自然操作使用配信原生程式；僅在測試瀏覽器附加唯讀get觀察器及不改变R回傳值的計數器，沒有部署測試hook、替換R、設定S或呼叫fixture。總PASS為各入口的檢查組數，最小付款與Console等重複項不能相加當成唯一案例數。

證據目錄：系統暫存下`yakyujinsei-draft-income/local/quick`、`local/retirement`、`local/careers`及`preview/full`；含summary、完整操作／狀態JSON、收入fixture前後、明細截圖。完整路線fixture另提交到repository，避免僅有暫存證據。

## 6. RNG／狀態與剩餘範圍

自然正面路線固定次數與內部rng如第3節，所有尺寸與重跑符合保存序列；負面路線506次不变。原生入團fixture接受與重試新增RNG0；UI明細開關新增RNG0，完整狀態不變。

六完整生涯比較採投手三條`yakyo-test-001`／`jp3-pitcher-02`／`jp3-pitcher-03`，野手C／IF／OF各`jp3-catcher-01`／`jp3-infielder-01`／`jp3-outfielder-01`；使用同一first-row策略、相同初始選擇與明確dev基準，不拿不同策略互相比對。預期相同路線的完整S／RNG／收入一致，不要求均衡與首列策略得到相同生涯。

實測前後完全一致的最終值（操作不含終止觀察，rng為內部signed值）：

- yakyo-test-001／P：542操作，RNG652，rng1707538286，2058退休，所得173,930,000円。
- jp3-pitcher-02／P：534操作，RNG879，rng-1998445019，2058退休，所得107,530,000円。
- jp3-pitcher-03／P：534操作，RNG899，rng289910492，2058退休，所得145,800,000円。
- jp3-catcher-01／C：387操作，RNG422，rng-1504784666，2046退休，所得75,990,000円。
- jp3-infielder-01／IF：543操作，RNG549，rng-1298627341，2058退休，所得105,350,000円。
- jp3-outfielder-01／OF：565操作，RNG533，rng991797058，2058退休，所得105,150,000円。

未驗證：全Seed、所有新人巡位／球團及跨機能組合、這兩條路線的實機裝置。沒有重新跑其他全倉E2E或4000生涯平衡調查。未逐字執行無旗標整合命令，而是以quick與careers-only分開覆蓋其矩陣與六生涯分支。

**遊戲Bug結論：本次覆蓋範圍未發現真正遊戲收入／入團Bug。兩個殘留失敗均為測試策略／舊收入預期與fixture設計問題。** 沒有需要使用者批准的遊戲本體或政策修改。版本維持1.11.4，正式履歷不記測試修正。

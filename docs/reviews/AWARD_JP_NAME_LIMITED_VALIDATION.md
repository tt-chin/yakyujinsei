# 日文獎項名稱漏判：限定技術驗證

2026-10-14。VALIDATION_ONLY / ANALYSIS_ONLY；兩項Bug未修復，產品實作未授權。

## 1. 基準、範圍與分類

Repository tt-chin/yakyujinsei；branch dev；HEAD `7220ad82002801d3dea5fedae80d0fb3d7a0433f`；VERSION 1.12.0；Windows／Node v24.15.0。
原game.js SHA256：`aceb42d48b5431e3c1ea0cb999a816c0d27dcdd89dc4094b8cf67c91857869e6`。未fetch/pull/切換/回退；沿本地最新dev與現行未提交狀態，只讀檢查原生程式。
依[AGENTS](../../AGENTS.md)、[CURRENT_SPEC](../../CURRENT_SPEC.md)、[D2 §14.1/14.2/14.11](../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#legacy-award-name-blockers)，保留未提交設計/工具與其他成果。CURRENT_SPEC沒有完整逐賞phoenix/降格白名單，本報告對照使用者指示及舊中文對應語義，不把設計提案變成正式規格。

- VERIFIED_STATIC：原賞producer、中文regex、活動覆寫委派、下游只讀調查。
- VERIFIED_RUNTIME：本次Node VM內執行原生awards、active movement及native handleDemotion。
- REPRODUCED_BUG：合成fixture實際產生指定日文賞後觀察到復活漏判，或受控movement實際进入降格handler；**不是自然Seed/UI全生涯重現**。
- UNVERIFIED：自然受害路線、接受降格後合同/付款、PC/手機UI、獎項修復後RNG/狀態。
- BLOCKED：本輪0；未執行的禁止範圍是NOT_RUN，不冒稱BLOCKED或PASS。

## 2. 隔離工具與實際命令

使用[隔離驗證脚本](award-jp-name-validation/validate.mjs)，[完整原始結果](award-jp-name-validation/results.json)保存每案fixture/初始S/終態S、期望現行、政策狀態、實际結果、observer、cards/choices、原生R值與次數、終態rngState、呼叫證據。

```text
node --check docs/reviews/award-jp-name-validation/validate.mjs
node docs/reviews/award-jp-name-validation/validate.mjs
git diff --check
```

語法exit0；最終限定驗證exit0，0.236秒。32個runtime案例：**政策結果PASS25／FAIL7／BLOCKED0**；另「現行行為觀測斷言」32 PASS/0 FAIL，只證明fixture可靠重現當前結果，不把Bug轉為遊戲PASS。每案JSON status依政策結果，harnessStatus另列。

首次執行exit1：首位打者fixture沿用投手baseStat.BB=50，原producer也產生最高出塁率，違反「同年只有目標賞」。是fixture設計錯誤，不是新產品Bug；修正此fixture為H126/AB350/PA350/BB0，保持原生期望與產品程式，再重跑32案全部符合觀測。未修改獎項機率或產品狀態。

### 2.1 不是獨立regex替身

沿用既有[retirement-hof-test-support](../../tests/retirement-hof-test-support.mjs):productionFunction抽取完整原函式、Node vm，以及[trait-policy測試](../../tests/trait-policy.test.mjs):93–117的原生awards綁定模式；不跑其舊版全套比較，也不改測試框架。

原source只讀。函式awards/movement/removeTrait/isSP/traitCard/handleDemotion與FNV、**實際日本版seedInit/R覆寫**及chance原式從檔案載入。VM中只插入observer記錄phoenix gate與movement局部變數，不改if、閾值、公式、honors或勝率；R包装器記錄nativeR回傳值，不替换R結果或強制chance。active movement整行原覆寫也實際執行，再呼叫捕捉的legacy原函式，非只檢查文字存在。

隔離替身：card/board/choose收集顯示，不建立瀏覽器DOM；ovr輸入固定52或60，未執行真實能力計算；migrate/accrueForeign/contractStage與crossOffers/advance是本輪邊界替身。保留原生service accrual和movement條件、goldclothEligible與awardTraitUnlocks、原生createContract/contractNeedsRenewal；不執行移籍市场/實際付款。這是原生函式限定runtime，不是整遊戲啟動或E2E。

fixture用原生R挑選短測試seed（只看首兩個R，最多512個key的安全上限，無生涯採樣），結果固定：
quiet=award-jp-2；All-Star=award-jp-0；性能降格=award-jp-1。
每案實際S.seed與seedInit一致；沒有變更主R算法或正式Seed政策。

## 3. A：復活實測

共同S：2035 NPB1、age30、glass=true、phoenix=false、pool=7、其他相關traits未取得。使用完整awards('NPB',st)，每案assert實際honors恰一筆 `2035 NPB<target>`。R第一槽AS失敗（除了專用All-Star），對應賞按現行資格/機率正常產生；無MVP或其他賞掩蓋漏判。

原生判定game.js:1355–1474 → awardTraitUnlocks → phoenix gate:1467 → removeTrait:263–265。所有A01～07都經過phoenix gate；本效果處理自身無R，表中R是原awards的AS/目標賞抽選。

|ID|producer輸入要點／唯一日文獎項|政策期望|實際glass／phoenix／pool|R次數|結果|
|---|---|---|---|---:|---|
|A01|P d15/IP120/ERA4，年間MVP|原效果：false/true/15|false/true/15|2|PASS|
|A02|P累計yr1、d10/IP0/G0，新人王|原效果：false/true/15|false/true/15|2|PASS|
|A03|P IP150/ERA2.2/SO100，最優秀投手賞|對應最佳投手：false/true/15|true/false/7|2|FAIL / REPRODUCED_BUG|
|A04|IF PA350/AB350/H126/BB0/avg.36，首位打者|對應打擊王：false/true/15|true/false/7|2|FAIL / REPRODUCED_BUG|
|A05|IF PA300/AB300/H60/HR38， 本塁打王|對應全壘打王：false/true/15|true/false/7|2|FAIL / REPRODUCED_BUG|
|A06|IF PA200/DEF6，ゴールデングラブ賞|原本不在復活集合：不新增|true/false/7|2|PASS|
|A07|P d15/IP0/G0，オールスターゲーム|非復活資格：不新增|true/false/7|1|PASS|
|A08|當年MVP＋新人王，兩次原awards；初始glass true/phoenix false|＋8只一次|第一次15、第二次15；glass false/phoenix true|2合計|PASS|
|A09|當年MVP，已phoenix=true且glass=true；兩次原awards|不再次解除或＋8|第一次7、第二次7；glass true/phoenix true|2合計|PASS|

各項完整baseStat與patch值見JSON，不從此合成st反推自然能力/傷病。A02/A07的0IP/0G刻意隔離原賞資格分支，不能稱自然正常球季；本輪沿原函式可接受輸入驗證名稱與gate，不在此修G資格。

結論：BUG-AWARD-PHOENIX-JP-01 **REPRODUCED_BUG／未修復**。中文big regex忽略三个對應日文producer字串。正常MVP/新人王、負面資格及一次性行為已VERIFIED_RUNTIME（限定fixture）。不推論所有得主都少8點，因同季MVP/新人王仍可能觸發。

## 4. B：降格保護與實際分支

全部B01～07 honors取自A producer的實際輸出，不從新P02/P08設計名替代。S pos=P、roleSP、age30、NPB1、2035年、teamYears0、npbYears0、lastD=-8、seasonFactor1；是名稱效果隔離fixture，打者榮譽名稱移入P state只驗wonAward的角色無關判斷，**不代表投手自然取得打者賞**。

原生合同createContract：fixture:2035，2035～2037三年，每年10,000,000円，未付，remainingYears3。ovr邊界替身52≥現役最低30、<NPB1 min53；不會退休先行、能力降格條件成立。
bad：lastSt IP100/ER65/H150/BB50/SV0/HLD0，ERA5.85/WHIP2.0，goodReal=false。
good：只ER30，ERA2.70使goodReal=true；其他条件相同。
past：2034年同一獎，bad成績。當年以2035判斷。

實際路徑：原active overlay movement game.js:3132 → migrate/service更新 → **LEGACY.movement:1556** → wonAward:1603 / goodReal:1605–1618 → if:1619 / 降格條件1620–1627 → **native handleDemotion:1674** → traitCard yips＋原長期契約降格選項（NPB2）。不是spy代替降格函式。

「進handler」證明實際进入降格分支與原選項生成；玩家尚未接受選項，所以lv仍NPB1，**不聲稱已降至NPB2、已支付或已完成年度**。相關choice回調/契約政策不在本輪範圍。

|ID|目標獎／模式|wonAward|goodReal|進原生降格handler|R次數|結果|
|---|---|---|---|---|---:|---|
|B01-bad|年間MVP／bad|true|false|false|0|PASS|
|B01-good|年間MVP／good|true|true|false|0|PASS|
|B01-past|年間MVP／past|false|false|true|0|PASS|
|B02-bad|新人王／bad|true|false|false|0|PASS|
|B02-good|新人王／good|true|true|false|0|PASS|
|B02-past|新人王／past|false|false|true|0|PASS|
|B03-bad|最優秀投手賞／bad|false|false|true|0|FAIL / REPRODUCED_BUG|
|B03-good|最優秀投手賞／good|false|true|false|0|PASS|
|B03-past|最優秀投手賞／past|false|false|true|0|PASS|
|B04-bad|首位打者／bad|false|false|true|0|FAIL / REPRODUCED_BUG|
|B04-good|首位打者／good|false|true|false|0|PASS|
|B04-past|首位打者／past|false|false|true|0|PASS|
|B05-bad|本塁打王／bad|true|false|false|0|PASS|
|B05-good|本塁打王／good|true|true|false|0|PASS|
|B05-past|本塁打王／past|false|false|true|0|PASS|
|B06-bad|ゴールデングラブ賞／bad|false|false|true|0|FAIL / REPRODUCED_BUG|
|B06-good|ゴールデングラブ賞／good|false|true|false|0|PASS|
|B06-past|ゴールデングラブ賞／past|false|false|true|0|PASS|
|B07-bad|オールスターゲーム／bad|false|false|true|0|PASS|
|B07-good|オールスターゲーム／good|false|true|false|0|PASS|
|B07-past|オールスターゲーム／past|false|false|true|0|PASS|
|B08-55chance|最優秀投手賞／55chance|false|false|true|1|FAIL / REPRODUCED_BUG|
|B09-protected|年間MVP／protected|true|false|false|0|PASS|

B03/04/06-bad實際漏保護；同樣獎名的good案例仍wonAward=false，但由goodReal=true保護，PASS只指實成績護欄有效，**不表示名稱漏判消失**。MVP/新人王/本塁打王bad仍wonAward=true。All-Star bad沒有保護是正確；7個past案例全wonAward=false，未把過去年度誤判成本年度。

B08/B09額外分離第二個性能分支：ovr60≥min53，lastD-8≤-6、goodReal=false；nativeR(award-jp-1)命中55%。
最優秀投手漏判→chance55耗1R→原生handler；MVP命中→不跑chance55→0R。證明未来修正可能因短路改變下游R分支，不能以「直接名稱判定無R」宣稱生涯R消耗必不變。

結論：BUG-AWARD-DEMOTION-JP-01 **REPRODUCED_BUG／未修復**，活动呼叫路径已VERIFIED_RUNTIME。不是未使用legacy，也不是所有漏賞必然降格。

## 5. C：下游只讀調查（VERIFIED_STATIC，不新增測試）

- [trait-policy](../src/engine/trait-policy.js):55–75：打者三冠用首位打者/本塁打王/打点王及同年同league完整名稱；MVP年齡特性讀年間MVP。沒有同一中文phoenix regex；不從此推全部特性已驗收。新pitcherTC仍DEFERRED。
- [salary-evaluation](../src/engine/salary-evaluation-policy.js):56–66：最優秀投手/MVP/沢村.75，首位打者/本塁打王等.35，Glove/新人.25。上述現行名稱有對應，非同一中文漏判。
- [salary-promotion](../src/engine/salary-promotion-policy.js):110–122：舊最優秀投手/MVP/沢村＋2，首位打者/本塁打王/Glove等＋1、cap3。新人王未列此fallback，不把不同賞級/不同適用集合擅判為Bug。
- [hall-of-fame](../src/engine/hall-of-fame-policy.js):15–68：日文舊最優秀投手460/aceN、MVP420、首位/本塁等160/king、Glove300、All-Star70(P)/40。可讀辨識，未重跑殿堂/自然評價。
- [incentive](../src/engine/incentive-policy.js):10–34：日文old best pitcher、MVP、首位/本塁/Glove分別對應existing FULL code；All-Star非FULL。新人王沒有獨立FULL code，不能因phoenix有資格就要求相同付款待遇。只讀，不模擬付款。
- 其他**未來接入風險**：新P03「最多三振奪取投手賞」不含現舊「最多奪三振」regex；新P04「勝率第一位投手賞」無現TITLE匹配；HOF endsWith舊部門名稱可能漏新P02/P05/P06完整名，HOF沢村尚無分支。這些皆未實作D2名稱的adapter設計風險，**不是現行新增獎項Bug**。沢村目前無producer、不能稱現已得而漏判。
- B的wonAward以startsWith(year)而非完整「year＋space」是靜態寬鬆匹配風險；本輪合法producer/year案例通過，不擴測非法文字或未知歷史資料。中文明星賽排除與日文All-Star不同，但現日文All-Star本身不命中王/MVP，測試未獲保護，不稱當前誤保護已重現。

## 6. 副作用與證據界線

原生awards消耗表列主R，寫honors/AS、可能MVP age traits、removeTrait/removed/pool；這些只在VM隔離S，結果全部保存。A08/09仍消耗AS槽，效果一次不等awards全流程重入冪等。
movement原生寫服務年資、npbYears/teamYears；原handler可取得yips與生成選項，不走付款；合成repeat不推正常UI可重入。
已證明修名字能影響phoenix/glass/配點及當年降格chance短路，可能繼而改傷病/路線/年薪/RNG；**尚未實作，因此沒有修正前後完整S/R比較**。不回滾R、不改原生公式，不將policy FAIL改成PASS。

## 7. 最小修正建議與優先度（尚未實作）

**必須修正／P1**：兩個Bug各自精確映射日文名稱、分開效果集合，保留原觸發條件及當年度期限，建立修前會fail的原生fixture後才實作。復活只補最佳投手→最優秀投手賞、打擊王→首位打者、全壘打王→本塁打王；Gold Glove/All-Star不新增復活。降格最小範圍補這次確認漏判的最優秀投手賞／首位打者／ゴールデングラブ賞，本塁打王/新人王/MVP原有效維持；不能一次泛化全部部門或新P02。
**建議修正**：精確年度＋league＋完整獎名解析，明示排除All-Star、兼容歷史原文，核對不同聯盟同義名稱与受害路線。若替換原substring會改其他舊行为，需使用者界定白名單，不從註解猜權限。
**可以延後**：自然頂尖採樣、全聯盟部門制度、P01～P08產品、HP、全域ID、廣泛歷史解析；不以本輪授權開始。

已成立合約/保障年俸/年限不改；不補過去8點或重寫honors。旧最優秀投手不映P02/P08；P08特殊保護虽設計已批准，產品接入仍未授權。

## 8. D2 BLOCKER與未驗證範圍

兩項D2 BLOCKER **仍成立且從STATIC提升為限定原生runtime重現**；沒有修復。Journal/receipt/hash精度其他技術BLOCKER保持。
未驗證：自然Seed原操作history、遊戲整頁DOM/瀏覽器、接受降格/轉隊/合同及實付、不同league完整流程、fixture故障恢復、產品修後因果S/R、Quick/Full/CI/Preview/大量生涯。這些NOT_RUN／UNVERIFIED，不因環境失敗冒稱PASS。無須新授權來完成本報告；實際修Bug另需批准。

## 9. 修改範圍與保全

本輪只新增：
- 本報告；
- award-jp-name-validation/validate.mjs（隔離檢查，不登錄正式Runner）；
- award-jp-name-validation/results.json（可重現原始結果）。

最終檢查：原689個既有檔案hash全部相同（含所有未提交設計/研究工具/資料、正式JS/HTML/CSS、VERSION/config、CURRENT_SPEC、AGENTS、BACKLOG與CHANGELOG），無既存檔案消失，新增路徑僅上述三檔。12個報告本地連結/anchor、32個唯一案例ID及7個政策FAIL計數檢查PASS；git diff --check exit0（新增未追蹤檔不在tracked diff，另外檢查引用與語法）。前後HEAD/dev/main不變；git status --short保留原清單，只多本報告與award-jp-name-validation/。沒有Commit/Push/Merge/Deploy。此任務完成即停止，等待使用者批准最小修正。


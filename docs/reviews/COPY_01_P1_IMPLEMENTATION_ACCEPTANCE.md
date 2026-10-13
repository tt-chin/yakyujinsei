# COPY-01-P1 五項文案修正驗收

## 後續1.12.0合併提交授權（2026-10-13）

使用者批准1.11.9→1.12.0 MINOR，並將COPY-001～005與C級高校實作一併提交至dev。五項文案本身未再改動；下文1.11.9版本、原測試件數及未提交敘述是當輪歷史紀錄，不改寫為1.12.0結果。版本正本docs/src/config.js與CHANGELOG同步更新，現行規格補記五項文案。提交前新版Quick及出生快照／特性顯示專項結果見[C級驗收後續補記](TRAIT_SMALLSCHOOL_C_IMPLEMENTATION_ACCEPTANCE.md)。不將COPY-01整體待辦結案，未改COPY-006以後、92事件、D2或main。

2026-10-13；分支dev；比較基準 `0fd13c7532fd03da136c72ef64e9890858cfb81e`；VERSION維持1.11.9（tasks/select.md明示例外）。任務A實作，任務B未開始。檢驗L1：只改說明字串與能力頁新增說明段落，不變更状态、事件、公式或RNG。既有未追蹤研究、tasks與D2全部保留。

## 五項結果

1. COPY-001 IMPLEMENTED：ui/ability-view.js renderAbility，`現在値 / 潜在能力上限`→`現在値 / 潜在能力`。補充`潜在能力を超えると、成長に必要なポイントが増えます。能力値の上限は80です。`。用既有ui-ability-guide class新增一個說明p；沒有CSS或資料模型修改。這是唯一新增DOM段落。
2. COPY-002 IMPLEMENTED：game.js phasePre配點說明移除`スカウト評価：60/70/75`／`70/75`，改成`能力値が高くなるほど、成長に必要なポイントが増えます。潜在能力を超える場合は、さらにポイントが必要です。能力値の上限は80です。`。採簡潔說明，避免錯把能力成本稱球探評價；未變更公式。
3. COPY-003 IMPLEMENTED：同說明的`サイコロをタップして適用`→`能力の項目を選んで、サイコロを割り当てます。`。「選んで」兼容滑鼠、觸控與鍵盤，不暗示只能觸控。
4. COPY-004 IMPLEMENTED：endGame圖像catch的`画像を作成できませんでした。ページを再読み込みして、もう一度お試しください。`→`画像を作成できませんでした。「もう一度作成する」から再試行してください。`。現有按鈕是`⚠️ もう一度作成する`，finally原本會重新enable；catch不清除S。沒有改shareImage、下載或listener。
5. COPY-005 IMPLEMENTED：loveCaughtDating選項副說明`関係を保存することに成功｜失敗＝再び能力を失って別れる`→`成功＝関係を続ける｜失敗＝能力がさらに低下して別れる`。保留主按鈕原文（COPY-006不在範圍）。成功40%保留戀愛狀態；失敗再隨機一能力−2、partner=null、dyrs=0，依exes選single/divorced。進此選項前已因發現外遇增加caught／cheatYr、隨機能力−3，第二次可有scum全能力−5；新文只描述選項後果、不取消前置代價。副說明不作trait ID或條件key，callback保持。

## 公式與操作核對

game.js abCost/addAb：投手cur<55成本1、55–59為2、60–65為4、66以上7；野手cur<64成本1、64–71為2、72以上3。cur>=pot時投手×4、野手×3，下一點可超pot；缺pot沿用既有62 fallback。扣值是1:1、最低1；正向硬上限80，carry保存未用足點數，超80剩餘值走既有lastOverflow。沒有特性直接改abCost；特性可能改訓練取得點數而非此成本分段。

addAbStat為另一事件／私生活獎勵路徑：正向到pot後轉pendStat，不等同配點可超pot；此次文案專指配點及一般能力表，未修改該路徑。不能把配點說明當所有事件獎勵公式。

allocUI事件綁在.abrow能力列；骰子div沒有allocate handler。onclick、Enter與Space呼叫同allocate；花一顆骰子或一pool點，render與board後保留焦點。舊說明不作識別key；新說明沒有更動handler、aria或session。正向固定人生比較會讀同原生UI，不靠文案正規化排除S。

## 測試證據與限制

暫存分析工具`test-results/copy-p1-check.mjs`受Git忽略，未修改既有測試／manifest。使用既有stage6-browser harness回應注入讀取hook，產品磁碟source不注入fixture。

- 專項首次：12 PASS／2 FAIL。六案三寬度×P/IF，能力頁與配點文字、1280 Enter、320/390觸控、dice消耗與R0通過；成本邊界一案含44組；PNG錯誤→重試三案；P/IF完整生涯兩案。失敗兩案是測試嘗試覆寫const chance的工具錯誤，不是產品callback錯誤。保存原FAIL。
- 工具修正後只重跑love兩案：2 PASS／0 FAIL；強制成功／失敗是明示fixture，透過暫存R替身決定分支，不宣稱自然機率驗證。產品RNG未改。首次FAIL不改記PASS。
- 固定Seed `yakyo-test-001`：P530操作／1023R；IF364操作／635R。每操作完整S與所有R值，以及最後完整S／RNG，對未改造基準原game.js完全一致。不排除traits、potSum0或version；本次VERSION不變。選擇原生UI通常投球、低能力列優先的固定策略，不是一般玩家表現估計。
- PNG三案注入shareImage throw，保留退休完整S與R值；還原後按原重試按鈕產生data PNG且S/R不變。Console三次COPY_PNG_FAULT為明示注入，其餘pageerror／JS-CSS404未記錄。完整頁截圖中固定退休選項覆在中段屬既有布局，未修改。
- 1280／320／390保存能力頁、配點及PNG錯誤截圖；人工查看320 P能力、320 IF配點、390 PNG錯誤，文字可讀且換行。六個配點畫面未見頁面級橫向溢出；其他截圖未全逐張人工比像素。未測實機、Space動態操作或觸控assistive tech。
- 首次Quick sandbox：44 PASS／3 FAIL（bug-act、draft-income、kbo loopback ERR_NETWORK_ACCESS_DENIED），環境FAIL保留於copy-01-p1-quick；不是遊戲FAIL，也不稱PASS。
- 完整授權Quick重跑：47 PASS／0 FAIL／0 SKIP／0 BLOCKED，240.298秒、exit0，包含syntax、能力配點、事件／契約文案、固定seed及三個原環境失敗的瀏覽器入口。此為本機Quick，不稱CI或Full PASS；Chrome關閉profile timeout warning為已disconnect清理警告，未隱藏。
- git diff --check：無錯誤；語法驗證見Quick syntax；沒有Full／CI／Preview／部署，NOT_RUN。

證據位於Git忽略的test-results/copy-01-p1-focused（含summary、每案、P/IF old/current全部狀態）、copy-01-p1-love-recheck、copy-01-p1-quick及copy-01-p1-quick-authorized。暫存／忽略資料未提交，若需持久封存需另指定，不把它當remote公開證據。

## 檔案與保護界線

產品修改僅docs/src/engine/game.js（三個字串）與docs/src/ui/ability-view.js（標籤＋補充說明段落）；加本驗收文件。未修改COPY-006之後、92事件資料、成本公式、傷病、戀愛結果、特性取得、獎項、契約、年度結算、RNG、Seed、VERSION、CHANGELOG、BACKLOG或D2。現行機制不變，CURRENT_SPEC不需新增平衡規格。沒有commit/push/merge，main不變。COPY-01全量待辦仍未完成；B未執行。

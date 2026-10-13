# COPY-01 日文文案與棒球術語審查

2026-10-13；dev HEAD `444144a57fb3ad23ac2bd1b3e9c87ba0809ea9bb`；VERSION 1.11.9。未提交研究文件、docs/designs/、tasks/及SAMPLE_GAP_DIAGNOSIS.md均保留。只新增本文件及術語表；未變更產品、92事件資料、D2設計或BACKLOG狀態。

## 基準、範圍與完成程度

已確認AGENTS、CURRENT_SPEC現行文字政策／存檔／UI、BACKLOG COPY-01；D1設計用來識別獎項命名依賴，D2檔案未修改。歷史設計不當現行字串正本。CURRENT_SPEC的main版本標頭有歷史落差，本次使用dev Git與config。

來源掃描涵蓋index.html及docs/src全部41個JS，合計42檔；偵測1298個含日文的原始碼行（包含註解、資料及一行多字串）。**1298不是玩家字串數，不是已完整人工審查數**。jp-data.js一行含大量Master，不能以行數代表覆蓋。逐筆審查26個文案／片段；完整AST字串清單、每個事件外層及每個Master名稱的逐項審查尚未完成，因此本文件是第一階段調查，COPY-01全面驗收未完成。

盤點分域：A首頁／選手建立／初始高校；B訓練、配點、強度、傷病、錯誤；C選秀、契約、FA、移籍、引退；D成績與現行獎项；E事件外層、國際招集／辭退／成績；F設定、特性、年度記錄、分享、PNG。沒有全面重翻92事件。任何中文註解並非玩家文案。

## 動態畫面證據

外部既有Playwright、Chrome headless；本機唯讀HTTP；固定seed COPY-01、預設投手、不修改S/RNG。每個寬度1280/320/390均由首頁開顯示設定、關閉後正常開始、點選選手能力／キャリア通算、開分享dialog。共5類畫面×3寬度=15畫面觀測，5類REACHABLE_CONFIRMED。沒有完成新生涯，也沒有fixture注入。

15次document.scrollWidth均未超viewport；這只證明頁面級橫向溢出未見，不能排除局部裁切。320選手畫面截圖已人工查看：姓名右側ポジション標籤有省略、長球團名緊密；能力與コンディション可讀、重要標籤換行。其餘截圖已保存但未逐張人工像素審查。首頁與分享非本機平台原生分享驗收；不代表iOS Safari或Android Chrome實機。

截圖暫存：%TEMP%/copy01-{1280,320,390}-{start,preferences,player,career,share}.png。暫存可能清理，正式實作前應重新保存證據。最初sandbox阻擋loopback，批准後重試成功。未執行Console/404完整驗收、Quick/Full/CI，不填PASS。

未確認的域：職業契約／長球團選項、全年訓練及傷病、FA／戰力外、年度成績表、全部特性取得失去、國際結果、退休／PNG、警告／錯誤。這是8個後續驗證群組，不是精確可到達畫面總數。不能以已有測試檔的存在作REACHABLE_CONFIRMED。

## 分級與可到達性統計

26筆：P0 3、P1 2、P2 10、P3 11。P3包括KEEP與D2待審，不全部是需修正問題。P0是已知語義風險提案，除能力頁外尚未動態重現，不等於實際路線驗收。

REACHABLE_CONFIRMED 10；STATIC_REFERENCED 14；LEGACY_OR_UNREACHABLE 2；UNKNOWN 0（本清單；未盤點剩餘文案不因此變成已知）。每筆分類僅指原文字所在畫面，非所有分支。

優先10筆：COPY-001、002、003、004、005、006、008、013、014、015。排序是行為／理解風險優先，未要求一定改足十筆。002需完整核查而非直接套提案。

COPY-002與003完整原說明為：`トレーニング成果を割り振る（サイコロをタップして適用｜スカウト評価：`＋投手`60/70/75`／野手`70/75`＋` 以上は成長効率が低下）`。保留拼接片段而非虛構單一字串。

## 逐筆清單

### COPY-001 — P0／PROPOSAL

- 畫面：能力・コンディション
- 來源：`docs/src/ui/ability-view.js:17`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：現在値 / 潜在能力上限
- 建議日文：現在値 / 潜在能力（超過すると成長コスト増）
- 修改理由：addAb允許超pot，只增加成本。「上限」誤導玩家配點。
- 影響範圍：能力列表／成長說明
- 驗證方式：合法配點超pot並確認說明與硬上限80有區別。
- 狀態：PROPOSAL

### COPY-002 — P0／NEEDS_REVIEW

- 畫面：能力配分說明
- 來源：`docs/src/engine/game.js:818`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：スカウト評価：
- 建議日文：成長コストは能力値55・60・66以上で増加（投手）／64・72以上で増加（野手）
- 修改理由：現行顯示投手60/70/75、野手70/75；abCost實際門檻不同。此列原文完整片段見下文，修正須核查特性／pot。
- 影響範圍：訓練與季末配點
- 驗證方式：比較abCost與addAb，投手／野手邊界及超pot。
- 狀態：NEEDS_REVIEW

### COPY-003 — P1／PROPOSAL

- 畫面：能力配分
- 來源：`docs/src/engine/game.js:818`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：サイコロをタップして適用
- 建議日文：能力の行をタップして、サイコロを割り当てる
- 修改理由：allocate綁在能力列；說明指向骰子可能讓玩家無法操作。
- 影響範圍：共用dice配分
- 驗證方式：確認骰子非操作控制、能力列鍵盤／觸控可操作。
- 狀態：PROPOSAL

### COPY-004 — P0／PROPOSAL

- 畫面：退休PNG建立錯誤
- 來源：`docs/src/engine/game.js:2327`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：画像を作成できませんでした。ページを再読み込みして、もう一度お試しください。
- 建議日文：画像を作成できませんでした。「もう一度作成する」から再試行してください。
- 修改理由：目前沒有途中存檔；重載會失去退休結果。現行另提供重試按鈕。
- 影響範圍：退休分享
- 驗證方式：讓圖像建立丟出錯誤，確認保留S且能重試；fixture非自然到達。
- 狀態：PROPOSAL

### COPY-005 — P1／PROPOSAL

- 畫面：私生活選項
- 來源：`docs/src/engine/game.js:1035`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：関係を保存することに成功｜失敗＝再び能力を失って別れる
- 建議日文：成功＝関係を続ける｜失敗＝能力がさらに低下して別れる
- 修改理由：保存する是資料語感，成功／失敗平行格式較清楚。
- 影響範圍：戀愛選項
- 驗證方式：核對callback每分支能力與關係狀態。
- 狀態：PROPOSAL

### COPY-006 — P2／PROPOSAL

- 畫面：私生活選項
- 來源：`docs/src/engine/game.js:1035`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：謝罪してもう一度チャンスを彼女に懇願する
- 建議日文：謝罪し、もう一度チャンスをくれるよう彼女に頼む
- 修改理由：語序及チャンスを懇願する搭配僵硬；不是文法必錯。
- 影響範圍：戀愛選項
- 驗證方式：自然路線或固定fixture檢查換行。
- 狀態：PROPOSAL

### COPY-007 — P2／PROPOSAL

- 畫面：首頁Seed
- 來源：`docs/index.html:41`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：ワールドシード
- 建議日文：シード
- 修改理由：World概念沒有额外UI作用；可保留個人風格，優先统一Seed表記。
- 影響範圍：首頁／分享
- 驗證方式：使用同一用語，不更動URL key seed。
- 狀態：PROPOSAL

### COPY-008 — P2／PROPOSAL

- 畫面：分享對話框
- 來源：`docs/src/ui/seed-share.js:23`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：現在のSeed
- 建議日文：現在のシード
- 修改理由：與首頁日文シード混用。
- 影響範圍：複製按鈕／成功失敗訊息
- 驗證方式：所有Seed顯示標籤同步，replayURL不變。
- 狀態：PROPOSAL

### COPY-009 — P2／PROPOSAL

- 畫面：分享對話框按鈕
- 來源：`docs/src/ui/seed-share.js:23`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：Seedをコピー
- 建議日文：シードをコピー
- 修改理由：同COPY-008。
- 影響範圍：複製結果
- 驗證方式：成功／手動失敗fixture文字一致。
- 狀態：PROPOSAL

### COPY-010 — P2／PROPOSAL

- 畫面：分享說明
- 來源：`docs/src/ui/seed-share.js:23`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：同じSeedでも選択やバージョンが異なると結果は変わります。
- 建議日文：同じシードでも、選択やバージョンが異なると結果は変わります。
- 修改理由：語句自然，只統一表記。
- 影響範圍：首頁／退休分享
- 驗證方式：跨版本提示保持，不承諾人生完全重播。
- 狀態：PROPOSAL

### COPY-011 — P2／NEEDS_REVIEW

- 畫面：記錄頁
- 來源：`docs/src/ui/record-view.js:18`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：階級別通算成績
- 建議日文：カテゴリー別通算成績
- 修改理由：階級像階級制度；リーグ・レベル別更精確但較長。需確認分組包含高中／二軍。
- 影響範圍：記錄／PNG
- 驗證方式：不同league及level labels同時檢查。
- 狀態：NEEDS_REVIEW

### COPY-012 — P2／NEEDS_REVIEW

- 畫面：記錄頁
- 來源：`docs/src/ui/record-view.js:14`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：プレー年数
- 建議日文：プレーした年数
- 修改理由：現役年数可能包含全休；確認model.seasons定義後才採標準。
- 影響範圍：退休總結
- 驗證方式：以全休年對照計數，不能純改現役年数。
- 狀態：NEEDS_REVIEW

### COPY-013 — P2／PROPOSAL

- 畫面：年俸看板
- 來源：`docs/index.html:55`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：年俸（万）
- 建議日文：年俸（万円）
- 修改理由：補貨幣單位；aria已有万円。runtime board也寫万。
- 影響範圍：game.js:2862與PNG
- 驗證方式：三寬度看板換行與金額字寬。
- 狀態：PROPOSAL

### COPY-014 — P2／NEEDS_REVIEW

- 畫面：能力衰退卡
- 來源：`docs/src/engine/game.js:772`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：体が元に戻ることはありません。
- 建議日文：年齢による衰えは進みますが、追加トレーニングで能力を補えます。
- 修改理由：addAb能恢復值；絕對不能回復是敘事或規則說明需區分。
- 影響範圍：年度衰退
- 驗證方式：確認訓練恢復能力後不與結果矛盾。
- 狀態：NEEDS_REVIEW

### COPY-015 — P2／NEEDS_REVIEW

- 畫面：PNG操作提示
- 來源：`docs/src/engine/game.js:2626`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：ボタンが使えない場合は,画像を長押しして保存できます
- 建議日文：ボタンが使えない場合は、画像を長押しして保存してください。
- 修改理由：日文逗號；長按功能依平台，不宜無條件保證保存。
- 影響範圍：退休PNG
- 驗證方式：iOS/Android實機後決定是否寫端末によって。
- 狀態：NEEDS_REVIEW

### COPY-016 — P3／KEEP

- 畫面：首次開始
- 來源：`docs/index.html:40`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：野球人生を始める ▸ 高校1年春
- 建議日文：野球人生を始める ▸ 高校1年春
- 修改理由：簡潔、行為清楚。
- 影響範圍：首頁
- 驗證方式：三寬度。
- 狀態：KEEP

### COPY-017 — P3／KEEP

- 畫面：投球強度
- 來源：`docs/src/engine/game.js:825`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：全力投球
- 建議日文：全力投球
- 修改理由：自然日文，與effort對應；顯示字串目前亦為邏輯key不能任意改。
- 影響範圍：強度／TJ
- 驗證方式：既有1.11.9修正證據，不在本次重跑。
- 狀態：KEEP

### COPY-018 — P3／KEEP

- 畫面：FA選項
- 來源：`docs/src/engine/game.js:1822`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：FA宣言して市場の評価を確かめる
- 建議日文：FA宣言して市場の評価を確かめる
- 修改理由：新聞／玩家語感清楚，風險另有副說明。
- 影響範圍：契約
- 驗證方式：需要FA合法路線，不用人工注入冒稱自然。
- 狀態：KEEP

### COPY-019 — P3／KEEP

- 畫面：國際賽辭退
- 來源：`docs/src/engine/game.js:2992`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：コンディションを優先して辞退
- 建議日文：コンディションを優先して辞退
- 修改理由：自然簡潔，具體理由。
- 影響範圍：國際邀請
- 驗證方式：actual processIntlPhase路線檢查。
- 狀態：KEEP

### COPY-020 — P3／NEEDS_REVIEW

- 畫面：現行獎項
- 來源：`docs/src/engine/game.js:1385`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：最優秀投手賞
- 建議日文：最優秀投手賞
- 修改理由：FUTURE_D2_DEPENDENCY：ERA+IP抽選；不得提前改成防御率賞／沢村賞。
- 影響範圍：honors／薪資／殿堂／特性／PNG
- 驗證方式：D2批准後統一識別key與display label。
- 狀態：NEEDS_REVIEW

### COPY-021 — P3／NEEDS_REVIEW

- 畫面：現行獎項
- 來源：`docs/src/engine/game.js:1399`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：最優秀中継ぎ
- 建議日文：最優秀中継ぎ
- 修改理由：NPB正式有投手賞，但遊戲HLD非正式HP；官方全名可能暗示不存在規則。FUTURE_D2_DEPENDENCY。
- 影響範圍：honors／薪資／殿堂
- 驗證方式：D2決定語義與HP。
- 狀態：NEEDS_REVIEW

### COPY-022 — P3／KEEP

- 畫面：現行獎項
- 來源：`docs/src/engine/game.js:1404`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：最多奪三振
- 建議日文：最多奪三振
- 修改理由：自然簡稱，不是NPB正式全名；跨四聯盟不強套NPB。
- 影響範圍：honors／PNG
- 驗證方式：官方來源與遊戲自訂抽選分開。
- 狀態：KEEP

### COPY-023 — P3／KEEP

- 畫面：舊高校進路
- 來源：`docs/src/engine/game.js:1949`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：LEGACY_OR_UNREACHABLE
- 現行日文：大学に通う（延長研修）
- 建議日文：不修改（舊定義）
- 修改理由：pathChoiceHS於2876後被覆寫，舊怪日文不能當現行P0。
- 影響範圍：舊pathChoiceHS
- 驗證方式：確認賦值順序及LEGACY持有引用是否可再入。
- 狀態：KEEP

### COPY-024 — P3／KEEP

- 畫面：舊大學引退
- 來源：`docs/src/engine/game.js:1973`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：LEGACY_OR_UNREACHABLE
- 現行日文：彼は大学のドラフトに失敗し、裁判所に別れを告げることを決意した。
- 建議日文：不修改（舊定義）
- 修改理由：裁判所誤譯但pathChoiceU4於2898被覆寫；不能稱現行玩家錯誤。
- 影響範圍：舊進路
- 驗證方式：覆寫與caller核對。
- 狀態：KEEP

### COPY-025 — P3／KEEP

- 畫面：表示設定
- 來源：`docs/src/ui/preferences.js:44`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：REACHABLE_CONFIRMED
- 現行日文：初期設定に戻す
- 建議日文：初期設定に戻す
- 修改理由：對顯示設定復原清楚，非遊戲重置。
- 影響範圍：設定
- 驗證方式：打開dialog讀取、確認作用範圍。
- 狀態：KEEP

### COPY-026 — P3／KEEP

- 畫面：錯誤操作
- 來源：`docs/src/engine/game.js:711`（來源搜尋錨點以原文為準，line需實作前再核對）
- 可到達性：STATIC_REFERENCED
- 現行日文：もう一度選択せず、この画面をスクリーンショットして報告してください。
- 建議日文：もう一度選択せず、この画面をスクリーンショットして報告してください。
- 修改理由：避免重複交易；與PNG可重試情境不同。
- 影響範圍：交易錯誤
- 驗證方式：choice-action失敗fixture，確保不鼓勵重複確定。
- 狀態：KEEP

## 術語、手機及D2

Seed表記、年俸單位、能力ポイント／育成点、階級／リーグ・レベル需要按情境统一，不碰內部識別。ミート、スタミナ、制球、変化球、FA、戦力外、殿堂入り與年度通算可保留。新聞／球迷簡稱不必都改官方全名。詳見術語表。

手機待驗：320大字模式、長球團名、契約選項多行、表格局部scroll、特性說明長段、退休画像中文字寬。未量測卡片高度或所有按鈕裁切；只把上述列RISK，不列已發生P1裁切。不同theme與font/density也未全組合驗證。

FUTURE_D2_DEPENDENCY：沢村賞、新防御率獎、最多勝利與勝率賞是未實作內容；無現行字串時不可製造COPY修改目標。最優秀投手賞不能直接換官方ERA獎名；最優秀中継ぎ不得藉改名偷換HLD成HP。honors文字被薪資／殿堂／特性匹配，正式修正文案需先分離顯示與識別或驗證所有consumer；只是改字也可能影響遊戲。

## 後續條件與自我審查

可先提交COPY-001～015給使用者審查候選；尚不具備宣告全量COPY-01完成條件。下一階段先建立非註解AST literals／HTML text／attribute／template片段清單，每項連到實際render與override關係，另保存92事件外層和內容的範圍標記。特殊錯誤／退休／獎項可使用fixture，但單獨標fixture，禁止當自然到達。其他自然畫面應按既有固定合法路線補齊並保留三寬度截圖。

純日文語感提案須由日本母語棒球迷校閱；社群稱號未取得可驗來源者UNVERIFIED，不以主觀偏好列P0。沒有改遊戲、RNG、Seed算法、main、VERSION、CHANGELOG、BACKLOG checkbox、D2檔案；未commit/push/merge/deploy。只讀瀏覽過程正常遊戲會自然消耗R，沒有修改其算法或挑選結果。


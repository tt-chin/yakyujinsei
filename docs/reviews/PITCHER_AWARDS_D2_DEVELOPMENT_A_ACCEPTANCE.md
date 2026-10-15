# D2 開發 A 驗收報告

2026-10-15 最新結果：**開發 A 在本次已授權範圍 PASS；A0／G2／G3／G4 各自 PASS。** 最終 Quick 56 PASS／0 FAIL；第二輪完整 Full 75 PASS／0 FAIL，全部重新實際執行、沒有重用。G3 僅為批准的產品 Journal／Receipt 與新賞 Decision fixture 限定驗收，不代表 G6／G7 真實新獎 producer 整合。使用者仍需審查本報告；開發 B、G9、提交及發布沒有授權。最新版證據及 A→B 基準規則見文末。以下早期停止點、未實作與 NOT_RUN 敘述全部保留為歷史快照，不能當作目前狀態。

## 歷史快照：A0／G2 初始基準與授權

- Branch dev；HEAD `d2ea8a3bcf38044928aab86ae56289839c45a0e4`；VERSION 1.12.0（docs/src/config.js）。沒有 fetch／pull／切換／提交／推送／部署。
- 使用者批准 A0＋G2～G4，允許必要 B1 隔離調整；真正 Safari 由使用者協助，WebKit 不代替 Safari。未授權 B／G9／版本更新。
- 開始時已有修改 D2 主設計、未追蹤 G1-B2／G1-B 審查、Adapter／測試及 tasks。保留，沒有修改正式 D2、Decision Log、AGENTS、CURRENT_SPEC、BACKLOG、CHANGELOG、VERSION 或發布設定。
- 開始 712 個檔案 hash 見 [before-hashes](development-a/before-hashes.json)。既有檔案僅 Adapter 與其測試為本批必要修改，其他既存檔案保持；沒有刪除既存工作。
- game.js 完全未修改：SHA256 `4b7d893b44d4cf943ff7c017c8bbca73474e5b5ae9bd8513455a80ae18315629`。不提前接入 Consumer 或新 producer。

## A0：唯讀契約與 Consumer fixture

NATIVE_FUNCTION_FIXTURE／STATIC；不是 Consumer 接線 Runtime E2E。

- `buildAwardIdentityEntries()` 保持每條來源原文、索引及順序，支援逐條事實 context，不從目前球隊反推歷史。
- `buildAwardIdentityView()` 加唯讀 sourceIndices；交錯 alias 的 semantic 分組不得冒充原 honors 順序。
- 明確 year／league context 衝突、null／非法 context、未知名稱、scope 委派；中文候選 alias 仍不接受 caller trusted boolean。
- 相同 ID 不統一待遇：原生薪資／fallback／獎金／HOF 函式前後結果相同；例如ホームラン王身分可識別，但市場加成與本塁打王仍不同，沒有「修正」成一致。
- 原 Consumer、traits、phoenix／降格集合及 historical honors 完全不改；Decision 仍 fail-closed，G3 可信接口尚未實作。
- 最新模組 134 PASS；Consumer fixture 19 PASS；G1-A 原生 fixture 88 PASS（0 FAIL），包含原六名稱修正與不同效果集合。這些不能相加當作 241 條自然生涯或全 F-ID PASS。

### B1 隔離保全

- 修改任何產品前，原 B1 測試實際重跑 134 PASS、exit0。
- [原模組](development-a/b1-snapshot/award-identity-policy.js) SHA256 `363c39186bbea9de4c9ce89ead3adfba8eeeb635292120d95c640b30e7cc02bf`。
- [原測試](development-a/b1-snapshot/award-identity-policy.test.mjs) SHA256 `5b9c2a8a35808d92fa11a30e8fbed68e43420310826e28835b5bffe24175ffdd`，保留原隔離斷言與完整程式，不改其 golden。
- 當前測試核對歷史產品 hash 與接受的 G1-A Git 來源（僅容許 LF／CRLF），核對快照完整性；另嚴格禁止現行 Consumer 呼叫唯讀 Adapter，原 Consumer 檔案逐檔相等。
- game.js 預留 A 正式授權的 Journal／checkpoint 變更邊界，不代表已修改或已取得 A 回歸 PASS。G3／G4 若開工仍須自己的完整狀態／RNG 回歸。
- 原 B1 本地日誌／產物未覆寫。快照測試保留原相對 import，作歷史來源證據，不宣稱能在快照資料夾直接執行；實際原測試是在原位置、修改前執行。

## G2：純 deterministic RNG

產品模組：[award-rng-policy.js](../src/engine/award-rng-policy.js)。SHA256 `2c7be9b4251772371652a61db720ad2739edc8dcf3de776f7f703208b7e8575b`。

公開 API：canonicalAwardBytes、awardHash32、independentAwardDraw、awardProbabilityHit、decideIndependentAward。六欄 UTF-8／4-byte BE framing、FNV1a32／正式 avalanche、unsignedHash/2^32；固定規則、binary64、嚴格小於、無 epsilon／取整。初始化 seed 由呼叫方提供並嚴格一致，不重做正規化。

此模組沒有引擎／S／主 R 依賴，沒有新增 P01／P04／P08 eligibility 或 probability producer；0／100 新 draw 不計 hash，legacy chance100 未觸碰。沒有產品接線。

- Node24.15.0：52 PASS／0 FAIL。
- Playwright Chromium151.0.7922.34：52 PASS／0 FAIL，Console／pageerror／HTTP 資源錯誤0。
- Playwright WebKit26.5：52 PASS／0 FAIL，錯誤0；**不是 Safari PASS**。
- 真正 iPhone Safari：NOT_RUN／BLOCKED，等待使用者結果。**G2 全 Gate 未 PASS。**
- GV01～13 期望值從正式 D2 複製，未由新實作生成。逐 bytes／hash／u、重算／逆序、非法 seed／year／league／award／rule／domain、1024byte bound、surrogate、相等、0／100及 uint32 最大值共用同一測試套件。
- 瀏覽器下載為既有 Playwright1.62.1 所需測試執行檔；沒有新增 npm 依賴、修改 Runner／manifest／CI。

### Safari 工具與發布隔離

[實機說明](development-a/SAFARI_G2_INSTRUCTIONS.md)。工具放在 [tools/development-a](../../tools/development-a/g2-browser.mjs)，在既有 docs/ 發布根之外。沒有部署、公開驗收服務或變更發布 workflow；本地伺服器只有驗收工具與產品 RNG 的必要路徑。

Node／瀏覽器共用驗證函式，直接 import 同一產品 RNG，不是另一份算法。LAN HTTP 可能無 SubtleCrypto，明示來源 hash 未取得，須與本地受驗源核對。收到 JSON、iOS／Safari版本及截图前不補寫 Safari PASS。

## 固定 Seed 修正前 Runtime 基線

四條真實 DOM 自然生涯、各自相同來源重播，4 PASS／0 FAIL；原始 S、逐操作及主 RNG trace 保存於 `test-results/development-a-before-careers-unrestricted/`。可攜索引、各 state／RNG／原始檔 hash 見 [本批證據](development-a/a0-g2-evidence.json)。

- Windows／Node24.15.0／Chrome155.0.8059.39，PC1280／320／390，未改 S／能力／成績／操作策略。
- 這是 G3／G4 修改前基線，不是 G3／G4 修後比較 PASS。G2 未接線、game.js 不變，不把它冒充完整修後生涯驗收。
- 初次沙箱 loopback ERR_NETWORK_ACCESS_DENIED 造成四案 harness FAIL，保存原目錄 `test-results/development-a-before-careers/`；取得權限後在新目錄重跑通過，未覆蓋失敗證據。
- 重跑後 Console／JS-CSS錯誤0；Chrome 已斷線後 profile 清理逾時 warning 留存，不當成產品錯誤或隱藏。

## 命令、日誌與未執行範圍

```text
node tests/award-identity-policy.test.mjs
node tests/award-consumer-contract.test.mjs
node docs/reviews/g1-a-validation/fixtures.mjs --mode=after --extended=true --history=true --output=test-results/development-a-a0-native.json
node tests/award-rng-policy.test.mjs
node tools/development-a/g2-browser.mjs --playwright=<external> --output=test-results/development-a-g2-browser-final
node docs/reviews/g1-a-validation/careers.mjs --mode=before --baseline=d2ea8a3bcf38044928aab86ae56289839c45a0e4 --output=test-results/development-a-before-careers-unrestricted --playwright=<external> --browser=chrome
node scripts/test.mjs quick --only=award-identity-policy.test,award-consumer-contract.test,award-rng-policy.test --output=test-results/development-a-targeted-a0-g2-final
```

最後 Runner 限定三入口：3 PASS／0 FAIL／0 SKIP／0 BLOCKED、3.444秒、exit0；**不是整套 Quick PASS**。沒有執行整套 Quick／Full／CI／Preview／產品 G3／G4 故障驗收，不將 prior G1-A Full／Quick PASS 借用成本批。

## 歷史停止點與待確認（Safari 結果提供前）

原指令要求每一部分通過專用 Gate 後才繼續下一部分，而真正 Safari 是 G2 正式必要條件。最新批准允許先跑 Node／Chromium／WebKit並由使用者協助Safari，沒有把 Safari 從正式 Gate 移除。本批停在 G2 待實機證據，不默認 G2 PASS 或跳入 G3。

若使用者希望在 Safari 回報前暫先做 G3／G4，須明確調整這個執行時序；不得因此降低最後 G2 或 A 放行標準。沒有新的獎項政策提案。

- 開發 A 是否 PASS：**否，BLOCKED／未完成**。
- G2 是否 PASS：**部分平台 PASS；全 Gate BLOCKED**。
- G3／G4 是否 PASS：**NOT_RUN／未實作**。
- 開發 B 技術條件：**尚不具備**。不開始 B／G9，不改版本，不 Commit／Push／Merge／部署。

## 最新：真正 iPhone Safari 實機結果核對

使用者提供 [原始 JSON](development-a/safari-real/g2-browser-result.json)、[裝置資訊截圖](development-a/safari-real/device-info.png)及[驗收畫面](development-a/safari-real/g2-result.jpg)，原檔完整保留，不修改其中日期、userAgent、URL、來源 hash 或測試數字。

- 證據分類：MANUAL_UI／使用者提供的實機產品模組驗收，不是代理在手機上自行執行，也不是 Playwright WebKit。
- 裝置截圖：iPhone 16、iOS 26.6.2。JSON userAgent 原文含 `CPU iPhone OS 18_7` 與 `Version/26.6.1`；分開記錄，不據此改寫裝置截圖或推測相容性原因。
- 執行時間：JSON `2026-10-14T10:25:38.093Z`；本機私人網路 URL 指向 tools/development-a/g2-safari.html，未部署正式站。
- 核對：52 個案例／52 個唯一 ID／52 PASS／0 FAIL；包含完整 GV01～GV13。完整案例清單及狀態與目前同產品模組的 Node 驗證輸出精確相同，不只看畫面總數。
- GV 案例的既有驗證函式實際斷言 bytes／hash32／u，不重新產生 golden；JSON 是案例結果，沒有逐向量原始回傳數值，不宣稱原 JSON 保存所有中間值。
- Node、Chromium、Playwright WebKit 52 案各自的 PASS 仍保持獨立；Safari 實機 52 PASS 補足先前平台缺口。**G2 PASS**，但只涵蓋純 RNG 技術基礎，不代表新 producer、Journal／Receipt 或主引擎整合通過。

### 受驗來源與證據限制

LAN HTTP 無 SubtleCrypto，因此實機 JSON 三個 sourceHashes 都是 `UNAVAILABLE_NON_SECURE_CONTEXT`。此欄位未改成 SHA256，**手機端來源 hash 驗證為 UNVERIFIED**，不是暗中補寫 PASS。

本地同 URL 工具的產品與驗證檔案，均與先前 Chromium／WebKit 結果保存的 SHA256 完全相等：

- 產品 RNG：`2c7be9b4251772371652a61db720ad2739edc8dcf3de776f7f703208b7e8575b`。
- 共用驗證函式：`5eb147a2ae107534381962183da9be53c67cb989d9485b307b73fc67482a970b`。
- 正式向量副本：`66de2e85218860fa6bfaceddfc7825958150ca3dc3851c7384fad146e698fe79`。

因此以使用者實機執行、同私人網路工具、完整案例核對與本地主機來源未變的組合證據記錄實機 PASS；不宣稱擁有手機下載源碼的獨立 SHA256 證明。這不是放寬 RNG 比較、golden 或任何正式資格。

後續可依原開發 A 授權進入 G3／G4；不必重新授權新獎項，也不得開始開發 B。G3／G4 的專用驗收、確定程式 Quick／Full、修後固定 Seed／S／RNG 比較均未執行，開發 A 不能結案。此次補記沒有修改產品、測試、版本、Gate 或發布設定，未提交、推送或部署。

## 最新：G3 限定接入、首次 FAIL 與停止點

使用者明確批准新增 S.awardDecisions，並只在舊／新歷史相容比較分離該欄位，要求獨立嚴格驗證；其他 S、選擇、契約、收入、honors、traits、pool 與主 RNG 仍須完整相等。同版比較不排除新欄位。本節取代前文 G3 完全未實作的現行解讀，不抹除先前歷史。

### 實際修改

- [award-transaction-policy.js](../src/engine/award-transaction-policy.js)：同 S／年／聯盟私有 WeakMap、原槽 preallocation、RECORDED 結果防重、AMBIGUOUS_RNG 停止、多欄位 before／after Receipt、partial write 恢復及 CONFLICT、完成 Decision 歷史和私有來源證據。
- [game.js](../src/engine/game.js)：原獎項條件／機率公式原樣保存；用窄欄位投影準備原生結果，不 clone／rollback 全部 S 或 RNG。舊 producer 名稱、既有效果資格集合、原抽選次數與順序不改。
- effects 與 draw／render 分離。原槽 draw100 仍抽主 R；未資格 slots 標 SKIPPED。結果 Receipt 完成後才追加必要 S.awardDecisions，render 失敗只續尚未成功的卡片。
- Decision 保存 schema／完整 identity key、year／league／level／role、原槽、原 stats、p／u／RNG 前後、awarded、DECIDED 狀態及來源；完成交易由私有紀錄證明，不接受 caller trusted boolean。
- 新增 [交易模組測試](../../tests/award-transaction-policy.test.mjs)、[原生獎項測試](../../tests/award-journal-native.test.mjs)。未修改正式設計、Runner、manifest 或 CI；未接新獎 producer 或 B Consumer。

### 失敗與直接修正（未擴大到 G4）

1. `award-journal-native.test` 初次 FAIL，ReferenceError `Cannot access 'S' before initialization`：準備投影內的局部 S 造成 TDZ。這是本次新增產品接入錯誤，不是既存 Bug，也不歸因 RNG。改由 wrapper 明確傳入 realState，只有此直接原因的最小修正。
2. 修正後同入口再次 FAIL：兩個 VM 的 RNG 記錄雖然值完全相同，deepStrictEqual 因物件原型不同而失敗。這是本次新增 fixture 資料擷取問題，不是產品 RNG 不同；在觀察者擷取當下 structuredClone 單筆 RNG 記錄至主測試 realm，保留 before／after／value 全欄位及嚴格比較。不修改期待值或 golden。
3. 修正後同入口 19 PASS，模組 11 PASS；關聯的5個 Runner 入口 5 PASS／0 FAIL，exit0。沒有將修前兩個 FAIL 改寫為 PASS。

### 證據與結果

- 11 個產品交易模組 fixture：原槽 chance100 一次抽選／重入0追加、RECORDED後 fault、未記錄 gap 停止、primitive／集合 partial write、pool100 衝突、年度／S 分離、paid／未知舊資料、偽造 Decision 拒絕，以及完成歷史被修改／重排／刪除時停止。
- 19 個原生 game.js 函式 fixture：16 組四聯盟 × SP／MR／CL／IF；與完整 SHA `d2ea8a3bcf38044928aab86ae56289839c45a0e4` 的原函式比較。舊／新只分離新 awardDecisions，所有其他 S、主 R 值／狀態／順序及卡片內容精確相等；同新版重入的完整 S（包含新欄位）也精確相等。
- 額外三案：原生年度賞 render fault 恢復、原槽 RECORDED 後 fault 重入不重抽、並行 pool 修改後拒絕提交。render 為 stub，不是瀏覽器 UI 操作；高成績／角色矩陣為合成 fixture，不宣稱自然生涯或平衡分布。
- 技術欄位逐項驗證包含 schema、ID／完整 key 去重、year／league／level／role、原始 draw 順序、metrics、p／u／awarded、RNG 前後、完成來源與 clone／caller boolean 拒絕。同版／重入不排除新欄位，沒有全域忽略。

可重現命令與日誌：

```text
node scripts/test.mjs quick --only=award-journal-native.test --output=test-results/development-a-g3-native-before-fix
# 0 PASS／1 FAIL，exit1；產品 TDZ
node scripts/test.mjs quick --only=award-journal-native.test --output=test-results/development-a-g3-native-after-fix
# 0 PASS／1 FAIL，exit1；新 fixture realm 原型
node scripts/test.mjs quick --only=award-journal-native.test --output=test-results/development-a-g3-native-realm-fix
# 1 PASS／0 FAIL，exit0；入口內19案
node scripts/test.mjs quick --only=award-identity-policy.test,award-consumer-contract.test,award-rng-policy.test,award-transaction-policy.test,award-journal-native.test --output=test-results/development-a-g3-targeted-final
# 5 PASS／0 FAIL／0 BLOCKED／0 SKIP，3.662秒，exit0
```

每個目錄保留原 summary.json／入口 log 與 source fingerprint；未覆寫失敗日誌。此為限定入口執行，**不是完整 Quick／Full PASS**。Node24.15.0／Windows；本段没有 browser／CI／Preview 執行。

補強後的嚴格歷史驗證另實際執行 `node scripts/test.mjs quick --only=award-journal-native.test,award-transaction-policy.test --output=test-results/development-a-g3-strict-history-final`：2入口 PASS／0 FAIL、1.007秒、exit0。維持19／11案，追加精確原槽 ID 順序、rule／schema／reasonCodes／sources 及獨立 Buffer 長度框定的完整 decisionKey 檢查，沒有排除其他狀態。這是新斷言後的限定重跑，不冒充整套 Quick 或新一輪5入口執行。前後 summary／日誌hash／來源指紋可攜副本見 [G3限定證據](development-a/g3-limited-evidence.json)。

### 尚未完成／未驗證

- G3 Gate 未完成：完整 F-B01～12 適用矩陣、付款／薪資評價 Receipt、Adapter 可信完成 Decision 接口、真實瀏覽器 fault／選項與原生年度流程仍需補足；本模組品牌函式不是完整 Adapter 接線。
- G4 NOT_RUN／未實作：proSeason 的已累計成績安全續行、phaseEnd 已付後 render／配分／choice／movement／advance／handoff checkpoint 仍是原流程。不得從本次 awards 直接重入成功推定 proSeason 重試不重算成績。
- 尚缺跨年度過期 callback／舊交易 token 的端到端拒絕證據；WeakMap 分離不同年度／S，不等於所有舊 token 寫入 API 都已有當前年度檢查。本輪沒有將此項列 PASS，後續 G3／G4 必須補足。
- 全部歷史 E2E 的限定欄位相容調整尚未完成；本次只在新原生比較 fixture 分離該欄位並獨立驗證，未修改既有 Full golden 或借用旧 PASS。
- 整套 Quick／Full、修後固定 Seed 生涯／逐步 S／選擇／RNG，以及付款／合約下游 Runtime 回歸全部 NOT_RUN。
- 沒有任意 host crash／OOM／Proxy／getter／R到record gap／跨 reload／未知 phasePre 恢復承諾。

依使用者「非預期 FAIL 時停止擴大修改」規則，本輪保存證據、修復直接原因並限定重跑後停止，沒有進入 G4。**開發 A 未完成；G3 未整體 PASS；G4 NOT_RUN；不具備 B 放行條件。** 不改 VERSION／CHANGELOG，不 Commit／Push／Merge／部署，等待使用者審查此停止點。

## 最新整合：G3／G4 限定產品實作及最終驗收

本節記錄使用者審查早期兩次 FAIL 後明確批准的續作，以及後續允許直接修正本授權內原因的驗收。風險 L3／R3：年度結算、交易狀態、付款與主 RNG 呼叫邊界；因此實際執行相關測試、完整 Quick／Full、固定 Seed／完整 S／RNG 比較。沒有開始開發 B 或新增 P01～P08 producer。

### 確定程式與修改範圍

- dev HEAD：`d2ea8a3bcf38044928aab86ae56289839c45a0e4`；VERSION 1.12.0。受驗內容包含未提交修改，不能只用 HEAD 代表本輪程式。
- `game.js` SHA256：`c3d413dd6fc0b4a899c38b960d4ad9dfc4d1736fb412de850781f544daa5f709`。
- `award-transaction-policy.js` SHA256：`985b216a123ca60dd5c335027fe3fb6b06fd01593efc9e25269703cc460b2e87`。
- `season-payment-policy.js` SHA256：`31e02589caf539c97e80c973fdd4aa6fad6104b469a91029e35fe71482b98f9b`。
- `award-identity-policy.js` SHA256：`6a6105e7015f9834a49cb1acf14e2d118a62801c4be4d47b2d5c1b10e0b6e2f7`。
- G2 RNG SHA256 保持 `2c7be9b4251772371652a61db720ad2739edc8dcf3de776f7f703208b7e8575b`；使用者接受 Safari 52 PASS／0 FAIL 與本地來源核對，不無理由重新跑實機。
- 未修改原生薪資、promotion、incentive、HOF、trait consumer 政策檔案；Adapter 沒有被現行 consumer 接線。沒有新賞、更名或歷史補發。
- `AGENTS.md`、`CURRENT_SPEC.md`、`BACKLOG.md`、`CHANGELOG.md`、config VERSION、Runner／manifest／CI，以及既存 D2／tasks 內容均與本任務開始 hash 一致。D2 的既存四行修改及未追蹤 tasks 保留，不屬本輪成果。

### G3 功能與可信完成判定

- 原槽 preallocation、資格短路、draw 順序、chance100 消耗一次主 R 均保留；RECORDED 後重試使用原結果。R→record 未知間隙標 AMBIGUOUS_RNG，禁止回滾或重抽。
- DECIDED 與 EFFECT_COMMITTED 分離；honors、All-Star 計數、既有打者三冠歷史及 traits 使用獨立 Receipt 家族，全部 prepare 後才 commit。原歷史最優秀投手賞仍為 LEGACY_BEST_PITCHER，不轉 P02／P08。
- Receipt 保存逐欄 before／after；有效 partial write 單次續完；合法並行狀態不一致標 CONFLICT，保留 pool100，不覆寫成15。
- `S.awardDecisions` 保存完整 key、原始次序、schema、year／league／level／role、metrics、p／u／R 前後與結果。跨年 append 保留原物件身分及私有完成證據；複製、偽造 trusted flag、修改／重排／移除拒絕。
- Adapter 可信接口只接受本 S 的實際完成 Journal 證據；序列化歷史副本不冒稱可信完成交易。舊 token 不可對新年／新 seed 寫入，舊已完成歷史仍可唯讀辨識。
- 付款準備使用既有 markSalaryPaid／applyIncentivePayment，窄欄位 Receipt 更新 ct、保障年表、base、incentive、累計收入及已付記錄。原薪資／契約公式、付款時間、保障年俸不變。
- 原生薪資評價 saveSalaryEvaluation 使用 Receipt；正常／兩個 write 邊界 fault／重入均只留一筆評價。

### G4 checkpoint 與實際續行

- proSeason 完成 native 成績、累計與年度 log 後保存續行 context；awards、evaluation、championship、TJ accrual、後續 pipeline 分離。相同年度重入不再 simSeason 或累加 log／通算。
- phaseEnd 分離 championship、付款、結果 card、WAIT_ALLOCATION、allocation、movement 及 WAIT_CHOICE。付款成功不提前結束恢復流程；仍能提供可點擊配分及下一步。
- DOM append 前／後 fault 均只出現一張已提交結果卡；無法辨識的 DOM 變化停止，不猜測副作用。
- choice 綁定 S／year／generation／接受狀態，拒絕過期 callback；配分沿用有效 session，不重擲骰或重複確認。
- movement 同 S／年只執行一次；已發表的 pending choice 可恢復。advance 保存 fromYear／targetYear，重入不增加 age／year／stageYr；startYear 部分失敗標 NEXT_YEAR_AMBIGUOUS，同舊與新年度入口都拒絕再次推年。
- 真實 browser DOM／listener、原生 simSeason、signed contract、實際 phaseEnd、allocation、留隊 choice 至下一年：1280／320／390px 共18案 PASS，Console／JS-CSS資源錯誤0。分類為 NATIVE_RUNTIME_CONTROLLED_FIXTURE／FAULT_INJECTION，不稱自然重現故障。
- F-A07：base10,000,000＋既有 HALF incentive350,000＝10,350,000；championship 主 R 恰1次。恢復後收入不變，2033年 schedule 仍未付。
- F-A06 補核六份保存的 Runtime JSON（三尺寸×append前／後）：LEGACY_BEST_PITCHER 實際 awarded=true、原 NPB最優秀投手賞 honor 恰一筆，恢復後 Decision 完整相同且主 R 前綴相同。六份額外完整 assert PASS；這是原 Runtime 快照再驗證，不冒充新跑六條自然生涯。

### F-B01～F-B12 適用證據界線

- F-B01／02：產品 slot capture 與原生四聯盟角色矩陣；第一次原槽一次 R、重入0追加。新 hash 端由G2驗證，不啟用新 producer。
- F-B03／04／05：DECIDED 前後、副作用前後、已記錄槽後 fault 與實際 native awards／render 恢復；未知 gap 停止。
- F-B06／10：三獎／MVP true、false、no slot 的完成 Decision fixture 搭配實際產品 Receipt，共享效果只一次。**不是 P07 真實 producer 或 MVP sources 整合 PASS**，G6／G7 必须另驗。
- F-B07／08：新年／不同 S／聯盟 key、舊證據保存、凍結 context 衝突、舊 token 拒絕；同 Seed 另以自然生涯驗證。
- F-B09：已付／可信結算歷史無私有 Journal 只讀；現行個人獎項歷史無 Journal UNKNOWN，不猜補抽。包括原 defense／battingTC producer 的精確名稱。
- F-B11：P08／MVP 完成 Decision fixture 的同生涯共用 phoenix Receipt、已 phoenix 無第二次＋8。**不是 P08 真實發獎或 Consumer 接線**；未擴大 G1-A 資格。
- F-B12：逐欄 write fault、history append fault、合法並行 pool 衝突；保存 before／after 與原 append offset，恢復後不重複。
- F-A04／06／07／F-YEAR：上述18個真實 Runtime 控制案例；未知 nextPre 部分執行停止而不是假綠。

### 實際測試與完整生涯

- 新增／補強模組：Consumer contract19、identity134、RNG52、transaction24、native game award20、payment14、salary evaluation3、historical comparison10，全通過。各數字為各入口內案例，不當作自然生涯數或獨立全產品覆蓋率。
- 最終四自然生涯：`test-results/development-a-verified-careers`，4 PASS／0 FAIL／errors0。同版重播完整 S（含 awardDecisions）嚴格相等。舊／新只獨立驗證後分離新增 awardDecisions，其他所有 S、選擇、honors、契約、收入、逐年度結果及全 R 值／前後狀態保持。
- yakyo-test-001／P／通常／1280px：520操作、825R；jp3-pitcher-02／P／省エネ／320px：304操作、606R；jp3-pitcher-03／P／全力／390px：335操作、671R；jp3-infielder-01／IF／balanced／1280px：422操作、637R。全部與修正前同策略基線精確一致。
- 原始四條逐步 trace 及同版重播觀察者未修改遊戲策略／S／主 R；只讀 observer。瀏覽器斷線後 profile 清理逾時 warning 保留，不隱藏，也不當成已執行案例 FAIL。
- 第一輪確定 Full：`test-results/development-a-verified-full`，74 PASS／1 FAIL、3195.247秒、exit1。唯一FAIL npb-return-e2e 的 fixture 改寫同一 S／2032年，觸發有效 checkpoint，分類 TEST_FIXTURE_STATE_REUSE。
- NPB 限定修正：只以原欄位描述建立新的 S 實例，保留相同 fixture 欄位／原生函式／契約、年俸、收入、RNG與UI嚴格斷言，不清除產品私有 checkpoint。`development-a-npb-fixture-isolation-retest`：1入口 PASS、28.232秒、exit0。
- 最終新 Quick：`test-results/development-a-baseline-final-quick`，56 PASS／0 FAIL／0 SKIP／0 BLOCKED、234.068秒、exit0、executed56／reused0。
- 最終新 Full：`test-results/development-a-baseline-final-full`，**75 PASS／0 FAIL／0 SKIP／0 BLOCKED、3536.369秒、exit0、executed75／reused0**。sourceFingerprint `ba495eb24751c3319aec386d0ecc529199340e81a08987d70da3e15944089c95`。第一輪 Full 或限定重測沒有代替此結果。後續驗收報告、來源metadata與封存工具是純證據補強，沒有修改受驗產品／既有測試／Runner／CI，不重跑同程式Full以建立基準。
- 已完成第一輪 Full 關鍵跨功能結果：contract381、draft-income24、full-power36、international50、smallschool30、stage10 57；所有其餘入口實際結果見原 summary。這些是第一輪各自範圍，不冒稱第二輪已完成。

### 原始 FAIL 保留與修正歸因

- 早期產品 TDZ／VM realm FAIL 仍在前節及原目錄保留。
- `development-a-g4-quick-initial`：46 PASS／8 FAIL，原因為 observer 接線錨點、VM extraction、加入嚴格 technical history 後的舊 digest、fixture 缺少正式函式／globals；採實際原生接線／完整資料擷取調整，未更換 golden／基準或排除其他 S。
- `development-a-dh-projection-before-fix`：窄投影漏 dpos 導致 DH 多消耗2R，屬本輪中間產品回歸；補回原 dpos 後 exact native S／R PASS，不放寬成績或 R。
- `development-a-trait-label-projection-before-fix`：投影的新打者三冠特性顯示讀錯真 S，漏聯盟前綴；改用既有 traitLabel 與投影 S，卡片逐字比較 PASS。其後 VM 缺 teamNick 的獨立 fixture FAIL 亦保留。
- `development-a-journal-history-recovery`：history write 後 own pending Receipt 被當成其他未提交效果；僅修正本 receipt 續行判定，原 before／after、完成信任與衝突斷言保留。
- `development-a-history-names-before-fix`：舊年度 defense／battingTC 原始 producer 名稱未列入未知歷史拒絕；精確加入，不補發、不改待遇。
- Runtime 初次不合法年度契約 fixture、獨立案例未清空 DOM，以及 F-A07 自動選了 KBO 路線而有合法7m buyout 的 FAIL 全保留。修正 fixture 的 signed startYear、隔離 DOM、明示留隊操作路線，不把合法 buyout 或測試自身錯誤稱產品重複付款。
- `development-a-acceptance-full` 曾因受驗來源後續修正中止；INTERRUPTED／剩餘NOT_RUN，不列完整 Full PASS。沒有覆蓋任一歷史失敗目錄。

### 命令與環境

Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39；外部 Playwright 由參數指定，未新增 npm、Runner 或 CI 依賴。以下 `<external>` 須替換為本機外部模組位置；原 summary 保存實際完整 argv。

```text
node scripts/test.mjs quick --playwright=<external> --browser=chrome --output=test-results/development-a-baseline-final-quick
node scripts/test.mjs full --playwright=<external> --browser=chrome --output=test-results/development-a-baseline-final-full
node scripts/test.mjs full --only=npb-return-e2e --playwright=<external> --browser=chrome --output=test-results/development-a-npb-fixture-isolation-retest
node tools/development-a/runtime.mjs --playwright=<external> --browser=chrome --output=test-results/development-a-runtime-final-fixed-stay
node tools/development-a/careers.mjs --mode=after --baseline=d2ea8a3bcf38044928aab86ae56289839c45a0e4 --before-output=test-results/development-a-before-careers-unrestricted --playwright=<external> --browser=chrome --output=test-results/development-a-verified-careers
node tools/development-a/capture-transactions.mjs --output=test-results/development-a-transaction-snapshots-final/evidence.json
```

最後命令使用實際產品 policy，保存8個前置／partial／COMMITTED／重入快照：Journal、honors、glass／phoenix／pool、保障年表、收入／base／incentive與paid狀態；2組fixture PASS。此是受控離線fixture，MVP native draw明示stub，不稱自然生涯或完整瀏覽器主 RNG 驗收。

### A→B 正式比較基準與允許差異規則

使用者要求保存可直接重用的 A 修改前基準，不為 B 建立基準而再次跑 A Full。最終 Full 已 PASS，可指定為開發 B 的正式修改前比較基準；不等於使用者已 ACCEPTED 或授權 B。第一次 Full 的 FAIL 與其修正後必要重跑，是修正 fixture 的驗收，不是為建立封存而無理由重跑。

- 專用本地 append-only 位置：`test-results/development-a-baseline-20261015-c3d413dd/`。原資料與最終 Full 封存使用不同檔名，CreateNew／檔案存在即拒絕；完整 sha256 清單與逐來源 manifest 另存，不覆寫原 log／summary／trace。
- 初次 ZIP 遇到瀏覽器 profile 鎖定檔；`source-and-initial-evidence.zip` 分類 INCOMPLETE／不可作基準。另建 v2，明示僅排除暫存 Chrome profile／URL fetcher cache，不排除測試 JSON、log、screenshot、自然生涯或FAIL。
- source 包包括全部產品 src／styles／assets／index、現行測試與工具、正式規則文件、B1原快照、Safari原證據及第一輪 Full FAIL；正式 Full PASS 將另外封存。
- S／RNG／honors／契約／收入快照是可重播證據，不是途中存檔功能；私有 WeakMap 權限不能由 JSON 偽造，恢復測試須由保存的 fixture／工具重新建立有效交易。
- **B 的既有正常流程預設全欄嚴格相等**，主 R 的呼叫數／順序／值及前後state不得改；新獨立獎項抽選不得加入主 R。
- 只有 B 明確批准的 producer 更名、新賞、同年同聯盟三冠／MVP合併及各自已核准 consumer 待遇，可以出現有證據的預期差異。候選差異可能涉及 awardDecisions、honors、tripleCrownHistory、traits／removed／pool、薪資評價、incentive、HOF與後續自然分支；**不是整欄豁免或自動授權**。
- 每個預期差異必須對應正式 D2 rule／decisionKey、原始年／聯盟／層級、實際 producer→Decision→Receipt→consumer及一次效果證據；第一次分歧前仍全 S／選擇／R 嚴格一致。下游差異須可追溯到原批准效果，不容許泛稱「獎項變了」放行所有差異。
- 歷史 LEGACY_BEST_PITCHER、既有支付、保障契約與未知 honors 必須原樣保留；不得推測歷史聯盟、補发舊賞或重算已付款。G1-A已修復集合不得退化或因ID共用待遇而擴大。
- 尚未開始的 B 必須建立自己的逐項預期差異矩陣並執行完整 Quick／Full；A Full 只作比較證據，不取代 B Full。無法解釋的差異＝REGRESSION／停止；同版 B 重播仍完整比較，不全域忽略 awardDecisions 或其他新欄位。

### 限制與停止邊界

不支持主 R 消耗未記錄 gap、任意host crash／OOM、跨reload／持久保存、未知phasePre／TJ pipeline部分執行的自動恢復。遇到模糊狀態 fail-closed，不回滾已合法R或全面S。IND未知重入不擴大成全面交易保證。

新P01／P04／P08、P02改名、P07／MVP實際producer合併及完整consumer接線留在未授權開發B；G3 fixture PASS不替代G6／G7。CI／Preview：NOT_RUN（未授權提交／推送／部署）；VERSION、main及正式站不變。尚未支持的故障沒有因 Full PASS 改標為可恢復。

### 最終 Gate、基準使用與停止

- A0 PASS：唯讀 API／Consumer fixture、歷史順序與scope，B1原快照／hash／測試保留。
- G2 PASS：Node、Chromium、WebKit各52；使用者真實iPhone Safari52 PASS／0 FAIL、本地來源核對已接受。產品H1零主R、GV01～13不變；本輪沒有重跑Safari。
- G3 PASS（限定授權範圍）：原生Legacy Journal／可信完成接口／Receipt、payment／salary evaluation、F-B01～12適用故障及保守歷史處理。新P07／P08 Decision fixture只作Receipt安全證據；新hash／DERIVED producer、最終MVP sources與consumer完整整合由B的G6／G7另外驗收，不說成已實作。
- G4 PASS：三尺寸實際Runtime的F-A04／06／07／F-YEAR、配分／選項恢復至2033年、一次movement／advance、旧callback与token拒絕、未知handoff明確停止。
- 最後補強 Runtime：`test-results/development-a-baseline-runtime-portable`，18 PASS／0 FAIL／errors0。只在Node觀察者增加來源metadata，不改產品、策略、原斷言或既有產物；每案保存實際engineSHA256、served observerSHA256與全部55產品來源SHA256。另一次初版metadata重測保存於`development-a-baseline-runtime-final`；不相加冒稱36個獨立案例。
- 本次產生的工具：`capture-transactions.mjs`、`archive-manifest.mjs`、`freeze-baseline.mjs`、`verify-baseline.mjs`皆為測試證據用途、位於發布根外，不是Runner／CI或新執行入口。生成器只在實際所有必要結果成功時輸出完成manifest，任何既有輸出路徑即拒絕覆寫。
- 基準入口：本地`test-results/development-a-baseline-20261015-c3d413dd/BASELINE_MANIFEST.json`；逐來源與所有封存entry hashes見`entries-all.json`，獨立校驗清單`SHA256SUMS`，讀法及開發B限制見同資料夾`README.md`。保留完整產品來源、tracked diff、untracked來源、status、Full報告／summary／log／JSON／截圖、四條完整自然生涯、交易與Runtime快照，以及原始FAIL資料；大型壓縮包留在本地忽略目錄，不擅自上傳。
- 使用唯讀工具`node tools/development-a/verify-baseline.mjs --manifest=<基準路徑> --current-source`可在B開始前核對封存及目前產品來源；B已修改後不使用current-source旗標。解壓必須用新目錄，不覆寫工作樹或既有資料。
- 開發B直接使用封存的四個`*.career.json`（steps含before／after S及選擇、events含年度awards／movement、最終S含log、rng含全部值／前後state），不重新生成A資料、不再跑A Full來取得基準。B新trace以相同Seed／位置／既定策略比對原始A，按上節逐差異分類；不能直接套用A的舊版technical欄位projection。
- ReadOnly檔案屬性、CreateNew／wx與SHA驗證防止意外覆寫，不宣稱NTFS管理者或外部同步服務無法強制改檔；B開始前必須核對外部保存的manifest／SHA256SUMS雜湊。JSON不重建私有可信權限或途中存檔。
- 技術條件：本授權的A前置已滿足，可以提交B授權供審查；G1尚待的Consumer F-ID／API階段邊界、新producer與下游差異測試仍須在B補足。**開發B未授權；不自行開始B／G9。**
- 工作樹所有變更未提交；D2既存修改、tasks與先前G1報告完整保留。local main仍`4624753a5359acd6c63ab6957341376bd43c5c88`，HEAD與VERSION不變，未Commit／Push／Merge／Deploy或觸發CI。

# D2 開發 B（G5～G8）驗收記錄

目前狀態：**LOCAL_ACCEPTANCE_PASS / READY_FOR_USER_REVIEW**。G5／G6／G7／G8本地驗收PASS；Quick 61、Full 80入口與四條自然生涯完整私有Receipt補驗均PASS，使用者尚未接受本批。不將下方歷史停止／FAIL／執行中快照當成目前結果；最終結論與限制見文末。VERSION仍1.12.0，沒有G9、提交、推送或部署。

## 比較基準與保全

- 開始 HEAD：`efd4710c4c5c366ff3aba69c59180031c82ff18a`，branch dev。
- A 封存：`test-results/development-a-baseline-20261015-c3d413dd/`。
- 修改前執行封存 v2 `verify-baseline-v2.mjs --manifest=.../BASELINE_MANIFEST.json --current-source`：PASS，3 個有效 archive 與目前產品來源一致。這不是本批 Quick／Full PASS。
- A 的 manifest SHA256：`a08095f1d89d419762afd58f10c8e7b12edd5c07f1de91902f8563457f1181f1`；v2 工具 SHA256：`e4b166728d26d1f35c18f40d6bffc99cd3ac2e74bbe891a6212e0c49fd9145a0`。
- 既存 D2 四行修改、tasks、G1-B／B2 報告，以及其後出現的 `g1-a-validation/fixtures.mjs` 修改、`fixtures-double-wings.mjs`，均不是本批成果，不覆寫或混入。
- 修改後只校驗 A 封存，不使用 `--current-source`。不重建、覆寫或刪除 A 的原始 FAIL、Full、自然生涯或 golden。

## 使用者批准的 A→B 比較界線

1. 新 P01／P04／P08 的獨立抽選不消耗主 RNG。
2. 相同輸入狀態下，既有獎項的資格、順序、主 RNG 次數與結果維持；100% 的原槽仍消耗原一筆。
3. 首個批准的實際效果之前，既有 S、操作與主 RNG trace 嚴格一致。新增 Decision／Receipt 另行嚴格驗證，不全域忽略。
4. 預期差異必須以實際 `producer → Decision → Receipt → Consumer → 狀態 → 後續 RNG` 證據支持，並對應 D2 rule、年度、聯盟與層級。獎項出現不是其後任意差異的通行證。
5. 不能解釋的差異為 REGRESSION，停止擴大修改。
6. 固定策略、實際可用選項、實際選擇與第一分歧均保存。新效果改變選項時不強迫不存在的操作。
7. B 同版重播完整 S、Decision／Receipt、選擇與主 RNG 嚴格一致；不能用 A 歷史投影比較器代替。
8. 源碼命名更新與技術 metadata 的差異也須逐項標明，不自行刪除整個 honors、salary 或 awardDecisions 來比較。

## 首次停止時的 Gate 歷史快照（非目前結果）

- G5：BLOCKED，原因見下節；候選接線已撤回，不帶入既有遊戲。
- G6：整合 NOT_RUN；獨立數值準備模組 198 案 PASS，未接 producer／Journal／Receipt，不能當 G6 PASS。
- G7：NOT_RUN。
- G8：NOT_RUN。
- 本批 Quick／Full：NOT_RUN。

以上狀態隨實際證據更新；A 的 56／75 PASS 不轉記為 B 的執行結果。

## HISTORICAL：G5 首次停止點，後續已取得相容契約批准

### 實測來源與差異

不是自然生涯 Bug 重現。使用 frozen honors 與原生政策函式，將 A commit 的原模組以 data URL 隔離載入，對比候選接線。完整 7 組原始輸入、輸出、來源 hash、環境與命令保存於 [原生比較 JSON](development-b/g5-consumer-compatibility-before-stop.json)。此工具沒有使用主 RNG、沒有寫 S／honors，也沒有更改原始研究資料。

命令：`node tools/development-b/consumer-compatibility-probe.mjs --output=docs/reviews/development-b/g5-consumer-compatibility-before-stop.json`，exit 0；這代表證據工具成功，不代表候選行為通過。金額 fixture annualMax=700,000、payD=0、sampleStatus=FULL、year=2039。

- `2039 NPB年度MVP`：Adapter UNKNOWN；A 原生 incentive FULL／700,000，候選 NONE／0。市場及 HOF 原為 0，不能全域對應 MVP 而增加其他待遇。
- `2039 NPB守備王`：Adapter UNKNOWN；A 原生 incentive FULL／700,000（GOLD_GLOVE code），候選 NONE／0。其他評分原 0。
- `2039 NPB出塁王`：Adapter UNKNOWN；A 原生 incentive FULL／700,000（TITLE code），候選 NONE／0。其他評分原 0。
- `2039 NPB最多勝`：Adapter UNKNOWN；A 市場 +.35／incentive FULL／HOF 160、king1，候選各為 0／NONE／0。不可以為保留待遇就把它當成已實作新 P01 或三冠來源。
- `年間MVP`、`最優秀投手賞`、`ホームラン王` 三組對照的既有市場／incentive／HOF 結果保持；特別是ホームラン王只命中獎金，並未擴張市場與HOF待遇。

G1-B2 已靜態提醒部分名稱不在 Registry。本批補出上述**原生 Runtime 純函式數值證據**，不是宣稱新發現四個自然遊戲 Bug。也不能把四個差異自動歸類 EXPECTED_D2_CHANGE。

### 為何停止

正式 D2 AF08 要求 UNKNOWN 個人賞只讀、不猜新 ID／效果；本批 G5 同時要求保持各 Consumer 及歷史原有待遇。上述名稱在 Adapter 尚未具備可信個人獎項身分，但某些原生 Consumer 明確已有各自資格。直接只處理 RECOGNIZED 會縮限待遇；反之將名稱一律全域 alias 成正式 ID 會擴大待遇或將舊「最多勝」誤作新 P01。也不能偷偷回退模糊 regex 來猜身分。

因此在正式接線前，需要明確 Consumer-only 歷史相容契約，不在本批自行推定全域 alias 或改正式 D2。此為 **POLICY/COMPATIBILITY_CONTRACT_CONFLICT**；候選待遇縮限分類 **REGRESSION / NOT_ACCEPTED**，不是已接受變更。

建議待確認的最小方案：

1. 以原生程式實證建立**各 Consumer 分離的精確舊名稱白名單**，保留原待遇；不沿用任意 substring。
2. 該相容層不把 Consumer-only 名稱視為可信新 P-ID／Decision，不提供 P07 組成或新一次性效果來源；不改 Registry 全域身分及 UNKNOWN 判定。
3. 年度MVP／守備王／出塁王僅保留各自原 incentive code，不因此新增市場、HOF 或其他獎項效果；最多勝保留上列原各 Consumer 結果，但不等於新 P01 實得。
4. 原始 honors、已付收入與保障契約不改。真正未知名稱仍保留原文，不猜待遇。
5. 沒有聯盟的舊單元 fixture 另列：不能為了通過測試補造歷史聯盟；正常 producer fixture 可明確加入聯盟且維持原數值斷言，舊缺 context 另作 fail-closed 測試。是否採此 fixture 分離也須在契約中說明，不覆寫 golden。

以上為首次停止時的 PROPOSAL。使用者其後已批准精確 Consumer-only 相容契約；後續實作及驗收見本文末節，不改寫首次停止證據。

## 本輪限定測試、原 FAIL 與撤回

Windows／Node v24.15.0。原生比較及新單元不啟動瀏覽器，不能代替 Runtime E2E。

- `node tests/award-consumer-policy.test.mjs`：85 PASS／0 FAIL，Consumer 契約準備，不是接線驗收。
- `node tests/pitcher-award-policy.test.mjs`：198 PASS／0 FAIL，批准數值的純函式；包括三條曲線、四聯盟／角色、非法值與IP／B2邊界。手機案例只為 OFFLINE_ESTIMATE；不稱實得獎項。
- 初次候選接線 `node tests/salary-evaluation-policy.test.mjs`：exit1，原第34行 `0 !== 1.1`，輸入缺聯盟的 `2030 年間MVP`／`2030 本塁打王` 未獲 Adapter 識別。
- 同輪 `node tests/salary-promotion-policy.mjs`：exit1，原第83行「最優秀投手賞」條件 false，該 fixture 也是缺聯盟。
- 一度將上述 fixture 改為已知聯盟的 producer-shaped 輸入，保持原 1.1／1.5／1.05 與薪資斷言，限定兩入口重測 exit0。**這個局部 PASS 不能解決 Consumer-only 別名風險**；已連同候選改動撤回，現行原 fixture 保留。
- `node tests/incentive-policy.test.mjs`：候選接線時 exit0；不涵蓋上述 Consumer-only 名稱，不能據此宣稱無退化。
- `node tests/hall-of-fame-policy.mjs`：候選接線時 exit1，原第19行 `台湾プロ野球最多勝: 0 !== 160`。未修改 HOF 期待值。
- `node scripts/test.mjs list`：exit0，自動識別新 `.test.mjs`；未修改 Runner、manifest 或 CI 條件。
- Quick／Full／自然生涯／主R因果比較／PC與手機：NOT_RUN，G5 相容契約未解，未以 A 的PASS替代。

候選四個 Consumer 及兩個 fixture 的實際檔案保存於 [candidate 目錄](development-b/g5-candidate-before-stop/)，只作非使用中的失敗證據，不是遊戲載入來源。原始 FAIL 的命令／錯誤與撤回原因永久保留於本節，不重標為 PASS。

撤回僅限本批自行新增的接線／fixture 修改，未使用 checkout/reset/stash，也未動既存 D2、tasks、G1 fixture 變更。撤回後 v2 `--current-source` 再次 PASS：3 個 A 有效 archive 與全部55個原產品來源一致。新增準備模組均未被既有產品匯入。

撤回後四個原入口（salary-evaluation／salary-promotion／incentive／hall-of-fame）再執行均 exit0；這只證明撤回後原政策測試恢復，不是 G5 接線 PASS。候選可在不更換產品的情況下重現：`node tools/development-b/consumer-compatibility-probe.mjs --candidate-dir=docs/reviews/development-b/g5-candidate-before-stop --output=<新的不存在路徑>`。工具只在記憶體把快照的 helper import 指向同一未接線準備模組，不修改快照；after hash 仍核對原快照 bytes。

## 首次停止時的工作樹與後續（歷史）

本批新增：本報告、development-b 的原始比較／候選快照、`award-consumer-policy.js`、`pitcher-award-policy.js`、兩份對應 `.test.mjs`、`tools/development-b/consumer-compatibility-probe.mjs`。正式接線仍未完成。

既有未提交修改另列：D2 主設計四行、`g1-a-validation/fixtures.mjs`、`fixtures-double-wings.mjs`、tasks、G1-B／B2 報告。不屬本批成果；本批沒有提交、推送、合併、部署、改 VERSION／CHANGELOG 或開始 G9。

## 相容契約批准後的實作及驗收進度

本批為 L3／R3。新獎項、薪資消費與一次性效果跨模組；最終必須使用本批確定程式的 Quick／Full，不重用 A PASS。以下為實際限定結果，未取代尚在執行的 G8。

### G5：各 Consumer 精確舊名稱相容

- `award-consumer-policy.js` 將身分與待遇分離。Consumer-local 精確表分別保留市場、fallback、incentive、HOF、phoenix、降格保護的原資格；未增加 Registry alias。缺聯盟格式若 A 接受則保留其原待遇，不補造 league／P-ID。年度MVP／守備王／出塁王／最多勝的各自結果均納入。
- [原生接線比較](development-b/g5-legacy-consumer-native-wired.json)：41 名稱 ×5 前綴（包括缺聯盟）×3 年份格式 ×4 財務 Consumer＝2460 案 PASS。每案保存原始名稱、A 原 Consumer／待遇、helper 投影與 B 實際原生函式結果、來源 hash；不是只測複製的 regex。原缺聯盟 fixture 與金額斷言未被補 league 掩蓋。
- 同義已知 ID 的 consumer 去重依 D2 AF07/AF08，不重寫 raw honors。HOF 原重複 MVP 的 A=840 characterization 保留；B=420 是批准的衍生去重，單獨斷言及原文不變檢查，不把它寫成 A/B 全部相等。
- G1-B1／A 的隔離來源 hash 改驗證接受的 A git 來源，B 接線另作正向測試。原 [3 個階段邊界 FAIL](development-b/g5-before-phase-adjustment-fail.json) 及 [重測](development-b/g5-after-phase-adjustment.json) 都保留；沒有修改 golden、Runner、manifest 或 CI 條件。

### G6／G7：真實產品函式整合（受控 fixture）

- `pitcher-award-policy.js`：198 項數值案例 PASS，包括四聯盟 P01、NPB/KBO P04、NPB/SP P08 S3/IP180/B2/G95、非法資料及原十進位 IP。手機案例僅 OFFLINE_ESTIMATE，不稱新產品實際得獎。
- 原 native 槽的條件／機率／順序保留；P02 只改 producer 名稱與部門待遇，仍沿用 LEGACY_BEST_PITCHER 的原主 R 槽／key。P03/P05/P06 正式名稱接入，不改原 SO/SV/HLD 條件。
- P01/P04/P08 使用 A 已驗 G2 獨立 RNG；固定初始化 seed、frozen metrics、ruleId、key、p、hash/u、outcome 寫入產品 Journal。P07 只用本交易實際三項 winner，不從 raw honors、達標或 caller boolean 推論。原生 MVP true／false／無槽三路均驗證，保證合併為單份 MVP。
- 原打者三冠保證行為不變；其 MVP Journal 如由三項實得保證，另存 HITTER_TRIPLE_CROWN_GUARANTEE 來源，避免「honors 已保證而 Decision 仍表示未得獎」。此 metadata 與原 native bool 分開，不額外耗主 R。
- [29 案原生 producer→Decision→Receipt→Consumer](development-b/g6-history-guard-retest2.json)：四聯盟 SP/MR/CL、slot／新 Decision／effect／render 故障，以及 glass、phoenix、pool、removed、history、AS、awardDecisions 各寫入邊界恢復。此為原生產品函式＋真實政策的 VM fixture，不冒稱 UI 或自然生涯。
- [15 案原生邊界](development-b/g7-edge-cases-attempt1.json)：三實得 8 種真值、跨年不合併、P08 未得獎無保護、當年效力、生涯只＋8一次、歷史大賞/P02/P08 分離及 P03 同義去重。
- 原生套件 `award-journal-native.test` 保留所有普通 S 嚴格比較；以接受的 A 來源構造明確批准的名稱／新獎／特性差異，並逐值比較原 R。卡片只允許正式名稱及取得說明的批准差異。獨立 B metadata 驗證器拒絕錯 year／league／role／來源／順序／hash／key 等篡改，歷史投影只分離已嚴格驗證的 awardDecisions，不忽略其他 S。同版重播仍比較原始完整狀態。

### 原始 FAIL 與直接修正（不覆寫舊證據）

- [新名稱防護修正前](development-b/g6-new-history-guard-before-fix.json)：已存在當年新獎文字而無可信 Journal，仍可進入新抽選。擴充交易的精確「已存在歷史」拒絕集合，不新增身分 alias、不補抽／補發。第一次重測因漏列 Registry 正式 P03 名仍 FAIL，保存於 [重測1](development-b/g6-history-guard-retest.json)；按實際 Registry 正式名補齊後，所有八項新字串拒絕重抽通過。
- 原生 fixture 初次／二次 FAIL：分別為比較器保留 A 技術欄位、錯把真實舊 SO 榮譽放入 Consumer-only fixture；見 [attempt1](development-b/g6-native-integration-attempt1.json)、[attempt2](development-b/g6-native-integration-attempt2.json)。只修直接 fixture／比較邊界，產品 UNKNOWN_HISTORY 拒絕保持。
- 舊 fixture 未提供新增實際 import／SEED、仍要求 pitcherTC deferred、原生 HOF 重複記分 characterization、舊所有無關來源逐字不變斷言，均按已批准 B 邊界分離歷史證據與當前測試。`championship-intl` 仍逐字檢查付款／rounding／合同條款，僅精確剝離批准的 incentive adapter 接點；沒有取消整檔檢查。限定 [4 入口重測](development-b/g7-phase-fixture-retest.json) PASS。

### G8：目前執行證據及尚待完成

- 第一輪 Quick 診斷：`test-results/development-b-quick-diagnostic1/`，54 PASS／6 FAIL，271.371 秒，exit1，沒有重標 PASS。六項為 award-journal-native、championship-intl、hof-first-ballot-league、kbo-renewal-e2e、retirement-hof-balance、trait-policy；接線／技術 metadata／批准去重原因及限定修正如上。
- KBO 原始負面基準、原2049錯誤與既有金額仍嚴格保留：`test-results/development-b-kbo-metadata-retest/`，1 入口 PASS、67.72 秒；只改成 B-aware 嚴格 metadata 驗證，沒有替換負面基準。
- 瀏覽器 `tools/development-b/runtime.mjs`：`test-results/development-b-runtime-attempt2/`，36 PASS／0 FAIL、errors=[]，Chrome155.0.8059.40／Node24.15.0／Windows，四聯盟 SP/MR/CL ×1280/320/390。原生 producer／receipt／consumer、結果 render 故障重試、當期支付、下期未付、原保障契約、歷史 DOM、無橫向裁切、下一選項及截圖均保存。這是 SYNTHETIC_SCENARIO，未當成自然分布樣本。
- 瀏覽器 attempt1 的18 FAIL完整保留：CORP赴美 fixture 依法進 MiLB、KBO依法套用一軍最低薪40m，測試卻假定MLB／固定10m。只把 fixture 改成合法既有一軍起點，支付按簽約時凍結年表及annualMax精確對照；未改引擎／floor／cap／政策。
- A 封存修改後 v2 校驗 PASS，3 archive 保持；沒有使用 --current-source。候選程式57產品檔 SHA256、HEAD/VERSION/git diff 保存在 `test-results/development-b-candidate-source-20261015/`，manifest SHA256 `ce1c69310eef11b1b742fb3787bef3455c43f7e97ffb73757aa5b7cfd28258e9`。
- 候選 Quick：`test-results/development-b-quick-candidate2/`，61 PASS／0 FAIL、306.7秒，executed61/reused0。此結果早於下節缺聯盟效果修正，不能代替確定程式結果。
- 首輪四條 A→B 固定 Seed＋同版 B 完整重播：`test-results/development-b-careers-attempt1/`，4 PASS／0 FAIL／errors=[]；保持通常／省エネ／全力及 IF 的 A 原策略，不新增採樣。逐步 S／選擇／年度／每筆主 R／完整 Decision 中間前綴都比較；無法解釋的普通差異不放行。亦早於缺聯盟效果修正，後續另跑最終四條。
- 最終 Full、完整 Gate 放行：尚未完成。CI／Preview／正式發布 NOT_RUN，沒有 push／deploy 授權。G2 RNG 本體未改，沿用已接受真 iPhone Safari52 PASS，不將 Chromium／WebKit 或 B 結果冒稱 Safari 新測試。

所有後續結果只追加／更新目前進度，不刪除首次停止、候選撤回、FAIL 或 A 封存。CURRENT_SPEC／BACKLOG／CHANGELOG／VERSION／AGENTS／Runner／CI 未改；上述平行工作仍保留。

### 缺聯盟效果範圍補查及最終驗收

這項補查確認本批相容層曾有 REGRESSION，不能因財務允許缺聯盟就擴大 phoenix／降格：`2039 最優秀投手賞`、`2039 首位打者` 等缺聯盟名稱在 A 並非 G1-A 精確新增資格。原生 A/B awards 函式重現 `pool7→15` 的錯誤，保存於 [修正前 FAIL](development-b/g5-no-league-effect-before-fix.json)。

直接修正僅限 consumer-local `legacyName` 的效果格式：phoenix 三個 G1-A 日文新增名稱、降格三個新增名稱要求已知 league 前綴；其餘各自原生名稱資格保持。沒有增加全域 alias、沒有改主 R／資格公式或財務缺聯盟待遇。限定 [4 入口重測](development-b/g5-no-league-effect-retest.json) 通過。

- [220 案原生效果格式矩陣](development-b/g5-effect-format-matrix-final.json)：10 項缺聯盟歷史執行實際 A/B awards；另外14名稱×5前綴（含缺聯盟）×bad/goodReal/past，執行原生 active movement→LEGACY.movement→native handleDemotion。逐案保存原名、A/B 普通 S、選項、卡片、RNG 與 wonAward/goodReal。全部嚴格相同。與財務2460案分開統計，不假定 Consumer 資格相同。
- [16 案新部門單獨付款](development-b/g6-independent-payments-attempt1.json)：P01或P04為唯一個人獎項，沒有MVP／其他部門掩蓋；市場.35、fallback1、HOF160/king1、FULL incentive，無phoenix/保護。逐欄付款fault／恢復／重入／次年只領保障薪且不再領過年獎金均PASS。原生 producer→Decision→Receipt→financial Consumer，仍為受控fixture而非自然樣本。
- [原槽靜態逐字核對](development-b/g5-legacy-slot-source-retest.json)：只精確反映四個正式名稱後，A/B 所有舊 eligibility／短路／機率／god／順序程式逐字相等；seedInit、R、chance 原語句相等。這是 VERIFIED_STATIC，另有原生 Runtime 逐值證據。初次工具把 A 末尾註解誤納入片段而 FAIL，保留於 `g5-legacy-slot-source-final.json`；只修工具片段終點，不改產品或演算法。
- Full候選1 `test-results/development-b-full-candidate1/` 因發現上述產品範圍差異，已主動中止；原始日誌保留、exit1，不宣稱 Full PASS，也不把未執行入口算PASS。
- 確定程式 manifest：`test-results/development-b-final-source-20261015/EVIDENCE_MANIFEST.json`，SHA256 `e439d6f70068417b07290f822395d5514e7bf30840780d529bf31f39291c10d4`；57個產品來源完整SHA、HEAD、main、VERSION、diff、A三封存唯讀驗證俱全，forbiddenChanges為空。
- **確定程式 Quick：61 PASS／0 FAIL／0 SKIP／0 BLOCKED，298.183秒，exit0，executed61/reused0**。命令 `node scripts/test.mjs quick --output=test-results/development-b-quick-final3 --playwright=<external-module>`；完整summary、指令與逐入口log俱存。後續未修改產品或Runner／既有測試邏輯。
- 確定程式 B三尺寸瀏覽器：`test-results/development-b-runtime-final/`，36 PASS／0 FAIL／errors=[]；原 A checkpoint工具重新對 B執行：`test-results/development-b-a-checkpoints-final/`，18 PASS／0 FAIL／errors=[]，不是引用A舊結果。
- 引退／舊榮譽UI：`test-results/development-b-retirement-ui-final/`，四聯盟SP×三尺寸＝12 PASS／0 FAIL／errors=[]。真實endGame及原renderer顯示新獎項、舊大賞及未知原文；不改honors、不新增身分，不裁切。截圖只在擷取時完成CSS動畫，不改產品CSS；不是新自然生涯或實機Safari證據。
- 確定程式 Full：`test-results/development-b-full-final2/` **執行中**。完成前不關閉G8或整批B。
- 最終固定Seed／同版B重播：`test-results/development-b-careers-final/`，**4 PASS／0 FAIL／errors=[]**。通常投球 yakyo-test-001/P：520操作／825主R；省エネ jp3-pitcher-02/P：304／606；全力 jp3-pitcher-03/P：335／671；jp3-infielder-01/IF：422／637。四條A→B第一普通差異均為null；全部普通S／合約／收入／honors／traits／pool／log／選擇／主R嚴格相同，同B重播比較未投影完整S。所有中間Decision必須為最終已驗證history的精確前綴；新Decision另驗schema、key、context、順序、hash/u與native draw來源，沒有全域忽略。
- 上述四條自然路線**未取得新P01/P04/P07/P08**，不能把這項零普通差異說成自然新獎後所有分支均已實測。新獎作用由真實producer的受控fixture／瀏覽器補足，不新增自然樣本、不改A操作策略。不把合成獲獎案例當成獲獎率或平衡性證明。
- [同B Receipt重播12案](development-b/g7-receipt-replay-final.json)：四聯盟×SP/MR/CL，完整S、Decision、卡片、原R、Receipt各欄before/after/status均在全新相同輸入交易及重入間嚴格一致；沒有歷史欄位排除。
- [非保證機率實際producer12案](development-b/g6-probabilistic-producers-evidence.json)：四聯盟×SP/MR/CL，保留初始化Seed／metrics、A/B完整S與主R、獨立hash結果、預期普通S與產品Receipt。不同獎項依正式rule實得，原主R完全一致。CPBL原15勝本為保證值，初次工具錯要求其hash存在；改為預先定義12勝邊際fixture，不變動產品門檻。另補入raw MVP未中而真實三冠保證MVP的明確oracle步驟，保留相應oldghost／phoenix＋8預期。兩次工具FAIL見 `g6-probabilistic-producers-final.json`／`g6-probabilistic-producers-retest.json`，不是產品規則回歸；不修改既有測試、golden或Full條件。

### HISTORICAL CANDIDATE：擴充可追溯前綴與舊名稱後的候選

前節的「確定程式」是其當時候選，未冒充本節新版測試。繼續盤點A原生接受格式時，發現短前綴CPBL／MLB也會被A財務Consumer接受：`2039 CPBL最優秀投手賞` 原市場.75、B相容層0，原始FAIL保存於 [alternate-prefix-before-fix](development-b/g5-alternate-prefix-before-fix.json)。Full-final2已中止並保留原始日誌，不稱整套PASS；其381合約及其他已跑入口仍是該候選真實歷史結果，不移作本節結果。

直接修正：Consumer-only解析另外保留CPBL／MLB及中職／日職／韓職／美職精確前綴；HOF仍使用其原有target league／完整標籤格式，不被這些前綴擴張。G1-A三個日文新增效果仍要求其原known-league完整格式，沒有因財務相容而擴權。

封存原文 [詳細設計書](../archive/local/YaKyoLife_詳細設計書.md) 1592–1602行列出年度最佳投手、救援王、中繼王、三振王、盜壘王、打點王、上壘王等；其已知舊譯包括ホールド王／盗み王。賽揚獎可追溯至[封存薪資分析](../archive/imported/history/MBDAY_SALARY_ANALYSIS_V2.7.6.md)，只以A現行Consumer實際是否接受判斷待遇，不恢復其歷史遊戲政策。這些名稱僅加入各自原生phoenix／降格的精確相容表；不全域alias、不取得P-ID、不供新P07或P08效果來源，財務Consumer不因名稱存在就新增分數。

- [6600項原生財務逐案比較](development-b/g5-extended-legacy-native-wired.json)：50名稱×11前綴×3年份格式×4Consumer，全部PASS；原名／A原Consumer待遇／Bhelper及實際接線結果、來源hash完整保存。這是原2460矩陣的明示擴充，舊資料不覆寫。
- [778項原生效果與降格比較](development-b/g5-extended-effect-matrix.json)：19項缺聯盟原生awards比較＋23名稱×11前綴×bad/good/past原生movement，全部PASS。每項保留A/B完整普通狀態、wonAward/goodReal、實際降格選項、卡片、RNG；同名跨Consumer的待遇可不同。此證據檔另有六個相關入口PASS，非把778當成Quick入口數。
- 擴充後7個限定入口PASS：原生Consumer矩陣、效果矩陣、award-journal-native、真實新producer整合、原生邊界、獨立部門付款、非保證機率producer。既有未提交內容保持，不改原始honors／已付收入／合約或主R。
- 本節產品來源manifest：`test-results/development-b-confirmed-source-20261015/EVIDENCE_MANIFEST.json`，SHA256 `9531c5536affc2c81304203538ac62e559629017034f77a7a5b23a2d603004eb`，57個產品檔；A三封存校驗仍PASS、forbiddenChanges空。最終報告以此來源而非前兩個候選manifest為準。
- 此來源36項三尺寸原生瀏覽器：`test-results/development-b-runtime-confirmed/`，36 PASS／0 FAIL／errors=[]；12項引退／歷史：`test-results/development-b-retirement-ui-confirmed/`，12 PASS／0 FAIL／errors=[]；不修改的A checkpoint工具對B重跑：`test-results/development-b-a-checkpoints-confirmed/`，18 PASS／0 FAIL／errors=[]。
- 此候選 Quick：`test-results/development-b-quick-final4/`，61 PASS／0 FAIL、322.091秒；四條固定Seed／同B重播：`test-results/development-b-careers-confirmed/`，4 PASS／0 FAIL；Full-final3後續中止，詳下節。這些結果不移作最新固定來源的測試。

### LOCKED SOURCE：目前唯一最終受驗來源

前節後又補查退休守備敘述的Consumer，實際A `posLegendPhrase` 會辨識短聯盟前綴下的完整GoldGlove／年間最優秀守備選手；本批新helper曾漏掉此格式。[原始FAIL](development-b/g5-defense-phrase-before-fix.json)保留。直接修正只增加這個只讀顯示helper的已知舊前綴，不改資格、分數、狀態或RNG。[264項原生defShare＋posLegendPhrase對照](development-b/g5-defense-phrase-retest.json)全部PASS，同檔另外四個直接相關入口亦PASS。

因此Full-final3也中止並保存日誌，不把部分入口當完整Full。所有先前候選及其PASS／FAIL各屬原來源；以下才是目前最終固定來源：

- `test-results/development-b-locked-source-20261015/EVIDENCE_MANIFEST.json`，SHA256 **`e86de29ca6b791131c13220de557d1e7ea0612604ea506dd2f7f6366671bb2b2`**。HEAD仍為efd4710c4c5c366ff3aba69c59180031c82ff18a＋未提交B；VERSION1.12.0，main未改。57個產品來源SHA完整保存，A三封存驗證PASS、禁止修改檔案清單為空。固定後未再修改產品。
- **Quick：61 PASS／0 FAIL／0 SKIP／0 BLOCKED，465.499秒，executed61／reused0，exit0**。`test-results/development-b-quick-locked/`，不引用前候選PASS。
- **A→B固定Seed及同版B完整重播：4 PASS／0 FAIL／errors=[]**。`test-results/development-b-careers-locked/`。同A四條原策略、原尺寸、原選項優先順序；原生S、年度成績／收入／合約、honors／traits／pool、選擇與每筆主R嚴格相等，新Decision另行驗證。同B比較完整原始資料，不套歷史投影。四條動作／R次數仍為520/825、304/606、335/671、422/637；沒有自然新獎樣本的限制仍保留。
- **新獎原生瀏覽器：36 PASS／0 FAIL／errors=[]**，`test-results/development-b-runtime-locked/`；**引退／歷史UI：12 PASS／0 FAIL／errors=[]**，`test-results/development-b-retirement-ui-locked/`；**原A checkpoint工具對B重跑：18 PASS／0 FAIL／errors=[]**，`test-results/development-b-a-checkpoints-locked/`。三者均為目前固定來源實際新執行，不轉用先前圖／JSON冒充。
- 原生生成球季的checkpoint fixture實際產生：2032 NPB/SP，G31、W17/L5、IP201.5、SO228、ERA1.4。真實proSeason/simSeason→P01保證、P04獨立hash約56.818%、P08 score約98.068保證、P07衍生MVP，故障後仍只一份phoenix＋8。這是合法cap80能力的受控fixture，不是自然生涯或新平衡樣本。
- **Full（此輪歷史狀態）**，`test-results/development-b-full-locked/`：後續因舊改名斷言FAIL而中止；不是最終Full結果。最終完整執行為文末`development-b-full-renames`，不改寫此輪原始日誌。
- [HOF四個target league歷史格式補驗](development-b/g5-hof-all-targets-final.json)：6600項PASS；補足原財務矩陣中HOF以NPB為target的限制。兩矩陣有重疊，不將兩個6600相加宣稱13200個不重複案例。

三項中止Full都是為保留固定來源的完整驗收界線，未修改Runner、CI條件、golden或A封存來取得PASS；原始日誌及各自來源保留。所有平台／自然路徑限制與未授權CI／Preview／發布事項仍適用。

## 受驗產品修改清單與 SHA256（LOCKED SOURCE）

以下10檔為本批產品變更；其他47個產品來源亦在locked manifest完整列出並校驗。HEAD是接受A的commit，B尚未提交，不能把該SHA當成已包含B的commit。

- 新增 `docs/src/engine/award-consumer-policy.js`：Consumer各自精確相容表、唯讀semantic view、可信新Decision待遇及分開的phoenix／保護／退休文字集合。SHA256 `8ecf756ec1f5b471712d622ffc057244d01ca0c5c832167fdba5e65f6b50b8d5`。
- 新增 `docs/src/engine/pitcher-award-policy.js`：已批准P01／P04／P08資格及未取整binary64機率純函式，無RNG或S寫入。SHA256 `e4201c91715470a03e22a4bc9c36d78a3346a5d22099dde50f00f4714c3dbbb9`。
- `docs/src/engine/game.js`：原槽正式名稱／Consumer接點、新獎結果接線、P07／MVP／pitcherTC及P08共用一次效果；保留原資格／機率／主R順序。SHA256 `e6f776c0551c1eca97e15c13dc61d7d258080d1f42be006ae00858839af5ce84`。
- `docs/src/engine/award-transaction-policy.js`：三個獨立Decision、同交易三實得衍生、MVP來源合併、拒絕無Journal新獎歷史重抽；原Receipt機制不重寫。SHA256 `6db45696dfc45c49d6163d695174f1f1bfe6ed893c95f768f7152649ed34ab34`。
- `docs/src/engine/salary-evaluation-policy.js`：市場獎項待遇view及live authority參數；原成績／sample／權重／cap公式不變。SHA256 `d24562e69d06f9a32da1e852c71ad9bda8fa9e12aea2824fd4b463d4f4647263`。
- `docs/src/engine/salary-promotion-policy.js`：fallback獎項view，原總cap3／薪資曲線不變。SHA256 `28ba57fd096114c84e4078dc0f02453bd34a3dfc51be124b1fc069e8c1f72dca`。
- `docs/src/engine/incentive-policy.js`：精確Consumer資格及live authority，既有annualMax／HALF／NONE與防重欄位保持。SHA256 `c8402d925147c976e698ebae646ce8d13e701d395bd2c2e80d59db9da4780095`。
- `docs/src/engine/season-payment-policy.js`：窄財務projection明確傳入原S的Decision authority，避免合法新獎在付款projection遺失證明。SHA256 `927bb8ed4d5547629b3289b0a90250963decc4d680d11b46dc7288e5e458b0c9`。
- `docs/src/engine/hall-of-fame-policy.js`：按Consumer語義一次派生score／aceN／king；大賞460、MVP420、部門160等既有核准待遇分開，不改投票或threshold。SHA256 `cc5ac98101d7e158e2475ad3784ea2a54aa23fdaa17d0015d94884b4cce5b81d`。
- `docs/src/engine/trait-policy.js`：保留原canonical打者／MVP條件，啟用既有pitcherTC取得文案、從deferred清單移除該已實作項；其他特性條件不改。SHA256 `b1b1dff5efc145f12de724802597d0a6d5438a23abfa48d5758e80ac6abb9d09`。

Registry、G2 RNG本體、契約／FA／KBO package／成績生成／能力成長／傷病／MVP原抽選／主R原語句、HTML／CSS、VERSION與發布設定未修改。產品module新增沒有npm依賴或build步驟。

新增自動入口為consumer-policy、legacy-consumer、history-B-comparison、pitcher-award-policy、pitcher-award-integration五份`.test.mjs`；`list`由既有manifest自動發現，未改Runner或CI。其他測試改動是已批准的階段隔離／metadata嚴格驗證／原生import接線／HOF去重差異說明；原有負面基準與舊金額保持。`tools/development-b/`為限定驗收工具，結果逐次保存，不暗中當成Runner已執行。

平行D2四行、tasks、G1-B／B2報告、G1-A的fixtures.mjs及fixtures-double-wings.mjs不是本批修改，未覆蓋、還原或提交。工作樹完整清單在locked manifest；結束時另核對。

## G8 最終 Full 的新 FAIL 與限定測試修正（產品來源保持 LOCKED）

`development-b-full-locked` 在 full-power-pitching 的 `yakyo-test-001` 通常／省能投球兩案記錄 `RangeError: Array buffer allocation failed`。原始入口日誌、逐案 FAIL JSON 及兩版原始生涯全部保留；此輪已中止，不是 Full PASS，也沒有完整 Runner summary。停止前已通過的入口不移作下一輪新執行結果。

只讀解析可正常載入快照及執行 historicalCareer；逐欄盤點確認通常投球的3563處差異全部是honors內已批准正式名稱及其衍生狀態digest。第一處在step106（2031 CPBL一軍）：`最多セーブ`→`最多セーブ投手賞`，另有後續`最優秀中継ぎ`→`最優秀中継ぎ投手賞`。**已證實的測試錯誤**是舊全相等斷言不接受批准改名；大型assert在產生巨型差異診斷時配置失敗，是依單獨投影成功、差異盤點與限定修正後相同資料成功的**機制推論**，未取得V8內部分配堆疊，不冒稱已做allocation profiler或排除所有主機資源因素。此處不當作遊戲記憶體Bug或單純主機不足。

限定修正只有測試與B驗證工具：新增明示的expected producer-name oracle，逐筆要求當年度／原聯盟／原層級、相同原抽選槽及實際完成且獲獎Decision，才把**預期副本**的該筆honor改為D2 §4正式名稱；原資料和產品不變。其他S／honors索引順序／契約／收入／選擇／RNG全欄仍嚴格比較，並保留逐Decision來源及第一個改名位置。不是全域honors字串正規化，不修改historicalCareer原行為，不用Consumer-only alias推測身分，沒有新獎效果就不允許新獎差異。失敗以精簡第一差異回報，不再格式化100MB以上的整個物件。

- [30項驗證入口（含改名正向與反向子斷言）](development-b/g8-producer-rename-unit-retest.json)：PASS；驗證缺Decision、年份錯誤、跨聯盟、額外honor、pool／traits／收入／RNG變更、偽造抽選值一律拒絕；frozen來源不被改寫。
- [原始Runtime快照重新分析](development-b/g8-producer-rename-saved-reanalysis.json)：2案PASS，通常362步／728主R、省能397步／858主R；每個原R值及前後狀態嚴格一致，改名對應10／9個真實獲獎Decision。分類為`REANALYSIS_EXISTING_RUNTIME_SNAPSHOTS`，不是新Runtime重播，不能取代接下來Full。
- `full-power-pitching-e2e`與`international-personal-stats-e2e`僅在原先歷史完全相等的專用案例採用此明示oracle；同B重播、IF已批准phoenix控制、全力投球首分歧／TJ公式斷言均保持。
- 產品57來源仍為同一LOCKED manifest；Runner／manifest／CI／golden／A封存不改。接著以修正後測試重新執行Quick及完整Full，不使用reuse。

### 修正後的最終驗收識別

- 產品仍對應`e86de29c…`的57檔；新增完整驗證來源manifest位於`test-results/development-b-verification-locked-20261015/EVIDENCE_MANIFEST.json`，SHA256 `ad37e185b71a6e86976c689517eaf50ea11dc93d83a9aa7ffe2d35d3657552dd`，另列103個測試／B工具來源SHA256，避免Runner未涵蓋untracked工具的指紋缺口。沒有修改Runner。
- `node scripts/test.mjs quick --output=test-results/development-b-quick-renames --playwright=<external module>`：**61 PASS／0 FAIL／0 SKIP／0 BLOCKED，244.667秒，exit0，executed61／reused0**。來源fingerprint `ee88fd6d59edd5ee6ad5ebf4a3164ba882de555e6dcfd55fa8e6d53fb63e80f3`。
- `node scripts/test.mjs full --output=test-results/development-b-full-renames --playwright=<same external module>`：執行中；必須以完成後summary／exit為準，不使用中止輪或A的PASS補數。

### 正式Gate與F-ID證據對照（不重新定義正式ID）

- **G5**：原槽逐字證據`g5-legacy-slot-source-retest.json`為STATIC_ONLY；原生同輸入逐R比較由`award-journal-native.test.mjs`與`pitcher-award-integration.test.mjs`執行。Consumer分別對應6600財務、778效果／active movement、四個HOF target6600及退休264矩陣，重疊不重算。P02舊槽新部門待遇與歷史大賞分離；原始honors及保障契約不變。
- **G6**：198純數學／資格案例是MODEL，不取代29項原生producer整合、12項非保證hash實得fixture、16項獨立部門付款、36項實際瀏覽器及原生生成球季。P01四聯盟、P04 NPB/KBO、P08 NPB1/SP均有正負適用案例；原G2產品檔完全未變，沿用已接受的真實Safari52案，不宣稱B新跑Safari。
- **G7**：15項原生邊界包含三實得8種真值；29項整合含MVP原槽true／false／無槽三路。12項同版Receipt重播、共享phoenix、逐寫入fault、付款7個寫入fault與真實checkpoint恢復，並保存完整before/after及原R。P07自身不新增大獎財務待遇，MVP唯一。
- **G8**：上述專用矩陣、36＋12＋18項瀏覽器、四條A策略自然生涯／同B重播、正式改名的逐Decision歷史比較及全新Quick／Full共同構成；**Full完成前不結案**。四條A策略自然路線沒有新賞winner，不假稱已自然驗證獎項平衡或效果分歧。
- **F-ID01～03**：G1-A已接受的三項phoenix資格不擴張；本批由精確Consumer規則、原生awards A/B狀態與原有打者／MVP原生fixture驗證，不再新發歷史最優秀投手賞。已存在legacy不轉新P02/P08，也不因顯示字串補發phoenix。
- **F-ID04～06**：778矩陣直接執行active movement→LEGACY.movement→原生handleDemotion，分開bad／goodReal／past；首位打者與GoldGlove不靠模糊「王」，原wonAward命中與實際降格分支均對照A。
- **F-ID07／08**：MVP／新人王／本塁打王原效果、GoldGlove僅保護、All-Star不新增兩類效果，透過原生接線fixture／精確邊界與同年多賞once驗證；未知相似名不取得可信新ID。
- **F-ID09**：原生Consumer同時輸入legacy／P02／P08，分別460／160／460且原字串不變；舊資料無Journal拒絕重抽，原已付年度與合約不重算。
- **F-ID10**：P08真實producer獲獎／未得、glass／已phoenix、同季MVP、跨年失效與再次得賞，原生fixture及瀏覽器驗證；歷史裸沢村字串無live Decision權限，不當作新效果證據。
- **F-ID11**：Registry單元及Consumer矩陣包含跨年／跨league、同義P03短／正式名；財務semantic once不改原順序。獨立S／複製Decision拒絕取得live權限，原生當年跨聯盟舊保護範圍不擅改。
- **F-ID12**：market／fallback／incentive／HOF／trait實際函式與付款、三尺寸卡片／選項／退休原renderer；FULL部門、P08大獎及MVP分開，未來年俸不冒算已付收入，原文unknown可見、不額外消耗主R。

這是正式F-ID的證據索引，不把G1-B2靜態調查、G3完成Decision fixture或A Full冒充B的producer整合；最終Gate狀態仍須等待本輪Full及結束來源校驗。

人工圖像複核：實際開啟locked來源的`1280-NPB-SP.png`、`320-NPB-SP.png`及`390-NPB-retirement.png`；正式獎項名稱可折行、三冠取得說明及年度收入區分可見，退休歷史同時保留舊最優秀投手賞與未知原文。這是原生瀏覽器受控fixture的圖像複核，不是手機Safari新測試或自然生涯樣本；完整頁面截圖包含既有sticky header／選項面板，不能將其當成沒有浮層的排版截圖。原生DOM的可操作選項／無橫向溢位及Console／404結果另由各summary佐證。

### G8 改名斷言的全新Runtime重測已完成（Full其餘入口仍執行）

`development-b-full-renames/full-power-pitching-e2e.log`：入口exit0、881.42秒；原生瀏覽器summary為**36 PASS／0 FAIL／errors=[]**。不是拿快照重析代替新執行。

- yakyo-test-001／通常：362步，舊／新主R均728；逐Decision支持10筆正式改名，第一筆step106／2031 CPBL最多セーブ。其他欄位嚴格一致。
- yakyo-test-001／省エネ：397步，舊／新主R均858；9筆改名，同樣從step106開始。其他欄位嚴格一致。
- jp3-pitcher-02／通常：386步，舊／新主R均735；1筆改名，step258後發生。
- jp3-pitcher-02／省エネ：431步，舊／新主R均857；**0筆改名**，仍完整嚴格相等，沒有為此案例放寬差異。
- 兩條全力投球的舊callback首分歧、原成績補正／TJ與同B完整重播仍PASS；IF控制step265／2041首位打者，pool＋8、生涯一次、全639筆主R一致，完整approved native control及同B重播PASS。

本入口沿既有歷史基準`20920dddd72ab8c91b0e2c71d560492663cd5aec`及原已批准school／phoenix控制；它是較舊功能的回歸，**不是**接受A封存的四條原策略比較。A→B四條完整普通S／R及新技術欄位的比較仍獨立保存在`development-b-careers-locked`，不混算兩者樣本或基準。

## 本批確定產品的Quick／Full最終結果

- Quick：**61 PASS／0 FAIL／0 SKIP／0 BLOCKED**，244.667秒，exit0，executed61／reused0。`test-results/development-b-quick-renames/summary.json`，SHA256 `4cf85207ba9de472937e714e1a1c18383171bfdf798f19062dcc8e1625eda96c`。
- Full：**80 PASS／0 FAIL／0 SKIP／0 BLOCKED**，3555.235秒（59分15秒），exit0，executed80／reused0。`test-results/development-b-full-renames/summary.json`，SHA256 `9edd08764d9336507690a5c7b0307d66fb5bdfd9a4c9a9d27cc7b10a82b73b0a`。
- 兩者相同sourceFingerprint：`ee88fd6d59edd5ee6ad5ebf4a3164ba882de555e6dcfd55fa8e6d53fb63e80f3`；比較基準`origin/main`完整解析為`7220ad82002801d3dea5fedae80d0fb3d7a0433f`，各舊負面／專用基準仍各自保留。Win32 x64／Node24.15.0／Chrome155.0.8059.40／Playwright1.62.1。
- 已逐一重新計算**141份入口日誌**SHA256，均符合對應summary的logSha256；兩份summary無reuse。57個產品與103個當時測試／工具來源均符合既有鎖定manifest；不是將A或部分重測冒充本輪Full。
- Full中特別核對：契約／年俸381；full-power36；學校特性30；stage10風險57；能力配分89；交易安全5；stage7安全17；特性顯示18，均PASS。這些是各入口子案例數，有共用／重疊，不與80個入口相加宣稱唯一案例總數。
- stage10刻意注入錯誤30筆，unexpectedErrors=[]、blocked0；不宣稱整套Full的原始Console字串一律為0。普通路線及本批36＋12＋18專用瀏覽器errors=[]。斷線後profile清理逾時警告保留，不改Runner或原分類來隱藏。
- 本階段結束保全manifest：`test-results/development-b-final-tested-source-20261015/EVIDENCE_MANIFEST.json`，SHA256 `7d3e71586f7cdbdbbc4bd9a69473e47f7cb8b159da9c61f9473f8a928e5b4159`；A三archive重新校驗PASS，未使用--current-source；forbiddenChanges空、HEAD／main／VERSION不變。

## 自然生涯私有Receipt補驗：工具原始問題與修正

四條A策略自然生涯原有完整S／Decision／選擇／RNG零差分；完整私有Receipt重播原先是12個原生交易fixture。為對齊使用者同版B完整Receipt要求，追加隔離的`receipt-careers.mjs`，不接入產品／Runner：將實際原生annualAwardTransaction／annualStateTransaction呼叫各轉送一次、保留原token，再以原生inspectAwardTransaction唯讀觀測，不為查詢而額外建立交易。每條完整重播兩次，且全部普通trace與先前locked B原始檔嚴格一致，藉此驗證觀測無S／RNG副作用。

- 第一個補驗版本因每步反覆展開所有歷年Journal會造成大量重複資料，預防性中止；沒有實測產品FAIL或完整測試結果。空／部分產物目錄保留，分類**INTERRUPTED / NOT_COMPLETED**。原工具快照[expanded版本](development-b/receipt-careers-expanded-before-stop.mjs.snapshot)，SHA256 `f2ae071ca51a1d95e5b883c9603e892a808bfe35ed2afa071328eee4ce94376f`。
- 改為**無損完整修訂快照＋逐步有序revision參照**：每次仍inspect全部實際交易，任何值有變都存完整新版本；相同版本不重複展開。不是只存hash或忽略欄位，另以獨立讀取器逐步重建並核對最終完整Receipt。
- v2原始結果：`test-results/development-b-private-receipt-careers-v2/`，**0 PASS／4 FAIL／errors=[]**。錯誤位於新工具最後的斷言：誤要求每個write.status為COMMITTED（原生commitAwardReceipt明確使用WRITTEN，而receipt.status才是COMMITTED）；另誤要求每條職業生涯有一軍AWARD交易，jp3-pitcher-02實際只有STATE交易、無一軍Decision，不可捏造AWARD。完整同B資料比對及對locked B trace零差分均已在這些錯誤斷言之前完成，但不能把v2整體標為PASS。
- [v2修正前工具快照](development-b/receipt-careers-v2-before-assert-fix.mjs.snapshot)，SHA256 `c4eb22934e021670d867d71c2ba6a843a5984a12bd8154392c6271feebb9e035`；每條first／repeat原始資料、FAIL與summary保留。只按現行原生schema修正工具的最終斷言，不改產品、不改任何基準或主R。
- v3全新Runtime其後已完成，結果見下節；不用v2資料重析冒充新Runtime，v2四項FAIL不改寫。

上述追加是R1隔離驗收工具，不被任何既有產品／測試入口或Runner載入；既有Quick／Full受驗產品、測試與比較工具保持同一來源。追加工具自己的執行與重建證據分開記錄，不能把先前Full標成已執行這兩個手動工具。

## FINAL：自然生涯Receipt、來源保全與各Gate結論

### 完整自然生涯Receipt補驗已完成

命令：`node tools/development-b/receipt-careers.mjs --output=test-results/development-b-private-receipt-careers-v3 --playwright=<external module>`。**4 PASS／0 FAIL／errors=[]／exit0**，逐案實際執行合計237.850秒，不含瀏覽器初始化／清理。四條各重播兩次，完整S、Decision、選擇、逐R與每步私有Receipt修訂全部嚴格相等；另與未接觀測器的locked B完整trace相等，不排除任何S／Decision／R欄位。

- yakyo-test-001／P／通常／1280：520步、825主R，20個實際交易、48份Receipt、22個完整修訂。
- jp3-pitcher-02／P／省エネ／320：304步、606主R，16個STATE交易、31份Receipt、16個修訂；沒有一軍AWARD交易，正確維持原路線，不捏造一軍樣本。
- jp3-pitcher-03／P／全力／390：335步、671主R，27個交易、83份Receipt、29個修訂。
- jp3-infielder-01／IF／通常／1280：422步、637主R，26個交易、87份Receipt、33個修訂。

`summary.json` SHA256：`bd160d427cd76fc84cb1b493288f2690a22b8a05599c7c78076b8b3bae06b5c1`。每條first／repeat原始資料各自保存，兩份完整JSON的SHA256亦完全相同。

獨立驗證命令：`node tools/development-b/validate-receipt-careers.mjs --directory=test-results/development-b-private-receipt-careers-v3 --output=docs/reviews/development-b/g8-natural-private-receipt-validation.json`：**4 PASS／0 FAIL／exit0**。逐步驗證每個有序參照都可還原為保存的完整修訂、修訂不被覆寫、變動不遺失，最後全部Journal／Receipt與原生最終inspect結果完全一致；Receipt全部COMMITTED、每個write全部WRITTEN。這是原生Runtime資料的獨立核對，不另算四條新生涯。見[重建結果與原始檔SHA](development-b/g8-natural-private-receipt-validation.json)，本檔SHA256 `4ff2832151e8d6c64e2ae9a5b5380d19e819c56ec7e484cae16238fe521e40df`。

### 最終來源與Git狀態

- Branch **dev**；HEAD **`efd4710c4c5c366ff3aba69c59180031c82ff18a`**；VERSION **1.12.0**。這是A提交＋未提交B工作樹，**不是**含B的新Commit。
- 最終manifest：`test-results/development-b-final-complete-evidence-20261015/EVIDENCE_MANIFEST.json`，SHA256 **`2fabfaa7545b2c2310a7f4600b6ad83f6f9eea578d62ef9ab5469e2c9fe9635a`**；57個產品、105個測試／工具SHA與完整git status／tracked diff保存。新增兩個隔離補驗工具沒有改動原57＋103來源；原Full／Quick仍對應原先實際受驗來源，不偽稱新增工具已包含於80個入口。
- `receipt-careers.mjs` SHA256：`c2313a86175665b6791b7572dac51ecbb2cb6a1803e2b078725254cce210bc96`；獨立重建器：`ced2fa2763459eef828c3f7ecad854072eb53fc03bc4ce6da6bad82fa98342fc`。對docs/src、tests、scripts做靜態依賴搜尋，新增工具引用為0；它們只在本批手動驗收執行。
- A的3個archive及原信任錨重新驗證PASS，沒有--current-source，未重建／改寫A原資料。原產品57檔及原103個驗證來源於Full後再次逐檔比對，零變更；141個入口log SHA驗證通過。
- 本地main仍 **`4624753a5359acd6c63ab6957341376bd43c5c88`**。AGENTS／CURRENT_SPEC／BACKLOG／CHANGELOG／config VERSION／Runner／manifest／workflow的禁止修改diff為空；既存D2四行、G1-A fixture改動、未追蹤tasks與G1-B報告保持，不屬本批。
- 產品實際修改10檔及SHA已在前節完整列出；測試修改15個既有檔、增加5個自動單元入口；新增`tools/development-b/`18個限定驗收工具與本報告／原始證據。全部仍未提交，未push／merge／部署。

測試修改清單（相對tests/）：award-consumer-contract.test、award-identity-policy.test、award-journal-native.test、championship-intl.test、contract-salary-e2e、display-preferences-e2e、draft-income-e2e、full-power-pitching-e2e、international-personal-stats-e2e、kbo-renewal-e2e、retirement-hof-balance.test、retirement-hof-test-support、support/first-difference、trait-display-e2e、trait-policy.test，皆為`.mjs`。新增5檔為award-consumer-policy.test、award-legacy-consumer.test、award-history-b-comparison.test、pitcher-award-policy.test、pitcher-award-integration.test。各檔SHA以最終manifest為準。

### Gate與差異分類

- **G5：PASS（限定原生＋Runtime＋STATIC）**。各Consumer精確舊名相容、原槽資格／順序／逐R、P02部門／legacy歷史待遇分離及UI原文符合指定矩陣；沒有新增全域alias或回算收入。
- **G6：PASS（MODEL＋真實產品producer／Journal／Receipt／Consumer＋瀏覽器）**。P01／P04／P08批准曲線、適用／不適用聯盟／角色／層級、獨立RNG、非法資料與原生結果接線通過。沒有以單純完成Decision fixture取代producer。
- **G7：PASS（真實原生Runtime）**。三實得真值、同年同聯盟來源、MVP原true／false／無槽合併、一次性效果、付款／HOF／traits與故障恢復通過；沒有補耗原MVP主R。
- **G8：PASS（本次指定本地驗收範圍）**。原正式Gate／F-ID證據對照、全新Quick61／Full80、PC1280／320／390、四條A→B原策略與同B全狀態、四條完整私有Receipt及獨立重建均已完成。**READY_FOR_USER_REVIEW，不代表使用者ACCEPTED或發布許可**。

預期差異只有已逐項核對的D2新Decision／Receipt技術紀錄、實際producer正式名稱與批准的獎項／Consumer效果；HOF已知同義重複由840→420保留A歷史斷言另作B驗收，不改raw honors。四條A策略自然生涯普通S／選擇／年度／契約／收入／honors／traits／pool／主R零差分；自然路線沒有新P01／P04／P07／P08 winner，故沒有宣稱其後任意自然S／R差異均可放行。新效果的真實因果鏈以原生producer→Decision→Receipt→Consumer及下一年Runtime矩陣提供；所有觀測到的未接受相容性差異均已修正並保留舊FAIL。**指定範圍內未解REGRESSION=0**，不推論所有可能人生皆已驗證。

### 尚未執行與殘餘限制

- **CI／Linux Full／Cloudflare Preview／正式站：NOT_RUN**，本次沒有提交／推送／部署授權，不能把本機PASS寫成CI或Preview PASS。
- B完整UI的新iPhone／Android實機：NOT_RUN；指定手機尺寸是Chromium模擬，不冒充實機。G2獨立RNG產品檔未改，沿用已接受且來源SHA一致的真實iPhone Safari52 PASS，不宣稱重新執行Safari。
- 新獎項自然平衡、極端頂尖球季的母體機率：UNVERIFIED／非本批研究範圍；沒有新增研究採樣或調低門檻。受控fixture與實際simSeason生成球季不是自然分布證明。
- 故障支持仍只限正式D2同頁面／已記錄同步邊界；OOM、任意host crash、跨reload、未知next-year pre部分執行不承諾恢復。profile清理警告及所有候選／工具原FAIL均保留。
- **G9仍NOT_AUTHORIZED／NOT_RUN**。版本、正式規格／履歷同步、提交／CI／Preview／發布均等待下一次明確授權。此處停止，不自動開始G9。

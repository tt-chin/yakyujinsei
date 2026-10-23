# 野球人生 1.13.0 開發與文件整理整合紀錄

> 後續清理狀態（2026-10-18）：使用者另行批准刪除全部75份索引原檔，包含fixture。刪除前75份路徑、容量與SHA256全部一致，且排除reparse路徑；75份已刪除，0份剩餘，邏輯容量37,864,147 bytes。下文「原檔保留」「引用檢查通過」等描述為整合當時的歷史紀錄，不是清理後現況。14份已追蹤檔可由整合時HEAD取回；61份未追蹤原檔不能由Git或本摘要完整還原。指向已刪除來源的連結僅是歷史來源標記，尚未全面遷移其他文件的引用；本報告不是可執行fixture或原始JSON的替代品。本次未commit、push或執行測試。

日期：2026-10-18。性質：R0／文件整合，不是新的正式規格或測試驗收。

本文件整合原14個保留檔與61個未追蹤檔的必要內容、歷史結論與來源索引。75個原檔均保留；本輪不刪除、不移動、不提交、不推送，也不執行 Quick／Full。大型 JSON、原始輸出及可執行 fixture 不逐位元嵌入，因此本文件不是75檔的無損封存。

## 1. 目前基準與閱讀入口

專案路徑：`C:\src\yakyujinsei`；分支 `dev`；整合前 HEAD：`e3ce8314ef898bc98f955333e039ce15e5f791c3`；VERSION：1.13.0。整合前14檔已在本機提交、61檔仍未追蹤；本文件是另外新增的一檔，不包含於原75檔。

正式規則以 [CURRENT_SPEC](../../CURRENT_SPEC.md)、操作限制以 [AGENTS](../../AGENTS.md)、未完成工作以 [BACKLOG](../../BACKLOG.md) 為準。本文件不能授權產品開發、發布或清理。

- 現行入口：[文件導航](../CURRENT_DOCUMENTATION.md)。
- 測試入口：[TESTING](../../scripts/TESTING.md)。
- 獨有技術契約：[正式 D2 設計](../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md)、[決策紀錄](../designs/PITCHER_AWARDS_D2_DECISION_LOG.md)。
- 工程 Gate：[分階段計畫](../../tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md)。
- 原始驗收摘要：[開發 A](PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)、[開發 B](PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md)。
- 發布與精簡歷史證據見本文件第2節；66項規格移轉見第7節；全部75來源見第8節。

正式規格、技術契約、歷史候選、測試證據與未完成工作不得互相替代。既有架構文件包含較早版本快照，不能僅因出現在導航就宣稱已完整反映1.13.0。

## 2. 發布與驗收狀態

以下均為既有報告的歷史紀錄，本輪未重跑或重新向遠端查驗。

### 開發 A

受驗時 HEAD `d2ea8a3bcf38044928aab86ae56289839c45a0e4` 加當時工作樹，VERSION 1.12.0。Quick 56 PASS，Full 75 PASS；無 FAIL／SKIP／BLOCKED，非重用結果。耗時分別234.068秒與3536.369秒。

來源指紋：`ba495eb24751c3319aec386d0ecc529199340e81a08987d70da3e15944089c95`；engine SHA256：`c3d413dd6fc0b4a899c38b960d4ad9dfc4d1736fb412de850781f544daa5f709`。舊封存名稱中的 c3d413dd 是 engine hash 前綴，不是 Git SHA。

G2 Node／Chromium／Playwright WebKit各52 PASS；使用者協助的真實 iPhone Safari亦52 PASS／0 FAIL且來源hash核對一致。WebKit不能代替Safari，Safari此項結果也不能外推整套B的手機UI。

A0、G2～G4的接受範圍包含限定 Runtime、Journal／Receipt、年度安全續行；不是任意程序崩潰、重新載入或尚未記錄RNG間隙的完整恢復保證。G3完成Decision fixture與真實Receipt的交易驗證不等於後續G6／G7 producer整合已通過。

### 開發 B

受驗時 HEAD `efd4710c4c5c366ff3aba69c59180031c82ff18a` 加當時工作樹，VERSION 1.12.0。後續產品提交為 `56e72d9792529f3221c1a1ffadaf563bceebe26d`；不能把當時dirty來源測試說成在後續commit重新執行。

Quick 61 PASS（244.667秒），Full 80 PASS（3555.235秒），非重用結果。來源指紋：`ee88fd6d59edd5ee6ad5ebf4a3164ba882de555e6dcfd55fa8e6d53fb63e80f3`；engine SHA256：`e6f776c0551c1eca97e15c13dc61d7d258080d1f42be006ae00858839af5ce84`。

G5～G8已接受：Consumer相容、實際producer→Decision→Receipt→Consumer、角色／聯盟與1280／320／390px受控畫面。四條自然生涯使用：
- yakyo-test-001：投手normal，520步／825次主RNG。
- jp3-pitcher-02：投手energy，304步／606次主RNG。
- jp3-pitcher-03：投手full，335步／671次主RNG。
- jp3-infielder-01：野手，422步／637次主RNG。

上述四條既有普通狀態A/B嚴格一致，新增技術欄位另行嚴格驗證；同版B完整重播一致。四條未產生自然新獎項得主，不構成自然獲獎分布或平衡證明；合法新效果另以受控原生Runtime驗證。

### G9與正式1.13.0

正式來源 `650e4dd21718b4abec3876fc9ef6148714c21d4f`，正式站提交 `15adf286e687ab2efc70e9e694ae024f75c3f10b`。發布 [Run 38842942771](https://github.com/tt-chin/yakyujinsei/actions/runs/38842942771) SUCCESS；正式站基本投手／野手、1280／320／390px共6項Smoke接受，來源blob核對。不是完整生涯或真實手機UI驗收。來源：[正式發布驗收](RELEASE_1130_PRODUCTION_ACCEPTANCE.md)。

同來源 Linux Quick [38840980489](https://github.com/tt-chin/yakyujinsei/actions/runs/38840980489) 記錄61 PASS／0 FAIL，190.523秒。版本metadata變動不得全域忽略；沒有因整合文件而新增任何Runtime PASS。

### Linux Full與artifact：仍未接受

舊Full [38838485336](https://github.com/tt-chin/yakyujinsei/actions/runs/38838485336)，SHA `9b98ffa3e69449665656fa6a56da4555ca0394f3`：58 PASS／22 FAIL。8批各10項，依序為10/0、7/3、7/3、6/4、7/3、9/1、7/3、5/5；Aggregate FAIL_OR_INCOMPLETE。分批artifact成功不等於完整S／RNG等證據覆蓋。Socket路徑錯誤有log證據，不將未逐項核實的所有失敗直接歸為同一原因。

短TMPDIR Linux Smoke [38840993314](https://github.com/tt-chin/yakyujinsei/actions/runs/38840993314) 32 PASS／0 FAIL／0 SKIP；唯一0700短目錄、symlink realpath、約61-byte socket及清理後保留原輸出獲得限定驗證。這不是80項Full PASS。

最後Full [38841657256](https://github.com/tt-chin/yakyujinsei/actions/runs/38841657256) 為18 PASS／1中斷／61未執行，Exit143；外部SIGTERM來源未完整確定，Aggregate未執行。Linux Full保持 **NOT_ACCEPTED / DEFERRED**。使用者另行批准發布，不等於Full通過。

**D2-CI-ARTIFACT-01：ARTIFACT_COVERAGE_BLOCKED**。Collector限定47 PASS但未接入正式CI；原glob仍有完整原始證據缺口，timeout120及分批artifact不能解除此狀態。來源：[G9 CI證據驗收](D2_G9_CI_EVIDENCE_ACCEPTANCE.md)、本索引S015／S016／S019／S020。

## 3. G1、Consumer與不可改變的技術界線

G1-A修復既有日文獎項phoenix／降格保護漏判；歷史驗收包含88原生fixture、兩項目標Runtime、Quick48／Full67與指定639次RNG一致，不是本輪重新驗收。

G1-B1為唯讀ID Registry／Adapter；G1-B2是相容性分析。早期報告的「未授權」屬該時點，後續A/B授權及實作另有紀錄，不刪改歷史判定。

- 身分辨識不等於待遇。LEGACY_BEST_PITCHER、PITCH_ERA、PITCH_SAWAMURA必須分開。
- phoenix、降格保護、薪資、獎金、HOF各有資格集合，不因ID相同而共享待遇。
- 各Consumer精確舊名稱相容層保留原生待遇，不能把Consumer-only別名加入全域可信P-ID、完成Decision或P07來源。
- 未知歷史名稱保留原文；不得猜測歷史聯盟、改寫honors、補付薪資獎金或擴大特性資格。
- 純讀取顯示與有副作用付款／特性須分開；一次性效果依賴Receipt，年度續行依賴checkpoint。
- G1-B1「未接線」證據是歷史隔離驗收；B接線時改採正向及完整相容驗證，不代表舊證據失效可任意刪除。

主RNG界線：新獨立抽選不得消耗主RNG；相同輸入的既有獎項資格、抽選順序與RNG結果不變。第一個批准效果前既有狀態／選擇／trace嚴格一致，技術欄位另驗；後續差異須有 producer→Decision→Receipt→Consumer→狀態→RNG 因果鏈。不能因新得獎便放行所有後續差異。同版同策略完整重播仍須嚴格相等。

產品規則以CURRENT_SPEC及D2為唯一準據。本報告不重寫數值；尤其P08採min(95,10+2.5×(score−60))於60≤score<95，≥95保證，資格與S3權重不得因文件簡化而變更。

## 4. FAIL與修復摘要

- A的TDZ與跨VM fixture原型問題：直接修復後限定重測；原FAIL不改成PASS。
- B初次Consumer接線改變舊待遇：撤回候選，依批准採各Consumer精確相容層，不擴大全域身分。
- B診斷Quick54 PASS／6 FAIL，修復後另有61／80新測試；不能覆寫原失敗。
- full-locked曾ArrayBuffer配置失敗中斷；後來full-renames80 PASS是不同執行。
- Receipt careers v2 0 PASS／4 FAIL，涉及觀察點／第二隊路徑斷言；v3 4 PASS並獨立再驗4 PASS。不是把原v2標記通過。
- 名稱含final的JSON仍可能FAIL，逐檔索引保留實際counts。重複fixture矩陣的數千assertions不是數千Full入口。
- Linux socket錯誤與後續SIGTERM中斷是不同事件，不能以Smoke修復推定最後Full已通過。

第8節保留每份原始輸出摘要。候選程式快照是已撤回／歷史來源，不是現行產品。

## 5. 文件整理由來、清理與遷移

### 歷史清查與狀態

初次MD／JSON盤點28,586檔、77,595,534,118 bytes；分類A9／B1／F4520／G24056，引用與大檔語意檢查有已記錄限制。無靜態引用或相同hash都不是可刪除的充分條件。

第三階段test-results快照78,699檔、80,530,444,458 bytes，JSON佔77,367,582,767 bytes。分類SAFE_CANDIDATE 0、CONDITIONAL 156檔13,093,016,765 bytes、MUST_KEEP 57,800檔41,963,943,771 bytes、BLOCKED 20,743檔25,473,483,922 bytes。這是當時依完整封存政策的判定，不是目前路徑的即時容量。I/O對Full時間的影響未實測，不把容量比例當速度收益。

使用者後續取消約75GiB完整外部封存，接受無法完整重建舊A→B比較；改保留正式規格、Git、測試、golden／fixture及精簡驗收摘要。舊第三階段完整封存前置政策已被此決策取代；未取消唯一技術契約或測試來源的保留義務。

### 限定清理：不能說82,026檔全數刪除成功

批准清單82,026候選、81,048,747,916 bytes；排除424檔173,486,910 bytes，包含branch-switch-preserved及非測試成果。清單SHA256：
`038c514b416d9c654ef9777d6ca183b3951530be24d9d176db41597f63444fe6`。

正式執行記錄42檔成功、1,404,104 bytes；1檔失敗、81,983未嘗試；重試未新增成功。Account Web Data存取拒絕，不因重開機／管理員身分就確定根因。ACL拒絕子項刪除曾被觀察，但不足證明是唯一原因。

執行前後可用空間反而減少2,191,360 bytes，不能宣稱等同釋放候選總容量。424排除檔存在／容量檢查與部分356hash核對有證據，原清理流程未完成全部424後驗hash；後續遷移504檔全hash驗證是另一項證據。

### 移出OneDrive

新專案來源650e4dd…／1.13.0。遷移504檔211,529,051 bytes，包含6修改檔、74未追蹤檔與424保留檔；來源／目的hash兩次核對。未複製.git，未套用舊兩項workflow刪除，未重建2個絕對junction。舊根目錄後來不存在，不追認為上述限定清理工具已完整刪除全部候選。

新的保留資料中仍有非測試程式／文件，不能把test-results整個目錄視為可再次清空。舊MIGRATE與EXECUTE腳本硬編碼舊OneDrive路徑，僅供歷史審查，不可直接重跑或自行改目標執行。

6檔同步提交adf9089…已推送；14檔保留紀錄提交e3ce831…為本機提交。當前75來源分類A14已追蹤、B7本地待確認、C54條件候選；分類不是刪除授權。

## 6. 重建1.13.0測試與後續限制

正式Quick61／Full80入口的靜態依賴調查未發現必須讀取舊test-results的共同前置；狀態是STATIC_READY、Runtime NOT_RUN，不保證尚未執行的新基準一定通過。保留完整Git歷史與以下非舊結果依賴：

- tests/fixtures/draft-income-routes.json、tests/fixed-seed-regression.json。
- tools/development-a/g2-vectors.json。
- docs/reviews/development-a/before-hashes.json與b1-snapshot中的模組／測試。
- tools/development-b/中的正式測試支援，不與docs/reviews/development-b候選輸出混淆。

舊verify-baseline、freeze-baseline、capture-evidence、receipt-careers等工具可能讀取已放棄的歷史固定路徑，不能捏造舊baseline讓它們通過。官方Runner新輸出可能覆寫相同輸出路徑，應使用唯一新路徑；不能強迫歷史重播替代全新驗收。

未來經另行授權，可使用：
```powershell
node scripts/test.mjs quick --baseline=650e4dd21718b4abec3876fc9ef6148714c21d4f --output=test-results/clean-1130-UNIQUE/quick --playwright=PLAYWRIGHT_MODULE_PATH --browser=chrome
node scripts/test.mjs full --baseline=650e4dd21718b4abec3876fc9ef6148714c21d4f --output=test-results/clean-1130-UNIQUE/full --playwright=PLAYWRIGHT_MODULE_PATH --browser=chrome
```
UNIQUE及模組路徑必須先換成實際值；不改測試內既有歷史比較基準。預留20～30GiB是規劃估算，非實測上限。保存新summary、log、來源／環境與必要狀態證據；不得把Windows新Full當Linux Full接受。

尚未結案：Linux Full DEFERRED、artifact正式保存契約、舊工具固定路徑依賴、新乾淨基準未執行、剩餘文件引用與刪除審查。本輪不解鎖任何工作。

## 7. 66條移轉結果

來源為第二階段已驗收對照表；21原已完整、33部分、7尚未、5歷史。處理結果21保留不重複、21補正式邊界並引用、19精確技術引用、5歷史定位。66項有文件處理不等於66項Runtime PASS，詳細契約仍依D2保留。下列風險是移轉時紀錄，不是本輪重新驗證結論。所有程式／測試證據均為靜態對照，未執行測試。

### M001 D1→D2、A01～A09批准與真實制度／研究來源

- 原章節：D2 §1–3；原狀態：HISTORICAL_SUPERSEDED；處理：HISTORICAL_INDEXED。
- 現行位置：[CURRENT_SPEC.md#d2-historical-design-index](../../CURRENT_SPEC.md#d2-historical-design-index)。
- 靜態依據：`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:92`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/receipt-replay.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：官方制度研究與遊戲門檻不是同一種證據；未重新查核外部規則。

### M002 P01～P08名稱、ID及適用一軍；舊大賞不等於P02/P08

- 原章節：D2 §4、§14.13.4；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`docs/src/engine/award-identity-policy.js:104`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-consumer-contract.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：逐一consumer待遇仍另列，不由ID推定。

### M003 P01四聯盟B/G：10/15、12/17、12/17、14/20；B曲線20+75比例

- 原章節：D2 §4.2.2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：本輪只讀條件；不宣稱自然平衡已證實。

### M004 P02承接原ERA/IP資格、原機率／保底及主R槽；停止新發舊賞

- 原章節：D2 §4.1／§4.2、§5.1；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：歷史LEGACY ID仍不可重新分類為P02。

### M005 P03最低／保底SO、原機率；正式名稱及舊名只讀alias

- 原章節：D2 §4.1／§4.2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：舊honors不得原地替換。

### M006 P04 NPB12／KBO10，原始W/(W+L)，.650/.850及B曲線

- 原章節：D2 §4.2.2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：浮點比較不可改用三位小數。

### M007 P05 CL、SV22/35與原抽選公式

- 原章節：D2 §4.1／§4.2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不因部門獎身分增加保護。

### M008 P06 MR、HLD18/30與原公式；非HP、不造救援勝

- 原章節：D2 §4.1／§4.2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：真實HP制度差異不是已授權新增欄位。

### M009 P08 NPB1/SP有效資料、W13/IP143/ERA3.20/G>0

- 原章節：D2 §13；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：IP為現行十進位資料模型，不另轉outs。

### M010 P08 IP180、S3=25/30/25/15/5、五項clamp錨點

- 原章節：D2 §13；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：未新增自然頂尖樣本。

### M011 P08 B2：60起10%、斜率2.5、上限95%、score95保證

- 原章節：D2 §13；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：機率曲線不是自然實得率。

### M012 P07同年同聯盟實際P01/P02/P03；不得由成績／字串推定

- 原章節：D2 §4／§5.1、§14.13.2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:92`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/receipt-replay.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：自然樣本未出新賞不等於整合fixture無效，反之亦然。

### M013 P07保證MVP但不取消原合法MVP槽；來源合併且效果一次

- 原章節：D2 §5.1、§14.13.2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:92`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/receipt-replay.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：舊槽不合資格時不得為保證再消耗主R。

### M014 DEPT/MAJOR/MVP市場／fallback／HOF主要權重；P07自身0

- 原章節：D2 §6、§14.13.4；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不是全consumer同一分類。

### M015 P08 phoenix生涯一次+8及本年NPB/SP保護，不autoMVP

- 原章節：D2 §14.1、§14.13.4；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：真實P08自然得獎平衡仍未驗證。

### M016 FULL獎金沿年度cap；不逐賞累加、不重算已付收入

- 原章節：D2 §6、§14.13.4；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：需保留contractId/year付款測試。

### M017 P01/P04 A候選及NPB13勝歷史分析

- 原章節：D2 §4.2候選／§4.2.1；原狀態：HISTORICAL_SUPERSEDED；處理：HISTORICAL_INDEXED。
- 現行位置：[CURRENT_SPEC.md#d2-historical-design-index](../../CURRENT_SPEC.md#d2-historical-design-index)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不得將舊13勝樣本與新12勝衍生分析混為同組。

### M018 IP150/IP190、G100、基本55／舊機率曲線與早期權重

- 原章節：D2 §4.3／§11／§12；原狀態：HISTORICAL_SUPERSEDED；處理：HISTORICAL_INDEXED。
- 現行位置：[CURRENT_SPEC.md#d2-historical-design-index](../../CURRENT_SPEC.md#d2-historical-design-index)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：手機2039仍為1.10.3 MANUAL_MOBILE_EVIDENCE/OFFLINE_ESTIMATE。

### M019 H1以前候選、Journal提案及取整候選

- 原章節：D2 §14.3／§14.4／§14.7；原狀態：HISTORICAL_SUPERSEDED；處理：HISTORICAL_INDEXED。
- 現行位置：[CURRENT_SPEC.md#d2-historical-design-index](../../CURRENT_SPEC.md#d2-historical-design-index)。
- 靜態依據：`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-journal-native.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不是所有候選都已批准或已實作。

### M020 完整年度順序：成績→舊槽→新Decision/P07/MVP→effects→salary→render

- 原章節：D2 §5.1；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:92`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/receipt-replay.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：CURRENT_SPEC未完整描述phaseMid與phaseEnd分工；不能重排R。

### M021 六欄固定順序及domain／實際初始化seed／year1..9999／聯盟／award／rule

- 原章節：D2 §14.13.1 canonical；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`tests/award-rng-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-vectors.json`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-validation.js`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：摘要不足以獨立重建canonical key。

### M022 UTF8、4-byte unsigned BE長度前綴、1024bytes、無BOM／JSON／delimiter

- 原章節：D2 §14.13.1 canonical；原狀態：UNTRANSFERRED；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`tests/award-rng-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-vectors.json`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-validation.js`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不同實作者可能得到不同hash。

### M023 single-player-v1是模型語意而非第七欄；schema/rule版本分離

- 原章節：D2 §14.13.1 canonical；原狀態：UNTRANSFERRED；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`tests/award-rng-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-vectors.json`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-validation.js`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：多人相同seed獨立抽選DEFERRED，不新增功能。

### M024 FNV種子/prime、imul32、avalanche常數與shift、u=hash/2^32

- 原章節：D2 §14.13.1 H1；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`tests/award-rng-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-vectors.json`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-validation.js`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：只寫H1名稱不是可重現完整契約。

### M025 canonical hex/hash/u golden vectors與Unicode/seed/year邊界

- 原章節：D2 §14.13.1 GV01～GV13；原狀態：UNTRANSFERRED；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`tests/award-rng-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-vectors.json`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-validation.js`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：本輪未執行Node／瀏覽器；Safari52是既有特定來源證據。

### M026 u*100<p、相等miss；新p0/100 hash=null與舊100%仍耗R

- 原章節：D2 §14.13.1 precision；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`tests/award-rng-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-vectors.json`（TEST_SOURCE_NOT_RUN）；`tools/development-a/g2-validation.js`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不能用新deterministic捷徑套舊槽。

### M027 binary64固定計算次序、P04原始比值、P08 decimalIP／era、無epsilon

- 原章節：D2 §14.13.1 precision；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/pitcher-award-policy.js:8`（PRODUCT_STATIC）；`docs/src/engine/game.js:1436`（PRODUCT_STATIC）；`tests/pitcher-award-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：顯示取整不能反饋判定；不是更改產品精度。

### M028 獨立抽選主R0；相同輸入舊槽資格／順序／結果不變

- 原章節：D2 §5.3／§14.13.1；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:92`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/receipt-replay.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：後續合法effects可改R分支，不能一概要求或放行整生涯一致。

### M029 WeakMap同S/year/frozenLeague隔離、完整key非32bit身分

- 原章節：D2 §14.13.2；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-journal-native.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：hash只是抽選值，非Decision唯一身分。

### M030 AnnualTx／Decision欄位、DECIDED與完成分離、S.awardDecisions原序

- 原章節：D2 §14.13.2；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-journal-native.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不能把設計示意物件當作現行S完整schema。

### M031 預配置槽→同步R→before/u/after記錄，無await/callback於gap

- 原章節：D2 §14.13.2；原狀態：UNTRANSFERRED；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-journal-native.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：R-record gap不支援任意恢復。

### M032 Receipt逐write path/presence/before/after、COMMITTED與CONFLICT拒覆寫

- 原章節：D2 §14.13.2；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-journal-native.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：結構相等不足以替代現行參照／所有權檢查。

### M033 phoenix glass/removed/trait/pool四寫入共享life-once

- 原章節：D2 §14.13.2；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-consumer-boundaries](../../CURRENT_SPEC.md#d2-consumer-boundaries)。
- 靜態依據：`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-journal-native.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/hall-of-fame-policy.js:29`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：只有pool+8摘要不能證明中斷後不重入。

### M034 honors／AS／trait／history獨立effect、salary evaluation年upsert／近三季

- 原章節：D2 §14.13.2；原狀態：UNTRANSFERRED；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-journal-native.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：尚需逐consumer覆蓋表，存在測試不等於任意中斷驗收。

### M035 contractId/year付款與獎金guard，HOF純導出不增量receipt

- 原章節：D2 §14.13.2；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不回溯重算既付薪資；不能誤稱全契約rollback。

### M036 完成權限只接受私有live proof；clone/序列化Decision不可信

- 原章節：D2 §14.13.2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`docs/src/engine/award-identity-policy.js:104`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-consumer-contract.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：重載後不是持久化已完成交易證明。

### M037 phaseMid含awards；proSeason已生成只續讀，不重simSeason/accStat

- 原章節：D2 §14.13.3；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：舊架構行號不是現行接線。

### M038 AWARD_PREPARED：凍結合法context與可寫原槽；不明部分成績停止

- 原章節：D2 §14.13.3 checkpoint table；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：設計checkpoint名非保證一對一對應產品phase字串；本輪未Runtime重測。

### M039 DRAW_RECORDED：已記原槽及新Decision，只續下一槽；gap停止

- 原章節：D2 §14.13.3 checkpoint table；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：設計checkpoint名非保證一對一對應產品phase字串；本輪未Runtime重測。

### M040 AWARD_EFFECTS_COMMITTED：所有本期effect提交，識別partial才續

- 原章節：D2 §14.13.3 checkpoint table；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：設計checkpoint名非保證一對一對應產品phase字串；本輪未Runtime重測。

### M041 SEASON_PAYMENT_COMMITTED：付款成功不等年度完成，只續描畫／選項

- 原章節：D2 §14.13.3 checkpoint table；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：設計checkpoint名非保證一對一對應產品phase字串；本輪未Runtime重測。

### M042 RESULT_RENDERED：saved result重畫，不重新計算或建立另一有效choice

- 原章節：D2 §14.13.3 checkpoint table；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：設計checkpoint名非保證一對一對應產品phase字串；本輪未Runtime重測。

### M043 WAIT_ALLOCATION／WAIT_CHOICE：原pool/dice/session/listener保留；未接受不執行action

- 原章節：D2 §14.13.3 checkpoint table；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：設計checkpoint名非保證一對一對應產品phase字串；本輪未Runtime重測。

### M044 CHOICE_COMMITTED：action一次，未知partial停止不全面rollback

- 原章節：D2 §14.13.3 checkpoint table；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：設計checkpoint名非保證一對一對應產品phase字串；本輪未Runtime重測。

### M045 YEAR_HANDOFF_COMMITTED：from/target/age/stageYr計畫；target不重增；nextPre不明停止

- 原章節：D2 §14.13.3 checkpoint table；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-execution-compatibility](../../CURRENT_SPEC.md#d2-execution-compatibility)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs:18`（TEST_SOURCE_NOT_RUN）；`tools/development-a/runtime.mjs:35`（TEST_SOURCE_NOT_RUN）。
- 保留風險：設計checkpoint名非保證一對一對應產品phase字串；本輪未Runtime重測。

### M046 同頁同S有限恢復；reload/host crash/OOM/任意phasePre不支援

- 原章節：D2 §14.13.3；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不能把安全停止寫成完整崩潰恢復PASS。

### M047 所有support IDs與MVP/ROOKIE/打者/GG/AS各consumer完整待遇矩陣

- 原章節：D2 §14.13.4 registry；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-consumer-boundaries](../../CURRENT_SPEC.md#d2-consumer-boundaries)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/hall-of-fame-policy.js:29`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：新人王、AS、守備與HR alias在consumer間不同待遇。

### M048 phoenix與demotion分離集合；G1-A日文漏判與國際MVP既有效果

- 原章節：D2 §14.13.4；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-consumer-boundaries](../../CURRENT_SPEC.md#d2-consumer-boundaries)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/hall-of-fame-policy.js:29`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不擴大GG復活、AS保護或舊跨league作用。

### M049 精確year/league/name解析、最長prefix、AllStar附註、未知不猜

- 原章節：D2 §14.13.4；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-identity-history](../../CURRENT_SPEC.md#d2-identity-history)。
- 靜態依據：`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`docs/src/engine/award-identity-policy.js:104`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-consumer-contract.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：year<1000向量不代表歷史UI有三位年格式。

### M050 semantic去重不動raw honors文字／順序／重複；來源保留

- 原章節：D2 §14.13.4；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`docs/src/engine/award-identity-policy.js:104`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-consumer-contract.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：不全域清理歷史字串。

### M051 新名displayName／舊originalText、卡片／成就／退休PNG折行及取得說明時機

- 原章節：D2 §14.13.4；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-consumer-boundaries](../../CURRENT_SPEC.md#d2-consumer-boundaries)。
- 靜態依據：`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:92`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/receipt-replay.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/hall-of-fame-policy.js:29`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：Chromium尺寸不是實機B完整UI驗收。

### M052 可信alias來源可證才採用；中文候選不得自動全域加入

- 原章節：D2 §14.13.6 AF08 #1；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-identity-history](../../CURRENT_SPEC.md#d2-identity-history)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M053 未知歷史個人賞保留原文只讀、不推效果

- 原章節：D2 §14.13.6 AF08 #2；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M054 不補發歷史phoenix+8

- 原章節：D2 §14.13.6 AF08 #3；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-identity-history](../../CURRENT_SPEC.md#d2-identity-history)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M055 不重算已支付薪資或已完成合約

- 原章節：D2 §14.13.6 AF08 #4；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M056 不重新抽取已結算歷史賞

- 原章節：D2 §14.13.6 AF08 #5；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-identity-history](../../CURRENT_SPEC.md#d2-identity-history)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M057 不全面改寫S.honors

- 原章節：D2 §14.13.6 AF08 #6；原狀態：COMPLETE；處理：RETAINED_UNCHANGED。
- 現行位置：[CURRENT_SPEC.md#d2-current-spec](../../CURRENT_SPEC.md#d2-current-spec)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M058 國際／團隊及範圍外consumer保持原行為

- 原章節：D2 §14.13.6 AF08 #7；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-identity-history](../../CURRENT_SPEC.md#d2-identity-history)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M059 不順改舊跨聯盟當年度保護

- 原章節：D2 §14.13.6 AF08 #8；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-identity-history](../../CURRENT_SPEC.md#d2-identity-history)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M060 不用模糊王或MVP substring識別個人賞

- 原章節：D2 §14.13.6 AF08 #9；原狀態：PARTIAL；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-identity-history](../../CURRENT_SPEC.md#d2-identity-history)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M061 UNKNOWN個人賞與NOT_IN_SCOPE分離，衝突停報

- 原章節：D2 §14.13.6 AF08 #10；原狀態：UNTRANSFERRED；處理：SPEC_BOUNDARY_ADDED_WITH_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-identity-history](../../CURRENT_SPEC.md#d2-identity-history)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-identity-policy.js:57`（PRODUCT_STATIC）；`tests/award-identity-policy.test.mjs:1`（TEST_SOURCE_NOT_RUN）。
- 保留風險：consumer-local精確舊名稱層是後續批准的實作補充；不得提升為全域可信P-ID。

### M062 原始產品／技術驗收案例集與各輸入預期

- 原章節：D2 §8 T01～T50、§14.8 TR01～TR14；原狀態：UNTRANSFERRED；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:92`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/receipt-replay.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：本表為條款群組，不宣稱逐一T/TR均完成Runtime映射；此細項證據仍待核對。

### M063 日文漏判、歷史ID、待遇與UI原生整合驗收

- 原章節：D2 §14.11 AN01～AN05／§14.13.5 F-ID01～12；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-consumer-policy.js:11`（PRODUCT_STATIC）；`docs/src/engine/award-consumer-policy.js:118`（PRODUCT_STATIC）；`tests/award-consumer-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-legacy-consumer.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-history-b-comparison.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：測試名稱／覆蓋不等所有歷史未知資料均安全可識別。

### M064 Journal/Receipt原生故障、fixture與真producer驗收邊界

- 原章節：D2 §14.13.5 F-A04/A06/A07、F-B01～12；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/award-journal-native.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：G3完成fixture不能冒充G6/G7整合PASS。

### M065 年度／callback／跨平台golden驗收與停止邊界

- 原章節：D2 §14.13.5 F-YEAR/F-GV；原狀態：PARTIAL；處理：PRECISE_TECHNICAL_REFERENCE。
- 現行位置：[CURRENT_SPEC.md#d2-technical-contract-index](../../CURRENT_SPEC.md#d2-technical-contract-index)。
- 靜態依據：`docs/src/engine/game.js:2101`（PRODUCT_STATIC）；`docs/src/engine/game.js:3227`（PRODUCT_STATIC）；`docs/src/engine/game.js:3286`（PRODUCT_STATIC）；`tools/development-a/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tests/season-payment-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`tests/salary-evaluation-receipt.test.mjs`（TEST_SOURCE_NOT_RUN）；`docs/src/engine/award-rng-policy.js:20`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:38`（PRODUCT_STATIC）；`tests/award-transaction-policy.test.mjs:6`（TEST_SOURCE_NOT_RUN）。
- 保留風險：Safari G2是相同產品來源證據，不外推整套B手機。

### M066 NOT_IMPLEMENTED/NOT_AUTHORIZED/PLANNED等設計時點標籤

- 原章節：D2 §14.13.7、文件舊狀態標籤；原狀態：HISTORICAL_SUPERSEDED；處理：HISTORICAL_INDEXED。
- 現行位置：[CURRENT_SPEC.md#d2-historical-design-index](../../CURRENT_SPEC.md#d2-historical-design-index)。
- 靜態依據：`docs/src/engine/game.js:1393`（PRODUCT_STATIC）；`docs/src/engine/award-transaction-policy.js:92`（PRODUCT_STATIC）；`tests/pitcher-award-integration.test.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/runtime.mjs`（TEST_SOURCE_NOT_RUN）；`tools/development-b/receipt-replay.mjs`（TEST_SOURCE_NOT_RUN）。
- 保留風險：AF09舊未授權不代表本輪可實作；發布不代表LinuxFull已接受。


## 8. 75份來源逐檔對照

以下為整合前實際內容SHA256及bytes。A=14已追蹤保留檔；B=7本地保留／待確認；C=54條件候選，不表示可立即刪除。JSON原始counts照錄，不跨重測加總；無標準counts者不推造PASS。雜湊僅是指紋，不是備份。

### S001

- 路徑：`docs/CURRENT_DOCUMENTATION.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；5232 bytes。
- SHA256：`c62ea1079c5a74d439ee9a474b0f3315de1cdd78f54f916c2b25bfda71c1e0ef`。
- 內容對照：第1、5、7節：導航／文件清查與移轉。不產生新PASS統計。

### S002

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_INVENTORY.json`。
- 歸屬：B_LOCAL_KEEP_REVIEW；未追蹤；18763630 bytes。
- SHA256：`802e500b34cb3189cf8bdd743bc3303aa23aa00e36648fec483119610a0c1d00`。
- 內容對照：第1、5、7節：導航／文件清查與移轉。原始統計欄位：`{"A":9,"F":4520,"G":24056,"B":1}`。

### S003

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_PLAN.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；12233 bytes。
- SHA256：`1a92ff2be5e7a4386f38199be22ebc1c3edeb124ae97bfd10ce90898b18041c6`。
- 內容對照：第1、5、7節：導航／文件清查與移轉。不產生新PASS統計。

### S004

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE2_ANALYSIS.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；16441 bytes。
- SHA256：`bfb8f782f576719abdbed730e3bec7738fef19618e8d671ef0283fad6e77ae6a`。
- 內容對照：第1、5、7節：導航／文件清查與移轉。不產生新PASS統計。

### S005

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE2_CLAUSE_MAP.json`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；54156 bytes。
- SHA256：`e91f4198ba3dcfc4879f08db64bc975fe098549107604fab36e3b93ae5303cac`。
- 內容對照：第1、5、7節：導航／文件清查與移轉。原始統計欄位：`{"HISTORICAL_SUPERSEDED":5,"COMPLETE":21,"PARTIAL":33,"UNTRANSFERRED":7}`。

### S006

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE2_MIGRATION.diff`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；29393 bytes。
- SHA256：`368b8628671067af1ae002d59f1dd645b361ada69aacc2bff2b4fbdb73ceb5c3`。
- 內容對照：第1、5、7節：導航／文件清查與移轉。不產生新PASS統計。

### S007

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE2_MIGRATION.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；12680 bytes。
- SHA256：`b82e500c67279c73f068404f9421a7d9e6f6a43c83a20fa96100c397f18220f5`。
- 內容對照：第1、5、7節：導航／文件清查與移轉。不產生新PASS統計。

### S008

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE2_MIGRATION_RESULTS.json`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；115004 bytes。
- SHA256：`def7997f5f5337c9d8be7ac796ef03d3a3de6907cd5b0ce64bcaf0fd12320e8a`。
- 內容對照：第1、5、7節：導航／文件清查與移轉。原始統計欄位：`{"HISTORICAL_INDEXED":5,"RETAINED_UNCHANGED":21,"SPEC_BOUNDARY_ADDED_WITH_REFERENCE":21,"PRECISE_TECHNICAL_REFERENCE":19}`。

### S009

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE3_BATCH_PLAN.md`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；8970 bytes。
- SHA256：`37e54b8d262c5c0bfeb898e58207a9a98e2de0867ad3801f49a4db1381d07519`。
- 內容對照：第3、5節：相容性調查／歷史清理規劃。不產生新PASS統計。

### S010

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE3_CANDIDATES.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；838262 bytes。
- SHA256：`07912344355aa34877f046e4149db89b87c3a7b3a987f7d3d7ce0ebd18cc1a91`。
- 內容對照：第3、5節：相容性調查／歷史清理規劃。原始統計欄位：`{"safeCandidates":0,"conditionalCandidateFiles":156,"documents":596,"documentStatuses":{"MUST_KEEP":589,"BLOCKED":7},"explicitProtectedArtifacts":140}`。

### S011

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE3_CAPACITY.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；24008 bytes。
- SHA256：`08a11bebbb9c91d0d9366c846fb3df73194d90f1f6d984dfed58a0ad4cf72003`。
- 內容對照：第3、5節：相容性調查／歷史清理規劃。不產生新PASS統計。

### S012

- 路徑：`docs/reviews/DOCUMENT_AUDIT_1130_STAGE3_CLEANUP_ANALYSIS.md`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；15943 bytes。
- SHA256：`2995d2c4cd84667ab1e1b6c994855c21998f097a0a44e8f29bdf58dce589f319`。
- 內容對照：第3、5節：相容性調查／歷史清理規劃。不產生新PASS統計。

### S013

- 路徑：`docs/reviews/G1_B2_CONSUMER_COMPATIBILITY_REVIEW.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；18867 bytes。
- SHA256：`dd2426210d070977a29547e9f001f80f37038c50609d9c9df1f20302598b5335`。
- 內容對照：第3、5節：相容性調查／歷史清理規劃。不產生新PASS統計。

### S014

- 路徑：`docs/reviews/G1_B_PRE_IMPLEMENTATION_REVIEW.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；18465 bytes。
- SHA256：`211c6adde513d95c20ef7f9d9f59b6941a9cc5630fdc15ee01c74231daf0a942`。
- 內容對照：第3、5節：相容性調查／歷史清理規劃。不產生新PASS統計。

### S015

- 路徑：`docs/reviews/LINUX_CHROMIUM_SMOKE_ACCEPTANCE.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；1976 bytes。
- SHA256：`b5e2ceae0848f4a37c641471b54a2ff9296122e22139481d0d255d8c508f1804`。
- 內容對照：第2、5節：驗收／發布／遷移。不產生新PASS統計。

### S016

- 路徑：`docs/reviews/LINUX_FULL_38838485336_ACCEPTANCE.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；2487 bytes。
- SHA256：`75016747d0c419babe080c5cf2b93a7a79fde3a1d0ebc534899a847e7b83f93a`。
- 內容對照：第2、5節：驗收／發布／遷移。不產生新PASS統計。

### S017

- 路徑：`docs/reviews/LOCAL_MIGRATION_1130_MANIFEST.json`。
- 歸屬：B_LOCAL_KEEP_REVIEW；未追蹤；186171 bytes。
- SHA256：`c62af2afb14eddd1486425d70247dbaf9a6ed35ff47f22c5d1839e3877a85244`。
- 內容對照：第2、5節：驗收／發布／遷移。不產生新PASS統計。

### S018

- 路徑：`docs/reviews/MIGRATE_UNCOMMITTED_1130.ps1`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；5859 bytes。
- SHA256：`203599b9b9debc9b1056bf5b6bf4d066c34214025a66cf3073a0e444533acf9a`。
- 內容對照：第2、5節：驗收／發布／遷移。不產生新PASS統計。

### S019

- 路徑：`docs/reviews/RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；10433 bytes。
- SHA256：`43fe567a023a44cd568264665b36013cc5abbc9a915a6173f4de55032dcb1b1f`。
- 內容對照：第2、5節：驗收／發布／遷移。不產生新PASS統計。

### S020

- 路徑：`docs/reviews/RELEASE_1130_PRODUCTION_ACCEPTANCE.md`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；2803 bytes。
- SHA256：`8fe8729bd6b4c440c02c95ffe20264d43231cc53da2c733d6272000c9837242d`。
- 內容對照：第2、5節：驗收／發布／遷移。不產生新PASS統計。

### S021

- 路徑：`docs/reviews/TEST_RESULTS_1130_CLEANUP_EXECUTION.md`。
- 歸屬：B_LOCAL_KEEP_REVIEW；未追蹤；4356 bytes。
- SHA256：`dc9c715f9ca718c442bf2b9cc18b07d3053e47f669a53c7e47e77b5997eaad7c`。
- 內容對照：第5、6節：清理執行／依賴／重建。不產生新PASS統計。

### S022

- 路徑：`docs/reviews/TEST_RESULTS_1130_CLEANUP_MANIFEST.json`。
- 歸屬：B_LOCAL_KEEP_REVIEW；未追蹤；267846 bytes。
- SHA256：`7f392f35c55a0b9e15f518dc520eb45bc82a3aa2135fd64404c8cda7288c69e9`。
- 內容對照：第5、6節：清理執行／依賴／重建。不產生新PASS統計。

### S023

- 路徑：`docs/reviews/TEST_RESULTS_1130_CLEANUP_PATHS.json`。
- 歸屬：B_LOCAL_KEEP_REVIEW；未追蹤；2061279 bytes。
- SHA256：`038c514b416d9c654ef9777d6ca183b3951530be24d9d176db41597f63444fe6`。
- 內容對照：第5、6節：清理執行／依賴／重建。不產生新PASS統計。

### S024

- 路徑：`docs/reviews/TEST_RESULTS_1130_CLEANUP_PREPARATION.md`。
- 歸屬：B_LOCAL_KEEP_REVIEW；未追蹤；12021 bytes。
- SHA256：`abc9fb699bade81f54a53037946d2318c034c0e70133125566a2e6d24efd5b60`。
- 內容對照：第5、6節：清理執行／依賴／重建。不產生新PASS統計。

### S025

- 路徑：`docs/reviews/TEST_RESULTS_1130_DEPENDENCY_MATRIX.json`。
- 歸屬：B_LOCAL_KEEP_REVIEW；未追蹤；94558 bytes。
- SHA256：`d70e0e4770a31a7933b14e59ab8fdfe9333659ffe6089831d4ee95db39e57230`。
- 內容對照：第5、6節：清理執行／依賴／重建。不產生新PASS統計。

### S026

- 路徑：`docs/reviews/TEST_RESULTS_1130_EXECUTE_APPROVED_CLEANUP.ps1`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；10317 bytes。
- SHA256：`8c3b23cd06879f0ad75764ff6f3b41ba0bcc37e380a83d2fd2e1e2be8725566f`。
- 內容對照：第5、6節：清理執行／依賴／重建。不產生新PASS統計。

### S027

- 路徑：`docs/reviews/development-b/g5-after-phase-adjustment.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；16257 bytes。
- SHA256：`adb1cfcddb0cdfdb59cd1f0503ff492677a383ac524b292e284b64ba1855ed01`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":5,"FAIL":0,"BLOCKED":0}`。

### S028

- 路徑：`docs/reviews/development-b/g5-alternate-prefix-before-fix.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1024 bytes。
- SHA256：`aa24f39f583cd3df9b40b592ec8e6f81cc7077cd78b546718b1f6b4cc277b4db`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S029

- 路徑：`docs/reviews/development-b/g5-alternate-prefix-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1144 bytes。
- SHA256：`d55fe2542d7bd134b2199b842b95fff91b2b43e04e76f2eec9a0b50ea37be591`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S030

- 路徑：`docs/reviews/development-b/g5-before-phase-adjustment-fail.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；25427 bytes。
- SHA256：`c59244089124b31f9c80ebaecb7c70c957eef0f48b5ea6507dd4ac399cd8b65d`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":3,"BLOCKED":0}`。

### S031

- 路徑：`docs/reviews/development-b/g5-candidate-before-stop/hall-of-fame-policy.js`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1710 bytes。
- SHA256：`7fd7fd86a5169c52fe302f9a909603c903c7bfa83cadeef6a38538d3087c9add`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S032

- 路徑：`docs/reviews/development-b/g5-candidate-before-stop/incentive-policy.js`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；2008 bytes。
- SHA256：`1825dfbfb12964c2e5bac23acd5cb4f54916b29a495df820aa07ade3fd8c0a54`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S033

- 路徑：`docs/reviews/development-b/g5-candidate-before-stop/salary-evaluation-policy.js`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；7684 bytes。
- SHA256：`5861d26722cab8759feaffb4783ccd8469297dc4c0a3cbe7ec8fb1d0500eff72`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S034

- 路徑：`docs/reviews/development-b/g5-candidate-before-stop/salary-evaluation-policy.test.mjs`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；10182 bytes。
- SHA256：`fd658f674604d5e61c18d272bae7695f429859b79992a787e0b9d8831b522e19`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S035

- 路徑：`docs/reviews/development-b/g5-candidate-before-stop/salary-promotion-policy.js`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；4866 bytes。
- SHA256：`c72a8c338b7f44a5afb9df565572fc28bed1fa822682f0f40912a60a702bfe42`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S036

- 路徑：`docs/reviews/development-b/g5-candidate-before-stop/salary-promotion-policy.mjs`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；6021 bytes。
- SHA256：`e505f2773d1a2c369a5a3f88d2a84b6386f45f53b47fa70251d303f7d2037d79`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S037

- 路徑：`docs/reviews/development-b/g5-consumer-compatibility-before-stop.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；8143 bytes。
- SHA256：`ba9612fe746c0d77c4c33eb45e84a3981f4d2accc5f16d512dc2be4392c31d3d`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S038

- 路徑：`docs/reviews/development-b/g5-consumer-compatibility-isolated-replay.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；8222 bytes。
- SHA256：`c471b7e1a42360885224f741cc66f1c20a566bc47a27b6deb513ae6d092be474`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S039

- 路徑：`docs/reviews/development-b/g5-defense-phrase-before-fix.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；5340 bytes。
- SHA256：`09a254fd91e0cfaac295eea084fa9b735551099b08c919817057c38466b4fc62`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S040

- 路徑：`docs/reviews/development-b/g5-defense-phrase-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；3593152 bytes。
- SHA256：`4804b5c0d67fa3a2309999ac7a379d85da5cf273864ffca24fb7776f6f64812e`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":5,"FAIL":0,"BLOCKED":0}`。

### S041

- 路徑：`docs/reviews/development-b/g5-effect-format-matrix-attempt1.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1076 bytes。
- SHA256：`27c520919ad09df5ee4240eb5e51a182d607b45c8361d866c820dff4054e27a5`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S042

- 路徑：`docs/reviews/development-b/g5-effect-format-matrix-final.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1014394 bytes。
- SHA256：`0c432a2d1f8f58a99f7e70598f8b9c8a8f41c221b0f37e46053dbbed94433be4`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":6,"FAIL":0,"BLOCKED":0}`。

### S043

- 路徑：`docs/reviews/development-b/g5-extended-effect-matrix.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；3879724 bytes。
- SHA256：`0811df3835a639b3774087a3d7c2a9d56293768319efe5bf0c8a3554f9c4b3d0`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":7,"FAIL":0,"BLOCKED":0}`。

### S044

- 路徑：`docs/reviews/development-b/g5-extended-legacy-native-wired.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；2283159 bytes。
- SHA256：`9929b3f7da8ac097e08e52da135a328e3eeb0c5a2f16e4037f61a070e9048b01`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始頂層PASS=6600，FAIL=0。

### S045

- 路徑：`docs/reviews/development-b/g5-hof-all-targets-final.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1417712 bytes。
- SHA256：`df3783ef8ef5efa22d9483e4d26c994a9d30797266efba0f507651bed1f96607`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S046

- 路徑：`docs/reviews/development-b/g5-legacy-consumer-attempt1.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；693815 bytes。
- SHA256：`4a4f5d69dc7390e739db1fd7badba31e90c32cc82b4e22d7438808e9d0e2da03`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始頂層PASS=2460，FAIL=0。

### S047

- 路徑：`docs/reviews/development-b/g5-legacy-consumer-native-wired.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；862176 bytes。
- SHA256：`aca87bc0baf1473887cfeaa6705744716b4970e780046dcae14bfefb37129fc3`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始頂層PASS=2460，FAIL=0。

### S048

- 路徑：`docs/reviews/development-b/g5-legacy-consumer-wired.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；693815 bytes。
- SHA256：`4a4f5d69dc7390e739db1fd7badba31e90c32cc82b4e22d7438808e9d0e2da03`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始頂層PASS=2460，FAIL=0。

### S049

- 路徑：`docs/reviews/development-b/g5-legacy-slot-source-final.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；14682 bytes。
- SHA256：`7fb776666fd250d590d7500e30a80498632eb81fd5abc5fd7d9bf8aeca4de704`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S050

- 路徑：`docs/reviews/development-b/g5-legacy-slot-source-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；634 bytes。
- SHA256：`324685b4055b08e2678229529a19931f913ef5b7594dbf5aa2a854e781210d6e`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S051

- 路徑：`docs/reviews/development-b/g5-no-league-effect-before-fix.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；2508 bytes。
- SHA256：`c0cb6260bbbb95e4f07a2a0c1bccfdaa3f7f13f0a0d8dcc5186921a20b84c28b`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S052

- 路徑：`docs/reviews/development-b/g5-no-league-effect-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；5184 bytes。
- SHA256：`a976ac18f482674554dd3cb8c5a049132e86f0f4c3406c578dad6cff7cbc8b6c`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":4,"FAIL":0,"BLOCKED":0}`。

### S053

- 路徑：`docs/reviews/development-b/g6-history-guard-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；2579 bytes。
- SHA256：`4433da93954ec4c10a73deb225849c4361251441bb68ab2f645b736a110a81f7`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S054

- 路徑：`docs/reviews/development-b/g6-history-guard-retest2.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；4745 bytes。
- SHA256：`5e7ebf6b730a6e9654a58cbffbbd147d665ef833f968f413301ca68c20b05fa4`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":2,"FAIL":1,"BLOCKED":0}`。

### S055

- 路徑：`docs/reviews/development-b/g6-independent-payments-attempt1.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1485 bytes。
- SHA256：`9f6f89d600e350c05653e5d9c8509aa4df556f9cfd5119002a6e5872dffb7602`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S056

- 路徑：`docs/reviews/development-b/g6-native-integration-attempt1.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；12738 bytes。
- SHA256：`4e4c3c6623fbf3f0d2dfbf2d07f0a3aac35287b4c35e6870810ddd69a86611e0`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S057

- 路徑：`docs/reviews/development-b/g6-native-integration-attempt2.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；2667 bytes。
- SHA256：`d66ddc0be46dcd26107f53bea38c433c0a63e7f5b9646e9818e4630c0f6d1e28`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S058

- 路徑：`docs/reviews/development-b/g6-native-integration-attempt3.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；10248 bytes。
- SHA256：`a989d138d41465cb684bc70c524c1619845f9515061196e0a26196d7a8ed79d5`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":4,"FAIL":0,"BLOCKED":0}`。

### S059

- 路徑：`docs/reviews/development-b/g6-new-history-guard-before-fix.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；2573 bytes。
- SHA256：`df8ccb9fbde5e245c3bedae0a0db216301a2fa8ee18b83d2aa5e2ca6adac9b6f`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S060

- 路徑：`docs/reviews/development-b/g6-probabilistic-producers-evidence.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；356130 bytes。
- SHA256：`8dd7c7f1cb2f7f95b2cb379bd0ec5d0683d991dfe43ac4fe69118e4123acfb14`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S061

- 路徑：`docs/reviews/development-b/g6-probabilistic-producers-final.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；19130 bytes。
- SHA256：`c0db9159a95f6a42912a675f337b99fba9bd28b799ab44abc8fbf9851d6cfcb0`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S062

- 路徑：`docs/reviews/development-b/g6-probabilistic-producers-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；16355 bytes。
- SHA256：`1f84be1b12d0c384b5bc6a9e21ef239c5f8fe0db60651be2771b5a1b0b857c0e`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":0,"FAIL":1,"BLOCKED":0}`。

### S063

- 路徑：`docs/reviews/development-b/g6-probabilistic-producers-retest2.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；24201 bytes。
- SHA256：`f0dcc4af6219eb8ebf73f0a270e5457fe5cc6cbd7cefe4533f0d729caad780aa`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S064

- 路徑：`docs/reviews/development-b/g6-trait-hof-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1142 bytes。
- SHA256：`1b5d295b4b49654130ae912fab0e843a09bd506a0d71c4327741829a927862e0`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":2,"FAIL":0,"BLOCKED":0}`。

### S065

- 路徑：`docs/reviews/development-b/g7-edge-cases-attempt1.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1436 bytes。
- SHA256：`565616fab6f06d1fe65b9c8779da68fa0cef588578b28194ba9a7d835761f226`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S066

- 路徑：`docs/reviews/development-b/g7-native-metadata-attempt1.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；4841 bytes。
- SHA256：`13a83701b021634eacb14b2b644b11f278d626b9068c6228821fe6aee210ae65`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":2,"FAIL":1,"BLOCKED":0}`。

### S067

- 路徑：`docs/reviews/development-b/g7-phase-fixture-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；8028 bytes。
- SHA256：`c671854befd72231842091771bef8634798c8cc2fbc40f0e025ac32f2f6d3c9d`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":4,"FAIL":0,"BLOCKED":0}`。

### S068

- 路徑：`docs/reviews/development-b/g7-receipt-replay-final.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；200835 bytes。
- SHA256：`8e614e48e9ff40a711d522489148342aee03317deaa5fe3ec04c4832ed89a76f`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S069

- 路徑：`docs/reviews/development-b/g8-history-validator-attempt1.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1508 bytes。
- SHA256：`e8e45de3b1c91f8ea9c91878e2dbdcd0b86b4835cb35591758fb5cba440252b3`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S070

- 路徑：`docs/reviews/development-b/g8-natural-private-receipt-validation.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1744 bytes。
- SHA256：`4ff2832151e8d6c64e2ae9a5b5380d19e819c56ec7e484cae16238fe521e40df`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始頂層PASS=4，FAIL=0。

### S071

- 路徑：`docs/reviews/development-b/g8-producer-rename-saved-reanalysis.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；11137 bytes。
- SHA256：`e4da055bd8129eedfe39cda4315446468fc0f0626c40d04e10a5f96ccb020b43`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S072

- 路徑：`docs/reviews/development-b/g8-producer-rename-unit-retest.json`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；1633 bytes。
- SHA256：`9df41c224c77921f4ecfe26dde084458e6cef72003da05f30885e4e4e200f5d4`。
- 內容對照：第3、4節：B歷史診斷／候選來源。原始統計欄位：`{"PASS":1,"FAIL":0,"BLOCKED":0}`。

### S073

- 路徑：`docs/reviews/development-b/receipt-careers-expanded-before-stop.mjs.snapshot`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；5252 bytes。
- SHA256：`f2ae071ca51a1d95e5b883c9603e892a808bfe35ed2afa071328eee4ce94376f`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S074

- 路徑：`docs/reviews/development-b/receipt-careers-v2-before-assert-fix.mjs.snapshot`。
- 歸屬：C_CONDITIONAL_CLEANUP；未追蹤；5995 bytes。
- SHA256：`c4eb22934e021670d867d71c2ba6a843a5984a12bd8154392c6271feebb9e035`。
- 內容對照：第3、4節：B歷史診斷／候選來源。不產生新PASS統計。

### S075

- 路徑：`docs/reviews/g1-a-validation/fixtures-double-wings.mjs`。
- 歸屬：A_RECOMMEND_COMMIT；已追蹤；14296 bytes。
- SHA256：`e5ed607f2c4016f05546221a41474c01d423358f4b363a6dd603ace0391ee15d`。
- 內容對照：第3、6節：可執行歷史fixture，全文不能由摘要取代。不產生新PASS統計。


## 9. 整合範圍與驗證聲明

本文件只提供精簡閱讀入口、歷史狀態與逐檔可追溯索引，不是原始payload封存。特別未完整嵌入：大規模逐檔inventory／刪除清單／metadata、原始JSON完整fixture輸入輸出、候選程式全文、g1-a可執行fixture。原始75檔仍需保留到另外審查完成。

若日後刪除61個未追蹤來源，其未提交payload將不因本文件保留hash而可重建；14個已提交來源可由Git取回，但仍須維護現行文件引用。D2唯一契約、正式fixture及測試程式不可用本摘要取代。

本輪驗收只做文件／引用／66與75索引完整性、原來源hash及Git狀態檢查。Quick、Full、Runtime、Linux CI均NOT_RUN；沒有新增產品驗收結論。沒有修改產品、VERSION、Runner、CI、golden或原75檔；沒有刪除、commit或push。後續引用遷移、原檔清理、新基準測試需另外批准。

# D2 G9：CI timeout／bounded evidence collector 限定驗收

## 1. 結論與停止線

**PARTIAL / ARTIFACT_COVERAGE_BLOCKED**。120分鐘job timeout已依批准修改；獨立collector及限定測試已實作。合成fixture的宣告證據可逐byte還原，但實際舊Quick／Full產物尚不能完整、安全地封裝，**不具備替換原tmp glob的條件**。

依使用者停止條件，不新增collector的CI執行步驟、不移除或擴大任何現行artifact glob；保留原觸發、Full入口、各測試timeout、斷言、Runner、套件版本及發布流程。沒有commit／push／merge／部署／歷史產物清理，沒有Full重跑。此報告不把舊artifact方案稱為完整：原先四個非yakyujinsei前綴目錄的缺口仍存在。

基準：dev HEAD `56e72d9792529f3221c1a1ffadaf563bceebe26d`；既有工作樹版本1.13.0，正式Git HEAD的受驗版本仍1.12.0。本輪不fetch／pull，不宣稱追蹤ref代表即時遠端狀態。不修改任何產品來源；開始時12個staged檔與平行變更均保留。

風險：collector是未接CI／產品的R1獨立工具；workflow設定按L2檢查。執行原生Node工具測試、故障注入、下載副本還原、workflow parser與本輪Quick；Full依本次明確指示NOT_RUN，Linux CI與真正GitHub artifact下載NOT_RUN。沒有沿用舊PASS冒充新執行。

## 2. 精確修改範圍

僅新增／修改5個檔案，另保留先前12個staged檔：

1. `.github/workflows/test.yml`：唯一diff如下，其他位元組內容以原有LF／CRLF處理比較完全一致。
2. `scripts/check-workflow.mjs`：`assert.equal(job['timeout-minutes'],60)`精確更新為120；其餘觸發／版本／權限／不部署斷言不變。這是批准設定的嚴格期待值同步，不降低斷言。
3. `scripts/collect-ci-evidence.mjs`：Node內建fs／crypto／zlib的獨立封裝、校驗、還原工具；無npm依賴、不接Runner。
4. `tools/development-g9/ci-evidence-collector.test.mjs`：明確手動限定入口，不登錄tests manifest，不增減既有Quick／Full範圍。
5. 本報告。先前[發布準備報告](PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)保持已審原文；其「方案待審」是當時狀態，不覆寫歷史記錄。

```diff
--- a/.github/workflows/test.yml
+++ b/.github/workflows/test.yml
@@
-    timeout-minutes: 60
+    timeout-minutes: 120
```

沒有collector step或新增upload path，三個tmp glob全部保持。不得因工具單元測試PASS推定正式Gate證據已足夠。

## 3. Collector契約與安全界線

介面：`collectEvidence()`、`verifyEvidence()`、`restoreEvidence()`；CLI範例（output必須是新目錄，不能覆寫）：

```sh
node scripts/collect-ci-evidence.mjs --input=test-results/ci --output=test-results/ci-evidence --repo=.
node scripts/collect-ci-evidence.mjs --verify=test-results/ci-evidence --expected-index-sha256=<trusted-index-hash>
node scripts/collect-ci-evidence.mjs --restore=<downloaded-bundle> --output=<new-directory> --expected-index-sha256=<trusted-index-hash>
```

- 封裝格式：`index.json`、`index.sha256`及每份原件的獨立`payload/NNNNN.gz`。保留原檔內容，檢查原SHA、gzip SHA、解壓SHA、還原後檔案SHA；不做有損裁剪或原地脫敏。
- 64 MiB單原件上限、256 MiB封裝總預算；索引／校驗碼也算容量，先保留索引空間。不可透過CLI上調已批准上限。超限明列問題，原件留在input，不以hash替代raw資料。
- 根Runner summary的schema／counts／結果衝突、log預期SHA及每個宣告required檔都嚴格驗證。所有summary／log都要求保存；root run有FAIL／BLOCKED或summary損壞時，因沒有可信的失敗case路徑對照，保守要求所有tmp原件，不猜測哪些可省。
- `--requirements=<json>`可提供schemaVersion1、`files:[{path,sha256}]`及`reviewedBinaries:[{path,sha256}]`；只接受精確相對路徑與SHA，不接受glob、不允許重複或穿越路徑。這只是宣告保存集合，**不是正式Gate已覆蓋的認證**。
- 掃描UTF8、JSON／NDJSON解析、解碼後字串中的敏感路徑及常見credential格式，避免JSON escape繞過。PNG只接受明確人工審核的相同hash及PNG檔頭；未知binary不自動上傳。不宣稱regex可辨識所有個資，也不宣稱PNG內容已經OCR驗證。
- 檔案不可讀時SHA標null並明記INVENTORY_UNREADABLE，絕不捏造hash；因此整體EVIDENCE_BLOCKED。來源、路徑、安全、損壞、數量或容量問題均不能轉為完整成功。
- 未宣告的成功輸出只入索引，明標不可還原。`DECLARED_EVIDENCE_COMPLETE`僅代表已宣告集合完整；`coverage.formalGates`固定NOT_ESTABLISHED，不偽稱G2～G8／Full全部證據完備。
- 原測試status／exit17等不改寫。原完整summary／log若含本機個人絕對路徑，寧可拒絕公開並報BLOCKED，不悄悄改寫後仍聲稱raw原件相同。
- index的collection-time來源hash與原summary的受驗head／fingerprint／版本分離。舊Full不能拿目前工作樹來源hash冒充當時受驗來源；需另核對原封存manifest。只提供sidecar時是完整性、不是來源認證，下載還原建議附外部可信index hash。
- 不接受symlink／junction、既存output、輸入樹內output、重複／非法路徑或未列入index的bundle檔；解壓有大小上限。BLOCKED bundle不得被還原成「完整證據」。原始輸入只讀，失敗也不刪除／搬移原件。

## 4. 測試結果、故障及還原

環境：Windows x64／Node24.15.0；workflow YAML parser使用既有外部Playwright1.62.1。沒有新增套件。

- 最終collector：`node tools/development-g9/ci-evidence-collector.test.mjs`，**47 PASS／0 FAIL，4.000秒，exit0**。保存於`test-results/g9-evidence-selftest-9KoB1q/summary.json`；SHA256 `69e8d7c73cc6dc9d9cb90f79906000b6e8f47aece63fb4577b47b8e5e0305697`。
- 涵蓋：正常完整summary／log＋S／RNG／Decision／Receipt、真實exit17保全、成功但未宣告的原件、缺summary／log／Gate輸入、截斷與損壞JSON／NDJSON、counts／exit衝突、原件／log hash不符、64MiB精確邊界及超限、256MiB上限與低預算超額、偽造／escaped secret、個人路徑、UTF8、PNG審核、路徑穿越／junction、覆寫拒絕、偽完整manifest、下載缺檔／竄改、外部hash錨、CLI故障與原status保全、workflow只改timeout。
- 下載還原為**本機副本模擬**：複製bundle到新download目錄，以可信index hash驗證後還原，逐byte比較summary／log／含S與Receipt的JSON。沒有實際GitHub artifact服務下載，不標CI PASS。
- 原始首輪：40 PASS／1 FAIL，`g9-evidence-selftest-WzUMly`。缺失的相對log被當作repo-relative而非input-relative；只修正該路徑解析直接原因，保留缺檔斷言及原FAIL。其後41 PASS／0 FAIL，`g9-evidence-selftest-8Cr5Nx`。
- 新增junction案例後：46 PASS／1 FAIL，`g9-evidence-selftest-nnawJW`，EPERM是沙箱禁止建立junction。以必要權限重跑47 PASS／0 FAIL，`g9-evidence-selftest-HfVubl`；沒有略過案例、降低斷言或刪除失敗證據。
- 真實產物首輪因鎖定profile檔案EPERM無法完成盤點，必要權限重試亦同。不kill browser、不改權限；工具改為逐檔保存不可讀診斷與null SHA，並維持整體BLOCKED。最終47案再次實際重跑，不重用舊PASS。
- `node scripts/check-workflow.mjs --playwright=<external-module>`：YAML解析及原觸發、固定工具、read-only權限、不部署等嚴格斷言PASS。120分鐘值不是修改成「任意大於60」等寬鬆條件。
- 本輪Quick：`node scripts/test.mjs quick --output=test-results/g9-ci-evidence-quick-20261015 --playwright=<external-module> --browser=chrome`，**61 PASS／0 FAIL／0 SKIP／0 BLOCKED，247.352秒，exit0**；Chrome155.0.8059.40。summary SHA256 `ff398ca792ef56ada3f516ac951e93f43b34470fd820c20cfed0c4225dde6db0`，fingerprint `e2fa4fcaaf7a6d35bb8d7457437a42836e747c56adc48a97a344d18b4069e5ca`，baseline解析為`7220ad82002801d3dea5fedae80d0fb3d7a0433f`。61份log hash與summary一致，不重用之前Quick。
- `node --check scripts/collect-ci-evidence.mjs`、`node --check tools/development-g9/ci-evidence-collector.test.mjs`：exit0。`node scripts/test.mjs list`仍89個tests檔、含syntax共81個自動入口；Quick61／Full80既有範圍不變。
- Full／Linux CI／真正artifact服務下載／Preview／正式站均NOT_RUN。原B Full仍是1.12.0原受驗來源的歷史證據。Quick之後只補本文件與暫存，不改受驗工具／產品／測試；新增文件進index會改變Runner的docs集合／指紋，不改原summary、不宣稱新文件fingerprint已重新Quick。

## 5. 實際產物覆蓋：BLOCKED，不能替換glob

唯讀處理既有結果，**沒有重跑這兩個來源測試，也沒有改寫原summary或log**。以下是collector保存能力，不是遊戲PASS統計。

### 原1.13.0準備Quick

來源`test-results/g9-release-1130-quick-retry-20261015`：568檔、280,050,992 bytes，原測試61 PASS。collector輸出`test-results/g9-evidence-quick-inventory-20261015`：

- 根summary＋61個Runner log：保存59／62；3份PRIVATE_PATH拒絕，無法稱完整summary／log保存。
- 保守mandatory集合：保存63／94；474份其他成功輸出只有index，不可還原。
- 不可讀profile診斷376次、PRIVATE_PATH診斷6次（可能同檔有盤點及required階段記錄，不是376個遊戲FAIL）。沒有超過64MiB原件。
- Bundle 281,594 bytes；盤點／收集2.095秒。status EVIDENCE_BLOCKED，index SHA256 `0f2d00a1e8fd1aa1c081aa2ded1a291f5625960a478af348f6e61230c42edefb`。

### 原1.12.0開發B Full

來源`test-results/development-b-full-renames`：2,693檔、6,578,227,335 bytes，原測試80 PASS／3555.235秒；這不是新版Full。collector輸出`test-results/g9-evidence-full-inventory-20261015`：

- 根summary＋80個Runner log：保存68／81；13份PRIVATE_PATH拒絕。
- 保守mandatory集合：保存81／204；2,489份其他成功輸出只有index，不能取代完整S／RNG或Receipt原件。
- 不可讀profile診斷1,637次、PRIVATE_PATH診斷16次；48檔超過64MiB。這48檔在本輪成功run的預設集合中多為index-only，**不是已捕獲或被宣稱可以還原**；若列required或出現在失敗run，應被單檔上限阻擋。
- 最大原件`tmp/full-power-pitching/career-yakyo-test-001-全力投球-current.json`：249,434,491 bytes，約237.88MiB，遠超單檔上限。
- Bundle 1,161,963 bytes；盤點／收集12.840秒。status EVIDENCE_BLOCKED，index SHA256 `8796fc4e918ba0949dbff8ed9427d66535f69ee6702a9d34299507a8c77aa7cb`。

現有glob原本漏掉的四個目錄（本次仍不能靠小bundle補齊）：full-power-pitching79檔／1,876,808,315 bytes、international-personal-stats97檔／1,435,000,811 bytes、smallschool-c46檔／820,569,415 bytes、trait-display27檔／533,930,489 bytes。各組只保留1份summary，其餘不是「已驗證可省略」的證據。

**正式Gate覆蓋率：UNVERIFIED／不可給出百分比**。上述59／62、68／81或63／94、81／204只計保存檔案，不能冒充Gate通過率。缺少經審核的Gate→case→raw檔案依賴映射、PC／320／390代表PNG審核hash、必要自然生涯完整trace的容量處理，以及A／B外部封存與本次CI產物的來源對照。

## 6. 暫存、whitespace與保全

原12個index blob保持不變；D2原四行平行修改、兩份G1-A fixture／兩份G1-B報告、tasks其他內容及development-b原始資料仍未混入。原A／B封存、golden、歷史FAIL與原始JSON不清理；測試中的刪除／竄改只對本輪新建的合成fault fixture，不是歷史資料。

最終預計17個staged路徑，完整列出供審：

1. `BACKLOG.md`
2. `CHANGELOG.md`
3. `CURRENT_SPEC.md`
4. `docs/designs/PITCHER_AWARDS_D2_DECISION_LOG.md`
5. `docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md`（只有G9 header，原四行不加入）
6. `docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md`
7. `docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md`
8. `docs/src/config.js`
9. `tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md`
10. `tests/award-identity-policy.test.mjs`
11. `tests/verify-modularization.mjs`
12. `tools/development-g9/verify-version-metadata.mjs`
13. `.github/workflows/test.yml`
14. `scripts/check-workflow.mjs`
15. `scripts/collect-ci-evidence.mjs`
16. `tools/development-g9/ci-evidence-collector.test.mjs`
17. `docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md`

不加入test-results、任何payload／raw JSON、profile、截圖、zip或其他平行修改。whitespace只核對指定計畫書原有3行、每行精確2個Markdown行尾空白；不新增全域ignore、不改Git配置來擴大例外。其他新增／修改行必須通過原diff check。

### 本輪新增／修改來源SHA256

以下以Git blob的LF為準；workflow／checker的Windows工作樹CRLF raw hash不同，但完整字元內容只差原行尾，stage核對不得混用：

- `.github/workflows/test.yml`：`c9ab03dfc4a4a80e311d341f3b8e77d71334d6892670bc5bf9cf4a4218384c0c`；raw `9236d3cd241f494a7098c64bf108a89935e6553f767a5175fe809a66640c1908`。
- `scripts/check-workflow.mjs`：`46ff768c78a06219f039f6ad7059270f4d826efb5e82c01bedcc112146773262`；raw `83b4008e31c5175be572087454f33e7b7e9152f4ca4cbe8eb618a76a9a84b614`。
- `scripts/collect-ci-evidence.mjs`：`a8e948da203f590b7c78c6fd9cc5ce8dc0044f566c75eb5a266e0bfb313a7ab5`。
- `tools/development-g9/ci-evidence-collector.test.mjs`：`bbb5373c8544bf59374741828098b0567f7e6f7df42215151bd386a40eebe94e`。
- 本報告不自列hash，避免循環；可由最終`git show :docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md`重算。前12個blob均按原SHA逐檔核對，不重新暫存或改寫。

實際Full副本校驗：`node scripts/collect-ci-evidence.mjs --verify=test-results/g9-evidence-full-inventory-20261015 --expected-index-sha256=8796fc4e918ba0949dbff8ed9427d66535f69ee6702a9d34299507a8c77aa7cb`，integrity PASS，但status仍EVIDENCE_BLOCKED、**exit2**。這只證明已保存子集的壓縮／hash完整，不能偷換成整個Full證據保存PASS。

## 7. 剩餘風險與待審決策

1. **BLOCKED：替換artifact glob／接入collector**。當前證據不足，按授權停止；不要讓未證明完整的collector直接接CI，造成假完整artifact或必然BLOCKED。
2. 建議下一個最小決策是批准精確的Gate與檔案保存契約：哪些summary／原生fixture可由固定source重現，哪些S／RNG／Decision／Receipt raw必須保存，哪些browser profile屬非測試證據。需程式／Gate證據支持，不能以檔名猜測或因檔案大而排除。
3. 大於64MiB的必要原件需另批方案：保持完整logical原件的串流分塊與還原，或獨立安全保存通道／調整上限。分塊會改變「單檔上限」的解讀，**本次不自行實作來繞過64MiB**。只保存hash或截斷S不是替代方案。
4. 本機個人路徑的raw summary／log不能同時保持原件byte-identical又移除內容；本輪選擇BLOCKED。Linux標準`/home/runner/work`fixture已通過，但真正Linux輸出、敏感資料審核及GitHub下載仍需實測，不能因Windows通過就放行。
5. 120分鐘是批准運行預算，不是已量測Linux耗時；未執行新Full、CI或Preview。不得據此放行正式發布。

沒有commit SHA變化，main／正式站不變。完成本輪工具與限定驗證後停止，等待上述證據契約審查；不得自行降低保存要求、部署、發布或清理歷史產物。

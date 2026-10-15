# D2 G9：1.13.0 發布準備（待審，不是發布完成）

## 1. 基準、授權與來源

- Branch：dev；HEAD：`56e72d9792529f3221c1a1ffadaf563bceebe26d`。原受驗1.12.0，工作樹依追加批准準備1.13.0 MINOR。不fetch／pull；既有遠端追蹤資訊不是即時部署證據。
- 正式版本位置仍為[config](../src/config.js)，不新增根目錄VERSION。只改`1.12.0`→`1.13.0`，D2產品規則、機率、引擎及Consumer不變。
- [原G9報告](PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)保留原文與SHA256 `7f78b4afac9143292d12898d045a26aa5e39786034226748b55971d98b8d7b34`。原A／B與Full／FAIL不覆寫，不把舊Full改標1.13.0執行。
- 風險：版本修改限定於metadata與既有顯示；相關原生fixture及Quick本輪重跑。核心D2的L3／R3發布前Full要求仍保留，擬在後續獲准的Linux CI完成。本輪不執行Full、CI、Preview或實機UI；不是豁免發布Full。
- INDEX_PREPARATION_ONLY：精確暫存供審查；commit／push／merge／deploy及產物清理仍未授權。main與正式站不變。

## 2. 精確功能差分與文件範圍

產品唯一diff：

```diff
-export const VERSION = '1.12.0';
+export const VERSION = '1.13.0';
```

[CHANGELOG](../../CHANGELOG.md)僅新增1.13.0已實作功能：新投手賞、P02承接、實得三冠與MVP、歷史Consumer相容、限定同頁年度重入／再試行與日文名稱漏判修正。沒有自然平衡、任意崩潰恢復、實機UI、CI或發布成功聲明。

[CURRENT_SPEC](../../CURRENT_SPEC.md)、[BACKLOG](../../BACKLOG.md)、[D2入口](../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md)、[決策入口](../designs/PITCHER_AWARDS_D2_DECISION_LOG.md)、[計畫入口](../../tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md)同步當前授權；舊歷史數字／政策保留。D2-G9-RELEASE仍未完成，不增加完成數。

必要測試相容調整：

1. `tests/verify-modularization.mjs`的精確版本斷言及輸出由1.12.0改為1.13.0，仍拒絕其他版本。
2. `tests/award-identity-policy.test.mjs`不改凍結B1／A來源與hash；仍驗證其1.12.0原文，只在當前config比較中要求**完整舊文精確替換唯一版本字串**為1.13.0，其餘位元組內容（原有LF／CRLF處理除外）完全相等。不增加通用allowed-file，不全域忽略version、不放寬其他產品來源或狀態。
3. 新增手動工具[verify-version-metadata](../../tools/development-g9/verify-version-metadata.mjs)，不接產品、Runner、manifest或CI。使用實際引擎active initializer／seedInit／R及原生政策，明確不是完整生涯。

## 3. 限定驗證與原始失敗

本節記錄本輪實際結果；未完成項目維持NOT_RUN，不以歷史PASS代替。環境Windows x64／Node24.15.0／Playwright1.62.1（外部模組）／Chrome155.0.8059.40，非Linux CI。

- 首輪Quick：`node scripts/test.mjs quick --output=test-results/g9-release-1130-quick-20261015 --playwright=<external-module> --browser=chrome`。56 PASS／5 FAIL／0 SKIP／0 BLOCKED，38.073秒，exit1。原始summary與log保留。
- 3個browser FAIL：ACT、draft-income、KBO的loopback導航`ERR_NETWORK_ACCESS_DENIED`，環境限制，不是遊戲成功或產品回歸結論。
- 1個文件FAIL：建立本報告前暫時缺少引用目標；以完成文件處理，不改checker。
- 1個版本期待FAIL：B1隔離測試原要求當前config等於受驗A的1.12.0。按第2節新增精確G9例外，不改golden與歷史快照。原始失敗不是被刪除或改寫為PASS。
- 版本原生初始化及政策fixture：42 PASS／0 FAIL，exit0。Seed為`tob0ilu0`、`q77bi1jx`、`jp3-pitcher-01`、`jp3-infielder-01`各P／IF共8組；同版重播完整可序列化S與RNG嚴格一致，跨版僅精確替換`S.version`及`birthHighSchool.createdVersion`兩處，其他欄位相等。投手15次、野手27次原生R抽選；完整順序／值／前後狀態相等。不是8條完整生涯。
- 新出生快照仍不可替換／刪除、內部freeze。S／A／B／C各層新1.13.0快照依原規則；1.12.0快照對1.13.0仍UNKNOWN，缺失／非法不補造，既取得特性不追溯重算。既有school政策完全不改。
- P01／P04／P08相同seed／year／league／award／rule的獨立drawKey、hash及u不受版本字串影響，原生純函式不寫S。僅限此接點證據，不宣稱新完整自然生涯或主RNG全生涯已驗收。

### 最終限定結果

- 重跑完整Quick：`node scripts/test.mjs quick --output=test-results/g9-release-1130-quick-retry-20261015 --playwright=<external-module> --browser=chrome`，**61 PASS／0 FAIL／0 SKIP／0 BLOCKED，263.052秒，exit0**。本機網址存取以所需權限執行，不改測試網址／程式。ACT、draft-income、KBO三入口均實際PASS；draft-income內含PC／320／390的18案及console／JS-CSS404檢查，但不是完整新版實機UI驗收。
- 新Quick summary SHA256：`9c854613630141821c1fec04e179c572d4c0e06e98cab26f64916836bfa682d1`，受驗HEAD56e72d9＋本輪1.13.0工作樹；baseline解析為`7220ad82002801d3dea5fedae80d0fb3d7a0433f`。執行指紋`da8a73556e0fa16515ead0f4c01161d71887c31df6eeee4e75760b6b53b3b7b0`。61份log hash均與summary一致。原首輪5 FAIL留在獨立目錄，不覆寫。
- `node tools/development-g9/verify-version-metadata.mjs`：42 PASS／0 FAIL，exit0；不是Runner入口計數。`node --check tools/development-g9/verify-version-metadata.mjs`：exit0。fixture單獨耗時UNMEASURED。
- CURRENT_SPEC原生連結測試：13個現存本地引用及5個Git歷史來源PASS。8份發布相關文件的本地路徑／anchor檢查236處PASS；另掃描本機個人路徑與明顯credential格式，沒有命中。內容審查仍保留第6節未追蹤raw資料的可攜性限制。
- 正式checkbox：25完成／27未完成／52唯一ID；D2-G9-RELEASE維持未完成。
- `git diff --cached --check`：exit1，僅指定計畫書原有三行Markdown雙空白換行（文件狀態／建立日期／修訂日期）被Git視為trailing whitespace。保留原文，不為消除警告改寫歷史計畫；其他11個暫存檔另做diff check。這不是Quick FAIL，也不把原命令改報PASS。新增工具不在Runner，list分類／既有測試範圍不變。
- 新版Full／Linux CI／Preview／實機UI／正式部署：**NOT_RUN**。原B Full80及3555.235秒為1.12.0已接受歷史結果，不寫成1.13.0 PASS。A封存v2、B來源／信任錨等核對見第6節。
- Quick後只補本報告結果、核對並整理index行尾；產品／測試工作樹來源未再變。Runner包含docs及Git已追蹤檔集合，文件補記／首次暫存會使其fingerprint不同；不重寫原summary，不稱最終文件指紋已完整Quick執行，不放寬`--reuse`。發布前Linux Full仍須針對後續確定commit實際執行。

## 4. CI timeout精確提案（未套用）

現行job共60分鐘，含checkout／Node／安裝Playwright與Chromium／驗證workflow／Full／artifact。B原Windows Full 3555.235秒（59分15.235秒）已接近上限；Linux耗時尚未測量。先增加時間上限，不減少80入口、不改各測試timeout／斷言／Runner、不並行化可能競爭的fixture。

建議唯一timeout diff：

```diff
--- a/.github/workflows/test.yml
+++ b/.github/workflows/test.yml
@@
-    timeout-minutes: 60
+    timeout-minutes: 120
```

120分鐘是保守運行預算，不是測量所得Linux時間，也不保證一定足夠。Quick也取得較寬job上限，但觸發、套件版本、測試內容與既有取消並行策略不變。需使用者先批准後才修改workflow；若首次Full仍timeout，保留中止證據並分析，不減測試或偽報PASS。

## 5. Artifact最小保存提案（未實作）

現行glob保存summary／log及`yakyujinsei-*`、`runner-contract-*`，漏掉`full-power-pitching`、`international-personal-stats`、`smallschool-c`、`trait-display`等非同前綴資料。原B Full該類JSON約4.33 GiB；不建議直接加`tmp/**`全部上傳。

建議新增**獨立證據收集工具**及always步驟，不改Runner／測試通過條件。先批准方案，再另外實作及測試：

1. `test-results/ci-evidence/index.json`：全部原輸出相對路徑、大小、SHA256、來源entry／case／seed（可可靠取得時）、實際程式HEAD／config與來源hash、工具版本、命令、環境。未知欄位明記UNKNOWN，不推算。
2. 精確白名單保存各入口summary、必要的小型case verdict／差分與RNG摘要、PC／320／390代表圖及所有失敗log。**不得僅依檔名判斷JSON小或安全**；逐項schema與內容檢查，排除本機絕對路徑／token／個資，保留原件不原地改寫。
3. 失敗case優先保留可重現的完整S／RNG／Decision／Receipt，壓縮的是新CI副本，不動A／B封存或歷史FAIL。只收失敗case而非每次所有成功全生涯重複S。
4. 建議總壓縮預算256 MiB、單檔未壓縮64 MiB，均為**待批暫定預算**，不是已量測成果。達上限或缺少必要FAIL原件時輸出`EVIDENCE_BLOCKED`與明確清單，不靜默截斷／刪除；不能只憑index hash聲稱raw evidence已保存或可以重播。
5. collector自身驗證：PASS／FAIL case、零檔／非零exit／job中止、損壞JSON、超額、秘密資料、重複路徑、逐檔hash與下載還原一致；失敗不得吞掉，也不覆蓋test step的exit。保留現有log上傳作fallback。
6. 原本14天artifact只是CI短期副本，**不是**可清理A／B原封存的批准，也不是永久正式baseline。若待審白名單不能保存所需Gate證據，擴充精確項目或列BLOCKED，不降低Full。

預計workflow接線（尚待批准及collector驗收；不更動trigger）：

```diff
@@ before Save logs and evidence
+      - name: Collect bounded CI evidence
+        if: always()
+        run: node scripts/collect-ci-evidence.mjs --input=test-results/ci --output=test-results/ci-evidence
@@ artifact path
+            test-results/ci-evidence/**
```

artifact path的精確候選差分是保留原summary／log，並在collector覆蓋性驗收後，以bounded evidence取代三個廣泛tmp glob，避免舊glob仍無限制上傳大型JSON：

```diff
@@ artifact path
-            test-results/*/tmp/yakyujinsei-*/**
-            test-results/*/tmp/yakyujinsei-*.json
-            test-results/*/tmp/runner-contract-*/**
+            test-results/ci-evidence/**
```

上方接線示意與此差分的新增path是同一行，不重複加入。**在collector尚未證明所有正式Gate必要證據都可還原前，不可移除既有glob。** 新工具尚不存在，不能直接套用以上接線。collector與限額／白名單需另審精確實作diff。此提案不增加npm套件；估算節省空間與速度均UNMEASURED，只有避免全量4.33 GiB的方向，沒有虛構速度保證。

## 6. 暫存與公開內容審核

已精確暫存12個明確檔案：BACKLOG、CURRENT_SPEC、CHANGELOG、config、兩份D2文件、指定實作計畫、原G9報告、本報告、兩份必要測試及手動metadata工具。只用明確path與D2單一header hunk，不使用add .／add -A。沒有commit。

完整暫存白名單（沒有其他目錄遞迴加入）：

1. `BACKLOG.md`
2. `CHANGELOG.md`
3. `CURRENT_SPEC.md`
4. `docs/src/config.js`
5. `docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md`（僅G9頂部入口hunk）
6. `docs/designs/PITCHER_AWARDS_D2_DECISION_LOG.md`
7. `tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md`（指定D2計畫；原未追蹤，連同保留的完整批准計畫正文加入）
8. `docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md`（先前已接受的報告，原文不改）
9. `docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md`
10. `tests/verify-modularization.mjs`
11. `tests/award-identity-policy.test.mjs`
12. `tools/development-g9/verify-version-metadata.mjs`

對B受驗來源manifest逐檔核對：56／57產品raw SHA相同；唯一差異config原`93e93a17e5579a656427d9d5e0b2c53d68dcf9671cf06524fd8717df15752818`→`3de2795ac502a8756912835afd92b0bc447ae43341befe5aad63cc1141260a75`。新版本工具另嚴格核對config完整文字只差批准literal（沿用LF／CRLF正規化）。105個驗證來源中103個相同，僅兩項第2節測試：

- identity test：`ad4a44df9c309c9d3e64f0ea66b1823d01c12adfe556eb9e32bf13748cf42160`→`6f7ef2506a243f8ab8979f29ae943ac8a4f3fa04fc09ae39e12252a821282bc5`。
- modularization：`582ae7f8f30c0f478566c2e0445d3723d1843015f93d30923009ac49c68e5f34`→`b0fa9e68790e326c1b4cb37f6b935a5193547b9da7e19109b7bcedcd3bb2ae1f`。
- 新手動工具：`d28d8ac75c5f2086ca5068b1c503428addd5b2efe7f835091fb703c5ebc6b9eb`，不接入Runner／CI。

所有hash均SHA256。未把此三個來源差異更新進B原manifest；保留它作為1.12.0已受驗基準，不覆寫golden。A v2驗證3 archive PASS（currentSourceChecked=false）；B最終manifest、Quick／Full summary及A／B原驗收報告5個信任錨hash一致。兩個G1-A fixture、兩份G1-B／B2報告hash仍與開始時相同。workflow／Runner／manifest／AGENTS與HEAD無diff。

### Index行尾及暫存來源核對

Windows raw來源與Git原LF的hash不能混用。最初`core.autocrlf=false add`使5個既有CRLF文字檔產生整檔index差分；只對BACKLOG／CHANGELOG／CURRENT_SPEC／config／verify-modularization的**index**依Git原行尾重新暫存，工作樹未改。其餘來源與原G9報告保留raw bytes；D2僅header的部分暫存另驗證。這是行尾處理，不是重寫產品、golden或原始證據。

暫存config的SHA256為`42a2d50a0d5000181c7b5820020553f67473729dd3661f443c8f249ac20761ce`；暫存modularization為`3628b9e7f87bb5e5218d94e69f2f0c3a6e90293da51b9c7a2810d77aca5e39e8`。兩者與已測工作樹的上述raw hash只差CRLF／LF，沒有其他字元差異；日後Linux／Preview對Git blob應用index hash，不拿Windows raw hash誤報來源不符。identity測試及手動工具staged raw hash與工作樹相同。

其他暫存文件SHA256（不記本報告自我hash以避免循環；最終index可用`git show :<path>`唯讀重算）：

- BACKLOG：`c1b575792e2154c0558cf28544b5e21f9cc882355cf858628a9e08c5d9466d8a`
- CHANGELOG：`44a341947e9e9d3407250f6142467fa6fa7b6967b229a8b7d72e5d0c8706a70c`
- CURRENT_SPEC：`3d8354a4d9646f95de72b8bf4f982d5640453749bb1b15f591645da8fb90f3f9`
- D2 Decision Log：`1f5f9652e7aff309e0e84cd173d80c5066bd8b7fb845285c0a4789db2b7a9a6a`
- D2主文件（僅G9 header）：`b12ce2288c9436b5ad7e962abcb9cc26852cfa12e8b75683a062b59f5ec692ad`
- 原G9報告：`7f78b4afac9143292d12898d045a26aa5e39786034226748b55971d98b8d7b34`
- 指定D2計畫：`e281bbeb033fc0aa72043204391275c3a1d012941fc9188ae509c81d7c7b17b4`

- D2主文件只暫存G9頂部狀態入口；既有四行平行修改保持未暫存，不整檔加入。
- 只指定`tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md`，不加入整個tasks。
- 不暫存兩份G1-B／B2報告、兩份G1-A fixture變更、`docs/reviews/development-b/`原始JSON、test-results、A／B archive、PNG、影片、trace ZIP或其他平行工作。
- 原B報告部分相對證據引用仍指向未追蹤local JSON；這是**現有可攜性缺口**，不能宣稱提交後所有證據GitHub可讀。原始資料保留本地，後續按第5節另批精確可公開保存集，不混入含個人路徑的大量原始資料。
- 本輪公開文件只使用相對路徑／既有公開repo識別，不公開本機使用者目錄、金鑰、cookie或token。報告中hash是核對索引，不替代完整原證據。

## 7. 停止線與後續順序

目前G9仍PARTIAL。待審：120分鐘timeout、bounded artifact規格／後續實作、完整staged清單。沒有commit SHA變化，沒有push、CI run、Preview或部署結果。

後續需明確批准：CI方案實作與限定驗證 → 精確dev commit／push → Linux Quick／Full及完整CI證據核對 → 對受驗最新SHA的Preview功能／資產驗收 → 使用者接受 → 另批main與既有正式同步／smoke。手動Full不可用時標BLOCKED，不自行建Draft PR。版本更新不是正式發布批准。

歷史JSON／截圖／trace與A／B封存一律不清理；沿用原G9逐檔清單、必要備份與還原核驗、另行明確刪除批准規則。

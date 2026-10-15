# 投手獎項D2：G9限定收尾驗收與待審發布摘要

2026-10-15。**G9文件／來源／發布準備為DOCUMENTATION_READY_FOR_REVIEW；整個G9為PARTIAL / PENDING_RELEASE_APPROVAL，不能標為發布PASS。** 本輪R0，不修改產品、測試、Runner、CI、VERSION或CHANGELOG，不執行commit／push／merge／部署或產物刪除。

## 1. 基準、授權與來源歸屬

- Repository：tt-chin/yakyujinsei，branch dev；HEAD `56e72d9792529f3221c1a1ffadaf563bceebe26d`。B本機commit包含49個檔案，parent為A提交`efd4710c4c5c366ff3aba69c59180031c82ff18a`。
- VERSION 1.12.0，唯一管理位置為`docs/src/config.js`。本輪不新增根VERSION檔、不選定下一個正式號碼、不更改CHANGELOG。
- 本地main `4624753a5359acd6c63ab6957341376bd43c5c88`；本地origin/main `7220ad82002801d3dea5fedae80d0fb3d7a0433f`；本地origin/dev `d2ea8a3bcf38044928aab86ae56289839c45a0e4`。未fetch或查詢遠端，因此不將tracking refs當成目前GitHub、Preview或正式站狀態。
- 使用者已明確接受A／B本地驗收及授權B本機commit。這取代A／B報告當時的「尚待審查／未提交」執行狀態，**不改寫原報告、歷史FAIL、manifest或舊hash**。
- 既有G9定義見[計畫§13](../../tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md#13-g9版本與部署獨立授權)：先交待審發布摘要，其餘操作依當次明確授權。此次只完成可獨立文件工作，受限操作見第7節。

### 開始工作樹與本輪分界

開始時已有：D2主設計四行增補、`docs/reviews/g1-a-validation/fixtures.mjs`修改、未追蹤的`fixtures-double-wings.mjs`、G1-B／B2報告、`tasks/`及`docs/reviews/development-b/`。

- D2主設計開始SHA256：`6daa8b4aa4eedb508627ab3d41fd816afddfce5240f829228ce6b6dbb4027352`。本輪僅新增頂部狀態入口；四行原增補與所有批准公式、技術條文保持。
- 原計畫開始SHA256：`efb6dbeb23a5f2b1519ef80865d40f14b606e39f2fa1ca17049083273d563168`。本輪只加執行狀態及G9限定工作／發布保留安排；不把整個未追蹤tasks目錄宣稱為本輪新成果。
- G1-A fixture開始SHA256：`6269cda6470e3f3e1700025d24f4c368fe4847b44e1dbf9f29a9439d8f7e757a`；double-wings：`e5ed607f2c4016f05546221a41474c01d423358f4b363a6dd603ace0391ee15d`。兩者不屬本輪，不修改、不提交。
- G1-B2報告開始SHA256：`2d25b5b55b69d7fff7d87d1a916c37b124266963172a29461e2198ea05475a04`；G1-B審查：`e3928912b7fedaadc33d1d6f06785ae120c85aa947b65e3a3bff8277a1630562`。保持未追蹤原狀，不將靜態調查當產品Runtime。
- 本輪修改文件：CURRENT_SPEC、BACKLOG、D2主設計、D2 Decision Log、分階段計畫，以及本報告。沒有修改原A／B驗收報告、原始研究、圖片或JSON。

本輪狀態同步必須與上述平行差分分開審查。未來提交仍需精確staged清單及逐hunk／來源核對，不能`git add .`或`git add -A`，也不能因文件位於同一目錄而整批混入。

## 2. 已接受證據與保全錨點

### 開發A

- [原驗收](PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)，SHA256 `e0dbcab349133ec12b72e02661f4fa54b1cc39e3e8b6881d4e5975f8bc62f410`。
- [v2校驗附錄](development-a/BASELINE_VERIFIER_SUPPLEMENT.md)為實際路徑；不是不存在的`docs/reviews/BASELINE_VERIFIER_SUPPLEMENT.md`。
- A0／G2／G3／G4指定範圍接受；Quick56、Full75均原實際執行，並非本輪新跑。
- A封存`test-results/development-a-baseline-20261015-c3d413dd/`；BASELINE_MANIFEST SHA256 `a08095f1d89d419762afd58f10c8e7b12edd5c07f1de91902f8563457f1181f1`；原SHA256SUMS `2ee5d1505568ef66e586dd2530b5105edf6d6452fa7c0efc19eb6a48f8005061`；v2工具 `e4b166728d26d1f35c18f40d6bffc99cd3ac2e74bbe891a6212e0c49fd9145a0`。
- 只用v2，B後不加`--current-source`。原v1 FAIL及修復證據保留，不能藉舊校驗器失敗推定原封存毀損。

### 開發B

- [原驗收](PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md)，SHA256 `890f3b247ff8e3b9f70ecec4aa37ab82971ce3be245c1cc205c5166813c44837`。
- 最終manifest：`test-results/development-b-final-complete-evidence-20261015/EVIDENCE_MANIFEST.json`，SHA256 `2fabfaa7545b2c2310a7f4600b6ad83f6f9eea578d62ef9ab5469e2c9fe9635a`。57產品＋105測試／工具來源；其中兩個Receipt手動工具於Full後另行驗收，不宣稱已包含於Full80。
- Quick61／0，244.667秒；summary SHA256 `4cf85207ba9de472937e714e1a1c18383171bfdf798f19062dcc8e1625eda96c`。
- Full80／0，3555.235秒；summary SHA256 `9edd08764d9336507690a5c7b0307d66fb5bdfd9a4c9a9d27cc7b10a82b73b0a`。兩者executed61／80、reused0，141份入口log有獨立hash。
- 原受驗HEAD為efd4710＋B工作樹；已逐檔核對的B受驗位元組其後提交為56e72d9。不能把原summary改寫成在56e72d9或本輪G9文件上重新執行。
- 57個目前產品來源均與Windows受驗manifest的raw SHA一致。另與HEAD Git blob比較：19檔raw一致、38檔只有CRLF／LF差異，逐檔僅將CRLF統一為LF後內容完全一致、未解差異0；38檔為既有未改檔的checkout換行，不是本輪改產品。B提交的10個產品檔保留受驗raw位元組。未來部署驗證要以指定release commit的Git blob建立預期hash，再記錄與Windows受驗來源的換行對照，不能拿Windows raw hash對所有Linux資產直接要求相同，也不能用寬鬆正規化掩蓋其他內容差異。
- 原環境Windows／Node24.15.0／Chrome155.0.8059.40／Playwright1.62.1。Linux CI或Preview結果不能由此推定。
- 四條A策略生涯：yakyo-test-001/P通常520步825R；jp3-pitcher-02/P省エネ304步606R；jp3-pitcher-03/P全力335步671R；jp3-infielder-01/IF422步637R。普通S／選擇／年度／契約／收入／honors／traits／pool／主R保持A基準；Decision另嚴格驗證。同B完整私有Receipt重播4案與獨立還原4案另有實際證據。
- G5～G8為指定本地PASS／使用者接受，含真實producer→Decision→Receipt→Consumer與36獎項UI＋12退休歷史＋18checkpoint原生瀏覽器案例，非只用G3完成Decision fixture代替。

### 主RNG差異界線繼續有效

新賞獨立draw主R0；同輸入的原賞槽資格／順序／值不變。首個批准效果之前普通S／選擇／主R嚴格相等；技術Decision／Receipt另檢，不全域忽略。後續差異必須逐項對應producer→Decision→Receipt→Consumer→狀態→後續R。四條自然路線沒有新賞winner，不據此宣稱自然獲獎率、所有新效果分歧或平衡已驗證。同B重播仍完整嚴格相等，未解差異為REGRESSION。

## 3. G9文件同步與狀態分層

- CURRENT_SPEC第17節記錄已實作P01～P08、舊賞隔離、各賞資格／曲線、MVP、待遇、獨立RNG、年度交易及支持限制；第12節不再將pitcherTC誤列為純保留ID。只有文件與現行實作同步，沒有新增規則。
- D2與Decision Log新增現行進度入口，所有舊設計時點NOT_IMPLEMENTED／NOT_FIXED／AF09未授權及舊CURRENT敘述明確保留HISTORICAL範圍。批准公式、風險ID與原始比較不重寫。
- 分階段計畫保留G2～G8原Gate與A／B驗收邊界，更新執行進度與G9停止線。
- BACKLOG將已接受的TRAIT-PITCHER-TC移至本地完成，新增D2-G9-RELEASE獨立追蹤發布；重新從checkbox計算25完成／27未完成／52唯一ID。其他未完項與歷史報告數字不改；smallschool／COPY等較早狀態的獨立整理不混入D2。
- CHANGELOG保持原檔，SHA256 `030dba73e39f252e453e7498c1835198af3712743e37d0d1932b0d3c4c7e6fac`。未授權版號時不追加虛構正式版本或驗證／發布狀態。

## 4. 待審發布摘要（不是正式CHANGELOG）

建議版本級別為**MINOR**：本批新增相容性投手個人賞及一次性結算基礎，不只是文案PATCH。若現行正式號仍1.12.0，可提1.13.0供審查；**候選號未批准，不修改config**。升版前重讀實際VERSION、release分支與差分，不自動沿用本候選。

待批准玩家文案草稿：

- 投手タイトルに最多勝利・最高勝率・沢村賞を追加し、防御率・奪三振・セーブ・中継ぎ賞の名称と識別を整理。
- 同年度・同リーグで最多勝利／最優秀防御率／最多奪三振を実際に獲得すると投手三冠王となり、年間MVPを保証。
- 歴史タイトルの原文と既存待遇を保持し、年度表彰・出来高・年俸支払や選択の再実行による重複処理を防止。

実際の新規日文正式名はCURRENT_SPEC第17節を正とする。文案は本報告内の草稿でありCHANGELOGへの追記・公開ではない。自然平衡確定、任意クラッシュ完全回復、旧人生完全再現等を宣伝しない。

## 5. CI／Preview／本番の順序・停止条件・回退

1. **另批版本與文件提交準備**：批准MINOR及確切版本、正式CHANGELOG；鎖定release SHA與產品／測試hash。VERSION會反映S.version／出生快照createdVersion等metadata，需評估對應限定驗證；不能把任何狀態差分自動排除。先保存main及publication repo的實際發布SHA，不能用本地舊ref代替。
2. **另批精確commit／dev push**：逐檔檢查staged／平行hunk／私有路徑／大型輸出。只提交批准文件與必要可攜證據，不把tasks、G1-A fixtures或raw輸出整目錄加入。記錄受測程式SHA及後續純文件SHA。
3. **Linux CI**：既有test.yml以dev push跑Quick，main PR或workflow_dispatch跑Full，Node24.15.0／Playwright1.62.1／Ubuntu24.04 Chromium。取得新run URL、headSha、模式、exit、完整結果與必要產物後才PASS。可選手動Full若default workflow不可用則BLOCKED；沒有新Draft PR授權，不自行建PR。不改Runner／CI通過條件來迴避FAIL。
4. **最新Preview**：部署可隨dev push開始，但放行在CI結果後；確認Cloudflare deployment的source SHA、版本及配信JS／CSS／HTML逐內容hash，不能只看固定URL或部署綠燈。於`https://dev.yakyujinsei.pages.dev`確認真實新賞、歷史舊賞／未知原文、退休／收入、操作續行、1280／320／390、Console與404；再依需要請使用者完成B完整手機實機。失敗先停止與歸因，不覆寫本地PASS或擅修產品。
5. **使用者接受Preview後另批本番**：只有新明確授權才可main合併。先驗證merge/release tree等同受驗程式；若內容或測試條件改變，重評相關／Full。既有publish-site.yml將docs同步tt-chin/yakyujinsei-site，不能直接編輯publication repo或變Cloudflare設定。
6. **正式smoke另批執行**：核對正式同步run、publication SHA、yakyujinsei.com配信hash／版號、seed-only開始與基本年度／表彰／退休／手機操作。實際結果補記後才完成發布Gate；不以Git merge成功當站點已發布。

**回退計畫而非執行**：Preview不接受時保留main不動，保存失敗deployment／run／logs；若需回復dev，另批以可審查revert修正，不reset／force push。正式有問題時先停止後續發布，使用事先記錄的最後已驗證release與publication SHA擬定revert／重部署，經使用者批准走既有workflow；保留原失敗紀錄。純Git revert不能回滾玩家記憶體中的人生，需明確告知重整會重新開始，不能暗加存檔／舊引擎。

### 發布前仍須處理的具體風險

- **CI時間餘裕**：test.yml job timeout60分鐘涵蓋安裝等步驟；本地Full已59分15秒。不能推定Linux同速或一定timeout；首次實際Linux結果仍NOT_RUN。若需調整timeout須另批，不能刪入口、重用PASS或降低條件。
- **CI產物缺口**：目前upload-artifact收logs／summary及tmp/yakyujinsei-*、runner-contract-*，不涵蓋tmp/full-power-pitching、international-personal-stats、smallschool-c、trait-display的完整資料。其本地對應JSON合計約4.33GiB。需另批精確擴充產物範圍／可靠外部保存，或批准等效證據策略；本輪不改workflow，也不假稱CI完整原始證據可下載。既有artifact retention14天，不當永久備份。
- **證據可攜性**：B原報告部分相對連結指向未追蹤development-b原始JSON／快照；大型test-results僅本地。正式審查前需明確的小型脫敏證據清單或hash固定的受控保存位置，避免fresh clone出現證據斷鏈；不為補連結整批提交帶本機路徑的原始資料。
- **配信邊界**：publish-site同步整個docs目錄，新增docs/reviews等將可能公開；未來提交前必須檢查私人路徑／日誌／資料，不能因不是遊戲JS就忽略。此次沒有部署。
- **實機及自然平衡**：G2實Safari52接受證據可沿用同源模組，B全UI新iPhone／Android仍NOT_RUN，不能由尺寸模擬代替。新賞自然頂尖樣本平衡UNVERIFIED，不擅降門檻或新採樣。

## 6. 測試產物保留與另批清理政策

**本輪刪除／移動／覆寫／壓縮產物=0。** 前一輪另行批准的52張完全重複PNG已刪除15,886,702 bytes；不重複刪除、不擴大授權。對應locked圖片仍保留，恢復原路徑可由同位元組副本複製，原驗收報告不因清理改寫。

最近唯讀容量調查觀測27,092個JSON／75,976,134,799 bytes（70.758GiB），最新B Full保留847個／6,505,863,030 bytes；這是當時磁碟存量，不是累計寫入量或本輪重掃。寫入時間UNMEASURED。B Full內18組／30個額外完全相同JSON約0.954GiB，因屬驗收證據並未列為當前可刪。三個大型樣本的排版空白約48.47%，無損引用可進一步減少重複S；都是未批准未實作的未來輸出優化，不縮減Full80或斷言。

### 保留分層

1. **永久追溯核心**：已驗證來源／完整SHA、配置／環境／指令／策略、正式設計與決策、A／B／G9報告、CI／deployment Run URL與SHA、golden／fixture源、SHA清單與還原規格。原始FAIL的輸入、錯誤、診斷、修正前工具及修後對照必須可追溯，不將FAIL改寫PASS。
2. **完整但可封存的基準證據**：A三個原封存及v2補充、A→B固定策略完整S／選擇／RNG、B完整Decision／私有Receipt修訂及引用、Full／Quick全summary／log／必要JSON、各聯盟／角色及PC／320／390代表圖，包含原始歷史FAIL。當前A封存已有，B尚不能僅靠summary取代完整保存。發布與清理前保持原件。
3. **待核對的歷史冗餘**：多輪候選PASS、相同完整輸出、重複截圖／trace、非唯一瀏覽器暫存。僅在內容hash、使用路徑、完整執行身分、所屬報告及恢復對照均明確後，才提出精確候選清單。不能按日期、檔名、目錄名、相同Seed或PASS標籤直接刪除。

### 發布後才可申請的大規模清理Gate

- G9正式發布／smoke驗收完成並獲接受；沒有待查REGRESSION／未封存FAIL。
- 建立不可覆寫的release evidence manifest：逐檔原路徑、bytes、SHA256、執行／baseline身分、保留副本與引用關係；同內容不同測試仍保留兩次執行紀錄，不刪測試覆蓋。
- 最小保留集與完整可恢復資料至少有兩個獨立保存位置，不能把同一OneDrive同步的兩個檔名誤當獨立備份；檢驗解壓／重建後S／R／Decision／Receipt完整相等與SHA，並驗證必要比較器可讀。任何新封存或還原操作另批，不覆寫A。
- 先列候選的完整檔案清單、總量、引用替代與可恢復性、受影響的舊路徑；使用者明確批准後才可刪除。來源json即使與保留副本完全相同，若屬golden、唯一FAIL或工具必讀路徑仍先處理引用與恢復問題。
- 目標是保留一份完整可驗證的release基準與必要失敗證據後，清理大部分歷史重複輸出；**目前未完成全27,092檔內容去重與恢復核對，不能承諾可清理比例或GiB**。單一受控保存失效時停止清理。
- Runner的缺Playwright／非零／BLOCKED規則、Full80與全部嚴格比較不變。緊湊JSON、無損快照引用、相同payload內容定址及非同步執行環境需另案批准、完整還原測試與性能實測，不能藉本政策直接修改輸出或刪JSON。

## 7. Gate結果與需要額外批准的操作

- G9文件／規格同步、待審發布摘要、來源及證據核對、保留／回退計畫：本輪限定完成，實際檢查結果見第8節。
- A0／G2～G4、G5～G8：沿用使用者已接受的原本地證據，不冒稱本輪重新執行。
- VERSION／正式CHANGELOG：NOT_RUN / NOT_AUTHORIZED，需批准確切版號與版本修改。
- Git commit／push／merge、Linux CI觸發、Preview／正式部署與smoke：NOT_RUN / NOT_AUTHORIZED。Cloudflare固定URL僅為計畫目標，不是已驗證版本。
- 任何產物清理／封存搬移：NOT_RUN / NOT_AUTHORIZED；既有52PNG清理是先前獨立批准，不延伸至其他產物。

建議下一個批准單位：先審核本G9文件、MINOR提案與CI證據／timeout處理方式，再批准版本＋CHANGELOG與精確dev提交／推送／CI／Preview範圍。main與正式發布必須在Preview接受後另批，不一次默認全部放行。

## 8. 本輪限定驗證紀錄

本節只記錄本輪實際執行的檢查，不以A／B PASS替代。產品或既有測試來源若改變，停止並重評驗證；文件修改沒有降低任何Gate。原始A／B Full不重新產生，不改golden、Runner／CI或測試預期。

- `node tests/spec-source-links.test.mjs`：exit0，0.349秒；12個現存本地引用及5個Git歷史來源PASS。
- `node tests/pitcher-award-policy.test.mjs`：exit0，0.075秒；198 PASS／0 FAIL，分類PURE_PRODUCT_NUMERIC_FUNCTION，不冒充新一輪Runtime發獎或完整回歸。
- `node scripts/test.mjs list`：exit0，0.145秒；89個測試相關檔案、含syntax共81個自動入口。這是inventory，不是執行81個入口；本輪沒改分類或Runner。
- 六份本輪文件的本地路徑／anchor檢查：218處PASS，沒有缺檔／未確認anchor。首次內嵌命令因PowerShell引號出現ParserError而未執行檢查；改用唯讀stdin腳本後完成，不是產品FAIL，也沒有改測試預期來通過。
- Node唯讀SHA校驗：57個產品＋105個驗證來源與B最終manifest完全一致；7個A／B信任錨、141個原Quick／Full log、8份B最終完整Receipt JSON均PASS。A v2命令 `node test-results/development-a-baseline-20261015-c3d413dd/verify-baseline-v2.mjs --manifest=test-results/development-a-baseline-20261015-c3d413dd/BASELINE_MANIFEST.json`：exit0，3 archive PASS，未加--current-source。
- D2主設計移除本輪頂部新增入口後，原內容SHA仍6daa8b4a…；Decision Log與計畫分別移除本輪新增區塊後仍fe696ea4…／efb6dbeb…。因此既有四行、歷史規範與計畫正文沒有被覆寫。兩個G1-A fixture、兩個G1-B報告及A／B原驗收報告原hash也保持。
- BACKLOG正式checkbox：25完成／27未完成／52唯一ID，沒有同ID同時完成與未完成。僅移動TRAIT-PITCHER-TC及新增D2-G9-RELEASE，原51項中的其餘50項狀態不變。
- `git diff --check -- CURRENT_SPEC.md BACKLOG.md docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md docs/designs/PITCHER_AWARDS_D2_DECISION_LOG.md`：最終exit0。初查發現本輪新增的EOF空行，僅移除該空行後通過；Git換行提示不代表產品改動。未追蹤計畫與新報告另做引用與新增區塊檢查，不修改既有原文來消除歷史問題。
- Quick／Full／固定Seed新Runtime／Linux CI／Preview／本番／新Safari：本輪均NOT_RUN。理由是R0文件同步，產品／測試來源與已接受B位元組未改；文件相關檢查另實際執行。Runner fingerprint涵蓋docs，文件修改會改變fingerprint；不修改舊summary、不使用放寬的--reuse、不稱舊Full在本輪文件上執行。

### 本輪同步文件SHA256（不含本報告的自我hash）

- CURRENT_SPEC.md：`a728c5184abd26fdbaca660867982d0d901951f206f144d51e50cf0679aabdb5`
- BACKLOG.md：`28fd83554cc516bc625eba925163b85fdb815cc0a925de18b618b019dae76335`
- D2主設計：`f9f62409a64bfedbfaebaa9818aa853b32e075ae5f9f25e93e853b2489890c94`
- D2 Decision Log：`422ee5bd5872c5f9461bf0bbb31b23a71907e6a55f5d9dc4e96865e405cc94bb`
- 分階段計畫：`8b8e1212378cad85be5ada6f90570708dadf9e93702f2da891c33be074c08d2b`

沒有本輪新commit。HEAD仍56e72d9、VERSION仍1.12.0；index不加入任何檔案。最後工作樹保留六份本輪文件差分及開始時平行／未追蹤內容，等待使用者審查與第7節額外授權。

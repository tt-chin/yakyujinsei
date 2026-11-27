# 統一測試入口

## Tests #286：FA操作按鈕與歷史測試前提

[Full #286](https://github.com/tt-chin/yakyujinsei/actions/runs/45549669028)在f9ae156f224790e825a32867957dd2414797fa33為136 PASS／10 FAIL，保留原失敗結果。本次分類R2（測試自動操作／計數與歷史fixture前提修正），產品引擎與RNG不變，不升版。

生涯自動選項及報價計數僅排除明示的[data-fa-sort]呈現按鈕；排序本身仍由fa-market-presentation-e2e測試，不增加步數上限、不改抽選或遊戲選擇順序。原FA簽約金額、重複操作、付款、原始狀態與RNG斷言保留。

hof-first-ballot／trait-display沿用ee0ae9ec863e4be0d1abc345d24080744bb6858c及既有新生涯版本對齊helper，完整S不刪除出生版本欄位。draft-income／display-preferences／game-view-dom按指定基準的實際背號功能驗證：舊基準仍要求無背號步驟；現代基準保留雙方背號紀錄並驗證提示存在性；GameView另比對雙方提示次數。display-preferences亦依基準是否已有decision-presentation，對現代基準與現行畫面對稱使用原有的嚴格UI包裝投影，保留原卡內文及完整既有S／RNG斷言。指定b8bc49b7b0cb14b24cec3b3499a57ecfb61e1a0d及其他歷史基準均不替換，不重建golden。只重跑失敗的個別E2E與必要Quick；GitHub手動Full仍須新提交重新驗證。

本地驗證：10個失敗入口的相關案例均重跑PASS；包含FA原生簽約20項、存檔15路線、GameView 8組生涯、選秀收入24項（含6組固定生涯）、HOF與特性P／IF、ACT原生／自然生涯與重播、背號2個原失敗案例，以及display-preferences的2個原失敗seed。必要Quick為115 PASS／0 FAIL／SKIP／BLOCKED。只執行個別E2E與Quick，未啟動Full profile；不將部分重跑稱為新Full PASS。


## 2.1.0 FA候選、欄位排序、文案與正常採番

本批本地Quick初跑112 PASS／3 FAIL；失敗為american-service-e2e、design-tokens-06.test及season-summary-e2e的舊期待值。各自調整後以Quick的--only入口重跑均PASS，未把原整套結果改寫為PASS，也未重跑已通過入口；其後新增的舊市場快取與市場metadata斷言另於fa-market-policy.test通過。GitHub Quick及手動Full須以推送後確定SHA另行判定。

FA候選修正屬R3。fa-market-policy.test先以原生CareerMovement市場重現MLB／MiLB來源MLB、KBO及CPBL低評價被排除；再驗證跨聯盟門檻、NPB國內FA限定、需求排名、最多4件、傷勢／特性減量、無報價、元球團排除與另列留隊、候選去重、同年度快取。固定b8bc49b7b0cb14b24cec3b3499a57ecfb61e1a0d不替換：候選集合未變的市場完整結果／RNG相同；受影響市場只允許lastFaMarket的報價改變，其他狀態保持。

american-service-e2e保留原8964d627a1f2dff5f38da31bd3a092eeaa903a6e年資修正基準，另以b8bc49b7b0cb14b24cec3b3499a57ecfb61e1a0d作FA修正前基準。P／IF固定seed於實際movement年資加算後及faMarket進入點比對完整S與每次RNG，候選新增前必須一致；候選新增後允許報價與後續選項／生涯分歧，不重建golden。報價件數相同的fixture仍嚴格比對全部抽值；快取重開不加RNG。原8964基準中直接MLB且滿期6年FA的舊市場期待值，僅改為允許這次已批准的市場欄位差異，其餘狀態／年資／抽值維持嚴格比較。

fa-market-presentation-e2e驗證64組P／IF版面、三欄雙方向、同值穩定、球團跳轉、鍵盤焦點／scrollLeft及原生契約選擇／重複點擊；排序／重繪前後完整S及每次RNG不得變動。PR #128為未合併設計草案，沒有產品碼可覆蓋；不先行實作其中待授權方案。

交易未成立卡只允許標題／內文差異；交易判定、35%抽選、續行及狀態須與b8bc49b7b0cb14b24cec3b3499a57ecfb61e1a0d一致。UI歷史比較的新生涯只在測試server將已凍結的2.0.0 config常數對齊目前VERSION，先驗證原設定的完整格式；歷史引擎、基準SHA及完整S／RNG比較不變，不從snapshot刪除版號。舊存檔跨版另測：依既有school-policy，2.0.0出生快照在2.1.0仍為UNKNOWN，無推算或移行；新建2.1.0的S／A／B／C按原條件判定。正常採番改變版本metadata與此既有跨版結果，不宣稱舊快照資格不變。版號涉及退役資格，相關比較、Quick及GitHub手動Full按R3完成；本機不執行Full。

## 米国服務年資與引退摘要

`american-service.test`先以MiLB／MLB錯配、既有5年服務年資重現舊版漏加與CONTROL，再測80組美國層級／出賽比例／2→3與5→6邊界／新controller重試，以及原生CareerMovement的滿期／未滿期／正常延長與升降格。`browser-save-codec.test`驗證原envelope不變、兩種美國org／lv錯配可載入、重複載入不重算、只依明示的年度／level／seasonFactor補年資，不採stats.MLB.yr，且非美國錯配仍拒絕。

新增`american-service-e2e`為Quick／Full的限定原生路線。固定基準8964d627a1f2dff5f38da31bd3a092eeaa903a6e與P／IF固定seed比較，年資加算本身無RNG；錯配案例只允許org、MLB服務年資及派生資格三項狀態差異，之後明確驗證實際調停／FA及同seed重複性。正常直接MLB與NPB／KBO／CPBL案例在受影響FA市場前，完整S、選項與每次RNG值不排除欄位；2.1.0市場候選許可差異見上節。另以原生簽約／升降格／再升格／交易／更新驗證組織與合約保證。不得把後續FA選項造成的生涯差異寫入新golden，或重建舊基準。

`career-review.test`與原生`ui-redesign-review-e2e --fixtures-only`驗證共用careerRecordModel的14層級、零值紀錄、全空fallback，保持原引退卡／保存圖片範圍及完整S／RNG。既有固定seed投手／野手個別契約E2E亦對照上述完整SHA並重播；不是本機Full。最終Full由使用者對確定提交於GitHub手動執行。

`npb-return-e2e`的3A fixture在顯示復歸／留隊選項前已升格MLB；留隊應維持升格後的MLB組織與層級，新約org亦為MLB，不沿用起始MiLB身分。明確驗證剛結束的小聯盟年度不加MLB年資、留隊續約不重複加年資，原金額、付款、雙擊、重繪完整S／RNG與歷史基準不變。此入口不屬Quick；`--quick`只略過其末段四組自然生涯重播，不代表整套Quick或Full PASS。

## 季末まとめ初次定位與年度別字體

`season-summary-e2e`沿用原固定基準`cf88d1a9d621c354d64a2de5c427cd437a8094bf`與完整S／每次RNG／原卡DOM比對，新增手機直橫向／短視窗及桌面實際log捲動容器：首次標題在固定頁首下、同年度重繪／契約更新／次年度不重播、原生季末能力點分配不回跳、原生交易與TJ選項先回答再結算。wheel／touchmove／鍵盤、選手／キャリア、dialog、跨年及DOM移除均在rAF前介入，驗證舊請求取消且重繪不補跳；同年度的新生涯可再次定位，明細手動開關及箭頭條件保持。只以fixture控制測試前提與結算後續，不更改產品流程或抽樣結果。

`event-history-e2e`保留自然年度與原事件展開／橫捲斷言，另用只讀呈現fixture檢查手機／桌面、P／IF、業餘文字／職業數字、四主題及標準／大字的每列四格font-family／font-size／font-weight一致，限定table的text-size-adjust為100%。這是Chromium模擬；Safari原生文字自動放大與工具列遮蔽仍須實機確認。

## 2.2.1 COPY-01 日本語表記の射影

`tests/support/copy-01-comparison.mjs` は承認済みの新しい文言（シード表記、カテゴリー別通算成績、経過シーズン数、衰えカード、私生活、年俸内訳など）を旧文言へ戻す候補側専用の射影。`game-view-dom-e2e` と `display-preferences-e2e` は基準の `docs/src` に新しい衰え文がない場合だけ適用し、その他の文字・DOM・S・RNGは従来どおり厳密に比較する。旧本体を直接比較する `season-phases.test` と `npb-return-ui.test` は衰え文1か所だけを基準側で置換し、`award-identity-policy.test` は凍結ファイルの承認済み文言差分を列挙する。共有画像のcanvas文字（殿堂行の読点・国際大会見出し）は射影しない。

## 2.2.0 ホーム年度履歴と年初セーブ v3

`home-year-history-e2e` は `q77bi1jx`（390px）と `jp3-infielder-01`（1280px）を通常UIで引退まで進め、毎年の年初セーブを実際に読み直す。保存見出しの順序、10／22年目に最古のカードを再展開、給与が異なる過年度の「年俸の内訳を見る」、詳細DOMの解放とS／RNG不変を検証する。前者は固定基準 `00fc40d460e706a8f994aebe936a41f1fc4d45a8` と行動列・各年の実行状態・全RNG値と状態を比較する。版番号に依存する引退資格を混同しないよう、新規対照生涯の設定定数だけを2.2.0にそろえる。別に未変更の2.1.0が作った署名済みv2を実際に読み込み、旧出生版と状態／RNGを保持し、翌年度に履歴つきv3で保存されることを確認する。

Windows／Chromeの実測は24／32チェックポイント、最大保存約359／400 KiB（上限2 MiB）。22年目のモバイル幅ではログ下のDOMが基準1126、現行連続213、読込直後73。これはDOM計測で、実機のヒープ・体感速度の保証には用いない。年初保存のみのため引退結果そのものは保存しない。元のGameView比較はレガシーの8区画と先頭カード位置へ候補DOMを明示的に射影し、残りの画面・S・RNGの比較を維持する。

## 本機與 GitHub Full 的分工

依使用者2026-11-17的長期指示，後續所有作業本機均不啟動Full模式（含整套、batch及Full模式的`--only`），也不拆批變相跑完整Full；直接相關的單體／個別E2E及必要Quick仍按`AGENTS.md`第6章執行。需要Full時，在結果明列 **「需要執行Full（GitHub手動／未執行）」**，附原因、分支、完整提交SHA與本機結果，由使用者手動在GitHub執行。Agent不自行dispatch或重跑手動Full；既有自動CI觸發條件不變。下方Full命令是入口與既有CI用法說明，不代表允許Agent在本機啟動Full。

Full需求、正式Gate與main合併條件仍保留；確認使用者執行的SHA與成功結果前，不能將未執行／待確認寫成Full PASS或正式驗收完成。

## 現在選項的浮動箭頭

配點入口另嚴格檢查visualViewport縮小、原footer補償生效後「確定」完整可見時箭頭必須隱藏，再以原指標點擊確定且只執行一次；失敗保存`confirm-navigation-failure.json`與截圖。根style監測只重算箭頭，不改配點避讓、分配、復原／確定或持續強制捲動。

`ui-redesign-decision-e2e`保留原P／IF完整S／RNG、原生配點草稿、防重複操作及128組版面，移除舊開關的可見點擊期待；收合狀態由原UI hook準備，新的返回入口必須展開並露出目前標題。新增390直向、844橫向、320短視窗與桌面內部選項overflow，驗證鍵盤Enter／Space、44px命中區、按鈕中心可點擊、收合／長選項逐次捲動／末尾隱藏、年度更新時保留舊閱讀位置、資料分頁返回、單一繼續與空選項。配點只操作箭頭並比對完整草稿／S／RNG，不觸發分配或確定。`--navigation-only`僅供直接執行時診斷新導覽fixture，不代替完整入口／Quick／Full。visualViewport高度以受控物件另作模擬；Chromium尺寸與模擬工具列均不是Safari實機PASS。原生Safari工具列展開／收合、直橫向切換及觸控命中須在本次實作完成後另外確認。

## 歷史間距比較與球場抬頭

後續確認：`77d536bb031ef70801b0511c057ae8145f028d1d`已取得Tests #265 Full144／144 PASS及#264 Quick success，歷史間距修正的舊待Full狀態已解除。這不覆蓋後續浮動箭頭；新導覽仍需新提交的GitHub手動Full。

`design-tokens-09-e2e`維持`f8afd8e`間距基準與`ad8e77f53ede29de6a51c23708b2370eed7b414d`凍結UI runtime。已核准的`235fd22827478884ad4a5b046002e62eb326ffe0`球場抬頭背景／文字色，以三條獨立固定CSS參考規則加至舊頁面；現行CSS須逐字命中每條一次，且手機規則仍位於699px斷點。41項樣式（含背景／文字／邊框色）、全部位置尺寸及34個間距selector仍嚴格比較，不忽略差異、不更換歷史基準。Tests #262的143 PASS／1 FAIL保留為歷史結果，修正後個別入口PASS不等於Full PASS；新提交仍需使用者在GitHub手動Full。本項僅改表示期待值，依AGENTS 6.1純表示例外執行相關入口，不額外重跑未受影響的Quick。

## 季末收入與來季契約整合

`season-summary.test`驗證實際Receipt／同年度schedule與決定、零／缺損、只讀snapshot與跨年隔離。`season-summary-e2e`以固定`cf88d1a9d621c354d64a2de5c427cd437a8094bf`比較原生付款、升降格／到期降格、續約、移籍、引退的完整S／全部RNG及還原後原卡DOM；含兩年度真實付款、變更最新契約後舊年度內訳、4個非職業邊界與64組版面。新入口進Quick／Full，不增加生涯批次。既有`ui-redesign-review-e2e --fixtures-only`保留128版面與原季末／引退fixture；歷史來源不換成HEAD，原文／狀態不放寬。

## UI 2.0 FA比較與骰子標示

`fa-market-presentation.test`驗證三種數值升／降序、同值穩定、缺損／非法值與凍結來源不變，並驗證目前VERSION的版本戳、未知／錯誤版本拒絕及完整來源不變。`fa-market-presentation-e2e`對固定`dc9bf83aca09a82ccc891b061231490ec9295c68`比較原生FA抽價及同一offer簽約的完整S／每次RNG，64組尺寸／主題／字級、排序與可視卡片／鍵盤／零報價、原按鈕identity／防重複及DOM投影錯值拒絕；不改FA抽價、金額或契約處理。既有contract-salary的FA模式仍比較原球團／原報價，先透過表格定位再按原按鈕。骰子上移由原allocation E2E驗證active、余白、復原／重設／用完與完成定位。

手機／FA／骰子原分支為Quick104／Full134，`6cf2f591eeb4db475de149a3a001ecfa23bfed07`已取得使用者手動Full134 PASS（Run45043264922）。合併最新dev的準備分支為Quick111／Full142，須另外驗證整合來源。本機只執行相關個別入口與Quick，不執行Full。2026-11-23依使用者指定維持2.0.0；FA與第2～5批固定2.0.0基準比較均保留state.version與birthHighSchool.createdVersion，不排除版本欄位。dev既有PLY-01比較仍按原契約驗證背號新增顯示與jerseyHistory，保留其餘S／RNG及原始基準。UI專用WeakMap／CSS排序不改原offers或choiceViews.buttons順序；歷史比較先驗證金額／球團／原按鈕再拆除呈現包裝。

### Full 45036594000 的 UI 測試追修

`npb-return-e2e`依核准的固定完整抬頭規格檢查導覽：桌面閱讀欄的 CSS top 為0，手機則等於完整board高度，並驗證導覽實際頂端緊接board底端；原120組設定矩陣、44px操作尺寸、溢出、薪資與狀態／RNG斷言保留。

`display-preferences-e2e`的一般設定矩陣先等原生開始按鈕enabled（引擎／存檔初始化完成）再輸入姓名；原獨立延遲引擎載入時先輸入姓名的案例仍保留。填入、開關對話框、每次設定及尺寸變更後逐步嚴格檢查姓名，不補填、不重試、不忽略姓名差異。失敗時在既有tmp證據目錄保存`name-preservation-failure.json`與截圖，記錄節點identity、焦點、設定、初始化狀態及最近輸入事件；原CI姓名空白尚未重現，不將新增診斷稱為已確認原始原因。Runner、入口數、歷史基準與遊戲程式不變；修正後需在新SHA由使用者手動執行GitHub Full。

## UI 2.0 季末／退休呈現

CareerReview只整理回顧，不再改結果卡的原生details.open。review的fixtures-only新增PRO／IND／CORP五類結果卡的混合手動狀態、整理建立／重繪保持、done後新結果展開及原生下一選擇收合舊卡；總結三明細預設關閉、重繪保持與隱藏收入卡沿用season-summary E2E。舊「引退原卡全關」期待改為新結果展開，手動關／再開與原S／RNG／DOM比較保留。箭頭80%只改CSS外觀，navigation-only另驗偽元素38.4px及字形80%、原48px點擊區與四尺寸操作；兩項均屬局部顯示，不更動通用選擇控制或Runner。

`career-review.test`驗證既有資料的唯讀摘要、棒球局數、確定／未定／零年薪與報價隔離、跨階段紀錄及缺少資料。`ui-redesign-review-e2e`的Quick僅跑原生fixture；個別完整入口另比較第4批固定SHA的P／IF兩條自然生涯，逐步全S與RNG嚴格相同。退休規則、年度付款、成長與存檔核心來源也須保持不變。128組viewport／主題／字級、無背景／無blur、空資料、原生details展開與分享控制項可達性另外驗證。720×450為200%等效重排尺寸，不能稱為桌面瀏覽器200%縮放或實機PASS。

`decision-dom-comparison`只驗證並移除新增回顧區，以及還原明確批准的投手告別文字；原卡片全文、節點與完整S／RNG仍嚴格比較。新增摘要的數值與資料來源由單體／原生fixture直接驗證，不靠忽略欄位或更換歷史基準。收入舊斷言須先以原生summary展開「キャリアプロフィール」，再驗證既有可見收入文字；不以textContent替代可見性檢查。

`tests/support/reader-disclosure.mjs`以原生summary點擊讀取退休卡片，先檢查唯一原卡片／details／控制項、展開後原body可見，再比較展開前後完整S／RNG。特性、稱號、評價與告別原innerText斷言保留；新取得說明仍須在導航後按原規則封存。不改DOM強制open、不全域改用textContent、不忽略原文。只有既有手動baseline路徑明示允許舊版沒有reader details；當前版本一律嚴格要求控制項。此helper由既有Quick季末／退休fixture實際使用，Quick102／Full132入口數不變。

## UI 2.0 配點的歷史比較

`tests/support/allocation-comparison.mjs`只注入E2E回應，不修改產品檔案或歷史基準。它在原生`allocUI`返回後讀取本次起點，先以既有DOM比較器驗證能力／繰越預覽、資源、原說明及無效確認按鈕，再提供原有操作標籤、選項結構與操作區文字。整區`innerText`使用短暫的離屏、inert／ARIA隱藏副本取得真實排版文字，完成即移除；不改動實際遊戲節點、S或RNG。

跨版比較不得直接把整個`.abrow`的新預覽文字當作原操作名稱，也不得不加驗證就忽略新增控制項。姓名測試保留同版原始`choices`比較，只有跨版才使用已驗證的原選項結構；其他入口仍保留原有完整狀態、RNG、歷史特例與輸入／timeout。`ui-redesign-allocation-e2e`以凍結第3批驗證各種原生配點、原DOM／標籤／文字及S／RNG，並要求錯誤預覽、資源及被啟用的假確認一律失敗。這些相關驗證不代替新SHA的GitHub Full。

## 原始碼文字比較的換行契約

跨Git歷史／Windows／Linux的來源比較，使用`tests/support/source-text.mjs`的`readSourceText(path)`（嚴格UTF-8讀取）或`sourceText(text)`，在切片、字串替換及比較**之前**將兩端CRLF統一成LF；其餘內容維持逐字相等。單獨CR、BOM、縮排、尾端空白、文字與程式變更不忽略。不可把此工具用於凍結快照、檔案SHA256、二進位證據或golden；原始資料不改寫。

Windows系統Git的`core.autocrlf=true`可使Git內LF在工作樹成為CRLF，部分歷史檔案在Git內本來就是CRLF；因此只正規化歷史端、只修改編輯器編碼或直接比較`git show`與工作樹都不足以保證跨平台一致。此次不修改全域Git設定、不批次renormalize產品／歷史檔案；日後若要訂全Repository的`.gitattributes`及編輯器政策，須另行確認保護歷史證據的路徑與精確差異。新增文字比較沿用此共用入口，不以全域trim／忽略空白替代。

`node scripts/test-source-text.mjs`為獨立小型驗證，涵蓋UTF-8、LF／CRLF／混合換行及非換行差異反例；不增加或減少原Quick／Full入口。現行版本檢查讀取`docs/src/config.js`的`VERSION`，只允許該宣告字面值隨正式升版改變，其餘來源與B1／A凍結證據斷言不放寬。

## 歷史分享配色模組依賴

1.16.2移除產品的`getSharePalette`後，仍載入舊`game.js`的投球、國際賽及弱小校比較，必須在舊版頁面呼叫`routeHistoricalShareTheme(page, baseline)`。特性顯示比較（`trait-display-e2e`）自TEST-BASELINE-REBASE-01起改以模組化後的基準`ee0ae9e`整棵docs供檔，不再使用此route；其`a0b880bb`仍作為helper／啟動檢查的基準。基準必須為該入口原先的完整40位SHA；helper只將該頁面的`src/ui/share-theme.js`回應設為同SHA的完整Git原件。基準缺失／不可解析即失敗，不回退現行模組、不補空函式、不更換舊game或golden。現行頁面不接此route；既有同版重播、狀態／RNG、比較斷言與timeout保持。

`node scripts/test-historical-share-theme.mjs --playwright=<外部Playwright模組> --browser=chrome --output=test-results/historical-share-theme-check`為獨立限定驗證：四組原始模組逐字一致、無效基準拒絕、四個歷史引擎實際啟動、現行模組隔離，並以移除route後的同型import重現原缺失export錯誤作負控制。不是完整生涯或Full PASS；不新增／刪除原117個自動Full入口。修正後仍須在新SHA取得GitHub Quick及必要Full結果，歷史111 PASS／6 FAIL不改寫。

## KBO 歷史比較的 1.14.0 許容差分

`tests/kbo-renewal-e2e.mjs` 同版重播使用既有 `assertSameCareer` 比較原始完整資料；跨版則由 `tools/development-b/championmaker-comparison.mjs` 根據舊版可信優勝紀錄獨立推導新增優勝請負人欄位與取得旗標，驗證後逐步嚴格比較。原始 state/calls digest 另行核對，既有 Decision 驗證仍保留；其餘狀態、選擇、薪資及 RNG 不放寬。遇差異只報第一個位置，避免整段生涯差異輸出耗盡記憶體。此 oracle 不得套用於同版重播，也不全域忽略任何欄位。

`node scripts/test-championmaker-comparison.mjs` 驗證正常與竄改反例；不取代 KBO 實際 E2E、Quick 或 Full。歷史 OOM／FAIL 日誌保留，新重測使用不同輸出位置。

## CI Full 分批保存

### 本機 Full：8批、最多2批並行

本機標準 Full 使用 `node scripts/local-full-batches.mjs --playwright=<外部Playwright模組> --browser=chrome`。既有 `node scripts/test.mjs full` 仍是逐項順序執行；CI workflow 不變。本機入口沿用同一份 inventory、LPT八批計畫、`run N` 與嚴格 aggregate，沒有刪減案例或改變測試timeout／斷言。每批內維持原順序，同一次本機Full最多同時執行2批，不等同於CI的8台Runner；請勿另外同時啟動其他Full或Quick爭用資源。

預設輸出到全新的 `test-results/local-full-<時間>-<隨機值>/`，也可指定不存在的 `--output=test-results/<新目錄>`，拒絕覆寫既有證據。各批保留 `batch-N/` 原生證據與獨立console log；`plan.json`、`source-manifest.json`、`coordinator.json`、原生 `summary.json`、`local-summary.json` 記錄計畫、含dirty／untracked程式的SHA256、進度、OS可用記憶體與結果。這不是完整artifact覆蓋保證，ARTIFACT_COVERAGE_BLOCKED仍獨立保留。

批次FAIL不會阻止其餘批次執行；Ctrl+C／SIGTERM停止排程並終止本次啟動的子進程樹。來源改變或無法核對時停止派發，已啟動批次結束後仍執行aggregate。任一缺失、損壞、FAIL／SKIP／BLOCKED、中斷、來源變更或非零退出均不可取得本機Full PASS。執行期間不要編輯程式或切換Git分支。重跑使用全新輸出目錄，不重用舊PASS。

工具限定測試：`node scripts/local-full-batches.test.mjs` 與既有 `node scripts/ci-full-batches.test.mjs`；合成與小型原生子程序測試不能取代實際Full。記憶體樣本的coordinatorRss僅屬排程程序，不是所有測試子程序總量；並行加速幅度需實測，不宣稱固定倍數。

## CI Full 分批保存

CI 的 Full 透過 `scripts/ci-full-batches.mjs` 依 `test-manifest.mjs` 的 `seconds` 預估以 LPT 平衡拆成8批（依當次inventory，目前105入口（syntax＋104個inventory入口，含開發中的年度存檔驗證）；無預估者以5秒計；批內維持 inventory 順序），呼叫原 `scripts/test.mjs full --only=...`；不更改 Runner、測試旗標、timeout、斷言或歷史基準。Quick／Audit 保持原命令。`plan` 固定當次 HEAD、Run ID／attempt及已解析的 origin/main；`run 1`～`run 8` 分別輸出到 `test-results/ci-full/batch-N/`，每批後由獨立 upload-artifact step 保存；`aggregate` 嚴格驗證完整集合、來源與環境、exit/status、log SHA256，任一缺失、FAIL／SKIP／BLOCKED或重用結果都不能得到Full PASS。

本地工具驗證：`node scripts/ci-full-batches.test.mjs`（合成故障案例＋一個明示原生Runner案例；不是完整Full）。Workflow檢查仍使用 `node scripts/check-workflow.mjs --playwright=<外部模組>`。新工具測試是CI工具的獨立驗證，不新增遊戲Full入口。

每批artifact名稱含Run ID、attempt及批次號，保存14天；保留既有tmp證據allowlist，不將全部大型／可能含敏感資料的tmp自動上傳。既有 `D2-CI-ARTIFACT-01 / ARTIFACT_COVERAGE_BLOCKED` 仍有效；summary／log保存不等於完整原始S/RNG可重播封存。Runner突然關閉時，只有之前已完成上傳的批次可期待保留，正在執行的批次及後續批次仍可能遺失；`always()`不能保證失去runner後仍能執行。正常測試失敗後後續批次仍會執行，原失敗step不會被最終彙整或上傳掩蓋。

平行執行（2026-10-23起）：Full 以 `full-plan`（`plan`，上傳 `tests-full-<run_id>-<attempt>-plan`）→ `full-batch`（matrix 1～8、`fail-fast: false`，各自下載 plan 後執行 `run N` 並上傳批次證據）→ `full-aggregate`（`always()`，下載 plan 與8批證據後 `aggregate`）三段 job 執行；非 Full 由 `tests` job 執行。上述分批、彙整條件與 artifact 名稱不變。`plan.json` 記錄 `runAttempt`，以「Re-run failed jobs」只重跑部分批次時 attempt 與 plan 不一致而無法彙整；重跑 Full 一律使用「**Re-run all jobs**」。

## C級高校工作樹驗證

school-policy.test為Quick/Full單元與原生初始化fixture：舊50校、60唯一ID、25/45/20/10邊界、C限定HS−4、不可變出生快照及三態資格。smallschool-c-e2e為Full/Audit：三尺寸、C／各gate明示fixture、升學／移籍、退休列表PNG及P/IF原始跨版完整trace＋同版重播。`--fixtures-only=true`只跑fixture；`--cases=<前綴>`局部重跑，不當完整入口PASS。

support/approved-school-oracle僅給歷史正向控制套用已批准高校／COPY差異，不能稱原始舊版重播／存檔遷移，也不能用於舊Bug負面基準。smallschool-c-e2e的原始舊game仍未改造。KBO負面digest只排除新增birthHighSchool metadata，其舊故障來源、金額／契約／RNG斷言保持。Master整檔不變舊斷言改為確認只append指定10校、其餘資料完整相等。

## 全力投球callback修正

`full-power-pitching.test`為Quick／Full／Audit原生函式64案（含四聯盟及MiLB適用階層，以及第11期11-A賽季後處理分派與`ec903fd`的等價fixture 11案）；`full-power-pitching-e2e`為Full／Audit的真實三強度callback、SP／MR／CL及1280／320／390px、TJ後續操作與完整生涯。基準20920dddd72ab8c91b0e2c71d560492663cd5aec，或明示`--baseline=<SHA>`；套用上節明示的C／COPY正向控制差分後，逐一比較proSeason／tjAccrue／tjCap／phasePre，只允許核准的一行投球callback差異，不再要求整個game.js與加入C前逐字相等。完整S／R斷言保留。可直接`--fixtures-only`做Preview矩陣，不冒充完整生涯。Full以`--part=`拆為三入口：`full-power-pitching-e2e`（`fixtures`：E01／E03＋S03 IF對照）、`full-power-pitching-yakyo-test-001-e2e`、`full-power-pitching-jp3-pitcher-02-e2e`（各為該seed的S01-S02），後兩者為僅import本檔的薄入口；三入口合計即原36案，直接執行本檔不加`--part`仍跑全部，未知part值丟錯。

契約、draft-income、display、trait-display、international-personal-stats、KBO正向控制及殿堂的歷史一致生涯，修正前後都以真實UI明確選「通常投球」；只改測試操作策略，不改遊戲source／S／舊baseline，不新增狀態排除，完整S、選擇與RNG斷言保持。KBO原2049負面案例為IF，操作策略不受這個投手選項影響。原始全力路線的失敗证据保留；新專項另驗證全力的首個effort差異、首次補正前的完整R前綴、成績／TJ與新版重播。全力路線後續條件抽選可依已批准的連鎖差異改变，不稱完整舊生涯R次數不變。研究100條原始資料不覆寫。

## 国際大会の本大会成績表示

`international-personal-stats.test`はQuick／Full／Auditの整形・差分・値コピー・旧結果単体（T01〜T13）。`international-personal-stats-e2e`はFull／Auditで、正式processIntlPhase、WBC／プレミア12、二重操作、T14全テーマ・大字・1280／320／360／390px、投手3／野手3の固定seed生涯を検証する。単独実行は`node scripts/test.mjs full --only=international-personal-stats-e2e`。`--fixtures-only`は明示的な専用入口直接実行に限り、生涯比較の代用ではない。

比較基準は表示修正直前devの完全SHA `e602174a22d7472e1021d780388ad61adc6b11b6`、または明示`--baseline=<完全SHA>`。各操作の完全S digest、選択文、最終S及び全R値／前後状態を比較し、versionとintlTraitResults内の追加personalStatsだけを除外する。大会結果全体や通算／所得を除外しない。元の完全Sも保存する。人工formatter入力／制御fixtureと自然生涯の出場を区別し、後者でWBCとプレミア12の到達を必須にする。

## 背番號（PLY-01）

`jersey-policy.test`為Quick／Full／Audit的規則單元。`jersey-e2e`為Full／Audit（約20秒）：本機server同時提供目前`docs/`、`/baseline/`（`59104210efa7704b4749f3da765544ea2e9b705b`，2.0.0，PLY-01合併前的dev）與`/legacy/`（`75ab10b7d442db7aeccde0d649a852f224eed481`，1.16.13，正式站main）。自然生涯（`probe33-1`／`probe33-6`／`probe33-8`）驗證P／C／IF／OF預設號碼、入團只問一次、對話框取消／0與00／A3／A4、選單改號與B1（OK／取消後焦點回☰）、J2續玩、退休後A1、二重操作、1280／390截圖；同seed與baseline比較全R值／rngState與S（只排除version、createdVersion、jerseyHistory），預設與對話框＋選單改號版本亦同。舊存檔D4以baseline（2.0.0）與legacy（1.16.13）各自實際產生；已有含jerseyHistory的存檔時開新生涯須經覆寫確認且不帶入號碼紀錄；B6直接竄改IndexedDB逐欄斷言`SAVE_JERSEY`。交易、MiLB→MLB、IND／CORP、留隊、B2以標示fixture的狀態加真實移籍函式驗證；目前程式不設定`tradeFrom`，「A→B」年度列只以fixture固定。

`jersey-flow.test`與`player-profile.test`為Quick／Full／Audit（重構第43期，`tasks/GAME_JS_OOP_REFACTOR_PLAN.md` §2uu）：以`159dbf2b293c6087df6a8f3713a19e6e61ad4a74`的舊`game.js`本體對照`JerseyFlow`（`teamName`／`unknownTeam`／`label`）與`PlayerProfile`（`allStars`／`pitcherRole`／`isStarter`），並以spy確認`game.js`的一行包裝委派到對應方法；`jersey-flow.test`另驗證對話框延遲回呼在state被替換後不再提示或寫入。`ovr`／`playerType`／`toolGap`／`abCost`的等價仍由`ability-allocation.test`負責。

## 国際大会出場履歴（INT-01）

`international-history.test`與`international-history-e2e`為Quick／Full／Audit（`tasks/INT_01_INTL_HISTORY_PLAN.md`）。單元測試以fixture驗證只列`S.intlTraitResults`的實際出場、依年度與實際日程排序（同年WBC先於プレミア12，自然生涯不會發生，只能在此驗證）、未知大會名「国際大会」、舊結果無個人成績顯示「記録なし」、跳脫、列凍結與狀態不變。E2E（約4秒）以hook注入結果，檢查「キャリア → 実績」與引退「通算成績」卡（緊接国際大会通算表之後）的收合列、展開內容、0屆時不加任何節點、查看與展開前後S（含`rngState`）不變，1280／390 px與4主題。

既有測試的核准差異：`ui-redesign-review-e2e`的`INT01_CORE`（`career-retirement.js`兩段插入）、`award-identity-policy.test`的`player-detail.js`兩組逐字修改、`career-presenter.test`的`career().international`空列表、`dom-snapshot`在`window.__expectIntlHistory`（只注入受測版）下檢查並刪除`career().international`與引退`#log`的`[data-intl-history]`區塊（`game-view-dom-e2e`的jp3-pitcher-02會到達）。`display-preferences-e2e`未處理此區塊：manifest以`--only-seed=yakyo-test-001,jp3-infielder-01`執行，兩者引退時沒有國際結果；改用其他種子（含不加`--only-seed`）前，須先比照`dom-snapshot`加上受測版的檢查與移除。

## 健康診断時の故障リスク（INJ-UI-01）

`injury-risk-policy.test`與`injury-risk-e2e`為Quick／Full／Audit（`tasks/INJ_UI_01_INJURY_RISK_PLAN.md`）。以`8a4f765`的`player-injury.js` `injuryProb`本體在vm中與`injuryRiskBreakdown().total`逐格比較（特性7組合×年齡15～48×`injNext`×`tmpInj`），並驗證步驟順序與凍結、年齡邊界、特性規則先於`tmpInj`、3／95%夾限、診斷後（本session記錄）、`phasePre`前（`tmpInj`視為重置）與復健季的顯示，以及`rollInjury`以`total`抽選並在抽選前記錄。E2E（約20秒）以真實賽季打到健康診斷，比對診斷前顯示值與結果卡「故障率」、診斷後「判定済み」，再以hook檢查年初（`phasePre`前）、`phasePre`後、復健季與年初待復健；桌面側欄重繪時細目與「潜在能力について」各自保留展開狀態；查看與展開前後S（含`rngState`）不變，1280／390 px與4主題。
既有測試的核准差異：`award-identity-policy.test`的`ability-view.js`兩組逐字修改、`career-presenter.test`的condition第1列（fixture只補缺欄）、`phasePre`的`markSeasonStart(S)`一行（`season-phases.test`插入清單、`verify-modularization`建構行、`full-power-pitching.test`／`npb-return-ui.test`的stub、`full-power-pitching-e2e`剝除清單）、`dom-snapshot`驗證並刪除condition的風險列（`game-view-dom-e2e`以`window.__expectInjuryRisk`要求受測版必須有該列）。

## 生涯RNG（`Rng`）

`rng.test`為Quick／Full／Audit：以`650e4dd21718b4abec3876fc9ef6148714c21d4f`舊`seedInit`／`R`產生的golden值，驗證`docs/src/engine/rng.js`的種子、步進、hash為0時的退回值、每次重讀`S`，以及`game.js`的`seedInit`／`R`委派與`_s`同步。不是完整生涯比較；E2E的RNG計數經`tests/support/rng-instrument.mjs`：現行原始碼以`careerRng.onDraw`計數，沒有`careerRng`的舊基準原始碼仍以`R`定義文字替換，兩者皆不符時丟`RNG_INSTRUMENT_MISS`；`rng-instrument.test`（Quick／Full／Audit）驗證這三種情況。vm harness仍抽取`seedInit`／`R`單行（見`tasks/GAME_JS_OOP_REFACTOR_PLAN.md` §2.2、§2b）。

E2E hook的注入點經`tests/support/overlay-hook.mjs`：日本版覆寫仍為IIFE的舊基準原始碼插在最後的`})();`之前；覆寫拆殼後（第4期4-A）的原始碼依注入順序附加在模組頂層（不包區塊：hook宣告的函式須讓覆寫程式碼解析得到，例：`kbo-renewal-e2e`的`applyKboForeignPackageCap`；與模組名稱衝突時載入即SyntaxError）。找不到標記或插入點在標記之前時丟`OVERLAY_HOOK_MISS`；`overlay-hook.test`（Quick／Full／Audit）驗證兩種路徑與錯誤路徑（見計畫書 §2f）。

`node scripts/test.mjs list` 列出所有 tests 檔案、分類、依賴、概算秒數、旗標與模式。新增未分類檔案會報錯，不會悄悄略過。

```sh
node scripts/test.mjs quick
node scripts/test.mjs full
node scripts/test.mjs audit
node scripts/test.mjs full --only=contract-salary-e2e
```

quick 執行全部快速原生／單元入口、JS 語法、KBO quick、ACT 入團／listener fixtures、draft-income quick。full 不重複 quick 入口，而是擴大相同入口的測試範圍，並執行其餘瀏覽器、投手／野手生涯和 RNG 比較。audit 包含 full，加兩條 P／IF 自然生涯研究及重播；人工項目明列 SKIP。

五個既有功能 E2E 以 `--ui-only`／`--quick` 執行完整的原生功能 fixture／UI／候選 RNG 矩陣；不在每項重新跑相同的舊版生涯比較。完整生涯由 ACT、contract、draft、display、event 的專門入口覆蓋，保留各自不同的契約／收入／UI重繪／事件斷言。需要重查原歷史生涯時可明確使用 `--legacy-careers --only=<id>`；不刪除或改寫舊斷言。`npb-return-e2e` 例外：其對 `73d5a58` 的生涯比較已經批准移除（`18820f0`），常規 full 執行不帶參數的完整模式（fixture／UI＋現行版 4 seed 各重播兩次一致）；與 `73d5a58` 的 return-gate 路線比較由 `npb-return-rng-e2e`（`--rng-only`）執行。

display 的常規 full 執行全部設定／尺寸／DOM 保持矩陣，加 P／IF 各一條每17操作切換設定的完整生涯。其餘4條不重複，原六條完整設定生涯仍可用 `--legacy-careers --only=display-preferences-e2e` 執行。

## 依賴與可再現基準

Node.js 24.15.0、Git 完整歷史；瀏覽器入口另需已安裝的 Playwright 1.62.1 及 Chrome 或 Chromium。不會自動安裝套件。

以 `PLAYWRIGHT_MODULE` 指定外部模組，`TEST_BROWSER=chromium` 選擇 Chromium；亦可用 `--playwright=<模組位置>`、`--browser=chrome|chromium`。預設維持現有測試的 Chrome，不加入個人路徑。CI 的 `tests`、`full-batch`、`full-aggregate`（後者為與各批 log 絕對路徑一致）在以 digest 鎖定的 Playwright 1.62.1 官方 container（`mcr.microsoft.com/playwright`）中執行，系統依賴、字型與瀏覽器來自 image，不經 apt；另在 `$RUNNER_TEMP` 安裝同版 Playwright 模組。皆非遊戲依賴。

現行一致性比較預設 `--baseline=origin/main`，在開始時解析為完整 SHA 並保存。離線 clone 可明確指定 `--baseline=<已取得的 commit>`。不得將未取得基準或未安裝瀏覽器視為 PASS。Git checkout 必須保留歷史；GitHub Actions 使用 fetch-depth 0。

歷史基準不是一律過時：KBO 的 f3efb0a 和首輪殿堂的 925987d 是舊 Bug 證據；文案、NPB 回歸、事件等入口也有歷史控制組。list 列出原引用，summary 記錄解析 SHA。不要將這些負面基準換成 HEAD，也不要為測試變綠改遊戲／斷言。

## 輸出與結果

預設寫入忽略的 `test-results/<時間>-<模式>/`。每個入口一個 `.log`，`summary.json` 保存指令、exit code、秒數、環境、HEAD、基準、來源 fingerprint。原 E2E 的 JSON／截圖在同目錄 tmp 中，方便 CI 上傳。

PASS 僅表示入口实际執行 exit 0；FAIL 包含非零 exit／逾時；BLOCKED 表示必要依賴不足；SKIP 是明示非自動項目。FAIL／BLOCKED 令整體 exit 非零；一次失敗仍繼續其餘預定入口。統計是入口數，不是假稱所有唯一斷言／遊戲分支數。

`--output=<路徑>` 指定輸出；`--only=<id,...>` 可獨立執行列出的入口（不受模式預設篩選限制）。`--self-test-failure` 在既定測試後新增 exit 17 的故意失敗；只供 Runner 驗收，不能當一般成功測試。

明示 `--reuse=<summary.json>` 可於 audit 重用同次 full 已實際 PASS 的入口，避免重跑：必須來源 fingerprint、解析基準 SHA、Node／平台／瀏覽器、完整命令與日誌 SHA-256 全相同。報告保留原日誌、原耗時及 `reusedFrom`，另外列 executed／reused；不冒充重新執行。來源不符直接非零；FAIL／BLOCKED 不重用。CI 不使用快取驗收。

## 明確不自動執行

- retirement-hof-analysis／report 會改寫歷史報告，需確認輸入與寫入目標後才獨立執行。
- support 和 JSON 不是測試入口；fixed-seed-regression.json 是歷史摘要，不能代替實測。
- 4,000 生涯需要另外批准採樣策略、涵蓋各聯盟及估時；目前 pilot 最多 50 個預設組合，不是假稱 4,000 樣本。手動例：`node tests/retirement-hof-pilot.mjs --playwright=<module> --browser=chromium --limit=50 --output=<JSON>`。
- 實機原生 share sheet、iPhone／Android 不由 Chromium 手機尺寸模擬替代。
- CI 的遊戲程式取自 loopback（現有 UI 另請求 Google Fonts CDN）。Preview E2E 另用既有入口 `--preview=<URL>`，且先確認最新配信內容；不可拿可變 URL 的舊版本充當 commit 驗收。外部字型／網路故障不得冒充遊戲斷言通過。

CI 環境依 [Playwright 官方 CI 指南](https://playwright.dev/docs/ci) 安裝 Chromium；測試 workflow 不包含部署或正式 repo 寫入權限。

## CI 證據補記與觸發

dev push 僅在所有變更均為 `BACKLOG.md` 或 `docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md` 時排除 Tests workflow。此精確白名單只供驗收證據、CI Run ID／結果與統計補記；路徑規則不判斷文字內容，若變更驗收準則或其他實質內容，應手動執行對應測試，不得藉此省略必要驗證。新增報告不自動列入白名單。

遊戲、測試、fixture、Runner、workflow、AGENTS.md、CURRENT_SPEC.md 及其他未排除檔案的單獨或混合變更仍觸發 CI。main PR 的 full 與手動 quick／full／audit 不使用路徑排除，避免必要檢查因文件 PR 而永久 Pending。Cloudflare Preview 與正式發布 workflow 不受此設定控制。

最終報告須區分實際測試通過的完整程式 SHA／CI Run URL／模式／結果，以及後續純文件 Commit SHA／變更檔案／未重跑 CI 的事實。不能把前者的 PASS 當成後者已執行測試。Runner fingerprint 仍包含 docs 下的報告；本次不放寬 `--reuse` 的一致性檢查。
## 1.11.6 出生快照與歷史比較

新增的support/baseline-initial-potential.mjs只對正向歷史UI比較，在基準newState返回時補入核准的出生pot合計，不覆寫既有值、不消費RNG、不用退休pot反推。display／draft／contract／HOF的正向舊版比較使用此adapter，仍保留完整S／RNG斷言。KBO原始負面程式不改：首個2049錯誤及所有數值仍驗證；前綴snapshot僅移除新增potSum0與原有version，非balanced正向歷史生涯才用adapter。925987d殿堂與f3efb0a KBO的真正負面控制來源保持。

這不是「修復前完全不變」的證據。另實際執行 `node tests/stage10-risk-e2e.mjs --compare=<完整修復前SHA> --playwright=<module> --output=<directory>`，載入未改造的修復前game.js，比較逐操作S／選擇／RNG；只允許新增potSum0及引退完成後grinder的批准差異。原始／現行完整狀態都保存。57常規案＝原44＋7稱號邊界＋6重畫／殘留；加P／IF原生比較為59案。此較長入口仍Full／Audit，不加入Quick；新增support只有import分類，不是可執行測試。Runner與CI邏輯不變。

## 1.14.0 比較器與本機資源保護

歷史正向比較僅在明示 `{championmaker:true}` 時啟用獨立狀態 oracle：先以可信 championshipResults 嚴格推導並驗證三個新增欄位、第五年取得旗標，再投影為舊 schema。fixture 缺旗標只限明示 fixture 模式；同版重播仍完整嚴格比較。比較入口（`draft-income-e2e`、`contract-salary-e2e`、`display-preferences-e2e`、`game-view-dom-e2e`）只在基準的 `docs/src/config.js` `VERSION` 早於 1.14.0 時啟用此投影（`baselineNeedsChampionmakerProjection`）；基準為 1.14.0 以後時不投影，以原始完整資料嚴格比較。既有收入、能力、Decision／Receipt、選擇及 RNG 不因此排除。DOM 比較逐項驗證核准的 TJ 格式、陰影與取得顯示後才還原舊表示，其他 DOM 保持原斷言。

`assertSameCareer` 先使用 Node 嚴格深比較，失敗只輸出有界的第一個差異，不把完整生涯交給 AssertionError 產生無限長 diff。`node scripts/test-comparison-safety.mjs` 驗證負面案例及 64 MiB heap 下的大型不相等輸入；不是省略狀態比較。

本機八批排程每批啟動前檢查至少 2 GiB 可用實體 RAM；不足最多等 60 秒，仍不足則停止派發、記錄 RESOURCE_BLOCKED 並嚴格彙整為不完整，既有批次仍保留結果。不更改測試 timeout、heap 或重試；這是啟動門檻，不是執行中記憶體充足保證。瀏覽器進度診斷每 10 秒記錄目前操作、等待時間及記憶體，保留最多 512 個已完成操作，不取代完整狀態證據，也不將逾時轉為 PASS。ACT 支援明示輸出目錄並分開保存同 seed 重播證據。

工具驗證：`node scripts/local-full-batches.test.mjs`、`node scripts/test-browser-progress.mjs`、`node scripts/test-championmaker-comparison.mjs`、`node scripts/test-comparison-safety.mjs`。歷史 Full FAIL 原樣保留，新版需以確定來源重新取得 Quick／Full 結果。

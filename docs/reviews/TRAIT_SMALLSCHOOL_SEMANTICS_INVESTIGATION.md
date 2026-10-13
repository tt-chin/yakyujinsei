# TRAIT-SMALLSCHOOL-SEMANTICS-01 出生高校與特性相容性調查

2026-10-13；dev HEAD `444144a57fb3ad23ac2bd1b3e9c87ba0809ea9bb`；VERSION 1.11.9。CODE＝本輪靜態程式事實；HISTORY＝歷史來源；PROPOSAL＝待批准設計；UNVERIFIED＝證據不足。本次未執行自然生涯或fixture，沒有新的測試PASS。

## 1. 結論與資料來源

CODE：現行角色建立時確實抽出初始高校，但沒有獨立保存出生高校快照，也沒有寫hsTier。退休稱號仍讀hsTier===3。schoolTier是目前學校欄位，升大學會覆寫。這使新角色無法僅憑原生出生欄位滿足舊稱號條件；不能改讀退休schoolTier來解決。

HISTORY：舊3是弱旅，B在封存日本版規格是古豪・地域強豪。二者沒有找到正式轉換政策，也不是同一學校集合、補正或分布。結論 **UNVERIFIED — DO NOT AUTO-MAP**。B是否今後也符合「弱小校」是產品語義決策，不是已證明的舊資料映射。

已查AGENTS.md、CURRENT_SPEC.md、BACKLOG.md、NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md、TRAIT_DISPLAY_UNIFICATION_ACCEPTANCE.md、STAGE8_HISTORICAL_SPEC_AUDIT.md、docs/design/CURRENT_DETAILED_DESIGN.md；全部存在，NOT_FOUND=0。接受文件中既有測試結果是歷史證據，不當本輪重新執行。現行game.js、trait-policy.js、ui/ability-view.js與stage10-risk-e2e、trait-display-e2e、event-integration相關來源已搜索。來源快照与原始保存S不重新生成。

## 2. 出生高校實際資料流

「出生」在本系統是玩家16歲、高校一年春開始的角色生成，不是生物出生時學校，也沒有另一次玩家選校／入學抽選。初始高校與入學故事共用同一生成結果。

```text
startJapanese (game.js:3141)
  normalizeSeed / seedInit；S暫存rngState
  → active newState (2826–2840)
    ab初值與額外能力ri → pot洗牌R/分組ri
    → tierRoll=floor(R()*100)，S/A/B=30/50/20%
    → pickRecord(該tier高校Master；空組才全校fallback)
    → state.team/name、schoolId、schoolTier、stage=HS、stageYr=1
    → traits.smallschool=false；potSum0保存生成pot合計
  → 選手誕生入部文字 → startYear(2999)
    → phasePre / 國際phase / phaseMid / phaseEnd
  → 高校畢業 pathChoiceHS(2876)或draftFallback(2867)
    → setSchool('U')(2864)：覆寫schoolId/schoolTier/team/lv/org
  → advance wrapper(2824) → 原advance(1993)
    age/year/stageYr++、resetEventYear、startYear
  → endGame wrapper(3133) → LEGACY.endGame(2145)
    reachedTop gate → !traits.smallschool && hsTier===3 → 取得
```

CODE：tier抽選發生在能力與pot生成後，不用tier回頭產生初始能力。不能移植封存文書的tier潜在+4/+2政策。schoolId是穩定Master ID但欄位本身會覆寫，不能以「穩定ID」誤認為出生快照。team亦隨升學、社會人、職業變動。lv/org是目前層級與組織；stage/stageYr是生涯階段；entryRoute='HS'是路線，不含初始學校等級。potSum0是出生潛在合計，不能替代高校來源。

一般advance未直接重寫schoolTier；高校進大學的進路操作會先setSchool再advance。職業階段可能留有最後一次schoolTier殘值，不能稱它仍代表目前高校、更不能反推出生高校。setSchool可接受非U選高校，但搜索到的現行進路以U呼叫；不把helper可接受參數當自然轉高中證據。

## 3. 歷史版本對照

|版本／完整SHA|欄位與值|實際語義與來源|能否對應|
|---|---|---|---|
|初次日本版 8b1dabfeb95fb117eeb1d27f6e5ce7ed7119ac9e，index.html|hsTier 1/2/3|newState hsMap：T1名門+6、T2中堅0、T3弱旅−6；6校各2，選校一次R；retirement讀3|本版本自己的3意義明確；不能推出B|
|JP3 0d0796d43b59782086f2a37549c90e1a6896572b，src/engine/game.js；config為RULES_VERSION JP3／RNG_VERSION1|舊newState hsTier仍存在；active override用schoolTier S/A/B|同檔雙定義，active用二段tier／校抽選，未帶hsTier；setSchool可覆寫|沒有轉換函式，不能將同檔共存當映射|
|配信路徑分離 4c44cc24a1a89507266aff4e76f2bec3d8bfb53b，docs/src/engine/game.js|schoolTier S/A/B|active 30/50/20%；cupOnce補正+6/+2/−2；舊hsMap與退休hsTier讀取仍保留|UNVERIFIED — DO NOT AUTO-MAP|
|國內大會修正 99141e3c6b638ee7fb71d1d436f29aa9c6d217e9|schoolTier S/A/B|增加選拔资格／大会policy；初始化新增senbatsuEligibleYear，未補hsTier|未建立對應|
|出生pot修復 0689d350daf9b2c52064e8d4303ed40050fed344；驗收1.11.6|potSum0；schoolTier仍舊方式|批准只保存pot出生合計；明確排除smallschool/B→3|不能借grinder批准擴張|
|本dev 444144a57fb3ad23ac2bd1b3e9c87ba0809ea9bb／1.11.9|schoolTier S/A/B、無hsTier初始化|game.js2826–2840、2864；退休2159讀3|不能對缺欄位補推|
|封存docs/archive/local/YaKyoLife_詳細設計書.md:236,266,446；封存來源803e81e6424d463f5191e90017dbc69157eea1da|S/A/B|S全国優勝候補、A全国常連、B古豪・地域強豪；含未完全照現行的潜在補正條款|B不是明文弱旅；不作現行規則或遷移授權|

歷史路徑先經git ls-tree核對：JP3程式位於src/，不能因docs/src不存在而判資料消失。追查git log -S hsTier、-S schoolTier、-S tierRoll與-G雙欄位共現；tierRoll的歷史入口另見5ae494b0b9cf3376413e72384b67e7263ec8691f（chatgpt實作）。未對每個歷史commit逐一跑人生；本表是查明的里程碑，不稱全歷史逐版驗收。

舊1與S同為+6也不證明映射；舊2是0而A是+2，舊3是−6而B是−2。兩套分類的順序相似只能是推論。同名數值也可能出現在退休tierOf評價中，後者不是高校分類。歷史六校與現行50校並無一對一ID遷移；未知版本、升學後schoolTier或學校名不能無損恢復出生資料。一對多／多對一對應沒有已證明政策，不應自訂。

## 4. smallschool條件、狀態與顯示

穩定ID `smallschool`；現行正式名稱「弱小校の星」（trait-policy.js:3）。取得文案（game.js:2160）：「無名の弱小校から、ついに最高峰の舞台へ。出身校が選手の限界を決めるわけじゃない――自らのキャリアで証明した。」traitResultMarkup將它列為memorial（647–651），取得當下補「能力への追加効果はない記念称号です。」。

取得條件是退休時reachedTop且未持有且嚴格數字hsTier===3。reachedTop（2156）為CPBL退休評價i===0，或存在S.stats.NPB，或存在S.stats.MLB。NPB bucket可包括二軍／育成，不能把現行gate說成NPB一軍；KBO本身不在gate。這是現行程式事實，不在本任務改動。

不是出生時立即取得；出生資訊是资格來源，後續生涯達成後在endGame取得。不是每年度重新判定。endGame先有done guard，!traits.smallschool再保護重複取得。沒有搜索到專用removeTrait('smallschool')呼叫，也沒有事件獎勵依賴smallschool；現行用途為稱號、清單／退休／PNG／fan picks，無額外能力、薪資或事件加成。通用removeTrait存在不等於它會自然失去。

四種資料分開：

1. 资格：出生來源（目前舊hsTier）＋退休gate。
2. 持有：S.traits.smallschool boolean；既有true不因缺出生資料改false。
3. 名稱：TRAIT_LABELS與traitLabel／displayTrait；不是資格依據。
4. 歷史：S.removed失去名稱、DOM取得卡與traitPresentation WeakMap。此稱號未找到獨立取得年份ledger；不是honors獎項紀錄。WeakMap只管顯示生命期，不是存檔或出生事實。

buildTraitsViewModel(617)讀boolean顯示名稱，退休posT(2262)、shareImage traitNames(2363起)同理；fan picks(2305)可依既有true添加。既取得資料顯示不重新抽R／給獎。不存在完整途中存檔載入遷移；「相容讀取」是針對可驗證舊S/fixture設計，不宣稱save migration。

## 5. 現行問題與風險

CODE推導：原生active newState沒有hsTier；此欄位沒有現行產品補值程式，故新資料的舊条件為false，稱號取得存在漏判缺口。這不是證明所有B都應得獎；B是否應符合仍DESIGN_PENDING。

若直接改為schoolTier==='B'，大學B可誤發，出生B升S可能漏發；從當前team或master名字回查亦有同樣風險。舊hsTier被不可信工具注入／來源版本不明也不可當出生事實。

tests/stage10-risk-e2e.mjs:21的S/A/B→1/2/3是故障注入假設；63行明文「B->3 is a test assumption, not approved policy」。其fixture成功不是映射證據。61行歷史測試核對出生B、升學後無hsTier、potSum0保持；65行正常IF人生smallschool=false。這些既有結果可支持欄位缺口，不授權填值。

## 6. S0／S1／S2方案

S0維持現況：既有true可靠保留，可信legacy hsTier3可依原條件讀；現行新角色資格缺口不能解決。可作批准前暫態，不建議宣稱功能正確。

S1新角色出生快照：建議`birthHighSchool={schemaVersion:1,classificationSystem:'JP_SAB',schoolId,tier,createdVersion}`，在active newState已選好school後值拷貝，before首次startYear。只有新資料可寫；snapshot概念不可變，setSchool/advance禁止改它。不增加抽選，不調ab/pot/potSum0。但快照有B仍不代表smallschool符合，需另外批准弱小校分類資格。

S2快照＋可信舊來源讀取：新資料同S1；可信數字hsTier3可保留`LEGACY_T123`來源分類，不把它轉JP_B。只有來源SHA／schema和出生欄位保存政策有證據時才可使用，不能僅憑state.version='1.0.0'保證，因歷史override曾共存。缺少快照或矛盾回UNKNOWN；既有true優先保留，不補发、無随机。

建議採S1新資料保存機制，加S2的保守unknown处理與既取得保持。不要此時承諾全面legacy映射；legacy讀取白名單需要各版本寫入與覆寫audit，未完成前關閉。快照可先設計但不能藉它自动启用B資格。詳見決策矩陣。

## 7. 相容讀取設計（待批准）

- traits.smallschool已true：保持，不重發解鎖卡／能力／抽選；資料未知不降級特性。
- 合法可信birthHighSchool：讀分類系統與tier；用批准的獨立资格政策。
- 有來源證據的legacy hsTier：保存原LEGACY_T123語義，strict number值；3只能證明舊弱旅，不自動填B。
- schoolTier單欄位、缺來源、同時兩欄位矛盾、非法值：UNKNOWN，不從升學後等級、退休pot、team名或新seed執行結果推測，不補出生資料、不新發稱號。

缺失不等於不符合；報告應分NOT_ELIGIBLE與UNKNOWN。對已持有true仍只有顯示狀態，不用资格政策推翻。

## 8. RNG與固定Seed風險

複製已有選校結果可RNG0，不改tier抽選或school pick次序，ab/pot/potSum0應完全一致；新增快照會令完整S digest不同，必須精確允許新增欄位，不能把traits或整段S排除。改稱號會增加退休解鎖DOM／fan picks候選，有可能改退休選項抽R分支，所以「判定不抽R」不等於整人生R值不變。需trace核查實際后续R，事前批准差分，不能保證舊seed完全不變。

舊fixture不得補造出生高校使測試綠。需要新設計專用明示fixture，保存舊fixture負面缺資料，不改seed生成。grinder potSum0和原gate／門檻完全保持。

## 9. 未執行的測試案例設計

所有以下均DESIGNED_NOT_RUN，非PASS：

- N01新資料符合已批准出生分類且reachedTop→退休單次取得；出生時尚false。
- N02不符合→不取得；N03出生與目前學校一致；N04升學後不同→仍只讀出生快照。
- B01新JP_B→在批准資格前UNKNOWN；B02其他S/A→按批准政策；B03可信舊3→保留舊分類；B04缺snapshot→UNKNOWN；B05未知tier；B06null/空字串/字串'3'/NaN/非法schema→UNKNOWN、不抽R。
- H01已取得true＋缺欄位→true、無再獎；H02舊未取得→不補發；H03只有hsTier且來源可信／未知各一例；H04只有schoolTier但已升學；H05兩欄位矛盾；H06來源無法確認；H07已取得但tier矛盾仍保持。
- R01同seed同操作出生ab/pot與potSum0完整一致；R02快照建立R增量0／全部R值與窗口比較；R03只允許新增snapshot及批准退休smallschool差分，其餘完整S一致；R04重入endGame不重發；R05advance/setSchool不寫birth；R06grinder原P237/238、IF469/470、missing与already fixture保持。
- U01取得卡原因＋無額外能力效果；U02能力頁特性列表只名稱；U03年表不捏造取得年；U04退休總結、PNG只名稱；U05已有true不重現取得说明；U06 1280/320/390長名稱與取得卡、清單、PNG；尺寸模擬不是實機。

歷史正向基準如需adapter，只能复制已保存的可信snapshot，不自行重跑旧seed补高校；当前缺失数据测试不得用adapter覆盖。修正實作屬狀態與取得確定行為，按L3設計驗證，不在本唯讀任務執行。

## 10. 決策與限制

需使用者批准：(1)「出生高校」定義為16歲初始抽選／入學學校；(2)JP_B是否算弱小、或另定分類（不能改生成）；(3)維持現行reachedTop gate含NPB二軍／育成與不含KBO的界線；(4)快照schema與資格policy分離；(5)缺資料UNKNOWN、既取得保持、不retroactive補發；(6)舊讀取白名單與退休DOM/R差分；(7)未來實作與L3驗證範圍。

未確認：沒有已批准B↔3映射、未對每個歷史SHA完整欄位寫入／工具污染作audit、封存文書最初作者版本不是封存SHA、所有特殊舊S來源不可核實、未自然重跑smallschool。沒有新實測、UI或Full/CI結果。已完成的是調查與設計文件，不結案BACKLOG。

重現查詢：`git log --all -S hsTier -- index.html src/engine/game.js docs/src/engine/game.js`；同法schoolTier/tierRoll；`git show <SHA>:<實際路徑>`；`rg -n 'hsTier|schoolTier|smallschool|potSum0' docs/src tests`。現行與封存来源均僅讀取。

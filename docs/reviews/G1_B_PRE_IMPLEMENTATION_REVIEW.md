# G1-B 實作前審查

> 2026-10-18歷史定位：本報告的「不可開始／尚未批准」是2026-10-14審查時點，不能推翻後續開發A／B的明確批准及已接受範圍。現行規格與限制見[CURRENT_SPEC§17](../../CURRENT_SPEC.md#d2-current-spec)及[精簡歷史摘要](RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)。原SHA、風險、Gate與測試狀態原文保留，不構成新的實作授權。

2026-10-14｜ANALYSIS_ONLY / DESIGN_REVIEW_ONLY。結論：**G1-A可以限定交接；G1-B尚不可開始產品實作。** 本報告不授權任何Gate，不修改正式風險ID或已批准設計。

## 1. 審查基準與文件來源

- Repository：tt-chin/yakyujinsei；branch：dev；本地HEAD：`287dd1a00448add8563410659170aba0d8f2f012`。
- VERSION：1.12.0，管理位置為[docs/src/config.js](../src/config.js)，不是根目錄VERSION檔案。
- 本地main：`4624753a5359acd6c63ab6957341376bd43c5c88`。本次不fetch／pull，不宣稱已重新核對遠端最新HEAD。
- 開始時工作樹：`M docs/designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md`、`?? tasks/`。D2既有四行修改及未追蹤計畫均為既存工作，本次保持原樣。
- game.js磁碟SHA256：`4b7d893b44d4cf943ff7c017c8bbca73474e5b5ae9bd8513455a80ae18315629`，與G1-A正式結案證據相同。
- D2工作樹SHA256：`6daa8b4aa4eedb508627ab3d41fd816afddfce5240f829228ce6b6dbb4027352`；分階段計畫SHA256：`6f03763f226067d7b6004f2d8f9e6796c4c78b946c113f76184a9cbd395c2f43`。未提交文件不冒充Git中已生效的授權。

閱讀基準：[AGENTS](../../AGENTS.md)、[CURRENT_SPEC](../../CURRENT_SPEC.md)、[BACKLOG](../../BACKLOG.md)、[CHANGELOG](../../CHANGELOG.md)、[現行入口](../index.html)、[D2主設計](../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md)、[D2決策紀錄](../designs/PITCHER_AWARDS_D2_DECISION_LOG.md)、[分階段計畫](../../tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md)、[日文名稱限定驗證](AWARD_JP_NAME_LIMITED_VALIDATION.md)、[技術驗證](PITCHER_AWARDS_D2_TECHNICAL_VALIDATION.md)、[G1-A結案](G1_A_LIMITED_FIX_ACCEPTANCE.md)及[可攜執行結果](g1-a-validation/test-expectation-acceptance.json)。

獨立G1-B正式規格／決策章節：**未找到**。G0當時回覆不是本次新增的正式規格；不推測不存在文件的內容。G1-B名稱出現在G1-A後續界線及BACKLOG，但不能據此擴充工程授權。

## 2. G1-B的正式範圍判讀

分階段計畫第3節（L43）、第5節（L65起）正式定義的是**G1：穩定獎項ID／adapter＋六項既有日文名稱漏判修正**，包括歷史名稱、producer／consumer映射與F-ID01～12。沒有正式獨立的G1-B章節。

G1-A結案只完成六個漏判效果：三個phoenix與三個降格保護，並保留既有legacy判斷。未建立ID adapter、Decision、Receipt或新獎producer。因此「G1-B」目前只能理解為**剩餘G1工作待拆分的工作名稱**，不能視為D2全部技術實作。

計畫L53明文允許先拆「只讀識別／測試」與「具副作用consumer切換」；後者如需receipt應延至G3後。這是建議依賴安排，不是已授權開始產品修改。

既有Gate維持：G2獨立RNG／精度；G3原槽Journal／Decision／Receipt；G4年度checkpoint／續行；G5既有投手賞改名及consumer；G6新P01／P04／P08；G7三冠／MVP及全鏈路；G8最終回歸；G9版本／提交／發布。不可把G2～G4或G5～G9合併命名為G1-B。

F-ID01～06的直接原生效果已有G1-A證據，但**缺少producer→ID→consumer的新adapter鏈路**，不能稱完整F-ID驗收。F-ID07～09、11～12仍需新adapter及完整consumer案例。F-ID10的P08真實發獎效果須留到G6／G7；只讀識別或完成Decision fixture不取代它。

## 3. 前置條件：正式TR-B01～05

正式ID／定義唯一來源為D2第14.9節（L539起）。以下另列設計、驗證與對G1-B的影響，不重新編號。

### TR-B01：獨立RNG、編碼、精度及golden vectors

- **APPROVED**：AF01～03，D2第14.13.1節（L634起）。已選H1、六欄位canonical、UTF-8長度前綴、binary64比較及13個golden vectors；不是待重新表決。
- **VERIFIED（離線限定）**：既有離線向量與計算證據；不是新產品Runtime PASS。舊技術報告的hash／vectors未批准敘述已被後續正式設計取代。
- **BLOCKED（產品抽選）**：尚無產品H1／canonical實作與跨Node、Chromium、Safari Runtime向量驗收。
- **NOT_APPLICABLE（建議的純識別首批）**：精確字串→ID不需要hash／主RNG，也不應先引入G2工程。

### TR-B02：Journal／Effect Receipt冪等及中斷恢復

- **APPROVED**：AF04（WITH_LIMITS）及AF05；D2第14.13.2節（L746起）。同頁同S、RECORDED後限定恢復；不可證明的R到記錄間隙為AMBIGUOUS停止，不能重抽或回滾R。
- **VERIFIED（模型限定）**：歷史VAL-B模型PASS，不是實際產品Receipt已接入。
- **BLOCKED（具副作用切換）**：現行awards没有統一Decision／Journal／多欄位Receipt。phoenix life-once旗標、付款防重各有作用，但不等於整體交易安全。
- **NOT_APPLICABLE（純只讀）**：不寫S、不付款、不發賞的識別函式可以獨立測試。涉及可信完成Decision來源、一次效果及故障重試時必須進入G3。
- G3可使用完成Decision fixture搭配**實際產品Receipt**做限定驗收；G6／G7仍須真實producer→Decision→Receipt→consumer，不能用模型或fixture替代。

### TR-B03：phaseMid／awards／phaseEnd重入與續跑

- **APPROVED**：AF06 WITH_LIMITS；D2第14.13.3節（L815起）。不重跑proSeason，不以付款完成提前return丟棄後續操作；不承諾reload／關閉瀏覽器恢復。
- **VERIFIED（歷史原生風險）**：技術驗證基準`7220ad82002801d3dea5fedae80d0fb3d7a0433f`的VAL-A04／06為直接awards重入重抽／重記；VAL-A07為付款後描畫fault再入無法續行。這些是有效fixture／fault injection，不是自然UI故障已重現。
- **VERIFIED（現行靜態）**：仍無統一年度交易checkpoint；active phaseEnd／movement的相關路徑見第5節。G1-A未修改這些重入流程。
- **BLOCKED（年度恢復整合）**：本次沒有在現行HEAD重新執行上述故障案例，不能聲稱已修或新Runtime PASS；G4產品驗收仍待執行。
- **NOT_APPLICABLE（純識別）**：不接入年度調度即可先做只讀adapter；不可藉它提前完成G4。

### TR-B04：ID、歷史名稱及consumer對應

- **APPROVED**：AF07／AF08；D2第14.13.4、14.13.6節（L857、963起）。LEGACY_BEST_PITCHER、PITCH_ERA、PITCH_SAWAMURA各自獨立；未知歷史個人賞只讀，不追溯補發或重算已付契約。
- **VERIFIED（G1-A限定Runtime）**：六項漏判修復及既有有效MVP／新人王、GoldGlove與All-Star資格區別已驗收；不是全ID consumer已切換。
- **PROPOSED**：先實作純只讀registry／adapter，再按已批准矩陣分批接入。正式adapter尚不存在，需明確限定下一批。
- **BLOCKED（完整G1）**：F-ID完整鏈路、semantic去重、未知／範圍外歷史相容及全consumer驗收未完成。

### TR-B05：產品實作授權

- **BLOCKED**：AF09不是整體工程授權。G1-A已有獨立限定授權與接受，不延伸至剩餘G1、G2～G9或新P01～P08。
- 本次只有審查及一份報告授權；**需要使用者另行批准G1-B的確切範圍及產品修改**。已有AF01～08設計不必重新表決。

## 4. G1-A交接證據

**PASS / ACCEPTED，允許限定交接。** 依G1-A結案報告及執行JSON核對：

- 88個不重複原生fixture PASS，包含原7漏判；不是88條自然生涯。
- 兩個Runtime目標PASS：full-power-pitching的S03-IF-unchanged、international-personal-stats的fixed-career-jp3-infielder-01。各完整入口36／36、50／50。
- Quick：48 PASS／0 FAIL／0 SKIP／0 BLOCKED，216.561秒；Full：67 PASS／0 FAIL／0 SKIP／0 BLOCKED，3345.586秒，67實際執行、0重用。
- 受驗基準為`554d54a94352b7dbc86473084a65b56bef74d3b7`加當時G1-A與測試工作樹，不是當時尚不存在的287dd1a提交。兩profile sourceFingerprint均為`81846539bf9eceace871ac4d13467ed55a0fffe9efa8c63d23313b51e380c9e1`。
- 本次唯讀核對：兩份原始summary.json仍存在，SHA256與可攜JSON記錄相符；目前game.js hash亦相符。這是證據核對，**不是本次重新執行Quick／Full**。
- 目標IF路線第265步（第266次操作）、2041 NPB首位打者為首次差異；之前狀態／honors一致，之後只解除glass、取得phoenix、removed加入スペランカー、pool＋8一次。
- 全639次主RNG的值、前後rngState及順序相等，trace SHA256為`ffe5a758cb8601a9301f4865a716547bbf35d85437fe5ea33dbebbf46a100647`。awards窗口387→391一致。後續387→397次操作及收入差異與限定原生phoenix控制精確一致，不宣稱整條選擇歷史相同。
- 同版完整重播及10種合成回歸注入拒絕檢查保留。非目標案例仍嚴格比較，不無條件豁免IF／收入／契約／honors。
- 另外三條P自然路線在1280／320／390px驗證：yakyo-test-001通常、jp3-pitcher-02省エネ、jp3-pitcher-03全力。另一個IF均衡策略是2042／637R案例，**不得與上述2041／639R混用**。
- B08降格保護fixture因合法短路使R1→0，已有因果證據；639R一致不是所有路線R總數一定相等的承諾。

目前正式G1-A證據沒有未解FAIL或接受不明來源差分。舊65 PASS／2 FAIL與凍結負面控制exit1是保留的歷史／預期失敗，不是最新Full FAIL。

限制：CI、Preview、Safari、Android／iPhone實機、新P01～08及跨reload仍NOT_RUN；G1-A接受不代表它們通過，也不代表TR-B02／03已解決。

## 5. 現行接入位置與相容風險

### 年度呼叫流程（VERIFIED_STATIC）

[game.js](../src/engine/game.js)：active startYear L3003設定phasePre→phaseIntlPre→phaseMid→phaseEnd；nextStep L758從stepQ取下一函式。phaseMid L869經實際球季流程進proSeason L1269；L1348 awards、後續薪資評価，再於L1353走TJ→demotionAudit→tradeCheck→maybeIntl→nextStep。

awards L1355直接產生並push honors；phoenix L1468是G1-A補正點。active phaseEnd L3109包CORP防重，settlePhaseEnd L3118以seasonEndContext／paid年表防重；付款、card、pool配分及movement在同流程。付款後card拋例外再入提前return的靜態風險仍在，不能只把completed後移就視為修復。

active movement L3134先處理年資等，再委派LEGACY.movement；原生movement L1557、wonAward L1605、goodReal／降格L1621附近是保護實際接點。advance L1996負責年度推進。新adapter不應改其呼叫順序或清除尚待執行的callback。

### Consumer（VERIFIED_STATIC，不等於全Runtime驗收）

- [trait-policy.js](../src/engine/trait-policy.js) L55～75：現行年度MVP／打者三冠特性識別；不能因已有pitcherTC名稱便稱取得機制已實作。
- [salary-evaluation-policy.js](../src/engine/salary-evaluation-policy.js) L56～66：舊最優秀投手／MVP大獎及部門賞加成。原字串Set不是ID semantic去重。新P03正式名称、P04等需未来G5～G7對應，現在不是新獎已發放的產品BUG。
- [salary-promotion-policy.js](../src/engine/salary-promotion-policy.js) L110～122：獎項fallback；同義名稱不能新舊重複計算。不得重算已成立保障年俸。
- [incentive-policy.js](../src/engine/incentive-policy.js) L10～34：賞碼識別、FULL／HALF與年度付款記錄。ID切換可能影響資格，但付款receipt仍獨立，不能每賞重新付款。
- [hall-of-fame-policy.js](../src/engine/hall-of-fame-policy.js) L15～68：歷史舊投手大獎及部門賞不同分數／分類；新P02／P08不可共用歷史LEGACY ID。原raw honors累計與新semantic視圖的差異需明列，不能擅自改寫歷史資料。
- game.js L620及L2226／2388附近退休模型與顯示保留raw honors。新顯示名不能覆蓋歷史原文、排序或已付金額。

已批准AF08要求保留範圍外國際／團隊consumer及既有同年度跨聯盟保護。把所有舊regex直接替換為新白名單可能縮減原有效效果，**不是G1-A交接自動允許的清理**。若未知歷史只讀與原有效consumer發生衝突，停下詢問，不猜ID。

### 文件一致性缺口

D2／決策紀錄的部分歷史狀態仍寫日文BUG NOT_FIXED、AF09所有修復未授權；相對後來使用者接受及287dd1a，這些狀態需要分層說明：**G1-A兩Bug已限定接受；剩餘adapter／新獎仍未授權**。本次不改正式文件；不以舊狀態否定已完成交接，也不以交接改標整體AF09已授權。

## 6. 建議下一個最小工作單位（PROPOSED，等待批准）

### 6.1 納入／排除

建議先批准「剩餘G1的純只讀ID識別與測試」：精確registry、可信別名、年度／聯盟解析、原文保留、semantic識別及不改來源的去重視圖。模組對S、RNG、honors、付款、特性、DOM均無寫入，且不立刻替換現行consumer。

可能新增`docs/src/engine/award-identity-policy.js`、`tests/award-identity-policy.test.mjs`；這是**建議路徑，尚未建立**。必要manifest登錄須另明確批准；Runner及CI邏輯保持。game.js、上列consumer與UI本批只讀，不接入新的副作用。

排除：P01～08 producer／機率／發賞、舊賞停發或改名、主RNG／H1、Journal／Receipt／checkpoint工程、薪資/HOF政策、回溯發獎、S迁移、存檔、VERSION／CHANGELOG／部署。預留ID不代表新獎實作。

對未來structured Decision可以定義只讀輸入契約，但不能把任意`awarded:true`物件當可信完成決策；完成來源、owner Journal與Receipt驗證留給G3。此首批完成後只能結案只讀識別子範圍，**不能稱完整G1 PASS**。

### 6.2 驗證計畫

1. 正常：現行日文producer各完整honor映射、可信歷史别名、舊最優秀投手≠P02≠P08；三者名稱與待遇metadata各自獨立。
2. 邊界：年度／league、同年度跨league、同ID別名重複、不同年不同ID；All-Star附註、GoldGlove與復活資格區別；類似MVP／王字串不誤命中。
3. 非法／歷史：null、非字串、缺年／league／role、未知別名、未完成Decision、範圍外國際／團隊honor；不從現在隊伍／退休角色補造過去資料。
4. 異常／重入：相同輸入重複查詢不變；輸入freeze／有效查詢失敗無S部分寫入；查詢前後完整S、honors、選擇歷史與RNG一致。這不是Receipt故障恢復驗收。
5. 下游切換階段（不在首批）：依F-ID01～12逐consumer原生Runtime測試；life-once phoenix、year-only movement、支付去重／已付保障、HOF純派生；需要Receipt的寫入留待G3。有效中斷點與CONFLICT／AMBIGUOUS停止各實際驗證，不承諾任意故障恢復。
6. 新P08效果与三冠MVP留待G6／G7真實producer全鏈路；不得用純adapter或G3 fixture PASS替代。

### 6.3 固定Seed、Quick／Full門檻

未來基準取本次已接受G1-A的完整SHA287dd1a，保留554d54a及原歷史負面測試，不換掉它們以掩蓋效果差分。重用上述三P與IF案例及**同一工具／固定策略**；純識別批次預期完整S／honors／選擇／薪資／契約／HOF／主R逐值零差分。不得沿用G1-A允許差分去豁免後續新差分。

新增測試先單獨執行，再Quick、最後確定代碼Full。既有48／67入口不得被刪除或取消嚴格比較；新增登錄後數量以Runner實際list重新統計，不預先宣稱新的固定總數。要求適用入口實際PASS、無FAIL；關鍵BLOCKED不放行，SKIP逐項說明。保留G1-A一次＋8及10種異常拒絕控制。

只讀模組不需要新畫面；其Node fixture不能稱PC／手機UI PASS。後續接入consumer／顯示時須1280、320、390px及Console／資源檢查；跨平台H1向量屬G2。CI／Preview如要執行或提交須另有授權，本次不觸發。

### 6.4 風險與回退

- 高風險是過早切換consumer、錯誤合併歷史ID、相信無來源Decision、semantic去重改變歷史累計、丟失範圍外舊效果；單純建立registry不解決這些交易問題。
- 先做沒有產品呼叫接線的純模組，降低影響；取得批准後以小批次接線、各自驗收。任何UNEXPLAINED S／R差分停止，不調整獎項門檻掩蓋。
- 未來回退僅撤掉本批接線／模組，不撤G1-A、不reset使用者工作、不刪LEGACY、不全面clone／rollback S或回滾已消耗RNG。本次沒有實作，因此沒有需要回退的產品變更。

## 7. 本次檢查與未執行項目

本次執行git status／rev-parse、文件及程式唯讀搜尋、Node SHA256／既有執行JSON與原始summary比對；未重跑遊戲、Quick、Full、CI或瀏覽器，全部為本次NOT_RUN。舊測試結果僅按其實際受驗工作樹引用。

只新增本報告；不修改產品、測試、VERSION、CURRENT_SPEC、D2、BACKLOG、CHANGELOG或tasks。不commit／push／merge／部署。完成後檢查本地文件引用及原有708檔案內容hash保全，不把文件檢查PASS當成新產品驗收。

## 8. 最終六項回答

1. **G1-B正式範圍？** 沒有獨立正式章節；正式G1是ID／adapter＋六漏判。G1-A只結案六漏判，剩餘ID／consumer工作需明確拆分批准，不能等同全部D2技術工程。
2. **G1-A可以交接？** 可以，PASS / ACCEPTED；88原生fixture、兩目標Runtime、Quick48／Full67及639R證據符合限定交接，限制保留。
3. **已滿足什麼？** AF01～08設計批准、穩定ID／歷史相容矩陣、G1-A接受及可核對的本地回歸證據。不是Journal／Receipt／全consumer Runtime已驗證。
4. **實作BLOCKER？** G1-B確切批次與產品授權未確認；完整adapter驗收尚缺。若包含副作用consumer，另有G3實際Receipt及G4年度續跑依賴，不能用模型PASS略過。
5. **下一個最小單位？** 明確授權的純只讀ID registry／adapter＋限定測試；不接consumer、不引入交易／新獎；完成僅屬剩餘G1子範圍。
6. **需額外批准？** 是：批准上述納入／排除、可修改檔案與必要manifest登錄、零S／R差分驗收；consumer接線、G2～G9、提交／發布仍須各別授權。已有設計參數不需重新表決。

**停止於審查，不開始G1-B產品實作。**

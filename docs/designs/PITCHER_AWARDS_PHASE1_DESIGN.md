# 投手個人獎項制度：第一階段設計書

2026-10-13／設計稿 D1／**待使用者審查，非現行正式規格、非實作授權**。

## 1. 基準、範圍與結論

- Repository `tt-chin/yakyujinsei`；分支 dev；fetch 後 HEAD／origin/dev：`444144a57fb3ad23ac2bd1b3e9c87ba0809ea9bb`；origin/main：`4624753a5359acd6c63ab6957341376bd43c5c88`；config VERSION：1.11.9。最新 dev 的額外差異是研究文件，遊戲引擎最近變更 `a1658c994713fd1fb8f66857dab33df0ff6548fd`。
- 工作前已有未追蹤 `tasks/` 與第二輪 `SAMPLE_GAP_DIAGNOSIS.md`，保持原樣，不納入本設計的修改。
- 閱讀現行 AGENTS、CURRENT_SPEC（特別是 §2、5、6、7、12）、BACKLOG、CHANGELOG、index、原生獎項／成績／薪資／特性／殿堂程式、相關測試及四輪研究。CURRENT_SPEC 標頭仍寫 main 1.11.4，是歷史文件落差；以 Git／config 確認本次實際基準，不在本任務更正。
- 範圍 P01～P07。沢村賞、月間 MVP、ベストナイン、ゴールデングラブ、二軍獎不在新增範圍；現行打者獎與三冠規則保持。
- 只新增本文件及離線分析附錄。未修改遊戲、主 RNG、VERSION、CHANGELOG、CURRENT_SPEC、BACKLOG、main；不建立存檔功能、不 Commit／Push、不部署、不採樣新 Seed。

核心結論：L 已存在，無須新生成敗投。救援勝投／HP 未獨立記錄，正式 HP 有 DATA GAP。現有「最優秀投手賞」實質是 ERA＋IP＋SP 的抽選，改名會牽動薪資與殿堂，不是純文案。新獎項採基本／機率／保證框架；推薦獨立固定抽選，但它不能保證所有新版生涯狀態與舊版相同。所有 A/B/C 值均未批准。

證據標籤：CODE＝現行原始碼；OBS＝封存自然生涯；OFFICIAL＝官方原文；PROPOSAL＝待批准的遊戲設計；UNVERIFIED＝缺正式規則或實測證據。BACKLOG 中 `TRAIT-PITCHER-TC` 是保留項目，不當成可取得功能。

## 2. 現行實作調查

行號全以基準 HEAD 為準。核心來源：[game.js](../src/engine/game.js)、[trait-policy.js](../src/engine/trait-policy.js)、[hall-of-fame-policy.js](../src/engine/hall-of-fame-policy.js)、[salary-evaluation-policy.js](../src/engine/salary-evaluation-policy.js)、[incentive-policy.js](../src/engine/incentive-policy.js)。舊 LEGACY 定義不刪除，不把前段被覆寫的 LV 當現行聯盟基準。

### 2.1 全部投手個人タイトル條件

CODE game.js:1354–1407：`awards(bucket,st)` 外層僅 `LV[S.lv].top` 且 `seasonFactor !== 0`。bucket 對應 CPBL／KBO／NPB／MLB；未知 bucket 的 TH fallback CPBL 不能作為新制度的設計依據。

额外边界CODE：2688的IND也有top='IND'，1305以bucketOf转IND、1347仍调用awards，1356没有IND的lgN、1367却fallback CPBL。这是静态可达的旧外围路径风险，未在本设计做自然路线专项验证，**不能宣称已重现Bug**。新P01～P07只允许四指定league，但不能在awards最外层加return而无声删掉既有IND原draw／流程；需保留非目标路径或另请用户授权。CORP没有top不进入，MiLB/二军不进入。这个发现不授权顺便修独立联盟。

| 現行賞 | 角色／最低資格 | 基本→保證 | 基本區機率（百分點） |
|---|---|---|---|
| 最優秀投手賞 | SP 且 IP≥th.g，ERA≤3.20 | ERA≤2.20 且 IP≥150，**仍先滿足外層 IP≥th.g** | clamp(30+round((3.2−ERA)×35+(IP−th.g)×0.4),30,95) |
| 最多セーブ | CL | SV22→35 | clamp(28+(SV−22)×5,28,95) |
| 最優秀中継ぎ | MR | HLD18→30 | clamp(28+(HLD−18)×4,28,95) |
| 最多奪三振 | 全投手角色，沒有 IP 最低資格 | CPBL130→180、KBO156→216、NPB155→215、MLB175→240 | clamp(25+round((SO−basic)×1.2),25,95) |

保證時 p=100，仍呼叫 chance。th.g 分別 CPBL120、KBO144、NPB143、MLB162。沒有現行 P01／P04；P02 新正式名稱沒有自然產生。P06 現行是 HLD 而非 HP。這些保證是遊戲政策，**不是實際聯盟一達該數字即必定得獎**。

CODE game.js:1371–1381：オールスター p=clamp(28+7d,3,92)，CPBL指定熱門隊+30、上限97；首個 bucket 球季且 d≥4、新人資格成立才抽新人王 p=clamp(30+15(d−4),30,95)。新人 CPBL 排除已有 NPB／MLB／MINOR stats 的狀態，並非所有海外紀錄的完整真實新人制度；不在本階段順便改。

CODE game.js:1445–1457：MVP 要 d≥6、seasonFactor≥.9；SP IP≥120、牛棚 G≥45。d≥15 保證，否則牛棚 base=5、其他base=12，p=clamp(base+11(d−6),base,95)。不同單項可同年取得，現行沒有單項排他，也沒有「投手三冠必得 MVP」。

### 2.2 RNG 與角色

CODE game.js:46–57：chance(p)=R()×100<p，0／100 都呼叫一次；ri／pick 各一 R，N0 四 R。現行獎項次序：AS→有資格時新人王→ERA→CL SV→MR HLD→SO→MVP→特性。未達資格不進該 chance；新增／取消資格會改变後續主 R 位置，保證獎仍不能直接略過原 draw。

CODE game.js:342–348：sta≥52先 SP。其餘，既有非 SP 角色用 prevD（缺時 lastD），CL d≥1 留 CL 否則 MR，MR d≥3 成 CL；不能以退休角色回填年度角色。game.js:114–148角色會議只處理CPBL1／NPB1／MLB，KBO早退；425僅 role 未設時初始化。767保存前季 lastD；1268在全力補正前保存 lastD，不能用最終 st.d 替代。此制度不在本任務修改。

### 2.3 原生成績與紀錄

CODE game.js:424–479 simSeason：初始 st 含 G/W/**L**/SV/IP/SO/ER/era；MR／CL另生成 HLD。SP決定數 round(.72G)、W=round(dec×wp)、L=dec−W；牛棚決定數約 .14G，CL與MR wp不同。HLD：CL約 .12G；MR `clamp(.45+.02d,.25,.72)`×G。牛棚 W+L+SV+HLD≤G 有原生限制。game.js:509–543 的 form、1268–1305 的事件／全力補正，再經 [event-season-policy.js](../src/engine/event-season-policy.js):1–28 normalize；獎項應使用**最終保存值**，不得重新生成。

CODE game.js:258 blankStat、556–568 addStatTotal／accStat 及階層累積包含 W、L、SV、HLD、SO、ER、IP；年度 S.log 在1322保存 `{y,age,tm,p,line,inj,st}`，研究 seasons另在 accLevelStat 觀測 year/lv/role。**年度遊戲 log 沒有足夠明確的永久 league/role 分段鍵**，不能從隊名或目前所屬臆測舊年聯盟。

CODE game.js:1307–1313 `portionOf` 的移籍顯示分段不是可信聯盟逐登板紀錄（且其列舉沒有HLD）；不拿隨機展示分段當 HP 或跨聯盟三冠資料。現行同季角色分段／GS／救援勝投沒有獨立欄。雖純 MR/CL simSeason 分支的 W 來源為牛棚數學模型，尚不能證明最終年度 W、事件、混合起用及舊資料均全為救援勝投；不把 W+HLD 命名正式 HP。

### 2.4 honors 與下游

- CODE game.js:1356、1385–1406：`S.honors` 是字串陣列，格式 `${year} ${leagueDisplay}${title}`，沒有個人獎穩定 ID。awards 本身沒有一般的年度／賞別去重交易鍵。
- CODE game.js:1345–1348、2807–2815：awards 在 recordSalaryEvaluation 前。salary-evaluation-policy.js:56–66：MVP／最優秀投手／沢村 +.75，部門賞 +.35，上限1.5；最高勝率目前沒有 regex。只改名會使 P02 .75→.35；正式「最多三振奪取」也不匹配舊「最多奪三振」，不得不經批准發生。
- CODE incentive-policy.js:2、10–26：舊最優秀投手 BEST_PITCHER、部門TITLE均可付全額既定上限。改名／加P04的分類必須明確。不提高契約上限、回溯年俸或重付收入；固定年俸仍看annualSchedule，獎项僅影響現有下一次市場評價／本年度既有出来高規則。
- CODE hall-of-fame-policy.js:28–62：MVP420、舊最優秀投手460及aceN、部門賞160及king、投手AS70。`endsWith`匹配舊部門名稱；加「投手賞」或改「三振奪取」後若未做語義adapter會漏分。game.js:2044–2053：mvp/aceN使評價至少スター級，king至少レギュラー級；rename不只是460→160，還會改保底類型。
- CODE salary-promotion-policy.js:110–122 的salaryAwardBonus／salaryEvaluationD：舊大賞+2、部門+1，最高3，game.js:2814的fallback評價仍引用；既有測試 `tests/salary-promotion-policy.mjs` 也依賴舊賞名。不能只修畫面或只換一處 regex。D-KEEP也須保留此+2，D-TITLE新P02改+1需明列批准。
- CODE game.js:1460–1470：有本年honors可解除yips；phoenix的大獎regex仍有舊中文token，確定的MVP可引發解除glass與pool+8。不在本設計順便修regex，但新MVP決議会改trait／成長／後續R分支。
- CODE trait-policy.js:55–77：打者三冠依同年同league exact strings，history `{year,bucket,league}`去重；自動補打撃三冠王與MVP，不額外R。24歲以下NPB／MLB MVP解strongpitch/stronghit；35歲起MVP解oldghost且次季衰退減半。pitcherTC在4、6、24僅名稱/DEFERRED/顯示支持，没有取得實作。
- CODE game.js:619的buildCareerViewModel复制honors至achievements；2225–2258、2387–2412、2548：引退／圖片按honors字串分組。ui/player-detail.js:7–11从achievements渲染奖项；record-view.js只负责统计。不能把旧名称统一改写，新名称要測換行及共享圖片。
- CODE game.js:1600–1618 movement的wonAward仍是`王|MVP|賽揚|澤村|最佳投手|金手套`文字判断，NPB式「投手賞」多数不匹配，P07「投手三冠王」却会匹配并可能保护降格/战力外；不能声称新三冠只影响薪资/HOF。未来adapter是否保留或统一个人赏保护是独立政策決議，本案推荐保持现行识别但明确P07追加造成的自然保护分支；未经批准不顺便修全部旧regex。

舊存檔用語範圍：CURRENT_SPEC §2、AGENTS §3明確沒有生涯中途存讀，preferences.js:16–25僅顯示設定 localStorage。因此以下相容性是**既有狀態／歷史陣列／fixture 的容錯設計**，不是承諾恢復不存在的存檔功能。

既有測試證據範圍：trait-policy.test.mjs:64–118測打者三冠年／league／重複與原awards chance序列；salary-evaluation-policy.test.mjs、salary-promotion-policy.mjs、hall-of-fame-policy.mjs、trait-system-e2e.mjs、retirement-hof-balance.test.mjs覆蓋舊賞名下游。沒有以這些舊測試PASS冒充P01～P07已實作或驗收。本次未重跑遊戲測試。

## 3. 真實聯盟制度與來源

確認日全部為 **2026-10-13**；只以官方／官方刊物作採信證據。歷史年度標示，不自動將2020特例沿用2026。沒有全聯盟NPC成績，本遊戲仍是抽選近似，不宣稱真正排名第一。

### 3.1 NPB（OFFICIAL）

官方六項名稱是「最多勝利投手賞」「最優秀防御率投手賞」「**最多三振奪取投手賞**」「**勝率第一位投手賞**」「最多セーブ投手賞」「最優秀中継ぎ投手賞」。任務P03/P04暫稱可作遊戲名稱，但不能標為官方原名。[2025 CL表彰](https://npb.jp/award/2025/cl.html)、[2025 PL表彰](https://npb.jp/award/2025/pl.html)列出各紀錄賞，勝投／セーブ同值有共同得獎實例；不是只有一名的排他抽選。

記錄比較：P01勝利最多、P03奪三振最多、P05セーブ最多；不因SP/MR/CL標籤排除真實資格。P02在規定局數以上比較最低ERA；NPB官方投手表註明球團實際試合數×1.0。[官方2023投手表](https://npb.jp/bis/2023/stats/pit_c.html)、[公認記錄規則9.21/9.22（PDF印刷頁178–181）](https://npb.jp/scoring/officialrule_900.pdf)；143場制=143IP，不是「登板143場」。

P04勝率=W/(W+L)，NPB 2025PL頁明列13勝以上資格；[2020特例](https://npb.jp/news/detail/20200617_03.html)改10勝，僅作歷史例外。不以最低IP代替13勝，也不能1勝0敗得獎。W+L=0無可比較勝率。[NPB記錄規則](https://npb.jp/scoring/officialrule_900.pdf)支持公式。

P06 HP=HLD+救援勝利，不是所有W：[NPB 2005記錄變更公告](https://bis.npb.or.jp/npb/20050203stats.html)。HLD的單場規則與救援勝利另列，與遊戲年度量化生成不同。共同最高記錄可共同獲紀錄賞；已直接核對勝投／セーブ共同表彰，ERA／勝率／SO／HP「完全同值」全部細則（比較精度及額外tie-break）未取得本年度完整表彰規定，**UNVERIFIED**，不把兩項實例當六項全部規則的證明。遊戲單人不模擬並列NPC，得獎不含獨占聲稱。

### 3.2 KBO（OFFICIAL／局部UNVERIFIED）

[官方TOP5](https://www.koreabaseball.com/Record/Ranking/Top5.aspx)把평균자책점（ERA）、승리（勝利）、세이브、승률（10勝以上）、홀드、탈삼진列為「KBO 시상 기록」，與排除的G/L/IP排行分開；[2025官方表彰公告](https://www.koreabaseball.com/MediaNews/Notice/View.aspx?bdSe=11769)確認部門第一名授獎。六部門有對應，但中繼是HLD部門，不套NPB HP。

規定局數144的官方站[2025球員報導](https://www.koreabaseball.com/MediaNews/News/KboPhoto/View.aspx?bdSe=507788)可確認常規144場實例。年度資格一般應依所屬球團賽程／表彰規定，不把單一年度實例宣稱所有未來年度法規。勝率10勝已由現行官方排行直接確認；ERA最低及縮短賽季換算的完整法條、六部門並列與次順位規則、精確獎項韓文後綴仍 **UNVERIFIED**。不將排名表名當完整法律賞名；日本語遊戲統一名另批准。

### 3.3 CPBL（OFFICIAL／尚待完整規章）

[2025官方賽事新聞](https://cpbl.com.tw/xmdoc/cont?sid=0P280502131301513513)索引顯示勝投王、三振王、中繼王；[2022官方頒獎新聞](https://cpbl.com.tw/xmdoc/cont?sid=0M322561962603912619)顯示防禦率王；[2023官方二軍頒獎新聞](https://www.cpbl.com.tw/xmdoc/cont?sid=0N290609669185317512)顯示救援王及HLD同值以ERA作tie-break的**二軍例子**。只證實對應類別與存在差異，不將二軍tie-break當本次一軍規則。CPBL P01/02/03/05/06有對應，P06為中繼成功類別，不稱NPB HP。

CPBL官方[全紀錄投手表](https://cpbl.com.tw/Stats/RecordAll?kindcode=A&position=02&sortby=01)保存W/L/SV/HLD/IP。官方聯盟規章PDF及2025規則PDF，本次搜尋可找到但直接開啟404；此狀態記錄如下，不能據搜尋摘要把minor的80%IP誤套一軍：

- https://www.cpbl.com.tw/theme/client/download/聯盟規章.pdf （本次讀取失敗）
- https://www.cpbl.com.tw/files/file_pool/1/0p065549820043528193/2025棒球規則(官網用).pdf （本次讀取失敗）

**UNVERIFIED**：現行一軍ERA表彰完整資格與例外、所有一軍tie-break、勝率王目前正式授獎狀態及停頒時間。一般認知是沒有現行勝率王，但本次缺完整官方獎項名錄作排除證明，不把它寫成已查證不存在。P04不得預設存在：方案一CPBL不實作；方案二經批准設遊戲原創「最高勝率投手賞」，明標原創。正式發布前若走真實制度版，必須補證。

### 3.4 MLB（紀錄領先不等於六項NPB式獎）

MLB有聯盟紀錄領先者；不能等同六張NPB式官方獎牌。[MLB ERA資格](https://www.mlb.com/glossary/standard-stats/rate-stats-qualifiers)的常規基準為每賽程場1IP；[MLB三冠說明](https://www.mlb.com/news/triple-crown-in-pitching-c266118846/)涉及W/ERA/SO。[MLB年度後援獎官方公告](https://www.mlb.com/press-release/press-release-emmanuel-clase-ryan-helsley-earn-the-2024-rivera-and-hoffman-awards)是投票，不是HLD或SV排行獎。

P01/P02/P03可作「league leader」紀錄榮譽，不稱Cy Young、不得用P02改名替代Cy Young。P05可作SV領先紀錄，NPB式「最多セーブ投手賞」屬遊戲統一名。P04沒有在所核對官方獎項中確認同型勝率獎；P06沒有正式HLD排行中繼獎。兩者選擇：**不實作**，或**遊戲原創**，不能拿Rivera/Hoffman補成HLD獎。[官方award目錄](https://www.mlb.com/awards)／[後援獎目錄](https://www.mlb.com/awards/reliever-of-the-year)是核對範圍，不把未找到視為永久無任何商業獎。精確紀錄並列、跨AL/NL同年資格細則UNVERIFIED；本遊戲目前MLB單bucket並非AL/NL分開，需明示簡化，不新增分聯盟模擬。

### 3.5 設計與真實制度的分界

現實是與其他球員比較記錄／投票，本案仍門檻抽選，沒有假想對手、賽季冠軍隨機順位、同值勝負或全聯盟排名。單人角色限制、固定g、難度保證皆遊戲近似。不能以最高勝率替代最多勝作三冠，也不能以MVP／舊最優秀投手代替ERA賞。NPB／KBO已證P04資格不同，CPBL／MLB原創權限待審，不統一四聯盟真實規則。

## 4. 四輪原始資料分析

完整數值：[48組分析附錄](PITCHER_AWARDS_PHASE1_DATA_APPENDIX.md)、[機器可讀JSON](PITCHER_AWARDS_PHASE1_ANALYSIS.json)、[離線再計算工具](pitcher-awards-phase1-analysis.mjs)。工具只讀四輪 careers.json 的原生 seasons，沒有遊戲匯入或RNG；保存來源SHA256／受驗SHA。每輪12組（4聯盟×3角色）都有 W/L/era/IP/SO/SV/HLD，mean／median／P75／P90／P95／min／max及各欄有效n／missing；HP／救援勝投DATA GAP。零樣本的分位／機率N/A，不填0%當估計。

有效球季：CPBL1／KBO1／NPB1／MLB，G>0且IP>0，年度角色採當時觀測。所有失敗及未職業生涯保留來源attempt分母，不為了樣本剔除。計數每季，獨立Seed另列；同一Seed跨角色會重疊，不能把角色Seed數加總當玩家數。IP為十進位，不把142.2顯示字串當142.2實際局數。分位線性插值 `(n−1)q`；ERA高分位是較差端，本設計未把P90 ERA當優秀線。

| 資料輪次 | 版本／attempts | 有效一軍球季 | 定位 |
|---|---|---:|---|
| 第一輪 | 1.11.8／100 | 597 | 全力callback未正確生效，歷史比較，禁止與新版混母體 |
| 第二輪 | 1.11.9／100 | 543 | 同Seed同策略但57條實際選項歷史分歧，不稱相同完整操作 |
| 第三輪 | 1.11.9／40 | 308 | 四組定向策略各10，不是一般玩家隨機樣本 |
| 第四輪 | 1.11.9／20 | 166 | USA牛棚定向；MLB牛棚11季，不當SP門檻主要樣本 |

### 4.1 新版各組有效季／獨立Seed

| 聯盟／角色 | 第二輪 | 第三輪 | 第四輪 |
|---|---:|---:|---:|
| CPBL SP | 49／14 | 10／6 | 0／0 |
| CPBL MR | 67／22 | 14／7 | 20／9 |
| CPBL CL | 11／5 | 12／3 | 42／9 |
| KBO SP | 0／0 | 65／12 | 0／0 |
| KBO MR | 0／0 | 100／15 | 31／13 |
| KBO CL | 0／0 | 36／6 | 29／8 |
| NPB SP | 367／44 | 22／10 | 0／0 |
| NPB MR | 49／23 | 20／5 | 20／10 |
| NPB CL | 0／0 | 10／8 | 13／13 |
| MLB SP | 0／0 | 14／5 | 0／0 |
| MLB MR | 0／0 | 4／1 | 8／2 |
| MLB CL | 0／0 | 1／1 | 3／3 |

第一輪各組完整統計也在附錄，沒有和新版合併。相同新版引擎不意味不同策略可合成無偏母體；本次所有候選達標按輪分開。R3/R4 USA-bullpen合計CL4季／4名、MR12季／3名、聯集4名，兩人貢獻75%牛棚球季；不足尾端／獎率校準。

### 4.2 直接影響門檻的OBS

- 第二輪NPB SP367季：W median6、P90=10、max12；IP median97.667、P90=121.333、max150.667；ERA min2.671。B P01基本5季、保證0；P02基本1、保證0；P03基本1、保證0；P04按13勝资格0。故B是「現行/保守基線」，不是已驗證好玩的標準難度。
- 第二輪CPBL SP49季：W median7、P90=13、max15；SO P90=161.4、max216。B W基本14／保證2、ERA基本16／保證5、SO基本11／保證2。同是B，在CPBL與NPB可取得性極不對稱。
- 第三輪KBO SP65季／12人：Wmax16、SOmax213、IPmax175。B W基本19／保證0、ERA基本22／保證10、SO基本11／保證0；不能因有65季就忽略只有12人。
- 第三輪MLB SP14季／5人：Wmax8、IPmax105、SOmax95、ERAmin4.029。**本書六賞A/B/C在這14季全部零達標**；A也不能校準MLB SP三冠。不為填表自動降到8勝或95SO。
- 第三輪KBO MR100季：B HLD基本65／保證20、預期44.92次；第四輪MLB MR8季：B基本0／保證0，A基本3／保證0、預期.84次。角色／聯盟成長路線不同，均一HLD有巨大難度差。
- 第四輪MLB CL3季：SV5/18/12，B22起抽全部不達；A18起抽1季、預期.28次。三名一季不足設低保證。R3唯一CL SV20，不能用少樣本最大值當正式「鬼神」保證。

附錄各候選记录资格／基本／保證次數、達基本的獨立Seed與預期次數。預期=Σp、每季預期=Σp/n，是套假說後的離線模型，不是新實作觀测获奖率。P07產品乘積只有在各賞抽選近似獨立時成立；不把固定哈希當已證統計獨立。所有球季相關，沒有虛構95%CI或玩家真實獲獎率。

## 5. P01～P06候選方案（全數待批准）

### 5.1 共通契約

四聯盟一軍、P、最終G>0/IP>0、有限非負欄位。未知league不fallback；欠欄位標 DATA_MISSING，不造0、沒資格不抽。抽選用固定年度／league／awardId；同年賞別獨立、無排他、不因已有另一賞降低p。保證先驗完整資格，再p=100，不越過IP/勝投門檻。

P01/P02/P03/P04提議不以角色標籤排除，但各數值資格仍限制牛棚；P05先保留CL、P06簡化先保留MR。另可批准P05所有P withSV、P06所有後援withHLD/HP的較真實資格；**本附錄P05/P06按舊CL/MR限制計算，開放角色須重新離線計算，不可沿用數字**。各角色以本季有效快照，不用當前下一季角色。

### 5.2 P01：最多勝利投手賞／ID PITCH_WINS

適用NPB/KBO/CPBL及MLB紀錄榮譽（MLB遊戲命名待審）。全P且W達basic，沒有額外IP資格；避免把SP式IP gate帶到真實勝投計數賞。非SP在現有樣本W≤5，並不因放開角色變成容易拿。

| 難度 | CPBL基本/保證W | KBO | NPB | MLB |
|---|---:|---:|---:|---:|
| A較易 | 8/13 | 10/15 | 10/15 | 12/17 |
| B基線 | 10/15 | 12/17 | 12/17 | 14/19 |
| C高難 | 12/17 | 14/19 | 14/19 | 16/21 |

p=100 if W≥god；其他 clamp(30+8×(W−basic),30,95)。未basic p=0。這三組來自第一／二輪既有研究假說；不等於批准，不來自官方固定勝投規定。研究舊假說只SP，新候選全P；現有牛棚全部不達，已如實試算。原沒有此賞。舊honors中可信「最多勝」仅显示／语义映射，不补发新賞。推荐NPB先审A的可玩性（第二轮40/367有机会，预期13.60次），B仅5/367，C0；MLB全部未验证，不保证15/17等保底能自然到达。

### 5.3 P02：最優秀防御率投手賞／ID PITCH_ERA

改名現有最優秀投手，但只是新年度生产名称；旧文本保持。IP資格各联盟分别配置，不把角色或總careerIP作資格。

| 難度 | ERA基本/保證 | 最低IP CPBL/KBO/NPB/MLB |
|---|---|---|
| A较易 | 3.50/2.50 | 100/120/120/140 |
| B基線 | 3.20/2.20 | 120/144/143/162 |
| C高難 | 2.80/1.80 | 120/144/143/162 |

p=100 if資格且ERA≤god，其他clamp(30+round((basic−ERA)×35+(IP−minIP)×.4),30,95)。未IP／ERA基本资格p0。A局數為遊戲放寬，**不能稱NPB規定局數**；CPBL120在B/C是現行遊戲值，尚缺官方完整條款确认。B的CPBL保证取消旧额外IP150限制，是显式PROPOSAL，附录B有5季保证；若要纯rename保持政策则仍需IP≥150并重新计数。用户可选择「纯改名、旧资格不动」的独立baseline，不与本B混称相同。

推荐名称修正与玩法资格分开批准；NPB先保留正式IP143还是採A120必须决定，不自动削减。统计支持B在NPB非常稀有，却不授权降低正式资格。ERA从最终st.era读，不用2位显示舍入判断2.20，也不以baseERA重新生成。下游保留旧.75/460/aceN还是转.35/160/king须另批准（§10），旧资料不改。

### 5.4 P03：最多三振奪取投手賞／ID PITCH_STRIKEOUTS

正式名称推荐NPB用最多三振奪取投手賞（任务暂称「最多奪三振投手賞」另选）；全P无新增IP gate。

| 難度 | CPBL基本/保證SO | KBO | NPB | MLB |
|---|---:|---:|---:|---:|
| A较易 | 111/162 | 133/194 | 132/194 | 149/216 |
| B現行 | 130/180 | 156/216 | 155/215 | 175/240 |
| C高難 | 143/198 | 172/238 | 171/237 | 193/264 |

A由旧basic×.85、god×.90四舍五入；C两者×1.10；仅敏感性候选，不是官方或按弱样本拟合最优值。p=100达god，否则clamp(25+round((SO−basic)×1.2),25,95)。正常B保留旧资格、斜率、保证；旧最多奪三振名映射此ID但不改旧显示。推荐B为保持基线，NPB A提高12/367有机会对B1/367；MLBSP仍全部0，不能批准C为「合理标准」。名称adapter必须修salary/HOF/incentive识别。

### 5.5 P04：勝率第一位投手賞／ID PITCH_WIN_PCT

NPB／KBO有正式对应；CPBL／MLB只有原创试算、实际默认不启用直到批准。全P原则，但必须W≥minW且W+L>0。胜率直接W/(W+L)，不以ERA/IP代败投、不用显示.000作比较。

| 難度 | 基本胜率/保證 | 最低W CPBL/KBO/NPB/MLB |
|---|---|---|
| A較易游戏版 | .60/.80 | 8/8/10/10 |
| B标准候选 | .65/.85 | 10/10/13/12 |
| C高難候选 | .70/.90 | 12/12/13/14 |

p=100達god，否则clamp(25+round((WP−basic)×150),25,95)。资格前不算chance。A对NPB/KBO少胜放宽，C KBO提高到12也是原创难度资格，不能宣称真制度；只有B的NPB13/KBO10符合已核对资格。CPBL/MLB全列是假设资格，无官方来源。所有精确胜率线和斜率都是新设计暂值，没有现行抽奖基线，独立玩家数不足统计定案。

第二轮NPB Wmax12 → B/C资格0，不临时把13改12。1胜0败无论WP=1也不合格；0/0返回null，L缺失unknown不是0；L负数、NaN拒绝。W=13,L=7 (.65)基本25%，W=17,L=3 (.85)保证；fraction以原数比较。推荐优先NPB/KBO真实资格B，接受稀有性或先继续已批准之外另立研究，不用新增L方案拖延已有字段功能。其他联盟推荐不实作而非四联盟一体。

### 5.6 P05：最多セーブ投手賞／ID PITCH_SAVES

NPB/KBO/CPBL有对应，MLB是SV领跑纪錄／游戏名方案。本版候选CL，基本/God为A18/30、B22/35、C28/40；不按g直接缩放，因为生成依登板。p=100達god，否则clamp(28+5(SV−basic),28,95)。未角色或SV資格不抽。旧名最多セーブ只读映射，不双发旧新。

推荐B维持正常旧结果基线，不因MLB只有4名稀有CL调保底。A能使R4唯一18SV有28%机会，不代表标准玩家概率。若采用所有投手资格则MR也可参与符合SV的年度，但应单独批准与重算。

### 5.7 P06：最優秀中継ぎ投手賞／ID PITCH_RELIEF

**路線S：保留HLD简化游戏规则**。NPB标游戏简化、KBO/CPBL按对应HLD纪錄类，MLB不启用或原創待審。本候选MR；A基本14/保證25、B18/30、C22/35；p=100达god否则clamp(28+4(HLD−basic),28,95)。缺HLD不是0、未角色／门槛不抽。名称新、metric='HLD'明确，不能卡片写「正式HP」。旧最優秀中継ぎ保留文本，映射metric=legacyHLD。推荐B先維持、NPB A显著扩大边界但没有正式HP证据。

**路線H：正式HP**。NPB使用救援胜投+HLD，不把KBO/CPBL改成NPBHP，不把MLB投票奖改成HP。三个难度候选暂只定义数据驱动阶梯：A基本为有资格HP样本P60、保證P90；B P75/P95；C P90及经样本／领域审查的极端线。HP实样本n=0，**不填精确数字或把14/18/22机械转HP**；斜率也须有数据后再定。未定参数时禁止上线／抽奖。资格建议所有有救援工作量的P，但需要GS/reliefG避免季末标签错误，具体最低工作量待审。基础／保证／正常测试均先BLOCKED参数，不是假PASS。

路線S成本低、保留rng与数据，准确性有界；路線H成本高、需新增来源结构与审查，不能只是计算派生值的UI修改。§7说明扩充方案。推荐第一阶段选择S并清楚文案，H延期；若用户要求正式NPBHP则先补数据设计而不是先实现S假冒H。

## 6. 最高胜率的数据方案

**已证 L 存在**于年度st、stats、statsByLevel与年度显示；四轮有效球季W/L逐栏n与missing在附录。三个方案：

- A补L正式方案：现行无必要新增L随机生成。只补输入有限非负验证／缺L旧资料的unknown路径，使用已有L。若某旧状态确实缺L，不从W/ERA/IP/G推算、不回填成0、不发P04；显示「記録不足」。既有通算无L也保持未知，不从当前年度倒推全部。
- B暂缓P04：主要理由可是真实联盟覆盖／门槛待审，而非误称「没有L」。成本最低、最大保留旧结果；未实现奖不在UI伪显示。
- C用W最低加IP或ERA评分当胜率奖：可做「游戏胜利效率赏」但不是WPCT；建议拒绝，偏离真实且不解决欠L。若采用必须独立ID／名称，不进入最多勝三冠。

WPCT为派生只读值，不新增计数随机数；跨年度通算应sumW/(sumW+sumL)，不是各季胜率平均。没有生涯最高胜率奖/新UI需求时不额外增通算卡。新增P04会改变荣誉／薪资／特性可能分支，即使L生成不动，仍属未来L3实现验收。

## 7. HLD、救援胜投与HP

### 7.1 数据缺口

W在SP包含先发模型胜投、MR/CL分支为救援模型，但年度角色没有逐登板分拆，事件最终W可能修改，通算跨角色。没有可信`reliefWins`、`GS`、`reliefG`、`HP`。本次不推算这些欄位；没有因为看到MR快照就把所有旧W标正式救援胜投。

### 7.2 正式导入时的最小结构提案（待批准）

新年度st增加 `reliefWins`（非负，≤W）、`GS`／`reliefG`（相加≤G）、来源／coverage状态；HP最好派生 `HLD+reliefWins`，如保存必须有一致性校验。纯先发季reliefWins=0，原生纯牛棚生成时如能证明角色在整季不变，**在原W生成时**将同笔结果标来源，不再次抽签；混合角色／事件增减W必须同步来源，不可在退休时回填。

相关路径：simSeason、applySeasonForm、applyEventSeason/normalizeEventSeason、proSeason、portionOf显示分拆、blankStat/addStatTotal/accLevelStat、S.log、record-view／年度表／通算／shareImage、fixture与研究观测。新通算coverage用「有记录」而非全careerW混算；旧资料未知reliefWins=null或缺失，不能补0制造完整HP。HLD不会重新生成；更新来源不改变现有W/L/IP/SO/ERA、既有R调用，可能做到0新增R，但**目前未证明全部事件／角色路径能无歧义分类**。

成本：S约1个policy＋adapter＋相关fixture，低／中；H需数据生成、事件、累计、UI、旧状态、研究工具，多模块L3，粗估独立2–3小批而非单行修复。数值拆分不等于真实逐比赛模拟，若选择更真实混合起用则另需批准RNG与规则改变。HP暂缓不是删除P06现行HLD玩法。

## 8. 投手三冠王 P07

### 8.1 身份、判定与记录提案

P01=PITCH_WINS，P02=PITCH_ERA，P03=PITCH_STRIKEOUTS，P07=PITCH_TRIPLE_CROWN。名字通过league显示表，ID稳定不从翻译regex判定。NPB推荐官方P03/P04名，其余联赛显示日本语统一或本地官方对应名待批准。

完成该年度该league单项确定后、薪资评价及特性下游之前判定；必须同year／leagueKey三项`awarded=true`，不只是统计达标、不用FA年俸年度替代赛季年度。初版leagueKey沿CPBL/KBO/NPB/MLB，明确是整个游戏bucket，NPBセ／パ与MLBAL／NL独立制度尚未模拟，若用户要求分子联盟须新增设计，不能从当季球团名称臆測跨年league。

提议新记录 `awardDecisions`（对象或数组形式待实现评审）：`{year,leagueKey,awardId,ruleId,metric,statsSnapshot,probability,drawSource,drawKey,awarded}`；`honors`仍为兼容字串，不把所有旧记录改对象。新键同year/leagueKey/awardId只有一笔，commit决策后才呈现，重画/回调重入不能再抽。所有候选文件只是设计，不新增状态。

P07记录 `tripleCrownHistory.pitcherTC` 的 `{year,bucket,league}`与现行打者同形，honors追加`${year} ${league}投手三冠王`一次；traits.pitcherTC=true，不新增能力加成。首次／首次该league可复用traitLabel的league修饰和一次取得说明；后年相同league仍保留history但不重解放，与hitterTC对应。

### 8.2 跨联赛与历史边界

同年NPB P01+KBO P02/P03绝不合并。若新未来引擎支持同年跨league实际完整绩效，应各league独立快照与决策，仅本league三项可合并；目前展示portionOf、当前S.lv、队名不能证明分联赛数字，资料不足不补历史奖。既有年末／次年转队通常新league下一年生效，奖的league在成绩确认时冻结，不能延后读取签约后的org。

旧最優秀投手賞是高权重综合标签，**不能单靠名称映射为过去P02获奖后追溯投手三冠**。旧honors无P01或缺稳定league/年度，不补。可信旧「最多奪三振」能用只读语义adapter识别已保存奖类别，但「有3字符串」也不自动改历史；默认不补发过去P07、MVP、trait。旧pitcherTC=true（fixture／外部已有状态）保留，不再领能力/收入，不编造缺失history。

### 8.3 MVP、年俸、殿堂与成就

**三冠保證MVP尚未批准**。选项M0保持原MVP抽选；M1原MVP draw保持位置／次数，再基于新三冠补一次MVP（按hitter逻辑，但需明确批准）。推荐M0作为最小扩展，P07纯纪念、无额外薪资/殿堂分，不重复给三项加分。M1会影响strongpitch、oldghost、phoenix、出来高、市场工资、后续成长与R分支，不能称「只加称号」。不新增其他成就或二天一流自然取得。

已有投手三冠名字trait政策不能替代完整单项制度；P07不能单独以W/ERA/SO门槛满足当作获奖，更不能以各league跨年3项累计数判定。

## 9. RNG方案与可重现性

### 9.1 方案R-A：沿主 chance(p)

成本最低，仍旧R分布，但新增P01/P04及资格变化会加／删调用，后续合同、事件、故障、退休路径都可能变。即使每个新奖顺序固定，也无法承诺旧seed结果。旧奖不存在历史drawKey无法恢复。新赏p100亦消费主R。不推荐，需用户批准全链路差异，不能在未来实作时默默新增。

### 9.2 方案R-B：独立固定可重现抽选（推荐审查）

纯函式输入为原始seed、赛季year、冻结leagueKey、稳定awardId、固定`ruleId`（例如award-v1；**不使用每次PATCH VERSION**），UTF-8/字段长度编码避免串接碰撞，输出uint32/2^32，用u<p/100。不得依赖Date、Math.random、主 `_s`、调用顺序、当前球队、honors长度或画面重绘。固定domain separation如`pitcher-award-v1`，不同award使用不同key。可用确定性32位混合哈希或从hash播独立PRNG；具体算法/测试向量需实现前定稿，不能把短哈希宣称统计完全独立或抗作弊。

新P01/P04使用R-B；P07不抽。现有P02/P03/P05/P06若要保持旧正常结果，**先保留原资格的主R抽样在原位置并使用原获奖结果**，只名称adapter；不把旧chance换成hash而声称相同seed相同获奖。

若批准旧赏改门槛：两种明确选择：（i）全部投手奖改R-B，但仍消费原奖资格下的旧chance调用槽，结果仅作兼容排程，新增资格/新奖不占主R；（ii）全面新规则draw主R并接受差异（不推荐）。兼容槽在**旧版资格与旧年状态快照**下执行，AS/rookie/MVP/打者draw不动，顺序不变；不能凭新门槛决定是否保留旧槽。保證旧槽也执行100 draw。旧调用次数保留只能证明同输入这一年度随机流未被新award本身插入，不代表整个人生无差异。

### 9.3 必须诚实区分两层相容

1. 抽選相容：同输入年度、同旧资格、同choice，主R列位置和值不增加/减少。
2. 游戏结果相容：新荣誉／变获奖影响薪资、特性、选择文、条件分支，后续可能R消耗差异。新的规则绝不能保证「除honors以外全S一样」。

若用户要求**完整旧生涯结果不变**，只能先做无下游效果的展示研究／不启用新奖，或另批准隔离新honors的计分设计（本案未授权）。推荐保留抽選相容，并列出具体允许差异：awardDecisions/honors/pitcherTC、批准后的市场awardAdjustment/出来高/HOF及由这些直接造成的分支；其他成绩公式/能力/伤病R不能无故变动。重构打者路径、改MVP概率、改薪资倍率一律不在授权内。

### 9.4 旧状态、命名、重入

保留honors原文和顺序；只读adapter识别明确旧别名，不全局.replace、不猜未知league。语义ID用于新去重；同年旧新同义只计一次、显示历史原名，可信重覆字符串避免双薪资/殿堂计分。**旧最優秀投手的计分保持旧语义，不强制映射成P02轻量奖或三冠证据**。未知资料保留文本、不补分。

无新记录的旧state只从未来未结算球季启用，历史不能重算独立draw补奖。render不写awardDecisions／traits／income，迁移不得触发付款。旧欠L/HP/league未知标数据不足；新record与旧honors并存不双发。一季确认失败重试重用record，同样ruleId重播一致，修改ruleId是有意改变奖项配置而非PATCH自动重抽。seed-onlyURL维持，不新增rv/rules或旧engine。

## 10. 架构边界与尚待政策决定

建议新增小型纯policy：`pitcher-award-policy.js`（資格/概率/ID/配置）、`award-identity.js`（精确旧名adapter/下游语义）、`award-draw.js`（独立draw与版本固定）。这是未来边界建议，不在本次创建游戏模块。game.awards仅编排原draw/新decision／commit／render，不用全cloneS、不中途回滚合法RNG，不大拆game.js。

改动点：game.js的awards/季末调用、trait-policy的pitcherTC与DEFERRED、salary-evaluation／salary-promotion／incentive／HOF的识别、player-detail和共享输出、新测试。HP路线另加§7的生成及结构；单项配置不进球团/FA/年俸公式。候选总量级：基本赏policy及adapter一批，P07/重入一批，下游/旧状态与RNG严验一批；HP单独2–3批，不承诺日历工时。

### 下游必须批准的两套映射

- D-KEEP：P02新名称仍.75/460/aceN与旧BEST_PITCHER待遇，仅语义rename；P01/03/05/06按部門.35/160/king；P04若启用建议同部門；P07不额外计分。保留P02待遇较兼容，但ERA部門仍被当大赏，要明示游戏特例。
- D-TITLE：新P02 .35/160/king且TITLE（出来高仍满额），旧最優秀投手纪录仍原待遇；P01/03/04/05/06部門。会显著降低未来P02市场/HOF保底，**薪资/殿堂政策变更，待批准**。

推荐先D-KEEP降低rename侧效，P04缺regex补语义识别须批准。名称P03官方化不能被旧regex漏分；兼容层应提供同一语义ID而非把正式文本偷偷改回旧称。MVP-M0推荐，HP-S推荐，门槛仍需逐项审查而非整体「B」一键通过。

## 11. 后续测试输入、预期与验收标准

以下都是**设计案例，尚未执行，不列PASS**。基于最终批准plan展开四league×SP/MR/CL，参数固定由配置读取。所有测试既可控注入独立draw u，也须使用真实原生awards绑定及完整生涯；测试注入不用于自然研究。

### 11.1 六赏参数化案例（每项正常／最低／保证／资格失败）

共有fixture：year2035、P、合法一军level、seasonFactor1、空新decision、空honors、最终st.G=60/IP=180，其他不相关赏低于basic，draw u=0（确保有机会即获奖）或u=.99（非保证失败）。选定plan的基本b、保证g与minIP来自§5，必须测试每league实际配置而非只CPBL。

| 案例ID／输入 | 预期 | 验收 |
|---|---|---|
| T01 P01 W=b−1／b／b+1／g−1／g；L=4 | 0／30%／38%／非保证／100% | 每值概率exact；u0在b获、u.99在b不获，保证任何u获；不参考careerW |
| T02 P02 IP=minIP−1/minIP；ERA=b+.001/b/g+.001/g | 未IP永不获；b/minIP30%；g/minIP保证 | ERA未经2位显示四舍五入，资格优先；旧CPBLIP149的纯rename路线不误保证 |
| T03 P03 SO=b−1/b/b+1/g−1/g；三种role | 未basic0、basic25%、+1由round斜率得26%、god100% | 全角色同SO概率；不新增IP gate，u.99非god失敗 |
| T04 P04 W=0,L=0；1,0；minW−1,0；minW,足够L使rate<basic | null分母、低胜投不合格、rate不达0 | 不除0、不NaN、不把1-0奖发出，缺L为DATA_MISSING |
| T05 P04 B NPB13/7、17/3；KBO10/5；NPB12/0 | .65基本25%、.85保证；KBO按.6667精确概率；NPB12不合格 | 未四舍五入率判资格、NPB/KBO不同；CPBL/MLB禁用模式N/A |
| T06 P05 CL SV=b−1/b/b+1/g；MR同值 | 0/28%/33%/100%；旧角色模式MR无资格 | 不改变G/SV生成；角色开放选项另expected |
| T07 P06-S MR HLD=b−1/b/b+1/g；CL同值 | 0/28%/32%/100%；旧角色模式CL无资格 | metric=HLD，未显示HP，无重复旧/新赏 |
| T08 P06-H HLD20,W8,reliefWins3；另一fixture reliefWins未知 | HP23（不是28）；未知不能算 | 输入生成来源可信；0≤reliefWins≤W，数据缺口不补0；HP未批准参数时BLOCKED而非发奖 |
| T09 全休／非一军／非P／未知league | 六赏不新抽／不发；未知league有诊断 | 原AS/打者逻辑不受影响；主R旧资格槽一致 |
| T10 W/L/SO/SV/HLD负数/NaN/缺失；IP0/负值 | 无效相关赏，不污染其他已知赏 | 不normalize产生虚假成绩；缺L只阻P04，不阻P01 |
| T11 保证仅数值达、最低资格不达 | 不获 | P02短局ERA1.0、P04低W WP1.0都无奖 |
| T12 G/W/L/SV/HLD的物理边界fixture | 奖policy只读，拒无效输入或诊断 | 不为发奖改W/L，不加R，正常normalize保持 |

### 11.2 年度／league／三冠／重复

| 案例ID／输入 | 预期与验收 |
|---|---|
| T13 同年同NPB P01/P02/P03三笔成功 | P07一笔、history一笔、traits.pitcherTC=true；无额外R；M0不补MVP |
| T14 只有统计达三项、其中P03draw失败 | 没P07，不用门槛代替已获奖 |
| T15 NPB2035 P01/P02 + NPB2036 P03 | 没P07；跨年不合并 |
| T16 NPB2035 P01 + KBO2035 P02/P03 | 没P07；跨league不合并 |
| T17 同年同league再次awards／重画／双击／UI抛错重试 | decision/honors/trait一次、drawKey/u相同、无额外R或出来高付款 |
| T18 后年同league三冠，再于另一league三冠 | history每年每league保留；同league不重复解放；首次新league按批准hitter样式解释一次 |
| T19 年末转队后读取旧成绩 | 奖key仍原赛季league/year，不读取新合约org／salaryYear；没有分段可信stats时拒合并 |
| T20 同一季P05/P06与其它赏皆满足开放角色配置 | 可多赏，无互斥；每award独立key，不因另赏改变资格或u |

### 11.3 旧数据／下游／RNG／UI

| 案例ID／输入 | 预期与验收 |
|---|---|
| T21 honors=[2030 NPB最優秀投手賞,2030 NPB最多奪三振]，缺newrecord | 文本不改、不补P01/P07/MVP；旧计分完全原样；L缺不当0 |
| T22 同义旧/新部門字串同年同league | 只读语义去重一次；显示旧历史不破坏；不双发或双计分 |
| T23 旧trait.pitcherTC=true且history缺/空 | 保留既取得、不造league／奖／能力／收入；正常显示不例外 |
| T24 空honors、空年度数据、未知名字／league | 页面安全、未知保留、无推测大奖／三冠 |
| T25 P02新名和旧名分别薪资/HOF/incentive fixture | D-KEEP新旧.75/460/aceN；D-TITLE新.35/160/king、旧保持；两方案只运行已批准者，记录差异；P03新名不能漏分 |
| T26 P04/P07下游 | 依批准部門/无额外项；year精确、固定合同schedule不变、当年/次年与累计收入分开，无反覆付款 |
| T27 M0三冠但原MVPdraw失败；M1同fixture | M0没有MVP、年轻/老将MVPtrait不触发；M1一笔MVP并测试strongpitch/oldghost/phoenix/衰退/钱，仅M1获授权才启用 |
| T28 固定R-B test vectors，不同award/year/league、同key重试 | uint32/u与跨平台一致，单key只一值；无Math.random/Date/R，ruleId不随PATCH变化；不是仅看总次数 |
| T29 正常旧资格与新门槛资格，主R逐值对照 | AS/rookie/ERA/SV/HLD/SO/MVP旧槽原位，一一same；新增赏主R0；保底旧槽也执行，未资格不偷补R |
| T30 投手正常／省エネ／全力 + IF完整seed生涯 | 对照基准完整SHA、choices每步S/合同/主R；明确已批准award及下游差异，其余0；IF全部旧奖/打者三冠/MVP与R同旧 |
| T31 PC1280／320／390px，本年六赏＋P07、长league/新旧文本 | card／career／退役／图片不截断重叠，手机正常滚动；取得当下说明，以后仅名称；读UI不写S/不抽奖 |
| T32 UI重复导航、复制seed与Replay URL | listener有效、不重复awards；seed-only不追加rv/rules；Console/pageerror0、JS/CSS4040 |
| T33 同值记录概念／真实league名称 | 不产生「唯一」「全联盟最高排名已模拟」假文案；NPB/KBO/CPBL/MLB映射不混；未核对tie规则不写假断言 |
| T34 打者三冠正常/跨年/跨league/重覆 | 原trait-policy测试不变；三冠保证打者MVP仍存在、投手M0不抄它；打者AS/新人/MVP主R原顺序 |
| T35 能力低于原保留门槛、goodReal=false、只有本年新P07 | 原movement会因「王」保护降格；若批准保留自然影响应测试保护，若批准排除此新增称号应只排新P07而保留打者三冠/MVP；两种互斥expected不能测试时任意选 |

未来实现按L3：原生policy＋绑定边界测试→Quick→定稿Full、P/IF固定seed逐步比较；PC/320/390、Console/404与Preview。现行Runner入口先list，不另改workflow；不因环境不足写PASS。投手旧negative基准用完整基准SHA，不替成新HEAD掩盖差异。无需无理由4,000新生涯；新抽选分布测试可人工离线多key、不是强制球员或游戏采样，需与自然研究分开。

## 12. 优先级与批准清单

### 必须修正／解决后才能实现

- P1 ID/年度/league冻结与新旧名字adapter，避免改名漏薪资/HOF/重覆发奖。
- P1 P02待遇、MVP-M0/M1、RNG-R-A/R-B兼容槽决定；不得把政策差藏在文案里。
- P1 NPB正式HP路线的数据来源缺口，或明确接受HLD简化；不能伪造reliefWins。
- P1 CPBL/MLB P04、MLB P06的正式对应／原創权限；CPBL完整一军资格/并列证据UNVERIFIED。
- P1 MLB SP仅14季/5名全部候选零达标，保底未观测；门槛可设计暂值，但不能统计定案或承诺自然获得。

### 建议修正／设计选择

- 稳定英文awardID、只读语义adapter、决策记录与画面分离、独立可重现draw。
- 旧P02待遇先D-KEEP；P07纯纪念/M0，无额外加分，P04NPB/KBO正式资格；其他未证联赛先不启用。
- 数值不建议四联赛同一难度一键B；NPB P01/P02/P03可以审A的可玩性，但放宽IP120应标游戏规则，不称真实。P05/P06先B保存基线。所有推荐只供选择。

### 可以延后

- 正式HP混合登板结构、AL/NL及セ/パ细分、完整NPC排名与并列模拟（不属本案）、扩大自然研究、正式胜率之外的原创效率奖。
- historical补发一律不做；存档功能不新增；沢村/月间/打者扩充/二刀流仍不在本阶段。
- IND旧top/fallback奖项外围路径列为另案UNVERIFIED，不混入六项四联盟设计，也不未经批准改变其主R消费。

### 需要使用者明确批准（不能由Codex代选）

1. 名称：NPB是否采用官方「最多三振奪取投手賞」「勝率第一位投手賞」；其他league保持统一日本语但标游戏近似，还是各自对应本地赏名？
2. 各赏各league A/B/C或维持旧资格：特别NPB P02 IP143 vs游戏120、CPBL旧保证IP150是否保持、NPB P01/W资格可玩性，MLB无样本尾部是否暂值/暂缓。
3. P04启用NPB/KBO正式资格吗？CPBL未核对与MLB无同型奖选不实作或明确原创；不得默认扩到四联盟。
4. P06选S(HLD简化)还是H(正式NPBHP另设计)？MLB是否拒新增HLD原创奖？P05/P06角色是否继续CL/MR限定？
5. RNG选R-B；旧赏改门槛是否接受保留旧主draw兼容槽＋新独立决策？对薪资／trait造成后续branch的预期差异范围是否批准？
6. P02下游D-KEEP还是D-TITLE，P04按部門、P07无追加计分是否批准？P07文本自然触发movement的「王」字降格保护是否接受，或批准单独排除该新增称号？这是工资/殿堂/生涯待遇决议，不是regex技术调整。
7. P07 MVP-M0（推荐）还是M1保證？未批准前绝不套打者三冠保证。
8. leagueKey沿游戏4bucket可否接受，不实现子联盟；不补旧荣誉、旧大赏不能当旧P02三冠证据是否同意？
9. 对UNVERIFIED官方规则，先保留范围不实作还是提供可信现行规则供补证？门槛样本不足是否另批准研究（本次没有新采样）。

## 13. 本次文件检验与停止状态

离线分析4份原始careers、48组分布与18套单项候选组合，各字段缺值显式；所有619个既有tracked文件SHA256在分析前后相同。分析工具语法／重复年度层级断言通过；附录来源SHA保留。不修改4轮原始数据。

本地引用9项全部存在，T01～T35共35个参数化验收族，48组各3套candidate结构检验通过；工作期间另外出现的未追踪难度研究脚本／报告不是本设计产出，保持原样、不编辑、不提交。designs/下本次仅4个新文件。Git tracked diff为空、HEAD未变。

这是文档／离线统计交付，不是新奖游戏测试：Quick／Full／新固定seed／PC/手机E2E／CI／Preview均**未执行**，设计案例不是PASS。没有游戏／测试fixture改动，因此按AGENTS文档规则不无条件重跑全游戏；本地Markdown引用与受保护diff另外检查。

本文件是有证据的待审设计，缺参数／官方细则处保留DATA GAP/UNVERIFIED/待决；完成后停止，等待审查，不实作、不Commit/Push。

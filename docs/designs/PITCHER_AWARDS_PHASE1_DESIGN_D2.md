# 投手個人獎項制度：第一階段 D2 設計書

> 文件定位索引（2026-10-16）：本書保留批准沿革、唯一技術條款及原Gate，不作新的產品授權。現行已公開1.13.0規則以[CURRENT_SPEC第17節](../../CURRENT_SPEC.md#d2-current-spec)為正本；[正式發布驗收](../reviews/RELEASE_1130_PRODUCTION_ACCEPTANCE.md)記錄650e4dd來源及15adf28正式站。Linux Full為NOT_ACCEPTED / DEFERRED，ARTIFACT_COVERAGE_BLOCKED不變。以下2026-10-15及更早的未公開／未授權／PLANNED／NOT_RUN是各次記錄的歷史狀態，不覆蓋後續批准與驗收。RNG編碼／精度、可信Decision、consumer及故障Gate的逐條規格移轉仍未完成，禁止因已實作自行刪除。本次只加定位引用，原技術內容及既存dirty四行不改。[現行導航](../CURRENT_DOCUMENTATION.md)。

## CURRENT IMPLEMENTATION STATUS（G9文件同步，2026-10-15）

使用者已接受開發A及B的指定本地驗收。A提交`efd4710c4c5c366ff3aba69c59180031c82ff18a`；B提交`56e72d9792529f3221c1a1ffadaf563bceebe26d`。A0／G2～G4及G5～G8為LOCAL_PASS / USER_ACCEPTED；AF01～AF08的批准規則、TR-B風險ID及恢復限制不變。AF09已按A／B分批明確授權並完成限定產品實作，不再整體標為NOT_AUTHORIZED／NOT_IMPLEMENTED。

現行產品規格統一見[CURRENT_SPEC第17節](../../CURRENT_SPEC.md#d2-current-spec)；完整證據見[A驗收](../reviews/PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)、[B驗收](../reviews/PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md)及[G9收尾報告](../reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)。B報告的舊「尚未接受／未提交」描述保留為受驗當時快照，不覆寫原報告或hash。

G9追加授權：次版1.13.0 MINOR；僅更新config、CHANGELOG及必要文件／限定驗證，並準備精確staged清單。CI timeout／artifact方案仍待審；commit／push／merge、CI觸發、Preview或正式部署與產物刪除未授權。G9整體仍PARTIAL / PENDING_RELEASE_APPROVAL，不宣稱已正式發布。見[本輪發布準備](../reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)。

**歷史標記讀法**：下方原有CURRENT、NOT_FIXED、RUNTIME_NOT_VERIFIED、NOT_IMPLEMENTED、AF09未授權及PLANNED等執行狀態，均是2026-10-13～14設計／調查時點的HISTORICAL狀態；當前實作進度以上述入口為準。數值與技術規範仍按第4.2.2、13、14.13節已批准條文執行，沒有重選模型、改寫風險ID或把歷史FAIL轉成PASS。後續未授權的研究、HP、存檔及發布仍不在產品完成範圍。

> 2026-10-14 CURRENT：P08 phoenix／當年度降格保護已 APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED，使用者確認沿用既有觸發條件與一次性效果；最新政策與六項技術審查見[第14節](#pitcher-awards-technical-review)。舊 BL-P08-EFFECT「是否新增」為 SUPERSEDED；hash、精度、journal/receipt設計現依AF01～AF08批准；Runtime仍RUNTIME_NOT_VERIFIED，產品實作 NOT AUTHORIZED。

> CURRENT APPROVED TECHNICAL DESIGN：[第14.13節 AF01～AF08](#d2-technical-approved)。AF09 NOT_AUTHORIZED，產品NOT_IMPLEMENTED，所有新產品驗收PLANNED / NOT_RUN；舊技術候選待批描述為HISTORICAL / SUPERSEDED。

> 唯一CURRENT APPROVED P08 NUMERIC DESIGN：[第13節 IP180／原S3／B2／G95](#p08-approved-design)，APPROVED / DESIGN_ONLY。第4.3/11/12的IP150/190、G100、基本55及舊機率/待批狀態為HISTORICAL / SUPERSEDED；技術設計依第14.13節已定案，Runtime驗收與實作授權仍未完成。

2026-10-14。**P01 CURVE_B及既有四聯盟勝投線、P04 CURVE_B／NPB最低12勝／KBO10勝／.650與.850已APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED，見[第4.2.2節](#p01-p04-approved-design)。** P07及P08批准規則保持，P08唯一規格仍見[第13節](#p08-approved-design)。技術設計見第14.13節，Runtime未驗證，本次不是實作授權。

門檻錨點修訂的歷史背景：依使用者「不降低門檻，以現行獎項門檻推算新增獎」更新§4.2/4.3。寬鬆A/Q_A與初版自由錨點只保留為歷史敏感性，不是產品實作或自然可達性驗證。A09批准推導方式；其後使用者另行批准P08的IP180／原S3／B2／G95，依[第13節](#p08-approved-design)為準，不再把P08已批准數值列為待審。

## 1. 基準與 D1 → D2 修訂

已重新fetch origin。本次dev HEAD=origin/dev=`444144a57fb3ad23ac2bd1b3e9c87ba0809ea9bb`，VERSION1.11.9；main/origin/main=`4624753a5359acd6c63ab6957341376bd43c5c88`，引擎最後修改a1658c994713fd1fb8f66857dab33df0ff6548fd。tracked工作樹乾淨，既存designs/、難度審查文件／工具、SAMPLE_GAP_DIAGNOSIS及tasks/未追蹤，均保留。

基準文件：[D1全文](PITCHER_AWARDS_PHASE1_DESIGN.md)、[D1原分析附錄](PITCHER_AWARDS_PHASE1_DATA_APPENDIX.md)、[D1 JSON](PITCHER_AWARDS_PHASE1_ANALYSIS.json)、[難度審查](../reviews/PITCHER_DIFFICULTY_AND_AWARD_REACHABILITY_REVIEW.md)。四輪原始資料只讀。現行AGENTS／CURRENT_SPEC／BACKLOG／CHANGELOG及index、獎項／薪資／特性／殿堂／升降格及相關測試重新核對。CURRENT_SPEC舊main標頭不代表最新Git事實，不在本任務改正。

重要變更（舊稿不覆寫）：

- D1未包含沢村賞，D2以A01新增P08、NPB一軍綜合大獎，不把旧ERA公式冒充沢村評分。
- D1的P02候選B取消了CPBL額外保證IP150、候選A放寬資格、全角色提議，D2全部撤出有效規格：SP、原ERA/IP資格／抽選不變，IP150保證限制保留。
- D1 D-KEEP推薦撤銷；新P02確定部門級，舊最優秀投手維持歷史大獎待遇，P08承接大獎分級。
- P03/P05/P06的A/C難度與放開角色不適用D2，只有原生門檻有效。D1附錄保留為歷史敏感性分析，不當D2執行配置。
- P04只NPB/KBO；初版minW13/10為HISTORICAL，使用者2026-10-14明確批准NPB12/KBO10，見[第4.2.2節](#p01-p04-approved-design)。這是明示設計決議，非因研究工具自動降低；CPBL/MLB排除保持。
- P06確定HLD簡化，HP及救援勝投/GS/reliefG資料新增延期，不再是第一階段二選一。
- D1 M0撤銷。M1投手三冠必得MVP已批准，保留原MVP槽，不能因未達原MVP基本資格讓三冠拿不到MVP。
- 新P01/P04/P08獨立固定抽選，P02/P03/P05/P06沿用原主抽選结果，P07無抽選。保持主R槽不等於承諾完整生涯不变。

## 2. 已批准 A01～A09與P08定案（不需再表決）

| ID | APPROVED內容 | 尚未批准部分 |
|---|---|---|
| A01 | 停止新發舊最優秀投手名；P08沢村、僅NPB一軍、W/ERA/IP/SO/WPCT綜合＋資格＋抽選、可從缺，不強求全部傳統參考線；資格、標準化、原S3、基本60及B2／G95已定案，見[第13節](#p08-approved-design)；phoenix／當年度降格保護已批准，見[第14節](#pitcher-awards-technical-review) | AF01～AF08技術設計已批准；Runtime／保護接入未驗證，AF09實作未授權 |
| A02 | P02新增獨立ERA部門賞，沿舊SP/ERA/IP/g及額外IP150保證；舊歷史原名原待遇 | 無四輪資料調低既有資格的權限 |
| A03 | P02/03/05/06原資格／機率／保證不變，P03可官方名，名稱不漏下游 | 原賞無新調參；P01/P04/P08數值均已設計批准 |
| A04 | P04只NPB/KBO；最新NPB12/KBO10（舊13/10為HISTORICAL）、.650/.850與CURVE_B已批准；原生有效W/L、0分母/缺值不發 | AF01～AF03精度／抽選設計已批准；Runtime未驗證／AF09未授權；不再待選曲線 |
| A05 | P06維持HLD，非正式HP，不新增reliefWins/GS/reliefG | 正式HP第二階段 |
| A06 | P08大獎、P01～06部門、P07不額外薪資/HOF分，保證MVP正常待遇；P08特殊保護另已批准 | AF05／AF07映射及receipt設計已批准；接入Runtime未驗證，非是否新增政策 |
| A07 | 新賞獨立固定抽選、舊主R槽原序、鍵seed/year/league/ID/ruleId、PATCH不重抽、一次決策 | AF01／AF04設計已批准；產品接入Runtime未驗證，AF09未授權 |
| A08 | 同年同league實得P01/P02/P03→P07→保證年度MVP；不含P08，原MVP槽保留、下游正常、不重覆 | 不再有M0選項 |
| A09 | 不由研究工具擅降門檻；最新使用者明示批准P04 NPB13→12作特定更新，其他線不變。P01/P04見[第4.2.2節](#p01-p04-approved-design)，P08依[第13節](#p08-approved-design) | AF01～AF08設計已批准；Runtime未驗證／AF09未授權，不重開已批准數值 |

制度及P01/P04/P08數值均為APPROVED / DESIGN_ONLY，不表示遊戲已存在，不更新CURRENT_SPEC或BACKLOG作完成。P01/P04依[第4.2.2節](#p01-p04-approved-design)，P08依[第13節](#p08-approved-design)；原A曲線為HISTORICAL，不再待選。產品精度、hash、journal/receipt設計已批准，見[第14.13節](#d2-technical-approved)；Runtime未驗證，實作未授權。

## 3. 現行CODE、資料與官方證據（保留D1調查）

以下行號基於本次HEAD，game.js未變。完整調查、官方來源、資料缺口與歷史對照保留D1 §2～4，未被決策摘要取代。來源：[game.js](../src/engine/game.js)、[trait-policy](../src/engine/trait-policy.js)、[salary-evaluation](../src/engine/salary-evaluation-policy.js)、[salary-promotion](../src/engine/salary-promotion-policy.js)、[HOF](../src/engine/hall-of-fame-policy.js)、[incentive](../src/engine/incentive-policy.js)。

- 46–57主R/chance：每次chance一R、100也耗R；N0四R。1354–1460奖流程AS→符合条件rookie→ERA→CL/SV→MR/HLD→SO→原MVP，资格未达不抽。無P01/P04/P08自然發獎。
- 342–348角色：sta≥52SP，低sta MR prevD≥3轉CL、CL prevD≥1留任；114–148會議只CPBL1/NPB1/MLB，KBO早退。767與1268保持補正前lastD/prevD時點。
- 424–479成績生成含W與L，SP/CL/MR生成分支不同；258blankStat與556–568累計保留L/HLD；[event-season-policy](../src/engine/event-season-policy.js):1–28更新後正規化。1305accStat/accLevelStat、1322log.st、1347awards、1349薪資評價；獎項只用最終st，不再生成。
- 年度log沒有足够的league/role永久分段；portionOf在1307–1313僅展示，不能倒造跨聯盟成績；没有救援勝投、HP、GS/reliefG原生可用欄。第四輪研究snapshot有當時role/lv，不從退休role回填。
- 619buildCareerViewModel複製honors→achievements，[player-detail](../src/ui/player-detail.js):7–11顯示；2225–2258與2387–2412引退/圖片按旧字串分組。显示设置localStorage不是生涯存檔，途中save/load不新增。
- 2688IND也top，1356lgN没有IND但TH fallbackCPBL；静态外围风险不是自然Bug重现。新规则不误在awards外层return删除IND原R；本案不修独立联盟。

外部制度僅供區別真實／遊戲：D1已查NPB官方[2025 CL](https://npb.jp/award/2025/cl.html)、[PL（13勝资格）](https://npb.jp/award/2025/pl.html)、[規定IP表](https://npb.jp/bis/2023/stats/pit_c.html)、[HP公告](https://bis.npb.or.jp/npb/20050203stats.html)；KBO[官方六部門及10勝](https://www.koreabaseball.com/Record/Ranking/Top5.aspx)，CPBL官方新聞/投手表與404規章限制、MLB記錄領先/年度後援投票差別詳D1 §3，确认日2026-10-13。不把遊戲HLD稱NPB正式HP，也不把MLB統一遊戲賞名當正式NPB式授獎。

P08新增外部參考：[NPB 2025沢村賞公告](https://npb.jp/news/detail/20251027_02.html)（2025年度、2026-10-13直接讀取確認受賞及先發完投型定位；原bis鏡像讀取timeout後主域成功）。本書五項/分數/概率是使用者批准的遊戲原創簡化，不稱NPB正式評選公式。2026傳統參考標準的完整最新版尚未直接核查，UNVERIFIED；不套舊200IP／完投等全部必要條件，不新增未保存的完投資料。官方從缺／共同得獎詳則若需真實規則版另補證，不影響本次已批准「遊戲可從缺」原則。

相關既有測試：trait-policy.test.mjs:64–118打者三冠/精確名稱/主chance列；salary-evaluation-policy.test.mjs:32–37市場賞分；salary-promotion-policy.mjs、hall-of-fame-policy.mjs與retirement-hof-balance.test.mjs舊大獎/部門待遇；trait-system-e2e.mjs MVP/trait。這些未重跑，也未當新獎項PASS。

## 4. P01～P08有效規格

穩定ID與显示名分離，新honors仍字符串，舊honors不global replace。P01～06/07沿遊戲四bucket（CPBL/KBO/NPB/MLB），不臆造セ/パ、AL/NL分段；P04仅二league、P08仅NPB1/SP。有效普通球季P、G/IP>0；既有賞应忠实保持原生资格短路，不为旧畸形fixture补抽R。无效数据的诊断与旧槽容错策略需测试，不能用新验证提前return吞旧R。

| P-ID／英文ID | league與角色 | 第一階段條件／抽選 | 分級 |
|---|---|---|---|
| P01 PITCH_WINS／最多勝利投手賞 | 四league一軍、全P | [第4.2.2節批准CURVE_B](#p01-p04-approved-design)，CPBL10/15、KBO12/17、NPB12/17、MLB14/20；APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED | 部門 |
| P02 PITCH_ERA／最優秀防御率投手賞 | 四league一軍、SP | 以下凍結公式、沿旧ERA主R結果 | 部門 |
| P03 PITCH_STRIKEOUTS／最多三振奪取投手賞 | 四league一軍、全P | SO原阈值／公式，沿旧SO主R | 部門 |
| P04 PITCH_WIN_PCT／勝率第一位投手賞 | NPB/KBO一軍、全P | [第4.2.2節批准CURVE_B](#p01-p04-approved-design)，W≥12/10、有效W/L、W+L>0、WP.650/.850；APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED | 部門 |
| P05 PITCH_SAVES／最多セーブ投手賞 | 四league一軍、CL | SV22/35、旧公式旧R | 部門 |
| P06 PITCH_RELIEF／最優秀中継ぎ投手賞 | 四league一軍、MR | HLD18/30、旧公式旧R、metric=HLD | 部門（簡化） |
| P07 PITCH_TRIPLE_CROWN／投手三冠王 | 四league同年同league P01/02/03实际獲獎 | 無抽選；history+trait+honors一次，M1必MVP | 無額外賞分 |
| P08 PITCH_SAWAMURA／沢村賞 | **NPB1、SP** | [第13節 CURRENT APPROVED DESIGN](#p08-approved-design)：IP180／原S3／B2／G95；W13/IP143/ERA3.20與有效資料資格不變，獨立draw、可從缺；技術設計見[第14.13節](#d2-technical-approved)已批准，Runtime未驗證／AF09未授權 | 大獎 |

### 4.1 凍結原門檻（A02/A03）

P02：SP，ERA≤3.20且IP≥g才抽，g CPBL120/KBO144/NPB143/MLB162。**保證ERA≤2.20且IP≥max(g,150)**；否則p=clamp(30+round((3.20−ERA)×35+(IP−g)×.4),30,95)%；使用原chance結果，保證仍一主R。CPBL IP149/ERA2.20有機率、不保證（g120→p77）；IP150才保證。NPB IP143/ERA2.2也是非保證。不得從D1 B少IP150的式子匯入。

P03：CPBL SO130/180，KBO156/216，NPB155/215，MLB175/240；未basic不抽、达god p100，否则clamp(25+round((SO−basic)×1.2),25,95)%。SP/MR/CL皆可，無IP最低資格，不以leagueg重新同比縮放。

P05：CL、SV≥22；SV≥35保証，其他clamp(28+(SV−22)×5,28,95)%。P06：MR、(HLD||0)≥18；≥30保證，其他clamp(28+((HLD||0)−18)×4,28,95)%。保留現行欠HLD回退0的短路行為，不以D1的「缺HLD不等於0」提議擅改原槽；此回退只影響資格，不造历史HP。两奖不开放全投手，不因名称加「投手賞」漏判待遇。

原外层top/nonzeroSeason与MVP资格公式game.js:1445–1457保持。MVP原有資格是SP IP≥120或非SP G≥45、d≥6、seasonFactor≥.9；p100 if d≥15，其他base12（牛棚5）+11(d−6)、cap95。**P07保證不受這組原MVP資格阻止，但未原资格时不能凭空补一个主R槽。**

### 4.2 新數值與模型

P01以現行ERA基本3.20、SP生成公式與各聯盟IP資格投影，不由少數自然样本最大值倒填：

1. 正常投球／中性noise/form/無事件故障、三投球能力相同、參考sta52（SP最低）。`d=(4.32−3.20)/.17=6.588235`，`wp=.50+.014d=.592235`，`ipg=5+.05d+.012(52−50)+.006d=5.392941`，原SP決定率=.72。
2. 條件估值`W≈.72×(g/ipg)×wp`，g=120/144/143/162；向上取整，且不低於初版D2 B基本門檻。這個估值**假設已達g**，不保證上述能力自然恰產g局，不能拿它作自然球季證明；不同sta/能力組合有不同W/IP，係數沒有唯一真實跨賞換算。
3. 保證取`max(初版D2 B保證,ceil(基本W×現行SO保證/基本))`。SO倍率只作同聯盟高成績跨度的遊戲設計轉換，不宣稱SO決定勝投；初版B是防降下限，**不是現有最多勝獎項**。

| 聯盟 | g | 條件W估值 | 推導基本W | SO基本/保證 | 推導保證W |
|---|---:|---:|---:|---|---:|
| CPBL | 120 | 約9.49 | 10 | 130/180 | 15 |
| KBO | 144 | 約11.39 | 12 | 156/216 | 17 |
| NPB | 143 | 約11.31 | 12 | 155/215 | 17 |
| MLB | 162 | 約12.81 | 14 | 175/240 | 20 |

此表四聯盟P01基本/保證線保持，現已正式設計批准；MLB保證20不變。P01正式採[第4.2.2節CURVE_B](#p01-p04-approved-design)，原`clamp(30+8(W−basic),30,95)%`為HISTORICAL候選，不再待選。不下修P02/P03/P05/P06任何資格/公式。

P04歷史推導（HISTORICAL）：初版NPB13/KBO10、中性wp=.592235向上.60後守.65下限、保證.85，以及原候選`clamp(25+round((WP−.65)×150),25,95)%`保留供比較。現行批准為[第4.2.2節NPB12/KBO10、.650/.850與CURVE_B](#p01-p04-approved-design)，非产品已實作。缺失/無效W/L或0分母不獲，0敗仍先最低W；CPBL/MLB排除。

四league分开实际季/人/保底/Σp及全部算式见[平衡分析末节](PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md)、JSON `activeDerivation`。0達標照實保留，不為讓玩家樣本得獎調低。

### 4.2.1 P01／P04 A/B曲線比較（HISTORICAL：批准前與NPB13勝分析）

> 以下保留當時「未批准」狀態、13勝母體及A/B估值，不改寫歷史結果。最新CURVE_B批准及P04 NPB12勝見[第4.2.2節](#p01-p04-approved-design)，舊A不再待選，舊13勝數據不與新12勝混合。

2026-10-13，分析環境dev7220ad82002801d3dea5fedae80d0fb3d7a0433f／1.12.0；只讀1.11.8/1.11.9封存自然資料，不新增生涯。A/B指曲線，不是D1的A/B/C門檻方案。既有門檻不變，P08第13節已批准IP180／原S3／B2／G95完全不受此比較影響。

P01基本/保證W仍CPBL10/15、KBO12/17、NPB12/17、MLB14/20。CURVE_A：W<B0；基本區clamp(30+8(W−B),30,95)%；W≥G100%。CURVE_B：W<B0；基本區20+75(W−B)/(G−B)%；W≥G100%。MLB每勝12.5而非其他league15，低端B可能比A低、高端可能比A高，不能一概稱放寬。

P04穩定ID/顯示名保持PITCH_WIN_PCT／勝率第一位投手賞；本次任務所稱「最高勝率」不授權改名。僅NPB/KBO、最低W13/10，.650/.850錨點及A/B仍未最終批准。W/L非負整數、缺失/無效/0分母/最低W不足p0，原生WP=W/(W+L)不先丸め。CURVE_A：基本WP區clamp(25+Math.round((WP−.65)×150),25,95)%；CURVE_B：20+300(WP−.65)%；WP<.65均0、WP≥.85均100%。0敗仍需最低W，不把小數勝敗補整。

VERIFIED資料與計算：8個主來源index（四輪加兩Seed四策略），268次自然case／1708有效一軍觀測按版本/策略分組，未發現逐季重複/矛盾/缺W-L等；不是268名独立玩家。A/B資格及保證季數逐季一致，Σp是MODEL_ESTIMATE而非實際抽選。R2 CPBL P01 7.60→8.15、NPB1.50→1.00；R3 KBO P01 7.78→7.70、P04 5.70→5.78720。少量Seed與多季相關，零樣本不代表不可達、不能據此改基本線。

P07保留同年同league同球員實得P01/02/03必MVP，P04/P08不參與。從原生st/role可算冻结P02/P03邊際p，但不同主R槽/獨立固定hash設計不證統計獨立；乘積只標MODEL_ESTIMATE / INDEPENDENCE_ASSUMPTION，另列每季max(0,p1+p2+p3−2)～min(p1,p2,p3)界線。R2NPB共資格1季，Σ乘積.03225→.02150，不能當實得三冠或斷言MVP總數變化。需区分保證MVP觸發期望與原MVP已抽中是否重複。

完整矩陣、逐Seed集中度、P04 W-L邊界、P07界線、資料缺口與重現入口見[現有平衡分析](PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md#p01-p04-ab-analysis)及[D2 JSON的P01P04ABAnalysis](PITCHER_AWARDS_D2_ANALYSIS.json)。6538個離線assert PASS，不是遊戲測試或產品RNG驗收；產品Quick/Full/CI與新採樣NOT_RUN。P01/P04曲線待使用者決定，沒有批准/實作/提交/部署。

<a id="p01-p04-approved-design"></a>

### 4.2.2 P01／P04 CURRENT APPROVED DESIGN（DESIGN_ONLY / NOT_IMPLEMENTED）

2026-10-14使用者明確批准CURVE_B；只有P04 NPB最低W13→12，其餘已批准規則不變，產品實作未授權。

- P01：四聯盟一軍投手，W為非負有限安全整數；基本/保證CPBL10/15、KBO12/17、NPB12/17、MLB14/20。W<B p0；B≤W<G p=`20+75×(W−B)/(G−B)`%；W≥G p100%。MLB跨度6與其他跨度5分開，未達資格不抽。
- P04：只NPB/KBO、一軍投手，最低W12/10，WP基本.650、保證.850。W/L為非負有限安全整數，缺失/無效不補造，sum0不抽；未最低W或raw WP<.65 p0；.65≤WP<.85 p=`20+300×(WP−.65)`%；WP≥.85且合格p100。WP=W/(W+L)不先顯示取整；CPBL/MLB不適用。NPB12/0 p100、12/6約25、12/7 p0；KBO10/2約75。
- P01及P04：APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED。A曲線僅歷史候選，舊NPB13門檻依[歷史分析](PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md#p01-p04-ab-analysis)保留。產品比較精度/hash/journal/receipt設計見[第14.13節](#d2-technical-approved)已批准；Runtime未驗證，AF09未授權。
- P04只影響勝率獎：P07不包含P04，因此原三冠乘積/上下界不變；P08最低W仍13及IP180／原S3／B2／G95完全不變，不重新以P04最低W計算P08入口。

新12勝離線比較：R1/1.11.8 NPB合格1→6、保證0→0，BΣp .4166667→1.7843137；R2/1.11.9合格0→4、保證0→0、Σp0→1.1176471；R3/R4與兩Seed四策略的NPB合格皆仍0，零目標樣本仍分列。P01/KBO/原P07數值逐值確認不變。詳[現有平衡分析的批准後結果](PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md#p01-p04-selected-b)及JSON `P01P04SelectedDesignAnalysis`；這些是已批准設計的理論期望，不是自然實得新獎。沒有新生涯、產品測試或提交。

### 4.3 P08三種評分模型（HISTORICAL / SUPERSEDED）

> 本節保留D2原候選公式及當時的審查狀態，不作目前選定設計。IP150與總分100保證已被取代；目前APPROVED / DESIGN_ONLY為IP180／原S3／G95，請使用[第13節：選定設計](#p08-approved-design)。基本55、概率曲線與產品精度仍未批准，歷史數值不刪除。

> 以下IP143→150標準化及本節達100保證公式為HISTORICAL / SUPERSEDED；現行設計的IP公式與總分95保證請直接參照[第13節](#p08-approved-design)。55與機率公式仍只保留為未批准候選。

固定0–100分不將原數相加。**評分0→100改由NPB基本→保證門檻映射：W12→17、ERA3.20→2.20、IP143→150、SO155→215、WPCT.650→.850。** IP150就是P02額外保證要求，SO不套自由50/180、ERA不從5.0開始取得相對高分。component=100×clamp((value−basic)/(god−basic),0,1)，ERA分母−1使較低ERA較高；模型Σ(component×weight)。IP超150封頂，減少高IP/SO機會重疊的無限加分；這不表示150局保證沢村。

- S1：W/ERA/IP/SO/WPCT各20%。易懂，W+WPCT共40%重复胜利评价较重。
- S2：15/30/30/15/10%。ERA/IP优先，可能过度偏好高工作量，IP封顶限制无限收益但仍需balance审查。
- S3：25/30/25/15/5%。用户指定起始研究候选；5%WP降低W重复评价，但不是正式决定。

資格與分數分開：**NPB1/SP，W≥max(P01基本12,已批准P04資格13)=13，IP≥143、ERA≤3.20，五項及L有效、W+L>0。** 用較嚴勝投資格與既有ERA/IP線作大獎入口，不沿Q_A8勝/100局或Q_B10勝/120局放寬。基本資格不強制SO≥155或WP≥.65，讓綜合評分仍允許不同優勢補足，也不要求現實沢村全部傳統參考標準。

基本總分暫留初版中格55（不低於基本/保證錨點中點50），**55仍是無唯一推導的待審參數**。保證總分改100（不低於原80），在三模型皆正權重時代表五項各到保證錨點；保證難於基本、全指標極強才無抽選失敗。仍保留原獨立draw決策及記錄。研究用p=clamp(30+2(score−55),30,95)%、達100保證；權重與斜率未由門檻決定、未默認批准。一般基本55不要求五項均到保證，因此不是全部傳統標準的AND判定。新版現有NPB Wmax12，資格及預期皆0，照實記錄，不換門檻。

极端有效值clamp到100或0，不改st；负值/缺失/NaN拒评、不重新生成；零敗W>0正确WP1且封顶；0/0拒绝。SP取成绩冻结的role，不能拿退休/current next-role；混合年度缺证明不推断SP。最高IP的收益封頂但仍与SO机会相关；不声称权重独立。胜投及胜率相关需以S1/S2/S3实际达标群看集中度。

同年P08与P02可并存、不共享抽選；P08不保证P01/P03/P07/MVP，P02也不保证P08。三冠不需要沢村賞，沢村得獎也不代P02。新资格不要求所有现实传统标准，亦不新增完投數。

## 5. RNG與M1執行順序／交易安全

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

### 5.1 年度凍結與原槽

冻结 `{stateIdentity,seed,year,bucket,level,role,seasonFactor,st,rookie/AS相關字段}`，同年league不可拿年末转队后的S.org判定。输入只读快照不是clone/rollback全S。年度transaction绑定该S实例与year/league，过期callback拒执行，新年度正常开新tx。

正常顺序建议（设计流程，不是已实作）：

1. **Prepare**：验证配置/新input/语义adapter，建立年度私有journal并冻结st；TBD配置不能默选候选值上线。已有COMPLETE直接render；已部分draw则从journal续，不重抽。
2. **Legacy draws**：严格原序AS、条件rookie、P02（旧ERA位置与概率）、P05、P06、P03、原MVP；打者分支与原MVP保留原序。每个旧抽選槽即取即記其result/p，原100%也抽，原未资格不增加R。P02取得同一个旧ERA布尔结果，**不额外抽旧大賞也不另抽P02**。draw result不得在新荣誉生效后重新评资格。原AS的stats[bucket].AS++亦须有一次commit receipt，其他既有状态更新不可因暂存honors而遗失或重覆；原rookie资格不依赖AS计数，冻结输入不改变这一年度资格。
3. **New decisions**：P01/P04/P08純资格→固定独立u/p；P04仅两league，P08仅NPB1SP、key各自独立，不重用P02u/result。可在数值计算阶段并行，但提交排序固定为P01/P02/P03/P04/P05/P06/P08；不挪主draw。
4. **Draft honours**：使用已记旧draw及独立decision生成同年league获奖集合；**本年不产生旧最優秀投手賞**。新awardDecisions成功/失败/不资格均记录原因。尚未获得荣誉不以st门槛替代。
5. **P07**：本年本league实际P01/P02/P03=true才加P07，不含P08；history一次。不同年/league不组合，不能用旧大賞映射过去ERA。
6. **M1**：原MVPdraw中或honors已有本年leagueMVP则一笔；原draw未中、或没有原MVP槽但P07=true则补一笔MVP。新MVP decision记sources含LEGACY_DRAW/TRIPLE_CROWN_GUARANTEE，不建两份。保证无额外R、不能返资格失败不给MVP。
7. **Commit awards**：先持久本年decision与honors delta，再history与pitcherTC acquisition；同步纯提交函数一次。receipt提交前不render、不付款、不切年、不触发随机事件。无效名称/配置等可预见验证全部放prepare，避免获奖半提交。重复条目靠year/league/ID，不靠title substring。
8. **Existing effects**：最终MVP已进入honors后，依原流程触发awardTraitUnlocks的MVP年龄trait、yips、phoenix。打者三冠保证MVP原路仍正常；投手确保不误走hitterTC分支。建立trait-effect receipt，取得条件用原年龄；oldghostpending/used、strongpitch、phoenix/pool变更最多一次。
9. **Salary evaluation/settlement**：最终honors再给原recordSalaryEvaluation；后续原settle处理annualSchedule、baseSalary与applyIncentivePayment。新赏不直接加现金，多个奖不累加多次满额出来高。薪资评价只覆盖本年度同一entry、不凭重复render新增一次市场历史；这条须对照现行记录函数实作边界再测。
10. **Render/continue**：提交后画面失败只用receipt重绘，不再draw／加honors/traits／付钱／推进年度。年度继续沿现行choice-action token及交易防护，receipt确认next-start完成前不能提前成功标记；下一步发生异常时仅重试失败步骤。

### 5.2 fault injection与可实现性边界

必须有主draw journal，因为仅hash防重无法保护P02/MVP旧槽。每槽的R取值與結果就地保存、中間不得插入可throw的卡片／外部callback；prepare验证journal可写，无await。中途异常恢复已记结果，不回滚合法主R。若无法证明取值到journal的原子同步边界，标BLOCKER，不靠「重抽也是同概率」掩盖。

honors/traits既不是数据库事务，也不能口头承诺所有异常可rollback。建议私有WeakMap journal保留phase、draws、awardDelta、effectReceipts、renderRetry、continued；S.awardDecisions为已完成决策正本，不写新大规模save。每个有副作用的纯同步小提交先计算合法值、再无可throw外部调用提交；UI例外留在提交后。测试注入在draw后、honors提交后、trait提交后、市场评价后、收入支付后各边界；不无限cloneS、不重领契約金、不反覆付薪。

若effect中某操作含多次state写入，不能只于最后置completed而重试pool+8；需effect自带一次收据/重用已算结果或分拆不可重入的commit。沿现行incentive-policy:29–34 year receipt及contract-policy payment guard，但必须确认本新流程不越过/重置这些guard。不同case不得用人工fault当自然Bug，尚未实作测试全部PLANNED。

### 5.3 独立键与两层相容

独立key长度编码UTF-8 `{domain:'pitcher-award-v1',seed:实际初始化SEED/year/leagueKey/awardId/ruleId}`，seed为本游戏现行规范化后保留的初始化seed，不重新引入新的URL解析或不同Seed截断；不用当前R/_s、Date、Math.random、DOM、honors长度。ruleId固定不含PATCH VERSION/队名，新P01/P04/P08不同key，不共用一u。算法与跨平台testvectors仍技术TBD，可提出固定32位混合哈希方案评审，未在本任务调用独立抽選或模拟分布。

相容1：**同输入/同旧资格年度**，旧主R调用顺序/值/次数与原版相同，新增赏直接主R0。相容2：新荣誉、P02从大奖改部門、M1带来收入/traits/降格护栏/后续条件变化，完整人生可能有可追溯差异，不保证全seedS/R总数不变。未来允许差异须列awardDecisions/honors/trait/history、已批准待遇的市场/HOF/MVP/出来高与因果后续branch；无关成长公式/球团候选/伤病直接抽選不可随便改变。打者完整原规则/正常R必须保持。

## 6. 新舊語義與下游（A06）

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

精確辨識year/已知league/完整名稱，別名表不是global replace。`LEGACY_BEST_PITCHER`專用歷史ID，**不等P02，也不等P08**；旧最多奪三振→P03，最多セーブ→P05，最優秀中継ぎ→P06只读语义alias，保留历史字串。未知名稱/league只顯示不猜分；新旧同義同year/league只计一次，legacy大賞与P02不同语义可並存，但本年不再新发legacy。

| 语义 | 市場awardAdjustment | fallback salaryAwardBonus | HOF／保底 | 出来高 |
|---|---:|---:|---|---|
| LEGACY_BEST_PITCHER旧最優秀投手賞 | .75 | 2 | 460，aceN，至少スター | BEST_PITCHER→既有FULL |
| P08沢村賞 | .75 | 2 | 460，aceN，至少スター（承接大獎級） | SAWAMURA→既有FULL |
| P01/P02/P03/P04/P05/P06 | .35 | 1 | 160，king，至少レギュラー | TITLE→既有FULL |
| P07三冠称号 | **0** | **0** | **0，不重复记king/aceN** | 非独立奖金触发 |
| 保證或原抽中的年度MVP | .75 | 2 | 420，mvp，至少スター | MVP→既有FULL |

现有市场總上限1.5（salary-evaluation:56–66）、fallback總上限3（salary-promotion:110–122）、annualMax及合同條款不變。沢村HOF现在没有对应字符串分支，A06明确要求新增大獎adapter映射460/aceN，不可以因为旧HOF不认沢村就给0；P04/newP03/P05/P06完整名也要防漏判。

同年P02与P08各一笔不等重复计分，两种不同賞依法叠加后封顶；P07自身0，但其MVP正常+.75/420、由現行FULL按年度max一次，不能为了「三冠不重覆」把MVP待遇归零。已成立保障年俸不回溯改，次次市场/出来高效果走现有流程，不为多赏提高package上限。

MVP本人效应：trait-policy:55–77 strongpitch在age<24且NPB/MLB，oldghost age≥35且未用/未取得，pending在下一季衰退按原规则耗一次；其他league三冠MVP也可触发oldghost，不给KBO/CPBL strongpitch。game.js:1460–1470 yips由任一本年荣誉解除；phoenix现有regex认MVP，可在glass且未phoenix时解除/加pool8一次，重试不得重复。P07也让「王」文字护栏命中，但M1新增MVP已足以原movement:1602命中，**没有必要另给P07额外降格保护或计分**。

名称变化保持既有实际文字作用：旧日文最優秀投手賞并不匹配movement的中文「最佳投手」/王/MVP，同P02/P03/P05/P06新正式名亦不匹配；只改ID分类不能偷偷让所有部門自动抗降格。P08「沢村賞」也不匹配旧「澤村」。原 **BLOCKER-P08-EFFECT**「是否新增」政策已 SUPERSEDED：使用者已批准P08复用phoenix／当年度movement降格保護，具體條件與技術審查見[第14節](#pitcher-awards-technical-review)；不順便修舊中文regex、擴大其他獎項效果或永久免降格。P04/P01正式「投手賞」不含王，不取勝投王別名造成額外保护。

MVP概率自身仍看st.d与工作量，不读单项奖总分；P08不改变原MVPp，P07仅保证补发。大獎級不代表自动MVP或传说名选手；殿堂票选公式/年份不变，评分差可自然影响tier及后续投票R，这是合法下游而非新增直接R。

## 7. 数据结构与旧状态

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

拟定S.awardDecisions按year/league/awardId稳定键：`{year,leagueKey,awardId,ruleId,level,role,metric,statsSnapshot,eligibility,probability,drawSource,drawKey,awarded,reasonCodes}`。P02/P03/P05/P06 drawSource=LEGACY_MAIN，P01/P04/P08=INDEPENDENT_FIXED，P07=DERIVED，MVP记录draw+guarantee原因。P08还保存component/score/modelId/参数版本，但实际字段结构在技术审查定稿；不保存不必要整S，私有tx不加入途中存档。

tripleCrownHistory.pitcherTC `{year,bucket,league}`保持hitterTC形状，同年league只一筆；traits.pitcherTC取得/reason/首次新league解放按现有名称修饰，解放当下说明、之后只名称，未直接加能力。除decision/tx外不加败投/HP/GS/reliefG，年度st與通算成績來源不變。

旧state/honors未结算未来球季可启用新制度；已結算過去不重算draw、不補P01/P07/MVP/P08、不将旧大赏改ERA或沢村。旧pitcherTC已true保持，不猜history，不再次奖励；L缺失只阻P04/P08，其他可信原賞照旧规则。旧資料有1.11.9 awards但缺新tx不能让页面重绘重判；用已结算阶段/可靠receipt阻止重算，无法判别标历史未知，不为测试假造未结算。

跨联赛同年三冠只同冻结league决定；S.log/portionOf不提供可靠原league分段时拒回填。本阶段仍四游戏bucket；若要求AL/NL或セ/パ需另设计。seed-only分享只?seed，无rv/rules/双engine；显示localStorage与历史状态容错不等新增生涯存取。

## 8. 测试设计 T01～T50（均PLANNED，未运行）

共同fixture：P、2035、合法contract/一军状态、冻结role/st，实际decision构造/纯计算及完整引擎绑定都要测；u为独立draw测试替身或主R既有槽受控值，不叫自然样本。新TBD参数以「最终批准配置的b/g」写断言，不能从Q_B默填上线；T02/03/06/07用已批准固定规则。

| ID | 输入 | 预期／验收条件 |
|---|---|---|
| T01 | P01 W=b−1/b/b+1/g | 无机会/basic/提高/保证，按最终批准p exact；每league分开 |
| T02 | SP CPBL ERA2.2/IP119/120/149/150；NPB142/143/149/150；MLB161/162 | 未g不抽；120/149非保证且旧chance；≥max(g,150)保证仍旧R；不采用D1变体 |
| T03 | 四league SO basic−1/basic/god−1/god×SP/MR/CL | 原130/180等门槛、p25/原斜率/100，原draw槽，名字不漏分 |
| T04 | P04 W/L=0/0、1/0、缺L/NaN/负数 | 没有獎、无NaN、不得造L，独立主R0 |
| T05 | NPB11/0、12/0、12/6、12/7、13/7；KBO9/0、10/5、10/2、10/1；CPBL/MLB高WP | 最新CURVE_B依次0/100/25/0/20%、KBO0/25/75/100%；原始WP不取整，CPBL/MLB無P04；此為PLANNED產品驗收，不把離線PASS當產品PASS |
| T06 | CL SV21/22/23/34/35；MR同值 | 0/28/33/88/100%，MR无资格，保证仍旧R |
| T07 | MR HLD17/18/19/29/30与CL同值／缺HLD | 0/28/32/72/100%，CL/缺值无资格；HLD简化不得叫HP |
| T08 | HLD20 W8无reliefWins | 仅HLD=20，**不计算HP28/23、不新增救援字段**，正式HP测试DEFERRED |
| T09 | 全休/二军/MiLB/CORP/IND | 不发新四league赏；旧IND外围R不被新return删；其他原路径不变 |
| T10 | 非有限/负W/L/SO/IP/ERA，缺字段 | 新赏相关资格无效，不误吞合法旧槽，诊断不修改st |
| T11 | P02短IP ERA1.0；P04低W高WP；P08不合Q但高score | 先资格不发，不越过最低工作量／胜投 |
| T12 | 原有效W+L+SV+HLD≤G边界 | 只读最终st、不为获奖修成绩或重normalize，数值不变 |
| T13 | 同2035NPB P01/P02/P03 awarded=true | P07/history/pitcherTC各一次，**年度MVP必有一筆**，新增主R0 |
| T14 | 三指标达basic但P03draw失败 | 无P07、无保证MVP（原MVP中则正常有） |
| T15 | P01/P02在2035、P03在2036 | 不跨年组合 |
| T16 | NPB P01+KBO P02/P03同年 | 不跨league组合 |
| T17 | 年奖重复回调/画面重画/已完成receipt | 所有draw/荣誉/付款/下一年单次，无改u |
| T18 | 后年同league三冠、另league三冠 | 新年度history一笔；首次新league解放；MVP各年度一次 |
| T19 | 同年结果确认后合同转league | decision仍旧赛季league/year，非salaryYear/新org |
| T20 | 同年多赏资格 | 无互斥；P05仅CL/P06仅MR，不能造同季两角色以强取两奖 |
| T21 | 旧honors含2030NPB最優秀投手、旧最多奪三振 | 原文/待遇保留，不补P02/P08/P07/MVP |
| T22 | 同义旧新部門同year/league重覆 | 单语义一次计分/显示不破坏；旧大赏和P02不得去重成同一奖 |
| T23 | 旧pitcherTC=true/history缺 | 保留、无架空奖/league/额外效果 |
| T24 | 空honors/未知旧名/league | 无例外，无推测奖或分数 |
| T25 | 同数据旧legacy与新P02 | 旧.75/2/460aceN、新.35/1/160king；FULL条款不变 |
| T26 | P04/P07/MVP、已签固定salary schedule | P04部門、P07零分、MVP正常；已有保障不减，年度FULL最多一次 |
| T27 | 三冠原MVP无資格/失败；age23/24/35/已oldghost | 必补MVP，按原年龄/league解trait；不新增不合資格的MVP主槽 |
| T28 | 独立key同/不同year/league/id，PATCH変更 | 同key完全同u，PATCH不改，算法向量技术定稿后exact |
| T29 | 每个旧奖资格basic/god/不合格，主R值记录 | 旧slot列same，100耗R，未资格0R，P01/04/08无主R |
| T30 | P通常/省エネ/全力+IF生涯基准完全SHA | 同输入旧draw序列相容，award/P02待遇/MVP因果差异明确；IF原规则不变；不能只比总R |
| T31 | 1280/320/390、长league与八赏 | 卡片/履历/引退/共享不截断，取得后仅名字，读画面主R0 |
| T32 | 重复导航/快速点选/分享seed | listener/session正常，无重判，seed-only，console及JS/CSS4040 |
| T33 | NPB/KBO正式名、CPBL/MLB简化HLD | 不称真实HP/NPC排名独占；不擅增CPBL/MLB P04 |
| T34 | 打者同/不同year/league及重覆三冠 | 原hitterTC/MVP guarantee/抽選序/traits保持，投手不进打者分支 |
| T35 | 三冠+低能力且goodReal=false | 由**保证MVP现有护栏**保留，非新增P07额外计分；仅P08须按effect决议测，不顺便改旧regex |
| T36 | 每个component0/50/100，S1/2/3加权手算 | sumweights1，总分手算一致；ERA方向正确、score不是五项原值和 |
| T37 | 五指标锚点下/上、ERA负值/NaN/IP极端、L0/0分母 | 有效极值clamp、无效拒、0败合法WP1、0/0无评分，st不写 |
| T38 | NPB SP得分100但W/IP不足／非SP | 资格失败不奖、不以分数越界、独立主R0 |
| T39 | P08分数b−ε/b/一般/g，u使一般失败 | 无奖/基本机率/提高/保证；失败允许从缺、不重抽 |
| T40 | 同NPB SP P02主draw成功、P08独立成功/失败 | 可同年两賞或只P02，各别语义，不共享结果或保底 |
| T41 | KBO/CPBL/MLB一军及NPB2、MR/CL | 不能取得P08，不按资料label当NPB1 |
| T42 | P02旧ERA已采u，P08调用次数计数 | P02=旧结果；P08独立不复用u、不新增R、旧slotexact |
| T43 | P07成立+原MVPdraw true/false/no-slot | 三条都MVP恰一筆，旧有slot照抽、无slot不补R |
| T44 | fault在honors/trait/付款/render后再试 | journal复用、MVP/phoenix pool8/收入一次，合同ID不变，正常下一年 |
| T45 | 旧最優秀投手及未知历史年月 | 原名/大賞460aceN/.75/2保留、不改沢村/ERA、不造历史 |
| T46 | 新P02各league全正式名 | 部門160king/.35/1/TITLE FULL，不延续legacy460 |
| T47 | 同seed/choices/run两次与旧基准逐步比较 | 新版完整S/key/u/R重播same；旧版只允已批准因果差异并定位首次分歧 |
| T48 | PC1280/320/390、旧大賞+P02+P08+P07/MVP | 成就名/年度/league可读、无重复/溢出、分享图不裁、0错误/404 |
| T49 | 投手非三冠原MVP及打者三冠所有边界 | 原MVP资格/p/draw不变；打者保證仍有，无新P08/04污染IF |
| T50 | P01/02/03/04/07/08/MVP同年有效receipt | 六部門各自，P07零分，MVP一笔；市场cap1.5/fallback3、出来高不超一次annualMax；HOF按语义各一次 |

T36推導版演算例（非自然人生）：W14/L6→WP=.70、ERA2.70、IP146.5、SO185，对应component W40/ERA50/IP50/SO50/WP25；S1=43、S2=46、S3=46.25。不把原W10/ERA3.5/IP130的旧演算当新score50。T50实际所有条件须满足最终参数与W/L/G物理关系，不能编造角色凑绿；新增T38边界NPB12胜无资格、13胜不足score仍不得保证。

T01～35未删除，但互斥M0、D-KEEP与HP实作expected已修订；T08成为延期无造字段验证，T02明确IP150，T05以批准minW不再写B率为正式。T36～50全新增未运行。未来L3原生→Quick→定稿Full/P及IF固定seed/S/R逐步→PC/mobile/Preview，工具缺失写BLOCKED；CI不自动改。无大规模自然采样授权。

## 9. 架构范围／阻挡事项／停止

后续小模块候选award-policy/identity/draw加game.awards编排、trait-policypitcherTC、salary-evaluation/promotion/incentive/HOFadapter与UI现有消费端；不新增排名引擎、HP数据、途中保存、旧engine、全面cloneS、大拆game.js。正式实作另需明确批准、版本按AGENTS评估（本次VERSION不变）。

BLOCKER（產品技術與授權）：P08資格、IP180、原S3權重、基本60、B2起始10%／斜率2.5／非保證上限95%及G95均已APPROVED / DESIGN_ONLY，見[第13節](#p08-approved-design)。P08phoenix／當年度降格保護也已批准，見[第14節](#pitcher-awards-technical-review)，不再列政策BLOCKER。AF01～AF08已批准精度／H1與向量／限定Journal與Receipt／續行及adapter設計，見[第14.13節](#d2-technical-approved)；替代取整方案未納入，產品接入與Runtime驗收未完成。產品實作與正式發布仍須另行授權。P01/P04的CURVE_B及P04 NPB12/KBO10/.650/.850已設計批准，見[第4.2.2節](#p01-p04-approved-design)，不再將其數值或曲線列為待決。

养成问题不拿奖阈值掩盖：第二轮NPB SP367季只有中上q、无q≥66，Wmax12；第三轮MLB SP14季/5人maxW8。支持现策略资格稀少，不证明自然顶尖不可達／公式Bug。後續先審目标稀有度、点数/TJ/工作量证据，不动原四奖资格。

完整數值明细见[平衡分析](PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md)，逐决策状态见[決策紀錄](PITCHER_AWARDS_D2_DECISION_LOG.md)。本次仅文档/离线衍生数据；D1、四轮原始资料、已有测试与正式文件保持，游戏/主R/VERSION/main未改，无Commit/Push/部署。完成即停止等审查。

## 10. D2自我審查與實際文件檢查

本次新產物共5檔：本主設計、BALANCE_ANALYSIS、DECISION_LOG、D2_ANALYSIS.json、pitcher-awards-d2-analysis.mjs。其餘文件不改。

- `node --check docs/designs/pitcher-awards-d2-analysis.mjs`：語法檢查通過。
- `node docs/designs/pitcher-awards-d2-analysis.mjs`：離線完成，約3.42秒（含語法入口的首次命令壁鐘）；48組原生分布、48組P01、24組固定minW P04、36組P08模型×格×輪次。四輪careers來源SHA256與D1記錄相同；619既有tracked檔加D1四檔/難度審查二檔，共625受保護輸入執行前後SHA256一致。
- Markdown本地鏈接20項、T01～T50設計ID唯一及連續、P04只NPB13/KBO10、JSON組數檢查通過。初次文件檢查命令誤把T01當T1而失敗；修正檢查器補零後通過，文件ID未改以掩蓋問題。這是文件工具錯誤，不是遊戲測試FAIL。
- `git diff --check`與tracked diff檢查：未修改既有追蹤檔；HEAD/main ref不變。沒有跑新生涯、独立draw抽签、游戏Quick/Full、PC/手機E2E或CI/Preview，因本次純設計、不改遊戲。不能把以上分析檢查PASS寫成T01～T50遊戲PASS。

15項審查結果：①八項批准制度完整；②新數值均NOT APPROVED；③P02/P08分離；④舊大賞不追溯；⑤HLD不稱HP；⑥CPBL/MLBP04排除；⑦P08只NPB1SP；⑧M1保證MVP無M0；⑨MVP單語義receipt；⑩舊槽依原資格、100仍耗R；⑪薪資/HOF/出来高/trait/movement列映射及BL-P08-EFFECT；⑫演算fixture與自然樣本明示分離；⑬季/Seed各列；⑭所有遊戲案例PLANNED；⑮NUM-P01/P04/P08仍TBD。這是文件一致性審查，不證明未来journal实现无Bug；fault injection能力與完整S/R比較必须後續實作再驗。

### 門檻錨點修訂後的檢查

最新指示已更新同5檔；分析另產生有效推導P01 16列、P04 8列、P08 12列，原48/24/36列保留為歷史敏感性而非遊戲配置。現行ERA/SO常數以來源文字讀取驗證，沒有執行引擎；本次腳本語法、625受保護輸入雜湊及舊四輪來源SHA一致。推導值未低於初版B防降線，P02額外IP150、原SO四league、CL SV22/35、MR HLD18/30完全不動。

最新版新數字是設計推導基準而非現行正式政策；不是「因沒樣本而降低」。P08有效资格为0，连第一轮历史资料也未达全部入口，不补造奖或把0当Bug；第四轮NPB SP n0另标无样本。仍不执行游戏测试/新Seed/commit/push，权重/基础score及曲线的非唯一性明记TBD。

## 11. D2.1 實測證據整合與沢村賞候選修訂（歷史模型：HISTORICAL / SUPERSEDED）

> 本節保留定案前證據整合、模型比較與當時建議。自然資料及手機證據的分類/限制仍有效，但IP150/190、G100和「所有模型未批准」不代表目前狀態。最新選定IP180／原S3／G95為APPROVED / DESIGN_ONLY，見[第13節](#p08-approved-design)；低分機率及精度仍PROPOSAL，實作仍BLOCKER。

2026-10-13。新增審查章節，不覆寫上述D2歷史計算與原分析JSON。D2.1是文件版次，不是遊戲VERSION。完整可重現計算、前後候選比較、人工球季與測試見[模型比較](../reviews/PITCHER_AWARDS_D21_MODEL_COMPARISON.md)及[JSON](../reviews/pitcher-awards-d21/analysis.json)。任何新模型數值皆PROPOSAL，沒有替換產品或成為APPROVED。

### 11.1 證據核對與可達性

`RESEARCH_REPORT(1).md`已由使用者確認指向[八條自然生涯報告](../reviews/pitcher-d2-two-seed-natural/RESEARCH_REPORT.md)，不建立重複報告。原資料/trace俱全，8生涯正常退休，8組儲存重播的完整S、choices、study、全部R值/次數深比較一致；本次只離線核對artifact，不新增生涯或冒稱重跑瀏覽器。

受驗資料基準0fd13c7532fd03da136c72ef64e9890858cfb81e／1.11.9。CPBL三項候選基本同年合格tob0ilu0 8季/q77bi1jx 8季；KBO 1/5季；NPB目標24有效一軍季、SP22季無P08基本資格；MLBtob沒有目標樣本，q有8SP季未達標。這些是離線門檻判定，不是P01/P07/P08已在產品得獎；CPBL/KBO不代表NPB/MLB，8路線只有2個獨立Seed。

新增MANUAL_MOBILE_EVIDENCE／VERSION_1.10.3／SEED_q77bi1jx：[手機原圖](../reviews/pitcher-awards-d21/mobile-q77bi1jx-1.10.3.jpg)。2039 NPB1、SP由使用者明確確認（USER_CONFIRMED_2039_SP；不是退休角色回填），G26/W15/L7/IP180.1/SO165/ERA2.35、WP15/22；五項及L非負有限、W+L>0、有效一軍且SP，符合P08 W13/IP143/ERA3.2入口。沒有完整能力/操作/RNG，不能當1.11.9再現性或新獎實作PASS。截圖ERA為顯示丸め值、IP按十進位，分數標display-based estimate，不造ER或出局數。

NPB高成績有實玩證據，與新版兩條路線未達不矛盾；版本及實際選擇不同，不能推論頂尖不可達。維持P01～P08基本資格/門檻，不降數字、不改養成/RNG。舊最優秀投手賞honors不等P08，三項數值基本達標不等三冠實得。

### 11.2 定案前公式與狀態（模型：HISTORICAL / SUPERSEDED）

- HISTORICAL / SUPERSEDED（當時CURRENT PROPOSAL）：§4.3的W12→17、ERA3.2→2.2、IP143→150、SO155→215、WP.65→.85，各component線性clamp0–100；S1 20/20/20/20/20、S2 15/30/30/15/10、S3 25/30/25/15/5不變。最新選定IP180／原S3／G95見[第13節](#p08-approved-design)。
- 基本入口NPB1/SP/G>0/IP>0、W≥13/IP≥143/ERA≤3.2、五項與L有效、分母>0，不要求SO/WP各過单項賞基本；未達入口p0。基本分55、保證100、一般p=clamp(30+2(score−55),30,95)%仍PROPOSAL；不是使用者已批准機率。
- SUPERSEDED：舊Q_A/B/C和自由寬鬆錨點，只保存歷史敏感性，不混入D2.1。
- APPROVED：五項、可從缺、NPB一軍、原賞資格與主槽、P07同年同聯盟實得三項必MVP、P08不屬三冠且不自動MVP。新賞獨立固定draw，不共用P02结果；本次不實際抽獎。
- APPROVED補明：四聯盟皆停止新發舊最優秀投手賞，P02承接各原ERA/IP主槽與抽選；P08只NPB。其他聯盟不新增沢村，不保持新發舊大獎，也不破壞舊honors原名/待遇。該議題已關閉，不列OPEN。

### 11.3 IP飽和與保證候選（HISTORICAL / SUPERSEDED）

> 以下IP150/G100比較公式及IP190建議為歷史研究，非選定設計；目前IP180滿分與合格總分≥95保證見[第13節](#p08-approved-design)。保留原比較數字以追溯取捨。

D2 IP150滿分，143=0；150/160/170/180/190/200均100，確實無法分辨180與200。這是模型數學事實，不證明設計必錯。候選保留入口143與其他四尺度/原權重，將IP滿分延至180、190、200，比較不同梯度；同季分數不增，但不改名義IP權重。190參考既存高能力中心公式情境，200近基礎極端，不是自然分位或現實必要標準，沒有為手機單例調參。

正權重且component均≤100，因此總分100需五項全滿；在人工均衡頂尖例可算100，但自然樣本不能證明可穩定達成。一項極端已封頂，不能補另一項略弱。候選另比較保證95、90、以及總分≥90且至少四component≥80；95容許小幅弱項，90較寬鬆、附加四強項較能解釋均衡但多一段離散條件。全部PROPOSAL，不自行設定最終保證線。基本55及機率原曲線作控制不改；降保證線會在該點升至100%，需審核跳點與稀有度。

歷史建議（HISTORICAL / SUPERSEDED）：優先建議審IP190/S3，保證95作討論候選；自然合格樣本仍不足，因此不推薦現階段直接定案95或撤銷原100。保留150/100對照及S1/S2/S3原結果以可追溯，新候選各有固定ID，不覆寫舊模型。此建議已由使用者定案取代，現選定設計見[第13節](#p08-approved-design)。

### 11.4 2039案例：基本資格不等保證獲獎（HISTORICAL模型比較）

> 以下保留舊D2與IP190候選的離線分數，不重算實玩紀錄。選定IP180／原S3／G95的2039估算見[第13節](#p08-approved-design)。

D2 component W60/ERA85/IP100/SO16.6667/WP15.9091；S1=55.5152、S2=68.5909、S3=68.7955，原候選p約31.0303%/57.1818%/57.5909%，均不保證。

IP190候選只改IP component為78.9362；S1=51.3024（仍符合基本資格，但未到基本評分55，p0）、S2=62.2718（p44.5435%）、S3=63.5295（p47.0590%），均不保證。這些是顯示值離線估算，不是實得結果；不能為讓2039保證获獎反調模型。

### 11.5 驗證、精度與修改範圍

新增小型離線工具讀取四輪及8路線原始資料，不import遊戲、抽R或寫回資料。測試上下界、五項單調性、ERA方向、55/保證線、資格反例、極端/缺失/非法/0分母、0敗、十進位IP。合成球季標SYNTHETIC_SCENARIO，連續W僅用數學邊界測試，不稱合法自然生涯。

首次數學55重組略低的浮點誤差導致工具測試FAIL，分析端明加1e-10端點容差，仍測55±1e-7反例、不修改預期或產品。產品取整/精度方案仍TBD；ERA顯示丸め敏感性另列。離線實際PASS數與耗時見JSON，不把它當T01～T50產品驗收；Quick/Full/CI/Preview/新採樣NOT_RUN。本任務不改产品、CURRENT_SPEC/BACKLOG/VERSION/CHANGELOG或平行工作，不Commit/Push/部署，完成停止等待審查。

## 12. D2.1 三項參數批准節點（HISTORICAL：B2批准前）

> IP180、原S3及G95仍有效；本節當時「基本55/機率待批」已由B2取代，僅保留當時數值與限制。最新設計見[CURRENT APPROVED DESIGN](#p08-approved-design)。

使用者已批准IP滿分180、沿用既有S3、合格總分≥95保證。本次指令曾列W20/SO20，但使用者釐清「沿用既有」：最終W25/ERA30/IP25/SO15/WP5，不是20/30/25/20/5。既有A01～A09保持，不重新表決。只有這三項設計参数批准，不授權產品實作。

令 `component(x;lo,hi)=100×clamp((x−lo)/(hi−lo),0,1)`：

- W_SCORE：12→17。
- ERA_SCORE：3.20→2.20；分母−1，ERA越低越高。
- IP_SCORE：`100×clamp((IP−143)/37,0,1)`，180滿分，不是基本資格180。
- SO_SCORE：155→215。
- WPCT_SCORE：.650→.850，其中WPCT=W/(W+L)。
- `score=.25×W_SCORE+.30×ERA_SCORE+.25×IP_SCORE+.15×SO_SCORE+.05×WPCT_SCORE`，範圍0～100。

先有效NPB1/SP/G>0/IP>0、W≥13/IP≥143/ERA≤3.20、必要G/W/L/IP/SO/ERA有限非負且W+L>0；不合資格任何分數都不發。合格且總分≥95保證，不要求各component≥95，也不強加四項≥80條件；低於95的基本評分與機率尚未批准，可從缺。不得將55、30+2(score−55)、95%上限或任何浮點容差標APPROVED。

IP143/150/160/170/180/190/200分別0/18.9189/45.9459/72.9730/100/100/100。2039手機案例OFFLINE_ESTIMATE仍68.7955，符合入口但未保證；沿舊未批准曲線試算57.5909%，非新獎實得。版本1.10.3、SP為使用者確認、沒有選擇/成長/RNG記錄等限制保持。

原模型/敏感性保留HISTORICAL，JSON明指定[selectedDesign](../reviews/pitcher-awards-d21/analysis.json)與[新計算](../reviews/pitcher-awards-d21/selected-design-analysis.json)，不覆寫實玩原數。新版自然頂尖平衡仍UNVERIFIED；產品實作BLOCKER。離線57項PASS/0FAIL及95下/等/上、單調/非法/十進位IP檢查见[可重現驗證](../reviews/pitcher-awards-d21/SELECTED_DESIGN_VALIDATION.md)；原274項是前輪歷史結果，未冒稱本輪重新跑產品。

四聯盟停止新發舊最優秀投手、P02原ERA/IP槽/資格/概率/保底、P08僅NPB且可與P02獨立得獎、P07同年同league實得三項保證MVP、舊獎原名/大獎待遇與其他基本門檻都不改。沒有修改產品/JS/HTML/CSS、VERSION/CHANGELOG/CURRENT_SPEC/BACKLOG/main，沒有新採樣或Commit/Push/Merge/Deploy；平行修改保持。

<a id="p08-approved-design"></a>

## 13. CURRENT APPROVED DESIGN：P08 IP180／原S3／B2／G95

**APPROVED / DESIGN_ONLY。這是唯一最新批准參數入口，不是產品實作授權。** §4.3/11/12的IP150、IP190、G100、基本55、30+2(score−55)與舊推薦/待批狀態為HISTORICAL / SUPERSEDED。歷史紀錄及分析完整保留。

先判資格：NPB一軍SP，W≥13、IP≥143、ERA≤3.20、G>0，必要G/W/L/IP/SO/ERA有效有限非負、W+L>0。資格不變，不因B2放寬；不合格即使高分也不能獲獎。IP保存與運算沿十進位，不改為outs。

每component為100×clamp((x−low)/(high−low),0,1)：W12→17、ERA3.20→2.20（低ERA較高分）、IP143→180、SO155→215、WPCT.650→.850（W/(W+L)）。總分=.25W_SCORE+.30ERA_SCORE+.25IP_SCORE+.15SO_SCORE+.05WPCT_SCORE，0～100；原S3不是20/30/25/20/5，IP180是滿分位置不是基本資格。

**B2已批准**：不合格p0；合格score<60 p0；60≤score<95時 `pPercent=min(95,10+2.5×(score−60))`；score≥95 p100。基本60、起始10%、每分+2.5百分點、非保證上限95%、保證95全部APPROVED / DESIGN_ONLY。60的10%跳點與95的100%跳點為預期，不平滑化，允許從缺；總分95不是各component皆95。

與[分階段實作計畫§2](../../tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md)一致：`min(95, 10 + 2.5 × (score − 60))`僅用於合格且`60 ≤ score < 95`；score≥95直接100%，不套用95%上限。本次只補文件一致性，不修改任何已批准參數。

以未取整內部值計算score/p作設計基準。AF02已批准binary64固定順序、嚴格比較、無epsilon、不使用顯示取整值；分析assert的1e-10不是產品容差，替代整數化未納入。AF01～AF08技術定案見[第14.13節](#d2-technical-approved)；產品Runtime未驗證，AF09實作與發布未授權。P08phoenix／當年度降格保護的政策已APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED，見[第14節](#pitcher-awards-technical-review)；技術設計已批准，產品接入與Runtime驗收仍未完成，不重新詢問是否新增。

手機1.10.3/q77bi1jx/2039 NPB1 SP（使用者確認）G26/W15/L7/IP180.1/SO165/ERA2.35：component60/85/100/16.6667/15.9091，合格score68.7954545455，B2 p31.98863636%，不保證。標MANUAL_MOBILE_EVIDENCE / OFFLINE_ESTIMATE，ERA為顯示丸め值，沒有成長/選擇/RNG，不當新獎實得、1.11.9重播PASS或自然平衡證據。57.5909%是歷史舊曲線比較。

[B2離線結果](../reviews/pitcher-awards-d21/b2-final-analysis.json)70 PASS/0 FAIL；[驗證入口](../reviews/pitcher-awards-d21/b2-final.mjs)只讀原研究與原trace，不執行RNG/遊戲、不新採樣。原八條/八儲存重播證據分類不變，主RNG產品相容性NOT_RUN，不能將未消耗主R誤稱已驗證未來產品序列。無產品Quick/Full/CI/Preview。

A01～A09、四聯盟停止新發舊最優秀投手/P02原ERA-IP主槽與原資格/概率/保底、P08仅NPB可與P02獨立得獎、P07同年同league實得P01/02/03必MVP、舊honors原名/大獎待遇、P08薪資/HOF大獎級以及P01～P07既有設計全部保持。產品實作未授權、VERSION/CHANGELOG/main未改、平行COPY-01-P1/TRAIT-SMALLSCHOOL-C工作保持，不Commit/Push/Merge/Deploy。

<a id="pitcher-awards-technical-review"></a>

## 14. P01～P08 產品實作前技術審查與P08特殊保護定案

> 新增現行日文獎名漏判BLOCKER：[第14.11節](#legacy-award-name-blockers)。分開處理復活與降格，不將沢村未實作風險稱為現行已發生案例；未授權產品修正。

2026-10-14，ANALYSIS_ONLY / DESIGN_ONLY。dev HEAD `7220ad82002801d3dea5fedae80d0fb3d7a0433f`，VERSION1.12.0。只讀檢查原生程式，不呼叫遊戲、不抽R、不新增自然生涯。VERIFIED僅表示已查明程式與靜態呼叫證據，**不是產品驗收PASS**。本節技術建議全為PROPOSAL，未自行批准hash、精度或交易實作。

### 14.1 APPROVED：P08-PHOENIX-DEMOTION-PROTECTION

APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED。使用者明確确认以下最小範圍：

- **phoenix**：在取得P08的當下，只有glass=true且phoenix=false才移除glass、取得phoenix、能力點pool＋8；生涯一次，不是每次沢村賞＋8，也不是所有得主無條件取得。多項大獎/MVP同季觸發只一次。旗標沿現行S.traits.phoenix；不新增第二套復活特性。
- **降格保護**：只保護P08獲獎當年度movement中的降格／戰力外判定，下一年無新P08即不因過去P08繼續保護；不永久抗降格、不保證續約、不免退休，不跳過所有合約流程。
- 保護批准不等永遠免傷。現行傷病函式依glass/iron等判定，沒有phoenix永久抗傷倍率；往後若原流程再取得glass，沿原規則處理，已取得phoenix不再＋8。本案不額外新增免傷/免glass政策。
- 沿原big條件 OR 精確當年P08決策，沿原wonAward條件 OR 精確當年P08決策。不廣泛修正舊中文regex，不新增P01～P06抗降格，不改歷史旧最優秀投手賞的實際待遇。P08與P02獨立，P07依已批准MVP流程受既有保護。
- BL-P08-EFFECT的「是否新增」政策待決已SUPERSEDED；未完成的是接入與故障驗收，不將其標為產品完成。

### 14.2 現行架構與證據（VERIFIED）

本節行號對應上述完整HEAD。所有來源均為相對連結：

- [game.js](../src/engine/game.js):42–53：初始化SEED、seedInit/_s/R與chance；R為32位狀態，回傳[0,1)，chance(p)=R()*100<p。即使p100仍耗主R；未進資格分支則不抽。
- game.js:1269–1352 proSeason：simSeason→事件/全力等既有補正→累計stats/byLevel、log→awards→recordSalaryEvaluation→captureSeasonChampionship→TJ→demotionAudit→tradeCheck→國際→nextStep。獎項失敗若重跑整個proSeason會重算成績/累計，不只重抽獎；禁止把whole proSeason當安全重試入口。
- game.js:1355–1474 awards：top且seasonFactor非0；AS→條件rookie→原ERA賞→CL/SV→MR/HLD→SO→MVP→awardTraitUnlocks→年間賞card→yips解除→phoenix。原榮譽直接h.push、AS++，沒有完整award journal，且card在phoenix前可能throw。
- game.js:1386–1408：P02承接舊ERA結果；P05 CL SV22/35；P06 MR HLD18/30；P03 SO按聯盟原線。原slot次序**P02、P05、P06、P03**，不是依P-ID排序抽。P02/03原round與P05/06公式見§4.1，不替換。
- [trait-policy.js](../src/engine/trait-policy.js):55–75 awardTraitUnlocks：打者同年league精確三項→hitterTC/MVP/history；原MVP的strongpitch/stronghit及oldghost資格。投手P07尚無producer，DEFERRED_TRAITS:6仍含pitcherTC，未實作不得宣稱現有可得。
- game.js:1467–1471 phoenix只在glass&&!phoenix且當年big文字中觸發，pool+=8；263–265 removeTrait會更新removed及presentation；417–419傷病看glass。phoenix為持續保留的取得旗標，不是年度薪資/降格旗標。
- game.js:1602–1627 movement的wonAward只當年honors前綴、匹配王/MVP/舊中文字；日文沢村不匹配澤村。命中則跳過兩個降格分支；goodReal是另一個實成績護欄，不能混為P08保護。覆寫movement:3132仍委派LEGACY.movement（來源2678 LEGACY捕捉），這段是活動路線，不可視舊不可達。
- game.js:1153–1169 demotionAudit是先前拒絕降格後的契約/給料泥棒評價，不是wonAward的保護點；P08不取消這項或後續tradeCheck/合同到期流程。
- game.js:2808–2817 recordSalaryEvaluation讀最終honors；[salary-evaluation-policy.js](../src/engine/salary-evaluation-policy.js):56–75賞分.75/.35等、cap1.5、同年替換只留3年市場評價（不是全生涯薪資決定履歷）。[salary-promotion-policy.js](../src/engine/salary-promotion-policy.js):110–122 fallback大獎2、部門1、總cap3。
- [incentive-policy.js](../src/engine/incentive-policy.js):10–34：旧名分級、沢村已SAWAMURA/FULL；年度receipt yearlyIncentivePaid按year，applyIncentivePayment回傳新state，需要呼叫者提交。P04正式名/新P03不能假設現regex可辨認。
- [hall-of-fame-policy.js](../src/engine/hall-of-fame-policy.js):15–68：old best pitcher460/aceN、MVP420、department160/king；沒有沢村分支，department endsWith舊名。game.js:2043–2056 tierOf以aceN/MVP保底スター、king保底レギュラー。新adapter接入必須保留這些已批准數值。
- game.js:3105–3132 active phaseEnd/settlePhaseEnd有CORP私有年度receipt；PRO有seasonEndContext及paid/year防護、冠軍結算、薪資與出来高。 [contract-policy.js](../src/engine/contract-policy.js):28–34以annualSchedule.paid防重付；**不是award交易receipt，也不足證明全流程故障恢復**。
- [choice-action.js](../src/ui/choice-action.js):26–57 token防重入/過期，例外復原DOM但不回滾S或主R。listener防護不能替代遊戲側transaction。錯誤後再次點選仍需從已提交階段續行。
- honors為字串，累計stats/byLevel与log.st有W/L/HLD；沒有reliefWins/HP/全域球員ID或可靠跨聯盟分段。現行無生涯途中存檔，display localStorage非球員保存。

### 14.3 A：RNG／Seed方案（TECH REVIEW REQUIRED）

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

**PROPOSAL推薦：同步固定32位hash＋明確序列化＋固定向量。** 初始化實際SEED、整數year、四bucket leagueKey、穩定awardId、固定ruleId，UTF-8以TextEncoder編码，各欄用byte length（非JS字串長度）分段，例如4-byte unsigned big-endian長度＋內容；domain含pitcher-award-v1。固定欄位順序，不使用JSON物件遍歷次序。孤立surrogate的編碼/拒絕政策須固定測試，不能默默換SEED正規化。

候選算法：FNV-1a-32逐byte XOR/Math.imul，接固定32位avalanche（xor>>>16、imul 0x85ebca6b、xor>>>13、imul 0xc2b2ae35、xor>>>16、>>>0），u=hash/2^32。演算法常數及向量此處**僅提案，未實作或執行**。hash碰撞可能，非密碼學安全；不同key不保證統計獨立，不能把P07乘積當證明。

替代：SHA-256固定UTF-8輸入取前32/53bit。优點是成熟hash、碰撞風險較低；缺點是Web Crypto非同步會改變現同步決策架構，browser/Node接口不同；純同步sha实现增加程式/維護。另一替代專用PRNG只由awardKey初始化且一次取值，無主R消耗但多算法/狀態容易誤用。推薦同步hash以少改呼叫流程，仍需使用者批准算法、向量與精度方案，不先上線。

P01/P04/P08在所有legacy draws記妥後、honors/effects提交前計算；同key只一次decision。未資格p0與保證p100可以直接決策，不接主R。P07完全依實得P01/02/03，不抽；原MVPslot照原資格/順序取一次，P07必要時補同一MVP語義。
PATCH不放key；ruleId只在真正獎項規則變更且另批准後變，當年已完成decision不因改版重抽。私有journal綁S實例；同seed新人生重播應同key結果，不把不穩定name/team當playerID。未來多球員同seed系統需另設身份，現單人S身份夠辨識交易，hash不擅加隨機UUID。

**UNVERIFIED**：hash分布、跨環境向量及產品主R相容。固定相同年度输入可保持原槽；新獎待遇/phoenix清除glass/點數及當季降格短路會改後續R分支，不能承諾完整人生總R不變。未批准無關直接抽選或公式變動。

### 14.4 B：Decision Journal／Effect Receipt（PROPOSAL／BLOCKER）

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

推薦S實例WeakMap私有年度transaction，鍵S identity＋year＋frozen league；每decision鍵year/league/awardId/ruleId，狀態PREPARED→DRAWING→DECIDED→HONORS_COMMITTED→EFFECTS_COMMITTED→RENDERED→CONTINUED。S.awardDecisions只存已確定結果、指標快照/資格/p/drawSource/固定key/ruleId，不存完整S或途中save。

Journal記錄AS/rookie/P02/P05/P06/P03/MVP的每個**實際有資格**slot及u/p/outcome，draw取值後先記journal，禁止其間card/await/可throw callback；p100原槽仍照抽。不改R/_s，也不rollback已耗主R。需要把原chance一次R與decision journal同步鄰接提交；任意語句之間的throw/OOM/代理setter並無數據庫原子保障，不能用WeakMap口頭聲稱完全atomic。

effects收據細分honors/history、AS、MVP traits/yips、phoenix、salaryEvaluation、salaryPayment/incentive、movement/continue。先prepare每項合法值，提交時無render/await/外部hook，紀錄phase後才UI。phoenix要同批提交glass=false/removed/phoenix=true/pool=原值+8，不能先置phoenix=true後throw漏掉8；也不能＋8後只靠最後completed防重。部分狀態不可辨識時停止，不猜已付與否。

|故障點（皆待fault injection）|恢復提案|目前阻擋／驗收|
|---|---|---|
|原主R抽選後|已寫slot讀journal續下一slot，不重抽|取R與journal間隙未證明；任意間隙故障BLOCKER，不promise全恢復|
|新賞判定後|讀已保存u/p/outcome，不用最新S重算|固定key/rule輸入與決策須驗證；hash不是付款receipt|
|honors寫入後|精確year/league/ID查decision，補未提交effects|不可只由名稱存在認定已完成；多別名一語義一次|
|薪資效果後|evaluation同年upsert；以原schedule/incentive receipt確認已付，只續未付項|現phaseEnd過早context/paid return可能阻止後續步驟，需有可失敗fixture證明修復，不能重跑whole settle|
|phoenix／保護後|phoenix receipt重用，不重加pool；當年度保護為decision派生boolean，不堆counter|多欄位同步提交邊界未驗；畫面再失敗只重繪|
|年度完成前|逐phase續未完成render/choice/advance，completed僅在確實交接後|whole proSeason有累計、TJ等先行副作用；award journal不足保證跨年度續行|

**BLOCKER（靜態風險，非自然Bug重現）**：settlePhaseEnd:3129先設定seasonEndContext，再驗contract/pay；失敗後同state/year入口可能提前return。schedule paid後的任何后續失败也可能命中paid guard而漏續incentive/UI/下一步。現有PRO付款保護可防正常重付，但未證明有效故障恢復；不在本文件任務修遊戲。若未来要求涵蓋跨年度結算恢復，需獨立限定接入範圍批准，不能以「新增award receipt」暗中重構整年度。

只承諾未來**測試過的同步邊界**、同頁面同S保留journal的恢復；reload/分頁關閉/程序崩潰無生涯保存，不提供崩潰後恢復，也不新增save。舊無journal且已結算資料不重跑；無證據分不清未做/已做則UNKNOWN、停止重抽，不捏造receipt。

### 14.5 C：P08保護接入比較

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

推薦最小ID adapter：在awards既有big判定新增精確本年度P08 awarded decision；在LEGACY.movement的wonAward判定新增同一決策來源。舊regex原樣作OR fallback，保持旧honors实际行为；不將「大獎category」普遍套所有賞。S.traits.phoenix重用、不新增phoenixP08旗標；當年度保護直接從可信decision讀，不新增永久protected=true。

替代只在regex加沢村賞：改動小，但文字容易誤匹配、無decision可證年份/league，重試receipt仍缺；不推薦。替代新保護計數/期限旗標：有新遷移/失效責任、易延伸永久保護，超出批准，不採用。

同季P08＋MVP只一份phoenix receipt；後年再P08不＋8，但可保護該後年movement。P08未得則不新增保護，不表示其他原MVP/王/goodReal保護失效。旧最優秀投手沒有新發/重新映射，原honors/原保護仍按舊實際路徑。換team不作額外刷新次數；movement以**獲獎凍結year及league**對照當前context，跨聯盟場景資料不足不能泛化全球永久保護（需另外fixture審查，第一階段不新增跨league授權）。

### 14.6 D：穩定ID／相容適配

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

P01 PITCH_WINS、P02 PITCH_ERA、P03 PITCH_STRIKEOUTS、P04 PITCH_WIN_PCT、P05 PITCH_SAVES、P06 PITCH_RELIEF、P07 PITCH_TRIPLE_CROWN、P08 PITCH_SAWAMURA沿§4，不再另起IDs。P02 display最優秀防御率投手賞、P03最多三振奪取投手賞、P04勝率第一位投手賞；旧最多奪三振/最多セーブ/最優秀中継ぎ精確只讀alias至P03/05/06。legacy best pitcher專用ID不可映P02/P08。

推薦唯一解析adapter供HOF/薪資/incentive/UI與保護消費：受信decision優先、完整年度＋已知league＋完整名稱alias，避免substring自動猜。未知只顯示/diagnostic，**原未知honors舊效果也不能無授權整體刪掉**；過渡adapter範圍限本次新名稱，非所有既有消費端通用改寫。honors原字串保持不replace；同year/league/語義去重，P02＋P08是不同賞，各有待遇。
新P03官方名不含連續「最多奪三振」；P04正式名不match現TITLE regex；HOF department endsWith要求新P02/P05/P06也精確兼容。P08 HOF460/aceN需新映射，市場/出来高既已認沢村，不能再＋一次新人工現金。P07称号0分，保證MVP正常一次待遇。
DATA_GAP：舊字串無可靠playerId/role/league分段/receipt；不回填過去P07/P08、不補L、不以退休role猜季。新journal schema仍待批准，無儲存遷移產品實作授權。

### 14.7 E：精度與機率（TECH REVIEW REQUIRED）

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

推薦PROPOSAL：新賞pPercent全程binary64未取整，hash u32/2^32，先資格→p0拒絕／p100成功→中段u*100<p。不加epsilon、不轉顯示三位WP，明確固定運算順序。P01原整數W；P04先Number.isSafeInteger/finite/nonnegative驗W/L，分母須能安全計算（大sum可提BigInt有理數替代），raw W/(W+L)。
P08使用獎項當下最終st.era/st.IP（原十進位），不讀DOM toFixed、不改outs/IP，不用ER*9/IP重新覆蓋原era；五component按固定顺序clamp，加權依.25/.30/.25/.15/.05相同括號。不得把離線assert容差1e-10當產品資格容差。

優點：維持批准的未取整設計、同步低成本；風險：恰60/95附近binary64的最後bit需固定向量、u32有限格點可能有≤1/2^32離散概率偏差，不是連續理想完全精確。
替代A：整數概率基點/ppm再floor/round，跨環境簡單但改細粒度概率並可能挪跳點；取整方式須另批准。替代B：P04 rational用BigInt交叉比，精確.65=13/20、.85=17/20，可避極大sum及浮點線；但P08原浮點era/IP仍存在且工程成本高。替代C：epsilon容差/score顯示取整再比較，會改60與95門檻，**不推薦且未批准**。不足以安全定稿前標BLOCKER，不由分析測試自動批准。

跨環境固定向量計畫：Node指定版本、Chromium及實機Safari對相同UTF-8 key/hash/u32/component/score/p/result逐值比較；包含非ASCII長度、空/特殊Seed、原始SEED正規化、ruleId、awardId、分母0/缺失、60與95上下鄰值。NaN/Infinity/負數/非整數不抽、不造數。原主chance與原賞round完全保持；0/100的「直接決定」僅新賞，不刪原100主R槽。

### 14.8 F：實作批次與測試計畫（全 PLANNED / NOT_RUN）

推薦批次：①批准hash/precision/identity→純policy與向量；②原slot journal原生fixture→P02/03/05/06序列；③P01/04/08 decision＋honors adapter；④P07/MVP、traits/phoenix與movement精確接入；⑤salary/HOF/incentive adapter及transaction故障邊界；⑥確定碼Quick/Full、P/IF逐步固定seed、PC1280/320/390與Preview。每批需獨立授權後才能實作，不是本次開始工程。
交易journal不能等到最后才補；任何與原proSeason/phaseEnd安全續行相關變更先fixture證據，別混大重構。原T01～T50保留，本節補下列更精確技術情境。

|ID|目的／前置輸入|預期驗收|狀態|
|---|---|---|---|
|TR01|固定key與hash向量：ASCII/日文/分隔字元/UTF8長度、相同rule換PATCH|跨環境u32逐值一致；PATCH不變，非法encoding處理明定|PLANNED / NOT_RUN|
|TR02|原主槽全資格/不資格/保證、P SP/MR/CL、IF|AS/rookie/P02/P05/P06/P03/MVP每個R值/順序/數相同，新賞主R0|PLANNED / NOT_RUN|
|TR03|P01四league B−1/B/G−1/G，u比較邊界|0/20/曲線值/100，MLB跨度6，W無效拒|PLANNED / NOT_RUN|
|TR04|P0410個已指定W-L案例＋sum0/缺L/NaN/Infinity/unsafe|0/100/25/0/20/100；KBO0/25/75/100，raw ratio，CPBL/MLB無賞|PLANNED / NOT_RUN|
|TR05|P08資格反例及score59.999/60/60.001/94.999/95/95.001|資格優先、0/10/10.0025/95/100/100，合格零敗有效，不改P08W13|PLANNED / NOT_RUN|
|TR06|每個legacy槽R後、新draw後、honors後注入故障|只重用已journal結果，無AS/honors重增；無全S/R rollback|PLANNED / NOT_RUN|
|TR07|salary evaluation、base/incentive支付後、年度完成前fault|各receipt一次、零漏付/重付、未付年薪不計收入、正常下一年；不可提前return卡死|PLANNED / NOT_RUN|
|TR08|NPB1/SP實得P08，glass true/phoenix false，原pool=k|phoenix true/glass false/removed一筆/pool=k+8；render失敗重試結果不再＋8|PLANNED / NOT_RUN|
|TR09|未得P08、glass false、phoenix已true、同季P08＋MVP、多年再得P08|無資格不額外觸發；應觸發時只一份復活效果，生涯＋8一次|PLANNED / NOT_RUN|
|TR10|P08當年movement原降格條件成立、goodReal false、下一年無P08|當年跳過兩降格分支、下一年不因舊P08受保護；不免合同到期/退休/交易|PLANNED / NOT_RUN|
|TR11|同球員同年league P01/02/03=true；跨年/跨league/假基本達標反例|只有實得同年同league三冠；MVP原true/false/no slot皆恰一筆；pitcherTC一次|PLANNED / NOT_RUN|
|TR12|舊大賞、舊P03別名、新P02/04/08、unknown honor、舊已結算無journal|歷史原文/實際待遇不改、不補過去獎；P08HOF460/aceN，P02部門160/king，新名不漏|PLANNED / NOT_RUN|
|TR13|同seed/同操作2次、舊完整SHA對照、IF打者三冠|新版S/decision/history/R完全重播；舊差只獎及待遇因果；打者保持原流程|PLANNED / NOT_RUN|
|TR14|PC1280/320/390，長名年度卡/キャリア/引退PNG、重畫/連點|顯示讀取主R0、無重判/重付，console/JS-CSS4040；非實機PASS|PLANNED / NOT_RUN|

### 14.9 實作前阻擋與審查結論

> 技術候選／審查狀態：HISTORICAL / SUPERSEDED；既有政策與證據保留。AF01～AF08正式技術設計依[第14.13節](#d2-technical-approved)，產品Runtime未驗證、AF09未授權。不得把本節舊「待批」當作目前狀態。

**必須修正／批准（BLOCKER）**：TR-B01 hash編碼/算法與精度/向量正式審查；TR-B02逐slot journal及多欄位effect receipt原子邊界；TR-B03現phaseEnd上下游恢復範圍與失敗續行證據；TR-B04完整ID adapter避免新賞漏薪資/HOF/特殊保護/重付；TR-B05產品實作授權；另納入BUG-AWARD-PHOENIX-JP-01與BUG-AWARD-DEMOTION-JP-01現行獎名漏判（P1），詳[第14.11節](#legacy-award-name-blockers)，完整效果白名單/流程測試與獨立最小修正尚待審查授權。不得以P08新接入掩蓋現行缺陷，不重新問已批准數值/保護政策。
**建議修正（PROPOSAL）**：診斷decision phase/reason與未覆蓋故障顯式停止；配置ruleId獨立於PATCH；舊未知資料明確只讀相容與最小alias範圍。
**可以延後**：HP/reliefWins、子聯盟、全域多球員ID、新自然頂尖樣本、一般玩家得獎率驗證；不阻本次文件定案，但自然平衡仍UNVERIFIED。

六項總結：A原槽順序VERIFIED，hash PROPOSAL/UNVERIFIED；B部分支付guard VERIFIED，完整恢復BLOCKER；C觸發/期限VERIFIED且政策APPROVED，接入PROPOSAL/驗收NOT_RUN；D舊字串consumer VERIFIED，缺歷史鍵DATA_GAP，新adapter PROPOSAL；E原chance精度VERIFIED，新精度策略PROPOSAL/跨環境UNVERIFIED；F依賴與計畫已列，全產品測試PLANNED / NOT_RUN。沒有宣稱自然Bug重現或已修復產品。

+
<a id="legacy-award-name-blockers"></a>

### 14.11 新發現：日文獎名與舊中文效果比對不一致（納入D2技術BLOCKER）

> 最新既有[限定原生驗證](../reviews/AWARD_JP_NAME_LIMITED_VALIDATION.md)：兩BUG REPRODUCED / NOT_FIXED。下方早期靜態數據保留原歷史；AF07修正設計已批准，產品修復仍未授權，不改寫舊測試結果。

依使用者提供的兩張審查圖核對，基準仍為dev7220ad82002801d3dea5fedae80d0fb3d7a0433f／1.12.0。本節只整合問題，不授權修遊戲或追溯改舊honors。**VERIFIED：現行字串漏判與有效呼叫路線；UNVERIFIED：自然生涯具體受害Seed/操作、漏判造成的完整後果。** 不把未走到的自然失敗稱已重播。

- **BUG-AWARD-PHOENIX-JP-01／P1／必須修正（實作前BLOCKER）**：game.js:1467比對最佳投手／打擊王／全壘打王，但producer:1386/1413/1418等產生最優秀投手賞／首位打者／本塁打王。只取得這些對應日文賞、glass=true且phoenix=false時，該big判斷false，復活解除glass及pool＋8的條件漏判。若同年還有MVP/新人王可由另一分支觸發，不能稱每位得主必然少8點。
- **BUG-AWARD-DEMOTION-JP-01／P1／必須修正（實作前BLOCKER）**：game.js:1603比對最佳投手／金手套等舊字串，使最優秀投手賞、首位打者、ゴールデングラブ賞不命中獎項降格保護；本塁打王仍因「王」命中。overlay:3132仍呼叫2678捕捉的LEGACY.movement，所以這不是不可達舊程式；另有goodReal、perf等護欄，漏判不等一定降格。
- **P08 future integration risk**：沢村賞尚未在現行產品發放，沢村／澤村不一致是未來接入風險，不能與上兩項現行缺陷合併成「已有沢村得主受害」。其新增保護政策已批准，仍需精確ID接入與receipt驗收。

原生regex靜態核對結果（2026-10-14實際執行，純讀source，不執行遊戲/S/R）：

|現行日文榮譽|復活regex實際命中|降格regex實際命中|差異分類|
|---|---|---|---|
|年間MVP|是|是|原機制保持|
|新人王|是|是|原機制保持|
|最優秀投手賞|否|否|兩機制名稱漏判|
|首位打者|否|否|兩機制名稱漏判|
|本塁打王|否|是|僅復活漏判；降格依王命中|
|ゴールデングラブ賞|否|否|復活本來不在適用條件，不新增；降格金手套映射漏判|
|オールスターゲーム|否|否|非適用；應精確排除，中文明星賽排除不作日文政策依據|

14個文字匹配斷言＋1個LEGACY委派來源檢查PASS／0 FAIL。這是STATIC_EVIDENCE_ONLY，不是產品端到端測試、自然Seed重現或遊戲修復PASS。運用原regex匹配完整日文名稱即可重現本表，沒有人工修改S/能力或觸發付款。

#### 分開的效果白名單與修正提案（HISTORICAL；現行AF07設計見14.13.4／未實作）

不要用「全部獎項」或「全部大獎」同一集合控制兩種效果：

1. 復活候選映射：原MVP、新人王保持；最佳投手→最優秀投手賞、打擊王→首位打者、全壘打王→本塁打王；只補對應漏判，不加入ゴールデングラブ賞、All-Star、所有投手部門。P08依另已批准政策新增獨立精確ID；新P02不是舊最優秀投手賞，不因承接主R槽自動承接復活資格。
2. 降格候選映射：原有效獎項保持，明列已知日文個人賞及舊中文對應，精確排除All-Star；首位打者不靠「王」，金手套→ゴールデングラブ賞、最佳投手→最優秀投手賞。本塁打王/新人王/MVP既有命中不退化。哪些其餘部門屬保護不可從註解「個人タイトル」自行泛化；需決定完整白名單後實作。賽揚/澤村無現行producer，不憑空新增產品獎；P08單獨依已批准ID接入。
3. 保留兩機制原期限/觸發/效果與goodReal，receipt防重；只修辨識，不改獎項機率、成本、合同年限或最低薪。識別本身不額外耗R，但修正可能使pool/玻璃效果/降格chance被跳過而影響後續S/R，必須列出允許因果差異、取得實作授權後做L3回歸，不能以「文字修改」當零影響。
4. 舊honors保持原文，只讀adapter；不得追溯补8點/重發過去年薪/保障/特性，不將舊最優秀投手轉成P02或P08。是否對尚未結算的舊state恢復效果須明確界定，未知已處理狀態不猜。

此節**取代「中文比對殘留只列風險、无需獨立處理」的解讀**，不取代原「未批准不得修其他regex」的實作限制。新Bug的最小修正與測試應與P08新功能分開驗收；未授權前只列BLOCKER，不宣稱BUG已解決。

#### 補充實際流程測試（均 PLANNED / NOT_RUN）

|ID|輸入／目的|預期及驗收條件|
|---|---|---|
|AN01|glass=true/phoenix=false/pool=k，分別單獨取得MVP、新人王、舊最優秀投手、首位打者、本塁打王|批准對應修正後各一次解除glass/phoenix/pool=k+8，名稱與完整流程皆驗；無同季MVP掩蓋漏判|
|AN02|只有All-Star或Gold Glove、同年度類似/未知名稱，或glass=false|不額外取得復活或＋8；已phoenix、多賞、重畫/重試只一次|
|AN03|當年有效榮譽、低ovr/goodReal=false/降格條件，經active overlay movement|逐個批准降格白名單保持；All-Star/過去年不新增保護；同一fixture加goodReal=true時分清另一護欄|
|AN04|同年新P02、歷史legacy best pitcher、未實作P08的未得/已得決策|legacy/P02/P08不互換；P08沿批准範圍，非所有部門自动保護|
|AN05|相同Seed/操作前後、renderer fault、下一年、salary/contract及IF回歸|命名修正直接R0，允許效果及後續因果差；無關R/付款/合同不變，不補造舊效果|

AN01～05不是已執行的fixture。首批必先有可失敗原生效果/有效UI路線案例，再提出獨立最小修正與實作授權；不等於本文件任務自行開始工程。


### 14.12 文件檢查與Git範圍（HISTORICAL；14.10為先前檢查節）

只更新本設計與[決策紀錄](PITCHER_AWARDS_D2_DECISION_LOG.md)，不改其他分析/資料。原P01/P04批准值、P08五項/B2/G95、P07保證MVP皆保持。開工前tracked無dirty，既存designs/研究/tasks未追蹤檔保持，本次兩檔原本已untracked；前後git status清單相同不代表內容相同。
靜態檢查：77個Markdown本地引用（含明示anchor）PASS、TR01～14唯一且14項全PLANNED / NOT_RUN標記PASS；689個檔案中僅本兩份文件變更，其餘687個hash完全相同，無新增/刪除路徑，branch/HEAD/main與git status清單不變；git diff --check PASS（兩份文件為untracked，該命令不代表其內容已納入Git diff，另以內容/鏈接檢查補充）。第一次TR檢查用split錯誤截取到14.1之前，得到0而FAIL；改用slice取完整第14節後確認14個案例，不修改案例或預期遮掩錯誤。所有產品測試NOT_RUN；未執行Quick/Full/CI、產品fixture、RNG/hash向量或自然生涯，也未Commit/Push/Merge/Deploy。完成停止等待技術審查。


<a id="d2-technical-approved"></a>

### 14.13 CURRENT APPROVED TECHNICAL DESIGN — AF01～AF08

2026-10-14；SPEC_UPDATE_ONLY / DOCUMENTATION_ONLY。branch dev、HEAD `7220ad82002801d3dea5fedae80d0fb3d7a0433f`、VERSION1.12.0。正式來源為[技術定案候選書](PITCHER_AWARDS_D2_TECHNICAL_FINALIZATION_PROPOSAL.md)§3～8與本次使用者明示批准；候選來源保持不變。本節取代§5～7／14.3～14.9中技術方案「待批准」的現行解讀，不改寫舊研究與驗證數字，不改P01～P08既有政策。**設計批准≠產品實作≠Runtime PASS。**

|決策|批准狀態|正式落點|
|---|---|---|
|AF01|APPROVED / DESIGN_ONLY|14.13.1 H1／canonical／13 vectors|
|AF02|APPROVED / DESIGN_ONLY|14.13.1 binary64／嚴格比較／非法輸入|
|AF03|APPROVED / DESIGN_ONLY|14.13.1 identity／版本；14.13.2 schema|
|AF04|APPROVED_WITH_LIMITS / DESIGN_ONLY|14.13.2 原槽Journal及限定恢復|
|AF05|APPROVED / DESIGN_ONLY|14.13.2 多欄位receipt／一次效果|
|AF06|APPROVED_WITH_LIMITS / DESIGN_ONLY|14.13.3 checkpoint／續行|
|AF07|APPROVED_DESIGN / NOT_IMPLEMENTED|14.13.4 adapter與六個JP漏判修正設計|
|AF08|APPROVED_CONSERVATIVE / DESIGN_ONLY|14.13.6 歷史相容限制|
|AF09|NOT_AUTHORIZED|產品工程／修復／提交／發布未授權|

|正式風險（ID／定義保持§14.9原文）|設計狀態|產品驗收狀態|
|---|---|---|
|TR-B01|DESIGN_APPROVED|RUNTIME_NOT_VERIFIED|
|TR-B02|DESIGN_APPROVED_WITH_LIMITS|RUNTIME_NOT_VERIFIED|
|TR-B03|DESIGN_APPROVED_WITH_LIMITS|RUNTIME_NOT_VERIFIED|
|TR-B04|DESIGN_APPROVED|RUNTIME_NOT_VERIFIED|
|TR-B05|NOT_AUTHORIZED|NOT_IMPLEMENTED|

keyVersion是canonical編碼版本的語義名稱：本期domain=`pitcher-award-v1`、Decision.keySchemaVersion=1；Journal／Decision／Receipt.schemaVersion=1各自描述資料格式，ruleId描述獎項政策。這三者不是產品VERSION，不新增第七欄，不將批准schema的keySchemaVersion改名為另一欄位。H1選定；H2僅歷史替代，不實作。

<a id="d2-contract-rng"></a>

#### 14.13.1 AF01～AF03：H1／編碼／精度／Golden vectors

##### Canonical identity（APPROVED / DESIGN_ONLY）

欄位固定六個，**順序不得交換**：
1. domain=ASCII `pitcher-award-v1`，對應key schemaVersion1。
2. seed=當次人生實際初始化SEED字串，與S.seed一致，非目前URL欄/姓名/team。
3. year=安全整數1～9999的最短ASCII十進位字串，不含＋、前零、小數/locale；上下界是批准的技術界限，不是遊戲年度政策。
4. league=CPBL/KBO/NPB/MLB（大小寫固定）；不拆セ/パ/AL/NL，MiLB不假裝一軍award。
5. awardId=正式D2 PITCH_WINS/PITCH_WIN_PCT/PITCH_SAWAMURA；其他legacy/dERIVED不使用新獨立抽選。
6. ruleId=registry的固定規則識別：P01 `p01-b-v1`；P04 `p04-b-npb12-v1`；P08 `p08-ip180-s3-b2-g95-v1`。這些名稱APPROVED / DESIGN_ONLY，不含MAJOR/MINOR/PATCH或球團；NPB/KBO差異由league及規則registry判定。

EXISTING_APPROVED：原SEED/year/league/awardId/ruleId獨立鍵、PATCH不改抽選。VERIFIED_EXISTING：日本版game.js:2702正規化 `[...raw.normalize('NFKC').trim().replace(/[\\u0000-\\u001f\\u007f-\\u009f]/g,'')].slice(0,24).join('')`；只在初始化做，空時原遊戲生成seed。
APPROVED / DESIGN_ONLY：新award函式消費已初始化非空SEED，不重做正規化、不從歷史SEED/姓名補造、不再生成R；key入口確認合法string且對應初始化context。不呼叫Date/crypto/Math.random/R。不一致或缺失→INVALID_AWARD_CONTEXT、無新抽選、停止該新決策，先診斷，不吞既有槽。

player canonical：**現行單球員人生**用(實際SEED、固定single-player-v1語義)識別，single-player為架構約定，不額外放入六欄byte串；不同S實例的交易用WeakMap分離，同seed重播則有同結果。這不保證未来多人同seed獨立。新增持久playerId/把第七欄放key會改全部向量，屬DEFERRED＋APPROVAL_REQUIRED，不在本期默加UUID或保存欄位。

每欄轉TextEncoder UTF-8，不加BOM；先四byte unsigned big-endian byteLength，再bytes；六段串接，不加分隔、終止符或JSON文字，不用UTF16 length。最大技術輸入長度1024byte，超出/未知award/rule/domain、非canonical year、非法league拒新draw。TextEncoder对孤立surrogate按U+FFFD编码，與現行UTF8 FNV語義一致；不偷偷修改原URL/SEED字串。其與字面U+FFFD的等價編碼需列固定負/等價案例，不把所有不同JS字串保證不同hash。

schemaVersion1只描述bytes/journal格式，不表policy；ruleId描述該賞概率/資格配置，與產品PATCH獨立。配置真變另批准新ruleId，已DECIDED按原記錄resume，不用新版p/u覆蓋。新hash格式若變domain另版本，不能用新schema重算過去。

##### H1 常數與文件參考碼（APPROVED / DESIGN_ONLY）

FNV offset=0x811C9DC5、prime=0x01000193；每byte XOR後imul截32bit。avalanche固定shift16/13/16、multipliers0x85EBCA6B與0xC2B2AE35；最後>>>0，u=hashUnsigned/4294967296，區間[0,1)。不做低位取模百分比、不串接hash主R。

以下是**已批准的文件參考碼**，不是產品JS；Node可將區塊複製到暫時REPL獨立重算，不import引擎，不需新增套件或永久工具：

```js
function canonicalBytes(fields) {
  const out = [];
  for (const value of fields) {
    const b = new TextEncoder().encode(value);
    const n = b.length;
    out.push((n >>> 24) & 255, (n >>> 16) & 255,
             (n >>> 8) & 255, n & 255, ...b);
  }
  return Uint8Array.from(out);
}
function proposedH1(bytes) {
  let h = 0x811c9dc5;
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
// Independent unsigned/modulo-2^32 reference, not shared imul implementation:
function bigintReference(bytes) {
  const mask = 0xffffffffn;
  let h = 0x811c9dc5n;
  for (const b of bytes) h = ((h ^ BigInt(b)) * 0x01000193n) & mask;
  h ^= h >> 16n; h = (h * 0x85ebca6bn) & mask;
  h ^= h >> 13n; h = (h * 0xc2b2ae35n) & mask;
  h ^= h >> 16n;
  return Number(h & mask);
}
function decodeHex(hex) {
  return Uint8Array.from(hex.match(/../g), s => parseInt(s, 16));
}
// For any GV row: imulHash === bigintReference === stated decimal hash;
// u === hash / 4294967296. Rebuild canonicalBytes from six fields too.
```

##### 13 組批准 Golden vectors（APPROVED / DESIGN_ONLY；跨環境產品測試 NOT_RUN）

Node24.15.0中實際離線計算，13組Math.imul與BigInt相同；不執行任何正式RNG/生涯/產品工具、不寫附屬JS/JSON。不是Chromium/Safari PASS。每列hex是完整canonical bytes（不是seed bytes），u欄是JS round-trip表示，精確值一律hash/2^32。

|ID|raw seed → 初始化SEED|year／league／awardId／ruleId|hash unsigned decimal／hex|u|
|---|---|---|---|---|
|GV01|"tob0ilu0" → "tob0ilu0"|2035／NPB／PITCH_WINS／p01-b-v1|3691479232／dc0780c0|0.8594894856214523|
|GV02|"q77bi1jx" → "q77bi1jx"|2035／NPB／PITCH_WINS／p01-b-v1|1177117069／4629618d|0.27406892483122647|
|GV03|"投手あ😀" → "投手あ😀"|2035／NPB／PITCH_WINS／p01-b-v1|2810048397／a77def8d|0.6542653769720346|
|GV04|"ＡＢＣ" → "ABC"|2035／NPB／PITCH_WINS／p01-b-v1|3749864514／df826442|0.873083368409425|
|GV05|"/?seed=x&y#\|:" → "/?seed=x&y#\|:"|2035／NPB／PITCH_WINS／p01-b-v1|1739197629／67aa0cbd|0.40493850340135396|
|GV06|"tob0ilu0" → "tob0ilu0"|2036／NPB／PITCH_WINS／p01-b-v1|2360889063／8cb84ee7|0.5496873201336712|
|GV07|"tob0ilu0" → "tob0ilu0"|2035／KBO／PITCH_WINS／p01-b-v1|1118905353／42b12409|0.2605154535267502|
|GV08|"tob0ilu0" → "tob0ilu0"|2035／CPBL／PITCH_WINS／p01-b-v1|4210553061／faf7f0e5|0.980345779331401|
|GV09|"tob0ilu0" → "tob0ilu0"|2035／MLB／PITCH_WINS／p01-b-v1|1009399991／3c2a38b7|0.2350192496087402|
|GV10|"tob0ilu0" → "tob0ilu0"|2035／NPB／PITCH_WIN_PCT／p04-b-npb12-v1|487180188／1d09c79c|0.11343047674745321|
|GV11|"tob0ilu0" → "tob0ilu0"|2035／NPB／PITCH_SAWAMURA／p08-ip180-s3-b2-g95-v1|3230212375／c0892117|0.7520924264099449|
|GV12|"123456789012345678901234" → "123456789012345678901234"|1／NPB／PITCH_WINS／p01-b-v1|1093217683／41292d93|0.254534576786682|
|GV13|"é" → "é"|9999／NPB／PITCH_WINS／p01-b-v1|3275941899／c342e80b|0.76273966091685|

完整canonical bytes：
- GV01：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV02：`00000010706974636865722d61776172642d7631000000087137376269316a780000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV03：`00000010706974636865722d61776172642d76310000000de68a95e6898be38182f09f98800000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV04：`00000010706974636865722d61776172642d7631000000034142430000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV05：`00000010706974636865722d61776172642d76310000000d2f3f736565643d782679237c3a0000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV06：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303336000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV07：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034b424f0000000a50495443485f57494e53000000087030312d622d7631`
- GV08：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000044350424c0000000a50495443485f57494e53000000087030312d622d7631`
- GV09：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034d4c420000000a50495443485f57494e53000000087030312d622d7631`
- GV10：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034e50420000000d50495443485f57494e5f5043540000000e7030342d622d6e706231322d7631`
- GV11：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034e50420000000e50495443485f534157414d555241000000167030382d69703138302d73332d62322d6739352d7631`
- GV12：`00000010706974636865722d61776172642d7631000000183132333435363738393031323334353637383930313233340000000131000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV13：`00000010706974636865722d61776172642d763100000002c3a90000000439393939000000034e50420000000a50495443485f57494e53000000087030312d622d7631`

GV03含emoji（UTF8四byte）、GV04全形NFKC、GV05包含URL/分隔符但只作seed、GV06換年、GV07～09換league、GV10/11換award、GV12最大24字符/最小技術year1、GV13合成字é/最大技術year9999；兩邊界年是向量，不是自然球季。
另外PLANNED / NOT_RUN：空/非string SEED、NaN/Infinity/非整數year、未知league/rule/award、超byte長度、孤立surrogate等價、字段顺序错、相同输入反向計算順序、跨Node/Chromium/Safari逐byte/hash/u結果。無合法key時沒有bytes/hash/u，不捏造0當拒絕結果，不能將非法資料0機率與合法u=0混為一談。

##### 精度政策（APPROVED / DESIGN_ONLY）

批准計算pPercent/score使用未取整binary64與固定運算順序，无epsilon、无显示丸め；資格先行，p=0拒/p=100保證，中段 `(hash/2**32)*100 < pPercent`，相等不获，從key純計算結果，不抽主R。新賞0/100可不算hash，decision drawSource=DETERMINISTIC_0/100、hash=null；**legacy chance100照抽，不刪既有主R**。

P01 W非負finite safe integer；P04 W/L同條件且W+L>0，sum也須safe integer，否则INVALID_STAT（AF02已批准）；WP=W/(W+L)，不先toFixed。P08G/W/L/IP/SO/ERA沿已批有限非負/G>0/W13/IP143/ERA≤3.20/W+L>0，不擅加新的自然資格；使用獎項當下原st.era/IP，原十進位IP，不從ER回算覆蓋era，不轉outs。component依已批錨點clamp，加權固定W→ERA→IP→SO→WP順序(.25/.30/.25/.15/.05)；score不預先四捨五入再判60/95。

EXISTING_APPROVED：P01 b前0、b起20/g起100；P04 .65起20/.85起100；P08 score60起10/95起100及cap95，保留跳點。
PLANNED / NOT_RUN 產品精度驗收：P04 12/6可能24.999999999999982%，保留内部raw；P08 59.999/60/60.001及94.999/95/95.001；u=0、最大uint32/2^32、相等、非法資料不得進新draw；Node/Chromium/Safari exact vector，数學近似assert不得拿當資格容差。32bit概率粒度最大約1/2^32；不保證連續模型完全无離散偏差。替代BigInt有理P04、ppm整數化需另批准，不能一邊自稱無丸め一邊轉基點。

<a id="d2-contract-receipts"></a>

#### 14.13.2 AF04／AF05：Journal／Receipt（APPROVED_WITH_LIMITS / DESIGN_ONLY）

##### Identity／Decision

私有 `WeakMap<S, Map<year+frozenLeague, AnnualTx>>`；只把完成的獎項decision歷史置於擬定S.awardDecisions供下游證據，**不是永久存檔或localStorage**。S identity確保過期callback不跨新人生；交易键保留全字段，不用32bit hash唯一索引。
decisionKey = canonical六欄bytes的完整hex；legacy slot用domain另值＋S/year/frozenLeague/slotId/固定legacyRule，P07用DERIVED鍵；joint MVP只一個語義id，不因draw＋guarantee建兩份。

```text
AnnualTx {
 schemaVersion:1, stateIdentity:S, year, leagueKey, frozenLevel, frozenRole,
 seedAtBirth, ruleRegistrySnapshot, statsSnapshot, eligibilitySnapshot,
 phase, slots:[SlotRecord...], decisions:Map<fullKey,Decision>,
 receipts:Map<effectKey,EffectReceipt>, renderReceipts, choiceReceipts,
 continuation:{fromYear,targetYear,choiceToken,status}, diagnostics
}
SlotRecord {
 slotId, eligible, pPercent, status: PREPARED|RECORDED|AMBIGUOUS,
 rngBefore, u, rngAfter, awarded
}
Decision {
 schemaVersion:1, keySchemaVersion:1, year, leagueKey, awardId, ruleId,
 level, role, eligibility, reasonCodes, metrics, pPercent,
 drawSource, drawKey?, hash32?, u?, legacySlotId?,
 awarded, decisionStatus: DECIDED, sources:[...]
}
```

Prepare前驗registry/語義/各new stat與journal可寫，冻结必要input（非clone全部S）。按原legacy资格與顺序预建立固定plain writable slot records，未資格記SKIPPED不耗R；AS副作用也独立receipt。
原順序AS→rookie→P02(oldERA)→P05→P06→P03→原MVP；P02沿該槽bool，不另抽舊賞/P02；保持原公式/短路与所有旧100%R。所有legacy槽先記，再新P01/P04/P08固定key；之後從實得集合衍生P07、合併MVP sources。新P07不抽，原MVP不合資格沒有slot不能補R，但P07保证仍可补同一筆MVP。

```text
captureLegacySlot(slot):
 if RECORDED: return saved result
 ensure plain validated S and preallocated journal slot
 slot.rngBefore = currentNativeRState
 u = nativeR()                      # exactly original one call
 slot.u = u; slot.rngAfter = currentNativeRState
 slot.awarded = u*100 < frozenP
 slot.status = RECORDED             # no render/await/callback in this region
 supportedFaultHook("after-slot-record")  # only now may injected UI/test fault run
```

**有限原子承諾，不宣稱萬能**：正常plain S字段与预allocated record同步写無外部调用，不改nativeR算法、不回滾R。支援fault點是记录完成之後；人工插throw在nativeR與RECORDED間、OOM、proxy/getter/host crash屬不支援gap。若捕獲gap且slot不能證明結果→AMBIGUOUS_RNG，停止/診斷，不重抽、不猜u或从当前_rng重建。此支持邊界已由AF04限定批准，native產品測試仍NOT_RUN；原R合法已耗不回滾。
過去honors無journal不表示未抽：可靠已结算标记→HISTORICAL_READ_ONLY、不draw/補trait；未知→UNKNOWN_HISTORY停止該歷史交易。未結算新年度正常建tx；没有schema不无条件重算当年。

##### Effect Receipt

effectKey=完整player-instance/年度/league/語義effect；一般賞的honors keyed award，但同年MVP來源合併、phoenix為生涯shared once gate（不能按每個P08各＋8），年度降格護欄是decision派生不累計counter。

```text
EffectReceipt {
 schemaVersion:1, effectId, decisionKeys, commitContext,
 status: PLANNED|COMMITTED|CONFLICT,
 writes:[{path,before,after,status:PLANNED|WRITTEN}],
 resultSnapshot, committedYear
}
```

prepare合法结果及所有next values，先保存receipt，實際提交不调用card/board/外部handler；当前值=before则写after、=after确认已写，其他值→CONFLICT停止，不覆盖其他合法变化。不是最后一个applied代表全部完成；plain多写同步提交支持已知边界，receipt保存证据，即使可識別部分after也不泛化所有array/物件对象深相等恢复。集合/contract要保存明确全结果及identities，不能用任意JSON等價强覆蓋。
phoenix准备资格glass&&!phoenix与可信當年eligibility→四類write：glass=false、removed去重原標籤、phoenix=true、pool=before+8。presentation缓存清理及UI在state提交后。不同奖共用该gate，后季已phoenix不再＋8；若再次glass原规则保持，不产生新永久免伤。

责任边界：
- honors/history/AS/traits：各独立receipt，final同义year/league/ID恰一笔；旧honors不删除重写。
- 薪資評價：最终honors之后原同年upsert/近3季政策，记录結果receipt；不重复增加历史条。
- 固定薪资/出来高：沿signed annualSchedule/contractId/year及yearlyIncentivePaid，以各原生政策準備after contract、careerBaseSalary/careerIncentive/careerEarnings值再同步commit；不在award直接加现金、不突破上限、不遡改既成保障。历史paid而沒有before/after收入证据不可推造漏付。
- HOF：dedup语义输入给原score/aceN/king/tier的純衍生消费，不在每次獲獎increment殿堂分；没有独立付款receipt。
- 降格：当前award決策派生boolean（本年度），不用永久protect旗標；movement/state侧效果另continuation receipt。P08同年保護按已批context，不扩大FA/退休免責。
- receipt完成后render失败只重绘saved result；任何receipt conflict不进入下一年、不强制ROLLBACK。

<a id="d2-contract-checkpoints"></a>

#### 14.13.3 AF06：年度續行（APPROVED_WITH_LIMITS / DESIGN_ONLY）

VERIFIED_EXISTING：phaseMid→proSeason生成/累計→awards→salaryEvaluation→TJ/交易/國際→nextStep→phaseEnd付款→配分/movement→advance→startYear。**awards不在phaseEnd**，不能從付款重入再重跑前面的proSeason。
最小新增状态：AWARD_PREPARED→DRAW_RECORDED→AWARD_EFFECTS_COMMITTED→SEASON_PAYMENT_COMMITTED→RESULT_RENDERED→WAIT_ALLOCATION/WAIT_CHOICE→CHOICE_COMMITTED→YEAR_HANDOFF_COMMITTED。成績已存在的snapshot/log只凍結/續讀，不重新simSeason或accStat。

|情境|checkpoint与恢复（限定批准）|允许与停止边界|
|---|---|---|
|正常年度|原顺序，各stage完成才推进；原合法R在原时点|正常例不额外抽R|
|同年重入|按tx/state/year读完成stage；付款receipt只一次|不因context存在就全return而漏下一步|
|抽選后中断|RECORDED以上读saved result续effect|主R-record gap不安全则AMBIGUOUS停止|
|效果后中断|effect receipt確認结果，只续render/下一effect|pool/contract等并行不明→CONFLICT停止|
|支付后UI失敗（VAL-A07）|PAYMENT_COMMITTED保留，重render結算卡后才发布原进路|不能第二次markSalaryPaid、不能因paid guard吞續行|
|選項尚未接受重入|WAIT_choice重复只取现有效session，不重新清pool/建listener|DOM消失仅render同一choice规格，不执行action|
|接受選項|S identity/year/generation/session校验，action对应单次receipt；新choice保持|当前现有runChoiceAction/alloc session要保留，不能仅禁用按钮当交易|
|年已推进|记录fromYear/targetYear与HANDOFF状态，旧年度callbackstale；若S.year=target不再advance|startYear/phasePre内部已部分耗R、无细checkpoint时不得重跑，NEXT_YEAR_AMBIGUOUS停|

pool转交alloc也需要receipt保存原p/骰序/session id，第一次S.pool=0與payloadp成對；重入不再取0代替原p、重新振骰或執行allocDone。allocation保持原能力成本/Undo/reset/特性规则。

advance限定設計：在调用原advance前写完整fromYear/targetYear/age/stageYr计划，成功后記handoff。故障後確認S是否仍from→允许一次advance，已target→绝不再increment；若next startYear已部分执行，不能仅S.year变化推断已完成開季。最小本期支持付款/奖提交后的UI失敗及尚未接受選項；开季内部任意异常不自动重试，显式停止。支援全部phasePre/TJ/交易的任意failure须另扩大journal范围批准，不能以本任务名義大重構。
禁止把phaseEnd.PRO seasonEndContext提前置为「所有完成」；可保留支付guard但轉到stage-aware恢复。CORP已有paid/complete/running復用不退化；IND既有guard不擅改。本批准設計的精確變更點與正常S/R對照須產品實作驗收後才算完成。

範圍：
- VERIFIED_EXISTING／现行需保护：同年付款/奖效应/配分與年份单次，card失败不重付；受控風險已有證據。
- APPROVED_WITH_LIMITS／產品接入前必須：旧R记录、new decisions与效果、finalMVP、支付後续行及choice/advancehandoff。
- DEFERRED：跨頁/reload/processcrash恢复，因为没有career存檔；不新增localStorage保存、自动存档或旧engine。可支持同頁同S证据，不承诺重整后恢复。


##### Checkpoint 完成條件與重試界限（AF06）

|Checkpoint|進入條件|完成條件|可恢復範圍／不可重複的副作用|無法安全恢復|
|---|---|---|---|---|
|AWARD_PREPARED|現成球季成績已生成／累計，尚未作本年度決策|frozen context、合法registry與可寫原槽已準備|只讀既有成績；不得重跑proSeason／simSeason／accStat|INVALID_AWARD_CONTEXT或不明部分成績停止|
|DRAW_RECORDED|prepared且原槽資格可信|所有適用原槽RECORDED，新賞DECIDED，實得及MVP來源可辨|只續下一未執行槽或讀已記結果，不重抽、不回滾主R|R已耗而記錄缺失→AMBIGUOUS_RNG停止|
|AWARD_EFFECTS_COMMITTED|可信決策及各effect before／after可用|本期honors／traits／phoenix等receipt全部COMMITTED|只完成可識別partial；不重＋8、不重記MVP|任何不等before／after→CONFLICT停止|
|SEASON_PAYMENT_COMMITTED|既有合法契約及年度應付資料；上游原流程完成|base／incentive原付款記錄與receipt結果一致|已付款只續render／選項，不再次領薪／契約金；付款不是年度完成|無可信收入before／after或契約身份衝突停止|
|RESULT_RENDERED|saved result與付款／效果提交證據可用|結果卡完成、renderReceipt可辨|重畫saved result，不重新結算、抽選或生成成績|未知render／choice身份停止，不重建另一有效操作|
|WAIT_ALLOCATION／WAIT_CHOICE|結果完成、同一有效session或pending payload已準備|原配分／進路選項已發布但未接受|保留原p／dice／session與listener，只恢復同一選項，不重清pool／振骰／執行action|S／year／generation／session不符拒絕舊callback|
|CHOICE_COMMITTED|同一有效callback一次接受|action receipt與原後續payload確認完成|一次allocDone／簽約／movement等；重試讀已完成交易，不二次执行|未知partial action停止，不概括rollback S|
|YEAR_HANDOFF_COMMITTED|choice完成，from／target計畫可用|一次年度交接完成，必要下一步完成證據可辨|year已target不再increment；callback過期；不能單靠year已變推斷startYear成功|startYear／phasePre部分耗R不可辨→NEXT_YEAR_AMBIGUOUS停止|

本期只支援同頁同S下已記抽選的效果續行、已提交效果的重畫、付款後UI失敗、未接受選項續行，以及已完成年度交接防重。不保證任意startYear／phasePre、跨頁重載、關閉瀏覽器或host crash恢復，不新增完整存檔，不擴成全引擎重構。

<a id="d2-contract-consumers"></a>

#### 14.13.4 AF07：獎項 ID adapter（APPROVED_DESIGN / NOT_IMPLEMENTED）

##### Source／consumer 與完整 registry

VERIFIED_EXISTING來源：
[game.js](../src/engine/game.js):1355–1474 producers与phoenix；1603/1619movement、3132覆寫仍委派LEGACY；620buildCareerViewModel→[player-detail](../src/ui/player-detail.js):10–11 achievements；2226–2259引退honors分組、2388后共享画像；2037守備legend文字、2043tier/HOF；[trait-policy](../src/engine/trait-policy.js):55–75MVP/打者三冠；[salary-evaluation](../src/engine/salary-evaluation-policy.js):56–66、[salary-promotion](../src/engine/salary-promotion-policy.js):110–122；[HOF](../src/engine/hall-of-fame-policy.js):15–68；[incentive](../src/engine/incentive-policy.js):10–34。
不對未知detailed UI文件猜path；player-detail與game现消费者是实际证据。现成就没有structured awardId、P01/P04/P07/P08没有producer，deferred trait标签不表示已發奖。

記号：MAJOR=.75市場/2fallback/460 aceN、star保底；DEPT=.35/1/160 king/reg保底；MVP=.75/2/420 mvp/star保底；FULL沿当前contract年度max，不是每赏累加奖金。P07自身0但其MVP正常待遇。表中P-ID与待遇EXISTING_APPROVED，其他legacy/support ID為AF07 APPROVED_DESIGN；现行producer/alias文字VERIFIED_EXISTING。

|稳定ID|日文完整名／兼容alias|league/level/role与现producer|薪資／HOF／incentive／traits/UI责任|
|---|---|---|---|
|LEGACY_BEST_PITCHER|最優秀投手賞；最佳投手仅可信旧中文alias候选|四一軍SP，game1386现产；D2未来停止新发|旧MAJOR/FULL；需补现复活/降格漏判；原历史名字显示，不等P02/P08|
|PITCH_WINS P01|最多勝利投手賞；不得当勝投王新保护alias|四一軍P；NOT_IMPLEMENTED|DEPT/FULL；三冠组成；现無獎不是Bug|
|PITCH_ERA P02|最優秀防御率投手賞；**不alias最優秀投手賞**|四一軍SP，未来替原ERAproducer原R结果|DEPT/FULL，不继承旧大賞分或复活资格；三冠组成|
|PITCH_STRIKEOUTS P03|最多三振奪取投手賞；旧最多奪三振只读alias|四一軍P，现game1405旧名|DEPT/FULL；同义一次消费；三冠组成；保留old字符串|
|PITCH_WIN_PCT P04|勝率第一位投手賞|NPB/KBO一軍P；NOT_IMPLEMENTED|DEPT/FULL；不參與三冠，不新增保护|
|PITCH_SAVES P05|最多セーブ投手賞；旧最多セーブ|四一軍CL，game1395现旧名|DEPT/FULL，原機率不變，不自動抗降格|
|PITCH_RELIEF P06|最優秀中継ぎ投手賞；旧最優秀中継ぎ|四一軍MR，game1400现旧名|DEPT/FULL，HLD简化，不造HP/reliefWins|
|PITCH_TRIPLE_CROWN P07|投手三冠王|四同年同league实际P01/02/03；NOT_IMPLEMENTED|自身score0/no独立奖金；history/pitcherTC一次，MVP合并|
|PITCH_SAWAMURA P08|沢村賞；不与legacy合并；澤村仅历史中文且需确认来源|NPB1/SP；NOT_IMPLEMENTED|MAJOR/FULL，已批phoenix+年度保护；不autoMVP|
|MVP（support ID）|年間MVP；年度MVP仅可信历史alias|四一軍，game1458原抽選／未来P07保証同语义|MVP/FULL；oldghost/strongpitch/hit等原資格，phoenix/降格原有效|
|ROOKIE（support ID）|新人王|四一軍原资格game1381|市场.25/fallback无/HOF140；現incentive不因新人王直接FULL，仍按原payD评估；原復活/降格，有yips原处理|
|BATTING_AVG（support ID）|首位打者；打擊王可信旧alias|四一軍打者，game1413|DEPT/FULL；hitterTC组成；复活/降格漏判批准修正設計|
|BATTING_HR（support ID）|本塁打王；ホームラン王是incentive现别名；全壘打王旧alias候选|四一軍打者，game1418|DEPT/FULL；hitterTC；复活漏判、降格现有效|
|BATTING_RBI／SB／OBP（support ID）|打点王／盗塁王／最高出塁率|四一軍打者，game1423/1428/1434|原DEPT/FULL/现降格王命中（OBP不命中王）；RBI三冠；不新增复活|
|GOLD_GLOVE（support ID）|ゴールデングラブ賞；金手套可信旧alias候选|四一軍原守備资格game1440|市场.25/fallback1/HOF300 king/FULL；无复活、降格漏判修正設計|
|DEFENSE_BEST（support ID）|年間最優秀守備選手|四一軍，game1444|市场.25/fallback1/HOF220 king/FULL；原无phoenix/名称降格命中，不新增|
|ALL_STAR（support ID）|オールスターゲーム；精确附註(ファン投票選出)|四一軍game1375|无市场/fallback/FULL；HOF70P/40打者；不新增复活/降格，不被任意MVP/王字样误套|
|HITTER_TC（support ID）|打撃三冠王|原trait-policy精确同年同league三項|原MVP保证流程/traits保留，不偷改既有王保護；非新投手奖|

支持原冠军/国际/业余荣誉：交还各既有policy、不给P-ID/個人赏映射、不使用「文字含優勝」猜获奖；国际MVP可能旧regex命中保护，未经批准不可删原效果。registry是限定個人奖范围，不全面改跨模块国际/团队制度。NOT_IN_SCOPE（可信的其他已知模块荣誉）与UNKNOWN（無法確定身份的個人赏文字）必须区分；UNKNOWN依D2只显示不猜奖分/效果。若全面替换旧regex将改变未知历史旧行为，必须遵守下列AF08已批准保守政策，若衝突停止並另詢問，不能暗中用substring fallback重新猜ID。

##### 復活／降格集合分離（修正設計 APPROVED_DESIGN；BUG NOT_FIXED）

|ID语义|现phoenix资格|批准phoenix設計|现年度降格资格|批准年度降格設計|
|---|---|---|---|---|
|MVP|是|保持|是|保持|
|ROOKIE|是|保持|是|保持|
|LEGACY_BEST_PITCHER|中文别名可、日文漏|补日文|日文漏|补日文|
|BATTING_AVG|日文漏|补首位打者|日文漏|补首位打者|
|BATTING_HR|日文漏|补本塁打王|是（王）|保持精确ID|
|GOLD_GLOVE|非資格|不新增|日文漏|补ゴールデングラブ賞|
|ALL_STAR|非資格|排除|非资格|排除|
|P08|无producer|已批准glass&&!phoenix条件下生涯一次＋8|无producer|已批准获奖当年度movement保護|
|P01/P02/P03/P04/P05/P06|现或新正式名不命中上述big|不普遍新增|部門名称不自动保护|不普遍新增|
|其他已知范围外原荣誉／UNKNOWN历史|已知按原scope判定；UNKNOWN不推断|不普遍新增，UNKNOWN只读|已知按原scope判定|已知国际/团队等交还原模块；UNKNOWN个人赏只读不猜效果，整体legacy范围外行为不得改变，按下列AF08保守政策|

phoenix集合不是所有department/MAJOR统一category。MVP與P08同季只有一份生涯effect；yips的任意本年荣誉解除原规则不缩到phoenix集合。新P08派生保护不變永久、不免续约/退休/FA。
历史lastyear个人賞不当currentyear；candidate adapter解析year与league，但**限定现有Bug修正不顺便改变旧MVP/王跨league当年作用**。新P08按D2 frozen获奖league/本年context，不扩到别league永久护栏。若要求旧保护一律只当前league，属APPROVAL_REQUIRED，不能从精确解析暗中变行为。

##### 精確解析／去重（APPROVED_CONSERVATIVE / DESIGN_ONLY）

structured trusted Decision优先，确认schema/recognized ID/year/league/rule完整；honors解析 `^([0-9]{4}) ([knownLeagueLabel])([exactAwardNameOrAlias])$`，最长已知league label先匹配，leagueNPB/KBO/台湾プロ野球/メジャーリーグ，exactAllStar附注单独规则。不以「王」、MVP substring或startswith year猜id，不把球队名反推league；旧无year/未知名保留原字符串、read-only unknown标记。新canonical year1～9999与现honors常规4位年需要adapter确认：新展示year按原String(year)，候选key低于1000向量只是数学测试，不从未来未知UI历史猜身份。
同player/year/league/awardId语义去重consumer，保留全部原honors原文及來源，不global replace/删字串。legacy最佳投手与新P02/P08不同ID；P03正式/旧名同义只能计分一次。unknown历史不补奖、不补phoenix+8、不产生receipt已付推测；只显示并沿未改的范围外旧consumer处理。
已paid contract/schedule/career收入不可回溯改；当期可信未完成tx才可继续未commit效果，不能因adapter突然认出过去P08/旧大赏就重算。可靠旧结算不重抽；未知是否已完成→HISTORICAL_UNKNOWN，不自动迁移待遇。
UI卡/成就/引退/PNG用displayName与originalText分离：新发按正式日文名，历史按原字符串；需保留原顺序/正常折行、取得说明时机，不用重建S.honors去统一语言。

<a id="d2-contract-gates"></a>

#### 14.13.5 故障注入與回歸驗收（全部 PLANNED / NOT_RUN）

分批證據邊界依[實作計畫§7／§10／§11](../../tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md)：G3可用已完成Decision fixture搭配實際產品Receipt邏輯驗證交易安全，必須標明fixture與實際產品呼叫路徑，不以模型Receipt冒充產品。此PASS僅涵蓋G3限定範圍；G6／G7仍須另走真實`producer → Decision → Receipt → consumer`整合驗收，不得以fixture PASS取代。AF01～AF08設計批准、Runtime未驗證與AF09未授權狀態均不變，本次不啟動工程或測試。

共同产品前置：合法原生S/contract/year、冻结输入、真实调用链/无强制改变能力；fault注入与自然路线分清。成功需逐checkpoint的S/R/receipt/实际choice/body，不只是没有throw。下面对既有证据逐案转换（K=full decision identity，E=effect identity，原R合法耗后不回滚）。

|验收ID／來源|初始／故障点|预期Journal/Receipt与S/R|重试／允许恢复／不安全处置|
|---|---|---|---|
|F-A04 ← VAL-A04|原MVP native slot记录后，年間賞render fault；glass/未phoenix/pool7|slotRECORDED；MVP一个；effects完成后pool15、glassfalse/phoenixtrue，或待effect可单次续；旧R数不再加|从checkpoint完成剩余effect/render，不再awards全重跑；若slotgap未知停止|
|F-A06 ← VAL-A06|同年旧ERA已decision+honor，再入|读取同K bool，honor一个、R增0；P02切名未来同oldslot|journal已知可resume；仅历史honor无可信tx不补抽|
|F-A07 ← VAL-A07|合法base/incentive已付，结算card故障|付款receipt与paid schedule一致、总10.35m不变、R只原champ1|重绘后确实提供配分/movement一次，不因为paid/context直接return；不安全收入差STOP|
|F-B01|首次legacy/native或新hashdecision|完整K记录一次；old有资格耗1，new主R0|DECIDED才允许effects|
|F-B02|重复同year/player/award|同K/no第二R、同outcome|读取旧journal|
|F-B03|draw完成、effect前故障|DECIDED、receiptPLANNED、S效果未变|只补本E一次，不重新draw|
|F-B04|E COMMITTED后重入|glass/pool/honor/收入保持、R0额外|只render未完成项|
|F-B05|supported after-slot record中断|记录u/p/before/after/R状态、phase可辨|从下个slot起；人为在R-recordgap throw则AMBIGUOUS禁止自动续|
|F-B06|同年P01/02/03多赏|各K/oldslot不同，但MVP/phoenix sharedreceipt|各decision独立不重复effect|
|F-B07|同賞翌年|新K合法、旧K不覆盖，已phoenix不＋8|新年正常，不拿旧年decision套新年|
|F-B08|不同S/league/player模型键|S WeakMap隔离、freeze league、fullK distinct|同seed重播结果同；多人同seed独立抽选本期DEFERRED|
|F-B09|可靠已结算history/无journal|只读，old honors/name/salary不改、draw0|UNKNOWN state不猜，不能把模型fixture settled当自动产品推断|
|F-B10|P07三实得＋原MVP true/false/no slot|MVP sources合并、honor/traits/奖金一次；oldslot如有照抽|不从基本成績代替実得；不补主R|
|F-B11|P08真得＋glass/未phoenix、同MVP/以后再P08|P08与MVP独立decision、一个生涯phoenixreceipt，pool+8一次|未得/已phoenix/GoldGlove/AllStar不新增复活；保護期限原樣|
|F-B12|effect任一步write后done前故障；并行改变pool100|保存before/after每步，只识别相符partial；重试pool15不是23|可识别partial可续，其他合法写入冲突→CONFLICT停止，不能覆盖100强行绿|
|F-YEAR|WAITchoice、accept、advance增年后startYear中断|选择一次、fromYear→targetYear一次、旧callbackstale|若nextPre部分R未知，NEXT_YEAR_AMBIGUOUS停止，不再advance或全startYear重跑|
|F-GV|13批准向量＋invalid/平台/顺序|canonical bytes/hash/u exact；seed/主R不写|Node/Chromium/Safari均需真实PASS；算法已批准，但未跑產品不得稱產品通過|

六个现漏判完整producer→ID→consumer验收：
- F-ID01：原日文最優秀投手→LEGACY_BEST_PITCHER→phoenix；glass true/false gate、pool7→15一次。
- F-ID02：原首位打者→BATTING_AVG→phoenix；同年仅本赏排除MVP掩盖。
- F-ID03：原本塁打王→BATTING_HR→phoenix；只补映射、不提高得奖机率。
- F-ID04：最優秀投手→legacy→movement；ovr<min/poorReal与goodReal双fixture、原active overlay。
- F-ID05：首位打者→AVG→movement，必须不靠「王」。
- F-ID06：ゴールデングラブ→GOLD_GLOVE→movement；不因此新增phoenix。
其餘F-ID07～12（PLANNED / NOT_RUN）：MVP/新人王/本塁打王正常保护、GoldGlove/AllStar区别/附注、历史old不映P02、P08独立ID、同名跨年/league精確消费、market/fallback/incentive/HOF/trait/UI全adapter对照。原HOF300/460/160等按既定政策；P07自身0/MVP正常、original renderer不裁/不R。
回归：P通常/省エネ/全力及IF固定Seed、原slot逐值/顺序与數、same新版2次S/choice/R、实际合同保障/支払不回溯、旧honors兼容、PC1280/320/390。修名将少跑降格chance55、glass取消及pool变化可改变后续S/R，**需先批准因果差范围**；其他直接R/公式/候选顺序变化不得放寬。Quick/Full/Preview只在未来产品授权后。


##### F-ID07～F-ID12 個別验收明細（沿來源相同ID；PLANNED / NOT_RUN）

|ID|輸入／操作|預期與驗收條件|
|---|---|---|
|F-ID07|當年唯一年間MVP／新人王／本塁打王，glass條件及goodReal雙fixture|原有效復活／保護不退化，life-once＋8；不把goodReal掩蓋名稱漏判|
|F-ID08|唯一GoldGlove／All-Star及精確ファン投票附註，未知相似名|GoldGlove不復活、批准當年保護；All-Star兩者均排除，不用任意MVP／王substring猜效果|
|F-ID09|原歷史最優秀投手賞與新最優秀防御率投手賞並存|legacy／P02獨立ID／待遇，原歷史字符串不改、不重算已付合同；不補抽／補phoenix|
|F-ID10|NPB1/SP P08已得／未得、glass／已phoenix、同季MVP|P08獨立於legacy與P02，當年保護、共享生涯＋8一次；不autoMVP、不永久保護|
|F-ID11|同名跨年度／league、同義P03短／正式名、不同S|consumer按語義去重；過去年不當本年；保留舊同年度跨league保護範圍，不改raw honors|
|F-ID12|每項registry→salary market／promotion fallback／FULL／HOF／trait／UI，PC1280／320／390|逐行對照14.13.4待遇矩陣、P07自身0且MVP一次；合同保障／已支付收入不回溯；名稱／原文／折行正確，不額外R|

<a id="d2-contract-history"></a>

#### 14.13.6 AF08：APPROVED_CONSERVATIVE 歷史相容政策

以下是目前正式限制；來源候選書的待批替代方案不再適用，但原文件保留歷史。

1. 已知舊獎項以精確 ID／可信 alias 對應；表中「候選／需確認來源」的中文 alias 只在來源可證時採用，不推測新alias。
2. 未知歷史個人獎項保留原文，只讀，不推測效果。
3. 不補發歷史 phoenix +8。
4. 不重新計算已支付薪資或已完成合約。
5. 不重新抽取已結算歷史獎項。
6. 不全面改寫 S.honors。
7. 既有國際賽、團隊榮譽及範圍外 consumer 保持現有行為。
8. 不順便更改舊獎項跨聯盟的當年度保護行為。
9. 不使用模糊「王」或 MVP substring 判定已知個人獎項。
10. 不因導入adapter改變未知歷史資料的既有範圍外處理。

UNKNOWN個人賞與NOT_IN_SCOPE必須分離，保留既有範圍外consumer不能被解讀為允許對UNKNOWN個人賞推測新效果。若兩項相容限制無法並存，停止並回報，不自行放寬政策。

#### 14.13.7 驗收引用、狀態與未授權事項

上述F案例是§8 T01～T50、§14.8 TR01～TR14、§14.11 AN01～AN05的技術細化，不另立風險ID。
- F-A04／A06／A07分別對照原VAL-A04／A06／A07，涉及TR-B02／03；舊runtime RISK證據不等未來修復PASS。
- F-B01～12沿原VAL-B01～12模型情境深化到產品Journal／Receipt，對照TR-B02及交叉TR-B03／04；模型PASS不是產品PASS。
- F-GV對照TR-B01與既有精度／RNG驗收；13向量Node離線結果是既有來源證據。新產品Node／Chromium／Safari跨環境全部PLANNED / NOT_RUN。
- F-YEAR對照TR-B03續行與舊callback驗收。
- F-ID01～06對照AN01／AN03兩套獨立效果資格；F-ID07～12補足AN02／AN04／AN05及TR-B04完整下游，不能用新P02代替legacy。
- PC1280／320／390px、固定Seed逐步S／選擇／主R槽順序比較、付款／合約／HOF及原打者回歸皆PLANNED / NOT_RUN。

BUG-AWARD-PHOENIX-JP-01及BUG-AWARD-DEMOTION-JP-01：REPRODUCED / NOT_FIXED（既有原生限定fixture報告，不是自然全生涯重現）。AF07僅批准六個漏判對應的修正設計；影響因果差範圍仍須在AF09工程批准中明確限定。所有產品Runtime驗收本次未執行。
H2、53bit替代、BigInt有理／ppm方案、多人同Seed identity、跨頁保存及任意R→record gap恢復未納入本次批准；不能擴大AF04／06承諾。AF09產品實作／Bug修復／Commit／Push／Merge／Deploy仍NOT_AUTHORIZED。


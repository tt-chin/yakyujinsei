# 投手獎項 D2 決策紀錄

## CURRENT：A／B本地接受與G9限定授權（2026-10-15）

- 使用者已接受開發A與開發B。A本機提交`efd4710c4c5c366ff3aba69c59180031c82ff18a`；B本機提交`56e72d9792529f3221c1a1ffadaf563bceebe26d`（受驗1.12.0）；追加批准工作樹VERSION／CHANGELOG準備為1.13.0 MINOR，沒有將提交或升版等同推送或發布。
- AF01～AF08：原設計批准不變；A0／G2～G4與G5～G8的限定原生／Runtime驗收已PASS並獲接受，非所有自然生涯、任意崩潰或新獎平衡均已驗證。兩日文名稱BUG由G1-A接受結案，其歷史REPRODUCED／NOT_FIXED記錄保留。
- AF09：A／B產品工程已分批獲授權並完成本地接受；G9文件／來源／發布準備及1.13.0 VERSION／CHANGELOG已獲授權。Git提交／推送／合併、CI觸發、Preview／正式部署及歷史產物刪除仍須另行批准；CI timeout／artifact方案與staged清單待審。見[本輪發布準備](../reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)。不得把AF09一概寫成全未授權或全發布已授權。
- TR-B01～TR-B04：原ID／定義不變，指定A／B本地證據已具備；恢復支持仍限同頁同S已記錄邊界。TR-B05：A／B限定授權已滿足，G9受限操作仍AUTHORIZATION_PENDING。完整映射與限制見[G9收尾報告](../reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)。
- A01～A09、P01／P04 CURVE_B、P08 IP180／S3／B2／G95、P07實得三冠與MVP、各Consumer精確歷史相容與原始honors保全均不改。現行實作規格見[CURRENT_SPEC第17節](../../CURRENT_SPEC.md#d2-current-spec)。

下方所有帶日期或舊CURRENT的決策／待批／Runtime未驗證／未實作／未授權描述均保留為HISTORICAL時點紀錄；已批准規則仍有效，執行進度由本節與A／B／G9驗收分層說明。沒有改寫舊FAIL、舊數值或重新定義既有決策ID。

> CURRENT TECHNICAL FINALIZATION（2026-10-14）：AF01～AF08已批准設計，最新正式落點[主D2第14.13節](PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-technical-approved)。下方先前待批記錄保持HISTORICAL；Runtime未驗證、AF09 NOT_AUTHORIZED，兩日文BUG REPRODUCED / NOT_FIXED。

> 最新補充：使用者要求將現行日文獎名漏判納入D2技術BLOCKER，新增BUG-AWARD-PHOENIX-JP-01與BUG-AWARD-DEMOTION-JP-01，見[第14.11節](PITCHER_AWARDS_PHASE1_DESIGN_D2.md#legacy-award-name-blockers)。靜態漏判已核對，但未自然Seed重現或產品修復；P08未實作風險另外分類。

> CURRENT（2026-10-14）：P08-PHOENIX-DEMOTION-PROTECTION為 APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED；政策BL-P08-EFFECT已解決，舊「是否新增」記錄SUPERSEDED。沿現有glass&&!phoenix觸發、移除glass／phoenix=true／pool+8生涯一次，以及獲獎當年度movement保護；不永久免傷/降格/續約/退休。六項技術審查見[主設計第14節](PITCHER_AWARDS_PHASE1_DESIGN_D2.md#pitcher-awards-technical-review)，技術接入與驗收仍未完成。

> 2026-10-14最新批准：P01/P04均CURVE_B，P01四聯盟W線不變；P04 NPB最低12/KBO10、.650/.850，APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED，見[主設計第4.2.2節](PITCHER_AWARDS_PHASE1_DESIGN_D2.md#p01-p04-approved-design)。先前A曲線/NPB13與待批狀態保留HISTORICAL，不再待選。P07/P08批准規則不變，產品實作未授權。

> CURRENT：IP180／原S3／B2／G95，APPROVED / DESIGN_ONLY，見最末B2定案與[主設計唯一入口](PITCHER_AWARDS_PHASE1_DESIGN_D2.md#p08-approved-design)。下方舊「基本55/曲線未批准」與IP190/G100為HISTORICAL / SUPERSEDED，不表示目前待決。

> HISTORICAL（B2批准前的摘要，已SUPERSEDED）：最新有效決策見最末「D2.1參數定案」。IP180／原S3（25/30/25/15/5）／G95已APPROVED / DESIGN_ONLY；之前IP190/G100及權重TBD紀錄為HISTORICAL。基本55、曲線、上限與精度仍待批准，不能從三項批准推廣至整個模型或產品實作。

2026-10-13；基準dev `444144a57fb3ad23ac2bd1b3e9c87ba0809ea9bb`／1.11.9。狀態用於設計審查，APPROVED不是已實作/PASS。[D2主設計](PITCHER_AWARDS_PHASE1_DESIGN_D2.md)、[離線分析](PITCHER_AWARDS_D2_BALANCE_ANALYSIS.md)與[D1](PITCHER_AWARDS_PHASE1_DESIGN.md)保留追蹤。

## APPROVED

| 決策ID | 內容與依據 | 影響範圍 | 再批准？／下一步 |
|---|---|---|---|
| A01 | 使用者本次指示：沢村賞NPB一軍綜合五項，可從缺，停止新發舊最優秀投手 | P08、舊producer | 制度否；選數值/模型 |
| A02 | 同指示：P02原SP/ERA/IP含額外IP150保證，部門待遇；舊大賞原文原待遇 | P02/adapter/歷史 | 否；實作前精確槽測試 |
| A03 | 同指示：P02/03/05/06資格/概率/保底不變、P03官方名 | 四賞/RNG/下游 | 否；不使用D1 A/C調參 |
| A04 | 同指示：P04NPB13/KBO10，已有W/L；CPBL/MLB排除 | P04 | 制度否；p/率TBD |
| A05 | 同指示：第一階段HLD，不加HP/救援勝/GS/reliefG | P06/st/UI | 否；第二階段另提案 |
| A06 | 同指示：P08大獎、P01～06部門、P07不加分、MVP正常待遇 | 薪資/HOF/incentive | 分級否；部分文字effect映射另明確 |
| A07 | 同指示：新賞獨立固定draw、原主槽保留、唯一決策、PATCH不重抽 | RNG/journal | 原則否；技術算法/邊界待審 |
| A08 | 同指示：同年league實得P01/02/03三冠保證MVP、保留原MVP槽、無重獎/重付 | MVP/trait/收入/護欄 | 否；不是M0/M1二選一 |
| A09 | 最新指示：不降低門檻，依現行獎項資格/生成公式推導新賞門檻，直接更新設計 | P01/P04/P08設計基準 | 推導方法否；無唯一解的權重/曲線仍待審，尚非實作授權 |

## DERIVED DESIGN BASELINE（本次有效設計值）

- P01 CPBL10/15、KBO12/17、NPB12/17、MLB14/20勝（基本/保證）。基本由ERA3.20反推中性d/wp/ipg及原g下的條件W估值，向上取整且守初版B下限；保證以原SO保證/基本跨度推導並守B下限。B不是現有W獎，估算不是自然球季證據。
- P04基本.650/保證.850，資格NPB13/KBO10不變。中性ERA線對應WP向上.60，再守B .65下限；.85沿現行SP勝率公式上界。CPBL/MLB排除。
- P08錨點W12→17、ERA3.20→2.20、IP143→150、SO155→215、WP.650→.850；資格W13/IP143/ERA≤3.20、NPB1/SP。不要求基本資格同時達全部SO/WP獎項線。保證score100，基本55暫沿初版中格不向下修；後者與模型權重/曲線是不可由門檻唯一推出的待審參數。
- 原A/B/C及Q_A/Q_B/Q_C寬鬆研究留在JSON歷史欄，不再是本版有效資格；JSON activeDerivation與分析末節是新推導正本。既有ERA/SO/SV/HLD線完全不改，0達標不下修。

## TBD（不得作遊戲預設）

| 決策ID | 內容／依據 | 影響 | 再批准？／下一步 |
|---|---|---|---|
| NUM-P01 | 推導基本/保證10/15、12/17、12/17、14/20已更新設計；30+8斜率非唯一推導 | 獲獎/三冠/收入 | 審查曲線與推導假設後另授權實作，不回選寬鬆A |
| NUM-P04 | 固定minW13/10、設計率.650/.850；25+150斜率仍待審 | P04 | 是；不要以NPB0資格下修13或.650 |
| NUM-P08-NORM | 已改為NPB基本→保證錨點12/17、3.2/2.2、143/150、155/215、.65/.85 | 五項component | 設計推導完成；不宣稱統計驗證或唯一最佳值 |
| NUM-P08-WEIGHT | S1等權、S2 15/30/30/15/10、S3 25/30/25/15/5 | 綜合分、重複勝利評價 | 是；S3僅審查起點 |
| NUM-P08-QUAL | 推導版資格W13/IP143/ERA3.20、NPB1/SP及有效五項/L，撤出Q_A/B/C | 基本資格 | 設計已直接更新；實作前確認，不以0資格再調低 |
| NUM-P08-PROB | 保證score100、基本55仍暫沿中格；30+2曲線未定 | 發獎/從缺/大獎 | 是；權重/基本score/p無唯一解，不能假稱推導證明 |
| TECH-DRAW | 穩定哈希/分段編碼/跨平台向量/固定ruleId | 可再現/碰撞 | 技術審查；不增主R，不隨PATCH |
| TECH-TX | 舊main槽journal、award/effect receipt的同步提交細節 | 故障後重試 | 技術審查；先可失敗fixture再實作 |

## DATA GAP

| 決策ID | 內容／依據 | 影響 | 再批准？／下一步 |
|---|---|---|---|
| GAP-NPB-W13 | 新版NPB各輪W最高12，13勝資格樣本0；不是L缺失 | P04數值校準 | 研究另批准；不把13改12 |
| GAP-ELITE | 難度審查各輪q≥66自然一軍缺樣本，固定全力/手術策略偏置 | P08/投手養成 | 新研究需批准；先唯讀trace核對 |
| GAP-MLB-SP | R3僅14季/5Seed，A/B/C W皆0達標；R4無SP | P01/三冠 | 不降到觀測max8，需獨立研究授權 |
| GAP-HP | 無可信reliefWins/HP/GS/reliefG | 第二階段HP | 另案；不造欄位/資料 |
| GAP-HISTORY | 年度S.log無完整league/role分段、舊獎沒有決策鍵 | 過去三冠/跨聯盟 | 不補發、不從球隊名猜資料 |

## UNVERIFIED

| 決策ID | 內容／依據 | 影響 | 再批准？／下一步 |
|---|---|---|---|
| UV-OFFICIAL | D1 CPBL規章404、部分並列細則/MLB子league/KBO完整法條；P08最新版傳統标准未直接核查 | 真實制度描述 | 補官方來源，不拿歷史規則改已批遊戲值 |
| UV-IND | game.js2688INDtop、1356lgN缺、TH fallback靜態路徑；自然異常未驗 | 非目標原槽 | 本案不修、不宣稱自然Bug，另驗需範圍批准 |
| UV-NEW-TX | T01～T50尚無D2遊戲實作，fault/journal不能自然驗證 | 實作驗收 | 後續實作授權後測；不列PASS |
| UV-SAVE | 現行無途中存檔，僅舊狀態fixture及顯示設定 | 相容性說明 | 不復活存檔功能、不稱已恢復save |

## DEFERRED

| 決策ID | 內容／依據 | 影響 | 再批准？／下一步 |
|---|---|---|---|
| DEF-HP | A05正式HP及來源記錄第二階段 | P06 | 是，第二階段新設計 |
| DEF-SUBLEAGUE | 沿四遊戲bucket，不拆セ/パ/AL/NL | 三冠/leagueID | 如果要拆另批准，不推斷旧資料 |
| DEF-SAMPLING | 新seed/高能力對照/通常省エネpilot未批准 | 統計信度 | 別案批准才採樣 |
| DEF-OTHER | 月間/最佳九人/守備/二軍/二刀流/NPC排名/途中存檔 | 未包含範圍 | 不實作、不擴任務 |

## BLOCKER（不解決不能安全完成全部P01～P08實作）

| 決策ID | 阻挡／證據 | 影響 | 再批准？／下一步 |
|---|---|---|---|
| BL-NUMBERS | 門檻已依A09推導更新；權重/基本score/曲線無唯一解，推導假設不等統計定案或實作授權 | 完整發獎政策 | 審查非唯一參數/假設後另授權實作，不重新降低資格 |
| BL-JOURNAL | main draw後fault不可重抽；若無就地journal／副作用receipt證明會多R/多pool/多收入 | 故障/重入 | 技術審查；不得只移completed flag |
| BL-P08-EFFECT（HISTORICAL / SUPERSEDED政策） | 原「沢村特殊保護是否新增」已由最新明示批准取代；當時日文不match中文regex的程式證據仍有效 | P08生涯作用 | 現為政策RESOLVED；精確接入/receipt與验收TECH REVIEW REQUIRED，見第14節，不泛化其他賞 |
| BL-IDENTITY | HOF目前沢村不分支，官方P03不match舊regex，新P04未認；舊大賞不可映射P02/P08 | 工資/HOF/去重 | 實作必修adapter；待遇數值已定，不再提出D-KEEP |
| BL-AUTHORITY | 本次純設計，明文禁止遊戲修改/commit/push | 後續工程 | 使用者審查及實作授權後才能開始 |

## 審查結論

八項制度加A09不降門檻推導方法已固定，M1不再待選；P02150與SP、P05CL/P06MR不改。D1歷史保留；新增數值直接更新為現行門檻錨點推導版，權重/基本score/概率仍待審。數據不足不作降門檻理由。遊戲T01～T50全PLANNED，文件/離線分析不當遊戲PASS。

下一步：使用者先審P01/P04數值及P08五項尺度/模型/資格/曲線、P08文字護欄，再完成技術journal/draw向量審查；不重新表決已批准A01～08，不自動實作或新採樣。無Commit/Push/部署，VERSION/main不變。

## D2.1 決策與證據補充（2026-10-13）

此前DATA GAP與數字是當時四輪樣本快照，不改寫成全玩家結論。最新[模型比較](../reviews/PITCHER_AWARDS_D21_MODEL_COMPARISON.md)、[原始核對與計算](../reviews/pitcher-awards-d21/analysis.json)保留前後對照。以下APPROVED是使用者批准/確認，不代表產品已實作。

|ID|狀態|內容／證據|影響與下一步|
|---|---|---|---|
|D21-REPORT-ALIAS|APPROVED|使用者確認RESEARCH_REPORT(1).md即八條自然生涯報告，使用現有路径不複製|報告引用已解決|
|D21-NATURAL-8|UNVERIFIED（整體平衡）|原8生涯/8儲存重播原始資料俱全、artifact深比較PASS；CPBL/KBO有達標，NPB兩目標路線無P08入口，MLB一條無樣本另一條8季未達|自然研究＋重播＋離線資格＋實際舊honors分列；不是新獎產品PASS，也不是REPORT_ONLY；不把統計不足寫成FAIL|
|D21-MOBILE-SP|APPROVED|使用者確認1.10.3/q77bi1jx/2039年度SP，非由退休角色推定|MANUAL_MOBILE_EVIDENCE；沒有trace，不能驗1.11.9再現|
|D21-MOBILE-QUAL|UNVERIFIED（新版產品）|手機G26/W15/L7/IP180.1/SO165/ERA2.35、有效NPB1/SP與五項/L/分母；離線P08入口已符合|證明舊版高成績案例，不稱新沢村已取得；display-rounded estimate|
|D21-NO-LOWERING|APPROVED|最新統合指令維持P01～P08基本门槛；不能據兩條NPB策略無達標或CPBL/KBO達標降低NPB|保持W13/IP143/ERA3.20与其它基础值；基本55仍候選非正式數值批准|
|D21-LEGACY-ALL|APPROVED|使用者明確確認四聯盟停止新發舊最優秀投手，P02承接原主槽、P08只NPB|不列OPEN；歷史舊名/大獎待遇不改，非刪除歷史，非實作授權|
|D21-IP-SATURATION|PROPOSAL|150飽和、180與200同分已算；150對照/180/190/200滿分候選比較|保持入口143；優先審190，不能自行上線或稱官方標準|
|D21-GUARANTEE|PROPOSAL|G100需五項全滿；100/95/90或90+四項component80敏感性|95可優先討論，自然資格缺樣本不直接定案；新保底非授權|
|D21-WEIGHTS|PROPOSAL|原S1/S2/S3保持，無新增覆寫；S3為審查起點|沒有已批准模型；名義權重與IP尺度效果分開|
|D21-PROBABILITY|PROPOSAL|基本55、原30+2(score−55)、cap95%維持比較控制，保證點改100%|斜率/取整/端點未定，不能把分析概率當實得|
|D21-PRECISION|PROPOSAL|工具理論55浮點首跑FAIL，明加1e-10容差後±1e-7/上下界測試通过；IP保持十進位、ERA顯示丸め敏感性|產品精度仍需決定，未改產品或放寬異常預期|
|D21-ELITE-SAMPLE|UNVERIFIED|新版NPB自然資料沒有P08合格季，手機版本不同不能合併；MLB樣本少|不說100不可達/95一定太易；不自動補採樣|
|D21-IMPLEMENTATION|BLOCKER|此任務明文文件/離線分析，尚缺模型與技術批准|不改遊戲、主R、VERSION、CURRENT_SPEC、BACKLOG、CHANGELOG；不Commit/Push/merge/deploy|

待批准參數：IP滿分位置、S1/2/3、基本55、G100/95/90/四項條件、機率曲線與精度、獨立draw/交易技術；舊賞四聯盟方針已APPROVED不再問。P08額外護欄等原BLOCKER仍保留，未藉本次模型研究變更薪資/MVP/HOF/traits政策。完成停止等待審查。

## D2.1參數定案（最新；先前同ID狀態為HISTORICAL）

|ID|目前狀態|決策|
|---|---|---|
|D21-IP-CAP|APPROVED / DESIGN_ONLY|IP180滿分，基本資格143不變|
|D21-WEIGHTS|APPROVED / DESIGN_ONLY|原S3 W25/ERA30/IP25/SO15/WP5；使用者確認沿用既有，撤除本次指令20/30/25/20/5筆誤|
|D21-GUARANTEE|APPROVED / DESIGN_ONLY|基本資格通過且總分≥95保證；不是五項皆≥95、不加四強項附條件|
|D21-PROBABILITY|PROPOSAL|基本55、30+2(score−55)、95%概率上限未批准；低於95如何發獎待決|
|D21-PRECISION|PROPOSAL|產品取整/浮點邊界/容差未批准，分析assert精度不升格產品政策|
|D21-ELITE-SAMPLE|UNVERIFIED|新版自然頂尖樣本不足，不能宣稱定案模型平衡已驗收|
|D21-IMPLEMENTATION|BLOCKER|僅設計文件批准，未授權修改產品|

A01～A09及四聯盟舊賞處理APPROVED保持：P02承接舊主R槽與既有資格/概率/保底；P08僅NPB、與P02獨立；P07實得同年同聯盟三獎才保證MVP；歷史舊獎原名/大獎待遇不變，基本門檻不降低。不重新表決已批准制度，不將產品待辦結案。

IP190/G100保留在歷史敏感性，不再選定。手機案例OFFLINE_ESTIMATE 68.7955、舊候選p57.5909%，仍非保證、非1.11.9重播/新獎產品PASS。57項離線PASS、原8組儲存重播分類保留，不新增生涯。待批准只剩基本分/曲線/上限/精度與技術/實作授權等原BLOCKER；IP/權重/保證線不再待選。未Commit/Push/部署。

## B2 FINAL：最新批准決策（此前同ID/待批狀態為HISTORICAL）

|ID|狀態|批准或保留內容|
|---|---|---|
|D21-IP-CAP|APPROVED / DESIGN_ONLY|IP143→180滿分，基本資格143保持|
|D21-WEIGHTS|APPROVED / DESIGN_ONLY|原S3 25/30/25/15/5|
|D21-GUARANTEE|APPROVED / DESIGN_ONLY|合格總分≥95保證|
|D21-B2-BASIC-SCORE|APPROVED / DESIGN_ONLY|基本評分60|
|D21-B2-START|APPROVED / DESIGN_ONLY|score60起10%，跳點預期|
|D21-B2-SLOPE|APPROVED / DESIGN_ONLY|每分+2.5百分點|
|D21-B2-CAP|APPROVED / DESIGN_ONLY|非保證機率上限95%|
|D21-PROBABILITY|APPROVED / DESIGN_ONLY|資格先行，60以下0、60～未95 B2、95起100；不平滑跳點|
|D21-PRECISION|PROPOSAL / BLOCKER|未取整設計基準已明定；產品容差/顯示取整/整數抽選/精度未批准|
|TECH-DRAW / TECH-TX|PROPOSAL / BLOCKER|hash/固定向量、journal/receipt/故障恢復未批准|
|BL-P08-EFFECT（HISTORICAL / SUPERSEDED政策）|政策RESOLVED；接入未完成|原「未批准」已由P08-PHOENIX-DEMOTION-PROTECTION取代，保留歷史技術缺口|
|D21-ELITE-SAMPLE|UNVERIFIED|新版自然頂尖樣本平衡未驗證|
|D21-IMPLEMENTATION|BLOCKER|產品實作/版本發布未授權|

A01～A09及其他獎項/主R槽/舊待遇全部保持。手機score68.7954545455/B2 p31.98863636%為OFFLINE_ESTIMATE，非產品實得；舊p57.5909%保留HISTORICAL。70項離線PASS不等遊戲RNG/產品PASS。不Commit/Push/merge/deploy或新採樣。

## 2026-10-14：P01/P04 CURVE_B與P04 NPB12勝決議

- P01-CURVE-B：APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED，CPBL10/15、KBO12/17、NPB12/17、MLB14/20保持；基本區20+75(W−B)/(G−B)%、保證100%。
- P04-CURVE-B：APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED，只NPB/KBO，raw WP.650/.850；基本區20+300(WP−.650)%、保證100%，原生安全整數W/L及sum>0。
- P04-NPB-MIN-W12：APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED，使用者明示將13改12；KBO仍10。此決議取代A04舊13/10及NUM-P04/GAP-NPB-W13「不得降到12」的歷史界線，不是工具擅自批准。
- P01/P04原A：HISTORICAL / SUPERSEDED，不再待選；原13勝離線矩陣完整保留、新12勝另存，版本/策略不混合。
- P07/P08：UNCHANGED，P04不參與P07；P08最低13勝保持，不隨P04調整。已批准薪資/HOF、舊待遇不改。
- PRODUCT IMPLEMENTATION：NOT AUTHORIZED。精度/hash/向量/journal/receipt/故障恢復與發布仍為技術BLOCKER；原「P08是否新增護欄」已SUPERSEDED，政策及範圍依下方最新批准，接入驗收仍待審。未Commit/Push/部署。

## 2026-10-14：P01～P08六項技術審查與P08保護批准

基準dev `7220ad82002801d3dea5fedae80d0fb3d7a0433f`／VERSION1.12.0。使用者已確認最小範圍「照此記入設計」。詳細程式行號、方案比較、故障點及TR01～TR14見[主設計第14節](PITCHER_AWARDS_PHASE1_DESIGN_D2.md#pitcher-awards-technical-review)，本紀錄不重複完整設計。

|ID|最新狀態|決議／證據與限制|
|---|---|---|
|P01-CURVE-B|APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED|CPBL10/15、KBO12/17、NPB12/17、MLB14/20，20+75×進度%，保證100；保持|
|P04-CURVE-B／P04-NPB-MIN-W12|APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED|NPB12/KBO10、raw WP.650/.850，20+300×差值%，CPBL/MLB排除；保持|
|P08-PHOENIX-DEMOTION-PROTECTION|APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED|glass且未phoenix時移除glass、取得phoenix、pool＋8生涯一次；只P08獲獎當年度movement降格／戰力外判定保護。不是每次＋8或所有得主無條件＋8，不永久抗降格／保證續約／免退休|
|BL-P08-EFFECT|POLICY RESOLVED / TECH REVIEW REQUIRED|政策不再待問；接入原big/wonAward的精確P08 adapter及一次receipt未完成。既有中文regex不整體修復、其他賞既有實際待遇不變|
|TECH-DRAW|TECH REVIEW REQUIRED / PROPOSAL|同步FNV1a32＋固定avalanche、UTF8長度分段、u32/2^32建議；SHA256替代。算法/向量/編碼未批准或測試|
|D21-PRECISION|TECH REVIEW REQUIRED / PROPOSAL|binary64未取整＋固定運算順序＋嚴格比較推薦；整數概率/BigInt等替代未批准；分析epsilon非產品政策|
|TECH-TX／BL-JOURNAL|TECH REVIEW REQUIRED / BLOCKER|逐主槽journal、多欄位trait/effect receipt，draw後與UI後分開；只允測過同步邊界，不能宣稱任意throw/OOM或reload可恢復|
|TR-B03-SEASON-RESUME|BLOCKER（靜態風險，非自然重現）|active phaseEnd的早context/paid return與whole proSeason累計重入風險，需有效fixture/fault證據及限定接入授權；本次不修遊戲|
|BL-IDENTITY|TECH REVIEW REQUIRED / BLOCKER|P08 HOF缺語義分支，新P03/P04/其他全名consumer可能漏判；另有現行復活/降格日文名稱缺陷，拆為下方兩個Bug ID，不混為P08未來風險；精確alias保留旧名、旧大賞不等P02/P08；不改历史honors|
|D21-ELITE-SAMPLE|UNVERIFIED|自然頂尖平衡仍欠樣本，本次不採樣|
|GAP-HISTORY／GAP-HP|DATA_GAP / DEFERRED|無可靠過去league/role分段與receipt、無HP/reliefWins；不補造|
|D21-IMPLEMENTATION／BL-AUTHORITY|NOT AUTHORIZED|未授權產品實作或發布；不Commit/Push/Merge/Deploy、不Quick/Full CI|

P02/03/05/06資格/機率/保證/主R槽全保持，P07同年同league實得三項保證MVP一次，P08IP180/S3/B2/G95與W13不變。原B2數學/研究數據不重算，不改其當時實測證據。政策批准不是技術算法批准或產品PASS。

驗證範圍（先前六項審查快照）：只文件靜態檢查與檔案hash，77個本地引用/anchor PASS，TR01～14唯一及14項PLANNED標記PASS。第一次檢查器split截短章節造成0項FAIL，修正為slice後通過；沒有改測試案例掩蓋問題。689檔案中僅本兩份文件hash改變，其餘687個保持，無新增/移除路徑。git diff --check PASS（本兩檔untracked另檢內容），branch/HEAD/main與前後git status --short清單保持。所有產品TR01～TR14及T01～T50維持PLANNED / NOT_RUN；没有RNG/hash向量產品測試、fixture、Quick/Full/CI/Preview或新生涯。本次只改主設計與本決策紀錄，保留之前五檔設計／工具更新和所有平行未追蹤成果。不Commit/Push/Merge/Deploy。

## 新發現獎名Bug：D2技術BLOCKER補充（2026-10-14）

- BUG-AWARD-PHOENIX-JP-01：P1 / BLOCKER / NOT_FIXED。現行最佳投手／打擊王／全壘打王與日文producer不一致，對應日文賞單獨取得時漏big判斷。復活適用集合與降格集合分開，不把Gold Glove或All-Star加進復活。
- BUG-AWARD-DEMOTION-JP-01：P1 / BLOCKER / NOT_FIXED。最優秀投手賞／首位打者／ゴールデングラブ賞不命中旧中文wonAward；active overlay仍呼叫LEGACY.movement。goodReal另有保護，不能將漏判稱必然降格。
- 證據等級：VERIFIED STATIC MATCHING／有效呼叫來源；14個文字比對＋1個委派檢查PASS，原source只讀、無S/R/遊戲執行。自然重現Seed/全流程影響UNVERIFIED，不能標完整產品PASS。
- P08：仍APPROVED / DESIGN_ONLY / NOT_IMPLEMENTED，沢村／澤村是未來接入風險，不是現行自然受害案例。修現行漏判與接新P08分開驗收，不泛化新P02或所有部門的保護待遇。
- 修正提案：分開的精確效果白名單/alias、排除All-Star、保留同年度與glass/phoenix條件及一次receipt。完整降格集合與舊狀態尚未結算的處理邊界需審查；不追溯補8點、不改歷史honors。技術審查納入不等產品修復授權。
- AN01～AN05：PLANNED / NOT_RUN，原生對應獎項效果、無資格/All-Star、多賞/重試、active movement、固定Seed/因果S-R回歸；詳[主設計14.11](PITCHER_AWARDS_PHASE1_DESIGN_D2.md#legacy-award-name-blockers)。不在本次執行產品測試/Quick/Full CI。

本次仍只更新兩份既有設計文件；branch dev／HEAD7220ad82002801d3dea5fedae80d0fb3d7a0433f／VERSION1.12.0保持。未修改BACKLOG、CURRENT_SPEC、VERSION、CHANGELOG或遊戲，不Commit/Push/Merge/Deploy。先前文件/工具與平行成果保留。

## D2 Technical Finalization — AF01–AF08 Approved / AF09 Not Authorized

批准日期：2026-10-14。使用者明示批准AF01～AF08技術方案及其限制，僅DOCUMENTATION_ONLY。基準dev `7220ad82002801d3dea5fedae80d0fb3d7a0433f`／VERSION1.12.0；不修改現行產品規格、不授權遊戲工程、提交或發布。

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


正式技術規格見[主D2第14.13節](PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-technical-approved)，不改TR-B01～TR-B05編號／定義。A01～A09、P01 CURVE_B各聯盟線、P04 NPB12／KBO10／.650／.850、P02沿原ERA槽、P07實得同年同聯盟三冠保證MVP及P08 IP180／S3／B2／G95／特殊保護均不重設。

AF04：原R結果必須已RECORDED才支援故障續行；R與record間隙、OOM、Proxy／getter、host crash不可證時AMBIGUOUS停止，不重抽／不回滾R。AF05：多欄位before／after證據、phoenix共享生涯一次gate，冲突CONFLICT停止；不推造已付歷史漏款。
AF06：付款後續畫／選項／交接分離；不重跑proSeason。只支援同頁同S限定恢復；不承諾任意startYear／phasePre、跨頁重載、瀏覽器關閉恢復或完整存檔。
AF07：精確穩定ID／完整consumer矩陣，復活與降格資格分開；只批准最優秀投手／首位打者／本塁打王三復活對應與最優秀投手／首位打者／GoldGlove三降格對應的修正設計，未修改程式。LEGACY_BEST_PITCHER與PITCH_ERA／PITCH_SAWAMURA不得合併。
AF08：未知歷史個人賞只讀原文、不猜效果；不補phoenix+8、不重算已支付薪資／合約、不重抽歷史、不全改honors；範圍外國際／團隊consumer與舊同年度跨聯盟保護保留，衝突停止詢問。
AF09：NOT_AUTHORIZED。正式產品NOT_IMPLEMENTED；F-A04／A06／A07、F-B01～12、F-YEAR、F-GV、F-ID01～12及產品跨環境／PC手機／固定Seed驗收全部PLANNED / NOT_RUN。已有模型與原生限定驗證是历史證據，不是本次新產品PASS。兩日文BUG REPRODUCED / NOT_FIXED。

本次僅兩份文件；來源候選书、兩份驗證報告／results及原始研究不修改。技術定案不解除Runtime BLOCKER，不改CURRENT_SPEC／BACKLOG／VERSION／CHANGELOG，不執行產品測試、CI或Git提交。

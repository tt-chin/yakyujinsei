# 第五階段：可獨立驗收的重構／補證據路線

日期：2026-10-11；dev受驗基準 `1dacc55e24eca42bea9a2ad98adf82db2507f7ad`，VERSION1.11.4。依[稽核報告](STAGE5_SPEC_ARCHITECTURE_AUDIT.md)，只提出方案，**沒有批准或開始下列實作**。工量是單人專注工作估計，非保證時限，實際依失敗案例調整。

## 批次與依賴

| 批次 | 目的／受影響位置 | S／RNG／契約風險 | 獨立驗收與工量 | 前置／批准 |
|---|---|---|---|---|
| R0 規格引用修復 | SPEC-SOURCE-LINK-01；CURRENT_SPEC157/182/194/342及歷史快照標題；不改數值 | S/RNG/契約0，須保留歷史原文與刪檔決定 | 5失效本地link各有可信目的地，schema/數值不變；quick；0.5–1日 | 可獨立；使用者批准文件整理後執行，不復原已刪task |
| R1 配分實動補驗 | AUD-03B；game allocUI676、addAb395、allocDone1058；tests能力专用E2E | Undo缺key→0是否影響touched／確定；dice重用／R0；pot不是cap | pool/dice×P/IF×三尺寸、鍵盤、cap80/剩0/成本邊界、combo/late、Undo/reset完整S+閉包+R trace；1–2日 | 可獨立；先批准補驗；如確認Bug另提交最小修正及PATCH方案，不能自行改key語意 |
| R2 年度／簽約失敗調查 | STATE-TRANSACTION-AUDIT-01；phaseEnd3060、signTo2812、fixedContract2810、runChoiceAction U:10 | CORP重入guard／signTo中途throw部分寫入，不能清空已成立保障或回撥R掩蓋失敗 | native有效情境下二次settle、throw前後S/收入/ct/queue/token、錯誤恢复後操作；KBO真floor/cap衝突、不為變綠調薪；1–2日 | R1可並行邏輯上獨立（本文件不要求啟動代理）；先批准測試，發現確切遊戲Bug後另批准修復 |
| R3 純顯示模型抽離 | G buildRecordViewModel612/buildAbilityViewModel614/buildTraitsViewModel615/buildCareerViewModel617；現U/record-view/ability-view/player-detail/salary-detail | 中低；讀取salary/orgTeam getter與ct normalize的副作用必須排除；不得把DOM listener搬丟 | 原新VM deepEqual、全tab DOM/ARIA/empty/25決定/35年度、三尺寸、read S/R0；quick＋相關full UI；1–2日 | R0與資料schema說明後；需明確批准抽離，只移純讀函式，不全面重設S |
| R4 引擎入口／binding顯性化 | G overlay2645、32覆寫、LEGACY2648、advance alias2790；新增可測adapter界面候選 | 高；capture原函式與讀新binding不同，callback/queue/closure生命期不可換 | 覆寫身分與每主流程call trace，P/IF全人生每步S/選擇/R值列、ACT/KBO/contract E2E；2–4日 | R1/R2/R3補證據後；先批准小範圍adapter，不一批搬全部G |
| R5 合約決策與記帳界面 | candidate2714→signTo2812/fixedContract2810；pending2739；FA3026；policy模組保留 | 高；來源snapshot清0、jitter team排序、重入/paid/extension、同年決定與schedule語意 | 既有381矩陣、KBO10、draft18、重繪/拒絕/trueFA/release、R trace，保障/收入逐年一致；2–4日 | R2/R4；需批准；不得「統一年資」或重算已簽年表、不改薪資政策 |
| R6 年度協調器候選 | startYear2961／phasePre725／phaseMid827／proSeason1227／phaseEnd3060 | 最高；form、RNG、champ快照、TJ/交易/POST、pay的順序高度耦合 | 全年queue順序、skipMid全休、PRE/POST、次年contract有效、seed和每R值列，full全部預定入口；3–5日 | R4/R5；需另批准，一次只抽一個phase，不修改日程制度 |
| R7 舊市場刪除判定 | CONTRACT-LEGACY-01；makeOffers1716、pickOfferUI1707、舊faMarket/cross、舊市場常量 | 高；它們與仍活extensionOffer1751鄰近；混用舊team string/bonus邏輯可能破壞契約 | 建立scope-resolved靜態引用＋runtime coverage（draft/FA/release/cross/renew/extension）、全S/R軌跡一致、原fixture fail/pass；1–3日 | R4/R5後，證明前只保留；即使證明也要明確批准刪除，不把沒命中coverage當不可達 |
| R8 全規格殘餘矩陣 | AUD-02/AUD-04/AUD-05：ovr全部守位/round、tournament所有資格、全顯示參數/實機、封存核對 | 測試低、政策高；封存不是新預期，HOF/OVR設計決策不同於Bug | 每個UNVERIFIED指定原生fixture或實機證據，逐列升級MATCH；按功能0.5–2日，實機另排 | 可先補任何純測試；要改OVR/HOF/traits制度需個別批准；不跑4000除非另外授權 |

推薦起步：R1/R2補證據→R0文件引用→R3低耦合讀取模型；**不要把表順序解讀成自動開始第六階段**。R4–R7只有在相應等價門檻達成與明確授權後才可實作。任何批次發現未核准政策矛盾先停並提案。

## 共通驗收門檻

1. fetch當時最新dev、記錄完整基準SHA／VERSION／工作樹；本文件SHA僅本次調查基準，不硬編碼為所有未来測試oracle。
2. 修改前先證失敗／記錄基準；不以改期待金額／删歷史oracle／忽略R值掩蓋問題。原始ACT故障完整選擇史仍不足，不能用新路線宣稱精確重現。
3. pure module不得引用DOM或隱式R；若注入R，call次數、值與順序必須完全同基準。N0消耗4R、育成bonus仍消耗原ri、FA僅排序後入選team jitter不能改。
4. 等價檢查同時包含S、contract schedule/收入、實際選擇DOM與歷史、stepQ、token/generation／局所cache的可觀測行為。callback閉包不能靠JSON.stringify(S)證明等價。
5. 執行Runner quick；engine/structure變更跑適用full、P/IF完整人生／RNG逐步比、PC1280/320/390、Console/JS-CSS404。未執行/實機缺環境保留BLOCKED，不將手機尺寸模擬算Safari實機。
6. 分批commit dev→Preview→使用者確認；無批准不main／不正式部署。文書／測試／真正不改行為的重構不升版；已確認的遊戲修正依當時AGENTS更新PATCH與CHANGELOG。

## 暫不採取

- 不全面重新設計S、不將所有legacy函式一次搬入類別、不建立新框架／npm依賴。
- 不合併event與一般能力cost、不共用FA／foreign／goldcloth年資、不用新curve取代固定schedule。
- 不恢復save/load、rv/rules、舊引擎或亞洲名額／球團預算；不把HOF平衡假說直接套用。
- 不裁切event／salary decision結果字典以「省記憶體」而破壞生涯記錄；有實際資源證據才另提案。
- 沒有足夠四聯盟自然樣本，不能以人工HOFfixture通過批准新平衡政策。4000生涯是獨立長時間研究，需另外批准範圍與環境。

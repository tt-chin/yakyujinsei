# 特性說明顯示統一驗收（TRAIT-DISPLAY-UNIFY-01）

## 基準與批准範圍

2026-10-12，dev；開始HEAD／origin/dev為`a0b880bb7e7fe74e743daa0cb8144455c9fdded2`、1.11.6；main為`e886e84ca08c6c185406cac9d6f3c4376277061a`、1.11.4。tasks/fix.md及使用者後續確認為本次顯示授權：只有真正取得當下顯示原因／效果，之後包括歷史結果卡只顯示名稱；退休取得可有獨立解鎖卡，總結／分享只名稱。使用者明確拒絕測試Draft PR；不得用此前任務的PR批准代替。

僅UI文案與呈現生命期；沒有修改取得條件、效果、S結構／值、RNG、契約、年俸、成績、退休／殿堂政策、Seed URL。VERSION的metadata差異在比較中單獨排除，不排除任何traits或其他S欄位。未追蹤tasks文件保留、不加入提交或刪除。

## 顯示及修改位置

- [game.js](../src/engine/game.js)：buildTraitsViewModel只回名稱；退休posT移除intlace段落，原缺漏的iron名稱附於正面名單末尾，其他名稱次序／色彩不變；shareImage移除額外eventTraitLines及對應高度，保留既有名稱tag、刪除線、四主題、所得／成績／分享按鈕。
- card→traitResultMarkup辨識既有解鎖／稱號／標題，使用TRAIT_LABELS與動態traitLabel。以WeakMap(S)記錄UI是否已展示，不寫S或存檔；newState僅初始化這張UI紀錄。預先已有特性的相容S不重新展示解鎖，removeTrait只同步UI紀錄以允許真正再取得。
- 成功加入DOM後才記已展示；同一特性重繪不再附解鎖說明。神カード歷史標題在該解鎖呈現為正式名稱フランチャイズプレーヤー，不修改trait ID或条件。
- archiveTraitResults僅將標記的取得／失去結果卡換為名稱。選項通過runChoiceAction檢查後由invokeChoiceAction歸檔；有效配分／確定、主頁導航、退休分享亦結束「取得當下」。**生成下一選項或過期callback不提前移除剛取得說明**。退休新增解鎖卡保留至上述操作，總結／PNG從一開始就只有名称。不複製#log/#act、不重新執行事件或listener。
- [navigation.js](../src/ui/navigation.js)：選頁前可選onNavigate callback，供DOM歸檔；預設no-op，原tab／可操作選項保持。
- 保留TRAIT_TEXT／EVENT_TRAIT_TEXT資料。既有完整intlace解鎖不重複追加；給缺效果的goldcloth／confidante補既有說明，紀念稱號明示無額外能力效果。event解鎖補取得原因及後續判定／下一季生效時間；mrteam補既有球團拒絕交易，onetool補既有起用補正。franchise舊文宣稱所有再契約固定1.2以上，但現行FA殘留乘數為1.04、舊termParams另有1.2下限；改為不混用不同係數的契約／引退評價補正及拒絕交易說明，**所有實際乘數／公式不改**。未知效果不推測。

## 全38 ID清查

共用清單入口：buildTraitsViewModel→renderTraits；退休posT／removedTraitLabel；PNG traitNames→keepTr/remTr。名稱正本TRAIT_LABELS／traitLabel；沒有特性明細的Seed／Replay分享文字不新增效果。表中「既有card」指game原文字，不是新的效果政策。

| ID | 名称 | 取得／说明来源 | 清查结论 |
|---|---|---|---|
| favorite | 監督のお気に入り | eventTraitUnlocks／EVENT_TRAIT_TEXT | 原因＋既有效果 |
| adking | 広告王 | eventTraitUnlocks／EVENT_TRAIT_TEXT | 原因＋既有效果 |
| genius | 天才 | phasePre／既有card | 保留完整解鎖 |
| glass | スペランカー | rollInjury／既有card | 保留完整解鎖 |
| iron | 鉄人 | proSeason／既有card | 解鎖保留、退休補漏名称 |
| scum | クズ男 | loveCaught系／既有card | 保留原因與能力代償 |
| late | 大器晩成 | allocDone／既有card | 保留今後生效文 |
| disc | 自律の鬼 | eventTraitUnlocks／EVENT_TRAIT_TEXT | 原因＋衰退開始延後 |
| academy | 理論派 | 舊amateurSeason／既有card | 清單可渲染；現行自然取得路線未證明，不啟用舊邏輯 |
| intlace | 国際大会の鬼 | processIntlPhase／INTLACE_UNLOCK_TEXT／TRAIT_TEXT | 取得當下、次次出場生效；去常設／PNG說明 |
| franchise | フランチャイズプレーヤー | LEGACY.movement／既有card | 正式名称；不同契約係數不再誤說全固定1.2，計算不改 |
| clutch | 強心臓 | eventTraitUnlocks／EVENT_TRAIT_TEXT | 原因＋既有效果 |
| phoenix | 復活 | awards／既有card | 解除glass及當次能力點保留 |
| combo | 小細工無用 | allocDone／既有card | 保留得意能力與季前骰說明 |
| onetool | 一芸特化 | proSeason／既有card | 補既有起用補正，不修改1.25計算 |
| rubber | ゴムゴムの腕 | afterGamble／既有card | 保留50→100、55%→85%；失去卡亦有顯示生命期 |
| legend | 歴史に残る名選手 | retireScene／既有card | 聯盟修飾保留、紀念稱號 |
| yips | イップス | handleDemotion／traitCard | 保留評價−3及解除條件；失去只保留名稱 |
| distract | 私生活多忙 | eventTraitUnlocks／EVENT_TRAIT_TEXT | 原因＋既有效果 |
| cancer | チームの癌 | eventTraitUnlocks／降格拒否／既有card | 原因／效果來源保持，歷史只名稱 |
| ambience | 問題児 | midTrade／既有card | 保留原因與交易率說明 |
| goldcloth | 黄金のユニフォーム | checkGoldclothSeason／movement／TRAIT_TEXT | 一軍年資不改、補無能力效果 |
| thief | 給料泥棒 | checkDemotionRefused／既有card | 保留失敗率說明 |
| mrteam | ミスター | LEGACY.movement／既有card | 球團愛稱保留、補非売品效果 |
| confidante | 女友達止まり | love路線／TRAIT_TEXT | 保留原因、補紀念稱號 |
| smallschool | 弱小校の星 | LEGACY.endGame／既有card | 不決定B→3、不補舊出生資料；名稱與既有取得狀態保留 |
| grinder | 頑張り屋 | LEGACY.endGame／既有card | 沿用1.11.6出生快照，明示紀念稱號 |
| rainbow | 渡り鳥 | LEGACY.movement／既有card | 聯盟名稱保留、紀念稱號 |
| taiwan | 侍ジャパンの魂 | 舊maybeIntl／既有card | 現行自然取得路線未證明；不復活舊召集邏輯 |
| oldghost | ベテランの意地 | awardTraitUnlocks／TRAIT_TEXT | 翌季一度效果資料保持 |
| miraclegen | 奇跡の世代 | cupOnce／TRAIT_TEXT | 原高校4冠及紀念稱號保持 |
| strongpitch | 若き剛腕 | awardTraitUnlocks／TRAIT_TEXT | 年齡／聯盟及紀念稱號保持 |
| stronghit | 若きスラッガー | awardTraitUnlocks／TRAIT_TEXT | 年齡／聯盟及紀念稱號保持 |
| championmaker | 優勝請負人 | DEFERRED_TRAITS | 不實作、只測渲染相容fixture |
| latepractice | 練習遅刻常習犯 | eventTraitUnlocks／EVENT_TRAIT_TEXT | 原20次安全失敗與後續效果保持 |
| pitcherTC | 投手三冠王 | DEFERRED_TRAITS | 不實作、只測渲染相容fixture |
| hitterTC | 打撃三冠王 | awardTraitUnlocks／TRAIT_TEXT | 年度／聯盟修飾，既有效果保持 |
| nitenichi | 二天一流 | DEFERRED_TRAITS | 不實作、只測渲染相容fixture |

全ID渲染fixture不代表38項自然取得；35個非deferred項目中的歷史路線與未決smallschool不因此取得新的實作授權。這些限制保留於AUD-02／REFACTOR-AUDIT-01及TRAIT-SMALLSCHOOL-SEMANTICS-01，不新增能力效果或取消guard。動態效果發動的訓練／故障／成績結果不是特性摘要，不因本次顯示規則刪除正常事件內容。

## 測試與基準

Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39。外部Playwright以參數傳入、不新增npm依賴。桌面1280、手機模擬320／360／390；不是iOS或Android實機。

新增tests/trait-display-e2e.mjs，manifest只登錄為Full／Audit，180秒估時，不加入Quick。Runner／CI workflow／既有分類不改。既有championship-intl-e2e保留取得時及下一次生效／不變性斷言，只將三個常設／退休／PNG效果預期改為名稱存在且說明不存在。

ui-foundation.test保留session／live／單次確定／allocDone順序斷言，加入經guard後的archiveTraitResults呼叫；hof-first-ballot-league僅更新既取得F10的名稱卡預期，所有31案S／RNG／投票及負面925987d來源保留。verify-modularization只同步1.11.7版本，RNG固定值不改。

display-preferences-e2e保留全部S／RNG／選項與非特性文字比較。只在**detached DOM clone**將已批准的取得／失去卡歸一為名稱、移除原intlace常設段落、補旧摘要缺漏iron，再比較其他全文（文字空白正規化）；沒有把整段log或traits從S排除。新專項獨立驗證實際38名稱／無效果清單與profile、PNG及未改造原game的完整S/R值，不能用正規化掩蓋缺漏。

```sh
node tests/trait-display-e2e.mjs --source=baseline --playwright=<PW> --output=test-results/trait-display-before
node scripts/test.mjs full --only=trait-display-e2e,trait-system-e2e,championship-intl-e2e --baseline=a0b880bb7e7fe74e743daa0cb8144455c9fdded2 --playwright=<PW> --output=test-results/trait-display-focused
node scripts/test.mjs quick --baseline=a0b880bb7e7fe74e743daa0cb8144455c9fdded2 --playwright=<PW> --output=test-results/trait-display-quick-current
node scripts/test.mjs full --baseline=a0b880bb7e7fe74e743daa0cb8144455c9fdded2 --playwright=<PW> --output=test-results/trait-display-full-final-v3
node scripts/test.mjs full --only=ui-foundation.test --baseline=a0b880bb7e7fe74e743daa0cb8144455c9fdded2 --output=test-results/trait-display-full-static-recheck
node scripts/test.mjs quick --baseline=a0b880bb7e7fe74e743daa0cb8144455c9fdded2 --playwright=<PW> --output=test-results/trait-display-quick-final
```

- 修正前四個尺寸清單說明斷言均FAIL，0 PASS／4 FAIL／Console與404為0；保留JSON，不把正常舊顯示改寫為PASS。
- 初次新專項10 PASS／4 FAIL為跨行innerText斷言缺少dotAll，內容正確；修正測試換行匹配後14 PASS。沒有修改能力／效果預期。另同步測試cleanup退出方式與現有Stage6／Stage10 harness使用法，避免完成後掛住；早期未完成後續Quick不計PASS。
- 新補的stale callback最小測試在四尺寸0 PASS／4 FAIL：S沒有變，但舊callback在token檢查前觸發說明歸檔。歸檔移至有效操作後，**相同四案4 PASS**，S/R及下一有效選項保持。明示保存／呼叫舊listener的UI測試，非聲稱自然玩家已遇到此錯誤。
- 首次Full在display-preferences遇到舊oracle要求歷史特性說明永久留存而FAIL，差異只在log文字；ACT及381契約案已PASS。為加入上述有效操作護欄及文字相容投影而中止，記錄保留於trait-display-full-final，**NOT_COMPLETED**，不稱完整Full PASS。v2為補最後的既取得相容案例而停止，亦NOT_COMPLETED；最終另以trait-display-full-final-v3完整重跑。
- 既取得legend相容狀態的四尺寸測試0 PASS／4 FAIL→4 PASS：retireScene僅保存進入時是否已取得，既取得卡改為名稱／空說明，不改新取得條件、legendLeague或投票。hof-first-ballot-league仍31案PASS；只為F10既取得卡套用批准的名稱預期，所有S/R與其他投票卡斷言不變。新專項總數由14增加至18，不回改早期14案報告。
- 專項包含38名稱×4尺寸、正負／失去／重繪／相容資料、取得卡延後歸檔、退休新grinder／總結、PNG、唯讀S/R及完整生涯。所有資料保留於test-results指定輸出；最終Quick／Full、提交、CI／Preview結果在BACKLOG的本輪驗收節補記，不以此中間工作樹報告冒充最終CI。
- 最終完整本機Full（1.11.7凍結遊戲）：**60 PASS／1 FAIL／0 SKIP／0 BLOCKED，1586.517秒、exit1**。唯一FAIL為ui-foundation仍要求確定callback直接actClear，未包含新UI歸檔。沒有改寫這輪Full成全綠。精確同步上述呼叫後以Runner單獨重跑：**1 PASS／0 FAIL／0 SKIP／0 BLOCKED，0.321秒、exit0**；遊戲完全不變，其他60入口已PASS。不宣稱另有一次61入口全綠的完整Full。
- 同輪專項**18 PASS／0 FAIL**、Console／JS-CSS404為0；原生契約381、能力89、第六階段交易5、第七階段補充17與原第十階段57案均PASS；其餘以Full summary各入口為準，不將不同suite數量加成不存在的唯一覆蓋率。browser已disconnect的profile清理逾時warning保留，非遊戲錯誤。
- 最終1.11.7 Quick：**45 PASS／0 FAIL／0 SKIP／0 BLOCKED，220.432秒、exit0**。舊Full資料及已完成的入口不覆寫；本次沒有修改Runner或透過reuse假造未執行PASS。
- 固定Seed策略：當前最低能力行優先，確定／下一步優先、NPB指名／正式入團优先，其他選項第一個；保留每次選擇文字、前後完整JSON S SHA256與全部R before/after/value。未改造a0b880b的game.js對照，只排除VERSION。P／yakyo-test-001與IF／s10-trait-38都逐步完全一致，包含traits、收入、契約、年表、退休結果。

## CI、Preview與結案界線

已查明main無test.yml；使用者拒絕Draft PR，因此不建立PR、不修改main以啟用workflow。直接workflow_dispatch若無法執行，Linux Full記BLOCKED，不用Windows Full或dev Quick頂替。只有文案／驗收文件完成不代表全條件完成；若Full CI關鍵BLOCKED，TRAIT-DISPLAY-UNIFY-01保持未完成。

正式發布與實機不在本次授權；VERSION/CHANGELOG依AGENTS在實作及本機驗證後同步更新PATCH，不發布正式網站。後續純BACKLOG證據SHA和實際通過測試的程式SHA分開記錄。

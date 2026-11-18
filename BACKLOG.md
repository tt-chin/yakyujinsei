# BACKLOG — 野球人生（日文版）

> 2026-11-17 最新確認：第0～5批主要實作與自動驗證完成。使用者手動[Full Run44067661326](https://github.com/tt-chin/yakyujinsei/actions/runs/44067661326)（attempt 1，完整SHA `1a9d159bc6b2a1d21a5c5eb9fdf1f8831e42bb7f`）132 PASS／0 FAIL／0 SKIP／0 BLOCKED；8批及Aggregate成功、acceptedPass 132、unverified 0、issues空，132份log SHA256已核對。此PASS僅適用該SHA，不冒充後續說明文字修正的Full。以下各批未實作／Full待確認是當時歷史狀態，原127 PASS／5 FAIL及中途失敗紀錄保留。Preview／實機、實際200%瀏覽器縮放、字型網路／原生分享與ARTIFACT_COVERAGE_BLOCKED仍待確認；dev／main未合併、未正式公開。

> 2026-11-17 說明補正（R2純顯示／R0文件）：補齊存檔說明與現行規格的舊敘述，明示作成中保留舊存檔、開始時確認覆寫、取消保留輸入、詳細設定獨立刪除。版號依統一UI版本維持2.0.0；CHANGELOG／RELEASE_NOTES與配信資料同步。存檔控制器19項、說明／更新視窗11組（5尺寸、S／RNG不變、Console 0）、規格來源連結及Diff檢查PASS，320／390px截圖人工確認。依純顯示例外不追加Quick／Full；既有132 PASS屬上列SHA，不稱本次新SHA Full PASS，main合併Gate仍有效。來源與結果見第5批收據helpCopyCloseout。

> 2026-11-17 第5批CI追修（R2・僅測試基盤）：[Full Run44037832570](https://github.com/tt-chin/yakyujinsei/actions/runs/44037832570)（`9e764ad88cb6201c46df26be1c0bf8011556730e`）127 PASS／5 FAIL，5件均非timeout；原收合內容仍在，但Full專用入口以innerText讀取時未先展開。修正5入口，透過原生summary確認唯一原卡片、原body可見及展開前後完整S／RNG不變，保留稱號、特性、殿堂、告別、PNG與封存斷言。共用helper接入既有Quick fixture，入口數Quick102／Full132不變。5個失敗入口已完整個別重測PASS（本地Chrome）；確定碼Quick **102／102 PASS**（0 FAIL／SKIP／BLOCKED），102份日誌與8份測試來源雜湊一致。首輪Chrome在未修改的配點入口斷言完成後收尾阻塞，已保留未完成紀錄；以相符headless Chromium重測該入口正常退出後，全新執行本輪Quick，不重用部分結果。產品檔案／版號2.0.0不變，不改遊戲規則、基準、輸入或timeout。原CI FAIL原樣保存，見[第5批收據](tasks/UI_REDESIGN_PHASE5_EVIDENCE.json)的ciFollowup。**需要執行Full（GitHub手動／未執行）**：共用測試支援影響Full專用路徑，須由使用者對新SHA啟動新Full。Preview／實機與ARTIFACT_COVERAGE_BLOCKED維持。

> 2026-11-17 UI改版第5批（R2）：季末成績／受獎／資料支持的轉折、已確定的當年／翌年年薪，退休身分／既有原因及評價、通算成果與跨階段片段已實作。原敘事／成績／收入保留原生收合，退休閱讀欄自然接續分享與新生涯；投手告別採投球文案。共用成績formatter、合併相鄰手機背景CSS；規則、S／RNG、保存時點與格式不變，不新增收藏DB。2.0.0→2.0.0（使用者指定五批統一版號），正式更新說明已整理並重新生成。128組版面、原生P／IF季末／退休及兩條固定seed生涯、8條歷史DOM／S／RNG生涯、30組收入fixture通過；確定碼最終Quick **102／102 PASS**（0 FAIL／SKIP／BLOCKED），102份日誌及16份程式／配信來源雜湊核對一致。前輪Quick的設計token期待FAIL、停止紀錄及101 PASS／1 FAIL的接線契約FAIL均保留，相關入口先重測後再執行本輪。**需要執行Full（GitHub手動／未執行）**：共用閱讀UI與Full專用歷史比較受影響，須對新SHA手動執行。Preview／實機、實際200%瀏覽器縮放及ARTIFACT_COVERAGE_BLOCKED仍待確認。相關初輪FAIL保留，詳見[第5批驗證收據](tasks/UI_REDESIGN_PHASE5_EVIDENCE.json)。

> 後續候選（未批准）：退休紀錄收藏／重訪入口。目前沒有既有收藏庫；需使用者先決定保存位置、容量、覆寫／刪除及舊資料範圍，再另行設計與驗證。本批不新增保存格式或資料庫。

> 2026-11-17 第4批Full後續確認：使用者手動[Run44025979978](https://github.com/tt-chin/yakyujinsei/actions/runs/44025979978)（`ce5f73257fd4b0be6d3770fa943bb633baaad8c5`）130／130 PASS，8批及Aggregate成功、issues為空，130份log SHA256核對一致。此為第4批修正碼的Linux Full，不冒充第5批或後續SHA結果；原Run43992500462的120 PASS／10 FAIL及中途FAIL均保留。

> 2026-11-17 第4批CI追修（R2・僅測試基盤）：GitHub Full [Run43992500462](https://github.com/tt-chin/yakyujinsei/actions/runs/43992500462)（`00907ba29e8bb4f8bb71cd51a707a5e94efa6002`）為120 PASS／10 FAIL，10件均非timeout，而是新UI與舊操作文字／選項比較不一致。接入共用測試比較器，先驗證新增UI，再還原原標籤、選項與實際排版文字；完整S／RNG、基準、輸入與timeout保持。10個失敗入口的相關路徑個別驗證PASS（draft-income的17 fixture與6 seed生涯分開執行）。最終Quick **100／100 PASS**（0 FAIL／SKIP／BLOCKED），確定碼雜湊核對一致。產品檔案與版號2.0.0不變；原CI與中途draft-income FAIL保存。**需要執行Full（GitHub手動／未執行）**：共用測試支援也影響Full專用比較，須由使用者在修正後新SHA啟動新Full；重跑舊Run仍使用舊SHA。Preview／實機、正式Gate、ARTIFACT_COVERAGE_BLOCKED及既有checkbox維持。詳見[追修證據](tasks/UI_REDESIGN_PHASE4_EVIDENCE.json)的`ciFollowup`。

> 2026-11-17 UI改版第4批（R2）：配點專用畫面、短標題與原說明、能力／繰越前後值、既有資源／進度、配分方法、無效確認提示、跨資料頁草稿／捲動／焦點保留已實作。手機單欄、寬畫面雙欄與桌面側欄保留；短視窗確認列回自然流，專用區層級不再擋住導覽。原配點模組、成長／潛力規則、復原／重設／一次確認、S／RNG與存檔時點不變，不新增通用重試或全S回滾。版號維持2.0.0，第5批未實作。確定碼Quick **100／100 PASS**；128組正式主題／尺寸／字級、P／IF原生12配點fixture與完整S／RNG、8組歷史DOM／S／RNG生涯比較通過。首輪Quick98 PASS／2 FAIL（新增預覽／無效按鈕造成的舊選項標籤期待）及早期遮擋／捲動／測試輸入FAIL原樣保留，修正後失敗入口先重測PASS。第3批基準`eddc464`已確認使用者手動Full Run43979397276為129 PASS；不冒充第4批Full。**需要執行Full（GitHub手動／未執行）**：共用配點UI／導覽及Full專用DOM比較有改動，須對本次新提交手動執行。未執行本機Full或自行觸發GitHub Full。Preview／實機與ARTIFACT_COVERAGE_BLOCKED維持；不改既有checkbox。詳見[第4批驗證收據](tasks/UI_REDESIGN_PHASE4_EVIDENCE.json)。

> 2026-11-17 UI改版第3批（R2）：事件卡閱讀層次、原生履歷展開、實際能力／繰越前後值與效果、當前選擇摘要／收合、查資料返回原選擇與捲動、結果／診斷焦點、普通選擇防連點已實作。使用者選A：保留既有復原／防重複與不要再次選擇提示，不新增通用重試。版號維持2.0.0；第4～5批未實作。修正桌面大字選項副文溢出後，確定碼Quick **99／99 PASS**，128組版面與P／IF同版完整S／RNG比較通過；相關事件552分支、24告別fixture及歷史DOM比較個別入口通過。前次Quick99 PASS未檢出該視覺問題，與早期焦點／未定義捲動、舊DOM／文案期待FAIL均保留，不冒充確定碼結果。**需要執行Full（GitHub手動／未執行）**：共用UI／導覽及Full專用DOM比較受影響，須由使用者對本次新提交手動執行；未啟動本機Full或自行觸發GitHub Full。Preview／實機、既有checkbox與ARTIFACT_COVERAGE_BLOCKED維持。來源、日誌雜湊與限制見[第3批驗證收據](tasks/UI_REDESIGN_PHASE3_EVIDENCE.json)。

> 2026-11-17 最新確認與測試分工：第2批修正提交`4ba12c54c5da3e2fd477d7616c57821132accfa3`的[使用者手動Full Run43861732451](https://github.com/tt-chin/yakyujinsei/actions/runs/43861732451)為128 PASS／0 FAIL／0 SKIP／0 BLOCKED，8批與Aggregate成功；已下載原始摘要核對，先前124／4 FAIL保留。Preview／實機與ARTIFACT_COVERAGE_BLOCKED不因此解除。使用者將「本機不執行Full、需要時提示由使用者在GitHub手動執行」擴大為本專案後續所有作業的長期規則，見AGENTS第6.2章；風險分類、相關測試、必要Quick及正式Full Gate不變。

> 2026-11-16 第2批CI跟進：使用者手動[Full Run43853737319](https://github.com/tt-chin/yakyujinsei/actions/runs/43853737319)（`bd82eb2`、attempt1）為124 PASS／4 FAIL，原始結果保留。已修正4個Full專用入口的UI契約：薪資履歷改驗證實際捲動容器、說明視窗記錄實際開啟位置並另驗證非零位置復歸、NPB返回介面對齊業餘年薪／導覽定位、DOM比較器使用最後成功渲染的輸入。四入口完整原模式逐一重測PASS（含8組歷史DOM／S／RNG生涯對照、4 seed各兩次現行重播），修正碼本機Quick98／98 PASS；錯誤薪資DOM反例仍拒絕。僅修改測試與進度記錄，產品與2.0.0不變。本機Full未執行、未自動觸發GitHub Full；仍須由使用者對新提交啟動新的Full，重跑舊run仍使用舊碼。來源／日誌雜湊與原FAIL見[第2批收據的ciFollowup](tasks/UI_REDESIGN_PHASE2_EVIDENCE.json)。既有checkbox及ARTIFACT_COVERAGE_BLOCKED不變。

> 2026-11-16 UI改版第2批：`codex/ui-redesign`，使用者指定第1～5批統一2.0.0。桌面雙欄／單一選手側欄、手機摘要、短視窗自然捲動、底部選單與焦點管理、子分頁鍵盤操作已實作。本機確定碼Quick **98／98 PASS**；P／IF固定基準配點狀態／RNG、112組版面、既有選單／分享及舊間距契約限定驗證通過。初次Quick94 PASS／4 FAIL與探針FAIL保留。依最新指示本機Full **NOT_RUN**，未自動觸發GitHub Full，由使用者手動執行；Preview／實機及整批Full受入仍待確認。第3～5批未實作，不改既有checkbox或ARTIFACT_COVERAGE_BLOCKED。來源雜湊與範圍見[第2批驗證收據](tasks/UI_REDESIGN_PHASE2_EVIDENCE.json)。

> 2026-11-16 UI改版第1批：codex/ui-redesign、開發版1.16.15，產品受驗SHA `d507e310ebc7560bce592f6671cefe6d94af72b6`。首頁／存檔實作、自動驗證及P／IF完整S／RNG對照完成；升版前工作樹Quick97／97 PASS，確定碼[Linux Full Run43809957167](https://github.com/tt-chin/yakyujinsei/actions/runs/43809957167) 127／127 PASS並下載摘要核對。本機Full122 PASS／5 FAIL（逾時／Console連線／模組載入）原樣保留，不稱本機Full PASS。已推送功能分支；dev／main未合併，分支Preview未取得，使用者視覺與實機驗收仍待進行。完整差異及收據見[tasks/UI_REDESIGN_PHASE1_ACCEPTANCE.md](tasks/UI_REDESIGN_PHASE1_ACCEPTANCE.md)。不新增／刪除既有checkbox ID，不改寫下方歷史紀錄。

> 最新狀態核對：2026-11-16。dev基準21b4ff9（1.16.13），本機1.16.14新增首頁明示隨機姓名按鈕；29項姓名聚焦驗證與82,560項樣式比較PASS。Quick初跑96 PASS／1 FAIL（舊token數量斷言），明列新token且保留原計數後限定重測1 PASS；未重跑整套Quick，不宣稱97項同輪PASS。Full／CI／Preview／實機未執行，未提交或發布；原始FAIL及ARTIFACT_COVERAGE_BLOCKED保持。
> 以現有83個唯一ID的checkbox為準：已完成60項、未完成23項（UI-DESIGN-TOKENS-04／05／06／07／08／09與UI-SEED-SHOW-COLOR-01依完成條件結案；2026-11-14依使用者決定由-06拆出UI-DESIGN-TOKENS-07，並新增-08（級距收斂）與UI-SEED-SHOW-COLOR-01，總數74→77；同日依使用者決定由-08拆出間距為UI-DESIGN-TOKENS-09，總數77→78；2026-11-15新增UI-MRTEAM-NICKNAME-01，總數78→79；同日新增UI-PLAYER-RANDOM-NAME-01，總數79→80；同日-09經PR #91併dev後結案；同日依使用者決定HIST-SPEC-CLAUSE-01改為按需追溯並結案；同日新增TEST-DT09-DEV-FAIL-01，總數80→81；同日EVT-01經PR #99併dev、使用者確認Preview後結案；同日新增UI-BOARD-MENU-STACK-01，總數81→82，經PR #102併dev、使用者確認Preview後結案）；不提前結案。早期統計保留為歷史，ARTIFACT_COVERAGE_BLOCKED等限制依各ID保留。
> 詳細測試、歷史FAIL、發布紀錄及原頁首內容保留於移轉前的固定Git提交，見[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)；歷史快照不作為目前狀態。

> 2026-11-05待辦範圍調整：依使用者決定取消KBO亞洲名額與二天一流，移除兩項未完成待辦；目前40完成＋28未完成＝68項。僅調整計畫，不刪除既有產品中的保留特性資料。以下舊統計為歷史。

> 追加決定：取消野手OVR耐力5%提案；目前40完成＋27未完成＝67項。TJ顯示、優勝請負人及看板陰影已隨1.14.0經PR #57併main，Linux Full 96／96 PASS、發布Workflow成功；使用者指定Preview驗收尚未確認，checkbox不提前結案。

## 1. 最新進度總覽

### 現況摘要（2026-11-15，優先於下方歷史紀錄）

- **來源與版本：** 最新開發基準dev `f3bffeee49cd6a9cca3f56b9118bf164992bd8af`（1.16.9）；本次1.16.10維持原定版號，新增46姓／50名獨立抽取的空白姓名補完，並同步4個舊測試期待／VM依賴。限定驗證結果與原始FAIL見末節。使用者已授權提交及推送dev，尚未取得本次來源CI、Preview或實機結果，未授權main反映／正式發布。下列舊版本進度保留為各次歷史紀錄。
- **PR #95 決策（2026-11-15）：** 以下均已決定。PLY-01 D1～D4、W1～W8（W1＝B入團選號、W7＝②加選單改號、W8＝甲下一年度開始前插入），見[背號計畫](tasks/PLY_01_JERSEY_PLAN.md)；HOF研究線H1～H4（第二版路線），見[研究計畫](tasks/HOF_NATURAL_SAMPLE_PLAN.md)；INT-01 N1＝B／N2＝A、EVT-01 E1～E3（E3＝a）、INJ-UI-01 I1＝公開／I2＝細目，見[顯示計畫](tasks/P2_DISPLAY_DECISIONS_PLAN.md)。其中HOF研究線、INT-01、INJ-UI-01**尚未授權實作**；PLY-01另經使用者授權依T1～T9正式實作（2026-11-15，R3，1.17.0），合併與部署未因此一併授權；EVT-01另經使用者授權實作，E1＋E2（PR #97）與E3（PR #99）均已併dev並結案。
- **殿堂四項：** [PR #74](https://github.com/tt-chin/yakyujinsei/pull/74)已合併dev（`4c15523`）。作業分支`0de886d`的[Linux Full 42497795539](https://github.com/tt-chin/yakyujinsei/actions/runs/42497795539)為112 PASS／0 FAIL／0 SKIP／0 BLOCKED，8批及Aggregate PASS；合併dev的[Quick 42551250884](https://github.com/tt-chin/yakyujinsei/actions/runs/42551250884)成功。原Full 42492930690的104 PASS／8 FAIL保留，不改寫。四項轉為CI_PASS／DEV_MERGED／PREVIEW_PENDING，未提供使用者新規則Preview／實機驗收，不勾選結案。
- **UI-DESIGN-TOKENS-02／03：** [PR #77](https://github.com/tt-chin/yakyujinsei/pull/77)（`c66b78f`、1.16.1）與[PR #78](https://github.com/tt-chin/yakyujinsei/pull/78)（`7d08f0c`、1.16.2）均已合併dev；各dev push [Quick 43077212225](https://github.com/tt-chin/yakyujinsei/actions/runs/43077212225)及[Quick 43245735982](https://github.com/tt-chin/yakyujinsei/actions/runs/43245735982)成功。不再記為待PR／未授權實作；4主題×PC／手機Preview確認仍待完成，歷史本機Full不冒充新來源Linux Full。
- **1.16.3案內選單：** 「クレジット」統一名稱、更新履歷後新增完整指定X連結的「不具合報告」。四種尺寸309項限定檢查PASS、語法／履歷生成／diff PASS；詳見末節。提交`a6b3bc7`的[Quick 43247767847](https://github.com/tt-chin/yakyujinsei/actions/runs/43247767847)成功；[Full 43247910213](https://github.com/tt-chin/yakyujinsei/actions/runs/43247910213)為117入口中111 PASS／6 FAIL（歷史引擎混用已移除getSharePalette的新模組），原FAIL保留。本輪限定測試接線修復及重測詳見末節，新來源CI待執行；Preview／實機未追加驗收，未正式發布。
- **保留項目：** UI-DESIGN-TOKENS-05經[PR #85](https://github.com/tt-chin/yakyujinsei/pull/85)併dev（`d5433e2`、1.16.5），dev push [Quick 43561784095](https://github.com/tt-chin/yakyujinsei/actions/runs/43561784095)成功，依完成條件結案，4主題×PC／手機Preview畫面未確認；-06經[PR #86](https://github.com/tt-chin/yakyujinsei/pull/86)併dev（`08b3aca`，版本不變），dev push [Quick 43580585124](https://github.com/tt-chin/yakyujinsei/actions/runs/43580585124)成功，依完成條件結案，Preview畫面未確認；-07經[PR #87](https://github.com/tt-chin/yakyujinsei/pull/87)併dev（`62f80c0`、1.16.6），dev push [Quick 43590931500](https://github.com/tt-chin/yakyujinsei/actions/runs/43590931500)成功，依完成條件結案，Preview畫面未確認；UI-SEED-SHOW-COLOR-01經瀏覽器確認前提不成立（`#seed-show`自1.7.0起已隨主題變色），改為移除無效的寫死色（外觀不變），`9d9e781`隨PR #88／#89併dev（`41a39a0`），dev push [Quick 43600000044](https://github.com/tt-chin/yakyujinsei/actions/runs/43600000044)成功，結案；-08細部計畫與對照圖經PR #89併dev，實作經[PR #90](https://github.com/tt-chin/yakyujinsei/pull/90)併dev（`f8afd8e`、1.16.7），dev push [Quick 43603396112](https://github.com/tt-chin/yakyujinsei/actions/runs/43603396112)成功，依完成條件結案，Preview畫面未確認；-09經[PR #91](https://github.com/tt-chin/yakyujinsei/pull/91)併dev（`38ed1bb`、1.16.8），dev push [Quick 43648250959](https://github.com/tt-chin/yakyujinsei/actions/runs/43648250959)成功，依完成條件結案，Preview畫面未確認（-04已結案；-07由-06拆出）；背號、永久欠番未實作，投手平衡僅研究。ARTIFACT_COVERAGE_BLOCKED不因Full或artifact上傳成功解除。

### 早期版本與重構進度快照（保留原時點，非目前版本／待辦狀態）

- **1.14.0：已合併main／發布Workflow成功。** 受驗dev `2a7d8f4`，[Linux Full Run 42242022793](https://github.com/tt-chin/yakyujinsei/actions/runs/42242022793) **96 PASS／0 FAIL／0 SKIP／0 BLOCKED，8批與Aggregate PASS**；[PR #57](https://github.com/tt-chin/yakyujinsei/pull/57) merge `bb92ae8`，[Publish website Run 42244674373](https://github.com/tt-chin/yakyujinsei/actions/runs/42244674373)成功。此處僅確認發布工作流，不新增正式站／實機Smoke PASS。
- **1.14.1：已合併main／發布Workflow成功。** 經[PR #60](https://github.com/tt-chin/yakyujinsei/pull/60)合併main（`7653d66`），[Publish website Run 42388082979](https://github.com/tt-chin/yakyujinsei/actions/runs/42388082979)成功；該PR的[Full Run 42388063480](https://github.com/tt-chin/yakyujinsei/actions/runs/42388063480)為**FAIL**（2026-11-08讀取job log確認：96／98，batch 1的`event-fix-e2e`（選單id清單多`board-credits`）與batch 7的`game-view-dom-e2e`（基準`4f39a73`、step 0 `$.dom.board`多`board-credits`按鈕）；其餘6批無FAIL，與§2mm.6本機重現的2項相同）。其後PR #61修正1.14.1選單按鈕未反映的2項Full專屬期待值（計畫§2mm.6），dev `1a74e71`的[Linux Full Run 42401142552](https://github.com/tt-chin/yakyujinsei/actions/runs/42401142552) 99／99 PASS，經PR #63併main（`a8859b9`）。以下為當時dev／Preview紀錄：`8fa5cf5`新增背景與素材授權，`8a0e87d`將裝飾照片層設為50%不透明度（含上部黑色漸層），版本依使用者要求維持1.14.1。1440×900、390×844與699／700px邊界等限定驗證PASS；[Quick Run 42383269810](https://github.com/tt-chin/yakyujinsei/actions/runs/42383269810) success，Cloudflare deployment `4c730055-7b3c-497a-ac27-d1694f558608` success，[固定Preview](https://dev.yakyujinsei.pages.dev)。本版Full未執行，使用者Preview接受及iOS Safari實機仍NOT_RUN。
- **重構第32／33期：PR #59已合併dev**，merge `7234965`；其[Linux Full Run 42377173624](https://github.com/tt-chin/yakyujinsei/actions/runs/42377173624)為該PR來源的98項證據，不冒充目前背景版本的Full。隨1.14.1經PR #60發布main（`7653d66`）。
- **重構第34期（`SeasonPhases`）：[PR #62](https://github.com/tt-chin/yakyujinsei/pull/62)已合併dev**，merge `ef7768e`；PR #61（credits選單測試期待值）merge `1a74e71`。[Linux Full Run 42401142552](https://github.com/tt-chin/yakyujinsei/actions/runs/42401142552)（`1a74e71`）**99 PASS**，8批與Aggregate PASS；[PR #63](https://github.com/tt-chin/yakyujinsei/pull/63)合併main（`a8859b9`，樹與`1a74e71`相同），PR Full [Run 42404561894](https://github.com/tt-chin/yakyujinsei/actions/runs/42404561894) 99／99 PASS，[Publish website Run 42404607279](https://github.com/tt-chin/yakyujinsei/actions/runs/42404607279)成功；VERSION維持1.14.1。此處僅確認工作流，不新增正式站／實機Smoke PASS。
- **重構第35期（`ProfessionalSeason`）：[PR #64](https://github.com/tt-chin/yakyujinsei/pull/64)已合併dev**，merge `d3d2a53`。[Linux Full Run 42452617589](https://github.com/tt-chin/yakyujinsei/actions/runs/42452617589)（Tests #156，`df0ed19`，與merge樹的`docs`／`tests`／`scripts`相同）**100 PASS**，8批與Aggregate PASS；dev push [Quick Run 42453651874](https://github.com/tt-chin/yakyujinsei/actions/runs/42453651874) 75／75 PASS；固定Preview的`professional-season.js`、`game.js`、`season-phases.js`、`config.js`、`index.html`與dev一致。VERSION維持1.14.1，尚未發布main；Preview實際遊玩與實機NOT_RUN。
- **重構第36期（`CheckpointRenderer`）：** 經[PR #66](https://github.com/tt-chin/yakyujinsei/pull/66)併dev（`ea89c15`），Linux Full [Run 42464271804](https://github.com/tt-chin/yakyujinsei/actions/runs/42464271804) 107／107 PASS（見計畫§2oo.5）。**重構第37期（`CareerEntry`，開局與讀檔續玩）：** 依使用者決定（2026-11-08）不等BROWSER-SAVE-01驗收結案即開始，BROWSER-SAVE-01狀態不變；`refactor/career-entry`（`8b489b2`）本機Quick 82／82、8批Full 108／108 PASS（macOS＋Brave本機證據），reviewer無發現，[PR #68](https://github.com/tt-chin/yakyujinsei/pull/68)已併dev（merge `132c9de`）；dev上的Linux CI Full依使用者決定（2026-11-08）延至第38期併入後一起執行，Preview、實機NOT_RUN（見計畫§2pp）。**重構第38期（`LeagueCatalog`，聯盟・階級・球團目錄）：** `refactor/league-catalog`（`5bd5aa4`）本機Quick 83／83、8批Full 109／109 PASS（macOS＋Brave本機證據），reviewer無發現，[PR #69](https://github.com/tt-chin/yakyujinsei/pull/69)已併dev（merge `cfb1a31`，樹與`cb0bc4a`相同）（見計畫§2qq）。**第37＋38期的Linux CI Full：** dev `f3f05fa`（含PR #70首頁存檔UI修正）手動[Run 42481235307](https://github.com/tt-chin/yakyujinsei/actions/runs/42481235307)（Tests #169）**109／109 PASS**，8批與Aggregate PASS（`expected 109`、`acceptedPass 109`、`issues []`）。Preview、實機NOT_RUN。**重構第39期（`CareerTraits`、TJ量表移入`PlayerInjury`、成績格式`stat-format.js`）：** `refactor/career-traits`（`597545c`）各commit Quick 83／84／85 PASS；8批Full第1次109／111（兩個`page.goto`逾時，判為環境問題，單獨重跑2／2 PASS），第2次111／111 PASS（macOS＋Brave本機證據），reviewer無阻擋性發現，[PR #72](https://github.com/tt-chin/yakyujinsei/pull/72)已併dev（merge `b9a45e0`）；Linux CI Full、Preview、實機NOT_RUN（見計畫§2rr）。**重構第40期（拿掉`LEGACY`覆寫層與重複綁定）：** 計畫§2ss，D1–D8與T2e批准（2026-11-09）。`refactor/legacy-wrappers`（K `93af9b7`、L `22e33e0`，自dev `4c15523`）各commit Quick 87／87 PASS；8批Full第1次111／114（`salary-history-e2e`、`draft-income-e2e`、`event-system-e2e`的console收到`net::ERR_NETWORK_CHANGED`，判為環境問題，單獨重跑3／3 PASS），第2次114／114 PASS（macOS＋Brave本機證據）；草稿Full曾因`hof-retirement-policy-e2e`的`old` mode混用新`MovementGate`而FAIL，以T2e修正。reviewer無發現。已push，[PR #75](https://github.com/tt-chin/yakyujinsei/pull/75)已併dev（2026-11-10，merge `f38e4a2`，樹與`4fabbdc`相同），dev push Quick [Run 42848524188](https://github.com/tt-chin/yakyujinsei/actions/runs/42848524188)（Tests #177）成功；Linux CI Full、Preview、實機NOT_RUN。第41期候補（`seedInit`／`R`）經盤點不成期（計畫§3.26）。**重構第42期（守備位置規則移入`DefensePosition`、業餘入學移入`AmateurCareer`）：** 計畫§2tt，D1–D9與T1–T3批准（2026-11-10）。`refactor/defense-position-rules`（A `30237c7`、C `dd6e309`）各commit Quick 87／87 PASS；8批Full 114／114 PASS（macOS＋Brave本機證據）；舊／新並排27段生涯的到達probe hit序列與最終狀態全同；reviewer無發現。[PR #76](https://github.com/tt-chin/yakyujinsei/pull/76)已併dev（2026-11-10，merge `ca81755`，樹與`2ab959a`相同），dev push Quick [Run 42850084284](https://github.com/tt-chin/yakyujinsei/actions/runs/42850084284)（Tests #178）**87／87 PASS**；Linux CI Full、Preview、實機NOT_RUN。VERSION：dev為1.16.0（PR #74），main為1.15.1（PR #73）。
- **保留限制：** 本機1.14.0 Full的80／16、94／2原始結果仍保留，後續Linux96／96不改寫本機FAIL；ARTIFACT_COVERAGE_BLOCKED保持，Full通過不代表完整artifact覆蓋或實機驗收。


| 指標 | 數量 | 說明 |
|---|---:|---|
| 已完成 | **60** | 現有checkbox實際數量；含使用者已確認的7項實機／UI／OFUSE範圍及年度存檔第一期，不重新推定其他項目完成 |
| 未完成 | **22** | 與60項完成合計82個唯一ID；四項殿堂、兩項配色仍待最終確認，其他設計／研究／稽核／CI殘項保留 |
| P0 未完成 | **0** | 既有P0已按核准的結案標準關閉 |
| BLOCKED | **1** | D2-CI-ARTIFACT-01的ARTIFACT_COVERAGE_BLOCKED；已獲使用者接受的實機／分享項目不再重複計入 |
| IMPLEMENTED_UNVERIFIED | **8** | AUD-02、REFACTOR-AUDIT-01、HOF-NATURAL-SAMPLE-01、COPY-01、UI-DESIGN-TOKENS-02／03、UI-MRTEAM-NICKNAME-01、UI-PLAYER-RANDOM-NAME-01；-02／03配色已合併，仍待Preview確認 |
| CI_PASS／DEV_MERGED／PREVIEW_PENDING | **4** | HOF-BUCKET-DECISION-01、HOF-HONOR-POLICY-01、HOF-DISPLAY-ROUND-01、TEST-COMPARE-BASELINE-01；112入口Full與合併後Quick已通過，未冒充Preview／實機驗收 |
| DESIGN_PENDING | **0** | — |
| 其他候補／研究／殘項 | **9** | HOF-PITCHER-BALANCE-01、INJ-UI-01、INT-01、PLY-01／02、CI-LINUX-FULL-01舊工具路徑、兩項本機環境問題及TEST-DT09-DEV-FAIL-01 |


上次盤點歷史（2026-11-01，非本次現況）：**33 + 35 = 68**（2026-11-01新增TEST-DISPLAY-ENTER-TIMEOUT-01，總數由67增為68；同日新增TEST-EVENT-SIGSEGV-01，總數由66增為67；同日新增UI-BOARD-SHADOW-01，總數由65增為66；同日CODE-DEAD-01經PR #44併dev、Tests #111 Full通過後結案；該項補列時未計入總數，故總數由64更正為65；2026-10-24新增CI-ENV-PIN-01、CI-PITCHING-E2E-01；同日CI-ENV-PIN-01經PR #21合併後勾選；CI-PITCHING-E2E-01經PR #22合併後勾選；CI-FULL-BALANCE-01的實作`cdf0a25`已隨PR #21併dev，經使用者同意一併勾選；同日新增CI-FULL-STALE-01、UI-DESIGN-TOKENS-01；CI-FULL-STALE-01經PR #24／#25併dev、dev Full Run40093614384 92／92 PASS後勾選）。保留本輪C級高校結案同步；另依已批准4-A執行期證據與合併紀錄，將CONTRACT-LEGACY-01列為限定範圍已完成；恢復更新時漏列的UI-TJ-GAUGE-01與CI-FULL-BALANCE-01，兩者均未授權實作。其餘ID不改checkbox。D2-G9-RELEASE僅以發布範圍結案；CI-LINUX-FULL-01舊工具路徑未處理、D2-CI-ARTIFACT-01保持ARTIFACT_COVERAGE_BLOCKED。各版測試數字只代表原受驗範圍，歷史統計與FAIL不改寫。


### 1.1 開發階段完成履歷

| 階段 | 主題 | 對應 ID | 結果 | 驗收報告 |
|---|---|---|---|---|
| 第一階段 | KBO 續約年俸下限修復 | `BUG-KBO-RENEWAL-FLOOR` | **完成** | [KBO_RENEWAL_FLOOR_FIX.md](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md) |
| 第二階段 | 成績按鈕、指名入團後選項 | `BUG-ACT-01`、`BUG-ACT-02` | **完成（現行功能驗收）** | [ACT_01_02_FINAL_ACCEPTANCE.md](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md) |
| 第三階段 | 行動／契約與年俸回歸 | `BUG-ACT-03`、`BUG-SAL-01` | **完成** | [CONTRACT_SALARY_ACCEPTANCE_AUDIT.md](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md) |
| 第四階段 | 統一測試 Runner 與 Linux CI | `TEST-RUNNER-01`、`TEST-CI-01` | **完成** | [TEST_INFRA_ACCEPTANCE.md](docs/reviews/TEST_INFRA_ACCEPTANCE.md) |
| 第五階段 | 現行規格與程式架構稽核 | `AUD-02`、`REFACTOR-AUDIT-01` | **調查與路線文件完成；完整驗收／動態可達性證據仍未完成** | [稽核](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)／[分批路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md) |
| 第六階段 | 能力配分、狀態一致性及引用補強 | `AUD-03B`、`STATE-TRANSACTION-AUDIT-01`、`SPEC-SOURCE-LINK-01` | **調查與引用修復完成；5個風險斷言FAIL，當時修復待批准** | [第六階段驗收](docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md) |
| 第七階段 | 能力配分與交易安全最小修復 | 三項安全修復、`AUD-03B`、`STATE-TRANSACTION-AUDIT-01` | **批准範圍修復與驗收完成；非全S交易rollback** | [第七階段驗收](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md) |
| 第八階段 | 歷史規格與AGENTS指示稽核 | `AUD-04`、`AUD-05` | **調查／分類完成；完整歷史細項仍獨立待核對，不移入舊政策** | [歷史規格](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)／[AGENTS歷史](docs/reviews/STAGE8_AGENTS_HISTORY_AUDIT.md) |
| 第九階段 | 從現行程式建立技術詳細設計 | 現行技術文件；既有三個未完稽核ID保持 | **12章與附錄／來源建檔；非全行為驗收，歷史任务縮範圍只提案** | [主設計](docs/design/CURRENT_DETAILED_DESIGN.md)／[驗收及缺口](docs/reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md) |
| 第十階段 | U07／U03／回國例外／LEGACY | 新增兩個待修復ID；既有稽核保持 | **歷史調查快照：當時正常稱號Bug1項、例外恢復風險1項未修復** | [調查報告](docs/reviews/STAGE10_PRE_REFACTOR_RISK_INVESTIGATION.md) |
| 第十階段修復 | 回國retry／grinder | 兩修復ID；smallschool獨立待決 | **核准修復與本機／Linux Full／Preview驗收完成；非全面交易保證** | [修復驗收](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md) |
| 特性顯示統一 | 取得當下說明／以後名稱 | `TRAIT-DISPLAY-UNIFY-01` | **指定顯示範圍完成；Linux Quick45／Full61及Preview18 PASS** | [驗收](docs/reviews/TRAIT_DISPLAY_UNIFICATION_ACCEPTANCE.md) |
| v1.11.8本大会個人成績 | 保存既有生成結果／結果卡顯示 | `INT-01`前置（非履歷列表結案） | **本機Quick46／Full63及指定Preview43案PASS；重新部署成功** | [驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)／本檔末節 |
| v1.11.9全力投球 | callback值最小修復 | `BUG-PITCH-EFFORT-01` | **Linux Quick47／Full65、新專項36及Preview29案PASS** | [驗收](docs/reviews/FULL_POWER_PITCHING_ACCEPTANCE.md)／本檔末節 |

**D2獨立Gate歷史快照（2026-10-15；現況見D2-G9-RELEASE及CI-LINUX-FULL-01）**：A0／G2～G4與G5～G8已獲使用者接受，B本機提交56e72d9。1.13.0發布準備、120分鐘timeout及collector限定驗收已接受；本次另批精確dev提交／推送與Linux Full啟動，不等於Full結果PASS。CI／Preview／正式發布與smoke未驗收，D2-G9-RELEASE保持未完成；artifact保存缺口另列D2-CI-ARTIFACT-01，不作Full啟動阻擋。這不是前述「第九階段」技術文件調查，兩者不可混用。見[G9報告](docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)與[CI證據驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)。

上述「階段」是方便管理的索引，**不是新的任務 ID**。此外還有兩項已完成的歷史稽核／測試盤點及一項殿堂錯置修復，列於第 2 節。

### 1.2 歷史開發基準與持續限制

以下各版SHA、main、開發1.13.3／公開1.13.0及測試數量均為當輪歷史紀錄，不代表目前版本；現況以第1節總覽與各ID的最新記錄為準。歷史「smallschool待決」已由1.12.0批准的C級方案取代；實機、完整稽核及其他未結案項目的限制仍保留。

- **最新全力投球受驗程式：** `a1658c994713fd1fb8f66857dab33df0ff6548fd`、1.11.9。Linux Quick47／Full65入口、新專項36及Preview29案PASS；完整證據見末節。其他版本均為各自歷史受驗範圍，不沿用舊PASS冒充新版測試。
- **上輪已提交的受驗程式 SHA：** `6020df03ca507c456233005d22bfe36c3d21f306`，1.11.7；本機／Preview已驗證，Linux Quick45及Full61入口均PASS，見末節。此前Linux Full受驗SHA `b2e01509c0ea75712579f53d864ecd09f710840c`、1.11.6及第七階段SHA `13abcf5f8b9f5ba47bcdfc796be6e4e79267bf4e`保留為歷史；後續純文件HEAD不冒充受驗程式SHA。
- **國際大会顯示最新受驗程式：** `2924dd03f1bf0fecac0f1673f07c10df92546114`、1.11.8。修正前完整SHA `e602174a22d7472e1021d780388ad61adc6b11b6`＋1.11.8作業樹已實際Quick46／Full63入口PASS；新專用單体15／E2E50案、6條生涯完整S／選擇／RNG一致，僅排除version及新增personalStats。Quick CI success；同程式SHA重新部署success，固定Preview指定遠端43案PASS。遠端受驗HEAD為`6bfa070b914259664ef80ccee2cae4af5bc4d24f`，其docs/index.html／src／styles與2924dd0零差異，48配信HTML/JS/CSS與受驗來源一致。此版結果卡的Preview驗收完成，實機／Linux Full等限制保留；歷史一覧INT-01仍未完成，不擴大其他結案。[驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)
- **第八階段文件與Quick受驗SHA：** `b38146e69288346a120db5b2d079ce0a7983aaae`；從`a5ed616418e1eb3611c6f714b5f2cf75161ba550`開始調查，遊戲程式樹不變。CI Run 38183631042成功；本次證據補記僅改BACKLOG，文件Commit另見Git／最終回報。
- **第九階段調查基準：** `ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1`；40模組、997函式語法節點、39核心函式契約、124直接S根欄位及196RNG相關語法點重新盤點。技術文件不是新政策，動態可達性／完整S寫集仍未證明；退休舊欄位等新補驗提案見報告，不修改程式或直接結案。
- **第九階段CI受驗文件SHA：** `e422b45bab38cc7a9632f89b2558bd296dcf0d5a`；Linux Quick Run 38187518145成功。五份技術文件與BACKLOG已提交，遊戲資產與調查基準ea951c2相同；後續純BACKLOG證據提交不冒充另一次已執行CI。
- **第十階段調查基準：** `fc879dc73cb8a3886d2812a42443c6192d1f6191`；新測試只登錄Full／Audit，不加入Quick；Quick45／Full60／Audit61入口。指定調查入口exit1（34 PASS／10 FAIL），因此目前不能宣稱新Full／Audit全綠；遊戲樹與基準相同。
- **第七階段歷史 VERSION：** dev `1.11.5`；main／正式網站仍為`1.11.4`。只修復核准的能力callback、CORP重入與signTo簽約／描畫重試；正常S／選擇歷史／年表／RNG維持1.11.4基準。
- **第十階段修復歷史 VERSION：** 1.11.6，只再修當輪批准兩項；上列1.11.5是歷史受驗範圍。出生potSum0與引退grinder為允許差異，其餘正常S／選擇／RNG保持。[當輪驗收](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)
- **特性顯示dev VERSION：** 1.11.7；上列1.11.6為此前修復受驗版本。取得當下的結果說明於下一操作／導航歸檔為名稱，其他清單、退休概要／PNG只名称。提交／Quick CI／Preview與本次Linux Full證據見末節，不把前輪Full當成本次通過。
- ACT-01 已按「現行功能」標準結案，但原始完整操作歷史不足，**沒有精確重現歷史故障路線，也沒有證明當年的根本原因**。
- ACT-02 的指名後第一選項、listener、單次執行及下一年度推進已通過指定矩陣；不宣稱所有未知路線均驗證。
- 320px／390px 是瀏覽器手機尺寸模擬，不能替代 iOS Safari／Android Chrome 實機。
- GitHub Actions 已能執行測試；**Branch Protection／Ruleset 強制合併檢查尚未設定**。
- 未經使用者明確批准，不得修改 `main`、正式網站、遊戲平衡、RNG、年俸／契約政策或殿堂係數。

### 1.3 本次核對基準與驗收界線（2026-10-23）

- 本機及origin/dev記錄：`52e4cdb36d6b770a2c73ca89e947c94bcc616562`、VERSION 1.13.3；開始時只有BACKLOG既有未提交修改，本次保留並補正。正式main實際核對仍為`650e4dd21718b4abec3876fc9ef6148714c21d4f`，公開倉庫config仍1.13.0。
- 1.13.3修正提交`4cb4c98`：[Quick CI](https://github.com/tt-chin/yakyujinsei/actions/runs/39633979872) success；Cloudflare deployment `e1624e5f-b99f-47e2-86b7-25d106d7bf87` success。先前Preview仍1.13.1的觀測為歷史，當時延遲原因仍未確認，不倒改當時結果。
- 最新dev：[Quick CI Run39908253156](https://github.com/tt-chin/yakyujinsei/actions/runs/39908253156) success，受驗SHA為`52e4cdb`；本次只核對Workflow結果，未下載報告核對入口數，不將本機67入口推算成此Run的實測數字。該Run的Full三個job均SKIPPED，不能作Full PASS。
- 最新SHA Cloudflare Pages check success，deployment `2250c1a4-bd82-42f4-9d29-56a84b051388`；[Preview](https://dev.yakyujinsei.pages.dev)實際config提供1.13.3。這是部署與版本讀取確認，不是全資產hash／UI E2E／實機驗收，五項UI的使用者審查仍待完成。
- 已核對[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §8及[實際Full Run39879968880](https://github.com/tt-chin/yakyujinsei/actions/runs/39879968880)：指定`b6f71f6dbe6f90e511334e5ad9e063af9f344fe5` success；計畫記錄84／84及10個artifact、21分37秒，本次未重新下載核驗原件。不能沿用為目前87入口或最新SHA的Linux Full，也不解除artifact完整性缺口。
- 本次R0文件盤點不執行Quick／Full、不改程式、測試、VERSION、CI或發布設定，不自動commit／push。

本次統計補記：原有68個唯一checkbox（33完成／35未完成）；UI-DESIGN-TOKENS-01依PR #26及既有1.13.6發布證據滿足原訂「PR合併後勾選」，移為完成。新增TEST-VERSION-LITERAL-01與TEST-SOURCE-EOL-01兩項後曾為34完成／36未完成；使用者批准修復、最終本機Quick69／69 PASS後，這兩項限定結案，因此目前為 **36完成＋34未完成＝70**。上方33＋35＝68段落保留為上次盤點歷史，不能取代本次實際統計。未結案UI使用者驗收與artifact缺口不因發布或本機測試自動關閉。

2026-11-05統計補記：使用者接受四項UI後，目前為 **40完成＋30未完成＝70**；前述36／34為當時歷史統計。未新增或刪除ID，OFUSE與其他未授權範圍不自動結案。

## 2. 已完成工作（40 項；含第3.4、3.5與3.6節保留的已完成索引）

### 2.1 第一至第四階段

- [x] **BUG-KBO-RENEWAL-FLOOR** — KBO 候選年俸下限與 package 上限順序修復；v1.11.3，相關固定 Seed、自然生涯、PC／手機模擬與 Preview 通過。[證據](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md)
- [x] **BUG-ACT-01** — 「今季の成績を見る」現行操作路線、投手／野手、返回、重複點擊、後續操作及 S／RNG 回歸通過；**原始路線未精確重現**。2026-10-11。[證據](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)
- [x] **BUG-ACT-02** — P／IF × HS／U／CORP／IND × 正式／育成 × 三尺寸，共 48 組入團驗收；第一選項 DOM、listener、付款去重及下一年度推進通過。2026-10-11。[證據](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)
- [x] **BUG-ACT-03** — 原生行動／契約邊界、傷病×滿期×降格、自然生涯等已在第三階段驗收。v1.11.4；未驗證範圍以報告為準。[證據](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)
- [x] **BUG-SAL-01** — MiLB 降格後 NPB 候選年俸顯示、候選接受與次年支付等驗收；v1.11.4，不保證所有 Seed／實機。[證據](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)
- [x] **TEST-RUNNER-01** — `scripts/test.mjs` 的 `list/quick/full/audit`、61 個測試相關檔案分類、FAIL／BLOCKED 非零、證據與重用檢查。2026-10-11。[證據](docs/reviews/TEST_INFRA_ACCEPTANCE.md)
- [x] **TEST-CI-01** — `dev` push quick、對 `main` PR full、手動 quick/full/audit；Linux 實際 Quick 44／44、Full 55／55、Audit 56／56 自動入口通過，Audit 另有 10 SKIP。2026-10-11。[證據](docs/reviews/TEST_INFRA_ACCEPTANCE.md)

### 2.2 其他已完成項目

- [x] **BUG-HOF-FIRST-BALLOT-LEAGUE** — 殿堂首輪聯盟判定錯置修復；31 案例及指定邊界通過，**自然跨聯盟入選率仍待研究**。v1.11.2。[歷史稽核](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)
- [x] **TEST-COVERAGE-01** — 當時 54 個測試檔案的入口／依賴盤點已完成；**不是 100% 程式覆蓋率**。後續第四階段已更新為 61 個檔案。[歷史稽核](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)
- [x] **AUD-01B** — 指定快照的正式／Preview 資產一致性比對完成；不保證所有 CDN 節點或未來部署。[歷史稽核](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)
- [x] **SPEC-SOURCE-LINK-01** — 2026-10-11。CURRENT_SPEC五個已刪原文的失效引用改為刪除前固定Git來源；4個現存本地link及5個歷史blob驗證PASS，其他文字／數值不變，不恢復舊文件或政策。[第六階段證據](docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md)

### 2.3 第七階段（2026-10-12；受驗程式13abcf5）

- [x] **AUD-03B** — 能力89案與補充session矩陣、PC／320／390、Undo／reset、鍵盤、carry／combo／late均通過。保留原carry結構差異；不宣稱所有Seed／實機皆驗收。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)
- [x] **STATE-TRANSACTION-AUDIT-01** — 原生CORP重入、明示簽約fault injection原5案與補充失敗／下一年度付款通過。指定風險修復完成，不代表全面交易安全或自然UI故障重現。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)
- [x] **ALLOC-STALE-CALLBACK-01** — 同S／世代／DOM／未完session guard使過期行、Undo、reset、確定無作用；pool不負數、done只一次，正常觸控／鍵盤與RNG不變。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)
- [x] **STATE-CORP-REENTRY-01** — 同S／年度成功決算不重付；付款前與付款後描畫故障再試不誤標成功、不重付；下一年度及原生事件收入通過。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)
- [x] **STATE-SIGN-ATOMICITY-01** — 契約驗證成功後提交所屬／連番；付款後描畫重試保留contractId與5000萬契約金，次年度600萬年俸只付一次。明示fault injection，不宣稱自然路線已重現。 [證據](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)

### 2.4 第八階段（2026-10-12；基準a5ed616）

- [x] **AUD-04** — 歷史文件盤點、主要數值／事件／API差異分類及來源報告完成。59筆文件：CURRENT6／SUPERSEDED38／OBSOLETE0（整份文件）／UNVERIFIED8／DESIGN_PENDING7；個別廢止條文另列。16階層／14曲線／90球團ID名稱對照一致；**不宣稱全部原文條款驗收或已移管**。未驗細項獨立保留HIST-SPEC-CLAUSE-01；依最新指令只提出CURRENT補充建議，不改正本。[證據](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)
- [x] **AUD-05** — 9份封存與7個Git根AGENTS版本（8組不同LF內容）對照完成；14政策群組中4組恢復會衝突、4組過時／缺口、6組一致，現行AGENTS不修改。舊指令不恢復。[證據](docs/reviews/STAGE8_AGENTS_HISTORY_AUDIT.md)

### 2.5 第十階段核准修復（2026-10-12；受驗程式b2e0150）

- [x] **TRAIT-INITIAL-STATE-FIX-01** — 僅按批准的grinder範圍結案：newState保存出生pot合計，正常IF463生涯取得；7個P／IF門檻／缺資料／既取得fixture及未改造修復前S／R逐步比較通過。smallschool移交獨立待決ID。Linux Full60、Preview59 PASS。[驗收](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)
- [x] **STATE-NPB-RETURN-RETRY-01** — 三故障點×三尺寸9案、正常3案及連續描畫／殘留補驗通過。首次年數、已驗證contractId及付款後重畫重用，下一操作／次年支付正常。明示fault injection、回國bonus0，非自然故障根因證明或全S rollback。Linux Full60、Preview59 PASS。[驗收](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)

### 2.6 特性顯示統一（2026-10-12；受驗程式6020df0）

- [x] **TRAIT-DISPLAY-UNIFY-01** — 全38 ID清查、取得當下原因／效果、失去／歷史名稱、退休新解鎖與概要、PNG及P／IF完整S/RNG對照通過。Linux Quick45／Full61入口及Preview18案PASS，CI受驗完整SHA與連結見末節。僅結案指定顯示範圍；未實裝3項不啟用，academy／taiwan自然取得路線未證明，smallschool語意仍獨立待決，不補造條件或宣稱所有自然取得路線已驗證。[驗收](docs/reviews/TRAIT_DISPLAY_UNIFICATION_ACCEPTANCE.md)

### 2.7 全力投球最小修復（2026-10-13；受驗程式a1658c9）

- [x] **BUG-PITCH-EFFORT-01** — 僅修正callback的S.effort寫入值，全力投→全力投球；原生53案、Linux Quick47／Full65入口、新專項36案及Preview29案PASS。通常／省エネ投手與IF完整S／選擇／RNG保持，全力成績／TJ及後續分支差異可追溯且新版重播一致。不改公式、係數、直接R呼叫或舊fallback；歷史測試採真實通常投球控制，不增加S排除。CI／Preview及本機失敗保留見末節。[驗收](docs/reviews/FULL_POWER_PITCHING_ACCEPTANCE.md)

### 2.8 G1-A 限定前置修正（2026-10-14；PASS / ACCEPTED）

- [x] **BUG-AWARD-PHOENIX-JP-01** — 使用者正式接受日文最優秀投手賞／首位打者／本塁打王復活漏判修復。glass解除、phoenix一次、pool+8；GoldGlove／All-Star不新增资格；歷史名稱保持。原7漏判及88唯一原生fixture通過，兩個Full期待值修正後Windows Quick48／Full67入口PASS。保留原65／2失敗證據；僅限定G1-A，不實作新獎。[驗收](docs/reviews/G1_A_LIMITED_FIX_ACCEPTANCE.md)
- [x] **BUG-AWARD-DEMOTION-JP-01** — 使用者正式接受當年度日文最優秀投手賞／首位打者／ゴールデングラブ賞保護漏判修復；goodReal與公式不改，All-Star不新增保護。88原生fixture及回歸通過；B08跳過既有55%降格抽選的R1→0為已追溯短路，非額外抽選。CI／Preview／實機未執行，不能冒充全ID consumer完成。[驗收](docs/reviews/G1_A_LIMITED_FIX_ACCEPTANCE.md)

### 2.9 D2投手獎項本地接受（2026-10-15）

- [x] **TRAIT-PITCHER-TC** — `LOCAL_PASS / USER_ACCEPTED`。正式P01～P08第一階段及可信同年同聯盟三實得P07／pitcherTC／MVP已由A與B驗收並獲使用者接受；B本機提交56e72d9792529f3221c1a1ffadaf563bceebe26d。Quick61／Full80、原生producer→Decision→Receipt→Consumer、PC／320／390及四條A策略／同B重播證據見[B驗收](docs/reviews/PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md)。新獎自然平衡與完整B實機UI仍未驗證；版本／CI／Preview／發布由D2-G9-RELEASE獨立追蹤，不混為已發布。

### 2.10 C級高校與弱小校の星（2026-10-22狀態同步；既有1.12.0實作）

- [x] **TRAIT-SMALLSCHOOL-SEMANTICS-01** — `IMPLEMENTED / CLOSED`。舊B→hsTier3待決已由使用者批准的C級方案取代：新增10所C級高校、出生抽選S/A/B/C＝25/45/20/10%、HS C補正−4；以不可變birthHighSchool快照判定出生C及既有reachedTop，UNKNOWN不補發、舊true保留。規格及產品已納入1.12.0，公開1.13.0亦包含；不再列為尚未設計或尚未實作。既有驗收：原工作樹Quick48／Full67 PASS；升版1.12.0 Quick48及兩個局部Full入口PASS；受驗產品d8f2df9的Quick CI48、Preview特性18案及修復後C專項28案PASS，各自版本／工具修復限制見[驗收](docs/reviews/TRAIT_SMALLSCHOOL_C_IMPLEMENTATION_ACCEPTANCE.md)。本輪依既有批准及證據同步結案，未重新測試；真實裝置及全國校名無碰撞仍未驗證，不擴大為全功能驗收。COPY-01全量清查仍保持未完成。

### 2.11 LEGACY契約舊本體清理（4-A限定範圍）

- [x] **CONTRACT-LEGACY-01** — `VERIFIED_IN_TESTED_PATHS / CLOSED_SCOPE_LIMITED`。依[物件導向化計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md) §2f.5-2、§2f.7：使用者同意的DEAD_CALL驗證涵蓋23個瀏覽器E2E，舊makeOffers／pickOfferUI無執行期呼叫；4-A刪除舊本體及拆殼，8生涯DOM／S／RNG一致，已由PR #12（d3efd11）併dev。這不是全路徑不可達證明，原Full 84 PASS／1 FAIL及限定修復重測、stage10比較基準造成的預期FAIL均保留在原計畫；第5期後另有確定來源86入口全PASS證據，不回改原FAIL。市場／規則重設、4-B／4-C／4-D與整體重構不在此結案範圍；後續仍由REFACTOR-AUDIT-01追蹤。

### 2.12 無呼叫端程式碼清理

- [x] **CODE-DEAD-01** — `MERGED / CI_PASS`（2026-11-01；PR #44併dev（`7de1fd1`））。依[物件導向化計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md) §2cc：分支`refactor/code-dead-01`（`45cccd7`）已刪除`statBonus`、`checkTraitsMid`、`teamChampRate`、`teamListOf`、`CHEER_DEFAULT`、`ageGateUSA`、`nextContractId`、`settlePhaseEnd`的PRO不可達分支（三處共2,390 bytes，更正§3.18的3,548 bytes），以及掃描新發現的`CPBL_TEAMS`、`NPB_TEAMS`、`MLB_TEAMS`、`HS_CUPS`、`U_CUPS`、`currentAffiliation`、`faFlow`薄包裝、`selPos`。Quick 68／68、分組Full 93／93 PASS（macOS＋Brave本機證據），經PR #44併dev（`7de1fd1`，樹與`17b271b`相同），[Tests #111](https://github.com/tt-chin/yakyujinsei/actions/runs/41275581402) Linux Full（`17b271b`）8批全success，`expected 93`、`acceptedPass 93`、`issues []`（記於PR #44），結案條件已滿足。`game.js`未使用的import 86個（含本次新增5個）不動，第26期（§2ee，`refactor/run-draft`）再增5個（`acceptDraftSelection`、`declineDraftSelection`、`draftSigningTerms`、`NPB_BONUS_RANGES`、`createSigningBonusTerms`），併入後為91個，第28期（§2gg，`refactor/trait-result-card`）再增2個（`TRAIT_TEXT`、`EVENT_TRAIT_TEXT`），併入後為93個，第29期（§2hh，`refactor/initial-state`）再增3個（`highSchoolTier`、`installBirthHighSchool`、`ensureEventState`），併入後為96個，第30期（§2ii，`refactor/choice-prompt`）再增2個（`createChoiceActionToken`、`runChoiceAction`），併入後為98個：E2E注入的hook在模組內直接引用，刪除會造成`markSalaryPaid is not defined`；未使用的區域變數與`navigation.js`的`renderRecord` import不在本項範圍。

## 3. 未完成工作（20 項；另2項UI-MRTEAM-NICKNAME-01、UI-PLAYER-RANDOM-NAME-01列於文末2026-11-15紀錄，合計22項；文末另有已結案的UI-BOARD-MENU-STACK-01；本節另保留已結案索引）

### 3.1 P1 — 規格、回歸驗證與待決（2項未完成；保留1項已完成索引）

- [ ] **AUD-02** — `IMPLEMENTED_UNVERIFIED`。第五階段完成16章／84規格群組對照：MATCH49、MISMATCH3、UNVERIFIED27、DESIGN_PENDING1、OBSOLETE4；quick44 PASS。完整數值邊界、全DOM／跨功能互動及實機仍缺，**調查完成不等於全規格驗收完成**。[2026-10-11證據](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)。發現差異僅記錄，不修改遊戲。
- [ ] **REFACTOR-AUDIT-01** — `IMPLEMENTED_UNVERIFIED`。第五階段已建主要S讀寫地圖、40模組AST索引（991函式節點／4193呼叫節點）、196 RNG語法點、32頂層覆寫群組、LEGACY委派與[分批路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md)。動態scope／所有callback可達性未完全證明，保持未完成；**早期稽核不構成後續實作授權，後續僅以各期已批准範圍為準**。[2026-10-11證據](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)。2026-10-18另立[game.js物件導向化分期計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md)（第1期`Rng`）。第1期已於同日本機實作並完成L3驗證（基準`650e4dd`、許容差分無；Full 79 PASS／2 FAIL，2件FAIL於未改HEAD同樣發生，見計畫§2.9）。第1b期（RNG觀測hook：E2E計數改經`careerRng.onDraw`，掛鉤失效時丟`RNG_INSTRUMENT_MISS`）同日本機完成L3驗證（Full 82 PASS；656個artifact的RNG計數與第1期差異0，見計畫§2b.6）。第1／1b期已經PR #5併入`dev`（`36fc242`），Preview以`replay-share-theme-e2e --ui-only --preview`確認PASS；本機Docker Linux Full亦確認重構前後RNG計數差異0（見CI-LINUX-FULL-01、計畫§2.10）。第1c期（`ri`／`pick`／`chance`／`N0`方法化）因測試以`R`為強制與追蹤的唯一入口，經使用者決定暫緩（計畫§2c）。不改變本ID狀態。 最新進度（2026-10-24）：第2期GameView（PR #8／26efa59）、第3期CareerSession（PR #10／4036e87）、第4期4-A（PR #12／d3efd11）、第5期CareerPresenter（PR #14／86b4f03）、第6期SeasonStats（PR #15／34ed23c）、第7-A（PR #16／67dcab9）及第7-B international-selection-policy（PR #17／52e4cdb）均已併dev。各自本機驗證／原FAIL／修復及環境差異見計畫§2d.11、§2e.8、§2f.7、§2g.8、§2h.8～9、§2i.8／16；7-B記錄Quick67／Full87全PASS與8生涯DOM／S／RNG一致，屬macOS＋Brave本機證據，不是最新SHA的Linux Full。最新CI／部署確認見第1.3節。第8期殿堂評分policy（PR #19／7940e97）及第9期守備位置policy（PR #20／f4a2894）已併dev（計畫§2j.8、§2k.8）；第10期能力評價policy已於本機完成（§2l.7，實作commit e75159e，分支refactor/ability-evaluation，PR待PR #21與ci/pitching-split合併）；年度狀態機§3.6不等於存檔／續玩已實作。計畫首頁總表已同步至第10期。第11期候補調查（領域地圖、流程狀態機方向、路線A／B）見計畫§3.11；第11期流程狀態機（A＋B）細部計畫見§2m，實作未批准。 2026-10-31：葉領域組件化路線見計畫§3.15；第18期事件・戀愛（PR #38／9f8664a）已併dev；第19期SeasonAwards（`docs/src/engine/season-awards.js`）本機Quick68／Full93全PASS（§2w.6，macOS＋Brave本機證據，不是最新SHA的Linux Full），`renderCheckpointCard`留在game.js。不改變本ID狀態。 2026-11-08：第20～35期進度見第4節「CI殘項及稽核」與計畫§3.22；第34期SeasonPhases（PR #62）已併dev並隨PR #63併main（`a8859b9`），Linux Full 99／99 PASS（計畫§2mm.6）；第35期ProfessionalSeason（PR #64）已併dev（`d3d2a53`），Linux Full 100／100 PASS（計畫§2nn），尚未發布main。不改變本ID狀態。
- [x] **HIST-SPEC-CLAUSE-01** — `CLOSED_BY_DECISION`（2026-11-15使用者決定採用第九階段§7提案）。歷史全條文逐條核對改為「歷史資料保留與按需追溯」：平常以CURRENT_SPEC、現行技術設計與既有驗收為維護面；只在出現SPEC_GAP或意圖衝突時，依第八階段固定SHA來源台帳（封存`803e81e`、刪除`004cd26`，59筆文件紀錄）查原文，追溯結果附CURRENT技術來源，原文不自動成為政策。已知限制（不再系統性核對）：舊數值表與修訂理由、§19–22舊API／翻譯條款、參考作品公式與未採用候選、只存Git的批准背景；學校tier地域已由1.12.0 C級高校方案取代，U07舊稱號key已由TRAIT-INITIAL-STATE-FIX-01／TRAIT-SMALLSCHOOL-SEMANTICS-01處理。不移入正式規格、不恢復舊規則、不刪原文；AUD-02、COPY-01各自保持。[範圍與限制](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)、[提案](docs/reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md)


### 3.2 P1 — 退休與殿堂研究、決策（5 項）

- [ ] **HOF-NATURAL-SAMPLE-01** — `IMPLEMENTED_UNVERIFIED`。現有固定案例及 50 條完成生涯，但自然生涯沒有足夠到達 KBO／MLB 一軍的樣本；四聯盟比較與 4,000 有效生涯目標尚未完成。先改進研究路線與樣本品質，**不修改殿堂規則**。2026-11-15：研究工具`retirement-hof-pilot`在1.16.10重放斷言FAIL（隨機空白姓名，非遊戲bug；暫存副本填固定名後PASS）；研究路線草案見[研究計畫](tasks/HOF_NATURAL_SAMPLE_PLAN.md)；同日依code owner審查建議改寫第二版（策略拆成聯盟×育成兩維度、投手／野手分組分階段試跑、兩個手動重放入口另案），H1～H4已批准（code owner 06:53確認），未授權實作。
- [ ] **HOF-BUCKET-DECISION-01** — `CI_PASS / DEV_MERGED / PREVIEW_PENDING`（2026-11-13核對；PR #74、Full 42497795539與合併Quick 42551250884，詳見§1現況摘要）。四聯盟殿堂只計當聯盟一軍；二軍／育成／MiLB保留紀錄但不計入，未知歷史階級不推測。[批准規格](tasks/HOF_JERSEY_APPROVED_SPEC.md)。
- [ ] **HOF-PITCHER-BALANCE-01** — `RESEARCH_ONLY / NOT_IMPLEMENTED`。只調查SP／MR／CL與指標，暫不採A／B／C或改係數；不影響另已批准的一軍篩選及國際榮譽變更。[批准規格](tasks/HOF_JERSEY_APPROVED_SPEC.md)。2026-11-15併入[研究計畫](tasks/HOF_NATURAL_SAMPLE_PLAN.md) S4（角色別分析，只出報告）。
- [ ] **HOF-HONOR-POLICY-01** — `CI_PASS / DEV_MERGED / PREVIEW_PENDING`（2026-11-13核對；PR #74、Full 42497795539與合併Quick 42551250884，詳見§1現況摘要）。保留MVP／最優秀投手至少明星、部門獎至少主力並展示實際理由。個人獎與球隊優勝按取得當年聯盟，不能重複加分；國際榮譽獨立展示、各聯盟分數及下限貢獻為0。移除現NPB國際加分是規則變更，非純UI。[批准規格](tasks/HOF_JERSEY_APPROVED_SPEC.md)。
- [ ] **HOF-DISPLAY-ROUND-01** — `CI_PASS / DEV_MERGED / PREVIEW_PENDING`（2026-11-13核對；PR #74、Full 42497795539與合併Quick 42551250884，詳見§1現況摘要）。以未取整分數判定；顯示適當精度，仍可能誤解時標示基準未達，不調整入選規則。[批准規格](tasks/HOF_JERSEY_APPROVED_SPEC.md)。

### 3.3 P1 — 實機與日文文案（1項未完成；3項實機已結案）

- [x] **EVT-1102-ANDROID** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-08）。Android Chrome年度事件去重與途中Seed分享：使用者在本對話明確確認「已實作、待驗收或決策的都已驗收完成」，依前一則逐項列出的已實作待驗收範圍記為使用者驗收結案；未新增代理測試或提供裝置／付款原始紀錄，不虛構型號、OS、交易金額或測試步驟。原有實作及測試／未驗時點見文末「已實作項目驗收結案」歷史原文。
- [x] **UI-17-DEVICE** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-08）。iOS Safari／Android Chrome顯示設定與事件：使用者在本對話明確確認「已實作、待驗收或決策的都已驗收完成」，依前一則逐項列出的已實作待驗收範圍記為使用者驗收結案；未新增代理測試或提供裝置／付款原始紀錄，不虛構型號、OS、交易金額或測試步驟。原有實作及測試／未驗時點見文末「已實作項目驗收結案」歷史原文。
- [x] **SHARE-111-DEVICE** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-08）。iPhone／Android／PC原生分享、取消、PNG主題與圖片分享儲存：使用者在本對話明確確認「已實作、待驗收或決策的都已驗收完成」，依前一則逐項列出的已實作待驗收範圍記為使用者驗收結案；未新增代理測試或提供裝置／付款原始紀錄，不虛構型號、OS、交易金額或測試步驟。原有實作及測試／未驗時點見文末「已實作項目驗收結案」歷史原文。
- [ ] **COPY-01** — `IMPLEMENTED_UNVERIFIED`。全量可到達日文文案、棒球術語與畫面位置仍待清查；COPY-001～005已於1.12.0完成實作及限定驗收，見[COPY驗收](docs/reviews/COPY_01_P1_IMPLEMENTATION_ACCEPTANCE.md)，不再重做這五項。與v1.8.2的92事件翻譯替換分開管理；本輪1.13.3只修送別事件，不能據此結案全量COPY。2026-11-15：稽核文件再核對（`1494a24`）——COPY-001～005已套用、006～015仍存在、023／024已隨重構移除；新增候選COPY-027～033（括號、半形逗號、「跨リーグ」等），均未修改；同日code owner決定採用方向（COPY-029改為「主要4リーグ一軍通算」並限定一軍合計、COPY-013依版面驗收試改、011／012／031先核對語義），已決定但未授權實作；同日08:57 code owner補充011／012／031核對結果與建議文字（カテゴリー別通算成績、経過シーズン数、米国国際契約の制限対象外として扱いました），記為建議、勾選不變（[再核對與決定](docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md)）。

### 3.4 P2 — 規格待決與保留（2項未完成；保留11項已完成索引）

- [x] **TRAIT-CHAMPIONMAKER** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-08）。優勝請負人Preview：使用者在本對話明確確認「已實作、待驗收或決策的都已驗收完成」，依前一則逐項列出的已實作待驗收範圍記為使用者驗收結案；未新增代理測試或提供裝置／付款原始紀錄，不虛構型號、OS、交易金額或測試步驟。原有實作及測試／未驗時點見文末「已實作項目驗收結案」歷史原文。
  - 歷史修復時點（2026-11-06，後續結果見§1）：KBO舊版比較未納入新增技術欄位，巨大斷言差異輸出造成OOM；原始FAIL保留。限定修正採舊優勝紀錄獨立oracle、原始digest驗證與逐步首差異診斷，不修改產品／Runner／golden。同版完整重播比較保留；比較器23項PASS、KBO限定與完整模式PASS、全新Quick 71 PASS／0 FAIL。證據：test-results/kbo-oom-fix-targeted/summary.json、test-results/kbo-oom-fix-full-profile/summary.json、test-results/kbo-oom-fix-quick/summary.json。整套Full修正前執行已中斷，原日誌與INTERRUPTED.json保留，尚未取得目前來源的整套Full PASS；Preview仍NOT_RUN，不結案。
  - 歷史本機Full排程（2026-11-06，非目前CI狀態）：使用者批准沿用8批、最多2批並行；新增local-full-batches.mjs入口，不變更CI workflow、原Runner、manifest與遊戲案例。工具9 PASS；既有批次工具更正過期92→現行96計數後31 PASS／0 FAIL／1 SKIP（Windows的Linux專用驗證）。新Quick 71 PASS／0 FAIL；該次96項Full已結束，80 PASS／16 FAIL，非PASS，證據test-results/local-full-1140-two-workers-r1/（來源manifest、plan、coordinator、各batch、最終aggregate）。完成前不得標為PASS，artifact缺口與Preview仍獨立未驗證。
- [x] **UI-TJ-GAUGE-01** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-08）。TJ小數一位及上限顯示Preview：使用者在本對話明確確認「已實作、待驗收或決策的都已驗收完成」，依前一則逐項列出的已實作待驗收範圍記為使用者驗收結案；未新增代理測試或提供裝置／付款原始紀錄，不虛構型號、OS、交易金額或測試步驟。原有實作及測試／未驗時點見文末「已實作項目驗收結案」歷史原文。
- [x] **UI-BOARD-SHADOW-01** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-08）。球團名稱陰影Preview：使用者在本對話明確確認「已實作、待驗收或決策的都已驗收完成」，依前一則逐項列出的已實作待驗收範圍記為使用者驗收結案；未新增代理測試或提供裝置／付款原始紀錄，不虛構型號、OS、交易金額或測試步驟。原有實作及測試／未驗時點見文末「已實作項目驗收結案」歷史原文。
- [x] **UI-DESIGN-TOKENS-01** — `MERGED / RELEASED_SCOPE_LIMITED`（2026-11-02核對）。原訂結案條件為「PR合併後勾選」；PR #26合併`7ef43d368855c71f21ee40479dc560fcf542ee8b`與實作`fcb22a9`均為目前main `2fe5b25`祖先（git merge-base核對），1.13.6正式發布與指定來源Full證據見[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)2026-10-31／11-01紀錄。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §2／§6：第1段以Noto Sans JP起首的日文字體列取代Noto Sans TC，新增圓角／陰影token及字體載入斷言；原本機FAIL與重測記錄保留於計畫。僅結案此段已批准範圍，不代表Windows字體回退／手機實機或第2～4段（特性標籤／球團徽章元件化、分享圖token、版面token）已驗收，不擴大實作授權。
- [ ] **UI-DESIGN-TOKENS-02** — `IMPLEMENTED_UNVERIFIED`（2026-11-10新增；2026-11-11實作，1.16.1，`ui/design-tokens-02` `8086480`，Quick 89／89、本機8批Full 116／116 PASS（macOS＋Brave本機證據），reviewer無阻擋性發現，見設計系統計畫§8.4；PR #77已併dev（c66b78f）、dev Quick 43077212225成功，Preview確認待完成）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) 第2段，方向已決（§7.3）：退休卡特性標籤（`career-retirement.js`）改用class＋token並隨主題變色（有意的視覺變更，PATCH）；球團徽章（`career-presenter.js` `board()`）改用class＋token、外觀不變（細部計畫時再確認）。現況與測試耦合見§7.1／§7.2。完成條件：細部計畫與D表批准、實作、`career-presenter.test`核准差異追加、退休卡特性標籤補直接斷言、4主題×PC／手機顯示確認、版本與CHANGELOG更新、PR併dev。
- [ ] **UI-DESIGN-TOKENS-03** — `IMPLEMENTED_UNVERIFIED`（2026-11-10新增；2026-11-11依模板化路線改為P1；2026-11-12實作，1.16.2，`ui/design-tokens-03`，Quick 90／90 PASS（macOS＋Brave本機證據），NC1～NC14 FAIL，reviewer 3輪無中以上發現，見設計系統計畫§10.4；PR #78已併dev（7d08f0c）、dev Quick 43245735982成功，Preview確認待完成；2026-11-12發現Full限定4項E2E因`getSharePalette`移除而FAIL，dev已以`86969a5`（`routeHistoricalShareTheme`）修正；-04分支原帶的同類修正`84b1e69`於合併dev時移除，見§10.4）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §9 P1／§10：分享圖於繪製時讀目前主題的CSS token（`rgb()`直接解析，其他格式經canvas），新增`--share-edge`／`--share-soft`／`--share-tag-*`／`--share-tag-removed-*`；standard／classic分享PNG不變，night／scoreboard特性標籤改深色、dim／bad對齊畫面。`share-theme.js`以核准overlay移除色表。canvas字體移至UI-DESIGN-TOKENS-06。完成條件：PR併dev、Preview 4主題×PC／手機確認。
- [x] **UI-DESIGN-TOKENS-04** — `DEV_MERGED`（2026-11-11新增；2026-11-12細部計畫批准並實作，`ui/design-tokens-04`，版本不變，Quick 90／90 PASS（macOS＋Brave本機），T5無差異探測PASS，負控制8項FAIL，reviewer無中以上發現，見設計系統計畫§11.4；PR #81已併dev（`b4239d4`），dev手動Full 43349530209 8批與Aggregate success，隨1.16.4經PR #83併main（`ca3ee32`）；2026-11-13依完成條件結案）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §9 P2／§11：主題id與名稱只在`docs/src/ui/theme-catalog.js`定義一次，`preferences.js`（overlay核准）與測試由此清單迭代；`themes.css`／`index.html`以雙向一致性測試對應；`share-theme.js:3`留待P3。外觀不變。完成條件：PR併dev。
- [x] **UI-DESIGN-TOKENS-05** — `DEV_MERGED`（2026-11-11新增；2026-11-13 P3探測完成：現值無法以共用規則重現，統一後的視覺比較見設計系統計畫§12；2026-11-14 code owner選§12.3 A統一（使用者轉達）；細部計畫§13經PR #85提出，使用者2026-11-14批准，本機實作於`ui/design-tokens-05-impl`，Quick 90／90、本機Full 117／117 PASS（macOS＋Brave，非CI），見§13.9；1.16.5，併入PR #85；PR #85已併dev（`d5433e2`），dev push Quick 43561784095成功，Preview的`config.js`／`themes.css`／`share-image.js`與dev逐位元組一致，4主題×PC／手機畫面未確認；2026-11-14依完成條件結案）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §9 P3：每主題約12個基礎色，元件色在主題區塊外以`color-mix()`推導、手調值於主題區塊覆寫；舊名保留為別名；`display-preferences.test`的hex對比改為瀏覽器computed style並迭代主題清單。外觀依A改變（PATCH；-02已批准的標籤色與night／scoreboard分享圖隨之改變，焦點框、潛力標記、陰影另行設計）。瀏覽器底線Baseline 2023（§9.3），實作時寫入`CURRENT_SPEC.md`。完成條件：細部計畫批准、實作與PR併dev（皆已完成）。
- [x] **UI-DESIGN-TOKENS-06** — `DEV_MERGED`（2026-11-11新增；2026-11-14拆出canvas字體為UI-DESIGN-TOKENS-07；同日T表批准並於分支`ui/design-tokens-06`實作，[PR #86](https://github.com/tt-chin/yakyujinsei/pull/86)；PR #86已併dev（`08b3aca`），dev push Quick 43580585124成功，4主題×PC／手機Preview畫面未確認；2026-11-14依完成條件結案）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §9 P4／§14：字級（`--fs-*` 19個）、圓角（7／9／12px）、陰影（5個）以現值改token；`index.html`、`career-retirement.js`、`share-image.js`寫死的inline版面值移入`base.css`規則；主題區塊可覆寫非顏色token。間距不做token（W1 c，併入UI-DESIGN-TOKENS-08）。外觀不變，版本不變（挙動不変）。本機驗證（macOS＋Brave，非CI）：Quick 91／91、8批Full 119／119 PASS；`design-tokens-06-e2e`對`d5433e2`比computed style＋尺寸33,024次0差異；負控制7項皆在預期斷言FAIL。完成條件：PR併dev。
- [x] **UI-DESIGN-TOKENS-07** — `DEV_MERGED`（2026-11-14由UI-DESIGN-TOKENS-06拆出；同日細部計畫（W6／W7、D／T表）批准並於分支`ui/design-tokens-07`實作，1.16.6；本機驗證（macOS＋Brave，非CI）：Quick 92／92、8批Full 121／121 PASS，負控制7項皆在預期斷言FAIL，reviewer無中以上發現，見§15.5；[PR #87](https://github.com/tt-chin/yakyujinsei/pull/87)已併dev（`62f80c0`），dev push [Quick 43590931500](https://github.com/tt-chin/yakyujinsei/actions/runs/43590931500)成功，4主題×PC／手機Preview畫面未確認；2026-11-14依完成條件結案）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §14.6／§15：分享圖canvas字體（`share-image.js` 20處）改讀`--sans`／`--mono`，繪製前等待web font載入；分享PNG像素改變（PATCH），不隨字級設定改變；像素比較先寫入舊字體再比位元組。完成條件：細部計畫批准（2026-11-14已批准）、實作與PR併dev。
- [x] **UI-DESIGN-TOKENS-08** — `DEV_MERGED`（2026-11-14新增，使用者決定「收斂為級距另立項」；同日細部計畫與對照圖經PR #89併dev（code owner確認外觀），於`ui/design-tokens-08-impl`實作，1.16.7；本機驗證（macOS＋Brave，非CI）：Quick 92／92、8批Full 121／121 PASS，`design-tokens-08-e2e` 45,072次比較0差異，負控制5項皆在預期斷言FAIL，reviewer無中以上發現，見§16.7；[PR #90](https://github.com/tt-chin/yakyujinsei/pull/90)已併dev（`f8afd8e`），dev push [Quick 43603396112](https://github.com/tt-chin/yakyujinsei/actions/runs/43603396112)成功，4主題×PC／手機Preview畫面未確認；2026-11-14依完成條件結案）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §14 決定2／§14.5 W1：字級（-06的`--fs-<px>`）、間距（CSS約160處寫死、約25種值，-06不做token）、圓角收斂為語意級距並改名；外觀會微調。完成條件：細部計畫批准、實作與PR併dev。未授權實作。2026-11-14使用者決定（§16.2 W1～W6）：本ID限字級（19→13級，t-shirt名）與圓角（7／9／12px併入8／10／14px），間距拆為UI-DESIGN-TOKENS-09；草稿驗證見§16.4，T表（§16.6）已批准；W7：依-05前例先以PR附前後對照圖（`tasks/design-tokens-08/`）請code owner確認外觀，確認後於同一PR實作。
- [x] **UI-DESIGN-TOKENS-09** — `DEV_MERGED`（2026-11-14由UI-DESIGN-TOKENS-08拆出；2026-11-15 D／T表批准並於PR #91實作，1.16.8；本機驗證（macOS＋Brave，非CI）：Quick 92／92、8批Full 121／121 PASS，`design-tokens-09-e2e` 82,272次比較0差異，負控制8項皆在預期斷言FAIL，reviewer無缺陷（low 1項已處理），見§17.10；[PR #91](https://github.com/tt-chin/yakyujinsei/pull/91)已併dev（`38ed1bb`），dev push [Quick 43648250959](https://github.com/tt-chin/yakyujinsei/actions/runs/43648250959)成功，4主題×PC／手機Preview畫面未確認；2026-11-15依完成條件結案；同日細部計畫草案§17：W8～W11（對應取最近級距、同距取小；token名`--space-4xs`～`--space-5xl`；`0`維持字面值）使用者決定，草稿驗證完成，W12（板面與卡片左緣對齊的處理）以對照圖`tasks/design-tokens-09/`經[PR #91](https://github.com/tt-chin/yakyujinsei/pull/91)由code owner選A（含`calc`／`auto`／負值的宣告整條不動，改值39處），實作接在PR #91）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §16.2 W3／W4：margin／padding／gap寫死值（2026-11-14盤點168宣告，§17.2以script重計為175宣告、`f8afd8e`；定位值、負值、`auto`、`calc`、`env`不在範圍）收斂為級距2／4／6／8／10／12／16／20／24／32／40／60，不乘`--space-scale`（compact維持元件token）；外觀會微調。完成條件：細部計畫批准、實作與PR併dev。
- [x] **UI-SEED-SHOW-COLOR-01** — `DEV_MERGED`（2026-11-14新增；同日更正前提並改為清理，見本條末；`9d9e781`隨PR #88／#89併dev（`41a39a0`），dev push [Quick 43600000044](https://github.com/tt-chin/yakyujinsei/actions/runs/43600000044)成功，2026-11-14依完成條件結案）。[設計系統計畫](tasks/DESIGN_SYSTEM_PLAN.md) §14.5 W3：首頁`#seed-show`的背景／文字／邊框寫死為`#fff`／`#a71930`／`#d9a1aa`（`index.html:49`），不隨主題變色；-06只照值移入class。改用主題token屬顏色變更（PATCH）。完成條件：配色批准、實作與PR併dev。未授權實作。**更正（2026-11-14）**：上述「不隨主題變色」只依`base.css`判斷，有誤。`themes.css:86`自1.7.0（`2bad9c7`）起以不分主題的`!important`規則將背景／文字／邊框改為`--metric-bg`／`--amber`／`--control-edge`，-06前的inline與現在`base.css:162`的寫死色皆被覆蓋；本機Brave（擋Google Fonts）讀computed style，4主題三色皆等於對應token。使用者決定（2026-11-14）改為移除`base.css:162`無效的寫死色（保留`border:1px solid`），外觀不變、版本不變，分支`ui/seed-show-dead-colors`。新完成條件：PR併dev。

### 3.5 P2 — 未來功能候補（4項未完成；另保留5項已接受索引及1項已結案索引）

- [ ] **INJ-UI-01** — 一般受傷風險細項顯示；計算與 UI 維持單一資料來源。2026-11-15細部計畫草案：I2（顯示總值＋細目）使用者決定；I1＝公開總值＋細目（code owner 06:53確認已決定，須標示範圍與時點）；已決定、未授權實作，實作屬R3。[細部計畫](tasks/P2_DISPLAY_DECISIONS_PLAN.md)
- [ ] **PLY-01** — `SPEC_APPROVED / NOT_IMPLEMENTED`。球團／年度／字串背號履歷，0與00分開；系統固定預設、玩家可改，轉隊優先沿用，同隊可改並記生效年；0、00、1～99只排明確禁號，不模擬隊友占用，不消耗生涯RNG、不影響能力收入成績殿堂。固定選號次序及舊資料處理待實作盤點。[批准規格](tasks/HOF_JERSEY_APPROVED_SPEC.md)。2026-11-15細部計畫草案：D1～D4（固定候選順序、禁號空清單、只增不改紀錄、舊存檔自載入後第一季補號）使用者決定；W1～W6（改號入口、顯示位置、候選表、紀錄觸發、欄位、適用球團）附示意圖`tasks/ply-01/`；同日code owner決定W1＝B（入團時選號）、W2＝a～d（選單按鈕只顯示☰；分享圖不做）、W3～W5照草案、W6＝A（職業球團）。W7＝②（入團選號＋選單改號）、W8＝甲（下一年度開始前集中插入）由code owner決定（06:53），見[細部計畫](tasks/PLY_01_JERSEY_PLAN.md)。全部已決定，（當時狀態）未授權實作。同日使用者決定J1～J7（空窗期、存檔時序、同隊再入團、選號對話框、文案、`#bd-number`、年度別標示），並授權scratchpad草稿與驗證：基準dev `75ab10b`（1.16.13）Quick 98／98、Full 128入口127 PASS／1 FAIL（`event-integration.test`既知SIGSEGV，重跑3／3 PASS），測試耦合依P1～P6處理，見細部計畫§6～§10。同日使用者確認§10文案並授權正式實作（R3，1.17.0，T1～T9）；草稿程式碼保存於遠端分支`wip/ply-01-draft`（`0d617a6`，未開PR，仍屬草稿、非已合併功能）；合併與部署未因此一併授權。同日正式實作開始於本機分支`feat/ply-01-jersey`（未push）：草稿帶入、reviewer審查修正A1～A4／B1～B7（B1～B7為使用者新決定），Quick 98／98 PASS；T8、負控制、T9、Full未完成，見細部計畫§11。2026-11-17起`origin/dev`升至2.0.0（`5910421`）：使用者決定M1～M4、A、B（細部計畫§12），並核准M3合併草稿後的T1～T8（§12.1）；2026-11-18於本機分支完成整合（merge `6badffc`、測試`32f5ce5`～`34e8164`；已push，PR #105（→dev）待合併）：本機Quick 103／103、4組Full 134／134 PASS（runner基準`origin/main` `d6cef67`），N1～N12重跑與新負控制N13～N17全攔下，reviewer無medium以上，見§12.2。T9（版本）待code owner；CI、Preview未執行。另發現`event-system-e2e`在乾淨2.0.0不穩定（本機10次FAIL 4次，`decision-presentation.js`選擇標記競態）；2026-11-18另開PR #106修正（→dev，本機修正版10／10 PASS），待合併。
- [ ] **INT-01** — 各項國際賽事履歷；重用既有結果，不增加 RNG 抽選。1.11.8僅補既存大会結果卡的本大会個人成績及personalStats快照，未新增履歷列表，本ID仍未完成。[本大会顯示驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)。2026-11-15細部計畫草案：N1＝B（引退畫面＋実績）、N2＝A（只列實際出場）由code owner決定（06:53確認）；已決定、未授權實作；須同步修改CURRENT_SPEC §15.1「大会別履歴一覧は追加しない」。[細部計畫](tasks/P2_DISPLAY_DECISIONS_PLAN.md)
- [x] **EVT-01** — 事件分類顯示；不得改變抽選候選及順序。2026-11-15：E1（提示標題＋結果卡）、E2（徽章）、E3（年度事件履歷，要做）使用者決定；E1＋E2另以分支實作，E3＝a（年度別下方摺疊區）由code owner決定（06:53確認）；（當時狀態）E3已決定、未授權實作。[細部計畫](tasks/P2_DISPLAY_DECISIONS_PLAN.md)。E1＋E2經PR #97併dev（1.16.11）；同日使用者授權E3實作（`feat/evt-01-year-history`，1.16.12，[實作計畫](tasks/EVT_01_E3_PLAN.md)），本機驗證見末節「EVT-01 E3 年度事件履歷」。E3經[PR #99](https://github.com/tt-chin/yakyujinsei/pull/99)併dev（`563bf52`，1.16.12），dev push [Quick 43706156239](https://github.com/tt-chin/yakyujinsei/actions/runs/43706156239)成功，Preview驗收（2026-11-15）：Cloudflare Pages部署`a87f94e5`（https://a87f94e5.yakyujinsei.pages.dev ，check完成10:52Z）；12:22Z以`curl -L`＋SHA-256比對固定Preview（https://dev.yakyujinsei.pages.dev ）與該部署的`docs/`下114個HTML／JS／CSS，均與`563bf52`一致（差異0；本機執行摘要，原始輸出未保存）。同日以Playwright MCP驅動Brave 157於固定Preview實測（seed `evt-preview-01`、內野手，高校2026～2028與NPB育成2029）：E1提示標題、E2結果卡、E3年度別事件摺疊列（含職業年度）於1280×900與390×844（只改viewport，非觸控模擬）×4主題正常，徽章文字對比6.74～8.62，無橫向捲動，Console錯誤0；截圖8張見`tasks/evt-01-preview/`。使用者於對話中回報確認Preview並逐步重看（無書面紀錄）。結案。未涵蓋：E1提示標題的非standard主題（同元件的E2已於4主題確認）、2030年以後的職業年度、實機／觸控、Linux Full。2026-11-15：PR #100（分類圖示／事件插圖SVG提案）經code owner否決（S1～S4不採用：維持文字分類徽章，不新增圖示或插圖；理由為手機可用高度與標題寬度），PR已關閉、分支已刪除；不影響已結案的E1～E3。
- [x] **UI-06** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-05）。遊び方內容與整體UI由使用者接受；使用者確認iPhone Safari與Android Chrome實機的開關、捲動、觸控、分享及顯示操作均OK。結合[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)11組對話框本機驗證，在本ID範圍結案；裝置型號／OS／瀏覽器版本未提供，實機結果為使用者回報，非本機自動測試。證據來源：本對話使用者對三項確認回覆「兩者，YES，TES」（TES依上下文理解為YES），及[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)五項UI補驗紀錄。
- [x] **UI-07** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-05）。更新履歷文案與整體UI由使用者接受，雙實機操作通過；結合51版／50摘要核對與本機對話框驗證，在本ID範圍結案。原始詳細歷史及FAIL保留，不將實機確認延伸為全部遊戲規則或其他版本驗收。證據來源：本對話使用者對三項確認回覆「兩者，YES，TES」（TES依上下文理解為YES），及[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)五項UI補驗紀錄。

  1.13.5限定驗證：Chromium 11 PASS／0 FAIL（test-results/information-dialog-accepted/summary.json）、WebKit 11 PASS／0 FAIL（information-dialog-webkit-recheck/summary.json）；320×568、390×844、844×390、390×240、1280×900，含標題／操作區固定、末段可讀、背景還原、keyboard／Esc／外側／native close、快速重開、observer與事件清理、內容及visualViewport變化、無溢出隱藏軌道。Chromium另驗證原生觸控；WebKit手機模式無wheel API，背景鎖定改用scrollBy嘗試，不能冒充iPhone實機。Quick 68 PASS／0 FAIL／0 SKIP／0 BLOCKED、504.095秒（information-dialog-quick/summary.json）；既有選單相關event-fix-e2e通過，S／RNG不變。CI分批工具31 PASS／1 Linux-only SKIP，僅同步新增入口數91→92，不改Runner或CI通過條件。早期FAIL為測試量測（預留padding、短文無section、鍵盤動畫未停止）及WebKit不支援wheel，原始summary保留於information-dialog-initial、information-dialog-recheck-1、information-dialog-chromium-final、information-dialog-webkit。Full／CI／實機Safari NOT_RUN，artifact缺口及其他歷史未驗證狀態不變。
- [ ] **PLY-02** — `DESIGN_DEFERRED / NOT_IMPLEMENTED`。先完成PLY-01。後續只依同球團一軍年資、成績、榮譽設計；本輪不設門檻、不判定、不抽選、不加效果、不宣告完成。[批准規格](tasks/HOF_JERSEY_APPROVED_SPEC.md)。
- [x] **UI-MENU-01** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-05）。使用者確認iPhone Safari與Android Chrome實機開關、捲動、觸控、分享、顯示設定，以及確認後真正重新開始均OK，並接受整體UI。結合本機237項剪貼簿／選單驗證，在本ID範圍結案；不再保留『僅驗取消、真正重新開始未驗』缺口。證據來源：本對話使用者對三項確認回覆「兩者，YES，TES」（TES依上下文理解為YES），及[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)五項UI補驗紀錄。
- [x] **UI-DESKTOP-LAYOUT-01** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-05）。本機60組長契約、36組六分類非零大額收入與六種寬度驗證通過，使用者另接受整體UI及雙實機操作，在本ID範圍結案。不宣稱所有自然生涯、未測裝置或任意資料組合已驗證。證據來源：本對話使用者對三項確認回覆「兩者，YES，TES」（TES依上下文理解為YES），及[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)五項UI補驗紀錄。
- [x] **SUPPORT-01** — `USER_ACCEPTED / CLOSED_SCOPE_LIMITED`（2026-11-08）。OFUSE功能及收款設定／實際收付款待驗收範圍：使用者在本對話明確確認「已實作、待驗收或決策的都已驗收完成」，依前一則逐項列出的已實作待驗收範圍記為使用者驗收結案；未新增代理測試或提供裝置／付款原始紀錄，不虛構型號、OS、交易金額或測試步驟。原有實作及測試／未驗時點見文末「已實作項目驗收結案」歷史原文。

#### UI驗收現況（2026-10-23同步）

以上五項已納入遠端dev，最新核對HEAD為52e4cdb、1.13.3；main仍650e4dd／1.13.0。1.13.2提交前26efa59加工作樹Quick63／0與Runtime兩入口PASS，1.13.3本機Quick64／0與相關UI PASS見[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)，均為各自原始受驗範圍。最新Quick CI與Cloudflare部署已success，Preview目前config為1.13.3，詳細受驗SHA及未驗證範圍見第1.3節；不以部署成功代替使用者UI確認。早期Quick62／1 FAIL及原始快照問題保留，不倒改歷史結果。五項ID保持待審查，實機與付款限制不變。

#### UI實作與驗證歷史（以下「未commit／push」均為當輪提交前記錄）

以上五項為使用者優先組；2026-10-21已完成本機UI實作與相關4入口驗證，後續快照驗證修復後完整Quick63 PASS／0 FAIL，待使用者審查。手機單欄、桌面1180px以上唯讀概要；不包含GameView重構、遊戲規則、金流後端或發布。

PC側欄顯示修正（2026-10-21，1.13.2；基準1bc65dfc2b8ba226930b23dca85a03e678e91253加本輪工作樹）：R2／L2。左右欄取消300px上限，保留中央560px操作領域；契約・収入窄欄改項目／值上下配置，420px以上改雙欄，長期間及金額可折行，不刪資訊。原生Runtime E2E入口1 PASS，涵蓋5個PC寬度×4主題×3字級的60組顯示fixture，以及1280／320／390px既有操作和S／RNG不變檢查。初回原生FAIL為dialog非同步close焦點復原競態，直接修復後限定重測PASS；原始FAIL保留sidebar-width-20261021-native，重測為sidebar-width-20261021-native-retest。新完整Quick63 PASS／0 FAIL／0 SKIP／0 BLOCKED（246.179秒），報告test-results/sidebar-width-20261021-quick/summary.json。版號精確期待同步1.13.2，歷史快照與golden不改。Full NOT_RUN（局部UI無規則／RNG改動）；CI／實機NOT_RUN，待使用者審查，不代表發布。未commit／push／部署。 提交前因dev已合併GameView改動，於26efa59edce5fed88ebccaaab794755e6e55a109加本輪工作樹重新驗證：Quick63 PASS／0 FAIL（257.488秒），相關Runtime兩入口PASS（event-fix-e2e及game-view-dom-e2e；後者PC／手機完整生涯DOM／S／RNG一致）。證據test-results/sidebar-commit-quick及sidebar-commit-native；不冒充完整Full。

快照驗證修復（2026-10-21，TEST_FIX_ONLY）：只修改tests/award-identity-policy.test.mjs及本紀錄，不改產品。兩份原始Git快照SHA256保持既有常數，以固定2a11a64來源核對原始bytes，工作樹只正規化CRLF→LF比較；文字、空白、末尾換行、單獨CR、非法UTF-8及Git原件竄改仍拒絕。main／navigation／config按已批准1.13.1 UI建立精確預期替換，沒有整檔豁免或擴大allowedB。限定135案PASS，新完整Quick63 PASS／0 FAIL／0 SKIP／0 BLOCKED（299.032秒）；原Quick62／1及其他FAIL保留，屬修復前歷史結果，不改寫為PASS。報告test-results/snapshot-contract-20261021-quick/summary.json；Full本輪NOT_RUN（僅測試契約修正），CI／實機／付款仍非本輪驗證。未commit／push／部署。

本輪驗證（2026-10-21，HEAD 2a11a64加工作樹／1.13.1）：R2／L2；原方向鍵冒泡FAIL已修復並保留首次紀錄；首輪Quick60 PASS／3 FAIL，初始化位置及精確版號斷言修復後，最終Quick62 PASS／1 FAIL。剩餘award-identity-policy.test為未修改B1快照工作樹CRLF與原Git LF hash差異，未修改HEAD測試亦可重現；舊G9凍結來源契約對後續UI／版號調整亦須另審，不自行放寬。相關4入口與直接3入口PASS，投手／野手固定Seed主RNG652／549比較不變；原生Menu／Share fixture S／RNG不變。Full NOT_RUN（本批局部UI，無遊戲規則／RNG改動）；OFUSE實際付款、iPhone／Android原生分享NOT_RUN。原FAIL及新log留在忽略的test-results/menu-20261021-*；來源hash清單menu-20261021-source-audit.json。未commit／push／部署，待使用者審查。

### 3.6 P1 — CI殘項（6項未完成；另保留1項已完成發布索引、4項已併dev的CI項目及2項本機測試修復）

- [x] **TEST-VERSION-LITERAL-01** — `FIXED / LOCAL_QUICK_PASS`。修復前（2026-11-02）award-identity-policy.test與verify-modularization硬編碼預期1.13.7，在1.13.8 FAIL；原始兩份log仍保留於test-results/release-notes-1138-quick-20261102/。使用者批准後改讀config的VERSION，檢查正式三段版號及只變更原版本字面值，其餘config原文、B1／A凍結hash與負面斷言保留，不任意接受額外程式。限定6／6及最終本機Quick69／69 PASS（[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)summary）。僅結案此版本比較問題，不將原FAIL改記PASS，不代表Full／Linux或部署完成。

- [x] **TEST-SOURCE-EOL-01** — `FIXED_IN_TESTED_PATHS / LOCAL_QUICK_PASS`。修復前4入口career-movement-policy、event-copy.test、income-summary.test、npb-return-ui.test的CRLF／LF文字比較FAIL，原始log／summary仍保留於test-results/release-notes-1138-quick-20261102/。確認Windows core.autocrlf=true、Git內歷史EOL混合及讀取端處理不對稱；使用者批准後以共用tests/support/source-text.mjs在切片／替換前統一嚴格UTF-8讀取及CRLF→LF，保留所有非換行差異與原先逐字／狀態／RNG斷言。19項正反例、6入口限定及最終Quick69／69 PASS；中途漏改readFile的ReferenceError與68／1原報告亦保留，直接修正後重新全Quick通過。此為已驗證路徑的跨平台比較修復，不代表全Repository已批次改成LF、Linux／Full已重跑或所有未來比較自動免疫；新比較須沿用TESTING契約，凍結hash／golden禁止使用此正規化。產品邏輯、歷史原件與全域Git設定未改。

- [x] **D2-G9-RELEASE** — `RELEASED / CLOSED_WITH_SPLIT_RESIDUALS`（2026-10-18）。正式1.13.0發布與基本Smoke已完成，來源650e4dd／正式站15adf28，見[發布驗收](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md#g9與正式1130)。使用者決定以發布範圍結案，殘項拆出：Linux Full與舊工具固定路徑依賴改由CI-LINUX-FULL-01追蹤（本機Docker Linux Full對650e4dd 80 PASS已獲接受為替代證據；2026-10-19指定2a11a64的GitHub Actions Linux Full已82 PASS；舊工具路徑仍待處理，不沿用至1.13.3）；artifact保存由D2-CI-ARTIFACT-01；文件整理見上方索引。未將任何殘項標為PASS。

> 歷史準備快照（2026-10-15，保留原時點）：`RELEASE_PREPARATION / RELEASE_NOT_VERIFIED`。1.13.0 MINOR、CHANGELOG與限定準備驗收已接受；精確dev commit／push及Linux Full啟動已獲本次批准。Linux實際驗證截至本次提交前尚未執行；只有確認Run與受驗SHA後才報CI_IN_PROGRESS，不能預報PASS。CI／最新SHA Preview／使用者確認／正式發布／smoke全部完成前維持未完成；main合併、正式同步及部署仍未授權。artifact問題由D2-CI-ARTIFACT-01獨立追蹤，不阻擋先跑Full，也不因Full PASS而自動結案。來源與限制見[發布準備](docs/reviews/PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)及[CI證據驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)；[原G9報告](docs/reviews/PITCHER_AWARDS_D2_G9_ACCEPTANCE.md)保留為歷史。不得清理A／B或歷史JSON。

- [ ] **CI-LINUX-FULL-01** — `CI_PASS / LEGACY_TOOL_PATHS_PENDING`（2026-10-19）。**Linux Full已於CI取得PASS**：GitHub Actions Run39260159042（Tests #49，`2a11a6444c643002d1c3143fd7827b94ce4ce2eb`，workflow_dispatch，Linux Chromium，58分52秒）8批 10／10／10／11／10／10／10／11 PASS，aggregate `{"status":"PASS","expected":82,"acceptedPass":82,"issues":[]}`，0 FAIL／0 SKIP／0 BLOCKED；`contract-salary-e2e`（`--compare=650e4dd`）135.9秒PASS，未再發生runner shutdown／exit143。artifact 9件已上傳，完整性仍由D2-CI-ARTIFACT-01追蹤。**目前結案條件**：指定SHA的Linux Full PASS已滿足；尚需處理並驗證下列舊工具固定路徑，依2026-10-19使用者決定保持未結案。**剩餘**：舊verify-baseline、freeze-baseline、capture-evidence、receipt-careers等工具可能讀取已放棄的歷史固定路徑（[說明](docs/reviews/RELEASE_1130_DEVELOPMENT_SUMMARY.md)），Full不執行這些工具，本Run未驗證；使用者決定（2026-10-19）此殘項處理前本項不結案。以下為前狀態記錄（保留原時點）。`LOCAL_LINUX_PASS / CI_NOT_RUN`。2026-10-18自D2-G9-RELEASE拆出。GitHub Actions的Linux Full尚未於任何1.13.0以後SHA取得PASS（最後Run38841657256為18 PASS／1中斷／61未執行、exit143，SIGTERM來源未確定）。同日本機Docker（`mcr.microsoft.com/playwright:v1.49.1-noble`：Ubuntu 24.04.1、Node 22.12.0、Playwright 1.49.1／Chromium 131）：`650e4dd` Full 80 PASS／0 FAIL；重構後`5e7a6f1` 81 PASS／1 FAIL（display-preferences-e2e時序競爭，單獨重跑5次PASS，已於01d1c38修正），兩者656個artifact的RNG計數差異0。Node／Playwright版本與CI（24.15.0／1.62.1）不同，不等於CI PASS；證據僅保存於本機未追蹤的`test-results/linux-docker-2026-10-18/`。另含舊驗證工具依賴已放棄固定路徑之殘項（不得捏造舊baseline讓其通過）。2026-10-18補充：Run38841657256（#42，`650e4dd`）job log於`contract-salary-e2e`啟動約118秒時記錄`The runner has received a shutdown signal`後exit143，batch-2起所有步驟（含always）SKIPPED，僅batch-1 artifact（9.57KB）保留；與Run38750999932（#37，`29ae26b`）中斷於同一入口、約120秒。兩次皆以`--compare=7220ad8`（當時origin/main，1.12.0）執行。本機Docker限制2 CPU／7GB（Node 22／Playwright 1.49.1，對`c9c94cd`）：`--compare=650e4dd`時PASS（113秒，cgroup峰值3.49GB）；`--compare=7220ad8`時於career-P階段Node heap OOM（SIGABRT），放寬heap至6GB後容器達7GB遭kernel OOM kill。推定CI的runner shutdown為同一記憶體暴增所致（UNVERIFIED：CI端無記憶體證據，暴增位置未定位）。現origin/main為`650e4dd`，下次CI Full比較基準不同，未實跑不得視為PASS。重現證據保存於本機未追蹤的`test-results/ci143-contract-salary-2026-10-18/`。結案條件：GitHub Actions Linux Full於指定SHA取得PASS，或使用者另行豁免；artifact完整性仍由D2-CI-ARTIFACT-01追蹤。

- [ ] **TEST-EVENT-SIGSEGV-01** — `LOCAL_ARM64_ONLY / 未修正`（2026-11-01）。`event-integration.test`在macOS arm64間歇SIGSEGV（`signal: SIGSEGV`、log空白），單輪Full出現時須記為FAIL，不得改記PASS。macOS crash report的stack全部相同：`vm.runInContext` → `Array.map` → `Builtins_BaselineOutOfLinePrologue` → `Runtime_StackGuardWithGap` → mark-compact → `ClearStaleLeftTrimmedPointerVisitor`，讀取位址`0xe`，對應測試第57行`dpCell`迴圈，屬V8層崩潰。實測（`294e4be`同樹，平行32）：Node 24.14 arm64 62／1280、Node 24.15 arm64 52／1280、Node 24.14 arm64加`--no-sparkplug` 0／320（乾淨`9e6129f`）、Node 24.15 x64經Rosetta 0／640及`--always-sparkplug` 0／320。推定只影響arm64，Linux x64 CI未實測，只有至今未出現的紀錄；V8根因未確認，公開回報未找到。`NODE_OPTIONS`不接受`--no-sparkplug`，無免改repo的本機避開方式。使用者未批准修改測試入口；出現時比對最新`.ips`時間與首幀後重跑，FAIL照實記錄。結案條件：升級Node後arm64平行量測為0，或經批准調整該入口的執行參數。
- [ ] **TEST-DISPLAY-ENTER-TIMEOUT-01** — `LOCAL_LOAD_ONLY / 未修正`（2026-11-01）。`display-preferences-e2e:87`（`retained row listener works`）在本機4組平行Full下，按Enter後5秒內`#act`未改變而FAIL；單輪Full出現時須記為FAIL，不得改記PASS。第29期草稿（基準`4116389`）93 PASS／1 FAIL，單獨重跑3／3 PASS；未在基準做同負載對照，Linux CI尚無此紀錄。同入口同一位置曾有按Enter後立即讀DOM的時序競爭（計畫`5e7a6f1`紀錄），`01d1c38`改為等待內容變化，本次是該等待逾時。本項只記錄，未改測試。完成條件：查明是負載延遲或按鍵未處理後再決定處置，不放寬斷言。
- [ ] **TEST-DT09-DEV-FAIL-01** — `LOCAL_FAIL / 未調查`（2026-11-15）。`design-tokens-09-e2e`在dev `1494a24`（1.16.10）本機（macOS＋Brave 157）單獨執行即FAIL：`computed style / layout differs from f8afd8e (176)`，差異集中於退休狀態P／IF 1280寬的`#log`高度（P/1280 standard/small/standard首見`MAIN#log` 2973.56→2951.97px），390／360寬無新增差異。EVT-01分支（1.16.11）前後同為176，與分類徽章無關；1.16.10時本機曾得0差異（`full122-tokens09-final-r2`），原因與是否只在本機發生均未確認。原始log保留於當時scratchpad，不改寫為PASS；Linux CI結果未確認。
- [x] **TEST-VACUOUS-ASSERT-01** — `FIXED / 本機驗證`（2026-11-08，`refactor/checkpoint-renderer` `ab4fbb1`，併入[PR #66](https://github.com/tt-chin/yakyujinsei/pull/66)，尚未併入dev）。斷言改以helper確認`recordSalaryEvaluation(entry.st);`、`captureSeasonChampionship(S);`、`runSeasonPipeline(0)`在`professional-season.js`各恰好一次，並比對`評價＜快照＜pipeline`的位置；同一test的其他斷言不變。突變4項（快照移到pipeline之後、刪除、移到評價之前、重複）皆由新斷言以`ERR_ASSERTION`抓到；舊斷言對「快照移到pipeline之後」仍PASS（恆真確認）。本機Quick 81／81 PASS（`ab4fbb1`乾淨worktree，與第36期合併後，macOS＋Brave）；Full未在此組合重跑（與已Full PASS的`a08764f`只差此test一行，Full內執行方式相同）。屬只改測試，不升版本。以下為原記錄：`championship-intl.test:81`第二個斷言`indexOf('  captureSeasonChampionship(S);')<indexOf('runSeasonPipeline(0)')`目前恆真：`dc5ac87`（v1.11.0）加入時目標字串存在，`efd4710`（2026-10-15）起`game.js`中該呼叫前為`{`而非兩個空白，`indexOf`恆為−1。第35期（計畫§2nn D9）只改指向`professional-season.js`，未改語意。完成條件：改為實際比對呼叫位置的順序斷言（championship快照在pipeline開始之前），以突變確認順序對調時FAIL，不放寬其他斷言。
- [x] **TEST-LOCAL-FULL-MEMGATE-01** — `FIXED / 本機驗證`（2026-11-08，`fix/local-full-memgate` `a4f1b8e`，尚未併入dev）。新增`parseVmStat`、`readAvailableMemory`：darwin以`vm_stat`的(free＋speculative＋inactive)×頁大小估算可用量；purgeable已含於active／inactive，不重複加計。非darwin或`vm_stat`失敗／格式不符時回退`os.freemem()`。2 GiB門檻與60秒等待不變；記憶體樣本保留`osFreeMemory`並新增`availableMemory`。`local-full-batches.test` 14／14 PASS，突變6項（去掉inactive、加purgeable、預設改回`os.freemem`、失敗不回退、非darwin呼叫`vm_stat`、降低門檻）皆以`ERR_ASSERTION`抓到。乾淨worktree（`a4f1b8e`，macOS＋Brave）：Quick 81／81 PASS；本機Full 107／107 PASS（8批、`resourceBlocked false`、`RESOURCE_WAIT` 0次，1,121秒），期間`os.freemem`最低823 MiB、新估算最低22,326 MiB。CI workflow未變。以下為原記錄：`scripts/local-full-batches.mjs`的記憶體門檻以`os.freemem()`判定（最少2 GiB、等待60秒），macOS上不計vm_stat的inactive／purgeable頁面。2026-11-08第35期本機Full：可用1,668 MiB、inactive約30 GB時派發前`RESOURCE_WAIT`逾時，0／100執行（記為NOT_RUN），關閉應用程式後重跑100／100 PASS。完成條件：darwin以free＋inactive＋purgeable（或等效可回收量）估算並保留記憶體保護，`local-full-batches.test`補對應案例；屬測試基礎變更（AGENTS 6.1 R2），需另行批准，CI workflow不變。
- [ ] **D2-CI-ARTIFACT-01** — `ARTIFACT_COVERAGE_BLOCKED`。已實際執行Linux CI、短路徑Smoke與分批上傳；第1批保存成功不能解除完整原件保存缺口。bounded collector仍未接入正式CI；原始S／RNG／Decision／Receipt的可還原保存契約、容量／敏感路徑及還原驗證未完成。[缺口](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)／[分批限制](docs/reviews/LINUX_CI_FULL_1130_STABILITY_ACCEPTANCE.md)。本項維持未完成，不重跑Full、不刪證據。
- [x] **CI-FULL-STALE-01** — `MERGED / CI_PASS`（2026-10-24；①～③經PR #24併dev（`55e60a4`），④與⑤`:182`經PR #25併dev（`ec903fd`），dev Full [Run40093614384](https://github.com/tt-chin/yakyujinsei/actions/runs/40093614384) 92／92 PASS。原狀態：`IMPLEMENTED / PR_PENDING`；Run40090299447 91／92 PASS）。`dev`→`main`以merge commit合併（`04decb0`，1.13.5），dev push只跑Quick（#78／#79 PASS），Full首次於main手動Run40080471658執行：92入口87 PASS／5 FAIL。①`event-system-e2e:58,72`、②`draft-income-e2e:84`仍比對`b0a82a1`改名前的`スポンサー収入累計`；③`replay-share-theme-e2e:26`的分享PNG對1.11.0（`dc5ac871`）逐像素比較只排除底部100px，收入區已改為`incomeSummary`版面。三者本機重現FAIL，屬舊期待值；修正：①②改比對新標籤`スポンサー収入`（②的baseline側同時接受舊標籤），③以`fillText`記錄收入首行y座標，兩側y必須相同，只比較其上2px以上像素（`textBaseline='top'`，上一列表格完整保留）（負控制：在保留範圍最下列改1像素→FAIL）。修正後本機（macOS＋Brave）三入口PASS。④`game-view-dom-e2e`（`jp3-infielder-01/IF/first-row/1280` step 0 digest不一致但完整快照無差異）、⑤`display-preferences-e2e:87`（Enter後5秒內`#act`未變）本機未重現（④8／8、⑤3／3 PASS，`--baseline=origin/main`），推定為CI偶發。Run40090299447中⑤於`:182`再FAIL（`jp3-infielder-01` `state.pos` `"P"→"IF"`），原因確定為測試時序競態：`#seg-pos`的handler由非同步載入的`game.js:2144`綁定，`main.js`載入後才啟用`#btn-start`；`display-preferences-e2e:134`及`game-view-dom-e2e` `career()`只等`#btn-start`可見即點選守備位置，引擎未就緒時點擊遺失、維持預設P（④之IF step 0不一致而重取無差異亦同因）。修正：兩處改為等待`#btn-start`啟用（`waitForFunction(()=>!document.querySelector('#btn-start').disabled)`，與其他20處相同）；以`game.js`延遲1.5秒的重現腳本確認舊等待選到P、新等待選到IF；修正後本機兩入口PASS（`display-preferences-e2e` `--baseline=origin/main`、`game-view-dom-e2e` 8／8）。全22處`#seg-pos`點擊盤點後只有此兩處競態。Run #80的⑤`:87`（Enter後`#act`未變）原因仍**未確認**。完成條件：修正併入dev後dispatch Full，92入口全PASS；`:87`再現時另行調查。

> 歷史準備快照（2026-10-15，保留原時點）：`ARTIFACT_COVERAGE_BLOCKED`。CI job timeout已由60提高至120分鐘，但Linux實際驗證截至本次提交前尚未執行。bounded evidence collector限定測試47 PASS／0 FAIL，尚未接入正式CI；現有artifact glob保持，Full原始S／RNG／Decision／Receipt等證據仍有保存缺口。使用者接受先啟動Linux CI Full，完整封存另行改善；CI Full執行結果、workflow／上傳結果與artifact完整性須分開報告，保存完整性不得標PASS。結案需核准並驗證Gate→case→原件保存契約、超大JSON／64MiB上限處理、敏感路徑安全保存、缺失／損壞／超額與下載還原一致性；不得只用hash索引冒充完整可重播證據。未另行批准不接collector、不取代或擴大glob、不改Full條件或golden。[缺口與限定驗收](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)。

- [ ] **TEST-COMPARE-BASELINE-01** — `CI_PASS / DEV_MERGED / PREVIEW_PENDING`（2026-11-13核對；PR #74、Full 42497795539與合併Quick 42551250884，詳見§1現況摘要）。逐項批准差異：背號只允許背號／履歷等新增資料，其餘能力收入成績及RNG嚴格一致；殿堂規則變更另列評分／稱號／演出差異。不得全份比較略過或因版本不同接受未知FAIL；殿堂政策的工具接線、負向控制及112入口Full已通過；仍不將背號未實作或尚無因果證據的未來差異自動放行。[批准規格](tasks/HOF_JERSEY_APPROVED_SPEC.md)。

- [x] **CI-FULL-BALANCE-01** — `MERGED / CI_PASS`（2026-10-24；實作`cdf0a25`隨PR #21併dev（`7fbfde4`，[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §10.7），dev push Quick Run40068894037 PASS 67／67；含`cdf0a25`的Full Run40046088278（`ec54253`）PASS 87／87、wall time 18分43秒，其後Run40055238234（`50139d0`）11分15秒（§11.6）。經使用者同意勾選）。原狀態：`PROPOSED / NOT_APPROVED`（2026-10-23）。依[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §7-2、§8，8批平行化已完成，但splitIds仍按入口數平分；Run39879968880指定b6f71f6（84入口）記錄21分37秒，批次耗時5／520／384／1205／550／23／294／321秒，第4批為瓶頸。依耗時平衡是另案未批准提案；舊86入口manifest試算不代表目前87入口或實測提速。需先決定manifest預估或實測校正，再另批ci-full-batches.mjs及其嚴格分批斷言變更；保留不漏測、不重複、任一FAIL／SKIP／BLOCKED不得PASS。驗收須指定SHA的完整Linux Full aggregate及實際wall time；本次只恢復漏列。2026-10-24：計畫見[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §9（DRAFT，未核准）；以manifest `seconds`為權重的LPT試算，最大批由本機617秒降至362秒（`full-power-pitching-e2e`單獨一批為下限），CI預估約13分，未實測。2026-10-24：已實作（`ci/full-balance` `cdf0a25`）；Run40038325238（`5b57f6e`）Full PASS 87／87，最大批測試1205→809秒，但wall time 21分47秒未改善（3批apt安裝約7分，見CI-ENV-PIN-01）；PR暫停至CI-ENV-PIN-01後一併驗證（§9.8）。

- [x] **CI-ENV-PIN-01** — `MERGED / CI_PASS`（2026-10-24；PR #21併dev（`7fbfde4`），dev push Quick Run40068894037 PASS 67／67（[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §10.7）。[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §10.6；`ci/env-pin` `ec54253`：Full Run40046088278 PASS 87／87、18分43秒，Quick、linux-smoke PASS；安裝步驟由最長8分降為2秒。合併後勾選）。原始記錄：Run40038325238 Full 8批中3批apt `Fetched 25.9 MB in 6min 47s`。CI執行環境未完全鎖定：`playwright install --with-deps chromium`的apt套件取Ubuntu noble當下最新版（有GPG簽章但版本漂移）；Chromium由`playwright-core`固定revision、自Playwright CDN下載，本機1.59下載程式未見checksum驗證（1.62.1未確認）；npm以`--no-package-lock`安裝。Tests #66（`7940e97`，Run39974089520）的Quick因apt鏡像`Fetched 20.0 MB in 11min 51s (28.1 kB/s)`耗時15分41秒（平常約4分；#67恢復為3分56秒）。首選方案：`tests`／`full-batch`改用以digest鎖定的`mcr.microsoft.com/playwright:v1.62.1-noble@sha256:…` container（`--ipc=host`，保留`setup-node` 24.15.0與`npm install playwright@1.62.1`），移除`--with-deps`；備案為apt重試設定。未確認：image字型對截圖比較（`replay-share-theme-e2e`）的影響、container內`/__w/_temp`與Linux temp路徑／linux-smoke的相容性、root執行時git操作、image拉取時間與內建Node版本。另可選CI專用lockfile（AGENTS §5須批准）。須修改`test.yml`與`check-workflow.mjs`（AGENTS §6.2須批准）；不採依賴快取（apt安裝於`/usr`，快取不解決慢速且不提供完整性）。

- [x] **CI-PITCHING-E2E-01** — `MERGED / CI_PASS`（2026-10-24；PR #22併dev（`136aa2c`），dev push Quick Run40070131548 PASS 67／67（[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §11.7）。原狀態：`IMPLEMENTED / CI_PASS / PR_PENDING`；[CI平行化計畫](tasks/CI_FULL_PARALLEL_PLAN.md) §11.6；`ci/pitching-split` `50139d0`：Full Run40055238234 PASS 89／89、11分15秒（前次18分43秒），linux-smoke PASS；最大批537秒，各批仍不均屬manifest秒數校正另案。PR待PR #21合併後建立，合併後勾選）。`full-power-pitching-e2e`為CI Full單一最長入口（Run40038325238：809秒；Run40043897770：976秒；本機約362秒），在§9 LPT分批下獨佔batch 1並決定wall time。結構（`tests/full-power-pitching-e2e.mjs`，52行）：fixture 29件（E01 3寬×3角色×3投球方式、E03 TJ 2件，各1季）＋完整生涯**22次**（S01-S02 2 seed×3投球方式×old／now／repeat＝18、S03 IF 4；manifest記載「20」有誤），全部依序執行；每步一次`page.evaluate`並保存前後完整`S`與SHA256。候選：①測試內2–3個生涯並行（參考`retirement-hof-pilot.mjs:58`；須確認harness並行安全與記憶體峰值）②拆為多個Full入口供LPT分配（須處理一檔一入口的inventory與87入口斷言）。不刪除repeat重現斷言、不減少每步證據。分段耗時（2026-10-24本機macOS＋Brave 156，`ec54253`，36 PASS／363秒；harness `summary.json`的`records[].seconds`）：E01 24.9秒（7%）、E03 1.6秒、S01-S02 290.5秒（80%；`yakyo-test-001` 全力62.8／通常40.2／省エネ48.1＝151.1，`jp3-pitcher-02` 54.8／37.2／47.5＝139.5）、S03 44.3秒（12%）；每次生涯平均約15秒。輸出1.8 GB JSON（15個career檔，88–202 MB，縮排格式），202 MB檔的stringify＋寫入約0.6秒，非主因；主因推定為每步`page.evaluate`往返並傳回前後完整`S`（約530步／生涯，未單獨量測）。CI artifact不含此`summary.json`（輸出目錄不符`tmp/yakyujinsei-*`）。**使用者決定（2026-10-24）：採②，依seed拆分**，例如`yakyo-test-001`（151秒）／`jp3-pitcher-02`（140秒）／fixture＋S03（71秒），本機最大約151秒，依CI倍率2.2–2.7推算約330–410秒；拆分方式、inventory與87入口斷言、manifest `seconds`的處理待計畫批准後實作。預估瓶頸轉為`international-personal-stats-e2e`（392–545秒），Full wall time約10–11分，**未實測**。

> **未完成項目核算：** 3（規格／回歸／歷史細項）＋6（殿堂）＋4（實機／文案）＋7（待決／保留，含TJ顯示、看板陰影、表示token）＋10（候補及已實作待審UI）＋5（CI工具路徑／artifact／比較政策／本機測試SIGSEGV／本機E2E時序逾時）＝**35**；68唯一ID、33完成／35未完（第2節29項含D2-G9-RELEASE，另4項為第3.6節已併dev的CI-FULL-BALANCE-01／CI-ENV-PIN-01／CI-PITCHING-E2E-01／CI-FULL-STALE-01）。C級高校、LEGACY清理與CODE-DEAD-01分別列第2.10／2.11／2.12節；D2-G9-RELEASE在第3.6節作已完成發布索引。歷史驗收數字不修改。

## 4. 建議下一階段順序（非自動開發授權）

1. **發布後驗收**：dev至`c6d9c9f`的內容（1.13.6及重構至第20期）已由PR #41併入main（`9fe741d`）並上線，發布紀錄見[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)；1.13.1～1.13.6各項UI保留各自驗收限制。C級高校／弱小校語意已定案，不再列為下一步待決。
2. **CI殘項及稽核**：Linux Full僅各指定SHA已PASS，舊工具路徑、artifact原件保存與跨版本比較政策仍待完成；8批平行化、CI-FULL-BALANCE-01耗時平衡分批及CI-PITCHING-E2E-01投球E2E拆分均已併dev。重構至第20期已併main（`9fe741d`），§3.15葉領域全部完成。第21期（業餘路線試做，計畫§2y）已併dev（`f8c675b`），CI Full 93／93 PASS（Tests #106），尚未發布至main。第22期（契約，計畫§2z）已於`refactor/career-contract`本機實作並驗證（`0ef5737`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），經PR #43併dev（`a0ad197`）；§2y.4所列模組內呼叫繞過e2e替換的問題以Shadow配置處理並經負控制確認（§2z.6）。第23期（市場・移籍判定，計畫§2aa）已實作並驗證（`d350c58`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），經PR #43併dev；`applyKboForeignPackageCap`接縫由`kbo-renewal-e2e`（T11，§2aa.6）涵蓋。第24期（`movement`第一層，計畫§2bb）已實作並驗證（`2201aee`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），經PR #43併dev。第22～24期CI Full 93／93 PASS（Tests #110，`a0ad197`），尚未發布至main。CODE-DEAD-01（計畫§2cc，`45cccd7`）與第25期（L2業餘分支，計畫§2dd，`c568952`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據）經PR #44併dev（`7de1fd1`，樹與`17b271b`相同），Tests #111 Full 93／93 PASS，CODE-DEAD-01已結案，尚未發布至main。第26期（`runDraft`，計畫§2ee）已實作並驗證（`92959a1`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），Tests #113 Linux Full通過（`107520e`），經PR #45併dev（`9d25b09`），尚未發布至main。第27期（`boardModel`，計畫§2ff）已於`refactor/board-model`實作並驗證（`405d152`，Quick 68／68、分組Full 93／93 PASS，macOS＋Brave本機證據），Tests #115 Linux Full通過（`0de0bac`），經PR #46併dev（`9e6129f`），Tests #116 Quick通過，尚未發布至main。第28期（`traitResultMarkup`，計畫§2gg）已於`refactor/trait-result-card`實作（`a1a2377`，Quick 69／69 PASS；分組Full 94入口93 PASS／1 FAIL，FAIL為`event-integration.test`既有SIGSEGV，重跑PASS，macOS＋Brave本機證據），Tests #117 Linux Full 94／94 PASS（`4e2a517`），經PR #47併dev（`294e4be`），Tests #118 Quick通過。第21～28期與CODE-DEAD-01已由PR #49併入main（`2fe5b25`）並上線，Tests #120 Full 94／94 PASS。第29期（`newState`，計畫§2hh）已於`refactor/initial-state`實作並驗證（`a274def`，Quick 69／69、分組Full 94／94 PASS，macOS＋Brave本機證據），Tests #121 Linux Full 94／94 PASS（`ce9e5e2`），經PR #50併dev（`7c50eb8`），Tests #122 Quick通過，尚未發布至main；Preview使用者已確認驗收（2026-11-02）；第30期（`choose`一族，計畫§2ii）已於`refactor/choice-prompt`實作並驗證（`4133a1b`，Quick 70／70、分組Full 95／95 PASS，macOS＋Brave本機證據），尚未併dev；接線突變除W1、W3外只由全文斷言抓到（計畫§2ii.4）。交付中：dev新增1.13.7（`b9e9c53`）後，PR #52修正Quick 2項並併dev（`4f39a73`）；Full專屬入口`game-view-dom-e2e`、`replay-share-theme-e2e`在`4f39a73`本身即FAIL，由PR #53修正並併dev（`37aff39`）。本分支再merge dev（`5bac94e`，含1.13.8），Quick 70／70、分組Full 95／95 PASS（macOS＋Brave本機證據），經PR #55提交至dev，[Tests #130](https://github.com/tt-chin/yakyujinsei/actions/runs/41545449477) Linux Full 95／95 PASS，已由code owner併dev（`d4cd99d`），Tests #131 Quick通過，Preview自動檢查（檔案一致、4條生涯無錯誤）已做，使用者驗收待確認，尚未發布至main（計畫§2ii.7）。第31期（結算移至`SeasonSettlement`，計畫§2jj）細部計畫已批准（2026-11-03），依使用者決定先以PR #55分支為基底於`refactor/season-settlement`實作（Quick 71／71、分組Full 96／96 PASS，基準`37aff39`，macOS＋Brave本機證據，計畫§2jj.6），PR #55併dev後已merge `origin/dev`（`d0499f5`），Quick 71／71 PASS，經PR #56提交至dev，[Tests #132](https://github.com/tt-chin/yakyujinsei/actions/runs/41836296928) Linux Full 96／96 PASS，已由code owner併dev（`00ca7b9`），Tests #133 Quick通過，隨1.14.0經PR #57發布至main（`bb92ae8`）；第32期以後的候補A–G（年度骨架、`movement`尾段、`phaseMid`、`phasePre`、`proSeason`一組、`renderCheckpointCard`、`startJapanese`＋seed工具）已盤點（基準`1c6bd9b`），使用者決定依序分期、一期一組（2026-11-03，第32期為年度骨架）；第32期（年度骨架移至`YearFlow`，計畫§2kk）草稿與抵達探測已做、細部計畫已批准（2026-11-03），於`refactor/year-flow`疊在第31期之上本機實作（Quick 72／72、分組Full 97／97 PASS，基準`6b83d68`，macOS＋Brave本機證據，計畫§2kk.6），第33期（`movement`尾段移至`MovementGate`，計畫§2ll）草稿與抵達探測已做（基準`9233cfc`，草稿Quick 73／73 PASS、分組Full 97入口96 PASS／1 FAIL（`event-integration.test`既有SIGSEGV，重跑PASS），macOS＋Brave本機證據），設計已決定、實作已批准（2026-11-04），於`refactor/movement-gate`疊在第32期之上本機實作（Quick 73／73、分組Full 98／98 PASS，基準`9233cfc`，macOS＋Brave本機證據，計畫§2ll.6）；兩期併為同一PR交付（使用者決定2026-11-07），已merge `origin/dev`（`35d5779`，含1.14.0與PR #58的比較基準修正），Quick 73／73、本機Full（`local-full-batches.mjs`）98／98 PASS（基準`bb92ae8`，macOS＋Brave本機證據，計畫§2ll.6），經PR #59提交至dev，[Tests #141](https://github.com/tt-chin/yakyujinsei/actions/runs/42377173624) Linux Full 98／98 PASS，已合併dev（`7234965`，2026-11-07），隨1.14.1經PR #60發布main（`7653d66`）；第34期（`phasePre`＋`phaseMid`移至`SeasonPhases`，計畫§2mm）經PR #62併dev（`ef7768e`），PR #61修正Full專屬期待值後[Tests #150](https://github.com/tt-chin/yakyujinsei/actions/runs/42401142552) Linux Full 99／99 PASS（`1a74e71`），經PR #63併main（`a8859b9`）；第35期（`proSeason`一組移至`ProfessionalSeason`，計畫§2nn）細部計畫已批准（2026-11-08），於`refactor/pro-season`本機實作並驗證（`4df368b`，Quick 75／75、本機Full 100／100 PASS，macOS＋Brave本機證據），經PR #64併dev（`d3d2a53`），[Tests #156](https://github.com/tt-chin/yakyujinsei/actions/runs/42452617589) Linux Full 100／100 PASS（`df0ed19`），dev Quick 75／75，尚未發布main；§3.22的D系列至此完成，是否繼續另行決定；其餘各期尚無細部計畫，盤點與順序見計畫§3.22，調查與方向另見§3.21、§3.20、§3.19、§3.18、§3.17、§3.16、§3.14、§3.6。本條不授權新重構、顯示修正、存檔或刪除LEGACY。AUD-02／REFACTOR-AUDIT-01仍未全面結案。
3. **HIST-SPEC-CLAUSE-01**：2026-11-15依使用者決定改為「歷史資料保留與按需追溯」並結案（見§3.1）；遇SPEC_GAP或意圖衝突時才依第八階段來源台帳查原文，不自動採納歷史政策。
4. **HOF-NATURAL-SAMPLE-01**：補足自然到達四聯盟的研究樣本，之後再討論殿堂規則決策。
5. **實機與文案驗收**：在可取得實機時執行；P2 功能候補逐案另行批准。

### 4.1 已建立的測試基礎

- 統一 Runner：`node scripts/test.mjs list|quick|full|audit`。
- GitHub Actions：`dev` push quick、對 `main` PR full、手動指定 profile。
- 第四階段 Linux 證據：[Quick](https://github.com/tt-chin/yakyujinsei/actions/runs/38132643250)／[Full](https://github.com/tt-chin/yakyujinsei/actions/runs/38132662335)／[Audit](https://github.com/tt-chin/yakyujinsei/actions/runs/38132971169)。
- Audit 的 10 項 SKIP 包含人工／研究／實機／Cloudflare 等，不得視為 PASS。4,000 生涯研究尚未完成。
- ACT 最終驗收：Quick 44 PASS、ACT 專用 Full 入口 PASS（48 入團 fixture、6 pointer 案例、16 次完整生涯）、Preview 54 組 PASS；詳見[報告](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)。
- 第八階段：本機Quick 45 PASS／0 FAIL／0 SKIP／0 BLOCKED，318.730秒；[Linux Quick Run 38183631042](https://github.com/tt-chin/yakyujinsei/actions/runs/38183631042)同為45 PASS／0 FAIL／0 SKIP／0 BLOCKED，160.208秒，受驗SHA `b38146e69288346a120db5b2d079ce0a7983aaae`。未執行Linux Full。Cloudflare Preview check success，deployment `c4015011-799f-45e4-99bf-2cb5ea4736f4`；[固定Preview](https://dev.yakyujinsei.pages.dev)47個HTML／JS／CSS與dev逐檔一致（僅正規化換行），0資產失敗；本轮未重跑全Preview E2E，不將部署比對當成實機驗收。
- 第九階段：文件建檔後本機Quick45 PASS／0 FAIL／0 SKIP／0 BLOCKED，184.953秒（HEAD ea951c2＋本輪文件工作樹）；[Linux Quick Run 38187518145](https://github.com/tt-chin/yakyujinsei/actions/runs/38187518145)45 PASS／0 FAIL／0 SKIP／0 BLOCKED，104.947秒，受驗SHA `e422b45bab38cc7a9632f89b2558bd296dcf0d5a`。未執行Full/4000研究/實機；Cloudflare check success，deployment `c3658994-41b8-4e33-8a6a-7554ac1f6faa`，固定Preview47個HTML/JS/CSS逐檔與dev一致，0資產失敗（非新Full UI驗收）。80本地link、582固定來源link/行範圍、44唯一checkbox通過；三個指定未完ID定義不變。本筆只補BACKLOG證據，依現有paths-ignore不重跑Quick；不變更CI設定。

## 5. 歷史快照與證據索引

### 5.1 v1.11.2 歷史稽核（2026-10-10；不可視為最新狀態）

| 欄位 | 當時資料 |
|---|---|
| `dev` | `a4aa83c48a48a1567bf3b14ceea6e4c76c87b76b` |
| `main` | `421e036bb206a11828a696a4f8b0d3909385441f` |
| VERSION | `dev` 1.11.2／`main` 1.10.2 |
| 38 ID 舊判定 | PASS 3、FAIL 1、IMPLEMENTED_UNVERIFIED 10、NOT_IMPLEMENTED 14、BLOCKED 4、DESIGN_PENDING 6 |
| 當時測試檔案 | 54（33 `.test.mjs`、5 standalone、11 E2E、5 support／分析／fixture） |
| 當時限制 | 部分 E2E 未執行、KBO 自然生涯 FAIL、實機／4,000 生涯未驗收 |

**上述是原始歷史資料，不能用來推翻後續 KBO 修復、第三階段驗收或第四階段 Linux CI 結果。** 舊報告：[BACKLOG_ACCEPTANCE_AUDIT.md](docs/reviews/BACKLOG_ACCEPTANCE_AUDIT.md)。

### 5.2 後續專項驗收

- [KBO 續約修復](docs/reviews/KBO_RENEWAL_FLOOR_FIX.md)：v1.11.3。
- [契約／年俸驗收](docs/reviews/CONTRACT_SALARY_ACCEPTANCE_AUDIT.md)：v1.11.4。
- [Draft 收入測試修正](docs/reviews/DRAFT_INCOME_E2E_FIX_AUDIT.md)：測試 fixture／斷言與已批准付款政策對齊，未修改遊戲規則。
- [統一 Runner／Linux CI](docs/reviews/TEST_INFRA_ACCEPTANCE.md)：測試基礎驗收，遊戲 VERSION 未變。
- [ACT-01／02 最終驗收](docs/reviews/ACT_01_02_FINAL_ACCEPTANCE.md)：現行功能結案，歷史原路線限制保留。
- [第六階段能力／交易補強](docs/reviews/STAGE6_ACCEPTANCE_AUDIT.md)：歷史結果：正常回歸通過，5個安全風險斷言失敗，當時3個修復ID待批准；引用修復完成。
- [第七階段安全修復](docs/reviews/STAGE7_SAFETY_FIX_ACCEPTANCE.md)：三項風險最小修復與指定驗收完成，v1.11.5；原FAIL與歷史報告保持可追溯。
- [第八階段歷史規格](docs/reviews/STAGE8_HISTORICAL_SPEC_AUDIT.md)／[AGENTS歷史](docs/reviews/STAGE8_AGENTS_HISTORY_AUDIT.md)：調查及分類結案，歷史全細項未驗範圍保留獨立待辦；VERSION／CHANGELOG不變。
- [第九階段驗收](docs/reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md)：新增[現行詳細設計入口](docs/design/CURRENT_DETAILED_DESIGN.md)及S/RNG、模組函式、流程/UI附錄；SPEC_MISMATCH文件引用與7組UNVERIFIED缺口保留。AUD-02／REFACTOR-AUDIT-01／HIST-SPEC-CLAUSE-01未完，不因文件建檔結案；新工作ID僅建議，正式checkbox仍18完成／26未完／44唯一。
- [第十階段調查](docs/reviews/STAGE10_PRE_REFACTOR_RISK_INVESTIGATION.md)：A正常稱號1 FAIL、B27 PASS、C正常3 PASS／故障9 FAIL、D兩路線trace對照PASS；未改遊戲。新增兩個未完修復ID，原稽核及LEGACY清理仍未完。
- [第五階段規格／架構調查](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)／[重構路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md)：1.11.4，quick44 PASS，P0風險0／P1五項／P2兩項／P3一項；風險數不是已重現Bug數。全規格／動態可達性未結案。

### 5.3 不得混淆的既有技術限制

- 舊全量 S 比較有 3 個歷史 oracle 因現行核准新增欄位而不適用，原失敗證據保留；現行回歸使用新基準的完整生涯／RNG 比較，不得把舊失敗隱藏成 PASS。
- Draft-income 曾有測試策略造成自然未入團退休及收入斷言缺少育成支度金的問題，後續已在專項報告中以測試修正處理，不是新增遊戲薪資政策。
- 同 Seed 若使用不同的能力配分／選擇策略，不能直接比較最終 S 或 RNG。
- 原生分享 mock 測試通過不代表作業系統 share sheet 實機已通過。
- Codex 報告是驗收證據；新任務仍須在最新 HEAD 重新確認相關程式與測試。

## 6. 非採用／禁止自動恢復的舊功能

以下不屬於待辦，也**不得因清理舊程式而重新啟用**：

- 生涯途中保存／讀取與恢復。
- 舊引擎切換、`rv`／`rules` URL 或舊版重播引擎。
- 直接移植參考作品整套薪資制度。
- 未批准的二刀流、語音或伺服器生成功能。
- 把 1.5.2 的三選單恢復成舊四選單。
- 恢復舊主題／PC 模式、舊薪資評價。
- 未批准就套用 HOF A／B／C 假說係數。

過去提案中的 1.9.0～1.13.0 版本號不是實作承諾，也不是目前正式版本；新功能採納時另依當時最新版本決定版號。

## 7. 所有任務的共同驗收與交付規則

1. 開始前確認最新 `origin/dev` SHA、VERSION、`AGENTS.md`、`CURRENT_SPEC.md`、`CHANGELOG.md`、本 BACKLOG 與指定報告。
2. 先記錄現況、重現步驟、原因與驗收範圍，避免重複實作已存在的功能。
3. 遊戲邏輯變更必須比較投手／野手固定 Seed、完整選擇歷史、狀態 `S` 與 RNG 消耗順序／次數；不得為通過測試任意改預期值或政策。
4. 使用相關單元、整合、E2E 與 Runner quick／必要時 full；記錄 PASS／FAIL／SKIP／BLOCKED、命令、環境、日誌與未測範圍。手機模擬不等於實機。
5. **僅遊戲本體變更**才依規則同步更新 VERSION 與 CHANGELOG；測試、文件、開發工具變更原則上不升版。
6. 先在 `dev` 修改、測試並確認 Cloudflare Preview；**未經使用者明確同意不得合併或 push 到 `main`**，也不得修改正式發布 Workflow。
7. 結案時更新本檔及對應驗收報告，保留 ID、受驗 SHA、結果、限制與證據；歷史快照不可覆寫為新結論。

---

**文件性質：** 2026-10-22同步目前狀態與唯一ID統計；保留`1dacc55`使用者重編版後各階段的歷史結果，以下提交後證據均按原時點閱讀。不覆寫歷史測試、不把待決規格當成實作授權。

## 第十階段提交後證據

- **測試／調查受驗提交：** `1020f84f938b0c1944741c207083801e38120e2d`。只新增測試、manifest一行登錄、調查報告及BACKLOG；遊戲樹、CURRENT_SPEC、AGENTS、VERSION、CHANGELOG、Runner與CI零差異。遊戲來源基準仍`fc879dc73cb8a3886d2812a42443c6192d1f6191`、1.11.5；main仍`e886e84ca08c6c185406cac9d6f3c4376277061a`。
- **本機：** Quick45 PASS／0 FAIL／0 SKIP／0 BLOCKED，258.247秒、exit0；新調查44案34 PASS／10 FAIL／0 SKIP／0 BLOCKED。交付版log在`test-results/stage10-committable/`：入口50.230秒、Runner51.079秒、exit1。初次測試接線／cleanup問題保留`stage10-investigation`，Runner timeout960.315秒、exit1，不能視為PASS；測試工具修正過程及另一完整重跑記錄見[調查報告](docs/reviews/STAGE10_PRE_REFACTOR_RISK_INVESTIGATION.md)。
- **Linux CI：** [Quick Run 38192410958](https://github.com/tt-chin/yakyujinsei/actions/runs/38192410958) success，受驗SHA就是`1020f84f938b0c1944741c207083801e38120e2d`，45 PASS／0 FAIL／0 SKIP／0 BLOCKED，Runner145.317秒、Workflow job約3分3秒。Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium；没有執行Linux Full／Audit，不把Quick綠燈當成新調查已PASS。
- **Preview：** 同SHA的Cloudflare check success，deployment `9ac674dc-2d9e-45cc-ab01-b61f9b06bd9c`。`node tests/stage10-risk-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --playwright=<PW> --output=test-results/stage10-preview`：47個HTML／JS／CSS HTTP200、正規化換行後與本地dev一致；四項動態調查34 PASS／10 FAIL／0 SKIP／0 BLOCKED、52.599秒（不含前置資產讀取）、exit1。6份完整生涯記錄（正常／注入IF、P與IF的traced／control）與本機逐操作S digest／選擇文字／RNG次數及最終完整S、全部R值完全相同。18筆錯誤均為明示fault injection，其他Console/pageerror及JS/CSS HTTP失敗0；browser已disconnect但profile清理逾時warning保留，不是遊戲錯誤。這是測試response注入驗證，非修改Preview資產／真實玩家自然例外重現，非實機驗收。
- **Manifest保護：** 移除新登錄行後與Git舊檔位元組一致，所有舊profile逐欄相同；list正確識別新入口為Full／Audit。Quick45不變、Full59→60、Audit60→61。新入口當前保留10 FAIL，後續Full／Audit不能宣稱全綠。58個BACKLOG／本報告本地link、46唯一checkbox（18完成／28未完）驗證通過。
- **純文件證據提交：** 本筆僅更新BACKLOG，完整SHA見此文件Git履歷與最終回報，與受驗1020f84分開。沿用既有paths-ignore，不修改CI觸發條件、不重跑相同Quick；Cloudflare仍可能對文件commit建立Preview，但不冒充另一輪E2E。停止等待使用者審查與修復授權，不自動下一階段。

## 本輪修復提交後驗收證據

- **受驗程式提交：** `b2e01509c0ea75712579f53d864ecd09f710840c`、1.11.6。修復前`ef74f276699d5e67234a792b21a8a3d96bb592c2`；回國提交`4a54b9e0fcfa60835dee6b463802f60e85fb8f3d`、出生提交`0689d350daf9b2c52064e8d4303ed40050fed344`。main仍`e886e84ca08c6c185406cac9d6f3c4376277061a`／1.11.4。
- **本機結果：** 原44案全PASS；補充及未改造原程式對照共59 PASS、71.123秒。Local Full原55 PASS／5 FAIL、1450.725秒、exit1與五入口重跑5 PASS、49.511秒、exit0均保留，不改寫成全綠。Quick初次44 PASS／1舊版本斷言FAIL，同步批准1.11.6後最終45 PASS／0 FAIL／0 SKIP／0 BLOCKED、210.302秒、exit0；未修改RNG期望。log見`test-results/safety-followup-*`及[報告](docs/reviews/NPB_RETURN_GRINDER_FIX_ACCEPTANCE.md)。
- **Linux CI：** Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium；[Quick Run 38214974512](https://github.com/tt-chin/yakyujinsei/actions/runs/38214974512)45 PASS、143.238秒；[Full Run 38215085325](https://github.com/tt-chin/yakyujinsei/actions/runs/38215085325)60 PASS、1455.477秒。兩者0 FAIL／SKIP／BLOCKED、success，head SHA均為b2e0150。Full實際PR合成提交`a43afe6e65be1b330aa74456f6a30e35f8d93f69`與b2e0150 tree同為`3aa0e2c92e5797db7b81496a371fee84309cc49f`。授權的[測試Draft PR #3](https://github.com/tt-chin/yakyujinsei/pull/3)驗證後CLOSED，mergedAt=null；沒有合併。未執行Audit／4,000研究。
- **Preview：** b2e0150 Cloudflare check success，deployment `6d322c45-3469-48b3-87df-d6e7c5c86509`。[固定Preview](https://dev.yakyujinsei.pages.dev)47個HTML／JS／CSS HTTP200、正規化換行後與受驗dev逐檔一致。`node tests/stage10-risk-e2e.mjs --compare=ef74f276699d5e67234a792b21a8a3d96bb592c2 --preview=https://dev.yakyujinsei.pages.dev --playwright=<PW> --output=test-results/safety-followup-preview`：59 PASS／0 FAIL／0 SKIP／0 BLOCKED、94.698秒、exit0。Windows／Chrome155.0.8059.39，PC1280／320／390；30筆預期S10_FAULT錯誤、非注入Console／pageerror及資產HTTP失敗0。已disconnect的browser profile清理逾時warning保留，非遊戲錯誤；手機尺寸模擬不是實機。
- **正常S／RNG：** 未改造舊game.js逐步對照：P yakyo-test-001，376操作／815R；IF s10-trait-38，347操作／597R；均2049退休。只正規化version、新增potSum0與done後批准修正的grinder；其他完整狀態、選擇歷史及全部R值一致。grinder自然IF取得、P不符合不取得；smallschool保持原狀且待決。
- **Manifest及文件保護：** 僅新增baseline-initial-potential import-only/support登錄；移除該行後與修復前manifest一致，既有入口分類／args／模式不變，Quick45／Full60／Audit61。Runner、CI／發布workflow、AGENTS沒有修改。BACKLOG正式checkbox為47唯一ID、20完成／27未完；關閉兩個核准範圍修復，不結案其他待辦。
- **後續純文件提交：** 本筆僅改BACKLOG證據及結案狀態，完整SHA見Git履歷與最終回報；不冒充已跑CI的程式SHA。沿用現有paths-ignore，避免重跑同套Quick；後續Cloudflare文件部署不冒充另一輪E2E。停止等待審查，不發布main或自動開始下一階段。

## 特性顯示統一驗收證據（1.11.7）

- **程式提交：** `6020df03ca507c456233005d22bfe36c3d21f306`，dev、VERSION1.11.7；基準`a0b880bb7e7fe74e743daa0cb8144455c9fdded2`／1.11.6。PATCH：既有特性説明呈現修正；版本正本docs/src/config.js與CHANGELOG同步。main確認仍`e886e84ca08c6c185406cac9d6f3c4376277061a`、1.11.4；沒有更新main或本番。
- **本機：** 最終Quick45 PASS／0 FAIL／0 SKIP／0 BLOCKED、220.432秒、exit0。完整Full61入口實際60 PASS／1 FAIL、1586.517秒、exit1；唯一失敗為ui-foundation來源字串未包含新歸檔呼叫，同步批准介面後Runner重跑1 PASS／0 FAIL、0.321秒、exit0，遊戲完全不變。沒有冒充另外一次全綠Full。其他60入口、特性18、原生契約381、能力89、交易5與補充17、第十階段57案通過。原始log為trait-display-full-final-v3、trait-display-full-static-recheck、trait-display-quick-final。
- **歷史中間結果：** 初輪跨行regex10 PASS／4 FAIL→14 PASS；stale UI callback四尺寸0 PASS／4 FAIL→4 PASS，舊legend相容狀態四尺寸0 PASS／4 FAIL→4 PASS，31案殿堂S/R/投票不改。早期Full文字oracle失敗及v2中止均NOT_COMPLETED，保留原log，不回改歷史數字。[詳細報告](docs/reviews/TRAIT_DISPLAY_UNIFICATION_ACCEPTANCE.md)。
- **Linux CI（2026-10-12確認）：** [Quick Run 38240950492](https://github.com/tt-chin/yakyujinsei/actions/runs/38240950492)由dev push建立，**45 PASS／0 FAIL／0 SKIP／0 BLOCKED、147.880秒**；[Full Run 38240992882](https://github.com/tt-chin/yakyujinsei/actions/runs/38240992882)由`gh workflow run test.yml --ref dev -f mode=full`直接建立，**61 PASS／0 FAIL／0 SKIP／0 BLOCKED、1595.017秒**。兩者status=completed、conclusion=success、headSha=`6020df03ca507c456233005d22bfe36c3d21f306`；Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium，耗時為Runner輸出，報告為各Run artifact中的`test-results/ci/summary.json`。main缺workflow的讀取結果不能當成無法dispatch的證明；本次實際觸發成功，先前BLOCKED預判修正。使用者拒絕Draft PR，**沒有建立PR**；此前查詢被工具拒絕，現依使用者新授權確認實際結果並解除此項BLOCKED。不改workflow或main，未執行Audit／實機／4,000生涯研究。
- **Preview：** 6020df0 Cloudflare check success、deployment `6cc7bbcd-35e6-4401-b280-948b8836f917`。[固定Preview](https://dev.yakyujinsei.pages.dev)47個HTML／JS／CSS HTTP200、正規化換行後與本機dev一致。`node tests/trait-display-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --baseline=a0b880bb7e7fe74e743daa0cb8144455c9fdded2 --playwright=<PW> --output=test-results/trait-display-preview`：**18 PASS／0 FAIL／0 Console・pageerror／0 JS-CSS404、exit0**。Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39；PC1280／320／360／390，手機為模擬不是實機。browser已disconnect而profile清理逾時warning保留，非遊戲錯誤。
- **不變性：** 未改造1.11.6 game.js逐步對照，P yakyo-test-001（530操作／1023R、2058退休）、IF s10-trait-38（331操作／577R、2048退休），全部選擇文字、前後完整JSON S摘要、最終S及R before/after/value相同，只排除VERSION。Baseline與current原始記錄在Full/Preview的career-P/IF-baseline/current.json，不排除traits、金錢、年表或其他S欄位；上述策略結果不與前輪不同策略的376／347操作混用。
- **保護與清單：** 17個實作／測試／文書檔案提交；tasks/fix.md保留未追蹤、不刪除或提交。Runner、CI／發布workflow、AGENTS、trait/event政策、契約／殿堂政策、資料表不變。manifest只有新Full／Audit入口，移除該行即與a0b880b一致：69檔、Quick45／Full61／Audit62；48唯一checkbox、21完成／27未完，按指定顯示範圍關閉本ID，其他待辦不變。90個本地文件link通過。
- **純文件證據提交：** 本次只更新BACKLOG的CI證據、結案狀態及統計，完整SHA見Git履歷／最終回報，與受驗程式6020df0分開。沿用既有paths-ignore，不改CI、不重跑同套Quick；後續文件Preview不冒充另一輪E2E。停止等待審查，不發布正式網站。

## 全力投球最小修復驗收證據（1.11.9）

- **受驗程式與版本：** `a1658c994713fd1fb8f66857dab33df0ff6548fd`，dev、1.11.8→1.11.9 PATCH。比較基準`20920dddd72ab8c91b0e2c71d560492663cd5aec`；game.js唯一行為修改是全力callback的`S.effort='全力投'`→`'全力投球'`，使既有成績／TJ效果生效。公式、係數、RNG呼叫及舊值fallback不變。config.js與CHANGELOG同步更新，CHANGELOG只記修復內容。main／origin/main仍`e886e84ca08c6c185406cac9d6f3c4376277061a`／1.11.4，沒有發布本番。
- **本機證據與失敗保留：** 最終原生53 PASS；同53案在原始基準52 PASS／1 FAIL，失敗為callback值。最終本機Quick47 PASS／0 FAIL／0 SKIP／0 BLOCKED、227.416秒。Windows Full實際64 PASS／1 FAIL、3307.699秒、exit1，不能稱Full PASS：draft-income完整生涯迴圈仍選全力，歷史S一致oracle失效並在大量差異輸出階段出現Array buffer allocation failed。修正真正的操作器為通常投球、保留完整deepEqual及新增簡短差異路徑診斷後，該入口9 PASS、436.223秒。最終全套由下列確定SHA的Linux Full獨立驗證；不以部分重跑改寫原Full。歷史測試相容性未新增S排除欄位、不換舊baseline、不放寬非預期差異。[完整原因／日誌](docs/reviews/FULL_POWER_PITCHING_ACCEPTANCE.md)
- **Linux CI：** [Quick Run 38281582865](https://github.com/tt-chin/yakyujinsei/actions/runs/38281582865)及[Full Run 38281629477](https://github.com/tt-chin/yakyujinsei/actions/runs/38281629477)均completed／success，headSha完全為a1658c994713fd1fb8f66857dab33df0ff6548fd。下載artifact實際確認Runner Quick **47 PASS／0 FAIL／0 SKIP／0 BLOCKED、146.791秒**；Full **65 PASS／0 FAIL／0 SKIP／0 BLOCKED、1991.530秒、reused=0**。Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium151.0.7922.34。Full包括53原生、381契約、89能力、5交易、17安全及KBO／ACT／選秀／退休等既有入口；新專項36 PASS／0 FAIL／errors0。日誌與總表保存在test-results/full-power-ci-quick/ci及full-power-ci-full/ci。CI既有artifact pattern沒有包含tmp/full-power-pitching原始caseJSON；CI入口log及總表已下載，逐S／R原始記錄另保存在本機完整專項，不宣稱CI上傳了不存在的附件。不改workflow、不建立Draft PR。
- **Preview：** 同程式SHA的Cloudflare check success，deployment `17c12e9c-2a49-4a3f-8ef6-ffd69fec6d58`。[固定Preview](https://dev.yakyujinsei.pages.dev)48個HTML／JS／CSS HTTP200，正規化LF後逐檔與受驗dev一致。`node tests/full-power-pitching-e2e.mjs --preview=https://dev.yakyujinsei.pages.dev --fixtures-only --playwright=<PW> --output=test-results/full-power-preview`實際 **29 PASS／0 FAIL／Console・pageerror0／JS-CSS4040、exit0**。Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39，PC1280、320／390真實tap的手機模擬context，SP／MR／CL×三強度及rubber有無的TJ後续；MR／CL經真實留牛棚選項。不把fixtures-only稱遠端36案或遠端完整生涯。斷線browser profile清理逾時warning保留，非遊戲錯誤。
- **固定Seed／狀態／RNG：** 本機及Linux新專項36案，含20次完整生涯執行。通常投球：yakyo-test-001/P 362操作／728R、jp3-pitcher-02/P 386／735；省エネ分別397／858、431／857；jp3-infielder-01/IF 387／639。只排除VERSION，完整S、選擇、R before/after/value與舊基準一致，新版重播亦一致。全力兩例舊362／728→新520／876、舊386／735→新530／830；第一差異2029選項callback僅effort，訓練及補正前R前綴一致，成績／TJ補正本身R0。2036首次TJ累積新超過50、舊未超過，開啟既有TJ選擇造成後續分支與R消耗差異，可追溯且屬使用者批准範圍；新版完整重播S／選擇／R完全一致。未改100條探索研究檔、門檻候選或新獎項判定。
- **結案與文件提交區分：** BUG-PITCH-EFFORT-01按批准範圍結案，49唯一checkbox為22完成／27未完；其他狀態不變。此筆只更新BACKLOG證據與統計，純文件SHA見Git履歷／最終回報，與上述實際受驗程式SHA分開。沿用現有paths-ignore不重跑無影響的Quick／Full，後續文件Cloudflare部署不冒充另一輪E2E。未執行實機／Audit／4,000生涯或追加自然採樣，這些不是本項PASS範圍。tasks/既有未追蹤檔保留，AGENTS／Runner／CI／發布workflow未修改。停止等待使用者Preview審查，不更新main。

## 國際大会本大会個人成績顯示（1.11.8）

- **基準與版本：** origin/dev=`e602174a22d7472e1021d780388ad61adc6b11b6`，1.11.7→1.11.8 PATCH。既存カードから欠落した本大会数値の表示補完のみ。config.js／CHANGELOG同時更新；main仍`e886e84ca08c6c185406cac9d6f3c4376277061a`、1.11.4，不發布本番。
- **本機：** 初回Quick45 PASS／1 FAIL、215.852秒，KBO歷史比較因新增personalStats产生digest差異；只排除該新增欄位後最終Quick46 PASS／0 FAIL／0 SKIP／0 BLOCKED、231.030秒、exit0。Full63 PASS／0 FAIL／0 SKIP／0 BLOCKED、2547.523秒、exit0；包括381契約、89能力、5交易、17安全、18特性表示及新大会表示50案。原失敗記錄保留test-results/intl-quick-before-version；最終log為intl-quick-final／intl-full-final。
- **新專項：** 單體15案、T01〜T14原生／ブラウザ50案PASS，PC1280／320／360／390、全4主題、實際設定dialog選large、Console/pageerror／JS-CSS404=0。ER按使用者確認，只用於保存及防御率，不另顯示自責点。遊戲生成與fmtIP本體不變，重畫與二重callback RNG0；舊欠損不從通算補造。
- **固定seed：** 投手yakyo-test-001 362操作／728R、jp3-pitcher-02 386／735、jp3-pitcher-03 419／887；野手jp3-catcher-01 C 314／547、jp3-infielder-01 IF 387／639、jp3-outfielder-01 OF 403／714。六條都完全一致，實際WBC5／プレミア12九大会；捕手自然代表なし，C顯示另以原生fixture驗證。完整S原本、逐操作digest及R before/after/value保存在専用入口career-*-baseline/current.json。只排除版號及intlTraitResults內personalStats，不排除整個结果字典。[完整策略／驗收](docs/reviews/INTL_EVENT_STATS_DISPLAY_ACCEPTANCE.md)
- **登錄及保護：** 71測試相關檔案，Quick46／Full63／Audit64；只新增Full／Audit入口一行（概算600秒），既有分類／Runner／CI workflow／AGENTS／資料／CSS不變。INT-01仍未完，48唯一checkbox、21完成／27未完，其他未完狀態不動。未追蹤tasks/保留、不提交或刪除。切斷済browser profile清理warning保留，非遊戲Console error。
- **程式提交：** `2924dd03f1bf0fecac0f1673f07c10df92546114`已commit／push origin/dev，21檔、298新增／14刪除。只有指定實作／測試／現行文書；100個本地link及48唯一工作ID檢查通過。新入口概算更新後另跑test-runner與新單體2入口PASS、2.427秒，不冒充另一次Quick46。
- **CI：PASS（Workflow結果）**。[Quick Run 38251079770](https://github.com/tt-chin/yakyujinsei/actions/runs/38251079770) headSha=`2924dd03f1bf0fecac0f1673f07c10df92546114`，2026-10-12依使用者新授權實際讀取status=completed、conclusion=success，tests check同為success。進一步讀取Runner log／統計的命令遭許可拒絕，因此本筆只確認Workflow成功，不把本機46 PASS／231.030秒當成Linux的實際數量／耗時。未執行Linux Full，没有建立Draft PR。
- **首次部署與阻塞歷史（不覆寫）：** [Cloudflare deployment 655049d2-c0f4-425b-ae40-f2549d8358f1](https://dash.cloudflare.com/383e1ae7fd9e9c94b48e43575172aec4/pages/view/yakyujinsei/655049d2-c0f4-425b-ae40-f2549d8358f1)在2026-10-12失敗；初次詳細output照會遭許可拒絕，先前Preview命令亦未取得可用結果，當時FAIL／BLOCKED判定有效。使用者登入後實際讀到：clone成功、136/136資產上傳及Assets published成功，無/functions目錄；最後`Failed to publish your Function. Got error: Unknown internal error occurred.`，頁面明示internal error。這是Cloudflare發布階段內部錯誤，不是已證明的遊戲建置錯誤；不推測平台內部更深層原因。原失敗deployment／log保留，不把未執行的舊命令回改為PASS。
- **重新部署：PASS。** 使用者提供的同2924dd0重新部署log顯示`Success: Your site was deployed!`。本輪GitHub Cloudflare check再次實際確認：程式SHA2924dd0的[重新部署dc7cd5b1-58b2-4ee4-bc39-1491290dad77](https://dash.cloudflare.com/?to=/383e1ae7fd9e9c94b48e43575172aec4/pages/view/yakyujinsei/dc7cd5b1-58b2-4ee4-bc39-1491290dad77)為completed／success；文件SHA6bfa070的[deployment 5a27a56e-35f4-4788-bc1a-1b589d48cea8](https://dash.cloudflare.com/?to=/383e1ae7fd9e9c94b48e43575172aec4/pages/view/yakyujinsei/5a27a56e-35f4-4788-bc1a-1b589d48cea8)亦success。[文件Quick Run 38252719930](https://github.com/tt-chin/yakyujinsei/actions/runs/38252719930)tests check success；不將本機統計冒充該Linux run的數量／耗時。兩提交遊戲HTML／JS／CSS零差異，本輪沒有修改程式、部署設定或自行再部署。
- **Preview指定驗收：完成／PASS。** `node tests/international-personal-stats-e2e.mjs --playwright=<PW> --preview=https://dev.yakyujinsei.pages.dev --fixtures-only --output=test-results/intl-preview-final`已實際執行，**43 PASS／0 FAIL／exit0**。48個配信HTML／JS／CSS HTTP200，正規化換行後與受驗dev逐檔一致。受驗HEAD=`6bfa070b914259664ef80ccee2cae4af5bc4d24f`，VERSION1.11.8，Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39；43案的個別耗時合計183.974秒（非含前置資產查核的總wall time）。包含P-SP/MR/CL、C/IF/OF、P12/WBC原生前後S/RNG、連點／去重、辞退／負傷見送り、intlace時點、舊結果／值コピー／保存種別再描畫及1280／320／360／390×四主題×large的32組。Console/pageerror及JS/CSS404均0；已disconnect的browser profile清理逾時warning保留，不是遊戲錯誤。結果與截圖在test-results/intl-preview-final/，summary.json保存43案及環境。本次fixtures-only沒有重跑6條完整生涯，也不冒充遠端50案；固定seed六生涯及T09/T13等人工整形單體的本機既有證據保持。解除本次Preview阻塞，實機／4,000生涯／Linux Full未實施的限制仍保留。
- **文件提交區分：** 使用者AGENTS修改與CI證據已於`6bfa070b914259664ef80ccee2cae4af5bc4d24f`一併提交；本次只補BACKLOG的重新部署與實際Preview驗收結果，文件SHA另見Git履歷／最終回報，與程式2924dd0及遠端受驗HEAD6bfa070分開。沿用僅BACKLOG的paths-ignore，不修改CI或重跑未受影響的Quick／Full；後續純文件Preview不冒充另一輪E2E。不改遊戲、AGENTS、VERSION、CHANGELOG、main／正式網站。既有48唯一checkbox、21完成／27未完保持：本大会結果卡指定驗收完成，不把未實裝的歷史列表INT-01結案。等待使用者審查，不發布本番。

- 歷史修復時點（2026-11-06；目前Linux已PASS，見§1）：保留上述 Full 原始 FAIL；正向歷史比較新增獨立 championmaker oracle，嚴格驗證核准欄位後投影，並以有界第一差異取代巨大 AssertionError。比較安全38項、既有KBO比較23項、國際賽fixture43項、全力投球fixture30項及GameView八組完整生涯通過。資源／等待限定重測event／stage6／stage7／KBO共4入口PASS；進度診斷與低RAM排程保護仍需確定來源的最後Quick／Full，不以限定重測取代整套PASS；使用者Preview及ARTIFACT_COVERAGE_BLOCKED保持未完成。

- 歷史提交前時點（2026-11-07；後續Linux結果見§1）：原16個失敗入口限定重測16 PASS／0 FAIL；確定來源Quick 71 PASS／0 FAIL；八批本機Full 94 PASS／2 FAIL／0 SKIP／0 BLOCKED，耗時3341.313秒，整體FAIL_OR_INCOMPLETE。證據：test-results/comparator-resource-1140-related-final-r1/、comparator-resource-1140-quick-final-r1/、comparator-resource-1140-full-final-r1/。HOF三尺寸與P／IF完整比較通過，最後Console檢查遇ERR_CONNECTION_CLOSED，失敗URL未保存，不能推定為外部字型；KBO通過負面控制、修復後重播／前綴及P比較，180.606秒被Runner逾時終止，確切等待階段尚未確認。兩項均未結案；未放寬斷言、未延長timeout、未修改或覆寫歷史FAIL。Preview、Linux本次Full與ARTIFACT_COVERAGE_BLOCKED分別保留未驗證／未解除。

- 2026-11-07 エスコン背景（1.14.1、dev已提交／Preview已配信）：使用者最後指示為開始／角色建立／遊戲畫面全程保留。原圖與CREDITS.md位元組完全保留；699px以下縱圖，700px以上橫圖；開始案內及選單新增素材對話框，授權僅照片。限定Chromium 1440×900、390×844與699／700邊界、開始／重啟／捲動／選單／素材連結及圖片失敗fallback通過；既有對話框E2E 11 PASS、S／RNG不變，履歷來源／生成／重複生成／歷史保留檢查PASS。證據test-results/escon-background-1141/。實機iOS Safari、使用者Preview為NOT_RUN；本機Quick／Full依限定範圍未執行；後續已commit／push（`8fa5cf5`、`8a0e87d`），自動Quick與Preview配信成功，未合併main或正式部署。照片裝飾層含漸層為50%不透明度。詳見§1，不改寫歷史FAIL或artifact缺口。


- [x] **BROWSER-SAVE-01** — `USER_ACCEPTED / PHASE1_COMPLETE`（2026-11-08）。使用者於本對話確認「實績驗收OK，1.15.1也確認沒問題」，依前一則明列的剩餘範圍，記為剩餘Android Chrome實機及1.15.1首頁Preview／實機驗收通過；未提供裝置型號、OS／瀏覽器版本及逐項原始紀錄，屬使用者驗收確認，不宣稱代理另行實測。年度存檔第一期在批准範圍內結案；使用者已取消第二期匯入／匯出與第三期操作途中續玩（CANCELLED／不實作），存檔功能開發結束。dev已合併PR #70（f3f05fa），不代表main合併或正式發布。[第一期驗收記錄](docs/reviews/BROWSER_SAVE_PHASE1_ACCEPTANCE.md)。原FAIL與各SHA的Quick／Full證據保持原狀；ARTIFACT_COVERAGE_BLOCKED仍獨立未完成。

> 原BLOCKED時點原文（歷史，已由後續修復與本次驗收取代，非現況）：`IMPLEMENTED_UNVERIFIED`（最新）；以下為原BLOCKED歷史。1.15.0開發試作已接線；年度續行6路線PASS，但Rookie路線引退年度因過年度D2 Decision完了WeakMap證明未能跨重載恢復，原生HOF待遇與讀檔結果不一致。不得將第一期視為完成或發布。須先確認可信證明的持久化／驗證契約，不以JSON或hash直接認定可信，不補發效果、不降斷言。新Quick／Full、全路線、Preview／實機尚未完成。[停止報告](docs/reviews/BROWSER_SAVE_PHASE1_BLOCKER.md)／[設計§5.1、§14.2](https://github.com/tt-chin/yakyujinsei/blob/f3f05fae431a002429dbd42e430713aee2e058bc/BROWSER_SAVE_DESIGN.md)。原始FAIL及舊工作樹保留，ARTIFACT_COVERAGE_BLOCKED維持獨立。統計：40完成＋28未完成＝68項；新增本項，不改寫其他歷史結案。


BROWSER-SAVE-01追記（2026-11-08）：使用者指示繼續後，已實作封存驗證與歷史唯讀證明還原；原Rookie HOF差異限定重測通過，全15路線341年度及引退重玩通過。最終Quick／Full與Preview／實機尚待驗收，本ID仍不勾選，不改寫原BLOCKED歷史。最新[第一期驗收記錄](docs/reviews/BROWSER_SAVE_PHASE1_ACCEPTANCE.md)，不以限定PASS冒充完成。


BROWSER-SAVE-01最新狀態：技術阻擋已有封存驗證與歷史唯讀證明修復，最新直接測試43／0；metadata綁定補強後的Quick79／Full105執行請求未獲准，均未啟動，NOT_RUN。先前Quick79／0是補強前中間結果，不流用。保持未勾選及IMPLEMENTED_UNVERIFIED；40完成／28未完成不變，BLOCKED 4項、IMPLEMENTED_UNVERIFIED 6項。使用者另行執行／批准驗收後再更新，不改寫原始FAIL及Linux／artifact歷史。


BROWSER-SAVE-01：2026-11-08最新核對，本機最終Quick79／0已完成（quick-acceptance-r4）；依使用者指示中止本機Full並轉GitHub Actions完整105入口驗收。舊「最新Quick未獲准」為前時點紀錄，新一輪已取得授權並完成。測試／文件將與產品一併存在feature分支供CI，尚未取得新CI完整結果及實機結果，保持未勾選／IMPLEMENTED_UNVERIFIED。


BROWSER-SAVE-01：2026-11-08 dev合併後核對。PR #65合併後dev（含PR #66，`ea89c15`）：Tests #160 Quick PASS、Tests #161 Linux Full 107／107 PASS（8批及Aggregate PASS，[Run42464271804](https://github.com/tt-chin/yakyujinsei/actions/runs/42464271804)）。桌機Preview（`https://dev.yakyujinsei.pages.dev`，檔案與`ea89c15`逐位元組一致，v1.15.0；macOS Brave、seed `save-preview-20261108`、投手）依實機受入手順1～7執行：1～5、7 PASS，6僅以390×844／844×390視窗確認無溢出，網址列切換須實機。同日iPhone 13 mini（iOS 26.6.1、Safari 26.6.1）以Mac端`safaridriver`的WebDriver自動化執行同手順：1～5、7 PASS，6僅直向375×664確認（橫向與網址列未測）；工作階段與一般瀏覽資料隔離、關閉頁籤以關閉視窗代替，使用者確認作為iPhone實機驗收。Android Chrome實機仍NOT_RUN，保持未勾選／IMPLEMENTED_UNVERIFIED。詳見[第一期驗收記錄](docs/reviews/BROWSER_SAVE_PHASE1_ACCEPTANCE.md)。


BROWSER-SAVE-01／ホームUI補足（2026-11-08）：fix/home-ui-20261108、開発版1.15.1。セーブありは「続きから」「新しく始める」、なしは通常フォーム。フォーム表示だけでは保存を変更せず、実際の新規開始時の確認・取消保護を保持。独立削除ボタンは使用者決定により廃止。ホーム下部2×2、クレジット短縮、スマホのタイトル／半透明操作面板を実装。ゲーム中も背景を保持。限定ローカル確認は1440×900／390×844／375×667、拡大・回転、全保存行の不変／確認後置換、年度還原S／RNG、故障retry、複数タブ・読取不能、controller10項PASS。ローカルQuick／Fullは未実行、今回の確定SHAでGitHub Actionsにて実行する。Preview／本修正の実機確認はNOT_RUN、Androidを含む第一期全体の未完了状態とARTIFACT_COVERAGE_BLOCKEDを維持。既存のQuick／Full PASSは元SHAの記録として保持し、本変更へ流用しない。項目とcheckbox総数は変更しない。

ホームUI Quick失敗修復（2026-11-08）：CI Run42470961151／adac181為80 PASS／1 FAIL。唯一失敗draft-income-e2e在同context第二案例有存檔時未先選「新しく始める」，直接點隱藏守位欄而timeout；修正start helper在該入口可見時先正常點擊，不改產品、原比較基準、收入／防重／S／RNG斷言或timeout。限定入口重測18 PASS／0 FAIL（85.884秒）。依使用者最新批准改在本機執行整套Quick：test-results/home-ui-1151-quick-r2/summary.json，81 PASS／0 FAIL／0 SKIP／0 BLOCKED，372.501秒。原CI FAIL保留；接著提交推送fix分支並手動啟動Linux Full，啟動後不監控。Full與實機結果仍待取得，ARTIFACT_COVERAGE_BLOCKED不變。
ホームUI Full失敗修復（2026-11-08）：Run42472867637／34f83b3は107入口中106 PASS／1 FAIL／0 SKIP／0 BLOCKED。第7批event-fix-e2eの共有URL再訪問で、同contextの有効保存を持つホームにも即座に開始ボタンが見えるとする旧断言がFAIL。テストを「続きから／新しく始める」表示→新規フォーム表示へ更新し、Seed完全一致、表示切替前後の完全save／revision不変を追加確認。製品、元のイベント・共有・状態／RNG断言、timeout、baselineは変更しない。限定入口を1280／320／390pxで重測PASS、各幅の8送別fixture、その他イベント・共有・S／RNG・Console／JS-CSS404検証もPASS。旧Full FAILは保持。テストのみの修正として版号据置1.15.1、GitHub Fullを新SHAで1回起動し、以後監視しない。Full全体と実機の受入は未取得、ARTIFACT_COVERAGE_BLOCKED継続。

BROWSER-SAVE-01最終驗收（2026-11-08）：使用者已確認剩餘實機驗收及1.15.1正常，上述未勾選／IMPLEMENTED_UNVERIFIED／Android NOT_RUN等文字均為原時點歷史，不再作為本項現況。最新狀態以本ID的USER_ACCEPTED / PHASE1_COMPLETE及第一期驗收記錄為準。統計43完成／27未完成，共70項；不解除artifact缺口、不宣稱合併後另跑Full或已正式發布。


存檔功能最終範圍決定（2026-11-08）：使用者明確指示「第二期第三期不實做，存檔功能開發結束」。第二期匯出／匯入及第三期操作途中續玩均取消，不列入未完成待辦、不冒充已實作；第一期維持USER_ACCEPTED / PHASE1_COMPLETE。保留原提案與失敗歷史，沒有新增備份按鈕、跨裝置／跨瀏覽器承諾或新產品功能。checkbox統計仍為43完成／27未完成，共70項。ARTIFACT_COVERAGE_BLOCKED及正式發布狀態不變。


## 已實作項目驗收結案（2026-11-08）

依使用者對前一則未完成項目清單的統一確認，將上述7項已實作、待Preview／實機／外部收款驗收項目標記結案。這是使用者驗收紀錄，不是代理重新執行測試；未提供個別裝置或付款憑證，僅記錄其接受。尚未選定的DESIGN_PENDING規則、未完成稽核及CI技術債不因本確認自動實作或通過。ARTIFACT_COVERAGE_BLOCKED保持未完成。統計50完成／20未完成，共70項。以下為結案前各ID的完整歷史原文，不作為現況：

> **EVT-1102-ANDROID** — `BLOCKED`。Android Chrome 實機的年度事件去重、途中 Seed 分享驗收。

> **UI-17-DEVICE** — `BLOCKED`。iOS Safari／Android Chrome 實機的顯示設定與事件驗收；功能已公開，**不是未實作**。

> **SHARE-111-DEVICE** — `BLOCKED`。iPhone／Android／PC 的原生 share sheet、取消、PNG 主題、圖片分享與儲存驗收。

> **TRAIT-CHAMPIONMAKER** — `CI_PASS / MAIN_MERGED / USER_PREVIEW_PENDING`。使用者追加批准以既存日本一／ワールドシリーズ／台湾シリーズ／韓国シリーズ優勝為通算對象，跨隊／跨聯盟累計5次、每年最多一次。只採可信championshipResults，不從學生、國際賽、二軍、育成或模糊honors推定。僅榮譽特性，不加勝率、不增加RNG抽選；nitenichi仍停用。4→5→6、舊狀態、重入及取得顯示故障續行已有限定測試；Linux Full 96／96 PASS，已隨1.14.0併main且發布Workflow成功；使用者Preview仍待確認，見§1現況摘要。

> **UI-TJ-GAUGE-01** — `CI_PASS / MAIN_MERGED / USER_PREVIEW_PENDING`。依[物件導向化計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md) §2e.7、§2g.1，career-presenter.js已改為小數一位＋既有上限（一般50、ゴムの腕100），例如12.6 / 50；缺值0、不clamp、不寫回S.tj、不改RNG。0／浮點誤差／邊界／缺值已有單元驗證；PC／手機限定驗證與Linux Full 96／96已通過，1.14.0已併main且發布Workflow成功；使用者Preview未確認，不提前結案。

> **UI-BOARD-SHADOW-01** — `CI_PASS / MAIN_MERGED / USER_PREVIEW_PENDING`。2026-11-06使用者批准修正並併入1.14.0。career-presenter.js的board()內兩處rgba全形頓號改為半形逗號，保留色彩、尺寸、球團判定、S與RNG。59項presenter比較PASS；Chromium在1280／320／390px、一般色／白色共6組陰影與無溢出檢查PASS，記錄於test-results/board-shadow-1140/summary.json。另有Linux Full 96／96 PASS、1.14.0 main合併與發布Workflow成功；使用者Preview未確認，不提前結案。

> **SUPPORT-01** — `IMPLEMENTED_UNVERIFIED`。選單OFUSE連結、別分頁安全屬性與本機連結驗證通過；2026-11-05使用者接受整體UI並確認iPhone Safari／Android Chrome實機操作OK。尚未確認OFUSE收取設定及實際收付款，整項維持未結案；不得將UI驗收當成收款驗收。[歷史驗收與發布紀錄](https://github.com/tt-chin/yakyujinsei/blob/fd57fa02f96cf3bc02cf52f0d2f6a6cf4be5ff93/BACKLOG.md)補驗與原始FAIL紀錄保留。


## 殿堂與背號批准決策（2026-11-08）

依使用者逐項批准及四點補充，[決策正本](tasks/HOF_JERSEY_APPROVED_SPEC.md)記載待實作的殿堂規則、理由顯示、背號履歷與比較界線。HOF-VOTE-STORY-01 CANCELLED／不實作，移出待辦而非標PASS；永久欠番保留後續設計，投手平衡只調查。50完成／19未完成，共69項（取消1項）。以下保留原待決條款與測試歷史，不作現行授權：

> **HOF-BUCKET-DECISION-01** — `DESIGN_PENDING`。決定 NPB／CPBL／KBO 的育成、二軍、一軍成績在殿堂評價中如何合算；MiLB 目前不併入 MLB。

> **HOF-PITCHER-BALANCE-01** — `DESIGN_PENDING`。以自然生涯評估 SP／MR／CL 與 HLD、ERA、WHIP、L 等投手指標；A／B／C 方案仍是假說，係數未批准。

> **HOF-HONOR-POLICY-01** — `DESIGN_PENDING`。確認 MVP、最優秀投手、部門／守備獎對殿堂投票候選的保證規則，以及國際／加盟球團加分範圍。

> **HOF-DISPLAY-ROUND-01** — `DESIGN_PENDING`。如 raw 7999.8 顯示 8000，是否造成門檻誤解；是否補註或調整顯示需決策，未批准修改判定。

> **PLY-01** — 背號與年度履歷；需先決定 00、轉隊、重複及改號規則。

> **PLY-02** — 永久欠番；以前述背號履歷為前提，待組織、年數、成績及 RNG 規則批准。

> **TEST-COMPARE-BASELINE-01** — `DESIGN_PENDING`（2026-10-19縮小範圍）。以`origin/main`為比較基準的3入口（`contract-salary-e2e`、`draft-income-e2e`、`display-preferences-e2e`）在`dev`升版而`main`未跟上時，`birthHighSchool.createdVersion`版本戳記不同，自第0步不一致。**版本戳記部分已處理**：使用者批准比照既有`delete state.version`，於比對前排除該欄位（衍生結果`traits.smallschool`仍比對）；`display-preferences-e2e`亦改用共用`assertSameCareer`防止失敗時OOM。本機Docker 2 CPU／7GB驗證：3入口對`7220ad8`（1.12.0）與`650e4dd`皆PASS（`contract-salary-e2e` 381案，峰值≤3.49GB）；排除前對`7220ad8`的FAIL（含milb-demotion兩案）與`display-preferences-e2e`的OOM皆僅由此欄位造成。**剩餘待決**：有規則變更的版本於發布前跑dev Full時，跨版本比對是否須以許容差分oracle（如`assertApprovedProducerRenameCareer`）宣告差異，或明確接受該等入口FAIL；屬政策判斷，未經批准不改期望值或基準。固定基準的入口（如`hof-first-ballot-e2e`、`salary-history-e2e`）不隨`origin/main`變動，不在本項範圍。2026-10-19 CI確認：Run39260159042（`2a11a64`，Linux Chromium）中3入口對`650e4dd`皆PASS（`contract-salary-e2e` 135.9秒、`display-preferences-e2e` 115.1秒、`draft-income-e2e` 334.2秒）；本次`dev`與`main`的VERSION相同，不構成跨版本規則變更的驗證，剩餘待決不變。

> **HOF-VOTE-STORY-01** — `DESIGN_PENDING`。檢查 i=0 確定性殿堂演出、i=1 候選止步的說明是否容易被誤認為隨機投票；未批准概率化。


## 殿堂四項本機實作歷史（2026-11-08～09；最新CI與合併狀態見§1）

> 以下保留當時測試／提交前狀態；後續Full112 PASS與PR #74合併已確認，非仍待執行。

feature/hof-evaluation-policy，自dev 25b815e，1.16.0工作樹。TEST-COMPARE-BASELINE-01／HOF-DISPLAY-ROUND-01／HOF-BUCKET-DECISION-01／HOF-HONOR-POLICY-01本機已實作；最終Quick 85 PASS／0 FAIL／0 SKIP／0 BLOCKED，362.42秒（test-results/hof-policy-quick-final-r3/summary.json）。固定P／IF自然與控制退休、同版完整重播、PC／320／390及分享圖PASS；控制例以固定舊退休模組及獨立批准評價oracle嚴格比完整S與用途標記逐筆RNG，不略過整個退休。新franchise來源只在原取得條件成功時新增，舊布林不猜聯盟。原整合FAIL及修復見[驗收紀錄](docs/reviews/HOF_EVALUATION_1160_ACCEPTANCE.md)。`4bbcd3b`已提交推送；[Linux Full 42492930690](https://github.com/tt-chin/yakyujinsei/actions/runs/42492930690)為104 PASS／8 FAIL（112入口），原FAIL保留。2026-11-09限定修正fixture、franchise取得證據比較及退休顯示oracle，詳見上列驗收紀錄。依使用者新決定，本輪不執行本機Quick；尚未完成的本機重測已停止，最終GitHub驗證待執行，不以部分PASS代替完整Full。四ID維持未勾選；Preview／實機NOT_RUN。背號、永久欠番未實作，投手係數不改，票選概率化提案不復活。既有50完成／19未完成及ARTIFACT_COVERAGE_BLOCKED不變。本輪僅提交推送作業分支，不merge或部署。


### 2026-11-13：案內選單文字與不具合報告（1.16.3，本機完成）

開始畫面、遊戲選單及案內對話框的素材入口統一為「クレジット」，保留授權正文；選單於更新履歷後新增「不具合報告」，依使用者指定完整X網址以別分頁開啟，沿用圓點、外部連結提示與共用選單操作。產品規則、S／RNG及存檔不變。

限定驗證：1280×900、320×568、390×844、320×300共309檢查PASS，包含完整URL／新分頁、安全屬性、無障礙名稱、對齊、クレジット標題與授權保留、關閉與焦點、既有分享操作；page／module errors 0。履歷來源／生成及重複生成一致性、語法與diff檢查PASS。證據：test-results/menu-credits-bugreport-1163-r2/及同名log；r1的測試工具重複節點拒絕檢查FAIL保留，r2已補強並通過。歷史DOM只精確驗證並投影本次批准的選單差異，其他DOM／S／RNG斷言保留，無修改golden。

依AGENTS純顯示R2例外採限定驗證，本次Quick／Full、實機與Preview NOT_RUN；依使用者授權隨本次dev提交推送，推送後CI及Preview部署狀態另以對應Run核對，不將本地結果寫成發布完成。不新增ID或更改既有checkbox；本輪已依實際清單修正頁首與彙總統計。


### 2026-11-13：Full歷史配色依賴接線修復（測試限定）

Run43247910213／a6b3bc7的117入口為111 PASS／6 FAIL／0 SKIP／0 BLOCKED，八批完成。六個入口（投球fixture、兩個投球seed入口、國際賽、弱小校、特性顯示）的25次pageerror皆為舊game.js匯入現行share-theme.js不存在的getSharePalette，另有一次自然WBC覆蓋未到達的連鎖FAIL。原因是1.16.2移除舊API後，歷史game-only比較未載入配套舊模組；不是六個產品邏輯錯誤，也沒有OOM／Runner中斷證據。10個artifact已上傳；ARTIFACT_COVERAGE_BLOCKED仍獨立保留。原始下載與log存於test-results/ci-full-43247910213-analysis/及本機完整run log，不覆寫原FAIL。

修復：tests/support/stage6-browser.mjs新增頁面限定routeHistoricalShareTheme，投球、國際賽、弱小校、特性顯示四個測試檔僅在old頁面呼叫，載入各自原固定40位SHA的完整share-theme.js原件。現行頁面、產品程式、VERSION 1.16.3、既有baseline、golden、斷言、RNG、timeout、Runner／CI及117入口集合不變；沒有恢復產品舊API或新增空函式。契約及執行方式見scripts/TESTING.md。

限定驗證：scripts/test-historical-share-theme.mjs四個入口接線／基準檢查、四份完整原件一致性及四個無效／不存在基準拒絕通過；真實瀏覽器四個歷史引擎啟動＋現行模組隔離負控制5 PASS／0 FAIL／page errors 0。負控制在未套歷史route時重現原缺失export錯誤。原失敗full-power-pitching-e2e --part=fixtures完整入口30 PASS／0 FAIL／page errors 0，包含29個原fixture與IF舊／現行／批准phoenix控制／同版重播的完整狀態與主RNG比較。證據：test-results/historical-share-theme-fix-r2/與historical-share-theme-pitching-fixtures-r1/，另各有同名log。語法、diff與原自動入口集合檢查通過。

本次為R2測試基礎接線修復，依使用者既有決定不跑本機整套Quick／Full；推送dev後由GitHub Quick驗證。新來源的六入口完整Linux重測與Full尚未執行，不以啟動檢查或單一入口PASS替代Full。不新增待辦ID、不更改checkbox、版本或發布履歷；不修改main或正式發布。


### 2026-11-13：新生涯確認與存檔刪除流程（1.16.4，本機完成／CI待驗證）

依本輪使用者決定，原生提醒改為沿用「遊び方」標題／可捲動內容／固定操作區的共用確認對話框。首頁「新しく始める」先確認，取消或Esc保留完整存檔；OK以既有版本核對交易立即刪除存檔，成功後才顯示選手建立表單，真正開始時不再詢問覆蓋。「最初からやり直す」仍先確認返回首頁並保留存檔。無法儲存時另明確確認本次不保存；刪除失敗或跨分頁衝突不得進入新生涯覆寫，必須重新讀取。沒有新增獨立刪除按鈕。

影響分類R3（既有存檔刪除時機調整）。比較基準為上述完整dev SHA；投手／野手的初始狀態與第一操作比較，僅分別核對後投影VERSION與birth.createdVersion兩個版號欄位，其餘完整S、選擇與主RNG trace嚴格相等；同版完整重播嚴格一致。允許差異僅為核准的確認介面、OK時刪除與版本metadata，不改遊戲規則或RNG。

本機限定驗證：Controller 14／14、codec 38／38、年度邊界4／4、career-entry 13／13 PASS；真實IndexedDB Runtime 13組PASS，涵蓋年度恢復、乾淨重試、拒絕存取、跨分頁衝突及投手／野手狀態／RNG比較。追加5種尺寸（1440×900、390×844、375×667、320×568、320×300）、4主題、Tab／Shift+Tab、取消／Esc焦點、重複點擊與過期確認共8組PASS。event-fix-e2e三種寬度PASS，draft-income-e2e相關quick profile 18 PASS／0 FAIL（不是整套Quick）。履歷生成及重複生成、模組檢查、語法及diff PASS。既有測試僅按已批准的確認／刪除時機調整預期，不修改Runner、CI、golden或其他遊戲斷言。

證據：`test-results/save-confirmation-runtime-final-r3/`、`test-results/save-confirmation-theme-keyboard-r4/`及同名log、`test-results/save-confirmation-event-regression-r1.log`、`test-results/save-confirmation-draft-regression-r1.log`。早期Controller限定重測因舊測試未傳入明確確認參數而FAIL，修正該測試接線後14／14 PASS，原輸出保留；Runtime完成後出現profile cleanup timeout警告，瀏覽器已斷線、斷言與程序結果PASS，警告不隱藏。

整套Quick／Full依既有使用者決定交由GitHub Actions，本機NOT_RUN；本次未提交推送，CI／Preview／iPhone Safari／Android Chrome實機NOT_RUN，不能以舊來源Full代替。本輪不更動74個唯一ID及50完成／24未完成checkbox，也不解除ARTIFACT_COVERAGE_BLOCKED。歷史1.16.3的Full111／6及後續來源117／117分開保留。


### 2026-11-13：display-preferences-e2e 歷史殿堂比較接線修復（測試限定）

受驗dev `c03df23a3a9697586474394457b8fea21f23cbef`的[Full 43265174634](https://github.com/tt-chin/yakyujinsei/actions/runs/43265174634)為117入口中116 PASS／1 FAIL／0 SKIP／0 BLOCKED。唯一失敗在第8批display-preferences-e2e；測試無條件將main基準的殿堂模組掛至/hof-oracle/，但main `d08a859ba6ff24ebd713478817a161e72eca46df`已使用hof-evaluation-policy.js相依，該虛擬路由不存在，404導致引擎初始化中止、btn-start停用，30秒點擊等待逾時。Aggregate正確拒絕PASS，8個分批、plan及彙整artifact均成功上傳（只確認上傳，不宣稱完整保存契約通過）。同SHA [Quick 43265041516](https://github.com/tt-chin/yakyujinsei/actions/runs/43265041516)成功，不能替代Full。

最小修復：依指定基準殿堂模組的實際相依介面判斷是否需要舊顯示投影；現代基準不載入舊oracle，也不投影殿堂退休DOM，完整文字、狀態、選擇與RNG仍嚴格比較。真正舊基準維持原凍結公式、可信award模組單一實例及原投影斷言。新增oracle請求路徑斷言：現代必須0次，舊基準必須實際載入；不是關閉殿堂驗證、全域忽略DOM／S或更換基準。

限定重測PASS：以原CI兩個seed及完整main SHA執行原失敗入口，24種設定×6種尺寸通過；投手yakyo-test-001為543步／652次RNG，野手jp3-infielder-01為544步／549次RNG，至2058年退休全程一致；現代oracle請求0，Console／JS-CSS HTTP錯誤0。另以8dd244b舊基準執行--skip-careers，24種設定×6尺寸通過、舊oracle實際請求5次、錯誤0；這一項只證明舊載入與UI相容，不宣稱舊基準完整生涯驗證。證據：test-results/display-preferences-hof-fix-r1/及display-preferences-hof-legacy-r1/，保留原CI FAIL。

本輪R2測試接線修復，不改產品、VERSION（維持1.16.4）、Runner、workflow、golden或其他斷言。本機整套Quick／Full依既有使用者指示NOT_RUN，新來源Linux Full及實機NOT_RUN；未推送或重跑CI，不解除ARTIFACT_COVERAGE_BLOCKED，不更改既有checkbox。


### 2026-11-15：顯示名稱統一（1.16.9，本機限定驗證／未提交）

依使用者提供的DISPLAY_NAME_REVISION_20261115.md及實作授權處理NAME-01～09。franchise取得卡與殿堂明細共用正式名稱；mrteam改為ミスター＋原暱稱、仍依取得球團；退休多角色／多守位改名，半數判斷與排序原封不動；兩個殿堂入口共用五級名稱及半形空白；既有低能力分支改為発展途上型；選單及遊び方改為タイトルに戻る，保存與控制流程不變。長達八守位的名稱在PNG副標題會超寬，限定該行超寬才縮小字級，全文保留。版本1.16.8→1.16.9，更新正式／玩家履歷與現行名稱規格，未推送或發布。

R2純顯示例外：不執行整套Quick／Full或完整生涯。固定比較來源38ed1bbd7a9752d8b12059ed31859620bcc0fdad；216組兩入口HOF對照只允許name與franchise明細text改變，其餘完整數值／details／輸入狀態相等；10組退休角色／守位含半數邊界、缺失與DH-only只允許前綴；6組實際特性取得前段完整S、cards、board順序相等，RNG不得呼叫。既有能力類型大量歷史對照只投影r.type的期待の若手→発展途上型，其餘計算及狀態不變；TraitResultCard 57,506組與原凍結函式對照PASS，保留神カード等歷史辨識。共6個相關單元入口及award-identity凍結保護135項PASS。

畫面限定驗證：1280／320／390×投手／野手×4主題×最大字級，取得卡、歸檔、特性清單、退休概要、實際canvas文字與邊界、唯讀S／RNG檢查；另驗證返回首頁取消／確認的完整IndexedDB存檔及非空顯示設定保留。共7組聚焦案例，無Console／pageerror／JS-CSS404；證據test-results/display-name-browser-final-r6/，PNG預覽career-names-P.png／career-names-IF.png。未執行Safari／Android實機、CI、整套Quick／Full，不將本機結果稱為正式發布或全套回歸PASS。

原始失敗保留：unit-r1／r2為兩處舊能力文字期待未投影，限定修正該欄位後unit-r3及final-unit-r4通過；browser-r1為三個長多守位PNG超寬及一個按鈕innerText換行誤判，縮小超寬副標題／以無障礙名稱驗證後通過；release-notes-r1誤認HEAD既有token化樣式尚未新增確認框CSS，檢查改為相同內容直接逐字確認，不重加歷史raw CSS，r2通過；browser-final-r5新增PNG評價斷言漏列既有「★ 」前綴而FAIL，改為嚴格驗證完整「★ NPB 実績を残せず」後限定重測，原FAIL保留。履歷來源／生成／日期／重複生成、修改JS語法及diff已檢查。不改歷史快照、golden、Runner或CI。

- [ ] **UI-MRTEAM-NICKNAME-01** — `IMPLEMENTED_UNVERIFIED`（2026-11-15本機完成／待使用者審查）。同日最初保留AN的決定已由後續TEAM_ID_NICKNAME_MAP.md與實作授權取代；58隊明示對照已接入1.16.9，不升版。完整S／RNG、未知／空／表外ID、轉隊後取得球團、取得標題與內文、清單／歸檔／退休／PNG均完成限定驗證；CI、Preview、實機未驗證，不提前勾選結案。新來源與證據見下節。


### 2026-11-15追加：58隊球團ID暱稱（併入1.16.9，未提交）

使用者提供TEAM_ID_NICKNAME_MAP.md並指示實作，取代上一輪暫保留AN的處理。新增docs/src/data/team-nicknames.js，明示NPB 12／KBO 10／CPBL 6／MLB 30隊的唯讀對照；traitLabel('mrteam')只讀取得時S.mrTeamName，未知、空、非字串、表外或原型屬性名稱回傳基本稱號ミスター，不截ID尾碼、不推測目前球團。取得標題與內文改共用同一正式label；清單、退休概要、球迷文字、PNG沿用既有共享來源。昌原／台北ダイナソーズ保留城市名。不改一般teamNick、其他球團顯示、取得條件、數值、RNG、存檔或舊自由文字。VERSION維持1.16.9，更新同版CHANGELOG、RELEASE_NOTES→既有生成器、CURRENT_SPEC。

限定驗證：58隊對照與使用者原表／現行JP_DATA逐項一致；新增所有58隊、8個明確暱稱案例、未知／空／歷史名稱／表外／原型key、轉隊後取得球團與完整狀態不變檢查。實際movement取得前段僅允許mrteam標題與內文的已批准名稱差異，完整S、board順序及RNG仍嚴格比較。PC1280／320／390×投手／野手×4主題×最大字級，驗證ミスターストライプス、長ダイヤモンドバックス、昌原／台北、未知ID的清單與PNG及邊界，維持所有既有NAME測試。7組瀏覽器案例PASS／0 FAIL，Console／pageerror／JS-CSS404為0。

證據：test-results/team-nickname-unit-r1.log、team-nickname-browser-r1/（含更新PNG預覽career-names-P.png／career-names-IF.png）、team-nickname-release-notes-r1.log；最終相關單元／凍結與模組檢查另存team-nickname-final-checks-r1.log。原display-name-*所有FAIL／PASS保留。整套Quick／Full、完整生涯、CI、Preview、手機實機NOT_RUN，不宣稱全套回歸或發布完成；不commit、push或部署。


### 2026-11-15：空白選手名隨機組合（1.16.10，本機限定驗證／未提交）

- [ ] **UI-PLAYER-RANDOM-NAME-01** — `IMPLEMENTED_UNVERIFIED`。依使用者PLAYER_RANDOM_NAME_LIST.md及實作指示改善既有空白姓名補完：50位素材拆成46姓／50名各自去重，獨立等機率選取，直接姓＋名；不排除原選手同名、不重抽。同seed新生涯允許姓名不同。只替換game.js的deriveDefaultName內容並新增player-names.js，保留normalizePlayerName的NFKC／trim／控制字元排除／10字限制、CareerEntry時序、讀檔與存檔格式。crypto.getRandomValues＋拒絕抽樣不呼叫生涯RNG；不加能力／成績等效果。有輸入就保留正規化後名字，既有存檔不改寫。候選表與原文件逐項相等；山本素材實為3人，去重後只保留一姓。VERSION 1.16.9→1.16.10（既有預設名改善PATCH），同步CURRENT_SPEC及詳細／玩家履歷，經既有腳本生成JS。

限定單元：CareerEntry原13組新舊呼叫／狀態／讀檔／故障對照及負控制保留；新增46／50唯一與凍結候選、2300組姓／名獨立組合、最大長度、拒絕尾端偏差及邊界驗證PASS。verify-modularization、award-identity原始凍結135項、履歷來源／日期／生成與重複生成PASS。沒有修改歷史baseline、golden或降低原斷言；新聚焦E2E僅在既有manifest新增Full／audit登錄，不改Runner／CI、既有入口或合否條件。

瀏覽器限定：以f3bffeee49cd6a9cca3f56b9118bf164992bd8af凍結來源逐項對照，P／IF×空字串／半形空白／全形空白／有輸入／NFKC／長度共12組PASS。比較初始及3步的完整S、選項與每次RNG的前後狀態／值，只允許已各自核對的S.name、S.version及birthHighSchool.createdVersion差異；有輸入時新舊姓名均須等於精確預期。抽名僅發生在空白新生涯開始的兩個獨立候選抽取，不在輸入／重繪／分頁／PNG／讀檔／年度推進發生。兩角色實際讀檔及原生推進至2027年度存檔均保持姓名，並驗證主畫面、選手頁、320px與PNG同名。測試清單初次檢查因新E2E未登錄而拒絕執行（Unclassified tests file），已補單一登錄並重驗通過；原兩個空白歷史比較入口改為明確固定姓名：stage6-browser沿用原4角色預設名，browser-save-runtime的startComparison固定確認比較太郎；不全域忽略S.name或整份S。共用fixture另以P／IF真實啟動2組PASS。

證據：test-results/random-name-unit-r1.log、random-name-final-checks-r1.log、random-name-browser-final-r3/及同名log、random-name-fixed-fixtures-r1/及同名log；PNG為name-P.png／name-IF.png。原browser-r1／r2的12組功能斷言均通過，但Windows瀏覽器關閉等待未結束，已核對身分後停止僅該兩個測試Node程序，原資料保留；final-r3採既有工具慣例限時關閉，瀏覽器已斷線而profile收尾逾時則明列cleanupWarning，功能12 PASS／0 FAIL／Console與JS-CSS404為0、程序exit 0。這不是Linux或實機結果。

整套Quick／Full、完整生涯、CI、Preview及手機實機NOT_RUN，依本次限定範圍不額外執行。不commit／push／部署，不修改main；待使用者審查，不將本機驗證或瀏覽器關閉警告混成全套回歸／發布PASS。


### 2026-11-15追加：表示名稱改版後のQuick 4 FAIL修復（1.16.10に併入）

GitHub Quick Run 43659492683、受驗SHA f3bffeee49cd6a9cca3f56b9118bf164992bd8af的88 PASS／4 FAIL保持原結果。使用者授權確認修正並維持目前1.16.10，不再升版。本輪僅調整4個失敗測試及本紀錄；以修復前SHA256逐項核對，既有隨機姓名產品／測試／履歷修改均未覆寫，不改產品邏輯、golden、Runner或CI。

原因及限定修復：career-traits改驗取得時球團ID的正式暱稱、未知ID與轉隊／完整狀態不變，不再期待已移除的teamNick注入回呼；hof-retirement-comparison的VM補入正式traitLabel／TRAIT_TEXT，24個原生取得案例只投影已批准的神カード→フランチャイズプレーヤー標題與既有來源紀錄，其他完整狀態及呼叫順序仍嚴格比較；design-tokens-07保留原20處字型／尺寸斷言，另逐字驗證唯一新增副標題縮放式及短字不縮／長字完整保留；design-tokens-03不再把已批准的新名稱當成配色退化，先核對新舊原生名稱與完整繪字清單，再只統一UKミスター→ミスターシーホークス、期待の若手→発展途上型。新舊分享物件原本以值捕捉playerType，故僅測試伺服器的精確單一依賴綁定改為轉呼叫，確保文案控制實際作用於圖片；原始來源與基準Git樹不變。

圖片限定驗證：1280／390×4主題，20項圖片／配色檢查、20項原生文案檢查、3項顏色／字型／文案負控制及1項color-mix檢查通過，Console／404錯誤0。標準主題原生圖片差異為19,599像素、範圍x158～1708／y197～292（1840×932），對應副標題與特性列；只統一上述文案後，standard／classic的舊配色完整PNG逐位元相同，未遮罩、裁切、改golden或忽略其他像素。每次渲染前後完整S／RNG相等。原3個單元入口3 PASS／0 FAIL；圖片入口20 PASS／0 FAIL。

證據：test-results/display-name-quick-43659492683.log、name-ci-three-units-r1.log、name-ci-png-control-final-r3/summary.json、images/及同名log。保留r1／r2中間資料：r2因測試文案控制未穿過上述值捕捉依賴而FAIL，修正測試注入後r3通過。Windows瀏覽器已斷線但profile收尾逾時的cleanupWarning仍明列，非Linux驗收結果。整套Quick／Full與GitHub重測NOT_RUN，未commit／push／觸發CI；原88／4不改寫為全套PASS。ARTIFACT_COVERAGE_BLOCKED維持不變。


### 2026-11-15提交狀態同步

使用者授權核對BACKLOG後commit／push至dev。本次範圍為1.16.10空白選手名改善、必要測試與上述4個Quick失敗入口修復，共17個精確檔案；不納入test-results或本機路徑資料。上一節「未commit／push」為限定驗證當時的歷史狀態，現由本次提交授權取代。原限定驗證結果不變，整套Quick／Full及新來源Linux CI尚未驗證；推送後依既有workflow自動Quick，不另外手動啟動Full。UI-PLAYER-RANDOM-NAME-01及UI-MRTEAM-NICKNAME-01維持IMPLEMENTED_UNVERIFIED，不提前結案；80唯一ID、56完成／24未完成，artifact限制及原始FAIL保留。


### 2026-11-15追加：KBO重播的固定姓名輸入（1.16.10維持）

Quick [Run 43666590311](https://github.com/tt-chin/yakyujinsei/actions/runs/43666590311)，受驗9fa1b6077e029b2035289ecaaec54d5845e866e2，91 PASS／1 FAIL／0 SKIP／0 BLOCKED；上輪career-traits、hof-retirement-comparison、design-tokens-07與design-tokens-03四入口均已在Linux通過。唯一kbo-renewal-e2e停於same seed/strategy replay的records[0].digest，原因是未填姓名的新生涯依1.16.10規格使用獨立隨機姓名。四次開局診斷確認空白兩次僅S.name不同，固定同名後完整初始狀態與RNG呼叫數一致。日誌中的KBO_PACKAGE_FLOOR_CAP_CONFLICT是舊基準刻意重現並驗證的失敗，不是本次現行程式失敗。原91／1及先前88／4保留，不改寫。

使用者授權修正後commit／push。僅在tests/kbo-renewal-e2e.mjs的共用start，以UI明確填入原角色預設姓名（P投山翔太／C強肩剛／IF守田巧／OF走川隼人），套用至舊版、現行、重播及fixture。未刪除S.name或digest、未放寬完整狀態／RNG／薪資斷言；不改產品、golden、基準SHA、Runner、CI或VERSION，仍1.16.10。

限定重測該入口--quick PASS（不是整套Quick）：404次操作、677次RNG、2050退休，同版完整重播相等；歷史失敗前390筆狀態／操作／RNG比較通過原核准championmaker差異檢查；2049降格續約及保證契約／排程斷言通過；1280／320／390px的到期、降格、續約、雙擊、原生薪資一次性支付與RNG檢查PASS，Console／JS-CSS404為0，約39.4秒。原測試的Windows已斷線profile收尾逾時警告仍保留，程序exit 0。語法與diff檢查PASS。證據test-results/quick-43666590311-failed.log、kbo-name-probe-43666590311.json／log、kbo-fixed-name-quick-r1.log；不納入Git。

本機整套Quick／Full、Full專用額外正向路線及新來源Linux CI未執行，不稱為全套回歸PASS。僅提交本測試及BACKLOG，push後依既有workflow自動Quick，不額外啟動Full或持續監控；main及正式站不變，Preview待確認。80唯一ID、56完成／24未完成，原限制保持。


### 2026-11-15追加：Linux Full 122入口的8項比較修復（1.16.10不升版）

使用者授權依Run 43667459804調查結果修正，未授權本輪commit／push或CI重跑。原受驗4b65a70defec7a791a038de59bb732dd96c3743f的114 PASS／8 FAIL、Aggregate FAIL_OR_INCOMPLETE保持；8批Artifact均已上傳，不代表完整證據覆蓋缺口解除。KBO與player-random-name入口已在Linux PASS。

修正限定測試與支援資料：contract-salary、npb-return、hof-first-ballot、bug-act-01-02、replay-share-theme在新舊版及重播輸入原角色相同固定姓名，S.name／完整狀態／RNG仍比較；game-view-dom與display-preferences只在比較來源仍使用舊名稱時，對顯示DOM／view文字套用明列的NAME-03／04／07／08／09對照，不投影S或RNG。退休文字已用CI實際基準ca3ee3287bbe2574fb27454ca647f9cf0d60949c定位：兩側543筆，首次差異為最後542筆text的字元5297，NPBページ上の乗客→NPB 実績を残せず；非狀態或RNG差異。game-view-dom保留其原固定4f39a73e23758b891bc24951225231792ab022b4基準。新support/display-name-comparison.mjs只做明列的純字串對照，由career-traits單元測試驗證原文／批准文案及未知名稱、數字、錯誤輸入等正負控制；manifest只新增import-only分類，原122入口、參數、通過條件不變。

分享圖片先驗證新舊原生Mr稱號及能力類型，再統一兩個已批准字串；舊dc5ac871為內嵌shareImage、新版為模組物件，兩種精確注入方式各自核對。保留原本收入列上方完整PNG像素比較區域，不擴大排除、不遮罩；失敗訊息改為短SHA256，PNG另保存。design-tokens-09在兩邊各自核對原生顯示版號與其config來源一致，再使用從現行config讀取的同一版號文案比較幾何；固定同名及明列顯示名稱後保留全部82,272項元素比較與34個變更selector命中檢查，0差異。不固定期待某一歷史版號，不刪除#app-version或其幾何。

限定結果：contract-salary只執行原失敗career-P／IF；bug-act只執行原失敗兩組同版重播（新增--replay-only選項，預設CI全部案例仍執行）；display-preferences只執行CI兩個seed的完整S／文字／RNG比較（--careers-only，不重跑已通過的設定組合）；npb-return、hof-first-ballot、game-view-dom、design-tokens-09執行相關原入口；分享使用CI原--ui-only。整套Quick／Full與新來源Linux CI未執行，不用限定結果取代Full。最終各入口的程序exit與數量於下段核對。

原始及中途FAIL保留：run-43667459804-failed.log與aggregate／batch-5／batch-8下載證據；display診斷先用預設8dd244b而得到85對543及舊traits差異，改用CI實際ca3ee328後定位真正退休名稱差異，未更換正式基準；GameView第一次將franchise正式卡片又轉回神カード而FAIL，確認舊卡片已有正式名稱後移除該多餘映射；另一次誤將只支援舊公式的GameView接到ca3ee328而載入逾時，仍用CI原4f39a73重測，不擴大修正該非CI組合。分享第一次注入漏分舊內嵌結構而404；修正後誤漏--ui-only多跑六條舊生涯，雖UI部分PASS仍以Array buffer allocation failed結束，原FAIL不改寫；最後依CI --ui-only重測。測試清單起初拒絕未分類的新helper，補import-only分類後清單通過。Windows已斷線profile清理警告另記錄，不當作Linux結果。

證據前綴test-results/full122-*：contract-career-r1與contract-career-final-r2、npb-r1、hof-r1、act-replays-r1/與同名log、share-r1／r2及share-ui-final-r3、tokens09-r1、game-dom-r1及game-dom-final-r2／r3、display-careers-r1、copy-policy-final-r2、test-list-r2；完整首差異另見display-actual-first-diff-43667459804.json。所有證據不納入Git，不改產品／規則／VERSION／golden／Runner／workflow。

最終限定驗證核對：合約career P／IF各1組（CI compare=ca3ee328）共2 PASS／0 FAIL、ACT兩個seed的4次生涯及2組完整重播PASS、NPB回歸原入口PASS、首次殿堂原入口PASS、分享原--ui-only完整入口PASS、display-preferences的CI兩seed完整生涯PASS、GameView以原4f39a73執行4角色策略×1280／390共8組完整DOM／S／RNG比較PASS（既有8個HOF負控制同時PASS）、design-tokens-09最終動態版號來源共82,272比較／34 selector全命中且0差異。上述程序均exit 0。GameView原--negative-control刻意增加年度標題一個空白，在step 0的dom.log以exit 1被拒絕，判為負控制PASS，不混入功能FAIL。

另加嚴兩個瀏覽器Mr稱號guard：先以明確TEAM_NICKNAMES核對原生新稱號，再產生舊顯示對照，禁止把錯誤的新稱號也投影掉。對兩個實際注入函式直接執行正確／未知／空ID、完整狀態不變及錯誤稱號拒絕測試，連同原career-traits及名稱映射共19組PASS；投影仍只用於DOM／views文字，不用於S、選擇或RNG。新增guard後以這些直接單元測試驗證，沒有再重跑8組完整生涯。

最終日誌：full122-contract-career-final-r2、full122-act-replays-r1、full122-npb-r1、full122-hof-r1、full122-share-ui-final-r3、full122-display-careers-r1、full122-game-dom-final-r3、full122-game-dom-negative-r1、full122-tokens09-final-r2、full122-copy-policy-final-r4。test manifest的122個Full ID（含syntax）已與原CI plan逐項核對完全相同，只有新helper的import-only分類。語法、相對引用與diff檢查PASS。12個本機修改／新增檔，未暫存／提交／推送；19項單元與上述限定入口不取代新的Linux Full驗收，原114／8、歷史中途FAIL及ARTIFACT_COVERAGE_BLOCKED均保留。

提交狀態補記：使用者於上述限定驗證完成後明確授權COMMIT／PUSH，本次12檔提交至dev；前文未提交為當時歷史狀態。推送後依既有workflow自動Quick，新來源CI與Preview待確認；未授權main反映／正式發布，亦未另外啟動Full。

### 2026-11-15追加：EVT-01 E1＋E2 事件分類徽章（1.16.11，本機驗證）

依使用者決定E1（提示標題＋結果卡）、E2（徽章）實作於`feat/evt-01-category-badge`（基準dev `1494a24`）。新模組`docs/src/ui/event-category-badge.js`（分類名一表，`eventChoiceSummary`共用）；提示標題用抽選當下的`effectiveCategory`（HS／U／CORP的encounter顯示為トレーニング），結果卡用`processedEventIDs`保存的`category`，不重算；未知分類不顯示徽章。新增`--event-{training,encounter,endorsement}-{bg,edge,text}` 9個token（4主題文字對背景≥4.5:1）。抽選候選／順序、成功率、效果、RNG、存檔不變。E3（年度事件履歷）未實作，EVT-01不勾選。

測試期待值變更（使用者逐項批准）：`event-copy.test`一條只替換一次的核准替換；`support/dom-snapshot.mjs`的徽章投影（新版一側，`game-view-dom-e2e`）與DOM移除（`display-preferences-e2e`），均有契約檢查；`design-tokens-06.test`字級使用處64→65、間距使用處172→174；`display-preferences.test`元件色48→57，-05 golden比對只排除明列的9個EVT-01 token（規則字串另由`event-category-badge.test`固定）。新增`event-category-badge.test`（7項）與`event-category-badge-e2e`（Quick＋Full）。

本機驗證（macOS＋Brave 157，非CI）：Quick 94／94 PASS；8批Full 124入口123 PASS／1 FAIL（`test-results/local-full-2026-11-15T07-53-16-101Z-3142ddc8`，sourceChanged false、缺0多0），唯一FAIL為dev既有的`design-tokens-09-e2e`（TEST-DT09-DEV-FAIL-01，dev `1494a24`單獨執行同為176差異）。負控制：單元4項（原始分類、結果重算、標籤錯誤、說明用原始分類）、DOM投影與移除各6項契約案例、token排除4項，均在預期斷言FAIL。修正前第一次Full的`game-view-dom-e2e`因投影位置錯誤FAIL、`display-preferences-e2e`與`design-tokens-09-e2e`FAIL，原始結果保留於`test-results/local-full-2026-11-15T07-11-51-609Z-dba73c7b`。reviewer無高／中發現，低1項（摘要字串48→57）已修正。Linux CI、Preview與實機未驗證。

### 2026-11-15追加：EVT-01 E3 年度事件履歷（1.16.12，本機驗證）

依使用者授權實作於`feat/evt-01-year-history`（基準dev `712d613`，含PR #97／#98）；細部計畫、T表與負控制見[實作計畫](tasks/EVT_01_E3_PLAN.md)。新模組`docs/src/ui/career-event-history.js`只讀`S.processedEventIDs`，在「キャリア → 年度別」有事件的年度最後一列下方加預設收合的折疊列（每筆發生各一行、不以cardID去重、年度→序號、分類／成敗／效果用保存值），不對應任何`S.log`年度者歸表末「今季（進行中）」；記錄不可讀時表首一列「イベント詳細記録なし」。效果文字不加「今季」。展開區sticky於橫捲框內（390px表801px／框332px時事件區324px）。凍結檔`player-detail.js`4處逐字改動已登記於`award-identity-policy.test`。

測試期待值變更（使用者批准T1～T6）：`award-identity-policy.test`凍結例外4組；`career-presenter.test`舊版oracle只准新增`events`（missing形狀）並另加ABL／fmtMoney接線案例；`design-tokens-06.test`間距使用處174→179；`support/dom-snapshot.mjs`候選側先依S核對`views.career.events`再刪除（比照1.13.4 incomeRows）。新增`career-event-history.test`（9案例）與`event-history-e2e`（manifest `quick:[]`）。

本機驗證（macOS＋Brave，非CI）：最終程式Quick 96／96 PASS；4組Full規劃126入口、實際執行126（缺0多0重複0），126 PASS／0 FAIL。草稿Full曾為125／1（`game-view-dom-e2e`的`$.views.career.events`新增欄位，基準`4f39a73`），以T6修正後重跑PASS，原FAIL保留於此。負控制：單元排序反轉／同卡去重／重算分類、E2E拿掉sticky寬度、dom-snapshot契約排序反轉、presenter拿掉`abilityLabels`／`fmtMoney`，全部依預期FAIL後還原（shasum一致）。reviewer：無high，medium 1（接線未測）與low 3（缺資料提示位置、本節缺漏、計畫文件過時）均已處理。另：未登錄的`scripts/test-championmaker-tj.mjs`在乾淨dev即exit 1，與本項無關。Linux CI、Preview、實機未執行；本機`test-results/`已依使用者指示清空，先前各節引用的本機證據路徑已不存在。

### 2026-11-15追加：UI-BOARD-MENU-STACK-01 選單被選項區遮住（1.16.13，本機驗證）

- [x] **UI-BOARD-MENU-STACK-01** — `DEV_MERGED / PREVIEW_CONFIRMED`（2026-11-15結案）。dev 1.16.12在手機寬度、能力配分等`#act`很高的狀態下打開選單時，「共有／開発を応援／タイトルに戻る」被`#act`蓋住無法點選（Preview `a87f94e5`於390×720以elementFromPoint確認）。原因：`#board`與`#act`同為sticky、`z-index:20`，`#act`在DOM後方而繪於上層，`#board-menu-panel`的`z-index:30`只在`#board`的堆疊內。修正：`docs/styles/base.css`的`#board`改為`z-index:21`（`#act`最大高度已扣除頁首與導覽列高度再減48px，不會伸入頁首下方）。PATCH 1.16.12→1.16.13。ゲーム規則・S・RNG・存檔不變。

驗證（macOS＋Brave 157，本機）：新增`board-menu-stacking-e2e`（Quick＋Full；390×720／320×640／1280×720於配分狀態檢查8項皆為hit target，手機寬度前置條件為至少一項中心點位於`#act`範圍內，實際點擊「タイトルに戻る」開啟確認後取消）；負控制（`z-index`改回20）於390、320各自單獨執行皆在`board-share is the hit target (covered by act)`FAIL，還原後shasum一致。Quick 97／97 PASS；使用選單的`event-fix-e2e`、`information-dialog-e2e`、`display-preferences-e2e`、`design-tokens-09-e2e`個別PASS；4主題×1280／390配分狀態截圖8組全項可點、Console 0。Full依AGENTS 6.1純顯示例外未執行；Linux CI、Preview、實機未驗證。reviewer：low 2項（前置條件強化、本條登記）已處理。PLY-01草稿的`display-preferences-e2e`／`design-tokens-09-e2e`點擊失敗即此問題，PLY-01將疊於本修正之上。

併dev與Preview：經[PR #102](https://github.com/tt-chin/yakyujinsei/pull/102)併dev（`75ab10b`，1.16.13），dev push [Quick 43718869495](https://github.com/tt-chin/yakyujinsei/actions/runs/43718869495)成功；Cloudflare部署`32ded666`，固定Preview與該部署的`base.css`、`config.js`與`75ab10b`雜湊一致；Playwright MCP（Brave 157）於`32ded666` 390×720配分狀態實測v1.16.13：8項皆為hit target（`#act`頂端y=297，共有／開発を応援／タイトルに戻る中心點位於其範圍內）、「タイトルに戻る」開啟確認後取消。使用者於對話中回覆確認Preview（2026-11-15，無書面紀錄）後結案。實機／觸控、Linux Full未執行。


### 2026-11-16：首頁明示隨機姓名操作（1.16.14，本機實作）

- [ ] **UI-RANDOM-NAME-BUTTON-01** — `IMPLEMENTED_UNVERIFIED`。使用者授權首頁姓名欄右側新增44×44px以上原生🎲按鈕，type=button、aria-label／title「名前をランダムに生成」，同列輸入填滿剩餘寬度。共用既有player-names.js的46姓／50名與generatePlayerName，不拆完整姓名、不新增清單。只有主動點擊時產生；若與目前輸入完全相同，最多抽5次，仍同名則保留，避免無限迴圈。產生後發出bubbles input／change，可手動修改。onclick置換確保重複初始化不多次綁定。不開始遊戲、不改守位／seed／顯示設定／S／生涯RNG，未輸入姓名的原開局處理不變。

局部UI互動R2，版本1.16.13→1.16.14（既有姓名功能的明示操作改善PATCH）；已同步CURRENT_SPEC／CHANGELOG／RELEASE_NOTES及生成資料，未提交／推送／部署。獨立瀏覽器context限定驗證：320／375／390／1280×4主題共16組，touch／桌面click、Tab／Enter／Space、focus-visible、同列44px、無水平溢出、精確input／change次數、手動編輯開始及遊戲顯示同名PASS；零次與四次抽名後相同最終手動姓名的完整S、選項、逐次RNG初始及3步重播相等PASS。原12組空白／半形全形空白／輸入／NFKC／長度及P／IF的讀檔、年度進行、PNG姓名檢查保留；合計29組PASS／0 FAIL，Console／404為0。單元保留原13組CareerEntry歷史對照與2300姓名組合，另驗證同名重抽上限、無自動覆寫、單次事件、disabled及重複綁定PASS。

既有design-tokens-09首頁比較的f8afd8e缺少本次按鈕，僅在該舊來源明列固定HTML／44px與gap8px參考樣式並設為與完成初始化後相同的enabled狀態；新來源結構先逐字核對，不更換baseline、不遮罩元素、不降低其餘幾何斷言。其相關矩陣與最後Quick結果於完成後補記；本輪不執行整套Full、CI或實機驗收。

原始測試調整紀錄保留：第一次測試插入點CRLF／LF辨識不符而未插入，當次實際執行原12組姓名回歸並PASS；新按鈕r2計入前次手動輸入失焦時的原生change，改為監聽前先blur，不修改產品事件；r3手機12組PASS但桌面context誤用tap而FAIL，桌面改click、手機維持tap後r4的17項PASS；最後字級沿用24px token並執行完整姓名入口r5的29項PASS。這些FAIL不改寫、不覆寫基準。證據test-results/name-button-unit-r1.log、name-button-browser-r1／r2／r3／r4及name-button-browser-final-r5/與同名log、name-button-layout-r1.log。未實機或Preview驗收，不提前勾選。

最終驗證補記：相關design-tokens-09矩陣82,560次比較、34個原selector全命中且0差異，程序exit 0。Quick初跑97項為96 PASS／1 FAIL／0 SKIP／0 BLOCKED（test-results/name-button-quick-r1/），唯一design-tokens-06.test仍固定原65個font token使用點而遇66；同時新姓名列另加1個space token。限定修正該測試：只核對並扣出明確.random-name-button的--fs-5xl及.player-name-row的--space-xs使用點，原65／179個其餘計數、已定義／使用、px間距及inline樣式斷言原封保留；非只把常數65改66或179改180。第一次套用因CRLF插入點不符而未變更，再以正規化讀取後精確套用。該入口單獨單元及統一Runner重測1 PASS／0 FAIL（name-button-tokens-unit-r2.log、name-button-quick-targeted-r2/），未重跑整套Quick，不把原96／1改寫為全套PASS。

14個修改／新增檔；原player-names.js資料／抽選演算法、CareerEntry與既有空白開局流程不變。語法／相對路徑／diff／履歷生成冪等性檢查PASS。BACKLOG83個唯一ID、60完成／23未完成，新增項維持待使用者審查。未修改Runner／CI／golden，未Full、CI、實機、commit／push／merge或部署。

提交狀態補記（2026-11-16）：使用者於本機驗證完成後授權commit／push至dev。本次14檔為1.16.14姓名按鈕、必要測試及文件，不納入test-results。推送後依既有workflow自動Quick，新來源CI／Preview待確認；前文未提交為當時歷史狀態。原Quick96／1與限定修復1 PASS保留，不提前宣稱新CI通過。未授權main反映／正式部署或額外啟動Full。

# BACKLOG — 野球人生（日文版）

本檔只管理未實作、未確認、待決策的工作及完成條件。現行行為見 [CURRENT_SPEC](CURRENT_SPEC.md)，版本變更見 [CHANGELOG](CHANGELOG.md)，玩家摘要見 [RELEASE_NOTES](RELEASE_NOTES.md)，開發與交付規則見 [AGENTS](AGENTS.md)。

## 1. 最新進度總覽

- ホーム年度履歴（2.2.0）：8年度上限廃止、閉じた年度の詳細DOMを解放、年初セーブv3に完了年度のカードと当時の年俸明細を保存。v2は読込以降の履歴を蓄積する。2 MiB上限維持。390pxのdev Previewで開始・跨年・再開・折りたたみを確認。2.2.0 Preview配信確認、[Quick #294](https://github.com/tt-chin/yakyujinsei/actions/runs/45827896512)は `808216cdf041bf18cf38fcf2b85be6d74606057a` でPASS。[Full #293](https://github.com/tt-chin/yakyujinsei/actions/runs/45826779978)の旧SHAは141 PASS／7 FAIL。5入口の後続修正は[実作計畫](tasks/NPB_MLB_SEASON_END_IMPLEMENTATION_PLAN.md) §11。PR #131（dev→main）の[Full #297](https://github.com/tt-chin/yakyujinsei/actions/runs/45838234691)は `1477317ab6ba80ff27e111cd996ae6b415122649` で149 PASS／0 FAIL。PR #131はmainへ反映済み（スクリーンショット用のPR #132 revert後、PR #133で復元。main `489430d` のtreeは `1477317` と同一）。実機受入待ち。

- 2.1.0：[Full #286](https://github.com/tt-chin/yakyujinsei/actions/runs/45549669028)的10項失敗已修正，本地相關E2E及Quick（115 PASS）通過；修正提交的Full已由[Full #297](https://github.com/tt-chin/yakyujinsei/actions/runs/45838234691)（`1477317`）涵蓋，尚待Safari實機排序確認。原失敗與修正範圍見[測試說明](scripts/TESTING.md)；PR #128入札方案與保有權年度海外報價已實作（2026-11-25，使用者授權），已合併dev（`00fc40d`）；[Full #289](https://github.com/tt-chin/yakyujinsei/actions/runs/45645665227)為143 PASS／4 FAIL（歷史生涯比對），PR #130修正於`197aef4f03be19b312d44c2421c6af2c7b6b4328`經[Tests #291](https://github.com/tt-chin/yakyujinsei/actions/runs/45778946981) Full PASS；PR #130後續收緊`contract-salary-e2e`／`kbo-renewal-e2e`的季末比對判定，`f4215c553cbe0d11d17293ad38ddc1912a946543`經[Tests #300](https://github.com/tt-chin/yakyujinsei/actions/runs/46021284417) Full 149 PASS／0 FAIL（見[實作計畫](tasks/NPB_MLB_SEASON_END_IMPLEMENTATION_PLAN.md) §11）；延長交涉年的順序由code owner決定(a)（2026-11-28），2.3.0於`feat/season-end-extension-order`實作（計畫§12），`1524687`經[Tests #311](https://github.com/tt-chin/yakyujinsei/actions/runs/46105290500) Full 150 PASS；依code owner留言補E2E後，最終SHA `36c44680d338310c5890fe50ecf8d88136e57e07` 經[Tests #312](https://github.com/tt-chin/yakyujinsei/actions/runs/46109049151) Full 150 PASS，PR #140已併dev（`f02b7cd`），待Preview確認。
- TEST-RELEASE-NOTES-LIMITS-01已結案（2026-11-28）：唯讀`tests/release-notes.test.mjs`納入Quick／Full／Audit（PR #138，dev `e0fc269`）；每版1～3條、每條80字、生成一致等9種不合法輸入於本機負向控制均exit 1／`ERR_ASSERTION`；CI已執行（[Tests #308](https://github.com/tt-chin/yakyujinsei/actions/runs/46101274962) Full、#309、#310，其後Full #312／#314亦含此入口），測試失敗即令CI失敗。未曾在CI實際注入不合法摘要。2.1.0依code owner決定合併為3條，未放寬規則。
- 2.0.0開發已告一段落，目前已交付功能的實機驗收已由使用者確認完成。未來依AGENTS第9章正常採番，不再固定2.0.0。
- 受驗提交 `875a8af62189e7ddcc2eac27afd3c80783d45210` 的 [Quick #280](https://github.com/tt-chin/yakyujinsei/actions/runs/45510842813) 與 [Full #281](https://github.com/tt-chin/yakyujinsei/actions/runs/45512251900) 均成功；Full 146 PASS、0 FAIL／SKIP／BLOCKED。此結果只對應該提交，不代表後續提交已執行Full。
- 目前有 **9項未完成工作**，列於下節。已完成功能不重列待驗收；研究、全量稽核及CI證據封存仍各自保留。本次整理不構成新實作或正式發布授權。

## 2. 未完成工作

### 2.1 規格、架構與文案稽核（3項）

- [ ] **AUD-02** — `IMPLEMENTED_UNVERIFIED`。
  - 剩餘：第五階段調查已完成，但全規格數值邊界、DOM與跨功能互動尚未完整核對；既有功能實機驗收不等於全規格稽核完成。規格與程式的4項差異（X1、07b／F01、03d、F06）已依開發端決定以文件處理（2026-11-28）。
  - 完成條件：「成本低」群組（03a／03b／03c、06d、14c）的測試另案完成並經GitHub手動Full PASS；其餘需實際執行的列記為殘餘未驗證後結案。差異先記錄，不自行改遊戲。
  - 依據：[規格與架構稽核](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)；[開發端決定](tasks/DEV_DECISIONS_2026-11-28.md) §3、§4。

- [ ] **COPY-01** — `IMPLEMENTED_UNVERIFIED`。
  - 剩餘：第二、三批的Preview確認；全量清查已移至COPY-02。COPY-001～005已完成，不重做；023／024已移除。第二批（2.2.1，2026-11-28使用者核准）已實作006～012、014、015、027（採「（能力名は潜在能力以上のため、ポイントを変換）」）、028、030～033；011／012／031採報告08:57建議，015不加「端末によって」。`fix/copy-01-batch2` `1b94de747614c194a34e62f4735d88c5d0689d53` 經[Tests #302](https://github.com/tt-chin/yakyujinsei/actions/runs/46040174220) Full 149 PASS／0 FAIL，本機Quick 117 PASS；dev Preview與390px「Nシーズン」換行尚未確認。第三批（2.3.1，code owner決定見[待決事項](tasks/CODE_OWNER_DECISIONS_2026-11-28.md) §2、§3）：029採A案，共有画像通算行改「主要4リーグ一軍通算」並只合計statsByLevel的NPB1／MLB／KBO1／CPBL1，無可確認一軍紀錄時不顯示；013改「年俸（万円）」，於`fix/copy-01-029-013`實作（PR #141），`1cf78248f159095ae54852deb4179f0a8b3b8327`經[Tests #314](https://github.com/tt-chin/yakyujinsei/actions/runs/46116069889) Full 151 PASS／0 FAIL，本機Quick 119 PASS；已併入dev（`3885d83`），第三批Preview驗收結果尚未記錄。
  - 完成條件：013須在Preview以iPhone Safari確認390px，並確認320px＋投手四欄＋大字級＋巨額年俸時標籤與數值完整顯示（無截斷、換行、重疊、橫向捲動），任一不通過則改回「年俸（万）」；029 Preview確認共有画像通算行；第二批Preview確認。以上確認後COPY-01結案，全量清查移至COPY-02。文案方向決定不等於全面實作授權。
  - 依據：[文案稽核與決定](docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md)、[已完成五項](docs/reviews/COPY_01_P1_IMPLEMENTATION_ACCEPTANCE.md)；[開發端決定](tasks/DEV_DECISIONS_2026-11-28.md) §6。

- [ ] **COPY-02** — `SCOPE_PENDING / NOT_IMPLEMENTED`（2026-11-28，自COPY-01分出）。
  - 剩餘：全量可到達日文文案、術語及畫面位置清查。盤點TSV（基準`54aa2ce`，早於第三批）扣除事件卡與人名、隊名、主資料後剩1,724行；另併入018（原「維持」判斷已失效，現行選項見`career-movement.js:253-254`）及25個未編號待審候選。020／021依賴D2獎項設計，繼續等待。
  - 完成條件：先另定範圍、分批方式與優先度並經核准，再依批實作，每批屬R2／PATCH；範圍決定不等於全面實作授權。
  - 依據：[盤點](docs/reviews/COPY_01_INVENTORY_2026-11-28.md)、[文案稽核](docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md)、[開發端決定](tasks/DEV_DECISIONS_2026-11-28.md) §6。

### 2.2 殿堂研究（2項）

- [ ] **HOF-NATURAL-SAMPLE-01** — `IMPLEMENTED_UNVERIFIED`。
  - 現況：S1～S4已完成；S2採研究計畫§8b D1～D7及已批准追加修正，S3a／S3b結果保留。四聯盟自然樣本品質及4,000有效生涯目標尚未完成。
  - 完成條件：先決定後續研究範圍，再補足四聯盟／投手與野手樣本及限制說明。S5仍未授權，不執行4,000條或其他擴大批次，不修改殿堂規則。
  - 依據：[研究計畫](tasks/HOF_NATURAL_SAMPLE_PLAN.md)、[S3b](docs/reviews/HOF_NATURAL_SAMPLE_S3B.md)、[S4](docs/reviews/HOF_NATURAL_SAMPLE_S4.md)。

- [ ] **HOF-PITCHER-BALANCE-01** — `RESEARCH_ONLY / NOT_IMPLEMENTED`。
  - 現況：SP／MR／CL角色分析S4已完成，配對樣本及角色轉換限制仍適用；尚未採用任何係數／門檻修改方案。
  - 完成條件：由使用者決定維持現制並以研究結案，或另批後續方案；不得自行套用HOF A／B／C假說係數。
  - 依據：[批准範圍](tasks/HOF_JERSEY_APPROVED_SPEC.md)、[S4分析](docs/reviews/HOF_NATURAL_SAMPLE_S4.md)。

### 2.3 已批准設計、實作待驗證（2項）

- [ ] **NPB-OFFER-WINDOW-01** — `IMPLEMENTED_UNVERIFIED`（2026-11-25，使用者授權實作，併入2.1.0）。
  - 現況：保有權年度及年資8的季末顯示KBO／CPBL報價與入札申請，留隊後才續約，年資8可取消國內FA宣言返回；本地相關E2E、固定seed比對及Quick通過，見[實作計畫](tasks/NPB_MLB_SEASON_END_IMPLEMENTATION_PLAN.md) §7、§10。
  - 完成條件：GitHub手動Full於最終提交PASS（產品提交`1477317`經[Full #297](https://github.com/tt-chin/yakyujinsei/actions/runs/45838234691) 149 PASS，已滿足；Q4反映後的新提交需重新Full）；計畫§8 Q4已由code owner決定(a)（2026-11-28），2.3.0實作見計畫§12（`1524687d44a198bafbe02d7dbea839a4cf995311`經[Tests #311](https://github.com/tt-chin/yakyujinsei/actions/runs/46105290500) Full 150 PASS；PR #140依code owner留言補E2E，最終SHA `36c4468`經[Tests #312](https://github.com/tt-chin/yakyujinsei/actions/runs/46109049151) Full 150 PASS，已併dev `f02b7cd`）；Preview確認。屬R3／MINOR。
  - 依據：[定案規格](tasks/NPB_OFFER_WINDOW_DESIGN.md)、[兩案實作計畫草案](tasks/NPB_MLB_SEASON_END_IMPLEMENTATION_PLAN.md)（Q4由code owner決定(a)；Q1、Q2、Q6已由使用者決定，Q3、Q5由開發端決定）。

- [ ] **MLB-POSTING-DESIGN-01** — `IMPLEMENTED_UNVERIFIED`（2026-11-25，使用者授權實作，併入2.1.0）。
  - 現況：NPB年資<9的赴美改為申請→同意→入札→玩家決定，成功不付70%買斷；同意率、無報價、每年一次、限制型美國契約、RNG順序已以單元測試與E2E驗證，見[實作計畫](tasks/NPB_MLB_SEASON_END_IMPLEMENTATION_PLAN.md) §7、§10。延長交涉年依code owner決定(a)改為季末選單在前、留隊後才延長（2.3.0，計畫§12）。
  - 完成條件：GitHub手動Full於最終提交PASS（產品提交`1477317`經[Full #297](https://github.com/tt-chin/yakyujinsei/actions/runs/45838234691) 149 PASS，已滿足；Q4反映後的新提交需重新Full）；計畫§8 Q4已由code owner決定(a)（2026-11-28），2.3.0實作見計畫§12，規格§2.2、§4第1點已更正（`1524687d44a198bafbe02d7dbea839a4cf995311`經[Tests #311](https://github.com/tt-chin/yakyujinsei/actions/runs/46105290500) Full 150 PASS；PR #140依code owner留言補E2E，最終SHA `36c4468`經[Tests #312](https://github.com/tt-chin/yakyujinsei/actions/runs/46109049151) Full 150 PASS，已併dev `f02b7cd`）；Preview確認。屬R3／MINOR。
  - 依據：[定案規格](tasks/MLB_POSTING_DESIGN.md)、[兩案實作計畫草案](tasks/NPB_MLB_SEASON_END_IMPLEMENTATION_PLAN.md)（Q4由code owner決定(a)；Q1、Q2、Q6已由使用者決定，Q3、Q5由開發端決定）。讀碼更正：`extensionOffer`接受或拒絕後都呼叫`crossOffers`（`career-contract.js:92-103`），與規格§2.2、§4第1點不符；延長交涉年的處理順序及規格更正列為計畫§8 Q4。

### 2.4 保留設計（1項）

- [ ] **PLY-02** — `DESIGN_DEFERRED / NOT_IMPLEMENTED`。
  - 剩餘：永久欠番設計。PLY-01背號已完成；本項只依同球團一軍年資、成績、榮譽另案討論。
  - 完成條件：先批准門檻與判定規格，再授權實作及驗證。目前不設門檻、不抽選、不加效果。
  - 依據：[批准範圍](tasks/HOF_JERSEY_APPROVED_SPEC.md)。

### 2.5 測試環境與證據保存（1項）

- [ ] **D2-CI-ARTIFACT-01** — `ARTIFACT_COVERAGE_BLOCKED`。
  - 剩餘：bounded collector未接入正式CI，原始S／RNG／Decision／Receipt的安全封存與可還原保證未完成。這是證據保存缺口，不代表Full漏測或功能驗收失敗。
  - 完成條件：先起草必須保存的原件清單（A案，使用者核准，2026-11-28；文件，不改workflow），再確認容量與敏感路徑處理，接入並完成真實CI下載／還原驗證；不可用summary／log或hash代替原件。不得僅為本項重跑Full或刪除舊證據。
  - 依據：[保存缺口](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)、[分批限制](docs/reviews/LINUX_CI_FULL_1130_STABILITY_ACCEPTANCE.md)；[開發端決定](tasks/DEV_DECISIONS_2026-11-28.md) §2。

## 3. 文件與歷史索引

- 已完成80項的ID、結案範圍、歷史PASS／FAIL、開發過程與原始量測，保留於[整理前固定Git版本](https://github.com/tt-chin/yakyujinsei/blob/b56b5c4f6188ce002ac0037608469286c8e3753d/BACKLOG.md)。不在待辦檔重複收錄已完成清單。
- 2026-11-28結案：TEST-DISPLAY-ENTER-TIMEOUT-01 由 PR #137（`3a4495d`）修正並併入dev（`158ffff`）；原因、修正與負向控制見該commit的BACKLOG條目與PR說明。
- 2026-11-28結案：REFACTOR-AUDIT-01 依[開發端決定](tasks/DEV_DECISIONS_2026-11-28.md) §5（使用者核准）以決定結案：overlay與21個舊本體已刪除（`22e33e0`、`34c9c7b`，靜態確認）；`S.*`以外的動態寫入、頂層覆寫與各市場路線callback可達性列為已接受風險，日後若再重構由該計畫自行提出證據。
- 2026-11-28結案：TEST-EVENT-SIGSEGV-01 依[開發端決定](tasks/DEV_DECISIONS_2026-11-28.md) §1（A案，使用者核准），統一runner只在darwin-arm64執行`event-integration.test`時加`--no-sparkplug`（PR #144，dev `d3ade55`）。Node 24.14.0 darwin-arm64平行32量測：不加參數1,280次中23次SIGSEGV（負向對照），加參數1,280次0次；本機Quick 119 PASS／0 FAIL；dev push的[Tests #46124389692](https://github.com/tt-chin/yakyujinsei/actions/runs/46124389692) Quick 119 PASS／0 FAIL，Linux上此入口仍以`node tests/event-integration.test.mjs`執行。V8 SIGSEGV本身未修正，只以停用Sparkplug迴避。
- 實機驗收為使用者回報，不補造裝置／OS與逐項紀錄；CI PASS只對應實際受驗SHA。
- 詳細設計及未實作定案放在`tasks/`，驗證過程放在`docs/reviews/`或固定Git證據；封存資料只供追溯，不自動成為現行規則。
- 共同開發、測試、RNG、版本與公開流程引用AGENTS，不在本檔重訂。後續工作需按各項既有授權與完成條件進行。

# BACKLOG — 野球人生（日文版）

本檔只管理未實作、未確認、待決策的工作及完成條件。現行行為見 [CURRENT_SPEC](CURRENT_SPEC.md)，版本變更見 [CHANGELOG](CHANGELOG.md)，玩家摘要見 [RELEASE_NOTES](RELEASE_NOTES.md)，開發與交付規則見 [AGENTS](AGENTS.md)。

## 1. 最新進度總覽

- 2.1.0：FA同聯盟候選、表頭雙向排序與交易文案已實作；本地Quick初跑的3項舊期待值已修正並定點重跑通過，使用者已授權提交／推送dev。尚待新提交的GitHub手動Full及新排序的Safari實機確認；比較基準、許可差異與舊存檔版本邊界見[測試說明](scripts/TESTING.md)。PR #128的入札方案仍未實作。
- 2.0.0開發已告一段落，目前已交付功能的實機驗收已由使用者確認完成。未來依AGENTS第9章正常採番，不再固定2.0.0。
- 受驗提交 `875a8af62189e7ddcc2eac27afd3c80783d45210` 的 [Quick #280](https://github.com/tt-chin/yakyujinsei/actions/runs/45510842813) 與 [Full #281](https://github.com/tt-chin/yakyujinsei/actions/runs/45512251900) 均成功；Full 146 PASS、0 FAIL／SKIP／BLOCKED。此結果只對應該提交，不代表後續提交已執行Full。
- 目前有 **12項未完成工作**，列於下節。已完成功能不重列待驗收；研究、全量稽核及CI證據封存仍各自保留。本次整理不構成新實作或正式發布授權。

## 2. 未完成工作

### 2.1 規格、架構與文案稽核（3項）

- [ ] **AUD-02** — `IMPLEMENTED_UNVERIFIED`。
  - 剩餘：第五階段調查已完成，但全規格數值邊界、DOM與跨功能互動尚未完整核對；既有功能實機驗收不等於全規格稽核完成。
  - 完成條件：處理報告中的未驗證／不一致項，補足對應證據；差異先記錄，不自行改遊戲。
  - 依據：[規格與架構稽核](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)。

- [ ] **REFACTOR-AUDIT-01** — `IMPLEMENTED_UNVERIFIED`。
  - 剩餘：主要狀態讀寫及模組地圖已有，動態scope與所有callback可達性尚未完全證明。
  - 完成條件：按核准範圍補足動態可達性證據與稽核缺口；既有分期完成不視為全項結案，也不授權新重構。
  - 依據：[稽核](docs/reviews/STAGE5_SPEC_ARCHITECTURE_AUDIT.md)、[重構路線](docs/reviews/STAGE5_REFACTOR_ROADMAP.md)、[分期計畫](tasks/GAME_JS_OOP_REFACTOR_PLAN.md)。

- [ ] **COPY-01** — `IMPLEMENTED_UNVERIFIED`。
  - 剩餘：全量可到達日文文案、術語及畫面位置待清查。COPY-001～005已完成，不重做；006～015及027～033等候選依報告處理，023／024已移除。
  - 完成條件：依已決定方向確認011／012／031語義、013版面及029一軍合計範圍，取得相應授權後修正並驗證；文案方向決定不等於全面實作授權。
  - 依據：[文案稽核與決定](docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md)、[已完成五項](docs/reviews/COPY_01_P1_IMPLEMENTATION_ACCEPTANCE.md)。

### 2.2 殿堂研究（2項）

- [ ] **HOF-NATURAL-SAMPLE-01** — `IMPLEMENTED_UNVERIFIED`。
  - 現況：S1～S4已完成；S2採研究計畫§8b D1～D7及已批准追加修正，S3a／S3b結果保留。四聯盟自然樣本品質及4,000有效生涯目標尚未完成。
  - 完成條件：先決定後續研究範圍，再補足四聯盟／投手與野手樣本及限制說明。S5仍未授權，不執行4,000條或其他擴大批次，不修改殿堂規則。
  - 依據：[研究計畫](tasks/HOF_NATURAL_SAMPLE_PLAN.md)、[S3b](docs/reviews/HOF_NATURAL_SAMPLE_S3B.md)、[S4](docs/reviews/HOF_NATURAL_SAMPLE_S4.md)。

- [ ] **HOF-PITCHER-BALANCE-01** — `RESEARCH_ONLY / NOT_IMPLEMENTED`。
  - 現況：SP／MR／CL角色分析S4已完成，配對樣本及角色轉換限制仍適用；尚未採用任何係數／門檻修改方案。
  - 完成條件：由使用者決定維持現制並以研究結案，或另批後續方案；不得自行套用HOF A／B／C假說係數。
  - 依據：[批准範圍](tasks/HOF_JERSEY_APPROVED_SPEC.md)、[S4分析](docs/reviews/HOF_NATURAL_SAMPLE_S4.md)。

### 2.3 已批准設計、尚未實作（2項）

- [ ] **NPB-OFFER-WINDOW-01** — `SPEC_APPROVED / NOT_IMPLEMENTED`。
  - 剩餘：NPB保有權空窗年度的KBO／CPBL報價，與MLB入札共同整理季末選擇及續約順序。
  - 完成條件：依定案規格提出兩案整合計畫，釐清邊界並取得授權後實作；驗證先去留再續約、到期／未到期買斷、國內FA銜接、報價不重抽、固定seed許可差異與GitHub手動Full。屬R3／MINOR，目前未授權實作。
  - 依據：[定案規格](tasks/NPB_OFFER_WINDOW_DESIGN.md)。

- [ ] **MLB-POSTING-DESIGN-01** — `SPEC_APPROVED / NOT_IMPLEMENTED`。
  - 剩餘：未取得海外FA前的赴美申請、母球團同意、報價與玩家選擇流程。
  - 完成條件：與上一案共同提出整合計畫，釐清全休／延長等邊界並取得授權後實作；驗證資格、同意率、無報價、每年一次、成功不付70%買斷、原契約、限制型美國契約及RNG順序。屬R3／MINOR，目前未授權實作。
  - 依據：[定案規格](tasks/MLB_POSTING_DESIGN.md)。

### 2.4 保留設計（1項）

- [ ] **PLY-02** — `DESIGN_DEFERRED / NOT_IMPLEMENTED`。
  - 剩餘：永久欠番設計。PLY-01背號已完成；本項只依同球團一軍年資、成績、榮譽另案討論。
  - 完成條件：先批准門檻與判定規格，再授權實作及驗證。目前不設門檻、不抽選、不加效果。
  - 依據：[批准範圍](tasks/HOF_JERSEY_APPROVED_SPEC.md)。

### 2.5 測試環境與證據保存（4項）

- [ ] **TEST-EVENT-SIGSEGV-01** — `LOCAL_ARM64_ONLY / 未修正`。
  - 剩餘：macOS arm64的`event-integration.test`間歇V8 SIGSEGV，根因未確認；原量測與crash線索見整理前紀錄。
  - 完成條件：升級Node後完成arm64平行量測且不再出現，或批准調整入口執行參數後驗證。未批准修改入口；發生時比對最新crash report並保留FAIL，不用重跑PASS覆寫。

- [ ] **TEST-DISPLAY-ENTER-TIMEOUT-01** — `LOCAL_LOAD_ONLY / 未修正`。
  - 剩餘：本機4組平行Full負載下，`display-preferences-e2e`按Enter後等待內容變化逾時；單獨重測通過不足以確診。
  - 完成條件：釐清負載延遲或按鍵未處理，再決定修正；不放寬斷言。原位置、來源及失敗紀錄見整理前紀錄。

- [ ] **TEST-RELEASE-NOTES-LIMITS-01** — `CONTENT_USER_ACCEPTED / CI_GATE_NOT_IMPLEMENTED`。
  - 剩餘：將`scripts/test-release-notes.mjs`接入正式test manifest／Quick；摘要內容已驗收，不再列文案待驗。
  - 完成條件：另案確認接入並實作，驗證1～3條／每條80字、生成一致性及不合法摘要會令CI失敗；不放寬既有規則。
  - 依據：[現行摘要規格](CURRENT_SPEC.md)、[測試入口說明](scripts/TESTING.md)。

- [ ] **D2-CI-ARTIFACT-01** — `ARTIFACT_COVERAGE_BLOCKED`。
  - 剩餘：bounded collector未接入正式CI，原始S／RNG／Decision／Receipt的安全封存與可還原保證未完成。這是證據保存缺口，不代表Full漏測或功能驗收失敗。
  - 完成條件：確認必要原件、容量與敏感路徑處理，接入並完成真實CI下載／還原驗證；不可用summary／log或hash代替原件。不得僅為本項重跑Full或刪除舊證據。
  - 依據：[保存缺口](docs/reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)、[分批限制](docs/reviews/LINUX_CI_FULL_1130_STABILITY_ACCEPTANCE.md)。

## 3. 文件與歷史索引

- 已完成80項的ID、結案範圍、歷史PASS／FAIL、開發過程與原始量測，保留於[整理前固定Git版本](https://github.com/tt-chin/yakyujinsei/blob/b56b5c4f6188ce002ac0037608469286c8e3753d/BACKLOG.md)。不在待辦檔重複收錄已完成清單。
- 實機驗收為使用者回報，不補造裝置／OS與逐項紀錄；CI PASS只對應實際受驗SHA。
- 詳細設計及未實作定案放在`tasks/`，驗證過程放在`docs/reviews/`或固定Git證據；封存資料只供追溯，不自動成為現行規則。
- 共同開發、測試、RNG、版本與公開流程引用AGENTS，不在本檔重訂。後續工作需按各項既有授權與完成條件進行。

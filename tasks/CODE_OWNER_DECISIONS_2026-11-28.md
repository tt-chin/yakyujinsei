# 待決事項（2026-11-28）

本檔整理四項需由 code owner 決定的事項：現況證據、選項、各選項影響與開發端建議。**本檔不構成實作授權**；決定後依 AGENTS 第6章分類、另開分支實作，並同步更新 BACKLOG、CURRENT_SPEC 與相關設計文件。

- 調查基準：`origin/dev` `a4fb1b8e49f673c7159a437904e2154a2b17b0f4`（VERSION 2.2.0）。行號以此為準。
- PR #134（COPY-01 第二批，2.2.1）尚未合併。第1～3項會改產品、版本接在 2.2.1 之後，建議於 #134 合併後再實作；第4項只動測試基盤，可直接自 dev 開分支。

| # | 事項 | 選項 | 開發端建議 |
|---|---|---|---|
| 1 | 延長交涉年的處理順序（實作計畫 §8 Q4） | (a)／(b)／(c) | (a) |
| 2 | COPY-01 029「主要4リーグ一軍通算」 | A／B／C | A |
| 3 | COPY-01 013「年俸（万円）」 | 採用／維持 | 採用 |
| 4 | TEST-RELEASE-NOTES-LIMITS-01 接入方式 | A／B／C | A |

---

## 1. 延長交涉年的處理順序（§8 Q4）

依據：[實作計畫](NPB_MLB_SEASON_END_IMPLEMENTATION_PLAN.md) §8 Q4（:161）、D7（:83 起）、[MLB_POSTING_DESIGN](MLB_POSTING_DESIGN.md) §2.2（:33）、§4 第1點（:112）。

### 現況

1. 季末 `movement()` 在 `S.ct.remainingYears===1`、一軍、`S.faElig`、`lastD>=1` 且 `chance(45)` 時進入延長交涉（`docs/src/engine/career-movement.js:389-390`），之後直接 return。
2. `extensionOffer`（`docs/src/engine/career-contract.js:92-103`）：**接受**延長時先把延長年數併入 `S.ct`、記錄年俸決定，再呼叫 `crossOffers(o)`（:99）；**拒絕**時也呼叫 `crossOffers(o)`（:102）。
3. NPB一軍的 `crossOffers` 顯示季末選單（`career-movement.js:186` `npbSeasonEndMenu`）：KBO／CPBL 報價；NPB 年資 <9 時顯示入札申請（`postingOption`，:170），≥9 時顯示 MLB 報價；以及「現在の球団に残留」。
4. 選單產生時依序抽 KBO、CPBL、入札（或 MLB）球團各一次 `R()`；點選入札時再抽同意 `chance`、`chance(90)`（有無報價，:180）與合約年數 `ri(1,3)`。
5. 接受延長後轉往韓台，`buyoutRemaining` 以併入延長後的 `S.ct` 計算 70% 買斷，含延長年數（計畫 D7，2026-11-25 以實際執行確認）。
6. 程式註解 `career-movement.js:168`：「Pending (plan §8 Q4)」。

### 與既有原則的衝突

依計畫 D7：在現行順序下，玩家可以先簽延長，再入札成功赴美，於是剛簽、尚未開始的延長合約就被取代。這與下列兩項原則衝突：

- #126 P6：入札結果確定前不完成續約，避免先簽續約再赴美。
- #127 Q1：不可先續約，再立即買斷剛建立、尚未開始的合約。

### 選項

| 選項 | 內容 | 遊戲結果 | 分類／驗證 |
|---|---|---|---|
| (a) | 先顯示入札與韓台報價；選「残留」後才進行延長交涉 | 延長年的抽籤順序改變，同 seed 生涯在到達延長年時分歧 | R3／MINOR：固定 seed 比對＋許容差分事前明示＋Quick＋GitHub Full |
| (b) | 接受延長後，當年不顯示入札（拒絕延長則照一般年度） | 接受延長的年度少一次入札球團抽籤；韓台報價與含延長年數的 70% 買斷仍存在 | R3／MINOR：同上 |
| (c) | 維持現行（目前暫用此案） | 無變化 | 不改程式；需在規格中明載接受上述衝突 |

附帶問題「接受延長後轉韓台，70% 買斷是否含延長年數」：在 (a) 下不會發生（離隊時尚未簽延長）；選 (b) 或 (c) 須另行決定。

**開發端建議：(a)**。它同時滿足 P6 與 Q1，也與 NPB-OFFER-WINDOW-01「留隊後才續約」一致，附帶問題隨之消失。

### 不論選哪一案都要做

- 更正 `tasks/MLB_POSTING_DESIGN.md` §2.2（:33）與 §4 第1點（:112）「延長合約 offer 那年不走到 `crossOffers`」的讀碼錯誤。
- 更新 CURRENT_SPEC 第33行「処理順序は未決」。
- 會碰到這個順序的測試：`tests/contract-salary-e2e.mjs`（延長後點「現在の球団に残留」）、`tests/npb-return-e2e.mjs`、`tests/american-service.test.mjs`。

---

## 2. COPY-01 029「主要4リーグ一軍通算」

依據：[文案稽核](../docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md) COPY-029（:420）、決定表（:488）。

### 現況

- 顯示位置：只有分享圖 PNG 的里程碑。程式在 `docs/src/ui/share-image.js:133-143`，現行標籤為「リーグ横断通算：」（:139、:141）。
- 合計方式：把 `S.stats` 的 `CPBL`／`KBO`／`NPB`／`MLB` 四個 bucket 相加，沒有階級篩選。
- bucket 涵蓋的階級（`docs/src/engine/league-catalog.js` 的 `statBucket`）：
  - NPB = NPB一軍＋NPB二軍＋NPB育成
  - KBO = KBO一軍＋KBOフューチャース
  - CPBL = 台湾一軍＋二軍
  - MLB = MLB 而已
  - MiLB、獨立聯盟、社會人在其他 bucket，不計入。
- **結論：現行合計含二軍、育成、フューチャース。** 決定表的範圍是「各聯盟一軍，排除二軍、育成、MiLB、獨立聯盟、社會人」，因此不能只改名，必須改資料來源。
- 可參考的既有實作：
  - `S.statsByLevel` 分階級累積，與 `S.stats` 使用同一份 `st`（CURRENT_SPEC:359）。
  - `docs/src/engine/hof-evaluation-policy.js:5` 已有四聯盟一軍對應 `{NPB:'NPB1',MLB:'MLB',KBO:'KBO1',CPBL:'CPBL1'}`。
  - CURRENT_SPEC:916 已規定舊統計的處理：階級不明或數值缺失時，不推測，視為「一軍成績の記録なし」。

### 選項

| 選項 | 內容 | 分類／驗證 |
|---|---|---|
| A | 依決定表：改讀 `statsByLevel` 的 NPB1／KBO1／CPBL1／MLB，標籤改為「主要4リーグ一軍通算」，無一軍紀錄時不顯示；舊存檔比照 CURRENT_SPEC:916 不推測 | R2（純顯示、唯讀合算；不改 `S.stats`、獎項、年俸、殿堂）／PATCH。需另寫細部計畫：舊存檔 `statsByLevel` 缺失的處理、各階級排除、跨聯盟合計的測試 |
| B | 維持現行合計（含二軍等），只把標籤改成不會誤導的名稱（例：「NPB・MLB・KBO・CPBL通算」，二軍也計入） | R2 純文案／PATCH。偏離決定表的範圍，須另行核准措辭 |
| C | 維持現狀「リーグ横断通算」 | 不改，從 COPY-01 剩餘清單移除或保留為 NEEDS_REVIEW |

**開發端建議：A**。這是決定表已核准的方向，且有 CURRENT_SPEC:916 的舊統計先例可循。未調查：1.16.0 之前的存檔 `statsByLevel` 的實際完整度，列入 A 案細部計畫。

---

## 3. COPY-01 013「年俸（万円）」

依據：[文案稽核](../docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md) COPY-013（:179）、決定表（:482）。

決定表的採用條件：在 320／375／390／430px、各字級與密度下，標籤不截斷、不換行、不擠壓鄰近資訊，巨大年俸不溢出，就可採用；否則維持「年俸（万）」。

### 試排（2026-11-28，本機 Brave，scratch，未改檔）

- **方法**：開始生涯後，在頁面上把看板標籤改成新舊兩種文字，同時注入年俸數值，量測各項指標。看板只在寬度 ≤1099px 或高度 <700px 時顯示。
- **條件**：4 種寬度 × 投手／野手（投手為4欄）× 4 種主題 × 3 種字級 × 2 種密度 × 年俸 `999,999`／`1,000,000`／`9,999,999`。新舊標籤各 576 種組合；Google Fonts 載入與擋掉各跑一次。
- **量測項目**：
  - 標籤：是否超出格子內緣、是否換行
  - 數值：是否超出格子
  - 版面：格子之間是否重疊、頁面是否出現橫向捲動
- **結果**：新舊標籤在兩種字型下，以上各項全部 0 件。

| 寬度／守位 | 新標籤左右最小餘白 | 舊標籤 |
|---|---|---|
| 320px／投手（大字級） | 4.2px（標籤 69px／內寬 77.4px） | 10px |
| 320px／野手 | 9.8px | — |
| 375px／投手 | 12.5px | — |
| 390px／投手 | 14.7px | — |
| 430px／投手 | 20.7px | — |

- 標籤是全形字，寬度固定為 6em，與字型無關，因此兩次量測相同。年俸數值的寬度在兩次量測中確實不同，表示字型切換有生效。
- **限制**：本機 Brave 的結果，不等於 CI 的 Linux Chromium 或 Safari 實機。量測 script 含環境絕對路徑，依 AGENTS §6.2 不提交。實作後須在 Preview 確認 390px。

### 選項

| 選項 | 內容 | 分類 |
|---|---|---|
| 採用 | `docs/index.html:91` 與 `docs/src/ui/game-view.js:90` 改為「年俸（万円）」；aria-label 不變；更新測試期待值 `tests/npb-return-ui.test.mjs:40`、`tests/support/ui-shell-comparison.mjs:21` 及 `SHELL_BOARD_2000`／`SHELL_BOARD_11615`（:51-52） | R2 純顯示例外／PATCH |
| 維持 | 保留「年俸（万）」，結束 013 | 不改 |

稽核影響範圍列出的「PNG」，查證後不受影響：`share-image.js` 目前沒有「年俸」字串，稽核所引的 `game.js:2862` 是舊行號。

**開發端建議：採用**。試排已符合決定表條件。

---

## 4. TEST-RELEASE-NOTES-LIMITS-01 接入方式

依據：BACKLOG 該項；`scripts/test-release-notes.mjs`、`scripts/test-manifest.mjs`、`scripts/ci-full-batches.test.mjs`。

### 現況

`scripts/test-release-notes.mjs` 檢查的內容：

- 版本與日期和 CHANGELOG 一致
- 每版 1～3 條，每條最多 80 字（以 code point 計）
- 禁用詞
- 第一筆為現行 `VERSION`
- 原始檔和產生出的 `docs/src/data/release-notes.js` 一致

但現有 script 有三個問題，無法直接接入：

- 執行時會跑 `update-release-notes.mjs` 兩次，**改寫** `release-notes.js`（:51-57）。
- :36-50 是一次性守衛，拿 3 個檔案和 `git show HEAD:` 比對；之後正當修改這些檔案時就會失敗，不適合作為常設 CI 條件。
- 目前沒有任何入口執行它。manifest 只掃描 `tests/`，`syntax` 是唯一寫死在 `scripts/test.mjs:14` 的入口。

連動：`scripts/ci-full-batches.test.mjs:49` 斷言 Full 入口數為 106（由 linux-smoke 執行）。新增 Full 入口時須改為 107。CI workflow 依 manifest 自動分配，不需修改。

### 選項

| 選項 | 內容 | 影響 |
|---|---|---|
| A | 新增 `tests/release-notes.test.mjs`，只放常設規則（上列五項＋標題格式），不寫入任何檔案；現有 script 保留不動 | 自動進 Quick／Full／audit；106→107；`scripts/TESTING.md` 補一行 |
| B | 比照 `syntax`，在 `scripts/test.mjs` 寫死一個入口執行現有 script | 不進 `fullIds()`，CI Full 不會執行；仍需先去掉寫檔與 HEAD 守衛 |
| C | 改寫現有 script（移除寫檔與 HEAD 守衛），移到 `tests/` 註冊 | 與 A 相同，但失去一次性守衛的歷史紀錄 |

**開發端建議：A**。

- 驗證：
  - 4 種故意出錯的情況（4 條、81 字、不同步、標題格式錯誤）都要確認 exit 非 0 且是 `ERR_ASSERTION`；
  - 本機跑 Quick 和 `ci-full-batches.test`；
  - Full 的入口數和分批會變，需在 GitHub 手動跑 Full。
- 屬 R2，不升版本（AGENTS §9.3）。

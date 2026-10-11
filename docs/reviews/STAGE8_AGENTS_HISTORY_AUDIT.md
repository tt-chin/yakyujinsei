# 第八階段：AGENTS歷史指示稽核（AUD-05）

## 1. 基準、範圍與結論

2026-10-12（JST），dev／origin/dev基準 `a5ed616418e1eb3611c6f714b5f2cf75161ba550`，VERSION1.11.5，開始工作樹乾淨。main保持 `e886e84ca08c6c185406cac9d6f3c4376277061a`（1.11.4）。

**AUD-05：PASS（歷史指示盤點與衝突分類）**。現行[AGENTS.md](../../AGENTS.md)唯一執行基準，最後修改來源 `77507fe31aaebcd4524c440d06765bbd13f61f9a`。未修改AGENTS，不恢復歷史指令，不修改版本、遊戲或發布。

9份封存AGENTS＋7個Git根AGENTS版本＝**16筆來源**（15筆歷史、1筆現行）。以UTF-8讀取、CRLF轉LF後比較SHA256：**8組不同內容**（7歷史＋1現行），不是16份不同指示。封存來源commit為 `803e81e6424d463f5191e90017dbc69157eea1da`，ZIP原發布commit不是所有副本都可確定。

比較14個獨立政策群組：**4組若恢復會衝突、4組過時指示／缺口、6組核心限制一致**。這是群組數，不按重複副本倍增；沒有宣稱現行AGENTS存在4個內部衝突。

## 2. Git版本台帳

`git log --all --format=%H -- AGENTS.md`與`git show <SHA>:AGENTS.md`確認7個根文件版本：

| 根文件commit | 內容演進 | 與封存的關係 |
|---|---|---|
| 0d0796d43b59782086f2a37549c90e1a6896572b | JP3、RNG_VERSION/RULES_VERSION、root index與docs/tasks | imported/history/AGENTS.snapshot.md正規化內容相同 |
| 4c44cc24a1a89507266aff4e76f2bec3d8bfb53b | index移docs、task移tasks，仍JP3識別 | 沒有同內容封存副本；Git固定來源保留 |
| efc60702e5b0c497d069f4c3e9c3d038d4e03e63 | 固定VERSION1.0.0 | imported/history/AGENTS(1).md相同 |
| 157f9a2d935092a3475cfa71c13b4001977b69e2 | semver／VERSION_HISTORY規則 | AGENTS(2).md與AGENTS_latest.md相同（218行）；不能由latest檔名認定現行 |
| 4ac4e274a62f49cecc92850e20fe68dc68a178ae | 簡化規則、dev→Preview→明確批准main | AGENTS(6).md與local/AGENTS.snapshot.md相同（147行） |
| 803e81e6424d463f5191e90017dbc69157eea1da | 正本體系、CHANGELOG唯一正式履歷、archive無執行權 | 目前§11體系來源；沒有把archive指令重新生效 |
| 77507fe31aaebcd4524c440d06765bbd13f61f9a | §6.1統一Runner／baseline／不假PASS規則 | 現行167行版本 |

封存9筆明細（相對`docs/archive/`）：

- `imported/history/AGENTS.snapshot.md`：JP3，LF hash `af07356d4f7265eab48810bbaac1a58995a0e9e425d857265d93ef656739e608`。
- `imported/history/AGENTS(1).md`：1.0.0，LF hash `5fed850e03557c42aa83b2eb1f0d3b91634714615c0a67c30e12de5b367120a2`。
- `imported/history/AGENTS(2).md`、`AGENTS_latest.md`：同內容，LF hash `3568f8feab723af909549f27a3db3d80e51bbb22563342d00270db817990ebf5`。
- `imported/history/AGENTS(3).md`、`AGENTS(4).md`、`AGENTS(5).md`：同內容312行，增加詳細§10分支運用，LF hash `0ca8edf6bc32fef35c5b4cfae90539a6c9d0ad238d0c69a2ac518ae073f5e42e`；根Git7版本中沒有完全相同文字的版本，不能捏造其根來源commit。
- `imported/history/AGENTS(6).md`、`local/AGENTS.snapshot.md`：LF hash `9948c4c4464a625f3f0e242990506d5a325f0f87d15aa97579c9090f2eaf6a92`；原始LF/CRLF位元組不同，內容正規化相同。

全部保留封存，沒有因重複而刪除原文。根Git版本與封存同內容只證明文字一致，不證明ZIP作者、首次發布日期或批准歷程完全相同。

## 3. 指示差異與處置（14組）

### 3.1 恢復舊指示會衝突（4）

| 組 | 舊指示與來源 | 現行規則 | 建議處理 |
|---|---|---|---|
| C1 識別版本 | 0d0796／4c44cc／JP3 snapshot §2要求RNG_VERSION=1、RULES_VERSION=JP3 | §2/3/9：保持RNG算法與seed-only、正式semver；不得復活舊引擎／rv/rules | 舊識別是當年相容限制，不在新版本追加JP3 dual engine。保留真正RNG順序限制 |
| C2 固定產品版號 | efc607／AGENTS(1) §2要求VERSION='1.0.0' | §9現行版本依變更分PATCH/MINOR/MAJOR；本輪文件不升版 | 不以歷史固定值把1.11.5降回1.0.0，也不按舊任務指定目標版號直接升版 |
| C3 正式履歷檔 | 157f9／AGENTS(2–5)/latest／4ac4／AGENTS(6) §9將VERSION_HISTORY.md作正式更新履歷，部分要求缺檔停工 | §9.1/9.4/11：CHANGELOG唯一正式履歷，產品變更才與版本同步 | VERSION_HISTORY留archive，不重新建立根檔、不把已刪歷史資料不足當現行缺檔錯誤 |
| C4 設計權威 | 舊§1先讀詳細設計；舊Schedule／Master宣告詳細設計最高 | §1/8/11：AGENTS、CURRENT_SPEC、BACKLOG、CHANGELOG及最新指定task；archive僅歷史 | 「舊文件讀取清單」本身不等於授權，但若把詳細設計當現行正本会衝突；只提出來源與差異，不移回舊薪資／殿堂政策 |

### 3.2 過時路徑、手順與缺口（4）

| 組 | 舊來源 | 目前及風險 | 處理 |
|---|---|---|---|
| O1 路徑 | JP3 snapshot §1：root index.html、docs/tasks | docs/index.html、tasks；錯讀旧快照可能改非配信入口 | 看現行相對路徑與import；不移回root舊HTML |
| O2 測試入口 | 77507前各版只有一般語法／seed／PC手機要求 | 現行§6.1 quick/full/audit、完整SHA、FAIL/BLOCKED不假PASS、4000生涯要明示 | 舊版沒Runner不代表免測；用現行Runner，外部PW位置由參數／環境提供 |
| O3 分支缺口 | 早期版本無獨立§10，部分歷史task明寫main修改/push | 現行§10明訂dev、Preview、使用者批准後main、現有正式同步 | **沒写dev不能推論允許main**；歷史HOF/fix task直接main文字已過時。本輪只dev，無本番權限 |
| O4 main同步手順 | AGENTS(3–5) §10.5：「dev先跟隨main」詳細手順 | 現行§10.1確認main，必要時反映；§7保留使用者修改、不得reset | 不機械地在每次文件稽核merge/reset，不覆蓋dirty worktree；本輪main沒有新差異需反映 |

### 3.3 一致且仍有效（6）

| 組 | 歷史／現行共通內容 | 現行基準與證據 |
|---|---|---|
| M1 Seed分享 | 只seed、不固定域、不rv/rules、不UNSUPPORTED_REPLAY_VERSION或雙引擎 | §3；CURRENT§2/13/16，Q replay/event/share相關 |
| M2 遊戲／S／RNG限制 | 未指定不改能力、事件順序、年俸、契約、退休、殿堂，不任意再設計S | §2/5/6；本輪game tree不變，H第七階段正常S/RNG比較 |
| M3 靜態構成 | UTF-8、相對路徑、無未批准npm／framework／server、公開repo不可作通常開發先 | §5/10；模組化與語法Quick PASS；PW的CI批准不等於新增遊戲npm |
| M4 安全 | 不git reset --hard／無斷刪除／覆蓋使用者修改，避免秘密／個人絶對路徑 | §7；開始clean、僅3個文件diff；保留archive及LEGACY |
| M5 semver意義 | 成熟舊版§9已有PATCH/MINOR/MAJOR與文書／工具免升版 | §9；1.11.5保持；不把文書audit寫進遊戲CHANGELOG |
| M6 批准及文案 | 最新使用者範圍优先、指定批准前不改、自然日本語与承認固有表現保持 | §1/4/8/11；舊數值只調查，殿堂、OVR、3個trait保留項未擅自實作 |

四個C組及四個O組都是歷史比較結果，不是需要「修正現行AGENTS」的Bug。現行AGENTS沒有新增例外來绕過禁止事項。

## 4. 契約／薪資／殿堂與已廢止功能

AGENTS是權限與相容性規則，不是跨版本薪資表。歷史AGENTS沒有提供可覆蓋CURRENT的salary公式／HOF系數；具体政策由當時task與当前核准正本決定。本輪用[歷史規格報告](STAGE8_HISTORICAL_SPEC_AUDIT.md)分開記錄：

- 固定合約保障、實付累計、RNG不變限制仍有效；舊市場倍率及育成契約金表不恢復。
- 舊「只算一軍殿堂」不能用AGENTS相容性名義强行採納，既有HOF-BUCKET等待決。
- career save/load、舊引擎、rv/rules、四主導航、+5/MAX等已廢止／非採用，不因參考資料提案而啟用。
- display preferences的localStorage不是生涯存檔；不能把「不新增存檔」誤擴成刪除核准的顯示設定。
- 舊「main直接push」task不是本輪使用者發布批准；现行§10标准流程保持。

## 5. 驗收與限制

與AUD-04共用一次Quick，沒有重複執行以膨脹測試數：

```text
node scripts/test.mjs quick --baseline=a5ed616418e1eb3611c6f714b5f2cf75161ba550 --playwright=<外部模組> --output=test-results/stage8-quick
```

**45 PASS／0 FAIL／0 SKIP／0 BLOCKED，318.730秒，exit0**。環境Windows、Node24.15.0、Playwright1.62.1、Chrome155.0.8059.39；逐入口結果及hash在ignored `test-results/stage8-quick/summary.json`。不要求也未执行無理由的Linux Full。

檢查本輪新文件／BACKLOG／CURRENT的本地link；正式checkbox ID44個唯一、18完成26未完成；AGENTS、CURRENT、CHANGELOG、config、game/test/workflow、archive的受保護diff應為空。CI／Preview實際提交後結果及SHA由最终回報提供；本輪不改CI觸發條件，Stage8報告仍觸發Quick。

限制：ZIP原作者全部原始commit不能追溯；只對可取回的9封存副本與7根版本作比較，不能保證曾存在但未提交／未封存的私人規則。沒有外部網站政策查證，也不將歷史程式碼可達性／所有文案已驗收當作AUD-05完成條件。

## 6. 文件與後續

本輪只新增兩個Stage8報告、更新BACKLOG。AUD-05按14組分類與來源比對結案；AUD-04為調查結案，原文詳細條款未驗的工作獨立保留HIST-SPEC-CLAUSE-01。AGENTS不需要變更；歷史文件不刪除，不恢復。

建議下一批：使用者審查後，批准歷史細項台帳或CURRENT來源說明補充；AUD-02／REFACTOR-AUDIT-01的動態證據與既有設計決策繼續待辦。**本階段完成後停止，不自動開始第九階段。**

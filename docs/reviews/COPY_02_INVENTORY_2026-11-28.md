# COPY-02 第 0 批：日文文案重新盤點（2026-11-28）

依 [COPY-02 範圍提案](../../tasks/COPY_02_SCOPE_PROPOSAL.md) §8-2（code owner 決定，PR #147 留言）執行的第 0 批。**只做盤點，不改文案、遊戲、測試或規格；第 1 批對象仍需確認（§6）。**

- 掃描基準：`dev` `a56ea9cc4c5bda64da23a7f2b0ce4f58de8b4a5a`（PR #147 合併後）。行號以此為準。
- 範圍：`docs/index.html` 與 `docs/src/**` 的 `.js`，排除 `release-notes.js`（與 [COPY-01 盤點](COPY_01_INVENTORY_2026-11-28.md) 相同）。共 118 檔。
- 明細：[COPY_02_INVENTORY_2026-11-28.tsv](COPY_02_INVENTORY_2026-11-28.tsv)（欄位：file、line、category、status、usage、usage_reason、flags、covered_by_fragment、text）。
- 腳本：`tools/copy-inventory/scan.mjs`（本批起納入版控）。不是 Runner 入口，不安裝套件；acorn 以 `--acorn=<acorn.mjs>` 指定本機既有檔案。重跑：`node tools/copy-inventory/scan.mjs --acorn=<acorn.mjs> --output=<新目錄> [--root=<乾淨的 checkout>] [--audit=<稽核 md>]`。`--root` 的 `docs/` 有未提交變更、`--output` 已存在或位於 `--root` 內（含符號連結與大小寫差異）、稽核檔不存在時都會中止。掃描對象與稽核檔（位於 `--root` 內時，含預設的 `docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md`）的內容都必須與 HEAD 相同：以 `git hash-object` 與 HEAD 的 blob 比對，因此 skip-worktree／assume-unchanged 也會被偵測；路徑比較使用磁碟上的實際大小寫。`--root` 以外的稽核檔視為額外輸入：`stats.json` 記錄 `external: true`、路徑與 SHA-256（`stats.json` 為本機紀錄，不提交），TSV 第一行另加 `# external audit … sha256=…` 註解。本次使用的稽核檔為 `a56ea9c` 的預設檔，SHA-256 `eacc6f27bc905957b00905829571ce3c6b5c2dc25f16c9b5696228ba1ebcfc62`。
- TSV 不使用引號；欄位內的 `\`、tab、CR、LF 寫成 `\\`、`\t`、`\r`、`\n`。以 CSV 工具讀取時請關閉引號處理（例如 Python `csv.QUOTE_NONE`）。

## 1. 方法

- JS：以 acorn AST 抽出含假名／漢字的字串字面值、樣板字面值與 regex 字面值。樣板保留原始碼（含 `${expr}`）；`${expr}` 內的字串也各自列為一筆。`docs/index.html` 抽出文字節點與屬性值（排除 script／style／註解，解碼常用實體）。
- status：`HIDDEN`＝事件卡 `sourceName`（不顯示）；`COVERED`＝樣板的任一靜態片段（或字面值本身）為 4 字以上且出現在 [文案稽核](COPY_01_JAPANESE_TEXT_AUDIT.md)；其餘 `NOT_COVERED`。與 COPY-01 相同，是文字片段比對，不是 file:line 對應。
- category：最近的 AST 文脈（`prop:<key>`、`call:<函式>`、`var:`、`assign:`、`return`、`html:text`、`html:attr:<名>`）。**不沿用** COPY-01 的類別名稱（舊類別由舊腳本判定，無法重現）。
- flags：非日文用字、半形或不對稱括號、「あなた」、敬體句末。皆為審閱提示。
- **usage（本批新增，code owner 要求分開判定用字串）**：
  - `JUDGMENT`：字面值（含無 `${}` 的樣板）本身被比較或當作鍵：`===`／`!==`、`in`、`switch case`、物件／class 鍵、計算成員鍵、`.has()`／`.get()`／`.set()`／`.add()`／`.hasOwnProperty()`、`Object.hasOwn()`／`Reflect.has()` 的鍵、`.includes()`／`.indexOf()` 的參數或被呼叫的陣列成員、`new Set` 成員、`new Map`／`Object.fromEntries` 的鍵、regex 字面值與 `new RegExp` 的 pattern。
  - 第二輪再標記：(1) 全文與上述任一鍵或比較值**相同**（含 `{優勝:7}`、`obj.優勝` 這類日文 identifier 鍵）；(2) **包含**以 `.includes()`／`.startsWith()` 等做子字串檢查的 2 字以上文字；(3) 被上述任一 regex 比對到。理由欄記第一個位置。改這些字會改變判定，不列入批次改字。
  - `COMPAT`：`award-identity-policy.js` 等保存舊名或舊檔相容的模組。不列入批次改字。
  - `UNKNOWN`：其餘位於 `*-policy.js`／honors 的字串。需逐一確認 consumer 後才可列入。
  - `DISPLAY`：以上皆非。`docs/index.html` 中 `title`／`alt`／`placeholder`／`aria-*`／`content`／`label` 以外的屬性（及 `on*` 處理器）標為 `UNKNOWN`；目前含日文的屬性都屬可見屬性。
  - 這是 AST 位置的啟發判定：經變數、表格或函式間接比較的字串（例如存入 S 後才比對的 honors 文字）不一定能偵測，`DISPLAY` 不等於已證明可安全改字；列入批次前仍需確認 consumer。反之，regex 與子字串規則不看比對對象的來源（例：`trait-result-card.js:28` 的 `/次回/` 只用於特性結果卡，卻也標記含「次回」的事件卡文字），可能多標。

## 2. 方法驗證

- **確定性**：同一 checkout 連跑兩次，TSV 與 stats.json 逐位元組一致。
- **安全檢查的負向控制**：`--output` 位於 root 內、經 `/tmp` 符號連結或大小寫不同的路徑指向 root 內、名稱以 `..` 開頭的 root 內目錄、已存在的 `--output`、不存在的稽核檔、root 的 `docs/` 有未提交變更，7 種皆以 exit 1 中止且未留下檔案。另加 6 種負向控制（PR #148 code owner 指摘後追加）：預設稽核檔有未提交變更、以大小寫不同的路徑指定同一份有變更的稽核檔、fixture 上只改未提交的稽核檔使某筆可由 NOT_COVERED 變 COVERED、以 `--audit` 指定 root 內未追蹤的檔案、稽核檔設為 skip-worktree 後修改（`git status` 無輸出）、`docs/src` 檔案設為 skip-worktree 後修改，皆以 exit 1 中止；指定 root 外的稽核檔則正常完成並記錄為外部輸入。修正後重跑，TSV 與修正前逐位元組一致。
- **判定規則的 fixture**：以暫存 repo 逐一放入 `new Map` 鍵、`Object.fromEntries` 鍵、日文 identifier 鍵、陣列 `.includes()` 成員、樣板 `===`、`.has()`、子字串 `.includes()`（含 1 字）、regex 的案例，各自與對應的顯示字串皆判為 JUDGMENT；負向控制 `/[ぁ-ん]/` 這類只有字元類別的 regex 不作為比對種子，一般顯示字串與 `${n}優勝${m}` 維持 DISPLAY。
- **與 COPY-01 對照**：以本腳本重掃 COPY-01 的基準 `54aa2ce`，舊 TSV 3,310 筆中有 3,261 筆（98.5%）的 file、line、text（前 80 字、空白正規化）完全一致（不計本腳本新增的 regex 列）。其餘差異來自舊腳本的處理，不影響判讀：
  - 舊腳本合併同檔重複字串（`league-catalog.js` 的隊名、`player-romance.js` 同行重複字串）；本腳本逐筆列出。
  - 舊腳本把全形空白正規化為半形（`salary-detail.js`）。
  - 舊腳本在第一個 `}` 截斷樣板（例：`career-contract.js:197` 的「維}し」）。
- 以 COPY-01 的排除條件（`docs/src/data/*` 與 `league-catalog.js`、COVERED、HIDDEN）套用舊 TSV，得到 1,724 筆，與提案 §2 一致。

## 3. 總數（`a56ea9c`）

| | 筆數 |
|---|---|
| 全部 | 3,380 |
| NOT_COVERED／COVERED／HIDDEN | 3,205／83／92 |
| usage：DISPLAY／JUDGMENT／UNKNOWN／COMPAT | 2,804／337／218／21 |

**對應舊「1,724 行」的範圍**（NOT_COVERED，排除 `docs/src/data/*` 與 `league-catalog.js`）：**1,716 筆**（含 12 筆 regex 字面值）。

| usage | 筆數 | 說明 |
|---|---|---|
| DISPLAY | 1,283 | 批次改字的候選母體 |
| JUDGMENT | 210 | 同文字被比較或當鍵、物件鍵、regex 比對、`===`／`!==` 等 |
| UNKNOWN | 206 | `award-consumer-policy.js` 66、`trait-policy.js` 49、`salary-explanation-policy.js` 20、`ability-evaluation-policy.js` 17、`hall-of-fame-policy.js` 11、其他 policy 43 |
| COMPAT | 17 | 全部在 `award-identity-policy.js` |

全體 JUDGMENT 337 筆的理由：同文字被比較或當鍵 140、物件鍵 85、regex 比對 56、`===` 15、regex 字面值 12、子字串 9、陣列 `.includes()` 成員 8、其他 12。其中 `ui/season-summary.js:5` 以日文 identifier 鍵（例：`延長契約の内訳`）依卡片標題分組，對應的卡片標題全部列為 JUDGMENT。

## 4. 與 `54aa2ce` 的差異（同一腳本）

文字只增 5、減 4（其餘 3,363 筆相同；行號可能移動）：

| 檔案 | 刪除（`54aa2ce`） | 新增（`a56ea9c`） |
|---|---|---|
| `docs/index.html:91`、`ui/game-view.js:90` | 年俸（万） | 年俸（万円）（COPY-013） |
| `ui/share-image.js` | `:139`、`:141` リーグ横断通算：… | `:112`、`:113` 主要4リーグ一軍通算：…（COPY-029） |
| `engine/career-movement.js:244` | — | 現在の球団に残留 |

## 5. 待審候選的現行位置

COPY-01 盤點「待審候選」25 項的現行位置（`a56ea9c`）。文字未變的不重抄原文，見舊表。

| # | 現行位置 | 備註 |
|---|---|---|
| 1 | `engine/career-retirement.js:108` | |
| 2 | `engine/career-movement.js:46` | |
| 3 | `engine/career-movement.js:82` | |
| 4 | `engine/career-movement.js:85` | |
| 5 | `engine/career-movement.js:339`、`:343` | 舊 :333、:337 |
| 6 | `engine/player-ability.js:123` | |
| 7 | `engine/player-ability.js:112`、`:124`；`engine/season-phases.js:66` | |
| 8 | `engine/award-consumer-policy.js:76`（UNKNOWN）、`engine/award-identity-policy.js:23`（COMPAT）、`engine/season-awards.js:67` | 前兩處屬判定／相容，不列入改字 |
| 9 | `engine/career-retirement.js:227` | |
| 10 | `engine/career-retirement.js:35`、`:43` | |
| 11 | `engine/award-consumer-policy.js:80`（UNKNOWN） | |
| 12 | `data/jp-data.js:1` | 專名，不直接替換 |
| 13 | `engine/season-settlement.js:87` | |
| 14 | `ui/income-summary.js:6` | |
| 15 | `engine/career-movement.js:180`、`:181` | COPY-01 表所列 :175 在 `54aa2ce` 已不對應，該基準即為 :180、:181 |
| 16 | `engine/career-retirement.js:181`、`:310`、`:324` 等（「才」9 筆，含事件卡） | |
| 17 | `engine/career-movement.js:313`～`:315`、`engine/career-retirement.js:320`、`engine/career-policy.js:13`（UNKNOWN） | |
| 18 | `ui/salary-detail.js:13` | |
| 19 | `engine/amateur-career.js:84` 等（「全休」13 筆） | |
| 20 | `ui/seed-share.js:24`、`:36`、`:69`；`docs/index.html:8`、`:11`、`:14`；`engine/career-retirement.js:333`、`:356` | |
| 21 | `engine/season-phases.js:75` | |
| 22 | `engine/career-retirement.js:89`（2 句）、`:108`、`:187`、`:195`、`:345` | 6 句敬體與舊數一致 |
| 23 | `engine/career-retirement.js:105` | |
| 24 | `engine/player-injury.js:26`、`:31`、`:33`、`:66`、`:95`；`ui/condition-view-model.js:3` 等 | |
| 25 | `data/event-cards-jp.js`（92 筆，HIDDEN） | |

## 6. 第 1 批實際對象（供 code owner 確認）

提案 §4 第 1 批的對象在 `a56ea9c` 的位置與原文。修改後文案、手機畫面與母語審查依 §8-4，於確認對象後另行提出。

| 項目 | 位置 | usage | 原文 |
|---|---|---|---|
| N1 | `engine/hof-evaluation-policy.js:37` | UNKNOWN | 最優秀投手賞受賞による評価（`aceN` 含沢村賞；顯示於 `career-retirement.js:165`；`tests/hof-evaluation-policy.test.mjs:9` 固定此文字）。方向已決定（§8-3） |
| 018 | `engine/career-movement.js:253`、`:254`（`prop:t`） | DISPLAY | 権利を行使せず残留／国内FAを宣言／海外FAを宣言 |
| #1 | `engine/career-retirement.js:108` | DISPLAY | チームの公式ウェブサイトのプレスリリースで引退を発表しましたね。あなたがこの投稿を投稿した夜、…（全文見 TSV） |
| #2 | `engine/career-movement.js:46` | DISPLAY | あなたはこの契約にふさわしい人物であることを証明しました。（同行標題：自分の価値を維持する） |
| #3 | `engine/career-movement.js:82` | DISPLAY | 苦情は苦情、この取引は結局実現しませんでした。あなたはまだ元のチームにいますが、雰囲気は少し緊張しています。（標題：騒いだだけで何もなし） |
| #4 | `engine/career-movement.js:85` | DISPLAY | あなたの沈黙にもかかわらず、チームは取引を完了しました。（標題：取引は完了しました） |
| #5 | `engine/career-movement.js:339`、`:343` | DISPLAY（本文） | この街のファンはあなたの成長を見守ってきた。…／…あなたこそ、この球団の代名詞だ。**同行的卡片標題「隠し特性解放：」「隠しタイトル:」為 JUDGMENT**（`ui/trait-result-card.js:15` 的 regex 比對），不可改動 |
| #22 | `engine/career-retirement.js:89`（2 句）、`:187` | DISPLAY | ねえ、これは誰ですか？ …分かりました。／掲示板には…本人が返信しました。／あなたはディビジョン B のアマチュア野球チームに参加します。… |
| #22（參考） | `engine/career-retirement.js:195`、`:345` | DISPLAY | 「お疲れさまでした」（慣用句）與「画像を作成できませんでした。…」（系統訊息）。敬體在此可能是自然用法，請確認是否列入 |

除 #5 的卡片標題外，以上皆為 DISPLAY 或已決定的 N1；未發現同文字被比較的位置。

## 7. 限制

- usage 為啟發判定（§1）。間接比較、存入狀態後比對、跨模組以變數傳遞的字串可能被判為 DISPLAY。
- 動態字串只取得字面片段；執行期資料（球員名、由表格計算的獎項名）未列舉。
- `docs/designs`、`docs/assets`、CSS `content:`、tests、`release-notes.js` 不在範圍內。
- 母語審查人選未定（§8-4）；本文件不含建議文案。

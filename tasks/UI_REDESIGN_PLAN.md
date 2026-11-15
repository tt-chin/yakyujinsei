# UI 改版計畫（棒球選手手帳＋RPG成長感）

狀態（2026-11-14）：**計畫草案，待批准**。非現行規格，不授權實作；`CURRENT_SPEC.md` 未變更。

- 依據：使用者 2026-11-13 轉達「code owner 採用 `tasks/UI_REDESIGN_OPTIONS.md` §7（`242c012`）的方向」。§7 本文寫的是建議，並說 B 項於設計稿確認後再選定（§7.4）；本計畫據此把方向記為已採用，把 B 項範圍記為「§7 建議、階段 0 驗收時確認」。
- 寫法：兩層。階段 0（設計稿）為細部計畫；階段 1～5 只寫目標、範圍、預估分級、相依、已知測試耦合與待決事項。各階段的 D 表（DOM／CSS 變更）、T 表（測試）、允許差異清單，於前一階段驗收後，以當時最新 `dev` 重新盤點再寫，另行批准。
- 盤點基準：`origin/dev` `b327abe`（scout 唯讀調查；測試模式、`S.log` 欄位、token 數已在 `b327abe` 實測）。本分支基底較舊，`docs/` 與 `b327abe` 不同；行號以 `b327abe` 為準。
- 分級依 AGENTS §6.1，版本依 §9.2，皆為預估。
- 文中「OPTIONS §n」指 `tasks/UI_REDESIGN_OPTIONS.md`，「設計系統 §n」指 `tasks/DESIGN_SYSTEM_PLAN.md`；無前綴的 §n 指本文件。

## 0. 方向摘要

| 項目 | 內容 | 來源 | 狀態 |
|---|---|---|---|
| 程度 | A2＋部分 B，先保留現行玩法 | OPTIONS §7.1 | 已採用 |
| C（改玩法） | 本計畫不含；擲骰走格等另行討論 | OPTIONS §7.1 | 已採用（不在本計畫範圍） |
| 取代現有介面 | 新風格取代 4 主題，不並存切換 | 使用者前提（OPTIONS 開頭） | 已定；明暗變化與舊設定轉換待決（§5-1） |
| 視覺 | 球員卡、球探報告、成績單、冠軍印章；球場照片保留；不加劍盾金幣 | OPTIONS §7.1 | 已採用；標題字體待決（§5-2） |
| 用語 | 保留「年齢」「守備位置」等，不改叫 Lv | OPTIONS §7.1 | 已採用 |
| 字體 | 正文與數字用易讀字體；像素字體如採用只限標題或裝飾 | OPTIONS §7.1 | 已採用 |
| B 項 | B1 能力量條＋潛力、特性徽章；B3 突出目前事件與選項；B4 生涯路線圖（只畫已發生的經歷）；B2／B5 演出；B8 退休與分享圖 | OPTIONS §7.1／§7.2 | 建議；階段 0 驗收時確認範圍 |
| 延後 | BGM、世界地圖、NPC 頭像 | OPTIONS §7.1 | 已採用 |
| UI-DESIGN-TOKENS-05 | 設計系統 §12.3 的 A：統一現有 4 主題配色（外觀改變） | code owner 2026-11-14（使用者轉達） | 方向已決（A）；決定紀錄已同步到設計系統 §12.3／BACKLOG（PR #84，已併 `dev` `1cc0fbc`）；細部計畫與實作未批准 |

## 1. 現況盤點（`b327abe`）

### 1.1 畫面與產生位置

| 畫面 | 產生位置 | 容器 | CSS |
|---|---|---|---|
| 遊戲外殼 | `docs/index.html`（靜態） | `#board`（`#bd-top`／`#bd-grid`／`#lamps`）、`#main-nav`、`#view-host` 內 `#view-home`／`#view-player`／`#view-career` | `base.css`、`ui-navigation.css` |
| 記分板 | `game-view.js:30` `renderBoard()`；球團徽章 `career-presenter.js:22-46` | `#board` | `base.css`、`themes.css` |
| 桌面側欄 | `desktop-overview.js:5`（`matchMedia('(min-width: 1180px)')`） | `#desktop-player`、`#desktop-career` | `information.css:34` |
| 事件文字 | `game-view.js:16-20` `card()`；文字以 HTML 字串由 `game.js` 與多個 engine 模組傳入 | `#log` 內 `.yr-block`／`.yr-body` | `base.css` |
| 年度區塊 | `game-view.js:21` `divider()`（摺疊兩年前的區塊） | `.yr-block`／`.yr-head` | `base.css` |
| 選項 | `game-view.js:40-49` `renderChoices()`；`choice-prompt.js:25-33` 接 onclick 與防重複 | `#act`、`#act-toggle` | `base.css` |
| 能力／特性 | `ability-view.js:13`／`:29`；資料 `career-presenter.js:20-21` | `#view-player`、`#desktop-player` | `ui-navigation.css:8-10`；潛力標記 `base.css:105` |
| 特性標籤（log 內） | `game.js` `traitCard()`、`career-retirement.js:277-283` | `.tag .tag-*` | `base.css:43-54` |
| 年度成績表 | `player-detail.js:19-23`；資料 `career-presenter.js:57`（由 `S.log[]` 對應） | `.ui-yearly-table` | `ui-navigation.css` |
| 退休 | `career-retirement.js:153` `endGame()` 直接接在 `#log`：分隔線 → 成績表 → 殿堂場景 → 年度表 → 個人資料 → 球迷留言 → 分享卡 → 選項 | `#log` | `base.css` |
| 分享圖 | `share-image.js:58` `renderShareImage()`（W=920、2 倍）；配色 `share-image.js:16` `readThemeColors()`；`share-theme.js:3` 對比保護；`evals[]` 由 `game.js` 產生 | 分享卡內 `<img>` | — |

### 1.2 生涯資料（B4 用）

- `S.log[]` 的寫入處（`b327abe` grep `S.log.push`）只有 3 個：`amateur-career.js:113`（`{y, age, tm, line, inj}`）、`professional-season.js:83`（另有 `p`、`st`）、`season-phases.js:27`（復健年，另有 `st`）。
- 轉隊：被交易那年的 `S.log[].tm` 寫成「`舊隊→新隊`」（`professional-season.js:83`，來自暫存的 `S.tradeFrom`）；其他移籍只能從前後年的 `tm` 變化判斷。
- 階段：`S.stage`（HS／U／CORP／IND／PRO）、`S.stageYr`；聯盟與層級：`S.org`、`S.lv`。另有 `S.domesticTournamentLog`（`amateur-career.js:71,81`），內容未確認。
- 獎項：`S.honors[]`，字串 `'YYYY 賞名'`，年度要從前綴解析。
- 傷病：`S.log[].inj`；`S.bigInj`、`S.tjCount` 只有累計數。
- 舊存檔：scout 只看到年俸／服務年資的遷移（`_salaryV130Migrated` 等），沒看到 `S.log[]` 的遷移；舊存檔缺哪些欄位未確認。

### 1.3 顯示設定、字體、斷點、動畫

- 設定：`localStorage` `yakyujinsei.display.v1`，`{schemaVersion:1, theme, fontSize, density}`；套用為 `<html data-theme data-font-size data-density>`（`preferences.js:28-33`）；`schemaVersion !== 1` 時直接重設為預設，沒有遷移路徑。主題清單在 `theme-catalog.js`（UI-DESIGN-TOKENS-04）。
- 字體：Google Fonts 載入 `Noto Sans JP`（400／500／700／900）與 `IBM Plex Mono`（500／700）（`index.html:19-20`）；`--sans`／`--mono` 在 `base.css:1-2`。
- `themes.css` 77 行，4 個主題區塊，每區塊 60～63 個自訂屬性。
- 斷點：`max-width` 360／420／560／699px，`min-width` 1180px（CSS 與 JS 各一處），`@container (min-width: 420px)`，`prefers-reduced-motion` 關閉全部動畫（`base.css:132`）。
- 動畫：`.card` 出現 0.25s、按鈕 0.15s、能力條 0.2s；`requestAnimationFrame` 捲動與分享圖產生；退休 `setTimeout(250)` 捲動（`career-retirement.js:359`）；`game.js:241` `setTimeout(0)` 替換 `.card` 文字。scout 未發現逐字顯示與略過機制。

### 1.4 已知測試耦合（非完整清單）

模式取自 `b327abe` 的 `node scripts/test.mjs list`。

| 測試 | 斷言類型 | 模式 | 受影響階段 |
|---|---|---|---|
| `ui-foundation.test` | 原始碼文字：id 唯一、`data-main-panel`、DOM 順序 `#log < #act-toggle < #act` | quick／full | 2 |
| `display-preferences.test` | 原始碼文字＋設定正規化＋各主題 token 對比；含 -04 的主題清單雙向一致性（4 個 id／名稱寫死、`themes.css` 區塊集合＝`THEME_IDS`，設計系統 §11 T1） | quick／full | 1 |
| `display-preferences-e2e` | computed style、對話框、`data-theme` 保存、`#act` innerHTML | full | 1、2 |
| `design-tokens-02.test`／`-e2e` | 標籤 token hex、對比、4 主題 × PC／手機 computed style | quick／full | 1、2、4 |
| `design-tokens-03-e2e` | 分享 PNG 位元組比較（standard／classic 不變） | quick／full | 1、4 |
| `replay-share-theme.test` | `readThemeColors`、`shareTagPalette` | quick／full | 1、4 |
| `replay-share-theme-e2e` | 各主題背景 RGB | full | 1、4 |
| `career-presenter.test` | view model 結構 deep-equal（基準 `097e212`） | quick／full | 2、3 |
| `game-view-dom-e2e` | 每步 `#log`／`#act`／`#board` DOM＋S＋RNG 次數（基準 `4f39a73`，1280／390px） | full | 2、3、4（DOM 差異須核准；S／RNG 須相同） |
| `award-identity-policy.test` | 凍結 `287dd1a` 時已存在的 `docs/src` 檔；`ability-view.js` 在凍結範圍內，`player-detail.js`、`preferences.js` 等只允許核准 overlay | quick／full | 1、2、3 |
| `trait-result-card.test`、`checkpoint-renderer.test` | 對舊 `game.js` 的原始碼／DOM 輸出比較 | quick／full | 2 |
| `salary-detail-ui.test` | 輸出 HTML 文字 | quick／full | 2（右欄契約） |
| `international-personal-stats-e2e`、`full-power-pitching-e2e`、`smallschool-c-e2e`、`trait-display-e2e` | 以舊基準的 `game.js` 搭配目前模組（stage6 `historical` 頁）；`share-theme.js` 由 `routeHistoricalShareTheme` 依各基準 SHA 提供（`86969a5`，`scripts/test-historical-share-theme.mjs` 檢查）。-03 移除 `getSharePalette` 時 4 項曾在 Full FAIL（設計系統 §10.4） | full（Quick 不含） | 1、4：改 `share-theme.js`、`share-image.js` 的 export 或其他被舊 `game.js` import 的模組時，須逐一確認 |
| `choice-prompt.test`、`choice-action.test`、`bug-act-01-02-e2e`、`information-architecture.test`、`japanese-copy-contract-ui.test` | grep 命中（引用模組檔名、`#act-toggle` 或 `yr-block`），斷言內容未確認 | quick／full | 2 |
| `trait-system-e2e` | 同上 | full | 2 |

本表只涵蓋 5 個模組檔名與 2 個 id 的 grep 交叉檢查。設計系統 §11 D7 另列出迭代主題清單的測試（`board-menu`、`test-ui-desktop-acceptance`、`npb-return-e2e`、`international-personal-stats-e2e`），階段 1 須一併處理。各階段細部計畫時重新做全面掃描（含混合版本路由與 `productionFunction` 等原始碼文字掛鉤）。

既有輔助：`tests/support/dom-snapshot.mjs:8` `captureGameView()`（注入 `GAME_VIEW_HOOK`，取得 S、view model、DOM）；`game-view-dom-e2e` 的固定 seed `yakyo-test-001`（P）、`jp3-pitcher-02`、`jp3-infielder-01`、`jp3-outfielder-01`。沒有獨立的狀態匯出腳本。

## 2. 階段總覽

| 階段 | 內容 | 預估分級 | 預估版本 | 相依 |
|---|---|---|---|---|
| 0 | 靜態設計稿：首頁、事件選擇、能力頁 × 手機／桌面 | R0 | 不升 | — |
| 1a | 配色統一（-05 A）：以 v2 的約 14 個基礎色＋`color-mix()` 規則推導元件色，套用到現有 4 主題 | R2 | PATCH（外觀改變） | 無（不等階段 0） |
| 1b | 非顏色 token（-06）：字體、字級、圓角、陰影、間距、JS 內 inline 版面值改 class；外觀不變的部分先做 | R2 | 不升或 PATCH | 1a |
| 1c | 換成新風格：新模板取代 4 主題、顯示設定轉換、分享圖配色跟隨 | R2 | MINOR | 1a、1b |
| 2 | B1 能力／特性頁、B3 首頁與事件選項 | R2（觸及事件順序者 R3） | MINOR | 1c |
| 3 | B4 生涯年度路線圖 | R2 | MINOR | 1c（2 的版面） |
| 4 | B8 退休畫面與分享圖（含 canvas 字體） | R2（觸及 `endGame` 順序者 R3） | MINOR | 1c、2 |
| 5 | 音效、地圖、頭像素材 | 未定 | 未定 | 核心畫面定案後另行決定 |

1a 依 code owner 選定的 -05 A 改變現有 4 主題的外觀；推導規則之後由 1c 沿用，新風格只換基礎色。1b 沿用設計系統 §9 P4 的路線，外觀不變的部分以無差異證明。1c 換成新風格。B2／B5 演出的位置未決（§5-3），共通規則見 §4.6。

## 3. 階段 0：靜態設計稿（細部計畫）

### 3.1 範圍

- 三個畫面：首頁（記分板＋目前事件＋選項）、事件選擇（選項展開狀態）、能力頁（能力量條＋潛力、特性徽章）。
- 兩種寬度：手機 390px（另檢查 320px 的折行與可讀性）、桌面 1280px（左能力、中事件、右成績／契約）。
- 每畫面先出一個 A2 手帳風方案；標題字體候選最多 2 種（§5-2），在同一畫面並排比較。
- 只做淺色；明暗變化待 §5-1 決定後於 1c 處理。
- 不做：互動演出、路線圖、退休畫面、分享圖、新素材圖片（球場照片引用 `docs/` 現有檔的相對路徑，不複製）。

### 3.2 資料

- 取資料以 `origin/dev`（取得時的完整 SHA 記於 README）的 `docs/` 為準，不用本分支較舊的 `docs/`；在 scratchpad 的 worktree 執行。
- 以 `game-view-dom-e2e` 的固定 seed 跑一條生涯，取職業期中段（有特性、契約、獎項）的一個時點，用 `captureGameView()` 的方式取 S 與 view model；另取該時點的一個實際選項事件作為「事件選擇」畫面的內容。seed 與步數於取資料時決定，記於 README。
- 驅動腳本放 scratchpad，不 commit；取得的資料存為 `tasks/ui-redesign/mockup-data.js`（`file://` 無法 `fetch` JSON，故用 script 載入），只含畫面用到的欄位。
- 事件文字與顯示文字照抄遊戲實際輸出，不改措辭（AGENTS §4）。

### 3.3 檔案

| 檔案 | 內容 |
|---|---|
| `tasks/ui-redesign/README.md` | 用途、資料來源（seed、時點、取得時的 SHA）、開啟方式、限制（不接入遊戲、不代表批准實作） |
| `tasks/ui-redesign/mockup.css` | 設計稿共用樣式；以約 14 個基礎色＋推導寫成，作為 1c 的配色雛形 |
| `tasks/ui-redesign/mockup-data.js` | §3.2 的資料 |
| `tasks/ui-redesign/home.html`、`choice.html`、`ability.html` | 三個畫面，每檔以 media query 同時對應手機與桌面 |
| `tasks/ui-redesign/*-{390,320,1280}.png` | 截圖 |

全部為靜態 HTML／CSS／JS，相對路徑、UTF-8；字體只用 Google Fonts；不引入 npm 或建置工具。

### 3.4 驗證（R0）

- `git diff --stat -- docs/ scripts/ tests/` 為空。
- 用 Playwright＋Brave 依 320／390／1280px 開啟各頁：console error 0、無水平捲動（`scrollWidth <= clientWidth`）、截圖。
- 正文與背景、標籤文字與底色的對比 ≥ 4.5:1。讀 computed style 後在 Node 依 CSS Color 4 公式轉成 sRGB，支援 `rgb()`／`rgba()`、`oklab()`、`oklch()`、`color(srgb …)`（`color-mix()` 的結果不是 `rgb()`，設計系統 §9 的「P3 注意」已實測為 `oklab()`、`color(srgb …)`）；無法解析的格式一律 FAIL，不略過。有透明度時，先依實際的祖先背景鏈由下而上合成（source-over），再計算對比。背景是圖片（球場照片）時，以文字所在區塊的不透明底色計算；文字直接疊在照片上的位置列為人工確認項。不用 canvas 讀值（Brave 預設會對 `getImageData` 加入 ±1 雜訊）。
- 手機上記錄「目前事件頂端 → 第一個選項」的捲動距離，並與現行畫面同一時點比較。

### 3.5 驗收與產出

- code owner 確認：風格方向、標題字體、資訊優先順序、捲動距離、B 項範圍。
- 驗收後在本文件記下決定，並寫 1c 細部計畫（1a、1b 不等階段 0）。
- 設計稿與 `tasks/ui-redesign/` 不接入正式遊戲。

## 4. 階段 1～5（概要）

### 4.1 階段 1a～1c：模板

- **1a 配色統一**：依設計系統 §12.3 A（code owner 2026-11-14 選定），以 v2 為起點為元件色定規則並套用到 4 主題；焦點框、潛力標記、陰影另行設計；-02 已批准的標籤色與 night／scoreboard 分享圖隨之改變。舊名保留為別名；`display-preferences.test` 的 hex 對比改為瀏覽器 computed style（設計系統 §9.2）。`color-mix()` 的瀏覽器底線 Baseline 2023 寫入 `CURRENT_SPEC.md`。細部計畫於 PR #84 併入 `dev` 後，以最新 `dev` 另寫於設計系統 §13。
- **1b 非顏色 token**：依設計系統 §9 P4，先做外觀不變的部分；canvas 字體改讀 `--sans`／`--mono` 會改變分享 PNG，移到階段 4。
- **1c 換成新風格**：新模板取代 4 主題；`themes.css`、`base.css`、`preferences.css`、`index.html`（字體連結）、`theme-catalog.js`、`preferences.js`。分享圖配色經 `readThemeColors()` 自動跟隨。
- 顯示設定轉換（OPTIONS §7.3）：儲存的舊 `theme` 值如何對應新模板，`fontSize`／`density` 是否保留。只轉換顯示設定，不碰生涯存檔；`schemaVersion` 若升版，舊值不可只是重設。
- 1c 須重新核准：`display-preferences.test` 的主題清單與對比組合、`design-tokens-02` 的標籤 hex、`design-tokens-03-e2e` 的「standard／classic PNG 不變」、`award-identity-policy` 的 `preferences.js` overlay、§1.4 所列迭代主題清單的測試。
- 待決：§5-1。

### 4.2 階段 2：B1 能力／特性、B3 首頁與事件選項

- 目標：能力量條顯示目前值與潛力，特性用徽章；首頁突出目前事件與選項，過往紀錄收進年度區塊；手機減少事件與選項間的往返捲動；桌面維持三欄。
- 範圍：`ability-view.js`、`career-presenter.js`、`game-view.js`（`card`／`divider`／`renderChoices`）、`choice-prompt.js`、`desktop-overview.js`、`index.html`、`base.css`、`ui-navigation.css`、`information.css`。事件文字由 `game.js` 與 engine 模組以 HTML 字串產生，本階段只改容器與樣式，不改文字內容與產生順序。
- 限制：`ability-view.js` 在 `award-identity-policy` 凍結範圍內，須核准 overlay 或改放新模組；`career-presenter.test` 的 view model 結構若要加欄位，須核准差異；`ui-foundation.test` 的 DOM 順序若要變更，須核准。
- 須保留：選項防重複、`#act` 摺疊、§4.6 的狀態與 RNG 一致（`game-view-dom-e2e` 只允許核准的 DOM 差異）。
- 允許差異：`game-view-dom-e2e` 的 DOM 快照，於細部計畫列出。

### 4.3 階段 3：B4 生涯年度路線圖

- 目標：依實際經歷標出升學、入團、轉隊、受傷、獲獎；點節點看當年紀錄。只畫已發生的事，不擲骰、不強迫固定路線、不從不足的舊資料補造經歷。
- 資料：§1.2。轉隊用 `S.log[].tm`，獎項年度由 `S.honors[]` 前綴解析；舊存檔缺欄位時不顯示該項，不推測。
- 範圍：新模組（不改凍結的 `player-detail.js`，或只用核准 overlay 掛載）、`career-presenter.js`（如需新的 view model）。
- 分級：讀取既有資料的純顯示，預期適用 AGENTS §6.1 純顯示例外；不新增狀態或存檔欄位。
- 細部計畫時：確認舊存檔實際缺哪些欄位、`S.domesticTournamentLog` 的內容、各聯盟／層級的節點分類。

### 4.4 階段 4：B8 退休畫面與分享圖

- 目標：退休畫面與分享圖採用新介面的字體、配色、資訊層級，保留成績、收入、稱號與授權資訊的可讀性。
- 範圍：`career-retirement.js` 的退休卡片樣式、`share-image.js` 的版面與 canvas 字體（讀 `--sans`／`--mono`，須等 web font 載入；原屬 -06）。
- 限制：`endGame()` 的卡片順序、`setTimeout(250)` 捲動、`game.js:241` 的文字替換維持不變；改到順序即重分為 R3。已核准的稱號與顯示文字不改（AGENTS §4）。改 `share-image.js`／`share-theme.js` 的 export 時，確認 §1.4 的 4 項混合版本 E2E。
- 須重新核准：`design-tokens-03-e2e` 與 `replay-share-theme-e2e` 的 PNG／背景基準、`design-tokens-02.test` 的退休卡標籤斷言、`game-view-dom-e2e` 的退休段 DOM。

### 4.5 階段 5：素材

- 音效（Web Audio）、地圖、頭像。素材須原創或取得授權，不照搬特定遊戲。核心畫面定案後另行決定是否做。

### 4.6 共通規則（各階段）

- 顯示不得呼叫 `R`。相同 seed 與相同操作下，除逐項批准的顯示差異外，完整狀態（S）、選擇、RNG 呼叫順序、次數、輸出值及各步前後狀態均須一致；不能只比較呼叫次數。
- 相關測試依各階段的實際影響選取；階段 0 的靜態設計稿不接入遊戲，不需執行遊戲回歸。依盤點，`game-view-dom-e2e` 比較 S 與 RNG 呼叫次數；是否也比較呼叫順序與輸出值，於階段 2 細部計畫確認，不足時補上。
- 演出（B2／B5）：簡短、可略過、可關閉，遵守 `prefers-reduced-motion`；遊戲處理不等待動畫；重複操作、略過、離開畫面、舊 callback 都要安全。
- 按可獨立驗收的完整畫面或互動範圍分批 PR 到 `dev`，每批列明允許的顯示差異，不整份略過歷史比較。
- 每階段開工前以最新 `dev` 重新盤點；`game.js` 內仍有的 DOM 產生（`traitCard`、`allocUI` 等）屆時確認，不把程式搬回 `game.js`。

## 5. 待決（code owner）

1. 現行 4 主題移除後，新介面要不要有明暗兩種；舊 `theme` 設定如何對應；`fontSize`／`density` 是否保留（1c 前）。
2. 標題字體：沿用 `Noto Sans JP` 粗體，或另選 1 種手帳風字體（階段 0 並排比較後決定）。
3. B2／B5 演出放在哪個階段（例：成長演出隨階段 2，得獎演出隨階段 4）。
4. 發布方式：每階段併 `dev` 後各自發布，或累積到一個 MINOR 一起發布。
5. BACKLOG 登記時機：本計畫批准時登記，或階段 0 驗收後登記。
6. UI-DESIGN-TOKENS-05：方向已決——code owner 2026-11-14 選設計系統 §12.3 的 A（使用者轉達）。決定紀錄在設計系統 §12.3 與 BACKLOG（PR #84，已併 `dev` `1cc0fbc`）。細部計畫草案在設計系統 §13（`ui/design-tokens-05`），尚未批准；實作未開始。

## 6. 盤點限制

- `docs/src/main.js`、`game.js` 全文、`salary-detail.js`、`board-menu.js` 等其他 UI 模組，以及 `board-menu.css`、`browser-save.css`、`seed-share.css` 未讀。
- §1.4 只做了部分 grep 交叉檢查，末 2 列的斷言內容未確認。
- 行號以 `b327abe` 為準；各階段細部計畫時重新盤點。

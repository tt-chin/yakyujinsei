# 設計系統（表示 token）計畫

狀態（2026-11-11）：第 1 段已發布（1.13.6，結果見 §6，PR #26）；第 2 段已實作待驗收（1.16.1，§8.4，PR #77）；同日決定模板化路線 P1～P4（§9），P1＝第 3 段，細部計畫待寫（§10）。舊狀態：第 1 段已核准（2026-10-24，§3 六點皆照建議；同日依 `357e852` 重掃 §1，追加 §2.2 漏列值處理、版本改為 1.13.6，經使用者核准），已實作（`fcb22a9`）。本文件只規劃表示層；不改遊戲規則、RNG、`S`、DOM 結構與順序（AGENTS §2）。不引入 build 工具、框架或 npm 依賴（AGENTS §5）：token 只用純 CSS 變數，必要時另加 JS 模組供 canvas 讀取。

## 0. 總路線

| 段 | BACKLOG | 內容 | 預估分級 | 狀態 |
|---|---|---|---|---|
| 1 | UI-DESIGN-TOKENS-01 | token 盤點、補非顏色 token、修正字體指定 | L1／R2 | 已發布（1.13.6，§6） |
| 2 | UI-DESIGN-TOKENS-02 | 元件化：特性標籤、球團徽章改用 class＋token | R2 | 已實作待驗收（1.16.1，§8.4，PR #77） |
| 3（P1） | UI-DESIGN-TOKENS-03 | 分享圖顏色改讀 CSS token（單一來源）；canvas 字體移至 P4 | R2 | 路線已決（§9），細部計畫待寫（§10） |
| P2 | UI-DESIGN-TOKENS-04 | 主題清單集中為單一定義 | R2 | 路線已決（§9），未計畫 |
| P3 | UI-DESIGN-TOKENS-05 | 語意層＋基礎色推導（`color-mix()`）、對比測試改瀏覽器 | R2 | 路線已決（§9），未計畫 |
| 4（P4） | UI-DESIGN-TOKENS-06 | 非顏色模板：字體（含 canvas）、字級、圓角、陰影、間距、JS 內 inline 版面值 | R2 | 路線已決（§9），未計畫 |

各段各自一個 PR → `dev`，分開驗收。分級為預估，各段細部計畫時依 AGENTS §6.1 重判。

## 1. 現況（2026-10-24 唯讀確認，基準 `origin/dev` `2e69096`；同日以 `357e852` 重掃，差異併記於各節）

`2e69096..357e852`（`b0a82a1` 收入顯示統一、`357e852` 資訊 dialog）對本段的影響：`information.css` 新增 4px 圓角 ×2（捲軸 track／thumb）與 20px 字級 ×1；`base.css` 新增 `.income-summary` 3 行（無圓角／陰影）；`VERSION` 1.13.5；字體指定錯誤（§1.2）仍存在。

### 1.1 已有的 token

- 顏色：`docs/styles/themes.css`（61 行）。約 40 個變數 × 4 主題（`standard`／`night`／`classic`／`scoreboard`），以 `<html data-theme>` 切換（`docs/src/ui/preferences.js:3,29`）。檔頭宣告 themes.css 為顏色的唯一所有者；其餘 7 個 CSS 檔沒有 hex 色碼。
- 字體：`base.css:2–3` 的 `--sans`、`--mono`。
- 尺寸倍率：`preferences.css:1–4` 的 `--font-scale`、`--space-scale`、`--panel-scale`、`--nav-scale` 與卡片間距類變數（`data-font-size`／`data-density`）。

### 1.2 字體指定錯誤（瀏覽器實測）

- `index.html:20` 自 Google Fonts 載入 `Noto Sans JP`（400／500／700／900）與 `IBM Plex Mono`（500／700），但 `--sans` 為 `'Noto Sans TC',-apple-system,'PingFang TC','Microsoft JhengHei',sans-serif`。
- 本機 macOS＋Brave（`127.0.0.1` 靜態 server，`2e69096` 的 `docs/`）：`document.fonts` 只有 `IBM Plex Mono 500` 為 loaded；CDP `CSS.getPlatformFontsForNode`：`.btn` 為 PingFang TC 15 字＋Lucida Grande 1 字，`h1` 為 PingFang TC 11 字＋Osaka 7 字。日文介面以繁中字體顯示（漢字為台灣字形）。
- Windows 依字體清單推定落到 Microsoft JhengHei，**未實測**；手機未實測。
- 兩者自 `4c44cc2`（2026-08-26，docs 分離）即並存，推定沿用自台灣版。`CURRENT_SPEC.md` 未規定字體。
- 分享圖 canvas 使用 `game.js:1903,1927,1952–1954` 的 `'13px sans-serif'` 等，不讀 `--sans`，不受本段影響（屬第 3 段）。

### 1.3 非顏色數值（`docs/styles/` 8 檔；`themes.css` 無此類宣告。`357e852` 重掃，含 `2e69096` 時已存在但原盤點漏列的值）

- `border-radius`：8px ×10、6px ×5、10px ×5、4px ×5（`357e852` 前 ×3）、14px ×4、50% ×2；單次：9px、7px、12px（`board-menu.css`）、2px、1px（`base.css`）、0（`board-menu.css`）；複合：`10px 10px 0 0`、`14px 14px 0 0`（`base.css`）。
- `box-shadow`：`0 16px 48px var(--shadow-color)` ×3；`0 6px 18px var(--board-shadow)`、`0 4px 10px var(--nav-shadow)`、`inset 0 -3px 0 var(--dice-shadow)`、`inset 0 -2px 0 var(--amber)` 各 ×1；另有 `0 12px 32px var(--shadow-color)`（`board-menu.css` 選單）、`0 0 8px var(--amber)`（`base.css` 光暈）各 ×1。
- `font-size`（皆為 `calc(Npx * var(--font-scale,1))`，另有 `.85em`、`1em`）：12px ×14、11／13／20px 各 ×5、14／15px 各 ×4、10.5px ×3、12.5／13.5／17px 各 ×2、8／10／14.5／16／18／22／24／34px 各 ×1。
- `font-weight`：700 ×15、500 ×2、900 ×2、400 ×1。

### 1.4 測試耦合

- `display-preferences.test.mjs:24–33`：以 `/:root\[data-theme="([^"]+)"\]\s*\{([^}]+)\}/g` 取各主題區塊、`/--([\w-]+):(#[\da-f]+)/g` 取 hex token，檢查對比（文字 4.5、UI 3）。主題區塊內的 token 必須維持 hex 直寫，改成 `var()` 參照會使斷言取不到值。
- `ui-foundation.test.mjs:30`：`#main-nav\{position:sticky;top:var\(--board-height,0px\);z-index:19` 逐字比對。
- `career-movement-policy.mjs:96–99`：`base.css` 的 `.career-table-scroll`、`table.fin.career-table`、`.career-team`（`max-width:220px`）、`-webkit-line-clamp:2` 逐字比對。
- `verify-modularization.mjs:15–16`：讀 `base.css`／`themes.css`，斷言 icon `url(...)` 與 `<link>` 順序。另斷言 `config.js` 的 `VERSION = '1.13.5'`，升版時須同步。
- `npb-return-e2e.mjs:49–50`：PC／手機 5 寬度 × 4 主題 × 3 字級 × 2 密度的版面檢查。
- `replay-share-theme-e2e.mjs:24–41`：分享 PNG 逐像素比較（canvas，不受 CSS 字體影響）。

### 1.5 版本

- `docs/src/config.js:1` `VERSION='1.13.5'`；另見 `docs/src/data/release-notes.js`、`CURRENT_SPEC.md`。

## 2. 第 1 段設計

### 2.1 字體修正（有意的視覺變更）

- `base.css:3` 改為：`--sans:'Noto Sans JP','Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif;`（§3 待決①）。
- `index.html:20` 不變（已載入 Noto Sans JP 400／500／700／900，涵蓋 CSS 使用的全部字重）。
- `display=swap` 下首次載入可能先以後備字體顯示再切換（FOUT），與現況 IBM Plex Mono 相同。

### 2.2 非顏色 token（computed style 不變）

在 `base.css` 的 `:root`（主題區塊之外）新增，並將對應字面值改為 `var()`：

- 圓角：`--radius-xs:4px`、`--radius-sm:6px`、`--radius-md:8px`、`--radius-lg:10px`、`--radius-xl:14px`、`--radius-round:50%`。9px、7px 各僅 1 處，維持字面值（§3 待決②）。複合值以 token 組成：`var(--radius-lg) var(--radius-lg) 0 0`、`var(--radius-xl) var(--radius-xl) 0 0`（computed style 不變）。單次的 0／1px／2px／12px 依同一規則維持字面值。
- 陰影（只取層級用途）：`--shadow-overlay:0 16px 48px var(--shadow-color)`、`--shadow-board:0 6px 18px var(--board-shadow)`、`--shadow-nav:0 4px 10px var(--nav-shadow)`。兩個 `inset` 屬元件裝飾，維持原樣；選單的 `0 12px 32px var(--shadow-color)` 屬層級用途，新增 `--shadow-popover`。`0 0 8px var(--amber)` 為裝飾光暈，與兩個 `inset` 同樣維持原樣。
- 字級：本段不做（§3 待決③）。數值分散（10.5／12.5／13.5px 等），歸一到級距會改變外觀。
- 字重：維持字面值。

### 2.3 顏色 token 命名

- 現有名稱（`--chalk`＝本文、`--amber`＝強調、`--clay`、`--dim`＝次要文字等）沿用球場／黑板比喻。本段不改名，只在 `CURRENT_SPEC.md` 表示設定節補一張 token 用途表（§3 待決④、⑤）。
- 改名會牽動 7 個 CSS 檔、`game.js` 的 7 處 `var(--…)`、`display-preferences` 斷言，留待第 2 段後再評估。

### 2.4 防止再發的斷言

- 在 `display-preferences.test.mjs` 新增：`--sans` 的第一個 family 必須出現在 `index.html` 的 Google Fonts `family=` 參數中（`+` 換回空白比較）；`--mono` 同理。
- 新增斷言前以 scratchpad 副本確認：現行 `2e69096`（`Noto Sans TC`）FAIL，修正後 PASS（負控制）。

## 3. 待決

1. 後備字體順序：①`Noto Sans JP` → `Hiragino Sans` → `Hiragino Kaku Gothic ProN` → `Yu Gothic` → `Meiryo` → `sans-serif`（建議）；②只保留 `Noto Sans JP`, `sans-serif`。
2. 單次出現的 7px／9px 圓角：①維持字面值（建議，外觀不變）；②併入相近 token（6px／8px／10px，外觀微變）。
3. 字級 token：①本段不做（建議）；②只為 ≥4 次的值（11／12／13／14／15／20px）建立 token，其餘維持字面值；③歸一到級距（視覺變更，需另批）。
4. 顏色 token：①不改名，補用途表（建議）；②增設語意別名（`--color-text:var(--chalk)` 等；主題區塊內仍須 hex，別名只能放在主題區塊外）；③全面改名。
5. token 用途表的位置：①`CURRENT_SPEC.md` 表示設定節（建議，AGENTS §11 唯一仕様）；②本計畫文件；③新設 `docs/` 設計文件（AGENTS §11 不建議增設仕様書）。
6. 版本：字體變更改變表示內容，依 AGENTS §9.2 為 PATCH（1.13.5 → 1.13.6（原寫 1.13.3 → 1.13.4，dev 已發布 1.13.4／1.13.5），同時更新 `config.js`、`CURRENT_SPEC.md`、`CHANGELOG.md`，並依 dev 版 AGENTS §9.4 在 `RELEASE_NOTES.md` 追加精簡摘要、以 `node scripts/update-release-notes.mjs` 產生 `release-notes.js`（不直接編輯）、`verify-modularization.mjs` 的版本斷言）。是否與第 2 段合併發布再升版另議。

使用者決定（2026-10-24）：六點皆照建議（①日文後備字體列；②7px／9px 維持字面值；③字級 token 本段不做；④顏色 token 不改名、補用途表；⑤用途表放 `CURRENT_SPEC.md`；⑥PATCH（重掃後改為 1.13.5 → 1.13.6））。實作於下一個 session 在 `ui/design-tokens` 進行；實作前於當時的 `origin/dev` 重掃 §1（若已前進，改用新基準）。BACKLOG：`UI-DESIGN-TOKENS-01`。重掃（`357e852`）後追加，使用者核准：複合圓角以 token 組成；單次 0／1px／2px／12px 維持字面值；新增 `--shadow-popover`；`0 0 8px var(--amber)` 維持字面值。

## 4. 驗證（L1／R2：表示層，不碰 `game.js`、RNG、`S`）

1. 靜態：`check-syntax`；`display-preferences.test`（對比＋新斷言）、`ui-foundation.test`、`career-movement-policy`、`verify-modularization`。
2. token 等價（§2.2）：scratchpad 腳本以 Playwright 在 `2e69096` 與變更後，各開首頁與一個生涯中畫面，4 主題 × 3 字級 × 2 密度，收集所有元素的 `getComputedStyle` 的 `border-radius`／`box-shadow`，比對完全一致。
3. 字體（§2.1）：CDP `CSS.getPlatformFontsForNode` 確認 `.btn`／`h1`／卡片本文為 `Noto Sans JP`（web font）；`document.fonts` 含 `Noto Sans JP` loaded。
4. 表示確認（AGENTS §6）：PC 1280 與手機 375 的首頁、生涯畫面、設定面板截圖，4 主題；比對變更前後只有字形差異，沒有溢出或換行破版。字寬改變可能影響換行，以 `npb-return-e2e` 的版面檢查為準。
5. `npb-return-e2e`、`replay-share-theme-e2e`（確認分享 PNG 不變）；Quick。`replay-share-theme-e2e` 第 26 行在 dev 上仍為舊期待值 FAIL（`CI-FULL-STALE-01`），須待 PR #24 併 dev 並將本分支 rebase 後再執行。
6. Full：依 AGENTS §6.2，L1 不強制；合併 `main` 前依既有流程。
7. 本機為 macOS＋Brave；Windows 字體回退未實測，在報告中標明。
8. FAIL／BLOCKED／SKIP 分別記錄，不標 PASS。

## 5. 交付

- 分支：`ui/design-tokens`（自 `origin/dev` `2e69096`）。
- commit 順序：本計畫 → 實作（CSS、斷言、`CURRENT_SPEC.md`、版本與 `CHANGELOG.md`）→ 結果紀錄（本文件 §6）。commit／push／PR 各另批。
- BACKLOG：核准後新增項目（例如 `UI-DESIGN-TOKENS-01`），完成時勾選。
- 不修改 `main`。

## 6. 第 1 段結果（2026-10-24）

- 實作 commit：`fcb22a9`（`ui/design-tokens`，基準 `origin/dev` `55e60a4`）。分級 L1／R2：只改 CSS、測試、文件與版本，`game.js`、RNG、`S`、DOM 未變。版本 1.13.5 → 1.13.6（PATCH）。
- 計畫外追加的耦合：`tests/award-identity-policy.test.mjs` 凍結 `docs/src` 並只允許 `config.js` 的核准版本字面值，升版須同步（經使用者核准改為 `'1.13.6'`）。token 用途表最初漏算 `themes.css` 內的參照（`.btn small`、`:focus-visible`、`:disabled`），經 reviewer 指出後更正。
- 驗證（本機 macOS＋Brave 155，非 CI Linux Chromium）：
  1. computed style 等價：scratchpad 腳本比較 `origin/dev` 與變更後全部元素及 `::before`／`::after` 的四角 `border-radius` 與 `box-shadow`，1280／375 × 開始畫面／生涯中 × 4 主題 × 3 字級 × 2 密度＝96 組，全部一致（最多 395 項、110 項非預設）。兩側使用同一份 `release-notes.js`，避免新增履歷項造成的元素數差。負控制（`--shadow-nav` 改 1px）FAIL。
  2. 字體：CDP `CSS.getPlatformFontsForNode` 的 `.card`、`#bd-name` 由 PingFang TC 變為 Noto Sans JP（web font，CDP 名稱為可變字體的 `Noto Sans JP Thin`）；`document.fonts` 含 Noto Sans JP 400／500／700／900 loaded。`h1`、`.btn` 的直接文字節點為空，未取得。
  3. 字體斷言：修正後 PASS；套用 `origin/dev` 的 `base.css` 時以 `Noto Sans TC is not loaded` FAIL（負控制）。
  4. 截圖 48 張（1280／375 × 開始／設定／生涯 × 4 主題 × 前後）無水平溢出、無 page error；抽查只有字形差異。
  5. Quick 67 PASS／1 FAIL（`award-identity-policy.test`，即上述耦合）；更新後該入口單獨重跑 PASS，未重跑整個 Quick。`npb-return-e2e`、`replay-share-theme-e2e` 2／2 PASS（分享 PNG 不變）。
  6. reviewer：1 項（用途表錯誤）已更正，其餘無發現。
- 未確認：Windows／手機的字體回退未實測；Full 未執行（L1，合併 `main` 前依既有流程）。

## 7. 第 2～4 段現況盤點（2026-11-10，基準 `refactor/legacy-wrappers` `4fabbdc`，VERSION 1.16.0；scout 唯讀調查＋grep 抽查）

§1 為 `2e69096` 時的數據；OOP 重構後 JS 內的表示碼已全部移出 `game.js`，行號以本節為準。

### 7.1 JS 內的色碼與 inline style

| 對象 | 位置 | 現況 | 測試耦合 |
|---|---|---|---|
| 退休卡特性標籤（HTML） | `docs/src/engine/career-retirement.js:276–285`（`tagStyle()` 與負面／已移除兩行） | 傳說・台湾／金布／`mrteam`／天才／負面／已移除以 inline style 寫死 hex；標準特性用 `.tag`（`base.css`，讀 `--metric-bg`、`--edge`、`--amber`）。特殊特性不隨主題變化，深色主題下仍為淺色底 | 未找到直接斷言；`game-view-dom-e2e` 的 DOM 比對是否涵蓋退休卡特性標籤未確認（其 `class="tag"` 命中為「通算評価」標籤） |
| 分享圖特性標籤（canvas） | `docs/src/ui/share-image.js:146–152`（`tagColor()`） | 與上一列同一組色值的第二份副本；只有「已移除」不同（`#f1eeee`／`#b7aaad`／`#81757a` 對 HTML 的 `#8a8a8a`／`#4a4a4a`＋`opacity:.4`）；另有標準特性 `#fbe9ec`／`#c95b6c`／`#7f1d2d`，經 `shareTagPalette()` 調整對比 | `replay-share-theme-e2e` 逐像素比較（基準 `dc5ac871`） |
| 球團徽章 | `docs/src/ui/career-presenter.js:29–44`（`board()`） | PRO 且有球團色時：白底 `#ffffff`、`padding:2px 8px`、`border-radius:6px`、`box-shadow:0 2px 4px rgba(0,0,0,0.4)`、圓點 `#cccccc`／球團色，皆 inline；白色球團改黑字 `#000000`。否則 `color:var(--amber)` | `career-presenter.test` 與 `9d25b096` 的 `boardModel` 比對，只核准一處差異（`rgba` 全形頓號，UI-BOARD-SHADOW-01）；`support/dom-snapshot.mjs:45` 讀 `#bd-team > span`；`event-fix-e2e:48–49` 量 `bd-team` 版面盒 |
| 球團色（逐隊資料） | `docs/src/engine/league-catalog.js:30–64` `teamColorsByName`；`docs/src/data/jp-data.js` 的 `teams[].color`（NPB） | 屬資料，不是樣式；建構時 teamId 鍵覆蓋名稱鍵 | — |
| 分享圖配色 | `docs/src/ui/share-theme.js`（4 主題約 32 個 hex，`shareTagPalette()` 後備 `#302719`） | 與 `themes.css` 各自手動維護，不讀 CSS | `replay-share-theme.test` 斷言各主題 `bg` hex 與 12 組標籤對比 |
| 分享圖字體 | `docs/src/ui/share-image.js`，約 20 處 `c.font=` | 全為 `sans-serif`／`monospace` 字面值，不讀 `--sans`／`--mono`；無 `getComputedStyle` | 同上，逐像素比較 |

### 7.2 凍結與其他約束

- `tests/award-identity-policy.test.mjs` 的凍結清單取自 `287dd1a` 的 `git ls-tree docs/src`：當時已存在、且不在 `allowedB` 或個別例外的檔案，須與 `efd4710c` 逐位元組相同。本段相關檔案中只有 `share-theme.js` 與 `jp-data.js` 受凍結（現況與 `efd4710c` 相同）；`career-presenter.js`、`share-image.js`、`career-retirement.js`、`league-catalog.js` 在 `287dd1a` 不存在，不受凍結。`docs/styles/` 不在 `docs/src`，不受此測試凍結（scout 原稱上述 4 檔受凍結，抽查更正）。
- `display-preferences.test.mjs` 以 `--([\w-]+):(#[\da-f]+)` 取主題區塊內的 hex token 檢查對比；新增的主題 token 須維持 hex 直寫。
- 版面：`--space-scale` 只用於 `base.css:22`（`#dice` 的 gap）；padding／margin／gap 的 px 字面值多（scout 統計未核實，第 4 段計畫時重數）。`ui-foundation.test`、`career-movement-policy` 逐字比對部分 CSS。

### 7.3 使用者決定（2026-11-10）

1. 第 2 段採方案②：特性標籤改用 class＋token，並隨主題變色（有意的視覺變更，PATCH）。球團徽章改用 class＋token，外觀維持不變（依當時提示的選項內容；細部計畫時再確認）。`career-presenter.test` 的核准差異須追加。
2. 第 3 段的凍結檔案採方案ⓐ：在 `award-identity-policy.test` 為 `share-theme.js` 追加精確的核准 overlay（比照 `approvedReplayShareEdits`），不另開取代模組。canvas 字體是否改為 `--sans`（分享 PNG 像素改變、需等待 web font 載入）未決。（2026-11-11 由 §9 取代：canvas 字體移至 P4。）
3. 第 4 段未決；建議暫緩至有具體換版需求。（2026-11-11 由 §9 取代：模板包含非顏色項目，第 4 段改為 P4 實施。）
4. 各段仍各自一個 PR → `dev`；分支基準（等 PR #75 併入 dev，或疊在 `4fabbdc`）未決。

## 8. 第 2 段細部計畫（UI-DESIGN-TOKENS-02；2026-11-11，基準 `990d941`（dev `ca81755`＋紀錄 commit），VERSION 1.16.0）

- 分類：R2。不碰 `game.js`、RNG、`S`；但改共用測試基盤 `tests/support/dom-snapshot.mjs`（`game-view-dom-e2e`、`display-preferences-e2e` 共用），不適用純顯示例外，須跑 Quick；`game-view-dom-e2e` 屬 Full，定案碼跑一次本機 8 批 Full。
- 現況（scout 調查＋抽查）：特性標籤見 `career-retirement.js:276–285`；球團徽章見 `career-presenter.js:29–41`。`career-presenter.test:74` 以字串比對 `9d25b096` 的 `boardModel`；`dom-snapshot.mjs:45–55` 讀 `#bd-team > span` 的 inline `style.boxShadow`；`game-view-dom-e2e` 逐步比對 `#log`／`#board` outerHTML（基準預設 `4f39a73`），退休卡 `.tag` 的 `style` 原樣進入比對。`career-retirement.js`、`career-presenter.js`、`docs/styles/*` 均不受 `award-identity-policy.test` 凍結。

### 8.1 設計（D1～D7，使用者批准 2026-11-11）

| # | 決定 |
|---|---|
| D1 | 分支 `ui/design-tokens-02`，自 `990d941`（PR #76 紀錄 commit 疊在最底），`--no-track`，push 明寫 refspec |
| D2 | 特性標籤在 `.tag` 加分類 class：`tag-legend`（legend、taiwan）、`tag-goldcloth`、`tag-genius`、`tag-mrteam`、`tag-negative`、`tag-removed`；規則置於 `base.css` 的 `.tag` 旁；一般特性維持只有 `.tag` |
| D3 | `themes.css` 4 主題各定義 `--tag-{legend,goldcloth,genius,negative}-{bg,edge,text}`、`--tag-removed-{text,edge}`；line-through 與 `opacity:.4` 留在 class |
| D4 | standard、classic 沿用現值（外觀不變）；night、scoreboard 改深色底＋淺色字，色值於草稿算出並附 4 主題截圖，另經批准 |
| D5 | mrteam 4 主題皆維持白底；球團色以 `style="--team-color:#…"` 傳入，無色時仍退回 `#a71930` |
| D6 | 球團徽章改 `.team-badge`／`.team-badge-dot`＋token，4 主題外觀不變（白底、陰影、白色球團黑字、圓點 `#cccccc`）；球團色以 `--team-color` 傳入，非 PRO 維持 `var(--amber)` |
| D7 | PATCH 1.16.0 → 1.16.1；`config.js`、CHANGELOG、RELEASE_NOTES（`update-release-notes.mjs`）同步。（更正：`verify-modularization`、`award-identity-policy.test` 已改為動態讀取 `config.js` 的 VERSION，無需改測試字面值） |

### 8.2 測試（T1～T5）

| # | 檔案 | 變更 |
|---|---|---|
| T1 | `career-presenter.test` | 仍比對 `9d25b096` 的 `boardModel`，於 `rgba` 頓號修正外追加「舊 inline → 新 class」精確核准對照，每 fixture 斷言替換恰好一次；5 個 fixture 保留 |
| T2 | `support/dom-snapshot.mjs` | `BOARD_SHADOW_CONTRACT` 改以 `getComputedStyle` 檢查（兩側通用）；新增候選側限定投影（旗標 `__expectDesignTokens02`），先做結構契約，再把 `#bd-team` 與退休卡 `.tag` 投影回舊 inline 寫法，`game-view-dom-e2e` 維持差異 0 |
| T3 | 新 `design-tokens-02.test` | 7 個分類的 class 輸出；4 主題（含 standard 區塊）皆定義全部新 token；各主題各分類字色對底色 ≥ 4.5（removed 為刻意淡化，除外） |
| T4 | 新 `design-tokens-02-e2e` | 瀏覽器 computed style：徽章 4 主題與舊 inline 相同；特性標籤 standard／classic 與舊相同，night／scoreboard 隨主題改變 |
| T5 | 負控制 | T1～T4 的對照各自破壞須 FAIL |

### 8.3 流程

1. 草稿：實作＋T1～T4，算出 D4 深色色值，附 4 主題 × PC／手機截圖 → 使用者批准色值。
2. 定案：相關測試、Quick、本機 8 批 Full、reviewer，版本與文件更新，PR → `dev`。

### 8.4 結果（2026-11-11）

- 實作 commit `8086480`（自 `990d941`）。D4 深色色值經使用者批准（2026-11-11）：night legend `#3a300f`／`#b8902a`／`#f2cc5c`、goldcloth `#33320c`／`#a89a1e`／`#e8dc5a`、genius `#262d38`／`#7d8899`／`#ccd4de`、negative `#3d1a1d`／`#d9534f`／`#ff8a8a`、removed 字 `#9aa3ad`／框 `#6b7480`；scoreboard legend `#3b3512`／`#b8962e`／`#f0cd6a`、goldcloth `#34370f`／`#a39a22`／`#e6de66`、genius `#25362c`／`#8a9a90`／`#d3dbd5`、negative `#3d1c19`／`#d0574c`／`#ff9088`、removed 字 `#a2ad9a`／框 `#6b8273`。字色對底色 6.8～9.3（standard 舊色 5.9～6.7）。

| 驗證 | 結果 |
|---|---|
| `career-presenter.test`／`design-tokens-02.test`／`design-tokens-02-e2e` | 59／8 cases／80 項 computed style PASS |
| `game-view-dom-e2e`（基準 `4f39a73`） | 8 段生涯 PASS，差異 0 |
| 負控制 | NC1～NC7（presenter class、退休卡 class、standard token、night 對比、徽章 padding、night 未隨主題、白色圓點 token）全部 FAIL；每次還原以 shasum 核對。首輪因 zsh 不拆分變數未備份、突變累積，結果作廢並逐一反轉後以 bash 陣列重跑 |
| 抵達負控制 | NC8～NC10（`dom-snapshot` 投影的徽章、一般標籤、特殊標籤字串）全部 FAIL：fixture 生涯確實經過 PRO 徽章（2029）與退休卡一般／特殊標籤（2058） |
| 實機畫面（`yakyo-test-001` P 全生涯，4 主題 × 1280／390） | 退休卡：night／scoreboard 為深色變體，standard／classic 不變；看板 PRO 徽章截圖與改動前 `ca81755` 逐位元組相同（8／8）。390px 徽章折行為既有行為 |
| Quick | 89／89 PASS（新增 2 項） |
| 本機 Full（`local-full-batches.mjs`，8 批，HEAD `8086480`，基準 `origin/main` `dfc8ff7`） | `PASS`，`expected 116`、`acceptedPass 116`、`issues []`，plan 對照缺 0、多 0，8 批 exit 0，`sourceChanged false`，1,103 秒（macOS＋Brave 本機證據） |
| reviewer | 無阻擋性發現。低優先 2 項已處理：`CURRENT_SPEC.md` 標頭開發版號、本節 D7 敘述。範圍外註記：分享圖（canvas）的特性標籤色仍為 `share-image.js` 內的固定色，屬第 3 段（UI-DESIGN-TOKENS-03） |

- 未做：Linux CI Full、Preview、實機（手機）確認、main 發布。

## 9. 模板化路線（2026-11-11 使用者決定）

目標：能快速換模板。新增一套模板只需寫一個 CSS 主題區塊（約 12 個基礎色＋必要的覆寫）與主題清單一行；元件色自動推導，分享圖與測試自動跟上。使用者決定：①模板範圍包含顏色以外的字體、圓角、陰影、間距（P4 實施）；②支援主流瀏覽器，底線為 Baseline 2023（§9.3）；③依 P1 → P2 → P3 → P4 順序，各一個 PR → `dev`，各自細部計畫批准後實作。

### 9.1 現況阻礙（HEAD `1152c03`，grep）

1. 每個主題約 55 個手寫 hex（-02 的特性標籤占 14 個），沒有「基礎色 → 元件色」的分層。
2. 顏色來源有多份：`themes.css`、`share-theme.js`（受凍結）、`share-image.js` 的 `tagColor()`。值已不一致：`edge` 4 主題皆不同（例 standard `#c9828e` 對 `--edge` `#d9a1aa`）；`soft` 無對應 token；`dim`／`bad` 在 night／scoreboard 不同。`bg`／`panel`／`text`／`accent` 4 主題一致。
3. 主題清單寫死：`preferences.js:3` 的 `allowed.theme`；含 `scoreboard` 字樣的檔案共 14 個（產品 4、測試／測試腳本 10，部分附各主題 RGB 期待值）。
4. `display-preferences.test` 以 `--x:#hex` regex 取主題區塊的值算對比，主題區塊內不能用 `var()`／`color-mix()`。
5. token 名稱綁球場比喻（`--chalk`、`--amber`、`--clay`），換風格時名稱與實際顏色不符。
6. 非顏色：字級字面值分散（§1.3）；`docs/src` 的 inline style 約 30 處（`career-retirement.js` 15 處，多為 margin／text-align／flex；`player-ability.js` 的動態寬度屬正當 inline）；canvas 字體約 20 處為 `sans-serif`／`monospace` 字面值。

### 9.2 階段

| 階段 | BACKLOG | 內容 | 解決 | 外觀 |
|---|---|---|---|---|
| P1 單一來源 | UI-DESIGN-TOKENS-03 | 分享圖於繪製時讀目前主題的 CSS token（套到隱藏探測元素的 `color`，讀 `getComputedStyle` 取得已解析的 rgb）；與 CSS 不同的值改為 CSS 內的分享圖專用 token（值照現值）；JS 色表不再是來源。建議同時讓 night／scoreboard 的分享圖特性標籤改讀 -02 的 `--tag-*`（有意的視覺變更，PATCH），於 §10 批准 | §9.1-2 | standard 不變（1.11.0 像素比對維持）；night／scoreboard 標籤依批准 |
| P2 主題清單集中 | UI-DESIGN-TOKENS-04 | 主題 id 與名稱只定義一次；設定 UI 與測試由此清單迭代 | §9.1-3 | 不變 |
| P3 語意層＋推導 | UI-DESIGN-TOKENS-05 | 每主題只定義約 12 個基礎色（如 `--bg`、`--surface`、`--text`、`--text-muted`、`--accent`、`--good`、`--bad`、`--border`）；元件色在主題區塊外以 `color-mix(in oklab,…)` 推導，需手調的值（例：-02 已批准的深色標籤值）於該主題區塊覆寫；舊名保留為別名逐步替換；對比測試改為瀏覽器 computed style，迭代主題清單 | §9.1-1、4、5 | 預設不變（推導值須等於現值，否則覆寫為現值） |
| P4 非顏色模板 | UI-DESIGN-TOKENS-06 | 字體（含 canvas 改讀 `--sans`／`--mono`）、字級、圓角／陰影（第 1 段已有 token）、間距、JS 內 inline 版面值改 class | §9.1-6 | 細部計畫時決定 |

P3 完成後新增模板的步驟：寫基礎色 → 主題清單加一行 → 跑對比測試 → 只手調 FAIL 的值。

P3 注意：推導 token 的 computed color 不是 `rgb()`（實測 `oklab(…)`、`color(srgb …)`，見 §10.1 D1 更正）。P1 的分享圖讀值對這類格式走 canvas 讀回（e2e 已驗證 `color-mix()` srgb／oklab），但 canvas 讀回受反指紋干擾：預設 Brave 實測 RGB ±1；Firefox resistFingerprinting、Safari 未實測，若讀回 alpha 0 則分享圖無法產生。P3 須擇一：分享圖用的 token 維持 hex、或以數學轉換解析 `oklab()`／`color(srgb …)` 不經 canvas、或加後備。P3 的對比測試若讀 computed style，也須先轉成 sRGB。

### 9.3 瀏覽器底線

- Baseline 2023：Chrome／Edge 111+、Firefox 113+、Safari／iOS Safari 16.2+（`color-mix()` 支援起點）。不使用 relative color（`oklch(from …)`）等更新的語法。
- 限制：`color-mix()` 寫在自訂屬性（`--x:color-mix(…)`）再以 `var(--x)` 引用時，不支援的瀏覽器在計算值階段判為無效，不會退回前一行宣告。P3 的推導值在底線以下的瀏覽器會整個失效，此為接受的代價。`stadium-background.css` 直接寫在屬性上的 `color-mix()`（前一行純色後備）不受影響。
- 現況（scout 調查＋抽查）：`CURRENT_SPEC.md`、`AGENTS.md`、`docs/index.html` 均無最低瀏覽器版本記載；CI 只跑 Playwright 內建 Chromium，Firefox／Safari 只能於 Preview 手動確認。底線於第一個依賴它的階段（預定 P3）實作時寫入 `CURRENT_SPEC.md`。

### 9.4 對先前決定的影響

- §7.3-2 的 canvas 字體 → P4。§7.3-3（第 4 段暫緩）→ 改為 P4 實施。§3④（顏色不改名）→ P3 引入語意名稱，舊名保留為別名。§3③（字級 token）→ P4。
- 2026-11-11 討論中，-03 曾建議「保留 JS 色表＋一致性測試」（方案 A），因與模板化目標衝突（P1 後仍須拆除），改為 P1。
- 分支：-03 自 `1152c03`（`ui/design-tokens-02` HEAD）開 `ui/design-tokens-03`；PR #77 以 merge commit 併入後即為 `dev` 的祖先。push 待 PR #77 併入後另批。

### 9.5 P1 前置調查（2026-11-11，scout 唯讀調查；標 ✓ 者已以 grep／`git cat-file` 抽查）

1. ✓ `share-theme.js` 受凍結（`287dd1a` 存在，須與 `efd4710c` 相同），且不能刪除：`award-identity-policy.test:171` 對清單內每個檔案 `readFileSync`。修改須依 §7.3-2 方案ⓐ追加核准 overlay。✓ `share-image.js` 不受凍結（`287dd1a` 不存在）。
2. ✓ `verify-modularization.mjs:208–209` 逐字斷言 `share-image.js` 含 `imageColor=getSharePalette(theme)`、`share-theme.js` 含 `standard:{bg:'#fff8f8'`。
3. 繪製時機：`share-image.js:132` 以 `getDisplayPreferences().theme` 取主題；主題變更時 `preferences.js:49–56` 先 `apply()` 寫入 `data-theme`，再發 `yakyujinsei:displaychange`，`share-image.js:14–20` 的 listener 才重繪。分享圖只以目前主題繪製，繪製當下讀 computed style 可行。
4. 使用中的色值鍵：`bg`、`edge`、`text`、`dim`、`accent`、`soft`、`bad`；`panel` 未用於繪圖。`tagColor()`（`share-image.js:145–153`）7 類固定 hex，mrteam 為白底＋球團色（`TEAM_COLOR`，無色時 `imageColor.accent`），結果經 `shareTagPalette()` 調整對比（standard 原樣返回）。
5. `replay-share-theme-e2e` 的像素斷言：standard 主題、`rich()` fixture（含 legend、taiwan、goldcloth、genius、glass、mrteam 與已移除特性）在收入列以上與 `dc5ac871` 逐像素相同；4 主題各驗 (0,0) 像素 rgb；字級變更後 PNG 不變；下載／分享位元組與 PNG 相同。manifest 以 `--ui-only` 執行。
6. `replay-share-theme.test` 在 Node（無 DOM）呼叫 `getSharePalette()`／`shareTagPalette()`，斷言各主題 `bg`、8 個鍵、回傳副本與 12 組標籤對比。
7. `docs/src` 內 `share-image.js` 以外沒有 canvas／JS 側的顏色使用者。

## 10. P1 細部計畫（UI-DESIGN-TOKENS-03；2026-11-11，基準 `9956ca3`，VERSION 1.16.1）

- 分類：R2 純顯示變更例外（分享 PNG 配色）。不碰 `game.js`、RNG、`S`、共用測試基盤；測試變更限於期待值、核准 overlay 與新增 e2e。驗證：相關測試＋Quick＋4 主題 × PC／手機截圖＋reviewer；本機 Full 不跑（使用者決定，合併 `main` 前依既有流程）。
- 前置事實見 §9.5。另：standard 的 legend／goldcloth／genius／negative 標籤色與 `tagColor()` 相同，classic 的 `--tag-*` 與 standard 相同；`shareTagPalette()` 比較的是標籤自身底色與字色（非分享圖底色），以 regex 解析 6 位 hex，night／classic／scoreboard 皆會套用（例：classic 的已移除標籤字色現為後備 `#302719`）。

### 10.1 設計（D1～D8，使用者批准 2026-11-11）

| # | 決定 |
|---|---|
| D1 | `share-image.js` 內加讀值函式（B'）：透明容器內的隱藏探測元素以 `color:var(--token)` 解析 token。computed color 為不透明 `rgb()`（所有 hex token）時直接解析，不碰 canvas；其他格式（`color-mix()` 的 `oklab(…)`、`color(srgb …)`）畫到 1×1 canvas、以 `getImageData` 讀回 sRGB（先 `clearRect` 並設透明 `fillStyle`，無法解析的顏色讀回 alpha 0）。token 未定義、值無效（探測元素繼承透明）或非不透明時 throw，不靜默繼承。結果為 `#rrggbb`。單一使用者，不另開模組。（更正 2026-11-11：原案以 regex 只解析 `rgb()`；reviewer 指出格式依賴後實測 Chrome 157，`color-mix(in oklab,…)` 為 `oklab(…)`、`in srgb` 為 `color(srgb …)`，原案在 P3 會失效，使用者選 B（全部改 canvas 讀值）。第二次 reviewer 指出：無效 token 會繼承文字色；canvas 讀回受反指紋干擾。實測預設 Brave（Farbling 開啟）1×1 讀回 RGB ±1、alpha 255，B 會使 Brave 上 standard／classic 不再逐位元組相同。使用者 2026-11-12 批准 B'：rgb() 直接解析、其餘才走 canvas，並加透明容器） |
| D2 | `bg`→`--bg`、`text`→`--chalk`、`accent`→`--amber`；`edge`、`soft` 新增 `--share-edge`、`--share-soft`（值照現值）；`panel` 未使用，不對應 |
| D3 | ⓐ `dim`→`--dim`、`bad`→`--bad`（night／scoreboard 文字色微變） |
| D4 | legend（含 taiwan）／goldcloth／genius／negative 改讀 -02 的 `--tag-*`：standard／classic 不變，night／scoreboard 變深色 |
| D5 | ⓑ 一般特性與已移除標籤新增 `--share-tag-{bg,edge,text}`、`--share-tag-removed-{bg,edge,text}`；standard／classic 照現值，night／scoreboard 另算深色值，附截圖另經批准 |
| D6 | mrteam 維持白底＋球團色（無色時 `accent`）；所有標籤照舊經 `shareTagPalette()`（輸入 hex） |
| D7 | `share-theme.js` 以核准 overlay 移除 `palettes` 與 `getSharePalette`，只保留 `shareTagPalette`（主題判定改為明列 night／classic／scoreboard，P2 再改讀主題清單） |
| D8 | PATCH 1.16.1 → 1.16.2；`config.js`、CHANGELOG、RELEASE_NOTES（`update-release-notes.mjs`）、`CURRENT_SPEC.md` 標頭同步 |

### 10.2 測試（T1～T6）

| # | 檔案 | 變更 |
|---|---|---|
| T1 | `replay-share-theme.test` | 移除 `getSharePalette` 斷言；改測 D1 讀值與 rgb→hex（假 computed style、token 未定義 throw）；`shareTagPalette` 12 組對比保留 |
| T2 | `award-identity-policy.test` | `share-theme.js` 追加精確核准 overlay，每處替換恰好一次 |
| T3 | `verify-modularization.mjs:208–209` | 改斷言新讀值方式與 `share-theme.js` 已無色表 |
| T4 | 新 `design-tokens-03-e2e` | 4 主題各畫分享 PNG，與改動前 `9956ca3` 比較：standard／classic 逐位元組相同，night／scoreboard 不同；探測讀值等於期待 token 值 |
| T5 | `replay-share-theme-e2e` | 不修改；standard 與 1.11.0 像素比較須照樣 PASS |
| T6 | 負控制 | T1～T4 的對照各自破壞須 FAIL |

### 10.3 流程

1. 草稿：實作＋T1～T4，算出 D5 深色值，附 4 主題分享 PNG 截圖 → 使用者批准色值。
2. 定案：相關測試、Quick、截圖、reviewer，版本與文件更新，commit → push（PR #77 併入後另批）→ PR → `dev`。

### 10.4 結果（2026-11-12）

- 實作自 `9956ca3`，VERSION 1.16.1 → 1.16.2（PATCH）。D5 深色值經使用者批准（2026-11-11）：night 一般特性 `#21262d`／`#465365`／`#ff7187`、已移除 `#21262d`／`#6b7480`／`#9aa3ad`；scoreboard 一般特性 `#193d29`／`#557863`／`#f0c75e`、已移除 `#193d29`／`#6b8273`／`#a2ad9a`（沿用退休卡 HTML 同主題的 `.tag` 與 `--tag-removed-*`）。字色對底色 5.16～7.49。
- D1 經兩次修正為 B'（見 §10.1 D1 更正）。

| 驗證 | 結果 |
|---|---|
| `design-tokens-03-e2e`（基準 `9956ca3`，1280／390 × 4 主題） | 16 項 PASS：standard／classic 分享 PNG 逐位元組相同，night／scoreboard 改變；探測讀值等於 `themes.css` hex；night／scoreboard 每個標籤 token 與 standard 不同；`color-mix()` srgb／oklab 讀回與獨立 sRGB／OKLab 計算相差 ≤1；無效 token throw |
| `replay-share-theme-e2e --ui-only` | exit 0，standard 與 1.11.0 像素比較 PASS（T5，未修改） |
| `replay-share-theme.test`／`award-identity-policy.test`／`verify-modularization`／`display-preferences.test`／`design-tokens-02.test`／`design-tokens-02-e2e` | PASS（`award-identity-policy` 135 cases／0 FAIL；`replay-share-theme` 19 cases） |
| 負控制 | NC1～NC14 全部 FAIL（edge token 換掉、standard 標籤色、night token 缺、hex 補零、凍結檔改動、容器未移除、色頻順序、night 標籤回淺色、scoreboard 一般標籤回淺色、未重設透明 `fillStyle`、只解析 `rgb()`、無 `clearRect`、容器非透明、`rgb()` 走 canvas）。每次還原以 sha256 核對。NC8 初次在新 e2e 存活（只驗 PNG 有變），補「每個標籤 token 與 standard 不同」斷言後 FAIL；NC10、NC12 初次因假 canvas 不忽略無效 `fillStyle`、不疊加而存活或未測到，改假 canvas 後 FAIL；NC14 初次被前段斷言擋下，補對照值後由「rgb() 不建立 canvas」斷言 FAIL |
| 預設 Brave（Farbling 開啟）實測 | 1×1 canvas 讀回 RGB ±1、alpha 255（每 origin 固定）；B' 讀 4 主題 100 個 token 與 `themes.css` 全部一致。自動化 e2e 停用 Farbling，CI 不涵蓋此情境；「rgb() 不建立 canvas」由單元測試＋NC14 保證 |
| Quick | 90／90 PASS（新增 1 項；B' 定案碼，macOS＋Brave 本機） |
| reviewer | 3 輪。第 1 輪：regex 格式依賴 → 實測後改 B。第 2 輪：無效 token 繼承文字色、canvas 受反指紋干擾、假 canvas 不疊加 → B'。第 3 輪：前述皆關閉，無中以上發現；低：`replay-share-theme.test` 未斷言總件數（既有寫法，未改） |
| 對照圖 | `compare-night.png`、`compare-scoreboard.png` 與 16 張前後 PNG 存於 `.claude/reports/design-tokens-03/`（未 commit），供 PR 說明使用 |

- 未做：Linux CI Full、Preview、Firefox／Safari 實機、手機實機、本機 Full（使用者決定不跑）、main 發布。
- 追加修正（2026-11-12，-04 驗證時發現，`84b1e69`）：Full 限定的 `international-personal-stats-e2e`、`full-power-pitching-e2e`、`smallschool-c-e2e`、`trait-display-e2e` 以 stage6 `historical` 頁提供 7fd53e0 以前的 `game.js`（基準 `e602174`／`20920dd`／`0fd13c7`／`a0b880b`），其 `import { getSharePalette, shareTagPalette }` 在 D7 移除後連結失敗，`#btn-start` 不啟用、page.ready 逾時（本機於 `019a8e4` 重現 4 項 FAIL；`international-personal-stats-e2e` 35 PASS／15 FAIL）。Quick 不含這 4 項，P1 未跑 Full，事前的混合版本路由檢查漏列。修正：`tests/support/stage6-browser.mjs` 的 `historical` 分支另把 `share-theme.js` 指向 `efd4710c`（與 `9956ca3` 同 blob，凍結基準，在 `origin/main`）。修正後 4 項 PASS（`international-personal-stats-e2e` 50／0）、Quick 90／90 PASS（macOS＋Brave 本機）；reviewer 無中以上發現（低：pin 改用 `origin/main` 上的 `efd4710c`，已採納並重跑 `trait-display-e2e` PASS）。`84b1e69`／`0cc4500` 於 PR #78 合併（`7d08f0c`，併入 `019a8e4`）之後才 push，未含於該 merge。其後 code owner 於 `dev` 以 `86969a5` 修正（`routeHistoricalShareTheme`：各 e2e 以自身基準 SHA 提供 `share-theme.js`，另加 `scripts/test-historical-share-theme.mjs`）；-04 合併 `dev` 時移除 `84b1e69` 的路由，改採 `86969a5`。

## 11. P2 細部計畫（UI-DESIGN-TOKENS-04；2026-11-12，基準 `019a8e4`，VERSION 1.16.2）

- 分類：R2（共用 UI 控制碼、localStorage 正規化；外觀與行為不變）。不碰 `game.js`、RNG、`S`。依 AGENTS §9.3 不升版本。驗證：相關測試＋Quick＋reviewer。
- 現況（HEAD `019a8e4`，grep）：主題清單在 `docs/src/ui/preferences.js:3`（id）與 `:43`（名稱，依索引對應），該檔受凍結（`award-identity-policy.test` 要求等於 `efd4710c`，目前無 overlay）；`share-theme.js:3` 明列非 standard 主題（凍結）；`themes.css` 4 個主題區塊、`index.html` 預設 `data-theme="standard"`。BACKLOG 的「14 個檔案」現為 17 個，其中 `career-presenter.js:8` 註解、`test-manifest.mjs` 說明字串、`award-identity-policy.test:14` 的 -03 overlay 字串不是清單使用處。基準比較型 e2e 以 `git show` 提供完整舊 `docs` 樹，新增 import 不影響；凍結檢查只列 `287dd1a` 既有檔案，新模組不受限。

### 11.1 設計（D1～D8，使用者批准 2026-11-12）

| # | 決定 |
|---|---|
| D1 | 新增 `docs/src/ui/theme-catalog.js`：匯出 `THEMES`（凍結的 `{id,label}` 陣列）與 `THEME_IDS`。不取名 `themes.js`，避免與 `themes.css` 混淆 |
| D2 | `preferences.js` 3 處：加 import、`:3` 改 `theme:THEME_IDS`、`:43` 名稱改由 `THEMES` 取。`award-identity-policy.test` 追加精確核准 overlay。`DEFAULT_PREFERENCES.theme` 保留 `'standard'` 字面值，另以測試斷言等於清單第一項 |
| D3 | `share-theme.js:3` 不動（它是分享圖標籤對比補強的主題規則，非清單；改動須再碰凍結檔）。新增主題時須手動加入，`replay-share-theme.test` 改讀清單後會 FAIL 提示。P3 再處理 |
| D4 | CSS／HTML 維持另一份定義，新增雙向一致性測試：清單 id 與 `themes.css` 的 `:root[data-theme=…]` 區塊互相對應；`index.html` 預設值等於清單第一項 |
| D5 | 防空轉：完整 4 個 id 與 4 個名稱只在 `display-preferences.test` 一處寫死；負控制刪除一個主題須 FAIL |
| D6 | 無差異證明：4 主題下設定對話框 HTML 與 `019a8e4` 逐位元組相同；舊 localStorage 值的正規化結果相同 |
| D7 | 測試分類：全主題迭代（`display-preferences.test:7`、`display-preferences-e2e:72/101/152`、`board-menu:10`、`test-ui-desktop-acceptance:39`（頁內 evaluate，頁內 import 或以參數傳入）、`international-personal-stats-e2e:50`、`npb-return-e2e:50`）與非 standard 子集（`design-tokens-02.test:42`、`replay-share-theme.test:42`）改讀清單；每主題期待值（`replay-share-theme-e2e:42` 背景 RGB）保留手寫並斷言鍵等於清單；與舊版比較的紀錄（`-02-e2e:33`、`-03-e2e:34`、`design-tokens-02.test:55`）與單一主題測試不動 |
| D8 | 分支 `ui/design-tokens-04` 自 `019a8e4`（`--no-track`）；PR #78 併入 `dev` 後再 push、開 PR → `dev` |

### 11.2 測試（T1～T7，使用者批准 2026-11-12）

| # | 檔案 | 變更 |
|---|---|---|
| T1 | `display-preferences.test` | 寫死 4 個 id 與名稱並斷言等於 `THEMES`；`THEMES`／元素凍結；`DEFAULT_PREFERENCES.theme === THEME_IDS[0]`；`themes.css` 區塊集合與 `THEME_IDS` 雙向一致；`index.html` 的 `data-theme` 等於預設；`:7` 迴圈改讀清單 |
| T2 | `award-identity-policy.test` | `preferences.js` 追加 overlay，3 處替換各恰好一次 |
| T3 | D7 所列迭代處 | 改讀 `THEME_IDS`（子集以 `filter`） |
| T4 | `replay-share-theme-e2e` | 期待值的鍵等於 `THEME_IDS` |
| T5 | 無差異探測（scratchpad，不 commit） | 以 `019a8e4` 完整樹與新樹各開頁，4 主題的對話框 `outerHTML`、`html` 的 dataset 與一組舊 localStorage 值（合法、非法主題、`schemaVersion` 不符、損壞 JSON）的正規化結果逐字相同；結果記於 §11.4 |
| T6 | 負控制 | 清單刪一個主題、名稱對調、`themes.css` 少一區塊、`index.html` 預設改值、overlay 外多改一字、e2e 期待鍵少一個，各須 FAIL |
| T7 | 回歸 | 相關單元與 e2e（`display-preferences`、`design-tokens-02`、`replay-share-theme`、`npb-return`、`international-personal-stats`、`test-ui-desktop-acceptance`、使用 `board-menu` 者）＋Quick＋reviewer |

### 11.3 流程

1. 實作＋T1～T4 → T5 探測 → T6 負控制 → T7。
2. 文件：本節結果、BACKLOG -04 狀態；不升版本、不改 CHANGELOG／RELEASE_NOTES。commit → PR #78 併入後 push → PR → `dev`。

### 11.4 結果（2026-11-12）

- 實作於 `ui/design-tokens-04`，接在 `0cc4500`（PR #78 的 -03 追加修正）之後。不升版本（§9.3）；合併 `dev`（`a6b3bc7`）後沿用其 1.16.3。
- 變更：新增 `docs/src/ui/theme-catalog.js`；`preferences.js` 3 處（overlay 核准）；測試 9 檔改讀清單（T1、T3、T4），`award-identity-policy.test` 加 overlay（T2），另依 reviewer 低度建議把 `npb-return-e2e`、`replay-share-theme.test` 輸出訊息的件數改由清單長度計算（使用者批准）。

| 驗證 | 結果 |
|---|---|
| `display-preferences.test`／`design-tokens-02.test`／`replay-share-theme.test`／`award-identity-policy.test`（135 cases）／`verify-modularization`／`check-syntax` | PASS |
| T5 無差異探測（scratchpad，基準 `019a8e4` 完整樹） | PASS：Node 244 組 normalize／read 相同；瀏覽器 1280／390 × 9 種 localStorage 值 × 6 個快照（載入、選 4 主題、重設），對話框 `outerHTML`、勾選、名稱、`html` dataset、儲存值逐字相同；無 Console 錯誤／404 |
| T6 負控制 | 8 項全部 FAIL（清單刪主題 ×2〔單元＋T5〕、名稱對調 ×2、`themes.css` 少區塊、`index.html` 預設改值、overlay 外多改、e2e 期待鍵少一個），各由預期斷言報錯；sha256 核對還原 |
| 相關 e2e | `design-tokens-02-e2e`、`design-tokens-03-e2e`、`display-preferences-e2e`、`npb-return-e2e`、`replay-share-theme-e2e`、`event-fix-e2e`、`test-ui-desktop-acceptance`（60 組合）PASS；`international-personal-stats-e2e` 初次 FAIL（35／15），於 `019a8e4` 乾淨 worktree 同樣 35／15，判定為 -03 既有問題（§10.4 追加修正）；修正後重跑 50／0 PASS（T14 32 例） |
| Quick | 90／90 PASS（macOS＋Brave 本機，最終 -04 樹：-03 追加修正＋本段全部變更） |
| reviewer | 1 輪，無中以上發現；低：兩處輸出訊息件數寫死 → 已改，改後單獨重跑 `replay-share-theme.test`、`npb-return-e2e` PASS |

- 再合併 `dev`（`86969a5`）後：移除 -04 原帶的 `84b1e69` 路由、改採 `routeHistoricalShareTheme`。`scripts/test-historical-share-theme.mjs` 7 項 PASS；`international-personal-stats-e2e`（50／0）、`full-power-pitching-e2e`、`smallschool-c-e2e`、`trait-display-e2e` PASS；Quick 90／90 PASS（macOS＋Brave 本機）。
- 未做：Linux CI Full、Preview、Firefox／Safari 實機、本機 Full。
- 合併（2026-11-13 補記）：PR #81 併 `dev`（`b4239d4`）；dev `b327abe` 的 [Quick 43349490876](https://github.com/tt-chin/yakyujinsei/actions/runs/43349490876) 與手動 [Full 43349530209](https://github.com/tt-chin/yakyujinsei/actions/runs/43349530209)（8 批＋Aggregate）success，隨 1.16.4 經 PR #83 併 `main`（`ca3ee32`）。BACKLOG 依完成條件「PR併dev」結案；Preview、Firefox／Safari 實機仍未做。

## 12. P3 探測結果與待決（UI-DESIGN-TOKENS-05；2026-11-13，基準 `origin/dev` `b327abe`）

目的：P3 原訂「推導值須等於現值，否則覆寫為現值」（§9.2）。實作前先確認現有配色能否以共用規則推導；不能的話，決定要統一配色（外觀改變）還是只讓新主題用推導值。

### 12.1 方法

- 對 `themes.css` 的 50 個非基礎色 token，在 oklab／srgb 兩種空間、1～99% 整數比例，窮舉 `color-mix(A, B)` 的兩兩組合，取 4 主題平均 ΔE（OKLab）最小者作為「統一規則」。ΔE 取疊在該主題 `--bg` 與 `--chalk` 上兩者的較大值，半透明的差異也計入；約 0.02 為可察覺門檻。
- v1 素材：12 個基礎色（`--bg`、`--panel`、`--panel2`、`--edge`、`--chalk`、`--dim`、`--amber`、`--clay`、`--good`、`--bad`、`--blue`、`--control-edge`）＋ white／black／transparent。v2 另加 `gold`（取自各主題 `--tag-legend-edge`）與 `highlight`（取自 `--potential-marker` 不透明值；classic 無黃色，暫用 standard 值）。
- 顏色以 Node 依 CSS Color 4 公式計算，未經瀏覽器逐值實測；規則為機械搜尋的最近解，不是人工設計（例：`--tag-removed-text` 得到 `--blue` 混 `--gold`）。mock 元件為示意，不是遊戲實際畫面。
- 檔案：`tasks/design-tokens-05/` 的 v1／v2 × 4 主題截圖、v2 互動報告 `unify-compare.html`（本機開啟）與資料 `unify-data.json`。

### 12.2 結果

| 統一後與現值的最大 ΔE | v1 | v2 |
|---|---:|---:|
| ≤ 0.02（幾乎相同） | 5 | 6 |
| 0.02～0.05 | 16 | 19 |
| 0.05～0.1 | 16 | 15 |
| > 0.1（明顯不同） | 13 | 10 |

- 4 主題都能以同一規則完全重現的只有 `--action-bg-end`；`--board-bg-start` 與 `--panel` 相同。現值為逐主題手調。
- v2 主要改善標籤（`--tag-legend-edge` ΔE 0.154 → 0.002）。
- v2 仍 > 0.1 的：`--potential-marker`（0.283）、`--focus-ring`（0.197）——各主題刻意用不同色相（standard 紅、classic 藍、night 黃），規則無法統一；`--share-tag-edge`、陰影系（`--board-shadow`、`--shadow-color`、`--overlay-bg`；standard／classic 帶色調、night／scoreboard 為黑）、`--warning-edge`、`--metric-glow`、`--tag-goldcloth-text`、`--primary-button-end`。
- `display-preferences.test`／`design-tokens-02.test` 檢查的對比組合，現值與統一後皆無不合格。

### 12.3 方向（code owner）

| 選項 | 內容 | 外觀 |
|---|---|---|
| A 統一 | 以 v2 為起點，為元件色定規則並套用到 4 主題；焦點框、潛力標記、陰影需另行設計 | 改變（PATCH），-02 已批准的標籤色與 night／scoreboard 分享圖隨之改變 |
| B 只供新主題 | 推導公式寫在主題區塊外，現有 4 主題以現值覆寫 | 不變；新主題可由約 14 個基礎色起步，但不一致的現況保留 |
| C 暫停 P3 | 無具體新主題計畫時不做 | 不變 |

決定（2026-11-14，使用者轉達）：code owner 選 **A 統一**。§9.2 P3 以現值為準、外觀不變的前提不適用於 -05。細部計畫於本分支併入 `dev` 後，以最新 `dev` 另寫於 §13（v2 規則、焦點框／潛力標記／陰影的設計、允許差異、D／T 表）。UI 改版計畫（`tasks/UI_REDESIGN_PLAN.md`，PR #79）的階段 1a 即本項。

## 13. P3 細部計畫（UI-DESIGN-TOKENS-05；2026-11-14，基準 `origin/dev` `629addc`，VERSION 1.16.4）

狀態：**使用者 2026-11-14 批准並實作完成**。實作先在本機分支 `ui/design-tokens-05-impl`（自 `f54483d`）完成，之後依使用者決定併入 PR #85（與計畫同一個 PR）。結果見 §13.9。方向依 §12.3 A（code owner 2026-11-14 選定）；以下為使用者 2026-11-14 選定：焦點框與潛力標記保留各主題色相、列為基礎色；主按鈕與陰影的色調也列為基礎色（`--primary`、`--shadow-base`），陰影 token 以共用比例推導；§13.8 的 4 項待決已定案。

### 13.1 範圍與分級

- 目標：每個主題只寫 17 個基礎色；48 個元件色在主題區塊外以 `color-mix()` 規則推導，4 主題共用同一套規則。外觀改變（-02 已批准的標籤色、4 主題的分享圖都改變）。
- 分級：R2（純顯示例外，AGENTS §6.1）。只改 CSS token 與分享圖讀色，不改狀態、RNG、事件順序；`share-image.js` 的讀色改動限於把 computed color 轉成 sRGB。期待值的變更逐項列在 §13.4。
- 版本：PATCH（1.16.4 → 1.16.5，實作時以當時 `dev` 的 VERSION 為準）。
- 不在範圍：非顏色 token（-06）、新主題、UI 改版（`tasks/UI_REDESIGN_PLAN.md`）。

### 13.2 基礎色（每主題 17 個）

| 類別 | token |
|---|---|
| 既有 12 個 | `--bg`、`--panel`、`--panel2`、`--edge`、`--chalk`、`--dim`、`--amber`、`--clay`、`--good`、`--bad`、`--blue`、`--control-edge` |
| 新增 | `--gold`（值取自各主題現行 `--tag-legend-edge`） |
| 由元件色改列基礎色 | `--focus-ring`、`--potential-marker`（各主題刻意不同色相，值不變） |
| 新增（主按鈕、陰影） | `--primary`（值取自各主題現行 `--primary-button-start`）、`--shadow-base`（standard `#3a101780`、classic `#30271980`＝各自 `--chalk` 的 50% 透明度；night／scoreboard `#000`） |

- §12 v2 的 `highlight` 不採用：以 5% 為步進對所有組合重搜時，15 個基礎色（不含 `highlight`）與加上 `highlight` 的 16 個，ΔE > 0.1 的 token 都是 8 個（2026-11-14 scratchpad 搜尋，未另存檔）。
- `--primary`／`--shadow-base` 的理由：共用規則重現不了現值（§13.3「主按鈕」「陰影」）。以新增的 2 個基礎色（與其他基礎色或黑白混合）重搜全部 48 個 token，另有 `--start-glow`（0.073 → 0.052，`--primary` 混 `--panel2`）與 `--share-tag-edge`（0.169 → 0.100）可改善，不在本次範圍，未採用。
- `color-scheme` 與 `--disabled-opacity`（只在 standard 區塊）照舊。

### 13.3 推導規則

- 位置：`themes.css` 的 4 個主題區塊之後新增一個 `:root { … }` 區塊，放 48 條規則；主題區塊不再定義元件色。主題屬性在 `<html>` 上，規則在同一元素計算，故每個主題各自套用。
- 規則由機械搜尋取最近解（5% 步進、oklab／srgb），以下 3 條改用語意較清楚的規則（ΔE 相近）：`--tag-removed-text`（原為 `--blue` 混 `--gold`，改為 `--dim` 混 `--panel`）、`--tag-genius-edge`（原為白混黑的固定灰，改為 `--dim` 混 `--panel`）、`--tag-genius-bg`（改為 `--panel` 混 `--blue`）。
- 主按鈕：原草案 `color-mix(in oklab, var(--clay) 75%／60%, black)` 使 standard 由鮮紅變暗褐紅（ΔE 0.093／0.106）。以 15 個基礎色加黑白、srgb／oklab／oklch、5% 步進，含「兩色混合後再混黑」的兩層巢狀重搜：以 4 主題最大 ΔE 為目標，start 最佳 0.076，但 standard 的 OKLCH 彩度只剩約 0.10（現值 0.175）；以 standard 優先則 start 為 standard 0.066、scoreboard 0.139。4 主題現值的色相與彩度本來就不一致（standard 鮮紅、scoreboard 暗橄欖），故 start 改為基礎色 `--primary`，end 由其推導。
- 陰影：原草案 `--shadow-base: color-mix(in oklab, var(--bg) 40%, black)` 使 standard／classic 的遮罩由帶色調變灰（ΔE 0.112／0.121）；同上重搜，共用規則中仍以此式最佳，且透明度須 4 主題共用（現值亮色主題約為暗色主題的一半）。故 `--shadow-base` 改為帶透明度的基礎色，4 個陰影 token 為它與 `transparent` 的混合，比例共用。
- 每條規則、4 主題的現值／新值與 ΔE：`tasks/design-tokens-05/unify-v4.json`。Brave（`BraveFarbling` 關閉）實測草稿 4 主題 × 48 個 token 的 computed color（192 個值），與該檔的新值最大差 1／255；草稿 `themes.css` 的規則字串與該檔一致。下表 ΔE 為 OKLab 距離，取疊在該主題 `--bg` 與 `--chalk` 上兩者的較大值；約 0.02 為可察覺門檻。

| token | 規則 | ΔE std | night | classic | scoreboard |
|---|---|---:|---:|---:|---:|
| `--body-glow` | `color-mix(in oklab, var(--panel2) 85%, var(--control-edge))` | 0.043 | 0.024 | 0.016 | 0.010 |
| `--start-glow` | `color-mix(in oklab, var(--panel2) 85%, var(--control-edge))` | 0.073 | 0.024 | 0.016 | 0.010 |
| `--board-bg-start` | `var(--panel)` | 0.000 | 0.000 | 0.000 | 0.000 |
| `--board-bg-end` | `var(--panel2)` | 0.023 | 0.000 | 0.000 | 0.000 |
| `--action-bg-start` | `color-mix(in oklab, var(--panel) 95%, transparent)` | 0.016 | 0.013 | 0.009 | 0.012 |
| `--action-bg-end` | `color-mix(in oklab, var(--bg) 95%, transparent)` | 0.000 | 0.000 | 0.000 | 0.000 |
| `--metric-bg` | `color-mix(in srgb, var(--panel) 90%, var(--control-edge))` | 0.019 | 0.006 | 0.009 | 0.008 |
| `--bar-bg` | `color-mix(in oklab, var(--panel2) 90%, white)` | 0.028 | 0.021 | 0.010 | 0.020 |
| `--metric-glow` | `color-mix(in oklab, var(--clay) 5%, transparent)` | 0.094 | 0.024 | 0.019 | 0.025 |
| `--lamp-bg` | `color-mix(in srgb, var(--panel) 65%, var(--dim))` | 0.052 | 0.019 | 0.046 | 0.062 |
| `--primary-button-start` | `var(--primary)` | 0.000 | 0.000 | 0.000 | 0.000 |
| `--primary-button-end` | `color-mix(in oklab, var(--primary) 85%, black)` | 0.011 | 0.010 | 0.016 | 0.025 |
| `--primary-button-text` | `white` | 0.000 | 0.000 | 0.020 | 0.042 |
| `--primary-button-edge` | `color-mix(in srgb, var(--chalk) 20%, var(--amber))` | 0.039 | 0.053 | 0.046 | 0.026 |
| `--button-detail` | `color-mix(in srgb, var(--chalk) 45%, var(--control-edge))` | 0.059 | 0.003 | 0.045 | 0.011 |
| `--primary-button-detail` | `color-mix(in oklab, var(--clay) 5%, white)` | 0.005 | 0.005 | 0.012 | 0.032 |
| `--warning-edge` | `var(--bad)` | 0.137 | 0.000 | 0.000 | 0.000 |
| `--dice-bg` | `color-mix(in srgb, var(--panel) 95%, white)` | 0.000 | 0.002 | 0.001 | 0.012 |
| `--dice-shadow` | `color-mix(in oklab, var(--bad) 10%, transparent)` | 0.019 | 0.041 | 0.018 | 0.043 |
| `--dice-stitch` | `color-mix(in oklab, var(--gold) 30%, transparent)` | 0.038 | 0.035 | 0.040 | 0.039 |
| `--dice-six` | `var(--bad)` | 0.044 | 0.000 | 0.000 | 0.000 |
| `--bar-start` | `var(--clay)` | 0.072 | 0.000 | 0.000 | 0.000 |
| `--board-shadow` | `color-mix(in oklab, var(--shadow-base) 30%, transparent)` | 0.025 | 0.028 | 0.010 | 0.027 |
| `--shadow-color` | `color-mix(in oklab, var(--shadow-base) 55%, transparent)` | 0.005 | 0.013 | 0.005 | 0.013 |
| `--overlay-bg` | `color-mix(in oklab, var(--shadow-base) 60%, transparent)` | 0.025 | 0.000 | 0.022 | 0.000 |
| `--nav-shadow` | `color-mix(in oklab, var(--shadow-base) 20%, transparent)` | 0.017 | 0.000 | 0.005 | 0.000 |
| `--tag-legend-bg` | `color-mix(in srgb, var(--panel) 85%, var(--gold))` | 0.025 | 0.038 | 0.033 | 0.041 |
| `--tag-legend-edge` | `var(--gold)` | 0.000 | 0.000 | 0.000 | 0.000 |
| `--tag-legend-text` | `color-mix(in srgb, var(--chalk) 50%, var(--gold))` | 0.034 | 0.078 | 0.017 | 0.057 |
| `--tag-goldcloth-bg` | `color-mix(in srgb, var(--panel) 90%, var(--gold))` | 0.026 | 0.062 | 0.029 | 0.030 |
| `--tag-goldcloth-edge` | `color-mix(in srgb, var(--panel2) 5%, var(--gold))` | 0.045 | 0.044 | 0.044 | 0.032 |
| `--tag-goldcloth-text` | `color-mix(in srgb, var(--chalk) 50%, var(--gold))` | 0.054 | 0.105 | 0.031 | 0.090 |
| `--tag-genius-bg` | `color-mix(in srgb, var(--panel) 95%, var(--blue))` | 0.008 | 0.043 | 0.016 | 0.017 |
| `--tag-genius-edge` | `color-mix(in srgb, var(--dim) 65%, var(--panel))` | 0.052 | 0.035 | 0.070 | 0.039 |
| `--tag-genius-text` | `color-mix(in srgb, var(--chalk) 45%, var(--dim))` | 0.095 | 0.012 | 0.085 | 0.026 |
| `--tag-negative-bg` | `color-mix(in srgb, var(--panel) 95%, var(--bad))` | 0.010 | 0.057 | 0.015 | 0.090 |
| `--tag-negative-edge` | `color-mix(in srgb, var(--bg) 15%, var(--bad))` | 0.047 | 0.050 | 0.041 | 0.065 |
| `--tag-negative-text` | `color-mix(in srgb, var(--chalk) 15%, var(--bad))` | 0.032 | 0.007 | 0.043 | 0.004 |
| `--tag-removed-text` | `color-mix(in srgb, var(--dim) 80%, var(--panel))` | 0.044 | 0.045 | 0.046 | 0.028 |
| `--tag-removed-edge` | `color-mix(in srgb, var(--dim) 65%, black)` | 0.045 | 0.008 | 0.048 | 0.020 |
| `--share-edge` | `color-mix(in srgb, var(--panel2) 15%, var(--control-edge))` | 0.027 | 0.006 | 0.009 | 0.009 |
| `--share-soft` | `color-mix(in srgb, var(--panel2) 25%, var(--chalk))` | 0.019 | 0.031 | 0.030 | 0.008 |
| `--share-tag-bg` | `color-mix(in srgb, var(--panel) 95%, var(--chalk))` | 0.024 | 0.000 | 0.022 | 0.009 |
| `--share-tag-edge` | `var(--edge)` | 0.169 | 0.000 | 0.147 | 0.000 |
| `--share-tag-text` | `var(--amber)` | 0.085 | 0.000 | 0.051 | 0.000 |
| `--share-tag-removed-bg` | `color-mix(in srgb, var(--panel) 95%, var(--chalk))` | 0.014 | 0.000 | 0.014 | 0.009 |
| `--share-tag-removed-edge` | `color-mix(in srgb, var(--panel) 45%, var(--dim))` | 0.012 | 0.017 | 0.037 | 0.006 |
| `--share-tag-removed-text` | `color-mix(in srgb, var(--panel) 40%, var(--chalk))` | 0.017 | 0.020 | 0.028 | 0.029 |

統計：48 個中 ΔE ≤ 0.02 有 10 個、≤ 0.05 有 32 個、≤ 0.1 有 45 個；> 0.1 的 3 個是 `--warning-edge`、`--tag-goldcloth-text`、`--share-tag-edge`。完全不變的 4 個：`--board-bg-start`、`--action-bg-end`、`--tag-legend-edge`、`--primary-button-start`。

### 13.4 允許差異

| 項目 | 內容 |
|---|---|
| 畫面配色 | 4 主題的 48 個元件色改為 §13.3 的推導值；基礎色不變。對照截圖（左現值 `629addc`、右草稿）：`tasks/design-tokens-05/v4-{theme}.png` 為 `jp3-pitcher-02` 投手開局的能力分配畫面（1280／390px）；`v4-{theme}-detail.png` 為特性標籤、主按鈕、遮罩、記分板陰影的示意，以及 `design-tokens-03-e2e` 的分享圖（1280）。目視可見的差異：標籤底色略淡、night／scoreboard 的「短所」標籤與分享圖標籤變淡；主按鈕、遮罩、陰影與現值目視無差異 |
| 特性標籤 | standard／classic 的 13 個標籤 token 改變（-02 原為「外觀不變」）；night／scoreboard 仍與 standard 不同 |
| 骰子 | `--dice-shadow`、`--dice-stitch` 原只在 standard 定義、其他主題沿用 standard 值；改為各主題依規則推導 |
| 合併為同值的 token | 4 主題都相同：`--body-glow` ＝ `--start-glow`；`--warning-edge` ＝ `--dice-six` ＝ `--bad`；`--tag-legend-text` ＝ `--tag-goldcloth-text`；`--share-tag-bg` ＝ `--share-tag-removed-bg`。另 `--bar-start` ＝ `--clay`、`--share-tag-text` ＝ `--amber`、`--share-tag-edge` ＝ `--edge`。legend 與 goldcloth 只剩底色 85%／90% 之差，邊框也幾乎相同（standard `#c79520`／`#ca992a`；現值 `#c79520`／`#c5a800`） |
| 分享圖 | 4 主題的 PNG 都改變（`--share-*`、標籤色）；版面、文字、座標不變 |
| 對比 | `display-preferences.test` 的 34 組與 `design-tokens-02.test` 的 4 組標籤，另加 `--primary-button-detail` 對 `--primary-button-end`，以及分享圖的 `--share-tag-text`／`--share-tag-bg`、`--share-soft`／`--bg`，每主題 41 組，4 主題全部合格（主按鈕：文字對 start 6.18 以上、對 end 8.48 以上，detail 對 end 7.97 以上）。「已移除特性」文字對 `--panel` 為 standard 3.66、classic 3.77（standard 現值 3.45），未達 4.5；該標籤本來就以 `opacity:.4` 刻意淡化，不列為合格條件。分享圖：`--share-tag-text`／`--share-tag-bg` 5.77 以上，`--share-soft`／`--bg` 6.22 以上（納入 T2）；`--share-tag-removed-text`／`-bg` 為 3.65～5.57（現值 3.83～5.95，standard／classic 現值已低於 4.5，classic 3.83 → 3.65），比照畫面的「已移除」不列為合格條件 |
| 不變 | 狀態、選擇、RNG、DOM、顯示文字 |

### 13.5 D 表（變更檔案）

| # | 檔案 | 內容 |
|---|---|---|
| D1 | `docs/styles/themes.css` | §13.2 基礎色＋§13.3 規則區塊；主題區塊刪除元件色 |
| D2 | `docs/src/ui/share-image.js` | `readThemeColors` 先以 `parseComputedColor()` 依 CSS Color 4 公式轉換 `rgb()`／`rgba()`、`color(srgb …)`、`oklab()`、`oklch()`（含 %、alpha）；不透明才採用，半透明丟出 `SHARE_COLOR_UNRESOLVED`；只有無法辨識的格式才走 canvas。避免 Brave 等的 canvas 讀值雜訊影響推導 token（§9「P3 注意」）。`287dd1a` 之後新增的檔案，不受 `award-identity-policy` 凍結檢查 |
| D3 | `CURRENT_SPEC.md` | 色彩 token 表（約 257～278 行）改為基礎色＋推導規則；`color-mix()` 瀏覽器底線 Baseline 2023；分享圖讀色（約 574 行）補記數學轉換；對比自動檢查（約 286 行）改述檢查方式 |
| D4 | `docs/src/config.js`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`docs/src/data/release-notes.js`（`node scripts/update-release-notes.mjs` 產生） | 1.16.5 |
| D5 | `BACKLOG.md` | -05 狀態更新 |

### 13.6 T 表

| # | 測試 | 變更 |
|---|---|---|
| T1 | 新增 `tests/support/theme-colors.mjs` | Node 版 token 解析：讀 `themes.css` 的基礎色與規則，支援 `var()`、`color-mix(in srgb|oklab, A p%, B)`、`white`／`black`／`transparent`、8 位 hex（帶透明度的基礎色 `--shadow-base`）；無法解析的語法一律丟錯，不略過。供 T2～T5 共用 |
| T2 | `display-preferences.test` | 對比改用 T1 的解析值（半透明先疊在 `--bg` 上），同一組 pair 不再因 hex regex 而略過或 crash；新增分享圖 2 組（`--share-tag-text`／`--share-tag-bg`、`--share-soft`／`--bg`）；另斷言每個主題區塊恰有 17 個基礎色、規則區塊定義全部 48 個元件色、主題區塊不含元件色 |
| T3 | `design-tokens-02.test` | 「標籤 token 都是 hex」改為「都能由 T1 解析」；「standard／classic 保留舊色」改為等於 `unify-v4.json` 的新值（核准 golden）；「night／scoreboard 與 standard 不同」與標籤 4.5:1 保留 |
| T4 | `design-tokens-02-e2e` | standard／classic 的「computed style 等於舊 inline」改為：顏色等於 T1 的新值（±1／255），非顏色屬性仍等於舊 inline |
| T5 | `design-tokens-03-e2e` | `readThemeColors` 讀值改與 T1 的新值比較（±1／255），不再要求 hex。standard／classic「PNG 與 `9956ca3` 相同」改為：把舊版的分享 token 值寫入 `documentElement.style` 後產生的 PNG 與 `9956ca3` 位元組相同（證明版面與繪製路徑不變；寫入值取自 `629addc` 的 `themes.css`，`readThemeColors` 讀回值也須等於該值），另斷言 4 主題在新配色下的 PNG 與舊版不同。`--dt03-srgb`／`--dt03-oklab` 改斷言不經 canvas |
| T6 | `replay-share-theme.test` | 假 canvas 改用無法辨識的格式（如 `lab()`）測 canvas 後備；新增 `parseComputedColor` 案例：`rgb`／`rgba`／`color(srgb)`／`oklab`／`oklch`、%、alpha、未知格式回傳 `null`；`oklab` 不建立 canvas；半透明丟錯 |
| T7 | `verify-modularization` | `--bg:#fff8f8` 保留；`--button-detail`、`--primary-button-detail` 的 hex 斷言改為斷言其規則字串 |
| T8 | `replay-share-theme-e2e`（Full） | standard PNG 與 1.11.0 的像素比較：與 T5 相同，先把 1.11.0 standard 的分享色寫入 token 再產生 PNG，比較範圍與排除列不變 |
| T9 | 負控制 | 刪一條規則、改一個百分比、`oklab` 轉換改錯號、主題區塊混入元件色、降低一組對比、T5 不寫入舊色，各應 FAIL 於預期的斷言 |
| T10 | 回歸 | 相關單元與 e2e → Quick → 本機 Full → reviewer；PC／手機 4 主題截圖目視 |

### 13.7 草稿驗證（實作前，2026-11-14）

- scratchpad 草稿只含 D1（17 個基礎色）、D2，測試未改：Quick 90 項 84 PASS／6 FAIL；本機 8 批 Full 117 項 110 PASS／7 FAIL（117 項全部執行，missing／extra 0）。15 個基礎色的前一版草稿結果相同。
- FAIL 全部對應 T2～T8：`design-tokens-02-e2e`、`design-tokens-02.test`、`design-tokens-03-e2e`、`display-preferences.test`、`replay-share-theme.test`、`verify-modularization`，以及 Full 限定的 `replay-share-theme-e2e`。`game-view-dom-e2e`、`display-preferences-e2e` 與 4 項混合版本 E2E（`routeHistoricalShareTheme`）PASS。
- 草稿 4 主題 × 48 個 token 的 computed color 與 `unify-v4.json` 最大差 1／255，規則字串一致。
- T5 試作（scratch clone 上改寫的 `design-tokens-03-e2e`）：把 `629addc` 的 25 個分享 token 值寫入 `documentElement.style` 後，standard／classic × 1280／390 的 PNG 與 `9956ca3` 位元組相同（8 項 PASS），讀回值等於寫入值；不寫入時 FAIL 於「byte-identical to 9956ca3」（負控制時關閉讀值斷言，避免先 FAIL 在讀值）。
- macOS＋Brave（`BraveFarbling` 關閉）本機結果，非 CI。

### 13.8 決定（2026-11-14，使用者）

1. T5／T8：採「舊色寫入 token 後比較位元組」。試作見 §13.7。
2. 規則表：採用；主按鈕與陰影改列基礎色（`--primary`、`--shadow-base`，§13.2／§13.3），基礎色 15 → 17。
3. legend 與 goldcloth：不另區分（兩者都有文字標示）。
4. 分享圖的標籤對比：納入 T2；`--share-tag-removed-*` 比照畫面不列合格條件。

### 13.9 結果（2026-11-14，本機）

- 實作於本機分支 `ui/design-tokens-05-impl`（自 `f54483d`），之後併入 PR #85。VERSION 1.16.4 → 1.16.5（D4，PATCH；`dev` 仍為 1.16.4）。D1／D2 取自 §13.7 草稿（`themes.css` 與草稿逐位元組相同；48 條規則字串與 §13.3 表一致）。D2 依 reviewer 低度建議，指數改為 `[eE][+-]?\d+`，`rgba()` 的 alpha 也接受指數與 %。
- T1 `tests/support/theme-colors.mjs`：解析 4 主題 × 48 個值，與 `unify-v4.json` 最大差 1／255（只有浮點捨入，例如 alpha 0.3×255＝76.5）。`629addc` 的 245 個 hex 值解析回原值。新檔登記於 `scripts/test-manifest.mjs`（support）。
- 與 §13.6 的差異：
  - T2 另加核准 golden：48 條規則字串與 4 × 48 個解析值對照 `unify-v4.json`（±1／255）。原表只有標籤 token 有 golden，其他推導 token 改百分比時不會 FAIL。
  - T2 另加 `composite()` 單元斷言（reviewer 低度）。
  - T5 的 §13.7 試作檔已不存在，依 §13.6 重寫。
  - T5／T8 的「不經 canvas」以包裝 `document.createElement` 計數驗證。
- 負控制：N1～N11 共 13 項全部 FAIL 在預期的斷言，每項以 shasum 核對還原。
  - 刪規則、改 % ×2、oklab 號誤、主題區塊混入元件色、降低對比、非預乘混色、停用 oklab／`color(srgb)` 分支、T5 與 T8 不寫入舊色、指數 regex 退回、`composite` 改錯。
  - golden 原放在結構／對比斷言之前，會遮蔽 N4／N5，已移到其後。

| 驗證 | 結果 |
|---|---|
| T8 試作（`replay-share-theme-e2e --ui-only`） | PASS：寫入 `629addc` standard 分享色後與 1.11.0 像素比較 PASS，比較範圍與排除列未改 |
| 相關單元／e2e（T2～T8） | PASS：`design-tokens-02-e2e` 80 項、`design-tokens-03-e2e` 20 項（standard／classic 寫入舊色後與 `9956ca3` 逐位元組相同，4 主題推導色 PNG 皆不同） |
| Quick | 90／90 PASS（最終碼） |
| 本機 Full（8 批） | 117／117 PASS（最終碼；117 個不重複項目、117 份 log、`sourceChanged:false`；`test-results/local-full-2026-11-14T02-44-59-543Z-fa67408a`）。reviewer 修正前另有一次 117／117 PASS |
| reviewer | 1 輪，無正確性問題；低 2 項（`composite` 未被測、指數格式）已修，修後重跑 Quick／Full |
| D4 之後 | Quick 90／90 PASS（依使用者指示不重跑 Full；測試以動態方式讀 VERSION） |

- macOS＋Brave（`BraveFarbling` 關閉）本機結果，非 CI。對照截圖沿用 §13.4 的 `v4-*.png`（草稿 `themes.css` 與本次相同），本次未重拍。
- 未做：Linux CI（PR 指向 `dev`，feature 分支的 push 不觸發 CI）、Preview、Firefox／Safari 與手機實機。

## 14. P4 細部計畫（UI-DESIGN-TOKENS-06／-07；2026-11-14，基準 `ui/design-tokens-05` `01566e2`，VERSION 1.16.5）

狀態：**-06 已實作（§14.10），[PR #86](https://github.com/tt-chin/yakyujinsei/pull/86) 2026-11-14 併入 `dev`（`08b3aca`），dev push Quick 43580585124 成功，結案**；-07 細部計畫見 §15。分支 `ui/design-tokens-06`（自 `01566e2`；PR #85 於 2026-11-14 併入 `dev` `d5433e2` 後 fast-forward，對 `dev` 開 PR）。使用者 2026-11-14 決定：

1. canvas 字體改讀 `--sans`／`--mono`；像素比較先寫入舊字體再比位元組；分享圖不隨字級設定改變。
2. 字級與間距先以現值各做 token（外觀不變）；收斂為級距另立項。
3. 主題區塊可覆寫非顏色 token。
4. 拆為 -06（外觀不變）與 -07（canvas 字體，PNG 改變）；不併入 PR #85，維持 §9「各一個 PR」。

### 14.1 範圍與分級

- -06：字級、間距、圓角、陰影改 token（值不變）；`docs/src` 與 `index.html` 寫死的 inline 版面值改 class；主題區塊可覆寫非顏色 token。外觀不變，R2（純顯示例外，AGENTS §6.1）。版本不變（AGENTS §9.3，挙動不変）。
- -07：`share-image.js` 的 20 處 canvas 字體改讀 token，繪製前等待字型載入。分享 PNG 改變，R2，PATCH。
- 不在範圍：級距收斂、新主題、UI 改版（`tasks/UI_REDESIGN_PLAN.md`）。執行時計算的 inline 值保留：能力條寬度與潛力位置、球團色、受傷醒目（`cS`）、`display`／`pointer-events` 切換、`navigation`／`preferences`／`information-dialog` 的量測值。受 `award-identity-policy` 凍結的檔案（`preferences.js`、`navigation.js`、`seed-share.js`）中沒有 -06 要改的值。

### 14.2 現況（`01566e2`，grep 核對）

- 字級：CSS 59 處 `calc(Npx*var(--font-scale[,1]))`，19 種值：12px ×16、14px ×6、11／13／20px 各 ×5、15px ×4、10.5px ×3、12.5／13.5／17px 各 ×2、8／10／14.5／16／18／22／24／28／34px 各 ×1。另有 `.85em`（`board-menu.css`）、`1em`（`information.css`）、`11px`（`browser-save.css` `#save-live`，不隨字級設定）。§1.3 的舊統計已過時。
- 圓角未用 token：`base.css` 2px（菱形）、9px（骰子）、1px（潛力線）、7px（年俸明細連結）；`board-menu.css` 12px、0；inline 6px ×2（`index.html:49`、`career-retirement.js:352`）、8px（`share-image.js:355`）。
- 陰影未用 token：5 處（`.lamp.on i` 光暈、`.team-badge`、`.team-badge-dot`、`.die` inset、導覽選取 inset），顏色已是 token。
- 間距：CSS 160 處寫死（另 11 處已用 `var()`），基本值約 25 種，含負值、`auto`、`env()`。
- inline 固定值：
  - `index.html`：`#app-version`（37，含 `font-family:monospace`）、`#btn-start`（47）、`#seed-show`（49，含寫死色 `#fff`／`#a71930`／`#d9a1aa`，不隨主題）、`#seed-re`（50）、首頁 footer 與連結（53）、`#bd-tj`（58，位於 `#board` 內）。57／83／91／92 的 `display:none` 屬切換，不動。
  - `career-retirement.js`：82、198（`white-space`／`text-align`／`font-size:11px`）、199、204、205、229、231、330～333、352（`style.cssText`）。
  - `share-image.js`：355～360。
- canvas 字體：`share-image.js` 20 處（`sans-serif` 12、`monospace` 8），全部寫死。`docs/src` 與 `tests` 皆無 `document.fonts`。字型由 Google Fonts 載入（`index.html:20`，`display=swap`）。

### 14.3 -06 設計（草案）

| # | 檔案 | 內容 |
|---|---|---|
| D1 | `docs/styles/base.css` | `:root` 新增字級 token `--fs-<px>`（例 `--fs-12`、`--fs-10-5`；值 `calc(<px>px*var(--font-scale,1))`），59 處改 `var(--fs-*)`；陰影 token 5 個（`--shadow-glow`、`--shadow-team-badge`、`--shadow-team-dot`、`--shadow-die`、`--shadow-current`）；圓角 7／9／12px 新增元件名 token（W2 a）；間距不做 token（W1 c） |
| D2 | `docs/styles/themes.css` | 不實際覆寫；註明主題區塊可覆寫非顏色 token |
| D3 | `docs/styles/base.css`、`docs/index.html`、`docs/src/engine/career-retirement.js`、`docs/src/ui/share-image.js` | §14.2 的 inline 固定值移入 `base.css`，值照舊。有 id 的元素用 id 規則（`#app-version`、`#btn-start`、`#seed-show`、`#seed-re`、`#bd-tj`、`#sh-img`／`#sh-url`／`#sh-save`／`#sh-dl`、`#sh-out`），其餘用 class：`.home-credit`、`.retire-league`、`.cell-nowrap`、`.cell-left`、`.ama-line`、`.intl-heading`、`.share-actions`、`.replay-url-input`、`.share-image-preview`、`.share-image-actions`、`.share-image-hint`。原本 inline 勝過一般規則，class 規則加上容器前綴維持優先（例 `table.fin .cell-left` 勝過 `table.fin td{text-align:right}`）。受傷醒目改為只在受傷時輸出 `style` |
| D4 | 其他 `docs/styles/*.css` | 字級、圓角、陰影改用 D1 的 token。不改：`.85em`、`1em`（相對值）、`#save-live` 的 `11px`（原本就不隨字級設定）、`preferences.css` 的 `[style*="font-size:…"]` 3 條（舊版 DOM 混用的 E2E 仍會用到）、`calc(74px／58px * var(--font-scale))`（寬度，不是字級） |
| D5 | `CURRENT_SPEC.md` | token 表補非顏色 token 與主題覆寫規則 |
| D6 | `BACKLOG.md` | -06 狀態 |

### 14.4 測試耦合（已查）

- `game-view-dom-e2e`、`display-preferences-e2e`、`scripts/test-share-url-menu.mjs` 經 `tests/support/dom-snapshot.mjs` 比對每步 `#log`／`#act`／`#board` 的 outerHTML 與固定基準。退休卡（`career-retirement.js`，經 `card()` 進 `#log`）、`#sh-out`（`share-image.js`）與 `#bd-tj` 都在快照內，inline 改 class 會產生差異。-02 的前例：快照端把新 class 投影回舊 inline（`dom-snapshot.mjs` 約 40～110 行）。
- `display-preferences.test:45` 斷言主題區塊恰為 17 個基礎色；D2 需改為「17 個基礎色＋非顏色 token 白名單」。
- 原文比對：`career-movement-policy`（`base.css` 表格規則）、`ui-foundation`（`#main-nav`、`#view-home #log{flex:1}`）、`test-release-notes`（`information.css` 只允許特定新增）。改到這些規則時需列核准差異。`verify-modularization:191` 以 `[^>]*` 容許 `#app-version` 的屬性。
- 外觀不變的證明：新 E2E 在舊／新兩版逐元素比較 computed style（字級、間距、圓角、陰影、對齊、white-space），PC／手機 × 4 主題 × 3 種字級設定。

### 14.5 決定（2026-11-14，使用者：W1～W5 照建議）

- W1 間距：
  - a：全部現值各做一個 token（約 25 個 `--sp-<px>`，改 160 處，含複合值）。
  - b：只為出現 3 次以上的值做 token，其餘保留字面值。
  - c：-06 不做間距 token，併入級距收斂的項目。
  - **採 c**：數值命名的 token 在收斂時要再全部改名，160 處等於改兩次；`--space-scale`／密度 token 已涵蓋目前的調整需求。
- W2 圓角 7／9／12px（現有 token 為 4／6／8／10／14px）：
  - a：新增元件名 token（如 `--radius-die`、`--radius-menu`、`--radius-link`），外觀不變。
  - b：併入現有 token，外觀改 1～2px。
  - 0／1px／2px（重置、細線、裝飾）保留字面值。**採 a**。
- W3 `#seed-show` 的寫死色：**-06 照值移入 class**；改用主題 token 屬顏色變更，另記 BACKLOG。**更正（2026-11-14）**：前提有誤，`themes.css:86`（1.7.0 起）的 `!important` 規則已讓 `#seed-show` 隨主題變色，寫死色無效（瀏覽器 computed style 確認）；改為移除無效值，外觀不變，見 BACKLOG UI-SEED-SHOW-COLOR-01。
- W4 快照差異：
  - a：擴充 `dom-snapshot.mjs` 投影（-02 前例）。
  - b：inline 改 class 只做快照外的元素（首頁區），退休卡與分享區延後。
  - **採 a**。
- W5 `#app-version` 的 `font-family:monospace`：**-06 照值移入 class**；改 `var(--mono)` 屬字體變更，併入 -07。

### 14.6 -07 概要（細部 D／T 表於 -06 批准後另寫）

- `share-image.js`：`getComputedStyle` 讀 `--sans`／`--mono` 組成 `ctx.font`，px 值不變，不讀 `--font-scale`（`replay-share-theme-e2e:54` 的斷言維持）。
- 繪製前以 `document.fonts.load()` 等待所需字型（含 bold）。若分享圖產生因此改為非同步，`hof-first-ballot-e2e`、`championship-intl-e2e`、`trait-display-e2e` 與 `__shareTest` 的同步呼叫需調整（三者只攔截 `fillText` 文字並檢查 PNG 前綴，不比較像素）。
- 像素比較：`replay-share-theme-e2e`（1.11.0，`dc5ac871`）與 `design-tokens-03-e2e`（`9956ca3`）寫入舊字體（`sans-serif`／`monospace`）後比位元組，另斷言新字體 PNG 不同。字型能否載入依環境；CI 能否連到 Google Fonts 未確認，W6：比較時寫入舊字體，或擋掉 Google Fonts 請求。

### 14.7 流程

~~W1～W5 決定~~（已定）→ scratchpad 草稿（-06 D1～D4，測試不改）→ Quick＋本機 8 批 Full，FAIL 對應 T 表（§13.7 同法）→ 補 -06 T 表 → 批准 → 實作。

### 14.8 草稿驗證（2026-11-14，scratch worktree，基準 `d5433e2`）

- 草稿含 D1、D3、D4（`--fs-*` 19 個、59 處；陰影 token 5 個；圓角 token 3 個；inline 改 class／id 規則），測試未改：
  - Quick 90／90 PASS。
  - 本機 8 批 Full 116／117 PASS，117 項全部執行（missing／extra 0，`sourceChanged:false`）。唯一 FAIL 是 `game-view-dom-e2e`：step 0 的 `$.dom.board`（`#bd-tj` 沒有 `style`），與 §14.4 預期相同。
- 快照投影試作（T1）後，`game-view-dom-e2e` 單獨重跑 PASS（149 s）。第 1 版 FAIL 在退休卡（step 542）：`#sh-img`／`#sh-url` 的 `type` 屬性是執行時加上的，舊 DOM 的屬性順序為 class、id、style、type，投影需先移除 `type` 再補回。
- computed style 對照 probe（T2 試作）：舊版 `d5433e2` 與草稿，`#start`、`#board`、`#log` 每個元素的 41 個屬性加上相對於根元素的位置與尺寸；4 主題 × 3 字級 × 2 密度 × 1280／390 × 投手／野手，退休後產生分享圖並觸發手動 URL 輸入框。
  - 擋掉 Google Fonts 時差異 0（29,376 次比較），舊版對舊版的對照組也是 0。
  - 不擋時新舊與對照組都有 0.02～0.5px 的寬度差（web font 載入時序），因此 T2 須擋掉字型請求。
  - 未涵蓋 `.retire-league`（測試資料沒有 `S.stats`），T2 須補。
- macOS＋Brave（`BraveFarbling` 關閉）本機結果，非 CI。

### 14.9 T 表（-06，2026-11-14 批准）

| # | 測試 | 變更 |
|---|---|---|
| T1 | `tests/support/dom-snapshot.mjs`、`game-view-dom-e2e` | 基準的 `base.css` 沒有 `#bd-tj{` 時設 `__expectDesignTokens06`。`#board`：`#bd-tj` 只能有 id，投影回舊 inline。`#log`：逐一核對 §14.3 D3 的 class 元素的確切屬性，投影回舊 inline（`.replay-url-input` 以 `style.cssText` 重現舊的序列化；按鈕保留 `type` 的順序）；未列的 class 組合丟錯。投影計數須大於 0，避免靜默略過 |
| T2 | 新增 `tests/design-tokens-06-e2e.mjs`（Full，登記 manifest） | §14.8 probe 正式化：固定基準 `d5433e2` 對目前碼，computed style＋相對尺寸全等；擋 Google Fonts、停用 transition；補 `S.stats` 讓 `.retire-league` 出現；斷言每個新 class／id 規則至少命中 1 個元素 |
| T3 | 新增 `tests/design-tokens-06.test.mjs`（Quick） | `base.css` 定義 19 個 `--fs-*`，值皆為 `calc(<px>px * var(--font-scale,1))`；`docs/styles` 的字級宣告不再有 `calc(<n>px * var(--font-scale…))`；陰影 5 個、圓角 3 個 token 值等於原值；`index.html`、`career-retirement.js`、`share-image.js` 不再有 §14.2 的固定 inline 值（白名單：`--team-color`、受傷醒目、`display:none` 切換） |
| T4 | `display-preferences.test` | 主題區塊：顏色 token 恰為 17 個基礎色，另可含非顏色 token（白名單＝`base.css`／`preferences.css` 的 `:root` 非顏色 token）；fixture：`--radius-md:0` 通過、未知 token FAIL |
| T5 | 負控制 | 還原 `#bd-tj` inline → T1 FAIL；`.cell-left` 改 right → T2 FAIL；`--fs-12` 改 13px → T2、T3 FAIL；刪掉 `.ama-line` 投影 → T1 FAIL；投影計數歸零 → T1 FAIL；主題區塊放未知 token → T4 FAIL；T2 不擋字型 → 對照組出現差異（記錄，不列合格條件） |
| T6 | 回歸 | 相關單元與 e2e → Quick → 本機 Full → reviewer；PC／手機 × 4 主題截圖目視 |

### 14.10 實作結果（2026-11-14，`ui/design-tokens-06`，HEAD `5d0c849`＋工作樹）

- D1～D5 照 §14.3；D2 只在 `themes.css` 開頭加註解。與 T 表的差異：`var(--fs-*)` 為 64 處（原 59 處 `calc()`＋5 處由 inline 11／12px 移入的規則；舊值靠 `preferences.css` `[style*=…]` 縮放，等值）。
- T1：`#board` 每步投影 1 次、`#log` 至少 1 次，否則 FAIL。本機 Full 中 8 場生涯 board／log 計數：543／112、374／22、544／134、518／58（PC、手機各 4 場相同）。
- T2：`design-tokens-06-e2e` 33,024 次比較 0 差異，22 條新規則全部命中，約 21 秒。
- T5 負控制（scratch worktree 突變）：`#bd-tj` 還原 inline → `DESIGN_TOKENS_06_BOARD_CONTRACT`；刪 `.ama-line` 投影 → `DESIGN_TOKENS_06_CLASS_CONTRACT: TD.ama-line`；投影計數歸零 → `DESIGN_TOKENS_06_LOG_PROJECTION_COUNT`；`.cell-left` 改 right、`--fs-12` 改 13px → T2 差異；`--fs-12` 改 13px → T3 值斷言；主題區塊未知 token → T4。皆 exit 1。T2 不擋字型這次 0 差異（§14.8 時有 0.02～0.5px），時序依環境，維持擋字型。
- T6：相關測試 PASS → Quick 91／91 PASS → 本機 8 批 Full 119／119 PASS（expected 119，`sourceChanged:false`，1,130 s）→ reviewer 無發現。截圖（`.claude/reports/design-tokens-06/`，未納入版控）：首頁 PC／手機新舊位元組相同；退休卡 4 主題 × PC／手機的新舊差異只在手動 URL 輸入框的網址文字（測試伺服器路徑 `/old-P/`／`/new-P/`），其餘像素相同。
- macOS＋Brave（`BraveFarbling` 關閉）本機結果，非 CI。
- 2026-11-14 PR #86 併入 `dev`（`08b3aca`，樹與 `d434674` 相同），dev push [Quick 43580585124](https://github.com/tt-chin/yakyujinsei/actions/runs/43580585124) 成功；4 主題 × PC／手機 Preview 畫面未確認。

## 15. -07 細部計畫（UI-DESIGN-TOKENS-07；2026-11-14，基準 `dev` `08b3aca`，VERSION 1.16.5）

狀態：**W6／W7 與 D／T 表 2026-11-14 批准（使用者），已實作、本機驗證完成（§15.5），`102f5bf` 開 [PR #87](https://github.com/tt-chin/yakyujinsei/pull/87)，2026-11-14 併入 `dev`（`62f80c0`），dev push [Quick 43590931500](https://github.com/tt-chin/yakyujinsei/actions/runs/43590931500) 成功，結案；4 主題 × PC／手機 Preview 畫面未確認**；分支 `ui/design-tokens-07`（自 `08b3aca`）。分級 R2（分享 PNG 改變、按鈕的處理順序改為等待字型；S、RNG、DOM 結構不變），版本 PATCH 1.16.6。

### 15.1 決定（2026-11-14，使用者）

- **W6（像素比較）**：比較側把 `--sans`／`--mono` 寫回 `sans-serif`／`monospace` 後與舊 PNG 位元組相同，證明圖的唯一變化是字型。只擋 Google Fonts 不夠（macOS 會改用 Hiragino，仍與 `sans-serif` 不同）。「新字型 PNG 與舊 PNG 不同」不作合格條件（字型載入成功、改用備用字型、canvas 拒收錯誤字串都會不同）；改以 `fillText` 時的 `ctx.font` 等於 token 判定，與網路無關。
- **W7（等待字型）**：B，`render` 改為非同步。順序固定為「收集文字 → 等字型 → 量寬並繪製」（換行、自動縮字依賴 `measureText`；Noto Sans JP 以 unicode-range 分檔，須以實際文字載入），由繪製程式自己負責。另加逾時改用現有字型繪製，並以世代編號丟棄過期的重畫。

### 15.2 草稿驗證（scratch worktree，基準 `d434674`＝`08b3aca` 的樹）

- 草稿只改 `share-image.js`、`career-retirement.js`、`game.js`，測試未改：Quick 89／91（`design-tokens-03-e2e`：同步 hook；`event-integration.test`：exit null，`.ips` 為 SIGSEGV、Heap／MarkCompact，單獨重跑 3 次 PASS，FAIL 保留）；本機 8 批 Full 112／119，119 項全部執行（missing／extra 0，`sourceChanged:false`），7 項 FAIL 皆為 `shareImage([],out)` 後同步讀 `out.querySelector('img').src`（`Cannot read properties of null`）：`championship-intl-e2e`、`design-tokens-03-e2e`、`event-system-e2e`、`income-display-e2e`、`replay-share-theme-e2e`、`trait-display-e2e`、`trait-system-e2e`。
- 7 個 hook 補 `await` 後：5 項 PASS，2 項像素比較 FAIL（預期）；以空 CSS 回應 Google Fonts（`abort` 會產生測試不允許的 console 錯誤）時 5 項亦 PASS。W6 原型（比較側寫入舊字體）：2 項像素比較 PASS（位元組相同）。
- 草稿中發現：等待後檢查 `out.isConnected` 會使未放入 document 的容器不繪製（`income-display-e2e` 的 hook，舊碼照畫），已移除，只留世代編號。
- 失敗模式 probe（1280，投手）：字型可載入，首次 316～436 ms（Plex Mono 於等待中才載入）；樣式表被擋，`fonts.load` 回傳 0 個 face，10 ms；字型檔被擋，`fonts.load` reject `NetworkError`，捕捉後繪製，11 ms；字型檔卡住，3,033 ms 後繪製，第 2 次 9 ms。四者皆產生圖片，無頁面錯誤。
- 突變（拿掉字型等待）：只有 `replay-share-theme-e2e:50` 因載入時序偶然 FAIL，其餘 PASS，故須 T4 的確定性測試。
- macOS＋Brave（`BraveFarbling` 關閉）本機結果，非 CI。

### 15.3 D 表

| # | 檔案 | 變更 |
|---|---|---|
| D1 | `docs/src/ui/share-image.js` | 新增 `readThemeFonts()`（讀 `--sans`／`--mono`、去空白，缺少時丟 `SHARE_FONT_TOKEN_MISSING`）；`render` 改為非同步：收集輪（只遮蔽該臨時 context 的 `fillText`，不設 canvas 尺寸、不輸出）→ 以「粗細＋字族」分組、帶實際文字 `document.fonts.load()`（reject 捕捉；逾時 3 秒，逾時一次後本工作階段不再等）→ 世代編號不符則放棄 → 繪製。20 處字體字串改用 token，px 不變、不讀 `--font-scale`。主題切換重畫加 `.catch(console.error)` |
| D2 | `docs/src/engine/career-retirement.js` | rAF 回呼改 `async`、`await shareImage(...)`；`archiveTraitResults()` 維持在等待之前 |
| D3 | `docs/src/engine/game.js` | `shareImage` wrapper 回傳 promise |
| D4 | 版本與文件 | 1.16.6：`config.js`、`CHANGELOG.md`、`RELEASE_NOTES.md`＋`update-release-notes.mjs`、`CURRENT_SPEC.md`（頁首、共有画像の字體一句）、BACKLOG -07 |

允許差異：分享 PNG 的字形、換行、自動縮字與可能的圖高；圖於字型等待後出現（首次最多約 3 秒）。S、RNG、DOM 結構不變。

### 15.4 T 表

| # | 測試 | 變更 |
|---|---|---|
| T1 | 7 個 e2e 的 hook（§15.2） | `async`／`await shareImage`（機械修改；舊基準側 `await undefined` 不受影響） |
| T2 | `design-tokens-03-e2e`、`replay-share-theme-e2e` | 比較側寫入 `--sans:sans-serif`、`--mono:monospace`，維持位元組相同（W6） |
| T3 | `replay-share-theme-e2e:50` | 切換主題後等重畫完成再讀 `src`（改非同步後的競態） |
| T4 | 新增 `tests/design-tokens-07-e2e.mjs`（Full） | Google Fonts CSS 以假 `@font-face` 回應、攔住假字型檔請求，不用網路：①攔住時點 `#sh-img` 無圖、按鈕為作成中，放行（404）後才出圖，按鈕在圖出現後才變 ✅；②一直卡住時約 3 秒後出圖、第 2 次立即；③空樣式表時立即出圖；④每次 `fillText` 的 `font` 字族等於 token；⑤攔住時切換主題，最後只留最新主題的圖 |
| T5 | 新增 `tests/design-tokens-07.test.mjs`（Quick） | 無 `sans-serif'`／`monospace'` 字面值、20 處用 token；`readThemeFonts` 去空白、缺少時丟錯 |
| T6 | 負控制 | 拿掉等待 → T4①；拿掉 wrapper 的 `return` → T4①；拿掉世代編號 → T4⑤；拿掉逾時記憶 → T4②；還原字面值 → T4④、T5；拿掉舊字體寫入 → T2。各須在該斷言 FAIL |
| T7 | 回歸 | 相關單元與 e2e → Quick → 本機 8 批 Full → reviewer → 4 主題 × PC／手機新舊截圖 |

### 15.5 實作結果（2026-11-14，`ui/design-tokens-07`，HEAD `5b704c2`＋工作樹）

- D1～D4 照 §15.3（D1 與 §15.2 草稿相同）。T4 逾時情境的上限依 reviewer 意見由 6 秒放寬為 10 秒（下限 2.8 秒不變）。
- T4：`design-tokens-07-e2e` 4 項 PASS，約 7 秒（攔住→放行、卡住：首次約 3.7 秒、第 2 次約 10 ms、空樣式表：約 50 ms、26 次 `fillText` 皆為 token 字族、兩次描畫只寫入 1 次）。T5：`design-tokens-07.test` 4 項 PASS。
- T6 負控制（scratch worktree 突變、還原後比對雜湊）：拿掉等待 → T4①「no image while the font files are held」；拿掉 wrapper 的 `return` → T4①「button still says 作成中」；拿掉世代編號 → T4⑤「only one render writes the container」；拿掉逾時記憶 → T4②「second render does not wait again」（3,023 ms）；還原字面值 → T5 `doesNotMatch`、T4④「every fillText font is a token family list」；拿掉舊字體寫入 → `design-tokens-03-e2e:108`、`replay-share-theme-e2e` 位元組比較。皆 exit 1、`ERR_ASSERTION`。
- T7：相關測試 PASS → Quick 92／92 PASS（T4 上限放寬前；該檔只在 Full）→ 本機 8 批 Full 121／121 PASS（expected 121，missing／extra 0，`sourceChanged:false`，放寬後的定案碼）→ reviewer 無中以上發現（low 3 項：描畫兩次的成本、兩次 `getState()` 之間的等待、T4 上限過緊；第 3 項已改）。截圖（`.claude/reports/design-tokens-07/`，未納入版控）：基準 `08b3aca` 對工作樹，4 主題 × 1280／390 × 投手／野手，16 組 PNG 尺寸相同（1840×932），字形改為 Noto Sans JP／IBM Plex Mono，版面位置不變。
- 追加（2026-11-14，使用者批准，T 表外的測試修正）：①`design-tokens-03-e2e` 的 new 側也寫入通用字體，使「新 PNG 與基準不同」只反映顏色（改前字型差異就會讓它成立）；負控制：new 側在繪製時寫入 1.16.4 顏色 → `share PNG must follow the derived theme tokens` FAIL（第一版負控制的顏色殘留到後續 probe 檢查，先在 `--share-edge` 斷言 FAIL，改為繪製後移除再重做）。②`replay-share-theme-e2e` 的主題迴圈 context 以空 CSS 回應 Google Fonts，兩次 standard 的位元組比較不受字型載入時序影響。兩項修正後再跑本機 8 批 Full 121／121 PASS（expected 121，missing／extra 0，`sourceChanged:false`），為最終結果；前一次 121／121 保留為修正前紀錄。
- 內容多的卡片（35 條頭銜、35 年年表、長球團名，standard／1280／投手、野手，scratch，未納入版控）：新舊 PNG 高度相同（1840×3444），兩欄換行、年表截斷無重疊。
- macOS＋Brave（`BraveFarbling` 關閉）本機結果，非 CI。

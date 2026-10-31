# 設計系統（表示 token）計畫

狀態：第 1 段已核准（2026-10-24，§3 六點皆照建議；同日依 `357e852` 重掃 §1，追加 §2.2 漏列值處理、版本改為 1.13.6，經使用者核准），已實作（`fcb22a9`，結果見 §6），待 PR #26 合併；第 2～4 段未計畫。本文件只規劃表示層；不改遊戲規則、RNG、`S`、DOM 結構與順序（AGENTS §2）。不引入 build 工具、框架或 npm 依賴（AGENTS §5）：token 只用純 CSS 變數，必要時另加 JS 模組供 canvas 讀取。

## 0. 總路線

| 段 | 內容 | 預估分級 | 狀態 |
|---|---|---|---|
| 1 | token 盤點、補非顏色 token、修正字體指定 | L1／R2 | 本文件 §2，已核准，未實作 |
| 2 | 元件化：特性標籤、球團徽章改用 class＋token，移除 `game.js` 的 hex | L2／R2 | 未計畫 |
| 3 | 分享圖：`share-theme.js` 與 canvas 字體改讀同一份 token | L2／R2 | 未計畫 |
| 4 | 版面 token（spacing、border 等），之後換模板以換 token 為主 | L2 | 未計畫 |

各段各自一個 PR → `dev`，分開驗收。

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

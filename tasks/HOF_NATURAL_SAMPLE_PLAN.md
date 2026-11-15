# HOF 自然樣本與投手平衡：研究路線計畫（草案）

狀態：**草案，H1～H4 待使用者決定；未授權實作。**
對應：BACKLOG `HOF-NATURAL-SAMPLE-01`（補足自然生涯樣本，**不修改殿堂規則**）、`HOF-PITCHER-BALANCE-01`（RESEARCH_ONLY，只調查 SP／MR／CL，不調係數）。上位規格：[HOF_JERSEY_APPROVED_SPEC.md](HOF_JERSEY_APPROVED_SPEC.md) §3。
調查基準：`origin/dev` `1494a24`（1.16.10）。

## 1. 現況

- **研究工具** `tests/retirement-hof-pilot.mjs`（只在 `audit` 模式，約 60 秒）：以真實瀏覽器跑完整生涯，不強制狀態或結果。固定 25 個 seed（`hof111-pilot-01`～`25`，守備位置依序 P／P／C／IF／OF）× 2 種策略，最後重放前 2 條，比對最終狀態 digest 與操作 digest。
  - `balanced-stay`：能力由低往高分配，遇到去留一律「残留」。
  - `ordered-overseas`：看到含「海外／台湾／韓国／KBO／米国／メジャー／3A」的按鈕就選。
- **分析工具** `retirement-hof-analysis.mjs`：讀研究工具輸出的 JSON 重算評分，不跑瀏覽器。
- **既有樣本**（[1.11.1 報告](../docs/reviews/RETIREMENT_HOF_BALANCE_AUDIT_V1_11_1.md)，`b439f8b`）：50 條生涯，一軍到達 NPB 19、CPBL 11、**KBO 0、MLB 0**。報告已指出「須新增能在真實選項中自然抵達的策略」。之後 1.16.0 改了殿堂政策（只計當聯盟一軍），舊資料不能直接沿用。
- **到不了 KBO／MLB 的結構性原因**（`career-movement.js`）：
  - NPB1 的跨聯盟 offer：KBO1 需 `lastD>=1`，CPBL1 需 `0`，MLB 需 `2`。海外 FA 路線：KBO 需 `o>=47`，MLB 需 `o>=60` 且 `d>=2`。
  - `balanced-stay` 一律選留隊，結構上永遠到不了；`ordered-overseas` 能力平均分配，OVR 很難達到 60。
- **投手評分**（`hall-of-fame-tier-policy.js:6`）：`W*13+SV*6+SO*0.9+IP*0.35`，不分角色。角色判定在 `game.js:135`（`sta>=52` 為 SP）。存檔只有 `S.roleYears`，沒有分角色的成績；研究工具的 hook `__hofSeasons` 每季記錄 `role` 與成績，可用來分析。

## 2. 第 1 步結果（2026-11-15，macOS＋Brave 157，`1494a24`）

- 原版研究工具，`--seeds=hof111-pilot-01,hof111-pilot-04`（4 條生涯）：4 條都跑完，但重放斷言 `full game replay state` **FAIL**（exit 1）。
- 原因：1.16.10 的 UI-PLAYER-RANDOM-NAME-01 讓空白姓名用 `crypto.getRandomValues` 隨機產生（規格明定「同seed新生涯允許姓名不同」），研究工具沒有填名字，兩次姓名不同。屬「承認済み仕様變更による旧期待値」，不是遊戲 bug。
- 驗證：暫存副本只在開始前填入固定名字，其他不變 → 4 條跑完、重放 PASS、exit 0，RNG 次數與原版相同。
- 4 條都沒有到達 KBO1／MLB（一軍只到過 NPB1、CPBL1）。

## 3. 其他入口排查（同原因）

`d7817ad` 已修正 Full 的回歸測試，做法是開始前依守備位置填固定名字：`{P:'投山翔太',C:'強肩剛',IF:'守田巧',OF:'走川隼人'}`。其餘入口：

| 入口 | 結果 |
|---|---|
| `retirement-hof-pilot`（audit） | **FAIL**（已實際執行，見 §2） |
| `championship-intl-e2e`、`trait-system-e2e` 的跨執行重放區塊 | Quick／Full 都帶 `--ui-only`，該區塊**不會執行**；只在手動不帶 `--ui-only` 時，兩次新生涯的完整 S 比對會因姓名不同而失敗（**讀程式碼判斷，未實際執行**） |
| 其他使用 `stage6-browser.mjs`、已填固定名、只比對單次執行或白名單欄位的入口 | 讀程式碼判斷為不受影響 |

## 4. 研究路線（只改研究工具，屬 `audit`，不進 Quick／Full，不改遊戲）

1. **S1 修正研究工具的姓名**：依 `d7817ad` 的做法填入固定名字。重放斷言保持不變。負控制：拿掉填名 → 重放斷言 FAIL。
2. **S2 新增目標策略**：只選畫面上真實出現的選項，不改寫狀態。
   - `target-kbo`、`target-mlb`：去留畫面只挑指定聯盟的 offer，沒有就留隊；能力優先分配到該守備位置的主要能力，以提高 OVR。
   - 投手：`pitcher-sp`（優先 stamina，以維持 SP）、`pitcher-rp`（stamina 以外優先）。
   - 各策略的能力優先表在實作前列出，請使用者確認。
3. **S3 小批量試跑並推估規模**：例如 25 個 seed × 6 種策略＝150 條。依聯盟統計一軍到達與主職涯數，推算湊到 4,000 條有效生涯需要多少起始生涯。輸出放 `test-results/`（不進版控），摘要寫入 `docs/reviews/`。
4. **S4 投手角色分析**：用 `__hofSeasons` 的每季角色，按 SP／MR／CL 分組看評分分佈、W／SV／SO／IP 的貢獻比例與門檻到達率。只出報告，不改係數。
5. **S5 擴大到 4,000 條**：依 S3 的推估另行決定，包括執行時間與執行環境。

## 5. 待使用者決定

| # | 項目 | 建議 |
|---|---|---|
| H1 | 研究工具的姓名處理 | 依 `d7817ad` 填固定名字；不改 digest 的比對範圍 |
| H2 | 策略組合 | S2 的 4 種，加上原有 2 種，共 6 種 |
| H3 | S3 的批量 | 25 seed × 6 策略＝150 條 |
| H4 | `championship-intl-e2e`、`trait-system-e2e` 手動模式的重放區塊 | 不在本研究線處理，另立項或在下次碰到這兩個入口時修正 |

## 6. 驗證與分類

- S1、S2 只改 `tests/retirement-hof-pilot.mjs`（`audit` 入口），不影響製品與 Quick／Full 的執行路徑。驗證方式：該入口自身的小批量執行、重放 PASS、負控制、`node scripts/test.mjs list` 的模式不變。
- 不改遊戲、殿堂規則、RNG 與既有測試的期待值；不升版本。

# HOF 自然樣本與投手平衡：研究路線計畫（草案）

狀態：**第二版（2026-11-15 依 code owner 建議改寫）。H1～H4 已批准（code owner 於 PR #95 06:53 留言確認為已決定）。2026-11-21 使用者授權並實作 S1 與 H4（見 §7）。2026-11-22 S2 規則草案（§8）經使用者確認，經 [PR #118](https://github.com/tt-chin/yakyujinsei/pull/118) 提交 code owner 決定後續（已併 dev）；同日另一版 S2 規則表 D1～D7（§8b）經使用者核准並實作（PR #120），S3b 第一輪已執行（§9）；兩份以哪份為準當時待 code owner 決定（PR #120 留言）。2026-11-23 code owner 決定（[PR #120 留言](https://github.com/tt-chin/yakyujinsei/pull/120#issuecomment-7082868439)，見 §5）：S2 以 §8b D1～D7 為準、§8 改列前身規格；授權 S4 投手角色分析（只出研究報告）；S5 仍保留；MLB 海外移籍另案（BACKLOG `MLB-POSTING-DESIGN-01`）。**
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
| `retirement-hof-pilot`（audit） | **FAIL**（已實際執行，見 §2）；S1 修正後 PASS（§7） |
| `championship-intl-e2e`、`trait-system-e2e` 的跨執行重放區塊 | 兩入口只在 Full／audit 模式（manifest 皆帶 `--ui-only`，不在 Quick；2026-11-21 以 `node scripts/test.mjs list` 更正，原文誤記為「Quick／Full」），該區塊**不會執行**；只在手動不帶 `--ui-only` 時，兩次新生涯的完整 S 比對會因姓名不同而失敗（2026-11-15 為讀程式碼判斷；2026-11-21 已實際重現，H4 修正後見 §7） |
| 其他使用 `stage6-browser.mjs`、已填固定名、只比對單次執行或白名單欄位的入口 | 讀程式碼判斷為不受影響 |

## 4. 研究路線（第二版；只改研究工具，屬 `audit`，不進 Quick／Full，不改遊戲）

依 code owner 2026-11-15 的審查建議（PR #95 留言）改寫。第一版的「6 個互斥策略 × 25 seed＝150 條」已撤回。

1. **S1 研究工具的姓名**：依 `d7817ad` 的做法在開始前填固定名字，重放時的完整狀態與操作 digest 比對**維持嚴格、不放寬範圍**。
   - 負控制：**兩次執行直接指定兩個不同名字**，確認完整狀態比對 FAIL。拿掉固定名字只作重現檢查，不當負控制（隨機姓名可能碰巧相同）。
2. **S2 策略改為兩個獨立維度**：只選畫面上真實出現的選項，不改寫狀態。
   - **聯盟選擇**：`stay`（留隊）、`overseas`（優先海外）、`target-kbo`、`target-mlb`。
   - **育成方式**：`balanced`（原有平均分配）、`primary`（守備位置主要能力優先）、`pitcher-sp`（投手先發）、`pitcher-rp`（投手救援）。`pitcher-sp`／`pitcher-rp` 只用於投手。
   - 實作前須列出並經確認：各育成方式的能力優先順序、投球強度、休養／TJ 的選擇、目標 offer 沒出現時的行為。除刻意比較的維度外，其餘操作規則各組一致。
   - 不預設平均分配無效，也不預設主要能力優先一定較好。救援育成不保證成為 CL，結果依實際的 SP／MR／CL 紀錄分類。
3. **S3 分階段試跑**：
   - **投手與野手分組設計**。原 25 個 seed 混有 P／C／IF／OF，不能每個 seed 都套投手育成。
   - **S3a 煙霧測試**：每個適用的組合先跑少量，確認生涯能跑完、策略確實照設定執行、同版本重放 PASS。
   - **S3b 第一輪**：以約 150 條為**執行預算**（不是足夠樣本的保證），事先列出各條的 seed、守備位置、聯盟目標與育成方式。
   - 報告分別列出：起始／完成生涯數、失敗原因、目標聯盟一軍到達數與到達率、該聯盟效力年數、殿堂結果。**未到達目標聯盟的生涯也保留**，不因結果不如預期刪除樣本。
   - 同 seed 不同策略是**配對比較**，不當成獨立樣本；同一球員的多個球季也不當成獨立生涯。投手育成的比較用同一批投手 seed、同一聯盟目標。
   - 輸出放 `test-results/`（不進版控），摘要寫入 `docs/reviews/`。
4. **S4 投手角色分析**：用 `__hofSeasons` 的每季角色，按實際的 SP／MR／CL 分組看評分分佈、W／SV／SO／IP 的貢獻比例與門檻到達率。只出報告，不改係數。
5. **S5 正式規模**：依 S3 的到達率與實際執行成本決定；擴大到 4,000 條須另行批准，包括執行時間與執行環境。
6. **另案（原 H4）**：`championship-intl-e2e`、`trait-system-e2e` 手動模式的重放區塊，另開小提案同步填固定名字並驗證這兩個入口；不等下次 FAIL、不綁殿堂研究進度。靜態判斷與實際重跑的結果分開記錄。

## 5. 決定狀況

Code owner 決定（建議見 2026-11-15 PR #95 06:38 留言；06:53 留言確認 H1～H4 為已批准）：

| # | 項目 | 決定 | 第二版對應 |
|---|---|---|---|
| H1 | 研究工具的姓名處理 | 同意填固定名字、保持嚴格比對；負控制改為直接指定兩個不同名字 | S1 |
| H2 | 策略組合 | 拆成聯盟選擇 × 育成方式兩個維度；投手配對比較；各組規則實作前明訂 | S2 |
| H3 | S3 的規模 | 150 條只是第一輪預算；投手／野手分組；先少量煙霧測試；保留未到達樣本；配對樣本不當獨立 | S3、S5 |
| H4 | 兩個手動重放入口 | 另開小提案修正，不等下次 FAIL | §4 第 6 項 |

**已決定。** S1 與 H4 於 2026-11-21 經使用者授權實作（§7）。S2 規則有兩份：§8 草案（2026-11-22 使用者確認，經 PR #118 併 dev）與 §8b 規則表 D1～D7（同日授權實作，PR #120）；以哪份為準當時待 code owner 決定。S3b 於同日授權並執行（§9）；當時 S4 以後未授權（歷史狀態，現況見下表）。

**Code owner 決定（2026-11-23，[PR #120 留言](https://github.com/tt-chin/yakyujinsei/pull/120#issuecomment-7082868439)）：**

| 項目 | 決定 |
|---|---|
| S2 規則 | 以 §8b D1～D7（含已核准的 S3a 後追加修正）為本輪正式研究策略；§8 草案改列前身規格，保留歷史原文，不再兩份並列待決。依此策略完成的 S3a／S3b 結果（含 144 條試跑及未到達目標聯盟的生涯）保留，註明策略與受驗程式版本，不因改列前身而重跑。採用不代表認定為最佳玩法；未來比較其他策略另立版本與配對研究，不覆寫本輪結果 |
| S4 | 授權。先確認本輪原始 JSON 仍可取得，以既有資料依實際 SP／MR／CL 紀錄分析評分分佈、W／SV／SO／IP 的貢獻與門檻到達情形，只產出研究報告；不修改殿堂係數、門檻、遊戲規則或生涯 RNG。維持配對樣本與角色轉換的限制說明，不把同一生涯的多個球季當成獨立生涯樣本。原始資料缺失時如實說明，不自行擴大或重跑批量生涯 |
| S5 | 保留、未授權；不執行 4,000 條或其他擴大批次 |
| MLB 海外移籍 | 另案設計（BACKLOG `MLB-POSTING-DESIGN-01`），本輪不修改產品移籍規則。NPB-OFFER-WINDOW-01 的空窗不因此認定為原意，也不直接批准修正；該空窗同時影響 KBO／CPBL，後續區分赴美制度與其他海外移籍的處理範圍。S4 授權不含 MLB 移籍新制度的產品實作、合併或部署 |

## 6. 驗證與分類

- S1、S2 只改 `tests/retirement-hof-pilot.mjs`（`audit` 入口），不影響製品與 Quick／Full 的執行路徑。驗證方式：該入口自身的小批量執行、重放 PASS、負控制（兩個不同名字 → FAIL）、`node scripts/test.mjs list` 的模式不變。
- 另案（原 H4）會改 `championship-intl-e2e`、`trait-system-e2e`，這兩個入口屬 Full／audit（不在 Quick），依 AGENTS 6.1 另行分類（測試限定變更，原則 R2）。
- 不改遊戲、殿堂規則、RNG 與既有測試的期待值；不升版本。

## 7. S1／H4 實作結果（2026-11-21，`test/hof-replay-fixed-names` `014049e`，自 `origin/dev` `5831c37`）

- **改動**（只改測試，R2，不升版本）：
  - `retirement-hof-pilot`：開始前依守備位置填 §3 的固定名字，重放斷言（完整狀態 digest、操作 digest、RNG 次數）不變。
  - `championship-intl-e2e`、`trait-system-e2e`：`start()` 加可選參數 `name`；只有不帶 `--ui-only` 的重放區塊（舊基準＋兩次新版，三邊都填）傳入。UI-only 呼叫點不傳，Full 的執行路徑不變。
- **驗證**（本機 macOS＋Brave 158，非 CI）：
  - 修正前重現：兩入口手動模式都在第一個 seed `yakyo-test-001` 的重放斷言以 `ERR_ASSERTION` FAIL，差異 1088 行全是 `name:`，與 §3 的讀碼判斷一致。
  - S1：`--seeds=hof111-pilot-01,hof111-pilot-04` 4 條跑完、重放 PASS、exit 0。
  - H4：scratch 探測副本（重放斷言通過後即換下一個 seed，不提交）兩入口 6 seed 全部 `REPLAY_OK`，console 錯誤 0。
  - 負控制（scratch 副本只讓重放那一次填不同名字，不提交）：3 入口皆 exit 1，分別在 `full game replay state`、`new replay mismatch`、`new annual draw rule is not reproducible` 以 `ERR_ASSERTION` FAIL，差異只在姓名。
  - 兩入口 `--ui-only`（Full 的路徑）exit 0，console 錯誤 0；Quick 109／109 PASS（不含這兩入口）。
  - reviewer：無發現。讀碼確認兩個舊基準空白姓名時的預設名即同一組對照表，基準側填名後狀態不變；姓名在 `seedInit` 之前決定，不影響 RNG。
- **新發現（另立 BACKLOG `TEST-MANUAL-HISTORICAL-COMPARE-01`；2026-11-22 已於 `test/historical-compare-alignment` 修正，診斷、決定與驗證見該條）**：姓名修正後，兩入口手動模式接著在「舊基準 vs 新版」比較 FAIL（championship `unapproved first difference`、trait `first difference must be an event draw`）。原因是新版 state 從 step 0 就多了 `championmakerWins: []`（`2a7d8f4`，1.14.0，2026-11-07 新增），兩基準 `004cd26`（2026-10-10）、`2375d46`（2026-10-09）都早於此欄位。失效起點未確認：目前看到的第一差異來自 1.14.0，但 2026-10-31（早於 1.14.0）的本機紀錄已記載這兩入口不帶 manifest args 執行時，歷史比較在乾淨 HEAD 上也 FAIL（當時原因未記錄）。1.16.10 起姓名差異先在重放斷言 FAIL，遮蔽了這一層。此欄位之後是否還有其他差異未確認。依 AGENTS 6.3 未改比較條件。
- **合併**（2026-11-22）：PR #117 併 dev（`2a2a60d`，樹與 `bf76978` 相同），[Tests #247](https://github.com/tt-chin/yakyujinsei/actions/runs/44972095949) Quick PASS；Full 未執行（兩入口的 Full 路徑不變）。S2 以後仍未授權。

## 8. S2 規則草案——前身規格（2026-11-22，讀碼基準 `origin/dev` `9f46594`；使用者已確認；2026-11-23 code owner 決定由 §8b 取代，以下保留歷史原文）

只讀調查，未改程式、未執行研究。以下行號為 `docs/src/engine/` 下的檔案。

### 8.1 影響設計的既有事實

- **聯盟無法直接指定**：offer 依條件出現，玩家只能在出現的選項中選。NPB1 季後的海外 offer（`career-movement.js` `overseasOffer`／`crossOffersRule`，:157-170）門檻為 ovr KBO≥47（前季 d≥1）、CPBL≥45（d≥0）、MLB≥60（d≥2），DOM 順序固定 KBO→CPBL→MLB，球團隨機。FA 市場（`faMarketRule`）只列出現的球團 `<球團>（<級別>）`；戰力外（`outOfOrg`）最多 4 家依級別排序。已在海外時只會收到 `NPB復帰オファー`，沒有海外對海外的 offer。沒有 posting 選項。
- **投手角色只能間接影響**：`pitcherRole()`（`player-profile.js:12-19`）`sta≥52` 為 SP，否則牛棚（MR／CL 依前季 d）。唯一的畫面選擇：牛棚投手 `sta` 達標時，NPB1／CPBL1／MLB 會問 `先発へ転向し、ローテを担う`／`ブルペンに残り、自分の役割を守る`（`defense-position-review.js:39-47`）；SP 轉牛棚是自動的。
- **沒有休養選項**：受傷判定全自動（`player-injury.js` `rollInjury`）。可選的只有：TJ 的 `トミー・ジョン手術を受ける`／`注射で今季を乗り切る`（`player-injury.js:19-37`）、36 歲後的 `もう一年挑戦する`／`契約を断り、日本球界へ戻る`／`引退記者会見を開く`（`season-phases.js:80-91`）、代表招集的出場／辭退。
- **沒有「主要能力」對照表**：唯一相關是 `overallRatingFor`（`ability-evaluation-policy.js:16-30`）的權重——投手 vel／ctl／brk 取前三（0.42／0.30／0.18）＋sta 0.10；野手 con／pow／eye／spd 取前四（0.38／0.27／0.20／0.15）＋守備。
- **現行 pilot 的「第一個非引退鈕」造成的偶然選擇**（`tests/retirement-hof-pilot.mjs:22-27`）：投球計畫每季選 `全力投球`（`season-phases.js:75-77` 順序為全力→通常→省エネ）；TJ 選手術；`ordered-overseas` 在海外 offer 中取第一個，實際多為 KBO；配點確定鈕 `確定 ▸`（`player-ability.js:53`）不符確定鈕的正規表示式，是靠 fallback 點到的。

### 8.2 規則

介面：新增 `--league=stay|overseas|target-kbo|target-mlb` 與 `--training=balanced|primary|pitcher-sp|pitcher-rp`。既有 `--strategy=ordered-overseas|balanced-stay` 原樣保留，用於重現舊結果，不改其行為。

| 項目 | 規則 |
|---|---|
| `stay` | 有留隊選項（`現在の球団に残留`／`権利を行使せず残留`／`宣言残留`）就選；不宣告 FA |
| `overseas` | 有海外 offer 就接，優先序 MLB＞KBO＞CPBL；沒有就留隊 |
| `target-kbo`／`target-mlb` | 只接目標聯盟的 offer；有 FA 資格時宣告 `海外FAを宣言`，市場有目標聯盟球團就選，否則選 `宣言残留`，再沒有就選第一個 offer；戰力外時有目標聯盟 offer 就接，否則選第一個 |
| 高中畢業 `米国プロ組織と契約する` | `overseas`、`target-mlb` 選；`stay`、`target-kbo` 走 `NPBドラフトへ` |
| 海外時的 `NPB復帰オファー` | 四種皆選留隊 |
| `balanced` | 維持現行：每次點目前值最低的能力 |
| `primary`（只用於野手） | con／pow／eye／spd 中由低往高點；這組全滿後改點其餘能力（由低往高） |
| `pitcher-sp` | 先把 `sta` 點到 52，之後 vel／ctl／brk 由低往高；被問轉先發時選轉先發 |
| `pitcher-rp` | `sta` 不超過 51，只點 vel／ctl／brk；被問轉先發時選留在牛棚 |
| 共通固定規則 | 投球計畫固定 `通常投球`；TJ 固定手術；36 歲後固定 `もう一年挑戦する`；事件卡、交易、代表等其他選擇維持現行「第一個非引退鈕」；配點確定鈕改為明確比對 `確定`／`捨てます` |

- 投手的育成方式只用 `balanced`、`pitcher-sp`、`pitcher-rp`（投手的 `primary` 與 `pitcher-rp` 幾乎相同）。
- 投球計畫由偶然的 `全力投球` 改為 `通常投球`：新策略的結果不與既有 50 條生涯直接比較（使用者已接受）。
- `pitcher-rp` 不保證成為 CL，仍依 §4 第 2 項按實際 SP／MR／CL 紀錄分類。

### 8.3 未決與實作時的驗證

- 待 code owner 決定：是否依本規則實作 S2，以及規則的增刪。S3b 的 seed／守備位置／組合清單尚未擬定。
- 實作範圍同 §6：只改 `tests/retirement-hof-pilot.mjs`（`audit`），不改遊戲與 Quick／Full 路徑。驗證：每種適用組合少量執行跑完；`__hofActions` 確認各規則確實被執行（例如 `pitcher-rp` 的 `sta` 從未超過 51、`target-mlb` 不接 KBO offer）；同版本重放 PASS；既有兩種 `--strategy` 的 `actionDigest` 與修改前一致；`node scripts/test.mjs list` 的模式不變。

## 8b. S2 規則表 D1～D7（2026-11-22 使用者核准 D1～D7 並授權 S2 實作，PR #120；2026-11-23 code owner 決定以本表為本輪正式研究策略，見 §5）

調查（scout，唯讀；門檻、投球方針、角色判定、按鈕判斷等引用已逐處核對）修正三個前提：遊戲**沒有休養選項**（投手只有 TJ 的手術／注射，季中受傷無選擇）；現行兩策略的投手都因預設規則選到第一個按鈕「全力投球」（TJ ×1.25）；遊戲沒有「主要能力」概念（OVR：投手 vel／ctl／brk 由高到低 .42／.30／.18＋sta×.10；野手攻擊 70%＋守備 30%，sta 不計），`primary` 由本表定義。投手的 `lastD` 為 `(vel+ctl+brk)/3−par`（`season-stats.js:17`），野手未確認。

**育成方式**（每次點擊花一顆骰子／一點，點「第一個未到上限的項目」）：

| 方式 | 適用 | 點選規則 |
|---|---|---|
| `balanced` | 全部 | 沿用現行：先點目前數值最低者，同值依畫面順序 |
| `primary` | 野手（D1：投手不用） | 固定順序集中點，到潛力值（`S.pot`，未設為 62）或上限就換下一項；全部到潛力值後依同順序點到上限（D2：集中三年觸發「小細工無用」，保留不排除）。C：con→pow→eye→spd→fld→cat→arm→rng→sta；IF／OF：con→pow→eye→spd→rng→fld→arm→sta |
| `pitcher-sp` | 投手 | 先把 sta 點到 52，之後 vel／ctl／brk 中先點最低者 |
| `pitcher-rp` | 投手 | 不點 sta（vel／ctl／brk 全到上限時才點），三項中先點最低者；初始 sta 已 ≥52 時照實際角色記錄 |

角色轉換詢問（救援→先發）：`pitcher-sp` 選「先発へ転向し、ローテを担う」，`pitcher-rp` 選「ブルペンに残り、自分の役割を守る」，其他依共用規則。

**聯盟選擇**：

| 時機 | `stay` | `overseas` | `target-kbo` | `target-mlb` |
|---|---|---|---|---|
| 規則 | 沿用 `balanced-stay` 正則 | 沿用 `ordered-overseas` 正則 | 見下 | 見下 |
| NPB 一軍海外移籍 offer | 残留 | 第一個海外 offer | 「韓国プロ野球への海外移籍：」 | 「MLBへの海外移籍：」 |
| FA 權（`海外FAを宣言` 需 9 年） | 権利を行使せず残留 | 海外FAを宣言 | 有則宣言海外 FA，否則留隊 | 同左 |
| FA 市場 | 宣言残留 | 第一個海外 offer | 「（KBO一軍）」的 offer | 「（メジャーリーグ）」或「（ルーキーリーグ）」的 offer（未具美國資格者的 MLB 路線會降為ルーキーリーグ，`cross-league-market-policy.js:24`） |
| 降格畫面「降格を受け入れるか、新天地を選ぶか？」 | 接受降格 | 共用規則 | 接受降格 | 接受降格 |
| 戰力外 | 共用規則 | 共用規則 | 優先「韓国プロ野球への海外移籍オファー」 | 優先「米国プロ野球への海外移籍オファー」 |
| 高校「米国プロ組織と契約する」 | 不選 | 會選（正則含「米国」） | 不選 | 選（D3） |
| 到達目標聯盟後 | — | — | 留下（`S.org==='KBO'`） | 留下（`S.org` 為 `MiLB`／`MLB`） |

D4：目標 offer 未出現時當年留隊、隔年再等；未到達的生涯照 H3 保留。戰力外時沒有目標 offer 則走共用規則（可能轉往其他聯盟）。

**共用規則**（D5，所有新組合一致）：投球方針一律「通常投球」；TJ 選「トミー・ジョン手術を受ける」；其他選擇（事件＝`bold`、契約、交易、降格、國際大會、背號等）沿用現行預設規則（第一個非引退按鈕）。

**介面**（D6）：不帶 `--strategies` 時的 50 條與兩個舊策略不變。新增 `--strategies=<league>:<dev>,…`（例：`target-mlb:pitcher-sp`），與 `--seeds` 交叉；`pitcher-*` 只套投手、`primary` 只套野手，不適用的組合略過；名稱錯誤、組合全被略過，或條數超過 `--limit` 時即中止。

**S3a 煙霧測試**（D7）：投手 `hof111-pilot-01`／`02` × 4 聯盟 × 3 育成（`balanced`／`pitcher-sp`／`pitcher-rp`）＝24 條；野手 `hof111-pilot-03`（C）／`04`（IF）× 4 聯盟 × 2 育成（`balanced`／`primary`）＝16 條；合計 40 條。

**分類與驗證**：只改 `tests/retirement-hof-pilot.mjs`（audit），不進 Quick／Full、不改遊戲、不升版本。驗證：舊策略預設路徑改動前後 digest 相同、S3a 40 條跑完且重放 PASS、策略照設定執行的檢查、姓名負控制、`node scripts/test.mjs list` 模式不變。

**S3a 後追加（2026-11-22 使用者核准）**：首輪 S3a 發現 `stay` 10 條中 6 條在降格畫面被共用規則的 `オファーを受ける` 選去台灣、`primary` 集中超過潛力值（花費 ×3）使 8 條都未到 NPB 一軍；reviewer 指出 MLB 路線 FA offer 的降級顯示與條數截斷／0 條未中止。上表已反映四項修正。

**S3a 結果**（2026-11-22，本機 macOS＋Brave 158，非 CI，`test/hof-s2-strategies` 修正後）：40／40 完成、重放 PASS、exit 0、console 錯誤 0；以 scratch 副本（digest 與正式版 40／40 相同）檢查逐步選擇：投手全為「通常投球」、`pitcher-rp` 未點 sta、`stay`／`target-*` 未經降格畫面離隊，0 違規。不帶 `--strategies` 的舊路徑改動前後 4 條 state／action／RNG digest 相同；姓名負控制以 `ERR_ASSERTION`（`full game replay state`）FAIL；0 條、超過 `--limit`、非數字 `--limit` 皆中止。到達判定以 `seasons` 中 `G>0` 的等級為準（`statsByLevel` 預先列出所有等級，不能用）。

| 聯盟選擇 | 條數 | NPB 一軍 | KBO 一軍 | MLB |
|---|---|---|---|---|
| `stay` | 10 | 10 | 0 | 0 |
| `overseas` | 10 | 8 | 9 | 0 |
| `target-kbo` | 10 | 3 | 8 | 0 |
| `target-mlb` | 10 | 10 | 0 | 5 |

煙霧測試樣本，不當到達率。MLB 移籍 offer 實際從ルーキーリーグ起步再升上 MLB。`02 target-mlb:pitcher-rp` 戰力外時無美國 offer，依 D4 走共用規則轉往 KBO。下一步 S3b 須另行授權，並先確認 seed／守備位置／組合清單（§5）。

## 9. S3b 第一輪（2026-11-22 使用者核准方案 A，報告疊在 PR #120 分支；S4 以後當時未授權，現況見 §5）

**組合（方案 A，144 條）**：seed `hof111-pilot-01`～`15` 全組合。投手 01／02／06／07／11／12 × 4 聯盟 × `balanced`／`pitcher-sp`／`pitcher-rp`＝72；C 03／08／13、IF 04／09／14、OF 05／10／15 × 4 聯盟 × `balanced`／`primary`＝72。方案 B（seed 01～25 全組合 240 條）超出 H3 的約 150 條預算，未採用。

**結果**（本機 macOS＋Brave 158，非 CI，`f3289a1`）：144／144 完成、exit 0、console 錯誤 0、重放 PASS、182 秒；與 S3a 重疊的 40 條 digest 相同。逐步規則執行檢查本輪未重跑。目標聯盟一軍到達：

| 聯盟 | 投手 `balanced`／`pitcher-sp`／`pitcher-rp`（各 6） | 野手 `balanced`／`primary`（各 9） |
|---|---|---|
| `stay` | 6／5／6 | 6／8 |
| `overseas` | 6／5／6 | 5／8 |
| `target-kbo` | 3／5／6 | 3／8 |
| `target-mlb` | 2／2／3 | 1／3 |

`target-mlb` 36 條中 24 條從未在美國出場（目標 offer 未出現）；殿堂入り 3 條（KBO 2、CPBL 1），NPB／MLB 0。配對樣本，不當到達率。詳細表格、配對矩陣與觀察見 [S3b 報告](../docs/reviews/HOF_NATURAL_SAMPLE_S3B.md)。下一步（S4 角色分析、S5 規模、MLB offer 不出現的處理）當時須另行授權；2026-11-23 code owner 已授權 S4（只出研究報告），S5 保留，MLB offer 不出現的處理見 NPB-OFFER-WINDOW-01 與 MLB-POSTING-DESIGN-01（§5）。

**MLB offer 調查**（2026-11-22，唯讀；scratch 副本只在 wrapper 加紀錄，36／36 digest 與 S3b 相同）：`target-mlb` 中 24 條未在美國出場的原因：從未上 NPB 一軍 5 條；NPB 一軍的季末最高 OVR 53～57 共 14 條；OVR 曾達 63 但 `lastD` 未曾 ≥2 有 1 條；門檻已達到但落在空窗年份 4 條。NPB 一軍的 MLB offer 須 OVR≥60 且 `lastD`≥2（`career-movement.js:163-171`），海外 FA 市場門檻相同（`:222`）。空窗年份：一軍年數 `S.svc`≥5 時 `S.faElig` 被設為 true（`:262-266`）；合約到期時改走 `faFlow` 並 return，不呼叫 `crossOffers`；而 NPB 年資 <8 時 `faFlow` 只做保有權續約（`:202`）。因此一軍第 5 年起、NPB 年資 8 年前的合約到期年度，沒有任何海外 offer（KBO／CPBL 亦同）。是否為原意見 BACKLOG NPB-OFFER-WINDOW-01（code owner 決定見 §5）。S3b 的 MLB 到達數主要受 OVR 門檻限制，不是研究工具的問題。

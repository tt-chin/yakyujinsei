# 第九階段：現行詳細設計書調查與驗收

## 1. 基準、權限與交付狀態

日期2026-10-12（JST）；Repository tt-chin/yakyujinsei，僅dev。
Fetch後HEAD/origin/dev：`ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1`，VERSION1.11.5。
main/origin/main：`e886e84ca08c6c185406cac9d6f3c4376277061a`，1.11.4；不修改main、本番、发布workflow。
開始tracked工作樹乾淨，但有使用者未追蹤tasks/；保留、不提交／覆寫／刪除。

本輪依据本地tasks/STAGE9_CURRENT_DETAILED_DESIGN_CODEX_PROMPT.md及使用者OK。已確認AGENTS、CURRENT_SPEC、BACKLOG、CHANGELOG、第五階段稽核/路線、第七與第八階段兩份報告；歷史指令不恢復。先提出入口、全模組、狀態、RNG及流程掃描範圍，再建文件。

**交付：12章技術入口與附錄／來源索引已建立；指定本機驗收PASS。未聲稱全程式、全部接口或動態路線已驗收。**
下列缺口保持UNVERIFIED/DESIGN_PENDING，AUD-02／REFACTOR-AUDIT-01／HIST-SPEC-CLAUSE-01不結案。程式樹不變；本輪只有5新文件及BACKLOG進度，沒有測試／工具／CI/AGENTS/CURRENT/VERSION/CHANGELOG修改。

## 2. 新文件及方法

| 文件 | 用途與邊界 |
|---|---|
| [CURRENT_DETAILED_DESIGN](../design/CURRENT_DETAILED_DESIGN.md) | 12章入口，連到技術附錄；描述現行而非批准政策 |
| [STATE_AND_RNG_REFERENCE](../design/STATE_AND_RNG_REFERENCE.md) | 106 literal、重要域、S外閉包、124根S存取、196 RNG語法點與敏感順序 |
| [MODULE_FUNCTION_INDEX](../design/MODULE_FUNCTION_INDEX.md) | 全40模組、39核心函式契約、502具名語法索引／import／覆寫關係 |
| [FLOWS_AND_UI_REFERENCE](../design/FLOWS_AND_UI_REFERENCE.md) | 人工確認12主要流程，S/RNG/DOM/callback與fault/retry邊界 |
| 本文件 | 驗收、可重建統計、差異、未驗範圍、後續提案 |

讀入口及載入鏈→重新執行既有AST→人工核對關鍵source範圍/政策/helper／現有測試→記錄固定SHA行→建立模型与交易說明→Quick及文件檢查。沒有拿舊991/4193數字当現在結果，也沒有執行game來「抽取」期望值。

```text
git fetch origin
git status -sb
git rev-parse HEAD origin/dev origin/main
node scripts/audit-architecture.mjs --playwright=<外部Playwright1.62.1> --output=test-results/stage9/architecture.json
node scripts/test.mjs list
node scripts/test.mjs quick --baseline=ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1 --playwright=<同外部模組> --output=test-results/stage9-quick-final
git diff --check
```

Inline Node唯讀輔助：從AST列modules/imports/named functions、從actual newState AST節點取106初值、統計S根欄位/語法寫點、沿entry static import＋main dynamic game閉包遍歷、讀manifest inventory。**不新增輔助程式到repo、不修改既有工具、不寫遊戲/測試**；既有AST工具的輸出限ignored test-results/stage9，源碼皆可由固定Git重取。

## 3. 實際統計（非測試覆蓋率）

| 類型 | 本輪數量及方法 | 不能解讀成 |
|---|---|---|
| 掃描JS／載入圖 | 40追蹤JS，40皆從main静態鏈＋dynamic game可識別；static edge48＋dynamic1 | 40模組所有export都動態可達 |
| 模組責務 | config1/data3/engine24/UI11/main1，逐模組定位/測試候選 | 每模組所有數值/DOM皆VERIFIED |
| 函式語法 | 997 AST function節點；502具名稱/assignment推導名＋495匿名 | 997個公開API或全部scope-resolved caller |
| 核心契約 | 39個人工梳理函式，具输入/返回/例外/副作用/caller/規格/證據；其餘502語法索引可查來源 | 502個完整typed API；K表也不外推全caller |
| Call語法 | 4214 CallExpression/OptionalCallExpression | 4214個真正callgraph edge／執行次数 |
| S/state存取 | 1739；S1664、state75；直接S根key去重124 | 完整S schema／含所有s、this、alias寫集 |
| 初始化 | 前套literal64、現行literal106，後續assign/accessor/ensure分列 | S僅106欄、舊64仍為現行 |
| RNG相關語法 | 196：game192/event-state2/championship1/market1 | 每人生196R，或全部都是career R消耗 |
| 主要人工流程 | F01–F12共12：boot、alloc、annual、event、amateur、pro、contract、market、settle、intl、retire、UI/share | 全路線狀態機完整／全exception驗收 |
| HTML／CSS | 1入口、6直接本地CSS；外部Google Fonts单列 | 再次完整視覺／CDN／所有瀏覽器驗收 |
| 現行tests盤點 | 66檔、59可自動執行檔＋syntax＝60自動入口；Quick45/Full59/Audit60 | 66都是單元測試，或Full已本輪执行 |

manifest分类：unit/static10、unit/static按source assertions24、integration/native/static6、fixed-seed/static1、Playwright E2E/integration/fixed-seed17、固定人生analysis1；非直接自動項目fixture2、support3、analysis1、report1。原始分類含混合性質，不強行作互斥純測試覆蓋率。

因parser包含覆寫與嵌套，數量不是基準替换承诺。AST metadata的sha256/owner與初始化來源保留可重建；ignored rawJSON供本機證據，不依靠不可取得私人path做接口。

## 4. 十二章覆蓋與具體缺口

每章已有現行技術說明/來源/附錄入口（12/12建檔），**不提供「100%程式／規格已驗收」百分比**。狀態按限定命題，不以寫完段落升級VERIFIED。

| 章 | 本輪梳理與證據 | 仍未完成 |
|---|---|---|
| 1 起動 | entry、40載入圖、main disabled與overlay註冊；S＋Q語法/模組 | import/外部字型失敗、所有browser compatibility |
| 2 S | 106初值、124直接根key、重要讀寫／閉包／Stage7 guard | alias/s/this/動態key全寫集、全部nullable/type域 |
| 3 Seed/RNG | 現行FNV/Mulberry、helpers/196點、12窗口；Q固定seed | 所有route完整R值trace与callback排序；本輪不Full |
| 4 人物/能力 | newState抽序、cost/pot、alloc/Undo/reset/done；H89+17 | 所有守位OVR/round、U07舊稱號key自然資料流 |
| 5 年度 | active4queue＋conditionalPOST、全休/年界；Q ACT/KBO | 所有失敗／恢復/queue互動 |
| 6 聯盟 | LV/JP_DATA/Master、bucket、movement/LEGACY | 每年齡/階層/transfer控制期全部交互 |
| 7 契約/金錢 | schedule、candidate/sign/payment/retry/CORP；Q原生＋H381 | U03候選再算/旧extension显示、任意付款内部throw非全面atomic |
| 8 成績/履歷 | 同st雙累積、payD/3季、決定不限10；Q相關 | 近似IP/各角色所有form/effort、全tab历史视觉 |
| 9 HOF | rawtier/round演出、首輪league；Q固定fixture | 自然跨4聯盟/4000樣本、全部称号/票選／政策待決 |
| 10 UI/DOM | 3頁2+4tabs、單act/log、新token保留listener；Q ACT/draft | 全keyboard/密度/字級/異步注入、實機 |
| 11 分享/偏好 | storage仅display、sharePromise/generation、PNG registry；Q unit/mocks＋H | OS sheet、Cancel/PNG实机、长程资源/race |
| 12 CI/部署 | 現行manifest/触发/固定Node/PW/部署分離，list已跑 | Branch Protection/Ruleset不在本輪設定；CI提交後獨立確認 |

## 5. 規格—程式—測試追蹤矩陣

| 項 | CURRENT規格 | 現行來源 | 證據SHA／入口與限定狀態 |
|---|---|---|---|
| 配分session | §7 | G678–718；addAb395/allocDone1062 | IMPLEMENTED；Q ability-allocation(形狀)，H13abcf5 Stage7 89/17；VERIFIED僅其正常/fault矩陣 |
| 簽約安全 | §7/11.8 | G2814/2818；contract-policy12；signing-bonus21 | Q contract/draft/bonus；H13abcf5付款前/描畫後重試，非任意throws rollback |
| CORP決算 | §7 | G3066–3091 WeakMap running/paid/complete | IMPLEMENTED；H13abcf5原生420萬重入、前後fault/次年；本輪未重跑5/17 |
| Seed/分享 | §2/13/16 | G2672/2686/2687/3104；U seed-share2/64 | Q fixed-seed/replay/event（原生/mock）；VERIFIED限定，實機UNVERIFIED/BLOCKED |
| 年度事件 | §10/13 | event-state4/13/21/26/53、G850/1055 | Q effect、去重、重入、收入原生；全552視覺H，不誤稱本輪重跑 |
| HOF | §12＋既有政策 | G2006/2009/2047；hall-of-fame-policy | Q首輪人工/受賞邊界；DESIGN_PENDING現有HOF工作不改、自然率UNVERIFIED |

## 6. 差異與風險（本輪不修改）

### D01：SPEC_MISMATCH（文件工作ID交叉引用，不是遊戲政策Bug）

CURRENT_SPEC§1仍写「全詳細移管未完（BACKLOG AUD-04）」；最新BACKLOG已把AUD-04調查分類結案、未驗細項獨立為HIST-SPEC-CLAUSE-01。兩者範圍表述／ID指向需同步說明，而不是恢復舊規格或宣布全移管完成。建議另批准修正引用／補上歷史快照性質；CURRENT本轮只读。

### U01–U07：UNVERIFIED／已確認靜態風險，非自然Bug的驗收PASS

- **U01**：全部s/this/contract/能力alias及computed write，AST不涵蓋，完整S不變條件仍AUD-02/REFACTOR-AUDIT-01。
- **U02**：同名binding／LEGACY／async回調可達性沒有完整scope+runtime證明；旧市場與record-view載入不等於其export活跃。LEGACY_OR_UNREACHABLE_UNPROVEN，舊碼不刪。
- **U03**：G2971海外candidate展示後，接受會buyout→signTo重算，不直接傳展示快照；G2718的cross?1:contractMult使1/1.3差**不能直接判價格不同**，transferSalarySnapshot/previousSalary fallback及restrictedTarget需每步DOM/ct/履历比。旧extension提示与append候选一致性同屬已有AUD-02/CONTRACT-LEGACY相关缺口。沒有確認新薪資Bug。
- **U04**：seed reproducibility證據按版本/策略/基準區分；本轮只Quick，不能把H13abcf5完整生涯的次數套所有route。HOF自然样本、實機與OS分享依BACKLOG保留。
- **U05**：CURRENT§11.9對舊函式用「到達不能」字樣，現有證據仍不足全面不可達判定；先標證據用語不足，不稱原敘述已動態證偽。建議按REFACTOR/LEGACY補證或批准文件措辭，不能删代码。
- **U06**：runChoiceAction是同步try/catch，Promise callback不會被await；当前原生share屬另UI异步入口，不宣稱現行game choice已遇此Bug。ALLOC completed與CORP/sign guard沒有全面rollback。另G2995的NPB回國complete先設context.completed=true才action/finish；如果內層簽約／描畫throw，該外層callback的重試及年度推進是否仍可恢復不在Stage7 signTo局部保證內，尚未實際fault補驗。不能僅從局部付款去重PASS推論所有外層流程安全；以后异步化/抽离須增加对应批准与测试。
- **U07**：**退休旧稱號key的靜態資料流缺口**。G246舊newState提供hsTier/potSum0；active newState2797–2811提供schoolTier，未提供这两个旧key。被保存的LEGACY.endGame仍G2121讀hsTier===3、2125讀(potSum0||999)<=grindTh，取得smallschool/grinder；沒有在目前初始化段找到相应映射。rg全game只在舊literal與上述讀點见旧key，**不能把兩套literal的欄位合在一起作現行schema**。這是已確認來源／初始化差異，但未在自然完整生涯精確驗證称号觸發、也未為本輪新增測試或修程式。列IMPLEMENTED（靜態缺口）＋UNVERIFIED（實際影響/預期批准）。建議先批准原生fixture＋自然合法路線驗證；新工作ID候選 `TRAIT-INITIAL-STATE-VERIFY-01`，本次仅提案，不加入正式checkbox、不先決定映射/重判已取得稱號。

DESIGN_PENDING：既有OVR-01、HOF bucket/pitcher/honor/round/story及三個保留trait，保持現行BACKLOG。標籤38個不代表38能取得；此設計書不批准新coef或恢复二刀流。

没有聲稱本輪确认新的自然UI/金額Bug，也没有为未验证风险修改游戏、Fixture或预期。上述D/U代号是本報告发现索引，不是新增正式BACKLOG ID。

## 7. HIST-SPEC-CLAUSE-01變更提案（尚未批准）

建議未来由「歷史全條文逐條核對」改為「歷史資料保留與按需追溯」：以現行技術設計、CURRENT正式政策、現有驗收為主要維護面；歷史只於SPEC_GAP／意圖冲突查原文。**本次不更改原checkbox定義/狀態，不標完成**。

可能失去的證據（即使archive不刪，也會缺系統性核對）：

1. 舊數值表與每次修訂的原始決策理由及取代链。
2. 學校地域/tier表未核欄、全部舊API索引/翻譯條款的一一遷移證據。
3. 參考作品算法／未採用候選的邊界及歷史接受條件。
4. 曾只存Git／未提交task的批准背景；程式無法反推「為何」。
5. 類似U07舊欄位意圖，只有当前schema可能看不出原稱號基準。

折衷提案：保留固定SHA來源台帳，優先按功能保留重要未驗條款清單；将每次追溯结果附CURRENT技術來源，仍不把原文自動當policy。須由使用者選擇是否縮小調查承诺；目前18完成/26未完成保持。

## 8. 實際測試與未执行范围

Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39，基準ea951c2。文件建檔後最終Quick：**45 PASS、0 FAIL、0 SKIP、0 BLOCKED；184.953秒；45實際執行、0重用；exit0**。本地HEAD仍ea951c2、工作樹含本輪文件，不能說5新文件已存在於該基準commit；遊戲資產樹與基準相同。輸出ignored `test-results/stage9-quick-final/summary.json`及逐入口log/hash；指令全參數與historicalRefs由Runner保存，不把負面舊Bug基準换HEAD。調查起初另跑一次Quick45 PASS、190.172秒於`test-results/stage9-quick/`，不把兩次執行合併冒稱90個不同入口。

ACT --fixtures-only實際運行P/IF、4出身路線、CONTROL/DEVELOPMENT、三尺寸48fixture＋6pointer；draft --quick18案例含正式/育成入團/未入团退休及三尺寸，Console Error與JS-CSS404報0。ACT browser profile cleanup timeout warning在測試成功後分記，不算游戏Console Error，也不隐瞒為「完全没有环境warning」。KBO quick亦實跑；其他逐入口如下：

| 入口 | 結果 | Runner秒數 | exit |
|---|---|---:|---:|
| `syntax` | PASS | 6.464 | 0 |
| `ability-allocation.test` | PASS | 0.089 | 0 |
| `arbitration-policy.test` | PASS | 0.085 | 0 |
| `bug-act-01-02-e2e` | PASS | 91.254 | 0 |
| `career-movement-policy` | PASS | 0.086 | 0 |
| `championship-intl.test` | PASS | 0.587 | 0 |
| `choice-action.test` | PASS | 0.081 | 0 |
| `contract-policy.test` | PASS | 0.084 | 0 |
| `control-period-policy.test` | PASS | 0.079 | 0 |
| `display-preferences.test` | PASS | 0.085 | 0 |
| `domestic-tournament-policy` | PASS | 0.086 | 0 |
| `draft-bonus-display.test` | PASS | 0.091 | 0 |
| `draft-income-e2e` | PASS | 65.995 | 0 |
| `draft-signing-policy.test` | PASS | 0.095 | 0 |
| `event-copy.test` | PASS | 0.437 | 0 |
| `event-fix.test` | PASS | 0.348 | 0 |
| `event-integration.test` | PASS | 0.110 | 0 |
| `event-policy.test` | PASS | 0.214 | 0 |
| `fa-market-policy.test` | PASS | 0.075 | 0 |
| `fixed-seed-v160.test` | PASS | 0.072 | 0 |
| `global-contract-market.test` | PASS | 0.107 | 0 |
| `hall-of-fame-policy` | PASS | 0.072 | 0 |
| `hof-first-ballot-league.test` | PASS | 0.233 | 0 |
| `incentive-policy.test` | PASS | 0.083 | 0 |
| `information-architecture.test` | PASS | 0.074 | 0 |
| `injury-market-policy.test` | PASS | 0.068 | 0 |
| `japanese-copy-contract-ui.test` | PASS | 0.076 | 0 |
| `kbo-renewal-e2e` | PASS | 11.871 | 0 |
| `kbo-renewal-floor.test` | PASS | 0.158 | 0 |
| `npb-return-ui.test` | PASS | 0.304 | 0 |
| `record-condition-fix.test` | PASS | 0.107 | 0 |
| `replay-share-theme.test` | PASS | 0.092 | 0 |
| `retirement-hof-balance.test` | PASS | 0.774 | 0 |
| `salary-detail-ui.test` | PASS | 0.090 | 0 |
| `salary-evaluation-policy.test` | PASS | 0.081 | 0 |
| `salary-explanation-policy.test` | PASS | 0.072 | 0 |
| `salary-flow.test` | PASS | 0.083 | 0 |
| `salary-promotion-policy` | PASS | 0.114 | 0 |
| `salary-promotion-policy.test` | PASS | 0.075 | 0 |
| `spec-source-links.test` | PASS | 0.327 | 0 |
| `team-demand-policy.test` | PASS | 0.073 | 0 |
| `test-runner.test` | PASS | 1.496 | 0 |
| `trait-policy.test` | PASS | 0.225 | 0 |
| `ui-foundation.test` | PASS | 0.092 | 0 |
| `verify-modularization` | PASS | 0.091 | 0 |

沒有执行本轮Full/Audit全profile、Linux Full、全生涯逐步S/R的新重跑、4000研究、iPhone/Android實機、原生OS sheet、全部PNG視覺矩陣。不是Quick里的SKIP數，以上不能列PASS。H第七階段三平台/381/89/5/17证据保留原SHA与范围，不改写成Stage9执行。

文件检查：新增五文件与BACKLOG/CURRENT共80个本地link、582个固定SHA源码链接（40源码文件，#L均在有效行数内）均PASS；正式checkbox44唯一、18完成26未完，三个指定未完项目的定义行与基准完全相同。protected diffs空，固定来源 `ea951c2` 全SHA存在；行号以后位移須新记录版本。无新测试／无自动变更预期。

## 9. CI、Preview及提交證據

本轮设计/报告文件不在paths-ignore，dev推送仍必跑LinuxQuick；无需Draft PR或LinuxFull。CI与Preview先pending，不提前宣称PASS。实际Run ID、受验文书SHA/结果、后续纯BACKLOG证据Commit由[BACKLOG](../../BACKLOG.md)§1.2/4.1与最终回报补记，避免报告自指hash与反复触发整套CI。

Preview仅确认部署与47HTML/JS/CSS source一致（若实际执行），不能读成新一轮Full UI或实机验收。正式main與publish workflow不动。protected game/AGENTS/CURRENT/config/CHANGELOG/tests/Runner/CI/archive差异应空；用户tasks仅原有untracked，不能用git add -A混入。

## 10. 下一批建议（没有开始第十阶段）

1. **先补U07旧称号初始化、U03候选展示→签约的独立原生/DOM fixture**，不先改游戏；用正常可达路线与fault/人为fixture分别标记，確認expected policy再提最小修复。
2. **低风险抽离候选：read-only view model**（buildAbility/Traits/Career/Record）。先以完整S/accessor不变、VM deepEqual、所有tab DOM/焦点/act listener/R0为门槛；涉及getter、ct normalize不能叫纯函式而忽略副作用。按第5阶段R3小批次，需明确批准。
3. **次候选：纯format/contract-label/palette的测试补强与职责注记**，已有独立UI模块；先找真重复不造无用抽象。不把一次文件调查直接变成更多模块。
4. 入口binding/contract adapter/年度协调器/旧市场删除属于高风险，先补scope-resolved及每步S/R/queue/token证据，现阶段不做。
5. CURRENT D01/U05措辞以及HIST任务范围变更另列提案，不能自行修正现行policy。

第九阶段至此只交付技术文件与指定证据，停止等待审查。完成文件不等于AUD-02/REFACTOR全部验收，不自动第十阶段。

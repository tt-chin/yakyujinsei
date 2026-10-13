# C級高校與弱小校の星實作驗收

## Preview測試工具修復補記

修復後Quick已實際完成48 PASS／0 FAIL／0 SKIP／0 BLOCKED，227.110秒、exit0，證據test-results/preview-hook-quick/summary.json；完整Full本次未重跑（測試route注入局部修復，產品規則／S／RNG不變）。git diff --check通過。沒有commit／push，未修改VERSION、CHANGELOG、BACKLOG或main；其他未提交資料保留。

受驗產品d8f2df9024a946991f9fbf0d35b0340f5415266e／1.12.0。GitHub CI run 38366516472為Quick48 PASS、0 FAIL（不是Full）。Preview49個HTML／JS／CSS正規化換行後與產品相等；特性顯示Preview18 PASS，包含P/IF完整歷史正向對照。

C專項首次Preview28 FAIL：專項route.fetch取得原始game.js，繞過共用Preview route的基礎hook，導致fixture失敗；不是產品故障證據。只在smallschool-c-e2e缺少基礎hook時呼叫instrument，本機已注入時不重複包裝RNG。修復後Preview28 PASS／0 FAIL、非預期錯誤0；本機相同28案亦PASS。原失敗證據test-results/v1120-preview-c保留，成功於v1120-preview-c-fixed及preview-hook-local。這28案為三尺寸及明示fixture，不冒稱自然生涯／實機驗收；Preview先前特性18案的自然路線另記。產品、VERSION、RNG與配信設定不改，工具修改未提交／push。Quick工具回歸另記實際完成结果。

## 後續1.12.0合併提交授權（2026-10-13）

使用者已明確批准1.12.0 MINOR，以及COPY-001～005與本C實作合併提交至dev；只提交本次相關檔案，不混入D2、投手研究或tasks。VERSION／CHANGELOG／CURRENT_SPEC同步更新。出生快照在新版使用唯一VERSION＝1.12.0；未新增舊版白名單，未發布工作樹1.11.9快照為UNKNOWN、既持有稱號仍保留。下文1.11.9的Full67／Quick48及當時「版本待批准、未提交」是歷史驗收，不改寫成新版執行結果。

新增版本核對及school-policy單元PASS；1.12.0完整Quick：48 PASS／0 FAIL／0 SKIP／0 BLOCKED、240.988秒、exit 0，`test-results/v1120-submit-quick/summary.json`。版本／快照相關局部Full入口：2 PASS／0 FAIL／0 BLOCKED、479.080秒、exit 0，`test-results/v1120-submit-focused/summary.json`；內含smallschool-c-e2e 30案及trait-display-e2e 18案，Console/pageerror/JS-CSS404非預期錯誤0，P/IF完整重播及特性歷史正向對照皆PASS。環境仍為Windows、Node24.15.0、Playwright1.62.1、Chrome155.0.8059.39。已disconnect的profile清理warning保留。

升版只改VERSION metadata與測試版本期待，C／COPY產品程式及school-policy無新增行為調整，因此不重跑約65分鐘的既有全套Full。局部入口不稱完整Full；既有Full保持原受驗版本與限制。測試於提交前工作樹實際執行，當時HEAD仍0fd13c7532fd03da136c72ef64e9890858cfb81e，不冒稱已在新commit SHA再執行。测试啟動後只有文件補記與暫存範圍更新，產品／測試執行內容不變，runner起始fingerprint不是最終文件的fingerprint。新角色快照createdVersion為1.12.0；不新增舊白名單。

命令：`node scripts/test.mjs quick --playwright=<外部模組路徑> --baseline=0fd13c7532fd03da136c72ef64e9890858cfb81e --output=test-results/v1120-submit-quick`；`node scripts/test.mjs full --only=smallschool-c-e2e,trait-display-e2e --playwright=<外部模組路徑> --baseline=0fd13c7532fd03da136c72ef64e9890858cfb81e --output=test-results/v1120-submit-focused`。

本輪僅在dev本地提交指定25檔。最新main／origin/main確認SHA4624753a5359acd6c63ab6957341376bd43c5c88、VERSION1.11.9，CURRENT_SPEC頁首更新此實際基準；main分支未改。未執行CI／Preview，未push／部署；BACKLOG checkbox仍保留；D2、其他研究與tasks未暫存，既有未提交資料保留。VERSION及CHANGELOG同步為1.12.0，正式網站尚未反映。

2026-10-13；dev HEAD 0fd13c7532fd03da136c72ef64e9890858cfb81e；正式VERSION維持1.11.9，實作尚未提交／發布。使用者正式附件批准方案B、C1、出生快照及新資格，禁止commit/push/deploy。L3：出生分類、比賽與取得判定。最終 Unit／Quick／Full、原始跨版 trace／同版重播均通過；未執行範圍及發布決策見文末。下列中途失敗與當時「仍執行中」敘述是時序紀錄，最終狀態以末節為準。

## 已實作

- 原50校与顺序保持；尾端append HS_051～060批准十校；region仅设计、不入Master。
- tier25/45/20/10，两次R；HS C−4，非HS沿旧S+6/A+2/其他−2。
- birthHighSchool值复制、schema1/JP_SABC、createdVersion用VERSION，object freeze＋state不可写删改descriptor；不freeze整个S。
- 三态资格验证schema/系统/当前可信版本/Master ID与tier一致；只有有效C ELIGIBLE。旧hsTier／当前学校不能替代出生，未知无补发，旧true不取消。
- 原reachedTop、smallschool ID/名字、退休时机／纪念效果保持；grinder不变。初始C入部文字注明C級・弱小校。
- COPY任务A三处game文案及ability-view仍保留；未触D2/92事件/其他研究/原历史数据。

## 名称核对

内部60 ID/name唯一與舊50不變由單元驗證；10名各以全名／不含高校根词组合外部搜索，未找到精确同名结果，不能证明全国无同名，标UNVERIFIED。近似地域前缀存在：[石見智翠館高等学校](https://www.iwamichisuikan.ed.jp/)与[宮崎県立日向高等学校](https://hyuga-hs.ed.jp/)不是批准全名，未发现需停止的精确或重大混淆冲突；母语自然性为词组审查，不称专家认证。没有自行换名。

逐校結果如下：各校內部 ID／校名唯一性 PASS；外部精確全名搜尋未找到同名，但全國完整名錄核對均為 UNVERIFIED。地名＋意象的命名可以理解，並非日本母語專家認證；地名詞根相近不等於正式校名碰撞。

- HS_051 北風野高校：未找到精確同名；全國無碰撞 UNVERIFIED。
- HS_052 奥羽こだま高校：未找到精確同名；全國無碰撞 UNVERIFIED。
- HS_053 霞野原高校：未找到精確同名；全國無碰撞 UNVERIFIED。
- HS_054 潮見つばさ高校：未找到精確同名；全國無碰撞 UNVERIFIED。
- HS_055 信濃ほたる高校：未找到精確同名；全國無碰撞 UNVERIFIED。
- HS_056 越中あかね高校：未找到精確同名；全國無碰撞 UNVERIFIED。
- HS_057 丹波こもれび高校：未找到精確同名；全國無碰撞 UNVERIFIED。
- HS_058 石見みずほ高校：未找到精確同名；有前述石見地域前綴；全國無碰撞 UNVERIFIED。
- HS_059 讃岐はるかぜ高校：未找到精確同名；全國無碰撞 UNVERIFIED。
- HS_060 日向あおぞら高校：未找到精確同名；有前述日向地域前綴；全國無碰撞 UNVERIFIED。

## 初步测试记录（不覆写失败）

- school-policy原生初始化／概率边界／新高校fixture：PASS。首次schoolCalls把pot洗牌R算为选校R而FAIL，工具修正后PASS；产品R不改。
- 专项首次25 PASS／5 FAIL，工具ID漏补零、全局访问模块内函数、CPBL野手fixture错设投手成績。保留smallschool-c-focused。后续fixture25 PASS／3 FAIL为显示读当前CORP team；再改为读birth校，三尺寸重跑3 PASS。不是把FAIL删去。
- 原始P/IF新旧各一人生＋新版重播：PASS。P yakyo-test-001旧A新A，1023R，除birth新metadata外全部S无差异。IF s10-trait-38旧B新C，577R，全R值相同；初次差异是高校ID/name/tier，后续状态须追踪是否学校相关。完整原生输出在smallschool-c-focused/career-*-old/current/replay.json。
- IF进一步离线逐步检查：初始team由札幌北星变北風野高校；去除schoolId/tier/team与年度log的学校tm后，第一条实际机制差异是第330步、2048年「▸ 今季の成績を見る」退休取得smallschool；其余状态（能力、potSum0、成績、收入、契約、其他特性）无差异。兩組首個R差異皆不存在，不能推广为所有Seed不变。
- 退休20个tier×gate、UNKNOWN与既true2案、三尺寸PNG3案：修正fixture后PASS；仅是FIXTURE，不声称自然称号取得率。第一次PNG／学校测试所有旧失败log保持。
- 最终完整fixture专项目录smallschool-c-fixtures-final：28 PASS／0 FAIL／Console/pageerror/JS-CSS404 0。三个自然C入部画面是实际s10-trait-38正常开始；随后10校、升学／CORP／IND／PRO与退休资格矩阵为明确fixture。320px自然C与390px退休PNG截图已人工查看，名／级别／称号可读；其他尺寸保存截图与页面溢出检查，不当实机PASS。
- 首次Quick46 PASS／2 FAIL，Master整檔历史不变断言和KBO birth digest不兼容。更新仅批准10append与birth metadata检验；Quick重跑47 PASS／1 FAIL，Master比较发现档尾空行差异，改为原50及其他Master结构完全一致检查，保留原log；局部重跑结果待汇整。
- 首次Full在途中测试工具仍需修正时主动中断，NOT_COMPLETED，不当Full PASS。最终Quick／Full及专项目录结果待补。
- 最终完整Quick：48 PASS／0 FAIL／0 SKIP／0 BLOCKED，302.007秒、exit0，smallschool-c-quick-accepted/summary.json。前述失败日志不覆写。Full仍运行，不能以Quick替代。
- 历史正向合约控制首次379 PASS／2人生FAIL：测试overlay helper放在IIFE内，旧顶层退休函式无法读取，造成模块作用域ReferenceError；修正测试helper作用域后只重跑P/IF人生2 PASS／0 FAIL／Console0（542操作652R、404操作677R）。这是工具错误，不是产品或老資料迁移。完整Full仍必须重新实际通过，不能以局部结果代替。

## 版本与相容界线

createdVersion不是分類唯一凭据；JP_SABC/schema1+ID/tier是新资料分辨。老1.11.9缺快照仍UNKNOWN。正式版本号未批准，未更新VERSION或CHANGELOG；未启用旧版白名单。未来若更改正式VERSION，需要独立批准可信JP_SABC前版本读取规则，当前保守不接受未知版本。不是完整存档迁移。

正向历史对照工具approved-school-oracle只应用授权C/COPY变化，其他原机制／完整S/R仍比对；不是原始旧版一致证明。原始跨版trace由新专项目录单独保存，旧KBO故障负面源不改。所有原生日志保持、fixture未当自然证据。

## 可重現命令與修改範圍

環境：Windows／Node；Playwright 與 Chrome 版本以 runner summary.json 為準。外部 Playwright 透過 `--playwright=<外部模組路徑>` 指定，不把個人機器路徑寫進產品或測試程式。

```text
node tests/school-policy.test.mjs
node tests/smallschool-c-e2e.mjs --playwright=<外部模組路徑> --fixtures-only=true --output=test-results/smallschool-c-fixtures-final
node scripts/test.mjs quick --playwright=<外部模組路徑> --baseline=0fd13c7532fd03da136c72ef64e9890858cfb81e --output=test-results/smallschool-c-quick-accepted
node scripts/test.mjs full --playwright=<外部模組路徑> --baseline=0fd13c7532fd03da136c72ef64e9890858cfb81e --output=test-results/smallschool-c-full-final
git diff --check
git status --short
```

- 產品：`docs/src/data/jp-data.js`、`docs/src/engine/game.js`、新增 `docs/src/engine/school-policy.js`。
- 規格／設計：`CURRENT_SPEC.md`、`docs/designs/TRAIT_SMALLSCHOOL_C_TIER_DESIGN.md`、`docs/reviews/TRAIT_SMALLSCHOOL_C_DECISION_LOG.md`、本驗收文件。
- 測試入口／說明：`scripts/test-manifest.mjs`、`scripts/TESTING.md`。
- 新測試：`tests/school-policy.test.mjs`、`tests/smallschool-c-e2e.mjs`、`tests/support/approved-school-oracle.mjs`。
- 既有測試的批准差分接點：`tests/championship-intl.test.mjs`、`event-integration.test.mjs`、`full-power-pitching-e2e.mjs`、`international-personal-stats-e2e.mjs`、`kbo-renewal-e2e.mjs`、`stage10-risk-e2e.mjs`、`trait-display-e2e.mjs`、`verify-modularization.mjs`、`support/baseline-initial-potential.mjs`（均在 tests 下）。
- 先前 A 任務的 `docs/src/ui/ability-view.js` 及 game.js 文案差分仍在工作樹；不是本 C 新增的遊戲調整。其他未提交研究／D2／tasks 文件保留，不混入本次修改。

Full 執行期間，在 stage10 入口執行前更新一個舊人工注入案例：有效出生 B 加上 hsTier 3 仍不得取得 smallschool。原注入與 grinder/RNG/退休前完整狀態比較保留；此更動只有測試期待，不是產品變更。runner 啟動時的 fingerprint 早於此測試更新，應與各入口實際 log 及最終靜態檢查一併閱讀，不冒稱整輪起始 fingerprint 已包含這個更新。

## 最終驗收結果

- PASS：`school-policy.test.mjs`；原 50 校內容／順序、其他 Master、60 ID／名稱唯一性、S20/A22/B8/C10、抽選邊界、10 所 C 的原生工廠 fixture、P/IF 初始 ab/pot/potSum0／呼叫次數、不可變快照及三態資格皆通過。
- PASS：完整 Quick，48 PASS／0 FAIL／0 SKIP／0 BLOCKED，302.007 秒、exit 0；證據 `test-results/smallschool-c-quick-accepted/summary.json`。
- PASS：完整 Full，67 PASS／0 FAIL／0 SKIP／0 BLOCKED，3933.117 秒、exit 0；證據 `test-results/smallschool-c-full-final/summary.json`。未用局部測試替代，沒有 reused 入口。產品在整輪期間未修改；stage10 的單一舊期待更新時點與 fingerprint 限制已在前節明記。
- PASS：Full 中 `smallschool-c-e2e` 30 案例、0 FAIL、Console/pageerror/JS-CSS 404 非預期錯誤 0。其中 28 個明確 fixture／UI 案例及 2 個原始人生／精確重播案例；證據 `test-results/smallschool-c-full-final/tmp/smallschool-c/summary.json`。
- PASS：P `yakyo-test-001` 舊 A／新 A，1023 次 R，各值完全相同；排除新增 birth metadata 後狀態相同。同版完整重播相同。IF `s10-trait-38` 舊 B／新 C，577 次 R，各值完全相同；首次狀態差異在出生抽校，同版完整重播相同。元資料及完整原始初始 S／逐步 S／R 保存在同目錄 `cross-version-replay-P/IF.json` 與 `career-P/IF-old/current/replay.json`。這是兩個路線的結果，不宣稱其他 Seed 或高校分支的 R 永遠不變。
- PASS：三尺寸 1280／320／390 的新校名、C 級入部說明、高校生涯 UI、特性取得說明、退休列表／PNG 與頁面溢出檢查；320 入部及 390 退休 PNG 已人工查看。所有十校的展示來源為原生初始化受控抽選 fixture，不冒稱十條自然生涯。真實行動裝置仍 NOT_RUN。
- PASS：投球強度 36 案例、Stage10 57 案例（0 BLOCKED、30 筆預期故障注入、非預期錯誤 0）、能力操作 89 案例、特性顯示 18 案例，以及 Full 其他合約、收入、升降格、事件、國際賽、退休／殿堂與交易安全入口。
- PASS：最終獨立語法檢查 121 個 JS 檔案、再次高校單元檢查及 `git diff --check`；已確認 `git status -sb` 仍為 dev，HEAD 不變。

環境：Node v24.15.0、Windows win32、Playwright 1.62.1、Chrome 155.0.8059.39。部分瀏覽器入口有「已斷線瀏覽器 profile cleanup timed out」警告；它們 exit 0，案例與非預期錯誤檢查通過，警告仍保留於原 log／summary，未當產品錯誤或靜默刪除。

最終產品測試沒有未解決 FAIL。中途工具／舊期待值 FAIL、環境受限診斷及第一次中斷的 Full 均保留原紀錄，不將它們改寫為 PASS。

Git tracked diff 為 15 檔、56 行新增／19 行移除，包含先前 A 的既有變更；`jp-data.js` 是單行 JSON，行數不能代表新增資料量。新增 helper／測試／設計與本報告屬 untracked，不含在 tracked stat。與本任務無關的 untracked D2／研究／tasks 文件不列入本 C 修改。

## NOT_RUN、相容限制與待批准事項

- NOT_RUN：真實 iOS／Android、GitHub CI、Cloudflare Preview、正式部署；使用者明令禁止提交／push／部署，沒有以本地 PASS 宣稱 CI／公開驗收 PASS。
- UNVERIFIED：全國完整校名名錄與母語專家審查；外部搜尋未見精確撞名，但不證明絕對唯一。
- 保留限制：目前沒有完整舊存檔遷移。UNKNOWN 不補發；舊 true 保留；不映射 B→3／3→C；不啟用舊版本白名單。既有退休函式的其他重複呼叫副作用未重構，本次只防止稱號重複取得。
- 發布前待批准：正式 MINOR 版本號及同步 VERSION／CHANGELOG 的時機。新舊出生資料已靠 JP_SABC/schema 區分，沒有虛構版本或本次實作 blocker；但未取得發布版本批准，不可把未發布的 1.11.9 工作樹當正式新版。未來跨版本讀取已驗證 JP_SABC 快照的可信版本範圍，須另作明確批准，不能自動接受所有版本。
- 不變：正式 VERSION／CHANGELOG、BACKLOG checkbox、其他特性条件、grinder、事件 92 筆翻譯、非高校／職業公式、RNG 演算法、workflow／CNAME／配信設定。先前 A 文案與其他未提交文件保留，未修改 D2。
- 未 commit／push／merge／deploy、未修改 main；相關 BACKLOG 不標 DONE。完成本地實作與驗收後停止，等待使用者驗收及上述發布決策。

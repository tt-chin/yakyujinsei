# 第六階段：能力配分與狀態一致性補強驗收

日期：2026-10-11（JST）。本報告是測試／調查證據，不是遊戲修正授權。

## 1. 基準與結論

- Repository `tt-chin/yakyujinsei`，分支 `dev`。fetch 後 HEAD／origin/dev：`90bcdde17aaece1ff3463a69177aaa6d3d50a672`，工作樹乾淨。
- origin/main：`e886e84ca08c6c185406cac9d6f3c4376277061a`；VERSION `1.11.4`，管理檔 `docs/src/config.js`。本次不升版、不改 CHANGELOG、main、配信資產或公開流程。交付 SHA 以 Git 履歷及最終回報列示，不在同一提交內自引用。
- 已讀 AGENTS、CURRENT_SPEC、BACKLOG、CHANGELOG、HTML、第五階段[稽核](STAGE5_SPEC_ARCHITECTURE_AUDIT.md)／[路線](STAGE5_REFACTOR_ROADMAP.md)，核對前五階段結案與既有 Runner／ACT／契約驗收限制。沒有覆蓋既有使用者修改。
- **整體：調查及引用修復完成，但安全性驗收未全通過。** 不將文件完成或 quick 綠燈解讀成遊戲風險已解決。
- **AUD-03B：FAIL**。正常／邊界矩陣通過；保存並呼叫已切離 DOM 的能力行／確定 callback，兩項安全斷言失敗。正常指標操作尚未證明會自然觸发此模式，因此列 CONFIRMED_RISK，未宣稱 CONFIRMED_BUG。
- **STATE-TRANSACTION-AUDIT-01：FAIL**。正常操作通過；原生 CORP 同年重入、簽约前建立失敗及付款後描畫失敗，三項安全斷言失敗。調查已完成指定情境，但關鍵 FAIL 保留未完成，修復另立 ID、等待批准。
- **SPEC-SOURCE-LINK-01：PASS**。五個引用改成可信 Git 歷史固定網址；其餘規格文字及數值完全不變。

## 2. 環境與證據方法

Windows、Node 24.15.0、Playwright 1.62.1、Chrome 155.0.8059.39；headless loopback。PC 1280×844、mobile/touch 模擬 320×844／390×844，**不是 Safari／Android 實機**。不新增 npm 依賴。

`tests/support/stage6-browser.mjs` 只對測試 HTTP 回應加入觀察器，不寫遊戲檔。呼叫原生 newState／setAmateur／setSchool／allocUI／allocDone／amateurSeason／phaseEnd／signTo／advance／choose。R 包裝呼叫原 R 一次、原值返回，記錄 before/after rngState 與每個值，不改算法、不重抽。fixture 初始化的亂數不混進操作增量，初始完整 S 包含初始化後 rngState。

每組 JSON 保存 input、操作順序、中間及最終完整 S、carry、ab/pot、pool/idx/dice/history/touchedKeys 閉包、R 順序和值、DOM、onclick/onkeydown 存在性、disabled/tabIndex/連接狀態、choice generation/token、stepQ、確認次數。事件 listener 不由 outerHTML 推測，另保存原生 property 的型別並實際點擊。快照不是生涯存檔功能。

正常三尺寸 fixture seed 為 `stage6-P`／`stage6-IF`；共用 PC 邊界頁 seed 為 `stage6-P`，fixture 位置另外明確設定為 P 或 IF。交易頁 seed `stage6-transactions`。三訓練 session 的 combo 案以 2032／2033／2034 年度標記控制 fixture，不冒充自然完整年度進程；完整生涯另由既有入口驗證。

## 3. AUD-03B 矩陣

| 組別 | 實際案例／操作 | 結果及限定範圍 |
|---|---|---|
| 正常配分 12 | P/IF × pool3/dice[2,4,6] × 1280/320/390 | PASS；pointer/tap→Undo→Enter/Space→reset→改順序重新配分→確定→下一操作；每一步保存 S/閉包/R/DOM |
| 成本 28 | P 54/55/59/60/65/66/79/80；IF63/64/71/72/79/80，各 pot=cur/80 | PASS；獨立依核准公式計算每次 pool1、逐步跨門檻與 carry；超 pot P×4／IF×3；cap80 禁止操作 |
| 全 cap／0點 3 | 全能力80，pool0/pool3/dice[2,4,6] | PASS；無可配分行，Undo/reset 禁用，可丟棄剩餘或確定，R0 |
| carry 等價 2 | P/IF，缺 key vs explicit0，配分→Undo→重配→確定 | PASS；數值、後續完整 S、touchedKeys、R 與確認輸入一致；Undo 中間物件形狀不同 |
| combo 解鎖 2 | P/IF，三次 dice[2,4,6] 全集中 | PASS；samePick1→2→3、第三次一個 combo、鎖定 key、下一 phasePre 原生自動投入有發動 |
| late 邊界 16 | P/IF × age24/25/31/32 × dice12/16點 | PASS；12點不解鎖，age25–31且16點／OVR<47才解鎖；兩能力+5／pot+10，P shuffle3R、IF shuffle8R；下一訓練 dice3–6 |
| 手機 cap 4 | P/IF × 320/390，79加carry跨80 | PASS；到80禁用，Undo/reset 復原能力/carry/dice，無横溢出；lastOverflow 暫存差異見§4 |
| combo 分散 2 | P/IF，dice[2,4,6] 分三能力、三 session | PASS；最大占比50%，samePick0，未解鎖，R0 |
| 快速操作 6 | P/IF × 三尺寸；PC真實 dblclick、手機連續 tap | PASS；兩次只消耗2點、hist2；Undo只退1點；R0 |
| combo 75% 2 | P/IF，dice[3,3,6] 同能力3+6／總12 | PASS；恰75%可累计，第三 session 解鎖 |
| carry 解鎖等價 4 | P/IF × combo/late，缺key/0各重放Undo及解鎖 | PASS；完整後續 S／特性／確認輸入／逐值R一致，不只比較能力 |
| late 阻擋 6 | P/IF × genius／OVR≥47／有效HS age16 | PASS；未解鎖、R0。HS案包含年齡條件，不稱證明「late有獨立HS guard」 |
| 切離能力 callback 1 | pool耗盡後呼叫第一行保存的 onclick | **FAIL／CONFIRMED_RISK**，pool0→−1、vel43→44、touched3→4、R0 |
| 切離確定 callback 1 | pool0確定後，再呼叫保存的 onclick | **FAIL／CONFIRMED_RISK**，done1→2、R0；正常 click 未見重複 |

合計89案：87 PASS／2 FAIL。成本／解鎖的細數值矩陣以PC執行，手機另外涵蓋正常、cap、Undo/reset、快速操作、Enter/Space及排版；不宣稱全成本×全尺寸笛卡兒積。三尺寸無横向溢出，Undo/reset bounding box 不重疊，確認後 next 選項可見且listener實際有效。

## 4. carry、touchedKeys、序列化與暫存欄位

- P：`{sta:0}` 配分 vel 後 Undo 變成 `{sta:0,vel:0}`；IF相應 con。`carry[k]||0`、成本、點數、UI進捗讀取等價；Undo 清除此次 touchedKeys，reset 清 history/touched，原骰及idx0重用，操作 R 增量0。
- JSON 物件序列化**不相同**；不能稱 Undo 完整 S byte-for-byte 回到原始形狀。後續相同重配、確認、combo／late解鎖的完整 S／確認輸入／R trace 實測一致。沒有觀察到該缺key→0造成能力、特性、成績或進度異常，故不新增 carry Bug、不擅自改缺欄位語意。
- 79→80的溢出案例：lastOverflow0→1，Undo/reset 後仍1。這是完整快照中另一个真實差異。靜態引用僅 addAb寫入與phasePre combo讀取；combo在讀取之前先執行addAb重新設定。沒有觀察到暫存值造成下游錯誤，**不以非全物件等同直接判 Bug**；未知動態路線不外推無風險。
- 本輪控制 fixture 的重放和既有固定生涯證據互補；後者不包含任意新增Undo路線，不能靠相同 seed／不同選擇保證同一人生。

## 5. CORP 與簽約交易矩陣

| 案例 | 有效輸入、操作及原生位置 | 預期／實際與判定 |
|---|---|---|
| CORP正常UI | newState→setAmateur(CORP)，2032／25歲→原生amateurSeason產生大会与年度log→choose callback phaseEnd | PASS／NO_ISSUE_OBSERVED；corpIncome與careerEarnings各+4,200,000円，log維持1；舊choice回呼兩次不再付款／取R |
| CORP原生重入 | 同上，已完成且有效球季；直接phaseEnd3060同年兩次 | FAIL／CONFIRMED_RISK；corpIncome與earnings0→4,200,000→8,400,000円；log仍1、R維持季賽3次，不重造大会／log，但重付企業給与 |
| 正常簽約 | CORP→NPB2，固定team NPB_CL_TOK；1年ROOKIE，signed2032/start2033、年俸6,000,000／契約金50,000,000円 | PASS／NO_ISSUE_OBSERVED；seq1、ct/所属/currentSalary一致，bonus一次、base salary未付；舊choice回呼不生新約；advance到2033并保留未付年度表與下一選項 |
| fixedContract前throw | 同合法契約輸入，在fixedContract入口注入STAGE6_FAULT_INJECTION | FAIL／CONFIRMED_RISK；例外後stage=PRO/org=NPB/lv=NPB2但ct=null、原所屬CORP已丟失；未付款、seq0、R0。DOM恢復可点；移除fault重試seq1、一次bonus，2033有有效年表 |
| 付款後描畫throw | 同輸入，card('契約')階段注入同fault，原生簽約及付款已完成 | FAIL／CONFIRMED_RISK；失敗時contractId…001／bonus50,000,000；恢復舊選項重試變…002／bonus100,000,000／earnings100,000,000；未付base仍0。R0、下一年度可進入2033，年表仍6,000,000未付，但重付既有契約金不可接受 |

合計5案：2 PASS／3 FAIL。兩個簽約例外是**明示 fault injection**，不是自然出現的KBO政策錯誤，不借此修改package/floor/倍率。正常PRO契約邊界另以既有381案回歸確認。

CORP直接重入是合法原生函式對有效 completed season 的第二次呼叫；normal queue只有一个phaseEnd，choose的token/generation防護阻擋保存的舊choice。尚未證明現行正常UI會二次排入同年度phaseEnd。先前想定的「有原生公開路徑」應限定為IIFE內合法函式呼叫／測試hook，不是瀏覽器全域提供的玩家API。

signTo2812先寫org/lv/stage/team，fixedContract2810才建立約；runChoiceAction（docs/src/ui/choice-action.js:48–62）恢復DOM/token，但不回復S或既完成交易。因此付款本身按contractId去重並沒有失效，**重試新建不同ID繞過同約去重**。尚未證明一般部署會自然發生這兩個指定例外，也未宣稱自然路線重付率。年度履歷同年同型去重不會變成兩筆，但這不能掩蓋重付與ID更換。

## 6. 待使用者批准的最小修正提案

本輪沒有實作以下方案、不升PATCH。三個獨立待辦ID，全部P1／CONFIRMED_RISK，正常UI可達性仍須保持限定：

1. **ALLOC-STALE-CALLBACK-01**：在局部alloc session維護完成／世代guard；每個行／Undo/reset／confirm使用目前session與目前剩餘量而非保存available；確認先鎖單次完成，再呼叫allocDone/done。保持DOM、成本、R、骰序；回歸 stale row／confirm、rapid pointer、keyboard、Undo/reset、combo/late及P/IF生涯。不直接套用會清空既有新選項的choice token流程。
2. **STATE-CORP-REENTRY-01**：只對CORP年度付款／年度結算增加同S／同year的一次性guard，在成功結算前後安排正確commit位置。保留企業工资公式與既有PRO/IND政策，不將「已執行起點」當成功而吞例外。回歸同年重入、次年正常付、pool配分之後movement、事件outside income與年度log/R。
3. **STATE-SIGN-ATOMICITY-01**：先準備／驗證契約再commit所屬與收入；描畫失敗後保留已成功交易結果，重試只重畫並沿用同contractId，不再呼叫簽約及付款。避免全面克隆／回滾S與R掩蓋既完成付款或破壞函式accessor。回歸兩個fault點、候選快照、保障年表／收入／decision、二次重試、下一年度，以及既有draft／KBO／FA／跨聯盟和P/IF RNG。這個提案可能需要局部完成文脈，實作前另確認具體最小修改。

**CONFIRMED_BUG 0、CONFIRMED_RISK 5個失敗案例（3個工作ID）、NO_ISSUE_OBSERVED限表列成功情境。** 不是宣稱全遊戲無Bug。carry／lastOverflow結構與scratch差異目前不另列Bug。

## 7. 五個規格引用修复

刪除提交 `004cd263fd828c0f29d5e9caebe7626efa8efe62` 明確刪除下列文件；其父提交 `6a31b27d11ce125ff3cc4104b3c0ad3fda785b29` 透過git ls-tree及cat-file驗證五個原始blob存在。docs/archive未找到同名移管檔；不恢復原文到工作樹。各現行章節已記錄批准后的正式規則，但沒有全原文數值／文案附件，因此保留可信固定歷史出處，而非聲稱附件完全移管或憑空新增文件。

| 最新行 | 原失效相對引用 | 新引用及現行優先章節 |
|---|---|---|
| 157 | FIX_DRAFT_SIGNING_BONUS_INCOME_DISPLAY.md | 同名檔Git父提交permalink；現行§7與§11優先 |
| 182 | YAKYUJINSEI_JP_EVENT_92_COPY.json | 同名JSON固定permalink；現行event-cards-jp.js與§10／§13優先，原文是copy來源證據 |
| 194 | YAKYUJINSEI_EVENT_SYSTEM_IMPLEMENTATION_SPEC.md | 同名檔固定permalink；現行§10／§13優先 |
| 194 | YAKYUJINSEI_JP_EVENT_92_COMPLETE_DATA.md | 同名完整資料固定permalink；現行§10及實data優先，舊文案不覆蓋修訂文案 |
| 342 | CODEX_TRAIT_JP_38_COMPLETE_MASTER_SPEC_UPDATED.md | 同名檔固定permalink；現行§12批准事項優先 |

`tests/spec-source-links.test.mjs`：4個現存本地Markdown link＋5個Git歷史來源全部通過，歷史SHA必须40位且对应blob存在。沒有只用「https開頭」假定來源可信。與作業前HEAD去除Markdown link targets後逐字比較一致，恰5個target改變；行號、數值、其餘文字不變。歷史網址可重現不代表歷史提案重新生效；依現行AGENTS與正本章節判定。其餘外部網站完整連通性不在此本地引用檢查範圍。

## 8. 指令、日誌與實際結果

`<PLAYWRIGHT_MODULE>`為已安裝外部模組；個人絕對路徑未寫入程式。所有命令由Runner記錄完整實際args、SHA、比較基準、環境、exit/時間/log hash。

```sh
node scripts/test.mjs list
node scripts/test.mjs quick --playwright=<PLAYWRIGHT_MODULE> --output=test-results/stage6-quick
node scripts/test.mjs full --only=stage6-ability-e2e,stage6-state-transaction-e2e --playwright=<PLAYWRIGHT_MODULE> --output=test-results/stage6-release-evidence
node scripts/test.mjs full --only=contract-salary-e2e --playwright=<PLAYWRIGHT_MODULE> --output=test-results/stage6-career
node scripts/test.mjs quick --only=syntax,spec-source-links.test,test-runner.test --output=test-results/stage6-final-static
```

- list：65個tests檔／59個自動入口（含syntax）；4個新增tests檔中的support不直接執行。沒有沿用舊61個數量。
- quick：45 PASS／0 FAIL／0 SKIP／0 BLOCKED，exit0，224.245秒；ACT fixture102.678秒、Draft quick85.942秒、KBO15.261秒。此輪quick後僅補強測試fixture／報告；最終構文／link／Runner另重驗，提交後CI再驗最終quick。
- 能力專項：89案，87 PASS／2 FAIL；交易專項5案，2 PASS／3 FAIL。兩個入口都exit1，Runner統計0 PASS／2 FAIL／0 SKIP／0 BLOCKED，75.246秒；保留FAIL不包裝為「風險測試PASS」。full/audit登錄這兩個入口，**目前完整profile會因上述未修安全斷言非零**；quick通過不替代它們，不默默排除。
- 既有contract-salary-e2e：381 PASS／0 FAIL，exit0；內部測試70.651秒，Runner（包含browser preflight／清理）102.855秒；Console/pageerror／JS/CSS404=0。
- 固定生涯：`yakyo-test-001/P` first-row策略542操作、RNG652、2058退休；`jp3-infielder-01/IF` balanced策略404操作、RNG677、2050退休。與完整解析的origin/main SHA逐步S摘要／選擇／RNG state及calls比較一致，新版重跑也一致；這是現行策略，不拿其他歷史操作數覆寫預期。
- 專用正常操作Console／pageerror／JS/CSS404=0；兩個fault案各保存预期的CHOICE_ACTION_FAILED及STAGE6_FAULT_INJECTION錯誤，從unexpected error另分列，不假稱注入失敗時Console0。每次fault及重試簽約R增量0。
- 最終static：syntax、spec-source-links、test-runner三入口3 PASS／0 FAIL／0 SKIP／0 BLOCKED，18.386秒，exit0。配信遊戲／config／HTML／CSS與作業前HEAD的Git diff為空，VERSION／CHANGELOG亦無差異。
- Windows瀏覽器已disconnected後profile清理可能15秒timeout，另記cleanupWarning；不能把仍連線／未知錯誤吞成PASS。網路sandbox首次loopback拒絕，重試經批准權限執行；初始環境失敗與最終風險斷言失敗分開，不用前者當遊戲Bug。
- 開發中高中fixture誤用setAmateur('HS')造成teamId錯誤，修正為原生setSchool／有效age16並重跑；中間日誌保留，驗收採最終有效fixture，不將該錯誤當遊戲Bug。

本機日誌及每案JSON在上述ignored test-results內；**不會隨Git commit提供**。本報告保留命令、關鍵輸出與最小重現步驟，任何人可重跑。未執行其他full/audit全部profile、4,000生涯、Safari/Android實機、全部低速回調／例外點或所有聯盟交易故障。未執行不計PASS；三尺寸不代替實機。

## 9. BACKLOG及提交後確認

- SPEC-SOURCE-LINK-01移至已完成，2026-10-11及本報告連結；AUD-03B／STATE-TRANSACTION-AUDIT-01仍未完成，明確區分正常PASS與安全FAIL。
- 新增上述3個風險修復ID，保持前五階段歷史與結案，不改寫旧报告數字；第六階段標記調查完成／驗收未全通過。
- 由正式checkbox重新計算：**11完成／32未完成，43唯一ID**；未完成主要status BLOCKED3、IMPLEMENTED_UNVERIFIED7、DESIGN_PENDING6、其他16。P0未完成0；P1規格／回歸9、殿堂6、實機／文案4；P2保留6、候補7。新風險待批准，不算已完成修復。
- 測試／文件主提交：`2e8d4404047225469519aa4d36e2449fb9f3de2e`，已push至origin/dev。[Linux CI 38145495448](https://github.com/tt-chin/yakyujinsei/actions/runs/38145495448)實際SUCCESS；Ubuntu24.04／Node24.15.0／Playwright1.62.1／Chromium151.0.7922.34，quick **45 PASS／0 FAIL／0 SKIP／0 BLOCKED，148.585秒、exit0**；workflow檢查及日誌artifact上傳成功。兩個安全專項屬full/audit、不在quick，本輪未於Linux重跑安全專項，不能把CI成功當它們PASS。
- 該SHA的Cloudflare Pages check SUCCESS，deployment `0918dc6d-bbbc-476c-b11a-4344c8f7cb0c`。[dev Preview](https://dev.yakyujinsei.pages.dev)的index.html、src/config.js、src/engine/game.js及reviews/STAGE6_ACCEPTANCE_AUDIT.md皆HTTP200、LF正規化後內容與該提交一致。這是部署／內容比對，不冒稱另跑Preview整套遊戲E2E。
- 此後只補本文的CI／Preview證據與精確耗時，未變測試或遊戲；文件補記提交的SHA由Git及最終交付訊息提供。main／origin/main仍為`e886e84ca08c6c185406cac9d6f3c4376277061a`，不部署正式網站。
- 下一步建議先由使用者決定是否批准3個局部防護修正，再對相同失敗案與既有回歸驗收。**停止於本階段，不自動開始第七階段／重構。**

### CI 證據補記（觸發效率改善後）

- 後續CI設定／檢查工具修改的實際受測SHA：`f85d0ee1cf1264dd7a9850eaaf3fe1e209f2e85c`。[CI 38147408119](https://github.com/tt-chin/yakyujinsei/actions/runs/38147408119)成功，quick 45 PASS／0 FAIL／0 SKIP／0 BLOCKED，208.967秒；精確白名單／混合變更檢查通過。遊戲與第六階段安全專項未修改，上述風險FAIL仍有效，quick成功不代表風險已修復。
- dev push只排除BACKLOG.md與本報告的純證據補記；PR及手動觸發不排除。本次僅補此CI證據，後續純文件提交的完整SHA由最終交付提供，不宣稱該文件提交重新通過CI。實際跳過與Preview結果另在交付確認，避免循環追加提交。

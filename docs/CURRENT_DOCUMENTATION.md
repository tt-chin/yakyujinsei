# 現行開發文件導航（1.13.0）

2026-10-16：只作導航，不新增產品規格或工程授權。

> 2026-10-18現況補註：開發工作區已移至`C:\src\yakyujinsei`，舊OneDrive工作區已不存在。使用者已接受不保留舊A／B完整S／RNG／Receipt與原始圖像／trace，不建立完整外部封存；歷史結論與限制見[精簡驗收摘要](reviews/RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)。舊驗收數字不變，但不再保證可逐步複核原完整集。少量本機保留檔不等於完整基準；本次沒有刪除其他原件、執行新Quick／Full或授權新產品工作。以下較早的封存／保留規則依其原時點解讀。

## 每次開發先讀

- [AGENTS](../AGENTS.md)：作業規則、權限與測試要求。
- [CURRENT_SPEC](../CURRENT_SPEC.md)：現行產品規格；D2在第17節。
- [BACKLOG](../BACKLOG.md)：未完成事項、批准等待與限制。
- [TESTING](../scripts/TESTING.md)：Runner入口、依賴及測試範圍。
- [正式1.13.0驗收](reviews/RELEASE_1130_PRODUCTION_ACCEPTANCE.md)：來源SHA、正式站SHA、Quick及基本Smoke；Linux Full NOT_ACCEPTED／DEFERRED，artifact缺口未解除。

## 架構入口（有歷史基準限制）

- [詳細設計](design/CURRENT_DETAILED_DESIGN.md)
- [狀態及RNG](design/STATE_AND_RNG_REFERENCE.md)
- [模組與函式](design/MODULE_FUNCTION_INDEX.md)
- [流程與UI](design/FLOWS_AND_UI_REFERENCE.md)

這四份包含1.11.5固定快照及後續補充，不宣稱AST／行號全部已同步1.13.0；以現行程式與CURRENT_SPEC判定，缺口由BACKLOG追蹤。

## D2必須保留的技術來源

- [現行技術契約索引](../CURRENT_SPEC.md#d2-technical-contract-index)：產品數值以CURRENT_SPEC為正本；以下只引用D2的精確技術章節，不將整份歷史設計視為現行規格。
- [RNG／精度／向量§14.13.1](designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-contract-rng)、[Journal／Receipt§14.13.2](designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-contract-receipts)、[Checkpoint§14.13.3](designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-contract-checkpoints)。
- [ID／Consumer§14.13.4](designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-contract-consumers)、[故障Gate§14.13.5](designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-contract-gates)、[歷史相容十條§14.13.6](designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md#d2-contract-history)。原段落的設計時點標籤不改寫；Runtime完成範圍須另讀A／B證據，不能把候選或任意崩潰恢復寫成已實作。
- [D2主設計](designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md)：批准規則、RNG編碼／精度、身分與可信Decision、consumer及故障Gate的技術來源；舊狀態標籤按時點解讀，不自行恢復舊候選或視為新授權。
- [Decision Log](designs/PITCHER_AWARDS_D2_DECISION_LOG.md)：批准沿革，非取代現行規格。
- [工程計畫](../tasks/PITCHER_AWARDS_D2_PHASED_IMPLEMENTATION_PLAN.md)：現況索引及原Gate／回復契約。
- [A驗收](reviews/PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)、[B驗收](reviews/PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md)：特定SHA／本地範圍，不能代替Linux Full。
- [基準v2校驗附錄](reviews/development-a/BASELINE_VERIFIER_SUPPLEMENT.md)：歷史A封存路徑與信任錨；完整原件不再保留，不是目前可直接執行的校驗入口，不能用只有hash的摘要冒充可重播封存。
- [CI證據缺口](reviews/D2_G9_CI_EVIDENCE_ACCEPTANCE.md)：ARTIFACT_COVERAGE_BLOCKED。

## 歷史設計與驗收證據的讀法

- [歷史／取代索引](../CURRENT_SPEC.md#d2-historical-design-index)：D1比較、A曲線／NPB13、舊P08模型及技術候選保留原文，不作現行政策。Decision Log是批准沿革，不由舊AF09標籤推翻後續明確授權，也不產生新的工程授權。
- A／B報告的本機Full75／80是各原SHA／版本證據；G2 Safari52是同來源RNG實機證據；正式站Smoke6是基本P／IF及手機尺寸模擬。三者不能相互替代或算成本輪新PASS。
- [執行與差異契約](../CURRENT_SPEC.md#d2-execution-compatibility)要求合法差異的完整因果鏈；同版重播仍嚴格比較全部狀態。Linux Full維持NOT_ACCEPTED / DEFERRED，完整artifact保存仍BLOCKED。

## 文件整理界線

[整理計畫](reviews/DOCUMENT_AUDIT_1130_PLAN.md)及其本機JSON逐檔清單是盤點快照，不是可執行刪除白名單。D1／D2、分析JSON仍可能被工具讀取；獨有條款未證明完整移轉前一律保留。正式測試、golden、fixture、研究原始資料及批准技術條款不受大型測試輸出保留取捨影響。其他歷史結果與未提交成果仍需獨立分類、明確批准，不因新版發布自動刪除。

第二階段分析已接受，最小規格引用與AGENTS去重已獲批准；[原66條分析](reviews/DOCUMENT_AUDIT_1130_STAGE2_ANALYSIS.md)保留為修改前快照，[本次逐項處理與驗收](reviews/DOCUMENT_AUDIT_1130_STAGE2_MIGRATION.md)區分保留、補文、精確引用、歷史定位及仍待核對。文件整理尚未全面完成，BACKLOG不提前結案；第三階段刪除／移動／封存、產品修改、提交與部署均不在本次授權內。

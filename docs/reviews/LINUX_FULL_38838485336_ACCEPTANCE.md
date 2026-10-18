# Linux Full 正式驗收：FAIL

> 2026-10-18證據可用性補註：本輪58 PASS／22 FAIL維持原結果，不改成PASS。文內artifact本地下載路徑屬已刪除的舊工作區，不能再宣稱原件仍完整可複核；後續短路徑Smoke及另一輪中斷與本輪分開記錄，見[精簡摘要](RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)。本次沒有重跑或重新調查Linux Full，ARTIFACT_COVERAGE_BLOCKED維持。

- Run：https://github.com/tt-chin/yakyujinsei/actions/runs/38838485336
- Attempt：1；workflow_dispatch，僅觸發一次。
- dev／Commit：9b98ffa3e69449665656fa6a56da4555ca0394f3；VERSION 1.13.0。
- 觸發前遠端dev SHA一致；未修改任何產品、Workflow、測試條件或版本，未重跑。

## 實際結果

8批各10項均產生完整summary；PASS／FAIL依批次為10/0、7/3、7/3、6/4、7/3、9/1、7/3、5/5。合計80項：58 PASS、22 FAIL、0 SKIP、0 BLOCKED、0未驗證。這是入口執行結果，不表示22個瀏覽器案例已完成內部驗收。

Aggregate實際為FAIL_OR_INCOMPLETE，counts與各批一致，沒有將FAIL誤判PASS。整體Run為failure。

## 失敗原因

下載的第2批ACT、championship及contract log明示Chromium FATAL：`process_singleton_posix.cc:313 Socket path too long`，路徑位於`test-results/ci-full/batch-2/tmp/org.chromium.Chromium.*/SingletonSocket`，瀏覽器SIGABRT。新分批輸出路徑加深，原Runner將TMPDIR設在該批output/tmp，導致Linux socket路徑限制；這是CI分批路徑相容性問題，不能稱為遊戲斷言錯誤。其他失敗的逐入口因果尚待完整分類，不擅自全部推定同因。沒有依本次證據修改遊戲的理由。

## Artifact核對

已下載8個獨立分批artifact：`tests-full-38838485336-1-batch-1`至`tests-full-38838485336-1-batch-8`，另有總結artifact `tests-workflow_dispatch-38838485336-1`。

本地保存位置：`test-results/linux-full-38838485336-artifacts/`。逐批核對plan的Commit、receipt Run ID及每批10筆結果；80個入口log的SHA256全部與summary一致。總結artifact的aggregate記錄同一SHA、Run ID、attempt及58/22結果。本次分批下載／身分／log內容校驗成功，不等於完整原始S／RNG可重播封存。

ARTIFACT_COVERAGE_BLOCKED保持獨立，未解除。未重新觸發、修改或提交修正；需另行批准縮短CI暫存／輸出路徑並完成限定Linux相容性檢查，再申請新一次Full。正式整體驗收不通過。

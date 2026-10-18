# Linux Chromium Smoke：PASS

> 2026-10-18證據可用性補註：以下是原Run的歷史最小Smoke結果，不是新工作區重測；文內test-results下載路徑屬已刪除的舊工作區，不再保證原始payload可下載或完整本地重驗。保留Run／SHA、原PASS範圍及[精簡摘要](RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)。Linux Full仍NOT_ACCEPTED / DEFERRED，ARTIFACT_COVERAGE_BLOCKED不變。

2026-10-16。受驗dev commit `650e4dd21718b4abec3876fc9ef6148714c21d4f`；VERSION 1.13.0。

- Run：https://github.com/tt-chin/yakyujinsei/actions/runs/38840993314
- Attempt 1；workflow_dispatch linux-smoke；僅觸發一次，Run success。
- 真實GitHub Linux Runner；Node24.15.0、Chromium151.0.7922.34。
- 工具測試32 PASS／0 FAIL／0 SKIP：Linux專用唯一性、0700、symlink realpath及清理測試不再SKIP。
- Smoke PASS：Chromium正常啟動、建立頁面及關閉；socket預期路徑61 bytes，沒有Socket path too long；別名清理後原批次evidence.json仍存在。
- 原生Runner限定choice-action.test 1 PASS；確認短別名接線及原批次summary／log輸出。此處Runner mode雖為full，但only僅選一個入口，絕不代表80項Full。
- Artifact `tests-workflow_dispatch-38840993314-1`，ID12021411914，5782 bytes，已下載至 `test-results/linux-smoke-38840993314-download/`；summary核對相同commit／Run／attempt，含原生Runner報告及log。

本次7檔提交包含短路徑修正、Smoke工具與既有workflow手動選項接線。push／PR規則、80項集合、產品與版本不變；平行變更未提交。dev推送依既有規則另外自動Quick，Smoke結果不替代其結果。

限制：只證明最小Linux啟動、路徑與證據保存鏈；未執行80項Full、8批實際上傳及完整生涯。ARTIFACT_COVERAGE_BLOCKED不解除。Smoke成功後停止，未重跑、未觸發Full、未修改main或正式部署。本結果報告留本地待審，不再自動提交。

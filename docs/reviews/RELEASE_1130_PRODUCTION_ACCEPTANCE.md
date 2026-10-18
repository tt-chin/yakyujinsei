# 1.13.0 正式發布：SUCCESS

> 2026-10-18歷史紀錄補註：下文SUCCESS、SHA、Run及Smoke均為2026-10-16發布時的驗收，不是本次重新部署／查詢。原文「原件全部保留」及「僅留本地」屬當時狀態；後續使用者已放棄完整舊測試輸出封存並遷移工作區，現況限制見[精簡歷史摘要](RELEASE_1130_COMPACT_ACCEPTANCE_HISTORY.md)。不改歷史結果，不把新文件提交視為新CI／Preview或正式站PASS。

2026-10-16，使用者明確授權 RELEASE_ONLY，接受本次發布不以Linux Full PASS為前置。

- 正式站：https://yakyujinsei.com/
- 來源dev及遠端main：650e4dd21718b4abec3876fc9ef6148714c21d4f。
- 正式Repository tt-chin/yakyujinsei-site main：15adf286e687ab2efc70e9e694ae024f75c3f10b。
- 既有發布Workflow：https://github.com/tt-chin/yakyujinsei/actions/runs/38842942771 ，SUCCESS；只執行一次，未另建流程或強制覆寫。
- 同SHA Linux Quick Run38840980489：61 PASS／0 FAIL／0 SKIP／0 BLOCKED，190.523秒。

發布前main未設保護阻擋，原發布Workflow也沒有Full前置；以精確已提交SHA快轉main，未切換或帶入dirty工作樹。產品／VERSION／測試條件未修改。由原Workflow同步正式Repository。

## 正式站核對

正式站index.html、src/config.js、src/engine/game.js回應成功，內容與來源Git blob逐位元一致；#app-version為v1.13.0。

正式Repository的src tree SHA `f3d1d9aa8a7594e52694174e727649350fd9bd1e`及index blob `0f3dc3a04085f25074de817857a7a8287053d0dd`與來源docs/src、docs/index.html一致。

Chrome155：1280／320／390px各P與IF共6組基本Smoke PASS；可開始遊戲並繼續操作兩個可用按鈕，操作選項存在，無橫向溢出、無pageerror、無JS/CSS HTTP錯誤。此為手機尺寸模擬，不是真實手機驗收或完整生涯。

第一次Smoke因在開始遊戲後讀取可見body找版本、而版本在已隱藏首頁，檢查失敗；不是產品錯誤。保留此紀錄，改讀既有#app-version後6組通過，未重新部署。

## Full與殘餘風險

Linux Full：NOT_ACCEPTED / DEFERRED。停止調查、修改與重跑；核對時沒有執行中的Full，無需取消。

Run38841657256：18 PASS／1中斷／61未執行，exit143，終止訊號來源未確認；Aggregate未執行。第1批artifact保存成功，並非Full通過。過往Run、Log、artifact及失敗報告全部保留，不改寫。

ARTIFACT_COVERAGE_BLOCKED不變。跨功能80入口Linux完整回歸未被接受；最小Linux Smoke及Quick不能取代Full。若後續出現問題，需另行授權診斷或回退，不能以本報告宣稱完整測試覆蓋。

本報告僅留本地；未混入原有D2設計、G1-A fixture、G1-B報告及development-b等平行修改，未刪除證據。

# 1.13.0 精簡歷史驗收摘要（原始大型證據擬不再保留）

> 2026-10-18現況補註：504個必要成果已遷移至`C:\src\yakyujinsei`並核對來源／目的地SHA256；最後確認舊OneDrive專案已不存在，舊A／B完整大型證據集不再保留，不能依本摘要完整重建當時S／RNG／Receipt。本機仍有少量獨立歷史結果與424個保留檔，並非完整A／B封存；本次不刪除這些檔案。以下「擬刪除／尚未刪除」是摘要建立時點，原測試數量、PASS／FAIL／NOT_RUN／DEFERRED不變。後續1.13.0新基準尚未在本輪執行，Linux Full及artifact缺口也未解除。

2026-10-16｜CLEANUP_PREPARATION_ONLY｜獨立於test-results保存。本文件是歷史摘要，不是新測試PASS。

## 保留決策與證據限制

使用者明確取消完整A／B S／RNG／Receipt快照、舊原始FAIL、PASS圖像／影片／trace及約75 GiB完整封存的保留要求；接受日後不能完整複核當時A→B差異。保留正式規格、測試、golden／fixture、Git來源與本摘要。先前第三階段的全面原件保留建議不再作為本次大型輸出清理的必要條件。

**截至本摘要建立，原test-results仍存在，尚未刪除。** 最終批准後刪除原件時，以下SHA／指紋只作來源辨識，不是原始payload、可重播封存或重新驗證證明。本次不改寫任何歷史FAIL／NOT_RUN／WAIVED／DEFERRED／BLOCKED，也未批准立即刪除非測試成果。

## 1. 當前正式來源與本機準備基準

- dev／本機origin/dev／origin/main／HEAD：`650e4dd21718b4abec3876fc9ef6148714c21d4f`（只讀本機ref，未fetch）。
- VERSION：1.13.0，位於docs/src/config.js。
- 正式站來源650e4dd、正式Repository commit：`15adf286e687ab2efc70e9e694ae024f75c3f10b`，依[正式發布驗收](RELEASE_1130_PRODUCTION_ACCEPTANCE.md)；本輪未重新查詢遠端或部署。
- 本機當前game.js SHA256：`e6f776c0551c1eca97e15c13dc61d7d258080d1f42be006ae00858839af5ce84`。
- 本輪只讀重算的Runner來源指紋：`a50a4a22e989715ff6b37e138fd91296827174c7d6baa410e883857c1b4d88af`。有既存dirty文件／fixture，此值不是新Quick／Full的受驗指紋，也不能只用HEAD宣稱所有工作樹內容已提交。

## 2. 開發A（A0、G2～G4）

來源：[A正式受入報告](PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)、[v2校驗附錄](development-a/BASELINE_VERIFIER_SUPPLEMENT.md)及清理前原manifest／summary。

- 原受驗HEAD：`d2ea8a3bcf38044928aab86ae56289839c45a0e4`＋當時工作樹；VERSION1.12.0。目錄中的c3d413dd是engine hash前綴，**不是Git commit SHA**。
- game.js SHA256：`c3d413dd6fc0b4a899c38b960d4ad9dfc4d1736fb412de850781f544daa5f709`。
- Quick：56 PASS／0 FAIL／0 SKIP／0 BLOCKED，executed56、reused0、234.068秒。
- Full：75 PASS／0 FAIL／0 SKIP／0 BLOCKED，executed75、reused0、3536.369秒。
- 兩者sourceFingerprint：`ba495eb24751c3319aec386d0ecc529199340e81a08987d70da3e15944089c95`。
- A0／G2／G3／G4依原限定範圍PASS並獲使用者接受。G2 Node／Chromium／WebKit各52；真實iPhone Safari52 PASS／0 FAIL，來源核對已接受。Safari不等於B全UI實機驗收。
- G3為原生Legacy Journal／可信完成／Receipt、payment／salary evaluation的限定交易驗證；新P07／P08 fixture不能代替B的真producer整合。
- G4含三尺寸原生Runtime、安全choice／配分／movement／advance及舊token拒絕；未知R-record gap、任意crash、跨reload或部分phasePre並未變成支援範圍。
- 最終metadata Runtime18案；四條原策略自然生涯保存了完整S／選擇／年度結果／主R證據。刪除原件後僅保留此歷史結論，不能再逐步重算全部當時差異。

原件辨識SHA256（擬刪除payload，不是保留封存）：

- BASELINE_MANIFEST：`a08095f1d89d419762afd58f10c8e7b12edd5c07f1de91902f8563457f1181f1`。
- A Full summary：`b2fd401030255e350139794cdf1723e5c6e9be45a4559bef07f8ab7143f4ff3f`。
- A Quick summary：`9d202d445ce0a3794fc2d32c4d1b20d5e6c67a11d10c0c6f064f12be949dd6c6`。

## 3. 開發B（G5～G8）

來源：[B最終受入報告](PITCHER_AWARDS_D2_DEVELOPMENT_B_ACCEPTANCE.md)與清理前最終manifest／summary。

- 原受驗HEAD：`efd4710c4c5c366ff3aba69c59180031c82ff18a`＋當時未提交B工作樹；VERSION1.12.0。此HEAD不單獨包含完整B實作。
- B實作後提交：`56e72d9792529f3221c1a1ffadaf563bceebe26d`。原測試結果不得改寫成在該commit重新執行。
- game.js SHA256：`e6f776c0551c1eca97e15c13dc61d7d258080d1f42be006ae00858839af5ce84`。
- Quick：61 PASS／0 FAIL／0 SKIP／0 BLOCKED，executed61、reused0、244.667秒。
- Full：80 PASS／0 FAIL／0 SKIP／0 BLOCKED，executed80、reused0、3555.235秒。
- 兩者sourceFingerprint：`ee88fd6d59edd5ee6ad5ebf4a3164ba882de555e6dcfd55fa8e6d53fb63e80f3`。
- G5～G8本地驗收已接受；原生producer→Decision→Receipt→Consumer、跨league／role及PC1280／320／390有原限定證據。新B手機實機UI、自然頂尖得獎平衡未確認。

固定Seed歷史結論：

- yakyo-test-001／P／通常投球：520操作、825次主R。
- jp3-pitcher-02／P／省エネ：304操作、606次主R。
- jp3-pitcher-03／P／全力：335操作、671次主R。
- jp3-infielder-01／IF：422操作、637次主R。
- 四條與A原策略對照的第一普通差異為null，完整普通S／合約／收入／honors／traits／選擇／主R一致；新技術Decision／Receipt另外驗證。同B完整重播亦一致。這四條自然路線沒有新獎winner；新效果另用真producer受控Runtime驗證，不作自然得獎率證明。
- 最終私有Receipt生涯v3：4 PASS／0 FAIL；獨立無損重建驗證4 PASS。v2原0 PASS／4 FAIL仍為FAIL，不能改成歷史PASS。

原件辨識SHA256：

- B Full summary：`9edd08764d9336507690a5c7b0307d66fb5bdfd9a4c9a9d27cc7b10a82b73b0a`。
- B Quick summary：`4cf85207ba9de472937e714e1a1c18383171bfdf798f19062dcc8e1625eda96c`。
- B最終完整來源／驗收manifest：`2fabfaa7545b2c2310a7f4600b6ad83f6f9eea578d62ef9ab5469e2c9fe9635a`。

## 4. G9、1.13.0與Linux狀態

來源：[G9準備](PITCHER_AWARDS_D2_G9_RELEASE_PREPARATION.md)、[CI證據缺口](D2_G9_CI_EVIDENCE_ACCEPTANCE.md)、[發布驗收](RELEASE_1130_PRODUCTION_ACCEPTANCE.md)。

- 版本1.12.0→1.13.0；G9只作已批准版號／文件／CI準備，不變更D2曲線或產品獎項政策。
- G9限定本機Quick61 PASS；ci-evidence輪247.352秒，原HEAD56e72d9＋1.13.0工作樹，sourceFingerprint `e2fa4fcaaf7a6d35bb8d7457437a42836e747c56adc48a97a344d18b4069e5ca`；其summary SHA256 `ff398ca792ef56ada3f516ac951e93f43b34470fd820c20cfed0c4225dde6db0`。
- 較早version準備重測Quick61、263.052秒；指紋 `da8a73556e0fa16515ead0f4c01161d71887c31df6eeee4e75760b6b53b3b7b0`。這不是之後650e4dd的新執行。
- 同正式來源650e4dd的Linux Quick Run38840980489：61 PASS／0 FAIL／0 SKIP／0 BLOCKED、190.523秒，依發布報告。本地現存原件未提供該Run的完整sourceFingerprint，本摘要標記UNAVAILABLE，不以本機指紋代填。
- Linux Chromium Smoke Run38840993314：32 PASS／0 FAIL／0 SKIP，**不是80項Full PASS**。
- 正式Publish Run38842942771 SUCCESS；正式站P／IF×1280／320／390的基本Smoke6組PASS，尺寸模擬不是手機實機。
- **Linux Full：NOT_ACCEPTED / DEFERRED**。最新Run38841657256：18 PASS／1中斷／61未執行，exit143，Aggregate未執行；訊號來源未確認。不得把未執行列為PASS。
- 過去Run38838485336為58 PASS／22 FAIL，22個socket長路徑錯誤有原調查；修正後Linux最小Smoke成功，不能據此改寫那輪FAIL或最新Full中斷。
- **ARTIFACT_COVERAGE_BLOCKED維持**。collector限定47 PASS不代表正式Gate封存完整，也未接入CI；分批artifact／14天保留不等於永久完整原件。
- 1.13.0已由使用者批准不以Linux Full PASS作此次發布前置；不是所有G9殘項PASS。

歷史Run URL：

- [Linux Quick](https://github.com/tt-chin/yakyujinsei/actions/runs/38840980489)
- [Linux Smoke](https://github.com/tt-chin/yakyujinsei/actions/runs/38840993314)
- [正式Publish](https://github.com/tt-chin/yakyujinsei/actions/runs/38842942771)
- [延後Full](https://github.com/tt-chin/yakyujinsei/actions/runs/38841657256)

以上URL是既有報告辨識，不代表本輪重新核對GitHub可下載內容。

## 5. 已知FAIL與修復的歷史摘要

- A初期TDZ與跨VM fixture原型問題：直接修正後限定重測通過；不把原始FAIL改成PASS。
- A年度續行／付款／choice的適用故障：依原native Receipt與checkpoint實作逐點修復／驗收；仍拒絕不安全模糊狀態，不宣稱任意崩潰恢復。
- B首次Consumer候選接線改變舊名稱待遇：撤回候選並採各Consumer精確舊名稱相容層；不增加全域可信P-ID或新待遇。
- B診斷Quick曾54 PASS／6 FAIL；原生fixture／年度完成狀態及名稱相容問題依批准範圍修正，最後全新Quick61／Full80通過，不拼湊先前PASS。
- B full-locked的Array buffer allocation failed屬中止／FAIL；後續完整Full-renames實際80 PASS，不把locked中止輪改寫成功。
- B舊名稱／新producer對照改以實際可信Decision證明允許的P02／P03／P05／P06名稱差異，普通S與R仍嚴格；沒有重寫golden。
- Receipt v2誤把write.status要求為COMMITTED及強求每條生涯都有一軍AWARD交易；實際write為WRITTEN、Receipt為COMMITTED，二軍路線可能只有STATE。修正獨立觀測／驗證工具後v3通過，未改產品。
- Linux socket路徑修正及SIGTERM中止保持不同原因分類；最終Full未完成不是遊戲邏輯已證實錯誤，也不是可忽略的PASS。

## 6. 清理後可說與不可說的結論

可保留：原報告曾記錄並接受上述限定結果、具體來源身分與測試數量；正式1.13.0已發布；Linux Full／artifact缺口仍未完成。

不可宣稱：摘要可還原每步S／R／Receipt；舊A→B完整證據仍可現場複核；新1.13.0已全新Quick／Full PASS；歷史失敗從未發生；Git commit本身等於所有dirty受驗來源；刪除後資料仍可恢復。

若最終刪除獲批並完成，歷史大型原件可能永久不可恢復。未來建立的1.13.0基準是新的執行證據，不是重建原A／B或LinuxRun。本次只完成清理準備，未刪除、未重跑、未提交。

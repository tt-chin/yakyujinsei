# G2 真實 iPhone Safari 驗收（尚未執行）

此工具只供開發 A 本機驗收，不發布至 Preview 或正式站，不載入遊戲。它直接匯入 [產品 RNG](../../src/engine/award-rng-policy.js)，沒有另一套 browser RNG。頁面、驗證函式、向量及伺服器放在 [tools/development-a](../../../tools/development-a/g2-browser.mjs)，位於既有發布根目錄 docs/ 之外，不修改發布 workflow。

## 操作

1. PC 與 iPhone 連到同一個可信私人網路。
2. 在 Repository 根目錄執行下列指令。Playwright 路徑由環境變數或參數提供，serve 模式不需要 Playwright。

   ```text
   node tools/development-a/g2-browser.mjs --serve --host=0.0.0.0 --port=8088
   ```

3. 如 Windows 防火牆詢問，僅允許所需私人網路；不要對公用網路開放。不得設定 Cloudflare 或正式網站來替代本機驗收。
4. 使用 iPhone 真正 Safari 開啟 `http://<PC區域網路IP>:8088/tools/development-a/g2-safari.html`。
5. 按「執行驗證」，檢查 PASS／FAIL，再下載 JSON；無法下載時複製結果欄位。記錄 iPhone 型號、iOS／Safari 版本及畫面截圖。
6. 將 JSON、版本資訊與截圖回傳。PC 按 Ctrl+C 關閉伺服器；不留下公開服務。

## 結果判讀

- 套件包含正式 GV01～GV13 的完整 bytes／hash／u、重複及逆序計算、非法 context、UTF-8／surrogate、0／100 機率、相等不獲及 uint32 最大值邊界。
- 期望值從正式 D2 複製，不依產品實作重新產生。Node／Chromium／WebKit 共用相同驗證函式與產品模組。
- JSON 包含 userAgent、執行時間及來源 hash。非安全的 LAN HTTP 可能無 SubtleCrypto，此時明示 `UNAVAILABLE_NON_SECURE_CONTEXT`；不得當成 hash 已驗證，應連同本機受驗來源／hash 核對。
- Playwright WebKit 不是 Safari。直到實際裝置結果回報並核對，本項維持 NOT_RUN／BLOCKED，G2 全 Gate 不能標 PASS。
- 只有驗收頁 PASS 不能代替 G3／G4、主 RNG trace、Quick／Full 或完整產品驗收。

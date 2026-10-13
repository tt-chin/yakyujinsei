# TRAIT-SMALLSCHOOL-SEMANTICS-01 決策矩陣

2026-10-13；dev 444144a57fb3ad23ac2bd1b3e9c87ba0809ea9bb／1.11.9。PROPOSAL，未實作、未測試。證據細節見[調查](TRAIT_SMALLSCHOOL_SEMANTICS_INVESTIGATION.md)。

|面向|S0維持現況|S1新增出生高校快照|S2快照＋經證實舊來源讀取|
|---|---|---|---|
|正確性|既取得保持；新角色無hsTier，資格接續缺口保留|可保存真實初始JP_SAB資料；是否符合稱號仍需定義|已證明來源才可讀舊分類，未知不推算；不是B↔3|
|舊資料相容|原條件／true不變|舊資料缺snapshot保持UNKNOWN；不能補發|可信LEGACY_T123可保留；其他UNKNOWN；true優先|
|RNG影響|無本次更動|copy已抽結果R0；S結構變化；稱號啟用可能影響退休fan picks|讀取可R0，新增稱號的後續退休R需trace驗證|
|實作成本|零|低至中：初始化、schema驗證、隔離setSchool、資格policy|中至高：來源白名單、衝突处理、schema／版本证据|
|測試成本|現行缺口記錄|中至高：出生P/野手、升學、退休完整S/R、UI、grinder回歸|高：舊版本、非法／矛盾／已取得、未知來源回歸|
|維護成本|低但語义缺口持續|低至中；固定出生與目前school字段分工|中至高；白名單與來源證據需維護|
|誤判風險|主要漏判；不猜測时不引入新B誤發|新資料低；若直接B當弱小仍高|保守UNKNOWN低；寬鬆version／B↔3則高|
|推薦|批准前暫態；不作永久已修復方案|推薦新資料機制，前提使用者先批准分類資格|只推薦保守設計；白名單未證前不啟用自动legacy讀取|

推薦理由：game.js2826–2840已生成初始高校，复制可避免新抽R；2864覆寫schoolTier顯示需独立birth欄位；2159仍讀hsTier3。歷史T3弱旅−6與封存JP_B古豪・地域強豪／現行−2不相同，沒有轉換政策，**UNVERIFIED — DO NOT AUTO-MAP**。

方案不是自動授權：即使S1保存B也不能立即新發稱號；出生分類資格与既有退休gate需分别決定。S2只能讀有来源的舊出生值，不能從schoolTier殘值或舊seed重生成。旧true保持、重複獎勵禁止、potSum0/grinder不變、沒有完整存檔遷移。

需批准順序：出生語義與JP分類資格→schema／unknown政策→舊來源白名單（如有）→實作及允许差分→固定seed／S/R與UI測試。以上為設計，全部測試DESIGNED_NOT_RUN。

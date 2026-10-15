# 開發 A 基準校驗附錄

2026-10-15。純證據工具修正，不修改產品、既有測試、Runner／CI、正式規格、VERSION或任何已封存資料。

主驗收報告保持為[原完整報告](../PITCHER_AWARDS_D2_DEVELOPMENT_A_ACCEPTANCE.md)，凍結副本及原SHA256不改寫。Quick56／Full75全部PASS；四條完整Seed比較與18案Runtime通過。

## 首次校驗 FAIL 與直接原因

生成器profile使用`validation.quick.counts.FAIL`／`full.counts.FAIL`，校驗工具誤讀`quick.FAIL`／`full.FAIL`，導致`undefined !== 0`、exit1。這是本批新增證據工具對接錯誤，不是遊戲回歸、封存毀損或Full失敗。

僅修正兩個讀取位置；原工具及完整stderr保存於基準目錄`verify-baseline-v1.mjs`／`verification-retest.json`。重測確認舊版仍exit1、新版exit0（2個限定驗證PASS），並實際核對三個有效ZIP、entry manifest与全部55個目前產品來源。原始Full／Quick、SOURCE包、SHA256SUMS及BASELINE_MANIFEST全部保持原雜湊；不覆寫golden或放寬比較。

## 開發 B 使用入口

基準本地位置：`test-results/development-a-baseline-20261015-c3d413dd/`。使用追加的唯讀修正版，不使用封存中舊版工具：

```text
node test-results/development-a-baseline-20261015-c3d413dd/verify-baseline-v2.mjs --manifest=test-results/development-a-baseline-20261015-c3d413dd/BASELINE_MANIFEST.json --current-source
```

在B已改程式後省略`--current-source`，只驗證原封存不變；B自身仍須完整Quick／Full。先核對獨立保存的以下信任錨，追加檔案見`VERIFIER_SUPPLEMENT.json`與`SHA256SUMS-VERIFIER-V2`。原來源與metadata有ReadOnly属性；所有寫入工具拒絕既有路徑，不宣稱管理員或外部同步絕對無法改檔。

- BASELINE_MANIFEST SHA256：`a08095f1d89d419762afd58f10c8e7b12edd5c07f1de91902f8563457f1181f1`。
- 原SHA256SUMS：`2ee5d1505568ef66e586dd2530b5105edf6d6452fa7c0efc19eb6a48f8005061`。
- v2校驗工具：`e4b166728d26d1f35c18f40d6bffc99cd3ac2e74bbe891a6212e0c49fd9145a0`。

大型基準包留在本地忽略目錄，没有上傳。沒有commit／push／merge／deploy；不授權B／G9。主報告與本附錄共同作為最後驗收紀錄，舊工具FAIL不刪除、不改寫為PASS。

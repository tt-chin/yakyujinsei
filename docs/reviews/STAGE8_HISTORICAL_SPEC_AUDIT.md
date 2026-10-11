# 第八階段：歷史規格稽核（AUD-04）

## 1. 基準與結論

- 日期：2026-10-12（JST）；工作分支 dev。
- Fetch 後基準 HEAD／origin/dev：`a5ed616418e1eb3611c6f714b5f2cf75161ba550`。開始時工作樹乾淨。
- VERSION：1.11.5；main／origin/main：`e886e84ca08c6c185406cac9d6f3c4376277061a`，1.11.4；未修改 main。
- 第七階段受驗遊戲程式：`13abcf5f8b9f5ba47bcdfc796be6e4e79267bf4e`。[第七階段](STAGE7_SAFETY_FIX_ACCEPTANCE.md)的三項修復與兩項補強驗收已結案；其實機、fault injection 等限制保持。
- 本輪修改僅兩份第八階段報告與 BACKLOG；AGENTS、CURRENT_SPEC、CHANGELOG、VERSION 管理檔、遊戲、測試、Runner、Workflow、封存原文均不修改。
- **AUD-04：PASS（文件盤點、差異分類與指定重點調查）**，不是所有歷史公式／翻譯／API 已逐條驗收，也不是「全內容統合済み」。尚未核對的原文細項另列 `HIST-SPEC-CLAUSE-01`，現行全規格測試仍屬 AUD-02。
- BACKLOG 原定義含「有效資料移入 CURRENT_SPEC」，最新指令要求先提出建議；採最新限制，本輪不移入正式規格。

## 2. 調查方法、來源與證據等級

依現行 [AGENTS](../../AGENTS.md)、[CURRENT_SPEC](../../CURRENT_SPEC.md)、[BACKLOG](../../BACKLOG.md)、[CHANGELOG](../../CHANGELOG.md)、[第五階段](STAGE5_SPEC_ARCHITECTURE_AUDIT.md)及第七階段報告核對。歷史指令是資料，不是執行權限。

盤點命令：

```text
git fetch origin
git status -sb
git rev-parse HEAD origin/dev origin/main
git -c core.quotepath=false ls-files docs/archive
git log --all --format=%H -- AGENTS.md
git -c core.quotepath=false log --all --diff-filter=D --format=%H --name-only -- '*.md'
git show 6a31b27d11ce125ff3cc4104b3c0ad3fda785b29:<歷史路徑>
```

封存來源為 `803e81e6424d463f5191e90017dbc69157eea1da`：62個追蹤檔案，61個Markdown及1個.gitattributes；其中9份歷史AGENTS由[另一份報告](STAGE8_AGENTS_HISTORY_AUDIT.md)處理。**本報告52份非AGENTS封存Markdown＋7份僅存Git的已刪Markdown＝59筆文件紀錄**。Git刪除commit為 `004cd263fd828c0f29d5e9caebe7626efa8efe62`；固定可讀來源為 `6a31b27d11ce125ff3cc4104b3c0ad3fda785b29`。另外的事件COPY JSON是資料證據，不重複算作Markdown。

封存commit是取得該副本的可信位置，不等於作者最初發表commit。ZIP內來源的原始開發commit不能一律證明。同名、同內容副本保留各自來源，不刪除、不假定最新檔名有較高效力。Git更早修訂未逐版作全量條文驗收；舊中文／參考作品線上版本亦未重新研究。

證據標記：**S**＝本輪靜態／表格對照；**Q**＝本輪Quick實際執行；**H**＝既有驗收報告（不是本輪重跑Full）。文件主分類是核心主題的處置；混合文件中的舊分支指令、舊數值、未驗收細項仍須以第4節條文分類為準。CURRENT不代表整份原文可直接執行。

## 3. 文件台帳與主分類

59筆主分類：**CURRENT 6、SUPERSEDED 38、OBSOLETE 0、UNVERIFIED 8、DESIGN_PENDING 7**。沒有整份文件被認定所有內容皆廢止；廢止的個別條文見第4節。此數字是文件紀錄數，非Bug數、非測試數。

| 編號 | 固定來源文件 | 主分類 | 現行對應／證據及限制 |
|---|---|---|---|
| D01 | [README.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/README.md) | SUPERSEDED | 文件索引／舊狀態：§1、§9、BACKLOG；不以舊快照判定目前完成 |
| D02 | [imported/consolidated/CURRENT_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/consolidated/CURRENT_SPEC.md) | SUPERSEDED | 文件索引／舊狀態：§1、§9、BACKLOG；不以舊快照判定目前完成 |
| D03 | [imported/consolidated/HISTORY_INDEX.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/consolidated/HISTORY_INDEX.md) | SUPERSEDED | 文件索引／舊狀態：§1、§9、BACKLOG；不以舊快照判定目前完成 |
| D04 | [imported/consolidated/TODO.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/consolidated/TODO.md) | SUPERSEDED | 文件索引／舊狀態：§1、§9、BACKLOG；不以舊快照判定目前完成 |
| D05 | [imported/history/HOF_AWARD_SCORING_FIX.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/HOF_AWARD_SCORING_FIX.md) | CURRENT | 殿堂／國內賽：§4、§12；hall-of-fame-policy／domestic-tournament-policy；Q＋H |
| D06 | [imported/history/JP3_MODULARIZATION.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/JP3_MODULARIZATION.md) | SUPERSEDED | 版本／靜態模組：§9、AGENTS§5/9/10；config／main；Q，舊執行步驟停用 |
| D07 | [imported/history/JP3_SALARY_PROMOTION_FIX.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/JP3_SALARY_PROMOTION_FIX.md) | SUPERSEDED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D08 | [imported/history/JP3_SALARY_SYSTEM_REVIEW.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/JP3_SALARY_SYSTEM_REVIEW.md) | UNVERIFIED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D09 | [imported/history/MBDAY_SALARY_ANALYSIS_V2.7.6.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/MBDAY_SALARY_ANALYSIS_V2.7.6.md) | UNVERIFIED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D10 | [imported/history/MIGRATION_IMPLEMENTATION_SCHEDULE.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/MIGRATION_IMPLEMENTATION_SCHEDULE.md) | SUPERSEDED | 移植候選：§6–§8、BACKLOG；已採用與待決分開，非實作授權 |
| D11 | [imported/history/MIGRATION_MASTER_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/MIGRATION_MASTER_SPEC.md) | DESIGN_PENDING | 移植候選：§6–§8、BACKLOG；已採用與待決分開，非實作授權 |
| D12 | [imported/history/MY_BASEBALL_DAYS_MIGRATION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/MY_BASEBALL_DAYS_MIGRATION_SPEC.md) | DESIGN_PENDING | 移植候選：§6–§8、BACKLOG；已採用與待決分開，非實作授權 |
| D13 | [imported/history/SALARY_SYSTEM_COMPARISON_AND_RECOMMENDATION.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/SALARY_SYSTEM_COMPARISON_AND_RECOMMENDATION.md) | UNVERIFIED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D14 | [imported/history/V1.5.0_HOME_ABILITY_UI_REVISION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/V1.5.0_HOME_ABILITY_UI_REVISION_SPEC.md) | SUPERSEDED | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D15 | [imported/history/V1.5.1_RECORD_CONDITION_FIX_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/V1.5.1_RECORD_CONDITION_FIX_SPEC.md) | SUPERSEDED | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D16 | [imported/history/V1.5.2_INFORMATION_ARCHITECTURE_REVISION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/V1.5.2_INFORMATION_ARCHITECTURE_REVISION_SPEC.md) | CURRENT | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D17 | [imported/history/V1.6.0_ABILITY_ALLOCATION_AND_JAPANESE_COPY_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/V1.6.0_ABILITY_ALLOCATION_AND_JAPANESE_COPY_SPEC.md) | SUPERSEDED | 配分／文案：§7；allocUI／trait-policy；Q＋H，舊全文可達性未完 |
| D18 | [imported/history/V1.7.0_THEME_AND_DISPLAY_SETTINGS_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/V1.7.0_THEME_AND_DISPLAY_SETTINGS_SPEC.md) | CURRENT | 顯示／分享：§8、§16；display-preferences／share-image；Q，實機待驗 |
| D19 | [imported/history/V1.8.0_SHARE_IMAGE_THEME_LINK_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/V1.8.0_SHARE_IMAGE_THEME_LINK_SPEC.md) | SUPERSEDED | 顯示／分享：§8、§16；display-preferences／share-image；Q，實機待驗 |
| D20 | [imported/history/VERSION_HISTORY(1).md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/VERSION_HISTORY(1).md) | SUPERSEDED | 版本／靜態模組：§9、AGENTS§5/9/10；config／main；Q，舊執行步驟停用 |
| D21 | [imported/history/VERSION_HISTORY(2).md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/VERSION_HISTORY(2).md) | SUPERSEDED | 版本／靜態模組：§9、AGENTS§5/9/10；config／main；Q，舊執行步驟停用 |
| D22 | [imported/history/VERSION_HISTORY.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/VERSION_HISTORY.md) | SUPERSEDED | 版本／靜態模組：§9、AGENTS§5/9/10；config／main；Q，舊執行步驟停用 |
| D23 | [imported/history/YAKYOLIFE_159_MIGRATION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YAKYOLIFE_159_MIGRATION_SPEC.md) | DESIGN_PENDING | 移植候選：§6–§8、BACKLOG；已採用與待決分開，非實作授權 |
| D24 | [imported/history/YAKYOLIFE_SALARY_ANALYSIS_V1.5.9.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YAKYOLIFE_SALARY_ANALYSIS_V1.5.9.md) | UNVERIFIED | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D25 | [imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.0.4.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.0.4.md) | SUPERSEDED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D26 | [imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.1.0.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.1.0.md) | SUPERSEDED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D27 | [imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.1.1.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.1.1.md) | SUPERSEDED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D28 | [imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.2.0.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.2.0.md) | SUPERSEDED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D29 | [imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.3.0.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.3.0.md) | SUPERSEDED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D30 | [imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.4.0.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YAKYUJINSEI_SALARY_DESIGN_V1.4.0.md) | SUPERSEDED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D31 | [imported/history/YaKyoLife_JP3_台灣版1.5.7更新設計書.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YaKyoLife_JP3_%E5%8F%B0%E7%81%A3%E7%89%881.5.7%E6%9B%B4%E6%96%B0%E8%A8%AD%E8%A8%88%E6%9B%B8.md) | SUPERSEDED | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D32 | [imported/history/YaKyoLife_詳細設計書.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/YaKyoLife_%E8%A9%B3%E7%B4%B0%E8%A8%AD%E8%A8%88%E6%9B%B8.md) | UNVERIFIED | 全域表／API：§2–§16；game／JP_DATA；本輪30數值列、90名稱列，其餘細項未驗 |
| D33 | [imported/history/fix_102.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/fix_102.md) | CURRENT | 殿堂／國內賽：§4、§12；hall-of-fame-policy／domestic-tournament-policy；Q＋H |
| D34 | [imported/history/fix_103.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/fix_103.md) | SUPERSEDED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D35 | [imported/history/yakyujinsei_salary_analysis_v1.0.3.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/imported/history/yakyujinsei_salary_analysis_v1.0.3.md) | UNVERIFIED | 薪資／契約：§5、§11、§14；salary-*／contract-policy／game；Q＋H，參考作品未重驗 |
| D36 | [local/CURRENT_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/CURRENT_SPEC.md) | SUPERSEDED | 文件索引／舊狀態：§1、§9、BACKLOG；不以舊快照判定目前完成 |
| D37 | [local/HISTORY_INDEX.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/HISTORY_INDEX.md) | SUPERSEDED | 文件索引／舊狀態：§1、§9、BACKLOG；不以舊快照判定目前完成 |
| D38 | [local/MIGRATION_IMPLEMENTATION_SCHEDULE.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/MIGRATION_IMPLEMENTATION_SCHEDULE.md) | SUPERSEDED | 移植候選：§6–§8、BACKLOG；已採用與待決分開，非實作授權 |
| D39 | [local/MIGRATION_MASTER_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/MIGRATION_MASTER_SPEC.md) | DESIGN_PENDING | 移植候選：§6–§8、BACKLOG；已採用與待決分開，非實作授權 |
| D40 | [local/MY_BASEBALL_DAYS_MIGRATION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/MY_BASEBALL_DAYS_MIGRATION_SPEC.md) | DESIGN_PENDING | 移植候選：§6–§8、BACKLOG；已採用與待決分開，非實作授權 |
| D41 | [local/TODO.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/TODO.md) | SUPERSEDED | 文件索引／舊狀態：§1、§9、BACKLOG；不以舊快照判定目前完成 |
| D42 | [local/UI_FOUNDATION_SUPPLEMENTAL_DESIGN.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/UI_FOUNDATION_SUPPLEMENTAL_DESIGN.md) | SUPERSEDED | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D43 | [local/V1.5.0_HOME_ABILITY_UI_REVISION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/V1.5.0_HOME_ABILITY_UI_REVISION_SPEC.md) | SUPERSEDED | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D44 | [local/V1.5.1_RECORD_CONDITION_FIX_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/V1.5.1_RECORD_CONDITION_FIX_SPEC.md) | SUPERSEDED | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D45 | [local/V1.5.2_INFORMATION_ARCHITECTURE_REVISION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/V1.5.2_INFORMATION_ARCHITECTURE_REVISION_SPEC.md) | CURRENT | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D46 | [local/V1.6.0_ABILITY_ALLOCATION_AND_JAPANESE_COPY_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/V1.6.0_ABILITY_ALLOCATION_AND_JAPANESE_COPY_SPEC.md) | SUPERSEDED | 配分／文案：§7；allocUI／trait-policy；Q＋H，舊全文可達性未完 |
| D47 | [local/VERSION_HISTORY.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/VERSION_HISTORY.md) | SUPERSEDED | 版本／靜態模組：§9、AGENTS§5/9/10；config／main；Q，舊執行步驟停用 |
| D48 | [local/YAKYOLIFE_159_MIGRATION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/YAKYOLIFE_159_MIGRATION_SPEC.md) | DESIGN_PENDING | 移植候選：§6–§8、BACKLOG；已採用與待決分開，非實作授權 |
| D49 | [local/YaKyoLife_詳細設計書.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/YaKyoLife_%E8%A9%B3%E7%B4%B0%E8%A8%AD%E8%A8%88%E6%9B%B8.md) | UNVERIFIED | 全域表／API：§2–§16；game／JP_DATA；本輪30數值列、90名稱列，其餘細項未驗 |
| D50 | [local/docs/JAPANESE_COPY_AUDIT_V1.6.0.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/docs/JAPANESE_COPY_AUDIT_V1.6.0.md) | UNVERIFIED | 配分／文案：§7；allocUI／trait-policy；Q＋H，舊全文可達性未完 |
| D51 | [local/tasks/VERSION_1_0_0_MODULARIZATION.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/tasks/VERSION_1_0_0_MODULARIZATION.md) | SUPERSEDED | 版本／靜態模組：§9、AGENTS§5/9/10；config／main；Q，舊執行步驟停用 |
| D52 | [local/台湾版1.5.7_現行v1.0.3_差異修正書.md](https://github.com/tt-chin/yakyujinsei/blob/803e81e6424d463f5191e90017dbc69157eea1da/docs/archive/local/%E5%8F%B0%E6%B9%BE%E7%89%881.5.7_%E7%8F%BE%E8%A1%8Cv1.0.3_%E5%B7%AE%E7%95%B0%E4%BF%AE%E6%AD%A3%E6%9B%B8.md) | DESIGN_PENDING | UI／記錄：§6；navigation／player-detail／game；Q＋H |
| D53 | [CODEX_TRAIT_JP_38_COMPLETE_MASTER_SPEC_UPDATED.md](https://github.com/tt-chin/yakyujinsei/blob/6a31b27d11ce125ff3cc4104b3c0ad3fda785b29/CODEX_TRAIT_JP_38_COMPLETE_MASTER_SPEC_UPDATED.md) | SUPERSEDED | 特性：§12；trait-policy／game；Q；阪神一軍／oldghost及3保留ID以CURRENT為準 |
| D54 | [FIX_DRAFT_SIGNING_BONUS_INCOME_DISPLAY.md](https://github.com/tt-chin/yakyujinsei/blob/6a31b27d11ce125ff3cc4104b3c0ad3fda785b29/FIX_DRAFT_SIGNING_BONUS_INCOME_DISPLAY.md) | SUPERSEDED | 所得／市場：§11；draft-signing／global-contract-market／game；Q＋H；原文範例不覆蓋核准表 |
| D55 | [GLOBAL_SALARY_MARKET_SYSTEM_FIX.md](https://github.com/tt-chin/yakyujinsei/blob/6a31b27d11ce125ff3cc4104b3c0ad3fda785b29/GLOBAL_SALARY_MARKET_SYSTEM_FIX.md) | SUPERSEDED | 所得／市場：§11；draft-signing／global-contract-market／game；Q＋H；原文範例不覆蓋核准表 |
| D56 | [GLOBAL_SIGNING_BONUS_SYSTEM_FIX.md](https://github.com/tt-chin/yakyujinsei/blob/6a31b27d11ce125ff3cc4104b3c0ad3fda785b29/GLOBAL_SIGNING_BONUS_SYSTEM_FIX.md) | SUPERSEDED | 所得／市場：§11；draft-signing／global-contract-market／game；Q＋H；原文範例不覆蓋核准表 |
| D57 | [YAKYUJINSEI_EVENT_SYSTEM_IMPLEMENTATION_SPEC.md](https://github.com/tt-chin/yakyujinsei/blob/6a31b27d11ce125ff3cc4104b3c0ad3fda785b29/YAKYUJINSEI_EVENT_SYSTEM_IMPLEMENTATION_SPEC.md) | SUPERSEDED | 事件：§10/13；event-policy/state/data；Q；原重複可及文案已更新 |
| D58 | [YAKYUJINSEI_JP_EVENT_92_COMPLETE_DATA.md](https://github.com/tt-chin/yakyujinsei/blob/6a31b27d11ce125ff3cc4104b3c0ad3fda785b29/YAKYUJINSEI_JP_EVENT_92_COMPLETE_DATA.md) | SUPERSEDED | 事件：§10/13；event-policy/state/data；Q；原重複可及文案已更新 |
| D59 | [tasks/global-contract-market-parameters-proposal.md](https://github.com/tt-chin/yakyujinsei/blob/6a31b27d11ce125ff3cc4104b3c0ad3fda785b29/tasks/global-contract-market-parameters-proposal.md) | CURRENT | 所得／市場：§11；draft-signing／global-contract-market／game；Q＋H；原文範例不覆蓋核准表 |

同名副本不合併覆寫：v1.5.0/1/2成對內容相同，三份 imported VERSION_HISTORY相同；local與imported詳細設計、CURRENT_SPEC、Master、Schedule則不能只憑檔名認定相同。詳細設計local有2358行、imported有2207行。兩份都保留UNVERIFIED標記，不能把讀取重點章節宣稱為全條文驗收。

## 4. 重點條文對照（不是恢復舊規格）

程式行號以基準a5ed616為準；往後新增行可能位移。game以下簡稱G。表內CURRENT_SPEC章節皆為目前正式說明，不以歷史版本號排序決定效力。

| 歷史內容／來源 | 分類 | 現行規格、程式／實際行為 | 證據、原因與處置 |
|---|---|---|---|
| 詳細§7.1的16階層 par/min/g/org | CURRENT | CURRENT§2/4/5；G:2657 Object.assign(LV)。HS/U舊表min「—」對應0 | S：16列、64值對照一致；Q domestic/contract等相關入口，未宣稱各移籍門檻全驗 |
| 詳細§7.3的14階層 base/linear/star/min/max | CURRENT | G:2691 salaryFor，14組5參數 | S：70參數換成円後一致。KBO曲線上限15億不是外籍package上限1.5億，不能誤報政策衝突 |
| 詳細§7.6–7.10的90球團ID／名稱 | CURRENT | JP_DATA（docs/src/data/jp-data.js:1），G:2670附近Master | S：90列ID與名稱一致。MLB表名稱在第3欄；初次分析誤讀AL/NL欄已修正，不是遊戲Bug |
| 詳細§7.4/5的高中50、大學25與tier補正 | UNVERIFIED | JP_DATA有50/25校；CURRENT§4 | S確認數量；未逐校重驗全部地域、tier及所有路線組合，交HIST-SPEC-CLAUSE-01 |
| 舊「能力不可超過pot」 | SUPERSEDED | CURRENT§7；G:390 abCost、395 addAb：cap80、超pot成本P4/野手3 | Q ability-allocation、H第七階段89案；pot不是硬上限，禁止恢復舊限制 |
| v1.6.0 +1/+5/MAX及批次配分 | OBSOLETE | CURRENT§7；G:699行操作每次pool1，dice維持原值；709 reset，713 done | 1.6.1及1.11.5替代；Q＋H，不恢復高速按鈕。Undo carry缺key→0結構差異保留 |
| v1.5舊四主導航／上部選擇及自動切到育成 | OBSOLETE | CURRENT§6/14；navigation及#act單一DOM，下方選項 | v1.5.2及後續核准修訂取代；Q UI/architecture/choice-action，H ACT矩陣 |
| v1.5.1下級歸原聯盟與全休復健顯示 | CURRENT | CURRENT§6；G的statBucket、player-detail | Q record-condition、information-architecture；v1.5.2階級顯示保留遊戲bucket |
| JP3／詳細的少量事件與舊事件文案 | SUPERSEDED | CURRENT§10/13；event-cards-jp:2，event-policy、state | Q event-copy/policy/integration/fix；92張，43/35/14；v1.8.2文案替換保留數值邏輯 |
| Git事件規格「同年度重複可」 | SUPERSEDED | CURRENT§13；event-state-policy:21 eventDrawPool排除已抽ID，跨年重置 | 1.10.2核准去重取代；Q event-fix，不能用舊1.8驗收預期否定現行去重 |
| Git事件成功率35/55/60與愛將norm+5pt | CURRENT | CURRENT§10/12；event-policy eventOdds、eventPlan、eventIncome | Q純函式邊界，H事件驗收。原版案例數不可代替本輪入口數；舊原文列1656 plan/1104故障 |
| 詳細中runDomesticTournaments/resolveCupOnce/simAmateurStats等設計API | UNVERIFIED | 現行G用amateurSeason、cupOnce、qualifierOnce；CURRENT§4/10 | 未證明旧API每一項的遷移／等價性；不得創造IND個人成績或多加RNG |
| 詳細「teamListOf返回Master record」 | SUPERSEDED | G:2689 teamListOf回傳teamId字串，listByOrg才是records | S直接函式對照；Q相關簽約。不可按舊API呼叫新signTo |
| 詳細§18/19 ct.totalValue/yrs、S.salary廢止、version1.0.0 | SUPERSEDED | contract-policy:4/12 schema3、annualSchedule/segments；G保留非列舉salary相容accessor；VERSION1.11.5 | Q contract/flow、H381契約；舊API索引本身註明舊HTML抽出。不能認定所有舊參照可刪 |
| 舊隱藏d年俸／手動FA倍率／無需球團需求 | SUPERSEDED | CURRENT§5/11；salary-evaluation/market/team-demand/incentive/control/arbitration及G:2718 salaryCandidate | Q相關純函式；1.1–1.4與1.9核准市場取代。仍活的LEGACY委派不刪 |
| 固定多年約、全休仍保障、未支付不計所得 | CURRENT | CURRENT§5/11；contract-policy annualSchedule／markSalaryPaid，G:3091結算 | Q contract/salary-flow/draft等；H第三、七階段；付款前後與次年預定區分 |
| v1.1.1薪資決定履歷只留10筆 | OBSOLETE | salary-explanation-policy appendSalaryDecision，CURRENT§11履歷完整生涯 | 1.9.1移除限制、去重與適用年排序；Q salary-explanation/UI；已丟資料不推測恢復 |
| 舊育成200–500萬契約金、舊2巡目6000–8000萬 | SUPERSEDED | CURRENT§11核准表：育成signingBonus0、支度金290萬；2巡目5000–7500萬 | Q global-contract-market/draft。Git舊display說明核心資料分離保留，舊範圍不再適用 |
| GLOBAL市場正文T×rating二次倍率、cap2250前的2500等 | SUPERSEDED | 固定Git parameters-proposal及CURRENT§11；global-contract-market-policy、G:2718/2814 | Q global/KBO；以核准順序relativeCap→floor→hardCap為準。最低與package須區分，不调整参数 |
| 25歲且6年認可外國一軍年資、KBO floor/package、posting球團收入 | CURRENT | CURRENT§11；global-contract-market-policy／draft-signing-policy／G fixedContract/signTo | Q相關測試，H KBO／收入。posting不進球員careerEarnings，同contractID支付一次 |
| 詳細／fix_102國際準優勝100不是優勝200、只NPB加分 | CURRENT | hall-of-fame-policy honorScoreFor；CURRENT§12及既有殿堂說明 | Q hall-of-fame，H早期修正；先準優勝後優勝。不能把聯盟冠军与国际加分混同 |
| 詳細「只算一軍殿堂」／參考投手新係數 | DESIGN_PENDING | G的NPB/KBO/CPBL bucket含下級；MiLB另列MINOR；CURRENT保持现行 | HOF-BUCKET-DECISION-01、HOF-PITCHER-BALANCE-01等仍待決；只記差異，不補寫一軍限定 |
| 舊38特性阪神實名／不分一軍、rubber翻倍、oldghost最低1 | SUPERSEDED | CURRENT§12；trait-policy:9/15、game取得／衰退；阪神ストライプス一軍10年、55→85%、正数最少1而0保0 | Q trait-policy；舊阪神年資不推測補入；三個新特性僅名稱ID保留，對應BACKLOG三項 |
| 四主題／字級／compact且不保存生涯 | CURRENT | CURRENT§8；display-preferences、preferences UI/CSS | Q display，H既有E2E；localStorage僅顯示設定，不等於生涯保存 |
| V1.8分享圖草案說尚待1.7/API接線 | SUPERSEDED | CURRENT§16、share-image／share-actions；1.11.1自動主題再生成 | Q replay-share-theme；原生share sheet仍BLOCKED，不把mock當實機 |
| 途中生涯save/load、rv/rules舊引擎、PC模式復活 | OBSOLETE | CURRENT§2/8/9、AGENTS§3/11與BACKLOG§6 | 禁止自動恢復；沒有使用歷史提案授權加回功能 |
| Master／Schedule舊未來版號及功能順序 | DESIGN_PENDING | 目前BACKLOG背號、事件分類、永久欠番等未核准 | 已做UI不再列未實作；未來編號不是承諾，需另行批准 |
| 兩份大設計§19–22全API／翻譯索引及參考作品分析全部公式 | UNVERIFIED | 第五階段動態可達性與COPY-01仍未完；CURRENT正本優先 | 本輪不宣稱全條文移管；HIST-SPEC-CLAUSE-01補歷史來源逐條核對，AUD-02/COPY-01各自保持 |

## 5. 建議納入CURRENT_SPEC的內容（本輪未採用）

1. 在§2/4/5附16階層基準與14條基礎曲線表，明示「原始曲線上限≠跨聯盟／外籍package cap」，目前30數值列有S＋Q證據。正式文字應引用現行資料來源，而非把舊薪資流程一併移回。
2. 為§5/11增加schema3年表及teamListOf/listByOrg接口的來源說明；以現行程式重新抽出，不復原舊ct.totalValue/yrs dictionary。
3. 釐清詳細§6的潛在值硬上限舊文已廢、§7/13內部不同年代段落，以及CURRENT§1早期1.6.2照合表的歷史快照性質。這是文件提案，不授权改能力公式。
4. 不以歷史「一軍殿堂」、參考salary外部政策、野手sta5%、保存／舊引擎等填補CURRENT。相關遊戲政策仍須使用者批准。

建議保留全部archive與固定Git原文；本輪沒有批准刪除。UNVERIFIED部分先建逐條來源→現行函式→證據清單，不將分析假說轉成正式規格。

## 6. 本輪驗收

```text
node scripts/test.mjs quick --baseline=a5ed616418e1eb3611c6f714b5f2cf75161ba550 --playwright=<外部Playwright模組> --output=test-results/stage8-quick
git diff --check
```

Windows／Node24.15.0／Playwright1.62.1／Chrome155.0.8059.39：**45 PASS、0 FAIL、0 SKIP、0 BLOCKED；318.730秒；45實際執行、0重用；exit0**。Runner summary及逐入口log：`test-results/stage8-quick/`（ignored執行產物，不當作新增公開檔案）。

包含 ACT fixture、draft-income quick、KBO原生與E2E、固定seed-v160、契約／年俸／市場、事件、特性、UI、來源link、語法等。Quick不是Full，也不宣稱本輪重跑PC/320/390全部矩陣、完整生涯逐步S/RNG、Linux Full或4000生涯。遊戲樹不變；固定Seed與RNG無任何程式修改。更廣證據是H第七階段，不改舊結果為本輪執行。

另外唯讀Node分析從詳細設計§7的Markdown表格抽取並與G實際object literal/JP_DATA比較：16基準列、14薪資列、90球團ID/名稱，無差異；75校僅數量確認，不能稱全部表格欄位通過。分析不執行game、無RNG、無檔案写入、無新增測試預期。

文件驗收：新增報告與BACKLOG及CURRENT_SPEC本地檔案引用、正式checkbox唯一ID與統計、受保護檔案diff均在提交前檢查。archive原有歷史失效link不修復，也不算新報告引用成功的證據。

CI／Preview為提交後確認，確切Run與提交SHA依Git與最終回報；文書SHA不可冒充第七階段Full受驗程式SHA。沒有必要重跑Linux Full。Stage8報告不在現有paths-ignore兩項allowlist內，dev push仍觸發Quick，沒有擴大排除CI。

## 7. BACKLOG與後续

AUD-04調查及AUD-05指示比較結案，保留限制與證據；新增HIST-SPEC-CLAUSE-01：未核對的完整數值／API／舊日文細項仍待逐條驗證，不授权恢復舊政策。調查完成不代表這些細項驗收完成。

正式checkbox：**18完成、26未完成、44唯一ID**。未完成細分：BLOCKED3、IMPLEMENTED_UNVERIFIED4、DESIGN_PENDING6、其他13；P0未完成0。歷史38項與各階段原數不改。第九階段及重構沒有自動啟動。

需使用者決定：是否批准上述CURRENT文件補充／歷史細項調查，以及既有殿堂政策、野手sta5%、保留特性與新功能。沒有發現需立即改遊戲的已確認新Bug；歷史與現行差異不直接當Bug。

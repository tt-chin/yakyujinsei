# COPY-01 日文文案全量清查（前置作業）2026-11-28

## 目的與範圍

- 本文件為 BACKLOG COPY-01「全量清查」的前置作業紀錄。
- 只做清查，不提出最終文案，不構成實作授權。
- 掃描基準：`fix/copy-01-batch2` `54aa2ce`（[PR #134](https://github.com/tt-chin/yakyujinsei/pull/134)，已合併至 dev）。
- 本次僅更新合併狀態與專名分類；實際掃描基準仍為 `54aa2ce`，不代表重新掃描。TSV 與既有統計不變。
- 掃描對象：`docs/index.html` 與 `docs/src/**`，排除 `release-notes.js`。

## 方法

- 以 acorn AST 抽出含假名／漢字的字串與樣板字面值（template literal 以 `${expr}` 佔位符連接）；`docs/index.html` 另抽出 HTML 文字節點與屬性。
- 「已涵蓋」的判定方式為：與 `COPY_01_JAPANESE_TEXT_AUDIT.md` 現行／提案文案做文字片段比對（掃描與比對腳本只存在本機 scratchpad，不進版控），不是以 file:line 對應。
- 事件卡的 `sourceName` 共 92 筆，不會顯示於畫面，歸類為 HIDDEN。

## 總數

抽出 3,310 筆＝63 筆已涵蓋（COVERED）＋92 筆標為不顯示（HIDDEN）＋3,155 筆未涵蓋（NOT_COVERED）。

### NOT_COVERED 依類別

| category | count |
|---|---|
| label/option (engine) | 490 |
| UI label/short | 291 |
| data: event choice button | 276 |
| data: event result (good) | 276 |
| data: event result (bad) | 276 |
| log/narrative (engine) | 276 |
| data: master/catalog | 265 |
| retirement/career card (title/body) | 244 |
| choice button/option | 112 |
| data: names | 96 |
| UI text | 95 |
| data: event card title | 92 |
| data: event card body | 92 |
| data: team names | 58 |
| html text (label/heading/button) | 55 |
| choice sub-text | 42 |
| dialog/title/message | 31 |
| share image (canvas) | 27 |
| dialog | 20 |
| aria | 13 |
| card title/heading | 11 |
| label/table cell | 8 |
| html attr | 6 |
| tooltip/title | 2 |
| button | 1 |

## 各檔案統計

| file | total | covered | not covered | hidden |
|---|---|---|---|---|
| docs/src/data/event-cards-jp.js | 1104 | 0 | 1012 | 92 |
| docs/src/data/jp-data.js | 237 | 0 | 237 | 0 |
| docs/src/engine/career-retirement.js | 173 | 9 | 164 | 0 |
| docs/src/engine/career-movement.js | 157 | 3 | 154 | 0 |
| docs/src/engine/player-romance.js | 117 | 2 | 115 | 0 |
| docs/src/engine/award-consumer-policy.js | 102 | 11 | 91 | 0 |
| docs/src/data/player-names.js | 96 | 0 | 96 | 0 |
| docs/index.html | 77 | 3 | 74 | 0 |
| docs/src/engine/amateur-career.js | 69 | 1 | 68 | 0 |
| docs/src/engine/trait-policy.js | 61 | 0 | 61 | 0 |
| docs/src/data/team-nicknames.js | 58 | 0 | 58 | 0 |
| docs/src/engine/career-contract.js | 51 | 0 | 51 | 0 |
| docs/src/engine/season-phases.js | 51 | 4 | 47 | 0 |
| docs/src/ui/career-review.js | 51 | 0 | 51 | 0 |
| docs/src/engine/game.js | 44 | 0 | 44 | 0 |
| docs/src/engine/defense-position-review.js | 43 | 0 | 43 | 0 |
| docs/src/ui/salary-detail.js | 43 | 2 | 41 | 0 |
| docs/src/ui/season-summary.js | 43 | 0 | 43 | 0 |
| docs/src/engine/player-injury.js | 35 | 0 | 35 | 0 |
| docs/src/engine/season-events.js | 34 | 0 | 34 | 0 |
| docs/src/ui/career-presenter.js | 34 | 0 | 34 | 0 |
| docs/src/ui/share-image.js | 32 | 5 | 27 | 0 |
| docs/src/engine/season-awards.js | 29 | 1 | 28 | 0 |
| docs/src/engine/league-catalog.js | 28 | 0 | 28 | 0 |
| docs/src/engine/award-identity-policy.js | 27 | 4 | 23 | 0 |
| docs/src/engine/browser-save-controller.js | 25 | 0 | 25 | 0 |
| docs/src/engine/professional-season.js | 25 | 0 | 25 | 0 |
| docs/src/engine/salary-explanation-policy.js | 24 | 4 | 20 | 0 |
| docs/src/ui/allocation-presentation.js | 23 | 0 | 23 | 0 |
| docs/src/ui/information-dialog.js | 21 | 2 | 19 | 0 |
| docs/src/ui/career-event-history.js | 19 | 0 | 19 | 0 |
| docs/src/ui/event-result-view.js | 19 | 0 | 19 | 0 |
| docs/src/ui/fa-market-presentation.js | 19 | 0 | 19 | 0 |
| docs/src/ui/injury-risk-view-model.js | 19 | 0 | 19 | 0 |
| docs/src/engine/ability-evaluation-policy.js | 17 | 0 | 17 | 0 |
| docs/src/ui/trait-result-card.js | 17 | 0 | 17 | 0 |
| docs/src/engine/hall-of-fame-policy.js | 16 | 2 | 14 | 0 |
| docs/src/engine/international-tournament.js | 15 | 1 | 14 | 0 |
| docs/src/engine/season-settlement.js | 15 | 0 | 15 | 0 |
| docs/src/ui/career-record.js | 15 | 0 | 15 | 0 |
| docs/src/ui/player-detail.js | 15 | 0 | 15 | 0 |
| docs/src/engine/player-ability.js | 14 | 0 | 14 | 0 |
| docs/src/engine/jersey-flow.js | 13 | 0 | 13 | 0 |
| docs/src/ui/contract-labels.js | 13 | 0 | 13 | 0 |
| docs/src/ui/browser-save-ui.js | 11 | 1 | 10 | 0 |
| docs/src/ui/seed-share.js | 11 | 1 | 10 | 0 |
| docs/src/ui/ability-view.js | 10 | 1 | 9 | 0 |
| docs/src/ui/preferences.js | 10 | 1 | 9 | 0 |
| docs/src/engine/hof-evaluation-policy.js | 9 | 1 | 8 | 0 |
| docs/src/engine/domestic-tournament-policy.js | 8 | 0 | 8 | 0 |
| docs/src/ui/decision-presentation.js | 8 | 0 | 8 | 0 |
| docs/src/ui/desktop-overview.js | 8 | 0 | 8 | 0 |
| docs/src/engine/career-policy.js | 7 | 0 | 7 | 0 |
| docs/src/engine/event-policy.js | 7 | 0 | 7 | 0 |
| docs/src/ui/game-view.js | 7 | 1 | 6 | 0 |
| docs/src/ui/record-view.js | 7 | 2 | 5 | 0 |
| docs/src/engine/team-demand-policy.js | 6 | 0 | 6 | 0 |
| docs/src/ui/choice-prompt.js | 6 | 1 | 5 | 0 |
| docs/src/ui/income-summary.js | 6 | 0 | 6 | 0 |
| docs/src/ui/international-personal-stats.js | 6 | 0 | 6 | 0 |
| docs/src/engine/hall-of-fame-tier-policy.js | 5 | 0 | 5 | 0 |
| docs/src/engine/championship-policy.js | 4 | 0 | 4 | 0 |
| docs/src/engine/international-trait-policy.js | 4 | 0 | 4 | 0 |
| docs/src/ui/condition-view-model.js | 4 | 0 | 4 | 0 |
| docs/src/ui/theme-catalog.js | 4 | 0 | 4 | 0 |
| docs/src/engine/career-entry.js | 3 | 0 | 3 | 0 |
| docs/src/ui/event-category-badge.js | 3 | 0 | 3 | 0 |
| docs/src/engine/career-traits.js | 2 | 0 | 2 | 0 |
| docs/src/engine/international-selection-policy.js | 2 | 0 | 2 | 0 |
| docs/src/engine/year-flow.js | 2 | 0 | 2 | 0 |
| docs/src/ui/confirmation-dialog.js | 2 | 0 | 2 | 0 |
| docs/src/ui/international-history.js | 2 | 0 | 2 | 0 |
| docs/src/ui/jersey-dialog.js | 2 | 0 | 2 | 0 |
| docs/src/engine/browser-save-codec.js | 1 | 0 | 1 | 0 |
| docs/src/engine/initial-state.js | 1 | 0 | 1 | 0 |
| docs/src/engine/jersey-policy.js | 1 | 0 | 1 | 0 |
| docs/src/engine/market-policy.js | 1 | 0 | 1 | 0 |

## 待審候選

以下為審閱提示，不含建議文案。「text」欄為原文截斷，「reason」欄保留掃描判斷理由；第 12 項改為本次人工審閱分類，TSV 原始 flags 不變。

| # | file:line | text (truncated) | reason |
|---|---|---|---|
| 1 | docs/src/engine/career-retirement.js:108 | チームの公式ウェブサイトのプレスリリースで引退を発表しましたね。あなたがこの投稿を投稿した夜… | machine-translation feel: 「投稿を投稿」, 敬体 within plain narrative, 「あなた」 |
| 2 | docs/src/engine/career-movement.js:46 | あなたはこの契約にふさわしい人物であることを証明しました。 | 敬体+「あなた」; neighbours are 常体 narrative; translation-like |
| 3 | docs/src/engine/career-movement.js:82 | 苦情は苦情、この取引は結局実現しませんでした。あなたはまだ元のチームにいますが… | translation-like phrasing, 敬体 vs surrounding 常体 |
| 4 | docs/src/engine/career-movement.js:85 | あなたの沈黙にもかかわらず、チームは取引を完了しました。 | translation-like, 敬体 |
| 5 | docs/src/engine/career-movement.js:333,337 | …あなたの成長を見守ってきた / あなたこそ、この球団の代名詞だ | 「あなた」 second-person usage inconsistent with rest of narrative |
| 6 | docs/src/engine/player-ability.js:123 | ${ABL[k]} +5 (最大潜在力+10 →…） | half-width "(" paired with full-width "）"; 「潜在力」 vs 「潜在能力」 (11 uses) |
| 7 | docs/src/engine/player-ability.js:112,124 / season-phases.js:66 | …ダイスを1個自動で振り / トレーニングダイスは永久に3以上 | 「ダイス」 (3) vs 「サイコロ」 (12) for the same item |
| 8 | docs/src/engine/award-consumer-policy.js:76, award-identity-policy.js:23, season-awards.js:67 | オールスターゲーム(ファン投票選出) / (ファン投票選出) | half-width parentheses next to full-width text; other strings use （） |
| 9 | docs/src/engine/career-retirement.js:227 | キャリア年表 (キャリアの実績) | half-width ( ) with space; sibling heading at :202 uses （アマチュア成績） |
| 10 | docs/src/engine/career-retirement.js:35,43 | スイングマン( / ユーティリティープレーヤー( | fragments ending in half-width "(" (check assembled string); 「プレーヤー」 (2) vs 「選手」 (53) |
| 11 | docs/src/engine/award-consumer-policy.js:80 | 中繼王 | traditional-Chinese 繼 (JP 継); probably an alias key (displayed name is 中継ぎ), confirm not displayed |
| 12 | docs/src/data/jp-data.js:1 | 國學院皇典大学 | 需確認遊戲內專名；不能僅憑「國」「學」字形判定中文混入，不直接替換遊戲內名稱 |
| 13 | docs/src/engine/season-settlement.js:87 | 社会人給与 / 企業給与 / 独立リーグ年間報酬 | income vocabulary mixed: 年俸 (79) / 給与 (2) / 報酬 (2) / 給料 (7, mostly 給料泥棒) |
| 14 | docs/src/ui/income-summary.js:6 | 年俸・報酬 | 年俸 vs 報酬 grouping; check against 給与 in season-settlement.js:87 |
| 15 | docs/src/engine/career-movement.js:175,180,181 | ポスティング入札 / 入札球団なし / 入札する球団は現れなかった | 入札 (4) vs ポスティング (10) for same flow; 入札 is a less usual baseball term |
| 16 | docs/src/engine/career-retirement.js:181,310 | …才 (age) | 才 (9) vs 歳 (14) for age; check counter consistency |
| 17 | docs/src/engine/career-movement.js:307-308; career-retirement.js:320 | 戦力外 / 二軍落ち拒否して結果も出せず。給料泥棒呼ばわりも残当 | 「残当」 is net slang inside an otherwise plain card; 戦力外 (4) vs リリース (2, one is baseball 'release point') |
| 18 | docs/src/ui/salary-detail.js:13 | ポスティング譲渡金（球団への支払い・生涯収入対象外） | long parenthetical in a dt label; wording density (also :19, :23 full-width % parens fine) |
| 19 | docs/src/engine/amateur-career.js:84 | 全休 | 全休 vs 完全休養 (event data) vs 今季全休 / シーズン全休 variants |
| 20 | docs/src/ui/seed-share.js:24,36,41,69 | 現在のシード / シード / リプレイURL / 野球人生シミュレーター | batch2 uses シード; check リプレイURL vs 共有URL / 「野球人生シミュレーター」 vs title 「YaKyoLife」 product name consistency (AGENTS.md says URL is seed-only) |
| 21 | docs/src/engine/season-phases.js:75 | 開幕前の投球プラン（腕の状態：…） | dynamic string; assembled sentence not resolved |
| 22 | docs/src/engine/career-retirement.js:89 (and 2 more) | …ました。 (keitai) | 6 敬体 sentences among 37 常体 in this file |
| 23 | docs/src/engine/career-retirement.js:105 | 引退試合の舞台は台北ドーム。… | location specific to CPBL; check shown to all leagues (not wording) |
| 24 | docs/src/engine/player-injury.js:26,31,33,66,95 | 今季全休 / 翌年全休 / シーズン全休 / 翌季全休 | 年 / 季 / シーズン expression drift (季 74 hits, 年度 20, シーズン 59) |
| 25 | docs/src/data/event-cards-jp.js (92 cards) | sourceName e.g. 跨系體能菜單, 學長的工具箱, 球探來了 | traditional Chinese, field not displayed (verify no UI reads sourceName); ~31 of 92 flagged by char test, all hidden |

## 術語變體

名詞變體的計次（不含事件卡 sourceName、人名與球隊名表；為子字串計次，「季」「才」「球団」等雜訊較多）。

| group | variant | strings | of which event-card data | examples |
|---|---|---|---|---|
| 年俸/給与 | 年俸 | 79 | 0 | src/engine/amateur-career.js:37, src/engine/amateur-career.js:56 |
| 年俸/給与 | サラリー | 0 | 0 |  |
| 年俸/給与 | 給料 | 7 | 0 | src/engine/career-movement.js:49, src/engine/career-movement.js:49 |
| 年俸/給与 | 給与 | 2 | 0 | src/engine/season-settlement.js:87, src/engine/season-settlement.js:87 |
| 年俸/給与 | 報酬 | 2 | 0 | src/engine/season-settlement.js:87, src/ui/income-summary.js:6 |
| 年俸/給与 | 年収 | 0 | 0 |  |
| 入札/ポスティング | ポスティング | 10 | 0 | src/engine/career-contract.js:234, src/engine/career-contract.js:234 |
| 入札/ポスティング | 入札 | 4 | 0 | src/engine/career-movement.js:175, src/engine/career-movement.js:180 |
| 入札/ポスティング | ポスト | 0 | 0 |  |
| 二軍 | 二軍 | 11 | 0 | src/engine/career-movement.js:121, src/engine/career-movement.js:121 |
| 二軍 | 2軍 | 0 | 0 |  |
| 二軍 | ファーム | 2 | 2 |  |
| 一軍 | 一軍 | 17 | 0 | src/engine/career-movement.js:118, src/engine/career-movement.js:125 |
| 一軍 | 1軍 | 0 | 0 |  |
| 一軍 | トップチーム | 0 | 0 |  |
| 育成 | 育成選手 | 0 | 0 |  |
| 育成 | 育成契約 | 2 | 0 | src/engine/career-policy.js:15, src/ui/contract-labels.js:1 |
| 育成 | 育成 | 29 | 4 | src/engine/amateur-career.js:37, src/engine/amateur-career.js:37 |
| 台湾 | 台湾プロ野球 | 19 | 0 | src/engine/award-consumer-policy.js:82, src/engine/award-identity-policy.js:34 |
| 台湾 | CPBL | 0 | 0 |  |
| 台湾 | 台湾 | 34 | 10 | src/engine/award-consumer-policy.js:82, src/engine/award-identity-policy.js:34 |
| 韓国 | KBO | 13 | 8 | src/engine/career-retirement.js:115, src/engine/league-catalog.js:23 |
| 韓国 | 韓国プロ野球 | 3 | 0 | src/engine/career-movement.js:188, src/engine/career-movement.js:299 |
| 韓国 | 韓国 | 12 | 2 | src/engine/career-movement.js:188, src/engine/career-movement.js:299 |
| 米国 | MLB | 6 | 1 | src/engine/amateur-career.js:50, src/engine/career-contract.js:255 |
| 米国 | メジャーリーグ | 10 | 0 | src/engine/award-consumer-policy.js:82, src/engine/award-identity-policy.js:34 |
| 米国 | メジャー | 13 | 3 | src/engine/award-consumer-policy.js:82, src/engine/award-identity-policy.js:34 |
| 米国 | 米国 | 8 | 0 | src/engine/amateur-career.js:50, src/engine/amateur-career.js:56 |
| 米国 | アメリカ | 3 | 1 | src/engine/career-retirement.js:127, src/engine/career-retirement.js:301 |
| マイナー | MiLB | 2 | 0 | src/engine/amateur-career.js:54, src/ui/career-review.js:42 |
| マイナー | マイナーリーグ | 0 | 0 |  |
| マイナー | マイナー | 8 | 7 | src/engine/league-catalog.js:27 |
| 引退 | 引退 | 49 | 1 | src/engine/career-movement.js:49, src/engine/career-movement.js:145 |
| 引退 | 現役を退 | 7 | 0 | src/engine/amateur-career.js:33, src/engine/amateur-career.js:63 |
| 引退 | 現役引退 | 2 | 0 | src/engine/career-retirement.js:116, src/engine/season-phases.js:90 |
| 引退 | 退団 | 0 | 0 |  |
| 契約更改 | 契約更改 | 3 | 0 | src/engine/career-contract.js:251, src/engine/event-policy.js:77 |
| 契約更改 | 更改 | 3 | 0 | src/engine/career-contract.js:251, src/engine/event-policy.js:77 |
| FA | FA | 17 | 0 | src/engine/career-movement.js:247, src/engine/career-movement.js:248 |
| FA | フリーエージェント | 0 | 0 |  |
| 潜在能力 | 潜在能力 | 11 | 0 | src/engine/player-ability.js:124, src/engine/player-injury.js:50 |
| 潜在能力 | 潜在力 | 1 | 0 | src/engine/player-ability.js:123 |
| 潜在能力 | ポテンシャル | 0 | 0 |  |
| 潜在能力 | 潜在的 | 0 | 0 |  |
| 潜在能力 | 最大潜在 | 1 | 0 | src/engine/player-ability.js:123 |
| 能力値 | 能力値 | 3 | 0 | src/engine/player-romance.js:175, src/engine/season-phases.js:69 |
| 能力値 | 能力値 | 3 | 0 | src/engine/player-romance.js:175, src/engine/season-phases.js:69 |
| 能力値 | 能力 | 61 | 1 | src/engine/amateur-career.js:61, src/engine/amateur-career.js:63 |
| シード | シード | 12 | 0 | src/engine/career-retirement.js:360, src/engine/career-retirement.js:361 |
| シード | Seed | 0 | 0 |  |
| シード | SEED | 0 | 0 |  |
| 殿堂 | 殿堂入り | 9 | 0 | src/engine/career-retirement.js:85, src/engine/career-retirement.js:142 |
| 殿堂 | 殿堂 | 16 | 0 | src/engine/career-retirement.js:85, src/engine/career-retirement.js:127 |
| 独立 | 独立リーグ | 20 | 5 | src/engine/amateur-career.js:33, src/engine/amateur-career.js:46 |
| 独立 | 独立 | 24 | 5 | src/engine/amateur-career.js:33, src/engine/amateur-career.js:46 |
| 社会人 | 社会人野球 | 14 | 1 | src/engine/amateur-career.js:33, src/engine/amateur-career.js:45 |
| 社会人 | 社会人 | 22 | 2 | src/engine/amateur-career.js:33, src/engine/amateur-career.js:45 |
| 社会人 | 企業チーム | 0 | 0 |  |
| 社会人 | 実業団 | 0 | 0 |  |
| 戦力外 | 戦力外 | 4 | 0 | src/engine/career-movement.js:307, src/engine/career-movement.js:308 |
| 戦力外 | 自由契約 | 0 | 0 |  |
| 戦力外 | 解雇 | 0 | 0 |  |
| 戦力外 | リリース | 2 | 0 | src/engine/career-retirement.js:108, src/engine/career-retirement.js:191 |
| 移籍 | トレード | 15 | 0 | src/engine/career-contract.js:241, src/engine/career-contract.js:241 |
| 移籍 | 移籍 | 31 | 3 | src/engine/amateur-career.js:114, src/engine/career-contract.js:241 |
| 球団/チーム | 球団 | 91 | 17 | src/engine/amateur-career.js:50, src/engine/career-contract.js:95 |
| 球団/チーム | チーム | 30 | 7 | src/engine/career-movement.js:44, src/engine/career-movement.js:45 |
| 中継ぎ | 中継ぎ | 8 | 0 | src/engine/award-consumer-policy.js:61, src/engine/award-consumer-policy.js:63 |
| 中継ぎ | セットアッパー | 0 | 0 |  |
| 中継ぎ | リリーフ | 0 | 0 |  |
| 抑え | 抑え | 5 | 2 | src/engine/career-retirement.js:25, src/engine/career-retirement.js:34 |
| 抑え | クローザー | 0 | 0 |  |
| 抑え | 守護神 | 0 | 0 |  |
| 先発 | 先発 | 10 | 0 | src/engine/career-retirement.js:25, src/engine/career-retirement.js:34 |
| 先発 | ローテ | 2 | 0 | src/engine/defense-position-review.js:42, src/engine/defense-position-review.js:43 |
| 年 | シーズン | 59 | 1 | src/engine/amateur-career.js:114, src/engine/amateur-career.js:114 |
| 年 | 年度 | 20 | 0 | src/engine/award-consumer-policy.js:71, src/engine/award-consumer-policy.js:77 |
| 年 | 季 | 74 | 3 | src/engine/amateur-career.js:84, src/engine/amateur-career.js:90 |
| 大学 | 大学 | 37 | 0 | src/data/jp-data.js:1, src/data/jp-data.js:1 |
| 大学 | 大学野球 | 3 | 0 | src/engine/amateur-career.js:93, src/engine/career-retirement.js:122 |
| 高校 | 高校 | 24 | 0 | src/data/jp-data.js:1, src/data/jp-data.js:1 |
| 高校 | 高校野球 | 7 | 0 | src/engine/amateur-career.js:87, src/engine/amateur-career.js:89 |
| 成績 | 成績 | 56 | 0 | src/engine/career-contract.js:85, src/engine/career-movement.js:49 |
| 成績 | 記録 | 36 | 0 | src/engine/career-retirement.js:165, src/engine/career-retirement.js:165 |
| 成績 | スタッツ | 0 | 0 |  |
| 選手 | 選手 | 53 | 6 | src/engine/amateur-career.js:89, src/engine/amateur-career.js:93 |
| 選手 | プレイヤー | 0 | 0 |  |
| 選手 | プレーヤー | 2 | 0 | src/engine/career-retirement.js:43, src/engine/trait-policy.js:5 |
| 日本代表 | 日本代表 | 13 | 0 | src/engine/career-retirement.js:233, src/engine/career-retirement.js:235 |
| 日本代表 | 侍ジャパン | 2 | 0 | src/engine/career-retirement.js:311, src/engine/trait-policy.js:5 |
| 日本代表 | 代表 | 24 | 0 | src/engine/amateur-career.js:98, src/engine/career-retirement.js:142 |
| 最優秀 | 最優秀 | 30 | 0 | src/engine/award-consumer-policy.js:61, src/engine/award-consumer-policy.js:61 |
| 最優秀 | MVP | 22 | 0 | src/engine/award-consumer-policy.js:66, src/engine/award-consumer-policy.js:69 |
| 年齢 | 年齢 | 11 | 0 | src/engine/career-contract.js:85, src/engine/career-retirement.js:203 |
| 年齢 | 歳 | 14 | 0 | src/engine/career-retirement.js:188, src/engine/season-phases.js:66 |
| 年齢 | 才 | 9 | 1 | src/engine/career-retirement.js:181, src/engine/career-retirement.js:310 |
| 交換/契約年数 | 年契約 | 5 | 0 | src/engine/career-contract.js:234, src/engine/career-movement.js:258 |
| 交換/契約年数 | 複数年契約 | 0 | 0 |  |
| 交換/契約年数 | 契約年数 | 0 | 0 |  |
| ベース/日本語ノリ | ワイ | 30 | 27 | src/data/jp-data.js:1, src/engine/league-catalog.js:88 |
| ベース/日本語ノリ | 草 | 51 | 48 | src/engine/career-retirement.js:85, src/engine/career-retirement.js:85 |
| ベース/日本語ノリ | やで | 0 | 0 |  |

## 已抽查

已在 `54aa2ce` 上確認下列字串確實逐字存在：

- `career-retirement.js:108`「あなたがこの投稿を投稿した夜…」
- `career-movement.js:46` 與 `:82`
- `award-consumer-policy.js:80`「中繼王」
- `player-ability.js:123`「(最大潜在力+10 →…）」
- `jp-data.js`「國學院皇典大学」：僅確認原字串存在，需確認遊戲內專名，不代表已判定中文混入。

其餘候選尚未逐一抽查。

## 限制

- 涵蓋判定為文字片段（子字串）比對，不是 file:line 對應；batch2 已含部分提案文案，因此這些字串顯示為 COVERED。
- `jp-data.js` 與 league-catalog／team 資料為單行 JSON，行號為 1 或表格行，不是逐項行號。
- 動態字串（以 `${...}` 連接，或由表格、`ABL[k]`、fmt helper 組成者）只能擷取字面片段；來自執行期資料的值（球員名、由表格計算的獎項名）未列舉。
- `docs/designs`、`docs/assets`、樣式（CSS `content:`）、tests、自動產生的 release-notes 不在範圍內。內部代碼／ID 中的假名除 `sourceName` 外未與顯示文字分離。
- 類別為近似分類；自然度（機器翻譯感、敬體／常體混用等）旗標為判斷性質，僅供審閱。

## 明細

逐筆明細見 [COPY_01_INVENTORY_2026-11-28.tsv](COPY_01_INVENTORY_2026-11-28.tsv)（欄位：file、line、category、status、covered_by_fragment、flags、text（80 字內））。

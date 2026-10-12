# 現行詳細設計書 — 野球人生

## 文件定位、版本與導覽

調查基準：dev `ea951c2b1c5525fb1d16aa0e825403d2bc5a2be1`、VERSION **1.11.5**，2026-10-12。這是**現行實作的逆向說明，不是新的產品規格、版別規格或批准文件**。應如何運作以[CURRENT_SPEC](../../CURRENT_SPEC.md)為準，權限以[AGENTS](../../AGENTS.md)為準；已知缺口以[BACKLOG](../../BACKLOG.md)為準。程式有某行不等於該行已批准或已測。

唯一技術細節入口：本書12章只寫架構與流程責務；欄位與RNG見[STATE_AND_RNG_REFERENCE](STATE_AND_RNG_REFERENCE.md)，接口與來源見[MODULE_FUNCTION_INDEX](MODULE_FUNCTION_INDEX.md)，DOM／操作／交易見[FLOWS_AND_UI_REFERENCE](FLOWS_AND_UI_REFERENCE.md)，測試、差異、限制與統計見[第九階段驗收](../reviews/STAGE9_DETAILED_DESIGN_ACCEPTANCE.md)。不重抄CURRENT薪資／殿堂全政策表。

標記可並存：SPECIFIED（正本定義）、IMPLEMENTED（來源可定位）、VERIFIED（特定案例實際測過，必須帶SHA／範圍）、UNVERIFIED（證據不足）、SPEC_MISMATCH（正式文字與實作／證據衝突）、DESIGN_PENDING（未批准）、LEGACY_OR_UNREACHABLE_UNPROVEN（疑似舊碼，不可刪）。
Q＝本輪基準Quick實際入口；H＝已有指定SHA的歷史驗收；S＝本輪source/AST。Q的regex測試不升級為瀏覽器VERIFIED，人工HOF fixture不升級為自然入選率。

## 1. 系統總覽與啟動

入口docs/index.html，單一ES module script src/main.js；6個本地CSS、外部Google Fonts、PNG icon。main先initializeDisplayPreferences，await import game，成功才啟用btn-start。game的static dependencies先評估；不是依import書寫順序逐個執行遊戲。

40JS全在入口可識別載入圖內（48static edge＋1dynamic game edge）。config1、data3、engine24、UI11、main1；依賴全清單與動態範圍見模組附錄。game私有S/R與大量closure，由後段overlay更換早期binding並保存LEGACY；不是40個互相無關的純函式。

game初始化設__YAKYO_JP_DATA__與TEAM_MASTER globals，建立navigation、salary detail、seed share controller、覆寫start/restart/seed handlers。DOM／crypto／TextEncoder／Canvas／structuredClone／ResizeObserver／navigator為環境依賴；能力與契約不是從DOM反推。

dev推送→Cloudflare Preview；只有使用者明確本番批准才main；既有publish-site.yml由main/docs同步公開repo，Cloudflare本番設定不改。本輪不發布main。新增技術Markdown在docs/design內，不參與game import，但未來docs同步可能帶至公開repo，不可加入秘密／私人路徑。

狀態：SPECIFIED + IMPLEMENTED；Q語法/模組/設定入口；全部起動失敗／低階瀏覽器compat仍UNVERIFIED。

## 2. 遊戲狀態S

startJapanese將UI Seed/name/pos正規化，boot S僅rngState，seedInit後newState創建人物；起點2026／16歲／HS一年。106個literal欄位之外有accessor、函式、12個Object.assign欄位與事件補完。詳見S附錄逐欄初值、重要域及124個直接S根存取索引；**106不是完整schema欄位數**。

year/age由advance增加，startYear建stepQ；S保存能力／所得／契約／事件／成績／受賞等，UI tab、分配hist、token、予約更新、CORP WeakMap、簽約retry不在S。salary非列舉getter實際對應careerEarnings而非年俸；orgTeam是ID互換，teamName是函式。只比較JSON.stringify(S)會遺漏這些行為與閉包。

狀態：IMPLEMENTED；第七階段特定交易/session不變條件有H驗證。所有alias、動態key、失敗副作用尚未窮舉；不能宣稱全交易rollback或批准重設S。

## 3. RNG與Seed

Seed只讀seed參數；normalize NFKC/trim/控制字/24 code points，名字別salt hash不混career RNG。新Seed用crypto，人物人生用FNV種子＋Mulberry32；R更新S.rngState與_s。ri/pick/chance各讀現行R，N0一次4R。

Seed分享採目前origin/path＋encodeURIComponent(seed)，去原query/hash，不含rv/rules；舊URL只取seed，不切舊引擎。重播意味同版＋Seed＋同選擇策略，不承諾跨版本完全相同人生。display preference localStorage不是career autosave。

196個RNG相關語法點包含被覆寫舊碼、seedInit、crypto、注入random；不是每人生196次。完整位置、敏感窗口、基準與待驗見S/RNG附錄。狀態：SPECIFIED + IMPLEMENTED；Q fixed-seed等指定案例；全部S/R軌跡本輪未重跑Full，H第七階段保留。

## 4. 球員建立與能力

newState對POS_AB逐項ri(20,32)，投手vel/brk、野手con/pow加初始ri；洗牌pot分組抽值，學校tier 30% S／50% A／20% B後抽學校。P4能力、C9、IF/OF8；完整實作來源G:2797，不從舊詳細表移植。

ovr讀現在能力，P按42/30/18＋sta10%；野手打擊排序及守備權重以CURRENT§3/實作為準，pot不是硬上限。一般abCost與eventAbilityCost有不同門檻，不能為抽離而合併。

allocUI pool每行1點，dice每行当前一顆；cap80／剩0禁止。S能力/carry被修改，hist/pool/idx/touched在session。Undo單步，reset回初始snapshot清hist且重用dice；completed／S身分／世代／DOM連接guard。確定後allocDone才判集中/late；集中是非HS dice至少75%同能力三年，late門檻依原函式，不按註解「能力增8」另造條件。第七階段89＋17矩陣H驗證，Q ability-allocation多為靜態形狀。

補驗缺口：舊hsTier/potSum0讀取與現行newState schema差異，見驗收U07；不把讀取舊欄位當正確設計意圖，也不直接修复稱號。

## 5. 生涯年度推進

active startYear queue為phasePre→phaseIntlPre→phaseMid→phaseEnd；nextStep取一個同步callback，S.done則清queue。不是依時間async timer自動進季。國際POST由amateur/proSeason後的maybeIntl接續，非所有全休路線都走POST。

phasePre處理衰退／全休／投球計畫／骰／守備／能力配分；phaseMid先love→年度事件→健康→「今季の成績を見る」→PRO或業餘成績。全休skipMid跳過季中但仍到季末契約／付款流程。季末優勝與維護、付款、所得、pool配分後movement；advance先確認予約合約，再加年齡／年份、清當年事件並重建queue。

所有分支保持conditional R／抽選位置，不為讀取設計書把random提前。正常、重入與fault边界見流程F03/F06/F09；完整exception/callback可達性UNVERIFIED。

## 6. 聯盟、球團與升降格

LV16階層：HS/U、CORP/IND、NPB_DEV/NPB2/NPB1、KBO2/KBO1、CPBL2/CPBL1、R/A1/A2/A3/MLB。JP_DATA有50高校／25大學／90球團；Master固定teamId，MiLB球團查詢沿MLB Master但level區別，不能把MiLB年資算MLB FA。§2附錄與CURRENT§4/6/11是作用不同的來源，不用歷史強度表更換參數。

movement先分HS/U/CORP/IND；PRO accrue各種年資后委派LEGACY.movement，處理升降格、保有權、FA、延長、cross及戰力外。handleDemotion仍可讀現行salaryCandidate binding。未知階層stat-bucket不fallback。已簽schedule降格不溯削；升格只提高未付適用年度最低保障。N/A制度必須按聯盟判，不統一年資。

狀態：IMPLEMENTED；Q career/control/KBO/record與H契約381限定矩陣；每條年齡／階層／海外全組合UNVERIFIED。

## 7. 契約、年俸與金錢

技術流程：候選→確定價→fixedContract/createContract→提交所屬ct→一次性signing payment→decision snapshot→render。salaryCandidate處理payD/三季、par、position、跨聯盟route/anchor/floor/cap、KBO package、首次US資格／bonus。CURRENT§11定義政策；本書不復製一套可修改的薪資表。

ct schema3 annualSchedule為保障支付正本；appendExtension接舊約之後、transfer保留、buyout用未付schedule。markSalaryPaid返回新ct及amount，game才加careerBaseSalary/earnings；incentive、bonus、stipend、outside、corp分帳。當年實付／ct下一筆未付／currentSalary／來年予定／總所得不是可互換字段。posting不進球員所得。normalize不自動付款；舊額不推測補造。

signTo驗證成功才提交sequence/所屬；付款后render失敗同S/year/action/ID重用已成立約；不是全S clone rollback。CORP WeakMap分running/paid/complete，同年付款／描画fault不再領；下一年正常。第七階段已驗範圍H與目前source一致。

予約更新由pendingOffseasonSalary在advance前落地；回國候選按S/year/ct cache。普通海外overseasOffer仍重算candidate，cross?1:mult使表面1與1.3不必然不同價，完整提示→受諾資料流保留U03補驗，不先判salary Bug。旧市場疑似不可達但未證，不能刪。

## 8. 成績、履歷與評價

simSeason產生st；event form在基礎上限後、effort/onetool前；非0年度才做指定一致性校正；最後st共用統計、受賞、薪資評估。G accStat/accLevelStat對同st累計league/level，交易分割不重抽；業餘/IND用國內大會，不新造PA/IP。

薪資評估近3季保留；薪資決定不限10筆、同salaryYear/type替換異type保存。多年約延續無假決定。S.log用當時tm/age/year/line，不以現在所屬補造以前。player career tab讀read-only model。未知／被裁掉舊資料不重建金額。

狀態：SPECIFIED + IMPLEMENTED；Q payD/history/record等限定原生測試；歷史長履歷/UI H，全部顯示數值／每守備角色動態邊界UNVERIFIED。

## 9. 退休與殿堂

退休由使用者、年齡48、最低能力與無續約路線等現行分支進endGame；done=true、清act、生成聯盟成績/tiers、retireScene／結果與分享。舊endGame由wrapper/LEGACY仍活，不可當死碼。

tierOf先用raw careerScore＋honor分tier，保底MVP/ace與king；返回round sc供後續票選演出/首輪判定。首輪legendLeague只真首輪CPBL→KBO→NPB→MLB第一個，代表退休聯盟選法不同；不得混用。HOF-NATURAL-SAMPLE、BUCKET、PITCHER、HONOR、DISPLAY-ROUND、VOTE-STORY均保留既有待驗／DESIGN_PENDING，不自行概率化、改系數、改一軍範圍。

Q honor／first-ballot固定人工案例VERIFIED限定範圍；自然四聯盟率／4000生涯／全演出文字未驗。hsTier/potSum0稱號字段缺口見驗收U07，未宣稱自然重現。

## 10. UI、DOM與事件

home、player、career三頁；player2 tab、career4 tab。固定board/nav由ResizeObserver實測height；home log→toggle→act單一所有者。閲覽只hidden/ARIA與model renderer，不複製#log/#act，listener保持。

choose建立generation/token，button onclick直接同步runWithResultView→runChoiceAction→invokeChoiceAction(o.f)。callback若創下一choose，舊token不清新DOM；例外報錯後僅仍same token才restore；此restore不是S rollback。alloc內重畫行只保持當前有效row/session，舊行callbackguard擋。

事件drawnCardIDs排除本年；pending保存occurrence；applyEvent先對比processed再effect快照/計算/commit，resolve渲染結果後僅applied才done。視覺顯示成功率/育成點/carry/成績點/贊助，不能把points當能力必加。

PC1280/320/390的Quick ACT/draft fixture與歷史Full矩陣分開；非iOS/Android實機。本輪不新增觀察器或測試程式。詳細節點/callback生命期見流程。

## 11. 分享與偏好設定

preferences持唯一storage display.v1/schema1；default standard/medium/standard，unknown/failure fallback；改html dataset＋emit displaychange不重跑選擇／board／R。geometry-only observer與dialog焦點另屬UI閉包。

seed-share當前URL＋seed；native share直接click傳title/text/url，AbortError不copy；不支援才clipboard→execCommand→manual，其他error手動。generation/open校驗擋旧Promise回來覆盖新dialog；button finally復原。Seed copy別route，不能把原生Promise resolve說成已送達。

shareImage讀S生成920邏輯寬×2PNG；四palette、同data URL給preview/download/share；一個displaychange listener只theme變更重生已連接生成图，不為fontsize/density重新生成。原生share sheet與实机仍BLOCKED，Q mocks不替代OS。沒有career autosave／雙引擎。

## 12. 測試、CI與部署

Runner list/quick/full/audit；Node24.15.0、外部Playwright1.62.1；Git完整歷史／baseline解析全SHA。Quick45入口，Full59、Audit60自動入口（現行manifest），manual研究/實機不假PASS；本輪只Quick，不為文書跑Linux Full。實際分類以Runner list/manifest而非舊檔案總數為準。

test.yml：dev push Quick；main PR Full；workflow_dispatch可選。push paths-ignore僅BACKLOG及Stage6報告，不能排除其他設計文件來省CI；PR不paths-ignore。CI LinuxUbuntu24.04，固定Node/Playwright＋Chromium，ログartifact14日；workflow測試專用無發布。publish-site.yml另為main/docs同步，未變。

本輪文件建檔後Quick45 PASS、0FAIL/SKIP/BLOCKED、184.953秒；基準ea951c2，工作樹含文件，遊戲資產不變。後續dev文件提交LinuxQuick及Preview證據由验收報告/BACKLOG補記，受測程式SHA與補記docSHA分開，沒有自指hash。不要把文書章節12/12已建入口解讀為12章全行為VERIFIED。

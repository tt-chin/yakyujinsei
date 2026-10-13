# 首40條結果解讀與追加建議

2026-10-13；受驗18f9decb3a314beb9e70d74465fd1f6096f22d52／1.11.9。對應[總報告](RESEARCH_REPORT.md)、[固定策略](STRATEGIES.md)、[逐Seed完整證據](analysis.json)。本檔補充解讀，不改既有資料。

## 首40條實際結果

- 四批各10／10正常退休、四個預登記首Seed重播全部完整S／選項／R值與窗口一致。正式執行含重播106.376秒，遊戲例外及JS/CSS HTTP失敗0。
- KBO-focused SP：KBO1 SP44季；其他一軍CPBL SP6、NPB SP12，共62季。
- KBO-focused Bullpen：KBO1 MR81季；其他一軍CPBL MR2、NPB MR10，共93季。
- USA-ladder SP：MLB SP14季；其他一軍CPBL SP4、KBO SP21／MR2、NPB SP10，共51季。
- USA-ladder Bullpen：MLB MR4／CL1；其他一軍CPBL MR12／CL12、KBO MR17／CL36、NPB MR10／CL10，共102季。
- 合計308個有效一軍季：KBO SP65／MR100／CL36；MLB SP14／MR4／CL1；NPB SP22／MR20／CL10；CPBL SP10／MR14／CL12。這是不同Seed策略的探索成果，不與第二輪100條作等條件因果試驗。

## KBO邀請與升階

全40條KBO1選項59個觀測／59去重選單，39次接受；包含USA组非美國階段的fallback與在籍合約市場，不能稱39條新入團。KBO2選項9個、接受9個；各Seed詳細可用／未選與實際組織轉換在analysis.json。

021的KBO2於2035升KBO1，後續保留7個有效一軍季，已證明合法升格後不必像第二輪049立即回NPB。對其餘路線逐Seed看實際級別，不用一軍offer直接當成已完成一軍球季。

KBO-focused Bullpen沒有CL季，並非全遊戲無KBO CL。本輪USA-Bullpen的6個Seed帶著其他聯盟既有CL轉入KBO，產生36個KBO CL季。CODE：dposReview不處理KBO，不能把帶入角色的樣本当作KBO內部MR→CL機制驗收。此不對稱仍待規格判斷，不直接修Bug。

## 美國升階與離開

USA選項15個觀測／15去重選單、接受9次；KBO-focused組刻意優先KBO而未選部分赴美選項是固定政策，不算未執行USA規則。美國階層逐年停留與rating保存在americanLevels，包含初約R、兩階升格跳過A1／A3、後期降格與離開，不捏造跳過階層的球季。

例022：2038 R、2039 A2、2040 A3、2041–42 MLB，之後A3/R與自然戰力外海外選項；並非卡死。例037：2029 R→2030 A2→2031 A3，A3多季與2036其他流程／全休需看年度log，不把沒有proSeason紀錄的一年算健康有效季；2039進MLB、記錄MLB5季（MR4／CL1），最終降至R後接受KBO2戰力外重簽。後期投球三項衰退、TJ、成績與現行降格規則共同作用；不能只因停留長就認定程式Bug。

USA-Bullpen只有037提供MLB後援樣本，1個Seed的5季不足以設計門檻或估母體率。下一批若獲批准，應優先補独立赴美後援Seed，不以37的一條多季重複擴大獨立樣本數。

## sta／prevD／lastD與角色

Bullpen兩組皆未出現留牛棚會議，不能宣稱「拒絕轉先發後的角色轉換」已實動通過；一個會議出現在USA-SP 021且按規則接受SP。低sta與投球三項優先配分使部分球員以MR起步，再自然转CL。

觀測037在2039 MLB的MR→CL操作：sta36、更新後prevD5、lastD0，符合下一年度讀prevD的低sta規則。036在2035 NPB MR→CL時sta14、prevD8.3333、lastD0；之後帶CL赴KBO。這些是操作前後快照，並非每個内部函式入口錄影；前一季最終d含全力+1，不能代替補正前lastD／下一年度prevD。

## 是否追加

建議有條件追加，但本輪已停止、未自行新增Seed。

- 新策略已取得前兩輪缺少的KBO／MLB／NPB CL樣本；此證明可自然到達，不證明策略對所有人必然有效。
- 優先另批准USA-Bullpen的新Seed小批（如20條），仍每10條檢查，降低單Seed主導；SP美國樣本已有5 Seed仍不足30的探索目標。
- KBO CL需另外先決定研究目標是「自然在籍CL成績」或「KBO內部角色轉換」。前者可預登記先在NPB／CPBL達CL再接受KBO；後者不能靠增加樣本掩蓋角色審查不對稱，應先釐清政策。
- CPBL CL3 Seed、NPB MR5 Seed仍小；另批以NPB／CPBL留隊後援為明示目標，不临時改变已完成本輪策略。
- 保持逐批停止、保留失敗與未職業者；不得直接擴為200條、強制league／role或修改任何獎項公式。正式門檻尚未定案。

## 保護確認

只新增第三輪研究資料夾；原先未追蹤SAMPLE_GAP_DIAGNOSIS.md及tasks/保持原狀。四組策略執行前登錄，正式首批後未變；初次URL／首行轉義工具預檢與臨時保存命令語法失敗已在總報告區分，不是遊戲Bug。未Commit／Push、未改main或正式站，未執行產品Quick／Full／CI／Preview。

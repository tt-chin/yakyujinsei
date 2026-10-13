# 第四輪MLB牛棚20條自然生涯研究

2026-10-13。最新dev受驗SHA e39183f8e6d51f2151669892ac336dfef601e2d3，VERSION1.11.9；引擎最近修改commit a1658c994713fd1fb8f66857dab33df0ff6548fd，game.js blob 118734a938fc1ee94ef5cf9251e5c31eee0d5d92。[BASELINE.json](BASELINE.json)記錄原碼、第三輪全部封存檔與工具SHA256。操作器沿用第三輪USA-Bullpen原文，只有Seed／批次／目的地改變，沒有策略修正。

## 實際結果

完成20/20，失敗0，兩批第一Seed完整重播PASS／PASS（完整S、選項歷史、全R值與次數／窗口及phase觀測）。遊戲Console／pageerror、JS/CSS HTTP失敗皆0。正式20＋2重播耗時47.225秒；win32／Nodev24.15.0／Chrome155.0.8059.39／既有Playwright1.62.1，PC1280×720 loopback真實引擎，不是Preview或實機。

- 第三輪USA-Bullpen10條：MLB有效Seed 1；MR／CL獨立Seed 1／1（聯集1）；SP／MR／CL有效季0／4／1；赴美選項2次觀測／2個去重選單、接受2操作；新進美國1次／1 Seed；體系內升MLB1次／1 Seed。
- 第四輪20條：MLB有效Seed 3；MR／CL獨立Seed 2／3（聯集3）；SP／MR／CL有效季0／8／3；赴美選項8次觀測／8個去重選單、接受8操作；新進美國5次／5 Seed；體系內升MLB3次／2 Seed。
- 合併探索30條：MLB有效Seed 4；MR／CL獨立Seed 3／4（聯集4）；SP／MR／CL有效季0／12／4；赴美選項10次觀測／10個去重選單、接受10操作；新進美國6次／6 Seed；體系內升MLB4次／3 Seed。

不同Seed、相同預登記策略；只是探索性合併，不能外推一般玩家到達率或獲獎率。每球季不是獨立球員，MR與CL獨立Seed會重疊，聯集才是牛棚球員數。赴美契約接受操作包含再入與合約市場，不能等同MLB升格次數。MLB有效樣本要求G>0且IP>0，單純升格／短暫在籍另列，不混入球季。

## 原生MLB成績

- SP：0季，Seed 無；無樣本，UNVERIFIED。
- MR：8季，Seed pitcher-tc-r4-009、pitcher-tc-r4-020；平均W 1.250／era 4.878／IP 30.675／SO 16.625／SV 0.250／HLD 10.625。
- CL：3季，Seed pitcher-tc-r4-008、pitcher-tc-r4-009、pitcher-tc-r4-020；平均W 1.000／era 5.355／IP 35.233／SO 29.000／SV 11.667／HLD 2.667。

只讀取保存st的W、era、IP、SO、SV與存在時的HLD；ERA為raw最終值、IP為十進位局數，沒有生成欠欄位。全部原生st在careers.json／各batch，按年度角色抽取值在analysis.json evidence.mlbSeasons。

## 小聯盟與角色

- 有效球季R/A1/A2/A3/MLB：R 8／A1 12／A2 20／A3 21／MLB 11。兩階升格可跳過階層，不為跳過階層造球季。
- 留牛棚會議出現0次，實選0；MLB內MR→CL 1次，CL→MR 2次。0會議不代表策略失效：自然sta／當前role可能未產生打診。
- 每次變化保存操作全文與前後level、org、role、sta、prevD、lastD；角色觀測是逐操作窗口，不宣稱每個內部函式入口都被錄下。CODE：game.js:342–348低sta的MR讀prevD≥3可轉CL，CL需prevD≥1；767與1268顯示prevD取補正前lastD，不能用全力後st.d替代。
- CODE：1627–1635能力達下一階min且lastD≥0或既有chance50升格，能力更高且lastD≥4可兩階；2748–2759可能把初次MLB候選限制為R。TJ固定手術遵278–315既有負擔／兩次手術降能力，不改規則。

## 每Seed完整路徑

### pitcher-tc-r4-001

- 完成true；失敗無；最終38歲／MR；退休理由総合力が現役続行の最低基準を下回り、2048年に現役を引退した。。R731、操作357。
- 經過HS→NPB2→NPB1→KBO1→CPBL1→CPBL2（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB2 null→MR sta29 prevD-5 lastD0；2036/NPB1 MR→CL sta31 prevD8.333333333333336 lastD0；2045/CPBL1 CL→MR sta17 prevD0 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-002

- 完成true；失敗無；最終38歲／MR；退休理由総合力が現役続行の最低基準を下回り、2048年に現役を引退した。。R681、操作329。
- 經過HS→NPB_DEV→NPB2（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB_DEV null→MR sta8 prevD4.333333333333336 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-003

- 完成true；失敗無；最終36歲／MR；退休理由総合力が現役続行の最低基準を下回り、2046年に現役を引退した。。R641、操作334。
- 經過HS→R→A1→A2→A3（去重列表非完整時間線）；有效美國球季R:1／A1:2／A2:6／A3:7／MLB:0。赴美選項觀測2、接受2、進體系1、MLB升格0；MLB有效季0。
- 升格2029 R→A1「▸ 今季の成績を見る」；2030 A1→A2「▸ 今季の成績を見る」；2035 A1→A2「▸ 今季の成績を見る」；2038 A2→A3「▸ 今季の成績を見る」。
- 降格2034 A2→A1「▸ 今季の成績を見る」。
- 離美無。
- 角色變化2029/A1 null→MR sta10 prevD6.666666666666664 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-004

- 完成true；失敗無；最終39歲／MR；退休理由総合力が現役続行の最低基準を下回り、2049年に現役を引退した。。R743、操作356。
- 經過HS→NPB2→NPB_DEV→NPB1→KBO1（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB_DEV null→MR sta28 prevD-7.333333333333336 lastD0；2043/NPB1 MR→CL sta32 prevD6 lastD0；2044/NPB1 CL→MR sta31 prevD-2 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-005

- 完成true；失敗無；最終41歲／CL；退休理由総合力が現役続行の最低基準を下回り、2051年に現役を引退した。。R870、操作418。
- 經過HS→NPB2→NPB_DEV→NPB1→KBO1→CPBL1（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB_DEV null→MR sta26 prevD-6 lastD0；2035/NPB1 MR→CL sta29 prevD10.333333333333336 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-006

- 完成true；失敗無；最終40歲／MR；退休理由総合力が現役続行の最低基準を下回り、2050年に現役を引退した。。R855、操作424。
- 經過HS→NPB2→NPB1→KBO1→CPBL1（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB2 null→MR sta22 prevD0.3333333333333357 lastD0；2032/NPB1 MR→CL sta16 prevD10.333333333333336 lastD0；2037/CPBL1 CL→MR sta19 prevD0 lastD0；2038/CPBL1 MR→CL sta23 prevD16 lastD0；2044/CPBL1 CL→MR sta27 prevD0 lastD0；2045/CPBL1 MR→CL sta23 prevD10 lastD0；2046/CPBL1 CL→MR sta10 prevD0.3333333333333357 lastD0；2048/CPBL1 MR→CL sta1 prevD3.3333333333333357 lastD0；2050/CPBL1 CL→MR sta1 prevD0 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-007

- 完成true；失敗無；最終37歲／CL；退休理由総合力が現役続行の最低基準を下回り、2047年に現役を引退した。。R695、操作342。
- 經過HS→NPB2→NPB1→KBO1→NPB_DEV（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB2 null→MR sta28 prevD-3.3333333333333357 lastD0；2044/NPB1 MR→CL sta29 prevD6.666666666666664 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-008

- 完成true；失敗無；最終41歲／CL；退休理由総合力が現役続行の最低基準を下回り、2051年に現役を引退した。。R883、操作438。
- 經過HS→NPB2→NPB1→KBO1→MLB→R→A1→A2→KBO2（去重列表非完整時間線）；有效美國球季R:1／A1:3／A2:3／A3:0／MLB:1。赴美選項觀測1、接受1、進體系1、MLB升格0；MLB有效季1。
- 升格2044 R→A1「▸ 今季の成績を見る」；2046 A1→A2「▸ 今季の成績を見る」。
- 降格2042 MLB→R「ルーキーリーグへの降格を受け入れ、再起を目指す」；2049 A2→A1「1Aへの降格を受け入れ、再起を目指す」。
- 離美2050 A1→KBO2「韓国プロ野球への海外移籍オファー・水原マジシャンズ」。
- 角色變化2029/NPB2 null→MR sta23 prevD0.6666666666666643 lastD0；2034/NPB1 MR→CL sta27 prevD8.666666666666664 lastD0；留牛棚會議0/0。
- MLB原生逐季成績2042/CL {"W":0,"era":6,"IP":15,"SO":15,"SV":5,"HLD":1}。

### pitcher-tc-r4-009

- 完成true；失敗無；最終39歲／MR；退休理由総合力が現役続行の最低基準を下回り、2049年に現役を引退した。。R766、操作404。
- 經過HS→R→A2→A3→MLB→A1→KBO2（去重列表非完整時間線）；有效美國球季R:2／A1:2／A2:2／A3:5／MLB:7。赴美選項觀測2、接受2、進體系1、MLB升格2；MLB有效季7。
- 升格2029 R→A2「▸ 今季の成績を見る」；2030 A2→A3「▸ 今季の成績を見る」；2033 A3→MLB「▸ 今季の成績を見る」；2038 A3→MLB「▸ 今季の成績を見る」。
- 降格2035 MLB→A3「3Aへの降格を受け入れる」；2044 MLB→A2「2Aへの降格を受け入れる」；2045 A2→A1「1Aへの降格を受け入れ、再起を目指す」；2047 A1→R「ルーキーリーグへの降格を受け入れ、再起を目指す」。
- 離美2048 R→KBO2「韓国プロ野球への海外移籍オファー・大田ゴールデンイーグルス」。
- 角色變化2029/A2 null→MR sta23 prevD12 lastD0；2034/MLB MR→CL sta33 prevD4.333333333333336 lastD0；2035/MLB CL→MR sta32 prevD-2 lastD0；留牛棚會議0/0。
- MLB原生逐季成績2034/CL {"W":2,"era":3.7636363636363637,"IP":55,"SO":56,"SV":18,"HLD":4}；2035/MR {"W":1,"era":6.9230769230769225,"IP":22.1,"SO":2,"SV":0,"HLD":5}；2039/MR {"W":2,"era":4.408163265306122,"IP":49,"SO":48,"SV":2,"HLD":13}；2040/MR {"W":1,"era":4.571428571428571,"IP":31.5,"SO":11,"SV":0,"HLD":12}；2041/MR {"W":2,"era":3.8346359696580725,"IP":34.6,"SO":24,"SV":0,"HLD":14}；2042/MR {"W":1,"era":3.5889570552147236,"IP":32.6,"SO":15,"SV":0,"HLD":14}；2044/MR {"W":0,"era":7.142857142857143,"IP":18.9,"SO":0,"SV":0,"HLD":5}。

### pitcher-tc-r4-010

- 完成true；失敗無；最終37歲／MR；退休理由総合力が現役続行の最低基準を下回り、2047年に現役を引退した。。R635、操作347。
- 經過HS→R→A2→A1→A3（去重列表非完整時間線）；有效美國球季R:1／A1:1／A2:7／A3:7／MLB:0。赴美選項觀測2、接受2、進體系1、MLB升格0；MLB有效季0。
- 升格2029 R→A2「▸ 今季の成績を見る」；2032 A1→A2「▸ 今季の成績を見る」；2033 A2→A3「▸ 今季の成績を見る」；2041 A2→A3「▸ 今季の成績を見る」。
- 降格2031 A2→A1「▸ 今季の成績を見る」；2039 A3→A2「2Aへの降格を受け入れる」；2043 A3→A2「2Aへの降格を受け入れ、再起を目指す」。
- 離美無。
- 角色變化2029/A2 null→MR sta35 prevD8.333333333333336 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-011

- 完成true；失敗無；最終40歲／MR；退休理由総合力が現役続行の最低基準を下回り、2050年に現役を引退した。。R822、操作415。
- 經過HS→NPB2→NPB1→KBO1（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB1 null→MR sta23 prevD0 lastD4；2033/NPB1 MR→CL sta20 prevD8 lastD0；2044/NPB1 CL→MR sta19 prevD0 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-012

- 完成true；失敗無；最終43歲／MR；退休理由総合力が現役続行の最低基準を下回り、2053年に現役を引退した。。R853、操作412。
- 經過HS→NPB2→NPB_DEV→NPB1→KBO1→CPBL1（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB_DEV null→MR sta17 prevD-13 lastD0；2038/NPB1 MR→CL sta18 prevD14.666666666666664 lastD0；2047/CPBL1 CL→MR sta1 prevD0 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-013

- 完成true；失敗無；最終38歲／MR；退休理由総合力が現役続行の最低基準を下回り、2048年に現役を引退した。。R711、操作339。
- 經過HS→NPB2→NPB_DEV→NPB1→KBO1→CPBL1（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB_DEV null→MR sta9 prevD-9.666666666666664 lastD0；2040/NPB1 MR→CL sta9 prevD8.666666666666664 lastD0；2046/CPBL1 CL→MR sta1 prevD0 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-014

- 完成true；失敗無；最終38歲／MR；退休理由総合力が現役続行の最低基準を下回り、2048年に現役を引退した。。R754、操作369。
- 經過HS→NPB2→NPB1→KBO1→CPBL1→NPB_DEV（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB2 null→MR sta20 prevD-1 lastD0；2035/NPB1 MR→CL sta25 prevD6.333333333333336 lastD0；2036/NPB1 CL→MR sta24 prevD-0.6666666666666643 lastD0；2039/CPBL1 MR→CL sta28 prevD10 lastD0；2045/NPB1 CL→MR sta19 prevD0 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-015

- 完成true；失敗無；最終39歲／MR；退休理由総合力が現役続行の最低基準を下回り、2049年に現役を引退した。。R739、操作358。
- 經過HS→NPB_DEV→NPB2→NPB1→KBO1（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB_DEV null→MR sta19 prevD0.6666666666666643 lastD0；2044/NPB1 MR→CL sta17 prevD5.666666666666664 lastD0；2045/NPB1 CL→MR sta12 prevD0 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-016

- 完成true；失敗無；最終48歲／CL；退休理由体はもう限界。2058 年の春季キャンプ後に引退を発表した。。R844、操作515。
- 經過HS→NPB2→NPB_DEV→NPB1→CPBL1→KBO1→KBO2→IND→CORP（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB_DEV null→MR sta20 prevD-8.333333333333336 lastD0；2036/CPBL1 MR→CL sta28 prevD8.666666666666664 lastD0；2038/NPB1 CL→MR sta29 prevD0 lastD0；2041/CPBL1 MR→CL sta31 prevD7 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-017

- 完成true；失敗無；最終48歲／MR；退休理由体はもう限界。2058 年の春季キャンプ後に引退を発表した。。R900、操作506。
- 經過HS→NPB2→NPB1→KBO1→CPBL1→CPBL2→CORP（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB2 null→MR sta38 prevD-1 lastD0；2034/NPB1 MR→CL sta44 prevD6.333333333333336 lastD0；2035/CPBL1 CL→MR sta40 prevD0 lastD0；2036/CPBL1 MR→CL sta40 prevD9 lastD0；2037/CPBL1 CL→MR sta40 prevD0 lastD0；2038/CPBL1 MR→CL sta40 prevD8.666666666666664 lastD0；2044/CPBL1 CL→MR sta19 prevD0 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-018

- 完成true；失敗無；最終36歲／MR；退休理由総合力が現役続行の最低基準を下回り、2046年に現役を引退した。。R647、操作312。
- 經過HS→NPB2→NPB_DEV→NPB1→KBO1（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB_DEV null→MR sta36 prevD-10 lastD0；2039/NPB1 MR→CL sta39 prevD8 lastD0；2040/NPB1 CL→MR sta39 prevD0.6666666666666643 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-019

- 完成true；失敗無；最終40歲／MR；退休理由総合力が現役続行の最低基準を下回り、2050年に現役を引退した。。R811、操作382。
- 經過HS→NPB2→CPBL1→NPB1→NPB_DEV（去重列表非完整時間線）；有效美國球季R:0／A1:0／A2:0／A3:0／MLB:0。赴美選項觀測0、接受0、進體系0、MLB升格0；MLB有效季0。
- 升格無。
- 降格無。
- 離美無。
- 角色變化2029/NPB2 null→MR sta18 prevD-3.6666666666666643 lastD0；2037/CPBL1 MR→CL sta23 prevD8.666666666666664 lastD0；2038/CPBL1 CL→MR sta23 prevD0 lastD0；2039/NPB1 MR→CL sta26 prevD9.666666666666664 lastD0；2040/NPB1 CL→MR sta24 prevD-4.666666666666664 lastD0；留牛棚會議0/0。
- MLB原生逐季成績無有效樣本，保留此Seed。

### pitcher-tc-r4-020

- 完成true；失敗無；最終48歲／MR；退休理由体はもう限界。2058 年の春季キャンプ後に引退を発表した。。R880、操作498。
- 經過HS→NPB2→NPB1→CPBL1→R→A2→A3→MLB→A1→IND→CORP（去重列表非完整時間線）；有效美國球季R:3／A1:4／A2:2／A3:2／MLB:3。赴美選項觀測1、接受1、進體系1、MLB升格1；MLB有效季3。
- 升格2035 R→A2「トミー・ジョン手術を受ける」；2037 A2→A3「▸ 今季の成績を見る」；2039 A3→MLB「▸ 今季の成績を見る」；2045 A1→A2「▸ 今季の成績を見る」。
- 降格2042 MLB→A1「確定 ▸」；2046 A2→A1「1Aへの降格を受け入れ、再起を目指す」；2048 A1→R「ルーキーリーグへの降格を受け入れ、再起を目指す」。
- 離美2050 R→IND「独立リーグ・福島レッドフェニックス」。
- 角色變化2029/NPB2 null→MR sta36 prevD-0.6666666666666643 lastD0；2034/CPBL1 MR→CL sta44 prevD12.666666666666664 lastD0；2041/MLB CL→MR sta47 prevD-5.333333333333336 lastD0；留牛棚會議0/0。
- MLB原生逐季成績2040/CL {"W":1,"era":6.3,"IP":35.7,"SO":16,"SV":12,"HLD":3}；2041/MR {"W":2,"era":4.267228671396928,"IP":35.7,"SO":27,"SV":0,"HLD":14}；2042/MR {"W":1,"era":4.285714285714286,"IP":21,"SO":6,"SV":0,"HLD":8}。

## 結論、未確認與保存

所有Seed都保留，未入美國／未升MLB／自然退休不是工具FAIL，也不是自動遊戲Bug。完整選項與能力／成績／TJ／年度phase觀測供後續追溯；沒有記錄的外部邀請不猜測。不同路線離美原因以真實操作文字和前後所屬為證據，不把全部離開歸因TJ，不將年度缺log當healthy球季。

不足以定正式獎項門檻：樣本仍小且策略不是玩家母體抽樣，後援角色SO/IP與SP資格應另評估，沒有新增三冠／單項抽選。若牛棚仍集中，優先以有效赴美入口、升階能力及角色prevD門檻做離線診斷；任何改配分／事件／投球／TJ策略需先提出差異及取得批准，不因目標欠樣本直接改程式或加Seed。完成20後已停止，不自行30／40／200。

資料：[careers.json](careers.json)、[analysis.json](analysis.json)、[策略](STRATEGIES.md)、[發現](FINDINGS.md)；traces/保留20條及批次／重播無損分檔，SHA256由既有storage驗證。指令：node run.mjs --batch=1或2 --playwright=<既有模組> --output=<各batch.json>，再node check-batch.mjs 1或2；先PASS才下一批。node analyze.mjs只讀舊資料、生成本輪統計；node prepare.mjs --verify核對前輪與受保護檔。未重跑第三輪、未改策略、未安裝依賴、未修改引擎、獎項、RNG、VERSION、CHANGELOG、CURRENT_SPEC、BACKLOG、main或正式站。研究完成時尚未提交；使用者已允許本輪資料dev保存，後續commit／CI／Preview不冒充生涯受驗SHA。本次不執行新的Full／Audit，手動研究與產品CI區分。

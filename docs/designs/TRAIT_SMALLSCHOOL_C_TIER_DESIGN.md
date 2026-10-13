# TRAIT-SMALLSCHOOL-C：C級高校與出生快照設計

## 1.12.0提交決策補記

2026-10-13使用者批准1.12.0 MINOR，與COPY-001～005合併提交；VERSION／CHANGELOG同步。快照createdVersion採現有VERSION＝1.12.0，不將未發布1.11.9工作樹資料自動列入白名單。以下待版本批准及PROPOSAL文字保留為先前設計／實作階段歷史，以本節及驗收後續補記為最新授權；不改D2、不推送本番。

## 2026-10-13正式授權與工作樹實作補足

使用者後續正式實作指令批准10校原名單、方案B25/45/20/10、C1的HS−4、JP_SABC schema1 write-once與有效出生C資格、unknown不補發、既true保留、不啟用舊白名單、可追溯Seed/R差異。本地已按此修改；未commit/deploy，VERSION仍1.11.9待正式版本批准。下文A/C0推薦與PROPOSAL是先前設計歷史，不冒稱本次採用方案。

實作責務：school-policy.js提供highSchoolTier、HS限定schoolCompetitionBonus、installBirthHighSchool（freeze物件＋不可寫／刪／重定義屬性）與三態smallSchoolEligibility。createdVersion取唯一VERSION；識別新分類靠JP_SABC/schema，已知現行版本精確匹配，不猜測舊1.11.9資料。未來正式版本更新時，若需讀前一正式JP_SABC快照必須先增加可驗來源政策，不能自動兼容未知版本。[實作驗收](../reviews/TRAIT_SMALLSCHOOL_C_IMPLEMENTATION_ACCEPTANCE.md)。

2026-10-13；dev HEAD `0fd13c7532fd03da136c72ef64e9890858cfb81e`；VERSION1.11.9。HEAD含兩次調查文件；工作樹另有任務A文案修改，並非乾淨HEAD。以工作樹實際程式重新確認本文位置。**本文件是設計，不是實作授權。**所有表列機率、校名、ID、地域、補正與schema均PROPOSAL。

## 1. 已批准範圍與限制

APPROVED（tasks/select.md B1）：保留原S/A/B、新增10所C級弱小校、新版弱小校の星取出生C作資格來源、出生高校與目前學校分離、B不映射舊3。取得仍在退休，以原reachedTop gate及未持有條件判定；稱號為紀念性，不增能力效果。

PROPOSAL：機率A/B、能力／大会補正C0/C1/C2、10校、快照schema、分類系統版本、相容實作及合法差分。UNVERIFIED：可信舊來源白名單、所有新校名與真實學校的名稱碰撞、實際新C人生率。BLOCKER（未來實作）：未批准機率／補正／校名／schema／Seed差分之前不得改Master、初始化或退休判定。

已重新確認AGENTS、CURRENT_SPEC、BACKLOG與四份調查文件；不改A產品文案、D2、92事件、版本或BACKLOG。沒有新自然生涯、C fixture產品實作或重生成舊人生。

## 2. 現行Master與全部tier接點

CODE：docs/src/data/jp-data.js:1的highSchools共50筆，欄位只有schoolId/name/tier；S20、A22、B8。50 ID與50 name唯一；HS_001～HS_050。陣列原順序是001/026/002/027等交錯，**不得排序或重編號**。高校無region欄位；universities25另有進路屬性，不新增大學C。

CODE：game.js:2826–2840 active newState先ab抽值、pot洗牌與抽值，再2830 tierRoll=floor(R()*100)（0–29 S、30–79 A、80–99 B），filter同tier→pickRecord（2713，floor(R()*length)）。選校總共兩次R；沒有schoolTier改初始ab或pot的程式。potSum0在返回前保存；不能套用封存文書的S/A潜在加值。

game.js所有school欄位接點：

|位置／函式|讀寫|責務及設計影響|
|---|---|---|
|247 舊newState|寫hsMap/hsTier|T123舊函式被active初始化替代；不為C啟用|
|1254 舊amateurSeason|讀hsTier，+6/0/−6|active amateurSeason已覆寫；不可沿用−6|
|2159 LEGACY.endGame|讀hsTier===3、traits.smallschool|退休仍活；未來僅替換資格來源，保留外層gate|
|2830–2831 active newState|抽tier／school、寫schoolId/schoolTier/team|唯一正常初始高校抽選；新增birth copy在此|
|2864 setSchool|写schoolId/schoolTier/team/lv/org|U進學會覆寫；不得改birth；helper可取HS但不等於自然再轉高中|
|2867 draftFallback、2879 pathChoiceHS|呼叫setSchool('U')|原生升學路徑；舊schoolTier不能作出生證據|
|2902 cupOnce|讀schoolTier S+6/A+2/其他−2|HS/U及CORP/IND共用；C不可靠else隱式決定；非HS不得更動|
|2912 qualifierOnce|讀同tier bonus|目前主要大學神宮／社會人資格；HS新增C政策須stage限定，不能把殘留高校tierC套社會人|
|2929 amateurSeason大學分支|讀schoolId查jinguRoute|不用birth校ID代替目前大學ID|
|3141 startJapanese|newState→出生入部文字|没有另一次入學或玩家選校；保留單次抽選|

其他docs/src文件未搜索到schoolTier/hsTier/schoolId產品讀寫（Master除外）。测试helper/fixture另外會setSchool或注入hsTier，不視為產品規則。

HS生涯：選拔須stageYr≥2且senbatsuEligibleYear===year；夏地方優勝才甲子園；秋季限前兩年，秋resultIndex≤2給翌年選拔資格。cup power=ovr()+beginEventSeason(S).form+bonus+ri(-8,8)，地方優勝≥58、全國≥64；其他切點地方52/46/40、全國58/52/46。STANDARD能力點=min(10,[7,5,4,3,1][idx]+floor(ovr/22)+national1)。結果牽動更多大会出場、能力點、四冠特性miraclegen、後续OVR與選秀。

現行schoolTier不直接改薪資、選秀score或職業成績；runDraft(2869)讀OVR/age/ri，米國初約門檻OVR50/54。但高校成果先影響養成，故間接會改職業路線及收入。不能宣稱只變校名與稱號。

## 3. 10所C級高校候選

PROPOSAL：下列均為自行創作的地方校形象，弱小指球隊競爭力／資源，不貶低地區或學生。未查證全日本真實校名無碰撞（UNVERIFIED）；正式批准前做母語校閱與名稱搜尋。所有ID與現行50校不重複；建議append於原Master尾端，保持所有舊tier候選相對順序。

|schoolId|日文校名|設計地區|tier|命名理由與相容性|
|---|---|---|---|---|
|HS_051|北風野高校|北海道|C|風雪中的小規模公立校；無既有name/ID重複|
|HS_052|奥羽こだま高校|東北・秋田|C|山間迴響意象，無名球隊；同上|
|HS_053|霞野原高校|関東・茨城|C|平原田園、在地部活；同上|
|HS_054|潮見つばさ高校|関東・千葉|C|海風與追夢，不借強豪名；同上|
|HS_055|信濃ほたる高校|中部・長野|C|河谷螢火的小校意象；同上|
|HS_056|越中あかね高校|中部・富山|C|夕照球場與地方校；同上|
|HS_057|丹波こもれび高校|近畿・京都|C|山村木漏日、社區支持；同上|
|HS_058|石見みずほ高校|中国・島根|C|山陰田園，非強豪戲仿；同上|
|HS_059|讃岐はるかぜ高校|四国・香川|C|春風中的小隊伍；同上|
|HS_060|日向あおぞら高校|九州・宮崎|C|開闊天空與地方公立校；同上|

僅name/tier/schoolId可直接符合現行Master形狀；地域先保存設計文件，不擅自為舊50筆填region。若希望加入region顯示／新欄位，另批准schema與來源。高校顯示team全文，多數現行不帶高校後綴；候選帶高校利於辨識，但名稱風格也是PROPOSAL，可核准後決定全名／短名，不能改舊校。

## 4. 出生機率與同抽值影響

|分類|現行|方案A（推薦研究）|方案B|
|---|---:|---:|---:|
|S|30%|27%|25%|
|A|50%|45%|45%|
|B|20%|18%|20%|
|C|0%|10%|10%|

A把原S/A/B全乘0.9，在非C條件下仍30/50/20%；B非C條件为27.7778/50/22.2222%，更減S、保B。各C校在等機率pick且10筆時1%；**新增10筆不等於10/60出生機率**。每所S/A/B原先1.5/2.272727/2.5%；A為1.35/2.045455/2.25%；B為1.25/2.045455/2.5%。推薦A因保留既有非C分布，並非已證明最佳難度。

以同一tierRoll整數0～99枚舉：A界0/27/72/90/100，舊S→A 3%、舊A→B 8%、舊B→C10%，共21%改類、79%同類；B界0/25/70/90/100，5%+10%+10%=25%、75%同類。不等於完整人生21/25%不同率；如果舊tier候選順序保留、同第二次R，同tier可保持校ID；不同tier必改校ID。R浮點離散與特定seed分布可能不同，此為理論100槽枚舉，沒有挑seed或新人生樣本。

初始兩次選校R、之前能力／pot生成可保持原順序與次數，不能新加chance(C)或按地域再抽一次。school group为空的fallback必须为资料错误或维持现行行为另决定；正常新版必须确保四group均非空，快照tier与抽中record.tier矛盾时不能偷改记录。

## 5. 地域分布

现行Master無region。下表是按校名意象与HS编号对应的**分析用地域归类，UNVERIFIED元数据，不是游戏已存地域**：001–002北海道、003–010東北、011–021関東、022–031中部（山梨归中部）、032–039近畿、040–042中国、043–046四国、047–050九州沖縄。每组用实际tier计数，候選C组數1/1/2/2/1/1/1/1。

|地域|現行S/A/B校數|C候選數|现行理论%|A理论%|B理论%|
|---|---|---:|---:|---:|---:|
|北海道|0/1/1|1|4.772727|5.295455|5.545455|
|東北|3/3/2|1|16.318182|15.686364|15.886364|
|関東|6/5/0|2|20.363636|20.327273|19.727273|
|中部|2/5/3|2|21.863636|21.677273|22.227273|
|近畿|6/2/0|1|13.545455|13.190909|12.590909|
|中国|1/2/0|1|6.045455|6.440909|6.340909|
|四国|1/1/2|1|8.772727|8.895455|9.295455|
|九州沖縄|1/3/0|1|8.318182|8.486364|8.386364|

公式每地P=sum(tier概率×该地tier校数/全部tier校数)，C每校1%。没有地域抽选权重、真实人口或高中数代表性；不为均匀覆盖强改旧校。保留旧Master是APPROVED，新增地區分配是PROPOSAL。

## 6. 補正C0／C1／C2

|方案（均PROPOSAL）|初始ab/pot/potSum0|高校大会|进路／职業|称号难度／风险|
|---|---|---|---|---|
|C0推薦起点|全不变|明确C沿用B的−2，不額外負面值；不是0，也不让unknown共享else|对原B→C而言同高校模型；原S/A分配变化可间接较难|出生C10%但gate人生率未测；低額外风险|
|C1隊伍較弱|全不变|研究候选HS限定−4（新规则），比B少2；大学/社會人/独立保持|更难进甲子园/选拔，少points、四冠，后续OVR/draft可能降低|称号资格虽C，reachedTop更难；需批准数值，不沿用旧−6|
|C2能力＋队伍負面（不推薦）|例如ab各−2、pot各−2是新增规则，potSum0必随pot降低|研究候选HS−4，OVR降低再加队伍罚形成双重影响|高成本、可能降低draft与MiLB路径；少年弱队不等于个人天赋弱|扭曲grinder低pot资格、职业平衡；与本schema不改potSum0要求冲突，BLOCKER|

C2仅对照不能采用：P4项pot总和少8、C捕手9项少18、IF/OF8项少16（未发生clamp时），直接改grinder資格与其他特性潜在门槛。即使采用常数修正无额外R，也不是允许seed结果差分。若只ab罚不pot，仍是新规则，需另授权，不默认玩家出生天赋受学校惩罚。

纯公式说明（不是实际胜率）：固定form0、OVR q，ri(-8,8)17等权值，地方优胜門檻58，P=满足q+bonus+r≥58的r个数/17。q52时B−2为1/17、C1−4为0；q56为5/17 vs3/17；q60为9/17 vs7/17。全國门槛64把q换成q−6即可。未把多大会相关样本当独立、没有估完整进职業率。C0与B同公式，可先把弱小作为叙事／资格分类；若用户希望C确实明显较弱，可选C1，但需要合法差分与小样本验证批准。

## 7. 出生快照与资格分离

PROPOSAL schema（非产品实现）：

```text
birthHighSchool = {
  schemaVersion: 1,
  classificationSystem: 'JP_SABC',
  schoolId: 'HS_051',
  tier: 'C',
  createdVersion: '<核准后正式产品VERSION>'
}
```

生成在active newState第一次选校完、state返回前；复制已存在record ID与tier，不再pick，不从advance或setSchool补值。schema复制primitive值，不能引用可变Master对象；对birth块write-once／freeze及JSON还原后的readonly约束是实现选择，不能freeze整个S。既有schoolTier继续目前學校用途；高校毕业留有残值也不能当birth。

合法性：schemaVersion1、classificationSystem精确、tier属于SABC、schoolId对应**该版本**可信Master且tier一致、createdVersion可信。未来校名改变不动ID，验证历史归类不能拿未来Master重新解释；必要时建立分类版本清单。无字段、空值、不合法、schoolId/tier矛盾或系统未知→UNKNOWN；不随机、不补造、不用校名/pot/team/重跑seed恢复。当前schoolTier不同于birth不是矛盾，升学正当不同。既取得true永远保留。

資格policy输出ELIGIBLE/NOT_ELIGIBLE/UNKNOWN，与取得handler分开。可信JP_SABC birth C＋retirement reachedTop＋!traits.smallschool才true；可信S/A/B为NOT_ELIGIBLE新C称号。保留纪念名称「弱小校の星」、能力追加效果无、退休列表/PNG名称。

CODE：reachedTop=(CPBL tier i0)||!!stats.NPB||!!stats.MLB，包含NPB育成／二军bucket，不自行收紧；KBO自身不满足，不能顺便加。新校C不是出生立即发特性、不是每年发。**重新核对发现endGame开头只写done=true，没有return guard**；重复资格发放依赖!traits.smallschool。之前调查把done称guard过于宽泛，本设计不依赖该说法、不顺便改退休幂等逻辑。需测试重复调用是否称号单次，并将原其他退休副作用独立记录。

## 8. 舊資料與版本策略

已有traits.smallschool=true：维持，只读显示不再取得。可信LEGACY_T123 hsTier3：保留弱旅語义而非转C；本设计不批准白名单，也不retroactive发称号。只有schoolTier且来源不明／升学后、只有无来源hsTier、冲突字段或缺失birth→UNKNOWN。只有可信旧未退休生涯是否继续按旧資格是待决定，暂不启用兼容取得，不能把「保留語义」偷换为「补发」。

现行没有途中存档恢复机制，不能宣布完整存档迁移；相容对象主要是内存S、测试fixture及封存分析资料。legacy资料不批量重写、不重新跑旧seed填缺欄。

推荐用未来正式VERSION＋出生classificationSystem/schema说明新规则，不在URL加rv/rules、不保持旧引擎或双兼容。任何未来C实施是功能扩展，通常MINOR（最终按第9章批准），本设计阶段不改1.11.9或CHANGELOG。createdVersion不预定未经批准的数字。

相同seed在新版本学校可能变化；初始化ab/pot与potSum0、原SAB Master及直接R前缀须维持。学校变化导致大会是否举行、点数、后续职业路线不同，可自然改变整个生涯R总数。**保持抽选两次R不等于保持全人生R次数**；不能通过多抽／丢R／强造旧结果凑相同总数。退休fan picks已有smallschool条件加候选，可能影响抽选次数／结果，需单独批准和trace。此轮只分析，未取得后续实际R差分。

## 9. 合法差分与未来验收（DESIGNED_NOT_RUN）

未来必须事先批准的允许差分：高校tier/ID/name，新增birth块，受新类别/补正影响的大会参与/结果/点数、后续状态/路径/R trace，smallschool退休取得与由此的退休文字／fan picks。禁止排除整个S，逐个解释首次分歧与下游因果。不应改变：初始化ab/pot/potSum0、两段选校R的位置／次数、同tier候选顺序、原50校、非C公式与非高校规则、其他特性条件、grinder门槛、现行分享seed-only与显示生命期。

测试设计：

1. 静态Master：60唯一ID／name、旧50逐字与顺序一致、20/22/8/10 counts、候选地域仅文档；未知tier必须显式策略而非else误当C。
2. 纯抽选边界：A 26/27/71/72/89/90/99、B24/25/69/70/89/90/99；第二R0及接近1均有合法school，不跳空group；每C校理论1%，不用实测频率冒充必然。
3. 新角色P/C/IF/OF自然初始化前后：ab/pot/potSum0逐值与R前缀相同、birth复制选中record，snapshot不额外R；不人工注入高能力称自然。
4. 正常U升學、draft失败fallback、CORP/IND/PRO、advance：birth不变，schoolTier可变化；不得读取U tier判C。
5. 明示retirement fixture：C＋CPBL i0、NPB二军bucket、MLB正例；C仅KBO／无gate反例；S/A/B反例；true缺birth保持；未知schema／空／矛盾UNKNOWN；注入fixture不是自然生涯取得證据。
6. 可信旧T123/3、未知hsTier3、仅schoolTier、双字段冲突与已取得true；无自动B→3或3→C，无补birth／再生成seed。
7. 重复退休称号卡/flag单次、不额外奖励；其他原退休非幂等行为另报告，不顺改。
8. 固定P/IF完整人生同版重播S、操作、全部R一致；跨版首分歧与允许差分链；同tier样本直接R前缀／高校过程一致。新Seed策略与预算须另批准，不启动大研究。
9. grinder P237/238、IF469/470、missing/已取得fixture与potSum0保存回归；miraclegen／国内大会、UI特性取得/归档/列表、年度log、退休总结、PNG回归。
10. 1280／320／390长新校名、获得说明、列表、PNG截圖；Console/404及原分享操作；手机模拟不替代实机。旧年度log没有取得年也不补造。

未来实现属于L3：相关单元、Quick、Full与批准固定P/野手S/R比较；只設計階段全为DESIGNED_NOT_RUN。本轮未执行任何新C游戏逻辑、自然生涯或模拟勝率。

## 10. 重现與未確認

现行数据统计可在只读Node解析JP_DATA后分别计算highSchools.length、tier histogram与Set(ID/name)。地域人为按上述ID区间归类，再用§5加权式。概率差异用整数0..99逐项比较旧函数x<30?S:x<80?A:B，与A x<27?S:x<72?A:x<90?B:C／B x<25?S:x<70?A:x<90?B:C；条件胜率枚举r=-8..8用§6公式。这些只枚举输入，不执行游戏主R或简化自然生涯。没有推估称号百分比；理论机会是0.10×P(reachedTop|C)（后者未知）。

未確認：新校名實際碰撞、地区映射官方性、C自然大会/职业/TJ/获奖/殿堂收益、历史白名单、全人生R保持是否可能（分支变化已说明不能保证）。相关事项及批准状态见[决策记录](../reviews/TRAIT_SMALLSCHOOL_C_DECISION_LOG.md)。

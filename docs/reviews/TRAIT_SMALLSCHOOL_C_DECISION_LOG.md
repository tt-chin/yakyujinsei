# TRAIT-SMALLSCHOOL-C 决策记录

## 1.12.0合併提交批准（2026-10-13）

正式版本1.12.0 MINOR已APPROVED，COPY-001～005與C級高校一併commit至dev；不包含D2／其他研究，不反映main或本番。createdVersion取新版VERSION；未啟用舊版本相容白名單。下列版本待批准／禁止commit敘述是當時歷史界線，由本節最新明示批准覆蓋；測試歷史件數不變，提交前新版驗證另記於實作驗收。

## 後續正式授權（2026-10-13）

使用者附件正式指令將C-04十校、C-05方案B、C-07高校C1−4、C-09快照、C-10可信C／UNKNOWN、C-11保留持有不啟用legacy、C-13可追溯差異、C-14先驗收列APPROVED。本地已實作；仍未批准正式版本號／提交／部署。以下原PROPOSAL表為設計階段歷史紀錄；本補足明確覆蓋A/C0推薦，未採C2。

VERSION識別處理：不以1.11.9推斷舊高校類別；必須另有JP_SABC/schema1/可信ID與tier一致。新工廠快照createdVersion用現有VERSION，不虛構版本；缺快照舊S UNKNOWN。發布前MINOR正式版本仍待決。[實作驗收](TRAIT_SMALLSCHOOL_C_IMPLEMENTATION_ACCEPTANCE.md)。

2026-10-13；dev 0fd13c7532fd03da136c72ef64e9890858cfb81e／1.11.9；仅设计。详细候选与依据见[设计](../designs/TRAIT_SMALLSCHOOL_C_TIER_DESIGN.md)。授权来源tasks/select.md B1，不视为允许C实现。

|ID|状态|决策／证据／下一步|
|---|---|---|
|C-01|APPROVED|保留现行50校SAB；新增10 C级弱小校方向。不能删改旧ID/name/order。|
|C-02|APPROVED|新版称号资格来源为出生C，与目前学校分开；保持退休时机、名称、纪念无加成、reachedTop。|
|C-03|APPROVED|B不等于旧3；既取得true保持；不造旧人生或自动补发。|
|C-04|PROPOSAL|HS_051～060及设计10名称／地域，旧Master只有3字段，region先存设计；名称碰撞UNVERIFIED。待批准名单。|
|C-05|PROPOSAL|优先A27/45/18/10，非C比例保留30/50/20；B25/45/20/10保B但更减S。21%／25%同抽值改分类是100槽枚举，不是实测人生率。|
|C-06|PROPOSAL|C0明确HS C=−2，沿用B大会效应、不改ab/pot。推荐先此最小方案；弱小是叙事／资格区别，不能声称明显更弱的數值。|
|C-07|PROPOSAL|如须数值较弱，C1研究HS C=−4、不影响其他stage；须批准与边界／自然路线验证。不是旧−6。|
|C-08|BLOCKER|C2 ab/pot负补正会改potSum0/grinder，与不改出生能力要求冲突；只列对照，禁止实现。|
|C-09|PROPOSAL|birthHighSchool schema1／JP_SABC／schoolId/tier/createdVersion；只copy首次结果，write-once，不额外R。精确字段与非法policy待批准。|
|C-10|PROPOSAL|可信新SABC：C资格、SAB否；缺失/矛盾UNKNOWN。当前schoolTier与birth不同属正常升学，不算冲突。已true优先。|
|C-11|UNVERIFIED|旧LEGACY_T123来源白名单未证明；不可因hsTier3独立值或version粗标签启用转换／取得。待定旧未退休可信S是否维持旧资格；本轮不实现。|
|C-12|PROPOSAL|未来VERSION标记新规则、schema标记分类，不加URL rv/rules、不启用旧引擎；MINOR候选，实际版本号待批准。|
|C-13|BLOCKER|B8若被理解为全人生R次数恒定，与改变学校→大会分支／fan picks可能冲突；未来必须批准允许下游R差分。本轮只分析，未作改变。|
|C-14|PROPOSAL|未来相关单元、Quick/Full、P/野手完整S/R回归和三尺寸；全部DESIGNED_NOT_RUN。先批准差分與采样策略，不能为尾部率自动大样本。|

## 本轮完成与保持

只新增两份本文／设计文件，现行Master50校统计与ID唯一性、tier接点、抽选100槽、条件大会概率及地域加权已离线核算；没有実行C产品状态、fixture或自然人生，没有PASS新功能。保留A的game.js与ability-view.js未提交文案修改及COPY验收文件，D2/其他研究/tasks未改。

需使用者依序决定：10校名称/ID/地域→A或B概率→C0或C1（C2不推荐且冲突）→快照schema和unknown policy→旧未退休可信数据策略／白名单（可继续禁用）→新版本与跨版Seed允许差分→未来实现及L3预算。此次APPROVED只有方向，不将候选改成批准。

没有修改VERSION、CHANGELOG、CURRENT_SPEC、BACKLOG checkbox、main、92事件、A文案、grinder或特性条件；没有commit/push/merge/deploy。TRAIT-SMALLSCHOOL-SEMANTICS-01不结案；不开始C高校实现。

# 投手獎項D2技術定案候選書

## 1. Executive Summary

2026-10-14；DESIGN_FINALIZATION_ONLY / ANALYSIS_ONLY。
**整份候選實作方案 PROPOSED / NOT APPROVED；不存在產品實作授權，不解除任何正式BLOCKER。**
基準dev `7220ad82002801d3dea5fedae80d0fb3d7a0433f`，VERSION1.12.0。只新增本文件，正式D2/規格/工具/結果保持。

三模組推薦：
- TR-B01：同步UTF-8長度分段FNV1a32＋avalanche、u32/2^32與未取整binary64比較；13候選golden向量附完整bytes/期望，仍需批准與跨瀏覽器測試。
- TR-B02/03：S實例私有年度交易、逐原R槽journal、逐副作用receipt與付款→描畫→選項→推年的分離checkpoint；不全clone/rollback、不重跑whole proSeason。
- TR-B04：精確year/league/name→穩定ID的只讀adapter，效果集合分離，保留舊最優秀投手專用ID、原honors和已付契約；六個漏判對應修正需另授權。

標記：EXISTING_APPROVED=正式D2已批政策；VERIFIED_EXISTING=原碼/既有驗證；PROPOSED=本候選；APPROVAL_REQUIRED=須使用者批准；DEFERRED=本期可延後。每節方案/表格由其標記管轄，沒有把已批政策與新技術混作APPROVED。

只讀來源：[AGENTS](../../AGENTS.md)、[CURRENT_SPEC](../../CURRENT_SPEC.md)、[正式D2](PITCHER_AWARDS_PHASE1_DESIGN_D2.md)、[決策紀錄](PITCHER_AWARDS_D2_DECISION_LOG.md)、[整合驗證](../reviews/PITCHER_AWARDS_D2_TECHNICAL_VALIDATION.md)及[results](../reviews/pitcher-awards-d2-technical-validation/results.json)、[日文漏判驗證](../reviews/AWARD_JP_NAME_LIMITED_VALIDATION.md)及[results](../reviews/award-jp-name-validation/results.json)。
VERIFIED_EXISTING：原生正常結算防重有效、VAL-A04/06直接重入awards重抽重記、A07付款後繪圖例外可能無續行；這是受控fault/reentry證據，非自然UI完整路線。VAL-B模型非產品交易。
EXISTING_APPROVED：P01四league B線、P04 NPB12/KBO10與B曲線、P08 W13/IP143/ERA3.20/IP180/S3/B2/G95、P07實得同年同league三冠必MVP與P08保護範圍全部不重設。

## 2. 正式D2風險ID對照

以下原定義完全沿D2 §14.9，不採用過去任务附件不同編號：

|正式ID|唯一正式定義|本候選章節|狀態|
|---|---|---|---|
|TR-B01|hash編碼/算法與精度/向量正式審查|§3–4|PROPOSED / APPROVAL_REQUIRED|
|TR-B02|逐slot journal、多欄位effect receipt原子邊界|§5、§8|PROPOSED / APPROVAL_REQUIRED|
|TR-B03|phaseEnd上下游恢復/失敗續行證據|§6、§8|PROPOSED / APPROVAL_REQUIRED|
|TR-B04|完整ID adapter避免漏薪資/HOF/保護/重付|§7–8|PROPOSED / APPROVAL_REQUIRED|
|TR-B05|產品實作授權|§10、§12|NOT AUTHORIZED；不得自行解除|

VAL-A→TR-B03及TR-B02；VAL-B→TR-B02並交叉TR-B03/04；VAL-C→TR-B01並交叉TR-B02防重。既有日文BUG各自保留ID，不併成P08未來缺陷。

## 3. TR-B01方案比較（PROPOSED / NOT APPROVED）

|候選|決定性／平台|主R|複雜度／風險|版本|
|---|---|---|---|---|
|H1 推薦：FNV1a32＋固定avalanche|UTF8/imul/unsigned定義完整，Node已雙算相同；Chromium/Safari待測|純函式0R，不讀rngState|同步最少接入；32bit可能碰撞，非密碼/不可證獨立|不含PATCH，ruleId變才改key；舊decision不重抽|
|H2：SHA-256 UTF8輸入、取前4byte big-endian|標準算法，各平台接口不同，需向量|0主R|Web Crypto async擴大重入窗口；同步實現需額外程式與審查；最終取32bit仍有32bit碰撞|同上；換算法必更換編碼domain/version，不偷偷重新解释舊decision|

H2可取53bit降低粒度/碰撞，但比較與規格更複雜，屬另外APPROVAL_REQUIRED。H1不是從驗證DESIGN_GAP自動升級為已批；是本輪使用者要求的候選算法，待審後才可以實作。
hash碰撞≠journal鍵碰撞：journal使用完整canonical identity，不用hash32當唯一ID。不同award/year分開key不保證概率統計獨立；P07概率乘積仍只是研究假設。

## 4. H1 hash／編碼／精度／候選golden vectors

### 4.1 canonical identity（PROPOSED / APPROVAL_REQUIRED）

欄位固定六個，**順序不得交換**：
1. domain=ASCII `pitcher-award-v1`，對應key schemaVersion1。
2. seed=當次人生實際初始化SEED字串，與S.seed一致，非目前URL欄/姓名/team。
3. year=安全整數1～9999的最短ASCII十進位字串，不含＋、前零、小數/locale；上下界是技術候選，不是遊戲年度政策。
4. league=CPBL/KBO/NPB/MLB（大小寫固定）；不拆セ/パ/AL/NL，MiLB不假裝一軍award。
5. awardId=正式D2 PITCH_WINS/PITCH_WIN_PCT/PITCH_SAWAMURA；其他legacy/dERIVED不使用新獨立抽選。
6. ruleId=registry的固定規則識別：P01 `p01-b-v1`；P04 `p04-b-npb12-v1`；P08 `p08-ip180-s3-b2-g95-v1`。這些名稱PROPOSED，不含MAJOR/MINOR/PATCH或球團；NPB/KBO差異由league及規則registry判定。

EXISTING_APPROVED：原SEED/year/league/awardId/ruleId獨立鍵、PATCH不改抽選。VERIFIED_EXISTING：日本版game.js:2702正規化 `[...raw.normalize('NFKC').trim().replace(/[\\u0000-\\u001f\\u007f-\\u009f]/g,'')].slice(0,24).join('')`；只在初始化做，空時原遊戲生成seed。
PROPOSED：新award函式消費已初始化非空SEED，不重做正規化、不從歷史SEED/姓名補造、不再生成R；key入口確認合法string且對應初始化context。不呼叫Date/crypto/Math.random/R。不一致或缺失→INVALID_AWARD_CONTEXT、無新抽選、停止該新決策，先診斷，不吞既有槽。

player canonical：**現行單球員人生**用(實際SEED、固定single-player-v1語義)識別，single-player為架構約定，不額外放入六欄byte串；不同S實例的交易用WeakMap分離，同seed重播則有同結果。這不保證未来多人同seed獨立。新增持久playerId/把第七欄放key會改全部向量，屬DEFERRED＋APPROVAL_REQUIRED，不在本期默加UUID或保存欄位。

每欄轉TextEncoder UTF-8，不加BOM；先四byte unsigned big-endian byteLength，再bytes；六段串接，不加分隔、終止符或JSON文字，不用UTF16 length。最大技術輸入長度1024byte，超出/未知award/rule/domain、非canonical year、非法league拒新draw。TextEncoder对孤立surrogate按U+FFFD编码，與現行UTF8 FNV語義一致；不偷偷修改原URL/SEED字串。其與字面U+FFFD的等價編碼需列固定負/等價案例，不把所有不同JS字串保證不同hash。

schemaVersion1只描述bytes/journal格式，不表policy；ruleId描述該賞概率/資格配置，與產品PATCH獨立。配置真變另批准新ruleId，已DECIDED按原記錄resume，不用新版p/u覆蓋。新hash格式若變domain另版本，不能用新schema重算過去。

### 4.2 完整H1常數與獨立重算（PROPOSED）

FNV offset=0x811C9DC5、prime=0x01000193；每byte XOR後imul截32bit。avalanche固定shift16/13/16、multipliers0x85EBCA6B與0xC2B2AE35；最後>>>0，u=hashUnsigned/4294967296，區間[0,1)。不做低位取模百分比、不串接hash主R。

以下是**文件內候選參考碼**，不是產品JS；Node可將區塊複製到暫時REPL獨立重算，不import引擎，不需新增套件或永久工具：

```js
function canonicalBytes(fields) {
  const out = [];
  for (const value of fields) {
    const b = new TextEncoder().encode(value);
    const n = b.length;
    out.push((n >>> 24) & 255, (n >>> 16) & 255,
             (n >>> 8) & 255, n & 255, ...b);
  }
  return Uint8Array.from(out);
}
function proposedH1(bytes) {
  let h = 0x811c9dc5;
  for (const b of bytes) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
// Independent unsigned/modulo-2^32 reference, not shared imul implementation:
function bigintReference(bytes) {
  const mask = 0xffffffffn;
  let h = 0x811c9dc5n;
  for (const b of bytes) h = ((h ^ BigInt(b)) * 0x01000193n) & mask;
  h ^= h >> 16n; h = (h * 0x85ebca6bn) & mask;
  h ^= h >> 13n; h = (h * 0xc2b2ae35n) & mask;
  h ^= h >> 16n;
  return Number(h & mask);
}
function decodeHex(hex) {
  return Uint8Array.from(hex.match(/../g), s => parseInt(s, 16));
}
// For any GV row: imulHash === bigintReference === stated decimal hash;
// u === hash / 4294967296. Rebuild canonicalBytes from six fields too.
```

### 4.3 13候選向量（全PROPOSED / NOT APPROVED）

Node24.15.0中實際離線計算，13組Math.imul與BigInt相同；不執行任何正式RNG/生涯/產品工具、不寫附屬JS/JSON。不是Chromium/Safari PASS。每列hex是完整canonical bytes（不是seed bytes），u欄是JS round-trip表示，精確值一律hash/2^32。

|ID|raw seed → 初始化SEED|year／league／awardId／ruleId|hash unsigned decimal／hex|u|
|---|---|---|---|---|
|GV01|"tob0ilu0" → "tob0ilu0"|2035／NPB／PITCH_WINS／p01-b-v1|3691479232／dc0780c0|0.8594894856214523|
|GV02|"q77bi1jx" → "q77bi1jx"|2035／NPB／PITCH_WINS／p01-b-v1|1177117069／4629618d|0.27406892483122647|
|GV03|"投手あ😀" → "投手あ😀"|2035／NPB／PITCH_WINS／p01-b-v1|2810048397／a77def8d|0.6542653769720346|
|GV04|"ＡＢＣ" → "ABC"|2035／NPB／PITCH_WINS／p01-b-v1|3749864514／df826442|0.873083368409425|
|GV05|"/?seed=x&y#\|:" → "/?seed=x&y#\|:"|2035／NPB／PITCH_WINS／p01-b-v1|1739197629／67aa0cbd|0.40493850340135396|
|GV06|"tob0ilu0" → "tob0ilu0"|2036／NPB／PITCH_WINS／p01-b-v1|2360889063／8cb84ee7|0.5496873201336712|
|GV07|"tob0ilu0" → "tob0ilu0"|2035／KBO／PITCH_WINS／p01-b-v1|1118905353／42b12409|0.2605154535267502|
|GV08|"tob0ilu0" → "tob0ilu0"|2035／CPBL／PITCH_WINS／p01-b-v1|4210553061／faf7f0e5|0.980345779331401|
|GV09|"tob0ilu0" → "tob0ilu0"|2035／MLB／PITCH_WINS／p01-b-v1|1009399991／3c2a38b7|0.2350192496087402|
|GV10|"tob0ilu0" → "tob0ilu0"|2035／NPB／PITCH_WIN_PCT／p04-b-npb12-v1|487180188／1d09c79c|0.11343047674745321|
|GV11|"tob0ilu0" → "tob0ilu0"|2035／NPB／PITCH_SAWAMURA／p08-ip180-s3-b2-g95-v1|3230212375／c0892117|0.7520924264099449|
|GV12|"123456789012345678901234" → "123456789012345678901234"|1／NPB／PITCH_WINS／p01-b-v1|1093217683／41292d93|0.254534576786682|
|GV13|"é" → "é"|9999／NPB／PITCH_WINS／p01-b-v1|3275941899／c342e80b|0.76273966091685|

完整canonical bytes：
- GV01：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV02：`00000010706974636865722d61776172642d7631000000087137376269316a780000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV03：`00000010706974636865722d61776172642d76310000000de68a95e6898be38182f09f98800000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV04：`00000010706974636865722d61776172642d7631000000034142430000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV05：`00000010706974636865722d61776172642d76310000000d2f3f736565643d782679237c3a0000000432303335000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV06：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303336000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV07：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034b424f0000000a50495443485f57494e53000000087030312d622d7631`
- GV08：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000044350424c0000000a50495443485f57494e53000000087030312d622d7631`
- GV09：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034d4c420000000a50495443485f57494e53000000087030312d622d7631`
- GV10：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034e50420000000d50495443485f57494e5f5043540000000e7030342d622d6e706231322d7631`
- GV11：`00000010706974636865722d61776172642d763100000008746f6230696c75300000000432303335000000034e50420000000e50495443485f534157414d555241000000167030382d69703138302d73332d62322d6739352d7631`
- GV12：`00000010706974636865722d61776172642d7631000000183132333435363738393031323334353637383930313233340000000131000000034e50420000000a50495443485f57494e53000000087030312d622d7631`
- GV13：`00000010706974636865722d61776172642d763100000002c3a90000000439393939000000034e50420000000a50495443485f57494e53000000087030312d622d7631`

GV03含emoji（UTF8四byte）、GV04全形NFKC、GV05包含URL/分隔符但只作seed、GV06換年、GV07～09換league、GV10/11換award、GV12最大24字符/最小候選year1、GV13合成字é/最大候選year9999；兩邊界年是向量，不是自然球季。
另外PLANNED / NOT_RUN：空/非string SEED、NaN/Infinity/非整數year、未知league/rule/award、超byte長度、孤立surrogate等價、字段顺序错、相同输入反向計算順序、跨Node/Chromium/Safari逐byte/hash/u結果。無合法key時沒有bytes/hash/u，不捏造0當拒絕結果，不能將非法資料0機率與合法u=0混為一談。

### 4.4 精度政策（PROPOSED / APPROVAL_REQUIRED）

推薦計算pPercent/score使用未取整binary64與固定運算順序，无epsilon、无显示丸め；資格先行，p=0拒/p=100保證，中段 `(hash/2**32)*100 < pPercent`，相等不获，從key純計算結果，不抽主R。新賞0/100可不算hash，decision drawSource=DETERMINISTIC_0/100、hash=null；**legacy chance100照抽，不刪既有主R**。

P01 W非負finite safe integer；P04 W/L同條件且W+L>0，推薦sum也safe integer否则INVALID_STAT（這個極端拒絕策略需批准）；WP=W/(W+L)，不先toFixed。P08G/W/L/IP/SO/ERA沿已批有限非負/G>0/W13/IP143/ERA≤3.20/W+L>0，不擅加新的自然資格；使用獎項當下原st.era/IP，原十進位IP，不從ER回算覆蓋era，不轉outs。component依已批錨點clamp，加權固定W→ERA→IP→SO→WP順序(.25/.30/.25/.15/.05)；score不預先四捨五入再判60/95。

EXISTING_APPROVED：P01 b前0、b起20/g起100；P04 .65起20/.85起100；P08 score60起10/95起100及cap95，保留跳點。
候選產品精度验收：P04 12/6可能24.999999999999982%，保留内部raw；P08 59.999/60/60.001及94.999/95/95.001；u=0、最大uint32/2^32、相等、非法資料不得進新draw；Node/Chromium/Safari exact vector，数學近似assert不得拿當資格容差。32bit概率粒度最大約1/2^32；不保證連續模型完全无離散偏差。替代BigInt有理P04、ppm整數化需另批准，不能一邊自稱無丸め一邊轉基點。

## 5. TR-B02 Journal／Receipt schema（全PROPOSED / APPROVAL_REQUIRED）

### 5.1 Identity／Decision

私有 `WeakMap<S, Map<year+frozenLeague, AnnualTx>>`；只把完成的獎項decision歷史置於擬定S.awardDecisions供下游證據，**不是永久存檔或localStorage**。S identity確保過期callback不跨新人生；交易键保留全字段，不用32bit hash唯一索引。
decisionKey = canonical六欄bytes的完整hex；legacy slot用domain另值＋S/year/frozenLeague/slotId/固定legacyRule，P07用DERIVED鍵；joint MVP只一個語義id，不因draw＋guarantee建兩份。

```text
AnnualTx {
 schemaVersion:1, stateIdentity:S, year, leagueKey, frozenLevel, frozenRole,
 seedAtBirth, ruleRegistrySnapshot, statsSnapshot, eligibilitySnapshot,
 phase, slots:[SlotRecord...], decisions:Map<fullKey,Decision>,
 receipts:Map<effectKey,EffectReceipt>, renderReceipts, choiceReceipts,
 continuation:{fromYear,targetYear,choiceToken,status}, diagnostics
}
SlotRecord {
 slotId, eligible, pPercent, status: PREPARED|RECORDED|AMBIGUOUS,
 rngBefore, u, rngAfter, awarded
}
Decision {
 schemaVersion:1, keySchemaVersion:1, year, leagueKey, awardId, ruleId,
 level, role, eligibility, reasonCodes, metrics, pPercent,
 drawSource, drawKey?, hash32?, u?, legacySlotId?,
 awarded, decisionStatus: DECIDED, sources:[...]
}
```

Prepare前驗registry/語義/各new stat與journal可寫，冻结必要input（非clone全部S）。按原legacy资格與顺序预建立固定plain writable slot records，未資格記SKIPPED不耗R；AS副作用也独立receipt。
原順序AS→rookie→P02(oldERA)→P05→P06→P03→原MVP；P02沿該槽bool，不另抽舊賞/P02；保持原公式/短路与所有旧100%R。所有legacy槽先記，再新P01/P04/P08固定key；之後從實得集合衍生P07、合併MVP sources。新P07不抽，原MVP不合資格沒有slot不能補R，但P07保证仍可补同一筆MVP。

```text
captureLegacySlot(slot):
 if RECORDED: return saved result
 ensure plain validated S and preallocated journal slot
 slot.rngBefore = currentNativeRState
 u = nativeR()                      # exactly original one call
 slot.u = u; slot.rngAfter = currentNativeRState
 slot.awarded = u*100 < frozenP
 slot.status = RECORDED             # no render/await/callback in this region
 supportedFaultHook("after-slot-record")  # only now may injected UI/test fault run
```

**有限原子承諾，不宣稱萬能**：正常plain S字段与预allocated record同步写無外部调用，不改nativeR算法、不回滾R。支援fault點是记录完成之後；人工插throw在nativeR與RECORDED間、OOM、proxy/getter/host crash屬不支援gap。若捕獲gap且slot不能證明結果→AMBIGUOUS_RNG，停止/診斷，不重抽、不猜u或从当前_rng重建。這個支持邊界須批准且native測試；原R合法已耗不回滾。
過去honors無journal不表示未抽：可靠已结算标记→HISTORICAL_READ_ONLY、不draw/補trait；未知→UNKNOWN_HISTORY停止該歷史交易。未結算新年度正常建tx；没有schema不无条件重算当年。

### 5.2 Effect Receipt

effectKey=完整player-instance/年度/league/語義effect；一般賞的honors keyed award，但同年MVP來源合併、phoenix為生涯shared once gate（不能按每個P08各＋8），年度降格護欄是decision派生不累計counter。

```text
EffectReceipt {
 schemaVersion:1, effectId, decisionKeys, commitContext,
 status: PLANNED|COMMITTED|CONFLICT,
 writes:[{path,before,after,status:PLANNED|WRITTEN}],
 resultSnapshot, committedYear
}
```

prepare合法结果及所有next values，先保存receipt，實際提交不调用card/board/外部handler；当前值=before则写after、=after确认已写，其他值→CONFLICT停止，不覆盖其他合法变化。不是最后一个applied代表全部完成；plain多写同步提交支持已知边界，receipt保存证据，即使可識別部分after也不泛化所有array/物件对象深相等恢复。集合/contract要保存明确全结果及identities，不能用任意JSON等價强覆蓋。
phoenix准备资格glass&&!phoenix与可信當年eligibility→四類write：glass=false、removed去重原標籤、phoenix=true、pool=before+8。presentation缓存清理及UI在state提交后。不同奖共用该gate，后季已phoenix不再＋8；若再次glass原规则保持，不产生新永久免伤。

责任边界：
- honors/history/AS/traits：各独立receipt，final同义year/league/ID恰一笔；旧honors不删除重写。
- 薪資評價：最终honors之后原同年upsert/近3季政策，记录結果receipt；不重复增加历史条。
- 固定薪资/出来高：沿signed annualSchedule/contractId/year及yearlyIncentivePaid，以各原生政策準備after contract、careerBaseSalary/careerIncentive/careerEarnings值再同步commit；不在award直接加现金、不突破上限、不遡改既成保障。历史paid而沒有before/after收入证据不可推造漏付。
- HOF：dedup语义输入给原score/aceN/king/tier的純衍生消费，不在每次獲獎increment殿堂分；没有独立付款receipt。
- 降格：当前award決策派生boolean（本年度），不用永久protect旗標；movement/state侧效果另continuation receipt。P08同年保護按已批context，不扩大FA/退休免責。
- receipt完成后render失败只重绘saved result；任何receipt conflict不进入下一年、不强制ROLLBACK。

## 6. TR-B03 年度續行狀態機（PROPOSED / APPROVAL_REQUIRED）

VERIFIED_EXISTING：phaseMid→proSeason生成/累計→awards→salaryEvaluation→TJ/交易/國際→nextStep→phaseEnd付款→配分/movement→advance→startYear。**awards不在phaseEnd**，不能從付款重入再重跑前面的proSeason。
最小新增状态：AWARD_PREPARED→DRAW_RECORDED→AWARD_EFFECTS_COMMITTED→SEASON_PAYMENT_COMMITTED→RESULT_RENDERED→WAIT_ALLOCATION/WAIT_CHOICE→CHOICE_COMMITTED→YEAR_HANDOFF_COMMITTED。成績已存在的snapshot/log只凍結/續讀，不重新simSeason或accStat。

|情境|checkpoint与恢复（候选）|允许与停止边界|
|---|---|---|
|正常年度|原顺序，各stage完成才推进；原合法R在原时点|正常例不额外抽R|
|同年重入|按tx/state/year读完成stage；付款receipt只一次|不因context存在就全return而漏下一步|
|抽選后中断|RECORDED以上读saved result续effect|主R-record gap不安全则AMBIGUOUS停止|
|效果后中断|effect receipt確認结果，只续render/下一effect|pool/contract等并行不明→CONFLICT停止|
|支付后UI失敗（VAL-A07）|PAYMENT_COMMITTED保留，重render結算卡后才发布原进路|不能第二次markSalaryPaid、不能因paid guard吞續行|
|選項尚未接受重入|WAIT_choice重复只取现有效session，不重新清pool/建listener|DOM消失仅render同一choice规格，不执行action|
|接受選項|S identity/year/generation/session校验，action对应单次receipt；新choice保持|当前现有runChoiceAction/alloc session要保留，不能仅禁用按钮当交易|
|年已推进|记录fromYear/targetYear与HANDOFF状态，旧年度callbackstale；若S.year=target不再advance|startYear/phasePre内部已部分耗R、无细checkpoint时不得重跑，NEXT_YEAR_AMBIGUOUS停|

pool转交alloc也需要receipt保存原p/骰序/session id，第一次S.pool=0與payloadp成對；重入不再取0代替原p、重新振骰或執行allocDone。allocation保持原能力成本/Undo/reset/特性规则。

advance候選：在调用原advance前写完整fromYear/targetYear/age/stageYr计划，成功后記handoff。故障後確認S是否仍from→允许一次advance，已target→绝不再increment；若next startYear已部分执行，不能仅S.year变化推断已完成開季。最小本期支持付款/奖提交后的UI失敗及尚未接受選項；开季内部任意异常不自动重试，显式停止。支援全部phasePre/TJ/交易的任意failure须另扩大journal范围批准，不能以本任务名義大重構。
禁止把phaseEnd.PRO seasonEndContext提前置为「所有完成」；可保留支付guard但轉到stage-aware恢复。CORP已有paid/complete/running復用不退化；IND既有guard不擅改。本候選精確變更點與正常S/R對照須產品實作驗收後才算完成。

範圍：
- VERIFIED_EXISTING／现行需保护：同年付款/奖效应/配分與年份单次，card失败不重付；受控風險已有證據。
- PROPOSED／D2接前必须：旧R记录、new decisions与效果、finalMVP、支付後续行及choice/advancehandoff。
- DEFERRED：跨頁/reload/processcrash恢复，因为没有career存檔；不新增localStorage保存、自动存档或旧engine。可支持同頁同S证据，不承诺重整后恢复。

## 7. TR-B04 獎項ID adapter矩陣（PROPOSED接入、政策依標記）

### 7.1 Source/consumer責任與完整registry候選

VERIFIED_EXISTING來源：
[game.js](../src/engine/game.js):1355–1474 producers与phoenix；1603/1619movement、3132覆寫仍委派LEGACY；620buildCareerViewModel→[player-detail](../src/ui/player-detail.js):10–11 achievements；2226–2259引退honors分組、2388后共享画像；2037守備legend文字、2043tier/HOF；[trait-policy](../src/engine/trait-policy.js):55–75MVP/打者三冠；[salary-evaluation](../src/engine/salary-evaluation-policy.js):56–66、[salary-promotion](../src/engine/salary-promotion-policy.js):110–122；[HOF](../src/engine/hall-of-fame-policy.js):15–68；[incentive](../src/engine/incentive-policy.js):10–34。
不對未知detailed UI文件猜path；player-detail與game现消费者是实际证据。现成就没有structured awardId、P01/P04/P07/P08没有producer，deferred trait标签不表示已發奖。

記号：MAJOR=.75市場/2fallback/460 aceN、star保底；DEPT=.35/1/160 king/reg保底；MVP=.75/2/420 mvp/star保底；FULL沿当前contract年度max，不是每赏累加奖金。P07自身0但其MVP正常待遇。表中P-ID与待遇EXISTING_APPROVED，其他新legacy/support ID是PROPOSED；现行producer/alias文字VERIFIED_EXISTING。

|稳定ID|日文完整名／兼容alias|league/level/role与现producer|薪資／HOF／incentive／traits/UI责任|
|---|---|---|---|
|LEGACY_BEST_PITCHER|最優秀投手賞；最佳投手仅可信旧中文alias候选|四一軍SP，game1386现产；D2未来停止新发|旧MAJOR/FULL；需补现复活/降格漏判；原历史名字显示，不等P02/P08|
|PITCH_WINS P01|最多勝利投手賞；不得当勝投王新保护alias|四一軍P；NOT_IMPLEMENTED|DEPT/FULL；三冠组成；现無獎不是Bug|
|PITCH_ERA P02|最優秀防御率投手賞；**不alias最優秀投手賞**|四一軍SP，未来替原ERAproducer原R结果|DEPT/FULL，不继承旧大賞分或复活资格；三冠组成|
|PITCH_STRIKEOUTS P03|最多三振奪取投手賞；旧最多奪三振只读alias|四一軍P，现game1405旧名|DEPT/FULL；同义一次消费；三冠组成；保留old字符串|
|PITCH_WIN_PCT P04|勝率第一位投手賞|NPB/KBO一軍P；NOT_IMPLEMENTED|DEPT/FULL；不參與三冠，不新增保护|
|PITCH_SAVES P05|最多セーブ投手賞；旧最多セーブ|四一軍CL，game1395现旧名|DEPT/FULL，原機率不變，不自動抗降格|
|PITCH_RELIEF P06|最優秀中継ぎ投手賞；旧最優秀中継ぎ|四一軍MR，game1400现旧名|DEPT/FULL，HLD简化，不造HP/reliefWins|
|PITCH_TRIPLE_CROWN P07|投手三冠王|四同年同league实际P01/02/03；NOT_IMPLEMENTED|自身score0/no独立奖金；history/pitcherTC一次，MVP合并|
|PITCH_SAWAMURA P08|沢村賞；不与legacy合并；澤村仅历史中文且需确认来源|NPB1/SP；NOT_IMPLEMENTED|MAJOR/FULL，已批phoenix+年度保护；不autoMVP|
|MVP（support ID提案）|年間MVP；年度MVP仅可信历史alias|四一軍，game1458原抽選／未来P07保証同语义|MVP/FULL；oldghost/strongpitch/hit等原資格，phoenix/降格原有效|
|ROOKIE（support提案）|新人王|四一軍原资格game1381|市场.25/fallback无/HOF140；現incentive不因新人王直接FULL，仍按原payD评估；原復活/降格，有yips原处理|
|BATTING_AVG（support提案）|首位打者；打擊王可信旧alias|四一軍打者，game1413|DEPT/FULL；hitterTC组成；复活/降格漏判修正候选|
|BATTING_HR（support提案）|本塁打王；ホームラン王是incentive现别名；全壘打王旧alias候选|四一軍打者，game1418|DEPT/FULL；hitterTC；复活漏判、降格现有效|
|BATTING_RBI／SB／OBP（support提案）|打点王／盗塁王／最高出塁率|四一軍打者，game1423/1428/1434|原DEPT/FULL/现降格王命中（OBP不命中王）；RBI三冠；不新增复活|
|GOLD_GLOVE（support提案）|ゴールデングラブ賞；金手套可信旧alias候选|四一軍原守備资格game1440|市场.25/fallback1/HOF300 king/FULL；无复活、降格漏判候选|
|DEFENSE_BEST（support提案）|年間最優秀守備選手|四一軍，game1444|市场.25/fallback1/HOF220 king/FULL；原无phoenix/名称降格命中，不新增|
|ALL_STAR（support提案）|オールスターゲーム；精确附註(ファン投票選出)|四一軍game1375|无市场/fallback/FULL；HOF70P/40打者；不新增复活/降格，不被任意MVP/王字样误套|
|HITTER_TC（support提案）|打撃三冠王|原trait-policy精确同年同league三項|原MVP保证流程/traits保留，不偷改既有王保護；非新投手奖|

支持原冠军/国际/业余荣誉：交还各既有policy、不给P-ID/個人赏映射、不使用「文字含優勝」猜获奖；国际MVP可能旧regex命中保护，未经批准不可删原效果。registry是限定個人奖范围，不全面改跨模块国际/团队制度。NOT_IN_SCOPE（可信的其他已知模块荣誉）与UNKNOWN（無法確定身份的個人赏文字）必须区分；UNKNOWN依D2只显示不猜奖分/效果。若全面替换旧regex将改变未知历史旧行为，必须经AF08审批或缩小接入范围，不能暗中用substring fallback重新猜ID。

### 7.2 两种效果集合分开（现行为VERIFIED_EXISTING；修正为PROPOSED / APPROVAL_REQUIRED）

|ID语义|现phoenix资格|候选phoenix|现年度降格资格|候选年度降格|
|---|---|---|---|---|
|MVP|是|保持|是|保持|
|ROOKIE|是|保持|是|保持|
|LEGACY_BEST_PITCHER|中文别名可、日文漏|补日文|日文漏|补日文|
|BATTING_AVG|日文漏|补首位打者|日文漏|补首位打者|
|BATTING_HR|日文漏|补本塁打王|是（王）|保持精确ID|
|GOLD_GLOVE|非資格|不新增|日文漏|补ゴールデングラブ賞|
|ALL_STAR|非資格|排除|非资格|排除|
|P08|无producer|已批准glass&&!phoenix条件下生涯一次＋8|无producer|已批准获奖当年度movement保護|
|P01/P02/P03/P04/P05/P06|现或新正式名不命中上述big|不普遍新增|部門名称不自动保护|不普遍新增|
|其他已知范围外原荣誉／UNKNOWN历史|已知按原scope判定；UNKNOWN不推断|不普遍新增，UNKNOWN只读|已知按原scope判定|已知国际/团队等交还原模块；UNKNOWN个人赏只读不猜效果，整体legacy行为改变需AF08批准|

phoenix集合不是所有department/MAJOR统一category。MVP與P08同季只有一份生涯effect；yips的任意本年荣誉解除原规则不缩到phoenix集合。新P08派生保护不變永久、不免续约/退休/FA。
历史lastyear个人賞不当currentyear；candidate adapter解析year与league，但**限定现有Bug修正不顺便改变旧MVP/王跨league当年作用**。新P08按D2 frozen获奖league/本年context，不扩到别league永久护栏。若要求旧保护一律只当前league，属APPROVAL_REQUIRED，不能从精确解析暗中变行为。

### 7.3 精确解析／去重（PROPOSED / APPROVAL_REQUIRED）

structured trusted Decision优先，确认schema/recognized ID/year/league/rule完整；honors解析 `^([0-9]{4}) ([knownLeagueLabel])([exactAwardNameOrAlias])$`，最长已知league label先匹配，leagueNPB/KBO/台湾プロ野球/メジャーリーグ，exactAllStar附注单独规则。不以「王」、MVP substring或startswith year猜id，不把球队名反推league；旧无year/未知名保留原字符串、read-only unknown标记。新canonical year1～9999与现honors常规4位年需要adapter确认：新展示year按原String(year)，候选key低于1000向量只是数学测试，不从未来未知UI历史猜身份。
同player/year/league/awardId语义去重consumer，保留全部原honors原文及來源，不global replace/删字串。legacy最佳投手与新P02/P08不同ID；P03正式/旧名同义只能计分一次。unknown历史不补奖、不补phoenix+8、不产生receipt已付推测；只显示并沿未改的范围外旧consumer处理。
已paid contract/schedule/career收入不可回溯改；当期可信未完成tx才可继续未commit效果，不能因adapter突然认出过去P08/旧大赏就重算。可靠旧结算不重抽；未知是否已完成→HISTORICAL_UNKNOWN，不自动迁移待遇。
UI卡/成就/引退/PNG用displayName与originalText分离：新发按正式日文名，历史按原字符串；需保留原顺序/正常折行、取得说明时机，不用重建S.honors去统一语言。

## 8. 故障注入與回歸驗收（全部PLANNED / NOT_RUN）

共同产品前置：合法原生S/contract/year、冻结输入、真实调用链/无强制改变能力；fault注入与自然路线分清。成功需逐checkpoint的S/R/receipt/实际choice/body，不只是没有throw。下面对既有证据逐案转换（K=full decision identity，E=effect identity，原R合法耗后不回滚）。

|验收ID／來源|初始／故障点|预期Journal/Receipt与S/R|重试／允许恢复／不安全处置|
|---|---|---|---|
|F-A04 ← VAL-A04|原MVP native slot记录后，年間賞render fault；glass/未phoenix/pool7|slotRECORDED；MVP一个；effects完成后pool15、glassfalse/phoenixtrue，或待effect可单次续；旧R数不再加|从checkpoint完成剩余effect/render，不再awards全重跑；若slotgap未知停止|
|F-A06 ← VAL-A06|同年旧ERA已decision+honor，再入|读取同K bool，honor一个、R增0；P02切名未来同oldslot|journal已知可resume；仅历史honor无可信tx不补抽|
|F-A07 ← VAL-A07|合法base/incentive已付，结算card故障|付款receipt与paid schedule一致、总10.35m不变、R只原champ1|重绘后确实提供配分/movement一次，不因为paid/context直接return；不安全收入差STOP|
|F-B01|首次legacy/native或新hashdecision|完整K记录一次；old有资格耗1，new主R0|DECIDED才允许effects|
|F-B02|重复同year/player/award|同K/no第二R、同outcome|读取旧journal|
|F-B03|draw完成、effect前故障|DECIDED、receiptPLANNED、S效果未变|只补本E一次，不重新draw|
|F-B04|E COMMITTED后重入|glass/pool/honor/收入保持、R0额外|只render未完成项|
|F-B05|supported after-slot record中断|记录u/p/before/after/R状态、phase可辨|从下个slot起；人为在R-recordgap throw则AMBIGUOUS禁止自动续|
|F-B06|同年P01/02/03多赏|各K/oldslot不同，但MVP/phoenix sharedreceipt|各decision独立不重复effect|
|F-B07|同賞翌年|新K合法、旧K不覆盖，已phoenix不＋8|新年正常，不拿旧年decision套新年|
|F-B08|不同S/league/player模型键|S WeakMap隔离、freeze league、fullK distinct|同seed重播结果同；多人同seed独立抽选本期DEFERRED|
|F-B09|可靠已结算history/无journal|只读，old honors/name/salary不改、draw0|UNKNOWN state不猜，不能把模型fixture settled当自动产品推断|
|F-B10|P07三实得＋原MVP true/false/no slot|MVP sources合并、honor/traits/奖金一次；oldslot如有照抽|不从基本成績代替実得；不补主R|
|F-B11|P08真得＋glass/未phoenix、同MVP/以后再P08|P08与MVP独立decision、一个生涯phoenixreceipt，pool+8一次|未得/已phoenix/GoldGlove/AllStar不新增复活；保護期限原樣|
|F-B12|effect任一步write后done前故障；并行改变pool100|保存before/after每步，只识别相符partial；重试pool15不是23|可识别partial可续，其他合法写入冲突→CONFLICT停止，不能覆盖100强行绿|
|F-YEAR|WAITchoice、accept、advance增年后startYear中断|选择一次、fromYear→targetYear一次、旧callbackstale|若nextPre部分R未知，NEXT_YEAR_AMBIGUOUS停止，不再advance或全startYear重跑|
|F-GV|13候选向量＋invalid/平台/顺序|canonical bytes/hash/u exact；seed/主R不写|Node/Chromium/Safari均需真实PASS；算法未批不称产品通过|

六个现漏判完整producer→ID→consumer验收：
- F-ID01：原日文最優秀投手→LEGACY_BEST_PITCHER→phoenix；glass true/false gate、pool7→15一次。
- F-ID02：原首位打者→BATTING_AVG→phoenix；同年仅本赏排除MVP掩盖。
- F-ID03：原本塁打王→BATTING_HR→phoenix；只补映射、不提高得奖机率。
- F-ID04：最優秀投手→legacy→movement；ovr<min/poorReal与goodReal双fixture、原active overlay。
- F-ID05：首位打者→AVG→movement，必须不靠「王」。
- F-ID06：ゴールデングラブ→GOLD_GLOVE→movement；不因此新增phoenix。
其餘F-ID07～12（PLANNED / NOT_RUN）：MVP/新人王/本塁打王正常保护、GoldGlove/AllStar区别/附注、历史old不映P02、P08独立ID、同名跨年/league精確消费、market/fallback/incentive/HOF/trait/UI全adapter对照。原HOF300/460/160等按既定政策；P07自身0/MVP正常、original renderer不裁/不R。
回归：P通常/省エネ/全力及IF固定Seed、原slot逐值/顺序与數、same新版2次S/choice/R、实际合同保障/支払不回溯、旧honors兼容、PC1280/320/390。修名将少跑降格chance55、glass取消及pool变化可改变后续S/R，**需先批准因果差范围**；其他直接R/公式/候选顺序变化不得放寬。Quick/Full/Preview只在未来产品授权后。

## 9. 跨模組一致性審查

|检查|候选约束／当前状态|
|---|---|
|Journal与RNG key|new Decision.fullKey是同六段canonical bytes hex；S身份另隔离tx，不把hash32当ID|
|ID贯通|registry ID→Decision→honor rendering→receipt→salary/HOF/input；legacy old独立不歧义|
|原主R|原槽顺序冻结，包括原MVP资格/100R；新三奖不读R/_s/rngState|
|P07/MVP|实得集合派生，旧draw来源与guarantee合一，不额外抽/奖/付|
|P08效果|glass&&!phoenix gate、+8生涯一次、当年movement，不新增永久/合同/退休保护|
|年度重入|stage/slot/effect/payment/choice/advance各凭证，不能一个completed遮所有|
|修名下游|改变合法效果及降格短路可能产生因果R差；须独立授权，不保证wholecareer旧新版相同|
|持久化|不需要生涯保存支持限定同页面故障；跨reload恢复DEFERRED，不承诺任意crash|
|未批准策略|hash/version/schema/精度/support ID/unknown fallback、wholeleague白名单、恢复范围均列§10|
|剩余缺口|任意R-recordgap/并行状态/next phasePre中断无自动恢复保证；需fail-closed与用户确认，不用假设解除BLOCKER|

## 10. APPROVAL_REQUIRED 決策清單

|候选决策|批准内容／不得默选|正式风险|
|---|---|---|
|AF01|H1全部常数、六字段/byteLength/域/UTF8 surrogate语义及13golden；或选H2另向量|TR-B01|
|AF02|binary64固定顺序、严格比较、无epsilon、0/100 new直判、P04 unsafe sum拒绝及无效context处理|TR-B01|
|AF03|ruleId/schema/key version分离、single-player隐式identity、年1..9999技术界限；不加UUID/save|TR-B01/02/04|
|AF04|私有年度tx+可见完成decision schema、原槽preallocation、仅支持记录完成后fault、ambiguous fail-closed|TR-B02|
|AF05|receipt多字段before/after/identity、phoenix/奖效应共享gate、已paid无证据不补付|TR-B02/03|
|AF06|phaseEnd支付/结果/choice/handoff分离；明确不自动恢复pre下一年任意部分fail|TR-B03|
|AF07|support IDs/精确alias/consumer adapter、六个日文漏判最小修正与正常因果S/R容许范围|TR-B04及两现行Bug|
|AF08|旧unknown/范围外消费保持fallback还是另行改变；是否限制旧当年跨league保護（默认不改）|TR-B04|
|AF09|实际产品工程范围/版本分类/提交/验证授权；本文件不授予|TR-B05|

P01/P04曲线/线、P02/03/05/06原概率/角色、P07 guaranteeMVP、P08S3/B2及资格/待遇**EXISTING_APPROVED，不重新表决**。六个老日文Bug虽原生复现，修复授权不自动来自本次技术候选书。

## 11. DEFERRED項目

跨reload持久恢复/完整存档、多player sameSeed ID、HP/GS/reliefWins、子league、排名NPC、完整自然顶尖平衡采样、所有任意host异常/phasePre/TJ流程交易化。未知旧历史效果不猜补。
Chromium/Safari向量与产品故障/回归**是未来必验，不是可永久延后**；本轮只文书而NOT_RUN。完整proxy/OOM/host终止恢复不在保证内，若产品要求必须另设计，不靠receipt暗示已满足。

## 12. 建議最小實作批次（PROPOSED，不開始）

1. AF01～03批准→纯key/hash/precision/ID registry與固定向量，Node/Chromium/Safari验收；不先接奖。
2. AF04～06批准→原槽journal、局部effect/payment/续行receipt与可失败fixture，先证明F-A04/A06/A07/F-B12支持范围，正常旧slot不变。
3. AF07/08批准→分开精确修复现有日文漏判及adapter consumers，既存保障/honors保持，对照批准因果S/R；不混随机调参。
4. 另AF09产品授权→原P02新名部門待遇、P01/04/08固定draw、P07/MVP/保護接入（顺序只影响提交，不改变old Rslots），完整F与RNG/状态/PC/mobile。
5. 确定代码L3 Quick/Full/Preview，用户審查后才讨论main/本番。只要有关键FAIL/BLOCKED，不能以模型PASS结案。

批准后**有机会解决设计缺口**：TR-B01的算法/编码/精度與向量定义、TR-B02的支持边界/schema、TR-B04的明确适配策略。
仍要产品Runtime才能解除：旧slots实际零新增R、effect/payment任意支持fault恢复、真实选择/advance、全面adapter薪资/HOF/保护、六个漏判的修后FAIL→PASS。TR-B03不能只凭候选状态机解除；TR-B05只能另明确授权，文书批准不够。

## 13. 修改範圍與保全證據

只新增本文件。执行前695个既有文件hash保留，包含AGENTS/CURRENT_SPEC/D2/两验证报告/两results及未提交设计/工具/研究；HEAD/main/branch/VERSION未动。同名文件开始不存在。向量在一次Node内存命令计算＋独立BigInt复核，不创建或修改任何JS/JSON或产品；没有运行旧验证器/重写原results、无CI/模拟/部署/Commit/Push/Merge。
最终检查：695个旧文件hash全部相同（含两个原results与正式D2），无移除/新增其他路径；唯一新增本文件，HEAD/main不变。13个GV从文件内hex解码并用文内Math.imul/BigInt双参考重算、再从六字段重新编码全部一致；15个本地引用有效、13个主章节与5种状态标记检查PASS；git diff --check exit0（新增untracked文书另查内容/引用）。未跑产品测试/Quick/Full/CI；查UI consumer时发现career-view.js并不存在，未引用或创建该文件，使用真实player-detail/game消费者。全部向量仍候选，不称跨平台或产品PASS。交付即停止，等待审查。


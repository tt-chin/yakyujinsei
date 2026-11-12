import {incomeSummary} from './income-summary.js';
import {formatRehabStatus} from './condition-view-model.js';
import {tjGaugeCap} from './condition-view-model.js';
import {contractTypeLabel} from './contract-labels.js';
import {removedTraitLabel} from '../engine/trait-policy.js';
import {slgOf} from './stat-format.js';

// Read-only player/career view models for navigation, the desktop overview (OOP plan §2g) and the scoreboard (§2ff).
// The career state is read on every call through getState, so a new career (S reassigned) is seen at once.
// Method bodies are the former game.js build*ViewModel and boardModel bodies; game.js helpers and labels are injected.
// statLine is the former game.js statLine body (OOP plan §2rr); slgOf comes from stat-format.js.
export class CareerPresenter {
  #getState;#deps;
  constructor({getState,labels:{ABL,POS_AB,POSN,DPN},TEAM_COLOR,fmtMoney,fmtIP,displayTrait,teamNick,roleN,playerType,ovr,tjCap=()=>tjGaugeCap(getState())}){
    this.#getState=getState;this.#deps={ABL,POS_AB,POSN,DPN,TEAM_COLOR,fmtMoney,fmtIP,displayTrait,teamNick,roleN,playerType,ovr,tjCap};
  }
  #statSummary(bucket,st){const S=this.#getState(),{fmtIP}=this.#deps;if(!st)return '';if(S.pos==='P')return `登板 ${st.G||0}｜投球回 ${fmtIP(st.IP||0)}｜${st.W||0}勝${st.L||0}敗｜奪三振 ${st.SO||0}`;const pa=st.PA||0,ab=st.AB||0,avg=ab?(st.H||0)/ab:0;return `出場 ${st.G||0}｜打席 ${pa}｜打率 ${avg.toFixed(3).replace(/^0/,'')}｜本塁打 ${st.HR||0}｜打点 ${st.RBI||0}`;}
  record(){const S=this.#getState();const definitions=[['NPB',[['NPB1','NPB一軍'],['NPB2','NPB二軍'],['NPB_DEV','NPB育成']]],['KBO',[['KBO1','KBO一軍'],['KBO2','KBOフューチャース']]],['台湾プロ野球',[['CPBL1','台湾プロ野球一軍'],['CPBL2','台湾プロ野球二軍']]],['MLB',[['MLB','MLB']]],['MiLB',[['A3','3A'],['A2','2A'],['A1','1A'],['R','ルーキーリーグ']]],['独立リーグ',[['IND','独立リーグ']]],['社会人野球',[['CORP','社会人野球']]]];const byLevel=S.statsByLevel||{};const groups=definitions.map(([label,levels])=>Object.freeze({label,levels:levels.filter(([key])=>byLevel[key]).map(([key,levelLabel])=>Object.freeze({key,label:levelLabel,summary:this.#statSummary(key,byLevel[key])}))})).filter(group=>group.levels.length);return Object.freeze({seasons:Array.isArray(S.log)?S.log.length:0,internationalCount:S.intlCount||0,groups});}
  #rehabStatusText(){const S=this.#getState();return formatRehabStatus(S);}
  ability(){const S=this.#getState(),{ABL,POS_AB,POSN}=this.#deps;const condition=[{label:'シーズン稼働率',value:`${Math.round((S.seasonFactor??1)*100)}%`},{label:'次回故障リスク加算',value:`${S.injNext||0}%`},{label:'今季一時故障リスク加算',value:`${S.tmpInj||0}%`},{label:'大きな故障（通算）',value:`${S.bigInj||0}回`},{label:'リハビリ',value:this.#rehabStatusText()}];if(S.pos==='P')condition.push({label:'TJゲージ',value:`${Number(S.tj||0).toFixed(1)} / ${this.#deps.tjCap()}`},{label:'トミー・ジョン手術（通算）',value:`${S.tjCount||0}回`});return Object.freeze({positionLabel:POSN[S.pos],abilities:POS_AB[S.pos].map(key=>Object.freeze({key,label:ABL[key],current:S.ab[key]||0,potential:S.pot?.[key]??62})),condition:condition.map(item=>Object.freeze(item))});}
  traits(){const S=this.#getState(),{displayTrait,teamNick}=this.#deps;return Object.freeze({active:Object.entries(S.traits||{}).filter(([,enabled])=>enabled).map(([key])=>displayTrait(key)),removed:(S.removed||[]).map(item=>removedTraitLabel(item,S,teamNick))});}
  board(phase){const S=this.#getState(),{DPN,POSN,TEAM_COLOR,roleN,playerType,ovr}=this.#deps;
    const nameHtml=`${S.name}<small>${S.dpos?DPN[S.dpos]:POSN[S.pos]}${S.role?'·'+roleN(S.role):''}·${playerType()}${S.traits.genius?' ★':''}</small>`;
    let t;
    if(S.stage==='HS')t=S.team+'（高'+['一','二','三'][S.stageYr-1]+'）';
    else if(S.stage==='U')t=S.team+'（大'+['一','二','三','四'][S.stageYr-1]+'）';
    else if((S.stage==='CORP'||S.stage==='IND'))t=S.team+'（アマチュア）';
    else t=S.teamName();
    let teamHtml;
    { const tc = (S.orgTeamId && TEAM_COLOR[S.orgTeamId]) || 'var(--amber)';
      /* 白色か判定し、白背景に白文字となるのを防ぐ。 */
      const isWhite = (tc.toLowerCase() === '#ffffff' || tc.toLowerCase() === '#fff');
      
      /* プロ入り済みで球団色が設定されている場合、白背景ラベルを適用。 */
      const isProColored = (S.stage === 'PRO' && TEAM_COLOR[S.orgTeamId]);
      /* 見た目は base.css の .team-name／.team-badge／.team-badge-dot。白色球団は is-white で黒字・灰色の点。 */
      const white = isWhite ? ' is-white' : '';
      const color = isWhite ? '' : ` style="--team-color:${tc}"`;
      
      const dot = isProColored ? `<span class="team-badge-dot${white}"${color}></span>` : '';
      
      teamHtml = dot + (isProColored ? `<span class="team-name team-badge${white}"${color}>${t}</span>` : `<span class="team-name">${t}</span>`); }
    const age=S.age, year=S.year;
    const ovrValue=ovr(), clearTj=S.pos==='P', salaryText=Math.round((S.currentSalary||0)/10000).toLocaleString();
    return {nameHtml,teamHtml,age,year,ovr:ovrValue,clearTj,salaryText,phase};
  }
  statLine(st){const S=this.#getState(),{fmtIP,roleN}=this.#deps;
    if(S.pos==='P'){ const role=roleN(S.role); const relief=(S.role==='CL'&&st.SV)?`｜${st.SV}セーブ`:(S.role==='MR'&&st.HLD)?`｜${st.HLD}ホールド`:''; return `出場 ${st.G}｜投球回 ${fmtIP(st.IP)}｜${st.W}勝${st.L}敗${relief}｜奪三振 ${st.SO}｜四球 ${st.BB||0}｜ERA ${st.era.toFixed(2)}｜WHIP ${(st.WHIP||0).toFixed(2)}`; }
    const obpN=st.PA>0?(st.H+st.BB)/st.PA:0;
    const slgN=slgOf(st);
    const obp=st.PA>0?obpN.toFixed(3).replace(/^0/,''):'-';
    const slg=st.AB>0?slgN.toFixed(3).replace(/^0/,''):'-';
    const ops=st.AB>0?(obpN+slgN).toFixed(3).replace(/^0/,''):'-';
    return `出場 ${st.G}｜打席 ${st.PA}｜打率 ${st.avg.toFixed(3).replace(/^0/,'')}｜出塁率 ${obp}｜長打率 ${slg}｜OPS ${ops}｜安打 ${st.H}｜本塁打 ${st.HR}｜打点 ${st.RBI}｜四球 ${st.BB}｜盗塁 ${st.SB}${st.DEF!==undefined?`｜守備 ${st.DEF>0?'+':''}${st.DEF}`:''}`;
  }
  player(){return Object.freeze({ability:this.ability(),traits:this.traits()});}
  career(){const S=this.#getState(),{fmtMoney}=this.#deps;const ct=S.ct||null,contractDescription=ct?`${ct.startYear||S.year}～${ct.endYear||S.year}年　${contractTypeLabel(ct.contractType)}`:'契約なし';const schedule=Array.isArray(ct?.annualSchedule)&&ct.annualSchedule.length?ct.annualSchedule.map(row=>`${row.year}年 ${fmtMoney(row.amount||0)}${row.paid?'（支払済み）':''}`):['—'];const history=(S.salaryDecisionHistory||[]).map(row=>`${row.salaryYear||row.decisionYear||'—'}年 ${fmtMoney(row.finalSalary||0)}`);return Object.freeze({stats:this.record(),achievements:[...(S.honors||[])],contract:Object.freeze({description:contractDescription,remainingYears:ct?`${ct.remainingYears||0}年`:'—',guaranteedTotal:ct?fmtMoney(ct.guaranteedTotal||0):'—',schedule,currentSalary:fmtMoney(S.currentSalary||0),signingBonus:fmtMoney(S.careerSigningBonus||0),developmentStipend:fmtMoney(S.careerDevelopmentStipend||0),postingFee:ct?.postingFee>0?fmtMoney(ct.postingFee)+'（球団への支払い・生涯収入対象外）':undefined,outsideIncome:fmtMoney(S.careerOutsideIncome||0),yearOutsideIncome:fmtMoney(S.yearOutsideIncome||0),corpIncome:fmtMoney(S.corpIncome||0),incomeLedger:(S.incomeLedger||[]).map(row=>row.year+'年 '+fmtMoney(row.amountYen)),careerEarnings:fmtMoney(S.careerEarnings||0),incomeRows:Object.freeze(incomeSummary(S).map(row=>Object.freeze({key:row.key,label:row.label,value:fmtMoney(row.amount)}))),history}),yearly:(S.log||[]).map(row=>Object.freeze({year:row.y,age:row.age,team:row.tm,summary:row.line||''}))});}
}

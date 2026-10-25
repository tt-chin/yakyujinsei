// Defense position meeting after each season (OOP plan §2r).
// The career state is read through getState (LV through getLevels, declared after the game.js construction site);
// game.js helpers are injected as late-binding lambdas. reviewDefensePosition is the former game.js dposReview body;
// the deferred option closures read getState() live.
export class DefensePositionReview {
  #deps;
  constructor({getState,getLevels,DPN,DP_RANK,DP_MULT,dpBar,dpQual,dpList,pitcherRole,roleN,choose,card}){
    this.#deps={getState,getLevels,DPN,DP_RANK,DP_MULT,dpBar,dpQual,dpList,pitcherRole,roleN,choose,card};
  }
  review(cont){reviewDefensePosition(this.#deps,cont);}
}

function reviewDefensePosition({getState,getLevels,DPN,DP_RANK,DP_MULT,dpBar,dpQual,dpList,pitcherRole,roleN,choose,card},cont){
  const S=getState(),LV=getLevels();
  if(S.stage!=='PRO'||!(S.lv==='CPBL1'||S.lv==='NPB1'||S.lv==='MLB')){ cont(); return; }
  if(S.pos==='C'){ /* 捕手の基準には余裕を持たせるが、基準を大きく下回れば一塁またはDHへ回す。 */
    if(!S.dpos)S.dpos='C';
    const cOk=()=>{ const bar=dpBar(), a=S.ab;
      return a.fld>=bar-6 && a.cat>=bar-4 && a.arm>=bar-2; };
    if(S.dpos==='C'){
      if(cOk()){ cont(); return; }
      const opts=[];
      if(dpQual('1B'))opts.push({t:'一塁手へコンバート',main:true,s:'年俸係数 ×1.00',
        f:()=>{getState().dpos='1B';card('info','守備位置の変更','捕手用具をロッカーにしまった――新シーズンから<b class="hl">一塁手</b>へコンバート。');cont();}});
      opts.push({t:'指名打者へ転向',main:!opts.length,s:'年俸係数 ×0.92',
        f:()=>{getState().dpos='DH';card('info','守備位置の変更','盗塁阻止率がリーグの笑いものに。球団は打撃に専念させることを決めた――<b class="hl">DH</b>。');cont();}});
      choose(`守備位置会議：首脳陣はもう捕手を任せられないと判断（${LV[S.lv].n}基準）`,opts); return;
    }
    if(cOk()){ /* 守備力が戻れば捕手へ再転向できる。 */
      choose('守備位置会議：ブルペン捕手から「また捕れるようになった」と報告',[
        {t:'捕手へ再転向',main:true,s:'年俸係数 ×1.12',
         f:()=>{getState().dpos='C';card('good','守備位置の変更','マスクを再びかぶる――新シーズンから<b class="hl">捕手</b>として再登録。');cont();}},
        {t:'現状維持',f:()=>cont()}]); return; }
    if(S.dpos==='1B'&&!dpQual('1B')){ S.dpos='DH';
      card('info','守備位置の変更','一塁すら守れなくなり、新シーズンは<b class="hl">指名打者</b>として登録。'); }
    cont(); return; }
  if(S.pos==='P'){ /* スタミナで投手起用を決める。セーブから先発への転向はプレイヤー同意制、先発からセーブは自動。 */
    const nr=pitcherRole(), old=S.role;
    if((old==='MR'||old==='CL')&&nr==='SP'){
      /* セーブ投手が先発基準のスタミナへ到達した場合、球団が転向を打診するが強制しない。 */
      choose('球団から打診：スタミナは先発水準に達した。先発へ転向する？',[
        {t:'先発へ転向し、ローテを担う',main:true,f:()=>{ getState().role='SP';
          card('info','起用法の変更',`先発転向を受諾。新シーズンからローテーションの一角を担う――<b class="hl">先発</b>。`); cont(); }},
        {t:'ブルペンに残り、自分の役割を守る',s:roleN(old)+'として現状維持',f:()=>{ getState().role=old;
          card('info','ブルペンに残る',`首脳陣の提案を断った――いつでも待機し、チームが最も必要とするときに火消しで登板する。`); cont(); }}]);
      return;
    }
    S.role=nr;
    if(old&&old!==nr){
      card('info','起用法の変更',`シーズン終了後の評価を受け、新シーズンは<b class="hl">${roleN(nr)}</b>として起用される。`); }
    else if(!old){
      card('info','投手の起用法',`首脳陣がスタミナを評価し、<b class="hl">${roleN(nr)}</b>として登録した。`); }
    cont(); return;
  }
  const q=dpList();
  if(!S.dpos){ S.dpos=q[0];
    card('info','守備位置登録',`首脳陣が守備能力を評価し、<b class="hl">${DPN[S.dpos]}</b>として登録した。`); cont(); return; }
  if(dpQual(S.dpos)){
    const best=q[0];
    if(DP_RANK[best]<DP_RANK[S.dpos]){ /* より市試合価値の高い守備位置を守れるようになった。 */
      choose(`守備位置会議：首脳陣は、より負担の大きいポジションを任せたいようだ`,[
        {t:`${DPN[best]}へコンバート`,main:true,s:`年俸係数×${(DP_MULT[best]||1).toFixed(2)}`,
         f:()=>{getState().dpos=best;card('good','守備位置の変更',`守備データを踏まえ、新シーズンから<b class="hl">${DPN[best]}</b>へコンバートすることが決まった。`);cont();}},
        {t:`${DPN[S.dpos]}に残る`,f:()=>cont()}]); return; }
    cont(); return; }
  const opts=q.slice(0,2).map((p,i)=>({t:`${DPN[p]}へコンバート`,main:i===0,
    s:p==='DH'?'守備陣の居場所がない｜年俸係数×0.92':`年俸係数×${(DP_MULT[p]||1).toFixed(2)}`,
    f:()=>{ getState().dpos=p; card('info','守備位置の変更',`球団のシーズン終了後評価により、新シーズンから<b class="hl">${DPN[p]}</b>へコンバート。`); cont(); }}));
  choose(`守備位置会議：首脳陣は、${DPN[S.dpos]}を守るのはもう厳しいと判断（${LV[S.lv].n}基準）`,opts);
}

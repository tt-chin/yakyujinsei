// Season stat simulation and accumulation (OOP plan §2h, §2i).
// The career state is read on every call through getState; RNG draws go through the injected lambdas, so game.js's
// current R (including test overrides) is used. Method bodies are the former game.js bodies; game.js helpers are injected.
export class SeasonStats {
  #getState;#deps;#rng;
  constructor({getState,levels,rng:{R,N0,chance,ri},clamp,isSP,pitcherRole,checkGoldclothSeason}){
    this.#getState=getState;this.#deps={LV:levels,clamp,isSP,pitcherRole,checkGoldclothSeason};this.#rng={R,N0,chance,ri};
  }
  blankStat(){return {yr:0,G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,AS:0,DEF:0};}
  simSeason(lv){
    const S=this.#getState(),{LV,clamp,isSP,pitcherRole}=this.#deps,{R,N0,chance,ri}=this.#rng;
    if(S.pos==='P'&&!S.role)S.role=pitcherRole();
    const L=LV[lv], par=L.par, a=S.ab, f=S.seasonFactor;
    const st={G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,IP:0,SO:0,ER:0,avg:0,era:0,d:0};
    if(f<=0) return st;
    if(S.pos==='P'){
      const q=(a.vel+a.ctl+a.brk)/3, d=q-par; st.d=d;
      /* 投球内容が良ければ規定の投球回を与え、悪ければ野手と同様に登板機会を減らす。 */
      let perfF=clamp(0.80+d*0.028,0.42,1.12);
      if(S.traits.favorite)perfF=Math.max(perfF,.85);
      if(isSP()){
        const gs=Math.round(clamp(20+(a.sta-40)*0.18,10,30)*f*perfF*(0.94+R()*0.08));
        st.G=Math.max(1,gs);
        /* 先発1試合当たり投球回は平均約5.0、好投手5.2～6.0、イニングイーター6.1～6.5。総合評価dで決め、制球難なら少し減らす。 */
        const ipg=clamp(5.0+d*0.05+(a.sta-50)*0.012+(a.ctl-par)*0.006+N0(0.12),4.8,6.5);
        st.IP=+(st.G*ipg).toFixed(1);
      }else{
        st.G=Math.max(1,Math.round(clamp(45+(Math.min(a.sta,60)-40)*0.3,25,68)*f*perfF*(0.94+R()*0.08))); /* 高スタミナ後援：登板数への寄与sta60を上限、先発並みの投球量にはしない。 */
        st.IP=+(st.G*1.05).toFixed(1);
      }
      st.era=clamp(4.32-d*0.17+N0(0.35),1.40,9.90);
      st.ER=Math.round(st.era*st.IP/9);
      const k9=clamp(6.2+(a.vel-par)*0.11+(a.brk-par)*0.06+N0(0.5),3.5,13.5);
      st.SO=Math.round(st.IP/9*k9);
      /* 四球率は制球、被安打は総合評価dで決め、WHIPは（H+BB）÷IPで算出。 */
      const bb9=clamp(4.6-(a.ctl-par)*0.13+N0(0.4),1.2,7.5);
      st.BB=Math.round(st.IP/9*bb9);
      const h9=clamp(9.2-d*0.16+N0(0.5),5.0,13.5);
      st.H=Math.round(st.IP/9*h9);
      st.WHIP=st.IP>0?+((st.H+st.BB)/st.IP).toFixed(2):0;
      if(isSP()){
        const dec=Math.round(st.G*0.72), wp=clamp(0.50+d*0.014+N0(0.05),0.15,0.85);
        st.W=Math.round(dec*wp); st.L=dec-st.W;
      }else if(S.role==='CL'){
        /* クローザーのセーブ数は登板数を基準にし、総合評価dで成功率を変える。SVはG以下、1試合最大1セーブ。 */
        const svRate=clamp(0.55+d*0.02,0.35,0.82);            /* セーブ轉化率：35%~82%。 */
        st.SV=Math.min(st.G, Math.round(st.G*svRate));         /* 登板数を超えない。 */
        st.HLD=Math.min(Math.max(0,st.G-st.SV), Math.round(st.G*0.12)); /* 非セーブ登板的セットアッパー。 */
        const dec=Math.max(1,Math.round(st.G*0.14)); st.W=Math.round(dec*clamp(0.45+d*0.02,0.3,0.7)); st.L=Math.max(0,dec-st.W);
      }else{ /* セットアッパーのホールド数は登板数を基準に算出。 */
        const hldRate=clamp(0.45+d*0.02,0.25,0.72);
        st.HLD=Math.min(st.G, Math.round(st.G*hldRate));       /* 登板数を超えない。 */
        st.SV=Math.min(Math.max(0,st.G-st.HLD), chance(25)?ri(1,5):0);
        const dec=Math.max(1,Math.round(st.G*0.14)); st.W=Math.round(dec*clamp(0.5+d*0.015,0.35,0.7)); st.L=Math.max(0,dec-st.W);
      }
      /* 1試合につき投手結果は一つ。セーブ率は85%以下、勝敗・セーブ・ホールドの合計は登板数以下に制限。 */
      if(!isSP()){
        st.SV=Math.min(st.SV||0, Math.floor(st.G*0.85));
        st.HLD=Math.min(st.HLD||0, Math.max(0,st.G-st.SV));
        const decCap=Math.max(0,st.G-st.SV-st.HLD);
        if((st.W+st.L)>decCap){ st.W=Math.min(st.W,decCap); st.L=Math.max(0,decCap-st.W); }
      }
    }else{
      const q=a.con*0.5+a.pow*0.2+a.eye*0.18+a.spd*0.12, d=q-par-0.5; st.d=d; /* powを追加(長打力を総合力へ反映);-0.5 補正、全体分布と旧版に合わせる。 */
      /* 出試合機会：スタミナで上限を設定、成績(d)で実際の出試合量を決める。 */
      /* スタミナ係数は50以上でほぼフル出試合、45～50は標準、40は少なめ、35は代打程度。 */
      let staF;
      if(a.sta>=55)staF=1.0; else if(a.sta>=50)staF=0.90+(a.sta-50)*0.02;
      else if(a.sta>=45)staF=0.72+(a.sta-45)*0.036; else if(a.sta>=40)staF=0.52+(a.sta-40)*0.04;
      else if(a.sta>=35)staF=0.35+(a.sta-35)*0.034; else staF=Math.max(0.15,0.35-(35-a.sta)*0.03);
      /* B. スター級打者(d>=10)だが守備を続けるスタミナがない(staF<0.75) → 当該シーズンはDHへ転向、打撃に専念、staF 下限を0.9へ引き上げる。 */
      let dhThisYear=false;
      if(d>=10 && staF<0.75 && S.dpos!=='DH' && S.dpos!=='C'){
        staF=Math.max(staF,0.9); dhThisYear=true;
      }
      /* 好成績なら十分な打席を与え、総合評価dが0未満なら出試合機会をさらに減らす。 */
      const perfF=clamp(0.82+d*0.03,0.45,1.12);
      st.G=Math.min(L.g, Math.round(L.g*Math.max(clamp(staF*perfF,0.10,1.0),S.traits.favorite?.85:0)*f*(0.95+R()*0.06))); /* 上限=リーグ試合数、できない超える。 */
      st.PA=Math.round(st.G*4.25);
      st._dh=dhThisYear; /* accStatでDH出試合年を記録するために使用。 */
      st.BB=Math.round(st.PA*clamp(0.062+(a.eye-par)*0.0034,0.045,0.17));
      st.AB=st.PA-st.BB;
      st.avg=clamp(0.252+d*0.0058+(a.sta-50)*0.0003+(a.spd-par)*0.0006+N0(0.014),0.140,0.380);
      st.H=Math.round(st.AB*st.avg); st.avg=st.AB?st.H/st.AB:0;
      st.HR=Math.round(st.AB*clamp(0.010+(a.pow-par)*0.0022,0.001,0.075)*(0.85+R()*0.3));
      st.SB=Math.round(clamp((a.spd-45)*0.5+(a.spd-par)*1.3+N0(4),0,70)*f);
      st.RBI=Math.round(st.HR*2.1+(st.H-st.HR)*0.30);
      st.DEF=this.defRuns(lv);
    }
    st.baseD=st.d; /* 市場評価では好不調補正前の総合評価を基礎値として保持する。 */
    this.applySeasonForm(st,lv);   /* 不調整年/キャリア年：調整整率成績と積み上げ成績(出場数は変えない)。 */
    st.formAdjustment=st.form===1?4:st.form===-1?-4:0;
    return st;
  }
  /* シーズン状態は10%で不調整（成績×0.65）、10%でキャリアハイ（健康時のみ成績×1.2）。倍率は内容と率だけに適用し、出場数は変えない。 */
  applySeasonForm(st,lv){
    const S=this.#getState(),{isSP}=this.#deps,{R}=this.#rng;
    if(S.seasonFactor<=0)return;                 /* 全休時は発動作しない。 */
    st.form=0;                                    /* 0=正常 1=キャリア年 -1=低潮。 */
    const roll=R();
    const canCareer=S.seasonFactor>=0.9;          /* キャリアハイ判定にはシーズンを健康に済みごす必要がある。 */
    let m=1;
    if(roll<0.10){ st.form=-1; m=0.65; }          /* 不調整時は成績を65%へ補正。 */
    else if(canCareer && roll<0.20){ st.form=1; m=1.20; } /* キャリアハイ時は成績を1.2倍。 */
    if(m===1)return;
    if(S.pos==='P'){
      /* 投手：三振/勝利数は倍率に従う;被安打と自責分逆方向へ補正(キャリア年減少、低潮増加);SV/HLD に応じて倍率ただし超えない出場数。 */
      st.SO=Math.round(st.SO*m);
      st.W=Math.round(st.W*m); if(st.L!=null)st.L=Math.max(0,Math.round(st.L/(m||1)));
      st.H=Math.max(0,Math.round(st.H/m)); st.ER=Math.max(0,Math.round(st.ER/m));
      st.era=st.IP>0?+(st.ER*9/st.IP).toFixed(2):st.era;
      st.WHIP=st.IP>0?+((st.H+st.BB)/st.IP).toFixed(2):st.WHIP;
      if(st.SV)st.SV=Math.min(st.G,Math.round(st.SV*m));
      if(st.HLD)st.HLD=Math.min(Math.max(0,st.G-(st.SV||0)),Math.round(st.HLD*m));
      /* 物理約束(倍率後再度制限)：セーブ割合<=85%、勝+敗+セーブ+セットアッパー <= 出場数。 */
      if(!isSP()){
        st.SV=Math.min(st.SV||0, Math.floor(st.G*0.85));
        st.HLD=Math.min(st.HLD||0, Math.max(0,st.G-st.SV));
        const decCap=Math.max(0,st.G-st.SV-st.HLD);
        if((st.W+st.L)>decCap){ st.W=Math.min(st.W,decCap); st.L=Math.max(0,decCap-st.W); }
      }
    }else{
      /* 打者：安打/本塁打/盗塁/打点倍率に従う;打席と出場数変えない(打率連動作して変化)。 */
      st.H=Math.round(st.H*m); st.HR=Math.round(st.HR*m); st.SB=Math.round(st.SB*m);
      if(st.H>st.AB)st.H=st.AB;                   /* 安打数は打数を超えない。 */
      st.avg=st.AB?st.H/st.AB:0;
      st.RBI=Math.round(st.HR*2.1+(st.H-st.HR)*0.30);
    }
    /* d 値(評価へ影響/タイトル/降格)状態に合わせて補正。 */
    st.d += st.form===1?4:st.form===-1?-4:0;
  }
  /* 守備評価(近似 defensive runs)：守備位置難易度重み × 守備能力に対するリーグ基準的差 × 出場割合。 */
  defRuns(lv){
    const S=this.#getState(),{LV}=this.#deps;
    if(S.pos==='P')return 0;
    const a=S.ab, par=LV[lv].par;
    const dp=S.dpos||(S.pos==='C'?'C':'2B');
    if(dp==='DH')return 0; /* DHには守備評価を付けない。 */
    const posW={SS:1.25,CF:1.20,C:1.15,'2B':1.05,'3B':1.00,RF:0.95,'1B':0.75,LF:0.80}[dp]||1;
    const skill=dp==='C'?(a.fld*0.4+a.arm*0.3+a.cat*0.3)
      :(a.rng*0.45+a.fld*0.40+a.arm*0.15);
    const gw=1; /* 出場割合はseasonFactorへ反映済み。 */
    return Math.round((skill-par)*posW*0.55*(S.seasonFactor||1));
  }
  addIntlStats(){
    const S=this.#getState(),{clamp,isSP}=this.#deps,{R,chance,ri}=this.#rng;
    const a=S.ab,IS={...S.intlStat},g=ri(5,8);IS.G+=g;if(S.pos==='P'){const dd=(a.vel+a.ctl+a.brk)/3-58,ip=+(ri(4,9)+R()*3).toFixed(1),k9=clamp(7.2+dd*.13,4,14),era=clamp(3.7-dd*.16,.8,8);IS.IP=+(IS.IP+ip).toFixed(1);IS.SO+=Math.round(ip/9*k9);IS.ER+=Math.round(era*ip/9);if(chance(45))IS.W++;if(!isSP()&&chance(30))IS.SV++;}else{const dd=(a.con*.5+a.pow*.2+a.eye*.18+a.spd*.12)-58,pa=g*ri(3,4),ab=Math.round(pa*.86),avg=clamp(.265+dd*.006,.15,.5),h=Math.round(ab*avg),hr=Math.round(h*clamp(.06+Math.max(0,a.pow-58)*.006,.03,.28));IS.PA+=pa;IS.AB+=ab;IS.H+=h;IS.HR+=hr;IS.RBI+=Math.round(hr*2.1+h*.35);}return IS;
  }
  addStatTotal(t,st){
    t.yr++;
    ['G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','HLD','SO','ER'].forEach(k=>t[k]+=(st[k]||0));
    t.DEF+=(st.DEF||0);
    t.IP=+(t.IP+st.IP).toFixed(1);
  }
  accStat(bucket,st){
    const S=this.#getState();
    if(!S.stats[bucket]) S.stats[bucket]=this.blankStat();
    if(bucket!=='MINOR'&&S.orgTeamId){ const tb=S.teamTally[bucket]||(S.teamTally[bucket]={});
      tb[S.orgTeamId]=(tb[S.orgTeamId]||0)+1; }
    if(S.pos!=='P'){ const dp=(st&&st._dh)?'DH':(S.dpos||'—'); S.dposYears[dp]=(S.dposYears[dp]||0)+1; }
    else if(S.role){ S.roleYears[S.role]=(S.roleYears[S.role]||0)+1; }
    this.addStatTotal(S.stats[bucket],st);
  }
  accLevelStat(levelKey,st){
    const S=this.#getState(),{checkGoldclothSeason}=this.#deps;
    if(levelKey==='NPB1')checkGoldclothSeason();
    if(!S.statsByLevel)S.statsByLevel={NPB1:null,NPB2:null,NPB_DEV:null,KBO1:null,KBO2:null,CPBL1:null,CPBL2:null,MLB:null,A3:null,A2:null,A1:null,R:null,IND:null,CORP:null};
    if(!S.statsByLevel[levelKey])S.statsByLevel[levelKey]=this.blankStat();
    this.addStatTotal(S.statsByLevel[levelKey],st);
  }
}

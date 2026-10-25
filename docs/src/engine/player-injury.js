// Pitcher TJ gamble and the mid-season injury roll (OOP plan §2t).
// The career state is read through getState; clamp and the POS_AB/ABL tables are passed by reference, and the game.js
// ability/UI helpers, tjCap and the ri/chance/pick RNG bridge as late-binding lambdas. The rule bodies are the former
// game.js tjGamble/tjTwoStrike/tjBigInjury/afterGamble/injuryProb/rollInjury/injStatLoss; each unit, including the
// deferred choose options, reads getState() live.
export class PlayerInjury {
  #rules;
  constructor(deps){this.#rules=injuryRules(deps);}
  tjGamble(cont){this.#rules.tjGamble(cont);}
  afterGamble(kind,cont){this.#rules.afterGamble(kind,cont);}
  rollInjury(){this.#rules.rollInjury();}
}

function injuryRules({getState,clamp,POS_AB,ABL,addAb,board,card,choose,removeTrait,tjCap,rng:{ri,chance,pick}}){
  function tjGamble(cont){ /* TJゲージ上限到達時は先に能力を5下げ、その後に手術結果を判定。 */
    const S=getState();
    if(S.pos!=='P'||S.tj<tjCap()){ cont(); return; }
    addAb('vel',-5); addAb('brk',-5); board(1);
    card('bad','肘に危険信号',`蓄積疲労で靱帯が悲鳴を上げた――球速・変化球がそれぞれ <b class="dn">−5</b>。医療チームから二つの選択肢を提示された。`);
    const succP=S.traits.rubber?85:55;
    choose('TJの決断：肘はもう限界だ',[
      {t:'トミー・ジョン手術を受ける',main:true,s:'今季全休。復帰後は球速・変化球が回復（各 +3～+10）',f:()=>{const S=getState();
        S.tj=0; S.tjCount++; S.rehab=1;
        const gv=ri(3,10),gb=ri(3,10); addAb('vel',gv); addAb('brk',gb);
        if(S.tjCount>=2){ tjTwoStrike(); }
        board(1);
        card('gold','手術成功',`手術は成功。長いリハビリを経て球威がよみがえった――球速 <b class="up">+${gv}</b>、変化球 <b class="up">+${gb}</b>。（今季全休）`);
        afterGamble('surgery',cont); }},
      {t:'注射で今季を乗り切る',warn:true,s:`成功率 ${succP}%｜失敗＝TJ級の大けが（翌年全休・能力も再低下）`,f:()=>{const S=getState();
        if(chance(succP)){ S.tj=Math.max(0,S.tj-20); addAb('vel',5); addAb('brk',5); board(1);
          card('good','首の皮一枚で回避',`ブロック注射で持ちこたえ、歯を食いしばってシーズンを完走――TJゲージ <b class="hl">−20</b>、球速・変化球が各 <b class="up">+5</b>。ただし、これは選手生命の前借りだ。`);
          afterGamble('inject',cont); }
        else { tjBigInjury(cont); } }}]);
  }
  function tjTwoStrike(){ /* TJ手術2回で球速と変化球を半減。 */
    const S=getState();
    S.ab.vel=clamp(Math.round(S.ab.vel/2),1,80);
    S.ab.brk=clamp(Math.round(S.ab.brk/2),1,80);
    card('bad','二度の手術の代償','二度目の手術――靱帯はもう元どおりではない。球速・変化球が<b class="dn">半減</b>。');
  }
  function tjBigInjury(cont){
    const S=getState();
    S.tjCount++; S.rehab=1; S.tj=0;
    /* 5%で肩を壊して再起不能。 */
    if(chance(5)){ S.ab.vel=10; S.ab.brk=10; S.pot.vel=20; S.pot.brk=20;
      card('bad','最悪の結末',`注射した瞬間、肩に経験したことのない激痛が走った。医師の表情がすべてを物語る――<b class="dn">肩は致命傷。球速・変化球は10まで低下し、潜在能力上限も20に</b>。投手人生は、たぶんここまでだ。`);
      board(1); afterGamble('fail',cont); return; }

    /* 靱帯断裂の能力低下（−5）と手術成功後の回復（+3～+10）。 */
    const gv=ri(3,10), gb=ri(3,10);
    const netV = gv - 5;
    const netB = gb - 5;
    /* 絶対値を直接更新して加算バグを防ぎ、1～80へ制限。 */
    S.ab.vel = clamp(S.ab.vel + netV, 1, 80);
    S.ab.brk = clamp(S.ab.brk + netB, 1, 80);

    if(S.tjCount>=2)tjTwoStrike();
    board(1);

    const vStr = netV > 0 ? `<b class="up">+${netV}</b>` : netV < 0 ? `<b class="dn">${netV}</b>` : `<b>0</b>`;
    const bStr = netB > 0 ? `<b class="up">+${netB}</b>` : netB < 0 ? `<b class="dn">${netB}</b>` : `<b>0</b>`;
    card('bad','TJ級の大けが',`無理を続けた代償が来た――靱帯がその場で断裂。翌年は<b class="dn">シーズン全休</b>。長い手術とリハビリ（断裂 −5＋手術による回復）の末、球速は ${vStr}、変化球は ${bStr}。完全復活に見えても、実際はどうにか差し引きゼロだ。`);
    afterGamble('fail',cont);
  }
  function afterGamble(kind,cont){
    const S=getState();
    if(kind==='inject'){ S.tjSuccess++;
      if(S.tjSuccess>=2&&!S.traits.rubber){ S.traits.rubber=true;
        card('gold','隠し特性解放：ゴムゴムの腕','二度の肘危機を注射だけで乗り切り、一度も手術を受けなかった――靱帯はゴムのようにしなやかだ。<b class="hl">TJゲージ上限が50から100に、注射成功率が55%から85%に上昇</b>。'); board(1); } }
    else if(kind==='surgery'){ S.tjSuccess=0; /* 手術時に連続記録をリセット。 */
      if(S.traits.rubber){ removeTrait('rubber','ゴムゴムの腕');
        card('bad','ゴムゴムの腕、ついに限界','ついに手術室へ――ゴムゴムの腕と呼ばれた腕にも限界はあった。<b class="dn">ゴムゴムの腕失効</b>。'); board(1); } }
    else { S.tjSuccess=0; } /* 重傷失敗時に連続記録をリセット。 */
    cont();
  }
  function injuryProb(){ /* 基礎リスク24から15へ下げ、済み剰な故障発生を抑える。 */
    const S=getState();
    let p=15+S.injNext;
    if(S.age>=35)p+=12; else if(S.age>=32)p+=6;
    if(S.traits.academy&&S.age<25)p-=5; /* 理論派：25歳まで科学的に自己管理。 */
    if(S.traits.iron&&S.traits.glass)p=25;
    else if(S.traits.iron)p=Math.min(p,10); /* 鐵人：基礎リスク上限 10%。 */
    else if(S.traits.glass)p=Math.max(p,40);
    /* イベントカード等自検索的額外リスク(tmpInj)疊加在基礎之上、不受鐵人上限保護。 */
    p+=(S.tmpInj||0);
    return clamp(p,3,95);
  }
  function rollInjury(){
    const S=getState();
    const p=injuryProb();
    if(!chance(p)){ card('info','健康の回復',`今季は無事に出場できた。（故障率 ${p}%）`); S.injNext=0; return; }
    S.injNext=0;
    if(chance(64)){ // 64% 的確率是小傷。
      const cut=ri(20,45); S.seasonFactor=1-cut/100; S.ironStreak=0;
      card('bad','軽傷',`肉離れで故障者リスト入りしており、今季は試合数が減る見込みだ。<b class="dn">${cut}%</b>。${injStatLoss(false)}`);
    }else{
      const played = ri(5, 45); /* させるシーズンランダムにシーズンの 5% ~ 45% 時点で故障させる。 */
      S.seasonFactor = played / 100; /* 割合を当該シーズンの出場数へ適用。 */
      S.bigInj++; S._majorInjuryThisSeason=true; S.ironStreak=0;
      let txt=`重傷――手術を受けることになった。<b class="dn">今季絶望</b>（今季は出場予定の${played}%を消化）。`;
      if(chance(20)){ S.rehab=1; txt+=`医師は首を横に振った。<b class="dn">来季開幕にも間に合わない</b>（翌季全休）。`; }
      card('bad','重傷',txt+injStatLoss(true));
      if(S.bigInj>=2&&!S.traits.glass&&S.age<32){ /* 32 歳以降の重傷は加齢扱い、スペランカー判定には使わない。 */
        S.traits.glass=true;
        card('bad','隠し特性解放：スペランカー','キャリア2度目の大けが。以後は故障がつきまとい、毎季の故障率が<b class="dn">40%以上</b>となる。'); }
      else if(S.bigInj>=2&&!S.traits.glass&&S.age>=32){
        card('info','医療チームの評価','「これは経年劣化であり、物理的な問題ではありません。」 - チームは誰よりもベテランの怪我に対してオープンな目で見ています。'); }
    }
  }
  function injStatLoss(big){
    const S=getState();
    if(big){ /* 重傷のたびに全能力−5。身体的なダメージを能力へ反映。 */
      POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); }); board(1);
      return `大けがの影響で、<b class="dn">全能力が−5</b>。`;
    }
    if(!chance(40))return '';
    const keys=POS_AB[S.pos];
    let k=pick(keys); if(!(k in S.ab))k=pick(keys);
    const amt=ri(1,2);
    S.ab[k]=clamp(S.ab[k]-amt,1,80); board(1);
    return `けがの後遺症が残った：<b class="dn">${ABL[k]} −${amt}</b>。`;
  }
  return {tjGamble,afterGamble,rollInjury};
}

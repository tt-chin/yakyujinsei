// Retirement: the final-position label, the league stat tables, the retirement and Hall of Fame scene, and the career-end summary (OOP plan §2x).
// The career state and seed are read through getState/getSeed; the deferred share and replay handlers read them live.
// LV, DPN, POSN, TIER_TH, LG_N and TEAM_COLOR are passed by reference (the overlay changes them in place), and every game.js
// function and the R/ri bridge as late-binding lambdas. The tier and honor adapters stay in game.js.
// The rule bodies are the former game.js roleName3/primaryPos/capTeam/posLegendPhrase/statTable/FAN/retireScene/endGame.
import { VERSION } from '../config.js';
import { JP_DATA } from '../data/jp-data.js';
import { incomeSummary } from '../ui/income-summary.js';
import { replayURL, shareReplayURL } from '../ui/seed-share.js';
import { hasHistoricalDefenseAward } from './award-consumer-policy.js';
import { smallSchoolEligibility } from './school-policy.js';
import { removedTraitLabel } from './trait-policy.js';

export class CareerRetirement {
  #rules;
  constructor(deps){this.#rules=careerRetirementRules(deps);}
  primaryPos(){return this.#rules.primaryPos();}
  capTeam(bucket){return this.#rules.capTeam(bucket);}
  posLegendPhrase(bucket){return this.#rules.posLegendPhrase(bucket);}
  retireScene(tiers){this.#rules.retireScene(tiers);}
  endGame(reason){this.#rules.endGame(reason);}
}

function careerRetirementRules({getState,getSeed,LV,DPN,POSN,TIER_TH,LG_N,TEAM_COLOR,$,fmtMoney,fmtIP,slgOf,card,divider,choose,actClear,defShare,tierOf,traitNames,teamNick,archiveTraitResults,shareImage,rng:{R,ri}}){
  function roleName3(r){ return {SP:'先発投手',MR:'リリーバー',CL:'抑え'}[r]||'投手'; }
  function primaryPos(){ /* 通算の半数超を守った位置を主守備とし、該当なしなら年数順でユーティリティーまたはスイングマンと判定。 */
    const S=getState();
    if(S.pos==='P'){
      const ry=S.roleYears||{}; const tot=Object.values(ry).reduce((a,b)=>a+b,0);
      if(!tot)return roleName3(S.role);
      const es=Object.entries(ry).sort((a,b)=>b[1]-a[1]);
      if(es[0][1]>=tot/2)return roleName3(es[0][0]); /* 済み半数あり。 */
      /* 済み半数なし：スイングマン(主な2役を併記)。 */
      const list=es.map(e=>({SP:'先発',MR:'中継ぎ',CL:'抑え'}[e[0]]||'')).filter(Boolean);
      return 'スインガー('+list.slice(0,2).join('、')+')';
    }
    const dy=S.dposYears||{}; const total=Object.values(dy).reduce((a,b)=>a+b,0);
    if(!total)return S.dpos?DPN[S.dpos]:POSN[S.pos];
    const entries=Object.entries(dy).sort((a,b)=>b[1]-a[1]);
    if(entries[0][1]>=total/2)return DPN[entries[0][0]]||entries[0][0]; /* 済み半数あり。 */
    const noDH=entries.filter(e=>e[0]!=='DH'&&e[0]!=='—').map(e=>DPN[e[0]]||e[0]);
    if(!noDH.length)return DPN['DH'];
    return 'ツールマン('+noDH.join('、')+')';
  }
  function capTeam(bucket){ /* 当該リーグで最長在籍の球団、殿堂入り時の帽章にする。 */
    const S=getState();
    const tb=(S.teamTally&&S.teamTally[bucket])||{}; let best=null,bn=-1;
    for(const k in tb)if(tb[k]>bn){bn=tb[k];best=k;}
    return best&&window.TEAM_MASTER&&window.TEAM_MASTER[best]?window.TEAM_MASTER[best].name:best;
  }
  function posLegendPhrase(bucket){ /* に応じて守備割合とタイトル決定守備位置敘述。 */
    const S=getState();
    const share=defShare(bucket), st=S.stats[bucket];
    const dp=S.dpos||(S.pos==='C'?'C':null);
    const hasGlove=hasHistoricalDefenseAward(S.honors);
    if(S.pos==='P'||!dp||dp==='DH')return '';
    const posN=DPN[dp]||'';
    if(share>=0.34||(hasGlove&&share>=0.22))return `、${{SS:'史上最高の遊撃手の一人',CF:'守備範囲でリーグを震撼させた中堅手',C:'捕手守備の化身',_:'守備のレジェンド'}[dp]||('球界屈指の'+posN)}として`;
    if(hasGlove&&share>=0.12)return `、攻撃的にも守備的にも優れた選手${posN}`;
    return '';
  }
  function statTable(bucket){
    const S=getState();
    const st=S.stats[bucket]; if(!st)return '';
    let rows;
    if(S.pos==='P'){
      const era=st.IP>0?(st.ER*9/st.IP).toFixed(2):'-';
      const whip=st.IP>0?((st.H+st.BB)/st.IP).toFixed(2):'-';
      rows=`<tr><th>Yrs</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>HLD</th><th>SO</th><th>BB</th><th>ERA</th><th>WHIP</th></tr>
    <tr><td>${st.yr}</td><td>${st.G}</td><td>${fmtIP(st.IP)}</td><td>${st.W}</td><td>${st.L}</td><td>${st.SV||0}</td><td>${st.HLD||0}</td><td>${st.SO}</td><td>${st.BB||0}</td><td>${era}</td><td>${whip}</td></tr>`;
    }else{
      const obpN = st.PA>0 ? (st.H+st.BB)/st.PA : 0;
      const slgN = slgOf(st);
      const avg = st.AB>0 ? (st.H/st.AB).toFixed(3).replace(/^0/,'') : '-';
      const obp = st.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-';
      const slg = st.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-';
      const ops = st.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
      rows=`<tr><th>Yrs</th><th>G</th><th>PA</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>H</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th></tr>
    <tr><td>${st.yr}</td><td>${st.G}</td><td>${st.PA}</td><td>${avg}</td><td>${obp}</td><td>${slg}</td><td>${ops}</td><td>${st.H}</td><td>${st.HR}</td><td>${st.RBI}</td><td>${st.SB}</td><td>${st.DEF>0?'+':''}${st.DEF||0}</td></tr>`;
    }
    const asN=st.AS||0;
    return `<p style="margin-top:8px"><b>${LG_N[bucket]}</b>${asN?` · オールスター ${asN}回選出`:''}</p><table class="fin">${rows}</table>`;
  }
  const FAN={
   0:['{n}引退とか無理…俺の青春も終わった','いつか子どもを球場へ連れてきて、「父ちゃんは{n}のプレーを生で見たんだぞ」って自慢するわ。','海外メディア、もう殿堂入りの得票率を計算してて草。心配ゼロかよ。','日本野球を世界へ連れていってくれてありがとう','このクラスは一世代に一人出るかどうかだろ','引退試合のチケット即完売。転売価格5倍で草'],
   1:['{n}引退確定でTLがお通夜状態','オールスター常連がついに引退か…寂しくなるな','通算成績、改めて見るとガチで立派。最高の花道だわ','いつも全力プレーをありがとう。本当にお疲れさまでした','子どもの頃、部屋に貼ってたポスターが{n}だった。俺も年取ったな'],
   2:['スーパースターじゃなくても、中継をつければいつもいた。それで十分なんよ','長年黙々とチームを支えてくれてありがとう','こういういぶし銀がチームの屋台骨なんだよ','数字は嘘をつかない。安定感こそ最大の武器だった'],
   3:['長年ベンチを温め続けた。それもまたプロ野球人生よ','少なくとも本当にプロの舞台に立った。画面の前の俺らより何倍もすごい','泥くさいプレーと大事な一本、忘れないぞ','二軍暮らしが長くても、覚えているファンはちゃんといる'],
   4:['ねえ、これは誰ですか？ …調べてみたら、実はプロでプレーしていたことが分かりました。','野球は本当に難しいですね、第二の人生も頑張ってください','また夢を追う者が現実に負けて悲しい','掲示板にはメッセージが 3 件しかなく、そのうちの 1 件に本人が返信しました。'],
  };
  function retireScene(tiers){
    const S=getState();
    const alreadyLegend=Boolean(S.traits.legend);
    /* tiers： {CPBL：{i、sc}、NPB：...、MLB：...} 出試合実績がある場合だけ作成。 */
    /* 代表リーグは在籍年数が最長のトップリーグ、評価階級はキャリア最高値（i最小）。 */
    let lg=LV[S.lv]?.statBucket||'MINOR', bestI=4;
    const order=['MLB','NPB','KBO','CPBL'];
    order.forEach(b=>{ if(tiers[b]&&tiers[b].i<bestI){ bestI=tiers[b].i; } });
    /* 代表リーグ：最大評価のリーグから、在籍年数が最長のものを採用。 */
    let repYr=-1;
    order.forEach(b=>{ if(tiers[b]&&tiers[b].i===bestI){ const yy=S.stats[b]?S.stats[b].yr:0; if(yy>repYr){repYr=yy;lg=b;} } });
    const t=tiers[lg], i=t?t.i:4, yr=S.year;
    let txt='';
    if(lg==='CPBL'){
      if(i===0)txt=`引退試合の舞台は<b class="hl">台北ドーム</b>。4万人で埋まり、外野にはキャリア各年の写真が並ぶ。9回裏、最後の打席を終えると照明が落ち、スポットライトがあなたを照らした。泣く仲間、脱帽して並ぶ相手選手、二塁後方で流れる応援歌のバラード版。場内を一周し、グラブをホームベースへそっと置いた。この試合は台湾プロ野球史上最高視聴率のレギュラーシーズン戦となった。`;
      else if(i===1)txt=`球団が引退セレモニーを開催。本拠地は満員となり、大型ビジョンには甲子園の夢が破れた高校時代から${S.pos==='P'?'プロ初登板':'プロ初安打'}までの映像が流れた。かつての仲間が各地から花を贈りに戻り、監督は言葉を詰まらせる。最後に帽子を取り、四方のスタンドへ深々と一礼。応援団の太鼓は、ダッグアウトへ消えるまで鳴りやまなかった。`;
      else if(i===2)txt=`${S.pos==='P'?'シーズン最後の本拠地戦、球団はあなたを先発マウンドへ送った。1回を投げ終えて交代すると、観客は総立ちで拍手。仲間はダッグアウト前に二列で並び、ハイタッチで迎えた。花火もライブもない。ただスタンドには「全力の一球一球をありがとう」と手書きした横断幕が掲げられていた。':'シーズン最後の本拠地戦、球団はあなたを一番打者で先発起用。最初の打席後に交代すると、観客は総立ちで拍手。仲間はダッグアウト前に二列で並び、ハイタッチで迎えた。花火もライブもない。ただスタンドには「全力で走った一歩一歩をありがとう」と手書きした横断幕が掲げられていた。'}`;
      else txt=`チームの公式ウェブサイトのプレスリリースで引退を発表しましたね。あなたがこの投稿を投稿した夜、何十人もの古いファンがあなたのソーシャルメディアに殺到し、「お疲れ様でした」というメッセージを残しました。それがプロ野球の特徴です。誰もが儀式を持っているわけではありませんが、真剣にプレーする人には必ずそれを覚えている人がいます。`;
    }else if(lg==='NPB'){
      if(i<=1)txt=`球団が<b class="hl">引退試合</b>を用意した。最後の守備を終えると一人グラウンドに残され、両軍選手が整列。花束、監督との抱擁、そして何度も<b class="hl">胴上げ</b>された。花束を抱えて場内を一周し、満員のファンへ深々と頭を下げた。翌朝、宙を舞う写真が全スポーツ紙の一面を飾った。`;
      else if(i===2)txt=`最終戦後、球団が短い引退セレモニーを開催。花束、額装した記念ユニフォーム、監督との記念撮影。場内放送が通算成績を読み上げると、ビジターのファンも立ち上がって拍手した。会見では、支えてくれたファンと仲間への感謝を語った。`;
      else txt=`球団を通じて引退を発表した。ロッカーを片づけた日、仲間やスタッフが選手通路の最後まで見送り、警備員も深々と頭を下げた。スーツケースには、捨てられなかった練習着が数枚残った。`;
    }else if(lg==='KBO'){
      if(i<=1)txt=`球団が本拠地最終戦を引退試合として開催した。最後のプレーを終えると両軍の選手が整列し、満員のファンが総立ちで拍手。大型ビジョンには韓国で戦った日々が映し出され、古巣の仲間から花束が贈られた。`;
      else if(i===2)txt=`シーズン最終戦後、球団が引退セレモニーを開催した。場内放送がKBO通算成績を読み上げると、ホームとビジター双方のファンから温かい拍手が送られた。`;
      else txt=`球団を通じて現役引退を発表した。ロッカーを片づけ、支えてくれた韓国のチームメートとスタッフへ一人ずつ感謝を伝えた。`;
    }else if(lg==='MLB'){
      if(i<=1)txt=`本拠地最終戦。最後の打席を前に観客は3分間の総立ち拍手。主審も脇へ下がって静かに待った。打席後に交代すると、全員がダッグアウトから出て抱きしめ、大型ビジョンに功績映像が流れる――<b class="hl">Curtain Call</b>。再び姿を見せ、二度帽子を振った。会見には各国メディアが詰めかけ、日本のスポーツメディアも一晩中特集を放送した。`;
      else if(i===2)txt=`キャリア最後のシリーズ前、球団が簡単なセレモニーを開催。額装ユニフォームと記念レリーフが贈られ、仲間がハイタッチで送り出す。地元紙は「スーパースターではない。だが、どの監督も欲しがる選手だ」と記した。`;
      else txt=`無人の球場の写真に「Thank you、 baseball.」の一文だけを添えて投稿。日本時間の深夜、いいねは静かに10万を超えた。`;
    }else{
      const retirementGround=S.stage==='CORP'?'社会人野球のグラウンド':S.stage==='IND'?'地方球場':S.stage==='U'?'大学野球のグラウンド':S.stage==='HS'?'母校のグラウンド':'球場';txt=`スポットライトはない。スパイクを磨いてバッグへ入れ、仲間と一人ずつ抱き合い、${retirementGround}を後にする前にスコアボードをもう一度振り返る。初めてこのグラウンドに立った日の夕日と同じように美しい。`;
    }
    card('gold','引退の日',txt);
    /* 名人堂票選(可多リーグ並存)。 */
    const hofs=[]; let firstBallot=false; const hofLeagues=[]; const firstBallotLeagues=[];
    const HOF_CFG={CPBL:{n:'台湾プロ野球殿堂',wait:5,total:132,lg:'台湾プロ野球'},KBO:{n:'韓国野球殿堂',wait:5,total:250,lg:'KBO'},NPB:{n:'日本野球殿堂',wait:5,total:326,lg:'NPB'},MLB:{n:'アメリカ野球殿堂',wait:5,total:389,lg:'メジャーリーグ'}};
    ['CPBL','KBO','NPB','MLB'].forEach(b=>{ const t=tiers[b]; if(!t)return;
      const cfg=HOF_CFG[b];
      if(t.i===0){
        /* 初回投票選出基準：評価点が基準を明確に上回る(1.15×名人堂基準)場合のみ first-ballot、それ以外は需等 N 年。 */
        const th=TIER_TH[b][0];
        const fbMult={CPBL:1.15,KBO:1.15,NPB:1.12,MLB:1.2}[b]||1.2;
        const firstNow = t.sc>=th*fbMult;
        const ballotYr = firstNow?1:ri(2,6);
        if(firstNow){ firstBallot=true; firstBallotLeagues.push(cfg.lg); }
        hofLeagues.push(cfg.lg);
        const pct=Math.min(99.1,75+ (t.sc-th)/th*40 + R()*6 - (ballotYr-1)*4);
        const votes=Math.round(cfg.total*Math.max(75,pct)/100);
        if(!S.hofInfo)S.hofInfo=[]; S.hofInfo.push({lg:cfg.lg,yr:ballotYr,pct:Math.max(75,pct).toFixed(1)}); /* 結果画像用。 */
        const cap=capTeam(b), phr=posLegendPhrase(b);
        hofs.push(`引退から<b class="hl">${cfg.wait}年後</b>（${yr+cfg.wait}年）に候補入りし、<b class="hl">${ballotYr}年目の投票</b>で<b class="hl">${votes}票</b>（得票率${Math.max(75,pct).toFixed(1)}%）を獲得。<b class="hl">${cfg.n}</b>入りを果たした。${cap?`代表球団は<b class="hl">${cap}</b>${phr}。`:''}${ballotYr===1?'<b class="hl">初回投票での殿堂入り。</b>':''}`);
      }else if(t.i===1){
        const pct=55+R()*17, tries=ri(3,9);
        hofs.push(`${tries}年連続で${cfg.n}の候補となり、最高得票率は${pct.toFixed(1)}%。しかし最後まで75%の壁を越えられなかった。`);
      } });
    if(firstBallot&&!S.traits.legend){ S.traits.legend=true;
      S.legendLeague=firstBallotLeagues[0]; }
    if(hofs.length)card('gold','殿堂入り投票',hofs.join('<br><br>'));
    if(S.traits.legend){ card('gold',(alreadyLegend?'':'隠し特性解放：')+(S.legendLeague||'')+'歴史に残る名選手',
      alreadyLegend?'':`初回投票で殿堂入り――ただ名を連ねただけではない。あなたは<b class="hl">一つの時代を築いた</b>。その名は${S.legendLeague||'野球界'}の歴史に刻まれる。`); }
  }
  function endGame(reason){
    const S=getState();
    S.done=true; actClear();
    divider('現役生活に幕');
    card('info','引退する',reason);
    /* リーグ別成績と評価。 */
    let tables='',evals=[],best=99; const tiersByLg={};
    ['MLB','NPB','KBO','CPBL','MINOR'].forEach(b=>{ if(S.stats[b]){ tables+=statTable(b);
      if(b!=='MINOR'){ const t=tierOf(b); tiersByLg[b]=t; evals.push(`<span class="tag">${t.name}</span>（評価点${t.sc}）`); best=Math.min(best,t.i); } } });
    if(best===99)best=4;
    retireScene(tiersByLg);
    /* 成就基準：CPBL名人堂 または 站上NPB/大リーグ。 */
    const reachedTop = (tiersByLg.CPBL&&tiersByLg.CPBL.i===0) || !!S.stats.NPB || !!S.stats.MLB;
    if(reachedTop){
      /* 小學校之光：T3 弱旅出身。 */
      if(!S.traits.smallschool && smallSchoolEligibility(S.birthHighSchool,JP_DATA.highSchools,VERSION)==='ELIGIBLE'){ S.traits.smallschool=true;
        card('gold','隠し特性解放：弱小校の星',`無名の弱小校から、ついに最高峰の舞台へ。出身校が選手の限界を決めるわけじゃない――自らのキャリアで証明した。`); }
      /* 努力仔：初始能力上限合計偏低(投手≤237/野手≤469)。 */
      const grindTh = S.pos==='P'?237:469;
      if(!S.traits.grinder && (S.potSum0||999)<=grindTh){ S.traits.grinder=true;
        card('gold','隠し特性解放：頑張り屋',`平凡な素質の選手は数え切れない。そこから頂点まで勝ち上がれるのは、ほんの一握りだ。選ばれた天才ではない。流した汗を才能へ変えた男だ。`); }
    }
    /* 25 歳前に野球を離れた場合：全選手に前向きな第二の人生を用意。 */
    if(S.age<25){
      const nm=S.name;
      const second=[
        `あなたはディビジョン B のアマチュア野球チームに参加します。平日は出勤し、週末にはジャージを着て、昨年のアソシエーションカップでサヨナラヒットを打った動画が話題になった。最も多かったコメントは「このスイングはアマチュアっぽくない」です。 - そうじゃないから。野球を愛するために野球で生計を立てる必要はないことを、あなたは誰よりも知っています。`,
        `不動産営業の資格を取った。内見で6階まで上っても顔色ひとつ変えず、客からは「雰囲気が違う」と言われる。16歳で数千人を前に投げた男が、価格交渉を恐れるはずもない。3年後には店の営業トップとなり、名刺の肩書きの下には小さく「元プロ野球選手」と記した。`,
        `叔父のもとで型枠大工になった。現場で春季キャンプ以上に日焼けしたが、体幹の強さと負けん気にベテラン職人も感心。5年後には班を率い、給料も二軍時代に引けを取らない。「ここでは誰も俺を二軍へ落とさない」と笑った。`,
        `シャツ姿で出社し、同僚が知っているのは「昔、野球をやっていた」ことだけ。ところが社内ソフトボール大会で一発を場外へ運び、全員が3秒沈黙。それ以来、相手企業は毎年「あの人、今年も出るんですか？」と先に聞くようになった。`,
        `朝食店を引き継ぎ、店名は「満塁」。高校時代のユニフォームを飾り、卵焼きは守備と同じく堅実。近所の少年野球選手が放課後に集まる。店主が大根餅を焼きながら、投手のリリースポイントの見方を教えてくれるからだ――卵追加は無料。`,
        `母校の指導者になった。給料は高くないが、自分が歩ききれなかった道を地図にして後輩へ渡した。7年目、教え子の投手がドラフト1巡目指名。中継カメラに映ったあなたは、本人以上に泣いていた。`,
        `起業し、スマホのスロー映像で一般選手のスイング軌道を分析する野球トレーニング技術を開発。1年目は倒産寸前、3年目にスポーツセンターが一括導入した。資金調達資料の1枚目には「自分が立てなかった舞台に、もっと多くの人を立たせたい」とだけ書いた。`,
        `消防士になり、体力試験は全種目1位。教官に前職を聞かれ「野球です」と答えた。初めて人命救助に出た夜、ふと気づく。もう150キロは投げられなくても、人を担いで火災現場から救い出せる――この両手はまだ役に立つ。`];
      card('gold','第二の人生',second[Math.floor(R()*second.length)].replace(/{n}/g,nm)+`<br><br><span class="sub">グラウンドを離れた後の人生も、また人生。${nm}、お疲れさまでした。</span>`);
    }
    /* 年度別成績表 (アマチュアとプロに分ける)。 */
    if(S.log.length){
      const amaLogs = S.log.filter(r => !r.st);
      const proLogs = S.log.filter(r => r.st);
      if(amaLogs.length > 0){
        const amaRows = amaLogs.map(r=>`<tr><td style="white-space:nowrap">${r.y}</td><td style="white-space:nowrap">${r.age}</td><td style="text-align:left;white-space:nowrap">${r.tm}</td><td style="text-align:left;font-size:11px;${r.inj?'color:var(--bad);font-weight:700;':''}">${r.line}</td></tr>`).join('');
        card('','キャリア年表（アマチュア成績）',`<table class="fin"><tr><th>年</th><th>年齢</th><th style="text-align:left">チーム</th><th style="text-align:left">成績</th></tr>${amaRows}</table>`);
      }
      if(proLogs.length > 0){
        const isP = S.pos === 'P';
        const head = isP
          ? `<tr><th>年</th><th>年齢</th><th style="text-align:left">チーム</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>HLD</th><th>SO</th><th>BB</th><th>ERA</th><th>WHIP</th></tr>`
          : `<tr><th>年</th><th>年齢</th><th style="text-align:left">チーム</th><th>G</th><th>PA</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>H</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th></tr>`;
        const rows = proLogs.map(r => {
          const cS = r.inj ? 'color:var(--bad);font-weight:700;' : '';
          const s = r.st || {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0};
          if(isP){
            const era = s.IP>0 ? (s.ER*9/s.IP).toFixed(2) : '-';
            const whip = s.IP>0 ? ((s.H+s.BB)/s.IP).toFixed(2) : '-';
            return `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td class="career-team"><span>${r.tm}</span></td><td>${s.G}</td><td>${fmtIP(s.IP)}</td><td>${s.W}</td><td>${s.L}</td><td>${s.SV||0}</td><td>${s.HLD||0}</td><td>${s.SO}</td><td>${s.BB||0}</td><td>${era}</td><td>${whip}</td></tr>`;
          } else {
            const obpN = s.PA>0 ? (s.H+s.BB)/s.PA : 0;
            const slgN = slgOf(s);
            const avg = s.AB>0 ? (s.H/s.AB).toFixed(3).replace(/^0/,'') : '-';
            const obp = s.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-';
            const slg = s.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-';
            const ops = s.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
            return `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td class="career-team"><span>${r.tm}${r.p?"·"+r.p:""}</span></td><td>${s.G}</td><td>${s.PA}</td><td>${avg}</td><td>${obp}</td><td>${slg}</td><td>${ops}</td><td>${s.H}</td><td>${s.HR}</td><td>${s.RBI}</td><td>${s.SB}</td><td>${s.DEF>0?'+':''}${s.DEF||0}</td></tr>`;
          }
        }).join('');
        card('','キャリア年表 (キャリアの実績)',`<div class="career-table-scroll"><table class="fin career-table">${head}${rows}</table></div>`);
      }
    }
    let intlTable='';
    if(S.intlCount>0){ const IS=S.intlStat;
      if(S.pos==='P'){ const era=IS.IP>0?(IS.ER*9/IS.IP).toFixed(2):'-';
        intlTable=`<h4 style="margin:12px 0 4px">国際大会通算（日本代表・${S.intlCount}大会）</h4><table class="st"><tr><th>出場</th><th>投球回</th><th>勝利</th><th>セーブ</th><th>奪三振</th><th>ERA</th></tr><tr><td>${IS.G}</td><td>${fmtIP(IS.IP)}</td><td>${IS.W}</td><td>${IS.SV}</td><td>${IS.SO}</td><td>${era}</td></tr></table>`;
      } else { const avg=IS.AB>0?(IS.H/IS.AB).toFixed(3).replace(/^0/,''):'-';
        intlTable=`<h4 style="margin:12px 0 4px">国際大会通算（日本代表・${S.intlCount}大会）</h4><table class="st"><tr><th>出場</th><th>打席</th><th>打率</th><th>安打</th><th>本塁打</th><th>打点</th></tr><tr><td>${IS.G}</td><td>${IS.PA}</td><td>${avg}</td><td>${IS.H}</td><td>${IS.HR}</td><td>${IS.RBI}</td></tr></table>`;
      }
    }
    card('','通算成績',(tables||'<p>（プロレベルの試合実績なし）</p>')+intlTable);
    if(evals.length)card('gold','通算評価',evals.join('<br>'));
    /* タイトルと主要大会成績（グループ化）。 */
    /* タイトルと主要大会成績（グループ化）。 */
    let honorsHTML = '（彼のキャリアでは賞を受賞していません）';
    if(S.honors.length) {
      const awardMap = {};
      S.honors.forEach(h => {
         const parts = h.split(' ');
         if(parts.length >= 2) {
           const yr = parts[0]; const awd = parts.slice(1).join(' ');
           if(!awardMap[awd]) awardMap[awd] = []; awardMap[awd].push(yr);
         } else { if(!awardMap[h]) awardMap[h] = []; awardMap[h].push(''); }
      });
      const honorsList = [];
      for(const awd in awardMap) {
         const yrs = awardMap[awd];
         if(yrs[0] !== '') {
           let nums = yrs.map(Number).sort((a,b)=>a-b);
           let res=[], st=nums[0], ed=nums[0];
           for(let i=1; i<=nums.length; i++){
             if(i<nums.length && nums[i]===ed+1){ ed=nums[i]; }
             else {
               if(ed-st>=2) res.push(`${st}~${ed}`); // 三年または以上連號、用 ~。
               else if(ed-st===1) res.push(`${st}、${ed}`); // 兩年連號、維持頓號。
               else res.push(`${st}`); // 單1年份。
               if(i<nums.length){ st=nums[i]; ed=nums[i]; }
             }
           }
           if(yrs.length > 1) honorsList.push(`· ${awd} *${yrs.length} (${res.join('、')})`);
           else honorsList.push(`· ${awd} (${res[0]})`);
         } else {
           honorsList.push(`· ${awd}`);
         }
      }
      honorsHTML = honorsList.join('<br>');
    }
    card(S.honors.length?'gold':'','タイトル・国際大会成績', honorsHTML);
    /* 特質と薪資。 */
    const tr=[];
    const TN=traitNames();
    const posT={pos:['favorite','adking','legend','taiwan','goldcloth','mrteam','confidante','genius','late','disc','academy','intlace','franchise','clutch','phoenix','rubber','onetool','smallschool','grinder','combo','rainbow','oldghost','miraclegen','strongpitch','stronghit','championmaker','pitcherTC','hitterTC','nitenichi','iron'],neg:['glass','scum','yips','distract','cancer','ambience','thief','latepractice']};
    const tagStyle=k=>{
      if(k==='legend'||k==='taiwan')return 'background:#fff7dc;border-color:#c79520;color:#795b00'; /* 歴史的選手/台湾代表への貢献：金。 */
      if(k==='goldcloth')return 'background:#fffbe0;border-color:#c5a800;color:#6f6000'; /* 黄金のユニフォーム：黄。 */
      if(k==='mrteam'){ const tc=TEAM_COLOR[S.mrTeamName]||'#a71930'; return 'background:#ffffff;border-color:'+tc+';color:'+tc; }
      if(k==='genius')return 'background:#f3f5f8;border-color:#9aa5b5;color:#4c5868';        /* 天才：銀。 */
      return ''; /* 好影響：既定色はアンバー。 */
    };
    posT.pos.forEach(k=>{ if(S.traits[k])tr.push(`<span class="tag" style="${tagStyle(k)}">${TN[k]}</span>`); });
    posT.neg.forEach(k=>{ if(S.traits[k])tr.push(`<span class="tag" style="background:#fff0f0;border-color:#c0392b;color:#a71930">${TN[k]}</span>`); });
    (S.removed||[]).forEach(lbl=>tr.push(`<span class="tag" style="text-decoration:line-through;opacity:.4;color:#8a8a8a;border-color:#4a4a4a">${removedTraitLabel(lbl,S,teamNick)}</span>`));
    const lv=S.love;
    const exes=Array.isArray(lv.exes)?lv.exes:[];
    const cur=lv.st==='married'?`妻 ${lv.partner}（子ども${lv.kids}人）`:lv.st==='dating'?`交際中 ${lv.partner}（${lv.dyrs||0}年）`:lv.st==='divorced'?'離婚':'独身';
    const exStr=exes.length?`｜前妻 ${exes.map(e=>`${e?.name||''}（${Number(e?.kids)||0}）`).join('、')}`:'';
    const totKids=(Number(lv.kids)||0)+exes.reduce((t,e)=>t+(Number(e?.kids)||0),0);
    card('','キャリアプロフィール',`特性：${tr.join(' ')||'（なし）'}<br>家族：${cur}${exStr}｜子ども合計 ${totKids} 人${lv.affairs?`｜不倫 ${lv.affairs}(${lv.caught})`:''}<br>日本代表出場：${S.intlCount}大会｜キャリア通算の大故障：${S.bigInj}回${S.pos==='P'?`｜トミー・ジョン手術：${S.tjCount}回`:''}<dl class="income-summary">${incomeSummary(S).map(row=>`<dt>${row.label}</dt><dd${row.key==='total'?' class="hl"':''}>${fmtMoney(row.amount)}</dd>`).join('')}</dl>`);
    /* ファンコメント。 */
    const pool=FAN[best].slice(); const picks=[];
    while(picks.length<3&&pool.length)picks.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
    /* 盤子留言：低リーグスター以上、海外移籍到更高リーグ卻淪替補/邊緣。 */
    { const LGR={CPBL:0,NPB:1,MLB:2}, CTY={CPBL:'台湾',NPB:'日本',MLB:'アメリカ合衆国'};
      ['CPBL','NPB','MLB'].forEach(low=>{ ['CPBL','NPB','MLB'].forEach(high=>{
        if(LGR[high]>LGR[low] && tiersByLg[low] && tiersByLg[high] && tiersByLg[low].i<=1 && tiersByLg[high].i>=3){
          picks.push(`${CTY[low]}では${LG_N[low]}の顔だったのに、${CTY[high]}の${LG_N[high]}ではまるで通用せず――「誰やこいつ？」地元ファンも困惑。獲得した球団、完全に高値づかみで草。`);
        }
      }); });
    }
    if(S.traits.glass)picks.push('あのケガさえなければどんな成績を残したのか……想像もつかん');
    if(S.traits.iron)picks.push('鉄人、ついに引退。あの連続出場記録は当分抜かれんやろな');
    if(S.traits.genius&&best<=1)picks.push('高校時代から天才と呼ばれた男、ガチで才能を証明したな');
    if(S.honors.some(h=>h.includes('WBC優勝')))picks.push('WBC優勝の夜、日本中が眠れなかった。ありがとう、侍ジャパン。');
    if(S.love.caught)picks.push('プレーは文句なし。私生活は……まあ、うん');
    if(S.traits.scum)picks.push('引退スレでその話はやめろ、今日は野球だけ語れ。……いややっぱ腹立つわ');
    if(S.traits.franchise)picks.push('一球団一筋。永久欠番待ったなし。残ってくれてありがとう');
    if(S.traits.legend)picks.push('同じ時代にプレーを見られたのは幸せや。文句なしのレジェンド');
    if(S.traits.intlace)picks.push('代表ユニを着たこの男、永遠の国民的英雄や');
    if(S.traits.taiwan)picks.push('代表招集6回、一度も辞退なし。胸を指したあの場面、今でもスマホの壁紙や');
    if(S.traits.disc)picks.push('自律しすぎて怖い。朝4時の球場がホームみたいな男');
    if(S.traits.cancer)picks.push('実力はガチ。でもあの態度はな……いなくなってロッカーが平和になったわ');
    if(S.traits.thief)picks.push('二軍落ち拒否して結果も出せず。給料泥棒呼ばわりも残当');
    if(S.traits.mrteam)picks.push('15年間、一筋の球団にすべてをささげた。'+(teamNick(S.mrTeamName||'')||'')+'『ミスター』の称号にふさわしい');
    if(S.traits.confidante)picks.push('グラウンドでは無双、恋愛ではあと一歩。悲しいなあ');
    if(S.traits.smallschool)picks.push('あの弱小校からプロまで来たんか。映画化決定やろ');
    if(S.traits.grinder)picks.push('才能に恵まれなくてもここまで来た。こういう選手が一番尊敬できる');
    if(S.traits.goldcloth)picks.push('阪神ストライプス愛してる。ずっとついていくで');
    if(S.traits.phoenix)picks.push('手術台から復活してタイトルまで取るとか、心臓チタン製やろ');
    if(S.traits.onetool&&S.toolRole)picks.push(`${S.toolRole}だけはマジで無双。勝負どころで出せばええねん。`);
    if(S.traits.clutch)picks.push('大舞台の鬼。勝負どころほど任せたくなる男');
    if(S.love.st==='married'&&S.love.kids>=2)picks.push('引退後は家族孝行してくれ。子どもたちもずっと待ってたぞ');
    card('info','ファン掲示板・引退スレ',picks.map(p=>'「'+p.replace(/{n}/g,S.name)+'」').join('<br>'));
    /* ワンタップ共有。 */
    const sh=document.createElement('div'); sh.className='card';
    sh.innerHTML=`<div class="title">この野球人生を共有</div>
    <div class="row2" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn main" id="sh-img" style="flex:1">📸 キャリア画像を作成</button>
      <button class="btn" id="sh-url" style="flex:1">🔗 リプレイURLを共有</button>
    </div><div id="sh-url-status" role="status" aria-live="polite"></div><div id="sh-out" style="margin-top:8px"></div>`;
    $('log').appendChild(sh);
    const imgBtn=sh.querySelector('#sh-img'),urlBtn=sh.querySelector('#sh-url'),shareOut=sh.querySelector('#sh-out');
    imgBtn.type=urlBtn.type='button';
    imgBtn.addEventListener('click',()=>{
      archiveTraitResults();
      imgBtn.disabled=true; imgBtn.textContent='⏳ キャリア画像を作成中…';
      requestAnimationFrame(()=>{try{shareImage(evals,shareOut);imgBtn.textContent='✅ キャリア画像を作成しました';}
        catch(err){console.error(err);shareOut.innerHTML='<div class="statline" role="alert">画像を作成できませんでした。「もう一度作成する」から再試行してください。</div>';imgBtn.textContent='⚠️ もう一度作成する';}
        finally{imgBtn.disabled=false;}
      });
    });
    urlBtn.addEventListener('click',async()=>{
      if(urlBtn.disabled)return;
      archiveTraitResults();
      const url=replayURL(getState().seed||getSeed(),location.href);
      const status=sh.querySelector('#sh-url-status');status.replaceChildren();urlBtn.disabled=true;
      try{
        const result=await shareReplayURL(url);status.textContent=result.message;
        if(result.manual){const input=document.createElement('input');input.value=url;input.readOnly=true;input.setAttribute('aria-label','リプレイURL');input.style.cssText='width:100%;margin-top:6px;padding:8px;color:var(--chalk);background:var(--panel);border:1px solid var(--edge);border-radius:6px';status.appendChild(input);input.focus();input.select();}
      }finally{urlBtn.disabled=false;}
    });
    choose('',[
      {t:'⚾ 新しい野球人生を始める（新規シード）',main:true,f:()=>{location.href=location.pathname;}},
      {t:'同じシードでやり直す',s:'seed: '+getSeed(),f:()=>{location.href=location.pathname+'?seed='+getSeed();}}]);
    /* 結果画面のスクロール位置：既定の最下部スクロールを上書き、「現役生活に幕」の先頭へ移動、結果の1行目から読めるようにする。 */
    setTimeout(()=>{ try{
      const heads=document.querySelectorAll('.yr-head');
      for(const h of heads){ if(h.textContent==='現役生活に幕'){ h.scrollIntoView({behavior:'auto',block:'start'}); break; } }
    }catch(e){} },250);
  }
  return {primaryPos,capTeam,posLegendPhrase,retireScene,endGame};
}

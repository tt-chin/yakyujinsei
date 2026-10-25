import { VERSION } from '../config.js';
import {incomeSummary} from './income-summary.js';
import { getDisplayPreferences } from './preferences.js';
import { getSharePalette, shareTagPalette } from './share-theme.js';
import {removedTraitLabel} from '../engine/trait-policy.js';

// Retirement career image (canvas) with save/share buttons (OOP plan §2q).
// The career state and seed are read through getters, so a new career (S/SEED reassigned) is seen at once.
// renderShareImage is the former game.js shareImage body; game.js helpers and tables are injected.
export class ShareImage {
  #deps;#previews=new Map();
  constructor({getState,getSeed,LG_N,TEAM_COLOR,teamNick,roleN,playerType,primaryPos,traitNames,fmtIP,slgOf,fmtMoney}){
    this.#deps={getState,getSeed,LG_N,TEAM_COLOR,teamNick,roleN,playerType,primaryPos,traitNames,fmtIP,slgOf,fmtMoney};
    window.addEventListener('yakyujinsei:displaychange',()=>{
      const theme=getDisplayPreferences().theme;
      for(const [out,preview] of this.#previews){
        if(!out.isConnected){this.#previews.delete(out);continue;}
        if(preview.theme!==theme)this.render(preview.evals,out);
      }
    });
  }
  render(evals,out){renderShareImage(this.#deps,this.#previews,evals,out);}
}

function renderShareImage({getState,getSeed,LG_N,TEAM_COLOR,teamNick,roleN,playerType,primaryPos,traitNames,fmtIP,slgOf,fmtMoney},shareImagePreviews,evals,out){
  const S=getState(),SEED=getSeed();
  const isP=S.pos==='P';
  const tiers=evals.map(t=>t.replace(/<[^>]+>/g,''));
  /* 特性(保持 + 刪除線標記)。 */
  const TN2=traitNames();
  const negK=['glass','scum','yips','distract','cancer','ambience','thief','latepractice'];
  const keepTr=Object.keys(TN2).filter(k=>S.traits[k]).map(k=>({label:TN2[k],key:k,neg:negK.includes(k)}));
  const remTr=(S.removed||[]).map(l=>({label:removedTraitLabel(l,S,teamNick),key:'',neg:false,rem:true}));
  /* キャリア成績列(每リーグ一列)。 */
  const leagues=['MLB','NPB','KBO','CPBL'].filter(b=>S.stats[b]);
  /* キャリア里程碑 + 名人堂資訊(加在栄誉最前面)。 */
  const milestones = [];
  const isPit = S.pos==='P';
  /* 名人堂入選資訊。 */
  if(S.hofInfo&&S.hofInfo.length){ S.hofInfo.forEach(h=>{
    milestones.push(`${h.lg}殿堂入り・${h.yr}年目,得票率${h.pct}%`); }); }
  /* 跨リーグキャリア合計里程碑。 */
  { let tG=0,tH=0,tHR=0,tRBI=0,tSB=0,tW=0,tSV=0,tHLD=0,tSO=0,tIP=0;
    ['CPBL','KBO','NPB','MLB'].forEach(b=>{ const st=S.stats[b]; if(!st)return;
      tH+=st.H||0;tHR+=st.HR||0;tRBI+=st.RBI||0;tSB+=st.SB||0;
      tW+=st.W||0;tSV+=st.SV||0;tHLD+=st.HLD||0;tSO+=st.SO||0;tIP+=st.IP||0; });
    if(isPit){
      if(tW>0||tSO>0)milestones.push(`リーグ横断通算：${tW}勝 ${tSO}奪三振 ${tSV}セーブ ${tHLD}ホールド`);
    }else{
      if(tH>0)milestones.push(`リーグ横断通算：${tHR}本塁打 ${tH}安打 ${tSB}盗塁`);
    }
  }
  /* 栄誉グループ化(に応じて年份)。 */
  const honors = milestones.slice();
  const aMap = {};
  S.honors.forEach(h => {
     const parts = h.split(' ');
     if(parts.length >= 2) { const yr = parts[0]; const awd = parts.slice(1).join(' ');
       if(!aMap[awd]) aMap[awd] = []; aMap[awd].push(yr);
     } else { if(!aMap[h]) aMap[h] = []; aMap[h].push(''); }
  });
  for(const awd in aMap) {
     const yrs = aMap[awd];
     if(yrs[0] !== '') {
       let nums = yrs.map(Number).sort((a,b)=>a-b);
       let res=[], st=nums[0], ed=nums[0];
       for(let i=1; i<=nums.length; i++){
         if(i<nums.length && nums[i]===ed+1){ ed=nums[i]; }
         else {
           if(ed-st>=2) res.push(`${st}~${ed}`);
           else if(ed-st===1) res.push(`${st},${ed}`);
           else res.push(`${st}`);
           if(i<nums.length){ st=nums[i]; ed=nums[i]; }
         }
       }
       if(yrs.length > 1) honors.push(`${awd} *${yrs.length} (${res.join(',')})`);
       else honors.push(`${awd} (${res[0]})`);
     } else {
       honors.push(`${awd}`);
     }
  }
  /* 年度別成績。 */
  const hist=S.log.slice();

  const W=920, PAD=34, scale=2;

  /* 改行計算のため,CanvasとContextを先に作り文字幅を測定。 */
  const cv=document.createElement('canvas');
  const c=cv.getContext('2d');
  c.font='13px sans-serif';

  /* 処理栄誉二欄改行。 */
  const colW=(W-PAD*2)/2, maxTextW=colW-20;
  const honorBlocks = honors.map(h => {
    let text = '· ' + h;
    let lines = []; let curr = '';
    for(let i=0; i<text.length; i++) {
      let test = curr + text[i];
      if(c.measureText(test).width > maxTextW && curr.length > 0) {
        lines.push(curr);
        curr = '  ' + text[i];
      } else { curr = test; }
    }
    if(curr) lines.push(curr);
    return lines;
  });
  const rows2=Math.ceil(honorBlocks.length/2);
  let leftH=0, rightH=0;
  honorBlocks.slice(0, rows2).forEach(b => leftH += b.length * 23);
  honorBlocks.slice(rows2).forEach(b => rightH += b.length * 23);
  const honorsTotalHeight = Math.max(leftH, rightH);
  /* 預估総高さ。 */
  const traitTags=keepTr.concat(remTr);
  c.font='12px sans-serif';
  let measuredTagX=PAD,tagRows=traitTags.length?1:0;
  traitTags.forEach(o=>{const width=c.measureText(o.label).width+16;if(measuredTagX+width>W-PAD&&measuredTagX>PAD){tagRows++;measuredTagX=PAD;}measuredTagX+=width+8;});
  let H=150; // header
  H+=30+tiers.length*24+14; // 評価。
  if(traitTags.length)H+=tagRows*26+4;
  H+=34+(leagues.length+1)*26+16; // 通算成績表。
  if(S.intlCount>0)H+=30+24+28+12; // 国際大会欄。
  H+=30+honorsTotalHeight+16; // 栄誉(二欄改行後的高さ)。

  const amaLogs = hist.filter(r => !r.st);
  const proLogs = hist.filter(r => r.st);
  if(amaLogs.length > 0) H += 34 + amaLogs.length * 20 + 24;
  if(proLogs.length > 0) H += 34 + proLogs.length * 20 + 24;

  H+=120; // Four income rows plus space for the seed/version footer.
  cv.width=W*scale; cv.height=H*scale;
  c.scale(scale,scale);
  const theme=getDisplayPreferences().theme,imageColor=getSharePalette(theme);
  c.fillStyle=imageColor.bg; c.fillRect(0,0,W,H);
  c.strokeStyle=imageColor.edge; c.lineWidth=3; c.strokeRect(10,10,W-20,H-20);
  c.textBaseline='top';
  const posN={P:roleN(S.role)+'投手',C:'捕手',IF:'内野手',OF:'外野手'}[S.pos];

  // Header
  c.fillStyle=imageColor.dim; c.font='13px sans-serif'; c.fillText('野球人生シミュレーター・引退記念',PAD,30);
  c.fillStyle=imageColor.accent; c.font='bold 36px sans-serif'; c.fillText(S.name,PAD,52);
  c.fillStyle=imageColor.text; c.font='15px sans-serif';
  c.fillText(`${primaryPos()}｜${playerType()}｜${hist.length?hist[0].y:'?'}–${S.year}｜引退時${S.age}歳${S.pos==='P'&&S.tjCount?`｜TJ×${S.tjCount}`:''}`,PAD,98);
  // 特性列(header 右方)。
  let y=126;
  function tagColor(o){
    if(o.rem)return {bg:'#f1eeee',bd:'#b7aaad',fg:'#81757a'};
    if(o.key==='legend'||o.key==='taiwan')return {bg:'#fff7dc',bd:'#c79520',fg:'#795b00'}; /* 金（歴史的選手・Team Taiwan）。 */
    if(o.key==='goldcloth')return {bg:'#fffbe0',bd:'#c5a800',fg:'#6f6000'}; /* 黄。 */
    if(o.key==='mrteam'){ const tc=TEAM_COLOR[S.mrTeamName]||imageColor.accent; return {bg:'#ffffff',bd:tc,fg:tc}; }
    if(o.key==='genius')return {bg:'#f3f5f8',bd:'#9aa5b5',fg:'#4c5868'}; /* 銀。 */
    if(o.neg)return {bg:'#fff0f0',bd:'#c0392b',fg:'#a71930'};             /* 赤。 */
    return {bg:'#fbe9ec',bd:'#c95b6c',fg:'#7f1d2d'};                      /* 赤系の標準特性。 */
  }
  function drawTags(items){ items.forEach(function(o){ const t=o.label, col=tagColor(o);
    const readable=shareTagPalette(col,theme);
    c.font='12px sans-serif'; const w=c.measureText(t).width+16;
    if(tagx+w>W-PAD&&tagx>PAD){tagx=PAD;y+=26;}
    c.fillStyle=col.bg; c.strokeStyle=col.bd; c.lineWidth=1;
    c.fillRect(tagx,y,w,20); c.strokeRect(tagx,y,w,20);
    c.fillStyle=readable.fg; c.fillText(t,tagx+8,y+3);
    if(o.rem){ c.strokeStyle=readable.fg; c.beginPath(); c.moveTo(tagx+4,y+10); c.lineTo(tagx+w-4,y+10); c.stroke(); }
    tagx+=w+8;
  }); }
  var tagx=PAD;
  if(traitTags.length){ drawTags(traitTags); y+=30; }
  c.font='13px sans-serif';c.fillStyle=imageColor.text;

  function hr(){ c.strokeStyle=imageColor.edge; c.lineWidth=1; c.beginPath(); c.moveTo(PAD,y); c.lineTo(W-PAD,y); c.stroke(); y+=12; }
  function sectionTitle(t){ c.fillStyle=imageColor.dim; c.font='bold 13px sans-serif'; c.fillText(t,PAD,y); y+=22; }

  // 評価。
  hr(); sectionTitle('通算評価');
  c.font='bold 16px sans-serif'; c.fillStyle=imageColor.accent;
  tiers.forEach(function(t){ c.fillText('★ '+t,PAD,y); y+=24; }); y+=6;

  // 通算成績表。
  hr(); sectionTitle('通算成績');
  const cols=isP?[['League',90],['Yrs',36],['G',48],['IP',54],['W',36],['L',36],['SV',48],['HLD',48],['SO',52],['BB',48],['ERA',52],['WHIP',54]]
                :[['League',80],['Yrs',34],['G',40],['PA',46],['AVG',48],['OBP',48],['SLG',48],['OPS',48],['H',44],['HR',38],['RBI',44],['SB',40],['DEF',40]];
  function row(cells,head){ let x=PAD; c.font=(head?'bold ':'')+'13px monospace'; c.fillStyle=head?imageColor.dim:imageColor.text;
    cells.forEach(function(cell,i){ c.fillText(String(cell),x,y); x+=cols[i][1]; }); y+=head?24:26; }
  row(cols.map(cc=>cc[0]),true);
  leagues.forEach(function(b){ const st=S.stats[b];
    if(isP){ const era=st.IP>0?(st.ER*9/st.IP).toFixed(2):'-'; const whip=st.IP>0?((st.H+st.BB)/st.IP).toFixed(2):'-';
      row([LG_N[b],st.yr,st.G,fmtIP(st.IP),st.W,st.L,st.SV||0,st.HLD||0,st.SO,st.BB||0,era,whip]); }
    else{
      const obpN = st.PA>0 ? (st.H+st.BB)/st.PA : 0;
      const slgN = slgOf(st);
      const avg = st.AB>0 ? (st.H/st.AB).toFixed(3).replace(/^0/,'') : '-';
      const obp = st.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-';
      const slg = st.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-';
      const ops = st.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
      row([LG_N[b],st.yr,st.G,st.PA,avg,obp,slg,ops,st.H,st.HR,st.RBI,st.SB,(st.DEF>0?'+':'')+(st.DEF||0)]); } });
  y+=6;

  // 国際大会通算成績。
  if(S.intlCount>0){ const IS=S.intlStat;
    hr(); sectionTitle('国際大会通算（日本代表 '+S.intlCount+' 大会）');
    const rowIntl=(cells,head)=>{ let x=PAD; c.font=(head?'bold ':'')+'13px monospace'; c.fillStyle=head?imageColor.dim:imageColor.text;
      cells.forEach(function(cell,i){ c.fillText(String(cell),x,y); x+=ic[i][1]; }); y+=head?24:28; };
    var ic;
    if(isP){ const era=IS.IP>0?(IS.ER*9/IS.IP).toFixed(2):'-';
      ic=[['',110],['G',80],['IP',86],['W',60],['SV',72],['SO',80],['ERA',80]];
      rowIntl(['', 'G', 'IP', 'W', 'SV', 'SO', 'ERA'], true);
      rowIntl(['',IS.G,fmtIP(IS.IP),IS.W,IS.SV,IS.SO,era],false);
    } else { const avg=IS.AB>0?(IS.H/IS.AB).toFixed(3).replace(/^0/,''):'-';
      ic=[['',110],['G',76],['PA',76],['AVG',76],['H',72],['HR',60],['RBI',72]];
      rowIntl(['', 'G', 'PA', 'AVG', 'H', 'HR', 'RBI'], true);
      rowIntl(['',IS.G,IS.PA,avg,IS.H,IS.HR,IS.RBI],false);
    }
    y+=6;
  }

  // 栄誉(横2列,長文は自動改行)。
  hr(); sectionTitle('通算タイトル（'+honors.length+' 件）');
  c.font='13px sans-serif'; c.fillStyle=imageColor.soft;
  let startY = y;
  let currY = startY;
  honorBlocks.forEach(function(b, i){
    const isRightCol = i >= rows2;
    if(i === rows2) currY = startY;
    const hx = PAD + (isRightCol ? colW : 0);
    b.forEach(line => { c.fillText(line, hx, currY); currY += 23; });
  });
  y += honorsTotalHeight + 8;

  // 年表(アマチュアとプロに分ける表格)。
  if(amaLogs.length > 0){
    hr(); sectionTitle('キャリア年表（アマチュア成績）');
    const hc=[['年',48],['年齢',40],['チーム',150],['成績',W-PAD*2-238]];
    let x=PAD; c.font='bold 12px monospace'; c.fillStyle=imageColor.dim;
    hc.forEach(function(h){ c.fillText(h[0],x,y); x+=h[1]; }); y+=20;
    c.font='11px monospace';
    amaLogs.forEach(function(r){ x=PAD; c.fillStyle=r.inj?imageColor.bad:imageColor.text;
      const cells=[String(r.y),String(r.age),r.tm,r.line];
      cells.forEach(function(cell,i){
        let t=String(cell); const maxw=hc[i][1]-8;
        while(c.measureText(t).width>maxw&&t.length>1)t=t.slice(0,-1);
        c.fillText(t,x,y); x+=hc[i][1]; }); y+=20; });
    y+=4;
  }
  if(proLogs.length > 0){
    hr(); sectionTitle('キャリア年表（プロ成績）');
    const hc = isP
      ? [['年',46],['年齢',36],['チーム',124],['G',45],['IP',55],['W',36],['L',36],['SV',42],['HLD',42],['SO',46],['BB',46],['ERA',52],['WHIP',54]]
      : [['年',46],['年齢',34],['チーム',120],['G',36],['PA',42],['AVG',46],['OBP',46],['SLG',46],['OPS',46],['H',40],['HR',36],['RBI',40],['SB',36],['DEF',40]];
    let x=PAD; c.font='bold 12px monospace'; c.fillStyle=imageColor.dim;
    hc.forEach(function(h){ c.fillText(h[0],x,y); x+=h[1]; }); y+=20;
    c.font='12px monospace';
    proLogs.forEach(function(r){ x=PAD; c.fillStyle=r.inj?imageColor.bad:imageColor.text;
      const tmS=r.tm;
      const s = r.st || {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0};
      let cells = [];
      if(isP){
        const era = s.IP>0 ? (s.ER*9/s.IP).toFixed(2) : '-';
        const whip = s.IP>0 ? ((s.H+s.BB)/s.IP).toFixed(2) : '-';
        cells=[String(r.y), String(r.age), tmS, String(s.G), fmtIP(s.IP), String(s.W), String(s.L), String(s.SV||0), String(s.HLD||0), String(s.SO), String(s.BB||0), era, whip];
      } else {
        const obpN = s.PA>0 ? (s.H+s.BB)/s.PA : 0;
        const slgN = slgOf(s);
        const avg = s.AB>0 ? (s.H/s.AB).toFixed(3).replace(/^0/,'') : '-';
        const obp = s.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-';
        const slg = s.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-';
        const ops = s.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
        cells=[String(r.y), String(r.age), tmS+(r.p?'·'+r.p:''), String(s.G), String(s.PA), avg, obp, slg, ops, String(s.H), String(s.HR), String(s.RBI), String(s.SB), String(s.DEF>0?'+'+s.DEF:s.DEF||0)];
      }
      cells.forEach(function(cell,i){
        let t=String(cell); const maxw=hc[i][1]-8;
        while(c.measureText(t).width>maxw&&t.length>1)t=t.slice(0,-1);
        c.fillText(t,x,y); x+=hc[i][1]; });
      y+=20;
    });
    y+=4;
  }

  c.fillStyle=imageColor.accent; c.font='bold 16px sans-serif';
  const income=incomeSummary(S),incomeGap=24,incomeWidth=(W-PAD*2-incomeGap)/2;
  function incomeCell(entry,x,width){
    const text=entry.label+' '+fmtMoney(entry.amount);
    let size=16;c.font='bold '+size+'px sans-serif';
    while(c.measureText(text).width>width&&size>6){size-=0.25;c.font='bold '+size+'px sans-serif';}
    c.fillText(text,x,y);
  }
  incomeCell(income[0],PAD,incomeWidth);incomeCell(income[1],PAD+incomeWidth+incomeGap,incomeWidth);y+=26;
  incomeCell(income[2],PAD,incomeWidth);incomeCell(income[3],PAD+incomeWidth+incomeGap,incomeWidth);y+=26;
  incomeCell(income[4],PAD,W-PAD*2);y+=26;
  incomeCell(income[5],PAD,W-PAD*2);y+=26;



  c.fillStyle=imageColor.dim; c.font='11px monospace'; c.fillText('seed: '+SEED,PAD,H-40);
  c.textAlign='right'; c.fillText(VERSION,W-PAD,H-40); c.textAlign='left';

  const url=cv.toDataURL('image/png');
  for(const previous of shareImagePreviews.keys())if(!previous.isConnected)shareImagePreviews.delete(previous);
  shareImagePreviews.set(out,{evals,theme});
  const fileName='野球人生リザルト_'+S.name+'.png';
  out.innerHTML=`<img src="${url}" style="width:100%;border-radius:8px" alt="引退リザルト画像">
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn main" id="sh-save" style="flex:1">💾 保存／画像を共有</button>
      <button class="btn" id="sh-dl" style="flex:1">端末へダウンロード</button>
    </div>
    <div class="statline" style="margin-top:6px">ボタンが使えない場合は,画像を長押しして保存できます</div>`;
  /* ダウンロードリンク（PC・予備）。 */
  out.querySelector('#sh-dl').onclick=()=>{ const a=document.createElement('a'); a.href=url; a.download=fileName;
    document.body.appendChild(a); a.click(); a.remove(); };
  /* 共有：Web Shareを優先(写真へ保存可能),非対応時はダウンロードへ切り替える。 */
  out.querySelector('#sh-save').onclick=async ()=>{
    try{
      const blob=await (await fetch(url)).blob();
      const file=new File([blob],fileName,{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:'野球人生リザルト',text:getState().name+' 野球人生'});
        return;
      }
    }catch(e){ if(e&&e.name==='AbortError')return; /* ユーザーによるキャンセル時はフォールバックしない。 */ }
    /* Web Share非対応時はダウンロードへ切り替える。 */
    const a=document.createElement('a'); a.href=url; a.download=fileName;
    document.body.appendChild(a); a.click(); a.remove();
  };
}

// International tournament call-ups for each PRE/POST phase (OOP plan §2s).
// The career state is read through getState; the international policy functions are passed by reference and the
// game.js schedule/selection/stat delegates, UI helpers and pick as late-binding lambdas. processInternationalPhase and
// completeInternationalEvent are the former game.js processIntlPhase/completeIntl bodies; each deferred unit reads getState() live.
export class InternationalTournament {
  #deps;
  constructor({getState,normalizeInternationalState,validateInternationalEntry,prepareInternationalResult,commitInternationalResult,INTLACE_UNLOCK_TEXT,internationalPersonalStats,renderInternationalPersonalStats,intlEvents,intlPhase,intlThreshold,intlSelection,addIntlStats,card,choose,displayTrait,fmtIP,pick}){
    this.#deps={getState,normalizeInternationalState,validateInternationalEntry,prepareInternationalResult,commitInternationalResult,INTLACE_UNLOCK_TEXT,internationalPersonalStats,renderInternationalPersonalStats,intlEvents,intlPhase,intlThreshold,intlSelection,addIntlStats,card,choose,displayTrait,fmtIP,pick};
  }
  process(phase,done){processInternationalPhase(this.#deps,phase,done);}
}

function completeInternationalEvent({getState},e,status,next){
  const S=getState();
  if(S.intlCompletedKeys[e.eventKey])return;
  if(status==='DECLINED')S.intlDeclinedCount++;
  S.intlCompletedKeys[e.eventKey]=true;S.intlLastEventKey=e.eventKey;S.intlDispatchStatus=null;next();
}
function processInternationalPhase(deps,phase,done){
  const {getState,normalizeInternationalState,validateInternationalEntry,prepareInternationalResult,commitInternationalResult,INTLACE_UNLOCK_TEXT,internationalPersonalStats,renderInternationalPersonalStats,intlEvents,intlPhase,intlThreshold,intlSelection,addIntlStats,card,choose,displayTrait,fmtIP,pick}=deps;
  const completeIntl=(e,status,next)=>completeInternationalEvent(deps,e,status,next);
  const S=getState();
  normalizeInternationalState(S);
  if(S.stage!=='PRO'){done();return;}
  const q=intlEvents(S.year).filter(e=>intlPhase(e)===phase&&!S.intlCompletedKeys[e.eventKey]);
  let i=0;
  const next=()=>{
    const S=getState();
    if(i>=q.length){done();return;}
    const e=q[i++],threshold=intlThreshold(e),selection=intlSelection(e);
    if(selection==='DENIED'){completeIntl(e,'DENIED',next);return;}
    if(selection==='INJURED'){
      card('info','日本代表招集見送り',`<b class="hl">${e.name}</b>の代表候補に入ったが、負傷またはリハビリ中のため招集は見送られた。`);
      completeIntl(e,'DENIED',next);return;
    }
    S.intlDispatchStatus='PENDING';
    const entryState=S;
    let prepared=null,continued=false,resultRendered=false,unlockRendered=false;
    choose(`日本代表招集・${e.name}`,[
      {t:'日本代表として出場',main:true,s:`代表基準：総合${threshold}以上`,f:()=>{
        const S=getState();
        if(S!==entryState||continued||(S.intlCompletedKeys[e.eventKey]&&!prepared))return;
        validateInternationalEntry(S);
        if(!prepared){
          const beforeStats={...S.intlStat},position=S.pos,role=S.role;
          const hadIntlace=Boolean(S.traits.intlace),rank=pick(['優勝','準優勝','ベスト4','ベスト8']),stats=addIntlStats();
          const personalStats=internationalPersonalStats(beforeStats,stats,position,role);
          prepared=prepareInternationalResult(S,e,{rank,stats,hadIntlace,personalStats});
        }
        const {result}=commitInternationalResult(S,prepared);
        if(!resultRendered){
          card(result.rank==='優勝'?'gold':'info',e.name,`日本代表は<b class="hl">${result.rank}</b>。能力点+${result.awardedPoints}。${result.injuryAdded?'大会の疲労により次回の故障率+10%。':'大会による故障リスク加算なし。'}`+renderInternationalPersonalStats(result.personalStats,fmtIP));
          resultRendered=true;
        }
        if(result.unlockedIntlace&&!unlockRendered){card('gold','隠し特性解放：'+displayTrait('intlace'),INTLACE_UNLOCK_TEXT);unlockRendered=true;}
        continued=true;next();
      }},
      {t:'コンディションを優先して辞退',warn:true,f:()=>{const S=getState();if(S!==entryState||continued)return;continued=true;completeIntl(e,'DECLINED',next);}}
    ]);
  };
  next();
}

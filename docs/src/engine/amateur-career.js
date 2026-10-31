// Amateur career path and domestic tournament seasons (OOP plan §2y).
// The career state is read through getState; DATA and LV are passed by reference because the overlay only changes them in
// place. setSchool, setAmateur and runDraft stay in game.js with the contract domain and arrive with the other game.js
// names as late-binding lambdas, so reportFlowOutcome stays the only exit to the year flow. Bodies are the former game.js
// ones; the deferred choose options that touch S read getState() live.
import { isDraftFallbackResult } from './draft-signing-policy.js';
import { createSigningBonusTerms } from './signing-bonus-policy.js';
import { schoolCompetitionBonus } from './school-policy.js';
import { TRAIT_TEXT, highSchoolChampionCount } from './trait-policy.js';
import { beginEventSeason, consumeEventSeason } from './event-state-policy.js';
import { canPlayHighSchoolFall, canPlaySenbatsu, nextSenbatsuEligibleYear, qualificationResult, qualifiesForChampionship, qualifiesForCorporateJapan, qualifiesForUniversityJingu, tournamentResult } from './domestic-tournament-policy.js';

export class AmateurCareer {
  #rules;
  constructor(deps){this.#rules=amateurCareerRules(deps);}
  enterDraftPath(from){this.#rules.enterDraftPath(from);}
  draftFallback(from){this.#rules.draftFallback(from);}
  pathChoiceHS(){this.#rules.pathChoiceHS();}
  pathChoiceU4(){this.#rules.pathChoiceU4();}
  amateurSeason(){this.#rules.amateurSeason();}
}

function amateurCareerRules({getState,DATA,LV,ovr,fmtMoney,salaryFor,listByOrg,signTo,choose,card,traitCard,displayTrait,setSchool,setAmateur,runDraft,reportFlowOutcome,nextStep,maybeIntl,recordIndependentSalaryEvaluation,rng:{R,ri}}){
  function enterDraftPath(from){runDraft(false,result=>{if(result==='signed'){reportFlowOutcome({kind:'AMATEUR_DRAFTED'});return;}if(isDraftFallbackResult(result)){draftFallback(from);return;}throw new Error('UNKNOWN_DRAFT_RESULT:'+result);});}
  function draftFallback(from){const opts=[];if(from==='HS')opts.push({t:'大学へ進学',main:true,f:()=>{const S=getState();S.stage='U';S.stageYr=0;setSchool('U');reportFlowOutcome({kind:'AMATEUR_ENTER_UNIVERSITY'});}});opts.push({t:'社会人野球へ',f:()=>{setAmateur('CORP');reportFlowOutcome({kind:'AMATEUR_JOIN_CORP'});}},{t:'独立リーグへ',f:()=>{setAmateur('IND');reportFlowOutcome({kind:'AMATEUR_JOIN_IND'});}},{t:'野球をやめる',warn:true,f:()=>reportFlowOutcome({kind:'AMATEUR_RETIRED',reason:'ドラフト指名漏れを機に現役を退いた。'})});choose('指名漏れ、その後',opts);}

  function pathChoiceHS(){
    const o=ovr(),opts=[
      {t:'NPBドラフトへ',main:true,f:()=>enterDraftPath('HS')},
      {t:'大学へ進学',f:()=>{const S=getState();S.stage='U';S.stageYr=0;setSchool('U');reportFlowOutcome({kind:'AMATEUR_ENTER_UNIVERSITY'});}},
      {t:'社会人野球へ',f:()=>{setAmateur('CORP');reportFlowOutcome({kind:'AMATEUR_JOIN_CORP'});}},
      {t:'独立リーグへ',f:()=>{setAmateur('IND');reportFlowOutcome({kind:'AMATEUR_JOIN_IND'});}}
    ];
    if(o>=50){
      const lv=o>=54?'A1':'R';
      opts.push({t:'米国プロ組織と契約する',s:`MLB球団傘下の${LV[lv].n}から挑戦`,f:()=>{
        const pool=listByOrg('MiLB').slice(),offers=[];
        const count=ri(2,3);
        while(offers.length<count&&pool.length)offers.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
        choose('MiLB国際契約オファー',offers.map(rec=>({
          t:`${rec.name}（${LV[lv].n}）`,
          s:`高校卒業後、米国の育成組織からスタート｜年俸${fmtMoney(salaryFor(lv,0))}｜契約金${fmtMoney(createSigningBonusTerms({route:'INTERNATIONAL_AMATEUR',overall:o}).signingBonus)}`,
          f:()=>{signTo('MiLB',lv,rec.teamId,ri(3,4),1,'NEW_CONTRACT',{contractType:'ROOKIE'});reportFlowOutcome({kind:'AMATEUR_SIGNED_MILB'});}
        })));
      }});
    }
    choose(`高校卒業・総合能力${o}――人生最初の分岐点`,opts);
  }
  function pathChoiceU4(){choose(`大学卒業・総合能力${ovr()}`,[{t:'NPBドラフトへ',main:true,f:()=>enterDraftPath('U')},{t:'社会人野球へ',f:()=>{setAmateur('CORP');reportFlowOutcome({kind:'AMATEUR_JOIN_CORP'});}},{t:'独立リーグへ',f:()=>{setAmateur('IND');reportFlowOutcome({kind:'AMATEUR_JOIN_IND'});}},{t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'AMATEUR_RETIRED',reason:'大学卒業を機に現役を退いた。'})}]);}

  function cupOnce(key,name,klass,{pointMode='STANDARD'}={}){
    const S=getState();
    const doneKey=key+':'+S.year;if(S.domesticCompletedKeys[doneKey])return null;
    const bonus=schoolCompetitionBonus(S.stage,S.schoolTier),overall=ovr(),power=overall+beginEventSeason(S).form+bonus+ri(-8,8),national=klass.startsWith('NATIONAL');
    const result=tournamentResult({power,national,overall,pointMode});
    S.pool+=result.points;S.domesticCompletedKeys[doneKey]=true;
    S.domesticTournamentLog.push({year:S.year,key,result:result.result,deemedGames:result.deemedGames,points:result.points,amaD:result.amaD,injury:false});
    if(result.isChampion)S.honors.push(`${S.year} ${name}優勝`);
    if(S.stage==='HS'&&!S.traits.miraclegen&&highSchoolChampionCount(S)>=4)traitCard('miraclegen',displayTrait('miraclegen'),TRAIT_TEXT.miraclegen);
    return {...result,key,html:`${name}：<b class="hl">${result.result}</b>（能力点+${result.points}）`};
  }
  function qualifierOnce(key,name){
    const S=getState();
    const doneKey=key+':'+S.year;if(S.domesticCompletedKeys[doneKey])return null;
    const bonus=schoolCompetitionBonus(S.stage,S.schoolTier),result=qualificationResult(ovr()+beginEventSeason(S).form+bonus+ri(-8,8));
    S.domesticCompletedKeys[doneKey]=true;
    S.domesticTournamentLog.push({year:S.year,key,result:result.result,deemedGames:result.deemedGames,points:0,amaD:0,injury:false});
    return {...result,html:`${name}：<b class="hl">${result.result}</b>（能力点なし）`};
  }
  function amateurSeason(){const S=getState();beginEventSeason(S);if(S.seasonFactor===0){consumeEventSeason(S);card('bad','','今季はリハビリに専念した。');S.log.push({y:S.year,age:S.age,tm:S.team,line:'全休',inj:true});nextStep();return;}const results=[];
    const add=result=>{if(result)results.push(result);return result;};
    if(S.stage==='HS'){
      if(canPlaySenbatsu(S.stageYr,S.senbatsuEligibleYear,S.year)){add(cupOnce('HS_SENBATSU','選抜高校野球大会','NATIONAL6'));S.senbatsuEligibleYear=null;}
      const summer=add(cupOnce('HS_SUMMER_LOCAL','夏の地方大会','LOCAL'));
      if(qualifiesForChampionship(summer))add(cupOnce('HS_KOSHIEN','全国高校野球選手権大会','NATIONAL6'));
      if(canPlayHighSchoolFall(S.stageYr)){const fall=add(cupOnce('HS_FALL','秋季地区大会','LOCAL'));S.senbatsuEligibleYear=nextSenbatsuEligibleYear(fall,S.year);}
    }else if(S.stage==='U'){
      const spring=add(cupOnce('U_SPRING','春季リーグ戦','LEAGUE10',{pointMode:'UNIVERSITY'}));
      if(qualifiesForChampionship(spring))add(cupOnce('U_CHAMP','全日本大学野球選手権大会','NATIONAL5',{pointMode:'UNIVERSITY'}));
      const autumn=add(cupOnce('U_AUTUMN','秋季リーグ戦','LEAGUE10',{pointMode:'UNIVERSITY'}));
      if(qualifiesForChampionship(autumn)){
        const university=DATA.universities.find(record=>record.schoolId===S.schoolId),route=university?.jinguRoute;
        if(qualifiesForUniversityJingu(autumn,route,null))add(cupOnce('U_JINGU','明治神宮大会・大学の部','NATIONAL4',{pointMode:'UNIVERSITY'}));
        else if(route==='PLAYOFF'){const qualifier=add(qualifierOnce('U_JINGU_QUAL','明治神宮大会地区代表決定戦'));if(qualifiesForUniversityJingu(autumn,route,qualifier))add(cupOnce('U_JINGU','明治神宮大会・大学の部','NATIONAL4',{pointMode:'UNIVERSITY'}));}
      }
    }else if(S.stage==='CORP'){
      const jaba=add(cupOnce('JABA_REGIONAL','JABA地区大会','NATIONAL5'));
      const cityQualifier=add(qualifierOnce('CORP_CITY_QUAL','都市対抗地区予選'));
      const city=cityQualifier?.isQualified?add(cupOnce('CORP_CITY','都市対抗野球大会','NATIONAL5')):null;
      let japanQualified=qualifiesForCorporateJapan(jaba,city,null);
      if(!japanQualified){const japanQualifier=add(qualifierOnce('CORP_JAPAN_QUAL','日本選手権地区最終予選'));japanQualified=qualifiesForCorporateJapan(jaba,city,japanQualifier);}
      if(japanQualified)add(cupOnce('CORP_JAPAN','社会人野球日本選手権大会','NATIONAL5'));
    }else{
      const regular=add(cupOnce('IND_REGULAR','独立リーグ公式戦','LEAGUE70'));
      if(qualifiesForChampionship(regular))add(cupOnce('IND_CHAMP','グランドチャンピオンシップ','NATIONAL5'));
    }
    if(S.stage==='IND')recordIndependentSalaryEvaluation(results);
    consumeEventSeason(S);
    const rows=results.map(result=>result.html);S.log.push({y:S.year,age:S.age,tm:S.team,line:rows.map(x=>x.replace(/<[^>]+>/g,'')).join('、'),inj:false});card('','国内大会',rows.join('<br>'));maybeIntl(()=>nextStep());}
  return {enterDraftPath,draftFallback,pathChoiceHS,pathChoiceU4,amateurSeason};
}

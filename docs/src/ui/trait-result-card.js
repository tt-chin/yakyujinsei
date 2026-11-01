import {TRAIT_LABELS,TRAIT_TEXT} from '../engine/trait-policy.js';
import {EVENT_TRAIT_TEXT} from '../engine/event-policy.js';

// Result-card decoration for hidden traits (OOP plan §2gg): marks the card node and rewrites title/html.
// The career state is read on every call through getState. traitPresentation is the game.js WeakMap, passed by reference.
// Writes node.dataset and the traitPresentation entry for S; never writes S and uses no RNG.
export class TraitResultCard {
  #getState;#deps;
  constructor({getState,traitPresentation,displayTrait}){
    this.#getState=getState;this.#deps={traitPresentation,displayTrait};
  }
  decorate(node,title,html){const S=this.#getState(),{traitPresentation,displayTrait}=this.#deps;
    const lost={'ゴムゴムの腕、ついに限界':'rubber','結果で黙らせる':'cancer','一芸特化を返上':'onetool','イップス克服':'yips'}[title];
    if(lost){node.dataset.traitResult='removed:'+lost;node.dataset.traitName=displayTrait(lost);return {title,html};}
    if(!/^隠し(?:特性解放|称号|タイトル)[:：]/.test(title||''))return {title,html};
    const name=title.replace(/^隠し(?:特性解放|称号|タイトル)[:：]/,'');
    const key=Object.keys(TRAIT_LABELS).find(k=>name===displayTrait(k)||name===TRAIT_LABELS[k])||(name==='神カード'?'franchise':null);
    if(!key)return {title,html};
    let shown=traitPresentation.get(S);if(!shown){shown=new Set(Object.keys(S.traits||{}).filter(k=>S.traits[k]));traitPresentation.set(S,shown);}
    const label=displayTrait(key);
    if(!S.traits?.[key]||shown.has(key))return {title:label,html:''};
    node.dataset.traitResult=key;node.dataset.traitName=label;
    const effect=EVENT_TRAIT_TEXT[key]||TRAIT_TEXT[key];
    const reasons={favorite:'25歳未満で通常選択に累計10回成功。',adking:'スポンサーイベントの勝負選択に累計5回成功。',clutch:'25歳未満で勝負選択に累計7回成功。',disc:'25歳未満で安全選択に累計15回成功し、私生活の条件を達成。',distract:'私生活と間食の累計が取得条件に到達。',cancer:'対人イベントの失敗または私生活の悪評により取得。'};
    if(reasons[key]&&html===effect)html=reasons[key]+'<br>'+html;
    const memorial=['confidante','goldcloth','miraclegen','strongpitch','stronghit','legend','smallschool','grinder','rainbow','taiwan'];
    const plain=String(html).replace(/<[^>]*>/g,'');
    const completeIntlace=key==='intlace'&&/次回/.test(plain)&&/最低2点/.test(plain)&&/故障リスク/.test(plain);
    if(effect&&!plain.includes(effect)&&!completeIntlace)html+='<br>'+effect;
    else if(memorial.includes(key)&&!/(追加効果|記念称号)/.test(plain))html+='<br>能力への追加効果はない記念称号です。';
    if(key==='mrteam')html+='<br>球団がトレードを拒否する、非売品の扱いになります。';
    if(key==='onetool')html+='<br>得意分野での出場機会を追加する起用補正があります。';
    const starts={favorite:'成功率の補正は次のイベント選択から適用されます。',clutch:'成功率・分類別効果の補正は次のイベント選択から適用されます。',latepractice:'成功率の補正は次のイベント選択から適用されます。',adking:'収入の補正は次のスポンサーイベントから適用されます。',disc:'シーズン前の衰え判定に適用されます。',distract:'サイコロの減少は次のシーズン前トレーニングから適用されます。'};
    if(starts[key])html+='<br>'+starts[key];
    return {title:'隠し特性解放：'+label,html};
  }
}

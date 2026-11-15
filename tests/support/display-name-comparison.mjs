// NAME-03/04/07/08/09: approved display strings only. Never call on S or RNG.
// Frozen old/new pairs are explicit; unrelated copy, whitespace and numeric values stay strict.
export function projectDisplayNameCopy(text,mrteam=null){
 if(typeof text!=='string')throw Error('DISPLAY_COPY_STRING_REQUIRED');
 const pairs=[['発展途上型','期待の若手'],['スイングマン','スインガー'],['ユーティリティープレーヤー','ツールマン'],['タイトルに戻る','最初からやり直す']];
 for(const league of ['NPB','MLB','KBO','CPBL'])for(const [a,b] of [['殿堂','殿堂'],['スター選手','スター選手'],['レギュラー選手','デイリープレイヤー'],['一軍定着に届かず','フリンジプレイヤー'],['実績を残せず','ページ上の乗客']])pairs.push([league+' '+a,league+b]);
 if(mrteam){if(mrteam.length!==2||mrteam.some(v=>typeof v!=='string'||!v.endsWith('ミスター')&&!v.startsWith('ミスター')))throw Error('MR_COPY_PAIR');if(mrteam[0]!==mrteam[1])pairs.push(mrteam);}
 for(const [current,old] of pairs)text=text.split(current).join(old);
 return text;
}

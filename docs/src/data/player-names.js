// Approved PLAYER_RANDOM_NAME_LIST.md (2026-11-15). Names carry no game effects.
export const PLAYER_FAMILY_NAMES=Object.freeze(["王","長嶋","野村","落合","張本","山本","衣笠","門田","福本","若松","田淵","山内","広瀬","吉田","豊田","榎本","古田","松井","金本","秋山","原","掛布","野茂","工藤","佐々木","岩瀬","村田","北別府","稲尾","大谷","ダルビッシュ","田中","松坂","前田","千賀","黒田","藤川","阿部","城島","坂本","青木","内川","柳田","山田","鈴木","村上"]);
export const PLAYER_GIVEN_NAMES=Object.freeze(["貞治","茂雄","克也","博満","勲","浩二","祥雄","博光","豊","勉","幸一","一弘","叔功","義男","泰光","喜八","敦也","秀喜","知憲","幸二","辰徳","雅之","英雄","公康","昌","主浩","仁紀","兆治","学","和久","翔平","有","将大","大輔","健太","由伸","朗希","滉大","博樹","球児","慎之助","健司","勇人","宣親","聖一","悠岐","哲人","誠也","正尚","宗隆"]);

// Rejection sampling avoids modulo bias; this never reads or advances the career RNG.
export function randomNameIndex(length,cryptoRef=globalThis.crypto){
  if(!Number.isInteger(length)||length<1||length>0x100000000)throw new RangeError('Invalid name pool length');
  const limit=Math.floor(0x100000000/length)*length,word=new Uint32Array(1);
  do{cryptoRef.getRandomValues(word);}while(word[0]>=limit);
  return word[0]%length;
}
export function generatePlayerName({randomIndex=randomNameIndex}={}){
  return PLAYER_FAMILY_NAMES[randomIndex(PLAYER_FAMILY_NAMES.length)]+PLAYER_GIVEN_NAMES[randomIndex(PLAYER_GIVEN_NAMES.length)];
}

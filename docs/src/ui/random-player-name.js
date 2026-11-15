import {generatePlayerName} from '../data/player-names.js';

// Home input only: neither career state nor the seeded RNG is accessed here.
export function bindRandomPlayerName({input,button,generateName=generatePlayerName}){
  button.onclick=()=>{
    if(button.disabled)return;
    let name;
    for(let attempt=0;attempt<5;attempt++){
      name=generateName();
      if(name!==input.value)break;
    }
    if(name===input.value)return;
    input.value=name;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  };
  button.disabled=false;
}

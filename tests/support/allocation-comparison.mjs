import {projectDecisionPresentation} from './decision-dom-comparison.mjs';

// Browser-only test adapter. Validate the approved UI before reading legacy
// labels/choices. It never alters live game nodes, state, RNG, baselines or decisions.
export function installAllocationComparison(project,getState,getPending){
  window.__phase3Pending=getPending;
  const original=()=>{
    const act=document.getElementById('act');
    if(!act.hasAttribute('data-allocation-session')&&!act.querySelector(':scope > .title > .event-badge'))return null;
    const template=document.createElement('template');
    template.innerHTML=project(act.outerHTML,'act',getState());
    return template.content.firstElementChild;
  };
  // Capture the independent starting state before the first allocation input,
  // including suites that do not record a frame immediately after entering.
  const nativeAllocation=allocUI;
  allocUI=function(...args){const result=nativeAllocation(...args);original();return result;};
  window.__allocationComparison={
    action(node,property='textContent'){
      if(!['textContent','innerText'].includes(property))throw Error('ALLOCATION_COMPARISON_PROPERTY');
      const projected=original();
      if(!projected)return node[property];
      if(node.matches('.abrow'))return node.querySelector('.abrow-info')[property];
      if(node.matches('#al-btm .main'))return projected.querySelector('#al-btm .main').textContent;
      return node[property];
    },
    choices(){const act=original()||document.getElementById('act');return [...act.querySelectorAll('.abrow,button')].map(node=>({text:node.textContent,disabled:node.disabled??node.getAttribute('aria-disabled')}));},
    areaText(){
      const projected=original(),act=document.getElementById('act');
      if(!projected)return act.innerText;
      // innerText needs real layout. Isolate the verified old markup offscreen;
      // opacity keeps text rendered, while inert/ARIA prevent interaction.
      const host=document.createElement('div');host.setAttribute('aria-hidden','true');host.inert=true;
      Object.assign(host.style,{position:'fixed',left:'-100000px',top:'0',width:act.clientWidth+'px',opacity:'0',pointerEvents:'none'});
      projected.style.setProperty('position','static','important');projected.style.setProperty('display','block','important');projected.style.setProperty('max-height','none','important');projected.style.setProperty('overflow','visible','important');
      host.append(projected);document.body.append(host);
      try{return projected.innerText;}finally{host.remove();}
    }
  };
}

export const allocationComparisonHook='\n('+installAllocationComparison.toString()+')('+projectDecisionPresentation.toString()+',()=>S,()=>typeof choiceViews==="undefined"?null:choiceViews.get(S));\n';

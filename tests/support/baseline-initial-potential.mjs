// Approved v1.11.6 compatibility oracle, for positive historical UI comparisons only.
// The baseline factory captures birth potential before any phase/event can change it.
// Never use this for old-bug negative controls. Unadapted before/after S/R comparisons
// remain in stage10-risk-e2e --compare=<pre-fix SHA>, including raw final states.
import {withApprovedSchoolChanges} from './approved-school-oracle.mjs';
export function withApprovedBirthSnapshot(source){
  source=withApprovedSchoolChanges(source);
  const at=source.lastIndexOf('})();');
  if(at<0)throw Error('Baseline overlay missing');
  const hook=`\nconst baselineInitialState=newState;newState=function(...args){const state=baselineInitialState(...args);if(!Object.hasOwn(state,'potSum0'))state.potSum0=Object.values(state.pot).reduce((sum,value)=>sum+value,0);return state;};\n`;
  return source.slice(0,at)+hook+source.slice(at);
}

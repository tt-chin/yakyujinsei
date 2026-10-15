import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateG2} from '../tools/development-a/g2-validation.js';
const {vectors}=JSON.parse(fs.readFileSync('tools/development-a/g2-vectors.json','utf8'));
const state=Object.freeze({rngState:123,seed:'unchanged',honors:Object.freeze([])});
const before=JSON.stringify(state),oldRandom=Math.random;let randomCalls=0;
Math.random=()=>{randomCalls++;throw Error('Unexpected random draw');};
let result;try{result=validateG2(vectors);}finally{Math.random=oldRandom;}
assert.equal(result.FAIL,0,JSON.stringify(result.cases.filter(c=>c.status==='FAIL')));
assert.equal(randomCalls,0);assert.equal(JSON.stringify(state),before);
const source=fs.readFileSync('docs/src/engine/award-rng-policy.js','utf8');
assert(!/\b(?:import|Math\.random|Date\.|crypto\.|rngState|R\s*\()/.test(source.replace(/\/\/[^\n]*/g,'')), 'No main engine/RNG dependencies');
console.log(JSON.stringify({...result,randomCalls,mainRngDependency:'NONE',cases:undefined}));

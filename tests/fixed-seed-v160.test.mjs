import assert from 'node:assert/strict';
import fs from 'node:fs';

const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const rngBlock=game.slice(game.indexOf('function seedInit'),game.indexOf('function clamp'));
assert.match(rngBlock,/Math\.imul\(_s \^ str\.charCodeAt\(i\), 3432918353\)/);
assert.match(rngBlock,/_s = _s \+ 0x6D2B79F5 \|0/);
assert.match(rngBlock,/const ri=\(a,b\)=>a\+Math\.floor\(R\(\)\*\(b-a\+1\)\)/);
assert.match(rngBlock,/const chance=p=>R\(\)\*100<p/);

function seedState(value){let state=1779033703;for(let i=0;i<value.length;i++){state=Math.imul(state^value.charCodeAt(i),3432918353);state=state<<13|state>>>19;}return state>>>0;}
function sample(seed){let state=seedState(seed),values=[];for(let i=0;i<64;i++){state=(state+0x6D2B79F5)>>>0;let value=state;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);values.push(((value^value>>>14)>>>0)/4294967296);}return{state,head:values.slice(0,3).map(x=>x.toFixed(10)),tail:values.slice(-3).map(x=>x.toFixed(10))};}
const expected={
  'yakyo-test-001':[1413371370,['0.5633388136','0.6992402999','0.3929068928'],['0.9156169253','0.1064816769','0.8464378221']],
  'jp3-pitcher-02':[2703546615,['0.4378704100','0.9516962294','0.0864410615'],['0.5755883476','0.0057951133','0.2008750460']],
  'jp3-pitcher-03':[1724838539,['0.6348904979','0.0739317404','0.1689740673'],['0.0683583855','0.8898831792','0.3557463717']],
  'jp3-catcher-01':[1524044326,['0.7591846746','0.7798141157','0.1501698738'],['0.3885774461','0.3493518466','0.6101233535']],
  'jp3-infielder-01':[2345835546,['0.6748839472','0.6108552928','0.8802108564'],['0.5968839068','0.7516438861','0.2288314560']],
  'jp3-outfielder-01':[2977884693,['0.3409292928','0.5346552909','0.5718218323'],['0.3876580282','0.9362110393','0.7323834505']],
};
for(const [seed,[state,head,tail]] of Object.entries(expected))assert.deepEqual(sample(seed),{state,head,tail});
const alloc=game.slice(game.indexOf('function allocUI'),game.indexOf('function nextStep'));
assert.doesNotMatch(alloc,/\b(?:R|ri|pick|chance)\s*\(/);
assert.match(game,/base\+'\?seed='\+encodeURIComponent\(SEED\)/);
assert.doesNotMatch(game,/[?&](?:rv|rules)=/);
console.log('v1.6.0 six-seed RNG and seed-only URL checks passed.');

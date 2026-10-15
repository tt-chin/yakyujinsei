// All target HOF leagues, independent of the honor's original prefix. Read-only.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {AWARD_REGISTRY} from '../../docs/src/engine/award-identity-policy.js';
import {honorScoreFor} from '../../docs/src/engine/hall-of-fame-policy.js';
const raw=execFileSync('git',['show','efd4710c4c5c366ff3aba69c59180031c82ff18a:docs/src/engine/hall-of-fame-policy.js'],{encoding:'utf8'});
const old=await import('data:text/javascript;base64,'+Buffer.from(raw).toString('base64'));
const names=[...new Set(Object.values(AWARD_REGISTRY).flatMap(r=>[r.displayName,...r.aliases]).concat([
 '年度MVP','MVP','守備王','出塁王','最多勝','最優秀防御率','ゴールデングラブ','最優秀守備選手',
 '最佳投手','打擊王','全壘打王','金手套','澤村賞','賽揚賞','勝投王','上壘王',
 '年度最佳投手','救援王','中繼王','三振王','盜壘王','打點王','ホールド王','盗み王','賽揚獎']))];
let pass=0;
for(const bucket of ['NPB','KBO','CPBL','MLB'])for(const name of names)for(const label of ['','NPB','KBO','台湾プロ野球','メジャーリーグ','CPBL','MLB','中職','日職','韓職','美職'])for(const prefix of ['2039 ','2038 ','']){
 const text=prefix+label+name,honors=Object.freeze([text]),input={bucket,honors,position:'P'};
 const expected=old.honorScoreFor(input),actual=honorScoreFor(input);assert.deepEqual(actual,expected,'native historical HOF '+bucket+'/'+text);
 assert.deepEqual(honors,[text]);pass++;
 console.log(JSON.stringify({status:'PASS',originalName:text,consumer:'HOF',targetLeague:bucket,A:expected,B:actual}));
}
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_A_B_HOF_ALL_TARGET_LEAGUES; no historical rewrite or new-Decision inference'}));

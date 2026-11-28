// COPY-029: share PNG 「主要4リーグ一軍通算」 sums only NPB1／MLB／KBO1／CPBL1 from statsByLevel.
// Second teams, development, MiLB, independent and corporate records stay out; unverifiable buckets are skipped.
import assert from 'node:assert/strict';
import {firstTeamCareerMilestone} from '../docs/src/ui/share-image.js';

const stat=values=>({yr:1,G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,SO:0,ER:0,IP:0,DEF:0,...values});
const levels=values=>({NPB1:null,NPB2:null,NPB_DEV:null,KBO1:null,KBO2:null,CPBL1:null,CPBL2:null,MLB:null,A3:null,A2:null,A1:null,R:null,IND:null,CORP:null,...values});
const run=state=>{const before=structuredClone(state);const line=firstTeamCareerMilestone(state);assert.deepEqual(state,before,'read-only');return line;};
const huge=stat({H:900,HR:900,SB:900,W:900,SV:900,HLD:900,SO:900});

// Batter: NPB1 + MLB count; NPB2／NPB_DEV／KBO2／A3／IND／CORP and S.stats do not.
assert.equal(run({pos:'SS',stats:{NPB:huge,MLB:huge,KBO:huge},statsByLevel:levels({
  NPB1:stat({H:150,HR:20,SB:10}),MLB:stat({H:50,HR:5,SB:3}),
  NPB2:huge,NPB_DEV:huge,KBO2:huge,CPBL2:huge,A3:huge,IND:huge,CORP:huge})}),
  '主要4リーグ一軍通算：25本塁打 200安打 13盗塁');

// Pitcher across CPBL1 and KBO1, with saves and holds.
assert.equal(run({pos:'P',stats:{},statsByLevel:levels({
  CPBL1:stat({W:30,SO:300,SV:10,HLD:5,IP:400}),KBO1:stat({W:12,SO:150,SV:2,HLD:20,IP:200}),KBO2:huge})}),
  '主要4リーグ一軍通算：42勝 450奪三振 12セーブ 25ホールド');

// Only non-first-team records: hidden, even though the old S.stats total would have shown a line.
assert.equal(run({pos:'CF',stats:{NPB:stat({H:300,HR:40})},statsByLevel:levels({NPB2:stat({H:200}),NPB_DEV:stat({H:100,HR:40})})}),null);
assert.equal(run({pos:'P',stats:{NPB:stat({W:20,SO:200})},statsByLevel:levels({NPB2:stat({W:20,SO:200}),A3:huge})}),null);

// Missing statsByLevel: hidden, never inferred from S.stats.
assert.equal(run({pos:'1B',stats:{NPB:stat({H:500})}}),null);
assert.equal(run({pos:'P',stats:{MLB:stat({W:50,SO:500})}}),null);

// A bucket with a missing or non-finite required value is skipped; the verifiable one still counts.
assert.equal(run({pos:'LF',stats:{},statsByLevel:levels({NPB1:stat({H:100,HR:10,SB:5}),MLB:{...stat({H:999,HR:99}),RBI:undefined},KBO1:stat({H:Infinity})})}),
  '主要4リーグ一軍通算：10本塁打 100安打 5盗塁');
assert.equal(run({pos:'P',stats:{},statsByLevel:levels({NPB1:{...stat({W:99,SO:999}),IP:Number.NaN},CPBL1:stat({W:3,SO:40,IP:60})})}),
  '主要4リーグ一軍通算：3勝 40奪三振 0セーブ 0ホールド');
assert.equal(run({pos:'P',stats:{},statsByLevel:levels({NPB1:{...stat({W:99,SO:999}),IP:Number.NaN}})}),null);

// First-team seasons with nothing to show keep the existing thresholds (batter H>0, pitcher W>0 or SO>0).
assert.equal(run({pos:'C',stats:{},statsByLevel:levels({NPB1:stat({HR:0,H:0,SB:4})})}),null);
assert.equal(run({pos:'P',stats:{},statsByLevel:levels({MLB:stat({SO:1})})}),'主要4リーグ一軍通算：0勝 1奪三振 0セーブ 0ホールド');
assert.equal(run({pos:'P',stats:{},statsByLevel:levels({MLB:stat({SV:5,HLD:5})})}),null);

console.log('share-first-team-milestone: PASS');

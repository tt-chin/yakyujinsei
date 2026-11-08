import assert from 'node:assert/strict';
import {YearFlow} from '../docs/src/engine/year-flow.js';
import {CareerSession} from '../docs/src/engine/career-session.js';
let checks=0;const state={year:2030,age:20},session=new CareerSession(),handoffs=new WeakMap(),h={status:'STARTED',targetYear:2030,fromYear:2029};handoffs.set(state,new Map([[2029,h]]));let draws=0;const events=[];
const flow=new YearFlow({getState:()=>state,careerSession:session,yearHandoffs:handoffs,yearSteps:()=>[()=>{assert.equal(h.status,'COMMITTED');draws++;events.push('first');}],divider:()=>events.push('divider'),stageLabel:()=>'HS',nextStep:()=>session.stepQ.shift()()});
flow.startReadyYear(s=>{assert.equal(s,state);assert.equal(draws,0);assert.equal(h.status,'COMMITTED');events.push('capture');checks++;});assert.deepEqual(events,['divider','capture','first']);assert.equal(draws,1);checks++;
const bad={status:'STARTED',targetYear:2031};handoffs.set(state,new Map([[2030,bad]]));assert.throws(()=>flow.startReadyYear(()=>assert.fail('must not capture')),/NEXT_YEAR_AMBIGUOUS/);assert.equal(draws,1);checks++;
handoffs.delete(state);flow.startReadyYear(()=>{assert.equal(draws,1);checks++;});assert.equal(draws,2);
console.log('PASS '+checks+' ready-year boundary checks: capture before draw, committed handoff, no age/year/event reset, reject ambiguous pending year');

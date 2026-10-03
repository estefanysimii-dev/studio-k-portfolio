import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduledPosition } from '../lib/radio-clock.ts';
const radio={epochMs:100000,tracks:[{duration:100},{duration:200}]};
test('client aligns entry, resumed playback and repeated programming with the shared server epoch',()=>{
  assert.deepEqual(scheduledPosition(radio,100000),{index:0,seconds:0});
  assert.deepEqual(scheduledPosition(radio,200000),{index:1,seconds:0});
  assert.deepEqual(scheduledPosition(radio,250500),{index:1,seconds:50.5});
  assert.deepEqual(scheduledPosition(radio,400000),{index:0,seconds:0});
  assert.deepEqual(scheduledPosition(radio,450500),{index:0,seconds:50.5});
  assert.equal(scheduledPosition({...radio,tracks:[]},450500),null);
});

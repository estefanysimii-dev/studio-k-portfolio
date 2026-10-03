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

test('shuffled rounds play every track once and change order', ()=>{
  const config={epochMs:1770000000000,shuffle:true,tracks:Array.from({length:229},(_,index)=>({duration:10+index/10}))};
  const total=config.tracks.reduce((sum,t)=>sum+t.duration,0);
  const rounds=[];
  for(let cycle=0;cycle<3;cycle++){
    let elapsed=0;const order=[];
    while(elapsed<total-.001){
      const now=config.epochMs+(cycle*total+elapsed+.001)*1000;
      const target=scheduledPosition(config,now);
      order.push(target.index);elapsed+=config.tracks[target.index].duration;
    }
    assert.equal(order.length,229);assert.equal(new Set(order).size,229);rounds.push(order);
  }
  assert.notDeepEqual(rounds[0],rounds[1]);assert.notDeepEqual(rounds[1],rounds[2]);
});

test('shuffle matches the shared reference timeline',()=>{
  const config={epochMs:100000,shuffle:true,tracks:[{duration:10},{duration:20},{duration:30}]};
  assert.deepEqual([0,10000,20000,30000,60000].map(t=>scheduledPosition(config,100000+t)),[
    {index:0,seconds:0},{index:2,seconds:0},{index:2,seconds:10},{index:2,seconds:20},{index:0,seconds:0}
  ]);
});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source=readFileSync(new URL('../hardware-fidelity.20260826-2930.js',import.meta.url),'utf8');

function functionSource(name){
  const marker=`function ${name}(`;
  const start=source.indexOf(marker);
  assert.notEqual(start,-1,`${name} must exist`);
  const bodyStart=source.indexOf('{',start);let depth=0;
  for(let i=bodyStart;i<source.length;i++){
    if(source[i]==='{')depth++;
    if(source[i]==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`Could not parse ${name}`);
}

const helpers=new Function(`
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const TD3_PATTERN_BYTES=123;
  const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const error=code=>Object.assign(new Error(code),{code});
  ${functionSource('pair')}
  ${functionSource('writePair')}
  ${functionSource('boolPair')}
  ${functionSource('readPair')}
  ${functionSource('mask16')}
  ${functionSource('unpackMask16')}
  ${functionSource('td3Pitch')}
  ${functionSource('semantics')}
  ${functionSource('decodeSemantics')}
  ${functionSource('encodePattern')}
  return {readPair,mask16,unpackMask16,td3Pitch,semantics,decodeSemantics,encodePattern};
`)();

function packet(){
  const a=Array(123).fill(0);a.splice(0,7,0xF0,0x00,0x20,0x32,0x00,0x01,0x0A);a[7]=0x78;a[8]=0;a[9]=0;a[122]=0xF7;return a;
}

const rest=()=>({note:'',baseOct:0,oct:'',expr:'',gate:'-'});

test('hardware family is labelled TD-3 / TD-3-MO and accepts both identities',()=>{
  assert.match(source,/TD-3 \/ TD-3-MO/);
  assert.match(source,/\^TD-3\(\?:-MO\)\?/);
  assert.match(source,/td\\s\*-\?\\s\*3\(\?:\\s\*-\?\\s\*mo\)\?/i);
  assert.doesNotMatch(source,/TD-3-MO and other devices are rejected/);
});

test('direct writer does not monkey-patch the browser MIDI implementation',()=>{
  assert.doesNotMatch(source,/Object\.defineProperty\(proto,'requestMIDIAccess'/);
  assert.doesNotMatch(source,/patchedOutputs/);
  assert.match(source,/navigator\.requestMIDIAccess\(\{sysex:true\}\)/);
  assert.match(source,/withTimeout\(navigator\.requestMIDIAccess/);
});

test('TD-3 pattern encoding keeps pitch, accent and slide in fixed 16 slots across rests',()=>{
  const steps=Array.from({length:16},rest);
  steps[0]={note:'C',baseOct:0,oct:'',expr:'A',gate:'●'};
  steps[1]=rest();
  steps[2]={note:'E',baseOct:0,oct:'',expr:'S',gate:'●'};
  steps[3]={note:'G',baseOct:0,oct:'',expr:'AS',gate:'○'};
  const encoded=helpers.encodePattern(packet(),steps);
  assert.equal(helpers.readPair(encoded,0x0C),0x18);
  assert.equal(helpers.readPair(encoded,0x0E),0x18,'rest slot stays canonical C2 instead of compacting later notes');
  assert.equal(helpers.readPair(encoded,0x10),0x1C,'step 3 pitch stays in step 3 slot');
  assert.equal(encoded[0x2D],1);
  assert.equal(encoded[0x2F],0);
  assert.equal(encoded[0x31],0);
  assert.equal(encoded[0x4D],0);
  assert.equal(encoded[0x4F],0);
  assert.equal(encoded[0x51],1,'slide stays attached to its visible step');
  assert.deepEqual(helpers.decodeSemantics(encoded),helpers.semantics(steps));
});

test('TD-3 timing mask represents note, tie and rest independently of attribute slots',()=>{
  const steps=Array.from({length:16},rest);
  steps[0]={note:'C',baseOct:0,oct:'',expr:'',gate:'●'};
  steps[1]={note:'C',baseOct:0,oct:'',expr:'S',gate:'○'};
  steps[2]=rest();
  const encoded=helpers.encodePattern(packet(),steps);
  const decoded=helpers.decodeSemantics(encoded);
  assert.equal(decoded[0].gate,'note');
  assert.equal(decoded[1].gate,'tie');
  assert.equal(decoded[2].gate,'rest');
});

test('writer reads device configuration and retries idempotent writes before failing',()=>{
  assert.match(source,/const TD3_CONFIG=\[\.\.\.TD3_PREFIX,0x75,0xF7\]/);
  assert.match(source,/transpose:\(a\[10\]\?\?12\)-12/);
  assert.match(source,/multiTrigger:!!a\[13\]/);
  assert.match(source,/accentThreshold:a\[17\]\?\?96/);
  assert.match(source,/const TD3_WRITE_ATTEMPTS=3/);
  assert.match(source,/for\(let attempt=1;attempt<=TD3_WRITE_ATTEMPTS;attempt\+\+\)/);
  assert.match(source,/sameSemantics\(decodeSemantics\(expected\),decodeSemantics\(actual\)\)/);
});

test('device diagnostics expose channel, transpose, accent and slide-mode mismatches',()=>{
  assert.match(source,/303BOX CH/);
  assert.match(source,/TD-3 IN/);
  assert.match(source,/TRANSPOSE/);
  assert.match(source,/MULTI TRIGGER ON/);
  assert.match(source,/SLIDE MODE/);
  assert.match(source,/ACCENT > /);
  assert.match(source,/c\.midiIn!==ch/);
});

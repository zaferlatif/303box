import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source=readFileSync(new URL('../hardware-guide.20260819-0815.js',import.meta.url),'utf8');

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
  const TD3_PATTERN_BYTES=123;
  const TD3_PREFIX=[0xF0,0x00,0x20,0x32,0x00,0x01,0x0A];
  const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const samePrefix=a=>TD3_PREFIX.every((v,i)=>a[i]===v);
  const td3Error=code=>Object.assign(new Error(code),{td3Code:code});
  let currentSteps=[];const patternSteps=()=>currentSteps;
  ${functionSource('validTarget')}
  ${functionSource('validPattern')}
  ${functionSource('comparable')}
  ${functionSource('targetFromAddress')}
  ${functionSource('pair')}
  ${functionSource('writePair')}
  ${functionSource('boolPair')}
  ${functionSource('packByRests')}
  ${functionSource('mask16')}
  ${functionSource('unpackMask16')}
  ${functionSource('td3Pitch')}
  ${functionSource('logicalPitch')}
  ${functionSource('patternSemantics')}
  ${functionSource('decodePatternSemantics')}
  ${functionSource('samePatternSemantics')}
  ${functionSource('encodePattern')}
  return {validPattern,comparable,targetFromAddress,pair,mask16,unpackMask16,td3Pitch,patternSemantics,decodePatternSemantics,samePatternSemantics,packByRests,encodePattern,setSteps:v=>{currentSteps=v}};
`)();

function packet(group=0,slot=0){const a=Array(123).fill(0);a.splice(0,7,0xF0,0x00,0x20,0x32,0x00,0x01,0x0A);a[7]=0x78;a[8]=group;a[9]=slot;a[122]=0xF7;return a}

test('hardware scope is strictly Roland T-8 and Behringer TD-3',()=>{
  assert.match(source,/ids\.includes\('t8'\)/);
  assert.match(source,/ids\.includes\('td3'\)/);
  assert.match(source,/card\.remove\(\)/);
  assert.match(source,/TD-3-MO and other devices are rejected/);
  assert.match(source,/!\/\\bmo\\b\/i/);
  assert.doesNotMatch(source,/Korg volca/i);
});

test('pattern responses are exact, 7-bit clean and target-bound',()=>{
  const target={group:2,requestSlot:13};
  assert.equal(helpers.validPattern(packet(2,13),target),true);
  assert.equal(helpers.validPattern(packet(2,12),target),false);
  assert.equal(helpers.validPattern(packet(1,13),target),false);
  const dirty=packet(2,13);dirty[40]=0x80;assert.equal(helpers.validPattern(dirty,target),false);
  const changed=packet(2,13);changed[0x76]=1;assert.equal(helpers.comparable(packet(2,13),changed),false);
});

test('target address mapping covers only the 64 TD-3 memory slots',()=>{
  assert.deepEqual(helpers.targetFromAddress(0,0),{group:0,requestSlot:0,section:'A',number:1,label:'I / A1'});
  assert.deepEqual(helpers.targetFromAddress(3,15),{group:3,requestSlot:15,section:'B',number:8,label:'IV / B8'});
  assert.equal(helpers.targetFromAddress(4,0),null);assert.equal(helpers.targetFromAddress(0,16),null);
});

test('TD-3 nibble layout, tie mask and rest mask match the reverse-engineered packet',()=>{
  assert.deepEqual(helpers.pair(0x18),[1,8]);assert.deepEqual(helpers.pair(0xA4),[10,4]);
  const flags=Array(16).fill(false);flags[0]=flags[7]=flags[8]=flags[15]=true;
  assert.deepEqual(helpers.mask16(flags),[8,1,8,1]);
  assert.match(source,/writePair\(out,0x0C\+i\*2,packedPitches\[i\]\)/);
  assert.match(source,/boolPair\(out,0x2C\+i\*2,packedAccents\[i\]\)/);
  assert.match(source,/boolPair\(out,0x4C\+i\*2,packedSlides\[i\]\)/);
  assert.match(source,/out\[0x6E\]=1;out\[0x6F\]=0/);
});

test('notes, accents and slides survive rest compaction and semantic decode',()=>{
  const steps=Array.from({length:16},()=>({note:'C',baseOct:0,oct:'',expr:'',gate:'-'}));
  steps[0]={note:'C',baseOct:0,oct:'',expr:'A',gate:'●'};
  steps[2]={note:'E',baseOct:0,oct:'',expr:'S',gate:'●'};
  steps[3]={note:'G',baseOct:0,oct:'',expr:'AS',gate:'○'};
  steps[5]={note:'C',baseOct:1,oct:'',expr:'',gate:'●'};
  helpers.setSteps(steps);const encoded=helpers.encodePattern(packet());
  const combined=i=>(encoded[i]<<4)|encoded[i+1];
  assert.equal(combined(0x0C),0x18);assert.equal(combined(0x0E),0x1C);assert.equal(combined(0x10),0x1F);assert.equal(combined(0x12),0xA4);
  assert.deepEqual(encoded.slice(0x2C,0x34),[0,1,0,0,0,1,0,0]);
  assert.deepEqual(encoded.slice(0x4C,0x54),[0,0,0,1,0,1,0,0]);
  assert.deepEqual(encoded.slice(0x72,0x76),[15,7,15,15]);
  assert.equal(encoded[0x76],13);assert.equal(encoded[0x77],2);
  const intended=helpers.patternSemantics(steps),decoded=helpers.decodePatternSemantics(encoded);
  assert.equal(helpers.samePatternSemantics(intended,decoded),true);
  assert.equal(decoded[2].slide,true);assert.equal(decoded[3].slide,true);assert.equal(decoded[3].accent,true);assert.equal(decoded[5].pitch,0x24);
});

test('direct write is exclusive, backed up, delayed for commit and verified by read-back',()=>{
  assert.match(source,/requestMIDIAccess\(\{sysex:true\}\)/);
  assert.match(source,/Promise\.all\(\[input\.open\(\),output\.open\(\)\]\)/);
  assert.match(source,/const TD3_WRITE_SETTLE=850/);
  assert.match(source,/const TD3_VERIFY_RETRIES=4/);
  assert.match(source,/beginExclusive\?\.\('td3-sysex'\)/);
  assert.match(source,/saveBackup\(backup,tg\)/);
  assert.match(source,/td3\.output\.send\(pending\.packet\)/);
  assert.match(source,/await verifyReadBack\(pending\.packet,tg\)/);
  assert.match(source,/samePatternSemantics\(pending\.semantics,decodePatternSemantics\(actual\)\)/);
  assert.doesNotMatch(source,/window\.confirm/);
});

test('writer rejects TD-3-MO identity and exposes a two-click confirmation flow',()=>{
  assert.match(source,/!\/\^TD-3\(\?:\\s\|\$\)\/i\.test\(td3\.product\)\|\|\/-MO\/i\.test\(td3\.product\)/);
  assert.match(source,/TD3_WRITE_CONFIRM_WINDOW=15000/);
  assert.match(source,/armPendingWrite\(packet,tg,intended\)/);
  assert.match(source,/patternSignature\(\)!==pending\.signature/);
  assert.match(source,/tg\.group!==pending\.tg\.group\|\|tg\.requestSlot!==pending\.tg\.requestSlot/);
  assert.match(source,/TEST READ \(NO WRITE\)/);
});

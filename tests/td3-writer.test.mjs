import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const source=readFileSync(new URL('../hardware-guide.20260819-0815.js',import.meta.url),'utf8');

function functionSource(name){
  const marker=`function ${name}(`;
  const start=source.indexOf(marker);
  assert.notEqual(start,-1,`${name} must exist`);
  const bodyStart=source.indexOf('{',start);
  let depth=0;
  for(let i=bodyStart;i<source.length;i++){
    if(source[i]==='{')depth++;
    if(source[i]==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`Could not parse ${name}`);
}

const helpers=new Function(`
  const TD3_PATTERN_BYTES=123;
  const TD3_PREFIX=[0xF0,0x00,0x20,0x32,0x00,0x01,0x0A];
  const samePrefix=a=>TD3_PREFIX.every((v,i)=>a[i]===v);
  ${functionSource('validTarget')}
  ${functionSource('validPattern')}
  ${functionSource('comparable')}
  ${functionSource('targetFromAddress')}
  ${functionSource('pair')}
  ${functionSource('mask16')}
  return {validPattern,comparable,targetFromAddress,pair,mask16};
`)();

function packet(group=0,slot=0){
  const bytes=Array(123).fill(0);
  bytes.splice(0,7,0xF0,0x00,0x20,0x32,0x00,0x01,0x0A);
  bytes[7]=0x78;bytes[8]=group;bytes[9]=slot;bytes[122]=0xF7;
  return bytes;
}

test('the injected writer markup has unique control IDs',()=>{
  const start=source.indexOf('box.innerHTML=`');
  const end=source.indexOf('card.appendChild(box)',start);
  assert.ok(start>=0&&end>start,'writer markup must be present');
  const ids=[...source.slice(start,end).matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length,`duplicate IDs: ${ids.filter((id,i)=>ids.indexOf(id)!==i).join(', ')}`);
  assert.ok(ids.includes('td3WriteNumber'),'pattern-number select must have its own ID');
  assert.ok(ids.includes('td3WritePattern'),'write button must keep the write action ID');
});

test('pattern responses must match the exact requested group and slot',()=>{
  const target={group:2,requestSlot:13};
  assert.equal(helpers.validPattern(packet(2,13),target),true);
  assert.equal(helpers.validPattern(packet(2,12),target),false,'a stale response from another slot must be ignored');
  assert.equal(helpers.validPattern(packet(1,13),target),false,'a response from another group must be ignored');
  assert.equal(helpers.validPattern([...packet(2,13),0],target),false,'unexpected packet lengths must be rejected');
  const invalidData=packet(2,13);invalidData[40]=0x80;
  assert.equal(helpers.validPattern(invalidData,target),false,'SysEx data bytes must be 7-bit clean');
});

test('read-back comparison includes the target address and all encoded fields',()=>{
  const expected=packet(0,8),actual=expected.slice();
  assert.equal(helpers.comparable(expected,actual),true);
  actual[9]=9;
  assert.equal(helpers.comparable(expected,actual),false,'another target slot cannot verify this write');
  actual[9]=8;actual[0x76]^=1;
  assert.equal(helpers.comparable(expected,actual),false,'rest-mask changes must fail verification');
});

test('stored raw addresses map back to the original A/B target',()=>{
  assert.deepEqual(helpers.targetFromAddress(0,0),{group:0,requestSlot:0,section:'A',number:1,label:'I / A1'});
  assert.deepEqual(helpers.targetFromAddress(3,15),{group:3,requestSlot:15,section:'B',number:8,label:'IV / B8'});
  assert.equal(helpers.targetFromAddress(4,0),null);
  assert.equal(helpers.targetFromAddress(0,16),null);
});

test('pitch nibbles and tie/rest masks follow the reverse-engineered TD-3 packet layout',()=>{
  assert.deepEqual(helpers.pair(0x18),[0x01,0x08]);
  assert.deepEqual(helpers.pair(0x2F),[0x02,0x0F]);
  const flags=Array(16).fill(false);
  flags[0]=true;flags[7]=true;flags[8]=true;flags[15]=true;
  assert.deepEqual(helpers.mask16(flags),[0x08,0x01,0x08,0x01]);
  assert.match(source,/writePair\(out,0x0C\+i\*2,stored\)/);
  assert.match(source,/boolPair\(out,0x2C\+i\*2/);
  assert.match(source,/boolPair\(out,0x4C\+i\*2/);
  assert.match(source,/out\[0x6E\]=1;out\[0x6F\]=0/);
  assert.match(source,/out\[0x72\+i\]/);
  assert.match(source,/out\[0x76\+i\]/);
});

test('writer enforces SysEx capability, durable backup, serialization, and retry verification',()=>{
  assert.match(source,/requestMIDIAccess\(\{sysex:true\}\)/);
  assert.match(source,/access\?\.sysexEnabled!==true/);
  assert.match(source,/if\(td3\.busy\)/);
  assert.match(source,/const TD3_VERIFY_RETRIES=3/);
  assert.match(source,/await verifyReadBack\(packet,tg\)/);

  const writeStart=source.indexOf('function writeTd3()');
  const writeEnd=source.indexOf('function restoreTd3()',writeStart);
  const writeBody=source.slice(writeStart,writeEnd);
  assert.ok(writeBody.indexOf('saveBackup(backup,tg)')<writeBody.indexOf('td3.output.send(packet)'),
    'a verified browser backup must be stored before WRITE is sent');

  const restoreStart=source.indexOf('function restoreTd3()');
  const restoreEnd=source.indexOf('function openGuide()',restoreStart);
  const restoreBody=source.slice(restoreStart,restoreEnd);
  assert.match(restoreBody,/tg=backup\.target/,'restore must use the address stored with the backup');
  assert.match(restoreBody,/await ensureTd3\(tg\)/);
  assert.match(restoreBody,/await verifyReadBack\(backup\.bytes,tg\)/);
});

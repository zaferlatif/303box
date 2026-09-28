import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../hardware-fidelity.20260826-2930.js',import.meta.url),'utf8');
const prefix=[240,0,32,50,0,1,10];
const rest=()=>({note:'',baseOct:0,oct:'2',expr:'',gate:'-'});
const note=(name,expr='',gate='●',oct='2')=>({note:name,baseOct:0,oct,expr,gate});
const blank=()=>Array.from({length:16},rest);
const plain=value=>JSON.parse(JSON.stringify(value));

// Hand-authored wire fixture, independent of the production encoder/decoder.
// Offsets: https://303patterns.com/td3-midi.html
// Separate streams: subatomicglue/behringer-td3-editor app/td3.js packArrayByRests;
// beholder-d/td3-pattern README "Sequencer Quirks".
// Timeline: rest, C(A), rest, E(AS), G(○), A, nine rests, D3(S into rest).
function fixture(group=2,slot=8){
  const hex=`f0 00 20 32 00 01 0a 78 ${group.toString(16)} ${slot.toString(16)} 00 01
    01 08 01 0c 01 0f 02 01 02 06 01 08 01 08 01 08
    01 08 01 08 01 08 01 08 01 08 01 08 01 08 01 08
    00 01 00 01 00 00 00 00 00 00 00 00 00 00 00 00
    00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
    00 00 00 01 00 01 00 00 00 00 00 00 00 00 00 00
    00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
    00 00 01 00 00 00 0f 0f 0f 0f 0c 05 07 0f f7`;
  const result=hex.trim().split(/\s+/).map(x=>parseInt(x,16));
  assert.equal(result.length,123);return result;
}
function fixtureSteps(){
  const steps=blank();steps[1]=note('C','A');steps[3]=note('E','AS');
  steps[4]=note('G','','○');steps[5]=note('A');steps[15]=note('D','S','●','3');return steps;
}

// Independent straight-time TD-3 interpreter, never the production decoder.
function deviceNotes(bytes){
  const rests=(bytes[0x78]*16+bytes[0x79])*256+bytes[0x76]*16+bytes[0x77];
  assert.deepEqual(bytes.slice(0x72,0x76),[15,15,15,15],'UI legato must not consume device tie timing');
  let pool=0;
  return Array.from({length:16},(_,step)=>{
    if(rests&(1<<step))return null;
    const i=pool++;
    return {pitch:bytes[12+2*i]*16+bytes[13+2*i],accent:bytes[45+2*i]===1,slide:bytes[77+2*i]===1};
  });
}

function harness({steps=fixtureSteps(),group=2,section='B',number=1,corruptRead=false,product='TD-3',productReply=true,missingGrid=false}={}){
  const elements=new Map(),listeners=new Map(),midiListeners=new Set(),storage=new Map(),sent=[],writes=[];
  let memory=fixture(group,(section==='B'?8:0)+number-1),exclusive=0,stops=0;
  memory[0x6D]=1;memory[0x6E]=0;memory[0x6F]=12;memory[0x72]=3;
  const original=memory.slice();
  const el=(id,value='')=>{const e={id,value,textContent:'',dataset:{},disabled:false,setAttribute(){},classList:{add(){},remove(){}}};elements.set('#'+id,e);return e;};
  el('td3WriteGroup',String(group));el('td3WriteSection',section);el('td3WriteNumber',String(number));
  ['td3WritePattern','td3RestorePattern','td3ArmSysex','td3ReadPattern','td3DirectStatus','td3DirectBox'].forEach(id=>el(id));
  const document={documentElement:{lang:'en'},addEventListener(){},querySelector:s=>elements.get(s)||null,
    querySelectorAll(s){
      if(s==='#td3DirectBox .td3-direct-actions button')return [...elements.values()].filter(e=>/Pattern$|Sysex$/.test(e.id));
      if(missingGrid)return [];
      if(s==='#patternSheet .note-input')return steps.map(x=>({value:x.note,dataset:{baseOctave:x.baseOct}}));
      const key={'#patternSheet .octave-cell':'oct','#patternSheet .accentSlide-cell':'expr','#patternSheet .gate-cell':'gate'}[s];
      return key?steps.map(x=>({textContent:x[key]})):[];
    }};
  const emit=a=>queueMicrotask(()=>{for(const fn of [...midiListeners])fn({data:Uint8Array.from(a)});});
  const input={name:'TD-3',manufacturer:'Behringer',state:'connected',open:async()=>{},addEventListener:(type,fn)=>midiListeners.add(fn),removeEventListener:(type,fn)=>midiListeners.delete(fn)};
  const output={...input,send(message){
    const a=Array.from(message);sent.push(a);
    if(a[7]===6&&productReply)emit([...prefix,7,...Array.from(product,c=>c.charCodeAt(0)),247]);
    if(a[7]===8)emit([...prefix,9,0,1,2,6,247]);
    if(a[7]===0x75)emit([...prefix,0x76,0,1,12,0,0,0,0,0,0,96,247]);
    if(a[7]===0x77){const reply=memory.slice();reply[8]=a[8];reply[9]=a[9];if(corruptRead&&writes.length)reply[0x6D]=1;emit(reply);}
    if(a[7]===0x78){writes.push(a);memory=a.slice();}
  }};
  const access={sysexEnabled:true,inputs:new Map([['in',input]]),outputs:new Map([['out',output]])};
  const window={addEventListener:(type,fn)=>listeners.set(type,fn),__303boxMidiRouter:{state:{bass:2},beginExclusive(){exclusive++;return()=>exclusive--;}},__303boxUnifiedEngine:{stopAll(){stops++;}}};
  vm.runInNewContext(source,{window,document,navigator:{requestMIDIAccess:async()=>access},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    setTimeout:(fn,ms)=>{const timer=setTimeout(fn,ms===15000?ms:Math.max(2,ms/50));timer.unref();return timer;},clearTimeout,requestAnimationFrame:fn=>queueMicrotask(fn)});
  const api=window.__303boxHardwareFidelity;
  async function click(id){
    listeners.get('click')({target:{closest:()=>elements.get('#'+id)},preventDefault(){},stopImmediatePropagation(){}});
    for(let n=0;n<2000&&api.state.busy;n++)await new Promise(r=>setTimeout(r,1));
    assert.equal(api.state.busy,false,'operation must settle');assert.equal(exclusive,0,'MIDI lock must release');
  }
  return {api,click,steps,elements,storage,sent,writes,original,input,output,get status(){return elements.get('#td3DirectStatus').textContent;},get stops(){return stops;}};
}

test('wire bytes match an independent fixture with leading/interior rests and attributes',()=>{
  const h=harness(),backup=h.original.slice();
  assert.deepEqual(plain(h.api.encodePattern(backup,fixtureSteps())),fixture());
  assert.deepEqual(backup,h.original,'backup must remain byte-exact');
});

test('TD-3 pitch-pool playback preserves visible notes after every possible rest position',()=>{
  const h=harness();
  for(let silence=0;silence<16;silence++){
    const steps=Array.from({length:16},(_,i)=>note(['C','D','E','F','G','A','B'][i%7],i%2?'A':''));steps[silence]=rest();
    const heard=deviceNotes(plain(h.api.encodePattern(fixture(),steps)));
    for(let i=0;i<16;i++)assert.deepEqual(heard[i],i===silence?null:{pitch:24+[0,2,4,5,7,9,11][i%7],accent:!!(i%2),slide:false},`rest ${silence+1}, step ${i+1}`);
  }
});

test('decoder expands a compact wire fixture into the visible timeline',()=>{
  const h=harness(),actual=plain(h.api.decodeSemantics(fixture()));
  const expected=Array.from({length:16},()=>({gate:'rest',pitch:null,accent:false,slide:false}));
  for(const [i,pitch,accent,slide]of[[1,24,true,false],[3,28,true,true],[4,31,false,true],[5,33,false,false],[15,38,false,false]])expected[i]={gate:'note',pitch,accent,slide};
  assert.deepEqual(actual,expected);
});

test('UI outgoing legato keeps first/different/repeated pitches and wraps from step 16',()=>{
  const h=harness(),steps=blank();steps[0]=note('E','','○');steps[1]=note('G','','○');steps[2]=note('G');steps[15]=note('D','AS');
  const heard=deviceNotes(plain(h.api.encodePattern(fixture(),steps)));
  assert.deepEqual(heard[0],{pitch:28,accent:false,slide:true});assert.deepEqual(heard[1],{pitch:31,accent:false,slide:true});
  assert.deepEqual(heard[2],{pitch:31,accent:false,slide:false});assert.deepEqual(heard[15],{pitch:26,accent:true,slide:true});
});

test('new pattern clears old triplet mode and sets 16 straight steps',()=>{
  const h=harness(),a=plain(h.api.encodePattern(h.original,fixtureSteps()));assert.deepEqual(a.slice(0x6C,0x70),[0,0,1,0]);
});

test('all-rest pattern is intentional; incomplete grid or unknown notes cannot become silent writes',()=>{
  const h=harness(),a=plain(h.api.encodePattern(fixture(),blank()));assert.deepEqual(deviceNotes(a),Array(16).fill(null));
  assert.throws(()=>h.api.encodePattern(fixture(),[]),e=>e.code==='pattern');
  const steps=blank();steps[0]=note('H');assert.throws(()=>h.api.encodePattern(fixture(),steps),e=>e.code==='pattern');
});

test('octave endpoints retain pitch; unsupported registers fail before writing',()=>{
  const h=harness(),steps=blank();steps[0]=note('C','','●','1');steps[1]=note('B','','●','3');
  assert.deepEqual(deviceNotes(plain(h.api.encodePattern(fixture(),steps))).slice(0,2).map(x=>x.pitch),[12,47]);
  for(const oct of ['4','5']){steps[0]=note('C','','●',oct);assert.throws(()=>h.api.encodePattern(fixture(),steps),e=>e.code==='range'&&e.steps[0]===1);}
});

test('buttons back up, require confirmation, write correct pool, verify and restore original bytes',async()=>{
  const h=harness();await h.click('td3WritePattern');assert.equal(h.writes.length,0);assert.match(h.elements.get('#td3WritePattern').textContent,/CONFIRM/);
  assert.match(h.status,/5 notes.*11 rests/);assert.deepEqual(JSON.parse([...h.storage.values()][0]).bytes,h.original);
  await h.click('td3WritePattern');assert.equal(h.writes.length,1);assert.deepEqual(h.writes[0],fixture());assert.match(h.status,/WRITE VERIFIED/);assert.equal(h.stops,2);
  await h.click('td3RestorePattern');assert.deepEqual(h.writes[1],h.original);assert.match(h.status,/restored and verified/);
});

test('wrong triplet read-back is rejected instead of reporting success',async()=>{
  const h=harness({corruptRead:true});await h.click('td3WritePattern');await h.click('td3WritePattern');
  assert.equal(h.writes.length,3);assert.doesNotMatch(h.status,/WRITE VERIFIED/);assert.match(h.status,/Read-back did not match/);
});

test('all groups and A/B boundary slots are addressed without crossing banks',async()=>{
  for(let group=0;group<4;group++)for(const [section,number,slot]of[['A',1,0],['A',8,7],['B',1,8],['B',8,15]]){
    const h=harness({group,section,number});await h.click('td3WritePattern');await h.click('td3WritePattern');assert.deepEqual(h.writes[0],fixture(group,slot));
    assert.ok(h.sent.filter(x=>x[7]===0x77).every(x=>x[8]===group&&x[9]===slot));
  }
});

test('changed pattern/target, missing grid, corrupt backup and disconnect prevent writing',async()=>{
  for(const change of [h=>{h.steps[1].note='F';},h=>{h.elements.get('#td3WriteNumber').value='8';}]){
    const h=harness();await h.click('td3WritePattern');change(h);await h.click('td3WritePattern');assert.equal(h.writes.length,0);assert.match(h.status,/changed/);
  }
  const missing=harness({missingGrid:true});await missing.click('td3WritePattern');assert.equal(missing.writes.length,0);assert.doesNotMatch(missing.elements.get('#td3WritePattern').textContent,/CONFIRM/);
  const corrupt=harness();await corrupt.click('td3WritePattern');const key=[...corrupt.storage.keys()][0],backup=JSON.parse(corrupt.storage.get(key));backup.bytes[9]=15;corrupt.storage.set(key,JSON.stringify(backup));await corrupt.click('td3RestorePattern');assert.equal(corrupt.writes.length,0);
  const disconnected=harness();await disconnected.click('td3WritePattern');disconnected.input.state=disconnected.output.state='disconnected';await disconnected.click('td3WritePattern');assert.equal(disconnected.writes.length,0);
});

test('product timeout uses exact compatibility read; incompatible identity is rejected',async()=>{
  const fallback=harness({productReply:false});await fallback.click('td3ArmSysex');assert.equal(fallback.api.state.identitySource,'pattern');assert.equal(fallback.api.state.verified,true);
  const bad=harness({product:'OTHER'});await bad.click('td3WritePattern');assert.equal(bad.writes.length,0);assert.equal(bad.api.state.verified,false);
});

test('writer preserves browser MIDI and sends no notes, transport or configuration writes',async()=>{
  assert.doesNotMatch(source,/Object\.defineProperty\(proto,'requestMIDIAccess'|output\.send\s*=/);
  const h=harness();await h.click('td3WritePattern');await h.click('td3WritePattern');assert.ok(h.sent.every(a=>a[0]===240&&[6,8,0x75,0x77,0x78].includes(a[7])));
});

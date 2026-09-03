import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');

function functionSource(source,name){
  const marker=`function ${name}(`,start=source.indexOf(marker);
  assert.notEqual(start,-1,`${name} must exist`);
  const bodyStart=source.indexOf('{',start);let depth=0;
  for(let i=bodyStart;i<source.length;i++){
    if(source[i]==='{')depth++;
    if(source[i]==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error(`Could not parse ${name}`);
}

test('connection presentation never rewrites OUTPUT or DEVICE',()=>{
  const source=read('midi-connection-state.20260819-1910.js');
  assert.doesNotMatch(source,/dispatchChange/);
  assert.doesNotMatch(source,/midiDeviceProfile/);
  assert.doesNotMatch(source,/midiRouterOut/);
  assert.match(source,/never rewrite the user's OUTPUT or DEVICE selection/);
});

test('router recovers stale ports without resetting an explicit device choice',()=>{
  const source=read('midi-router.20260818-1730.js');
  assert.match(source,/matches\.length===1\)selected=matches\[0\]/);
  assert.match(source,/!selected&&outputs\.length===1\)selected=outputs\[0\]/);
  assert.match(source,/else state\.outputId=''/);
  assert.match(source,/sel\.replaceChildren\(placeholder,\.\.\.options\)/);
  assert.match(source,/state\.choice=ALLOWED\.has\(e\.target\.value\)\?e\.target\.value:'auto'/);
  assert.match(source,/browser exposes no connected output/);
  assert.match(source,/version:'3210'/);
});

test('router owns absolute MIDI pitch and the octave layer never patches Web MIDI',()=>{
  const router=read('midi-router.20260818-1730.js');
  const pitch=read('pitch-octave.20260826-2940.js');
  assert.match(router,/\(absolute\+1\)\*12\+\(n-60\)/);
  assert.doesNotMatch(pitch,/function patchOutput\(/);
  assert.doesNotMatch(pitch,/installMidiPitchBridge/);
  assert.doesNotMatch(pitch,/requestMIDIAccess/);
  assert.doesNotMatch(pitch,/output\.send=function/);
  const midiNote=new Function(`
    const NOTE={C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71};
    const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
    ${functionSource(router,'midiNote')}
    return midiNote;
  `)();
  assert.deepEqual([1,2,3,4,5].map(oct=>midiNote({note:'C',oct:String(oct),base:0})),[24,36,48,60,72]);
  assert.equal(midiNote({note:'G#',oct:'4',base:0}),68);
});

test('hardware guide owns UI only and fidelity owns all SysEx operations',()=>{
  const guide=read('hardware-guide.20260819-0815.js');
  const fidelity=read('hardware-fidelity.20260826-2930.js');
  assert.doesNotMatch(guide,/requestMIDIAccess/);
  assert.doesNotMatch(guide,/\.send\(/);
  assert.doesNotMatch(guide,/TD3_PREFIX/);
  assert.match(guide,/showModal/);
  assert.match(guide,/hardwareGuideClose/);
  assert.match(guide,/document\.addEventListener\('click'/);
  assert.equal((fidelity.match(/requestMIDIAccess/g)||[]).length,1);
  assert.match(fidelity,/installCapture\(\)/);
  assert.match(fidelity,/stopImmediatePropagation\(\)/);
  assert.match(fidelity,/function targetChanged\(\)/);
});

test('live MIDI instructions require port and receive-channel agreement',()=>{
  const index=read('index.html');
  const english=read('midi-hardware-guide.html');
  const turkish=read('tr/midi-donanim-rehberi.html');
  assert.match(index,/hardware-live-check/);
  assert.match(index,/MIDI control\/input port/);
  assert.match(index,/receive channel/);
  assert.match(index,/MIDI control\/input portunun/);
  assert.match(english,/same physical route shown in <strong>OUTPUT<\/strong>/);
  assert.match(turkish,/seçili MIDI control\/input portu/);
});

test('shell and app preserve live listeners across rerenders',()=>{
  const shell=read('site-shell.20260821-2600.js');
  const app=read('app.js');
  assert.match(shell,/header\.dataset\.shellChrome!==RELEASE_EPOCH/);
  assert.match(shell,/footer\.dataset\.shellChrome!==RELEASE_EPOCH/);
  assert.match(app,/document\.addEventListener\('click',event=>\{if\(event\.target\.closest\?\.\('#languageButton'\)\)/);
});

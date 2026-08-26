import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const siteVersion='2026.08.26.11';
const releaseEpoch='20260826-3010';
const htmlFiles=['index.html','privacy.html','303-pattern-guide.html','acid-house-guide.html','tr/index.html','tr/303-pattern-rehberi.html','tr/acid-house-rehberi.html'];

test('all public pages retain one structural footer',()=>{
  const footers=htmlFiles.map(file=>{
    const html=read(file),footer=html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer,`${file} must have the shared footer`);
    for(const required of ['data-disclaimer-link','data-shortcuts-link','/privacy.html','data-site-version'])assert.ok(footer.includes(required),`${file} footer missing ${required}`);
    return footer.replace(/v2026\.08\.\d+\.\d+/g,'VERSION');
  });
  for(const footer of footers.slice(1))assert.equal(footer,footers[0],'public footers must remain structurally identical');
});

test('site shell publishes the native-only MIDI release',()=>{
  const shell=read('site-shell.20260821-2600.js');
  assert.match(shell,new RegExp(`const SITE_VERSION='${siteVersion.replaceAll('.','\\.')}'`));
  assert.match(shell,new RegExp(`const RELEASE_EPOCH='${releaseEpoch}'`));
  assert.match(shell,/pitch-octave\.20260826-2940\.js/);
  assert.match(shell,/pattern-format\.20260826-2970\.js/);
  assert.match(shell,/hardware-guide\.20260826-2960\.js/);
  assert.match(shell,/hardware-fidelity\.20260826-2930\.js/);
  assert.doesNotMatch(shell,/td3-port-recovery/);
  assert.doesNotMatch(shell,/Object\.defineProperty\(proto,'requestMIDIAccess'/);
});

test('live index cache-busts every active app asset to 3010',()=>{
  const html=read('index.html');
  assert.match(html,/site-shell\.20260821-2600\.js\?v=20260826-3010/);
  assert.match(html,/midi-router\.20260818-1730\.js\?v=20260826-3010/);
  assert.match(html,/hardware-guide\.20260826-2960\.js\?v=20260826-3010/);
  assert.match(html,/<option value="td3">TD-3 \/ TD-3-MO<\/option>/);
  assert.doesNotMatch(html,/20260826-2980/);
});

test('octave and pattern format layers do not monkey-patch Web MIDI',()=>{
  const pitch=read('pitch-octave.20260826-2940.js'),format=read('pattern-format.20260826-2970.js');
  assert.match(pitch,/version:'20260826-3010'/);
  assert.match(format,/VERSION='20260826-3010'/);
  assert.doesNotMatch(pitch,/requestMIDIAccess/);
  assert.doesNotMatch(format,/requestMIDIAccess/);
  assert.doesNotMatch(pitch,/patchedOutputs/);
  assert.doesNotMatch(format,/patchTd3Packet/);
});

test('router owns MIDI discovery and absolute octave mapping',()=>{
  const midi=read('midi-router.20260818-1730.js');
  assert.match(midi,/version:'2403'/);
  assert.match(midi,/requestFreshAccess/);
  assert.match(midi,/requestMIDIAccess\(\{sysex:false\}\)/);
  assert.match(midi,/requestMIDIAccess\(\{sysex:true\}\)/);
  assert.match(midi,/RESCAN MIDI/);
  assert.match(midi,/\(absolute\+1\)\*12\+\(n-60\)/);
  assert.match(midi,/TD-3 \/ TD-3-MO/);
});

test('hardware fidelity writes length and triplet directly',()=>{
  const fidelity=read('hardware-fidelity.20260826-2930.js');
  assert.match(fidelity,/const RELEASE='20260826-3010'/);
  assert.match(fidelity,/format\?\.bassGrid==='triplet'/);
  assert.match(fidelity,/out\[0x6C\]=0;out\[0x6D\]/);
  assert.match(fidelity,/out\[0x6E\]=lp\[0\];out\[0x6F\]=lp\[1\]/);
  assert.match(fidelity,/requestMIDIAccess\(\{sysex:true\}\)/);
});

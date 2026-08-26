import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const siteVersion='2026.08.26.8';
const releaseEpoch='20260826-2980';
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

test('site shell publishes the current release and loads pitch, pattern format and split hardware modules',()=>{
  const shell=read('site-shell.20260821-2600.js');
  assert.match(shell,new RegExp(`const SITE_VERSION='${siteVersion.replaceAll('.','\\.')}'`));
  assert.match(shell,new RegExp(`const RELEASE_EPOCH='${releaseEpoch}'`));
  assert.match(shell,/pitch-octave\.20260826-2940\.js/);
  assert.match(shell,/pattern-format\.20260826-2970\.js/);
  assert.match(shell,/hardware-guide\.20260826-2960\.js/);
  assert.match(shell,/hardware-fidelity\.20260826-2950\.js/);
  assert.match(shell,/td3-port-recovery\.20260826-2980\.js/);
  assert.match(shell,/installPitchModel\(\)/);
  assert.match(shell,/installPatternFormat\(\)/);
  assert.match(shell,/installHardwareGuide\(\)/);
  assert.match(shell,/installHardwareFidelity\(\)/);
  assert.match(shell,/installTd3PortRecovery\(\)/);
  assert.match(shell,/visibilitychange.*stopImmediatePropagation/s);
});

test('live index no longer loads the legacy TD-3 writer and uses one family option',()=>{
  const html=read('index.html');
  assert.match(html,/hardware-guide\.20260826-2960\.js\?v=20260826-2980/);
  assert.doesNotMatch(html,/hardware-guide\.20260819-0815\.js/);
  assert.match(html,/<option value="td3">TD-3 \/ TD-3-MO<\/option>/);
  assert.doesNotMatch(html,/<option value="td3mo">/);
  assert.match(html,/site-shell\.20260821-2600\.js\?v=20260826-2980/);
});

test('TD-3 port recovery handles router auto-selection and non-identical SysEx port names',()=>{
  const recovery=read('td3-port-recovery.20260826-2980.js');
  assert.match(recovery,/const VERSION='20260826-2980'/);
  assert.match(recovery,/n\.includes\('td3'\)\|\|n\.includes\('td3mo'\)/);
  assert.match(recovery,/chooseTd3Pair/);
  assert.match(recovery,/pairScore/);
  assert.match(recovery,/options\?\.sysex/);
  assert.match(recovery,/midiRouterOut/);
  assert.match(recovery,/profile\.value='td3'/);
});

test('pattern format owns device-aware length, page, grid and musical tools',()=>{
  const format=read('pattern-format.20260826-2970.js');
  assert.match(format,/lengths:\{browser:16,t8:32,td3:16,t8Rhythm:32\}/);
  assert.match(format,/maxSteps\(target=resolvedTarget\(\)\).*target==='td3'\?16:32/s);
  assert.match(format,/data-format-page="0">1–16/);
  assert.match(format,/data-format-page="1">17–32/);
  assert.match(format,/ROOT/);
  assert.match(format,/SCALE/);
  assert.match(format,/NUDGE/);
  assert.match(format,/FIT SCALE/);
  assert.match(format,/patchTd3Packet/);
  assert.match(format,/data\[0x6D\]=state\.grids\.td3==='triplet'\?1:0/);
  assert.match(format,/data\[0x6E\]=p\[0\];data\[0x6F\]=p\[1\]/);
  assert.match(format,/LENGTH\\t= \$\{len\}/);
  assert.match(format,/for\(let step=1;step<=32;step\+\+\)/);
});

test('hardware guide is UI-only while hardware fidelity owns transfers',()=>{
  const guide=read('hardware-guide.20260826-2960.js');
  assert.match(guide,/const FAMILY='TD-3 \/ TD-3-MO'/);
  assert.match(guide,/window\.__303boxHardwareGuide=\{version:'2960'/);
  assert.doesNotMatch(guide,/requestMIDIAccess/);
  assert.doesNotMatch(guide,/beginExclusive/);
  assert.doesNotMatch(guide,/writeAndVerify/);
});

test('hardware fidelity uses one TD-3 family name and a bounded two-stage write flow',()=>{
  const fidelity=read('hardware-fidelity.20260826-2950.js');
  assert.match(fidelity,/const FAMILY='TD-3 \/ TD-3-MO'/);
  assert.match(fidelity,/TD3_WRITE_ATTEMPTS=2/);
  assert.match(fidelity,/TD3_READ_RETRIES=2/);
  assert.match(fidelity,/TD3_CONFIG=\[\.\.\.TD3_PREFIX,0x75,0xF7\]/);
  assert.match(fidelity,/operation\(prepareWrite,\{activeId:b\.id,exclusive:false,stopAudio:false,timeout:7000\}\)/);
  assert.match(fidelity,/operation\(commitWrite,\{activeId:b\.id,exclusive:true,stopAudio:true,timeout:18000\}\)/);
  assert.match(fidelity,/backup saved\. Nothing written yet/);
  assert.match(fidelity,/WRITE VERIFIED: notes, accents and slides match/);
  assert.match(fidelity,/readPair\(packet,0x0C\+i\*2\)/);
  assert.doesNotMatch(fidelity,/packByRests/);
});

test('legacy router remains limited to the two supported hardware families',()=>{
  const midi=read('midi-router.20260818-1730.js');
  assert.match(midi,/const ALLOWED=new Set\(\['auto','t8','td3'\]\)/);
  assert.match(midi,/TD3_SLIDE_TICKS=3/);
  assert.doesNotMatch(midi,/volca/i);
});

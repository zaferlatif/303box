import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const siteVersion='2026.08.26.1';
const releaseEpoch='20260826-2900';
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

test('site shell publishes the current release and loads the hardware fidelity module',()=>{
  const shell=read('site-shell.20260821-2600.js');
  assert.match(shell,new RegExp(`const SITE_VERSION='${siteVersion.replaceAll('.','\\.')}'`));
  assert.match(shell,new RegExp(`const RELEASE_EPOCH='${releaseEpoch}'`));
  assert.match(shell,/hardware-fidelity\.20260826-2900\.js/);
  assert.match(shell,/installHardwareFidelity\(\)/);
  assert.match(shell,/visibilitychange.*stopImmediatePropagation/s);
});

test('hardware fidelity owns TD-3 family naming, bass register correction and verified writer',()=>{
  const fidelity=read('hardware-fidelity.20260826-2900.js');
  assert.match(fidelity,/TD-3 \/ TD-3-MO/);
  assert.match(fidelity,/message\[1\]=clamp\(\(Number\(message\[1\]\)\|\|0\)-24,0,127\)/);
  assert.match(fidelity,/TD3_WRITE_ATTEMPTS=3/);
  assert.match(fidelity,/TD3_CONFIG=\[\.\.\.TD3_PREFIX,0x75,0xF7\]/);
  assert.match(fidelity,/WRITE VERIFIED: notes, accents, slides and timing match/);
  assert.match(fidelity,/readPair\(packet,0x0C\+i\*2\)/);
  assert.doesNotMatch(fidelity,/packByRests/);
});

test('legacy router remains limited to the two supported hardware families',()=>{
  const midi=read('midi-router.20260818-1730.js');
  assert.match(midi,/const ALLOWED=new Set\(\['auto','t8','td3'\]\)/);
  assert.match(midi,/TD3_SLIDE_TICKS=3/);
  assert.doesNotMatch(midi,/volca/i);
});

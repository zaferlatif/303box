import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const siteVersion='2026.08.24.4';
const cacheEpoch='20260824-2800';
const htmlFiles=['index.html','privacy.html','303-pattern-guide.html','acid-house-guide.html','tr/index.html','tr/303-pattern-rehberi.html','tr/acid-house-rehberi.html'];

test('all public pages retain one structural footer',()=>{
  const footers=htmlFiles.map(file=>{const html=read(file);const footer=html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];assert.ok(footer,`${file} must have the shared footer`);for(const required of ['data-disclaimer-link','data-shortcuts-link','/privacy.html','data-site-version'])assert.ok(footer.includes(required),`${file} footer missing ${required}`);return footer.replace(/v2026\.08\.\d+\.\d+/g,'VERSION')});
  for(const footer of footers.slice(1))assert.equal(footer,footers[0],'public footers must remain structurally identical');
});

test('site shell owns footer/version while MIDI geometry has a dedicated component-width authority',()=>{
  const shell=read('site-shell.20260821-2600.js'),midiLayout=read('midi-layout.20260824-2800.css'),home=read('index.html');
  assert.match(shell,new RegExp(`const SITE_VERSION='${siteVersion.replaceAll('.','\\.')}'`));
  assert.match(shell,/site-footer \.footer-inner\{width:min\(calc\(100% - 40px\),var\(--shell,1180px\)\)!important/);
  assert.doesNotMatch(shell,/midi-router-primary/,'site shell must not own MIDI geometry');
  assert.match(midiLayout,/container-type:inline-size!important/);
  assert.match(midiLayout,/@container midi-router \(max-width:680px\)/);
  assert.match(midiLayout,/midi-router-secondary>:nth-child\(5\).*grid-column:1!important/s);
  assert.match(midiLayout,/#midiPanic\{[\s\S]*?width:100%!important/);
  assert.ok(home.includes(`midi-layout.20260824-2800.css?v=${cacheEpoch}`),'home must load the fresh component-width MIDI authority');
  assert.ok(home.includes(`site-shell.20260821-2600.js?v=${cacheEpoch}`),'home must cache-bust the shared shell');
});

test('active MIDI and hardware modules expose only T-8 and TD-3 support',()=>{
  const midi=read('midi-router.20260818-1730.js'),guide=read('hardware-guide.20260819-0815.js');
  assert.match(midi,/const ALLOWED=new Set\(\['auto','t8','td3'\]\)/);
  assert.match(midi,/TD3_NORMAL_VELOCITY=80/);assert.match(midi,/TD3_ACCENT_VELOCITY=112/);
  assert.match(midi,/TD3_SLIDE_TICKS=3/);assert.match(midi,/TD3_SLIDE_MIN_OVERLAP_MS=24/);assert.match(midi,/TD3_SLIDE_MAX_OVERLAP_MS=72/);
  assert.match(midi,/version:'2402'/);assert.doesNotMatch(midi,/volca/i);assert.doesNotMatch(midi,/td3mo/i);
  assert.match(guide,/TD-3-MO and other devices are rejected/);assert.match(guide,/version:'2401'/);assert.doesNotMatch(guide,/Korg volca/i);
});

test('TD-3 live transport cannot start its stored sequencer and missed-step recovery does not restart MIDI',()=>{
  const midi=read('midi-router.20260818-1730.js');
  assert.match(midi,/td3:\{label:'Behringer TD-3'.*transport:false/);
  assert.match(midi,/state\.effective==='t8'&&state\.transport/);
  assert.doesNotMatch(midi,/absolute>state\.lastAbsoluteStep\+1\)\{\s*stopRouter/);
  assert.match(midi,/absolute>state\.lastAbsoluteStep\+1\).*heldBassNote/s);
});

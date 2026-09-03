import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const siteVersion='2026.09.03.1';
const releaseEpoch='20260903-3210';
const htmlFiles=[
  'index.html','privacy.html','guides.html','about.html','303-pattern-guide.html',
  'acid-house-guide.html','midi-hardware-guide.html','303-pattern-examples.html',
  'tr/index.html','tr/rehberler.html','tr/hakkinda.html','tr/303-pattern-rehberi.html',
  'tr/acid-house-rehberi.html','tr/midi-donanim-rehberi.html','tr/303-pattern-ornekleri.html'
];

test('all public pages load one current shell and retain a footer target',()=>{
  for(const file of htmlFiles){
    const html=read(file);
    assert.equal((html.match(/site-shell\.20260821-2600\.js\?v=/g)||[]).length,1,`${file} must load one site shell`);
    assert.match(html,new RegExp(`site-shell\\.20260821-2600\\.js\\?v=${releaseEpoch}`),`${file} must bust the shell cache`);
    assert.match(html,/<footer class="site-footer">[\s\S]*?<\/footer>/,`${file} must retain the shell footer target`);
  }
});

test('site shell publishes one idempotent release and loads the current writer',()=>{
  const shell=read('site-shell.20260821-2600.js');
  assert.match(shell,new RegExp(`const SITE_VERSION='${siteVersion.replaceAll('.','\\.')}'`));
  assert.match(shell,new RegExp(`const RELEASE_EPOCH='${releaseEpoch}'`));
  assert.match(shell,/hardware-fidelity\.20260826-2930\.js/);
  assert.match(shell,/header\.dataset\.shellChrome!==RELEASE_EPOCH/);
  assert.match(shell,/footer\.dataset\.shellChrome!==RELEASE_EPOCH/);
  assert.match(shell,/siteShellMobile3200/);
  assert.match(shell,/installPitchModel\(\)/);
  assert.match(shell,/installHardwareFidelity\(\)/);
  assert.match(shell,/visibilitychange.*stopImmediatePropagation/s);
});

test('runtime modules and the main page use the same cache epoch',()=>{
  assert.match(read('sequencer-engine.20260818-1740.js'),new RegExp(`const VERSION='${releaseEpoch}'`));
  const index=read('index.html');
  assert.doesNotMatch(index,/\?v=20260826-2940/);
  for(const script of ['app.js','midi-router.20260818-1730.js','hardware-guide.20260819-0815.js','sequencer-engine.20260818-1740.js']){
    assert.match(index,new RegExp(`${script.replaceAll('.','\\.')}\\?v=${releaseEpoch}`));
  }
});

test('legacy router remains limited to the two supported hardware families',()=>{
  const midi=read('midi-router.20260818-1730.js');
  assert.match(midi,/const ALLOWED=new Set\(\['auto','t8','td3'\]\)/);
  assert.match(midi,/TD3_SLIDE_TICKS=3/);
  assert.doesNotMatch(midi,/volca/i);
});

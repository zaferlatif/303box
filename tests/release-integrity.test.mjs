import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const release='20260821-2300';

test('the production entry point cache-busts every directly loaded script',()=>{
  const index=read('index.html');
  const scripts=[...index.matchAll(/<script[^>]+src="\.\/([^"?]+)\?v=([^"]+)"/g)]
    .map(([,file,version])=>({file,version}));
  assert.ok(scripts.length>=9,'expected all production entry scripts');
  assert.deepEqual([...new Set(scripts.map(x=>x.version))],[release]);
  for(const {file} of scripts)assert.ok(existsSync(path.join(root,file)),`missing entry script: ${file}`);
});

test('the dynamic loader and cache-reset epoch match the release',()=>{
  const loader=read('sequencer-engine.20260818-1740.js');
  assert.match(loader,new RegExp(`const VERSION='${release}'`));
  assert.doesNotMatch(loader,/runtimeFinal==='2204'|runtimeFinal='2204'/);
  assert.match(loader,/runtimeFinal==='2300'/);
  assert.match(loader,/runtimeFinal='2300'/);
  assert.match(read('cache-reset.20260818-1740.js'),new RegExp(`EPOCH='${release}'`));

  const lists=[...loader.matchAll(/const (?:CSS|JS)=\[([^;]+)\]/g)];
  assert.equal(lists.length,2,'loader must expose CSS and JS manifests');
  for(const [,body] of lists){
    for(const [,file] of body.matchAll(/'\.\/([^']+)'/g)){
      assert.ok(existsSync(path.join(root,file)),`missing runtime asset: ${file}`);
    }
  }
});

test('active modules use the shared language-change event',()=>{
  for(const file of [
    'consent.20260819-2100.js','content-stable.20260819-2000.js',
    'midi-router.20260818-1730.js','pattern-shell.20260818-1045.js',
    'seo.20260818-1740.js','studio.20260818-0912.js',
    't8-rhythm-rec-status.20260819-1830.js','ui-refresh.20260819-1750.js',
    'ui-system.20260819-2100.js','workstation-ui.20260818-1680.js'
  ]){
    const source=read(file);
    assert.match(source,/303box:languagechange/,`${file} must consume the shared event`);
    assert.doesNotMatch(source,/attributeFilter:\s*\['lang'\]/,`${file} must not retain a parallel lang observer`);
  }
});

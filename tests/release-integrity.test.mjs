import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const release='20260821-2600';
const siteVersion='2026.08.21.2';
const htmlFiles=[
  'index.html','privacy.html','303-pattern-guide.html','acid-house-guide.html',
  'tr/index.html','tr/303-pattern-rehberi.html','tr/acid-house-rehberi.html'
];

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

test('every public page shares one footer and one visible site version',()=>{
  const footers=htmlFiles.map(file=>{
    const html=read(file);
    assert.match(html,new RegExp(`site-shell\\.20260821-2600\\.js\\?v=${release}`),`${file} must load the shared site shell`);
    assert.match(html,new RegExp(`data-site-version>v${siteVersion.replaceAll('.','\\.')}`),`${file} must expose the current version`);
    const footer=html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer,`${file} must have the shared footer`);
    for(const required of ['data-disclaimer-link','data-shortcuts-link','/privacy.html','data-site-version'])assert.ok(footer.includes(required),`${file} footer is missing ${required}`);
    return footer;
  });
  for(const footer of footers.slice(1))assert.equal(footer,footers[0],'public footers must be structurally identical');

  const shell=read('site-shell.20260821-2600.js');
  assert.match(shell,new RegExp(`const SITE_VERSION='${siteVersion.replaceAll('.','\\.')}'`));
  assert.match(shell,/footerCredit:'303box is an independent music tool built by Z3Z\.'/);
  assert.match(shell,/footerCredit:'303box, Z3Z tarafından geliştirilen bağımsız bir müzik aracıdır\.'/);
});

test('home and privacy use the same translated header shell',()=>{
  const header=html=>html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
  assert.equal(header(read('privacy.html')),header(read('index.html')));
  const privacy=read('privacy.html');
  assert.match(privacy,/document\.dispatchEvent\(new CustomEvent\('303box:languagechange'/);
  assert.doesNotMatch(privacy,/privacyLanguageButton|privacyFooterText/);
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

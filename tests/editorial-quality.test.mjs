import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(path.join(root,file),'utf8');
const articlePages=[
  '303-pattern-examples.html','303-pattern-guide.html','acid-house-guide.html','midi-hardware-guide.html','td3-usb-transfer-lab.html',
  'tr/303-pattern-ornekleri.html','tr/303-pattern-rehberi.html','tr/acid-house-rehberi.html','tr/midi-donanim-rehberi.html','tr/td3-usb-aktarim-laboratuvari.html'
];
const publicPages=[
  'index.html','tr/index.html','guides.html','tr/rehberler.html','about.html','tr/hakkinda.html','privacy.html',...articlePages
];

// Structural checks are not a content-quality score or an AdSense approval test.
test('article authorship and dates are visible and agree with structured metadata',()=>{
  for(const file of articlePages){
    const html=read(file);
    assert.match(html,/class="article-meta"/,`${file} needs a visible byline`);
    assert.match(html,/<time datetime="2026-[^"]+">/,`${file} needs a visible date`);
    const data=JSON.parse((html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)||[])[1]);
    assert.ok(['Article','TechArticle'].includes(data['@type']),`${file} needs article schema`);
    assert.equal(data.author?.name,'Z3Z',`${file} needs a named author`);
    assert.match(data.datePublished||'',/^2026-/,`${file} needs datePublished`);
    assert.match(data.dateModified||'',/^2026-/,`${file} needs dateModified`);
    assert.ok(html.includes(`<time datetime="${data.dateModified}">`),`${file} must show its modification date`);
    assert.doesNotMatch(html,/Written and (?:field-)?tested by|Yazan ve (?:fiziksel cihazla )?test eden/);
  }
});

test('all public pages have canonical, indexable metadata and no broken local links',()=>{
  for(const file of publicPages){
    const html=read(file);
    assert.match(html,/<meta name="robots" content="[^"]*index,follow/,`${file} must be indexable`);
    assert.match(html,/<link rel="canonical" href="https:\/\/303box\.com\//,`${file} needs a canonical URL`);
    for(const match of html.matchAll(/href=["']([^"']+)["']/g)){
      const href=match[1];
      if(!href.startsWith('/')||href.startsWith('//'))continue;
      const pathname=href.split(/[?#]/)[0];
      if(!pathname)continue;
      const target=pathname==='/'?'index.html':pathname==='/tr/'?'tr/index.html':pathname.slice(1);
      assert.ok(existsSync(path.join(root,target)),`${file} links to missing ${target}`);
    }
  }
});

test('transfer diagnostics are discoverable from the library, hardware guide and sitemap',()=>{
  for(const file of ['guides.html','midi-hardware-guide.html','sitemap.xml'])assert.match(read(file),/td3-usb-transfer-lab\.html/,`${file} must link the English diagnostic guide`);
  for(const file of ['tr/rehberler.html','tr/midi-donanim-rehberi.html','sitemap.xml'])assert.match(read(file),/td3-usb-aktarim-laboratuvari\.html/,`${file} must link the Turkish diagnostic guide`);
});

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

function textWords(html){
  const main=(html.match(/<main\b[\s\S]*?<\/main>/i)||[''])[0];
  return main.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ').trim().split(/\s+/).filter(Boolean);
}

test('editorial articles expose authorship, dates, evidence and substantial copy',()=>{
  for(const file of articlePages){
    const html=read(file);
    assert.match(html,/class="article-meta"/,`${file} needs a visible byline`);
    assert.match(html,/<time datetime="2026-[^"]+">/,`${file} needs a visible date`);
    assert.match(html,/class="evidence-note"/,`${file} needs first-hand or reproducible evidence`);
    assert.ok(textWords(html).length>=650,`${file} needs at least 650 meaningful words`);
    const data=JSON.parse((html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)||[])[1]);
    assert.ok(['Article','TechArticle'].includes(data['@type']),`${file} needs article schema`);
    assert.equal(data.author?.name,'Z3Z',`${file} needs a named author`);
    assert.match(data.datePublished||'',/^2026-/,`${file} needs datePublished`);
    assert.match(data.dateModified||'',/^2026-/,`${file} needs dateModified`);
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

test('the field report is discoverable from the library, hardware guide and sitemap',()=>{
  for(const file of ['guides.html','midi-hardware-guide.html','sitemap.xml'])assert.match(read(file),/td3-usb-transfer-lab\.html/,`${file} must link the English field report`);
  for(const file of ['tr/rehberler.html','tr/midi-donanim-rehberi.html','sitemap.xml'])assert.match(read(file),/td3-usb-aktarim-laboratuvari\.html/,`${file} must link the Turkish field report`);
});

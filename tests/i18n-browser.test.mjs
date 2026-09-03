import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const systemChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync(systemChrome)?systemChrome:undefined);
const browser=await chromium.launch({headless:true,executablePath});
const context=await browser.newContext({locale:'en-US'});
const page=await context.newPage();

try{
  await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('html.app-ready',{timeout:10000});
  await page.waitForSelector('#td3DirectBox',{state:'attached',timeout:3000});

  const text=selector=>page.locator(selector).first().textContent().then(value=>value?.trim());
  assert.equal(await text('#heroTitle'),'Sketch the pattern here. Perform it on your hardware.');
  assert.equal(await text('#midiOutputLabel'),'OUTPUT');
  assert.equal(await text('#drums .drum-intro h2'),'Build the rhythm beside the acid line.');
  assert.equal(await text('#td3WritePattern'),'BACKUP + WRITE');
  await page.locator('#midiHardwareGuide').click();
  await page.waitForFunction(()=>document.querySelector('#hardwareGuideDialog')?.open===true);
  assert.equal(await text('#td3DirectStatus'),'I / A1 — target selected. Nothing has been written.');
  await page.locator('#hardwareGuideClose').click();

  await page.locator('#languageButton').click();
  await page.waitForFunction(()=>document.documentElement.lang==='tr');
  await page.waitForFunction(()=>document.querySelector('#td3WritePattern')?.textContent.trim()==='YEDEKLE + YAZ');
  assert.equal(await text('#heroTitle'),'Pattern’i burada tasarla. Donanımında performe et.');
  assert.equal(await text('#midiOutputLabel'),'ÇIKIŞ');
  assert.equal(await text('#drums .drum-intro h2'),'Acid hattının yanına ritmi kur.');
  assert.equal(await text('#td3WritePattern'),'YEDEKLE + YAZ');
  assert.equal(await text('#td3DirectStatus'),'I / A1 — hedef seçildi. Henüz hiçbir şey yazılmadı.',
    'the status must be regenerated in the current language');
  assert.equal(await text('.visual-head > span:first-child'),'303box / SİNYAL');
  assert.equal(await text('.signal-live'),'CANLI');
  assert.equal(await text('.acid-console-head > span'),'ACID KONSOLU');
  assert.equal(await text('[data-preview="cp"] span'),'El Çırpma');
  assert.equal(await text('[data-preview="tm"] span'),'Pes Tom');
  assert.equal(await text('[data-cookie-settings]'),'Çerez ayarları');
  assert.equal(await text('[data-device="td3"] .hardware-capability:nth-child(4) strong'),'303box USB üzerinden bir TD-3 pattern slotunu okuyabilir, yedekleyebilir, yazabilir ve doğrulayabilir. Protokol tersine mühendisliktir; üretici tarafından yayımlanmamıştır.');

  await page.locator('#midiHardwareGuide').click();
  await page.waitForFunction(()=>document.querySelector('#hardwareGuideDialog')?.open===true);
  const visibleTurkish=await page.locator('body').innerText();
  if(process.env.I18N_DUMP==='1')console.log(visibleTurkish);
  for(const staleEnglish of [
    'WHAT 303BOX IS','Build the rhythm beside the acid line.','Hardware verification required',
    'BACKUP + WRITE','RESTORE LAST BACKUP','READ TARGET ONLY','TEST READ (NO WRITE)','RANDOM PATCH',
    'TUNE','DELAY','DISTORTION','REVERB','FEEDBACK'
  ])assert.ok(!visibleTurkish.includes(staleEnglish),`stale English remained in Turkish UI: ${staleEnglish}`);
  await page.locator('#hardwareGuideClose').click();

  await page.locator('#languageButton').click();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.waitForFunction(()=>document.querySelector('#td3WritePattern')?.textContent.trim()==='BACKUP + WRITE');
  assert.equal(await text('#midiPlaybackLabel'),'PLAYBACK');
  assert.equal(await text('[data-site-version]'),'v2026.09.03.1');
  const mainFooterLinks=await page.locator('.site-footer .footer-links a').allTextContents();
  await page.locator('[data-shortcuts-link]').click();
  await page.waitForSelector('#shortcutOverlay.open');
  await page.locator('#shortcutX').click();

  await page.goto(pathToFileURL(path.join(root,'privacy.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-privacy-lang="en"].active');
  assert.equal(await text('.brand-copy small'),'Acid pattern laboratory');
  assert.equal(await text('.mini-cta'),'Open sequencer');
  assert.equal(await text('.z3z-credit > span'),'303box is an independent music tool built by Z3Z.');
  assert.equal(await text('[data-site-version]'),'v2026.09.03.1');
  assert.deepEqual(await page.locator('.site-footer .footer-links a').allTextContents(),mainFooterLinks);
  assert.equal(await page.locator('[data-disclaimer-link]').getAttribute('href'),'/' + '#disclaimer');
  assert.equal(await page.locator('[data-shortcuts-link]').getAttribute('href'),'/' + '#shortcuts');

  await page.locator('#languageButton').click({force:true});
  await page.waitForSelector('[data-privacy-lang="tr"].active');
  assert.equal(await text('.brand-copy small'),'Acid pattern laboratuvarı');
  assert.equal(await text('.mini-cta'),'Sequencer’ı aç');
  assert.equal(await text('[data-disclaimer-link]'),'Sorumluluk');
  assert.equal(await text('[data-shortcuts-link]'),'Kısayollar');
  assert.equal(await text('.z3z-credit > span'),'303box, Z3Z tarafından geliştirilen bağımsız bir müzik aracıdır.');
  assert.equal(await page.title(),'Gizlilik Politikası — 303box');
  console.log('browser i18n OK: main + privacy EN → TR → EN, shared header/footer and late TD-3 UI');
}finally{
  await browser.close();
}

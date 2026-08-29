import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const USER_DATA = path.resolve('data/chrome-profile');
const STORAGE = path.resolve('data/storageState.json');

console.log('=== GEMINI BROWSER LOGIN ===');
console.log('Launching browser with Chrome profile...');

const browser = await chromium.launchPersistentContext(USER_DATA, {
  headless: false,
  channel: 'chrome',
  viewport: { width: 1280, height: 900 },
  args: ['--disable-blink-features=AutomationControlled']
});

const page = browser.pages()[0] || await browser.newPage();
await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });

console.log('\n1. Silakan login ke akun Google Pro Anda di jendela browser.');
console.log('2. Pastikan halaman Gemini siap digunakan.');
console.log('3. Setelah selesai, kembali ke terminal ini dan tekan ENTER untuk menyimpan sesi.\n');

await new Promise((resolve) => {
  process.stdin.resume();
  process.stdin.once('data', resolve);
  browser.on('close', resolve);
});

console.log('Menyimpan storage state...');
await browser.storageState({ path: STORAGE });
console.log('Berhasil disimpan di:', STORAGE);
await browser.close();
process.exit(0);

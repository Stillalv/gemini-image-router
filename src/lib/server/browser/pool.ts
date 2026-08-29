import { chromium, type BrowserContext, type Page } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const STORAGE = path.resolve('data/storageState.json');
const USER_DATA = path.resolve('data/chrome-profile');
const MAX_CONCURRENT_TABS = parseInt(process.env.MAX_TABS || '3', 10);

let browserContext: BrowserContext | null = null;
const availablePages: Page[] = [];
const busyPages = new Set<Page>();
const taskQueue: Array<(page: Page) => void> = [];

export async function getBrowserContext(): Promise<BrowserContext> {
  if (browserContext) return browserContext;
  const hasStorage = fs.existsSync(STORAGE);
  console.log(`[BROWSER] Launching persistent Chrome context (Max Tabs: ${MAX_CONCURRENT_TABS})...`);
  
  const launchOptions: any = {
    headless: true,
    channel: 'chrome',
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  };

  if (hasStorage) {
    launchOptions.storageState = STORAGE;
  }

  try {
    browserContext = await chromium.launchPersistentContext(USER_DATA, launchOptions);
  } catch (err: any) {
    console.warn('[BROWSER] First launch attempt failed, retrying after cleanup...', err.message);
    try {
      if (process.platform === 'win32') {
        const { execSync } = await import('node:child_process');
        execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' });
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
    browserContext = await chromium.launchPersistentContext(USER_DATA, launchOptions);
  }

  browserContext.on('close', () => {
    browserContext = null;
    availablePages.length = 0;
    busyPages.clear();
  });

  return browserContext;
}

async function createWarmPage(): Promise<Page> {
  const ctx = await getBrowserContext();
  const page = await ctx.newPage();
  console.log(`[POOL] Spawning new Gemini tab... Total tabs open: ${ctx.pages().length}`);
  await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('rich-textarea div[contenteditable="true"], div.ql-editor[contenteditable="true"], div[role="textbox"]', { timeout: 30000 }).catch(() => {});
  return page;
}

export async function acquirePage(): Promise<Page> {
  await getBrowserContext();

  while (availablePages.length > 0) {
    const candidate = availablePages.pop()!;
    if (!candidate.isClosed()) {
      busyPages.add(candidate);
      return candidate;
    }
  }

  if (busyPages.size < MAX_CONCURRENT_TABS) {
    const newPage = await createWarmPage();
    busyPages.add(newPage);
    return newPage;
  }

  return new Promise((resolve) => {
    taskQueue.push(resolve);
  });
}

export function releasePage(page: Page): void {
  busyPages.delete(page);
  if (page.isClosed()) {
    if (taskQueue.length > 0) {
      const next = taskQueue.shift()!;
      createWarmPage().then((newPage) => {
        busyPages.add(newPage);
        next(newPage);
      });
    }
    return;
  }

  if (taskQueue.length > 0) {
    const next = taskQueue.shift()!;
    busyPages.add(page);
    next(page);
  } else {
    availablePages.push(page);
  }
}

export function getPoolStatus() {
  return {
    maxTabs: MAX_CONCURRENT_TABS,
    busyTabs: busyPages.size,
    idleTabs: availablePages.length,
    queuedTasks: taskQueue.length
  };
}

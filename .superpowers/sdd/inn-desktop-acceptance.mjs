import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
async function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
  const cacheRoot = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
  const cacheEntries = await fs.readdir(cacheRoot, { withFileTypes: true });
  for (const entry of cacheEntries) {
    if (!entry.isDirectory()) continue;
    const packageJson = path.join(cacheRoot, entry.name, 'node_modules', 'playwright', 'package.json');
    try {
      await fs.access(packageJson);
      return createRequire(packageJson)('playwright');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw new Error('Playwright was not found in the project or the local npm npx cache');
}

const { chromium } = await loadPlaywright();
const baseUrl = process.env.ACCEPTANCE_BASE_URL ?? 'http://127.0.0.1:5199';
const outDir = '.superpowers/sdd';
const evidencePath = `${outDir}/task-6-desktop-evidence.json`;
const screenshotPath = `${outDir}/task-6-desktop.png`;

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});

let evidence;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const githubResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({
    url: request.url(),
    method: request.method(),
    error: request.failure()?.errorText ?? 'unknown request failure',
  }));
  page.on('response', (response) => {
    if (response.url().startsWith('https://api.github.com/')) {
      githubResponses.push({ url: response.url(), status: response.status() });
    }
  });

  const navigationResponse = await page.goto(`${baseUrl}/character/torvalds`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  await page.locator('.wall-display').first().waitFor({ state: 'attached', timeout: 15_000 });

  const layout = await page.evaluate(() => {
    const displays = [...document.querySelectorAll('.wall-display')];
    const nameplateElement = document.querySelector('.nameplate');
    if (!nameplateElement) throw new Error('Missing .nameplate');
    const nameplate = nameplateElement.getBoundingClientRect();
    const capeElement = document.querySelector('.skillcape');
    const cape = capeElement?.getBoundingClientRect() ?? null;
    const rects = displays.map((element) => ({ id: element.dataset.displayId, rect: element.getBoundingClientRect().toJSON() }));
    const portraitElement = document.querySelector('.player-portrait');
    if (!portraitElement) throw new Error('Missing .player-portrait');
    const portrait = portraitElement.getBoundingClientRect();
    const portraitOcclusions = rects.filter(({ rect }) =>
      rect.left < portrait.right && rect.right > portrait.left &&
      rect.top < portrait.bottom && rect.bottom > portrait.top
    ).map(({ id }) => id);
    const overlaps = rects.flatMap((left, index) => rects.slice(index + 1).filter((right) =>
      left.rect.left < right.rect.right && left.rect.right > right.rect.left &&
      left.rect.top < right.rect.bottom && left.rect.bottom > right.rect.top
    ).map((right) => [left.id, right.id]));
    return {
      displayCount: displays.length,
      visibleDisplayCount: displays.filter((item) => {
        const rect = item.getBoundingClientRect();
        const style = getComputedStyle(item);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      }).length,
      displayIds: displays.map((item) => item.dataset.displayId),
      uniqueDisplayCount: new Set(displays.map((item) => item.dataset.displayId)).size,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      documentWidth: { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth },
      rects,
      overlaps,
      portrait: portrait.toJSON(),
      portraitOcclusions,
      nameplateZ: getComputedStyle(nameplateElement).zIndex,
      capeZ: capeElement ? getComputedStyle(capeElement).zIndex : null,
      nameplate: nameplate.toJSON(),
      cape: cape?.toJSON() ?? null,
    };
  });

  const firstDisplay = page.locator('.wall-display').first();
  const lastDisplay = page.locator('.wall-display').last();
  const displaysVisible = await firstDisplay.isVisible() && await lastDisplay.isVisible();
  if (displaysVisible) await firstDisplay.focus();
  const focusTooltipVisible = displaysVisible && await firstDisplay.locator('.wall-display-tooltip').isVisible();
  if (displaysVisible) await lastDisplay.hover();
  const hoverTooltipVisible = displaysVisible && await lastDisplay.locator('.wall-display-tooltip').isVisible();
  await page.screenshot({ path: screenshotPath, fullPage: true });

  evidence = {
    timestamp: new Date().toISOString(),
    baseUrl,
    route: '/character/torvalds',
    browser: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true },
    viewport: { width: 1440, height: 1000 },
    navigationStatus: navigationResponse?.status() ?? null,
    layout,
    interactions: { focusTooltipVisible, hoverTooltipVisible },
    githubResponses,
    consoleErrors,
    pageErrors,
    failedRequests,
    screenshotPath,
  };

  const unresolvedFailedRequests = failedRequests.filter((request) =>
    !githubResponses.some((response) => response.url === request.url && response.status === 200)
  );
  const failures = [];
  if (evidence.navigationStatus !== 200) failures.push(`navigation status was ${evidence.navigationStatus}`);
  if (layout.displayCount < 1) failures.push('expected at least one wall display');
  if (layout.visibleDisplayCount !== layout.displayCount) failures.push(`only ${layout.visibleDisplayCount} of ${layout.displayCount} wall displays are visible`);
  if (layout.uniqueDisplayCount !== layout.displayCount) failures.push('wall display IDs are not unique');
  if (layout.displayIds.some((id) => !id)) failures.push('a wall display is missing data-display-id');
  if (layout.overlaps.length) failures.push(`wall displays overlap: ${JSON.stringify(layout.overlaps)}`);
  if (layout.portraitOcclusions.length) failures.push(`wall displays intersect player portrait: ${JSON.stringify(layout.portraitOcclusions)}`);
  if (layout.horizontalOverflow) failures.push(`horizontal overflow: ${JSON.stringify(layout.documentWidth)}`);
  if (layout.nameplateZ !== '5') failures.push(`nameplate z-index was ${layout.nameplateZ}, expected 5`);
  if (layout.capeZ !== '0') failures.push(`cape z-index was ${layout.capeZ}, expected 0`);
  if (!(Number(layout.nameplateZ) > Number(layout.capeZ))) failures.push('nameplate is not above cape');
  if (!focusTooltipVisible) failures.push('focus tooltip is not visible');
  if (!hoverTooltipVisible) failures.push('hover tooltip is not visible');
  if (!githubResponses.length) failures.push('no GitHub API responses were observed');
  if (githubResponses.some(({ status }) => status !== 200)) failures.push(`non-200 GitHub response: ${JSON.stringify(githubResponses)}`);
  if (consoleErrors.length) failures.push(`console errors: ${JSON.stringify(consoleErrors)}`);
  if (pageErrors.length) failures.push(`page errors: ${JSON.stringify(pageErrors)}`);
  if (unresolvedFailedRequests.length) failures.push(`failed requests: ${JSON.stringify(unresolvedFailedRequests)}`);

  evidence.failures = failures;
  evidence.passed = failures.length === 0;
  await fs.writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  await context.close();
  if (failures.length) throw new Error(`Desktop acceptance failed:\n- ${failures.join('\n- ')}`);
} finally {
  await browser.close();
}

// Run against the production preview or deployed site. PLAYWRIGHT_PACKAGE is optional.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const playwright = process.env.PLAYWRIGHT_PACKAGE
  ? await import(pathToFileURL(process.env.PLAYWRIGHT_PACKAGE).href)
  : await import('playwright');
const base = process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:5176/melbourne-pt-connectivity-dashboard/';
const shots = process.env.QA_OUTPUT_DIR || join(tmpdir(), 'melbourne-public-qa');
await mkdir(shots, { recursive: true });
const browser = await playwright.chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const pageErrors = [], consoleErrors = [], brokenAssets = [], backendRequests = [];
const cartoTiles = [], failedCartoTiles = [], osmStandardTiles = [];
const safeMessage = value => value.replace(/([?&]key=)[^&#\s]+/gi, '$1[redacted]');
page.on('pageerror', error => pageErrors.push(safeMessage(error.message)));
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(safeMessage(message.text())); });
page.on('response', response => {
  const url = new URL(response.url());
  if (url.hostname === 'basemaps.cartocdn.com' && url.pathname.startsWith('/rastertiles/light_all/')) {
    (response.ok() ? cartoTiles : failedCartoTiles).push([response.status(), url.pathname]);
  }
  if (response.status() >= 400 && url.origin === new URL(base).origin) brokenAssets.push([response.status(), response.url()]);
});
page.on('request', request => {
  if (/\/geoserver\/|127\.0\.0\.1:8085|localhost:8085/.test(request.url())) backendRequests.push(request.url());
  const url = new URL(request.url());
  if (url.hostname === 'tile.openstreetmap.org') osmStandardTiles.push(url.pathname);
});
page.on('requestfailed', request => {
  const url = new URL(request.url());
  if (url.hostname === 'basemaps.cartocdn.com') failedCartoTiles.push(['request failed', url.pathname]);
});
const nav = async key => {
  await page.locator(`#navigation [data-page="${key}"]`).click();
  assert.equal(await page.locator('#content').getAttribute('data-page'), key);
};
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.kpi-grid').waitFor();
  assert.equal(await page.title(), 'Melbourne PT Connectivity Analysis');
  assert.equal(new URL(page.url()).pathname, new URL(base).pathname);
  assert.equal(await page.locator('html').getAttribute('data-study-source'), 'Validated static publication snapshot');
  assert.match(await page.locator('.kpi-grid').innerText(), /100[\s\S]*Routes analysed/);
  await page.screenshot({ path: join(shots, 'overview.png') });

  await nav('matrix');
  assert.equal(await page.locator('.matrix-cell').count(), 90);
  await page.locator('#metric-select').selectOption('transfers');
  await page.locator('.matrix-cell[data-route="OD_AC02_AC06"]').click();
  assert.equal(await page.locator('#page-title').innerText(), 'Melton → Ringwood');
  assert.equal(await page.locator('.timeline .journey-leg').count(), 7);
  await page.locator('#reverse-route').click();
  assert.equal(await page.locator('#page-title').innerText(), 'Ringwood → Melton');
  await page.locator('#reverse-route').click();
  await nav('map');
  assert.equal(await page.locator('#metric-select').inputValue(), 'transfers');
  assert.ok(await page.locator('#map canvas').count() > 0);
  assert.equal(await page.locator('.map-selection').isVisible(), true);
  await page.waitForFunction(() => Array.from(document.querySelectorAll('#map .ol-attribution a')).some(link => link.href.includes('carto.com/attribution')));
  assert.match(await page.locator('#map .ol-attribution').innerText(), /OpenStreetMap[\s\S]*CARTO/);
  await page.waitForTimeout(1200);
  assert.ok(cartoTiles.length > 0, 'CARTO Light tiles must load');
  assert.deepEqual(failedCartoTiles, []);
  assert.deepEqual(osmStandardTiles, []);
  await page.screenshot({ path: join(shots, 'map-selected.png') });
  await page.locator('#clear-selection').click();
  await page.locator('[data-threshold="travel_time_min"]').fill('150');
  await page.locator('#apply-filters').click();
  assert.match(await page.locator('.map-summary').innerText(), /Showing \d+ of 90 routes/);
  await page.locator('#open-route-list').click();
  assert.ok(await page.locator('.route-list button').count() > 0);
  await page.locator('#reset-filters').click();

  await nav('centres');
  await page.locator('#centre-select').selectOption('AC06');
  assert.match(await page.locator('.profile-metrics').innerText(), /9\s+Destinations/);
  await nav('statistics');
  await page.locator('[data-stats-tab="travel"]').click();
  assert.equal(await page.locator('.centre-ranking .ranking-track').count(), 10);
  await page.locator('#scope-select').selectOption('outer_to_cbd_benchmark');
  assert.match(await page.locator('#content').innerText(), /10 saved journeys/);
  await nav('compare');
  await page.locator('#compare-origin').selectOption('AC02');
  assert.match(await page.locator('.card-subtitle').innerText(), /9 Outer → Outer journeys · 1 Outer → CBD/);
  await nav('methodology');
  assert.match(await page.locator('#content').innerText(), /13 October 2026/);

  await page.goto(base + '#compare', { waitUntil: 'domcontentloaded' });
  await page.locator('#content[data-page="compare"]').waitFor();
  await page.reload();
  await page.locator('#content[data-page="compare"]').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const key of ['dashboard', 'matrix', 'map', 'explorer', 'centres', 'statistics', 'compare', 'methodology']) {
    await page.locator('#menu-toggle').click();
    await nav(key);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, key);
  }
  await page.screenshot({ path: join(shots, 'mobile-methods.png') });
  await page.locator('#menu-toggle').click();
  await nav('map');
  const mobileMap = await page.locator('.map-panel').boundingBox();
  const mobileFilters = await page.locator('.map-filters').boundingBox();
  assert.ok(mobileMap.y < mobileFilters.y, 'mobile map precedes optional filters');
  assert.ok(mobileFilters.y < (await page.locator('.map-legend').boundingBox()).y, 'mobile filters precede compact legend');
  assert.ok(mobileMap.height >= 340 && mobileMap.height <= 720, 'mobile map uses viewport-responsive height');
  assert.equal(await page.locator('#toggle-map-filters').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#toggle-map-legend').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#expand-map').isVisible(), true);
  await page.waitForTimeout(1200);
  assert.match(await page.locator('#map .ol-attribution').innerText(), /OpenStreetMap[\s\S]*CARTO/);
  await page.screenshot({ path: join(shots, 'mobile-map.png'), fullPage: true });
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(backendRequests, []);
  assert.deepEqual(brokenAssets, []);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(failedCartoTiles, []);
  assert.deepEqual(osmStandardTiles, []);
  console.log(JSON.stringify({ pages: 8, viewport: ['1440x900', '390x844'], screenshots: shots, cartoTileResponses: cartoTiles.length, failedCartoTiles, osmStandardTiles, pageErrors, consoleErrors, brokenAssets, backendRequests }));
} finally {
  await browser.close();
}

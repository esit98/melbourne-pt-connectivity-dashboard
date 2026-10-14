// Production-preview and GitHub Pages checks for the mobile Network Explorer.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const playwright = process.env.PLAYWRIGHT_PACKAGE
  ? await import(pathToFileURL(process.env.PLAYWRIGHT_PACKAGE).href)
  : await import('playwright');
const base = process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:5176/melbourne-pt-connectivity-dashboard/';
const shots = process.env.QA_OUTPUT_DIR || join(tmpdir(), 'melbourne-mobile-map-qa');
await mkdir(shots, { recursive: true });
const browser = await playwright.chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const errors = [], brokenAssets = [], backendRequests = [], cartoTiles = [];
const safe = value => value.replace(/([?&]key=)[^&#\s]+/gi, '$1[redacted]');
page.on('pageerror', error => errors.push(safe(error.message)));
page.on('console', message => { if (message.type() === 'error') errors.push(safe(message.text())); });
page.on('response', response => {
  const url = new URL(response.url());
  if (url.hostname === 'basemaps.cartocdn.com' && url.pathname.startsWith('/rastertiles/light_all/')) {
    cartoTiles.push([response.status(), url.pathname]);
  }
  if (url.origin === new URL(base).origin && response.status() >= 400) brokenAssets.push([response.status(), url.pathname]);
});
page.on('request', request => {
  if (/\/geoserver\/|127\.0\.0\.1:8085|localhost:8085/.test(request.url())) backendRequests.push(request.url());
});
const nav = async key => {
  if (await page.locator('#menu-toggle').isVisible()) await page.locator('#menu-toggle').click();
  await page.locator(`#navigation [data-page="${key}"]`).click();
  assert.equal(await page.locator('#content').getAttribute('data-page'), key);
};
const assertNoOverflow = async label => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, label);
try {
  await page.goto(base + '#map', { waitUntil: 'domcontentloaded' });
  await page.locator('#content[data-page="map"] #map canvas').first().waitFor();
  assert.equal(await page.title(), 'Melbourne PT Connectivity Analysis');
  assert.match(await page.locator('html').getAttribute('data-study-source'), /Validated static publication snapshot/);

  for (const width of [320, 375, 390, 430, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(100);
    await assertNoOverflow(`${width}px viewport`);
    const map = await page.locator('.map-panel').boundingBox();
    const filters = await page.locator('.map-filters').boundingBox();
    assert.ok(map?.width > 0 && map?.height > 0, `${width}px map visible`);
    if (width <= 640) {
      assert.ok(map.y < filters.y, `${width}px map precedes filters`);
      assert.ok(filters.y < (await page.locator('.map-legend').boundingBox()).y, `${width}px filters precede legend`);
      assert.ok(map.height >= 340 && map.height <= 720, `${width}px responsive map height`);
      assert.equal(await page.locator('#toggle-map-filters').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#toggle-map-legend').getAttribute('aria-expanded'), 'false');
      if (width === 320) {
        await page.locator('#expand-map').click();
        await assertNoOverflow('320px expanded map');
        assert.ok((await page.locator('.map-panel').boundingBox()).height > 0.7 * 844);
        await page.locator('#expand-map').click();
      }
    } else {
      assert.equal(await page.locator('#expand-map').isVisible(), false);
      assert.equal(await page.locator('.map-legend-content').isVisible(), true);
    }
    if (width === 1440) await page.screenshot({ path: join(shots, 'desktop-map.png') });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(shots, 'mobile-normal.png'), fullPage: true });
  assert.match(await page.locator('#map .ol-attribution').innerText(), /OpenStreetMap[\s\S]*CARTO/);
  for (const metric of ['travel_time_min', 'transfers', 'detour_ratio', 'walking_distance_m', 'minutes_per_direct_km']) {
    await page.locator('#metric-select').selectOption(metric);
    assert.equal(await page.locator('#metric-select').inputValue(), metric);
  }
  await page.locator('#metric-select').selectOption('transfers');
  await page.locator('#toggle-map-legend').click();
  assert.equal(await page.locator('#toggle-map-legend').getAttribute('aria-expanded'), 'true');
  assert.match(await page.locator('.map-legend-content').innerText(), /Exact transfer counts/);
  await page.locator('#toggle-map-legend').click();
  await page.locator('#metric-select').selectOption('travel_time_min');
  for (const [scope, count] of [['outer_to_cbd_benchmark', 10], ['compare', 100], ['outer_to_outer', 90]]) {
    await page.locator('#scope-select').selectOption(scope);
    assert.match(await page.locator('.map-summary').innerText(), new RegExp(`Showing ${count} of ${count} routes`));
  }

  await page.locator('#toggle-map-filters').click();
  assert.equal(await page.locator('#toggle-map-filters').getAttribute('aria-expanded'), 'true');
  await page.locator('[data-threshold="travel_time_min"]').fill('150');
  await page.locator('#apply-filters').click();
  assert.match(await page.locator('#toggle-map-filters').innerText(), /1 active/);
  assert.match(await page.locator('.map-summary').innerText(), /Showing \d+ of 90 routes/);
  await page.screenshot({ path: join(shots, 'mobile-filters-expanded.png'), fullPage: true });
  await page.locator('#toggle-map-filters').click();
  assert.equal(await page.locator('#toggle-map-filters').getAttribute('aria-expanded'), 'false');
  await page.locator('#toggle-map-filters').click();
  assert.equal(await page.locator('[data-threshold="travel_time_min"]').inputValue(), '150');
  await page.locator('#reset-filters').click();
  assert.match(await page.locator('#toggle-map-filters').innerText(), /0 active/);
  await page.locator('.map-filter-content details').evaluate(el => { el.open = true; });
  await page.locator('#filter-origin').selectOption('AC02');
  await page.locator('#filter-match').selectOption('any');
  await page.locator('#apply-filters').click();
  assert.match(await page.locator('#toggle-map-filters').innerText(), /2 active/);
  assert.match(await page.locator('.map-summary').innerText(), /Showing 9 of 90 routes/);
  await page.locator('#show-centres').uncheck();
  assert.equal(await page.locator('#show-centres').isChecked(), false);
  await page.locator('#show-centres').check();
  await page.locator('#reset-filters').click();
  await page.locator('#toggle-map-filters').click();

  await nav('matrix');
  await page.locator('.matrix-cell[data-route="OD_AC02_AC06"]').click();
  assert.equal(await page.locator('#page-title').innerText(), 'Melton → Ringwood');
  await nav('map');
  assert.match(await page.locator('.map-selection').innerText(), /Melton → Ringwood[\s\S]*157\.2 min · 2 transfers/);
  await page.screenshot({ path: join(shots, 'mobile-selected.png'), fullPage: true });
  await page.locator('#toggle-route-details').click();
  assert.equal(await page.locator('#toggle-route-details').getAttribute('aria-expanded'), 'true');
  assert.match(await page.locator('#map-route-details').innerText(), /Detour ratio/);
  await page.locator('#toggle-route-details').click();
  await page.locator('#toggle-map-filters').click();
  await page.locator('[data-threshold="travel_time_min"]').fill('150');
  await page.locator('#apply-filters').click();
  await page.locator('#toggle-map-filters').click();
  await page.locator('#metric-select').selectOption('transfers');

  const mapHandle = await page.locator('#map').elementHandle();
  await page.locator('#expand-map').click();
  assert.equal(await page.locator('.map-stage').getAttribute('role'), 'dialog');
  assert.equal(await page.locator('#expand-map').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#expand-map').evaluate(el => document.activeElement === el), true);
  assert.equal(await mapHandle.evaluate(el => el.isConnected), true, 'same OpenLayers target remains mounted');
  assert.ok((await page.locator('.map-panel').boundingBox()).height > 0.65 * 844);
  assert.match(await page.locator('#toggle-map-legend').innerText(), /Passenger transfers/);
  assert.match(await page.locator('.map-selection').innerText(), /Melton → Ringwood/);
  assert.match(await page.locator('#map .ol-attribution').innerText(), /OpenStreetMap[\s\S]*CARTO/);
  assert.match(await page.locator('.map-selection').innerText(), /Melton → Ringwood/);
  await page.locator('.map-stage .ol-zoom-in').click();
  await page.locator('#fit-map-mobile').click();
  await page.screenshot({ path: join(shots, 'mobile-fullscreen.png') });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#expand-map').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#expand-map').evaluate(el => document.activeElement === el), true);
  assert.equal(await page.locator('#map-legend-mobile-slot .map-legend').count(), 1);
  assert.equal(await page.locator('#metric-select').inputValue(), 'transfers');
  assert.match(await page.locator('#toggle-map-filters').innerText(), /1 active/);
  await page.locator('#expand-map').click();
  await page.locator('#expand-map').click();
  assert.match(await page.locator('.map-selection').innerText(), /Melton → Ringwood/);
  await page.locator('.map-selection [data-page="explorer"]').click();
  assert.equal(await page.locator('#content').getAttribute('data-page'), 'explorer');
  await nav('map');
  assert.match(await page.locator('.map-selection').innerText(), /Melton → Ringwood/);
  await page.locator('#toggle-map-filters').click();
  await page.locator('#reset-filters').click();
  await page.locator('#toggle-map-filters').click();
  await page.locator('#metric-select').selectOption('travel_time_min');
  await page.locator('#clear-selection').click();
  assert.equal(await page.locator('.map-selection').count(), 0);

  const mapBox = await page.locator('.map-panel').boundingBox();
  await page.screenshot({ path: join(shots, 'mobile-before-touch.png') });
  await page.touchscreen.tap(mapBox.x + mapBox.width * 0.45, mapBox.y + mapBox.height * 0.41);
  await page.waitForTimeout(400); // OpenLayers emits singleclick after its double-click delay.
  await page.screenshot({ path: join(shots, 'mobile-after-touch.png') });
  const overlap = page.locator('#map-overlap');
  if (await overlap.isVisible()) {
    assert.ok(await overlap.locator('button').count() > 1, 'overlapping routes offer a choice');
    await overlap.locator('button').first().click();
  }
  assert.equal(await page.locator('.map-selection').isVisible(), true, 'touch selects a stored route');
  await page.locator('#clear-selection').click();
  const dragBox = await page.locator('.map-panel').boundingBox();
  await page.mouse.move(dragBox.x + dragBox.width * 0.5, dragBox.y + dragBox.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(dragBox.x + dragBox.width * 0.6, dragBox.y + dragBox.height * 0.68, { steps: 5 });
  await page.mouse.up();
  await page.locator('#fit-map-mobile').click();
  assert.equal(await page.locator('#map canvas').count() > 0, true);
  await page.setViewportSize({ width: 320, height: 700 });
  for (const key of ['dashboard','map','matrix','explorer','centres','statistics','compare','methodology']) {
    await nav(key);
    await assertNoOverflow(`320px ${key} page`);
  }

  assert.ok(cartoTiles.some(([status]) => status === 200));
  assert.deepEqual(cartoTiles.filter(([status]) => status !== 200), []);
  assert.deepEqual(errors, []);
  assert.deepEqual(brokenAssets, []);
  assert.deepEqual(backendRequests, []);
  console.log(JSON.stringify({ widths: [320,375,390,430,768,1280,1440], screenshots: shots, cartoTileResponses: cartoTiles.length, errors, brokenAssets, backendRequests }));
} finally {
  await browser.close();
}

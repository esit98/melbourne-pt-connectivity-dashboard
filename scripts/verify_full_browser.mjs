// Local browser acceptance checks and requested screenshot evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output=process.env.QA_OUTPUT_DIR||path.join(os.tmpdir(),'melbourne-public-full-qa');
const playwright=process.env.PLAYWRIGHT_PACKAGE
  ? await import(pathToFileURL(process.env.PLAYWRIGHT_PACKAGE).href)
  : await import('playwright');
const browser=await playwright.chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const snapshot=JSON.parse(await fs.readFile(path.join(root,'public/data/study.json'),'utf8'));
const rows=snapshot.routes.features.map(f=>f.properties);
const nav=async key=>{await page.locator(`#navigation [data-page="${key}"]`).click();assert.equal(await page.locator('#content').getAttribute('data-page'),key);assert.equal(await page.locator(`#navigation [data-page="${key}"]`).getAttribute('aria-current'),'page');};
const shot=async name=>{await page.waitForTimeout(1300);await page.screenshot({path:path.join(output,`${name}.jpg`),type:'jpeg',quality:88,fullPage:true});};
try{
 await fs.mkdir(output,{recursive:true});
 await page.goto(process.env.WEB_MAP_URL||'http://127.0.0.1:5176/melbourne-pt-connectivity-dashboard/',{waitUntil:'domcontentloaded'});
 await page.locator('.kpi-grid').waitFor({timeout:25000});
 assert.equal(await page.title(),'Melbourne PT Connectivity Analysis');
 if(process.env.EXPECT_WFS==='1')assert.match(await page.locator('html').getAttribute('data-study-source'),/GeoServer WFS/);
 assert.equal(await page.locator('.kpi-grid .metric-card').count(),5);
 assert.equal(await page.locator('.dashboard-charts .card').count(),3);
 assert.equal(await page.locator('.route-bars button').count(),5);
 assert.equal(await page.locator('.centre-strip button').count(),10);
 assert.equal(await page.locator('#notice').isVisible(),false);
 assert.equal(await page.locator('.centre-strip small').count(),10);
 assert.match(await page.locator('.centre-strip [data-centre="AC02"]').getAttribute('aria-label'),/155\.4 min/);
 assert.doesNotMatch(await page.locator('body').innerText(),/GeoServer WFS|saved final leg records|Better connections/);
 await shot('desktop_dashboard');
 await page.locator('.route-bars button').first().click();assert.match(await page.locator('#page-title').textContent(),/Melton → Cranbourne/);
 await page.locator('#global-search').fill('Melton Ringwood');
 await page.locator('#search-results [data-route="OD_AC02_AC06"]').click();assert.equal(await page.locator('#page-title').innerText(),'Melton → Ringwood');
 assert.equal(await page.locator('.timeline .journey-leg').count(),7);
 assert.match(await page.locator('.route-metrics').innerText(),/58\.8 km/);
 assert.match(await page.locator('.directional').innerText(),/\+32\.2 min/);
 assert.equal(await page.locator('.journey-arrival').count(),1);
 await shot('desktop_explorer');
 await page.locator('#explorer-origin').selectOption('AC01');assert.match(await page.locator('#page-title').innerText(),/^Werribee →/);await page.locator('#explorer-origin').selectOption('AC02');await page.locator('#explorer-destination').selectOption('OD_AC02_AC06');
 await page.locator('#reverse-route').click();assert.equal(await page.locator('#page-title').innerText(),'Ringwood → Melton');
 await page.locator('#reverse-route').click();
 const original=await page.locator('#explorer-destination').inputValue();
 await page.locator('#next-route').click();await page.locator('#previous-route').click();assert.equal(await page.locator('#explorer-destination').inputValue(),original);
 await page.getByRole('tab',{name:'Map comparison',exact:true}).click();await page.locator('#direct-route').check();await page.locator('#actual-route').uncheck();await page.locator('#actual-route').check();await shot('desktop_route_comparison');
 await page.getByRole('tab',{name:'Mode summary',exact:true}).click();assert.match(await page.locator('.mode-summary').innerText(),/Boardings\s+3/);
 await page.locator('#explorer-destination').selectOption(rows.find(r=>r.origin_id==='AC02'&&r.analysis_type==='outer_to_cbd_benchmark').route_id);assert.equal(await page.locator('#reverse-route').isDisabled(),true);assert.match(await page.locator('.directional').innerText(),/unavailable/);
 await nav('matrix');assert.equal(await page.locator('.matrix-cell').count(),90);assert.equal(await page.locator('.diagonal').count(),10);assert.equal(await page.locator('#content #map').count(),0);
 await shot('desktop_matrix');await page.locator('.matrix-cell').first().hover();assert.match(await page.locator('.matrix-cell').first().getAttribute('title'),/Werribee/);
 for(const key of ['transfers','detour_ratio','walking_distance_m','minutes_per_direct_km','travel_time_min']){await page.locator('#metric-select').selectOption(key);assert.ok((await page.locator('.matrix-cell').first().getAttribute('title')).length>20);}
 await page.locator('#show-values').uncheck();assert.equal((await page.locator('.matrix-cell').first().innerText()).trim(),'');await page.locator('#show-values').check();
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-matrix').click();const download=await downloadPromise;const stream=await download.createReadStream();let csv='';for await(const chunk of stream)csv+=chunk;assert.equal(csv.trim().split('\r\n').length,11);assert.match(csv,/Werribee/);
 await page.locator('.matrix-cell[data-route="OD_AC02_AC06"]').click();assert.equal(await page.locator('#page-title').innerText(),'Melton → Ringwood');await nav('matrix');assert.equal(await page.locator('.matrix-cell.selected').getAttribute('data-route'),'OD_AC02_AC06');assert.equal(await page.locator('.matrix-cell.selected').getAttribute('aria-pressed'),'true');
 await nav('map');await page.locator('#clear-selection').click();assert.equal(await page.locator('#map canvas').count()>0,true);
 await shot('desktop_map');
 // Screen-grounded point on the western corridor in the 1440 x 900 overview.
 await page.mouse.move(780,267);await page.waitForTimeout(250);
 const hoverText=await page.locator('#map-status').innerText();assert.match(hoverText,/→[\s\S]*Travel time: [\d.]+ min/);
 await shot('desktop_map_hover');
 await page.mouse.click(780,267);await page.locator('#map-overlap button').first().waitFor();
 // Hover emphasis must not remove that journey from the overlap chooser.
 assert.ok((await page.locator('#map-overlap button').allTextContents()).includes(hoverText.split('\n')[0]));
 await page.locator('#map-overlap button').first().click();assert.equal(await page.locator('.map-selection').isVisible(),true);await shot('desktop_map_selected');
 await page.locator('.map-selection [data-page="explorer"]').click();assert.equal(await page.locator('#content').getAttribute('data-page'),'explorer');
 await nav('map');await page.locator('#clear-selection').click();

 await page.locator('#metric-select').selectOption('transfers');assert.match(await page.locator('.map-legend').innerText(),/Exact transfer counts/);await page.locator('#metric-select').selectOption('travel_time_min');
 await page.locator('[data-threshold="travel_time_min"]').fill('150');await page.locator('#apply-filters').click();const filtered=rows.filter(r=>r.analysis_type==='outer_to_outer'&&r.travel_time_min>=150);assert.match(await page.locator('.map-summary').innerText(),new RegExp(`Showing ${filtered.length} of 90 routes`));
 await page.locator('#open-route-list').click();assert.equal(await page.locator('.route-list button').count(),filtered.length);await page.locator('#close-route-list').click();
 await page.locator('#reset-filters').click();await page.getByText('Advanced filters',{exact:true}).click();await page.locator('#filter-origin').selectOption('AC02');await page.locator('#apply-filters').click();assert.match(await page.locator('.map-summary').innerText(),/Showing 9 of 90 routes/);await page.locator('#reset-filters').click();await page.locator('#scope-select').selectOption('outer_to_cbd_benchmark');assert.match(await page.locator('.map-summary').innerText(),/Showing 10 of 10 routes/);await page.locator('#scope-select').selectOption('compare');assert.match(await page.locator('.map-summary').innerText(),/Showing 100 of 100 routes/);await page.locator('#scope-select').selectOption('outer_to_outer');
 await page.locator('[data-threshold="travel_time_min"]').fill('999');await page.locator('#apply-filters').click();assert.match(await page.locator('.map-summary').innerText(),/Showing 0 of 90 routes/);await page.locator('#reset-filters').click();
 await nav('dashboard');await page.locator('.centre-strip [data-centre="AC02"]').click();assert.equal(await page.locator('#centre-select').inputValue(),'AC02');assert.equal(await page.locator('.profile-metrics .metric-card').count(),6);assert.equal(await page.locator('.connection-list button').count(),10);await shot('desktop_centres');
 for(const id of ['AC01','AC06','AC10']){await page.locator('#centre-select').selectOption(id);assert.match(await page.locator('.profile-metrics').innerText(),/9\s+Destinations/);const source=rows.filter(r=>r.origin_id===id&&r.analysis_type==='outer_to_outer');const mean=source.reduce((s,r)=>s+r.travel_time_min,0)/9;assert.match(await page.locator('.profile-metrics').innerText(),new RegExp(mean.toFixed(1).replace('.','\\.')+' min'));}
 await page.locator('.connection-list button').first().click();assert.equal(await page.locator('#content').getAttribute('data-page'),'explorer');await nav('centres');await page.locator('.connection-list button').last().click();assert.equal(await page.locator('#content').getAttribute('data-page'),'explorer');
 await nav('statistics');assert.equal(await page.locator('.statistics-charts>.card').count(),3);assert.equal(await page.locator('.scatter circle').count(),180);await shot('desktop_statistics');
 const point=page.locator('.scatter circle').first();assert.match(await point.getAttribute('aria-label'),/Direct distance/);await point.hover();assert.ok((await point.locator('title').textContent()).includes('Travel time'));await point.click();assert.equal(await page.locator('#content').getAttribute('data-page'),'explorer');
 await nav('statistics');
 await page.locator('[data-stats-tab="travel"]').click();assert.equal(await page.locator('.centre-ranking .ranking-track').count(),10);await shot('desktop_statistics_travel');
 await page.locator('.centre-ranking [data-centre="AC02"]').click();assert.equal(await page.locator('#centre-select').inputValue(),'AC02');
 await nav('statistics');await page.locator('.route-bars button').first().click();assert.equal(await page.locator('#content').getAttribute('data-page'),'explorer');
 await nav('statistics');for(const tab of ['travel','transfers','detour','walking','distance']){await page.locator(`[data-stats-tab="${tab}"]`).click();assert.equal(await page.locator('.statistics-charts>.card').count(),3);}
 await page.locator('#scope-select').selectOption('outer_to_cbd_benchmark');assert.match(await page.locator('#content').innerText(),/10 saved journeys/);
 await nav('compare');assert.equal(await page.locator('.comparison-row').count(),5);
 assert.match(await page.locator('[data-comparison="travel_time_min"] .comparison-difference').innerText(),/\+37\.8 min[\s\S]*\+55\.0%/);
 assert.equal(await page.locator('.data-table').isVisible(),false);
 assert.equal(await page.locator('.data-table tbody tr').count(),5);await shot('desktop_compare');await page.locator('#compare-origin').selectOption('AC02');assert.match(await page.locator('.card-subtitle').innerText(),/9 Outer → Outer journeys · 1 Outer → CBD/);
 const zeroOrigin=rows.find(r=>r.analysis_type==='outer_to_cbd_benchmark'&&r.transfers===0).origin_id;
 await page.locator('#compare-origin').selectOption(zeroOrigin);assert.match(await page.locator('[data-comparison="transfers"] .comparison-difference').innerText(),/N\/A/);
 assert.doesNotMatch(await page.locator('.comparison-rows').innerText(),/NaN|Infinity/);
 await page.getByText('View detailed table',{exact:true}).click();assert.equal(await page.locator('.data-table').isVisible(),true);
 await page.locator('#compare-origin').selectOption('');
 await nav('methodology');assert.equal(await page.locator('.methodology section').count(),10);assert.match(await page.locator('.methodology').innerText(),/fare analysis/);await shot('desktop_methodology');
 await page.locator('#global-search').fill('Melton');assert.equal(await page.locator('.search-group h3').count(),2);await shot('desktop_search');
 await page.locator('#global-search').press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.dataset.centre),'AC02');await page.locator('#search-results [data-centre="AC02"]').press('Enter');assert.equal(await page.locator('#centre-select').inputValue(),'AC02');
 await page.setViewportSize({width:390,height:844});
 const mobileNav=async key=>{await page.locator('#menu-toggle').click();await nav(key);assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`No whole-page horizontal overflow: ${key}`);};
 await mobileNav('dashboard');await shot('mobile_dashboard');await mobileNav('matrix');assert.equal(await page.locator('.matrix-scroll').evaluate(e=>e.scrollWidth>e.clientWidth),true);await shot('mobile_matrix');await mobileNav('map');await shot('mobile_map');await mobileNav('explorer');await page.getByRole('tab',{name:'Journey',exact:true}).click();await shot('mobile_explorer');await mobileNav('centres');await mobileNav('statistics');await shot('mobile_statistics');await mobileNav('compare');await shot('mobile_compare');await mobileNav('methodology');
 assert.deepEqual(errors,[]);
 assert.doesNotMatch(await page.locator('body').innerText(),/â†|â€|Â·/);
 console.log('Refinement PASS: grouped keyboard search, centre averages, arrival timeline, signed directional difference, matrix pressed state, ten centre route links, ranking bars, paired comparison rows, detailed table, zero-denominator N/A, hidden technical footer.');
 console.log('PASS: 8 pages; navigation/active state; token search; maps; five metrics; filters/reset/empty scope; 90-cell matrix/toggle/CSV/selection; 7-leg itinerary; next/previous/reverse/missing reverse; route tabs; centre means; statistics tabs/point hover/click; comparison; responsive layouts; no page errors.');
 console.log(output);
}finally{await browser.close();}

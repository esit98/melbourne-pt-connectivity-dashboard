# UI functionality test report

**14 October 2026.** Target: the isolated public production build served from `/melbourne-pt-connectivity-dashboard/`, using the static saved snapshot. The standalone Browser plugin was unavailable; the two Playwright scripts ran in local Microsoft Edge after a fresh `npm ci`. Chrome browser interaction through Codex also confirmed visible map tiles, route geometry, data attribution and the academic disclaimer.

| Check | Result | Evidence |
|---|---|---|
| Baseline research frontend | Pass | 15/15 Node tests; Vite build. |
| Public candidate unit tests | Pass | 15/15, including 100-route/533-leg/manifest and saved mean checks. |
| Public Vite build and artifact audit | Pass | 210 modules; hashed CSS/JS and static data under the correct base path; no backend URL, secret pattern or prohibited file in `dist/`. |
| Export reproducibility | Pass | `export_public_data.py --check` matched both public files byte-for-byte. |
| Full browser control pass | Pass | `verify_full_browser.mjs`: eight sections; search/keyboard; route choice and reversal; 90-cell matrix, metric, toggle and CSV; map hover/click, layers, filters, empty state; centre selection; chart tabs/point clicks; compare table; licensing and disclaimer content; mobile layouts; no page errors. |
| Public browser pass | Pass | `verify_public_browser.mjs`: 1440×900 and 390×844; direct `#compare` load and refresh; static source; no console errors, broken same-origin assets, page errors or GeoServer/backend requests. |
| Live GitHub Pages | Passed for CARTO Light release | Actions run 38551322211 and the two live browser suites verified the preceding CARTO Light deployment. The mobile UI revision is reported separately below. |

Selected saved-value checks: 90 Outer-to-Outer and ten Outer-to-CBD routes, ten outer centres plus one CBD benchmark, 533 legs, 100 non-empty route geometries, mean Outer-to-Outer travel time 106.700011 minutes and mean benchmark travel time 68.855 minutes. The browser renders rounded values (106.7 and 68.9). Melton → Ringwood has seven saved legs; reverse Ringwood → Melton is a separate itinerary. A benchmark route has no reverse control.

The same two browser scripts also passed against the [deployed Pages URL](https://esit98.github.io/melbourne-pt-connectivity-dashboard/) on 14 October 2026. Playwright screenshots from the production passes are in the local temporary folder `melbourne-public-full-qa`; they are deliberately excluded from the publication repository. These checks establish the fixed saved scenario and deployed interaction, not the accuracy of later live service schedules.

Run after `npm run build:public` and a static-mode `npm run preview`:

```sh
node scripts/verify_public_browser.mjs
node scripts/verify_full_browser.mjs
node scripts/verify_mobile_map.mjs
```

These browser scripts need Playwright and a Chromium browser installed locally. Set `PLAYWRIGHT_PACKAGE` and `CHROME_PATH` if they are outside normal module/browser discovery. Set `PUBLIC_BASE_URL` or `WEB_MAP_URL` to test the deployed URL. Screenshots default to a temporary directory.

## CARTO Light local production check, 14 October 2026

A fresh `npm ci` reported zero vulnerabilities. All 15 frontend tests, the 100-geometry check and notices for 23 production packages passed. `npm run build:public` and `node scripts/check_publication.mjs` passed with the key from ignored local configuration. The public browser script passed all eight sections at 1440×900 and 390×844: 41 successful CARTO Light tile responses, zero failed CARTO tiles, zero OSM Standard tile requests, visible © OpenStreetMap contributors and © CARTO map credit, and no console/page errors, broken assets or backend calls. The full browser interaction suite also passed. The desktop and mobile map screenshots are retained in the local `Publication/carto-qa-screenshots/public/` directory outside this repository. The subsequent live result is recorded below.

## CARTO Light live check, 14 October 2026

After Actions run 38551322211 deployed the update, both browser suites passed against the public Pages URL. The public pass received 47 successful CARTO tiles with no failed CARTO or OSM Standard requests, no console/page errors, broken assets or backend requests. Desktop and mobile route/map interactions and direct links passed. Live desktop/mobile map screenshots are retained outside this repository in `Publication/carto-qa-screenshots/live-public/`. See [public website verification](PUBLIC_WEBSITE_VERIFICATION.md) for the release commit, run and hash results.

## Mobile Map revision: local production check, 14 October 2026

The map moved above optional filters at phone widths; the filter and legend panels start collapsed, the selected route uses a compact panel below the map, and full-screen mode reuses the OpenLayers map target. The dedicated `verify_mobile_map.mjs` passed at 320, 375, 390, 430, 768, 1280 and 1440px. It exercised all five metrics, three analysis scopes, filter counts and persistence, advanced origin/match controls, centre visibility, route details, overlapping touch selection (34 choices), Route Explorer persistence, legend expansion, full-screen zoom/fit/close/Escape, pan and all eight pages at 320px without whole-page horizontal overflow. It recorded 14 successful CARTO tile responses and no page/console errors, broken assets or local backend requests.

The revised `verify_public_browser.mjs` also passed all eight sections at 1440×900 and 390×844, including map/filter/legend ordering, with 41 successful CARTO tiles and no failed tiles, OSM Standard tiles, console/page errors or backend requests. The unchanged `verify_full_browser.mjs` passed its detailed eight-section interaction suite. `npm test` passed 15/15, `npm run verify:geometry` confirmed all 100 stored geometries and the unchanged geometry SHA-256, notices for 23 packages passed, and the public Vite build and artifact check passed. Before/after, selected, expanded-filter, full-screen and desktop screenshots were visually reviewed in `Publication/carto-qa-screenshots/mobile-ui-before/` and `Publication/carto-qa-screenshots/mobile-ui-after/`, outside this repository.

## Mobile Map revision: live check, 14 October 2026

[GitHub Actions run 38556746628](https://github.com/esit98/melbourne-pt-connectivity-dashboard/actions/runs/38556746628) passed build and deploy from source commit `26cf5024e33bad6e8af34c4e8721b22bffdd2f3f`. All three browser scripts passed against the live Pages URL. The mobile script covered all seven widths and eight sections at 320px, with 14 successful CARTO tiles, no console/page errors, broken assets or backend requests. The public script received 41 successful CARTO tiles and no failed CARTO or OSM Standard tile requests; the detailed eight-section suite passed. Live screenshots in `Publication/carto-qa-screenshots/mobile-ui-live/` and `Publication/carto-qa-screenshots/mobile-ui-live-public/` were visually compared with the local production build and the preceding desktop release. The deployed `study.json`, `manifest.json` and `route_geometries.geojson` SHA-256 hashes exactly matched the unchanged local files. These checks used automated Microsoft Edge/Playwright; a physical iOS or Android device was not tested.

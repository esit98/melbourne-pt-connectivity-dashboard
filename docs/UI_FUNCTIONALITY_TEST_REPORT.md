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
| Live GitHub Pages | Not run | Release is held for the Plan Melbourne data-rights gate. |

Selected saved-value checks: 90 Outer-to-Outer and ten Outer-to-CBD routes, ten outer centres plus one CBD benchmark, 533 legs, 100 non-empty route geometries, mean Outer-to-Outer travel time 106.700011 minutes and mean benchmark travel time 68.855 minutes. The browser renders rounded values (106.7 and 68.9). Melton → Ringwood has seven saved legs; reverse Ringwood → Melton is a separate itinerary. A benchmark route has no reverse control.

Playwright screenshots from the current production pass are in the local temporary folder `melbourne-public-full-qa`; they are deliberately excluded from the publication repository. The automated checks do not establish correctness of live service schedules beyond the frozen source files, or successful Pages hosting.

Run after `npm run build:public` and a static-mode `npm run preview`:

```sh
node scripts/verify_public_browser.mjs
node scripts/verify_full_browser.mjs
```

These browser scripts need Playwright and a Chromium browser installed locally. Set `PLAYWRIGHT_PACKAGE` and `CHROME_PATH` if they are outside normal module/browser discovery. Set `PUBLIC_BASE_URL` or `WEB_MAP_URL` to test the deployed URL. Screenshots default to a temporary directory.

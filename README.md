# Melbourne public transport connectivity dashboard

Eight-section research and planning dashboard for ten selected outer Melbourne activity centres and one separate CBD benchmark. This is a saved scheduled scenario for **13 October 2026, 08:00 Australia/Melbourne**, not a live journey planner.

**Live dashboard:** [esit98.github.io/melbourne-pt-connectivity-dashboard](https://esit98.github.io/melbourne-pt-connectivity-dashboard/). The [public verification record](docs/PUBLIC_WEBSITE_VERIFICATION.md) documents the deployed browser checks. The [publication readiness record](docs/PUBLICATION_READINESS.md), [licensing review](docs/LICENSING_REVIEW.md), [data licence register](docs/DATA_LICENCES.md) and [public attribution plan](docs/PUBLIC_ATTRIBUTION.md) describe the release basis and obligations.

The CARTO Light update is verified locally and on the live Pages site. A separate browser key is restricted to `esit98.github.io` and stored as the repository Actions secret; the older local key remains in ignored local configuration.

The mobile Network Explorer update is also deployed and verified. See the [mobile UI test report](docs/UI_FUNCTIONALITY_TEST_REPORT.md) and [live verification record](docs/PUBLIC_WEBSITE_VERIFICATION.md).

## Run and verify

Requires Node.js 24 and npm. From this directory:

Set `VITE_CARTO_BASEMAP_KEY` in an ignored `.env.local` for local development and public-build checks. GitHub Actions reads the browser key from its `CARTO_BASEMAP_KEY` repository secret. The key is deliberately present in browser tile requests, so use a CARTO Basemaps key intended for this site and restrict its website/referrer use to `esit98.github.io`; use a separate localhost-capable key if that restriction prevents local previews. The public build fails without a valid key.

```sh
npm ci
npm test
npm run verify:geometry
npm run verify:notices
npm run build:public
node scripts/check_publication.mjs
```

Preview the public build with `VITE_PUBLICATION_MODE=static npm run preview` on Unix, or set that environment variable before `npm run preview` in PowerShell. The production URL path is `/melbourne-pt-connectivity-dashboard/`. A local research build uses `npm run build` and can compare the saved snapshot with GeoServer WFS.

With the preview running, run `node scripts/verify_mobile_map.mjs` for the responsive interaction check.

The public artifact contains `public/data/study.json`, `public/data/manifest.json`, a separately ODbL-labelled copy of the [100 route geometries](public/data/route_geometries.geojson) and [component notices](public/data/README.md). The site never requires the local database, GeoServer, Python or OTP at runtime. Its default basemap is CARTO Positron (Light), with visible © OpenStreetMap contributors and © CARTO attribution. An internet connection is needed for tiles. Local development retains an OpenStreetMap Standard fallback when no CARTO key is configured. Saved route lines and centres remain in the unchanged static snapshot.

## Mobile Network Explorer

At widths up to 640px, Map places the Metric and Analysis type selectors immediately above a map sized to about 60% of the dynamic viewport height (limited to 340–720px). The selected journey appears in a compact panel below the map. Filters and the metric legend are collapsed initially and keep their state when opened or closed; the Filters header shows the applied-filter count. Expand map opens a viewport overlay around the same OpenLayers instance, with Fit network, route actions, map attribution, an obvious close button and Escape support. Route and metric selection persist across compatible pages. At wider widths the approved side-by-side desktop layout remains in use.

The production browser scripts are `scripts/verify_public_browser.mjs`, `scripts/verify_full_browser.mjs` and `scripts/verify_mobile_map.mjs`. The mobile script checks 320, 375, 390, 430, 768, 1280 and 1440px widths, touch route/overlap selection, keyboard exit, filters, legend, full-screen resizing and all eight pages. It writes screenshots outside the repository via `QA_OUTPUT_DIR` (or the system temporary directory by default). Set `PUBLIC_BASE_URL` and, if needed, `CHROME_PATH` for local preview or the deployed site.

## Update the frozen study snapshot

Only after a new research analysis has been independently validated and its data rights reviewed:

```sh
python scripts/export_public_data.py --research-root <private-research-root>
python scripts/export_public_data.py --research-root <private-research-root> --check
npm test
npm run verify:geometry
npm run verify:notices
npm run build:public
node scripts/check_publication.mjs
```

The exporter reads saved files from the private research project. It does not run routing, write a database or change the research results. Review the generated manifest and public data before publication. The functionality, data, deployment and licensing records are in [docs](docs/).

Source identification: [Plan Melbourne All_Activity_Centres](https://spatial.planning.vic.gov.au/gis/rest/services/planmelb_activity_centres/MapServer/0) (DTP-linked CC BY 4.0 assessment); [Transport Victoria GTFS Schedule](https://opendata.transport.vic.gov.au/dataset/gtfs-schedule) (CC BY 4.0); [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL). See [licensing review](docs/LICENSING_REVIEW.md) for the reasoning and scope. No raw GTFS, OSM extract, OTP graph, credentials, or GeoServer configuration is in this project.

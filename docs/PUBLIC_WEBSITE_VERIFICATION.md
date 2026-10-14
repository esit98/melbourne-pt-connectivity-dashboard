# Public website verification

**Status on 14 October 2026: deployed and verified live.** Public repository: [esit98/melbourne-pt-connectivity-dashboard](https://github.com/esit98/melbourne-pt-connectivity-dashboard). Website: [esit98.github.io/melbourne-pt-connectivity-dashboard](https://esit98.github.io/melbourne-pt-connectivity-dashboard/). Release source commit: `aa6a181aa3857b5cded093940de4f910dc0268b1`. [GitHub Actions run 38545950279, attempt 2](https://github.com/esit98/melbourne-pt-connectivity-dashboard/actions/runs/38545950279) completed successfully at 09:57:29 UTC, with passing build and deploy jobs. The original research repository was rechecked as private.

Local production and live website evidence:

| Item | Result |
|---|---|
| Eight section navigation and major controls | Both production browser scripts passed locally and again against the live URL after the licensing UI update. |
| Saved data | 100 routes, 533 legs, 11 centres, 100 non-empty MultiLineStrings; manifest/source check passed. |
| Repository subdirectory | Built and deployed under `/melbourne-pt-connectivity-dashboard/`; direct hash page and refresh passed locally and live. |
| Desktop/mobile | 1440×900 and 390×844 passed, with no whole-page horizontal overflow in the eight mobile sections. |
| Console and assets | No page or console errors and no broken same-origin assets in the live public browser pass. |
| Backend isolation | No GeoServer or local backend requests in the live browser pass; static artifact scan passed. |
| Licence display and map | Live Chrome showed real stored route geometry over loaded OSM tiles, visible OSM attribution, linked government/GTFS/ODbL notices and the academic disclaimer. The full browser script checked Methods & Data text. |
| Published data integrity | Live `study.json`, `manifest.json` and `route_geometries.geojson` have the same SHA-256 hashes as their validated local counterparts: `47affdf68624f267babadbf8b0519bacfe810d86b0929bdb899f4402371ec8bf`, `58dbba1c53d7d6ef0a3b0bdba4249cac1c1fea828a7f20c6245fe7d5b332d30e` and `66e026e9eebda3cb969138dcc975efc5538beb88d2f2773de2af31428b857da0`. |
| Public URL | HTTPS GET returned 200; all eight sections loaded and the 100-route overview appeared in a fresh Chrome tab. |

The first workflow attempt failed at `configure-pages` because the new repository's Pages setting had not yet been enabled. Pages was configured for GitHub Actions, then the same workflow reran successfully. The live scripts covered matrix-to-route selection, reverse direction, map filters and geometry, CBD comparison, desktop/mobile navigation and direct links. The public browser pass recorded no backend requests or browser errors. The site remains a fixed, modelled research scenario and requires internet only for its basemap tiles.

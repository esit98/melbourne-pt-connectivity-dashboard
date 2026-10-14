# Public website verification

**Status on 14 October 2026: not deployed and not verified live.** No public repository commit, GitHub Pages workflow run or public URL response exists for this candidate. The proposed URL is `https://esit98.github.io/melbourne-pt-connectivity-dashboard/`.

Local production evidence:

| Item | Result |
|---|---|
| Eight section navigation and major controls | Passed both production browser scripts after the licensing UI update. |
| Saved data | 100 routes, 533 legs, 11 centres, 100 non-empty MultiLineStrings; manifest/source check passed. |
| Repository subdirectory | Built and previewed under `/melbourne-pt-connectivity-dashboard/`; direct hash page and refresh passed. |
| Desktop/mobile | 1440×900 and 390×844 passed, with no whole-page horizontal overflow in the eight mobile sections. |
| Console and assets | No page or console errors and no broken same-origin assets in the public browser pass. |
| Backend isolation | No GeoServer or local backend requests; static artifact scan passed. |
| Licence display and map | Chrome showed real stored route geometry over loaded OSM tiles, visible OSM attribution, linked government/GTFS/ODbL notices and the academic disclaimer. The full browser script checked the Methods & Data section count and text. |
| Public URL | Pending release gate and actual deployment. |

After publication, record the public repository URL, commit SHA, Pages workflow run URL and timestamp here. Test the live URL in a fresh browser session, including the matrix-to-route path, reverse direction, Map filters and geometry, compare origin selector, desktop/mobile navigation, direct `#matrix` load and refresh. Confirm network requests include the site assets and map tiles only. A local preview pass does not substitute for that check.

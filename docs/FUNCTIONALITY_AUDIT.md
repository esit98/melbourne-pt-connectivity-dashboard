# Functionality audit

**14 October 2026.** Source: the newer eight-section local OpenLayers/Vite dashboard, copied into this isolated public candidate. The original research project and its dirty worktree were left intact. The original private repository's separate checkout at `2a0e585` contains an older single-page `web/src/main.js`; the current eight-section source is untracked in the local research checkout at tracked HEAD `60c96bb`.

Baseline on the research checkout: 15/15 Node tests passed and the Vite build passed. This audit uses the public production build at the repository subdirectory path; `scripts/verify_full_browser.mjs` exercised the detailed controls, and `scripts/verify_public_browser.mjs` checked direct links, refresh, console and backend independence.

| Section | Status | Verified behaviour |
|---|---|---|
| Overview | Working | Five saved-result cards; histogram, longest-route ranking and Outer/CBD comparison; ten centre links and search navigation update the selected view. |
| Map | Working | Real saved MultiLineStrings and centre points render; metric and analysis type selectors, threshold/origin filters, reset, route list, fit and clear work. Hover and click select overlapping route lines; selected route details stay linked to Route Explorer. |
| OD Matrix | Working | 90 directional cells and ten self-route blanks; all five metrics, value toggle, CSV export and cell selection work. Selected cell opens the corresponding journey and stays highlighted on return. |
| Route Explorer | Working | Origin/destination, next/previous, reverse route, journey timeline, map comparison, mode summary and fit route work. Reverse is disabled for CBD benchmarks because no CBD-to-outer result exists. |
| Centres | Working | Centre selector changes nine outbound routes, six profile metrics, centre-focused map and fastest/slowest route links. |
| Statistics | Working | Six chart tabs, analysis type selector, route-point/ranking hover and click, and scope-dependent chart counts work. |
| Compare | Working | Overall and per-origin Outer/CBD comparisons, detailed table and undefined percentage for a zero CBD mean display correctly. |
| Methods & Data | Working | Research question, scenario, metrics, limitations, public/local data flow and source attribution display. External source links are present. |

Shared state: route selection survives compatible navigation; metric selection persists between Matrix and Map. Search, keyboard result navigation, active nav state, menu close and eight mobile sections were exercised. No missing control or data-blocked section was found in the saved-data mode. External map tiles still require internet; tile availability is independent of saved route geometries.

## Mobile Map reassessment, 14 October 2026

The previous 390px layout put the full filter card before a fixed 430px map, placed the selected-route card over the map using a fixed top offset and displayed the complete legend below it. The revised mobile structure is compact header and search → essential selectors → 60dvh map → selected-route panel when applicable → collapsible filters → compact legend → summary and route-list action. DOM grid ordering places the map before optional filters without duplicating the OpenLayers map. The existing legend moves between its desktop/full-screen map stage and a mobile slot after the filters. The desktop sidebar, map/filters columns, legend, cards and other pages retain their approved arrangement.

| Mobile Map control | Status | Verified behaviour |
|---|---|---|
| Metric and analysis type | Working | Five metrics and three analysis scopes retain their original meaning and counts. |
| Filters | Working | Collapsed initially; active threshold/origin/match count shown; values survive collapse; apply, reset, advanced filters and centre visibility work. |
| Map and route selection | Working | CARTO tiles, saved lines, markers, zoom, fit, pan, touch selection and a scrollable 34-journey overlap chooser were exercised. |
| Selected route | Working | Compact panel shows journey, travel time and transfer count; Details, Open route and Clear work; selection persists through Route Explorer navigation. |
| Legend and full-screen map | Working | Compact metric swatches expand to the unchanged classification; full-screen overlay keeps the same map target and state, resizes OpenLayers, offers Fit and close, and supports Escape. |
| Accessibility and responsive layout | Working | Open/closed states use `aria-expanded`; expanded map uses dialog semantics and focus trapping; mobile map controls target 44px where practical. No whole-page horizontal overflow was found across all eight sections at 320px. |

The dedicated `scripts/verify_mobile_map.mjs` checks 320, 375, 390, 430, 768, 1280 and 1440px. The existing full and public browser suites also pass. This reassessment concerns layout and interaction only; the frozen study values, route geometries and classification methods are unchanged.

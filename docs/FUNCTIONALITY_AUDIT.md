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

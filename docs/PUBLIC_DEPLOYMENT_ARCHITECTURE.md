# Public deployment architecture

## Research and publication paths

```text
Private research: GTFS + OSM + centres → OTP → Python validation → PostGIS
                                                        ↓
                                          saved CSV/JSON/GeoJSON
                                             ↙             ↘
Local dashboard: snapshot + checked GeoServer WFS     Public snapshot export
                                                        ↓
                                             GitHub Pages static files
                                                        ↓
                                             OpenLayers in the browser
```

The local mode loads the snapshot, tries three WFS layers and compares key route metrics to the saved results; it uses the snapshot if WFS is unavailable. The public mode is selected at build time with `VITE_PUBLICATION_MODE=static`. It fetches `data/study.json` using Vite's `BASE_URL`, validates collection counts/types and does not call GeoServer. The static bundle uses the GitHub Pages base path `/melbourne-pt-connectivity-dashboard/`. Hash routes such as `#matrix` allow direct links and refreshes beneath that path.

Both modes use the same saved route properties, 533 itinerary legs and 100 route geometries. Browser summaries, rankings and colour classes describe those values; travel time, transfers and detour ratio are not recomputed as research indicators. The ten Outer-to-CBD routes remain a separate benchmark.

The publication repository contains only the Vite app, lockfile, public snapshot and manifest, export/verification scripts, workflow and documentation. It excludes private runtime inputs, credentials and internal report files. The GitHub Actions workflow runs tests and the static build, checks the artifact, then uploads only `dist/` for Pages. The public browser needs network access for OpenStreetMap basemap tiles; route lines and centre points are bundled.

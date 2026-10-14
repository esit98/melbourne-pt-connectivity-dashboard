# Melbourne public transport connectivity dashboard

Eight-section research and planning dashboard for ten selected outer Melbourne activity centres and one separate CBD benchmark. This is a saved scheduled scenario for **13 October 2026, 08:00 Australia/Melbourne**, not a live journey planner.

**Release status:** locally prepared and tested. Public deployment is pending documented reuse terms for the Plan Melbourne centre coordinates. The planning guidance and map download pages make the data accessible but do not state the applicable redistribution licence for the exact layer used here. See [static data publication](docs/STATIC_DATA_PUBLICATION.md) and [deployment](docs/GITHUB_PAGES_DEPLOYMENT.md).

## Run and verify

Requires Node.js 24 and npm. From this directory:

```sh
npm ci
npm test
npm run build:public
node scripts/check_publication.mjs
```

Preview the public build with `VITE_PUBLICATION_MODE=static npm run preview` on Unix, or set that environment variable before `npm run preview` in PowerShell. The production URL path is `/melbourne-pt-connectivity-dashboard/`. A local research build uses `npm run build` and can compare the saved snapshot with GeoServer WFS.

The public artifact contains `public/data/study.json` and `public/data/manifest.json`. The site never requires the local database, GeoServer, Python or OTP at runtime. Map tiles use OpenStreetMap with visible attribution; an internet connection is needed for the basemap. Saved route lines and centres remain in the static snapshot.

## Update the frozen study snapshot

Only after a new research analysis has been independently validated and its data rights reviewed:

```sh
python scripts/export_public_data.py --research-root <private-research-root>
python scripts/export_public_data.py --research-root <private-research-root> --check
npm test
npm run build:public
node scripts/check_publication.mjs
```

The exporter reads saved files from the private research project. It does not run routing, write a database or change the research results. Review the generated manifest and public data before publication. The six requested audit and deployment records are in [docs](docs/).

Data attribution: [Plan Melbourne, State of Victoria](https://www.planning.vic.gov.au/guides-and-resources/strategies-and-initiatives/melbournes-strategic-planning-history/plan-melbourne/the-map-room); [Transport Victoria GTFS Schedule](https://opendata.transport.vic.gov.au/dataset/gtfs-schedule) (CC BY 4.0); [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL). No raw GTFS, OSM extract, OTP graph, credentials, or GeoServer configuration is in this project.

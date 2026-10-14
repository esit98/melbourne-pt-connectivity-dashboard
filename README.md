# Melbourne public transport connectivity dashboard

Eight-section research and planning dashboard for ten selected outer Melbourne activity centres and one separate CBD benchmark. This is a saved scheduled scenario for **13 October 2026, 08:00 Australia/Melbourne**, not a live journey planner.

**Release status:** source-linked licence assessment and compliance package prepared; public deployment and live verification are pending. The [publication readiness record](docs/PUBLICATION_READINESS.md) gives the remaining checks and links to the [licensing review](docs/LICENSING_REVIEW.md), [data licence register](docs/DATA_LICENCES.md) and [public attribution plan](docs/PUBLIC_ATTRIBUTION.md).

## Run and verify

Requires Node.js 24 and npm. From this directory:

```sh
npm ci
npm test
npm run verify:geometry
npm run verify:notices
npm run build:public
node scripts/check_publication.mjs
```

Preview the public build with `VITE_PUBLICATION_MODE=static npm run preview` on Unix, or set that environment variable before `npm run preview` in PowerShell. The production URL path is `/melbourne-pt-connectivity-dashboard/`. A local research build uses `npm run build` and can compare the saved snapshot with GeoServer WFS.

The public artifact contains `public/data/study.json`, `public/data/manifest.json`, a separately ODbL-labelled copy of the [100 route geometries](public/data/route_geometries.geojson) and [component notices](public/data/README.md). The site never requires the local database, GeoServer, Python or OTP at runtime. Map tiles use OpenStreetMap with visible attribution; an internet connection is needed for the basemap. Saved route lines and centres remain in the unchanged static snapshot.

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

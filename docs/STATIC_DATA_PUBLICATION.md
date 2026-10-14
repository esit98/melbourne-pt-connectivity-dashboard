# Static data publication

## Source and integrity

The read-only exporter `scripts/export_public_data.py` uses six saved files in the private research project: `connectivity_results_100.csv`, `final_itinerary_geometries.geojson`, two final leg JSON files, the ten selected centre GeoJSON and the CBD CSV. It joins by route ID, checks geometry/metric agreement, enforces 90 outer routes, ten CBD benchmarks, 100 unique route IDs, 533 legs, 11 unique centres and the saved scenario timestamp. It writes only `public/data/study.json` and `public/data/manifest.json` in this publication project.

The [manifest](../public/data/manifest.json) records every source SHA-256, counts, scenario and snapshot SHA-256. Current snapshot: **2,188,351 bytes**, SHA-256 `47affdf68624f267babadbf8b0519bacfe810d86b0929bdb899f4402371ec8bf`. The `--check` mode regenerated the bytes in memory and confirmed both public files match the saved private outputs. No source analysis file was changed. The 100 geometries are non-empty MultiLineStrings and all routes have the scenario departure timestamp.

## Data rights and release gate

The [Transport Victoria GTFS Schedule dataset](https://opendata.transport.vic.gov.au/dataset/gtfs-schedule) lists CC BY 4.0. [OpenStreetMap](https://www.openstreetmap.org/copyright) requires attribution and identifies ODbL. The app shows OSM tile attribution and its Methods & Data section identifies both sources. The public package contains modelled outputs, not the raw GTFS archive or OSM extract. To cover the more demanding ODbL classification, the package also offers all 100 saved geometries as [ODbL-labelled GeoJSON](../public/data/route_geometries.geojson) with [source-specific notices and alteration method](../public/data/README.md). `npm run verify:geometry` checks that this access copy matches the frozen study.

The private 133-feature Plan Melbourne archive is byte-identical to the current official [All_Activity_Centres layer](https://spatial.planning.vic.gov.au/gis/rest/services/planmelb_activity_centres/MapServer/0), SHA-256 `9222c99de18405fb4499398f08cef5c98049be232b4601b9e16aaaa40a343736`. An older research guide cited a different, narrower layer. The [Plan Melbourne spatial-download page](https://www.planning.vic.gov.au/guides-and-resources/strategies-and-initiatives/melbournes-strategic-planning-history/plan-melbourne/the-map-room) links [DTP's CC BY 4.0 copyright terms](https://transport.vic.gov.au/website-terms/copyright), and the source list identifies government Plan Melbourne as the activity-centre origin. See [LICENSING_REVIEW.md](LICENSING_REVIEW.md) for the documented reasoning and limits. This source correction changes no coordinates or research results.

## Later updates

Complete the new research validation in the private project first. Run the exporter with `--research-root`, review the changed SHA-256 values/counts, test the public build and browser flows, repeat the privacy/data-rights audit, then publish only the reviewed public repository changes. Never run OTP or recalculate frozen indicators as part of a site deployment.

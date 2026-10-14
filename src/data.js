import { validateCollection } from './metrics.js';

const request = async (name, expected, idField, geometry, signal) => {
  const params = new URLSearchParams({ service: 'WFS', version: '2.0.0', request: 'GetFeature',
    typeNames: `geom30012:${name}`, outputFormat: 'application/json', srsName: 'EPSG:4326', count: '1000' });
  const response = await fetch(`/geoserver/geom30012/ows?${params}`, { signal });
  if (!response.ok) throw new Error(`GeoServer ${name}: HTTP ${response.status}`);
  return validateCollection(await response.json(), expected, idField, geometry);
};

export async function loadStudy() {
  const snapshotResponse = await fetch(`${import.meta.env.BASE_URL}data/study.json`);
  if (!snapshotResponse.ok) throw new Error('The processed study snapshot is unavailable.');
  const snapshot = await snapshotResponse.json();
  validateCollection(snapshot.routes, 100, 'route_id', 'MultiLineString');
  if (snapshot.centres?.features?.length !== 11 || snapshot.legs?.length !== 533) {
    throw new Error('The processed study snapshot is incomplete.');
  }
  if (import.meta.env.VITE_PUBLICATION_MODE === 'static') {
    return { routes: snapshot.routes, centres: snapshot.centres, legs: snapshot.legs,
      source: 'Validated static publication snapshot', hashes: snapshot.source_sha256 };
  }
  const snapshotRows = new Map(snapshot.routes.features.map(f => [f.properties.route_id, f.properties]));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5500);
  try {
    const [outer, cbd, routes] = await Promise.all([
      request('activity_centres', 10, 'centre_id', 'Point', controller.signal),
      request('cbd_benchmark', 1, 'centre_id', 'Point', controller.signal),
      request('itineraries', 100, 'route_id', 'MultiLineString', controller.signal),
    ]);
    for (const feature of routes.features) {
      const saved = snapshotRows.get(feature.properties.route_id);
      if (!saved || ['travel_time_min', 'transfers', 'detour_ratio'].some(key => Number(feature.properties[key]) !== saved[key])) {
        throw new Error('GeoServer route values differ from the saved final results.');
      }
      feature.properties = { ...saved, ...feature.properties };
    }
    return { routes, centres: { type: 'FeatureCollection', features: [...outer.features, ...cbd.features] },
      legs: snapshot.legs, source: 'GeoServer WFS + saved final leg records', hashes: snapshot.source_sha256 };
  } catch (error) {
    return { routes: snapshot.routes, centres: snapshot.centres, legs: snapshot.legs,
      source: 'Saved final processed outputs (GeoServer unavailable)', hashes: snapshot.source_sha256,
      serviceError: error instanceof Error ? error.message : String(error) };
  } finally { clearTimeout(timer); }
}

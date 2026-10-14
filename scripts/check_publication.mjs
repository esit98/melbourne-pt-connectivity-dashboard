import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const files = [];
function visit(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) visit(path);
    else files.push(path);
  }
}
visit(root);
const names = files.map(path => relative(root, path).split(sep).join('/'));
assert.ok(names.includes('index.html'));
assert.ok(names.includes('data/study.json'));
assert.ok(names.includes('data/manifest.json'));
assert.ok(names.includes('data/route_geometries.geojson'));
assert.ok(names.includes('data/README.md'));
assert.ok(names.includes('licenses/OPENLAYERS-BSD-2-Clause.txt'));
assert.ok(names.includes('licenses/THIRD_PARTY_NOTICES.txt'));
assert.ok(names.every(name => !/(^|\/)(\.env|\.git|node_modules)(\/|$)/.test(name)));
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
assert.match(html, /\/melbourne-pt-connectivity-dashboard\/assets\//);
const scripts = files.filter(path => path.endsWith('.js')).map(path => readFileSync(path, 'utf8')).join('\n');
assert.doesNotMatch(scripts, /\/geoserver\/geom30012|127\.0\.0\.1|localhost|VITE_CARTO_BASEMAP_KEY/);
assert.doesNotMatch(scripts, /basemaps\.cartocdn\.com/);
assert.doesNotMatch(scripts, /sk-proj-|ghp_[A-Za-z0-9]{20}|postgres:\/\//);
assert.match(scripts, /Data Sources & Licences/);
assert.match(scripts, /\.\/licenses\/OPENLAYERS-BSD-2-Clause\.txt/);
assert.match(scripts, /\.\/data\/route_geometries\.geojson/);
console.log('Public artifact file, base-path, backend and secret checks passed');

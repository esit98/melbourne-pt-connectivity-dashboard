"""Export the frozen research outputs into the public site's static snapshot.

This reads saved final results only. It never connects to OTP or writes PostGIS.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main(research_root, check=False):
    output = research_root / "datasets/output"
    results_path = output / "connectivity_results_100.csv"
    geometry_path = output / "final_itinerary_geometries.geojson"
    leg_paths = [output / "outer_to_outer_legs.json", output / "outer_to_cbd_benchmark_legs.json"]
    centres_path = research_root / "datasets/processed/selected_outer_activity_centres.geojson"
    cbd_path = research_root / "datasets/processed/benchmark_cbd.csv"

    with results_path.open(newline="", encoding="utf-8-sig") as stream:
        rows = list(csv.DictReader(stream))
    numeric = {
        "travel_time_min", "transit_boardings", "transfers", "walking_distance_m",
        "transit_distance_m", "route_distance_m", "direct_distance_m",
        "detour_ratio", "minutes_per_direct_km",
    }
    for row in rows:
        for key in numeric:
            row[key] = float(row[key]) if row[key] else None
        for key in ("transit_boardings", "transfers"):
            if row[key] is not None:
                row[key] = int(row[key])
    by_id = {row["route_id"]: row for row in rows}
    features = read_json(geometry_path)["features"]
    assert len(rows) == len(by_id) == len(features) == 100
    assert sum(row["analysis_type"] == "outer_to_outer" for row in rows) == 90
    assert sum(row["analysis_type"] == "outer_to_cbd_benchmark" for row in rows) == 10
    assert all(row["requested_departure"] == "2026-10-13T08:00:00+11:00" for row in rows)
    assert {f["properties"]["route_id"] for f in features} == set(by_id)
    for feature in features:
        row = by_id[feature["properties"]["route_id"]]
        for key in ("analysis_type", "travel_time_min", "transfers", "detour_ratio"):
            assert feature["properties"][key] == row[key], (row["route_id"], key)
        feature["properties"] = row

    legs = [leg for path in leg_paths for leg in read_json(path)]
    assert len(legs) == 533
    assert {leg["route_id"] for leg in legs} == set(by_id)
    centres = [{
        "type": "Feature",
        "properties": {
            "centre_id": f["properties"]["centre_id"],
            "centre_name": f["properties"]["CENTRE_NAM"],
        },
        "geometry": f["geometry"],
    } for f in read_json(centres_path)["features"]]
    with cbd_path.open(newline="", encoding="utf-8-sig") as stream:
        cbd = next(csv.DictReader(stream))
    centres.append({
        "type": "Feature",
        "properties": {"centre_id": cbd["benchmark_id"], "centre_name": cbd["CENTRE_NAM"]},
        "geometry": {"type": "Point", "coordinates": [float(cbd["longitude"]), float(cbd["latitude"])]},
    })
    assert len(centres) == 11
    assert len({f["properties"]["centre_id"] for f in centres}) == 11
    point_by_id = {f["properties"]["centre_id"]: f["geometry"]["coordinates"] for f in centres}
    for feature in features:
        row = feature["properties"]
        # Same straight origin/destination comparison as ST_MakeLine in the study view.
        row["direct_od_coordinates"] = [point_by_id[row["origin_id"]], point_by_id[row["destination_id"]]]

    sources = [results_path, geometry_path, *leg_paths, centres_path, cbd_path]
    payload = {
        "source": "Frozen processed GEOM30012 study outputs",
        "source_sha256": {str(p.relative_to(research_root)).replace('\\', '/'): sha256(p) for p in sources},
        "routes": {"type": "FeatureCollection", "features": features},
        "centres": {"type": "FeatureCollection", "features": centres},
        "legs": legs,
    }
    destination = ROOT / "public/data/study.json"
    manifest_path = ROOT / "public/data/manifest.json"
    content = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    manifest = {
        "scenario": "2026-10-13T08:00:00+11:00",
        "timezone": "Australia/Melbourne",
        "route_counts": {"outer_to_outer": 90, "outer_to_cbd_benchmark": 10, "total": 100},
        "centre_counts": {"outer": 10, "cbd_benchmark": 1},
        "leg_count": 533,
        "route_geometry_count": 100,
        "source_sha256": payload["source_sha256"],
        "study_sha256": hashlib.sha256(content).hexdigest(),
        "study_bytes": len(content),
    }
    manifest_content = (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    if check:
        assert destination.read_bytes() == content, "Public snapshot differs from verified export"
        assert manifest_path.read_bytes() == manifest_content, "Public manifest differs from verified export"
        print("Public snapshot and manifest match the saved research outputs")
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    manifest_path.write_bytes(manifest_content)
    print(f"Exported {len(rows)} routes, {len(legs)} legs, {len(centres)} centres")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--research-root", type=Path, required=True, help="Private research project checkout")
    parser.add_argument("--check", action="store_true", help="Check the committed snapshot without changing it")
    args = parser.parse_args()
    main(args.research_root.resolve(), args.check)

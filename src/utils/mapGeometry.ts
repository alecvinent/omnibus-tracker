import type { Coordinate } from "@/domain/models";
import { getCityById } from "@/config/cities";

export type MapPlace = Coordinate & { label?: string };

export const MONTEVIDEO_CENTER: [number, number] = [-56.1645, -34.9011];

export function getCityCenter(cityId?: string | null): [number, number] {
  return getCityById(cityId).center;
}

export function toLngLat(point: Coordinate): [number, number] {
  return [point.longitude, point.latitude];
}

export function boundsForPlaces(
  origin?: MapPlace | null,
  destination?: MapPlace | null,
): [number, number, number, number] | null {
  const points = [origin, destination].filter(Boolean) as MapPlace[];
  if (points.length === 0) return null;
  if (points.length === 1) {
    const p = points[0];
    const pad = 0.02;
    return [
      p.longitude - pad,
      p.latitude - pad,
      p.longitude + pad,
      p.latitude + pad,
    ];
  }
  const lons = points.map((p) => p.longitude);
  const lats = points.map((p) => p.latitude);
  const padLon = Math.max(0.01, (Math.max(...lons) - Math.min(...lons)) * 0.15);
  const padLat = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 0.15);
  return [
    Math.min(...lons) - padLon,
    Math.min(...lats) - padLat,
    Math.max(...lons) + padLon,
    Math.max(...lats) + padLat,
  ];
}

export function routeLineFeature(
  origin: MapPlace,
  destination: MapPlace,
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [toLngLat(origin), toLngLat(destination)],
    },
  };
}

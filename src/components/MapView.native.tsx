import { useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  Camera,
  type CameraBoundsStop,
  type CameraCenterStop,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Marker,
  Map,
} from "@maplibre/maplibre-react-native";
import { MAP_STYLE_URL } from "@/config/env";
import { PlannedItinerary, TransitStop } from "@/domain/models";
import {
  boundsForPlaces,
  MONTEVIDEO_CENTER,
  routeLineFeature,
  toLngLat,
  type MapPlace,
} from "@/utils/mapGeometry";
import type { TripMapViewProps } from "./MapView.types";

type StopMarker = {
  key: string;
  stop: TransitStop;
  kind: "origin" | "destination" | "intermediate";
};

function extractStops(itinerary: PlannedItinerary): StopMarker[] {
  const seen = new Set<string>();
  const markers: StopMarker[] = [];

  function add(stop: TransitStop, kind: StopMarker["kind"]) {
    const key = `${stop.id}-${stop.coordinate.latitude}-${stop.coordinate.longitude}`;
    if (seen.has(key)) return;
    seen.add(key);
    markers.push({ key, stop, kind });
  }

  const legs = itinerary.legs;
  if (legs.length === 0) return markers;

  // First boarding
  if (legs[0]?.from) add(legs[0].from, "origin");

  // Intermediate stops (all "to" except the final one)
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (!leg) continue;
    if (leg.to && i < legs.length - 1) add(leg.to, "intermediate");
  }

  // Final alighting
  const lastLeg = legs[legs.length - 1];
  if (lastLeg?.to) add(lastLeg.to, "destination");

  return markers;
}

function boundsForStops(stops: StopMarker[]): [number, number, number, number] | null {
  const coords = stops.map((s) => s.stop.coordinate);
  if (coords.length === 0) return null;
  if (coords.length === 1) {
    const p = coords[0];
    const pad = 0.005;
    return [p.longitude - pad, p.latitude - pad, p.longitude + pad, p.latitude + pad];
  }
  const lons = coords.map((c) => c.longitude);
  const lats = coords.map((c) => c.latitude);
  const padLon = Math.max(0.005, (Math.max(...lons) - Math.min(...lons)) * 0.15);
  const padLat = Math.max(0.005, (Math.max(...lats) - Math.min(...lats)) * 0.15);
  return [
    Math.min(...lons) - padLon,
    Math.min(...lats) - padLat,
    Math.max(...lons) + padLon,
    Math.max(...lats) + padLat,
  ];
}

function previewRouteFeature(origin: MapPlace, destination: MapPlace): GeoJSON.Feature<GeoJSON.LineString> {
  return routeLineFeature(origin, destination);
}

function itineraryRouteFeature(itinerary: PlannedItinerary): GeoJSON.Feature<GeoJSON.LineString> | null {
  const coordinates: [number, number][] = [];
  for (const leg of itinerary.legs) {
    if (leg.shape && leg.shape.length > 0) {
      // Evitar duplicar el punto de unión entre legs.
      const shape = leg.shape as [number, number][];
      if (coordinates.length > 0 && shape.length > 0) {
        const last = coordinates[coordinates.length - 1];
        const first = shape[0];
        if (last[0] === first[0] && last[1] === first[1]) {
          coordinates.push(...shape.slice(1));
          continue;
        }
      }
      coordinates.push(...shape);
    }
  }
  if (coordinates.length === 0) return null;
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates },
  };
}

export function MapView({ origin, destination, center = MONTEVIDEO_CENTER, itinerary }: TripMapViewProps) {
  const cameraRef = useRef<CameraRef>(null);

  const stopMarkers = useMemo<StopMarker[]>(() => {
    return itinerary ? extractStops(itinerary) : [];
  }, [itinerary]);

  const bounds = useMemo<[number, number, number, number] | null>(() => {
    const placeBounds = boundsForPlaces(origin, destination);
    const stopBounds = boundsForStops(stopMarkers);
    if (!placeBounds) return stopBounds;
    if (!stopBounds) return placeBounds;
    return [
      Math.min(placeBounds[0], stopBounds[0]),
      Math.min(placeBounds[1], stopBounds[1]),
      Math.max(placeBounds[2], stopBounds[2]),
      Math.max(placeBounds[3], stopBounds[3]),
    ];
  }, [origin, destination, stopMarkers]);

  const previewFeature = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
    if (!origin || !destination) return null;
    return previewRouteFeature(origin, destination);
  }, [origin, destination]);

  const itineraryFeature = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
    if (!itinerary) return null;
    return itineraryRouteFeature(itinerary);
  }, [itinerary]);

  const cameraStop = useMemo<CameraCenterStop | CameraBoundsStop>(() => {
    if (bounds) {
      return {
        bounds,
        padding: { top: 50, right: 36, bottom: 50, left: 36 },
        duration: 450,
        easing: "ease",
      };
    }
    const point = origin ?? destination;
    return {
      center: point ? toLngLat(point) : center,
      zoom: 13,
      duration: 300,
      easing: "ease",
    };
  }, [bounds, origin, destination, center]);

  return (
    <View style={styles.wrap}>
      <Map mapStyle={MAP_STYLE_URL} style={styles.map}>
        <Camera ref={cameraRef} {...cameraStop} />
        {previewFeature ? (
          <GeoJSONSource id="route-preview-source" data={previewFeature}>
            <Layer
              type="line"
              id="route-preview-line"
              source="route-preview-source"
              paint={{ "line-color": "#167D72", "line-width": 4, "line-opacity": 0.85 }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </GeoJSONSource>
        ) : null}
        {itineraryFeature ? (
          <GeoJSONSource id="route-itinerary-source" data={itineraryFeature}>
            <Layer
              type="line"
              id="route-itinerary-line"
              source="route-itinerary-source"
              paint={{ "line-color": "#E17A42", "line-width": 4, "line-opacity": 0.9 }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </GeoJSONSource>
        ) : null}
        {origin ? (
          <Marker id="origin" lngLat={toLngLat(origin)} anchor="bottom">
            <View style={[styles.pin, styles.pinOrigin]} />
          </Marker>
        ) : null}
        {destination ? (
          <Marker id="destination" lngLat={toLngLat(destination)} anchor="bottom">
            <View style={[styles.pin, styles.pinDestination]} />
          </Marker>
        ) : null}
        {stopMarkers.map((m) => (
          <Marker id={m.key} key={m.key} lngLat={[m.stop.coordinate.longitude, m.stop.coordinate.latitude]} anchor="center">
            <View style={[styles.stopPin, pinStyleForKind(m.kind)]} />
          </Marker>
        ))}
      </Map>
    </View>
  );
}

function pinStyleForKind(kind: StopMarker["kind"]) {
  switch (kind) {
    case "origin":
      return styles.stopOrigin;
    case "destination":
      return styles.stopDestination;
    default:
      return styles.stopIntermediate;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: "hidden", borderRadius: 18 },
  map: { flex: 1 },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  pinOrigin: { backgroundColor: "#167D72" },
  pinDestination: { backgroundColor: "#E17A42" },
  stopPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  stopOrigin: { backgroundColor: "#167D72" },
  stopDestination: { backgroundColor: "#E17A42" },
  stopIntermediate: { backgroundColor: "#697581" },
});

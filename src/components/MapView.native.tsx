import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
} from "@maplibre/maplibre-react-native";
import { MAP_STYLE_URL } from "@/config/env";
import {
  boundsForPlaces,
  MONTEVIDEO_CENTER,
  routeLineFeature,
  toLngLat,
} from "@/utils/mapGeometry";
import type { TripMapViewProps } from "./MapView.types";

export function MapView({ origin, destination, center = MONTEVIDEO_CENTER }: TripMapViewProps) {
  const cameraRef = useRef<CameraRef>(null);

  const routeGeo = useMemo(() => {
    if (!origin || !destination) return null;
    return routeLineFeature(origin, destination);
  }, [origin, destination]);

  const bounds = useMemo(
    () => boundsForPlaces(origin, destination),
    [origin, destination],
  );

  useEffect(() => {
    if (!cameraRef.current) return;
    if (bounds) {
      cameraRef.current.fitBounds(bounds, {
        padding: { top: 40, right: 28, bottom: 40, left: 28 },
        duration: 450,
      });
      return;
    }
    const point = origin ?? destination;
    const lngLat = point ? toLngLat(point) : center;
    cameraRef.current.easeTo({ center: lngLat, zoom: 13, duration: 300 });
  }, [bounds, origin, destination, center]);

  const showRoute = Boolean(routeGeo);

  return (
    <View style={styles.wrap}>
      <Map mapStyle={MAP_STYLE_URL} style={styles.map}>
        <Camera ref={cameraRef} initialViewState={{ center, zoom: 13 }} />
        {showRoute && routeGeo ? (
          <GeoJSONSource id="trip-route" data={routeGeo}>
            <Layer
              id="trip-route-line"
              type="line"
              style={{
                lineColor: "#167D72",
                lineWidth: 4,
                lineOpacity: 0.85,
                lineDasharray: [2, 1.5],
              }}
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
      </Map>
    </View>
  );
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
});
import { Map, Camera } from "@maplibre/maplibre-react-native";
import { StyleSheet, View } from "react-native";

const DEFAULT_STYLE = "https://demotiles.maplibre.org/style.json";

export function MapView({ center = [-56.1645, -34.9011] }: { center?: [number, number] }) {
  const styleURL = process.env.EXPO_PUBLIC_MAP_STYLE_URL || DEFAULT_STYLE;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Map mapStyle={styleURL} compassEnabled logoEnabled attributionEnabled>
        <Camera
          centerCoordinate={center}
          zoomLevel={13}
          animationMode="flyTo"
          animationDuration={500}
        />
      </Map>
    </View>
  );
}

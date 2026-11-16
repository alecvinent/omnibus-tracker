import { StyleSheet, View, Text } from "react-native";

const DEFAULT_STYLE = "https://demotiles.maplibre.org/style.json";

export function MapView({ center = [-56.1645, -34.9011] }: { center?: [number, number] }) {
  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderInner}>
        <Text>{"Mapa — disponible en build nativo (MapLibre)"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, backgroundColor: "#E4EAE8", overflow: "hidden", borderRadius: 18 },
  placeholderInner: { height: 190, width: "100%", justifyContent: "center", alignItems: "center" },
});
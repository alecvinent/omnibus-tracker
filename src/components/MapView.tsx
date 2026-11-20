import { StyleSheet, Text, View } from "react-native";
import type { TripMapViewProps } from "./MapView.types";
import { MONTEVIDEO_CENTER } from "@/utils/mapGeometry";

export function MapView({ origin, destination, center = MONTEVIDEO_CENTER }: TripMapViewProps) {
  const hasBoth = Boolean(origin && destination);
  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderInner}>
        <Text style={styles.title}>Mapa (vista web)</Text>
        <Text style={styles.hint}>
          {hasBoth
            ? "Origen y destino seleccionados — usá el dev client en Android para MapLibre."
            : "Seleccioná origen y destino para ver el recorrido en el mapa nativo."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, backgroundColor: "#E4EAE8", overflow: "hidden", borderRadius: 18 },
  placeholderInner: { flex: 1, minHeight: 190, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { color: "#17212B", fontWeight: "700", marginBottom: 6 },
  hint: { color: "#697581", fontSize: 12, textAlign: "center", lineHeight: 17 },
});
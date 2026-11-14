import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapView } from "@/components/MapView";

export default function ResultsScreen() {
  const router = useRouter();
  const { origin, destination, originLat, originLon } = useLocalSearchParams<{
    origin: string; destination: string; originLat: string; originLon: string;
  }>();
  const center: [number, number] = [Number(originLon) || -56.1645, Number(originLat) || -34.9011];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.heading}>Tu viaje</Text>
        <View style={{ width: 55 }} />
      </View>
      <View style={styles.routeCard}>
        <Text style={styles.routeLabel}>ORIGEN</Text>
        <Text style={styles.routeValue}>{origin || "Origen"}</Text>
        <View style={styles.divider} />
        <Text style={styles.routeLabel}>DESTINO</Text>
        <Text style={styles.routeValue}>{destination || "Destino"}</Text>
      </View>
      <View style={styles.map}>
        <MapView center={center} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Planificación de transporte</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Conectá los datos oficiales</Text>
          <Text style={styles.noticeText}>
            La interfaz está preparada, pero todavía no se muestran itinerarios: faltan la geocodificación real del destino, la importación y validación del GTFS oficial de Montevideo y la conexión del motor de rutas. No mostramos líneas ni paradas inventadas.
          </Text>
        </View>
        <Text style={styles.caption}>Próxima integración</Text>
        <Text style={styles.bullet}>• Alternativas ordenadas por duración y transbordos</Text>
        <Text style={styles.bullet}>• Paradas de subida, bajada e intermedias</Text>
        <Text style={styles.bullet}>• Tiempo de caminata y ETA cuando esté disponible</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingHorizontal: 18 },
  top: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: "#167D72", fontWeight: "700", width: 55 },
  heading: { color: "#17212B", fontSize: 18, fontWeight: "800" },
  routeCard: { backgroundColor: "white", borderRadius: 16, padding: 15, marginBottom: 12 },
  routeLabel: { color: "#8A929B", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  routeValue: { color: "#17212B", fontSize: 14, fontWeight: "700", marginTop: 3 },
  divider: { height: 1, backgroundColor: "#EDF0F2", marginVertical: 10 },
  map: { height: 235, borderRadius: 16, overflow: "hidden" },
  content: { paddingVertical: 18, gap: 10 },
  title: { color: "#17212B", fontSize: 19, fontWeight: "800" },
  notice: { backgroundColor: "#FFF4E8", borderRadius: 14, padding: 15, gap: 7 },
  noticeTitle: { color: "#8A4A1B", fontSize: 14, fontWeight: "800" },
  noticeText: { color: "#765B46", fontSize: 12, lineHeight: 18 },
  caption: { color: "#17212B", fontSize: 13, fontWeight: "800", marginTop: 4 },
  bullet: { color: "#697581", fontSize: 12, lineHeight: 19 },
});

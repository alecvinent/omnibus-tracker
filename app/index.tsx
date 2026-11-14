import { useMemo, useState } from "react";
import {
  Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapView } from "@/components/MapView";
import { getCurrentLocation } from "@/services/location";

export default function HomeScreen() {
  const router = useRouter();
  const [origin, setOrigin] = useState("Mi ubicación");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number]>([-56.1645, -34.9011]);
  const [busy, setBusy] = useState(false);

  const canSearch = useMemo(() => destination.trim().length > 2, [destination]);

  async function useMyLocation() {
    setBusy(true);
    try {
      const coords = await getCurrentLocation();
      setOrigin("Mi ubicación");
      setOriginCoords([coords.longitude, coords.latitude]);
    } catch (error) {
      Alert.alert("Ubicación no disponible", error instanceof Error ? error.message : "No se pudo obtener la ubicación.");
    } finally {
      setBusy(false);
    }
  }

  async function searchTrip() {
    Keyboard.dismiss();
    router.push({
      pathname: "/results",
      params: {
        origin,
        destination: destination.trim(),
        originLat: String(originCoords[1]),
        originLon: String(originCoords[0]),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>TRANSPORTE PÚBLICO</Text>
          <Text style={styles.title}>¿A dónde vamos?</Text>
          <Text style={styles.subtitle}>Planificá tu viaje en Montevideo</Text>
        </View>
        <Pressable style={styles.profileButton} onPress={() => router.push("/preferences")}>
          <Text style={styles.profileIcon}>☷</Text>
        </Pressable>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.fieldRow}>
          <View style={styles.dotOrigin} />
          <View style={styles.fieldContent}>
            <Text style={styles.label}>ORIGEN</Text>
            <Text style={styles.locationValue}>{origin}</Text>
          </View>
          <Pressable onPress={useMyLocation} disabled={busy}>
            <Text style={styles.action}>{busy ? "..." : "GPS"}</Text>
          </Pressable>
        </View>
        <View style={styles.separator} />
        <View style={styles.fieldRow}>
          <View style={styles.dotDestination} />
          <View style={styles.fieldContent}>
            <Text style={styles.label}>DESTINO</Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Dirección, lugar o parada"
              placeholderTextColor="#8A929B"
              style={styles.input}
              returnKeyType="search"
              onSubmitEditing={searchTrip}
            />
          </View>
        </View>
        <Pressable
          style={[styles.searchButton, !canSearch && styles.disabledButton]}
          disabled={!canSearch}
          onPress={searchTrip}
        >
          <Text style={styles.searchButtonText}>Buscar ómnibus</Text>
        </Pressable>
      </View>

      <View style={styles.mapHeader}>
        <Text style={styles.sectionTitle}>Montevideo</Text>
        <Text style={styles.mapHint}>Mapa de referencia</Text>
      </View>
      <View style={styles.mapContainer}>
        <MapView center={originCoords} />
      </View>

      <View style={styles.bottomRow}>
        <Pressable style={styles.bottomItem} onPress={() => router.push("/saved")}>
          <Text style={styles.bottomIcon}>☆</Text>
          <Text style={styles.bottomLabel}>Guardados</Text>
        </Pressable>
        <Pressable style={styles.bottomItem} onPress={() => router.push("/preferences")}>
          <Text style={styles.bottomIcon}>⚙</Text>
          <Text style={styles.bottomLabel}>Preferencias</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingHorizontal: 20 },
  header: { paddingTop: 14, paddingBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { color: "#167D72", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: "#17212B", fontSize: 28, fontWeight: "800", marginTop: 5 },
  subtitle: { color: "#697581", fontSize: 14, marginTop: 4 },
  profileButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#E5F2EF", alignItems: "center", justifyContent: "center" },
  profileIcon: { fontSize: 25, color: "#167D72" },
  searchCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, elevation: 2, shadowColor: "#17212B", shadowOpacity: 0.06, shadowRadius: 12 },
  fieldRow: { flexDirection: "row", alignItems: "center", minHeight: 54, gap: 12 },
  dotOrigin: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#167D72" },
  dotDestination: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#E17A42" },
  fieldContent: { flex: 1 },
  label: { color: "#8A929B", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  locationValue: { color: "#17212B", fontSize: 15, fontWeight: "600", marginTop: 4 },
  input: { color: "#17212B", fontSize: 14, paddingVertical: 4, marginTop: 1 },
  action: { color: "#167D72", fontWeight: "800", fontSize: 12, padding: 8 },
  separator: { height: 1, backgroundColor: "#EDF0F2", marginLeft: 23 },
  searchButton: { backgroundColor: "#167D72", borderRadius: 13, paddingVertical: 15, alignItems: "center", marginTop: 12 },
  disabledButton: { opacity: 0.45 },
  searchButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  mapHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 10 },
  sectionTitle: { color: "#17212B", fontSize: 17, fontWeight: "800" },
  mapHint: { color: "#8A929B", fontSize: 11 },
  mapContainer: { flex: 1, minHeight: 190, overflow: "hidden", borderRadius: 18, backgroundColor: "#E4EAE8" },
  bottomRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 14 },
  bottomItem: { alignItems: "center", gap: 3 },
  bottomIcon: { color: "#167D72", fontSize: 22 },
  bottomLabel: { color: "#697581", fontSize: 11, fontWeight: "600" },
});

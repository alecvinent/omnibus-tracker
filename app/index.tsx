import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapView } from "@/components/MapView";
import { PlaceAutocompleteField } from "@/components/PlaceAutocompleteField";
import { getCurrentLocation } from "@/services/location";
import { geocodeFirst, type GeocodingResult } from "@/services/geocoding";
import type { MapPlace } from "@/utils/mapGeometry";
import { getCityCenter } from "@/utils/mapGeometry";
import { getPreferences } from "@/db/repositories";
import type { UserPreferences } from "@/domain/models";

type ActiveField = "origin" | "destination" | null;

function toMapPlace(result: GeocodingResult): MapPlace {
  return {
    label: result.displayName,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const cityCenter = useMemo(() => getCityCenter(cityId), [cityId]);

  useEffect(() => {
    getPreferences()
      .then((p: UserPreferences) => setCityId(p.cityId))
      .catch(console.warn);
  }, []);

  const [originQuery, setOriginQuery] = useState("Mi ubicación");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [originPlace, setOriginPlace] = useState<MapPlace | null>({
    label: "Mi ubicación",
    latitude: cityCenter[1],
    longitude: cityCenter[0],
  });
  const [destinationPlace, setDestinationPlace] = useState<MapPlace | null>(null);
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [busy, setBusy] = useState(false);
  const [originManual, setOriginManual] = useState(false);

  const canSearch = useMemo(
    () => destinationQuery.trim().length > 2,
    [destinationQuery],
  );

  async function useMyLocation() {
    setBusy(true);
    setOriginManual(false);
    try {
      const coords = await getCurrentLocation();
      setOriginQuery("Mi ubicación");
      setOriginPlace({
        label: "Mi ubicación",
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (error) {
      Alert.alert("Ubicación no disponible", error instanceof Error ? error.message : "No se pudo obtener la ubicación.");
    } finally {
      setBusy(false);
    }
  }

  async function searchTrip() {
    Keyboard.dismiss();
    setActiveField(null);
    let dest = destinationPlace;
    if (!dest || dest.label !== destinationQuery.trim()) {
      try {
        const resolved = await geocodeFirst(destinationQuery.trim(), cityId);
        if (!resolved) {
          Alert.alert("Destino", "No encontramos ese lugar en Montevideo. Elegí una sugerencia de la lista.");
          return;
        }
        dest = toMapPlace(resolved);
        setDestinationPlace(dest);
        setDestinationQuery(resolved.displayName);
      } catch {
        Alert.alert("Destino", "No se pudo geocodificar. Verificá que el backend esté activo (EXPO_PUBLIC_API_URL).");
        return;
      }
    }

    const origin = originPlace;
    if (!origin) {
      Alert.alert("Origen", "Elegí un origen o usá GPS.");
      return;
    }

    router.push({
      pathname: "/results",
      params: {
        origin: origin.label ?? originQuery,
        destination: dest.label ?? destinationQuery,
        originLat: String(origin.latitude),
        originLon: String(origin.longitude),
        destLat: String(dest.latitude),
        destLon: String(dest.longitude),
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
            <PlaceAutocompleteField
              label="ORIGEN"
              defaultValue={originQuery}
              placeholder="Dirección o lugar de salida"
              cityId={cityId}
              active={activeField === "origin"}
              onFocus={() => {
                setActiveField("origin");
                if (!originManual && originQuery === "Mi ubicación") {
                  setOriginManual(true);
                  setOriginPlace(null);
                }
              }}
              onBlur={() => setTimeout(() => setActiveField((f) => (f === "origin" ? null : f)), 180)}
              onChangeText={setOriginQuery}
              onSelectPlace={(place) => {
                setOriginPlace(toMapPlace(place));
                setOriginQuery(place.displayName);
                setOriginManual(true);
                setActiveField(null);
              }}
            />
          </View>
          <Pressable onPress={useMyLocation} disabled={busy}>
            <Text style={styles.action}>{busy ? "..." : "GPS"}</Text>
          </Pressable>
        </View>
        <View style={styles.separator} />
        <View style={styles.fieldRow}>
          <View style={styles.dotDestination} />
          <View style={styles.fieldContent}>
            <PlaceAutocompleteField
              label="DESTINO"
              defaultValue={destinationQuery}
              placeholder="Dirección, lugar o parada"
              cityId={cityId}
              active={activeField === "destination"}
              onFocus={() => setActiveField("destination")}
              onBlur={() => setTimeout(() => setActiveField((f) => (f === "destination" ? null : f)), 180)}
              onChangeText={(text) => {
                setDestinationQuery(text);
                setDestinationPlace(null);
              }}
              onSelectPlace={(place) => {
                setDestinationPlace(toMapPlace(place));
                setDestinationQuery(place.displayName);
                setActiveField(null);
              }}
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
        <Text style={styles.sectionTitle}>Mapa del viaje</Text>
        <Text style={styles.mapHint}>
          {destinationPlace ? "Origen y destino" : "Elegí lugares para ver la ruta"}
        </Text>
      </View>
      <View style={styles.mapContainer}>
        <MapView origin={originPlace} destination={destinationPlace} center={cityCenter} />
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
  searchCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, elevation: 2, shadowColor: "#17212B", shadowOpacity: 0.06, shadowRadius: 12, zIndex: 2 },
  fieldRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 54, gap: 12 },
  dotOrigin: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#167D72", marginTop: 22 },
  dotDestination: { width: 11, height: 11, borderRadius: 6, backgroundColor: "#E17A42", marginTop: 22 },
  fieldContent: { flex: 1, overflow: "visible" },
  action: { color: "#167D72", fontWeight: "800", fontSize: 12, padding: 8, marginTop: 14 },
  separator: { height: 1, backgroundColor: "#EDF0F2", marginLeft: 23 },
  searchButton: { backgroundColor: "#167D72", borderRadius: 13, paddingVertical: 15, alignItems: "center", marginTop: 12 },
  disabledButton: { opacity: 0.45 },
  searchButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  mapHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 10 },
  sectionTitle: { color: "#17212B", fontSize: 17, fontWeight: "800" },
  mapHint: { color: "#8A929B", fontSize: 11, flexShrink: 1, textAlign: "right", marginLeft: 8 },
  mapContainer: { flex: 1, minHeight: 190, zIndex: 0 },
  bottomRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 14 },
  bottomItem: { alignItems: "center", gap: 3 },
  bottomIcon: { color: "#167D72", fontSize: 22 },
  bottomLabel: { color: "#697581", fontSize: 11, fontWeight: "600" },
});
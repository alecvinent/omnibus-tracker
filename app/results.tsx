import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapView } from "@/components/MapView";
import { ItineraryCard } from "@/components/ItineraryCard";
import { getPreferences } from "@/db/repositories";
import { PlannedItinerary, UserPreferences } from "@/domain/models";
import { planTrip } from "@/services/planner";
import type { MapPlace } from "@/utils/mapGeometry";

const defaultPreferences: UserPreferences = {
  avoidTransfers: false,
  minimizeWalking: true,
  accessibleOnly: false,
};

export default function ResultsScreen() {
  const router = useRouter();
  const { origin, destination, originLat, originLon, destLat, destLon } = useLocalSearchParams<{
    origin: string;
    destination: string;
    originLat: string;
    originLon: string;
    destLat: string;
    destLon: string;
  }>();

  const originPlace = useMemo<MapPlace | null>(() => {
    const lat = Number(originLat);
    const lon = Number(originLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { label: origin, latitude: lat, longitude: lon };
  }, [origin, originLat, originLon]);

  const destinationPlace = useMemo<MapPlace | null>(() => {
    const lat = Number(destLat);
    const lon = Number(destLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { label: destination, latitude: lat, longitude: lon };
  }, [destination, destLat, destLon]);

  const [itineraries, setItineraries] = useState<PlannedItinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<PlannedItinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!originPlace || !destinationPlace) {
      setError("Faltan coordenadas de origen o destino.");
      return;
    }

    const originCoord = { latitude: originPlace.latitude, longitude: originPlace.longitude };
    const destinationCoord = { latitude: destinationPlace.latitude, longitude: destinationPlace.longitude };

    let cancelled = false;
    setLoading(true);
    setError(null);
    setItineraries([]);
    setSelectedItinerary(null);

    async function load() {
      try {
        const preferences = await getPreferences().catch(() => defaultPreferences);
        const data = await planTrip({
          origin: originCoord,
          destination: destinationCoord,
          preferences,
        });
        if (!cancelled) {
          setItineraries(data);
          if (data.length > 0) setSelectedItinerary(data[0]);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudieron cargar los itinerarios.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [originPlace, destinationPlace]);

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
        <MapView origin={originPlace} destination={destinationPlace} itinerary={selectedItinerary} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Opciones de viaje</Text>
        {loading && <ActivityIndicator color="#167D72" style={styles.loader} />}
        {!loading && error && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Planificación no disponible</Text>
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        )}
        {!loading && !error && itineraries.length === 0 && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Sin itinerarios</Text>
            <Text style={styles.noticeText}>
              No encontramos opciones de viaje para esta ruta. Cuando el motor de planificación esté conectado verás alternativas reales aquí.
            </Text>
          </View>
        )}
        {!loading && !error && itineraries.map((it) => (
          <ItineraryCard
            key={it.id}
            itinerary={it}
            selected={selectedItinerary?.id === it.id}
            onSelect={() => setSelectedItinerary(it)}
          />
        ))}
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
  map: { height: 235, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  content: { paddingVertical: 8, gap: 10, paddingBottom: 24 },
  title: { color: "#17212B", fontSize: 19, fontWeight: "800" },
  loader: { marginVertical: 20 },
  notice: { backgroundColor: "#FFF4E8", borderRadius: 14, padding: 15, gap: 7 },
  noticeTitle: { color: "#8A4A1B", fontSize: 14, fontWeight: "800" },
  noticeText: { color: "#765B46", fontSize: 12, lineHeight: 18 },
});

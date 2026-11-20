import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { TripHistoryItem } from "@/domain/models";
import {
  clearTripHistory,
  deleteTripHistoryItem,
  listTripHistory,
} from "@/db/repositories";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<TripHistoryItem[]>([]);

  const load = useCallback(() => {
    listTripHistory()
      .then(setItems)
      .catch(console.warn);
  }, []);

  useFocusEffect(load);

  async function remove(id: string) {
    await deleteTripHistoryItem(id);
    load();
  }

  function confirmClear() {
    Alert.alert(
      "Borrar historial",
      "¿Estás seguro de que querés eliminar todas las rutas guardadas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: async () => {
            await clearTripHistory();
            load();
          },
        },
      ]
    );
  }

  function reuse(item: TripHistoryItem) {
    router.push({
      pathname: "/results",
      params: {
        origin: item.originLabel,
        destination: item.destinationLabel,
        originLat: String(item.originLatitude),
        originLon: String(item.originLongitude),
        destLat: String(item.destinationLatitude),
        destLon: String(item.destinationLongitude),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.title}>Historial</Text>
        {items.length > 0 ? (
          <Pressable onPress={confirmClear}>
            <Text style={styles.clear}>Borrar todo</Text>
          </Pressable>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <Text style={styles.empty}>
            Todavía no buscaste rutas. Cuando planifiques un viaje con origen y destino explícitos, aparecerán aquí.
          </Text>
        ) : (
          items.map((item) => (
            <Pressable key={item.id} onPress={() => reuse(item)} style={styles.item}>
              <View style={styles.row}>
                <Text style={styles.route} numberOfLines={2}>
                  {item.originLabel} → {item.destinationLabel}
                </Text>
                <Pressable onPress={() => remove(item.id)} hitSlop={8}>
                  <Text style={styles.delete}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingHorizontal: 20 },
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: { color: "#167D72", fontWeight: "700", width: 70 },
  title: { color: "#17212B", fontSize: 17, fontWeight: "800" },
  clear: { color: "#E17A42", fontWeight: "700", fontSize: 12, width: 70, textAlign: "right" },
  content: { paddingTop: 16, gap: 10 },
  empty: {
    color: "#697581",
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
  },
  item: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  route: {
    color: "#17212B",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  delete: {
    color: "#8A929B",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  meta: {
    color: "#8A929B",
    fontSize: 11,
    marginTop: 6,
  },
});

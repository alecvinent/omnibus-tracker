import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Place } from "@/domain/models";
import { listPlaces } from "@/db/repositories";

export default function SavedScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  useEffect(() => { listPlaces().then(setPlaces).catch(console.warn); }, []);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Lugares guardados</Text><View style={{ width: 55 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {places.length === 0 ? <Text style={styles.empty}>Todavía no guardaste lugares. Cuando busques destinos, aparecerán aquí.</Text> :
          places.map((place) => <View key={place.id} style={styles.item}><Text style={styles.name}>{place.name}</Text><Text style={styles.meta}>{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</Text></View>)}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingHorizontal: 20 },
  header: { height: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { color: "#167D72", fontWeight: "700", width: 55 },
  title: { color: "#17212B", fontSize: 17, fontWeight: "800" },
  content: { paddingTop: 16, gap: 10 },
  empty: { color: "#697581", fontSize: 13, lineHeight: 20, backgroundColor: "white", padding: 16, borderRadius: 14 },
  item: { backgroundColor: "white", borderRadius: 14, padding: 15 },
  name: { color: "#17212B", fontSize: 14, fontWeight: "700" },
  meta: { color: "#8A929B", fontSize: 11, marginTop: 4 },
});

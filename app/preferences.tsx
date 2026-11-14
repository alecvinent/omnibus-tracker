import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getPreferences, savePreferences } from "@/db/repositories";
import { UserPreferences } from "@/domain/models";
import { useRouter } from "expo-router";

const defaults: UserPreferences = { avoidTransfers: false, minimizeWalking: true, accessibleOnly: false };

export default function PreferencesScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState(defaults);

  useEffect(() => { getPreferences().then(setPrefs).catch(console.warn); }, []);

  async function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { await savePreferences(next); }
    catch { Alert.alert("Error", "No se pudo guardar la preferencia."); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Preferencias</Text>
        <View style={{ width: 55 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>Personalizá cómo querés viajar. Los cambios se guardan en este dispositivo.</Text>
        <PreferenceRow title="Evitar transbordos" subtitle="Priorizar viajes con menos cambios de ómnibus" value={prefs.avoidTransfers} onChange={(v) => update("avoidTransfers", v)} />
        <PreferenceRow title="Caminar menos" subtitle="Priorizar paradas cercanas al origen y destino" value={prefs.minimizeWalking} onChange={(v) => update("minimizeWalking", v)} />
        <PreferenceRow title="Accesibilidad" subtitle="Priorizar opciones accesibles cuando los datos estén disponibles" value={prefs.accessibleOnly} onChange={(v) => update("accessibleOnly", v)} />
        <View style={styles.info}><Text style={styles.infoText}>La aplicación todavía no aplica estos criterios al cálculo: quedarán conectados al motor de planificación en la siguiente fase.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceRow({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  return <View style={styles.row}><View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSubtitle}>{subtitle}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ true: "#167D72" }} /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA", paddingHorizontal: 20 },
  header: { height: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { color: "#167D72", fontWeight: "700", width: 55 },
  title: { color: "#17212B", fontSize: 18, fontWeight: "800" },
  content: { paddingTop: 12, gap: 12 },
  description: { color: "#697581", fontSize: 13, lineHeight: 19, marginBottom: 6 },
  row: { backgroundColor: "white", padding: 16, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: { flex: 1, gap: 5 },
  rowTitle: { color: "#17212B", fontSize: 14, fontWeight: "800" },
  rowSubtitle: { color: "#697581", fontSize: 11, lineHeight: 16 },
  info: { backgroundColor: "#E8F2F0", padding: 14, borderRadius: 12, marginTop: 4 },
  infoText: { color: "#42645F", fontSize: 11, lineHeight: 17 },
});

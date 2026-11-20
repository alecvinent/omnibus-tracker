import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getPreferences, savePreferences } from "@/db/repositories";
import { UserPreferences } from "@/domain/models";
import { useRouter } from "expo-router";
import { DEFAULT_CITY_ID, getCityById, SUPPORTED_CITIES } from "@/config/cities";

const defaults: UserPreferences = {
  avoidTransfers: false,
  minimizeWalking: true,
  accessibleOnly: false,
  cityId: DEFAULT_CITY_ID,
};

export default function PreferencesScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState(defaults);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  useEffect(() => { getPreferences().then(setPrefs).catch(console.warn); }, []);

  async function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try { await savePreferences(next); }
    catch { Alert.alert("Error", "No se pudo guardar la preferencia."); }
  }

  const selectedCity = getCityById(prefs.cityId);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable>
        <Text style={styles.title}>Preferencias</Text>
        <View style={{ width: 55 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>Personalizá cómo querés viajar. Los cambios se guardan en este dispositivo.</Text>
        <Pressable style={styles.row} onPress={() => setCityModalVisible(true)}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Ciudad</Text>
            <Text style={styles.rowSubtitle}>Región usada para mapa y búsqueda de direcciones</Text>
          </View>
          <Text style={styles.value}>{selectedCity.label}</Text>
        </Pressable>
        <PreferenceRow title="Evitar transbordos" subtitle="Priorizar viajes con menos cambios de ómnibus" value={prefs.avoidTransfers} onChange={(v) => update("avoidTransfers", v)} />
        <PreferenceRow title="Caminar menos" subtitle="Priorizar paradas cercanas al origen y destino" value={prefs.minimizeWalking} onChange={(v) => update("minimizeWalking", v)} />
        <PreferenceRow title="Accesibilidad" subtitle="Priorizar opciones accesibles cuando los datos estén disponibles" value={prefs.accessibleOnly} onChange={(v) => update("accessibleOnly", v)} />
        <View style={styles.info}><Text style={styles.infoText}>La aplicación todavía no aplica estos criterios al cálculo: quedarán conectados al motor de planificación en la siguiente fase.</Text></View>

        <CityPickerModal
          visible={cityModalVisible}
          selectedId={prefs.cityId ?? DEFAULT_CITY_ID}
          onSelect={(id) => {
            update("cityId", id);
            setCityModalVisible(false);
          }}
          onClose={() => setCityModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function PreferenceRow({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  return <View style={styles.row}><View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSubtitle}>{subtitle}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ true: "#167D72" }} /></View>;
}

function CityPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccioná ciudad</Text>
          <ScrollView>
            {SUPPORTED_CITIES.map((city) => (
              <Pressable
                key={city.id}
                style={[styles.option, city.id === selectedId && styles.optionSelected]}
                onPress={() => onSelect(city.id)}
              >
                <Text style={[styles.optionText, city.id === selectedId && styles.optionTextSelected]}>
                  {city.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
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
  value: { color: "#167D72", fontWeight: "700", fontSize: 13 },
  info: { backgroundColor: "#E8F2F0", padding: 14, borderRadius: 12, marginTop: 4 },
  infoText: { color: "#42645F", fontSize: 11, lineHeight: 17 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(23,33,43,0.45)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, maxHeight: "70%" },
  modalTitle: { color: "#17212B", fontSize: 18, fontWeight: "800", marginBottom: 16 },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F2F4" },
  optionSelected: { backgroundColor: "#E8F2F0", borderRadius: 10 },
  optionText: { color: "#17212B", fontSize: 15 },
  optionTextSelected: { color: "#167D72", fontWeight: "800" },
  modalClose: { marginTop: 16, backgroundColor: "#167D72", padding: 14, borderRadius: 12, alignItems: "center" },
  modalCloseText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});

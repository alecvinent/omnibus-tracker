import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlannedItinerary, TransitLeg } from "@/domain/models";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
}

function LegRow({ leg, index }: { leg: TransitLeg; index: number }) {
  return (
    <View style={styles.leg}>
      <View style={styles.legHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.routeName}>{leg.routeShortName || `Línea ${leg.routeId}`}</Text>
      </View>
      <View style={styles.legStops}>
        <Text style={styles.stopText} numberOfLines={1}>
          {formatTime(leg.departureTime)} · {leg.from.name}
        </Text>
        <Text style={styles.stopText} numberOfLines={1}>
          {formatTime(leg.arrivalTime)} · {leg.to.name}
        </Text>
      </View>
    </View>
  );
}

export function ItineraryCard({ itinerary }: { itinerary: PlannedItinerary }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable onPress={() => setExpanded((v) => !v)} style={styles.card}>
      <View style={styles.summary}>
        <View style={styles.mainInfo}>
          <Text style={styles.duration}>{formatDuration(itinerary.durationMinutes)}</Text>
          <Text style={styles.meta}>
            {itinerary.transfers} transbordo{itinerary.transfers === 1 ? "" : "s"} · {" "}
            {formatDistance(itinerary.walkingDistanceMeters)} caminando
          </Text>
        </View>
        <Text style={styles.expand}>{expanded ? "▲" : "▼"}</Text>
      </View>
      {expanded && (
        <View style={styles.legs}>
          {itinerary.legs.length === 0 ? (
            <Text style={styles.emptyLegs}>Sin tramos en ómnibus para este itinerario.</Text>
          ) : (
            itinerary.legs.map((leg, i) => <LegRow key={`${leg.routeId}-${i}`} leg={leg} index={i} />)
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    gap: 10,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainInfo: {
    flex: 1,
    gap: 3,
  },
  duration: {
    color: "#17212B",
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: "#697581",
    fontSize: 12,
  },
  expand: {
    color: "#167D72",
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 6,
  },
  legs: {
    borderTopWidth: 1,
    borderTopColor: "#EDF0F2",
    paddingTop: 12,
    gap: 12,
  },
  emptyLegs: {
    color: "#697581",
    fontSize: 12,
    fontStyle: "italic",
  },
  leg: {
    gap: 6,
  },
  legHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#167D72",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
  },
  routeName: {
    color: "#17212B",
    fontSize: 14,
    fontWeight: "700",
  },
  legStops: {
    paddingLeft: 28,
    gap: 2,
  },
  stopText: {
    color: "#697581",
    fontSize: 12,
  },
});

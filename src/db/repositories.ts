import { getDatabase } from "./database";
import { Place, TripHistoryItem, UserPreferences } from "@/domain/models";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function savePlace(place: Place) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO places (id, name, latitude, longitude, kind)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, latitude=excluded.latitude,
       longitude=excluded.longitude, kind=excluded.kind, updated_at=CURRENT_TIMESTAMP`,
    place.id, place.name, place.latitude, place.longitude, place.kind
  );
}

export async function listPlaces(): Promise<Place[]> {
  const db = await getDatabase();
  return db.getAllAsync<Place>(
    "SELECT id, name, latitude, longitude, kind FROM places ORDER BY updated_at DESC LIMIT 50"
  );
}

export async function getPreferences(): Promise<UserPreferences> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    avoid_transfers: number;
    minimize_walking: number;
    accessible_only: number;
    city_id: string | null;
  }>("SELECT avoid_transfers, minimize_walking, accessible_only, city_id FROM preferences WHERE id=1");
  return {
    avoidTransfers: Boolean(row?.avoid_transfers),
    minimizeWalking: row ? Boolean(row.minimize_walking) : true,
    accessibleOnly: Boolean(row?.accessible_only),
    cityId: row?.city_id ?? undefined,
  };
}

export async function savePreferences(p: UserPreferences) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO preferences (id, avoid_transfers, minimize_walking, accessible_only, city_id)
       VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET avoid_transfers=excluded.avoid_transfers,
         minimize_walking=excluded.minimize_walking, accessible_only=excluded.accessible_only,
         city_id=excluded.city_id`,
    Number(p.avoidTransfers),
    Number(p.minimizeWalking),
    Number(p.accessibleOnly),
    p.cityId ?? null
  );
}

export async function saveTripHistoryItem(
  item: Omit<TripHistoryItem, "id" | "createdAt">
): Promise<TripHistoryItem> {
  const db = await getDatabase();
  const newItem: TripHistoryItem = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO trip_history
       (id, origin_label, origin_latitude, origin_longitude, destination_label, destination_latitude, destination_longitude, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newItem.id,
    newItem.originLabel,
    newItem.originLatitude,
    newItem.originLongitude,
    newItem.destinationLabel,
    newItem.destinationLatitude,
    newItem.destinationLongitude,
    newItem.createdAt
  );
  return newItem;
}

export async function listTripHistory(limit = 50): Promise<TripHistoryItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    origin_label: string;
    origin_latitude: number;
    origin_longitude: number;
    destination_label: string;
    destination_latitude: number;
    destination_longitude: number;
    created_at: string;
  }>("SELECT * FROM trip_history ORDER BY created_at DESC LIMIT ?", limit);
  return rows.map((row) => ({
    id: row.id,
    originLabel: row.origin_label,
    originLatitude: row.origin_latitude,
    originLongitude: row.origin_longitude,
    destinationLabel: row.destination_label,
    destinationLatitude: row.destination_latitude,
    destinationLongitude: row.destination_longitude,
    createdAt: row.created_at,
  }));
}

export async function deleteTripHistoryItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM trip_history WHERE id = ?", id);
}

export async function clearTripHistory(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM trip_history");
}

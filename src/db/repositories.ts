import { getDatabase } from "./database";
import { Place, UserPreferences } from "@/domain/models";

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
    avoid_transfers: number; minimize_walking: number; accessible_only: number;
  }>("SELECT avoid_transfers, minimize_walking, accessible_only FROM preferences WHERE id=1");
  return {
    avoidTransfers: Boolean(row?.avoid_transfers),
    minimizeWalking: row ? Boolean(row.minimize_walking) : true,
    accessibleOnly: Boolean(row?.accessible_only),
  };
}

export async function savePreferences(p: UserPreferences) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO preferences (id, avoid_transfers, minimize_walking, accessible_only)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET avoid_transfers=excluded.avoid_transfers,
       minimize_walking=excluded.minimize_walking, accessible_only=excluded.accessible_only`,
    Number(p.avoidTransfers), Number(p.minimizeWalking), Number(p.accessibleOnly)
  );
}

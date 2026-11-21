import * as SQLite from "expo-sqlite";

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (!database) database = await SQLite.openDatabaseAsync("omnibus-tracker.db");
  return database;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS places (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      kind TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      avoid_transfers INTEGER NOT NULL DEFAULT 0,
      minimize_walking INTEGER NOT NULL DEFAULT 1,
      accessible_only INTEGER NOT NULL DEFAULT 0,
      city_id TEXT
    );
    INSERT OR IGNORE INTO preferences (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS trip_history (
      id TEXT PRIMARY KEY NOT NULL,
      origin_label TEXT NOT NULL,
      origin_latitude REAL NOT NULL,
      origin_longitude REAL NOT NULL,
      destination_label TEXT NOT NULL,
      destination_latitude REAL NOT NULL,
      destination_longitude REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_trip_history_created_at ON trip_history(created_at DESC);
  `);

  // SQLite no soporta IF NOT EXISTS en ADD COLUMN; verificamos antes de migrar.
  const columns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(preferences);"
  );
  if (!columns.some((column) => column.name === "city_id")) {
    await db.execAsync("ALTER TABLE preferences ADD COLUMN city_id TEXT;");
  }
}

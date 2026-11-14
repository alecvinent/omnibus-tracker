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
      accessible_only INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO preferences (id) VALUES (1);
  `);
}

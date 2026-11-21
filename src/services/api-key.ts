/**
 * API key de cliente (BL-037): cada instalación de la APK registra una key
 * propia contra el backend; el hash se guarda en SQLite local, el valor
 * plain se devuelve una sola vez en `POST /register/client-key`.
 */
import Constants from "expo-constants";
import { API_URL } from "@/config/env";
import { getDatabase } from "@/db/database";

type ClientKeyRow = { id: number; key: string; key_id: string; name: string };

async function getClientKeyRow(): Promise<ClientKeyRow | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT id, key, key_id, name FROM client_key WHERE id = 1"
  );
  return row as ClientKeyRow | null;
}

async function saveClientKeyRow(row: {
  key_id: string;
  name: string;
  key: string;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO client_key (id, key, key_id, name, installed_at) VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET key = excluded.key, key_id = excluded.key_id, name = excluded.name`,
    row.key,
    row.key_id,
    row.name
  );
}

export async function getClientKeyId(): Promise<string | null> {
  const row = await getClientKeyRow();
  return row?.key_id ?? null;
}

export async function getClientApiKey(): Promise<string | null> {
  const row = await getClientKeyRow();
  return row?.key ?? null;
}

export interface RegisteredClientKey {
  id: string;
  name: string;
  key: string;
}

export async function registerClientKey(): Promise<RegisteredClientKey> {
  if (!API_URL) {
    throw new Error("Configurá EXPO_PUBLIC_API_URL para registrar la key de cliente.");
  }
  const deviceName = (Constants?.deviceName ?? "").trim();
  const displayName = deviceName ? `Omnibus Tracker - ${deviceName}` : "Omnibus Tracker";
  const resp = await fetch(`${API_URL}/register/client-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: displayName, deviceId: deviceName }),
  });
  if (!resp.ok) throw new Error(`Error al registrar key de cliente (${resp.status}).`);
  const data = (await resp.json()) as { id: string; name?: string; key: string };
  await saveClientKeyRow({ key_id: data.id, name: data.name ?? displayName, key: data.key });
  return { id: data.id, name: data.name ?? displayName, key: data.key };
}

export async function ensureClientKey(): Promise<void> {
  const existing = await getClientKeyId();
  if (!existing) await registerClientKey();
}

export async function rotateClientKey(): Promise<RegisteredClientKey | null> {
  const row = await getClientKeyRow();
  if (!row) return null;
  const resp = await fetch(`${API_URL}/admin/api-keys/${row.key_id}/rotate`, {
    method: "POST",
  });
  if (!resp.ok) throw new Error(`Error al rotar key (${resp.status}).`);
  const data = (await resp.json()) as { id: string; name?: string; key: string };
  await saveClientKeyRow({ key_id: data.id, name: data.name ?? row.name, key: data.key });
  return { id: data.id, name: data.name ?? row.name, key: data.key };
}

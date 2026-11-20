/**
 * Geocodificación mediada por el backend (BL-006).
 */
import { API_URL } from "@/config/env";

export type GeocodingResult = {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
};

export async function searchPlaces(query: string, limit = 6): Promise<GeocodingResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (!API_URL) {
    throw new Error("Configurá EXPO_PUBLIC_API_URL (y el backend en marcha) para buscar lugares.");
  }

  const url = `${API_URL}/v1/geocode/search?${new URLSearchParams({
    q,
    limit: String(limit),
  })}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudieron cargar sugerencias de lugares.");
  }
  return response.json() as Promise<GeocodingResult[]>;
}

export async function geocodeFirst(query: string): Promise<GeocodingResult | null> {
  const results = await searchPlaces(query, 1);
  return results[0] ?? null;
}
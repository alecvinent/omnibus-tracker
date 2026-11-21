/**
 * Geocodificación mediada por el backend (BL-006).
 */
import { API_KEY, API_URL } from "@/config/env";
import { getCityById } from "@/config/cities";

export type GeocodingResult = {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
};

export async function searchPlaces(
  query: string,
  options: { limit?: number; cityId?: string } = {},
): Promise<GeocodingResult[]> {
  const { limit = 6, cityId } = options;
  const q = query.trim();
  if (q.length < 2) return [];
  if (!API_URL) {
    throw new Error("Configurá EXPO_PUBLIC_API_URL (y el backend en marcha) para buscar lugares.");
  }

  const city = getCityById(cityId);
  const params = new URLSearchParams({
    q,
    limit: String(limit),
    cityId: city.id,
  });

  const url = `${API_URL}/v1/geocode/search?${params}`;
  const response = await fetch(url, {
    headers: {
      "X-API-Key": API_KEY,
    },
  });
  if (!response.ok) {
    throw new Error("No se pudieron cargar sugerencias de lugares.");
  }
  return response.json() as Promise<GeocodingResult[]>;
}

export async function geocodeFirst(
  query: string,
  cityId?: string,
): Promise<GeocodingResult | null> {
  const results = await searchPlaces(query, { limit: 1, cityId });
  return results[0] ?? null;
}
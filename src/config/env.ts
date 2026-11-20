export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json";
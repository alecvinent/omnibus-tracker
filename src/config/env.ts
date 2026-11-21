export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "";
// Proveedor por defecto: CARTO Voyager (gratuito, sin API key, calidad de navegación urbana).
// Alternativa documentada: OpenFreeMap Liberty / Bright.
export const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ??
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
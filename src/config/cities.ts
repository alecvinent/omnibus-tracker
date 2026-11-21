/**
 * Ciudades soportadas por la app.
 * Cada ciudad define el centro del mapa y la caja de búsqueda para geocodificación.
 */

export type CityConfig = {
  id: string;
  name: string;
  country: string;
  /** Etiqueta mostrada en la UI, ej: "la ciudad por defecto" */
  label: string;
  /** Centro del mapa como [longitude, latitude] */
  center: [number, number];
  /**
   * Bounding box para restringir búsquedas de Nominatim.
   * Formato: [south, north, west, east]
   */
  boundingBox: [number, number, number, number];
};

export const SUPPORTED_CITIES: CityConfig[] = [
  {
    id: "montevideo-uy",
    name: "Montevideo",
    country: "Uruguay",
    label: "Montevideo, Uruguay",
    center: [-56.1645, -34.9011],
    boundingBox: [-34.95, -34.8, -56.3, -56.0],
  },
];

export const DEFAULT_CITY_ID = SUPPORTED_CITIES[0].id;

export function getCityById(id?: string | null): CityConfig {
  return SUPPORTED_CITIES.find((c) => c.id === id) ?? SUPPORTED_CITIES[0];
}

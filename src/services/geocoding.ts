/**
 * Adaptador para geocodificación.
 * Nominatim público tiene política de uso: no invocarlo directamente desde
 * clientes móviles en producción ni usarlo para autocomplete intensivo.
 * En producción, mediar por backend y/o proveedor con SLA.
 */
export type GeocodingResult = {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
};

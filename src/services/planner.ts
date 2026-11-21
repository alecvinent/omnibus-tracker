import { Coordinate, PlannedItinerary, UserPreferences } from "@/domain/models";
import { getClientApiKey } from "@/services/api-key";

export type PlanTripRequest = {
  origin: Coordinate;
  destination: Coordinate;
  preferences: UserPreferences;
  departureTime?: string;
};

/**
 * Contrato del planificador. Se conectará al backend FastAPI/OpenTripPlanner.
 * No generar rutas ficticias: hasta disponer del GTFS oficial, se informa que
 * el servicio todavía no está configurado.
 */
export async function planTrip(_request: PlanTripRequest): Promise<PlannedItinerary[]> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("El planificador todavía no está configurado.");
  const apiKey = await getClientApiKey();
  const response = await fetch(`${apiUrl}/v1/trips/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey ?? "",
    },
    body: JSON.stringify(_request),
  });
  if (!response.ok) throw new Error(`Error del planificador (${response.status}).`);
  return response.json() as Promise<PlannedItinerary[]>;
}

export type Coordinate = { latitude: number; longitude: number };

export type Place = Coordinate & {
  id: string;
  name: string;
  kind: "home" | "work" | "favorite" | "recent";
};

export type UserPreferences = {
  avoidTransfers: boolean;
  minimizeWalking: boolean;
  accessibleOnly: boolean;
  /** ID de la ciudad seleccionada (ver src/config/cities.ts). */
  cityId?: string;
};

export type TransitStop = {
  id: string;
  name: string;
  coordinate: Coordinate;
  wheelchairBoarding?: boolean;
};

export type TransitLeg = {
  routeId: string;
  routeShortName: string;
  from: TransitStop;
  to: TransitStop;
  departureTime?: string;
  arrivalTime?: string;
  shape?: [number, number][];
};

export type PlannedItinerary = {
  id: string;
  durationMinutes: number;
  walkingDistanceMeters: number;
  transfers: number;
  legs: TransitLeg[];
};

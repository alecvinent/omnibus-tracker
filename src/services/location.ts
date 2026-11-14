import * as Location from "expo-location";
import { Coordinate } from "@/domain/models";

export async function getCurrentLocation(): Promise<Coordinate> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Necesitamos permiso de ubicación para usar tu posición como origen.");
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

import type { MapPlace } from "@/utils/mapGeometry";

export type TripMapViewProps = {
  origin?: MapPlace | null;
  destination?: MapPlace | null;
  /** Centro por defecto si solo hay un punto o ninguno */
  center?: [number, number];
};
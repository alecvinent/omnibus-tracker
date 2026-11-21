import { boundsForPlaces, routeLineFeature, toLngLat } from "./mapGeometry";

describe("toLngLat", () => {
  it("convierte Coordinate a [lng, lat]", () => {
    expect(toLngLat({ latitude: -34.9011, longitude: -56.1645 })).toEqual([
      -56.1645,
      -34.9011,
    ]);
  });
});

describe("boundsForPlaces", () => {
  it("retorna null si no hay puntos", () => {
    expect(boundsForPlaces(null, null)).toBeNull();
  });

  it("retorna bounds alrededor de un único punto", () => {
    const bounds = boundsForPlaces(
      { latitude: -34.9011, longitude: -56.1645 },
      null,
    );
    expect(bounds).not.toBeNull();
    if (!bounds) throw new Error("bounds no debe ser null");
    expect(bounds[0]).toBeCloseTo(-56.1845, 4);
    expect(bounds[1]).toBeCloseTo(-34.9211, 4);
    expect(bounds[2]).toBeCloseTo(-56.1445, 4);
    expect(bounds[3]).toBeCloseTo(-34.8811, 4);
  });

  it("retorna bounds que incluyen ambos puntos", () => {
    const bounds = boundsForPlaces(
      { latitude: -34.9011, longitude: -56.1645 },
      { latitude: -34.91, longitude: -56.17 },
    );
    expect(bounds).not.toBeNull();
    if (!bounds) throw new Error("bounds no debe ser null");
    expect(bounds[0]).toBeLessThan(-56.17);
    expect(bounds[2]).toBeGreaterThan(-56.1645);
    expect(bounds[1]).toBeLessThan(-34.91);
    expect(bounds[3]).toBeGreaterThan(-34.9011);
  });
});

describe("routeLineFeature", () => {
  it("devuelve un GeoJSON LineString con ambos puntos", () => {
    const feature = routeLineFeature(
      { latitude: -34.9011, longitude: -56.1645 },
      { latitude: -34.91, longitude: -56.17 },
    );
    expect(feature.type).toBe("Feature");
    expect(feature.geometry.type).toBe("LineString");
    expect(feature.geometry.coordinates).toHaveLength(2);
    expect(feature.geometry.coordinates[0]).toEqual([-56.1645, -34.9011]);
    expect(feature.geometry.coordinates[1]).toEqual([-56.17, -34.91]);
  });
});
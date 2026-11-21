import { planTrip } from "./planner";
import type { PlanTripRequest } from "./planner";

jest.mock("@/config/env", () => ({
  API_URL: "https://omnibus-tracker.fastapicloud.dev",
  API_KEY: "test-api-key",
}));

const baseRequest: PlanTripRequest = {
  origin: { latitude: -34.9011, longitude: -56.1645 },
  destination: { latitude: -34.91, longitude: -56.17 },
  preferences: { avoidTransfers: false, minimizeWalking: true, accessibleOnly: false },
};

describe("planTrip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = "https://omnibus-tracker.fastapicloud.dev";
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it("lanza error si no hay API_URL", async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    await expect(planTrip(baseRequest)).rejects.toThrow(
      "El planificador todavía no está configurado.",
    );
  });

  it("lanza error si response no es OK", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(planTrip(baseRequest)).rejects.toThrow("Error del planificador (503).");
  });

  it("devuelve itinerarios cuando fetch OK", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "1", durationMinutes: 25, walkingDistanceMeters: 200, transfers: 0, legs: [] },
      ],
    });
    const result = await planTrip(baseRequest);
    expect(result).toHaveLength(1);
    expect(result[0].durationMinutes).toBe(25);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/trips/plan"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-API-Key": expect.any(String),
        }),
      }),
    );
  });
});
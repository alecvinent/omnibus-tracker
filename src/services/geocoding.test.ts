jest.mock("@/config/env", () => ({
  API_URL: "https://omnibus-tracker.fastapicloud.dev",
  API_KEY: "test-api-key",
}));

import { searchPlaces } from "./geocoding";

describe("searchPlaces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna array vacío si query < 2 chars", async () => {
    const result = await searchPlaces("a");
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("lanza error si no hay API_URL configurada", async () => {
    const env = jest.requireMock("@/config/env");
    (env as { API_URL: string }).API_URL = "";
    await expect(searchPlaces("Plaza")).rejects.toThrow(
      "Configurá EXPO_PUBLIC_API_URL",
    );
    (env as { API_URL: string }).API_URL = "https://omnibus-tracker.fastapicloud.dev";
  });

  it("devuelve resultados parseados cuando fetch OK", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "1", displayName: "Plaza Independencia", latitude: -34.906, longitude: -56.165 },
      ],
    });

    const result = await searchPlaces("Plaza");
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe("Plaza Independencia");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/geocode/search?"),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-API-Key": expect.any(String) }),
      }),
    );
  });

  it("lanza error cuando fetch falla", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    await expect(searchPlaces("Plaza")).rejects.toThrow(
      "No se pudieron cargar sugerencias",
    );
  });
});
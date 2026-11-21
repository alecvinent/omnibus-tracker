/**
 * Tests de src/services/api-key.ts (BL-037): registro de keys de cliente,
 * obtención de key local y rotación desde el cliente.
 */
import {
  ensureClientKey,
  getClientApiKey,
  getClientKeyId,
  registerClientKey,
  rotateClientKey,
  type RegisteredClientKey,
} from "./api-key";

jest.mock("@/config/env", () => ({
  API_URL: "https://omnibus-tracker.fastapicloud.dev",
}));

const mockDb = {
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};
jest.mock("@/db/database", () => ({
  getDatabase: jest.fn(async () => mockDb),
}));

describe("api-key de cliente (BL-037)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.getFirstAsync.mockResolvedValue(null);
    mockDb.runAsync.mockResolvedValue(undefined);
  });

  it("getClientApiKey devuelve la key del cliente", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ id: 1, key: "omni_abc", key_id: "id1", name: "app" });
    await expect(getClientApiKey()).resolves.toBe("omni_abc");
  });

  it("getClientKeyId devuelve el id de la key", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ id: 1, key: "omni_abc", key_id: "id9", name: "app" });
    await expect(getClientKeyId()).resolves.toBe("id9");
  });

  it("registerClientKey llama a /register/client-key y guarda la key", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "id1", name: "Omnibus Tracker - MI 9", key: "omni_abc" }),
    });
    const reg: RegisteredClientKey = await registerClientKey();
    expect(fetch).toHaveBeenCalledWith(
      "https://omnibus-tracker.fastapicloud.dev/register/client-key",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("deviceId"),
      }),
    );
    expect(reg).toEqual({ id: "id1", name: "Omnibus Tracker - MI 9", key: "omni_abc" });
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  it("ensureClientKey registra solo si no hay key local", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "id1", name: "Omnibus Tracker - MI 9", key: "omni_abc" }),
    });
    await ensureClientKey();
    expect(fetch).toHaveBeenCalled();

    mockDb.getFirstAsync.mockResolvedValueOnce({ id: 1, key: "omni_abc", key_id: "id9", name: "app" });
    (fetch as jest.Mock).mockClear();
    await ensureClientKey();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rotateClientKey guarda la nueva key localmente", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ id: 1, key: "omni_vieja", key_id: "id1", name: "app" });
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "id2", name: "Omnibus Tracker - MI 9", key: "omni_nueva" }),
    });
    const reg = await rotateClientKey();
    expect(fetch).toHaveBeenCalledWith(
      "https://omnibus-tracker.fastapicloud.dev/admin/api-keys/id1/rotate",
      expect.objectContaining({ method: "POST" }),
    );
    expect(reg?.key).toBe("omni_nueva");
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  it("rotateClientKey sin key local devuelve null", async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce(null);
    expect(await rotateClientKey()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

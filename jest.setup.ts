// Mock de módulos nativos que no se pueden inicializar en Jest.
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 1 },
}));

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
    runAsync: jest.fn(),
    getDatabase: jest.fn(),
  })),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { deviceName: "MI 9" },
}));

// Mock global de fetch para servicios.
global.fetch = jest.fn();

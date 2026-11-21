// Mock de módulos nativos que no se pueden inicializar en Jest.
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 1 },
}));

jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

// Mock global de fetch para servicios.
global.fetch = jest.fn();
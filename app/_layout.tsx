import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { initializeDatabase } from "@/db/database";

export default function RootLayout() {
  useEffect(() => {
    initializeDatabase().catch((error) =>
      console.error("No se pudo inicializar SQLite", error)
    );
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

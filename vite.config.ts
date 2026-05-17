import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/echo-seven-interactive-story/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
}));

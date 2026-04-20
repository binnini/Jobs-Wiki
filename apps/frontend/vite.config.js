import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const wasProxyTarget =
    env.WAS_PROXY_TARGET ?? env.VITE_WAS_PROXY_TARGET ?? "http://127.0.0.1:4310";
  const frontendHost = env.VITE_HOST ?? "127.0.0.1";
  const frontendPort = Number(env.VITE_PORT ?? 5173);

  return {
    plugins: [react()],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      proxy: {
        "/api": wasProxyTarget,
        "/health": wasProxyTarget,
      },
    },
  };
});

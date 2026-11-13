import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { prerenderPaths } from "./src/data/seo-routes";

const nitroBuildDir = "node_modules/.nitro";

export default defineConfig(({ command, mode, isPreview }) => {
  // Start prerenders through a local Node preview of its SSR bundle.
  const prerenderPreview = isPreview && process.env["TSS_PRERENDERING"] === "true";

  return {
    plugins: [
      mode === "development" && devtools({
        logging: false,
        eventBusConfig: { enabled: false },
        enhancedLogs: { enabled: false },
        consolePiping: { enabled: false },
        removeDevtoolsOnBuild: false,
        injectSource: { enabled: true },
      }),
      tailwindcss(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        pages: prerenderPaths.map(path => ({ path })),
        prerender: {
          enabled: true,
          autoStaticPathsDiscovery: false,
          crawlLinks: false,
          failOnError: false,
        },
      }),
      !prerenderPreview && (command === "build" || isPreview) &&
        nitro({ defaultPreset: "cloudflare-module", buildDir: nitroBuildDir }),
      react(),
    ],
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    server: { host: "::", port: 8080 },
    ...(prerenderPreview ? { preview: { host: "127.0.0.1" } } : {}),
    environments: {
      ssr: {
        build: prerenderPreview
          ? { outDir: fileURLToPath(new URL(`./${nitroBuildDir}/vite/services/ssr`, import.meta.url)) }
          : { rolldownOptions: { output: { entryFileNames: "server.js" } } },
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  };
});

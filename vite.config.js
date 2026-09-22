import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { studyRoutes, routesForLevel } from "./src/studyRoutes.js";

export default defineConfig({
  base: "/",
  plugins: [react(), {
    name: "study-page-entrypoints",
    enforce: "post",
    generateBundle(_, bundle) {
      const entry = bundle["index.html"];
      if (!entry || entry.type !== "asset") return;
      const routes = ["/n2", "/n3", ...Object.values(studyRoutes),
        ...Object.values(routesForLevel("n2")), ...Object.values(routesForLevel("n3"))];
      for (const route of routes) {
        this.emitFile({ type: "asset", fileName: `${route.slice(1)}/index.html`, source: entry.source });
      }
    },
  }],
});

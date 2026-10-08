import { defineConfig } from "vite";

export default defineConfig({
  define: {
    // Shown in the credits as the version date; set when the app is built (or the dev server starts).
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
});

import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * The `@/` alias, which the app uses everywhere and vitest did not know about.
 *
 * Until now every test had to import relatively, so a module written in the
 * house style — `@/lib/...`, like the rest of the codebase — simply could not
 * be tested. That is a bad reason for a rule to go untested, and it is how the
 * criterion tie-break bug survived: the logic sat in a file no test could
 * reach, so nobody wrote one.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});

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
      // `server-only` throws the moment it is imported outside a React Server
      // Component, which put every server module's PURE logic — schemas,
      // parsers, pricing maths — out of reach of a test for no benefit. It is a
      // BUNDLER guard: its job is to fail a build that would ship server code
      // to a browser, and a vitest run is not that build. Stubbed here so the
      // rule keeps protecting the bundle and stops blocking the tests — the
      // same reason the `@` alias above exists.
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});

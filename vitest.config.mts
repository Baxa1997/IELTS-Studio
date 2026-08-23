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
      // `next/font/google` is compile-time magic — the loaders only exist once
      // Next has rewritten the call. Same reasoning as the stub above: its job
      // is to produce a build artefact, and a test run is not that build. This
      // keeps every module that declares a typeface testable.
      "next/font/google": fileURLToPath(new URL("./test/next-font-stub.ts", import.meta.url)),
    },
  },
  test: {
    /**
     * `.tsx` was missing here, which meant a component test could not run even if
     * somebody wrote one — the file would simply never be collected, and the suite
     * would pass while testing nothing. That is why there were 19 tests and zero of
     * them touched a component.
     */
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    /**
     * Per-file, so the 19 pure-logic suites keep running in the (much faster) node
     * environment and only the component tests pay for a DOM. Opt in with
     * `// @vitest-environment jsdom` at the top of a test file.
     */
    environment: "node",
    setupFiles: ["./test/setup-dom.ts"],
  },
});

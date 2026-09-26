import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// Turns off ESLint formatting rules that conflict with Prettier — keep this LAST.
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  /**
   * The brand colour specifically, everywhere — not just in the shared kit.
   *
   * The rule below holds absolutely but reaches two directories, because turning
   * it on tree-wide today would report ~2,000 violations across ten drifted
   * names (72 inks, 63 muteds, …) and get switched off. That is still true.
   *
   * INDIGO is the exception, because it is DONE: `scripts/codemod-tokens.ts` has
   * folded all 65 private `const INDIGO = "…"` declarations into
   * `lib/theme/tokens.ts`, so there is now exactly one place each of the four
   * indigos is written down. This rule is what keeps it that way — without it the
   * 66th file re-introduces its own next week and the count starts climbing
   * again, which is precisely how the first four got there.
   *
   * It is deliberately narrow: it fires only on a hex assigned to an INDIGO-named
   * const, so it says nothing about the 2,000 literals still waiting for their
   * own codemod rows. When one of those names is converted, add it here the same
   * way.
   */
  {
    files: ["app/**/*.{ts,tsx}", "shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "VariableDeclarator[id.name=/^INDIGO/] > Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "The brand indigo lives in @/lib/theme/tokens — import it (`INDIGO`, or `INDIGO_CONSOLE as INDIGO` for the console, `INDIGO_SHELL` for the skill hubs, `INDIGO_STUDIO` for the reading studio) instead of writing the hex here. All 65 of these were just centralised; please don't start a 66th.",
        },
      ],
    },
  },
  /**
   * No raw colours outside the token module.
   *
   * ⚠️ THIS BLOCK MUST STAY BELOW THE INDIGO ONE. Both set `no-restricted-syntax`,
   * and in a flat config the LATER matching block replaces the rule outright —
   * it does not add selectors to it. From 2026-09-05 (a1af88f) until 2026-09-26
   * this block sat above, the INDIGO block's `**` glob covered the kit too, and
   * the kit was checked for INDIGO consts only: a raw `"#123456"` in
   * shared/components/ui linted clean. Nothing about the config looked wrong.
   * The selector here catches every hex, INDIGO's included, so nothing is lost
   * by letting it win.
   *
   * The frontend had 2,748 hex literals across 178 files and 95 private palette
   * blocks; the same token had drifted into eight different inks and nine muteds
   * because there was no rule saying where a colour comes from. This is the rule.
   *
   * It is scoped to the shared kit rather than the whole tree ON PURPOSE. Turning
   * it on everywhere today would report thousands of violations, which reads as
   * noise and gets switched off — and most of those call sites need a human to
   * decide WHICH token they meant, since their current value diverges. So it
   * holds absolutely where the shared components live, and the glob grows as
   * `scripts/codemod-tokens.ts` converts the rest, directory by directory.
   *
   * `lib/theme/tokens.ts` is where the literals are allowed to be, so it is not
   * in the list.
   */
  {
    files: ["shared/components/ui/**/*.{ts,tsx}", "shared/components/exam/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message:
            "Raw colour literal. Import the token from @/lib/theme/tokens — and if the colour you want isn't there, add it there rather than here.",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{6}/]",
          message:
            "Raw colour literal in a template string. Import the token from @/lib/theme/tokens.",
        },
      ],
    },
  },
  /**
   * Imports flow one way: app/ → shared/ → lib/.
   *
   * A shared component that imports from a page is not shared — it only works
   * where that page's code lives, and it drags the page into every other place
   * it is used. Six did exactly that until the 2026-09-26 restructure moved
   * their server actions into lib/, which brought the count to zero; this keeps
   * it there. A server action more than one area calls belongs in
   * `lib/<domain>/`, next to the logic it runs.
   *
   * ⚠️ `no-restricted-imports`, NOT `no-restricted-syntax`. The colour rules
   * above own that key, and a later block setting it would replace them for
   * these files rather than add to them — which is how the kit's colour rule
   * spent three weeks switched off.
   */
  {
    files: ["shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "**/app/*"],
              message:
                "shared/ must not import from app/. Move what both sides need down: a component into shared/, a server action or helper into lib/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "**/app/*", "@/shared/*", "**/shared/*"],
              message:
                "lib/ is the bottom layer: it must not import from app/ or shared/. Pass what it needs in as arguments.",
            },
          ],
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

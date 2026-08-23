/**
 * `next/font/google` outside a Next build.
 *
 * The font loaders are compile-time magic: Next rewrites each call during the
 * build into a generated CSS module, so calling `Poppins({...})` in a plain Node
 * process throws "Poppins is not a function". That put every module which
 * declares a typeface — the brand lockups, the app shell, the console chrome —
 * out of reach of a test, along with the pure helpers sitting beside them.
 *
 * Same reasoning as the `server-only` stub next door: the real loader's job is
 * to produce a build artefact, and a vitest run is not that build. Each export
 * returns the shape the call sites actually use — a CSS variable name and a
 * class — so a component under test renders with a stable, inert class.
 *
 * The families are listed explicitly rather than served by a Proxy because the
 * app imports them BY NAME, and ESM named imports cannot be produced
 * dynamically. Adding a typeface to the app means adding a line here; the test
 * that fails will say exactly which one.
 */

interface FontResult {
  variable: string;
  className: string;
  style: { fontFamily: string };
}

function loader(family: string) {
  return (opts?: { variable?: string }): FontResult => ({
    variable: opts?.variable ?? `--font-${family.toLowerCase().replace(/_/g, "-")}`,
    className: `__font_${family}`,
    style: { fontFamily: family.replace(/_/g, " ") },
  });
}

export const Bricolage_Grotesque = loader("Bricolage_Grotesque");
export const DM_Sans = loader("DM_Sans");
export const Geist_Mono = loader("Geist_Mono");
export const Hanken_Grotesk = loader("Hanken_Grotesk");
export const JetBrains_Mono = loader("JetBrains_Mono");
export const Manrope = loader("Manrope");
export const Newsreader = loader("Newsreader");
export const Plus_Jakarta_Sans = loader("Plus_Jakarta_Sans");
export const Poppins = loader("Poppins");
export const Source_Serif_4 = loader("Source_Serif_4");
export const Work_Sans = loader("Work_Sans");

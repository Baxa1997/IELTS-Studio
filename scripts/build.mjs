/**
 * `npm run build` — `next build`, retried when Google Fonts drops a download.
 *
 * WHY. Every typeface here comes through `next/font/google`, which downloads
 * the font files from fonts.gstatic.com DURING the build. When one download
 * fails, Turbopack reports it as a missing module —
 *   Can't resolve '@vercel/turbopack-next/internal/font/google/font?…'
 * — and the whole production build fails over a file that would have arrived
 * a minute later. It failed three deploys on 2026-11-14 alone, each fixed by
 * pressing redeploy. This presses it for us.
 *
 * ⚠️ ONLY THAT FAILURE IS RETRIED. A type error, a failed import or a broken
 * page fails exactly as fast as before: retrying those would triple the wait
 * for the same answer.
 *
 * ⚠️ WHY NOT HOST THE FONTS IN THE REPO, the obvious cure. `next/font/google`
 * emits every subset a family has, each with its `unicode-range` — that is how
 * Russian text gets Cyrillic Hanken Grotesk and Manrope today. `next/font/local`
 * takes files by weight and style only, with no unicode-range, so the choices
 * were Latin-only files (Russian pages silently fall back to a system font) or
 * whole-family files (several times the weight, preloaded on every page).
 * Either is a visible change to the product to cure a build-machine hiccup.
 *
 * Plain Node with no imports from the project, so it runs before anything is
 * compiled. The command is overridable for the script's own test.
 */
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

/** What a dropped font download looks like in the build output. */
export const FONT_FLAKE = /internal\/font\/google\/font|next\/font\/google queries have exactly one entry/;

export const MAX_ATTEMPTS = 3;
const WAIT_MS = 15_000;

/** Whether a failed build's output is the font flake, and nothing we wrote. */
export function isFontFlake(output) {
  return FONT_FLAKE.test(output);
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["inherit", "pipe", "pipe"], shell: false });
    let output = "";
    const tee = (stream) => (chunk) => {
      output += chunk;
      stream.write(chunk);
    };
    child.stdout.on("data", tee(process.stdout));
    child.stderr.on("data", tee(process.stderr));
    child.on("error", (err) => resolve({ code: 1, output: `${output}\n${err.message}` }));
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

export async function build({ command = "next", args = ["build"], wait = WAIT_MS } = {}) {
  for (let attempt = 1; ; attempt++) {
    const { code, output } = await run(command, args);
    if (code === 0) return 0;
    if (attempt >= MAX_ATTEMPTS || !isFontFlake(output)) return code;
    console.error(
      `\n[build] Google Fonts dropped a download (attempt ${attempt} of ${MAX_ATTEMPTS}). Retrying in ${wait / 1000}s…\n`,
    );
    await new Promise((r) => setTimeout(r, wait));
  }
}

// Run only as the script itself — imported (by its test), it must not start a build.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await build());
}

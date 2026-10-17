/**
 * The IndexNow key file, as an engine fetches it. lib/indexnow.test.ts covers
 * the submissions; this is the half they all depend on.
 */

import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { INDEXNOW_KEY, INDEXNOW_KEY_PATH } from "@/lib/indexnow";

import { GET } from "./route";

describe(INDEXNOW_KEY_PATH, () => {
  it("answers with the key and nothing else, as plain text", async () => {
    const res = GET();
    expect(res.headers.get("content-type")).toMatch(/^text\/plain/);
    expect(await res.text()).toBe(INDEXNOW_KEY);
  });

  it("is served where every submission says it is", () => {
    // The folder IS the URL, and a folder name cannot be derived from a
    // constant, so this is what keeps the two together.
    expect(`/${basename(dirname(fileURLToPath(import.meta.url)))}`).toBe(INDEXNOW_KEY_PATH);
  });
});

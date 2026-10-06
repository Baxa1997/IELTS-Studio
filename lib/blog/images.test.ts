import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

const { sniffImage } = await import("./images");

const bytes = (...b: (number | string)[]) =>
  new Uint8Array(b.flatMap((x) => (typeof x === "string" ? [...x].map((c) => c.charCodeAt(0)) : [x])));

describe("an uploaded picture is what its bytes say, not what the browser claims", () => {
  it("recognises the raster formats the bucket accepts", () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffImage(bytes("GIF89a"))).toBe("image/gif");
    expect(sniffImage(bytes("RIFF", 0, 0, 0, 0, "WEBP"))).toBe("image/webp");
    expect(sniffImage(bytes(0, 0, 0, 0x1c, "ftypavif"))).toBe("image/avif");
  });

  it("refuses HTML or SVG renamed to .png — they would be served from our storage domain", () => {
    expect(sniffImage(bytes("<!doctype html>"))).toBeNull();
    expect(sniffImage(bytes("<svg xmlns="))).toBeNull();
  });
});

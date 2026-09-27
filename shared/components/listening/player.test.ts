/**
 * The listening player's arithmetic.
 *
 * None of this could be tested before. It lived at line 2,400 of a 5,600-line
 * client component, so importing any of it meant importing the hub, the runner
 * and every question renderer along with it. Extracting the player was most of
 * the work; these assertions are the point of having done it.
 *
 * What is pinned here is the part that decides what a candidate sees on the
 * progress bar and the clock — and specifically the rule that reading pauses
 * COUNT AS ELAPSED TIME. They are minutes of the candidate's test, so the bar
 * and the clock both have to spend them. Treating position as "offset within
 * the audio files" makes the bar jump backwards at every pause boundary, which
 * is exactly the bug this shape prevents.
 *
 * No DOM: these are pure functions over a segment list.
 */

import { describe, expect, it } from "vitest";

import {
  derivePlayerPos,
  segPart,
  segSecs,
  splitAudioByPart,
  type PlayerApi,
  type PlayerTick,
} from "./player";
import type { PauseSeg, Segment } from "./types";

const audio = (label: string, seconds: number, part?: number): Segment => ({
  kind: "audio",
  url: `https://example.test/${label}.mp3`,
  path: `${label}.mp3`,
  label,
  seconds,
  ...(part === undefined ? {} : { part }),
});
const pause = (seconds: number, label = "Reading time", part?: number): Segment => ({
  kind: "pause",
  seconds,
  label,
  ...(part === undefined ? {} : { part }),
});

describe("segPart", () => {
  it("reads the part number out of a narrator label", () => {
    expect(segPart("Part 3 · Discussion", 1)).toBe(3);
    expect(segPart("PART 4 — Lecture", 1)).toBe(4);
    expect(segPart("part2", 1)).toBe(2);
  });

  it("carries the previous part forward when the label says nothing", () => {
    // Reading pauses and stingers have no part in their label; they belong to
    // whatever was sounding before them, not to Part 1.
    expect(segPart("Reading time", 3)).toBe(3);
    expect(segPart("", 2)).toBe(2);
  });

  it("ignores a number outside the four IELTS parts", () => {
    expect(segPart("Part 7 · Nonsense", 2)).toBe(2);
  });
});

describe("splitAudioByPart", () => {
  it("groups a full test into four parts, in order", () => {
    const segs = [
      audio("Part 1 · Conversation", 200),
      pause(30),
      audio("Part 2 · Monologue", 210),
      pause(30),
      audio("Part 3 · Discussion", 220),
      audio("Part 4 · Lecture", 230),
    ];
    const parts = splitAudioByPart(segs);
    expect(parts.map((p) => p.part)).toEqual([1, 2, 3, 4]);
    // The pause after Part 1 belongs to Part 1 — it is Part 1's reading time.
    expect(parts[0].segments).toHaveLength(2);
    expect(parts[3].segments).toHaveLength(1);
  });

  it("prefers an explicit part over the label", () => {
    // v2 items carry `part` on the segment; the label is the fallback, not the
    // source of truth, so a mislabelled clip still files correctly.
    const parts = splitAudioByPart([audio("Part 1 · mislabelled", 10, 3)]);
    expect(parts[0].part).toBe(3);
  });

  it("returns parts sorted even when the segments arrive out of order", () => {
    const parts = splitAudioByPart([audio("a", 10, 4), audio("b", 10, 2), audio("c", 10, 3)]);
    expect(parts.map((p) => p.part)).toEqual([2, 3, 4]);
  });

  it("survives an empty recording", () => {
    expect(splitAudioByPart([])).toEqual([]);
  });
});

describe("segSecs", () => {
  it("takes a pause at its declared length", () => {
    expect(segSecs(pause(30))).toBe(30);
  });

  it("treats an unmeasured clip as zero rather than NaN", () => {
    // Narrator clips can arrive without a duration; the strip sums these, and
    // one NaN would blank the whole progress bar.
    const noDuration = { kind: "audio", url: "u", path: "p", label: "l" } as Segment;
    expect(segSecs(noDuration)).toBe(0);
  });
});

describe("derivePlayerPos", () => {
  const durs = [100, 30, 100]; // audio, reading pause, audio
  const base = (over: Partial<PlayerApi>): PlayerApi =>
    ({
      phase: "running",
      paused: false,
      finished: false,
      playing: true,
      seg: null,
      idx: 0,
      title: "",
      isPause: false,
      audioPart: 1,
      partReached: 1,
      duration: 230,
      durs,
      tick: { subscribe: () => () => {}, get: () => ({ curTime: 0, pauseLeft: 0 }) },
      speed: 1,
      muted: false,
      audioError: null,
      start: () => {},
      togglePlay: () => {},
      cycleSpeed: () => {},
      toggleMute: () => {},
      advance: () => {},
      retry: () => {},
      reset: () => {},
      seekTo: () => {},
      ...over,
    }) as PlayerApi;
  const tick = (curTime: number, pauseLeft = 0): PlayerTick => ({ curTime, pauseLeft });

  it("counts elapsed time inside the first clip", () => {
    const pos = derivePlayerPos(base({ idx: 0, seg: audio("a", 100) }), tick(40));
    expect(pos.elapsed).toBe(40);
    expect(pos.progress).toBeCloseTo(40 / 230);
    expect(pos.status).toBe("Now playing...");
  });

  /**
   * The rule the whole module exists to get right: a reading pause is elapsed
   * test time. Ten seconds into a 30-second pause that follows a 100-second
   * clip, the candidate is 110 seconds into their test — not 100, and certainly
   * not back at 10.
   */
  it("spends a reading pause as elapsed time, counting down", () => {
    const p = base({ idx: 1, seg: pause(30) as PauseSeg });
    const pos = derivePlayerPos(p, tick(0, 20)); // 20s of the pause remain
    expect(pos.countdown).toBe(20);
    expect(pos.elapsed).toBe(110); // 100 (clip) + 10 (pause spent)
    expect(pos.status).toBe("Reading time — 20s");
  });

  it("shows a pause at full length before its countdown has started", () => {
    const pos = derivePlayerPos(base({ idx: 1, seg: pause(30) as PauseSeg }), tick(0, 0));
    expect(pos.countdown).toBe(30);
    expect(pos.elapsed).toBe(100); // none of the pause spent yet
  });

  it("never runs past the clip's own duration", () => {
    // `currentTime` can overshoot slightly at the `ended` boundary; the bar must
    // not creep into the next segment's share of the track.
    const pos = derivePlayerPos(base({ idx: 0, seg: audio("a", 100) }), tick(140));
    expect(pos.elapsed).toBe(100);
  });

  it("pins to the end once finished, and says so", () => {
    const pos = derivePlayerPos(base({ finished: true, idx: 2, seg: audio("c", 100) }), tick(3));
    expect(pos.elapsed).toBe(230);
    expect(pos.progress).toBe(1);
    expect(pos.status).toBe("Review your answers, then submit");
  });

  it("reports idle and paused states rather than 'now playing'", () => {
    expect(derivePlayerPos(base({ phase: "idle", idx: -1 }), tick(0)).status).toBe(
      "Ready — press play or drag the bar",
    );
    expect(derivePlayerPos(base({ paused: true, seg: audio("a", 100) }), tick(5)).status).toBe(
      "Paused",
    );
  });

  it("surfaces an audio error in place of the playing status", () => {
    const pos = derivePlayerPos(
      base({ seg: audio("a", 100), audioError: "Audio failed to load." }),
      tick(5),
    );
    expect(pos.status).toBe("Audio failed to load.");
  });

  it("keeps progress at zero for a zero-length recording", () => {
    // A guard against dividing by a duration of 0 and rendering a NaN width.
    const pos = derivePlayerPos(base({ duration: 0, idx: -1, phase: "idle" }), tick(0));
    expect(pos.progress).toBe(0);
  });
});

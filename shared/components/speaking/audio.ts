/**
 * The shared voice plumbing for every speaking room.
 *
 * This lived in triplicate — the tutor room, the live mock and the Part-2
 * recorder each carried their own copy of the mic worklet, and the first two
 * their own `VoicePlayer`, `startMic` and `checkMicAccess`. They had already
 * drifted apart: only the tutor's player learned to stop mid-sentence when the
 * learner cuts in, so the exam room silently kept the old behaviour. Audio bugs
 * are the expensive kind to find twice.
 *
 * Everything here is deliberately parameterised rather than unified by fiat:
 * where the two rooms genuinely behaved differently (the playback cushion),
 * that difference is now an argument, so neither room's tuning changed.
 */

/** Mic → 16 kHz mono PCM16. One processor name is safe: each `startMic` builds
 *  its own AudioContext, and `registerProcessor` is scoped to that context. */
export const WORKLET_SRC = `
class Tap extends AudioWorkletProcessor {
  process(inputs){ const ch = inputs[0]?.[0]; if (ch) this.port.postMessage(ch.slice(0)); return true; }
}
registerProcessor("speak-tap", Tap);`;

export const IN_RATE = 16000;
export const OUT_RATE = 24000;

export interface VoicePlayerOptions {
  /** Output sample rate of the engine's audio. */
  rate?: number;
  /**
   * Head start given to the first chunk of a burst, absorbing network jitter.
   * The tutor room uses a larger cushion (it re-arms per turn via `beginTurn`);
   * the exam room has always used a smaller one.
   */
  leadS?: number;
  /** Head start for a chunk that arrives after the queue has already drained. */
  gapS?: number;
}

/**
 * Plays the engine's PCM and reports when playback has REALLY finished.
 *
 * That report is load-bearing: without it the engine would open the mic while
 * the examiner's or tutor's voice was still coming out of the speakers, and it
 * would hear and answer itself.
 */
export class VoicePlayer {
  private ctx: AudioContext;
  private next = 0;
  private live = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private rate: number;
  private leadS: number;
  private gapS: number;
  onPlaying: ((on: boolean) => void) | null = null;
  onDrained: (() => void) | null = null;

  constructor({ rate = OUT_RATE, leadS = 0.06, gapS = 0.06 }: VoicePlayerOptions = {}) {
    this.ctx = new AudioContext();
    this.rate = rate;
    this.leadS = leadS;
    this.gapS = gapS;
  }

  resume() {
    void this.ctx.resume();
  }

  get busy(): boolean {
    return this.live > 0;
  }

  /** Start of a new spoken turn: re-arm the jitter buffer. */
  beginTurn() {
    this.next = 0;
  }

  push(pcm: ArrayBuffer) {
    const i16 = new Int16Array(pcm);
    if (!i16.length) return;
    const buf = this.ctx.createBuffer(1, i16.length, this.rate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < i16.length; i++) ch[i] = i16[i] / 32768;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    if (this.live === 0) this.onPlaying?.(true);
    this.live += 1;
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      this.live -= 1;
      if (this.live === 0) {
        this.onPlaying?.(false);
        this.onDrained?.();
      }
    };
    const lead = this.next === 0 ? this.leadS : this.gapS;
    const t = Math.max(this.ctx.currentTime + lead, this.next);
    src.start(t);
    this.next = t + buf.duration;
  }

  /**
   * The listener cut in: drop the rest of this turn immediately. `onended` is
   * detached first — otherwise stopping would run the drain path and report a
   * turn as PLAYED that they deliberately never heard.
   */
  stop() {
    for (const src of this.sources) {
      src.onended = null;
      try {
        src.stop();
      } catch {
        /* already finished */
      }
    }
    this.sources.clear();
    this.live = 0;
    this.next = 0;
    this.onPlaying?.(false);
  }

  close() {
    void this.ctx.close();
  }
}

export interface Mic {
  stop: () => void;
  /** Swap the level meter callback, or pass null to stop computing RMS. */
  onLevel: (cb: ((rms: number) => void) | null) => void;
}

/**
 * Open the microphone and stream 16 kHz mono PCM16 chunks to `sink`.
 *
 * Echo cancellation is on, but it is not what protects against the engine
 * hearing itself — the rooms gate the mic on real playback for that.
 */
export async function startMic(
  sink: (pcm16: ArrayBuffer) => void,
  onLevel?: (rms: number) => void,
): Promise<Mic> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(
    URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" })),
  );
  const src = ctx.createMediaStreamSource(stream);
  const tap = new AudioWorkletNode(ctx, "speak-tap");
  src.connect(tap);

  const ratio = ctx.sampleRate / IN_RATE; // e.g. 48000/16000 = 3
  let frac = 0; // fractional read cursor carried across chunks
  let levelCb: ((rms: number) => void) | null = onLevel ?? null;

  tap.port.onmessage = (e: MessageEvent<Float32Array>) => {
    const input = e.data;
    if (levelCb) {
      let s = 0;
      for (let i = 0; i < input.length; i++) s += input[i] * input[i];
      levelCb(Math.sqrt(s / input.length));
    }
    // linear-resample to 16 kHz
    const out: number[] = [];
    for (; frac < input.length; frac += ratio) {
      const i = Math.floor(frac);
      const a = input[i] ?? 0;
      const b = input[i + 1] ?? a;
      out.push(a + (b - a) * (frac - i));
    }
    frac -= input.length;
    const pcm = new Int16Array(out.length);
    for (let i = 0; i < out.length; i++) {
      const v = Math.max(-1, Math.min(1, out[i]));
      pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    if (pcm.length) sink(pcm.buffer);
  };

  return {
    onLevel: (cb) => {
      levelCb = cb;
    },
    stop: () => {
      tap.port.onmessage = null;
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}

/**
 * Ask for permission BEFORE reserving anything. A denied microphone should
 * never leave a limited session sitting live on the server.
 */
export async function checkMicAccess(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "This browser cannot access a microphone. Try Chrome, Safari, or Edge over HTTPS.",
    );
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

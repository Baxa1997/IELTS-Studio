// @vitest-environment jsdom

/**
 * The first component test in the codebase.
 *
 * It exists for a specific reason rather than for coverage: the six timers this
 * one replaces all counted with `setInterval` and a decrementing number, which
 * meant a throttled or backgrounded tab handed the candidate free time. The
 * whole point of the replacement is that it derives from the wall clock, so that
 * is what these assertions pin down. If someone ever "simplifies" it back to a
 * decrementing counter, the fake-clock test below fails immediately.
 */

import { render, screen, act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatClock, secondsLeft, Timer } from "./timer";

afterEach(cleanup);

describe("formatClock", () => {
  it("pads the seconds and drops the hour until it is needed", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(3600)).toBe("1:00:00");
    expect(formatClock(3725)).toBe("1:02:05");
  });

  it("never renders a negative clock", () => {
    // The reading paper's own duration is 3600s; an overrun must read 0:00, not
    // "-0:01", which is what a raw subtraction would print.
    expect(formatClock(-1)).toBe("0:00");
    expect(formatClock(-9999)).toBe("0:00");
  });
});

describe("secondsLeft", () => {
  it("measures against the deadline, not a tick count", () => {
    const now = 1_000_000;
    expect(secondsLeft(now + 60_000, now)).toBe(60);
    expect(secondsLeft(now + 1_500, now)).toBe(2); // rounds up: 1.5s left is still "2"
    expect(secondsLeft(now, now)).toBe(0);
  });

  it("floors at zero once the deadline has passed", () => {
    const now = 1_000_000;
    expect(secondsLeft(now - 30_000, now)).toBe(0);
  });
});

describe("<Timer>", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders the starting time", () => {
    render(<Timer seconds={90} />);
    expect(screen.getByRole("timer")).toHaveTextContent("1:30");
  });

  it("counts down from the wall clock", () => {
    render(<Timer seconds={90} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("1:20");
  });

  /**
   * The regression this component exists for.
   *
   * A backgrounded tab gets its interval throttled, so only a couple of ticks
   * fire across a real minute. A counter that decrements per tick would show
   * ~1:28 here and hand the candidate 58 seconds it should not have. Deriving
   * from the clock, the display is correct however few times it refreshed.
   */
  it("does not give away time when ticks are throttled", () => {
    render(<Timer seconds={90} />);
    act(() => {
      // 60s of wall clock, but only two timer callbacks land.
      vi.setSystemTime(Date.now() + 60_000);
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("0:30");
  });

  it("fires onExpire exactly once, and stays at zero", () => {
    const onExpire = vi.fn();
    render(<Timer seconds={2} onExpire={onExpire} />);

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("timer")).toHaveTextContent("0:00");

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("timer")).toHaveTextContent("0:00");
  });

  it("keeps counting when the parent re-renders with a new callback identity", () => {
    // Callers pass an inline arrow, so `onExpire` is a new function every render.
    // If it were an effect dependency the interval would restart and the deadline
    // would slide forward — the other way these timers leaked free minutes.
    const { rerender } = render(<Timer seconds={60} onExpire={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    rerender(<Timer seconds={60} onExpire={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("0:39");
  });

  /**
   * A render budget, not a nicety.
   *
   * The clock is sampled every 250 ms so the seconds digit cannot lag, but the
   * display only changes once a second — and this component sits inside exam
   * runners whose render-prop draws real chrome. Without the ref gate in `tick`
   * this measured 19 renders per 10 s (React still costs you a pass before it
   * bails out of an unchanged `setState`), against the 10 the old interval-based
   * timers used. Anyone tightening the sample rate should see this fail first.
   */
  it("renders once per changed second, not once per sample", () => {
    let renders = 0;
    render(
      <Timer seconds={600}>
        {(text) => {
          renders++;
          return <span>{text}</span>;
        }}
      </Timer>,
    );
    const initial = renders;
    // 40 separate 250 ms samples, each flushed on its own — the real-world shape.
    for (let i = 0; i < 40; i++) {
      act(() => {
        vi.advanceTimersByTime(250);
      });
    }
    expect(renders - initial).toBe(10);
  });

  it("hands the render-prop both the text and the raw seconds", () => {
    render(
      <Timer seconds={125}>
        {(text, left) => <span data-testid="custom">{`${text}|${left}`}</span>}
      </Timer>,
    );
    expect(screen.getByTestId("custom")).toHaveTextContent("2:05|125");
  });

  it("announces only once time is up", () => {
    const { rerender } = render(<Timer seconds={3} />);
    expect(screen.getByRole("timer")).toHaveAttribute("aria-live", "off");
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    rerender(<Timer seconds={3} />);
    expect(screen.getByRole("timer")).toHaveAttribute("aria-live", "assertive");
  });
});

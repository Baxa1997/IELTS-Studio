"use client";

import React from "react";

import { CoachScreen } from "./demo-coach";
import { Frame, Stage } from "./demo-kit";
import { ListeningScreen } from "./demo-listening";
import { ProgressScreen } from "./demo-progress";
import { ReadingScreen } from "./demo-reading";
import { SpeakingScreen } from "./demo-speaking";
import { WritingFeedbackScreen } from "./demo-writing-feedback";
import { WritingStudioScreen } from "./demo-writing-studio";

/**
 * Live, coded replicas of the real product screens — rendered with the SAME
 * design tokens, fonts and layouts as the app itself (writing feedback, writing
 * studio, reading, listening, coach, dashboard), filled with representative
 * sample data. Each screen is laid out at a fixed "design size" and scaled to
 * fit its container by <Stage>, so the demo shows the actual UI (crisp at any
 * width) instead of uploaded screenshots.
 *
 * These are static, non-interactive replicas — no API calls, no data, no
 * "use client" behaviour beyond the resize-to-fit scaler — safe to render on a
 * public marketing page. Sample bands are deliberately conservative (a real 6.5,
 * never inflated), matching the grader's philosophy.
 */
// ============================================================================
// registry
// ============================================================================

export const SCREENS: Record<string, React.ReactNode> = {
  "writing-feedback": <WritingFeedbackScreen />,
  "writing-studio": <WritingStudioScreen />,
  reading: <ReadingScreen />,
  listening: <ListeningScreen />,
  speaking: <SpeakingScreen />,
  coach: <CoachScreen />,
  progress: <ProgressScreen />,
};

/** A screen wrapped in browser chrome + resize-to-fit scaler — the unit both the
 *  tabbed demo and the reports strip render. */
export function DemoScreen({ slug, w, h }: { slug: string; w?: number; h?: number }) {
  return (
    <Frame>
      <Stage w={w} h={h}>
        {SCREENS[slug] ?? null}
      </Stage>
    </Frame>
  );
}

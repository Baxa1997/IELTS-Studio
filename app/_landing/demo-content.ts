// Copy for the product demo shown on the landing page and /demo. The screens
// themselves are LIVE coded replicas of the real product UI (see
// `demo-screens.tsx`), keyed by `slug` — there are no screenshots to upload.
// The report proof-strip lives in `demo-screens.tsx` too (REPORT_CARDS).

export type DemoTab = {
  /** Must match a key in `SCREENS` (demo-screens.tsx) and the deep-link hash. */
  slug: string;
  label: string;
  title: string;
  blurb: string;
};

export const DEMO_TABS: DemoTab[] = [
  {
    slug: "writing-feedback",
    label: "Writing feedback",
    title: "Examiner-style Writing feedback",
    blurb:
      "Every essay is graded criterion by criterion — Task Response, Coherence, Lexis, Grammar — with evidence quoted from your own sentences, what caps each band, and the exact fix.",
  },
  {
    slug: "writing-studio",
    label: "Writing studio",
    title: "A real exam writing room",
    blurb:
      "Task 1 and Task 2 prompts generated fresh every time, an exam timer, autosave, and resubmission — revise the same essay and watch the band move.",
  },
  {
    slug: "reading",
    label: "Reading test",
    title: "Cambridge-style Reading, generated fresh",
    blurb:
      "Full passages in the authentic layout with every real question type. After grading, every wrong answer explains why the trap worked.",
  },
  {
    slug: "listening",
    label: "Listening test",
    title: "Full Listening tests with original audio",
    blurb:
      "Multi-voice recordings across six difficulty levels — full four-section tests or quick practices, with transcripts and per-answer explanations.",
  },
  {
    slug: "speaking",
    label: "Speaking mock",
    title: "A full 3-part mock with a live examiner",
    blurb:
      "Talk to an AI examiner through all three parts — interview, the cue-card long turn with prep time, then the discussion. Scored on the four official criteria, with your own words quoted back.",
  },
  {
    slug: "coach",
    label: "Study coach",
    title: "A coach that knows your history",
    blurb:
      "The study coach reads your past attempts — every band, every weak criterion — and tells you what to practice next and why.",
  },
  {
    slug: "progress",
    label: "Progress & stats",
    title: "Your band, tracked honestly",
    blurb:
      "Current band versus target, your weakest criterion, and progress over time — a conservative estimate you can trust on exam day.",
  },
];

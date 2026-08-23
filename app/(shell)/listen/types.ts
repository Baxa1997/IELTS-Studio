/**
 * The listening view models — what the engine sends the browser.
 *
 * These mirror the engine's render views. They are types only, so importing
 * this module costs nothing at runtime and every part of the listening screen
 * can share one definition of a segment, a group and a grade.
 */

// ---- Types (mirror the engine render views) --------------------------------

export type AudioSeg = {
  kind: "audio";
  url: string;
  path: string;
  label: string;
  seconds?: number;
  part?: number;
};
export type PauseSeg = { kind: "pause"; seconds: number; label: string; part?: number };
export type Segment = AudioSeg | PauseSeg;

export type FormRow = { label: string; template: string; section: string | null };
export type NoteLine = { template: string; sub: boolean };
export type NoteSection = { heading: string; lines: NoteLine[] };
/** Completion grid (P1/P4 table variant): rows carry `{n}` gaps in cells. */
export type TableView = { title: string; word_limit: string; columns: string[]; rows: string[][] };
/** P3 flow-chart variant: ordered steps with `{n}` gaps filled from a letter bank. */
export type FlowChartView = { title: string; steps: string[]; options: Record<string, string> };

export type ClusterView = { questions: number[]; stem: string; options: Record<string, string> };
export type MatchingView = {
  heading: string;
  items: { q: number; label: string }[];
  options: Record<string, string>;
};
export type McqView = { q: number; stem: string; options: Record<string, string> };

/** P2 map/plan labelling: an abstract map drawn from geometry + a list of
 *  places to locate (each answered with a site letter). Answer-free by design —
 *  the walk/answers never reach the client. */
export type MapFeature =
  | { kind: "compass"; at: [number, number] }
  | { kind: "marker"; at: [number, number]; label?: string }
  | {
      kind: "landmark";
      at: [number, number];
      w?: number;
      h?: number;
      label: string;
      shape?: "building" | "board";
    }
  | { kind: "trees"; at: [number, number]; w?: number; h?: number; label?: string }
  | { kind: "site"; at: [number, number]; w?: number; h?: number; letter: string }
  | { kind: "wall"; points: [number, number][]; label?: string }
  | { kind: "road" | "river" | "path"; points: [number, number][]; label?: string; width?: number };
export type MapView = {
  title: string;
  grid: { w: number; h: number };
  features: MapFeature[];
  letters: string[];
  items: { q: number; label: string }[];
};

/** v2 group: one question block within a part. The payload shape depends on
 *  `type` (reshaped into the existing panel views by GroupPanels). */
export type GroupType =
  | "form"
  | "notes"
  | "table"
  | "sentence"
  | "mc_single"
  | "mc_two"
  | "matching"
  | "flow_chart"
  | "map";
export type GroupView = {
  type: GroupType;
  questions: number[];
  instruction: string;
  word_limit?: string;
  payload: Record<string, unknown>;
};

/** One part's question material (also the shape of a single-part practice). */
export type PartView = {
  part: number;
  topic: string;
  narrator_intro: string;
  variant?: string;
  /** v2 (content.version >= 2): question material as ordered groups. When
   *  present, GroupPanels renders it; the flat v1 fields below are absent. */
  version?: number;
  layout?: string;
  groups?: GroupView[];
  form?: { title: string; word_limit: string; rows: FormRow[] };
  notes?: { title: string; word_limit: string; sections: NoteSection[] };
  table?: TableView;
  flow_chart?: FlowChartView;
  clusters?: ClusterView[];
  matching?: MatchingView;
  mcqs?: McqView[];
  context?: string;
};

export type RenderView = PartView & {
  id: string;
  difficulty?: number;
  audio: Segment[];
  kind?: "test";
  parts?: PartView[]; // full test: all four parts' questions
};

export type QResult = {
  q: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  kind: string;
  trap: string | null;
};
export type Grade = {
  part: number;
  score: number;
  max_score: number;
  results: QResult[];
  transcript: { speaker: string; text: string }[];
  kind?: "test";
  band?: number;
  parts?: { part: number; score: number; max_score: number }[];
  /** Stored attempt id — links to the full feedback page /listen/results/[id]. */
  attempt_id?: string | null;
  topic?: string;
};

export type LibraryItem = {
  id: string;
  part: number;
  topic: string;
  difficulty: number;
  variant?: string;
  /** v2 (group-based) items carry a layout id (drives the type tags). */
  layout?: string;
  /** content schema version — v1 items omit it; v2 (group-based) items send >= 2. */
  version?: number;
  unlocked: boolean;
  locked: boolean;
  best_score: number | null;
};
export type Catalogue = {
  items: LibraryItem[];
  plan_paid: boolean;
  free_used: number;
  free_limit: number;
};

export type MineItem = {
  id: string;
  part: number;
  topic: string;
  difficulty: number;
  variant?: string;
  layout?: string;
  version?: number;
  created_at: string | null;
};

/** Which grade endpoint an open practice belongs to. */
export type Source = "library" | "mine";

/** Where the segment player is in its run. */
export type PlayerPhase = "idle" | "running" | "finished";

/** What a question panel needs in order to render and record one answer:
 *  the answer map, the results once graded, the flag set, and the focus
 *  cursor the runner uses to scroll a question into view. */
export type QCtx = {
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  results: Map<number, QResult> | null;
  flags: Set<number>;
  toggleFlag: (n: number) => void;
  focusedQ: number;
  setFocus: (n: number) => void;
};

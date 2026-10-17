

/** Question-type tags per part format (the quick-practice cards show these
 *  instead of part numbers — a practice is just "a practice"). A part rotates
 *  through variant layouts, so the tags follow the item's stored `variant`. */
const QTYPE_TAGS: Record<number, string[]> = {
  1: ["Form completion"],
  2: ["Multiple choice", "Matching"],
  3: ["Multiple choice", "Matching"],
  4: ["Note completion"],
};
const QTYPE_TAGS_BY_VARIANT: Record<string, string[]> = {
  table: ["Table completion"],
  flowchart: ["Multiple choice", "Flow-chart completion"],
};
/** v2 (group-based) items carry a `layout` id instead of a `variant`; map it to
 *  the question-type tags so a map / flow-chart / sentence item is identifiable. */
const QTYPE_TAGS_BY_LAYOUT: Record<string, string[]> = {
  form10: ["Form completion"],
  notes10: ["Note completion"],
  table10: ["Table completion"],
  sentence10: ["Sentence completion"],
  "table6-notes4": ["Table completion", "Note completion"],
  "mcq6-map4": ["Multiple choice", "Map labelling"],
  "match5-map5": ["Matching", "Map labelling"],
  "two4-map6": ["Multiple choice", "Map labelling"],
  "mcq4-match6": ["Multiple choice", "Matching"],
  "two4-match6": ["Multiple choice", "Matching"],
  "mcq6-match4": ["Multiple choice", "Matching"],
  "match6-mcq4": ["Matching", "Multiple choice"],
  "match5-mcq5": ["Matching", "Multiple choice"],
  "mcq3-match7": ["Multiple choice", "Matching"],
  "mcq5-flow5": ["Multiple choice", "Flow-chart completion"],
  "two4-mcq6": ["Multiple choice"],
  "two6-mcq4": ["Multiple choice"],
  "mcq6-two4": ["Multiple choice"],
};
export function typeTagsFor(part: number, variant?: string, layout?: string): string[] {
  if (layout && QTYPE_TAGS_BY_LAYOUT[layout]) return QTYPE_TAGS_BY_LAYOUT[layout];
  return (variant && QTYPE_TAGS_BY_VARIANT[variant]) || QTYPE_TAGS[part] || [];
}

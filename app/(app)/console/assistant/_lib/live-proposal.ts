/**
 * Which proposal in a thread is still armed.
 *
 * ⚠️ THIS DECIDES WHETHER A CLASS GETS CREATED TWICE.
 *
 * Every proposal card used to own its own state and know nothing about the
 * others, so a thread accumulated live Confirm buttons. The way it actually
 * bites is the ordinary way people use the assistant: you ask for a class, it
 * drafts one, you say "no, Monday and Wednesday, and put Nodira on it" — and
 * the model redrafts THE SAME ACTION with more arguments. Now there are two
 * buttons, both armed, one of them carrying the details you just corrected.
 * Pressing the wrong one is silent and irreversible from here.
 *
 * The rule: the newest turn carrying proposals is live, and everything before
 * it is superseded. Not "everything before the one you pressed" — a draft is
 * dead the moment a better one exists, whether or not you ever touch either.
 *
 * A card that ALREADY RAN is a separate case and is not this function's
 * business: it keeps its own "Done" and never returns to a button.
 *
 * Pure and separate from the component so it can be tested. jsdom would render
 * the buttons perfectly happily either way — the bug is in which of them does
 * something.
 */
export function liveProposalTurn(turns: { proposals?: unknown[] }[]): number {
  return turns.reduce((last, t, i) => ((t.proposals ?? []).length > 0 ? i : last), -1);
}

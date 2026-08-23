import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { ACTIONS, loadCentreSnapshot } from "@/lib/console/assistant";
import { listThreads, loadThread } from "@/lib/console/assistant-thread";
import { staffLinkStatus } from "@/lib/telegram/staff";

import { AssistantChat } from "./chat";

export const dynamic = "force-dynamic";

/**
 * The assistant, as a command centre.
 *
 * A PAGE, NOT A WIDGET IN THE CORNER. It is reached from the top of the rail
 * and from every page's "Ask AI", and both land here — so there is one place to
 * come back to rather than a panel whose contents depend on which screen you
 * opened it from. The history rail is what makes coming back worth anything.
 */
/**
 * What to offer somebody before they have typed anything.
 *
 * These are not decoration — they are how a person learns what the assistant is
 * FOR, so every line has to be a question their role can actually have answered.
 * The boundary they follow is the same one `loadCentreSnapshot` enforces:
 *
 *   TEACHER — their own classes, their own marking queue, their own students'
 *     progress, and setting their own homework. They do not see money, payroll,
 *     other teachers' groups, or centre-wide totals, so nothing here asks for
 *     any of that. A teacher's day is: what came back, who is behind, who has
 *     stopped turning up, what to set next.
 *
 *   ADMINISTRATOR — the front desk. People and attendance across the centre,
 *     plus money coming IN. No payroll, no what-the-centre-is-worth.
 *
 *   CENTER_ADMIN — the owner. Everything, including what is owed and what the
 *     month looked like.
 *
 * The empty-centre openers are role-blind on purpose: with no classes yet, the
 * only useful question anyone has is "how do I start".
 */
export function openersFor(role: string, hasClasses: boolean): string[] {
  if (!hasClasses) return ["What should I set up first?", "How do students get their logins?"];

  if (role === "teacher") {
    return [
      "What's waiting for me to mark?",
      "Which of my students are falling behind?",
      "Who has missed the most lessons this month?",
    ];
  }

  if (role === "administrator") {
    return [
      "Which classes still can't collect their logins?",
      "Which registers haven't been marked this week?",
      "Which classes have no teacher assigned?",
    ];
  }

  // The owner — the only role that can be told about money.
  return [
    "Who owes money right now?",
    "Which classes still can't collect their logins?",
    "Which classes have no teacher assigned?",
  ];
}

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { thread: wanted } = await searchParams;
  const [snapshot, thread, threads, telegram] = await Promise.all([
    loadCentreSnapshot(profile),
    loadThread(profile, wanted),
    listThreads(profile),
    staffLinkStatus(profile),
  ]);

  // The openers are built from the caller's OWN snapshot AND their role, so they
  // are questions this person can actually get an answer to. Two failure modes
  // to avoid, and they pull in opposite directions: an empty console offering
  // "which class is behind?" teaches people the assistant is decorative, and a
  // TEACHER offered "who owes money?" gets a refusal, which teaches them the
  // same thing faster.
  const suggestions = openersFor(profile.role, snapshot.groupIds.size > 0);

  // The launcher offers exactly what this person may run — the same list the
  // model is given, so the rail can never advertise something the assistant
  // would then refuse.
  const capabilities = ACTIONS.filter((a) => a.roles.includes(profile.role))
    .map((a) => ({ id: a.id, ...LAUNCHER[a.id] }))
    .filter((c) => c.label != null);

  return (
    <AssistantChat
      suggestions={suggestions}
      centreName={snapshot.centreName}
      initialTurns={thread.turns}
      threads={threads}
      activeThread={thread.threadId}
      capabilities={capabilities}
      telegramConnected={telegram.connected}
      botUsername={process.env.TELEGRAM_BOT_USERNAME ?? null}
    />
  );
}

/**
 * The launcher.
 *
 * NAMED FOR THE MENU, NOT FOR THE BUTTON. The action's `verb` is what a confirm
 * button says once you already know what you are confirming — "Add the
 * student", "Assign it", "Send it". As a list of things you might do it reads
 * as nonsense, and a column of them all starting with the same letter is worse
 * than no icons at all.
 *
 * The prompt is a half-written sentence, deliberately: it lands in the box with
 * the cursor after it, so the next thing you type is the only thing missing.
 * A bare verb would leave somebody staring at a box wondering what to add.
 */
const LAUNCHER: Record<string, { label: string; glyph: string; tint: string; prompt: string }> = {
  create_group: {
    label: "Create a class",
    glyph: "C",
    tint: "indigo",
    prompt: "Create a new class called ",
  },
  add_student: { label: "Add a student", glyph: "S", tint: "blue", prompt: "Add a student to " },
  add_students_bulk: {
    label: "Import a roster",
    glyph: "I",
    tint: "blue",
    prompt: "Import the attached students into ",
  },
  assign_practice: {
    label: "Assign practice",
    glyph: "P",
    tint: "green",
    prompt: "Assign writing practice to ",
  },
  invite_class_telegram: {
    label: "Invite to Telegram",
    glyph: "T",
    tint: "blue",
    prompt: "Invite the class to Telegram: ",
  },
  send_announcement: {
    label: "Send an announcement",
    glyph: "A",
    tint: "amber",
    prompt: "Send an announcement to ",
  },
  move_student: {
    label: "Move a student",
    glyph: "M",
    tint: "slate",
    prompt: "Move a student to another class",
  },
  mark_student_left: {
    label: "Mark someone as left",
    glyph: "L",
    tint: "slate",
    prompt: "Mark a student as left",
  },
  assign_teacher: {
    label: "Change who teaches",
    glyph: "W",
    tint: "amber",
    prompt: "Put a teacher in charge of ",
  },
  add_teacher: {
    label: "Add a teacher",
    glyph: "H",
    tint: "pink",
    prompt: "Add a teacher called ",
  },
  close_group: { label: "Close a class", glyph: "X", tint: "slate", prompt: "Close the class " },
  reopen_group: { label: "Reopen a class", glyph: "R", tint: "green", prompt: "Reopen the class " },
};

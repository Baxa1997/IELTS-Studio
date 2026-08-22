import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { ACTIONS, loadCentreSnapshot } from "@/lib/console/assistant";
import { loadRecentActions } from "@/lib/console/assistant-actions";
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
export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { thread: wanted } = await searchParams;
  const [snapshot, thread, threads, telegram, recent] = await Promise.all([
    loadCentreSnapshot(profile),
    loadThread(profile, wanted),
    listThreads(profile),
    staffLinkStatus(profile),
    loadRecentActions(),
  ]);

  // The openers are built from the caller's OWN snapshot, so they are questions
  // this centre can actually answer — an empty console offering "which class is
  // behind?" teaches people the assistant is decorative.
  const hasClasses = snapshot.groupIds.size > 0;
  const suggestions = hasClasses
    ? [
        "Which classes can't collect their logins yet?",
        "What's waiting for me to mark?",
        "Which class has the most students missing a phone number?",
      ]
    : ["What should I set up first?", "How do students get their logins?"];

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
      recent={recent}
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
  create_group: { label: "Create a class", glyph: "C", tint: "indigo", prompt: "Create a new class called " },
  add_student: { label: "Add a student", glyph: "S", tint: "blue", prompt: "Add a student to " },
  add_students_bulk: { label: "Import a roster", glyph: "I", tint: "blue", prompt: "Import the attached students into " },
  assign_practice: { label: "Assign practice", glyph: "P", tint: "green", prompt: "Assign writing practice to " },
  invite_class_telegram: { label: "Invite to Telegram", glyph: "T", tint: "blue", prompt: "Invite the class to Telegram: " },
  send_announcement: { label: "Send an announcement", glyph: "A", tint: "amber", prompt: "Send an announcement to " },
  move_student: { label: "Move a student", glyph: "M", tint: "slate", prompt: "Move a student to another class" },
  mark_student_left: { label: "Mark someone as left", glyph: "L", tint: "slate", prompt: "Mark a student as left" },
  assign_teacher: { label: "Change who teaches", glyph: "W", tint: "amber", prompt: "Put a teacher in charge of " },
  add_teacher: { label: "Add a teacher", glyph: "H", tint: "pink", prompt: "Add a teacher called " },
  close_group: { label: "Close a class", glyph: "X", tint: "slate", prompt: "Close the class " },
  reopen_group: { label: "Reopen a class", glyph: "R", tint: "green", prompt: "Reopen the class " },
};

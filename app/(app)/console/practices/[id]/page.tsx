import { notFound, redirect } from "next/navigation";

import {
  INK,
  LINE,
  MUTED,
  PageHead,
  Panel,
  Pill,
  SANS,
  SERIF,
  TINT,
} from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadPractice } from "@/lib/console/practices";
import { TASK2_CATEGORY_LABELS, type Task2Category } from "@/lib/prompts/types";
import { createClient } from "@/lib/supabase/server";

import { AssignForm, PracticeStateActions } from "./practice-panels";

const STATE_PILL: Record<string, { label: string; tone: "neutral" | "good" | "warn" }> = {
  pending: { label: "Draft", tone: "warn" },
  approved: { label: "Published", tone: "good" },
  archived: { label: "Archived", tone: "neutral" },
  rejected: { label: "Rejected", tone: "neutral" },
};

/**
 * Read the prompt before a class does, then publish it and set it — the step
 * that used to not exist, because generating and assigning were one click.
 */
export default async function PracticePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const practice = await loadPractice(id);
  if (!practice) notFound();

  // RLS returns only the groups this caller manages, which is exactly the set
  // they may assign to.
  const supabase = await createClient();
  const { data: groupRows } = await supabase.from("groups").select("id, name").order("name");
  const groupIds = ((groupRows ?? []) as { id: string }[]).map((g) => g.id);
  const { data: memberRows } = groupIds.length
    ? await supabase.from("group_members").select("group_id").in("group_id", groupIds)
    : { data: [] };

  const memberCount = new Map<string, number>();
  for (const m of (memberRows ?? []) as { group_id: string }[]) {
    memberCount.set(m.group_id, (memberCount.get(m.group_id) ?? 0) + 1);
  }
  const groups = ((groupRows ?? []) as { id: string; name: string }[]).map((g) => ({
    id: g.id,
    name: g.name,
    members: memberCount.get(g.id) ?? 0,
  }));

  const state = STATE_PILL[practice.status] ?? STATE_PILL.pending;
  const meta = [
    practice.category ? TASK2_CATEGORY_LABELS[practice.category as Task2Category] : "Task 2",
    practice.topicFamily,
    practice.difficulty ? `pitched at band ${practice.difficulty}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <PageHead
        back={{ href: "/console/practices", label: "Practice library" }}
        title="Task 2 prompt"
        subtitle={meta}
      />

      <Panel
        title="What the student will see"
        description={
          practice.status === "pending"
            ? "Nobody can be set this until you publish it."
            : "This is the wording your class answers."
        }
      >
        <div style={{ marginBottom: 12 }}>
          <Pill tone={state.tone}>{state.label}</Pill>
          {practice.assignedGroups.length > 0 ? (
            <span style={{ marginLeft: 8, fontFamily: SANS, fontSize: 12.5, color: MUTED }}>
              set to {practice.assignedGroups.join(", ")}
            </span>
          ) : null}
        </div>

        <div
          style={{
            background: TINT,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: "18px 20px",
            fontFamily: SERIF,
            fontSize: 17,
            lineHeight: 1.55,
            color: INK,
            whiteSpace: "pre-wrap",
          }}
        >
          {practice.promptText}
        </div>

        <p style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, marginTop: 12 }}>
          Write at least 250 words in about 40 minutes — the standard Task 2 instruction the runner
          shows alongside this.
        </p>
      </Panel>

      <Panel
        title="This practice"
        description={
          practice.assignedGroups.length > 0
            ? "Already answered by students, so the wording is frozen. Duplicate it to make a version you can change."
            : "Publish it when the wording is right."
        }
      >
        <PracticeStateActions promptId={practice.id} status={practice.status} />
      </Panel>

      {practice.status !== "archived" ? (
        <Panel
          title="Set it to a class"
          description="Everyone in the group gets this exact prompt, which is what makes their bands comparable. Assigning publishes it if it's still a draft."
        >
          <AssignForm promptId={practice.id} groups={groups} />
        </Panel>
      ) : null}
    </div>
  );
}

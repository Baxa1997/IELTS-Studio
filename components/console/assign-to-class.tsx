import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { AssignToClassPanel } from "./assign-to-class-panel";

/**
 * The one thing a teacher gets on top of the learner's practice UI: a way to set
 * what's on screen to a class.
 *
 * Everything else about /write, /read and /listen is deliberately identical for
 * staff and students — a teacher previews a prompt by doing exactly what the
 * student will do, in the same runner, rather than through a console mock-up of
 * it. So this renders as a small floating control and touches nothing else on
 * the page.
 *
 * Only a teacher sees it. A center_admin runs people, billing and reports; the
 * teaching decisions belong to whoever runs the class.
 */
export async function AssignToClass({
  kind,
  contentId,
}: {
  kind: "writing" | "reading" | "listening";
  contentId: string;
}) {
  const session = await getSession();
  const profile = session?.profile;
  if (!profile || profile.role !== "teacher") return null;

  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .eq("teacher_id", profile.id)
    .order("name");

  const rows = (groups ?? []) as { id: string; name: string }[];
  if (rows.length === 0) return null; // no classes yet — nothing to assign to

  return <AssignToClassPanel kind={kind} contentId={contentId} groups={rows} />;
}

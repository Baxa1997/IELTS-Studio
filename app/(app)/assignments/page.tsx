import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadStudentAssignments } from "@/lib/assignments/student";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { cn } from "@/lib/utils";

/** Practice set by the student's teacher. Individual learners (no group) never
 *  see this page — their nav doesn't link it and it renders an empty state. */
export default async function AssignmentsPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));

  const assignments = await loadStudentAssignments(profile.id);
  const todo = assignments.filter((a) => !a.done);
  const done = assignments.filter((a) => a.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">Practice set by your teacher.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">To do ({todo.length})</CardTitle>
          <CardDescription>Your teacher sees your band and feedback when you finish.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {todo.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{a.title}</span>
                  <span className="text-muted-foreground block text-xs capitalize">
                    {a.kind} · {a.groupName}
                    {a.dueAt ? ` · due ${new Date(a.dueAt).toLocaleDateString()}` : ""}
                  </span>
                  {a.instructions ? (
                    <span className="mt-1 block text-xs">{a.instructions}</span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {a.overdue ? (
                    <span className="text-destructive text-xs font-medium">Overdue</span>
                  ) : null}
                  <Link href={a.href} className={cn(buttonVariants({ size: "sm" }))}>
                    Start
                  </Link>
                </span>
              </li>
            ))}
            {todo.length === 0 ? (
              <li className="text-muted-foreground flex items-center gap-2 py-3">
                <ClipboardList className="size-4" />
                {assignments.length === 0
                  ? "No assignments yet. Practice freely from Writing, Reading, Listening or Speaking."
                  : "All caught up — nice work."}
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      {done.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed ({done.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {done.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-2">
                  <span className="min-w-0">
                    <span className="block truncate">{a.title}</span>
                    <span className="text-muted-foreground block text-xs capitalize">
                      {a.kind} · {a.groupName}
                    </span>
                  </span>
                  <Link
                    href="/activities"
                    className="text-primary shrink-0 text-sm font-medium hover:underline"
                  >
                    View feedback
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

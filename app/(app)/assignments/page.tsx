import Link from "next/link";
import { redirect } from "next/navigation";

import {
  EmptyRow,
  FAINT,
  INDIGO,
  List,
  PageHead,
  Panel,
  Pill,
  PrimaryLink,
  Row,
  RowText,
  SANS,
} from "@/components/console/page-ui";
import { loadStudentAssignments } from "@/lib/assignments/student";
import { requireOrgUser, roleHome } from "@/lib/auth";

/** Practice set by the student's teacher. Individual learners have no group, so
 *  their nav doesn't link here and this renders an empty state. */
export default async function AssignmentsPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));

  const assignments = await loadStudentAssignments(profile.id);
  const todo = assignments.filter((a) => !a.done);
  const done = assignments.filter((a) => a.done);

  return (
    <div>
      <PageHead
        eyebrow="Homework"
        title="Assignments"
        subtitle="Practice set by your teacher. They see your band and feedback when you finish."
      />

      <Panel title={`To do (${todo.length})`}>
        <List>
          {todo.map((a, i) => (
            <Row key={a.id} first={i === 0}>
              <RowText
                title={
                  <>
                    {a.title}
                    {a.overdue ? (
                      <span style={{ marginLeft: 8 }}>
                        <Pill tone="bad">Overdue</Pill>
                      </span>
                    ) : null}
                  </>
                }
                meta={
                  <>
                    <span style={{ textTransform: "capitalize" }}>{a.kind}</span> · {a.groupName}
                    {a.dueAt ? ` · due ${new Date(a.dueAt).toLocaleDateString()}` : ""}
                    {a.instructions ? ` · ${a.instructions}` : ""}
                  </>
                }
              />
              <PrimaryLink href={a.href}>Start</PrimaryLink>
            </Row>
          ))}
          {todo.length === 0 ? (
            <EmptyRow>
              {assignments.length === 0
                ? "No assignments yet. Practice freely from Writing, Reading, Listening or Speaking."
                : "All caught up — nice work."}
            </EmptyRow>
          ) : null}
        </List>
      </Panel>

      {done.length > 0 ? (
        <Panel title={`Completed (${done.length})`}>
          <List>
            {done.map((a, i) => (
              <Row key={a.id} first={i === 0}>
                <RowText
                  title={a.title}
                  meta={
                    <>
                      <span style={{ textTransform: "capitalize" }}>{a.kind}</span> · {a.groupName}
                    </>
                  }
                />
                <Link
                  href="/activities"
                  style={{
                    flex: "none",
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: INDIGO,
                    textDecoration: "none",
                  }}
                >
                  View feedback
                </Link>
              </Row>
            ))}
          </List>
        </Panel>
      ) : null}

      <p style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, margin: "4px 0 0" }}>
        Homework doesn&apos;t replace your own practice — everything in the menu is still yours to
        use.
      </p>
    </div>
  );
}

import {
  EmptyRow,
  FAINT,
  List,
  PageHead,
  Panel,
  Pill,
  Row,
  RowLink,
  RowText,
  SANS,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { loadCenters } from "@/lib/admin/platform";
import { requireSuperAdmin } from "@/lib/auth";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function CentersPage() {
  await requireSuperAdmin();
  const centers = await loadCenters();

  const active = centers.filter((c) => c.status === "active");
  const totals = active.reduce(
    (acc, c) => ({
      teachers: acc.teachers + c.teachers,
      students: acc.students + c.students,
      groups: acc.groups + c.groups,
    }),
    { teachers: 0, students: 0, groups: 0 },
  );

  return (
    <div>
      <PageHead
        eyebrow="Platform"
        title="Education centers"
        subtitle="Every organization on the platform, and how much of it is actually being used."
      />

      <StatRow>
        <StatTile value={active.length} label="Active centers" tone="indigo" />
        <StatTile value={totals.teachers} label="Teachers" />
        <StatTile value={totals.groups} label="Groups" />
        <StatTile value={totals.students} label="Students" />
      </StatRow>

      <Panel
        title="All centers"
        description="Counts are live. Practice is the last 30 days, across all four skills."
      >
        <List>
          {centers.map((c, i) => (
            <Row key={c.id} first={i === 0}>
              <RowText
                title={
                  <>
                    {c.name}{" "}
                    <Pill
                      tone={
                        c.status === "active" ? "good" : c.status === "pending" ? "warn" : "bad"
                      }
                    >
                      {c.status}
                    </Pill>
                    {!c.billingEnforced ? (
                      <>
                        {" "}
                        <Pill tone="indigo">unmetered</Pill>
                      </>
                    ) : null}
                  </>
                }
                meta={
                  <>
                    {c.teachers} teacher{c.teachers === 1 ? "" : "s"} · {c.groups} group
                    {c.groups === 1 ? "" : "s"} · {c.students} student{c.students === 1 ? "" : "s"} ·{" "}
                    {c.practice30d} practice{c.practice30d === 1 ? "" : "s"} (30d)
                    {c.status === "pending" ? ` · applied ${dateFmt(c.createdAt)}` : ""}
                  </>
                }
              />
              <span
                style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}
              >
                <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT }}>{c.plan}</span>
                <RowLink href={`/admin/centers/${c.id}`}>Open</RowLink>
              </span>
            </Row>
          ))}
          {centers.length === 0 ? (
            <EmptyRow>
              No centers yet. They apply through the Organization tab on the sign-up page, and
              appear here for approval.
            </EmptyRow>
          ) : null}
        </List>
      </Panel>
    </div>
  );
}

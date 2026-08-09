import { redirect } from "next/navigation";

import {
  Card,
  CardHead,
  CardNote,
  Empty,
  FAINT,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  PageHead,
  SANS,
  SERIF,
  SOFT,
  Split,
  Stack,
  Table,
  TD,
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadStudents } from "@/lib/console/people";
import { createClient } from "@/lib/supabase/server";

import { IssueCertificateForm } from "./issue-form";

export const dynamic = "force-dynamic";

const COLS = "1.8fr 1.6fr .7fr 1fr 1fr";

const dateFmt = (s: string) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * Certificates issued on course completion, each carrying a verification code.
 *
 * Only a center_admin can issue one — it is the center's statement about a
 * learner, not an individual teacher's, and RLS enforces that as well as this
 * page does.
 */
export default async function CertificatesPage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");
  const isAdmin = profile.role === "center_admin";

  const supabase = await createClient();
  const [certRes, orgRes, students] = await Promise.all([
    supabase
      .from("certificates")
      .select("id, student_id, course, band, code, issued_on")
      .order("issued_on", { ascending: false })
      .limit(200),
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
    loadStudents({ role: profile.role, profileId: profile.id }),
  ]);

  const centerName = (orgRes.data?.name as string | null) ?? "Your center";
  const nameOf = new Map(students.map((s) => [s.id, s.name]));
  const certs = (certRes.data ?? []) as {
    id: string;
    student_id: string;
    course: string;
    band: number | null;
    code: string;
    issued_on: string;
  }[];

  const thisYear = new Date().getUTCFullYear();
  const issuedThisYear = certs.filter(
    (c) => new Date(`${c.issued_on}T00:00:00Z`).getUTCFullYear() === thisYear,
  ).length;
  const banded = certs.filter((c) => c.band != null);
  const avgBand = banded.length
    ? banded.reduce((n, c) => n + Number(c.band), 0) / banded.length
    : null;

  return (
    <div>
      <PageHead
        eyebrow="Recognition"
        title="Certificates"
        subtitle="Issued on course completion. Each one carries a verification code."
      />

      <KpiRow>
        <Kpi label="Issued" value={certs.length} sub="all time" />
        <Kpi label="This year" value={issuedThisYear} sub={String(thisYear)} />
        <Kpi
          label="Average band"
          value={avgBand?.toFixed(1) ?? "—"}
          sub={banded.length ? `${banded.length} carry a band` : "none carry a band yet"}
        />
        <Kpi label="Students eligible" value={students.length} sub="on the roll" />
      </KpiRow>

      <Split ratio="1.25fr .75fr">
        <Card flush>
          <CardHead
            title="Issued certificates"
            divided
            note="newest first"
          />
          <Table cols={COLS} minWidth={640}>
            <THead cols={COLS} labels={["Student", "Course", "Band", "Issued", "Code"]} />
            {certs.map((c) => (
              <TRow key={c.id} cols={COLS}>
                <TD tone="ink" weight={500}>
                  {nameOf.get(c.student_id) ?? "Former student"}
                </TD>
                <TD tone="body">{c.course}</TD>
                <TD tone="ink" weight={600}>
                  {c.band != null ? Number(c.band).toFixed(1) : "—"}
                </TD>
                <TD tone="soft">{dateFmt(c.issued_on)}</TD>
                <TD>
                  <span
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 11.5,
                      color: INDIGO,
                    }}
                  >
                    {c.code}
                  </span>
                </TD>
              </TRow>
            ))}
            {certs.length === 0 ? (
              <Empty>
                Nothing issued yet. A certificate records a course a student finished and the band
                they reached.
              </Empty>
            ) : null}
          </Table>
        </Card>

        <Stack>
          {isAdmin ? (
            <Card>
              <CardHead title="Issue a certificate" />
              <IssueCertificateForm
                students={students.map((s) => ({
                  id: s.id,
                  name: s.name,
                  group: s.groups[0]?.name ?? "",
                }))}
              />
            </Card>
          ) : null}

          <Card>
            <CardHead title="Template" />
            <CardNote>What the student receives. The code below is what verifies it.</CardNote>
            <div
              style={{
                border: "1px solid #E7E5DF",
                borderRadius: 12,
                padding: "26px 22px",
                background: "#FCFBF7",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 10.5,
                  letterSpacing: ".14em",
                  color: "#8B8999",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {centerName}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 21,
                  fontWeight: 700,
                  margin: "12px 0 6px",
                  color: INK,
                }}
              >
                Certificate of Completion
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: SOFT }}>awarded to</div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 17,
                  fontWeight: 700,
                  margin: "8px 0",
                  color: INDIGO,
                }}
              >
                {certs[0] ? (nameOf.get(certs[0].student_id) ?? "Student name") : "Student name"}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: SOFT, lineHeight: 1.6 }}>
                {certs[0]
                  ? `${certs[0].course}${certs[0].band != null ? ` · achieved Band ${Number(certs[0].band).toFixed(1)}` : ""}`
                  : "Course name · achieved Band 7.0"}
                <br />
                {certs[0]
                  ? dateFmt(certs[0].issued_on)
                  : new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </div>
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: "1px solid #E7E5DF",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 10.5,
                  color: FAINT,
                }}
              >
                Verify at engprogress.com/v/{certs[0]?.code ?? "XXXX-XXXX"}
              </div>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT, margin: "12px 0 0", lineHeight: 1.55 }}>
              Not affiliated with or endorsed by IELTS®. A certificate records this center&apos;s
              own course, never an official result.
            </p>
          </Card>
        </Stack>
      </Split>
    </div>
  );
}

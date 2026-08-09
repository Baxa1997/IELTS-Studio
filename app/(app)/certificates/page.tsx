import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";

const dateFmt = (s: string) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * The learner's own certificates.
 *
 * Staff issue these from /console/certificates; this is the other end of it —
 * the student seeing what they earned, with the code that proves it. RLS on
 * `certificates` already limits a student to `student_id = auth.uid()`, so this
 * needs no filter of its own beyond the query.
 */
export default async function StudentCertificatesPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console/certificates");

  const supabase = await createClient();
  const [certRes, orgRes] = await Promise.all([
    supabase
      .from("certificates")
      .select("id, course, band, code, issued_on")
      .eq("student_id", profile.id)
      .order("issued_on", { ascending: false }),
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
  ]);

  const certs = (certRes.data ?? []) as {
    id: string;
    course: string;
    band: number | null;
    code: string;
    issued_on: string;
  }[];
  const centerName = (orgRes.data?.name as string | null) ?? "Your center";

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: "clamp(26px,3.2vw,34px)",
          margin: 0,
          letterSpacing: "-.3px",
        }}
      >
        Certificates
      </h1>
      <p style={{ fontSize: 15, color: MUTED, margin: "6px 0 24px", lineHeight: 1.5 }}>
        Issued by {centerName} when you finish a course. Each one carries a code anyone can check.
      </p>

      {certs.length === 0 ? (
        <div
          style={{
            border: `1px dashed ${LINE}`,
            borderRadius: 16,
            padding: "34px 24px",
            textAlign: "center",
            color: FAINT,
            fontSize: 14.5,
            lineHeight: 1.6,
          }}
        >
          Nothing yet. When you complete a course, the certificate appears here.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: 14,
          }}
        >
          {certs.map((c) => (
            <article
              key={c.id}
              style={{
                border: `1px solid ${LINE}`,
                borderRadius: 16,
                background: "#FCFBF7",
                padding: "24px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: ".14em",
                  color: FAINT,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {centerName}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 20,
                  fontWeight: 600,
                  margin: "10px 0 4px",
                }}
              >
                Certificate of Completion
              </div>
              <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>
                {c.course}
                {c.band != null ? (
                  <>
                    <br />
                    <strong style={{ color: INK }}>Band {Number(c.band).toFixed(1)}</strong>
                  </>
                ) : null}
                <br />
                {dateFmt(c.issued_on)}
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: `1px solid ${LINE}`,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 12,
                  color: INDIGO,
                }}
              >
                {c.code}
              </div>
            </article>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: FAINT, margin: "24px 0 0", lineHeight: 1.6 }}>
        A certificate records a course at this center. It is not an official IELTS® result and is
        not affiliated with or endorsed by IELTS®.
      </p>
    </div>
  );
}

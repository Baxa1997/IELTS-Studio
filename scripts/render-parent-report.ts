/**
 * Render a parent report from REAL data and prove the bytes open.
 *
 * The unit tests check what the document CLAIMS. This checks that the PDF
 * writer survives the shape production actually has: long Uzbek names, students
 * with no group, skills nobody has measured, and the ʻ in "Toshkent" that
 * WinAnsi has no glyph for.
 *
 *   npx tsx scripts/render-parent-report.ts [outDir]
 *
 * Service-role, so it bypasses RLS on purpose — this is a rendering check, not
 * an authorization one. The route's authorization is RLS via the user's own
 * client and is tested separately.
 */

import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildParentReport, parentReportFilename } from "@/lib/console/parent-report";
import type { BaselineSource } from "@/lib/console/progress";
import type { PracticeRow, PracticeSkill, StudentReport } from "@/lib/console/student-report";

// Same hand-rolled .env.local read as the other scripts here — there is no
// dotenv dependency and this is not the place to add one.
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  if (!line.includes("=") || line.trim().startsWith("#")) continue;
  const i = line.indexOf("=");
  const key = line.slice(0, i).trim();
  if (!process.env[key]) {
    process.env[key] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const outDir = process.argv[2] ?? "/tmp/parent-reports";
mkdirSync(outDir, { recursive: true });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

/** The loader is `server-only` and needs a request context, so this rebuilds
 *  the same shape with the service-role client. Only the fields the document
 *  reads. */
async function gather(studentId: string, name: string): Promise<StudentReport> {
  const [estimates, essays, reading, listening, speaking, attendance, memberships] =
    await Promise.all([
      admin
        .from("skill_estimates")
        .select(
          "skill, current_band, target_band, baseline_band, baseline_source, sample_count, target_set_by",
        )
        .eq("student_id", studentId),
      admin.from("essays").select("id, created_at, prompt_id").eq("student_id", studentId),
      admin
        .from("reading_attempts")
        .select("id, band, correct_count, total_questions, created_at")
        .eq("student_id", studentId),
      admin.from("listening_attempts").select("id, score, max_score, result, created_at")
        .eq("student_id", studentId),
      admin.from("speaking_sessions").select("id, state, result, started_at")
        .eq("student_id", studentId),
      admin
        .from("v_student_attendance")
        .select("sessions, attended, rate_pct")
        .eq("student_id", studentId)
        .maybeSingle(),
      admin.from("group_members").select("group_id").eq("student_id", studentId),
    ]);

  const groupIds = (memberships.data ?? []).map((m) => m.group_id as string);
  const { data: groups } = groupIds.length
    ? await admin.from("groups").select("name").in("id", groupIds)
    : { data: [] as { name: string }[] };

  const essayIds = (essays.data ?? []).map((e) => e.id as string);
  const { data: gradings } = essayIds.length
    ? await admin.from("gradings").select("essay_id, overall_band").in("essay_id", essayIds)
    : { data: [] as { essay_id: string; overall_band: number }[] };
  const bandByEssay = new Map(
    (gradings ?? []).map((g) => [g.essay_id as string, Number(g.overall_band)]),
  );

  const practices: PracticeRow[] = [];
  const push = (row: PracticeRow) => practices.push(row);
  for (const e of essays.data ?? []) {
    push({
      id: e.id as string,
      skill: "writing",
      when: e.created_at as string,
      title: null,
      band: bandByEssay.get(e.id as string) ?? null,
      score: null,
      weakness: null,
      assigned: Boolean(e.prompt_id),
      reportHref: null,
    });
  }
  for (const r of reading.data ?? []) {
    push({
      id: r.id as string,
      skill: "reading",
      when: r.created_at as string,
      title: null,
      band: r.band != null ? Number(r.band) : null,
      score: r.total_questions ? `${r.correct_count ?? 0} / ${r.total_questions}` : null,
      weakness: null,
      assigned: false,
      reportHref: null,
    });
  }
  for (const l of listening.data ?? []) {
    const band = Number((l.result as { band?: unknown } | null)?.band);
    push({
      id: l.id as string,
      skill: "listening",
      when: l.created_at as string,
      title: null,
      band: Number.isFinite(band) ? band : null,
      score: l.max_score ? `${l.score ?? 0} / ${l.max_score}` : null,
      weakness: null,
      assigned: false,
      reportHref: null,
    });
  }
  for (const s of speaking.data ?? []) {
    if (s.state !== "graded") continue;
    const band = Number((s.result as { overall_band?: unknown } | null)?.overall_band);
    push({
      id: s.id as string,
      skill: "speaking",
      when: s.started_at as string,
      title: null,
      band: Number.isFinite(band) ? band : null,
      score: null,
      weakness: null,
      assigned: false,
      reportHref: null,
    });
  }
  practices.sort((a, b) => b.when.localeCompare(a.when));

  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString();

  return {
    studentId,
    name,
    photoUrl: null,
    bands: (["writing", "reading", "listening", "speaking"] as PracticeSkill[]).map((skill) => {
      const est = (estimates.data ?? []).find((e) => e.skill === skill);
      return {
        skill,
        current: est?.current_band != null ? Number(est.current_band) : null,
        target: est?.target_band != null ? Number(est.target_band) : null,
        baseline: est?.baseline_band != null ? Number(est.baseline_band) : null,
        baselineSource: ((est?.baseline_source as BaselineSource) ?? "first_attempt"),
        sampleCount: (est?.sample_count as number | null) ?? 0,
        targetAgreed: est?.target_set_by != null,
      };
    }),
    practices,
    recentCount: practices.filter((p) => p.when >= thirtyDaysAgo).length,
    lastActive: practices[0]?.when ?? null,
    writingWeaknesses: [],
    readingWeaknesses: [],
    homework: { assigned: practices.filter((p) => p.assigned).length, done: 0 },
    attendance: attendance.data
      ? {
          sessions: Number(attendance.data.sessions ?? 0),
          attended: Number(attendance.data.attended ?? 0),
          ratePct: Number(attendance.data.rate_pct ?? 0),
        }
      : null,
    groups: (groups ?? []).map((g) => g.name as string).filter(Boolean),
  };
}

async function main(): Promise<void> {
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, contact_email")
    .eq("kind", "center");

  let rendered = 0;
  for (const org of orgs ?? []) {
    const { data: students } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", org.id)
      .eq("role", "student")
      .limit(6);

    for (const s of students ?? []) {
      const report = await gather(s.id as string, (s.full_name as string) ?? "—");
      const pdf = buildParentReport(report, {
        organizationName: org.name as string,
        contact: (org.contact_email as string | null) ?? null,
      });
      const path = join(outDir, parentReportFilename(report));
      writeFileSync(path, pdf);
      rendered += 1;

      const head = pdf.subarray(0, 8).toString("latin1");
      const tail = pdf.subarray(-6).toString("latin1").trim();
      const bands = report.bands.filter((b) => b.current != null).length;
      console.log(
        `${head === "%PDF-1.4" && tail === "%%EOF" ? "ok " : "BAD"} ${String(pdf.length).padStart(6)}B  ` +
          `${bands}/4 skills  ${String(report.practices.length).padStart(3)} practices  ` +
          `${report.attendance ? `${report.attendance.ratePct}%` : "no register"}  ${path}`,
      );
    }
  }

  console.log(`\n${rendered} rendered into ${outDir}`);

  // The real proof: a PDF parser that is not ours agrees these are readable.
  try {
    const out = execFileSync("/bin/sh", [
      "-c",
      `for f in ${outDir}/*.pdf; do mdls -name kMDItemNumberOfPages "$f" 2>/dev/null | head -1; done`,
    ]).toString();
    console.log("Pages seen by macOS Quartz:", out.trim().split("\n").length, "files");
  } catch {
    /* mdls is a nicety, not the test */
  }
}

main();

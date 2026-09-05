import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { BODY, BRAND, cardStyle, DISPLAY, eyebrow, INK, SANS, STRONG, WHITE } from "@/app/_landing/design";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

import {
  CrossLink,
  DocsHead,
  PENDING,
  SectionCards,
  Sidebar,
  Steps,
  type DocGroup,
  type DocSection,
  type DocStep,
} from "../docs-ui";

/**
 * "How to use EngProgress" — FOR AN EDUCATION CENTRE.
 *
 * WRITTEN AGAINST THE CODE, NOT AGAINST THE PITCH. Every capability listed here
 * was checked in the console before being written down, and the two that do not
 * exist yet are marked SOON rather than quietly implied:
 *
 *   · assignments cover WRITING, READING (generated or cloned from the shared
 *     library) and Practice-AI lessons. `createAssignment` in
 *     app/(app)/console/groups/actions.ts accepts kind = writing | reading |
 *     library, and nothing else — LISTENING AND SPEAKING HOMEWORK IS NOT BUILT.
 *   · the roles are center_admin, administrator, teacher, student
 *     (`AppRole` in lib/auth.ts). "Super admin" is the PLATFORM role and is not
 *     something a centre gets — the centre's owner role is center_admin.
 *
 * If a capability moves, this page is the thing that goes stale first. It is
 * marketing copy about a product surface, so it needs re-reading whenever the
 * console gains or loses a feature.
 */

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const DESCRIPTION =
  "How an education center runs EngProgress: roles and teachers, groups and student logins, assigned homework with AI marking, Telegram notifications, attendance, per-student reports, finance and the center chat.";

export const metadata: Metadata = {
  title: "How to use EngProgress — a guide for education centers",
  description: DESCRIPTION,
  alternates: { canonical: "/how-to-use/education-centers" },
  openGraph: {
    type: "article",
    url: "/how-to-use/education-centers",
    title: "How to use EngProgress — for education centers",
    description: DESCRIPTION,
  },
};

const SIDEBAR: DocGroup[] = [
  {
    group: "Setting up",
    items: [
      { label: "Overview", href: "/how-to-use/education-centers" },
      { label: "Register your center", href: "/sign-up" },
      { label: "Roles and permissions", href: PENDING },
      { label: "Invite teachers", href: PENDING },
    ],
  },
  {
    group: "Running classes",
    items: [
      { label: "Groups and students", href: PENDING },
      { label: "Assigning practice", href: PENDING },
      { label: "Attendance", href: PENDING },
      { label: "Reports and weaknesses", href: PENDING },
    ],
  },
  {
    group: "Center tools",
    items: [
      { label: "Telegram", href: PENDING },
      { label: "Center chat", href: PENDING },
      { label: "Finance and payroll", href: PENDING },
    ],
  },
  {
    group: "Elsewhere",
    items: [{ label: "For learners", href: "/how-to-use" }],
  },
];

/** The four roles, straight from `AppRole` in lib/auth.ts. */
const ROLES = [
  {
    name: "Center admin",
    body: "The owner of the center. Invites teachers and administrators, creates groups, sees every student, every report and all of the money.",
  },
  {
    name: "Administrator",
    body: "The front desk. Runs classes, rosters and attendance, and takes money in — but not payroll or money out.",
  },
  {
    name: "Teacher",
    body: "Creates their own groups, adds students, assigns practice and reads the reports for the students in the groups they own.",
  },
  {
    name: "Student",
    body: "Signs in with the login you issue — no email needed — sees the homework attached to their group, and gets a full AI report on every attempt.",
  },
];

const SECTIONS: DocSection[] = [
  {
    icon: "⌂",
    title: "People and groups",
    links: [
      { label: "Register your center", href: "/sign-up" },
      { label: "Invite teachers and administrators", href: PENDING },
      { label: "Create groups and add students", href: PENDING },
      { label: "Issue logins without an email address", href: PENDING },
    ],
  },
  {
    icon: "✎",
    title: "Assigning practice",
    links: [
      { label: "Assign a Writing task", href: PENDING },
      { label: "Assign a Reading test", href: PENDING },
      { label: "Build a lesson with Practice AI", href: PENDING },
      { label: "Listening and Speaking homework", href: PENDING, soon: true },
    ],
  },
  {
    icon: "▤",
    title: "Tracking and reports",
    links: [
      { label: "Attendance and alerts", href: PENDING },
      { label: "Results for one assignment", href: PENDING },
      { label: "A student's four-skill report", href: PENDING },
      { label: "Recurring weaknesses", href: PENDING },
    ],
  },
  {
    icon: "◷",
    title: "Telegram and center chat",
    links: [
      { label: "Connect a group to Telegram", href: PENDING },
      { label: "Send a student their login", href: PENDING },
      { label: "Homework notifications", href: PENDING },
      { label: "Ask the center chat", href: PENDING },
    ],
  },
];

const STEPS: DocStep[] = [
  {
    n: "01",
    title: "Register and get approved",
    body: "Apply from the Organization tab on sign-up. We review it and confirm by email; your account waits on an approval screen until then.",
  },
  {
    n: "02",
    title: "Add teachers, then groups",
    body: "Invite your teachers by link. Each one creates their own groups and adds students outright — name, login and password, email optional.",
  },
  {
    n: "03",
    title: "Assign, then read the reports",
    body: "Pin a task to a group and every student sits the same content. The AI marks it, the student gets their mistakes, and you get the same report.",
  },
];

export default function CentersGuide() {
  const site = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to use EngProgress for an education center",
    description: DESCRIPTION,
    url: `${site}/how-to-use/education-centers`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: site },
    step: STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <div
      className={`${sora.variable} ${manrope.variable}`}
      style={{ background: WHITE, fontFamily: SANS, color: INK, minHeight: "100%" }}
    >
      <style>{DESIGN_CSS}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />

      <main
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 28px",
          display: "flex",
          flexWrap: "wrap",
          gap: 56,
        }}
      >
        <Sidebar groups={SIDEBAR} current="Overview" />

        <div style={{ flex: "1 1 460px", minWidth: 0, padding: "52px 0 96px" }}>
          <DocsHead
            kicker="Documentation · for education centers"
            title="Run your center on EngProgress"
            lede="Teachers, groups and student logins; homework the AI marks; Telegram for the parents and the class; attendance, reports, invoices and payroll — and a chat that answers questions about all of it."
          />

          <div style={{ ...eyebrow(true), marginTop: 54 }}>Who does what</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 22,
              marginTop: 20,
            }}
          >
            {ROLES.map((r) => (
              <div key={r.name} style={cardStyle(26)}>
                <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, margin: 0 }}>
                  {r.name}
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: BODY, margin: "10px 0 0" }}>
                  {r.body}
                </p>
              </div>
            ))}
          </div>

          <div style={{ ...eyebrow(true), marginTop: 54 }}>Sections</div>
          <SectionCards sections={SECTIONS} />

          <div style={{ ...eyebrow(true), marginTop: 54 }}>Three steps to your first class</div>
          <Steps steps={STEPS} />

          {/* What is genuinely not built yet. Saying so here is cheaper than a
              centre discovering it after they have moved their timetable over. */}
          <div style={{ ...cardStyle(26), marginTop: 32 }}>
            <div style={{ ...eyebrow(), color: BRAND }}>Not yet</div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: STRONG, margin: "12px 0 0" }}>
              Listening and Speaking can be <strong>practised</strong> by any student, but they
              cannot yet be <strong>assigned</strong> as group homework — Writing, Reading and
              Practice-AI lessons can. Emailed report digests are not built either; the reports live
              in the console.
            </p>
          </div>

          <CrossLink
            kicker="Practising on your own?"
            title="There is a separate guide for learners"
            body="Finding your real band, all four skills, the revision loop and CEFR — written for someone studying without a center."
            cta="Open the learner guide"
            href="/how-to-use"
          />
        </div>
      </main>

      <CentersBand />
      <SiteFooter />
    </div>
  );
}

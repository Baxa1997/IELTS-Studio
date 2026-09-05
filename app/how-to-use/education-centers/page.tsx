import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { BODY, cardStyle, DISPLAY, eyebrow, INK, SANS, WHITE } from "@/app/_landing/design";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

import {
  CrossLink,
  DocsHead,
  Prose,
  Sidebar,
  Steps,
  type DocGroup,
  type DocStep,
  type InfoTab,
} from "../docs-ui";
import { InfoTabs } from "../info-tabs";
import { RegisterCenterBand } from "@/app/_landing/register-center";

/**
 * "How to use EngProgress" — FOR AN EDUCATION CENTRE.
 *
 * WRITTEN AGAINST THE CODE, NOT AGAINST THE PITCH. Every capability listed here
 * was checked in the console before being written down, and the two that do not
 * exist yet are marked SOON rather than quietly implied:
 *
 *   · homework covers WRITING, READING, LISTENING and Practice-AI lessons.
 *     There are TWO assign paths and they differ: the group page's
 *     `createAssignment` (console/groups/actions.ts) takes writing | reading |
 *     library, while the practice board (console/practices/actions.ts:249)
 *     takes writing | reading | listening. SPEAKING IS THE ONLY SKILL THAT
 *     CANNOT BE ASSIGNED — an earlier draft of this page wrongly said listening
 *     could not be either, because it had only read the first path.
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
    group: "On this page",
    items: [
      // Mirrors the tab strip. Overview is the only clickable entry, matching
      // the learner guide; the rest name the tabs.
      { label: "Overview", href: "/how-to-use/education-centers" },
      { label: "People & groups", href: null, plain: true },
      { label: "Homework", href: null, plain: true },
      { label: "Tracking & reports", href: null, plain: true },
      { label: "Telegram", href: null, plain: true },
      { label: "Center chat", href: null, plain: true },
      { label: "Money", href: null, plain: true },
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
const INTRO: string[] = [
  "An education center runs the whole of EngProgress on top of the learner platform: your own teachers, your own groups, your own student logins, and homework the AI marks the moment it is handed in. Your students are ordinary learners — they can practise anything they like — and their teacher can see all of it.",
  "You do not pay per practice. Quota and seat limits are switched off for a center account on purpose, so setting more homework never costs you more, and a teacher never has to ration what a class is given.",
  "Approval is by hand. You apply, we read the application and confirm by email, and your account waits on a holding screen until then — which is also why nobody can sign your center up on your behalf.",
];

function OverviewPanel() {
  return (
    <>
      <Prose paragraphs={INTRO} />

      <div style={{ ...eyebrow(true), marginTop: 40 }}>Who does what</div>
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
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, margin: 0 }}>
              {r.name}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: BODY, margin: "10px 0 0" }}>
              {r.body}
            </p>
          </div>
        ))}
      </div>

      <div style={{ ...eyebrow(true), marginTop: 40 }}>Getting started</div>
      <Steps steps={STEPS} />
    </>
  );
}

const TABS: InfoTab[] = [
  {
    icon: "◆",
    title: "Overview",
    lede: "What a center gets, who does what inside it, and the three steps to your first class.",
    content: <OverviewPanel />,
  },
  {
    icon: "⌂",
    title: "People & groups",
    lede: "A centre runs on four roles, and a teacher can set up their own classes without waiting for anyone.",
    points: [
      {
        title: "Teachers create their own groups",
        body: "No queue through an admin. A teacher makes the class, sets the schedule and owns it.",
      },
      {
        title: "Students created outright",
        body: "Name, login and password. An email address is optional — give one and the credentials are emailed, leave it blank and you hand them over in class.",
      },
      {
        title: "No email needed to sign in",
        body: "Centre students sign in with the login you issued. The sign-in field takes either a login or an email and resolves it server-side.",
      },
      {
        title: "Photos, kept private",
        body: "A student photo is optional and lives in a private bucket, signed server-side. It is never a public URL.",
      },
    ],
  },
  {
    icon: "✎",
    title: "Homework",
    lede: "Pin practice to a group and everyone sits identical content.",
    points: [
      {
        title: "Writing",
        body: "Generate a Task 1 or Task 2 prompt and attach it. Every student in the group gets the same prompt, not a fresh one each.",
      },
      {
        title: "Reading",
        body: "Generate a test, or clone one from the shared library into your centre so the whole class sits the same paper.",
      },
      {
        title: "Listening",
        body: "Attach a listening practice from the library. It lands on the student's assignments list like any other task.",
      },
      {
        title: "Practice AI lessons",
        body: "Describe the lesson you want in a sentence; it builds an explanation plus auto-graded exercises, assignable or shareable by link.",
      },
      {
        title: "Speaking homework",
        body: "Speaking can be practised freely by any student, but it cannot yet be ASSIGNED to a group.",
        soon: true,
      },
    ],
  },
  {
    icon: "▤",
    title: "Tracking & reports",
    lede: "What each student did, what they got, and what keeps going wrong.",
    points: [
      {
        title: "Results per assignment",
        body: "Who finished, the bands they got, and the criterion or question type the class as a whole is losing marks on.",
      },
      {
        title: "A four-skill student report",
        body: "Bands across Writing, Reading, Listening and Speaking, recurring weaknesses, and a dated table of every practice — homework or self-directed.",
      },
      {
        title: "The learner's own report",
        body: "Open any row and you see exactly the feedback page the student sees. Staff and student read one view, not two versions of the truth.",
      },
      {
        title: "Attendance",
        body: "Mark sessions, track who is drifting, and set alerts on absence.",
      },
    ],
  },
  {
    icon: "◷",
    title: "Telegram",
    lede: "The channel families and students actually read.",
    points: [
      {
        title: "Credentials to the student",
        body: "Send a student their login and password over Telegram instead of reading them out in class.",
      },
      {
        title: "Homework notices",
        body: "Setting practice tells the class, with a link straight to their assignments list.",
      },
      {
        title: "Group links",
        body: "Connect a class to its Telegram group so notices land where the students already are.",
      },
      {
        title: "Staff assistant",
        body: "The same brain as the console chat, reachable from Telegram for staff.",
      },
    ],
  },
  {
    icon: "◈",
    title: "Center chat",
    lede: "Ask about your centre in plain language — and it cannot break anything.",
    points: [
      {
        title: "It reads, it does not write",
        body: "The model gets a snapshot of facts and returns prose plus, at most, one PROPOSAL. Running it is a separate Confirm step.",
      },
      {
        title: "Confirmed, then re-checked",
        body: "On confirm the server re-derives who you are, re-checks your role and re-resolves every name inside your own centre before anything happens.",
      },
      {
        title: "Scoped to what you may see",
        body: "The snapshot is built through the same row-level rules as the pages: a teacher sees their groups, a centre admin sees the centre.",
      },
      {
        title: "Attendance, homework, payroll",
        body: "Who turned up, what is outstanding, and what pay is owed — without opening four screens.",
      },
    ],
  },
  {
    icon: "◐",
    title: "Money",
    lede: "Invoices in, payroll out, and the timetable they both hang off.",
    points: [
      {
        title: "Student invoices",
        body: "A class carries both prices — the student fee and the teacher rate. Proration is per lesson from the timetable, not per month.",
      },
      {
        title: "Payroll with real rules",
        body: "Dynamic salary rules per teacher, with the group rate as the default, and multi-month exports.",
      },
      {
        title: "Cash desks and branches",
        body: "Branches own their own rooms and cash desks, so a multi-site centre's money stays separated.",
      },
      {
        title: "Unmetered on purpose",
        body: "Centres are not charged per practice. Quota and seat checks are skipped for a centre account.",
      },
    ],
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

          <InfoTabs tabs={TABS} label="How a center runs EngProgress" />

          <RegisterCenterBand />

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

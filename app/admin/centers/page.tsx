import Link from "next/link";

import {
  Bar,
  Card,
  Empty,
  FAINT,
  HEAD_BG,
  Identity,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  LINE,
  Pill,
  PageTitle,
  SOFT,
  Surface,
  TableHead,
  TableRow,
  TONE,
  NAVY,
} from "@/components/admin/ui";
import { MenuIcon } from "@/components/admin/menu-icons";
import { OverflowMenu } from "@/components/admin/menu";
import { loadCenters, type CenterRow } from "@/lib/admin/platform";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const initials = (name: string) => name.replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 2).toUpperCase() || "—";

const COLS = "2.4fr 1fr .7fr .7fr .8fr 1.3fr 1fr";

const SORTS = {
  practice: { label: "Busiest first", cmp: (a: CenterRow, b: CenterRow) => b.practice30d - a.practice30d },
  recent: { label: "Newest first", cmp: (a: CenterRow, b: CenterRow) => b.createdAt.localeCompare(a.createdAt) },
  students: { label: "Most students", cmp: (a: CenterRow, b: CenterRow) => b.students - a.students },
  idle: { label: "Least active", cmp: (a: CenterRow, b: CenterRow) => a.practice30d - b.practice30d },
  name: { label: "Name A–Z", cmp: (a: CenterRow, b: CenterRow) => a.name.localeCompare(b.name) },
} as const;

type SortKey = keyof typeof SORTS;

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting approval" },
  { key: "active", label: "Active" },
  { key: "rejected", label: "Rejected" },
] as const;

/**
 * Every organization, and how much of it is actually being used.
 *
 * The practice bar in each row is the point of the table. A centre with forty
 * students and no practice is the platform's most urgent problem and looks
 * identical to a healthy one in a list of names — so usage is drawn, not just
 * counted, and the rows can be sorted to put the silent ones on top.
 */
export default async function CentersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; sort?: string }>;
}) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const query = sp.q?.trim().toLowerCase() || "";
  const tab = (TABS.some((t) => t.key === sp.tab) ? sp.tab : "all") as string;
  const sort: SortKey = (sp.sort && sp.sort in SORTS ? sp.sort : "practice") as SortKey;

  const all = await loadCenters();
  const rows = all
    .filter((c) => (tab === "all" ? true : c.status === tab))
    .filter((c) =>
      query
        ? c.name.toLowerCase().includes(query) ||
          (c.contactEmail ?? "").toLowerCase().includes(query)
        : true,
    )
    .sort(SORTS[sort].cmp);

  const active = all.filter((c) => c.status === "active");
  const totals = active.reduce(
    (acc, c) => ({
      teachers: acc.teachers + c.teachers,
      students: acc.students + c.students,
      groups: acc.groups + c.groups,
    }),
    { teachers: 0, students: 0, groups: 0 },
  );
  const dormant = active.filter((c) => c.practice30d === 0).length;
  const pendingCount = all.filter((c) => c.status === "pending").length;
  const busiest = Math.max(1, ...all.map((c) => c.practice30d));

  const count = (key: string) =>
    key === "all" ? all.length : all.filter((c) => c.status === key).length;

  return (
    <Surface>
      <PageTitle
        eyebrow="Platform"
        title="Education centers"
        subtitle="Every organization, and how much of it is actually being used."
        actions={
          <OverflowMenu
            label="Center actions"
            items={[
              ...(pendingCount > 0
                ? [
                    {
                      label: `Review applications (${pendingCount})`,
                      href: "/admin/centers?tab=pending",
                      icon: MenuIcon.check,
                      tone: "green" as const,
                    },
                  ]
                : []),
              {
                label: "Export centers (Excel)",
                href: "/api/admin/export?kind=centers",
                icon: MenuIcon.sheet,
                tone: "green" as const,
                download: true,
              },
              {
                label: `Silent centers (${dormant})`,
                href: "/admin/centers?sort=idle",
                icon: MenuIcon.pulse,
                tone: "amber" as const,
              },
              {
                label: "Email idle centers",
                href: `mailto:?bcc=${encodeURIComponent(
                  active
                    .filter((c) => c.practice30d === 0 && c.contactEmail)
                    .map((c) => c.contactEmail as string)
                    .join(","),
                )}&subject=${encodeURIComponent("Getting started on EngProgress")}`,
                icon: MenuIcon.mail,
                tone: "indigo" as const,
              },
              {
                label: "Plans & revenue",
                href: "/admin/plans",
                icon: MenuIcon.card,
                tone: "indigo" as const,
                separated: true,
              },
            ]}
          />
        }
      />

      <KpiRow cols={5}>
        <Kpi label="Active centers" value={active.length} accent={INDIGO} sub={`${all.length} in total`} />
        <Kpi label="Teachers" value={totals.teachers} accent="#7C79DB" sub="across active centers" />
        <Kpi label="Groups" value={totals.groups} accent="#7FD8A8" sub="classes running" />
        <Kpi label="Students" value={totals.students} accent="#E5A85C" sub="on a centre roll" />
        <Kpi
          label="Silent 30 days"
          value={dormant}
          accent={dormant > 0 ? TONE.red.ink : TONE.green.ink}
          sub={dormant > 0 ? "no practice at all" : "everyone is practising"}
        />
      </KpiRow>

      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "14px 18px",
            borderBottom: `1px solid #F0EEE9`,
            flexWrap: "wrap",
          }}
        >
          {/* GET, so a filtered view is a URL a person can bookmark or send. */}
          <form method="get" style={{ display: "flex", gap: 9, flex: 1, minWidth: 220 }}>
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="sort" value={sort} />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Center name or admin email…"
              aria-label="Search centers"
              style={{
                flex: 1,
                maxWidth: 300,
                border: `1px solid #E4E2DC`,
                borderRadius: 8,
                padding: "8px 11px",
                fontSize: 12.5,
                background: "#FAFAF8",
                fontFamily: "inherit",
                color: INK,
              }}
            />
          </form>

          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <Link
                key={t.key}
                href={`/admin/centers?tab=${t.key}&sort=${sort}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                // Four tabs, four prefetches of THIS page with different
                // params — each one re-running loadCenters(). The filtering is
                // done in memory from a list already loaded; there is nothing
                // to warm.
                prefetch={false}
                style={{
                  borderRadius: 20,
                  padding: "7px 13px",
                  fontSize: 12.5,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  border: `1px solid ${on ? NAVY : "#E4E2DC"}`,
                  background: on ? NAVY : "#fff",
                  color: on ? "#fff" : "#4C4A63",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {t.label}
                <span style={{ marginLeft: 6, color: on ? "#B9B7EC" : FAINT }}>
                  {count(t.key)}
                </span>
              </Link>
            );
          })}

          <form method="get" style={{ marginLeft: "auto" }}>
            <input type="hidden" name="tab" value={tab} />
            {query ? <input type="hidden" name="q" value={query} /> : null}
            <select
              name="sort"
              defaultValue={sort}
              aria-label="Sort centers"
              style={{
                border: `1px solid #E4E2DC`,
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12.5,
                background: "#fff",
                fontFamily: "inherit",
                color: INK,
              }}
            >
              {Object.entries(SORTS).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
            <noscript>
              <button type="submit" style={{ marginLeft: 6 }}>
                Sort
              </button>
            </noscript>
          </form>

          <a
            href="/api/admin/export?kind=centers"
            download
            title="Export centers (Excel)"
            aria-label="Export centers to Excel"
            className="sa-act"
            style={{ color: TONE.green.ink, textDecoration: "none" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M4 10h16M10 10v10" />
            </svg>
          </a>
        </div>

        <div className="sa-scroll">
          <div>
            <TableHead cols={COLS}>
              <div>CENTER</div>
              <div>STATUS</div>
              <div style={{ textAlign: "right" }}>TEACHERS</div>
              <div style={{ textAlign: "right" }}>GROUPS</div>
              <div style={{ textAlign: "right" }}>STUDENTS</div>
              <div>PRACTICE 30D</div>
              <div>JOINED</div>
            </TableHead>

            {rows.map((c) => (
              <TableRow key={c.id} cols={COLS} href={`/admin/centers/${c.id}`}>
                <Identity
                  glyph={initials(c.name)}
                  name={
                    <>
                      {c.name}
                      {!c.billingEnforced ? (
                        <span style={{ marginLeft: 7 }}>
                          <Pill tone="indigo" title="Quota and seat checks are skipped for this centre">
                            unmetered
                          </Pill>
                        </span>
                      ) : null}
                    </>
                  }
                  meta={c.contactEmail ?? "no contact email"}
                />
                <div>
                  <Pill
                    tone={c.status === "active" ? "green" : c.status === "pending" ? "amber" : "red"}
                  >
                    {c.status}
                  </Pill>
                </div>
                <div style={{ textAlign: "right", color: "#4C4A63" }}>{c.teachers}</div>
                <div style={{ textAlign: "right", color: "#4C4A63" }}>{c.groups}</div>
                <div style={{ textAlign: "right", color: "#4C4A63" }}>{c.students}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 54, flex: "none" }}>
                    <Bar
                      width={`${(c.practice30d / busiest) * 100}%`}
                      fill={c.practice30d === 0 ? "#E0DED8" : INDIGO}
                      height={6}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: c.practice30d === 0 ? FAINT : INK,
                    }}
                  >
                    {c.practice30d}
                  </span>
                </div>
                <div style={{ color: SOFT, fontSize: 12.5 }}>{dateFmt(c.createdAt)}</div>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <Empty>
                {all.length === 0
                  ? "No centers yet. They apply through the Organization tab on the sign-up page."
                  : "No centers match those filters."}
              </Empty>
            ) : null}
          </div>
        </div>

        <div
          style={{
            padding: "12px 18px",
            fontSize: 12,
            color: FAINT,
            background: HEAD_BG,
            borderTop: `1px solid ${LINE}`,
          }}
        >
          Practice counts every graded attempt across all four skills in the last 30 days.
        </div>
      </Card>
    </Surface>
  );
}

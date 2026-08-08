import {
  EmptyRow,
  FAINT,
  INK,
  LINE,
  List,
  PageHead,
  Panel,
  Pill,
  Row,
  RowText,
  SANS,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { loadUsers } from "@/lib/admin/platform";
import { requireSuperAdmin } from "@/lib/auth";

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const roleTone = {
  center_admin: "indigo",
  teacher: "neutral",
  student: "neutral",
} as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireSuperAdmin();
  const { q } = await searchParams;
  const query = q?.trim() || undefined;
  const users = await loadUsers(query);

  const centerUsers = users.filter((u) => u.orgKind === "center").length;

  return (
    <div>
      <PageHead
        eyebrow="Platform"
        title="Users"
        subtitle="Everyone on the platform, newest first, with how much work they own."
      />

      <StatRow>
        <StatTile value={users.length} label={query ? "Matches" : "Users"} tone="indigo" />
        <StatTile value={users.length - centerUsers} label="Individual learners" />
        <StatTile value={centerUsers} label="In a center" />
      </StatRow>

      <Panel
        title={query ? `Results for “${query}”` : "All users"}
        description="Capped at 500. Search by name or login."
        actions={
          <form method="get" style={{ display: "flex", gap: 7 }}>
            <input
              type="search"
              name="q"
              defaultValue={query ?? ""}
              placeholder="Name or login…"
              aria-label="Search users"
              style={{
                fontFamily: SANS,
                fontSize: 13.5,
                color: INK,
                border: `1px solid ${LINE}`,
                borderRadius: 9,
                padding: "7px 11px",
                minWidth: 180,
              }}
            />
            <button
              type="submit"
              style={{
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 13.5,
                color: INK,
                background: "#fff",
                border: `1px solid ${LINE}`,
                borderRadius: 9,
                padding: "7px 13px",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>
        }
      >
        <List>
          {users.map((u, i) => (
            <Row key={u.id} first={i === 0}>
              <RowText
                title={
                  <>
                    {u.name}{" "}
                    <Pill tone={roleTone[u.role as keyof typeof roleTone] ?? "neutral"}>
                      {u.role.replace("_", " ")}
                    </Pill>
                  </>
                }
                meta={
                  <>
                    {u.orgKind === "center" ? u.orgName : "individual"}
                    {u.username ? ` · ${u.username}` : ""} · joined {dateFmt(u.createdAt)}
                  </>
                }
              />
              <span
                style={{
                  flex: "none",
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: FAINT,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {u.practiceCount} practice{u.practiceCount === 1 ? "" : "s"}
              </span>
            </Row>
          ))}
          {users.length === 0 ? (
            <EmptyRow>{query ? "Nobody matches that." : "No users yet."}</EmptyRow>
          ) : null}
        </List>
      </Panel>
    </div>
  );
}

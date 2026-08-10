import { redirect } from "next/navigation";

import {
  AMBER,
  Card,
  CardHead,
  CardNote,
  Empty,
  FAINT,
  GREEN,
  INDIGO,
  INK,
  KindBadge,
  MUTED,
  PageHead,
  SANS,
  SOFT,
  Stack,
  Tag,
} from "@/components/console/crm-ui";
import { Drawer, InlineAction } from "@/components/console/finance-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { loadFinanceSettings } from "@/lib/finance/load";
import { formatMoney } from "@/lib/finance/money";
import { loadAllSalaryRules } from "@/lib/finance/payroll";
import { describeRule } from "@/lib/finance/salary";
import { createClient } from "@/lib/supabase/server";

import { deleteSalaryRule, setSalaryRuleActive } from "../actions";
import { RuleBuilder } from "./rule-builder";

export const dynamic = "force-dynamic";

/**
 * Salary rules: how this center pays, written down.
 *
 * Ordered most-general first, because that is the order they resolve in and the
 * order an owner thinks in — "everyone gets 40%, except the kids club, except
 * Zulxumor". The resolution note under the list is not decoration: without it,
 * a center that adds a teacher rule and then wonders why the class rule stopped
 * applying has no way to find out.
 */
export default async function SalaryRulesPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") redirect("/console");

  const supabase = await createClient();
  const [rules, settings, { groups }, staffRes] = await Promise.all([
    loadAllSalaryRules(),
    loadFinanceSettings(),
    loadGroups(profile),
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").order("full_name"),
  ]);

  const currency = settings.currency;
  const money = (m: number) => formatMoney(m, currency);
  const teachers = ((staffRes.data ?? []) as Record<string, unknown>[]).map((t) => ({
    id: t.id as string,
    name: (t.full_name as string | null) ?? "—",
  }));
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));
  const nameOfGroup = new Map(groups.map((g) => [g.id, g.name]));
  const nameOfTeacher = new Map(teachers.map((t) => [t.id, t.name]));

  const order = { org: 0, group: 1, teacher: 2 } as const;
  const sorted = [...rules].sort(
    (a, b) => order[a.scope] - order[b.scope] || a.name.localeCompare(b.name),
  );
  const hasDefault = rules.some((r) => r.scope === "org" && r.active);

  return (
    <div>
      <PageHead
        back={{ href: "/console/finance", label: "Finance" }}
        eyebrow="Money"
        title="Salary rules"
        subtitle="How this center pays its teachers — described once, applied every month."
        actions={
          <Drawer
            label="New rule"
            eyebrow="Payroll"
            title="Describe a pay arrangement"
            note="Stack the parts your center actually uses, then try it on a class before it is anybody's salary."
            width={620}
          >
            <RuleBuilder groups={groupOptions} teachers={teachers} currency={currency} />
          </Drawer>
        }
      />

      {!hasDefault ? (
        <Card style={{ borderColor: "#E8D9BE", background: "#FDF9F1", marginBottom: 16 }}>
          <CardHead title="No house rule yet" />
          <p
            style={{ fontFamily: SANS, fontSize: 13, color: "#8A6420", margin: 0, lineHeight: 1.6 }}
          >
            Without a rule that applies to everyone, a teacher with no rule of their own is paid
            nothing and the payroll run will say so. Create one that applies to the whole center,
            then override the exceptions.
          </p>
        </Card>
      ) : null}

      <Stack>
        {sorted.length === 0 ? (
          <Card flush>
            <Empty>No rules yet.</Empty>
          </Card>
        ) : (
          sorted.map((rule) => {
            const target =
              rule.scope === "org"
                ? "Everyone in the center"
                : rule.scope === "group"
                  ? (nameOfGroup.get(rule.groupId ?? "") ?? "a class")
                  : `${nameOfTeacher.get(rule.teacherId ?? "") ?? "a teacher"}${
                      rule.groupId ? ` · ${nameOfGroup.get(rule.groupId) ?? "one class"}` : ""
                    }`;

            return (
              <Card key={rule.id}>
                <CardHead
                  title={rule.name}
                  badge={
                    <>
                      <KindBadge
                        tone={
                          rule.scope === "org"
                            ? "indigo"
                            : rule.scope === "group"
                              ? "green"
                              : "amber"
                        }
                      >
                        {rule.scope === "org"
                          ? "House rule"
                          : rule.scope === "group"
                            ? "Class"
                            : "Teacher"}
                      </KindBadge>
                      {!rule.active ? <Tag tone="neutral">off</Tag> : null}
                    </>
                  }
                  note={target}
                  actions={
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Drawer
                        label="Edit"
                        variant="ghost"
                        eyebrow="Payroll"
                        title={rule.name}
                        note="Changing a rule does not change payslips already computed — recompute the draft to apply it."
                        width={620}
                      >
                        <RuleBuilder
                          rule={{
                            id: rule.id,
                            name: rule.name,
                            scope: rule.scope,
                            groupId: rule.groupId,
                            teacherId: rule.teacherId,
                            components: rule.components,
                            floorMinor: rule.floorMinor,
                            capMinor: rule.capMinor,
                          }}
                          groups={groupOptions}
                          teachers={teachers}
                          currency={currency}
                        />
                      </Drawer>
                      <InlineAction
                        action={async (formData: FormData) => {
                          "use server";
                          await setSalaryRuleActive({}, formData);
                        }}
                        fields={{ id: rule.id, active: String(!rule.active) }}
                      >
                        {rule.active ? "Switch off" : "Switch on"}
                      </InlineAction>
                      <InlineAction
                        action={async (formData: FormData) => {
                          "use server";
                          await deleteSalaryRule({}, formData);
                        }}
                        fields={{ id: rule.id }}
                        tone="danger"
                        confirm={`Delete "${rule.name}"? Payslips already computed keep their numbers.`}
                      >
                        Delete
                      </InlineAction>
                    </div>
                  }
                />
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: rule.active ? INK : FAINT,
                    margin: 0,
                    lineHeight: 1.65,
                  }}
                >
                  {describeRule(rule, money)}
                </p>
              </Card>
            );
          })
        )}

        <Card>
          <CardHead title="How a rule is chosen" />
          <CardNote>
            For every teacher, and separately for every class they teach, the most specific active
            rule wins:
          </CardNote>
          <ol
            style={{
              fontFamily: SANS,
              fontSize: 13,
              color: SOFT,
              lineHeight: 1.75,
              margin: 0,
              paddingLeft: 20,
            }}
          >
            <li>
              a rule for <strong style={{ color: INK }}>that teacher in that class</strong>
            </li>
            <li>
              a rule for <strong style={{ color: INK }}>that teacher</strong>
            </li>
            <li>
              a rule for <strong style={{ color: INK }}>that class</strong>
            </li>
            <li>
              the <strong style={{ color: INK }}>house rule</strong>
            </li>
          </ol>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              color: MUTED,
              margin: "14px 0 0",
              lineHeight: 1.65,
            }}
          >
            Parts that measure a class — a share of its tuition, a rate per head, per lesson — are
            worked out once <em>per class</em>. Parts that measure the person — a base salary, an
            attendance bonus, a guaranteed minimum — are worked out once <em>per teacher</em>, from
            their own rule, so a base salary is never paid twice to somebody who teaches two
            classes.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              color: MUTED,
              margin: "10px 0 0",
              lineHeight: 1.65,
            }}
          >
            <strong style={{ color: GREEN }}>Collected</strong> means money actually banked against
            that class this month; <strong style={{ color: AMBER }}>invoiced</strong> means charged,
            paid or not. Paying a share of <em>collected</em> is what makes a teacher care whether
            their students have paid — which is usually the point.
          </p>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              color: FAINT,
              margin: "10px 0 0",
              lineHeight: 1.65,
            }}
          >
            Editing a rule never rewrites a payslip that has already been computed. Recompute the
            draft run to apply it; an approved run stays as it was.{" "}
            <span style={{ color: INDIGO }}>Amounts are in {currency}.</span>
          </p>
        </Card>
      </Stack>
    </div>
  );
}

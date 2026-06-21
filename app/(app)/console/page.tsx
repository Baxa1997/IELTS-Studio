import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardCheck, Mail, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

import { InvitePanel } from "./invite-panel";
import { GeneratePromptPanel } from "./prompt-studio";

const ROLE_LABEL: Record<string, string> = {
  center_admin: "Center admin",
  teacher: "Teacher",
  student: "Student",
};

export default async function ConsolePage() {
  const { profile } = await requireOrgUser();
  // Students don't belong here — send them to their dashboard.
  if (profile.role === "student") redirect("/dashboard");

  const supabase = await createClient();
  const isAdmin = profile.role === "center_admin";

  // RLS scopes every query to this admin/teacher's own organization.
  const [membersRes, invitesRes, promptCountRes, passageCountRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").order("role", { ascending: true }),
    isAdmin
      ? supabase
          .from("invites")
          .select("email, created_at, expires_at")
          .is("accepted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    supabase
      .from("writing_prompts")
      .select("id", { count: "exact", head: true })
      .eq("task_type", "task2")
      .eq("status", "pending"),
    supabase.from("reading_passages").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const members = membersRes.data;
  const pendingInvites = invitesRes.data;
  const pendingContent = (promptCountRes.count ?? 0) + (passageCountRes.count ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Center console</h1>
        <p className="text-muted-foreground">Manage your center&apos;s students, content and grading.</p>
      </div>

      {/* At-a-glance stats. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Users} value={members?.length ?? 0} label="Members" />
        <Stat icon={ClipboardCheck} value={pendingContent} label="Awaiting approval" />
        {isAdmin ? <Stat icon={Mail} value={pendingInvites?.length ?? 0} label="Pending invites" /> : null}
      </div>

      {/* The core daily action — also in the sidebar, surfaced here for prominence. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review queue</CardTitle>
          <CardDescription>
            Audit AI gradings, approve content, and adjust bands — your overrides train the grader.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {pendingContent} item{pendingContent === 1 ? "" : "s"} awaiting approval, plus gradings to review.
          </p>
          <Link href="/console/review" className={cn(buttonVariants())}>
            Open queue <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite a student</CardTitle>
            <CardDescription>They join your center only — never another org.</CardDescription>
          </CardHeader>
          <CardContent>
            <InvitePanel />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate a Task 2 prompt</CardTitle>
          <CardDescription>
            Original prompts via AI. They stay hidden from students until approved in the review queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GeneratePromptPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>{members?.length ?? 0} in your center</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {(members ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <span>{m.full_name ?? "—"}</span>
                <span className="text-muted-foreground text-xs">{ROLE_LABEL[m.role] ?? m.role}</span>
              </li>
            ))}
            {(members ?? []).length === 0 ? (
              <li className="text-muted-foreground py-2">No members yet.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invites</CardTitle>
            <CardDescription>{pendingInvites?.length ?? 0} awaiting acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {(pendingInvites ?? []).map((inv) => (
                <li key={inv.email} className="flex items-center justify-between py-2">
                  <span>{inv.email}</span>
                  <span className="text-muted-foreground text-xs">
                    expires {new Date(inv.expires_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
              {(pendingInvites ?? []).length === 0 ? (
                <li className="text-muted-foreground py-2">No pending invites.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-xl border p-4">
      <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

import { Card, CardHead, Stack } from "@/app/(app)/console/_components/crm-ui";
import type { Profile } from "@/lib/auth";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { createClient } from "@/lib/supabase/server";

import { Holidays, type Holiday } from "./holidays";
import { OperatingForm } from "./operating-form";
import { CenterProfileForm } from "./profile-form";

/** The center itself: how it appears, how it runs, and when it is shut. */
export async function CenterSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const [operating, orgRes, holidayRes] = await Promise.all([
    loadCenterSettings(),
    supabase
      .from("organizations")
      .select("name, status, plan, contact_email")
      .eq("id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("center_holidays")
      .select("id, name, starts_on, ends_on")
      .order("starts_on", { ascending: false }),
  ]);

  const org = orgRes.data as {
    name: string | null;
    status: string | null;
    plan: string | null;
    contact_email: string | null;
  } | null;

  const holidays: Holiday[] = ((holidayRes.data ?? []) as Record<string, unknown>[]).map((h) => ({
    id: h.id as string,
    name: h.name as string,
    startsOn: String(h.starts_on).slice(0, 10),
    endsOn: String(h.ends_on).slice(0, 10),
  }));

  return (
    <Stack>
      <Card>
        <CardHead title="Center profile" />
        <CenterProfileForm
          name={org?.name ?? ""}
          status={org?.status ?? "unknown"}
          plan={org?.plan ?? "—"}
          contactEmail={org?.contact_email ?? null}
        />
      </Card>

      <Card flush>
        <CardHead
          title="How this center runs"
          divided
          note="the timezone decides what &ldquo;today&rdquo; means on every page"
        />
        <div style={{ paddingTop: 16 }}>
          <OperatingForm settings={operating} />
        </div>
      </Card>

      <Card flush>
        <CardHead
          title="Holidays"
          divided
          note="days the center is shut: no lessons, no registers, no fees"
        />
        <div style={{ paddingTop: 14 }}>
          <Holidays holidays={holidays} />
        </div>
      </Card>
    </Stack>
  );
}

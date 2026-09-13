import { redirect } from "next/navigation";

/** Settings opens on the account section. */
export default function LearnerSettingsPage() {
  redirect("/settings/account");
}

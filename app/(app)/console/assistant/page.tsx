import { redirect } from "next/navigation";

import { PageHead } from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadCentreSnapshot } from "@/lib/console/assistant";

import { AssistantChat } from "./chat";

export const dynamic = "force-dynamic";

/**
 * The centre assistant.
 *
 * A PAGE, NOT A WIDGET IN THE CORNER. It is reached from the top of the rail
 * and from every page's "Ask AI", and both land here — so there is one
 * conversation to come back to rather than a panel whose contents depend on
 * which screen you opened it from.
 */
export default async function AssistantPage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  // The openers are built from the caller's OWN snapshot, so they are questions
  // this centre can actually answer — an empty console offering "which class is
  // behind?" teaches people the assistant is decorative.
  const snapshot = await loadCentreSnapshot(profile);
  const hasClasses = snapshot.groupIds.size > 0;
  const suggestions = hasClasses
    ? [
        "Which classes can't collect their logins yet?",
        "What's waiting for me to mark?",
        "Which class has the most students missing a phone number?",
      ]
    : ["What should I set up first?", "How do students get their logins?"];

  return (
    <div>
      <PageHead
        title="Assistant"
        subtitle={`Ask anything about ${snapshot.centreName}. It sees exactly what your account sees — nothing more.`}
      />
      <AssistantChat suggestions={suggestions} />
    </div>
  );
}

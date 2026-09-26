import { Card, CardHead } from "@/app/(app)/console/_components/crm-ui";
import { loadSubjects } from "@/lib/console/subjects";

import { SubjectsManager } from "./subjects-manager";

/** What the center teaches — a group carries one, a teacher can take several. */
export async function SubjectsSection() {
  const subjects = await loadSubjects();
  return (
    <Card>
      <CardHead title="Subjects" note="a group carries one subject, a teacher can take several" />
      <SubjectsManager subjects={subjects} />
    </Card>
  );
}

import { AssignToClass } from "@/components/console/assign-to-class";
import { requireOrgUser } from "@/lib/auth";

import { ListeningClient } from "./listening-client";

export const dynamic = "force-dynamic";

/**
 * Listening practice hub — Parts 1 & 4 live (original scripts + exam-style TTS
 * audio, generated and graded on the AI engine; Parts 2 & 3 shown as coming
 * soon). Browser-direct engine calls like the CEFR hub, so the ~2 min
 * generate+synthesize runs off Vercel's serverless cap. Students only.
 */
export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  // Staff browse and play the same practices their class does.
  await requireOrgUser();
  // ?item=<library id> opens that practice directly — set by the client when a
  // practice is opened, and by the assignment link a student follows.
  const { item } = await searchParams;

  return (
    <>
      <ListeningClient initialLibraryId={item} />
      {item ? <AssignToClass kind="listening" contentId={item} /> : null}
    </>
  );
}

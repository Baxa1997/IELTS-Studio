import type { PoolItem } from "@/lib/free-practice/assignment";
import type { FreeSkill } from "@/lib/free-practice/rotation";
import type { Translate } from "@/lib/i18n";

/** The line under "Test N": the whole test, or one part of it. A writing
 *  task is neither — the exam's Writing test is both tasks — so it names the
 *  task instead. A CEFR practice is always a whole paper, so it names which. */
const FORMAT_LABEL = {
  reading: { full: "free.fullReading", part: "free.partReading" },
  listening: { full: "free.fullListening", part: "free.partListening" },
} as const;

export function formatLabel(skill: FreeSkill, item: PoolItem, t: Translate): string {
  if (skill === "writing") return t("free.writingTask", { n: item.kind?.endsWith("Task 2") ? 2 : 1 });
  if (skill === "cefr") return t(item.paper === "writing" ? "free.fullCefrWriting" : "free.fullCefrReading");
  return t(FORMAT_LABEL[skill][item.format === "full" ? "full" : "part"]);
}

/** A practice's name as its cover shows it: "Test 12 · Full reading" — also
 *  its name in the page's structured data. */
export function practiceName(skill: FreeSkill, item: PoolItem, t: Translate): string {
  return `${t("free.testNo", { n: item.testNo })} · ${formatLabel(skill, item, t)}`;
}

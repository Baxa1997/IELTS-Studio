import { redirect } from "next/navigation";

/**
 * Telegram groups moved into Settings. This route stays so the links already out
 * in the world — bookmarks, messages, the old account menu — still land.
 */
export default function TelegramPage() {
  redirect("/console/settings/telegram");
}

import { redirect } from "next/navigation";

import { freePracticePage } from "@/lib/free-practice/links";

/** A bare runner path has no practice in it: the list is where one is chosen. */
export default function Page() {
  redirect(freePracticePage("listening"));
}

"use client";

import { useRouter } from "next/navigation";

import { LiveMock } from "@/app/(shell)/speak/live-mock";

/** Wraps the live examiner on its own route. Leaving the test — whether by
 *  finishing or by quitting through the confirmation — returns to the hub. */
export function ExamPage() {
  const router = useRouter();
  return <LiveMock onExit={() => router.push("/speak")} />;
}

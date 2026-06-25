import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

import { getSession, roleHome } from "@/lib/auth";

import { StartWizard } from "./start-wizard";

// Self-contained fonts so the wizard renders without the app shell.
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-hanken", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });

export const metadata: Metadata = {
  title: "Get started | IELTS Studio",
  description: "Build your personalised IELTS Writing & Reading plan in under a minute, then create your account.",
};

export const dynamic = "force-dynamic";

/**
 * The pre-auth onboarding entry. Anyone already signed in skips it (they have a
 * session — and the post-auth takeover already guarantees a plan); everyone else
 * runs the wizard, which ends in account creation.
 */
export default async function StartPage() {
  const session = await getSession();
  if (session) redirect(roleHome(session.role));

  return (
    <div className={`${hanken.variable} ${newsreader.variable}`}>
      <StartWizard />
    </div>
  );
}

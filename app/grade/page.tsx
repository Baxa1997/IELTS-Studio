import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getSession, roleHome } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { PublicGrader } from "./grader";

export const metadata: Metadata = {
  title: "Free IELTS Writing grader — instant band & fixes",
  description:
    "Paste your IELTS Writing Task 2 essay and get an instant, conservative band for each " +
    "criterion plus your top 3 fixes. No login required.",
};

export const dynamic = "force-dynamic";

export default async function PublicGradePage() {
  // Optional: signed-in visitors get a shortcut to the full app, but no redirect —
  // the page is intentionally reachable by anyone.
  const session = await getSession();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Free IELTS Writing grader
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">
            Get a real band on your essay in seconds
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Pick a Task 2 question, paste your essay, and see a per-criterion band and your top 3
            fixes — calibrated to be conservative, not flattering. No account needed.
          </p>
        </div>
        <nav className="flex shrink-0 gap-2">
          {session ? (
            <Link href={roleHome(session.role)} className={cn(buttonVariants({ variant: "outline" }))}>
              Open your dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className={cn(buttonVariants({ variant: "ghost" }))}>
                Sign in
              </Link>
              <Link href="/sign-up" className={cn(buttonVariants())}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <PublicGrader />

      <footer className="text-muted-foreground mt-10 border-t pt-4 text-xs">
        Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment
        English. Prompts are original and written for practice.
      </footer>
    </main>
  );
}

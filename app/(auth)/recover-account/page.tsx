import Link from "next/link";

import { signOut } from "@/lib/auth-actions";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RecoverAccountPage() {
  const session = await getSession();
  return (
    <main style={{ maxWidth: 560, margin: "10vh auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>We need to finish setting up your account</h1>
      <p>
        Your sign-in worked, but your learner profile is missing. Please sign out and try again.
        If this continues, contact support so we can repair the account safely.
      </p>
      <p><form action={signOut} style={{ display: "inline" }}><button type="submit">Sign out</button></form> · <Link href="/contact">Contact support</Link></p>
      <p style={{ color: "#667085", fontSize: 14 }}>Account: {session?.user.email ?? "signed in"}</p>
    </main>
  );
}

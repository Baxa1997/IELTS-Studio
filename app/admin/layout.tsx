import { cookies } from "next/headers";
import { Hanken_Grotesk, Newsreader, Source_Serif_4, Work_Sans } from "next/font/google";

import { AdminHeader } from "@/components/admin/header";
import { AppShell } from "@/components/app-shell/shell";
import { requireSuperAdmin } from "@/lib/auth";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-newsreader",
  display: "swap",
});

/**
 * The design's own two faces, loaded for this route group ONLY.
 *
 * Work Sans and Source Serif 4 are what the Super Admin design is drawn in, and
 * substituting the app's Hanken/Newsreader was visibly not the same page. They
 * are scoped here rather than in the root layout because /admin is the only
 * surface that uses them — a learner loading the dashboard should not pay for
 * two font families they never see.
 *
 * The rail keeps the app's own type. Only the page area picks these up, via
 * `Surface` in components/admin/ui.tsx.
 */
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-source-serif",
  display: "swap",
});

/**
 * The platform console runs in the SAME shell as the rest of the app — same
 * rail, same chrome, same type. Only the menu and the pages differ, because a
 * super admin has no organization and a different job.
 *
 * `variant="console"` gives it the cream ground the Super Admin design is drawn
 * on, which the center console already uses. That is the whole of the design's
 * chrome we adopt: the design draws its own dark navy rail, and the owner's
 * call — the same one made for the center console — is that OUR rail stays and
 * the design applies to the page area. A super admin who is also a teacher
 * should not have the furniture move under them between surfaces.
 *
 * The variant also drops the shell's own padding, because each admin page owns
 * its inset (see `Surface` in components/admin/ui.tsx).
 *
 * The font variables have to be declared here too: this route group sits
 * outside (app), so it doesn't inherit that layout's `lp-root` wrapper.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSuperAdmin();
  const collapsed = (await cookies()).get("sb_collapsed")?.value === "1";

  return (
    <div
      className={`${hanken.variable} ${newsreader.variable} ${workSans.variable} ${sourceSerif.variable} lp-root`}
    >
      <AppShell
        role="super_admin"
        home="/admin"
        name={user.email ?? "Platform"}
        roleLabel="Super admin"
        email={user.email}
        initialCollapsed={collapsed}
        variant="console"
      >
        <AdminHeader />
        {children}
      </AppShell>
    </div>
  );
}

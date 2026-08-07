import { cookies } from "next/headers";
import { Hanken_Grotesk, Newsreader } from "next/font/google";

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
 * The platform console runs in the SAME shell as the rest of the app — same
 * rail, same chrome, same type. Only the menu and the pages differ, because a
 * super admin has no organization and a different job.
 *
 * The font variables have to be declared here too: this route group sits
 * outside (app), so it doesn't inherit that layout's `lp-root` wrapper.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSuperAdmin();
  const collapsed = (await cookies()).get("sb_collapsed")?.value === "1";

  return (
    <div className={`${hanken.variable} ${newsreader.variable} lp-root`}>
      <AppShell
        role="super_admin"
        home="/admin"
        name={user.email ?? "Platform"}
        roleLabel="Super admin"
        email={user.email}
        initialCollapsed={collapsed}
      >
        {children}
      </AppShell>
    </div>
  );
}

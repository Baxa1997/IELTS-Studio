import Link from "next/link";

import { SignOutButton } from "@/app/(auth)/sign-out-button";
import { requireSuperAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSuperAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/admin" className="font-semibold tracking-tight">
            IELTS W&amp;R · Platform
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm">{user.email}</p>
              <p className="text-muted-foreground text-xs">Super admin</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

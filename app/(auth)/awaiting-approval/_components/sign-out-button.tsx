"use client";

import { signOut } from "@/lib/auth-actions";
import { Button } from "@/shared/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );
}

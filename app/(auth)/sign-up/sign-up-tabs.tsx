"use client";

import { useState } from "react";

import { GoogleButton } from "@/app/(auth)/google-button";
import { cn } from "@/lib/utils";

import { OrgSignUpForm } from "./org-sign-up-form";
import { SignUpForm } from "./sign-up-form";

type Tab = "individual" | "organization";

/** Segmented Individual / Organization switcher for the sign-up card. */
export function SignUpTabs({ defaultEmail }: { defaultEmail?: string }) {
  const [tab, setTab] = useState<Tab>("individual");

  return (
    <div className="space-y-4">
      <div className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1" role="tablist">
        {(
          [
            ["individual", "Individual"],
            ["organization", "Organization"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "individual" ? (
        <div className="space-y-4">
          <GoogleButton label="Sign up with Google" />
          <div className="flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <span className="bg-border h-px flex-1" />
          </div>
          <SignUpForm defaultEmail={defaultEmail} />
        </div>
      ) : (
        <OrgSignUpForm />
      )}
    </div>
  );
}

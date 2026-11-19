import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Whether this browser holds a session — `null` until the check resolves.
 *
 * Read in the BROWSER so the public pages stay static and cacheable;
 * `site-nav.tsx` explains why that matters.
 *
 * ⚠️ `null` IS NOT `false`. Something that must NEVER reach a signed-in reader
 * (the blog's ad) has to wait for the answer; collapsing "not known yet" into
 * "signed out" would fire it at every paying learner for the moment before
 * the session lands.
 */
export function useSession(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let live = true;

    supabase.auth.getSession().then(({ data }) => {
      if (live) setSignedIn(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (live) setSignedIn(Boolean(session));
    });

    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, []);

  return signedIn;
}

/**
 * `useSession` with "not known yet" read as signed out, so a static page paints
 * its signed-out form first and a signed-in visitor watches it settle a moment
 * later. The header's button and the blog's account card both take that trade.
 */
export function useSignedIn(): boolean {
  return useSession() === true;
}

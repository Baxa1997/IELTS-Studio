import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Whether this browser holds a session — read in the BROWSER so the public pages
 * stay static and cacheable; `site-nav.tsx` explains why that matters.
 *
 * `false` until the session resolves, so a static page paints its signed-out
 * form first and a signed-in visitor watches it settle a moment later. The
 * header's button and the blog's account card both take that trade.
 */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);

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

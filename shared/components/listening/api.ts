import { engineClient } from "@/lib/engine/client";

// ---- Engine call -----------------------------------------------------------

/** Every engine call on this screen goes to the engine's `listening` namespace. */
export const callEngine = engineClient("listening");

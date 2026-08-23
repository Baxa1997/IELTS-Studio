/**
 * The shared primitive kit — one import path.
 *
 *   import { Card, Badge, Stat, Modal, Field } from "@/components/ui";
 *
 * Server-rendered presentation lives in `./primitives`, the stateful pieces in
 * `./interactive`. Splitting the re-export by file (rather than one big module)
 * keeps a page that only needs a `Card` from pulling a client boundary along
 * with it — the `"use client"` directive sits on `./interactive`, and only the
 * components that come from there carry it.
 *
 * Colour, type and spacing all come from `@/lib/theme/tokens`. The ESLint rule in
 * eslint.config.mjs refuses a raw hex literal anywhere under this directory.
 *
 * Staff screens have a richer kit in `@/components/console/crm-ui` (tables, KPI
 * rows, meters, the rail) which reads from the same tokens. Exam screens have
 * `@/components/exam`.
 */

export {
  Avatar,
  Badge,
  Card,
  CardHead,
  Divider,
  Empty,
  Grid,
  initials,
  SectionLabel,
  Stack,
  Stat,
} from "./primitives";

export { Field, Modal, Spinner } from "./interactive";

/** The Tailwind/CVA controls that predate this kit. Re-exported so there is one
 *  import path, not two. */
export { Button, buttonVariants } from "./button";
export { Input } from "./input";
export { Label } from "./label";

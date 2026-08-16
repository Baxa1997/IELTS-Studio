/**
 * The glyphs the admin menus use.
 *
 * NO "use client" HERE, and that is the whole point of the file existing.
 *
 * These live beside `OverflowMenu`, which is a client component, and were
 * originally exported from it. That silently broke them: a Server Component
 * importing a non-component value out of a "use client" module receives a
 * client REFERENCE rather than the real JSX, so every menu rendered its
 * coloured tile with nothing inside it. The pages that build menus are server
 * components, so the icons have to come from a module that is not on the client
 * side of the boundary.
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const MenuIcon = {
  card: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
    </svg>
  ),
  mail: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <path d="M4 5h16v14H4z" />
      <path d="M4 6l8 6 8-6" />
    </svg>
  ),
  sheet: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M10 10v10" />
    </svg>
  ),
  ban: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.9" {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8v8M14 8v8" />
    </svg>
  ),
  check: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="2.2" {...stroke}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  restore: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <path d="M3 12a9 9 0 1015.5-6.2M3 4v5h5" />
    </svg>
  ),
  users: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
    </svg>
  ),
  pulse: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="2" {...stroke}>
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  ),
  building: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h3M13 7h3M8 11h3M13 11h3M8 15h3M13 15h3" />
    </svg>
  ),
  doc: (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  ),
};

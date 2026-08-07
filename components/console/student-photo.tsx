/**
 * A student's photo, or their initials when there isn't one. Photos are
 * optional everywhere, so the fallback is the normal case, not an error state.
 *
 * The src is a short-lived signed URL from the private `avatars` bucket
 * (lib/console/avatars.ts) — plain <img>, since Next's optimizer can't fetch a
 * URL that expires.
 */
export function StudentPhoto({
  name,
  url,
  size = 32,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full font-medium"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}

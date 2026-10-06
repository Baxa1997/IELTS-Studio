/**
 * YouTube, reduced to the one thing a post stores: the video's id.
 *
 * Accepts the shapes people actually paste — `youtu.be/ID`, `watch?v=ID`,
 * `/embed/ID`, `/shorts/ID`, or the bare id — and returns undefined for
 * anything else, so a link to some other host can never become an embed.
 */
const ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(input: string): string | undefined {
  const s = input.trim();
  if (ID.test(s)) return s;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return undefined;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null | undefined;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v") ?? /^\/(?:embed|shorts|live)\/([^/?#]+)/.exec(url.pathname)?.[1];
  }
  return id && ID.test(id) ? id : undefined;
}

export const isYoutubeId = (s: string): boolean => ID.test(s);

/** The privacy-enhanced embed: no cookies until the reader presses play. */
export const youtubeEmbed = (id: string): string => `https://www.youtube-nocookie.com/embed/${id}`;

/** The still YouTube serves for every video — the editor's preview. */
export const youtubeThumb = (id: string): string => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

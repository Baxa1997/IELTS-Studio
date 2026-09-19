import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getSiteUrl, PREVIEW_IMAGE, SEO_DESCRIPTION, SEO_KEYWORDS, SITE_NAME } from "@/lib/seo";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";

// Geist Sans used to be loaded here too. Nothing referenced --font-geist-sans —
// not a component, not globals.css, not the Tailwind theme (which maps
// --font-sans to itself and --font-heading to --font-sans). Every page in the
// app downloaded it to render nothing with it.
//
// Geist Mono stays: the theme's --font-mono points at it, so the `font-mono`
// utility and the speaking screens' var(--font-mono) both resolve through it.
// preload:false — this is the app-wide mono, but only a handful of screens draw
// with it (the `font-mono` utility, and the speaking surface via --font-mono).
// Preloading fetches it before first paint on EVERY route, including the
// marketing landing and sign-in, which never render a mono glyph. Without the
// preload hint the browser fetches it only when something actually uses it.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: "EngProgress — IELTS Practice with AI Band Feedback",
    template: "%s | EngProgress",
  },
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "EngProgress",
    title: "EngProgress — IELTS Practice with AI Band Feedback",
    description: SEO_DESCRIPTION,
    images: [
      {
        url: PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        alt: "EngProgress IELTS practice with AI band feedback",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EngProgress — IELTS Practice with AI Band Feedback",
    description: SEO_DESCRIPTION,
    images: [PREVIEW_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Without this, mobile browsers assume a ~980px layout viewport and render the
// full desktop layout shrunk into the phone screen — the sidebar eats half the
// width and every page's max-width media queries never fire. `device-width`
// makes the layout viewport match the real screen so the responsive CSS works.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      {/* `suppressHydrationWarning` for the BODY TAG ONLY, and only its own
          attributes — React still reports every mismatch inside it.

          Grammarly and similar extensions write `data-gr-ext-installed` and
          `data-new-gr-c-s-check-loaded` onto <body> before React hydrates, so
          the client tree has attributes the server never sent. It is not our
          bug and cannot be fixed from our side: the markup is modified in the
          user's browser. What it DID cost us is real, though — a permanent red
          error badge on every page in dev, which is exactly how a genuine
          hydration bug goes unnoticed. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {/* FIRST CHILD OF <body>, AND IT HAS TO STAY FIRST. An inline script is
            executed while the parser is still here, so no body content has been
            laid out yet and nothing has painted — which is what makes the theme
            class land before the first frame instead of after it. Move it below
            {children} and a dark-mode user sees a white page flash on every
            cold load. (<head> would do equally well; <body> is used so this
            layout never has to render a manual <head> alongside the metadata
            Next injects into it.) */}
        <ThemeScript />
        {/* No `initial` here ON PURPOSE. This layout is the root of the STATIC
            tree as well — the marketing pages and the front door — and reading
            the locale cookie to pass one down would make every route in the app
            dynamic, including those. The provider picks the cookie up on the
            client instead. The authenticated layouts, which already read
            cookies for the session, nest their own provider WITH the
            server-resolved locale, and that inner one wins for their subtree —
            so the app itself renders in the right language on the first paint
            and only the cacheable pages settle a tick later. */}
        <ThemeProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

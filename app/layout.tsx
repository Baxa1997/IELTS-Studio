import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getSiteUrl, PREVIEW_IMAGE, SEO_DESCRIPTION, SEO_KEYWORDS, SITE_NAME } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

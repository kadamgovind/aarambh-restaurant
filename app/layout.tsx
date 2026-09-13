import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Aarambh Restaurant",
    template: "%s | Aarambh Restaurant",
  },

  description:
    "Aarambh Restaurant offers delicious food, memorable dining, table reservations, and convenient online ordering.",

  applicationName: "Aarambh Restaurant",

  keywords: [
    "Aarambh Restaurant",
    "restaurant",
    "Indian restaurant",
    "Maharashtrian food",
    "Chinese food",
    "tandoor",
    "online food ordering",
    "table booking",
    "restaurant in Pune",
  ],

  authors: [
    {
      name: "Aarambh Restaurant",
    },
  ],

  creator: "Aarambh Restaurant",
  publisher: "Aarambh Restaurant",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Aarambh Restaurant",
    description:
      "Delicious food, memorable dining, table reservations, and online ordering at Aarambh Restaurant.",
    siteName: "Aarambh Restaurant",
    url: siteUrl,
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Aarambh Restaurant",
    description:
      "Delicious food, memorable dining, table reservations, and online ordering at Aarambh Restaurant.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
import type { Metadata, Viewport } from "next";
import "./globals.css";
import RestaurantSchema from "@/components/RestaurantSchema";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const siteName = "Aarambh Restaurant";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },

  description:
    "Aarambh Restaurant offers delicious food, memorable dining, table reservations, and convenient online ordering.",

  applicationName: siteName,

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
      name: siteName,
    },
  ],

  creator: siteName,
  publisher: siteName,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: siteName,
    description:
      "Delicious food, memorable dining, table reservations, and online ordering at Aarambh Restaurant.",
    siteName,
    url: siteUrl,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Aarambh Restaurant",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteName,
    description:
      "Delicious food, memorable dining, table reservations, and online ordering at Aarambh Restaurant.",
    images: ["/images/og-image.jpg"],
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

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body>
        <RestaurantSchema />
        {children}
      </body>
    </html>
  );
}
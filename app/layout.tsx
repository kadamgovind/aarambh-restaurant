import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aarambh-restaurant.vercel.app"),

  title: {
    default: "Aarambh Restaurant",
    template: "%s | Aarambh Restaurant",
  },

  description:
    "Aarambh Restaurant — delicious food, memorable dining and a warm restaurant experience.",

  applicationName: "Aarambh Restaurant",

  keywords: [
    "Aarambh Restaurant",
    "restaurant",
    "Indian restaurant",
    "food",
    "dining",
    "online food ordering",
    "table booking",
  ],

  openGraph: {
    title: "Aarambh Restaurant",
    description:
      "Delicious food, memorable dining and a warm restaurant experience.",
    siteName: "Aarambh Restaurant",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Aarambh Restaurant",
    description:
      "Delicious food, memorable dining and a warm restaurant experience.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
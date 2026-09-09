import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA — Modern Indian Kitchen",
  description:
    "A premium modern Indian restaurant experience. Discover authentic flavours, signature dishes and unforgettable dining.",
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
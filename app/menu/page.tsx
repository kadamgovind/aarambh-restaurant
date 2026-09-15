import type { Metadata } from "next";
import Footer from "@/components/Footer";
import MenuClient from "./MenuClient";

export const metadata: Metadata = {
  title: "Menu | Indian, Maharashtrian, Chinese & Tandoor",
  description:
    "Explore the Aarambh Restaurant menu featuring Indian, Maharashtrian, Chinese and tandoor dishes. Check prices, vegetarian and non-vegetarian options, and order online.",
  keywords: [
    "Aarambh Restaurant menu",
    "restaurant menu Pune",
    "restaurant menu Narhe Pune",
    "Indian food Pune",
    "Maharashtrian food Pune",
    "Chinese food Pune",
    "tandoor food Pune",
    "veg food Pune",
    "non veg food Pune",
    "order food online Pune",
  ],
  alternates: {
    canonical: "/menu",
  },
  openGraph: {
    title: "Aarambh Restaurant Menu | Delicious Food in Pune",
    description:
      "Explore delicious Indian, Maharashtrian, Chinese and tandoor dishes at Aarambh Restaurant. Find your favourites and order online.",
    url: "/menu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aarambh Restaurant Menu",
    description:
      "Explore the Aarambh Restaurant menu and discover delicious food for every occasion.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <MenuClient />
      <Footer />
    </main>
  );
}
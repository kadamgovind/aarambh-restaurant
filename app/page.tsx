import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import Hero from "@/components/home/Hero";
import TrustStats from "@/components/home/TrustStats";
import FeaturedMenu from "@/components/home/FeaturedMenu";
import DiningExperience from "@/components/home/DiningExperience";
import GalleryPreview from "@/components/home/GalleryPreview";
import LocationAndHours from "@/components/home/LocationAndHours";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Aarambh Restaurant | Delicious Food & Memorable Dining",
  description:
    "Discover Aarambh Restaurant for delicious Indian, Maharashtrian, Chinese, and tandoor dishes, online food ordering, and convenient table reservations.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Aarambh Restaurant | Delicious Food & Memorable Dining",
    description:
      "Enjoy delicious food, warm hospitality, online ordering, and table reservations at Aarambh Restaurant.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <Hero />

      <TrustStats />

      <FeaturedMenu />

      <DiningExperience />

      <GalleryPreview />

      <LocationAndHours />

      <FinalCTA />

      <Footer />
    </main>
  );
}
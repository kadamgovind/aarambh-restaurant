import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import Hero from "@/components/home/Hero";
import TrustStats from "@/components/home/TrustStats";
import FeaturedMenu from "@/components/home/FeaturedMenu";
import DiningExperience from "@/components/home/DiningExperience";
import GalleryPreview from "@/components/home/GalleryPreview";
import LocationAndHours from "@/components/home/LocationAndHours";
import FinalCTA from "@/components/home/FinalCTA";

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
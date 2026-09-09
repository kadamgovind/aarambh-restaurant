import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import Hero from "@/components/home/Hero";
import TrustStats from "@/components/home/TrustStats";
import OurStory from "@/components/home/OurStory";
import Philosophy from "@/components/home/Philosophy";
import SignatureExperience from "@/components/home/SignatureExperience";
import FinalCTA from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <Hero />

      <TrustStats />

      <OurStory />

      <Philosophy />

      <SignatureExperience />

      <FinalCTA />

      <Footer />
    </main>
  );
}
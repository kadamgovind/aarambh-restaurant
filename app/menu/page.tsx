import Footer from "@/components/Footer";
import MenuClient from "./MenuClient";

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <MenuClient />
      <Footer />
    </main>
  );
}
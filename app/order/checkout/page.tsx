import Footer from "@/components/Footer";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <CheckoutClient />
      <Footer />
    </main>
  );
}
import Footer from "@/components/Footer";
import CartClient from "./CartClient";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <CartClient />
      <Footer />
    </main>
  );
}
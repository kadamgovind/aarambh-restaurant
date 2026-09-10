import Footer from "@/components/Footer";
import OrderClient from "./OrderClient";

export default function OrderPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <OrderClient />
      <Footer />
    </main>
  );
}
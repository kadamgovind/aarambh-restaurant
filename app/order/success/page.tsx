import { Suspense } from "react";
import Footer from "@/components/Footer";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Suspense
        fallback={
          <section className="flex min-h-[70vh] items-center justify-center px-6 pt-20">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

              <p className="mt-5 text-sm text-white/40">
                Loading your order...
              </p>
            </div>
          </section>
        }
      >
        <SuccessClient />
      </Suspense>

      <Footer />
    </main>
  );
}
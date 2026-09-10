"use client";

import Link from "next/link";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function OwnerRegisterPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="min-h-screen border-b border-white/10 pt-24">
        <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center justify-center px-6 py-20">
          <div className="w-full max-w-xl text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#c9a45c]/10">
              <span className="text-4xl text-[#c9a45c]">✓</span>
            </div>

            <p className="mt-10 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
              Aarambh Restaurant
            </p>

            <h1 className="mt-5 text-4xl font-light tracking-tight sm:text-5xl">
              Restaurant Partner Access
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-white/50">
              Restaurant owner accounts are created through a secure
              onboarding process. This prevents unauthorized users from
              assigning themselves an owner role.
            </p>

            <div className="mx-auto mt-10 max-w-md space-y-3">
              <Link
                href="/login"
                className="block w-full bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
              >
                Owner Sign In
              </Link>

              <Link
                href="/"
                className="block w-full border border-white/10 px-6 py-4 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
              >
                Return to Aarambh
              </Link>
            </div>

            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="text-xs leading-5 text-white/30">
                Need restaurant owner access? Contact the Aarambh
                administration team for secure onboarding.
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/register"
                className="text-sm text-[#c9a45c] transition hover:text-[#dfbd72]"
              >
                Create Customer Account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="min-h-screen border-b border-white/10 pt-24">
        <div className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl lg:grid-cols-2">

          {/* =====================================================
              LEFT — VISUAL PANEL
          ===================================================== */}

          <div className="relative hidden overflow-hidden border-r border-white/10 lg:block">
            <img
              src="/images/signature-dish.png"
              alt="AURA dining experience"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-12">
              <p className="mb-5 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                AURA Customer Account
              </p>

              <h1 className="max-w-xl text-5xl font-light leading-tight">
                Welcome
                <br />
                back to
                <br />
                <span className="italic text-[#c9a45c]">
                  AURA.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
                Your reservations, orders and dining experiences
                are always just a moment away.
              </p>
            </div>
          </div>

          {/* =====================================================
              RIGHT — FORGOT PASSWORD
          ===================================================== */}

          <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 xl:px-20">
            <div className="mx-auto w-full max-w-md">

              {!submitted ? (
                <>
                  {/* Header */}

                  <div className="mb-10">
                    <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                      Account Recovery
                    </p>

                    <h2 className="text-4xl font-light tracking-tight sm:text-5xl">
                      Forgot password?
                    </h2>

                    <p className="mt-4 text-sm leading-6 text-white/50">
                      Enter the email address connected to your
                      AURA account and we&apos;ll send you a
                      password reset link.
                    </p>
                  </div>

                  {/* Form */}

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50"
                      >
                        Email Address
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="group flex w-full items-center justify-center gap-3 bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
                    >
                      Send Reset Link

                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  </form>

                  {/* Back to Login */}

                  <div className="mt-8 text-center">
                    <Link
                      href="/login"
                      className="text-sm text-white/50 transition hover:text-[#c9a45c]"
                    >
                      ← Back to Sign In
                    </Link>
                  </div>

                  {/* Help */}

                  <div className="mt-12 border-t border-white/10 pt-6">
                    <p className="text-center text-xs leading-5 text-white/30">
                      If you don&apos;t receive an email within a
                      few minutes, check your spam or junk folder.
                    </p>
                  </div>
                </>
              ) : (
                /* =================================================
                   SUCCESS STATE
                ================================================= */

                <div className="py-10 text-center">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#c9a45c]/10">
                    <span className="text-3xl text-[#c9a45c]">
                      ✓
                    </span>
                  </div>

                  <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                    Check Your Inbox
                  </p>

                  <h2 className="mt-4 text-4xl font-light">
                    Reset link sent.
                  </h2>

                  <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-white/50">
                    If an account exists with that email address,
                    you&apos;ll receive instructions to reset your
                    password.
                  </p>

                  <div className="mt-10 space-y-3">
                    <Link
                      href="/login"
                      className="block w-full bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
                    >
                      Return to Sign In
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="w-full border border-white/10 px-6 py-4 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
                    >
                      Try Another Email
                    </button>
                  </div>

                  <p className="mt-8 text-xs text-white/30">
                    Demo mode — real email delivery and password
                    reset functionality can be connected later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const form = new FormData(e.currentTarget);

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();

    const phone = String(form.get("phone") || "").trim();

    const password = String(form.get("password") || "");
    const confirmPassword = String(
      form.get("confirmPassword") || ""
    );

    const termsAccepted = form.get("terms") === "on";

    // =========================
    // VALIDATION
    // =========================

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (name.length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }

    // Basic Indian phone validation
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!termsAccepted) {
      setError(
        "Please accept the Terms & Conditions and Privacy Policy."
      );
      return;
    }

    try {
      setLoading(true);

      // =========================
      // SUPABASE AUTH SIGNUP
      // =========================

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,

          options: {
            data: {
              full_name: name,
              phone: phone,
              role: "customer",
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error(
          "Unable to create your account. Please try again."
        );
      }

      /*
        IMPORTANT:

        We don't manually insert into profiles here.

        Your database trigger should create:

        auth.users
             ↓
        profiles
             ↓
        role = customer
      */

      setSubmitted(true);
    } catch (err) {
      console.error("Customer signup error:", err);

      let message =
        "Something went wrong. Please try again.";

      if (err instanceof Error) {
        message = err.message;
      }

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("user already registered") ||
        lowerMessage.includes("already registered")
      ) {
        message =
          "An account with this email already exists. Please sign in.";
      }

      if (
        lowerMessage.includes("email rate limit") ||
        lowerMessage.includes("rate limit")
      ) {
        message =
          "Too many signup attempts. Please wait a little and try again.";
      }

      if (lowerMessage.includes("password")) {
        message =
          "Please use a stronger password with at least 8 characters.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // GOOGLE SIGNUP
  // =========================

  async function handleGoogleSignup() {
    setError("");

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",

          options: {
            redirectTo:
              `${window.location.origin}/auth/callback`,
          },
        });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Google signup error:", err);

      setError(
        "Google sign-in is not configured yet."
      );

      setLoading(false);
    }
  }

  // =========================
  // SUCCESS
  // =========================

  if (submitted) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="min-h-screen border-b border-white/10 pt-24">
          <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center justify-center px-6 py-20">
            <div className="w-full max-w-xl text-center">

              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#c9a45c]/10">
                <span className="text-4xl text-[#c9a45c]">
                  ✓
                </span>
              </div>

              <p className="mt-10 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                Welcome to AURA
              </p>

              <h1 className="mt-5 text-4xl font-light tracking-tight sm:text-5xl">
                Your account is ready.
              </h1>

              <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-white/50">
                Your AURA customer account has been
                created successfully. You can now sign
                in and manage your reservations, orders
                and profile.
              </p>

              <div className="mx-auto mt-10 flex max-w-md flex-col gap-3">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
                >
                  Sign In
                </button>

                <Link
                  href="/"
                  className="w-full border border-white/10 px-6 py-4 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
                >
                  Return to AURA
                </Link>
              </div>

              <p className="mt-10 text-xs leading-5 text-white/25">
                Your account information is securely
                stored with AURA.
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  // =========================
  // REGISTER PAGE
  // =========================

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="min-h-screen border-b border-white/10 pt-24">
        <div className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl lg:grid-cols-2">

          {/* LEFT */}

          <div className="relative hidden overflow-hidden border-r border-white/10 lg:block">

            <img
              src="/images/signature-dish.png"
              alt="AURA signature dish"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/55" />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-12">

              <p className="mb-5 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                Welcome to AURA
              </p>

              <h1 className="max-w-xl text-5xl font-light leading-tight">
                Your table.
                <br />
                Your taste.
                <br />
                <span className="italic text-[#c9a45c]">
                  Your AURA.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
                Create your AURA account to make
                reservations, manage orders and enjoy
                a more personalized dining experience.
              </p>

            </div>
          </div>

          {/* RIGHT */}

          <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 xl:px-20">

            <div className="mx-auto w-full max-w-md">

              <div className="mb-10">

                <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                  Customer Account
                </p>

                <h2 className="text-4xl font-light tracking-tight sm:text-5xl">
                  Create account
                </h2>

                <p className="mt-4 text-sm leading-6 text-white/50">
                  Join AURA and make every dining
                  experience more personal.
                </p>

              </div>

              {error && (
                <div className="mb-6 border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* NAME */}

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your full name"
                    className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]"
                  />
                </div>

                {/* EMAIL */}

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
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]"
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 pr-20 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-[#c9a45c]"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>
                </div>

                {/* CONFIRM */}

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      required
                      minLength={8}
                      placeholder="Re-enter your password"
                      className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 pr-20 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-[#c9a45c]"
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>
                </div>

                {/* TERMS */}

                <label className="flex cursor-pointer items-start gap-3 pt-1">

                  <input
                    type="checkbox"
                    name="terms"
                    required
                    className="mt-1 h-4 w-4 accent-[#c9a45c]"
                  />

                  <span className="text-xs leading-5 text-white/45">
                    I agree to the{" "}

                    <Link
                      href="/terms"
                      className="text-white hover:text-[#c9a45c]"
                    >
                      Terms & Conditions
                    </Link>

                    {" "}and{" "}

                    <Link
                      href="/privacy"
                      className="text-white hover:text-[#c9a45c]"
                    >
                      Privacy Policy
                    </Link>

                    .
                  </span>

                </label>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-3 bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>

              {/* DIVIDER */}

              <div className="my-8 flex items-center gap-4">

                <div className="h-px flex-1 bg-white/10" />

                <span className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Or
                </span>

                <div className="h-px flex-1 bg-white/10" />

              </div>

              {/* GOOGLE */}

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 border border-white/10 bg-white/[0.02] px-6 py-4 text-sm text-white/80 transition hover:border-white/25 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-base font-medium">
                  G
                </span>

                Continue with Google
              </button>

              {/* LOGIN */}

              <p className="mt-8 text-center text-sm text-white/40">

                Already have an account?{" "}

                <Link
                  href="/login"
                  className="text-[#c9a45c] hover:text-[#dfbd72]"
                >
                  Sign in
                </Link>

              </p>

              {/* OWNER LINK */}

              <div className="mt-6 text-center">

                <p className="text-xs text-white/30">
                  Are you a restaurant owner?
                </p>

                <Link
                  href="/owner/register"
                  className="mt-2 inline-block text-sm text-[#c9a45c] hover:text-[#dfbd72]"
                >
                  Create Restaurant Owner Account →
                </Link>

              </div>

              <div className="mt-10 border-t border-white/10 pt-6 text-center">

                <p className="text-xs leading-5 text-white/30">
                  Your account information is kept private
                  and securely stored.
                </p>

              </div>

            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
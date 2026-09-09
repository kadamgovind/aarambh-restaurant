"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // CHECK EXISTING SESSION
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          router.replace("/account");
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ============================================================
  // CUSTOMER LOGIN
  // ============================================================

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const form = new FormData(e.currentTarget);

    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();

    const password = String(form.get("password") || "");

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // ========================================================
      // SUPABASE AUTHENTICATION
      // ========================================================

      const {
        data,
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error(
          "Unable to sign in. Please try again."
        );
      }

      // ========================================================
      // LOGIN SUCCESS
      // ========================================================

      router.replace("/account");
      router.refresh();
    } catch (err) {
      console.error("Customer login error:", err);

      let message =
        "Something went wrong. Please try again.";

      if (err instanceof Error) {
        message = err.message;
      }

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("invalid login credentials") ||
        lowerMessage.includes("invalid credentials")
      ) {
        message =
          "Incorrect email or password. Please try again.";
      } else if (
        lowerMessage.includes("email not confirmed")
      ) {
        message =
          "Please confirm your email address before signing in.";
      } else if (
        lowerMessage.includes("too many requests") ||
        lowerMessage.includes("rate limit")
      ) {
        message =
          "Too many login attempts. Please wait a little and try again.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  async function handleGoogleLogin() {
    setError("");

    try {
      setLoading(true);

      const {
        error: googleError,
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });

      if (googleError) {
        throw googleError;
      }
    } catch (err) {
      console.error("Google login error:", err);

      setError(
        "Google sign-in is not configured yet. Please use email and password."
      );

      setLoading(false);
    }
  }

  // ============================================================
  // SESSION CHECK SCREEN
  // ============================================================

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6 pt-24">
          <div className="flex flex-col items-center text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#c9a45c]" />

            <p className="mt-5 text-sm text-white/40">
              Checking your session...
            </p>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="min-h-screen border-b border-white/10 pt-24">
        <div className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl lg:grid-cols-2">

          {/* ==================================================
              LEFT — BRAND EXPERIENCE
          ================================================== */}

          <div className="relative hidden overflow-hidden border-r border-white/10 lg:block">

            <img
              src="/images/signature-dish.png"
              alt="Aarambh Restaurant signature dish"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/60" />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-12">

              <p className="mb-5 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                Welcome Back
              </p>

              <h1 className="max-w-xl text-5xl font-light leading-tight">
                Good food.
                <br />
                Good moments.
                <br />
                <span className="italic text-[#c9a45c]">
                  Welcome back.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
                Sign in to manage your reservations,
                orders and Aarambh customer account.
              </p>

            </div>
          </div>

          {/* ==================================================
              RIGHT — LOGIN FORM
          ================================================== */}

          <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 xl:px-20">

            <div className="mx-auto w-full max-w-md">

              {/* HEADER */}

              <div className="mb-10">

                <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                  Customer Account
                </p>

                <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
                  Welcome back
                </h1>

                <p className="mt-4 text-sm leading-6 text-white/50">
                  Sign in to manage your Aarambh
                  reservations, orders and profile.
                </p>

              </div>

              {/* ERROR */}

              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-300"
                >
                  {error}
                </div>
              )}

              {/* LOGIN FORM */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/50 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="block text-xs uppercase tracking-[0.2em] text-white/40"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#c9a45c] transition hover:text-[#d8b873]"
                    >
                      Forgot password?
                    </Link>

                  </div>

                  <div className="relative">

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      placeholder="Your password"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 pr-16 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]/50 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 transition hover:text-[#c9a45c] disabled:opacity-40"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>

                {/* REMEMBER */}

                <div className="flex items-center gap-3 pt-1">

                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    disabled={loading}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#c9a45c]"
                  />

                  <label
                    htmlFor="remember"
                    className="cursor-pointer text-xs text-white/40"
                  >
                    Keep me signed in
                  </label>

                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-[#c9a45c] py-4 text-sm font-medium text-black transition hover:bg-[#d8b873] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In

                      <span>→</span>
                    </>
                  )}
                </button>

              </form>

              {/* DIVIDER */}

              <div className="my-8 flex items-center gap-4">

                <div className="h-px flex-1 bg-white/10" />

                <span className="text-xs text-white/25">
                  OR
                </span>

                <div className="h-px flex-1 bg-white/10" />

              </div>

              {/* GOOGLE */}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.02] py-4 text-sm text-white/60 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >

                <span
                  aria-hidden="true"
                  className="text-base font-medium"
                >
                  G
                </span>

                Continue with Google

              </button>

              {/* REGISTER */}

              <p className="mt-8 text-center text-sm text-white/35">

                Don't have an account?{" "}

                <Link
                  href="/register"
                  className="text-[#c9a45c] transition hover:text-[#d8b873]"
                >
                  Create account
                </Link>

              </p>

              {/* OWNER */}

              <div className="mt-6 text-center">

                <p className="text-xs text-white/30">
                  Are you a restaurant owner?
                </p>

                <Link
                  href="/owner/login"
                  className="mt-2 inline-block text-sm text-[#c9a45c] transition hover:text-[#d8b873]"
                >
                  Owner Sign In →
                </Link>

              </div>

              {/* SECURITY NOTE */}

              <div className="mt-10 border-t border-white/10 pt-6 text-center">

                <p className="text-xs leading-5 text-white/30">
                  Your account information is securely
                  stored and protected.
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
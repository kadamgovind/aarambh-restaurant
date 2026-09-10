"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function OwnerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setCheckingSession(false);
          }
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError || !profile) {
          await supabase.auth.signOut();

          if (mounted) {
            setCheckingSession(false);
          }

          return;
        }

        const role = profile.role?.toLowerCase();

        if (role === "owner") {
          router.replace("/owner");
          return;
        }

        if (mounted) {
          setError(
            "You are already signed in with a customer account. Please use the customer account area."
          );
          setCheckingSession(false);
        }
      } catch (err) {
        console.error("Owner session check error:", err);

        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your owner email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        throw new Error(loginError.message);
      }

      if (!user) {
        throw new Error("Unable to sign in. Please try again.");
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error(
          "Unable to verify your restaurant management account."
        );
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error(
          "Your account profile could not be found."
        );
      }

      const role = profile.role?.toLowerCase();

      if (role !== "owner") {
        await supabase.auth.signOut();

        if (role === "customer") {
          throw new Error(
            "This is a customer account. Please use the customer sign in page."
          );
        }

        if (role === "admin") {
          throw new Error(
            "Admin access is not available through the owner sign in page."
          );
        }

        throw new Error(
          "This account does not have owner access."
        );
      }

      router.replace("/owner");
      router.refresh();
    } catch (err) {
      console.error("Owner login error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#c9a45c]" />

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">
            Checking management access
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="grid w-full gap-16 lg:grid-cols-[1fr_460px] lg:items-center">
          {/* Left side */}
          <div className="hidden lg:block">
            <p className="text-sm font-medium tracking-[0.35em] text-[#c9a45c]">
              AARAMBH
            </p>

            <h1 className="mt-8 max-w-xl text-6xl font-light leading-[1.05] tracking-tight">
              Restaurant
              <br />
              <span className="text-white/45">
                Management
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-8 text-white/45">
              Manage your restaurant operations, menu,
              orders, reservations, customers and business
              performance from one secure dashboard.
            </p>

            <div className="mt-12 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a45c]/30 bg-[#c9a45c]/5">
                <ShieldCheck
                  size={20}
                  className="text-[#c9a45c]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Secure Owner Access
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Access is controlled by your account role.
                </p>
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="w-full">
            <div className="mb-8 lg:hidden">
              <p className="text-sm font-medium tracking-[0.35em] text-[#c9a45c]">
                AARAMBH
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-black/30 sm:p-8">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c9a45c]/20 bg-[#c9a45c]/5">
                  <LockKeyhole
                    size={21}
                    className="text-[#c9a45c]"
                  />
                </div>

                <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                  Owner Sign In
                </p>

                <h2 className="mt-3 text-3xl font-light tracking-tight">
                  Welcome back
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Sign in to access your restaurant management
                  dashboard.
                </p>
              </div>

              {error && (
                <div className="mt-7 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-4">
                  <p className="text-sm leading-6 text-red-300">
                    {error}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                  >
                    Owner Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="owner@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-4 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs uppercase tracking-[0.2em] text-white/45"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs text-white/35 transition hover:text-[#c9a45c]"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                    />

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
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-4 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In to Dashboard
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="my-7 h-px bg-white/10" />

              <div className="text-center">
                <p className="text-xs leading-6 text-white/30">
                  Looking for the customer account?
                </p>

                <Link
                  href="/login"
                  className="mt-2 inline-block text-sm text-[#c9a45c] transition hover:text-[#dfbd72]"
                >
                  Customer Sign In →
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] leading-5 text-white/20">
              Restaurant management access is restricted to
              authorized owner accounts.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
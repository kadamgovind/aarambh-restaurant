"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recoverySessionValid, setRecoverySessionValid] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const checkRecoverySession = async () => {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error(
            "Recovery session error:",
            sessionError
          );

          setRecoverySessionValid(false);
          setError(
            "This password reset link is invalid or has expired. Please request a new reset link."
          );

          return;
        }

        if (data.session) {
          setRecoverySessionValid(true);
          setError("");
        } else {
          setRecoverySessionValid(false);
          setError(
            "This password reset link is invalid or has expired. Please request a new reset link."
          );
        }
      } catch (err) {
        console.error("Recovery session error:", err);

        if (mounted) {
          setRecoverySessionValid(false);
          setError(
            "Unable to verify the reset link. Please request a new password reset link."
          );
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "PASSWORD_RECOVERY" && session) {
          setRecoverySessionValid(true);
          setError("");
          setCheckingSession(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();

      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, []);

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (password.length > 128) {
      setError(
        "Password must be 128 characters or fewer."
      );
      return;
    }

    if (confirmPassword.length > 128) {
      setError(
        "Password must be 128 characters or fewer."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        console.error(
          "Password update error:",
          updateError
        );

        const message =
          updateError.message.toLowerCase();

        if (message.includes("same password")) {
          setError(
            "Please choose a different password from your previous one."
          );
        } else if (message.includes("password")) {
          setError(
            "Unable to update your password. Please choose a stronger password and try again."
          );
        } else {
          setError(
            "Unable to update your password. Please try again."
          );
        }

        return;
      }

      setSuccess(true);

      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      console.error(
        "Unexpected password update error:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
            <Image
              src="/images/signature-dish.png"
              alt="Aarambh Restaurant dining experience"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 0px"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-black/60" />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-12">
              <p className="mb-5 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                Aarambh Customer Account
              </p>

              <h1 className="max-w-xl text-5xl font-light leading-tight">
                A fresh
                <br />
                start with
                <br />
                <span className="italic text-[#c9a45c]">
                  Aarambh.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
                Create a new password and continue enjoying
                your reservations, orders and dining
                experiences.
              </p>
            </div>
          </div>

          {/* =====================================================
              RIGHT — RESET PASSWORD
          ===================================================== */}

          <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 xl:px-20">
            <div className="mx-auto w-full max-w-md">
              {checkingSession ? (
                /* =================================================
                   CHECKING SESSION
                ================================================= */

                <div
                  className="py-10 text-center"
                  aria-live="polite"
                >
                  <div
                    aria-hidden="true"
                    className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#c9a45c]"
                  />

                  <p className="mt-6 text-sm text-white/50">
                    Verifying your reset link...
                  </p>
                </div>
              ) : success ? (
                /* =================================================
                   SUCCESS STATE
                ================================================= */

                <div className="py-10 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#c9a45c]/40 bg-[#c9a45c]/10">
                    <span
                      aria-hidden="true"
                      className="text-3xl text-[#c9a45c]"
                    >
                      ✓
                    </span>
                  </div>

                  <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                    Password Updated
                  </p>

                  <h2 className="mt-4 text-4xl font-light">
                    You&apos;re all set.
                  </h2>

                  <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-white/50">
                    Your password has been successfully
                    updated. Redirecting you to the sign in
                    page...
                  </p>

                  <Link
                    href="/login"
                    className="mt-10 block w-full bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
                  >
                    Continue to Sign In
                  </Link>
                </div>
              ) : !recoverySessionValid ? (
                /* =================================================
                   INVALID / EXPIRED LINK
                ================================================= */

                <div className="py-10 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                    <span
                      aria-hidden="true"
                      className="text-2xl text-red-300"
                    >
                      !
                    </span>
                  </div>

                  <p className="mt-8 text-xs uppercase tracking-[0.35em] text-red-300">
                    Reset Link Problem
                  </p>

                  <h2 className="mt-4 text-4xl font-light">
                    Link unavailable
                  </h2>

                  <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-white/50">
                    {error ||
                      "This password reset link is invalid or has expired. Please request a new reset link."}
                  </p>

                  <div className="mt-10 space-y-3">
                    <Link
                      href="/forgot-password"
                      className="block w-full bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72]"
                    >
                      Request New Reset Link
                    </Link>

                    <Link
                      href="/login"
                      className="block w-full border border-white/10 px-6 py-4 text-sm text-white/70 transition hover:border-white/25 hover:text-white"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                /* =================================================
                   RESET PASSWORD FORM
                ================================================= */

                <>
                  <div className="mb-10">
                    <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                      Account Recovery
                    </p>

                    <h2 className="text-4xl font-light tracking-tight sm:text-5xl">
                      Create new password
                    </h2>

                    <p className="mt-4 text-sm leading-6 text-white/50">
                      Choose a strong new password for your
                      Aarambh account.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* New Password */}

                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50"
                      >
                        New Password
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
                          maxLength={128}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          placeholder="Enter new password"
                          disabled={loading}
                          aria-describedby="password-help"
                          className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 pr-20 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c] disabled:cursor-not-allowed disabled:opacity-50"
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
                          aria-pressed={showPassword}
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-2 text-xs text-white/40 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {showPassword
                            ? "Hide"
                            : "Show"}
                        </button>
                      </div>

                      <p
                        id="password-help"
                        className="mt-2 text-xs text-white/30"
                      >
                        Minimum 8 characters.
                      </p>
                    </div>

                    {/* Confirm Password */}

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
                          maxLength={128}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(
                              e.target.value
                            );

                            if (error) {
                              setError("");
                            }
                          }}
                          placeholder="Confirm new password"
                          disabled={loading}
                          aria-describedby={
                            error
                              ? "reset-error"
                              : undefined
                          }
                          className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 pr-20 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c] disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                          disabled={loading}
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          aria-pressed={
                            showConfirmPassword
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-2 text-xs text-white/40 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {showConfirmPassword
                            ? "Hide"
                            : "Show"}
                        </button>
                      </div>
                    </div>

                    {/* Error */}

                    {error && (
                      <div
                        id="reset-error"
                        role="alert"
                        aria-live="assertive"
                        className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
                      >
                        {error}
                      </div>
                    )}

                    {/* Submit */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex w-full items-center justify-center gap-3 bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"
                          />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          Update Password

                          <span
                            aria-hidden="true"
                            className="transition-transform group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </>
                      )}
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

                  {/* Security Note */}

                  <div className="mt-12 border-t border-white/10 pt-6">
                    <p className="text-center text-xs leading-5 text-white/30">
                      For your security, use a password that
                      is unique to your Aarambh account.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
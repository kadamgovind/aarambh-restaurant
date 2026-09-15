"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();

  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      setError(null);

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      router.push("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);

      setError(
        "We couldn't sign you out right now. Please try again."
      );
      setSigningOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#15130f] to-[#0a0a0a]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/account"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            Back to Account
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a45c]/30 bg-[#c9a45c]/10">
              <ShieldCheck
                className="h-5 w-5 text-[#c9a45c]"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c9a45c]">
                Account
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                Settings
              </h1>

              <p className="mt-2 text-sm text-white/60">
                Manage your account and security preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        {error && (
          <div
            className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300"
            role="alert"
          >
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />

            <p>{error}</p>
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Account
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Manage your basic account information.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            <Link
              href="/account/profile"
              className="group flex items-center gap-4 py-5 first:pt-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <UserRound
                  className="h-4 w-4 text-[#c9a45c]"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">
                  Personal Information
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  Update your name and phone number.
                </p>
              </div>

              <ChevronRight
                className="h-5 w-5 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/60"
                aria-hidden="true"
              />
            </Link>

            <div className="flex items-center gap-4 py-5 last:pb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <Mail
                  className="h-4 w-4 text-[#c9a45c]"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">
                  Email Address
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  Your email is managed by your authentication
                  account.
                </p>
              </div>

              <span className="hidden rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-white/35 sm:inline-flex">
                Protected
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Security
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Keep your account secure with a strong password.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/20 bg-[#c9a45c]/10">
                <KeyRound
                  className="h-4 w-4 text-[#c9a45c]"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">
                  Password
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  Reset your password securely through your
                  registered email address.
                </p>

                <Link
                  href="/forgot-password"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#c9a45c] transition hover:text-[#d8b56d]"
                >
                  Reset Password
                  <ChevronRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Session
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Sign out of your Aarambh customer account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/70 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut
              className="h-4 w-4"
              aria-hidden="true"
            />

            {signingOut ? "Signing Out..." : "Sign Out"}
          </button>
        </section>

        <section className="rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <AlertTriangle
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="font-semibold text-red-300">
                Delete Account
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Account deletion is currently unavailable from
                this page. If you want to permanently delete your
                account and associated data, please contact
                Aarambh Restaurant.
              </p>

              <p className="mt-3 text-xs leading-5 text-white/30">
                This option is intentionally protected and does not
                perform an irreversible deletion from the browser.
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-center pt-2">
          <Link
            href="/account"
            className="text-sm text-white/40 transition hover:text-white"
          >
            Return to Account
          </Link>
        </div>
      </section>
    </main>
  );
}
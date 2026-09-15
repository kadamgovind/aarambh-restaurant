"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (mounted) {
            setError("Please sign in to view your profile.");
          }

          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!data) {
          if (mounted) {
            setError(
              "Your profile could not be found. Please contact the restaurant."
            );
          }

          return;
        }

        if (
          data.role &&
          data.role !== "customer"
        ) {
          await supabase.auth.signOut();

          if (mounted) {
            setError(
              "This page is available only for customer accounts."
            );
          }

          return;
        }

        if (mounted) {
          const typedProfile = data as Profile;

          setProfile(typedProfile);
          setEmail(user.email ?? "");
          setFullName(typedProfile.full_name ?? "");
          setPhone(typedProfile.phone ?? "");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);

        if (mounted) {
          setError(
            "We couldn't load your profile right now. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      return;
    }

    setError(null);
    setSaved(false);

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Your name must be 100 characters or fewer.");
      return;
    }

    if (trimmedPhone) {
      const phoneDigits = trimmedPhone.replace(/\D/g, "");

      if (
        phoneDigits.length < 10 ||
        phoneDigits.length > 15
      ) {
        setError(
          "Please enter a valid phone number with 10 to 15 digits."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          phone: trimmedPhone || null,
        })
        .eq("id", user.id)
        .select("id, full_name, phone, role")
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedProfile = data as Profile;

      if (
        updatedProfile.role &&
        updatedProfile.role !== "customer"
      ) {
        await supabase.auth.signOut();

        setError(
          "Your account role could not be verified."
        );

        return;
      }

      setProfile(updatedProfile);
      setFullName(updatedProfile.full_name ?? "");
      setPhone(updatedProfile.phone ?? "");
      setSaved(true);
    } catch (err) {
      console.error("Failed to update profile:", err);

      setError(
        "We couldn't save your profile changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2
              className="h-8 w-8 animate-spin text-[#c9a45c]"
              aria-hidden="true"
            />

            <p className="text-sm text-white/60">
              Loading your profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
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

          <div
            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"
            role="alert"
          >
            <AlertCircle
              className="mx-auto mb-4 h-10 w-10 text-red-400"
              aria-hidden="true"
            />

            <h1 className="text-xl font-semibold">
              Unable to load profile
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">
              {error}
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#c9a45c] px-6 py-3 text-sm font-medium text-black transition hover:bg-[#d8b56d]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
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
              <User
                className="h-5 w-5 text-[#c9a45c]"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c9a45c]">
                Customer Account
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                My Profile
              </h1>

              <p className="mt-2 text-sm text-white/60">
                Manage your personal information.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSave}
          className="space-y-6"
        >
          {error && (
            <div
              className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300"
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              <p>{error}</p>
            </div>
          )}

          {saved && (
            <div
              className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300"
              role="status"
              aria-live="polite"
            >
              <Check
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              <p>Your profile has been updated successfully.</p>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="mb-7">
              <h2 className="text-lg font-semibold">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Keep your contact details up to date.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="full-name"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Full Name
                </label>

                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                    aria-hidden="true"
                  />

                  <input
                    id="full-name"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setSaved(false);
                    }}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]/50 focus:ring-1 focus:ring-[#c9a45c]/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                    aria-hidden="true"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    aria-readonly="true"
                    className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.02] py-3.5 pl-11 pr-4 text-sm text-white/50 outline-none"
                  />
                </div>

                <p className="mt-2 text-xs text-white/35">
                  Your email address is managed by your account
                  authentication settings.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                    aria-hidden="true"
                  />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setSaved(false);
                    }}
                    maxLength={20}
                    autoComplete="tel"
                    placeholder="Your phone number"
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]/50 focus:ring-1 focus:ring-[#c9a45c]/20"
                  />

                </div>

                <p className="mt-2 text-xs text-white/35">
                  Phone number is optional, but must contain 10–15
                  digits if provided.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <ShieldCheck
                  className="h-5 w-5 text-emerald-400"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="font-semibold">
                  Account Security
                </h2>

                <p className="mt-1 text-sm leading-6 text-white/50">
                  Your authentication credentials are securely
                  managed by Aarambh&apos;s authentication system.
                </p>

                <Link
                  href="/forgot-password"
                  className="mt-4 inline-flex text-sm font-medium text-[#c9a45c] transition hover:text-[#d8b56d]"
                >
                  Change your password
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white/70 transition hover:border-white/20 hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c9a45c] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#d8b56d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
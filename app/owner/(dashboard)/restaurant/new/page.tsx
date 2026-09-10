"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

export default function NewRestaurantPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const form = new FormData(e.currentTarget);

    const name = String(form.get("name") || "").trim();
    const description = String(
      form.get("description") || ""
    ).trim();
    const phone = String(form.get("phone") || "").trim();
    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();
    const address = String(form.get("address") || "").trim();
    const city = String(form.get("city") || "").trim();
    const state = String(form.get("state") || "").trim();
    const pincode = String(form.get("pincode") || "").trim();

    if (name.length < 2) {
      setError("Please enter a valid restaurant name.");
      return;
    }

    if (!phone) {
      setError("Please enter your restaurant phone number.");
      return;
    }

    if (!address) {
      setError("Please enter your restaurant address.");
      return;
    }

    if (!city) {
      setError("Please enter your city.");
      return;
    }

    if (!state) {
      setError("Please enter your state.");
      return;
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      setLoading(true);

      // -----------------------------------------------------
      // AUTH USER
      // -----------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      // -----------------------------------------------------
      // OWNER ROLE CHECK
      // -----------------------------------------------------

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (profile?.role?.toLowerCase() !== "owner") {
        router.replace("/account");
        return;
      }

      // -----------------------------------------------------
      // PREVENT MULTIPLE RESTAURANTS
      // -----------------------------------------------------

      const {
        data: existingRestaurant,
        error: existingError,
      } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (existingRestaurant) {
        router.replace("/owner");
        return;
      }

      // -----------------------------------------------------
      // SLUG
      // -----------------------------------------------------

      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (!slug) {
        throw new Error(
          "Unable to create a valid restaurant slug."
        );
      }

      // -----------------------------------------------------
      // CREATE RESTAURANT
      // -----------------------------------------------------

      const { data: restaurant, error: insertError } =
        await supabase
          .from("restaurants")
          .insert({
            owner_id: user.id,
            name,
            slug,
            description: description || null,
            phone,
            email: email || null,
            address,
            city,
            state,
            pincode,
          })
          .select("id, name, slug")
          .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (!restaurant) {
        throw new Error(
          "Restaurant could not be created."
        );
      }

      router.replace("/owner");
      router.refresh();
    } catch (err) {
      console.error(
        "Restaurant creation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create restaurant."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10 lg:px-16">
        {/* HEADER */}

        <div className="mb-10">
          <Link
            href="/owner"
            className="text-xs uppercase tracking-[0.25em] text-white/35 transition hover:text-white"
          >
            ← Owner Dashboard
          </Link>

          <p className="mt-10 text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
            Restaurant Setup
          </p>

          <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
            Create your restaurant
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
            Add your restaurant information to start
            managing your menu, orders, reservations and
            customers.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-5 py-4">
            <p className="text-sm leading-6 text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg font-medium">
              Basic Information
            </h2>

            <div className="mt-6 space-y-5">
              {/* NAME */}

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                >
                  Restaurant Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Aarambh Restaurant"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Tell customers about your restaurant..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                />
              </div>
            </div>
          </div>

          {/* CONTACT */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg font-medium">
              Contact Information
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* PHONE */}

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="restaurant@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                />
              </div>
            </div>
          </div>

          {/* ADDRESS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <h2 className="text-lg font-medium">
              Restaurant Address
            </h2>

            <div className="mt-6 space-y-5">
              {/* ADDRESS */}

              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                >
                  Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  required
                  placeholder="Building, street, area..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                />
              </div>

              {/* CITY / STATE */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    placeholder="Pune"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    placeholder="Maharashtra"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                  />
                </div>
              </div>

              {/* PINCODE */}

              <div className="max-w-xs">
                <label
                  htmlFor="pincode"
                  className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45"
                >
                  Pincode
                </label>

                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="411041"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a45c]"
                />
              </div>
            </div>
          </div>

          {/* SECURITY NOTE */}

          <div className="rounded-xl border border-[#c9a45c]/20 bg-[#c9a45c]/[0.04] p-5">
            <p className="text-xs leading-6 text-white/45">
              Your restaurant will be securely linked to
              your owner account. The database only allows
              an authenticated owner to create a restaurant
              for their own account.
            </p>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd72] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Creating Restaurant...
              </>
            ) : (
              <>
                Create Restaurant
                <span>→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
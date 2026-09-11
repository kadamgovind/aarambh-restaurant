"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Restaurant } from "@/lib/restaurant";

const exploreLinks = [
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Gallery", href: "/gallery" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact", href: "/contact" },
];

const serviceLinks = [
  { label: "Order Online", href: "/order" },
  { label: "Book a Table", href: "/booking" },
  { label: "My Account", href: "/account" },
];

export default function Footer() {
  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRestaurant = async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select(`
          id,
          owner_id,
          name,
          slug,
          description,
          phone,
          email,
          address,
          city,
          state,
          pincode,
          logo_url,
          cover_image_url,
          maps_url,
          is_active,
          restaurant_status,
          opening_hours,
          ordering_settings,
          payment_settings,
          notification_settings,
          created_at,
          updated_at
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Failed to load active restaurant:",
          error
        );
        setRestaurant(null);
        return;
      }

      setRestaurant(data as Restaurant | null);
    };

    void loadRestaurant();

    return () => {
      cancelled = true;
    };
  }, []);

  const restaurantName =
    restaurant?.name || "Aarambh Restaurant";

  const description =
    restaurant?.description ||
    "Taste That Feels Like Home. Experience delicious food, warm hospitality and a welcoming family dining environment.";

  const phone = restaurant?.phone || null;
  const email = restaurant?.email || null;

  const address = restaurant?.address || null;
  const city = restaurant?.city || null;
  const state = restaurant?.state || null;
  const pincode = restaurant?.pincode || null;

  const orderingSettings =
    restaurant?.ordering_settings || {};

  const diningOptions = [
    orderingSettings.pickup === true ? "Takeaway" : null,
    orderingSettings.delivery === true
      ? "Home Delivery"
      : null,
    orderingSettings.tableBooking === true
      ? "Table Booking"
      : null,
  ].filter(Boolean) as string[];

  const locationParts = [
    address,
    city,
    state,
    pincode,
  ].filter(Boolean) as string[];

  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="group inline-block"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white transition-colors duration-300 group-hover:text-[#c9a45c]">
                {restaurantName}
              </h2>

              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
                Restaurant
              </p>
            </Link>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/45">
              {description}
            </p>

            {/* CTA */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/booking"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c]"
              >
                Book a Table
              </Link>

              <Link
                href="/order"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c]"
              >
                Order Online
              </Link>
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
              Explore
            </p>

            <nav className="mt-5 flex flex-col gap-3">
              {exploreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Services + Contact */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
              Services
            </p>

            <nav className="mt-5 flex flex-col gap-3">
              {serviceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-sm text-white/50 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Contact */}
            {(phone || email) && (
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                  Contact
                </p>

                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="mt-3 block text-sm text-white/60 transition-colors hover:text-[#c9a45c]"
                  >
                    {phone}
                  </a>
                )}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="mt-2 block break-all text-sm text-white/60 transition-colors hover:text-[#c9a45c]"
                  >
                    {email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Location + Dining */}
        <div className="mt-14 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Location */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
              Location
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {locationParts.length > 0 ? (
                locationParts.map((part, index) => (
                  <span key={`${part}-${index}`}>
                    {part}

                    {index <
                      locationParts.length - 1 && (
                      <br />
                    )}
                  </span>
                ))
              ) : (
                <>
                  Restaurant location
                  <br />
                  Contact us for details
                </>
              )}
            </p>
          </div>

          {/* Opening Hours */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
              Opening Hours
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Check our current opening hours
              <br />
              before your visit.
            </p>
          </div>

          {/* Dining */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
              Dining
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {diningOptions.length > 0 ? (
                diningOptions.map((option, index) => (
                  <span key={option}>
                    {option}

                    {index <
                      diningOptions.length - 1 && " • "}
                  </span>
                ))
              ) : (
                "Dining options available"
              )}
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} {restaurantName}.
            All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <span className="text-xs text-white/25">
              Instagram
            </span>

            <span className="text-xs text-white/25">
              Privacy
            </span>

            <span className="text-xs text-white/25">
              Terms
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
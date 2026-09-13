import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarCheck,
  MessageCircle,
  Phone,
  ShoppingBag,
} from "lucide-react";

import { getActiveRestaurant } from "@/lib/restaurant";

export default async function Hero() {
  const restaurant = await getActiveRestaurant();

  const restaurantName =
    restaurant?.name?.trim() || "Aarambh Restaurant";

  const locationParts = [
    restaurant?.city?.trim(),
    restaurant?.state?.trim(),
  ].filter(Boolean);

  const locationLabel =
    locationParts.length > 0 ? locationParts.join(", ") : null;

  const description =
    restaurant?.description?.trim() ||
    "Delicious food, warm hospitality and a welcoming dining experience.";

  const phone = restaurant?.phone?.trim() || null;

  const cleanPhone = phone?.replace(/\D/g, "") || "";

  const whatsappNumber =
    cleanPhone.length > 0
      ? cleanPhone.startsWith("91")
        ? cleanPhone
        : `91${cleanPhone}`
      : null;

  const restaurantStatus = restaurant?.restaurant_status ?? null;

  const statusConfig = {
    open: {
      label: "Open Now",
      wrapper:
        "border-green-400/20 bg-green-400/10 text-green-300",
      dot: "bg-green-400",
    },
    temporarily_closed: {
      label: "Temporarily Closed",
      wrapper:
        "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
      dot: "bg-yellow-400",
    },
    closed: {
      label: "Closed",
      wrapper:
        "border-red-400/20 bg-red-400/10 text-red-300",
      dot: "bg-red-400",
    },
  } as const;

  const status =
    restaurantStatus && restaurantStatus in statusConfig
      ? statusConfig[
          restaurantStatus as keyof typeof statusConfig
        ]
      : null;

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-black"
      aria-labelledby="hero-title"
    >
      {/* Hero Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-food.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Main cinematic overlay */}
      <div
        className="absolute inset-0 bg-black/45"
        aria-hidden="true"
      />

      {/* Top-to-bottom gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black"
        aria-hidden="true"
      />

      {/* Strong bottom fade for next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/80 to-transparent"
        aria-hidden="true"
      />

      {/* Subtle gold atmosphere */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-[#c9a45c]/5 blur-[100px]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-[100svh] items-center px-5 pb-24 pt-32 sm:px-6 sm:pb-28 lg:px-8">
        <div className="mx-auto w-full max-w-6xl text-center">
          {/* Restaurant / Location Label */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span
              className="h-px w-7 bg-[#c9a45c]/70 sm:w-12"
              aria-hidden="true"
            />

            <p className="text-[9px] font-medium uppercase tracking-[0.32em] text-[#c9a45c] sm:text-xs sm:tracking-[0.35em]">
              {locationLabel
                ? `Family Restaurant · ${locationLabel}`
                : "Family Restaurant"}
            </p>

            <span
              className="h-px w-7 bg-[#c9a45c]/70 sm:w-12"
              aria-hidden="true"
            />
          </div>

          {/* Restaurant Name */}
          <h1
            id="hero-title"
            className="mx-auto mt-7 max-w-6xl text-[clamp(3.25rem,11vw,9rem)] font-semibold leading-[0.88] tracking-[-0.065em] text-white"
          >
            {restaurantName}
          </h1>

          {/* Small identity line */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-5 bg-white/20" aria-hidden="true" />

            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/50 sm:text-xs">
              Restaurant
            </p>

            <span className="h-px w-5 bg-white/20" aria-hidden="true" />
          </div>

          {/* Status */}
          {status && (
            <div className="mt-6 flex justify-center">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] backdrop-blur-xl ${status.wrapper}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                  aria-hidden="true"
                />

                {status.label}
              </span>
            </div>
          )}

          {/* Main Tagline */}
          <p className="mx-auto mt-7 max-w-3xl text-2xl font-medium leading-tight tracking-[-0.02em] text-white sm:mt-8 sm:text-3xl md:text-4xl">
            Taste That Feels Like Home.
          </p>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8">
            {description}
          </p>

          {/* Primary CTA */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/order"
              className="group inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#c9a45c] px-7 text-sm font-semibold text-black shadow-lg shadow-black/20 transition-all duration-300 hover:bg-[#dfbd78] hover:shadow-[#c9a45c]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a45c] sm:w-auto"
            >
              <ShoppingBag size={16} strokeWidth={1.8} />

              <span className="ml-2">Order Online</span>

              <ArrowUpRight
                size={15}
                className="ml-2 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/booking"
              className="group inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 bg-black/25 px-7 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a45c] sm:w-auto"
            >
              <CalendarCheck size={16} strokeWidth={1.8} />

              <span className="ml-2">Book a Table</span>

              <ArrowUpRight
                size={15}
                className="ml-2 opacity-50 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* Contact Actions */}
          {(phone || whatsappNumber) && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  aria-label={`Call ${restaurantName}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 text-[11px] font-medium text-white/60 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a45c]"
                >
                  <Phone
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  Call
                </a>
              )}

              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Contact ${restaurantName} on WhatsApp`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 text-[11px] font-medium text-white/60 backdrop-blur-md transition-all duration-300 hover:border-[#c9a45c]/40 hover:text-[#c9a45c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a45c]"
                >
                  <MessageCircle
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Supporting Highlights */}
          <div className="mx-auto mt-9 flex max-w-xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[9px] font-medium uppercase tracking-[0.18em] text-white/35 sm:text-[10px]">
            <span>Quality Food</span>

            <span
              className="text-[#c9a45c]/70"
              aria-hidden="true"
            >
              •
            </span>

            <span>Warm Hospitality</span>

            <span
              className="text-[#c9a45c]/70"
              aria-hidden="true"
            >
              •
            </span>

            <span>Family Dining</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 sm:bottom-7">
        <a
          href="#main-content"
          aria-label="Scroll to explore the restaurant"
          className="group flex flex-col items-center gap-2"
        >
          <span className="text-[8px] font-medium uppercase tracking-[0.35em] text-white/30 transition-colors group-hover:text-white/60">
            Explore
          </span>

          <span
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/40 backdrop-blur-sm transition-all duration-300 group-hover:border-[#c9a45c]/40 group-hover:text-[#c9a45c]"
            aria-hidden="true"
          >
            <ArrowDown
              size={13}
              className="animate-pulse"
            />
          </span>
        </a>
      </div>
    </section>
  );
}
import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";

import { getActiveRestaurant } from "@/lib/restaurant";

export default async function Hero() {
  const restaurant = await getActiveRestaurant();

  const restaurantName = restaurant?.name || "Aarambh";
  const city = restaurant?.city || "Pune";
  const state = restaurant?.state || "Maharashtra";

  const description =
    restaurant?.description ||
    "Authentic Indian flavours, Maharashtrian favourites, Chinese classics and tandoor specialties — served with warmth in Narhe, Pune.";

  const phone = restaurant?.phone || "+917498168865";

  const cleanPhone = phone.replace(/\D/g, "");

  const whatsappNumber = cleanPhone.startsWith("91")
    ? cleanPhone
    : `91${cleanPhone}`;

  const restaurantStatus = restaurant?.restaurant_status || "open";

  const statusLabel =
    restaurantStatus === "open"
      ? "Open Now"
      : restaurantStatus === "temporarily_closed"
        ? "Temporarily Closed"
        : "Closed";

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero.png')" }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Premium Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black" />

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/70 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl text-center">
          {/* Location / Cuisine */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-8 bg-[#c9a45c]/60 sm:w-12" />

            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              Family Restaurant • {city}, {state}
            </p>

            <span className="h-px w-8 bg-[#c9a45c]/60 sm:w-12" />
          </div>

          {/* Restaurant Name */}
          <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-7xl md:text-8xl lg:text-9xl">
            {restaurantName}
          </h1>

          <p className="mt-4 text-sm font-medium uppercase tracking-[0.28em] text-white/70 sm:text-base">
            Restaurant
          </p>

          {/* Restaurant Status */}
          <div className="mt-5 flex justify-center">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] backdrop-blur-md ${
                restaurantStatus === "open"
                  ? "border-green-400/20 bg-green-400/10 text-green-300"
                  : restaurantStatus === "temporarily_closed"
                    ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                    : "border-red-400/20 bg-red-400/10 text-red-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  restaurantStatus === "open"
                    ? "bg-green-400"
                    : restaurantStatus === "temporarily_closed"
                      ? "bg-yellow-400"
                      : "bg-red-400"
                }`}
              />

              {statusLabel}
            </span>
          </div>

          {/* Tagline */}
          <p className="mx-auto mt-7 max-w-2xl text-xl font-medium leading-8 text-white/90 sm:text-2xl md:text-3xl">
            Taste That Feels Like Home.
          </p>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            {description}
          </p>

          {/* Primary Actions */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/order"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#c9a45c] px-8 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#dfbd78] hover:shadow-lg hover:shadow-[#c9a45c]/20 sm:w-auto"
            >
              Order Online
              <span className="ml-2">→</span>
            </Link>

            <Link
              href="/booking"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/15 sm:w-auto"
            >
              Book a Table
            </Link>
          </div>

          {/* Contact Actions */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`tel:${phone}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-5 text-xs font-medium text-white/65 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:text-white"
            >
              <Phone size={14} strokeWidth={1.8} />
              Call Now
            </a>

            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-5 text-xs font-medium text-white/65 backdrop-blur-md transition-all duration-300 hover:border-[#c9a45c]/50 hover:text-[#c9a45c]"
            >
              <MessageCircle size={14} strokeWidth={1.8} />
              WhatsApp
            </a>
          </div>

          {/* Restaurant Highlights */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.16em] text-white/40 sm:text-xs">
            <span>Indian</span>
            <span className="text-[#c9a45c]">•</span>
            <span>Maharashtrian</span>
            <span className="text-[#c9a45c]">•</span>
            <span>Chinese</span>
            <span className="text-[#c9a45c]">•</span>
            <span>Tandoor</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.35em] text-white/35">
            Scroll
          </span>

          <div className="relative h-10 w-px overflow-hidden bg-white/20">
            <div className="absolute left-0 top-0 h-4 w-px animate-pulse bg-[#c9a45c]" />
          </div>
        </div>
      </div>
    </section>
  );
}
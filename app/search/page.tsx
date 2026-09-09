"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search,
  ArrowRight,
  Utensils,
  CalendarDays,
  Star,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const searchData = [
  {
    title: "Paneer Tikka",
    description:
      "Charcoal-grilled paneer marinated with aromatic Indian spices.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "paneer tikka starter vegetarian veg food",
  },
  {
    title: "Tandoori Chicken",
    description:
      "Classic tandoori chicken marinated in aromatic Indian spices.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "tandoori chicken starter non veg food",
  },
  {
    title: "Chicken Biryani",
    description:
      "Fragrant basmati rice layered with spiced chicken and biryani flavours.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "chicken biryani rice non veg food",
  },
  {
    title: "Aarambh Special Chicken Biryani",
    description:
      "Aarambh's special chicken biryani prepared with aromatic spices.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "aarambh special chicken biryani signature rice",
  },
  {
    title: "Paneer Butter Masala",
    description:
      "Soft paneer cooked in a rich tomato, butter and aromatic spice gravy.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "paneer butter masala vegetarian veg main course",
  },
  {
    title: "Chicken Kolhapuri",
    description:
      "A bold Maharashtrian-style chicken preparation with rich Kolhapuri flavours.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "chicken kolhapuri maharashtrian main course non veg",
  },
  {
    title: "Mutton Handi",
    description:
      "Tender mutton prepared in a rich, aromatic handi-style gravy.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "mutton handi mutton main course non veg",
  },
  {
    title: "Veg Thali",
    description:
      "A wholesome vegetarian thali featuring a selection of Indian favourites.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "veg thali vegetarian maharashtrian food",
  },
  {
    title: "Gulab Jamun",
    description:
      "Warm traditional Indian dessert served with aromatic sweet syrup.",
    category: "Menu",
    href: "/menu",
    icon: Utensils,
    keywords: "gulab jamun dessert sweet",
  },
  {
    title: "About Aarambh",
    description:
      "Discover the story, philosophy and values behind Aarambh Restaurant.",
    category: "Page",
    href: "/about",
    icon: Star,
    keywords: "about story philosophy aarambh restaurant",
  },
  {
    title: "Our Gallery",
    description:
      "Explore food, restaurant interiors, family dining and special events.",
    category: "Page",
    href: "/gallery",
    icon: Star,
    keywords: "gallery photos food interior kitchen events",
  },
  {
    title: "Guest Reviews",
    description:
      "Discover what guests say about their Aarambh dining experience.",
    category: "Page",
    href: "/reviews",
    icon: Star,
    keywords: "reviews rating guests feedback",
  },
  {
    title: "Book a Table",
    description:
      "Reserve your table for a family meal, celebration or special occasion.",
    category: "Experience",
    href: "/booking",
    icon: CalendarDays,
    keywords: "reservation booking table family dinner celebration",
  },
  {
    title: "Order Online",
    description:
      "Order your favourite Aarambh dishes for takeaway or home delivery.",
    category: "Experience",
    href: "/order",
    icon: Utensils,
    keywords: "order online takeaway delivery food",
  },
  {
    title: "Contact Aarambh",
    description:
      "Find Aarambh Restaurant's location, opening hours and contact details.",
    category: "Information",
    href: "/contact",
    icon: MapPin,
    keywords: "contact location address phone opening hours narhe pune",
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return [];
    }

    return searchData.filter((item) => {
      const searchableText = `
        ${item.title}
        ${item.description}
        ${item.category}
        ${item.keywords}
      `.toLowerCase();

      return searchableText.includes(search);
    });
  }, [query]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="border-b border-white/10 pt-32">
        <div className="mx-auto max-w-5xl px-6 pb-20 text-center lg:px-8">
          <p className="text-xs uppercase tracking-[0.4em] text-[#c9a45c]">
            Aarambh Search
          </p>

          <h1 className="mt-6 text-5xl font-light tracking-tight sm:text-7xl">
            What are you
            <br />
            <span className="italic text-[#c9a45c]">
              looking for?
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/50">
            Search our menu, discover experiences, explore Aarambh
            and find everything you need for your next visit.
          </p>

          {/* SEARCH BOX */}

          <div className="relative mx-auto mt-12 max-w-2xl">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c9a45c]" />

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, menu, reservations..."
              className="h-16 w-full border border-white/15 bg-white/[0.03] pl-14 pr-6 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a45c]"
              autoFocus
            />
          </div>

          {/* SEARCH SUGGESTIONS */}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              "Paneer",
              "Chicken",
              "Biryani",
              "Desserts",
              "Booking",
              "Reviews",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-[#c9a45c]/40 hover:text-[#c9a45c]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          SEARCH RESULTS
      ===================================================== */}

      <section className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        {!query.trim() ? (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/30">
              Explore
            </p>

            <h2 className="mt-3 text-3xl font-light">
              Popular destinations
            </h2>

            <div className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
              {/* MENU */}

              <Link
                href="/menu"
                className="group bg-black p-8 transition hover:bg-white/[0.03]"
              >
                <Utensils className="h-5 w-5 text-[#c9a45c]" />

                <h3 className="mt-6 text-xl font-light">
                  Explore the Menu
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Discover Aarambh favourites, Maharashtrian
                  specialties, biryani, tandoor and more.
                </p>

                <span className="mt-6 inline-flex items-center gap-2 text-xs text-[#c9a45c]">
                  View Menu
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              {/* BOOKING */}

              <Link
                href="/booking"
                className="group bg-black p-8 transition hover:bg-white/[0.03]"
              >
                <CalendarDays className="h-5 w-5 text-[#c9a45c]" />

                <h3 className="mt-6 text-xl font-light">
                  Reserve Your Table
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Plan your next family meal, celebration or dining
                  experience at Aarambh.
                </p>

                <span className="mt-6 inline-flex items-center gap-2 text-xs text-[#c9a45c]">
                  Book a Table
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              {/* ORDER */}

              <Link
                href="/order"
                className="group bg-black p-8 transition hover:bg-white/[0.03]"
              >
                <Utensils className="h-5 w-5 text-[#c9a45c]" />

                <h3 className="mt-6 text-xl font-light">
                  Order Online
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Enjoy your favourite Aarambh dishes through
                  takeaway or home delivery.
                </p>

                <span className="mt-6 inline-flex items-center gap-2 text-xs text-[#c9a45c]">
                  Start Order
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              {/* REVIEWS */}

              <Link
                href="/reviews"
                className="group bg-black p-8 transition hover:bg-white/[0.03]"
              >
                <Star className="h-5 w-5 text-[#c9a45c]" />

                <h3 className="mt-6 text-xl font-light">
                  Guest Reviews
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Discover what guests say about their Aarambh
                  dining experience.
                </p>

                <span className="mt-6 inline-flex items-center gap-2 text-xs text-[#c9a45c]">
                  Read Reviews
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* RESULTS HEADER */}

            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                  Search Results
                </p>

                <h2 className="mt-3 text-3xl font-light">
                  {results.length}{" "}
                  {results.length === 1 ? "result" : "results"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-xs text-white/40 transition hover:text-[#c9a45c]"
              >
                Clear search
              </button>
            </div>

            {/* RESULTS */}

            {results.length > 0 ? (
              <div className="divide-y divide-white/10 border-y border-white/10">
                {results.map((result) => {
                  const Icon = result.icon;

                  return (
                    <Link
                      key={`${result.title}-${result.category}`}
                      href={result.href}
                      className="group flex gap-5 py-7 transition hover:bg-white/[0.02]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-white/[0.02]">
                        <Icon className="h-4 w-4 text-[#c9a45c]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-light">
                            {result.title}
                          </h3>

                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                            {result.category}
                          </span>
                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                          {result.description}
                        </p>
                      </div>

                      <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-white/20 transition group-hover:translate-x-1 group-hover:text-[#c9a45c]" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* NO RESULTS */

              <div className="border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10">
                  <Search className="h-5 w-5 text-white/30" />
                </div>

                <h3 className="mt-6 text-2xl font-light">
                  No results found
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
                  We couldn&apos;t find anything matching
                  &quot;{query}&quot;. Try searching for a dish,
                  page or experience.
                </p>

                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-7 bg-[#c9a45c] px-6 py-3 text-xs font-semibold text-black transition hover:bg-[#dfbd78]"
                >
                  Explore Aarambh
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          SEARCH CTA
      ===================================================== */}

      <section className="border-y border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
            Experience Aarambh
          </p>

          <h2 className="mt-5 text-3xl font-light sm:text-4xl">
            Sometimes the best search
            <br />
            is a reservation.
          </h2>

          <Link
            href="/booking"
            className="mt-8 inline-flex items-center gap-3 bg-[#c9a45c] px-7 py-4 text-sm font-medium text-black transition hover:bg-[#dfbd78]"
          >
            Book Your Table
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
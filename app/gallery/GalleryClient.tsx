"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type GalleryCategory =
  | "All"
  | "Food"
  | "Interior"
  | "Outdoor"
  | "Kitchen"
  | "Family Dining"
  | "Events"
  | "Birthday Celebrations"
  | "Chef Specials";

type GalleryItem = {
  id: number;
  title: string;
  category: Exclude<GalleryCategory, "All">;
  image: string;
};

const categories: GalleryCategory[] = [
  "All",
  "Food",
  "Interior",
  "Outdoor",
  "Kitchen",
  "Family Dining",
  "Events",
  "Birthday Celebrations",
  "Chef Specials",
];

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "Paneer Tikka",
    category: "Food",
    image: "/images/gallery/paneer-tikka.jpg",
  },
  {
    id: 2,
    title: "Aarambh Special Chicken Biryani",
    category: "Chef Specials",
    image: "/images/gallery/chicken-biryani.jpg",
  },
  {
    id: 3,
    title: "Restaurant Interior",
    category: "Interior",
    image: "/images/gallery/interior.jpg",
  },
  {
    id: 4,
    title: "Family Dining",
    category: "Family Dining",
    image: "/images/gallery/family-dining.jpg",
  },
  {
    id: 5,
    title: "Outdoor Dining",
    category: "Outdoor",
    image: "/images/gallery/outdoor.jpg",
  },
  {
    id: 6,
    title: "Freshly Prepared Food",
    category: "Food",
    image: "/images/gallery/food.jpg",
  },
  {
    id: 7,
    title: "Our Kitchen",
    category: "Kitchen",
    image: "/images/gallery/kitchen.jpg",
  },
  {
    id: 8,
    title: "Special Celebration",
    category: "Events",
    image: "/images/gallery/events.jpg",
  },
  {
    id: 9,
    title: "Birthday Celebration",
    category: "Birthday Celebrations",
    image: "/images/gallery/birthday.jpg",
  },
  {
    id: 10,
    title: "Chef Special",
    category: "Chef Specials",
    image: "/images/gallery/chef-special.jpg",
  },
  {
    id: 11,
    title: "Dining Experience",
    category: "Family Dining",
    image: "/images/gallery/dining.jpg",
  },
  {
    id: 12,
    title: "Aarambh Ambience",
    category: "Interior",
    image: "/images/gallery/ambience.jpg",
  },
];

export default function GalleryClient() {
  const [activeCategory, setActiveCategory] =
    useState<GalleryCategory>("All");

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") {
      return galleryItems;
    }

    return galleryItems.filter(
      (item) => item.category === activeCategory
    );
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,164,92,0.14),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
            Aarambh Restaurant
          </p>

          <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Moments Worth{" "}
            <span className="text-[#c9a45c]">Remembering.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
            Explore the food, ambience, celebrations, and dining moments
            that make Aarambh Restaurant a place to enjoy and remember.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-0 z-30 border-b border-white/10 bg-[#080808]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl overflow-x-auto px-6 py-4 lg:px-8">
          <div
            className="flex min-w-max items-center justify-center gap-2"
            role="tablist"
            aria-label="Gallery categories"
          >
            {categories.map((category) => {
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#c9a45c] text-black"
                      : "border border-white/10 bg-white/[0.03] text-white/65 hover:border-[#c9a45c]/40 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => {
              const isFeatured =
                index === 0 ||
                (activeCategory === "All" && index === 3);

              return (
                <article
                  key={item.id}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${
                    isFeatured
                      ? "sm:col-span-2 lg:row-span-2"
                      : ""
                  }`}
                >
                  <div
                    className={`relative ${
                      isFeatured
                        ? "aspect-[16/11] sm:aspect-[16/10] lg:h-full lg:min-h-[500px]"
                        : "aspect-[4/3]"
                    }`}
                  >
                    <Image
                      src={item.image}
                      alt={`${item.title} - Aarambh Restaurant`}
                      fill
                      priority={index < 2}
                      sizes={
                        isFeatured
                          ? "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw"
                          : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      }
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <span className="mb-2 inline-flex rounded-full border border-[#c9a45c]/40 bg-black/40 px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#c9a45c] backdrop-blur-sm">
                        {item.category}
                      </span>

                      <h2
                        className={`font-semibold ${
                          isFeatured
                            ? "text-2xl sm:text-3xl"
                            : "text-lg"
                        }`}
                      >
                        {item.title}
                      </h2>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <p className="text-lg font-medium text-white">
              No gallery images found.
            </p>

            <p className="mt-2 text-sm text-white/50">
              Please choose another category.
            </p>

            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className="mt-6 rounded-full bg-[#c9a45c] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#d8b875]"
            >
              View All
            </button>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#0d0d0d]">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#c9a45c]">
            Your Table Awaits
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Come Create Your Own Moments.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60">
            Enjoy delicious food, warm hospitality, and a welcoming
            dining experience at Aarambh Restaurant.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center rounded-full bg-[#c9a45c] px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-[#d8b875]"
            >
              Book a Table
            </Link>

            <Link
              href="/menu"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-[#c9a45c]/50 hover:text-[#c9a45c]"
            >
              Explore Menu
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
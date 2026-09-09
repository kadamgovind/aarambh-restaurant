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
    title: "Tandoori Chicken",
    category: "Food",
    image: "/images/gallery/tandoori-chicken.jpg",
  },
  {
    id: 4,
    title: "Restaurant Interior",
    category: "Interior",
    image: "/images/gallery/interior.jpg",
  },
  {
    id: 5,
    title: "Family Dining",
    category: "Family Dining",
    image: "/images/gallery/family-dining.jpg",
  },
  {
    id: 6,
    title: "Restaurant Entrance",
    category: "Outdoor",
    image: "/images/gallery/outdoor.jpg",
  },
  {
    id: 7,
    title: "Kitchen",
    category: "Kitchen",
    image: "/images/gallery/kitchen.jpg",
  },
  {
    id: 8,
    title: "Birthday Celebration",
    category: "Birthday Celebrations",
    image: "/images/gallery/birthday.jpg",
  },
  {
    id: 9,
    title: "Family Celebration",
    category: "Events",
    image: "/images/gallery/event.jpg",
  },
  {
    id: 10,
    title: "Paneer Butter Masala",
    category: "Chef Specials",
    image: "/images/gallery/paneer-butter-masala.jpg",
  },
  {
    id: 11,
    title: "Chicken Kolhapuri",
    category: "Food",
    image: "/images/gallery/chicken-kolhapuri.jpg",
  },
  {
    id: 12,
    title: "Mutton Handi",
    category: "Chef Specials",
    image: "/images/gallery/mutton-handi.jpg",
  },
];

export default function GalleryPage() {
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
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,164,92,0.13),transparent_38%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-24">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
              Aarambh Restaurant
            </p>

            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Moments Worth
              <span className="block text-[#c9a45c]">
                Remembering.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Explore the flavours, spaces and memorable moments
              that make Aarambh a place to gather, celebrate and
              enjoy good food together.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="mx-auto max-w-7xl px-6 pt-10 sm:px-8 lg:px-12">
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {categories.map((category) => {
            const active = activeCategory === category;

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm transition ${
                  active
                    ? "border-[#c9a45c] bg-[#c9a45c] text-black"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-[#c9a45c]/50 hover:text-white"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <p className="text-lg text-white/60">
              No gallery images available in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => (
              <article
                key={item.id}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] ${
                  index % 5 === 0
                    ? "lg:row-span-2"
                    : ""
                }`}
              >
                <div
                  className={`relative w-full ${
                    index % 5 === 0
                      ? "h-[520px] sm:h-[580px] lg:h-full"
                      : "h-[300px] sm:h-[340px]"
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />

                  {/* Image Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80" />

                  {/* Category */}
                  <div className="absolute left-5 top-5">
                    <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-white/80 backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-xl font-medium tracking-tight">
                      {item.title}
                    </h2>

                    <div className="mt-3 h-px w-10 bg-[#c9a45c] transition-all duration-300 group-hover:w-20" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Experience Section */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.25em] text-[#c9a45c]">
                Your Table Awaits
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Come create your own Aarambh moment.
              </h2>

              <p className="mt-5 leading-8 text-white/55">
                Whether it is a family dinner, a special celebration
                or simply an evening of great food, we would love to
                welcome you.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/booking"
                className="rounded-full bg-[#c9a45c] px-7 py-3.5 text-center text-sm font-semibold text-black transition hover:bg-[#d8b873]"
              >
                Book a Table
              </Link>

              <Link
                href="/menu"
                className="rounded-full border border-white/15 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:border-[#c9a45c]/60 hover:text-[#c9a45c]"
              >
                Explore Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Review = {
  id: number;
  name: string;
  initials: string;
  visit: string;
  rating: number;
  text: string;
};

const reviews: Review[] = [
  {
    id: 1,
    name: "Rahul",
    initials: "R",
    visit: "Family Dining",
    rating: 5,
    text: "A comfortable place for a family dinner. The food was enjoyable and the overall atmosphere felt warm and welcoming.",
  },
  {
    id: 2,
    name: "Sneha",
    initials: "S",
    visit: "Dinner",
    rating: 5,
    text: "Loved the food and the relaxed dining experience. A good place to spend an evening with family and friends.",
  },
  {
    id: 3,
    name: "Amit",
    initials: "A",
    visit: "Lunch",
    rating: 5,
    text: "The biryani and tandoor dishes were the highlights of our meal. The overall experience was pleasant.",
  },
  {
    id: 4,
    name: "Priya",
    initials: "P",
    visit: "Family Celebration",
    rating: 5,
    text: "We had a lovely family celebration here. The atmosphere was comfortable and the food made the occasion special.",
  },
  {
    id: 5,
    name: "Vikas",
    initials: "V",
    visit: "Dinner",
    rating: 4,
    text: "Nice ambience and a good variety of dishes. We enjoyed trying different items from the menu.",
  },
  {
    id: 6,
    name: "Neha",
    initials: "N",
    visit: "Birthday Celebration",
    rating: 5,
    text: "A nice place for a small celebration. The evening was comfortable, relaxed and enjoyable.",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={
            index < rating
              ? "text-[#c9a45c]"
              : "text-white/20"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [visibleReviews, setVisibleReviews] = useState(6);

  const displayedReviews = reviews.slice(0, visibleReviews);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,164,92,0.14),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-24">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.3em] text-[#c9a45c]">
              Guest Experiences
            </p>

            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Words From
              <span className="block text-[#c9a45c]">
                Our Guests.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Every meal is an experience. Discover what guests
              appreciate about dining, celebrating and spending time
              at Aarambh Restaurant.
            </p>
          </div>
        </div>
      </section>

      {/* Review Highlights */}
      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">
              Experience
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Family Friendly
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/50">
              A comfortable setting for family meals, gatherings and
              special occasions.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">
              Cuisine
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Multi-Cuisine
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/50">
              Indian, Maharashtrian, Chinese and tandoor favourites
              brought together in one menu.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">
              Moments
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Made to Gather
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/50">
              From casual dinners to birthdays and family celebrations,
              there is always a reason to gather.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[#c9a45c]">
                Guest Reviews
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                What our guests say
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/45">
              Real customer feedback can be connected here later
              through your preferred review source or database.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedReviews.map((review) => (
              <article
                key={review.id}
                className="group rounded-3xl border border-white/10 bg-[#0d0d0d] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c9a45c]/30"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a45c]/30 bg-[#c9a45c]/10 text-sm font-semibold text-[#c9a45c]">
                      {review.initials}
                    </div>

                    <div>
                      <h3 className="font-medium">
                        {review.name}
                      </h3>

                      <p className="mt-1 text-xs text-white/40">
                        {review.visit}
                      </p>
                    </div>
                  </div>

                  <span className="text-white/20">“</span>
                </div>

                {/* Rating */}
                <div className="mt-6">
                  <Stars rating={review.rating} />
                </div>

                {/* Review */}
                <p className="mt-5 text-sm leading-7 text-white/60">
                  “{review.text}”
                </p>

                <div className="mt-7 h-px w-10 bg-[#c9a45c] transition-all duration-300 group-hover:w-16" />
              </article>
            ))}
          </div>

          {visibleReviews < reviews.length && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleReviews(reviews.length)}
                className="rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-white transition hover:border-[#c9a45c]/60 hover:text-[#c9a45c]"
              >
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Share Experience */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-7 py-14 text-center sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,164,92,0.09),transparent_55%)]" />

          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-[#c9a45c]">
              Your Experience Matters
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Had a great experience at Aarambh?
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/50 sm:text-base">
              We would love to hear about your visit. Share your
              experience and help other guests discover Aarambh.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-full bg-[#c9a45c] px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-[#d8b873]"
              >
                Share Your Experience
              </Link>

              <Link
                href="/menu"
                className="rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-[#c9a45c]/60 hover:text-[#c9a45c]"
              >
                Explore Our Menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center sm:px-8 lg:px-12">
          <p className="text-sm uppercase tracking-[0.25em] text-[#c9a45c]">
            Aarambh Restaurant
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Good food is better when shared.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/45">
            Bring your family and friends. We will take care of the
            rest.
          </p>

          <Link
            href="/booking"
            className="mt-7 inline-flex rounded-full bg-[#c9a45c] px-8 py-3.5 text-sm font-semibold text-black transition hover:bg-[#d8b873]"
          >
            Book a Table
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
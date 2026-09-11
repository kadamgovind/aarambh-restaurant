"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    setLoading(false);
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* HERO */}
      <section className="border-b border-white/10 px-6 pb-24 pt-36 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 text-xs uppercase tracking-[0.4em] text-[#c9a45c]">
            Contact Aarambh
          </p>

          <h1 className="max-w-5xl text-5xl font-light tracking-tight md:text-7xl">
            Let&apos;s make your
            <br />
            next visit special.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-white/50">
            Whether you&apos;re planning a family dinner, celebration or
            simply want to know more about Aarambh, we&apos;d love to hear
            from you.
          </p>
        </div>
      </section>

      {/* CONTACT INFORMATION */}
      <section className="border-b border-white/10 px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* LOCATION */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
            <span className="text-2xl text-[#c9a45c]">⌖</span>

            <p className="mt-6 text-xs uppercase tracking-[0.25em] text-white/35">
              Visit Us
            </p>

            <p className="mt-4 text-sm leading-7 text-white/65">
              Narhe
              <br />
              Pune, Maharashtra
              <br />
              411041, India
            </p>

            <p className="mt-4 text-xs leading-5 text-white/30">
              Exact restaurant address will be added once the official
              location is confirmed.
            </p>
          </div>

          {/* HOURS */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
            <span className="text-2xl text-[#c9a45c]">◷</span>

            <p className="mt-6 text-xs uppercase tracking-[0.25em] text-white/35">
              Opening Hours
            </p>

            <p className="mt-4 text-sm leading-7 text-white/65">
              Monday – Sunday
              <br />
              11:00 AM – 11:00 PM
            </p>

            <p className="mt-4 text-xs leading-6 text-[#c9a45c]">
              Lunch: 11:00 AM – 3:30 PM
              <br />
              Dinner: 7:00 PM – 11:00 PM
            </p>
          </div>

          {/* PHONE */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
            <span className="text-2xl text-[#c9a45c]">☎</span>

            <p className="mt-6 text-xs uppercase tracking-[0.25em] text-white/35">
              Call Us
            </p>

            <a
              href="tel:+917498168865"
              className="mt-4 block text-sm text-white/65 transition hover:text-[#c9a45c]"
            >
              +91 74981 68865
            </a>

            <p className="mt-2 text-xs text-white/30">
              Available during restaurant hours
            </p>
          </div>

          {/* EMAIL */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
            <span className="text-2xl text-[#c9a45c]">✉</span>

            <p className="mt-6 text-xs uppercase tracking-[0.25em] text-white/35">
              Email
            </p>

            <a
              href="mailto:fec@aarambhrestaurant.in"
              className="mt-4 block break-all text-sm text-white/65 transition hover:text-[#c9a45c]"
            >
              fec@aarambhrestaurant.in
            </a>

            <p className="mt-2 text-xs text-white/30">
              Send us your enquiry anytime
            </p>
          </div>
        </div>
      </section>

      {/* FORM + LOCATION */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          {/* FORM */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
              Get In Touch
            </p>

            <h2 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">
              Send us a message.
            </h2>

            <p className="mt-6 max-w-xl leading-7 text-white/45">
              Have a question, special request or event enquiry?
              Complete the form and we&apos;ll get back to you.
            </p>

            {submitted ? (
              <div className="mt-10 rounded-3xl border border-[#c9a45c]/30 bg-[#c9a45c]/5 p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c9a45c]/10 text-2xl text-[#c9a45c]">
                  ✓
                </div>

                <h3 className="mt-6 text-2xl font-light">
                  Message received.
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/45">
                  Thank you for contacting Aarambh. Our team will
                  get back to you shortly.
                </p>

                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-7 rounded-full border border-white/15 px-6 py-3 text-sm transition hover:border-white/30"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-10 space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <input
                    required
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    autoComplete="name"
                    className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm outline-none placeholder:text-white/25 focus:border-[#c9a45c]/50"
                  />

                  <input
                    required
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    autoComplete="tel"
                    className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm outline-none placeholder:text-white/25 focus:border-[#c9a45c]/50"
                  />
                </div>

                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm outline-none placeholder:text-white/25 focus:border-[#c9a45c]/50"
                />

                <select
                  required
                  name="enquiry"
                  defaultValue=""
                  className="w-full rounded-2xl border border-white/10 bg-[#0b0b0b] px-5 py-4 text-sm text-white/50 outline-none focus:border-[#c9a45c]/50"
                >
                  <option value="" disabled>
                    Select Enquiry Type
                  </option>

                  <option value="reservation">
                    Table Reservation
                  </option>

                  <option value="order">
                    Online Order
                  </option>

                  <option value="event">
                    Events & Celebrations
                  </option>

                  <option value="feedback">
                    Feedback
                  </option>

                  <option value="general">
                    General Enquiry
                  </option>
                </select>

                <textarea
                  required
                  name="message"
                  rows={6}
                  placeholder="Your Message"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-sm outline-none placeholder:text-white/25 focus:border-[#c9a45c]/50"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#c9a45c] px-8 py-4 text-sm font-medium text-black transition hover:bg-[#d8b873] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* LOCATION */}
          <div>
            <div className="relative min-h-[560px] overflow-hidden rounded-3xl border border-white/10 bg-[#111]">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute left-[15%] top-[20%] h-px w-[80%] rotate-12 bg-white/20" />

                <div className="absolute left-[5%] top-[45%] h-px w-[95%] -rotate-6 bg-white/15" />

                <div className="absolute left-[25%] top-[70%] h-px w-[80%] rotate-3 bg-white/15" />

                <div className="absolute left-[30%] top-0 h-full w-px rotate-[18deg] bg-white/15" />

                <div className="absolute left-[65%] top-0 h-full w-px -rotate-[12deg] bg-white/15" />
              </div>

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,164,92,0.12),transparent_45%)]" />

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute -inset-5 animate-ping rounded-full bg-[#c9a45c]/10" />

                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a45c]/50 bg-black text-2xl text-[#c9a45c] shadow-2xl">
                    ⌖
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/80 p-6 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                  Aarambh Restaurant
                </p>

                <p className="mt-3 text-sm leading-6 text-white/60">
                  Narhe
                  <br />
                  Pune, Maharashtra – 411041
                  <br />
                  India
                </p>

                <p className="mt-4 text-xs leading-5 text-white/35">
                  Official map location will be connected after the
                  restaurant&apos;s exact address is confirmed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="border-y border-white/10 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
                Events & Celebrations
              </p>

              <h2 className="mt-5 text-4xl font-light tracking-tight md:text-5xl">
                Make your occasion
                <br />
                memorable.
              </h2>
            </div>

            <div>
              <p className="leading-8 text-white/45">
                Planning a birthday, family gathering or special
                celebration? Contact Aarambh and let us know how we
                can help make your occasion special.
              </p>

              <a
                href="tel:+917498168865"
                className="mt-7 inline-block rounded-full border border-white/15 px-7 py-3.5 text-sm transition hover:border-[#c9a45c]/50 hover:text-[#c9a45c]"
              >
                Call About Events
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#c9a45c]">
            Aarambh Restaurant
          </p>

          <h2 className="mt-6 text-4xl font-light tracking-tight md:text-6xl">
            Your table is
            <br />
            waiting.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/40">
            Good food, warm hospitality and moments worth sharing.
          </p>

          <Link
            href="/booking"
            className="mt-10 inline-block rounded-full bg-[#c9a45c] px-9 py-4 text-sm font-medium text-black transition hover:bg-[#d8b873]"
          >
            Book a Table
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
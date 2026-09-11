"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function BookingPage() {
  const router = useRouter();

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [defaultName, setDefaultName] = useState("");
  const [defaultPhone, setDefaultPhone] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setDefaultName(profile.full_name || "");
        setDefaultPhone(profile.phone || "");
      }

      setCheckingUser(false);
    }

    void loadUser();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const date = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");
    const guests = Number(formData.get("guests") || 0);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const request = String(formData.get("request") || "").trim();

    if (!userId) {
      setError("Please login before making a reservation.");
      setLoading(false);
      return;
    }

    if (!date || !time || !guests || !name || !phone) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const {
        data: restaurant,
        error: restaurantError,
      } = await supabase
        .from("restaurants")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (restaurantError) {
        console.error("Restaurant loading error:", restaurantError);
        setError("Unable to load restaurant information.");
        setLoading(false);
        return;
      }

      if (!restaurant) {
        setError("Restaurant information was not found.");
        setLoading(false);
        return;
      }

      const reservationTime = convertTo24Hour(time);

      const { error: reservationError } = await supabase
        .from("reservations")
        .insert({
          restaurant_id: restaurant.id,
          customer_id: userId,
          reservation_date: date,
          reservation_time: reservationTime,
          guests,
          customer_name: name,
          customer_phone: phone,
          special_request: request || null,
        });

      if (reservationError) {
        console.error(
          "Reservation creation error:",
          reservationError
        );

        setError(
          reservationError.message ||
            "Unable to create reservation."
        );

        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);

      event.currentTarget.reset();
    } catch (err) {
      console.error("Booking error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function convertTo24Hour(time: string) {
    const [timePart, modifier] = time.split(" ");
    const [hoursValue, minutes] = timePart.split(":").map(Number);

    let hours = hoursValue;

    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:00`;
  }

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center">
          <p className="text-sm text-white/50">
            Checking your account...
          </p>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-40 sm:pb-24 sm:pt-48 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
              Reservations
            </p>

            <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-8xl">
              Your table
              <br />
              <span className="text-white/45">awaits.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Reserve your table at AURA and enjoy an evening of
              exceptional Indian cuisine, thoughtful hospitality and
              unforgettable moments.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.65fr] lg:gap-20">
            <div className="rounded-2xl border border-white/10 bg-black p-6 sm:p-8 lg:p-10">
              {submitted ? (
                <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a45c]/40">
                    <span className="text-2xl text-[#c9a45c]">
                      ✓
                    </span>
                  </div>

                  <p className="mt-7 text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                    Reservation Request Received
                  </p>

                  <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Thank you.
                  </h2>

                  <p className="mt-5 max-w-md text-sm leading-7 text-white/50">
                    Your reservation request has been received.
                    Our team will contact you shortly to confirm
                    your table.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-8 rounded-full border border-white/20 px-6 py-3 text-sm text-white transition hover:border-[#c9a45c] hover:text-[#c9a45c]"
                  >
                    Make Another Reservation
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                      Reserve a Table
                    </p>

                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                      Plan your visit.
                    </h2>

                    <p className="mt-4 text-sm leading-7 text-white/45">
                      Tell us when you would like to dine and we
                      will take care of the rest.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="mt-10 space-y-7"
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="date"
                          className="text-xs uppercase tracking-[0.2em] text-white/40"
                        >
                          Date
                        </label>

                        <input
                          id="date"
                          name="date"
                          type="date"
                          required
                          min={new Date()
                            .toISOString()
                            .split("T")[0]}
                          className="mt-3 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#c9a45c]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="time"
                          className="text-xs uppercase tracking-[0.2em] text-white/40"
                        >
                          Time
                        </label>

                        <select
                          id="time"
                          name="time"
                          required
                          defaultValue=""
                          className="mt-3 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#c9a45c]"
                        >
                          <option value="" disabled>
                            Select time
                          </option>

                          <option value="12:00 PM">12:00 PM</option>
                          <option value="12:30 PM">12:30 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="1:30 PM">1:30 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="2:30 PM">2:30 PM</option>

                          <option value="7:00 PM">7:00 PM</option>
                          <option value="7:30 PM">7:30 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="8:30 PM">8:30 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="9:30 PM">9:30 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="guests"
                        className="text-xs uppercase tracking-[0.2em] text-white/40"
                      >
                        Number of Guests
                      </label>

                      <select
                        id="guests"
                        name="guests"
                        required
                        defaultValue="2"
                        className="mt-3 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#c9a45c]"
                      >
                        {Array.from(
                          { length: 10 },
                          (_, index) => index + 1
                        ).map((guest) => (
                          <option
                            key={guest}
                            value={guest}
                          >
                            {guest}{" "}
                            {guest === 1
                              ? "Guest"
                              : "Guests"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="name"
                        className="text-xs uppercase tracking-[0.2em] text-white/40"
                      >
                        Full Name
                      </label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        defaultValue={defaultName}
                        placeholder="Your name"
                        className="mt-3 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-[#c9a45c]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="text-xs uppercase tracking-[0.2em] text-white/40"
                      >
                        Phone Number
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        defaultValue={defaultPhone}
                        placeholder="+91 XXXXX XXXXX"
                        className="mt-3 w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-[#c9a45c]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="request"
                        className="text-xs uppercase tracking-[0.2em] text-white/40"
                      >
                        Special Request
                      </label>

                      <textarea
                        id="request"
                        name="request"
                        rows={4}
                        placeholder="Birthday, anniversary, dietary requirements..."
                        className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-[#c9a45c]"
                      />
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-white px-7 py-4 text-sm font-medium text-black transition hover:bg-[#c9a45c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading
                        ? "Submitting..."
                        : "Request Reservation"}
                    </button>

                    <p className="text-center text-xs leading-6 text-white/30">
                      Your reservation is subject to availability.
                      AURA will contact you to confirm your booking.
                    </p>
                  </form>
                </>
              )}
            </div>

            <aside className="lg:pt-10">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c9a45c]">
                Visit AURA
              </p>

              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                An evening
                <br />
                worth remembering.
              </h2>

              <div className="mt-10 space-y-8">
                <div className="border-t border-white/10 pt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Location
                  </p>

                  <p className="mt-3 text-sm leading-7 text-white/60">
                    24 Heritage Avenue
                    <br />
                    Mumbai, Maharashtra
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Opening Hours
                  </p>

                  <p className="mt-3 text-sm leading-7 text-white/60">
                    Monday – Sunday
                    <br />
                    12:00 PM – 11:30 PM
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Contact
                  </p>

                  <p className="mt-3 text-sm leading-7 text-white/60">
                    +91 98765 43210
                    <br />
                    hello@aura-restaurant.com
                  </p>
                </div>
              </div>

              <div className="mt-10 rounded-2xl border border-[#c9a45c]/20 bg-[#c9a45c]/5 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c9a45c]">
                  Dining Note
                </p>

                <p className="mt-3 text-sm leading-7 text-white/50">
                  For larger groups and private dining experiences,
                  please contact our team directly.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
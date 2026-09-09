"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type FoodItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
};

type Cart = Record<number, number>;

const foodItems: FoodItem[] = [
  {
    id: 1,
    name: "Truffle Paneer Tikka",
    price: 495,
    category: "Starters",
    image: "/images/food/paneer-tikka.jpg",
  },
  {
    id: 2,
    name: "Tandoori Chicken",
    price: 595,
    category: "Starters",
    image: "/images/food/tandoori-chicken.jpg",
  },
  {
    id: 3,
    name: "Butter Chicken",
    price: 645,
    category: "Main Course",
    image: "/images/food/butter-chicken.jpg",
  },
  {
    id: 4,
    name: "Paneer Makhani",
    price: 545,
    category: "Main Course",
    image: "/images/food/paneer-makhani.jpg",
  },
  {
    id: 5,
    name: "Dal AURA",
    price: 425,
    category: "Main Course",
    image: "/images/food/dal-aura.jpg",
  },
  {
    id: 6,
    name: "AURA Hakka Noodles",
    price: 395,
    category: "Chinese",
    image: "/images/food/hakka-noodles.jpg",
  },
  {
    id: 7,
    name: "Chilli Chicken",
    price: 495,
    category: "Chinese",
    image: "/images/food/chilli-chicken.jpg",
  },
  {
    id: 8,
    name: "Masala Dosa",
    price: 295,
    category: "South Indian",
    image: "/images/food/masala-dosa.jpg",
  },
  {
    id: 9,
    name: "Gulab Jamun",
    price: 225,
    category: "Desserts",
    image: "/images/food/gulab-jamun.jpg",
  },
  {
    id: 10,
    name: "Chocolate Rasmalai",
    price: 295,
    category: "Desserts",
    image: "/images/food/chocolate-rasmalai.jpg",
  },
  {
    id: 11,
    name: "Masala Chai",
    price: 145,
    category: "Drinks",
    image: "/images/food/masala-chai.jpg",
  },
  {
    id: 12,
    name: "Mango Cooler",
    price: 195,
    category: "Drinks",
    image: "/images/food/mango-cooler.jpg",
  },
];

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart>({});
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    async function loadCheckout() {
      try {
        const savedCart = localStorage.getItem("aura_cart");

        if (!savedCart) {
          router.replace("/cart");
          return;
        }

        const parsedCart = JSON.parse(savedCart) as Cart;

        if (Object.keys(parsedCart).length === 0) {
          router.replace("/cart");
          return;
        }

        setCart(parsedCart);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .single();

          if (profile) {
            setName(profile.full_name || "");
            setPhone(profile.phone || "");
          }
        }
      } catch (error) {
        console.error("Checkout loading error:", error);
        router.replace("/cart");
      } finally {
        setLoading(false);
      }
    }

    loadCheckout();
  }, [router]);

  const cartItems = useMemo(() => {
    return foodItems
      .filter((item) => cart[item.id])
      .map((item) => ({
        ...item,
        quantity: cart[item.id],
      }));
  }, [cart]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const deliveryFee = subtotal === 0 || subtotal > 999 ? 0 : 49;

  const taxes = Math.round(subtotal * 0.05);

  const total = subtotal + deliveryFee + taxes;

  function formatPrice(amount: number) {
    return `₹${amount.toLocaleString("en-IN")}`;
  }

  async function handlePlaceOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    if (!city.trim()) {
      alert("Please enter your city.");
      return;
    }

    setPlacingOrder(true);

    /*
      IMPORTANT:
      Abhi actual Supabase order creation nahi kiya gaya hai.

      Orders database connect karne ke liye:
      - orders
      - order_items
      - payment

      ki exact schema verify karni hogi.
    */

    const checkoutData = {
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        deliveryNote: deliveryNote.trim(),
      },
      paymentMethod,
      items: cartItems,
      subtotal,
      deliveryFee,
      taxes,
      total,
    };

    localStorage.setItem(
      "aura_checkout",
      JSON.stringify(checkoutData)
    );

    setTimeout(() => {
      router.push("/success");
    }, 500);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-white/50">
              Loading checkout...
            </p>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/40">
              AURA
            </p>

            <h1 className="text-4xl font-semibold">
              Your cart is empty
            </h1>

            <p className="mt-4 text-white/50">
              Add some delicious dishes before checkout.
            </p>

            <Link
              href="/order"
              className="mt-8 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Browse Menu
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="border-b border-white/10 px-6 pb-10 pt-28">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/40">
            AURA Restaurant
          </p>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Checkout
              </h1>

              <p className="mt-4 max-w-xl text-white/50">
                Complete your details and choose your preferred
                payment method.
              </p>
            </div>

            <Link
              href="/cart"
              className="text-sm text-white/60 transition hover:text-white"
            >
              ← Back to Cart
            </Link>
          </div>
        </div>
      </section>

      <form
        onSubmit={handlePlaceOrder}
        className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_420px]"
      >
        {/* LEFT */}
        <div className="space-y-8">
          {/* DELIVERY DETAILS */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="mb-7">
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                Step 01
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Delivery Details
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Where should we deliver your order?
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Full Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Your full name"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Phone Number
                </label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">
                  Delivery Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={4}
                  placeholder="House / Flat / Building, Street, Area"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  City
                </label>

                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  type="text"
                  placeholder="Your city"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Delivery Note
                </label>

                <input
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  type="text"
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>
            </div>
          </section>

          {/* PAYMENT */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="mb-7">
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                Step 02
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Payment Method
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Select how you want to pay.
              </p>
            </div>

            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-5 transition ${
                  paymentMethod === "cod"
                    ? "border-white/40 bg-white/[0.08]"
                    : "border-white/10 bg-black hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                    💵
                  </div>

                  <div>
                    <p className="font-medium">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Pay when your order arrives
                    </p>
                  </div>
                </div>

                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-5 transition ${
                  paymentMethod === "upi"
                    ? "border-white/40 bg-white/[0.08]"
                    : "border-white/10 bg-black hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                    📱
                  </div>

                  <div>
                    <p className="font-medium">
                      UPI
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Pay securely using UPI
                    </p>
                  </div>
                </div>

                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-5 transition ${
                  paymentMethod === "card"
                    ? "border-white/40 bg-white/[0.08]"
                    : "border-white/10 bg-black hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                    💳
                  </div>

                  <div>
                    <p className="font-medium">
                      Card
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Credit or debit card
                    </p>
                  </div>
                </div>

                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </label>
            </div>

            {(paymentMethod === "upi" ||
              paymentMethod === "card") && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black p-5">
                <p className="text-sm font-medium">
                  Online payment
                </p>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  Online payment gateway integration will be
                  connected in the next backend step.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Order Summary
              </h2>

              <Link
                href="/cart"
                className="text-xs text-white/40 hover:text-white"
              >
                Edit
              </Link>
            </div>

            <div className="space-y-5">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>

                  <p className="text-sm font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="my-6 h-px bg-white/10" />

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">
                  Subtotal
                </span>

                <span>
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/50">
                  Delivery
                </span>

                <span>
                  {deliveryFee === 0
                    ? "FREE"
                    : formatPrice(deliveryFee)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/50">
                  Taxes
                </span>

                <span>
                  {formatPrice(taxes)}
                </span>
              </div>
            </div>

            <div className="my-6 h-px bg-white/10" />

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/40">
                  Total
                </p>

                <p className="mt-1 text-3xl font-semibold">
                  {formatPrice(total)}
                </p>
              </div>

              <p className="text-xs text-white/40">
                INR
              </p>
            </div>

            <button
              type="submit"
              disabled={placingOrder}
              className="mt-7 w-full rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placingOrder
                ? "Processing..."
                : `Place Order • ${formatPrice(total)}`}
            </button>

            <div className="mt-5 text-center">
              <p className="text-[11px] leading-5 text-white/30">
                By placing this order, you agree to AURA's
                terms and ordering policies.
              </p>
            </div>
          </div>
        </aside>
      </form>

      <Footer />
    </main>
  );
}
"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useMemo, useState } from "react";

type FoodItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  type: "Veg" | "Non-Veg";
  image: string;
};

type Cart = Record<number, number>;

const foodItems: FoodItem[] = [
  {
    id: 1,
    name: "Truffle Paneer Tikka",
    description: "Charred paneer, truffle oil and aromatic spices.",
    price: 495,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 2,
    name: "Tandoori Chicken",
    description: "Classic tandoori chicken with AURA spices.",
    price: 595,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 3,
    name: "Butter Chicken",
    description: "Slow-cooked chicken in a rich tomato butter sauce.",
    price: 645,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 4,
    name: "Paneer Makhani",
    description: "Silky tomato gravy, paneer and subtle spices.",
    price: 545,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 5,
    name: "Dal AURA",
    description: "Slow-cooked black lentils finished with butter.",
    price: 425,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 6,
    name: "AURA Hakka Noodles",
    description: "Wok-tossed noodles with fresh vegetables.",
    price: 395,
    category: "Chinese",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 7,
    name: "Chilli Chicken",
    description: "Crispy chicken tossed in chilli garlic sauce.",
    price: 495,
    category: "Chinese",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 8,
    name: "Masala Dosa",
    description: "Crisp dosa served with potato masala and chutneys.",
    price: 295,
    category: "South Indian",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 9,
    name: "Gulab Jamun",
    description: "Warm gulab jamun served with fragrant syrup.",
    price: 225,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 10,
    name: "Chocolate Rasmalai",
    description: "AURA's modern take on a timeless Indian dessert.",
    price: 295,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 11,
    name: "Masala Chai",
    description: "Traditional Indian tea infused with warm spices.",
    price: 145,
    category: "Drinks",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    id: 12,
    name: "Mango Cooler",
    description: "Fresh mango, citrus and mint.",
    price: 195,
    category: "Drinks",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
];

export default function CartPage() {
  const [cart, setCart] = useState<Cart>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("aura_cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("aura_cart");
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem("aura_cart", JSON.stringify(cart));
  }, [cart, loaded]);

  const cartItems = useMemo(() => {
    return foodItems
      .filter((item) => cart[item.id])
      .map((item) => ({
        ...item,
        quantity: cart[item.id],
      }));
  }, [cart]);

  const itemCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const deliveryFee =
    subtotal === 0 || subtotal > 999 ? 0 : 49;

  const taxes = Math.round(subtotal * 0.05);

  const total = subtotal + deliveryFee + taxes;

  function increaseQuantity(id: number) {
    setCart((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  }

  function decreaseQuantity(id: number) {
    setCart((current) => {
      const next = { ...current };

      if (!next[id]) return next;

      if (next[id] === 1) {
        delete next[id];
      } else {
        next[id] -= 1;
      }

      return next;
    });
  }

  function removeItem(id: number) {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <p className="text-sm text-white/40">
            Loading your cart...
          </p>
        </section>

        <Footer />
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <section className="flex min-h-[75vh] items-center justify-center px-6 pt-24">
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-4xl">
              🛒
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#c9a45c]">
              Your Cart
            </p>

            <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
              Your cart is empty.
            </h1>

            <p className="mx-auto mt-6 max-w-lg leading-7 text-white/45">
              Discover our menu and add something delicious
              to your order.
            </p>

            <Link
              href="/order"
              className="mt-10 inline-flex rounded-full bg-[#c9a45c] px-8 py-4 text-sm font-medium text-black transition hover:bg-[#d8b873]"
            >
              Explore Menu
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

      {/* HERO */}
      <section className="border-b border-white/10 px-6 pb-16 pt-36 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.4em] text-[#c9a45c]">
            Your Selection
          </p>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-5xl font-light tracking-tight md:text-7xl">
                Your cart.
              </h1>

              <p className="mt-5 text-base text-white/45">
                {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"} selected
                for delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="w-fit text-sm text-white/35 underline-offset-4 transition hover:text-red-400 hover:underline"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </section>

      {/* CART CONTENT */}
      <section className="px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_380px]">

          {/* ITEMS */}
          <div>
            <div className="space-y-5">
              {cartItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"
                >
                  <div className="flex gap-5">

                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-28 w-28 shrink-0 rounded-2xl object-cover sm:h-36 sm:w-36"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                            {item.category}
                          </p>

                          <h2 className="mt-2 text-lg font-medium sm:text-xl">
                            {item.name}
                          </h2>

                          <p className="mt-2 hidden text-sm leading-6 text-white/40 sm:block">
                            {item.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xl text-white/25 transition hover:text-red-400"
                          aria-label={`Remove ${item.name}`}
                        >
                          ×
                        </button>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4">
                        <div className="flex items-center rounded-full border border-white/10">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(item.id)
                            }
                            className="flex h-9 w-9 items-center justify-center text-white/50 transition hover:text-white"
                          >
                            −
                          </button>

                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(item.id)
                            }
                            className="flex h-9 w-9 items-center justify-center text-white/50 transition hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-white/30">
                            ₹{item.price} × {item.quantity}
                          </p>

                          <p className="mt-1 text-lg text-[#c9a45c]">
                            ₹
                            {(
                              item.price * item.quantity
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <Link
              href="/order"
              className="mt-8 inline-flex items-center gap-3 text-sm text-white/45 transition hover:text-[#c9a45c]"
            >
              <span>←</span>
              Continue Shopping
            </Link>
          </div>

          {/* SUMMARY */}
          <aside>
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Order Summary
              </p>

              <h2 className="mt-3 text-2xl font-light">
                Almost there.
              </h2>

              <div className="mt-8 space-y-4 border-b border-white/10 pb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/45">
                    Subtotal
                  </span>

                  <span>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Delivery
                  </span>

                  <span>
                    {deliveryFee === 0
                      ? "FREE"
                      : `₹${deliveryFee}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Taxes
                  </span>

                  <span>
                    ₹{taxes.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {subtotal > 0 && subtotal <= 999 && (
                <p className="mt-5 rounded-2xl border border-[#c9a45c]/10 bg-[#c9a45c]/5 p-4 text-xs leading-5 text-[#c9a45c]/70">
                  Add ₹
                  {(1000 - subtotal).toLocaleString("en-IN")}{" "}
                  more to unlock free delivery.
                </p>
              )}

              <div className="mt-6 flex items-end justify-between">
                <span className="text-white/50">
                  Total
                </span>

                <span className="text-2xl text-[#c9a45c]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-7 block w-full rounded-full bg-[#c9a45c] py-4 text-center text-sm font-medium text-black transition hover:bg-[#d8b873]"
              >
                Proceed to Checkout
              </Link>

              <p className="mt-5 text-center text-xs leading-5 text-white/25">
                Secure checkout · Multiple payment options
              </p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
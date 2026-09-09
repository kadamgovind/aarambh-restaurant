"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type FoodItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  type: "Veg" | "Non-Veg";
  image: string;
  signature?: boolean;
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
    signature: true,
  },
  {
    id: 2,
    name: "Tandoori Chicken",
    description: "Classic tandoori chicken with AURA spices.",
    price: 595,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
    signature: true,
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
    signature: true,
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
    signature: true,
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

const categories = [
  "All",
  "Starters",
  "Main Course",
  "Chinese",
  "South Indian",
  "Desserts",
  "Drinks",
];

export default function OrderPage() {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<Cart>({});

  useEffect(() => {
    const savedCart = localStorage.getItem("aura_cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("aura_cart");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("aura_cart", JSON.stringify(cart));
  }, [cart]);

  const filteredItems = useMemo(() => {
    if (category === "All") {
      return foodItems;
    }

    return foodItems.filter(
      (item) => item.category === category
    );
  }, [category]);

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

  function addToCart(id: number) {
    setCart((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  }

  function decreaseQuantity(id: number) {
    setCart((current) => {
      const next = { ...current };

      if (!next[id]) {
        return next;
      }

      if (next[id] === 1) {
        delete next[id];
      } else {
        next[id] -= 1;
      }

      return next;
    });
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* HERO */}
      <section className="border-b border-white/10 px-6 pb-20 pt-36 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 text-xs uppercase tracking-[0.4em] text-[#c9a45c]">
            AURA Delivery
          </p>

          <h1 className="max-w-4xl text-5xl font-light tracking-tight md:text-7xl">
            Exceptional food,
            <br />
            delivered to you.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/55">
            Order your AURA favourites and experience our
            kitchen wherever you are.
          </p>
        </div>
      </section>

      {/* CATEGORY NAVIGATION */}
      <section className="sticky top-[73px] z-30 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-4 lg:px-8">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition ${
                category === item
                  ? "bg-[#c9a45c] text-black"
                  : "border border-white/10 text-white/55 hover:border-white/25 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_360px]">

          {/* MENU */}
          <div>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                  Our Selection
                </p>

                <h2 className="mt-3 text-3xl font-light">
                  {category === "All"
                    ? "AURA Favourites"
                    : category}
                </h2>
              </div>

              <div className="hidden text-sm text-white/35 sm:block">
                {filteredItems.length} items
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition hover:border-[#c9a45c]/30"
                >
                  {/* IMAGE */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {item.signature && (
                      <span className="absolute left-4 top-4 rounded-full border border-[#c9a45c]/40 bg-black/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#c9a45c] backdrop-blur">
                        Signature
                      </span>
                    )}

                    <span className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
                      {item.type}
                    </span>
                  </div>

                  {/* DETAILS */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-medium">
                        {item.name}
                      </h3>

                      <span className="whitespace-nowrap text-[#c9a45c]">
                        ₹{item.price}
                      </span>
                    </div>

                    <p className="mt-3 min-h-[48px] text-sm leading-6 text-white/45">
                      {item.description}
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                      {cart[item.id] ? (
                        <div className="flex items-center rounded-full border border-white/10">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(item.id)
                            }
                            className="flex h-10 w-10 items-center justify-center text-white/60 transition hover:text-white"
                          >
                            −
                          </button>

                          <span className="w-8 text-center text-sm">
                            {cart[item.id]}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              addToCart(item.id)
                            }
                            className="flex h-10 w-10 items-center justify-center text-white/60 transition hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item.id)}
                          className="rounded-full border border-[#c9a45c]/40 px-5 py-2.5 text-sm text-[#c9a45c] transition hover:bg-[#c9a45c] hover:text-black"
                        >
                          Add to Order
                        </button>
                      )}

                      {cart[item.id] && (
                        <span className="text-xs text-white/35">
                          {cart[item.id]} added
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* DESKTOP CART */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.025] p-6">

              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                    Your Order
                  </p>

                  <h2 className="mt-2 text-2xl font-light">
                    Cart
                  </h2>
                </div>

                <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#c9a45c] px-3 text-sm text-black">
                  {itemCount}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="text-4xl text-white/20">
                    🛒
                  </div>

                  <p className="mt-5 text-sm text-white/40">
                    Your cart is empty.
                  </p>

                  <p className="mt-2 text-xs text-white/25">
                    Add something delicious.
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-h-[380px] space-y-5 overflow-y-auto py-6">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 border-b border-white/10 pb-5"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3">
                            <h3 className="truncate text-sm">
                              {item.name}
                            </h3>

                            <span className="text-sm text-[#c9a45c]">
                              ₹
                              {(
                                item.price *
                                item.quantity
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="mt-3 flex w-fit items-center rounded-full border border-white/10">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(item.id)
                              }
                              className="flex h-7 w-7 items-center justify-center text-white/50 hover:text-white"
                            >
                              −
                            </button>

                            <span className="w-6 text-center text-xs">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                addToCart(item.id)
                              }
                              className="flex h-7 w-7 items-center justify-center text-white/50 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SUMMARY */}
                  <div className="space-y-3 border-t border-white/10 pt-5 text-sm">
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

                    <div className="mt-4 flex justify-between border-t border-white/10 pt-5 text-lg">
                      <span>Total</span>

                      <span className="text-[#c9a45c]">
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/cart"
                    className="mt-7 block w-full rounded-full bg-[#c9a45c] py-4 text-center text-sm font-medium text-black transition hover:bg-[#d8b873]"
                  >
                    View Cart
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* MOBILE CART */}
      {itemCount > 0 && (
        <Link
          href="/cart"
          className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-[#c9a45c] px-6 py-4 text-sm font-medium text-black shadow-2xl lg:hidden"
        >
          <span>View Cart</span>

          <span className="h-5 w-px bg-black/20" />

          <span>{itemCount} items</span>

          <span>
            ₹{total.toLocaleString("en-IN")}
          </span>
        </Link>
      )}

      <Footer />
    </main>
  );
}
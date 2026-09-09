"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/owner",
    icon: "⌂",
  },
  {
    name: "Orders",
    href: "/owner/orders",
    icon: "◫",
  },
  {
    name: "Reservations",
    href: "/owner/reservations",
    icon: "▣",
  },
  {
    name: "Customers",
    href: "/owner/customers",
    icon: "♙",
  },
  {
    name: "Menu",
    href: "/owner/menu",
    icon: "☷",
  },
  {
    name: "Offers",
    href: "/owner/offers",
    icon: "◇",
  },
  {
    name: "Analytics",
    href: "/owner/analytics",
    icon: "↗",
  },
];

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72 flex-col
          border-r border-white/10 bg-[#0b0b0b]
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* BRAND */}
        <div className="flex h-20 items-center border-b border-white/10 px-6">
          <div>
            <div className="text-lg font-semibold tracking-[0.28em]">
              AURA
            </div>

            <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/40">
              Restaurant Owner
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-xl text-white/40 lg:hidden"
          >
            ×
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <div className="mb-4 px-3 text-[10px] uppercase tracking-[0.25em] text-white/30">
            Management
          </div>

          {navigation.map((item, index) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-4 rounded-xl px-4 py-3
                text-sm transition
                ${
                  index === 0
                    ? "bg-white text-black"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <span className="flex h-7 w-7 items-center justify-center text-base">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          ))}

          {/* SETTINGS */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <Link
              href="/owner/settings"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-4 rounded-xl px-4 py-3 text-sm text-white/55 transition hover:bg-white/5 hover:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center text-base">
                ⚙
              </span>

              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* RESTAURANT STATUS */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/10" />

              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  AURA Restaurant
                </div>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-white/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Restaurant Online
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="lg:pl-72">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#080808]/90 px-5 backdrop-blur-xl sm:px-8">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/10 px-3 py-2 text-white/70 lg:hidden"
            >
              ☰
            </button>

            <div>
              <div className="text-sm font-medium">
                Owner Dashboard
              </div>

              <div className="hidden text-xs text-white/35 sm:block">
                Manage your restaurant business
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* NOTIFICATIONS */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white">
              ♢

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-400" />
            </button>

            {/* OWNER */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <div className="text-sm font-medium">
                  Restaurant Owner
                </div>

                <div className="text-[11px] text-white/35">
                  Administrator
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                RO
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="min-h-[calc(100vh-5rem)] px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
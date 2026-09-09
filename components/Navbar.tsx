"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  Search,
  UserRound,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Gallery", href: "/gallery" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const closeMenus = () => {
    setMobileOpen(false);
    setAccountOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenus}
          className="group flex flex-col"
        >
          <span className="text-xl font-semibold tracking-[-0.04em] text-white transition-colors duration-300 group-hover:text-[#c9a45c] sm:text-2xl">
            Aarambh
          </span>

          <span className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.28em] text-[#c9a45c] sm:text-[9px]">
            Restaurant
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/60 transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {/* Search */}
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition-all duration-200 hover:border-white/20 hover:text-white"
          >
            <Search size={17} strokeWidth={1.8} />
          </Link>

          {/* Account */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((open) => !open)}
              aria-label="Account menu"
              aria-expanded={accountOpen}
              className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-white/70 transition-all duration-200 hover:border-white/20 hover:text-white"
            >
              <UserRound size={16} strokeWidth={1.8} />
              <span>Account</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  accountOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#101010] p-2 shadow-2xl shadow-black/40">
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenus}
                  className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Create Account
                </Link>

                <Link
                  href="/account"
                  onClick={closeMenus}
                  className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  My Account
                </Link>

                <Link
                  href="/account/profile"
                  onClick={closeMenus}
                  className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Profile
                </Link>
              </div>
            )}
          </div>

          {/* Book */}
          <Link
            href="/booking"
            className="ml-2 inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c]"
          >
            Book a Table
          </Link>

          {/* Order */}
          <Link
            href="/order"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#c9a45c]/50 px-5 text-sm font-medium text-[#c9a45c] transition-all duration-300 hover:bg-[#c9a45c] hover:text-black"
          >
            <ShoppingBag size={15} />
            Order Online
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70"
          >
            <Search size={17} />
          </Link>

          <Link
            href="/account"
            aria-label="Account"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70"
          >
            <UserRound size={17} />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-black lg:hidden">
          <nav className="mx-auto max-w-7xl px-5 py-5 sm:px-6">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenus}
                  className="border-b border-white/10 py-4 text-base text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/search"
                onClick={closeMenus}
                className="border-b border-white/10 py-4 text-base text-white/70"
              >
                Search
              </Link>

              <Link
                href="/account"
                onClick={closeMenus}
                className="border-b border-white/10 py-4 text-base text-white/70"
              >
                My Account
              </Link>

              <Link
                href="/booking"
                onClick={closeMenus}
                className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black"
              >
                Book a Table
              </Link>

              <Link
                href="/order"
                onClick={closeMenus}
                className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#c9a45c]/50 px-6 text-sm font-medium text-[#c9a45c]"
              >
                <ShoppingBag size={16} />
                Order Online
              </Link>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="flex min-h-11 items-center justify-center rounded-full border border-white/10 text-sm text-white/70"
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenus}
                  className="flex min-h-11 items-center justify-center rounded-full border border-white/10 text-sm text-white/70"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
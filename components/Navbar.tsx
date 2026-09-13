"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Search,
  UserRound,
  ChevronDown,
  ShoppingBag,
  LogOut,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Gallery", href: "/gallery" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const closeMenus = () => {
    setMobileOpen(false);
    setAccountOpen(false);
  };

  /*
   * Load the current authenticated user and listen
   * for authentication changes.
   */
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUserEmail(user?.email ?? null);
      setAuthLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) {
          return;
        }

        setUserEmail(session?.user?.email ?? null);
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Close the account dropdown when clicking outside it.
   */
  useEffect(() => {
    if (!accountOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest("[data-account-menu]")) {
        setAccountOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
    };
  }, [accountOpen]);

  /*
   * Sign out the current user and navigate home.
   */
  const handleSignOut = async () => {
    setAccountOpen(false);
    setMobileOpen(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Failed to sign out:", error);
      return;
    }

    router.push("/");
  };

  /*
   * Determine whether a navigation link is active.
   */
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const isLoggedIn = Boolean(userEmail);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenus}
          className="group flex flex-col"
          aria-label="Aarambh Restaurant home"
        >
          <span className="text-xl font-semibold tracking-[-0.04em] text-white transition-colors duration-300 group-hover:text-[#c9a45c] sm:text-2xl">
            Aarambh
          </span>

          <span className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.28em] text-[#c9a45c] sm:text-[9px]">
            Restaurant
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  active ? "page" : undefined
                }
                className={`relative py-2 text-sm transition-colors duration-200 ${
                  active
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {link.label}

                {active && (
                  <span className="absolute inset-x-0 -bottom-0.5 mx-auto h-px bg-[#c9a45c]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {/* Search */}
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition-all duration-200 hover:border-white/20 hover:text-white"
          >
            <Search
              size={17}
              strokeWidth={1.8}
            />
          </Link>

          {/* Account */}
          <div
            className="relative"
            data-account-menu
          >
            <button
              type="button"
              onClick={() =>
                setAccountOpen((open) => !open)
              }
              aria-label="Account menu"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              className="flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-white/70 transition-all duration-200 hover:border-white/20 hover:text-white"
            >
              <UserRound
                size={16}
                strokeWidth={1.8}
              />

              <span>Account</span>

              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  accountOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountOpen && (
              <div
                role="menu"
                aria-label="Account options"
                className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#101010] p-2 shadow-2xl shadow-black/40"
              >
                {authLoading ? (
                  <div
                    className="px-4 py-3 text-sm text-white/40"
                    role="status"
                  >
                    Loading...
                  </div>
                ) : isLoggedIn ? (
                  <>
                    {/* Logged-in user */}
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                        Signed in as
                      </p>

                      <p className="mt-1 truncate text-xs text-white/60">
                        {userEmail}
                      </p>
                    </div>

                    <Link
                      href="/account"
                      onClick={closeMenus}
                      role="menuitem"
                      className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      My Account
                    </Link>

                    <Link
                      href="/account/profile"
                      onClick={closeMenus}
                      role="menuitem"
                      className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Profile
                    </Link>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    {/* Logged-out user */}
                    <Link
                      href="/login"
                      onClick={closeMenus}
                      role="menuitem"
                      className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      onClick={closeMenus}
                      role="menuitem"
                      className="block rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Book a Table */}
          <Link
            href="/booking"
            className="ml-2 inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c]"
          >
            Book a Table
          </Link>

          {/* Order Online */}
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
          {/* Mobile Search */}
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            <Search
              size={17}
              strokeWidth={1.8}
            />
          </Link>

          {/* Mobile Account */}
          <Link
            href="/account"
            aria-label={
              isLoggedIn
                ? "My account"
                : "Sign in"
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            <UserRound
              size={17}
              strokeWidth={1.8}
            />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() =>
              setMobileOpen((open) => !open)
            }
            aria-label={
              mobileOpen
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition-colors hover:border-white/20 hover:text-white"
          >
            {mobileOpen ? (
              <X size={19} />
            ) : (
              <Menu size={19} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-white/10 bg-black lg:hidden"
        >
          <nav
            className="mx-auto max-w-7xl px-5 py-5 sm:px-6"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col">
              {/* Main navigation */}
              {navLinks.map((link) => {
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenus}
                    aria-current={
                      active ? "page" : undefined
                    }
                    className={`border-b border-white/10 py-4 text-base transition-colors ${
                      active
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      {link.label}

                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a45c]" />
                      )}
                    </span>
                  </Link>
                );
              })}

              {/* Search */}
              <Link
                href="/search"
                onClick={closeMenus}
                className="border-b border-white/10 py-4 text-base text-white/70 transition-colors hover:text-white"
              >
                Search
              </Link>

              {/* Account */}
              <Link
                href="/account"
                onClick={closeMenus}
                className="border-b border-white/10 py-4 text-base text-white/70 transition-colors hover:text-white"
              >
                My Account
              </Link>

              {/* Booking */}
              <Link
                href="/booking"
                onClick={closeMenus}
                className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-[#c9a45c]"
              >
                Book a Table
              </Link>

              {/* Ordering */}
              <Link
                href="/order"
                onClick={closeMenus}
                className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#c9a45c]/50 px-6 text-sm font-medium text-[#c9a45c] transition-colors hover:bg-[#c9a45c] hover:text-black"
              >
                <ShoppingBag size={16} />
                Order Online
              </Link>

              {/* Mobile authentication */}
              {!authLoading && (
                <div className="mt-5">
                  {isLoggedIn ? (
                    <div className="space-y-3">
                      {/* User information */}
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                          Signed in as
                        </p>

                        <p className="mt-1 truncate text-xs text-white/60">
                          {userEmail}
                        </p>
                      </div>

                      {/* Profile */}
                      <Link
                        href="/account/profile"
                        onClick={closeMenus}
                        className="flex min-h-11 items-center justify-center rounded-full border border-white/10 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white"
                      >
                        Profile
                      </Link>

                      {/* Sign out */}
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-red-500/20 text-sm text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/login"
                        onClick={closeMenus}
                        className="flex min-h-11 items-center justify-center rounded-full border border-white/10 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white"
                      >
                        Sign In
                      </Link>

                      <Link
                        href="/register"
                        onClick={closeMenus}
                        className="flex min-h-11 items-center justify-center rounded-full border border-white/10 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
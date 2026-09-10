"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAccountAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (error || !profile) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        const role = profile.role?.toLowerCase();

        if (role === "owner" || role === "admin") {
          router.replace("/owner");
          return;
        }

        if (role !== "customer") {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        if (mounted) {
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error("Account access check error:", error);

        if (mounted) {
          await supabase.auth.signOut();
          router.replace("/login");
        }
      }
    }

    checkAccountAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#c9a45c]" />

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">
            Checking your account
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
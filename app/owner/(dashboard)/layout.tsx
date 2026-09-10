"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function OwnerDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkOwnerAccess() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/owner/login");
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          router.replace("/owner/login");
          return;
        }

        const role = profile.role?.toLowerCase();

        if (role !== "owner") {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        if (mounted) {
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error(
          "Owner dashboard access error:",
          error
        );

        await supabase.auth.signOut();
        router.replace("/owner/login");
      }
    }

    checkOwnerAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.replace("/owner/login");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a45c]" />

          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/40">
            Verifying owner access
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {children}
    </main>
  );
}
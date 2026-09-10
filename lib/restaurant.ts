import { supabase } from "@/lib/supabase";

export type Restaurant = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  maps_url: string | null;
  is_active: boolean;
  restaurant_status:
    | "open"
    | "closed"
    | "temporarily_closed";
  opening_hours: Record<string, unknown>;
  ordering_settings: Record<string, unknown>;
  payment_settings: Record<string, unknown>;
  notification_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const RESTAURANT_SELECT = `
  id,
  owner_id,
  name,
  slug,
  description,
  phone,
  email,
  address,
  city,
  state,
  pincode,
  logo_url,
  cover_image_url,
  maps_url,
  is_active,
  restaurant_status,
  opening_hours,
  ordering_settings,
  payment_settings,
  notification_settings,
  created_at,
  updated_at
`;

export async function getActiveRestaurant(): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load active restaurant:", error);
    return null;
  }

  return data as Restaurant | null;
}

export async function getRestaurantBySlug(
  slug: string
): Promise<Restaurant | null> {
  const cleanSlug = slug.trim().toLowerCase();

  if (!cleanSlug) {
    return null;
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_SELECT)
    .eq("slug", cleanSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load restaurant:", error);
    return null;
  }

  return data as Restaurant | null;
}
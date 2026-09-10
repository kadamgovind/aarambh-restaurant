import { supabase } from "@/lib/supabase";

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  item_type: "veg" | "non_veg";
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

const CATEGORY_SELECT = `
  id,
  restaurant_id,
  name,
  slug,
  description,
  image_url,
  display_order,
  is_active,
  created_at,
  updated_at
`;

const MENU_ITEM_SELECT = `
  id,
  restaurant_id,
  category_id,
  name,
  slug,
  description,
  price,
  item_type,
  image_url,
  is_available,
  is_featured,
  display_order,
  created_at,
  updated_at
`;

export async function getMenuCategories(
  restaurantId: string
): Promise<MenuCategory[]> {
  const cleanRestaurantId = restaurantId.trim();

  if (!cleanRestaurantId) {
    return [];
  }

  const { data, error } = await supabase
    .from("menu_categories")
    .select(CATEGORY_SELECT)
    .eq("restaurant_id", cleanRestaurantId)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load menu categories:", error);
    return [];
  }

  return (data || []) as MenuCategory[];
}

export async function getMenuItems(
  restaurantId: string
): Promise<MenuItem[]> {
  const cleanRestaurantId = restaurantId.trim();

  if (!cleanRestaurantId) {
    return [];
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select(MENU_ITEM_SELECT)
    .eq("restaurant_id", cleanRestaurantId)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load menu items:", error);
    return [];
  }

  return (data || []) as MenuItem[];
}

export async function getMenuData(
  restaurantId: string
): Promise<{
  categories: MenuCategory[];
  items: MenuItem[];
}> {
  const [categories, items] = await Promise.all([
    getMenuCategories(restaurantId),
    getMenuItems(restaurantId),
  ]);

  return {
    categories,
    items,
  };
}
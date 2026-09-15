import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/owner/",
        "/login",
        "/register",
        "/owner-register",
        "/forgot-password",
        "/reset-password",
        "/order/cart",
        "/order/checkout",
        "/order/success",
      ],
    },

    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
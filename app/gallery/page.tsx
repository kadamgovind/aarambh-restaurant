import type { Metadata } from "next";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = {
  title: "Gallery | Food, Interiors & Dining Moments",
  description:
    "Explore Aarambh Restaurant's food, interiors, family dining, outdoor spaces, events, birthday celebrations, and chef specials in Narhe, Pune.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Aarambh Restaurant Gallery | Food & Dining",
    description:
      "View delicious food, beautiful interiors, family dining moments, events, and chef specials at Aarambh Restaurant.",
    url: "/gallery",
    type: "website",
  },
};

export default function GalleryPage() {
  return <GalleryClient />;
}
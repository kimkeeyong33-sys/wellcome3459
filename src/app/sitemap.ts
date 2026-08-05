import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cashticket.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/owner/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/owner/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/my`, changeFrequency: "monthly", priority: 0.5 },
  ];
}

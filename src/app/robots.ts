import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cashticket.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/owner", "/my", "/t", "/pay"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

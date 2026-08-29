import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js's public/ folder serves static files by exact path only — it does not
  // auto-resolve a directory request to its index.html the way plain static hosts do.
  // These rewrites make /neotto and /neotto/ resolve to the static page in public/neotto/.
  async rewrites() {
    return [
      { source: "/neotto", destination: "/neotto/index.html" },
      { source: "/neotto/", destination: "/neotto/index.html" },
    ];
  },
};

export default nextConfig;

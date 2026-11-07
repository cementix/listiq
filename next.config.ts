import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  // Server Function debug logs include arguments (reviews, profile data, etc.).
  logging: { serverFunctions: false, incomingRequests: false, browserToTerminal: false },
  devIndicators: false,
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "cdn.mangaupdates.com" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "comicvine.gamespot.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "images.igdb.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default withWorkflow(nextConfig);

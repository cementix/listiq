import { SecurityError } from "@/lib/security/errors";
import { consumeRateLimit } from "@/lib/security/rateLimit";

const limits: Record<string, number> = {
  TMDB: 2000,
  RAWG: 250,
  MangaUpdates: 20,
  "Open Library": 10,
  Wikidata: 20,
  AniList: 250,
  "Google Books": 250,
  "Comic Vine": 100,
};

export async function reserveProviderRequest(provider: string) {
  const limit = limits[provider];
  if (!limit) throw new Error("Unknown catalog provider quota");
  const { prisma } = await import("@/lib/prisma");
  try {
    await consumeRateLimit(prisma, { name: "catalog-provider", limit, seconds: 86_400 }, provider);
    return true;
  } catch (error) {
    if (error instanceof SecurityError) return false;
    throw error;
  }
}

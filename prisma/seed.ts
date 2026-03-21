import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

const genres = [
  { name: "Action", slug: "action" },
  { name: "Adventure", slug: "adventure" },
  { name: "Comedy", slug: "comedy" },
  { name: "Drama", slug: "drama" },
  { name: "Fantasy", slug: "fantasy" },
  { name: "Horror", slug: "horror" },
  { name: "Mystery", slug: "mystery" },
  { name: "Romance", slug: "romance" },
  { name: "Sci-Fi", slug: "sci-fi" },
  { name: "Slice of Life", slug: "slice-of-life" },
  { name: "Supernatural", slug: "supernatural" },
  { name: "Thriller", slug: "thriller" },
  { name: "Psychological", slug: "psychological" },
  { name: "Sports", slug: "sports" },
  { name: "Mecha", slug: "mecha" },
  { name: "Historical", slug: "historical" },
  { name: "Military", slug: "military" },
  { name: "School", slug: "school" },
  { name: "Shounen", slug: "shounen" },
  { name: "Seinen", slug: "seinen" },
  { name: "Shojo", slug: "shojo" },
  { name: "Josei", slug: "josei" },
  { name: "Isekai", slug: "isekai" },
  { name: "Magic", slug: "magic" },
  { name: "Martial Arts", slug: "martial-arts" },
  { name: "Survival", slug: "survival" },
  { name: "Crime", slug: "crime" },
  { name: "Detective", slug: "detective" },
  { name: "Post-Apocalyptic", slug: "post-apocalyptic" },
  { name: "Tragedy", slug: "tragedy" },
];

async function main() {
  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: { name: genre.name },
      create: genre,
    });
  }

  console.log("genres seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

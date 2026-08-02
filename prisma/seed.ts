import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

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

const fakeUsers = [
  { email: "test1@listiq.dev", username: "test1" },
  { email: "test2@listiq.dev", username: "test2" },
  { email: "test3@listiq.dev", username: "test3" },
  { email: "test4@listiq.dev", username: "test4" },
  { email: "test5@listiq.dev", username: "test5" },
  { email: "test6@listiq.dev", username: "test6" },
  { email: "test7@listiq.dev", username: "test7" },
  { email: "test8@listiq.dev", username: "test8" },
  { email: "test9@listiq.dev", username: "test9" },
  { email: "test10@listiq.dev", username: "test10" },
];
const reviewNotes = [
  "Strong start, easy to recommend.",
  "Looks simple, but it sticks in your head.",
  "Great vibe, pacing is not perfect.",
  "One of those titles I keep thinking about.",
  "Not flawless, but absolutely worth adding.",
  "Clean style, strong moments, good overall.",
  "A bit overhyped, still very solid.",
  "Peak comfort pick for the right mood.",
  "Dragged in places, but the payoff works.",
  "Would revisit this without thinking twice.",
];

const makeLibrary = (count: number, baseRating: number) =>
  fakeUsers.slice(0, count).map((user, index) => ({
    username: user.username,
    rating: Math.max(1, Math.min(10, baseRating - (index % 5) * 0.5)),
    note: reviewNotes[index % reviewNotes.length],
  }));

const cover = (text: string, bg = "111827", color = "ffffff") =>
  `https://placehold.co/600x800/${bg}/${color}.png?text=${encodeURIComponent(text)}`;

const titleFixtures = [
  {
    name: "Hollow Knight",
    slug: "hollow-knight",
    year: 2017,
    type: "GAME" as const,
    imageUrl: cover("Hollow Knight", "18181b"),
    description: "A dark metroidvania about a ruined underground kingdom.",
    genres: ["action", "adventure", "fantasy"],
    library: makeLibrary(9, 9.5),
  },
  {
    name: "Elden Ring",
    slug: "elden-ring",
    year: 2022,
    type: "GAME" as const,
    imageUrl: cover("Elden Ring", "292524"),
    description:
      "An open-world action RPG about gods, ruins, and bad decisions.",
    genres: ["action", "adventure", "fantasy"],
    library: makeLibrary(10, 9.5),
  },
  {
    name: "Disco Elysium",
    slug: "disco-elysium",
    year: 2019,
    type: "GAME" as const,
    imageUrl: cover("Disco Elysium", "312e81"),
    description:
      "A detective RPG full of politics, failure, and brilliant writing.",
    genres: ["detective", "crime", "psychological"],
    library: makeLibrary(7, 9),
  },
  {
    name: "Cyberpunk 2077",
    slug: "cyberpunk-2077",
    year: 2020,
    type: "GAME" as const,
    imageUrl: cover("Cyberpunk 2077", "facc15", "111827"),
    description: "A neon RPG about ambition, chrome, and Night City.",
    genres: ["action", "sci-fi", "crime"],
    library: makeLibrary(6, 8),
  },
  {
    name: "The Matrix",
    slug: "the-matrix",
    year: 1999,
    type: "MOVIE" as const,
    imageUrl: cover("The Matrix", "064e3b"),
    description: "A hacker discovers reality is not what it seems.",
    genres: ["action", "sci-fi", "thriller"],
    library: makeLibrary(10, 9.5),
  },
  {
    name: "Inception",
    slug: "inception",
    year: 2010,
    type: "MOVIE" as const,
    imageUrl: cover("Inception", "1e3a8a"),
    description: "A dream heist thriller with collapsing realities.",
    genres: ["action", "sci-fi", "thriller"],
    library: makeLibrary(8, 9),
  },
  {
    name: "Blade Runner 2049",
    slug: "blade-runner-2049",
    year: 2017,
    type: "MOVIE" as const,
    imageUrl: cover("Blade Runner 2049", "7c2d12"),
    description: "A slow, gorgeous sci-fi story about memory and identity.",
    genres: ["sci-fi", "drama", "mystery"],
    library: makeLibrary(6, 8.5),
  },
  {
    name: "Parasite",
    slug: "parasite",
    year: 2019,
    type: "MOVIE" as const,
    imageUrl: cover("Parasite", "14532d"),
    description: "A sharp class thriller that keeps turning the knife.",
    genres: ["drama", "thriller", "comedy"],
    library: makeLibrary(9, 9),
  },
  {
    name: "Breaking Bad",
    slug: "breaking-bad",
    year: 2008,
    type: "SERIES" as const,
    imageUrl: cover("Breaking Bad", "365314"),
    description: "A chemistry teacher becomes a drug kingpin.",
    genres: ["crime", "drama", "thriller"],
    library: makeLibrary(10, 10),
  },
  {
    name: "Dark",
    slug: "dark",
    year: 2017,
    type: "SERIES" as const,
    imageUrl: cover("Dark", "0f172a"),
    description: "A German time-loop mystery with family trauma everywhere.",
    genres: ["mystery", "sci-fi", "thriller"],
    library: makeLibrary(7, 8.5),
  },
  {
    name: "True Detective",
    slug: "true-detective",
    year: 2014,
    type: "SERIES" as const,
    imageUrl: cover("True Detective", "422006"),
    description: "Detectives, rituals, murder, and existential rot.",
    genres: ["detective", "crime", "psychological"],
    library: makeLibrary(5, 9),
  },
  {
    name: "Arcane",
    slug: "arcane",
    year: 2021,
    type: "SERIES" as const,
    imageUrl: cover("Arcane", "581c87"),
    description: "A stylish animated tragedy about sisters and power.",
    genres: ["action", "drama", "fantasy"],
    library: makeLibrary(8, 9.5),
  },
  {
    name: "Dune",
    slug: "dune-book",
    year: 1965,
    type: "BOOK" as const,
    imageUrl: cover("Dune", "78350f"),
    description: "Politics, prophecy, desert power, and giant worms.",
    genres: ["sci-fi", "adventure", "military"],
    library: makeLibrary(6, 8.5),
  },
  {
    name: "1984",
    slug: "1984",
    year: 1949,
    type: "BOOK" as const,
    imageUrl: cover("1984", "27272a"),
    description: "A bleak dystopian classic about control and surveillance.",
    genres: ["sci-fi", "drama", "psychological"],
    library: makeLibrary(8, 8.5),
  },
  {
    name: "The Hobbit",
    slug: "the-hobbit",
    year: 1937,
    type: "BOOK" as const,
    imageUrl: cover("The Hobbit", "166534"),
    description: "A cozy fantasy adventure before everything got enormous.",
    genres: ["adventure", "fantasy", "comedy"],
    library: makeLibrary(7, 8),
  },
  {
    name: "House of Leaves",
    slug: "house-of-leaves",
    year: 2000,
    type: "BOOK" as const,
    imageUrl: cover("House of Leaves", "1f2937"),
    description: "A weird horror novel about a house that should not exist.",
    genres: ["horror", "mystery", "psychological"],
    library: makeLibrary(4, 8),
  },
  {
    name: "Attack on Titan",
    slug: "attack-on-titan",
    year: 2013,
    type: "ANIME" as const,
    imageUrl: cover("Attack on Titan", "7f1d1d"),
    description:
      "Humanity fights giants while every answer makes things worse.",
    genres: ["action", "drama", "military"],
    library: makeLibrary(9, 9),
  },
  {
    name: "Death Note",
    slug: "death-note",
    year: 2006,
    type: "ANIME" as const,
    imageUrl: cover("Death Note", "020617"),
    description: "A genius student finds a notebook that kills people.",
    genres: ["mystery", "psychological", "supernatural"],
    library: makeLibrary(8, 8.5),
  },
  {
    name: "Berserk",
    slug: "berserk",
    year: 1989,
    type: "MANGA" as const,
    imageUrl: cover("Berserk", "450a0a"),
    description: "Dark fantasy about rage, fate, trauma, and survival.",
    genres: ["action", "fantasy", "tragedy"],
    library: makeLibrary(7, 9.5),
  },
  {
    name: "Solo Leveling",
    slug: "solo-leveling",
    year: 2018,
    type: "MANHWA" as const,
    imageUrl: cover("Solo Leveling", "1d4ed8"),
    description: "A weak hunter becomes absurdly powerful through a system.",
    genres: ["action", "fantasy", "adventure"],
    library: makeLibrary(5, 8),
  },
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

  const fakePasswordHash = await bcrypt.hash("password123", 10);

  for (const user of fakeUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username,
        passwordHash: fakePasswordHash,
      },
      create: {
        email: user.email,
        username: user.username,
        passwordHash: fakePasswordHash,
      },
    });
  }

  console.log("fake users seeded");

  for (const titleFixture of titleFixtures) {
    const title = await prisma.title.upsert({
      where: { slug: titleFixture.slug },
      update: {
        name: titleFixture.name,
        year: titleFixture.year,
        type: titleFixture.type,
        description: titleFixture.description,
        imageUrl: titleFixture.imageUrl,
        genres: {
          set: [],
          connect: titleFixture.genres.map((slug) => ({ slug })),
        },
      },
      create: {
        name: titleFixture.name,
        slug: titleFixture.slug,
        year: titleFixture.year,
        type: titleFixture.type,
        description: titleFixture.description,
        imageUrl: titleFixture.imageUrl,
        genres: {
          connect: titleFixture.genres.map((slug) => ({ slug })),
        },
      },
    });

    for (const entry of titleFixture.library) {
      const user = await prisma.user.findUnique({
        where: { username: entry.username },
        select: { id: true },
      });

      if (!user) {
        console.log(`skip ${entry.username}: user not found`);
        continue;
      }

      await prisma.userTitle.upsert({
        where: {
          userId_titleId: {
            userId: user.id,
            titleId: title.id,
          },
        },
        update: {
          rating: entry.rating,
          note: entry.note,
        },
        create: {
          userId: user.id,
          titleId: title.id,
          rating: entry.rating,
          note: entry.note,
        },
      });
    }
  }

  console.log("titles seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

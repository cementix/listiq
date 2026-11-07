import "dotenv/config";
import { randomBytes } from "node:crypto";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { assertDemoTarget } from "@/lib/demo/guard";

const target = process.env.DEMO_DATABASE_URL;
if (!target) throw new Error("Set DEMO_DATABASE_URL to a separate, migrated demo database");
assertDemoTarget(target, process.env.DATABASE_URL);
assertDemoTarget(target, process.env.DATABASE_URL_UNPOOLED);
const pool = new Pool({ connectionString: target, max: 3 });
const db = new PrismaClient({ adapter: new PrismaPg(pool, { disposeExternalPool: true }) });

async function main() {
  if (await db.user.count({ where: { NOT: { id: { startsWith: "demo_user_" } } } }) ||
      await db.title.count({ where: { NOT: { id: { startsWith: "demo_title_" } } } })) {
    throw new Error("Demo seed refuses databases containing non-demo users or titles");
  }
  const password = process.env.DEMO_PASSWORD || randomBytes(24).toString("base64url");
  if (password.length < 16) throw new Error("DEMO_PASSWORD must contain at least 16 characters");
  const passwordHash = await bcrypt.hash(password, 12);
  const names = ["atlas", "nova", "rowan", "sage"];
  for (const [index, name] of names.entries()) {
    const data = { username: `demo_${name}`, email: `demo_${name}@example.invalid`, passwordHash,
      privacySetupCompleted: true, libraryPublic: true, reviewsPublic: true,
      statsPublic: true, postsPublic: true, titleActivityPublic: true, listActivityPublic: true };
    await db.user.upsert({ where: { id: `demo_user_${index}` }, update: data, create: { id: `demo_user_${index}`, ...data } });
  }
  const groups = [
    { type: "MOVIE", names: ["Neon Harbor", "The Last Signal", "Summer on Europa", "Paper Skies"] },
    { type: "SERIES", names: ["After Midnight", "The Glass District", "Station Nine", "Parallel Days"] },
    { type: "ANIME", names: ["Orbit Runners", "Moonflower Academy", "Echo Pilots", "A Thousand Lanterns"] },
    { type: "MANGA", names: ["Inkbound", "The Clockmaker's Garden", "Steel Petals", "River of Stars"] },
    { type: "MANHWA", names: ["Tower of Tomorrow", "Night Courier", "The Second Horizon", "Fragments of Dawn"] },
    { type: "BOOK", names: ["Letters from the Future", "The Quiet Atlas", "A Map of Rain", "The Memory Library"] },
    { type: "GAME", names: ["Voidwalker", "Signal Lost", "Clockwork Valley", "Beyond the Static"] },
    { type: "NOVEL", names: ["The Seventh Archive", "Between Two Moons", "Silver Circuit", "A City Without Sleep"] },
    { type: "COMIC", names: ["Electric Saints", "The Violet Hour", "Outpost Zero", "Midnight Frequency"] },
  ] as const;
  for (const [groupIndex, group] of groups.entries()) {
    const genre = await db.genre.upsert({ where: { slug: "demo-imagined-worlds" }, update: {}, create: { name: "Imagined worlds", slug: "demo-imagined-worlds" } });
    for (const [index, name] of group.names.entries()) {
      const id = `demo_title_${groupIndex}_${index}`;
      const data = { name, slug: `demo-${groupIndex}-${index}`, type: group.type, year: 2025 + index % 2,
        description: "An original fictional title created for the listiq demo. Explore imagined worlds, memorable characters and stories worth sharing.",
        imageUrl: `/demo/poster-${groupIndex}.svg`, backdropUrl: "/demo/backdrop.svg",
        releaseDate: new Date(`202${5 + index % 2}-06-01T00:00:00Z`), catalogEligible: true, catalogScore: 92 - index * 4,
        catalogScoredAt: new Date(), genres: { connect: { id: genre.id } } };
      await db.title.upsert({ where: { id }, update: data, create: { id, ...data } });
      for (let user = 0; user < names.length; user++) {
        const entry = { userId: `demo_user_${user}`, titleId: id, rating: 6 + ((groupIndex + index + user) % 8) / 2,
          note: ["A memorable world with a strong ending.", "Worth revisiting for the characters.", "Great atmosphere and a few surprises.", "An easy recommendation for a quiet evening."][user] };
        await db.userTitle.upsert({ where: { userId_titleId: { userId: entry.userId, titleId: id } }, update: entry, create: entry });
      }
    }
  }
  for (let index = 0; index < 3; index++) {
    const list = await db.titleList.upsert({ where: { id: `demo_list_${index}` }, update: {}, create: {
      id: `demo_list_${index}`, userId: `demo_user_${index}`, title: ["Late night favorites", "Worlds to get lost in", "Next up"][index],
      slug: ["late-night-favorites", "imagined-worlds", "next-up"][index], description: "A fictional collection for exploring listiq. All titles and reviews in this demo are synthetic.", visibility: "PUBLIC",
    } });
    for (let position = 0; position < 8; position++) {
      const titleId = `demo_title_${position}_${index}`;
      await db.titleListItem.upsert({ where: { listId_titleId: { listId: list.id, titleId } }, update: { position }, create: { listId: list.id, titleId, position } });
    }
    await db.profilePost.upsert({ where: { id: `demo_post_${index}` }, update: {}, create: { id: `demo_post_${index}`, authorId: `demo_user_${index}`, content: "Demo profile: collecting stories, sharing favorites and finding the next good thing." } });
  }
  const folder = mkdtempSync(path.join(tmpdir(), "listiq-demo-login-"));
  const credentialsFile = path.join(folder, "credentials.json");
  writeFileSync(credentialsFile, JSON.stringify({ username: "demo_atlas", email: "demo_atlas@example.invalid", password }), { mode: 0o600 });
  console.log(JSON.stringify({ users: 4, titles: 36, lists: 3, credentialsFile }));
}

main().catch(() => { console.error("Demo seed failed; verify isolation, migrations and connection settings"); process.exitCode = 1; }).finally(async () => { await db.$disconnect(); });

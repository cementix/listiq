import "server-only";

import { randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcrypt";

import {
  ActivityEventType,
  TitleListVisibility,
  TitleType,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { GuestRestrictedError } from "@/lib/security/guestError";
import { ensureSaveForLaterList } from "@/lib/title-list/ensureSaveForLaterList";

export const GUEST_TTL_HOURS = 24;
const GUEST_EMAIL_DOMAIN = "demo.listiq.invalid";

const SANDBOX_TYPES: { type: TitleType; pick: number }[] = [
  { type: TitleType.MOVIE, pick: 4 },
  { type: TitleType.SERIES, pick: 3 },
  { type: TitleType.ANIME, pick: 3 },
  { type: TitleType.GAME, pick: 3 },
  { type: TitleType.BOOK, pick: 2 },
  { type: TitleType.MANGA, pick: 2 },
];

const SAMPLE_NOTES = [
  "Stayed with me for days. The ending earns every minute before it.",
  "Comfort pick — I come back to this whenever I need a reset.",
  "Slow start, but the second half is incredible.",
  "Gorgeous atmosphere. Would recommend to anyone who liked the classics.",
  "Not perfect, but the characters carry it.",
];

const RATINGS = [7, 7.5, 8, 8, 8.5, 8.5, 9, 9, 9.5, 10];

export { GuestRestrictedError };

export async function isGuestUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isGuest: true },
  });
  return user?.isGuest ?? false;
}

export async function assertNotGuest(userId: string, action?: string) {
  if (await isGuestUser(userId)) throw new GuestRestrictedError(action);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function pickSandboxTitles() {
  const groups = await Promise.all(
    SANDBOX_TYPES.map(async ({ type, pick }) => {
      const candidates = await prisma.title.findMany({
        where: { type, catalogEligible: true, imageUrl: { not: null } },
        orderBy: { catalogScore: { sort: "desc", nulls: "last" } },
        select: { id: true },
        take: 16,
      });
      return shuffle(candidates).slice(0, pick).map((title) => title.id);
    }),
  );
  return shuffle(groups.flat());
}

/** Creates a private, pre-filled sandbox account that expires automatically. */
export async function createGuestSandbox() {
  const suffix = randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "x");
  const username = `guest_${suffix}`;
  const email = `${username}@${GUEST_EMAIL_DOMAIN}`;
  // The sandbox has no usable password; it is reachable only through the demo session.
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const titleIds = await pickSandboxTitles();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username,
        email,
        passwordHash,
        isGuest: true,
        guestExpiresAt: new Date(now + GUEST_TTL_HOURS * 60 * 60 * 1000),
        privacySetupCompleted: true,
      },
      select: { id: true, username: true, email: true },
    });

    const saveForLater = await ensureSaveForLaterList(user.id, tx);
    const library = titleIds.slice(0, Math.max(0, titleIds.length - 4));
    const later = titleIds.slice(library.length);

    const entries = library.map((titleId, index) => {
      const createdAt = new Date(now - (library.length - index) * 1.3 * day);
      const rating = index % 5 === 4 ? null : RATINGS[randomInt(RATINGS.length)];
      const note = index % 4 === 0 ? SAMPLE_NOTES[(index / 4) % SAMPLE_NOTES.length] : null;
      return { userId: user.id, titleId, rating, note, createdAt };
    });

    if (entries.length) {
      await tx.userTitle.createMany({ data: entries });
      await tx.activityEvent.createMany({
        data: entries.flatMap((entry) => [
          { userId: user.id, titleId: entry.titleId, type: ActivityEventType.TITLE_ADDED, createdAt: entry.createdAt },
          ...(entry.rating === null ? [] : [{
            userId: user.id, titleId: entry.titleId, type: ActivityEventType.TITLE_RATED,
            rating: entry.rating, createdAt: new Date(entry.createdAt.getTime() + 60_000),
          }]),
          ...(entry.note === null ? [] : [{
            userId: user.id, titleId: entry.titleId, type: ActivityEventType.TITLE_REVIEWED,
            note: entry.note, createdAt: new Date(entry.createdAt.getTime() + 120_000),
          }]),
        ]),
      });
    }

    if (later.length) {
      await tx.titleListItem.createMany({
        data: later.map((titleId, position) => ({ listId: saveForLater.id, titleId, position })),
      });
    }

    const favorites = entries
      .filter((entry) => (entry.rating ?? 0) >= 8.5)
      .slice(0, 8);
    const lists = [
      { title: "All-time favorites", slug: "all-time-favorites", description: "The ones I recommend to everyone.", items: favorites.map((e) => e.titleId) },
      { title: "Weekend queue", slug: "weekend-queue", description: "Short, cozy picks for a slow weekend.", items: shuffle(library).slice(0, 6) },
    ];
    for (const list of lists) {
      if (!list.items.length) continue;
      await tx.titleList.create({
        data: {
          userId: user.id,
          title: list.title,
          slug: list.slug,
          description: list.description,
          visibility: TitleListVisibility.PRIVATE,
          items: { create: list.items.map((titleId, position) => ({ titleId, position })) },
        },
      });
    }

    return user;
  });
}

/** Best-effort cleanup; cascades remove the sandbox's library, lists and activity. */
export async function cleanupExpiredGuests(limit = 50) {
  const expired = await prisma.user.findMany({
    where: { isGuest: true, guestExpiresAt: { lt: new Date() } },
    select: { id: true },
    take: limit,
  });
  if (!expired.length) return 0;
  const result = await prisma.user.deleteMany({
    where: { id: { in: expired.map((user) => user.id) }, isGuest: true },
  });
  return result.count;
}

export async function deleteGuestUser(userId: string) {
  await prisma.user.deleteMany({ where: { id: userId, isGuest: true } });
}

import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { prisma } from "../../lib/prisma";
import { encrypt } from "../../lib/session";
import { requireUserServer } from "../../lib/auth/guards";
import { requests } from "./next-context.mjs";
import { createTitle } from "../../actions/title/createTitle";
import { getSubmissionsForReview } from "../../actions/submissions/getSubmissionsForReview";
import { approveTitleSubmission } from "../../actions/submissions/approveTitleSubmission";
import { getPublicProfileOverview } from "../../actions/profile/getPublicProfileOverview";
import { getTitleBySlug } from "../../actions/title/getTitleBySlug";
import { getTitles } from "../../actions/title/getTitles";
import { getTitleListPage } from "../../lib/title-list/getTitleListPage";
import { getPublicTitleLists } from "../../lib/title-list/getPublicTitleLists";
import { addTitleToList } from "../../actions/title-list/addTitleToList";
import { removeTitleFromList } from "../../actions/title-list/removeTitleFromList";
import { reorderTitleListItems } from "../../actions/title-list/reorderTitleListItems";
import { updateTitleList } from "../../actions/title-list/updateTitleList";
import { deleteTitleList } from "../../actions/title-list/deleteTitleList";
import { setTitleListSaved } from "../../actions/title-list/setTitleListSaved";
import { updateUserTitle } from "../../actions/title/updateUserTitle";
import { toggleProfilePostLike } from "../../actions/profile/toggleProfilePostLike";
import { toggleProfilePostCommentLike } from "../../actions/profile/toggleProfilePostCommentLike";
import { createProfilePostComment } from "../../actions/profile/createProfilePostComment";
import { addLibraryTitle, removeLibraryTitle, updateLibraryTitle } from "../../lib/library/mutations";
import { addListTitle } from "../../lib/title-list/mutations";
import { scoreCatalog } from "../../lib/catalog/scoreCatalog";
import { saveDiscoveryTitle } from "../../actions/discovery/saveDiscoveryTitle";

const expectedDb = process.env.LISTIQ_TEST_DATABASE;
assert.match(expectedDb ?? "", /^listiq_test_[a-f0-9]{32}$/, "Use npm run test:integration");
assert.equal(new URL(process.env.DATABASE_URL!).pathname, `/${expectedDb}`);
const roles = { owner: "USER", visitor: "USER", public: "USER", admin: "ADMIN", moderator: "MODERATOR", verified: "VERIFIED" } as const;
type Actor = keyof typeof roles;
const txOptions = { maxWait: 10_000, timeout: 15_000 };

async function as<T>(actor: Actor | null, operation: () => Promise<T>) {
  const session = actor ? await encrypt({ userId: actor, username: actor,
    email: `${actor}@example.test`, expiresAt: new Date(Date.now() + 60_000).toISOString() }) : null;
  return requests.run({ session, invalidations: [] as string[] }, operation);
}

before(async () => {
  const [actual] = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  assert.equal(actual.name, expectedDb, "Refusing to seed outside the isolated database");
});
after(async () => { await prisma.$disconnect(); });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Title", "Genre", "RateLimitBucket" CASCADE`;
  await prisma.genre.create({ data: { id: "genre", name: "Fixture genre", slug: "fixture-genre" } });
  await prisma.user.createMany({ data: Object.entries(roles).map(([id, role]) => ({
    id, role, username: id, email: `${id}@example.test`, passwordHash: "test-only-not-a-login-hash",
    privacySetupCompleted: true, libraryPublic: id === "public", reviewsPublic: id === "public",
    statsPublic: id === "public", postsPublic: id === "public",
    titleActivityPublic: id === "public", listActivityPublic: id === "public",
  })) });
  await prisma.title.createMany({ data: Array.from({ length: 12 }, (_, index) => ({
    id: `title-${index}`, slug: `fixture-${index}`, name: `Fixture ${index}`, type: "MOVIE" as const,
    imageUrl: "https://example.test/cover.png",
  })) });
  await prisma.userTitle.createMany({ data: [
    { id: "owner-entry", userId: "owner", titleId: "title-0", rating: 9, note: "private-review" },
    { id: "public-entry", userId: "public", titleId: "title-0", rating: 4, note: "public-review" },
  ] });
  await prisma.titleSubmission.create({ data: { id: "submission", name: "Submitted fixture", type: "MOVIE", submittedById: "owner" } });
  await prisma.activityEvent.createMany({ data: [
    { userId: "owner", titleId: "title-0", type: "TITLE_ADDED" },
    { userId: "owner", titleId: "title-0", type: "TITLE_RATED", rating: 9 },
    { userId: "owner", titleId: "title-0", type: "TITLE_REVIEWED", note: "private-review" },
  ] });
  await prisma.profilePost.createMany({ data: [
    { id: "plain-post", authorId: "owner", content: "private-post" },
    { id: "review-post", authorId: "owner", content: "private-attached-review", attachedUserTitleId: "owner-entry" },
  ] });
  await prisma.profilePostComment.create({ data: { id: "comment", postId: "plain-post", authorId: "owner", content: "private-comment" } });
  await prisma.titleList.createMany({ data: [
    { id: "private-list", userId: "owner", title: "Private fixture", slug: "private", visibility: "PRIVATE" },
    { id: "public-list", userId: "owner", title: "Public fixture", slug: "public", visibility: "PUBLIC" },
    { id: "system-list", userId: "owner", title: "For later", slug: "for-later", visibility: "PRIVATE", systemType: "SAVE_FOR_LATER" },
  ] });
  await prisma.titleListItem.createMany({ data: [
    { id: "private-item", listId: "private-list", titleId: "title-0", position: 0 },
    { id: "public-item", listId: "public-list", titleId: "title-0", position: 0 },
  ] });
});

test("guest, forged cookie and deleted-user sessions cannot pass authentication", async () => {
  await assert.rejects(as(null, requireUserServer), /Unauthorized/);
  await assert.rejects(requests.run({ session: "forged", invalidations: [] }, requireUserServer), /Unauthorized/);
  await prisma.user.delete({ where: { id: "visitor" } });
  await assert.rejects(as("visitor", requireUserServer), /User not found/);
});

test("creation/review permissions use current database roles, not claims in cookies", async () => {
  const payload = { name: "Allowed fixture", type: "MOVIE" as const, genresIds: ["genre"] };
  assert.equal((await as("visitor", () => createTitle(payload))).ok, false);
  for (const actor of ["visitor", "verified"] as const) {
    await assert.rejects(as(actor, getSubmissionsForReview), /Forbidden/);
    assert.equal((await as(actor, () => approveTitleSubmission("submission", ""))).ok, false);
  }
  for (const actor of ["admin", "moderator"] as const) {
    assert.equal((await as(actor, getSubmissionsForReview)).length, 1);
  }
  for (const actor of ["verified", "moderator", "admin"] as const) {
    assert.equal((await as(actor, () => createTitle({ ...payload, name: `Created by ${actor}` }))).ok, true);
  }
  await prisma.user.update({ where: { id: "admin" }, data: { role: "USER" } });
  await assert.rejects(as("admin", getSubmissionsForReview), /Forbidden/);
  assert.equal((await as("moderator", () => approveTitleSubmission("submission", "Approved fixture"))).ok, true);
  assert.equal((await prisma.titleSubmission.findUniqueOrThrow({ where: { id: "submission" } })).status, "APPROVED");
});

test("foreign list IDs cannot mutate items, metadata, order or delete the list", async () => {
  const original = await prisma.titleList.findUniqueOrThrow({ where: { id: "public-list" } });
  const outcomes = await as("visitor", () => Promise.all([
    addTitleToList({ listId: "public-list", titleId: "title-1" }),
    removeTitleFromList({ listId: "public-list", titleId: "title-0" }),
    reorderTitleListItems({ listId: "public-list", itemIds: ["public-item"] }),
    updateTitleList({ listId: "public-list", title: "hijacked", visibility: "PRIVATE" }),
    deleteTitleList({ listId: "public-list" }),
  ]));
  assert.ok(outcomes.every((result) => !result.ok));
  assert.deepEqual(await prisma.titleList.findUniqueOrThrow({ where: { id: original.id } }), original);
  assert.equal(await prisma.titleListItem.count({ where: { listId: original.id } }), 1);
});

test("foreign library entries and protected system-list metadata cannot be changed", async () => {
  assert.equal((await as("visitor", () => updateUserTitle({ titleId: "title-0", rating: 1, note: "hijacked" }))).ok, false);
  assert.equal((await prisma.userTitle.findUniqueOrThrow({ where: { id: "owner-entry" } })).note, "private-review");
  assert.equal((await as("owner", () => deleteTitleList({ listId: "system-list" }))).ok, false);
  assert.equal((await as("owner", () => updateTitleList({ listId: "system-list", title: "hijacked", visibility: "PUBLIC" }))).ok, false);
});

test("private profile payload is hidden from guests/strangers but visible to its owner", async () => {
  for (const actor of [null, "visitor"] as const) {
    const profile = await as(actor, () => getPublicProfileOverview("owner"));
    assert.ok(profile);
    assert.equal(profile.stats, null);
    for (const key of ["posts", "latestReviews", "recentActivityGroups", "recentListActivity"] as const) assert.deepEqual(profile[key], []);
    assert.ok(!JSON.stringify(profile).includes("private-review"));
  }
  const owner = await as("owner", () => getPublicProfileOverview("owner"));
  assert.equal(owner?.stats?.libraryCount, 1);
  assert.equal(owner?.latestReviews.length, 1);
  assert.equal(owner?.posts.length, 2);
  assert.equal(owner?.recentActivityGroups.flatMap((group) => group.events).length, 3);
});

test("all 64 privacy-flag combinations independently gate profile payload and catalog stats", async () => {
  const keys = ["libraryPublic", "reviewsPublic", "statsPublic", "postsPublic", "titleActivityPublic", "listActivityPublic"] as const;
  for (let mask = 0; mask < 64; mask++) {
    const flags = Object.fromEntries(keys.map((key, bit) => [key, Boolean(mask & (1 << bit))]));
    await prisma.user.update({ where: { id: "owner" }, data: flags });
    const profile = await as("visitor", () => getPublicProfileOverview("owner"));
    assert.ok(profile);
    assert.equal(profile.stats !== null, flags.statsPublic, `stats mask ${mask}`);
    assert.equal(profile.latestReviews.length, flags.reviewsPublic ? 1 : 0, `reviews mask ${mask}`);
    assert.equal(profile.posts.length, flags.postsPublic ? (flags.reviewsPublic ? 2 : 1) : 0, `posts mask ${mask}`);
    assert.equal(profile.recentListActivity.length > 0, flags.listActivityPublic, `lists mask ${mask}`);
    const events = profile.recentActivityGroups.flatMap((group) => group.events);
    assert.equal(events.length, flags.titleActivityPublic ? (flags.reviewsPublic ? 3 : 1) : 0, `activity mask ${mask}`);
    if (!flags.reviewsPublic) assert.ok(!JSON.stringify(profile).includes("private-review"));
    const title = await as("visitor", () => getTitleBySlug("fixture-0"));
    assert.ok(title);
    assert.deepEqual(title.stats, { libraryCount: flags.libraryPublic ? 2 : 1,
      ratingCount: flags.reviewsPublic ? 2 : 1, averageRating: flags.reviewsPublic ? 6.5 : 4,
      reviewCount: flags.reviewsPublic ? 2 : 1 });
    assert.equal(title.users.length, flags.reviewsPublic ? 2 : 1);
    assert.equal(title.currentUserTitle, null);
  }
});

test("private lists are absent from queries and cannot be bookmarked by outsiders", async () => {
  assert.equal(await as("visitor", () => getTitleListPage("owner", "private")), null);
  assert.ok(await as("owner", () => getTitleListPage("owner", "private")));
  const publicLists = await as("visitor", () => getPublicTitleLists({}));
  assert.deepEqual(publicLists.lists.map((list) => list.id), ["public-list"]);
  assert.equal((await as("visitor", () => setTitleListSaved({ listId: "private-list", saved: true }))).ok, false);
  assert.equal((await as("visitor", () => setTitleListSaved({ listId: "public-list", saved: true }))).ok, true);
  const visible = await as("visitor", () => getTitleListPage("owner", "public"));
  assert.equal(visible?.items[0].currentUserTitle, null);
  assert.equal(visible?.viewer.completedCount, 0);
  assert.equal(visible?.viewer.averageRating, null);
});

test("private post IDs and private attached reviews cannot be liked or commented on", async () => {
  const denied = await as("visitor", () => Promise.all([
    toggleProfilePostLike({ postId: "plain-post" }),
    toggleProfilePostCommentLike({ commentId: "comment" }),
    createProfilePostComment({ postId: "plain-post", content: "blocked" }),
  ]));
  assert.ok(denied.every((result) => !result.ok));
  assert.equal(await prisma.profilePostLike.count(), 0);
  assert.equal(await prisma.profilePostCommentLike.count(), 0);
  assert.equal(await prisma.profilePostComment.count(), 1);
  await prisma.user.update({ where: { id: "owner" }, data: { postsPublic: true } });
  assert.equal((await as("visitor", () => toggleProfilePostLike({ postId: "review-post" }))).ok, false);
  assert.equal((await as("visitor", () => createProfilePostComment({ postId: "plain-post", content: "allowed" }))).ok, true);
});

test("catalog list stats use public data and owners still receive their own review", async () => {
  const result = await as("visitor", () => getTitles({ query: "Fixture 0" }));
  assert.equal(result.titles.length, 1);
  assert.deepEqual(result.titles[0].stats, { libraryCount: 1, ratingCount: 1, averageRating: 4, reviewCount: 1 });
  assert.ok(!JSON.stringify(result).includes("private-review"));
  const owner = await as("owner", () => getTitleBySlug("fixture-0"));
  assert.equal(owner?.currentUserTitle?.note, "private-review");
  assert.equal(owner?.stats.averageRating, 4);
});

test("catalog scoring persists normalized ranks, clears stale eligibility and preserves user reviews", async () => {
  await prisma.externalTitle.createMany({ data: [
    { titleId: "title-0", provider: "TMDB_MOVIE", externalId: "low", rawData: { vote_count: 150, popularity: 10, vote_average: 7 } },
    { titleId: "title-1", provider: "TMDB_MOVIE", externalId: "high", rawData: { vote_count: 1500, popularity: 100, vote_average: 8 } },
    { titleId: "title-2", provider: "TMDB_MOVIE", externalId: "ineligible", rawData: { vote_count: 10, popularity: 1 } },
  ] });
  await prisma.title.update({ where: { id: "title-2" }, data: { catalogEligible: true, catalogScore: 100 } });
  const original = await prisma.userTitle.findUniqueOrThrow({ where: { id: "owner-entry" } });
  assert.deepEqual(await scoreCatalog(), { sources: 3, eligibleTitles: 2 });
  const titles = await prisma.title.findMany({ where: { id: { in: ["title-0", "title-1", "title-2"] } }, orderBy: { id: "asc" } });
  assert.deepEqual(titles.map((title) => [title.catalogScore, title.catalogEligible]), [[60, true], [100, true], [null, false]]);
  assert.equal((await prisma.externalTitle.findUniqueOrThrow({ where: { provider_externalId: { provider: "TMDB_MOVIE", externalId: "high" } } })).sourceRatingCount, 1500);
  await scoreCatalog();
  assert.deepEqual(await prisma.userTitle.findUniqueOrThrow({ where: { id: original.id } }), original);
});

test("parallel library adds/removes produce one row and exactly one event per change", async () => {
  const adds = await Promise.all(Array.from({ length: 12 }, () => prisma.$transaction((tx) => addLibraryTitle(tx, "visitor", "title-1"), txOptions)));
  assert.equal(adds.filter(Boolean).length, 1);
  assert.equal(await prisma.userTitle.count({ where: { userId: "visitor", titleId: "title-1" } }), 1);
  const removes = await Promise.all(Array.from({ length: 12 }, () => prisma.$transaction((tx) => removeLibraryTitle(tx, "visitor", "title-1"), txOptions)));
  assert.equal(removes.filter(Boolean).length, 1);
  assert.equal(await prisma.activityEvent.count({ where: { userId: "visitor", type: "TITLE_ADDED" } }), 1);
  assert.equal(await prisma.activityEvent.count({ where: { userId: "visitor", type: "TITLE_REMOVED" } }), 1);
});

test("transaction rollback leaves neither a library item nor an orphaned activity event", async () => {
  await assert.rejects(prisma.$transaction(async (tx) => {
    await addLibraryTitle(tx, "visitor", "title-1");
    throw new Error("abort-fixture");
  }), /abort-fixture/);
  assert.equal(await prisma.userTitle.count({ where: { userId: "visitor" } }), 0);
  assert.equal(await prisma.activityEvent.count({ where: { userId: "visitor" } }), 0);
});

test("parallel list appends preserve unique positions and duplicate saves are idempotent", async () => {
  await Promise.all(Array.from({ length: 10 }, (_, index) => prisma.$transaction((tx) => addListTitle(tx, "owner", "public-list", `title-${index + 1}`), txOptions)));
  const items = await prisma.titleListItem.findMany({ where: { listId: "public-list" }, orderBy: { position: "asc" } });
  assert.deepEqual(items.map((item) => item.position), Array.from({ length: 11 }, (_, index) => index));
  const timestamp = (await prisma.titleList.findUniqueOrThrow({ where: { id: "public-list" } })).updatedAt;
  const duplicates = await Promise.all(Array.from({ length: 8 }, () => prisma.$transaction((tx) => addListTitle(tx, "owner", "public-list", "title-1"), txOptions)));
  assert.ok(duplicates.every((result) => result.status === "already-added"));
  assert.equal((await prisma.titleList.findUniqueOrThrow({ where: { id: "public-list" } })).updatedAt.getTime(), timestamp.getTime());
});

async function blockedRace(table: "UserTitle" | "TitleListItem", id: string, operations: (() => Promise<unknown>)[]) {
  let unlock!: () => void;
  let locked!: () => void;
  const gate = new Promise<void>((resolve) => { unlock = resolve; });
  const ready = new Promise<void>((resolve) => { locked = resolve; });
  const blocker = prisma.$transaction(async (tx) => {
    // Identifiers come only from this fixed test-only union, values are parameters.
    if (table === "UserTitle") await tx.$queryRaw`SELECT id FROM "UserTitle" WHERE id = ${id} FOR UPDATE`;
    else await tx.$queryRaw`SELECT id FROM "TitleListItem" WHERE id = ${id} FOR UPDATE`;
    locked();
    await gate;
  }, txOptions);
  await ready;
  const running = operations.map((operation) => operation());
  try {
    const deadline = Date.now() + 5_000;
    let count = 0;
    while (Date.now() < deadline) {
      const [row] = await prisma.$queryRaw<{ count: bigint }[]>`SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`;
      count = Number(row.count);
      if (count >= operations.length) break;
      await delay(10);
    }
    assert.ok(count >= operations.length, "Both requests must overlap while waiting for a real database lock");
  } finally {
    unlock();
    await blocker;
  }
  return Promise.all(running);
}

test("overlapping identical review writes emit one rating/review event", async () => {
  const beforeCount = await prisma.activityEvent.count({ where: { userId: "owner" } });
  await blockedRace("UserTitle", "owner-entry", Array.from({ length: 2 }, () => () => prisma.$transaction(
    (tx) => updateLibraryTitle(tx, "owner", "title-0", { rating: 8, note: "updated-review" }), txOptions)));
  assert.equal(await prisma.activityEvent.count({ where: { userId: "owner" } }), beforeCount + 2);
});

test("overlapping removals of the same list item are both successful", async () => {
  const results = await blockedRace("TitleListItem", "public-item", Array.from({ length: 2 }, () => () =>
    as("owner", () => removeTitleFromList({ listId: "public-list", titleId: "title-0" }))));
  assert.ok(results.every((result) => (result as { ok: boolean }).ok));
  assert.equal(await prisma.titleListItem.count({ where: { listId: "public-list" } }), 0);
});

test("parallel reorders serialize and leave one complete order with unique positions", async () => {
  await prisma.titleListItem.createMany({ data: [
    { id: "item-b", listId: "public-list", titleId: "title-1", position: 1 },
    { id: "item-c", listId: "public-list", titleId: "title-2", position: 2 },
  ] });
  const orders = [["item-c", "item-b", "public-item"], ["item-b", "public-item", "item-c"]];
  const results = await as("owner", () => Promise.all(orders.map((itemIds) => reorderTitleListItems({ listId: "public-list", itemIds }))));
  assert.ok(results.every((result) => result.ok));
  const items = await prisma.titleListItem.findMany({ where: { listId: "public-list" }, orderBy: { position: "asc" } });
  assert.deepEqual(items.map((item) => item.position), [0, 1, 2]);
  assert.ok(orders.some((order) => JSON.stringify(order) === JSON.stringify(items.map((item) => item.id))));
  assert.equal((await as("owner", () => reorderTitleListItems({ listId: "public-list", itemIds: ["public-item"] }))).ok, false);
});

test("mixed library additions and Discover saves keep one entry, event and choice", async () => {
  await Promise.all(Array.from({ length: 10 }, (_, index) => index % 2
    ? as("visitor", async () => {
      assert.equal((await saveDiscoveryTitle({ titleId: "title-1", destination: "library" })).ok, true);
    })
    : prisma.$transaction((tx) => addLibraryTitle(tx, "visitor", "title-1"), txOptions)));
  assert.equal(await prisma.userTitle.count({ where: { userId: "visitor", titleId: "title-1" } }), 1);
  assert.equal(await prisma.activityEvent.count({ where: { userId: "visitor", titleId: "title-1", type: "TITLE_ADDED" } }), 1);
  assert.equal(await prisma.userTitleDiscovery.count({ where: { userId: "visitor", titleId: "title-1", lastAction: "ADDED_TO_LIBRARY" } }), 1);
});

test("parallel Discover list saves create one private system list and one item", async () => {
  const results = await as("visitor", () => Promise.all(Array.from({ length: 8 }, () =>
    saveDiscoveryTitle({ titleId: "title-1", destination: "for-later" }))));
  assert.ok(results.every((result) => result.ok));
  const lists = await prisma.titleList.findMany({ where: { userId: "visitor", systemType: "SAVE_FOR_LATER" }, include: { items: true } });
  assert.equal(lists.length, 1);
  assert.equal(lists[0].visibility, "PRIVATE");
  assert.equal(lists[0].items.length, 1);
  assert.equal(lists[0].items[0].position, 0);
  assert.equal(await prisma.userTitleDiscovery.count({ where: { userId: "visitor", lastAction: "SAVED_FOR_LATER" } }), 1);
});

test("interleaved library adds/removes leave activity consistent with final membership", async () => {
  await Promise.all(Array.from({ length: 12 }, (_, index) => prisma.$transaction((tx) =>
    index % 2 ? removeLibraryTitle(tx, "visitor", "title-1") : addLibraryTitle(tx, "visitor", "title-1"), txOptions)));
  const added = await prisma.activityEvent.count({ where: { userId: "visitor", titleId: "title-1", type: "TITLE_ADDED" } });
  const removed = await prisma.activityEvent.count({ where: { userId: "visitor", titleId: "title-1", type: "TITLE_REMOVED" } });
  assert.equal(added - removed, await prisma.userTitle.count({ where: { userId: "visitor", titleId: "title-1" } }));
});

test("a regular list occupying the system slug is preserved during parallel first saves", async () => {
  await prisma.titleList.create({ data: { id: "reserved-slug", userId: "visitor", title: "My regular list", slug: "saved-for-later", visibility: "PUBLIC" } });
  const results = await as("visitor", () => Promise.all(Array.from({ length: 4 }, () =>
    saveDiscoveryTitle({ titleId: "title-1", destination: "for-later" }))));
  assert.ok(results.every((result) => result.ok));
  const original = await prisma.titleList.findUniqueOrThrow({ where: { id: "reserved-slug" } });
  assert.equal(original.systemType, null);
  assert.equal(original.visibility, "PUBLIC");
  assert.equal(original.title, "My regular list");
  const system = await prisma.titleList.findUniqueOrThrow({ where: { userId_systemType: { userId: "visitor", systemType: "SAVE_FOR_LATER" } } });
  assert.equal(system.slug, "saved-for-later-2");
});

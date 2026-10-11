import assert from "node:assert/strict";
import { test } from "node:test";
import type { Prisma } from "../generated/prisma/client";
import {
  addLibraryTitle,
  removeLibraryTitle,
  updateLibraryTitle,
} from "../lib/library/mutations";
import { addListTitle } from "../lib/title-list/mutations";

function transaction(stubs: object) {
  return { $queryRaw: async () => [], ...stubs } as unknown as Prisma.TransactionClient;
}

test("saving an existing library title leaves its review untouched and emits no event", async () => {
  const tx = transaction({
    userTitle: {
      createMany: async (input: unknown) => {
        assert.deepEqual(input, {
          data: { userId: "owner", titleId: "title" },
          skipDuplicates: true,
        });
        return { count: 0 };
      },
    },
    activityEvent: { create: async () => assert.fail("Unexpected event") },
  });
  assert.equal(await addLibraryTitle(tx, "owner", "title"), false);
});

test("adding a new library title records exactly one addition", async () => {
  const events: unknown[] = [];
  const tx = transaction({
    userTitle: { createMany: async () => ({ count: 1 }) },
    activityEvent: { create: async (input: unknown) => events.push(input) },
  });
  assert.equal(await addLibraryTitle(tx, "owner", "title"), true);
  assert.deepEqual(events, [
    { data: { userId: "owner", titleId: "title", type: "TITLE_ADDED" } },
  ]);
});

test("event failures propagate to the transaction owner", async () => {
  const tx = transaction({
    userTitle: { createMany: async () => ({ count: 1 }) },
    activityEvent: { create: async () => { throw new Error("Event failed"); } },
  });
  await assert.rejects(addLibraryTitle(tx, "owner", "title"), /Event failed/);
});

test("removing a missing library title does not emit a removal", async () => {
  const tx = transaction({
    userTitle: {
      deleteMany: async (input: unknown) => {
        assert.deepEqual(input, { where: { userId: "owner", titleId: "title" } });
        return { count: 0 };
      },
    },
    activityEvent: { create: async () => assert.fail("Unexpected event") },
  });
  assert.equal(await removeLibraryTitle(tx, "owner", "title"), false);
});

test("unchanged ratings and normalized reviews do not duplicate activity", async () => {
  const tx = transaction({
    userTitle: {
      findUnique: async () => ({ rating: 8, note: "Review", title: { slug: "title" } }),
      update: async () => ({}),
    },
    activityEvent: { create: async () => assert.fail("Unexpected event") },
  });
  assert.deepEqual(
    await updateLibraryTitle(tx, "owner", "title", { rating: 8, note: " Review " }),
    { titleSlug: "title" },
  );
});

test("clearing a rating and review records both changes", async () => {
  const events: unknown[] = [];
  const tx = transaction({
    userTitle: {
      findUnique: async () => ({ rating: 8, note: "Review", title: { slug: "title" } }),
      update: async (input: { data: unknown }) => {
        assert.deepEqual(input.data, { rating: null, note: null });
      },
    },
    activityEvent: { create: async (input: unknown) => events.push(input) },
  });
  await updateLibraryTitle(tx, "owner", "title", { rating: null, note: " " });
  assert.deepEqual(events, [
    { data: { userId: "owner", titleId: "title", type: "TITLE_RATED", rating: null } },
    { data: { userId: "owner", titleId: "title", type: "TITLE_REVIEWED", note: null } },
  ]);
});

test("adding to another user's list stops before any item mutation", async () => {
  const tx = transaction({
    $queryRaw: async () => [],
    titleList: {
      findFirst: async (input: { where: unknown }) => {
        assert.deepEqual(input.where, { id: "foreign-list", userId: "owner" });
        return null;
      },
    },
  });
  assert.deepEqual(await addListTitle(tx, "owner", "foreign-list", "title"), {
    status: "list-not-found",
  });
});

test("duplicate list saves preserve the list timestamp and append position", async () => {
  const tx = transaction({
    $queryRaw: async () => [],
    titleList: {
      findFirst: async () => ({ id: "list", slug: "list" }),
      update: async () => assert.fail("Duplicate save must not touch the list"),
    },
    title: { findUnique: async () => ({ slug: "title" }) },
    titleListItem: {
      aggregate: async () => ({ _max: { position: 4 } }),
      createMany: async (input: unknown) => {
        assert.deepEqual(input, {
          data: { listId: "list", titleId: "title", position: 5 },
          skipDuplicates: true,
        });
        return { count: 0 };
      },
    },
  });
  assert.equal((await addListTitle(tx, "owner", "list", "title")).status, "already-added");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { dailySyncPlan } from "../lib/sync/dailyPlan";
import { evaluateSyncHealth } from "../lib/sync/health";
import { cronAuthorized } from "../lib/sync/cronAuth";
import { providerRequest, ProviderError, retryDelay } from "../lib/sync/providerRequest";
import { errorCategory, logError } from "../lib/observability/errors";
import { reportError } from "../lib/observability/monitoring";

test("daily workflow covers all curated pages exactly once", () => {
  const jobs = dailySyncPlan();
  assert.equal(jobs.length, 79);
  assert.equal(new Set(jobs.map(j => `${j.provider}:${j.section}:${j.page}`)).size, jobs.length);
  for (const [provider, count] of Object.entries({ tmdb: 46, rawg: 33, anilist: 0, "google-books": 0, "comic-vine": 0 })) {
    assert.equal(jobs.filter(j => j.provider === provider).length, count);
  }
  assert.equal(jobs.some(j => j.provider === "google-books" || j.provider === "comic-vine"), false);
});

test("AniList requests are disabled before any network call without permission", async () => {
  const original = globalThis.fetch;
  const permission = process.env.ANILIST_API_PERMISSION_CONFIRMED;
  let requests = 0;
  try {
    delete process.env.ANILIST_API_PERMISSION_CONFIRMED;
    globalThis.fetch = async () => { requests++; return Response.json({}); };
    await assert.rejects(providerRequest("AniList", "https://graphql.anilist.co"),
      (error: unknown) => error instanceof ProviderError && error.status === 403 && !error.retryable);
    assert.equal(requests, 0);
    assert.equal(dailySyncPlan().some(job => job.provider === "anilist"), false);
    process.env.ANILIST_API_PERMISSION_CONFIRMED = "true";
    assert.equal(dailySyncPlan().filter(job => job.provider === "anilist").length, 30);
    await providerRequest("AniList", "https://graphql.anilist.co", {}, async () => true);
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = original;
    if (permission === undefined) delete process.env.ANILIST_API_PERMISSION_CONFIRMED;
    else process.env.ANILIST_API_PERMISSION_CONFIRMED = permission;
  }
});

test("persisted Google Books and Comic Vine imports also fail closed", async () => {
  const original = globalThis.fetch;
  const keys = ["GOOGLE_BOOKS_CATALOG_PERMISSION_CONFIRMED", "COMIC_VINE_CATALOG_PERMISSION_CONFIRMED"];
  const previous = keys.map(key => [key, process.env[key]] as const);
  let calls = 0;
  try {
    for (const key of keys) delete process.env[key];
    globalThis.fetch = async () => { calls++; return Response.json({}); };
    for (const provider of ["Google Books", "Comic Vine"]) {
      await assert.rejects(providerRequest(provider, "https://provider.invalid"),
        (error: unknown) => error instanceof ProviderError && error.status === 403);
    }
    assert.equal(calls, 0);
    for (const key of keys) process.env[key] = "true";
    const plan = dailySyncPlan();
    assert.deepEqual(plan.filter(j => j.provider === "google-books" && j.section === "relevance|subject:fiction").map(j => j.page), [0, 1]);
    assert.equal(plan.find(j => j.provider === "comic-vine")?.page, 0);
  } finally {
    globalThis.fetch = original;
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("cron authentication fails closed, including development", () => {
  const original = process.env.CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    assert.equal(cronAuthorized(new Request("http://localhost/api/cron")), false);
    process.env.CRON_SECRET = "test-only-secret";
    for (const value of ["", "Bearer wrong", "test-only-secret"]) {
      assert.equal(cronAuthorized(new Request("http://localhost", { headers: { authorization: value } })), false);
    }
    assert.equal(cronAuthorized(new Request("http://localhost", { headers: { authorization: "Bearer test-only-secret" } })), true);
  } finally { if (original === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = original; }
});

test("health distinguishes fresh, failed, stale, missing and overdue syncs", () => {
  const now = new Date("2026-11-02T12:00:00Z");
  const run = { status: "SUCCESS", startedAt: now, finishedAt: now, heartbeatAt: now };
  assert.equal(evaluateSyncHealth(null, null, now).reason, "never_started");
  assert.equal(evaluateSyncHealth(run, now, now).ok, true);
  assert.equal(evaluateSyncHealth(run, new Date(0), now).reason, "success_overdue");
  assert.equal(evaluateSyncHealth({ ...run, status: "FAILED" }, now, now).ok, false);
  assert.equal(evaluateSyncHealth({ ...run, status: "RUNNING", heartbeatAt: new Date(0) }, now, now).reason, "heartbeat_expired");
  assert.equal(evaluateSyncHealth({ ...run, status: "RUNNING", startedAt: new Date(0) }, now, now).reason, "run_too_long");
});

test("provider honors numeric and HTTP-date Retry-After without leaking URLs or bodies", async () => {
  assert.equal(retryDelay(new Response(null, { headers: { "retry-after": "60" } }), 0), 60_000);
  const now = Date.parse("2026-11-02T00:00:00Z");
  assert.equal(retryDelay(new Response(null, { headers: { "retry-after": "Mon, 02 Nov 2026 00:01:00 GMT" } }), 0, now), 60_000);
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async () => { calls++; return new Response("private body token=secret", { status: 429, headers: { "retry-after": "60" } }); };
    await assert.rejects(providerRequest("TMDB", "https://provider.invalid?api_key=secret", {}, async () => true), (e: unknown) => e instanceof ProviderError && e.status === 429 && e.retryAfterMs === 60_000 && !e.message.includes("secret"));
    assert.equal(calls, 1);
    globalThis.fetch = async () => new Response("private", { status: 401 });
    await assert.rejects(providerRequest("RAWG", "https://provider.invalid", {}, async () => true), (e: unknown) => e instanceof ProviderError && !e.retryable);
  } finally { globalThis.fetch = original; }
});

test("operation events exclude exception messages, nested data and stacks", () => {
  const original = console.error;
  const lines: string[] = [];
  try {
    console.error = (value: string) => { lines.push(value); };
    const error = Object.assign(new Error("postgresql://user:password@host email@example.com"), { code: "P2002", meta: { password: "private" } });
    logError("auth.failure", error);
    const event = JSON.parse(lines[0]);
    assert.equal(event.category, "P2002");
    assert.equal(/password|email|stack|meta/.test(lines[0]), false);
    assert.equal(errorCategory({ code: "secret@email" }), "UnexpectedError");
  } finally { console.error = original; }
});

test("Telegram alerts send only sanitized events and isolate delivery failures", async () => {
  const keys = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "MONITORING_WEBHOOK_URL", "VERCEL_ENV"] as const;
  const saved = keys.map(key => [key, process.env[key]] as const);
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const logs: string[] = [];
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  try {
    process.env.TELEGRAM_BOT_TOKEN = "test-only-token";
    process.env.TELEGRAM_CHAT_ID = "123456";
    process.env.VERCEL_ENV = "production";
    delete process.env.MONITORING_WEBHOOK_URL;
    console.error = (line: string) => { logs.push(line); };
    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
      assert.equal(init?.redirect, "error");
      assert.ok(init?.signal);
      return Response.json({ ok: true });
    };
    await reportError("sync.daily.failed", new Error("private@email.invalid password=db-secret"));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://api.telegram.org/bottest-only-token/sendMessage");
    assert.equal(requests[0].body.chat_id, "123456");
    assert.match(String(requests[0].body.text), /Listiq \[production\]\nsync.daily.failed\nUnexpectedError/);
    assert.doesNotMatch(JSON.stringify(requests[0].body), /private@email|db-secret|test-only-token/);
    globalThis.fetch = async () => { throw new Error("https://api.telegram.org/bottest-only-token/private"); };
    await assert.doesNotReject(reportError("sync.health.database"));
    assert.ok(logs.some(line => line.includes("monitoring.telegram.delivery")));
    assert.doesNotMatch(logs.join("\n"), /test-only-token|db-secret|private@email/);
    globalThis.fetch = async () => Response.json({ ok: false });
    const before = logs.length;
    await reportError("sync.daily.failed");
    assert.ok(logs.slice(before).some(line => line.includes("monitoring.telegram.delivery")));
    delete process.env.TELEGRAM_CHAT_ID;
    globalThis.fetch = async () => { throw new Error("Must not request an incomplete destination"); };
    await reportError("sync.daily.failed");
    assert.ok(logs.some(line => line.includes("monitoring.telegram.configuration")));
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("daily replacements require opt-in and Open Library permission", () => {
  const previous = process.env;
  process.env = { ...previous, CATALOG_REPLACEMENTS_DAILY: "true", OPEN_LIBRARY_CATALOG_PERMISSION_CONFIRMED: "false", OPEN_LIBRARY_CONTACT: "" };
  try {
    const replacements = () => dailySyncPlan().filter(job => job.section === "curated").map(job => job.provider);
    assert.deepEqual(replacements(), ["manga-updates", "wikidata"]);
    process.env.OPEN_LIBRARY_CATALOG_PERMISSION_CONFIRMED = "true";
    assert.deepEqual(replacements(), ["manga-updates", "wikidata"]);
    process.env.OPEN_LIBRARY_CONTACT = "catalog@example.test";
    assert.deepEqual(replacements(), ["manga-updates", "open-library", "wikidata"]);
  } finally { process.env = previous; }
});

test("a retry reserves another request and stops at the quota", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  let reservations = 0;
  try {
    globalThis.fetch = async () => {
      calls++;
      return new Response(null, { status: 429, headers: { "retry-after": "0.001" } });
    };
    await assert.rejects(providerRequest("RAWG", "https://provider.invalid", {}, async () => ++reservations === 1),
      (error: unknown) => error instanceof ProviderError && error.quotaExhausted && !error.retryable);
    assert.equal(calls, 1);
    assert.equal(reservations, 2);
  } finally { globalThis.fetch = original; }
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { assertDemoTarget } from "../lib/demo/guard";
import { catalogSourceLink } from "../lib/catalog/attribution";
import { readFileSync } from "node:fs";
import { GuestRestrictedError } from "../lib/security/guestError";
import { securityErrorMessage } from "../lib/security/errors";

test("demo rejects the production target even when pooling changes the hostname", () => {
  assert.throws(() => assertDemoTarget("postgresql://u:p@ep-example.neon.tech/neondb", "postgresql://u:p@ep-example-pooler.neon.tech/neondb"));
  assert.doesNotThrow(() => assertDemoTarget("postgresql://u:p@localhost:5432/demo", "postgresql://u:p@ep-example.neon.tech/neondb"));
});

test("provider credits reject injected schemes and lookalike hosts", () => {
  assert.equal(catalogSourceLink({ provider: "RAWG", externalId: "1", externalUrl: "javascript:alert(1)" }), null);
  assert.equal(catalogSourceLink({ provider: "RAWG", externalId: "1", externalUrl: "https://rawg.io.attacker.invalid/" }), null);
  assert.equal(catalogSourceLink({ provider: "RAWG", externalId: "1", externalUrl: "https://user:secret@rawg.io/" }), null);
  assert.equal(catalogSourceLink({ provider: "GOOGLE_BOOKS", externalId: "book id", externalUrl: null })?.href, "https://books.google.com/books?id=book%20id");
});

test("guest restrictions surface a readable message instead of a generic failure", () => {
  const message = securityErrorMessage(new GuestRestrictedError("upload files"), "fallback");
  assert.match(message, /^Demo accounts can't upload files\./);
});

test("every entry point that reaches other members or storage keeps its sandbox guard", () => {
  const guarded: Record<string, RegExp> = {
    "lib/security/limits.ts": /isGuest[\s\S]*GuestRestrictedError/,
    "actions/title/createTitleSubmission.ts": /assertNotGuest\(/,
    "actions/submissions/resubmitTitleSubmission.ts": /assertNotGuest\(/,
    "actions/title-list/createTitleList.ts": /isGuestUser\([\s\S]*"PRIVATE"/,
    "actions/title-list/updateTitleList.ts": /isGuestUser\([\s\S]*"PRIVATE"/,
    "actions/profile/updatePrivacySettings.ts": /isGuestUser\(/,
    "actions/auth.ts": /deleteGuestUser\(/,
  };
  for (const [file, pattern] of Object.entries(guarded)) {
    assert.match(readFileSync(file, "utf8"), pattern, file);
  }
});

test("sandbox deletion is scoped to guest accounts", () => {
  const source = readFileSync("lib/demo/guest.ts", "utf8");
  for (const match of source.matchAll(/user\.deleteMany\(\{[\s\S]*?\}\)/g)) {
    assert.match(match[0], /isGuest: true/);
  }
});

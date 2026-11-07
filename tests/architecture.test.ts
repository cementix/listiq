import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

test("domain modules never depend on server-action entry points", () => {
  const files = readdirSync("lib", { recursive: true }).map(String).filter(file => /\.tsx?$/.test(file));
  const forbidden = /(?:from\s*|import\s*\(\s*)["'](?:@\/actions\/|\.\.?\/[^"']*actions\/)/;
  for (const file of files) assert.equal(forbidden.test(readFileSync(path.join("lib", file), "utf8")), false, file);
});

import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";

const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Smoke test requires a local app server");
const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
const username = `smoke_${suffix}`;
const email = `${username}@example.invalid`;
const slug = `neon-smoke-${suffix}`;
const decode = (s: string) => s.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");

try {
  const extensions = await prisma.$queryRaw<Array<{ extname: string }>>`SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'`;
  assert.equal(extensions.length, 1);
  console.log("PASS Neon connection and pg_trgm");

  const page = await fetch(`${base}/register`);
  assert.equal(page.status, 200);
  const html = await page.text();
  const form = new FormData();
  for (const input of html.matchAll(/<input\b[^>]*>/g)) {
    const name = input[0].match(/name="([^"]*)"/)?.[1];
    if (name?.startsWith("$ACTION_")) {
      form.append(decode(name), decode(input[0].match(/value="([^"]*)"/)?.[1] || ""));
    }
  }
  assert.ok([...form.keys()].length > 0, "Registration server action must be present");
  form.set("email", email);
  form.set("username", username);
  form.set("password", randomUUID());
  const registration = await fetch(`${base}/register`, {
    method: "POST", body: form, redirect: "manual", headers: { Origin: base },
  });
  assert.equal(registration.status, 303, "Registration must redirect after writing the user");
  const cookie = registration.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  assert.ok(cookie.includes("session="));
  const user = await prisma.user.findUniqueOrThrow({ where: { email }, include: { titleLists: true } });
  assert.ok(user.titleLists.some(list => list.systemType === "SAVE_FOR_LATER"));
  console.log("PASS HTTP registration -> Neon user and default list -> session cookie");

  const title = await prisma.title.create({ data: { name: `Neon smoke ${suffix}`, slug, type: "GAME", createdById: user.id } });
  await prisma.userTitle.create({ data: { userId: user.id, titleId: title.id, rating: 8 } });
  await prisma.userTitle.update({ where: { userId_titleId: { userId: user.id, titleId: title.id } }, data: { rating: 9 } });
  const library = await prisma.userTitle.findUniqueOrThrow({ where: { userId_titleId: { userId: user.id, titleId: title.id } } });
  assert.equal(library.rating, 9);
  for (const path of ["/dashboard", `/titles/${slug}`]) {
    const response = await fetch(`${base}${path}`, { headers: { Cookie: cookie }, redirect: "manual" });
    assert.equal(response.status, 200, path);
    const body = await response.text();
    assert.ok(!body.includes("something went wrong"), path);
    assert.ok(body.includes(path === "/dashboard" ? username : title.name), `${path} must render database content`);
    console.log(`PASS authenticated HTTP ${path} renders Neon data (200)`);
  }
  console.log("PASS Prisma create/read/update through pooled connection");
} finally {
  await prisma.title.deleteMany({ where: { slug } });
  await prisma.user.deleteMany({ where: { email } });
  assert.equal(await prisma.user.count({ where: { email } }), 0);
  console.log("PASS smoke fixtures deleted");
  await prisma.$disconnect();
}

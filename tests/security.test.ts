import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "../generated/prisma/client";
import { SecurityError, securityErrorMessage } from "../lib/security/errors";
import { consumeRateLimit, rateLimitKey } from "../lib/security/rateLimit";
import { MAX_UPLOAD_BYTES, validateFileSignature, validateUploadFile } from "../lib/uploads/policy";
import { ownedAsset, resolveOwnedImage, resolveOwnedPostMedia } from "../lib/uploads/ownership";
import { postSchema } from "../lib/profile/postValidation";
import type { UploadApiResponse } from "cloudinary";
import { uploadFile, type UploadDependencies } from "../lib/uploads/service";

const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
const image = { imageUrl: "https://res.cloudinary.com/demo/image/upload/asset.png", imagePublicId: "asset" };
const asset = {
  publicId: "asset", userId: "owner", purpose: "image", type: "IMAGE" as const,
  url: image.imageUrl, width: 320, height: 200, bytes: 8, createdAt: new Date(),
};

function database(stubs: object) { return stubs as PrismaClient; }
function assets(records = [asset]) {
  return database({ uploadedAsset: {
    findFirst: async ({ where }: { where: { userId: string; publicId: string; purpose: string } }) =>
      records.find((record) => record.userId === where.userId && record.publicId === where.publicId && record.purpose === where.purpose) ?? null,
  } });
}

test("upload accepts supported non-empty files within the byte limit", () => {
  validateUploadFile(new File([png], "image.png", { type: "image/png" }), "image");
  validateUploadFile(new File([new Uint8Array(MAX_UPLOAD_BYTES)], "video.mp4", { type: "video/mp4" }), "post");
});

test("empty, oversized, SVG and video cover uploads are rejected", () => {
  for (const file of [
    new File([], "empty.png", { type: "image/png" }),
    new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "large.png", { type: "image/png" }),
    new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }),
    new File(["video"], "video.mp4", { type: "video/mp4" }),
  ]) assert.throws(() => validateUploadFile(file, "image"), SecurityError);
});

test("a forged image MIME and a truncated PNG are rejected", () => {
  assert.throws(() => validateFileSignature(new TextEncoder().encode("<script>alert(1)</script>"), "image/png"), SecurityError);
  assert.throws(() => validateFileSignature(png.slice(0, 4), "image/png"), SecurityError);
  validateFileSignature(png, "image/png");
});

test("file signatures cover every allowed media format", () => {
  const fixtures: [string, Uint8Array][] = [
    ["image/jpeg", Uint8Array.from([0xff, 0xd8, 0xff])],
    ["image/gif", new TextEncoder().encode("GIF89a")],
    ["image/webp", new TextEncoder().encode("RIFF0000WEBP")],
    ["video/mp4", new TextEncoder().encode("0000ftypisom")],
    ["video/quicktime", new TextEncoder().encode("0000ftypqt  ")],
    ["video/webm", Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3])],
  ];
  for (const [mime, bytes] of fixtures) validateFileSignature(bytes, mime);
});

test("owned images resolve to recorded URLs and IDs", async () => {
  assert.deepEqual(await resolveOwnedImage(assets(), "owner", image), image);
});

test("another user's upload, an unknown ID and a wrong-purpose upload are rejected", async () => {
  await assert.rejects(resolveOwnedImage(assets(), "intruder", image), /does not belong/);
  await assert.rejects(ownedAsset(assets(), "owner", "missing", "image"), /does not belong/);
  await assert.rejects(ownedAsset(assets(), "owner", "asset", "post"), /does not belong/);
});

test("tampered URLs and incomplete image pairs are rejected", async () => {
  await assert.rejects(resolveOwnedImage(assets(), "owner", { ...image, imageUrl: "https://evil.example/image.png" }), /Invalid image/);
  await assert.rejects(resolveOwnedImage(assets(), "owner", { imageUrl: image.imageUrl }), /together/);
  await assert.rejects(resolveOwnedImage(assets(), "owner", { imagePublicId: image.imagePublicId }), /together/);
});

test("unchanged legacy images and explicit removal need no upload ledger entry", async () => {
  const db = database({ uploadedAsset: { findFirst: async () => assert.fail("Unexpected ownership query") } });
  assert.deepEqual(await resolveOwnedImage(db, "owner", image, image), image);
  assert.deepEqual(await resolveOwnedImage(db, "owner", { imageUrl: "", imagePublicId: "" }), { imageUrl: null, imagePublicId: null });
});

test("changing a legacy image does not bypass ownership checks", async () => {
  await assert.rejects(resolveOwnedImage(assets([]), "owner", image, { ...image, imagePublicId: "legacy" }), /does not belong/);
});

test("post media uses recorded dimensions instead of client values", async () => {
  const db = assets([{ ...asset, purpose: "post" }]);
  const input = { type: "IMAGE" as const, publicId: "asset", url: image.imageUrl, width: 9000, height: 9000 };
  assert.deepEqual(await resolveOwnedPostMedia(db, "owner", [input]), [
    { ...input, width: 320, height: 200 },
  ]);
});

test("post media rejects duplicate IDs, forged types and foreign owners", async () => {
  const db = assets([{ ...asset, purpose: "post" }]);
  const input = { type: "IMAGE" as const, publicId: "asset", url: image.imageUrl, width: 320, height: 200 };
  await assert.rejects(resolveOwnedPostMedia(db, "owner", [input, input]), /Duplicate/);
  await assert.rejects(resolveOwnedPostMedia(db, "owner", [{ ...input, type: "VIDEO" }]), /Invalid media/);
  await assert.rejects(resolveOwnedPostMedia(db, "intruder", [input]), /does not belong/);
});

test("post validation rejects oversized content, excess attachments and missing public IDs", () => {
  const media = { type: "IMAGE", url: image.imageUrl, publicId: "asset", width: 320, height: 200 };
  assert.equal(postSchema.safeParse({ content: "x".repeat(1001) }).success, false);
  assert.equal(postSchema.safeParse({ content: "ok", media: Array(11).fill(media) }).success, false);
  assert.equal(postSchema.safeParse({ content: "ok", media: [{ ...media, publicId: undefined }] }).success, false);
});

const policy = { name: "login", limit: 10, seconds: 900 };

test("rate-limit keys hide identities and isolate scopes", () => {
  const key = rateLimitKey(policy, "private@example.com");
  assert.match(key, /^login:[a-f0-9]{64}$/);
  assert.equal(key.includes("private@example.com"), false);
  assert.notEqual(key, rateLimitKey({ ...policy, name: "upload" }, "private@example.com"));
});

test("an admitted quota uses bound values rather than interpolating the identity in SQL", async () => {
  const db = database({ $queryRaw: async (sql: TemplateStringsArray, ...values: unknown[]) => {
    assert.deepEqual(values, [rateLimitKey(policy, "owner"), 900, 10]);
    assert.equal(sql.join("").includes("owner"), false);
    return [{ count: 1 }];
  } });
  await consumeRateLimit(db, policy, "owner");
});

test("exhausted quotas block and database outages fail closed", async () => {
  await assert.rejects(consumeRateLimit(database({ $queryRaw: async () => [] }), policy, "owner"), /Too many attempts/);
  await assert.rejects(consumeRateLimit(database({ $queryRaw: async () => { throw new Error("database unavailable"); } }), policy, "owner"), /database unavailable/);
});

test("only intentional security messages are exposed to clients", () => {
  assert.equal(securityErrorMessage(new Error("api_secret=private"), "Upload failed"), "Upload failed");
  assert.equal(securityErrorMessage(new SecurityError("File is too large"), "Upload failed"), "File is too large");
});

function uploadDependencies(overrides: Partial<UploadDependencies> = {}): UploadDependencies {
  return {
    authenticate: async () => "owner",
    consumeQuota: async () => {},
    upload: async () => ({ resource_type: "image", public_id: "asset", secure_url: image.imageUrl, width: 320, height: 200, bytes: 8 }) as UploadApiResponse,
    save: async (data) => data,
    remove: async () => {},
    ...overrides,
  };
}

function imageForm() {
  const form = new FormData();
  form.set("file", new File([png], "image.png", { type: "image/png" }));
  return form;
}

test("anonymous uploads stop before quota consumption, Cloudinary or persistence", async () => {
  const deps = uploadDependencies({
    authenticate: async () => { throw new Error("Unauthorized"); },
    consumeQuota: async () => assert.fail("Unexpected quota consumption"),
    upload: async () => assert.fail("Unexpected upload"),
    save: async () => assert.fail("Unexpected save"),
  });
  await assert.rejects(uploadFile(deps, imageForm(), "image"), /Unauthorized/);
});

test("quota exhaustion stops before sending any bytes to Cloudinary", async () => {
  const deps = uploadDependencies({
    consumeQuota: async () => { throw new SecurityError("Too many attempts"); },
    upload: async () => assert.fail("Unexpected upload"),
    save: async () => assert.fail("Unexpected save"),
  });
  await assert.rejects(uploadFile(deps, imageForm(), "image"), /Too many attempts/);
});

test("forged file content stops before Cloudinary even with a valid declared MIME", async () => {
  const form = new FormData();
  form.set("file", new File(["<script/>"], "image.png", { type: "image/png" }));
  await assert.rejects(uploadFile(uploadDependencies({
    upload: async () => assert.fail("Unexpected upload"),
  }), form, "image"), /does not match/);
});

test("successful uploads record the authenticated owner and provider metadata", async () => {
  let saved = false;
  await uploadFile(uploadDependencies({ save: async (data) => {
    assert.deepEqual(data, {
      userId: "owner", purpose: "image", bytes: 8,
      type: "IMAGE", publicId: "asset", url: image.imageUrl, width: 320, height: 200,
    });
    saved = true;
    return data;
  } }), imageForm(), "image");
  assert.equal(saved, true);
});

test("persistence failures trigger deletion of the untracked Cloudinary asset", async () => {
  const removed: unknown[] = [];
  await assert.rejects(uploadFile(uploadDependencies({
    save: async () => { throw new Error("database unavailable"); },
    remove: async (...args) => { removed.push(args); },
  }), imageForm(), "image"), /database unavailable/);
  assert.deepEqual(removed, [["asset", "image"]]);
});

test("oversized media dimensions are removed without creating an ownership record", async () => {
  const deps = uploadDependencies();
  const upload = deps.upload;
  let removed = false;
  deps.upload = async (...args) => ({ ...await upload(...args), width: 10000, height: 10000 });
  deps.save = async () => assert.fail("Unexpected save");
  deps.remove = async () => { removed = true; };
  await assert.rejects(uploadFile(deps, imageForm(), "image"), /Invalid media/);
  assert.equal(removed, true);
});

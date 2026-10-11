import "server-only";

import { isIP } from "node:net";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "./rateLimit";

export async function limitAuth(action: "login" | "register", email: string) {
  // Only trust the platform-provided header on Vercel. Local/self-hosted
  // requests share a fallback bucket rather than trusting a spoofable header.
  const requestHeaders = await headers();
  const candidate = process.env.VERCEL === "1"
    ? requestHeaders.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : undefined;
  const ip = candidate && isIP(candidate) ? candidate : "shared";
  await consumeRateLimit(prisma, {
    name: `auth:${action}:ip`,
    limit: action === "login" ? 20 : 5,
    seconds: action === "login" ? 900 : 3600,
  }, ip);
  if (action === "login") {
    await consumeRateLimit(prisma, {
      name: "auth:login:account", limit: 10, seconds: 900,
    }, email.trim().toLowerCase());
  }
}

export async function limitUser(action: "upload" | "post" | "comment" | "account", userId: string) {
  await consumeRateLimit(prisma, {
    name: action, limit: action === "account" ? 10 : action === "post" ? 10 : action === "comment" ? 30 : 20,
    seconds: action === "account" ? 900 : 600,
  }, userId);
  if (action === "upload") {
    await consumeRateLimit(prisma, { name: "upload:daily", limit: 100, seconds: 86400 }, userId);
  }
}

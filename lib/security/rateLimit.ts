import "server-only";

import { createHash } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { SecurityError } from "./errors";

export type RateLimitPolicy = { name: string; limit: number; seconds: number };
type RateLimitDatabase = Pick<PrismaClient, "$queryRaw">;

export function rateLimitKey(policy: RateLimitPolicy, identity: string) {
  return `${policy.name}:${createHash("sha256").update(identity).digest("hex")}`;
}

// One atomic statement: concurrent requests and separate serverless instances
// share the same counter. Blocked attempts cannot keep extending the window.
export async function consumeRateLimit(
  db: RateLimitDatabase,
  policy: RateLimitPolicy,
  identity: string,
) {
  const key = rateLimitKey(policy, identity);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt")
    VALUES (${key}, 1, CURRENT_TIMESTAMP + ${policy.seconds} * INTERVAL '1 second')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."expiresAt" <= CURRENT_TIMESTAMP
        THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateLimitBucket"."expiresAt" <= CURRENT_TIMESTAMP
        THEN EXCLUDED."expiresAt" ELSE "RateLimitBucket"."expiresAt" END
    WHERE "RateLimitBucket"."expiresAt" <= CURRENT_TIMESTAMP
      OR "RateLimitBucket"."count" < ${policy.limit}
    RETURNING "count"
  `;
  if (!rows.length) {
    throw new SecurityError("Too many attempts. Please try again later.");
  }
}

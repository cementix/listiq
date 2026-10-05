"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserServer } from "@/lib/auth/guards";
import type { ActionResult } from "@/actions/types";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("username"),
    currentPassword: z.string().min(1),
    username: z
      .string()
      .trim()
      .min(3)
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscore"),
  }),
  z.object({
    kind: z.literal("password"),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1),
  }),
]);

export async function updateAccountSecurity(
  input: z.input<typeof schema>,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const account = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, email: true, passwordHash: true },
    });

    if (!account) return { ok: false, error: "Account not found" };

    const passwordValid = await bcrypt.compare(
      parsed.data.currentPassword,
      account.passwordHash,
    );

    if (!passwordValid) {
      return { ok: false, error: "Current password is incorrect" };
    }

    if (parsed.data.kind === "username") {
      const username = parsed.data.username;
      if (username === account.username) {
        return { ok: true, message: "Username unchanged" };
      }

      await prisma.user.update({
        where: { id: session.userId },
        data: { username },
      });

      await createSession({
        userId: session.userId,
        username,
        email: account.email,
      });

      revalidatePath(`/users/${account.username}`);
      revalidatePath(`/users/${username}`);
      revalidatePath("/lists");
      revalidatePath("/my-lists");

      return { ok: true, message: "Username updated" };
    }

    if (parsed.data.newPassword !== parsed.data.confirmPassword) {
      return { ok: false, error: "New passwords do not match" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash },
    });

    return { ok: true, message: "Password updated" };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Username is already taken" };
    }

    console.error("updateAccountSecurity error:", error);
    return { ok: false, error: "Failed to update account" };
  }
}

"use server";

import { logError } from "@/lib/observability/errors";

import { createSession, deleteSession } from "@/lib/session";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ensureSaveForLaterList } from "../lib/title-list/ensureSaveForLaterList";
import { limitAuth } from "@/lib/security/limits";
import { securityErrorMessage } from "@/lib/security/errors";

const registerSchema = z.object({
  email: z.email().trim().toLowerCase(),
  username: z
    .string()
    .trim()
    .min(3, "username must be at least 3 characters")
    .max(20, "username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "username can contain only letters, numbers and underscore",
    ),
  password: z.string().min(6, "password must be at least 6 characters").refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72, "password must be at most 72 bytes",
  ),
});

const loginSchema = z.object({
  email: z.email("invalid email").trim().toLowerCase(),
  password: z.string().min(1, "password is required").max(1024, "password is too long"),
});

export type AuthState = {
  ok: boolean;
  error?: string;
  success?: string;
};

export async function registerUser(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || "invalid fields",
    };
  }

  const { email, username, password } = parsed.data;

  try {
    await limitAuth("register", email);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return {
        ok: false,
        error: "user with this username or email already exists",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
        },
      });

      await ensureSaveForLaterList(createdUser.id, tx);

      return createdUser;
    });

    await createSession({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const cookieStore = await cookies();
    cookieStore.set("flash", "registration-success", {
      path: "/",
      httpOnly: false,
      maxAge: 10,
    });
  } catch (error) {
    logError("actions.auth", error);

    return {
      ok: false,
      error: securityErrorMessage(error, "something went wrong"),
    };
  }

  redirect("/dashboard");
}
export async function loginUser(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message || "invalid fields",
      };
    }

    const { email, password } = parsed.data;
    await limitAuth("login", email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return {
        ok: false,
        error: "invalid email or password",
      };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return {
        ok: false,
        error: "invalid email or password",
      };
    }

    await createSession({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const cookieStore = await cookies();
    cookieStore.set("flash", "login-success", {
      path: "/",
      httpOnly: false,
      maxAge: 10,
    });
  } catch (error) {
    logError("actions.auth");

    return {
      ok: false,
      error: securityErrorMessage(error, "something went wrong"),
    };
  }

  redirect("/dashboard");
}

export async function logoutUser() {
  await deleteSession();
  redirect("/login");
}

"use server";

import { createSession, deleteSession, getSession } from "@/lib/session";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { redirect } from "next/navigation";

export async function requireGuest() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  } else {
    return session;
  }
}

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
  password: z.string().min(6, "password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.email("invalid email").trim().toLowerCase(),
  password: z.string().min(1, "password is required"),
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

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
    });

    await createSession({
      userId: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("registerUser error:", error);

    return {
      ok: false,
      error: "something went wrong",
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

    redirect("/dashboard");
  } catch (error: any) {
    console.error("loginUser error: ", error.message);

    return {
      ok: false,
      error: "something went wrong",
    };
  }
}

export async function logoutUser() {
  await deleteSession();
  redirect("/login");
}

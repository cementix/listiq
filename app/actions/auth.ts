"use server";

import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

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

export type RegisterState = {
  ok: boolean;
  error?: string;
  success?: string;
};

export async function registerUser(
  prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  try {
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

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email, username }],
      },
    });

    if (existingUser) {
      return {
        ok: false,
        error: "user with this username or email already exists",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
    });

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,
      error: "something went wrong",
    };
  }
}

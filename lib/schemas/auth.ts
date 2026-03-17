import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().trim().toLowerCase(),
  username: z
    .string()
    .trim()
    .min(3, "username must be at least 3 characters long")
    .max(20, "username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "username can contain only letters, numbers and underscore",
    ),
  password: z.string().min(6, "password must be at least 6 characters"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

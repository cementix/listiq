"use server";

import { logError } from "@/lib/observability/errors";

import { z } from "zod";
import type { ActionResult } from "../types";
import { requireUserServer } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { generateUniqueTitleListSlug } from "@/lib/title-list/generateUniqueTitleListSlug";
import { revalidateListViews } from "@/lib/cache/revalidateViews";

const createTitleListSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "List title is required")
    .max(80, "List title has to be 80 characters or less"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

type CreateTitleListInput = z.infer<typeof createTitleListSchema>;

export async function createTitleList(
  input: CreateTitleListInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const parsed = createTitleListSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid list data",
      };
    }

    const { title, description, visibility } = parsed.data;

    await prisma.$transaction(async (tx) => {
      const slug = await generateUniqueTitleListSlug(session.userId, title, tx);

      await tx.titleList.create({
        data: {
          userId: session.userId,
          title,
          description: description || null,
          visibility,
          slug,
        },
      });
    });

    revalidateListViews();

    return {
      ok: true,
      message: "List created",
    };
  } catch (error) {
    logError("actions.title-list.createTitleList", error);

    return {
      ok: false,
      error: "Failed to create list",
    };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { canCreateTitle } from "./canCreateTitle";
import { generateUniqueSlug } from "./generateUniqueSlug";
import { ActionResult, CreateTitleInput } from "./types";
import { validateCreateInput } from "./validateCreateInput";
import { validateGenreIds } from "./validateGenresId";
import { normalizeString } from "./normalizeString";
import { revalidatePath } from "next/cache";

export async function createTitle(
  data: CreateTitleInput,
): Promise<ActionResult> {
  try {
    const { user, session } = await requireUserServer();

    if (!canCreateTitle(user.role)) {
      return { ok: false, error: "Forbidden" };
    }

    const validationError = validateCreateInput(data);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const genresValid = await validateGenreIds(data.genresIds);
    if (!genresValid) {
      return { ok: false, error: "Invalid genres" };
    }

    const slug = await generateUniqueSlug(data.name);

    await prisma.title.create({
      data: {
        name: data.name.trim(),
        slug,
        year: data.year ?? null,
        description: normalizeString(data.description),
        imageUrl: normalizeString(data.imageUrl),
        imagePublicId: normalizeString(data.imagePublicId),
        type: data.type,
        createdById: session.userId,
        genres: {
          connect: data.genresIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/titles");
    revalidatePath("/");

    return { ok: true, message: "Title created" };
  } catch (error) {
    console.error("createTitle error: ", error);
    return { ok: false, error: "Failed to create title" };
  }
}

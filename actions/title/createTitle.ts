"use server";

import { logError } from "@/lib/observability/errors";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "@/lib/auth/guards";
import { canCreateTitle } from "./canCreateTitle";
import { generateUniqueSlug } from "@/lib/title/generateUniqueSlug";
import { CreateTitleInput } from "./types";
import { validateCreateInput } from "./validateCreateInput";
import { validateGenreIds } from "./validateGenresId";
import { normalizeString } from "./normalizeString";
import { revalidateCatalogViews } from "@/lib/cache/revalidateViews";
import type { ActionResult } from "../types";
import { resolveOwnedImage } from "@/lib/uploads/ownership";
import { securityErrorMessage } from "@/lib/security/errors";

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
    const image = await resolveOwnedImage(prisma, session.userId, data);

    await prisma.title.create({
      data: {
        name: data.name.trim(),
        slug,
        year: data.year ?? null,
        description: normalizeString(data.description),
        ...image,
        type: data.type,
        createdById: session.userId,
        genres: {
          connect: data.genresIds.map((id) => ({ id })),
        },
      },
    });

    revalidateCatalogViews();

    return { ok: true, message: "Title created" };
  } catch (error) {
    logError("actions.title.createTitle", error);
    return { ok: false, error: securityErrorMessage(error, "Failed to create title") };
  }
}

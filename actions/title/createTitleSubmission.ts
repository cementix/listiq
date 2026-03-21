"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { ActionResult, CreateTitleInput } from "./types";
import { validateCreateInput } from "./validateCreateInput";
import { validateGenreIds } from "./validateGenresId";
import { normalizeString } from "./normalizeString";
import { revalidatePath } from "next/cache";

export async function createTitleSubmission(
  data: CreateTitleInput,
): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();

    const validationError = validateCreateInput(data);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const genresValid = await validateGenreIds(data.genresIds);
    if (!genresValid) {
      return { ok: false, error: "Invalid genres" };
    }

    await prisma.titleSubmission.create({
      data: {
        name: data.name.trim(),
        year: data.year ?? null,
        description: normalizeString(data.description),
        imageUrl: normalizeString(data.imageUrl),
        imagePublicId: normalizeString(data.imagePublicId),
        type: data.type,
        submittedById: session.userId,
        genres: {
          connect: data.genresIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/submissions");
    return { ok: true, message: "submission created" };
  } catch (error) {
    console.error("createTitleSubmission error: ", error);
    return { ok: false, error: "Failed to create submission" };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { CreateTitleInput } from "../title/types";
import { validateCreateInput } from "../title/validateCreateInput";
import { validateGenreIds } from "../title/validateGenresId";
import { canEditSubmissionStatus } from "./submissionStatus";
import { normalizeString } from "../title/normalizeString";
import { SubmissionStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { ActionResult } from "../types";

export async function resubmitTitleSubmission(
  submissionId: string,
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

    const submission = await prisma.titleSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        submittedById: true,
      },
    });

    if (!submission) {
      return { ok: false, error: "Submission not found" };
    }

    if (submission.submittedById !== session.userId) {
      return { ok: false, error: "Forbidden" };
    }

    if (!canEditSubmissionStatus(submission.status)) {
      return { ok: false, error: "Submission can not be edited" };
    }

    await prisma.titleSubmission.update({
      where: { id: submission.id },
      data: {
        name: data.name.trim(),
        year: data.year ?? null,
        description: normalizeString(data.description),
        imageUrl: normalizeString(data.imageUrl),
        imagePublicId: normalizeString(data.imagePublicId),
        type: data.type,
        status: SubmissionStatus.RESUBMITTED,
        reviewComment: null,
        reviewedById: null,
        genres: {
          set: data.genresIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/my-submissions");
    revalidatePath("/submissions");
    revalidatePath("/dashboard");

    return { ok: true, message: "Submission sent for review again" };
  } catch (error) {
    console.error("resubmitTitleSubmission error: ", error);
    return { ok: false, error: "Failed to resubmit title" };
  }
}

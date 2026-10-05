"use server";

import { revalidatePath } from "next/cache";

import { SubmissionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

import { requireUserServer } from "@/lib/auth/guards";
import { generateUniqueSlug } from "../title/generateUniqueSlug";
import { normalizeString } from "../title/normalizeString";
import { canReviewSubmissions } from "./canReviewSubmissions";
import { isReviewableSubmissionStatus } from "./submissionStatus";
import type { ActionResult } from "../types";

export async function approveTitleSubmission(
  submissionId: string,
  reviewComment: string,
): Promise<ActionResult> {
  try {
    const { user, session } = await requireUserServer();

    if (!canReviewSubmissions(user.role)) {
      return { ok: false, error: "Forbidden" };
    }

    const submission = await prisma.titleSubmission.findUnique({
      where: { id: submissionId },
      include: {
        genres: {
          select: { id: true },
        },
      },
    });

    if (!submission) {
      return { ok: false, error: "Submission not found" };
    }

    if (!isReviewableSubmissionStatus(submission.status)) {
      return { ok: false, error: "Submission is not reviewable" };
    }

    const slug = await generateUniqueSlug(submission.name);

    await prisma.$transaction(async (tx) => {
      await tx.title.create({
        data: {
          name: submission.name,
          slug,
          year: submission.year,
          description: submission.description,
          imageUrl: submission.imageUrl,
          imagePublicId: submission.imagePublicId,
          type: submission.type,
          createdById: submission.submittedById,
          genres: {
            connect: submission.genres.map((genre) => ({ id: genre.id })),
          },
        },
      });

      await tx.titleSubmission.update({
        where: { id: submission.id },
        data: {
          status: SubmissionStatus.APPROVED,
          reviewedById: session.userId,
          reviewComment: normalizeString(reviewComment),
        },
      });
    });

    revalidatePath("/submissions");
    revalidatePath("/my-submissions");
    revalidatePath("/titles");

    return { ok: true, message: "Submission approved" };
  } catch (error) {
    console.error("approveTitleSubmission error: ", error);
    return { ok: false, error: "Failed to approve submission" };
  }
}

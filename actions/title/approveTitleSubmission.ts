"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { canCreateTitle } from "./canCreateTitle";
import { ActionResult } from "./types";
import { SubmissionStatus } from "@/generated/prisma/enums";
import { generateUniqueSlug } from "./generateUniqueSlug";
import { revalidatePath } from "next/cache";

export async function approveTitleSubmission(
  submissionId: string,
  reviewComment: string,
): Promise<ActionResult> {
  try {
    const { user, session } = await requireUserServer();

    if (!canCreateTitle(user.role)) {
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

    if (!submission) return { ok: false, error: "Submission not found" };

    if (submission.status !== SubmissionStatus.PENDING) {
      return { ok: false, error: "Submission already reviewed" };
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
          createdById: session.userId,
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
          reviewComment,
        },
      });
    });

    revalidatePath("/submissions");
    revalidatePath("/titles");

    return { ok: true, message: "Submission approved" };
  } catch (error) {
    console.error("approveTitleSubmission error: ", error);
    return { ok: false, error: "Failed to approve submission" };
  }
}

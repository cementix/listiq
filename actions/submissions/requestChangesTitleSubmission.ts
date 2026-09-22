"use server";

import { revalidatePath } from "next/cache";

import { SubmissionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

import { requireUserServer } from "../auth";
import { normalizeString } from "../title/normalizeString";
import { canReviewSubmissions } from "./canReviewSubmissions";
import { isReviewableSubmissionStatus } from "./submissionStatus";
import type { ActionResult } from "../types";

export async function requestChangesTitleSubmission(
  submissionId: string,
  reviewComment: string,
): Promise<ActionResult> {
  try {
    const { user, session } = await requireUserServer();

    if (!canReviewSubmissions(user.role)) {
      return { ok: false, error: "Forbidden" };
    }

    const comment = normalizeString(reviewComment);

    if (!comment) {
      return { ok: false, error: "Review comment is required" };
    }

    const submission = await prisma.titleSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true },
    });

    if (!submission) {
      return { ok: false, error: "Submission not found" };
    }

    if (!isReviewableSubmissionStatus(submission.status)) {
      return { ok: false, error: "Submission is not reviewable" };
    }

    await prisma.titleSubmission.update({
      where: { id: submission.id },
      data: {
        status: SubmissionStatus.NEEDS_CHANGES,
        reviewedById: session.userId,
        reviewComment: comment,
      },
    });

    revalidatePath("/submissions");
    revalidatePath("/my-submissions");
    revalidatePath("/dashboard");

    return { ok: true, message: "Changes requested" };
  } catch (error) {
    console.error("requestChangesTitleSubmission error ", error);
    return { ok: false, error: "Failed to request changes" };
  }
}

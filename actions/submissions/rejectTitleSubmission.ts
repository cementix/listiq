"use server";

import { revalidatePath } from "next/cache";

import { SubmissionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

import { requireUserServer } from "../auth";
import { normalizeString } from "../title/normalizeString";
import { ActionResult } from "../title/types";
import { canReviewSubmissions } from "./canReviewSubmissions";
import { isReviewableSubmissionStatus } from "./submissionStatus";

export async function rejectTitleSubmission(
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
        status: SubmissionStatus.REJECTED,
        reviewedById: session.userId,
        reviewComment: normalizeString(reviewComment),
      },
    });

    revalidatePath("/submissions");
    revalidatePath("/my-submissions");

    return { ok: true, message: "Submission rejected" };
  } catch (error) {
    console.error("rejectTitleSubmission error: ", error);
    return { ok: false, error: "Failed to reject submission" };
  }
}

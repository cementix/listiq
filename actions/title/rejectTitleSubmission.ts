"use server";

import { prisma } from "@/lib/prisma";
import { requireUserServer } from "../auth";
import { canCreateTitle } from "./canCreateTitle";
import { ActionResult } from "./types";
import { SubmissionStatus } from "@/generated/prisma/enums";
import { normalizeString } from "./normalizeString";
import { revalidatePath } from "next/cache";

export async function rejectTitleSubmission(
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
      select: { id: true, status: true },
    });

    if (!submission) return { ok: false, error: "Submission not found" };

    if (submission.status !== SubmissionStatus.PENDING) {
      return { ok: false, error: "Submission already reviewed" };
    }

    await prisma.titleSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.REJECTED,
        reviewedById: session.userId,
        reviewComment: normalizeString(reviewComment),
      },
    });

    revalidatePath("/submissions");

    return { ok: true, message: "Submission rejected" };
  } catch (error) {
    console.error("rejectTitleSubmission error: ", error);
    return { ok: false, error: "Failed to reject submission" };
  }
}

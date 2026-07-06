import { SubmissionStatus } from "@/generated/prisma/enums";

export function isReviewableSubmissionStatus(status: SubmissionStatus) {
    return (
        status === SubmissionStatus.PENDING ||
        status === SubmissionStatus.RESUBMITTED
    )
}

export function canEditSubmissionStatus(status: SubmissionStatus) {
    return status === SubmissionStatus.NEEDS_CHANGES
}
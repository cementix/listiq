'use server'

import { prisma } from "@/lib/prisma"
import { requireUserServer } from "../auth"
import { SubmissionStatus } from "@/generated/prisma/enums"

export async function getNeedsChangesSubmissionsCount() {
    const {session} = await requireUserServer()

    return prisma.titleSubmission.count({
        where: {
            submittedById: session.userId,
            status: SubmissionStatus.NEEDS_CHANGES
        }
    })
}
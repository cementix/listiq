"use server"

import { prisma } from "@/lib/prisma"
import { requireUserServer } from "../auth"
import { canReviewSubmissions } from "./canReviewSubmissions"

export async function getSubmissionsForReview() {
    const {user} = await requireUserServer()

    if (!canReviewSubmissions(user.role)) {
        throw new Error("Forbidden")
    }

    return prisma.titleSubmission.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            submittedBy: {
                select: {
                    id: true,
                    username: true
                }
            },
            reviewedBy: {
                select: {
                    id: true,
                    username: true
                }
            },
            genres: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            }
        }
    })
}
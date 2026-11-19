"use server";

import { requireUserServer } from "@/lib/auth/guards";
import { logError } from "@/lib/observability/errors";
import { prisma } from "@/lib/prisma";

export type NotificationItem = {
  id: string;
  type: "PROFILE_POST_COMMENT" | "PROFILE_POST_REPLY" | "PROFILE_POST_COMMENT_LIKE";
  actor: { username: string; avatarUrl: string | null };
  href: string;
  snippet: string | null;
  createdAt: string;
  unread: boolean;
};

/** The signed-in member's latest notifications, newest first. */
export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const { session } = await requireUserServer();
    const rows = await prisma.notification.findMany({
      where: { recipientId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        readAt: true,
        createdAt: true,
        postId: true,
        actor: { select: { username: true, avatarUrl: true } },
        post: { select: { author: { select: { username: true } } } },
        comment: { select: { content: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      actor: row.actor,
      href: row.post ? `/users/${row.post.author.username}${row.postId ? `#post-${row.postId}` : ""}` : `/users/${session.username}`,
      snippet: row.comment?.content ? row.comment.content.slice(0, 120) : null,
      createdAt: row.createdAt.toISOString(),
      unread: row.readAt === null,
    }));
  } catch (error) {
    logError("actions.notifications.getNotifications", error);
    return [];
  }
}

/** Marks every unread notification of the signed-in member as read. */
export async function markNotificationsRead(): Promise<void> {
  try {
    const { session } = await requireUserServer();
    await prisma.notification.updateMany({
      where: { recipientId: session.userId, readAt: null },
      data: { readAt: new Date() },
    });
  } catch (error) {
    logError("actions.notifications.markNotificationsRead", error);
  }
}
